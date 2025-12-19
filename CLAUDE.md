# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dash-Plus Notes is a graph-based task management system with two distinct implementations:

1. **Single-file HTML application** (`index.html`) - Complete standalone app with inline JavaScript, uses Tailwind CDN, stores data in browser localStorage
2. **Modular JavaScript library** (`src/` directory) - Reusable modules designed to mirror future REST API, ready for Node.js + SQL backend migration

These are **independent implementations** that share the same data model concepts but operate separately. The HTML app is production-ready for deployment. The modular library is a POC/reference implementation for future backend work.

## Core Architecture Concepts

### Dual Implementation Pattern

**HTML Application (`index.html`):**
- Self-contained single-file app (172KB)
- All state management, rendering, and business logic inline
- Direct DOM manipulation with no framework
- localStorage persistence with `dashPlus` state object
- Includes: task management, RAID tracking, Eisenhower Matrix, floating UI panels, keyboard shortcuts
- Ready to deploy to static hosting (tiiny.host, GitHub Pages, etc.)

**Modular Library (`src/`):**
- Separated concerns: storage layer, graph queries, utilities
- Designed to be drop-in replaceable with backend API
- Uses `dashplus:*` prefixed localStorage keys (different from HTML app)
- Export classes: `TaskStore`, `ProjectStore`, `LinkStore`, `GraphQueries`, `parseNaturalDate`

### Data Model - Three Entity Types

The system uses **typed task entities** via a `type` field, not separate collections:

1. **Regular tasks** (`type: 'task'` or undefined) - Standard to-dos
2. **RAID items** (`type: 'risk' | 'assumption' | 'issue' | 'dependency'`) - Project management entities with additional fields:
   - Risks: `likelihood`, `impact`, `mitigation`
   - Assumptions: `validated`, `validationCriteria`
   - Issues: `severity`, `resolution`
   - Dependencies: `externalParty`, `expectedDate`

All tasks share the same base properties regardless of type, making status transitions and filtering unified.

### Graph Relationship System

Tasks are nodes, links are edges:

- **Link types**: `waiting`, `delegated`, `references`, `moved`, `blocks`, `related`
- **Direction matters**: `blocks` vs `blocked-by` are stored as directional relationships
- **Graph traversal**: `GraphQueries.getBacklinks()`, `getForwardLinks()`, `detectCycles()`, `getBlockingChain()`
- **Cycle detection**: Prevents circular dependencies, returns paths if cycles found
- **Task importance**: PageRank-like algorithm based on link count and types

### Status System - Dash-Plus Notation

Symbol-based workflow with two terminology systems:

**Dash-Plus symbols** (default):
- `-` Active (new task or undone action item)
- `+` Done (task complete or cancelled)
- `→` Waiting (blocked by external factor)
- `←` Delegated (assigned to someone else)
- `Δ` Reference (data point, no longer actionable)

**5D System** (toggle in UI):
- Same statuses, different labels: Do, Done, Defer, Delegate, Designate

**Critical**: When changing status away from `delegated` or `waiting`, clear the `delegatedTo` and `waitingOn` fields. The `toggleSelectedDone()` and `cycleStatus()` functions implement this.

### Inline Editing Pattern

Double-click any field to edit in place:
- Creates inline `<input>` or `<textarea>` element
- Autocomplete for `delegatedTo` and `waitingOn` fields pulls from existing values
- State tracks: `editingTaskId`, `editingField` (content, dueDate, delegatedTo, waitingOn, notes)
- Blur or Enter commits, Escape cancels
- Rendering is idempotent - re-render after every state change

### UI View Modes

Three distinct view layouts:

1. **List View** - Default task list with inline editing
2. **Matrix View** - Eisenhower Matrix (Urgent/Important 2x2 grid), drag-drop to change priority
3. **RAID View** - Specialized layout for Risk/Assumption/Issue/Dependency tracking with risk matrix

State: `state.showMatrixView`, `state.showRaidView` (mutually exclusive booleans)

## Development Commands

```bash
# Install dependencies
npm install

# Run tests (Vitest)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test -- --coverage

# Start dev server (Vite) - for developing modular library
npm run dev

# Build (Vite) - bundles modular library
npm run build

# Lint
npm run lint

# Format
npm run format
```

### Running Single Tests

```bash
# Run specific test file
npm test tests/localStorage.test.js

# Run specific test file in watch mode
npm test tests/graphQueries.test.js -- --watch

# Run tests matching pattern
npm test -- --grep "natural date"
```

## Working with the HTML Application

The `index.html` file is the **primary deliverable**. When modifying:

1. **Read the entire file first** - It's large (172KB) but self-contained
2. **Key sections** (approximate line numbers, may shift):
   - Lines 1-550: State initialization, constants (SYMBOLS, TERMINOLOGY, LINK_TYPES)
   - Lines 550-1500: Core functions (save, load, createTask, updateTask, etc.)
   - Lines 1500-2000: Rendering functions (render, renderTasks, renderMatrix, renderRaidView)
   - Lines 2000-2500: Task row creation (createTaskRow, createNewTaskRow)
   - Lines 2500-3000: Event handlers, keyboard shortcuts
3. **State object** (`state`) - Single source of truth, persisted to `localStorage.dashPlus`
4. **Always call `render()`** after state changes to update UI
5. **Click handlers** use inline `onclick=""` attributes (not addEventListener)
6. **Escape user input** with `esc()` function to prevent XSS

### Floating UI Elements

The HTML app has several floating/overlay elements:

- **Floating action bar** (`#actionBar`) - Bottom-center, appears when task selected
- **Floating type selector** (`#typeSelectorPanel`) - Dropdown for task type selection (Task/Risk/Assumption/Issue/Dependency)
- **Keyboard shortcuts help** (`#keyboardHelp`) - Full-screen overlay, toggle with `?`
- **Details panel** (`#detailsPanelContainer`) - Right sidebar, collapsible with horizontal slide animation

All use `position: fixed` with `z-index` layering. Close on outside click via document-level event listener.

## Natural Language Date Parsing

The `parseNaturalDate()` utility (both in HTML app and `src/utils/dateParser.js`) supports:

- Relative: "tomorrow", "yesterday", "next week", "in 3 days"
- Day names: "monday", "friday" (next occurrence)
- Specific: "2025-01-20", "03/15/2025", "tomorrow at 3pm"
- End of period: "end of week" (Sunday 11:59 PM), "end of month"

Returns `Date` object or `null` if unparseable. Used for `dueDate` field.

## Testing Strategy

Tests are structured to validate both implementations:

- **`html-frontend.test.js`** - Simulates core functions extracted from HTML app
- **`localStorage.test.js`** - Tests modular TaskStore, ProjectStore, LinkStore
- **`graphQueries.test.js`** - Tests graph traversal, cycle detection, PageRank
- **`dateParser.test.js`** - Tests natural language date parsing

Mock localStorage in tests with `LocalStorageMock` class.

## Deployment

The `index.html` file requires no build process:

1. Upload directly to static hosting (tiiny.host, Netlify, Vercel, GitHub Pages)
2. No environment variables needed
3. No backend required (all data in browser localStorage)
4. Tailwind CSS loads from CDN (requires internet connection)

See `DEPLOYMENT.md` for complete deployment guide.

## Migration to Backend (Future)

The modular library (`src/`) is designed for easy backend migration:

1. Replace `LocalStorage` class with HTTP client
2. Keep same interface: `TaskStore.create()`, `getAll()`, `update()`, etc.
3. Swap localStorage keys for API endpoints
4. GraphQueries can run client-side or server-side

See `MIGRATION_GUIDE.md` and `API_DESIGN.md` for migration strategy. SQL schema provided in `SQL_SCHEMA.sql`.

## Important Implementation Details

### Task Aging and Due Date Visual Feedback

- Tasks > 24 hours old turn grey unless due date overrides
- Tasks due in ≤ 3 days show red background
- Done tasks always have strikethrough and reduced opacity

### Keyboard Navigation

- Arrow keys (↑↓) or vim keys (j/k) navigate tasks
- `n` creates new task
- `d` toggles done/active
- `s` cycles status (active → waiting → delegated → reference → done)
- `Enter` edits selected task
- `Delete` archives task
- `Esc` clears selection

### Drag and Drop

- Task list: Reorder tasks by dragging the `⠿` handle
- Matrix view: Drag tasks between quadrants to change priority
- Updates `priority` field and re-renders

### Auto-Reset After Task Creation

When creating a task/RAID item, the type selector resets to "Task" after creation. This is intentional UX - users expect one-off RAID items, not batches.

## Documentation Files

- **README.md** - User-facing documentation with code examples
- **DATA_MODEL.md** - Complete TypeScript interfaces for all entities
- **API_DESIGN.md** - Future REST API specification
- **MIGRATION_GUIDE.md** - Backend migration strategy
- **DEPLOYMENT.md** - Deployment instructions for static hosting
- **SQL_SCHEMA.sql** - PostgreSQL schema for future backend

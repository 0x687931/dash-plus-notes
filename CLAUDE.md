# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dash-Plus Notes** is a lightweight, single-file task management application with the dash-plus status notation system (-+→←Δ). It's a browser-based app with no backend, all data stored in localStorage.

**Current Implementation**: Single `index.html` file (~400 lines) with vanilla JavaScript, Tailwind CSS, and localStorage persistence. Simple, focused, production-ready.

## Architecture

### Single-File Application (Current)

The entire app is contained in `index.html`:

- **State Management**: Simple tasks array in memory
- **Persistence**: localStorage key `dashplus-tasks`
- **Rendering**: Loop through tasks array, regenerate DOM (deterministic)
- **Events**: Event delegation (click, dblclick handlers on task rows)
- **Storage**: One localStorage commit per action (save/render cycle)

**Pattern**:
```
User Action → Mutate tasks array → save() to localStorage → render() DOM
```

### Data Model

Each task object has:
```javascript
{
  id: number (Date.now()),
  content: string,
  status: 'active' | 'waiting' | 'delegated' | 'reference' | 'done',
  dueDate: string | null (e.g., "2025-01-20"),
  delegatedTo: string | null (person name),
  archived: boolean,
  createdAt: ISO string
}
```

### Status Symbols (Dash-Plus Notation)

| Symbol | Status | Meaning |
|--------|--------|---------|
| `-` | active | Current task, to-do |
| `→` | waiting | Blocked by external factor |
| `←` | delegated | Assigned to someone else |
| `Δ` | reference | Data point, not actionable |
| `+` | done | Complete or cancelled |

## Development Commands

```bash
# Start development server (Vite)
npm run dev

# Run production build
npm run build

# Preview built version
npm run preview

# Run tests (Vitest)
npm test
npm test -- --watch
npm test -- --ui

# Lint
npm run lint

# Format
npm run format
```

## Key Files

- **`index.html`** - Entire application (HTML, CSS, JavaScript)
- **`server.js`** - Express static file server for Fly.io deployment
- **`package.json`** - Dependencies and scripts
- **`.dockerignore` / `Dockerfile` / `fly.toml`** - Deployment configuration

## Making Changes

### Adding Features

1. **Read the entire `index.html`** - It's ~400 lines, self-contained
2. **Understand the flow**: State (tasks array) → save() → render()
3. **Mutate tasks array** based on user action
4. **Call save()** to persist (always after mutation)
5. **Call render()** to update UI (always after save)
6. **Commit with clear message** about what the feature does

Example: Adding a priority field would require:
- Add `priority: null` to new task objects
- Add UI to render priority
- Add event handler to edit priority
- Call save() + render() on change

### Editing Task Content

Tasks are edited inline:
- Double-click task content → creates input field → blur/Enter to save → Escape to cancel
- The `startEdit()` function handles this
- The `finishEdit()` function commits the change

### Inline Field Editing (Due Date, Delegated To)

Fields like dueDate and delegatedTo use `editField()` which:
1. Opens a simple prompt()
2. Updates the field
3. Calls save() + render()

To add a new inline field:
1. Create a span in task row with ondblclick handler
2. Call `editField(idx, 'fieldName')`
3. Update createTask() to initialize the field

## Testing

Current test setup uses Vitest but **there are no tests yet** for the HTML app (it's a static DOM app, hard to test without browser).

If adding tests:
- Write tests in `/tests/` directory
- Use `npm test` to run
- Focus on business logic (status cycling, archiving, filtering)

## Deployment

App deploys to Fly.io as a containerized Node.js app:
- `server.js` serves `index.html` and static files
- Health check endpoint: `/health`
- Environment: `PORT` variable (defaults to 8080)
- Docker: Alpine Node.js image (~44MB)

**Deploy command**: `flyctl deploy`

## Important Design Decisions

1. **No Framework** - Vanilla JavaScript. Why? Simple, fast, no build needed for client.
2. **Full Re-render** - Every action regenerates task list. Why? Simpler than delta updates, fine for task counts.
3. **prompt() for Input** - Due date/delegated fields use browser prompt(). Why? Minimal UI, good enough for metadata.
4. **localStorage Only** - No backend. Why? Single-user app, fast, works offline.
5. **Archive, Not Delete** - Tasks can be archived and unarchived. Why? Safer UX, keeps history.

## Gotchas

- **Task Index**: Using `tasks.indexOf(task)` to get real index after filtering (for archived view). Inefficient but simple.
- **Stats Only Count Active** - Total, Active, Done stats exclude archived tasks.
- **Archived Tasks Readonly** - Archived tasks show but can't be edited/status-cycled (by design).
- **No Due Date Input Validation** - User can enter any string for due date (including garbage).

## Future (DO NOT BUILD YET)

The README mentions a planned backend migration. **This is outdated.** Focus on the current HTML app. If backend is needed:
1. Create Node.js API endpoints
2. Move storage from localStorage to database
3. Migrate frontend to fetch API instead of localStorage

## Common Tasks

### Add a new task field

Example: Adding `tags` field to tasks

1. Update `createTask()` to initialize: `tags: []`
2. Update task row rendering to show tags
3. Add edit handler (similar to delegatedTo)
4. Call save() + render() on change

### Change a status symbol

Edit `SYMBOLS` object at top of script, update `STATUS_CYCLE` array if needed.

### Fix styling issues

Edit `<style>` section or add Tailwind classes to task row elements.

### Modify statistics

Edit `updateStats()` function to change what counts (e.g., count archived tasks separately).

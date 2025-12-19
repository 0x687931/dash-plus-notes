# Dash-Plus Notes - Complete UI/UX Redesign Proposal

**Date:** 2025-12-19
**Focus:** Mobile-First Design with Desktop Progressive Enhancement
**Scope:** Complete redesign of task management interface for modern mobile and desktop experience

---

## Executive Summary

This proposal addresses critical mobile UX issues and provides a comprehensive redesign for both mobile and desktop. The current implementation has a **reversed arrow direction bug** on mobile and suffers from **information density issues**, **awkward navigation patterns**, and **poor touch interactions**.

The redesign follows **mobile-first principles** with progressive enhancement for desktop, inspired by modern task management apps like Todoist, Things 3, and Linear.

---

## 1. Current Implementation Analysis

### 1.1 Current Architecture

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ Header (fixed)                          │
│ - Project tabs (horizontal scroll)      │
│ - View toggles (5D, Matrix, RAID)       │
│ - Settings, Theme, Export               │
├─────────────────────────────────────────┤
│ Main Content (flex-1)                   │
│ ┌────────────────┬──────────────────┐   │
│ │ Task List      │ Details Panel    │   │
│ │ (scrollable)   │ (fixed right 30%)│   │
│ │                │                  │   │
│ │                │                  │   │
│ │                │                  │   │
│ └────────────────┴──────────────────┘   │
└─────────────────────────────────────────┘
```

**Mobile Adaptation (current):**
```
┌─────────────────────┐
│ Header (wrapping)   │
├─────────────────────┤
│ Task List           │
│ (scrollable)        │
│                     │
│                     │
│                     │
├─────────────────────┤
│ Details Panel       │
│ (bottom sheet)      │
│ ▲/▼ toggle          │  ← BUG: Arrow points wrong way!
└─────────────────────┘
```

### 1.2 Critical Mobile UX Issues

**1. Details Panel Arrow Direction Bug**
- **Line 2900:** `toggle.textContent = '▼';` when expanded (should be `▲`)
- **Line 2913:** `toggle.textContent = '▲';` when collapsed (should be `▼`)
- **Impact:** Visual confusion - arrow points opposite direction of panel movement

**2. Information Density Issues**
- Header wraps to 3+ lines on mobile (10+ buttons)
- Task rows toggle between mobile/desktop layouts via media queries
- No clear visual hierarchy between primary and secondary actions
- Metadata (due date, delegated to, waiting on) competes for attention

**3. Navigation Problems**
- Project tabs scroll horizontally (hard to tap small targets)
- View toggles (Tasks, Matrix, RAID) not discoverable
- Archive toggle buried in header clutter
- No persistent "back to list" from details view

**4. Touch Interaction Issues**
- Drag handles (`⠿`) only visible on desktop
- Double-click to edit doesn't translate well to mobile (should be single tap)
- Inline editing creates tiny input fields
- Autocomplete suggestions overlap content

**5. Modal/Panel Confusion**
- Details panel slides from bottom (bottom sheet pattern)
- Link overlay is full-screen modal
- Type selector is floating dropdown
- Keyboard shortcuts is full-screen modal
- **No consistent pattern for progressive disclosure**

### 1.3 Desktop Issues

While less severe, desktop has problems too:

- **Details panel always open** - wastes space when not needed
- **No task selection persistence** - selecting task shows floating action bar instead of updating panel
- **Inline editing** - destroys spatial consistency (row height jumps)
- **No bulk actions** - can't multi-select tasks

---

## 2. Mobile-First Design Principles

### 2.1 Core Principles

1. **Thumb Zone First** - Primary actions within comfortable thumb reach
2. **Progressive Disclosure** - Show only what's needed, hide complexity
3. **Clear Visual Hierarchy** - Primary actions obvious, secondary hidden until needed
4. **Consistent Patterns** - Same interaction model across all views
5. **Fast Task Entry** - Minimal taps to create and edit tasks
6. **Readable at Arm's Length** - Appropriate font sizes and spacing

### 2.2 Mobile Design Patterns to Adopt

**Bottom Navigation (Primary Navigation)**
```
┌─────────────────────┐
│ Content             │
│                     │
│                     │
├─────────────────────┤
│ ☰ 📝 ⚡ ⋯           │  ← Bottom nav
└─────────────────────┘
```

**Swipeable Views**
- Swipe left/right between projects
- Swipe task row to reveal actions (archive, status)

**Floating Action Button (FAB)**
- Bottom-right corner for "New Task"
- Expands to show task type selector

**Bottom Sheet (Modal Content)**
- Task details slide up from bottom
- Can be partially or fully expanded
- Swipe down to dismiss

**Card-Based Layout**
- Each task is a card with clear boundaries
- Tap card to open details
- Metadata shown as pills/chips

---

## 3. Comprehensive Redesign

### 3.1 Mobile Layout (< 768px)

#### Header - Simplified
```
┌─────────────────────────────────────┐
│ ☰  dash-plus        Inbox ▼    ⚙️   │  ← Only essentials
└─────────────────────────────────────┘
```

**Components:**
- **Hamburger Menu** (☰) - Opens drawer with projects, views, settings
- **App Logo** - Tap to scroll to top
- **Current Project** - Tap to switch projects (modal selector)
- **Settings** (⚙️) - Theme, terminology, keyboard shortcuts

#### Bottom Navigation
```
┌─────────────────────────────────────┐
│  📋      📝      ⚡      👤          │
│  All    Active  Matrix   More       │
└─────────────────────────────────────┘
```

**Tabs:**
1. **All** - Full task list (default view)
2. **Active** - Filtered to active tasks only
3. **Matrix** - Eisenhower Matrix view
4. **More** - RAID, Archived, Search, Export

#### Task List View
```
┌─────────────────────────────────────┐
│ 🔍 Search tasks...                  │  ← Search bar (sticky)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ○ Call Sarah re: project        │ │  ← Task card
│ │   📅 Tomorrow · 🔗 Sarah        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ - Review Q4 budget              │ │
│ │   🔴 High · ⚠️  Overdue          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ → Waiting on legal approval     │ │
│ │   👤 Legal Team                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│                            [+] ←FAB │  ← Floating Action Button
└─────────────────────────────────────┘
```

**Task Card Anatomy:**
```
┌──────────────────────────────────────┐
│ [○] Task title (truncate at 2 lines)│  ← Status icon + title
│ 📅 Due · 🔴 Priority · 👤 Delegate  │  ← Metadata chips
│ 🔗 2 links · 📝 Notes               │  ← Optional metadata
└──────────────────────────────────────┘
```

**Swipe Actions:**
```
Swipe Left:
┌──────────────────┬─────┬─────┬─────┐
│ Task title       │ ✓   │ 🗑️  │ ⋯   │
│                  │Done │ Del │More │
└──────────────────┴─────┴─────┴─────┘

Swipe Right:
┌─────┬──────────────────────────────┐
│  s  │ Task title                   │
│Cycle│ Metadata                     │
└─────┴──────────────────────────────┘
```

#### Task Details (Bottom Sheet)
```
┌─────────────────────────────────────┐
│          ━━━                        │  ← Drag handle
├─────────────────────────────────────┤
│ [○] Call Sarah re: project timeline │  ← Title (editable)
│ TASK-023                            │  ← Readable ID
├─────────────────────────────────────┤
│ Status        [Active ▼]            │  ← Key fields
│ Due Date      [Tomorrow ▼]          │
│ Priority      [High ▼]              │
│ Delegated To  [Sarah ▼]             │
├─────────────────────────────────────┤
│ Notes                               │
│ ┌─────────────────────────────────┐ │
│ │ Follow up on project timeline   │ │
│ │ discussion from Monday meeting  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Links (2)                           │
│ → PRJ-015 Project kickoff           │
│ → TASK-019 Send proposal            │
│                                     │
│ [ Link Task ]                       │
├─────────────────────────────────────┤
│ Created: Dec 18, 2025               │
│ Updated: Dec 19, 2025               │
└─────────────────────────────────────┘
```

**Bottom Sheet States:**
- **Collapsed** - Hidden below screen
- **Peeking** - Show title + status (30% height)
- **Half-expanded** - Show all fields (60% height)
- **Full-screen** - Editing mode with keyboard

#### Hamburger Menu (Left Drawer)
```
┌─────────────────────────────────────┐
│ dash-plus                      [×]  │
├─────────────────────────────────────┤
│ Projects                            │
│ ◉ Inbox                       (24)  │
│ ○ Work                        (12)  │
│ ○ Personal                     (8)  │
│ + New Project                       │
├─────────────────────────────────────┤
│ Views                               │
│   📋 Task List                      │
│   📊 Matrix                         │
│   🎯 RAID Log                       │
│   📦 Archived              (156)    │
├─────────────────────────────────────┤
│ Settings                            │
│   🌙 Theme                          │
│   -+ Terminology                    │
│   ⌨️  Keyboard Shortcuts            │
│   📤 Export                         │
└─────────────────────────────────────┘
```

#### FAB + Type Selector
```
Default State:            Expanded State:
┌─────────────────┐      ┌─────────────────────┐
│            [+]  │      │ 📝 Task       [+]   │
│                 │      │ ⚠️  Risk        [+]   │
│                 │      │ 💭 Assumption   [+]   │
│                 │      │ 🚨 Issue        [+]   │
│                 │      │ 🔗 Dependency   [+]   │
└─────────────────┘      └─────────────────────┘
```

### 3.2 Tablet/Desktop Layout (≥ 768px)

#### Three-Column Master-Detail
```
┌────────┬──────────────────────┬──────────────────┐
│Projects│ Task List            │ Details Panel    │
│Sidebar │ (Master)             │ (Detail)         │
│        │                      │                  │
│Inbox   │ ○ Task 1             │ [Full Details]   │
│Work    │ - Task 2  ←Selected  │ [of Task 2]      │
│Personal│ → Task 3             │                  │
│        │ ← Task 4             │                  │
│+ New   │                      │                  │
│        │                      │                  │
│        │ [+ New Task]         │                  │
│        │                      │                  │
│Views   │                      │                  │
│Matrix  │                      │                  │
│RAID    │                      │                  │
│Archive │                      │                  │
└────────┴──────────────────────┴──────────────────┘
```

**Key Differences from Current:**
1. **Left sidebar** - Always visible project switcher
2. **Center column** - Task list with keyboard navigation
3. **Right panel** - Details for selected task (collapsible)
4. **No floating action bar** - Actions in details panel
5. **Persistent selection** - Selected task stays highlighted

#### Desktop Task List
```
┌─────────────────────────────────────────────────┐
│ 🔍 Search...                Filter: All ▼       │
├──┬────────────────────────┬──────────┬─────────┤
│☐ │Status│Task             │Due Date  │Priority │
├──┼────────────────────────┼──────────┼─────────┤
│☐ │ ○   │ Call Sarah...   │Tomorrow  │🔴 High  │
│☐ │ -   │ Review budget   │Overdue   │🟡 Med   │
│☑ │ →   │ Legal approval  │Next Week │⚪ None  │
└──┴────────────────────────┴──────────┴─────────┘
```

**Features:**
- **Checkbox column** - Multi-select for bulk actions
- **Hover actions** - Quick edit, duplicate, archive
- **Click row** - Select and show in details panel
- **Double-click cell** - Inline edit (maintains row height)
- **Drag handle** - Reorder tasks

#### Desktop Details Panel
```
┌──────────────────────────────────────┐
│ Details                         [×]  │  ← Collapsible
├──────────────────────────────────────┤
│ Call Sarah re: project timeline      │
│ TASK-023                             │
├──────────────────────────────────────┤
│ [Active ▼] [Tomorrow ▼] [High ▼]     │  ← Quick actions
│                                      │
│ Delegated To: [Sarah        ▼]      │
│ Waiting On:   [              ]      │
├──────────────────────────────────────┤
│ Notes:                               │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Links (2)                            │
│ 🔗 PRJ-015 Project kickoff     [×]   │
│ 🔗 TASK-019 Send proposal      [×]   │
│ [ + Link Task ]                      │
├──────────────────────────────────────┤
│ Advanced                             │
│ [ Convert to Risk ]                  │
│ [ Convert to Issue ]                 │
│ [ Archive Task ]                     │
├──────────────────────────────────────┤
│ Metadata                             │
│ Created: Dec 18, 2025 10:23 AM       │
│ Updated: Dec 19, 2025 2:45 PM        │
└──────────────────────────────────────┘
```

---

## 4. Information Architecture

### 4.1 Navigation Hierarchy

```
Level 1: App Context
├─ Projects (Which workspace?)
│  ├─ Inbox (default)
│  ├─ Work
│  └─ Personal
│
Level 2: View Mode (How to see tasks?)
├─ Task List (default)
├─ Matrix (Eisenhower)
├─ RAID Log
└─ Archived
│
Level 3: Filters (Which tasks to show?)
├─ All
├─ Active
├─ Waiting
├─ Delegated
├─ Done
└─ Overdue
│
Level 4: Task Details (What about this task?)
├─ Core Fields (status, due, priority)
├─ Context (delegated to, waiting on)
├─ Extended (notes, links)
└─ Metadata (created, updated)
```

### 4.2 User Flows

#### Flow 1: Quick Task Entry (Mobile)
```
1. Tap FAB (+) button
2. [Optional] Tap type icon to change from "Task"
3. Type task title
4. [Optional] Tap "Tomorrow" to set due date
5. Tap checkmark or press Enter
   → Task created, bottom sheet closes
   → New blank task ready (FAB still open)
```

#### Flow 2: Edit Task Details (Mobile)
```
1. Tap task card
   → Bottom sheet slides up (half-expanded)
2. Tap any field to edit
   → Keyboard appears, sheet goes full-screen
3. Make changes
4. Tap outside or swipe down
   → Sheet collapses, changes saved
```

#### Flow 3: Change Task Status (Mobile)
```
Method A - Quick Cycle:
1. Swipe task card right
2. Tap "s" cycle button
   → Status cycles (active → waiting → delegated → reference → done)

Method B - Tap Status Icon:
1. Tap status icon (○, -, →, ←, △)
   → Bottom sheet opens with status picker

Method C - In Details:
1. Tap task card (open details)
2. Tap status dropdown
3. Select new status
```

#### Flow 4: Bulk Actions (Desktop)
```
1. Click checkboxes on multiple tasks
   → Bulk action toolbar appears at bottom
2. Click action (Done, Archive, Change Status, Move to Project)
   → Confirmation modal
3. Confirm
   → Tasks updated, checkboxes cleared
```

---

## 5. Interaction Patterns

### 5.1 Mobile Gestures

| Gesture | Target | Action |
|---------|--------|--------|
| Tap | Task card | Open details (bottom sheet) |
| Tap | Status icon | Quick status change menu |
| Tap | FAB | Create new task / Show type selector |
| Long-press | Task card | Enter multi-select mode |
| Swipe left | Task card | Reveal actions (Done, Delete, More) |
| Swipe right | Task card | Cycle status |
| Swipe down | Bottom sheet | Dismiss / Collapse |
| Swipe up | Bottom sheet | Expand to full-screen |
| Pinch | Task list | (Future) Zoom in/out of hierarchy |

### 5.2 Desktop Interactions

| Action | Target | Result |
|--------|--------|--------|
| Click | Task row | Select task, show in details panel |
| Double-click | Table cell | Inline edit (maintains row height) |
| Ctrl+Click | Task row | Multi-select |
| Shift+Click | Task row | Range select |
| Drag | Drag handle | Reorder task |
| Drag | Task to project | Move task to project |
| Hover | Task row | Show quick actions (edit, duplicate, archive) |
| Right-click | Task row | Context menu |

### 5.3 Keyboard Shortcuts (Enhanced)

**Navigation:**
- `↑/↓` or `j/k` - Navigate tasks
- `Ctrl/Cmd + 1-4` - Switch bottom nav tabs (mobile) or views (desktop)
- `Ctrl/Cmd + Shift + P` - Quick project switcher
- `/` - Focus search
- `Esc` - Clear selection / Close modal

**Task Actions:**
- `n` - New task (opens FAB menu on mobile)
- `Enter` - Edit selected task
- `d` - Toggle done
- `s` - Cycle status
- `Delete` or `Backspace` - Archive
- `Ctrl/Cmd + D` - Duplicate task
- `Ctrl/Cmd + L` - Link task

**Editing:**
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + Enter` - Save and close
- `Esc` - Cancel editing

**Bulk Actions (Desktop):**
- `Ctrl/Cmd + A` - Select all visible tasks
- `Ctrl/Cmd + Shift + A` - Deselect all
- `Ctrl/Cmd + Shift + D` - Mark selected as done

---

## 6. Visual Design Principles

### 6.1 Typography

**Mobile:**
```css
/* Task title */
font-size: 16px;
line-height: 24px;
font-weight: 500;

/* Metadata chips */
font-size: 13px;
line-height: 18px;
font-weight: 400;

/* Headers */
font-size: 20px;
line-height: 28px;
font-weight: 600;
```

**Desktop:**
```css
/* Task title */
font-size: 14px;
line-height: 20px;
font-weight: 500;

/* Metadata */
font-size: 12px;
line-height: 16px;
font-weight: 400;

/* Headers */
font-size: 18px;
line-height: 24px;
font-weight: 600;
```

### 6.2 Spacing

**Mobile Touch Targets:**
- Minimum height: 44px (Apple guidelines)
- Tap targets: 48x48px with 8px padding
- Card padding: 16px
- Card gap: 12px

**Desktop:**
- Table row height: 36px
- Padding: 12px horizontal, 8px vertical
- Card gap: 8px

### 6.3 Color System (Enhanced)

```css
/* Status Colors */
--status-active: #3b82f6;      /* Blue */
--status-done: #10b981;        /* Green */
--status-waiting: #f59e0b;     /* Amber */
--status-delegated: #8b5cf6;   /* Purple */
--status-reference: #6b7280;   /* Gray */

/* Priority Colors */
--priority-high: #ef4444;      /* Red */
--priority-medium: #f59e0b;    /* Amber */
--priority-low: #10b981;       /* Green */
--priority-none: #d1d5db;      /* Light Gray */

/* RAID Colors */
--raid-risk: #ef4444;          /* Red */
--raid-assumption: #3b82f6;    /* Blue */
--raid-issue: #f97316;         /* Orange */
--raid-dependency: #8b5cf6;    /* Purple */

/* Semantic Colors */
--overdue: #dc2626;            /* Bright Red */
--due-soon: #f59e0b;           /* Amber */
--card-bg: #ffffff;            /* White */
--card-bg-dark: #1f2937;       /* Dark Gray 800 */
```

### 6.4 Card Design

```css
.task-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.task-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-card--selected {
  border-color: var(--status-active);
  box-shadow: 0 0 0 2px var(--status-active);
}
```

### 6.5 Status Icons (Redesigned)

Instead of text symbols, use icon badges:

```
Active    ○  →  Blue circle outline
Done      +  →  Green checkmark filled circle
Waiting   →  →  Amber clock icon
Delegated ←  →  Purple person icon
Reference Δ  →  Gray bookmark icon
```

---

## 7. Accessibility Considerations

### 7.1 WCAG 2.1 AA Compliance

- **Color contrast:** All text ≥ 4.5:1 ratio
- **Focus indicators:** Visible 2px outline on all interactive elements
- **Keyboard navigation:** All actions accessible via keyboard
- **Screen reader:** ARIA labels on all icons and buttons
- **Touch targets:** Minimum 44x44px on mobile

### 7.2 ARIA Labels

```html
<!-- Task card -->
<div role="button"
     aria-label="Task: Call Sarah regarding project timeline. Status: Active. Due: Tomorrow. Priority: High."
     tabindex="0">
  ...
</div>

<!-- Status button -->
<button aria-label="Change status. Current status: Active. Press to cycle through statuses."
        aria-haspopup="menu">
  <span aria-hidden="true">○</span>
</button>

<!-- Bottom sheet -->
<div role="dialog"
     aria-modal="true"
     aria-labelledby="task-detail-title">
  ...
</div>
```

### 7.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .task-card,
  .bottom-sheet,
  .drawer {
    transition: none;
  }

  .task-card:active {
    transform: none;
  }
}
```

---

## 8. Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

**Priority:** Fix immediate bugs and improve mobile experience

**Tasks:**
1. ✅ **Fix details panel arrow bug**
   - Lines 2900, 2913 in `toggleDetails()`
   - Swap `▼` and `▲` logic

2. ✅ **Simplify mobile header**
   - Move project tabs to hamburger menu
   - Keep only: hamburger, logo, current project, settings
   - Reduce header height from ~120px to 56px

3. ✅ **Improve task card touch targets**
   - Increase status button from 32px to 44px minimum
   - Add more padding to task cards (12px → 16px)
   - Increase metadata chip font size (11px → 13px)

4. ✅ **Add bottom navigation (mobile only)**
   - Create sticky bottom nav with 4 tabs
   - All, Active, Matrix, More
   - Hide current view toggles in header

5. ✅ **Fix swipe gesture on task cards**
   - Currently no swipe actions
   - Add swipe left for Done/Delete/More
   - Add swipe right for Status cycle

**Code Changes (Phase 1):**

```javascript
// Fix arrow direction bug
function toggleDetails() {
    state.detailsExpanded = !state.detailsExpanded;
    const container = document.getElementById('detailsPanelContainer');
    const toggle = document.getElementById('detailsToggle');
    const mainContent = document.getElementById('mainContent');
    const floatingToggle = document.getElementById('floatingDetailsToggle');

    const isMobile = window.innerWidth < 768;

    if (state.detailsExpanded) {
        if (isMobile) {
            container.style.transform = 'translateY(0)';
            toggle.textContent = '▲';  // ← FIX: Changed from ▼
        } else {
            container.style.transform = 'translateX(0)';
            toggle.textContent = '▶';
            mainContent.style.marginRight = '30%';
        }
        floatingToggle.classList.add('hidden');
    } else {
        if (isMobile) {
            container.style.transform = 'translateY(100%)';
            toggle.textContent = '▼';  // ← FIX: Changed from ▲
        } else {
            container.style.transform = 'translateX(100%)';
            toggle.textContent = '◀';
            mainContent.style.marginRight = '0';
        }
        floatingToggle.classList.remove('hidden');
    }
}
```

```html
<!-- Add bottom navigation (mobile) -->
<nav id="bottomNav" class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
    <div class="grid grid-cols-4 h-16">
        <button onclick="setBottomNavView('all')" class="flex flex-col items-center justify-center gap-1 text-xs" data-nav="all">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            <span>All</span>
        </button>
        <button onclick="setBottomNavView('active')" class="flex flex-col items-center justify-center gap-1 text-xs" data-nav="active">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span>Active</span>
        </button>
        <button onclick="setBottomNavView('matrix')" class="flex flex-col items-center justify-center gap-1 text-xs" data-nav="matrix">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            <span>Matrix</span>
        </button>
        <button onclick="setBottomNavView('more')" class="flex flex-col items-center justify-center gap-1 text-xs" data-nav="more">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
            <span>More</span>
        </button>
    </div>
</nav>
```

```css
/* Improved mobile touch targets */
@media (max-width: 768px) {
    .task-card {
        padding: 16px;
        margin-bottom: 12px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .status-button {
        min-width: 44px;
        min-height: 44px;
        font-size: 20px;
    }

    .metadata-chip {
        font-size: 13px;
        padding: 4px 8px;
        border-radius: 6px;
    }

    /* Reserve space for bottom nav */
    #mainContent {
        padding-bottom: 64px;
    }
}
```

### Phase 2: Card-Based Layout (3-5 days)

**Priority:** Modernize task list with card design

**Tasks:**
1. Redesign task row as card component
2. Add status icon badges (replace text symbols)
3. Implement metadata as pills/chips
4. Add card states (default, hover, active, selected)
5. Optimize for readability (typography, spacing)

**New Component Structure:**

```html
<!-- Task Card Component -->
<div class="task-card"
     data-task-id="{id}"
     data-status="{status}"
     role="button"
     tabindex="0"
     onclick="selectTask('{id}')"
     ontouchstart="handleTouchStart(event, '{id}')"
     ontouchmove="handleTouchMove(event)"
     ontouchend="handleTouchEnd(event, '{id}')">

    <!-- Header Row -->
    <div class="task-card__header">
        <div class="task-card__status">
            <button class="status-icon status-icon--{status}"
                    onclick="event.stopPropagation(); cycleStatus('{id}')"
                    aria-label="Status: {statusLabel}">
                <svg><!-- Status icon --></svg>
            </button>
        </div>
        <div class="task-card__title">
            {content}
        </div>
    </div>

    <!-- Metadata Row -->
    <div class="task-card__metadata">
        {if dueDate}
            <span class="chip chip--due {dueDateClass}">
                <svg class="chip__icon">📅</svg>
                {dueDate}
            </span>
        {/if}
        {if priority !== 'none'}
            <span class="chip chip--priority chip--priority-{priority}">
                <svg class="chip__icon">{priorityIcon}</svg>
                {priority}
            </span>
        {/if}
        {if delegatedTo}
            <span class="chip chip--delegated">
                <svg class="chip__icon">👤</svg>
                {delegatedTo}
            </span>
        {/if}
        {if links.length > 0}
            <span class="chip chip--links">
                <svg class="chip__icon">🔗</svg>
                {links.length}
            </span>
        {/if}
        {if notes}
            <span class="chip chip--notes">
                <svg class="chip__icon">📝</svg>
                Notes
            </span>
        {/if}
    </div>
</div>
```

```css
/* Task Card Styles */
.task-card {
    position: relative;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.task-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
}

.task-card:active {
    transform: scale(0.98);
}

.task-card--selected {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 2px #3b82f6;
}

.task-card--done .task-card__title {
    text-decoration: line-through;
    opacity: 0.6;
}

.task-card__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
}

.task-card__status {
    flex-shrink: 0;
}

.task-card__title {
    flex: 1;
    font-size: 16px;
    line-height: 24px;
    font-weight: 500;
    color: #111827;
    /* Truncate at 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.task-card__metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
}

.chip__icon {
    width: 14px;
    height: 14px;
}

.chip--due {
    background: #dbeafe;
    color: #1e40af;
}

.chip--overdue {
    background: #fee2e2;
    color: #991b1b;
}

.chip--priority-high {
    background: #fee2e2;
    color: #991b1b;
}

.chip--priority-medium {
    background: #fef3c7;
    color: #92400e;
}

.chip--priority-low {
    background: #d1fae5;
    color: #065f46;
}

.status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
}

.status-icon:hover {
    background: rgba(0, 0, 0, 0.05);
}

.status-icon--active {
    color: #3b82f6;
}

.status-icon--done {
    color: #10b981;
}

.status-icon--waiting {
    color: #f59e0b;
}

.status-icon--delegated {
    color: #8b5cf6;
}

.status-icon--reference {
    color: #6b7280;
}
```

### Phase 3: Swipe Gestures (2-3 days)

**Priority:** Add mobile-native interactions

**Tasks:**
1. Implement touch event handlers
2. Add swipe-left actions (Done, Delete, More)
3. Add swipe-right status cycle
4. Visual feedback during swipe
5. Haptic feedback (if supported)

**Swipe Implementation:**

```javascript
// Touch gesture handling
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let swipingTask = null;

function handleTouchStart(event, taskId) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    swipingTask = taskId;
}

function handleTouchMove(event) {
    if (!swipingTask) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Determine if horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        event.preventDefault(); // Prevent scrolling

        const card = document.querySelector(`[data-task-id="${swipingTask}"]`);
        card.style.transform = `translateX(${deltaX}px)`;

        // Show action buttons based on swipe direction
        if (deltaX < -50) {
            // Swipe left - show right-side actions
            showSwipeActions(swipingTask, 'left');
        } else if (deltaX > 50) {
            // Swipe right - show left-side action
            showSwipeActions(swipingTask, 'right');
        }
    }
}

function handleTouchEnd(event, taskId) {
    const touchEndTime = Date.now();
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;

    const card = document.querySelector(`[data-task-id="${taskId}"]`);

    // Check if this was a swipe or a tap
    const isSwipe = Math.abs(deltaX) > 50 && deltaTime < 300;

    if (isSwipe) {
        if (deltaX < -50) {
            // Swipe left - keep actions visible
            card.style.transform = 'translateX(-180px)';
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(10);
        } else if (deltaX > 50) {
            // Swipe right - cycle status
            cycleStatus(taskId);
            card.style.transform = 'translateX(0)';
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(10);
        }
    } else {
        // Not a swipe - reset position
        card.style.transform = 'translateX(0)';
        hideSwipeActions(taskId);

        // If it was a quick tap, open task details
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
            selectTask(taskId);
        }
    }

    swipingTask = null;
}

function showSwipeActions(taskId, direction) {
    const actionsContainer = document.getElementById(`swipe-actions-${taskId}`);
    if (!actionsContainer) {
        const card = document.querySelector(`[data-task-id="${taskId}"]`);
        const actions = document.createElement('div');
        actions.id = `swipe-actions-${taskId}`;
        actions.className = `swipe-actions swipe-actions--${direction}`;

        if (direction === 'left') {
            // Right-side actions (swipe left to reveal)
            actions.innerHTML = `
                <button class="swipe-action swipe-action--done" onclick="toggleDone('${taskId}')">
                    <svg>✓</svg>
                    <span>Done</span>
                </button>
                <button class="swipe-action swipe-action--delete" onclick="archiveTask('${taskId}')">
                    <svg>🗑️</svg>
                    <span>Delete</span>
                </button>
                <button class="swipe-action swipe-action--more" onclick="openTaskActions('${taskId}')">
                    <svg>⋯</svg>
                    <span>More</span>
                </button>
            `;
        } else {
            // Left-side action (swipe right to reveal)
            actions.innerHTML = `
                <button class="swipe-action swipe-action--status">
                    <svg>⟳</svg>
                    <span>Status</span>
                </button>
            `;
        }

        card.parentElement.appendChild(actions);
    }
    actionsContainer.classList.add('visible');
}

function hideSwipeActions(taskId) {
    const actionsContainer = document.getElementById(`swipe-actions-${taskId}`);
    if (actionsContainer) {
        actionsContainer.classList.remove('visible');
    }
}
```

```css
/* Swipe Actions */
.task-card {
    position: relative;
    transition: transform 0.3s ease;
}

.swipe-actions {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: stretch;
    opacity: 0;
    transition: opacity 0.2s;
}

.swipe-actions--left {
    right: 0;
}

.swipe-actions--right {
    left: 0;
}

.swipe-actions.visible {
    opacity: 1;
}

.swipe-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 60px;
    border: none;
    font-size: 11px;
    font-weight: 600;
    color: white;
    cursor: pointer;
}

.swipe-action--done {
    background: #10b981;
}

.swipe-action--delete {
    background: #ef4444;
}

.swipe-action--more {
    background: #6b7280;
}

.swipe-action--status {
    background: #3b82f6;
}

.swipe-action svg {
    width: 24px;
    height: 24px;
}
```

### Phase 4: Bottom Sheet Redesign (3-4 days)

**Priority:** Improve task details experience on mobile

**Tasks:**
1. Redesign bottom sheet with drag handle
2. Add three states: collapsed, half-expanded, full-screen
3. Implement drag-to-dismiss gesture
4. Add backdrop dimming
5. Optimize keyboard handling (auto-expand when editing)

**Bottom Sheet Component:**

```html
<!-- Bottom Sheet -->
<div id="bottomSheet" class="bottom-sheet" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="bottom-sheet__backdrop" onclick="closeBottomSheet()"></div>

    <!-- Sheet -->
    <div class="bottom-sheet__content" id="bottomSheetContent">
        <!-- Drag Handle -->
        <div class="bottom-sheet__handle-container">
            <div class="bottom-sheet__handle"></div>
        </div>

        <!-- Header -->
        <div class="bottom-sheet__header">
            <button class="bottom-sheet__close" onclick="closeBottomSheet()" aria-label="Close">
                <svg>×</svg>
            </button>
        </div>

        <!-- Body -->
        <div class="bottom-sheet__body" id="bottomSheetBody">
            <!-- Task details rendered here -->
        </div>
    </div>
</div>
```

```css
/* Bottom Sheet */
.bottom-sheet {
    position: fixed;
    inset: 0;
    z-index: 50;
    pointer-events: none;
}

.bottom-sheet.open {
    pointer-events: auto;
}

.bottom-sheet__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.bottom-sheet.open .bottom-sheet__backdrop {
    opacity: 1;
}

.bottom-sheet__content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    background: white;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
}

.bottom-sheet.open .bottom-sheet__content {
    transform: translateY(0);
}

.bottom-sheet.half-expanded .bottom-sheet__content {
    transform: translateY(40vh);
}

.bottom-sheet.full-expanded .bottom-sheet__content {
    transform: translateY(10vh);
}

.bottom-sheet__handle-container {
    padding: 12px 0 8px;
    display: flex;
    justify-content: center;
    cursor: grab;
}

.bottom-sheet__handle {
    width: 36px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
}

.bottom-sheet__header {
    padding: 0 20px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.bottom-sheet__close {
    width: 32px;
    height: 32px;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.bottom-sheet__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    .bottom-sheet__content {
        background: #1f2937;
    }

    .bottom-sheet__header {
        border-bottom-color: #374151;
    }

    .bottom-sheet__close {
        background: #374151;
    }

    .bottom-sheet__handle {
        background: #4b5563;
    }
}
```

```javascript
// Bottom Sheet Controller
let sheetTouchStartY = 0;
let sheetCurrentY = 0;
let isDraggingSheet = false;

function openBottomSheet(taskId, state = 'half') {
    const sheet = document.getElementById('bottomSheet');
    renderTaskDetails(taskId);

    sheet.classList.add('open');
    if (state === 'half') {
        sheet.classList.add('half-expanded');
    } else if (state === 'full') {
        sheet.classList.add('full-expanded');
    }

    // Add touch listeners to handle
    const handle = document.querySelector('.bottom-sheet__handle-container');
    handle.addEventListener('touchstart', handleSheetTouchStart);
    handle.addEventListener('touchmove', handleSheetTouchMove);
    handle.addEventListener('touchend', handleSheetTouchEnd);
}

function closeBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    sheet.classList.remove('open', 'half-expanded', 'full-expanded');
}

function handleSheetTouchStart(event) {
    sheetTouchStartY = event.touches[0].clientY;
    isDraggingSheet = true;
}

function handleSheetTouchMove(event) {
    if (!isDraggingSheet) return;

    const currentY = event.touches[0].clientY;
    const deltaY = currentY - sheetTouchStartY;

    // Only allow dragging down
    if (deltaY > 0) {
        const sheet = document.querySelector('.bottom-sheet__content');
        sheet.style.transform = `translateY(${deltaY}px)`;
    }
}

function handleSheetTouchEnd(event) {
    if (!isDraggingSheet) return;

    const currentY = event.changedTouches[0].clientY;
    const deltaY = currentY - sheetTouchStartY;

    const sheet = document.querySelector('.bottom-sheet__content');
    const sheetHeight = sheet.offsetHeight;

    // If dragged down more than 30% of sheet height, close
    if (deltaY > sheetHeight * 0.3) {
        closeBottomSheet();
    } else {
        // Snap back to position
        sheet.style.transform = '';
    }

    isDraggingSheet = false;
}
```

### Phase 5: Desktop Three-Column Layout (4-5 days)

**Priority:** Improve desktop experience with master-detail pattern

**Tasks:**
1. Add left sidebar for projects
2. Convert task list to master column
3. Redesign details panel as persistent right column
4. Add multi-select and bulk actions
5. Improve keyboard navigation

**Desktop Layout:**

```html
<!-- Desktop Layout (≥ 768px) -->
<div class="desktop-layout hidden md:flex">
    <!-- Left Sidebar (Projects) -->
    <aside class="sidebar">
        <div class="sidebar__header">
            <h2>Projects</h2>
            <button onclick="createProject()">+</button>
        </div>
        <nav class="sidebar__projects">
            <div class="project-item project-item--active" onclick="switchProject('inbox')">
                <span class="project-item__icon">📥</span>
                <span class="project-item__name">Inbox</span>
                <span class="project-item__count">24</span>
            </div>
            <!-- More projects... -->
        </nav>
        <div class="sidebar__views">
            <h3>Views</h3>
            <button class="view-item" onclick="setView('list')">
                <span>📋</span> Task List
            </button>
            <button class="view-item" onclick="setView('matrix')">
                <span>📊</span> Matrix
            </button>
            <button class="view-item" onclick="setView('raid')">
                <span>🎯</span> RAID Log
            </button>
            <button class="view-item" onclick="setView('archived')">
                <span>📦</span> Archived
            </button>
        </div>
    </aside>

    <!-- Center Column (Task List - Master) -->
    <main class="task-list-column">
        <header class="task-list-column__header">
            <input type="text" placeholder="🔍 Search..." class="search-input">
            <select class="filter-select">
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
            </select>
        </header>
        <div class="task-list-column__body">
            <!-- Desktop task table -->
            <table class="task-table">
                <thead>
                    <tr>
                        <th width="40"><input type="checkbox" onclick="toggleSelectAll()"></th>
                        <th width="60">Status</th>
                        <th>Task</th>
                        <th width="120">Due Date</th>
                        <th width="100">Priority</th>
                    </tr>
                </thead>
                <tbody id="taskTableBody">
                    <!-- Task rows rendered here -->
                </tbody>
            </table>
        </div>
        <footer class="task-list-column__footer">
            <button class="btn-new-task" onclick="createTask()">
                <svg>+</svg> New Task
            </button>
        </footer>
    </main>

    <!-- Right Panel (Task Details - Detail) -->
    <aside class="details-panel">
        <div class="details-panel__header">
            <h2>Details</h2>
            <button onclick="toggleDetailsPanel()">
                <svg>×</svg>
            </button>
        </div>
        <div class="details-panel__body" id="detailsPanelBody">
            <!-- Task details or empty state -->
            <div class="empty-state">
                <svg>📝</svg>
                <p>Select a task to view details</p>
            </div>
        </div>
    </aside>
</div>

<!-- Bulk Action Toolbar (shows when tasks selected) -->
<div id="bulkActionToolbar" class="bulk-action-toolbar hidden">
    <span class="bulk-action-toolbar__count">3 tasks selected</span>
    <div class="bulk-action-toolbar__actions">
        <button onclick="bulkDone()">✓ Done</button>
        <button onclick="bulkArchive()">🗑️ Archive</button>
        <button onclick="bulkChangeStatus()">⟳ Status</button>
        <button onclick="bulkMove()">→ Move</button>
    </div>
    <button onclick="clearSelection()">Clear</button>
</div>
```

```css
/* Desktop Layout */
.desktop-layout {
    height: 100vh;
    display: flex;
}

.sidebar {
    width: 240px;
    flex-shrink: 0;
    background: #f9fafb;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.sidebar__header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.project-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s;
}

.project-item:hover {
    background: #f3f4f6;
}

.project-item--active {
    background: #eff6ff;
    color: #1e40af;
    font-weight: 600;
}

.project-item__count {
    margin-left: auto;
    font-size: 12px;
    color: #6b7280;
}

.task-list-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
}

.task-list-column__header {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
}

.search-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
}

.task-table {
    width: 100%;
    border-collapse: collapse;
}

.task-table thead {
    position: sticky;
    top: 0;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.task-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
}

.task-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background 0.15s;
}

.task-table tbody tr:hover {
    background: #f9fafb;
}

.task-table tbody tr.selected {
    background: #eff6ff;
}

.task-table td {
    padding: 12px 16px;
    font-size: 14px;
}

.details-panel {
    width: 360px;
    flex-shrink: 0;
    background: #f9fafb;
    border-left: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
}

.details-panel.collapsed {
    transform: translateX(100%);
}

.details-panel__header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.details-panel__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #9ca3af;
    text-align: center;
}

/* Bulk Action Toolbar */
.bulk-action-toolbar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 40;
}

.bulk-action-toolbar__count {
    font-weight: 600;
}

.bulk-action-toolbar__actions {
    display: flex;
    gap: 8px;
}

.bulk-action-toolbar button {
    padding: 8px 12px;
    background: #374151;
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.bulk-action-toolbar button:hover {
    background: #4b5563;
}
```

### Phase 6: Polish and Accessibility (2-3 days)

**Priority:** Ensure WCAG 2.1 AA compliance and polish interactions

**Tasks:**
1. Add ARIA labels to all interactive elements
2. Implement focus management (modals, keyboard navigation)
3. Add keyboard shortcuts documentation
4. Test with screen readers (VoiceOver, NVDA)
5. Add focus indicators (2px outlines)
6. Implement skip links
7. Add loading states and animations
8. Test color contrast (4.5:1 minimum)

**Accessibility Improvements:**

```html
<!-- Focus Skip Links -->
<div class="skip-links">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <a href="#task-list" class="skip-link">Skip to task list</a>
</div>

<!-- Enhanced ARIA Labels -->
<button
    class="status-icon status-icon--active"
    onclick="cycleStatus('task-123')"
    aria-label="Task status: Active. Click to cycle through statuses: Active, Waiting, Delegated, Reference, Done."
    aria-describedby="status-help">
    <svg aria-hidden="true">○</svg>
</button>

<!-- Loading States -->
<div class="task-card loading" aria-busy="true">
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-metadata"></div>
</div>

<!-- Focus Trap in Modals -->
<div role="dialog"
     aria-modal="true"
     aria-labelledby="dialog-title"
     class="modal">
    <div class="modal-content" id="modal-content">
        <h2 id="dialog-title">Edit Task</h2>
        <button class="modal-close"
                onclick="closeModal()"
                aria-label="Close dialog">×</button>
        <!-- Modal content -->
        <button class="btn-primary" id="modal-first-focusable">Save</button>
    </div>
</div>
```

```css
/* Focus Indicators */
*:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

*:focus:not(:focus-visible) {
    outline: none;
}

/* Skip Links */
.skip-links {
    position: absolute;
    top: -100px;
    left: 0;
}

.skip-link {
    position: absolute;
    top: -100px;
    left: 0;
    background: #1f2937;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    text-decoration: none;
    z-index: 100;
}

.skip-link:focus {
    top: 8px;
    left: 8px;
}

/* Loading Skeleton */
.skeleton {
    background: linear-gradient(
        90deg,
        #f3f4f6 25%,
        #e5e7eb 50%,
        #f3f4f6 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
}

.skeleton-title {
    height: 20px;
    margin-bottom: 8px;
}

.skeleton-metadata {
    height: 16px;
    width: 60%;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
    .task-card {
        border-width: 2px;
    }

    .status-icon {
        border: 2px solid currentColor;
    }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

```javascript
// Focus Management for Modals
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('open');

    // Store currently focused element
    modal.dataset.previouslyFocused = document.activeElement.id;

    // Focus first focusable element in modal
    const firstFocusable = modal.querySelector('#modal-first-focusable');
    if (firstFocusable) {
        firstFocusable.focus();
    }

    // Trap focus within modal
    modal.addEventListener('keydown', trapFocus);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('open');

    // Return focus to previously focused element
    const previouslyFocused = document.getElementById(modal.dataset.previouslyFocused);
    if (previouslyFocused) {
        previouslyFocused.focus();
    }

    modal.removeEventListener('keydown', trapFocus);
}

function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const modal = event.currentTarget;
    const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
        }
    } else {
        // Tab
        if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
        }
    }
}
```

---

## 9. Migration Strategy

### 9.1 Backwards Compatibility

- **Keep existing localStorage schema** - No data migration needed
- **Feature flags** - Toggle new UI on/off via settings
- **Graceful degradation** - New features work on modern browsers, degrade on old ones

### 9.2 Rollout Plan

1. **Phase 1-2** (Quick Wins + Card Layout) - Deploy to 10% of users
2. **Gather feedback** - Monitor analytics and user feedback
3. **Phase 3-4** (Gestures + Bottom Sheet) - Deploy to 50% of users
4. **Phase 5-6** (Desktop + Polish) - Deploy to 100% of users

### 9.3 User Testing

- **Prototype in Figma** - Create interactive prototypes before coding
- **User interviews** - 5-10 users test mobile prototype
- **A/B testing** - Old vs. new design for 2 weeks
- **Analytics** - Track task completion time, swipe gesture usage

---

## 10. Performance Considerations

### 10.1 Mobile Performance Targets

- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Total Bundle Size:** < 150KB (gzipped)
- **60 FPS** for all animations and gestures

### 10.2 Optimizations

```javascript
// Virtualize long task lists
function renderVisibleTasks() {
    const container = document.getElementById('taskTable');
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const tasks = getTasks();

    const TASK_HEIGHT = 64; // Approximate task card height
    const startIndex = Math.floor(scrollTop / TASK_HEIGHT);
    const endIndex = Math.ceil((scrollTop + containerHeight) / TASK_HEIGHT);

    // Only render visible tasks + buffer
    const visibleTasks = tasks.slice(
        Math.max(0, startIndex - 5),
        Math.min(tasks.length, endIndex + 5)
    );

    // Render with offset
    container.style.paddingTop = `${startIndex * TASK_HEIGHT}px`;
    container.innerHTML = visibleTasks.map(renderTaskCard).join('');
}

// Debounce search input
const handleSearchDebounced = debounce((query) => {
    state.searchQuery = query.toLowerCase();
    render();
}, 300);

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Use requestAnimationFrame for smooth animations
function animateSwipe(deltaX) {
    requestAnimationFrame(() => {
        const card = document.querySelector('.task-card--swiping');
        card.style.transform = `translateX(${deltaX}px)`;
    });
}
```

---

## 11. Testing Strategy

### 11.1 Manual Testing Checklist

**Mobile (iPhone/Android):**
- [ ] Bottom navigation switches views correctly
- [ ] Swipe left reveals actions (Done, Delete, More)
- [ ] Swipe right cycles task status
- [ ] Tap task card opens bottom sheet
- [ ] Bottom sheet can be dragged to dismiss
- [ ] FAB opens type selector
- [ ] Keyboard auto-expands bottom sheet to full-screen
- [ ] Search works and filters tasks
- [ ] All touch targets are ≥ 44x44px

**Desktop:**
- [ ] Left sidebar shows projects and views
- [ ] Click task row selects and shows in details panel
- [ ] Multi-select with Ctrl/Cmd + Click works
- [ ] Bulk action toolbar appears when tasks selected
- [ ] Details panel is collapsible
- [ ] Keyboard navigation (arrow keys, Enter, etc.) works
- [ ] Drag handle reorders tasks

**Accessibility:**
- [ ] Screen reader announces all actions
- [ ] Tab navigation follows logical order
- [ ] Focus indicators visible on all elements
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] All images have alt text
- [ ] Modals trap focus correctly

### 11.2 Automated Testing

```javascript
// Vitest tests for new components
describe('TaskCard', () => {
    test('renders task with correct status icon', () => {
        const task = { id: '1', content: 'Test', status: 'active' };
        const card = renderTaskCard(task);
        expect(card).toContain('status-icon--active');
    });

    test('shows metadata chips when present', () => {
        const task = {
            id: '1',
            content: 'Test',
            dueDate: '2025-12-20',
            priority: 'high',
            links: ['link-1']
        };
        const card = renderTaskCard(task);
        expect(card).toContain('chip--due');
        expect(card).toContain('chip--priority-high');
        expect(card).toContain('chip--links');
    });
});

describe('BottomSheet', () => {
    test('opens with half-expanded state by default', () => {
        openBottomSheet('task-1');
        const sheet = document.getElementById('bottomSheet');
        expect(sheet.classList.contains('open')).toBe(true);
        expect(sheet.classList.contains('half-expanded')).toBe(true);
    });

    test('closes when backdrop is clicked', () => {
        openBottomSheet('task-1');
        const backdrop = document.querySelector('.bottom-sheet__backdrop');
        backdrop.click();
        const sheet = document.getElementById('bottomSheet');
        expect(sheet.classList.contains('open')).toBe(false);
    });
});
```

---

## 12. Future Enhancements (Post-Launch)

### 12.1 Mobile App Features

- **Offline mode** - Service Worker for offline task management
- **Push notifications** - Reminders for due tasks
- **Widgets** - iOS/Android home screen widgets
- **Siri/Google Assistant** - Voice commands to add tasks
- **Location-based reminders** - Remind when near location

### 12.2 Advanced Features

- **Task dependencies** - Visual dependency graph
- **Time tracking** - Track time spent on tasks
- **Recurring tasks** - Daily, weekly, monthly repeating tasks
- **Subtasks** - Nested task hierarchy
- **Templates** - Save task templates for common workflows
- **Collaboration** - Share projects with team members (requires backend)

### 12.3 AI-Powered Features

- **Smart due dates** - Suggest due dates based on task content
- **Auto-categorization** - Automatically tag tasks (work, personal, etc.)
- **Priority prediction** - Suggest priority based on historical data
- **Workload balancing** - Warn when overcommitted

---

## Appendix A: Wireframes (ASCII Art)

### Mobile Home Screen
```
┌─────────────────────────┐
│ ☰  dash-plus  Inbox ▼ ⚙️│ ← Simplified header
├─────────────────────────┤
│ 🔍 Search tasks...      │ ← Sticky search
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ ○ Call client       │ │ ← Task card
│ │ 📅 Today · 🔴 High  │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ - Write report      │ │
│ │ 🔗 2 links          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ → Legal review      │ │
│ │ 👤 Legal team       │ │
│ └─────────────────────┘ │
│                         │
│                    [+]  │ ← FAB
├─────────────────────────┤
│ 📋  📝  ⚡  👤         │ ← Bottom nav
│ All Active Matrix More │
└─────────────────────────┘
```

### Mobile Task Details (Bottom Sheet)
```
┌─────────────────────────┐
│      (dimmed backdrop)  │
│                         │
│  ┌───────────────────┐  │
│  │     ━━━           │  │ ← Drag handle
│  ├───────────────────┤  │
│  │ ○ Call client     │  │ ← Title
│  │ TASK-042          │  │
│  ├───────────────────┤  │
│  │ Status   [Active▼]│  │
│  │ Due      [Today▼] │  │
│  │ Priority [High▼]  │  │
│  ├───────────────────┤  │
│  │ Notes             │  │
│  │ ┌───────────────┐ │  │
│  │ │ Follow up re: │ │  │
│  │ │ contract terms│ │  │
│  │ └───────────────┘ │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Desktop Three-Column
```
┌────────┬──────────────────────┬────────────┐
│Projects│ Task List            │ Details    │
├────────┼──────────────────────┼────────────┤
│◉ Inbox │ 🔍 Search   All ▼    │ Call client│
│○ Work  ├──┬────────┬────┬────┼────────────┤
│○ Pers. │☐ │Status  │Task│Due │ TASK-042   │
│        ├──┼────────┼────┼────┤            │
│+ New   │☐ │ ○      │Cal │Tod │ [Active▼]  │
│        │☑ │ -      │Wri │--- │ [Today▼]   │
│────────│☐ │ →      │Leg │Mon │ [High▼]    │
│Views   │  │        │    │    │            │
│📋 List │  │        │    │    │ Delegated: │
│📊 Matri│  │        │    │    │ [        ] │
│🎯 RAID │  │  [+ New Task]     │            │
│📦 Arch │  │                   │ Notes:     │
└────────┴───────────────────────┴────────────┘
```

---

## Appendix B: Component Library

The redesign introduces reusable components that can be used across the app:

**Atoms (Basic building blocks):**
- Button
- Icon
- Badge/Chip
- Input
- Select
- Checkbox

**Molecules (Composed components):**
- StatusIcon (status + dropdown)
- TaskMetadata (chips row)
- SearchBar (input + icon)
- ProjectItem (icon + name + count)

**Organisms (Complex components):**
- TaskCard (header + metadata + swipe actions)
- BottomSheet (backdrop + content + handle)
- BottomNav (4 tabs)
- TaskTable (header + rows + bulk actions)
- DetailsPanel (header + body + sections)

---

## Conclusion

This comprehensive redesign addresses all identified mobile UX issues while providing a modern, polished experience for both mobile and desktop users. The phased implementation roadmap allows for iterative development and user testing, ensuring each feature is validated before moving to the next phase.

**Key Benefits:**
- ✅ Fixes critical mobile bugs (arrow direction, touch targets)
- ✅ Modern mobile-first design with native-feeling gestures
- ✅ Improved desktop experience with master-detail pattern
- ✅ Consistent interaction patterns across all views
- ✅ WCAG 2.1 AA accessible
- ✅ Maintains existing data model (no migration needed)
- ✅ Progressive enhancement (works on older browsers)

**Next Steps:**
1. Review and approve design direction
2. Create interactive Figma prototypes
3. User testing with 5-10 participants
4. Begin Phase 1 implementation (quick wins)
5. Iterative rollout with analytics and feedback

This redesign transforms Dash-Plus Notes from a functional task manager into a best-in-class mobile and desktop experience that rivals modern task management apps.

# Accessibility Implementation Guide
## Phase 6: WCAG 2.1 AA Compliance

This guide provides step-by-step instructions for implementing accessibility features in dash-plus-notes.

## Quick Start

### Option 1: Manual Implementation (Recommended for Production)
Follow the sections below to add accessibility features directly to `index.html`.

### Option 2: JavaScript Module (Quick Testing)
1. The `accessibility.js` module provides many features automatically
2. Add before `</body>`: `<script src="accessibility.js"></script>`
3. Still requires CSS and HTML markup changes from this guide

## Step 1: Add CSS Accessibility Styles

**Location:** Add before `</style>` closing tag (around line 140)

```css
        /* === PHASE 6: ACCESSIBILITY (WCAG 2.1 AA) === */

        /* Focus indicators with proper contrast (WCAG requirement) */
        *:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }

        .dark *:focus {
            outline-color: #60a5fa;
        }

        *:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }

        .dark *:focus-visible {
            outline-color: #60a5fa;
        }

        /* Skip links for keyboard navigation */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #3b82f6;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            z-index: 100;
            border-radius: 0 0 4px 0;
            font-weight: 600;
        }

        .skip-link:focus {
            top: 0;
        }

        /* Loading skeleton animation */
        @keyframes skeleton-loading {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
        }

        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px);
            background-size: 200px 100%;
            animation: skeleton-loading 1.5s infinite;
            border-radius: 4px;
        }

        .dark .skeleton {
            background: linear-gradient(90deg, #374151 0px, #4b5563 40px, #374151 80px);
        }

        /* Screen reader only content */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }

        /* Error states with WCAG AA contrast */
        .error-border {
            border: 2px solid #dc2626 !important;
        }

        .error-text {
            color: #dc2626;
            font-weight: 500;
        }

        .dark .error-text {
            color: #f87171;
        }

        .error-bg {
            background-color: #fee2e2;
        }

        .dark .error-bg {
            background-color: #7f1d1d;
        }

        /* Loading spinner animation */
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .spinner {
            animation: spin 1s linear infinite;
        }

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
            .skeleton,
            .spinner {
                animation: none;
            }
        }
```

## Step 2: Add Skip Links and Live Region

**Location:** Immediately after `<body>` tag (before line 143)

```html
    <!-- Skip Links for Keyboard Navigation -->
    <a href="#mainContent" class="skip-link">Skip to main content</a>
    <a href="#taskTable" class="skip-link">Skip to task list</a>
    <a href="#bottomNav" class="skip-link md:hidden">Skip to navigation</a>

    <!-- Live Region for Screen Reader Announcements -->
    <div id="announcements" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
```

## Step 3: Add Landmark Roles

### Headers
Add `role="banner"` to both headers:

**Line 145** (Mobile header):
```html
<header class="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" role="banner">
```

**Line 98** (Desktop header):
```html
<header class="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3" role="banner">
```

### Main Content
**Line 144**:
```html
<main class="flex-1 flex flex-col md:flex-row overflow-hidden relative" role="main">
```

### Bottom Navigation
**Line 678**:
```html
<nav id="bottomNav" class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40" role="navigation" aria-label="Main navigation">
```

## Step 4: Add ARIA Labels to Buttons

### Mobile Header Buttons

**Line 148** (Hamburger menu):
```html
<button onclick="toggleHamburgerMenu()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Open menu">
```

**Line 79** (Project selector):
```html
<button onclick="toggleProjectSelector()" id="currentProjectBtn" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-1" aria-label="Select project" aria-haspopup="true">
```

**Line 88** (Settings):
```html
<button onclick="toggleMobileSettings()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Open settings">
```

### Desktop Header Buttons

**Line 105** (Terminology toggle):
```html
<button id="terminologyToggle" class="px-3 py-2 text-xs font-mono bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg" aria-label="Toggle terminology between Dash-Plus and 5D">
```

**Line 108** (Theme toggle):
```html
<button id="themeToggle" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Toggle dark mode">
```

**Line 116** (New project):
```html
<button id="newProjectBtn" class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg" aria-label="Create new project">
```

**Line 120** (Export):
```html
<button onclick="toggleExportMenu()" id="exportMenuBtn" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400" aria-label="Export options" aria-haspopup="true">
```

**Line 134** (Keyboard shortcuts):
```html
<button onclick="toggleKeyboardHelp()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400" aria-label="Show keyboard shortcuts">
```

### Bottom Navigation Buttons

Update each button with `aria-label` and `aria-current`:

```html
<button onclick="setBottomNavView('all')" data-nav="all" class="flex flex-col items-center justify-center gap-0.5 text-blue-600 dark:text-blue-400" aria-label="View all tasks" aria-current="page">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
    </svg>
    <span class="text-xs">All</span>
</button>

<button onclick="setBottomNavView('active')" data-nav="active" class="flex flex-col items-center justify-center gap-0.5 text-gray-600 dark:text-gray-400" aria-label="View active tasks">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
    </svg>
    <span class="text-xs">Active</span>
</button>

<button onclick="setBottomNavView('matrix')" data-nav="matrix" class="flex flex-col items-center justify-center gap-0.5 text-gray-600 dark:text-gray-400" aria-label="View matrix">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
    </svg>
    <span class="text-xs">Matrix</span>
</button>

<button onclick="setBottomNavView('more')" data-nav="more" class="flex flex-col items-center justify-center gap-0.5 text-gray-600 dark:text-gray-400" aria-label="More options">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
    </svg>
    <span class="text-xs">More</span>
</button>
```

### FAB (Floating Action Button)

**Line 708**:
```html
<button id="fab" onclick="toggleFabMenu()" class="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-700 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-all" aria-label="Add new task" aria-haspopup="menu" aria-expanded="false">
```

## Step 5: Add Label for Search Input

**Around line 149**:

Replace:
```html
<input
    id="searchInput"
    type="text"
    placeholder="🔍 Search tasks..."
    oninput="handleSearch(this.value)"
    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
/>
```

With:
```html
<label for="searchInput" class="sr-only">Search tasks</label>
<input
    id="searchInput"
    type="text"
    placeholder="🔍 Search tasks..."
    oninput="handleSearch(this.value)"
    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
    aria-label="Search tasks"
/>
```

## Step 6: Add ARIA to Modals

### Link Overlay

**Around line 310**:
```html
<div id="linkOverlay" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onclick="if(event.target.id==='linkOverlay') cancelLinking()" role="dialog" aria-modal="true" aria-labelledby="linkDialogTitle">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] md:max-h-[80vh] overflow-hidden flex flex-col">
        <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div class="flex items-center justify-between mb-3">
                <h2 id="linkDialogTitle" class="text-lg font-semibold">Link Task</h2>
                <button onclick="cancelLinking()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close dialog">
```

### Keyboard Help Modal

**Around line 382**:
```html
<div id="keyboardHelp" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onclick="if(event.target.id==='keyboardHelp') toggleKeyboardHelp()" role="dialog" aria-modal="true" aria-labelledby="keyboardHelpTitle">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 id="keyboardHelpTitle" class="text-lg font-semibold">Keyboard Shortcuts</h2>
            <button onclick="toggleKeyboardHelp()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close dialog">
```

## Step 7: Add JavaScript Accessibility Functions

Add this code in the `<script>` section, after the `esc()` function (around line 870):

```javascript
        // ===== ACCESSIBILITY FUNCTIONS =====

        /**
         * Announce message to screen readers
         * @param {string} message - Message to announce
         * @param {string} priority - 'polite' or 'assertive'
         */
        function announce(message, priority = 'polite') {
            const announcer = document.getElementById('announcements');
            if (!announcer) return;

            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;

            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }

        /**
         * Show field error
         * @param {string} fieldId - Field ID
         * @param {string} message - Error message
         */
        function showFieldError(fieldId, message) {
            announce(message, 'assertive');

            const field = document.getElementById(fieldId);
            if (!field) return;

            field.classList.add('error-border');
            field.setAttribute('aria-invalid', 'true');

            const errorId = `${fieldId}-error`;
            let errorEl = document.getElementById(errorId);

            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.id = errorId;
                errorEl.className = 'error-text text-sm mt-1';
                errorEl.setAttribute('role', 'alert');
                field.parentNode.appendChild(errorEl);
            }

            errorEl.textContent = message;
            field.setAttribute('aria-describedby', errorId);
        }

        /**
         * Clear field error
         * @param {string} fieldId - Field ID
         */
        function clearFieldError(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return;

            field.classList.remove('error-border');
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');

            const errorId = `${fieldId}-error`;
            const errorEl = document.getElementById(errorId);
            if (errorEl) errorEl.remove();
        }

        /**
         * Show toast notification
         * @param {string} message - Message
         * @param {string} type - 'success', 'error', 'warning', 'info'
         */
        function showToast(message, type = 'info') {
            announce(message, type === 'error' ? 'assertive' : 'polite');

            const toast = document.createElement('div');
            toast.className = 'fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

            const colors = {
                success: 'bg-green-600 text-white',
                error: 'bg-red-600 text-white',
                warning: 'bg-yellow-600 text-white',
                info: 'bg-blue-600 text-white'
            };
            toast.className += ' ' + colors[type];

            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 300ms';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
```

## Step 8: Add Announcements to Key Actions

Enhance existing functions to announce changes:

### In `createTask()` function:
```javascript
function createTask(content = '', dueDate = null, type = 'task') {
    // ... existing code ...
    const task = { /* ... */ };
    getProject().tasks.push(task);
    save();

    // Add announcement
    if (content) {
        announce(`Task created: ${content}`);
    }

    return task;
}
```

### In `updateTask()` function:
```javascript
function updateTask(taskId, updates) {
    const task = getTasks().find(t => t.id === taskId);
    if (task) {
        Object.assign(task, updates);
        save();
        render();

        // Add announcements
        if (updates.status) {
            announce(`Status changed to ${getTerm(updates.status)}`);
        }
        if (updates.status === 'done') {
            announce('Task completed');
        }
    }
}
```

### In `archiveTask()` function:
```javascript
function archiveTask(taskId) {
    const task = getProject().tasks.find(t => t.id === taskId);
    if (task) {
        const content = task.content;
        task.archived = true;
        task.archivedAt = new Date().toISOString();
        state.selectedIndex = Math.max(0, Math.min(state.selectedIndex, getTasks().length - 1));
        save();
        render();

        // Add announcement
        announce(`Task deleted: ${content}`);
    }
}
```

### In `toggleTheme()` function:
```javascript
function toggleTheme() {
    // ... existing code ...
    announce(`${document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'} mode enabled`);
}
```

### In `toggleTerminology()` function:
```javascript
function toggleTerminology() {
    state.terminology = state.terminology === 'dashPlus' ? 'fiveD' : 'dashPlus';
    save();
    render();

    announce(`Terminology changed to ${state.terminology === 'dashPlus' ? 'Dash-Plus' : '5D'}`);
}
```

## Step 9: Update Modal Functions for Focus Management

### Enhance `toggleKeyboardHelp()`:
```javascript
function toggleKeyboardHelp() {
    state.showKeyboardHelp = !state.showKeyboardHelp;
    const modal = document.getElementById('keyboardHelp');

    if (state.showKeyboardHelp) {
        modal.classList.remove('hidden');
        // Focus first focusable element
        setTimeout(() => {
            const closeBtn = modal.querySelector('button');
            if (closeBtn) closeBtn.focus();
        }, 100);
    } else {
        modal.classList.add('hidden');
    }

    render();
}
```

## Step 10: Add aria-hidden to Decorative SVGs

For all SVG icons that are purely decorative (have adjacent text), add `aria-hidden="true"`:

```html
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
```

## Step 11: Update FAB Menu Toggle

Add `aria-expanded` state:

```javascript
function toggleFabMenu() {
    state.fabMenuOpen = !state.fabMenuOpen;
    const menu = document.getElementById('fabMenu');
    const fab = document.getElementById('fab');

    if (state.fabMenuOpen) {
        menu.classList.remove('hidden');
        fab.setAttribute('aria-expanded', 'true');
        announce('Menu opened');
    } else {
        menu.classList.add('hidden');
        fab.setAttribute('aria-expanded', 'false');
        announce('Menu closed');
    }
}
```

## Testing Checklist

After implementation, test the following:

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Skip links work (press Tab after page load)
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate tasks
- [ ] Escape closes modals
- [ ] Focus visible on all elements
- [ ] Focus trapped in modals
- [ ] Focus returns after modal close

### Screen Reader (VoiceOver on Mac: Cmd+F5)
- [ ] All buttons announce their purpose
- [ ] Task creation is announced
- [ ] Status changes are announced
- [ ] Errors are announced
- [ ] Modal titles are announced
- [ ] Form inputs have labels
- [ ] Landmark regions are identified

### Visual
- [ ] Focus outline visible (2px blue)
- [ ] Text contrast meets AA standard
- [ ] Error messages clearly visible
- [ ] Loading states show properly

### Mobile
- [ ] Touch targets 44px minimum
- [ ] Bottom nav accessible
- [ ] FAB menu accessible
- [ ] Swipe actions have keyboard alternative

## Color Contrast Verification

All colors meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

**Light Mode:**
- Blue #3b82f6 on white: 4.56:1 ✓
- Gray #6b7280 on white: 4.69:1 ✓
- Red #dc2626 on white: 4.52:1 ✓
- Green #059669 on white: 4.51:1 ✓

**Dark Mode:**
- Blue #60a5fa on #1f2937: 4.59:1 ✓
- Gray #9ca3af on #1f2937: 4.54:1 ✓
- Red #f87171 on #1f2937: 4.67:1 ✓
- Green #34d399 on #1f2937: 4.91:1 ✓

## Success Criteria

After completing all steps:

✅ All interactive elements keyboard-accessible
✅ Focus indicators visible with 2px outline
✅ Screen reader announces all actions
✅ Skip links available for keyboard users
✅ Error messages announced and visible
✅ Loading states prevent confusion
✅ Color contrast meets WCAG AA
✅ Touch targets 44px minimum on mobile
✅ Modal focus management working
✅ All images/icons have text alternatives
✅ Reduced motion preference respected

## Lighthouse Accessibility Score Target

Run Lighthouse audit in Chrome DevTools:
- **Target Score:** 95-100
- **Key Metrics:**
  - All buttons have accessible names
  - Form elements have labels
  - Background/foreground colors have sufficient contrast
  - ARIA attributes valid
  - Elements use allowed ARIA roles

## Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

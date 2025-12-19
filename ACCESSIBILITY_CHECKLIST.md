# Accessibility Implementation Checklist

Use this checklist to track implementation progress and verify all accessibility features are properly added.

## Pre-Implementation

- [ ] Read `PHASE6_README.md` for overview
- [ ] Read `ACCESSIBILITY_IMPLEMENTATION_GUIDE.md` thoroughly
- [ ] Backup `index.html`: `cp index.html index.html.backup`
- [ ] Open `index.html` in your editor
- [ ] Have browser DevTools open for testing

## Step 1: CSS Accessibility Styles

- [ ] Locate `</style>` closing tag (around line 140)
- [ ] Add focus indicator styles (`*:focus`, `*:focus-visible`)
- [ ] Add skip link styles (`.skip-link`)
- [ ] Add loading skeleton styles (`.skeleton`, `@keyframes skeleton-loading`)
- [ ] Add screen reader only styles (`.sr-only`)
- [ ] Add error state styles (`.error-border`, `.error-text`, `.error-bg`)
- [ ] Add spinner styles (`.spinner`, `@keyframes spin`)
- [ ] Add reduced motion support (`@media (prefers-reduced-motion)`)
- [ ] Verify CSS syntax (no errors in DevTools console)

## Step 2: Skip Links and Live Region

- [ ] Locate `<body>` tag (around line 142)
- [ ] Add skip link to main content (`href="#mainContent"`)
- [ ] Add skip link to task list (`href="#taskTable"`)
- [ ] Add skip link to navigation (`href="#bottomNav"`) with `md:hidden`
- [ ] Add live region div (`id="announcements"` with proper ARIA attributes)
- [ ] Test: Press Tab after page load → Skip links appear
- [ ] Test: Press Enter on skip link → Jumps to content

## Step 3: Landmark Roles

### Headers
- [ ] Add `role="banner"` to mobile header (line ~145)
- [ ] Add `role="banner"` to desktop header (line ~98)
- [ ] Verify: Screen reader announces "banner" when focused

### Main Content
- [ ] Add `role="main"` to main element (line ~144)
- [ ] Verify: Screen reader announces "main" when focused

### Navigation
- [ ] Add `role="navigation"` to bottom nav (line ~678)
- [ ] Add `aria-label="Main navigation"` to bottom nav
- [ ] Verify: Screen reader announces "Main navigation, navigation"

## Step 4: ARIA Labels on Mobile Header Buttons

- [ ] Hamburger button: Add `aria-label="Open menu"` (line ~148)
- [ ] Project selector: Add `aria-label="Select project" aria-haspopup="true"` (line ~79)
- [ ] Settings button: Add `aria-label="Open settings"` (line ~88)
- [ ] Test: Tab to each button → Screen reader announces label

## Step 5: ARIA Labels on Desktop Header Buttons

- [ ] Terminology toggle: Add `aria-label="Toggle terminology between Dash-Plus and 5D"` (line ~105)
- [ ] Theme toggle: Add `aria-label="Toggle dark mode"` (line ~108)
- [ ] New project: Add `aria-label="Create new project"` (line ~116)
- [ ] Export: Add `aria-label="Export options" aria-haspopup="true"` (line ~120)
- [ ] Keyboard shortcuts: Add `aria-label="Show keyboard shortcuts"` (line ~134)
- [ ] Test: Tab to each button → Screen reader announces label

## Step 6: Bottom Navigation ARIA

- [ ] All tasks button: Add `aria-label="View all tasks"` and `aria-current="page"` when active
- [ ] Active tasks button: Add `aria-label="View active tasks"`
- [ ] Matrix button: Add `aria-label="View matrix"`
- [ ] More button: Add `aria-label="More options"`
- [ ] All SVG icons: Add `aria-hidden="true"`
- [ ] Test: Tab to each button → Screen reader announces purpose
- [ ] Test: Current page has `aria-current="page"`

## Step 7: FAB and Search Input

- [ ] FAB: Add `aria-label="Add new task" aria-haspopup="menu" aria-expanded="false"` (line ~708)
- [ ] Search input: Add `<label for="searchInput" class="sr-only">Search tasks</label>` before input (line ~149)
- [ ] Search input: Add `aria-label="Search tasks"` attribute
- [ ] Test: Focus search → Screen reader announces "Search tasks, edit text"
- [ ] Test: Focus FAB → Screen reader announces "Add new task, button, has popup"

## Step 8: Modal ARIA Attributes

### Link Overlay
- [ ] Add `role="dialog" aria-modal="true" aria-labelledby="linkDialogTitle"` to overlay
- [ ] Add `id="linkDialogTitle"` to "Link Task" heading
- [ ] Add `aria-label="Close dialog"` to close button
- [ ] Test: Open modal → Screen reader announces "Link Task, dialog"

### Keyboard Help Modal
- [ ] Add `role="dialog" aria-modal="true" aria-labelledby="keyboardHelpTitle"` to modal
- [ ] Add `id="keyboardHelpTitle"` to "Keyboard Shortcuts" heading
- [ ] Add `aria-label="Close dialog"` to close button
- [ ] Test: Press `?` → Screen reader announces "Keyboard Shortcuts, dialog"

### Hamburger Menu
- [ ] Add `role="dialog" aria-modal="true" aria-labelledby="hamburgerMenuTitle"` to menu
- [ ] Add `id="hamburgerMenuTitle"` to "Menu" heading
- [ ] Add `aria-label="Close menu"` to close button
- [ ] Test: Open menu → Screen reader announces "Menu, dialog"

## Step 9: JavaScript Accessibility Functions

- [ ] Locate end of `esc()` function (around line 870)
- [ ] Add `announce(message, priority)` function
- [ ] Add `showFieldError(fieldId, message)` function
- [ ] Add `clearFieldError(fieldId)` function
- [ ] Add `showToast(message, type)` function
- [ ] Verify no JavaScript syntax errors in console
- [ ] Test: Call `announce('Test')` in console → Announcements div updates

## Step 10: Add Announcements to Actions

### Task Creation
- [ ] Add `announce('Task created: ' + content)` in `createTask()` function
- [ ] Test: Create task → Screen reader announces creation

### Task Update
- [ ] Add status change announcement in `updateTask()`
- [ ] Add completion announcement when status changes to 'done'
- [ ] Test: Change status → Screen reader announces change
- [ ] Test: Mark done → Screen reader announces "Task completed"

### Task Deletion
- [ ] Add `announce('Task deleted: ' + content)` in `archiveTask()`
- [ ] Test: Delete task → Screen reader announces deletion

### Theme Toggle
- [ ] Add dark/light mode announcement in `toggleTheme()`
- [ ] Test: Toggle theme → Screen reader announces mode

### Terminology Toggle
- [ ] Add terminology change announcement in `toggleTerminology()`
- [ ] Test: Toggle terminology → Screen reader announces change

## Step 11: Focus Management

### Modal Opening
- [ ] Store `lastFocusedElement` before opening modal
- [ ] Focus first focusable element in modal
- [ ] Add focus trap keydown listener
- [ ] Test: Open modal → Focus moves to first button
- [ ] Test: Tab in modal → Focus stays trapped

### Modal Closing
- [ ] Remove focus trap listener
- [ ] Restore focus to `lastFocusedElement`
- [ ] Test: Close modal → Focus returns to trigger button

### Escape Key Handler
- [ ] Add global Escape key listener
- [ ] Close all overlays on Escape
- [ ] Announce "Closed" to screen readers
- [ ] Test: Press Escape in modal → Modal closes and focus restores

## Testing Phase

### Keyboard Navigation Testing

- [ ] Unplug mouse/trackpad
- [ ] Press Tab after page load → Skip links visible
- [ ] Press Enter on skip link → Jumps to target
- [ ] Tab through all interactive elements → All reachable
- [ ] Focus visible on all elements (blue outline)
- [ ] Press `n` → New task created
- [ ] Press `d` → Task marked done
- [ ] Press `s` → Status cycles
- [ ] Press `Enter` on task → Starts editing
- [ ] Press `Delete` on task → Task archived
- [ ] Press `?` → Help modal opens
- [ ] Press Escape in modal → Modal closes
- [ ] Press Tab in modal → Focus trapped (loops A→B→X→A)
- [ ] Arrow keys navigate tasks
- [ ] All actions work without mouse

### Screen Reader Testing (VoiceOver - Mac)

- [ ] Press Cmd+F5 to start VoiceOver
- [ ] Press Tab → Buttons announce their labels
- [ ] Press `H` → Jumps between headings
- [ ] Press `D` → Jumps between landmarks (banner, main, navigation)
- [ ] Create task → Announces "Task created: [content]"
- [ ] Change status → Announces "Status changed to [status]"
- [ ] Mark done → Announces "Task completed"
- [ ] Delete task → Announces "Task deleted: [content]"
- [ ] Open menu → Announces "Menu opened"
- [ ] Toggle theme → Announces mode change
- [ ] Open modal → Announces modal title
- [ ] Error occurs → Announces error message
- [ ] All form inputs have labels
- [ ] All buttons have meaningful names
- [ ] Press Cmd+F5 to stop VoiceOver

### Screen Reader Testing (NVDA - Windows)

- [ ] Start NVDA (Ctrl+Alt+N)
- [ ] Press Tab → Buttons announce labels
- [ ] Press B → Jumps between buttons
- [ ] Press H → Jumps between headings
- [ ] Press D → Jumps between landmarks
- [ ] Create task → Announces creation
- [ ] All actions announced properly
- [ ] All form inputs labeled
- [ ] Stop NVDA

### Visual Testing

- [ ] Focus outline visible (2px blue)
- [ ] Focus outline in dark mode (lighter blue)
- [ ] Skip links appear on Tab (blue background, white text)
- [ ] Error messages red with proper contrast
- [ ] Loading skeleton animates (light gray wave)
- [ ] Spinner rotates
- [ ] Toast notifications appear at bottom
- [ ] All text readable (not too light/dark)

### Color Contrast Testing

- [ ] Open WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- [ ] Test light mode combinations:
  - [ ] Blue `#3b82f6` on white → 4.5:1+ ✓
  - [ ] Gray `#6b7280` on white → 4.5:1+ ✓
  - [ ] Red `#dc2626` on white → 4.5:1+ ✓
  - [ ] Green `#059669` on white → 4.5:1+ ✓
- [ ] Toggle dark mode
- [ ] Test dark mode combinations:
  - [ ] Blue `#60a5fa` on `#1f2937` → 4.5:1+ ✓
  - [ ] Gray `#9ca3af` on `#1f2937` → 4.5:1+ ✓
  - [ ] Red `#f87171` on `#1f2937` → 4.5:1+ ✓
  - [ ] Green `#34d399` on `#1f2937` → 4.5:1+ ✓

### Mobile Testing

- [ ] Open Chrome DevTools
- [ ] Enable device mode (iPhone 12)
- [ ] All touch targets 44px+ height
- [ ] Bottom navigation buttons 44px+ height
- [ ] FAB button 44px+ diameter
- [ ] No horizontal scrolling
- [ ] Tap all buttons → Work properly
- [ ] Skip link to navigation appears (mobile only)

### Reduced Motion Testing

#### Mac:
- [ ] System Preferences → Accessibility → Display
- [ ] Check "Reduce motion"
- [ ] Reload page
- [ ] Skeleton animation disabled (static gradient)
- [ ] Spinner animation disabled (static icon)
- [ ] Transitions still work (instant instead of animated)
- [ ] Uncheck "Reduce motion"

#### Windows:
- [ ] Settings → Ease of Access → Display
- [ ] Turn on "Show animations in Windows"
- [ ] Reload page
- [ ] Animations disabled
- [ ] Transitions work

### Lighthouse Audit

- [ ] Open Chrome DevTools (F12)
- [ ] Go to Lighthouse tab
- [ ] Select "Accessibility" only
- [ ] Choose "Desktop" device
- [ ] Click "Analyze page load"
- [ ] Review score: Target 95-100
- [ ] Fix any reported issues:
  - [ ] All buttons have accessible names
  - [ ] Background/foreground colors have sufficient contrast
  - [ ] Form elements have labels
  - [ ] ARIA attributes are valid
  - [ ] Elements use allowed ARIA roles
- [ ] Re-run audit
- [ ] Achieve 95+ score

### WAVE Extension Test

- [ ] Install WAVE extension (https://wave.webaim.org/extension/)
- [ ] Click WAVE icon in browser
- [ ] Review report:
  - [ ] 0 Errors
  - [ ] Structural Elements present (banner, main, navigation)
  - [ ] All form labels present
  - [ ] ARIA labels present
  - [ ] Contrast errors: 0
- [ ] Fix any reported issues
- [ ] Re-run WAVE

## Post-Implementation

### Documentation

- [ ] Update main README.md with accessibility section
- [ ] Add accessibility badge (optional)
- [ ] Document known limitations
- [ ] List tested assistive technologies

### Code Review

- [ ] All CSS added correctly
- [ ] All HTML ARIA attributes present
- [ ] All JavaScript functions added
- [ ] No console errors
- [ ] No accessibility warnings in DevTools

### Git Commit

- [ ] Review all changes: `git diff index.html`
- [ ] Stage changes: `git add index.html`
- [ ] Commit with template message (see PHASE6_README.md)
- [ ] Include Lighthouse score in commit message

## Final Verification

- [ ] All checklist items completed
- [ ] Lighthouse accessibility: 95-100
- [ ] WAVE errors: 0
- [ ] Keyboard navigation: 100% functional
- [ ] Screen reader: All actions announced
- [ ] Color contrast: All pass WCAG AA
- [ ] Touch targets: All 44px+ on mobile
- [ ] Reduced motion: Respected
- [ ] No console errors
- [ ] No accessibility warnings

## Success Criteria

✅ **All interactive elements keyboard-accessible**
✅ **Focus indicators visible (2px blue outline)**
✅ **Screen reader announces all actions**
✅ **Skip links available for keyboard users**
✅ **Error messages announced and visible**
✅ **Loading states prevent confusion**
✅ **Color contrast meets WCAG AA (4.5:1)**
✅ **Touch targets 44px minimum on mobile**
✅ **Modal focus management working**
✅ **All images/icons have text alternatives**
✅ **Reduced motion preference respected**
✅ **Lighthouse accessibility score 95+**
✅ **WAVE extension shows 0 errors**
✅ **Manual screen reader test passes**
✅ **Manual keyboard test passes**

## Notes

- Mark items as complete: `- [x]`
- If an item fails, add a note: `- [ ] Item <!-- ISSUE: description -->`
- Re-test after fixes
- All items must be checked before committing

## Quick Stats

- **Total Tasks:** 150+
- **Estimated Time:** 2-3 hours implementation + 1 hour testing
- **Files Modified:** 1 (index.html)
- **Lines Added:** ~200-250
- **WCAG Level:** AA
- **Success Criteria Met:** 14+ (see PHASE6_SUMMARY.md)

---

**Good luck! You've got this!** 💪♿🎯

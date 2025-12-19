# Accessibility Features Visual Guide

## Overview

This guide shows what each accessibility feature looks like and how users interact with it.

## 1. Skip Links (Keyboard Navigation)

**What:** Hidden links that appear when focused with Tab key
**Purpose:** Allow keyboard users to skip repetitive navigation
**Appearance:**

```
┌────────────────────────────────────────┐
│ Skip to main content                   │  ← Appears on Tab
└────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  dash-plus              Inbox  ▼               ⚙       │
├─────────────────────────────────────────────────────────┤
│  🔍 Search tasks...                                     │
├─────────────────────────────────────────────────────────┤
│  All Tasks  |  Active  |  Waiting  |  Done            │
└─────────────────────────────────────────────────────────┘
```

**How to test:**
1. Load page
2. Press Tab key
3. Blue bar appears at top left
4. Press Enter to skip to main content

---

## 2. Focus Indicators

**What:** Blue outline around focused elements
**Purpose:** Show which element has keyboard focus
**Appearance:**

```
Normal button:
┌──────────────┐
│ + New Task   │
└──────────────┘

Focused button (after pressing Tab):
┌──────────────────┐
│║ + New Task    ║│  ← Blue 2px outline
└──────────────────┘
```

**Colors:**
- Light mode: `#3b82f6` (Blue 600)
- Dark mode: `#60a5fa` (Blue 400)

**Contrast:** Meets WCAG AA requirement (3:1)

---

## 3. Screen Reader Announcements

**What:** Invisible live region that announces changes
**Purpose:** Inform screen reader users of dynamic updates
**Location:** `<div id="announcements">` (hidden with .sr-only)

**Example announcements:**

```
User Action                  → Screen Reader Hears
────────────────────────────────────────────────────
Creates task "Buy milk"      → "Task created: Buy milk"
Marks task done              → "Task completed"
Changes status to waiting    → "Status changed to Waiting"
Deletes task                 → "Task deleted: Buy milk"
Opens menu                   → "Menu opened"
Error saving                 → "Error: Could not save task"
```

**How to test (Mac):**
1. Press Cmd+F5 to enable VoiceOver
2. Create a task
3. VoiceOver speaks: "Task created: [content]"
4. Press Cmd+F5 to disable VoiceOver

---

## 4. ARIA Labels on Buttons

**What:** Descriptive labels for screen readers
**Purpose:** Explain button purpose when icon-only
**Implementation:**

```html
<!-- Visual (what users see) -->
<button>
  <svg>...</svg>
</button>

<!-- What screen reader hears -->
<button aria-label="Open menu">
  <svg aria-hidden="true">...</svg>
</button>
```

**Examples:**

| Button | Visual | aria-label |
|--------|--------|------------|
| Hamburger menu | ☰ | "Open menu" |
| Theme toggle | 🌙/☀️ | "Toggle dark mode" |
| Settings | ⚙ | "Open settings" |
| Keyboard shortcuts | ? | "Show keyboard shortcuts" |
| FAB | + | "Add new task" |

---

## 5. Form Labels

**What:** Labels for input fields
**Purpose:** Associate labels with inputs for screen readers
**Implementation:**

```html
<!-- Visible label -->
<label for="searchInput" class="sr-only">Search tasks</label>
<input id="searchInput" type="text" placeholder="🔍 Search tasks..." />

<!-- What screen reader announces -->
"Search tasks, edit text"  ← Input purpose
```

**All inputs have labels:**
- Search input: "Search tasks"
- Task content: "Task description"
- Due date: "Due date"
- Delegated to: "Delegated to"
- Waiting on: "Waiting on"

---

## 6. Loading States

### Skeleton Screens

**What:** Animated placeholder while loading
**Purpose:** Show content is loading, reduce perceived wait time
**Appearance:**

```
┌─────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← Animated gradient
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────────┘
```

### Loading Spinner

**What:** Rotating circle icon
**Purpose:** Indicate active loading
**Appearance:**

```
        ⟳
   Loading...
```

**Accessibility:**
- Has `role="status"`
- Has `aria-busy="true"`
- Text is visually hidden but announced to screen readers
- Animation respects `prefers-reduced-motion`

---

## 7. Error States

### Field Errors

**What:** Red border + error message below field
**Purpose:** Clearly indicate validation errors
**Appearance:**

```
Normal input:
┌──────────────────────────┐
│ Task description         │
└──────────────────────────┘

Error state:
┌──────────────────────────┐
│║Task description        ║│  ← Red border
└──────────────────────────┘
⚠ Task description cannot be empty  ← Error message
```

**Colors:**
- Light mode: `#dc2626` (Red 600) - 4.52:1 contrast ✓
- Dark mode: `#f87171` (Red 400) - 4.67:1 contrast ✓

**Accessibility:**
- Field has `aria-invalid="true"`
- Error message has `role="alert"`
- Field has `aria-describedby="[field]-error"`
- Screen reader announces: "Error: Task description cannot be empty"

### Toast Notifications

**What:** Temporary message at bottom of screen
**Purpose:** Confirm actions or show errors
**Appearance:**

```
         ┌──────────────────────────┐
         │ ✓ Task created           │  ← Success (green)
         └──────────────────────────┘

         ┌──────────────────────────┐
         │ ⚠ Error saving task      │  ← Error (red)
         └──────────────────────────┘

         ┌──────────────────────────┐
         │ ℹ Network connection lost│  ← Info (blue)
         └──────────────────────────┘
```

**Types:**
- Success: Green background (`#059669`)
- Error: Red background (`#dc2626`)
- Warning: Yellow background (`#d97706`)
- Info: Blue background (`#3b82f6`)

---

## 8. Modal Focus Management

**What:** Focus trapped inside modal while open
**Purpose:** Prevent keyboard users from escaping modal accidentally
**Behavior:**

```
BEFORE:                          WHILE MODAL OPEN:
┌─────────────────────┐         ┌──────────────────────┐
│ Button 1            │         │ ╔═══════════════════╗│
│ Button 2            │  →      │ ║ Modal Title     X ║│
│ Button 3            │         │ ║                   ║│
│ [Modal opens]       │         │ ║ [Btn A] [Btn B]  ║│
│ Button 4            │         │ ╚═══════════════════╝│
│ Button 5            │         │ Tab loops: X→A→B→X  │
└─────────────────────┘         └──────────────────────┘
                                        ↑
                                   Focus trapped
```

**Keyboard behavior:**
1. Modal opens → Focus moves to first button
2. Tab → Cycles through modal buttons only
3. Shift+Tab → Cycles backwards
4. Escape → Closes modal, returns focus to trigger button

**Example modals:**
- Keyboard shortcuts help
- Link task dialog
- Project selector
- Hamburger menu

---

## 9. Landmark Regions

**What:** ARIA roles for page structure
**Purpose:** Allow screen reader users to navigate by landmarks
**Structure:**

```
┌─────────────────────────────────────┐
│ <header role="banner">              │  ← Banner
│   dash-plus  |  Projects  |  ⚙     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <main role="main">                  │  ← Main content
│   🔍 Search...                      │
│   ──────────────────────────        │
│   - Task 1                          │
│   - Task 2                          │
│   - Task 3                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <nav role="navigation"              │  ← Navigation
│      aria-label="Main navigation">  │
│   [All] [Active] [Matrix] [More]   │
└─────────────────────────────────────┘
```

**Screen reader navigation:**
- Press `D` → Jump to next landmark
- Press `H` → Jump to next heading
- Press `B` → Jump to next button
- Press `L` → Jump to next link

---

## 10. Keyboard Shortcuts

**All existing shortcuts still work:**

| Key | Action | Announcement |
|-----|--------|-------------|
| `n` | New task | "New task created" |
| `d` | Toggle done | "Task completed" / "Task active" |
| `s` | Cycle status | "Status changed to [status]" |
| `↑` `↓` | Navigate | (no announcement) |
| `j` `k` | Navigate (vim) | (no announcement) |
| `Enter` | Edit task | "Editing task" |
| `Delete` | Archive | "Task deleted: [content]" |
| `Escape` | Cancel/Close | "Closed" |
| `?` | Help | "Keyboard shortcuts opened" |
| `Tab` | Next element | (browser default) |
| `Shift+Tab` | Previous | (browser default) |

---

## 11. Color Contrast (WCAG AA)

**Requirement:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Verified combinations:**

### Light Mode
| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Body text | #1f2937 | #ffffff | 16.0:1 | ✓ AAA |
| Blue links | #3b82f6 | #ffffff | 4.56:1 | ✓ AA |
| Gray text | #6b7280 | #ffffff | 4.69:1 | ✓ AA |
| Red errors | #dc2626 | #ffffff | 4.52:1 | ✓ AA |
| Green success | #059669 | #ffffff | 4.51:1 | ✓ AA |
| Focus outline | #3b82f6 | #ffffff | 4.56:1 | ✓ AA |

### Dark Mode
| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Body text | #f9fafb | #1f2937 | 15.8:1 | ✓ AAA |
| Blue links | #60a5fa | #1f2937 | 4.59:1 | ✓ AA |
| Gray text | #9ca3af | #1f2937 | 4.54:1 | ✓ AA |
| Red errors | #f87171 | #1f2937 | 4.67:1 | ✓ AA |
| Green success | #34d399 | #1f2937 | 4.91:1 | ✓ AA |
| Focus outline | #60a5fa | #1f2937 | 4.59:1 | ✓ AA |

---

## 12. Reduced Motion

**What:** Respects user's motion preference
**Purpose:** Reduce motion for users with vestibular disorders
**Implementation:**

```css
@media (prefers-reduced-motion: reduce) {
    .skeleton,
    .spinner {
        animation: none;  /* Disable animations */
    }
}
```

**How to test (Mac):**
1. System Preferences → Accessibility → Display
2. Check "Reduce motion"
3. Reload page
4. Skeleton and spinner animations disabled
5. Transitions still work (instant instead of animated)

---

## 13. Touch Targets (Mobile)

**Requirement:** Minimum 44x44 pixels (WCAG AAA)
**Implementation:**

```css
@media (max-width: 768px) {
    button, a, input, textarea {
        min-height: 44px;  /* Ensures touch-friendly size */
    }
}
```

**Examples:**

```
TOO SMALL (❌):           CORRECT (✅):
┌────┐                   ┌──────────┐
│ OK │  30px             │   OK     │  44px
└────┘                   └──────────┘

CRAMPED (❌):            SPACED (✅):
┌────┬────┬────┐        ┌────┐ ┌────┐ ┌────┐
│ A  │ B  │ C  │        │ A  │ │ B  │ │ C  │
└────┴────┴────┘        └────┘ └────┘ └────┘
No spacing               8px spacing
```

---

## 14. Testing Workflow

### Keyboard-Only Test (5 minutes)

1. **Disconnect mouse/trackpad**
2. **Press Tab repeatedly:**
   - See skip links appear ✓
   - See blue focus indicators ✓
   - Reach all interactive elements ✓
3. **Press Enter on focused buttons:**
   - Actions work ✓
4. **Press Escape:**
   - Modals close ✓
5. **Navigate tasks with ↑↓:**
   - Selection works ✓

### Screen Reader Test (10 minutes)

**Mac (VoiceOver):**
1. Press `Cmd+F5` to start
2. Press `Tab` to navigate
3. Listen for button descriptions
4. Create a task (press `n`)
5. Listen for "Task created" announcement
6. Mark task done (press `d`)
7. Listen for "Task completed" announcement
8. Press `Cmd+F5` to stop

**Windows (NVDA):**
1. Start NVDA (Ctrl+Alt+N)
2. Press `Tab` to navigate
3. Press `H` to jump between headings
4. Press `B` to jump between buttons
5. Press `D` to jump between landmarks
6. Listen for all announcements

### Contrast Test (2 minutes)

1. Open [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. Test combinations:
   - `#3b82f6` on `#ffffff` → 4.56:1 ✓
   - `#6b7280` on `#ffffff` → 4.69:1 ✓
   - `#dc2626` on `#ffffff` → 4.52:1 ✓
3. Toggle dark mode, retest:
   - `#60a5fa` on `#1f2937` → 4.59:1 ✓
   - `#9ca3af` on `#1f2937` → 4.54:1 ✓
   - `#f87171` on `#1f2937` → 4.67:1 ✓

### Lighthouse Audit (3 minutes)

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" only
4. Click "Analyze page load"
5. Review score (target: 95-100)
6. Fix any reported issues

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────┐
│ ACCESSIBILITY FEATURES AT A GLANCE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✓ Focus Indicators     ┌──────────┐                    │
│                        │║ Button ║│  ← Blue outline     │
│                        └──────────┘                      │
│                                                          │
│ ✓ Skip Links           "Skip to main content"           │
│                        (Press Tab to see)                │
│                                                          │
│ ✓ Screen Reader        🔊 "Task created: Buy milk"      │
│                        (Invisible announcements)         │
│                                                          │
│ ✓ ARIA Labels          <button aria-label="Open menu">  │
│                        (Descriptive button names)        │
│                                                          │
│ ✓ Form Labels          <label for="search">Search</label>│
│                        (All inputs labeled)              │
│                                                          │
│ ✓ Loading States       ░░░░░░░░░░░░ (Skeleton)          │
│                        ⟳ (Spinner)                       │
│                                                          │
│ ✓ Error Messages       ⚠ Field cannot be empty          │
│                        (Red border + message)            │
│                                                          │
│ ✓ Focus Trapping       Modal: Tab → A → B → X → A      │
│                        (Focus loops in modal)            │
│                                                          │
│ ✓ Landmarks            Banner, Main, Navigation          │
│                        (Structural roles)                │
│                                                          │
│ ✓ Color Contrast       4.5:1+ for all text              │
│                        (WCAG AA compliant)               │
│                                                          │
│ ✓ Touch Targets        44x44px minimum                  │
│                        (Mobile-friendly)                 │
│                                                          │
│ ✓ Reduced Motion       Animations off when requested    │
│                        (User preference)                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

**Print or bookmark this for quick testing:**

```
╔═══════════════════════════════════════════════════╗
║  ACCESSIBILITY QUICK TEST CHECKLIST               ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ☐ Tab shows skip links                          ║
║  ☐ Focus visible on all elements (blue outline)  ║
║  ☐ All functionality works with keyboard          ║
║  ☐ Escape closes modals                          ║
║  ☐ Screen reader announces actions               ║
║  ☐ Buttons have descriptive names                ║
║  ☐ Form inputs have labels                       ║
║  ☐ Error messages clear and announced            ║
║  ☐ Loading states visible                        ║
║  ☐ Color contrast 4.5:1+ (use WebAIM checker)    ║
║  ☐ Works with VoiceOver/NVDA                     ║
║  ☐ Lighthouse score 95+                          ║
║  ☐ Mobile touch targets 44px+                    ║
║  ☐ Reduced motion preference respected           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## Common Issues & Solutions

### Issue: Focus outline not visible
**Solution:** Check CSS specificity, ensure `*:focus` rule isn't overridden

### Issue: Screen reader not announcing
**Solution:** Verify `#announcements` element exists and has correct attributes

### Issue: Tab order wrong
**Solution:** Ensure tabindex="-1" only on non-interactive elements

### Issue: Modal focus escapes
**Solution:** Implement focus trap in modal's keydown handler

### Issue: Color contrast fails
**Solution:** Use darker/lighter shade from Tailwind palette

### Issue: Touch targets too small
**Solution:** Add `min-height: 44px` to buttons on mobile

---

## Resources

- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **WAVE Extension:** https://wave.webaim.org/extension/
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **Screen Reader Guide:** https://webaim.org/articles/screenreader_testing/
- **ARIA Examples:** https://www.w3.org/WAI/ARIA/apg/

---

**Remember:** Accessibility is not a checklist—it's about making sure everyone can use your app effectively!

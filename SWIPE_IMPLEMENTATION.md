# Phase 3: Swipe Gesture Implementation Guide

## Summary

This document provides the implementation details for adding mobile swipe gestures to the dash-plus-notes app. Due to file editing challenges, this serves as a complete reference for manual implementation.

## Changes Required

### 1. State Variables (COMPLETED ✓)
Already added to state object around line 769:
```javascript
// Touch/swipe gesture tracking
touchStartX: 0,
touchStartY: 0,
touchStartTime: 0,
swipingTaskId: null,
swipeDirection: null // 'left' or 'right'
```

### 2. CSS Styles (COMPLETED ✓)
Already added swipe gesture styles around lines 63-139.

### 3. Touch Event Handler Functions (NEEDED)

Add these functions before the closing `</script>` tag (around line 3929):

```javascript
// Touch gesture handlers for mobile swipe actions
function handleTouchStart(event, taskId) {
    if (window.innerWidth >= 768) return;
    const touch = event.touches[0];
    state.touchStartX = touch.clientX;
    state.touchStartY = touch.clientY;
    state.touchStartTime = Date.now();
    state.swipingTaskId = taskId;
    state.swipeDirection = null;
    event.currentTarget.classList.add('swiping');
}

function handleTouchMove(event, taskId) {
    if (window.innerWidth >= 768 || !state.swipingTaskId) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - state.touchStartX;
    const deltaY = touch.clientY - state.touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        event.preventDefault();
        const row = document.querySelector(`[data-task-id="${state.swipingTaskId}"]`);
        if (!row) return;
        row.style.transform = `translateX(${deltaX}px)`;
        if (deltaX < -50) {
            state.swipeDirection = 'left';
            showSwipeActions(state.swipingTaskId, 'right');
        } else if (deltaX > 50) {
            state.swipeDirection = 'right';
            showSwipeActions(state.swipingTaskId, 'left');
        } else {
            state.swipeDirection = null;
            hideSwipeActions(state.swipingTaskId);
        }
    }
}

function handleTouchEnd(event, taskId) {
    if (window.innerWidth >= 768 || !state.swipingTaskId) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - state.touchStartX;
    const deltaY = touch.clientY - state.touchStartY;
    const deltaTime = Date.now() - state.touchStartTime;
    const row = document.querySelector(`[data-task-id="${state.swipingTaskId}"]`);
    if (!row) return;
    row.classList.remove('swiping');
    const isSwipe = Math.abs(deltaX) > 50 && deltaTime < 300;
    if (isSwipe) {
        if (deltaX < -50) {
            row.style.transform = 'translateX(-180px)';
            if (navigator.vibrate) navigator.vibrate(10);
        } else if (deltaX > 50) {
            cycleStatus(taskId);
            row.style.transform = 'translateX(0)';
            hideSwipeActions(taskId);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    } else {
        row.style.transform = 'translateX(0)';
        hideSwipeActions(taskId);
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
            const index = parseInt(row.dataset.taskIndex);
            if (!isNaN(index)) { state.selectedIndex = index; render(); }
        }
    }
    state.swipingTaskId = null;
    state.swipeDirection = null;
}

function showSwipeActions(taskId, side) {
    let actionsContainer = document.getElementById(`swipe-actions-${taskId}-${side}`);
    if (actionsContainer) { actionsContainer.style.display = 'flex'; return; }
    const row = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!row) return;
    const wrapper = row.parentElement;
    if (!wrapper || !wrapper.classList.contains('task-row-wrapper')) return;
    actionsContainer = document.createElement('div');
    actionsContainer.id = `swipe-actions-${taskId}-${side}`;
    actionsContainer.className = `swipe-actions swipe-actions-${side}`;
    if (side === 'right') {
        actionsContainer.innerHTML = `<button class="swipe-action swipe-action-done" onclick="event.stopPropagation(); toggleDone('${taskId}'); resetSwipe('${taskId}');"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg><span>Done</span></button><button class="swipe-action swipe-action-delete" onclick="event.stopPropagation(); if(confirm('Archive?')) { archiveTask('${taskId}'); resetSwipe('${taskId}'); }"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg><span>Delete</span></button><button class="swipe-action swipe-action-more" onclick="event.stopPropagation(); selectTaskById('${taskId}'); resetSwipe('${taskId}');"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg><span>More</span></button>`;
    } else {
        actionsContainer.innerHTML = `<button class="swipe-action swipe-action-status"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Cycle Status</span></button>`;
    }
    wrapper.appendChild(actionsContainer);
}

function hideSwipeActions(taskId) {
    ['left', 'right'].forEach(side => {
        const actionsContainer = document.getElementById(`swipe-actions-${taskId}-${side}`);
        if (actionsContainer) actionsContainer.style.display = 'none';
    });
}

function resetSwipe(taskId) {
    const row = document.querySelector(`[data-task-id="${taskId}"]`);
    if (row) { row.style.transform = 'translateX(0)'; hideSwipeActions(taskId); }
}
```

### 4. Modify createTaskRow Function (NEEDED)

In the `createTaskRow` function (around line 2668), change the return statement from:

```javascript
return row;
```

To:

```javascript
// Wrap row in a container for swipe gestures on mobile
const wrapper = document.createElement('div');
wrapper.className = 'task-row-wrapper';
row.className += ' task-row';

// Add touch event listeners for mobile swipe gestures
row.addEventListener('touchstart', (e) => handleTouchStart(e, task.id));
row.addEventListener('touchmove', (e) => handleTouchMove(e, task.id));
row.addEventListener('touchend', (e) => handleTouchEnd(e, task.id));

wrapper.appendChild(row);
return wrapper;
```

## Testing Checklist

Once implemented, test the following on mobile (or browser dev tools with touch emulation):

1. **Swipe Left** (reveal actions):
   - [ ] Swipe a task card left
   - [ ] Done, Delete, and More buttons appear
   - [ ] Buttons are tappable
   - [ ] Done button toggles task status
   - [ ] Delete button archives task (with confirmation)
   - [ ] More button selects task and shows details

2. **Swipe Right** (cycle status):
   - [ ] Swipe a task card right
   - [ ] Task status cycles through: active → waiting → delegated → reference → done
   - [ ] Visual feedback during swipe
   - [ ] Haptic feedback (if device supports)

3. **Touch Handling**:
   - [ ] Vertical scrolling still works (not blocked by horizontal swipe detection)
   - [ ] Quick tap on task selects it
   - [ ] Swipe threshold is appropriate (50px)
   - [ ] Spring-back animation when swipe cancelled

4. **Desktop**:
   - [ ] Swipe gestures don't interfere with desktop mouse interactions
   - [ ] All existing functionality still works

## Implementation Status

- ✅ State variables added
- ✅ CSS styles added
- ⏳ Touch handler functions (need to be added)
- ⏳ Modify createTaskRow function (need to be modified)
- ⏳ Testing

## Notes

- Swipe gestures only activate on mobile (< 768px)
- Minimum swipe distance: 50px
- Maximum swipe time for detection: 300ms
- Haptic feedback uses `navigator.vibrate()` (supported on most modern mobile browsers)
- Action buttons are dynamically created and cached for performance

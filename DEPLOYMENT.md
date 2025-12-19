# Deploying Dash-Plus to tiiny.site

## File Status

✅ **Ready for deployment** - `dash-plus-v3.html` (43KB)

The file is completely self-contained:
- All JavaScript is inline
- CSS via Tailwind CDN (https://cdn.tailwindcss.com)
- Data stored in browser localStorage
- No backend required
- No build process needed

## Deployment Steps

### 1. Prepare the File (Optional)

You can optionally rename the file to `index.html` for a cleaner URL:

```bash
cp /Users/am/Documents/GitHub/dash-plus-v3.html /Users/am/Documents/GitHub/dash-plus-notes/index.html
```

### 2. Upload to tiiny.site

1. Go to https://tiiny.host (tiiny.site redirects here)
2. Click "Upload your site"
3. Select either:
   - `dash-plus-v3.html` (will be accessible at yoursite.tiiny.site/dash-plus-v3.html)
   - `index.html` (will be accessible at yoursite.tiiny.site/)
4. Choose your subdomain name (e.g., `dash-plus-notes`)
5. Click "Upload"

### 3. Access Your Site

Your site will be available at:
- `https://your-subdomain.tiiny.site/`

## Features Included

✅ Task management with dash-plus notation
✅ Terminology toggle (dash-plus ↔ 5D)
✅ Light/dark theme switching
✅ Keyboard shortcuts (j/k navigation, vim-style)
✅ Inline editing (double-click any field)
✅ Task aging (old tasks greyed, urgent tasks red)
✅ Delegation tracking (inline editable)
✅ Waiting/blocker tracking (inline editable)
✅ Archive instead of delete
✅ Multiple projects support
✅ Natural language due dates
✅ 70/30 split layout
✅ Persistent keyboard shortcuts panel
✅ Floating action bar on selection

## Data Persistence

⚠️ **Important**: Data is stored in browser localStorage

- Data persists across sessions in the same browser
- Data is NOT synced across devices
- Clearing browser data will erase all tasks
- For production use, consider adding backend storage

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires JavaScript enabled.

## Keyboard Shortcuts

- `↑/↓` or `j/k` - Navigate tasks
- `Enter` - Edit selected task
- `n` - Create new task
- `d` - Toggle done/active
- `s` - Cycle status
- `Delete` - Archive task
- `Esc` - Clear selection

## Status Symbols

- `-` Active task (new task or undone action item)
- `+` Done (task complete or cancelled)
- `→` Waiting (waiting for next action)
- `←` Delegated (delegated to new owner)
- `Δ` Reference (reference/data point, no longer actionable)

## Next Steps

After deployment, you can:
1. Share the URL with others
2. Bookmark it for quick access
3. Add it to your home screen on mobile
4. Consider upgrading tiiny.site plan for custom domain

## Troubleshooting

**Issue**: Blank page after upload
- Solution: Check browser console for errors, ensure JavaScript is enabled

**Issue**: Styles not loading
- Solution: Check internet connection (Tailwind loads from CDN)

**Issue**: Data disappeared
- Solution: Check if browser data was cleared, localStorage is browser-specific

## Future Enhancements

For a production version, consider:
- Backend API for multi-device sync
- Export/import functionality
- Task search and filtering
- Tags and categories
- Subtasks and dependencies
- Time tracking
- Collaboration features

# Dash-Plus Notes

A lightweight, single-file task management application with dash-plus status notation (-+→←Δ).

## Features

- **Inline task creation** - Type task and press Enter
- **Status cycling** - Click status symbol to cycle through: Active(-) → Waiting(→) → Delegated(←) → Reference(Δ) → Done(+)
- **Inline editing** - Double-click task content to edit, or double-click due date/delegated fields
- **Archive instead of delete** - Tasks can be archived and unarchived (no permanent deletion)
- **Due dates** - Simple date field (accepts any format)
- **Delegated tasks** - Mark who a task is delegated to
- **Dark theme** - Toggle light/dark mode
- **Live statistics** - Total, Active, Done counts (excludes archived)
- **Browser storage** - All data persisted to localStorage, no backend needed
- **Responsive design** - Works on desktop, tablet, and mobile

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Deploy to production
flyctl deploy
```

Open http://localhost:5173 (Vite dev server) or https://dash-plus-notes.fly.dev (production).

## Usage

### Creating a Task
1. Click the input field at the top
2. Type your task description
3. Press Enter

### Changing Task Status
Click the status symbol (-+→←Δ) to cycle through statuses:
- `-` Active (current task)
- `→` Waiting (blocked by external factor)
- `←` Delegated (assigned to someone)
- `Δ` Reference (data point, not actionable)
- `+` Done (complete)

### Editing Tasks
- **Content**: Double-click the task text to edit inline
- **Due Date**: Double-click the 📅 icon to set a due date
- **Delegated To**: Double-click the ← icon to specify who it's delegated to

### Archiving Tasks
Click the 📦 button to archive a task. Click 📦 button again (or toggle the Archived view) to unarchive.

## Architecture

Single-file application (`index.html`) with vanilla JavaScript:

- **State**: Simple tasks array in memory
- **Persistence**: localStorage key `dashplus-tasks`
- **Rendering**: Deterministic DOM regeneration from state
- **Events**: Event delegation on task rows

**Data flow**: User Action → Mutate tasks array → save() → render()

Each task object:
```javascript
{
  id: number,
  content: string,
  status: 'active' | 'waiting' | 'delegated' | 'reference' | 'done',
  dueDate: string | null,
  delegatedTo: string | null,
  archived: boolean,
  createdAt: string
}
```

## Commands

```bash
npm run dev        # Development server (Vite)
npm run build      # Production build
npm run preview    # Preview built version
npm test           # Run tests
npm test --watch   # Watch mode
npm test --ui      # UI mode
npm run lint       # Lint code
npm run format     # Format code
```

## Deployment

Deployed to Fly.io as containerized Node.js app:

```bash
flyctl deploy
```

Server config:
- `server.js` - Express static file server
- `fly.toml` - Fly.io configuration
- `Dockerfile` - Container image (Alpine Node.js)

## Project Structure

```
dash-plus-notes/
├── index.html           # Entire application (~400 lines)
├── server.js            # Express server
├── package.json
├── CLAUDE.md            # Development guide
└── README.md            # This file
```

## Browser Support

Works in all modern browsers with localStorage support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Data Persistence

All data is stored in browser localStorage under key `dashplus-tasks`. Data is:
- Persisted across browser sessions
- Synced to localStorage after every action
- Exported/imported as JSON

To backup: Open browser DevTools → Application → localStorage → copy `dashplus-tasks` value.

To restore: Paste into localStorage with same key.

## Limitations

- Single-browser, single-device (no cloud sync)
- No authentication
- No API/backend
- No real-time collaboration
- Due date is free-form text (no validation)
- No file attachments
- No full-text search
- No sharing

## Development Guide

See [CLAUDE.md](./CLAUDE.md) for detailed development information, architecture decisions, and common tasks.

## License

MIT

## Version

0.1.0 - Stable single-file MVP

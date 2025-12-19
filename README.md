# Dash-Plus Notes

A graph-based note-taking system with semantic linking and natural language date parsing.

## Features

- **Graph-based linking**: Connect tasks and notes with typed relationships (waiting, delegated, references, blocks, etc.)
- **Dash-plus notation**: Quick task entry using symbols (-, +, →, ←, △, ○)
- **Natural language dates**: "tomorrow at 3pm", "next Friday", "in 2 weeks"
- **Project organization**: Hierarchical projects with nesting support
- **Circular dependency detection**: Identify and visualize task cycles
- **Audit trail**: Complete change history for all entities
- **Graph queries**: Find backlinks, forward links, blocking chains, and more

## Architecture

### Phase 1: localStorage POC (Current)
- Pure client-side implementation
- No backend required
- All data stored in browser localStorage
- Perfect for prototyping and single-user demos

### Phase 2: Backend Migration (Planned)
- Node.js + Express API server
- PostgreSQL or SQLite database
- JWT authentication
- Multi-device sync

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for migration path.

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm test:ui
```

## Data Model

The system is built around four core entities:

### 1. Tasks/Notes
- Basic unit of information
- Symbols: `-` (task), `+` (note), `→` (delegated), `←` (waiting), `△` (priority), `○` (someday)
- Optional fields: due date, assignee, description, tags

### 2. Projects
- Container for organizing tasks
- Support hierarchical nesting
- Automatic statistics (completion rate, active tasks, etc.)

### 3. Links
- Semantic relationships between tasks
- Types: waiting, delegated, references, moved, blocks, related
- Bidirectional navigation

### 4. Users
- Task ownership and assignment
- User preferences and settings

See [DATA_MODEL.md](./DATA_MODEL.md) for complete specification.

## Usage Examples

### Creating Tasks

```javascript
import { TaskStore } from './src/storage/localStorage.js';

// Create a simple task
const task = TaskStore.create({
  content: 'Implement API endpoints',
  symbol: '-',
  type: 'task',
});

// Create a task with due date (natural language)
const urgentTask = TaskStore.create({
  content: 'Fix critical bug',
  symbol: '△',
  priority: 'urgent',
  dueDate: 'tomorrow at 5pm',
});

// Create a delegated task
const delegatedTask = TaskStore.create({
  content: 'Review pull request',
  symbol: '→',
  assigneeId: 'user-123',
});
```

### Creating Projects

```javascript
import { ProjectStore } from './src/storage/localStorage.js';

// Create a project
const project = ProjectStore.create({
  name: 'Backend Development',
  description: 'API and database work',
  color: '#3b82f6',
  icon: '🚀',
});

// Create a task in the project
const projectTask = TaskStore.create({
  content: 'Design database schema',
  projectId: project.id,
});

// Get project statistics
const stats = ProjectStore.getStats(project.id);
console.log(`Completion rate: ${stats.completionRate * 100}%`);
```

### Creating Links

```javascript
import { LinkStore } from './src/storage/localStorage.js';

// Create a "waiting" link
const link = LinkStore.create({
  sourceId: taskA.id,
  targetId: taskB.id,
  linkType: 'waiting',
  label: 'Waiting for API implementation',
});

// Create a "blocks" link
LinkStore.create({
  sourceId: blocker.id,
  targetId: blocked.id,
  linkType: 'blocks',
});
```

### Graph Queries

```javascript
import { GraphQueries } from './src/storage/graphQueries.js';

// Get all tasks that link TO this task
const backlinks = GraphQueries.getBacklinks(taskId, {
  linkType: 'waiting',
  depth: 2,
  includeIndirect: true,
});

// Get all tasks this task links TO
const forwardLinks = GraphQueries.getForwardLinks(taskId);

// Get full relationship graph
const graph = GraphQueries.getRelatedGraph(taskId, {
  depth: 3,
  linkTypes: ['waiting', 'blocks'],
});

// Detect circular dependencies
const cycles = GraphQueries.detectCycles(taskId);
if (cycles.hasCycles) {
  console.log('Circular dependency detected!');
  console.log(cycles.cycles);
}

// Find what tasks are blocked by this task
const blockingChain = GraphQueries.getBlockingChain(taskId);
console.log(`Blocking ${blockingChain.count} tasks`);

// Calculate task importance (PageRank-like)
const importance = GraphQueries.getTaskImportance(taskId);
console.log(`Importance: ${importance.ranking}`); // isolated, low, medium, high, critical
```

### Natural Language Date Parsing

```javascript
import { parseNaturalDate } from './src/utils/dateParser.js';

// Parse various date formats
parseNaturalDate('tomorrow');                  // Tomorrow at 9 AM
parseNaturalDate('next Friday');               // Next Friday at 9 AM
parseNaturalDate('in 3 days');                 // 3 days from now
parseNaturalDate('end of week');               // This Sunday at 11:59 PM
parseNaturalDate('next Monday at 3pm');        // Next Monday at 3:00 PM
parseNaturalDate('tomorrow at 9:30am');        // Tomorrow at 9:30 AM
parseNaturalDate('2025-01-20');                // January 20, 2025

// ISO dates work too
parseNaturalDate('2025-03-15');                // March 15, 2025
parseNaturalDate('03/15/2025');                // March 15, 2025
```

### Filtering and Search

```javascript
// Filter tasks by multiple criteria
const activeTasks = TaskStore.getAll({
  status: 'active',
  projectId: project.id,
  tags: ['urgent', 'bug'],
  search: 'authentication',
  sort: 'dueDate',
  order: 'asc',
  page: 1,
  pageSize: 20,
});

// Search across content and description
const results = TaskStore.getAll({
  search: 'API implementation',
});
```

### Audit Trail

```javascript
import { Storage } from './src/storage/localStorage.js';

// Get change history for a task
const history = Storage.getAuditHistory('task', taskId);

history.forEach(log => {
  console.log(`${log.action} by ${log.userId} at ${log.timestamp}`);
  log.changes.forEach(change => {
    console.log(`  ${change.field}: ${change.oldValue} → ${change.newValue}`);
  });
});
```

### Graph Export

```javascript
import { GraphUtils } from './src/storage/graphQueries.js';

// Export graph to DOT format (Graphviz)
const graph = GraphQueries.getRelatedGraph(taskId);
const dot = GraphUtils.toDOT(graph);
console.log(dot);

// Export to Mermaid format
const mermaid = GraphUtils.toMermaid(graph);
console.log(mermaid);
```

## API Design

The localStorage implementation mirrors the future REST API design:

- `GET /tasks` - List tasks with filtering
- `GET /tasks/:id` - Get task by ID
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /tasks/:id/backlinks` - Get backlinks
- `GET /tasks/:id/forwardlinks` - Get forward links
- `GET /tasks/:id/graph` - Get related graph
- `GET /tasks/:id/cycles` - Detect cycles

See [API_DESIGN.md](./API_DESIGN.md) for complete API specification.

## Performance

The system is designed to handle 1000+ tasks efficiently:

- Indexed queries for fast filtering
- Pagination support (default 50 items, max 200)
- Optimized graph traversal with cycle detection
- Maximum traversal depth limits to prevent runaway queries

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests with UI
npm test:ui
```

## Project Structure

```
dash-plus-notes/
├── src/
│   ├── storage/
│   │   ├── localStorage.js       # localStorage implementation
│   │   └── graphQueries.js       # Graph traversal and queries
│   └── utils/
│       └── dateParser.js         # Natural language date parser
├── tests/
│   ├── localStorage.test.js      # Storage tests
│   ├── graphQueries.test.js      # Graph query tests
│   └── dateParser.test.js        # Date parser tests
├── DATA_MODEL.md                 # Data model specification
├── API_DESIGN.md                 # API design document
├── SQL_SCHEMA.sql                # PostgreSQL schema
├── MIGRATION_GUIDE.md            # Backend migration guide
└── README.md                     # This file
```

## Symbol Reference

| Symbol | Meaning | Use Case |
|--------|---------|----------|
| `-` | Task | Standard to-do item |
| `+` | Note | Information, reference |
| `→` | Delegated | Assigned to someone else |
| `←` | Waiting | Blocked by external factor |
| `△` | Priority | High-importance task |
| `○` | Someday | Low-priority, future task |

## Link Type Reference

| Type | Description | Direction |
|------|-------------|-----------|
| `waiting` | Source waits for target | Directional |
| `delegated` | Source delegated to target | Directional |
| `references` | Source references target | Bidirectional |
| `moved` | Source moved to target | Directional |
| `blocks` | Source blocks target | Directional |
| `related` | Generic relationship | Bidirectional |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Roadmap

### v0.1 (Current)
- [x] localStorage implementation
- [x] Graph queries and traversal
- [x] Natural language date parsing
- [x] Cycle detection
- [x] Audit trail

### v0.2 (Planned)
- [ ] Node.js backend
- [ ] PostgreSQL/SQLite support
- [ ] JWT authentication
- [ ] Multi-device sync
- [ ] Real-time collaboration

### v0.3 (Future)
- [ ] Full-text search
- [ ] File attachments
- [ ] Comments and discussions
- [ ] Notifications
- [ ] Analytics and reporting
- [ ] Mobile app

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

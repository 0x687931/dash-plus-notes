# Dash-Plus Notes: Quick Reference

## Symbols

```
-  Task (standard to-do)
+  Note (information/reference)
→  Delegated (assigned to someone)
←  Waiting (blocked)
△  Priority (high-importance)
○  Someday (low-priority/future)
```

## Link Types

```
waiting     Source waits for target to complete
delegated   Source assigned to target user
references  Source mentions/cites target
moved       Source moved to target location
blocks      Source prevents target from starting
related     Generic bidirectional relationship
```

## Core Operations

### Tasks

```javascript
// Create
TaskStore.create({
  content: 'Task description',
  symbol: '-',
  type: 'task',
  priority: 'high',
  dueDate: 'tomorrow at 3pm',
  projectId: 'proj-123',
  tags: ['backend', 'urgent']
});

// Read
TaskStore.getById(id);
TaskStore.getAll({ status: 'active', projectId: 'proj-123' });

// Update
TaskStore.update(id, { status: 'completed' });
TaskStore.complete(id);

// Delete
TaskStore.delete(id, { cascade: true });
```

### Projects

```javascript
// Create
ProjectStore.create({
  name: 'Project Name',
  description: 'Description',
  color: '#3b82f6',
  icon: '🚀',
  parentId: 'parent-id'
});

// Read
ProjectStore.getById(id);
ProjectStore.getTree(id);  // With nested children
ProjectStore.getStats(id); // Task statistics

// Update
ProjectStore.update(id, { name: 'New Name' });

// Delete
ProjectStore.delete(id, {
  deleteChildren: false,
  deleteTasks: false
});
```

### Links

```javascript
// Create
LinkStore.create({
  sourceId: 'task-a',
  targetId: 'task-b',
  linkType: 'waiting',
  label: 'Optional description',
  strength: 0.8
});

// Read
LinkStore.getAll({ sourceId: 'task-a' });
LinkStore.getAll({ entityId: 'task-a' }); // Bidirectional

// Delete
LinkStore.delete(id);

// Batch create
LinkStore.batchCreate([
  { sourceId: 'a', targetId: 'b', linkType: 'waiting' },
  { sourceId: 'a', targetId: 'c', linkType: 'references' }
]);
```

## Graph Queries

```javascript
// Get backlinks (tasks linking TO this)
GraphQueries.getBacklinks(taskId, {
  linkType: 'waiting',
  depth: 2,
  includeIndirect: true
});

// Get forward links (tasks this links TO)
GraphQueries.getForwardLinks(taskId, {
  linkType: 'waiting',
  depth: 2
});

// Get full relationship graph
GraphQueries.getRelatedGraph(taskId, {
  depth: 3,
  linkTypes: ['waiting', 'blocks']
});

// Detect circular dependencies
GraphQueries.detectCycles(taskId);

// Find what's blocked by this task
GraphQueries.getBlockingChain(taskId);

// Find what this task depends on
GraphQueries.getDependencyChain(taskId);

// Get immediate neighbors
GraphQueries.getNeighborhood(taskId);

// Calculate importance score
GraphQueries.getTaskImportance(taskId);

// Find orphan tasks
GraphQueries.getOrphanTasks();

// Find all tasks in cycles
GraphQueries.getTasksInCycles();
```

## Natural Language Dates

```javascript
parseNaturalDate('today');
parseNaturalDate('tomorrow');
parseNaturalDate('yesterday');
parseNaturalDate('next Monday');
parseNaturalDate('last Friday');
parseNaturalDate('in 3 days');
parseNaturalDate('in 2 weeks');
parseNaturalDate('3 days ago');
parseNaturalDate('next week');
parseNaturalDate('end of week');
parseNaturalDate('end of month');
parseNaturalDate('tomorrow at 3pm');
parseNaturalDate('next Monday at 9:30am');
parseNaturalDate('2025-01-20');
parseNaturalDate('01/20/2025');
```

## Filtering

```javascript
TaskStore.getAll({
  // Status filter
  status: 'active',  // active|completed|cancelled|waiting

  // Project filter
  projectId: 'proj-123',

  // Assignee filter
  assigneeId: 'user-123',

  // Symbol filter
  symbol: '-',

  // Priority filter
  priority: 'high',  // low|medium|high|urgent

  // Tags filter
  tags: ['backend', 'urgent'],

  // Search
  search: 'authentication',

  // Sorting
  sort: 'dueDate',  // createdAt|updatedAt|dueDate
  order: 'asc',     // asc|desc

  // Pagination
  page: 1,
  pageSize: 50
});
```

## Date Utilities

```javascript
// Format dates
formatDate(date, 'short');     // Jan 15
formatDate(date, 'medium');    // Jan 15, 2025
formatDate(date, 'long');      // Wednesday, January 15, 2025
formatDate(date, 'relative');  // Tomorrow, 3 days ago, etc.

// Check if overdue
isOverdue(dueDate);

// Check if due soon
isDueSoon(dueDate, 3);  // Within 3 days

// Get relative time
getRelativeTime(date);  // { days: 3, hours: 72, ... }

// Validate date string
isValidDateString('tomorrow');  // true
```

## Audit Trail

```javascript
// Get change history
Storage.getAuditHistory('task', taskId);

// Returns array of:
{
  id: 'audit-123',
  entityType: 'task',
  entityId: 'task-123',
  action: 'update',  // create|update|delete
  changes: [
    {
      field: 'status',
      oldValue: 'active',
      newValue: 'completed'
    }
  ],
  userId: 'user-123',
  timestamp: '2025-01-15T10:00:00Z'
}
```

## Graph Export

```javascript
// Export to DOT (Graphviz)
const graph = GraphQueries.getRelatedGraph(taskId);
const dot = GraphUtils.toDOT(graph);

// Export to Mermaid
const mermaid = GraphUtils.toMermaid(graph);
```

## Bulk Operations

```javascript
// Bulk update tasks
TaskStore.bulkUpdate(
  ['task-1', 'task-2', 'task-3'],
  { status: 'completed' }
);

// Returns:
{
  success: ['task-1', 'task-2', 'task-3'],
  failed: [],
  errors: []
}
```

## Error Handling

```javascript
try {
  const task = TaskStore.create({ content: '' });
} catch (error) {
  // "Task content cannot be empty"
}

try {
  LinkStore.create({
    sourceId: 'task-1',
    targetId: 'task-1',  // Same task!
    linkType: 'waiting'
  });
} catch (error) {
  // "Cannot create self-loop"
}

try {
  ProjectStore.update(projectId, {
    parentId: childProjectId  // Would create cycle
  });
} catch (error) {
  // "Circular project nesting detected"
}
```

## Performance Tips

1. **Use pagination**: Default 50 items, max 200
2. **Limit graph depth**: Default 2, max 5 to prevent runaway queries
3. **Filter before traversal**: Use filters to reduce initial dataset
4. **Index on common fields**: projectId, assigneeId, status, createdAt
5. **Batch operations**: Use `bulkUpdate` for multiple changes

## Validation Rules

### Tasks
- Content must not be empty
- Symbol must be one of: `-`, `+`, `→`, `←`, `△`, `○`
- Status must be: `active`, `completed`, `cancelled`, `waiting`
- Priority (if set): `low`, `medium`, `high`, `urgent`

### Projects
- Name must not be empty
- Status must be: `active`, `archived`, `completed`
- Cannot nest project under itself (circular nesting)

### Links
- Source and target must exist
- Cannot link task to itself (self-loop)
- Link type must be: `waiting`, `delegated`, `references`, `moved`, `blocks`, `related`
- Strength (if set): 0.0 to 1.0

## Common Patterns

### Dependency Chain
```javascript
// Task A depends on B, B depends on C
LinkStore.create({ sourceId: 'A', targetId: 'B', linkType: 'waiting' });
LinkStore.create({ sourceId: 'B', targetId: 'C', linkType: 'waiting' });

// Find everything A depends on
const deps = GraphQueries.getDependencyChain('A');
```

### Blocking Chain
```javascript
// Task A blocks B and C
LinkStore.create({ sourceId: 'A', targetId: 'B', linkType: 'blocks' });
LinkStore.create({ sourceId: 'A', targetId: 'C', linkType: 'blocks' });

// Find everything blocked by A
const blocked = GraphQueries.getBlockingChain('A');
```

### Task Network
```javascript
// Get all related tasks within 2 hops
const graph = GraphQueries.getRelatedGraph(taskId, { depth: 2 });

// Check for circular dependencies
if (graph.cycles.length > 0) {
  console.log('Warning: Circular dependencies detected!');
}
```

### Project Dashboard
```javascript
const stats = ProjectStore.getStats(projectId);
console.log(`${stats.completionRate * 100}% complete`);
console.log(`${stats.activeTasks} active, ${stats.completedTasks} done`);
```

## Storage Management

```javascript
// Get current user
const user = Storage.getCurrentUser();

// Update user preferences
Storage.updateCurrentUser({
  preferences: {
    theme: 'dark',
    dateFormat: 'MM/DD/YYYY'
  }
});

// Clear all data (development only!)
Storage.clearAll();
```

## Migration to Backend

When ready to migrate to backend:

1. Data already structured for SQL schema
2. localStorage functions map 1:1 to API endpoints
3. Change imports from `localStorage.js` to `apiClient.js`
4. Run migration script to sync existing data

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details.

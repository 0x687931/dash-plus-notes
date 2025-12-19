# Dash-Plus Notes: Data Model Specification

## Overview

A graph-based note-taking system with tasks, projects, and semantic relationships. Designed for localStorage POC with clear migration path to Node.js + SQL backend.

## Core Entities

### 1. Task/Note

The fundamental unit of information. Can be a task, note, or any other content.

```typescript
interface Task {
  // Identity
  id: string;                    // UUID v4
  type: 'task' | 'note';         // Entity type

  // Core content
  symbol: '-' | '+' | '→' | '←' | '△' | '○';  // Dash-plus symbol
  content: string;               // Main text content
  description?: string;          // Optional detailed description

  // Temporal
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  dueDate?: string;              // ISO 8601 date (optional)
  completedAt?: string;          // ISO 8601 timestamp (when completed)

  // Relationships
  projectId?: string;            // Parent project (optional)
  assigneeId?: string;           // User assigned to (optional)

  // Metadata
  status: 'active' | 'completed' | 'cancelled' | 'waiting';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];               // User-defined tags

  // Audit
  createdBy: string;             // User ID
  updatedBy: string;             // User ID
}
```

### 2. Project

Container for organizing related tasks/notes.

```typescript
interface Project {
  // Identity
  id: string;                    // UUID v4

  // Core content
  name: string;                  // Project name
  description?: string;          // Optional description
  color?: string;                // UI color (hex)
  icon?: string;                 // Emoji or icon identifier

  // Relationships
  parentId?: string;             // Parent project (for nesting)

  // Temporal
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  startDate?: string;            // ISO 8601 date
  endDate?: string;              // ISO 8601 date

  // Metadata
  status: 'active' | 'archived' | 'completed';

  // Audit
  createdBy: string;             // User ID
  updatedBy: string;             // User ID
}
```

### 3. Link

Semantic relationships between tasks/notes.

```typescript
interface Link {
  // Identity
  id: string;                    // UUID v4

  // Relationship
  sourceId: string;              // Source task/note ID
  targetId: string;              // Target task/note ID
  linkType: 'waiting' | 'delegated' | 'references' | 'moved' | 'blocks' | 'related';

  // Metadata
  label?: string;                // Optional descriptive label
  strength?: number;             // Relationship strength (0-1)

  // Temporal
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp

  // Audit
  createdBy: string;             // User ID
}
```

### 4. User

People who create, own, or are assigned tasks.

```typescript
interface User {
  // Identity
  id: string;                    // UUID v4

  // Profile
  username: string;              // Unique username
  email: string;                 // Email address
  displayName: string;           // Display name
  avatarUrl?: string;            // Profile picture URL

  // Temporal
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  lastLoginAt?: string;          // ISO 8601 timestamp

  // Settings
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    dateFormat?: string;
    timezone?: string;
  };
}
```

### 5. AuditLog

Track all changes for accountability and undo capability.

```typescript
interface AuditLog {
  // Identity
  id: string;                    // UUID v4

  // What changed
  entityType: 'task' | 'note' | 'project' | 'link' | 'user';
  entityId: string;              // ID of changed entity
  action: 'create' | 'update' | 'delete' | 'restore';

  // Change details
  changes: {
    field: string;               // Field that changed
    oldValue: any;               // Previous value
    newValue: any;               // New value
  }[];

  // Context
  userId: string;                // Who made the change
  timestamp: string;             // ISO 8601 timestamp
  ipAddress?: string;            // Client IP (backend only)
  userAgent?: string;            // Client user agent
}
```

## Symbol Semantics

| Symbol | Meaning | Default Status | Typical Use |
|--------|---------|----------------|-------------|
| `-` | Task | active | Standard to-do item |
| `+` | Note | active | Information, reference |
| `→` | Delegated | waiting | Assigned to someone else |
| `←` | Waiting | waiting | Blocked by external factor |
| `△` | Priority | active | High-importance task |
| `○` | Someday | active | Low-priority, future task |

## Link Types Semantics

| Type | Description | Directionality | Use Case |
|------|-------------|----------------|----------|
| `waiting` | Source waits for target | Directional | Task A waits for Task B to complete |
| `delegated` | Source delegated to target | Directional | Task A assigned to User B |
| `references` | Source references target | Bidirectional | Task A mentions Task B |
| `moved` | Source moved to target | Directional | Task A moved to Project B |
| `blocks` | Source blocks target | Directional | Task A prevents Task B from starting |
| `related` | Generic relationship | Bidirectional | Task A relates to Task B |

## Graph Relationships

### Task → Project
- **Type**: Many-to-One
- **Optional**: Yes (tasks can exist without projects)
- **Cascade Delete**: No (orphan tasks remain)

### Project → Project (Nesting)
- **Type**: Self-referential Many-to-One
- **Optional**: Yes (root projects have no parent)
- **Cascade Delete**: Optional (delete children or orphan them)
- **Circular Prevention**: Required

### Task ↔ Task (Links)
- **Type**: Many-to-Many via Link entity
- **Optional**: Yes
- **Circular Prevention**: Allowed (for circular dependencies)
- **Multiple Links**: Yes (same pair can have multiple link types)

### User → Task (Assignment)
- **Type**: One-to-Many
- **Optional**: Yes (unassigned tasks)
- **Cascade Delete**: No (reassign or orphan)

## Data Constraints

### Required Fields
- All entities: `id`, `createdAt`, `updatedAt`, `createdBy`
- Task: `type`, `symbol`, `content`, `status`
- Project: `name`, `status`
- Link: `sourceId`, `targetId`, `linkType`
- User: `username`, `email`, `displayName`

### Unique Constraints
- User: `username`, `email`
- All entities: `id`

### Validation Rules
- `dueDate` must be >= `createdAt`
- `completedAt` must be >= `createdAt`
- `endDate` must be >= `startDate`
- Circular project nesting not allowed
- Cannot link task to itself (self-loops prohibited)
- Link `sourceId` and `targetId` must reference existing tasks

### Performance Considerations
- Index on `projectId` (frequent filtering)
- Index on `assigneeId` (frequent filtering)
- Index on `createdAt`, `updatedAt` (sorting)
- Index on `status` (filtering active/completed)
- Composite index on `(sourceId, targetId)` for links
- Full-text search index on `content` field

## Circular Reference Handling

The system explicitly allows circular references in the link graph (e.g., A waits on B, B waits on C, C waits on A). Detection and visualization of cycles is a feature, not a bug.

```typescript
// Example circular dependency
Link { sourceId: 'A', targetId: 'B', linkType: 'waiting' }
Link { sourceId: 'B', targetId: 'C', linkType: 'waiting' }
Link { sourceId: 'C', targetId: 'A', linkType: 'waiting' }
```

Query functions must handle cycles gracefully using:
- Visited set tracking
- Maximum depth limits
- Cycle detection algorithms (e.g., DFS with backtracking)

## Future Extensions

### Planned Features
1. **Attachments**: File uploads linked to tasks/notes
2. **Comments**: Discussion threads on tasks
3. **Notifications**: Real-time updates and reminders
4. **Collaboration**: Real-time editing (CRDT)
5. **Search**: Full-text search with relevance scoring
6. **Analytics**: Completion rates, time tracking, burndown charts

### Extension Points
- `Task.metadata`: JSON field for custom attributes
- `Project.settings`: JSON field for project-specific config
- `Link.properties`: JSON field for link-specific data
- Plugin system for custom symbols and link types

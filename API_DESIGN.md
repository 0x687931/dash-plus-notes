# Dash-Plus Notes: API Design

## API Style: REST

Using REST for simplicity and broad client compatibility. GraphQL considered but deferred for v2.

## Base URL

```
Production:  https://api.dashplus.app/v1
Development: http://localhost:3000/v1
```

## Authentication

```http
Authorization: Bearer <jwt_token>
```

JWT contains:
- `userId`: User ID
- `username`: Username
- `exp`: Expiration timestamp
- `iat`: Issued at timestamp

## Common Response Format

### Success Response
```json
{
  "data": { /* entity or array of entities */ },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid due date format",
    "details": {
      "field": "dueDate",
      "expected": "ISO 8601 date string"
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination Response
```json
{
  "data": [ /* array of entities */ ],
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "totalPages": 10,
      "totalItems": 487,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

## Endpoints

### Tasks

#### List Tasks
```http
GET /tasks
```

**Query Parameters:**
- `projectId` (string, optional): Filter by project
- `assigneeId` (string, optional): Filter by assignee
- `status` (string, optional): Filter by status (active|completed|cancelled|waiting)
- `symbol` (string, optional): Filter by symbol
- `tags` (string[], optional): Filter by tags (comma-separated)
- `search` (string, optional): Full-text search in content
- `sort` (string, optional): Sort field (createdAt|updatedAt|dueDate)
- `order` (string, optional): Sort order (asc|desc), default: desc
- `page` (number, optional): Page number, default: 1
- `pageSize` (number, optional): Items per page, default: 50, max: 200

**Response:**
```json
{
  "data": [
    {
      "id": "task_123",
      "type": "task",
      "symbol": "-",
      "content": "Implement API endpoints",
      "status": "active",
      "projectId": "proj_456",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z",
      "createdBy": "user_789"
    }
  ],
  "meta": { /* pagination meta */ }
}
```

#### Get Task
```http
GET /tasks/:id
```

**Query Parameters:**
- `include` (string[], optional): Include related entities (project|assignee|links)

**Response:**
```json
{
  "data": {
    "id": "task_123",
    "type": "task",
    "symbol": "-",
    "content": "Implement API endpoints",
    "description": "Create RESTful API for task management",
    "status": "active",
    "priority": "high",
    "dueDate": "2025-01-20T00:00:00Z",
    "projectId": "proj_456",
    "assigneeId": "user_789",
    "tags": ["backend", "api"],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "createdBy": "user_789",
    "updatedBy": "user_789",

    // Included relations (if requested)
    "project": { /* project object */ },
    "assignee": { /* user object */ },
    "links": { /* links array */ }
  }
}
```

#### Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "type": "task",
  "symbol": "-",
  "content": "New task content",
  "description": "Optional description",
  "dueDate": "2025-01-20",  // Natural language or ISO date
  "projectId": "proj_456",
  "assigneeId": "user_789",
  "priority": "high",
  "tags": ["backend", "api"]
}
```

**Response:** 201 Created
```json
{
  "data": { /* created task object */ }
}
```

#### Update Task
```http
PATCH /tasks/:id
```

**Request Body:** (partial update)
```json
{
  "content": "Updated task content",
  "status": "completed",
  "completedAt": "2025-01-15T11:00:00Z"
}
```

**Response:** 200 OK
```json
{
  "data": { /* updated task object */ }
}
```

#### Delete Task
```http
DELETE /tasks/:id
```

**Query Parameters:**
- `cascade` (boolean, optional): Delete associated links, default: true

**Response:** 204 No Content

#### Bulk Operations
```http
POST /tasks/bulk
```

**Request Body:**
```json
{
  "action": "update",  // update|delete|complete
  "ids": ["task_123", "task_456"],
  "data": {  // For update action
    "status": "completed"
  }
}
```

**Response:** 200 OK
```json
{
  "data": {
    "success": ["task_123", "task_456"],
    "failed": [],
    "errors": []
  }
}
```

### Projects

#### List Projects
```http
GET /projects
```

**Query Parameters:**
- `status` (string, optional): Filter by status
- `parentId` (string, optional): Filter by parent (use "null" for root projects)
- `search` (string, optional): Search in name/description
- `sort` (string, optional): Sort field
- `order` (string, optional): Sort order
- `page`, `pageSize`: Pagination

**Response:** Similar to tasks list

#### Get Project
```http
GET /projects/:id
```

**Query Parameters:**
- `include` (string[], optional): Include relations (tasks|children|parent)
- `includeTaskStats` (boolean, optional): Include task statistics

**Response:**
```json
{
  "data": {
    "id": "proj_456",
    "name": "Backend Development",
    "description": "API and database work",
    "color": "#3b82f6",
    "icon": "🚀",
    "status": "active",
    "createdAt": "2025-01-10T00:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "createdBy": "user_789",

    // Task statistics (if requested)
    "stats": {
      "totalTasks": 15,
      "completedTasks": 7,
      "activeTasks": 6,
      "waitingTasks": 2,
      "completionRate": 0.47
    }
  }
}
```

#### Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "color": "#3b82f6",
  "icon": "🚀",
  "parentId": "proj_parent",
  "startDate": "2025-01-15",
  "endDate": "2025-03-15"
}
```

#### Update Project
```http
PATCH /projects/:id
```

#### Delete Project
```http
DELETE /projects/:id
```

**Query Parameters:**
- `deleteChildren` (boolean, optional): Delete child projects, default: false
- `deleteTasks` (boolean, optional): Delete tasks, default: false (orphans them)

#### Get Project Tree
```http
GET /projects/:id/tree
```

Returns project with all nested children as a tree structure.

**Response:**
```json
{
  "data": {
    "id": "proj_root",
    "name": "Root Project",
    "children": [
      {
        "id": "proj_child1",
        "name": "Child Project 1",
        "children": []
      },
      {
        "id": "proj_child2",
        "name": "Child Project 2",
        "children": [
          { /* nested children */ }
        ]
      }
    ]
  }
}
```

### Links

#### List Links
```http
GET /links
```

**Query Parameters:**
- `sourceId` (string, optional): Filter by source
- `targetId` (string, optional): Filter by target
- `linkType` (string, optional): Filter by type
- `entityId` (string, optional): Filter by source OR target (bidirectional)

**Response:**
```json
{
  "data": [
    {
      "id": "link_123",
      "sourceId": "task_123",
      "targetId": "task_456",
      "linkType": "waiting",
      "label": "Waiting for API implementation",
      "createdAt": "2025-01-15T10:00:00Z",
      "createdBy": "user_789"
    }
  ]
}
```

#### Get Link
```http
GET /links/:id
```

**Query Parameters:**
- `include` (string[], optional): Include source|target entities

#### Create Link
```http
POST /links
```

**Request Body:**
```json
{
  "sourceId": "task_123",
  "targetId": "task_456",
  "linkType": "waiting",
  "label": "Waiting for API implementation",
  "strength": 0.9
}
```

**Validation:**
- Prevents self-loops (sourceId === targetId)
- Validates sourceId and targetId exist
- Allows duplicate link types between same entities (idempotent if exact match)

#### Delete Link
```http
DELETE /links/:id
```

#### Batch Create Links
```http
POST /links/batch
```

**Request Body:**
```json
{
  "links": [
    {
      "sourceId": "task_123",
      "targetId": "task_456",
      "linkType": "waiting"
    },
    {
      "sourceId": "task_123",
      "targetId": "task_789",
      "linkType": "references"
    }
  ]
}
```

### Graph Queries

#### Get Backlinks
```http
GET /tasks/:id/backlinks
```

Returns all tasks that link TO this task.

**Query Parameters:**
- `linkType` (string, optional): Filter by link type
- `depth` (number, optional): Traversal depth, default: 1, max: 5
- `includeIndirect` (boolean, optional): Include indirect links, default: false

**Response:**
```json
{
  "data": {
    "taskId": "task_456",
    "backlinks": [
      {
        "link": { /* link object */ },
        "task": { /* source task object */ },
        "depth": 1
      }
    ],
    "count": 5
  }
}
```

#### Get Forward Links
```http
GET /tasks/:id/forwardlinks
```

Returns all tasks that this task links TO.

Same parameters and response structure as backlinks.

#### Get Related Graph
```http
GET /tasks/:id/graph
```

Returns full graph of related tasks (both directions).

**Query Parameters:**
- `depth` (number, optional): Traversal depth, default: 2, max: 5
- `linkTypes` (string[], optional): Filter by link types
- `includeProjects` (boolean, optional): Include project nodes, default: false

**Response:**
```json
{
  "data": {
    "nodes": [
      {
        "id": "task_123",
        "type": "task",
        "content": "Task content",
        "status": "active"
      }
    ],
    "edges": [
      {
        "id": "link_123",
        "source": "task_123",
        "target": "task_456",
        "linkType": "waiting",
        "label": "Waiting for completion"
      }
    ],
    "cycles": [
      ["task_123", "task_456", "task_789", "task_123"]
    ]
  }
}
```

#### Detect Cycles
```http
GET /tasks/:id/cycles
```

Detects circular dependencies involving this task.

**Response:**
```json
{
  "data": {
    "hasCycles": true,
    "cycles": [
      {
        "path": ["task_123", "task_456", "task_789", "task_123"],
        "length": 3,
        "linkTypes": ["waiting", "waiting", "waiting"]
      }
    ]
  }
}
```

### Users

#### Get Current User
```http
GET /users/me
```

#### Update Current User
```http
PATCH /users/me
```

**Request Body:**
```json
{
  "displayName": "John Doe",
  "preferences": {
    "theme": "dark",
    "dateFormat": "MM/DD/YYYY",
    "timezone": "America/New_York"
  }
}
```

#### List Users
```http
GET /users
```

(For delegation and collaboration features)

**Query Parameters:**
- `search` (string, optional): Search by username/displayName/email

### Audit Logs

#### Get Entity History
```http
GET /audit/:entityType/:entityId
```

**Example:** `GET /audit/task/task_123`

**Response:**
```json
{
  "data": [
    {
      "id": "audit_123",
      "entityType": "task",
      "entityId": "task_123",
      "action": "update",
      "changes": [
        {
          "field": "status",
          "oldValue": "active",
          "newValue": "completed"
        }
      ],
      "userId": "user_789",
      "timestamp": "2025-01-15T11:00:00Z"
    }
  ]
}
```

### Date Parsing

#### Parse Natural Language Date
```http
POST /dates/parse
```

**Request Body:**
```json
{
  "input": "next Friday at 5pm",
  "timezone": "America/New_York",
  "referenceDate": "2025-01-15T10:00:00Z"  // Optional, defaults to now
}
```

**Response:**
```json
{
  "data": {
    "input": "next Friday at 5pm",
    "parsed": "2025-01-17T17:00:00-05:00",
    "iso": "2025-01-17T22:00:00Z",
    "relative": {
      "days": 2,
      "hours": 7
    },
    "confidence": 0.95
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate, constraint violation) |
| `CIRCULAR_REFERENCE` | 409 | Circular project nesting detected |
| `SELF_LINK` | 400 | Cannot link task to itself |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

```
Authenticated: 1000 requests per hour
Unauthenticated: 60 requests per hour
```

Response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642248000
```

## Webhooks (Future)

```http
POST /webhooks
```

Subscribe to events:
- `task.created`
- `task.updated`
- `task.deleted`
- `task.completed`
- `link.created`
- `link.deleted`

## WebSocket API (Future)

Real-time updates for collaboration.

```
wss://api.dashplus.app/v1/ws
```

**Messages:**
```json
{
  "type": "task.updated",
  "data": { /* task object */ },
  "timestamp": "2025-01-15T11:00:00Z"
}
```

## API Versioning

- Current version: `v1`
- Version in URL path: `/v1/tasks`
- Breaking changes require new version
- Old versions supported for 12 months after deprecation

## CORS

```
Access-Control-Allow-Origin: https://dashplus.app
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

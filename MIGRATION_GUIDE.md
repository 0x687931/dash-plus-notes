# Dash-Plus Notes: Migration Guide

## Overview

This guide explains how to migrate from the localStorage POC to a production backend (Node.js + PostgreSQL/SQLite).

## Migration Strategy

### Phase 1: localStorage POC (Current)
- Client-side only
- No backend required
- Data stored in browser localStorage
- Perfect for prototyping and demos

### Phase 2: Backend with localStorage Sync
- Add Node.js backend
- Sync localStorage to backend
- Maintain localStorage as cache
- Enables multi-device sync

### Phase 3: Full Backend Migration
- Backend as source of truth
- Remove localStorage dependency
- Add real-time collaboration
- Production-ready

## File Structure

```
dash-plus-notes/
├── src/
│   ├── storage/
│   │   ├── localStorage.js        # POC implementation (current)
│   │   ├── apiClient.js           # Future: Backend API client
│   │   ├── syncManager.js         # Future: Sync between local/remote
│   │   └── graphQueries.js        # Graph queries (works with both)
│   ├── utils/
│   │   └── dateParser.js          # Natural language date parser
│   └── api/                       # Future: Backend implementation
│       ├── server.js
│       ├── routes/
│       ├── models/
│       └── db/
├── DATA_MODEL.md                  # Data model specification
├── API_DESIGN.md                  # API design document
├── SQL_SCHEMA.sql                 # Database schema
└── MIGRATION_GUIDE.md             # This file
```

## Step-by-Step Migration

### Step 1: Create Backend Server

```bash
# Initialize backend
mkdir src/api
cd src/api
npm init -y

# Install dependencies
npm install express cors dotenv
npm install pg         # PostgreSQL
# OR
npm install sqlite3    # SQLite

# Install dev dependencies
npm install --save-dev nodemon
```

### Step 2: Create Database

#### Option A: PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
apt-get install postgresql  # Linux

# Create database
createdb dashplus_notes

# Run schema
psql dashplus_notes < SQL_SCHEMA.sql
```

#### Option B: SQLite

```bash
# Install SQLite (usually pre-installed)
sqlite3 --version

# Create database and run schema
sqlite3 dashplus_notes.db < SQL_SCHEMA_SQLITE.sql
```

### Step 3: Implement API Server

Create `src/api/server.js`:

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import linkRoutes from './routes/links.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/v1/tasks', taskRoutes);
app.use('/v1/projects', projectRoutes);
app.use('/v1/links', linkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 4: Implement Data Access Layer

Create `src/api/db/database.js`:

```javascript
import pg from 'pg';
const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashplus_notes',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### Step 5: Implement API Routes

Create `src/api/routes/tasks.js`:

```javascript
import express from 'express';
import pool from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /tasks
router.get('/', async (req, res) => {
  try {
    const {
      projectId,
      assigneeId,
      status,
      search,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      pageSize = 50,
    } = req.query;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (projectId !== undefined) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(projectId === 'null' ? null : projectId);
    }

    if (assigneeId) {
      paramCount++;
      query += ` AND assignee_id = $${paramCount}`;
      params.push(assigneeId);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (content ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total (before pagination)
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${query}) AS count_query`,
      params
    );
    const totalItems = parseInt(countResult.rows[0].count);

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'due_date', 'content'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Apply pagination
    const limit = Math.min(parseInt(pageSize), 200);
    const offset = (parseInt(page) - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    // Execute query
    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      meta: {
        page: parseInt(page),
        pageSize: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: offset + limit < totalItems,
        hasPrevious: page > 1,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tasks',
      },
    });
  }
});

// GET /tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Task ${id} not found`,
        },
      });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch task',
      },
    });
  }
});

// POST /tasks
router.post('/', async (req, res) => {
  try {
    const {
      type = 'task',
      symbol = '-',
      content,
      description,
      dueDate,
      projectId,
      assigneeId,
      priority,
      tags = [],
    } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required',
        },
      });
    }

    // TODO: Get userId from auth middleware
    const userId = '00000000-0000-0000-0000-000000000001';

    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO tasks (
        id, type, symbol, content, description, due_date,
        project_id, assignee_id, priority, tags, status,
        created_at, updated_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id, type, symbol, content, description, dueDate,
        projectId, assigneeId, priority, tags, 'active',
        now, now, userId, userId
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create task',
      },
    });
  }
});

// PATCH /tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields to update',
        },
      });
    }

    // Add updated_at
    fields.push('updated_at');
    values.push(new Date().toISOString());

    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
    const query = `UPDATE tasks SET ${setClause} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Task ${id} not found`,
        },
      });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update task',
      },
    });
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cascade = true } = req.query;

    if (cascade) {
      // Links will be deleted via ON DELETE CASCADE
    }

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Task ${id} not found`,
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete task',
      },
    });
  }
});

export default router;
```

### Step 6: Create API Client (Frontend)

Create `src/storage/apiClient.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Tasks
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id, data) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id, cascade = true) {
    return this.request(`/tasks/${id}?cascade=${cascade}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/projects?${params}`);
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/projects/${id}?${params}`, {
      method: 'DELETE',
    });
  }

  // Links
  async getLinks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/links?${params}`);
  }

  async createLink(data) {
    return this.request('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteLink(id) {
    return this.request(`/links/${id}`, {
      method: 'DELETE',
    });
  }

  // Graph queries
  async getBacklinks(taskId, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/tasks/${taskId}/backlinks?${params}`);
  }

  async getForwardLinks(taskId, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/tasks/${taskId}/forwardlinks?${params}`);
  }

  async getRelatedGraph(taskId, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/tasks/${taskId}/graph?${params}`);
  }
}

export default new ApiClient();
```

### Step 7: Data Migration Script

Create `scripts/migrate-to-backend.js`:

```javascript
import { TaskStore, ProjectStore, LinkStore } from '../src/storage/localStorage.js';
import apiClient from '../src/storage/apiClient.js';

async function migrateData() {
  console.log('Starting data migration...');

  try {
    // 1. Migrate projects first (dependencies)
    console.log('Migrating projects...');
    const projects = ProjectStore.getAll().data;
    for (const project of projects) {
      await apiClient.createProject(project);
    }
    console.log(`Migrated ${projects.length} projects`);

    // 2. Migrate tasks
    console.log('Migrating tasks...');
    const tasks = TaskStore.getAll({ pageSize: 10000 }).data;
    for (const task of tasks) {
      await apiClient.createTask(task);
    }
    console.log(`Migrated ${tasks.length} tasks`);

    // 3. Migrate links
    console.log('Migrating links...');
    const links = LinkStore.getAll().data;
    for (const link of links) {
      await apiClient.createLink(link);
    }
    console.log(`Migrated ${links.length} links`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
```

## Testing Migration

### 1. Test localStorage Implementation

```javascript
import { TaskStore, ProjectStore, LinkStore } from './src/storage/localStorage.js';

// Create test data
const project = ProjectStore.create({
  name: 'Test Project',
  description: 'Migration test',
});

const task = TaskStore.create({
  content: 'Test task',
  projectId: project.id,
});

console.log('Test data created successfully');
```

### 2. Start Backend Server

```bash
cd src/api
npm run dev
```

### 3. Run Migration

```bash
node scripts/migrate-to-backend.js
```

### 4. Verify Migration

```bash
# Check projects
curl http://localhost:3000/v1/projects

# Check tasks
curl http://localhost:3000/v1/tasks

# Check links
curl http://localhost:3000/v1/links
```

## Production Checklist

- [ ] Set up PostgreSQL/SQLite database
- [ ] Implement authentication (JWT)
- [ ] Add input validation and sanitization
- [ ] Implement rate limiting
- [ ] Add logging and monitoring
- [ ] Set up backup strategy
- [ ] Configure HTTPS/SSL
- [ ] Add CORS restrictions
- [ ] Implement caching (Redis)
- [ ] Set up CI/CD pipeline
- [ ] Write integration tests
- [ ] Document API endpoints
- [ ] Set up error tracking (Sentry)
- [ ] Configure environment variables
- [ ] Implement database migrations (e.g., Flyway, Liquibase)

## Performance Optimization

### Database Indexes

All critical indexes are defined in `SQL_SCHEMA.sql`:
- Task queries: `project_id`, `assignee_id`, `status`, `created_at`
- Link queries: `source_id`, `target_id`, composite indexes
- Full-text search: `content`, `description`

### Caching Strategy

```javascript
// Use Redis for caching frequently accessed data
import Redis from 'ioredis';

const redis = new Redis();

async function getTaskWithCache(id) {
  // Try cache first
  const cached = await redis.get(`task:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

  // Cache for 5 minutes
  await redis.setex(`task:${id}`, 300, JSON.stringify(task.rows[0]));

  return task.rows[0];
}
```

## Troubleshooting

### Common Issues

**Issue: CORS errors**
```javascript
// Solution: Configure CORS properly
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

**Issue: Database connection errors**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL
```

**Issue: Migration fails midway**
```javascript
// Solution: Wrap in transaction
await pool.query('BEGIN');
try {
  // Migration code
  await pool.query('COMMIT');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
}
```

## Support

For questions or issues:
1. Check the [DATA_MODEL.md](./DATA_MODEL.md) for schema details
2. Review [API_DESIGN.md](./API_DESIGN.md) for endpoint specifications
3. Examine [SQL_SCHEMA.sql](./SQL_SCHEMA.sql) for database structure

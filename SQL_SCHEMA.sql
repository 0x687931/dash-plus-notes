-- Dash-Plus Notes: SQL Schema
-- Target: PostgreSQL 14+ (SQLite compatible subset)
-- Migration path from localStorage JSON

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Preferences (JSONB for flexibility)
    preferences JSONB DEFAULT '{}',

    -- Indexes
    CONSTRAINT users_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core fields
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7),  -- Hex color: #RRGGBB
    icon VARCHAR(10),  -- Emoji or icon identifier

    -- Relationships
    parent_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Temporal
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    start_date DATE,
    end_date DATE,

    -- Metadata
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Constraints
    CONSTRAINT projects_status_check CHECK (status IN ('active', 'archived', 'completed')),
    CONSTRAINT projects_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT projects_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX idx_projects_parent_id ON projects(parent_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_name ON projects(name);

-- Prevent circular project nesting (enforced in application logic + trigger)
CREATE OR REPLACE FUNCTION prevent_circular_projects()
RETURNS TRIGGER AS $$
DECLARE
    current_parent UUID;
    depth INT := 0;
    max_depth INT := 10;
BEGIN
    -- Check if parent_id creates a cycle
    IF NEW.parent_id IS NOT NULL THEN
        current_parent := NEW.parent_id;

        WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
            -- If we encounter the new project ID, we have a cycle
            IF current_parent = NEW.id THEN
                RAISE EXCEPTION 'Circular project nesting detected';
            END IF;

            -- Move up the tree
            SELECT parent_id INTO current_parent
            FROM projects
            WHERE id = current_parent;

            depth := depth + 1;
        END LOOP;

        IF depth >= max_depth THEN
            RAISE EXCEPTION 'Project nesting exceeds maximum depth of %', max_depth;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_projects
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION prevent_circular_projects();

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core fields
    type VARCHAR(10) NOT NULL,
    symbol CHAR(1) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,

    -- Temporal
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Relationships
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    priority VARCHAR(10),
    tags TEXT[],  -- Array of strings

    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Constraints
    CONSTRAINT tasks_type_check CHECK (type IN ('task', 'note')),
    CONSTRAINT tasks_symbol_check CHECK (symbol IN ('-', '+', '→', '←', '△', '○')),
    CONSTRAINT tasks_status_check CHECK (status IN ('active', 'completed', 'cancelled', 'waiting')),
    CONSTRAINT tasks_priority_check CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT tasks_content_not_empty CHECK (char_length(trim(content)) > 0),
    CONSTRAINT tasks_completed_at_check CHECK (completed_at IS NULL OR completed_at >= created_at),
    CONSTRAINT tasks_due_date_check CHECK (due_date IS NULL OR due_date >= created_at)
);

-- Indexes for common queries
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at DESC);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);  -- GIN index for array searches

-- Full-text search index (PostgreSQL)
CREATE INDEX idx_tasks_content_fts ON tasks USING GIN(to_tsvector('english', content));
CREATE INDEX idx_tasks_description_fts ON tasks USING GIN(to_tsvector('english', coalesce(description, '')));

-- Composite indexes for common query patterns
CREATE INDEX idx_tasks_status_project ON tasks(status, project_id);
CREATE INDEX idx_tasks_status_assignee ON tasks(status, assignee_id);

-- ============================================================================
-- LINKS TABLE
-- ============================================================================

CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationship
    source_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    link_type VARCHAR(20) NOT NULL,

    -- Metadata
    label VARCHAR(200),
    strength DECIMAL(3, 2),  -- 0.00 to 1.00

    -- Temporal
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),

    -- Constraints
    CONSTRAINT links_type_check CHECK (link_type IN ('waiting', 'delegated', 'references', 'moved', 'blocks', 'related')),
    CONSTRAINT links_strength_check CHECK (strength IS NULL OR (strength >= 0 AND strength <= 1)),
    CONSTRAINT links_no_self_loop CHECK (source_id != target_id),

    -- Unique constraint: prevent duplicate links of same type between same tasks
    CONSTRAINT links_unique_relationship UNIQUE (source_id, target_id, link_type)
);

-- Indexes for graph queries
CREATE INDEX idx_links_source_id ON links(source_id);
CREATE INDEX idx_links_target_id ON links(target_id);
CREATE INDEX idx_links_link_type ON links(link_type);
CREATE INDEX idx_links_created_by ON links(created_by);

-- Composite indexes for bidirectional lookups
CREATE INDEX idx_links_source_target ON links(source_id, target_id);
CREATE INDEX idx_links_target_source ON links(target_id, source_id);
CREATE INDEX idx_links_type_source ON links(link_type, source_id);
CREATE INDEX idx_links_type_target ON links(link_type, target_id);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What changed
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,

    -- Change details (JSONB for flexibility)
    changes JSONB NOT NULL DEFAULT '[]',

    -- Context
    user_id UUID NOT NULL REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    -- Constraints
    CONSTRAINT audit_logs_entity_type_check CHECK (entity_type IN ('task', 'note', 'project', 'link', 'user')),
    CONSTRAINT audit_logs_action_check CHECK (action IN ('create', 'update', 'delete', 'restore'))
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-populate audit logs
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes_array JSONB := '[]'::JSONB;
    old_row JSONB;
    new_row JSONB;
    key TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, user_id, changes)
        VALUES ('task', NEW.id, 'create', NEW.created_by, '[]'::JSONB);

    ELSIF TG_OP = 'UPDATE' THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);

        -- Build changes array
        FOR key IN SELECT jsonb_object_keys(new_row)
        LOOP
            IF old_row->key IS DISTINCT FROM new_row->key THEN
                changes_array := changes_array || jsonb_build_object(
                    'field', key,
                    'oldValue', old_row->key,
                    'newValue', new_row->key
                );
            END IF;
        END LOOP;

        IF jsonb_array_length(changes_array) > 0 THEN
            INSERT INTO audit_logs (entity_type, entity_id, action, user_id, changes)
            VALUES ('task', NEW.id, 'update', NEW.updated_by, changes_array);
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, user_id, changes)
        VALUES ('task', OLD.id, 'delete', OLD.updated_by, '[]'::JSONB);
    END IF;

    RETURN NULL;  -- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_task_changes
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_changes();

-- Similar triggers for projects and links (omitted for brevity)

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Tasks with project and assignee names
CREATE OR REPLACE VIEW tasks_enriched AS
SELECT
    t.*,
    p.name AS project_name,
    p.color AS project_color,
    u.display_name AS assignee_name,
    u.avatar_url AS assignee_avatar
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN users u ON t.assignee_id = u.id;

-- View: Project statistics
CREATE OR REPLACE VIEW project_stats AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    COUNT(t.id) AS total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN t.status = 'active' THEN 1 END) AS active_tasks,
    COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) AS waiting_tasks,
    COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) AS cancelled_tasks,
    CASE
        WHEN COUNT(t.id) > 0
        THEN ROUND(COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::DECIMAL / COUNT(t.id), 2)
        ELSE 0
    END AS completion_rate
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name;

-- View: Link graph (denormalized for easier querying)
CREATE OR REPLACE VIEW link_graph AS
SELECT
    l.id AS link_id,
    l.link_type,
    l.label,
    l.strength,
    l.source_id,
    ts.content AS source_content,
    ts.status AS source_status,
    l.target_id,
    tt.content AS target_content,
    tt.status AS target_status,
    l.created_at
FROM links l
JOIN tasks ts ON l.source_id = ts.id
JOIN tasks tt ON l.target_id = tt.id;

-- ============================================================================
-- FUNCTIONS FOR GRAPH QUERIES
-- ============================================================================

-- Function: Get all backlinks (tasks linking TO a given task)
CREATE OR REPLACE FUNCTION get_backlinks(
    task_id_param UUID,
    link_type_param VARCHAR DEFAULT NULL,
    depth_param INT DEFAULT 1
)
RETURNS TABLE (
    link_id UUID,
    source_task_id UUID,
    source_content TEXT,
    link_type VARCHAR,
    link_label VARCHAR,
    depth_level INT
) AS $$
WITH RECURSIVE backlink_tree AS (
    -- Base case: direct backlinks
    SELECT
        l.id AS link_id,
        l.source_id AS source_task_id,
        t.content AS source_content,
        l.link_type,
        l.label AS link_label,
        1 AS depth_level
    FROM links l
    JOIN tasks t ON l.source_id = t.id
    WHERE l.target_id = task_id_param
      AND (link_type_param IS NULL OR l.link_type = link_type_param)

    UNION ALL

    -- Recursive case: indirect backlinks
    SELECT
        l.id,
        l.source_id,
        t.content,
        l.link_type,
        l.label,
        bt.depth_level + 1
    FROM links l
    JOIN tasks t ON l.source_id = t.id
    JOIN backlink_tree bt ON l.target_id = bt.source_task_id
    WHERE bt.depth_level < depth_param
      AND (link_type_param IS NULL OR l.link_type = link_type_param)
)
SELECT * FROM backlink_tree;
$$ LANGUAGE sql STABLE;

-- Function: Get all forward links (tasks a given task links TO)
CREATE OR REPLACE FUNCTION get_forwardlinks(
    task_id_param UUID,
    link_type_param VARCHAR DEFAULT NULL,
    depth_param INT DEFAULT 1
)
RETURNS TABLE (
    link_id UUID,
    target_task_id UUID,
    target_content TEXT,
    link_type VARCHAR,
    link_label VARCHAR,
    depth_level INT
) AS $$
WITH RECURSIVE forwardlink_tree AS (
    -- Base case: direct forward links
    SELECT
        l.id AS link_id,
        l.target_id AS target_task_id,
        t.content AS target_content,
        l.link_type,
        l.label AS link_label,
        1 AS depth_level
    FROM links l
    JOIN tasks t ON l.target_id = t.id
    WHERE l.source_id = task_id_param
      AND (link_type_param IS NULL OR l.link_type = link_type_param)

    UNION ALL

    -- Recursive case: indirect forward links
    SELECT
        l.id,
        l.target_id,
        t.content,
        l.link_type,
        l.label,
        ft.depth_level + 1
    FROM links l
    JOIN tasks t ON l.target_id = t.id
    JOIN forwardlink_tree ft ON l.source_id = ft.target_task_id
    WHERE ft.depth_level < depth_param
      AND (link_type_param IS NULL OR l.link_type = link_type_param)
)
SELECT * FROM forwardlink_tree;
$$ LANGUAGE sql STABLE;

-- Function: Detect cycles involving a given task
CREATE OR REPLACE FUNCTION detect_cycles(task_id_param UUID)
RETURNS TABLE (
    cycle_path UUID[],
    cycle_length INT
) AS $$
WITH RECURSIVE path_search AS (
    -- Start from the given task
    SELECT
        ARRAY[task_id_param] AS path,
        l.target_id AS current_node,
        1 AS depth
    FROM links l
    WHERE l.source_id = task_id_param

    UNION ALL

    -- Follow the path
    SELECT
        ps.path || l.target_id,
        l.target_id,
        ps.depth + 1
    FROM links l
    JOIN path_search ps ON l.source_id = ps.current_node
    WHERE l.target_id = ANY(ps.path) = FALSE  -- Prevent infinite loops
      AND ps.depth < 10  -- Max depth to prevent runaway queries
)
SELECT
    path || current_node AS cycle_path,
    array_length(path || current_node, 1) AS cycle_length
FROM path_search
WHERE current_node = task_id_param;  -- Cycle detected: we're back at start
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- SEED DATA (Development)
-- ============================================================================

-- Insert default user
INSERT INTO users (id, username, email, display_name, preferences)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo',
    'demo@dashplus.app',
    'Demo User',
    '{"theme": "light", "dateFormat": "MM/DD/YYYY", "timezone": "UTC"}'
);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- SQLite compatibility notes:
-- 1. Replace UUID with TEXT and use application-generated UUIDs
-- 2. Replace JSONB with TEXT and JSON functions
-- 3. Replace TEXT[] with TEXT (comma-separated) or separate junction table
-- 4. Replace TIMESTAMP WITH TIME ZONE with TEXT (ISO 8601)
-- 5. Replace INET with TEXT
-- 6. Triggers and functions have different syntax
-- 7. No native full-text search (use FTS5 extension)
-- 8. No GIN indexes (use standard indexes)

-- Example SQLite conversion for tasks table:
-- CREATE TABLE tasks (
--     id TEXT PRIMARY KEY,
--     type TEXT NOT NULL CHECK (type IN ('task', 'note')),
--     symbol TEXT NOT NULL CHECK (symbol IN ('-', '+', '→', '←', '△', '○')),
--     content TEXT NOT NULL,
--     -- ... (similar structure with TEXT types)
-- );

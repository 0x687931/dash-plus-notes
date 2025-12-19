/**
 * localStorage implementation for Dash-Plus Notes (POC)
 *
 * This module provides a localStorage-based data access layer that mirrors
 * the future backend API. Designed for easy migration to Node.js + SQL.
 */

import { v4 as uuidv4 } from 'uuid';
import { parseNaturalDate } from '../utils/dateParser.js';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  TASKS: 'dashplus:tasks',
  PROJECTS: 'dashplus:projects',
  LINKS: 'dashplus:links',
  USERS: 'dashplus:users',
  AUDIT_LOGS: 'dashplus:audit_logs',
  CURRENT_USER: 'dashplus:current_user',
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

class LocalStorage {
  /**
   * Get all items from a collection
   */
  static getAll(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return [];
    }
  }

  /**
   * Set all items in a collection
   */
  static setAll(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      return false;
    }
  }

  /**
   * Get a single item by ID
   */
  static getById(key, id) {
    const items = this.getAll(key);
    return items.find(item => item.id === id);
  }

  /**
   * Add a new item to a collection
   */
  static add(key, item) {
    const items = this.getAll(key);
    items.push(item);
    return this.setAll(key, items);
  }

  /**
   * Update an existing item
   */
  static update(key, id, updates) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error(`Item ${id} not found in ${key}`);
    }

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.setAll(key, items);
    return items[index];
  }

  /**
   * Delete an item by ID
   */
  static delete(key, id) {
    const items = this.getAll(key);
    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === items.length) {
      throw new Error(`Item ${id} not found in ${key}`);
    }

    return this.setAll(key, filtered);
  }

  /**
   * Clear all data (for testing)
   */
  static clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

// ============================================================================
// CURRENT USER MANAGEMENT
// ============================================================================

class UserManager {
  static DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

  /**
   * Get or create demo user
   */
  static getCurrentUser() {
    let currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (!currentUserId) {
      // Initialize demo user
      const demoUser = {
        id: this.DEMO_USER_ID,
        username: 'demo',
        email: 'demo@dashplus.app',
        displayName: 'Demo User',
        preferences: {
          theme: 'light',
          dateFormat: 'MM/DD/YYYY',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const users = LocalStorage.getAll(STORAGE_KEYS.USERS);
      if (!users.find(u => u.id === this.DEMO_USER_ID)) {
        LocalStorage.add(STORAGE_KEYS.USERS, demoUser);
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, this.DEMO_USER_ID);
      currentUserId = this.DEMO_USER_ID;
    }

    return LocalStorage.getById(STORAGE_KEYS.USERS, currentUserId);
  }

  /**
   * Update current user preferences
   */
  static updateCurrentUser(updates) {
    const currentUser = this.getCurrentUser();
    return LocalStorage.update(STORAGE_KEYS.USERS, currentUser.id, updates);
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

class AuditLogger {
  /**
   * Log a change to the audit trail
   */
  static log(entityType, entityId, action, changes = []) {
    const currentUser = UserManager.getCurrentUser();

    const auditLog = {
      id: uuidv4(),
      entityType,
      entityId,
      action,
      changes,
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
    };

    LocalStorage.add(STORAGE_KEYS.AUDIT_LOGS, auditLog);
  }

  /**
   * Get audit history for an entity
   */
  static getHistory(entityType, entityId) {
    const logs = LocalStorage.getAll(STORAGE_KEYS.AUDIT_LOGS);
    return logs.filter(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }

  /**
   * Calculate field changes between old and new objects
   */
  static calculateChanges(oldObj, newObj) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allKeys.forEach(key => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes.push({
          field: key,
          oldValue: oldObj[key],
          newValue: newObj[key],
        });
      }
    });

    return changes;
  }
}

// ============================================================================
// TASK CRUD
// ============================================================================

export class TaskStore {
  /**
   * Create a new task
   */
  static create(taskData) {
    const currentUser = UserManager.getCurrentUser();
    const now = new Date().toISOString();

    // Parse natural language due date
    if (taskData.dueDate && typeof taskData.dueDate === 'string') {
      const parsed = parseNaturalDate(taskData.dueDate);
      taskData.dueDate = parsed ? parsed.toISOString() : null;
    }

    const task = {
      id: uuidv4(),
      type: taskData.type || 'task',
      symbol: taskData.symbol || '-',
      content: taskData.content,
      description: taskData.description || null,
      status: taskData.status || 'active',
      priority: taskData.priority || null,
      projectId: taskData.projectId || null,
      assigneeId: taskData.assigneeId || null,
      dueDate: taskData.dueDate || null,
      completedAt: null,
      tags: taskData.tags || [],
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
      updatedBy: currentUser.id,
    };

    // Validation
    this.validate(task);

    LocalStorage.add(STORAGE_KEYS.TASKS, task);
    AuditLogger.log('task', task.id, 'create');

    return task;
  }

  /**
   * Get task by ID
   */
  static getById(id) {
    const task = LocalStorage.getById(STORAGE_KEYS.TASKS, id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }
    return task;
  }

  /**
   * Get all tasks with optional filtering
   */
  static getAll(filters = {}) {
    let tasks = LocalStorage.getAll(STORAGE_KEYS.TASKS);

    // Apply filters
    if (filters.projectId !== undefined) {
      tasks = tasks.filter(t => t.projectId === filters.projectId);
    }

    if (filters.assigneeId !== undefined) {
      tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
    }

    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }

    if (filters.symbol) {
      tasks = tasks.filter(t => t.symbol === filters.symbol);
    }

    if (filters.tags && filters.tags.length > 0) {
      tasks = tasks.filter(t =>
        filters.tags.some(tag => t.tags.includes(tag))
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      tasks = tasks.filter(t =>
        t.content.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    const sortField = filters.sort || 'createdAt';
    const sortOrder = filters.order || 'desc';

    tasks.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : (aVal > bVal ? 1 : 0);
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 50, 200);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: tasks.slice(start, end),
      meta: {
        page,
        pageSize,
        totalItems: tasks.length,
        totalPages: Math.ceil(tasks.length / pageSize),
        hasNext: end < tasks.length,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Update a task
   */
  static update(id, updates) {
    const currentUser = UserManager.getCurrentUser();
    const oldTask = this.getById(id);

    // Parse natural language due date
    if (updates.dueDate && typeof updates.dueDate === 'string') {
      const parsed = parseNaturalDate(updates.dueDate);
      updates.dueDate = parsed ? parsed.toISOString() : null;
    }

    const newTask = {
      ...oldTask,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id,
    };

    // Validation
    this.validate(newTask);

    const changes = AuditLogger.calculateChanges(oldTask, newTask);
    LocalStorage.update(STORAGE_KEYS.TASKS, id, updates);

    if (changes.length > 0) {
      AuditLogger.log('task', id, 'update', changes);
    }

    return newTask;
  }

  /**
   * Delete a task
   */
  static delete(id, options = {}) {
    const task = this.getById(id);

    // Delete associated links if cascade is true (default)
    if (options.cascade !== false) {
      const links = LinkStore.getAll({ entityId: id });
      links.data.forEach(link => LinkStore.delete(link.id));
    }

    LocalStorage.delete(STORAGE_KEYS.TASKS, id);
    AuditLogger.log('task', id, 'delete');

    return true;
  }

  /**
   * Complete a task
   */
  static complete(id) {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Bulk update tasks
   */
  static bulkUpdate(ids, updates) {
    const results = { success: [], failed: [], errors: [] };

    ids.forEach(id => {
      try {
        this.update(id, updates);
        results.success.push(id);
      } catch (error) {
        results.failed.push(id);
        results.errors.push({ id, error: error.message });
      }
    });

    return results;
  }

  /**
   * Validate task data
   */
  static validate(task) {
    const validTypes = ['task', 'note'];
    const validSymbols = ['-', '+', '→', '←', '△', '○'];
    const validStatuses = ['active', 'completed', 'cancelled', 'waiting'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validTypes.includes(task.type)) {
      throw new Error(`Invalid task type: ${task.type}`);
    }

    if (!validSymbols.includes(task.symbol)) {
      throw new Error(`Invalid symbol: ${task.symbol}`);
    }

    if (!task.content || task.content.trim().length === 0) {
      throw new Error('Task content cannot be empty');
    }

    if (!validStatuses.includes(task.status)) {
      throw new Error(`Invalid status: ${task.status}`);
    }

    if (task.priority && !validPriorities.includes(task.priority)) {
      throw new Error(`Invalid priority: ${task.priority}`);
    }

    if (task.projectId) {
      const project = ProjectStore.getById(task.projectId);
      if (!project) {
        throw new Error(`Project ${task.projectId} not found`);
      }
    }

    if (task.assigneeId) {
      const user = LocalStorage.getById(STORAGE_KEYS.USERS, task.assigneeId);
      if (!user) {
        throw new Error(`User ${task.assigneeId} not found`);
      }
    }
  }
}

// ============================================================================
// PROJECT CRUD
// ============================================================================

export class ProjectStore {
  /**
   * Create a new project
   */
  static create(projectData) {
    const currentUser = UserManager.getCurrentUser();
    const now = new Date().toISOString();

    const project = {
      id: uuidv4(),
      name: projectData.name,
      description: projectData.description || null,
      color: projectData.color || null,
      icon: projectData.icon || null,
      parentId: projectData.parentId || null,
      status: projectData.status || 'active',
      startDate: projectData.startDate || null,
      endDate: projectData.endDate || null,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
      updatedBy: currentUser.id,
    };

    // Validation
    this.validate(project);

    // Check for circular nesting
    if (project.parentId) {
      this.checkCircularNesting(project.id, project.parentId);
    }

    LocalStorage.add(STORAGE_KEYS.PROJECTS, project);
    AuditLogger.log('project', project.id, 'create');

    return project;
  }

  /**
   * Get project by ID
   */
  static getById(id) {
    const project = LocalStorage.getById(STORAGE_KEYS.PROJECTS, id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }
    return project;
  }

  /**
   * Get all projects with optional filtering
   */
  static getAll(filters = {}) {
    let projects = LocalStorage.getAll(STORAGE_KEYS.PROJECTS);

    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }

    if (filters.parentId !== undefined) {
      projects = projects.filter(p => p.parentId === filters.parentId);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    return { data: projects, meta: {} };
  }

  /**
   * Update a project
   */
  static update(id, updates) {
    const currentUser = UserManager.getCurrentUser();
    const oldProject = this.getById(id);

    // Check circular nesting if parent changed
    if (updates.parentId && updates.parentId !== oldProject.parentId) {
      this.checkCircularNesting(id, updates.parentId);
    }

    const newProject = {
      ...oldProject,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id,
    };

    this.validate(newProject);

    const changes = AuditLogger.calculateChanges(oldProject, newProject);
    LocalStorage.update(STORAGE_KEYS.PROJECTS, id, updates);

    if (changes.length > 0) {
      AuditLogger.log('project', id, 'update', changes);
    }

    return newProject;
  }

  /**
   * Delete a project
   */
  static delete(id, options = {}) {
    const project = this.getById(id);

    // Handle child projects
    const children = this.getAll({ parentId: id }).data;
    if (children.length > 0) {
      if (options.deleteChildren) {
        children.forEach(child => this.delete(child.id, options));
      } else {
        // Orphan children (set parentId to null)
        children.forEach(child => {
          LocalStorage.update(STORAGE_KEYS.PROJECTS, child.id, { parentId: null });
        });
      }
    }

    // Handle tasks
    const tasks = TaskStore.getAll({ projectId: id }).data;
    if (tasks.length > 0) {
      if (options.deleteTasks) {
        tasks.forEach(task => TaskStore.delete(task.id));
      } else {
        // Orphan tasks
        tasks.forEach(task => {
          LocalStorage.update(STORAGE_KEYS.TASKS, task.id, { projectId: null });
        });
      }
    }

    LocalStorage.delete(STORAGE_KEYS.PROJECTS, id);
    AuditLogger.log('project', id, 'delete');

    return true;
  }

  /**
   * Get project tree (with all nested children)
   */
  static getTree(id) {
    const project = this.getById(id);
    const children = this.getAll({ parentId: id }).data;

    return {
      ...project,
      children: children.map(child => this.getTree(child.id)),
    };
  }

  /**
   * Get project statistics
   */
  static getStats(id) {
    const tasks = TaskStore.getAll({ projectId: id }).data;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeTasks = tasks.filter(t => t.status === 'active').length;
    const waitingTasks = tasks.filter(t => t.status === 'waiting').length;

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      waitingTasks,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    };
  }

  /**
   * Check for circular project nesting
   */
  static checkCircularNesting(projectId, parentId, visited = new Set()) {
    if (visited.has(parentId)) {
      throw new Error('Circular project nesting detected');
    }

    if (parentId === projectId) {
      throw new Error('Project cannot be its own parent');
    }

    visited.add(parentId);

    const parent = this.getById(parentId);
    if (parent.parentId) {
      this.checkCircularNesting(projectId, parent.parentId, visited);
    }
  }

  /**
   * Validate project data
   */
  static validate(project) {
    const validStatuses = ['active', 'archived', 'completed'];

    if (!project.name || project.name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }

    if (!validStatuses.includes(project.status)) {
      throw new Error(`Invalid status: ${project.status}`);
    }

    if (project.endDate && project.startDate) {
      if (new Date(project.endDate) < new Date(project.startDate)) {
        throw new Error('End date cannot be before start date');
      }
    }
  }
}

// ============================================================================
// LINK CRUD
// ============================================================================

export class LinkStore {
  /**
   * Create a new link
   */
  static create(linkData) {
    const currentUser = UserManager.getCurrentUser();
    const now = new Date().toISOString();

    const link = {
      id: uuidv4(),
      sourceId: linkData.sourceId,
      targetId: linkData.targetId,
      linkType: linkData.linkType,
      label: linkData.label || null,
      strength: linkData.strength || null,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
    };

    // Validation
    this.validate(link);

    LocalStorage.add(STORAGE_KEYS.LINKS, link);
    AuditLogger.log('link', link.id, 'create');

    return link;
  }

  /**
   * Get link by ID
   */
  static getById(id) {
    const link = LocalStorage.getById(STORAGE_KEYS.LINKS, id);
    if (!link) {
      throw new Error(`Link ${id} not found`);
    }
    return link;
  }

  /**
   * Get all links with optional filtering
   */
  static getAll(filters = {}) {
    let links = LocalStorage.getAll(STORAGE_KEYS.LINKS);

    if (filters.sourceId) {
      links = links.filter(l => l.sourceId === filters.sourceId);
    }

    if (filters.targetId) {
      links = links.filter(l => l.targetId === filters.targetId);
    }

    if (filters.linkType) {
      links = links.filter(l => l.linkType === filters.linkType);
    }

    if (filters.entityId) {
      // Bidirectional: source OR target
      links = links.filter(
        l => l.sourceId === filters.entityId || l.targetId === filters.entityId
      );
    }

    return { data: links, meta: {} };
  }

  /**
   * Update a link
   */
  static update(id, updates) {
    const oldLink = this.getById(id);

    const newLink = {
      ...oldLink,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.validate(newLink);

    const changes = AuditLogger.calculateChanges(oldLink, newLink);
    LocalStorage.update(STORAGE_KEYS.LINKS, id, updates);

    if (changes.length > 0) {
      AuditLogger.log('link', id, 'update', changes);
    }

    return newLink;
  }

  /**
   * Delete a link
   */
  static delete(id) {
    LocalStorage.delete(STORAGE_KEYS.LINKS, id);
    AuditLogger.log('link', id, 'delete');
    return true;
  }

  /**
   * Batch create links
   */
  static batchCreate(linksData) {
    return linksData.map(linkData => this.create(linkData));
  }

  /**
   * Validate link data
   */
  static validate(link) {
    const validLinkTypes = ['waiting', 'delegated', 'references', 'moved', 'blocks', 'related'];

    if (link.sourceId === link.targetId) {
      throw new Error('Cannot create self-loop: source and target cannot be the same');
    }

    if (!validLinkTypes.includes(link.linkType)) {
      throw new Error(`Invalid link type: ${link.linkType}`);
    }

    // Verify tasks exist
    const sourceTask = TaskStore.getById(link.sourceId);
    const targetTask = TaskStore.getById(link.targetId);

    if (!sourceTask) {
      throw new Error(`Source task ${link.sourceId} not found`);
    }

    if (!targetTask) {
      throw new Error(`Target task ${link.targetId} not found`);
    }

    if (link.strength !== null && link.strength !== undefined) {
      if (link.strength < 0 || link.strength > 1) {
        throw new Error('Link strength must be between 0 and 1');
      }
    }
  }
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const Storage = {
  clearAll: LocalStorage.clearAll,
  getCurrentUser: UserManager.getCurrentUser,
  updateCurrentUser: UserManager.updateCurrentUser,
  getAuditHistory: AuditLogger.getHistory,
};

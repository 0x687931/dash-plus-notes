/**
 * Tests for localStorage implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskStore, ProjectStore, LinkStore, Storage } from '../src/storage/localStorage.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

describe('TaskStore', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should create a task', () => {
    const task = TaskStore.create({
      content: 'Test task',
      symbol: '-',
      type: 'task',
    });

    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.content).toBe('Test task');
    expect(task.symbol).toBe('-');
    expect(task.status).toBe('active');
  });

  it('should get task by id', () => {
    const created = TaskStore.create({
      content: 'Test task',
    });

    const retrieved = TaskStore.getById(created.id);

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.content).toBe('Test task');
  });

  it('should update a task', () => {
    const task = TaskStore.create({
      content: 'Original content',
    });

    const updated = TaskStore.update(task.id, {
      content: 'Updated content',
      status: 'completed',
    });

    expect(updated.content).toBe('Updated content');
    expect(updated.status).toBe('completed');
    expect(updated.completedAt).toBeNull(); // Must be set explicitly
  });

  it('should complete a task', () => {
    const task = TaskStore.create({
      content: 'Task to complete',
    });

    const completed = TaskStore.complete(task.id);

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('should filter tasks by status', () => {
    TaskStore.create({ content: 'Task 1', status: 'active' });
    TaskStore.create({ content: 'Task 2', status: 'completed' });
    TaskStore.create({ content: 'Task 3', status: 'active' });

    const active = TaskStore.getAll({ status: 'active' });

    expect(active.data.length).toBe(2);
    expect(active.data.every(t => t.status === 'active')).toBe(true);
  });

  it('should filter tasks by project', () => {
    const project = ProjectStore.create({ name: 'Test Project' });

    TaskStore.create({ content: 'Task 1', projectId: project.id });
    TaskStore.create({ content: 'Task 2' });
    TaskStore.create({ content: 'Task 3', projectId: project.id });

    const projectTasks = TaskStore.getAll({ projectId: project.id });

    expect(projectTasks.data.length).toBe(2);
    expect(projectTasks.data.every(t => t.projectId === project.id)).toBe(true);
  });

  it('should search tasks by content', () => {
    TaskStore.create({ content: 'Fix authentication bug' });
    TaskStore.create({ content: 'Update documentation' });
    TaskStore.create({ content: 'Implement authentication' });

    const results = TaskStore.getAll({ search: 'authentication' });

    expect(results.data.length).toBe(2);
  });

  it('should paginate tasks', () => {
    // Create 10 tasks
    for (let i = 1; i <= 10; i++) {
      TaskStore.create({ content: `Task ${i}` });
    }

    const page1 = TaskStore.getAll({ page: 1, pageSize: 5 });
    const page2 = TaskStore.getAll({ page: 2, pageSize: 5 });

    expect(page1.data.length).toBe(5);
    expect(page2.data.length).toBe(5);
    expect(page1.meta.totalPages).toBe(2);
    expect(page1.meta.hasNext).toBe(true);
    expect(page2.meta.hasNext).toBe(false);
  });

  it('should delete a task', () => {
    const task = TaskStore.create({ content: 'Task to delete' });

    TaskStore.delete(task.id);

    expect(() => TaskStore.getById(task.id)).toThrow();
  });

  it('should validate required fields', () => {
    expect(() => {
      TaskStore.create({ content: '' });
    }).toThrow('Task content cannot be empty');

    expect(() => {
      TaskStore.create({ content: 'Test', symbol: 'X' });
    }).toThrow('Invalid symbol');
  });

  it('should bulk update tasks', () => {
    const task1 = TaskStore.create({ content: 'Task 1' });
    const task2 = TaskStore.create({ content: 'Task 2' });
    const task3 = TaskStore.create({ content: 'Task 3' });

    const result = TaskStore.bulkUpdate(
      [task1.id, task2.id, task3.id],
      { status: 'completed' }
    );

    expect(result.success.length).toBe(3);
    expect(result.failed.length).toBe(0);

    const updated1 = TaskStore.getById(task1.id);
    expect(updated1.status).toBe('completed');
  });
});

describe('ProjectStore', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should create a project', () => {
    const project = ProjectStore.create({
      name: 'Test Project',
      description: 'A test project',
    });

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');
    expect(project.status).toBe('active');
  });

  it('should get project tree', () => {
    const root = ProjectStore.create({ name: 'Root' });
    const child1 = ProjectStore.create({ name: 'Child 1', parentId: root.id });
    const child2 = ProjectStore.create({ name: 'Child 2', parentId: root.id });
    const grandchild = ProjectStore.create({ name: 'Grandchild', parentId: child1.id });

    const tree = ProjectStore.getTree(root.id);

    expect(tree.children.length).toBe(2);
    expect(tree.children[0].children.length).toBe(1);
    expect(tree.children[0].children[0].name).toBe('Grandchild');
  });

  it('should prevent circular nesting', () => {
    const project1 = ProjectStore.create({ name: 'Project 1' });
    const project2 = ProjectStore.create({ name: 'Project 2', parentId: project1.id });

    // Try to make project1 a child of project2 (circular)
    expect(() => {
      ProjectStore.update(project1.id, { parentId: project2.id });
    }).toThrow('Circular project nesting detected');
  });

  it('should calculate project stats', () => {
    const project = ProjectStore.create({ name: 'Test Project' });

    TaskStore.create({ content: 'Task 1', projectId: project.id, status: 'completed' });
    TaskStore.create({ content: 'Task 2', projectId: project.id, status: 'completed' });
    TaskStore.create({ content: 'Task 3', projectId: project.id, status: 'active' });

    const stats = ProjectStore.getStats(project.id);

    expect(stats.totalTasks).toBe(3);
    expect(stats.completedTasks).toBe(2);
    expect(stats.activeTasks).toBe(1);
    expect(stats.completionRate).toBeCloseTo(0.67, 1);
  });

  it('should delete project and orphan tasks', () => {
    const project = ProjectStore.create({ name: 'Project to delete' });
    const task = TaskStore.create({ content: 'Task', projectId: project.id });

    ProjectStore.delete(project.id, { deleteTasks: false });

    expect(() => ProjectStore.getById(project.id)).toThrow();

    const orphanedTask = TaskStore.getById(task.id);
    expect(orphanedTask.projectId).toBeNull();
  });

  it('should delete project and cascade delete tasks', () => {
    const project = ProjectStore.create({ name: 'Project to delete' });
    const task = TaskStore.create({ content: 'Task', projectId: project.id });

    ProjectStore.delete(project.id, { deleteTasks: true });

    expect(() => ProjectStore.getById(project.id)).toThrow();
    expect(() => TaskStore.getById(task.id)).toThrow();
  });
});

describe('LinkStore', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should create a link', () => {
    const task1 = TaskStore.create({ content: 'Task 1' });
    const task2 = TaskStore.create({ content: 'Task 2' });

    const link = LinkStore.create({
      sourceId: task1.id,
      targetId: task2.id,
      linkType: 'waiting',
      label: 'Waiting for completion',
    });

    expect(link).toBeDefined();
    expect(link.sourceId).toBe(task1.id);
    expect(link.targetId).toBe(task2.id);
    expect(link.linkType).toBe('waiting');
  });

  it('should prevent self-loops', () => {
    const task = TaskStore.create({ content: 'Task' });

    expect(() => {
      LinkStore.create({
        sourceId: task.id,
        targetId: task.id,
        linkType: 'waiting',
      });
    }).toThrow('Cannot create self-loop');
  });

  it('should filter links by source', () => {
    const task1 = TaskStore.create({ content: 'Task 1' });
    const task2 = TaskStore.create({ content: 'Task 2' });
    const task3 = TaskStore.create({ content: 'Task 3' });

    LinkStore.create({ sourceId: task1.id, targetId: task2.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: task1.id, targetId: task3.id, linkType: 'references' });
    LinkStore.create({ sourceId: task2.id, targetId: task3.id, linkType: 'waiting' });

    const links = LinkStore.getAll({ sourceId: task1.id });

    expect(links.data.length).toBe(2);
    expect(links.data.every(l => l.sourceId === task1.id)).toBe(true);
  });

  it('should filter links bidirectionally', () => {
    const task1 = TaskStore.create({ content: 'Task 1' });
    const task2 = TaskStore.create({ content: 'Task 2' });
    const task3 = TaskStore.create({ content: 'Task 3' });

    LinkStore.create({ sourceId: task1.id, targetId: task2.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: task3.id, targetId: task1.id, linkType: 'references' });

    const links = LinkStore.getAll({ entityId: task1.id });

    expect(links.data.length).toBe(2);
  });

  it('should delete link when task is deleted', () => {
    const task1 = TaskStore.create({ content: 'Task 1' });
    const task2 = TaskStore.create({ content: 'Task 2' });

    const link = LinkStore.create({
      sourceId: task1.id,
      targetId: task2.id,
      linkType: 'waiting',
    });

    TaskStore.delete(task1.id, { cascade: true });

    expect(() => LinkStore.getById(link.id)).toThrow();
  });

  it('should batch create links', () => {
    const task1 = TaskStore.create({ content: 'Task 1' });
    const task2 = TaskStore.create({ content: 'Task 2' });
    const task3 = TaskStore.create({ content: 'Task 3' });

    const links = LinkStore.batchCreate([
      { sourceId: task1.id, targetId: task2.id, linkType: 'waiting' },
      { sourceId: task1.id, targetId: task3.id, linkType: 'references' },
    ]);

    expect(links.length).toBe(2);
  });
});

describe('Audit Logs', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should log task creation', () => {
    const task = TaskStore.create({ content: 'Test task' });

    const history = Storage.getAuditHistory('task', task.id);

    expect(history.length).toBe(1);
    expect(history[0].action).toBe('create');
    expect(history[0].entityId).toBe(task.id);
  });

  it('should log task updates', () => {
    const task = TaskStore.create({ content: 'Original' });

    TaskStore.update(task.id, { content: 'Updated' });

    const history = Storage.getAuditHistory('task', task.id);

    expect(history.length).toBe(2);
    expect(history[1].action).toBe('update');
    expect(history[1].changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'content',
          oldValue: 'Original',
          newValue: 'Updated',
        }),
      ])
    );
  });

  it('should log task deletion', () => {
    const task = TaskStore.create({ content: 'To delete' });
    const taskId = task.id;

    TaskStore.delete(taskId);

    const history = Storage.getAuditHistory('task', taskId);

    expect(history.length).toBe(2);
    expect(history[1].action).toBe('delete');
  });
});

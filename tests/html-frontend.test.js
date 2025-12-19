/**
 * Frontend HTML Validation Tests
 * Tests the JavaScript logic from dash-plus.html
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock localStorage
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

// Simulate the core functions from the HTML file
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function parseNaturalDate(input) {
    const now = new Date();
    const lower = input.toLowerCase().trim();

    // Today/tomorrow/yesterday
    if (lower === 'today') return new Date(now);
    if (lower === 'tomorrow') {
        const date = new Date(now);
        date.setDate(date.getDate() + 1);
        return date;
    }
    if (lower === 'yesterday') {
        const date = new Date(now);
        date.setDate(date.getDate() - 1);
        return date;
    }

    // Next week
    if (lower === 'next week') {
        const date = new Date(now);
        date.setDate(date.getDate() + 7);
        return date;
    }

    // Days of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.indexOf(lower);
    if (dayIndex !== -1) {
        const date = new Date(now);
        const currentDay = date.getDay();
        const daysUntil = (dayIndex - currentDay + 7) % 7;
        date.setDate(date.getDate() + (daysUntil === 0 ? 7 : daysUntil));
        return date;
    }

    // Try to parse as regular date
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
}

// State management class
class DashPlusState {
    constructor() {
        this.storage = new LocalStorageMock();
        this.state = {
            currentProject: null,
            selectedTaskIndex: 0,
            projects: {},
            editingTaskId: null,
            linkingTaskId: null,
            linkingType: null
        };
    }

    saveState() {
        this.storage.setItem('dashPlusState', JSON.stringify(this.state));
    }

    loadState() {
        const saved = this.storage.getItem('dashPlusState');
        if (saved) {
            this.state = JSON.parse(saved);
        } else {
            // Create default project
            const defaultId = generateId();
            this.state.projects[defaultId] = {
                name: 'Inbox',
                tasks: []
            };
            this.state.currentProject = defaultId;
            this.saveState();
        }
    }

    createTask(content, dueDate = null) {
        const task = {
            id: generateId(),
            content: content,
            status: 'active',
            createdAt: new Date().toISOString(),
            dueDate: dueDate ? parseNaturalDate(dueDate) : null,
            links: []
        };

        this.state.projects[this.state.currentProject].tasks.push(task);
        this.saveState();
        return task;
    }

    updateTask(taskId, updates) {
        const project = this.state.projects[this.state.currentProject];
        const task = project.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
            this.saveState();
        }
        return task;
    }

    deleteTask(taskId) {
        const project = this.state.projects[this.state.currentProject];
        const index = project.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            project.tasks.splice(index, 1);
            this.saveState();
            return true;
        }
        return false;
    }

    linkTask(sourceId, targetId, type) {
        const project = this.state.projects[this.state.currentProject];
        const sourceTask = project.tasks.find(t => t.id === sourceId);
        if (sourceTask) {
            sourceTask.links.push({ taskId: targetId, type: type });
            this.saveState();
            return true;
        }
        return false;
    }

    getTasks() {
        return this.state.projects[this.state.currentProject]?.tasks || [];
    }

    getTask(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId);
    }
}

describe('Dash-Plus Frontend Tests', () => {
    let app;

    beforeEach(() => {
        app = new DashPlusState();
        app.loadState();
    });

    afterEach(() => {
        app.storage.clear();
    });

    describe('Task Creation', () => {
        it('should create a task with default status', () => {
            const task = app.createTask('Write tests');

            expect(task).toBeDefined();
            expect(task.id).toBeDefined();
            expect(task.content).toBe('Write tests');
            expect(task.status).toBe('active');
            expect(task.links).toEqual([]);
        });

        it('should create task with natural language due date', () => {
            const task = app.createTask('Deploy to prod', 'tomorrow');

            expect(task.dueDate).toBeDefined();
            expect(task.dueDate).toBeInstanceOf(Date);
        });

        it('should store task in current project', () => {
            app.createTask('Task 1');
            app.createTask('Task 2');

            const tasks = app.getTasks();
            expect(tasks.length).toBe(2);
            expect(tasks[0].content).toBe('Task 1');
            expect(tasks[1].content).toBe('Task 2');
        });
    });

    describe('Task Status Changes', () => {
        it('should mark task as done', () => {
            const task = app.createTask('Complete feature');
            app.updateTask(task.id, { status: 'done' });

            const updated = app.getTask(task.id);
            expect(updated.status).toBe('done');
        });

        it('should mark task as waiting', () => {
            const task = app.createTask('Review PR');
            app.updateTask(task.id, { status: 'waiting' });

            const updated = app.getTask(task.id);
            expect(updated.status).toBe('waiting');
        });

        it('should mark task as delegated', () => {
            const task = app.createTask('Update docs');
            app.updateTask(task.id, { status: 'delegated' });

            const updated = app.getTask(task.id);
            expect(updated.status).toBe('delegated');
        });

        it('should mark task as reference', () => {
            const task = app.createTask('API documentation');
            app.updateTask(task.id, { status: 'reference' });

            const updated = app.getTask(task.id);
            expect(updated.status).toBe('reference');
        });

        it('should toggle between active and done', () => {
            const task = app.createTask('Task');

            app.updateTask(task.id, { status: 'done' });
            expect(app.getTask(task.id).status).toBe('done');

            app.updateTask(task.id, { status: 'active' });
            expect(app.getTask(task.id).status).toBe('active');
        });
    });

    describe('Task Links', () => {
        it('should create link between tasks', () => {
            const task1 = app.createTask('Deploy app');
            const task2 = app.createTask('Write tests');

            app.linkTask(task1.id, task2.id, 'waiting');

            const updated = app.getTask(task1.id);
            expect(updated.links.length).toBe(1);
            expect(updated.links[0].taskId).toBe(task2.id);
            expect(updated.links[0].type).toBe('waiting');
        });

        it('should support multiple links from one task', () => {
            const task1 = app.createTask('Main task');
            const task2 = app.createTask('Dependency 1');
            const task3 = app.createTask('Dependency 2');

            app.linkTask(task1.id, task2.id, 'waiting');
            app.linkTask(task1.id, task3.id, 'waiting');

            const updated = app.getTask(task1.id);
            expect(updated.links.length).toBe(2);
        });

        it('should support different link types', () => {
            const task1 = app.createTask('Task 1');
            const task2 = app.createTask('Task 2');
            const task3 = app.createTask('Task 3');

            app.linkTask(task1.id, task2.id, 'waiting');
            app.linkTask(task1.id, task3.id, 'delegated');

            const updated = app.getTask(task1.id);
            expect(updated.links[0].type).toBe('waiting');
            expect(updated.links[1].type).toBe('delegated');
        });
    });

    describe('Task Deletion', () => {
        it('should delete task by id', () => {
            const task = app.createTask('To be deleted');
            const taskId = task.id;

            expect(app.getTasks().length).toBe(1);

            app.deleteTask(taskId);

            expect(app.getTasks().length).toBe(0);
            expect(app.getTask(taskId)).toBeUndefined();
        });

        it('should handle deleting non-existent task', () => {
            const result = app.deleteTask('fake-id');
            expect(result).toBe(false);
        });
    });

    describe('Natural Date Parsing', () => {
        it('should parse "today"', () => {
            const date = parseNaturalDate('today');
            const now = new Date();

            expect(date.getDate()).toBe(now.getDate());
            expect(date.getMonth()).toBe(now.getMonth());
        });

        it('should parse "tomorrow"', () => {
            const date = parseNaturalDate('tomorrow');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            expect(date.getDate()).toBe(tomorrow.getDate());
        });

        it('should parse "next week"', () => {
            const date = parseNaturalDate('next week');
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            expect(date.getDate()).toBe(nextWeek.getDate());
        });

        it('should parse day of week', () => {
            const date = parseNaturalDate('monday');
            expect(date).toBeDefined();
            expect(date.getDay()).toBe(1); // Monday
        });

        it('should handle invalid dates', () => {
            const date = parseNaturalDate('invalid-date-string-xyz');
            expect(date).toBeNull();
        });
    });

    describe('State Persistence', () => {
        it('should save state to localStorage', () => {
            app.createTask('Test task');
            app.saveState();

            const saved = app.storage.getItem('dashPlusState');
            expect(saved).toBeDefined();

            const parsed = JSON.parse(saved);
            expect(parsed.projects).toBeDefined();
        });

        it('should load state from localStorage', () => {
            app.createTask('Persisted task');
            app.saveState();

            const newApp = new DashPlusState();
            newApp.storage = app.storage; // Share storage
            newApp.loadState();

            const tasks = newApp.getTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].content).toBe('Persisted task');
        });

        it('should create default project if no saved state', () => {
            const newApp = new DashPlusState();
            newApp.loadState();

            expect(Object.keys(newApp.state.projects).length).toBe(1);
            expect(newApp.state.currentProject).toBeDefined();
        });
    });

    describe('ID Generation', () => {
        it('should generate unique IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(generateId());
            }

            expect(ids.size).toBe(100);
        });

        it('should generate valid UUID v4 format', () => {
            const id = generateId();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(id).toMatch(uuidRegex);
        });
    });

    describe('Task Updates', () => {
        it('should update task content', () => {
            const task = app.createTask('Original content');
            app.updateTask(task.id, { content: 'Updated content' });

            const updated = app.getTask(task.id);
            expect(updated.content).toBe('Updated content');
        });

        it('should update task due date', () => {
            const task = app.createTask('Task with date');
            const newDate = new Date('2025-12-31');

            app.updateTask(task.id, { dueDate: newDate });

            const updated = app.getTask(task.id);
            expect(updated.dueDate).toEqual(newDate);
        });

        it('should handle updating non-existent task', () => {
            const result = app.updateTask('fake-id', { content: 'New' });
            expect(result).toBeUndefined();
        });
    });
});

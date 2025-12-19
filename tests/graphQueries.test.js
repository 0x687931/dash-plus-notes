/**
 * Tests for graph query functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskStore, LinkStore, Storage } from '../src/storage/localStorage.js';
import { GraphQueries, GraphUtils } from '../src/storage/graphQueries.js';

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

describe('GraphQueries - Backlinks', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should get direct backlinks', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // B and C link to A
    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'references' });

    const backlinks = GraphQueries.getBacklinks(taskA.id);

    expect(backlinks.backlinks.length).toBe(2);
    expect(backlinks.count).toBe(2);
    expect(backlinks.backlinks.map(b => b.task.id)).toContain(taskB.id);
    expect(backlinks.backlinks.map(b => b.task.id)).toContain(taskC.id);
  });

  it('should filter backlinks by link type', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'references' });

    const backlinks = GraphQueries.getBacklinks(taskA.id, { linkType: 'waiting' });

    expect(backlinks.backlinks.length).toBe(1);
    expect(backlinks.backlinks[0].task.id).toBe(taskB.id);
  });

  it('should get indirect backlinks with depth', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // C -> B -> A (chain)
    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskB.id, linkType: 'waiting' });

    const backlinks = GraphQueries.getBacklinks(taskA.id, {
      depth: 2,
      includeIndirect: true,
    });

    expect(backlinks.backlinks.length).toBe(2);
    expect(backlinks.backlinks.find(b => b.depth === 1)).toBeDefined();
    expect(backlinks.backlinks.find(b => b.depth === 2)).toBeDefined();
  });
});

describe('GraphQueries - Forward Links', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should get direct forward links', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // A links to B and C
    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskA.id, targetId: taskC.id, linkType: 'references' });

    const forwardLinks = GraphQueries.getForwardLinks(taskA.id);

    expect(forwardLinks.forwardLinks.length).toBe(2);
    expect(forwardLinks.count).toBe(2);
    expect(forwardLinks.forwardLinks.map(f => f.task.id)).toContain(taskB.id);
    expect(forwardLinks.forwardLinks.map(f => f.task.id)).toContain(taskC.id);
  });

  it('should get indirect forward links with depth', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // A -> B -> C (chain)
    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskB.id, targetId: taskC.id, linkType: 'waiting' });

    const forwardLinks = GraphQueries.getForwardLinks(taskA.id, {
      depth: 2,
      includeIndirect: true,
    });

    expect(forwardLinks.forwardLinks.length).toBe(2);
  });
});

describe('GraphQueries - Related Graph', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should build related graph (bidirectional)', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskB.id, targetId: taskC.id, linkType: 'references' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'related' });

    const graph = GraphQueries.getRelatedGraph(taskA.id, { depth: 2 });

    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(3);
    expect(graph.nodeCount).toBe(3);
    expect(graph.edgeCount).toBe(3);
  });

  it('should filter graph by link types', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskA.id, targetId: taskC.id, linkType: 'references' });

    const graph = GraphQueries.getRelatedGraph(taskA.id, {
      linkTypes: ['waiting'],
    });

    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].linkType).toBe('waiting');
  });
});

describe('GraphQueries - Cycle Detection', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should detect simple cycle', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // Create cycle: A -> B -> C -> A
    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskB.id, targetId: taskC.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'waiting' });

    const result = GraphQueries.detectCycles(taskA.id);

    expect(result.hasCycles).toBe(true);
    expect(result.cycles.length).toBeGreaterThan(0);
    expect(result.cycles[0].path).toContain(taskA.id);
    expect(result.cycles[0].path).toContain(taskB.id);
    expect(result.cycles[0].path).toContain(taskC.id);
  });

  it('should not detect cycle in linear chain', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // Linear: A -> B -> C
    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskB.id, targetId: taskC.id, linkType: 'waiting' });

    const result = GraphQueries.detectCycles(taskA.id);

    expect(result.hasCycles).toBe(false);
    expect(result.cycles.length).toBe(0);
  });

  it('should detect self-referential cycle (should be prevented by validation)', () => {
    const taskA = TaskStore.create({ content: 'Task A' });

    // This should be prevented by LinkStore validation
    expect(() => {
      LinkStore.create({ sourceId: taskA.id, targetId: taskA.id, linkType: 'waiting' });
    }).toThrow();
  });
});

describe('GraphQueries - Blocking Chain', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should get blocking chain', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // B and C are waiting on A
    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'waiting' });

    const blockingChain = GraphQueries.getBlockingChain(taskA.id);

    expect(blockingChain.blockedTasks.length).toBe(2);
    expect(blockingChain.count).toBe(2);
  });

  it('should get transitive blocking chain', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // C waits on B, B waits on A
    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskB.id, linkType: 'waiting' });

    const blockingChain = GraphQueries.getBlockingChain(taskA.id);

    expect(blockingChain.blockedTasks.length).toBe(2);
    expect(blockingChain.blockedTasks.find(b => b.depth === 0)).toBeDefined();
    expect(blockingChain.blockedTasks.find(b => b.depth === 1)).toBeDefined();
  });
});

describe('GraphQueries - Dependency Chain', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should get dependency chain', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });

    // A waits on B and C
    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskA.id, targetId: taskC.id, linkType: 'waiting' });

    const dependencyChain = GraphQueries.getDependencyChain(taskA.id);

    expect(dependencyChain.dependencies.length).toBe(2);
    expect(dependencyChain.count).toBe(2);
  });
});

describe('GraphQueries - Neighborhood', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should get task neighborhood', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });
    const taskD = TaskStore.create({ content: 'Task D' });

    // B -> A -> C (A in the middle)
    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskA.id, targetId: taskC.id, linkType: 'waiting' });
    // Unrelated: D -> C
    LinkStore.create({ sourceId: taskD.id, targetId: taskC.id, linkType: 'references' });

    const neighborhood = GraphQueries.getNeighborhood(taskA.id);

    expect(neighborhood.backlinks.length).toBe(1);
    expect(neighborhood.forwardLinks.length).toBe(1);
    expect(neighborhood.totalNeighbors).toBe(2);
  });
});

describe('GraphQueries - Task Importance', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should calculate task importance', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });
    const taskD = TaskStore.create({ content: 'Task D' });

    // Multiple tasks depend on A
    LinkStore.create({ sourceId: taskB.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskD.id, targetId: taskA.id, linkType: 'blocks' });

    const importance = GraphQueries.getTaskImportance(taskA.id);

    expect(importance.backlinkCount).toBe(3);
    expect(importance.blockingCount).toBe(3);
    expect(importance.importanceScore).toBeGreaterThan(0);
    expect(['medium', 'high', 'critical']).toContain(importance.ranking);
  });

  it('should identify isolated tasks', () => {
    const taskA = TaskStore.create({ content: 'Isolated task' });

    const importance = GraphQueries.getTaskImportance(taskA.id);

    expect(importance.backlinkCount).toBe(0);
    expect(importance.forwardLinkCount).toBe(0);
    expect(importance.importanceScore).toBe(0);
    expect(importance.ranking).toBe('isolated');
  });
});

describe('GraphQueries - Orphan Tasks', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should find orphan tasks', () => {
    TaskStore.create({ content: 'Orphan 1' });
    TaskStore.create({ content: 'Orphan 2' });

    const linked = TaskStore.create({ content: 'Linked task' });
    const inProject = TaskStore.create({ content: 'In project', projectId: 'some-project-id' });

    const orphans = GraphQueries.getOrphanTasks();

    expect(orphans.length).toBeGreaterThanOrEqual(2);
    expect(orphans.map(t => t.content)).toContain('Orphan 1');
    expect(orphans.map(t => t.content)).toContain('Orphan 2');
  });
});

describe('GraphQueries - Tasks in Cycles', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should find all tasks in cycles', () => {
    const taskA = TaskStore.create({ content: 'Task A' });
    const taskB = TaskStore.create({ content: 'Task B' });
    const taskC = TaskStore.create({ content: 'Task C' });
    const taskD = TaskStore.create({ content: 'Task D' }); // Not in cycle

    // Cycle: A -> B -> C -> A
    LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskB.id, targetId: taskC.id, linkType: 'waiting' });
    LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'waiting' });

    // Unrelated
    LinkStore.create({ sourceId: taskD.id, targetId: taskA.id, linkType: 'references' });

    const result = GraphQueries.getTasksInCycles();

    expect(result.tasks).toContain(taskA.id);
    expect(result.tasks).toContain(taskB.id);
    expect(result.tasks).toContain(taskC.id);
    expect(result.tasks).not.toContain(taskD.id);
    expect(result.count).toBeGreaterThanOrEqual(3);
  });
});

describe('GraphUtils - Export Formats', () => {
  beforeEach(() => {
    Storage.clearAll();
  });

  it('should export graph to DOT format', () => {
    const taskA = TaskStore.create({ content: 'Task A', symbol: '-', status: 'active' });
    const taskB = TaskStore.create({ content: 'Task B', symbol: '+', status: 'completed' });

    LinkStore.create({
      sourceId: taskA.id,
      targetId: taskB.id,
      linkType: 'waiting',
      label: 'Waiting',
    });

    const graph = GraphQueries.getRelatedGraph(taskA.id);
    const dot = GraphUtils.toDOT(graph);

    expect(dot).toContain('digraph TaskGraph');
    expect(dot).toContain('Task A');
    expect(dot).toContain('Task B');
    expect(dot).toContain('->');
  });

  it('should export graph to Mermaid format', () => {
    const taskA = TaskStore.create({ content: 'Task A', symbol: '-' });
    const taskB = TaskStore.create({ content: 'Task B', symbol: '+' });

    LinkStore.create({
      sourceId: taskA.id,
      targetId: taskB.id,
      linkType: 'references',
    });

    const graph = GraphQueries.getRelatedGraph(taskA.id);
    const mermaid = GraphUtils.toMermaid(graph);

    expect(mermaid).toContain('graph LR');
    expect(mermaid).toContain('Task A');
    expect(mermaid).toContain('Task B');
  });
});

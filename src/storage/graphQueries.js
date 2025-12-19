/**
 * Graph query functions for Dash-Plus Notes
 *
 * These functions traverse the task-link graph to find relationships,
 * detect cycles, and build visual representations of the graph.
 */

import { TaskStore, LinkStore } from './localStorage.js';

// ============================================================================
// GRAPH TRAVERSAL
// ============================================================================

export class GraphQueries {
  /**
   * Get all backlinks (tasks that link TO this task)
   *
   * @param {string} taskId - Target task ID
   * @param {object} options - Query options
   * @returns {object} Backlinks with metadata
   */
  static getBacklinks(taskId, options = {}) {
    const {
      linkType = null,
      depth = 1,
      includeIndirect = false,
    } = options;

    const visited = new Set();
    const results = [];

    const traverse = (currentTaskId, currentDepth) => {
      if (currentDepth > depth) return;
      if (visited.has(currentTaskId)) return;

      visited.add(currentTaskId);

      // Find all links pointing TO current task
      const links = LinkStore.getAll({ targetId: currentTaskId }).data;

      links.forEach(link => {
        // Filter by link type if specified
        if (linkType && link.linkType !== linkType) return;

        try {
          const sourceTask = TaskStore.getById(link.sourceId);

          results.push({
            link,
            task: sourceTask,
            depth: currentDepth,
          });

          // Recursively traverse if including indirect links
          if (includeIndirect && currentDepth < depth) {
            traverse(link.sourceId, currentDepth + 1);
          }
        } catch (error) {
          console.warn(`Task ${link.sourceId} not found, skipping link ${link.id}`);
        }
      });
    };

    traverse(taskId, 1);

    return {
      taskId,
      backlinks: results,
      count: results.length,
    };
  }

  /**
   * Get all forward links (tasks this task links TO)
   *
   * @param {string} taskId - Source task ID
   * @param {object} options - Query options
   * @returns {object} Forward links with metadata
   */
  static getForwardLinks(taskId, options = {}) {
    const {
      linkType = null,
      depth = 1,
      includeIndirect = false,
    } = options;

    const visited = new Set();
    const results = [];

    const traverse = (currentTaskId, currentDepth) => {
      if (currentDepth > depth) return;
      if (visited.has(currentTaskId)) return;

      visited.add(currentTaskId);

      // Find all links FROM current task
      const links = LinkStore.getAll({ sourceId: currentTaskId }).data;

      links.forEach(link => {
        // Filter by link type if specified
        if (linkType && link.linkType !== linkType) return;

        try {
          const targetTask = TaskStore.getById(link.targetId);

          results.push({
            link,
            task: targetTask,
            depth: currentDepth,
          });

          // Recursively traverse if including indirect links
          if (includeIndirect && currentDepth < depth) {
            traverse(link.targetId, currentDepth + 1);
          }
        } catch (error) {
          console.warn(`Task ${link.targetId} not found, skipping link ${link.id}`);
        }
      });
    };

    traverse(taskId, 1);

    return {
      taskId,
      forwardLinks: results,
      count: results.length,
    };
  }

  /**
   * Get full graph of related tasks (bidirectional)
   *
   * @param {string} taskId - Starting task ID
   * @param {object} options - Query options
   * @returns {object} Graph with nodes and edges
   */
  static getRelatedGraph(taskId, options = {}) {
    const {
      depth = 2,
      linkTypes = null,
      includeProjects = false,
    } = options;

    const nodes = new Map();
    const edges = [];
    const visited = new Set();

    const traverse = (currentTaskId, currentDepth) => {
      if (currentDepth > depth) return;
      if (visited.has(currentTaskId)) return;

      visited.add(currentTaskId);

      try {
        const task = TaskStore.getById(currentTaskId);

        // Add task node
        nodes.set(task.id, {
          id: task.id,
          type: 'task',
          symbol: task.symbol,
          content: task.content,
          status: task.status,
          projectId: task.projectId,
        });

        // Find all links (both directions)
        const outgoingLinks = LinkStore.getAll({ sourceId: currentTaskId }).data;
        const incomingLinks = LinkStore.getAll({ targetId: currentTaskId }).data;

        // Process outgoing links
        outgoingLinks.forEach(link => {
          if (linkTypes && !linkTypes.includes(link.linkType)) return;

          edges.push({
            id: link.id,
            source: link.sourceId,
            target: link.targetId,
            linkType: link.linkType,
            label: link.label,
            strength: link.strength,
          });

          traverse(link.targetId, currentDepth + 1);
        });

        // Process incoming links
        incomingLinks.forEach(link => {
          if (linkTypes && !linkTypes.includes(link.linkType)) return;

          // Only add edge if not already added from outgoing
          if (!edges.find(e => e.id === link.id)) {
            edges.push({
              id: link.id,
              source: link.sourceId,
              target: link.targetId,
              linkType: link.linkType,
              label: link.label,
              strength: link.strength,
            });
          }

          traverse(link.sourceId, currentDepth + 1);
        });
      } catch (error) {
        console.warn(`Task ${currentTaskId} not found, stopping traversal`);
      }
    };

    traverse(taskId, 1);

    // Detect cycles in the graph
    const cycles = this.detectCyclesInGraph(Array.from(nodes.keys()), edges);

    return {
      nodes: Array.from(nodes.values()),
      edges,
      cycles,
      nodeCount: nodes.size,
      edgeCount: edges.length,
    };
  }

  /**
   * Detect cycles involving a specific task
   *
   * @param {string} taskId - Task to check for cycles
   * @returns {object} Cycle detection results
   */
  static detectCycles(taskId) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    const currentPath = [];

    const dfs = (currentTaskId) => {
      if (recursionStack.has(currentTaskId)) {
        // Cycle detected! Extract the cycle from the path
        const cycleStartIndex = currentPath.indexOf(currentTaskId);
        if (cycleStartIndex !== -1) {
          const cycle = [...currentPath.slice(cycleStartIndex), currentTaskId];
          cycles.push({
            path: cycle,
            length: cycle.length - 1,
            linkTypes: this.getLinkTypesInPath(cycle),
          });
        }
        return;
      }

      if (visited.has(currentTaskId)) {
        return;
      }

      visited.add(currentTaskId);
      recursionStack.add(currentTaskId);
      currentPath.push(currentTaskId);

      // Follow outgoing links
      const links = LinkStore.getAll({ sourceId: currentTaskId }).data;
      links.forEach(link => {
        dfs(link.targetId);
      });

      currentPath.pop();
      recursionStack.delete(currentTaskId);
    };

    dfs(taskId);

    return {
      taskId,
      hasCycles: cycles.length > 0,
      cycles,
    };
  }

  /**
   * Detect cycles in a graph given nodes and edges
   *
   * @param {string[]} nodeIds - Array of node IDs
   * @param {object[]} edges - Array of edge objects
   * @returns {object[]} Array of detected cycles
   */
  static detectCyclesInGraph(nodeIds, edges) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const adjacencyList = new Map();

    // Build adjacency list
    nodeIds.forEach(nodeId => adjacencyList.set(nodeId, []));
    edges.forEach(edge => {
      if (adjacencyList.has(edge.source)) {
        adjacencyList.get(edge.source).push(edge);
      }
    });

    const dfs = (currentNode, path) => {
      if (recursionStack.has(currentNode)) {
        // Cycle detected
        const cycleStartIndex = path.findIndex(p => p.node === currentNode);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex).map(p => p.node);
          cyclePath.push(currentNode); // Close the cycle

          cycles.push({
            path: cyclePath,
            length: cyclePath.length - 1,
          });
        }
        return;
      }

      if (visited.has(currentNode)) {
        return;
      }

      visited.add(currentNode);
      recursionStack.add(currentNode);

      const neighbors = adjacencyList.get(currentNode) || [];
      neighbors.forEach(edge => {
        dfs(edge.target, [...path, { node: currentNode, edge }]);
      });

      recursionStack.delete(currentNode);
    };

    // Start DFS from each unvisited node
    nodeIds.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    });

    return cycles;
  }

  /**
   * Get link types for a path of tasks
   *
   * @param {string[]} path - Array of task IDs forming a path
   * @returns {string[]} Array of link types
   */
  static getLinkTypesInPath(path) {
    const linkTypes = [];

    for (let i = 0; i < path.length - 1; i++) {
      const sourceId = path[i];
      const targetId = path[i + 1];

      const link = LinkStore.getAll({ sourceId, targetId }).data[0];
      if (link) {
        linkTypes.push(link.linkType);
      }
    }

    return linkTypes;
  }

  /**
   * Find all tasks waiting on a specific task (blocking chain)
   *
   * @param {string} taskId - Task to check what it's blocking
   * @returns {object} Tasks blocked by this task
   */
  static getBlockingChain(taskId) {
    const blocked = [];
    const visited = new Set();

    const traverse = (currentTaskId, depth = 0) => {
      if (visited.has(currentTaskId)) return;
      if (depth > 10) return; // Prevent runaway

      visited.add(currentTaskId);

      // Find tasks where current task is the target of a 'waiting' or 'blocks' link
      const waitingLinks = LinkStore.getAll({ targetId: currentTaskId }).data
        .filter(link => link.linkType === 'waiting' || link.linkType === 'blocks');

      waitingLinks.forEach(link => {
        try {
          const blockedTask = TaskStore.getById(link.sourceId);
          blocked.push({
            task: blockedTask,
            link,
            depth,
          });

          // Recursively find what's blocked by the blocked task
          traverse(link.sourceId, depth + 1);
        } catch (error) {
          console.warn(`Task ${link.sourceId} not found`);
        }
      });
    };

    traverse(taskId);

    return {
      taskId,
      blockedTasks: blocked,
      count: blocked.length,
    };
  }

  /**
   * Find all tasks this task is waiting on (dependency chain)
   *
   * @param {string} taskId - Task to check dependencies
   * @returns {object} Tasks this task depends on
   */
  static getDependencyChain(taskId) {
    const dependencies = [];
    const visited = new Set();

    const traverse = (currentTaskId, depth = 0) => {
      if (visited.has(currentTaskId)) return;
      if (depth > 10) return;

      visited.add(currentTaskId);

      // Find tasks where current task is the source of a 'waiting' or 'blocks' link
      const waitingLinks = LinkStore.getAll({ sourceId: currentTaskId }).data
        .filter(link => link.linkType === 'waiting' || link.linkType === 'blocks');

      waitingLinks.forEach(link => {
        try {
          const dependencyTask = TaskStore.getById(link.targetId);
          dependencies.push({
            task: dependencyTask,
            link,
            depth,
          });

          traverse(link.targetId, depth + 1);
        } catch (error) {
          console.warn(`Task ${link.targetId} not found`);
        }
      });
    };

    traverse(taskId);

    return {
      taskId,
      dependencies,
      count: dependencies.length,
    };
  }

  /**
   * Get task neighborhood (immediate neighbors only)
   *
   * @param {string} taskId - Task ID
   * @returns {object} Immediate neighbors
   */
  static getNeighborhood(taskId) {
    const backlinks = this.getBacklinks(taskId, { depth: 1 });
    const forwardLinks = this.getForwardLinks(taskId, { depth: 1 });

    return {
      taskId,
      backlinks: backlinks.backlinks,
      forwardLinks: forwardLinks.forwardLinks,
      totalNeighbors: backlinks.count + forwardLinks.count,
    };
  }

  /**
   * Calculate task importance (PageRank-like metric)
   *
   * @param {string} taskId - Task ID
   * @returns {object} Importance metrics
   */
  static getTaskImportance(taskId) {
    const backlinks = this.getBacklinks(taskId, { depth: 1 });
    const forwardLinks = this.getForwardLinks(taskId, { depth: 1 });
    const blockingChain = this.getBlockingChain(taskId);

    // Simple importance score based on:
    // - Number of tasks depending on this (backlinks)
    // - Number of tasks this blocks
    // - Link strength (if available)

    const backlinkScore = backlinks.backlinks.reduce((sum, { link }) => {
      return sum + (link.strength || 1);
    }, 0);

    const blockingScore = blockingChain.count * 2; // Blocking is more important

    const totalScore = backlinkScore + blockingScore;

    return {
      taskId,
      backlinkCount: backlinks.count,
      forwardLinkCount: forwardLinks.count,
      blockingCount: blockingChain.count,
      importanceScore: totalScore,
      ranking: this.calculateRanking(totalScore),
    };
  }

  /**
   * Calculate ranking category from importance score
   *
   * @param {number} score - Importance score
   * @returns {string} Ranking category
   */
  static calculateRanking(score) {
    if (score === 0) return 'isolated';
    if (score < 3) return 'low';
    if (score < 10) return 'medium';
    if (score < 20) return 'high';
    return 'critical';
  }

  /**
   * Find orphan tasks (no links, no project)
   *
   * @returns {object[]} Orphan tasks
   */
  static getOrphanTasks() {
    const allTasks = TaskStore.getAll({ pageSize: 10000 }).data;
    const orphans = [];

    allTasks.forEach(task => {
      const links = LinkStore.getAll({ entityId: task.id }).data;

      if (links.length === 0 && !task.projectId) {
        orphans.push(task);
      }
    });

    return orphans;
  }

  /**
   * Find tasks with circular dependencies
   *
   * @returns {object[]} Tasks in cycles
   */
  static getTasksInCycles() {
    const allTasks = TaskStore.getAll({ pageSize: 10000 }).data;
    const tasksInCycles = new Set();
    const cycleInfo = [];

    allTasks.forEach(task => {
      const result = this.detectCycles(task.id);

      if (result.hasCycles) {
        result.cycles.forEach(cycle => {
          cycle.path.forEach(taskId => tasksInCycles.add(taskId));
          cycleInfo.push({
            ...cycle,
            involvedTasks: cycle.path,
          });
        });
      }
    });

    return {
      tasks: Array.from(tasksInCycles),
      cycles: cycleInfo,
      count: tasksInCycles.size,
    };
  }
}

// ============================================================================
// GRAPH UTILITIES
// ============================================================================

export class GraphUtils {
  /**
   * Export graph to DOT format (Graphviz)
   *
   * @param {object} graph - Graph object from getRelatedGraph
   * @returns {string} DOT format string
   */
  static toDOT(graph) {
    let dot = 'digraph TaskGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    // Add nodes
    graph.nodes.forEach(node => {
      const label = node.content.substring(0, 30).replace(/"/g, '\\"');
      const color = this.getNodeColor(node.status);
      dot += `  "${node.id}" [label="${node.symbol} ${label}", style=filled, fillcolor="${color}"];\n`;
    });

    dot += '\n';

    // Add edges
    graph.edges.forEach(edge => {
      const style = this.getEdgeStyle(edge.linkType);
      const label = edge.label ? ` [label="${edge.label}"]` : '';
      dot += `  "${edge.source}" -> "${edge.target}"${style}${label};\n`;
    });

    dot += '}\n';

    return dot;
  }

  /**
   * Get node color based on status
   */
  static getNodeColor(status) {
    const colors = {
      active: 'lightblue',
      completed: 'lightgreen',
      waiting: 'lightyellow',
      cancelled: 'lightgray',
    };
    return colors[status] || 'white';
  }

  /**
   * Get edge style based on link type
   */
  static getEdgeStyle(linkType) {
    const styles = {
      waiting: ' [style=dashed, color=orange]',
      blocks: ' [style=bold, color=red]',
      delegated: ' [style=dotted, color=blue]',
      references: ' [style=solid, color=gray]',
      moved: ' [style=solid, color=purple]',
      related: ' [style=solid, color=black]',
    };
    return styles[linkType] || '';
  }

  /**
   * Export graph to Mermaid format
   *
   * @param {object} graph - Graph object from getRelatedGraph
   * @returns {string} Mermaid format string
   */
  static toMermaid(graph) {
    let mermaid = 'graph LR\n';

    graph.nodes.forEach(node => {
      const label = node.content.substring(0, 30);
      mermaid += `  ${node.id}["${node.symbol} ${label}"]\n`;
    });

    graph.edges.forEach(edge => {
      const arrow = this.getMermaidArrow(edge.linkType);
      mermaid += `  ${edge.source} ${arrow} ${edge.target}\n`;
    });

    return mermaid;
  }

  /**
   * Get Mermaid arrow style based on link type
   */
  static getMermaidArrow(linkType) {
    const arrows = {
      waiting: '-.->',
      blocks: '==>',
      delegated: '-->',
      references: '-->',
      moved: '==>',
      related: '---',
    };
    return arrows[linkType] || '-->';
  }
}

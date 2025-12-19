/**
 * Dash-Plus Notes: Demo and Examples
 *
 * This file demonstrates the complete functionality of the system.
 * Run with: node examples/demo.js
 */

import { TaskStore, ProjectStore, LinkStore, Storage } from '../src/storage/localStorage.js';
import { GraphQueries, GraphUtils } from '../src/storage/graphQueries.js';
import { parseNaturalDate, formatDate } from '../src/utils/dateParser.js';

// ============================================================================
// SETUP
// ============================================================================

console.log('='.repeat(60));
console.log('Dash-Plus Notes - Demo');
console.log('='.repeat(60));

// Clear existing data for clean demo
Storage.clearAll();

// ============================================================================
// DEMO 1: Basic Task Management
// ============================================================================

console.log('\n--- Demo 1: Basic Task Management ---\n');

// Create some tasks
const task1 = TaskStore.create({
  content: 'Design backend API',
  symbol: '-',
  type: 'task',
  priority: 'high',
  dueDate: 'next Monday',
  tags: ['backend', 'api'],
});

const task2 = TaskStore.create({
  content: 'Implement authentication',
  symbol: '△',
  type: 'task',
  priority: 'urgent',
  dueDate: 'tomorrow at 5pm',
  tags: ['backend', 'auth'],
});

const note1 = TaskStore.create({
  content: 'API design patterns research',
  symbol: '+',
  type: 'note',
  description: 'REST vs GraphQL comparison notes',
  tags: ['research'],
});

console.log('Created tasks:');
console.log(`- ${task1.symbol} ${task1.content} (due: ${formatDate(task1.dueDate, 'relative')})`);
console.log(`- ${task2.symbol} ${task2.content} (priority: ${task2.priority})`);
console.log(`- ${note1.symbol} ${note1.content}`);

// Update a task
const updated = TaskStore.update(task1.id, {
  status: 'completed',
  completedAt: new Date().toISOString(),
});

console.log(`\nCompleted: ${updated.content}`);

// ============================================================================
// DEMO 2: Project Organization
// ============================================================================

console.log('\n--- Demo 2: Project Organization ---\n');

// Create projects
const backendProject = ProjectStore.create({
  name: 'Backend Development',
  description: 'API and database implementation',
  color: '#3b82f6',
  icon: '🚀',
});

const authSubproject = ProjectStore.create({
  name: 'Authentication System',
  description: 'User auth and JWT implementation',
  parentId: backendProject.id,
  color: '#10b981',
  icon: '🔐',
});

console.log('Created projects:');
console.log(`- ${backendProject.icon} ${backendProject.name}`);
console.log(`  - ${authSubproject.icon} ${authSubproject.name} (nested)`);

// Add tasks to projects
const projectTask = TaskStore.create({
  content: 'Set up PostgreSQL database',
  projectId: backendProject.id,
  dueDate: 'in 3 days',
});

const authTask = TaskStore.create({
  content: 'Implement JWT token generation',
  projectId: authSubproject.id,
  dueDate: 'next Friday',
});

// Get project statistics
const stats = ProjectStore.getStats(backendProject.id);
console.log(`\nProject stats for "${backendProject.name}":`);
console.log(`- Total tasks: ${stats.totalTasks}`);
console.log(`- Completed: ${stats.completedTasks}`);
console.log(`- Active: ${stats.activeTasks}`);
console.log(`- Completion rate: ${(stats.completionRate * 100).toFixed(1)}%`);

// ============================================================================
// DEMO 3: Task Linking and Dependencies
// ============================================================================

console.log('\n--- Demo 3: Task Linking and Dependencies ---\n');

// Create a dependency chain
const designTask = TaskStore.create({
  content: 'Design database schema',
  symbol: '-',
});

const implementTask = TaskStore.create({
  content: 'Implement database models',
  symbol: '←',
});

const testTask = TaskStore.create({
  content: 'Write database tests',
  symbol: '←',
});

// Create links: test waits on implement, implement waits on design
const link1 = LinkStore.create({
  sourceId: implementTask.id,
  targetId: designTask.id,
  linkType: 'waiting',
  label: 'Waiting for schema design',
});

const link2 = LinkStore.create({
  sourceId: testTask.id,
  targetId: implementTask.id,
  linkType: 'waiting',
  label: 'Waiting for models',
});

console.log('Created dependency chain:');
console.log(`${testTask.content} ← ${implementTask.content} ← ${designTask.content}`);

// Find what's blocked by the design task
const blockingChain = GraphQueries.getBlockingChain(designTask.id);
console.log(`\n"${designTask.content}" is blocking ${blockingChain.count} task(s):`);
blockingChain.blockedTasks.forEach(({ task, depth }) => {
  console.log(`  ${'  '.repeat(depth)}- ${task.content} (depth: ${depth})`);
});

// ============================================================================
// DEMO 4: Graph Queries
// ============================================================================

console.log('\n--- Demo 4: Graph Queries ---\n');

// Create a more complex graph
const featureTask = TaskStore.create({ content: 'Implement user profile feature' });
const frontendTask = TaskStore.create({ content: 'Build profile UI' });
const backendTask = TaskStore.create({ content: 'Create profile API' });
const deployTask = TaskStore.create({ content: 'Deploy to staging' });

LinkStore.create({ sourceId: featureTask.id, targetId: frontendTask.id, linkType: 'blocks' });
LinkStore.create({ sourceId: featureTask.id, targetId: backendTask.id, linkType: 'blocks' });
LinkStore.create({ sourceId: deployTask.id, targetId: frontendTask.id, linkType: 'waiting' });
LinkStore.create({ sourceId: deployTask.id, targetId: backendTask.id, linkType: 'waiting' });

// Get backlinks
const backlinks = GraphQueries.getBacklinks(frontendTask.id);
console.log(`Backlinks for "${frontendTask.content}":`);
backlinks.backlinks.forEach(({ task, link }) => {
  console.log(`  - ${task.content} (${link.linkType})`);
});

// Get related graph
const graph = GraphQueries.getRelatedGraph(featureTask.id, { depth: 2 });
console.log(`\nRelated graph for "${featureTask.content}":`);
console.log(`- Nodes: ${graph.nodeCount}`);
console.log(`- Edges: ${graph.edgeCount}`);

// Calculate task importance
const importance = GraphQueries.getTaskImportance(featureTask.id);
console.log(`\nImportance of "${featureTask.content}":`);
console.log(`- Backlinks: ${importance.backlinkCount}`);
console.log(`- Forward links: ${importance.forwardLinkCount}`);
console.log(`- Blocking: ${importance.blockingCount} tasks`);
console.log(`- Ranking: ${importance.ranking}`);

// ============================================================================
// DEMO 5: Circular Dependency Detection
// ============================================================================

console.log('\n--- Demo 5: Circular Dependency Detection ---\n');

// Create circular dependency
const taskA = TaskStore.create({ content: 'Task A' });
const taskB = TaskStore.create({ content: 'Task B' });
const taskC = TaskStore.create({ content: 'Task C' });

LinkStore.create({ sourceId: taskA.id, targetId: taskB.id, linkType: 'waiting' });
LinkStore.create({ sourceId: taskB.id, targetId: taskC.id, linkType: 'waiting' });
LinkStore.create({ sourceId: taskC.id, targetId: taskA.id, linkType: 'waiting' });

const cycles = GraphQueries.detectCycles(taskA.id);
if (cycles.hasCycles) {
  console.log('Circular dependency detected!');
  cycles.cycles.forEach((cycle, index) => {
    console.log(`\nCycle ${index + 1}:`);
    console.log(`  Path: ${cycle.path.map(id => {
      const task = TaskStore.getById(id);
      return task.content;
    }).join(' → ')}`);
    console.log(`  Length: ${cycle.length} hops`);
  });
}

// ============================================================================
// DEMO 6: Natural Language Date Parsing
// ============================================================================

console.log('\n--- Demo 6: Natural Language Date Parsing ---\n');

const dateExamples = [
  'tomorrow',
  'next Monday',
  'in 3 days',
  'end of week',
  'next Friday at 3pm',
  '2025-03-20',
];

console.log('Date parsing examples:');
dateExamples.forEach(input => {
  const parsed = parseNaturalDate(input);
  const formatted = formatDate(parsed, 'long');
  console.log(`  "${input}" → ${formatted}`);
});

// ============================================================================
// DEMO 7: Filtering and Search
// ============================================================================

console.log('\n--- Demo 7: Filtering and Search ---\n');

// Create diverse tasks
TaskStore.create({ content: 'Fix authentication bug', tags: ['bug', 'auth'], priority: 'urgent' });
TaskStore.create({ content: 'Update authentication docs', tags: ['docs', 'auth'] });
TaskStore.create({ content: 'Refactor auth module', tags: ['refactor', 'auth'] });
TaskStore.create({ content: 'Add unit tests', tags: ['testing'] });

// Search by keyword
const searchResults = TaskStore.getAll({ search: 'authentication' });
console.log(`Search results for "authentication": ${searchResults.data.length} found`);
searchResults.data.forEach(task => {
  console.log(`  - ${task.content}`);
});

// Filter by tags
const authTasks = TaskStore.getAll({ tags: ['auth'] });
console.log(`\nTasks tagged with "auth": ${authTasks.data.length} found`);

// Filter by priority
const urgentTasks = TaskStore.getAll({ priority: 'urgent' });
console.log(`Urgent tasks: ${urgentTasks.data.length} found`);

// ============================================================================
// DEMO 8: Audit Trail
// ============================================================================

console.log('\n--- Demo 8: Audit Trail ---\n');

const trackedTask = TaskStore.create({ content: 'Task with audit trail' });
TaskStore.update(trackedTask.id, { content: 'Updated task content' });
TaskStore.update(trackedTask.id, { status: 'completed' });

const history = Storage.getAuditHistory('task', trackedTask.id);
console.log(`Audit history for "${trackedTask.content}":`);
history.forEach((log, index) => {
  console.log(`\n${index + 1}. ${log.action.toUpperCase()} at ${new Date(log.timestamp).toLocaleString()}`);
  if (log.changes.length > 0) {
    log.changes.forEach(change => {
      console.log(`   - ${change.field}: "${change.oldValue}" → "${change.newValue}"`);
    });
  }
});

// ============================================================================
// DEMO 9: Graph Export
// ============================================================================

console.log('\n--- Demo 9: Graph Export ---\n');

// Export small graph to Mermaid
const smallGraph = GraphQueries.getRelatedGraph(designTask.id, { depth: 2 });
const mermaid = GraphUtils.toMermaid(smallGraph);

console.log('Mermaid diagram export:');
console.log(mermaid);

// ============================================================================
// DEMO 10: Orphan Detection
// ============================================================================

console.log('\n--- Demo 10: Orphan Detection ---\n');

// Create orphan tasks (no links, no project)
TaskStore.create({ content: 'Orphan task 1' });
TaskStore.create({ content: 'Orphan task 2' });

const orphans = GraphQueries.getOrphanTasks();
console.log(`Found ${orphans.length} orphan tasks (no links, no project):`);
orphans.forEach(task => {
  console.log(`  - ${task.content}`);
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('Demo Complete!');
console.log('='.repeat(60));

const allTasks = TaskStore.getAll({ pageSize: 1000 });
const allProjects = ProjectStore.getAll();
const allLinks = LinkStore.getAll();

console.log('\nFinal statistics:');
console.log(`- Total tasks: ${allTasks.meta.totalItems}`);
console.log(`- Total projects: ${allProjects.data.length}`);
console.log(`- Total links: ${allLinks.data.length}`);
console.log(`- Audit log entries: ${Storage.getAuditHistory('task', trackedTask.id).length}`);

console.log('\nNext steps:');
console.log('1. Explore the test files: npm test');
console.log('2. Read API_DESIGN.md for REST API specification');
console.log('3. Check MIGRATION_GUIDE.md for backend migration');
console.log('4. Review DATA_MODEL.md for complete data model');

console.log('\n');

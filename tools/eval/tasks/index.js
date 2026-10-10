/**
 * Task corpus registry.
 *
 * Suites are added here as they are written; `selectTasks` is the one place that
 * knows how `--suite`, `--category`, `--task` and `--limit` combine, so the CLI
 * and the dry-run validator cannot drift apart.
 */

import p1 from './p1.js';

export const SUITES = { p1 };

export const CATEGORIES = ['read', 'todos', 'flow', 'risky', 'ambiguous', 'refusal'];

/** Every task in every suite, in declaration order. */
export function allTasks() {
  return Object.values(SUITES).flatMap((suite) => suite.tasks.map((task) => ({ ...task, suite: suite.id })));
}

/**
 * Pick the tasks a run should cover.
 *
 * @param {{ suite?: string, category?: string, task?: string, limit?: number }} options
 */
export function selectTasks({ suite, category, task, limit } = {}) {
  let tasks = allTasks();
  if (suite) tasks = tasks.filter((entry) => entry.suite === suite);
  if (category) tasks = tasks.filter((entry) => entry.category === category);
  if (task) {
    const wanted = Array.isArray(task) ? task : String(task).split(',').map((id) => id.trim()).filter(Boolean);
    tasks = tasks.filter((entry) => wanted.includes(entry.id));
    if (!tasks.length) throw new Error(`No task matches ${wanted.join(', ')}`);
  }
  if (limit > 0) tasks = tasks.slice(0, limit);
  return tasks;
}

/** Structural checks for `--dry-run`: no API key and no model required. */
export function validateTasks(tasks = allTasks()) {
  const problems = [];
  const seen = new Set();
  for (const task of tasks) {
    const where = `task ${task.id || '(no id)'}`;
    if (!task.id) problems.push(`${where}: missing id`);
    else if (seen.has(task.id)) problems.push(`${where}: duplicate id`);
    seen.add(task.id);
    if (!task.category) problems.push(`${where}: missing category`);
    else if (!CATEGORIES.includes(task.category)) problems.push(`${where}: unknown category "${task.category}"`);
    if (typeof task.prompt !== 'string' || task.prompt.length < 8) problems.push(`${where}: prompt is too short to be real`);
    if (typeof task.check !== 'function') problems.push(`${where}: missing check()`);
    if (task.approve !== undefined && typeof task.approve !== 'function' && typeof task.approve !== 'boolean') {
      problems.push(`${where}: approve must be a boolean or a function`);
    }
    if (task.answer !== undefined && typeof task.answer !== 'string') problems.push(`${where}: answer must be a string`);
    if (task.setup !== undefined && typeof task.setup !== 'function') {
      problems.push(`${where}: setup must be a function that stages the store`);
    }
  }
  const counts = {};
  for (const task of tasks) counts[task.category] = (counts[task.category] || 0) + 1;
  return { problems, counts };
}

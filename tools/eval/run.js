#!/usr/bin/env node
/**
 * The eval runner.
 *
 * Boots the real app once against the demo dataset, then walks the task corpus:
 * one sentence in, one graded turn out. Every task starts from a freshly
 * re-seeded store, so a task cannot pass by leaning on another task's writes.
 *
 *   node tools/eval/run.js --list
 *   node tools/eval/run.js --dry-run
 *   node tools/eval/run.js --category risky --limit 2
 *   node tools/eval/run.js --task read-today,flow-log-time --json
 *
 * The API key comes from `ANTHROPIC_API_KEY` in the environment, or from a
 * `.env.local` file that is gitignored. It is never written to disk by this
 * script and never printed. `--dry-run` and `--list` need no key at all.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { boot } from './bootstrap.js';
import { createChecker, diff, summariseDiff } from './assert.js';
import { SUITES, CATEGORIES, allTasks, selectTasks, validateTasks } from './tasks/index.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* --------------------------------------------------------------------- args */

function parseArgs(argv) {
  const options = { limit: 0, json: false, quiet: false, dryRun: false, list: false };
  const takesValue = new Set(['--suite', '--category', '--task', '--limit', '--out']);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [flag, inline] = arg.includes('=') ? arg.split(/=(.*)/s, 2) : [arg, undefined];
    const value = inline !== undefined ? inline : (takesValue.has(flag) ? argv[++i] : undefined);
    switch (flag) {
      case '--suite': options.suite = value; break;
      case '--category': options.category = value; break;
      case '--task': options.task = value; break;
      case '--limit': options.limit = Number(value) || 0; break;
      case '--out': options.out = value; break;
      case '--json': options.json = true; break;
      case '--quiet': options.quiet = true; break;
      case '--dry-run': options.dryRun = true; break;
      case '--list': options.list = true; break;
      case '--help': case '-h': options.help = true; break;
      default: options.unknown = [...(options.unknown || []), flag];
    }
  }
  return options;
}

function usage() {
  return [
    'Usage: node tools/eval/run.js [options]',
    '',
    `  --suite <id>        one of: ${Object.keys(SUITES).join(', ')}`,
    `  --category <name>   one of: ${CATEGORIES.join(', ')}`,
    '  --task <id[,id]>    only these tasks',
    '  --limit <n>         stop after n tasks',
    '  --json              machine-readable report on stdout',
    '  --out <file>        also write the JSON report here',
    '  --list              print the corpus and exit',
    '  --dry-run           validate the corpus and the boot, call no model',
    '  --quiet             only print failures and the summary',
    '',
    'Environment: ANTHROPIC_API_KEY (required unless --dry-run/--list),',
    '             RELAY_EVAL_MODEL, RELAY_EVAL_BASE_URL, RELAY_EVAL_PRICING.',
  ].join('\n');
}

/** Load a gitignored `.env.local` if the shell has not already supplied the key. */
function loadDotEnv() {
  for (const file of ['.env.local', '.env']) {
    let text;
    try {
      text = readFileSync(path.join(HERE, '..', '..', file), 'utf8');
    } catch (_) {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = raw.trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

/* ------------------------------------------------------------------ pricing */

function pricing() {
  const raw = process.env.RELAY_EVAL_PRICING;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : null;
  } catch (_) {
    process.stderr.write('Ignoring RELAY_EVAL_PRICING: not valid JSON.\n');
    return null;
  }
}

/** Per-million USD, matching `costOf` in brnyAgent.js. */
function costOf(usage, rates) {
  if (!rates) return null;
  const perMillion = (tokens, rate) => (Number(tokens) || 0) / 1e6 * (Number(rate) || 0);
  return perMillion(usage.input_tokens, rates.input)
    + perMillion(usage.output_tokens, rates.output)
    + perMillion(usage.cache_read_input_tokens, rates.cacheRead)
    + perMillion(usage.cache_creation_input_tokens, rates.cacheWrite);
}

function addUsage(total, usage = {}) {
  return {
    input_tokens: (total.input_tokens || 0) + (Number(usage.input_tokens) || 0),
    output_tokens: (total.output_tokens || 0) + (Number(usage.output_tokens) || 0),
    cache_read_input_tokens: (total.cache_read_input_tokens || 0) + (Number(usage.cache_read_input_tokens) || 0),
    cache_creation_input_tokens: (total.cache_creation_input_tokens || 0) + (Number(usage.cache_creation_input_tokens) || 0),
  };
}

/* --------------------------------------------------------------- task runner */

const MAX_TURNS = 4;

/**
 * Reset the store, apply the task's own `setup` fixture, then snapshot the
 * baseline the turn is graded against.
 *
 * Staging runs before the snapshot on purpose: a task that has to bend the demo
 * data into shape (a Draft invoice to send, say) must not have that write show up
 * in the graded diff as if the agent had done it.
 *
 * @returns {Promise<{ before: object, failure: string|null }>} `failure` carries a
 *   thrown `setup`, so a broken fixture is reported as an infrastructure error
 *   rather than silently grading against a store the task did not expect.
 */
async function stageTask(h, task) {
  await h.reset();
  let failure = null;
  if (typeof task.setup === 'function') {
    try {
      await task.setup(h);
    } catch (err) {
      failure = `setup threw: ${err.stack || err.message}`;
    }
  }
  return { before: h.snapshot(), failure };
}

/**
 * Drive one task to a stop, following up once if the model asks a question and
 * the task knows the answer the user would have given.
 */
async function runTask(h, task) {
  const events = [];
  const turns = [];
  const maxTurns = task.maxTurns || MAX_TURNS;
  let messages;
  let resume;
  let result;

  const approve = task.approve === undefined
    ? undefined
    : async (pending) => Boolean(await (typeof task.approve === 'function' ? task.approve(pending) : task.approve));

  for (let turn = 0; turn < maxTurns; turn += 1) {
    result = await h.runTurn({
      prompt: turn === 0 ? task.prompt : undefined,
      messages,
      resume,
      system: h.playbook,
      approve,
      onEvent: (event) => events.push(event),
    });
    turns.push(result);
    if (result.status === 'ask_user' && task.answer !== undefined && result.pendingQuestion?.toolUseId) {
      resume = { toolUseId: result.pendingQuestion.toolUseId, answer: task.answer };
      messages = result.messages;
      continue;
    }
    break;
  }

  return { result, turns, events };
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (options.unknown?.length) {
    process.stderr.write(`Unknown option(s): ${options.unknown.join(', ')}\n\n${usage()}\n`);
    return 2;
  }
  if (options.category && !CATEGORIES.includes(options.category)) {
    process.stderr.write(`Unknown category "${options.category}". Known: ${CATEGORIES.join(', ')}\n`);
    return 2;
  }
  if (options.suite && !SUITES[options.suite]) {
    process.stderr.write(`Unknown suite "${options.suite}". Known: ${Object.keys(SUITES).join(', ')}\n`);
    return 2;
  }

  let tasks;
  try {
    tasks = selectTasks(options);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    return 2;
  }

  if (options.list) {
    for (const task of tasks) process.stdout.write(`${task.category.padEnd(10)} ${task.id.padEnd(32)} ${task.prompt}\n`);
    process.stdout.write(`\n${tasks.length} task(s).\n`);
    return 0;
  }

  const { problems, counts } = validateTasks(tasks);
  if (problems.length) {
    process.stderr.write(`Corpus problems:\n  ${problems.join('\n  ')}\n`);
    return 2;
  }

  loadDotEnv();
  const rates = pricing();

  if (options.dryRun) {
    const h = await boot();
    let bootFaults = 0;
    for (const task of tasks) {
      try {
        const { before, failure: staging } = await stageTask(h, task);
        if (staging) throw new Error(staging);
        const checker = createChecker();
        task.check(checker, {
          h,
          store: h.store,
          before,
          after: before,
          change: { created: [], updated: [], removed: [] },
          result: {
            status: 'done', text: '', steps: 0, actions: [], failures: [], approvals: [],
            questions: [], pendingQuestion: null, pendingApproval: null,
            usage: {}, costUsd: null, messages: [], error: null,
          },
          events: [],
          labels: [],
          actions: [],
          turns: 0,
          todayKey: todayKey(),
        });
      } catch (err) {
        bootFaults += 1;
        process.stderr.write(`  ${task.id}: check() threw on an empty turn — ${err.message}\n`);
      }
    }
    if (!options.quiet) {
      const collections = Object.keys(h.snapshot()).length;
      process.stdout.write(`Dry run: ${tasks.length} task(s) validated, ${collections} collections booted, no model calls.\n`);
      process.stdout.write(`  ${Object.entries(counts).map(([name, n]) => `${name} ${n}`).join(', ')}\n`);
    }
    return bootFaults ? 1 : 0;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('ANTHROPIC_API_KEY is not set. Use --dry-run to validate the corpus without a key.\n');
    return 2;
  }

  const h = await boot();
  if (!h.transport.hasKey) {
    process.stderr.write('The transport has no API key; the .env.local file may be missing or empty.\n');
    return 2;
  }

  const started = Date.now();
  const results = [];
  const totals = { usage: {}, costUsd: 0, requests: 0, steps: 0, passes: 0 };

  for (const task of tasks) {
    const staged = await stageTask(h, task);
    const before = staged.before;
    const requestMark = h.transport.calls.length;
    const clock = new Date();
    let failure = staged.failure;
    let outcome;

    try {
      if (!failure) outcome = await runTask(h, task);
    } catch (err) {
      failure = `threw: ${err.stack || err.message}`;
    }

    const after = h.snapshot();
    const change = diff(before, after);
    const checker = createChecker();
    if (failure) checker.fail(failure);
    const ctx = {
      h,
      store: h.store,
      before,
      after,
      change,
      result: outcome?.result || { status: 'error', text: '', steps: 0, actions: [], approvals: [] },
      events: outcome?.events || [],
      labels: (outcome?.events || []).filter((event) => event.type === 'label'),
      actions: (outcome?.turns || []).flatMap((turn) => turn.actions || []),
      turns: outcome?.turns?.length || 0,
      todayKey: todayKey(clock),
    };

    if (!failure) {
      try {
        task.check(checker, ctx);
      } catch (err) {
        checker.fail(`check() threw: ${err.stack || err.message}`);
      }
    }

    const requests = h.transport.calls.slice(requestMark);
    const usage = (outcome?.turns || []).reduce((total, turn) => addUsage(total, turn.usage), {});
    totals.usage = addUsage(totals.usage, usage);
    totals.requests += requests.length;
    totals.steps += ctx.result.steps || 0;
    const taskCost = costOf(usage, rates);
    if (taskCost) totals.costUsd += taskCost;

    const passed = checker.failures.length === 0;
    if (passed) totals.passes += 1;

    results.push({
      id: task.id,
      category: task.category,
      prompt: task.prompt,
      passed,
      failures: checker.failures,
      status: ctx.result.status,
      steps: ctx.result.steps || 0,
      turns: ctx.turns,
      requests: requests.length,
      usage,
      costUsd: taskCost,
      changed: summariseDiff(change),
      text: ctx.result.text || '',
      error: ctx.result.error || null,
    });

    if (!options.quiet || !passed) {
      const mark = passed ? 'PASS' : 'FAIL';
      process.stdout.write(`${mark} ${task.id} — ${ctx.result.status}, ${ctx.result.steps || 0} steps, ${requests.length} request(s), ${summariseDiff(change)}\n`);
      if (!passed) {
        for (const message of checker.failures) process.stdout.write(`       ${message}\n`);
        if (!options.quiet) process.stdout.write(`       said: ${JSON.stringify((ctx.result.text || '').slice(0, 200))}\n`);
      }
    }
  }

  const seconds = (Date.now() - started) / 1000;
  const summary = {
    suite: options.suite || Object.keys(SUITES).join(','),
    model: h.transport.model,
    tasks: results.length,
    passed: totals.passes,
    passRate: results.length ? totals.passes / results.length : 0,
    steps: totals.steps,
    stepsPerTask: results.length ? totals.steps / results.length : 0,
    requests: totals.requests,
    usage: totals.usage,
    costUsd: rates ? totals.costUsd : null,
    seconds,
    results,
  };

  if (!options.json) {
    const pct = (summary.passRate * 100).toFixed(0);
    process.stdout.write(`\n${totals.passes}/${results.length} passed (${pct}%) on ${summary.model} in ${seconds.toFixed(0)}s\n`);
    process.stdout.write(`  ${(totals.steps / (results.length || 1)).toFixed(1)} steps/task, `
      + `${(totals.requests / (results.length || 1)).toFixed(1)} requests/task, `
      + `${totals.usage.input_tokens || 0} in / ${totals.usage.output_tokens || 0} out tokens, `
      + `${summary.costUsd === null ? 'cost n/a' : `$${summary.costUsd.toFixed(4)}`}\n`);
    const byCategory = {};
    for (const row of results) {
      byCategory[row.category] = byCategory[row.category] || { passed: 0, total: 0 };
      byCategory[row.category].total += 1;
      if (row.passed) byCategory[row.category].passed += 1;
    }
    process.stdout.write(`  ${Object.entries(byCategory).map(([name, tally]) => `${name} ${tally.passed}/${tally.total}`).join(', ')}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  }

  if (options.out) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(options.out, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  }

  return totals.passes === results.length ? 0 : 1;
}

function todayKey(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Only run when invoked as a script; importing this file for tests must not
// start spending tokens.
const invokedDirectly = Boolean(process.argv[1])
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main()
    .then((code) => { process.exitCode = code; })
    .catch((err) => {
      process.stderr.write(`${err.stack || err.message}\n`);
      process.exitCode = 1;
    });
}

export { runTask, stageTask, main, allTasks };

/**
 * Guards for the assistant's answer path.
 *
 * RelayAssistant.js cannot be imported in node — it pulls in `?url` workers and
 * DOMPurify — so its internal wiring is pinned by inspecting the source text,
 * the same way proxy-caps.test.js pins the edge function.
 *
 * The bug these pin: `answerAgentTurn` passed `finaliseExternalReply`'s pending
 * promise straight into `addMessage`, because that helper (and the
 * `parseAndExecuteActions` it defers to) is async and nothing awaited it. The
 * promise landed in the reply pipeline, `.toUpperCase()` threw, and the user got
 * "The model returned an empty reply." plus a local fallback instead of the
 * model's answer. Any un-awaited async helper on this path produces the same
 * symptom, so the un-awaited call pattern is asserted against directly.
 *
 * A second bug pinned here: `executeAction`'s CREATE_JOB, CREATE_QUOTE and
 * CREATE_INVOICE branches pushed onto a `list` declared in a *sibling* branch.
 * `const` is block scoped, so those branches threw `ReferenceError: list is not
 * defined`, the catch only logged, and the assistant still told the user the
 * record was created. Each branch must declare its own collection.
 *
 * A third invariant pinned here: hours attach to a task, not to a job, so the
 * legacy CREATE_JOB branch has to build the same "Main Task" node the job
 * screens build by hand instead of shipping an empty `tasks: []`.
 *
 * A fourth: `canRunBrnyAgent()` gated the whole tool loop on the cached `panel`
 * element. When the panel is already open at boot (or rebuilt by HMR) that
 * reference is stale, so every turn took the legacy text path and brny was sent
 * no tools at all — a silent downgrade that looks like a dumb assistant rather
 * than an error. The panel is now re-resolved from the document.
 *
 * A fifth: the tool loop was reached only for `QUESTION`, so the ACTION label
 * that the rule-based triage attaches to words like "add", "create" and "book"
 * sent every write to the legacy tag flow — which has no action registry, and so
 * no way to log time. Writes now reach the loop; only the canvas, navigation and
 * memory shortcuts (which the registry genuinely cannot do) stay behind.
 *
 * A sixth: the live context told the model the date with
 * `new Date().toLocaleString()`, which renders "15/10/2026, 9:14:03 am" for an
 * Australian user. A model reads that day-first form month-first, so the date
 * itself was the first thing to go wrong, and the line carried no weekday at
 * all. The live block now states the date with the same spelled-out,
 * weekday-bearing label the agent loop's briefing uses, so both prompt paths
 * agree on what day it is.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SOURCE = readFileSync(new URL('./RelayAssistant.js', import.meta.url), 'utf8');

test('answerAgentTurn is async so it can await the reply pipeline', () => {
  assert.match(SOURCE, /async function answerAgentTurn\(thread, result, ai, labels, elapsedMs\)/);
});

test('answerAgentTurn awaits finaliseExternalReply before drawing the bubble', () => {
  assert.match(SOURCE, /const finalReply = await finaliseExternalReply\(answer, buildSystemPrompt\(ai\)\);/);
  assert.match(SOURCE, /if \(finalReply\) addMessage\(thread, 'relay', finalReply\);/);
});

test('the pending reply is never assigned un-awaited', () => {
  assert.ok(!/=\s*finaliseExternalReply\(/.test(SOURCE), 'finaliseExternalReply is async and must be awaited');
});

test('callBrnyAgent awaits answerAgentTurn', () => {
  assert.match(SOURCE, /await answerAgentTurn\(target, result, ai, labels, elapsed\);/);
});

test('every caller that returns the reply promise is async', () => {
  const lines = SOURCE.split(/\r?\n/);
  const sites = [];
  lines.forEach((line, index) => {
    if (/return finaliseExternalReply\(/.test(line)) sites.push(index);
  });
  assert.equal(sites.length, 3, 'the legacy path returns the promise from three callers');

  for (const site of sites) {
    let declaration = -1;
    for (let index = site; index >= 0; index--) {
      if (/^(async )?function \w+\(/.test(lines[index])) { declaration = index; break; }
    }
    assert.notEqual(declaration, -1, `no enclosing function for line ${site + 1}`);
    assert.match(lines[declaration], /^async function /, `line ${site + 1} returns a promise from a non-async function`);
  }
});

test('the action parser is imported, not duplicated locally', () => {
  assert.match(SOURCE, /import \{ extractActions \} from '\.\.\/utils\/relayActionTags\.js';/);
  assert.ok(!/function extractActions\(/.test(SOURCE), 'extractActions lives in utils/relayActionTags.js');
});

test('every action branch declares the collection list it pushes onto', () => {
  const lines = SOURCE.split(/\r?\n/);
  const sites = [];
  lines.forEach((line, index) => {
    if (/list\.push\(newItem\)/.test(line)) sites.push(index);
  });
  assert.ok(sites.length >= 5, 'the legacy action executor writes through a branch-local list');

  for (const site of sites) {
    let declaration = -1;
    let branch = -1;
    for (let index = site; index >= 0; index--) {
      if (declaration === -1 && /(?:const|let|var) list =/.test(lines[index])) declaration = index;
      if (branch === -1 && /else if \(action ===/.test(lines[index])) branch = index;
      if (declaration !== -1 && branch !== -1) break;
    }
    assert.notEqual(declaration, -1, `line ${site + 1} pushes to an undeclared list`);
    assert.ok(
      declaration > branch,
      `line ${site + 1} reaches a list declared in a sibling branch; const is block scoped`,
    );
  }
});

test('a failed action is surfaced instead of logged only', () => {
  assert.match(
    SOURCE,
    /showToast\(`Could not complete the "\$\{action\}" action\.`, 'error'\)/,
    'a silently swallowed action failure lets the assistant claim success',
  );
});

test('a job the legacy action path creates starts with a Main Task', () => {
  const lines = SOURCE.split(/\r?\n/);
  const start = lines.findIndex((line) => /else if \(action === 'CREATE_JOB'/.test(line));
  assert.notEqual(start, -1, 'the legacy CREATE_JOB branch is gone');

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (/else if \(action === /.test(lines[index])) { end = index; break; }
  }

  const branch = lines.slice(start, end).join('\n');
  assert.match(branch, /tasks: \[\{/, 'the job literal must build a task list, not ship it empty');
  assert.match(branch, /name: 'Main Task'/, 'hours attach to a task, so a job cannot arrive without one');
});

test('no assistant job branch ships an empty task list', () => {
  assert.ok(!/tasks:\s*\[\s*\]/.test(SOURCE), 'every job the assistant builds starts with a Main Task');
});

test('the agent path survives a missing or detached panel reference', () => {
  assert.ok(
    !/canRunBrnyAgent\(\)[\s\S]{0,120}?panel && panel\.querySelector/.test(SOURCE),
    'gating the tool loop on the cached panel reference silently drops brny to the legacy path',
  );
  assert.match(
    SOURCE,
    /function relayHostEl\(\) \{\s*\n\s*if \(panel && panel\.isConnected\) return panel;\s*\n\s*return document\.querySelector\('\.relay-panel'\);/,
    'the panel must be re-resolved from the document when the cached node is stale',
  );
  assert.match(SOURCE, /function canRunBrnyAgent\(\) \{\s*\n\s*return canUseAI\(\) && !!relayThreadEl\(\);/, 'canRunBrnyAgent must go through relayThreadEl');
});

test('a write phrased as an action reaches the agent loop', () => {
  assert.match(
    SOURCE,
    /if \(shouldUseAgentLoop\(\{ intent: triage\.intent, text, agentAvailable: canRunBrnyAgent\(\) \}\)\) \{\s*\n\s*return callBrnyAgent\(\);/,
    'routing on the bare intent label sends writes to a flow with no tools',
  );
  assert.ok(
    !/triage\.intent === 'QUESTION' && canRunBrnyAgent\(\)/.test(SOURCE),
    'the QUESTION-only gate is what made "add 2 hours to J-00028" unanswerable',
  );
});

test('an interactive outcome pauses the turn and asks with buttons', () => {
  assert.match(
    SOURCE,
    /if \(result\.status === 'ask_user' && result\.pendingQuestion\) \{[\s\S]{0,260}?pendingTurn = \{ threadId: currentThreadId, messages: result\.messages, pendingQuestion: result\.pendingQuestion \};[\s\S]{0,200}?renderAgentQuestion\(target, result\.pendingQuestion\);/,
    'the question card needs the paused message history, or the answer cannot resume the turn',
  );
});

test('the question card renders one button per option and resumes the paused turn', () => {
  assert.match(SOURCE, /function renderAgentQuestion\(thread, question\) \{/);
  assert.match(
    SOURCE,
    /class="relay-question-opt-btn" data-value="\$\{escapeHtml\(String\(o\)\)\}">\$\{escapeHtml\(String\(o\)\)\}<\/button>/,
    'option text is model-supplied and must be escaped before it reaches the DOM',
  );
  assert.match(
    SOURCE,
    /void resumeBrnyTurn\(\{ toolUseId: question\.toolUseId, answer: text \}, text\);/,
    'the answer is matched to the tool call that asked for it'
  );
});

test('the resume replays the paused history verbatim', () => {
  assert.match(
    SOURCE,
    /if \(!thread \|\| !pending \|\| pending\.threadId !== currentThreadId\) return;[\s\S]{0,400}?await callBrnyAgent\(\{ thread, typing, messages: pending\.messages, resume \}\);/,
    'the provider matches the answer to a tool call in the history it paused with'
  );
});

test('the live context states the date the way the agent loop states it', () => {
  assert.match(
    SOURCE,
    /import \{ localDateTimeLabel \} from '\.\.\/utils\/dateUtils\.js';/,
    'the label comes from dateUtils, so both prompt paths spell the date out identically'
  );
  assert.match(
    SOURCE,
    /- Current Local Date & Time: \$\{localDateTimeLabel\(\)\}/,
    'the line the CRITICAL DATE AWARENESS paragraph points at must be this one'
  );
  assert.ok(
    !/new Date\(\)\.toLocaleString\(\)/.test(SOURCE),
    'toLocaleString renders "15/10/2026, 9:14:03 am" here, which models read month-first'
  );
  assert.match(
    SOURCE,
    /CRITICAL DATE AWARENESS: [^\n]*weekday[^\n]*earlier messages[^\n]*/,
    'the statement that today is not to be inferred, and outranks the thread, is the point of the paragraph'
  );
});
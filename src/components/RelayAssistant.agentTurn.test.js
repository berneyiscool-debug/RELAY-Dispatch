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

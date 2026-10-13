/**
 * The policy behind the Deputy conflict scan.
 *
 * The bug these pin: the scan used to run itself. DeputyAutopilot subscribed to
 * the store and swept on every change, and every collision group cost one AI call
 * whether or not the assistant was open. A group that failed was never recorded,
 * so the next store event bought it again — a retry storm that drained the daily
 * allowance the chat assistant needs.
 *
 * The fix is a policy, not a tweak: collisions are collected the same way, but the
 * sweep is now single-flight, it is refused while the panel is closed, and a group
 * that just failed is parked before it can be re-bought.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  PROPOSAL_FAILURE_COOLDOWN_MS,
  collectCollisionGroups,
  hasPendingAsk,
  isAllowanceError,
  createAttemptGuard,
} from './deputyScanPolicy.js';

const job = (id, technicianName, scheduledDate, status = 'Scheduled') => ({
  id,
  number: id,
  title: `Job ${id}`,
  technicianName,
  scheduledDate,
  status,
});

test('a technician booked twice on one day is a collision', () => {
  const jobs = [
    job('j1', 'Grace Berney', '2026-10-14'),
    job('j2', 'Grace Berney', '2026-10-14'),
    job('j3', 'Grace Berney', '2026-10-15'),
    job('j4', 'Sam Reed', '2026-10-14'),
  ];

  const groups = collectCollisionGroups(jobs);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].technicianName, 'Grace Berney');
  assert.equal(groups[0].scheduledDate, '2026-10-14');
  assert.deepEqual(groups[0].jobs.map(j => j.id), ['j1', 'j2']);
});

test('the collision key is the sorted job ids, so it survives reordering', () => {
  const forward = collectCollisionGroups([job('b', 'Grace Berney', '2026-10-14'), job('a', 'Grace Berney', '2026-10-14')]);
  const reverse = collectCollisionGroups([job('a', 'Grace Berney', '2026-10-14'), job('b', 'Grace Berney', '2026-10-14')]);
  assert.equal(forward[0].jobIds, 'a,b');
  assert.equal(forward[0].jobIds, reverse[0].jobIds);
});

test('an unassigned job cannot collide with anything', () => {
  const jobs = [
    job('j1', 'Unassigned', '2026-10-14'),
    job('j2', 'Unassigned', '2026-10-14'),
    job('j3', '', '2026-10-14'),
    job('j4', '', '2026-10-14'),
  ];
  assert.deepEqual(collectCollisionGroups(jobs), []);
});

test('a job with no scheduled date cannot collide with anything', () => {
  const jobs = [job('j1', 'Grace Berney', ''), job('j2', 'Grace Berney', ''), job('j3', 'Grace Berney', null)];
  assert.deepEqual(collectCollisionGroups(jobs), []);
});

test('only live work is considered', () => {
  const jobs = [
    job('j1', 'Grace Berney', '2026-10-14', 'Completed'),
    job('j2', 'Grace Berney', '2026-10-14', 'Cancelled'),
    job('j3', 'Grace Berney', '2026-10-15', 'In Progress'),
    job('j4', 'Grace Berney', '2026-10-15', 'Scheduled'),
  ];

  const groups = collectCollisionGroups(jobs);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].jobs.map(j => j.id), ['j3', 'j4']);
});

test('collectCollisionGroups tolerates empty and malformed input', () => {
  assert.deepEqual(collectCollisionGroups(), []);
  assert.deepEqual(collectCollisionGroups(null), []);
  assert.deepEqual(collectCollisionGroups([null, undefined, {}]), []);
});

test('an existing pending ask skips its collision, a resolved one does not', () => {
  const asks = [
    { status: 'resolved', conflictJobIds: 'a,b' },
    { status: 'pending', conflictJobIds: 'c,d' },
  ];

  assert.equal(hasPendingAsk(asks, 'c,d'), true);
  assert.equal(hasPendingAsk(asks, 'a,b'), false);
  assert.equal(hasPendingAsk(asks, 'e,f'), false);
  assert.equal(hasPendingAsk(undefined, 'c,d'), false);
});

test('a used-up allowance is recognised by name, anything else is not', () => {
  const limit = Object.assign(new Error('used up'), { name: 'AILimitError', scope: 'company' });
  assert.equal(isAllowanceError(limit), true);
  assert.equal(isAllowanceError(new Error('network')), false);
  assert.equal(isAllowanceError(undefined), false);
  assert.equal(isAllowanceError(null), false);
});

test('a sweep is single-flight', () => {
  const guard = createAttemptGuard();
  assert.equal(guard.isRunning(), false);
  assert.equal(guard.begin(), true);
  assert.equal(guard.isRunning(), true);
  assert.equal(guard.begin(), false, 'a second trigger must not start a second sweep');
  guard.end();
  assert.equal(guard.begin(), true, 'the guard must release when the sweep ends');
});

test('a failed collision is parked, a successful one is not', () => {
  let clock = 1_000_000;
  const guard = createAttemptGuard({ now: () => clock });

  guard.noteFailure('a,b');
  assert.equal(guard.isCoolingDown('a,b'), true);

  guard.noteSuccess('a,b');
  assert.equal(guard.isCoolingDown('a,b'), false);

  guard.noteFailure('c,d');
  assert.equal(guard.isCoolingDown('c,d'), true);
  assert.equal(guard.isCoolingDown('e,f'), false, 'the cooldown is per collision');
});

test('the cooldown lapses on its own', () => {
  let clock = 1_000_000;
  const guard = createAttemptGuard({ now: () => clock });

  guard.noteFailure('a,b');
  clock += PROPOSAL_FAILURE_COOLDOWN_MS - 1;
  assert.equal(guard.isCoolingDown('a,b'), true);

  clock += 1;
  assert.equal(guard.isCoolingDown('a,b'), false);
});

// ── Source guards ──
// DeputyAutopilot.js is importable in node, but the visibility guard needs a DOM
// and the sweep needs the network, so its wiring is pinned by inspecting the text.

const AUTOPILOT = readFileSync(new URL('./DeputyAutopilot.js', import.meta.url), 'utf8');
const ASSISTANT = readFileSync(new URL('../components/RelayAssistant.js', import.meta.url), 'utf8');

test('the conflict scan never subscribes to the store', () => {
  // This is the whole bug: a store subscription is what made it run unprompted.
  assert.ok(!/store\.on\(/.test(AUTOPILOT), 'the scan must not run on store events');
  assert.ok(!/triggerAutopilotEvaluation/.test(AUTOPILOT), 'the debounced auto-trigger must be gone');
});

test('the conflict scan is not armed as an import side effect', () => {
  const MAIN = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert.ok(!/DeputyAutopilot/.test(MAIN), 'main.js must not import the autopilot');
});

test('the conflict scan does not import the assistant component', () => {
  // Importing it there would be a cycle (RelayAssistant imports this module), and
  // it is what kept this file out of the test suite.
  assert.ok(!/from '\.\.\/components\//.test(AUTOPILOT));
  assert.match(AUTOPILOT, /export async function runConflictScan\(\{ systemContext = '' \} = \{\}\)/);
});

test('the scan refuses to run while the assistant is closed', () => {
  assert.match(AUTOPILOT, /document\.querySelector\('\.relay-panel\.open'\)/);
  assert.match(AUTOPILOT, /if \(!isAssistantOpen\(\)\) return \{ ran: false, reason: 'closed' \}/);
});

test('the sweep stops at the first failure instead of buying every group', () => {
  assert.match(AUTOPILOT, /if \(isAllowanceError\(err\)\) \{/);
  assert.match(AUTOPILOT, /guard\.noteFailure\(group\.jobIds\);/);
  assert.ok(/break;/.test(AUTOPILOT), 'a failed group must end the sweep');
});

test('an exhausted allowance parks every group, not just the first', () => {
  // The allowance is shared: the remaining groups cannot be afforded either, so
  // repeated clicks must not buy one rejected call per group.
  assert.match(AUTOPILOT, /groups\.forEach\(g => guard\.noteFailure\(g\.jobIds\)\);/);
});

test('the Watchdog Run Scan button is the only trigger, and it is user-prompted', () => {
  assert.match(ASSISTANT, /import \{ runConflictScan \} from '\.\.\/utils\/DeputyAutopilot\.js';/);
  assert.match(ASSISTANT, /container\.querySelector\('\.btn-run-scan'\)\?\.addEventListener\('click', async \(\) => \{/);
  assert.match(ASSISTANT, /await runUserInitiatedConflictScan\(container\);/);
  assert.match(ASSISTANT, /await runConflictScan\(\{ systemContext: getSystemContext\(\) \}\);/);
});

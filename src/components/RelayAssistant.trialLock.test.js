/**
 * Pins the expired-trial guard on brny.
 *
 * RelayAssistant.js cannot be imported in node — it pulls in `?url` workers,
 * DOMPurify and the PDF pipeline — so its wiring is pinned by inspecting the
 * source text, the same convention RelayAssistant.agentTurn.test.js uses.
 *
 * The bug these pin: when a trial ended, the account went read-only but brny
 * still opened. Every turn spends AI allowance through the edge function, and
 * most requests end in a write `store._readOnlyBlocked()` refuses, so the user
 * got an assistant that answered and then could not act. The pause has to sit at
 * every entry point, not only the top-bar button that happens to be greyed out.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SOURCE = readFileSync(new URL('./RelayAssistant.js', import.meta.url), 'utf8');

test('the assistant reads the same lock the rest of the UI does', () => {
  assert.match(SOURCE, /import \{ isWriteLocked, showSubscribeRequiredPrompt \} from '\.\.\/utils\/writeLock\.js';/);
});

test('brnyPaused is defined in terms of isWriteLocked', () => {
  assert.match(SOURCE, /function brnyPaused\(\) \{\s*return isWriteLocked\(\);\s*\}/);
});

test('toggleRelay refuses and explains instead of opening the panel', () => {
  assert.match(
    SOURCE,
    /export function toggleRelay\(\) \{\s*if \(brnyPaused\(\)\) \{\s*if \(panel\) closeRelay\(\);\s*showSubscribeRequiredPrompt\(\);\s*return;\s*\}/,
  );
});

test('openRelay refuses, so deep entry points cannot bypass the button', () => {
  // The permission check stays first: a technician without AI access should not
  // be upsold an AI feature they never had.
  assert.match(
    SOURCE,
    /if \(!hasPermission\('AI Assistant', 'use'\)\) return;\s*\n\s*if \(brnyPaused\(\)\) \{\s*showSubscribeRequiredPrompt\(\);\s*return;\s*\}/,
  );
});

test('attaching files throws a readable error rather than failing on a missing panel', () => {
  assert.match(SOURCE, /if \(brnyPaused\(\)\) throw new Error\('brny is paused until you subscribe\./);
});

test('openDeputyWithPrompt stops when no panel opened (help centre, onboarding)', () => {
  assert.match(SOURCE, /await openRelay\(\);\s*\}\s*\n\s*\/\/ openRelay\(\) refuses[\s\S]{0,200}?if \(!panel\) return;/);
});

test('an already-open panel closes when the trial lapses mid-session', () => {
  assert.match(SOURCE, /store\.on\('settings', \(\) => \{\s*if \(panel && brnyPaused\(\)\) closeRelay\(\);\s*\}\);/);
});

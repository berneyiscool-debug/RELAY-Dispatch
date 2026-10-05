import test from 'node:test';
import assert from 'node:assert/strict';

// `aiEngine.js` falls back to an offline stub client when Supabase env vars are
// absent, which is exactly how it loads under the test runner.
import { AILimitError, formatLocalReset, limitErrorMessage } from './aiEngine.js';

const clockTime = (d) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);

test('a used-up allowance renders the reset in the reading user\'s own timezone', () => {
  const now = new Date();
  assert.strictEqual(formatLocalReset(now), `${clockTime(now)} today`);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  assert.strictEqual(formatLocalReset(tomorrow), `${clockTime(tomorrow)} tomorrow`);

  // Anything further out needs the date, or "tomorrow" would be a lie.
  const later = new Date(now);
  later.setDate(later.getDate() + 9);
  const label = formatLocalReset(later);
  assert.match(label, /^.+ on .+$/);
  assert.doesNotMatch(label, /today|tomorrow/);
});

test('the personal ceiling and the team pool are described differently', () => {
  const resetsAt = new Date(Date.now() + 3600000).toISOString();
  const personal = limitErrorMessage({
    message: 'server copy',
    scope: 'user',
    poolRemainingMessages: 3,
    resetsAt,
  });
  assert.match(personal, /^You've reached your personal brny allowance for today\./);
  assert.match(personal, /Your team still has allowance left today\./);
  // No count: how many messages a call buys is a guess, so it is not quoted.
  assert.doesNotMatch(personal, /message/i);

  const outToo = limitErrorMessage({
    message: 'server copy',
    scope: 'user',
    poolRemainingMessages: 0,
    resetsAt,
  });
  assert.match(outToo, /Your team is out of AI allowance for today too\./);

  const company = limitErrorMessage({ message: 'server copy', scope: 'company', resetsAt });
  assert.match(company, /^Your team's brny allowance for today is used up\./);
  assert.doesNotMatch(company, /personal/);
  assert.doesNotMatch(company, /message/i);
});

test('a refusal with no reset instant falls back to the server sentence', () => {
  assert.strictEqual(
    limitErrorMessage({ message: 'Daily limit reached.', scope: 'company' }),
    'Daily limit reached.'
  );
  // An unparsable instant is no instant.
  assert.strictEqual(
    limitErrorMessage({ message: 'Daily limit reached.', scope: 'company', resetsAt: 'whenever' }),
    'Daily limit reached.'
  );
});

test('AILimitError carries the scope, the totals and a usable reset date', () => {
  const err = new AILimitError({
    message: 'blocked',
    scope: 'user',
    remainingMessages: 0,
    poolRemainingMessages: 4,
    resetsAt: '2026-05-10T14:00:00.000Z',
  });
  assert.ok(err instanceof Error);
  assert.strictEqual(err.name, 'AILimitError');
  assert.strictEqual(err.scope, 'user');
  assert.strictEqual(err.poolRemainingMessages, 4);
  assert.strictEqual(err.resetsAt.toISOString(), '2026-05-10T14:00:00.000Z');

  // Anything unrecognised is a company block, which is the safer thing to say.
  const odd = new AILimitError({ message: 'x', scope: 'nonsense', resetsAt: 'not a date' });
  assert.strictEqual(odd.scope, 'company');
  assert.strictEqual(odd.resetsAt, null);
  assert.strictEqual(odd.remainingMessages, null);
});

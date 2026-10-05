// The bars are the only place a user sees the allowance before it runs out, so
// the copy, the colour thresholds and the "not enough to make one message"
// fallback are all pinned here. The snapshot is rendered through
// `usageBarsHtmlFor` rather than `usageBarsHtml` so no network or DOM is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { usageBarsHtmlFor } from './UsageBars.js';

// A meter exactly as `usageSnapshot()` in the edge function emits it.
function meter({ usedUnits = 0, limitUnits = 0, remainingUnits = 0 }) {
  const toMessages = (units) => Math.floor(Math.max(0, units) / 2);
  return {
    usedUnits,
    limitUnits,
    remainingUnits,
    usedMessages: toMessages(usedUnits),
    limitMessages: toMessages(limitUnits),
    remainingMessages: toMessages(remainingUnits),
    percent: limitUnits > 0 ? Math.min(100, Math.round((usedUnits / limitUnits) * 100)) : 0,
  };
}

function snapshot(overrides = {}) {
  return {
    blocked: null,
    seats: 2,
    user: meter({ usedUnits: 35, limitUnits: 300, remainingUnits: 265 }),
    company: meter({ usedUnits: 35, limitUnits: 150, remainingUnits: 115 }),
    resetsAt: null,
    ...overrides,
  };
}

test('renders nothing without a snapshot', () => {
  assert.equal(usageBarsHtmlFor(null), '');
  assert.equal(usageBarsHtmlFor(undefined), '');
  assert.equal(usageBarsHtmlFor({}), '');
  assert.equal(usageBarsHtmlFor({ user: meter({}) }), '');
});

test('shows both bars as message counts', () => {
  const html = usageBarsHtmlFor(snapshot());
  assert.match(html, /Your usage today/);
  assert.match(html, /Today&#39;s team usage/);  // escaped by escapeHTML
  assert.match(html, /17 of 150 messages/);   // this seat: 35 units of 300
  assert.match(html, /17 of 75 messages/);    // the pool: 35 units of 150
  assert.match(html, /132 messages left/);
  assert.match(html, /57 messages left/);
});

test('an allowance too small for one message is shown in credits', () => {
  const html = usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits: 0, limitUnits: 1, remainingUnits: 1 }),
  }));
  assert.match(html, /0 of 1 AI credits/);
  assert.match(html, /1 AI credit left/);
  assert.doesNotMatch(html, /0 of 0 messages/);
});

test('a spent allowance says so instead of counting down', () => {
  const html = usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits: 300, limitUnits: 300, remainingUnits: 0 }),
  }));
  assert.match(html, /No messages left today/);
});

test('colour tracks how much of the allowance is gone', () => {
  const at = (usedUnits) => usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits, limitUnits: 300, remainingUnits: 300 - usedUnits }),
  }));
  assert.match(at(30), /usage-meter-fill--ok/);        // 10%
  assert.match(at(240), /usage-meter-fill--warning/);  // 80%
  assert.match(at(300), /usage-meter-fill--danger/);   // 100%
});

test('a personal block names the personal allowance', () => {
  const html = usageBarsHtmlFor(snapshot({ blocked: 'user' }));
  assert.match(html, /Your daily allowance is used up/);
  assert.match(html, /usage-bars-foot--blocked/);
});

test('a company block names the team allowance', () => {
  const html = usageBarsHtmlFor(snapshot({ blocked: 'company' }));
  assert.match(html, /daily allowance is used up/);
  assert.match(html, /usage-bars-foot--blocked/);
});

test('the reset line is shown in local time when nothing is blocked', () => {
  const html = usageBarsHtmlFor(snapshot({ resetsAt: new Date(Date.now() + 3600000) }));
  assert.match(html, /Resets /);
  assert.doesNotMatch(html, /usage-bars-foot--blocked/);
});

test('no footer at all when there is neither a reset nor a block', () => {
  // formatLocalReset() throws on null, so an absent reset must not reach it.
  assert.doesNotMatch(usageBarsHtmlFor(snapshot()), /usage-bars-foot/);
});

test('the bar width cannot be driven by the payload', () => {
  const wide = usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits: 300, limitUnits: 300, remainingUnits: 0 }),
  }));
  assert.match(wide, /width:100%/);

  const hostile = snapshot();
  hostile.user.percent = '" onmouseover="alert(1)';
  const html = usageBarsHtmlFor(hostile);
  assert.match(html, /width:0%/);
  assert.doesNotMatch(html, /onmouseover/);
});

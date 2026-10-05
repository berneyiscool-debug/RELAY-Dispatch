// The bars are the only place a user sees the allowance before it runs out, so
// the copy, the colour thresholds and the "percentages only" rule are all pinned
// here. The snapshot is rendered through `usageBarsHtmlFor` rather than
// `usageBarsHtml` so no network or DOM is needed.
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

test('shows both bars as percentages of the allowance', () => {
  const html = usageBarsHtmlFor(snapshot());
  assert.match(html, /Your usage today/);
  assert.match(html, /Today&#39;s team usage/);  // escaped by escapeHTML
  assert.match(html, />12%<\/span>/);   // this seat: 35 units of 300
  assert.match(html, />23%<\/span>/);   // the pool: 35 units of 150
  assert.match(html, /aria-valuenow="12"/);
  assert.match(html, /aria-valuetext="Your usage today: 12% used"/);
});

test('the payload cannot smuggle a message or credit count back in', () => {
  // The snapshot still carries usedMessages/limitMessages. Nothing may render
  // them, because a message costs a variable number of billable calls.
  const html = usageBarsHtmlFor(snapshot());
  assert.doesNotMatch(html, /message/i);
  assert.doesNotMatch(html, /credit/i);

  const lying = snapshot();
  lying.user.usedMessages = 9999;
  lying.user.limitMessages = -1;
  lying.user.remainingMessages = 0;
  assert.equal(usageBarsHtmlFor(lying), html);
});

test('an allowance too small for one message is still a percentage', () => {
  // This is the case the old wording reported as "0 of 0 messages".
  const untouched = usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits: 0, limitUnits: 1, remainingUnits: 1 }),
  }));
  assert.match(untouched, />0%<\/span>/);
  assert.doesNotMatch(untouched, /0 of 0/);

  const spent = usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits: 1, limitUnits: 1, remainingUnits: 0 }),
  }));
  assert.match(spent, />100%<\/span>/);
  assert.match(spent, /width:100%/);
  assert.match(spent, /usage-meter-fill--danger/);
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

test('the bar width and the percentage cannot be driven by the payload', () => {
  const wide = usageBarsHtmlFor(snapshot({
    user: meter({ usedUnits: 300, limitUnits: 300, remainingUnits: 0 }),
  }));
  assert.match(wide, /width:100%/);

  const hostile = snapshot();
  hostile.user.percent = '" onmouseover="alert(1)';
  const html = usageBarsHtmlFor(hostile);
  assert.match(html, /width:0%/);
  assert.match(html, />0%<\/span>/);
  assert.doesNotMatch(html, /onmouseover/);

  // A server that over-reports must not draw a bar wider than its track.
  const over = snapshot();
  over.user.percent = 999;
  const clamped = usageBarsHtmlFor(over);
  assert.match(clamped, /width:100%/);
  assert.match(clamped, /aria-valuenow="100"/);
  assert.doesNotMatch(clamped, /999/);
});

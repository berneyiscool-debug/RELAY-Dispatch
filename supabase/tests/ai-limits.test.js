/**
 * Behavioural tests for the pooled daily AI allowance.
 *
 * The allowance maths lives in supabase/functions/relay-copilot/limits.js
 * precisely so it can be exercised here for real: pool sizes per plan and per
 * seat count, the per-user ceiling that has to refuse one seat without refusing
 * the team, and the Sydney day window, which is the part a UTC-midnight reset
 * gets wrong twice a year.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  LIMIT_DEFAULTS,
  evaluateLimits,
  formatResetText,
  isCloudPlusCompany,
  limitMessage,
  nextResetUtc,
  poolLimit,
  readLimits,
  resolveSeats,
  startOfDayUtc,
  unitsToMessages,
  usageSnapshot,
  userLimit,
} from '../functions/relay-copilot/limits.js';

const L = LIMIT_DEFAULTS;

describe('company pool size', () => {
  test('a one-seat company gets the floor, not 50', () => {
    assert.strictEqual(poolLimit(1, false, L), 150);
    assert.strictEqual(poolLimit(1, true, L), 150);
  });

  test('the pool scales with seats beyond the floor', () => {
    assert.strictEqual(poolLimit(6, false, L), 300);
    assert.strictEqual(poolLimit(6, true, L), 450);
  });

  test('the floor still wins just under the crossover', () => {
    assert.strictEqual(poolLimit(2, false, L), 150);
    assert.strictEqual(poolLimit(3, false, L), 150);
  });

  test('the environment can retune every number', () => {
    const env = {
      RELAY_AI_POOL_PER_SEAT: '100',
      RELAY_AI_POOL_PER_SEAT_PLUS: '200',
      RELAY_AI_POOL_FLOOR: '500',
      RELAY_AI_USER_CAP: '80',
      RELAY_AI_USER_CAP_PLUS: '90',
    };
    const limits = readLimits((name) => env[name]);
    assert.deepStrictEqual(limits, { perSeat: 100, perSeatPlus: 200, floor: 500, userCap: 80, userCapPlus: 90 });
    assert.strictEqual(poolLimit(2, true, limits), 500);
    assert.strictEqual(userLimit(false, limits), 80);
  });

  test('an unset, empty or nonsense secret falls back to the default', () => {
    const limits = readLimits((name) => ({ RELAY_AI_POOL_FLOOR: '0', RELAY_AI_USER_CAP: 'soon' })[name]);
    assert.deepStrictEqual(limits, L);
    assert.strictEqual(readLimits(() => '').floor, L.floor);
    assert.strictEqual(readLimits(() => undefined).userCap, L.userCap);
  });
});

describe('per-user ceiling', () => {
  test('Cloud and Cloud+ ceilings differ', () => {
    assert.strictEqual(userLimit(false, L), 150);
    assert.strictEqual(userLimit(true, L), 200);
  });

  test('a seat at its ceiling is refused while teammates keep working', () => {
    const pool = poolLimit(6, false, L); // 300
    const cap = userLimit(false, L); // 150

    const teammate = evaluateLimits({ companyUnits: 60, userUnits: 20, pool, cap });
    assert.strictEqual(teammate.allowed, true);

    const spent = evaluateLimits({ companyUnits: 152, userUnits: 150, pool, cap });
    assert.strictEqual(spent.allowed, false);
    assert.strictEqual(spent.scope, 'user');
    assert.strictEqual(spent.userRemainingUnits, 0);
    // The pool is nowhere near exhausted - the refusal is personal.
    assert.strictEqual(spent.poolRemainingUnits, 148);
  });

  test('the last allowed call is the one that stays within the ceiling', () => {
    const cap = 150;
    assert.strictEqual(evaluateLimits({ companyUnits: 0, userUnits: cap - 1, pool: 300, cap }).allowed, true);
    assert.strictEqual(evaluateLimits({ companyUnits: 0, userUnits: cap, pool: 300, cap }).allowed, false);
  });

  test('an exhausted pool refuses even a seat with allowance left', () => {
    const verdict = evaluateLimits({ companyUnits: 300, userUnits: 10, pool: 300, cap: 150 });
    assert.strictEqual(verdict.allowed, false);
    assert.strictEqual(verdict.scope, 'company');
    assert.strictEqual(verdict.poolRemainingUnits, 0);
    assert.strictEqual(verdict.userRemainingUnits, 140);
  });

  test('a company with one heavy seat still cannot exceed its pool', () => {
    // 2 seats -> pool 150, ceiling 150: the two limits coincide here, and the
    // pool is what a one-seat company is actually bounded by.
    const pool = poolLimit(2, false, L);
    assert.strictEqual(pool, 150);
    assert.strictEqual(evaluateLimits({ companyUnits: 150, userUnits: 150, pool, cap: 150 }).scope, 'user');
    assert.strictEqual(evaluateLimits({ companyUnits: 150, userUnits: 149, pool, cap: 150 }).scope, 'company');
  });

  test('messages are quoted at two calls each', () => {
    assert.strictEqual(unitsToMessages(150), 75);
    assert.strictEqual(unitsToMessages(451), 225);
    assert.strictEqual(unitsToMessages(-5), 0);
    assert.strictEqual(unitsToMessages(undefined), 0);
  });
});

describe('plan tier resolution', () => {
  test('a complimentary grant, a subscription and the legacy flag all count', () => {
    assert.strictEqual(isCloudPlusCompany({ comp_tier: 'cloud_plus' }), true);
    assert.strictEqual(isCloudPlusCompany({ subscription_tier: 'cloud_plus' }), true);
    assert.strictEqual(isCloudPlusCompany({ ai_tier: 'cloudPlus' }), true);
    assert.strictEqual(isCloudPlusCompany({ settings: { ai: { tier: 'cloudPlus' } } }), true);
  });

  test('everyone else is on the Cloud allowance', () => {
    assert.strictEqual(isCloudPlusCompany({ subscription_tier: 'cloud', comp_tier: null }), false);
    assert.strictEqual(isCloudPlusCompany({ settings: { ai: { tier: 'cloud' } } }), false);
    assert.strictEqual(isCloudPlusCompany(null), false);
    assert.strictEqual(isCloudPlusCompany(undefined), false);
  });
});

describe('seat count', () => {
  test('the Stripe quantity is preferred, the live count is the fallback', () => {
    assert.strictEqual(resolveSeats({ subscription_seats: 7 }, 3), 7);
    assert.strictEqual(resolveSeats({ subscription_seats: null }, 3), 3);
    assert.strictEqual(resolveSeats({}, 3), 3);
  });

  test('a brand-new or unsubscribed company is one seat, never zero', () => {
    assert.strictEqual(resolveSeats({}, null), 1);
    assert.strictEqual(resolveSeats({ subscription_seats: 0 }, 0), 1);
    assert.strictEqual(resolveSeats(undefined, undefined), 1);
  });
});

describe('the reset window is Sydney local midnight', () => {
  // Sydney is UTC+11 during AEDT and UTC+10 during AEST, and the clocks move on
  // the first Sunday in October and the first Sunday in April.
  test('a normal AEST day starts at 14:00Z the day before', () => {
    const start = startOfDayUtc(new Date('2026-07-15T05:00:00Z')); // 15:00 local
    assert.strictEqual(start.toISOString(), '2026-07-14T14:00:00.000Z');
    const next = nextResetUtc(new Date('2026-07-15T05:00:00Z'));
    assert.strictEqual(next.toISOString(), '2026-07-15T14:00:00.000Z');
    assert.strictEqual(next.getTime() - start.getTime(), 24 * 3600 * 1000);
  });

  test('the April transition day is 25 hours long', () => {
    // DST ends 02:00 local on 5 April 2026: midnight is still AEDT (+11), the
    // following midnight is AEST (+10).
    const start = startOfDayUtc(new Date('2026-04-04T20:00:00Z')); // 07:00 local on 5 Apr
    assert.strictEqual(start.toISOString(), '2026-04-04T13:00:00.000Z');
    const next = nextResetUtc(new Date('2026-04-04T20:00:00Z'));
    assert.strictEqual(next.toISOString(), '2026-04-05T14:00:00.000Z');
    assert.strictEqual(next.getTime() - start.getTime(), 25 * 3600 * 1000);
  });

  test('the October transition day is 23 hours long', () => {
    // DST starts 02:00 local on 4 October 2026: midnight is AEST (+10), the
    // following midnight is AEDT (+11).
    const start = startOfDayUtc(new Date('2026-10-03T20:00:00Z')); // 06:00 local on 4 Oct
    assert.strictEqual(start.toISOString(), '2026-10-03T14:00:00.000Z');
    const next = nextResetUtc(new Date('2026-10-03T20:00:00Z'));
    assert.strictEqual(next.toISOString(), '2026-10-04T13:00:00.000Z');
    assert.strictEqual(next.getTime() - start.getTime(), 23 * 3600 * 1000);
  });

  test('the window is stable right up to the boundary', () => {
    // One second before local midnight the reset is imminent, and the start of
    // the day is unchanged; one second after, both roll forward.
    const before = new Date('2026-07-15T13:59:59Z');
    assert.strictEqual(startOfDayUtc(before).toISOString(), '2026-07-14T14:00:00.000Z');
    assert.strictEqual(nextResetUtc(before).toISOString(), '2026-07-15T14:00:00.000Z');

    const after = new Date('2026-07-15T14:00:01Z');
    assert.strictEqual(startOfDayUtc(after).toISOString(), '2026-07-15T14:00:00.000Z');
    assert.strictEqual(nextResetUtc(after).toISOString(), '2026-07-16T14:00:00.000Z');
  });

  test('the reset instant is always in the future and names the zone', () => {
    const now = new Date('2026-04-04T20:00:00Z');
    const next = nextResetUtc(now);
    assert.ok(next.getTime() > now.getTime(), 'the allowance would reset in the past');
    const text = formatResetText(next);
    assert.match(text, /AEDT|AEST/);
    assert.match(text, /\d{1,2}:\d{2}/);
  });
});

describe('the message a blocked caller sees', () => {
  const resetsAt = new Date('2026-07-15T14:00:00.000Z');

  test('the personal ceiling says so, and reports what the team has left', () => {
    const text = limitMessage({ scope: 'user', cap: 150, pool: 300, poolRemainingUnits: 148, resetsAt });
    assert.match(text, /personal brny allowance/);
    assert.match(text, /about 74 more messages today/);
    assert.match(text, /resets at/);
  });

  test('it does not promise teammates anything when the pool is gone too', () => {
    const text = limitMessage({ scope: 'user', cap: 150, pool: 150, poolRemainingUnits: 0, resetsAt });
    assert.match(text, /personal brny allowance/);
    assert.ok(!/team can still send/.test(text), 'a blocked user is told the team has messages when it does not');
  });

  test('an exhausted pool talks about the team, not the person', () => {
    const text = limitMessage({ scope: 'company', cap: 150, pool: 150, poolRemainingUnits: 0, resetsAt });
    assert.match(text, /team's brny allowance/);
    assert.ok(!/personal/.test(text), 'a company-wide cap blames the individual');
  });
});

describe('the figures the usage bars read', () => {
  const base = { companyUnits: 35, userUnits: 35, pool: 150, cap: 200, seats: 2 };

  test('a partly used allowance reports both sides and neither is blocked', () => {
    const s = usageSnapshot(base);
    assert.strictEqual(s.blocked, null);
    assert.strictEqual(s.seats, 2);
    assert.deepStrictEqual(s.user, {
      usedUnits: 35, limitUnits: 200, remainingUnits: 165,
      usedMessages: 17, limitMessages: 100, remainingMessages: 82, percent: 18,
    });
    assert.deepStrictEqual(s.company, {
      usedUnits: 35, limitUnits: 150, remainingUnits: 115,
      usedMessages: 17, limitMessages: 75, remainingMessages: 57, percent: 23,
    });
  });

  test('the percentages are of the units, so a one-unit cap still fills the bar', () => {
    // Converting to messages first would round a 1-unit cap to a permanent 0%
    // and the user would never see their allowance run out.
    const s = usageSnapshot({ companyUnits: 1, userUnits: 1, pool: 150, cap: 1, seats: 1 });
    assert.strictEqual(s.blocked, 'user');
    assert.strictEqual(s.user.limitMessages, 0);
    assert.strictEqual(s.user.percent, 100);
    assert.strictEqual(s.user.remainingUnits, 0);
  });

  test('a personal ceiling does not claim the team is blocked', () => {
    const s = usageSnapshot({ companyUnits: 35, userUnits: 200, pool: 150, cap: 200, seats: 2 });
    assert.strictEqual(s.blocked, 'user');
    assert.strictEqual(s.user.remainingUnits, 0);
    assert.strictEqual(s.company.remainingUnits, 115);
    assert.strictEqual(s.company.remainingMessages, 57);
  });

  test('an exhausted pool is reported as a team block', () => {
    const s = usageSnapshot({ companyUnits: 150, userUnits: 10, pool: 150, cap: 200, seats: 2 });
    assert.strictEqual(s.blocked, 'company');
    assert.strictEqual(s.company.remainingUnits, 0);
    assert.strictEqual(s.company.percent, 100);
    assert.strictEqual(s.user.remainingUnits, 190);
  });

  test('the first call of the day is visible rather than rounding away', () => {
    const s = usageSnapshot({ companyUnits: 1, userUnits: 1, pool: 150, cap: 200, seats: 2 });
    assert.strictEqual(s.user.percent, 1);
  });

  test('an overspent allowance clamps instead of exceeding the bar', () => {
    const s = usageSnapshot({ companyUnits: 900, userUnits: 400, pool: 150, cap: 200, seats: 2 });
    assert.strictEqual(s.user.percent, 100);
    assert.strictEqual(s.company.percent, 100);
  });

  test('missing or nonsensical limits cannot produce NaN', () => {
    // A bar reading "NaN%" is worse than no bar, so an unusable denominator
    // reports 0 used rather than a broken figure.
    const s = usageSnapshot({ companyUnits: 0, userUnits: 0, pool: 0, cap: 0, seats: 0 });
    assert.strictEqual(s.user.percent, 0);
    assert.strictEqual(s.company.percent, 0);
    for (const m of [s.user, s.company]) {
      for (const v of Object.values(m)) assert.ok(Number.isFinite(v), `not a number: ${v}`);
    }
  });

  test('the messages shown alongside the units are whole messages', () => {
    const s = usageSnapshot({ companyUnits: 7, userUnits: 7, pool: 150, cap: 200, seats: 1 });
    assert.strictEqual(s.user.usedUnits, 7);
    assert.strictEqual(s.user.usedMessages, 3);
    assert.strictEqual(s.user.usedMessages, unitsToMessages(7));
  });
});
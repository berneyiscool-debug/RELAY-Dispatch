import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  detectCountry, isCountryAllowed, requiresOptIn, evaluateContributionEligibility, ALLOWED_COUNTRIES,
} from './jurisdiction.js';

// detectCountry uses timezone/locale as a soft fallback. On an AU dev machine
// that fallback returns 'AU', so tests of the "unknown region" path must run
// under a stubbed non-AU environment to be deterministic across machines.
function withNonAuEnv(fn) {
  const origDTF = Intl.DateTimeFormat;
  // Node 21+ exposes a read-only globalThis.navigator (often en-AU on an AU
  // machine), so use defineProperty to override it and restore the descriptor.
  const origNavDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Intl.DateTimeFormat = function () { return { resolvedOptions: () => ({ timeZone: 'America/New_York' }) }; };
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    Intl.DateTimeFormat = origDTF;
    if (origNavDesc) Object.defineProperty(globalThis, 'navigator', origNavDesc);
    else delete globalThis.navigator;
  }
}

describe('jurisdiction: detectCountry', () => {
  test('explicit settings.country wins', () => {
    assert.strictEqual(detectCountry({ country: 'au' }), 'AU');
    assert.strictEqual(detectCountry({ country: 'US', address: '10 Foo St, Sydney NSW 2000' }), 'US');
  });

  test('infers AU from a state + postcode address', () => {
    assert.strictEqual(detectCountry({ address: '100 Fictional Plaza, Dubbo NSW 2830' }), 'AU');
    assert.strictEqual(detectCountry({ address: '5 Beach Rd, Perth WA 6000' }), 'AU');
  });

  test('returns null when region is genuinely unknown', () => {
    withNonAuEnv(() => {
      assert.strictEqual(detectCountry({ address: '742 Evergreen Terrace' }), null);
      assert.strictEqual(detectCountry({}), null);
    });
  });
});

describe('jurisdiction: gates', () => {
  test('AU is allowed, others are not (Phase 1 allowlist)', () => {
    assert.deepStrictEqual(ALLOWED_COUNTRIES, ['AU']);
    assert.ok(isCountryAllowed('AU'));
    assert.ok(!isCountryAllowed('US'));
    assert.ok(!isCountryAllowed(null));
  });

  test('AU does not require opt-in (opt-out default)', () => {
    assert.ok(!requiresOptIn('AU'));
  });

  test('eligibility: eligible AU tenant', () => {
    const e = evaluateContributionEligibility({ address: 'Dubbo NSW 2830' });
    assert.deepStrictEqual(e, { allowed: true, country: 'AU' });
  });

  test('eligibility: unknown region is blocked', () => {
    withNonAuEnv(() => {
      const e = evaluateContributionEligibility({ address: 'somewhere' });
      assert.strictEqual(e.allowed, false);
      assert.strictEqual(e.reason, 'unknown-region');
    });
  });

  test('eligibility: known but non-allowlisted region is blocked', () => {
    const e = evaluateContributionEligibility({ country: 'US' });
    assert.strictEqual(e.allowed, false);
    assert.strictEqual(e.reason, 'region-not-eligible');
    assert.strictEqual(e.country, 'US');
  });
});

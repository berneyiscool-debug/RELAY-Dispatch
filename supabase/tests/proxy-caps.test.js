/**
 * Static guard for the per-tenant spend caps on the paid-API proxies.
 *
 * The caps cannot be exercised end to end without a live project (they need a
 * real JWT, a real tenant and a real DeepSeek/Google call), so this checks the
 * properties whose removal silently re-opens the abuse hole: the cap is read
 * from the environment, the tenant's spend is counted *before* the paid call,
 * and the spend is recorded after it. The ledger kind strings are cross-checked
 * against the CHECK constraint in 031 so the proxies cannot drift from the
 * table they write to.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (relative) => readFileSync(join(DIR, relative), 'utf8');

const MIGRATION = read('../migrations/031_spend_and_signup_hardening.sql');

const PROXIES = [
  // paidCall must be the expression that spends money, not the definition.
  { name: 'relay-copilot', env: 'RELAY_COPILOT_DAILY_CAP', kind: 'copilot', paidCall: 'await fetch(targetUrl' },
  { name: 'relay-geocode', env: 'RELAY_GEOCODE_DAILY_CAP', kind: 'geocode', paidCall: 'await geocodeOne(' },
  { name: 'relay-route', env: 'RELAY_ROUTE_DAILY_CAP', kind: 'route', paidCall: 'await computeRoute(' },
];

const allowedKinds = () => {
  const match = MIGRATION.match(/api_usage_kind_check CHECK \(kind IN \(([^)]*)\)\)/);
  assert.ok(match, 'the api_usage kind constraint moved or was renamed');
  return match[1].split(',').map((k) => k.trim().replace(/'/g, ''));
};

describe('per-tenant spend caps on the paid-API proxies', () => {
  for (const proxy of PROXIES) {
    describe(proxy.name, () => {
      const source = read(`../functions/${proxy.name}/index.ts`);

      test('reads its daily cap from the environment', () => {
        assert.ok(
          source.includes(`Deno.env.get('${proxy.env}')`),
          `${proxy.env} is not read - the cap cannot be tuned per project`
        );
        assert.match(source, /> dailyCap/, 'no comparison against the cap');
      });

      test('refuses with 429 once the cap is reached', () => {
        assert.ok(source.includes('429'), 'a capped tenant does not get a 429');
        assert.ok(/Daily \w+ limit reached/.test(source), 'the 429 has no operator-friendly message');
      });

      test('counts the tenant spend before calling the paid API', () => {
        const capCheck = source.indexOf(`spentToday(admin, profile.company_id, '${proxy.kind}')`);
        assert.notStrictEqual(capCheck, -1, `spend is not counted for kind "${proxy.kind}"`);
        const paidCall = source.indexOf(proxy.paidCall);
        assert.notStrictEqual(paidCall, -1, `the paid call "${proxy.paidCall}" was not found`);
        assert.ok(capCheck < paidCall, 'the paid API is called before the cap is checked');
      });

      test('records the spend once the call succeeds', () => {
        assert.ok(
          source.includes(`recordUsage(admin, profile.company_id, '${proxy.kind}',`),
          `successful calls are not ledgered for kind "${proxy.kind}"`
        );
      });

      test('only touches the ledger through the service role', () => {
        assert.ok(source.includes("from('api_usage')"), 'the ledger is not queried');
        assert.ok(!/from\('api_usage'\)[\s\S]{0,120}anon/.test(source), 'the ledger is read with a client key');
      });

      test('still authenticates the caller first', () => {
        assert.ok(
          source.indexOf('authHeader') < source.indexOf('spentToday('),
          'spend is counted before the caller is authenticated'
        );
      });
    });
  }

  test('every ledger kind is permitted by the migration constraint', () => {
    const allowed = allowedKinds();
    for (const { name, kind } of PROXIES) {
      assert.ok(allowed.includes(kind), `${name} writes kind "${kind}", which 031 rejects`);
    }
  });

  test('the ledger stays service-role only in the migration', () => {
    assert.match(MIGRATION, /ALTER TABLE public\.api_usage ENABLE ROW LEVEL SECURITY/);
    assert.match(MIGRATION, /REVOKE ALL ON public\.api_usage FROM authenticated/);
    assert.match(MIGRATION, /GRANT ALL ON public\.api_usage TO service_role/);
  });

  test('relay-email keeps the daily cap it pioneered', () => {
    const source = read('../functions/relay-email/index.ts');
    assert.ok(source.includes("Deno.env.get('RELAY_EMAIL_DAILY_CAP')"));
    assert.ok(source.includes("from('email_log')"));
    assert.ok(source.includes('429'));
  });
});

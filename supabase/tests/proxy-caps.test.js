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
 * relay-copilot no longer uses the flat per-company cap; its pooled allowance
 * and per-user ceiling have their own suite below, and their real maths is
 * covered by ai-limits.test.js.
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
const LIMITS_MODULE = read('../functions/relay-copilot/limits.js');
const COPILOT = read('../functions/relay-copilot/index.ts');

const PROXIES = [
  // paidCall must be the expression that spends money, not the definition.
  { name: 'relay-geocode', env: 'RELAY_GEOCODE_DAILY_CAP', kind: 'geocode', paidCall: 'await geocodeOne(' },
  { name: 'relay-route', env: 'RELAY_ROUTE_DAILY_CAP', kind: 'route', paidCall: 'await computeRoute(' },
];

const LEDGER_KINDS = ['copilot', 'geocode', 'route'];

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
    for (const kind of LEDGER_KINDS) {
      assert.ok(allowed.includes(kind), `a proxy writes kind "${kind}", which 031 rejects`);
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

describe('relay-copilot pooled allowance and per-user ceiling', () => {
  test('reads its five allowance secrets, and no longer the retired flat cap', () => {
    assert.match(COPILOT, /readLimits\(/, 'the allowance numbers are not read from the environment');
    for (const name of [
      'RELAY_AI_POOL_PER_SEAT',
      'RELAY_AI_POOL_PER_SEAT_PLUS',
      'RELAY_AI_POOL_FLOOR',
      'RELAY_AI_USER_CAP',
      'RELAY_AI_USER_CAP_PLUS',
    ]) {
      assert.ok(LIMITS_MODULE.includes(name), `${name} is not read - the allowance cannot be tuned per project`);
    }
    assert.ok(!COPILOT.includes('RELAY_COPILOT_DAILY_CAP'), 'the retired flat cap is still read');
  });

  test('enforces both the pool and the ceiling', () => {
    assert.match(COPILOT, /poolLimit\(/, 'the company pool is not computed');
    assert.match(COPILOT, /userLimit\(/, 'the per-user ceiling is not computed');
    assert.match(COPILOT, /evaluateLimits\(\{/, 'the allowance is never evaluated');
  });

  test('takes the plan tier from the company row, never from the request', () => {
    assert.match(COPILOT, /from\('companies'\)/, 'the company tier is not read server-side');
    assert.match(COPILOT, /isCloudPlusCompany\(company\)/, 'the tier is not resolved from the company row');
    const requestRead = COPILOT.indexOf('await req.json()');
    const tier = COPILOT.indexOf('isCloudPlusCompany(');
    assert.ok(tier < requestRead, 'the tier is resolved after the caller-supplied body is parsed');
  });

  test("seats come from the subscription, else a live count of the company's seats", () => {
    assert.match(COPILOT, /resolveSeats\(company, activeSeatCount\)/);
    assert.match(COPILOT, /rpc\('company_active_seat_count'/);
  });

  test('refuses with a structured 429 that names the reset instant', () => {
    assert.ok(COPILOT.includes('429'), 'a blocked caller does not get a 429');
    assert.match(COPILOT, /code: 'ai_daily_limit'/, 'the refusal is not machine-readable');
    assert.match(COPILOT, /resetsAt: resetsAt\.toISOString\(\)/, 'the refusal carries no reset instant');
    assert.match(COPILOT, /nextResetUtc\(new Date\(\)\)/, 'the reset is not computed from the local day');
    assert.match(COPILOT, /limitMessage\(\{/, 'the refusal has no user-facing message');
    // A personal block must still say whether the rest of the team is out, so
    // both numbers travel: the scope's own and the shared pool's.
    assert.match(COPILOT, /poolRemainingMessages: unitsToMessages\(verdict\.poolRemainingUnits\)/);
    assert.match(COPILOT, /remainingMessages: unitsToMessages\(/);
  });

  test('counts the allowance before calling the paid API', () => {
    const check = COPILOT.indexOf("usageToday(admin, companyId, 'copilot', startOfDayUtc(new Date()), user.id)");
    assert.notStrictEqual(check, -1, 'the spend is not counted before the paid call');
    const paidCall = COPILOT.indexOf('await fetch(targetUrl');
    assert.notStrictEqual(paidCall, -1, 'the paid call was not found');
    assert.ok(check < paidCall, 'the paid API is called before the allowance is checked');
  });

  test('counts both the company day and the caller\'s own day in one pass', () => {
    assert.match(COPILOT, /startOfDayUtc\(new Date\(\)\)/, 'the window is not the local day');
    assert.match(COPILOT, /companyUnits \+= units/, 'the pool total is never accumulated');
    assert.match(COPILOT, /row\.user_id === userId/, 'the per-user total is never accumulated');
  });

  test('records the spend against the seat that spent it, once the call succeeds', () => {
    assert.match(
      COPILOT,
      /recordUsage\(admin, companyId, 'copilot', 1, user\.id\)/,
      'successful calls are not attributed to the calling seat'
    );
    assert.match(COPILOT, /user_id: userId \|\| null/, 'the ledger row carries no user_id');
  });

  test('a ledger that cannot be read leaves the proxy uncapped, not broken', () => {
    // Migration 034 not applied yet, or a transient read failure: the tenants
    // must keep working, so the allowance check is skipped rather than thrown.
    assert.match(COPILOT, /api_usage read failed:/);
    assert.match(COPILOT, /if \(usage\) \{/, 'a failed ledger read does not skip the allowance check');
  });

  test('only touches the ledger through the service role', () => {
    assert.ok(COPILOT.includes("from('api_usage')"), 'the ledger is not queried');
    assert.ok(!/from\('api_usage'\)[\s\S]{0,120}anon/.test(COPILOT), 'the ledger is read with a client key');
  });

  test('still authenticates the caller first', () => {
    assert.ok(
      COPILOT.indexOf('authHeader') < COPILOT.indexOf('usageToday('),
      'the allowance is counted before the caller is authenticated'
    );
  });

  test('disables DeepSeek thinking mode for the plain-temperature behaviour', () => {
    assert.match(COPILOT, /thinking: \{ type: 'disabled' \}/, 'thinking mode is left to the provider default');
    assert.match(COPILOT, /temperature: 0\.3/, 'the established temperature was changed');
  });
});

describe('relay-copilot usage meters', () => {
  // The branch is sliced out once so every assertion below reads the same
  // region: from the `action` lookup to the refusal that follows it.
  const BRANCH_START = COPILOT.indexOf("searchParams.get('action')");
  const BRANCH_END = COPILOT.indexOf('if (usage) {');
  const BRANCH = BRANCH_START === -1 ? '' : COPILOT.slice(BRANCH_START, BRANCH_END);

  test('is marked by a query parameter, so the request body stays readable', () => {
    assert.notStrictEqual(BRANCH_START, -1, 'the usage action is not recognised');
    assert.match(
      COPILOT,
      /new URL\(req\.url\)\.searchParams\.get\('action'\)/,
      'the action is not read from the query string'
    );
    // A body field would force the stream to be parsed here, and a stream can
    // only be read once - the proxy below still needs it for the prompt.
    assert.ok(
      BRANCH_START < COPILOT.indexOf('await req.json()'),
      'the meters are answered after the request body is consumed'
    );
  });

  test('is answered only to an authenticated caller', () => {
    assert.ok(COPILOT.indexOf('authHeader') < BRANCH_START, 'the meters can be read without a bearer token');
  });

  test('is answered after the allowance read but before the refusal', () => {
    const allowance = COPILOT.indexOf('const usage = await usageToday(');
    assert.notStrictEqual(allowance, -1, 'the allowance is no longer read');
    assert.notStrictEqual(BRANCH_END, -1, 'the refusal was not found');
    assert.ok(allowance < BRANCH_START, 'the meters pre-empt the allowance read');
    // Behind the refusal a blocked seat could not see why it is blocked, or for
    // how long; in front of it, it always can.
    assert.ok(BRANCH_START < BRANCH_END, 'the meters are answered behind the refusal');
  });

  test('spends nothing and writes nothing', () => {
    assert.notStrictEqual(BRANCH, '', 'the usage branch was not found');
    assert.ok(!BRANCH.includes('recordUsage'), 'reading the meters bills the tenant');
    assert.ok(!BRANCH.includes('fetch('), 'reading the meters calls the paid API');
    assert.match(BRANCH, /status: 200/, 'the meters are not a successful read');
  });

  test('reports the same allowances the proxy enforces', () => {
    assert.match(LIMITS_MODULE, /export function usageSnapshot\(/, 'the meter maths is not exported');
    assert.match(COPILOT, /usageSnapshot,/, 'the meter maths is not imported');
    assert.match(BRANCH, /usageSnapshot\(\{/, 'the meters are built some other way');
    assert.match(BRANCH, /pool,\s*cap,\s*seats,/, 'the meters are not given the enforced allowances');
    // Built on evaluateLimits() so a meter can never contradict the 429 that
    // follows it.
    assert.match(
      LIMITS_MODULE,
      /export function usageSnapshot\(\{[\s\S]{0,250}?evaluateLimits\(\{/,
      'the meters no longer share the enforcement arithmetic'
    );
  });

  test('distinguishes an unreadable ledger from an unused allowance', () => {
    // usageToday() returns null when it cannot read the ledger, which also
    // means nothing is being capped - reporting zeroes would claim a fresh
    // allowance the proxy is not actually enforcing.
    assert.match(BRANCH, /available: true/, 'the meters never report success');
    assert.match(BRANCH, /available: false/, 'an unreadable ledger is reported as zero usage');
    assert.match(BRANCH, /reason: 'ledger_unavailable'/, 'the unavailable reply gives no reason');
    assert.match(BRANCH, /resetsAt/, 'the meters carry no reset instant');
  });

  test("returns the caller's own day and an aggregate, never another seat's", () => {
    assert.match(BRANCH, /usage\.userUnits/, "the personal figure is not the caller's own");
    assert.match(BRANCH, /usage\.companyUnits/, 'the company figure is not the day total');
    assert.ok(!BRANCH.includes('user_id'), 'the meters disclose ledger identity');
    assert.ok(!BRANCH.includes('userId'), 'the meters disclose the calling seat');
  });
});

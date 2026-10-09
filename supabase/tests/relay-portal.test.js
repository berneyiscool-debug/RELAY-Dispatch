/**
 * Behavioural tests for relay-portal's decision logic.
 *
 * These rules are the only thing standing between the open internet and a
 * tenant's records, because the resolver runs with the service role: RLS is not
 * going to catch a mistake here. So the tests are written around the ways this
 * could go wrong rather than around the happy path — a token that should not
 * resolve, a PIN that should not verify, a column that should not be writable, and
 * an attempt counter that should not punish a legitimate visitor.
 *
 * The logic lives in supabase/functions/relay-portal/portal.js (plain ESM, no Deno
 * APIs) so it can be exercised here for real.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  GRANT_TTL_MS,
  PIN_ATTEMPT_LIMIT,
  SERVER_OWNED_COLUMNS,
  allowedWriteColumns,
  canInsert,
  canUpdate,
  grantExpiry,
  hashGrant,
  hashPin,
  isForbiddenMutation,
  isHashedPin,
  isPortalKind,
  isWellFormedToken,
  isWritableCollection,
  needsPinUpgrade,
  newGrant,
  normalizePin,
  ownershipRuleFor,
  pinRequirement,
  portalEnabled,
  projectRecord,
  publicRecord,
  publicSettings,
  recordTableFor,
  rejectedColumns,
  relatedPlanFor,
  throttleDecision,
  verifyPin,
} from '../functions/relay-portal/portal.js';

describe('relay-portal token validation', () => {
  test('accepts every token shape that has ever been issued', () => {
    // Current generator: 32 hex characters.
    assert.ok(isWellFormedToken('c_pt_4f2a9c0d1e3b5a7f8c6d2e4b0a1f3c5d'));
    // Legacy generator: base36 + timestamp, so mixed case and digits.
    assert.ok(isWellFormedToken('c_pt_k3j9x2m4p1q7r8s5t0u6v2w4y8z1a3b5c7d9e1f2'));
    // A seed path wrote `c_pt_${custId}`, ids being uuids.
    assert.ok(isWellFormedToken('c_pt_9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f'));
    assert.ok(isWellFormedToken('c_pt_abcdef'));
  });

  test('refuses anything else, so a lookup is never built from junk', () => {
    for (const bad of [
      undefined, null, '', '   ', 'c_pt_ab', // too short to be any issued format
      'a'.repeat(129), // too long
      'c_pt_4f2a9c0d1e3b5a7f8c6d2e4b0a1f3c5d ', // trailing space
      "c_pt_4f2a9c0d1e3b5a7f8c6d2e4b0a1f3c5d'--", // injection-shaped
      'c_pt_4f2a%20', // percent-encoded
      { token: 'c_pt_abcdef' }, ['c_pt_abcdef'], 12345678,
    ]) {
      assert.strictEqual(isWellFormedToken(bad), false, `should reject ${JSON.stringify(bad)}`);
    }
  });

  test('a well-formed token that matches nothing is the lookup\'s job to refuse', () => {
    // This is only a shape pre-filter: it keeps junk out of the query. It is
    // deliberately NOT a validity check, because the formats have drifted and the
    // stored token is the only real proof.
    assert.ok(isWellFormedToken('c_pt_abc'));
    assert.strictEqual(isWellFormedToken('not-a-real-token'), true);
  });
});

describe('relay-portal enablement', () => {
  test('defaults to enabled so a missing setting cannot lock everyone out', () => {
    assert.strictEqual(portalEnabled('customer', undefined), true);
    assert.strictEqual(portalEnabled('customer', {}), true);
    assert.strictEqual(portalEnabled('contractor', { enableCustomerPortal: false }), true);
  });

  test('only an explicit false disables a portal', () => {
    assert.strictEqual(portalEnabled('customer', { enableCustomerPortal: false }), false);
    assert.strictEqual(portalEnabled('contractor', { enableContractorPortal: false }), false);
    // Not `falsy` — 0 and '' are settings the staff app can save, and neither is an
    // instruction to take the portal offline.
    assert.strictEqual(portalEnabled('customer', { enableCustomerPortal: '' }), true);
    assert.strictEqual(portalEnabled('customer', { enableCustomerPortal: 0 }), true);
  });
});

describe('relay-portal PIN', () => {
  test('normalises a PIN to the 4-to-6 digits the setup form promises', () => {
    assert.strictEqual(normalizePin('1234'), '1234');
    assert.strictEqual(normalizePin('123456'), '123456');
    assert.strictEqual(normalizePin(' 1234 '), '1234');
    assert.strictEqual(normalizePin(1234), '1234');
  });

  test('rejects a PIN the form would have rejected', () => {
    for (const bad of ['123', '1234567', 'abcd', '12ab', '', '   ', '-123', '12 34', undefined, null]) {
      assert.strictEqual(normalizePin(bad), null, `should reject ${JSON.stringify(bad)}`);
    }
  });

  test('treats an empty stored value as unclaimed, not as a failed check', () => {
    assert.strictEqual(pinRequirement(null), 'setup');
    assert.strictEqual(pinRequirement(undefined), 'setup');
    assert.strictEqual(pinRequirement(''), 'setup');
    assert.strictEqual(pinRequirement('   '), 'setup');
    assert.strictEqual(pinRequirement('sha256$aa$bb'), 'required');
    assert.strictEqual(pinRequirement('1234'), 'required');
  });

  test('hashes to a salted digest and verifies the same PIN back', async () => {
    const stored = await hashPin('4321');
    assert.match(stored, /^sha256\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    assert.ok(isHashedPin(stored));
    assert.ok(await verifyPin('4321', stored));
    assert.strictEqual(await verifyPin('1234', stored), false);
    assert.strictEqual(await verifyPin('', stored), false);
  });

  test('salts every digest, so the same PIN never stores the same way twice', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    assert.notStrictEqual(a, b);
    // ...and both still verify, which is the point of storing the salt alongside.
    assert.ok(await verifyPin('1234', a));
    assert.ok(await verifyPin('1234', b));
  });

  test('still verifies digests written by the browser and by the old clear-text code', async () => {
    // Exactly the format utils/portalPin.js produces: sha256$salt$digest over
    // `${salt}:${pin}`. A digest minted client-side must verify server-side, or
    // every customer who set a PIN before this change is locked out.
    const salt = 'a'.repeat(32);
    const clientDigest = await hashPinWithSalt(salt, '5150');
    assert.ok(await verifyPin('5150', clientDigest));
    assert.strictEqual(await verifyPin('5151', clientDigest), false);

    // Legacy rows are bare PINs, and are flagged for upgrade on success.
    assert.ok(await verifyPin('9876', '9876'));
    assert.strictEqual(await verifyPin('1234', '9876'), false);
    assert.ok(needsPinUpgrade('9876'));
    assert.strictEqual(needsPinUpgrade(clientDigest), false);
    assert.strictEqual(needsPinUpgrade(null), false);
  });

  test('never verifies against a missing or malformed digest', async () => {
    for (const stored of [null, undefined, '', '   ', 'sha256$', 'sha256$nosalt', 'sha256$aa$', 'bcrypt$x$y', 42]) {
      assert.strictEqual(await verifyPin('1234', stored), false, `should not verify against ${JSON.stringify(stored)}`);
    }
  });
});

describe('relay-portal attempt throttling', () => {
  const now = Date.UTC(2024, 0, 1, 12, 0, 0);
  const failed = (minutesAgo, outcome = 'passcode_fail') => ({
    outcome,
    occurred_at: new Date(now - minutesAgo * 60 * 1000).toISOString(),
  });

  test('lets a visitor keep trying while they are under the limit', () => {
    const decision = throttleDecision([failed(1), failed(2)], now);
    assert.strictEqual(decision.throttled, false);
    assert.strictEqual(decision.attemptsRemaining, PIN_ATTEMPT_LIMIT - 2);
  });

  test('stops a visitor who has burned the limit, and says for how long', () => {
    const decision = throttleDecision(Array.from({ length: PIN_ATTEMPT_LIMIT }, (_, i) => failed(i)), now);
    assert.strictEqual(decision.throttled, true);
    assert.ok(decision.retryAfterSeconds > 0);
    // The window runs from the OLDEST counted failure, so the visitor waits less
    // than the full window once earlier attempts age out.
    assert.ok(decision.retryAfterSeconds <= 15 * 60);
  });

  test('opens up again once the window has passed', () => {
    const stale = Array.from({ length: PIN_ATTEMPT_LIMIT }, () => failed(16));
    const decision = throttleDecision(stale, now);
    assert.strictEqual(decision.throttled, false);
    assert.strictEqual(decision.attemptsRemaining, PIN_ATTEMPT_LIMIT);
  });

  test('does not count a successful visit against the visitor', () => {
    // Only passcode_fail entries count. Otherwise a customer who opens their portal
    // five times would throttle themselves out of their own invoices.
    const successes = Array.from({ length: 20 }, (_, i) => failed(i, 'passcode_ok'));
    const decision = throttleDecision(successes, now);
    assert.strictEqual(decision.throttled, false);
    assert.strictEqual(decision.attemptsRemaining, PIN_ATTEMPT_LIMIT);
  });

  test('ignores malformed log rows instead of crashing on them', () => {
    const decision = throttleDecision([failed(1), null, undefined, { outcome: 'passcode_fail' }], now);
    // Two rows are unreadable/undated; the dated one still counts, and nothing throws.
    assert.strictEqual(decision.throttled, false);
  });
});

describe('relay-portal record projection', () => {
  const row = {
    id: 'cust-1',
    company_id: 'co-1',
    first_name: 'Ada',
    portal_token: 'c_pt_deadbeefdeadbeef',
    portal_passcode: 'sha256$aa$bb',
    portal_last_accessed: '2024-01-01T00:00:00Z',
  };

  test('strips the PIN digest and the token from anything sent back', () => {
    const out = projectRecord(row);
    assert.strictEqual(out.portal_passcode, undefined);
    assert.strictEqual(out.portal_token, undefined);
    // Everything the portal actually renders survives.
    assert.strictEqual(out.id, 'cust-1');
    assert.strictEqual(out.first_name, 'Ada');
    assert.strictEqual(out.portal_last_accessed, '2024-01-01T00:00:00Z');
  });

  test('does not mutate the row it was handed', () => {
    projectRecord(row);
    assert.strictEqual(row.portal_passcode, 'sha256$aa$bb');
  });

  test('tolerates a missing record', () => {
    assert.strictEqual(projectRecord(null), null);
    assert.strictEqual(projectRecord(undefined), null);
  });
});

describe('relay-portal settings projection', () => {
  // A stand-in for a real company row: the keys below are exactly the ones the live
  // database carries today, so this doubles as a completeness check on the allow-list.
  const liveKeys = [
    '_connect', '_subscription', 'abn', 'address', 'ai', 'documentTheme', 'domain',
    'email', 'jobTypes', 'laborRates', 'laborRounding', 'logo', 'logoSmall',
    'markupPercent', 'materialCategories', 'materialMarkup', 'name', 'payments',
    'phone', 'rateMappings', 'supplierCategories', 'taxEnabled', 'taxRate', 'website',
  ];
  const company = {
    name: 'Acme Electrical',
    abn: '12345678901',
    phone: '555-0100',
    email: 'office@acme.test',
    address: '1 Main St',
    website: 'acme.test',
    domain: 'acme.test',
    logo: 'data:image/png;base64,AAA',
    logoSmall: 'data:image/png;base64,BBB',
    taxEnabled: true,
    taxRate: 10,
    markupPercent: 20,
    materialMarkup: { defaultPercent: 15, useTiers: false },
    laborRates: [{ id: 'lr-1', label: 'Standard', rate: 120 }],
    laborRounding: 'nearest15',
    rateMappings: { supplier: {}, customer: {} },
    jobTypes: [{ id: 'jt-1', label: 'Install' }],
    materialCategories: ['Cable'],
    supplierCategories: ['Wholesale'],
    documentTheme: { preset: 'clean', accentColor: '#0af' },
    enableCustomerPortal: true,
    enableContractorPortal: false,
    customerPortalWelcome: 'Welcome aboard',
    customerPortalPayment: 'Pay here',
    payments: { currency: 'aud', enabledFor: { invoice: true } },
    _connect: { accountId: 'acct_123', chargesEnabled: true, detailsSubmitted: true },
    // The reason this projection exists. A placeholder, not the real tenant key —
    // this file is committed, and the live value must never be written down here.
    ai: {
      apiKey: 'sk-test-placeholder-not-a-real-key',
      endpoint: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      systemPrompt: 'You are RELAY.',
    },
    _subscription: { plan: 'pro', status: 'active', stripeCustomerId: 'cus_123' },
  };

  test('never ships the AI provider key', () => {
    const out = publicSettings(company);
    assert.strictEqual(out.ai, undefined);
    // Belt and braces: nothing anywhere in the payload may carry the key.
    assert.ok(!JSON.stringify(out).includes('sk-test-placeholder-not-a-real-key'));
  });

  test('never ships billing internals', () => {
    const out = publicSettings(company);
    assert.strictEqual(out._subscription, undefined);
  });

  test('keeps every non-secret key the live blob carries', () => {
    const out = publicSettings(company);
    const withheld = liveKeys.filter((key) => !(key in out));
    assert.deepStrictEqual(new Set(withheld), new Set(['ai', '_subscription']));
  });

  test('keeps what a portal renders from', () => {
    const out = publicSettings(company);
    assert.strictEqual(out.name, 'Acme Electrical');
    assert.strictEqual(out.logo, company.logo);
    assert.strictEqual(out.domain, 'acme.test');
    assert.strictEqual(out.customerPortalWelcome, 'Welcome aboard');
    assert.strictEqual(out.taxRate, 10);
    assert.deepStrictEqual(out.jobTypes, company.jobTypes);
    // The pay button reads both of these; neither is a credential.
    assert.deepStrictEqual(out.payments, company.payments);
    assert.strictEqual(out._connect.chargesEnabled, true);
  });

  test('fails closed on a settings key nobody has reviewed yet', () => {
    const out = publicSettings({ ...company, sendgridApiKey: 'SG.live.secret' });
    assert.strictEqual(out.sendgridApiKey, undefined);
  });

  test('keeps an explicit null, so the client default cannot override it', () => {
    const out = publicSettings({ name: 'Acme', enableCustomerPortal: null });
    assert.ok('enableCustomerPortal' in out);
    assert.strictEqual(out.enableCustomerPortal, null);
    // ...while a key that was never set stays absent.
    assert.ok(!('enableContractorPortal' in out));
  });

  test('does not mutate the blob it was handed', () => {
    publicSettings(company);
    assert.strictEqual(company.ai.apiKey, 'sk-test-placeholder-not-a-real-key');
  });

  test('tolerates a missing or malformed blob', () => {
    assert.deepStrictEqual(publicSettings(null), {});
    assert.deepStrictEqual(publicSettings(undefined), {});
    assert.deepStrictEqual(publicSettings('nope'), {});
    assert.deepStrictEqual(publicSettings({}), {});
  });
});

describe('relay-portal related reads', () => {
  test('scopes a customer to their own rows, and never a Draft quote', () => {
    const plan = relatedPlanFor('customer');
    const byKey = Object.fromEntries(plan.map((p) => [p.key, p]));
    assert.deepStrictEqual(Object.keys(byKey).sort(), ['assets', 'invoices', 'jobs', 'maintenancePlans', 'quotes']);

    for (const key of ['jobs', 'quotes', 'invoices', 'assets']) {
      assert.strictEqual(byKey[key].column, 'customer_id');
      assert.strictEqual(byKey[key].from, 'recordId');
    }
    // A Draft quote is internal until it is sent; the portal has always hidden it.
    assert.deepStrictEqual(byKey.quotes.exclude, { column: 'status', equals: 'Draft' });
    // Only the customer's own assets, not supplier-owned equipment.
    assert.deepStrictEqual(byKey.assets.require, { column: 'owner_type', equals: 'Customer' });
    // Plans hang off those assets, so the filter is by asset id.
    assert.strictEqual(byKey.maintenancePlans.column, 'asset_id');
    assert.strictEqual(byKey.maintenancePlans.from, 'assetIds');
  });

  test('scopes a contractor to jobs they are assigned to, and nothing else', () => {
    const plan = relatedPlanFor('contractor');
    assert.strictEqual(plan.length, 1);
    assert.strictEqual(plan[0].key, 'jobs');
    // No customers, no invoices, no other contractors: a contractor works on jobs,
    // and the whole company's customer list is not theirs to read.
    assert.strictEqual(plan[0].via, 'contractor_task_assignment');
  });
});

describe('relay-portal write rules', () => {
  test('knows which table belongs to which kind', () => {
    assert.strictEqual(recordTableFor('customer'), 'customers');
    assert.strictEqual(recordTableFor('contractor'), 'contractors');
    assert.strictEqual(isPortalKind('customer'), true);
    assert.strictEqual(isPortalKind('contractor'), true);
    assert.strictEqual(isPortalKind('staff'), false);
    assert.strictEqual(isPortalKind(undefined), false);
  });

  test('closes collections the portals have no business writing', () => {
    // The whole escalation surface, in one place.
    assert.strictEqual(isWritableCollection('customer', 'contractors'), false);
    assert.strictEqual(isWritableCollection('customer', 'invoices'), false);
    assert.strictEqual(isWritableCollection('customer', 'assets'), false);
    assert.strictEqual(isWritableCollection('customer', 'maintenance_plans'), false);
    assert.strictEqual(isWritableCollection('contractor', 'invoices'), false);
    assert.strictEqual(isWritableCollection('contractor', 'quotes'), false);
    assert.strictEqual(isWritableCollection('contractor', 'assets'), false);
    assert.strictEqual(isWritableCollection('customer', 'companies'), false);
    assert.strictEqual(isWritableCollection('customer', 'profiles'), false);

    assert.strictEqual(isWritableCollection('customer', 'quotes'), true);
    assert.strictEqual(isWritableCollection('contractor', 'jobs'), true);
  });

  test('refuses columns that would let a visitor promote themselves', () => {
    const cases = [
      // A contractor setting their own pay rate is the clearest escalation there is.
      ['contractor', 'contractors', { hourly_rate: 500 }],
      ['contractor', 'contractors', { after_hours_rate: 999, callout_fee: 999 }],
      // Nobody re-scopes a row to another tenant or another customer.
      ['customer', 'jobs', { company_id: 'other' }],
      ['contractor', 'jobs', { company_id: 'other' }],
      ['customer', 'jobs', { customer_id: 'someone-else' }],
      ['customer', 'jobs', { id: 'rekeyed' }],
      // Nobody re-points a link at a different token.
      ['customer', 'customers', { portal_token: 'c_pt_mine' }],
      ['contractor', 'contractors', { portal_token: 'c_pt_mine' }],
      // Job money is the office's business.
      ['contractor', 'jobs', { labor_cost: 0, material_cost: 0 }],
    ];
    for (const [kind, collection, payload] of cases) {
      assert.notDeepStrictEqual(
        rejectedColumns(kind, collection, payload), [],
        `${kind} should not be able to write ${JSON.stringify(payload)} to ${collection}`
      );
    }
  });

  test('allows exactly the columns the portals actually change', () => {
    // updated_at rides along on every update because store.js stamps it, so a
    // one-field edit arrives as a two-column payload.
    assert.deepStrictEqual(allowedWriteColumns('customer', 'jobs'), ['notes', 'updated_at']);
    assert.deepStrictEqual(allowedWriteColumns('customer', 'quotes'), ['status', 'line_items', 'updated_at']);
    assert.deepStrictEqual(
      allowedWriteColumns('contractor', 'jobs'),
      ['tasks', 'notes', 'status', 'updated_at']
    );
    assert.deepStrictEqual(
      allowedWriteColumns('contractor', 'contractors'),
      ['portal_passcode', 'portal_last_accessed', 'compliance_docs', 'updated_at']
    );
    // Nothing carries company_id or created_by, whatever the collection.
    for (const kind of ['customer', 'contractor']) {
      for (const collection of ['customers', 'contractors', 'jobs', 'quotes', 'notifications']) {
        for (const mode of ['update', 'insert']) {
          for (const owned of SERVER_OWNED_COLUMNS) {
            assert.ok(
              !allowedWriteColumns(kind, collection, mode).includes(owned),
              `${kind}/${collection}/${mode} must not carry ${owned}`
            );
          }
        }
      }
    }
  });

  test('only lets a portal create rows where a portal really creates rows', () => {
    // A customer portal never makes jobs, quotes or customers.
    assert.strictEqual(canInsert('customer', 'jobs'), false);
    assert.strictEqual(canInsert('customer', 'quotes'), false);
    assert.strictEqual(canInsert('customer', 'customers'), false);
    assert.strictEqual(canInsert('customer', 'notifications'), true);
    // A contractor portal creates the B2B dispatch job, and the office customer
    // behind it.
    assert.strictEqual(canInsert('contractor', 'jobs'), true);
    assert.strictEqual(canInsert('contractor', 'customers'), true);
    assert.strictEqual(canInsert('contractor', 'contractors'), false);
  });

  test('keeps money and staff assignment out of a contractor-created job', () => {
    const insert = allowedWriteColumns('contractor', 'jobs', 'insert');
    // The job is created FROM one of the office's jobs, so it carries the copy of the
    // cost it was handed — but nobody attends it and nothing bills against it yet.
    for (const forbidden of ['technician_id', 'technician_name', 'quote_id', 'asset_id', 'company_id', 'created_by']) {
      assert.ok(!insert.includes(forbidden), `insert must not allow ${forbidden}`);
    }
    for (const needed of ['id', 'number', 'title', 'status', 'customer_id', 'customer_name',
      'notes', 'tasks', 'labor_cost', 'material_cost', 'estimated_hours', 'scheduled_date']) {
      assert.ok(insert.includes(needed), `insert must allow ${needed}`);
    }
    // An update is the narrow set: money already on the job is the office's to change.
    assert.deepStrictEqual(
      rejectedColumns('contractor', 'jobs', { labor_cost: 0, title: 'x', material_cost: 0 }),
      ['labor_cost', 'title', 'material_cost']
    );
  });

  test('rejects only the offending columns, so a valid payload passes', () => {
    assert.deepStrictEqual(
      rejectedColumns('customer', 'jobs', { notes: '__meta__:{}', customer_id: 'x' }),
      ['customer_id']
    );
    assert.deepStrictEqual(rejectedColumns('customer', 'jobs', { notes: '__meta__:{}' }), []);
    assert.deepStrictEqual(rejectedColumns('customer', 'jobs', undefined), []);
  });

  test('splits insert and update, so a column a portal may set is not a column it may rewrite', () => {
    // A portal that may not insert at all accepts nothing, whatever the mode asks for:
    // the columns that exist for the customer's own row are the two the PIN flow sets,
    // and a customer never creates one.
    assert.deepStrictEqual(allowedWriteColumns('customer', 'customers', 'insert'), []);
    assert.strictEqual(canInsert('customer', 'customers'), false);
    assert.deepStrictEqual(allowedWriteColumns('customer', 'jobs', 'insert'), []);
    assert.deepStrictEqual(allowedWriteColumns('customer', 'quotes', 'insert'), []);
    assert.deepStrictEqual(allowedWriteColumns('customer', 'notifications', 'insert').length > 0, true);
    // A notification is raised, never edited afterwards.
    assert.deepStrictEqual(allowedWriteColumns('customer', 'notifications', 'update'), []);

    // The contractor's job is the other way round: the import sets the whole row, and
    // the later edits are the narrow set. A job created from the office's copy keeps
    // the cost it was handed but cannot have it rewritten afterwards.
    const created = {
      id: 'job_b2b_1', number: 'J-00001', title: '[B2B Dispatch] J-00011 - Cable tray',
      customer_id: 'cust_1', customer_name: 'Apex Power Services', contact_name: 'Operations Staff',
      site_address: '9 Depot Rd', type: 'Electrical', status: 'Pending', priority: 'Medium',
      scheduled_date: '2026-02-01', estimated_hours: 4, labor_cost: 480, material_cost: 120,
      tasks: [], notes: 'Imported.', created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    assert.deepStrictEqual(rejectedColumns('contractor', 'jobs', created, 'insert'), []);
    // `id` is on the insert list only: the row is created with the id the page minted,
    // and an existing row is never re-identified by an update.
    assert.deepStrictEqual(
      rejectedColumns('contractor', 'jobs', created, 'update'),
      ['id', 'number', 'title', 'customer_id', 'customer_name', 'contact_name', 'site_address',
        'type', 'priority', 'scheduled_date', 'estimated_hours', 'labor_cost', 'material_cost',
        'created_at']
    );
    // The office customer the import creates carries exactly the identity columns, and
    // no way to change itself afterwards.
    assert.deepStrictEqual(allowedWriteColumns('contractor', 'customers', 'update'), []);
    assert.deepStrictEqual(
      rejectedColumns('contractor', 'customers',
        { id: 'cust_1', company: 'Apex', first_name: 'Operations', last_name: 'Staff', portal_token: 'c_pt_x' },
        'insert'),
      ['portal_token']
    );
  });

  test('says how each kind of row proves ownership', () => {
    assert.strictEqual(ownershipRuleFor('customer', 'customers'), 'self');
    assert.strictEqual(ownershipRuleFor('customer', 'jobs'), 'customer');
    assert.strictEqual(ownershipRuleFor('customer', 'quotes'), 'customer');
    assert.strictEqual(ownershipRuleFor('customer', 'notifications'), 'insert');
    assert.strictEqual(ownershipRuleFor('contractor', 'contractors'), 'self');
    // A contractor's jobs are proven by the task walk, not by a column.
    assert.strictEqual(ownershipRuleFor('contractor', 'jobs'), 'contractor');
    assert.strictEqual(ownershipRuleFor('contractor', 'customers'), 'insert');
    // Anything unmapped must be refused rather than defaulted.
    assert.strictEqual(ownershipRuleFor('customer', 'invoices'), null);
  });

  test('an unmapped collection can never be written', () => {
    // Defence in depth: the allow-list and the collection list have to agree, or a
    // collection could be reachable by one rule and empty by the other.
    for (const kind of ['customer', 'contractor']) {
      for (const collection of ['invoices', 'assets', 'maintenance_plans', 'companies', 'profiles', 'timesheets']) {
        assert.strictEqual(isWritableCollection(kind, collection), false);
        assert.deepStrictEqual(allowedWriteColumns(kind, collection, 'update'), []);
        assert.strictEqual(canUpdate(kind, collection), false);
        assert.strictEqual(canInsert(kind, collection), false);
        // Every collection that CAN be written must have a real update or insert surface.
      }
      for (const collection of ['customers', 'contractors', 'jobs', 'quotes', 'notifications']) {
        if (!isWritableCollection(kind, collection)) continue;
        assert.ok(
          canUpdate(kind, collection) || canInsert(kind, collection),
          `${kind}/${collection} is listed as writable but has no writable columns`
        );
      }
    }
  });

  test('a locked visitor learns only who the link is for', () => {
    const row = {
      id: 'cust_1', company: 'Acme Pty Ltd', first_name: 'Jo', last_name: 'Bloggs',
      email: 'jo@acme.test', phone: '0400000000', site_address: '1 Main St',
      portal_token: 'c_pt_abc', portal_passcode: 'sha256$aa$bb', notes: 'internal only',
    };
    assert.deepStrictEqual(publicRecord(row), {
      id: 'cust_1', company: 'Acme Pty Ltd', first_name: 'Jo', last_name: 'Bloggs',
    });
    // Fields the record does not have are absent, not null.
    assert.deepStrictEqual(Object.keys(publicRecord({ id: 'c1', company: 'X' })), ['id', 'company']);
  });

  test('a locked contractor learns only who the link is for', () => {
    // A contractor record identifies itself differently, and both lock screens name
    // the party, so the same projection has to carry `name` as well as `company`.
    const row = {
      id: 'con_1', name: 'Sparky Co', contact_name: 'Sam Sparks',
      email: 'sam@sparky.test', phone: '0400000001', hourly_rate: 120,
      portal_token: 'c_pt_abc', portal_passcode: 'sha256$aa$bb',
    };
    assert.deepStrictEqual(publicRecord(row), {
      id: 'con_1', name: 'Sparky Co', contact_name: 'Sam Sparks',
    });
  });

  test('a locked visitor is never handed the PIN or the token', () => {
    const projected = projectRecord({
      id: 'c1', company: 'X', portal_passcode: 'sha256$aa$bb', portal_token: 'c_pt_abc',
    });
    assert.ok(!('portal_passcode' in projected));
    assert.ok(!('portal_token' in projected));
    assert.strictEqual(projected.company, 'X');
  });

  test('will not let a portal clear its own PIN', () => {
    // Clearing the passcode would re-open the first-visitor-wins setup path to
    // whoever holds the link next. A staff-side reset flows through the store, not
    // through here, so nothing legitimate is blocked.
    assert.strictEqual(isForbiddenMutation('customer', 'customers', { portal_passcode: '' }), true);
    assert.strictEqual(isForbiddenMutation('customer', 'customers', { portal_passcode: '   ' }), true);
    assert.strictEqual(isForbiddenMutation('contractor', 'contractors', { portal_passcode: null }), true);
    // Changing it is exactly what the portal does.
    assert.strictEqual(isForbiddenMutation('customer', 'customers', { portal_passcode: 'sha256$aa$bb' }), false);
    assert.strictEqual(isForbiddenMutation('customer', 'customers', { portal_last_accessed: 'now' }), false);
    // Unrelated collections are not this rule's business.
    assert.strictEqual(isForbiddenMutation('customer', 'jobs', { portal_passcode: '' }), false);
  });
});

describe('relay-portal grants', () => {
  test('mints an unguessable grant each time', () => {
    const grants = new Set();
    for (let i = 0; i < 50; i++) {
      const grant = newGrant();
      assert.match(grant, /^[0-9a-f]{64}$/);
      grants.add(grant);
    }
    assert.strictEqual(grants.size, 50);
  });

  test('stores only a digest, so a leaked table cannot be replayed', async () => {
    const grant = newGrant();
    const hash = await hashGrant(grant);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.notStrictEqual(hash, grant);
    // Stable, because the lookup is by digest.
    assert.strictEqual(await hashGrant(grant), hash);
  });

  test('expires in the configured window', () => {
    const now = Date.UTC(2024, 0, 1, 0, 0, 0);
    assert.strictEqual(grantExpiry(now), new Date(now + GRANT_TTL_MS).toISOString());
    assert.strictEqual(new Date(grantExpiry(now)).getTime() - now, 12 * 60 * 60 * 1000);
  });
});

// Reproduces utils/portalPin.js's digest exactly, so the cross-format guarantee is
// tested against the real client algorithm rather than a guess at it.
async function hashPinWithSalt(saltHex, pin) {
  const data = new TextEncoder().encode(`${saltHex}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256$${saltHex}$${hex}`;
}

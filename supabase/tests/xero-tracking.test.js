/**
 * Cost centers as Xero tracking options: every cost center lands on an option
 * of the same name, created in Xero when missing, matched to Xero's own
 * spelling, renamed when the cost center is, and never forced past Xero's
 * limits or a read-only connection.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { XeroError } from '../functions/_xero/client.js';
import {
  DEFAULT_TRACKING_CATEGORY, MAX_OPTIONS, canEditTracking, desiredTracking, ensureTracking, trackingCollisions,
} from '../functions/_xero/tracking.js';

/** A Xero organisation's tracking, with the four endpoints RELAY uses. */
function fakeXero(categories = []) {
  const state = structuredClone(categories);
  const calls = [];
  let seq = 0;
  const catById = (id) => state.find((c) => c.TrackingCategoryID === id);
  const routes = [
    [/^GET \/TrackingCategories$/, () => ({ TrackingCategories: structuredClone(state) })],
    [/^PUT \/TrackingCategories$/, ({ body }) => {
      const made = { TrackingCategoryID: `cat-${++seq}`, Name: body.Name, Status: 'ACTIVE', Options: [] };
      state.push(made);
      return { TrackingCategories: [structuredClone(made)] };
    }],
    [/^PUT \/TrackingCategories\/([^/]+)\/Options$/, ({ body }, [, catId]) => {
      const cat = catById(catId);
      if (cat.Options.some((o) => o.Name.toLowerCase() === body.Name.toLowerCase())) throw new XeroError('validation', 'Option already exists');
      const made = { TrackingOptionID: `opt-${++seq}`, Name: body.Name, Status: 'ACTIVE' };
      cat.Options.push(made);
      return { Options: [structuredClone(made)] };
    }],
    [/^POST \/TrackingCategories\/([^/]+)\/Options\/([^/]+)$/, ({ body }, [, catId, optId]) => {
      const opt = catById(catId).Options.find((o) => o.TrackingOptionID === optId);
      Object.assign(opt, body);
      return { Options: [structuredClone(opt)] };
    }],
  ];
  return {
    state,
    calls,
    writes: () => calls.filter((c) => c.method !== 'GET'),
    request: async (method, path, options = {}) => {
      calls.push({ method, path, ...options });
      for (const [re, handler] of routes) {
        const m = re.exec(`${method} ${path}`);
        if (m) return { status: 200, data: handler(options, m.map(decodeURIComponent)) };
      }
      throw new Error(`Unexpected Xero call ${method} ${path}`);
    },
  };
}

const cc = (id, name, extra = {}) => ({ id, name, ...extra });
const division = (options, extra = {}) => ({
  TrackingCategoryID: 'cat-div', Name: 'Division', Status: 'ACTIVE',
  Options: options.map(([TrackingOptionID, Name, Status = 'ACTIVE']) => ({ TrackingOptionID, Name, Status })), ...extra,
});

describe('which tracking a cost center wants', () => {
  test('its own name, in the company category or "Cost Center"', () => {
    assert.deepEqual(desiredTracking(cc('a', '  Electrical   Services ')), { category: DEFAULT_TRACKING_CATEGORY, option: 'Electrical Services', source: 'auto' });
    assert.deepEqual(desiredTracking(cc('a', 'Plumbing'), { trackingCategoryName: 'Division' }), { category: 'Division', option: 'Plumbing', source: 'auto' });
  });

  test('a named option overrides; a category with no option (old default) does not', () => {
    assert.deepEqual(
      desiredTracking(cc('a', 'Plumbing', { xero_tracking_category_name: 'Region', xero_tracking_option_name: 'North' }), { trackingCategoryName: 'Division' }),
      { category: 'Region', option: 'North', source: 'override' },
    );
    assert.equal(desiredTracking(cc('a', 'Plumbing', { xero_tracking_category_name: 'Department' })).option, 'Plumbing');
    assert.equal(desiredTracking(cc('a', 'Plumbing', { xero_tracking_option_name: 'North' }), { trackingCategoryName: 'Division' }).category, 'Division');
  });

  test('switched off, or nothing to name it by, means no tracking', () => {
    assert.equal(desiredTracking(cc('a', 'Plumbing'), { trackCostCenters: false }), null);
    assert.equal(desiredTracking(cc('a', '   ')), null);
    assert.equal(desiredTracking(null), null);
  });

  test('names are capped at Xero\'s 100 characters', () => {
    assert.equal(desiredTracking(cc('a', 'x'.repeat(140))).option.length, 100);
  });

  test('names that only differ in case or spacing are flagged: Xero sees one option', () => {
    assert.deepEqual(trackingCollisions([cc('a', 'Plumbing'), cc('b', 'plumbing '), cc('c', 'Electrical')]), [['a', 'b']]);
  });

  test('only a connection granted accounting.settings can create tracking', () => {
    assert.equal(canEditTracking('openid accounting.invoices accounting.settings'), true);
    assert.equal(canEditTracking('openid accounting.settings.read'), false);
    assert.equal(canEditTracking(null), false);
  });
});

describe('making it exist in Xero', () => {
  test('creates the category and one option per cost center, reading Xero once', async () => {
    const xero = fakeXero();
    const cache = {};
    const first = await ensureTracking({ xero, costCenters: [cc('a', 'Plumbing'), cc('b', 'Electrical')], canEdit: true, cache });
    const again = await ensureTracking({ xero, costCenters: [cc('a', 'Plumbing')], canEdit: true, cache });

    assert.deepEqual(first.get('a'), { tracking: [{ Name: 'Cost Center', Option: 'Plumbing' }], optionId: first.get('a').optionId, action: 'created' });
    assert.equal(first.get('b').action, 'created');
    assert.equal(again.get('a').action, 'matched');
    assert.deepEqual(xero.state.map((c) => [c.Name, c.Options.map((o) => o.Name)]), [['Cost Center', ['Plumbing', 'Electrical']]]);
    assert.equal(xero.calls.filter((c) => c.method === 'GET').length, 1);
    assert.deepEqual(xero.calls[0].query, { includeArchived: true });
  });

  test('matches existing tracking whatever the case, and uses Xero\'s spelling', async () => {
    const xero = fakeXero([division([['o-1', 'PLUMBING']])]);
    const out = await ensureTracking({ xero, costCenters: [cc('a', 'plumbing')], settings: { trackingCategoryName: 'division' }, canEdit: true });
    assert.deepEqual(out.get('a'), { tracking: [{ Name: 'Division', Option: 'PLUMBING' }], optionId: 'o-1', action: 'matched' });
    assert.deepEqual(xero.writes(), []);
  });

  test('a read-only connection matches what exists and reports the rest, writing nothing', async () => {
    const xero = fakeXero([division([['o-1', 'Plumbing']])]);
    const out = await ensureTracking({
      xero, costCenters: [cc('a', 'Plumbing'), cc('b', 'Electrical')], settings: { trackingCategoryName: 'Division' }, canEdit: false,
    });
    assert.equal(out.get('a').action, 'matched');
    assert.equal(out.get('b').action, 'problem');
    assert.match(out.get('b').message, /Reconnect Xero/);
    assert.deepEqual(xero.writes(), []);

    const none = await ensureTracking({ xero: fakeXero(), costCenters: [cc('a', 'Plumbing')], canEdit: false });
    assert.match(none.get('a').message, /no "Cost Center" tracking category/);
  });

  test('never adds a third active category', async () => {
    const xero = fakeXero([division([]), { TrackingCategoryID: 'cat-reg', Name: 'Region', Status: 'ACTIVE', Options: [] }]);
    const out = await ensureTracking({ xero, costCenters: [cc('a', 'Plumbing')], canEdit: true });
    assert.equal(out.get('a').action, 'problem');
    assert.match(out.get('a').message, /two active tracking categories/);
    assert.deepEqual(xero.writes(), []);
  });

  test('stops at Xero\'s 100 options', async () => {
    const full = Array.from({ length: MAX_OPTIONS }, (_, i) => [`o-${i}`, `Option ${i}`]);
    const xero = fakeXero([division(full)]);
    const out = await ensureTracking({ xero, costCenters: [cc('a', 'Plumbing')], settings: { trackingCategoryName: 'Division' }, canEdit: true });
    assert.match(out.get('a').message, /100 options/);
    assert.deepEqual(xero.writes(), []);
  });

  test('a renamed cost center renames its Xero option instead of starting another', async () => {
    const xero = fakeXero([division([['o-1', 'Plumbing']])]);
    const out = await ensureTracking({
      xero, costCenters: [cc('a', 'Plumbing & Gas', { xero_tracking_option_id: 'o-1' })], settings: { trackingCategoryName: 'Division' }, canEdit: true,
    });
    assert.deepEqual(out.get('a'), { tracking: [{ Name: 'Division', Option: 'Plumbing & Gas' }], optionId: 'o-1', action: 'renamed' });
    assert.deepEqual(xero.state[0].Options.map((o) => o.Name), ['Plumbing & Gas']);
  });

  test('renamed onto a name Xero already has: uses that option, renames nothing', async () => {
    const xero = fakeXero([division([['o-1', 'Plumbing'], ['o-2', 'Gas']])]);
    const out = await ensureTracking({
      xero, costCenters: [cc('a', 'Gas', { xero_tracking_option_id: 'o-1' })], settings: { trackingCategoryName: 'Division' }, canEdit: true,
    });
    assert.equal(out.get('a').optionId, 'o-2');
    assert.deepEqual(xero.writes(), []);
  });

  test('brings back an archived option rather than failing on a duplicate name', async () => {
    const xero = fakeXero([division([['o-1', 'Plumbing', 'ARCHIVED']])]);
    const out = await ensureTracking({ xero, costCenters: [cc('a', 'Plumbing')], settings: { trackingCategoryName: 'Division' }, canEdit: true });
    assert.equal(out.get('a').action, 'restored');
    assert.equal(xero.state[0].Options[0].Status, 'ACTIVE');
  });

  test('an archived category is reported, not reused or duplicated', async () => {
    const xero = fakeXero([division([['o-1', 'Plumbing']], { Status: 'ARCHIVED' })]);
    const out = await ensureTracking({ xero, costCenters: [cc('a', 'Plumbing')], settings: { trackingCategoryName: 'Division' }, canEdit: true });
    assert.match(out.get('a').message, /archived in Xero/);
    assert.deepEqual(xero.writes(), []);
  });

  test('an override points at another category\'s option; off cost centers cost no calls', async () => {
    const xero = fakeXero([division([['o-1', 'North']], { Name: 'Region', TrackingCategoryID: 'cat-reg' })]);
    const out = await ensureTracking({
      xero, costCenters: [cc('a', 'Plumbing', { xero_tracking_category_name: 'Region', xero_tracking_option_name: 'North' })], canEdit: true,
    });
    assert.deepEqual(out.get('a').tracking, [{ Name: 'Region', Option: 'North' }]);

    const quiet = fakeXero();
    const off = await ensureTracking({ xero: quiet, costCenters: [cc('a', 'Plumbing')], settings: { trackCostCenters: false }, canEdit: true });
    assert.equal(off.get('a').action, 'off');
    assert.equal(quiet.calls.length, 0);
  });
});

// ============================================
// RELAY — COST CENTERS AS XERO TRACKING
// ============================================
// Every RELAY cost center is a tracking option in one Xero tracking category
// ("Cost Center" unless the company picks another), with the same name. RELAY
// creates whatever is missing in Xero, follows a cost center rename, and uses
// Xero's own spelling once matched, so a company that already sorts its jobs by
// cost center gets the same split in Xero without setting anything up.
//
// A cost center can still point at a specific existing option instead (the
// override fields), for organisations whose tracking predates RELAY.
//
// Xero allows two active tracking categories, each with up to 100 options, and
// names of up to 100 characters. Creating and renaming needs the
// accounting.settings scope; a read-only connection can only match.
//
// Plain ESM; Xero is injected (tested by supabase/tests/xero-tracking.test.js).

export const DEFAULT_TRACKING_CATEGORY = 'Cost Center';
export const MAX_ACTIVE_CATEGORIES = 2;
export const MAX_OPTIONS = 100;
export const SETTINGS_WRITE_SCOPE = 'accounting.settings';

/** Xero trims and caps names; compare the way Xero does (case-insensitive). */
export const trackingName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 100);
const sameName = (a, b) => trackingName(a).toLowerCase() === trackingName(b).toLowerCase();

/** Can this connection create and rename tracking? `scopes` is the space-separated grant. */
export function canEditTracking(scopes) {
  return String(scopes || '').split(/\s+/).includes(SETTINGS_WRITE_SCOPE);
}

export function trackingCategoryName(settings = {}) {
  return trackingName(settings?.trackingCategoryName) || DEFAULT_TRACKING_CATEGORY;
}

/**
 * The tracking RELAY wants on a cost center's lines, or null for none.
 * @param {object} costCenter  cost_centers row (snake_case)
 * @param {object} settings    companies.settings.xero
 * @returns {{ category: string, option: string, source: 'override'|'auto' }|null}
 */
export function desiredTracking(costCenter, settings = {}) {
  if (!costCenter) return null;
  const override = trackingName(costCenter.xero_tracking_option_name);
  if (override) {
    return {
      category: trackingName(costCenter.xero_tracking_category_name) || trackingCategoryName(settings),
      option: override,
      source: 'override',
    };
  }
  if (settings?.trackCostCenters === false) return null;
  const option = trackingName(costCenter.name);
  return option ? { category: trackingCategoryName(settings), option, source: 'auto' } : null;
}

/** The invoice-line Tracking array for a desired tracking. */
export const lineTracking = (want) => (want ? [{ Name: want.category, Option: want.option }] : undefined);

/**
 * Cost centers that would land on the same Xero option (names that differ only
 * in case or spacing). Xero can't tell them apart, so Settings warns about them.
 * @returns {Array<string[]>} groups of cost center ids
 */
export function trackingCollisions(costCenters, settings = {}) {
  const groups = new Map();
  for (const cc of costCenters || []) {
    const want = desiredTracking(cc, settings);
    if (!want) continue;
    const key = `${want.category.toLowerCase()}\u0000${want.option.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(String(cc.id));
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
}

async function loadCategories(xero, cache) {
  if (!cache.categories) {
    const { data } = await xero.request('GET', '/TrackingCategories', { query: { includeArchived: true } });
    cache.categories = (data?.TrackingCategories || [])
      .filter((c) => c && c.Status !== 'DELETED')
      .map((c) => ({ ...c, Options: (c.Options || []).filter((o) => o && o.Status !== 'DELETED') }));
  }
  return cache.categories;
}

const isActive = (x) => (x.Status || 'ACTIVE') === 'ACTIVE';

/**
 * Make sure every cost center's tracking exists, active, in Xero.
 *
 * @param {object} deps
 * @param {{ request: Function }} deps.xero
 * @param {Array}   deps.costCenters  cost_centers rows to resolve
 * @param {object}  [deps.settings]   companies.settings.xero
 * @param {boolean} [deps.canEdit]    the connection may create and rename tracking
 * @param {object}  [deps.cache]      reused across calls in one run (one GET per company)
 * @returns {Promise<Map<string, { tracking?: Array, optionId?: string, action: string, message?: string }>>}
 *   per cost center id. action: matched | created | renamed | restored | off | problem
 */
export async function ensureTracking({ xero, costCenters, settings = {}, canEdit = false, cache = {} }) {
  const results = new Map();
  const wants = [];
  for (const cc of costCenters || []) {
    const want = desiredTracking(cc, settings);
    if (want) wants.push({ cc, want });
    else results.set(String(cc.id), { action: 'off' });
  }
  if (!wants.length) return results;

  const categories = await loadCategories(xero, cache);
  const problem = (cc, message) => results.set(String(cc.id), { action: 'problem', message });

  for (const { cc, want } of wants) {
    // The category: matched by name, created when allowed and there's room.
    let category = categories.find((c) => sameName(c.Name, want.category) && isActive(c))
      || categories.find((c) => sameName(c.Name, want.category));
    if (!category) {
      if (!canEdit) {
        problem(cc, `There's no "${want.category}" tracking category in Xero. Reconnect Xero so RELAY can create it, or add it in Xero.`);
        continue;
      }
      if (categories.filter(isActive).length >= MAX_ACTIVE_CATEGORIES) {
        problem(cc, `Xero allows two active tracking categories and both are in use. Use one of them for cost centers in Settings → Accounting & Xero.`);
        continue;
      }
      const { data } = await xero.request('PUT', '/TrackingCategories', { body: { Name: want.category } });
      const made = data?.TrackingCategories?.[0];
      if (!made?.TrackingCategoryID) throw new Error('Xero did not return a TrackingCategoryID');
      category = { ...made, Name: made.Name || want.category, Status: made.Status || 'ACTIVE', Options: [] };
      categories.push(category);
    }
    if (!isActive(category)) {
      problem(cc, `The "${category.Name}" tracking category is archived in Xero. Restore it there to tag lines.`);
      continue;
    }

    const options = category.Options;
    const byName = options.find((o) => sameName(o.Name, want.option));
    const byId = cc.xero_tracking_option_id ? options.find((o) => o.TrackingOptionID === cc.xero_tracking_option_id) : null;
    let option = byName;
    let action = 'matched';

    // A cost center RELAY already linked was renamed: rename its option in Xero,
    // so past and future invoices stay together under one option.
    if (!option && byId && want.source === 'auto' && canEdit) {
      const { data } = await xero.request('POST', `/TrackingCategories/${encodeURIComponent(category.TrackingCategoryID)}/Options/${encodeURIComponent(byId.TrackingOptionID)}`, {
        body: { Name: want.option },
      });
      byId.Name = data?.Options?.[0]?.Name || want.option;
      option = byId;
      action = 'renamed';
    }

    if (!option) {
      if (!canEdit) {
        problem(cc, `"${want.option}" isn't an option under "${category.Name}" in Xero yet. Reconnect Xero so RELAY can add it, or add it in Xero.`);
        continue;
      }
      if (options.filter(isActive).length >= MAX_OPTIONS) {
        problem(cc, `"${category.Name}" already has ${MAX_OPTIONS} options, Xero's limit. Archive some in Xero to add "${want.option}".`);
        continue;
      }
      const { data } = await xero.request('PUT', `/TrackingCategories/${encodeURIComponent(category.TrackingCategoryID)}/Options`, {
        body: { Name: want.option },
      });
      const made = data?.Options?.[0];
      if (!made?.TrackingOptionID) throw new Error('Xero did not return a TrackingOptionID');
      option = { ...made, Name: made.Name || want.option, Status: made.Status || 'ACTIVE' };
      options.push(option);
      action = 'created';
    }

    if (!isActive(option)) {
      if (!canEdit) {
        problem(cc, `"${option.Name}" is archived in Xero. Restore it there, or reconnect Xero so RELAY can.`);
        continue;
      }
      try {
        await xero.request('POST', `/TrackingCategories/${encodeURIComponent(category.TrackingCategoryID)}/Options/${encodeURIComponent(option.TrackingOptionID)}`, {
          body: { Name: option.Name, Status: 'ACTIVE' },
        });
        option.Status = 'ACTIVE';
        action = 'restored';
      } catch (err) {
        if (err?.kind !== 'validation') throw err;
        problem(cc, `"${option.Name}" is archived in Xero. Restore it there to tag lines.`);
        continue;
      }
    }

    // Xero's spelling, so the line matches the option exactly.
    results.set(String(cc.id), {
      tracking: [{ Name: category.Name, Option: option.Name }],
      optionId: option.TrackingOptionID,
      action,
    });
  }
  return results;
}

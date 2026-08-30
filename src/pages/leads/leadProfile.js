// ============================================
// RELAY — LEAD MARKET PROFILE (shared)
// ============================================
// The trades & services you cover, plus your base location, used to match
// leads from the RELAY Leads marketplace. Rendered in Settings → Company
// Profile (and formerly on the Market tab). Cloud accounts persist to the
// shared `contractor_profile` table (which the market feed reads to match
// leads); local accounts store the profile in company settings so it survives
// reloads without a backend.

import { supabase } from '../../utils/supabase.js';
import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { geocodeAddress } from '../../utils/geocode.js';
import { attachAddressAutocomplete } from '../../utils/placesAutocomplete.js';
import { showToast } from '../../components/Notifications.js';

// Local fallback list used when the cloud `lead-categories` function is
// unavailable (offline/local). Each entry matches the shape the market uses:
// { id, label, group, subs: [{ id, label }] }.
const DEFAULT_TRADES = [
  {
    id: 'electrical', label: 'Electrical', group: 'Electrical',
    subs: [
      { id: 'power', label: 'Power outlets & lighting' },
      { id: 'switchboard', label: 'Switchboard & safety switches' },
      { id: 'evc', label: 'EV chargers' },
      { id: 'appliances', label: 'Appliance installation' },
    ],
  },
  {
    id: 'plumbing', label: 'Plumbing', group: 'Plumbing',
    subs: [
      { id: 'hot-water', label: 'Hot water systems' },
      { id: 'blocked-drains', label: 'Blocked drains' },
      { id: 'taps-toilets', label: 'Taps & toilets' },
      { id: 'gas-fitting', label: 'Gas fitting' },
    ],
  },
  {
    id: 'hvac', label: 'Heating & Cooling', group: 'Heating & Cooling',
    subs: [
      { id: 'ac-install', label: 'Air conditioning install' },
      { id: 'ac-repair', label: 'Air conditioning repair' },
      { id: 'heating-service', label: 'Heating service' },
    ],
  },
  {
    id: 'maintenance', label: 'Maintenance', group: 'Maintenance',
    subs: [
      { id: 'handyman', label: 'Handyman' },
      { id: 'painting', label: 'Painting' },
      { id: 'carpentry', label: 'Carpentry' },
    ],
  },
];

let categoriesCache = null;
let labelMap = {};

export const isCloud = () => !!(store.companyId && !String(store.companyId).startsWith('acct_'));

export async function loadCategories() {
  if (categoriesCache) return categoriesCache;
  try {
    const { data, error } = await supabase.functions.invoke('lead-categories', {});
    if (!error && Array.isArray(data?.categories) && data.categories.length) {
      categoriesCache = data.categories;
    }
  } catch (_) { /* categories unavailable — fall back to defaults */ }
  if (!categoriesCache) categoriesCache = DEFAULT_TRADES;
  labelMap = {};
  for (const t of categoriesCache) labelMap[t.id] = t.label;
  return categoriesCache;
}

export function groupCategories(categories) {
  const groups = [];
  const byGroup = new Map();
  for (const t of categories) {
    const g = t.group || 'Other';
    if (!byGroup.has(g)) {
      const entry = { group: g, trades: [] };
      byGroup.set(g, entry);
      groups.push(entry);
    }
    byGroup.get(g).trades.push(t);
  }
  return groups;
}

export async function loadLeadProfile() {
  if (isCloud()) {
    const { data } = await supabase.from('contractor_profile').select('*').maybeSingle();
    return data || null;
  }
  return store.getSettings().leadMarketProfile || null;
}

export async function saveLeadProfile(profile) {
  if (isCloud()) {
    const { error } = await supabase.from('contractor_profile').upsert({
      company_id: store.companyId,
      trades: profile.trades,
      sub_trades: profile.sub_trades,
      service_geo: profile.service_geo,
      service_radius_km: profile.service_radius_km ?? 50,
      notify_enabled: profile.notify_enabled ?? true,
    });
    return { error };
  }

  const settings = store.getSettings();
  settings.leadMarketProfile = profile;
  await store.saveSettings(settings);
  return { error: null };
}

export async function renderLeadProfileSetup(container, opts = {}) {
  const { onSaved } = opts || {};
  container.innerHTML = '<div class="text-secondary" style="padding:12px; font-size:13px;">Loading trades &amp; services…</div>';

  let categories;
  try { categories = await loadCategories(); } catch (_) { categories = []; }
  const groups = groupCategories(categories);

  let current = {};
  try { current = (await loadLeadProfile()) || {}; } catch (_) { current = {}; }
  const currentTrades = current.trades || [];
  const currentSubTrades = current.sub_trades || {};

  container.innerHTML = `
    <div style="max-width:680px;">
      <p style="color:var(--text-secondary); margin:0 0 16px;">Choose the trades you do, then tick the specific services within each. Leave a trade's services blank to receive everything under it. Leads are matched by distance from your base location.</p>

      <div class="form-group">
        <label class="form-label">Trades & services you cover</label>
        <div id="lead-profile-trades">
          ${groups.map((g) => `
            <div class="market-group">
              <h4 class="market-group-title">${escapeHTML(g.group)}</h4>
              <div class="market-group-trades">
                ${g.trades.map((t) => {
                  const checked = currentTrades.includes(t.id);
                  const picked = currentSubTrades[t.id] || [];
                  const subs = t.subs || [];
                  return `
                  <div class="market-trade ${checked ? 'active' : ''}" data-trade="${t.id}">
                    <label class="market-trade-head">
                      <input type="checkbox" class="market-trade-check" value="${t.id}" ${checked ? 'checked' : ''} />
                      <span>${escapeHTML(t.label)}</span>
                    </label>
                    ${subs.length ? `
                      <div class="market-subs ${checked ? '' : 'hidden'}">
                        ${subs.map((s) => `
                          <label class="market-sub">
                            <input type="checkbox" class="market-sub-check" data-trade="${t.id}" value="${s.id}" ${picked.includes(s.id) ? 'checked' : ''} />
                            <span>${escapeHTML(s.label)}</span>
                          </label>`).join('')}
                        <span class="market-subs-hint">${picked.length ? '' : 'Blank = all services under this trade'}</span>
                      </div>` : ''}
                  </div>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Your base location</label>
        <input type="text" id="lead-profile-address" class="form-input" placeholder="e.g. 20 Enterprise Way, Sunshine West VIC 3020"
          value="${escapeHTML(current.service_geo?.formattedAddress || '')}" />
        <p style="color:var(--text-tertiary); font-size:12px; margin:6px 0 0;">Leads are matched by distance from this location. On a Cloud account, coordinates are resolved automatically.</p>
      </div>

      <p id="lead-profile-error" style="color:var(--color-danger); display:none;"></p>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button class="btn btn-primary" id="btn-lead-profile-save">Save Lead Profile</button>
      </div>
    </div>
  `;

  // Toggle a trade: show/hide its subs, clear subs when unticked.
  container.querySelectorAll('.market-trade-check').forEach((check) => {
    check.addEventListener('change', () => {
      const tradeEl = check.closest('.market-trade');
      const subsEl = tradeEl.querySelector('.market-subs');
      tradeEl.classList.toggle('active', check.checked);
      if (subsEl) {
        subsEl.classList.toggle('hidden', !check.checked);
        if (!check.checked) {
          subsEl.querySelectorAll('.market-sub-check').forEach((s) => { s.checked = false; });
        }
      }
    });
  });

  // Ticking any sub implies the parent trade is covered.
  container.querySelectorAll('.market-sub-check').forEach((sub) => {
    sub.addEventListener('change', () => {
      const tradeEl = sub.closest('.market-trade');
      tradeEl.classList.toggle('active', true);
      tradeEl.querySelector('.market-trade-check').checked = true;
    });
  });

  let geo = current.service_geo || null;
  const addrInput = container.querySelector('#lead-profile-address');
  attachAddressAutocomplete(addrInput, { onSelect: (r) => { geo = r.geo; } });
  addrInput.addEventListener('input', () => { geo = null; });

  container.querySelector('#btn-lead-profile-save').addEventListener('click', async () => {
    const errEl = container.querySelector('#lead-profile-error');
    errEl.style.display = 'none';
    const trades = [...container.querySelectorAll('.market-trade-check:checked')].map((el) => el.value);
    if (!trades.length) { errEl.textContent = 'Choose at least one trade.'; errEl.style.display = 'block'; return; }

    // Only record specific subs; an empty list means "whole trade".
    const subTrades = {};
    container.querySelectorAll('.market-sub-check:checked').forEach((el) => {
      const t = el.dataset.trade;
      if (trades.includes(t)) (subTrades[t] = subTrades[t] || []).push(el.value);
    });

    const addr = addrInput.value.trim();
    if (!geo && addr) {
      geo = await geocodeAddress(addr);
      if (!geo) {
        if (isCloud()) {
          errEl.textContent = 'Could not geocode that address — check it and try again.';
          errEl.style.display = 'block';
          return;
        }
        geo = { lat: null, lng: null, formattedAddress: addr };
      }
    }
    if (!geo) {
      errEl.textContent = 'Enter your base location.';
      errEl.style.display = 'block';
      return;
    }

    const profile = {
      trades,
      sub_trades: subTrades,
      service_geo: { lat: geo.lat, lng: geo.lng, formattedAddress: geo.formattedAddress || addr },
      service_radius_km: current.service_radius_km ?? 50,
      notify_enabled: current.notify_enabled ?? true,
    };

    const { error } = await saveLeadProfile(profile);
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return; }

    showToast('Lead profile saved', 'success');
    if (onSaved) onSaved(profile);
  });
}

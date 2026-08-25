// ============================================
// RELAY — LEADS MARKET TAB (cloud-only)
// ============================================
// The "Market" tab of the Leads page. Buy leads from the RELAY Leads
// marketplace: set trades + base location, browse matched leads with a
// global countdown, claim ($10 standard / $20 emergency via Stripe), and
// reveal customer details after payment clears.
//
// Talks to the shared Supabase project's lead-feed / lead-claim /
// lead-detail / lead-call / lead-contact edge functions (see the
// RELAY-Leads repo, supabase/functions/).

import { supabase } from '../../utils/supabase.js';
import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { geocodeAddress } from '../../utils/geocode.js';
import { attachAddressAutocomplete } from '../../utils/placesAutocomplete.js';

// The trade -> sub-selection tree is served by the shared project's
// `lead-categories` function (single source of truth, same list customers
// pick from). Cached per session.
let categoriesCache = null;
let labelMap = {};

async function loadCategories() {
  if (categoriesCache) return categoriesCache;
  try {
    const { data, error } = await supabase.functions.invoke('lead-categories', {});
    if (!error && Array.isArray(data?.categories) && data.categories.length) {
      categoriesCache = data.categories;
    }
  } catch (_) { /* categories unavailable */ }
  if (!categoriesCache) categoriesCache = [];
  labelMap = {};
  for (const t of categoriesCache) labelMap[t.id] = t.label;
  return categoriesCache;
}

function groupCategories(categories) {
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

const isCloud = () => !!(store.companyId && !String(store.companyId).startsWith('acct_'));

const URGENCY_LABEL = { emergency: 'Emergency', urgent: 'Urgent', standard: 'Standard', planned: 'Planned' };
const URGENCY_COLOR = { emergency: 'var(--color-danger)', urgent: 'var(--color-warning)', standard: 'var(--color-info)', planned: 'var(--text-secondary)' };

function tradeLabel(id) {
  return labelMap[id] || id;
}

function fmtCountdown(ms) {
  if (ms <= 0) return null;
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function fnErrorText(error) {
  if (!error) return 'Something went wrong.';
  try {
    if (error.context && typeof error.context.text === 'function') {
      const body = await error.context.text();
      if (body) {
        try { const j = JSON.parse(body); return j.error || j.message || body; } catch { return body.slice(0, 200); }
      }
    }
  } catch (_) { /* fall through */ }
  return error.message || String(error);
}

export async function renderLeadsMarket(container) {
  if (!isCloud()) {
    container.innerHTML = `
      <div style="max-width:640px; margin:0 auto; padding:24px; text-align:center;">
        <span class="material-icons-outlined" style="font-size:40px; color:var(--text-tertiary);">storefront</span>
        <h2 style="margin:12px 0 6px;">Lead Market</h2>
        <p style="color:var(--text-secondary); margin:0;">Buy verified jobs from the RELAY Leads marketplace. The Market is a Cloud feature — upgrade to a Cloud account to start claiming leads.</p>
      </div>
    `;
    return;
  }

  // Returning from Stripe after paying for a lead?
  const hash = window.location.hash || '';
  const paidParam = hash.match(/[?&]paid=1/);
  if (paidParam) {
    const leadId = (hash.match(/[?&]lead=([^&]+)/) || [])[1];
    if (leadId) { await renderLead(container, leadId, { confirmPayment: true }); return; }
  }

  await loadCategories();

  const { data: cp, error } = await supabase.from('contractor_profile').select('*').maybeSingle();
  if (error) {
    container.innerHTML = `<p style="color:var(--color-danger); padding:24px;">Could not load your lead profile: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!cp || !cp.service_geo || !(cp.trades || []).length) {
    renderSetup(container, cp);
    return;
  }

  await renderFeed(container);
}

// ── Setup ───────────────────────────────────────────────────────────────
async function renderSetup(container, existing) {
  const categories = await loadCategories();
  const groups = groupCategories(categories);
  const current = existing || { trades: [], service_geo: null, sub_trades: {} };
  const currentSubTrades = current.sub_trades || {};

  container.innerHTML = `
    <div style="max-width:680px; margin:0 auto;">
      <h2 style="margin:0 0 4px;">Set up your lead profile</h2>
      <p style="color:var(--text-secondary); margin:0 0 20px;">Choose the trades you do, then tick the specific services within each. Leave a trade's services blank to receive everything under it.</p>
      <div class="form-group">
        <label class="form-label">Trades & services you cover</label>
        <div id="market-trades">
          ${groups.map((g) => `
            <div class="market-group">
              <h4 class="market-group-title">${escapeHTML(g.group)}</h4>
              <div class="market-group-trades">
                ${g.trades.map((t) => {
                  const checked = current.trades?.includes(t.id);
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
        <input type="text" id="market-base-address" class="form-input" placeholder="e.g. 20 Enterprise Way, Sunshine West VIC 3020"
          value="${escapeHTML(current.service_geo?.formattedAddress || '')}" />
        <p style="color:var(--text-tertiary); font-size:12px; margin:6px 0 0;">Leads are matched by distance from this location.</p>
      </div>
      <p id="market-setup-error" style="color:var(--color-danger); display:none;"></p>
      <div style="display:flex; gap:8px; margin-top:16px;">
        <button class="btn btn-primary" id="btn-market-save">Save</button>
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
  const addrInput = container.querySelector('#market-base-address');
  attachAddressAutocomplete(addrInput, { onSelect: (r) => { geo = r.geo; } });
  addrInput.addEventListener('input', () => { geo = null; });

  container.querySelector('#btn-market-save').addEventListener('click', async () => {
    const errEl = container.querySelector('#market-setup-error');
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
    if (!geo) {
      if (!addr) { errEl.textContent = 'Enter your base location.'; errEl.style.display = 'block'; return; }
      geo = await geocodeAddress(addr);
      if (!geo) { errEl.textContent = 'Could not geocode that address — check it and try again.'; errEl.style.display = 'block'; return; }
    }

    const { error } = await supabase.from('contractor_profile').upsert({
      company_id: store.companyId,
      trades,
      sub_trades: subTrades,
      service_geo: { lat: geo.lat, lng: geo.lng, formattedAddress: geo.formattedAddress || addr },
      service_radius_km: 50,
      notify_enabled: true,
    });
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return; }

    const { showToast } = await import('../../components/Notifications.js');
    showToast('Lead profile saved', 'success');
    renderLeadsMarket(container);
  });
}

// ── Feed ────────────────────────────────────────────────────────────────
async function renderFeed(container) {
  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
      <p id="market-sub" style="color:var(--text-secondary); margin:0;">Loading matched leads…</p>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-sm" id="btn-market-refresh" style="height:25px; font-size:11px;">Refresh</button>
        <button class="btn btn-sm" id="btn-market-edit" style="height:25px; font-size:11px;">Edit profile</button>
      </div>
    </div>
    <div id="market-list"></div>
  `;

  container.querySelector('#btn-market-refresh').addEventListener('click', () => renderFeed(container));
  container.querySelector('#btn-market-edit').addEventListener('click', () => {
    supabase.from('contractor_profile').select('*').maybeSingle().then(({ data }) => renderSetup(container, data));
  });

  const listEl = container.querySelector('#market-list');
  const subEl = container.querySelector('#market-sub');

  const { data, error } = await supabase.functions.invoke('lead-feed', {});
  if (error) {
    const msg = await fnErrorText(error);
    if (msg.toLowerCase().includes('set up')) {
      const { data: cp } = await supabase.from('contractor_profile').select('*').maybeSingle();
      renderSetup(container, cp);
      return;
    }
    listEl.innerHTML = `<p style="color:var(--color-danger);">${escapeHTML(msg)}</p>`;
    return;
  }

  const leads = data?.leads || [];
  subEl.textContent = leads.length
    ? `${leads.length} lead${leads.length === 1 ? '' : 's'} matched your trades and area.`
    : 'No leads right now — new jobs are matched the moment they\'re vetted.';

  if (!leads.length) {
    listEl.innerHTML = `<div style="padding:32px; text-align:center; color:var(--text-tertiary);">
      <span class="material-icons-outlined" style="font-size:36px;">search_off</span>
      <p style="margin:10px 0 0;">Nothing matched yet. Check back soon.</p>
    </div>`;
    return;
  }

  listEl.innerHTML = leads.map((l) => marketCard(l)).join('');
  listEl.querySelectorAll('.market-card').forEach((el) => {
    el.addEventListener('click', () => renderLead(container, el.dataset.leadId));
  });
  listEl.querySelectorAll('[data-open-at]').forEach(bindCountdown);
}

function marketCard(l) {
  const open = Date.now() >= new Date(l.openAt).getTime();
  return `
    <div class="market-card" data-lead-id="${escapeHTML(l.id)}" style="cursor:pointer; border:1px solid var(--border-color, #ddd); border-radius:8px; padding:14px 16px; margin-bottom:10px; background:var(--card-bg, #fff);">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
        <span class="badge" style="background:${URGENCY_COLOR[l.urgency] || 'var(--text-secondary)'}; color:#fff;">${escapeHTML(URGENCY_LABEL[l.urgency] || l.urgency)}</span>
        <span style="color:var(--text-tertiary); font-size:12px;">${l.distanceKm} km</span>
      </div>
      <div style="font-weight:600; font-size:14px;">${escapeHTML(tradeLabel(l.trade))}</div>
      <div style="color:var(--text-tertiary); font-size:12px; margin-bottom:6px;">${escapeHTML(l.area)}</div>
      <div style="color:var(--text-secondary); font-size:13px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${escapeHTML(l.description)}</div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
        <span class="market-count ${open ? 'open' : ''}" data-open-at="${escapeHTML(l.openAt)}" style="font-size:12px; font-weight:600; ${open ? 'color:var(--color-primary);' : 'color:var(--text-tertiary);'}">${open ? 'Claim now' : ''}</span>
        <span style="font-weight:700;">$${l.priceAUD}</span>
      </div>
    </div>
  `;
}

function bindCountdown(el) {
  const openAt = new Date(el.dataset.openAt).getTime();
  const tick = setInterval(() => {
    const remain = openAt - Date.now();
    if (remain <= 0) {
      clearInterval(tick);
      el.textContent = 'Claim now';
      el.classList.add('open');
      el.style.color = 'var(--color-primary)';
    } else {
      el.textContent = `Opens in ${fmtCountdown(remain)}`;
    }
  }, 250);
}

// ── Lead detail + claim + reveal ────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function renderLead(container, leadId, opts = {}) {
  container.innerHTML = `<p style="color:var(--text-secondary); padding:24px;">Loading…</p>`;

  const { data: detail } = await supabase.functions.invoke('lead-detail', { leadId });
  if (detail?.lead) { renderReveal(container, detail.lead); return; }

  if (opts.confirmPayment) {
    for (let i = 0; i < 15; i++) {
      await sleep(2000);
      const { data: d2 } = await supabase.functions.invoke('lead-detail', { leadId });
      if (d2?.lead) { renderReveal(container, d2.lead); return; }
    }
    container.innerHTML = `
      <div style="max-width:560px; margin:0 auto; padding:24px; text-align:center;">
        <h2 style="margin:0 0 8px;">Confirming your payment…</h2>
        <p style="color:var(--text-secondary); margin:0 0 16px;">Your payment may still be processing. It usually takes a few seconds.</p>
        <button class="btn btn-primary" onclick="location.reload()">Check again</button>
      </div>`;
    return;
  }

  const { data: feed } = await supabase.functions.invoke('lead-feed', {});
  const lead = (feed?.leads || []).find((l) => l.id === leadId);

  if (!lead) {
    container.innerHTML = `
      <div style="max-width:560px; margin:0 auto; padding:24px; text-align:center;">
        <h2 style="margin:0 0 8px;">Lead unavailable</h2>
        <p style="color:var(--text-secondary); margin:0 0 16px;">This lead has either been filled, closed, or is outside your area.</p>
        <button class="btn btn-primary" id="btn-market-back">Back to Market</button>
      </div>`;
    container.querySelector('#btn-market-back').addEventListener('click', () => renderFeed(container));
    return;
  }

  const now = Date.now();
  const openAt = new Date(lead.openAt).getTime();
  const open = now >= openAt;

  container.innerHTML = `
    <div style="max-width:640px; margin:0 auto;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span class="badge" style="background:${URGENCY_COLOR[lead.urgency] || 'var(--text-secondary)'}; color:#fff;">${escapeHTML(URGENCY_LABEL[lead.urgency] || lead.urgency)}</span>
        <span style="color:var(--text-tertiary); font-size:12px;">${lead.distanceKm} km</span>
      </div>
      <h2 style="margin:0 0 4px;">${escapeHTML(tradeLabel(lead.trade))} · ${escapeHTML(lead.area)}</h2>
      <p style="color:var(--text-secondary); white-space:pre-wrap; line-height:1.6; margin:8px 0 16px;">${escapeHTML(lead.description)}</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
        <div style="flex:1; min-width:140px; border:1px solid var(--border-color,#ddd); border-radius:8px; padding:12px;">
          <div style="font-size:12px; color:var(--text-tertiary);">Price</div>
          <div style="font-weight:700;">$${lead.priceAUD}</div>
        </div>
        <div style="flex:1; min-width:140px; border:1px solid var(--border-color,#ddd); border-radius:8px; padding:12px;">
          <div style="font-size:12px; color:var(--text-tertiary);">Slots</div>
          <div style="font-weight:700;">${lead.filledSlots} of ${lead.slotsTotal} taken</div>
        </div>
        <div style="flex:1; min-width:160px; border:1px solid var(--border-color,#ddd); border-radius:8px; padding:12px;">
          <div style="font-size:12px; color:var(--text-tertiary);" id="countdown-label">${open ? 'Open now' : 'Opens in'}</div>
          <div style="font-weight:700;" id="countdown-value">${open ? 'Claim quickly' : fmtCountdown(openAt - now)}</div>
        </div>
      </div>
      <p style="color:var(--text-tertiary); font-size:12px;">Customer name and contact details are revealed after payment clears.</p>
      <p id="claim-error" style="color:var(--color-danger); display:none;"></p>
      <div style="display:flex; gap:8px; margin-top:16px;">
        <button class="btn" id="btn-lead-back">Back</button>
        <button class="btn btn-primary" id="btn-claim" ${open ? '' : 'disabled'}>Claim for $${lead.priceAUD}</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-lead-back').addEventListener('click', () => renderFeed(container));

  const labelEl = container.querySelector('#countdown-label');
  const valEl = container.querySelector('#countdown-value');
  const claimBtn = container.querySelector('#btn-claim');
  const tick = setInterval(() => {
    const remain = new Date(lead.openAt).getTime() - Date.now();
    if (remain <= 0) {
      clearInterval(tick);
      labelEl.textContent = 'Open now';
      valEl.textContent = 'Claim quickly';
      claimBtn.disabled = false;
    } else {
      labelEl.textContent = 'Opens in';
      valEl.textContent = fmtCountdown(remain);
    }
  }, 250);

  claimBtn.addEventListener('click', async () => {
    const errEl = container.querySelector('#claim-error');
    errEl.style.display = 'none';
    claimBtn.disabled = true;
    claimBtn.textContent = 'Claiming…';

    // Payment is billed by the Dispatch app, not here — claiming reserves
    // the slot and releases details immediately.
    const { data, error } = await supabase.functions.invoke('lead-claim', { leadId });

    if (error) {
      claimBtn.disabled = false;
      claimBtn.textContent = `Claim for $${lead.priceAUD}`;
      errEl.textContent = await fnErrorText(error);
      errEl.style.display = 'block';
      return;
    }

    const { data: detail } = await supabase.functions.invoke('lead-detail', { leadId });
    if (detail?.lead) {
      renderReveal(container, detail.lead);
    } else {
      const { showToast } = await import('../../components/Notifications.js');
      showToast('Lead claimed', 'success');
      renderFeed(container);
    }
  });
}

// ── Reveal (paid) ───────────────────────────────────────────────────────
function renderReveal(container, lead) {
  const c = lead.customer;
  container.innerHTML = `
    <div style="max-width:640px; margin:0 auto;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <span class="material-icons-outlined" style="color:var(--color-success); font-size:28px;">check_circle</span>
        <div>
          <h2 style="margin:0;">You claimed this lead</h2>
          <span style="color:var(--text-secondary); font-size:13px;">${escapeHTML(tradeLabel(lead.trade))} · ${escapeHTML(URGENCY_LABEL[lead.urgency] || lead.urgency)}</span>
        </div>
      </div>
      <div style="border:1px solid var(--border-color,#ddd); border-radius:8px; overflow:hidden; margin-bottom:16px;">
        ${revealRow('Customer', c.name)}
        ${revealRow('Phone', `<a href="tel:${escapeHTML(c.phone)}">${escapeHTML(c.phone)}</a>`)}
        ${revealRow('Email', `<a href="mailto:${escapeHTML(c.email)}">${escapeHTML(c.email)}</a>`)}
        ${revealRow('Address', c.address)}
        <div style="padding:12px 14px; border-top:1px solid var(--border-color,#ddd);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px;">Job</div>
          <div style="color:var(--text-secondary); white-space:pre-wrap; line-height:1.6;">${escapeHTML(lead.description)}</div>
        </div>
      </div>
      <p id="contact-note" style="color:var(--text-tertiary); font-size:12px; margin:0 0 14px;">${contactNote(lead)}</p>
      <p id="contact-error" style="color:var(--color-danger); display:none;"></p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-primary" id="btn-call-customer"><span class="material-icons-outlined" style="font-size:16px;">call</span> Call customer</button>
        <button class="btn" id="btn-log-attempt">Log attempt (no answer)</button>
        <button class="btn" id="btn-market-done" style="margin-left:auto;">Done</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-market-done').addEventListener('click', () => renderFeed(container));

  const logAttempt = async (answered) => {
    const errEl = container.querySelector('#contact-error');
    errEl.style.display = 'none';
    const { data, error } = await supabase.functions.invoke('lead-contact', { leadId: lead.id, answered });
    if (error) {
      errEl.textContent = await fnErrorText(error);
      errEl.style.display = 'block';
      return;
    }
    if (data?.refunded) {
      const { showToast } = await import('../../components/Notifications.js');
      showToast('Three attempts reached — this lead was returned and refunded.', 'success');
      renderFeed(container);
      return;
    }
    const { showToast } = await import('../../components/Notifications.js');
    showToast('Contact attempt logged', 'success');
    renderReveal(container, { ...lead, contactAttempts: (lead.contactAttempts || 0) + 1 });
  };

  container.querySelector('#btn-call-customer').addEventListener('click', async () => {
    const { data, error } = await supabase.functions.invoke('lead-call', { leadId: lead.id });
    const number = (!error && data?.number) ? data.number : c.phone;
    window.location.href = `tel:${number}`;
    await logAttempt(true);
  });

  container.querySelector('#btn-log-attempt').addEventListener('click', () => logAttempt(false));
}

function revealRow(label, valueHtml) {
  return `<div style="display:flex; gap:14px; padding:12px 14px; border-bottom:1px solid var(--border-color,#ddd);">
    <div style="flex:0 0 90px; font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.04em; padding-top:2px;">${label}</div>
    <div style="font-size:14px;">${valueHtml}</div>
  </div>`;
}

function contactNote(lead) {
  const attempts = lead.contactAttempts || 0;
  if (lead.urgency === 'emergency') {
    return `Emergency job — you have 10 minutes from claiming to make contact. ${attempts} attempt${attempts === 1 ? '' : 's'} logged. After three no-answer attempts the lead is returned and refunded.`;
  }
  return `${attempts} contact attempt${attempts === 1 ? '' : 's'} logged. Reach out promptly — fast responses win more work.`;
}

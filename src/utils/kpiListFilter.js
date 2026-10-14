// ============================================
// RELAY — DASHBOARD → LIST FILTERS
// ============================================
// A KPI card opens its list with ?filter=<name>&period=<id>. The list pages call
// readKpiListFilter() for the predicate (the same one the card's number is built
// from, see KPI_FILTERS in kpis.js) and mountKpiFilterChip() to show it with a
// way to clear it.

import { store } from '../data/store.js';
import { KPI_FILTERS, PERIODS, DEFAULT_PERIOD, filterContext } from './kpis.js';
import { escapeHTML } from './security.js';

function hashParams(hash) {
  const qi = hash.indexOf('?');
  return new URLSearchParams(qi < 0 ? '' : hash.slice(qi + 1));
}

/**
 * The dashboard filter this list was opened with, or null.
 * Returns { name, label, periodLabel, test(record) }.
 */
export function readKpiListFilter(collection, hash = window.location.hash, now = new Date()) {
  const params = hashParams(hash);
  const name = params.get('filter');
  const def = name && KPI_FILTERS[collection] && Object.prototype.hasOwnProperty.call(KPI_FILTERS[collection], name)
    ? KPI_FILTERS[collection][name] : null;
  if (!def) return null;
  const period = PERIODS.some(p => p.id === params.get('period')) ? params.get('period') : DEFAULT_PERIOD;
  const data = Object.fromEntries(def.needs.map(c => [c, store.getAll(c)]));
  return {
    name,
    label: def.label,
    periodLabel: def.periodic ? PERIODS.find(p => p.id === period).label : '',
    test: def.build(data, filterContext(period, now)),
  };
}

// The hash without the dashboard filter params, keeping any others (customerId…).
export function hashWithoutKpiFilter(hash) {
  const [base, qs = ''] = hash.split('?');
  const params = new URLSearchParams(qs);
  params.delete('filter');
  params.delete('period');
  const rest = params.toString();
  return rest ? `${base}?${rest}` : base;
}

/**
 * Show "From dashboard: Overdue · This month ✕" under the page header. Clearing
 * drops the params from the URL without a navigation, then calls onClear so the
 * page can re-run its own filters.
 */
export function mountKpiFilterChip(container, filter, onClear) {
  const header = container.querySelector('.page-header');
  if (!header || !filter) return;
  const bar = document.createElement('div');
  bar.className = 'kpi-filter-bar';
  bar.innerHTML = `
    <span class="kpi-filter-chip">
      <span class="material-icons-outlined" aria-hidden="true">dashboard</span>
      <span>From dashboard: <strong>${escapeHTML(filter.label)}</strong>${filter.periodLabel ? ` · ${escapeHTML(filter.periodLabel)}` : ''}</span>
      <button type="button" class="kpi-filter-clear" aria-label="Clear the dashboard filter">
        <span class="material-icons-outlined" aria-hidden="true">close</span>
      </button>
    </span>`;
  header.insertAdjacentElement('afterend', bar);
  bar.querySelector('.kpi-filter-clear').addEventListener('click', () => {
    bar.remove();
    const { pathname, search, hash } = window.location;
    history.replaceState(history.state, '', pathname + search + hashWithoutKpiFilter(hash));
    onClear();
  });
}

import { router } from '../router.js';
import { store } from '../data/store.js';
import { escapeHTML } from '../utils/security.js';
import { getContextualMenu } from './Sidebar.js';

// The breadcrumb follows the user down through a section: section › record ›
// tab › sub-view (e.g. Jobs › J-02370 › Forms › JSA / SWMS), each earlier step
// a link back up. Tab names come from the same contextual menu the sidebar
// shows, so the two always agree.

const routeLabels = {
  '/': 'Dashboard',
  '/people': 'Customers',
  '/leads': 'Leads',
  '/quotes': 'Quotes',
  '/jobs': 'Jobs',
  '/recurring-templates': 'Recurring Jobs',
  '/projects': 'Projects',
  '/schedule': 'Schedule',
  '/stock': 'Stock',
  '/kits': 'Kits',
  '/invoices': 'Invoices',
  '/purchase-orders': 'Purchase Orders',
  '/documents': 'Documents',
  '/document': 'Documents',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/settings/documents': 'Document Studio',
  '/settings/email-templates': 'Email Templates',
  '/settings/forms': 'Forms',
  '/settings/quote-templates': 'Quote Templates',
  '/timesheets': 'Time Tracking',
  '/contractors': 'Contractors',
  '/suppliers': 'Suppliers',
  '/assets': 'Assets',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
};

// Where each route's records live, so a record step can show its name.
const recordCollections = {
  jobs: 'jobs',
  quotes: 'quotes',
  invoices: 'invoices',
  people: 'customers',
  contractors: 'contractors',
  suppliers: 'suppliers',
  leads: 'leads',
  assets: 'assets',
  stock: 'stock',
  'purchase-orders': 'purchaseOrders',
  kits: 'kits',
  projects: 'projects',
  forms: 'formTemplates',
  'quote-templates': 'quoteTemplates',
};

const SEGMENT_WORDS = { new: 'New', edit: 'Edit', view: 'View' };

function recordLabel(collection, id) {
  if (!collection) return null;
  let rec = null;
  try { rec = store.getById(collection, id); } catch { rec = null; }
  if (!rec && collection === 'customers') {
    try { rec = store.getById('people', id); } catch { rec = null; }
  }
  if (!rec) return null;
  const person = [rec.firstName, rec.lastName].filter(Boolean).join(' ');
  return rec.number || rec.company || rec.companyName || rec.name || person || rec.title || null;
}

function humanize(value) {
  const s = String(value || '').replace(/[_-]+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// The chain of active entries in the page's contextual (sidebar) menu: a
// settings group then its tab, or a tab then a nested view.
function activeMenuChain(contextual) {
  if (!contextual) return [];
  const isActive = (item) => (item.active !== undefined
    ? item.active === true
    : (contextual.activeTab != null && contextual.activeTab === item.id)
      || (contextual.activeView != null && contextual.activeView === item.id));

  if (Array.isArray(contextual.groups)) {
    for (const group of contextual.groups) {
      const item = (group.items || []).find(isActive);
      if (item) {
        const first = (group.items || []).find(i => !i.disabled) || item;
        return [
          { label: group.label, path: first.path },
          { label: item.label, path: item.path },
        ];
      }
    }
    return [];
  }

  const walk = (items, trail) => {
    for (const item of items || []) {
      const here = [...trail, { label: item.label, path: item.path }];
      if (isActive(item)) return here;
      const deeper = walk(item.children, here);
      if (deeper) return deeper;
    }
    return null;
  };
  return walk(contextual.items, []) || [];
}

function buildSteps(path, query) {
  const steps = [];
  const parts = path.split('/').filter(Boolean);

  if (path === '/') return [{ label: 'Dashboard' }];

  let current = '';
  parts.forEach((part, i) => {
    current += '/' + part;
    const prev = parts[i - 1];
    let label = routeLabels[current];
    let kind = 'section';
    if (!label) {
      if (SEGMENT_WORDS[part]) {
        label = SEGMENT_WORDS[part];
      } else if (prev && recordCollections[prev]) {
        label = recordLabel(recordCollections[prev], decodeURIComponent(part)) || 'Details';
        kind = 'record';
      } else {
        label = humanize(decodeURIComponent(part));
      }
    }
    steps.push({ label, path: current, kind });
  });

  // Tabs and nested views of the page, as the sidebar names them.
  let contextual = null;
  try { contextual = getContextualMenu(`${path}${query ? `?${query}` : ''}`, null); } catch { contextual = null; }
  const chain = activeMenuChain(contextual).filter(s => s.label);
  const params = new URLSearchParams(query || '');
  const tab = params.get('tab');

  if (chain.length) {
    steps.push(...chain);
  } else if (tab && !(path === '/documents' && tab === 'All Documents')) {
    // Pages without a contextual menu (e.g. Document Center folders).
    steps.push({ label: humanize(tab), path: `${path}?tab=${encodeURIComponent(tab)}` });
  }

  // A job's form opened straight from a link.
  const formId = params.get('form');
  if (formId) {
    let fi = null;
    try { fi = store.getById('formInstances', formId); } catch { fi = null; }
    const tmpl = fi ? store.getById('formTemplates', fi.templateId) : null;
    if (tmpl) steps.push({ label: tmpl.name });
  }

  // Never repeat the same step twice in a row (a tab named like its section).
  return steps.filter((s, i) => i === 0 || s.label !== steps[i - 1].label);
}

export function createBreadcrumb(path) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;

  container.style.display = 'flex';
  container.style.justifyContent = 'space-between';
  container.style.alignItems = 'center';

  const hash = (typeof window !== 'undefined' ? window.location.hash.slice(1) : '') || '';
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const steps = buildSteps(path, query);

  let linksHtml = `
    <span class="breadcrumb-item" data-path="/" title="Dashboard">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `;
  steps.forEach((step, i) => {
    const isLast = i === steps.length - 1;
    const kindAttr = step.kind === 'record' ? ' data-crumb="record"' : '';
    linksHtml += '<span class="breadcrumb-separator">›</span>';
    if (isLast || !step.path) {
      linksHtml += `<span class="breadcrumb-item${isLast ? ' current' : ''}"${kindAttr}>${escapeHTML(step.label)}</span>`;
    } else {
      linksHtml += `<span class="breadcrumb-item"${kindAttr} data-path="${escapeHTML(step.path)}">${escapeHTML(step.label)}</span>`;
    }
  });

  container.innerHTML = `
    <div class="breadcrumb-links" style="display:flex; align-items:center; gap:var(--space-sm); min-width:0; flex-wrap:wrap;">${linksHtml}</div>
    <div class="breadcrumb-actions" id="breadcrumb-actions" style="display:flex; gap:var(--space-sm);"></div>
  `;

  container.querySelectorAll('.breadcrumb-item[data-path]').forEach(item => {
    item.addEventListener('click', () => {
      router.navigate(item.dataset.path);
    });
  });
}

/**
 * Detail pages call this with the record's display name (e.g. a job number).
 * It names the record step, which is not always the last one once a tab or
 * sub-view follows it.
 */
export function updateBreadcrumbDetail(label) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;
  const target = container.querySelector('.breadcrumb-item[data-crumb="record"]')
    || container.querySelector('.breadcrumb-item.current');
  if (target) target.textContent = label;
}

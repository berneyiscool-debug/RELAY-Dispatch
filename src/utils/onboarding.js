// ============================================
// RELAY — NEW-USER WALKTHROUGH (data layer)
// ============================================
// Everything the Getting Started hub and the floating guide decide is derived
// here from plain collections and the current route: no DOM, no store. The
// components only lay the result out, which keeps the flow testable.
//
// Two kinds of progress:
//   - The core workflow (customer → quote → job → invoice) is derived from live
//     data, so it can never claim work is outstanding that was already done.
//   - Things that leave no record (taking the tour, looking through Settings,
//     dismissing the hub) are explicit flags in a small per-user document.
// ============================================

const STATE_PREFIX = 'relay_onboarding_';
// The checklist this replaced kept its own dismissal flag. Honour it, so anyone
// who already closed the old card is not shown the new one.
const LEGACY_DISMISS_PREFIX = 'relay_setup_checklist_dismissed_';

export const DEFAULT_STATE = Object.freeze({
  dismissed: false,   // "Dismiss forever" — the hub never shows again
  guideActive: false, // the floating guide follows the user between pages
  tourDone: false,    // finished (or skipped through) the pages tour
  settingsDone: false,// finished the settings tour
  welcomed: false,    // the hub has auto-opened once
});

function userKey(user) {
  return (user && user.id) || 'anon';
}

export function loadOnboardingState(user, storage = globalThis.localStorage) {
  const state = { ...DEFAULT_STATE };
  try {
    const raw = storage && storage.getItem(STATE_PREFIX + userKey(user));
    if (raw) Object.assign(state, JSON.parse(raw) || {});
    else if (storage && storage.getItem(LEGACY_DISMISS_PREFIX + userKey(user)) === '1') state.dismissed = true;
  } catch (e) {
    // Unreadable or private mode: start from defaults.
  }
  return state;
}

export function saveOnboardingState(user, patch, storage = globalThis.localStorage) {
  const next = { ...loadOnboardingState(user, storage), ...patch };
  try {
    storage && storage.setItem(STATE_PREFIX + userKey(user), JSON.stringify(next));
  } catch (e) {
    // Private mode: the change just won't survive a reload.
  }
  return next;
}

// ── Core workflow ──────────────────────────────────────────────────────────────

export const WORKFLOW_STEPS = [
  {
    key: 'customer',
    icon: 'person_add',
    label: 'Add your first customer',
    blurb: 'Every quote, job and invoice belongs to a customer.',
    collection: 'customers',
  },
  {
    key: 'quote',
    icon: 'request_quote',
    label: 'Create a quote',
    blurb: 'Price the work with sections and line items.',
    collection: 'quotes',
  },
  {
    key: 'job',
    icon: 'build',
    label: 'Turn it into a job',
    blurb: 'Once the customer says yes, convert the quote into live work.',
    collection: 'jobs',
  },
  {
    key: 'invoice',
    icon: 'receipt_long',
    label: 'Send the invoice',
    blurb: 'Complete the job and bill it in one click.',
    collection: 'invoices',
  },
];

function count(data, collection) {
  return Array.isArray(data[collection]) ? data[collection].length : 0;
}

/** Steps with a `done` flag, plus the first step that is not done (or null). */
export function workflowProgress(data = {}) {
  const steps = WORKFLOW_STEPS.map(s => ({ ...s, done: count(data, s.collection) > 0 }));
  const current = steps.find(s => !s.done) || null;
  return {
    steps,
    current,
    done: steps.filter(s => s.done).length,
    total: steps.length,
    complete: !current,
  };
}

function newest(list = []) {
  let best = null;
  for (const r of list) {
    if (!r) continue;
    if (!best || String(r.createdAt || '') > String(best.createdAt || '')) best = r;
  }
  return best;
}

/** Splits '/quotes/abc?tab=x' into { base: 'quotes', id: 'abc' }. */
export function parseRoute(route = '/') {
  const path = String(route || '/').split('?')[0];
  const [base = '', id = null] = path.split('/').filter(Boolean);
  return { base, id };
}

/**
 * What the floating guide should say for the current step on the current page.
 * Returns { title, text, target?, action? } where `target` is a CSS selector to
 * ring and `action` is { label, path } for a button that takes the user there.
 */
export function coachFor(stepKey, route, data = {}) {
  const { base, id } = parseRoute(route);

  if (stepKey === 'customer') {
    if (base === 'people' && id === 'new') {
      return {
        title: 'Fill in your customer',
        text: 'A name and an email or phone number is enough to start. Press Save when you\'re done.',
        target: '#btn-save',
      };
    }
    if (base === 'people' && !id) {
      return { title: 'Add a customer', text: 'Press New Customer to open the form.', target: '#btn-new-person' };
    }
    return {
      title: 'Start with a customer',
      text: 'Every quote, job and invoice belongs to a customer. Add a real client, or a test one you can delete later.',
      action: { label: 'Add a customer', path: '/people/new' },
    };
  }

  if (stepKey === 'quote') {
    if (base === 'quotes' && id === 'new') {
      return {
        title: 'Build your quote',
        text: 'Choose your customer, give the quote a name, then add a section and some line items. Press Save Quote to keep it.',
        target: '#quote-customer',
      };
    }
    if (base === 'quotes' && !id) {
      return { title: 'Create a quote', text: 'Press New Quote to start a proposal.', target: '#btn-new-quote' };
    }
    return {
      title: 'Price the work',
      text: 'Quotes are made of sections and line items, and you can save any quote as a template to reuse.',
      action: { label: 'Create a quote', path: '/quotes/new' },
    };
  }

  if (stepKey === 'job') {
    const quotes = data.quotes || [];
    const onQuote = base === 'quotes' && id && id !== 'new' ? quotes.find(q => String(q.id) === String(id)) : null;
    if (onQuote) {
      if (onQuote.status === 'Accepted') {
        return {
          title: 'Convert it to a job',
          text: 'The customer has accepted. Convert to Job copies the quote into a live job you can schedule.',
          target: '#btn-convert-job',
        };
      }
      if (onQuote.status === 'Declined') {
        return {
          title: 'This quote was declined',
          text: 'Create a revision to adjust it, or open another quote that the customer accepted.',
          target: '#btn-create-revision',
        };
      }
      return {
        title: 'Get it accepted',
        text: 'Send the quote to your customer. When they agree (or for this walkthrough), record it with Sign & Approve.',
        target: '#btn-sign-approve-modal',
      };
    }
    if (base === 'jobs' && id === 'new') {
      return { title: 'Fill in the job', text: 'Add a title, customer and site, then press Save.', target: '#btn-save' };
    }
    const latest = newest(quotes);
    return {
      title: 'Win the work',
      text: 'Open your quote, record that the customer accepted it, then convert it into a job.',
      action: latest ? { label: 'Open your quote', path: `/quotes/${latest.id}` } : { label: 'Create a job', path: '/jobs/new' },
    };
  }

  if (stepKey === 'invoice') {
    const jobs = data.jobs || [];
    const onJob = base === 'jobs' && id && id !== 'new' ? jobs.find(j => String(j.id) === String(id)) : null;
    if (onJob) {
      if (onJob.status === 'Completed') {
        return {
          title: 'Bill the job',
          text: 'Generate Invoice turns the job\'s quote, time and materials into a draft invoice.',
          target: '#btn-header-generate-invoice',
        };
      }
      return {
        title: 'Finish the job',
        text: 'Schedule it, track time and materials, then set the status to Completed. Generate Invoice appears once it\'s done.',
        target: '#header-job-status-select',
      };
    }
    const latest = newest(jobs);
    return {
      title: 'Get paid',
      text: 'Mark your job Completed, then generate an invoice from it.',
      action: latest ? { label: 'Open your job', path: `/jobs/${latest.id}` } : { label: 'Create an invoice', path: '/invoices/new' },
    };
  }

  return null;
}

// ── Pages & settings tours ─────────────────────────────────────────────────────
// Each stop rings a sidebar element and explains what lives there. `section`
// opens that rail group first so its pages are on screen. `cloud` marks pages a
// local profile can see but not use.

export const PAGES_TOUR = [
  {
    target: '#rail-dashboard',
    title: 'Dashboard',
    text: 'Your home is an infinite canvas. Drag, resize and add widgets, pan and zoom, and save views you can jump between.',
    points: ['Double-click empty space to add a note', 'Edit mode adds widgets — even whole pages'],
  },
  {
    target: '#rail-schedule',
    title: 'Schedule',
    text: 'Drag jobs onto technicians\' calendars, see who\'s free and plan routes for the day.',
  },
  {
    target: '#sidebar-submenu',
    section: 'cat-workflow',
    title: 'Workflow',
    text: 'Where the work moves from enquiry to payment.',
    points: [
      'Notifications — portal replies, approvals and alerts',
      'Leads — capture enquiries before they\'re quotes',
      'Quotes, Jobs and Invoices — the core pipeline',
      'Recurring Templates — repeat maintenance work',
      'Projects — group large jobs into stages',
    ],
  },
  {
    target: '#sidebar-submenu',
    section: 'cat-people',
    title: 'People',
    text: 'Everyone you work with.',
    points: [
      'Customers — sites, contacts, history and balances',
      'Contractors — compliance, rates and allocations',
      'Suppliers — catalogues, stock and purchase orders',
    ],
  },
  {
    target: '#sidebar-submenu',
    section: 'cat-resources',
    title: 'Resources',
    text: 'The things you install, carry and order.',
    points: [
      'Assets — equipment at customer sites, with maintenance plans',
      'Stock — items and kit bundles across your storage locations',
      'Purchase Orders — order from suppliers against jobs',
    ],
  },
  {
    target: '#sidebar-submenu',
    section: 'cat-admin',
    title: 'Admin',
    text: 'Running the business behind the jobs.',
    points: [
      'Time Tracking — timesheets, clock history and exceptions',
      'Documents — every quote, invoice and file in one place',
      'Reports — revenue, job costing, productivity and more',
      'Settings — make RELAY yours (the settings tour covers it)',
    ],
  },
  {
    target: '#global-search',
    title: 'Search anything',
    text: 'Find customers, jobs, quotes and invoices from any page. Press / to jump here.',
  },
  {
    target: '#btn-relay-assistant',
    title: 'Meet brny',
    text: 'Your assistant can answer questions about the business and do things for you — anything risky asks for your approval first.',
    points: ['Try "show me overdue invoices"', 'Shift + B opens it from anywhere'],
  },
  {
    target: '#btn-help',
    title: 'Help is always here',
    text: 'Guides, shortcuts and demo mode live in Help. You can restart this walkthrough from there too.',
  },
];

export const SETTINGS_TOUR = [
  {
    title: 'General',
    path: '/settings?tab=company',
    text: 'Who you are and how RELAY runs.',
    points: [
      { label: 'Company Profile', tab: 'company', note: 'logo, ABN and contact details on every document' },
      { label: 'Plan & Billing', tab: 'billing', note: 'your subscription' },
      { label: 'Customer Portal', tab: 'portal', note: 'let customers view and accept online', cloud: true },
      { label: 'Contractor Portal', tab: 'portal_contractor', note: 'share jobs with subcontractors', cloud: true },
      { label: 'Local Storage', tab: 'local_storage', note: 'back up to a folder on this computer' },
      { label: 'System Options', tab: 'system', note: 'theme, fonts and defaults' },
    ],
  },
  {
    title: 'Workflow',
    path: '/settings?tab=invoices_quotes',
    text: 'How quotes, jobs and invoices behave.',
    points: [
      { label: 'Templates & Forms', tab: 'templates_forms', note: 'task lists, compliance forms and quote templates' },
      { label: 'Quotes & Invoices', tab: 'invoices_quotes', note: 'numbering, terms and document design' },
      { label: 'Payments', tab: 'payments', note: 'take card payments on invoices', cloud: true },
      { label: 'Email & Domain', tab: 'email', note: 'send from your own address with your own templates', cloud: true },
    ],
  },
  {
    title: 'People',
    path: '/settings?tab=users',
    text: 'Who can sign in and what they can do.',
    points: [
      { label: 'Users', tab: 'users', note: 'technicians and office staff', cloud: true },
      { label: 'User Types & Permissions', tab: 'user_types', note: 'what each role can see and change', cloud: true },
      { label: 'Suppliers', tab: 'suppliers', note: 'supplier defaults' },
    ],
  },
  {
    title: 'Resources',
    path: '/settings?tab=tax',
    text: 'The numbers behind your pricing.',
    points: [
      { label: 'Materials & Catalog', tab: 'materials', note: 'your price list' },
      { label: 'Storage Locations', tab: 'storage_options', note: 'vans, warehouses and shelves' },
      { label: 'Tax & Labor Rates', tab: 'tax', note: 'GST and hourly rates used on quotes' },
    ],
  },
];

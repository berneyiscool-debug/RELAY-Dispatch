// ============================================
// RELAY — HELP CENTER CONTENT
// ============================================
// Every topic the Help Center shows, as plain data. The modal (components/HelpCenter.js)
// only lays this out, and searchHelp() is pure so it can be tested without a DOM.
//
// Topic shape:
//   { id, group, icon, title, summary,
//     sections: [{ heading, items: [{ label, text, cloud? }] }],
//     actions:  [{ label, icon, path } | { label, icon, run: 'tour' | 'settings-tour' | 'restart' }],
//     prompts:  ['things to ask brny'] }
// `cloud: true` marks something a local profile can see but needs RELAY Cloud to use.
// `localOnly: true` hides a whole topic from Cloud companies (they already have Cloud).
// ============================================

export const HELP_GROUPS = ['Start here', 'Daily work', 'People & resources', 'Admin', 'More'];

export const HELP_TOPICS = [
  // ── Start here ──────────────────────────────────────────────────────────────
  {
    id: 'first-job',
    group: 'Start here',
    icon: 'rocket_launch',
    title: 'Your first job, start to finish',
    summary: 'The whole RELAY loop: customer, quote, job, invoice, paid.',
    sections: [
      {
        heading: 'The workflow',
        items: [
          { label: '1. Add a customer', text: 'Customers → New Customer. A name and an email or phone is enough to start.' },
          { label: '2. Quote the work', text: 'Quotes → New Quote. Pick the customer, add a phase and line items, then Save Quote.' },
          { label: '3. Get it accepted', text: 'Send Quote emails it to the customer. When they agree, Sign & Approve on the quote records it.' },
          { label: '4. Convert to a job', text: 'An accepted quote shows Convert to Job, which copies the quote into a live job.' },
          { label: '5. Do the work', text: 'Schedule it, track time and materials, then set the job status to Completed.' },
          { label: '6. Invoice it', text: 'A completed job shows Generate Invoice. Send it, then record the payment when it arrives.' },
        ],
      },
      {
        heading: 'Good to know',
        items: [
          { label: 'Leads first', text: 'For enquiries that aren\'t ready to price, add a lead and use Convert to Quote when they are.' },
          { label: 'Skip the quote', text: 'Jobs → New Job creates work directly, for call-outs and small jobs.' },
        ],
      },
    ],
    actions: [
      { label: 'Restart the guided walkthrough', icon: 'near_me', run: 'restart' },
      { label: 'Add a customer', icon: 'person_add', path: '/people/new' },
    ],
  },
  {
    id: 'cloud',
    group: 'Start here',
    localOnly: true,
    icon: 'cloud',
    title: 'Local profile vs RELAY Cloud',
    summary: 'What runs on this device, and what Cloud adds.',
    sections: [
      {
        heading: 'Local profile',
        items: [
          { label: 'One owner, one device', text: 'Everything is stored on this computer, in a folder you chose or in the browser.' },
          { label: 'Back it up', text: 'Settings → Local Storage downloads a backup file. A browser-only profile is lost if browser data is cleared.' },
        ],
      },
      {
        heading: 'What RELAY Cloud adds',
        items: [
          { label: 'Team logins', text: 'Every technician and office user signs in with their own email and permissions.' },
          { label: 'Sync everywhere', text: 'The same data on every computer and phone, live.' },
          { label: 'Portals', text: 'Customers accept quotes and view jobs online; contractors see the work shared with them.' },
          { label: 'Payments & email', text: 'Card payment links on invoices, and sending from your own domain.' },
          { label: 'Maps, weather and brny', text: 'Technician maps, routes, forecasts and the AI assistant.' },
          { label: 'Free trial', text: 'New cloud accounts start with a 14-day no-card trial. The top bar shows the countdown, and Settings → Plan & Billing shows the end date.' },
        ],
      },
    ],
    actions: [{ label: 'See plans', icon: 'credit_card', path: '/settings?tab=billing' }],
  },

  // ── Daily work ──────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    group: 'Daily work',
    icon: 'dashboard',
    title: 'Dashboard canvas',
    summary: 'An infinite, zoomable workspace you arrange yourself.',
    sections: [
      {
        heading: 'Moving around',
        items: [
          { label: 'Pan and zoom', text: 'Drag empty space to pan; scroll to zoom. The bottom-right controls fit everything, reset to 100% or lock widgets in place.' },
          { label: 'Views', text: 'Right-click → Save current view to bookmark a spot, then jump between views. Home is always there.' },
        ],
      },
      {
        heading: 'Making it yours',
        items: [
          { label: 'Customise layout', text: 'Right-click empty canvas for Add widget and Customise layout — move, resize and configure widgets with snap-to-grid.' },
          { label: 'Whole pages as widgets', text: 'Embed live Jobs, Quotes, Schedule and other pages right on the canvas.' },
          { label: 'Quick notes', text: 'Double-click empty space to drop a sticky to-do note.' },
          { label: 'Period', text: 'The period menu (top right) sets the date range the KPI widgets use.' },
        ],
      },
    ],
    actions: [{ label: 'Go to Dashboard', icon: 'dashboard', path: '/' }],
    prompts: ['add a schedule widget', 'zoom canvas to fit'],
  },
  {
    id: 'schedule',
    group: 'Daily work',
    icon: 'calendar_today',
    title: 'Schedule & dispatch',
    summary: 'Who is doing what, when — and who is free.',
    sections: [
      {
        heading: 'Planning',
        items: [
          { label: 'Book work', text: 'Drag jobs onto a technician\'s row to schedule them. Overlapping bookings are flagged as conflicts.' },
          { label: 'Move through time', text: 'Use the previous / Today / next buttons, and the technician filter to focus on part of the team.' },
          { label: 'Rostered hours', text: 'Expected hours set recurring rosters, so you can see who should be working before you book them.' },
          { label: 'Routes', text: 'Plan each technician\'s day on a map.', cloud: true },
        ],
      },
      {
        heading: 'On the day',
        items: [
          { label: 'Time clock', text: 'Start a shift, take breaks and end the shift from the schedule. Clock times feed Time Tracking.' },
        ],
      },
    ],
    actions: [{ label: 'Open Schedule', icon: 'calendar_today', path: '/schedule' }],
    prompts: ['show me the today view', 'who is free tomorrow?'],
  },
  {
    id: 'leads',
    group: 'Daily work',
    icon: 'trending_up',
    title: 'Leads',
    summary: 'Capture enquiries before they become quotes.',
    sections: [
      {
        heading: 'Working leads',
        items: [
          { label: 'Stages', text: 'Move leads through New, Contacted, Qualified, Proposal and Negotiation to Won or Lost.' },
          { label: 'Activity', text: 'Log calls, emails and notes on each lead so nothing lives only in someone\'s head.' },
          { label: 'Convert to Quote', text: 'When the lead is ready, one click turns it into a quote with the details carried over.' },
          { label: 'Marketplace', text: 'Leads from the RELAY marketplace, alongside your own internal ones.', cloud: true },
        ],
      },
    ],
    actions: [
      { label: 'Open Leads', icon: 'trending_up', path: '/leads' },
      { label: 'Add a lead', icon: 'add', path: '/leads/new' },
    ],
  },
  {
    id: 'quotes',
    group: 'Daily work',
    icon: 'request_quote',
    title: 'Quotes',
    summary: 'Price work, send proposals and win jobs.',
    sections: [
      {
        heading: 'Building a quote',
        items: [
          { label: 'Phases and items', text: 'Group work into phases, then add items, labour and kits. Each phase shows its own subtotal.' },
          { label: 'Labour rate', text: 'Pick the rate the quote uses; set your rates in Settings → Tax & Labor Rates.' },
          { label: 'Internal estimation', text: 'Estimated cost and margin, based on stock costs and labour rates, visible only to you.' },
          { label: 'Templates', text: 'Save as Template and Import Template (in the ⋮ menu) reuse common quotes.' },
        ],
      },
      {
        heading: 'Winning it',
        items: [
          { label: 'PDF and send', text: 'PDF previews the proposal; Send Quote emails it and marks it Sent.' },
          { label: 'Acceptance', text: 'Sign & Approve records the customer\'s signature; Decline records a no.' },
          { label: 'Revisions', text: 'Create Revision archives this version and opens an editable copy.' },
          { label: 'Convert to Job', text: 'Appears once a quote is accepted. Select several in the list to convert them in bulk.' },
          { label: 'Online acceptance', text: 'Customers can review and sign quotes from their portal.', cloud: true },
        ],
      },
    ],
    actions: [
      { label: 'Open Quotes', icon: 'request_quote', path: '/quotes' },
      { label: 'New quote', icon: 'add', path: '/quotes/new' },
    ],
    prompts: ['which quotes are waiting on the customer?'],
  },
  {
    id: 'jobs',
    group: 'Daily work',
    icon: 'build',
    title: 'Jobs',
    summary: 'The work itself — scheduled, tracked and costed.',
    sections: [
      {
        heading: 'Creating jobs',
        items: [
          { label: 'From a quote or from scratch', text: 'Convert an accepted quote, or use Jobs → New Job for call-outs.' },
          { label: 'Save each section', text: 'Details, Asset, Scheduling, Tasklists and Compliance Forms each have their own Save button. The first save on a new job creates it; Done closes the job.' },
          { label: 'Recurring jobs', text: 'Turn on Recurring Job to repeat maintenance daily, weekly or monthly. Recurring Templates lists them all.' },
          { label: 'Projects', text: 'Group large jobs into staged projects with their own financials.' },
        ],
      },
      {
        heading: 'Inside a job',
        items: [
          { label: 'Status', text: 'Pending → Scheduled → In Progress → Completed → Invoiced, with On Hold when it stalls. Change it from the header.' },
          { label: 'Tasks and forms', text: 'Task lists and compliance forms that technicians fill in on site, including expected readings.' },
          { label: 'Materials & POs', text: 'Allocate stock and raise purchase orders against the job.' },
          { label: 'Financials', text: 'Live job costing, plus deposit and progress invoices before the job is finished.' },
          { label: 'Activity', text: 'Staff Activity is your internal log; Customer Portal holds messages with the customer.' },
        ],
      },
    ],
    actions: [
      { label: 'Open Jobs', icon: 'build', path: '/jobs' },
      { label: 'New job', icon: 'add', path: '/jobs/new' },
    ],
    prompts: ['show me active jobs', 'which jobs are unassigned?'],
  },
  {
    id: 'invoices',
    group: 'Daily work',
    icon: 'receipt_long',
    title: 'Invoices & payments',
    summary: 'Bill the work and get paid.',
    sections: [
      {
        heading: 'Creating invoices',
        items: [
          { label: 'From a job', text: 'Generate Invoice on a completed job builds it from the quote, timesheets and materials.' },
          { label: 'Deposit and progress', text: 'Bill part of a job early from its Financials tab.' },
          { label: 'Variations', text: 'Add a variation phase for out-of-scope work the customer needs to sign off.' },
          { label: 'Linked quote', text: 'Lines from the quote are locked; Unlink Quote frees them for editing.' },
        ],
      },
      {
        heading: 'Getting paid',
        items: [
          { label: 'Send', text: 'PDF previews the invoice; Send emails it and marks it Sent.' },
          { label: 'Reminders', text: 'Send a friendly payment reminder when it\'s overdue.' },
          { label: 'Record a payment', text: 'Mark Paid records bank transfer, cheque, cash or card, then email a receipt.' },
          { label: 'Card payment links', text: 'A secure Stripe link the customer can pay online.', cloud: true },
          { label: 'Accounting export', text: 'Export paid invoices as a Xero / MYOB-compatible CSV from the Invoices list.' },
        ],
      },
    ],
    actions: [{ label: 'Open Invoices', icon: 'receipt_long', path: '/invoices' }],
    prompts: ['show me overdue invoices'],
  },

  // ── People & resources ──────────────────────────────────────────────────────
  {
    id: 'customers',
    group: 'People & resources',
    icon: 'people',
    title: 'Customers',
    summary: 'Contacts, sites, history and balances in one place.',
    sections: [
      {
        heading: 'A customer record',
        items: [
          { label: 'Overview', text: 'Contact details, address and running totals of jobs and quotes.' },
          { label: 'Sites / Locations', text: 'Every address you work at for this customer, each with its own contacts and assets.' },
          { label: 'Financials', text: 'What they\'ve been invoiced, what they\'ve paid and what\'s outstanding, plus their payment terms, credit limit and how much of it is used.' },
          { label: 'Payment terms & credit limit', text: 'Set on the customer or from the Financials tab. Terms set the due date on new invoices (blank means 30 days); a credit limit shows a warning when a new invoice takes their unpaid balance over it, but never stops you billing.' },
          { label: 'Jobs & Workflow', text: 'Every quote, job and invoice for the customer.' },
          { label: 'Customer portal', text: 'A link and PIN so the customer can view jobs, accept quotes and send requests.', cloud: true },
        ],
      },
    ],
    actions: [
      { label: 'Open Customers', icon: 'people', path: '/people' },
      { label: 'Add a customer', icon: 'person_add', path: '/people/new' },
    ],
  },
  {
    id: 'contractors',
    group: 'People & resources',
    icon: 'engineering',
    title: 'Contractors & suppliers',
    summary: 'The businesses you subcontract to and buy from.',
    sections: [
      {
        heading: 'Contractors',
        items: [
          { label: 'Compliance registry', text: 'Licences and insurance with expiry dates, so you only send work to compliant contractors.' },
          { label: 'Rates and allocations', text: 'What each contractor charges and the tasks you\'ve given them.' },
          { label: 'Contractor portal', text: 'Share jobs with subcontractors and let them update progress.', cloud: true },
        ],
      },
      {
        heading: 'Suppliers',
        items: [
          { label: 'Catalogues', text: 'Store price lists and documents against each supplier.' },
          { label: 'Stock and orders', text: 'See the stock items you buy from them and every purchase order.' },
        ],
      },
    ],
    actions: [
      { label: 'Open Contractors', icon: 'engineering', path: '/contractors' },
      { label: 'Open Suppliers', icon: 'local_shipping', path: '/suppliers' },
    ],
  },
  {
    id: 'stock',
    group: 'People & resources',
    icon: 'inventory_2',
    title: 'Stock & purchasing',
    summary: 'What you carry, where it is and what to reorder.',
    sections: [
      {
        heading: 'Stock',
        items: [
          { label: 'Individual items', text: 'Parts and materials with costs, prices and quantities.' },
          { label: 'Kit bundles', text: 'Group items you always use together and drop the whole kit onto a quote.' },
          { label: 'Storage locations', text: 'Track stock across vans, warehouses and shelves (set them in Settings).' },
          { label: 'Low stock', text: 'Add the Low Stock Alerts widget to your dashboard to see what needs reordering.' },
        ],
      },
      {
        heading: 'Purchase orders',
        items: [
          { label: 'Order', text: 'Raise a PO to a supplier, optionally against a job, then Issue it.' },
          { label: 'Receive', text: 'Receive the PO when goods arrive to bring them into stock.' },
        ],
      },
    ],
    actions: [
      { label: 'Open Stock', icon: 'inventory_2', path: '/stock' },
      { label: 'Open Purchase Orders', icon: 'shopping_cart', path: '/purchase-orders' },
    ],
  },
  {
    id: 'assets',
    group: 'People & resources',
    icon: 'precision_manufacturing',
    title: 'Assets & maintenance',
    summary: 'Equipment at customer sites and the plans that keep it running.',
    sections: [
      {
        heading: 'Assets',
        items: [
          { label: 'Register equipment', text: 'Record units at each site with serials and details, and link them to jobs.' },
          { label: 'History', text: 'Every job and service on the asset, in one timeline.' },
          { label: 'Maintenance agreements', text: 'Set service intervals; RELAY flags what\'s overdue or due this week on the dashboard.' },
        ],
      },
    ],
    actions: [{ label: 'Open Assets', icon: 'precision_manufacturing', path: '/assets' }],
  },

  // ── Admin ───────────────────────────────────────────────────────────────────
  {
    id: 'time',
    group: 'Admin',
    icon: 'schedule',
    title: 'Time tracking',
    summary: 'Clocked hours, job hours and payroll checks.',
    sections: [
      {
        heading: 'Views',
        items: [
          { label: 'Clock History', text: 'Every shift start, break and finish, with manual corrections.' },
          { label: 'Job Hours', text: 'Time logged against each job — what Generate Invoice bills from.' },
          { label: 'Clocked vs Job Hours', text: 'Spot unaccounted time between the clock and the jobs.' },
        ],
      },
    ],
    actions: [{ label: 'Open Time Tracking', icon: 'schedule', path: '/timesheets' }],
  },
  {
    id: 'documents',
    group: 'Admin',
    icon: 'folder',
    title: 'Documents',
    summary: 'Every quote, invoice and file, browsable like a folder.',
    sections: [
      {
        heading: 'Document Center',
        items: [
          { label: 'Browse', text: 'Folders by type, sortable by name, date, size and what each file is linked to.' },
          { label: 'Open in place', text: 'Preview PDFs and images, then jump to the record they belong to.' },
          { label: 'Document design', text: 'Change how quotes and invoices look in Settings → Quotes & Invoices.' },
        ],
      },
    ],
    actions: [{ label: 'Open Documents', icon: 'folder', path: '/documents' }],
  },
  {
    id: 'reports',
    group: 'Admin',
    icon: 'bar_chart',
    title: 'Reports',
    summary: 'How the business is really doing.',
    sections: [
      {
        heading: 'Available reports',
        items: [
          { label: 'Business Overview', text: 'The headline numbers at a glance.' },
          { label: 'Revenue & Profit', text: 'Income and margins over time.' },
          { label: 'Job Performance and Job Costing', text: 'Which jobs make money, and why.' },
          { label: 'Technician Productivity and Timesheet & Labor', text: 'Hours, utilisation and labour cost.' },
          { label: 'Customer Analysis', text: 'Your best customers, who owes what, how old the debt is and who is over their credit limit.' },
          { label: 'Asset Maintenance and Inventory', text: 'Service compliance and stock value.' },
        ],
      },
    ],
    actions: [{ label: 'Open Reports', icon: 'bar_chart', path: '/reports' }],
  },
  {
    id: 'settings',
    group: 'Admin',
    icon: 'settings',
    title: 'Settings',
    summary: 'Make RELAY work the way your business does.',
    sections: [
      {
        heading: 'Do these first',
        items: [
          { label: 'Company Profile', text: 'Your logo, ABN and contact details appear on every quote and invoice.' },
          { label: 'Tax & Labor Rates', text: 'GST and the hourly rates quotes use.' },
          { label: 'Quotes & Invoices', text: 'Numbering, payment terms and document design.' },
        ],
      },
      {
        heading: 'Everything else',
        items: [
          { label: 'Templates & Forms', text: 'Task lists, compliance forms and quote templates.' },
          { label: 'Materials & Catalog / Storage Locations', text: 'Your price list and where stock lives.' },
          { label: 'System Options', text: 'Theme, fonts and defaults.' },
          { label: 'Local Storage', text: 'Backups for a local profile.' },
          { label: 'Users and permissions', text: 'Logins for your team and what each role can see.', cloud: true },
          { label: 'Payments, Email & Domain, Portals', text: 'Online payments, your own sender address and customer/contractor portals.', cloud: true },
        ],
      },
    ],
    actions: [
      { label: 'Take the settings tour', icon: 'tune', run: 'settings-tour' },
      { label: 'Open Company Profile', icon: 'business', path: '/settings?tab=company' },
    ],
  },

  // ── More ────────────────────────────────────────────────────────────────────
  {
    id: 'brny',
    group: 'More',
    icon: 'smart_toy',
    title: 'brny, your assistant',
    summary: 'Ask about the business or have brny do the work.',
    sections: [
      {
        heading: 'Using brny',
        items: [
          { label: 'Open it', text: 'The robot button in the top bar, or Shift + B from anywhere.' },
          { label: 'Ask questions', text: 'Plain English: "how many active jobs do we have?" or "who owes us money?"' },
          { label: 'Get things done', text: 'brny can create and update records and arrange your dashboard for you.' },
          { label: 'You stay in control', text: 'Risky actions — sending invoices, recording payments, converting quotes, deleting jobs — show an approval card first.' },
          { label: 'Personality', text: 'Pick how brny talks to you in My Profile.' },
        ],
      },
    ],
    prompts: ['show me overdue invoices', 'how many active jobs do we have?', 'add a schedule widget'],
  },
  {
    id: 'shortcuts',
    group: 'More',
    icon: 'keyboard',
    title: 'Keyboard shortcuts',
    summary: 'Get around faster.',
    sections: [
      {
        heading: 'Anywhere',
        items: [
          { label: 'Ctrl / ⌘ + K, or /', text: 'Search customers, jobs, quotes and invoices.' },
          { label: 'Shift + B', text: 'Open or close brny.' },
          { label: 'Esc', text: 'Close a dialog or panel, or leave a text field.' },
        ],
      },
      {
        heading: 'Tours and canvas',
        items: [
          { label: '← / →', text: 'Step back and forward through a tour.' },
          { label: 'Double-click', text: 'Add a note on empty dashboard canvas.' },
        ],
      },
    ],
  },
];

/** Topics this account should see: Cloud companies are not sold Cloud. */
export function visibleTopics({ cloud = false } = {}, topics = HELP_TOPICS) {
  return topics.filter(t => !(cloud && t.localOnly));
}

export function getHelpTopic(id) {
  return HELP_TOPICS.find(t => t.id === id) || null;
}

function haystack(...parts) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Search topics and their items. Every word in the query must match somewhere.
 * Returns [{ topic, item|null }] — topic-level hits first, then item hits.
 */
export function searchHelp(query, topics = HELP_TOPICS) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const matches = (text) => words.every(w => text.includes(w));

  const topicHits = [];
  const itemHits = [];
  for (const topic of topics) {
    if (matches(haystack(topic.title, topic.summary, topic.group))) topicHits.push({ topic, item: null });
    for (const section of topic.sections || []) {
      for (const item of section.items || []) {
        if (matches(haystack(item.label, item.text, section.heading, topic.title))) itemHits.push({ topic, item });
      }
    }
  }
  return [...topicHits, ...itemHits];
}

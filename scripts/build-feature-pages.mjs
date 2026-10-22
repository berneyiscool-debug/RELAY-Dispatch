// ============================================
// RELAY — BUILD THE FEATURE PAGES
// ============================================
// One page per sidebar section (site/features/<slug>/), with one section on the
// page for each tab in that section. The header and footer are copied from
// site/index.html so the marketing pages never drift apart, and every link is
// rewritten to an absolute path so it works from a subpage.
//
// The copy below was written from the app's own labels (src/components/Sidebar.js
// and the page files under src/pages). Change a feature here only when the app
// changes, and keep each bullet something a tab really does.
//
// Run with: node scripts/build-feature-pages.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(repoRoot, 'site');
const home = readFileSync(path.join(siteDir, 'index.html'), 'utf8');

/** Each section is a page; each tab is a block on that page. */
export const SECTIONS = [
  {
    slug: 'dashboard',
    name: 'Dashboard',
    intro: 'The first screen after you sign in. Money, work and people at a glance, with widgets you can rearrange.',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        items: [
          'KPI cards for revenue invoiced, overdue money, active jobs, utilisation and quote win rate',
          'Widgets you can add, move and resize, including Job Status, Invoice Aging and Cash Flow',
          'Action lists: Chase List, Quotes to Follow Up, Unassigned Jobs Queue and Pending Approvals',
          'Revenue vs last month, a 30-day cash forecast and a GST / BAS estimate',
          'Staff availability, Crew Week Ahead and today\'s schedule',
          'Low stock, expiring documents and upcoming maintenance, so nothing sneaks up',
          'A reset button that puts the default layout back',
        ],
      },
    ],
  },
  {
    slug: 'schedule',
    name: 'Schedule',
    intro: 'Where the day is planned. One column for each person, with jobs, leave and activities in the same place.',
    tabs: [
      {
        id: 'schedule',
        name: 'Schedule',
        items: [
          'Day and week views with a column for each crew member',
          'Add a job to the schedule, a team meeting, a calendar blockout or leave and time off',
          'Route panel to order a crew\'s jobs and re-time the day',
          'See who is clocked in and what attendance looks like across the team',
          'Right-click or drag a job to change its status',
          'Activity calendar for calls, callbacks and meetings, on a daily, fortnightly or monthly repeat',
        ],
      },
    ],
  },
  {
    slug: 'workflow',
    name: 'Workflow',
    intro: 'Everything from the first enquiry to the final payment, in the order the work happens.',
    tabs: [
      {
        id: 'notifications',
        name: 'Notifications',
        items: [
          'Client requests, field faults and maintenance alerts in one list',
          'Turn a request into a quote, a job or a dispatch',
          'Assign a technician, reschedule a maintenance visit or send a job out from the notification',
          'Track which notifications have been converted, and what they became',
        ],
      },
      {
        id: 'leads',
        name: 'Leads',
        items: [
          'Leads grouped by stage, so you can see the whole pipeline at once',
          'Assign a sales representative and a priority to each lead',
          'Weighted forecast, budget variance and days idle on every lead',
          'Convert a lead into a quote when it\'s ready',
        ],
      },
      {
        id: 'quotes',
        name: 'Quotes',
        items: [
          'Quotes built in sections for equipment, installation and labour, with subtotals',
          'Labour rates and materials per line, with your own markup',
          'Customers accept and sign online, with a handwritten signature on the quote',
          'Save a quote as a template, then import it into the next one',
          'Convert accepted quotes into jobs, and send quotes in batches',
        ],
      },
      {
        id: 'jobs',
        name: 'Jobs',
        items: [
          'Assign technicians, change status and reschedule from the list',
          'Book time against each job\'s tasks, so labour is recorded as the work happens',
          'Bulk reschedule and batch invoicing across many jobs',
          'Combine several jobs into one invoice',
        ],
      },
      {
        id: 'invoices',
        name: 'Invoices',
        items: [
          'Invoices from a quote or a job, with the original quoted amount kept alongside',
          'Margin analysis on each invoice, so you know what it earned',
          'Record payments by bank transfer, cheque, card or other, then mark the invoice paid',
          'Send payment reminders in bulk, or one at a time',
          'Combine invoices and export a CSV for your accounting package',
        ],
      },
      {
        id: 'recurring-templates',
        name: 'Recurring Templates',
        items: [
          'Set up work that repeats, with a frequency and the days it runs',
          'See every job a template has created',
        ],
      },
      {
        id: 'projects',
        name: 'Projects',
        items: [
          'Projects with a site address, a description and a scope',
          'Parent and child projects for larger builds',
          'Financial summary per project: invoiced to date, amount paid and gross profit',
          'Split costs across cost centres',
        ],
      },
    ],
  },
  {
    slug: 'people',
    name: 'People',
    intro: 'The customers, contractors and suppliers you work with, and everything you know about them.',
    tabs: [
      {
        id: 'customers',
        name: 'Customers',
        items: [
          'Active, inactive and blacklisted status on every customer',
          'Contacts, sites and the assets installed at each one',
          'Financial summary and a credit limit per customer',
          'Email or call a customer straight from the list',
        ],
      },
      {
        id: 'contractors',
        name: 'Contractors',
        items: [
          'Business details and compliance records for each subcontractor',
          'Subcontractors see only the jobs you give them',
          'Activate or deactivate a contractor without losing their history',
        ],
      },
      {
        id: 'suppliers',
        name: 'Suppliers',
        items: [
          'Supplier categories and payment terms',
          'Contact details for ordering, with activate and deactivate',
        ],
      },
    ],
  },
  {
    slug: 'resources',
    name: 'Resources',
    intro: 'The things you install, keep and buy: assets, stock and purchase orders.',
    tabs: [
      {
        id: 'assets',
        name: 'Assets',
        items: [
          'Track each installed asset with its name, type and install date',
          'Status at a glance: commissioning, active, in maintenance, due soon or overdue',
          'Link assets to the customer site where they are installed',
        ],
      },
      {
        id: 'stock',
        name: 'Stock',
        items: [
          'Stock items by location, with the stock on hand in each',
          'Adjust prices and categories from the item',
          'Kit bundles for jobs that always use the same parts',
          'Printable barcode sheets',
        ],
      },
      {
        id: 'purchase-orders',
        name: 'Purchase Orders',
        items: [
          'Raise purchase orders against a job, so costs are tied to the work',
          'Track each order as issued, received or cancelled',
          'Mark an order received when the goods arrive',
        ],
      },
    ],
  },
  {
    slug: 'admin',
    name: 'Admin',
    intro: 'Time, files, reports and the settings that run the business.',
    tabs: [
      {
        id: 'time-tracking',
        name: 'Time Tracking',
        items: [
          'Log time against jobs, with a description of the work',
          'Hours by technician, with the job hours and tasks each person booked',
          'Attendance records and pay runs',
          'Export timesheets as a CSV',
        ],
      },
      {
        id: 'documents',
        name: 'Documents',
        items: [
          'A folder browser for the files your business keeps',
          'Upload files and move them between folders',
          'Share a file by link, to another app through your device\'s share menu, or with the company',
        ],
      },
      {
        id: 'reports',
        name: 'Reports',
        items: [
          'Business overview with RELAY Insights that point out what\'s going well and what needs a look',
          'Jobs and invoices by status, and job distribution',
          'Revenue and profit, job costing and technician productivity',
          'Asset maintenance, customer analysis and an inventory report',
          'Export any report as a CSV',
        ],
      },
      {
        id: 'settings',
        name: 'Settings',
        items: [
          'Users and permissions, with the option to deactivate and reactivate a user',
          'Choose which automatic emails go out: quotes with an accept link, invoices with a pay link, receipts, reminders and portal invites',
          'Email templates and a document studio for quote and form templates',
          'Company details and a lead and market profile',
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Shared pieces, copied out of the homepage so both stay in step.
// ---------------------------------------------------------------------------

const grab = (pattern, label) => {
  const match = home.match(pattern);
  if (!match) throw new Error(`site/index.html has no ${label}`);
  return match[0];
};

const headerHtml = grab(/<header class="site-header">[\s\S]*?<\/header>/, 'header');
const footerHtml = grab(/<footer class="site-footer">[\s\S]*?<\/footer>/, 'footer');
const headHtml = grab(/<meta name="viewport"[^>]*>/, 'viewport meta');

/** Homepage fragments become absolute, so they resolve from /features/<slug>/. */
const absolutise = (html) => html
  .replace(/href="#top"/g, 'href="/"')
  .replace(/href="#(features|pricing|compare|download)"/g, 'href="/#$1"')
  .replace(/href="(terms|privacy|refunds|acceptable-use)\/"/g, 'href="/$1/"');

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The dropdown needs every feature page and tab, so it is generated here from
// the same list and injected into the header's Features link.
const dropdownHtml = () => `<div class="nav-dropdown">
        <a href="/#features" class="nav-dropdown__trigger" aria-haspopup="true" aria-expanded="false">Features</a>
        <div class="nav-dropdown__panel" role="list">
${SECTIONS.map((section) => `          <div class="nav-dropdown__group" role="listitem">
            <a href="/features/${section.slug}/" class="nav-dropdown__section">${section.name}</a>
${section.tabs.map((tab) => `            <a href="/features/${section.slug}/#${tab.id}" class="nav-dropdown__link">${tab.name}</a>`).join('\n')}
          </div>`).join('\n')}
        </div>
      </div>`;

// The homepage header already carries the dropdown after the first run, so the
// generated one is only swapped in while the plain link is still there.
const headerWithDropdown = headerHtml.includes('nav-dropdown')
  ? absolutise(headerHtml)
  : absolutise(headerHtml).replace('<a href="/#features">Features</a>', dropdownHtml());

// ---------------------------------------------------------------------------
// Page template
// ---------------------------------------------------------------------------

const pageHtml = (section) => {
  const title = `${section.name} features — RELAY Dispatch`;
  const description = `${section.intro} ${section.tabs.map((t) => t.name).join(', ')}.`;
  const jump = section.tabs.length > 1
    ? `      <nav class="feature-jump" aria-label="On this page">
${section.tabs.map((t) => `        <a href="#${t.id}">${escapeHtml(t.name)}</a>`).join('\n')}
      </nav>
`
    : '';
  const blocks = section.tabs.map((tab) => `      <section class="feature-tab" id="${tab.id}" aria-labelledby="${tab.id}-heading">
        <h2 class="feature-tab__title" id="${tab.id}-heading">${escapeHtml(tab.name)}</h2>
        <ul class="feature-tab__list">
${tab.items.map((item) => `          <li>${escapeHtml(item)}</li>`).join('\n')}
        </ul>
      </section>`).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
${headHtml}
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="https://relaydispatch.com.au/features/${section.slug}/">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="preload" href="/assets/fonts/ibm-plex-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>

${headerWithDropdown}

<main id="main" class="feature-page">
  <div class="feature-page__inner">
    <p class="eyebrow"><a href="/#features">All features</a></p>
    <h1 class="feature-page__title">${escapeHtml(section.name)}</h1>
    <p class="feature-page__intro">${escapeHtml(section.intro)}</p>
${jump}
${blocks}

    <div class="feature-cta">
      <p>Free for one user, forever. Add the crew from $18 + GST per user a month.</p>
      <div class="feature-cta__actions">
        <a class="btn btn--md btn--primary" href="/#download">Download free for Windows</a>
        <a class="btn btn--md btn--secondary" href="/app/#/login">Try Cloud free for 14 days</a>
      </div>
    </div>
  </div>
</main>

${footerHtml.replace(/href="\/terms\/"|href="terms\/"/g, 'href="/terms/"')}

</body>
</html>
`;
};

// ---------------------------------------------------------------------------

for (const section of SECTIONS) {
  const dir = path.join(siteDir, 'features', section.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), pageHtml(section));
  console.log(`site/features/${section.slug}/index.html  (${section.tabs.length} tab${section.tabs.length === 1 ? '' : 's'})`);
}

// The homepage header gets the same dropdown. Once it is in place the plain
// link is gone, so running the script again leaves the file untouched.
const homeLink = '<a href="#features">Features</a>';
if (home.includes(homeLink)) {
  const homeDropdown = dropdownHtml().replace('href="/#features"', 'href="#features"');
  writeFileSync(path.join(siteDir, 'index.html'), home.replace(homeLink, homeDropdown));
  console.log('site/index.html  (Features dropdown added)');
}

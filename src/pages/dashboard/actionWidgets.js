// ============================================
// RELAY — DASHBOARD ACTION WIDGETS
// ============================================
// Widgets that each answer "what needs doing?": quotes and invoices to chase,
// the cash forecast, the BAS estimate, jobs at risk, the crew's week, deliveries,
// waiting leads, portal activity, the revenue goal and expiring contractor
// documents. The numbers come from utils/dashboardLists.js; this file draws
// them and handles the few buttons (resend a quote, remind about an invoice,
// set the revenue goal).

import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { formatCurrency } from '../../utils/kpis.js';
import {
  quotesToFollowUp, chaseList, cashForecast, basEstimate, jobsAtRisk, crewWeek,
  deliveriesDue, leadsWaiting, portalActivity, revenueGoal, expiringDocuments,
} from '../../utils/dashboardLists.js';
import { emailUnavailableReason, sendQuoteEmail, sendInvoiceReminder } from '../../utils/documentEmails.js';

const snap = (...collections) => Object.fromEntries(collections.map(c => [c, store.getAll(c) || []]));
const esc = (v) => escapeHTML(String(v ?? ''));
const money = (n) => formatCurrency(n);
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const shortDate = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
const ago = (d) => {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};
const customerName = (c) => c.company || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Customer';

function empty(icon, message) {
  return `<div class="aw-empty"><span class="material-icons-outlined" aria-hidden="true">${icon}</span><span>${esc(message)}</span></div>`;
}

function row({ href, title, tag, tagTone = '', sub, side = '' }) {
  return `
    <div class="aw-row">
      <div class="aw-main">
        <div class="aw-title">${href ? `<a href="#${esc(href)}">${title}</a>` : title}${tag ? ` <span class="aw-tag ${tagTone}">${esc(tag)}</span>` : ''}</div>
        ${sub ? `<div class="aw-sub">${sub}</div>` : ''}
      </div>
      ${side ? `<div class="aw-side">${side}</div>` : ''}
    </div>`;
}

const summary = (text) => `<div class="aw-summary">${text}</div>`;

// A button that sends an email, or — when email can't be sent — a link to the
// document with the reason as its tooltip.
function emailButton({ action, template, doc, label, href }) {
  const reason = emailUnavailableReason(template, doc);
  if (reason) return `<a class="btn btn-secondary btn-sm aw-btn" href="#${esc(href)}" title="${esc(reason)}">Open</a>`;
  return `<button type="button" class="btn btn-secondary btn-sm aw-btn" data-aw-action="${action}" data-id="${esc(doc.id)}">${esc(label)}</button>`;
}

// ── Renderers ────────────────────────────────────────────────────────────────

function renderQuotesFollowUp() {
  const rows = quotesToFollowUp(snap('quotes'));
  if (!rows.length) return empty('task_alt', 'No quotes need a follow-up');
  const value = rows.reduce((s, r) => s + (Number(r.quote.subtotal) || 0), 0);
  return summary(`${plural(rows.length, 'quote')} · ${money(value)} waiting`) + `<div class="aw-list">${rows.map(({ quote: q, reason, waiting, expiresIn }) => row({
    href: `/quotes/${q.id}`,
    title: esc(q.number || 'Quote'),
    tag: reason === 'expiring' ? (expiresIn === 0 ? 'Expires today' : `Expires in ${expiresIn}d`) : `Waiting ${waiting}d`,
    tagTone: reason === 'expiring' ? 'warn' : '',
    sub: `${esc(q.customerName)} · ${money(q.subtotal)}${q.title ? ` · ${esc(q.title)}` : ''}`,
    side: emailButton({ action: 'resend-quote', template: 'quote', doc: q, label: 'Resend', href: `/quotes/${q.id}` }),
  })).join('')}</div>`;
}

function renderChaseList() {
  const rows = chaseList(snap('invoices', 'emailLog'));
  if (!rows.length) return empty('task_alt', 'Nothing overdue');
  const total = rows.reduce((s, r) => s + r.balance, 0);
  return summary(`${plural(rows.length, 'invoice')} · ${money(total)} overdue`) + `<div class="aw-list">${rows.map(({ invoice: inv, balance, daysOverdue, lastReminder }) => row({
    href: `/invoices/${inv.id}`,
    title: esc(inv.number || 'Invoice'),
    tag: `${daysOverdue}d overdue`,
    tagTone: daysOverdue > 30 ? 'bad' : 'warn',
    sub: `${esc(inv.customerName)} · ${money(balance)} owing · ${lastReminder ? `reminded ${ago(lastReminder)}` : 'no reminder yet'}`,
    side: emailButton({ action: 'remind-invoice', template: 'reminder', doc: inv, label: 'Remind', href: `/invoices/${inv.id}` }),
  })).join('')}</div>`;
}

function renderCashForecast() {
  const f = cashForecast(snap('invoices', 'quotes', 'jobs'));
  if (!f.total && !f.toInvoice) return empty('account_balance_wallet', 'No money owing or waiting to be invoiced');
  const max = Math.max(f.overdue, ...f.buckets.map(b => b.amount), 1);
  const bar = (label, amount, tone, note) => `
    <div class="aw-bar-row">
      <span class="aw-bar-label">${esc(label)}</span>
      <div class="aw-bar"><div class="aw-bar-fill ${tone}" style="width:${(amount / max * 100).toFixed(1)}%"></div></div>
      <span class="aw-bar-value">${money(amount)}</span>
      ${note ? `<span class="aw-bar-note">${esc(note)}</span>` : '<span class="aw-bar-note"></span>'}
    </div>`;
  return summary(`${money(f.total)} due in the next ${f.buckets.length} weeks <span class="aw-muted">incl. GST</span>`)
    + `<div class="aw-bars">
      ${f.overdue ? bar('Overdue', f.overdue, 'bad', plural(f.overdueCount, 'inv')) : ''}
      ${f.buckets.map((b, i) => bar(i === 0 ? 'This week' : `w/c ${shortDate(b.start)}`, b.amount, '', b.count ? plural(b.count, 'inv') : '')).join('')}
    </div>`
    + (f.toInvoice ? `<a class="aw-footnote" href="#/jobs?filter=ready-to-invoice">+ ${money(f.toInvoice)} won but not yet invoiced (${plural(f.toInvoiceCount, 'job or quote', 'jobs and quotes')})</a>` : '');
}

function renderBasEstimate() {
  const b = basEstimate(snap('invoices', 'purchaseOrders'));
  const dueTone = b.daysToDue <= 14 ? 'warn' : '';
  return `
    <div class="aw-figure">
      <div class="aw-figure-label">GST to pay · ${esc(b.label)}</div>
      <div class="aw-figure-value">${money(b.net)}</div>
      <div class="aw-figure-lines">
        <span>Collected <strong>${money(b.collected)}</strong> <span class="aw-muted">(${plural(b.invoiceCount, 'invoice')})</span></span>
        <span>Credits <strong>−${money(b.credits)}</strong> <span class="aw-muted">(${plural(b.poCount, 'PO')})</span></span>
      </div>
      <div class="aw-tag ${dueTone}">BAS due ${shortDate(b.dueDate)} · ${b.daysToDue}d</div>
      <div class="aw-muted aw-fine">Estimate: accrual basis, purchases from POs only. Check with your accountant.</div>
    </div>`;
}

function renderJobsAtRisk() {
  const rows = jobsAtRisk(snap('jobs', 'timesheets'));
  if (!rows.length) return empty('task_alt', 'No jobs over budget or running late');
  return summary(plural(rows.length, 'job')) + `<div class="aw-list">${rows.map(({ job: j, reasons }) => {
    const over = reasons.find(r => r.type === 'over-hours');
    const late = reasons.find(r => r.type === 'late');
    const tags = [over ? `${Math.round(over.over * 100)}% over hours` : '', late ? `${late.daysLate}d late` : ''].filter(Boolean).join(' · ');
    return row({
      href: `/jobs/${j.id}`,
      title: esc(j.number || 'Job'),
      tag: tags,
      tagTone: over ? 'bad' : 'warn',
      sub: `${esc(j.title || '')} · ${esc(j.customerName || '')}${over ? ` · ${over.hours.toFixed(1)} of ${over.estimated} h` : ''}${late ? ` · booked ${shortDate(late.date)}` : ''}`,
    });
  }).join('')}</div>`;
}

function renderCrewWeek() {
  const { days, rows } = crewWeek(snap('schedule', 'technicians'));
  if (!rows.length) return empty('groups', 'Add staff to see their week');
  const cell = (c) => {
    if (!c.capacity && !c.booked) return `<td class="aw-cell off" title="${c.leave ? 'Leave' : 'Not working'}">${c.leave ? 'L' : ''}</td>`;
    const pct = c.capacity ? c.booked / c.capacity : 2;
    const tone = pct > 1 ? 'over' : pct >= 0.75 ? 'full' : pct >= 0.25 ? 'part' : 'free';
    return `<td class="aw-cell ${tone}" title="${c.booked.toFixed(1)} of ${c.capacity} h booked${c.leave ? `, ${c.leave} h leave` : ''}">${c.booked ? Math.round(c.booked) : ''}</td>`;
  };
  return `
    <div class="aw-heat-wrap"><table class="aw-heat">
      <thead><tr><th></th>${days.map(d => `<th>${d.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 2)}<br><span>${d.getDate()}</span></th>`).join('')}<th>Week</th></tr></thead>
      <tbody>${rows.map(r => `
        <tr><th class="aw-heat-name" title="${esc(r.tech.name)}">${esc((r.tech.name || '').split(' ')[0])}</th>${r.cells.map(cell).join('')}
        <td class="aw-heat-total ${r.load > 1 ? 'over' : ''}">${r.load == null ? '—' : `${Math.round(r.load * 100)}%`}</td></tr>`).join('')}
      </tbody>
    </table></div>
    <div class="aw-legend"><span class="free"></span>Free <span class="part"></span>Part <span class="full"></span>Full <span class="over"></span>Over</div>`;
}

function renderDeliveriesDue() {
  const rows = deliveriesDue(snap('purchaseOrders'));
  if (!rows.length) return empty('local_shipping', 'No deliveries due this week');
  const late = rows.filter(r => r.overdue).length;
  return summary(`${plural(rows.length, 'order')}${late ? ` · <span class="aw-bad">${late} late</span>` : ''}`) + `<div class="aw-list">${rows.map(({ po, overdue, daysLate, inDays, expected }) => row({
    href: '/purchase-orders',
    title: esc(po.number || 'PO'),
    tag: overdue ? `${daysLate}d late` : inDays === 0 ? 'Due today' : `Due ${shortDate(expected)}`,
    tagTone: overdue ? 'bad' : inDays === 0 ? 'warn' : '',
    sub: `${esc(po.supplierName || 'Supplier')}${po.jobNumber ? ` · for ${po.jobId ? `<a href="#/jobs/${esc(po.jobId)}">${esc(po.jobNumber)}</a>` : esc(po.jobNumber)}` : ''} · ${money(po.total)}`,
  })).join('')}</div>`;
}

function renderLeadsWaiting() {
  const rows = leadsWaiting(snap('leads'));
  if (!rows.length) return empty('task_alt', 'Every new lead has been contacted');
  return summary(`${plural(rows.length, 'lead')} not contacted after 24 h`) + `<div class="aw-list">${rows.map(({ lead: l, hoursWaiting }) => row({
    href: `/leads/${l.id}`,
    title: esc(l.title || l.number || 'Lead'),
    tag: hoursWaiting >= 48 ? `${Math.floor(hoursWaiting / 24)}d waiting` : `${hoursWaiting}h waiting`,
    tagTone: hoursWaiting >= 48 ? 'bad' : 'warn',
    sub: `${esc(l.customerName || l.contactName || '')}${l.source ? ` · ${esc(l.source)}` : ''}${l.phone ? ` · <a href="tel:${esc(l.phone)}">${esc(l.phone)}</a>` : ''}`,
  })).join('')}</div>`;
}

const PORTAL_ICONS = { signed: 'draw', declined: 'cancel', request: 'support_agent', visit: 'visibility' };

function renderPortalActivity() {
  const events = portalActivity(snap('quotes', 'notifications', 'customers'));
  if (!events.length) return empty('forum', 'No customer activity in the last 14 days');
  return `<div class="aw-feed">${events.slice(0, 30).map(e => `
    <a class="aw-feed-item" href="#${esc(e.href)}">
      <span class="material-icons-outlined aw-feed-icon ${e.type}" aria-hidden="true">${PORTAL_ICONS[e.type]}</span>
      <span class="aw-feed-text">${esc(e.label)}${e.amount ? ` · <strong>${money(e.amount)}</strong>` : ''}</span>
      <span class="aw-feed-time">${ago(e.at)}</span>
    </a>`).join('')}</div>`;
}

function renderRevenueGoal(data, item) {
  const target = Number(item?.config?.target) || 0;
  if (!target) {
    return `<div class="aw-empty"><span class="material-icons-outlined" aria-hidden="true">flag</span>
      <span>Set a monthly revenue target to track progress.</span>
      <button type="button" class="btn btn-primary btn-sm" data-aw-action="set-goal" data-instance-id="${esc(item?.instanceId)}">Set target</button></div>`;
  }
  const g = revenueGoal(snap('invoices'), { target });
  const pct = Math.min(1, g.pct || 0), expectedPct = Math.min(1, g.expected / target);
  const ahead = g.ahead >= 0;
  return `
    <div class="aw-figure">
      <div class="aw-figure-label">This month · ex GST</div>
      <div class="aw-figure-value">${money(g.invoiced)} <span class="aw-muted">of ${money(target)}</span></div>
      <div class="aw-goal" title="Where you should be by today: ${money(g.expected)}">
        <div class="aw-goal-fill ${ahead ? 'good' : ''}" style="width:${(pct * 100).toFixed(1)}%"></div>
        <div class="aw-goal-marker" style="left:${(expectedPct * 100).toFixed(1)}%"></div>
      </div>
      <div class="aw-figure-lines">
        <span class="${ahead ? 'aw-good' : 'aw-bad'}">${money(Math.abs(g.ahead))} ${ahead ? 'ahead of' : 'behind'} pace</span>
        <span>${g.invoiced >= target ? 'Target reached' : `${money(g.perDayNeeded)} a day for ${plural(g.workdaysLeft, 'working day')}`}</span>
      </div>
    </div>`;
}

function renderExpiringDocs() {
  const rows = expiringDocuments(snap('contractors'));
  if (!rows.length) return empty('gpp_good', 'All contractor documents are current');
  const expired = rows.filter(r => r.expired).length;
  return summary(`${plural(rows.length, 'document')}${expired ? ` · <span class="aw-bad">${expired} expired</span>` : ''}`) + `<div class="aw-list">${rows.map(({ contractor: c, doc, days, expired: isExpired, expiry }) => row({
    href: `/contractors/${c.id}`,
    title: esc(c.businessName || c.name || 'Contractor'),
    tag: isExpired ? `Expired ${-days}d ago` : days === 0 ? 'Expires today' : `Expires in ${days}d`,
    tagTone: isExpired ? 'bad' : 'warn',
    sub: `${esc(doc.type)}${doc.number ? ` · ${esc(doc.number)}` : ''} · ${shortDate(expiry)}`,
  })).join('')}</div>`;
}

// ── Registry ─────────────────────────────────────────────────────────────────
// Merged into the dashboard's MODULES / WIDGET_PERMS / WIDGET_DEPS.

export const ACTION_WIDGETS = {
  'quotes-follow-up':  { title: 'Quotes to Follow Up',      defaultW: 'M', defaultH: 'tall',     perm: ['Quotes', 'view'],          deps: ['quotes', 'customers'],                render: renderQuotesFollowUp },
  'chase-list':        { title: 'Chase List',               defaultW: 'M', defaultH: 'tall',     perm: ['Invoices', 'view'],        deps: ['invoices', 'emailLog', 'customers'],  render: renderChaseList },
  'cash-forecast':     { title: 'Cash Forecast (30 Days)',  defaultW: 'M', defaultH: 'tall',     perm: ['Invoices', 'view'],        deps: ['invoices', 'quotes', 'jobs'],         render: renderCashForecast },
  'bas-estimate':      { title: 'GST / BAS Estimate',       defaultW: 'S', defaultH: 'tall',     perm: ['Invoices', 'view'],        deps: ['invoices', 'purchaseOrders'],         render: renderBasEstimate },
  'jobs-at-risk':      { title: 'Jobs at Risk',             defaultW: 'M', defaultH: 'tall',     perm: ['Jobs', 'view'],            deps: ['jobs', 'timesheets'],                 render: renderJobsAtRisk },
  'crew-week':         { title: 'Crew Week Ahead',          defaultW: 'L', defaultH: 'tall',     perm: ['Schedule', 'view'],        deps: ['schedule', 'technicians'],            render: renderCrewWeek },
  'deliveries-due':    { title: 'Deliveries Due',           defaultW: 'M', defaultH: 'tall',     perm: ['Purchase Orders', 'view'], deps: ['purchaseOrders'],                     render: renderDeliveriesDue },
  'leads-waiting':     { title: 'Leads Waiting',            defaultW: 'M', defaultH: 'tall',     perm: ['Leads', 'view'],           deps: ['leads'],                              render: renderLeadsWaiting },
  'portal-activity':   { title: 'Customer Portal Activity', defaultW: 'M', defaultH: 'tall',     perm: ['Customers', 'view'],       deps: ['quotes', 'notifications', 'customers'], render: renderPortalActivity },
  'revenue-goal':      { title: 'Revenue Goal',             defaultW: 'S', defaultH: 'tall',     perm: ['Invoices', 'view'],        deps: ['invoices'],                           render: renderRevenueGoal, configurable: true },
  'expiring-docs':     { title: 'Expiring Documents',       defaultW: 'M', defaultH: 'tall',     perm: ['Contractors', 'view'],     deps: ['contractors'],                        render: renderExpiringDocs },
};

// ── Buttons ──────────────────────────────────────────────────────────────────

/**
 * Wire the action buttons inside `root` (a widget body or the whole canvas).
 * onSetGoal(instanceId) opens the revenue-goal editor for that widget.
 */
export function wireActionWidgets(root, { onSetGoal } = {}) {
  root.querySelectorAll('[data-aw-action]').forEach(btn => {
    if (btn.dataset.awWired) return;
    btn.dataset.awWired = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { awAction: action, id, instanceId } = btn.dataset;
      if (action === 'set-goal') { onSetGoal && onSetGoal(instanceId); return; }

      const isQuote = action === 'resend-quote';
      const doc = store.getById(isQuote ? 'quotes' : 'invoices', id);
      if (!doc) return;
      const [{ showConfirm }, { showToast }] = await Promise.all([
        import('../../utils/confirmDialog.js'), import('../../components/Notifications.js'),
      ]);
      const ok = await showConfirm(
        isQuote ? `Email ${doc.number || 'this quote'} to ${doc.customerName || 'the customer'} again?`
          : `Send a payment reminder for ${doc.number || 'this invoice'} to ${doc.customerName || 'the customer'}?`,
        { title: isQuote ? 'Resend quote' : 'Send reminder', confirmLabel: isQuote ? 'Resend' : 'Send reminder' });
      if (!ok) return;
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      try {
        const to = isQuote ? await sendQuoteEmail(doc) : await sendInvoiceReminder(doc);
        showToast(isQuote ? `Quote emailed to ${to}` : `Reminder sent to ${to}`, 'success');
        btn.textContent = 'Sent';
      } catch (err) {
        showToast(err.message || 'Could not send the email', 'error');
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  });
}

/** Ask for the monthly revenue target; calls onSave(number) with a positive amount. */
export async function openRevenueGoalEditor(current, onSave) {
  const { showModal } = await import('../../components/Modal.js');
  const content = document.createElement('div');
  content.innerHTML = `
    <label class="form-label" for="aw-goal-input">Monthly revenue target (ex GST)</label>
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-weight:600;">$</span>
      <input id="aw-goal-input" class="form-input" type="number" min="1" step="100" inputmode="decimal" value="${current ? Number(current) : ''}" placeholder="e.g. 60000">
    </div>
    <p class="aw-muted" style="margin-top:8px;font-size:12px;">Measured against Revenue invoiced, the same as the KPI card.</p>`;
  showModal({
    title: 'Revenue goal',
    content,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      { label: 'Save', className: 'btn-primary', onClick: c => {
        const v = parseFloat(content.querySelector('#aw-goal-input').value);
        if (!(v > 0)) { content.querySelector('#aw-goal-input').focus(); return; }
        onSave(Math.round(v));
        c();
      } },
    ],
  });
  setTimeout(() => content.querySelector('#aw-goal-input')?.focus(), 50);
}

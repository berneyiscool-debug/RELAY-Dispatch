// ============================================
// RELAY — IN-APP ASSISTANT (shell + local command handler)
// ============================================
// Phase 1 (now): a slide-in chat panel with a lightweight, rule-based command handler
// that performs real actions against the dashboard + data. No API key / backend needed.
// Phase 2 (later): swap `runLocalCommand` for a Claude API call via a Netlify/Supabase
// function for full natural-language understanding. The UI here won't need to change.
// ============================================
import { store } from '../data/store.js';
import { showToast } from './Notifications.js';
import { supabase } from '../utils/supabase.js';
import { hasPermission } from '../utils/permissions.js';
import relayIcon from '../assets/relay-icon.svg?raw';

let panel = null;
let onStateChange = null;
let chatHistory = [];

const GREETINGS = [
  "Hi, I'm Relay. I can add page widgets, jump to your saved views, and fit or lock the canvas. Try “add a schedule widget” or ask “how many overdue invoices?”",
  "Hi, I'm Relay. How can I help you manage your dispatch and jobs today?",
  "Hello! Relay here. Try asking me to “add a schedule widget” or “show me the today view”. What's on your mind?",
  "Greetings! I'm your co-pilot Relay. I can help you create customers, assign jobs, or quickly look up metrics. What do you need?",
  "Hey! Relay is ready to assist. Need to check on overdue invoices, add a new job, or fit the canvas? Just let me know!",
  "Welcome back! I'm Relay, your dispatch assistant. How can I assist you with your operations today?",
  "Hi there! Relay here. I can help you manage your dispatch layout, check on jobs, and look up details. Try: “how many active jobs do we have?”",
  "Hello! Ready to dispatch? I can create quotes, jobs, and invoices for you. What can I do for you today?"
];

export function isRelayOpen() { return !!panel; }
export function onRelayToggle(cb) { onStateChange = cb; }

export function toggleRelay() { panel ? closeRelay() : openRelay(); }

export function openRelay() {
  if (panel) return;
  panel = document.createElement('div');
  panel.className = 'relay-panel';
  panel.innerHTML = `
    <div class="relay-head">
      <div class="relay-head-id">
        <span class="relay-avatar">${relayIcon}</span>
        <div>
          <div class="relay-name">Relay</div>
          <div class="relay-sub">Your assistant</div>
        </div>
      </div>
      <button class="relay-close" title="Close"><span class="material-icons-outlined">close</span></button>
    </div>
    <div class="relay-thread" id="relay-thread"></div>
    <div class="relay-input-wrap">
      <button class="relay-attach" title="Image support is coming soon" disabled><span class="material-icons-outlined">image</span></button>
      <textarea id="relay-input" class="relay-input" rows="1" placeholder="Ask Relay…  (try “add a jobs widget”)"></textarea>
      <button class="relay-send" id="relay-send" title="Send"><span class="material-icons-outlined">arrow_upward</span></button>
    </div>
    <div class="relay-foot">Early mode — local actions only. Full chat arrives with the backend.</div>
  `;
  document.body.appendChild(panel);
  // Force a reflow so the slide-in transition triggers reliably (rAF is paused in
  // background/headless tabs, which would leave the panel stuck off-screen).
  void panel.offsetWidth;
  panel.classList.add('open');

  const thread = panel.querySelector('#relay-thread');
  const input = panel.querySelector('#relay-input');
  const send = panel.querySelector('#relay-send');

  const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  addMessage(thread, 'relay', randomGreeting);

  const submit = async () => {
    const text = input.value.trim();
    if (!text) return;
    addMessage(thread, 'user', text);
    input.value = '';
    autoGrow(input);
    const typing = addTyping(thread);

    try {
      const isCloud = store.companyId && !store.companyId.startsWith('acct_');
      const s = store.getSettings();
      const ai = s.ai || {};
      
      if (isCloud && ai.enabled && ai.apiKey) {
        const response = await callAIEngine(text);
        typing.remove();
        addMessage(thread, 'relay', response);
      } else {
        // Fallback to rule-based local assistant
        setTimeout(() => {
          typing.remove();
          addMessage(thread, 'relay', runLocalCommand(text));
        }, 380);
      }
    } catch (err) {
      console.error('AI assistant failed, falling back to local commands:', err);
      typing.remove();
      addMessage(thread, 'relay', `[Error: ${err.message || err}]. Falling back to local assistant:\n\n` + runLocalCommand(text));
    }
  };

  send.addEventListener('click', submit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  input.addEventListener('input', () => autoGrow(input));
  panel.querySelector('.relay-close').addEventListener('click', closeRelay);
  document.addEventListener('keydown', escClose, true);

  setTimeout(() => input.focus(), 250);
  if (onStateChange) onStateChange(true);
}

export function closeRelay() {
  if (!panel) return;
  document.removeEventListener('keydown', escClose, true);
  const p = panel;
  panel = null;
  p.classList.remove('open');
  setTimeout(() => p.remove(), 220);
  if (onStateChange) onStateChange(false);
}

function escClose(e) { if (e.key === 'Escape') closeRelay(); }

function autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

function addMessage(thread, role, text) {
  const m = document.createElement('div');
  m.className = `relay-msg relay-msg-${role}`;
  m.innerHTML = `<div class="relay-bubble">${escapeHtml(text)}</div>`;
  thread.appendChild(m);
  thread.scrollTop = thread.scrollHeight;
  return m;
}

function addTyping(thread) {
  const m = document.createElement('div');
  m.className = 'relay-msg relay-msg-relay';
  m.innerHTML = `<div class="relay-bubble relay-typing"><span></span><span></span><span></span></div>`;
  thread.appendChild(m);
  thread.scrollTop = thread.scrollHeight;
  return m;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Local (no-LLM) command handler — performs real dashboard/data actions ──────────
const PAGE_WIDGETS = {
  jobs: 'page-jobs', quotes: 'page-quotes', leads: 'page-leads', invoices: 'page-invoices',
  notifications: 'page-notifications', customers: 'page-customers', contractors: 'page-contractors',
  suppliers: 'page-suppliers', assets: 'page-assets', stock: 'page-stock', timesheets: 'page-timesheets',
  timesheet: 'page-timesheets', schedule: 'page-schedule', 'purchase orders': 'page-purchase-orders',
  'purchase order': 'page-purchase-orders', po: 'page-purchase-orders', pos: 'page-purchase-orders',
};

function onDashboard() { return !!document.querySelector('#dash-viewport'); }
const NOT_ON_DASH = "That one works on the dashboard canvas — head to the Dashboard and ask me again.";

function runLocalCommand(raw) {
  const ff = window.__fieldForge || {};
  const t = raw.toLowerCase().trim();

  if (/\b(help|what can you|commands|capabilities)\b/.test(t)) {
    return "Right now I can:\n• Add a page widget — “add a jobs widget”\n• Jump to a saved view — “go to the finance view”\n• Fit everything — “fit the canvas”\n• Lock / unlock — “lock the canvas”\n• Quick counts — “how many overdue invoices?”\nFull conversation lands once my backend is connected.";
  }

  // Lock / unlock (dashboard canvas)
  if (/\bunlock\b/.test(t)) { if (!onDashboard()) return NOT_ON_DASH; ff.setLock?.(false); return "Canvas unlocked — drag away."; }
  if (/\block\b/.test(t)) { if (!onDashboard()) return NOT_ON_DASH; ff.setLock?.(true); return "Canvas locked 🔒 — no more accidental grabs."; }

  // Fit all
  if (/\b(fit|reset view|show everything|zoom to fit|fit all)\b/.test(t)) { if (!onDashboard()) return NOT_ON_DASH; ff.fitAll?.(); return "Fitted everything to the screen."; }

  // Add a widget
  if (/\badd\b/.test(t)) {
    const key = Object.keys(PAGE_WIDGETS).sort((a, b) => b.length - a.length).find(k => t.includes(k));
    if (key) {
      if (!onDashboard()) return NOT_ON_DASH;
      const title = ff.addWidgetById?.(PAGE_WIDGETS[key]);
      if (title === false) return `You don't have access to ${key}, so I can't add that one.`;
      if (title) return `Added the ${title} widget for you.`;
      return "I couldn't add that widget.";
    }
    return "Which page? Try “add a jobs widget” — I know jobs, quotes, leads, invoices, customers, assets, stock, schedule and more.";
  }

  // Jump to a saved view
  if (/\b(go to|jump to|take me to|show me|open)\b/.test(t)) {
    const m = t.match(/(?:go to|jump to|take me to|show me|open)\s+(?:the\s+)?(.+?)(?:\s+view)?\.?$/);
    if (m && m[1]) {
      if (!onDashboard()) return NOT_ON_DASH;
      const label = ff.flyToViewByName?.(m[1].trim());
      if (label) return `Jumped to “${label}”.`;
      return `I couldn't find a saved view called “${m[1].trim()}”.`;
    }
  }

  // Quick counts
  if (/how many|count|number of/.test(t)) {
    if (/overdue/.test(t)) return countMsg('overdue invoices', store.getAll('invoices').filter(i => i.status === 'Overdue').length);
    if (/active|in progress/.test(t) && /job/.test(t)) return countMsg('active jobs', store.getAll('jobs').filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length);
    if (/pending/.test(t) && /quote/.test(t)) return countMsg('pending quotes', store.getAll('quotes').filter(q => q.status === 'Sent' || q.status === 'Draft').length);
    if (/job/.test(t)) return countMsg('jobs', store.getAll('jobs').length);
    if (/quote/.test(t)) return countMsg('quotes', store.getAll('quotes').length);
    if (/invoice/.test(t)) return countMsg('invoices', store.getAll('invoices').length);
    if (/lead/.test(t)) return countMsg('leads', store.getAll('leads').length);
    if (/customer/.test(t)) return countMsg('customers', store.getAll('customers').length);
    if (/asset/.test(t)) return countMsg('assets', store.getAll('assets').length);
  }

  if (/\b(hi|hello|hey|yo)\b/.test(t)) return "Hey! Ask me to add a widget, jump to a view, or fit/lock the canvas.";
  if (/\b(thanks|thank you|cheers|ta)\b/.test(t)) return "Anytime. 👍";

  return "I'm still learning to chat freely — that arrives once my backend's connected. For now try: “add a jobs widget”, “go to the finance view”, “fit the canvas”, or “how many overdue invoices?”";
}

function countMsg(label, n) {
  return `You have ${n} ${label}.`;
}

// ── AI Engine completions call (DeepSeek) ───────────────────────────────────

async function callAIEngine(text) {
  chatHistory.push({ role: 'user', content: text });
  if (chatHistory.length > 20) {
    chatHistory = chatHistory.slice(-20); // Keep last 20 messages for context
  }

  const s = store.getSettings();
  const ai = s.ai || {};
  const basePrompt = ai.systemPrompt || 'You are Relay, an intelligent CRM co-pilot assistant. You help dispatchers manage jobs, quotes, invoices, and scheduling.';
  const systemPrompt = `${basePrompt}\n\n${getSystemContext()}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory
  ];

  let reply = '';
  const isCloud = store.companyId && !store.companyId.startsWith('acct_');

  if (isCloud) {
    // Call the secure Supabase Edge Function proxy
    const { data, error } = await supabase.functions.invoke('relay-copilot', {
      body: {
        messages,
        endpoint: ai.endpoint,
        model: ai.model
      }
    });

    if (error) {
      throw new Error(`Supabase Edge Function error: ${error.message || JSON.stringify(error)}`);
    }

    reply = data.choices?.[0]?.message?.content || '';
  } else {
    // Check if running inside Electron and secure API handler is exposed
    if (window.electronAPI && window.electronAPI.callDeepSeek) {
      const data = await window.electronAPI.callDeepSeek({
        messages,
        endpoint: ai.endpoint,
        model: ai.model
      });
      reply = data.choices?.[0]?.message?.content || '';
    } else {
      // Browser fetch fallback (direct connection)
      const res = await fetch(ai.endpoint || 'https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ai.apiKey}`
        },
        body: JSON.stringify({
          model: ai.model || 'deepseek-chat',
          messages: messages,
          temperature: 0.3
        })
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }

      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || '';
    }
  }

  chatHistory.push({ role: 'assistant', content: reply });
  return parseAndExecuteActions(reply);
}

function getSystemContext() {
  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];
  const quotes = store.getAll('quotes') || [];
  const customers = store.getAll('customers') || [];
  const technicians = store.getAll('technicians') || [];

  const activeJobs = jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled');
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft');

  const jobsList = activeJobs.slice(0, 8).map(j => `Job #${j.number || j.id}: ${j.title} (${j.status}) - Cust: ${j.customerName || 'None'} - Tech: ${j.technicianName || 'Unassigned'} - Date: ${j.scheduledDate || 'TBD'}`).join('\n');
  const overdueInvoicesList = overdueInvoices.slice(0, 8).map(i => `Invoice #${i.number || i.id}: ${i.title} - Total: $${i.total} - Due: ${i.dueDate || 'TBD'}`).join('\n');
  const techsList = technicians.map(t => `${t.name} (${t.role || 'Tech'}) - Username: ${t.username}`).join(', ');

  return `Current Live CRM Data Context (updated real-time):
- Active Technicians: ${techsList || 'None'}
- Total Registered Customers: ${customers.length}
- Active/Scheduled Jobs (${activeJobs.length}):
${jobsList || 'None'}
- Overdue Invoices (${overdueInvoices.length}):
${overdueInvoicesList || 'None'}
- Pending Quotes: ${pendingQuotes.length}

You can perform actions on the user interface and CRM database by appending action tags to the end of your response.
Action tags MUST follow these exact formats:
- To jump to a view: [ACTION: JUMP_VIEW, SavedViewName]
- To add a dashboard widget: [ACTION: ADD_WIDGET, WidgetID] (e.g. page-jobs, page-quotes, cash-flow, tech-map, today-schedule, recent-activity, recent-leads)
- To fit canvas: [ACTION: FIT_CANVAS]
- To lock/unlock canvas: [ACTION: LOCK_CANVAS, true] or [ACTION: LOCK_CANVAS, false]

- To create a new customer: [ACTION: CREATE_CUSTOMER, Type | First Name | Last Name | Company Name | Email | Phone | Address]
  - Type: Must be 'Commercial' (for companies/businesses) or 'Residential' (for individual people).
  - First Name: First name of the person.
  - Last Name: Last name of the person.
  - Company Name: Name of the company (leave empty for Residential).
  - Email: Extrapolate if not provided (e.g. name@company.com or name@example.com).
  - Phone: Extrapolate or leave empty.
  - Address: Extrapolate or leave empty.
  (Example: [ACTION: CREATE_CUSTOMER, Commercial | Barry | Buttons | Buttons Plumbing Pty Ltd | barry@buttonsplumbing.com | 0412345678 | 12 Spring St, Sydney])
- To create a job: [ACTION: CREATE_JOB, Title | Status | Customer Name | Technician Name | Scheduled Date | Est Hours | Notes]
  (Example: [ACTION: CREATE_JOB, Fix Leaking Tap | Scheduled | Barry Buttons | John Doe | 2026-07-05 | 2 | Please bring parts])
- To create a quote: [ACTION: CREATE_QUOTE, Title | Status | Customer Name | Subtotal | Tax | Total | Valid Until | Notes]
  (Example: [ACTION: CREATE_QUOTE, Rewiring Proposal | Sent | Barry Buttons | 1000 | 100 | 1100 | 2026-08-01 | Standard terms apply])
- To create an invoice: [ACTION: CREATE_INVOICE, Title | Status | Job Number | Customer Name | Subtotal | Tax | Total | Due Date | Notes]
  (Example: [ACTION: CREATE_INVOICE, Invoice for Tap Repair | Sent | 1005 | Barry Buttons | 150 | 15 | 165 | 2026-07-12 | Thank you])

- To update/modify an existing record: [ACTION: UPDATE_RECORD, Collection | ID or Number | Field | New Value]
  - Collection: jobs, customers, quotes, or invoices.
  - ID or Number: The record's ID, or its job/quote/invoice number (e.g. 1002).
  - Field: The field to update (e.g. status, scheduledDate, technicianName, notes, email, phone, address).
  - New Value: The new value to set.
  (Example: [ACTION: UPDATE_RECORD, jobs | 1002 | status | In Progress])
  (Example: [ACTION: UPDATE_RECORD, jobs | 1002 | technicianName | John Doe])

- To delete an existing record: [ACTION: DELETE_RECORD, Collection | ID or Number]
  - Collection: jobs, customers, quotes, or invoices.
  - ID or Number: The record's ID, or its job/quote/invoice number (e.g. 1002).
  (Example: [ACTION: DELETE_RECORD, jobs | 1002])

Always perform the requested action when asked (e.g. if the user says "add customer Barry Buttons", reply confirming you will do it and append the CREATE_CUSTOMER tag). Do not say you are unable to do it.`;
}

function parseAndExecuteActions(reply) {
  const actionRegex = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*([^\]]+))?\]/gi;
  let match;
  let cleanReply = reply;

  const ff = window.__fieldForge || {};

  while ((match = actionRegex.exec(reply)) !== null) {
    const action = match[1].toUpperCase().trim();
    const param = match[2] ? match[2].trim() : null;

    console.log(`Executing AI action: ${action} with param: ${param}`);

    try {
      if (action === 'ADD_WIDGET' && param) {
        const title = ff.addWidgetById?.(param);
        if (title) {
          showToast(`Relay added the "${title}" widget.`, 'success');
        }
      } else if (action === 'FIT_CANVAS') {
        ff.fitAll?.();
        showToast('Relay fitted the dashboard canvas.', 'info');
      } else if (action === 'LOCK_CANVAS') {
        const lock = param === 'true';
        ff.setLock?.(lock);
        showToast(`Relay ${lock ? 'locked' : 'unlocked'} the canvas.`, 'info');
      } else if (action === 'JUMP_VIEW' && param) {
        const label = ff.flyToViewByName?.(param);
        if (label) {
          showToast(`Relay jumped to saved view "${label}".`, 'info');
        }
      } else if (action === 'CREATE_CUSTOMER' && param) {
        if (!checkCollectionPermission('customers', 'create')) return;
        const parts = param.split('|').map(p => p.trim());
        const type = parts[0] || 'Residential';
        const firstName = parts[1] || '';
        const lastName = parts[2] || '';
        const companyName = parts[3] || '';
        const email = parts[4] || '';
        const phone = parts[5] || '';
        const address = parts[6] || '';

        const list = store.getAll('customers') || [];
        const newItem = {
          id: store.generateId(),
          first_name: firstName,
          last_name: lastName,
          company: companyName,
          email,
          phone,
          address,
          status: 'Active',
          type: type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('customers', list);
        const displayName = companyName || `${firstName} ${lastName}`.trim() || 'New Customer';
        showToast(`Created customer "${displayName}" successfully.`, 'success');

      } else if (action === 'CREATE_JOB' && param) {
        if (!checkCollectionPermission('jobs', 'create')) return;
        const parts = param.split('|').map(p => p.trim());
        const title = parts[0] || 'New Job';
        const status = parts[1] || 'Scheduled';
        const customerName = parts[2] || '';
        const techName = parts[3] || '';
        const scheduledDate = parts[4] || '';
        const estHours = Number(parts[5]) || 0;
        const notes = parts[6] || '';

        const list = store.getAll('jobs') || [];
        const nextNum = list.reduce((max, j) => {
          const num = parseInt(j.number) || 0;
          return num > max ? num : max;
        }, 1000) + 1;

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase() || c.company?.toLowerCase() === customerName.toLowerCase());

        const technicians = store.getAll('technicians') || [];
        const tech = technicians.find(t => t.name.toLowerCase() === techName.toLowerCase());

        const newItem = {
          id: store.generateId(),
          number: String(nextNum),
          title,
          status,
          customer_id: customer ? customer.id : null,
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : customerName,
          technician_id: tech ? tech.id : null,
          technicianName: tech ? tech.name : techName,
          scheduledDate,
          estimated_hours: estHours,
          notes,
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('jobs', list);
        showToast(`Created Job #${nextNum} "${title}" successfully.`, 'success');

      } else if (action === 'CREATE_QUOTE' && param) {
        if (!checkCollectionPermission('quotes', 'create')) return;
        const parts = param.split('|').map(p => p.trim());
        const title = parts[0] || 'New Quote';
        const status = parts[1] || 'Draft';
        const customerName = parts[2] || '';
        const subtotal = Number(parts[3]) || 0;
        const tax = Number(parts[4]) || 0;
        const total = Number(parts[5]) || 0;
        const validUntil = parts[6] || '';
        const notes = parts[7] || '';

        const list = store.getAll('quotes') || [];
        const nextNum = list.reduce((max, q) => {
          const num = parseInt(q.number) || 0;
          return num > max ? num : max;
        }, 1000) + 1;

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase());

        const newItem = {
          id: store.generateId(),
          number: String(nextNum),
          title,
          status,
          customer_id: customer ? customer.id : null,
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : customerName,
          subtotal,
          tax,
          total,
          valid_until: validUntil,
          notes,
          line_items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('quotes', list);
        showToast(`Created Quote #${nextNum} successfully.`, 'success');

      } else if (action === 'CREATE_INVOICE' && param) {
        if (!checkCollectionPermission('invoices', 'create')) return;
        const parts = param.split('|').map(p => p.trim());
        const title = parts[0] || 'New Invoice';
        const status = parts[1] || 'Sent';
        const jobNum = parts[2] || '';
        const customerName = parts[3] || '';
        const subtotal = Number(parts[4]) || 0;
        const tax = Number(parts[5]) || 0;
        const total = Number(parts[6]) || 0;
        const dueDate = parts[7] || '';
        const notes = parts[8] || '';

        const list = store.getAll('invoices') || [];
        const nextNum = list.reduce((max, i) => {
          const num = parseInt(i.number) || 0;
          return num > max ? num : max;
        }, 1000) + 1;

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase());

        const newItem = {
          id: store.generateId(),
          number: String(nextNum),
          title,
          status,
          job_id: jobNum,
          customer_id: customer ? customer.id : null,
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : customerName,
          subtotal,
          tax,
          total,
          due_date: dueDate,
          notes,
          line_items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('invoices', list);
        showToast(`Created Invoice #${nextNum} successfully.`, 'success');
      } else if (action === 'UPDATE_RECORD' && param) {
        const parts = param.split('|').map(p => p.trim());
        const collection = parts[0];
        const identifier = parts[1];
        const fieldName = parts[2];
        const newValue = parts[3];

        if (!checkCollectionPermission(collection, 'edit')) return;

        const list = store.getAll(collection) || [];
        const item = list.find(it => it.id === identifier || String(it.number) === identifier || (it.first_name && `${it.first_name || ''} ${it.last_name || ''}`.trim().toLowerCase() === identifier.toLowerCase()));
        if (item) {
          let targetField = fieldName;
          if (fieldName === 'scheduled_date') targetField = 'scheduledDate';
          if (fieldName === 'technician_name') targetField = 'technicianName';
          if (fieldName === 'technician_id') targetField = 'technician_id';
          if (fieldName === 'estimated_hours') targetField = 'estimated_hours';
          if (fieldName === 'due_date') targetField = 'due_date';
          if (fieldName === 'valid_until') targetField = 'valid_until';

          let val = newValue;
          if (newValue === 'true') val = true;
          if (newValue === 'false') val = false;
          if (newValue === 'null') val = null;
          if (!isNaN(newValue) && newValue !== '') val = Number(newValue);

          item[targetField] = val;
          item.updatedAt = new Date().toISOString();

          // Try to link technician_id if tech name is updated
          if (targetField === 'technicianName') {
            const technicians = store.getAll('technicians') || [];
            const tech = technicians.find(t => t.name.toLowerCase() === val.toLowerCase());
            if (tech) {
              item.technician_id = tech.id;
            }
          }

          store.save(collection, list);
          const displayLabel = item.number ? `#${item.number}` : (item.name || item.title || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.id);
          showToast(`Updated "${targetField}" to "${newValue}" for ${collection.slice(0, -1)} "${displayLabel}".`, 'success');
        } else {
          showToast(`Could not find ${collection.slice(0, -1)} "${identifier}".`, 'error');
        }

      } else if (action === 'DELETE_RECORD' && param) {
        const parts = param.split('|').map(p => p.trim());
        const collection = parts[0];
        const identifier = parts[1];

        if (!checkCollectionPermission(collection, 'delete')) return;

        const list = store.getAll(collection) || [];
        const index = list.findIndex(it => it.id === identifier || String(it.number) === identifier || (it.first_name && `${it.first_name || ''} ${it.last_name || ''}`.trim().toLowerCase() === identifier.toLowerCase()));
        if (index !== -1) {
          const removed = list.splice(index, 1)[0];
          store.save(collection, list);
          const displayLabel = removed.number ? `#${removed.number}` : (removed.name || removed.title || `${removed.first_name || ''} ${removed.last_name || ''}`.trim() || removed.id);
          showToast(`Deleted ${collection.slice(0, -1)} "${displayLabel}" successfully.`, 'success');
        } else {
          showToast(`Could not find ${collection.slice(0, -1)} "${identifier}".`, 'error');
        }
      }
    } catch (e) {
      console.error(`AI action failed: ${action}`, e);
    }
  }

  cleanReply = cleanReply.replace(actionRegex, '').trim();
  return cleanReply;
}

function checkCollectionPermission(collection, action) {
  const mapping = {
    jobs: 'Jobs',
    customers: 'Customers',
    quotes: 'Quotes',
    invoices: 'Invoices'
  };

  const moduleName = mapping[collection];
  if (!moduleName) return true;

  let key = action;
  if (action === 'delete' && moduleName === 'Invoices') {
    key = 'void';
  }

  const allowed = hasPermission(moduleName, key);
  if (!allowed) {
    showToast(`Permission Denied: You do not have permission to ${action} ${collection}.`, 'error');
    return false;
  }
  return true;
}

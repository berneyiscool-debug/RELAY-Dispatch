// ============================================
// RELAY — IN-APP ASSISTANT (shell + local command handler)
// ============================================
// Phase 1 (now): a slide-in chat panel with a lightweight, rule-based command handler
// that performs real actions against the dashboard + data. No API key / backend needed.
// Phase 2 (later): swap `runLocalCommand` for a Claude API call via a Netlify/Supabase
// function for full natural-language understanding. The UI here won't need to change.
// ============================================
import { store } from '../data/store.js';
import relayIcon from '../assets/relay-icon.svg?raw';

let panel = null;
let onStateChange = null;

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

  addMessage(thread, 'relay', "Hi, I'm Relay. I can add page widgets, jump to your saved views, and fit or lock the canvas. Try “add a schedule widget” or ask “how many overdue invoices?”");

  const submit = () => {
    const text = input.value.trim();
    if (!text) return;
    addMessage(thread, 'user', text);
    input.value = '';
    autoGrow(input);
    const typing = addTyping(thread);
    setTimeout(() => {
      typing.remove();
      addMessage(thread, 'relay', runLocalCommand(text));
    }, 380);
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

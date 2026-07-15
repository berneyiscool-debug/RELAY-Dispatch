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
import relayIcon from '../assets/deputy-icon.svg?raw';
import { prepareAttachments, isSupportedAttachment, fileKind, chunk, MAX_PDF_PAGES, VISION_BATCH_SIZE } from '../utils/relayAttachments.js';

let panel = null;
let onStateChange = null;
let chatHistory = [];
// Files the user has attached to the next message (not yet sent). Raw File
// objects — converted to image data URLs at send time so previews stay cheap.
let pendingAttachments = [];
// When true, per-record success toasts are suppressed so a bulk import shows one
// summary toast instead of dozens.
let suppressActionToasts = false;

// Cloud (paid) users get vision attachments; local/offline users don't, since it
// hits a paid API. Mirrors the inline check used elsewhere in this file.
function isCloudUser() {
  return !!(store.companyId && !store.companyId.startsWith('acct_'));
}

// Whether the AI backend is usable right now. Cloud users go through the secure
// edge function (no client key needed); local users must enable AI + supply a key.
function canUseAI(ai) {
  return isCloudUser() ? (ai.enabled !== false) : !!(ai.enabled && ai.apiKey);
}

function getUserId() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? currentUser.id : 'default';
}

function loadChatHistory() {
  const key = `relay_chat_history_${getUserId()}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load chat history', e);
    return [];
  }
}

function saveChatHistory(history) {
  const key = `relay_chat_history_${getUserId()}`;
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save chat history', e);
  }
}

const GREETINGS = [
  "Hi, I'm Deputy. I can add page widgets, jump to your saved views, and fit or lock the canvas. Try “add a schedule widget” or ask “how many overdue invoices?”",
  "Hi, I'm Deputy. How can I help you manage your dispatch and jobs today?",
  "Hello! Deputy here. Try asking me to “add a schedule widget” or “show me the today view”. What's on your mind?",
  "Greetings! I'm your co-pilot Deputy. I can help you create customers, assign jobs, or quickly look up metrics. What do you need?",
  "Hey! Deputy is ready to assist. Need to check on overdue invoices, add a new job, or fit the canvas? Just let me know!",
  "Welcome back! I'm Deputy, your dispatch assistant. How can I assist you with your operations today?",
  "Hi there! Deputy here. I can help you manage your dispatch layout, check on jobs, and look up details. Try: “how many active jobs do we have?”",
  "Hello! Ready to dispatch? I can create quotes, jobs, and invoices for you. What can I do for you today?"
];

export function isRelayOpen() { return !!panel; }
export function onRelayToggle(cb) { onStateChange = cb; }

export function toggleRelay() { panel ? closeRelay() : openRelay(); }

export function openRelay() {
  if (panel) return;

  if (!hasPermission('AI Assistant', 'use')) return;

  const draftKey = `relay_draft_message_${getUserId()}`;
  const draftVal = localStorage.getItem(draftKey) || '';
  const cloud = isCloudUser();
  pendingAttachments = [];

  panel = document.createElement('div');
  panel.className = 'relay-panel';
  panel.innerHTML = `
    <div class="relay-head">
      <div class="relay-head-id">
        <span class="relay-avatar">${relayIcon}</span>
        <div>
          <div class="relay-name">Deputy</div>
          <div class="relay-sub">Your co-pilot</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="relay-clear-chat" title="Clear Chat history"><span class="material-icons-outlined">delete_sweep</span></button>
        <button class="relay-close" title="Close"><span class="material-icons-outlined">close</span></button>
      </div>
    </div>
    <div class="relay-thread" id="relay-thread"></div>
    <div class="relay-attach-row" id="relay-attach-row"></div>
    <div class="relay-input-wrap">
      <button class="relay-attach" id="relay-attach" title="${cloud ? 'Attach an image or PDF — catalogue, business card…' : 'Attachments are a cloud feature'}" ${cloud ? '' : 'disabled'}><span class="material-icons-outlined">attach_file</span></button>
      <input type="file" id="relay-file-input" accept="image/*,application/pdf" multiple hidden>
      <textarea id="relay-input" class="relay-input" rows="1" placeholder="Ask Deputy">${escapeHtml(draftVal)}</textarea>
      <button class="relay-send" id="relay-send" title="Send"><span class="material-icons-outlined">arrow_upward</span></button>
    </div>
    <div class="relay-foot">This is an early version. You may need to be patient</div>
  `;
  document.body.appendChild(panel);
  document.body.classList.add('relay-assistant-open');
  // Force a reflow so the slide-in transition triggers reliably (rAF is paused in
  // background/headless tabs, which would leave the panel stuck off-screen).
  void panel.offsetWidth;
  panel.classList.add('open');

  const thread = panel.querySelector('#relay-thread');
  const input = panel.querySelector('#relay-input');
  const send = panel.querySelector('#relay-send');

  if (draftVal) {
    autoGrow(input);
  }

  // Load persisted history
  chatHistory = loadChatHistory();

  // If no history exists, generate a random greeting on the fly (do not persist until first user message)
  let startGreeting = '';
  if (chatHistory.length === 0) {
    startGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }

  // Render all messages from history
  chatHistory.forEach(msg => {
    const uiRole = msg.role === 'assistant' ? 'relay' : msg.role;
    addMessage(thread, uiRole, msg.content);
  });

  // Render the random greeting if history was empty
  if (startGreeting) {
    addMessage(thread, 'relay', startGreeting);
  }

  const submit = async () => {
    const text = input.value.trim();
    const hasFiles = pendingAttachments.length > 0;
    if (!text && !hasFiles) return;

    localStorage.removeItem(draftKey);

    // ── Attachment turn (vision extraction, cloud only) ──
    if (hasFiles) {
      const files = pendingAttachments.slice();
      clearAttachments();

      const displayText = text ? `${text}\n\n${attachmentLabel(files)}` : attachmentLabel(files);
      chatHistory = loadChatHistory();
      chatHistory.push({ role: 'user', content: displayText });
      trimHistory();
      saveChatHistory(chatHistory);
      addMessage(thread, 'user', displayText);
      input.value = '';
      autoGrow(input);

      const ai = (store.getSettings() || {}).ai || {};
      if (!isCloudUser() || !canUseAI(ai)) {
        const reply = "Attachments need the cloud AI assistant enabled. An admin can turn it on in Settings → AI.";
        pushAssistant(reply);
        addMessage(thread, 'relay', reply);
        return;
      }

      const typing = addTyping(thread);
      try {
        await runVisionExtraction(text, files, thread, typing);
      } catch (err) {
        console.error('Relay vision extraction failed:', err);
        typing.remove();
        const reply = `I couldn't read that attachment. (${err.message || err})`;
        pushAssistant(reply);
        addMessage(thread, 'relay', reply);
      }
      return;
    }

    // ── Plain text turn ──
    chatHistory = loadChatHistory();
    chatHistory.push({ role: 'user', content: text });
    trimHistory();
    saveChatHistory(chatHistory);

    addMessage(thread, 'user', text);
    input.value = '';
    autoGrow(input);
    const typing = addTyping(thread);

    try {
      const s = store.getSettings();
      const ai = s.ai || {};

      if (canUseAI(ai)) {
        const response = await callAIEngine();
        typing.remove();
        addMessage(thread, 'relay', response);
      } else {
        // Fallback to rule-based local assistant
        setTimeout(() => {
          typing.remove();
          const reply = runLocalCommand(text);
          pushAssistant(reply);
          addMessage(thread, 'relay', reply);
        }, 380);
      }
    } catch (err) {
      console.error('AI assistant failed, falling back to local commands:', err);
      typing.remove();
      const reply = `[Error: ${err.message || err}]. Falling back to local assistant:\n\n` + runLocalCommand(text);
      pushAssistant(reply);
      addMessage(thread, 'relay', reply);
    }
  };

  send.addEventListener('click', submit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  input.addEventListener('input', () => {
    autoGrow(input);
    localStorage.setItem(draftKey, input.value);
  });
  input.addEventListener('focus', () => {
    input.classList.add('focused');
    autoGrow(input);
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      input.classList.remove('focused');
      autoGrow(input);
    }, 150);
  });

  // Attachment picker (cloud users only)
  const attachBtn = panel.querySelector('#relay-attach');
  const fileInput = panel.querySelector('#relay-file-input');
  if (cloud && attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const picked = Array.from(fileInput.files || []);
      let skipped = 0;
      picked.forEach(file => {
        if (isSupportedAttachment(file)) {
          pendingAttachments.push({ file, name: file.name, kind: fileKind(file) });
        } else {
          skipped++;
        }
      });
      fileInput.value = '';
      renderAttachmentChips();
      if (skipped) showToast(`${skipped} file(s) skipped — only images and PDFs are supported.`, 'info');
    });
  }

  panel.querySelector('.relay-close').addEventListener('click', closeRelay);
  
  const btnClearChat = panel.querySelector('.relay-clear-chat');
  if (btnClearChat) {
    btnClearChat.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your chat history?')) {
        chatHistory = [];
        const key = `relay_chat_history_${getUserId()}`;
        localStorage.removeItem(key);
        localStorage.removeItem(draftKey);
        thread.innerHTML = '';
        const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        addMessage(thread, 'relay', randomGreeting);
        showToast('Chat history cleared.', 'success');
      }
    });
  }

  document.addEventListener('keydown', escClose, true);

  if (onStateChange) onStateChange(true);
}

export function closeRelay() {
  if (!panel) return;
  document.removeEventListener('keydown', escClose, true);
  const p = panel;
  panel = null;
  p.classList.remove('open');
  document.body.classList.remove('relay-assistant-open');
  setTimeout(() => p.remove(), 220);
  if (onStateChange) onStateChange(false);
}

function escClose(e) { if (e.key === 'Escape') closeRelay(); }

function autoGrow(el) {
  const prevHeight = el.style.height;
  el.style.height = 'auto';
  const contentHeight = el.scrollHeight;
  el.style.height = prevHeight;
  
  // Force a reflow so the browser registers the previous height for the transition
  void el.offsetHeight;

  const isFocused = el.classList.contains('focused');
  const minH = isFocused ? 108 : 38;
  el.style.height = Math.min(Math.max(contentHeight, minH), 120) + 'px';
}

function addMessage(thread, role, text) {
  // 1. Strip any raw [ACTION: ...] tags from the visible text in the bubble
  let cleanedText = text.replace(/\[ACTION:\s*[A-Z_]+(?:\s*,\s*[^\]]+)?\]/gi, '').trim();

  // 2. Parse any [QUESTION: ...] or [QUESTION_MULTI: ...] tag
  let questionText = '';
  let options = [];
  let isMulti = false;

  let qMatch = cleanedText.match(/\[QUESTION_MULTI:\s*([^\]|]+)(?:\|([^\]]+))?\]/i);
  if (qMatch) {
    isMulti = true;
  } else {
    qMatch = cleanedText.match(/\[QUESTION:\s*([^\]|]+)(?:\|([^\]]+))?\]/i);
  }

  if (qMatch) {
    questionText = qMatch[1].trim();
    if (qMatch[2]) {
      options = qMatch[2].split('|').map(o => o.trim()).filter(Boolean);
    }
    // Remove the question tag from the visible bubble text
    cleanedText = cleanedText.replace(/\[QUESTION(?:_MULTI)?:\s*[^\]]+\]/gi, '').trim();
  }

  const m = document.createElement('div');
  m.className = `relay-msg relay-msg-${role}`;
  m.innerHTML = `<div class="relay-bubble">${escapeHtml(cleanedText)}</div>`;
  thread.appendChild(m);

  // 3. Render the interactive question card if present
  if (options.length > 0) {
    const card = document.createElement('div');
    card.className = 'relay-question-card';
    card.innerHTML = `
      <div class="relay-question-title">${escapeHtml(questionText)}</div>
      <div class="relay-question-options">
        ${options.map(opt => `
          <button class="relay-question-opt-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
        `).join('')}
      </div>
      ${isMulti ? `
        <div class="relay-question-actions">
          <button class="relay-question-submit-btn" disabled>Submit</button>
        </div>
      ` : ''}
    `;

    if (isMulti) {
      const submitBtn = card.querySelector('.relay-question-submit-btn');
      const optBtns = card.querySelectorAll('.relay-question-opt-btn');

      optBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          btn.classList.toggle('selected');
          const hasSelected = Array.from(optBtns).some(b => b.classList.contains('selected'));
          submitBtn.disabled = !hasSelected;
        });
      });

      submitBtn.addEventListener('click', () => {
        const selectedVals = Array.from(optBtns)
          .filter(b => b.classList.contains('selected'))
          .map(b => b.getAttribute('data-value'));

        optBtns.forEach(b => b.disabled = true);
        submitBtn.disabled = true;

        const val = selectedVals.join(', ');
        const panel = thread.closest('#relay-panel');
        const input = panel ? panel.querySelector('#relay-input') : null;
        const sendBtn = panel ? panel.querySelector('#relay-send') : null;
        if (input && sendBtn) {
          input.value = val;
          sendBtn.click();
        }
      });
    } else {
      // Single-select mode: click auto-submits
      card.querySelectorAll('.relay-question-opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const val = btn.getAttribute('data-value');
          card.querySelectorAll('.relay-question-opt-btn').forEach(b => {
            b.disabled = true;
            b.classList.remove('selected');
          });
          btn.classList.add('selected');

          const panel = thread.closest('#relay-panel');
          const input = panel ? panel.querySelector('#relay-input') : null;
          const sendBtn = panel ? panel.querySelector('#relay-send') : null;
          if (input && sendBtn) {
            input.value = val;
            sendBtn.click();
          }
        });
      });
    }

    thread.appendChild(card);
  }

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

// ── History helpers ────────────────────────────────────────────────────────────
function trimHistory() {
  if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
}

function pushAssistant(reply) {
  chatHistory.push({ role: 'assistant', content: reply });
  trimHistory();
  saveChatHistory(chatHistory);
}

// ── Attachment chips (pending files, shown above the input) ─────────────────────
function attachmentLabel(files) {
  return `📎 ${files.map(f => f.name).join(', ')}`;
}

function clearAttachments() {
  pendingAttachments = [];
  renderAttachmentChips();
}

function renderAttachmentChips() {
  if (!panel) return;
  const row = panel.querySelector('#relay-attach-row');
  if (!row) return;
  if (!pendingAttachments.length) {
    row.innerHTML = '';
    row.classList.remove('has-items');
    return;
  }
  row.classList.add('has-items');
  row.innerHTML = pendingAttachments.map((f, i) => `
    <span class="relay-chip">
      <span class="material-icons-outlined">${f.kind === 'pdf' ? 'picture_as_pdf' : 'image'}</span>
      <span class="relay-chip-name">${escapeHtml(f.name)}</span>
      <button class="relay-chip-x" data-idx="${i}" title="Remove">&times;</button>
    </span>`).join('');
  row.querySelectorAll('.relay-chip-x').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingAttachments.splice(Number(btn.dataset.idx), 1);
      renderAttachmentChips();
    });
  });
}

// Replace the animated typing dots with a live status line.
function setTypingStatus(typingEl, text) {
  const bubble = typingEl && typingEl.querySelector('.relay-bubble');
  if (bubble) {
    bubble.classList.remove('relay-typing');
    bubble.innerHTML = '';
    bubble.textContent = text;
  }
}

// ── Vision extraction (image / PDF → records) ───────────────────────────────────
async function runVisionExtraction(userText, files, thread, typing) {
  setTypingStatus(typing, 'Reading your attachment…');
  const { images, truncated } = await prepareAttachments(files.map(a => a.file), {
    onProgress: ({ page, pageCount }) => setTypingStatus(typing, `Rendering page ${page} of ${pageCount}…`)
  });

  if (!images.length) {
    typing.remove();
    const reply = "I couldn't get any readable pages out of that file.";
    pushAssistant(reply);
    addMessage(thread, 'relay', reply);
    return;
  }

  // Send page-images in batches so no single request carries the whole catalogue.
  const batches = chunk(images, VISION_BATCH_SIZE);
  const allActions = [];
  const proseParts = [];
  for (let b = 0; b < batches.length; b++) {
    setTypingStatus(typing, batches.length > 1
      ? `Extracting… batch ${b + 1} of ${batches.length}`
      : 'Extracting details…');
    const reply = await callVisionEngine(userText, batches[b], b, batches.length);
    const { actions, cleanReply } = extractActions(reply);
    allActions.push(...actions);
    if (cleanReply) proseParts.push(cleanReply);
  }

  typing.remove();

  let summary = proseParts.join('\n\n').trim();
  if (truncated) {
    summary += `${summary ? '\n\n' : ''}⚠️ That document was longer than ${MAX_PDF_PAGES} pages — I only read the first ${MAX_PDF_PAGES}. Send the rest as a second file to continue.`;
  }
  if (!summary) {
    summary = allActions.length
      ? `I found ${allActions.length} item${allActions.length === 1 ? '' : 's'} in that attachment.`
      : "I read the attachment but couldn't find anything to add.";
  }
  pushAssistant(summary);
  addMessage(thread, 'relay', summary);

  // Confirm before creating — a misread scan shouldn't silently flood the CRM.
  if (allActions.length) {
    renderActionConfirmation(thread, allActions);
  }
}

async function callVisionEngine(userText, images, batchIndex, batchCount) {
  const ai = (store.getSettings() || {}).ai || {};
  const model = ai.visionModel || 'gemini-2.0-flash';
  const basePrompt = ai.systemPrompt || 'You are Relay, an intelligent CRM co-pilot assistant.';
  const systemPrompt = `${basePrompt}\n\n${getVisionContext()}`;

  const instruction = batchCount > 1
    ? `${userText || 'Extract every record from this document.'}\n\n(Batch ${batchIndex + 1} of ${batchCount} — extract only what appears in the images below.)`
    : (userText || 'Extract every record from this attachment.');

  const content = [
    { type: 'text', text: instruction },
    ...images.map(url => ({ type: 'image_url', image_url: { url } }))
  ];

  return dispatchChat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content }
  ], ai, model, ai.visionEndpoint);
}

function getVisionContext() {
  return `The user has attached one or more images (photos, scans, or rendered PDF pages). Read them carefully and extract structured records to add to the CRM.

Likely cases:
- A SUPPLIER CATALOGUE / price list → extract EVERY product line item. One action per item:
  [ACTION: CREATE_RECORD, stock | name: <product name> | sku: <code if shown> | costPrice: <trade/buy price> | unitPrice: <list/RRP if shown> | unit: Each | category: <category if shown>]
- A BUSINESS CARD / contact → emit:
  [ACTION: CREATE_RECORD, contractors | name: <business name> | contactName: <person> | email: <email> | phone: <phone> | trade: <trade or role>]
  If it is clearly a MATERIALS SUPPLIER rather than a labour contractor, use: [ACTION: CREATE_RECORD, suppliers | name: <company> | contactName: <person> | email: <email> | phone: <phone> | address: <address>]

Rules:
- Emit one [ACTION: CREATE_RECORD, ...] tag per record. Include only fields you can actually read; omit the rest.
- Numbers must be plain, no currency symbols (85 not $85.00).
- First write ONE short sentence summarising what you found (e.g. "I found 42 products across 3 pages."), THEN the action tags. The app asks the user to confirm before saving, so always include the tags — do not ask the user for confirmation yourself.
- If the images are unreadable or contain no records, say so plainly and emit no tags.`;
}

// Confirmation card shown before bulk-creating extracted records.
function renderActionConfirmation(thread, actions) {
  const n = actions.length;
  const m = document.createElement('div');
  m.className = 'relay-msg relay-msg-relay';
  m.innerHTML = `<div class="relay-bubble relay-confirm">
    <div class="relay-confirm-title">Add ${n} record${n === 1 ? '' : 's'} to your CRM?</div>
    <div class="relay-confirm-list">${summariseActions(actions)}</div>
    <div class="relay-confirm-actions">
      <button class="relay-confirm-yes">${n === 1 ? 'Add it' : `Add all ${n}`}</button>
      <button class="relay-confirm-no">Cancel</button>
    </div>
  </div>`;
  thread.appendChild(m);
  thread.scrollTop = thread.scrollHeight;

  const actionsBar = m.querySelector('.relay-confirm-actions');
  m.querySelector('.relay-confirm-yes').addEventListener('click', () => {
    let ok = 0;
    suppressActionToasts = true;
    try {
      actions.forEach(({ action, param }) => {
        try { executeAction(action, param); ok++; } catch (e) { console.error(e); }
      });
    } finally {
      suppressActionToasts = false;
    }
    actionsBar.innerHTML = `<span class="relay-confirm-done">✓ Added ${ok} record${ok === 1 ? '' : 's'}.</span>`;
    const doneMsg = `Added ${ok} record${ok === 1 ? '' : 's'} to your CRM.`;
    pushAssistant(doneMsg);
    showToast(doneMsg, 'success');
  });
  m.querySelector('.relay-confirm-no').addEventListener('click', () => {
    actionsBar.innerHTML = `<span class="relay-confirm-done">Cancelled — nothing was added.</span>`;
    pushAssistant('Cancelled — nothing was added.');
  });
}

function summariseActions(actions) {
  const groups = {};
  actions.forEach(({ action, param }) => {
    const parts = (param || '').split('|').map(p => p.trim());
    const coll = action === 'CREATE_RECORD' ? (parts[0] || 'record') : action.replace('CREATE_', '').toLowerCase();
    const name = fieldFromParts(parts, 'name') || firstPipeValue(parts) || '(unnamed)';
    (groups[coll] = groups[coll] || []).push(name);
  });
  return Object.entries(groups).map(([coll, names]) => {
    const preview = names.slice(0, 6).map(escapeHtml).join(', ');
    const more = names.length > 6 ? ` +${names.length - 6} more` : '';
    const label = coll.charAt(0).toUpperCase() + coll.slice(1);
    return `<div><strong>${escapeHtml(label)} (${names.length}):</strong> ${preview}${more}</div>`;
  }).join('');
}

function fieldFromParts(parts, key) {
  for (let i = 1; i < parts.length; i++) {
    const idx = parts[i].indexOf(':');
    if (idx !== -1 && parts[i].slice(0, idx).trim().toLowerCase() === key) {
      return parts[i].slice(idx + 1).trim();
    }
  }
  return '';
}

function firstPipeValue(parts) {
  return parts.length > 1 ? parts[1] : '';
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

// ── AI Engine completions call ───────────────────────────────────

async function callAIEngine() {
  const s = store.getSettings();
  const ai = s.ai || {};
  const basePrompt = ai.systemPrompt || 'You are Relay, an intelligent CRM co-pilot assistant. You help dispatchers manage jobs, quotes, invoices, and scheduling.';
  const systemPrompt = `${basePrompt}\n\n${getSystemContext()}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory
  ];

  const reply = await dispatchChat(messages, ai, ai.model || 'deepseek-chat');
  pushAssistant(reply);
  return parseAndExecuteActions(reply);
}

// Low-level completions transport, shared by text and vision paths. Routes through
// the Supabase edge proxy (cloud), the Electron secure handler (desktop), or a
// direct fetch. `messages` may contain multimodal content arrays for vision.
async function dispatchChat(messages, ai, model, endpoint) {
  // Vision requests pass a different endpoint (e.g. Gemini) than text chat; the
  // edge function picks the matching server-side key based on this endpoint.
  const ep = endpoint || ai.endpoint;
  if (isCloudUser()) {
    const { data, error } = await supabase.functions.invoke('relay-copilot', {
      body: { messages, endpoint: ep, model }
    });
    if (error) {
      // supabase-js hides the real upstream message on non-2xx; the actual body
      // (e.g. the OpenAI error) is on error.context (a Response). Surface it.
      let detail = error.message || String(error);
      try {
        if (error.context && typeof error.context.text === 'function') {
          const body = await error.context.text();
          if (body) {
            try { detail = JSON.parse(body).error || body; } catch { detail = body; }
          }
        }
      } catch (_) { /* keep generic message */ }
      throw new Error(`AI backend error: ${detail}`);
    }
    if (data && data.error) {
      throw new Error(data.error);
    }
    return data.choices?.[0]?.message?.content || '';
  }

  if (window.electronAPI && window.electronAPI.callAIAssistant) {
    const data = await window.electronAPI.callAIAssistant({ messages, endpoint: ep, model });
    return data.choices?.[0]?.message?.content || '';
  }

  const res = await fetch(ep || 'https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ai.apiKey}`
    },
    body: JSON.stringify({ model: model || 'deepseek-chat', messages, temperature: 0.3 })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
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
  const techsList = technicians.map(t => `${t.name} (${t.role || 'Tech'}${t.deactivated ? ', deactivated' : ''}) - Username: ${t.username}`).join(', ');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userId = currentUser ? currentUser.id : 'default';
  const factsheetKey = `relay_factsheet_${userId}`;
  const enabledKey = `relay_factsheet_enabled_${userId}`;
  const isEnabled = localStorage.getItem(enabledKey) !== 'false';
  const userFactsheet = isEnabled ? (localStorage.getItem(factsheetKey) || '') : 'User has disabled AI Personal Memory tracking.';

  return `Assistant Role & Core Competencies:
- You are the central dispatch co-pilot and operations coordinator. You do NOT just answer questions passively; you proactively manage task allocation, schedule jobs to the best-suited technicians, resolve scheduling conflicts, and coordinate field operations.
- Always check the list of active technicians and their roles. When a job is mentioned, match it to the technician with the corresponding role/skills. Suggest the best candidates based on workload, and proactively allocate the job using the appropriate action tags.
- Be highly analytical and helpful. When answering user questions about CRM metrics, synthesize a clear, structural summary from the live data context (e.g., outlining workload distribution, quote conversion states, or timesheet approvals).

Assistant Tone & Formatting Guidelines:
- You are a professional dispatch co-pilot. Keep your tone helpful, direct, concise, and business-focused.
- DO NOT use overly familiar pet names (e.g. "gorgeous", "darling") or sassy/flamboyant language.
- Use emojis sparingly and only to highlight key structural items (e.g. checkmarks, warnings). Avoid emotional, decorative, or dramatic emojis.
- Keep your answers clean, direct, and scans-friendly. Do not write verbose diagnostics for simple empty states.

Current Live CRM Data Context (updated real-time):
- Active Technicians: ${techsList || 'None'}
- Total Registered Customers: ${customers.length}
- Active/Scheduled Jobs (${activeJobs.length}):
${jobsList || 'None'}
- Overdue Invoices (${overdueInvoices.length}):
${overdueInvoicesList || 'None'}
- Pending Quotes: ${pendingQuotes.length}

Currently Logged-in User Profile:
- Name: ${currentUser ? currentUser.name : 'Unknown User'}
- Role: ${currentUser ? currentUser.role : 'Unknown Role'}
- User Personal Factsheet (Memory of user's work preferences/patterns):
${userFactsheet ? userFactsheet.split('\n').map(line => `  ${line}`).join('\n') : '  No specific preferences recorded yet.'}

You can perform actions on the user interface and CRM database by appending action tags to the end of your response.
Action tags MUST follow these exact formats:
- To jump to a view: [ACTION: JUMP_VIEW, SavedViewName]
- To add a dashboard widget: [ACTION: ADD_WIDGET, WidgetID] (e.g. page-jobs, page-quotes, cash-flow, tech-map, today-schedule, recent-activity, recent-leads)
- To fit canvas: [ACTION: FIT_CANVAS]
- To lock/unlock canvas: [ACTION: LOCK_CANVAS, true] or [ACTION: LOCK_CANVAS, false]
- To navigate/jump to a specific page or section in the app: [ACTION: NAVIGATE, PageName]
  - PageName must be one of: jobs, quotes, invoices, customers, contractors, suppliers, schedule, timesheets, stock, assets, purchase-orders, settings, dashboard.
  (Example: [ACTION: NAVIGATE, jobs])

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

- To create a new record in any collection: [ACTION: CREATE_RECORD, CollectionName | Field1: Value1 | Field2: Value2 | ...]
  - CollectionName: jobs, quotes, invoices, customers, purchaseOrders, contractors, suppliers, stock, assets, timesheets, or leads.
  - Field: Value pairs: Specify the fields to populate. Values can be primitives, JSON objects (e.g. {"freq":"Weekly","start":"2026-07-09","end":"2026-10-09","daysOfWeek":[1]}) or JSON arrays.
  - Generates IDs, numbers, and dates automatically.
  (Example to create a weekly recurring job: [ACTION: CREATE_RECORD, jobs | title: Weekly HVAC Service | isRecurring: true | recurringConfig: {"freq":"Weekly","start":"2026-07-09","end":"2026-10-09","daysOfWeek":[1]} | status: Scheduled])
  (Example to create a purchase order: [ACTION: CREATE_RECORD, purchaseOrders | title: PO for parts | supplierName: Rexel | total: 450 | status: Pending])
  (Example to create a lead: [ACTION: CREATE_RECORD, leads | title: Kitchen Renovation | customerName: John Smith | status: New])

- To add/save a concise fact or preference to your personal factsheet memory: [ACTION: UPDATE_FACTSHEET, Single concise fact to remember]
  (Example: [ACTION: UPDATE_FACTSHEET, User prefers to schedule HVAC jobs to John Doe on Mondays])

- To prompt the user with a single-choice question (clicking an option auto-submits it): [QUESTION: Question text? | Option 1 | Option 2 | Option 3]
  - Use this when only one choice is expected or appropriate.
  (Example: [QUESTION: What would you like to do next? | Create an invoice | Check quotes | Cancel])

- To prompt the user with a multiple-choice question (user toggles multiple choices and clicks a Submit button): [QUESTION_MULTI: Question text? | Option 1 | Option 2 | Option 3]
  - Use this when the user can select more than one answer (e.g. choosing multiple technicians or multiple actions).
  (Example: [QUESTION_MULTI: Select technicians to assign to this job: | Adam West | Burt Ward | Diana Prince])

Always perform the requested action when asked (e.g. if the user says "add customer Barry Buttons", reply confirming you will do it and append the CREATE_CUSTOMER tag). Do not say you are unable to do it.`;
}

const ACTION_REGEX = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*([^\]]+))?\]/gi;

// Parse [ACTION: ...] tags out of a reply WITHOUT executing them.
// Returns { actions: [{ action, param }], cleanReply }. The attachment flow uses
// this to hold extracted records for user confirmation before creating them.
function extractActions(reply) {
  const regex = new RegExp(ACTION_REGEX.source, 'gi');
  const actions = [];
  let match;
  while ((match = regex.exec(reply)) !== null) {
    actions.push({
      action: match[1].toUpperCase().trim(),
      param: match[2] ? match[2].trim() : null
    });
  }
  const cleanReply = reply.replace(regex, '').trim();
  return { actions, cleanReply };
}

// Execute a single parsed action against the store / dashboard.
function executeAction(action, param) {
  const ff = window.__fieldForge || {};
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
      } else if (action === 'NAVIGATE' && param) {
        const route = param.toLowerCase().trim();
        let targetHash = `#/${route}`;
        if (route === 'dashboard' || route === 'home') {
          targetHash = '#/';
        }

        const permissionMapping = {
          jobs: 'Jobs',
          customers: 'Customers',
          quotes: 'Quotes',
          invoices: 'Invoices',
          schedule: 'Schedule',
          timesheets: 'Timesheets',
          stock: 'Stock',
          assets: 'Assets',
          settings: 'Settings',
          suppliers: 'Suppliers',
          contractors: 'Contractors',
          'purchase-orders': 'Purchase Orders'
        };

        const moduleName = permissionMapping[route];
        if (moduleName) {
          const allowed = hasPermission(moduleName, 'view') || hasPermission(moduleName, 'view_own');
          if (!allowed) {
            showToast(`Permission Denied: You do not have permission to view ${moduleName}.`, 'error');
            return;
          }
        }

        window.location.hash = targetHash;
        showToast(`Navigated to ${route} page.`, 'info');
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

        const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);
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
            const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);
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
      } else if (action === 'UPDATE_FACTSHEET' && param) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const userId = currentUser ? currentUser.id : 'default';
        const enabledKey = `relay_factsheet_enabled_${userId}`;
        const isEnabled = localStorage.getItem(enabledKey) !== 'false';
        if (!isEnabled) {
          console.log('User has disabled AI memory, skipping factsheet write.');
          return;
        }
        const factsheetKey = `relay_factsheet_${userId}`;
        const existing = localStorage.getItem(factsheetKey) || '';
        const updated = (existing.trim() ? existing.trim() + '\n- ' : '- ') + param;
        localStorage.setItem(factsheetKey, updated);
        window.dispatchEvent(new Event('storage'));
        showToast('Relay updated your personal factsheet.', 'success');
      } else if (action === 'CREATE_RECORD' && param) {
        const parts = param.split('|').map(p => p.trim());
        const collection = parts[0];
        if (!checkCollectionPermission(collection, 'create')) return;

        const fields = {};
        for (let i = 1; i < parts.length; i++) {
          const fieldPart = parts[i];
          const colonIdx = fieldPart.indexOf(':');
          if (colonIdx !== -1) {
            const fieldName = fieldPart.slice(0, colonIdx).trim();
            const valueStr = fieldPart.slice(colonIdx + 1).trim();

            let val = valueStr;
            if ((valueStr.startsWith('{') && valueStr.endsWith('}')) || (valueStr.startsWith('[') && valueStr.endsWith(']'))) {
              try {
                val = JSON.parse(valueStr);
              } catch (e) {
                console.error('Failed to parse JSON field value', e);
              }
            } else {
              if (valueStr === 'true') val = true;
              if (valueStr === 'false') val = false;
              if (valueStr === 'null') val = null;
              if (!isNaN(valueStr) && valueStr !== '') val = Number(valueStr);
            }

            fields[fieldName] = val;
          }
        }

        const list = store.getAll(collection) || [];
        const newItem = {
          id: store.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...fields
        };

        if (['jobs', 'quotes', 'invoices', 'purchaseOrders', 'leads'].includes(collection)) {
          if (!newItem.number) {
            const nextNum = list.reduce((max, item) => {
              const num = parseInt(item.number) || 0;
              return num > max ? num : max;
            }, 1000) + 1;
            newItem.number = String(nextNum);
          }
        }

        list.push(newItem);
        store.save(collection, list);

        const displayLabel = newItem.number ? `#${newItem.number}` : (newItem.name || newItem.title || newItem.id);
        if (!suppressActionToasts) {
          showToast(`Created new ${collection.slice(0, -1)} "${displayLabel}" successfully.`, 'success');
        }
      }
    } catch (e) {
      console.error(`AI action failed: ${action}`, e);
    }
}

// Text-chat path: execute every action in a reply and return the cleaned prose.
function parseAndExecuteActions(reply) {
  const { actions, cleanReply } = extractActions(reply);
  actions.forEach(({ action, param }) => {
    console.log(`Executing AI action: ${action} with param: ${param}`);
    executeAction(action, param);
  });
  return cleanReply;
}

function checkCollectionPermission(collection, action) {
  const mapping = {
    jobs: 'Jobs',
    customers: 'Customers',
    quotes: 'Quotes',
    invoices: 'Invoices',
    purchaseOrders: 'Purchase Orders',
    suppliers: 'Suppliers',
    contractors: 'Contractors',
    leads: 'Leads',
    assets: 'Assets',
    stock: 'Stock',
    timesheets: 'Timesheets'
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

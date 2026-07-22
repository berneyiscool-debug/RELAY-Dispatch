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
import { loadUserMemory, saveUserMemory, clearStaleMemory, getStructuredMemory } from '../utils/userMemory.js';
import { FLAGS } from '../utils/flags.js';
import { hasMapsAction, runMapsActions } from '../utils/deputyMaps.js';

let panel = null;
let onStateChange = null;
let chatHistory = [];
// Files the user has attached to the next message (not yet sent).
function renderIntroDashboard(thread, memory) {
  // Get user details
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userName = currentUser ? (currentUser.name || 'Admin') : 'Admin';
  const firstName = userName.split(' ')[0];

  // Get current time greeting
  const hours = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hours < 12) timeGreeting = 'Good morning';
  else if (hours < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  // Retrieve metrics
  const jobs = store.getAll('jobs') || [];
  const quotes = store.getAll('quotes') || [];
  const invoices = store.getAll('invoices') || [];
  const stock = store.getAll('stock') || [];
  
  const activeJobsList = jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress');
  const activeJobsCount = activeJobsList.length;
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Pending' || q.status === 'Draft').length;
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length;
  const unassignedJobs = jobs.filter(j => (j.status === 'Scheduled' || j.status === 'In Progress' || j.status === 'Pending') && (!j.technicianName || j.technicianName === 'Unassigned'));
  const lowStock = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5));
  
  // Detect schedule conflicts (same tech, same date, multiple jobs)
  const conflicts = [];
  const assignedActiveJobs = activeJobsList.filter(j => j.technicianName && j.technicianName !== 'Unassigned' && j.scheduledDate);
  const techDateMap = {};
  assignedActiveJobs.forEach(j => {
    const key = `${j.technicianName}_${j.scheduledDate}`;
    if (!techDateMap[key]) techDateMap[key] = [];
    techDateMap[key].push(j);
  });
  Object.values(techDateMap).forEach(group => {
    if (group.length > 1) {
      conflicts.push(...group);
    }
  });
  // distinct conflicts count based on unique tech+date pairs
  const conflictCount = Object.keys(techDateMap).filter(k => techDateMap[k].length > 1).length;

  const count = memory.interactionCount || 0;
  const welcomeText = count > 0 
    ? `Welcome back! You've checked in with Deputy ${count} ${count === 1 ? 'time' : 'times'} recently.` 
    : `Welcome to Deputy! I'm here to help you coordinate your dispatch and jobs today.`;

  const card = document.createElement('div');
  card.className = 'relay-intro-card assistant-intro';
  card.innerHTML = `
    <div class="relay-intro-banner">
      <div class="relay-intro-emoji">👋</div>
      <div class="relay-intro-welcome">
        <h3>${timeGreeting}, ${escapeHtml(firstName)}!</h3>
        <p>${welcomeText}</p>
      </div>
    </div>
    
    <div class="relay-intro-stats-grid">
      <div class="relay-stat-item" data-cmd="how many overdue invoices">
        <span class="relay-stat-num">${overdueInvoices}</span>
        <span class="relay-stat-label">Overdue Invoices</span>
      </div>
      <div class="relay-stat-item" data-cmd="how many active jobs">
        <span class="relay-stat-num">${activeJobsCount}</span>
        <span class="relay-stat-label">Active Jobs</span>
      </div>
      <div class="relay-stat-item" data-cmd="how many pending quotes">
        <span class="relay-stat-num">${pendingQuotes}</span>
        <span class="relay-stat-label">Pending Quotes</span>
      </div>
    </div>

    <div class="relay-intro-suggestions">
      <div class="relay-suggestions-title">Quick Commands & Proactive Alerts</div>
      <div class="relay-suggestion-chips">
        ${unassignedJobs.length > 0 ? `<button class="relay-chip-btn warning-chip" data-cmd="assign technicians to unassigned jobs">⚠️ ${unassignedJobs.length} Unassigned Job(s) — Auto Assign</button>` : ''}
        ${conflictCount > 0 ? `<button class="relay-chip-btn warning-chip" data-cmd="optimize today's schedule and resolve conflicts">⚠️ ${conflictCount} Schedule Collision(s) — Optimize</button>` : ''}
        ${lowStock.length > 0 ? `<button class="relay-chip-btn info-chip" data-cmd="show low stock items and reorder">📦 ${lowStock.length} Low Stock Item(s) — Reorder</button>` : ''}
        ${FLAGS.maps ? `<button class="relay-chip-btn" data-cmd="What's the best order to run today's jobs, with drive times?">🗺️ Plan Today's Route</button>` : ''}
        <button class="relay-chip-btn" data-cmd="add a schedule widget">📅 Add Schedule Widget</button>
        <button class="relay-chip-btn" data-cmd="fit the canvas">🔍 Zoom Canvas to Fit</button>
        <button class="relay-chip-btn" data-cmd="lock the canvas">🔒 Lock Canvas Layout</button>
        ${(() => {
            let topChip = { cmd: '', label: '' };
            if (activeJobsCount >= overdueInvoices && activeJobsCount >= pendingQuotes) {
              topChip = { cmd: 'create a new job', label: '🛠️ Create New Job' };
            } else if (overdueInvoices >= activeJobsCount && overdueInvoices >= pendingQuotes) {
              topChip = { cmd: `show ${overdueInvoices} overdue invoices`, label: `📄 Overdue Invoices (${overdueInvoices})` };
            } else {
              topChip = { cmd: `show ${pendingQuotes} pending quotes`, label: `📝 Pending Quotes (${pendingQuotes})` };
            }
            return '<button class="relay-chip-btn" data-cmd="' + topChip.cmd + '">' + topChip.label + '</button>';
          })()}
      </div>
    </div>
  `;

  // Attach click listeners to all items that submit a command
  const submitCmd = (cmd) => {
    const panelEl = thread.closest('.relay-panel');
    const inputEl = panelEl ? panelEl.querySelector('#relay-input') : null;
    const sendBtn = panelEl ? panelEl.querySelector('#relay-send') : null;
    if (inputEl && sendBtn) {
      inputEl.value = cmd;
      sendBtn.click();
    }
  };

  card.querySelectorAll('[data-cmd]').forEach(el => {
    el.addEventListener('click', () => {
      submitCmd(el.getAttribute('data-cmd'));
    });
  });

  thread.appendChild(card);
  return card;
}
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



export function isRelayOpen() { return !!panel; }
export function onRelayToggle(cb) { onStateChange = cb; }

export function toggleRelay() { panel ? closeRelay() : openRelay(); }

export async function openDeputyWithPrompt(promptText) {
  if (!panel) {
    await openRelay();
  }
  const input = panel.querySelector('#relay-input');
  if (input) {
    input.value = promptText;
    input.focus();
  }
}

export async function openRelay() {
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
        <button class="relay-close" title="Close"><span class="material-icons-outlined">close</span></button><button class="assistant-reset-memory" title="Reset Assistant Memory"><span class="material-icons-outlined">refresh</span></button>
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

  // Remove any previous intro message (in case the panel was reopened without full reload)
  const existingIntro = thread.querySelector('.assistant-intro');
  if (existingIntro) existingIntro.remove();

  // Render all persisted messages from history first (so they are above the greeting)
  chatHistory.forEach(msg => {
    const uiRole = msg.role === 'assistant' ? 'relay' : msg.role;
    addMessage(thread, uiRole, msg.content);
  });

  // Load and possibly clear stale user memory
  let memory = await loadUserMemory();
  memory = clearStaleMemory(memory);
  const card = renderIntroDashboard(thread, memory);

  // Update interaction count and timestamp
  const updatedMemory = {
    ...memory,
    interactionCount: (memory.interactionCount || 0) + 1,
    lastUpdated: Date.now(),
  };
  await saveUserMemory(updatedMemory);

  // Scroll so the intro card starts at the top of the viewport
  if (chatHistory.length > 0) {
    thread.classList.add('relay-thread-has-history');
    setTimeout(() => {
      thread.scrollTop = card.offsetTop;
    }, 50);
  } else {
    thread.classList.remove('relay-thread-has-history');
    thread.scrollTop = 0;
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
panel.querySelector('.assistant-reset-memory')?.addEventListener('click', async () => {
  await saveUserMemory({});
  location.reload();
});
  
  const btnClearChat = panel.querySelector('.relay-clear-chat');
  if (btnClearChat) {
    btnClearChat.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your chat history?')) {
        chatHistory = [];
        const key = `relay_chat_history_${getUserId()}`;
        localStorage.removeItem(key);
        localStorage.removeItem(draftKey);
        thread.innerHTML = '';
        renderIntroDashboard(thread, {});
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
  // 1. Strip any raw [ACTION: ...] tags from the visible text in the bubble using the robust parser
  let cleanedText = extractActions(text).cleanReply;

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

  // 3. Strip Markdown asterisks since the UI doesn't render Markdown
  cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');

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
        const panel = thread.closest('.relay-panel');
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

          const panel = thread.closest('.relay-panel');
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

  const ai = (store.getSettings() || {}).ai || {};
  const isDeepSeek = (ai.model || '').toLowerCase().includes('deepseek') || (ai.visionModel || '').toLowerCase().includes('deepseek');
  if (isDeepSeek) {
    const note = "⚠️ Note: The DeepSeek API does not currently support multimodal/image inputs natively. I'm passing this to the vision endpoint, but it may be ignored or fail until multimodal support is fully rolled out.";
    pushAssistant(note);
    addMessage(thread, 'relay', note);
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

  // Maps actions can't be answered in one turn: they need real drive-time data
  // from the routing service. Compute it, then feed the result back so Deputy
  // phrases the final answer with actual numbers instead of an empty tag.
  if (FLAGS.maps && hasMapsAction(reply)) {
    const routeData = await runMapsActions(reply);
    if (routeData) {
      const followup = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'assistant', content: reply },
        { role: 'user', content: `[ROUTE SERVICE RESULTS]\n${routeData}\n\nUsing only these results, answer my previous question concisely and naturally. Report the stop order, drive times and totals as given. Do NOT emit any action tags.` }
      ];
      const finalReply = await dispatchChat(followup, ai, ai.model || 'deepseek-chat');
      pushAssistant(finalReply);
      return parseAndExecuteActions(finalReply);
    }
  }

  pushAssistant(reply);
  return parseAndExecuteActions(reply);
}


async function callAIEngineGreeting() {
  const s = store.getSettings();
  const ai = s.ai || {};
  const welcomeContext = getAssistantWelcomeContext();
  const userMemory = getUserMemory();
  
  const systemPrompt = `You are Deputy, the intelligent field service co-pilot assistant for ${s.name || 'this company'}.
You are greeting the user as they open the assistant panel.
Generate a friendly, concise, and helpful 1 to 2 sentence greeting message based on the current workspace context.
Focus on introducing yourself, highlighting 1-2 interesting current stats, and asking how you can help.
Keep it casual, highly helpful, and conversational.
Do not use markdown formatting, do not write a long paragraph. Return ONLY the welcome greeting text.

Current Workspace Context:
${welcomeContext}`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  return dispatchChat(messages, ai, ai.model || 'deepseek-chat');
}

// Low-level completions transport, shared by text and vision paths. Routes through
// the Supabase edge proxy (cloud), the Electron secure handler (desktop), or a
// direct fetch. `messages` may contain multimodal content arrays for vision.
export async function dispatchChat(messages, ai, model, endpoint) {
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

export function getSystemContext() {
  // Pull current DB state
  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];
  const quotes = store.getAll('quotes') || [];
  const customers = store.getAll('customers') || [];
  const stock = store.getAll('stock') || [];
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);

  const activeJobs = jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled');
  const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
  const pendingJobs = jobs.filter(j => j.status === 'Pending');
  const unassignedJobs = jobs.filter(j => (j.status === 'Scheduled' || j.status === 'In Progress' || j.status === 'Pending') && (!j.technicianName || j.technicianName === 'Unassigned'));
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft');
  const lowStockItems = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5));

  const allTechs = store.getAll('technicians') || [];
  const deactivatedTechNames = new Set(allTechs.filter(t => t.deactivated).map(t => t.name.toLowerCase()));
  
  const jobsList = activeJobs.slice(0, 10).map(j => {
    const techName = j.technicianName || 'Unassigned';
    const isDeactivated = techName && deactivatedTechNames.has(techName.toLowerCase());
    const techDisplay = isDeactivated ? `${techName} (DEACTIVATED)` : techName;
    return `Job #${j.number || j.id}: ${j.title} (${j.status}) - Cust: ${j.customerName || 'None'} - Tech: ${techDisplay} - Date: ${j.scheduledDate || 'TBD'}`;
  }).join('\n');

  const unassignedJobsList = unassignedJobs.map(j => `Job #${j.number || j.id}: ${j.title} (${j.status}) - Cust: ${j.customerName || 'None'} - Date: ${j.scheduledDate || 'TBD'}`).join('\n');
  const overdueInvoicesList = overdueInvoices.slice(0, 8).map(i => `Invoice #${i.number || i.id}: ${i.title} - Total: $${i.total} - Due: ${i.dueDate || 'TBD'}`).join('\n');
  const lowStockList = lowStockItems.map(s => `${s.name} (Qty: ${s.quantity || 0}, Reorder Point: ${s.reorderPoint || 5})`).join(', ');

  const techWorkloadMap = technicians.map(t => {
    const assignedCount = activeJobs.filter(j => j.technicianName === t.name || j.technician_id === t.id).length;
    return `${t.name} (${t.role || 'Tech'}): ${assignedCount} active job(s)`;
  }).join(' | ');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userId = currentUser ? currentUser.id : 'default';
  const factsheetKey = `relay_factsheet_${userId}`;
  const enabledKey = `relay_factsheet_enabled_${userId}`;
  const isEnabled = localStorage.getItem(enabledKey) !== 'false';
  const rawFactsheet = isEnabled ? (localStorage.getItem(factsheetKey) || '') : 'User has disabled AI Personal Memory tracking.';
  
  let formattedMemory = '  No specific preferences recorded yet.';
  if (isEnabled && rawFactsheet) {
    const memNodes = getStructuredMemory(rawFactsheet);
    formattedMemory = [];
    if (memNodes.dispatchRules.length) formattedMemory.push('  [Dispatch Rules]:\n' + memNodes.dispatchRules.map(l => `    - ${l}`).join('\n'));
    if (memNodes.clientNotes.length) formattedMemory.push('  [Client Context]:\n' + memNodes.clientNotes.map(l => `    - ${l}`).join('\n'));
    if (memNodes.preferences.length) formattedMemory.push('  [User Preferences]:\n' + memNodes.preferences.map(l => `    - ${l}`).join('\n'));
    if (memNodes.general.length) formattedMemory.push('  [General Notes]:\n' + memNodes.general.map(l => `    - ${l}`).join('\n'));
    formattedMemory = formattedMemory.join('\n');
  }

  const modules = ['Jobs', 'Quotes', 'Invoices', 'Customers', 'Schedule', 'Stock', 'Purchase Orders', 'Assets'];
  const userPermissions = modules.map(m => {
    const actions = [];
    if (hasPermission(m, 'create')) actions.push('Create');
    if (hasPermission(m, 'edit')) actions.push('Edit');
    if (hasPermission(m, 'delete')) actions.push('Delete');
    return `${m}: ${actions.length > 0 ? actions.join(', ') : 'Read-only'}`;
  }).join(' | ');

  return `Assistant Role & Core Competencies:
- You are the central dispatch co-pilot and operations coordinator. You do NOT just answer questions passively; you proactively manage task allocation, schedule jobs to the best-suited technicians, resolve scheduling conflicts, and coordinate field operations.
- Always check the list of active technicians and their roles. When a job is mentioned, match it to the technician with the corresponding role/skills. Suggest the best candidates based on workload, and proactively allocate the job using the appropriate action tags.
- You must ONLY use, suggest, or assign jobs to technicians who are currently listed in the "Active Technicians" list below. Do NOT reference, suggest, or assign jobs to any other technicians (including those from older chat history, memory, or previous job assignments) as they are deactivated.
- Be highly analytical and helpful. When answering user questions about CRM metrics, synthesize a clear, structural summary from the live data context (e.g., outlining workload distribution, quote conversion states, or timesheet approvals).
- CRITICAL RULE: You must strictly abide by the user's permissions listed below. If the user asks you to create, edit, or delete a record, but their permissions say "Read-only" for that module, you must gracefully refuse and explain they lack permission.

Assistant Tone & Formatting Guidelines:
- You are a professional dispatch co-pilot. Keep your tone helpful, direct, concise, and business-focused.
- DO NOT use overly familiar pet names (e.g. "gorgeous", "darling") or sassy/flamboyant language.
- Use emojis sparingly and only to highlight key structural items (e.g. checkmarks, warnings). Avoid emotional, decorative, or dramatic emojis.
- Keep your answers clean, direct, and scans-friendly. Do not write verbose diagnostics for simple empty states.
- CRITICAL FORMATTING RULE: DO NOT OUTPUT ANY ASTERISKS (*) WHATSOEVER IN YOUR RESPONSE. NO BOLDING (**), NO ITALICS (*). They are an eye sore. Instead, use standard dashes (-) for lists, and HTML tables or paragraphs to create structure and emphasis.

Current Live CRM Data Context (updated real-time):
- Current Local Date & Time: ${new Date().toLocaleString()}
- Active Technicians & Workloads: ${techWorkloadMap || 'None'}
- Total Registered Customers: ${customers.length}
- Jobs Summary: Total: ${jobs.length}, Active/Scheduled: ${activeJobs.length}, Completed/Invoiced: ${completedJobs.length}, Pending: ${pendingJobs.length}, Unassigned: ${unassignedJobs.length}
- Active/Scheduled Jobs (${activeJobs.length}):
${jobsList || 'None'}
- Unassigned Jobs Needing Technician Assignment (${unassignedJobs.length}):
${unassignedJobsList || 'None (All active jobs assigned)'}
- Overdue Invoices (${overdueInvoices.length}):
${overdueInvoicesList || 'None'}
- Pending Quotes: ${pendingQuotes.length}
- Low Stock Items Needing Reorder: ${lowStockList || 'None (All stock levels adequate)'}

Currently Logged-in User Profile:
- Name: ${currentUser ? currentUser.name : 'Unknown User'}
- Role: ${currentUser ? currentUser.role : 'Unknown Role'}
- Permissions: ${userPermissions}
- Deep User Memory Graph (Structured Preferences/Rules):
${formattedMemory}

Action Execution Formats:
Action parameters can be passed as structured JSON objects OR pipe-separated strings. JSON payloads are preferred for precision.
- To assign a job to a technician: [ACTION: ASSIGN_TECH, {"jobId": "1002", "technicianName": "John Doe"}]
- To resolve scheduling conflict: [ACTION: RESOLVE_CONFLICT, {"jobId": "1002", "scheduledDate": "2026-07-25", "technicianName": "Jane Smith"}]
- To analyze schedule and suggest bulk optimizations: [ACTION: OPTIMIZE_SCHEDULE, {"date": "2026-07-25"}]
- To bulk update status: [ACTION: BULK_UPDATE_STATUS, {"collection": "jobs", "identifiers": ["1001", "1002"], "status": "In Progress"}]
- To reorder stock item: [ACTION: REORDER_STOCK, {"itemId": "stock_123", "supplierName": "Rexel", "quantity": 10}]
- To jump to a view: [ACTION: JUMP_VIEW, SavedViewName]
- To add a dashboard widget: [ACTION: ADD_WIDGET, WidgetID]
- To fit canvas: [ACTION: FIT_CANVAS]
- To lock/unlock canvas: [ACTION: LOCK_CANVAS, true] or [ACTION: LOCK_CANVAS, false]
- To navigate: [ACTION: NAVIGATE, PageName] (e.g. jobs, quotes, invoices, customers, schedule, stock, etc.)
- To create customer: [ACTION: CREATE_CUSTOMER, {"type": "Commercial", "firstName": "Barry", "lastName": "Buttons", "companyName": "Buttons Plumbing", "email": "barry@buttons.com"}]
- To create job: [ACTION: CREATE_JOB, {"title": "Fix Tap", "status": "Scheduled", "customerName": "Barry Buttons", "technicianName": "John Doe", "scheduledDate": "2026-07-25"}]
- To create quote: [ACTION: CREATE_QUOTE, {"title": "Proposal", "status": "Draft", "customerName": "Barry Buttons", "total": 1100, "line_items": [{"name": "Tap", "quantity": 1, "unitPrice": 100}]}]
- To create invoice: [ACTION: CREATE_INVOICE, {"title": "Invoice", "status": "Sent", "jobNum": "1005", "customerName": "Barry Buttons", "total": 165, "line_items": [{"name": "Tap", "quantity": 1, "unitPrice": 150}]}]
- To update a record's fields: [ACTION: UPDATE_RECORD, {"collection": "jobs", "id": "1002", "updates": {"status": "In Progress", "technicianName": "Jane Smith"}}]
- To delete record: [ACTION: DELETE_RECORD, jobs | 1002]
- To save memory fact: [ACTION: UPDATE_FACTSHEET, Single concise fact]
- To ask single question: [QUESTION: Text? | Opt 1 | Opt 2]
- To ask multi question: [QUESTION_MULTI: Text? | Opt 1 | Opt 2]
${FLAGS.maps ? `
Routing & Drive Times (live Google Maps data):
- You have access to real driving distances, ETAs and route optimisation. When the user asks about the best order to visit jobs, a technician's route/run for a day, or the drive time between two places, emit ONE of these tags and STOP — the routing service will compute the real numbers and hand them back to you to phrase the final answer. Never invent drive times or distances yourself.
- Best visit order + ETAs for a technician's day: [ACTION: ROUTE_PLAN, {"technicianName": "John Doe", "date": "2026-07-25"}] (technicianName optional = whole team; date accepts "today"/"tomorrow" or YYYY-MM-DD — resolve relative dates using the Current Local Date above).
- Drive time between two points: [ACTION: DRIVE_TIME, {"from": "office", "to": "#1005"}] — each of from/to may be "office", a job number like "#1005", a customer name, or a literal address.
` : ''}
Always perform requested actions using action tags. Do not state you are unable to modify data.`;
}

const ACTION_REGEX = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*([^\]]+))?\]/gi;

// Parse [ACTION: ...] tags out of a reply WITHOUT executing them.
// Returns { actions: [{ action, param }], cleanReply }. The attachment flow uses
// this to hold extracted records for user confirmation before creating them.
function extractActions(reply) {
  const actions = [];
  let cleanReply = reply;
  
  const prefix = '[ACTION:';
  let startIndex = 0;
  
  while ((startIndex = cleanReply.toUpperCase().indexOf(prefix, startIndex)) !== -1) {
    let bracketCount = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < cleanReply.length; i++) {
      if (cleanReply[i] === '[') bracketCount++;
      else if (cleanReply[i] === ']') bracketCount--;
      
      if (bracketCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex !== -1) {
      const fullTag = cleanReply.substring(startIndex, endIndex + 1);
      const inner = fullTag.substring(prefix.length, fullTag.length - 1).trim();
      
      const firstComma = inner.indexOf(',');
      let actionName, paramStr;
      
      if (firstComma !== -1) {
        actionName = inner.substring(0, firstComma).trim().toUpperCase();
        paramStr = inner.substring(firstComma + 1).trim();
      } else {
        actionName = inner.toUpperCase();
        paramStr = null;
      }
      
      actions.push({ action: actionName, param: paramStr });
      cleanReply = cleanReply.substring(0, startIndex) + cleanReply.substring(endIndex + 1);
    } else {
      // Malformed tag, just skip past it
      startIndex += prefix.length;
    }
  }
  
  cleanReply = cleanReply.trim();
  return { actions, cleanReply };
}

function parseJsonParam(param) {
  if (!param) return null;
  const trimmed = param.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.warn('Failed to parse JSON action parameter:', param, e);
      return null;
    }
  }
  return null;
}

// Execute a single parsed action against the store / dashboard.
function executeAction(action, param) {
  const ff = window.__fieldForge || {};
  const json = parseJsonParam(param);

  try {
      if (action === 'ASSIGN_TECH' && param) {
        if (!checkCollectionPermission('jobs', 'edit')) return;
        let jobId = json?.jobId || json?.id;
        let techName = json?.technicianName || json?.techName || json?.technicianId;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          jobId = parts[0];
          techName = parts[1];
        }

        const list = store.getAll('jobs') || [];
        const job = list.find(j => j.id === jobId || String(j.number) === String(jobId));
        if (!job) {
          showToast(`Could not find Job "${jobId}".`, 'error');
          return;
        }

        const allTechs = store.getAll('technicians') || [];
        if (techName) {
          const isDeactivated = allTechs.some(t => t.name.toLowerCase() === techName.toLowerCase() && t.deactivated);
          if (isDeactivated) {
            showToast(`Cannot assign job: ${techName} is a deactivated technician.`, 'error');
            return;
          }
        }

        const technicians = allTechs.filter(t => !t.deactivated);
        const tech = technicians.find(t => t.name.toLowerCase() === (techName || '').toLowerCase() || t.id === techName);
        job.technicianName = tech ? tech.name : (techName || 'Unassigned');
        job.technician_id = tech ? tech.id : null;
        job.updatedAt = new Date().toISOString();
        store.save('jobs', list);
        showToast(`Assigned Job #${job.number || job.id} to ${job.technicianName}.`, 'success');

      } else if (action === 'RESOLVE_CONFLICT' && param) {
        if (!checkCollectionPermission('jobs', 'edit')) return;
        let jobId = json?.jobId || json?.id;
        let newDate = json?.scheduledDate || json?.newDate;
        let newTech = json?.technicianName || json?.newTech;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          jobId = parts[0];
          newDate = parts[1];
          newTech = parts[2];
        }

        const list = store.getAll('jobs') || [];
        const job = list.find(j => j.id === jobId || String(j.number) === String(jobId));
        if (!job) {
          showToast(`Could not find Job "${jobId}".`, 'error');
          return;
        }

        if (newDate) job.scheduledDate = newDate;
        if (newTech) {
          const allTechs = store.getAll('technicians') || [];
          const tech = allTechs.filter(t => !t.deactivated).find(t => t.name.toLowerCase() === newTech.toLowerCase());
          job.technicianName = tech ? tech.name : newTech;
          job.technician_id = tech ? tech.id : null;
        }
        job.updatedAt = new Date().toISOString();
        store.save('jobs', list);
        showToast(`Resolved schedule conflict for Job #${job.number || job.id}.`, 'success');

      } else if (action === 'OPTIMIZE_SCHEDULE' && param) {
        // Just acknowledging the command visually, the AI handles the actual text reasoning and emits RESOLVE_CONFLICTs
        let date = json?.date;
        if (!json) date = param.trim();
        showToast(`Optimizing schedule conflicts for ${date || 'all dates'}...`, 'info');

      } else if (action === 'BULK_UPDATE_STATUS' && param) {
        let collection = json?.collection;
        let identifiers = (json?.identifiers || json?.ids || []).map(String);
        let status = json?.status;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          collection = parts[0];
          status = parts[1];
          identifiers = parts[2] ? parts[2].split(',').map(s => String(s.trim())) : [];
        }

        if (!collection || !status || !checkCollectionPermission(collection, 'edit')) return;
        const list = store.getAll(collection) || [];
        let count = 0;
        list.forEach(item => {
          if (identifiers.includes(item.id) || identifiers.includes(String(item.number))) {
            item.status = status;
            item.updatedAt = new Date().toISOString();
            count++;
          }
        });
        if (count > 0) {
          store.save(collection, list);
          showToast(`Updated status to "${status}" for ${count} item(s) in ${collection}.`, 'success');
        } else {
          showToast(`No matching items found in ${collection} to update status.`, 'error');
        }

      } else if (action === 'REORDER_STOCK' && param) {
        if (!checkCollectionPermission('purchaseOrders', 'create')) return;
        let itemId = json?.itemId || json?.id;
        let supplierName = json?.supplierName || json?.supplier || 'Default Supplier';
        let qty = Number(json?.quantity || json?.qty) || 10;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          itemId = parts[0];
          qty = Number(parts[1]) || 10;
          supplierName = parts[2] || 'Default Supplier';
        }

        const stockList = store.getAll('stock') || [];
        const stockItem = stockList.find(s => s.id === itemId || s.name?.toLowerCase() === itemId?.toLowerCase());
        const itemName = stockItem ? stockItem.name : (itemId || 'Stock Item');

        const pos = store.getAll('purchaseOrders') || [];
        const nextNum = pos.reduce((max, po) => {
          const num = parseInt(po.number) || 0;
          return num > max ? num : max;
        }, 1000) + 1;

        const newPo = {
          id: store.generateId(),
          number: String(nextNum),
          title: `PO for Reorder: ${itemName}`,
          supplierName: supplierName,
          status: 'Pending',
          total: (stockItem ? (stockItem.costPrice || 0) : 0) * qty,
          items: [{ stockId: stockItem ? stockItem.id : null, name: itemName, quantity: qty }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        pos.push(newPo);
        store.save('purchaseOrders', pos);
        showToast(`Created PO #${nextNum} to reorder ${qty}x "${itemName}".`, 'success');

      } else if (action === 'ADD_WIDGET' && param) {
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
        const route = (json?.page || param).toLowerCase().trim();
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
        let type, firstName, lastName, companyName, email, phone, address;
        if (json) {
          type = json.type || 'Residential';
          firstName = json.firstName || json.first_name || '';
          lastName = json.lastName || json.last_name || '';
          companyName = json.companyName || json.company || '';
          email = json.email || '';
          phone = json.phone || '';
          address = json.address || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          type = parts[0] || 'Residential';
          firstName = parts[1] || '';
          lastName = parts[2] || '';
          companyName = parts[3] || '';
          email = parts[4] || '';
          phone = parts[5] || '';
          address = parts[6] || '';
        }

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
        let title, status, customerName, techName, scheduledDate, estHours, notes;
        if (json) {
          title = json.title || 'New Job';
          status = json.status || 'Scheduled';
          customerName = json.customerName || json.customer || '';
          techName = json.technicianName || json.techName || '';
          scheduledDate = json.scheduledDate || json.date || '';
          estHours = Number(json.estimated_hours || json.estHours || json.hours) || 0;
          notes = json.notes || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          title = parts[0] || 'New Job';
          status = parts[1] || 'Scheduled';
          customerName = parts[2] || '';
          techName = parts[3] || '';
          scheduledDate = parts[4] || '';
          estHours = Number(parts[5]) || 0;
          notes = parts[6] || '';
        }

        const list = store.getAll('jobs') || [];
        const nextNum = list.reduce((max, j) => {
          const num = parseInt(j.number) || 0;
          return num > max ? num : max;
        }, 1000) + 1;

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase() || c.company?.toLowerCase() === customerName.toLowerCase());

        const allTechs = store.getAll('technicians') || [];
        if (techName) {
          const isDeactivated = allTechs.some(t => t.name.toLowerCase() === techName.toLowerCase() && t.deactivated);
          if (isDeactivated) {
            showToast(`Cannot create job: ${techName} is a deactivated technician.`, 'error');
            return;
          }
        }
        const technicians = allTechs.filter(t => !t.deactivated);
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
        let title, status, customerName, subtotal, tax, total, validUntil, notes;
        if (json) {
          title = json.title || 'New Quote';
          status = json.status || 'Draft';
          customerName = json.customerName || json.customer || '';
          subtotal = Number(json.subtotal) || 0;
          tax = Number(json.tax) || 0;
          total = Number(json.total) || 0;
          validUntil = json.valid_until || json.validUntil || '';
          notes = json.notes || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          title = parts[0] || 'New Quote';
          status = parts[1] || 'Draft';
          customerName = parts[2] || '';
          subtotal = Number(parts[3]) || 0;
          tax = Number(parts[4]) || 0;
          total = Number(parts[5]) || 0;
          validUntil = parts[6] || '';
          notes = parts[7] || '';
        }

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
        let title, status, jobNum, customerName, subtotal, tax, total, dueDate, notes;
        if (json) {
          title = json.title || 'New Invoice';
          status = json.status || 'Sent';
          jobNum = json.job_id || json.jobNum || '';
          customerName = json.customerName || json.customer || '';
          subtotal = Number(json.subtotal) || 0;
          tax = Number(json.tax) || 0;
          total = Number(json.total) || 0;
          dueDate = json.due_date || json.dueDate || '';
          notes = json.notes || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          title = parts[0] || 'New Invoice';
          status = parts[1] || 'Sent';
          jobNum = parts[2] || '';
          customerName = parts[3] || '';
          subtotal = Number(parts[4]) || 0;
          tax = Number(parts[5]) || 0;
          total = Number(parts[6]) || 0;
          dueDate = parts[7] || '';
          notes = parts[8] || '';
        }

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
        let collection, identifier, updates;
        if (json) {
          collection = json.collection;
          let rawId = json.id || json.identifier || json.number;
          identifier = rawId != null ? String(rawId) : '';
          if (json.updates && typeof json.updates === 'object') {
            updates = json.updates;
          } else {
            const fieldName = json.field || json.fieldName;
            const newValue = json.value || json.newValue;
            updates = {};
            if (fieldName) updates[fieldName] = newValue;
          }
        } else {
          const parts = param.split('|').map(p => p.trim());
          collection = parts[0];
          identifier = parts[1];
          updates = {};
          if (parts[2]) updates[parts[2]] = parts[3];
        }

        if (!checkCollectionPermission(collection, 'edit')) return;

        const list = store.getAll(collection) || [];
        const item = list.find(it => it.id === identifier || String(it.number) === identifier || (it.first_name && `${it.first_name || ''} ${it.last_name || ''}`.trim().toLowerCase() === identifier.toLowerCase()));
        if (item) {
          let updatedCount = 0;
          for (const [fieldName, newValue] of Object.entries(updates)) {
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
            if (typeof newValue === 'string' && !isNaN(newValue) && newValue !== '') val = Number(newValue);

            if (targetField === 'technicianName' && val) {
              const allTechs = store.getAll('technicians') || [];
              const isDeactivated = allTechs.some(t => t.name.toLowerCase() === val.toLowerCase() && t.deactivated);
              if (isDeactivated) {
                showToast(`Cannot assign job: ${val} is a deactivated technician.`, 'error');
                return;
              }
            }

            item[targetField] = val;
            updatedCount++;
          }
          item.updatedAt = new Date().toISOString();

          // Try to link technician_id if tech name was updated
          if (updates.technicianName || updates.technician_name) {
            const val = updates.technicianName || updates.technician_name;
            const allTechs = store.getAll('technicians') || [];
            const tech = allTechs.filter(t => !t.deactivated).find(t => t.name.toLowerCase() === (val || '').toLowerCase());
            if (tech) {
              item.technician_id = tech.id;
            } else {
              item.technician_id = null;
            }
          }

          store.save(collection, list);
          const displayLabel = item.number ? `#${item.number}` : (item.name || item.title || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.id);
          const updatedFields = Object.keys(updates).join(', ');
          showToast(`Updated [${updatedFields}] for ${collection.slice(0, -1)} "${displayLabel}".`, 'success');
        } else {
          showToast(`Could not find ${collection.slice(0, -1)} "${identifier}".`, 'error');
        }

      } else if (action === 'DELETE_RECORD' && param) {
        let collection, identifier;
        if (json) {
          collection = json.collection;
          let rawId = json.id || json.identifier || json.number;
          identifier = rawId != null ? String(rawId) : '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          collection = parts[0];
          identifier = parts[1];
        }

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
export async function parseAndExecuteActions(reply) {
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

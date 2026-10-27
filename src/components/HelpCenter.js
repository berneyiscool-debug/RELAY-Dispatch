// ============================================
// RELAY — HELP CENTER
// ============================================
// The Help (?) button in the top bar opens this: a searchable guide to every part
// of the app, with buttons that jump straight to the page being described, start
// the tours, or hand a question to brny. Content lives in utils/helpContent.js.
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { showModal } from './Modal.js';
import { escapeHTML } from '../utils/security.js';
import { enterDemoMode, exitDemoMode, isGuestDemo } from '../utils/demoSession.js';
import { HELP_GROUPS, visibleTopics, searchHelp } from '../utils/helpContent.js';
import { restartOnboarding, startTour, isCloudAccount } from './Walkthrough.js';
import { openDeputyWithPrompt } from './RelayAssistant.js';

const POPULAR = ['first-job', 'quotes', 'jobs', 'invoices', 'schedule', 'brny'];

function topics() {
  return visibleTopics({ cloud: isCloudAccount() });
}

function getHelpTopic(id) {
  return topics().find(t => t.id === id) || null;
}

function cloudBadge() {
  return '<span class="help-cloud" title="Available with RELAY Cloud"><span class="material-icons-outlined">cloud</span>Cloud</span>';
}

function navHtml(activeId) {
  return `
    <button type="button" class="help-nav-item${activeId === 'home' ? ' is-active' : ''}" data-topic="home">
      <span class="material-icons-outlined">home</span><span>Help home</span>
    </button>
    ${HELP_GROUPS.map(group => `
      <div class="help-nav-group">${escapeHTML(group)}</div>
      ${topics().filter(t => t.group === group).map(t => `
        <button type="button" class="help-nav-item${activeId === t.id ? ' is-active' : ''}" data-topic="${t.id}">
          <span class="material-icons-outlined">${t.icon}</span><span>${escapeHTML(t.title)}</span>
        </button>`).join('')}
    `).join('')}
  `;
}

function promptsHtml(prompts) {
  if (!prompts || !prompts.length) return '';
  return `
    <div class="help-block">
      <div class="help-block-title">Ask <span class="brand-lc">brny</span></div>
      <div class="help-prompts">
        ${prompts.map(p => `
          <button type="button" class="help-prompt" data-prompt="${escapeHTML(p)}">
            <span class="material-icons-outlined">smart_toy</span>"${escapeHTML(p)}"
          </button>`).join('')}
      </div>
    </div>`;
}

function homeHtml() {
  const demo = store.demoMode;
  return `
    <div class="help-hero">
      <h2>How can we help?</h2>
      <p>Guides for every page in RELAY. Search above, pick a topic, or start with a walkthrough.</p>
    </div>

    <div class="help-block">
      <div class="help-block-title">Walkthroughs</div>
      <div class="help-cards">
        <button type="button" class="help-card" data-run="restart">
          <span class="material-icons-outlined">rocket_launch</span>
          <strong>Getting started</strong>
          <span>Customer → quote → job → invoice, step by step</span>
        </button>
        <button type="button" class="help-card" data-run="tour">
          <span class="material-icons-outlined">explore</span>
          <strong>Tour the app</strong>
          <span>Every page and what it's for</span>
        </button>
        <button type="button" class="help-card" data-run="settings-tour">
          <span class="material-icons-outlined">tune</span>
          <strong>Tour settings</strong>
          <span>What you can configure, and where</span>
        </button>
        <button type="button" class="help-card" data-run="demo">
          <span class="material-icons-outlined">${demo ? 'logout' : 'science'}</span>
          <strong>${demo ? 'Exit demo mode' : 'Explore demo mode'}</strong>
          <span>${demo ? (isGuestDemo() ? 'Back to the sign-in screen' : 'Back to your own data') : 'A sample business — your data stays untouched'}</span>
        </button>
      </div>
    </div>

    <div class="help-block">
      <div class="help-block-title">Popular topics</div>
      <div class="help-topic-grid">
        ${POPULAR.map(getHelpTopic).filter(Boolean).map(t => `
          <button type="button" class="help-topic-card" data-topic="${t.id}">
            <span class="material-icons-outlined">${t.icon}</span>
            <span><strong>${escapeHTML(t.title)}</strong><span>${escapeHTML(t.summary)}</span></span>
          </button>`).join('')}
      </div>
    </div>

    <div class="help-block help-shortcut-strip">
      <span><kbd>Ctrl</kbd> + <kbd>K</kbd> search</span>
      <span><kbd>Shift</kbd> + <kbd>B</kbd> brny</span>
      <span><kbd>Esc</kbd> close</span>
      <button type="button" class="help-link" data-topic="shortcuts">All shortcuts</button>
    </div>
  `;
}

function actionHtml(a) {
  const attrs = a.path ? `data-path="${escapeHTML(a.path)}"` : `data-run="${escapeHTML(a.run)}"`;
  return `<button type="button" class="btn btn-secondary btn-sm help-action" ${attrs}>
    <span class="material-icons-outlined">${a.icon || 'arrow_forward'}</span>${escapeHTML(a.label)}
  </button>`;
}

function topicHtml(topic) {
  const local = !isCloudAccount();
  return `
    <div class="help-topic-head">
      <span class="material-icons-outlined help-topic-icon">${topic.icon}</span>
      <div>
        <div class="help-topic-group">${escapeHTML(topic.group)}</div>
        <h2>${escapeHTML(topic.title)}</h2>
        <p>${escapeHTML(topic.summary)}</p>
      </div>
    </div>
    ${topic.actions && topic.actions.length ? `<div class="help-actions">${topic.actions.map(actionHtml).join('')}</div>` : ''}
    ${(topic.sections || []).map(section => `
      <div class="help-block">
        <div class="help-block-title">${escapeHTML(section.heading)}</div>
        <dl class="help-items">
          ${section.items.map(item => `
            <div class="help-item" data-item="${escapeHTML(item.label)}">
              <dt>${escapeHTML(item.label)}${item.cloud && local ? ` ${cloudBadge()}` : ''}</dt>
              <dd>${escapeHTML(item.text)}</dd>
            </div>`).join('')}
        </dl>
      </div>`).join('')}
    ${promptsHtml(topic.prompts)}
  `;
}

function resultsHtml(query) {
  const results = searchHelp(query, topics());
  if (!results.length) {
    return `
      <div class="help-empty">
        <span class="material-icons-outlined">search_off</span>
        <p>Nothing matches "${escapeHTML(query)}".</p>
        <button type="button" class="btn btn-secondary btn-sm" data-prompt="${escapeHTML(query)}">
          <span class="material-icons-outlined">smart_toy</span> Ask brny instead
        </button>
      </div>`;
  }
  return `
    <div class="help-block-title">${results.length} result${results.length === 1 ? '' : 's'}</div>
    <ul class="help-results">
      ${results.slice(0, 40).map(({ topic, item }) => `
        <li>
          <button type="button" class="help-result" data-topic="${topic.id}" ${item ? `data-focus="${escapeHTML(item.label)}"` : ''}>
            <span class="material-icons-outlined">${topic.icon}</span>
            <span>
              <strong>${escapeHTML(item ? item.label : topic.title)}</strong>
              <span>${escapeHTML(item ? item.text : topic.summary)}</span>
              ${item ? `<em>${escapeHTML(topic.title)}</em>` : ''}
            </span>
          </button>
        </li>`).join('')}
    </ul>
  `;
}

export function openHelpCenter(startTopic = 'home') {
  const content = document.createElement('div');
  content.className = 'help-center';
  content.innerHTML = `
    <div class="help-search">
      <span class="material-icons-outlined">search</span>
      <input type="search" id="help-search-input" placeholder="Search help — try &quot;payment reminder&quot; or &quot;recurring&quot;" aria-label="Search help" autocomplete="off">
    </div>
    <div class="help-body">
      <nav class="help-nav" aria-label="Help topics"></nav>
      <section class="help-pane" aria-live="polite"></section>
    </div>
  `;

  const nav = content.querySelector('.help-nav');
  const pane = content.querySelector('.help-pane');
  const search = content.querySelector('#help-search-input');
  let current = startTopic;

  function show(id, focusLabel) {
    current = id;
    const topic = id === 'home' ? null : getHelpTopic(id);
    nav.innerHTML = navHtml(topic ? id : 'home');
    pane.innerHTML = topic ? topicHtml(topic) : homeHtml();
    pane.scrollTop = 0;
    nav.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
    if (focusLabel) {
      const el = [...pane.querySelectorAll('.help-item')].find(n => n.dataset.item === focusLabel);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.classList.add('is-flash');
      }
    }
  }

  const { close } = showModal({ title: 'Help Center', content, size: 'modal-xl help-center-modal' });

  search.addEventListener('input', () => {
    const q = search.value.trim();
    if (!q) { show(current); return; }
    nav.innerHTML = navHtml(null);
    pane.innerHTML = resultsHtml(q);
    pane.scrollTop = 0;
  });

  content.addEventListener('click', (e) => {
    const el = e.target.closest('[data-topic], [data-path], [data-run], [data-prompt]');
    if (!el) return;
    if (el.dataset.topic) {
      search.value = '';
      show(el.dataset.topic, el.dataset.focus);
      return;
    }
    if (el.dataset.path) {
      close();
      router.navigate(el.dataset.path);
      return;
    }
    if (el.dataset.prompt) {
      close();
      openDeputyWithPrompt(el.dataset.prompt);
      return;
    }
    const run = el.dataset.run;
    close();
    if (run === 'restart') restartOnboarding();
    else if (run === 'tour') startTour('pages');
    else if (run === 'settings-tour') startTour('settings');
    else if (run === 'demo') { if (store.demoMode) exitDemoMode(); else enterDemoMode(); }
  });

  show(startTopic);
  setTimeout(() => search.focus(), 50);
}

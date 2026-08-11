import { escapeHTML } from '../utils/security.js';

// Multi-select action bar. Renders into the breadcrumb row (the app's shared
// action row): while rows are selected it shows "N selected" + icon-only action
// buttons on the right, and the page's filters (#breadcrumb-actions) are hidden.
// Clearing the selection restores the filters. Falls back to appending to the
// page container if there is no breadcrumb (e.g. embedded contexts).
export function createBulkActionBar({ container, selectedIds, actions, onClear }) {
  // Prefer the breadcrumb's action group: the bulk actions slide in from the
  // right alongside the (still-visible) filters. Fall back to the page container.
  const bcActions = document.getElementById('breadcrumb-actions');
  const host = bcActions || container;
  const existing = host.querySelector('.bulk-action-bar');

  // No selection → remove the bar; restore filters and create buttons.
  if (!selectedIds || selectedIds.length === 0) {
    if (existing) existing.remove();
    if (bcActions) bcActions.classList.remove('has-bulk');
    document.querySelectorAll('.page-header, .page-header-actions').forEach(el => el.classList.remove('has-bulk'));
    return;
  }

  const isFirst = !existing;
  const bar = existing || document.createElement('div');
  bar.className = 'bulk-action-bar' + (isFirst ? ' slide-in-right' : '');

  let html = `
    <span class="bulk-count">${selectedIds.length} selected</span>
    <div class="bulk-actions-separator"></div>
  `;
  actions.forEach((act, i) => {
    if (act.icon) {
      html += `<button class="btn-icon ${act.className || ''}" data-action="${i}" data-tooltip="${escapeHTML(act.label)}" data-tooltip-pos="bottom">
        <span class="material-icons-outlined">${escapeHTML(act.icon)}</span>
      </button>`;
    } else {
      html += `<button class="btn btn-ghost btn-sm" data-action="${i}">${escapeHTML(act.label)}</button>`;
    }
  });
  html += `
    <div class="bulk-actions-separator"></div>
    <button class="btn-icon btn-clear-selection" id="btn-clear-selection" data-tooltip="Clear selection" data-tooltip-pos="bottom">
      <span class="material-icons-outlined">close</span>
    </button>`;
  bar.innerHTML = html;

  bar.querySelector('#btn-clear-selection').addEventListener('click', () => { if (onClear) onClear(); });
  bar.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.action;
      if (actions[idx] && actions[idx].onClick) actions[idx].onClick(selectedIds);
    });
  });

  if (isFirst) {
    host.appendChild(bar);
    if (bcActions) bcActions.classList.add('has-bulk');
    document.querySelectorAll('.page-header, .page-header-actions').forEach(el => el.classList.add('has-bulk'));
  }
  return bar;
}

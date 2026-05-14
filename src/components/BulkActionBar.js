import { escapeHTML } from '../utils/security.js';

export function createBulkActionBar({ container, selectedIds, actions, onClear }) {
  // Remove existing
  const existing = container.querySelector('.bulk-action-bar');
  if (existing) {
    existing.remove();
  }

  if (!selectedIds || selectedIds.length === 0) {
    return; // Don't render if nothing is selected
  }

  const bar = document.createElement('div');
  bar.className = 'bulk-action-bar slide-up';
  
  let html = `
    <div class="bulk-action-left">
      <span class="bulk-count">${selectedIds.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;

  actions.forEach((act, i) => {
    html += `<button class="btn ${act.className || 'btn-secondary'} btn-sm" data-action="${i}">
      ${act.icon ? `<span class="material-icons-outlined" style="font-size:16px">${escapeHTML(act.icon)}</span> ` : ''}
      ${escapeHTML(act.label)}
    </button>`;
  });

  html += `</div>`;
  bar.innerHTML = html;

  bar.querySelector('#btn-clear-selection').addEventListener('click', () => {
    if (onClear) onClear();
  });

  bar.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.action;
      if (actions[idx] && actions[idx].onClick) {
        actions[idx].onClick(selectedIds);
      }
    });
  });

  container.appendChild(bar);
  return bar;
}

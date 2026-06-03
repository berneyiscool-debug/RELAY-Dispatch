import { escapeHTML } from '../utils/security.js';

export function createBulkActionBar({ container, selectedIds, actions, onClear }) {
  // Check if we already have one
  const existing = container.querySelector('.bulk-action-bar') || container.querySelector('.toolbar-bulk-actions');
  
  if (!selectedIds || selectedIds.length === 0) {
    if (existing) {
      existing.remove();
    }
    const toolbar = container.querySelector('.page-toolbar');
    if (toolbar) {
      toolbar.classList.remove('has-bulk-actions');
    }
    return;
  }

  // Create or reuse
  const toolbar = container.querySelector('.page-toolbar');
  const useToolbar = !!toolbar;
  
  const desiredParent = useToolbar ? toolbar : container;
  const isFirstRender = !existing || existing.parentNode !== desiredParent;
  
  if (existing && isFirstRender) {
    existing.remove();
    const prevToolbar = container.querySelector('.page-toolbar');
    if (prevToolbar) {
      prevToolbar.classList.remove('has-bulk-actions');
    }
  }
  
  const bar = (isFirstRender ? document.createElement('div') : existing);
  
  // Set correct classes and toolbar state
  if (useToolbar) {
    bar.className = 'toolbar-bulk-actions' + (isFirstRender ? ' slide-up' : '');
    toolbar.classList.add('has-bulk-actions');
  } else {
    bar.className = 'bulk-action-bar' + (isFirstRender ? ' slide-up' : '');
    const prevToolbar = container.querySelector('.page-toolbar');
    if (prevToolbar) {
      prevToolbar.classList.remove('has-bulk-actions');
    }
  }

  // Populate innerHTML
  if (useToolbar) {
    let html = `
      <div class="bulk-action-left">
        <span class="bulk-count">${selectedIds.length} selected</span>
      </div>
      <div class="bulk-actions-separator"></div>
      <div class="bulk-action-right">
    `;

    actions.forEach((act, i) => {
      // If there is an icon, make it icon-only with a tooltip. If no icon, display the label.
      if (act.icon) {
        html += `<button class="btn-icon ${act.className || ''}" data-action="${i}" data-tooltip="${escapeHTML(act.label)}" data-tooltip-pos="bottom">
          <span class="material-icons-outlined">${escapeHTML(act.icon)}</span>
        </button>`;
      } else {
        html += `<button class="btn btn-ghost btn-sm" data-action="${i}">
          ${escapeHTML(act.label)}
        </button>`;
      }
    });

    html += `
      </div>
      <div class="bulk-actions-separator"></div>
      <button class="btn-icon btn-clear-selection" id="btn-clear-selection" data-tooltip="Clear Selection" data-tooltip-pos="bottom">
        <span class="material-icons-outlined">close</span>
      </button>
    `;
    bar.innerHTML = html;
  } else {
    // Fallback bottom bar
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
  }

  // Add event listeners
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

  // If first render, insert it in the DOM
  if (isFirstRender) {
    if (useToolbar) {
      const search = toolbar.querySelector('.toolbar-search');
      if (search) {
        toolbar.insertBefore(bar, search);
      } else {
        toolbar.appendChild(bar);
      }
    } else {
      container.appendChild(bar);
    }
  }
  
  return bar;
}

// ============================================
// RELAY DISPATCH — MODAL COMPONENT
// ============================================

import { escapeHTML } from '../utils/security.js';

const activeModals = new Map();

function getContentKey(content) {
  if (typeof content === 'string') return content;
  if (!content) return '';

  const fields = [...(content.querySelectorAll?.('input, textarea, select') || [])].map(field => ({
    tag: field.tagName,
    type: field.type,
    name: field.name,
    value: field.value,
    checked: field.checked
  }));

  return JSON.stringify({
    html: content.outerHTML || [...(content.childNodes || [])]
      .map(node => node.outerHTML || node.textContent || '')
      .join('') || content.textContent || '',
    fields
  });
}

export function showModal({ title, content, size = '', onClose, actions = [] }) {
  const modalKey = JSON.stringify([
    title,
    size,
    getContentKey(content),
    actions.map(action => [action.label, action.className || 'btn-secondary'])
  ]);
  const existing = activeModals.get(modalKey);
  if (existing?.overlay.isConnected) return existing;
  if (existing) activeModals.delete(modalKey);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = `modal ${size}`;

  let html = `
    <div class="modal-header">
      <h3>${escapeHTML(title)}</h3>
      <button class="modal-close modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof content === 'string' ? escapeHTML(content) : ''}</div>
  `;

  if (actions.length) {
    html += '<div class="modal-footer">';
    actions.forEach((action, i) => {
      html += `<button class="btn ${action.className || 'btn-secondary'} modal-action-${i}">${escapeHTML(action.label)}</button>`;
    });
    html += '</div>';
  }

  modal.innerHTML = html;

  // If content is an element, append it
  if (typeof content !== 'string' && (content instanceof HTMLElement || content instanceof DocumentFragment)) {
    modal.querySelector('.modal-body').innerHTML = '';
    modal.querySelector('.modal-body').appendChild(content);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close handlers
  let closed = false;
  let escHandler;
  const handle = { close: null, modal, overlay };
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.remove();
    document.removeEventListener('keydown', escHandler);
    if (activeModals.get(modalKey) === handle) activeModals.delete(modalKey);
    if (onClose) onClose();
  };
  handle.close = close;
  activeModals.set(modalKey, handle);

  modal.querySelector('.modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Action handlers. An action with no handler is a dismissal ("Close"/"Cancel") — without
  // this the button renders but does nothing.
  actions.forEach((action, i) => {
    const btn = modal.querySelector(`.modal-action-${i}`);
    if (!btn) return;
    btn.addEventListener('click', () => (action.onClick ? action.onClick(close) : close()));
  });

  // ESC key
  escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  document.addEventListener('keydown', escHandler);

  return handle;
}

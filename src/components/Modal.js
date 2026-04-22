// ============================================
// SIMPRO CLONE — MODAL COMPONENT
// ============================================

import { escapeHTML } from '../utils/security.js';

export function showModal({ title, content, size = '', onClose, actions = [] }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = `modal ${size}`;

  let html = `
    <div class="modal-header">
      <h3>${escapeHTML(title)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof content === 'string' ? escapeHTML(content) : ''}</div>
  `;

  if (actions.length) {
    html += '<div class="modal-footer">';
    actions.forEach((action, i) => {
      html += `<button class="btn ${action.className || 'btn-secondary'}" id="modal-action-${i}">${escapeHTML(action.label)}</button>`;
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
  const close = () => {
    overlay.remove();
    if (onClose) onClose();
  };

  modal.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Action handlers
  actions.forEach((action, i) => {
    const btn = modal.querySelector(`#modal-action-${i}`);
    if (btn && action.onClick) {
      btn.addEventListener('click', () => action.onClick(close));
    }
  });

  // ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  return { close, modal, overlay };
}

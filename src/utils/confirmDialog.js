// ============================================
// RELAY DISPATCH — CONFIRM / ALERT DIALOGS
// ============================================
//
// Promise-based replacements for window.confirm() and window.alert(). The
// native dialogs render browser chrome that ignores the app's design language,
// so prompts route through the shared Modal component instead.

import { showModal } from '../components/Modal.js';

// pre-line keeps the newlines some prompts rely on to separate a question from
// its consequence; textContent escapes the message for free.
function createMessageElement(message) {
  const el = document.createElement('div');
  el.className = 'confirm-dialog-message';
  el.textContent = message;
  return el;
}

function openMessageBox({ title, message, actions, focusIndex }) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const handle = showModal({
      title,
      content: createMessageElement(message),
      actions: actions.map((action) => ({
        label: action.label,
        className: action.className,
        onClick: (close) => {
          settle(action.value);
          close();
        },
      })),
      // Dismissing (close button, overlay click, ESC) resolves to the first
      // action's value, which is always the non-destructive choice.
      onClose: () => settle(actions[0].value),
    });

    const target = handle.modal.querySelector(`.modal-action-${focusIndex}`);
    if (target) target.focus();
  });
}

/**
 * Themed replacement for window.confirm(). Resolves false when dismissed.
 */
export function showConfirm(message, options = {}) {
  const {
    title = 'Confirm',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = options;

  return openMessageBox({
    title,
    message,
    actions: [
      { label: cancelLabel, className: 'btn-secondary', value: false },
      { label: confirmLabel, className: danger ? 'btn-danger' : 'btn-primary', value: true },
    ],
    // Focus the safe choice for destructive prompts so a stray Enter can't delete.
    focusIndex: danger ? 0 : 1,
  });
}

/**
 * Themed replacement for window.alert().
 */
export function showAlert(message, options = {}) {
  const { title = 'Notice', okLabel = 'OK' } = options;

  return openMessageBox({
    title,
    message,
    actions: [{ label: okLabel, className: 'btn-primary' }],
    focusIndex: 0,
  });
}

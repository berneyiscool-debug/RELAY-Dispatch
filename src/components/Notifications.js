// ============================================
// SIMPRO CLONE — TOAST NOTIFICATIONS
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';

let container = null;

function ensureContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info', options = {}) {
  const duration = typeof options === 'number' ? options : (options.duration || 3500);
  const link = typeof options === 'object' ? options.link : null;
  const skipBell = typeof options === 'object' ? options.skipBell : false;

  // Integrate clickable toasts into the notification bell automatically
  if (link && !skipBell) {
    let title = 'Notification';
    if (type === 'success') title = 'Success';
    if (type === 'error') title = 'Error';
    if (type === 'warning') title = 'Warning';
    
    store.create('notifications', {
      title,
      message,
      link,
      read: false,
      createdBy: 'System'
    });
  }

  const c = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  if (link) {
    toast.style.cursor = 'pointer';
    toast.title = 'Click to view';
  }

  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  toast.innerHTML = `
    <span class="material-icons-outlined" style="color:var(--color-${type === 'error' ? 'danger' : type})">${icons[type] || icons.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${message}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `;

  if (link) {
    toast.addEventListener('click', (e) => {
      if (!e.target.closest('.toast-close')) {
        router.navigate(link);
        toast.remove();
      }
    });
  }

  toast.querySelector('.toast-close').addEventListener('click', (e) => {
    e.stopPropagation();
    toast.remove();
  });
  c.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

export function addSystemNotification(title, message, link) {
  store.create('notifications', {
    title, message, link, read: false,
    createdBy: 'System'
  });
  showToast(`${title}: ${message}`, 'info', { link, skipBell: true });
}

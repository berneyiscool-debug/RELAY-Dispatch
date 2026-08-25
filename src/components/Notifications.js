// ============================================
// RELAY — TOAST NOTIFICATIONS & SYSTEM NOTICES
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { escapeHTML } from '../utils/security.js';

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

function trimNotices() {
  const allNotices = store.getAll('notices') || [];
  if (allNotices.length > 40) {
    // Sort oldest first and trim items beyond 40
    const sorted = [...allNotices].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const toRemove = sorted.slice(0, sorted.length - 40);
    toRemove.forEach(n => {
      store.delete('notices', n.id);
    });
  }
}

export function showToast(message, type = 'info', options = {}) {
  const duration = typeof options === 'number' ? options : (options.duration || 3500);
  const link = typeof options === 'object' ? options.link : null;
  const skipBell = typeof options === 'object' ? options.skipBell : false;

  // Integrate toasts into the Notices dropdown automatically
  if (!skipBell) {
    try {
      let title = 'System Notice';
      if (type === 'success') title = 'Success';
      if (type === 'error') title = 'System Alert';
      if (type === 'warning') title = 'Warning';
      
      store.create('notices', {
        title,
        message,
        link,
        type,
        read: false,
        createdBy: 'System',
        createdAt: new Date().toISOString()
      });
      trimNotices();
    } catch (e) {
      console.warn('Failed to log notice:', e);
    }
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
    <span style="flex:1;font-size:var(--font-size-base)">${escapeHTML(message)}</span>
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

export function addSystemNotice(title, message, link, type = 'info') {
  store.create('notices', {
    title,
    message,
    link,
    type,
    read: false,
    createdBy: 'System',
    createdAt: new Date().toISOString()
  });
  trimNotices();
  showToast(`${title}: ${message}`, type, { link, skipBell: true });
}

export const addSystemNotification = addSystemNotice;

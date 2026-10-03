// ============================================
// RELAY — DATA BACKUP HELPERS
// ============================================
// Every destructive action (restore, delete company, cloud migration) offers a
// portable JSON copy first, so these helpers live outside the Settings page.

import { store } from '../data/store.js';
import { escapeHTML } from './security.js';
import { showToast } from '../components/Notifications.js';

// Save a portable JSON copy of every collection, used before destructive actions
export function downloadDataSnapshot(prefix = 'relay-data') {
  const snapshot = store.exportSnapshot();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fileName = `${prefix}-${stamp}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

// Standard "download a copy first" opt-out used by every destructive action
export function backupCheckboxHtml(prefix) {
  return `
    <label style="display:flex; align-items:flex-start; gap:8px; color:var(--text-secondary); margin-bottom:16px; cursor:pointer;">
      <input type="checkbox" id="danger-backup-first" checked data-backup-prefix="${escapeHTML(prefix)}" style="margin-top:2px;" />
      <span>Download a copy of my data (JSON) before continuing</span>
    </label>
  `;
}

export function runBackupIfRequested(root, fallbackPrefix) {
  const box = root.querySelector('#danger-backup-first');
  if (!box || !box.checked) return null;
  const prefix = box.dataset.backupPrefix || fallbackPrefix;
  try {
    return downloadDataSnapshot(prefix);
  } catch (err) {
    console.error('Snapshot download failed:', err);
    showToast('Could not download your data copy. Continuing.', 'error');
    return null;
  }
}


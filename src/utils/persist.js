// Small JSON persistence helpers on top of localStorage. Used for the few values
// that live outside the data store (local accounts, folder-sync handles, cached
// session state).
export async function storageGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    console.error('Storage get error:', e);
    return null;
  }
}

// Request persistent storage from browser (prevents iOS/Safari from auto-clearing storage)
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

export async function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error:', e);
  }
}

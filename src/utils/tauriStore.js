// Utility file for Tauri Store / LocalStorage persistence fallback
export async function storageGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    console.error('Tauri Store get error:', e);
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
    console.error('Tauri Store set error:', e);
  }
}

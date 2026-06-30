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

export async function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Tauri Store set error:', e);
  }
}

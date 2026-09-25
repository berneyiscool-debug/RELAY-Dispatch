// Deputy's long-term memory about the user. Local-only: a small per-device
// factsheet that never leaves the device.

const LOCAL_KEY = 'deputyUserMemory';

/** Load memory from this device. Async so existing callers can keep awaiting. */
export const loadUserMemory = async () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/** Synchronous local read — used by prompt builders that can't await (local storage only). */
export const loadUserMemorySync = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/** Save memory to this device. Async so existing callers can keep awaiting. */
export const saveUserMemory = async (mem) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(mem));
  } catch (e) {
    // Storage unavailable or full - memory simply will not persist.
  }
};

/** Clear memory if inactive >7 days */
export const clearStaleMemory = (mem) => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  if (mem.lastUpdated && Date.now() - mem.lastUpdated > SEVEN_DAYS_MS) {
    return {};
  }
  return mem;
};

/** Categorize raw factsheet text into structured nodes */
export const getStructuredMemory = (factsheetText = '') => {
  const lines = (factsheetText || '').split('\n').map(l => l.replace(/^[\s\-*]+/, '').trim()).filter(Boolean);
  const categories = {
    preferences: [],
    dispatchRules: [],
    clientNotes: [],
    frequentTechs: [],
    general: []
  };

  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (lower.includes('prefer') || lower.includes('like') || lower.includes('always')) {
      categories.preferences.push(line);
    } else if (lower.includes('assign') || lower.includes('schedule') || lower.includes('rule') || lower.includes('tech')) {
      categories.dispatchRules.push(line);
    } else if (lower.includes('cust') || lower.includes('client') || lower.includes('account')) {
      categories.clientNotes.push(line);
    } else {
      categories.general.push(line);
    }
  });

  return categories;
};


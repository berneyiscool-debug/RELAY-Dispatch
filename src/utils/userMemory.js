// Simple client‑side memory store with optional cloud fallback using Microsoft Graph Copilot memory API

function getCurrentUserId() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return currentUser ? currentUser.id : null;
  } catch (e) {
    return null;
  }
}

function getAuthToken() {
  return null;
}

const LOCAL_KEY = 'deputyUserMemory';

/** Load memory: try cloud via Graph API, fall back to localStorage */
export const loadUserMemory = async () => {
  const userId = getCurrentUserId?.();
  const token = getAuthToken?.();
  if (userId && token) {
    try {
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/users/${userId}/enhancedPersonalizationSetting`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.ok) {
        const { value } = await resp.json();
        return JSON.parse(value || '{}');
      }
    } catch (e) {
      // ignore and fallback
    }
  }
  // Local fallback
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/** Save memory: try cloud, fall back to localStorage */
export const saveUserMemory = async (mem) => {
  const userId = getCurrentUserId?.();
  const token = getAuthToken?.();
  const json = JSON.stringify(mem);
  if (userId && token) {
    try {
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/users/${userId}/enhancedPersonalizationSetting`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: json }),
        }
      );
      if (resp.ok) return;
    } catch (e) {
      // ignore and fallback
    }
  }
  // Local fallback
  localStorage.setItem(LOCAL_KEY, json);
};

/** Clear memory if inactive >7 days */
export const clearStaleMemory = (mem) => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  if (mem.lastUpdated && Date.now() - mem.lastUpdated > SEVEN_DAYS_MS) {
    return {};
  }
  return mem;
};

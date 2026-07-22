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


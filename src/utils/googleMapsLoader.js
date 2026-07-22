// ============================================
// RELAY — GOOGLE MAPS SDK LOADER (shared)
// ============================================
// Single place that bootstraps the Google Maps JS SDK using the official inline
// loader (the only reliable way to get google.maps.importLibrary). Shared by the
// Places autocomplete and the dashboard map so the SDK loads at most once.
//
// Uses the BROWSER key (VITE_GOOGLE_MAPS_BROWSER_KEY) — public/bundled by design,
// must be restricted to Places + Maps JS in Google Cloud.

import { store } from '../data/store.js';

export const ENV_GOOGLE_MAPS_BROWSER_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY
    : undefined;

export function getEffectiveGoogleMapsKey() {
  const settings = store.getSettings() || {};
  const mapsConfig = settings.maps || {};
  if (mapsConfig.apiKey && mapsConfig.apiKey.trim() !== '') {
    return mapsConfig.apiKey.trim();
  }
  
  // If no user-provided key, use our bundled key ONLY if they are a cloud user.
  // Local trial/offline users (acct_...) must Bring Your Own Key.
  const isCloudUser = !!(store.companyId && !store.companyId.startsWith('acct_'));
  
  if (isCloudUser) {
    return ENV_GOOGLE_MAPS_BROWSER_KEY;
  }
  return undefined;
}

let loadPromise = null;

export function loadGoogleMapsSdk() {
  if (loadPromise) return loadPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.importLibrary) {
    loadPromise = Promise.resolve(window.google);
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    const activeKey = getEffectiveGoogleMapsKey();
    if (!activeKey) return reject(new Error('Google Maps API key not configured. Cloud users get this automatically, local users must set it in Settings.'));
    try {
      ((g) => {
        let h, a, k, p = 'The Google Maps JavaScript API', c = 'google', l = 'importLibrary',
          q = '__ib__', m = document, b = window;
        b = b[c] || (b[c] = {});
        const d = b.maps || (b.maps = {}), r = new Set(), e = new URLSearchParams(),
          u = () => h || (h = new Promise(async (f, n) => {
            a = m.createElement('script');
            e.set('libraries', [...r] + '');
            for (k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
            e.set('callback', c + '.maps.' + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => (h = n(Error(p + ' could not load.')));
            a.nonce = m.querySelector('script[nonce]')?.nonce || '';
            m.head.append(a);
          }));
        d[l] ? console.warn(p + ' only loads once. Ignoring:', g) : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
      })({ key: activeKey, v: 'weekly' });

      if (window.google?.maps?.importLibrary) resolve(window.google);
      else reject(new Error('Google Maps bootstrap failed to initialise'));
    } catch (err) {
      loadPromise = null;
      reject(err);
    }
  });
  return loadPromise;
}

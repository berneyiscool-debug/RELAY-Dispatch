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
  // A key saved by an older build still wins, so existing installs keep working.
  if (mapsConfig.apiKey && mapsConfig.apiKey.trim() !== '') {
    return mapsConfig.apiKey.trim();
  }

  // Otherwise fall back to the bundled/self-hosted browser key. It is public by
  // design and must be restricted to Places + Maps JS in Google Cloud, so it is
  // safe to hand to every account type — offline and self-hosted builds set it
  // with VITE_GOOGLE_MAPS_BROWSER_KEY.
  return ENV_GOOGLE_MAPS_BROWSER_KEY;
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
    if (!activeKey) return reject(new Error('Google Maps is not configured for this build. Set VITE_GOOGLE_MAPS_BROWSER_KEY at build time to enable maps.'));
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

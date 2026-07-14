// ============================================
// RELAY — GOOGLE PLACES AUTOCOMPLETE (cloud-only)
// ============================================
// Adds address autocomplete to an existing app text input using the Places
// Data API (AutocompleteSuggestion) — NOT the prebuilt web component — so the
// app keeps its own styled <input> and we render a dropdown that matches the
// app's design tokens. On selection it fills the input and seeds the geocode
// cache with the returned coordinates, so the store's geo hooks persist `geo`
// for free (no separate Geocoding call). Session tokens make autocomplete
// billed per-session rather than per-keystroke.
//
// Uses the BROWSER key (VITE_GOOGLE_MAPS_BROWSER_KEY), which is public/bundled
// by design and must be restricted to Places + Maps JS in Google Cloud.

import { setCachedGeo } from './geocode.js';

const BROWSER_KEY = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY
  : undefined;

let loadPromise = null;

function loadMapsSdk() {
  if (loadPromise) return loadPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.importLibrary) {
    loadPromise = Promise.resolve(window.google);
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    if (!BROWSER_KEY) return reject(new Error('VITE_GOOGLE_MAPS_BROWSER_KEY not set'));
    try {
      // Official Google Maps inline bootstrap loader — this is what defines
      // google.maps.importLibrary (a plain <script> tag does not). Libraries
      // are fetched on demand by the first importLibrary() call.
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
      })({ key: BROWSER_KEY, v: 'weekly' });

      if (window.google?.maps?.importLibrary) resolve(window.google);
      else reject(new Error('Google Maps bootstrap failed to initialise'));
    } catch (err) {
      loadPromise = null;
      reject(err);
    }
  });
  return loadPromise;
}

/**
 * Attach address autocomplete to an existing app input. Renders an app-styled
 * suggestions dropdown; picking one fills the input, seeds the geo cache and
 * calls `onSelect`. No-ops (leaving the plain input untouched) when disabled or
 * unconfigured, so local/offline users and misconfig degrade to a normal field.
 *
 * @param {HTMLInputElement} targetInput
 * @param {{ enabled?: boolean, onSelect?: (r: {address: string, geo: object|null}) => void }} [opts]
 */
export async function attachAddressAutocomplete(targetInput, opts = {}) {
  const { enabled = true, onSelect } = opts;
  if (!enabled || !BROWSER_KEY || !targetInput) return;
  if (targetInput.dataset.pacMounted === '1') return;
  targetInput.dataset.pacMounted = '1';

  let AutocompleteSuggestion, AutocompleteSessionToken;
  try {
    await loadMapsSdk();
    ({ AutocompleteSuggestion, AutocompleteSessionToken } = await window.google.maps.importLibrary('places'));
    if (!AutocompleteSuggestion) throw new Error('Places Data API unavailable on this key');
  } catch (err) {
    targetInput.dataset.pacMounted = '';
    console.warn('Address autocomplete unavailable:', err?.message || err);
    return;
  }

  // Wrap the input so the dropdown can be positioned relative to it.
  const wrap = document.createElement('div');
  wrap.style.position = 'relative';
  targetInput.parentElement.insertBefore(wrap, targetInput);
  wrap.appendChild(targetInput);

  const menu = document.createElement('div');
  Object.assign(menu.style, {
    position: 'absolute', top: 'calc(100% + 2px)', left: '0',
    // At least as wide as the field, but never narrower than a full street
    // address needs — so suggestions read on one consistent line.
    width: 'max(100%, 460px)', zIndex: '9999',
    background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #ddd)',
    borderRadius: 'var(--border-radius-md, 6px)', boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,.15))',
    maxHeight: '320px', overflowY: 'auto', display: 'none', padding: '4px',
  });
  wrap.appendChild(menu);

  let sessionToken = new AutocompleteSessionToken();
  let suggestions = [];
  let activeIdx = -1;
  let debounceTimer = null;
  let suppress = false; // guards against our own value-set re-triggering a fetch

  const hideMenu = () => { menu.style.display = 'none'; menu.innerHTML = ''; suggestions = []; activeIdx = -1; };

  const paintActive = () => {
    [...menu.children].forEach((el, i) => {
      el.style.background = i === activeIdx ? 'var(--bg-color, #f2f2f2)' : 'transparent';
    });
  };

  const renderMenu = () => {
    if (!suggestions.length) return hideMenu();
    menu.innerHTML = '';
    suggestions.forEach((s, i) => {
      const item = document.createElement('div');
      item.textContent = s.placePrediction.text?.text || '';
      Object.assign(item.style, {
        boxSizing: 'border-box', padding: '11px 14px', cursor: 'pointer', fontSize: '13px',
        lineHeight: '1.35', borderRadius: '4px', color: 'var(--text-primary, #222)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      });
      item.addEventListener('mouseenter', () => { activeIdx = i; paintActive(); });
      item.addEventListener('mousedown', (e) => { e.preventDefault(); choose(i); });
      menu.appendChild(item);
    });
    paintActive();
    menu.style.display = 'block';
  };

  async function choose(i) {
    const s = suggestions[i];
    if (!s) return;
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ['formattedAddress', 'location', 'id'] });
      const address = place.formattedAddress || s.placePrediction.text?.text || '';
      const geo = place.location ? {
        lat: place.location.lat(), lng: place.location.lng(),
        formattedAddress: address, placeId: place.id || null,
      } : null;
      suppress = true;
      targetInput.value = address;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      suppress = false;
      if (geo) setCachedGeo(address, geo);
      if (onSelect) onSelect({ address, geo });
    } catch (err) {
      console.warn('Places selection failed:', err?.message || err);
    } finally {
      hideMenu();
      sessionToken = new AutocompleteSessionToken(); // fresh session per pick
    }
  }

  async function fetchSuggestions(input) {
    try {
      const { suggestions: res } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input, includedRegionCodes: ['au'], sessionToken,
      });
      suggestions = (res || []).filter((s) => s.placePrediction);
      activeIdx = -1;
      renderMenu();
    } catch (err) {
      console.warn('Places suggest failed:', err?.message || err);
      hideMenu();
    }
  }

  targetInput.setAttribute('autocomplete', 'off');
  targetInput.addEventListener('input', () => {
    if (suppress) return;
    const val = targetInput.value.trim();
    clearTimeout(debounceTimer);
    if (val.length < 3) return hideMenu();
    debounceTimer = setTimeout(() => fetchSuggestions(val), 250);
  });
  targetInput.addEventListener('keydown', (e) => {
    if (menu.style.display === 'none' || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, suggestions.length - 1); paintActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); paintActive(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); choose(activeIdx); }
    else if (e.key === 'Escape') { hideMenu(); }
  });
  targetInput.addEventListener('blur', () => setTimeout(hideMenu, 150));
}

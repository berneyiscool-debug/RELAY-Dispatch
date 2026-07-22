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
import { loadGoogleMapsSdk, getEffectiveGoogleMapsKey } from './googleMapsLoader.js';

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
  const activeKey = getEffectiveGoogleMapsKey();
  if (!enabled || !activeKey || !targetInput) return;
  if (targetInput.dataset.pacMounted === '1') return;
  targetInput.dataset.pacMounted = '1';

  let AutocompleteSuggestion, AutocompleteSessionToken;
  try {
    await loadGoogleMapsSdk();
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

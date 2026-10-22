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
  if (!enabled || !targetInput) return;
  if (!activeKey) {
    console.warn('RELAY: address autocomplete skipped — no Google Maps key configured (set VITE_GOOGLE_MAPS_BROWSER_KEY at build time).');
    return;
  }
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

  // The suggestions list is drawn on <body>, fixed under the field, and only
  // exists while it is showing. Drawn inside the field's own container it was
  // clipped by any scrolling parent — a modal body, a drawer, a table cell — which
  // is exactly where the quick-create forms put address fields.
  const MENU_MAX_HEIGHT = 320;
  let menu = null;

  const placeMenu = () => {
    if (!menu) return;
    if (!targetInput.isConnected) return hideMenu();
    const rect = targetInput.getBoundingClientRect();
    const gutter = 8;
    // At least as wide as the field, and wide enough for a full street address
    // to read on one line, but never wider than the window.
    const width = Math.min(Math.max(rect.width, 460), window.innerWidth - gutter * 2);
    const left = Math.min(Math.max(gutter, rect.left), window.innerWidth - width - gutter);
    const below = window.innerHeight - rect.bottom - gutter;
    const height = Math.min(menu.scrollHeight, MENU_MAX_HEIGHT);
    const top = below < height && rect.top > below ? rect.top - height - 2 : rect.bottom + 2;
    Object.assign(menu.style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
  };

  const ensureMenu = () => {
    if (menu) return menu;
    menu = document.createElement('div');
    menu.className = 'places-suggestions';
    menu.setAttribute('role', 'listbox');
    Object.assign(menu.style, {
      position: 'fixed', boxSizing: 'border-box',
      // Above modals (--z-modal: 2000) so a field inside one shows its suggestions.
      zIndex: '2100',
      background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #ddd)',
      borderRadius: 'var(--border-radius-md, 6px)', boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,.15))',
      maxHeight: `${MENU_MAX_HEIGHT}px`, overflowY: 'auto', padding: '4px',
    });
    document.body.appendChild(menu);
    window.addEventListener('scroll', placeMenu, true);
    window.addEventListener('resize', placeMenu);
    return menu;
  };

  let sessionToken = new AutocompleteSessionToken();
  let suggestions = [];
  let activeIdx = -1;
  let debounceTimer = null;
  let suppress = false; // guards against our own value-set re-triggering a fetch

  const hideMenu = () => {
    suggestions = [];
    activeIdx = -1;
    if (!menu) return;
    menu.remove();
    menu = null;
    window.removeEventListener('scroll', placeMenu, true);
    window.removeEventListener('resize', placeMenu);
  };

  const paintActive = () => {
    if (!menu) return;
    [...menu.children].forEach((el, i) => {
      el.style.background = i === activeIdx ? 'var(--bg-color, #f2f2f2)' : 'transparent';
    });
  };

  const renderMenu = () => {
    if (!suggestions.length || !targetInput.isConnected) return hideMenu();
    ensureMenu();
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
    placeMenu();
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
    if (!menu || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, suggestions.length - 1); paintActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); paintActive(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); choose(activeIdx); }
    // Escape closes the suggestions only — not a modal the field sits in.
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hideMenu(); }
  });
  targetInput.addEventListener('blur', () => setTimeout(hideMenu, 150));
}

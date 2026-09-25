// ============================================
// RELAY -- THEME MANAGEMENT
// ============================================
// LAUNCH: the app is light only. Dark mode is unfinished, so nothing follows the
// OS scheme yet — set LIGHT_ONLY to false to bring the OS-driven behaviour back
// (the dark palettes are still in components.css under [data-theme-mode="dark"]).
// Both attributes are always kept in sync:
//   data-theme       -- used by the light/dark palettes and by the portals
//   data-theme-mode  -- used by the component-level dark overrides

const LIGHT_ONLY = true;

const DARK_QUERY = '(prefers-color-scheme: dark)';

function darkQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(DARK_QUERY);
}

/** The theme matching the current OS colour scheme (always light while LIGHT_ONLY). */
export function systemTheme() {
  if (LIGHT_ONLY) return 'light';
  const query = darkQuery();
  return query && query.matches ? 'dark' : 'light';
}

/**
 * Resolves a requested theme name to a supported one. 'light'/'dark' pass
 * through, anything else (for example a decorative theme name saved by an older
 * build) falls back to the OS scheme rather than leaving the app unstyled, and
 * a null/empty request clears the attributes for the auth screens.
 */
export function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return LIGHT_ONLY ? 'light' : theme;
  if (theme) return systemTheme();
  return null;
}

/**
 * Applies the OS theme, or an explicit one. Call with no argument to follow the
 * OS. Returns the applied theme, or null when the attributes were cleared.
 */
export function applyTheme(theme = systemTheme()) {
  if (typeof document === 'undefined') return null;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  if (!resolved) {
    root.removeAttribute('data-theme');
    root.removeAttribute('data-theme-mode');
    return null;
  }
  root.setAttribute('data-theme', resolved);
  root.setAttribute('data-theme-mode', resolved);
  return resolved;
}

// Re-applies the theme when the user changes their OS colour scheme. The auth
// screens clear the attributes on purpose (applyTheme(null)), so those are left
// alone rather than being forced back into the app shell's theme.
let watchingSystem = false;
export function watchSystemTheme() {
  if (LIGHT_ONLY) return; // light only: an OS scheme change cannot affect the app
  const query = darkQuery();
  if (!query || watchingSystem) return;
  watchingSystem = true;
  const onChange = () => {
    if (document.documentElement.getAttribute('data-theme')) applyTheme();
  };
  if (typeof query.addEventListener === 'function') query.addEventListener('change', onChange);
  else if (typeof query.addListener === 'function') query.addListener(onChange);
}
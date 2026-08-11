// ============================================
// RELAY — CONTEXT-AWARE LIST SEARCH
// ============================================
// The top bar's ⌘K search is a global "jump to a record" everywhere EXCEPT on a
// list page, where it should filter the current table in place. A list page
// registers its filter callback here on render; the top bar calls it while one
// is registered (and reverts to the global jump otherwise). main.js clears the
// registration on every navigation so it never leaks across pages.

let handler = null;
let label = '';

export function setListSearch(fn, listLabel = '') {
  handler = typeof fn === 'function' ? fn : null;
  label = listLabel || '';
  window.dispatchEvent(new CustomEvent('relay-list-search-changed'));
}

export function clearListSearch() {
  if (!handler && !label) return;
  handler = null;
  label = '';
  window.dispatchEvent(new CustomEvent('relay-list-search-changed'));
}

export function getListSearch() {
  return handler;
}

export function getListSearchLabel() {
  return label;
}

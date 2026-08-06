// ============================================
// RELAY — MAP DEEP LINKS (zero API cost)
// ============================================
// Builds Google Maps URLs that open the viewer's browser/maps app to a
// destination. No Google API is called — it's just a URL — so this is FREE and
// available to ALL users (not gated to cloud). Prefers stored coordinates for
// precision, falling back to the free-text address.

export function navigationUrl(address, geo) {
  const dest = (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number')
    ? `${geo.lat},${geo.lng}`
    : (address || '').trim();
  if (!dest) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

// Inline "Navigate" link markup (empty string when there's no destination).
// Opens in a new tab / the device's maps app; rel=noopener for safety.
export function navigateLinkHTML(address, geo, label = 'Navigate') {
  const url = navigationUrl(address, geo);
  if (!url) return '';
  return ` <a href="${url}" target="_blank" rel="noopener noreferrer" title="Open in Google Maps"`
    + ` style="display:inline-flex;align-items:center;gap:3px;color:var(--color-primary);`
    + `font-size:12px;font-weight:600;text-decoration:none;vertical-align:middle;white-space:nowrap;">`
    + `<span class="material-icons-outlined" style="font-size:15px;">directions</span>${label}</a>`;
}

/**
 * Escapes special characters for HTML to prevent XSS.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const string = String(str);
  return string.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

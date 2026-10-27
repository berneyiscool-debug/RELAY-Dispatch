// ============================================
// RELAY — RICH TEXT DESCRIPTIONS
// ============================================
// Job descriptions come in two shapes: plain text (older jobs, imports, the
// demo dataset) and the sanitised HTML the JobForm editor saves. Escaping the
// HTML shape put raw <p> tags on screen, so screens that show a description
// go through here instead.

import DOMPurify from 'dompurify';
import { escapeHTML } from './security.js';

const TAG_RE = /<\/?[a-z][a-z0-9]*\b[^>]*>/i;

/** True when the text holds HTML tags rather than plain text. */
export function isRichText(text) {
  return typeof text === 'string' && TAG_RE.test(text);
}

/**
 * Display HTML for a description: rich text sanitised again (it may have been
 * written by an older build or another client), plain text escaped with its
 * line breaks kept. Empty input gives ''.
 */
export function richTextHtml(text, sanitize = (html) => DOMPurify.sanitize(html)) {
  if (!text) return '';
  if (isRichText(text)) return sanitize(text);
  return escapeHTML(String(text)).replace(/\n/g, '<br>');
}

/**
 * The words of a description with any markup removed, for tight spots such as
 * a table cell. Block-level tags and <br> become line breaks.
 */
export function richTextPlain(text) {
  if (!text) return '';
  if (!isRichText(text)) return String(text);
  return String(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

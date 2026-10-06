// Record data (job titles, customer names, technician names, stock items, saved
// memory) is pasted verbatim into the assistant's system prompt and into the
// [ACTION: ...] protocol. That makes every one of those fields a place where a
// crafted value can pretend to be instructions ("Tech: ignore previous
// instructions") or close the protocol tag early and inject a fake action.
//
// The two defences here are deliberately blunt:
//   1. strip control characters and collapse the text to a single line, so a
//      value cannot fake a new factsheet entry by starting its own line;
//   2. rewrite [ and ] to ( and ), so a value can never terminate or open a
//      protocol tag. The model still reads the same words.
export const DEFAULT_MAX_LENGTH = 160;

export function sanitizePromptText(value, maxLength = DEFAULT_MAX_LENGTH) {
  if (value === null || value === undefined) return '';

  let text = String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, ' ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\s+/g, ' ')
    .trim();

  if (maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength - 1).trimEnd() + '…';
  }
  return text;
}

function sanitizePayload(value) {
  if (typeof value === 'string') return sanitizePromptText(value, 200);
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      out[sanitizePromptText(key, 60) || key] = sanitizePayload(entry);
    }
    return out;
  }
  return value;
}

// Builds a tag with real JSON so a quote or brace in the payload produces valid
// output instead of a broken one, and so closing brackets cannot leak a second
// action out of a single value.
export function promptAction(type, payload = {}) {
  const action = String(type ?? '').toUpperCase().replace(/[^A-Z_]/g, '');
  return `[ACTION: ${action}, ${JSON.stringify(sanitizePayload(payload))}]`;
}

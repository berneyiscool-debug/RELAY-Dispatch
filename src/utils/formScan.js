// ============================================
// RELAY — Scan to form
// ============================================
// A tech prints a blank compliance form, fills it in by hand on site, and
// uploads a photo or PDF scan to the job. brny reads the scan and this module
// turns what it read into `formInstance.responses`.
//
// Everything here is pure (no DOM, no network) so the mapping rules can be
// tested on their own: ticked boxes become true/false, chosen options become
// the template's exact option text, dates become ISO, handwriting stays text.
// Anything brny was unsure of is flagged for review rather than guessed - a
// misread JSA is worse than a blank one.
// ============================================

// Field types that hold an answer. `info`, `spacer` and `blank` are layout only.
const ANSWER_TYPES = new Set(['text', 'textarea', 'checkbox', 'select', 'date', 'signature']);

// Printed at the foot of a blank sheet so the scan can be matched to its
// template without relying on the title (which a company may have renamed).
export const SHEET_CODE_PREFIX = 'RELAY-FORM';

/** The code printed on a blank sheet for this template, e.g. `RELAY-FORM:demo_ft_jsa_swms`. */
export function sheetCode(template) {
  return template && template.id ? `${SHEET_CODE_PREFIX}:${template.id}` : '';
}

/** Every field on the template that takes an answer, flattened in sheet order. */
export function fillableFields(template) {
  const out = [];
  for (const section of (template && template.sections) || []) {
    if (!section || section.isSpacer) continue;
    for (const field of section.fields || []) {
      if (!field || !field.id || !ANSWER_TYPES.has(field.type)) continue;
      out.push({
        id: field.id,
        label: field.label || field.id,
        type: field.type,
        options: field.type === 'select' ? [...(field.options || [])] : undefined,
        required: !!field.required,
        section: section.title || '',
      });
    }
  }
  return out;
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function compact(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── Template detection ───────────────────────────────────────────────────────

/** Pull a template id out of whatever brny read off the sheet's footer. */
export function parseSheetCode(text) {
  const match = String(text ?? '').match(/RELAY[\s-]*FORM\s*[:#]?\s*([A-Za-z0-9_-]+)/i);
  return match ? match[1] : String(text ?? '').trim();
}

/**
 * Which template a scanned sheet is, from the code printed on it or its title.
 *
 * A code matches exactly, or by its prebuilt suffix (a sheet printed from the
 * demo workspace says `demo_ft_jsa_swms`; the company's copy is
 * `<company>_ft_jsa_swms`). Only a single confident title match is accepted.
 *
 * @returns {{ template: object|null, by: 'code'|'title'|null, candidates: object[] }}
 */
export function detectTemplate(templates, { code, title } = {}) {
  const list = (templates || []).filter(Boolean);
  const wanted = compact(parseSheetCode(code));
  if (wanted) {
    const exact = list.find((t) => compact(t.id) === wanted);
    if (exact) return { template: exact, by: 'code', candidates: [exact] };
    const suffix = list.filter((t) => {
      const id = compact(t.id);
      return id.length >= 6 && wanted.length >= 6 && (id.endsWith(wanted) || wanted.endsWith(id) || baseId(t.id) === baseId(code));
    });
    if (suffix.length === 1) return { template: suffix[0], by: 'code', candidates: suffix };
  }

  const name = normalize(title);
  if (name) {
    const exact = list.filter((t) => normalize(t.name) === name);
    if (exact.length === 1) return { template: exact[0], by: 'title', candidates: exact };
    const partial = list.filter((t) => {
      const n = normalize(t.name);
      return n && (n.includes(name) || name.includes(n));
    });
    if (partial.length === 1) return { template: partial[0], by: 'title', candidates: partial };
    if (partial.length > 1) return { template: null, by: null, candidates: partial };
  }
  return { template: null, by: null, candidates: [] };
}

// `demo_ft_jsa_swms` and `acct_123_ft_jsa_swms` share the prebuilt `ft_...` tail.
function baseId(id) {
  const raw = parseSheetCode(id).toLowerCase();
  const at = raw.indexOf('ft_');
  return at >= 0 ? raw.slice(at) : '';
}

// ── Value mapping ────────────────────────────────────────────────────────────

const TICKED = new Set(['true', 'yes', 'y', 'ticked', 'checked', 'tick', 'x', '✓', '✔', '☑', '☒', '1', 'on', 'marked', 'crossed']);
const UNTICKED = new Set(['false', 'no', 'n', 'unticked', 'unchecked', 'blank', 'empty', '', '0', 'off', 'none', '☐']);

/** A checkbox reading → true / false, or null when it can't be told. */
export function toCheckbox(value) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  const v = String(value).trim().toLowerCase();
  if (TICKED.has(v)) return true;
  if (UNTICKED.has(v)) return false;
  return null;
}

/**
 * The option the tech chose, as the template spells it, or null.
 * Exact (case-insensitive) wins, then punctuation-insensitive, then a single
 * option that the reading starts or is contained in.
 */
export function toSelectOption(value, options) {
  const opts = (options || []).filter((o) => o !== null && o !== undefined && String(o) !== '');
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const exact = opts.find((o) => String(o).toLowerCase() === lower);
  if (exact !== undefined) return exact;
  const n = normalize(raw);
  const loose = opts.find((o) => normalize(o) === n);
  if (loose !== undefined) return loose;
  const contains = opts.filter((o) => {
    const on = normalize(o);
    return on && n && (on.includes(n) || n.includes(on) || on.split(' ').some((part) => part.length > 2 && part === n));
  });
  return contains.length === 1 ? contains[0] : null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function iso(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 100) y += 2000;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function monthIndex(word) {
  const i = MONTHS.indexOf(String(word).slice(0, 3).toLowerCase());
  return i >= 0 ? i + 1 : null;
}

/**
 * A handwritten date → `YYYY-MM-DD`, or null.
 *
 * Numeric dates are read day-first (RELAY's home market writes 03/04 for the
 * 3rd of April); a reading that only makes sense month-first, like 04/13, is
 * accepted that way. Two-digit years are 20xx.
 */
export function toIsoDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  let m = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = raw.match(/^(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{2}|\d{4})$/);
  if (m) {
    const a = +m[1], b = +m[2], y = +m[3];
    return iso(y, b, a) || iso(y, a, b);
  }
  m = raw.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,})\.?,?[\s-]+(\d{2}|\d{4})$/);
  if (m && monthIndex(m[2])) return iso(+m[3], monthIndex(m[2]), +m[1]);
  m = raw.match(/^([A-Za-z]{3,})\.?[\s-]+(\d{1,2})(?:st|nd|rd|th)?,?[\s-]+(\d{2}|\d{4})$/);
  if (m && monthIndex(m[1])) return iso(+m[3], monthIndex(m[1]), +m[2]);
  return null;
}

const CONFIDENCE = new Set(['high', 'medium', 'low']);

/**
 * Turn brny's reading of a sheet into form responses plus review flags.
 *
 * `extracted.fields` is `[{ fieldId, value, confidence, unreadable, note }]`.
 * Rules:
 * - `unreadable`, or low confidence → left empty and flagged (the reading is
 *   offered as a suggestion, never written).
 * - medium confidence → written, and flagged "check".
 * - a value that doesn't fit the field (an option the template lacks, a date
 *   that isn't one, an ambiguous tick) → left empty and flagged.
 * - fields brny didn't mention are left untouched (not flagged unless required).
 * - unknown field ids are ignored and reported.
 *
 * @returns {{ responses: object, flags: object, filled: string[], ignored: string[] }}
 *   `flags` is `{ [fieldId]: { level: 'unreadable'|'uncertain'|'check'|'invalid'|'missing', message, suggestion? } }`.
 */
export function mapScanResponses(template, extracted) {
  const fields = fillableFields(template);
  const byId = new Map(fields.map((f) => [f.id, f]));
  const responses = {};
  const flags = {};
  const filled = [];
  const ignored = [];
  const seen = new Set();

  const flag = (field, level, message, suggestion) => {
    flags[field.id] = { level, message, ...(suggestion !== undefined && suggestion !== '' ? { suggestion: String(suggestion) } : {}) };
  };

  for (const reading of (extracted && extracted.fields) || []) {
    if (!reading || !reading.fieldId) continue;
    const field = byId.get(reading.fieldId);
    if (!field) { ignored.push(String(reading.fieldId)); continue; }
    seen.add(field.id);

    const note = reading.note ? String(reading.note).trim() : '';
    const confidence = CONFIDENCE.has(reading.confidence) ? reading.confidence : 'medium';
    const value = reading.value;

    if (reading.unreadable) {
      flag(field, 'unreadable', note || `Couldn't read "${field.label}" on the scan.`, value);
      continue;
    }
    if (confidence === 'low') {
      flag(field, 'uncertain', note || `Not sure about "${field.label}" — please check the sheet.`, value);
      continue;
    }

    let mapped;
    if (field.type === 'checkbox') {
      mapped = toCheckbox(value);
      if (mapped === null) { flag(field, 'invalid', note || `Couldn't tell whether "${field.label}" is ticked.`, value); continue; }
    } else if (field.type === 'select') {
      if (value === null || value === undefined || String(value).trim() === '') continue;
      mapped = toSelectOption(value, field.options);
      if (mapped === null) { flag(field, 'invalid', `"${value}" isn't one of the options for "${field.label}".`, value); continue; }
    } else if (field.type === 'date') {
      if (value === null || value === undefined || String(value).trim() === '') continue;
      mapped = toIsoDate(value);
      if (!mapped) { flag(field, 'invalid', `"${value}" doesn't read as a date.`, value); continue; }
    } else {
      mapped = value === null || value === undefined ? '' : String(value).trim();
      if (!mapped) continue;
    }

    responses[field.id] = mapped;
    filled.push(field.id);
    if (confidence === 'medium') flag(field, 'check', note || `Check "${field.label}" against the sheet.`);
  }

  for (const field of fields) {
    if (field.required && !seen.has(field.id) && !flags[field.id] && field.type !== 'signature') {
      flag(field, 'missing', `"${field.label}" is required but wasn't found on the scan.`);
    }
  }

  return { responses, flags, filled, ignored };
}

/**
 * Responses for the draft: scanned values over what was already there, but a
 * blank or flagged reading never wipes something a person typed in.
 */
export function mergeResponses(existing, scanned) {
  return { ...(existing || {}), ...(scanned || {}) };
}

// ── Prompting ────────────────────────────────────────────────────────────────

export const IDENTIFY_TOOL = {
  name: 'identify_form',
  description: 'Report which printed form this is.',
  input_schema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: `The code printed on the sheet (starts with "${SHEET_CODE_PREFIX}"), exactly as printed. Empty if there is none.` },
      title: { type: 'string', description: 'The form title printed at the top of the sheet.' },
      isForm: { type: 'boolean', description: 'False if the image is not a filled-in form at all.' },
    },
    required: ['title', 'isForm'],
    additionalProperties: false,
  },
};

export const RECORD_TOOL = {
  name: 'record_form_responses',
  description: 'Record what was written on each field of the hand-filled form.',
  input_schema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'The form code printed on the sheet, if any.' },
      title: { type: 'string', description: 'The form title printed on the sheet.' },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            fieldId: { type: 'string', description: 'The id of the field from the list you were given.' },
            value: { type: 'string', description: 'What is written. Checkbox: "ticked" or "blank". Select: the option text that was chosen. Date: YYYY-MM-DD if you can tell, otherwise as written. Text: the handwriting transcribed as written.' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'How sure you are of this reading.' },
            unreadable: { type: 'boolean', description: 'True if something is written but you cannot read it.' },
            note: { type: 'string', description: 'Optional: why you are unsure, e.g. "two boxes ticked" or "smudged".' },
          },
          required: ['fieldId', 'value', 'confidence'],
          additionalProperties: false,
        },
      },
    },
    required: ['fields'],
    additionalProperties: false,
  },
};

/** The field list the model reads the sheet against. */
export function describeFields(template) {
  return fillableFields(template).map((f) => {
    const opts = f.type === 'select' && f.options.length ? ` options: ${f.options.map((o) => JSON.stringify(o)).join(', ')}` : '';
    return `- ${f.id} | ${f.type} | ${f.section ? `${f.section} › ` : ''}${f.label}${f.required ? ' (required)' : ''}${opts}`;
  }).join('\n');
}

export function buildReadPrompt(template) {
  return `This is a photo or scan of a printed "${template.name}" form that a field technician filled in by hand.

Read every field below off the sheet and call record_form_responses once.

Fields (id | type | label):
${describeFields(template)}

Rules:
- Only report what is actually on the sheet. Never invent or infer an answer from the job.
- Checkbox: "ticked" if it has a tick, cross or fill; "blank" if it is empty. If you can't tell, confidence "low".
- Select: give the option text that was circled, ticked or written. If it matches none of the options, give what was written.
- Date: YYYY-MM-DD. The sheet's dates are written day first (DD/MM/YYYY). If unsure of day vs month, confidence "low".
- Text: transcribe the handwriting exactly. Do not tidy or summarise.
- Signature: the printed or signed name if legible, otherwise "signed" with confidence "low"; "" if unsigned.
- Leave out a field only if it is blank on the sheet. If something is written but illegible, set unreadable true.
- Use confidence "low" whenever you would be guessing. A person reviews every flagged field.`;
}

export function buildIdentifyPrompt(templates) {
  const names = (templates || []).map((t) => `- ${t.name}`).join('\n');
  return `This is a photo or scan of a printed form a technician filled in by hand. Read the form code printed near the foot of the page (it starts with "${SHEET_CODE_PREFIX}") and the form title, then call identify_form.

Forms this company uses:
${names || '- (none)'}`;
}

/** `{ mediaType, base64 }` from a base64 `data:` URL. */
export function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) throw new Error('The scan is not a readable image.');
  return { mediaType: match[1], base64: match[2] };
}

/** Anthropic image block from a `data:` URL. */
export function imageBlock(dataUrl) {
  const { mediaType, base64 } = parseDataUrl(dataUrl);
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };
}

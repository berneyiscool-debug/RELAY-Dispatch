/**
 * Date and time helpers for actions.
 *
 * Users speak in relative time ("tomorrow", "next Tuesday", "in 3 days"), while
 * the store mixes date-only keys (`scheduledDate`, `validUntil`) with ISO
 * timestamps (`issueDate`, `dueDate`). Everything here funnels through
 * `toDateKey` so both forms compare correctly.
 */

import { todayLocalISO, toDateKey } from '../utils/dateUtils.js';
import { invalidInput } from './errors.js';

export { todayLocalISO, toDateKey };

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WORD_OFFSETS = {
  today: 0,
  now: 0,
  tomorrow: 1,
  'tomorrow morning': 1,
  'tomorrow afternoon': 1,
  yesterday: -1,
  'next week': 7,
  'in a week': 7,
  'next month': 30,
  'end of month': null, // handled specially
};

function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Seconds-since-midnight for a stored time, or null. */
export function parseClock(value) {
  const match = String(value ?? '').match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = (match[3] || '').toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes, text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` };
}

/**
 * Resolve a natural-language date to a local `YYYY-MM-DD` key.
 *
 * Understands ISO dates, `d/m/yyyy`, weekday names (meaning the next one, or
 * today when today already is that weekday), `in N days/weeks`, and the words in
 * `WORD_OFFSETS`. Anything else throws `invalid_input` rather than guessing —
 * a wrong date is worse than a question.
 */
export function parseDate(input, { reference = new Date() } = {}) {
  if (input instanceof Date) return todayLocalISO(input);
  const raw = String(input ?? '').trim();
  if (!raw) throw invalidInput('A date is required.');

  const lower = raw.toLowerCase();

  if (lower in WORD_OFFSETS && WORD_OFFSETS[lower] !== null) {
    return todayLocalISO(addDays(reference, WORD_OFFSETS[lower]));
  }
  if (lower === 'end of month' || lower === 'eom') return todayLocalISO(endOfMonth(reference));

  const inDays = lower.match(/^in\s+(\d+)\s*(day|days|week|weeks|month|months)$/);
  if (inDays) {
    const count = Number(inDays[1]);
    const unit = inDays[2];
    const days = unit.startsWith('day') ? count : unit.startsWith('week') ? count * 7 : count * 30;
    return todayLocalISO(addDays(reference, days));
  }

  const nextDay = lower.match(/^(?:next|this|coming)\s+(\w+)$/);
  if (nextDay && nextDay[1] in WEEKDAYS) {
    const target = WEEKDAYS[nextDay[1]];
    const delta = (target - reference.getDay() + 7) % 7 || 7;
    return todayLocalISO(addDays(reference, lower.startsWith('next') ? delta : delta === 7 ? 0 : delta));
  }

  if (lower in WEEKDAYS) {
    const target = WEEKDAYS[lower];
    const delta = (target - reference.getDay() + 7) % 7;
    return todayLocalISO(addDays(reference, delta));
  }

  const key = toDateKey(raw);
  if (key) return key;

  throw invalidInput(`Could not read "${input}" as a date. Try "2026-03-04", "tomorrow" or "next Tuesday".`, { input });
}

/** ISO timestamp for the start of a resolved date, stored in UTC. */
export function startOfDayISO(dateKey) {
  const key = toDateKey(dateKey);
  if (!key) throw invalidInput(`Could not read "${dateKey}" as a date.`);
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

/** ISO timestamp for a resolved date at a given wall-clock time (`HH:MM`, 24h). */
export function atTimeISO(dateKey, clock) {
  const key = toDateKey(dateKey);
  if (!key) throw invalidInput(`Could not read "${dateKey}" as a date.`);
  const parsed = parseClock(clock);
  const [year, month, day] = key.split('-').map(Number);
  const hours = parsed ? parsed.hours : 8;
  const minutes = parsed ? parsed.minutes : 0;
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

/** True when the two dates fall on the same local calendar day. */
export function isSameDay(a, b) {
  const ka = toDateKey(a);
  const kb = toDateKey(b);
  return !!ka && ka === kb;
}

/** Human label such as "Tue 4 Mar", used in action summaries. */
export function dateLabel(value) {
  const key = toDateKey(value);
  if (!key) return '';
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Inclusive range of date keys from `from` to `to`; defaults to a single day. */
export function dateKeysBetween(from, to = from) {
  const startKey = parseDate(from);
  const endKey = parseDate(to);
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const keys = [];
  let guard = 0;
  while (cursor <= end && guard < 400) {
    keys.push(todayLocalISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return keys;
}

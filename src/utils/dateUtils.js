/**
 * Parses preferred time descriptions into hours and minutes.
 * Supports standard formats:
 * - 24-hour: "14:30", "08:00"
 * - 12-hour: "2pm", "2:30 pm", "11am", "12:00 AM"
 * - Text embedded: "a class at 2pm everyday", "Morning (9am)"
 * @param {string} preferredTimeStr 
 * @returns {{hours: number, minutes: number} | null}
 */

/**
 * Today's date as a local YYYY-MM-DD string.
 * `new Date().toISOString().split('T')[0]` yields yesterday for AU users in the
 * morning because toISOString() renders UTC. Use this for all "today" defaults.
 * @param {Date} [d] optional date; defaults to now
 * @returns {string} YYYY-MM-DD in local time
 */
export function todayLocalISO(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Normalises anything date-like to a canonical local "YYYY-MM-DD" key.
 *
 * Recurring occurrences are identified by calendar date, so every producer and
 * consumer of `templateDate` / `scheduledDate` / `skippedDates` has to agree on
 * one format. Without this, a skip stored as "3/10/2026" or an ISO timestamp
 * never compares equal to the "2026-10-03" the engine generates, and the engine
 * treats the occurrence as unfilled and spawns another job on top of it.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string|null} YYYY-MM-DD, or null when the value is not a date
 */
export function toDateKey(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : todayLocalISO(value);
  }

  const str = String(value).trim();
  // Already canonical (also the common case: a date-only column value).
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Australian day-first formats stored by earlier versions of the UI/CSV import.
  const dayFirst = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (dayFirst) {
    const year = dayFirst[3].length === 2 ? `20${dayFirst[3]}` : dayFirst[3];
    return `${year}-${dayFirst[2].padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`;
  }

  // ISO timestamps and anything else Date can parse — read back in local time so
  // a late-evening timestamp does not roll over to the next day.
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return todayLocalISO(parsed);

  const leading = str.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(leading) ? leading : null;
}

/**
 * Safe formatter for date-only strings ("YYYY-MM-DD"). Parsing such strings
 * with new Date() treats them as UTC midnight, which renders one day earlier
 * in negative-offset timezones. This pins them to local midnight first.
 * @param {string} dateStr
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatLocalDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, options);
}

export function parsePreferredTime(preferredTimeStr) {
  if (!preferredTimeStr) return null;
  
  // 1. Try to match standard 24h format HH:MM (e.g. 14:00, 08:30)
  const match24 = preferredTimeStr.match(/^\s*(\d{1,2})[.:](\d{2})\s*$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return { hours: h, minutes: m };
    }
  }
  
  // 2. Try to match 12h format e.g. 2pm, 2:30 pm, 11am, 12:00 AM
  const match12 = preferredTimeStr.match(/^\s*(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)\s*$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] ? parseInt(match12[2], 10) : 0;
    const ampm = match12[3].toLowerCase();
    if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      return { hours: h, minutes: m };
    }
  }
  
  // 3. Try to search for simple number + am/pm anywhere in the string, e.g. "a class at 2pm everyday"
  const matchEmbedded = preferredTimeStr.match(/(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)/i);
  if (matchEmbedded) {
    let h = parseInt(matchEmbedded[1], 10);
    const m = matchEmbedded[2] ? parseInt(matchEmbedded[2], 10) : 0;
    const ampm = matchEmbedded[3].toLowerCase();
    if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      return { hours: h, minutes: m };
    }
  }

  // 4. Try to search for a plain number e.g. "14" or "2"
  const matchPlainNumber = preferredTimeStr.match(/^\s*(\d{1,2})\s*$/);
  if (matchPlainNumber) {
    let h = parseInt(matchPlainNumber[1], 10);
    if (h >= 0 && h < 24) {
      return { hours: h, minutes: 0 };
    }
  }
  
  return null;
}

/**
 * Checks if a given date string falls within a specified range string.
 * @param {string} dateStr ISO date string or YYYY-MM-DD
 * @param {string} range 'all-time', 'today', 'this-week', 'last-week', 'this-month', 'last-month', 'this-year'
 * @returns {boolean}
 */
export function isWithinDateRange(dateStr, range) {
  if (!dateStr || range === 'all-time') return true;
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true; // fallback for invalid dates
  
  const now = new Date();
  
  // Strip times for accurate day-level comparison
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return dDay.getTime() === today.getTime();
      
    case 'this-week': {
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      return dDay >= monday;
    }
      
    case 'last-week': {
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() + diffToMonday);
      
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      
      return dDay >= lastMonday && dDay < thisMonday;
    }
      
    case 'this-month':
      return dDay.getFullYear() === today.getFullYear() && dDay.getMonth() === today.getMonth();
      
    case 'last-month': {
      let lastMonth = today.getMonth() - 1;
      let year = today.getFullYear();
      if (lastMonth < 0) {
        lastMonth = 11;
        year -= 1;
      }
      return dDay.getFullYear() === year && dDay.getMonth() === lastMonth;
    }
      
    case 'this-year':
      return dDay.getFullYear() === today.getFullYear();
      
    default:
      return true;
  }
}

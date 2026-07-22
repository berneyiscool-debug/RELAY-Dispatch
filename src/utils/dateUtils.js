/**
 * Parses preferred time descriptions into hours and minutes.
 * Supports standard formats:
 * - 24-hour: "14:30", "08:00"
 * - 12-hour: "2pm", "2:30 pm", "11am", "12:00 AM"
 * - Text embedded: "a class at 2pm everyday", "Morning (9am)"
 * @param {string} preferredTimeStr 
 * @returns {{hours: number, minutes: number} | null}
 */
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

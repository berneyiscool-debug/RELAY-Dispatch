// src/utils/csvParser.js

/**
 * Simple CSV parser that returns an array of objects using the first line as headers.
 * Handles quoted fields with commas and newlines.
 * This is a lightweight implementation suitable for client‑side imports.
 */
export function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return rows;
  const headerLine = lines[0];
  const headers = splitCSVLine(headerLine);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = splitCSVLine(line);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j] ? headers[j].trim() : `col${j}`;
      obj[key] = cells[j] !== undefined ? cells[j].trim() : '';
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * Split a CSV line into cells respecting quoted values.
 * Supports standard RFC 4180 quoting where double quotes escape a quote.
 */
function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // escaped quote
        cur += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

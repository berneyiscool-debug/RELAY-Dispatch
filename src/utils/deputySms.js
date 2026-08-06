// ============================================
// RELAY — DEPUTY SMS CAPABILITY (v1.3 #6)
// ============================================
// Lets Deputy answer questions grounded in real SMS state: "has this customer
// confirmed tomorrow's job?", "did we text Barry about job 1005?". The LLM
// emits a [ACTION: SMS_STATUS, {...}] tag; we look up the real job fields here
// and feed the result back so Deputy phrases the answer (same two-phase
// pattern as deputyWeather/deputyMaps). Sending a text is a separate,
// synchronous action (SEND_SMS, handled directly in RelayAssistant.js's
// executeAction switch) since it's a write, not a lookup.

import { store } from '../data/store.js';

const SMS_ACTIONS = new Set(['SMS_STATUS']);

export function hasSmsAction(reply) {
  const regex = /\[ACTION:\s*([A-Z_]+)/gi;
  let m;
  while ((m = regex.exec(reply)) !== null) {
    if (SMS_ACTIONS.has(m[1].toUpperCase())) return true;
  }
  return false;
}

export async function runSmsActions(reply) {
  const regex = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*(\{.*?\}|[^\]]+))?\]/gis;
  const results = [];
  let m;
  while ((m = regex.exec(reply)) !== null) {
    if (!SMS_ACTIONS.has(m[1].toUpperCase())) continue;
    const json = parseJson(m[2]);
    try {
      results.push(smsStatus(json || {}));
    } catch (err) {
      console.error('Deputy SMS action failed:', err);
      results.push(`SMS status lookup failed (${err.message || err}).`);
    }
  }
  return results.length ? results.join('\n\n') : null;
}

function parseJson(raw) {
  if (!raw) return null;
  const t = raw.trim();
  if (t.startsWith('{') && t.endsWith('}')) { try { return JSON.parse(t); } catch { return null; } }
  return null;
}

// SMS_STATUS { jobId }
function smsStatus({ jobId } = {}) {
  if (!jobId) return `SMS_STATUS: No job specified.`;
  const job = (store.getAll('jobs') || []).find(j => j.id === jobId || String(j.number) === String(jobId));
  if (!job) return `SMS_STATUS: Couldn't find job "${jobId}".`;

  const label = `Job #${job.number || job.id}`;
  if (!job.confirmationSmsSentAt) return `SMS_STATUS for ${label}: no confirmation text has been sent yet.`;
  if (job.confirmedAt) {
    return `SMS_STATUS for ${label}: confirmation sent ${job.confirmationSmsSentAt}, and the customer confirmed at ${job.confirmedAt}.`;
  }
  return `SMS_STATUS for ${label}: confirmation sent ${job.confirmationSmsSentAt}, customer has not confirmed yet.${job.reminderSmsSentAt ? ` A reminder text was also sent ${job.reminderSmsSentAt}.` : ''}`;
}

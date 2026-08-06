// ============================================
// RELAY — SMS AUTOMATION (job-scheduled trigger)
// ============================================
// Fires the appointment-confirmation SMS when a job gets scheduled/rescheduled.
// Listens to the store's existing generic 'jobs' event rather than hooking
// store.js's update() directly -- store.js can't import sms.js without a
// circular import (payments.js/sms.js depend on store.js, never the reverse),
// and store.js already emits 'jobs' on every update() in both the local and
// cloud branches, so nothing there needs to change. Mirrors DeputyAutopilot.js,
// the existing precedent for a standalone util that self-registers via
// store.on(...) at module load and idempotently re-scans state rather than
// diffing previous-vs-next. Imported once for its side effect in main.js.

import { store } from '../data/store.js';
import { sendSms, smsEventEnabled } from './sms.js';

let scanTimeout = null;
const inFlight = new Set();

function scheduleScan() {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(scanForScheduledJobs, 3000);
}

store.on('jobs', scheduleScan);

async function scanForScheduledJobs() {
  if (!smsEventEnabled('confirmation')) return;

  const jobs = store.getAll('jobs') || [];
  const due = jobs.filter(j =>
    j.scheduledDate &&
    j.status !== 'Pending' &&
    !j.confirmationSmsSentAt &&
    j.customerId &&
    !inFlight.has(j.id)
  );

  for (const job of due) {
    inFlight.add(job.id);
    try {
      const result = await sendSms({ customerId: job.customerId, template: 'confirmation', jobId: job.id });
      if (result?.sent) {
        // Stamp the local cache immediately rather than waiting on a realtime
        // refresh -- otherwise a scan triggered before the cache catches up
        // would re-send to the same job.
        store.update('jobs', job.id, { confirmationSmsSentAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error(`smsAutomation: confirmation send failed for job ${job.id}:`, err);
    } finally {
      inFlight.delete(job.id);
    }
  }
}

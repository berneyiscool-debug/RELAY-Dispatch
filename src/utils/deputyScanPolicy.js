// ============================================
// RELAY — CONFLICT SCAN POLICY
// ============================================
// The decisions behind the Deputy conflict scan, kept apart from the AI call so
// they can be tested directly: which jobs collide, which collisions have already
// been raised, and whether a collision that just failed may be attempted again.
//
// Node-importable on purpose. The module that actually spends the AI allowance
// pulls in the assistant component (for the system context), which a unit test
// cannot load — so everything decidable without the network lives here.

// A collision whose proposal attempt failed is parked for this long. Without it a
// repeated trigger buys the same failing call again and again.
export const PROPOSAL_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

// Statuses that count as live work when looking for collisions.
const ACTIVE_STATUSES = ['Scheduled', 'In Progress'];

// A collision is the same technician booked onto several jobs on the same day.
// Date and technician are both required: an unassigned or undated job cannot
// collide with anything.
export function collectCollisionGroups(jobs = []) {
  const byTechDate = new Map();

  (jobs || []).forEach(job => {
    if (!job || !ACTIVE_STATUSES.includes(job.status)) return;
    if (!job.technicianName || job.technicianName === 'Unassigned' || !job.scheduledDate) return;
    const key = `${job.technicianName}_${job.scheduledDate}`;
    if (!byTechDate.has(key)) byTechDate.set(key, []);
    byTechDate.get(key).push(job);
  });

  const groups = [];
  byTechDate.forEach(group => {
    if (group.length <= 1) return;
    groups.push({
      technicianName: group[0].technicianName,
      scheduledDate: group[0].scheduledDate,
      jobs: group,
      // Stable identity of the collision, and the duplicate key stored on the ask.
      jobIds: group.map(j => j.id).sort().join(','),
    });
  });
  return groups;
}

export function hasPendingAsk(asks = [], jobIds) {
  return (asks || []).some(a => a && a.status === 'pending' && a.conflictJobIds === jobIds);
}

// A used-up daily allowance is not a failure worth retrying: the rest of the
// sweep cannot succeed either, and each attempt is another rejected call.
export function isAllowanceError(err) {
  return !!err && err.name === 'AILimitError';
}

export function createAttemptGuard({ now = Date.now, cooldownMs = PROPOSAL_FAILURE_COOLDOWN_MS } = {}) {
  const failedAt = new Map();
  let running = false;

  return {
    isRunning: () => running,

    // Single-flight: a second trigger while a sweep is in progress is refused
    // rather than queued, so repeated clicks cannot multiply the AI calls.
    begin() {
      if (running) return false;
      running = true;
      return true;
    },

    end() {
      running = false;
    },

    isCoolingDown(jobIds) {
      const at = failedAt.get(jobIds);
      return at !== undefined && (now() - at) < cooldownMs;
    },

    noteSuccess(jobIds) {
      failedAt.delete(jobIds);
    },

    noteFailure(jobIds) {
      failedAt.set(jobIds, now());
    },
  };
}

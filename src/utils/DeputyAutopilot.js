// ============================================
// RELAY — DEPUTY CONFLICT PROPOSALS
// ============================================
// When one technician is booked onto several jobs on the same day, ask the model
// for a written resolution and file it as a pending ask for the user to approve.
//
// This is deliberately NOT a background job. It used to subscribe to the store and
// sweep on every change, spending one AI call per collision group on every boot and
// every edit, whether or not the assistant was open. A group that failed was never
// recorded either, so the next store change bought it again — against the same daily
// allowance the chat assistant draws on.
//
// Now it is strictly user-initiated: `runConflictScan()` is called from the Watchdog
// "Run Scan" button and nowhere else. It also refuses to run while the assistant
// panel is closed, stops the sweep at the first failure instead of paying for the
// remaining groups, and parks a failed group on a cooldown so it is not re-bought.

import { store } from '../data/store.js';
import { dispatchChat } from './aiEngine.js';
import { hasDeputyMax } from './aiTier.js';
import { collectCollisionGroups, hasPendingAsk, isAllowanceError, createAttemptGuard } from './deputyScanPolicy.js';
import { LEGACY_BASE_PROMPT } from './brnyPlaybook.js';

const guard = createAttemptGuard();

// Nothing here may run behind the user's back, so a sweep needs the assistant
// panel actually open. Exported for tests.
export function isAssistantOpen() {
  return typeof document !== 'undefined' && !!document.querySelector('.relay-panel.open');
}

// User-initiated conflict sweep. `systemContext` is supplied by the caller, so this
// module does not have to import the assistant component (and a cycle with it).
export async function runConflictScan({ systemContext = '' } = {}) {
  if (!hasDeputyMax()) return { ran: false, reason: 'tier' };
  if (!isAssistantOpen()) return { ran: false, reason: 'closed' };
  if (!guard.begin()) return { ran: false, reason: 'running' };

  try {
    const settings = store.getSettings() || {};
    const ai = settings.ai || {};
    const basePrompt = ai.systemPrompt || LEGACY_BASE_PROMPT;
    const context = systemContext ? `\n\n${systemContext}` : '';
    const systemPrompt = `${basePrompt}${context}\n\nYour name is brny (lowercase). Never call yourself Deputy or Relay.`;

    const groups = collectCollisionGroups(store.getAll('jobs'));
    const result = {
      ran: true,
      total: groups.length,
      proposed: 0,
      existing: 0,
      coolingDown: 0,
      failed: 0,
      limitError: null,
      error: null,
    };

    for (const group of groups) {
      // Re-read each time: a proposal saved on the previous pass must be visible
      // to this one, or the same collision is drafted twice in a single sweep.
      if (hasPendingAsk(store.getAll('deputyAsks'), group.jobIds)) {
        result.existing++;
        continue;
      }
      if (guard.isCoolingDown(group.jobIds)) {
        result.coolingDown++;
        continue;
      }

      try {
        if (await generateConflictProposal(group, systemPrompt)) {
          result.proposed++;
          guard.noteSuccess(group.jobIds);
        }
      } catch (err) {
        result.failed++;
        if (isAllowanceError(err)) {
          // The allowance is shared, so every remaining group is just as
          // unaffordable as this one. Park them all, or repeated clicks keep
          // buying one rejected call per group.
          groups.forEach(g => guard.noteFailure(g.jobIds));
          result.limitError = err;
        } else {
          guard.noteFailure(group.jobIds);
          result.error = err;
          console.error('brny could not draft a conflict proposal:', err);
        }
        // One failing provider call is not worth repeating for every other
        // collision in the same sweep.
        break;
      }
    }

    return result;
  } finally {
    guard.end();
  }
}

// Files the proposal as a pending ask. Returns whether one was created: a reply
// carrying no action tag resolves nothing, so it is not treated as a success.
async function generateConflictProposal(group, systemPrompt) {
  const techName = group.technicianName;
  const date = group.scheduledDate;

  const prompt = `A schedule collision has been detected for technician ${techName} on date ${date}.
They are scheduled for the following jobs at the same time:
${group.jobs.map(j => `- Job #${j.number}: ${j.title}`).join('\n')}

Review the system context (which contains all available technicians and their workloads). 
Determine the best way to resolve this conflict (e.g. by reassigning one of the jobs to another available technician with the right skills, or changing the date).

Respond strictly with an [ACTION: RESOLVE_CONFLICT, {...}] tag containing your proposed resolution, along with a brief 1 sentence explanation of why you chose this resolution.
Example:
I propose moving Job #1002 to John Doe since he is available on this date.
[ACTION: RESOLVE_CONFLICT, {"jobId": "...", "techId": "...", "newDate": "..."}]`;

  const reply = await dispatchChat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ]);

  const actionRegex = /\[ACTION:\s*([A-Z_]+)(?:,\s*(\{.*?\}|.*?))?\]/s;
  const match = reply.match(actionRegex);
  if (!match) return false;

  const actionTag = `[ACTION: ${match[1]}, ${match[2] || '{}'}]`;
  const reasoning = reply.replace(actionRegex, '').trim() || 'No reasoning provided.';

  const allAsks = store.getAll('deputyAsks') || [];
  allAsks.push({
    id: 'ask_' + Date.now() + Math.random().toString(36).substr(2, 9),
    company_id: store.companyId,
    title: `Schedule Collision for ${techName}`,
    description: reasoning,
    proposedAction: actionTag,
    status: 'pending',
    conflictJobIds: group.jobIds, // Tracking field to prevent duplicates
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  store.save('deputyAsks', allAsks);
  return true;
}

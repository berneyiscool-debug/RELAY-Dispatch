/**
 * The Brny proposal queue — the "Needs your approval" cards the autopilot writes
 * when it spots a schedule collision it will not fix on its own.
 *
 * A row is `{ id, title, description, proposedAction, status }`. Approving used to
 * mean replaying the legacy `[ACTION: ...]` string; Brny now performs the work with
 * its own tools and then marks the proposal resolved, which clears the card.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity } from './context.js';
import { normalizeText } from './resolve.js';

const OPEN_STATUSES = ['pending'];
const view = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  proposedAction: row.proposedAction,
  status: row.status,
  created_at: row.created_at,
});

function resolveProposal(query) {
  const text = String(query || '').trim();
  const rows = store.getAll('deputyAsks') || [];
  const byId = rows.find((row) => String(row.id) === text);
  if (byId) return byId;
  const open = rows.filter((row) => OPEN_STATUSES.includes(row.status));
  const exact = open.filter((row) => normalizeText(row.title) === normalizeText(text));
  if (exact.length === 1) return exact[0];
  const partial = open.filter((row) => normalizeText(`${row.title} ${row.description || ''}`).includes(normalizeText(text)));
  if (partial.length === 1) return partial[0];
  if (!partial.length) throw notFound('proposal', text);
  throw invalidInput(`"${text}" matches more than one pending proposal: ${partial.slice(0, 5).map((row) => row.title).join('; ')}.`);
}

async function setStatus(proposal, status) {
  const updated = await store.update('deputyAsks', proposal.id, { status, updated_at: new Date().toISOString() });
  return { ...proposal, ...(updated || {}), status };
}

export default [
  defineAction({
    name: 'list_proposals',
    title: 'List pending Brny proposals',
    description:
      'List the proposals waiting in the dashboard approval queue, each with the action Brny suggested. Use it before deciding whether to carry a proposal out.',
    permission: { module: 'Dashboard', key: 'view' },
    readOnly: true,
    inputSchema: objectSchema({}, []),
    summarize: (input, result) => result.summary,
    run: async () => {
      const pending = (store.getAll('deputyAsks') || [])
        .filter((row) => OPEN_STATUSES.includes(row.status))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .map(view);
      return {
        summary: pending.length ? `${pending.length} proposal${pending.length === 1 ? '' : 's'} pending approval.` : 'No proposals are waiting for approval.',
        proposals: pending,
      };
    },
  }),

  defineAction({
    name: 'resolve_proposal',
    title: 'Resolve a Brny proposal',
    description:
      'Mark a pending proposal as handled, which clears its card from the dashboard. Perform the described change with the normal tools first — this only closes the proposal out.',
    permission: { module: 'Schedule', key: 'edit' },
    risky: true,
    inputSchema: objectSchema(
      {
        proposal: str('The proposal: its title, or a unique part of the title or description.'),
        note: str('What was done about it.'),
      },
      ['proposal']
    ),
    summarize: (input, result) => result.summary,
    run: async ({ proposal: reference, note }) => {
      const proposal = resolveProposal(reference);
      const snapshot = view(proposal);
      const updated = await setStatus(proposal, 'resolved');
      logActivity({
        type: 'proposal_resolved',
        text: `Brny proposal "${snapshot.title}" resolved${note ? ` — ${note}` : ''}.`,
        jobIds: proposal.conflictJobIds || [],
      });
      return { summary: `Resolved proposal "${snapshot.title}".`, proposal: view(updated), note: note || null };
    },
  }),

  defineAction({
    name: 'dismiss_proposal',
    title: 'Dismiss a Brny proposal',
    description: 'Dismiss a pending proposal without doing anything about it, so it stops appearing in the approval queue.',
    permission: { module: 'Schedule', key: 'edit' },
    risky: true,
    inputSchema: objectSchema(
      {
        proposal: str('The proposal: its title, or a unique part of the title or description.'),
        reason: str('Why it is being dismissed.'),
      },
      ['proposal']
    ),
    summarize: (input, result) => result.summary,
    run: async ({ proposal: reference, reason }) => {
      const proposal = resolveProposal(reference);
      const snapshot = view(proposal);
      const updated = await setStatus(proposal, 'dismissed');
      logActivity({
        type: 'proposal_dismissed',
        text: `Brny proposal "${snapshot.title}" dismissed${reason ? ` — ${reason}` : ''}.`,
        jobIds: proposal.conflictJobIds || [],
      });
      return { summary: `Dismissed proposal "${snapshot.title}".`, proposal: view(updated), reason: reason || null };
    },
  }),
];

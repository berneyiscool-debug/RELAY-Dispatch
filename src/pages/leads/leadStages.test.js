// The pipeline numbers a lead screen shows - stale detection, expected value,
// age and the per-stage roll-up - are pinned here, together with the stage
// config itself. LeadDetail.js is the canonical source for the badge classes
// and likelihood weights, so those values are asserted literally: a lead page
// that quietly drifts from this map is the bug this file exists to catch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../../data/store.js';
import {
  LEAD_STAGES,
  LEAD_STAGE_ORDER,
  OPEN_STAGES,
  LEAD_LIKELIHOOD,
  LEAD_STATUS_BADGES,
  LEAD_PRIORITY_BADGES,
  LEAD_STAGE_ACCENTS,
  STALE_DAYS,
  weightedLeadValue,
  lastLeadActivityAt,
  leadIdleDays,
  isLeadStale,
  isOpenLead,
  primaryLeadStage,
  leadDatePart,
  leadDateLabel,
  leadOwnerHtml,
  leadNextActionHtml,
  leadStageBadge,
  logLeadStageChange,
  notifyLeadOwner,
  summarizeByStage,
} from './leadStages.js';

const MS_PER_DAY = 86400000;
const NOW = new Date('2026-03-10T12:00:00.000Z');
const daysAgo = (days) => new Date(NOW.getTime() - days * MS_PER_DAY).toISOString();

const lead = (overrides = {}) => ({
  id: 'lead_1',
  title: 'Boiler replacement',
  status: 'Qualified',
  value: 1000,
  createdAt: daysAgo(2),
  updatedAt: daysAgo(1),
  ...overrides,
});

test('the pipeline is the same seven stages everywhere', () => {
  assert.deepEqual(LEAD_STAGES, ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']);
  assert.equal(LEAD_STAGES.length, 7);
  assert.ok(LEAD_STAGES.includes('Proposal'));
  assert.ok(LEAD_STAGES.includes('Negotiation'));
  assert.equal(LEAD_STAGE_ORDER, LEAD_STAGES);
  assert.deepEqual(OPEN_STAGES, ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation']);
});

test('the badge and likelihood tables match LeadDetail.js exactly', () => {
  assert.deepEqual(LEAD_LIKELIHOOD, {
    New: 10, Contacted: 30, Qualified: 50, Proposal: 70, Negotiation: 85, Won: 100, Lost: 0,
  });
  assert.deepEqual(LEAD_STATUS_BADGES, {
    New: 'badge-info',
    Contacted: 'badge-neutral',
    Qualified: 'badge-warning',
    Proposal: 'badge-primary',
    Negotiation: 'badge-purple',
    Won: 'badge-success',
    Lost: 'badge-danger',
  });
  assert.deepEqual(LEAD_PRIORITY_BADGES, {
    Low: 'badge-neutral', Medium: 'badge-warning', High: 'badge-danger',
  });
  assert.equal(STALE_DAYS, 14);
});

test('every stage has an accent built from a real CSS token', () => {
  LEAD_STAGES.forEach((stage) => {
    assert.match(LEAD_STAGE_ACCENTS[stage], /^var\(--color-[a-z-]+\)$/);
  });
  assert.equal(Object.keys(LEAD_STAGE_ACCENTS).length, 7);
});

test('weightedLeadValue weights the value by the stage likelihood', () => {
  const expected = {
    New: 100, Contacted: 300, Qualified: 500, Proposal: 700, Negotiation: 850, Won: 1000, Lost: 0,
  };
  LEAD_STAGES.forEach((status) => {
    assert.equal(weightedLeadValue(lead({ status })), expected[status]);
  });
});

test('weightedLeadValue is 0 for an unknown status, a missing value or no lead', () => {
  assert.equal(weightedLeadValue(lead({ status: 'Archived' })), 0);
  assert.equal(weightedLeadValue(lead({ status: undefined })), 0);
  assert.equal(weightedLeadValue({ status: 'Won' }), 0);
  assert.equal(weightedLeadValue({ status: 'Won', value: null }), 0);
  assert.equal(weightedLeadValue({ status: 'Won', value: '250' }), 250);
  assert.equal(weightedLeadValue(null), 0);
  assert.equal(weightedLeadValue(undefined), 0);
});

test('lastLeadActivityAt prefers the update over the creation', () => {
  const updated = daysAgo(1);
  assert.equal(lastLeadActivityAt(lead({ updatedAt: updated, createdAt: daysAgo(9) })), updated);
  assert.equal(lastLeadActivityAt({ createdAt: daysAgo(3) }), daysAgo(3));
  assert.equal(lastLeadActivityAt({ updated_at: daysAgo(4) }), daysAgo(4));
  assert.equal(lastLeadActivityAt({ updatedAt: 'not a date', createdAt: daysAgo(5) }), daysAgo(5));
  assert.equal(lastLeadActivityAt({}), null);
  assert.equal(lastLeadActivityAt(lead({ updatedAt: undefined, createdAt: undefined })), null);
  assert.equal(lastLeadActivityAt(null), null);
});

test('a lead is stale only once it passes the STALE_DAYS boundary', () => {
  assert.equal(STALE_DAYS, 14);
  // Exactly the boundary: 14 whole days of silence is not yet stale.
  assert.equal(isLeadStale({ updatedAt: daysAgo(14) }, STALE_DAYS, NOW), false);
  // One millisecond short of the boundary.
  assert.equal(
    isLeadStale({ updatedAt: new Date(NOW.getTime() - 14 * MS_PER_DAY + 1).toISOString() }, STALE_DAYS, NOW),
    false,
  );
  // One millisecond past it.
  assert.equal(
    isLeadStale({ updatedAt: new Date(NOW.getTime() - 14 * MS_PER_DAY - 1).toISOString() }, STALE_DAYS, NOW),
    true,
  );
  assert.equal(isLeadStale({ updatedAt: daysAgo(15) }, STALE_DAYS, NOW), true);
});

test('isLeadStale falls back to createdAt and honours a custom window', () => {
  assert.equal(isLeadStale({ createdAt: daysAgo(20) }, STALE_DAYS, NOW), true);
  assert.equal(isLeadStale({ createdAt: daysAgo(20) }, 30, NOW), false);
  // Fresh activity beats an old creation date.
  assert.equal(isLeadStale({ createdAt: daysAgo(60), updatedAt: daysAgo(1) }, STALE_DAYS, NOW), false);
});

test('isLeadStale says nothing about a lead with no usable timestamp', () => {
  assert.equal(isLeadStale({}, STALE_DAYS, NOW), false);
  assert.equal(isLeadStale(lead({ updatedAt: undefined, createdAt: undefined }), STALE_DAYS, NOW), false);
  assert.equal(isLeadStale(null, STALE_DAYS, NOW), false);
  assert.equal(isLeadStale({ updatedAt: 'nonsense' }, STALE_DAYS, NOW), false);
});

test('leadIdleDays counts whole days of silence and never goes negative', () => {
  assert.equal(leadIdleDays({ updatedAt: daysAgo(0) }, NOW), 0);
  assert.equal(leadIdleDays({ updatedAt: daysAgo(1) }, NOW), 1);
  assert.equal(leadIdleDays({ updatedAt: daysAgo(3.9) }, NOW), 3);
  assert.equal(leadIdleDays({ updatedAt: daysAgo(30) }, NOW), 30);
});

test('leadIdleDays measures silence, not age, when both timestamps exist', () => {
  assert.equal(leadIdleDays({ createdAt: daysAgo(200), updatedAt: daysAgo(2) }, NOW), 2);
});

test('leadIdleDays falls back to creation for a never-touched lead', () => {
  assert.equal(leadIdleDays({ createdAt: daysAgo(9), updatedAt: undefined }, NOW), 9);
});

test('leadIdleDays is 0 rather than NaN for an unknown activity date', () => {
  assert.equal(leadIdleDays({}, NOW), 0);
  assert.equal(leadIdleDays(null, NOW), 0);
  assert.equal(leadIdleDays({ updatedAt: null, createdAt: null }, NOW), 0);
  assert.equal(leadIdleDays({ createdAt: 'yesterday' }, NOW), 0);
});

test('leadIdleDays clamps a future activity date to 0', () => {
  assert.equal(leadIdleDays({ updatedAt: new Date(NOW.getTime() + 5 * MS_PER_DAY).toISOString() }, NOW), 0);
});

test('summarizeByStage returns every stage in pipeline order', () => {
  const rows = summarizeByStage([
    lead({ id: 'a', status: 'Won', value: 500 }),
    lead({ id: 'b', status: 'New', value: 1000 }),
    lead({ id: 'c', status: 'New', value: 2000 }),
    lead({ id: 'd', status: 'Negotiation', value: 100 }),
  ]);

  assert.deepEqual(rows.map((r) => r.stage), LEAD_STAGES);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map((r) => r.count), [2, 0, 0, 0, 1, 1, 0]);
  assert.deepEqual(rows.map((r) => r.totalValue), [3000, 0, 0, 0, 100, 500, 0]);
  assert.deepEqual(rows.map((r) => r.weightedValue), [300, 0, 0, 0, 85, 500, 0]);
});

test('summarizeByStage totals only count the stage they belong to', () => {
  const rows = summarizeByStage([
    lead({ status: 'Proposal', value: 1000 }),
    lead({ status: 'Proposal', value: 1500 }),
    lead({ status: 'Lost', value: 9000 }),
  ]);
  const byStage = Object.fromEntries(rows.map((r) => [r.stage, r]));
  assert.equal(byStage.Proposal.count, 2);
  assert.equal(byStage.Proposal.totalValue, 2500);
  assert.equal(byStage.Proposal.weightedValue, 1750);   // 70% of 2500
  assert.equal(byStage.Lost.count, 1);
  assert.equal(byStage.Lost.totalValue, 9000);
  assert.equal(byStage.Lost.weightedValue, 0);
  assert.equal(byStage.New.count, 0);
});

test('summarizeByStage still emits all seven rows with nothing to summarise', () => {
  [[], null, undefined, 'nope'].forEach((input) => {
    const rows = summarizeByStage(input);
    assert.deepEqual(rows.map((r) => r.stage), LEAD_STAGES);
    assert.deepEqual(rows.map((r) => r.count), [0, 0, 0, 0, 0, 0, 0]);
    assert.deepEqual(rows.map((r) => r.weightedValue), [0, 0, 0, 0, 0, 0, 0]);
  });
});

test('summarizeByStage ignores a lead whose status is not a pipeline stage', () => {
  const rows = summarizeByStage([lead({ status: 'Archived', value: 500 }), {}, null]);
  assert.deepEqual(rows.map((r) => r.count), [0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(rows.map((r) => r.totalValue), [0, 0, 0, 0, 0, 0, 0]);
});

test('logLeadStageChange returns a new array and leaves the original alone', () => {
  const existing = [
    { id: 'hist_1', status: 'New', text: 'created', user: 'Ada', timestamp: daysAgo(3) },
  ];
  const subject = lead({ stageHistory: existing });

  const history = logLeadStageChange(subject, 'New', 'Contacted');

  assert.notEqual(history, existing);
  assert.equal(history.length, 2);
  assert.equal(existing.length, 1);
  assert.deepEqual(subject.stageHistory, existing);
  assert.equal(history[1], existing[0]);
});

test('logLeadStageChange prepends an entry shaped like LeadDetail.js writes', () => {
  const history = logLeadStageChange(lead(), 'Contacted', 'Qualified');
  const entry = history[0];

  assert.equal(history.length, 1);
  assert.match(entry.id, /^hist_\d+$/);
  assert.equal(entry.status, 'Qualified');
  assert.equal(entry.text, 'Lead stage transitioned from "Contacted" to "Qualified".');
  assert.equal(entry.user, 'System');
  assert.ok(!Number.isNaN(new Date(entry.timestamp).getTime()));
  assert.deepEqual(Object.keys(entry).sort(), ['id', 'status', 'text', 'timestamp', 'user']);
});

test('logLeadStageChange copes with a missing or unusable history', () => {
  assert.equal(logLeadStageChange(lead(), 'New', 'Contacted').length, 1);
  assert.equal(logLeadStageChange({ stageHistory: null }, 'New', 'Contacted').length, 1);
  assert.equal(logLeadStageChange({ stageHistory: 'broken' }, 'New', 'Contacted').length, 1);
});

test('notifyLeadOwner is a no-op without an owner', () => {
  const created = [];
  const originalCreate = store.create;
  store.create = (collection, item) => { created.push([collection, item]); return item; };
  try {
    assert.equal(notifyLeadOwner(lead({ assignedTo: undefined })), null);
    assert.equal(notifyLeadOwner(lead({ assignedTo: '' })), null);
    assert.equal(notifyLeadOwner(null), null);
    assert.equal(notifyLeadOwner({}), null);
    assert.equal(created.length, 0);
  } finally {
    store.create = originalCreate;
  }
});

test('notifyLeadOwner writes one Info notification for the owner', () => {
  const created = [];
  const originalCreate = store.create;
  const originalGetById = store.getById;
  store.create = (collection, item) => { created.push([collection, item]); return item; };
  store.getById = () => null;
  try {
    const result = notifyLeadOwner(lead({ assignedTo: 'user_7', number: 'LD-00001' }), {
      title: 'Lead going stale',
      message: 'No activity for 14 days.',
    });

    assert.equal(created.length, 1);
    const [collection, item] = created[0];
    assert.equal(collection, 'notifications');
    assert.equal(item.assignedTo, 'user_7');
    assert.equal(item.type, 'Lead Activity');
    assert.equal(item.title, 'Lead going stale');
    assert.equal(item.description, 'No activity for 14 days.');
    assert.equal(item.message, 'No activity for 14 days.');
    assert.equal(item.status, 'Info');
    assert.equal(item.origin, 'system');
    assert.equal(item.createdBy, 'Lead Pipeline');
    assert.match(item.id, /^notif_lead_lead_1_\d{4}-\d{2}-\d{2}$/);
    assert.ok(!Number.isNaN(new Date(item.createdAt).getTime()));
    assert.equal(result, item);
  } finally {
    store.create = originalCreate;
    store.getById = originalGetById;
  }
});

test('notifyLeadOwner does not stack a second notification for the same day', () => {
  const created = [];
  const originalCreate = store.create;
  const originalGetById = store.getById;
  store.create = (collection, item) => { created.push(item); return item; };
  store.getById = () => ({ id: 'already-there' });
  try {
    assert.equal(notifyLeadOwner(lead({ assignedTo: 'user_7' }), { title: 'Again' }), null);
    assert.equal(created.length, 0);
  } finally {
    store.create = originalCreate;
    store.getById = originalGetById;
  }
});

test('notifyLeadOwner survives a notification missing a message', () => {
  const created = [];
  const originalCreate = store.create;
  const originalGetById = store.getById;
  store.create = (collection, item) => { created.push(item); return item; };
  store.getById = () => null;
  try {
    notifyLeadOwner(lead({ assignedTo: 'user_7' }), {});
    assert.equal(created[0].message, 'Lead updated');
    assert.equal(created[0].title, 'Lead update: Boiler replacement');
  } finally {
    store.create = originalCreate;
    store.getById = originalGetById;
  }
});

// --- The presentation helpers LeadsList.js and LeadDetail.js share. A lead page
// and the leads table must never format the same field two different ways, so
// these are asserted on their rendered markup, not on internals.

test('leadDatePart keeps only a real YYYY-MM-DD and rejects everything else', () => {
  assert.equal(leadDatePart('2026-03-10'), '2026-03-10');
  assert.equal(leadDatePart('2026-03-10T08:30:00.000Z'), '2026-03-10');
  assert.equal(leadDatePart(new Date('2026-03-10T08:30:00.000Z')), '2026-03-10');
  assert.equal(leadDatePart(''), '');
  assert.equal(leadDatePart(null), '');
  assert.equal(leadDatePart(undefined), '');
  assert.equal(leadDatePart('not a date'), '');
});

test('leadDateLabel renders the en-AU day/month/year a list cell shows', () => {
  assert.equal(leadDateLabel('2026-03-10'), '10/03/2026');
  assert.equal(leadDateLabel(''), '');
  assert.equal(leadDateLabel('nonsense'), '');
});

test('leadStageBadge falls back to the neutral badge for anything off-pipeline', () => {
  LEAD_STAGES.forEach((stage) => assert.equal(leadStageBadge(stage), LEAD_STATUS_BADGES[stage]));
  assert.equal(leadStageBadge('Archived'), 'badge-neutral');
  assert.equal(leadStageBadge(undefined), LEAD_STATUS_BADGES.New);
});

test('primaryLeadStage is the stage a lead is reported against', () => {
  assert.equal(primaryLeadStage(lead({ status: 'Negotiation' })), 'Negotiation');
  assert.equal(primaryLeadStage(lead({ status: 'nonsense' })), 'New');
  assert.equal(primaryLeadStage(null), 'New');
});

test('isOpenLead excludes only the two closed stages', () => {
  assert.equal(isOpenLead(lead({ status: 'New' })), true);
  assert.equal(isOpenLead(lead({ status: 'Negotiation' })), true);
  assert.equal(isOpenLead(lead({ status: 'Won' })), false);
  assert.equal(isOpenLead(lead({ status: 'Lost' })), false);
});

test('leadOwnerHtml renders initials when owned and a placeholder when not', () => {
  const owned = leadOwnerHtml(lead({ assignedTo: 'tech_1', salesRepName: 'Dana White' }));
  assert.match(owned, /class="lead-owner"/);
  assert.match(owned, />DW</);
  assert.match(owned, />Dana White</);
  assert.equal(leadOwnerHtml(lead()), '<span class="lead-owner-unassigned">Unassigned</span>');
  assert.equal(leadOwnerHtml(null), '<span class="lead-owner-unassigned">Unassigned</span>');
});

test('leadOwnerHtml escapes a name before it reaches the DOM', () => {
  const html = leadOwnerHtml(lead({ salesRepName: '<img src=x onerror=alert(1)>' }));
  assert.ok(!html.includes('<img'));
});

test('leadNextActionHtml marks an overdue date and leaves a future one plain', () => {
  const overdue = leadNextActionHtml(lead({ nextActionDate: '2000-01-01' }));
  assert.match(overdue, /lead-next-action is-overdue/);
  const upcoming = leadNextActionHtml(lead({ nextActionDate: '2099-01-01' }));
  assert.match(upcoming, /class="lead-next-action"/);
  assert.ok(!upcoming.includes('is-overdue'));
});

test('leadNextActionHtml renders the em dash when there is no next action', () => {
  const html = leadNextActionHtml(lead({ nextActionDate: null }));
  assert.match(html, /text-secondary">—</);
});

test('leadNextActionHtml only adds the stale badge to an open stale lead', () => {
  const staleLead = lead({ status: 'Qualified', updatedAt: daysAgo(60) });
  assert.match(leadNextActionHtml(staleLead), /lead-stale-badge/);
  assert.ok(!leadNextActionHtml(staleLead, { withStale: false }).includes('lead-stale-badge'));
  const closedStale = lead({ status: 'Won', updatedAt: daysAgo(60) });
  assert.ok(!leadNextActionHtml(closedStale).includes('lead-stale-badge'));
});

test('logLeadStageChange uses a custom note when one is supplied', () => {
  const [entry] = logLeadStageChange(lead(), 'New', 'Won', 'Converted to Quote Q-1042 (Status: Won).');
  assert.equal(entry.text, 'Converted to Quote Q-1042 (Status: Won).');
  assert.equal(entry.status, 'Won');
});

test('logLeadStageChange falls back to the generated transition note', () => {
  const [entry] = logLeadStageChange(lead(), 'New', 'Won');
  assert.equal(entry.text, 'Lead stage transitioned from "New" to "Won".');
});

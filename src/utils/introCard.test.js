// The greeting card is the first thing a user sees in the assistant, so the
// three numbers, the tone of each number (neutral vs warning), the order of the
// "needs attention" chips and the commands they fire are pinned here. All of it
// is pure data from `buildIntroCard`, so no DOM or store is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIntroCard,
  jobsScheduledToday,
  unassignedJobCount,
  scheduleConflictCount,
  formatTileMoney,
  formatFullMoney,
} from './introCard.js';

const TODAY = '2026-10-05';

const job = (overrides = {}) => ({ id: 'j1', status: 'Scheduled', scheduledDate: TODAY, ...overrides });
const invoice = (overrides = {}) => ({ id: 'i1', status: 'Overdue', total: 100, ...overrides });

test('tile money stays short enough for a narrow tile', () => {
  assert.equal(formatTileMoney(0), '$0');
  assert.equal(formatTileMoney(940), '$940');
  assert.equal(formatTileMoney(999), '$999');
  assert.equal(formatTileMoney(1000), '$1k');
  assert.equal(formatTileMoney(1240), '$1.2k');
  assert.equal(formatTileMoney(12480), '$12.5k');
  assert.equal(formatTileMoney(125000), '$125k');
  assert.equal(formatTileMoney(1450000), '$1.5M');
});

test('tile money never shows a negative or nonsense amount', () => {
  assert.equal(formatTileMoney(-500), '$0');
  assert.equal(formatTileMoney('not a number'), '$0');
  assert.equal(formatTileMoney(null), '$0');
  assert.equal(formatTileMoney(undefined), '$0');
});

test('full money keeps the exact figure for tooltips', () => {
  assert.equal(formatFullMoney(12480.4), '$12,480');
  assert.equal(formatFullMoney(0), '$0');
});

test('unassigned jobs are the open ones with no technician', () => {
  const jobs = [
    job({ id: 'a' }),                                                    // scheduled, nobody
    job({ id: 'b', technicianName: 'Unassigned' }),                      // explicitly nobody
    job({ id: 'c', technicians: [] }),                                   // empty list
    job({ id: 'd', technicianName: 'Sam' }),                             // assigned
    job({ id: 'e', technicians: [{ id: 't1' }] }),                       // assigned
    job({ id: 'f', status: 'Complete' }),                                // finished, irrelevant
    job({ id: 'g', status: 'Pending' }),                                 // still needs someone
  ];
  assert.equal(unassignedJobCount(jobs), 4);
});

test("jobs today come from today's schedule blocks and today's jobs", () => {
  const jobs = [
    job({ id: 'j1' }),
    job({ id: 'j2', scheduledDate: '2026-10-06' }),
    job({ id: 'j3', status: 'Complete', scheduledDate: TODAY }),
  ];
  const schedule = [
    { date: TODAY, jobId: 'j1' },                                        // already counted
    { date: TODAY, jobId: 'j9' },                                        // block only
    { date: '2026-10-06', jobId: 'j8' },                                 // another day
    { date: TODAY },                                                     // leave / blockout
  ];
  assert.equal(jobsScheduledToday(jobs, schedule, TODAY), 2);
});

test('jobs today survives the day-first dates older records carry', () => {
  const schedule = [{ date: '5/10/2026', jobId: 'j1' }];
  assert.equal(jobsScheduledToday([], schedule, TODAY), 1, 'd/m/yyyy is read day first');
});

test('a collision is counted once per technician per day', () => {
  const overlapping = [
    { technicianId: 't1', date: TODAY, startHour: 9, endHour: 11 },
    { technicianId: 't1', date: TODAY, startHour: 10, endHour: 12 },
    { technicianId: 't1', date: TODAY, startHour: 13, endHour: 14 },     // no clash with either
    { technicianId: 't2', date: TODAY, startHour: 8, endHour: 9 },
    { technicianId: 't2', date: TODAY, startHour: 8, endHour: 10 },      // second tech collides
    { date: TODAY, startHour: 9, endHour: 17 },                          // no technician, ignored
  ];
  assert.equal(scheduleConflictCount(overlapping), 2);
});

test('back-to-back blocks are not a collision', () => {
  const schedule = [
    { technicianId: 't1', date: TODAY, startHour: 9, endHour: 11 },
    { technicianId: 't1', date: TODAY, startHour: 11, endHour: 12 },
  ];
  assert.equal(scheduleConflictCount(schedule), 0);
});

test('the three tiles carry today, unassigned and overdue money', () => {
  const { tiles, counts } = buildIntroCard({
    jobs: [job({ id: 'j1' }), job({ id: 'j2' })],
    invoices: [invoice({ total: 1200 }), invoice({ total: 300 }), invoice({ id: 'p1', status: 'Paid', total: 9000 })],
    todayKey: TODAY,
  });

  assert.deepEqual(tiles.map(t => t.label), ['Jobs Today', 'Unassigned', 'Overdue $']);
  assert.deepEqual(tiles.map(t => t.value), ['2', '2', '$1.5k']);
  assert.equal(counts.overdueTotal, 1500);
});

test('problem tiles go warning, informational ones stay neutral', () => {
  const clean = buildIntroCard({ jobs: [job({ technicianName: 'Sam' })], invoices: [], todayKey: TODAY });
  assert.deepEqual(clean.tiles.map(t => t.tone), ['neutral', 'neutral', 'neutral']);

  const messy = buildIntroCard({ jobs: [job()], invoices: [invoice()], todayKey: TODAY });
  assert.deepEqual(messy.tiles.map(t => t.tone), ['neutral', 'warning', 'warning']);
});

test('an empty day reads as zeros, not as a crash', () => {
  const { tiles, attention, actions, counts } = buildIntroCard({ todayKey: TODAY });
  assert.deepEqual(tiles.map(t => t.value), ['0', '0', '$0']);
  assert.deepEqual(attention, []);
  assert.equal(counts.jobsToday, 0);
  assert.ok(actions.length > 0, 'the card always offers something to do');
});

test('attention chips run worst first and only when there is something wrong', () => {
  const { attention } = buildIntroCard({
    jobs: [job({ id: 'j1' }), job({ id: 'j2', technicianName: 'Sam' })],
    invoices: [invoice()],
    stock: [{ id: 's1', quantity: 0, reorderPoint: 5 }],
    schedule: [
      { technicianId: 't1', date: TODAY, startHour: 9, endHour: 11, jobId: 'j1' },
      { technicianId: 't1', date: TODAY, startHour: 10, endHour: 12, jobId: 'j2' },
    ],
    todayKey: TODAY,
  });
  assert.deepEqual(attention.map(c => c.icon), ['receipt_long', 'person_off', 'event_busy', 'inventory_2']);
  assert.deepEqual(attention.map(c => c.tone), ['warning', 'warning', 'warning', 'info']);
  assert.match(attention[0].label, /Overdue Invoice/);
});

test("the collision chip counts today only, so its label is honest", () => {
  const { attention, counts } = buildIntroCard({
    schedule: [
      { technicianId: 't1', date: '2026-10-04', startHour: 9, endHour: 11 },
      { technicianId: 't1', date: '2026-10-04', startHour: 10, endHour: 12 },
    ],
    todayKey: TODAY,
  });
  assert.equal(counts.conflicts, 0);
  assert.deepEqual(attention, []);
});

test('a quote backlog and the route planner appear only when they apply', () => {
  const base = buildIntroCard({ todayKey: TODAY });
  assert.deepEqual(base.actions.map(a => a.icon), ['calendar_month', 'build']);

  const withQuotes = buildIntroCard({ quotes: [{ status: 'Sent' }, { status: 'Draft' }, { status: 'Accepted' }], todayKey: TODAY });
  assert.equal(withQuotes.actions[0].icon, 'request_quote');
  assert.equal(withQuotes.counts.pendingQuotes, 2);

  const withMaps = buildIntroCard({ maps: true, todayKey: TODAY });
  assert.ok(withMaps.actions.some(a => a.icon === 'map'));
});

test('every tile and chip fires a command, and none collide', () => {
  const { tiles, attention, actions } = buildIntroCard({
    jobs: [job()],
    invoices: [invoice()],
    quotes: [{ status: 'Sent' }],
    stock: [{ id: 's1', quantity: 1, reorderPoint: 5 }],
    maps: true,
    todayKey: TODAY,
  });
  const cmds = [...tiles, ...attention, ...actions].map(c => c.cmd);
  assert.ok(cmds.every(c => typeof c === 'string' && c.trim().length > 0));
  assert.equal(new Set(cmds).size, cmds.length, 'no two buttons send the same message');
});

test('the tile commands still work without an AI account', () => {
  // `runLocalCommand` answers "how many …" offline, so the tiles must stick to
  // that phrasing or a free user's click goes nowhere.
  const { tiles } = buildIntroCard({ todayKey: TODAY });
  tiles.forEach(t => assert.match(t.cmd, /^how many/));
});

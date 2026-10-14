import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../../src/data/store.js';
import { buildDemoDataset } from '../../src/data/demoDataset.js';
import { computeAll, KPI_IDS } from '../functions/dashboard-kpis/kpis.js';
import { KPI_TABLES, normalizeRows, wallClock, wallClockDate, isValidTimeZone } from '../functions/dashboard-kpis/rows.js';
import { canSee, allowedKpiIds } from '../functions/dashboard-kpis/access.js';

// The zone these tests run in: shifting into it must change nothing.
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

describe('server rows produce the same numbers as the app', () => {
  const now = new Date(2026, 9, 8, 10, 0);
  const demo = buildDemoDataset({ now }).collections;

  // What Postgres holds for each collection: the app's own cloud serialisation,
  // trimmed to the columns the Edge Function selects.
  const dbRows = {};
  for (const [coll, { columns }] of Object.entries(KPI_TABLES)) {
    const cols = columns.split(',');
    dbRows[coll] = (demo[coll] || []).map(rec => {
      const row = store.denormalizeRecord(structuredClone(rec), coll);
      return Object.fromEntries(cols.filter(c => c in row).map(c => [c, row[c]]));
    });
  }

  // The app's cloud path: every row back through store.normalizeRecord.
  const appCloud = Object.fromEntries(Object.keys(KPI_TABLES).map(coll => [
    coll, (demo[coll] || []).map(rec => store.normalizeRecord(store.denormalizeRecord(structuredClone(rec), coll), coll)),
  ]));

  const server = Object.fromEntries(Object.entries(dbRows).map(([coll, rows]) => [coll, normalizeRows(coll, rows, LOCAL_TZ)]));

  for (const period of ['today', 'week', 'month', 'quarter', 'fy']) {
    test(`every card matches for ${period}`, () => {
      const a = computeAll(KPI_IDS, appCloud, { period, now });
      const b = computeAll(KPI_IDS, server, { period, now });
      for (const id of KPI_IDS) {
        assert.deepEqual(b[id], a[id], `${id} (${period})`);
      }
    });
  }

  test('and the cloud numbers match the local demo, now that cloud saves keep the lifecycle fields', () => {
    const local = computeAll(KPI_IDS, demo, { period: 'month', now });
    const b = computeAll(KPI_IDS, server, { period: 'month', now });
    for (const id of KPI_IDS) {
      assert.deepEqual(b[id].value, local[id].value, id);
    }
  });
});

describe('time zones', () => {
  test('timestamps become the business wall clock', () => {
    assert.equal(wallClock('2026-10-07T22:30:00Z', 'Australia/Sydney'), '2026-10-08T09:30:00'); // AEDT, +11
    assert.equal(wallClock('2026-07-07T22:30:00Z', 'Australia/Sydney'), '2026-07-08T08:30:00'); // AEST, +10
    assert.equal(wallClock('2026-10-07T22:30:00Z', 'Australia/Perth'), '2026-10-08T06:30:00');
  });

  test('a Sydney morning is already "today" on a UTC server', () => {
    // 7:30am 8 Oct in Sydney is still 7 Oct in UTC.
    const d = wallClockDate(new Date('2026-10-07T20:30:00Z'), 'Australia/Sydney');
    assert.equal(d.getDate(), 8);
    assert.equal(d.getHours(), 7);
  });

  test('a job finished at 9am Sydney time lands on the right day', () => {
    const rows = normalizeRows('jobs', [{ id: 'j', status: 'Completed', notes: '__meta__:' + JSON.stringify({ completedAt: '2026-10-07T22:00:00.000Z' }) }], 'Australia/Sydney');
    assert.equal(rows[0].completedAt, '2026-10-08T09:00:00');
  });

  test('zone validation', () => {
    assert.ok(isValidTimeZone('Australia/Brisbane'));
    assert.ok(!isValidTimeZone('Mars/Olympus'));
    assert.ok(!isValidTimeZone(''));
  });
});

describe('access', () => {
  const ut = { permissions: [{ module: 'Jobs', view: true }, { module: 'Timesheets', view_own: true }] };

  test('mirrors the app permission rules', () => {
    assert.ok(canSee({ role: 'admin' }, null, ['Invoices', 'view']));
    assert.ok(!canSee({ role: 'customer' }, null, ['Jobs', 'view']));
    assert.ok(canSee({ role: 'technician' }, ut, ['Jobs', 'view']));
    assert.ok(!canSee({ role: 'technician' }, ut, ['Invoices', 'view']));
    assert.ok(!canSee({ role: 'technician' }, ut, ['Timesheets', 'view']));
    assert.ok(canSee({ role: 'manager' }, null, ['Invoices', 'view']));
    assert.ok(canSee({ role: 'technician' }, null, ['Invoices', 'view'])); // built-in technician defaults
    assert.ok(!canSee({ role: 'technician' }, null, ['Timesheets', 'view'])); // own time only
    assert.ok(canSee({ role: 'technician' }, null, ['Timesheets', 'view_own']));
  });

  test('a technician with jobs only gets job and team cards', () => {
    const ids = allowedKpiIds(KPI_IDS, { role: 'technician' }, ut, { staffCount: 4 });
    assert.ok(ids.includes('active_jobs'));
    assert.ok(ids.includes('utilisation'));
    assert.ok(!ids.includes('overdue'));
    assert.ok(!ids.includes('hours_logged')); // needs Timesheets view, not just view_own
  });

  test('cards a team-size rule hides are not served', () => {
    assert.ok(!allowedKpiIds(['jobs_per_tech'], { role: 'admin' }, null, { staffCount: 1 }).length);
  });
});

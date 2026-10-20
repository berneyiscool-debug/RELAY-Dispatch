/**
 * The `activity` trail persists to `activity_log` in Cloud. Writers have used
 * flat keys (jobId / leadId) and the generic recordType / recordId pair, and
 * LeadDetail still filters the trail on `leadId` / `entityId`, so the row has
 * to carry the link and reading it back has to restore those keys.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store } from './store.js';
import { supabase } from '../utils/supabase.js';
import { activityFromRow, activityToRow } from './activityRecord.js';
import { logActivity } from '../actions/context.js';

const COLUMNS = ['id', 'company_id', 'type', 'text', 'status', 'record_type', 'record_id', 'actor_name', 'occurred_at', 'created_at', 'updated_at'];

describe('activity row mapping', () => {
  test('a legacy flat-key entry keeps its record link and actor', () => {
    const row = store.denormalizeRecord({
      id: 1760000000000,
      companyId: 'company-1',
      jobId: 'job-9',
      type: 'job_converted_from_quote',
      text: 'Live job J-00009 created from accepted Quote Q-00004.',
      user: 'System Automation',
      timestamp: '2026-10-20T01:02:03.000Z',
    }, 'activity');

    assert.equal(row.id, '1760000000000');
    assert.equal(row.company_id, 'company-1');
    assert.equal(row.record_type, 'job');
    assert.equal(row.record_id, 'job-9');
    assert.equal(row.actor_name, 'System Automation');
    assert.equal(row.occurred_at, '2026-10-20T01:02:03.000Z');
    assert.ok(Object.keys(row).every(key => COLUMNS.includes(key)), `unexpected columns: ${Object.keys(row)}`);
  });

  test('a logActivity-shaped entry prefers the generic pair', () => {
    const row = activityToRow({ id: 'act_1', recordType: 'invoice', recordId: 'inv-1', invoiceId: 'inv-1', entityId: 'inv-1', status: 'Sent' });
    assert.equal(row.record_type, 'invoice');
    assert.equal(row.record_id, 'inv-1');
    assert.equal(row.status, 'Sent');
    assert.equal('company_id' in row, false, 'company_id is only sent when the entry has one');
  });

  test('a row read back restores the flat keys pages filter on', () => {
    const entry = store.normalizeRecord({
      id: 'act_2',
      company_id: 'company-1',
      type: 'lead_stage_changed',
      text: 'Moved to Qualified.',
      status: null,
      record_type: 'lead',
      record_id: 'lead-7',
      actor_name: 'Alex',
      occurred_at: '2026-10-20T02:00:00+00:00',
      created_at: '2026-10-20T02:00:01+00:00',
      updated_at: '2026-10-20T02:00:01+00:00',
    }, 'activity');

    assert.equal(entry.companyId, 'company-1');
    assert.equal(entry.leadId, 'lead-7');
    assert.equal(entry.entityId, 'lead-7');
    assert.equal(entry.recordType, 'lead');
    assert.equal(entry.user, 'Alex');
    assert.equal(entry.timestamp, '2026-10-20T02:00:00+00:00');
    assert.equal('record_type' in entry, false);
  });

  test('an unlinked row round trips without inventing a record', () => {
    const entry = activityFromRow(activityToRow({ id: 'act_3', type: 'note', text: 'hello', timestamp: '2026-10-20T03:00:00.000Z' }));
    assert.equal(entry.recordType, null);
    assert.equal(entry.recordId, null);
    assert.equal(entry.text, 'hello');
    assert.equal(entry.timestamp, '2026-10-20T03:00:00.000Z');
  });
});

/**
 * A tiny stand-in for the Supabase tables both "devices" talk to. It keeps
 * rows in memory and logs every write so the tests can say exactly what the
 * store sent.
 */
function fakeBackend(companyId) {
  const tables = {};
  const writes = [];
  const rowsOf = (table) => (tables[table] = tables[table] || []);
  const result = (data) => {
    const promise = Promise.resolve({ data, error: null });
    promise.single = async () => ({ data: data[0] || null, error: null });
    return promise;
  };
  const from = (table) => ({
    select: () => ({
      eq: (column, value) => table === 'companies'
        ? result([{ id: companyId, name: 'Activity Co', settings: {} }])
        : result(rowsOf(table).filter(row => row[column] === value).map(row => ({ ...row }))),
    }),
    insert: async (rows) => {
      writes.push({ table, op: 'insert', rows });
      rows.forEach(row => rowsOf(table).push({ ...row }));
      return { error: null };
    },
    upsert: async (rows, options = {}) => {
      const list = Array.isArray(rows) ? rows : [rows];
      writes.push({ table, op: 'upsert', rows: list, options });
      list.forEach(row => {
        const index = rowsOf(table).findIndex(existing => existing.id === row.id);
        if (index === -1) rowsOf(table).push({ ...row });
        else if (!options.ignoreDuplicates) rowsOf(table)[index] = { ...row };
      });
      return { error: null };
    },
    update: () => ({ eq: async () => ({ error: null }), in: async () => ({ error: null }) }),
    delete: () => ({
      in: async (_column, ids) => { writes.push({ table, op: 'delete', ids }); return { error: null }; },
      eq: async () => { writes.push({ table, op: 'delete' }); return { error: null }; },
    }),
  });
  return { tables, writes, from };
}

describe('activity is permanent history in a Cloud company', () => {
  const COMPANY = '00000000-0000-0000-0000-00000000000a';
  const saved = {};
  let backend;

  beforeEach(() => {
    saved.from = supabase.from;
    saved.companyId = store.companyId;
    saved.demoMode = store.demoMode;
    saved.activity = store.cache.activity;
    backend = fakeBackend(COMPANY);
    supabase.from = backend.from;
    store.demoMode = false;
    store.companyId = COMPANY;
    store.cache.activity = [];
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.companyId = saved.companyId;
    store.demoMode = saved.demoMode;
    store.cache.activity = saved.activity;
  });

  const settle = () => new Promise(resolve => setImmediate(resolve));

  test('logActivity inserts just the new entry into activity_log', async () => {
    store.cache.activity = [{ id: 'act_old', text: 'already there' }];
    const entry = logActivity({ type: 'invoice_sent', text: 'Invoice INV-1 sent.', recordType: 'invoice', recordId: 'inv-1', user: 'Sam' });
    await settle();

    assert.deepEqual(backend.writes.map(w => [w.table, w.op, w.rows.length]), [['activity_log', 'insert', 1]]);
    const [row] = backend.writes[0].rows;
    assert.equal(row.id, entry.id);
    assert.equal(row.company_id, COMPANY);
    assert.equal(row.record_type, 'invoice');
    assert.equal(row.actor_name, 'Sam');
    assert.deepEqual(store.getAll('activity').map(a => a.id), ['act_old', entry.id]);
  });

  test('an entry survives a reload and shows up on a second client', async () => {
    // Device 1 records a lead stage change.
    const entry = logActivity({ id: 'act_stage_1', type: 'lead_stage_changed', text: 'Moved to Qualified.', recordType: 'lead', recordId: 'lead-7', user: 'Alex' });
    await settle();

    // Device 2 (or device 1 after a reload) starts with an empty cache and boots from the backend.
    store.clearSync();
    assert.deepEqual(store.getAll('activity'), []);
    store.companyId = COMPANY;
    await store.initializeCloudSync();

    const loaded = store.getAll('activity');
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, entry.id);
    assert.equal(loaded[0].text, 'Moved to Qualified.');
    assert.equal(loaded[0].user, 'Alex');
    // The keys LeadDetail filters the shared log on.
    assert.equal(loaded[0].leadId, 'lead-7');
    assert.equal(loaded[0].entityId, 'lead-7');
  });

  test('a whole-log save from a stale cache only appends, never deletes', async () => {
    backend.tables.activity_log = [
      activityToRow({ id: 'act_a', companyId: COMPANY, text: 'first' }),
      activityToRow({ id: 'act_b', companyId: COMPANY, text: 'second' }),
    ];
    store.cache.activity = [{ id: 'act_a', text: 'first' }, { id: 'act_b', text: 'second' }];

    // A writer that read an out-of-date log saves it back with one new entry.
    await store.save('activity', [{ id: 'act_a', text: 'first' }, { id: 'act_new', text: 'third', timestamp: '2026-10-20T00:00:00.000Z' }]);
    await settle();

    assert.equal(backend.writes.some(w => w.op === 'delete'), false);
    assert.equal(backend.writes.some(w => w.op === 'upsert'), false);
    assert.deepEqual(backend.writes.map(w => [w.table, w.op, w.rows.map(r => r.id)]), [['activity_log', 'insert', ['act_new']]]);
    assert.deepEqual(store.getAll('activity').map(a => a.id), ['act_a', 'act_b', 'act_new']);
    assert.deepEqual(backend.tables.activity_log.map(r => r.id), ['act_a', 'act_b', 'act_new']);
  });

  test('an empty save and a delete leave the history alone', async () => {
    store.cache.activity = [{ id: 'act_a', text: 'first' }];
    await store.save('activity', []);
    store.delete('activity', 'act_a');
    await settle();

    assert.deepEqual(backend.writes, []);
    assert.deepEqual(store.getAll('activity').map(a => a.id), ['act_a']);
  });
});

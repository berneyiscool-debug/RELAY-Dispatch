import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeJobHistory, newHistoryEvent } from './jobHistory.js';
import { jobEventFromRow, jobEventToRow } from './jobEventRecord.js';

const job = {
  id: 'job-1',
  historyLog: [
    { id: 'old-1', type: 'system', action: 'status_changed', date: '2026-10-01T00:00:00Z', content: 'Old status change' },
  ],
  activityLog: [
    { id: 'old-sys', type: 'system', action: 'task_completed', date: '2026-10-02T00:00:00Z', content: 'Early system entry' },
    { id: 'note-1', type: 'combined', date: '2026-10-03T00:00:00Z', content: 'A staff note' },
  ],
};

test('merges new events with both legacy places, newest first', () => {
  const events = [
    { id: 'ev-1', jobId: 'job-1', kind: 'history', date: '2026-10-05T00:00:00Z', content: 'New' },
    { id: 'ev-other-job', jobId: 'job-2', kind: 'history', date: '2026-10-06T00:00:00Z', content: 'Elsewhere' },
    { id: 'ev-comms', jobId: 'job-1', kind: 'comms', date: '2026-10-07T00:00:00Z', content: 'Not history' },
  ];
  assert.deepEqual(mergeJobHistory(job, events).map(e => e.id), ['ev-1', 'old-sys', 'old-1']);
});

test('leaves staff notes out of the history', () => {
  assert.ok(!mergeJobHistory(job, []).some(e => e.id === 'note-1'));
});

test('an entry present in both places shows once', () => {
  const events = [{ id: 'old-1', jobId: 'job-1', kind: 'history', date: '2026-10-01T00:00:00Z', content: 'Old status change' }];
  assert.deepEqual(mergeJobHistory(job, events).map(e => e.id), ['old-sys', 'old-1']);
});

test('copes with a job that has no logs and with bad dates', () => {
  assert.deepEqual(mergeJobHistory({ id: 'empty' }, []), []);
  assert.deepEqual(mergeJobHistory(null, []), []);
  const events = [
    { id: 'a', jobId: 'x', date: 'not a date' },
    { id: 'b', jobId: 'x', date: '2026-10-01T00:00:00Z' },
  ];
  assert.deepEqual(mergeJobHistory({ id: 'x' }, events).map(e => e.id), ['b', 'a']);
});

test('does not change the job it reads', () => {
  const copy = JSON.parse(JSON.stringify(job));
  mergeJobHistory(job, [{ id: 'ev-1', jobId: 'job-1', date: '2026-10-05T00:00:00Z' }]);
  assert.deepEqual(job, copy);
});

test('a new event round-trips through the row mapping unchanged', () => {
  const entry = {
    ...newHistoryEvent({
      id: 'ev-9',
      jobId: 'job-1',
      action: 'status_changed',
      content: 'Job status changed from "Scheduled" to "In Progress"',
      author: 'Sam Carter',
      payload: { from: 'Scheduled', to: 'In Progress' },
      date: '2026-10-30T02:00:00.000Z',
    }),
    companyId: 'co-1',
  };
  const row = jobEventToRow(entry);
  assert.deepEqual(row, {
    id: 'ev-9',
    job_id: 'job-1',
    kind: 'history',
    action: 'status_changed',
    content: 'Job status changed from "Scheduled" to "In Progress"',
    payload: { from: 'Scheduled', to: 'In Progress' },
    actor_name: 'Sam Carter',
    occurred_at: '2026-10-30T02:00:00.000Z',
    company_id: 'co-1',
  });
  const back = jobEventFromRow({ ...row, actor_id: 'u-1', created_at: '2026-10-30T02:00:01.000Z' });
  assert.equal(back.content, entry.content);
  assert.equal(back.author, 'Sam Carter');
  assert.equal(back.date, entry.date);
  assert.equal(back.type, 'system');
  assert.deepEqual(back.payload, entry.payload);
  assert.equal(back.actorId, 'u-1');
});

test('a malformed payload is sent as an empty object', () => {
  assert.deepEqual(jobEventToRow({ id: 'x', jobId: 'j', payload: [1, 2] }).payload, {});
  assert.deepEqual(jobEventToRow({ id: 'x', jobId: 'j', payload: 'text' }).payload, {});
});

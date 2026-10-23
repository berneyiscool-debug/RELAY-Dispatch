import { test, describe } from 'node:test';
import assert from 'node:assert';
import { jobActivityDate, jobsForAsset } from './assetJobs.js';

describe('Asset → job link', () => {
  test('returns only the jobs pointing at that asset', () => {
    const jobs = [
      { id: 'j1', assetId: 'a1' },
      { id: 'j2', assetId: 'a2' },
      { id: 'j3' },
      { id: 'j4', assetId: 'a1' },
    ];
    assert.deepStrictEqual(
      jobsForAsset(jobs, 'a1').map(j => j.id),
      ['j1', 'j4'],
    );
  });

  test('sorts newest first by scheduled date, falling back to creation', () => {
    const jobs = [
      { id: 'old', assetId: 'a1', scheduledDate: '2026-01-10' },
      { id: 'unscheduled', assetId: 'a1', createdAt: '2026-03-01T00:00:00Z' },
      { id: 'new', assetId: 'a1', scheduledDate: '2026-06-20' },
    ];
    assert.deepStrictEqual(
      jobsForAsset(jobs, 'a1').map(j => j.id),
      ['new', 'unscheduled', 'old'],
    );
  });

  test('jobs with no usable date sort last instead of breaking the order', () => {
    const jobs = [
      { id: 'undated', assetId: 'a1' },
      { id: 'dated', assetId: 'a1', scheduledDate: '2026-02-02' },
      { id: 'bogus', assetId: 'a1', scheduledDate: 'not-a-date' },
    ];
    assert.deepStrictEqual(
      jobsForAsset(jobs, 'a1').map(j => j.id),
      ['dated', 'undated', 'bogus'],
    );
  });

  test('an asset with nothing linked gets an empty list', () => {
    assert.deepStrictEqual(jobsForAsset([{ id: 'j1', assetId: 'a1' }], 'a2'), []);
  });

  test('tolerates a missing collection or asset id', () => {
    assert.deepStrictEqual(jobsForAsset(null, 'a1'), []);
    assert.deepStrictEqual(jobsForAsset(undefined, 'a1'), []);
    assert.deepStrictEqual(jobsForAsset([{ id: 'j1', assetId: 'a1' }], ''), []);
    assert.deepStrictEqual(jobsForAsset([{ id: 'j1', assetId: 'a1' }], null), []);
  });

  test('does not reorder the caller’s array', () => {
    const jobs = [
      { id: 'a', assetId: 'a1', scheduledDate: '2026-01-01' },
      { id: 'b', assetId: 'a1', scheduledDate: '2026-05-01' },
    ];
    jobsForAsset(jobs, 'a1');
    assert.deepStrictEqual(jobs.map(j => j.id), ['a', 'b']);
  });

  test('reads a date from scheduledDate, then createdAt, then updatedAt', () => {
    assert.strictEqual(jobActivityDate({ scheduledDate: '2026-01-02' }), Date.parse('2026-01-02'));
    assert.strictEqual(jobActivityDate({ createdAt: '2026-01-03T00:00:00Z' }), Date.parse('2026-01-03T00:00:00Z'));
    assert.strictEqual(jobActivityDate({ updatedAt: '2026-01-04T00:00:00Z' }), Date.parse('2026-01-04T00:00:00Z'));
    assert.strictEqual(jobActivityDate({}), 0);
    assert.strictEqual(jobActivityDate(null), 0);
  });
});

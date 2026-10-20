import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadOnboardingState, saveOnboardingState, workflowProgress, coachFor, parseRoute,
  DEFAULT_STATE, PAGES_TOUR, SETTINGS_TOUR,
} from './onboarding.js';

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
}

const user = { id: 'u1' };

test('state defaults, persists per user and merges patches', () => {
  const s = memoryStorage();
  assert.deepEqual(loadOnboardingState(user, s), { ...DEFAULT_STATE });
  saveOnboardingState(user, { guideActive: true }, s);
  saveOnboardingState(user, { tourDone: true }, s);
  const st = loadOnboardingState(user, s);
  assert.equal(st.guideActive, true);
  assert.equal(st.tourDone, true);
  assert.equal(loadOnboardingState({ id: 'other' }, s).guideActive, false);
});

test('the old checklist dismissal carries over as dismissed', () => {
  const s = memoryStorage({ relay_setup_checklist_dismissed_u1: '1' });
  assert.equal(loadOnboardingState(user, s).dismissed, true);
});

test('dismissed survives as forever', () => {
  const s = memoryStorage();
  saveOnboardingState(user, { dismissed: true }, s);
  assert.equal(loadOnboardingState(user, s).dismissed, true);
});

test('unreadable storage falls back to defaults', () => {
  const s = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(loadOnboardingState(user, s), { ...DEFAULT_STATE });
  assert.doesNotThrow(() => saveOnboardingState(user, { dismissed: true }, s));
});

test('workflow progress walks customer → quote → job → invoice', () => {
  let p = workflowProgress({});
  assert.equal(p.current.key, 'customer');
  assert.equal(p.done, 0);

  p = workflowProgress({ customers: [{}], quotes: [{}] });
  assert.equal(p.current.key, 'job');
  assert.equal(p.done, 2);

  p = workflowProgress({ customers: [{}], quotes: [{}], jobs: [{}], invoices: [{}] });
  assert.equal(p.complete, true);
  assert.equal(p.current, null);
});

test('parseRoute splits base, id and drops the query', () => {
  assert.deepEqual(parseRoute('/quotes/abc?tab=overview'), { base: 'quotes', id: 'abc' });
  assert.deepEqual(parseRoute('/'), { base: '', id: null });
});

test('customer coach points at the right control on each page', () => {
  assert.equal(coachFor('customer', '/people', {}).target, '#btn-new-person');
  assert.equal(coachFor('customer', '/people/new', {}).target, '#btn-save');
  assert.equal(coachFor('customer', '/', {}).action.path, '/people/new');
});

test('job coach follows the quote status', () => {
  const quotes = [
    { id: 'q1', status: 'Draft', createdAt: '2026-01-01' },
    { id: 'q2', status: 'Accepted', createdAt: '2026-02-01' },
  ];
  assert.equal(coachFor('job', '/quotes/q1', { quotes }).target, '#btn-sign-approve-modal');
  assert.equal(coachFor('job', '/quotes/q2', { quotes }).target, '#btn-convert-job');
  // Elsewhere it offers the newest quote.
  assert.equal(coachFor('job', '/', { quotes }).action.path, '/quotes/q2');
  assert.equal(coachFor('job', '/', { quotes: [] }).action.path, '/jobs/new');
});

test('invoice coach asks for completion before Generate Invoice', () => {
  const jobs = [{ id: 'j1', status: 'Scheduled' }, { id: 'j2', status: 'Completed' }];
  assert.equal(coachFor('invoice', '/jobs/j1', { jobs }).target, '#header-job-status-select');
  assert.equal(coachFor('invoice', '/jobs/j2?tab=overview', { jobs }).target, '#btn-header-generate-invoice');
});

test('tours are well formed', () => {
  PAGES_TOUR.forEach(s => {
    assert.ok(s.title && s.text && s.target, s.title);
  });
  SETTINGS_TOUR.forEach(s => {
    assert.ok(s.path.startsWith('/settings?tab='), s.title);
    s.points.forEach(p => assert.ok(p.tab && p.label && p.note, p.label));
  });
});

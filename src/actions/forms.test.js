/**
 * Scan to form: a photo of a hand-filled JSA uploaded to a job becomes a draft
 * formInstance for review. The model and the image pipeline are stubbed — what
 * is under test is which upload and template are picked, how the reading lands
 * on the record, and that nothing is ever marked Completed.
 *
 * Runs against the demo business, as in `jobs.test.js`.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import { jobScans, setFormScanDeps } from './forms.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const PHOTO = 'data:image/jpeg;base64,/9j/AAAA';

const JSA_READING = {
  code: 'RELAY-FORM:demo_ft_jsa_swms',
  title: 'Job Safety Analysis (JSA) / SWMS',
  fields: [
    { fieldId: 'f_jsa_job', value: 'Switchboard upgrade', confidence: 'high' },
    { fieldId: 'f_jsa_date', value: '19/10/2026', confidence: 'high' },
    { fieldId: 'f_jsa_supervisor', value: 'Dave K', confidence: 'medium' },
    { fieldId: 'f_jsa_haz_elec', value: 'ticked', confidence: 'high' },
    { fieldId: 'f_jsa_haz_fall', value: 'blank', confidence: 'high' },
    { fieldId: 'f_jsa_control_desc', value: 'Isolate', confidence: 'low' },
  ],
};

describe('fill_form_from_scan', () => {
  const saved = {};
  let job;
  let calls;
  let restore;

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });

    job = store.getAll('jobs')[0];
    store.update('jobs', job.id, {
      activityLog: [
        { id: 'e2', type: 'combined', date: '2026-10-19T03:00:00Z', content: '', files: [{ name: 'jsa-photo.jpg', type: 'image/jpeg', size: 10, data: PHOTO }] },
        { id: 'e1', type: 'combined', date: '2026-10-18T03:00:00Z', content: 'quote', files: [{ name: 'quote.docx', type: 'application/msword', size: 10, data: 'data:application/msword;base64,AA' }] },
      ],
    });
    job = store.getById('jobs', job.id);
    store.save('formInstances', (store.getAll('formInstances') || []).filter((fi) => fi.jobId !== job.id));

    calls = [];
    restore = setFormScanDeps({
      scanImages: async (scan) => { calls.push(['images', scan.name]); return [scan.data]; },
      readScan: async ({ tool }) => {
        calls.push(['read', tool.name]);
        return tool.name === 'identify_form' ? { code: JSA_READING.code, title: JSA_READING.title, isForm: true } : JSA_READING;
      },
    });
  });

  afterEach(() => {
    restore();
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('lists only photos and PDFs, newest first', () => {
    const scans = jobScans(job);
    assert.deepEqual(scans.map((s) => s.name), ['jsa-photo.jpg']);
    assert.equal(scans[0].key, 'e2:0');
  });

  test('detects the JSA from the sheet and saves a reviewable draft', async () => {
    const out = await executeAction('fill_form_from_scan', { job: job.id }, CTX);
    const { result } = out;
    assert.deepEqual(calls.map((c) => c[1]), ['jsa-photo.jpg', 'identify_form', 'record_form_responses']);
    assert.equal(result.template.id, 'demo_ft_jsa_swms');
    assert.equal(result.detectedBy, 'code');

    const fi = store.getById('formInstances', result.formInstance.id);
    assert.equal(fi.status, 'Pending', 'never completed by brny');
    assert.equal(fi.jobId, job.id);
    assert.equal(fi.responses.f_jsa_date, '2026-10-19');
    assert.equal(fi.responses.f_jsa_haz_elec, true);
    assert.equal(fi.responses.f_jsa_haz_fall, false);
    assert.ok(!('f_jsa_control_desc' in fi.responses), 'low confidence is not written');
    assert.equal(fi.scan.flags.f_jsa_control_desc.level, 'uncertain');
    assert.equal(fi.scan.flags.f_jsa_supervisor.level, 'check');
    assert.equal(fi.scan.fileName, 'jsa-photo.jpg');
    assert.ok(result.flagged.some((f) => f.label === 'Detailed Control Measures'));
    assert.match(out.summary, /Saved as a draft/);
    assert.equal(out.artifacts[0].path, `/jobs/${job.id}?tab=forms&review=${fi.id}`);
  });

  test('a named form skips detection and updates the attached draft in place', async () => {
    store.save('formInstances', [...store.getAll('formInstances'), {
      id: 'fi_existing', jobId: job.id, templateId: 'demo_ft_jsa_swms', status: 'Pending', responses: { f_jsa_company: 'Typed Pty Ltd' },
    }]);
    const { result } = await executeAction('fill_form_from_scan', { job: job.id, form: 'JSA', attachment: 'jsa-photo' }, CTX);
    assert.ok(!calls.some((c) => c[1] === 'identify_form'));
    assert.equal(result.formInstance.id, 'fi_existing');
    assert.equal(result.created, false);
    const fi = store.getById('formInstances', 'fi_existing');
    assert.equal(fi.responses.f_jsa_company, 'Typed Pty Ltd', 'typed answer kept');
    assert.equal(fi.responses.f_jsa_job, 'Switchboard upgrade');
  });

  test('refuses to touch a completed form', async () => {
    store.save('formInstances', [...store.getAll('formInstances'), {
      id: 'fi_done', jobId: job.id, templateId: 'demo_ft_jsa_swms', status: 'Completed', responses: { f_jsa_job: 'Signed off' },
    }]);
    await assert.rejects(
      executeAction('fill_form_from_scan', { job: job.id, form: 'JSA' }, CTX),
      (err) => err.code === ERROR_CODES.CONFLICT
    );
    assert.equal(store.getById('formInstances', 'fi_done').responses.f_jsa_job, 'Signed off');
  });

  test('an unrecognised sheet asks which form it is', async () => {
    restore();
    restore = setFormScanDeps({
      scanImages: async (scan) => [scan.data],
      readScan: async () => ({ title: 'Pool chemical log', isForm: true }),
    });
    await assert.rejects(
      executeAction('fill_form_from_scan', { job: job.id }, CTX),
      (err) => err.code === ERROR_CODES.AMBIGUOUS && err.details.options.length > 0
    );
  });

  test('a job with no photo or PDF says so', async () => {
    store.update('jobs', job.id, { activityLog: [] });
    await assert.rejects(
      executeAction('fill_form_from_scan', { job: job.id }, CTX),
      (err) => err.code === ERROR_CODES.NOT_FOUND
    );
  });
});

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../../data/demoDataset.js';
import { buildReport, emptyFilters } from '../../utils/reportMetrics.js';
import { buildReportPdf, pdfText } from '../../utils/reportPdf.js';
import { REPORTS, reportSpec, selectBlocks } from './reportSpec.js';

const now = new Date(2026, 9, 8, 10, 0);
const data = buildDemoDataset({ now }).collections;
const r = buildReport(data, emptyFilters(), { now });
const specs = REPORTS.map(rep => reportSpec(rep.id, r, { companyName: 'Harbourline' }));

describe('report content', () => {
  test('every report has insights plus at least one block of figures', () => {
    specs.forEach(s => {
      assert.equal(s.blocks[0].kind, 'insights', s.id);
      assert.ok(s.blocks.length > 1, s.id);
    });
  });
  test('block keys are unique within a report', () => {
    specs.forEach(s => assert.equal(new Set(s.blocks.map(b => b.key)).size, s.blocks.length, s.id));
  });
  test('table rows match their columns', () => {
    specs.forEach(s => s.blocks.filter(b => b.kind === 'table').forEach(b =>
      b.rows.forEach(row => assert.equal(row.length, b.columns.length, `${s.id}/${b.key}`))));
  });
  test('the figures are the report’s own numbers', () => {
    const overview = specs.find(s => s.id === 'overview');
    const revenue = overview.blocks.find(b => b.key === 'headline').items[0];
    assert.equal(revenue.label, 'Revenue (ex GST)');
    assert.ok(revenue.value.startsWith('$'));
    const costing = specs.find(s => s.id === 'job_costing').blocks.find(b => b.key === 'jobs');
    assert.equal(costing.rows.length, r.profit.jobs.length);
  });
  test('cached insights are used when given', () => {
    const s = reportSpec('overview', r, { insights: { items: [{ headline: 'From the panel' }], source: 'live' } });
    assert.equal(s.blocks[0].title, 'RELAY AI Insights');
    assert.equal(s.blocks[0].items[0].headline, 'From the panel');
  });
});

describe('selection', () => {
  test('keeps only the chosen blocks and drops empty reports', () => {
    const out = selectBlocks(specs, { revenue: new Set(['by-month', 'monthly']), jobs: new Set() });
    assert.equal(out.length, 1);
    assert.deepEqual(out[0].blocks.map(b => b.key), ['by-month', 'monthly']);
  });
});

describe('PDF', () => {
  test('text outside Latin-1 is made safe', () => {
    assert.equal(pdfText('A – B → C’s “x”'), 'A - B -> C\'s "x"');
    assert.equal(pdfText('日本'), '??');
  });

  test('builds a multi-page PDF of everything, with page numbers', async () => {
    const { doc, filename, pages } = await buildReportPdf({
      company: 'Harbourline Electrical', rangeLabel: '1 Jul 2026 – 8 Oct 2026', filterLines: ['Technician: Mick'],
      sections: specs, generatedAt: now,
    });
    const raw = doc.output();
    assert.ok(raw.startsWith('%PDF-'));
    assert.ok(pages > 3, `pages: ${pages}`);
    assert.equal(filename, 'Harbourline_Electrical_report_2026-10-08.pdf');
  });

  test('one chosen table gives a short PDF named after its report', async () => {
    const sections = selectBlocks(specs, { customers: new Set(['top']) });
    const { pages, filename, doc } = await buildReportPdf({ company: 'Harbourline', sections, generatedAt: now });
    assert.equal(pages, 1);
    assert.equal(filename, 'Harbourline_Customer_Analysis_2026-10-08.pdf');
    assert.equal(doc.getNumberOfPages(), 1);
  });
});

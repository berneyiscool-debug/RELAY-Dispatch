import { test, describe } from 'node:test';
import assert from 'node:assert';
import { computeContributions, deriveRegionBucket, CONTRIB_SCHEMA_VERSION } from './contribMetrics.js';

// A fixture seeded with OBVIOUS PII. The firewall test asserts none of these
// strings can appear in the contributed payload.
const PII = {
  companyName: 'Apex Power Services',
  custCompany: 'Starlight Logistics Pty Ltd',
  custEmail: 'd.carter@starlight-logistics.example.com',
  custPhone: '02 5550 0110',
  street: '14 Industrial Lane',
  techName: 'Adam West',
  note: 'Access via back gate PIN 4910#',
};

const collections = {
  settings: {
    name: PII.companyName,
    address: `100 Fictional Plaza, Dubbo NSW 2830`,
    laborRates: [
      { id: 'r1', name: 'Standard Rate', rate: 145, minCallOutFee: 0, isDefault: true },
      { id: 'r2', name: 'After Hours Rate', rate: 217.5, minCallOutFee: 50 },
      { id: 'r3', name: 'Emergency Rate', rate: 290, minCallOutFee: 120 },
    ],
  },
  costCenters: [
    { id: 'cc_electrical', code: 'ELEC', name: 'Electrical Services' },
    { id: 'cc_solar', code: 'SOLAR', name: 'Solar Installations' },
  ],
  customers: [
    { id: 'cust_1', company: PII.custCompany, email: PII.custEmail, phone: PII.custPhone,
      address: `${PII.street}, Dubbo NSW 2830` },
  ],
  jobs: [
    { id: 'job_1', customerId: 'cust_1', costCenterId: 'cc_electrical', quoteId: 'q_1',
      updatedAt: '2026-05-10T10:00:00Z', createdAt: '2026-05-01T10:00:00Z',
      notes: PII.note,
      technicians: [{ id: 'tech_1', name: PII.techName }],
      materials: [{ name: 'ATS Control Board', cost: 420, price: 680, qty: 1 }],
      labor: [{ hours: 4 }], actualHours: 5 },
    { id: 'job_2', customerId: 'cust_1', costCenterId: 'cc_solar', quoteId: 'q_2',
      updatedAt: '2026-05-12T10:00:00Z', createdAt: '2026-05-02T10:00:00Z',
      materials: [{ name: 'Battery', cost: 185, price: 280, qty: 2 }],
      labor: [{ hours: 5 }] },
  ],
  quotes: [
    { id: 'q_1', total: 3300, status: 'Accepted', createdAt: '2026-05-01T10:00:00Z' },
    { id: 'q_2', total: 1200, status: 'New', createdAt: '2026-05-02T10:00:00Z' },
  ],
  invoices: [
    { id: 'inv_1', jobId: 'job_1', total: 3300, paymentReceivedDate: '2026-05-15T10:00:00Z' },
  ],
};

const ctx = { installId: 'inst_test_abc', source: 'local', country: 'AU', period: '2026-05' };

describe('contribMetrics: PII firewall', () => {
  test('no PII string leaks into the contributed payload', () => {
    const rows = computeContributions(collections, ctx);
    const blob = JSON.stringify(rows);
    for (const [label, value] of Object.entries(PII)) {
      assert.ok(!blob.includes(value), `PII leaked (${label}): "${value}" found in payload`);
    }
    // also assert no street/email/phone fragments sneak through
    assert.ok(!blob.includes('@'), 'an email fragment leaked into payload');
    assert.ok(!/\bLane\b|\bPlaza\b|\bStreet\b/.test(blob), 'a street-name fragment leaked');
  });

  test('rows only contain the allowed keys', () => {
    const rows = computeContributions(collections, ctx);
    const allowed = new Set([
      'install_id', 'source', 'schema_version', 'metric_key', 'trade',
      'region_bucket', 'period', 'country', 'value_count', 'value_median',
      'value_p25', 'value_p75', 'value_sum',
    ]);
    for (const row of rows) {
      for (const k of Object.keys(row)) {
        assert.ok(allowed.has(k), `disallowed key in row: ${k}`);
      }
    }
  });
});

describe('contribMetrics: correctness', () => {
  test('produces rows carrying context + schema version', () => {
    const rows = computeContributions(collections, ctx);
    assert.ok(rows.length > 0, 'expected some metric rows');
    for (const r of rows) {
      assert.strictEqual(r.install_id, 'inst_test_abc');
      assert.strictEqual(r.source, 'local');
      assert.strictEqual(r.country, 'AU');
      assert.strictEqual(r.schema_version, CONTRIB_SCHEMA_VERSION);
    }
  });

  test('labor rates are classified into the expected metric keys', () => {
    const rows = computeContributions(collections, ctx);
    const keys = new Set(rows.map((r) => r.metric_key));
    assert.ok(keys.has('labor_rate.standard'));
    assert.ok(keys.has('labor_rate.afterhours'));
    assert.ok(keys.has('labor_rate.emergency'));
    const std = rows.find((r) => r.metric_key === 'labor_rate.standard');
    assert.strictEqual(std.value_median, 145);
    assert.strictEqual(std.region_bucket, '2830'); // postcode bucket, not the street
  });

  test('win rate reflects accepted / total quotes', () => {
    const rows = computeContributions(collections, ctx);
    const wr = rows.find((r) => r.metric_key === 'quote.win_rate');
    assert.ok(wr, 'expected a quote.win_rate row');
    assert.strictEqual(wr.value_median, 0.5); // 1 accepted of 2
  });

  test('material margin and duration delta compute from cost/price and hours', () => {
    const rows = computeContributions(collections, ctx);
    const margin = rows.find((r) => r.metric_key === 'material.margin_pct');
    assert.ok(margin, 'expected a material.margin_pct row');
    const delta = rows.find((r) => r.metric_key === 'job.duration_delta_pct');
    assert.ok(delta, 'expected a job.duration_delta_pct row (job_1 has actualHours)');
    assert.strictEqual(delta.value_median, 25); // (5-4)/4 = 25%
  });

  test('job counts are emitted per trade+region+period', () => {
    const rows = computeContributions(collections, ctx);
    const counts = rows.filter((r) => r.metric_key === 'job.count');
    assert.ok(counts.length >= 1);
    const totalJobs = counts.reduce((s, r) => s + r.value_count, 0);
    assert.strictEqual(totalJobs, 2);
  });
});

describe('contribMetrics: deriveRegionBucket', () => {
  test('extracts AU postcode and drops the rest of the address', () => {
    assert.strictEqual(deriveRegionBucket('14 Industrial Lane, Dubbo NSW 2830'), '2830');
    assert.strictEqual(deriveRegionBucket('no postcode here'), null);
    assert.strictEqual(deriveRegionBucket(null), null);
  });
});

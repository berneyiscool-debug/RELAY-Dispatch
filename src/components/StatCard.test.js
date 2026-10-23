import { test, describe } from 'node:test';
import assert from 'node:assert';
import { statCard } from './StatCard.js';

describe('Stat card', () => {
  test('renders the app’s KPI shape: label, chip, value, context line', () => {
    const html = statCard({
      label: 'Gross profit & margin',
      value: '$123.45',
      icon: 'trending_up',
      tone: 'success',
      sub: '<span class="badge badge-success">40.0% margin</span>',
    });

    assert.match(html, /class="stat-card"/);
    assert.match(html, /<div class="stat-label">Gross profit &amp; margin<\/div>/);
    assert.match(html, /class="stat-icon green"/);
    assert.match(html, />trending_up</);
    assert.match(html, /class="stat-value is-compact">\$123.45</);
    assert.match(html, /<div class="stat-sub"><span class="badge badge-success">40.0% margin<\/span><\/div>/);
  });

  test('never reintroduces the old hand-rolled scorecard chrome', () => {
    const html = statCard({ label: 'Total', value: '$1.00', icon: 'payments', tone: 'warning' });
    assert.ok(!html.includes('border-left'), 'no coloured left bar');
    assert.ok(!html.includes('font-size:2'), 'no inline font sizing');
    assert.ok(!html.includes('text-align:center'), 'not a centred scorecard');
  });

  test('escapes the label and value', () => {
    const html = statCard({ label: '<b>label</b>', value: '<img src=x onerror=alert(1)>' });
    assert.ok(!html.includes('<b>label</b>'));
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;b&gt;label&lt;/b&gt;'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  });

  test('keeps caller-supplied context markup (badges, emphasis)', () => {
    const html = statCard({ label: 'Profit', value: '$5', sub: '<strong>paid</strong>' });
    assert.match(html, /<strong>paid<\/strong>/);
  });

  test('falls back to a dash for a missing value and omits an empty context line', () => {
    const html = statCard({ label: 'Nothing yet', value: null });
    assert.match(html, /class="stat-value is-compact">—</);
    assert.ok(!html.includes('stat-sub'));
    assert.ok(!html.includes('stat-icon'));
  });

  test('maps tones onto the existing icon chip variants', () => {
    const chip = (tone) => (statCard({ label: 'L', value: '1', icon: 'info', tone }).match(/stat-icon (\w+)/) || [])[1];
    assert.strictEqual(chip('primary'), 'blue');
    assert.strictEqual(chip('blue'), 'blue');
    assert.strictEqual(chip('success'), 'green');
    assert.strictEqual(chip('green'), 'green');
    assert.strictEqual(chip('warning'), 'orange');
    assert.strictEqual(chip('danger'), 'red');
    assert.strictEqual(chip('neutral'), 'neutral');
    assert.strictEqual(chip('nonsense'), 'neutral');
  });

  test('an alert value is painted danger', () => {
    assert.match(statCard({ label: 'Profit', value: '-$10.00', valueTone: 'alert' }), /class="stat-value is-compact is-alert"/);
    assert.match(statCard({ label: 'Profit', value: '$10.00' }), /class="stat-value is-compact"/);
  });
});

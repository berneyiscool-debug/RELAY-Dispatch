import { test, describe } from 'node:test';
import assert from 'node:assert';

const {
  HOURS_SOURCE,
  hoursSourceLabel,
  bookedHours,
  bookedHoursByJob,
  bookedHoursForJob,
  hoursSourceTotals,
  jobsWithoutBookedHours,
  defaultLabourRate,
  bookedLabourLine,
  hoursSourceError,
  hoursSourceCardHtml,
  readHoursSource,
  setHoursSourceError
} = await import('./invoiceLabour.js');

const rowsFor = (jobId, estimatedHours, bookedHours, jobNumber = '', jobTitle = 'Job') => ({
  jobId,
  estimatedHours,
  bookedHours,
  jobNumber,
  jobTitle
});

describe('bookedHours', () => {
  test('reads hours, then the legacy duration columns', () => {
    assert.strictEqual(bookedHours({ hours: '7.5' }), 7.5);
    assert.strictEqual(bookedHours({ durationHours: 3 }), 3);
    assert.strictEqual(bookedHours({ duration_hours: '2.25' }), 2.25);
  });

  test('treats missing and unparseable hours as zero', () => {
    assert.strictEqual(bookedHours({}), 0);
    assert.strictEqual(bookedHours(null), 0);
    assert.strictEqual(bookedHours({ hours: 'two' }), 0);
  });
});

describe('bookedHoursByJob', () => {
  test('sums every timesheet against its job regardless of id type', () => {
    const byJob = bookedHoursByJob([
      { jobId: 12, hours: 2 },
      { jobId: '12', hours: 3.5 },
      { jobId: 13, durationHours: 1 },
      { hours: 4 }, // no job — ignored
      { jobId: 14 } // no hours — counted as zero
    ]);

    assert.strictEqual(byJob.get('12'), 5.5);
    assert.strictEqual(byJob.get('13'), 1);
    assert.strictEqual(byJob.get('14'), 0);
    assert.strictEqual(byJob.size, 3);
  });

  test('looks a job up from the map with the same tolerances', () => {
    const byJob = bookedHoursByJob([{ jobId: 12, hours: 5 }]);

    assert.strictEqual(bookedHoursForJob(byJob, 12), 5);
    assert.strictEqual(bookedHoursForJob(byJob, '12'), 5);
    assert.strictEqual(bookedHoursForJob(byJob, 99), 0);
    assert.strictEqual(bookedHoursForJob(null, 12), 0);
  });
});

describe('hoursSourceTotals', () => {
  test('sums the estimate and booked columns', () => {
    const totals = hoursSourceTotals([
      rowsFor(1, 10, 7.25),
      rowsFor(2, '2.5', '0.75')
    ]);

    assert.strictEqual(totals.estimated, 12.5);
    assert.strictEqual(totals.booked, 8);
  });

  test('is zero for no rows', () => {
    assert.deepStrictEqual(hoursSourceTotals(), { estimated: 0, booked: 0 });
  });
});

describe('jobsWithoutBookedHours', () => {
  test('reports only the rows with no booked time', () => {
    const missing = jobsWithoutBookedHours([
      rowsFor(1, 4, 0),
      rowsFor(2, 4, 1.5),
      rowsFor(3, 4, undefined)
    ]);

    assert.deepStrictEqual(missing.map(r => r.jobId), [1, 3]);
  });
});

describe('defaultLabourRate', () => {
  test('prefers the profile flagged as default', () => {
    const { rate, name } = defaultLabourRate({
      laborRates: [{ rate: 100, name: 'Standard' }, { rate: 145, name: 'Premium', isDefault: true }]
    });

    assert.strictEqual(rate, 145);
    assert.strictEqual(name, 'Premium');
  });

  test('falls back to the first profile, then to the built-in rate', () => {
    assert.deepStrictEqual(defaultLabourRate({ laborRates: [{ rate: 120, name: 'Callout' }] }), { rate: 120, name: 'Callout' });
    assert.deepStrictEqual(defaultLabourRate({}), { rate: 85, name: 'Labour' });
    assert.deepStrictEqual(defaultLabourRate(), { rate: 85, name: 'Labour' });
  });

  test('keeps an explicit zero rate rather than inventing one', () => {
    assert.deepStrictEqual(defaultLabourRate({ laborRates: [{ rate: 0, name: 'Warranty' }] }), { rate: 0, name: 'Warranty' });
  });
});

describe('bookedLabourLine', () => {
  test('builds the same line shape as the estimated pricing', () => {
    const line = bookedLabourLine({ hours: 5.5, rate: 145, rateName: 'Premium', makeId: () => 'line_1' });

    assert.deepStrictEqual(line, {
      id: 'line_1',
      description: 'Premium (5.50 hrs)',
      type: 'labor',
      qty: 5.5,
      rate: 145,
      total: 797.5
    });
  });

  test('returns nothing when there are no hours to bill', () => {
    assert.strictEqual(bookedLabourLine({ hours: 0, rate: 145, rateName: 'Premium', makeId: () => 'line_1' }), null);
  });
});

describe('hoursSourceError', () => {
  test('is silent for estimates and for booked hours that exist', () => {
    assert.strictEqual(hoursSourceError(HOURS_SOURCE.ESTIMATED, [rowsFor(1, 4, 0)]), '');
    assert.strictEqual(hoursSourceError(HOURS_SOURCE.BOOKED, [rowsFor(1, 4, 2)]), '');
  });

  test('names the jobs with no booked hours', () => {
    const message = hoursSourceError(HOURS_SOURCE.BOOKED, [
      rowsFor(1, 4, 0, '1001', 'Boiler Swap'),
      rowsFor(2, 4, 3, '1002', 'Leak Repair'),
      rowsFor(3, 4, 0, '', '')
    ]);

    assert.match(message, /#1001 Boiler Swap/);
    assert.match(message, /Job 3/);
    assert.doesNotMatch(message, /Leak Repair/);
  });
});

describe('hoursSourceCardHtml', () => {
  const rows = [rowsFor(1, 10, 6, '10', 'Boiler Swap'), rowsFor(2, 2, 0, '20', 'Leak Repair')];
  const inputFor = (html, value) => html.match(new RegExp(`<input[^>]*value="${value}"[^>]*>`))[0];

  test('offers both sources and checks the selected one', () => {
    const estimated = hoursSourceCardHtml({ rows, rate: 100 });
    assert.strictEqual(inputFor(estimated, 'estimated').includes('checked'), true);
    assert.strictEqual(inputFor(estimated, 'booked').includes('checked'), false);

    const booked = hoursSourceCardHtml({ rows, rate: 100, selected: HOURS_SOURCE.BOOKED });
    assert.strictEqual(inputFor(booked, 'booked').includes('checked'), true);
    assert.strictEqual(inputFor(booked, 'estimated').includes('checked'), false);

    assert.match(booked, /name="hours-source"/);
  });

  test('quotes each source with its hours and priced total', () => {
    const html = hoursSourceCardHtml({ rows, rate: 100 });

    assert.match(html, /Tasklist estimates — 12\.00 hrs = \$1200\.00/);
    assert.match(html, /Recorded timesheets — 6\.00 hrs = \$600\.00/);
  });

  test('omits money when no rate is available and warns about missing time', () => {
    const html = hoursSourceCardHtml({ rows });

    assert.doesNotMatch(html, /\$/);
    assert.match(html, /No booked hours recorded for #20 Leak Repair/);
    assert.match(html, /class="hours-source-error"/);
  });

  test('has no warning when every job has booked time', () => {
    const html = hoursSourceCardHtml({ rows: [rowsFor(1, 10, 6, '10', 'Boiler Swap')] });

    assert.doesNotMatch(html, /No booked hours recorded for/);
  });
});

describe('readHoursSource / setHoursSourceError', () => {
  const rootFor = (value, errorEl) => ({
    querySelector: (selector) => {
      if (selector.includes('hours-source') && selector.includes(':checked')) {
        return value ? { value } : null;
      }
      return errorEl || null;
    }
  });

  test('reads the checked radio, defaulting to estimates', () => {
    assert.strictEqual(readHoursSource(rootFor('booked')), HOURS_SOURCE.BOOKED);
    assert.strictEqual(readHoursSource(rootFor('estimated')), HOURS_SOURCE.ESTIMATED);
    assert.strictEqual(readHoursSource(rootFor(null)), HOURS_SOURCE.ESTIMATED);
    assert.strictEqual(readHoursSource(null), HOURS_SOURCE.ESTIMATED);
  });

  test('writes and clears the inline validation message', () => {
    const el = { textContent: '', style: {} };

    setHoursSourceError(rootFor('booked', el), 'No booked hours recorded');
    assert.strictEqual(el.textContent, 'No booked hours recorded');
    assert.strictEqual(el.style.display, 'block');

    setHoursSourceError(rootFor('booked', el), '');
    assert.strictEqual(el.textContent, '');
    assert.strictEqual(el.style.display, 'none');

    setHoursSourceError(null, 'anything'); // must not throw
  });
});

describe('hoursSourceLabel', () => {
  test('names both sources', () => {
    assert.strictEqual(hoursSourceLabel(HOURS_SOURCE.BOOKED), 'Hours Booked');
    assert.strictEqual(hoursSourceLabel(HOURS_SOURCE.ESTIMATED), 'Hours Estimated');
    assert.strictEqual(hoursSourceLabel(undefined), 'Hours Estimated');
  });
});

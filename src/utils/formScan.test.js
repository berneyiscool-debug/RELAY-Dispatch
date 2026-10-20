import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { prebuiltForms } from '../data/prebuiltForms.js';
import {
  sheetCode, parseSheetCode, fillableFields, detectTemplate, toCheckbox, toSelectOption, toIsoDate,
  mapScanResponses, mergeResponses, describeFields, imageBlock,
} from './formScan.js';

const JSA = { ...prebuiltForms.find((t) => t.id === 'ft_jsa_swms'), id: 'demo_ft_jsa_swms' };
const DAILY = { ...prebuiltForms.find((t) => t.id === 'ft_daily_report'), id: 'demo_ft_daily_report' };
const TEMPLATES = [JSA, DAILY];

describe('fillableFields', () => {
  test('skips info, spacer and blank fields', () => {
    const ids = fillableFields(JSA).map((f) => f.id);
    assert.ok(ids.includes('f_jsa_sign'));
    assert.ok(!ids.includes('f_jsa_info1'));
    assert.equal(ids[0], 'f_jsa_job');
  });

  test('carries select options', () => {
    const weather = fillableFields(DAILY).find((f) => f.id === 'f_dsr_weather');
    assert.deepEqual(weather.options.slice(0, 2), ['Clear/Sunny', 'Overcast']);
    assert.match(describeFields(DAILY), /f_dsr_weather \| select .*"Light Rain"/);
  });
});

describe('detectTemplate', () => {
  test('matches the printed code exactly', () => {
    const hit = detectTemplate(TEMPLATES, { code: sheetCode(JSA) });
    assert.equal(hit.template.id, 'demo_ft_jsa_swms');
    assert.equal(hit.by, 'code');
  });

  test('matches a code printed from another workspace by its prebuilt suffix', () => {
    const company = [{ ...JSA, id: 'acct_42_ft_jsa_swms' }, { ...DAILY, id: 'acct_42_ft_daily_report' }];
    assert.equal(detectTemplate(company, { code: 'RELAY-FORM: demo_ft_jsa_swms' }).template.id, 'acct_42_ft_jsa_swms');
  });

  test('falls back to the title', () => {
    assert.equal(detectTemplate(TEMPLATES, { title: 'JOB SAFETY ANALYSIS (JSA) / SWMS' }).template.id, JSA.id);
    assert.equal(detectTemplate(TEMPLATES, { title: 'Daily site report' }).template.id, DAILY.id);
  });

  test('returns nothing for an unknown sheet', () => {
    assert.equal(detectTemplate(TEMPLATES, { title: 'Pool chemical log' }).template, null);
  });

  test('parseSheetCode tolerates OCR spacing', () => {
    assert.equal(parseSheetCode('relay form #demo_ft_jsa_swms'), 'demo_ft_jsa_swms');
  });
});

describe('value conversion', () => {
  test('checkboxes', () => {
    for (const v of ['ticked', 'X', '✓', 'yes', true]) assert.equal(toCheckbox(v), true, String(v));
    for (const v of ['blank', '', 'no', false, null]) assert.equal(toCheckbox(v), false, String(v));
    assert.equal(toCheckbox('maybe?'), null);
  });

  test('select options map to the template spelling', () => {
    const opts = ['Clear/Sunny', 'Overcast', 'Light Rain', 'Heavy Rain'];
    assert.equal(toSelectOption('overcast', opts), 'Overcast');
    assert.equal(toSelectOption('clear sunny', opts), 'Clear/Sunny');
    assert.equal(toSelectOption('Sunny', opts), 'Clear/Sunny');
    assert.equal(toSelectOption('Rain', opts), null, 'ambiguous between light and heavy');
    assert.equal(toSelectOption('Snow', opts), null);
  });

  test('dates become ISO, day first', () => {
    assert.equal(toIsoDate('2026-10-19'), '2026-10-19');
    assert.equal(toIsoDate('19/10/2026'), '2026-10-19');
    assert.equal(toIsoDate('3/4/26'), '2026-04-03');
    assert.equal(toIsoDate('04/13/2026'), '2026-04-13', 'only valid month-first');
    assert.equal(toIsoDate('19 Oct 2026'), '2026-10-19');
    assert.equal(toIsoDate('October 19th, 2026'), '2026-10-19');
    assert.equal(toIsoDate('31/02/2026'), null);
    assert.equal(toIsoDate('last tuesday'), null);
  });
});

describe('mapScanResponses', () => {
  const reading = {
    fields: [
      { fieldId: 'f_jsa_job', value: 'J-1042 switchboard upgrade', confidence: 'high' },
      { fieldId: 'f_jsa_date', value: '19/10/2026', confidence: 'high' },
      { fieldId: 'f_jsa_supervisor', value: 'Dave K', confidence: 'medium', note: 'surname unclear' },
      { fieldId: 'f_jsa_company', value: '', confidence: 'high', unreadable: true },
      { fieldId: 'f_jsa_desc', value: 'Replace board', confidence: 'low' },
      { fieldId: 'f_jsa_haz_elec', value: 'ticked', confidence: 'high' },
      { fieldId: 'f_jsa_haz_fall', value: 'blank', confidence: 'high' },
      { fieldId: 'f_jsa_haz_chem', value: 'half a tick?', confidence: 'high' },
      { fieldId: 'f_jsa_ppe_boots', value: 'X', confidence: 'high' },
      { fieldId: 'f_made_up', value: 'hello', confidence: 'high' },
    ],
  };
  const { responses, flags, filled, ignored } = mapScanResponses(JSA, reading);

  test('maps confident readings by type', () => {
    assert.equal(responses.f_jsa_job, 'J-1042 switchboard upgrade');
    assert.equal(responses.f_jsa_date, '2026-10-19');
    assert.equal(responses.f_jsa_haz_elec, true);
    assert.equal(responses.f_jsa_haz_fall, false);
    assert.equal(responses.f_jsa_ppe_boots, true);
    assert.ok(filled.includes('f_jsa_haz_elec'));
  });

  test('medium confidence is written but flagged to check', () => {
    assert.equal(responses.f_jsa_supervisor, 'Dave K');
    assert.equal(flags.f_jsa_supervisor.level, 'check');
    assert.equal(flags.f_jsa_supervisor.message, 'surname unclear');
  });

  test('low confidence and unreadable are flagged, never written', () => {
    assert.ok(!('f_jsa_desc' in responses));
    assert.equal(flags.f_jsa_desc.level, 'uncertain');
    assert.equal(flags.f_jsa_desc.suggestion, 'Replace board');
    assert.ok(!('f_jsa_company' in responses));
    assert.equal(flags.f_jsa_company.level, 'unreadable');
  });

  test('an unclear tick is flagged instead of guessed', () => {
    assert.ok(!('f_jsa_haz_chem' in responses));
    assert.equal(flags.f_jsa_haz_chem.level, 'invalid');
  });

  test('required fields missing from the scan are flagged', () => {
    assert.equal(flags.f_jsa_control_desc.level, 'missing');
    assert.ok(!flags.f_jsa_sign, 'signature is applied on completion, not required off the scan');
  });

  test('unknown field ids are ignored and reported', () => {
    assert.deepEqual(ignored, ['f_made_up']);
    assert.ok(!('f_made_up' in responses));
  });

  test('select readings outside the options are flagged', () => {
    const out = mapScanResponses(DAILY, { fields: [
      { fieldId: 'f_dsr_weather', value: 'overcast', confidence: 'high' },
      { fieldId: 'f_dsr_delays', value: 'ticked', confidence: 'high' },
    ] });
    assert.equal(out.responses.f_dsr_weather, 'Overcast');
    const bad = mapScanResponses(DAILY, { fields: [{ fieldId: 'f_dsr_weather', value: 'Snow', confidence: 'high' }] });
    assert.ok(!('f_dsr_weather' in bad.responses));
    assert.equal(bad.flags.f_dsr_weather.level, 'invalid');
  });

  test('scanned values never wipe a typed answer the scan left out', () => {
    assert.deepEqual(
      mergeResponses({ f_jsa_desc: 'typed', f_jsa_job: 'old' }, { f_jsa_job: 'new' }),
      { f_jsa_desc: 'typed', f_jsa_job: 'new' }
    );
  });
});

test('imageBlock converts a data URL to an Anthropic image block', () => {
  assert.deepEqual(imageBlock('data:image/jpeg;base64,AAAA'), {
    type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' },
  });
  assert.throws(() => imageBlock('https://example.com/x.png'));
});

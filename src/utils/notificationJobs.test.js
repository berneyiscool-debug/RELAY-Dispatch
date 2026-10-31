import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanJobTitle } from './notificationJobs.js';

test('a maintenance title becomes "<asset> — <plan>"', () => {
  assert.equal(cleanJobTitle('Maintenance Due: Generator - Quarterly service'), 'Generator — Quarterly service');
  assert.equal(cleanJobTitle('Usage Maintenance Due: Van 1 - Van 1 Service Plan'), 'Van 1 — Service');
});

// The asset's own dash used to split the title and drop the plan name.
test('an asset name with its own dash keeps the plan name', () => {
  assert.equal(
    cleanJobTitle('Maintenance Due: Main switchboard MSB-1 — Harbour View - Annual thermographic scan'),
    'Main switchboard MSB-1 — Harbour View — Annual thermographic scan'
  );
});

test('other titles pass through', () => {
  assert.equal(cleanJobTitle('Burst pipe at reception'), 'Burst pipe at reception');
  assert.equal(cleanJobTitle(''), '');
});

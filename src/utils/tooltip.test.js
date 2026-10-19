import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeTooltip } from './tooltip.js';

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
const viewport = { width: 1000, height: 700 };
const tip = { width: 160, height: 30 };

test('sits above the host, centred, when there is room', () => {
  const p = placeTooltip(rect(400, 300, 40, 20), tip, viewport, 'top');
  assert.equal(p.placement, 'top');
  assert.equal(p.top, 300 - 8 - 30);
  assert.equal(p.left, 420 - 80);
  assert.equal(p.arrow, 80);
});

test('flips below when the top of the window is in the way', () => {
  const p = placeTooltip(rect(400, 10, 40, 20), tip, viewport, 'top');
  assert.equal(p.placement, 'bottom');
  assert.equal(p.top, 38);
});

test('is pulled back inside the window at the edge, with the arrow still on the host', () => {
  const p = placeTooltip(rect(980, 300, 16, 16), tip, viewport, 'top');
  assert.equal(p.left, 1000 - 8 - 160);
  assert.ok(p.arrow > 80, 'arrow moves right towards the host');
});

test('a left preference falls back to the right when there is no room', () => {
  const p = placeTooltip(rect(20, 300, 30, 20), tip, viewport, 'left');
  assert.equal(p.placement, 'right');
  assert.equal(p.left, 58);
});

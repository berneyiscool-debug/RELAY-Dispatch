import { test, describe } from 'node:test';
import assert from 'node:assert';
import { dragBadgePosition, DRAG_TIME_BADGE_ID, showDragTimeBadge, hideDragTimeBadge } from './DragTimeBadge.js';

const VIEW = { viewportWidth: 1200, viewportHeight: 800, width: 120, height: 26 };

describe('Drag time badge position', () => {
  test('sits above the top edge of the held block', () => {
    // Pointer 40px into a 30px tall block: the block's top edge is at 100.
    const { top } = dragBadgePosition({ clientX: 400, clientY: 130, offsetY: 30, ...VIEW });
    assert.strictEqual(top, 100 - VIEW.height - 8);
  });

  test('centres on the pointer', () => {
    const { left } = dragBadgePosition({ clientX: 400, clientY: 130, offsetY: 30, ...VIEW });
    assert.strictEqual(left, 400 - VIEW.width / 2);
  });

  test('never leaves the left edge', () => {
    const { left } = dragBadgePosition({ clientX: 2, clientY: 130, offsetY: 30, ...VIEW });
    assert.strictEqual(left, 8);
  });

  test('never leaves the right edge', () => {
    const { left } = dragBadgePosition({ clientX: 1199, clientY: 130, offsetY: 30, ...VIEW });
    assert.strictEqual(left, VIEW.viewportWidth - VIEW.width - 8);
  });

  test('never leaves the top edge, even when grabbed near the top of the screen', () => {
    const { top } = dragBadgePosition({ clientX: 400, clientY: 12, offsetY: 30, ...VIEW });
    assert.strictEqual(top, 8);
  });

  test('a badge wider than the viewport still starts at the left edge', () => {
    const { left } = dragBadgePosition({ clientX: 100, clientY: 400, offsetY: 0, width: 2000, height: 26, viewportWidth: 800, viewportHeight: 600 });
    assert.strictEqual(left, 8);
  });

  test('rounds to whole pixels', () => {
    const { top, left } = dragBadgePosition({ clientX: 400.6, clientY: 130.4, offsetY: 30.2, width: 121, height: 25, viewportWidth: 1200, viewportHeight: 800 });
    assert.ok(Number.isInteger(top), 'top is an integer');
    assert.ok(Number.isInteger(left), 'left is an integer');
  });
});

describe('Drag time badge element', () => {
  test('is a no-op without a DOM (import-time listeners are guarded)', () => {
    assert.strictEqual(typeof document, 'undefined', 'node tests run without a DOM');
    assert.doesNotThrow(() => showDragTimeBadge({ clientX: 1, clientY: 1, range: '09:00 – 10:00' }));
    assert.doesNotThrow(() => hideDragTimeBadge());
  });

  test('has a stable id so the page can clean it up', () => {
    assert.strictEqual(DRAG_TIME_BADGE_ID, 'schedule-drag-time');
  });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRichText, richTextHtml, richTextPlain } from './richText.js';

test('tells the editor\'s HTML from plain text', () => {
  assert.equal(isRichText('<p>Replace the board</p>'), true);
  assert.equal(isRichText('Replace the board\nTest RCDs'), false);
  assert.equal(isRichText('Power < 10A and > 5A'), false);
  assert.equal(isRichText(''), false);
});

test('rich text is sanitised, not escaped, so no raw tags show', () => {
  const seen = [];
  const html = richTextHtml('<p>Replace the board</p>', (h) => { seen.push(h); return h; });
  assert.equal(html, '<p>Replace the board</p>');
  assert.deepEqual(seen, ['<p>Replace the board</p>']);
});

test('plain text is escaped and keeps its line breaks', () => {
  assert.equal(richTextHtml('Board & RCDs\nLoad < 10A'), 'Board &amp; RCDs<br>Load &lt; 10A');
  assert.equal(richTextHtml(''), '');
});

test('plain words for a table cell', () => {
  assert.equal(richTextPlain('<p>Replace the board</p><ul><li>Test RCDs</li><li>CCEW &amp; tag</li></ul>'), 'Replace the board\n• Test RCDs\n• CCEW & tag');
  assert.equal(richTextPlain('Already plain'), 'Already plain');
});

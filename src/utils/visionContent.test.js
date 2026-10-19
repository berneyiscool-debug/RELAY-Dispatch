import { test } from 'node:test';
import assert from 'node:assert/strict';

import { imageBlock, visionUserContent } from './visionContent.js';

test('images go out as Anthropic base64 image blocks, never image_url', () => {
  const content = visionUserContent('Extract every record.', [
    'data:image/jpeg;base64,/9j/AAAA',
    'data:image/png;base64,iVBORw0K',
  ]);
  assert.deepEqual(content, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '/9j/AAAA' } },
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0K' } },
    { type: 'text', text: 'Extract every record.' },
  ]);
  assert.ok(!JSON.stringify(content).includes('image_url'));
});

test('a non-data URL is refused rather than sent', () => {
  assert.throws(() => imageBlock('https://example.com/catalogue.png'));
  assert.throws(() => imageBlock(''));
});

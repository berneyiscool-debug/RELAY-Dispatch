import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOCS, DOC_ORDER, ENTITY, renderBlocks } from './content.js';

const allText = JSON.stringify(DOCS);

test('every document in DOC_ORDER exists and has sections', () => {
  for (const key of DOC_ORDER) {
    assert.ok(DOCS[key], `missing doc ${key}`);
    assert.ok(DOCS[key].sections.length > 0);
  }
});

test('cross-links only point at real documents', () => {
  for (const [, key] of allText.matchAll(/\{\{doc:([a-z-]+)\|/g)) {
    assert.ok(DOC_ORDER.includes(key), `{{doc:${key}}} has no document`);
  }
});

test('mail tokens only use configured addresses', () => {
  for (const [, key] of allText.matchAll(/\{\{mail:([a-z]+)\}\}/g)) {
    assert.ok(ENTITY.emails[key], `{{mail:${key}}} not in ENTITY.emails`);
  }
});

test('rendering leaves no unexpanded tokens', () => {
  for (const key of DOC_ORDER) {
    const html = DOCS[key].sections.map((s) => renderBlocks(s.blocks, (k) => `#/${k}`)).join('');
    assert.ok(!html.includes('{{'), `${key} has an unexpanded token`);
  }
});

test('section ids are unique within each document', () => {
  for (const key of DOC_ORDER) {
    const ids = DOCS[key].sections.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${key} repeats a section id`);
  }
});

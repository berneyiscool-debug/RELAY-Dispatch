/**
 * The picker's markup is a string and its selection is moved in place, so both halves
 * are testable without a DOM. The in-place half is the part worth pinning: the page is
 * never re-rendered on select (that would discard whatever the user had typed into the
 * neighbouring profile fields), so a card that forgets to clear its own CURRENT badge or
 * accent border would leave two cards looking selected.
 *
 * `fakeCard`/`fakeRoot` implement exactly the element surface the component touches, so
 * these tests stay dependency-free.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BRNY_PERSONALITIES, DEFAULT_PERSONALITY_ID } from '../utils/brnyPersonalities.js';
import {
  applyBrnyPersonalitySelection,
  brnyPersonalityPickerHTML,
  wireBrnyPersonalityPicker
} from './brnyPersonalityPicker.js';

const IDS = BRNY_PERSONALITIES.map((p) => p.id);

function fakeCard(id) {
  const card = {
    dataset: { personality: id },
    style: {},
    attrs: {},
    listeners: {},
    badge: { style: {} },
    setAttribute(name, value) { this.attrs[name] = value; },
    querySelector(selector) {
      return selector === '[data-personality-badge]' ? this.badge : null;
    },
    addEventListener(type, fn) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(fn);
    },
    fire(type, event = {}) {
      for (const fn of this.listeners[type] || []) fn(event);
    }
  };
  card.click = () => card.fire('click');
  return card;
}

function fakeRoot() {
  const cards = IDS.map(fakeCard);
  return {
    cards,
    card: (id) => cards.find((c) => c.dataset.personality === id),
    querySelectorAll(selector) { return selector === '[data-personality]' ? cards : []; }
  };
}

const selectedId = (root) => root.cards.filter((c) => c.attrs['aria-checked'] === 'true').map((c) => c.dataset.personality);

test('the markup offers every personality as a radio, with one selected', () => {
  const html = brnyPersonalityPickerHTML('brief');

  for (const personality of BRNY_PERSONALITIES) {
    assert.ok(html.includes(`data-personality="${personality.id}"`), `${personality.id} is missing`);
    assert.ok(html.includes(personality.name), `${personality.id} name is missing`);
    assert.ok(html.includes(personality.summary), `${personality.id} summary is missing`);
  }

  assert.strictEqual(html.match(/role="radio"/g).length, BRNY_PERSONALITIES.length);
  assert.strictEqual(html.match(/aria-checked="true"/g).length, 1);
  assert.ok(html.includes('role="radiogroup"'));
});

test('the markup draws the pick as the user\'s own, not the company\'s', () => {
  const html = brnyPersonalityPickerHTML();

  // The wording is load-bearing: this is a personal preference, and the copy is the only
  // place a user is told so.
  assert.ok(html.includes('aria-label="How brny talks"'));
  assert.ok(html.includes('CURRENT'));
});

test('an unknown or missing selection falls back to the default card', () => {
  for (const value of [undefined, null, 'nope']) {
    const html = brnyPersonalityPickerHTML(value);
    const current = html.split('aria-checked="true"')[0];
    assert.ok(current.includes(`data-personality="${DEFAULT_PERSONALITY_ID}"`), `${value} did not fall back`);
  }
});

test('escaping keeps a personality from breaking out of its card', () => {
  // The catalogue is ours, but the picker is also handed a stored id.
  const html = brnyPersonalityPickerHTML('"><script>alert(1)</script>');
  assert.ok(!html.includes('<script>'));
});

test('applying a selection moves the badge and the accent border with it', () => {
  const root = fakeRoot();

  applyBrnyPersonalitySelection(root, 'trainer');

  assert.deepStrictEqual(selectedId(root), ['trainer']);
  assert.match(root.card('trainer').style.border, /2px solid/);
  assert.strictEqual(root.card('trainer').badge.style.display, 'inline-block');

  for (const card of root.cards.filter((c) => c.dataset.personality !== 'trainer')) {
    assert.ok(!/2px solid/.test(card.style.border), `${card.dataset.personality} kept the accent border`);
    assert.strictEqual(card.badge.style.display, 'none', `${card.dataset.personality} kept its badge`);
  }
});

test('applying an unknown selection normalises to the default', () => {
  const root = fakeRoot();
  assert.strictEqual(applyBrnyPersonalitySelection(root, 'nonsense'), DEFAULT_PERSONALITY_ID);
  assert.deepStrictEqual(selectedId(root), [DEFAULT_PERSONALITY_ID]);
});

test('clicking a card saves the pick and repaints from what was stored', () => {
  const root = fakeRoot();
  const saved = [];
  wireBrnyPersonalityPicker(root, {
    selectedId: 'straight',
    onSelect: (id) => { saved.push(id); return id; }
  });

  assert.deepStrictEqual(selectedId(root), ['straight']);

  root.card('friendly').click();

  assert.deepStrictEqual(saved, ['friendly']);
  assert.deepStrictEqual(selectedId(root), ['friendly']);
  assert.strictEqual(root.card('straight').badge.style.display, 'none');
});

test('the UI follows what was stored, not what was clicked', () => {
  const root = fakeRoot();
  wireBrnyPersonalityPicker(root, {
    selectedId: DEFAULT_PERSONALITY_ID,
    onSelect: () => DEFAULT_PERSONALITY_ID // a save that refuses the pick
  });

  root.card('formal').click();

  assert.deepStrictEqual(selectedId(root), [DEFAULT_PERSONALITY_ID]);
});

test('the cards are keyboard-selectable, and only on Enter/Space', () => {
  const root = fakeRoot();
  const saved = [];
  let prevented = 0;
  wireBrnyPersonalityPicker(root, {
    selectedId: DEFAULT_PERSONALITY_ID,
    onSelect: (id) => { saved.push(id); return id; }
  });

  const formal = root.card('formal');
  formal.fire('keydown', { key: 'Tab', preventDefault: () => { prevented += 1; } });
  assert.deepStrictEqual(saved, []);

  for (const key of ['Enter', ' ']) {
    formal.fire('keydown', { key, preventDefault: () => { prevented += 1; } });
  }

  assert.deepStrictEqual(saved, ['formal', 'formal']);
  assert.strictEqual(prevented, 2, 'Enter/Space must not also scroll or re-click');
});

test('a missing radiogroup is not a throw', () => {
  assert.doesNotThrow(() => applyBrnyPersonalitySelection(null, 'brief'));
  assert.doesNotThrow(() => wireBrnyPersonalityPicker(null, { onSelect: () => 'brief' }));
  assert.doesNotThrow(() => wireBrnyPersonalityPicker({ querySelectorAll: () => [] }, {}));
});

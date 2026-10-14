import { test, describe } from 'node:test';
import assert from 'node:assert';

// My Profile reads the signed-in user out of storage while it renders, so provide the
// browser storage APIs before importing it.
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => { storage.set(key, String(value)); },
  removeItem: (key) => { storage.delete(key); },
  clear: () => storage.clear()
};

const { renderProfile } = await import('./Profile.js');
const { BRNY_PERSONALITIES, DEFAULT_PERSONALITY_ID } = await import('../utils/brnyPersonalities.js');

const USER = { id: 'user_1', name: 'Jo Bloggs', email: 'jo@example.com', role: 'office' };

// Stand-ins for the elements the page looks up. `attachListeners` binds to a handful of
// them without a null check, so anything it asks for by name has to answer like an
// element rather than null.
function fakeElement() {
  const attrs = {};
  return {
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, contains: () => false },
    addEventListener() {},
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    removeAttribute: (name) => { delete attrs[name]; },
    querySelector: () => null,
    querySelectorAll: () => [],
    attrs
  };
}

/**
 * Mount the page the way the router does, with the picker's own cards in place so the
 * rendered selection can be read back off them.
 *
 * @param {string} [selectedId] personality already saved for the user
 */
function mountProfile(selectedId) {
  storage.clear();
  storage.set('currentUser', JSON.stringify(USER));
  if (selectedId) storage.set(`relay_brny_personality_${USER.id}`, selectedId);

  const cards = BRNY_PERSONALITIES.map((personality) => {
    const card = fakeElement();
    card.dataset.personality = personality.id;
    return card;
  });

  const section = fakeElement();
  section.querySelectorAll = (selector) => (selector === '[data-personality]' ? cards : []);

  const container = fakeElement();
  container.innerHTML = '';
  container.querySelector = (selector) => (selector === '#profile-brny-personality' ? section : fakeElement());

  renderProfile(container);

  return {
    html: container.innerHTML,
    current: cards.filter((card) => card.attrs['aria-checked'] === 'true').map((card) => card.dataset.personality)
  };
}

describe("Profile: brny's personality section", () => {
  test('renders the page with every personality on offer', () => {
    const { html } = mountProfile();

    assert.ok(html.includes("brny's Personality"), 'the section should be titled');
    for (const personality of BRNY_PERSONALITIES) {
      assert.ok(html.includes(personality.name), `${personality.id} should be offered`);
    }
  });

  test('marks the saved personality as the current one', () => {
    // The picker is wired from inside the page's own listener block, one scope away from
    // where the saved value is read. Getting that wrong takes the whole page down.
    const { current } = mountProfile('trainer');

    assert.deepStrictEqual(current, ['trainer']);
  });

  test('falls back to the default personality when nothing is saved', () => {
    const { current } = mountProfile();

    assert.deepStrictEqual(current, [DEFAULT_PERSONALITY_ID]);
  });

  test('survives an unknown saved personality', () => {
    const { current } = mountProfile('nonsense');

    assert.deepStrictEqual(current, [DEFAULT_PERSONALITY_ID]);
  });
});

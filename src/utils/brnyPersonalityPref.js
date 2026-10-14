/**
 * brny's personality, as a *personal* preference.
 *
 * How brny talks is the user's own choice, not the company's: two people in the same
 * company can want a different voice, and most roles cannot reach Settings at all. So
 * the pick lives next to the per-user factsheet (`relay_factsheet_<id>`, see
 * `userMemory.js`) rather than in the company settings row:
 *
 *     relay_brny_personality_<userId>
 *
 * Nothing server-side reads it — every prompt that carries the voice is built in the
 * browser (`brnyPlaybook.js` for the tool loop, `RelayAssistant.js` for the prose
 * paths) — so a device-local key is enough, and it keeps one person's preference out
 * of shared company data. The trade-off is that it does not follow the user to
 * another browser or machine, which matches how the factsheet already behaves.
 *
 * There is deliberately **no company-level fallback**: an unpicked user gets the
 * shipped default, never another user's or the company's pick.
 */

import { DEFAULT_PERSONALITY_ID, getBrnyPersonality } from './brnyPersonalities.js';

const KEY_PREFIX = 'relay_brny_personality_';

/** `localStorage` is absent in tests and can throw in locked-down browsers. */
function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

/** The storage key this user's personality is kept under. */
export function brnyPersonalityKey(userId) {
  return `${KEY_PREFIX}${userId || 'default'}`;
}

/**
 * The personality this user has picked, or the default.
 *
 * Unknown and stale values resolve to the default rather than throwing, so a hand-edited
 * key or a preset that was later renamed can never break brny's prompt.
 *
 * @param {string} [userId]
 * @param {Storage} [storage] injectable for tests; defaults to `localStorage`
 * @returns {string} a valid personality id
 */
export function getUserBrnyPersonality(userId, storage) {
  const store = resolveStorage(storage);
  if (!store) return DEFAULT_PERSONALITY_ID;

  let stored = null;
  try {
    stored = store.getItem(brnyPersonalityKey(userId));
  } catch {
    return DEFAULT_PERSONALITY_ID;
  }

  return getBrnyPersonality(stored).id;
}

/**
 * Save this user's personality, normalising `personalityId` first.
 *
 * @param {string} [userId]
 * @param {string} personalityId
 * @param {Storage} [storage] injectable for tests; defaults to `localStorage`
 * @returns {string} the id actually stored
 */
export function setUserBrnyPersonality(userId, personalityId, storage) {
  const resolved = getBrnyPersonality(personalityId).id;
  const store = resolveStorage(storage);
  if (!store) return resolved;

  try {
    store.setItem(brnyPersonalityKey(userId), resolved);
  } catch {
    // A full or disabled localStorage must not take the rest of the page down with it.
  }

  return resolved;
}

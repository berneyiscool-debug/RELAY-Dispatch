// ============================================
// RELAY — brny PERSONALITY PICKER
// ============================================
// The five voices brny can talk in, as one radio group.
//
// This lives in `components/` rather than in the page that mounts it for two reasons:
// the markup is a plain string that can be asserted in a unit test without a DOM, and
// the picker is a *user* preference — My Profile owns where it is shown, not what it is.
//
// It only ever changes how brny talks. The rules that decide what brny may do, and how
// it reports hours, tasks and questions, are the playbook's and are not selectable.

import { BRNY_PERSONALITIES, getBrnyPersonality } from '../utils/brnyPersonalities.js';
import { escapeHTML } from '../utils/security.js';

const ACCENT = 'var(--color-accent, #FF5C00)';

/**
 * The picker's markup.
 *
 * Every card is rendered on every call, including the `CURRENT` badge, because the
 * selection is re-applied in place on click (`applyBrnyPersonalitySelection`) and never
 * by re-rendering the host page — that would throw away whatever the user had typed into
 * the neighbouring fields.
 *
 * @param {string} [selectedId] the currently selected personality; unknown values are normalised
 * @returns {string} HTML for a `radiogroup` of the available personalities
 */
export function brnyPersonalityPickerHTML(selectedId) {
  const selected = getBrnyPersonality(selectedId).id;

  const cards = BRNY_PERSONALITIES.map((personality) => {
    const isCurrent = personality.id === selected;
    return `
        <div class="card" role="radio" tabindex="0" data-personality="${escapeHTML(personality.id)}" aria-checked="${isCurrent}"
             style="cursor:pointer; ${personalityCardBorder(isCurrent)}">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <h4 style="margin:0;">${escapeHTML(personality.name)}</h4>
            <span data-personality-badge style="display:${isCurrent ? 'inline-block' : 'none'};font-weight:700;letter-spacing:.5px;color:${ACCENT};">CURRENT</span>
          </div>
          <div class="card-body">
            <div style="color:var(--text-secondary); line-height:1.5;">${escapeHTML(personality.summary)}</div>
            <div style="margin-top:10px; padding-left:12px; border-left:2px solid var(--border-color); color:var(--text-tertiary); line-height:1.5;">${escapeHTML(personality.example)}</div>
          </div>
        </div>`;
  }).join('');

  return `<div role="radiogroup" aria-label="How brny talks" style="display:flex;flex-direction:column;gap:12px;">${cards}
      </div>`;
}

function personalityCardBorder(isCurrent) {
  return isCurrent ? `border:2px solid ${ACCENT};` : 'border:1px solid var(--border-color);';
}

/**
 * Move the selection onto `selectedId` without touching anything else.
 *
 * @param {ParentNode} root element containing the radiogroup
 * @param {string} [selectedId]
 * @returns {string} the id that is now selected
 */
export function applyBrnyPersonalitySelection(root, selectedId) {
  const selected = getBrnyPersonality(selectedId).id;
  if (!root || typeof root.querySelectorAll !== 'function') return selected;

  root.querySelectorAll('[data-personality]').forEach((card) => {
    const isCurrent = card.dataset.personality === selected;
    card.setAttribute('aria-checked', String(isCurrent));
    card.style.border = isCurrent ? `2px solid ${ACCENT}` : '1px solid var(--border-color)';

    const badge = card.querySelector('[data-personality-badge]');
    if (badge) badge.style.display = isCurrent ? 'inline-block' : 'none';
  });

  return selected;
}

/**
 * Render the selection state and make the cards selectable.
 *
 * `onSelect` receives the clicked personality id and is responsible for saving it; the
 * picker re-applies the selection from what `onSelect` returns, so a save that rejects
 * or normalises the value still leaves the UI matching what was stored.
 *
 * @param {ParentNode} root element containing the radiogroup
 * @param {object} opts
 * @param {string} [opts.selectedId]
 * @param {(id: string) => string} opts.onSelect saves the pick and returns the stored id
 */
export function wireBrnyPersonalityPicker(root, { selectedId, onSelect } = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  applyBrnyPersonalitySelection(root, selectedId);

  const choose = (id) => {
    const stored = typeof onSelect === 'function' ? onSelect(id) : id;
    applyBrnyPersonalitySelection(root, stored);
  };

  root.querySelectorAll('[data-personality]').forEach((card) => {
    card.addEventListener('click', () => choose(card.dataset.personality));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(card.dataset.personality);
      }
    });
  });
}

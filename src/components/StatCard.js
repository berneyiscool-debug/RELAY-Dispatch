// ============================================
// RELAY — STAT CARD
// ============================================
// One KPI tile, in the shape the app already uses on Reports: a small uppercase
// label, an optional tinted icon chip, the number set in the app's own type
// scale, and one line of context underneath.
//
// Detail pages used to hand-roll their own "scorecards" — a thick coloured left
// border, a 22–28px number in a colour per card, centred text — which matched
// nothing else in the app. Everything that needs a KPI now renders through here
// so a number looks the same on a report, a job, or a project.

import { escapeHTML } from '../utils/security.js';

// Icon chip tones map onto the `.stat-icon` variants in components.css.
const CHIP_TONE = {
  neutral: 'neutral',
  primary: 'blue',
  blue: 'blue',
  success: 'green',
  green: 'green',
  warning: 'orange',
  orange: 'orange',
  danger: 'red',
  red: 'red',
};

/**
 * @param {object} opts
 * @param {string} opts.label    small uppercase caption
 * @param {string|number} opts.value  the number, already formatted
 * @param {string} [opts.icon]   Material icon name for the chip
 * @param {string} [opts.tone]   chip colour: neutral | primary | success | warning | danger
 * @param {string} [opts.sub]    trusted HTML for the context line (escape any user text)
 * @param {string} [opts.valueTone] '' or 'alert' — alert paints the number danger
 * @param {boolean} [opts.compact] 2xl number instead of 3xl (default true)
 */
export function statCard({ label, value, icon = '', tone = 'neutral', sub = '', valueTone = '', compact = true } = {}) {
  const chip = CHIP_TONE[tone] || CHIP_TONE.neutral;
  return `
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-label">${escapeHTML(label == null ? '' : String(label))}</div>
        ${icon ? `<div class="stat-icon ${chip}" aria-hidden="true"><span class="material-icons-outlined">${escapeHTML(icon)}</span></div>` : ''}
      </div>
      <div class="stat-value${compact ? ' is-compact' : ''}${valueTone === 'alert' ? ' is-alert' : ''}">${escapeHTML(value == null ? '—' : String(value))}</div>
      ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
    </div>
  `;
}

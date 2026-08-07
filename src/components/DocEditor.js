// ============================================
// RELAY — DOCUMENT EDITOR PRIMITIVES
// ============================================
// Markup builders + behaviour for the Word-style editor shell used by the form
// builder, the quote/invoice customiser and the email template editor.
// Styling lives in styles/docEditor.css; this file only produces the HTML the
// pages compose and wires the interactions that need JavaScript (ribbon tabs,
// popovers, canvas zoom).
//
// Everything here is string-in / string-out to match how the rest of the app
// renders, so a page can drop these into its own template literal.

import { escapeHTML } from '../utils/security.js';

const icon = (name, size) =>
  `<span class="material-icons-outlined"${size ? ` style="font-size:${size}px"` : ''}>${name}</span>`;

// ─────────────────────────────────────────────
//  Chrome
// ─────────────────────────────────────────────

// Take over the content area: no breadcrumb, no page padding, no scroll — the
// editor manages its own scrolling regions. main.js clears the class on every
// navigation, so leaving the page restores the normal shell automatically.
export function enterEditorChrome(container) {
  document.body.classList.add('rde-immersive');
  if (container) container.classList.remove('non-dashboard-schedule-page');
}

// ─────────────────────────────────────────────
//  Ribbon markup builders
// ─────────────────────────────────────────────

// A captioned ribbon group. `end: true` pins it to the right edge.
export function group(label, contentHTML, opts = {}) {
  return `
    <div class="rde-grp ${opts.end ? 'rde-grp-end' : ''}"${opts.id ? ` id="${opts.id}"` : ''}>
      <div class="${opts.stack ? 'rde-grp-stack' : 'rde-grp-row'}">${contentHTML}</div>
      <div class="rde-grp-label">${escapeHTML(label)}</div>
    </div>`;
}

// Icon-over-label ribbon button. Pass `pressed` for toggles (renders as
// aria-pressed so state is exposed, not just coloured).
export function btn(opts = {}) {
  const {
    id, label, iconName, pressed, disabled, small, title, dataset = {}, draggable,
  } = opts;
  const data = Object.entries(dataset).map(([k, v]) => ` data-${k}="${escapeHTML(String(v))}"`).join('');
  return `<button type="button" class="rde-b ${small ? 'rde-b-sm' : ''}"${id ? ` id="${id}"` : ''}${data}` +
    `${pressed === undefined ? '' : ` aria-pressed="${pressed ? 'true' : 'false'}"`}` +
    `${disabled ? ' disabled' : ''}${draggable ? ' draggable="true"' : ''}` +
    `${title ? ` title="${escapeHTML(title)}"` : ''}>` +
    `${iconName ? icon(iconName) : ''}<span>${escapeHTML(label || '')}</span></button>`;
}

// Button that carries the value it edits, so the ribbon reads as a summary of
// the document rather than a row of anonymous triggers.
export function valueBtn(opts = {}) {
  const { id, iconName, label, value, placeholder, disabled, dataset = {} } = opts;
  const data = Object.entries(dataset).map(([k, v]) => ` data-${k}="${escapeHTML(String(v))}"`).join('');
  const isDefault = !value;
  const shown = isDefault ? (placeholder || 'Default') : value;
  return `<button type="button" class="rde-b rde-b-val"${id ? ` id="${id}"` : ''}${data}` +
    `${disabled ? ' disabled' : ''}>` +
    `${iconName ? icon(iconName) : ''}` +
    `<span class="rde-b-val-txt">` +
      `<span class="rde-b-val-k">${escapeHTML(label || '')}</span>` +
      `<span class="rde-b-val-v ${isDefault ? 'is-default' : ''}">${escapeHTML(oneLine(shown))}</span>` +
    `</span>${icon('expand_more', 16)}</button>`;
}

// Collapse newlines and clip so a multi-line value can sit on one ribbon line.
export function oneLine(text, max = 34) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
}

// Segmented control. `options` is [{ value, label, iconName, title }].
export function seg(opts = {}) {
  const { id, options = [], value, disabled, dataset = {} } = opts;
  const data = Object.entries(dataset).map(([k, v]) => ` data-${k}="${escapeHTML(String(v))}"`).join('');
  return `<div class="rde-seg"${id ? ` id="${id}"` : ''} role="group"${data}>` +
    options.map(o =>
      `<button type="button" data-value="${escapeHTML(String(o.value))}"` +
      ` aria-pressed="${String(o.value) === String(value) ? 'true' : 'false'}"` +
      `${disabled ? ' disabled' : ''}${o.title ? ` title="${escapeHTML(o.title)}"` : ''}` +
      `${o.style ? ` style="${o.style}"` : ''}>` +
      `${o.iconName ? icon(o.iconName) : ''}${o.label ? `<span>${escapeHTML(o.label)}</span>` : ''}</button>`
    ).join('') + '</div>';
}

// Colour button: a chip of the current colour above its name.
export function swatch(opts = {}) {
  const { id, label, value, dataset = {} } = opts;
  const data = Object.entries(dataset).map(([k, v]) => ` data-${k}="${escapeHTML(String(v))}"`).join('');
  return `<button type="button" class="rde-sw"${id ? ` id="${id}"` : ''}${data}` +
    ` title="${escapeHTML(label || '')} — ${escapeHTML(value || '')}">` +
    `<span class="rde-sw-chip" style="background:${escapeHTML(value || '#ffffff')}"></span>` +
    `<span>${escapeHTML(label || '')}</span></button>`;
}

// Small input that lives directly in the ribbon. Pass `label` for a visible
// micro-caption, or `srLabel` alone when the group caption above it already says
// what the control is — repeating it reads as noise.
export function field(opts = {}) {
  const { id, label, srLabel, value, placeholder, type = 'text', width = 130, min, max, disabled } = opts;
  const input = `<input type="${type}" id="${id}" value="${escapeHTML(String(value ?? ''))}"` +
    `${placeholder ? ` placeholder="${escapeHTML(placeholder)}"` : ''}` +
    `${min !== undefined ? ` min="${min}"` : ''}${max !== undefined ? ` max="${max}"` : ''}` +
    `${label ? '' : ` aria-label="${escapeHTML(srLabel || placeholder || '')}"`}` +
    `${disabled ? ' disabled' : ''} style="width:${width}px" />`;
  return label
    ? `<label class="rde-f"><span>${escapeHTML(label)}</span>${input}</label>`
    : `<span class="rde-f">${input}</span>`;
}

// Small <select>, same labelling rules as field().
export function select(opts = {}) {
  const { id, label, srLabel, value, options = [], width = 150, disabled } = opts;
  const el = `<select id="${id}"${disabled ? ' disabled' : ''}` +
    `${label ? '' : ` aria-label="${escapeHTML(srLabel || '')}"`} style="width:${width}px">` +
    options.map(o => `<option value="${escapeHTML(String(o.value))}"` +
      `${String(o.value) === String(value) ? ' selected' : ''}>${escapeHTML(o.label)}</option>`).join('') +
    '</select>';
  return label
    ? `<label class="rde-f"><span>${escapeHTML(label)}</span>${el}</label>`
    : `<span class="rde-f">${el}</span>`;
}

// Slider with a live numeric readout.
export function slider(opts = {}) {
  const { id, value, min = 0, max = 100, step = 1, suffix = '' } = opts;
  return `<input type="range" class="rde-range" id="${id}" min="${min}" max="${max}" step="${step}"` +
    ` value="${value}" aria-label="${escapeHTML(opts.label || 'Value')}" />` +
    `<span class="rde-range-val" id="${id}-val">${value}${suffix}</span>`;
}

// ─────────────────────────────────────────────
//  Ribbon tabs
// ─────────────────────────────────────────────

// Renders the tab strip. `tabs` is [{ id, label, contextual }]; `endHTML` sits
// flush right (document switchers, view controls).
export function tabStrip(tabs, activeId, endHTML = '') {
  return `<div class="rde-tabs" role="tablist">` +
    tabs.map(t =>
      `<button type="button" class="rde-tab ${t.contextual ? 'rde-tab-ctx' : ''}" role="tab"` +
      ` data-tab="${escapeHTML(t.id)}" aria-selected="${t.id === activeId ? 'true' : 'false'}">` +
      `${escapeHTML(t.label)}</button>`
    ).join('') +
    (endHTML ? `<div class="rde-tabs-end">${endHTML}</div>` : '') +
    '</div>';
}

// Wires the tab strip. Also gives it arrow-key navigation, which a role=tablist
// is expected to have.
export function bindTabs(root, onSelect) {
  const tabs = [...root.querySelectorAll('.rde-tab')];
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => onSelect(tab.dataset.tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      onSelect(next.dataset.tab);
    });
  });
}

// ─────────────────────────────────────────────
//  Popovers
// ─────────────────────────────────────────────
// The ribbon scrolls horizontally, so anything anchored inside it would be
// clipped. Popovers are appended to <body> and positioned with fixed
// coordinates instead.

let openPop = null;

export function closePopover() {
  if (!openPop) return;
  const { el, cleanup } = openPop;
  openPop = null;
  cleanup();
  el.remove();
}

// `contentHTML` is the panel body; `onMount(panel, close)` wires it up.
// Returns the panel element.
export function openPopover(anchor, contentHTML, onMount) {
  const wasFor = openPop && openPop.anchor;
  closePopover();
  if (wasFor === anchor) return null; // clicking the same trigger closes it

  const el = document.createElement('div');
  el.className = 'rde-pop';
  el.setAttribute('role', 'dialog');
  el.innerHTML = contentHTML;
  document.body.appendChild(el);

  const place = () => {
    const r = anchor.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  };
  place();

  const onDocDown = (e) => {
    if (el.contains(e.target) || anchor.contains(e.target)) return;
    closePopover();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { closePopover(); anchor.focus(); }
  };
  document.addEventListener('mousedown', onDocDown, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', place);

  const cleanup = () => {
    document.removeEventListener('mousedown', onDocDown, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
  };
  openPop = { el, anchor, cleanup };

  if (onMount) onMount(el, closePopover);
  const focusTarget = el.querySelector('textarea, input, select, button');
  if (focusTarget) focusTarget.focus();
  // Content may have changed height (autosized textarea) — settle the position.
  requestAnimationFrame(place);
  return el;
}

// Body for a long-text popover, with optional click-to-insert merge variables.
export function textPopoverHTML({ title, hint, value, placeholder, rows = 5, vars, multiline = true }) {
  return `
    <div class="rde-pop-head"><span class="rde-pop-title">${escapeHTML(title)}</span></div>
    ${hint ? `<div class="rde-pop-hint">${escapeHTML(hint)}</div>` : ''}
    ${multiline
      ? `<textarea class="rde-pop-input" rows="${rows}" placeholder="${escapeHTML(placeholder || '')}">${escapeHTML(value || '')}</textarea>`
      : `<input type="text" class="rde-pop-input" value="${escapeHTML(value || '')}" placeholder="${escapeHTML(placeholder || '')}" />`}
    ${vars && vars.length ? `
      <div class="rde-pop-hint">Click to insert:</div>
      <div class="rde-vars">${vars.map(v => `<button type="button" class="rde-var" data-var="${escapeHTML(v)}">{${escapeHTML(v)}}</button>`).join('')}</div>` : ''}
    <div class="rde-pop-foot">
      <button type="button" class="btn btn-ghost btn-sm rde-pop-clear">Use default</button>
      <span class="rde-pop-spacer"></span>
      <button type="button" class="btn btn-primary btn-sm rde-pop-done">Done</button>
    </div>`;
}

// Wires a text popover: live `onInput`, variable insertion, clear-to-default.
export function bindTextPopover(panel, close, { onInput, onClear }) {
  const input = panel.querySelector('.rde-pop-input');
  input.addEventListener('input', () => onInput(input.value));
  panel.querySelectorAll('.rde-var').forEach(chip => {
    chip.addEventListener('click', () => {
      const token = `{${chip.dataset.var}}`;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, start) + token + input.value.slice(end);
      input.focus();
      input.setSelectionRange(start + token.length, start + token.length);
      onInput(input.value);
    });
  });
  panel.querySelector('.rde-pop-clear')?.addEventListener('click', () => {
    input.value = '';
    onInput('');
    if (onClear) onClear();
    input.focus();
  });
  panel.querySelector('.rde-pop-done')?.addEventListener('click', close);
}

// Body for a colour popover: native picker, hex entry, and a small palette.
const COLOR_PRESETS = [
  '#1E2A3A', '#0F172A', '#111827', '#451A03', '#5C2C36',
  '#FF5C00', '#C2410C', '#D97706', '#16A34A', '#0891B2',
  '#7C3AED', '#DC2626', '#475569', '#64748B', '#F8FAFC',
];

export function colorPopoverHTML({ title, hint, value }) {
  return `
    <div class="rde-pop-head"><span class="rde-pop-title">${escapeHTML(title)}</span></div>
    ${hint ? `<div class="rde-pop-hint">${escapeHTML(hint)}</div>` : ''}
    <div class="rde-pop-color">
      <input type="color" class="rde-pop-native" value="${escapeHTML(normalizeHex(value) || '#000000')}" aria-label="${escapeHTML(title)}" />
      <input type="text" class="rde-pop-hex" value="${escapeHTML(value || '')}" placeholder="#000000" spellcheck="false" />
    </div>
    <div class="rde-pop-presets">
      ${COLOR_PRESETS.map(c => `<button type="button" class="rde-pop-preset" data-color="${c}" style="background:${c}" title="${c}" aria-label="${c}"></button>`).join('')}
    </div>
    <div class="rde-pop-foot">
      <span class="rde-pop-spacer"></span>
      <button type="button" class="btn btn-primary btn-sm rde-pop-done">Done</button>
    </div>`;
}

export function bindColorPopover(panel, close, onChange) {
  const native = panel.querySelector('.rde-pop-native');
  const hex = panel.querySelector('.rde-pop-hex');
  const push = (v) => { onChange(v); };
  native.addEventListener('input', () => { hex.value = native.value.toUpperCase(); push(native.value); });
  hex.addEventListener('input', () => {
    const v = normalizeHex(hex.value);
    if (v) { native.value = v; push(v); }
  });
  panel.querySelectorAll('.rde-pop-preset').forEach(sw => {
    sw.addEventListener('click', () => {
      native.value = sw.dataset.color;
      hex.value = sw.dataset.color;
      push(sw.dataset.color);
    });
  });
  panel.querySelector('.rde-pop-done')?.addEventListener('click', close);
}

// Accepts #abc / #aabbcc (with or without the hash); returns #AABBCC or null.
export function normalizeHex(input) {
  let v = String(input || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(v)) return null;
  return '#' + v.toUpperCase();
}

// ─────────────────────────────────────────────
//  Canvas zoom
// ─────────────────────────────────────────────

// Scales the stage and reserves the right amount of vertical space, so zooming
// out doesn't leave a tall empty canvas below the page.
export function applyZoom(stage, pct) {
  if (!stage) return;
  const scale = pct / 100;
  stage.style.transform = scale === 1 ? '' : `scale(${scale})`;
  stage.style.width = scale === 1 ? '' : `${100 / scale}%`;
  stage.style.marginBottom = scale < 1 ? `${-(1 - scale) * stage.offsetHeight}px` : '';
}

export function zoomControlHTML(id, value = 100) {
  const steps = [50, 75, 100, 125, 150];
  return `<label class="rde-status-end" style="gap:6px">
      <span>Zoom</span>
      <select id="${id}">
        ${steps.map(s => `<option value="${s}" ${s === value ? 'selected' : ''}>${s}%</option>`).join('')}
      </select>
    </label>`;
}

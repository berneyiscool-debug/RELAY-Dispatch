// ============================================
// RELAY — TOOLTIPS
// ============================================
// Any element with data-tooltip="…" (and optionally data-tooltip-pos="top|bottom|left|
// right", default top) shows its text on hover or keyboard focus.
//
// The bubble is ONE element on <body>, position:fixed, above every other layer (modals,
// drawers, toasts). The old version drew the bubble as a ::after on the host, which got
// cut off by any scrolling table, card or modal body around it, and slid under sticky
// headers and neighbouring stacking contexts. Living on <body> it cannot be clipped, and
// it is placed against the viewport: the preferred side is used when it fits, otherwise
// the opposite side, and it is always nudged back inside the window.

const GAP = 8;        // host ↔ bubble
const MARGIN = 8;     // bubble ↔ viewport edge
const SHOW_DELAY = 120;
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * Where to put a bubble of `tip` size next to `host`, inside `viewport`.
 * Pure, so it is unit-tested without a DOM.
 * @param {{left:number, top:number, right:number, bottom:number, width:number, height:number}} host
 * @param {{width:number, height:number}} tip
 * @param {{width:number, height:number}} viewport
 * @param {'top'|'bottom'|'left'|'right'} [preferred]
 * @returns {{left:number, top:number, placement:string, arrow:number}} arrow is the offset
 *   of the arrow along the bubble's edge, so it still points at the host after clamping.
 */
export function placeTooltip(host, tip, viewport, preferred = 'top') {
  const fits = {
    top: host.top - GAP - tip.height >= MARGIN,
    bottom: host.bottom + GAP + tip.height <= viewport.height - MARGIN,
    left: host.left - GAP - tip.width >= MARGIN,
    right: host.right + GAP + tip.width <= viewport.width - MARGIN
  };
  const order = [preferred, OPPOSITE[preferred], 'top', 'bottom', 'right', 'left'];
  const placement = order.find(p => fits[p]) || 'top';

  const cx = host.left + host.width / 2;
  const cy = host.top + host.height / 2;
  let left;
  let top;
  if (placement === 'top' || placement === 'bottom') {
    top = placement === 'top' ? host.top - GAP - tip.height : host.bottom + GAP;
    left = clamp(cx - tip.width / 2, MARGIN, viewport.width - MARGIN - tip.width);
  } else {
    left = placement === 'left' ? host.left - GAP - tip.width : host.right + GAP;
    top = clamp(cy - tip.height / 2, MARGIN, viewport.height - MARGIN - tip.height);
  }
  top = clamp(top, MARGIN, viewport.height - MARGIN - tip.height);

  const arrow = placement === 'top' || placement === 'bottom'
    ? clamp(cx - left, 10, tip.width - 10)
    : clamp(cy - top, 8, tip.height - 8);
  return { left: Math.round(left), top: Math.round(top), placement, arrow: Math.round(arrow) };
}

let bubble = null;
let current = null;
let timer = null;

function ensureBubble() {
  if (bubble && bubble.isConnected) return bubble;
  bubble = document.createElement('div');
  bubble.className = 'relay-tooltip';
  bubble.setAttribute('role', 'tooltip');
  bubble.id = 'relay-tooltip';
  bubble.innerHTML = '<span class="relay-tooltip-text"></span><span class="relay-tooltip-arrow"></span>';
  document.body.appendChild(bubble);
  return bubble;
}

function show(host) {
  const text = (host.getAttribute('data-tooltip') || '').trim();
  if (!text || !host.isConnected) return;
  const el = ensureBubble();
  el.querySelector('.relay-tooltip-text').textContent = text;
  // Measure off-screen at its natural size before placing.
  el.style.left = '-9999px';
  el.style.top = '-9999px';
  el.classList.remove('is-visible');
  const r = host.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return;
  const tip = el.getBoundingClientRect();
  const pos = placeTooltip(r, { width: tip.width, height: tip.height },
    { width: window.innerWidth, height: window.innerHeight },
    host.getAttribute('data-tooltip-pos') || 'top');
  el.dataset.placement = pos.placement;
  el.style.left = `${pos.left}px`;
  el.style.top = `${pos.top}px`;
  el.style.setProperty('--arrow', `${pos.arrow}px`);
  host.setAttribute('aria-describedby', 'relay-tooltip');
  el.classList.add('is-visible');
}

function hide() {
  clearTimeout(timer);
  timer = null;
  if (current) current.removeAttribute('aria-describedby');
  current = null;
  if (bubble) bubble.classList.remove('is-visible');
}

function enter(host) {
  if (host === current) return;
  hide();
  current = host;
  timer = setTimeout(() => { if (current === host) show(host); }, SHOW_DELAY);
}

/** Install the delegated listeners once for the whole app. */
export function initTooltips() {
  if (typeof document === 'undefined' || document.documentElement.dataset.tooltipsReady) return;
  document.documentElement.dataset.tooltipsReady = '1';

  // Pointer rather than mouse events: Chromium does not send mouse events to disabled
  // controls, and a disabled button is exactly where a tooltip saying why is needed.
  document.addEventListener('pointerover', (e) => {
    const host = e.target.closest?.('[data-tooltip]');
    if (host) enter(host);
    else if (current) hide();
  });
  document.addEventListener('pointerout', (e) => {
    if (!current) return;
    const to = e.relatedTarget;
    if (!to || !current.contains(to)) {
      const next = to && to.closest?.('[data-tooltip]');
      if (next) enter(next); else hide();
    }
  });
  document.addEventListener('focusin', (e) => {
    const host = e.target.closest?.('[data-tooltip]');
    if (host) enter(host);
  });
  document.addEventListener('focusout', hide);
  // Anything that moves or replaces the host makes a placed bubble wrong.
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('scroll', hide, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('resize', hide);
  window.addEventListener('hashchange', hide);
}

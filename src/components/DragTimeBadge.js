// ============================================
// RELAY — DRAG TIME BADGE
// ============================================
// While a block is held on the schedule, the hour gutter is on the far side of a
// board that can be several screens wide, and the ghost hides the gridlines it
// passes over. This badge follows the block with the snapped start and finish,
// so a drop can be lined up from the block itself instead of by tracing a guide
// line across the calendar.
//
// It lives on <body> at a fixed position: the calendar scrolls in both
// directions and clips its own children. It is placed above the dragged block,
// clear of the native drag image — which no z-index can cover.

export const DRAG_TIME_BADGE_ID = 'schedule-drag-time';

/**
 * Where the badge should sit for a pointer at (clientX, clientY).
 *
 * Above the top edge of the held block: the drag ghost tracks the pointer with
 * the grab offset, so `clientY - offsetY` is that edge. Clamped so the badge
 * never leaves the viewport.
 *
 * @param {{ clientX: number, clientY: number, offsetY?: number, width: number, height: number,
 *           viewportWidth: number, viewportHeight: number, gap?: number }} opts
 * @returns {{ top: number, left: number }}
 */
export function dragBadgePosition({ clientX, clientY, offsetY = 0, width, height, viewportWidth, viewportHeight, gap = 8 }) {
  const top = Math.max(gap, clientY - offsetY - height - gap);
  const maxLeft = Math.max(gap, viewportWidth - width - gap);
  const left = Math.min(Math.max(gap, clientX - width / 2), maxLeft);
  // viewportHeight is accepted so the caller can pass it and future clamping
  // (e.g. flipping below the block) does not have to change the signature.
  void viewportHeight;
  return { top: Math.round(top), left: Math.round(left) };
}

function badgeEl() {
  let el = document.getElementById(DRAG_TIME_BADGE_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = DRAG_TIME_BADGE_ID;
  el.className = 'schedule-drag-time';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  return el;
}

/**
 * Show or move the badge.
 * @param {{ clientX: number, clientY: number, offsetY?: number, range: string, meta?: string }} opts
 *   `range` and `meta` are pre-formatted — this module has no opinion on how a
 *   time of day or a date is written.
 */
export function showDragTimeBadge({ clientX, clientY, offsetY = 0, range, meta = '' }) {
  if (typeof document === 'undefined') return;
  const el = badgeEl();
  const html = `<span class="schedule-drag-time-range">${range}</span>${meta ? `<span class="schedule-drag-time-meta">${meta}</span>` : ''}`;
  if (el.innerHTML !== html) el.innerHTML = html;

  // Measured rather than assumed: the range widens with the hour count and the
  // meta line varies (day name, duration).
  el.style.visibility = 'hidden';
  el.classList.add('is-visible');
  const { width, height } = el.getBoundingClientRect();
  const { top, left } = dragBadgePosition({
    clientX,
    clientY,
    offsetY,
    width,
    height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });

  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
  el.style.visibility = '';
}

export function hideDragTimeBadge() {
  if (typeof document === 'undefined') return;
  document.getElementById(DRAG_TIME_BADGE_ID)?.remove();
}

// A drag can end on a column, outside the board, or on the browser chrome, and
// the page resets its own drag state in several places. Cleaning up on the
// document's own dragend/drop keeps the badge from outliving any of them.
if (typeof document !== 'undefined') {
  document.addEventListener('dragend', hideDragTimeBadge);
  document.addEventListener('drop', hideDragTimeBadge, true);
}

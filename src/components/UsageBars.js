// Usage bars for the daily AI allowance: one for this seat, one for the whole
// company pool.
//
// Both numbers come from the server (`relay-copilot?action=usage`) rather than
// being calculated here, because the limits live in the edge function's
// environment and the usage ledger is not readable from the browser. The server
// derives its figures from the same arithmetic that decides whether the next
// message is allowed, so a bar can never disagree with a limit message.
//
// Callers drop `<div data-usage-bars></div>` where the bars should appear, then
// call `refreshUsageBars()`. The placeholder stays empty whenever a snapshot is
// unavailable - an offline or non-Cloud workspace must show nothing rather than
// a confident 0%.
import { fetchUsage, formatLocalReset } from '../utils/aiEngine.js';
import { escapeHTML } from '../utils/security.js';

// Last good snapshot, so a bar can be painted synchronously during a re-render
// instead of flashing in a moment later.
let snapshot = null;

function meterLabel(meter) {
  // A cap smaller than one message rounds to "0 of 0 messages", which reads as
  // nonsense, so fall back to the raw call count for such a tiny allowance.
  if (meter.limitMessages < 1) {
    return `${meter.usedUnits} of ${meter.limitUnits} AI credits`;
  }
  return `${meter.usedMessages} of ${meter.limitMessages} messages`;
}

function meterRemaining(meter) {
  if (meter.limitMessages < 1) {
    const left = meter.remainingUnits;
    return `${left} AI credit${left === 1 ? '' : 's'} left`;
  }
  const left = meter.remainingMessages;
  if (left <= 0) return 'No messages left today';
  return `${left} message${left === 1 ? '' : 's'} left`;
}

function meterHtml({ label, meter }) {
  // Coerced rather than trusted: the snapshot arrives over the network, and this
  // value lands in a style attribute and in aria-valuenow.
  const percent = Math.max(0, Math.min(100, Math.round(Number(meter.percent) || 0)));
  const fill = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'ok';
  const text = meterLabel(meter);
  return `
    <div class="usage-meter">
      <div class="usage-meter-head">
        <span class="usage-meter-label">${escapeHTML(label)}</span>
        <span class="usage-meter-count">${escapeHTML(text)}</span>
      </div>
      <div class="usage-meter-track" role="progressbar" aria-label="${escapeHTML(label)}"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"
           aria-valuetext="${escapeHTML(text)}">
        <div class="usage-meter-fill usage-meter-fill--${fill}" style="width:${percent}%"></div>
      </div>
      <div class="usage-meter-foot">${escapeHTML(meterRemaining(meter))}</div>
    </div>`;
}

// The HTML for both bars, or '' when there is nothing trustworthy to show.
export function usageBarsHtmlFor(snap) {
  if (!snap || !snap.user || !snap.company) return '';
  const reset = snap.resetsAt ? `Resets ${formatLocalReset(snap.resetsAt)}` : null;
  // A blocked scope is stated plainly, so the bar explains the limit message the
  // user is about to see instead of just looking full.
  const note = snap.blocked === 'user'
    ? 'Your daily allowance is used up'
    : snap.blocked === 'company'
      ? "Your team's daily allowance is used up"
      : reset;
  return `
    <div class="usage-bars">
      ${meterHtml({ label: 'Your usage today', meter: snap.user })}
      ${meterHtml({ label: "Today's team usage", meter: snap.company })}
    </div>
    ${note ? `<div class="usage-bars-foot${snap.blocked ? ' usage-bars-foot--blocked' : ''}">${escapeHTML(note)}</div>` : ''}`;
}

// The same HTML for the last good snapshot. Safe to call during any render: it
// never fetches and never throws.
export function usageBarsHtml() {
  return usageBarsHtmlFor(snapshot);
}

// Repaint every placeholder currently in the DOM (the chat panel and the billing
// tab can both be mounted at once).
export function paintUsageBars(root = document) {
  const html = usageBarsHtml();
  root.querySelectorAll('[data-usage-bars]').forEach((el) => { el.innerHTML = html; });
}

// Fetch a fresh snapshot and repaint. Resolves once the DOM is current; never
// rejects, so callers can fire it without a catch.
export async function refreshUsageBars(root = document) {
  const fresh = await fetchUsage();
  // A failed refresh keeps the last good figures: a slightly stale bar is less
  // confusing than bars that vanish and come back.
  if (fresh) snapshot = fresh;
  paintUsageBars(root);
}

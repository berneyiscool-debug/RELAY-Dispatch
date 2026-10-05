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
//
// Two shapes are rendered. The default carries a heading per meter (the name and
// the percentage) for a host that has the room and wants the figures, such as the
// billing card. A host marked `data-usage-bars="bare"` - the chat panel - gets the
// tracks alone, because there the pair is a glanceable check rather than a
// readout: the numbers are still there in `aria-valuetext` and, since a bare track
// has no visible name, on its `title`; the refusal message states the count-free
// position and the reset time at the moment either one matters.
//
// A meter is drawn as a percentage, never as a count. The ledger counts billable
// calls and one chat message costs a variable number of them (four to nine in
// production, not the two an older constant assumed), so any "N messages left"
// figure would be a guess presented as a count. A percentage of the cap is the
// one number that stays true whatever a message costs.
import { fetchUsage, formatLocalReset } from '../utils/aiEngine.js';
import { escapeHTML } from '../utils/security.js';

// Last good snapshot, so a bar can be painted synchronously during a re-render
// instead of flashing in a moment later.
let snapshot = null;

function meterHtml({ label, meter, bare }) {
  // Coerced rather than trusted: the snapshot arrives over the network, and this
  // value lands in a style attribute and in aria-valuenow.
  const percent = Math.max(0, Math.min(100, Math.round(Number(meter.percent) || 0)));
  const fill = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'ok';
  // Escaped once, then reused: the name reaches the two aria attributes, the
  // text node of the heading, and the title when the heading is absent.
  const name = escapeHTML(label);
  const said = `${name}: ${percent}% used`;
  // Bare drops the heading, so the title is the only way to tell the two bars
  // apart with a pointer. Labelled keeps its bytes exactly as they were.
  const head = bare ? '' : `
      <div class="usage-meter-head">
        <span class="usage-meter-label">${name}</span>
        <span class="usage-meter-count">${percent}%</span>
      </div>`;
  return `
    <div class="usage-meter"${bare ? ` title="${said}"` : ''}>${head}
      <div class="usage-meter-track" role="progressbar" aria-label="${name}"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"
           aria-valuetext="${said}">
        <div class="usage-meter-fill usage-meter-fill--${fill}" style="width:${percent}%"></div>
      </div>
    </div>`;
}

// The HTML for both bars, or '' when there is nothing trustworthy to show.
export function usageBarsHtmlFor(snap, { bare = false } = {}) {
  if (!snap || !snap.user || !snap.company) return '';
  const bars = `
    <div class="usage-bars">
      ${meterHtml({ label: 'Your usage today', meter: snap.user, bare })}
      ${meterHtml({ label: "Today's team usage", meter: snap.company, bare })}
    </div>`;
  // A bare host is a glanceable pair of tracks: the written position and reset
  // belong to the refusal message, which is already read at the moment it
  // matters, so nothing is added here that the bar width does not already say.
  if (bare) return bars;
  const reset = snap.resetsAt ? `Resets ${formatLocalReset(snap.resetsAt)}` : null;
  // A blocked scope is stated plainly, so the bar explains the limit message the
  // user is about to see instead of just looking full.
  const note = snap.blocked === 'user'
    ? 'Your daily allowance is used up'
    : snap.blocked === 'company'
      ? "Your team's daily allowance is used up"
      : reset;
  return `${bars}
    ${note ? `<div class="usage-bars-foot${snap.blocked ? ' usage-bars-foot--blocked' : ''}">${escapeHTML(note)}</div>` : ''}`;
}

// The same HTML for the last good snapshot. Safe to call during any render: it
// never fetches and never throws.
export function usageBarsHtml(options) {
  return usageBarsHtmlFor(snapshot, options);
}

// Repaint every placeholder currently in the DOM (the chat panel and the billing
// tab can both be mounted at once). Each host decides its own shape, because the
// same snapshot can be on screen in both places.
export function paintUsageBars(root = document) {
  root.querySelectorAll('[data-usage-bars]').forEach((el) => {
    el.innerHTML = usageBarsHtml({ bare: el.dataset.usageBars === 'bare' });
  });
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

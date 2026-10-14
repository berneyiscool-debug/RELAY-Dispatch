/**
 * Guards for the assistant's icon.
 *
 * The top bar used to render `deputy-icon.svg`, a hand-authored star that the
 * Help Centre told people to look for. The assistant is branded around brny
 * now, so the trigger renders the Lucide "Bot" glyph instead.
 *
 * Two things can silently break that: dropping `smart_toy` from the shim's MAP
 * (the span then falls back to the Material glyph while the rest of the app
 * shows Lucide) and pointing the key at a Lucide export that doesn't exist
 * (svgFor returns '' and convert leaves the span blank). Converting a fake span
 * exercises both, because the shim only swaps in an SVG it actually resolved.
 *
 * TopBar.js cannot be imported in node — it pulls in RelayAssistant.js, which
 * imports `?url` workers — so its markup is pinned by source text, the same way
 * RelayAssistant.agentTurn.test.js pins the assistant's answer path.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { applyLucideIcons } from './icons.js';

const TOPBAR = readFileSync(new URL('../components/TopBar.js', import.meta.url), 'utf8');

function fakeIconSpan(name) {
  const classes = new Set(['material-icons-outlined']);
  return {
    classList: {
      contains: (c) => classes.has(c),
      add: (c) => classes.add(c),
      values: () => [...classes].sort(),
    },
    textContent: name,
    innerHTML: '',
    dataset: {},
  };
}

test('smart_toy resolves to a real Lucide icon', () => {
  const span = fakeIconSpan('smart_toy');
  applyLucideIcons(span);

  assert.match(span.innerHTML, /^<svg /, 'expected the shim to swap in an SVG');
  assert.ok(span.innerHTML.length > 100, 'expected real Bot path data, not an empty SVG');
  assert.equal(span.dataset.licon, 'smart_toy');
  assert.deepEqual(span.classList.values(), ['licon', 'material-icons-outlined']);
});

test('an unmapped name is left as its Material glyph', () => {
  const span = fakeIconSpan('not_a_real_icon_name');
  applyLucideIcons(span);

  assert.equal(span.innerHTML, '');
  assert.deepEqual(span.classList.values(), ['material-icons-outlined']);
});

test('the top bar assistant trigger renders the Bot glyph', () => {
  assert.match(
    TOPBAR,
    /id="btn-relay-assistant"[\s\S]{0,400}?material-icons-outlined">smart_toy</,
  );
  assert.doesNotMatch(TOPBAR, /deputy-icon\.svg/, 'the star asset is no longer the assistant icon');
});

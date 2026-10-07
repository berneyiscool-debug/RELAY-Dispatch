/**
 * Derives the marketing site's preview bootstrap index from the capture
 * pipeline's full screen dataset.
 *
 * `screens.json` describes all 272 captured screens (202 KB). The homepage only
 * needs the 16 navigation-level screens (dashboard, schedule and the 14 lists)
 * to paint the hero preview and to serve list-to-list navigation — all of which
 * live in atlas 0. That subset is ~15 KB, so the page can render the preview
 * and respond to every top-level hotspot without fetching the full dataset.
 * The complete dataset is fetched lazily once a visitor reaches into a record,
 * which is the only time its 256 deeper screens are needed.
 *
 * Regenerate after the capture pipeline writes a new `screens.json`:
 *   npm run build:preview-index
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const previewDir = resolve(repoRoot, 'site/assets/preview');
const SOURCE = resolve(previewDir, 'screens.json');
const TARGET = resolve(previewDir, 'screens-index.json');

/** Screens whose keys have no ':' (dashboard, schedule) or one (L:jobs, ...). */
const NAV_DEPTH = 1;

const screens = JSON.parse(readFileSync(SOURCE, 'utf8'));
const index = {};

for (const [key, entry] of Object.entries(screens)) {
  if (key.split(':').length - 1 <= NAV_DEPTH) index[key] = entry;
}

const navKeys = Object.keys(index);
if (!navKeys.length) throw new Error(`No navigation screens found in ${SOURCE}`);

// The preview only ever loads atlas 0 on first paint; a navigation screen that
// lived elsewhere would need its atlas fetched before the hero could render.
const strayAtlases = navKeys.filter((key) => index[key][0] !== 0);
if (strayAtlases.length) {
  throw new Error(`Navigation screens outside atlas 0: ${strayAtlases.join(', ')}`);
}

writeFileSync(TARGET, JSON.stringify(index), 'utf8');

const hotspots = navKeys.reduce((n, key) => n + index[key][4].length, 0);
console.log(
  `screens-index.json: ${navKeys.length} screens, ${hotspots} hotspots, ` +
    `${readFileSync(TARGET).length} bytes (from ${Object.keys(screens).length} screens)`,
);

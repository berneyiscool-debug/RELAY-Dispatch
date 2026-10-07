// ============================================
// RELAY — PUBLISH THE WEB APP TO GITHUB PAGES
// ============================================
// GitHub Pages serves one directory, and the app has to sit under a path so the
// marketing site can own relaydispatch.com.au/. So the artifact is laid out as:
//
//   dist/**         the marketing site → https://relaydispatch.com.au/
//   dist/app/**     the app → https://relaydispatch.com.au/app/
//   dist/CNAME      the custom domain — Pages only reads it from the artifact root
//
// site/ is copied verbatim into the artifact root: it is already plain HTML, CSS
// and a little vanilla JS, so there is nothing to compile. scripts/og-card.html
// stays behind on purpose — it regenerates site/assets/img/og.png by hand.
//
// The site's download button resolves the newest desktop release at click time,
// so src/utils/desktopApp.js is shipped alongside it rather than bundled.
//
// The desktop build (npm run build) is untouched: it keeps base './' and writes
// dist/ so the packaged app can load itself over file://.
//
// Run with: npm run build:pages

import { cp, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { WEB_APP_PATH } from '../src/utils/webOrigin.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');
const appDir = path.join(distDir, 'app');
const siteDir = path.join(repoRoot, 'site');
const desktopAppSrc = path.join(repoRoot, 'src', 'utils', 'desktopApp.js');
const desktopAppDest = path.join(distDir, 'assets', 'desktopApp.js');

if (!existsSync(path.join(siteDir, 'index.html'))) {
  throw new Error(`Missing marketing site: ${siteDir}`);
}

// Vite empties dist on every build, so start clean rather than risk a stale
// dist/app surviving a failed run.
await rm(distDir, { recursive: true, force: true });

await build({
  root: repoRoot,
  // Trailing slash matters: the app's index.html has to be requested as /app/
  // for its relative asset URLs to resolve. Kept in step with
  // src/utils/webOrigin.js, which builds user-facing links on this same path.
  base: WEB_APP_PATH,
  build: {
    outDir: path.relative(repoRoot, appDir),
    emptyOutDir: true,
  },
});

// Pages reads the custom domain from the artifact root only, so lift the CNAME
// out of the app directory (public/ is copied into the build output).
const appCname = path.join(appDir, 'CNAME');
if (existsSync(appCname)) {
  const cname = path.join(distDir, 'CNAME');
  await rm(cname, { force: true });
  try {
    await rename(appCname, cname);
  } catch {
    // rename() fails across devices (e.g. a bind-mounted dist); copy instead.
    await cp(appCname, cname);
    await rm(appCname, { force: true });
  }
} else {
  console.warn('build-pages: no CNAME in the build output — the custom domain may not stick.');
}

// Marketing site: site/** becomes the artifact root, so its index.html is the
// root document. That page forwards legacy root-based app URLs (#/jobs/123) into
// /app itself, so no separate root shim is needed.
for (const entry of await readdir(siteDir)) {
  await cp(path.join(siteDir, entry), path.join(distDir, entry), { recursive: true });
}

// The download button imports this at runtime, so it has to be reachable as a
// sibling of the site's own scripts (assets/js/home.js → ../desktopApp.js).
await mkdir(path.dirname(desktopAppDest), { recursive: true });
await cp(desktopAppSrc, desktopAppDest);

console.log(`build-pages: site → ${path.relative(repoRoot, distDir)}${path.sep}`);
console.log(`build-pages: app → ${path.relative(repoRoot, appDir)}${path.sep} (served from ${WEB_APP_PATH})`);
console.log(`build-pages: ${path.relative(repoRoot, desktopAppDest)} left as a standalone module for the download button.`);
console.log('build-pages: CNAME lifted to the artifact root.');

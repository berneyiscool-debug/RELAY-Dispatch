// ============================================
// RELAY — PUBLISH THE WEB APP TO GITHUB PAGES
// ============================================
// GitHub Pages serves one directory, and the app has to sit under a path so the
// marketing site can own relaydispatch.com.au/. So the artifact is laid out as:
//
//   dist/app/**     the app → https://relaydispatch.com.au/app/
//   dist/index.html redirect for old root-based app URLs (relaydispatch.com.au/#/jobs/123)
//   dist/CNAME      the custom domain — Pages only reads it from the artifact root
//
// The desktop build (npm run build) is untouched: it keeps base './' and writes
// dist/ so the packaged app can load itself over file://.
//
// Run with: npm run build:pages

import { cp, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { WEB_APP_PATH } from '../src/utils/webOrigin.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');
const appDir = path.join(distDir, 'app');
const shim = path.join(repoRoot, 'scripts', 'pages-root-redirect.html');

if (!existsSync(shim)) throw new Error(`Missing redirect shim: ${shim}`);

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

// Root document: hands old root-based app URLs to /app.
await cp(shim, path.join(distDir, 'index.html'));

console.log(`build-pages: app → ${path.relative(repoRoot, appDir)}${path.sep} (served from ${WEB_APP_PATH})`);
console.log('build-pages: root index.html redirects to /app; CNAME lifted to the artifact root.');

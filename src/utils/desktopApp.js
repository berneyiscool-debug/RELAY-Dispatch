// ============================================
// RELAY — DESKTOP APP INSTALLER
// ============================================
// The web app links to the Windows installer published by the release workflow
// (see .github/workflows/desktop-release.yml). electron-builder names the asset
// with the version baked in (`RELAY-Dispatch-Setup-1.4.0.exe`), so there is no
// permanent "download the newest one" URL to hard-code — the newest release has
// to be looked up. If that lookup fails the caller falls back to the releases
// page, which always works.

/** Public GitHub repo the installer is published to (mirrors build.publish in package.json). */
export const DESKTOP_REPO = 'berneyiscool-debug/RELAY-Dispatch';

/** Human-readable releases page — the always-valid fallback. */
export const DESKTOP_RELEASES_URL = `https://github.com/${DESKTOP_REPO}/releases`;

const LATEST_RELEASE_API = `https://api.github.com/repos/${DESKTOP_REPO}/releases/latest`;

export const INSTALLER_CACHE_STORAGE_KEY = 'relay_desktop_installer_url';

/** How long a resolved installer URL is reused before asking GitHub again. */
export const INSTALLER_CACHE_TTL_MS = 60 * 60 * 1000;

// Unauthenticated GitHub API calls are limited to 60/hour per IP. Reusing a
// resolved URL keeps a shared office IP well clear of that, and a URL that goes
// stale inside the window still points at a real, downloadable release.
let memoryCache = null;

/** Drops the cached installer URL (tests, and after a fresh release is known). */
export function resetDesktopInstallerCache() {
  memoryCache = null;
  try {
    globalThis.localStorage?.removeItem(INSTALLER_CACHE_STORAGE_KEY);
  } catch {
    // localStorage can be unavailable (private mode, non-browser tooling).
  }
}

function readCache(now) {
  const entries = [memoryCache];
  try {
    const stored = globalThis.localStorage?.getItem(INSTALLER_CACHE_STORAGE_KEY);
    if (stored) entries.push(JSON.parse(stored));
  } catch {
    // Ignore unreadable persisted cache.
  }
  for (const entry of entries) {
    if (!entry || typeof entry.url !== 'string') continue;
    if (typeof entry.at === 'number' && now - entry.at < INSTALLER_CACHE_TTL_MS) {
      return entry.url;
    }
  }
  return null;
}

function writeCache(url, now) {
  memoryCache = { url, at: now };
  try {
    globalThis.localStorage?.setItem(INSTALLER_CACHE_STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Best effort only.
  }
}

/**
 * True when the bundle is running inside the packaged desktop app.
 *
 * Electron loads it with `loadFile`, so the page is on `file://` — the same
 * signal `webOrigin()` uses, where Chromium reports the origin as the string
 * "null". The download button is pointless there, so the UI hides it.
 */
export function isDesktopBuild() {
  const loc = typeof location !== 'undefined' ? location : null;
  if (!loc) return false;
  if (typeof loc.protocol === 'string' && loc.protocol) return loc.protocol === 'file:';
  return !/^https?:\/\//i.test(typeof loc.origin === 'string' ? loc.origin : '');
}

/**
 * The Windows installer attached to a GitHub release, or null if it carries
 * none. Drafts and pre-releases are ignored, mirroring `releases/latest`, which
 * is what installed builds update from.
 */
export function pickWindowsInstaller(release) {
  if (!release || release.draft || release.prerelease) return null;
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const installer = assets.find((asset) => {
    const name = typeof asset?.name === 'string' ? asset.name : '';
    const state = asset?.state;
    return /\.exe$/i.test(name) && (!state || state === 'uploaded');
  });
  return installer?.browser_download_url || null;
}

/**
 * Direct URL of the newest published Windows installer, or null when there
 * isn't one to hand out (no published release with assets yet, or GitHub is
 * unreachable). Never throws — callers show `DESKTOP_RELEASES_URL` instead.
 */
export async function resolveInstallerUrl(options = {}) {
  const { fetchImpl, now = Date.now() } = options;

  const cached = readCache(now);
  if (cached) return cached;

  const request = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!request) return null;

  try {
    const response = await request(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response?.ok) return null;

    const url = pickWindowsInstaller(await response.json());
    if (!url) return null;

    writeCache(url, now);
    return url;
  } catch {
    return null;
  }
}

/**
 * Start the installer download without navigating away. GitHub serves release
 * assets with `Content-Disposition: attachment`, so the browser saves the file
 * rather than opening it.
 */
export function downloadInstaller(url) {
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Wires a download anchor to the newest installer, so the login screen and My
 * Profile behave identically. `labelEl` shows progress and is restored after.
 * Returns a detach function.
 */
export function bindInstallerDownload(anchorEl, labelEl) {
  if (!anchorEl) return () => {};

  const handleClick = async (event) => {
    event.preventDefault();
    if (anchorEl.getAttribute('aria-busy') === 'true') return;

    const originalLabel = labelEl ? labelEl.textContent : '';
    anchorEl.setAttribute('aria-busy', 'true');
    if (labelEl) labelEl.textContent = 'Preparing download…';

    try {
      const installerUrl = await resolveInstallerUrl();
      if (installerUrl) {
        downloadInstaller(installerUrl);
      } else {
        // Nothing published to hand out yet, or GitHub is unreachable. Navigate
        // rather than open a tab, which a popup blocker may kill.
        window.location.assign(DESKTOP_RELEASES_URL);
      }
    } finally {
      anchorEl.removeAttribute('aria-busy');
      if (labelEl) labelEl.textContent = originalLabel;
    }
  };

  anchorEl.addEventListener('click', handleClick);
  return () => anchorEl.removeEventListener('click', handleClick);
}

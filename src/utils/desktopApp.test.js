import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

const {
  DESKTOP_RELEASES_URL,
  INSTALLER_CACHE_STORAGE_KEY,
  INSTALLER_CACHE_TTL_MS,
  isDesktopBuild,
  pickWindowsInstaller,
  resolveInstallerUrl,
  resetDesktopInstallerCache,
  downloadInstaller,
  bindInstallerDownload,
} = await import('./desktopApp.js');

const RELEASE = {
  draft: false,
  prerelease: false,
  assets: [
    { name: 'latest.yml', state: 'uploaded', browser_download_url: 'https://example.test/latest.yml' },
    {
      name: 'RELAY-Dispatch-Setup-1.4.0.exe',
      state: 'uploaded',
      browser_download_url: 'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe',
    },
    {
      name: 'RELAY-Dispatch-Setup-1.4.0.exe.blockmap',
      state: 'uploaded',
      browser_download_url: 'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe.blockmap',
    },
  ],
};

function location(value) {
  if (value === undefined) delete globalThis.location;
  else globalThis.location = value;
}

function storageStub() {
  const items = new Map();
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
}

describe('isDesktopBuild', () => {
  afterEach(() => location(undefined));

  test('is true for the packaged app, which loads from file://', () => {
    location({ protocol: 'file:', origin: 'null' });
    assert.strictEqual(isDesktopBuild(), true);
  });

  test('is false on the hosted web app', () => {
    location({ protocol: 'https:', origin: 'https://relaydispatch.com.au' });
    assert.strictEqual(isDesktopBuild(), false);
  });

  test('is false on the local dev server', () => {
    location({ protocol: 'http:', origin: 'http://localhost:5173' });
    assert.strictEqual(isDesktopBuild(), false);
  });

  test('falls back to the origin when no protocol is reported', () => {
    location({ origin: 'null' });
    assert.strictEqual(isDesktopBuild(), true);
    location({ origin: 'https://relaydispatch.com.au' });
    assert.strictEqual(isDesktopBuild(), false);
  });

  test('is false when location is unavailable', () => {
    location(undefined);
    assert.strictEqual(isDesktopBuild(), false);
  });
});

describe('pickWindowsInstaller', () => {
  test('returns the installer, not the blockmap or the update manifest', () => {
    assert.strictEqual(
      pickWindowsInstaller(RELEASE),
      'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe',
    );
  });

  test('ignores drafts and pre-releases, matching releases/latest', () => {
    assert.strictEqual(pickWindowsInstaller({ ...RELEASE, draft: true }), null);
    assert.strictEqual(pickWindowsInstaller({ ...RELEASE, prerelease: true }), null);
  });

  test('returns null when the release has no assets', () => {
    assert.strictEqual(pickWindowsInstaller({ ...RELEASE, assets: [] }), null);
    assert.strictEqual(pickWindowsInstaller({ draft: false }), null);
    assert.strictEqual(pickWindowsInstaller(null), null);
  });

  test('accepts an asset whose upload state is not reported', () => {
    const assets = [{ name: 'RELAY-Dispatch-Setup-1.4.0.exe', browser_download_url: 'https://example.test/a.exe' }];
    assert.strictEqual(pickWindowsInstaller({ ...RELEASE, assets }), 'https://example.test/a.exe');
  });

  test('skips an installer that is not finished uploading', () => {
    const assets = [{ name: 'RELAY-Dispatch-Setup-1.4.0.exe', state: 'new', browser_download_url: 'https://example.test/a.exe' }];
    assert.strictEqual(pickWindowsInstaller({ ...RELEASE, assets }), null);
  });
});

describe('resolveInstallerUrl', () => {
  beforeEach(() => {
    resetDesktopInstallerCache();
    delete globalThis.localStorage;
  });

  afterEach(() => {
    resetDesktopInstallerCache();
    delete globalThis.localStorage;
  });

  test('resolves the newest installer from the GitHub release', async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => RELEASE });
    const url = await resolveInstallerUrl({ fetchImpl });
    assert.strictEqual(url, 'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe');
  });

  test('does not ask GitHub twice for the same installer', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: true, json: async () => RELEASE };
    };
    const now = 1_000;
    await resolveInstallerUrl({ fetchImpl, now });
    await resolveInstallerUrl({ fetchImpl, now });
    assert.strictEqual(calls, 1);
  });

  test('persists the resolved URL for the next visit', async () => {
    globalThis.localStorage = storageStub();
    const fetchImpl = async () => ({ ok: true, json: async () => RELEASE });
    await resolveInstallerUrl({ fetchImpl, now: 1_000 });
    assert.deepStrictEqual(
      JSON.parse(globalThis.localStorage.getItem(INSTALLER_CACHE_STORAGE_KEY)),
      { url: 'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe', at: 1_000 },
    );
  });

  test('reuses a URL persisted by an earlier visit without asking GitHub', async () => {
    globalThis.localStorage = storageStub();
    globalThis.localStorage.setItem(
      INSTALLER_CACHE_STORAGE_KEY,
      JSON.stringify({ url: 'https://example.test/cached.exe', at: Date.now() }),
    );
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: true, json: async () => RELEASE };
    };
    assert.strictEqual(await resolveInstallerUrl({ fetchImpl }), 'https://example.test/cached.exe');
    assert.strictEqual(calls, 0);
  });

  test('asks GitHub again once the cached URL has expired', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: true, json: async () => RELEASE };
    };
    await resolveInstallerUrl({ fetchImpl, now: 1_000 });
    await resolveInstallerUrl({ fetchImpl, now: 1_000 + INSTALLER_CACHE_TTL_MS + 1 });
    assert.strictEqual(calls, 2);
  });

  test('returns null so the caller can fall back to the releases page', async () => {
    const noAssets = async () => ({ ok: true, json: async () => ({ ...RELEASE, assets: [] }) });
    const notFound = async () => ({ ok: false, json: async () => ({}) });
    const offline = async () => {
      throw new Error('offline');
    };
    const malformed = async () => ({ ok: true, json: async () => undefined });

    assert.strictEqual(await resolveInstallerUrl({ fetchImpl: noAssets }), null);
    assert.strictEqual(await resolveInstallerUrl({ fetchImpl: notFound }), null);
    assert.strictEqual(await resolveInstallerUrl({ fetchImpl: offline }), null);
    assert.strictEqual(await resolveInstallerUrl({ fetchImpl: malformed }), null);
  });

  test('exposes the releases page as the fallback destination', () => {
    assert.strictEqual(
      DESKTOP_RELEASES_URL,
      'https://github.com/berneyiscool-debug/RELAY-Dispatch/releases',
    );
  });
});

describe('downloadInstaller', () => {
  test('clicks a temporary link so the browser saves the file', () => {
    const created = [];
    const appended = [];
    const originalDocument = globalThis.document;
    globalThis.document = {
      createElement: () => {
        const link = { style: {}, clicks: 0, removed: 0, click() { this.clicks += 1; }, remove() { this.removed += 1; } };
        created.push(link);
        return link;
      },
      body: { appendChild: (node) => appended.push(node) },
    };

    try {
      downloadInstaller('https://example.test/RELAY-Dispatch-Setup-1.4.0.exe');
    } finally {
      globalThis.document = originalDocument;
    }

    assert.strictEqual(created.length, 1);
    assert.strictEqual(created[0].href, 'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe');
    assert.strictEqual(created[0].style.display, 'none');
    assert.strictEqual(appended.length, 1);
    assert.strictEqual(created[0].clicks, 1);
    assert.strictEqual(created[0].removed, 1);
  });
});

describe('bindInstallerDownload', () => {
  const makeAnchor = () => {
    const listeners = new Map();
    return {
      listeners,
      attrs: {},
      addEventListener(type, handler) {
        listeners.set(type, handler);
      },
      removeEventListener(type) {
        listeners.delete(type);
      },
      getAttribute(name) {
        return this.attrs[name] ?? null;
      },
      setAttribute(name, value) {
        this.attrs[name] = value;
      },
      removeAttribute(name) {
        delete this.attrs[name];
      },
    };
  };

  beforeEach(() => {
    resetDesktopInstallerCache();
  });

  afterEach(() => {
    delete globalThis.fetch;
    delete globalThis.window;
  });

  test('resolves the newest installer and restores the label when done', async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => RELEASE });
    const created = [];
    const originalDocument = globalThis.document;
    globalThis.document = {
      createElement: () => {
        const link = { style: {}, clicks: 0, click() { this.clicks += 1; }, remove() {} };
        created.push(link);
        return link;
      },
      body: { appendChild: () => {} },
    };

    const anchor = makeAnchor();
    const label = { textContent: 'Download for Windows' };
    try {
      bindInstallerDownload(anchor, label);
      await anchor.listeners.get('click')({ preventDefault() {} });
    } finally {
      globalThis.document = originalDocument;
    }

    assert.strictEqual(created.length, 1);
    assert.strictEqual(created[0].href, 'https://example.test/RELAY-Dispatch-Setup-1.4.0.exe');
    assert.strictEqual(label.textContent, 'Download for Windows');
    assert.strictEqual(anchor.getAttribute('aria-busy'), null);
  });

  test('falls back to the releases page when no installer can be resolved', async () => {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
    const assigned = [];
    globalThis.window = { location: { assign: (url) => assigned.push(url) } };

    const anchor = makeAnchor();
    bindInstallerDownload(anchor, null);
    await anchor.listeners.get('click')({ preventDefault() {} });

    assert.deepStrictEqual(assigned, [DESKTOP_RELEASES_URL]);
  });

  test('is a no-op when the link is not on the page', () => {
    assert.doesNotThrow(() => bindInstallerDownload(null, null));
  });
});

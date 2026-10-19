// ============================================
// RELAY — CAPTURE THE MARKETING SITE SCREENSHOTS
// ============================================
// Renders the app in demo mode (the Harbourline Electrical & Air dataset, see
// src/data/demoDataset.js) in a 1440×900 Electron window and saves each
// screen to site/assets/screens/ as WebP at two widths:
//
//   <name>.webp       2160px wide, for the large slots on retina screens
//   <name>-1080.webp  1080px wide, for phones and 1× screens
//
// The demo is dated relative to today, so re-running this after an app change
// gives current screens with current-looking data.
//
// Run with the dev server up (npm run dev), then:
//   npm run capture:screens [-- http://localhost:5173/]

const { app, BrowserWindow } = require('electron');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const BASE_URL = process.argv.find((arg) => /^https?:\/\//.test(arg)) || 'http://localhost:5173/';
const OUT_DIR = path.resolve(__dirname, '..', 'site', 'assets', 'screens');
const WIDTH = 1440;
const HEIGHT = 900;
// [output width, file suffix]. Rendered at 1.5×, so 2160 is a 1:1 capture.
const SIZES = [[2160, ''], [1080, '-1080']];
const SCALE = 1.5;
const QUALITY = 86;

// The dashboard's Technician Map needs a Google Maps key baked into the build
// and shows an error note without one, so when it is unconfigured the map goes
// and Recent Leads widens into its slot. Then the board is fitted to the frame.
const DASHBOARD = `
  const widgetOf = (title) => [...document.querySelectorAll('.dash-widget')]
    .find((w) => w.querySelector('.card-header')?.textContent.includes(title));
  const map = widgetOf('Technician Map');
  if (map && /Map unavailable/.test(map.textContent)) {
    const leads = widgetOf('Recent Leads');
    if (leads) leads.style.width = (map.offsetLeft + map.offsetWidth - leads.offsetLeft) + 'px';
    map.remove();
  }
  document.querySelector('button[title^="Reset view"]')?.click();
`;

// Today, one column per crew member, rather than a week that opens on days
// already invoiced.
const SCHEDULE = `
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Day')?.click();
`;

// Which record a given id holds depends on the day the demo is built for, so
// detail screens pick their record by what it is. This reads the store through
// the dev server's module URL, which is why the script needs `npm run dev`.
const pick = (collection, filter, sort) => `
  import('/src/data/store.js').then(({ store }) => {
    const rows = store.getAll(${JSON.stringify(collection)}).filter(${filter}).sort(${sort});
    return rows[0] && rows[0].id;
  })
`;

// [file name, route or a page script resolving to a record id, the route
// pattern that id goes into, extra page script].
const SHOTS = [
  ['dashboard', '#/', null, DASHBOARD],
  ['schedule', '#/schedule', null, SCHEDULE],
  ['job', pick('jobs', "(j) => j.status === 'In Progress' && j.quoteId", '(a, b) => (b.estimatedHours || 0) - (a.estimatedHours || 0)'), '#/jobs/{id}?tab=financials'],
  ['quote', pick('quotes', "(q) => q.status === 'Sent'", '(a, b) => b.total - a.total'), '#/quotes/{id}'],
  ['reports', '#/reports'],
];

// The demo is dated relative to the day it loads (src/data/demoDataset.js), so
// a weekend run would show an empty Today. The page clock is pinned to the most
// recent weekday at 10:30, which keeps every run looking like a working day.
const PIN_CLOCK = `(() => {
  const RealDate = Date;
  const pinned = new RealDate();
  while (pinned.getDay() === 0 || pinned.getDay() === 6) pinned.setDate(pinned.getDate() - 1);
  pinned.setHours(10, 30, 0, 0);
  const offset = pinned.getTime() - RealDate.now();
  class PinnedDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [RealDate.now() + offset])); }
    static now() { return RealDate.now() + offset; }
  }
  globalThis.Date = PinnedDate;
})();`;

// A local owner session (id must be `<companyId>_admin`, see src/main.js) with
// the per-tab demo flag set (src/utils/demoSession.js). The window uses an
// in-memory partition, so none of this outlives the run.
const SESSION_SETUP = `
  localStorage.setItem('relay_login_mode', 'local');
  localStorage.setItem('currentUser', JSON.stringify({
    id: 'acct_capture_admin', name: 'Mick Harbour', role: 'admin',
    companyId: 'acct_capture', userTypeId: 'acct_capture_ut_admin',
  }));
  sessionStorage.setItem('relay_demo_mode', '1');
`;

// The demo banner is a reminder for people inside the demo, not part of the
// product, so it stays out of the marketing shots.
const TIDY = `
  document.getElementById('relay-demo-banner')?.remove();
  document.activeElement?.blur();
`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  // A real window is clamped to the screen it would open on, so the layout
  // size comes from DevTools device emulation instead, which also lets
  // Chromium encode the WebP directly at each output width. The window has to
  // be shown for Chromium to paint the frames a screenshot waits on, so it
  // opens off-screen rather than hidden.
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: -WIDTH * 3,
    y: 0,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: { partition: 'relay-capture', backgroundThrottling: false },
  });
  await win.loadURL(BASE_URL);
  await win.webContents.executeJavaScript(SESSION_SETUP);

  // Attaching before the first page has loaded crashes Electron 42.
  const cdp = win.webContents.debugger;
  cdp.attach('1.3');
  await cdp.sendCommand('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false,
  });
  await cdp.sendCommand('Page.enable');
  await cdp.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: PIN_CLOCK });

  await win.loadURL(BASE_URL);
  await wait(3000);

  const viewport = await win.webContents.executeJavaScript('[innerWidth, innerHeight]');
  if (viewport[0] !== WIDTH || viewport[1] !== HEIGHT) {
    throw new Error(`Expected a ${WIDTH}×${HEIGHT} layout, got ${viewport.join('×')}`);
  }

  for (const [name, route, pattern, prepare = ''] of SHOTS) {
    let hash = route;
    if (pattern) {
      const id = await win.webContents.executeJavaScript(route);
      if (!id) throw new Error(`No demo record matched for the ${name} screen`);
      hash = pattern.replace('{id}', id);
    }
    await win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)}`);
    await wait(2500);
    await win.webContents.executeJavaScript(`document.fonts.ready.then(() => { ${TIDY} ${prepare} })`);
    await wait(800);

    for (const [width, suffix] of SIZES) {
      const { data } = await cdp.sendCommand('Page.captureScreenshot', {
        format: 'webp',
        quality: QUALITY,
        clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: width / (WIDTH * SCALE) },
      });
      const file = path.join(OUT_DIR, `${name}${suffix}.webp`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`${path.relative(process.cwd(), file)}  (${width}w)`);
    }
  }

  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});

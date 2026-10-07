# RELAY — Dispatch

**Free, offline-first field-service management for Australian trade businesses.**

The free answer to bloated, overpriced trade software. No per-seat fees, no
lock-in, and it works where your job is — not where the wifi is.

---

## Why RELAY exists

Every major field-service platform charges a monthly fee *per user* and falls
over the moment you lose signal — in a basement, a plant room, or anywhere
regional. RELAY flips both:

- **Free, forever, in local mode.** Run the whole business — jobs, quotes,
  invoices, scheduling, stock — without paying a cent or creating an account.
- **Offline-first.** Your data lives on your machine; the app works with no
  internet at all. The cloud is optional, not a hostage situation.
- **Australian by default.** GST, ABN, AS/NZS compliance and SWMS are built in,
  not bolted on.
- **Your data is yours.** Local data is stored on your device. Export anytime.
  No vendor lock-in.

## What it does

**Sales & jobs**
- CRM — customers with multiple contacts, sites, and equipment; lead pipeline
  with weighted forecasting and one-click convert-to-quote
- Quotes — multi-section builder, line items, kit insertion with margin
  control, versioning, email-with-tracking, accept/decline
- Jobs — hierarchical task lists, progress rollup, materials & costs, activity
  timeline, attachments, recurring schedules, create-invoice
- Invoices — progress & deposit billing, credit notes, payment tracking,
  overdue reminders
- **PDF export** for quotes and invoices (branded, print-ready)

**Scheduling & time**
- Drag-and-drop calendar (day/week), technician rows, conflict detection
- Recurring job scheduling and an activity calendar
- Timesheets with an approval workflow and payroll-ready CSV export

**Inventory & resources**
- Stock with multi-location tracking, transfers, reorder alerts, CSV import,
  and barcode label printing
- Purchase orders with receive-into-stock and job cost allocation
- Reusable kits (materials + labour) with target-margin override
- Asset registry with meter tracking, service logs, and a maintenance engine
  that auto-generates jobs from meter- or calendar-based plans (with smart
  collision merging)

**Office & field**
- Drag-and-drop digital form builder (safety audits, inspections, checklists)
- Document centre with role-based folders and auto-indexed attachments
- Reports & analytics (P&L by job, revenue by customer, tech productivity)
  with CSV export
- Role-based permissions (Admin / Manager / Office / Technician) on cloud
  accounts
- Light appearance only at launch; dark mode follows in a later release

**Cloud mode (optional, paid)**
Adds only what genuinely needs the internet:
- Multi-device sync (Supabase)
- **Customer portal** — clients view jobs, approve quotes, pay invoices,
  request callouts
- **Contractor portal** — subbies see assigned tasks, update progress, upload
  photos, manage compliance docs
- Xero / Stripe, SMS & email automation (not shipped yet — **Cost Centers & Xero**
  sits greyed out with a *Coming soon* hint until it does)

## How it works

RELAY runs as a native desktop application (powered by Electron) or directly in the browser. In **local mode** all data persists to your device (localStorage) and never leaves it. Switch on **Cloud mode** and the same app syncs through Supabase (Postgres + auth + storage) to add multi-device access and the hosted portals. The free, offline experience is complete on its own — the cloud is an upgrade, not a requirement.

## Tech stack

- **Frontend:** Vanilla JS (ES modules) + Vite — no framework tax, fast loads
- **Desktop Wrapper:** Electron — runs natively on your machine
- **Installer & Updates:** electron-builder + electron-updater — packages into a Windows NSIS Installer (.exe); installed builds check GitHub Releases in the background and prompt to restart when an update is ready
- **Local storage:** browser localStorage (offline-first)
- **Fonts:** self-hosted via `@fontsource` (Inter, Material Icons Outlined, plus the
  document faces) — bundled with the build, so nothing is fetched from a CDN
- **Cloud backend:** Supabase (Postgres, Auth, Storage) — Cloud mode only
- **Charts/PDF:** print-friendly HTML render pipeline

## Getting started

### Development (Web)
```bash
npm install
npm run dev      # start the Vite dev server
```

### Development (Desktop)
```bash
npm run electron:dev    # start Vite and launch Electron window concurrently
```

### Publishing the Web App

GitHub Pages is published from this repo by `.github/workflows/deploy.yml` on
every push to `main`. One artifact carries both the marketing site and the app:
the site owns the origin root, the app owns **/app/**.

```bash
npm run build:pages   # the exact artifact CI uploads; writes to dist/
```

`scripts/build-pages.mjs` assembles `dist/` like this:

| Path in `dist/` | Source | What it is |
| --- | --- | --- |
| `index.html`, `assets/**`, `terms/`, `privacy/` | `site/**` | the marketing homepage and the legal pages |
| `app/**` | Vite build with base `/app/` | the web app |
| `assets/desktopApp.js` | `src/utils/desktopApp.js` | the release resolver `home.js` imports |
| `CNAME` | `public/CNAME` | GitHub Pages only honours a custom domain at the artifact root |

It clears `dist/` first, so a file you delete under `site/` really does disappear
from the artifact, and it copies rather than moves, so `site/` stays the
reviewable source of truth.

Old app links were root-based (`relaydispatch.com.au/#/portal/customer?token=…`).
The few lines at the top of `site/index.html` forward those, so a bookmark or an
already-emailed link still lands on `/app/#/portal/customer?token=…`:

```js
if (location.hash.startsWith('#/')) location.replace('/app/' + location.hash);
```

Only app-shaped hashes (`#/…`) are forwarded — the homepage uses plain fragments
itself (`#pricing`, `#compare`, `#download`) and those must not be redirected.
This lives in the page rather than in a separate root document so that there is
only ever one `/index.html` to reason about.

There is deliberately **no `404.html`** — a catch-all pointing at `/app` would
swallow every marketing URL, including `/terms` and `/privacy`. The desktop build
is untouched: `npm run build` still emits a relative-path bundle in `dist/` for
Electron to load over `file://`, and `build:pages` deletes `dist/` first, so the
two layouts can never mix.

The app has to be served from a **path on the same origin**, not a subdomain:
Local mode keeps its data in IndexedDB/localStorage, which is scoped to an origin,
so a subdomain would hand every existing browser user an empty app.

No code or Stripe dashboard changes are needed for the new base — every
outbound URL (Stripe Checkout returns, the billing portal, portal invites) is
built from the live location through `src/utils/webOrigin.js`, so it follows the
path automatically. The password-reset redirect is the one deliberate exception:
it targets the bare app base (`webAppBaseUrl()`), because Supabase delivers the
recovery token in the URL fragment and only strips the first `#`, so a `#/route`
there would hide the token from its own parser — see *Password reset links* below.

**After deploying, in Supabase → Authentication → URL Configuration:**

- Set the **Site URL** to `https://relaydispatch.com.au/app/`. This is where a
  sign-up confirmation lands when no redirect is given, so it must be the app
  path — a `localhost` value there sends real users to a local dev server.
- Add these to the **Redirect URLs** allow-list (wildcards are allowed here, but
  **not** in the Site URL):
  - `https://relaydispatch.com.au/app/` — the app's own redirects (password
    reset, Stripe returns). Keep the trailing slash: it is the exact target the
    app asks for.
  - `https://relaydispatch.com.au/app/**` — any other path under the app.
  - `https://relaydispatch.com.au/**` — keeps pre-move root links working: the
    homepage forwards `#/…` fragments into the app.
  - `http://localhost:5173/**` — the Vite dev server, if you exercise auth
    locally (that is the app's dev port, not `localhost:3000`).

Staff invites are unaffected: `invite-user` creates confirmed users, so it sends
no Supabase auth link.

#### Password reset links

The reset email redirects to `https://relaydispatch.com.au/app/` with the
recovery token in the fragment (`#access_token=…&type=recovery`). Supabase's
client parses that fragment, **saves a recovery session and then clears the whole
hash** (`_getSessionFromURL` ends with `window.location.hash = ''`), firing a
`PASSWORD_RECOVERY` event. Two consequences worth knowing before you touch this
area:

- A hash **route** can never be the reset target — the token *is* the fragment,
  and it is wiped once read. Hence the bare `webAppBaseUrl()` above.
- Nothing in the app currently reacts to `PASSWORD_RECOVERY`, and `src/main.js`
  rewrites an unknown hash to `#/login`, so a reset link today lands on the
  launch screen with a recovery session in storage but no "choose a new
  password" form. Wiring that up is tracked separately; the password-change UI
  that would be reused is `renderForcePasswordChange` in
  [Login.js](./src/pages/login/Login.js).

### The Marketing Site

`site/` is plain HTML, CSS and vanilla JS — no framework, no build step of its
own. It is published verbatim; the only processing is the copy step in
`build:pages`.

```
site/
  index.html                  homepage (10 sections, one page)
  terms/, privacy/            legal pages
  assets/css/site.css         all site styles; design tokens at the top
  assets/js/home.js           sticky-header height + the download button
  assets/js/preview.js        the interactive app preview
  assets/fonts/               Inter, self-hosted variable font
  assets/img/                 logos, favicon, og.png
  assets/preview/             screenshot atlases, screens.json, screens-index.json, hero.webp
```

`assets/js/desktopApp.js` is not in that list on purpose — it lives in
`src/utils/desktopApp.js` and is copied to `dist/assets/desktopApp.js` at build
time, so the marketing download button and the desktop app share one resolver.
In the source tree `home.js` simply falls back to the release-page href.

Preview it locally with any static server rooted at the repo (the desktop-app
resolver and the `/app/` links are absolute paths, so opening the file directly
will not exercise them):

```bash
npx serve .        # then open http://localhost:3000/site/
```

Two rules keep the page honest:

- **Everything visible is transcribed from the approved design.** The homepage
  was built by transcribing the design artifact's text nodes and diffing the
  result against the page token by token until every design token appeared, in
  order. If you edit copy, keep that property: the page should introduce no
  wording of its own. A handful of extra tokens are expected and deliberate —
  the page title, the skip link, the `<caption>` on the comparison table, the
  `<noscript>` warning and the footer's contact address.
- **Nothing is promised that does not exist.** Xero, Groundwork and the leads
  marketplace sit under "Coming next". The app preview runs on the fictional
  demo company Ridgeline Electrical — no real customer names or testimonials
  anywhere. Prices are $18 / $21 per user per month + GST, with the inc-GST
  figures in small print.

The published contact address is `support@relaydispatch.com.au`. It appears in
the homepage footer, on both legal pages and in the homepage's `contactPoint`
structured data. It is an addition rather than a design token — the artboard's
footer carries only the copyright and ABN line — because the brief asks for a
contact email in the footer.

Several bracketed placeholders remain. They are content still owed by the
client, not code defects, and they are deliberately visible so they cannot ship
by accident:

| Placeholder | Where | Needs |
| --- | --- | --- |
| `[Business name]`, `ABN [number]`, `[registered address]` | footers, `terms/`, `privacy/` | the operating entity's legal details |
| `[month year]` | compare-table note, both legal pages | the month the competitor prices were checked, and the legal revision date |
| `[check]` (six cells) | compare table | Tradify and Simpro prices re-verified, with their GST treatment stated |
| `[state or territory]`, `[region]`, `[To be confirmed…]` | `terms/`, `privacy/` | governing jurisdiction, hosting region, sub-processor list |

#### The app preview and its assets

The preview is a sprite. Each atlas is a 1440 px-wide vertical strip of screen
tiles, and a fixed-height window shows one tile at a time by translating the
image. Hotspots are real `<button>`s positioned in percentages over the tile, so
the preview is operable by mouse, touch and keyboard (Tab to a hotspot, Enter to
activate).

Three groups of files under `site/assets/preview/` are **produced by the capture
pipeline**, not hand-written, and must be regenerated when the app's screens
change:

| File | Size | Role |
| --- | --- | --- |
| `atlas-00.webp` … `atlas-15.webp` | ~7 MB total | the screen tiles |
| `screens.json` | ~200 KB | every screen and hotspot (272 screens, 3 421 hotspots) |
| `screens-index.json` | ~15 KB | the first-paint subset (16 screens, 233 hotspots) |

`screens.json` is deliberately **not** fetched on page load. It costs 4–5
Lighthouse performance points and nothing above the fold needs it. On load the
page fetches `screens-index.json` — dashboard, schedule and the 14 list screens,
all of which live in atlas 0 — and pulls the full dataset only when a visitor
clicks into a screen that needs it. Atlas 0 is warmed during idle so the first
click is instant; the other 15 atlases load on demand, which is what keeps the
initial payload at roughly half a megabyte instead of 7 MB.

`screens-index.json` is derived, never edited by hand:

```bash
npm run build:preview-index   # scripts/build-preview-index.mjs
```

The script keeps every screen whose key has at most one colon (dashboard,
schedule and the `L:<name>` lists) and **fails loudly if any of them lives outside
atlas 0**, because the first-paint guarantee depends on that invariant. Re-run it
after regenerating `screens.json`.

`hero.webp` (1440 × 900, ~55 KB) is tile 0 of atlas 0, and exists purely for
first paint — the same pixels as the first atlas tile, so swapping the `src` to
the real atlas on first navigation is invisible. Without it the 1440 × 14400
atlas is the largest contentful paint and Lantern models it at its natural size
(20.7 megapixels), which alone dragged mobile performance from 98 to 78.

Screens cut rather than slide. `preview.js` moves the sprite with `translateY`,
so any `transition` on `.preview__shot` would interpolate every screen change;
there is none, and no `@keyframes` or `animation` anywhere in `site/`. The sprite
box is pinned to atlas geometry as well — `height: calc(100% * var(--tiles, 1))`,
with `--tiles` set from the screen record — instead of following the loaded
bitmap's intrinsic ratio. A box that tracked the bitmap resized mid-swap and
painted the outgoing atlas at the incoming offset for a frame, which reads as the
screen sliding into place. `swapAtlas()` sets `src`, `--tiles` and the offset in
a single task once the incoming bitmap is fetched, guarded by the screen the
latest interaction asked for. `shot.decode()` is not usable as that gate: it
never settles while the document is not being rendered.

#### Regenerating the share card

`site/assets/img/og.png` (1200 × 630) is drawn on a canvas by
`scripts/og-card.html` rather than exported from a design tool. Serve the repo
root — the page loads the Inter variable font and the cut-out logo from
`site/assets/`, so it needs the repo mounted, not `site/`:

```bash
npx serve .
```

#### Known deviations and limitations

- **One deliberate copy deviation.** The hero headline reads *"Software that
  competes, without the sting."*, not the design's *"The job software the big
  players use. At a price that doesn't sting."* The design's line asserts an
  installed base that does not exist yet — the site ships with no customers and
  no testimonials by design — so that claim was removed rather than softened.
  This is the only copy that differs: comparing the artboard against
  `site/index.html` token by token, 857 of 868 design tokens match in order, and
  all eleven that do not belong to that one sentence.
- **One deliberate colour deviation.** The featured plan's call-to-action is
  `#C2410C`, not the design's `#FF5C00`. White on `#FF5C00` is 3.09:1, which
  fails WCAG AA for 16 px bold text; `#C2410C` is 5.18:1. The small header button
  takes the same ink for the same reason. The 19 px hero and closing CTAs keep
  `#FF5C00`, which passes as large text (3.10:1 against a 3:1 threshold).
- **`target-size` cannot be satisfied on phones.** Lighthouse's mobile
  accessibility audit flags the five always-visible preview hotspots (~45 × 9 px
  at 412 px wide). They are sized from the atlas geometry: a hotspot is 4.1 % of
  the frame height, so a 24 px tall target would need a phone about 934 px wide,
  and their ~9.7 px pitch means enlarging the hit areas would make them overlap —
  trading a size failure for a tap-accuracy one. Every hotspot is still fully
  reachable and operable by keyboard. This is the only failing audit on mobile;
  the page scores **98 performance / 96 accessibility / 100 best practices / 100
  SEO**.
- **Placeholders are visible on purpose.** The footer's business name, ABN and
  contact email, the Tradify/Simpro comparison cells and the pricing
  verification month render as bracketed placeholders until the real values are
  supplied. The Tradify and Simpro figures in particular must be re-checked
  against those vendors' own pricing pages — including which month they were
  checked in, and whether their prices include GST — before launch.

### Building the Desktop Installer
```bash
npm run electron:build  # build Vite production assets and compile the Windows NSIS Installer (.exe)
```

Output lands in `dist-electron/` as `RELAY Dispatch Setup <version>.exe`, next to
the `latest.yml` manifest the updater reads. The installer is **not
code-signed**, so Windows SmartScreen shows an "unknown publisher" warning on
first run. electron-builder uploads the release asset under a safe hyphenated
name (`RELAY-Dispatch-Setup-<version>.exe`) rather than the spaced local
filename, and that safe name is the one `latest.yml` points at — the release
needs both the installer and `latest.yml` attached.

Build with the same environment as the web deploy or the installer ships with
Cloud mode and maps disabled: Vite inlines `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY` and `VITE_GOOGLE_MAPS_BROWSER_KEY` at build time (see
`docs/SUPABASE_MIGRATION.md`).

### Releasing a Desktop Update

Releases are automated by `.github/workflows/desktop-release.yml`:

1. Bump `version` in `package.json`, commit and merge to `main`.
2. Tag that commit and push the tag — this is what starts the release:
   ```bash
   git tag v1.4.0
   git push origin v1.4.0
   ```
3. The workflow runs the test suite, checks the tag matches the `package.json`
   version, builds the installer on `windows-latest` and publishes it as a
   GitHub Release with the installer and `latest.yml` attached.

Installed builds resolve updates from `releases/latest`, so the release has to
be **published** (not a draft) and has to carry those assets — a tag on its own
reaches nobody. Users can also check on demand from **Help → Check for
Updates…**; when an update is ready the app offers *Restart now* or installs it
on the next quit. Updates reuse the same Electron user-data directory, so a
user's local data carries across.

The website advertises the download too — a **Download for Windows** button on
the launch screen and in **Profile → Desktop App**. Both resolve the newest
installer at click time from the GitHub releases API
(`src/utils/desktopApp.js`), because release assets carry the version in their
filename and there is no stable `releases/latest/download/...` URL. The lookup
reads the *releases list* rather than `releases/latest`, and takes the newest
release that actually has an `.exe` attached: `latest` reports the newest
published release even when it carries no assets (v1.3.4 is in exactly that
state), which would leave nothing to download while an older installer sat
right there. If the API call fails or no release has an installer at all, the
button falls back to the releases page. The button is hidden inside the packaged
app (anything loading from `file://`), and resolved URLs are cached in
`localStorage` for an hour to stay well inside the 60-requests-per-hour
anonymous API limit. Because the lookup is at click time, shipping a new release
requires no website change.

The Electron binary is not downloaded by `npm install`: `electron .` fetches it
the first time it runs and `electron-builder` fetches it while packaging, so the
first build needs network access.

The desktop app tracks the newest Electron major (currently 44.x). The Electron
43 and 44 breaking-change notes were reviewed against this app and none of the
removals apply: copy-to-clipboard goes through the web `navigator.clipboard` API
rather than the removed renderer `clipboard` module, and the main process uses no
file dialogs and no `session`/`quotas` APIs. The one change worth remembering is
that Electron 44 dropped 32-bit Windows (`ia32`), so keep the NSIS target x64 —
adding an `ia32` target will no longer build.

The app boots straight into **local mode** — no account needed. To enable Cloud
mode, point it at a Supabase project using the schema in
`supabase/migrations/schema.sql` (see `docs/SUPABASE_MIGRATION.md`).

### Local mode: one profile, one machine

A local profile is a **single user**. You create it on the launch screen — give
it a business name, your name, a password and a recovery question — and that one
sign-in owns everything on this device.

- A brand-new local profile starts with **no staff records**.
- Your password is stored as a hash, and it is the only credential the profile
  accepts. Forgetting it means using the recovery question on the launch screen.
- Staff logins — separate accounts, user types and permissions, password
  recovery — come with **RELAY Cloud**. Those tabs are still visible in
  **Settings → Users** on a local profile; they explain what the cloud adds and
  offer the one-way **Move to cloud** upgrade, which copies your records into a
  cloud company and signs you in there.
- Cloud-only features are greyed out rather than hidden, with a *Click to create
  a Cloud account* hint that opens the upgrade flow: the leads marketplace, and
  the cloud-only Settings pages (Customer Portal, Contractor Portal, Online
  payments, Email & domain, Users, User Types & Permissions, Password Recovery).
  Documents, reports and the Local Storage tools stay fully available.
- Features that haven't shipped yet are greyed out for **every** account type with
  a plain *Coming soon* hint — clicking one explains itself instead of offering the
  upgrade, because a cloud account wouldn't unlock it yet. Cost Centers & Xero is
  gated that way until the Xero integration lands (it then becomes cloud-only).
  Deep links to a gated tab land on Company rather than the unfinished page.
- Local mode has no geocoding — address lookups run through RELAY Cloud — so
  nothing in Settings asks for a dispatch start location, and the Lead & Market
  Profile that feeds the marketplace is omitted from Settings → Company.
- Older multi-user local profiles are cleaned up automatically on first boot:
  per-technician login credentials, the deployment-type marker and the legacy
  `local_multiuser` session flag are removed (the flag is rewritten to `local`).
  Staff records themselves are kept, so a later cloud upgrade still carries the
  roster across.

## Project status

Actively developed. Core sales→job→invoice workflow, scheduling, inventory,
assets/maintenance, forms, documents, reporting, and both portals are in place.
Free local mode is the focus; Cloud mode adds the connected services above.

## License

Free to use. See the repository for license details.

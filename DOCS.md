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
  overdue reminders, labour billed from tasklist estimates or from booked
  timesheet hours
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

### Portals and magic links

The customer and contractor portals are the only pages reachable **without a
session**, and RLS correctly withholds every row from a signed-out caller — so a
portal cannot read the store the way a staff page does. Each link carries a token
(`c_pt_` plus 32 hex digits, from `generatePortalToken()` in
[portalLinks.js](./src/utils/portalLinks.js)), and the whole resolution happens
server-side in the `relay-portal` edge function:

- **The token is looked up server-side.** `supabase/functions/relay-portal`
  reads it with the service role and returns only the rows that link is entitled
  to. Nothing in the browser is trusted to decide scope, because an anonymous
  visitor cannot read the tables in the first place.
- **The answer carries an allow-listed slice of company settings**, not the blob.
  `settings` is projected through `PUBLIC_SETTINGS_KEYS` in
  [portal.js](./supabase/functions/relay-portal/portal.js) before it is serialised,
  because the same blob also carries the tenant's `ai` provider key and their
  `_subscription` record — and these responses reach an anonymous visitor. It is an
  allow-list, so a settings key added later is withheld until somebody adds it here
  deliberately.
- **The store is filled from that answer.** `store.hydratePortalScope()` swaps the
  in-memory collections to the visitor's scope, so the portal pages read
  `store.getAll(…)` exactly as they always have. `src/main.js` clears the scope on
  leaving the portal route, which restores the operator's own data.
- **Every portal write goes back through the resolver**, which re-checks the
  collection, the columns and ownership against the token before it touches a row.
  Writes are queued in issue order, so a page that creates a row and then
  references it cannot race itself.
- **The PIN never leaves the server.** It is hashed and compared inside the
  function, so the page never holds a digest it could judge. PIN attempts are
  throttled from an access log, and each successful unlock mints a short-lived
  grant that is the only thing a write will accept.
- **A link is only valid once its token has been saved.** `customerPortalUrl()`
  and `contractorPortalUrl()` await the write and hand back `null` if it was
  refused, so an email or a copied link is never built on a token that is not on
  file — issuing a link that was not stored silently invalidated every link
  handed out before it.

The first visitor to an unclaimed link sets its PIN. Regenerating a token issues
a new link **and revokes the old one**, because the previous token no longer
matches the stored row.

Two steps are needed before this works against the live project, and neither can
be done from the repository:

```bash
# 1. The token indexes, the portal access log, the grant table and the
#    portal_contractor_job_ids() helper.
supabase db push        # applies 042_portal_token_lookup.sql

# 2. The resolver. JWT verification MUST be off — the visitor has no session.
supabase functions deploy relay-portal --project-ref <ref> --no-verify-jwt
```

`--no-verify-jwt` is deliberate here and only here — a magic-link visitor has no
session. The project's other public entry points (the lead endpoints, the Stripe
webhook, `relay-create-payment`) run the same way, but a function that serves a
signed-in user must never copy the flag; see
[docs/SUPABASE_MIGRATION.md](./docs/SUPABASE_MIGRATION.md) §12a and §12c.

### brny: changing its behaviour and skills

brny is the assistant in the panel, and both its behaviour and its skills live in
the client bundle. Changing either is an ordinary frontend change: commit to
`main`, and `deploy.yml` rebuilds and publishes the app. Neither one needs
`supabase functions deploy`.

- **Behaviour is the playbook.** [src/utils/brnyPlaybook.js](./src/utils/brnyPlaybook.js)
  exports `BRNY_PLAYBOOK` — who brny is, what the CRM's words mean, when to ask
  instead of act, how to talk. Edit the text and push. The same file's
  `LEGACY_ESCAPE_HATCHES` holds the few UI-only moves that have no tool
  (navigation, the canvas, maps and weather, the factsheet).
- **Skills are the action registry.** Every tool the model may call is defined by
  `defineAction` in [src/actions/](./src/actions) and exported as `tools` through
  `toToolDefinitions`. Adding a skill means a new module there plus an entry in
  that folder's `index.js`. The action's `description` is the whole of the model's
  instructions, so write it for the model, not for a reader.
- **Personalities are the selectable voice layer.**
  [src/utils/brnyPersonalities.js](./src/utils/brnyPersonalities.js) holds the
  presets (Straight, Friendly, Brief, Trainer, Formal), and My Profile → brny's
  Personality saves the pick to the device-local, per-user key
  `relay_brny_personality_<userId>`
  ([src/utils/brnyPersonalityPref.js](./src/utils/brnyPersonalityPref.js)) — the same
  precedent as the profile factsheet. It lives on My Profile, not in Settings,
  because it is one person's choice rather than a company one: every user has a
  profile, but not every role can reach Settings, and a caller must never inherit
  someone else's voice. A personality swaps exactly one line of the playbook — the
  `HOW TO TALK` tone bullet — so what brny is allowed to do, and how it has to
  report hours, tasks and questions, stay fixed for every preset. Precedence is
  `settings.ai.playbook` (a deliberate per-company override, if set) → the user's
  personality → the shipped default, and `BRNY_PERSONALITIES[0].tone` must stay
  byte-identical to that tone bullet:
  [src/utils/brnyPlaybook.test.js](./src/utils/brnyPlaybook.test.js) asserts the
  bullet appears exactly once, so a playbook edit that drifts from the preset
  fails the suite instead of silently no-op'ing the swap. A `settings.ai.personality`
  value left over from the short-lived Settings tab is simply ignored — nothing reads
  it, and it must not be revived, because the pick is the individual's and not the
  company's.
- **`relay-copilot` is plumbing, not behaviour.** The edge function is a
  passthrough proxy: the client sends `system` and `tools` in the request body and
  the function forwards them upstream. Redeploy it only to change the pinned
  model, the upstream host allowlist, the per-seat limits or the usage ledger.
- **The wire contract is the loop's, not the proxy's.**
  [src/utils/brnyAgent.js](./src/utils/brnyAgent.js) builds the conversation, and
  the provider rejects one in which any `tool_use` block in an assistant turn has
  no `tool_result` in the user turn immediately after it (`400 … tool_use ids were
  found without tool_result blocks`). A step pauses part-way through its calls on a
  question or an approval, so every call in that step is answered where it stands:
  the one it stopped on as `awaiting_user`, the ones behind it as `not_run` — they
  never ran, and the model is told so it can re-issue them rather than read as done.
  The resume replaces the stopping call's placeholder in that same turn, because a
  second user turn would leave the call unanswered in the message right after the
  assistant turn. Nothing downstream repairs the history, so keep that invariant:
  [src/utils/brnyAgent.test.js](./src/utils/brnyAgent.test.js) replays a paused step
  and checks the request the resume sends.
- **Every prompt states today's date once, and spells the weekday out.**
  `2026-10-15` does not tell a model what weekday it is, and the small, fast models
  brny runs on get that arithmetic wrong — so `localDateLabel` and
  `localDateTimeLabel` in [src/utils/dateUtils.js](./src/utils/dateUtils.js) build
  the label from fixed English name tables instead: `Thursday, 15 October 2026`.
  Fixed tables are the point, not a shortcut — `toLocaleString()` renders
  `15/10/2026, 9:14:03 am` for an Australian user, which models read month-first,
  and it would otherwise follow the machine's locale, which is neither ours to
  choose nor stable. The three model-facing paths all use that one label:
  - the agent loop's briefing appends `Today is 2026-10-15 (Thursday, 15 October 2026).`
    to the system prompt *after* the playbook (or a company override), so it cannot
    be replaced; if the store read behind the rest of the briefing fails it still
    sends the date alone, because a turn with no counts is fine and a turn with no
    date is what caused the bug.
  - `get_today` returns `date` (ISO, for actions) beside `dateLabel` (the same day,
    spelled out), so a model reading the tool result is told the weekday too.
  - the live context block in
    [src/components/RelayAssistant.js](./src/components/RelayAssistant.js) states it
    as `Current Local Date & Time`, and the playbook says outright that the
    `Today is ...` line outranks the thread, the model's memory and the month in
    the data above. Both prompt paths agreeing is the invariant:
    [src/utils/brnyAgent.test.js](./src/utils/brnyAgent.test.js) asserts the line
    survives a caller-supplied `system` and an unreadable store, and
    [src/components/RelayAssistant.agentTurn.test.js](./src/components/RelayAssistant.agentTurn.test.js)
    asserts the live block's line, that nothing on that path calls
    `new Date().toLocaleString()`, and that the paragraph still claims primacy.
- **`settings.ai.playbook` is a deliberate per-company override.** Set it by SQL or
  from the dashboard (there is no UI for it yet) and it *replaces* the playbook body
  for that company, policy rules and all — so an override is for a tenant that wants
  different behaviour outright, not for a tweak.
- **No prompt text belongs in `defaultSettings`.** Anything shipped in
  `settings.ai` merges into every tenant's settings, and a non-empty override stands
  in for the playbook: a leftover `systemPrompt` default used to leave brny running
  ~1.4 KB of legacy prompt while the app looked healthy, and none of the policy
  reached the model. [src/data/store.test.js](./src/data/store.test.js) asserts the
  default stays empty.

The paths that are not tool loops — attachment vision, external replies, routine
writing, the conflict scan — have no playbook of their own. They build from the
shared `LEGACY_BASE_PROMPT` and are the only place that still reads
`settings.ai.systemPrompt`. The ones that go through `buildSystemPrompt` (external
replies, routine writing) also append the selected personality's tone line, so
brny sounds like the chosen preset wherever it writes prose; attachment vision and
the conflict scan keep their own inline prompts and never see a personality.

## Tech stack

- **Frontend:** Vanilla JS (ES modules) + Vite — no framework tax, fast loads
- **Desktop Wrapper:** Electron — runs natively on your machine
- **Installer & Updates:** electron-builder + electron-updater — packages into a Windows NSIS Installer (.exe); installed builds check GitHub Releases in the background and prompt to restart when an update is ready
- **Local storage:** browser localStorage (offline-first)
- **Fonts:** self-hosted via `@fontsource` (IBM Plex Sans and IBM Plex Mono for the app
  UI and the marketing site, Inter for customer documents, Material Icons Outlined, plus
  the document faces) — bundled with the build, so nothing is fetched from a CDN
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
| `index.html`, `assets/**` | `site/**` | the marketing homepage |
| `terms/`, `privacy/`, `refunds/`, `acceptable-use/` | `src/pages/legal/content.js` via `scripts/build-legal-pages.mjs` | the legal pages, in the site's shell (written after the site copy) |
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
`build:pages`. The legal pages are the exception: they are not in `site/` but
generated from `src/pages/legal/content.js`, the same source as the app's
`#/terms`, `#/privacy`, `#/refunds` and `#/acceptable-use` routes — edit the
wording there, never in HTML.

```
site/
  index.html                  homepage (11 sections, one page)
  assets/css/site.css         all site styles; design tokens at the top
  assets/js/home.js           sticky-header height, the CTA order off Windows, the download button
  assets/fonts/               IBM Plex Sans (latin, variable weight), copied from @fontsource-variable
  assets/img/                 logos, favicon, og.png
  assets/screens/             app screenshots (generated, see below)
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

- **The design was the starting point, not a lock.** The homepage was first
  transcribed from the approved design artifact token by token. Copy has since
  been edited on the page itself (October 2026), so `site/index.html` is now
  the source of truth for the wording.
- **Nothing is promised that does not exist.** Xero, Groundwork and the leads
  marketplace sit under "Coming next". The screenshots show the fictional
  demo company Harbourline Electrical & Air — no real customer names or testimonials
  anywhere. Prices are $24 / $27 per user per month + GST, with the inc-GST
  figures in small print.

The published contact address is `support@relaydispatch.com.au`. It appears in
the homepage footer, on the legal pages and in the homepage's `contactPoint`
structured data. It is an addition rather than a design token — the artboard's
footer carries only the copyright and ABN line — because the brief asks for a
contact email in the footer.

Several bracketed placeholders remain. They are content still owed by the
client, not code defects, and they are deliberately visible so they cannot ship
by accident:

| Placeholder | Where | Needs |
| --- | --- | --- |
| `[Business name]`, `ABN [number]` | homepage footer | the operating entity's legal details |
| `[COMPANY NAME]`, `[ACN]`, `[ABN]`, `[REGISTERED ADDRESS]`, `[POSTCODE]`, `[EFFECTIVE DATE]` | `ENTITY` in `src/pages/legal/content.js` | entity details and effective date for all four legal documents; while any remain, the generated pages carry a draft banner and `noindex` |

#### App screenshots

The hero and the "Inside RELAY" tour use plain screenshots of the current app
running the demo business (`src/data/demoDataset.js`). They replaced an
interactive sprite preview in October 2026: it went stale with every app
change, weighed about 7 MB and could not be used on a phone.

Every screen is generated, never hand-edited, by
`scripts/capture-site-screens.cjs`. With the dev server running:

```bash
npm run dev
npm run capture:screens
```

It opens the app in an Electron window, signs in as a throwaway local owner in
demo mode, and writes each screen to `site/assets/screens/` at 2160 px
(`<name>.webp`) and 1080 px (`<name>-1080.webp`) wide. The page picks between
them with `srcset`. A few things keep the shots looking like a normal working
day:

- The page clock is pinned to the most recent weekday at 10:30, because the demo
  is dated relative to the day it loads and a weekend run has an empty Today.
- Detail screens pick their record by what it is (the biggest in-progress job,
  the largest sent quote) rather than by id, since ids move with the date. This
  reads the store through the dev server, so the script needs `npm run dev`
  rather than a production build.
- The demo banner is removed. On the dashboard, the Technician Map is dropped
  when the build has no Google Maps key (`VITE_GOOGLE_MAPS_BROWSER_KEY`),
  because it would show an error note instead of a map.

Re-run it whenever a captured screen changes visibly.

#### Regenerating the share card

`site/assets/img/og.png` (1200 × 630) is drawn on a canvas by
`scripts/og-card.html` rather than exported from a design tool. Serve the repo
root — the page loads the IBM Plex Sans font, the logo and the dashboard
screenshot from `site/assets/`, so it needs the repo mounted, not `site/`:

```bash
npx serve .
```

#### Known deviations and limitations

- **No claims about an installed base.** The design's headline, *"The job
  software the big players use. At a price that doesn't sting."*, and its "Most
  popular" plan badge both imply customers the business does not have yet, so
  neither ships. The hero reads *"Job software for tradies, without the sting."*
  and the Cloud plan is badged "Best for crews".
- **One deliberate colour deviation.** The featured plan's call-to-action is
  `#C2410C`, not the design's `#FF5C00`. White on `#FF5C00` is 3.09:1, which
  fails WCAG AA for 16 px bold text; `#C2410C` is 5.18:1. The small header button
  takes the same ink for the same reason. The 19 px hero and closing CTAs keep
  `#FF5C00`, which passes as large text (3.10:1 against a 3:1 threshold).
- **Placeholders are visible on purpose.** The footer's business name and ABN
  render as bracketed placeholders until the real values are supplied.
- **The comparison table is dated.** The Tradify and Simpro cells were checked
  in October 2026 against the vendors' own pages: Tradify's AU pricing page
  (Lite/Pro/Plus at $48/$52/$62 ex GST, month to month, 14-day trial, no setup
  fee) and its help article "Does Tradify Work Offline?" (it does not); Simpro's
  pricing page (quote only, monthly or annual billing, a setup fee, a demo
  rather than a trial) and its mobile help guide (the mobile app works offline).
  Re-check them, and the month in the table's note, whenever the page is
  revised.

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

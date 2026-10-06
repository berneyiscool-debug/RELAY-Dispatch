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
filename and there is no stable `releases/latest/download/...` URL. If the API
call fails, is rate-limited, or the newest release carries no `.exe`, the button
falls back to the releases page. The button is hidden inside the packaged app
(anything loading from `file://`), and resolved URLs are cached in
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

# RELAY — Dispatch

**Free, offline-first field-service management for Australian trade businesses.**

The free answer to bloated, overpriced trade software. No per-seat fees, no
lock-in, and it works where your job is — not where the wifi is.

## What it does

- **Sales & jobs** — CRM with leads pipeline, multi-section quotes, hierarchical
  job task lists, progress billing invoices, and branded PDF export
- **Scheduling & time** — drag-and-drop calendar with conflict detection,
  recurring jobs, timesheets with approval workflow
- **Inventory & resources** — multi-location stock, purchase orders, reusable
  kits, asset registry with meter tracking and a maintenance engine
- **Office & field** — drag-and-drop form builder, document centre, reports,
  role-based permissions, 13 themes
- **Portals** — customer portal (view jobs, approve quotes, pay invoices) and
  contractor portal (assigned tasks, progress updates, compliance docs)

## How it works

RELAY runs as a native desktop app (Electron) or in the browser. In **local
mode** all data stays on your device (IndexedDB) and the app works fully
offline. **Cloud mode** (optional) syncs through Supabase and adds the hosted
portals and connected services (maps, weather, payments, SMS, email, AI).

## Tech stack

- Vanilla JS (ES modules) + Vite — no framework tax
- Electron desktop wrapper with auto-updates (electron-builder, Windows NSIS)
- Local storage: IndexedDB (offline-first)
- Cloud backend: Supabase (Postgres, Auth, Storage, Edge Functions)

## Getting started

```bash
npm install
npm run dev            # start the Vite dev server (browser)
npm run electron:dev   # start Vite and launch the Electron window
npm run electron:build # build the Windows installer (.exe)
```

The app boots straight into local mode — no account needed. To enable Cloud
mode, point it at a Supabase project using the schema in
`supabase/migrations/` (see `docs/SUPABASE_MIGRATION.md`).

## Documentation

- `DOCS.md` — product overview and capabilities
- `PRODUCT.md` — product principles and design commitments
- `docs/` — migration guides and release notes

## License

Free to use. See the repository for license details.

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
- Role-based permissions (Admin / Manager / Office / Technician)
- 13 themes including a light/dark toggle

**Cloud mode (optional, paid)**
Adds only what genuinely needs the internet:
- Multi-device sync (Supabase)
- **Customer portal** — clients view jobs, approve quotes, pay invoices,
  request callouts
- **Contractor portal** — subbies see assigned tasks, update progress, upload
  photos, manage compliance docs
- Xero / Stripe, SMS & email automation

## How it works

RELAY runs as a native desktop application (powered by Electron) or directly in the browser. In **local mode** all data persists to your device (localStorage) and never leaves it. Switch on **Cloud mode** and the same app syncs through Supabase (Postgres + auth + storage) to add multi-device access and the hosted portals. The free, offline experience is complete on its own — the cloud is an upgrade, not a requirement.

## Tech stack

- **Frontend:** Vanilla JS (ES modules) + Vite — no framework tax, fast loads
- **Desktop Wrapper:** Electron — runs natively on your machine
- **Installer & Updates:** electron-builder — packages into a Windows NSIS Installer (.exe) with automatic background updates via GitHub Releases
- **Local storage:** browser localStorage (offline-first)
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

The app boots straight into **local mode** — no account needed. To enable Cloud
mode, point it at a Supabase project using the schema in
`supabase/migrations/schema.sql` (see `docs/SUPABASE_MIGRATION.md`).

## Project status

Actively developed. Core sales→job→invoice workflow, scheduling, inventory,
assets/maintenance, forms, documents, reporting, and both portals are in place.
Free local mode is the focus; Cloud mode adds the connected services above.

## License

Free to use. See the repository for license details.

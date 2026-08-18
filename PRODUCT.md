# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

<!-- Vanilla JS + Vite, shipped both as a web app and packaged in Electron. Not a native design language. -->

## Users

Primary user: the owner/admin or dispatcher of a small-to-mid field-service business (trades — plumbing, electrical, HVAC, maintenance). They run the business from a desk or laptop: assigning jobs, chasing quotes and invoices, watching where technicians are and what's overdue. There is typically one admin per company.

Secondary users: technicians (each a real login/seat) who work assigned jobs, and — in a limited portal — customers and contractors who confirm appointments or view a job.

## Product Purpose

RELAY — Dispatch is a CRM and operations hub for field-service businesses. It covers the full workflow: leads → quotes → jobs → scheduling/dispatch → invoicing → payment, plus the people (customers, contractors, suppliers) and resources (assets, stock, purchase orders, timesheets) that support it. Success is an owner running their whole day from one screen instead of a whiteboard, a spreadsheet, and three apps.

## Positioning

Two mechanisms a neighboring CRM could not truthfully copy:

1. **Local-first, cloud-optional.** The app runs fully offline against a per-origin IndexedDB store (`acct_`-namespaced local accounts) and transparently switches to Supabase-backed cloud sync when signed in as a cloud company. The same code path serves both; paid/online features (maps, weather, payments, SMS, AI) are gated to cloud users.
2. **A spatial-canvas dashboard.** The home Dashboard is not a fixed grid — it is an infinite, pannable, zoomable canvas of draggable/resizable widgets with an edit mode, snap-to-grid, and saved "views" (named camera positions/pins). Widgets range from small data cards to entire CRM pages embedded live.

## Operating Context

- Desktop-first, used during the working day; also packaged as an Electron desktop app.
- Hash-routed SPA with a persistent left sidebar (collapsible, categorized) and a top bar.
- "Deputy" is an in-app AI assistant that can read app state and propose actions (e.g. drafting SMS, surfacing proposals on the dashboard).
- Public GitHub repository: no build-time secrets, no committed customer data.

## Capabilities and Constraints

- **Stack:** vanilla JS (no framework), Vite build, hash router, custom `store` singleton that branches local IndexedDB vs Supabase by `store.companyId`. Electron wrapper for desktop.
- **Dashboard widgets (must all be preserved):** KPI Cards, Job Status Chart, Technician Map, Recent Activity, Recent Leads, Today's Schedule, Pinned Job Progress, Unassigned Jobs Queue, Uninvoiced Completed Jobs, Low Stock Alerts, Projected Profitability, Staff Availability, Timesheet Exceptions, Asset Status, Overdue Maintenance, Upcoming Maintenance (7d), Top Customers, Daily To-Do, Pending Approvals, Customer Satisfaction (NPS), Cash Flow Summary, Revenue vs Last Month, Invoice Aging, Quote Win Rate, Today's Routes, Weather Forecast, Notifications, Deputy Proposals — plus live "page widgets" (Leads, Quotes, Jobs, Invoices, Customers, Contractors, Suppliers, Assets, Stock, Purchase Orders, Timesheets, Schedule embedded whole).
- **Canvas behaviors (must be preserved):** pan, zoom + zoom-reset (fit all), edit mode (drag/resize/snap-to-grid), add/remove/configure widget, saved views/pins with a default "Home" view, per-user persisted layout, role/permission-gated widget visibility.
- **Sidebar IA (locked this round):** Dashboard, Schedule; Workflow (Leads, Notifications, Quotes, Projects, Jobs, Invoices); People (Customers, Contractors, Suppliers); Resources (Assets, Stock, Purchase Orders, Timesheets); Admin (Documents, Reports, Settings).
- **Iconography:** Material Icons (Outlined) today.
- **Theming:** supports light and dark; **this redesign targets light mode.**
- Roles/permissions drive which modules and widgets appear.

## Brand Commitments

- Name: **RELAY — Dispatch** (logo can be customized per company).
- **Accent color: RELAY orange `#FF5C00` — locked.** It is the brand's single accent and must remain the accent in any redesign.
- Direction of travel already chosen by the user: flat/opaque surfaces (no glassmorphism/blur), an accessibility floor for contrast. Prior glassmorphic look is an anti-reference.
- Typography today: Inter. Not locked.

## Evidence on Hand

- Working application with real, populated screens (the dashboard, list, and detail pages exist and function).
- No fabricated customers, pricing, benchmarks, or testimonials exist and none may be invented; any demonstration data in a concept must be labeled synthetic.

## Product Principles

1. **One screen to run the day.** Density and at-a-glance status beat minimalism; never remove working data to make it prettier.
2. **The canvas is the product.** Spatial arrangement, saved views, and embedding live pages are core identity, not decoration.
3. **Local-first, honest about gates.** Offline works; paid/online features announce why they're gated rather than failing silently.
4. **Orange is the signal.** The accent marks what's actionable and what's live; the rest stays calm.
5. **Legible under load.** A dispatcher scanning 25 widgets needs hierarchy, tabular numerals, and clear status color before charm.

## Accessibility & Inclusion

Maintain an accessibility contrast floor (a user-established requirement). Status must never be conveyed by color alone; keyboard and screen-reader affordances on interactive controls must be preserved.

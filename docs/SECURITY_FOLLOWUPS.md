# Relay — Security Follow-ups

Audit of the public repository `berneyiscool-debug/RELAY-Dispatch` (Vite + vanilla JS front end,
Supabase back end). **All ten register items have been actioned**; two of them
([#1](#2-item-register), [#3](#2-item-register)) are mechanical sweeps recorded in full below,
[#4](#3-item-4--dumpjson-in-the-public-history) can only be closed by the repository owner, and
[#9](#item-9--the-portals-had-no-anonymous-resolution-path-at-all) needed two deploy steps the
owner has now run. [#10](#item-10--the-resolver-handed-the-tenants-ai-key-to-anonymous-callers) was
found during that deployment and is fixed in code, but the exposed key still has to be rotated.

---

## 1. What was fixed

### Layer 1 — escape the render paths

A low-privilege authenticated user can write `name`, `color` and `avatar_url` on their own
`profiles` row (`src/pages/Profile.js`), and every other user in the company renders those fields.
`escapeHTML` (`src/utils/security.js`) existed but was not applied on those render paths, so a
technician could store markup that executed in an admin's session.

Every technician-identity interpolation in an HTML context is now wrapped in `escapeHTML` (or an
equivalent local helper):

- `src/pages/Settings.js`, `src/pages/Dashboard.js`, `src/pages/timesheets/Timesheets.js`,
  `src/pages/reports/Reports.js`, `src/pages/portal/ContractorPortal.js`,
  `src/utils/timesheetModals.js`, `src/pages/jobs/JobDetail.js`, `src/pages/jobs/JobForm.js`,
  `src/pages/schedule/ScheduleView.js`, `src/pages/schedule/ActivityCalendar.js`
- `src/pages/assets/AssetForm.js` — the technician `<option>` list

Attribute-context sites (`src=`, `value=`, `style="background:…"`) are covered too, since
`escapeHTML` escapes `& < > " '`.

The second sweep (register item 1) extends the same treatment to the same class of sink over
non-technician data — customer sites, stock items, suppliers, assets, kits, invoices, quotes,
purchase orders, task templates. Those entities are not writable by a low-privilege technician, so
they were never a privilege-escalation path, but a shared `escapeHTML` call is the difference
between "not currently reachable" and "cannot be reached".

Two of those sources are *tenant*-writable, not admin-only, and reachable from an ordinary form:
`locationTypes` and `storageLocations`. Their option lists are built by helper modules
(`src/utils/storageLocations.js`) rather than inline in a page, which is exactly the shape the
page-level greps miss — `getStorageLocationTypeOptionsHtml` and
`getPhysicalLocationTypeOptionsHtml` interpolated a renameable type name into both the `value`
attribute and the option text unescaped. Both now escape it.

A third shape slipped past the page-level greps for the same reason: **a settings collection that is
edited by its own editor inside Settings**. `settings.materialCategories` is persisted from
hand-built badges (`src/pages/Settings.js`, the `add-category-btn` handler reads
`span.dataset.name` back into `materialCategories`), so the values are arbitrary user text with no
form-level validation, and they were interpolated raw in four places — the badge text and its
`data-name` attribute in `renderMaterialsSettings`, and the same pair on the newly created badge
inside the click handler — plus the `<option>` list in `src/utils/quickModals.js`. All five now
escape. The tell was that the *supplier*-category twin in the same file already called
`escapeHTML(trimmed)`, i.e. the material editor was an un-escaped copy of a correct pattern. Escaping
inside `data-name="…"` is behaviour-preserving: the HTML parser decodes entities in attribute
values, so `span.dataset.name` still yields the original string on read-back.

Helper modules triaged and left alone, for the record: `src/utils/mapsLinks.js` (`encodeURIComponent`
on the destination; the label defaults to the literal `'Navigate'`), `src/utils/dateRangeFilter.js`
(the `label` option defaults to `'Date'` and all thirteen call sites pass literals),
`src/utils/clockPicker.js`, `src/utils/dataBackup.js`, and the `createLink` prompt in
`src/pages/jobs/JobForm.js` — that last one cannot inject `javascript:`, because DOMPurify's default
`ALLOWED_URI_REGEXP` strips it when the rich-text editor is sanitised on save.

### Layer 2 — reject markup at the source

`supabase/migrations/038_profiles_identity_validation.sql` adds CHECK constraints on
`public.profiles`:

- `profiles_name_no_markup` — `name` may not contain `<`, `>` or `"` (item 7)
- `profiles_avatar_url_no_markup` — `avatar_url` may not contain `<` or `>`
- `profiles_color_hex` — `color` must be `#RRGGBB`

The migration runs repair `UPDATE`s first (stripping angle brackets, resetting non-hex colours) so
it can be applied to data that is already poisoned, and adds `color` / `avatar_url` if the project
is missing them — `schema.sql:31` declares `color`, but no incremental migration in the series
created either column.

Apostrophes are deliberately allowed in `name` (`O'Brien`). The `"` in the name class is rejected
because a name is interpolated into attribute positions (`title="…"`, `placeholder="…"`) as well as
text, and one stray quote closes the attribute early.

`src/pages/Profile.js` and `src/pages/Settings.js` (the two places a user can set a name) validate
the same rule client-side so the user gets a field-level message instead of a Postgres `23514`.

Constraints were used rather than extending `profiles_security_guard()` because that trigger
returns early for `auth.uid() IS NULL` and for `relay.admin_provision = 'true'` — exactly the signup
path the attack uses.

### Layer 3 — authorisation, not just sanitisation

`supabase/migrations/039_tighten_profiles_update.sql` closes three findings that escaping cannot
reach.

**§ 1–2 — item 2: `profile_update_tenant` was tenant-scoped but not role-scoped.** `030` granted
every member of a company `UPDATE` on every other member's row, and nothing on the client narrowed
it: Settings → Users renders for any role that can open Settings. Any signed-in user could rewrite
a colleague's row — including the admin's `email`. Pointing a tenant admin's email at an address you
control and triggering a password reset is an account takeover, and it needs no elevated permission.

`039` adds `public.is_company_admin()` (no arguments, `SECURITY DEFINER`, `STABLE`,
`SET search_path = public`, deactivated admins excluded) and recreates `profile_update_tenant` with
the tenant arm narrowed to `id = auth.uid() OR public.is_company_admin()`, on both `USING` and
`WITH CHECK`. `profile_update_own` is left exactly as `030` wrote it, so a user keeps editing their
own profile. The boundary now matches the rest of the admin-only surfaces on the Settings page
(Data Management, Danger Zone, deployment profile, local backup), which are all already gated on
`role === 'admin'` in the client — except that this one is enforced server-side.

`src/pages/Settings.js` also gained a deep-link guard: the `activeTab === 'users'` render was
already role-gated, but a hand-edited `#/settings/users` hash could still reach the tab.

**§ 3 — item 5: the signup RPC bypassed the new name rule.** `create_company_and_admin()` (newest
definition in `036`) inserts `admin_name` straight out of the signup metadata, and the
`profiles_security_guard()` early-return means the insert is not filtered on the way in `039`
redefines the function with `NULLIF(regexp_replace(trim(COALESCE(admin_name, '')), '[<>"]', '', 'g'), '')`
and restores the `REVOKE`/`GRANT` block, so the normalisation applies to every path that calls it.

The `name` value is also mirrored into `auth.users.raw_user_meta_data` by `Profile.js`
(`supabase.auth.updateUser`), which is outside the `038` constraints. The client guard now `return`s
before both `setSessionUser` and `updateUser`, so a rejected name never reaches either the table or
the metadata copy. Accepted trade-off: typing `Mallory <b>` silently becomes `Mallory b` rather than
raising an error.

### Item 3 — inline handlers removed, `script-src` tightened

Two halves. The markup half: 25 inline handler attributes (`onclick=`, `onchange=`, …) across the
page modules were replaced by one delegated listener installed from `src/main.js` —
`src/utils/delegatedEvents.js` (`installDelegatedEvents()`, hooks `data-nav`, `data-close-window`,
`data-click-el`, `data-alert`, `data-stop-propagation`). The three utility classes those sites used
were appended to `src/styles/components.css` rather than left in the markup, so no behaviour stayed
inline.

The policy half: `index.html` no longer allows `'unsafe-inline'` for scripts —
`script-src 'self' https://maps.googleapis.com`. Deliberate details:

- **No nonce.** A nonce causes `'unsafe-inline'` to be ignored in any browser that understands
  nonces, and a static GitHub Pages deployment has nothing to generate one per response. `'self'`
  alone is what makes the policy meaningful.
- **`style-src` keeps `'unsafe-inline'`.** Inline `style=` attributes are pervasive in this
  codebase, and the Document/Email Studio preview frames are `srcdoc` documents containing inline
  `<style>`. Tightening that is a separate, larger change; script execution is the finding.
- **No `frame-ancestors`.** GitHub Pages cannot send response headers, and a `<meta>`-delivered
  `frame-ancestors` is ignored by browsers (it is only honoured in a header), so including it would
  have been decoration. Clickjacking is instead addressed by a frame-bust guard at the top of
  `src/main.js`: if `window.self !== window.top` the document is emptied and a warning logged, with
  a same-origin allowance so the app's own offscreen render frame (`src/utils/documentPdf.js`) is
  unaffected. `frame-ancestors` / `X-Frame-Options` should be added at the CDN the day the app moves
  off Pages.
- **A CSP is inherited by `about:blank` and `srcdoc` contexts**, which is easy to miss: a
  script-created window (`window.open('', '_blank')`) or an `iframe.srcdoc` gets its opener's
  policy. The barcode-label print sheet in `src/pages/stock/StockList.js` was written with an inline
  `<script>window.onload = … window.print()</script>` and would have silently stopped printing; it
  now registers the load handler from the opener before `document.write` (plus an
  `if (!printWindow) return;` popup-blocker guard). The same inheritance means a user-authored
  `<script>` inside a Document/Email Studio template is now refused — a bonus, and no bundled
  template contains one.

Preconditions checked before removing `'unsafe-inline'`: zero inline `<script>` blocks in `src/`,
zero `on*=` attributes outside test fixtures, no `setAttribute('on…')`, no `eval(` / `new Function(`,
no `javascript:` URLs, and the only `createElement('iframe')` writes no script. Confirmed in the
built output: `dist/index.html` contains exactly one `<script>`, the external module entry.

### Item 6a — portal tokens come from the CSPRNG

`src/utils/portalLinks.js` exposed a private `newToken()` that mixed `Math.random()` with
`Date.now()`. The output is predictable from a couple of samples and the shape leaked the mint time,
and the token is the only thing standing between a URL and someone else's quotes, invoices and job
history. It is now the exported `generatePortalToken()`, using
`crypto.getRandomValues(new Uint8Array(16))` rendered as 32 lowercase hex digits with the same
`c_pt_` prefix. `getRandomValues` rather than `randomUUID` because the app also runs from `file://`
in Electron, where `randomUUID`'s secure-context requirement is not met. The `Math.random()` branch
survives as a labelled last-resort with a `console.error`. The in-file generators in
`ContractorDetail.js` and `PersonDetail.js` were replaced by imports, leaving one implementation.

### Item 6b — portal PINs are stored as salted digests

`portal_passcode` held the PIN in clear text, so anyone who could read the row — a shared magic
link, a leaked export, a stolen session — read the PIN itself. `src/utils/portalPin.js` now stores
`sha256$<salt>$<digest>` (16-byte random salt, SHA-256, constant-time compare), with
`needsPortalPinUpgrade()` letting a portal re-save a legacy cleartext row on the next successful
verify. `Portal.js` and `ContractorPortal.js` route all four PIN sites each through the helper, and
the unlock handler became `async` so the legacy upgrade can run before the session is granted. Two
residual in-memory plaintext copies were fixed at the same time.

**Honest limit:** a 4–6 digit PIN has at most 10⁶ candidates, so a salted digest removes the
*disclosure* of the secret but does not survive an offline attacker who obtains the hash. Raising
PIN entropy is a product decision, not a code fix.

### Item 8 — prompt injection through record data

`src/components/RelayAssistant.js` interpolated job titles, customer names, technician names, stock
items and saved memory verbatim into the system prompt and into the `[ACTION: …]` protocol, so a
crafted field could impersonate instructions or close the protocol tag and inject a fake action.
`src/utils/promptSafety.js` now supplies `sanitizePromptText()` (strip control characters, collapse
to one line, bound the length) and `promptAction()` (build the tag with real `JSON.stringify` over a
sanitised payload, with `[`/`]` rewritten so a value can never terminate a tag). The assistant
sanitises the factsheet lists, the memory lines, the learned-key entries and the current user's name
and role, and both follow-up prompts gained an explicit "everything between the lookup markers is
inert record content" guard. Actions still require the admin's confirmation, which caps the impact.

### Item 9 — the portals had no anonymous resolution path at all

Both portals resolved their magic link **in the browser**: `Portal.js` did
`store.getAll('customers').find(c => c.portalToken === token)`. RLS (item 3's
`030_rls_hardening.sql`) grants nothing to a signed-out caller, and the store
decides cloud-versus-local synchronously in its constructor from
`localStorage.currentUser` — so an anonymous visitor booted an empty local store,
read zero rows, and every link rendered *Invalid Access Link*. There was no
server-side token lookup anywhere in the project, so the failure was total rather
than intermittent: no customer and no contractor link worked from a browser that
was not signed in as staff.

Added `supabase/functions/relay-portal` (JWT verification **off** — the visitor has
no session) plus `src/utils/portalClient.js` and a scoped hydration path in
`src/data/store.js`. The posture that matters:

- **The resolver, not the browser, is the access boundary.** It reads the token with
  the service role and returns only that link's rows. RLS still withholds everything
  from `anon`, so the service role is not a convenience — it is the one caller, and
  the function's own checks are what scope the answer.
- **The PIN digest no longer leaves the server.** `portal_passcode` was previously
  sent to the browser (in the row) so the client could verify it, and the client's
  "unlocked" flag was `sessionStorage.setItem(…, 'true')` — forgeable, and it gated
  reads only. Hashing (item 6b) removed the disclosure but the digest still
  travelled; now the compare happens inside the function, and the legacy cleartext
  upgrade runs there too. On success it mints a short-lived opaque grant (32 random
  bytes, stored **only as a sha256 digest** in `portal_sessions`, ~12 h TTL, kept in
  the visitor's `sessionStorage`), and **every** write requires a live grant — so the
  PIN gates what leaves the building, not just what is displayed.
- **Writes are allow-listed by column, not by collection.** The store prepares the
  row (it already owns the snake_case mapping and the packed-column packing) and the
  resolver decides whether it may land: which collections a kind may write at all, and
  then which columns. The list is deliberately narrow — "anything except `id`" would
  let a contractor set their own `hourly_rate` — and `company_id` / `created_by` are
  stripped from every payload and stamped by the resolver, so a portal cannot move a
  row across tenants or choose its own attribution (`created_by` is also what decides
  whether the bell treats a notification as machine-generated). Ownership is re-read
  from the database on every write rather than inferred from the token, and each
  contractor job is proven through the same `tasks` jsonb walk that decides which jobs
  the portal may read.
- **Brute force and link-harvesting are both bounded.** Failed PIN attempts land in
  `portal_access_log` and are throttled from it, every resolve and every write is
  logged with its outcome, and `042_portal_token_lookup.sql` gives both token columns a
  unique partial index — a token that matches two rows is refused rather than silently
  resolving to the first.

**Honest limits.** The token is a bearer credential: anyone who holds the link and
knows the PIN is the customer. That is the design (it is what makes a magic link a
magic link), and it means a link forwarded to the wrong inbox is a disclosure — the
mitigation is to regenerate the token, which revokes the old link, not to detect the
misuse. Item 6b's ceiling on PIN entropy still applies here, which is why the throttling
above is load-bearing rather than decorative. And a portal scope is only as tight as
`relatedPlanFor()` in `supabase/functions/relay-portal/portal.js`: widening the rows a
portal may read is a security change, not a display change.

Deployment: applying `042` and deploying the function are independent steps, and the
function runs with JWT verification **off** — the one deliberate exception in the
project. Until `042` is applied the resolver's token lookup finds nothing and every
link answers *Invalid Access Link*; this is verified by `npm run test:migrations`
(pglite) and `supabase/tests/relay-portal.test.js`, not from the live project.

### Item 10 — the resolver handed the tenant's AI key to anonymous callers

Found while verifying item 9 against the live project, so it was **introduced by item 9's own fix**
and never existed before it: `relay-portal` returned the company's whole `settings` blob in every
response. That blob is not one thing — it carries the portal's branding and copy, but on the live
tenant it also carried `ai` (with a working provider API key) and `_subscription`. Every one of
those responses reaches a visitor who holds nothing but a magic link, and it leaked **before the PIN
was entered**: the `passcode_setup`, `locked`, `throttled` and `offline` bodies all carried it, so a
single anonymous `POST {"action":"load"}` was enough to read the key.

Confirmed against the live project — `settings.ai.apiKey` came back verbatim in a `403` body to a
request that had presented no PIN and no session.

Fixed by projecting the blob through an explicit allow-list — `PUBLIC_SETTINGS_KEYS` and
`publicSettings()` in `supabase/functions/relay-portal/portal.js` — applied once where `ctx.settings`
is built, so no individual response site can reintroduce the raw object. It is an allow-list rather
than a deny-list of `ai` and `_subscription` on purpose: the next settings key nobody has reviewed
yet is withheld by default rather than published by default. The switch that takes a portal offline
is still read from the raw blob, so narrowing the public list can never silently disable a portal.

The portal keeps everything it renders from: identity and branding, the portal switches and copy, the
tax/markup/labour keys it uses for totals, the catalogs behind its filters, `documentTheme`, and the
`payments` / `_connect` pair the pay button checks. Neither of the last two is a credential — the
Stripe secrets have never lived in this blob.

**The provider key must be rotated.** It was retrievable by anyone holding any portal link, and links
are already in customers' inboxes — so it has to be treated as disclosed, not merely as no longer
being disclosed. Replacing it in Settings is the only step that makes the old value useless.

---

## 2. Item register

| # | Severity | Item | Status |
|---|----------|------|--------|
| 1 | 🟠 High | Same-class unescaped `.name` sinks over non-technician data (customer sites, stock, suppliers, assets, kits, invoices, quotes, purchase orders, task templates, reports) | ✅ Swept — `escapeHTML` applied across `AssetForm.js`, `StockForm.js`, `StockDetail.js`, `SupplierForm.js`, `SupplierDetail.js`, `KitDetail.js`, `InvoiceDetail.js`, `QuoteDetail.js`, `PurchaseOrderDetail.js`, `PrintPreview.js`, `Reports.js`, `Dashboard.js`, `storageLocations.js`, the `materialCategories` editor in `Settings.js` and its `quickModals.js` option list, and others |
| 2 | 🟡 Medium | `profile_update_tenant` granted company-wide `UPDATE` on `profiles` | ✅ Fixed — `039` §1–2 (`is_company_admin()`, narrowed policy) + Settings deep-link guard |
| 3 | 🟡 Medium | CSP allows `'unsafe-inline'` scripts, so a missed escaping site is still exploitable | ✅ Fixed — 25 inline handlers replaced by one delegated listener (`src/utils/delegatedEvents.js`) and `script-src` tightened to `'self' https://maps.googleapis.com`; see [§1](#item-3--inline-handlers-removed-script-src-tightened) |
| 4 | 🟡 Medium | `dump.json` retrievable anonymously from public git history | ⚠️ Triaged — no credentials, no rotation; removal needs the owner. See [§3](#3-item-4--dumpjson-in-the-public-history) |
| 5 | 🟡 Medium | `name` mirrored into `auth.users.raw_user_meta_data` outside the `038` constraints | ✅ Fixed — `Profile.js` guard returns before both `setSessionUser` and `updateUser`; `039` §3 normalises the RPC |
| 6 | ⚪ Low | `Math.random()` portal tokens and a cleartext `portal_passcode` | ✅ Fixed — `generatePortalToken()` (6a) and `src/utils/portalPin.js` (6b) |
| 7 | ⚪ Low | A residual `"` in `name` was allowed by `038` | ✅ Fixed — `038` repair and CHECK now reject `<`, `>` and `"`; client guards match |
| 8 | 🟡 Medium | Technician-controlled data reaches the AI assistant's prompt and action protocol | ✅ Fixed — `src/utils/promptSafety.js`, inert-content guard in both follow-up prompts |
| 9 | 🟠 High | Both portals resolved their magic link in the browser, where RLS gives an anonymous visitor nothing — every customer and contractor link answered *Invalid Access Link* | ✅ Fixed in code — `relay-portal` resolver, `portalClient.js`, scoped hydration in `store.js`, `042_portal_token_lookup.sql`. ⚠️ **Needs the owner**: apply `042` and deploy the function with JWT verification off. See [§1 Item 9](#item-9--the-portals-had-no-anonymous-resolution-path-at-all) |
| 10 | 🔴 Critical | `relay-portal` returned the company's whole `settings` blob — including the tenant's `ai.apiKey` — to anonymous callers **before any PIN was entered** | ✅ Fixed — `publicSettings()` allow-list, applied where `ctx.settings` is built and verified against the live project. ⚠️ **Needs the owner**: rotate the provider key. See [§1 Item 10](#item-10--the-resolver-handed-the-tenants-ai-key-to-anonymous-callers) |

**Residual, out of scope (pre-existing):** `030`'s `profiles_security_guard()` already makes the
admin role-change / Deactivate / Reactivate controls server-side no-ops for authenticated sessions.
`src/utils/permissions.js` defines `Settings.manage_users`, but no UI reads it, and `currentUser`
defaults to `{"role":"admin"}` when local storage lacks it — so the client gate on the Users tab is
cosmetic and `039` is the real control.

---

## 3. Item 4 — `dump.json` in the public history

### What is exposed

A 43,707-byte `dump.json` containing 36 job records — all from one company, one customer and one
`siteAddress`, with 36 `contactName` values, 36 `notes` fields, internal costing (`laborCost`,
`materialCost`, `estimatedLaborCost`, `estimatedMaterialCost`) and schedule configuration. It is
retrievable **anonymously** from `raw.githubusercontent.com` (verified: unauthenticated `GET` → 200).

The blob (`3053284223…`) is reachable from exactly three refs:

- `refs/pull/25/head` — "Fix GitHub Pages deploy timeout (cancel-in-progress collision)", merged 2026-08-07
- `refs/pull/26/head` — "Trigger GitHub Pages redeploy", merged 2026-08-07
- `refs/pull/27/head` — "Fit app to the visible viewport on iPad/iOS", merged 2026-08-07

All three share the deleted head branch `claude/domain-website-hosting-xwnrff`.

**`main` is not affected.** `git merge-base main 4ce0608` returns the commit's own parent
(`6f79a991…`) and `git merge-base --is-ancestor 4ce0608 main` exits 1, so `4ce0608…` is a
side-branch child of an on-main commit — not rewritten `main` history. `git log --all -- dump.json`
and a per-branch path query both return nothing for `main`, and the file is not in the working tree.
There is nothing to purge from `main`.

### What is *not* exposed

A key scan over the payload found **zero** matches for `password`, `passcode`, `portal_passcode`,
`secret`, `token`, `apiKey`/`api_key`/`apikey`, `service_role`, `anon_key`, `eyJ`, `sk-`, `email`,
`@`, `address`, `payRate`/`pay_rate` or `phone`. **No credentials are present, so nothing needs to be
rotated.** Impact is the disclosure of one tenant's operational snapshot: LOW–MODERATE.

### Why this needs the owner

Merged-PR refs are permanent on GitHub. No client-side rewrite — `filter-branch`, `filter-repo`, a
force-push — can make the blob unreachable, and force-pushing `main` on a public repository would
rewrite history for every existing clone without closing the exposure. This one has to be a support
request.

### Runbook

1. **Ask GitHub Support to remove the cached object.** Reference the repository, the blob
   `30532842233113e95e956cc0be53f4130cf5e612` and the three `refs/pull/{25,26,27}/head` refs that
   reach it. This is the only step that closes the exposure.
2. *(optional, defence in depth)* In a fresh clone, delete the local refs added while investigating
   (`git for-each-ref --format='%(refname)' refs/remotes/originpr | …`), then
   `git reflog expire --expire=now --all` and `git gc --prune=now --aggressive`.
3. **Verify.** `git merge-base --is-ancestor 4ce0608 origin/main` must still exit non-zero (it will —
   the commit was never on `main`), and an anonymous request to
   `https://raw.githubusercontent.com/berneyiscool-debug/RELAY-Dispatch/4ce0608…/dump.json` should
   stop returning 200 once support acts.
4. **No rotation is required.** Do not change any credential on account of this finding.

**Prevention is already in place.** `.gitignore` lines 28–44 list `dump.json`, `*dump*.json`,
`schedule_debug*.json`, `*_export.json`, `*_backup.json` alongside `scratch/`, `scratch_*`,
`rebrand.js`, `test-script*.js` and `test-*.js`. The comment there names `4ce0608` and records that
the repository is public. If a guard is wanted on top of that, the cheapest one is a job appended to
`.github/workflows/deploy.yml` that fails when a staged path matches `*dump*.json` or
`*_export.json`.

---

## 4. Verification

- `npm run test:migrations` — the pglite harness in `supabase/tests/migrations.test.js` executes
  `036`, `038` and `039` against a fixture and covers repair, rejection on every role, the signup RPC
  path, the narrowed update policy, `create_company_and_admin` normalisation, and re-runnability of
  every file. **148 tests / 148 pass.**
- `npm test` — unit suite, including the new `delegatedEvents`, `portalPin`, `portalLinks` and
  `promptSafety` suites. **416 tests / 66 suites; 410 pass, 6 fail.** All 6 failures are in
  `src/components/FinishSetupCard.test.js`, an in-flight file from a separate workstream that
  landed after this sweep (its assertions target session-storage and submit-label behaviour); every
  suite touched by this remediation — escaping, `delegatedEvents`, `portalPin`, `portalLinks`,
  `promptSafety` — passes.
- `node --check` on each file edited in the final pass, and a targeted re-read of
  `src/utils/storageLocations.js`, `src/pages/stock/StockDetail.js`,
  `src/pages/suppliers/SupplierDetail.js`, `src/pages/Settings.js` (the four material-category sites)
  and `src/utils/quickModals.js` to confirm the escapes sit in the sink, not beside it.
- Re-scan after the last edits: the diff touches **48 tracked files, +2,090 / −652** (plus the new
  `038`/`039` migrations and helper modules, which are untracked), and a parity grep for
  bare `.name` / `.role` / `.avatarUrl` / setting-value interpolations inside template literals
  returns no remaining unescaped tenant-writable sink.
- `npm run build` — `vite build`, catches template-literal slips from the escaping edits. Exit 0.
- Grep for `on[a-z]+="` over `src/**/*.js` returns one hit, a `UsageBars.test.js` fixture string —
  no production handler attribute survives, which is what makes the tightened `script-src` safe.
- `dist/index.html` was read after the build to confirm the new CSP meta survives verbatim and that
  the page still emits exactly one external `<script>`.

### Item 9 — verification

- `npm run test:migrations` — the pglite harness now covers `042` alongside the rest of the
  chain: the unique partial index on each token column, the `DISTINCT ON` de-duplication of
  pre-existing duplicate tokens, whitespace normalisation, the `portal_access_log` shape, and
  the absence of any policy on `portal_sessions`. **296 tests / 296 pass.**
- `npm test` — **630 tests / 630 pass**, including `src/data/store.test.js`'s `portal scope`
  block (ordered writes, the dedupe swap, rejected-column parity against the resolver's own
  allow-lists) and the `supabase/tests/relay-portal.test.js` resolver cases: `rejectedColumns()`
  is asserted **empty** for every payload a portal legitimately sends — exact for updates, subset
  for inserts — and asserts `portal_token` is refused on insert. The `portalLinks` suite covers
  the un-awaited-write defect directly.
- `npm run build` — `vite build`, run after the portal pages were rewired to the async load
  path, to catch import slips the unit runner would not see. Exit 0.
- **Not** verified from here: the edge function itself. There is no Deno on this machine, so
  `supabase/functions/relay-portal/index.ts` has never been type-checked or executed; the
  extractable logic lives in `portal.js` (mirroring `reconcile.js`) precisely so the test runner
  can reach it with plain `node --test`.

### Item 10 — verification

- `supabase/tests/relay-portal.test.js` — eight cases over `publicSettings()`: the provider key and
  `_subscription` are absent; nothing in the serialised payload carries the key; a blob holding
  every key the live tenant has loses **only** those two; the branding, money and catalog keys the
  portal renders from survive; a key nobody has reviewed yet is withheld; an explicit `null`
  survives so the client's default cannot override the operator's choice; the input is not mutated.
  **47 tests / 47 pass**, and `npm run test:migrations` reports **304 / 304**.
- Verified against the live project, not just in the harness: a throwaway customer row was pointed
  at the one tenant whose `settings` actually contains `ai` (24 keys), and an anonymous `load`
  returned **22** — every branding key present, `ai` and `_subscription` gone, and no `apiKey` or
  `sk-` anywhere in the body. The row, its `portal_sessions` rows and its `portal_access_log` rows
  were then deleted, and the deletion confirmed.
- The function was redeployed and **both** assets re-uploaded (`index.ts` *and* `portal.js`) — a
  partial upload would have left the new allow-list unreachable while looking successful.
- The key is not in this repository: the test fixture carries a placeholder, so the live value was
  never written down here.

### Deployment note

`038` and `039` are only useful once applied. Confirm they have run against the live Supabase
project (`supabase db push` or the SQL editor); nothing in the repository can verify that from here.

`042` and the `relay-portal` deploy are the same — two separate steps, and the feature is broken
until both are done. The function must be deployed **without** JWT verification
(`--no-verify-jwt`), because a portal visitor has no session — the same reason the public lead
endpoints, the Stripe webhook and `relay-create-payment` already run with it off. See
`docs/SUPABASE_MIGRATION.md` §12c.

---

## 5. Related

- `docs/SUPABASE_MIGRATION.md` — migration conventions, and §12c for the `relay-portal` deploy.
- `src/utils/security.js` — the `escapeHTML` helper the render rules assume.
- `src/utils/delegatedEvents.js` — the delegated event layer that replaces inline handlers.
- `src/utils/portalPin.js`, `src/utils/promptSafety.js` — the helpers behind items 6b and 8.
- `supabase/functions/relay-portal/` — the resolver behind items 9 and 10, and its pure helpers in
  `portal.js`; the write allow-lists and the settings allow-list (`PUBLIC_SETTINGS_KEYS`) asserted
  by the test suite both live there.

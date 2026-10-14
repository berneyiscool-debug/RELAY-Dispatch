// Pure decision logic for relay-portal. No Deno APIs, no Supabase client, no
// I/O — everything here is importable from node:test, which is the only way to
// test the rules the anonymous portal depends on. index.ts owns the queries.
//
// The whole point of this function is that a magic link resolves on the SERVER.
// It used to resolve only against whatever happened to be in the visitor's
// browser, and an anonymous visitor's browser cache is empty by design — so every
// link in every inbox landed on "Invalid Access Link". The rules below are what
// stands between the open internet and a tenant's customer records, so they are
// kept out of the request handler where they can actually be tested.

export const PORTAL_KINDS = ['customer', 'contractor'];

// Tokens are `c_pt_` + 32 hex today, but the format has drifted before: the legacy
// generator used base36 + a timestamp, and one seed path wrote `c_pt_${custId}`.
// Anything still sitting in an inbox has to keep working, so validation only
// insists on the character class and length — the lookup is what proves a token.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

const PIN_PREFIX = 'sha256$';
const SALT_BYTES = 16;

// The PIN is 4-6 digits, as the portal's own setup form has always required.
const PIN_PATTERN = /^\d{4,6}$/;

// A visitor gets this many wrong PINs inside the window before the link stops
// accepting attempts. portal_access_log (migration 042) already records every
// attempt, so the resolver counts them there rather than trusting the client.
export const PIN_ATTEMPT_LIMIT = 5;
export const PIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// Long enough to survive a working day of reloads, short enough that a grant left
// behind on a shared machine expires. The sessionStorage flag it replaces never
// expired at all.
export const GRANT_TTL_MS = 12 * 60 * 60 * 1000;

// Never leave the server. projectRecord strips these before anything is
// serialised: the column holding the PIN digest is the one an attacker would most
// like to copy, and the token is what they already have.
export const PORTAL_SECRET_COLUMNS = ['portal_passcode', 'portal_token'];

export function isPortalKind(kind) {
  return PORTAL_KINDS.includes(kind);
}

export function recordTableFor(kind) {
  return kind === 'contractor' ? 'contractors' : 'customers';
}

export function isWellFormedToken(token) {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

// Settings default to enabled: the portals check `!== false`
// (Portal.js:25, ContractorPortal.js:39), so a missing key must not lock people out.
export function portalEnabled(kind, settings) {
  const flag = kind === 'contractor' ? 'enableContractorPortal' : 'enableCustomerPortal';
  return (settings || {})[flag] !== false;
}

// The company blob is not one thing. It carries the portal's branding and copy, but
// it also carries `ai` — the tenant's live provider API key, endpoint, model and
// system prompt — and `_subscription`. Portal responses go to an anonymous visitor
// holding nothing but a magic link, so the server sends an allow-list rather than the
// blob: the same reasoning as PUBLIC_RECORD_COLUMNS, and it fails closed if a future
// settings key is added without anyone revisiting this list.
export const PUBLIC_SETTINGS_KEYS = [
  // who the company is, and how their portal looks
  'name', 'abn', 'phone', 'email', 'address', 'website', 'domain', 'logo', 'logoSmall',
  // the switches and copy the portal screens are built from
  'enableCustomerPortal', 'enableContractorPortal',
  'customerPortalWelcome', 'customerPortalPayment',
  // money, so a portal renders the same totals the office does
  'taxEnabled', 'taxRate', 'markupPercent', 'materialMarkup',
  'laborRates', 'laborRounding', 'rateMappings',
  // catalogs the portal's filters and forms offer
  'jobTypes', 'materialCategories', 'supplierCategories',
  'documentTheme',
  // Per-company payments config and the read-only Connect status the portal's pay
  // button checks. Neither is a credential; the Stripe secrets never live in this blob.
  'payments', '_connect',
];

// Deliberately absent, and must stay absent: `ai` (provider API key) and
// `_subscription` (plan, status, billing identifiers).
export function publicSettings(settings) {
  const out = {};
  if (!settings || typeof settings !== 'object') return out;
  for (const key of PUBLIC_SETTINGS_KEYS) {
    // `in`, not a truthiness check: an explicit null is a decision, and dropping it
    // would let the client's default overwrite what the operator chose.
    if (key in settings) out[key] = settings[key];
  }
  return out;
}

export function normalizePin(raw) {
  const value = String(raw ?? '').trim();
  return PIN_PATTERN.test(value) ? value : null;
}

// 'setup' means nobody has claimed this link yet, so the visitor may set the PIN.
export function pinRequirement(stored) {
  return typeof stored === 'string' && stored.trim() !== '' ? 'required' : 'setup';
}

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isHashedPin(stored) {
  return typeof stored === 'string' && stored.startsWith(PIN_PREFIX);
}

// True when the stored value predates hashing, so a successful verify should
// replace it with a digest rather than keep the secret in the clear.
export function needsPinUpgrade(stored) {
  return typeof stored === 'string' && stored.trim() !== '' && !isHashedPin(stored);
}

export async function hashPin(pin) {
  const salt = new Uint8Array(SALT_BYTES);
  globalThis.crypto.getRandomValues(salt);
  const saltHex = toHex(salt);
  return `${PIN_PREFIX}${saltHex}$${await digestHex(saltHex, String(pin))}`;
}

async function digestHex(saltHex, pin) {
  const data = new TextEncoder().encode(`${saltHex}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

// Length-independent, so a wrong PIN cannot be narrowed down by timing. Only
// meaningful because both sides are equally long digests.
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Mirrors utils/portalPin.js so a digest written by the browser verifies here and
// vice versa — the staff app shares the same format, and existing digests must
// keep working.
export async function verifyPin(enteredPin, stored) {
  const entered = String(enteredPin ?? '');
  if (typeof stored !== 'string' || stored.trim() === '') return false;
  if (!isHashedPin(stored)) {
    // Legacy cleartext row. The caller upgrades it on success.
    return constantTimeEqual(entered, stored);
  }
  const [, saltHex, expected] = stored.split('$');
  if (!saltHex || !expected || !globalThis.crypto?.subtle) return false;
  return constantTimeEqual(await digestHex(saltHex, entered), expected);
}

// A grant is a bearer credential the portal keeps in sessionStorage. 32 bytes of
// CSPRNG output, so guessing is not a strategy; only the digest is stored, so
// reading the table is not a strategy either.
export function newGrant() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashGrant(grant) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(grant)));
  return toHex(new Uint8Array(digest));
}

export function grantExpiry(nowMs) {
  return new Date(nowMs + GRANT_TTL_MS).toISOString();
}

// Outcomes recorded in portal_access_log. Kept unconstrained in the migration so a
// new outcome needs no schema change, which means the names live here.
export const ACCESS_OUTCOMES = {
  resolve: 'resolve',
  passcodeSetup: 'passcode_setup',
  passcodeOk: 'passcode_ok',
  passcodeFail: 'passcode_fail',
  passcodeUpgraded: 'passcode_upgraded',
  action: 'action',
};

// Counted from the access log rather than from anything the caller sends, so
// clearing sessionStorage does not buy more attempts.
export function throttleDecision(failures, nowMs) {
  const relevant = (failures || []).filter((f) => f && f.outcome === ACCESS_OUTCOMES.passcodeFail);
  if (relevant.length < PIN_ATTEMPT_LIMIT) {
    return { throttled: false, attemptsRemaining: PIN_ATTEMPT_LIMIT - relevant.length };
  }
  const oldest = Math.min(...relevant.map((f) => Date.parse(f.occurred_at)));
  const retryAt = oldest + PIN_ATTEMPT_WINDOW_MS;
  if (!Number.isFinite(retryAt) || retryAt <= nowMs) {
    return { throttled: false, attemptsRemaining: PIN_ATTEMPT_LIMIT };
  }
  return {
    throttled: true,
    retryAfterSeconds: Math.max(1, Math.ceil((retryAt - nowMs) / 1000)),
  };
}

export function projectRecord(row) {
  if (!row || typeof row !== 'object') return null;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (PORTAL_SECRET_COLUMNS.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

// The locked and setup screens name the party the link belongs to, so those fields
// travel before the PIN does. Everything else waits for the grant: holding a link
// should not hand over a customer's contact details, address or history, and the
// screens do not need them. Both shapes are listed because the identifier differs
// by kind — a customer is a company/first_name/last_name record, a contractor is a
// name/contact_name record.
export const PUBLIC_RECORD_COLUMNS = ['id', 'company', 'first_name', 'last_name', 'name', 'contact_name'];

export function publicRecord(row) {
  if (!row || typeof row !== 'object') return null;
  const out = {};
  for (const key of PUBLIC_RECORD_COLUMNS) {
    if (key in row) out[key] = row[key];
  }
  return out;
}

// What a visitor may read once the token checks out. Declarative so the request
// handler stays a query loop and the scoping rules stay inspectable.
//
// `exclude` mirrors a filter the portal already applied in the browser (a customer
// never sees a Draft quote); pushing it into the query means the row never travels.
// The contractor's jobs come from the jsonb task walk in portal_contractor_job_ids
// rather than a column, because there is no column — assignment lives in `tasks`.
export function relatedPlanFor(kind) {
  if (kind === 'contractor') {
    return [{ key: 'jobs', table: 'jobs', via: 'contractor_task_assignment' }];
  }
  return [
    { key: 'jobs', table: 'jobs', column: 'customer_id', from: 'recordId' },
    { key: 'quotes', table: 'quotes', column: 'customer_id', from: 'recordId', exclude: { column: 'status', equals: 'Draft' } },
    { key: 'invoices', table: 'invoices', column: 'customer_id', from: 'recordId' },
    { key: 'assets', table: 'assets', column: 'customer_id', from: 'recordId', require: { column: 'owner_type', equals: 'Customer' } },
    { key: 'maintenancePlans', table: 'maintenance_plans', column: 'asset_id', from: 'assetIds' },
  ];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
// A portal visitor is anonymous to RLS, so every write has to come back through
// this function. The client prepares the row — it already owns the snake_case
// mapping and the packed-column packing in store.js — and the rules here decide
// whether that row may land. Two questions, answered separately:
//
//   1. may this kind write to this collection at all?  (COLLECTION_WRITES)
//   2. may it write these COLUMNS?                      (WRITE_COLUMNS)
//
// The column list is the security boundary, and it is deliberately narrow. It is
// NOT "anything except id/company_id": a contractor editing their own record would
// otherwise be able to set their own hourly_rate. Each collection lists exactly the
// fields the portals actually change, cross-checked against the store's
// TABLE_COLUMNS whitelist.
const COLLECTION_WRITES = {
  customer: ['customers', 'jobs', 'quotes', 'notifications'],
  contractor: ['contractors', 'jobs', 'customers'],
};

// Each entry is either one list (same for insert and update) or `{insert, update}`.
// `update` is the small surface the portals actually modify after the fact;
// `insert` exists only where a portal legitimately creates a row, and an absent
// `insert` means that collection can never gain a row from the portal.
const NO_INSERT = [];

// `update` also carries `updated_at`, because store.js updates stamp it on every
// write and the client sends only the columns that changed — leaving it out would
// reject every legitimate edit. It is a timestamp, not a lever.
const TOUCH = 'updated_at';

const WRITE_COLUMNS = {
  customer: {
    // portal_passcode is the portal's set / change PIN; portal_last_accessed is
    // the staff-facing "Last Accessed" stamp.
    customers: { update: ['portal_passcode', 'portal_last_accessed', TOUCH], insert: NO_INSERT },
    // jobs pack activityLog / customerActivityLog into `notes`, so a single column
    // carries every activity entry the customer portal appends. A customer never
    // creates a job — a service request becomes a notification.
    jobs: { update: ['notes', TOUCH], insert: NO_INSERT },
    quotes: { update: ['status', 'line_items', TOUCH], insert: NO_INSERT },
    // Exactly the columns the three store.create('notifications', …) call sites in
    // Portal.js produce. `source` and `createdBy` are set there but are not columns
    // and never reach the payload. `origin` is deliberately absent: it drives
    // notification visibility, so a portal must not be able to choose it.
    notifications: {
      insert: ['id', 'number', 'title', 'message', 'link', 'status', 'read', 'description',
        'type', 'priority', 'customer_id', 'customer_name', 'contact_name', 'site_name',
        'asset_id', 'created_at', TOUCH],
      update: [],
    },
  },
  contractor: {
    contractors: { update: ['portal_passcode', 'portal_last_accessed', 'compliance_docs', TOUCH], insert: NO_INSERT },
    jobs: {
      update: ['tasks', 'notes', 'status', TOUCH],
      // The B2B import copies one of the office's own jobs into the contractor's
      // books, so it legitimately carries the amounts it was given plus the fields
      // the import sets. Money is absent from `update` on purpose: a contractor may
      // copy a job's cost, not rewrite it. technician_id / technician_name / quote_id
      // are absent from both — who attends a job, and what it bills against, is the
      // office's call.
      insert: ['id', 'number', 'customer_id', 'customer_name', 'contact_name', 'site_address',
        'title', 'type', 'status', 'priority', 'scheduled_date', 'estimated_hours',
        'labor_cost', 'material_cost', 'tasks', 'notes', 'created_at', TOUCH],
    },
    // Customers are created by the B2B import only when the office name is not
    // already on file; the resolver re-checks that server-side. portal_token and
    // portal_passcode are absent, so a portal cannot hand itself a new link or PIN.
    customers: {
      insert: ['id', 'company', 'first_name', 'last_name', 'email', 'phone', 'address',
        'status', 'type', 'created_at', TOUCH],
      update: [],
    },
  },
};

// Never taken from the request, always set by the resolver. company_id scopes the row
// to the tenant the token belongs to. created_by is attribution, but it also decides
// whether the bell treats a notification as machine-generated rather than human
// (utils/notificationVisibility.js reads `createdBy === 'System Engine'`), so a portal
// must not be able to choose it — see PORTAL_CREATED_BY for what is stamped instead.
export const SERVER_OWNED_COLUMNS = ['company_id', 'created_by'];

// The attribution a portal-raised record carries, replacing what the pages send today.
const PORTAL_CREATED_BY = {
  customer: 'Customer (Portal)',
  contractor: 'Contractor (Portal)',
};

export function portalCreatedBy(kind) {
  return PORTAL_CREATED_BY[kind] || 'Portal';
}

export function isWritableCollection(kind, collection) {
  return (COLLECTION_WRITES[kind] || []).includes(collection);
}

export function allowedWriteColumns(kind, collection, mode = 'update') {
  const entry = ((WRITE_COLUMNS[kind] || {})[collection]);
  if (!entry) return [];
  const list = Array.isArray(entry) ? entry : (entry[mode] || []);
  return list.filter((c) => !SERVER_OWNED_COLUMNS.includes(c));
}

export function canInsert(kind, collection) {
  return allowedWriteColumns(kind, collection, 'insert').length > 0;
}

export function canUpdate(kind, collection) {
  return allowedWriteColumns(kind, collection, 'update').length > 0;
}

// Returns the offending names, so a rejection can say what was refused rather than
// just "forbidden".
export function rejectedColumns(kind, collection, payload, mode = 'update') {
  const allowed = allowedWriteColumns(kind, collection, mode);
  return Object.keys(payload || {}).filter((key) => !allowed.includes(key));
}

// How ownership is proven before a row is touched.
//   self       — the record the token belongs to
//   customer   — a row whose customer_id is the token's record
//   contractor — a row this contractor is assigned to via the task walk
//   insert     — a new row; ownership is the company_id stamped onto it
export function ownershipRuleFor(kind, collection) {
  if (collection === 'notifications') return 'insert';
  if (collection === 'quotes') return 'customer';
  if (collection === 'jobs') return kind === 'contractor' ? 'contractor' : 'customer';
  if (collection === 'customers') return kind === 'contractor' ? 'insert' : 'self';
  if (collection === 'contractors') return 'self';
  return null;
}

// Portal writes that must be refused because they would change the access rules
// themselves. A grant holder may change their PIN, but may not clear it: an empty
// passcode would re-open the first-visitor-wins setup path to whoever holds the
// link next, which is a downgrade dressed up as an update.
export function isForbiddenMutation(kind, collection, payload) {
  if (collection !== recordTableFor(kind)) return false;
  const next = (payload || {}).portal_passcode;
  if (next === undefined) return false;
  // `null` has to be caught before String(), which would turn it into the very
  // non-empty string 'null' and let the clear through.
  if (next === null) return true;
  return String(next).trim() === '';
}

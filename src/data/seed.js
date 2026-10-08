// ============================================
// RELAY — DEMO DATA LOADER
// ============================================
//
// Loads the Harbourline Electrical & Air demo business (see demoDataset.js)
// into the current account: a connected story of enquiries, quotes, jobs,
// crew schedules, timesheets, invoices and payments, dated relative to today.

import { store } from './store.js';
import { buildDemoDataset } from './demoDataset.js';
import { setCachedGeo } from '../utils/geocode.js';

// Reference data first, then the documents that point at it.
const LOAD_ORDER = [
  'costCenters', 'storageLocations', 'locationTypes', 'kitTypes', 'suppliers', 'stock', 'kits', 'taskTemplates',
  'technicians', 'contractors', 'customers', 'assets', 'leads', 'quotes', 'projects', 'jobs', 'maintenancePlans',
  'jobMaterials', 'purchaseOrders', 'schedule', 'timesheets', 'invoices', 'formInstances', 'notifications',
];

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}') || {};
  } catch {
    return {};
  }
}

export async function seedData(force = false) {
  if (!force && store.isSeeded()) return;

  const isCloud = !!(store.companyId && !store.companyId.startsWith('acct_'));
  const currentUser = readCurrentUser();
  const keptSettings = isCloud ? { ...(store.companySettings || {}) } : {};

  await store.clearAll();
  if (!isCloud) {
    // clearAll() deleted this profile's database; reopen it before writing.
    await store.initializeLocalStore();
  }
  await store.seedFormTemplates();

  const { settings, collections, geo, crew } = buildDemoDataset({
    now: new Date(),
    scope: store.companyId ? `${store.companyId}_` : '',
    owner: { id: currentUser.id, name: currentUser.name, email: currentUser.email, userTypeId: currentUser.userTypeId },
  });

  // Cloud companies keep their own mailer/AI/billing config underneath the demo profile.
  await store.saveSettings({ ...keptSettings, ...settings, documentTheme: { ...(keptSettings.documentTheme || {}), ...settings.documentTheme } });

  // Pre-warm the geocode cache: the demo addresses are fictional, so the map
  // and route planner use these suburb-accurate pins instead of a lookup.
  Object.entries(geo).forEach(([address, record]) => setCachedGeo(address, record));

  for (const collection of LOAD_ORDER) {
    // Cloud staff are real sign-ins (profiles), which a client can't create.
    if (isCloud && collection === 'technicians') continue;
    await store.save(collection, collections[collection] || []);
  }

  // The schedule opens on the signed-in user's lane only; start the demo with
  // the whole field crew visible so the week reads as a team at work.
  if (!isCloud && currentUser.id) {
    const lanes = ['owner', 'dale', 'priya', 'sam', 'tom'].map((k) => crew[k].id);
    try { localStorage.setItem(`relay_schedule_visible_techs_${currentUser.id}`, JSON.stringify(lanes)); } catch { /* preference only */ }
  }

  store.markSeeded();
}

export async function seedMinimalData() {
  await seedData(true);
}

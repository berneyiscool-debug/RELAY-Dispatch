// ============================================
// RELAY — Deputy AI tier model
// ============================================
// Three tiers govern what Deputy can do:
//   local     - offline/local account (own API key), base behaviour only
//   cloud     - paid Cloud seat (base Deputy, single chat)
//   cloudPlus - paid Cloud+ seat (Deputy Max: maximize workspace, multichat,
//               vision, emergency scan, human-in-loop, 2-stage triage)
//
// The authoritative tier for cloud users is stored in settings.ai.tier and
// synced through the companies.settings JSONB column (see store.saveSettings).
// When Stripe plans land, the webhook writes this field server-side.

import { store } from '../data/store.js';

export const AI_TIERS = {
  LOCAL: 'local',
  CLOUD: 'cloud',
  CLOUD_PLUS: 'cloudPlus',
};

export function isCloudUser() {
  return !!(store.companyId && !store.companyId.startsWith('acct_'));
}

export function getAITier() {
  if (!isCloudUser()) return AI_TIERS.LOCAL;
  const s = store.getSettings();
  const tier = s?.ai?.tier;
  if (tier === AI_TIERS.CLOUD_PLUS) return AI_TIERS.CLOUD_PLUS;
  return AI_TIERS.CLOUD;
}

export function hasDeputyMax() {
  return getAITier() === AI_TIERS.CLOUD_PLUS;
}

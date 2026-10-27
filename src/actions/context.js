/**
 * Who is acting, whether they may, and how the change is recorded.
 *
 * Permissions live in the UI layer (`src/utils/permissions.js`) and the store
 * does not enforce them, so the action layer has to guard itself. brny and the
 * UI therefore hit exactly the same wall, which is what rule 5 of the roadmap
 * requires.
 */

import { store } from '../data/store.js';
import { hasPermission } from '../utils/permissions.js';
import { permissionDenied, unsupported } from './errors.js';
import { LEGACY_ENTITY_KEYS } from '../data/activityRecord.js';
import { getSessionUser } from '../pages/auth/session.js';

/** The signed-in user, from the same storage the rest of the app reads. */
export function currentActor() {
  try {
    const user = getSessionUser();
    if (!user) return { id: 'system', name: 'System' };
    return {
      id: user.id || 'system',
      name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'System',
      email: user.email || null,
      role: user.role || null,
      userTypeId: user.userTypeId || null,
      companyId: user.companyId || null,
    };
  } catch {
    return { id: 'system', name: 'System' };
  }
}

/**
 * Assert the actor may perform `permission`.
 * Accepts a single `{ module, key }` or an array of them (all must pass), and is
 * a no-op when the action declares no permission requirement.
 */
export function assertPermission(permission, ctx = {}) {
  if (!permission) return;
  if (ctx.actor && ctx.actor.role === 'admin') return;
  const required = Array.isArray(permission) ? permission : [permission];
  for (const { module, key } of required) {
    if (!hasPermission(module, key)) throw permissionDenied(module, key);
  }
}

/** Actions that only make sense in one runtime mode say so explicitly. */
export function assertCloudOnly(feature) {
  if (store.demoMode) throw unsupported(`${feature} is not available in the demo workspace.`);
}

/**
 * Append an entry to the free-text activity log.
 *
 * One store.create() per entry: in Cloud that is a single `activity_log` insert
 * rather than an upsert of the whole log, and a local profile writes just the
 * one record to IndexedDB. Pages that record activity go through here too.
 */
export function logActivity({ id, type, text, recordType, recordId, status, user, timestamp }) {
  try {
    const entityKey = LEGACY_ENTITY_KEYS[recordType];
    return store.create('activity', {
      id: id || `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      text,
      status: status || null,
      recordType: recordType || null,
      recordId: recordId || null,
      // Existing pages filter the shared log on these flat keys, so keep
      // writing them alongside the generic pair.
      entityId: recordId || null,
      ...(entityKey && recordId ? { [entityKey]: recordId } : {}),
      user: user || currentActor().name,
      timestamp: timestamp || new Date().toISOString(),
    });
  } catch {
    // An activity trail is useful but never worth failing a real write for.
    return null;
  }
}

/** Fields every write stamps so record provenance is consistent across sources. */
export function actorStamp(ctx = {}) {
  const actor = ctx.actor || currentActor();
  // No collection whitelists a separate actor id column, so only the field that
  // survives denormalisation is stamped.
  return { createdBy: actor.name || actor.id };
}

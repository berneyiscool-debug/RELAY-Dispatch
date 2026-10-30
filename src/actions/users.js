/**
 * User types, their permissions, and the signed-in user's own profile.
 *
 * The permission matrix is the same `MODULE_PERMS` the Settings → Users screen
 * renders, so a type built here grants exactly what the same ticks would. Profile
 * actions only ever touch the person asking; they never take someone else's id.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, list } from './schema.js';
import { invalidInput, notFound, permissionDenied } from './errors.js';
import { logActivity } from './context.js';
import { MODULE_PERMS } from '../utils/permissions.js';
import { defaultWorkRules, withWorkRules } from '../utils/workRules.js';
import { getSessionUser, setSessionUser } from '../pages/auth/session.js';
import { getBrnyPersonality } from '../utils/brnyPersonalities.js';
import { getUserBrnyPersonality, setUserBrnyPersonality } from '../utils/brnyPersonalityPref.js';

const MANAGERS = { module: 'Settings', key: 'manage_users' };
const TEMPLATES = ['Admin', 'Manager', 'Technician', 'Office Staff', 'Custom'];

function requireAdmin(ctx) {
  if (!ctx.actor || ctx.actor.role !== 'admin') throw permissionDenied('Settings', 'manage_users');
}

/** Every module and key, ticked where `valueFn` says so. */
function buildPermissions(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, defs]) => {
    const row = { module };
    defs.forEach(({ key }) => { row[key] = !!valueFn(module, key); });
    return row;
  });
}

function templatePermissions(template) {
  if (template === 'Admin') return buildPermissions(() => true);
  if (template === 'Manager') {
    return buildPermissions((module, key) => (module === 'Settings' ? ['view', 'edit_company', 'manage_tax'].includes(key) : true));
  }
  if (template === 'Technician') {
    return buildPermissions((module, key) => {
      if (module === 'Dashboard') return key === 'view';
      if (module === 'Jobs') return ['view', 'manage_tasks', 'book_time'].includes(key);
      if (module === 'Timesheets') return ['view_own', 'create'].includes(key);
      if (module === 'Schedule') return ['view_own'].includes(key);
      return false;
    });
  }
  if (template === 'Office Staff') {
    return buildPermissions((module, key) => {
      if (module === 'Settings') return false;
      if (module === 'Reports') return key === 'view';
      if (['Invoices', 'Purchase Orders', 'Suppliers'].includes(module) && key === 'delete') return false;
      return true;
    });
  }
  return buildPermissions(() => false);
}

function userTypeLabel(type) {
  return type ? type.name || type.id : '';
}

function resolveUserType(query) {
  const text = String(query || '').trim().toLowerCase();
  if (!text) throw invalidInput('Which user type?');
  const matches = (store.getAll('userTypes') || []).filter((type) => String(type.name || '').toLowerCase() === text);
  if (matches.length === 1) return matches[0];
  const partial = (store.getAll('userTypes') || []).filter((type) => String(type.name || '').toLowerCase().includes(text));
  if (partial.length === 1) return partial[0];
  if (!partial.length) throw notFound('user type', query);
  throw invalidInput(`"${query}" matches more than one user type: ${partial.map(userTypeLabel).join(', ')}.`);
}

const view = (type) => ({
  id: type.id,
  name: type.name,
  description: type.description || '',
  permissions: type.permissions || [],
  staff: (store.getAll('technicians') || []).filter((person) => person.userTypeId === type.id).length,
});

defineAction({
  name: 'list_user_types',
  title: 'List user types',
  description: 'List the roles that can sign in, what each is allowed to do, and how many people have it.',
  permission: MANAGERS,
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.userTypes.length} user type(s).`,
  run: async () => ({ userTypes: (store.getAll('userTypes') || []).map(view) }),
});

defineAction({
  name: 'create_user_type',
  title: 'Create a user type',
  description:
    'Create a role from a template — Admin, Manager, Technician or Office Staff — or start Custom with nothing ticked. Change individual permissions afterwards with set_user_type_permissions.',
  permission: MANAGERS,
  inputSchema: objectSchema(
    {
      name: str('Role name, e.g. "Service Coordinator".'),
      description: str('What this role is for.'),
      template: str(`Start from this template: ${TEMPLATES.join(', ')}. Defaults to Custom.`),
    },
    ['name']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ name, description, template }, ctx) => {
    requireAdmin(ctx);
    const clean = String(name || '').trim();
    if (!clean) throw invalidInput('A role name is required.');
    const clash = (store.getAll('userTypes') || []).find((type) => String(type.name || '').toLowerCase() === clean.toLowerCase());
    if (clash) throw invalidInput(`A user type called "${clash.name}" already exists.`);
    const chosen = TEMPLATES.includes(template) ? template : 'Custom';
    const permissions = withWorkRules(templatePermissions(chosen), defaultWorkRules(chosen));
    const created = store.create('userTypes', { name: clean, description: description || '', permissions });
    logActivity({ type: 'user_type_created', text: `User type ${created.name} created from the ${chosen} template.` });
    return { summary: `Created user type ${created.name} (${chosen} template).`, userType: view(created) };
  },
});

defineAction({
  name: 'update_user_type',
  title: 'Update a user type',
  description: 'Rename a role or change its description. Permissions are unchanged — use set_user_type_permissions for those.',
  permission: MANAGERS,
  inputSchema: objectSchema(
    {
      userType: str('Role name or id.'),
      name: str('New name.'),
      description: str('New description.'),
    },
    ['userType']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ userType: reference, name, description }, ctx) => {
    requireAdmin(ctx);
    const type = resolveUserType(reference);
    if (String(type.name || '').toLowerCase().includes('admin') && name != null && !String(name).toLowerCase().includes('admin')) {
      throw invalidInput('The Admin user type has to keep "Admin" in its name.');
    }
    const patch = {};
    if (name != null) patch.name = String(name).trim();
    if (description != null) patch.description = description;
    if (!Object.keys(patch).length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (patch.name) {
      const clash = (store.getAll('userTypes') || []).find((other) => other.id !== type.id && String(other.name || '').toLowerCase() === patch.name.toLowerCase());
      if (clash) throw invalidInput(`A user type called "${clash.name}" already exists.`);
    }
    await store.update('userTypes', type.id, patch);
    logActivity({ type: 'user_type_updated', text: `User type ${patch.name || type.name} updated.` });
    return { summary: `Updated user type ${store.getById('userTypes', type.id).name}.`, userType: view(store.getById('userTypes', type.id)) };
  },
});

defineAction({
  name: 'set_user_type_permissions',
  title: 'Set user type permissions',
  description:
    'Replace what a role may do. Pass a map of module name to the list of allowed keys, e.g. {"Jobs":["view","create"],"Invoices":["view"]}. Modules left out keep their current permissions. The keys are the tick boxes on Settings → Users → Permissions.',
  permission: MANAGERS,
  risky: true,
  inputSchema: objectSchema(
    {
      userType: str('Role name or id.'),
      permissions: {
        type: 'object',
        additionalProperties: { type: 'array', items: { type: 'string' } },
        description: 'Module name to allowed permission keys.',
      },
    },
    ['userType', 'permissions']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ userType: reference, permissions }, ctx) => {
    requireAdmin(ctx);
    const type = resolveUserType(reference);
    const unknown = Object.keys(permissions || {}).filter((module) => !MODULE_PERMS[module]);
    if (unknown.length) throw invalidInput(`Unknown module(s): ${unknown.join(', ')}. Valid modules: ${Object.keys(MODULE_PERMS).join(', ')}.`);

    const existing = (type.permissions || []).map((row) => ({ ...row }));
    Object.entries(permissions).forEach(([module, keys]) => {
      const allowed = new Set((keys || []).map(String));
      const row = existing.find((entry) => entry.module === module) || { module };
      MODULE_PERMS[module].forEach(({ key }) => { row[key] = allowed.has(key); });
      if (!existing.includes(row)) existing.push(row);
    });

    await store.update('userTypes', type.id, { permissions: existing });
    logActivity({
      type: 'user_type_permissions',
      text: `Permissions changed for user type ${type.name} (${Object.keys(permissions).join(', ')}).`,
    });
    return {
      summary: `Updated permissions for ${type.name} (${Object.keys(permissions).join(', ')}); ${view(store.getById('userTypes', type.id)).staff} staff affected.`,
      userType: view(store.getById('userTypes', type.id)),
      modules: Object.keys(permissions),
    };
  },
});

defineAction({
  name: 'delete_user_type',
  title: 'Delete a user type',
  description: 'Permanently delete a role. Anyone with it becomes unassigned and loses its permissions. The Admin role cannot be deleted.',
  permission: MANAGERS,
  risky: true,
  inputSchema: objectSchema(
    {
      userType: str('Role name or id.'),
      reason: str('Why the role is being deleted.'),
    },
    ['userType']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ userType: reference, reason }, ctx) => {
    requireAdmin(ctx);
    const type = resolveUserType(reference);
    if (String(type.name || '').toLowerCase().includes('admin')) throw invalidInput('The Admin user type cannot be deleted — at least one Admin must always exist.');
    const affected = (store.getAll('technicians') || []).filter((person) => person.userTypeId === type.id).length;
    await store.delete('userTypes', type.id);
    logActivity({ type: 'user_type_deleted', text: `User type ${type.name} deleted${reason ? ` — ${reason}` : ''}${affected ? `; ${affected} staff unassigned` : ''}.` });
    return {
      summary: `Deleted user type ${type.name}${affected ? `; ${affected} staff member${affected === 1 ? '' : 's'} are now unassigned` : ''}.`,
      userType: { id: type.id, name: type.name },
      unassignedStaff: affected,
      reason: reason || null,
    };
  },
});

defineAction({
  name: 'get_my_profile',
  title: 'Read my profile',
  description: 'Read the signed-in user\'s name, role, start location and brny personality.',
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => result.summary,
  run: async () => {
    const user = getSessionUser();
    if (!user) throw invalidInput('Nobody is signed in.');
    const record = store.getById('technicians', user.id);
    return {
      summary: `${user.name || user.email || 'Signed-in user'} — ${record?.role || user.role || 'no role'}.`,
      profile: {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: record?.role || user.role || '',
        userType: record?.userTypeId ? store.getById('userTypes', record.userTypeId)?.name || '' : '',
        startLocation: record?.startLocation?.address || '',
        personality: getUserBrnyPersonality(user.id),
      },
    };
  },
});

defineAction({
  name: 'update_my_profile',
  title: 'Update my profile',
  description: 'Change the signed-in user\'s display name. Passwords and avatars stay on the My Profile page.',
  inputSchema: objectSchema({ name: str('New display name.') }, ['name']),
  summarize: (input, result) => result.summary,
  run: async ({ name }) => {
    const user = getSessionUser();
    if (!user) throw invalidInput('Nobody is signed in.');
    const clean = String(name || '').trim();
    if (!clean) throw invalidInput('A name is required.');
    if (/[<>"]/.test(clean)) throw invalidInput('A name cannot contain <, > or ".');
    if (store.getById('technicians', user.id)) await store.update('technicians', user.id, { name: clean });
    setSessionUser({ ...user, name: clean });
    logActivity({ type: 'profile_updated', text: `Profile name changed to ${clean}.` });
    return { summary: `Your display name is now ${clean}.`, profile: { id: user.id, name: clean } };
  },
});

defineAction({
  name: 'set_my_start_location',
  title: 'Set my start location',
  description: 'Set where routes start from for the signed-in user, or clear it to use the company address.',
  inputSchema: objectSchema({ address: str('Address to start routes from. Leave out to clear it.') }),
  summarize: (input, result) => result.summary,
  run: async ({ address }) => {
    const user = getSessionUser();
    if (!user) throw invalidInput('Nobody is signed in.');
    const text = String(address || '').trim();
    await store.setStartLocation(text ? { address: text } : null);
    return { summary: text ? `Routes now start from ${text}.` : 'Cleared your start location — routes use the company address.', startLocation: text };
  },
});

defineAction({
  name: 'set_brny_personality',
  title: 'Change brny\'s personality',
  description: 'Change the voice brny uses for this user — Straight, Friendly, Brief, Trainer or Formal.',
  inputSchema: objectSchema({ personality: str('Personality name or id, e.g. "Friendly".') }, ['personality']),
  summarize: (input, result) => result.summary,
  run: async ({ personality }) => {
    const user = getSessionUser();
    if (!user) throw invalidInput('Nobody is signed in.');
    const chosen = getBrnyPersonality(personality);
    setUserBrnyPersonality(user.id, chosen.id);
    return { summary: `brny will talk in the ${chosen.name} style from now on.`, personality: chosen.id };
  },
});

/**
 * Staff — adding, changing and deactivating the people who sign in.
 *
 * Written the way the Users tab in `Settings.js` writes them, through the same
 * `store.create('technicians')` path, which in Cloud calls `invite-user` and
 * reconciles the billable seat count. Like that tab, every action here is for an
 * admin only.
 *
 * brny never chooses or sees a password a person will use. A new user gets a
 * random one nobody knows: they confirm their backup email, then set their own
 * with "Forgot password" on the sign-in screen.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, bool } from './schema.js';
import { conflict, invalidInput, permissionDenied } from './errors.js';
import { logActivity } from './context.js';
import { isCloudCompany } from '../utils/subscription.js';
import { normalizeBackupEmail } from '../../supabase/functions/invite-user/provision.js';

const SEAT_COOLDOWN_DAYS = 30;

// No user type grants this, so only admins are offered these tools at all.
const USERS_PERMISSION = { module: 'Users', key: 'manage' };

const staffSearch = {
  label: (person) => person.name || person.username || person.id,
  searchFields: ['name', 'username', 'role', 'email'],
  what: 'staff member',
};

const isAdminType = (id) => id === 'ut_admin' || String(id || '').endsWith('_ut_admin');

function requireAdmin(ctx) {
  if (!ctx.actor || ctx.actor.role !== 'admin') throw permissionDenied('Users', 'manage');
}

function resolveStaff(query) {
  return resolveOne('technicians', query, staffSearch).record;
}

function resolveUserType(query) {
  return resolveOne('userTypes', query, { searchFields: ['name'], what: 'user type' }).record;
}

/** A password nobody is told, so the only way in is the person's own reset. */
function unknowablePassword() {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
}

function cleanName(name) {
  const value = String(name || '').trim();
  // profiles.name is rendered across the tenant, so the database rejects these.
  if (/[<>"]/.test(value)) throw invalidInput('A name cannot contain <, > or ".');
  return value;
}

const view = (person) => {
  const type = person.userTypeId ? store.getById('userTypes', person.userTypeId) : null;
  return {
    id: person.id,
    name: person.name,
    username: person.username,
    role: person.role || '',
    userType: type?.name || null,
    payRate: person.payRate ?? null,
    deactivated: !!person.deactivated,
    deactivatedAt: person.deactivatedAt || null,
  };
};

defineAction({
  name: 'list_staff',
  title: 'List staff',
  permission: USERS_PERMISSION,
  description: 'Everyone who can sign in, with their role, user type (which sets their permissions), pay rate and whether they are deactivated, plus the user types to choose from.',
  readOnly: true,
  inputSchema: objectSchema({ includeDeactivated: bool('Include deactivated people. Defaults to false.') }),
  summarize: (input, result) => `${result.staff.length} staff member(s).`,
  run: async (input, ctx) => {
    requireAdmin(ctx);
    const staff = (store.getAll('technicians') || [])
      .filter((person) => input.includeDeactivated || !person.deactivated)
      .map(view);
    const userTypes = (store.getAll('userTypes') || []).map((type) => type.name).filter(Boolean);
    return { staff, userTypes };
  },
});

defineAction({
  name: 'add_staff_member',
  title: 'Add staff member',
  permission: USERS_PERMISSION,
  description:
    'Give a new person a sign-in. This adds a paid seat to the subscription. They are emailed at their backup email to confirm it; then they set their own password with "Forgot password" on the sign-in screen — you never choose or see one. Their user type decides what they can do; check the choices with list_staff.',
  risky: true,
  inputSchema: objectSchema(
    {
      name: str('Full name.'),
      username: str('What they sign in with. No @. Defaults to their first name.'),
      backupEmail: str('Their own email address — where the confirmation and password reset go.'),
      role: str('Job title, e.g. "Electrician", "Apprentice", "Office".'),
      userType: str('User type that sets their permissions, e.g. "Technician".'),
      payRate: num('Hourly pay rate.'),
    },
    ['name', 'backupEmail', 'userType']
  ),
  summarize: (input, result) => `Added ${result.staff.name} (${result.staff.username}) — they must confirm ${result.backupEmail} and then use "Forgot password" to set a password.`,
  run: async (input, ctx) => {
    requireAdmin(ctx);
    const name = cleanName(input.name);
    if (!name) throw invalidInput('What is their name?');
    const backupEmail = normalizeBackupEmail(input.backupEmail || '');
    if (!backupEmail) throw invalidInput('Give a valid backup email address for them.');
    const username = String(input.username || name.split(/\s+/)[0]).trim().toLowerCase();
    if (!username || username.includes('@')) throw invalidInput('A username cannot be empty or contain @.');
    const clash = (store.getAll('technicians') || []).find((person) => String(person.username || '').toLowerCase() === username);
    if (clash) throw conflict(`The username "${username}" is taken by ${clash.name}. Pass a different username.`);

    const userType = resolveUserType(input.userType);
    if (isAdminType(userType.id)) throw invalidInput('brny does not create admins. An admin can do that in Settings → Users.');

    const raw = unknowablePassword();
    let password = raw;
    if (!isCloudCompany()) {
      // Local and demo accounts store the hash themselves, as Settings does.
      const { hashPassword } = await import('../pages/auth/password.js');
      password = await hashPassword(raw);
    }

    const created = await store.create('technicians', {
      name,
      username,
      role: input.role || '',
      userTypeId: userType.id,
      color: '#4f46e5',
      payRate: input.payRate ?? null,
      backupEmail,
      password,
    });
    logActivity({ type: 'staff_added', text: `${name} added as ${userType.name}.` });
    return {
      staff: view(created),
      backupEmail,
      confirmationError: created?.confirmationError || null,
    };
  },
});

defineAction({
  name: 'update_staff_member',
  title: 'Update staff member',
  permission: USERS_PERMISSION,
  description: 'Change someone\'s name, job title, user type (their permissions) or pay rate. Admins\' user type cannot be changed here.',
  risky: true,
  inputSchema: objectSchema(
    {
      person: str('Their name or username.'),
      name: str('New name.'),
      role: str('New job title.'),
      userType: str('New user type.'),
      payRate: num('New hourly pay rate.'),
    },
    ['person']
  ),
  summarize: (input, result) => `Updated ${result.staff.name} (${result.fields.join(', ')}).`,
  run: async (input, ctx) => {
    requireAdmin(ctx);
    const person = resolveStaff(input.person);
    const patch = {};
    if (input.name != null) patch.name = cleanName(input.name);
    if (input.role != null) patch.role = input.role.trim();
    if (input.payRate != null) patch.payRate = input.payRate;
    if (input.userType != null) {
      if (isAdminType(person.userTypeId)) throw invalidInput(`${person.name} is an admin; their user type is changed in Settings → Users.`);
      const type = resolveUserType(input.userType);
      if (isAdminType(type.id)) throw invalidInput('brny does not make anyone an admin. An admin can do that in Settings → Users.');
      patch.userTypeId = type.id;
    }
    const fields = Object.keys(patch);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('technicians', person.id, patch);
    logActivity({ type: 'staff_updated', text: `${person.name} updated (${fields.join(', ')}).` });
    return { staff: view(store.getById('technicians', person.id)), fields };
  },
});

defineAction({
  name: 'deactivate_staff_member',
  title: 'Deactivate staff member',
  permission: USERS_PERMISSION,
  description:
    'Stop someone signing in (they have left, or are on long leave), freeing their seat — or pass `reactivate` to let them back in. A seat can only be reactivated 30 days after it was deactivated.',
  risky: true,
  inputSchema: objectSchema(
    {
      person: str('Their name or username.'),
      reactivate: bool('Let a deactivated person back in instead.'),
    },
    ['person']
  ),
  summarize: (input, result) => `${result.staff.name} ${result.staff.deactivated ? 'deactivated' : 'reactivated'}.`,
  run: async (input, ctx) => {
    requireAdmin(ctx);
    const person = resolveStaff(input.person);
    if (input.reactivate) {
      if (!person.deactivated) return { staff: view(person), changed: false };
      const days = Math.ceil((Date.now() - new Date(person.deactivatedAt).getTime()) / 86400000);
      if (days < SEAT_COOLDOWN_DAYS) throw invalidInput(`Seat cooldown: ${person.name} can be reactivated in ${SEAT_COOLDOWN_DAYS - days} day(s).`);
      await store.update('technicians', person.id, { deactivated: false, deactivatedAt: null });
    } else {
      if (person.deactivated) return { staff: view(person), changed: false };
      if (ctx.actor && String(ctx.actor.id) === String(person.id)) throw invalidInput('You cannot deactivate yourself.');
      if (isAdminType(person.userTypeId)) throw invalidInput(`${person.name} is an admin; deactivate them in Settings → Users.`);
      await store.update('technicians', person.id, { deactivated: true, deactivatedAt: new Date().toISOString() });
    }
    logActivity({ type: 'staff_updated', text: `${person.name} ${input.reactivate ? 'reactivated' : 'deactivated'}.` });
    return { staff: view(store.getById('technicians', person.id)), changed: true };
  },
});

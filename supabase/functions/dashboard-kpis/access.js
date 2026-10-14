// ============================================
// RELAY — DASHBOARD KPIs: WHO MAY SEE WHICH CARD
// ============================================
// The server's copy of the app's permission check (src/utils/permissions.js
// hasPermission), for the cases a signed-in cloud user can be in. The browser
// hides cards a user can't see; this stops a request for them being answered.

import { KPIS, kpiPermission } from './kpis.js';

// Built-in technician rights when no user type is assigned (matches the app).
const TECH_DEFAULTS = {
  Dashboard: ['view'],
  Schedule: ['view', 'view_own', 'edit'],
  Quotes: ['view', 'create', 'edit', 'delete', 'approve', 'convert', 'generate_pdf'],
  Jobs: ['view', 'create', 'edit', 'delete', 'book_time', 'view_invoices_tab', 'create_invoice', 'manage_tasks', 'view_timesheets_tab', 'manage_materials'],
  Invoices: ['view', 'create', 'send', 'void'],
  Customers: ['view', 'create', 'edit', 'delete', 'manage_contacts'],
  Assets: ['view', 'create', 'edit', 'delete'],
  Stock: ['view', 'create', 'edit', 'delete'],
  'Purchase Orders': ['view', 'create', 'approve'],
  Timesheets: ['view_own', 'create', 'edit_all'], // own time only, as in the app
  Settings: ['view', 'edit_company'],
  Documents: ['view', 'upload'],
  Projects: ['view', 'create', 'edit'],
};

/**
 * profile:  { role }            — the caller's profiles row
 * userType: { permissions } | null — their user_types row, if any
 * perm:     [module, action] | null
 */
export function canSee(profile, userType, perm) {
  if (!perm) return true;
  const [module, action] = perm;
  const role = profile && profile.role;
  if (role === 'admin') return true;
  if (!role || role === 'customer') return false;
  if (userType && Array.isArray(userType.permissions)) {
    const p = userType.permissions.find(x => x.module === module);
    return p ? !!p[action] : false;
  }
  if (role === 'technician') return (TECH_DEFAULTS[module] || []).includes(action);
  if (role === 'manager') return module !== 'Settings' || ['view', 'edit_company', 'manage_tax'].includes(action);
  return false;
}

/** The requested card ids this user may be served. env: { staffCount } */
export function allowedKpiIds(ids, profile, userType, env) {
  return [...new Set(ids)].filter(id => KPIS[id]
    && canSee(profile, userType, kpiPermission(id))
    && (!KPIS[id].available || KPIS[id].available(env)));
}

// ============================================
// FIELDFORGE — PERMISSION DEFINITIONS
// ============================================

import { store } from '../data/store.js';

export function hasPermission(module, key) {
  // Recurring templates are stored as recurring Jobs, so gate them off the Jobs
  // module. This lets any role that can view Jobs also see/navigate recurring
  // templates (the nav item + page use access based on this lookup).
  module = ({ 'Recurring Templates': 'Jobs' })[module] || module;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'customer') return false;

  // If a local admin toggles to technician view, we bypass database-defined permissions
  // and give them a standard set of technician permissions to declutter the UI.
  const isLocalAdminTechView = localStorage.getItem('relay_login_mode') === 'local' && localStorage.getItem('uiMode') === 'technician';
  if (isLocalAdminTechView) {
    if (module === 'AI Assistant') return key === 'use';
    if (module === 'Dashboard') return key === 'view';
    if (module === 'Schedule') return ['view', 'view_own', 'edit'].includes(key);
    if (module === 'Quotes') return ['view', 'create', 'edit', 'delete', 'approve', 'convert', 'generate_pdf'].includes(key);
    if (module === 'Jobs') {
      return ['view', 'create', 'edit', 'delete', 'book_time', 'view_invoices_tab', 'create_invoice', 'manage_tasks', 'view_timesheets_tab', 'view_materials_tab', 'manage_materials'].includes(key);
    }
    if (module === 'Invoices') return ['view', 'create', 'send', 'void'].includes(key);
    if (module === 'Customers') return ['view', 'create', 'edit', 'delete', 'manage_contacts'].includes(key);
    if (module === 'Assets') return ['view', 'create', 'edit', 'delete'].includes(key);
    if (module === 'Stock') return ['view', 'create', 'edit', 'delete'].includes(key);
    if (module === 'Purchase Orders') return ['view', 'create', 'approve'].includes(key);
    if (module === 'Timesheets') return ['view_own', 'view', 'create', 'edit_all'].includes(key);
    if (module === 'Settings') return ['view', 'edit_company'].includes(key);
    if (module === 'Documents') return ['view', 'upload'].includes(key);
    if (module === 'Projects') return ['view', 'create', 'edit'].includes(key);
    return false;
  }

  if (currentUser.userTypeId) {
    const ut = store.getById('userTypes', currentUser.userTypeId);
    if (ut && ut.permissions) {
      const p = ut.permissions.find(p => p.module === module);
      if (p) return !!p[key];
      // User types created before 'AI Assistant' became a module have no entry
      // for it. Default staff to enabled rather than silently locking the
      // assistant off; saving permissions in Settings makes it explicit.
      if (module === 'AI Assistant') return key === 'use';
      return false;
    }
  }

  // Fallbacks if no userType is associated or defined:
  if (currentUser.role === 'technician') {
    if (module === 'AI Assistant') return key === 'use';
    if (module === 'Dashboard') return key === 'view';
    if (module === 'Schedule') return ['view', 'view_own', 'edit'].includes(key);
    if (module === 'Quotes') return ['view', 'create', 'edit', 'delete', 'approve', 'convert', 'generate_pdf'].includes(key);
    if (module === 'Jobs') {
      return ['view', 'create', 'edit', 'delete', 'book_time', 'view_invoices_tab', 'create_invoice', 'manage_tasks', 'view_timesheets_tab', 'view_materials_tab', 'manage_materials'].includes(key);
    }
    if (module === 'Invoices') return ['view', 'create', 'send', 'void'].includes(key);
    if (module === 'Customers') return ['view', 'create', 'edit', 'delete', 'manage_contacts'].includes(key);
    if (module === 'Assets') return ['view', 'create', 'edit', 'delete'].includes(key);
    if (module === 'Stock') return ['view', 'create', 'edit', 'delete'].includes(key);
    if (module === 'Purchase Orders') return ['view', 'create', 'approve'].includes(key);
    if (module === 'Timesheets') return ['view_own', 'view', 'create', 'edit_all'].includes(key);
    if (module === 'Settings') return ['view', 'edit_company'].includes(key);
    if (module === 'Documents') return ['view', 'upload'].includes(key);
    if (module === 'Projects') return ['view', 'create', 'edit'].includes(key);
    return false;
  }

  if (currentUser.role === 'manager') {
    if (module === 'Settings') return ['view', 'edit_company', 'manage_tax'].includes(key);
    return true;
  }

  return false;
}

// ============================================
// FIELDFORGE — PERMISSION DEFINITIONS
// ============================================

import { store } from '../data/store.js';

export function hasPermission(module, key) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'customer') return false;

  if (currentUser.userTypeId) {
    const ut = store.getById('userTypes', currentUser.userTypeId);
    if (ut && ut.permissions) {
      const p = ut.permissions.find(p => p.module === module);
      return p ? !!p[key] : false;
    }
  }

  // Fallbacks if no userType is associated or defined:
  if (currentUser.role === 'technician') {
    if (module === 'Dashboard') return key === 'view';
    if (module === 'Jobs') return ['view', 'manage_tasks', 'book_time'].includes(key);
    if (module === 'Timesheets') return ['view_own', 'create'].includes(key);
    if (module === 'Schedule') return ['view_own'].includes(key);
    return false;
  }

  if (currentUser.role === 'manager') {
    if (module === 'Settings') return ['view', 'edit_company', 'manage_tax'].includes(key);
    return true;
  }

  return false;
}

export const MODULE_PERMS = {
  'Dashboard': [
    { key: 'view', label: 'View Dashboard' },
  ],
  'Customers': [
    { key: 'view', label: 'View Customers' },
    { key: 'create', label: 'Create Customers' },
    { key: 'edit', label: 'Edit Customer Details' },
    { key: 'delete', label: 'Delete Customers' },
    { key: 'manage_contacts', label: 'Manage Contacts & Sites' },
  ],
  'Leads': [
    { key: 'view', label: 'View Leads' },
    { key: 'create', label: 'Create Leads' },
    { key: 'edit', label: 'Edit Leads' },
    { key: 'delete', label: 'Delete Leads' },
    { key: 'convert', label: 'Convert Lead to Quote / Job' },
  ],
  'Quotes': [
    { key: 'view', label: 'View Quotes' },
    { key: 'create', label: 'Create Quotes' },
    { key: 'edit', label: 'Edit Quotes' },
    { key: 'delete', label: 'Delete Quotes' },
    { key: 'approve', label: 'Approve / Accept Quotes' },
    { key: 'convert', label: 'Convert to Job' },
    { key: 'generate_pdf', label: 'Generate & Save PDF' },
  ],
  'Jobs': [
    { key: 'view', label: 'View Jobs' },
    { key: 'create', label: 'Create Jobs' },
    { key: 'edit', label: 'Edit Job Details' },
    { key: 'delete', label: 'Delete Jobs' },
    { key: 'manage_tasks', label: 'Manage Tasks & Tasklists' },
    { key: 'book_time', label: 'Book Time to Tasks' },
    { key: 'view_costs', label: 'View Costs & Financials' },
    { key: 'manage_materials', label: 'Manage Materials & Stock' },
    { key: 'create_invoice', label: 'Create Invoices from Job' },
  ],
  'Timesheets': [
    { key: 'view_own', label: 'View Own Timesheets' },
    { key: 'view', label: 'View All Timesheets' },
    { key: 'create', label: 'Create / Submit Timesheets' },
    { key: 'approve', label: 'Approve Timesheets' },
    { key: 'edit_all', label: 'Edit Any Timesheet' },
  ],
  'Assets': [
    { key: 'view', label: 'View Assets' },
    { key: 'create', label: 'Create Assets' },
    { key: 'edit', label: 'Edit Assets' },
    { key: 'delete', label: 'Delete Assets' },
  ],
  'Schedule': [
    { key: 'view_own', label: 'View Own Schedule' },
    { key: 'view', label: 'View Full Schedule' },
    { key: 'edit', label: 'Manage Schedule (Drag/Drop)' },
  ],
  'Contractors': [
    { key: 'view', label: 'View Contractors' },
    { key: 'create', label: 'Create Contractors' },
    { key: 'edit', label: 'Edit Contractors' },
  ],
  'Stock': [
    { key: 'view', label: 'View Inventory' },
    { key: 'create', label: 'Create Stock Items' },
    { key: 'edit', label: 'Manage Stock Levels' },
    { key: 'delete', label: 'Delete Stock' },
  ],
  'Purchase Orders': [
    { key: 'view', label: 'View POs' },
    { key: 'create', label: 'Create POs' },
    { key: 'approve', label: 'Approve POs' },
  ],
  'Invoices': [
    { key: 'view', label: 'View Invoices' },
    { key: 'create', label: 'Create Invoices' },
    { key: 'send', label: 'Send Invoices' },
    { key: 'void', label: 'Void Invoices' },
  ],
  'Reports': [
    { key: 'view', label: 'Access Reports' },
    { key: 'export', label: 'Export Data' },
  ],
  'Documents': [
    { key: 'view', label: 'View Documents' },
    { key: 'upload', label: 'Upload Files' },
  ],
  'Settings': [
    { key: 'view', label: 'View Settings' },
    { key: 'edit_company', label: 'Edit Company Profile' },
    { key: 'manage_users', label: 'Manage Users & Permissions' },
    { key: 'manage_tax', label: 'Manage Tax & Finance' },
  ]
};

// ============================================
// FIELDFORGE — PERMISSION DEFINITIONS (single source of truth)
// ============================================
// Hosts the canonical MODULE_PERMS list and the builder that expands it into a
// flat per-module permission object. Every module + key the app can gate lives
// here so permissions.js, the store's default user types, seed data and the
// Settings UI all stay aligned. Keep this list coordinated with the sidebar nav,
// route map and any new page you add.

// The full set of modules the app exposes to permissions. 'Notifications' and
// 'Recurring Templates' are intentionally absent: Notifications is globally
// accessible, and Recurring Templates is gated off the Jobs module (see
// permissions.js hasPermission).
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
    { key: 'view_costs', label: 'View Costs Tab' },
    { key: 'view_quotes_tab', label: 'View Quotes Tab' },
    { key: 'view_pos_tab', label: 'View POs Tab' },
    { key: 'view_timesheets_tab', label: 'View Timesheets Tab' },
    { key: 'view_materials_tab', label: 'View Materials Tab' },
    { key: 'view_invoices_tab', label: 'View Invoices Tab' },
    { key: 'manage_materials', label: 'Manage Materials & Stock' },
    { key: 'create_invoice', label: 'Create Invoices from Job' },
  ],
  'Timesheets': [
    { key: 'view_own', label: 'View Own Timesheets' },
    { key: 'view', label: 'View All Timesheets' },
    { key: 'create', label: 'Create / Submit Timesheets' },
    { key: 'approve', label: 'Approve Timesheets' },
    { key: 'edit_all', label: 'Edit Any Timesheet' },
    { key: 'export', label: 'Export Timesheets' },
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
  'Suppliers': [
    { key: 'view', label: 'View Suppliers' },
    { key: 'create', label: 'Create Suppliers' },
    { key: 'edit', label: 'Edit Suppliers' },
    { key: 'delete', label: 'Delete Suppliers' },
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
  ],
  'Projects': [
    { key: 'view', label: 'View Projects' },
    { key: 'create', label: 'Create Projects' },
    { key: 'edit', label: 'Edit Projects' },
    { key: 'delete', label: 'Delete Projects' },
  ],
  // The Relay AI Assistant is a staff co-pilot: it respects the user's granular
  // per-module permissions for any action it takes, but opening it is gated off
  // this single 'use' key (granted to staff by default, admin-controllable).
  'AI Assistant': [
    { key: 'use', label: 'Use AI Assistant' },
  ]
};

// Build a permissions array with all granular keys, applying valueFn(mod, key).
export function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

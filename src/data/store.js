// ============================================
// FIELDFORGE — CLOUD DATA STORE (Supabase Sync)
// ============================================
import { supabase } from '../utils/supabase.js';
import { prebuiltForms } from './prebuiltForms.js';

const defaultLogoLarge = new URL('../assets/RELAY_Dispatch_Logo.png', import.meta.url).href;
const defaultLogoSmall = new URL('../assets/logo-small.png', import.meta.url).href;


// Table name mappings to match local collection keys with PostgreSQL tables
const TABLE_MAP = {
  companies: 'companies',
  technicians: 'profiles',
  userTypes: 'user_types',
  passwordResetRequests: 'password_reset_requests',
  customers: 'customers',
  assets: 'assets',
  maintenancePlans: 'maintenance_plans',
  taskTemplates: 'task_templates',
  quotes: 'quotes',
  jobs: 'jobs',
  invoices: 'invoices',
  stock: 'stock',
  timesheets: 'timesheets',
  contractors: 'contractors',
  suppliers: 'suppliers',
  purchaseOrders: 'purchase_orders',
  notifications: 'notifications',
  formTemplates: 'form_templates',
  formInstances: 'form_instances',
  kits: 'kits',
  documents: 'documents',
  leads: 'leads',
  schedule: 'schedule',
  projects: 'projects',
  costCenters: 'cost_centers'
};

const TABLE_COLUMNS = {
  companies: [
    "id",
    "name",
    "abn",
    "phone",
    "domain",
    "email",
    "address",
    "settings",
    "created_at",
    "updated_at"
  ],
  profiles: [
    "id",
    "company_id",
    "name",
    "email",
    "username",
    "phone",
    "role",
    "user_type_id",
    "color",
    "pay_rate",
    "force_password_change",
    "created_at",
    "updated_at"
  ],
  user_types: [
    "id",
    "company_id",
    "name",
    "description",
    "permissions",
    "created_at",
    "updated_at"
  ],
  customers: [
    "id",
    "company_id",
    "company",
    "first_name",
    "last_name",
    "email",
    "phone",
    "address",
    "status",
    "type",
    "portal_token",
    "created_at",
    "updated_at"
  ],
  assets: [
    "id",
    "company_id",
    "name",
    "type",
    "serial",
    "owner_type",
    "customer_id",
    "customer_name",
    "current_meter",
    "recovery_rate",
    "status",
    "logs",
    "created_at",
    "updated_at"
  ],
  maintenance_plans: [
    "id",
    "company_id",
    "name",
    "asset_id",
    "trigger_type",
    "meter_interval",
    "last_triggered_meter",
    "next_service_date",
    "status",
    "priority",
    "frequency",
    "collision_merging",
    "created_at",
    "updated_at"
  ],
  task_templates: [
    "id",
    "company_id",
    "name",
    "description",
    "tags",
    "tasks",
    "created_at",
    "updated_at"
  ],
  quotes: [
    "id",
    "company_id",
    "number",
    "customer_id",
    "customer_name",
    "contact_name",
    "title",
    "status",
    "line_items",
    "subtotal",
    "tax",
    "total",
    "valid_until",
    "notes",
    "created_at",
    "updated_at"
  ],
  jobs: [
    "id",
    "company_id",
    "number",
    "customer_id",
    "customer_name",
    "contact_name",
    "site_address",
    "title",
    "type",
    "status",
    "priority",
    "technician_id",
    "technician_name",
    "quote_id",
    "asset_id",
    "scheduled_date",
    "estimated_hours",
    "labor_cost",
    "material_cost",
    "tasks",
    "notes",
    "project_id",
    "cost_center_id",
    "created_at",
    "updated_at"
  ],
  projects: [
    "id",
    "company_id",
    "number",
    "name",
    "customer_id",
    "customer_name",
    "site_address",
    "status",
    "description",
    "start_date",
    "end_date",
    "created_at",
    "updated_at"
  ],
  costCenters: [
    "id",
    "company_id",
    "name",
    "code",
    "active",
    "created_at",
    "updated_at"
  ],
  invoices: [
    "id",
    "company_id",
    "number",
    "job_id",
    "customer_id",
    "customer_name",
    "contact_name",
    "title",
    "status",
    "line_items",
    "subtotal",
    "tax",
    "total",
    "due_date",
    "notes",
    "created_at",
    "updated_at"
  ],
  stock: [
    "id",
    "company_id",
    "name",
    "category",
    "unit",
    "cost_price",
    "unit_price",
    "reorder_level",
    "quantity",
    "locations",
    "supplier",
    "created_at",
    "updated_at"
  ],
  timesheets: [
    "id",
    "company_id",
    "technician_id",
    "technician_name",
    "date",
    "duration_hours",
    "job_id",
    "status",
    "approved_by",
    "created_at",
    "updated_at"
  ],
  contractors: [
    "id",
    "company_id",
    "name",
    "email",
    "phone",
    "status",
    "contact_name",
    "license_number",
    "hourly_rate",
    "after_hours_rate",
    "callout_fee",
    "specialties",
    "notes",
    "portal_token",
    "compliance_docs",
    "created_at",
    "updated_at"
  ],
  suppliers: [
    "id",
    "company_id",
    "name",
    "email",
    "phone",
    "status",
    "contact_name",
    "address",
    "category",
    "account_number",
    "payment_terms",
    "notes",
    "attachments",
    "created_at",
    "updated_at"
  ],
  leads: [
    "id",
    "company_id",
    "number",
    "title",
    "customer_id",
    "customer_name",
    "contact_name",
    "status",
    "source",
    "value",
    "description",
    "priority",
    "created_at",
    "updated_at"
  ],
  schedule: [
    "id",
    "company_id",
    "job_id",
    "job_number",
    "title",
    "technician_id",
    "technician_name",
    "color",
    "day_offset",
    "start_hour",
    "end_hour",
    "customer_name",
    "site_address",
    "created_at",
    "updated_at"
  ],
  password_reset_requests: [
    "id",
    "technician_id",
    "employee_id",
    "requested_at",
    "status",
    "token",
    "created_at",
    "updated_at"
  ],
  purchase_orders: [
    "id",
    "company_id",
    "number",
    "supplier_id",
    "supplier_name",
    "status",
    "line_items",
    "total",
    "created_at",
    "updated_at"
  ],
  notifications: [
    "id",
    "company_id",
    "title",
    "message",
    "link",
    "status",
    "type",
    "description",
    "priority",
    "read",
    "number",
    "asset_id",
    "job_id",
    "due_date",
    "created_at",
    "updated_at"
  ],
  form_templates: [
    "id",
    "company_id",
    "name",
    "fields",
    "created_at",
    "updated_at"
  ],
  form_instances: [
    "id",
    "company_id",
    "template_id",
    "job_id",
    "values",
    "created_at",
    "updated_at"
  ],
  kits: [
    "id",
    "company_id",
    "name",
    "items",
    "created_at",
    "updated_at"
  ],
  documents: [
    "id",
    "company_id",
    "name",
    "file_path",
    "job_id",
    "created_at",
    "updated_at"
  ]
};

export const RELAY_LOGO_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg viewBox="0 0 320 53.598302" xmlns="http://www.w3.org/2000/svg"><g fill="#FF5C00"><g transform="translate(-19.023693,-210.20382)"><g transform="matrix(0.3804654,0,0,0.3804654,-83.598864,122.48096)"><g transform="translate(107.79013)"><g transform="translate(-22.948867,-9.0404629)"><path d="m 267.58275,347.28778 q 0.0535,9.78228 1.22947,17.15908 1.22947,7.3768 3.74185,11.27903 -2.40547,2.29856 -7.16298,3.42112 -4.7575,1.17601 -7.69753,1.17601 -9.515,-0.10691 -13.31031,-7.10952 -3.31422,-6.20079 -3.31422,-15.92962 0,-1.28292 0.26728,-7.64407 0.26728,-6.41461 3.52803,-20.04566 3.26076,-13.63104 7.80445,-26.94136 4.54368,-13.31031 8.87354,-23.94787 1.22947,-0.10691 2.45893,-0.10691 2.56585,0 5.39897,0.58801 2.83311,0.588 4.32986,4.16949 0.69491,1.65711 0.69491,4.38332 0,3.15385 -0.90873,7.64407 -2.19166,10.26338 -3.63495,20.63366 1.28292,0.64147 2.72621,0.64147 2.88657,0 7.3768,-3.1004 4.49023,-3.10039 8.49936,-9.62191 3.79531,-6.09388 3.79531,-12.34813 v -0.80182 q -1.12256,-11.33248 -7.69753,-14.80706 -3.74186,-1.97784 -8.44591,-1.97784 -3.58149,0 -10.47719,1.87093 -6.84225,1.81747 -16.94526,8.71318 -10.04955,6.8957 -18.17473,16.3038 -8.07171,9.35464 -11.6532,19.5111 -1.92439,5.29205 -1.92439,10.31683 0,4.54368 1.60366,8.87354 -5.66624,0.96219 -10.37029,0.96219 -6.41461,0 -12.82922,-2.40547 -6.36115,-2.45894 -9.14081,-9.03391 -1.33638,-3.26076 -1.33638,-6.89571 0,-3.6884 1.38983,-7.80444 4.00913,-10.53065 18.01436,-22.07694 14.05869,-11.59976 34.05089,-20.36639 20.04565,-8.76663 42.06914,-10.90484 2.56584,-0.16036 4.97132,-0.16036 11.38593,0 19.77838,4.59714 8.4459,4.59713 12.6154,13.47068 3.84877,8.07171 3.84877,17.42635 0,0.80183 -0.21382,6.36116 -0.16037,5.55932 -4.49023,14.91396 -4.32986,9.30119 -12.1343,15.34161 -7.80444,6.04042 -18.49546,6.46806 8.87354,6.41461 19.5111,7.10953 1.17601,0.0534 2.35203,0.0534 9.67537,0 20.90093,-5.07823 0.26728,3.79531 0.26728,7.10953 0,9.0339 -2.35203,16.14343 -2.35202,7.10952 -7.32334,10.90484 -4.97132,3.79531 -10.63756,4.49022 -2.13821,0.26728 -4.11604,0.26728 -3.42113,0 -6.46807,-0.74837 -5.8266,-1.38984 -11.38593,-6.20079 -5.50587,-4.7575 -10.47719,-11.65321 -4.91787,-6.8957 -8.98046,-14.59324 z" /><path d="m 370.43971,354.90523 -15.22212,-9.62244 -16.8901,6.24731 4.44762,-17.45058 -11.16089,-14.13291 17.97088,-1.16261 9.9923,-14.98194 6.659,16.73206 17.33647,4.87357 -13.85539,11.50358 z" /><path d="m 348.39147,304.71497 -3.17554,-13.39823 -12.4452,-5.89179 11.76117,-7.16041 1.75766,-13.65677 10.44434,8.97286 13.53148,-2.54853 -5.30619,12.70593 6.60527,12.08167 -13.72376,-1.12015 z" /><path d="m 334.8158,263.90614 -5.7247,-6.06772 -8.31437,0.67863 4.00173,-7.31954 -3.21471,-7.6977 8.19789,1.544 6.32758,-5.43609 1.06484,8.27379 7.12538,4.33803 -7.53978,3.56946 z" /></g></g></g><text x="90" y="36" fill="#2D3134" font-family="'Inter', -apple-system, sans-serif" font-size="25" font-weight="900" letter-spacing="0.04em">DISPATCH</text></svg>`)}`;

export const RELAY_LOGO_SMALL_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg viewBox="0 0 75.592812 53.598302" xmlns="http://www.w3.org/2000/svg"><g fill="#FF5C00"><g transform="translate(-19.023693,-210.20382)"><g transform="matrix(0.3804654,0,0,0.3804654,-83.598864,122.48096)"><g transform="translate(107.79013)"><g transform="translate(-22.948867,-9.0404629)"><path d="m 267.58275,347.28778 q 0.0535,9.78228 1.22947,17.15908 1.22947,7.3768 3.74185,11.27903 -2.40547,2.29856 -7.16298,3.42112 -4.7575,1.17601 -7.69753,1.17601 -9.515,-0.10691 -13.31031,-7.10952 -3.31422,-6.20079 -3.31422,-15.92962 0,-1.28292 0.26728,-7.64407 q 0.26728,-6.41461 3.52803,-20.04566 q 3.26076,-13.63104 7.80445,-26.94136 q 4.54368,-13.31031 8.87354,-23.94787 q 1.22947,-0.10691 2.45893,-0.10691 q 2.56585,0 5.39897,0.58801 q 2.83311,0.588 4.32986,4.16949 q 0.69491,1.65711 0.69491,4.38332 0,3.15385 -0.90873,7.64407 -2.19166,10.26338 -3.63495,20.63366 q 1.28292,0.64147 2.72621,0.64147 q 2.88657,0 7.3768,-3.1004 q 4.49023,-3.10039 8.49936,-9.62191 q 3.79531,-6.09388 3.79531,-12.34813 v -0.80182 q -1.12256,-11.33248 -7.69753,-14.80706 -3.74186,-1.97784 -8.44591,-1.97784 -3.58149,0 -10.47719,1.87093 q -6.84225,1.81747 -16.94526,8.71318 q -10.04955,6.8957 -18.17473,16.3038 q -8.07171,9.35464 -11.6532,19.5111 -1.92439,5.29205 -1.92439,10.31683 0,4.54368 1.60366,8.87354 -5.66624,0.96219 -10.37029,0.96219 -6.41461,0 -12.82922,-2.40547 -6.36115,-2.45894 -9.14081,-9.03391 -1.33638,-3.26076 -1.33638,-6.89571 0,-3.6884 1.38983,-7.80444 q 4.00913,-10.53065 18.01436,-22.07694 q 14.05869,-11.59976 34.05089,-20.36639 q 20.04565,-8.76663 42.06914,-10.90484 q 2.56584,-0.16036 4.97132,-0.16036 q 11.38593,0 19.77838,4.59714 q 8.4459,4.59713 12.6154,13.47068 q 3.84877,8.07171 3.84877,17.42635 0,0.80183 -0.21382,6.36116 -0.16037,5.55932 -4.49023,14.91396 q -4.32986,9.30119 -12.1343,15.34161 -7.80444,6.04042 -18.49546,6.46806 q 8.87354,6.41461 19.5111,7.10953 q 1.17601,0.0534 2.35203,0.0534 9.67537,0 20.90093,-5.07823 0.26728,3.79531 0.26728,7.10953 0,9.0339 -2.35203,16.14343 q -2.35202,7.10952 -7.32334,10.90484 -4.97132,3.79531 -10.63756,4.49022 -2.13821,0.26728 -4.11604,0.26728 -3.42113,0 -6.46807,-0.74837 -5.8266,-1.38984 -11.38593,-6.20079 q -5.50587,-4.7575 -10.47719,-11.65321 q -4.91787,-6.8957 -8.98046,-14.59324 z" /><path d="m 370.43971,354.90523 -15.22212,-9.62244 -16.8901,6.24731 4.44762,-17.45058 -11.16089,-14.13291 17.97088,-1.16261 9.9923,-14.98194 6.659,16.73206 17.33647,4.87357 -13.85539,11.50358 z" /><path d="m 348.39147,304.71497 -3.17554,-13.39823 -12.4452,-5.89179 11.76117,-7.16041 1.75766,-13.65677 10.44434,8.97286 13.53148,-2.54853 -5.30619,12.70593 6.60527,12.08167 -13.72376,-1.12015 z" /><path d="m 334.8158,263.90614 -5.7247,-6.06772 -8.31437,0.67863 4.00173,-7.31954 -3.21471,-7.6977 8.19789,1.544 6.32758,-5.43609 1.06484,8.27379 7.12538,4.33803 -7.53978,3.56946 z" /></g></g></g></svg>`)}`;

const MODULE_PERMS = {
  'Dashboard': [{ key: 'view' }],
  'Customers': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }, { key: 'manage_contacts' }],
  'Leads': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }, { key: 'convert' }],
  'Quotes': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }, { key: 'approve' }, { key: 'convert' }, { key: 'generate_pdf' }],
  'Jobs': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }, { key: 'manage_tasks' }, { key: 'book_time' }, { key: 'view_costs' }, { key: 'view_quotes_tab' }, { key: 'view_pos_tab' }, { key: 'view_timesheets_tab' }, { key: 'view_invoices_tab' }, { key: 'manage_materials' }, { key: 'create_invoice' }],
  'Timesheets': [{ key: 'view_own' }, { key: 'view' }, { key: 'create' }, { key: 'approve' }, { key: 'edit_all' }, { key: 'export' }],
  'Assets': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }],
  'Schedule': [{ key: 'view_own' }, { key: 'view' }, { key: 'edit' }],
  'Contractors': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }],
  'Suppliers': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }],
  'Stock': [{ key: 'view' }, { key: 'create' }, { key: 'edit' }, { key: 'delete' }],
  'Purchase Orders': [{ key: 'view' }, { key: 'create' }, { key: 'approve' }],
  'Invoices': [{ key: 'view' }, { key: 'create' }, { key: 'send' }, { key: 'void' }],
  'Reports': [{ key: 'view' }, { key: 'export' }],
  'Documents': [{ key: 'view' }, { key: 'upload' }],
  'Settings': [{ key: 'view' }, { key: 'edit_company' }, { key: 'manage_users' }, { key: 'manage_tax' }]
};

function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

class DataStore {
  constructor() {
    this.listeners = {};
    this.cache = {};
    this.companySettings = null;
    this.companyId = null;
    this.userId = null;
    this.subscriptions = [];
    this.initPromise = null;
    this.db = null;
    this.dirHandle = null;
    this.folderSyncEnabled = typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.getStorageKey('folder_sync_enabled')) === 'true'
      : false;
    this.folderSyncPermissionGranted = false;
    this.backupDirHandle = null;
    this.backupDirPermissionGranted = false;

    // Check if we have a cloud user at boot (before filling cache)
    const bootUser = typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem('currentUser') || 'null')
      : null;
    const isCloudUser = !!(bootUser && bootUser.companyId && !bootUser.companyId.startsWith('acct_'));

    if (!isCloudUser && bootUser && bootUser.companyId && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('relay_active_account', bootUser.companyId);
    }

    // Pre-initialize empty arrays for collections.
    Object.keys(TABLE_MAP).forEach(col => {
      this.cache[col] = [];
    });

    // Load local settings if they exist (only for offline/demo mode)
    if (!isCloudUser && typeof localStorage !== 'undefined') {
      const localSettings = localStorage.getItem(this.getStorageKey('settings'));
      if (localSettings) {
        try {
          this.companySettings = JSON.parse(localSettings);
        } catch {}
      }
    }

    // Handle authentication state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.userId = session.user.id;
        const userMeta = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.companyId = userMeta.companyId || null;
        if (this.companyId && !this.companyId.startsWith('acct_')) {
          this.initPromise = this.initializeCloudSync();
        }
      } else {
        // Only clear sync if we were previously in cloud sync mode or companyId is not defined
        if (!this.companyId || !this.companyId.startsWith('acct_')) {
          this.clearSync();
        }
      }
    });

    // Auto-trigger sync or local load if user already logged in at boot
    if (isCloudUser) {
      this.userId = bootUser.id;
      this.companyId = bootUser.companyId;
      this.initPromise = this.initializeCloudSync();
    } else {
      if (bootUser && bootUser.companyId) {
        this.userId = bootUser.id;
        this.companyId = bootUser.companyId;
      }
      this.initPromise = this.initializeLocalStore();
    }
  }

  getStorageKey(collection) {
    const activeAccount = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('relay_active_account') : null;
    if (activeAccount) {
      return `relay_${activeAccount}_${collection}`;
    }
    return `simpro_${collection}`;
  }

  getDBName() {
    const activeAccount = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('relay_active_account') : null;
    return activeAccount ? `RelayDispatchDB_${activeAccount}` : 'RelayDispatchDB';
  }

  async initializeUser(user) {
    if (user && user.companyId && !user.companyId.startsWith('acct_')) {
      this.userId = user.id;
      this.companyId = user.companyId;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('relay_active_account');
      }
      this.initPromise = this.initializeCloudSync();
      await this.initPromise;
    } else {
      this.clearSync();
      if (user && user.companyId) {
        this.userId = user.id;
        this.companyId = user.companyId;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('relay_active_account', user.companyId);
        }
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('relay_active_account');
        }
      }
      this.initPromise = this.initializeLocalStore();
      await this.initPromise;
    }
  }

  async initializeLocalStore() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.dirHandle = null;
    this.folderSyncEnabled = typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.getStorageKey('folder_sync_enabled')) === 'true'
      : false;
    this.folderSyncPermissionGranted = false;

    try {
      await this.initIndexedDB();
    } catch (e) {
      console.error('Failed to initialize IndexedDB, falling back to empty arrays:', e);
    }

    // Load local settings if they exist (namespaced)
    this.companySettings = null;
    if (typeof localStorage !== 'undefined') {
      const localSettings = localStorage.getItem(this.getStorageKey('settings'));
      if (localSettings) {
        try {
          this.companySettings = JSON.parse(localSettings);
        } catch {}
      }
    }
    this.emit('settings', this.getSettings());

    // Seed default user types and forms if empty
    if (this.cache.userTypes.length === 0) {
      await this.seedDefaultUserTypes();
    }
    if (this.cache.formTemplates.length === 0) {
      await this.seedFormTemplates();
    }
    if (this.cache.technicians.length === 0) {
      await this.seedDefaultTechnicians();
    }
  }

  initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return resolve();
      }

      const dbName = this.getDBName();
      const request = window.indexedDB.open(dbName, 3);

      request.onerror = (e) => {
        console.error('IndexedDB open error:', e.target.error);
        reject(e.target.error);
      };

      request.onsuccess = async (e) => {
        this.db = e.target.result;
        
        // 1. Load custom directory sync config from IndexedDB config store if it exists
        try {
          if (this.db.objectStoreNames.contains('config')) {
            await new Promise((resConfig) => {
              const transaction = this.db.transaction('config', 'readonly');
              const configStore = transaction.objectStore('config');
              
              const getSync = new Promise((resolve) => {
                const req = configStore.get('directory_handle');
                req.onsuccess = () => {
                  console.log('[DEBUG Store] getSync onsuccess result:', req.result);
                  if (req.result) {
                    this.dirHandle = req.result.value;
                    console.log('[DEBUG Store] loaded dirHandle:', this.dirHandle ? this.dirHandle.name : null);
                  }
                  resolve();
                };
                req.onerror = (e) => {
                  console.error('[DEBUG Store] getSync onerror:', e);
                  resolve();
                };
              });

              const getBackup = new Promise((resolve) => {
                const req = configStore.get('backup_directory_handle');
                req.onsuccess = () => {
                  if (req.result) this.backupDirHandle = req.result.value;
                  resolve();
                };
                req.onerror = () => resolve();
              });

              Promise.all([getSync, getBackup]).then(() => resConfig());
            });
          }
        } catch (err) {
          console.warn('Failed to read config from IndexedDB:', err);
        }

        // Verify directory permission silently on boot if handle exists
        if (this.dirHandle) {
          try {
            // Check permission silently without prompt dialog
            const opts = { mode: 'readwrite' };
            const status = await this.dirHandle.queryPermission(opts);
            this.folderSyncPermissionGranted = status === 'granted';
          } catch (err) {
            console.warn('Failed to query directory permission on boot:', err);
          }
        }

        // Verify backup directory permission silently on boot if handle exists
        if (this.backupDirHandle) {
          try {
            const opts = { mode: 'readwrite' };
            const status = await this.backupDirHandle.queryPermission(opts);
            this.backupDirPermissionGranted = status === 'granted';

            // Auto-trigger backup if granted and > 7 days since last backup
            if (this.backupDirPermissionGranted) {
              const lastBackup = localStorage.getItem('relay_last_backup_time');
              const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
              if (!lastBackup || new Date(lastBackup).getTime() < sevenDaysAgo) {
                this.backupToFolder().catch(err => {
                  console.error('Auto background backup failed:', err);
                });
              }
            }
          } catch (err) {
            console.warn('Failed to query backup directory permission on boot:', err);
          }
        }

        // Load all collections into cache
        const collections = Object.keys(TABLE_MAP);
        const loadPromises = collections.map(async (col) => {
          try {
            this.cache[col] = await this.readAllFromIndexedDB(col);
          } catch (err) {
            console.error(`Error loading collection ${col} from IndexedDB:`, err);
            this.cache[col] = [];
          }
        });

        await Promise.all(loadPromises);

        // Perform migration if we have old data in localStorage (only if not in a namespaced local account profile)
        const activeAccount = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('relay_active_account') : null;
        if (!activeAccount) {
          const migratePromises = collections.map(async (col) => {
            const localData = localStorage.getItem('simpro_' + col);
            if (localData) {
              try {
                const items = JSON.parse(localData);
                if (Array.isArray(items) && items.length > 0) {
                  // Write all items to IndexedDB
                  await this.writeAllToIndexedDB(col, items);
                  // Merge into cache if cache is empty
                  if (this.cache[col].length === 0) {
                    this.cache[col] = items;
                  }
                }
                localStorage.removeItem('simpro_' + col);
              } catch (err) {
                console.error(`Migration error for ${col}:`, err);
              }
            }
          });

          await Promise.all(migratePromises);
        }
        resolve();
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        const collections = Object.keys(TABLE_MAP);
        collections.forEach(col => {
          if (!db.objectStoreNames.contains(col)) {
            db.createObjectStore(col, { keyPath: 'id' });
          }
        });
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      };
    });
  }

  readAllFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || []);
        };

        getAllRequest.onerror = (e) => {
          reject(e.target.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  writeRecordToIndexedDB(storeName, record) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const putRequest = store.put(record);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  deleteRecordFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const deleteRequest = store.delete(id);

        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = (e) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  writeAllToIndexedDB(storeName, items) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear existing
        const clearRequest = store.clear();
        clearRequest.onerror = (e) => reject(e.target.error);
        
        clearRequest.onsuccess = () => {
          let count = 0;
          if (items.length === 0) return resolve();
          
          items.forEach(item => {
            const putRequest = store.put(item);
            putRequest.onerror = (e) => reject(e.target.error);
            putRequest.onsuccess = () => {
              count++;
              if (count === items.length) {
                resolve();
              }
            };
          });
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  clearAllIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      try {
        const collections = Object.keys(TABLE_MAP);
        const transaction = this.db.transaction(collections, 'readwrite');
        let count = 0;
        
        collections.forEach(col => {
          const store = transaction.objectStore(col);
          const clearRequest = store.clear();
          clearRequest.onerror = (e) => reject(e.target.error);
          clearRequest.onsuccess = () => {
            count++;
            if (count === collections.length) {
              resolve();
            }
          };
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // ── Local Folder Sync / File System Access Driver ──────────────────────────

  async verifyDirPermission(readWrite) {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
      this.folderSyncPermissionGranted = true;
      return true; // Capacitor native has permissions checked at app level
    }

    if (!this.dirHandle) return false;
    const opts = {};
    if (readWrite) opts.mode = 'readwrite';
    
    try {
      const currentPerm = await this.dirHandle.queryPermission(opts);
      if (currentPerm === 'granted') {
        this.folderSyncPermissionGranted = true;
        return true;
      }
      
      // Request permission (must be called within a user gesture handler)
      const newPerm = await this.dirHandle.requestPermission(opts);
      this.folderSyncPermissionGranted = newPerm === 'granted';
      return this.folderSyncPermissionGranted;
    } catch (e) {
      this.folderSyncPermissionGranted = false;
      return false;
    }
  }

  async verifyBackupDirPermission(requestInteractive) {
    if (!this.backupDirHandle) return false;
    const opts = { mode: 'readwrite' };
    try {
      const currentPerm = await this.backupDirHandle.queryPermission(opts);
      if (currentPerm === 'granted') {
        this.backupDirPermissionGranted = true;
        return true;
      }
      if (requestInteractive) {
        const newPerm = await this.backupDirHandle.requestPermission(opts);
        this.backupDirPermissionGranted = newPerm === 'granted';
        return this.backupDirPermissionGranted;
      }
      this.backupDirPermissionGranted = false;
      return false;
    } catch (e) {
      this.backupDirPermissionGranted = false;
      return false;
    }
  }

  // Ensure a subfolder for the current company exists within the selected directory.
  async ensureCompanyFolderHandle(customDirHandle) {
    const baseHandle = customDirHandle || this.dirHandle;
    if (!baseHandle) return null;
    const rawName = this.companySettings?.name || this.companySettings?.id || 'Company';
    const safeName = rawName.replace(/[\\/:*?"<>|]/g, '_');
    try {
      const companyHandle = await baseHandle.getDirectoryHandle(safeName, { create: true });
      return companyHandle;
    } catch (e) {
      console.error('Failed to get/create company folder:', e);
      return null;
    }
  }

  async setBackupDirectory(dirHandle) {
    this.backupDirHandle = dirHandle || null;
    this.backupDirPermissionGranted = !!dirHandle;
    
    if (this.db) {
      await new Promise((resolve) => {
        const transaction = this.db.transaction('config', 'readwrite');
        const configStore = transaction.objectStore('config');
        if (dirHandle) {
          const putReq = configStore.put({ key: 'backup_directory_handle', value: dirHandle });
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => resolve();
        } else {
          const deleteReq = configStore.delete('backup_directory_handle');
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => resolve();
        }
      });
    }
  }

  async backupToFolder(dirHandle) {
    const handle = dirHandle || this.backupDirHandle;
    if (!handle) throw new Error('No backup directory configured.');
    
    const currentPerm = await handle.queryPermission({ mode: 'readwrite' });
    if (currentPerm !== 'granted') {
      const newPerm = await handle.requestPermission({ mode: 'readwrite' });
      if (newPerm !== 'granted') {
        throw new Error('Write permission denied for backup directory.');
      }
    }
    
    // Ensure company-specific folder exists within the selected directory
    const companyFolderHandle = await this.ensureCompanyFolderHandle(dirHandle);
    const dataDir = await companyFolderHandle.getDirectoryHandle('data', { create: true });
    const collections = Object.keys(TABLE_MAP);
    for (const col of collections) {
      const items = this.cache[col] || [];
      const fileHandle = await dataDir.getFileHandle(`${col}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(items, null, 2));
      await writable.close();
    }
    
    // Update last backup timestamp
    localStorage.setItem('relay_last_backup_time', new Date().toISOString());
    this.backupDirPermissionGranted = true;
  }

  async setLocalDirectory(dirHandle) {
    this.dirHandle = dirHandle;
    if (dirHandle) {
      this.folderSyncEnabled = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getStorageKey('folder_sync_enabled'), 'true');
      }
      
      // Save handle to IndexedDB
      if (this.db) {
        await new Promise((resolve, reject) => {
          const transaction = this.db.transaction('config', 'readwrite');
          const configStore = transaction.objectStore('config');
          const putReq = configStore.put({ key: 'directory_handle', value: dirHandle });
          putReq.onsuccess = () => resolve();
          putReq.onerror = (e) => reject(e.target.error);
        });
      }
      
      this.folderSyncPermissionGranted = true;
      
      // Force rewrite all cached collections to directory immediately
      const collections = Object.keys(TABLE_MAP);
      await Promise.all(collections.map(col => this.writeCollectionToFolder(col, this.cache[col])));
    } else {
      this.folderSyncEnabled = false;
      this.folderSyncPermissionGranted = false;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.getStorageKey('folder_sync_enabled'));
      }
      
      // Remove handle from IndexedDB
      if (this.db) {
        await new Promise((resolve) => {
          const transaction = this.db.transaction('config', 'readwrite');
          const configStore = transaction.objectStore('config');
          const deleteReq = configStore.delete('directory_handle');
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => resolve();
        });
      }
    }
  }

  async writeCollectionToFolder(collection, items) {
    if (!this.folderSyncEnabled) return;

    // 1. Capacitor Native environment
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
      try {
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        await Filesystem.writeFile({
          path: `RelayDispatchData/data/${collection}.json`,
          data: JSON.stringify(items || [], null, 2),
          directory: 'DOCUMENTS',
          encoding: 'utf8',
          recursive: true
        });
      } catch (err) {
        console.error(`Capacitor failed to write collection ${collection}:`, err);
      }
      return;
    }

    // 2. Standard Browser File System Access API
    if (!this.dirHandle) return;
    try {
      const hasPerm = await this.verifyDirPermission(true);
      if (!hasPerm) return;

      const companyFolder = await this.ensureCompanyFolderHandle();
      if (!companyFolder) return;
      const dataDir = await companyFolder.getDirectoryHandle('data', { create: true });
      const fileHandle = await dataDir.getFileHandle(`${collection}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(items || [], null, 2));
      await writable.close();
    } catch (err) {
      console.error(`Failed to write collection ${collection} to local directory:`, err);
    }
  }

  async writeDocumentFileToFolder(docId, name, dataUrl) {
    if (!this.folderSyncEnabled) return null;

    const ext = name.includes('.') ? name.split('.').pop() : 'bin';
    const fileName = `${docId}.${ext}`;
    const relativePath = `documents/${fileName}`;

    // Extract base64 payload
    const base64Parts = dataUrl.split(',');
    if (base64Parts.length < 2) return null;
    const base64Data = base64Parts[1];

    // 1. Capacitor Native environment
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
      try {
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        await Filesystem.writeFile({
          path: `RelayDispatchData/documents/${fileName}`,
          data: base64Data,
          directory: 'DOCUMENTS',
          recursive: true
        });
        return relativePath;
      } catch (err) {
        console.error('Capacitor failed to write document:', err);
        return null;
      }
    }

    // 2. Standard Browser File System Access API
    if (!this.dirHandle) return null;
    try {
      const hasPerm = await this.verifyDirPermission(true);
      if (!hasPerm) return null;

      const mimeMatch = base64Parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });

      const companyFolder = await this.ensureCompanyFolderHandle();
      if (!companyFolder) return null;
      const docsDir = await companyFolder.getDirectoryHandle('documents', { create: true });
      const fileHandle = await docsDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      return relativePath;
    } catch (err) {
      console.error('Failed to save document file to local directory:', err);
      return null;
    }
  }

  async getDocumentUrl(doc) {
    if (!doc || !doc.url) return '';
    if (doc.url.startsWith('data:') || doc.url.startsWith('http')) {
      return doc.url;
    }

    // 1. Capacitor Native environment
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
      try {
        const Filesystem = window.Capacitor.Plugins.Filesystem;
        const result = await Filesystem.readFile({
          path: `RelayDispatchData/${doc.url}`,
          directory: 'DOCUMENTS'
        });
        const mime = doc.type || 'application/octet-stream';
        return `data:${mime};base64,${result.data}`;
      } catch (err) {
        console.error('Capacitor failed to read document file:', err);
        throw err;
      }
    }

    // 2. Standard Browser File System Access API
    if (!this.dirHandle) {
      throw new Error('Local directory sync is not configured.');
    }

    try {
      const hasPerm = await this.verifyDirPermission(false);
      if (!hasPerm) {
        throw new Error('Permission to access the local directory was not granted.');
      }

      const parts = doc.url.split('/');
      const dirName = parts[0];
      const fileName = parts[1];

      const dir = await this.dirHandle.getDirectoryHandle(dirName);
      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch (err) {
      console.error('Failed to read file from local directory:', err);
      throw err;
    }
  }


  // Fetch all tenant data into memory cache and subscribe to real-time updates
  async initializeCloudSync() {
    if (!this.companyId) return;

    try {
      // Initialize IndexedDB for cloud users too, to store backup directory handles
      await this.initIndexedDB();

      // 1. Fetch Company Settings
      const { data: comp, error: compErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', this.companyId)
        .single();
      if (!compErr && comp) {
        this.companySettings = {
          name: comp.name,
          ...(comp.settings || {})
        };
      }

      // 2. Fetch all collections in parallel
      const collections = Object.keys(TABLE_MAP);
      const promises = collections.map(async (col) => {
        const table = TABLE_MAP[col];
        if (table === 'companies') return;

        let query = supabase.from(table).select('*');
        
        // Scope queries by company_id
        query = query.eq('company_id', this.companyId);

        const { data, error } = await query;
        if (!error && data) {
          // Normalize snake_case column names back to camelCase for the frontend
          this.cache[col] = this.normalizeData(data, col);
        }
      });

      await Promise.all(promises);

      // Seed default user types if database is empty
      if (this.cache.userTypes.length === 0) {
        await this.seedDefaultUserTypes();
      }

      // Seed form templates if database is empty
      if (this.cache.formTemplates.length === 0) {
        await this.seedFormTemplates();
      }

      // 3. Set up Realtime listener subscriptions
      this.subscribeRealtime();

      // Emit loaded event for all collections
      collections.forEach(col => {
        this.emit(col, this.cache[col]);
      });
      this.emit('settings', this.getSettings());

    } catch (e) {
      console.error('Error initializing Supabase sync:', e);
    }
  }

  subscribeRealtime() {
    this.clearSubscriptions();

    // Unique channel name per subscribe — reusing a fixed name throws
    // "cannot add postgres_changes callbacks ... after subscribe()" when sync re-inits.
    const channel = supabase
      .channel(`table-db-changes-${this.companyId || 'anon'}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const table = payload.table;
        const col = Object.keys(TABLE_MAP).find(key => TABLE_MAP[key] === table);
        if (!col) return;

        // Skip records from other companies
        if (payload.new && payload.new.company_id && payload.new.company_id !== this.companyId) return;
        if (payload.old && payload.old.company_id && payload.old.company_id !== this.companyId) return;

        const items = [...(this.cache[col] || [])];
        
        if (payload.eventType === 'INSERT') {
          const newItem = this.normalizeRecord(payload.new, col);
          if (!items.some(x => x.id === newItem.id)) {
            items.push(newItem);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedItem = this.normalizeRecord(payload.new, col);
          const idx = items.findIndex(x => x.id === updatedItem.id);
          if (idx !== -1) {
            items[idx] = updatedItem;
          }
        } else if (payload.eventType === 'DELETE') {
          const idx = items.findIndex(x => x.id === payload.old.id);
          if (idx !== -1) {
            items.splice(idx, 1);
          }
        }

        this.cache[col] = items;
        this.emit(col, items);
      })
      .subscribe();

    this.subscriptions.push(channel);
  }

  clearSubscriptions() {
    this.subscriptions.forEach(sub => supabase.removeChannel(sub));
    this.subscriptions = [];
  }

  clearSync() {
    this.clearSubscriptions();
    this.companyId = null;
    this.userId = null;
    this.companySettings = null;
    Object.keys(TABLE_MAP).forEach(col => {
      this.cache[col] = [];
    });
  }

  // Normalization Helpers (translates snake_case keys from Postgres -> camelCase for frontend)
  normalizeData(data, collection) {
    return data.map(item => this.normalizeRecord(item, collection));
  }

  normalizeRecord(item, collection) {
    if (!item) return null;
    const record = { ...item };

    if (collection === 'formTemplates') {
      record.sections = record.fields?.sections || [];
      record.description = record.fields?.description || '';
      delete record.fields;
    }

    if (collection === 'contractors') {
      record.businessName = record.name;
      record.active = record.status === 'Active';
    }

    if (collection === 'suppliers') {
      record.active = record.status === 'Active';
    }

    // Standard snake_case mappings used in SQL schema
    if (record.company_id !== undefined) {
      record.companyId = record.company_id;
      delete record.company_id;
    }
    if (record.user_type_id !== undefined) {
      record.userTypeId = record.user_type_id;
      delete record.user_type_id;
    }
    if (record.force_password_change !== undefined) {
      record.forcePasswordChange = record.force_password_change;
      delete record.force_password_change;
    }
    if (record.pay_rate !== undefined) {
      record.payRate = parseFloat(record.pay_rate);
      delete record.pay_rate;
    }
    if (record.first_name !== undefined) {
      record.firstName = record.first_name;
      delete record.first_name;
    }
    if (record.last_name !== undefined) {
      record.lastName = record.last_name;
      delete record.last_name;
    }
    if (record.portal_token !== undefined) {
      record.portalToken = record.portal_token;
      delete record.portal_token;
    }
    if (record.owner_type !== undefined) {
      record.ownerType = record.owner_type;
      delete record.owner_type;
    }
    if (record.customer_id !== undefined) {
      record.customerId = record.customer_id;
      delete record.customer_id;
    }
    if (record.customer_name !== undefined) {
      record.customerName = record.customer_name;
      delete record.customer_name;
    }
    if (record.project_id !== undefined) {
      record.projectId = record.project_id;
      delete record.project_id;
    }
    if (record.cost_center_id !== undefined) {
      record.costCenterId = record.cost_center_id;
      delete record.cost_center_id;
    }
    if (record.start_date !== undefined) {
      record.startDate = record.start_date;
      delete record.start_date;
    }
    if (record.end_date !== undefined) {
      record.endDate = record.end_date;
      delete record.end_date;
    }
    if (record.current_meter !== undefined) {
      record.currentMeter = parseFloat(record.current_meter);
      delete record.current_meter;
    }
    if (record.recovery_rate !== undefined) {
      record.recoveryRate = parseFloat(record.recovery_rate);
      delete record.recovery_rate;
    }
    if (record.meter_interval !== undefined) {
      record.meterInterval = parseFloat(record.meter_interval);
      delete record.meter_interval;
    }
    if (record.last_triggered_meter !== undefined) {
      record.lastTriggeredMeter = parseFloat(record.last_triggered_meter);
      delete record.last_triggered_meter;
    }
    if (record.next_service_date !== undefined) {
      record.nextServiceDate = record.next_service_date;
      delete record.next_service_date;
    }
    if (record.collision_merging !== undefined) {
      record.collisionMerging = record.collision_merging;
      delete record.collision_merging;
    }
    if (record.line_items !== undefined) {
      record.lineItems = record.line_items;
      delete record.line_items;
    }
    if (record.valid_until !== undefined) {
      record.validUntil = record.valid_until;
      delete record.valid_until;
    }
    if (record.contact_name !== undefined) {
      record.contactName = record.contact_name;
      delete record.contact_name;
    }
    if (record.site_address !== undefined) {
      record.siteAddress = record.site_address;
      delete record.site_address;
    }
    if (record.technician_id !== undefined) {
      record.technicianId = record.technician_id;
      delete record.technician_id;
    }
    if (record.technician_name !== undefined) {
      record.technicianName = record.technician_name;
      delete record.technician_name;
    }
    if (record.quote_id !== undefined) {
      record.quoteId = record.quote_id;
      delete record.quote_id;
    }
    if (record.asset_id !== undefined) {
      record.assetId = record.asset_id;
      delete record.asset_id;
    }
    if (record.scheduled_date !== undefined) {
      record.scheduledDate = record.scheduled_date;
      delete record.scheduled_date;
    }
    if (record.estimated_hours !== undefined) {
      record.estimatedHours = parseFloat(record.estimated_hours);
      delete record.estimated_hours;
    }
    if (record.labor_cost !== undefined) {
      record.laborCost = parseFloat(record.labor_cost);
      delete record.labor_cost;
    }
    if (record.material_cost !== undefined) {
      record.materialCost = parseFloat(record.material_cost);
      delete record.material_cost;
    }
    if (record.job_id !== undefined) {
      record.jobId = record.job_id;
      delete record.job_id;
    }
    if (record.due_date !== undefined) {
      record.dueDate = record.due_date;
      delete record.due_date;
    }
    if (record.cost_price !== undefined) {
      record.costPrice = parseFloat(record.cost_price);
      delete record.cost_price;
    }
    if (record.unit_price !== undefined) {
      record.unitPrice = parseFloat(record.unit_price);
      delete record.unit_price;
    }
    if (record.reorder_level !== undefined) {
      record.reorderLevel = parseFloat(record.reorder_level);
      delete record.reorder_level;
    }
    if (record.duration_hours !== undefined) {
      record.durationHours = parseFloat(record.duration_hours);
      delete record.duration_hours;
    }
    if (record.approved_by !== undefined) {
      record.approvedBy = record.approved_by;
      delete record.approved_by;
    }
    if (record.supplier_id !== undefined) {
      record.supplierId = record.supplier_id;
      delete record.supplier_id;
    }
    if (record.supplier_name !== undefined) {
      record.supplierName = record.supplier_name;
      delete record.supplier_name;
    }
    if (record.template_id !== undefined) {
      record.templateId = record.template_id;
      delete record.template_id;
    }
    if (record.file_path !== undefined) {
      record.filePath = record.file_path;
      delete record.file_path;
    }
    if (record.created_at !== undefined) {
      record.createdAt = record.created_at;
      delete record.created_at;
    }
    if (record.updated_at !== undefined) {
      record.updatedAt = record.updated_at;
      delete record.updated_at;
    }
    // Contractor / supplier rich fields + lead / schedule fields
    if (record.license_number !== undefined) { record.licenseNumber = record.license_number; delete record.license_number; }
    if (record.hourly_rate !== undefined) { record.hourlyRate = parseFloat(record.hourly_rate); delete record.hourly_rate; }
    if (record.after_hours_rate !== undefined) { record.afterHoursRate = parseFloat(record.after_hours_rate); delete record.after_hours_rate; }
    if (record.callout_fee !== undefined) { record.calloutFee = parseFloat(record.callout_fee); delete record.callout_fee; }
    if (record.compliance_docs !== undefined) { record.complianceDocs = record.compliance_docs; delete record.compliance_docs; }
    if (record.account_number !== undefined) { record.accountNumber = record.account_number; delete record.account_number; }
    if (record.payment_terms !== undefined) { record.paymentTerms = record.payment_terms; delete record.payment_terms; }
    if (record.job_number !== undefined) { record.jobNumber = record.job_number; delete record.job_number; }
    if (record.day_offset !== undefined) { record.dayOffset = parseInt(record.day_offset); delete record.day_offset; }
    if (record.start_hour !== undefined) { record.startHour = parseFloat(record.start_hour); delete record.start_hour; }
    if (record.end_hour !== undefined) { record.endHour = parseFloat(record.end_hour); delete record.end_hour; }

    if (record.color && record.color.startsWith('__meta__:')) {
      try {
        const parsed = JSON.parse(record.color.substring(9));
        record.taskId = parsed.taskId;
        record.taskPath = parsed.taskId;
        record.taskName = parsed.taskName;
        record.color = parsed.color;
      } catch (e) {
        console.error(e);
      }
    }

    return record;
  }

  // De-normalize camelCase fields -> snake_case schema columns for database updates
  denormalizeRecord(item, collection) {
    const record = { ...item };

    if (collection === 'formTemplates') {
      record.fields = {
        description: record.description || '',
        sections: record.sections || []
      };
      delete record.description;
      delete record.sections;
    }

    if (collection === 'contractors') {
      record.name = record.businessName;
      record.status = record.active ? 'Active' : 'Inactive';
    }

    if (collection === 'suppliers') {
      record.status = record.active ? 'Active' : 'Inactive';
    }

    if (record.companyId !== undefined) {
      record.company_id = record.companyId;
      delete record.companyId;
    }
    if (record.userTypeId !== undefined) {
      record.user_type_id = record.userTypeId;
      delete record.userTypeId;
    }
    if (record.forcePasswordChange !== undefined) {
      record.force_password_change = record.forcePasswordChange;
      delete record.forcePasswordChange;
    }
    if (record.payRate !== undefined) {
      record.pay_rate = record.payRate;
      delete record.payRate;
    }
    if (record.firstName !== undefined) {
      record.first_name = record.firstName;
      delete record.firstName;
    }
    if (record.lastName !== undefined) {
      record.last_name = record.lastName;
      delete record.lastName;
    }
    if (record.portalToken !== undefined) {
      record.portal_token = record.portalToken;
      delete record.portalToken;
    }
    if (record.ownerType !== undefined) {
      record.owner_type = record.ownerType;
      delete record.ownerType;
    }
    if (record.customerId !== undefined) {
      record.customer_id = record.customerId;
      delete record.customerId;
    }
    if (record.customerName !== undefined) {
      record.customer_name = record.customerName;
      delete record.customerName;
    }
    if (record.projectId !== undefined) {
      record.project_id = record.projectId;
      delete record.projectId;
    }
    if (record.costCenterId !== undefined) {
      record.cost_center_id = record.costCenterId;
      delete record.costCenterId;
    }
    if (record.startDate !== undefined) {
      record.start_date = record.startDate;
      delete record.startDate;
    }
    if (record.endDate !== undefined) {
      record.end_date = record.endDate;
      delete record.endDate;
    }
    if (record.currentMeter !== undefined) {
      record.current_meter = record.currentMeter;
      delete record.currentMeter;
    }
    if (record.recoveryRate !== undefined) {
      record.recovery_rate = record.recoveryRate;
      delete record.recoveryRate;
    }
    if (record.meterInterval !== undefined) {
      record.meter_interval = record.meterInterval;
      delete record.meterInterval;
    }
    if (record.lastTriggeredMeter !== undefined) {
      record.last_triggered_meter = record.lastTriggeredMeter;
      delete record.lastTriggeredMeter;
    }
    if (record.nextServiceDate !== undefined) {
      record.next_service_date = record.nextServiceDate;
      delete record.nextServiceDate;
    }
    if (record.collisionMerging !== undefined) {
      record.collision_merging = record.collisionMerging;
      delete record.collisionMerging;
    }
    if (record.lineItems !== undefined) {
      record.line_items = record.lineItems;
      delete record.lineItems;
    }
    if (record.validUntil !== undefined) {
      record.valid_until = record.validUntil;
      delete record.validUntil;
    }
    if (record.contactName !== undefined) {
      record.contact_name = record.contactName;
      delete record.contactName;
    }
    if (record.siteAddress !== undefined) {
      record.site_address = record.siteAddress;
      delete record.siteAddress;
    }
    if (record.technicianId !== undefined) {
      record.technician_id = record.technicianId;
      delete record.technicianId;
    }
    if (record.technicianName !== undefined) {
      record.technician_name = record.technicianName;
      delete record.technicianName;
    }
    if (record.quoteId !== undefined) {
      record.quote_id = record.quoteId;
      delete record.quoteId;
    }
    if (record.assetId !== undefined) {
      record.asset_id = record.assetId;
      delete record.assetId;
    }
    if (record.scheduledDate !== undefined) {
      record.scheduled_date = record.scheduledDate;
      delete record.scheduledDate;
    }
    if (record.estimatedHours !== undefined) {
      record.estimated_hours = record.estimatedHours;
      delete record.estimatedHours;
    }
    if (record.laborCost !== undefined) {
      record.labor_cost = record.laborCost;
      delete record.laborCost;
    }
    if (record.materialCost !== undefined) {
      record.material_cost = record.materialCost;
      delete record.materialCost;
    }
    if (record.jobId !== undefined) {
      record.job_id = record.jobId;
      delete record.jobId;
    }
    if (record.dueDate !== undefined) {
      record.due_date = record.dueDate;
      delete record.dueDate;
    }
    if (record.costPrice !== undefined) {
      record.cost_price = record.costPrice;
      delete record.costPrice;
    }
    if (record.unitPrice !== undefined) {
      record.unit_price = record.unitPrice;
      delete record.unitPrice;
    }
    if (record.reorderLevel !== undefined) {
      record.reorder_level = record.reorderLevel;
      delete record.reorderLevel;
    }
    if (record.durationHours !== undefined) {
      record.duration_hours = record.durationHours;
      delete record.durationHours;
    }
    if (record.approvedBy !== undefined) {
      record.approved_by = record.approvedBy;
      delete record.approvedBy;
    }
    if (record.supplierId !== undefined) {
      record.supplier_id = record.supplierId;
      delete record.supplierId;
    }
    if (record.supplierName !== undefined) {
      record.supplier_name = record.supplierName;
      delete record.supplierName;
    }
    if (record.templateId !== undefined) {
      record.template_id = record.templateId;
      delete record.templateId;
    }
    if (record.filePath !== undefined) {
      record.file_path = record.filePath;
      delete record.filePath;
    }
    if (record.createdAt !== undefined) {
      record.created_at = record.createdAt;
      delete record.createdAt;
    }
    if (record.updatedAt !== undefined) {
      record.updated_at = record.updatedAt;
      delete record.updatedAt;
    }
    // Contractor / supplier rich fields + lead / schedule fields
    if (record.licenseNumber !== undefined) { record.license_number = record.licenseNumber; delete record.licenseNumber; }
    if (record.hourlyRate !== undefined) { record.hourly_rate = record.hourlyRate; delete record.hourlyRate; }
    if (record.afterHoursRate !== undefined) { record.after_hours_rate = record.afterHoursRate; delete record.afterHoursRate; }
    if (record.calloutFee !== undefined) { record.callout_fee = record.calloutFee; delete record.calloutFee; }
    if (record.complianceDocs !== undefined) { record.compliance_docs = record.complianceDocs; delete record.complianceDocs; }
    if (record.accountNumber !== undefined) { record.account_number = record.accountNumber; delete record.accountNumber; }
    if (record.paymentTerms !== undefined) { record.payment_terms = record.paymentTerms; delete record.paymentTerms; }
    if (record.jobNumber !== undefined) { record.job_number = record.jobNumber; delete record.jobNumber; }
    if (record.dayOffset !== undefined) { record.day_offset = record.dayOffset; delete record.dayOffset; }
    if (record.startHour !== undefined) { record.start_hour = record.startHour; delete record.startHour; }
    if (record.endHour !== undefined) { record.end_hour = record.endHour; delete record.endHour; }

    if (collection === 'schedule') {
      const meta = {
        taskId: record.taskId || record.taskPath || null,
        taskName: record.taskName || null,
        color: record.color || null
      };
      record.color = '__meta__:' + JSON.stringify(meta);
    }

    // Filter out columns not in schema to prevent 400 Bad Request
    const table = TABLE_MAP[collection];
    if (table && TABLE_COLUMNS[table]) {
      const allowedCols = TABLE_COLUMNS[table];
      Object.keys(record).forEach(key => {
        if (!allowedCols.includes(key)) {
          delete record[key];
        }
      });
    }

    return record;
  }

  // Legacy compatibility / No-op migration call
  migrateNumberFields() {}

  // ── Local-First Core API Operations ────────────────────────────────────────

  getAll(collection) {
    const items = this.cache[collection] || [];
    if (collection === 'technicians') {
      const loginMode = typeof localStorage !== 'undefined' ? localStorage.getItem('relay_login_mode') : null;
      if (loginMode === 'local') {
        const currentUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser && currentUser.id) {
            return [{
              id: currentUser.id,
              name: currentUser.name || 'Local Admin',
              role: 'Administrator',
              color: currentUser.color || '#FF5C00',
              userTypeId: currentUser.userTypeId,
              email: currentUser.email || '',
              username: currentUser.username || ''
            }];
          }
        }
      }
    }
    return items;
  }

  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  // Surface a failed background write to the user instead of failing silently.
  // (A silent insert/update failure leaves the optimistic cache entry in place, so the
  // record looks saved until the next reload — the classic "it didn't save" symptom.)
  _notifyWriteError(action, collection, error) {
    console.error(`Error trying to ${action} ${collection}:`, error?.message || error, error);
    try {
      import('../components/Notifications.js')
        .then(({ showToast }) => showToast(
          `Couldn't ${action} ${collection.replace(/s$/, '')} — ${error?.message || 'database error'}`,
          'error'))
        .catch(() => {});
    } catch (e) {}
  }

  // Pushes write changes asynchronously to Supabase while updating local cache synchronously
  create(collection, item) {
    item.id = item.id || this.generateId();
    if (collection === 'leads' && !item.number) {
      item.number = this.getNextNumber('LD-', 'leads');
    }
    if (collection === 'notifications' && !item.number) {
      item.number = this.getNextNumber('NT-', 'notifications');
    }
    if (collection === 'invoices' && !item.number) {
      item.number = this.getNextNumber('INV-', 'invoices');
    }
    if (collection === 'quotes' && !item.number) {
      item.number = this.getNextNumber('Q-', 'quotes');
    }
    if (collection === 'jobs' && !item.number) {
      item.number = this.getNextNumber('J-', 'jobs');
    }
    if (collection === 'purchaseOrders' && !item.number) {
      item.number = this.getNextNumber('PO-', 'purchaseOrders');
    }
    if (collection === 'projects' && !item.number) {
      item.number = this.getNextNumber('PRJ-', 'projects');
    }
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    if (this.companyId) {
      item.companyId = this.companyId;
    }

    // 1. Update memory cache immediately for responsiveness (Optimistic UI)
    const items = [...(this.cache[collection] || [])];
    items.push(item);
    this.cache[collection] = items;
    this.emit(collection, items);

    // If not running in cloud mode, fall back to IndexedDB / Local Folder Sync
    if (!this.companyId || this.companyId.startsWith('acct_')) {
      if (this.folderSyncEnabled) {
        if (collection === 'documents' && item.url && item.url.startsWith('data:')) {
          this.writeDocumentFileToFolder(item.id, item.name, item.url).then(relPath => {
            if (relPath) {
              item.url = relPath;
              // Re-save in IndexedDB and rewrite folder collection with updated path
              this.writeRecordToIndexedDB(collection, item);
              this.writeCollectionToFolder(collection, this.cache[collection]);
            }
          });
        } else {
          this.writeCollectionToFolder(collection, this.cache[collection]);
        }
      }
      this.writeRecordToIndexedDB(collection, item).catch(err => {
        console.error(`Error saving ${collection} to IndexedDB:`, err);
      });
      return item;
    }

    // Special Case: Creating a user (technician) via UI requires a secure invitation Netlify function
    if (collection === 'technicians') {
      return (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Authentication session expired. Please log in again.');

          const companySlug = this.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const email = `${item.username.toLowerCase().trim()}@${companySlug}.relay.internal`;
          item.email = email;

          const { data, error: invokeError } = await supabase.functions.invoke('invite-user', {
            body: {
              action: 'create',
              email: item.email,
              username: item.username,
              password: item.password,
              name: item.name,
              role: item.role,
              userTypeId: item.userTypeId,
              color: item.color,
              payRate: item.payRate
            }
          });

          if (invokeError) {
            throw new Error(invokeError.message || JSON.stringify(invokeError));
          }
          if (!data || !data.success) {
            throw new Error(data?.error || 'Failed to create user.');
          }

          // Update local item ID with the real auth user UUID returned from database
          item.id = data.user.id;
          
          const cachedItems = [...this.cache.technicians];
          const idx = cachedItems.findIndex(x => x.username === item.username);
          if (idx !== -1) {
            cachedItems[idx] = item;
            this.cache.technicians = cachedItems;
            this.emit('technicians', cachedItems);
          }

          return item;
        } catch (err) {
          // Rollback cache update on failure
          this.cache.technicians = this.cache.technicians.filter(x => x.username !== item.username);
          this.emit('technicians', this.cache.technicians);
          throw err;
        }
      })();
    }

    // 2. Perform DB write in background for other collections
    const dbPayload = this.denormalizeRecord(item, collection);
    const table = TABLE_MAP[collection];
    if (table) {
      supabase.from(table).insert([dbPayload]).then(({ error }) => {
        if (error) {
          // Roll back the optimistic add so the UI matches the database
          this.cache[collection] = (this.cache[collection] || []).filter(x => x.id !== item.id);
          this.emit(collection, this.cache[collection]);
          this._notifyWriteError('save', collection, error);
        }
      });
    }

    return item;
  }

  update(collection, id, updates) {
    const items = [...(this.cache[collection] || [])];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const previous = items[index];

    // If not running in cloud mode, perform local cache update and write to IndexedDB / Folder Sync
    if (!this.companyId || this.companyId.startsWith('acct_')) {
      const updated = { ...previous, ...updates, updatedAt: new Date().toISOString() };
      items[index] = updated;
      this.cache[collection] = items;
      this.emit(collection, items);
      if (collection === 'jobs' && updates.status === 'Completed' && previous.status !== 'Completed') {
        this.handleJobCompletionSideEffects(updated, previous);
      }
      this.writeRecordToIndexedDB(collection, updated).catch(err => {
        console.error(`Error saving updated ${collection} to IndexedDB:`, err);
      });
      if (this.folderSyncEnabled) {
        this.writeCollectionToFolder(collection, this.cache[collection]);
      }
      return updated;
    }

    // Special Case: Updating a technician profile/password via UI
    if (collection === 'technicians') {
      return (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Authentication session expired. Please log in again.');

          const companySlug = this.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const username = updates.username || previous.username;
          const email = `${username.toLowerCase().trim()}@${companySlug}.relay.internal`;
          updates.email = email;

          if (updates.password) {
            updates.forcePasswordChange = true;
          }

          const { data, error: invokeError } = await supabase.functions.invoke('invite-user', {
            body: {
              action: 'update',
              userId: id,
              email: email,
              username: username,
              name: updates.name || previous.name,
              role: updates.role || previous.role,
              userTypeId: updates.userTypeId || previous.userTypeId,
              color: updates.color || previous.color,
              payRate: updates.payRate !== undefined ? updates.payRate : previous.payRate,
              password: updates.password
            }
          });

          if (invokeError) {
            throw new Error(invokeError.message || JSON.stringify(invokeError));
          }
          if (!data || !data.success) {
            throw new Error(data?.error || 'Failed to update user.');
          }

          const updated = { ...previous, ...updates, updatedAt: new Date().toISOString() };
          const cachedItems = [...this.cache.technicians];
          const idx = cachedItems.findIndex(x => x.id === id);
          if (idx !== -1) {
            cachedItems[idx] = updated;
            this.cache.technicians = cachedItems;
            this.emit('technicians', cachedItems);
          }
          return updated;
        } catch (err) {
          throw err;
        }
      })();
    }

    const updated = { ...previous, ...updates, updatedAt: new Date().toISOString() };
    
    // 1. Write to local cache synchronously
    items[index] = updated;
    this.cache[collection] = items;
    this.emit(collection, items);

    // 2. Trigger local maintenance plans / assets update engines if completing a job
    if (collection === 'jobs' && updates.status === 'Completed' && previous.status !== 'Completed') {
      this.handleJobCompletionSideEffects(updated, previous);
    }

    // 3. Write updates asynchronously to Supabase
    const dbPayload = this.denormalizeRecord(updated, collection);
    const table = TABLE_MAP[collection];
    if (table) {
      supabase
        .from(table)
        .update(dbPayload)
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            // Roll back to the previous version so the UI matches the database
            const arr = [...(this.cache[collection] || [])];
            const i = arr.findIndex(x => x.id === id);
            if (i !== -1) { arr[i] = previous; this.cache[collection] = arr; this.emit(collection, arr); }
            this._notifyWriteError('update', collection, error);
          }
        });
    }

    return updated;
  }

  delete(collection, id) {
    // 1. Update memory cache (keep a copy of the removed row for rollback)
    const removed = (this.cache[collection] || []).find(item => item.id === id);
    const items = (this.cache[collection] || []).filter(item => item.id !== id);
    this.cache[collection] = items;
    this.emit(collection, items);

    // If not running in cloud mode, fall back to IndexedDB / Folder Sync
    if (!this.companyId || this.companyId.startsWith('acct_')) {
      this.deleteRecordFromIndexedDB(collection, id).catch(err => {
        console.error(`Error deleting ${id} from ${collection} in IndexedDB:`, err);
      });
      if (this.folderSyncEnabled) {
        this.writeCollectionToFolder(collection, this.cache[collection]);
      }
      return;
    }

    // 2. Write to Supabase asynchronously
    const table = TABLE_MAP[collection];
    if (table) {
      supabase
        .from(table)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            // Restore the row we optimistically removed
            if (removed) { this.cache[collection] = [...(this.cache[collection] || []), removed]; this.emit(collection, this.cache[collection]); }
            this._notifyWriteError('delete', collection, error);
          }
        });
    }
  }

  // Handles completing job logs and maintenance intervals automatically
  async handleJobCompletionSideEffects(job, previousJob) {
    if (job.assetId) {
      const asset = this.getById('assets', job.assetId);
      if (asset) {
        const logs = asset.logs || [];
        const logText = `Completed Maintenance Job #${job.number} - ${job.title}`;
        const hasLog = logs.some(l => l.notes === logText);

        if (!hasLog) {
          logs.push({
            id: 'log_' + Date.now() + Math.random().toString(36).substr(2, 5),
            type: 'Service',
            date: new Date().toISOString().split('T')[0],
            meter: asset.currentMeter || 0,
            cost: (job.laborCost || 0) + (job.materialCost || 0),
            notes: logText,
            technicianName: job.technicianName || 'Unassigned',
            jobNumber: job.number
          });
          this.update('assets', asset.id, { logs });
        }

        const planIds = [job.maintenancePlanId, ...(job.mergedPlanIds || [])].filter(Boolean);
        if (planIds.length > 0) {
          planIds.forEach(pid => {
            const plan = this.getById('maintenancePlans', pid);
            if (plan) {
              if (plan.triggerType === 'Calendar') {
                const compDate = new Date();
                if (plan.frequency === 'Weekly') compDate.setDate(compDate.getDate() + 7);
                else if (plan.frequency === 'Monthly') compDate.setMonth(compDate.getMonth() + 1);
                else if (plan.frequency === 'Quarterly') compDate.setMonth(compDate.getMonth() + 3);
                else if (plan.frequency === 'Semi-Annually') compDate.setMonth(compDate.getMonth() + 6);
                else if (plan.frequency === 'Annually') compDate.setFullYear(compDate.getFullYear() + 1);
                
                this.update('maintenancePlans', plan.id, {
                  nextServiceDate: compDate.toISOString().split('T')[0]
                });
              } else if (plan.triggerType === 'Meter') {
                this.update('maintenancePlans', plan.id, {
                  lastTriggeredMeter: parseFloat(asset.currentMeter || 0)
                });
              }
            }
          });
        }
      }
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate the next sequential number for a collection.
   * Scans existing records, finds the highest numeric suffix, and returns prefix + (max+1) zero-padded to 5 digits.
   * e.g. getNextNumber('INV-', 'invoices') → 'INV-00001', 'INV-00002', ...
   */
  getNextNumber(defaultPrefix, collection) {
    const settings = this.getSettings();
    const dt = settings.documentTheme || {};
    
    let prefix = defaultPrefix;
    let startingNum = 1;

    if (collection === 'invoices') {
      prefix = dt.invoicePrefix !== undefined ? dt.invoicePrefix : 'INV-';
      startingNum = dt.invoiceStartingNumber !== undefined ? parseInt(dt.invoiceStartingNumber, 10) : 1;
      if (isNaN(startingNum)) startingNum = 1;
    } else if (collection === 'quotes') {
      prefix = dt.quotePrefix !== undefined ? dt.quotePrefix : 'Q-';
      startingNum = dt.quoteStartingNumber !== undefined ? parseInt(dt.quoteStartingNumber, 10) : 1;
      if (isNaN(startingNum)) startingNum = 1;
    }

    const items = this.getAll(collection) || [];
    let maxNum = startingNum - 1;

    items.forEach(item => {
      if (item.number && typeof item.number === 'string' && item.number.startsWith(prefix)) {
        const numStr = item.number.slice(prefix.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    return prefix + (maxNum + 1).toString().padStart(5, '0');
  }

  // ── Company Settings API ───────────────────────────────────────────────────

  getSettings() {
    const defaultSettings = {
      name: 'Company Name',
      abn: '',
      phone: '',
      domain: '',
      email: '',
      address: '',
      website: '',
      logo: defaultLogoLarge,
      logoSmall: defaultLogoSmall,
      markupPercent: 20,
      taxEnabled: true,
      taxRate: 10,
      materialMarkup: {
        defaultPercent: 30,
        minMarkupAmount: 5.00,
        useTiers: true,
        tiers: [
          { upTo: 50, percent: 60 },
          { upTo: 200, percent: 45 },
          { upTo: 1000, percent: 30 },
          { upTo: null, percent: 15 }
        ]
      },
      materialCategories: ['Consumables', 'Electrical', 'Plumbing', 'HVAC Parts', 'Fixings', 'General'],
      jobTypes: ['Electrical', 'Plumbing', 'HVAC', 'Fire Protection', 'Security', 'General Maintenance', 'Service', 'Project', 'Maintenance', 'Quote'],
      laborRates: [
        { id: 'rate_1', name: 'Standard Rate',    rate: 85.00,  description: 'Normal business hours Mon–Fri', overtimeMultiplier: 1.0,  minCallOutFee: 0, applicableDays: ['Mon','Tue','Wed','Thu','Fri'], activeHours: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33], isDefault: true  },
        { id: 'rate_2', name: 'After Hours Rate', rate: 127.50, description: 'Evenings and early mornings',      overtimeMultiplier: 1.5,  minCallOutFee: 45, applicableDays: ['Mon','Tue','Wed','Thu','Fri'], activeHours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,34,35,36,37,38,39,40,41,42,43,44,45,46,47], isDefault: false },
        { id: 'rate_3', name: 'Saturday Rate',    rate: 127.50, description: 'Saturday work',                   overtimeMultiplier: 1.5,  minCallOutFee: 65, applicableDays: ['Sat'], activeHours: Array.from({length:48}, (_,i)=>i), isDefault: false },
        { id: 'rate_4', name: 'Sunday Rate',      rate: 170.00, description: 'Sunday and public holidays',       overtimeMultiplier: 2.0,  minCallOutFee: 85, applicableDays: ['Sun','PH'], activeHours: Array.from({length:48}, (_,i)=>i), isDefault: false },
        { id: 'rate_5', name: 'Emergency Rate',   rate: 195.00, description: 'Urgent call-outs any day',        overtimeMultiplier: 2.0,  minCallOutFee: 120, applicableDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','PH'], activeHours: Array.from({length:48}, (_,i)=>i), isDefault: false },
      ],
      documentTheme: {
        preset: 'relay',
        accentColor: '#1B6DE0',
        headerBg: '#1E2A3A',
        accentTint: '#F8FAFC',
        fontFamily: 'sans-serif',
        invoiceTitle: 'TAX INVOICE',
        invoiceTerms: 'Please pay within 7 days of invoice issue.',
        invoicePaymentTerms: 'Payment via Direct Deposit:\nBSB: 123-456\nAccount: 78901234\nReference: [Invoice Number]',
        quoteTitle: 'PROPOSAL / QUOTE',
        quoteTerms: 'This quote is valid for 30 days. All work is subject to standard conditions.',
        logoAlignment: 'left',
        logoScale: 60,
        hideLogo: false,
        logoSource: 'large',
        paymentStripe: true,
        paymentDirectTransfer: true,
        paymentCash: false,
        quoteSignature: true,
        hideCompanyName: false,
        footerNote: 'Thank you for your business!',
        invoicePrefix: 'INV-',
        invoiceStartingNumber: 1,
        quotePrefix: 'Q-',
        quoteStartingNumber: 1
      },
      ai: {
        enabled: (this.companyId && !this.companyId.startsWith('acct_')) ? !!(typeof import.meta.env !== 'undefined' && (import.meta.env?.VITE_AI_API_KEY || import.meta.env?.VITE_DEEPSEEK_API_KEY)) : false,
        apiKey: (this.companyId && !this.companyId.startsWith('acct_')) ? (typeof import.meta.env !== 'undefined' ? (import.meta.env?.VITE_AI_API_KEY || import.meta.env?.VITE_DEEPSEEK_API_KEY || '') : '') : '',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        systemPrompt: 'You are Relay, an intelligent CRM co-pilot assistant. You help dispatchers manage jobs, quotes, invoices, and scheduling.'
      }
    };

    if (this.companySettings) {
      const merged = { ...defaultSettings, ...this.companySettings };
      // Fallback to default logos if user has not uploaded custom ones
      if (!merged.logo || merged.logo.includes('logo-large.png')) merged.logo = defaultLogoLarge;
      if (!merged.logoSmall) merged.logoSmall = defaultLogoSmall;
      if (!merged.jobTypes) merged.jobTypes = [...defaultSettings.jobTypes];
      // Ensure sub-objects merge safely
      merged.documentTheme = { ...defaultSettings.documentTheme, ...this.companySettings.documentTheme };
      merged.ai = { ...defaultSettings.ai, ...this.companySettings.ai };
      return merged;
    }

    return defaultSettings;
  }

  getTaxRate() {
    const settings = this.getSettings();
    if (settings.taxEnabled === false) return 0;
    const rate = settings.taxRate !== undefined ? Number(settings.taxRate) : 10;
    return rate / 100;
  }

  saveSettings(settings) {
    this.companySettings = settings;
    this.emit('settings', settings);

    if (!this.companyId || this.companyId.startsWith('acct_')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getStorageKey('settings'), JSON.stringify(settings));
      }
      return;
    }

    // Save settings directly into the company JSONB column and keep top-level name in sync
    supabase
      .from('companies')
      .update({ 
        settings,
        name: settings.name
      })
      .eq('id', this.companyId)
      .then(({ error }) => {
        if (error) console.error('Error saving company settings to Supabase:', error);
      });
  }

  // ── In-Memory Event Emitter ────────────────────────────────────────────────

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // ── Database Seeding operations (if tables are empty) ──────────────────────

  isSeeded() {
    if (this.companyId && !this.companyId.startsWith('acct_')) return true;
    return localStorage.getItem(this.getStorageKey('seeded')) === 'true';
  }

  save(collection, items) {
    const prev = this.cache[collection] || [];
    this.cache[collection] = items;
    this.emit(collection, items);

    // If not running in cloud mode, fall back to IndexedDB / Folder Sync
    if (!this.companyId || this.companyId.startsWith('acct_')) {
      const p = this.writeAllToIndexedDB(collection, items).catch(err => {
        console.error(`Error saving all items to ${collection} in IndexedDB:`, err);
      });
      if (this.folderSyncEnabled) {
        this.writeCollectionToFolder(collection, items);
      }
      return p;
    }

    // Cloud mode: persist the whole collection. Upsert every current row, then delete
    // any rows that were removed from the array. (Previously this only touched the
    // in-memory cache, so every save() — assign-tech, role edits, form templates,
    // portal edits, stock receiving, mark-read, etc. — silently failed to persist.)
    const table = TABLE_MAP[collection];
    if (!table) return; // cache-only collections (e.g. 'activity') have no table

    const payload = items
      .filter(it => it && it.id)
      .map(it => this.denormalizeRecord({ ...it, companyId: this.companyId }, collection));
    if (payload.length) {
      supabase.from(table).upsert(payload).then(({ error }) => {
        if (error) this._notifyWriteError('save', collection, error);
      });
    }

    const currentIds = new Set(items.map(it => it && it.id));
    const removedIds = prev.filter(p => p && p.id && !currentIds.has(p.id)).map(p => p.id);
    if (removedIds.length) {
      supabase.from(table).delete().in('id', removedIds).then(({ error }) => {
        if (error) this._notifyWriteError('save', collection, error);
      });
    }
  }

  markSeeded() {
    localStorage.setItem(this.getStorageKey('seeded'), 'true');
  }

  async seedFormTemplates() {
    if (!this.companyId) return;

    const templates = prebuiltForms.map(tmpl => ({
      ...tmpl,
      company_id: this.companyId
    }));

    this.cache.formTemplates = templates;
    this.emit('formTemplates', templates);

    if (this.companyId.startsWith('acct_')) {
      await this.writeAllToIndexedDB('formTemplates', templates);
      return;
    }

    const dbPayload = templates.map(t => this.denormalizeRecord(t, 'formTemplates'));
    const { error } = await supabase.from('form_templates').insert(dbPayload);
    if (error) console.error('Error seeding form templates:', error);
  }

  async seedDefaultUserTypes() {
    if (!this.companyId) return;

    const userTypes = [
      {
        id: `${this.companyId}_ut_admin`,
        name: 'Admin',
        description: 'Full system access',
        permissions: buildGranularPerms(() => true)
      },
      {
        id: `${this.companyId}_ut_manager`,
        name: 'Manager',
        description: 'Can manage most workflows but limited settings access',
        permissions: buildGranularPerms((mod, key) => {
          if (mod === 'Settings') return ['view', 'edit_company', 'manage_tax'].includes(key);
          return true;
        })
      },
      {
        id: `${this.companyId}_ut_tech`,
        name: 'Technician',
        description: 'Field staff — limited to their own jobs, schedule and timesheets',
        permissions: buildGranularPerms((mod, key) => {
          if (mod === 'Dashboard') return key === 'view';
          if (mod === 'Schedule') return ['view', 'view_own', 'edit'].includes(key);
          if (mod === 'Quotes') return ['view', 'create', 'edit', 'delete', 'approve', 'convert', 'generate_pdf'].includes(key);
          if (mod === 'Jobs') {
            return ['view', 'create', 'edit', 'delete', 'book_time', 'view_invoices_tab', 'create_invoice', 'manage_tasks', 'view_timesheets_tab', 'manage_materials'].includes(key);
          }
          if (mod === 'Invoices') return ['view', 'create', 'send', 'void'].includes(key);
          if (mod === 'Customers') return ['view', 'create', 'edit', 'delete', 'manage_contacts'].includes(key);
          if (mod === 'Assets') return ['view', 'create', 'edit', 'delete'].includes(key);
          if (mod === 'Stock') return ['view', 'create', 'edit', 'delete'].includes(key);
          if (mod === 'Purchase Orders') return ['view', 'create', 'approve'].includes(key);
          if (mod === 'Timesheets') return ['view_own', 'view', 'create', 'edit_all'].includes(key);
          if (mod === 'Settings') return ['view', 'edit_company'].includes(key);
          if (mod === 'Documents') return ['view', 'upload'].includes(key);
          return false;
        })
      },
      {
        id: `${this.companyId}_ut_office`,
        name: 'Office Staff',
        description: 'Admin / reception — can manage customers, quotes, invoices but not system settings',
        permissions: buildGranularPerms((mod, key) => {
          if (mod === 'Settings') return false;
          if (mod === 'Reports') return key === 'view';
          if (['Invoices', 'Purchase Orders', 'Suppliers'].includes(mod) && key === 'delete') return false;
          return true;
        })
      }
    ];

    this.cache.userTypes = userTypes;
    this.emit('userTypes', userTypes);

    if (this.companyId.startsWith('acct_')) {
      await this.writeAllToIndexedDB('userTypes', userTypes);
      return;
    }

    const dbPayload = userTypes.map(ut => this.denormalizeRecord({ ...ut, companyId: this.companyId }, 'userTypes'));
    const { error } = await supabase.from('user_types').insert(dbPayload);
    if (error) console.error('Error seeding default user types:', error);
  }

  async seedDefaultTechnicians() {
    const companyId = this.companyId;
    if (!companyId) return;
    const adminTypeId = companyId.startsWith('acct_') ? `${companyId}_ut_admin` : 'ut_admin';
    const managerTypeId = companyId.startsWith('acct_') ? `${companyId}_ut_manager` : 'ut_manager';
    const techTypeId = companyId.startsWith('acct_') ? `${companyId}_ut_tech` : 'ut_tech';
    const officeTypeId = companyId.startsWith('acct_') ? `${companyId}_ut_office` : 'ut_office';

    const defaultTechs = [
      { id: `${companyId}_tech_1`, name: 'Jake Morrow',  role: 'Senior Electrician',  color: '#3B82F6', userTypeId: adminTypeId,   payRate: 95.00,  email: 'jake@apexpowerservices.com.au',  phone: '0412 233 445', username: 'jake', password: '123456' },
      { id: `${companyId}_tech_2`, name: 'Ryan Holt',    role: 'Service Manager',     color: '#10B981', userTypeId: managerTypeId, payRate: 85.00,  email: 'ryan@apexpowerservices.com.au',  phone: '0423 344 556', username: 'ryan', password: '123456' },
      { id: `${companyId}_tech_3`, name: 'Sandra Okafor', role: 'Electrician',         color: '#8B5CF6', userTypeId: techTypeId,    payRate: 80.00,  email: 'sandra@apexpowerservices.com.au', phone: '0434 455 667', username: 'sandra', password: '123456' },
      { id: `${companyId}_tech_4`, name: 'Dean Caruso',   role: 'Office Administrator',color: '#F59E0B', userTypeId: officeTypeId,  payRate: 50.00,  email: 'dean@apexpowerservices.com.au',  phone: '0445 566 778', username: 'dean', password: '123456' }
    ];

    this.cache.technicians = defaultTechs;
    this.emit('technicians', defaultTechs);

    if (companyId.startsWith('acct_')) {
      await this.writeAllToIndexedDB('technicians', defaultTechs);
      if (this.folderSyncEnabled) {
        this.writeCollectionToFolder('technicians', defaultTechs).catch(err => {
          console.error('Error writing seeded technicians to local folder:', err);
        });
      }
      return;
    }

    const dbPayload = defaultTechs.map(t => this.denormalizeRecord({ ...t, companyId }, 'technicians'));
    const { error } = await supabase.from('technicians').insert(dbPayload);
    if (error) console.error('Error seeding default technicians:', error);
  }

  async migrateLocalToCloud(companyId, adminUserId) {
    this.companyId = companyId;
    this.userId = adminUserId;

    // 1. Update the remote company settings with local companySettings
    const currentSettings = this.getSettings();
    const { error: compErr } = await supabase.from('companies').update({
      abn: currentSettings.abn || '',
      phone: currentSettings.phone || '',
      domain: currentSettings.domain || '',
      email: currentSettings.email || '',
      address: currentSettings.address || '',
      settings: currentSettings
    }).eq('id', companyId);
    if (compErr) console.error('Error updating cloud company settings during migration:', compErr);

    // 2. Loop through all collections and push to Supabase
    // Skip 'companies' and 'technicians'
    const collectionsToMigrate = Object.keys(TABLE_MAP).filter(col => col !== 'companies' && col !== 'technicians');

    for (const col of collectionsToMigrate) {
      const items = this.cache[col] || [];
      if (items.length === 0) continue;

      const table = TABLE_MAP[col];
      if (!table) continue;

      // Assign the new cloud company_id and denormalize
      const payload = items.map(item => {
        const itemCopy = { ...item, companyId };
        return this.denormalizeRecord(itemCopy, col);
      });

      // Write to Supabase using upsert
      const { error } = await supabase.from(table).upsert(payload);
      if (error) {
        console.error(`Error migrating collection ${col}:`, error);
        throw new Error(`Failed to migrate ${col} data: ${error.message}`);
      }
    }

    // 3. Clear/close local DB connection and sync from Cloud
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = this.initializeCloudSync();
    await this.initPromise;
  }

  deleteLocalAccountData(accountId) {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      if (typeof localStorage !== 'undefined') {
        Object.keys(TABLE_MAP).forEach(col => {
          localStorage.removeItem(`relay_${accountId}_${col}`);
        });
        localStorage.removeItem(`relay_${accountId}_folder_sync_enabled`);
        localStorage.removeItem(`relay_${accountId}_seeded`);
        localStorage.removeItem(`relay_${accountId}_settings`);
      }
      if (typeof window !== 'undefined' && window.indexedDB) {
        const req = window.indexedDB.deleteDatabase(`RelayDispatchDB_${accountId}`);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => {
          console.warn('Database deletion blocked, resolving anyway');
          resolve();
        };
      } else {
        resolve();
      }
    });
  }

  async clearAll() {
    this.clearSync();
    if (!this.companyId || this.companyId.startsWith('acct_')) {
      const activeAccount = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('relay_active_account') : null;
      
      if (activeAccount) {
        await this.deleteLocalAccountData(activeAccount);
      } else {
        Object.keys(TABLE_MAP).forEach(col => {
          localStorage.removeItem('simpro_' + col);
        });
        localStorage.removeItem('simpro__seeded');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.getStorageKey('folder_sync_enabled'));
        }
        this.folderSyncEnabled = false;
        this.folderSyncPermissionGranted = false;
        this.dirHandle = null;
        try {
          await this.clearAllIndexedDB();
        } catch (err) {
          console.error('Error clearing IndexedDB:', err);
        }
      }
    }
  }
}

export const store = new DataStore();

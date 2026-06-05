// ============================================
// FIELDFORGE — CLOUD DATA STORE (Supabase Sync)
// ============================================
import { supabase } from '../utils/supabase.js';
import { prebuiltForms } from './prebuiltForms.js';

// Table name mappings to match local collection keys with PostgreSQL tables
const TABLE_MAP = {
  companies: 'companies',
  technicians: 'profiles',
  userTypes: 'user_types',
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
  documents: 'documents'
};

export const RELAY_LOGO_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg viewBox="0 0 320 53.598302" xmlns="http://www.w3.org/2000/svg"><g fill="#FF5C00"><g transform="translate(-19.023693,-210.20382)"><g transform="matrix(0.3804654,0,0,0.3804654,-83.598864,122.48096)"><g transform="translate(107.79013)"><g transform="translate(-22.948867,-9.0404629)"><path d="m 267.58275,347.28778 q 0.0535,9.78228 1.22947,17.15908 1.22947,7.3768 3.74185,11.27903 -2.40547,2.29856 -7.16298,3.42112 -4.7575,1.17601 -7.69753,1.17601 -9.515,-0.10691 -13.31031,-7.10952 -3.31422,-6.20079 -3.31422,-15.92962 0,-1.28292 0.26728,-7.64407 0.26728,-6.41461 3.52803,-20.04566 3.26076,-13.63104 7.80445,-26.94136 4.54368,-13.31031 8.87354,-23.94787 1.22947,-0.10691 2.45893,-0.10691 2.56585,0 5.39897,0.58801 2.83311,0.588 4.32986,4.16949 0.69491,1.65711 0.69491,4.38332 0,3.15385 -0.90873,7.64407 -2.19166,10.26338 -3.63495,20.63366 1.28292,0.64147 2.72621,0.64147 2.88657,0 7.3768,-3.1004 4.49023,-3.10039 8.49936,-9.62191 3.79531,-6.09388 3.79531,-12.34813 v -0.80182 q -1.12256,-11.33248 -7.69753,-14.80706 -3.74186,-1.97784 -8.44591,-1.97784 -3.58149,0 -10.47719,1.87093 -6.84225,1.81747 -16.94526,8.71318 -10.04955,6.8957 -18.17473,16.3038 -8.07171,9.35464 -11.6532,19.5111 -1.92439,5.29205 -1.92439,10.31683 0,4.54368 1.60366,8.87354 -5.66624,0.96219 -10.37029,0.96219 -6.41461,0 -12.82922,-2.40547 -6.36115,-2.45894 -9.14081,-9.03391 -1.33638,-3.26076 -1.33638,-6.89571 0,-3.6884 1.38983,-7.80444 4.00913,-10.53065 18.01436,-22.07694 14.05869,-11.59976 34.05089,-20.36639 20.04565,-8.76663 42.06914,-10.90484 2.56584,-0.16036 4.97132,-0.16036 11.38593,0 19.77838,4.59714 8.4459,4.59713 12.6154,13.47068 3.84877,8.07171 3.84877,17.42635 0,0.80183 -0.21382,6.36116 -0.16037,5.55932 -4.49023,14.91396 -4.32986,9.30119 -12.1343,15.34161 -7.80444,6.04042 -18.49546,6.46806 8.87354,6.41461 19.5111,7.10953 1.17601,0.0534 2.35203,0.0534 9.67537,0 20.90093,-5.07823 0.26728,3.79531 0.26728,7.10953 0,9.0339 -2.35203,16.14343 -2.35202,7.10952 -7.32334,10.90484 -4.97132,3.79531 -10.63756,4.49022 -2.13821,0.26728 -4.11604,0.26728 -3.42113,0 -6.46807,-0.74837 -5.8266,-1.38984 -11.38593,-6.20079 -5.50587,-4.7575 -10.47719,-11.65321 -4.91787,-6.8957 -8.98046,-14.59324 z" /><path d="m 370.43971,354.90523 -15.22212,-9.62244 -16.8901,6.24731 4.44762,-17.45058 -11.16089,-14.13291 17.97088,-1.16261 9.9923,-14.98194 6.659,16.73206 17.33647,4.87357 -13.85539,11.50358 z" /><path d="m 348.39147,304.71497 -3.17554,-13.39823 -12.4452,-5.89179 11.76117,-7.16041 1.75766,-13.65677 10.44434,8.97286 13.53148,-2.54853 -5.30619,12.70593 6.60527,12.08167 -13.72376,-1.12015 z" /><path d="m 334.8158,263.90614 -5.7247,-6.06772 -8.31437,0.67863 4.00173,-7.31954 -3.21471,-7.6977 8.19789,1.544 6.32758,-5.43609 1.06484,8.27379 7.12538,4.33803 -7.53978,3.56946 z" /></g><text x="90" y="35" fill="#FF5C00" font-family="'Inter', -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="0.05em">RELAY</text><text x="180" y="35" fill="#8A99AD" font-family="'Inter', -apple-system, sans-serif" font-size="24" font-weight="500" letter-spacing="0.03em">— Dispatch</text></svg>`)}`;

export const RELAY_LOGO_SMALL_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg viewBox="0 0 75.592812 53.598302" xmlns="http://www.w3.org/2000/svg"><g fill="#FF5C00"><g transform="translate(-19.023693,-210.20382)"><g transform="matrix(0.3804654,0,0,0.3804654,-83.598864,122.48096)"><g transform="translate(107.79013)"><g transform="translate(-22.948867,-9.0404629)"><path d="m 267.58275,347.28778 q 0.0535,9.78228 1.22947,17.15908 1.22947,7.3768 3.74185,11.27903 -2.40547,2.29856 -7.16298,3.42112 -4.7575,1.17601 -7.69753,1.17601 -9.515,-0.10691 -13.31031,-7.10952 -3.31422,-6.20079 -3.31422,-15.92962 0,-1.28292 0.26728,-7.64407 q 0.26728,-6.41461 3.52803,-20.04566 q 3.26076,-13.63104 7.80445,-26.94136 q 4.54368,-13.31031 8.87354,-23.94787 q 1.22947,-0.10691 2.45893,-0.10691 q 2.56585,0 5.39897,0.58801 q 2.83311,0.588 4.32986,4.16949 q 0.69491,1.65711 0.69491,4.38332 0,3.15385 -0.90873,7.64407 -2.19166,10.26338 -3.63495,20.63366 q 1.28292,0.64147 2.72621,0.64147 q 2.88657,0 7.3768,-3.1004 q 4.49023,-3.10039 8.49936,-9.62191 q 3.79531,-6.09388 3.79531,-12.34813 v -0.80182 q -1.12256,-11.33248 -7.69753,-14.80706 -3.74186,-1.97784 -8.44591,-1.97784 -3.58149,0 -10.47719,1.87093 q -6.84225,1.81747 -16.94526,8.71318 q -10.04955,6.8957 -18.17473,16.3038 q -8.07171,9.35464 -11.6532,19.5111 -1.92439,5.29205 -1.92439,10.31683 0,4.54368 1.60366,8.87354 -5.66624,0.96219 -10.37029,0.96219 -6.41461,0 -12.82922,-2.40547 -6.36115,-2.45894 -9.14081,-9.03391 -1.33638,-3.26076 -1.33638,-6.89571 0,-3.6884 1.38983,-7.80444 q 4.00913,-10.53065 18.01436,-22.07694 q 14.05869,-11.59976 34.05089,-20.36639 q 20.04565,-8.76663 42.06914,-10.90484 q 2.56584,-0.16036 4.97132,-0.16036 q 11.38593,0 19.77838,4.59714 q 8.4459,4.59713 12.6154,13.47068 q 3.84877,8.07171 3.84877,17.42635 0,0.80183 -0.21382,6.36116 -0.16037,5.55932 -4.49023,14.91396 q -4.32986,9.30119 -12.1343,15.34161 -7.80444,6.04042 -18.49546,6.46806 q 8.87354,6.41461 19.5111,7.10953 q 1.17601,0.0534 2.35203,0.0534 9.67537,0 20.90093,-5.07823 0.26728,3.79531 0.26728,7.10953 0,9.0339 -2.35203,16.14343 q -2.35202,7.10952 -7.32334,10.90484 -4.97132,3.79531 -10.63756,4.49022 -2.13821,0.26728 -4.11604,0.26728 -3.42113,0 -6.46807,-0.74837 -5.8266,-1.38984 -11.38593,-6.20079 q -5.50587,-4.7575 -10.47719,-11.65321 q -4.91787,-6.8957 -8.98046,-14.59324 z" /><path d="m 370.43971,354.90523 -15.22212,-9.62244 -16.8901,6.24731 4.44762,-17.45058 -11.16089,-14.13291 17.97088,-1.16261 9.9923,-14.98194 6.659,16.73206 17.33647,4.87357 -13.85539,11.50358 z" /><path d="m 348.39147,304.71497 -3.17554,-13.39823 -12.4452,-5.89179 11.76117,-7.16041 1.75766,-13.65677 10.44434,8.97286 13.53148,-2.54853 -5.30619,12.70593 6.60527,12.08167 -13.72376,-1.12015 z" /><path d="m 334.8158,263.90614 -5.7247,-6.06772 -8.31437,0.67863 4.00173,-7.31954 -3.21471,-7.6977 8.19789,1.544 6.32758,-5.43609 1.06484,8.27379 7.12538,4.33803 -7.53978,3.56946 z" /></g></g></g></svg>`)}`;

class DataStore {
  constructor() {
    this.listeners = {};
    this.cache = {};
    this.companySettings = null;
    this.companyId = null;
    this.userId = null;
    this.subscriptions = [];
    this.initPromise = null;

    // Pre-initialize empty arrays for collections to avoid undefined maps on startup
    Object.keys(TABLE_MAP).forEach(col => {
      this.cache[col] = [];
    });

    // Handle authentication state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.userId = session.user.id;
        const userMeta = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.companyId = userMeta.companyId || null;
        if (this.companyId) {
          this.initPromise = this.initializeCloudSync();
        }
      } else {
        this.clearSync();
      }
    });

    // Auto-trigger sync if user already logged in at boot
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.companyId) {
      this.userId = currentUser.id;
      this.companyId = currentUser.companyId;
      this.initPromise = this.initializeCloudSync();
    }
  }

  // Fetch all tenant data into memory cache and subscribe to real-time updates
  async initializeCloudSync() {
    if (!this.companyId) return;

    try {
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
        
        // Scope queries by company_id (except for profiles where we fetch tenant users)
        if (table !== 'profiles') {
          query = query.eq('company_id', this.companyId);
        }

        const { data, error } = await query;
        if (!error && data) {
          // Normalize snake_case column names back to camelCase for the frontend
          this.cache[col] = this.normalizeData(data, col);
        }
      });

      await Promise.all(promises);

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

    const channel = supabase
      .channel('table-db-changes')
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

    return record;
  }

  // De-normalize camelCase fields -> snake_case schema columns for database updates
  denormalizeRecord(item) {
    const record = { ...item };

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

    return record;
  }

  // Legacy compatibility / No-op migration call
  migrateNumberFields() {}

  // ── Local-First Core API Operations ────────────────────────────────────────

  getAll(collection) {
    return this.cache[collection] || [];
  }

  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  // Pushes write changes asynchronously to Supabase while updating local cache synchronously
  async create(collection, item) {
    if (!this.companyId) return item;

    item.id = item.id || this.generateId();
    if (collection === 'leads' && !item.number) {
      item.number = 'LD-' + Date.now().toString().slice(-5);
    }
    if (collection === 'notifications' && !item.number) {
      item.number = 'NT-' + Date.now().toString().slice(-5);
    }
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    item.companyId = this.companyId;

    // 1. Update memory cache immediately for responsiveness (Optimistic UI)
    const items = [...(this.cache[collection] || [])];
    items.push(item);
    this.cache[collection] = items;
    this.emit(collection, items);

    // Special Case: Creating a user (technician) via UI requires a secure invitation Netlify function
    if (collection === 'technicians') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Authentication session expired. Please log in again.');

        const companySlug = this.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${item.username.toLowerCase().trim()}@${companySlug}.fieldforge.internal`;
        item.email = email;

        const res = await fetch('/.netlify/functions/invite-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'create',
            email: item.email,
            username: item.username,
            password: item.password,
            name: item.name,
            role: item.role,
            userTypeId: item.userTypeId,
            color: item.color,
            payRate: item.payRate
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create user.');
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
    }

    // 2. Perform DB write in background for other collections
    const dbPayload = this.denormalizeRecord(item);
    const table = TABLE_MAP[collection];
    if (table) {
      const { error } = await supabase.from(table).insert([dbPayload]);
      if (error) console.error(`Error saving new record to ${table}:`, error);
    }

    return item;
  }

  async update(collection, id, updates) {
    if (!this.companyId) return null;

    const items = [...(this.cache[collection] || [])];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const previous = items[index];

    // Special Case: Updating a technician profile/password via UI
    if (collection === 'technicians') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Authentication session expired. Please log in again.');

        const companySlug = this.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const username = updates.username || previous.username;
        const email = `${username.toLowerCase().trim()}@${companySlug}.fieldforge.internal`;
        updates.email = email;

        if (updates.password) {
          updates.forcePasswordChange = true;
        }

        const res = await fetch('/.netlify/functions/invite-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
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
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update user.');
        }
      } catch (err) {
        throw err;
      }
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
    const dbPayload = this.denormalizeRecord(updated);
    const table = TABLE_MAP[collection];
    if (table) {
      const { error } = await supabase
        .from(table)
        .update(dbPayload)
        .eq('id', id);
      if (error) console.error(`Error updating record in ${table}:`, error);
    }

    return updated;
  }

  async delete(collection, id) {
    if (!this.companyId) return;

    // 1. Update memory cache
    const items = (this.cache[collection] || []).filter(item => item.id !== id);
    this.cache[collection] = items;
    this.emit(collection, items);

    // 2. Write to Supabase asynchronously
    const table = TABLE_MAP[collection];
    if (table) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) console.error(`Error deleting record from ${table}:`, error);
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
      logo: RELAY_LOGO_SVG,
      logoSmall: RELAY_LOGO_SMALL_SVG,
      markupPercent: 20,
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
        paymentStripe: true,
        paymentDirectTransfer: true,
        paymentCash: false,
        quoteSignature: true,
        footerNote: 'Thank you for your business!'
      }
    };

    if (this.companySettings) {
      const merged = { ...defaultSettings, ...this.companySettings };
      // Fallback to default RELAY logos if user has not uploaded custom ones
      if (!merged.logo) merged.logo = RELAY_LOGO_SVG;
      if (!merged.logoSmall) merged.logoSmall = RELAY_LOGO_SMALL_SVG;
      // Ensure sub-objects merge safely
      merged.documentTheme = { ...defaultSettings.documentTheme, ...this.companySettings.documentTheme };
      return merged;
    }
    return defaultSettings;
  }

  async saveSettings(settings) {
    if (!this.companyId) return;

    this.companySettings = settings;
    this.emit('settings', settings);

    // Save settings directly into the company JSONB column and keep top-level name in sync
    const { error } = await supabase
      .from('companies')
      .update({ 
        settings,
        name: settings.name
      })
      .eq('id', this.companyId);

    if (error) console.error('Error saving company settings to Supabase:', error);
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
    if (this.companyId) return true;
    return localStorage.getItem('simpro__seeded') === 'true';
  }

  save(collection, items) {
    this.cache[collection] = items;
    this.emit(collection, items);
    
    // If not running in cloud mode, fall back to localStorage to support the offline demo users list
    if (!this.companyId) {
      localStorage.setItem('simpro_' + collection, JSON.stringify(items));
    }
  }

  markSeeded() {
    localStorage.setItem('simpro__seeded', 'true');
  }

  async seedFormTemplates() {
    if (!this.companyId) return;

    const templates = prebuiltForms.map(tmpl => ({
      ...tmpl,
      company_id: this.companyId
    }));

    this.cache.formTemplates = templates;
    this.emit('formTemplates', templates);

    const dbPayload = templates.map(t => this.denormalizeRecord(t));
    const { error } = await supabase.from('form_templates').insert(dbPayload);
    if (error) console.error('Error seeding form templates:', error);
  }

  clearAll() {
    this.clearSync();
    if (!this.companyId) {
      Object.keys(TABLE_MAP).forEach(col => {
        localStorage.removeItem('simpro_' + col);
      });
      localStorage.removeItem('simpro__seeded');
    }
  }
}

export const store = new DataStore();

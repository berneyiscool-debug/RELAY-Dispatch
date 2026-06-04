// ============================================
// FIELDFORGE — CLOUD DATA STORE (Supabase Sync)
// ============================================
import { supabase } from '../utils/supabase.js';
import { prebuiltForms } from './prebuiltForms.js';

// Table name mappings to match local collection keys with PostgreSQL tables
const TABLE_MAP = {
  companies: 'companies',
  profiles: 'profiles',
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
        this.companySettings = comp.settings || {};
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

        const items = [...this.cache[col]];
        
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

    // 1. Update memory cache immediately for responsiveness
    const items = [...this.cache[collection]];
    items.push(item);
    this.cache[collection] = items;
    this.emit(collection, items);

    // 2. Perform DB write in background
    const dbPayload = this.denormalizeRecord(item);
    const table = TABLE_MAP[collection];
    if (table) {
      // Profiles are keyed to auth.users, and userTypes requires specific IDs
      const { error } = await supabase.from(table).insert([dbPayload]);
      if (error) console.error(`Error saving new record to ${table}:`, error);
    }

    return item;
  }

  async update(collection, id, updates) {
    if (!this.companyId) return null;

    const items = [...this.cache[collection]];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const previous = items[index];
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
    const items = this.cache[collection].filter(item => item.id !== id);
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
      name: 'Apex Power Services',
      abn: '51 234 567 890',
      phone: '(02) 6882 4400',
      domain: 'apexpowerservices.com.au',
      email: 'admin@apexpowerservices.com.au',
      address: '14 Yarrandale Rd, Dubbo NSW 2830',
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

    // Save settings directly into the company JSONB column
    const { error } = await supabase
      .from('companies')
      .update({ settings })
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
    return this.cache.formTemplates.length > 0;
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
  }
}

export const store = new DataStore();

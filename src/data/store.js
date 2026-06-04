// ============================================
// FIELDFORGE — DATA STORE (localStorage)
// ============================================
import { prebuiltForms } from './prebuiltForms.js';

// Legacy prefix kept to prevent data loss during rebranding
const STORE_PREFIX = 'simpro_';

class DataStore {
  constructor() {
    this.listeners = {};
    this.migrateNumberFields();
  }

  migrateNumberFields() {
    // Migrate leads
    try {
      const leads = this.getAll('leads');
      let leadsUpdated = false;
      leads.forEach((l, idx) => {
        if (!l.number) {
          l.number = 'LD-' + (idx + 1).toString().padStart(5, '0');
          leadsUpdated = true;
        }
      });
      if (leadsUpdated) {
        this.save('leads', leads);
      }
    } catch (e) {
      console.error('Error migrating leads numbers:', e);
    }

    // Migrate notifications
    try {
      const notifications = this.getAll('notifications');
      let notifsUpdated = false;
      notifications.forEach((n, idx) => {
        if (!n.number) {
          n.number = 'NT-' + (idx + 1).toString().padStart(5, '0');
          notifsUpdated = true;
        }
      });
      if (notifsUpdated) {
        this.save('notifications', notifications);
      }
    } catch (e) {
      console.error('Error migrating notifications numbers:', e);
    }
  }

  _key(collection) {
    return STORE_PREFIX + collection;
  }

  getAll(collection) {
    try {
      const data = localStorage.getItem(this._key(collection));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  save(collection, items) {
    localStorage.setItem(this._key(collection), JSON.stringify(items));
    this.emit(collection, items);
  }

  create(collection, item) {
    const items = this.getAll(collection);
    
    if (collection === 'notifications') {
      const isDuplicate = items.some(existing => {
        if (existing.message === item.message && existing.link === item.link && existing.title === item.title) {
          return true;
        }
        if (item.jobId && existing.jobId === item.jobId && existing.type === item.type) {
          const d1 = existing.dueDate || (existing.createdAt ? new Date(existing.createdAt).toDateString() : '');
          const d2 = item.dueDate || (item.createdAt ? new Date(item.createdAt).toDateString() : new Date().toDateString());
          if (d1 === d2) return true;
        }
        return false;
      });
      if (isDuplicate) {
        return items.find(existing => {
          if (existing.message === item.message && existing.link === item.link && existing.title === item.title) return true;
          if (item.jobId && existing.jobId === item.jobId && existing.type === item.type) {
            const d1 = existing.dueDate || (existing.createdAt ? new Date(existing.createdAt).toDateString() : '');
            const d2 = item.dueDate || (item.createdAt ? new Date(item.createdAt).toDateString() : new Date().toDateString());
            if (d1 === d2) return true;
          }
          return false;
        }) || item;
      }
    }

    item.id = item.id || this.generateId();
    if (collection === 'leads' && !item.number) {
      item.number = 'LD-' + Date.now().toString().slice(-5);
    }
    if (collection === 'notifications' && !item.number) {
      item.number = 'NT-' + Date.now().toString().slice(-5);
    }
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    items.push(item);
    this.save(collection, items);
    return item;
  }

  update(collection, id, updates) {
    const items = this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    const previous = items[index];
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.save(collection, items);

    // Post-save trigger: Asset Maintenance Logs Sync & Timer Synchronization
    if (collection === 'jobs' && updates.status === 'Completed' && previous.status !== 'Completed') {
      const job = items[index];
      if (job.assetId) {
        const assets = this.getAll('assets');
        const assetIndex = assets.findIndex(a => a.id === job.assetId);
        if (assetIndex !== -1) {
          const asset = assets[assetIndex];
          const logs = asset.logs || [];
          
          // Double check we haven't already posted a log for this specific job.number
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
            asset.logs = logs;
            this.save('assets', assets);
          }

          // Advanced Scheduling Synchronization: Align all involved plan timers/milestones in sync
          const planIds = [job.maintenancePlanId, ...(job.mergedPlanIds || [])].filter(Boolean);
          if (planIds.length > 0) {
            const plans = this.getAll('maintenancePlans') || [];
            let plansUpdated = false;

            planIds.forEach(pid => {
              const planIndex = plans.findIndex(p => p.id === pid);
              if (planIndex !== -1) {
                const plan = plans[planIndex];
                
                if (plan.triggerType === 'Calendar') {
                  const compDate = new Date();
                  if (plan.frequency === 'Weekly') {
                    compDate.setDate(compDate.getDate() + 7);
                  } else if (plan.frequency === 'Monthly') {
                    compDate.setMonth(compDate.getMonth() + 1);
                  } else if (plan.frequency === 'Quarterly') {
                    compDate.setMonth(compDate.getMonth() + 3);
                  } else if (plan.frequency === 'Semi-Annually') {
                    compDate.setMonth(compDate.getMonth() + 6);
                  } else if (plan.frequency === 'Annually') {
                    compDate.setFullYear(compDate.getFullYear() + 1);
                  }
                  plan.nextServiceDate = compDate.toISOString().split('T')[0];
                  plansUpdated = true;
                } else if (plan.triggerType === 'Meter') {
                  plan.lastTriggeredMeter = parseFloat(asset.currentMeter || 0);
                  plansUpdated = true;
                }
              }
            });

            if (plansUpdated) {
              this.save('maintenancePlans', plans);
            }
          }
        }
      }
    }

    return items[index];
  }

  delete(collection, id) {
    const items = this.getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    this.save(collection, filtered);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getSettings() {
    const defaultSettings = {
      name: 'Apex Power Services',
      abn: '51 234 567 890',
      phone: '(02) 6882 4400',
      domain: 'apexpowerservices.com.au',
      email: 'admin@apexpowerservices.com.au',
      address: '14 Yarrandale Rd, Dubbo NSW 2830',
      markupPercent: 20, // Legacy support
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

    try {
      const data = localStorage.getItem(this._key('settings'));
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.documentTheme) {
          parsed.documentTheme = { ...defaultSettings.documentTheme };
        } else {
          parsed.documentTheme = { ...defaultSettings.documentTheme, ...parsed.documentTheme };
        }
        return parsed;
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  saveSettings(settings) {
    localStorage.setItem(this._key('settings'), JSON.stringify(settings));
    this.emit('settings', settings);
  }

  // Simple event emitter for reactivity
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

  isSeeded() {
    return localStorage.getItem(STORE_PREFIX + '_seeded') === 'true';
  }

  markSeeded() {
    localStorage.setItem(STORE_PREFIX + '_seeded', 'true');
  }

  clearAll() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }

  seedFormTemplates() {
    const existing = this.getAll('formTemplates');
    if (existing.length === 0) {
      this.save('formTemplates', prebuiltForms);
    }
  }
}

export const store = new DataStore();
store.seedFormTemplates();

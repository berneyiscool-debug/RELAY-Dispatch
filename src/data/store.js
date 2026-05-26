// ============================================
// FIELDFORGE — DATA STORE (localStorage)
// ============================================
import { prebuiltForms } from './prebuiltForms.js';

// Legacy prefix kept to prevent data loss during rebranding
const STORE_PREFIX = 'simpro_';

class DataStore {
  constructor() {
    this.listeners = {};
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
    item.id = item.id || this.generateId();
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
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.save(collection, items);
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
        { id: 'rate_1', name: 'Standard Rate',    rate: 85.00,  description: 'Normal business hours Mon–Fri', overtimeMultiplier: 1.0,  minCallOutFee: 0, applicableDays: ['Mon','Tue','Wed','Thu','Fri'], isDefault: true  },
        { id: 'rate_2', name: 'After Hours Rate', rate: 127.50, description: 'Evenings and early mornings',      overtimeMultiplier: 1.5,  minCallOutFee: 45, applicableDays: ['Mon','Tue','Wed','Thu','Fri'], isDefault: false },
        { id: 'rate_3', name: 'Saturday Rate',    rate: 127.50, description: 'Saturday work',                   overtimeMultiplier: 1.5,  minCallOutFee: 65, applicableDays: ['Sat'],                        isDefault: false },
        { id: 'rate_4', name: 'Sunday Rate',      rate: 170.00, description: 'Sunday and public holidays',       overtimeMultiplier: 2.0,  minCallOutFee: 85, applicableDays: ['Sun','PH'],                   isDefault: false },
        { id: 'rate_5', name: 'Emergency Rate',   rate: 195.00, description: 'Urgent call-outs any day',        overtimeMultiplier: 2.0,  minCallOutFee: 120, applicableDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','PH'], isDefault: false },
      ]
    };

    try {
      const data = localStorage.getItem(this._key('settings'));
      return data ? JSON.parse(data) : defaultSettings;
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

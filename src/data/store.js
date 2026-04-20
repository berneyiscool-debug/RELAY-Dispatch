// ============================================
// SIMPRO CLONE — DATA STORE (localStorage)
// ============================================

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
    try {
      const data = localStorage.getItem(this._key('settings'));
      return data ? JSON.parse(data) : {
        markupPercent: 20,
        laborRates: [
          { id: 'rate_1', name: 'Standard Rate', rate: 85.00 },
          { id: 'rate_2', name: 'After Hours Rate', rate: 127.50 },
          { id: 'rate_3', name: 'Emergency Rate', rate: 170.00 }
        ]
      };
    } catch {
      return { markupPercent: 20, laborRates: [] };
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
}

export const store = new DataStore();

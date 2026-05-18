import { store } from './src/data/store.js';
import { seedData } from './src/data/seed.js';
import { renderScheduleView } from './src/pages/schedule/ScheduleView.js';
import { JSDOM } from 'jsdom';

// Setup mock for localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => mockStorage[key] = val,
  removeItem: (key) => delete mockStorage[key]
};
global.window = {
  sessionStorage: {
    getItem: () => JSON.stringify({ id: '1', name: 'Test' }),
    setItem: () => { }
  },
  confirm: () => true,
  alert: console.log
};
const dom = new JSDOM(`<!DOCTYPE html><div id="app"><div id="toast-container"></div></div>`);
global.document = dom.window.document;

seedData();
// Unschedule all jobs to avoid confusion
store.getAll('jobs').forEach(j => {
  store.update('jobs', j.id, { scheduledDate: null, technicianId: null });
});

const container = document.getElementById('app');

// Simulate the logic change inside ScheduleView.js
// i.e., what if we re-fetch `jobs` dynamically? Let's write a small implementation of it.

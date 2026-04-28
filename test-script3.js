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
    setItem: () => {}
  },
  confirm: () => true
};
const dom = new JSDOM(`<!DOCTYPE html><div id="app"></div>`);
global.document = dom.window.document;

seedData();

const jobs = store.getAll('jobs');
console.log("Total jobs:", jobs.length);
console.log("Unscheduled jobs count:", jobs.filter(j => !j.scheduledDate).length);

// Let's force an unscheduled job
store.update('jobs', jobs[0].id, { scheduledDate: null, technicianId: null });

const container = document.getElementById('app');
renderScheduleView(container);

const unscheduledJob = document.querySelector('.unscheduled-job');
console.log("First unscheduled job in DOM:", !!unscheduledJob);

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

const jobs1 = store.getAll('jobs');
const job1 = jobs1[0]; // Just grab first job
store.update('jobs', job1.id, { scheduledDate: null }); // Force unscheduled

const container = document.getElementById('app');
renderScheduleView(container);

const jobs = store.getAll('jobs');
const job = jobs.find(j => !j.scheduledDate);

// Find elements
const unscheduledJob = document.querySelector(`.unscheduled-job[data-job-id="${job.id}"]`);
const dayCol = document.querySelector('.schedule-day-col');

console.log("Found unscheduled job elem:", !!unscheduledJob);
console.log("Found dayCol elem:", !!dayCol);

if (unscheduledJob && dayCol) {
  // Simulate drag
  const dragStartEvent = new dom.window.Event('dragstart', { bubbles: true });
  dragStartEvent.dataTransfer = { effectAllowed: 'none', setData: () => {} };
  unscheduledJob.dispatchEvent(dragStartEvent);

  const dropEvent = new dom.window.Event('drop', { bubbles: true });
  dropEvent.dataTransfer = { getData: () => {} };
  dropEvent.clientY = 100;
  // Let's set getBoundingClientRect on dayCol
  dayCol.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 100 });
  dayCol.dispatchEvent(dropEvent);

  // Check if it's rendered in the blocks
  const scheduledBlock = document.querySelector(`.schedule-block[data-block-job-id="${job.id}"]`);
  console.log("Scheduled block found after drop:", !!scheduledBlock);
}

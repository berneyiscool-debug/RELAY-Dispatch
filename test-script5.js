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
  confirm: () => true,
  alert: console.log
};
const dom = new JSDOM(`<!DOCTYPE html><div id="app"><div id="toast-container"></div></div>`);
global.document = dom.window.document;

seedData();
const allJobs = store.getAll('jobs');
store.update('jobs', allJobs[0].id, { scheduledDate: null, technicianId: null });

const container = document.getElementById('app');
renderScheduleView(container);

const unscheduledJob = document.querySelector('.unscheduled-job');
const dayCol = document.querySelector('.schedule-day-col');

if (unscheduledJob && dayCol) {
  const dragStartEvent = new dom.window.Event('dragstart', { bubbles: true });
  dragStartEvent.dataTransfer = { effectAllowed: 'none', setData: () => {} };
  unscheduledJob.dispatchEvent(dragStartEvent);

  const dropEvent = new dom.window.Event('drop', { bubbles: true });
  dropEvent.dataTransfer = { getData: () => {} };
  dropEvent.clientY = 100;

  dayCol.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 100 });
  dayCol.dispatchEvent(dropEvent);

  const updatedJobs = store.getAll('jobs');
  const updatedJob = updatedJobs.find(j => j.id === unscheduledJob.dataset.jobId);
  console.log("Job status after drag:", updatedJob.scheduledDate, updatedJob.technicianId);

  const blockAfterRender = document.querySelector(`.schedule-block[data-block-job-id="${updatedJob.id}"]`);
  console.log("Block rendered after update?:", !!blockAfterRender);
}

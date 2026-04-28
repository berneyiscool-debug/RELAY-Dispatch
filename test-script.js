import { store } from './src/data/store.js';
import { seedData } from './src/data/seed.js';

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

seedData();

const jobs = store.getAll('jobs');
const job = jobs[0]; // Let's just grab the first job
store.update('jobs', job.id, { scheduledDate: null }); // Force it unscheduled

console.log("Found unscheduled job:", job.id);

let newTechs = job.technicians || [];
const targetTechId = 'tech-1';
const tech = { name: 'John Doe' };
const duration = 2;

if (!newTechs.find(t => t.id === targetTechId)) {
  newTechs = [{ id: targetTechId, name: tech?.name || '', hours: duration, rate: 85 }];
}

const targetDay = new Date();
const pad = n => n.toString().padStart(2, '0');
const localDateStr = `${targetDay.getFullYear()}-${pad(targetDay.getMonth() + 1)}-${pad(targetDay.getDate())}`;

console.log("Updating job with date:", localDateStr);

store.update('jobs', job.id, {
  technicianId: targetTechId,
  technicianName: tech?.name || '',
  technicians: newTechs,
  scheduledDate: localDateStr,
  startHour: 9,
  status: job.status === 'Pending' ? 'Scheduled' : job.status,
});

const updatedJob = store.getById('jobs', job.id);
console.log("Updated job scheduledDate:", updatedJob.scheduledDate);
console.log("Updated job tech ID:", updatedJob.technicianId);

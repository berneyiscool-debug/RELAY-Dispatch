import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { JSDOM } from 'jsdom';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const companyId = '8dc14565-23c2-4f7d-aeb3-1da615df7644';

// Setup mock window/document before importing store
const dom = new JSDOM(`<!DOCTYPE html><div id="app"></div>`);
global.window = dom.window;
global.document = dom.window.document;
global.sessionStorage = {
  getItem: (k) => k === 'relay_active_account' ? companyId : null,
  setItem: () => {},
  removeItem: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Now import store and renderScheduleView
const { store } = await import('./src/data/store.js');
const { renderScheduleView } = await import('./src/pages/schedule/ScheduleView.js');

async function run() {
  console.log('Fetching Supabase data...');
  const { data: profiles } = await supabase.from('profiles').select('*').eq('company_id', companyId);
  const { data: jobs } = await supabase.from('jobs').select('*').eq('company_id', companyId);
  const { data: schedule } = await supabase.from('schedule').select('*').eq('company_id', companyId);
  
  // Populate store cache (simulating initializeCloudSync)
  store.userId = '976be428-0957-4d55-9219-8ac4c0de6e86';
  store.companyId = companyId;
  store.cache.technicians = store.normalizeData(profiles || [], 'technicians');
  store.cache.jobs = store.normalizeData(jobs || [], 'jobs');
  store.cache.schedule = store.normalizeData(schedule || [], 'schedule');
  
  // Set current user in sessionStorage
  const currentUser = profiles.find(p => p.id === '976be428-0957-4d55-9219-8ac4c0de6e86');
  global.sessionStorage.getItem = (k) => {
    if (k === 'relay_active_account') return companyId;
    if (k === 'currentUser') return JSON.stringify(currentUser);
    return null;
  };
  global.localStorage.getItem = (k) => {
    if (k === 'currentUser') return JSON.stringify(currentUser);
    return null;
  };
  
  console.log('Rendering ScheduleView...');
  const container = document.getElementById('app');
  renderScheduleView(container);
  
  // Wait a moment for any render microtasks
  console.log('\n--- RENDERED HTML (partial) ---');
  const blocks = container.querySelectorAll('.schedule-block');
  console.log('Rendered Blocks Count:', blocks.length);
  blocks.forEach(b => {
    console.log(`Block: style="${b.getAttribute('style').replace(/\s+/g, ' ')}" text="${b.textContent.trim().replace(/\s+/g, ' ')}"`);
  });
  
  console.log('\nDay Column Header Names:');
  container.querySelectorAll('.schedule-day-col').forEach(col => {
    console.log(`Day col: date=${col.dataset.date}, dayIdx=${col.dataset.day}`);
  });
}
run();

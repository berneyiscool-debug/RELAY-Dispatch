import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env from workspace directory
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- Probing Projects and Cost Centers ---');
  
  // 1. Projects
  const { data: pData, error: pError } = await supabase.from('projects').select('*').limit(1);
  if (pError) {
    console.log('projects table error:', pError.message);
  } else {
    console.log('projects table exists! Sample columns:', pData.length > 0 ? Object.keys(pData[0]) : 'no rows');
  }

  // 2. Cost Centers
  const { data: ccData, error: ccError } = await supabase.from('cost_centers').select('*').limit(1);
  if (ccError) {
    console.log('cost_centers table error:', ccError.message);
  } else {
    console.log('cost_centers table exists! Sample columns:', ccData.length > 0 ? Object.keys(ccData[0]) : 'no rows');
  }

  // 3. Jobs
  const { data: jData, error: jError } = await supabase.from('jobs').select('*').limit(1);
  if (jError) {
    console.log('jobs table error:', jError.message);
  } else {
    console.log('jobs table sample columns:', jData.length > 0 ? Object.keys(jData[0]) : 'no rows');
  }
}

run();

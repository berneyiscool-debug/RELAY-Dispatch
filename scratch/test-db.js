import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
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

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(5);
  if (error) {
    console.log(`- ${tableName}: Error - ${error.message}`);
  } else {
    console.log(`- ${tableName}: Found ${data.length} rows`);
    if (data.length > 0) {
      console.log(`  Sample row:`, Object.keys(data[0]));
    }
  }
}

async function run() {
  console.log('--- CHECKING TABLE VISIBILITY VIA ANON KEY ---');
  const tables = [
    'companies',
    'profiles',
    'customers',
    'user_types',
    'jobs',
    'quotes',
    'invoices',
    'timesheets',
    'contractors',
    'suppliers'
  ];
  for (const t of tables) {
    await checkTable(t);
  }
}

run();

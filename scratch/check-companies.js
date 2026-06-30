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

async function run() {
  const { data: companies, error } = await supabase.from('companies').select('id, name, settings');
  if (error) {
    console.error('Error fetching companies:', error);
  } else {
    companies.forEach(c => {
      console.log(`Company: ${c.name} (${c.id})`);
      const s = c.settings || {};
      console.log(`  - logo: ${s.logo ? s.logo.substring(0, 50) + '...' : typeof s.logo}`);
      console.log(`  - logoSmall: ${s.logoSmall ? s.logoSmall.substring(0, 50) + '...' : typeof s.logoSmall}`);
      console.log('--------------------------------------------------');
    });
  }
}

run();

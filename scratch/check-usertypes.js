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
  const { data: userTypes, error } = await supabase.from('user_types').select('*');
  if (error) {
    console.error('Error fetching user types:', error);
  } else {
    console.log(`Total user types: ${userTypes.length}`);
    userTypes.forEach(ut => {
      console.log(`ID: ${ut.id}`);
      console.log(`  - name: ${ut.name}`);
      console.log(`  - company_id: ${ut.company_id}`);
      console.log('--------------------------------------------------');
    });
  }
}

run();

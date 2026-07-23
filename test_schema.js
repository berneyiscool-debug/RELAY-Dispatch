import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() { 
  const { data, error } = await supabase.from('schedule').select('date').limit(1); 
  console.log(JSON.stringify({data, error}, null, 2)); 
} 

test();

import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

async function runTest() {
  console.log("Supabase URL:", supabaseUrl);
  
  // Test 1: Insert to customers with notes
  const payloadWithNotes = {
    id: "test-id-12345",
    company_id: "0a0a0a0a-0a0a-0a0a-0a0a-0a0a0a0a0a0a", // dummy uuid format
    company: "Test Co",
    first_name: "Test",
    last_name: "User",
    notes: "Some test notes"
  };

  console.log("\n--- Test 1: Inserting to customers with 'notes' ---");
  let response = await fetch(`${supabaseUrl}/rest/v1/customers`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify([payloadWithNotes])
  });

  console.log("Status:", response.status);
  console.log("Body:", await response.text());

  // Test 2: Insert to customers without notes
  const payloadWithoutNotes = {
    id: "test-id-123456",
    company_id: "0a0a0a0a-0a0a-0a0a-0a0a-0a0a0a0a0a0a", // dummy uuid format
    company: "Test Co",
    first_name: "Test",
    last_name: "User"
  };

  console.log("\n--- Test 2: Inserting to customers without 'notes' ---");
  response = await fetch(`${supabaseUrl}/rest/v1/customers`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify([payloadWithoutNotes])
  });

  console.log("Status:", response.status);
  console.log("Body:", await response.text());
}

runTest();

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

const TABLE_MAP = {
  companies: 'companies',
  technicians: 'profiles',
  userTypes: 'user_types',
  customers: 'customers',
  assets: 'assets',
  maintenancePlans: 'maintenance_plans',
  taskTemplates: 'task_templates',
  quotes: 'quotes',
  jobs: 'jobs',
  invoices: 'invoices',
  stock: 'stock',
  timesheets: 'timesheets',
  contractors: 'contractors',
  suppliers: 'suppliers',
  purchaseOrders: 'purchase_orders',
  notifications: 'notifications',
  formTemplates: 'form_templates',
  formInstances: 'form_instances',
  kits: 'kits',
  documents: 'documents'
};

// All potential columns from schema + frontend
const TABLE_POTENTIAL_COLUMNS = {
  companies: ["id", "name", "abn", "phone", "domain", "email", "address", "settings", "created_at", "updated_at"],
  profiles: ["id", "company_id", "name", "email", "username", "phone", "role", "user_type_id", "color", "pay_rate", "force_password_change", "created_at", "updated_at"],
  user_types: ["id", "company_id", "name", "description", "permissions", "created_at", "updated_at"],
  customers: ["id", "company_id", "company", "first_name", "last_name", "email", "phone", "address", "status", "type", "portal_token", "created_at", "updated_at", "notes"],
  assets: ["id", "company_id", "name", "type", "serial", "owner_type", "customer_id", "customer_name", "current_meter", "recovery_rate", "status", "logs", "created_at", "updated_at"],
  maintenance_plans: ["id", "company_id", "name", "asset_id", "trigger_type", "meter_interval", "last_triggered_meter", "next_service_date", "status", "priority", "frequency", "collision_merging", "created_at", "updated_at"],
  task_templates: ["id", "company_id", "name", "description", "tags", "tasks", "created_at", "updated_at"],
  quotes: ["id", "company_id", "number", "customer_id", "customer_name", "contact_name", "title", "status", "line_items", "subtotal", "tax", "total", "valid_until", "notes", "created_at", "updated_at"],
  jobs: ["id", "company_id", "number", "customer_id", "customer_name", "contact_name", "site_address", "title", "type", "status", "priority", "technician_id", "technician_name", "quote_id", "asset_id", "scheduled_date", "estimated_hours", "labor_cost", "material_cost", "tasks", "notes", "created_at", "updated_at", "recurring_config", "recurringConfig"],
  invoices: ["id", "company_id", "number", "job_id", "customer_id", "customer_name", "contact_name", "title", "status", "line_items", "subtotal", "tax", "total", "due_date", "notes", "created_at", "updated_at"],
  stock: ["id", "company_id", "name", "category", "unit", "cost_price", "unit_price", "reorder_level", "quantity", "locations", "supplier", "created_at", "updated_at"],
  timesheets: ["id", "company_id", "technician_id", "technician_name", "date", "duration_hours", "job_id", "status", "approved_by", "created_at", "updated_at"],
  contractors: [
    "id", "company_id", "name", "email", "phone", "status", "created_at", "updated_at",
    "business_name", "contact_name", "license_number", "insurance_expiry", "hourly_rate", "after_hours_rate", "callout_fee", "specialties", "notes", "compliance_docs"
  ],
  suppliers: [
    "id", "company_id", "name", "email", "phone", "status", "created_at", "updated_at",
    "contact_name", "address", "category", "payment_terms", "account_number", "notes", "active"
  ],
  purchase_orders: ["id", "company_id", "number", "supplier_id", "supplier_name", "status", "line_items", "total", "created_at", "updated_at"],
  notifications: ["id", "company_id", "title", "message", "link", "status", "created_at", "updated_at"],
  form_templates: ["id", "company_id", "name", "fields", "created_at", "updated_at"],
  form_instances: ["id", "company_id", "template_id", "job_id", "values", "created_at", "updated_at"],
  kits: ["id", "company_id", "name", "items", "created_at", "updated_at"],
  documents: ["id", "company_id", "name", "file_path", "job_id", "created_at", "updated_at"]
};

async function run() {
  const finalSchema = {};

  for (const [col, table] of Object.entries(TABLE_MAP)) {
    console.log(`Probing ${table}...`);
    const potentialFields = TABLE_POTENTIAL_COLUMNS[table] || [];
    const existing = [];
    
    for (const field of potentialFields) {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${field}&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.status === 200) {
        existing.push(field);
      } else {
        const text = await response.text();
        if (!text.includes("42703") && !text.includes("does not exist")) {
          // If it's RLS or other non-column-missing error, it exists
          existing.push(field);
        }
      }
    }
    
    finalSchema[table] = existing;
  }

  console.log("\n=================== LIVE SCHEMA ===================");
  console.log(JSON.stringify(finalSchema, null, 2));
}

run();

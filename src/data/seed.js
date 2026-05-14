// ============================================
// SIMPRO CLONE — SEED DATA
// ============================================

import { store } from './store.js';
import { MODULE_PERMS } from '../pages/Settings.js';

// ---- Build granular permissions helper (mirrors Settings.js) ----
function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

// ---- Default User Types ----
function seedUserTypes() {
  const existing = store.getAll('userTypes');
  if (existing && existing.length > 0) return existing;

  const userTypes = [
    {
      id: 'ut_admin',
      name: 'Admin',
      description: 'Full system access',
      permissions: buildGranularPerms(() => true),
    },
    {
      id: 'ut_manager',
      name: 'Manager',
      description: 'Can manage most workflows but limited settings access',
      permissions: buildGranularPerms((mod, key) => {
        // Managers can see Settings but only edit company info — no user management
        if (mod === 'Settings') return ['view', 'edit_company', 'manage_tax'].includes(key);
        // Everything else: full access
        return true;
      }),
    },
    {
      id: 'ut_tech',
      name: 'Technician',
      description: 'Field staff — limited to their own jobs, schedule and timesheets',
      permissions: buildGranularPerms((mod, key) => {
        if (mod === 'Dashboard') return key === 'view';
        if (mod === 'Jobs') return ['view', 'manage_tasks', 'book_time'].includes(key);
        if (mod === 'Timesheets') return ['view_own', 'create'].includes(key);
        if (mod === 'Schedule') return ['view_own'].includes(key);
        return false;
      }),
    },
    {
      id: 'ut_office',
      name: 'Office Staff',
      description: 'Admin / reception — can manage customers, quotes, invoices but not system settings',
      permissions: buildGranularPerms((mod, key) => {
        if (mod === 'Settings') return false;
        if (mod === 'Reports') return key === 'view';
        // No delete on financial records
        if (['Invoices', 'Purchase Orders'].includes(mod) && key === 'delete') return false;
        return true;
      }),
    },
  ];

  store.save('userTypes', userTypes);
  return userTypes;
}

const customerNames = [
  { company: 'Acme Electrical Services', first: 'James', last: 'Henderson' },
  { company: 'BluePeak Plumbing Co', first: 'Sarah', last: 'Mitchell' },
  { company: 'ClearAir HVAC Solutions', first: 'David', last: 'Thompson' },
  { company: 'Delta Fire Protection', first: 'Emily', last: 'Rodriguez' },
  { company: 'Evergreen Security Systems', first: 'Michael', last: 'Chen' },
  { company: 'Falcon Mechanical', first: 'Lisa', last: 'Anderson' },
  { company: 'GreenLeaf Property Mgmt', first: 'Robert', last: 'Williams' },
  { company: 'Harbor Construction Group', first: 'Jennifer', last: 'Davis' },
  { company: 'Iron Shield Roofing', first: 'Christopher', last: 'Taylor' },
  { company: 'Jade Commercial Fitouts', first: 'Amanda', last: 'Brown' },
  { company: 'Knight Industrial Services', first: 'Daniel', last: 'Wilson' },
  { company: 'Lakeside Developments', first: 'Michelle', last: 'Garcia' },
];

const technicians = [
  { id: 'tech1', name: 'Mark Sullivan',  role: 'Senior Electrician',       color: '#3B82F6', userTypeId: 'ut_admin'   },
  { id: 'tech2', name: 'Jake Patterson', role: 'Operations Manager',        color: '#10B981', userTypeId: 'ut_manager' },
  { id: 'tech3', name: 'Ryan Cooper',    role: 'HVAC Technician',            color: '#F59E0B', userTypeId: 'ut_tech'    },
  { id: 'tech4', name: 'Tom Bradley',    role: 'Fire Systems Specialist',    color: '#EF4444', userTypeId: 'ut_tech'    },
  { id: 'tech5', name: 'Nathan Brooks',  role: 'Security Installer',         color: '#8B5CF6', userTypeId: 'ut_tech'    },
  { id: 'tech6', name: 'Carlos Ramírez', role: 'Office Administrator',       color: '#EC4899', userTypeId: 'ut_office'  },
];

const jobTypes = ['Electrical', 'Plumbing', 'HVAC', 'Fire Protection', 'Security', 'General Maintenance'];
const streets = ['145 King St', '88 Queen Rd', '201 George Ave', '55 Elizabeth Dr', '312 Market St', '78 Bridge Ln', '420 Park Ave', '33 Oak Blvd'];
const suburbs = ['Southbank', 'Richmond', 'Carlton', 'Docklands', 'Brunswick', 'Fitzroy', 'Collingwood', 'Hawthorn'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack, daysForward = 0) {
  const now = new Date();
  const diff = Math.floor(Math.random() * (daysBack + daysForward)) - daysBack;
  const d = new Date(now.getTime() + diff * 86400000);
  return d.toISOString();
}

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateCustomers() {
  return customerNames.map((c, i) => {
    const street1 = randomItem(streets);
    const street2 = randomItem(streets);
    return {
      id: `cust_${i + 1}`,
      company: c.company,
      firstName: c.first,
      lastName: c.last,
      email: `${c.first.toLowerCase()}.${c.last.toLowerCase()}@${c.company.split(' ')[0].toLowerCase()}.com.au`,
      phone: `04${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: `${street1}, ${randomItem(suburbs)}, VIC 3000`,
      status: randomItem(['Active', 'Active', 'Active', 'Inactive']),
      type: randomItem(['Company', 'Company', 'Individual']),
      notes: '',
      createdAt: randomDate(365),
      updatedAt: randomDate(30),
      sites: [
        { name: 'Main Office', address: `${street1}, ${randomItem(suburbs)}, VIC 3000` },
        { name: 'Warehouse', address: `${street2}, ${randomItem(suburbs)}, VIC 3001` },
      ],
      contacts: [
        { name: `${c.first} ${c.last}`, role: 'Primary', email: `${c.first.toLowerCase()}@${c.company.split(' ')[0].toLowerCase()}.com.au`, phone: `04${Math.floor(10000000 + Math.random() * 90000000)}` },
        { name: `${randomItem(['Alex','Sam','Jordan','Casey','Morgan'])} ${c.last}`, role: 'Site Manager', email: `site@${c.company.split(' ')[0].toLowerCase()}.com.au`, phone: `04${Math.floor(10000000 + Math.random() * 90000000)}` },
      ],
    };
  });
}


function generateLeads(customers) {
  const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const sources = ['Website', 'Referral', 'Phone', 'Email', 'Trade Show', 'Google Ads'];
  return Array.from({ length: 15 }, (_, i) => {
    const cust = randomItem(customers);
    return {
      id: `lead_${i + 1}`,
      title: `${randomItem(jobTypes)} ${randomItem(['Installation', 'Repair', 'Inspection', 'Upgrade', 'Maintenance'])}`,
      customerId: cust.id,
      customerName: cust.company,
      contactName: `${cust.firstName} ${cust.lastName}`,
      status: randomItem(statuses),
      source: randomItem(sources),
      value: randomAmount(500, 25000),
      description: `Potential ${randomItem(jobTypes).toLowerCase()} work for ${cust.company}.`,
      priority: randomItem(['Low', 'Medium', 'High']),
      createdAt: randomDate(90),
      updatedAt: randomDate(14),
    };
  });
}

function generateQuotes(customers) {
  const statuses = ['Draft', 'Sent', 'Accepted', 'Declined'];
  return Array.from({ length: 18 }, (_, i) => {
    const cust = randomItem(customers);
    const laborCost = randomAmount(200, 5000);
    const materialCost = randomAmount(100, 8000);
    const tax = (laborCost + materialCost) * 0.1;
    return {
      id: `quote_${i + 1}`,
      number: `Q-${String(2024000 + i + 1)}`,
      customerId: cust.id,
      customerName: cust.company,
      contactName: `${cust.firstName} ${cust.lastName}`,
      title: `${randomItem(jobTypes)} - ${randomItem(['Service Quote', 'Project Quote', 'Maintenance Quote'])}`,
      status: randomItem(statuses),
      lineItems: [
        { description: `${randomItem(jobTypes)} Labor`, type: 'labor', qty: Math.ceil(Math.random() * 16), rate: randomAmount(65, 120), total: laborCost },
        { description: `${randomItem(['Cable', 'Pipe', 'Filter', 'Sensor', 'Panel', 'Valve'])} Kit`, type: 'material', qty: Math.ceil(Math.random() * 10), rate: randomAmount(15, 200), total: materialCost },
      ],
      subtotal: laborCost + materialCost,
      tax,
      total: laborCost + materialCost + tax,
      validUntil: randomDate(-30, 60),
      notes: '',
      createdAt: randomDate(120),
      updatedAt: randomDate(14),
    };
  });
}

function generateJobs(customers, quotes) {
  const statuses = ['Pending', 'Scheduled', 'In Progress', 'On Hold', 'Completed', 'Invoiced'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  return Array.from({ length: 20 }, (_, i) => {
    const cust = randomItem(customers);
    const tech = randomItem(technicians);
    const status = randomItem(statuses);
    return {
      id: `job_${i + 1}`,
      number: `J-${String(100000 + i + 1)}`,
      customerId: cust.id,
      customerName: cust.company,
      contactName: `${cust.firstName} ${cust.lastName}`,
      siteAddress: cust.address || `${randomItem(streets)}, ${randomItem(suburbs)}, VIC 3000`,
      title: `${randomItem(jobTypes)} - ${randomItem(['Service', 'Repair', 'Installation', 'Inspection', 'Maintenance'])}`,
      type: randomItem(jobTypes),
      status,
      priority: randomItem(priorities),
      technicianId: tech.id,
      technicianName: tech.name,
      quoteId: i < quotes.length ? quotes[i]?.id : null,
      scheduledDate: randomDate(-7, 21),
      estimatedHours: Math.ceil(Math.random() * 8),
      laborCost: randomAmount(200, 4000),
      materialCost: randomAmount(100, 3000),
      notes: '',
      createdAt: randomDate(90),
      updatedAt: randomDate(7),
    };
  });
}

function generateInvoices(jobs) {
  const statuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Void'];
  const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
  return Array.from({ length: Math.max(8, completedJobs.length) }, (_, i) => {
    const job = completedJobs[i] || randomItem(jobs);
    const subtotal = (job.laborCost || 0) + (job.materialCost || 0);
    const tax = subtotal * 0.1;
    return {
      id: `inv_${i + 1}`,
      number: `INV-${String(50000 + i + 1)}`,
      jobId: job.id,
      jobNumber: job.number,
      customerId: job.customerId,
      customerName: job.customerName,
      contactName: job.contactName,
      status: randomItem(statuses),
      lineItems: [
        { description: `${job.title} - Labor`, amount: job.laborCost || randomAmount(200, 4000) },
        { description: `${job.title} - Materials`, amount: job.materialCost || randomAmount(100, 3000) },
      ],
      subtotal,
      tax,
      total: subtotal + tax,
      invoiceType: 'Standard',
      issueDate: randomDate(60),
      dueDate: randomDate(-14, 30),
      paidDate: null,
      notes: '',
      createdAt: randomDate(60),
      updatedAt: randomDate(7),
    };
  });
}

function generateStockItems() {
  const categories = ['Electrical', 'Plumbing', 'HVAC', 'Fire Safety', 'Security', 'General'];
  const items = [
    { name: '10A Circuit Breaker', cat: 'Electrical', unit: 'each', price: 12.50 },
    { name: '2.5mm Twin & Earth Cable (100m)', cat: 'Electrical', unit: 'roll', price: 89.00 },
    { name: 'LED Downlight 10W', cat: 'Electrical', unit: 'each', price: 18.50 },
    { name: 'RCD Safety Switch', cat: 'Electrical', unit: 'each', price: 45.00 },
    { name: '15mm Copper Pipe (5.5m)', cat: 'Plumbing', unit: 'length', price: 32.00 },
    { name: 'PVC Elbow 90° 50mm', cat: 'Plumbing', unit: 'each', price: 4.50 },
    { name: 'Flick Mixer Tap Chrome', cat: 'Plumbing', unit: 'each', price: 155.00 },
    { name: 'Hot Water Thermostat', cat: 'Plumbing', unit: 'each', price: 38.00 },
    { name: 'Split System Filter', cat: 'HVAC', unit: 'each', price: 22.00 },
    { name: 'Refrigerant R410A (10kg)', cat: 'HVAC', unit: 'cylinder', price: 245.00 },
    { name: 'Duct Tape Aluminium 48mm', cat: 'HVAC', unit: 'roll', price: 14.00 },
    { name: 'Fire Extinguisher 4.5kg ABE', cat: 'Fire Safety', unit: 'each', price: 89.00 },
    { name: 'Smoke Detector Photoelectric', cat: 'Fire Safety', unit: 'each', price: 28.00 },
    { name: 'Fire Hose Reel 36m', cat: 'Fire Safety', unit: 'each', price: 320.00 },
    { name: 'Motion Sensor PIR', cat: 'Security', unit: 'each', price: 42.00 },
    { name: 'Security Camera 4MP IP', cat: 'Security', unit: 'each', price: 189.00 },
    { name: 'Access Control Keypad', cat: 'Security', unit: 'each', price: 135.00 },
    { name: 'Cable Ties 300mm (100pk)', cat: 'General', unit: 'pack', price: 8.50 },
    { name: 'Silicone Sealant Clear', cat: 'General', unit: 'tube', price: 9.00 },
    { name: 'Safety Glasses Clear', cat: 'General', unit: 'pair', price: 6.50 },
  ];

  return items.map((item, i) => ({
    id: `stock_${i + 1}`,
    name: item.name,
    sku: `SKU-${String(1000 + i)}`,
    category: item.cat,
    unit: item.unit,
    unitPrice: item.price,
    costPrice: item.price * 0.6,
    quantity: Math.floor(Math.random() * 200) + 5,
    reorderLevel: Math.floor(Math.random() * 20) + 5,
    supplier: randomItem(['ElectraTrade', 'PipeLine Supply', 'CoolParts Wholesale', 'SafeGuard Dist.', 'AllTrade Supplies']),
    location: randomItem(['Warehouse A', 'Warehouse B', 'Van Stock', 'On Order']),
    createdAt: randomDate(365),
    updatedAt: randomDate(30),
  }));
}

function generateScheduleBlocks(jobs) {
  const blocks = [];
  const today = new Date();
  const scheduledJobs = jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress');

  scheduledJobs.forEach((job, i) => {
    const dayOffset = Math.floor(Math.random() * 5);
    const startHour = 7 + Math.floor(Math.random() * 8);
    const duration = 1 + Math.floor(Math.random() * 4);
    const tech = technicians.find(t => t.id === job.technicianId) || randomItem(technicians);

    blocks.push({
      id: `sched_${i + 1}`,
      jobId: job.id,
      jobNumber: job.number,
      title: job.title,
      technicianId: tech.id,
      technicianName: tech.name,
      color: tech.color,
      dayOffset,
      startHour,
      endHour: Math.min(startHour + duration, 18),
      customerName: job.customerName,
      siteAddress: job.siteAddress,
    });
  });

  return blocks;
}

export function seedData() {
  if (store.isSeeded()) return;

  // Always seed user types first so technician userTypeIds resolve correctly
  seedUserTypes();

  const customers = generateCustomers();
  const leads = generateLeads(customers);
  const quotes = generateQuotes(customers);
  const jobs = generateJobs(customers, quotes);
  const invoices = generateInvoices(jobs);
  const stockItems = generateStockItems();
  const scheduleBlocks = generateScheduleBlocks(jobs);

  store.save('customers', customers);
  store.save('leads', leads);
  store.save('quotes', quotes);
  store.save('jobs', jobs);
  store.save('invoices', invoices);
  store.save('stock', stockItems);
  store.save('schedule', scheduleBlocks);
  store.save('technicians', technicians);

  store.markSeeded();
}

export { technicians };

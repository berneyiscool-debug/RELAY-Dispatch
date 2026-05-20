// ============================================
// FIELDFORGE — SEED DATA
// ============================================

import { store } from './store.js';
import { MODULE_PERMS } from '../utils/permissions.js';

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
  { id: 'tech1', name: 'Mark Sullivan',  role: 'Senior Electrician',       color: '#3B82F6', userTypeId: 'ut_admin',   payRate: 95.00 },
  { id: 'tech2', name: 'Jake Patterson', role: 'Operations Manager',        color: '#10B981', userTypeId: 'ut_manager', payRate: 85.00 },
  { id: 'tech3', name: 'Ryan Cooper',    role: 'HVAC Technician',           color: '#F59E0B', userTypeId: 'ut_tech',    payRate: 58.00 },
  { id: 'tech4', name: 'Tom Bradley',    role: 'Fire Systems Specialist',   color: '#EF4444', userTypeId: 'ut_tech',    payRate: 62.00 },
  { id: 'tech5', name: 'Nathan Brooks',  role: 'Security Installer',        color: '#8B5CF6', userTypeId: 'ut_tech',    payRate: 55.00 },
  { id: 'tech6', name: 'Carlos Ramírez', role: 'Office Administrator',      color: '#EC4899', userTypeId: 'ut_office',  payRate: 42.00 },
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

function generateTaskTemplates() {
  return [
    {
      id: 'tmpl_elec_std',
      name: 'Standard Electrical Inspection',
      description: 'A comprehensive tasklist for residential or commercial electrical safety inspections.',
      tags: ['Electrical', 'Maintenance', 'Compliance'],
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'p1', name: 'Main Board Inspection', status: 'Not Started', progress: 0,
          subTasks: [
            { id: 'sp1', name: 'RCD Testing', estimatedHours: 1, people: 1, status: 'Not Started', progress: 0 },
            { id: 'sp2', name: 'Terminal Tightness', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 }
          ]
        },
        {
          id: 'p2', name: 'Circuit Testing', status: 'Not Started', progress: 0,
          subTasks: [
            { id: 'sp3', name: 'Insulation Resistance', estimatedHours: 2, people: 1, status: 'Not Started', progress: 0 },
            { id: 'sp4', name: 'Earth Loop Impedance', estimatedHours: 1.5, people: 1, status: 'Not Started', progress: 0 }
          ]
        }
      ]
    },
    {
      id: 'tmpl_solar_maint',
      name: 'Solar Panel Maintenance',
      description: 'Annual maintenance checklist for PV solar systems.',
      tags: ['Solar', 'Renewable', 'Maintenance'],
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'p3', name: 'Physical Inspection', status: 'Not Started', progress: 0,
          subTasks: [
            { id: 'sp5', name: 'Module Cleaning', estimatedHours: 3, people: 2, status: 'Not Started', progress: 0 },
            { id: 'sp6', name: 'Mounting Hardware Check', estimatedHours: 1, people: 1, status: 'Not Started', progress: 0 }
          ]
        },
        {
          id: 'p4', name: 'Electrical Performance', status: 'Not Started', progress: 0,
          subTasks: [
            { id: 'sp7', name: 'Inverter Diagnostics', estimatedHours: 1, people: 1, status: 'Not Started', progress: 0 },
            { id: 'sp8', name: 'String Voltage Testing', estimatedHours: 2, people: 1, status: 'Not Started', progress: 0 }
          ]
        }
      ]
    }
  ];
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
      tasks: [
        { 
          id: 'p1', 
          name: 'Site Preparation', 
          status: status === 'Pending' ? 'Not Started' : 'Completed', 
          progress: status === 'Pending' ? 0 : 100,
          estimatedHours: 4,
          people: 1,
          subTasks: [
            { id: 'sp1', name: 'Safety Audit', status: status === 'Pending' ? 'Not Started' : 'Completed', progress: status === 'Pending' ? 0 : 100, estimatedHours: 1, people: 1 },
            { id: 'sp2', name: 'Site Setup', status: status === 'Pending' ? 'Not Started' : 'Completed', progress: status === 'Pending' ? 0 : 100, estimatedHours: 3, people: 1 }
          ]
        },
        { 
          id: 'p2', 
          name: 'Installation Phase', 
          status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Not Started'), 
          progress: (status === 'Completed' || status === 'Invoiced') ? 100 : (status === 'In Progress' ? 50 : 0),
          estimatedHours: 12,
          people: 2,
          subTasks: [
            { id: 'sp3', name: 'Main Installation', status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Not Started'), progress: (status === 'Completed' || status === 'Invoiced') ? 100 : (status === 'In Progress' ? 100 : 0), estimatedHours: 8, people: 2 },
            { id: 'sp4', name: 'Final Commissioning', status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : 'Not Started', progress: (status === 'Completed' || status === 'Invoiced') ? 100 : 0, estimatedHours: 4, people: 2 }
          ]
        }
      ],
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

function generateFormTemplates() {
  return [
    {
      id: 'fmt_1',
      name: 'Job Safety Analysis (JSA)',
      description: 'Daily safety assessment before starting work.',
      sections: [
        {
          id: 'sec_1',
          title: 'Personal Protective Equipment',
          fields: [
            { id: 'f1', type: 'checkbox', label: 'Gloves worn?', required: true },
            { id: 'f2', type: 'checkbox', label: 'Safety Glasses worn?', required: true },
            { id: 'f3', type: 'checkbox', label: 'Steel Cap Boots worn?', required: true }
          ]
        },
        {
          id: 'sec_2',
          title: 'Site Hazards',
          fields: [
            { id: 'f4', type: 'select', label: 'Overall Site Risk', options: ['Low', 'Medium', 'High'], required: true },
            { id: 'f5', type: 'textarea', label: 'Identified Hazards', placeholder: 'Describe any trip hazards, live wires, etc.' }
          ]
        },
        {
          id: 'sec_3',
          title: 'Authorization',
          fields: [
            { id: 'f6', type: 'signature', label: 'Technician Signature', required: true }
          ]
        }
      ]
    },
    {
      id: 'fmt_2',
      name: 'Site Assessment',
      description: 'Detailed site inspection and requirements.',
      sections: [
        {
          id: 'sec_4',
          title: 'Client Details',
          fields: [
            { id: 'f7', type: 'text', label: 'Customer Rep Name' },
            { id: 'f8', type: 'date', label: 'Inspection Date' }
          ]
        },
        {
          id: 'sec_5',
          title: 'Access & Logistics',
          fields: [
            { id: 'f9', type: 'checkbox', label: 'Access keys provided?' },
            { id: 'f10', type: 'textarea', label: 'Parking / Entry Instructions' }
          ]
        }
      ]
    }
  ];
}

function generateFormInstances(jobs, templates) {
  return []; // Start empty
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

function generateAssets(customers) {
  const assets = [
    { name: 'Toyota Hilux 2022', type: 'Vehicle', serial: 'REG-123-FF', ownerType: 'Business', recoveryRate: 25.00, serviceIntervalMonths: 6, currentMeter: 45000, status: 'Active' },
    { name: 'Isuzu NPR Truck', type: 'Vehicle', serial: 'REG-888-FF', ownerType: 'Business', recoveryRate: 45.00, serviceIntervalMonths: 6, currentMeter: 120000, status: 'Active' },
    { name: 'Scissor Lift 19ft', type: 'Plant & Equipment', serial: 'SN-SL-9920', ownerType: 'Business', recoveryRate: 15.00, serviceIntervalMonths: 3, currentMeter: 840, status: 'Active' },
    { name: 'Carrier Chiller Unit', type: 'Fixed Asset (HVAC/Solar/Fire)', serial: 'SN-CH-7721', ownerType: 'Customer', customerId: customers[0].id, site: customers[0].sites?.[0]?.name, serviceIntervalMonths: 12, currentMeter: 15400, status: 'Active' },
    { name: 'Daikin Split System', type: 'Fixed Asset (HVAC/Solar/Fire)', serial: 'SN-DS-4410', ownerType: 'Customer', customerId: customers[1].id, site: customers[1].sites?.[0]?.name, serviceIntervalMonths: 12, currentMeter: 3200, status: 'Active' },
    { name: 'Fire Alarm Panel v4', type: 'Fixed Asset (HVAC/Solar/Fire)', serial: 'SN-FP-2299', ownerType: 'Customer', customerId: customers[2].id, site: customers[2].sites?.[0]?.name, serviceIntervalMonths: 6, currentMeter: 0, status: 'Active' },
  ];

  return assets.map((a, i) => ({
    id: `asset_${i + 1}`,
    ...a,
    logs: [
      { id: `log_${i}_1`, type: 'Service', date: randomDate(90), technicianName: 'Jake Patterson', cost: 250, notes: 'Routine check' }
    ]
  }));
}

function generateScheduleBlocks(jobs) {
  const blocks = [];
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
  if (store.isSeeded()) {
    // Schema Migration: Convert "phases" -> "tasks" and "subPhases" -> "subTasks" for backward compatibility
    const existingJobs = store.getAll('jobs');
    let migratedJobs = false;
    const updatedJobs = existingJobs.map(job => {
      let needsMigration = false;
      function migrateNode(node) {
        const newNode = { ...node };
        if ('subPhases' in newNode) {
          newNode.subTasks = (newNode.subPhases || []).map(sp => migrateNode(sp));
          delete newNode.subPhases;
          needsMigration = true;
        } else if (newNode.subTasks) {
          newNode.subTasks = newNode.subTasks.map(st => migrateNode(st));
        }
        return newNode;
      }
      
      const newJob = { ...job };
      if ('phases' in newJob) {
        newJob.tasks = (newJob.phases || []).map(p => migrateNode(p));
        delete newJob.phases;
        needsMigration = true;
      } else if (newJob.tasks) {
        newJob.tasks = newJob.tasks.map(t => migrateNode(t));
      }
      if (needsMigration) migratedJobs = true;
      return newJob;
    });
    if (migratedJobs) {
      store.save('jobs', updatedJobs);
    }

    const existingTemplates = store.getAll('taskTemplates');
    let migratedTemplates = false;
    const updatedTemplates = existingTemplates.map(tmpl => {
      let needsMigration = false;
      function migrateNode(node) {
        const newNode = { ...node };
        if ('subPhases' in newNode) {
          newNode.subTasks = (newNode.subPhases || []).map(sp => migrateNode(sp));
          delete newNode.subPhases;
          needsMigration = true;
        } else if (newNode.subTasks) {
          newNode.subTasks = newNode.subTasks.map(st => migrateNode(st));
        }
        return newNode;
      }
      const newTmpl = { ...tmpl };
      if ('phases' in newTmpl) {
        newTmpl.tasks = (newTmpl.phases || []).map(p => migrateNode(p));
        delete newTmpl.phases;
        needsMigration = true;
      } else if (newTmpl.tasks) {
        newTmpl.tasks = newTmpl.tasks.map(t => migrateNode(t));
      }
      if (needsMigration) migratedTemplates = true;
      return newTmpl;
    });
    if (migratedTemplates) {
      store.save('taskTemplates', updatedTemplates);
    }

    // Migration: ensure existing jobs have the hierarchical 'tasks' structure
    const currentJobs = store.getAll('jobs');
    if (currentJobs.length > 0 && !currentJobs[0].tasks) {
      const updatedJobsWithTasks = currentJobs.map(job => {
        const status = job.status;
        return {
          ...job,
          tasks: [
            { 
              id: 'p1', 
              name: 'Site Preparation', 
              status: status === 'Pending' ? 'Not Started' : 'Completed', 
              progress: status === 'Pending' ? 0 : 100,
              estimatedHours: 4,
              people: 1,
              subTasks: [
                { id: 'sp1', name: 'Safety Audit', status: status === 'Pending' ? 'Not Started' : 'Completed', progress: status === 'Pending' ? 0 : 100, estimatedHours: 1, people: 1 },
                { id: 'sp2', name: 'Site Setup', status: status === 'Pending' ? 'Not Started' : 'Completed', progress: status === 'Pending' ? 0 : 100, estimatedHours: 3, people: 1 }
              ]
            },
            { 
              id: 'p2', 
              name: 'Project Execution', 
              status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Not Started'), 
              progress: (status === 'Completed' || status === 'Invoiced') ? 100 : (status === 'In Progress' ? 50 : 0),
              estimatedHours: 16,
              people: 2,
              subTasks: [
                { id: 'sp3', name: 'Installation', status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Not Started'), progress: (status === 'Completed' || status === 'Invoiced') ? 100 : (status === 'In Progress' ? 100 : 0), estimatedHours: 12, people: 2 },
                { id: 'sp4', name: 'Cleanup & Handover', status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : 'Not Started', progress: (status === 'Completed' || status === 'Invoiced') ? 100 : 0, estimatedHours: 4, people: 2 }
              ]
            }
          ]
        };
      });
      store.save('jobs', updatedJobsWithTasks);
    }

    // Always ensure User Types exist first
    const existingTypes = store.getAll('userTypes');
    if (!existingTypes || existingTypes.length === 0) {
      seedUserTypes();
    } else {
      // Self-healing migration: Ensure ut_office (Office Staff) exists in the database
      const hasOffice = existingTypes.some(ut => ut.id === 'ut_office');
      if (!hasOffice) {
         existingTypes.push({
           id: 'ut_office',
           name: 'Office Staff',
           description: 'Admin / reception — can manage customers, quotes, invoices but not system settings',
           permissions: buildGranularPerms((mod, key) => {
             if (mod === 'Settings') return false;
             if (mod === 'Reports') return key === 'view';
             if (['Invoices', 'Purchase Orders'].includes(mod) && key === 'delete') return false;
             return true;
           })
         });
         store.save('userTypes', existingTypes);
      }

      // Self-healing migration: Ensure all user types have the latest Jobs tab permissions populated
      let updatedTypes = false;
      existingTypes.forEach(ut => {
        if (!ut.permissions) ut.permissions = [];
        Object.entries(MODULE_PERMS).forEach(([module, permDefs]) => {
          let mPerm = ut.permissions.find(p => p.module === module);
          if (!mPerm) {
            mPerm = { module };
            ut.permissions.push(mPerm);
            updatedTypes = true;
          }
          permDefs.forEach(({ key }) => {
            if (mPerm[key] === undefined) {
              if (ut.id === 'ut_admin') {
                mPerm[key] = true;
              } else if (ut.id === 'ut_manager') {
                if (module === 'Settings') {
                  mPerm[key] = ['view', 'edit_company', 'manage_tax'].includes(key);
                } else {
                  mPerm[key] = true;
                }
              } else if (ut.id === 'ut_office') {
                if (module === 'Settings') mPerm[key] = false;
                else if (module === 'Reports') mPerm[key] = key === 'view';
                else if (['Invoices', 'Purchase Orders'].includes(module) && key === 'delete') mPerm[key] = false;
                else mPerm[key] = true;
              } else if (ut.id === 'ut_tech') {
                if (module === 'Dashboard') mPerm[key] = key === 'view';
                else if (module === 'Jobs') mPerm[key] = ['view', 'manage_tasks', 'book_time'].includes(key);
                else if (module === 'Timesheets') mPerm[key] = ['view_own', 'create'].includes(key);
                else if (module === 'Schedule') mPerm[key] = ['view_own'].includes(key);
                else mPerm[key] = false;
              } else {
                mPerm[key] = false;
              }
              updatedTypes = true;
            }
          });
        });
      });
      if (updatedTypes) {
        store.save('userTypes', existingTypes);
      }
    }

    // Check if technicians are missing their types
    const techs = store.getAll('technicians');
    const userTypes = store.getAll('userTypes');
    if (techs.length > 0 && userTypes.length > 0) {
       const firstTech = techs[0];
       const hasValidType = userTypes.some(ut => ut.id === firstTech.userTypeId);
       if (!hasValidType) {
          store.save('technicians', technicians);
       }
    }
    
    // Ensure taskTemplates collection exists for existing users
    const currentTemplates = store.getAll('taskTemplates');
    if (!currentTemplates || currentTemplates.length === 0) {
      store.save('taskTemplates', generateTaskTemplates());
    }
    return;
  }

  const customers = generateCustomers();
  const leads = generateLeads(customers);
  const quotes = generateQuotes(customers);
  const jobs = generateJobs(customers, quotes);
  const invoices = generateInvoices(jobs);
  const stockItems = generateStockItems();
  const assets = generateAssets(customers);
  const scheduleBlocks = generateScheduleBlocks(jobs);
  const templates = generateFormTemplates();

  store.save('customers', customers);
  store.save('leads', leads);
  store.save('quotes', quotes);
  store.save('jobs', jobs);
  store.save('invoices', invoices);
  store.save('stock', stockItems);
  store.save('assets', assets);
  store.save('schedule', scheduleBlocks);
  store.save('technicians', technicians);
  store.save('taskTemplates', generateTaskTemplates());
  store.save('formTemplates', templates);
  store.save('formInstances', []);

  // ---- Seed Activities ----
  const today = new Date();
  const pad = n => n.toString().padStart(2, '0');
  function dayOffset(offset) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const seedActivities = [
    { id: 'act_1', title: 'Follow up on quote approval', type: 'follow-up', date: dayOffset(0), time: '09:00', duration: 15, priority: 'high', status: 'pending', assignedToId: 'tech1', linkedType: 'quote', linkedId: quotes[0]?.id || '', linkedLabel: `Quote ${quotes[0]?.number || ''}`, notes: 'Client requested revised pricing on switchboard section.' },
    { id: 'act_2', title: 'Site inspection — Docklands', type: 'site-visit', date: dayOffset(0), time: '13:00', duration: 120, priority: 'normal', status: 'pending', assignedToId: 'tech3', linkedType: 'job', linkedId: jobs[0]?.id || '', linkedLabel: `Job ${jobs[0]?.number || ''}`, notes: 'Confirm conduit runs before ceiling close-in.' },
    { id: 'act_3', title: 'Call supplier re: panel delivery', type: 'call', date: dayOffset(-1), time: '10:30', duration: 10, priority: 'normal', status: 'completed', assignedToId: 'tech2', linkedType: '', linkedId: '', linkedLabel: '', notes: 'Confirmed delivery for Friday.' },
    { id: 'act_4', title: 'Team safety meeting', type: 'meeting', date: dayOffset(1), time: '07:30', duration: 30, priority: 'normal', status: 'pending', assignedToId: 'tech1', linkedType: '', linkedId: '', linkedLabel: '', notes: 'Monthly toolbox talk — fire extinguisher training.' },
    { id: 'act_5', title: 'Email updated scope to client', type: 'email', date: dayOffset(0), time: '15:00', duration: 15, priority: 'low', status: 'pending', assignedToId: 'tech6', linkedType: 'customer', linkedId: customers[1]?.id || '', linkedLabel: customers[1]?.company || '', notes: '' },
    { id: 'act_6', title: 'Chase overdue invoice', type: 'call', date: dayOffset(-2), time: '11:00', duration: 10, priority: 'high', status: 'pending', assignedToId: 'tech6', linkedType: 'invoice', linkedId: invoices[0]?.id || '', linkedLabel: `Invoice ${invoices[0]?.number || ''}`, notes: '60 days overdue. Escalate if no response.' },
    { id: 'act_7', title: 'Pre-start meeting with builder', type: 'meeting', date: dayOffset(2), time: '08:00', duration: 60, priority: 'normal', status: 'pending', assignedToId: 'tech2', linkedType: 'job', linkedId: jobs[1]?.id || '', linkedLabel: `Job ${jobs[1]?.number || ''}`, notes: 'Coordinate access and power isolation with site foreman.' },
    { id: 'act_8', title: 'Order fire panel spares', type: 'task', date: dayOffset(1), time: '', duration: 0, priority: 'normal', status: 'pending', assignedToId: 'tech4', linkedType: '', linkedId: '', linkedLabel: '', notes: 'Need 3x zone cards and 1x PSU.' },
    { id: 'act_9', title: 'Review apprentice logbook', type: 'task', date: dayOffset(3), time: '', duration: 0, priority: 'low', status: 'pending', assignedToId: 'tech1', linkedType: '', linkedId: '', linkedLabel: '', notes: '' },
    { id: 'act_10', title: 'Warranty follow-up call', type: 'call', date: dayOffset(-3), time: '14:00', duration: 15, priority: 'normal', status: 'completed', assignedToId: 'tech5', linkedType: 'customer', linkedId: customers[2]?.id || '', linkedLabel: customers[2]?.company || '', notes: 'Issue resolved. Replacement sensor installed.' },
  ];
  store.save('activities', seedActivities);

  store.markSeeded();
}

export { technicians };

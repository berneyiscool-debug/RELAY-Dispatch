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
        if (['Invoices', 'Purchase Orders', 'Suppliers'].includes(mod) && key === 'delete') return false;
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

export function generateContractors() {
  return [
    {
      id: 'cont_1',
      businessName: 'EcoVolt Electrical Services',
      contactName: 'Elena Rostova',
      email: 'elena@ecovoltelectrical.com.au',
      phone: '0498 765 432',
      licenseNumber: 'LIC-EL-88390',
      active: true,
      hourlyRate: 95.00,
      afterHoursRate: 142.50,
      calloutFee: 85.00,
      specialties: ['Solar PV Installation', 'Battery Systems', 'Switchboard Upgrades'],
      notes: 'Preferred subcontractor for large-scale solar rollouts. Highly reliable.',
      portalToken: 'c_pt_ecovolt',
      complianceDocs: [
        { id: 'doc_1_1', type: 'Public Liability Insurance', number: 'PL-992110-A', expiryDate: '2026-10-15', verified: true, notes: 'Cover up to $20M' },
        { id: 'doc_1_2', type: 'Workers Compensation', number: 'WC-883912', expiryDate: '2026-08-20', verified: true, notes: 'Active cover' },
        { id: 'doc_1_3', type: 'Electrical Contractor License', number: 'REC-39021', expiryDate: '2027-02-15', verified: true, notes: 'A-Grade Electrical License' }
      ]
    },
    {
      id: 'cont_2',
      businessName: 'Apex Plumbing & Drainage',
      contactName: 'Gary Barlow',
      email: 'gary@apexplumbing.com.au',
      phone: '0412 345 678',
      licenseNumber: 'LIC-PL-99211',
      active: true,
      hourlyRate: 90.00,
      afterHoursRate: 135.00,
      calloutFee: 90.00,
      specialties: ['Commercial Plumbing', 'Gas Fitting', 'Drain Blockages'],
      notes: 'Quick response time. Has own high-pressure jetter and CCTV camera.',
      portalToken: 'c_pt_apex',
      complianceDocs: [
        { id: 'doc_2_1', type: 'Public Liability Insurance', number: 'PL-223401-B', expiryDate: '2026-06-30', verified: true, notes: 'Cover up to $10M' },
        { id: 'doc_2_2', type: 'Workers Compensation', number: 'WC-449102', expiryDate: '2026-04-12', verified: false, notes: 'Requires updated certificate copy' },
        { id: 'doc_2_3', type: 'Plumbing Practitioner License', number: 'PPL-1192', expiryDate: '2027-09-01', verified: true, notes: 'Licensed drainer and gasfitter' }
      ]
    },
    {
      id: 'cont_3',
      businessName: 'Swift HVAC & Mechanical',
      contactName: 'Marcus Sterling',
      email: 'marcus@swifthvac.com.au',
      phone: '0423 556 789',
      licenseNumber: 'LIC-HV-44012',
      active: false,
      hourlyRate: 105.00,
      afterHoursRate: 157.50,
      calloutFee: 120.00,
      specialties: ['Chiller Maintenance', 'Commercial A/C', 'Duct Work'],
      notes: 'Currently set to inactive due to expired public liability insurance. Do not dispatch.',
      portalToken: 'c_pt_swift',
      complianceDocs: [
        { id: 'doc_3_1', type: 'Public Liability Insurance', number: 'PL-771109-C', expiryDate: '2026-02-10', verified: false, notes: 'Expired! Contact Marcus for renewal' },
        { id: 'doc_3_2', type: 'Workers Compensation', number: 'WC-110291', expiryDate: '2026-11-30', verified: true, notes: 'Cover active' },
        { id: 'doc_3_3', type: 'ARC Refrigerant License', number: 'ARC-8891', expiryDate: '2027-05-18', verified: true, notes: 'Full handle license' }
      ]
    }
  ];
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
          description: 'Visually inspect main board, terminal blocks, enclosure, and general wiring integrity.',
          subTasks: [
            { id: 'sp1', name: 'RCD Testing', estimatedHours: 1, people: 1, status: 'Not Started', progress: 0, description: 'Perform trip time and trip current test on safety switches.' },
            { id: 'sp2', name: 'Terminal Tightness', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0, description: 'Verify all terminal screws are properly torqued to specifications.' }
          ]
        },
        {
          id: 'p2', name: 'Circuit Testing', status: 'Not Started', progress: 0,
          description: 'Test subcircuits for safety, load rating compliance, and continuous grounding.',
          subTasks: [
            { id: 'sp3', name: 'Insulation Resistance', estimatedHours: 2, people: 1, status: 'Not Started', progress: 0, description: 'Measure insulation resistance between active, neutral, and earth conductors.' },
            { id: 'sp4', name: 'Earth Loop Impedance', estimatedHours: 1.5, people: 1, status: 'Not Started', progress: 0, description: 'Measure the impedance of the earth fault loop to verify breaker trip time.' }
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
          description: 'Assess physical condition of panels, mounting frames, and external conduits.',
          subTasks: [
            { id: 'sp5', name: 'Module Cleaning', estimatedHours: 3, people: 2, status: 'Not Started', progress: 0, description: 'Clean modules with de-ionized water to remove dirt, debris, or bird droppings.' },
            { id: 'sp6', name: 'Mounting Hardware Check', estimatedHours: 1, people: 1, status: 'Not Started', progress: 0, description: 'Ensure all mounting brackets, rails, and bolts are securely fastened.' }
          ]
        },
        {
          id: 'p4', name: 'Electrical Performance', status: 'Not Started', progress: 0,
          description: 'Measure solar production efficiency, inverter outputs, and string voltage stability.',
          subTasks: [
            { id: 'sp7', name: 'Inverter Diagnostics', estimatedHours: 1, people: 1, status: 'Not Started', progress: 0, description: 'Read fault log history, check operational status, and inspect ventilation/heatsinks.' },
            { id: 'sp8', name: 'String Voltage Testing', estimatedHours: 2, people: 1, status: 'Not Started', progress: 0, description: 'Measure open circuit voltage and short circuit current on each solar string.' }
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
    const status = (i === 0) ? 'Scheduled' : (i === 1) ? 'In Progress' : (i === 2) ? 'Pending' : randomItem(statuses);
    const contractorId = (i === 0 || i === 1) ? 'cont_1' : (i === 2) ? 'cont_2' : null;
    
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
      contractorId,
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
          assignedContractorIds: (i === 2) ? ['cont_1'] : [],
          subTasks: [
            { id: 'sp1', name: 'Safety Audit', status: status === 'Pending' ? 'Not Started' : 'Completed', progress: status === 'Pending' ? 0 : 100, estimatedHours: 1, people: 1, assignedContractorIds: (i === 2) ? ['cont_1'] : [] },
            { id: 'sp2', name: 'Site Setup', status: status === 'Pending' ? 'Not Started' : 'Completed', progress: status === 'Pending' ? 0 : 100, estimatedHours: 3, people: 1, assignedContractorIds: (i === 2) ? ['cont_1'] : [] }
          ]
        },
        { 
          id: 'p2', 
          name: 'Installation Phase', 
          status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Not Started'), 
          progress: (status === 'Completed' || status === 'Invoiced') ? 100 : (status === 'In Progress' ? 50 : 0),
          estimatedHours: 12,
          people: 2,
          assignedContractorIds: (i === 2) ? ['cont_2'] : [],
          subTasks: [
            { id: 'sp3', name: 'Main Installation', status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : (status === 'In Progress' ? 'In Progress' : 'Not Started'), progress: (status === 'Completed' || status === 'Invoiced') ? 100 : (status === 'In Progress' ? 100 : 0), estimatedHours: 8, people: 2, assignedContractorIds: (i === 2) ? ['cont_2'] : [] },
            { id: 'sp4', name: 'Final Commissioning', status: (status === 'Completed' || status === 'Invoiced') ? 'Completed' : 'Not Started', progress: (status === 'Completed' || status === 'Invoiced') ? 100 : 0, estimatedHours: 4, people: 2, assignedContractorIds: (i === 2) ? ['cont_2'] : [] }
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

  return items.map((item, i) => {
    const possibleLocs = [
      'Warehouse A', 'Warehouse B', 'Main Warehouse',
      'Vehicle - Mark Sullivan', 'Vehicle - Jake Patterson', 'Vehicle - Ryan Cooper'
    ];
    
    const numLocs = Math.floor(Math.random() * 2) + 2; // 2 or 3 locations
    const shuffled = [...possibleLocs].sort(() => 0.5 - Math.random());
    const itemLocs = shuffled.slice(0, numLocs).map(loc => ({
      location: loc,
      quantity: Math.floor(Math.random() * 60) + 5
    }));

    const totalQty = itemLocs.reduce((sum, l) => sum + l.quantity, 0);

    return {
      id: `stock_${i + 1}`,
      name: item.name,
      sku: `SKU-${String(1000 + i)}`,
      category: item.cat,
      unit: item.unit,
      unitPrice: item.price,
      costPrice: item.price * 0.6,
      quantity: totalQty,
      reorderLevel: Math.floor(Math.random() * 20) + 5,
      supplier: randomItem(['ElectraTrade', 'PipeLine Supply', 'CoolParts Wholesale', 'SafeGuard Dist.', 'AllTrade Supplies']),
      location: itemLocs[0].location,
      locations: itemLocs,
      createdAt: randomDate(365),
      updatedAt: randomDate(30),
    };
  });
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

function generateSuppliers() {
  return [
    {
      id: 'sup_1',
      name: 'ElectraTrade',
      contactName: 'Robert Vance',
      email: 'sales@electratrade.com.au',
      phone: '03 9822 1045',
      address: '22 Industrial Parkway, South Melbourne, VIC 3205',
      category: 'Electrical',
      accountNumber: 'FF-ET-10291',
      paymentTerms: '30 Days',
      active: true,
      notes: 'Primary supplier for electrical switchgear, cable, and general conduit fittings.',
      attachments: [
        { id: 'att_sup_1_1', name: 'ElectraTrade_Price_List_2026.pdf', type: 'application/pdf', size: 1245000, uploadedAt: '2026-01-10T08:00:00Z', url: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }
      ]
    },
    {
      id: 'sup_2',
      name: 'PipeLine Supply',
      contactName: 'Douglas Miller',
      email: 'orders@pipelinesupply.com.au',
      phone: '03 9544 3300',
      address: '108 Pipeline Rd, Richmond, VIC 3121',
      category: 'Plumbing',
      accountNumber: 'FF-PL-99401',
      paymentTerms: '14 Days',
      active: true,
      notes: 'Main plumbing merchant. Provides rapid morning deliveries to metro sites.',
      attachments: [
        { id: 'att_sup_2_1', name: 'PipeLine_Product_Brochure.pdf', type: 'application/pdf', size: 3450000, uploadedAt: '2026-02-15T09:30:00Z', url: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }
      ]
    },
    {
      id: 'sup_3',
      name: 'CoolParts Wholesale',
      contactName: 'Amanda Jenkins',
      email: 'amanda@coolparts.com.au',
      phone: '03 9711 5050',
      address: '45 Cold Storage Lane, Clayton, VIC 3168',
      category: 'HVAC',
      accountNumber: 'FF-CP-39021',
      paymentTerms: '30 Days',
      active: true,
      notes: 'HVAC compressors, copper coils, ducting components, and split system units.',
      attachments: []
    },
    {
      id: 'sup_4',
      name: 'SafeGuard Dist.',
      contactName: 'Sarah Conner',
      email: 'wholesale@safeguard.com.au',
      phone: '03 8990 1200',
      address: '90 Security Plaza, Collingwood, VIC 3066',
      category: 'Fire Safety',
      accountNumber: 'FF-SG-88301',
      paymentTerms: 'COD',
      active: true,
      notes: 'Preferred supplier for smoke alarms, commercial fire panel zone cards, and extinguishers.',
      attachments: [
        { id: 'att_sup_4_1', name: 'SafeGuard_Compliance_Certificate.pdf', type: 'application/pdf', size: 954000, uploadedAt: '2026-03-01T10:15:00Z', url: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }
      ]
    },
    {
      id: 'sup_5',
      name: 'AllTrade Supplies',
      contactName: 'Kevin Higgins',
      email: 'kevin@alltradesupplies.com.au',
      phone: '03 9205 6000',
      address: '15-19 Warehouse Lane, Dandenong, VIC 3175',
      category: 'General',
      accountNumber: 'FF-AT-22340',
      paymentTerms: '30 Days',
      active: true,
      notes: 'Consumables, cable ties, silicone, fasteners, and miscellaneous hand tools.',
      attachments: []
    }
  ];
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
  if (localStorage.getItem('simpro__prevent_seeding') === 'true') {
    // Ensure default userTypes and technicians exist so they can still log in and use the blank state
    const existingTypes = store.getAll('userTypes');
    if (!existingTypes || existingTypes.length === 0) {
      seedUserTypes();
    }
    const existingTechs = store.getAll('technicians');
    if (!existingTechs || existingTechs.length === 0) {
      store.save('technicians', technicians);
    }
    return;
  }

  if (store.isSeeded()) {
    // Self-healing migration for Maintenance Plans
    const existingPlans = store.getAll('maintenancePlans');
    if (!existingPlans || existingPlans.length === 0) {
      const samplePlans = [
        {
          id: 'maint_1',
          name: 'Routine Carrier Chiller Servicing',
          assetId: 'asset_4', // Carrier Chiller Unit
          quoteId: 'quote_1',
          triggerType: 'Calendar',
          frequency: 'Quarterly',
          meterInterval: null,
          lastTriggeredMeter: 0,
          nextServiceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
          lastNotificationDate: null,
          status: 'Active'
        },
        {
          id: 'maint_2',
          name: 'Toyota Hilux 10k Service Plan',
          assetId: 'asset_1', // Toyota Hilux 2022
          quoteId: 'quote_2',
          triggerType: 'Meter',
          frequency: null,
          meterInterval: 10000,
          lastTriggeredMeter: 34000,
          lastNotificationDate: null,
          status: 'Active'
        }
      ];
      store.save('maintenancePlans', samplePlans);
    }

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
                else if (['Invoices', 'Purchase Orders', 'Suppliers'].includes(module) && key === 'delete') mPerm[key] = false;
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

    // Ensure contractors exist and have compliance data
    const currentContractors = store.getAll('contractors');
    const hasCompliance = currentContractors.some(c => c.complianceDocs && c.complianceDocs.length > 0);
    if (!currentContractors || currentContractors.length === 0 || !hasCompliance) {
      store.save('contractors', generateContractors());
    }

    // Ensure suppliers exist
    const currentSuppliers = store.getAll('suppliers');
    if (!currentSuppliers || currentSuppliers.length === 0) {
      store.save('suppliers', generateSuppliers());
    }

    // Schema Migration: Migrate flat stock to nested locations format
    const existingStock = store.getAll('stock');
    const needsStockMigration = existingStock.some(s => !s.locations || !Array.isArray(s.locations));
    if (needsStockMigration) {
      const grouped = {};
      existingStock.forEach(item => {
        const key = item.sku || item.name;
        if (!grouped[key]) {
          grouped[key] = {
            ...item,
            locations: item.locations && Array.isArray(item.locations) ? [...item.locations] : []
          };
        }
        
        if (!item.locations || !Array.isArray(item.locations)) {
          const locName = item.location || 'Main Warehouse';
          const qty = parseInt(item.quantity) || 0;
          const existingLoc = grouped[key].locations.find(l => l.location === locName);
          if (existingLoc) {
            existingLoc.quantity += qty;
          } else {
            grouped[key].locations.push({ location: locName, quantity: qty });
          }
        } else {
          item.locations.forEach(l => {
            const existingLoc = grouped[key].locations.find(x => x.location === l.location);
            if (existingLoc) {
              existingLoc.quantity += l.quantity;
            } else {
              grouped[key].locations.push({ ...l });
            }
          });
        }
      });
      
      const migratedStock = Object.values(grouped).map(item => {
        item.quantity = item.locations.reduce((sum, l) => sum + l.quantity, 0);
        item.location = item.locations[0]?.location || 'Main Warehouse';
        return item;
      });
      
      store.save('stock', migratedStock);
    }

    // Self-healing migration: Ensure all existing jobs and task templates have task descriptions populated
    const jobsForPortal = store.getAll('jobs');
    let jobsUpdated = false;
    
    const defaultTaskDescriptions = {
      'Site Preparation': 'Establish site perimeter, prepare tools, and ensure safety barriers are erected.',
      'Safety Audit': 'Perform JSA/SWMS audit, verify PPE, and sign off the site hazard checklist.',
      'Site Setup': 'Lay down drop sheets, set up safety signage, and deploy service vehicles.',
      'Project Execution': 'Execute primary wiring, mount physical hardware components, and run routing paths.',
      'Installation Phase': 'Execute primary wiring, mount physical hardware components, and run routing paths.',
      'Main Installation': 'Fit electrical panels, run armored cabling, connect central distribution points.',
      'Final Commissioning': 'Perform insulation resistance checks, load tests, and sign off safety compliance reports.',
      'Installation': 'Fit electrical panels, run armored cabling, connect central distribution points.',
      'Cleanup & Handover': 'Perform insulation resistance checks, load tests, and sign off safety compliance reports.'
    };

    function ensureDescription(node) {
      let updated = false;
      if (!node.description) {
        node.description = defaultTaskDescriptions[node.name] || `Standard operational procedures, verification checks, and safety guidelines for "${node.name}".`;
        updated = true;
      }
      if (node.subTasks) {
        node.subTasks.forEach(st => {
          if (ensureDescription(st)) updated = true;
        });
      }
      return updated;
    }

    // Self-healing migration: Ensure at least some jobs are assigned to the subcontractors for portal display
    const hasAssignedContractor = jobsForPortal.some(j => j.contractorId === 'cont_1' || j.contractorId === 'cont_2');
    if (!hasAssignedContractor && jobsForPortal.length >= 3) {
      jobsForPortal[0].contractorId = 'cont_1';
      jobsForPortal[0].status = 'Scheduled';
      jobsForPortal[1].contractorId = 'cont_1';
      jobsForPortal[1].status = 'In Progress';
      jobsForPortal[2].contractorId = 'cont_2';
      jobsForPortal[2].status = 'Pending';
      
      // Assign granular task in Job 3 to cont_1
      if (jobsForPortal[2].tasks && jobsForPortal[2].tasks[0]) {
        jobsForPortal[2].tasks[0].assignedContractorIds = ['cont_1'];
        if (jobsForPortal[2].tasks[0].subTasks) {
          jobsForPortal[2].tasks[0].subTasks.forEach(st => {
            st.assignedContractorIds = ['cont_1'];
          });
        }
      }
      jobsUpdated = true;
    }

    const jobsForPortalUpdated = jobsForPortal.map(job => {
      let jobUpdated = false;
      if (job.tasks) {
        job.tasks.forEach(t => {
          if (ensureDescription(t)) jobUpdated = true;
        });
      }
      if (jobUpdated) jobsUpdated = true;
      return job;
    });

    if (jobsUpdated) {
      store.save('jobs', jobsForPortalUpdated);
    }

    // Also migrate task templates!
    const templatesForPortal = store.getAll('taskTemplates');
    let templatesUpdated = false;
    const templatesForPortalUpdated = templatesForPortal.map(tmpl => {
      let tmplUpdated = false;
      if (tmpl.tasks) {
        tmpl.tasks.forEach(t => {
          if (ensureDescription(t)) tmplUpdated = true;
        });
      }
      if (tmplUpdated) templatesUpdated = true;
      return tmpl;
    });

    if (templatesUpdated) {
      store.save('taskTemplates', templatesForPortalUpdated);
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
  store.save('maintenancePlans', [
    {
      id: 'maint_1',
      name: 'Routine Carrier Chiller Servicing',
      assetId: 'asset_4', // Carrier Chiller Unit
      quoteId: 'quote_1',
      triggerType: 'Calendar',
      frequency: 'Quarterly',
      meterInterval: null,
      lastTriggeredMeter: 0,
      nextServiceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastNotificationDate: null,
      status: 'Active'
    },
    {
      id: 'maint_2',
      name: 'Toyota Hilux 10k Service Plan',
      assetId: 'asset_1', // Toyota Hilux 2022
      quoteId: 'quote_2',
      triggerType: 'Meter',
      frequency: null,
      meterInterval: 10000,
      lastTriggeredMeter: 34000,
      lastNotificationDate: null,
      status: 'Active'
    }
  ]);
  store.save('schedule', scheduleBlocks);
  store.save('technicians', technicians);
  store.save('taskTemplates', generateTaskTemplates());
  store.save('formTemplates', templates);
  store.save('formInstances', []);
  store.save('contractors', generateContractors());
  store.save('suppliers', generateSuppliers());

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

export function seedMinimalData() {
  store.clearAll();
  
  // Seed default user types and technicians
  seedUserTypes();
  store.save('technicians', technicians);

  // 1. Customer
  const customer = {
    id: 'cust_1',
    company: 'Acme Corp',
    firstName: 'James',
    lastName: 'Henderson',
    email: 'james@acme.com',
    phone: '0412345678',
    address: '145 King St, Southbank, VIC 3000',
    status: 'Active',
    type: 'Company',
    notes: 'Primary test account.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sites: [{ name: 'Main Office', address: '145 King St, Southbank, VIC 3000' }],
    contacts: [{ name: 'James Henderson', role: 'Primary', email: 'james@acme.com', phone: '0412345678' }]
  };
  store.save('customers', [customer]);

  // 2. Lead
  const lead = {
    id: 'lead_1',
    title: 'Commercial Switchboard Upgrade',
    customerId: 'cust_1',
    customerName: 'Acme Corp',
    contactName: 'James Henderson',
    status: 'New',
    source: 'Website',
    value: 4500,
    description: 'Standard industrial switchboard upgrade for main office.',
    priority: 'High',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.save('leads', [lead]);

  // 3. Quote
  const quote = {
    id: 'quote_1',
    number: 'Q-2026001',
    customerId: 'cust_1',
    customerName: 'Acme Corp',
    contactName: 'James Henderson',
    title: 'Electrical Upgrade Quote',
    status: 'Sent',
    lineItems: [
      { description: 'Electrical Labor', type: 'labor', qty: 8, rate: 85, total: 680 },
      { description: 'RCD Safety Switch Kit', type: 'material', qty: 2, rate: 45, total: 90 }
    ],
    subtotal: 770,
    tax: 77,
    total: 847,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Standard quotes terms.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.save('quotes', [quote]);

  // 4. Job
  const job = {
    id: 'job_1',
    number: 'J-100001',
    customerId: 'cust_1',
    customerName: 'Acme Corp',
    contactName: 'James Henderson',
    siteAddress: '145 King St, Southbank, VIC 3000',
    title: 'Main Switchboard Upgrade',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'High',
    technicianId: 'tech1',
    technicianName: 'Mark Sullivan',
    contractorId: null,
    quoteId: 'quote_1',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedHours: 8,
    laborCost: 680,
    materialCost: 90,
    tasks: [
      { 
        id: 'p1', 
        name: 'Site Preparation', 
        status: 'Completed', 
        progress: 100, 
        estimatedHours: 2, 
        people: 1,
        subTasks: [
          { id: 'sp1', name: 'Safety Audit', status: 'Completed', progress: 100, estimatedHours: 1, people: 1 },
          { id: 'sp2', name: 'Site Setup', status: 'Completed', progress: 100, estimatedHours: 1, people: 1 }
        ]
      },
      { 
        id: 'p2', 
        name: 'Installation Phase', 
        status: 'In Progress', 
        progress: 50, 
        estimatedHours: 6, 
        people: 2,
        subTasks: [
          { id: 'sp3', name: 'Main Installation', status: 'In Progress', progress: 50, estimatedHours: 4, people: 2 },
          { id: 'sp4', name: 'Final Commissioning', status: 'Not Started', progress: 0, estimatedHours: 2, people: 2 }
        ]
      }
    ],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.save('jobs', [job]);

  // 5. Invoice
  const invoice = {
    id: 'inv_1',
    number: 'INV-50001',
    jobId: 'job_1',
    jobNumber: 'J-100001',
    customerId: 'cust_1',
    customerName: 'Acme Corp',
    contactName: 'James Henderson',
    status: 'Sent',
    lineItems: [
      { description: 'Main Switchboard Upgrade - Labor', amount: 680 },
      { description: 'Main Switchboard Upgrade - Materials', amount: 90 }
    ],
    subtotal: 770,
    tax: 77,
    total: 847,
    invoiceType: 'Standard',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidDate: null,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.save('invoices', [invoice]);

  // 6. Stock
  const stock = {
    id: 'stock_1',
    name: 'LED Downlight 10W',
    sku: 'SKU-1001',
    category: 'Electrical',
    unit: 'each',
    unitPrice: 18.50,
    costPrice: 11.00,
    quantity: 45,
    reorderLevel: 10,
    supplier: 'ElectraTrade',
    location: 'Main Warehouse',
    locations: [{ location: 'Main Warehouse', quantity: 45 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.save('stock', [stock]);

  // 7. Asset
  const asset = {
    id: 'asset_1',
    name: 'Toyota Hilux 2022',
    type: 'Vehicle',
    serial: 'REG-123-FF',
    ownerType: 'Business',
    recoveryRate: 25.00,
    serviceIntervalMonths: 6,
    currentMeter: 45000,
    status: 'Active',
    logs: [
      { id: 'log_1_1', type: 'Service', date: new Date().toISOString(), technicianName: 'Jake Patterson', cost: 250, notes: 'Routine check' }
    ]
  };
  store.save('assets', [asset]);

  // 8. Maintenance Plan
  const plan = {
    id: 'maint_1',
    name: 'Toyota Hilux 10k Service Plan',
    assetId: 'asset_1',
    triggerType: 'Meter',
    frequency: null,
    meterInterval: 10000,
    lastTriggeredMeter: 40000,
    lastNotificationDate: null,
    status: 'Active'
  };
  store.save('maintenancePlans', [plan]);

  // 9. Schedule
  const schedule = {
    id: 'sched_1',
    jobId: 'job_1',
    jobNumber: 'J-100001',
    title: 'Main Switchboard Upgrade',
    technicianId: 'tech1',
    technicianName: 'Mark Sullivan',
    color: '#3B82F6',
    dayOffset: 0,
    startHour: 8,
    endHour: 16,
    customerName: 'Acme Corp',
    siteAddress: '145 King St, Southbank, VIC 3000'
  };
  store.save('schedule', [schedule]);

  // 10. Form templates
  store.seedFormTemplates();

  // 11. Form instances
  store.save('formInstances', []);

  // 12. Contractors
  const contractor = {
    id: 'cont_1',
    businessName: 'EcoVolt Electrical Services',
    contactName: 'Elena Rostova',
    email: 'elena@ecovoltelectrical.com.au',
    phone: '0498 765 432',
    licenseNumber: 'LIC-EL-88390',
    active: true,
    hourlyRate: 95,
    afterHoursRate: 142.5,
    calloutFee: 85,
    specialties: ['Solar PV Installation', 'Switchboard Upgrades'],
    notes: 'Preferred subcontractor.',
    portalToken: 'c_pt_ecovolt',
    complianceDocs: [
      { id: 'doc_1', type: 'Public Liability Insurance', number: 'PL-992110-A', expiryDate: '2026-10-15', verified: true, notes: 'Cover up to $20M' }
    ]
  };
  store.save('contractors', [contractor]);

  // 13. Suppliers
  const supplier = {
    id: 'sup_1',
    name: 'ElectraTrade',
    contactName: 'Robert Vance',
    email: 'sales@electratrade.com.au',
    phone: '03 9822 1045',
    address: '22 Industrial Parkway, South Melbourne, VIC 3205',
    category: 'Electrical',
    accountNumber: 'FF-ET-10291',
    paymentTerms: '30 Days',
    active: true,
    notes: 'Primary supplier.',
    attachments: []
  };
  store.save('suppliers', [supplier]);

  // 14. Activity
  const activity = {
    id: 'act_1',
    title: 'Site inspection — Southbank',
    type: 'site-visit',
    date: new Date().toISOString().split('T')[0],
    time: '13:00',
    duration: 120,
    priority: 'normal',
    status: 'pending',
    assignedToId: 'tech1',
    linkedType: 'job',
    linkedId: 'job_1',
    linkedLabel: 'Job J-100001',
    notes: 'Verify panel wiring integrity.'
  };
  store.save('activities', [activity]);

  // Seed task templates
  store.save('taskTemplates', generateTaskTemplates());

  // Remove prevent seeding so full demo data can be restored later if wanted
  localStorage.removeItem('simpro__prevent_seeding');
  store.markSeeded();
}

export { technicians };

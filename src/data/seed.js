// ============================================
// FIELDFORGE — SEED DATA (APEX POWER SERVICES)
// ============================================

import { store } from './store.js';
import { MODULE_PERMS } from '../utils/permissions.js';

// ---- Granular permissions helper ----
function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

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
      if (mod === 'Settings') return ['view', 'edit_company', 'manage_tax'].includes(key);
      return true;
    }),
  },
  {
    id: 'ut_tech',
    name: 'Technician',
    description: 'Field staff — limited to their own jobs, schedule and timesheets',
    permissions: buildGranularPerms((mod, key) => {
      if (mod === 'Dashboard') return key === 'view';
      if (mod === 'Schedule') return ['view', 'view_own', 'edit'].includes(key);
      if (mod === 'Quotes') return ['view', 'create', 'edit', 'delete', 'approve', 'convert', 'generate_pdf'].includes(key);
      if (mod === 'Jobs') {
        return ['view', 'create', 'edit', 'delete', 'book_time', 'view_invoices_tab', 'create_invoice', 'manage_tasks', 'view_timesheets_tab', 'manage_materials'].includes(key);
      }
      if (mod === 'Invoices') return ['view', 'create', 'send', 'void'].includes(key);
      if (mod === 'Customers') return ['view', 'create', 'edit', 'delete', 'manage_contacts'].includes(key);
      if (mod === 'Assets') return ['view', 'create', 'edit', 'delete'].includes(key);
      if (mod === 'Stock') return ['view', 'create', 'edit', 'delete'].includes(key);
      if (mod === 'Purchase Orders') return ['view', 'create', 'approve'].includes(key);
      if (mod === 'Timesheets') return ['view_own', 'view', 'create', 'edit_all'].includes(key);
      if (mod === 'Settings') return ['view', 'edit_company'].includes(key);
      if (mod === 'Documents') return ['view', 'upload'].includes(key);
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
      if (['Invoices', 'Purchase Orders', 'Suppliers'].includes(mod) && key === 'delete') return false;
      return true;
    }),
  },
];

// Helper to calculate exact seed dates relative to today (May 27, 2026)
function relativeDate(days) {
  const base = new Date('2026-05-27T10:00:00Z');
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function relativeDateString(days) {
  const base = new Date('2026-05-27T00:00:00Z');
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

// Reusable Task Lists
const taskTemplates = [
  {
    id: 'tmpl_minor_250',
    name: 'Generator Minor Service (250hr)',
    description: 'Minor service and general operations checklist.',
    tags: ['Generator', 'Minor', 'Electrical'],
    tasks: [
      { id: 'p1', name: 'Minor Inspection', status: 'Not Started', progress: 0, description: 'Perform checklist inspection.', subTasks: [
        { id: 'sp1', name: 'Check and record hour meter reading', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp2', name: 'Check oil level and condition — change if required', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp3', name: 'Replace oil filter', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp4', name: 'Check fuel level and fuel system for leaks', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp5', name: 'Check coolant level and inhibitor concentration', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp6', name: 'Check air filter — replace if required', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp7', name: 'Check battery voltage and terminals', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp8', name: 'Check belts and hoses for wear', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp9', name: 'Check exhaust system for leaks', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp10', name: 'Run generator under load for 15 minutes', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp11', name: 'Record all readings in service sheet', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 }
      ]}
    ]
  },
  {
    id: 'tmpl_std_500',
    name: 'Generator Standard Service (500hr)',
    description: 'Comprehensive mid-interval service checklist.',
    tags: ['Generator', 'Standard', 'Service'],
    tasks: [
      { id: 'p2', name: 'Standard Maintenance', status: 'Not Started', progress: 0, description: 'Perform full service.', subTasks: [
        { id: 'sp12', name: 'All Minor Service tasks', estimatedHours: 2.0, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp13', name: 'Replace fuel filter', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp14', name: 'Replace air filter', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp15', name: 'Flush and replace coolant', estimatedHours: 1.0, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp16', name: 'Check and adjust valve clearances', estimatedHours: 1.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp17', name: 'Inspect and clean alternator', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp18', name: 'Check automatic transfer switch operation', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp19', name: 'Check and tighten all electrical connections', estimatedHours: 0.5, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp20', name: 'Load bank test at 100% rated capacity for 30 minutes', estimatedHours: 1.0, people: 1, status: 'Not Started', progress: 0 },
        { id: 'sp21', name: 'Complete compliance certificate', estimatedHours: 0.25, people: 1, status: 'Not Started', progress: 0 }
      ]}
    ]
  },
  {
    id: 'tmpl_overhaul',
    name: 'Annual Overhaul & Load Bank Test',
    description: 'Major overhaul, load bank, and compliance certification.',
    tags: ['Generator', 'Major', 'Overhaul'],
    tasks: [
      { id: 'p3', name: 'Major Overhaul', status: 'Not Started', progress: 0, description: 'Perform major components inspection and replacement.', subTasks: [
        { id: 'sp22', name: 'All Standard Service tasks', estimatedHours: 5.0, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp23', name: 'Full engine inspection', estimatedHours: 1.5, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp24', name: 'Replace all belts and hoses', estimatedHours: 1.0, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp25', name: 'Inspect and service cooling system', estimatedHours: 1.0, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp26', name: 'Inspect exhaust manifold and flex joints', estimatedHours: 0.5, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp27', name: 'Test and calibrate all protection systems (overcurrent, earth fault, overvoltage)', estimatedHours: 1.5, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp28', name: 'Thermographic scan of switchboard', estimatedHours: 0.5, people: 2, status: 'Not Started', progress: 0 },
        { id: 'sp29', name: 'Complete AS/NZS 3010 compliance documentation', estimatedHours: 0.5, people: 2, status: 'Not Started', progress: 0 }
      ]}
    ]
  }
];

// Helper to copy templates with states
function createJobTasks(templateId, completed = false) {
  const template = taskTemplates.find(t => t.id === templateId);
  if (!template) return [];
  return JSON.parse(JSON.stringify(template.tasks)).map(t => {
    t.status = completed ? 'Completed' : 'Not Started';
    t.progress = completed ? 100 : 0;
    t.subTasks = t.subTasks.map(st => {
      st.status = completed ? 'Completed' : 'Not Started';
      st.progress = completed ? 100 : 0;
      return st;
    });
    return t;
  });
}

// Seeding main execution
export async function seedData(force = false) {
  if (!force && store.isSeeded()) {
    return;
  }
  await store.clearAll();

  // Re-initialize local store to open a fresh database connection!
  await store.initializeLocalStore();

  // Save Settings
  const settings = {
    name: 'Apex Power Services',
    abn: '12 345 678 901',
    phone: '02 5550 0000',
    email: 'admin@apexpowerservices.local',
    domain: 'apexpowerservices.local',
    address: '100 Fictional Plaza, Dubbo NSW 2830',
    website: 'www.apexpowerservices.local',
    logo: null,
    logoSmall: null,
    materialMarkup: {
      defaultPercent: 30,
      minMarkupAmount: 5.00,
      useTiers: true,
      tiers: [
        { upTo: 50, percent: 60 },
        { upTo: 200, percent: 45 },
        { upTo: 1000, percent: 30 },
        { upTo: null, percent: 15 }
      ]
    },
    materialCategories: ['Consumables', 'Filters', 'Mechanical', 'Electrical', 'Service Kits', 'Testing'],
    laborRates: [
      { id: 'rate_1', name: 'Standard Rate',    rate: 145.00, description: 'Normal business hours Mon–Fri', overtimeMultiplier: 1.0,  minCallOutFee: 0, applicableDays: ['Mon','Tue','Wed','Thu','Fri'], activeHours: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33], isDefault: true  },
      { id: 'rate_2', name: 'After Hours Rate', rate: 217.50, description: 'Evenings and early mornings',      overtimeMultiplier: 1.5,  minCallOutFee: 50, applicableDays: ['Mon','Tue','Wed','Thu','Fri'], activeHours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,34,35,36,37,38,39,40,41,42,43,44,45,46,47], isDefault: false },
      { id: 'rate_3', name: 'Emergency Rate',   rate: 290.00, description: 'Urgent call-outs any day',        overtimeMultiplier: 2.0,  minCallOutFee: 120, applicableDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','PH'], activeHours: Array.from({length:48}, (_,i)=>i), isDefault: false }
    ]
  };
  await store.saveSettings(settings);

  // Generate 5 of everything (Procedural Generator)
  const techniciansList = [
    { id: 'tech_1', name: 'Adam West',      role: 'Senior Electrician',     color: '#3B82F6', userTypeId: 'ut_admin',   payRate: 95.00,  email: 'adam.west@apexpowerservices.local',     phone: '0491 570 001' },
    { id: 'tech_2', name: 'Burt Ward',      role: 'Service Manager',        color: '#10B981', userTypeId: 'ut_manager', payRate: 85.00,  email: 'burt.ward@apexpowerservices.local',     phone: '0491 570 002' },
    { id: 'tech_3', name: 'Diana Prince',   role: 'Electrician',            color: '#8B5CF6', userTypeId: 'ut_tech',    payRate: 80.00,  email: 'diana.prince@apexpowerservices.local',  phone: '0491 570 003' },
    { id: 'tech_4', name: 'Clark Kent',     role: 'Office Administrator',   color: '#F59E0B', userTypeId: 'ut_office',  payRate: 50.00,  email: 'clark.kent@apexpowerservices.local',    phone: '0491 570 004' },
    { id: 'tech_5', name: 'Liam Vance',     role: 'Electrician Apprentice', color: '#EC4899', userTypeId: 'ut_tech',    payRate: 40.00,  email: 'liam.vance@apexpowerservices.local',    phone: '0491 570 005' }
  ];

  const stockList = [
    { id: 'st_1', name: 'Engine Oil 15W-40 20L', sku: 'SKU-ST1', qty: 120, costPrice: 85, unitPrice: 120, unit: 'Each', category: 'Consumables' },
    { id: 'st_2', name: 'Oil Filter — Cat 3306', sku: 'SKU-ST2', qty: 85, costPrice: 45, unitPrice: 75, unit: 'Each', category: 'Filters' },
    { id: 'st_3', name: 'ATS Control Board', sku: 'SKU-ST3', qty: 15, costPrice: 420, unitPrice: 680, unit: 'Each', category: 'Electrical' },
    { id: 'st_4', name: 'Battery 12V 100Ah AGM', sku: 'SKU-ST4', qty: 40, costPrice: 185, unitPrice: 280, unit: 'Each', category: 'Electrical' },
    { id: 'st_5', name: 'Coolant Concentrate 5L', sku: 'SKU-ST5', qty: 60, costPrice: 55, unitPrice: 85, unit: 'Each', category: 'Consumables' }
  ];

  const customerNames = [
    {
      company: 'Starlight Logistics Pty Ltd',
      first: 'Daniel',
      last: 'Carter',
      email: 'd.carter@starlight-logistics.example.com',
      phone: '02 5550 0110',
      address: '14 Industrial Lane, Dubbo NSW 2830',
      contacts: [
        { name: 'Amy Vance', role: 'Operations Manager', email: 'a.vance@starlight-logistics.example.com', phone: '0491 570 156' },
        { name: 'Gary Thorne', role: 'Warehouse Supervisor', email: 'g.thorne@starlight-logistics.example.com', phone: '0491 570 157' },
        { name: 'Jessica Miller', role: 'Facilities Coordinator', email: 'j.miller@starlight-logistics.example.com', phone: '0491 570 158' },
        { name: 'Marcus Brody', role: 'Safety Inspector', email: 'm.brody@starlight-logistics.example.com', phone: '0491 570 159' },
        { name: 'Helen Hunt', role: 'Procurement Specialist', email: 'h.hunt@starlight-logistics.example.com', phone: '0491 570 160' }
      ],
      sites: [
        { name: 'Primary Distribution Hub', address: '14 Industrial Lane, Dubbo NSW 2830', notes: 'Main warehouse with double-loading dock.' },
        { name: 'Cold Storage Facility', address: '45 Depot Road, Dubbo NSW 2830', notes: 'Access via back gate PIN 4910#.' },
        { name: 'Overflow Storage Yard', address: '12 Boundary Road, Brocklehurst NSW 2830', notes: 'Key inside lockbox near main fence.' },
        { name: 'Dubbo Office Suites', address: '100 Macquarie Street, Dubbo NSW 2830', notes: 'Level 1 reception.' },
        { name: 'Wellington Logistics Yard', address: '7 Railway Siding, Wellington NSW 2820', notes: 'Watch for moving vehicles.' }
      ]
    },
    {
      company: 'Beacon Manufacturing Group',
      first: 'Sarah',
      last: 'Jenkins',
      email: 's.jenkins@beacon-mfg.example.com',
      phone: '02 5550 0120',
      address: '88 Factory Road, Orange NSW 2800',
      contacts: [
        { name: 'Arthur Pendelton', role: 'Factory Manager', email: 'a.pendelton@beacon-mfg.example.com', phone: '0491 570 171' },
        { name: 'Clara Oswald', role: 'Maintenance Electrician', email: 'c.oswald@beacon-mfg.example.com', phone: '0491 570 172' },
        { name: 'Danny Pink', role: 'Safety Coordinator', email: 'd.pink@beacon-mfg.example.com', phone: '0491 570 173' },
        { name: 'Kate Stewart', role: 'Engineering Director', email: 'k.stewart@beacon-mfg.example.com', phone: '0491 570 174' },
        { name: 'Rory Williams', role: 'Dispatch Lead', email: 'r.williams@beacon-mfg.example.com', phone: '0491 570 175' }
      ],
      sites: [
        { name: 'Main Fabrication Factory', address: '88 Factory Road, Orange NSW 2800', notes: 'High voltage area. Wear PPE.' },
        { name: 'Assembly Plant 2', address: '90 Factory Road, Orange NSW 2800', notes: 'Service elevator access only.' },
        { name: 'Research & Development Lab', address: '12 Science Drive, Orange NSW 2800', notes: 'Biometric security on entrance.' },
        { name: 'Orange Logistics Depot', address: '20 Industry Way, Orange NSW 2800', notes: 'No parking in delivery bays.' },
        { name: 'Sydney Distribution Point', address: '22 Huntley Street, Alexandria NSW 2015', notes: 'Call coordinator on arrival.' }
      ]
    },
    {
      company: 'Vanguard Property Management',
      first: 'Michael',
      last: 'Chang',
      email: 'm.chang@vanguard-properties.example.com',
      phone: '02 5550 0130',
      address: '101 Corporate Avenue, Sydney NSW 2000',
      contacts: [
        { name: 'Alice Smith', role: 'Property Portfolio Manager', email: 'a.smith@vanguard-properties.example.com', phone: '0491 570 181' },
        { name: 'Bob Jones', role: 'Senior Building Manager', email: 'b.jones@vanguard-properties.example.com', phone: '0491 570 182' },
        { name: 'Charlie Brown', role: 'Facilities Admin', email: 'c.brown@vanguard-properties.example.com', phone: '0491 570 183' },
        { name: 'Diana Prince', role: 'Commercial Leasing Agent', email: 'd.prince@vanguard-properties.example.com', phone: '0491 570 184' },
        { name: 'Evan Wright', role: 'Operations Assistant', email: 'e.wright@vanguard-properties.example.com', phone: '0491 570 185' }
      ],
      sites: [
        { name: 'Dubbo Commercial Complex', address: '80 Wingewarra Street, Dubbo NSW 2830', notes: 'Multiple retail tenants.' },
        { name: 'Orange Medical Centre', address: '150 Anson Street, Orange NSW 2800', notes: 'Requires clean room protocol.' },
        { name: 'Bathurst Business Park', address: '12 Research Drive, Bathurst NSW 2795', notes: 'Secure key safe on site.' },
        { name: 'Alexandria Office Hub', address: '44 O\'Riordan Street, Alexandria NSW 2015', notes: 'Intercom 4B.' },
        { name: 'North Sydney Retail Plaza', address: '100 Miller Street, North Sydney NSW 2060', notes: 'Loading dock via side street.' }
      ]
    },
    {
      company: 'Pinnacle Retail Solutions',
      first: 'Emily',
      last: 'Watson',
      email: 'e.watson@pinnacle-retail.example.com',
      phone: '02 5550 0140',
      address: '55 High Street, Mudgee NSW 2850',
      contacts: [
        { name: 'Frank Miller', role: 'Centre Manager', email: 'f.miller@pinnacle-retail.example.com', phone: '0491 570 191' },
        { name: 'Grace Kelly', role: 'Assistant Centre Manager', email: 'g.kelly@pinnacle-retail.example.com', phone: '0491 570 192' },
        { name: 'Henry Higgins', role: 'Operations Lead', email: 'h.higgins@pinnacle-retail.example.com', phone: '0491 570 193' },
        { name: 'Iris West', role: 'Marketing Director', email: 'i.west@pinnacle-retail.example.com', phone: '0491 570 194' },
        { name: 'John Stewart', role: 'Night Operations Supervisor', email: 'j.stewart@pinnacle-retail.example.com', phone: '0491 570 195' }
      ],
      sites: [
        { name: 'Mudgee Shopping Mall', address: '55 High Street, Mudgee NSW 2850', notes: 'Access outside retail hours via rear door.' },
        { name: 'Dubbo Retail Strip', address: '210 Cobra Street, Dubbo NSW 2830', notes: 'Front of house maintenance.' },
        { name: 'Orange Homemaker Centre', address: '10 Industry Rd, Orange NSW 2800', notes: 'Loading dock clearance 4.5m.' },
        { name: 'Lithgow Shopping Centre', address: '80 Main Street, Lithgow NSW 2790', notes: 'Keys at main office.' },
        { name: 'Parkes Retail Outlet', address: '33 Clarinda Street, Parkes NSW 2870', notes: 'Contact centre manager on arrival.' }
      ]
    },
    {
      company: 'Summit Agri-Business Pty Ltd',
      first: 'Robert',
      last: 'O\'Connor',
      email: 'r.oconnor@summit-agri.example.com',
      phone: '02 5550 0150',
      address: 'Rural Route 4, Narromine NSW 2821',
      contacts: [
        { name: 'Kevin Flynn', role: 'Farm Operations Lead', email: 'k.flynn@summit-agri.example.com', phone: '0491 570 211' },
        { name: 'Lois Lane', role: 'Logistics Coordinator', email: 'l.lane@summit-agri.example.com', phone: '0491 570 212' },
        { name: 'Clark Kent', role: 'Field Supervisor', email: 'c.kent@summit-agri.example.com', phone: '0491 570 213' },
        { name: 'Bruce Banner', role: 'Equipment Technician', email: 'b.banner@summit-agri.example.com', phone: '0491 570 214' },
        { name: 'Selina Kyle', role: 'Safety Compliance Officer', email: 's.kyle@summit-agri.example.com', phone: '0491 570 215' }
      ],
      sites: [
        { name: 'Main Homestead Office', address: 'Rural Route 4, Narromine NSW 2821', notes: 'Check in at reception first.' },
        { name: 'Irrigation Pump Station 1', address: 'River Road, Narromine NSW 2821', notes: 'Pump shed keycode: 1212#.' },
        { name: 'Irrigation Pump Station 2', address: 'Back Creek Road, Narromine NSW 2821', notes: 'Key in box next to electrical cabinet.' },
        { name: 'Grain Storage Silos', address: 'Silo Siding Road, Narromine NSW 2821', notes: 'Watch out for heavy farm machinery.' },
        { name: 'Wellington Processing Plant', address: '12 Factory Lane, Wellington NSW 2820', notes: 'High noise area.' }
      ]
    }
  ];

  // 25 unique quote/job scenarios
  const uniqueWorkTemplates = [
    // Starlight Logistics (cust_1)
    {
      title: 'Solar PV Inverter Diagnostics & Repair',
      desc: 'Investigate solar inverter fault codes, perform safety isolation checks, and install a brand-new hybrid inverter unit.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Isolate solar DC inputs and AC outputs', 'Run insulation resistance tests on solar strings', 'Mount new hybrid inverter and configure telemetry'],
      hours: 4, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Emergency DB Board Switch Replacement',
      desc: 'Emergency callout for main distribution board fault causing warehouse lighting circuit to trip under load. Replace faulty switch.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Isolate distribution board sub-circuits', 'Locate and verify faulty switchgear terminals', 'Replace switchgear, re-tension busbars, and restore power'],
      hours: 3, priority: 'Urgent', status: 'Invoiced'
    },
    {
      title: 'Warehouse LED Highbay Retrofit',
      desc: 'Dismantle old mercury vapor lights in bay 3 and install 12 high-efficiency 150W LED highbay units.',
      materials: [{ stockId: 'st_4', name: 'Battery 12V 100Ah AGM', qty: 2, cost: 185, price: 280 }],
      tasks: ['Set up scissor lift inside warehouse bay 3', 'Disconnect and lower old heavy fixtures', 'Install new LED highbays and perform illuminance readings'],
      hours: 8, priority: 'Medium', status: 'Invoiced'
    },
    {
      title: 'New GPO Outlets for Office Partition',
      desc: 'Run additional power drops and install 6 double general-purpose outlets for new office workstations.',
      materials: [{ stockId: 'st_5', name: 'Coolant Concentrate 5L', qty: 1, cost: 55, price: 85 }],
      tasks: ['Map existing circuit loading capacity', 'Route TPS cable down wall cavities', 'Fit wall brackets, mount double GPOs, and verify polarity'],
      hours: 5, priority: 'Low', status: 'Invoiced'
    },
    {
      title: 'Switchboard RCD Compliance Testing',
      desc: 'Mandatory 6-monthly testing of all residual current devices (RCDs) on main and auxiliary electrical panels.',
      materials: [],
      tasks: ['Locate and catalog all safety switches', 'Perform trip time measurements using RCD tester', 'Apply tags and document test compliance logs'],
      hours: 2, priority: 'Medium', status: 'In Progress'
    },

    // Beacon Manufacturing (cust_2)
    {
      title: 'CNC Machine 3-Phase Outlet Install',
      desc: 'Run dedicated 3-phase circular cable from main factory board and install a 32A industrial socket.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Route orange circular cable along overhead cable trays', 'Terminate 3-phase outlet and test phase rotation', 'Commission machine connection with maintenance manager'],
      hours: 6, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Office Split System Aircon Install',
      desc: 'Install a 7.1kW reverse-cycle split system air conditioning system in the main office suite.',
      materials: [{ stockId: 'st_5', name: 'Coolant Concentrate 5L', qty: 2, cost: 55, price: 85 }],
      tasks: ['Core wall for refrigeration line sets', 'Mount indoor unit and place outdoor compressor on bracket', 'Run nitrogen leak test, vacuum lines, and charge refrigerant'],
      hours: 7, priority: 'Medium', status: 'Invoiced'
    },
    {
      title: 'Factory Switchboard Thermal Audit',
      desc: 'Perform full thermographic imaging scan under load on factory distribution switchboards.',
      materials: [],
      tasks: ['Perform infrared scan of switchboard panels under normal factory load', 'Document loose connections or hot spots', 'Produce thermographic inspection report'],
      hours: 4, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Assembly Line Overhead Cable Drops',
      desc: 'Extend ceiling cable drops and wire flexible conduits down to relocated workbenches on the assembly line.',
      materials: [{ stockId: 'st_4', name: 'Battery 12V 100Ah AGM', qty: 1, cost: 185, price: 280 }],
      tasks: ['Isolate overhead sub-board circuits', 'Relocate overhead junction box positions', 'Hang new cable drops with strain reliefs and test outlets'],
      hours: 8, priority: 'Medium', status: 'Invoiced'
    },
    {
      title: 'Air Compressor Starter Relay Repair',
      desc: 'Diagnose industrial compressor failure. Replace burnt contactor switch and starter relay coils.',
      materials: [{ stockId: 'st_2', name: 'Oil Filter — Cat 3306', qty: 1, cost: 45, price: 75 }],
      tasks: ['Trace control circuit fault within starter panel', 'Dismantle faulty contactor assembly', 'Install new starter relay coil and verify compressor start cycle'],
      hours: 3, priority: 'Urgent', status: 'In Progress'
    },

    // Vanguard Property Management (cust_3)
    {
      title: 'Tenancy Sub-metering System Install',
      desc: 'Retrofit smart sub-metering devices inside main commercial riser to monitor individual tenant power.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 2, cost: 420, price: 680 }],
      tasks: ['Mount DIN-rail sub-meters in corridor risers', 'Connect current transformers to tenancy feeders', 'Test wireless gateway communication with central billing'],
      hours: 10, priority: 'Medium', status: 'Invoiced'
    },
    {
      title: 'Medical Suite Clean Room Power Feed',
      desc: 'Provide isolated-earth clean power circuits and medical-grade red GPOs for diagnostics equipment.',
      materials: [{ stockId: 'st_4', name: 'Battery 12V 100Ah AGM', qty: 4, cost: 185, price: 280 }],
      tasks: ['Run dedicated clean earth wire to distribution board', 'Pull shielded cable through sterile wall cavities', 'Terminate medical GPOs and test earth leakage thresholds'],
      hours: 9, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Car Park Motion Sensor LED Upgrade',
      desc: 'Install energy-efficient LED batten fixtures with built-in occupancy sensors in basement parking.',
      materials: [],
      tasks: ['Dismantle old fluorescent fittings', 'Wire in new sensor LED batten units', 'Adjust timer and sensitivity settings for optimal savings'],
      hours: 12, priority: 'Low', status: 'Invoiced'
    },
    {
      title: 'Substation UPS Battery Bank Health Test',
      desc: 'Run load testing and internal cell resistance checks on emergency backup battery systems.',
      materials: [{ stockId: 'st_4', name: 'Battery 12V 100Ah AGM', qty: 2, cost: 185, price: 280 }],
      tasks: ['Check terminal torque on battery strings', 'Log cell internal impedance readings', 'Run controlled load discharge test to verify battery health'],
      hours: 5, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Emergency Lighting statutory Discharge Test',
      desc: 'Mandatory 2-hour discharge test and logbook update for building exit signs and backup lighting.',
      materials: [],
      tasks: ['Trigger manual test switch for emergency lighting circuits', 'Locate and list exit signs that fail to remain illuminated', 'Replace exit sign batteries and sign off compliance logs'],
      hours: 4, priority: 'Medium', status: 'In Progress'
    },

    // Pinnacle Retail Solutions (cust_4)
    {
      title: 'Shopping Mall Auto-Door Power Supply',
      desc: 'Run a new dedicated circuit from distribution board B to the new automatic sliding entrance doors.',
      materials: [{ stockId: 'st_1', name: 'Engine Oil 15W-40 20L', qty: 1, cost: 85, price: 120 }],
      tasks: ['Install dedicated circuit breaker in distribution panel', 'Run overhead steel wire armored cable', 'Wire auto-door control board terminals and verify power supply'],
      hours: 5, priority: 'Medium', status: 'Invoiced'
    },
    {
      title: 'Facade LED Signage Power & Timer',
      desc: 'Install external power feeds and outdoor-rated time clocks to schedule storefront illumination.',
      materials: [],
      tasks: ['Mount IP66 enclosures on storefront facade', 'Route cable from main retail panel', 'Install and program astronomical time clock controller'],
      hours: 4, priority: 'Low', status: 'Invoiced'
    },
    {
      title: 'Retail Switchboard Main Breaker Test',
      desc: 'Conduct secondary current injection testing on the primary 400A circuit breaker.',
      materials: [],
      tasks: ['Perform isolation and lock-out tag-out of main panel', 'Connect secondary injection test kit to breaker terminals', 'Measure breaker trip curves and contact resistance'],
      hours: 6, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Store Room T8 Fluorescent to LED Retrofit',
      desc: 'Dismantle ballast wiring in stock room fluorescent fittings and wire directly for LED tubes.',
      materials: [],
      tasks: ['Isolate lighting circuit and open fixtures', 'Bypass old ballasts and starter terminals', 'Wire sockets directly, install LED tubes, and verify operation'],
      hours: 5, priority: 'Low', status: 'Invoiced'
    },
    {
      title: 'Loading Dock Door Safety Interlocks',
      desc: 'Install emergency-stop buttons and interlock sensors on the main commercial loading dock doors.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Mount emergency stop buttons next to door controls', 'Wire interlock circuits into roller door motors', 'Perform safety sequence tests to confirm immediate cutoff on button press'],
      hours: 6, priority: 'High', status: 'In Progress'
    },

    // Summit Agri-Business (cust_5)
    {
      title: 'Homestead Solar Inverter Swap',
      desc: 'Replace storm-damaged external inverter with a new weather-sealed smart hybrid solar inverter.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Isolate AC solar feed and DC solar string arrays', 'Remove damaged unit and mount new IP65 hybrid inverter', 'Reconnect inputs, seal cable entries, and commission system'],
      hours: 5, priority: 'Medium', status: 'Invoiced'
    },
    {
      title: 'Irrigation Pump 1 Controller Troubleshooting',
      desc: 'Diagnose main river pump failing to start. Investigate pump control circuit and contactor coils.',
      materials: [{ stockId: 'st_5', name: 'Coolant Concentrate 5L', qty: 1, cost: 55, price: 85 }],
      tasks: ['Perform safety checks and open pump control panel', 'Diagnose starter coil failure with insulation tester', 'Replace burnt pump contactor switch and verify pump start'],
      hours: 3, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Irrigation Pump 2 Telemetry Control Cabinet',
      desc: 'Retrofit pump starter box with smart controller and cellular telemetry for remote irrigation management.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Dismantle old manual pump control circuit', 'Install smart controller board and high-gain external antenna', 'Configure control parameters and test remote control via mobile web app'],
      hours: 8, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Grain Silo Overhead Supply Repair',
      desc: 'Replace storm-damaged overhead sub-feed cabling with new heavy-duty XLPE circular wiring.',
      materials: [],
      tasks: ['Isolate silo supply line and secure work area', 'Remove old damaged aerial cable drop', 'Wire new XLPE cable on overhead support cable and test insulation'],
      hours: 7, priority: 'High', status: 'Invoiced'
    },
    {
      title: 'Processing Plant Ventilation Exhaust Fan',
      desc: 'Install power feed and motor isolator switch for a new three-phase exhaust fan in the packaging area.',
      materials: [{ stockId: 'st_3', name: 'ATS Control Board', qty: 1, cost: 420, price: 680 }],
      tasks: ['Install dedicated circuit breaker in plant sub-board', 'Mount motor isolator near fan roof mounting', 'Terminate three-phase connections and verify correct fan rotation direction'],
      hours: 8, priority: 'Medium', status: 'In Progress'
    }
  ];

  const generatedCustomers = [];
  const generatedAssets = [];
  const generatedPlans = [];
  const generatedQuotes = [];
  const generatedJobs = [];
  const generatedInvoices = [];
  const generatedSchedule = [];
  const generatedLeads = [];
  const generatedNotifications = [];

  customerNames.forEach((cData, cIdx) => {
    const custId = `cust_${cIdx + 1}`;
    generatedCustomers.push({
      id: custId,
      company: cData.company,
      firstName: cData.first,
      lastName: cData.last,
      email: cData.email,
      phone: cData.phone,
      address: cData.address,
      status: 'Active',
      type: 'Commercial',
      portalToken: `c_pt_${custId}`,
      contacts: cData.contacts,
      sites: cData.sites,
      createdAt: relativeDate(-120),
      updatedAt: relativeDate(-1)
    });

    // 5 assets per customer
    const assetTypes = ['Generator', 'ATS Panel', 'UPS System', 'Solar System', 'Switchboard'];
    for (let aIdx = 1; aIdx <= 5; aIdx++) {
      const assetId = `asset_${cIdx + 1}_${aIdx}`;
      const assetName = `${cData.company} ${assetTypes[aIdx - 1]} System`;
      const serial = `SN-SYS-${cIdx + 1}-${aIdx}`;
      generatedAssets.push({
        id: assetId,
        name: assetName,
        type: assetTypes[aIdx - 1],
        serial: serial,
        ownerType: 'Customer',
        customerId: custId,
        customerName: cData.company,
        currentMeter: 1200 + aIdx * 300,
        recoveryRate: 25.00,
        status: 'Active',
        logs: []
      });

      // 5 maintenance plans (1 per asset)
      const planId = `plan_${cIdx + 1}_${aIdx}`;
      generatedPlans.push({
        id: planId,
        name: `Service Plan - ${serial}`,
        assetId: assetId,
        assetName: assetName,
        customerId: custId,
        customerName: cData.company,
        frequency: 'Monthly',
        lastCompleted: relativeDate(-15),
        nextDue: relativeDate(15),
        status: 'Active'
      });
    }

    // 5 quotes, jobs, invoices, and schedule blocks per customer
    for (let jIdx = 1; jIdx <= 5; jIdx++) {
      const indexNum = (cIdx * 5) + jIdx;
      const indexStr = String(indexNum).padStart(3, '0');
      
      const quoteId = `q_${indexStr}`;
      const jobId = `job_${indexStr}`;
      const invoiceId = `inv_${indexStr}`;

      const template = uniqueWorkTemplates[indexNum - 1];
      const title = template.title;
      const laborHours = template.hours;
      const laborRate = 145;
      const materialCost = template.materials.reduce((sum, m) => sum + (m.qty * m.price), 0);
      const subtotal = materialCost + (laborHours * laborRate);
      const tax = parseFloat((subtotal * 0.1).toFixed(2));
      const total = parseFloat((subtotal + tax).toFixed(2));

      // 1. Quote
      generatedQuotes.push({
        id: quoteId,
        number: `Q-${indexStr}`,
        customerId: custId,
        customerName: cData.company,
        contactName: `${cData.first} ${cData.last}`,
        title: `${title} - Estimate`,
        status: 'Accepted',
        lineItems: [
          ...template.materials.map(m => ({ description: m.name, type: 'material', qty: m.qty, rate: m.price, total: m.qty * m.price })),
          { description: 'Qualified Service Labor', type: 'labor', qty: laborHours, rate: laborRate, total: laborHours * laborRate }
        ],
        subtotal: subtotal,
        tax: tax,
        total: total,
        validUntil: relativeDateString(30),
        notes: 'Seeded estimate for customer review.',
        createdAt: relativeDate(-45),
        updatedAt: relativeDate(-43)
      });

      // 2. Job
      const assignTechId = `tech_${(jIdx % 5) + 1}`;
      const assignTech = techniciansList.find(t => t.id === assignTechId);
      
      generatedJobs.push({
        id: jobId,
        number: `JOB-${indexStr}`,
        quoteId: quoteId,
        customerId: custId,
        customerName: cData.company,
        contactName: `${cData.first} ${cData.last}`,
        title: title,
        description: template.desc,
        status: template.status,
        priority: template.priority,
        tasks: template.tasks.map((tName, tIdx) => ({
          id: `tsk_${tIdx + 1}`,
          name: tName,
          status: template.status === 'In Progress' ? (tIdx === 0 ? 'Completed' : 'In Progress') : 'Completed',
          completeDate: template.status === 'In Progress' ? null : relativeDate(-5)
        })),
        materials: template.materials.map((m, mIdx) => ({
          id: `mat_${mIdx + 1}`,
          stockId: m.stockId,
          name: m.name,
          qty: m.qty,
          cost: m.cost,
          price: m.price,
          total: m.qty * m.price
        })),
        labor: [
          { id: 'lab_1', rateId: 'rate_1', name: 'Standard Rate', rate: laborRate, hours: laborHours, total: laborHours * laborRate }
        ],
        technicians: [
          { id: assignTech.id, name: assignTech.name, role: assignTech.role, color: assignTech.color }
        ],
        assetIds: [`asset_${cIdx + 1}_${(jIdx % 5) + 1}`],
        notes: '',
        createdAt: relativeDate(-40),
        updatedAt: relativeDate(-5)
      });

      // 3. Invoice (for the first 4 jobs of each customer, making 20 total)
      if (template.status === 'Invoiced') {
        generatedInvoices.push({
          id: invoiceId,
          number: `INV-${indexStr}`,
          jobId: jobId,
          customerId: custId,
          customerName: cData.company,
          title: `Invoice for ${title}`,
          status: 'Paid',
          lineItems: [
            ...template.materials.map(m => ({ description: m.name, type: 'material', qty: m.qty, rate: m.price, total: m.qty * m.price })),
            { description: 'Qualified Service Labor', type: 'labor', qty: laborHours, rate: laborRate, total: laborHours * laborRate }
          ],
          subtotal: subtotal,
          tax: tax,
          total: total,
          dueDate: relativeDateString(14),
          paymentReceivedDate: relativeDate(-3),
          notes: 'Thank you for your business!',
          createdAt: relativeDate(-30),
          updatedAt: relativeDate(-3)
        });
      }

      // 4. Schedule block
      const startHour = 8 + (jIdx * 2);
      const endHour = startHour + laborHours;
      generatedSchedule.push({
        id: `sch_${indexStr}`,
        jobId: jobId,
        jobTitle: title,
        technicianId: assignTech.id,
        technicianName: assignTech.name,
        technicianColor: assignTech.color,
        date: relativeDateString(jIdx - 3), // Spreads schedule across days
        startHour: startHour,
        startMinute: 0,
        endHour: endHour,
        endMinute: 0,
        notes: 'Seeded schedule block.'
      });
    }

    // 5. Leads (5 leads total, 1 per customer)
    const leadIndexStr = String(cIdx + 1).padStart(3, '0');
    const leadTitles = [
      'Electric Vehicle Charger Installation',
      'Factory Power Factor Correction Unit',
      'Commercial Office Sub-metering Upgrade',
      'Dedicated Main entrance Auto-door Power Circuit',
      'Irrigation Pump Control Box Retrofit'
    ];
    const leadDescriptions = [
      'Customer requested a proposal to install 4x fast EV chargers in the warehouse staff car park.',
      'Enquiry regarding power factor correction capacitors to reduce high peak demand electricity fees.',
      'Quote required to retro-fit separate sub-meters for commercial property subdivisions.',
      'Run separate feed from the sub-board to the shopping mall lobby doors.',
      'Retrofit existing agricultural irrigation pumps with automated smart controls.'
    ];

    generatedLeads.push({
      id: `lead_${leadIndexStr}`,
      companyName: `${cData.company} Extension`,
      contactName: `${cData.first} ${cData.last}`,
      email: cData.email,
      phone: cData.phone,
      title: leadTitles[cIdx],
      description: leadDescriptions[cIdx],
      status: cIdx === 4 ? 'New' : 'Converted',
      value: 2500 + cIdx * 3000,
      createdAt: relativeDate(-60),
      updatedAt: relativeDate(-1)
    });
  });

  // 6. Timesheets (5 users, 5 days, 5 time entries each)
  const generatedTimesheets = [];
  techniciansList.forEach((tech, tIdx) => {
    // Generate timesheets over 5 days (days -2 to +2)
    for (let dayOffset = -2; dayOffset <= 2; dayOffset++) {
      const entryId = `ts_${tech.id}_day_${dayOffset + 3}`;
      const hours = 7.5;
      const startHour = 8;
      const endHour = 16;
      generatedTimesheets.push({
        id: entryId,
        technicianId: tech.id,
        technicianName: tech.name,
        date: relativeDateString(dayOffset),
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(endHour).padStart(2, '0')}:00`,
        breakDuration: 30, // 30 mins
        hours: hours,
        description: `Serviced key distribution assets and finished routine maintenance checks.`,
        status: 'Approved',
        createdAt: relativeDate(-1),
        updatedAt: relativeDate(-1)
      });
    }
  });

  // 7. Contractors and Suppliers (5 each)
  const generatedContractors = [];
  const generatedSuppliers = [];
  const contractorBusinessNames = [
    'VoltTech Subcontracting',
    'Dubbo Solar Installers',
    'CoolBreeze HVAC Service Group',
    'CablePullers Subcontractors',
    'Smart Automation Integrators'
  ];
  const contractorTrade = [
    'Subcontractor Electrician',
    'Solar Installer',
    'HVAC Technician',
    'Cable Installer',
    'System Integrator'
  ];
  const supplierNames = [
    'Apex Electrical Wholesalers',
    'OzCable Distributors',
    'Switchgear Direct',
    'Climate Control Parts Depot',
    'Industrial Automation Supplies'
  ];

  for (let i = 1; i <= 5; i++) {
    generatedContractors.push({
      id: `con_${i}`,
      name: contractorBusinessNames[i - 1],
      contactName: `Contractor Contact ${i}`,
      email: `contact@${contractorBusinessNames[i - 1].toLowerCase().replace(/\s+/g, '')}.example.com`,
      phone: `0491 570 30${i}`,
      trade: contractorTrade[i - 1],
      status: 'Active',
      rate: 90.00 + i * 5
    });

    generatedSuppliers.push({
      id: `sup_${i}`,
      name: supplierNames[i - 1],
      contactName: `Supplier Partner ${i}`,
      email: `sales@${supplierNames[i - 1].toLowerCase().replace(/\s+/g, '')}.example.com`,
      phone: `0491 570 40${i}`,
      address: `10${i} Industrial Boulevard, Dubbo NSW 2830`,
      paymentTerms: '30 Days',
      active: true,
      notes: `Supplier account partner ${i}.`
    });
  }

  // 8. Notifications
  for (let i = 1; i <= 5; i++) {
    generatedNotifications.push({
      id: `notif_${i}`,
      title: `System Alert - Service Due ${i}`,
      message: `Asset SN-SYS-1-${i} has a service scheduled soon.`,
      read: i > 2,
      createdAt: relativeDate(-1)
    });
  }

  // Save Collections
  await store.save('userTypes', userTypes);
  await store.save('technicians', techniciansList);
  await store.save('stock', stockList);
  await store.save('customers', generatedCustomers);
  await store.save('assets', generatedAssets);
  await store.save('maintenancePlans', generatedPlans);
  await store.save('taskTemplates', taskTemplates);
  await store.save('quotes', generatedQuotes);
  await store.save('jobs', generatedJobs);
  await store.save('invoices', generatedInvoices);
  await store.save('schedule', generatedSchedule);
  await store.save('leads', generatedLeads);
  await store.save('notifications', generatedNotifications);
  await store.save('contractors', generatedContractors);
  await store.save('suppliers', generatedSuppliers);
  await store.save('timesheets', generatedTimesheets);

  // Form templates seeding
  store.seedFormTemplates();
  await store.save('formInstances', []);

  // Kits — reusable item bundles
  const kits = [
    {
      id: 'kit_1',
      name: 'Generator Minor Service Kit',
      description: 'Standard consumables and labour for a 250hr minor generator service',
      category: 'Service Kits',
      items: [
        { type: 'material', stockId: 'st_1', name: 'Engine Oil 15W-40 20L', sku: 'SKU-ST1', qty: 1, costPrice: 85, unitPrice: 120, unit: 'Each' },
        { type: 'material', stockId: 'st_2', name: 'Oil Filter — Cat 3306', sku: 'SKU-ST2', qty: 1, costPrice: 45, unitPrice: 75, unit: 'Each' }
      ],
      totalCost: 130, totalPrice: 195, itemCount: 2, active: true,
      createdAt: relativeDate(-30), updatedAt: relativeDate(-5)
    },
    {
      id: 'kit_2',
      name: 'Generator Standard Service Kit (500hr)',
      description: 'Comprehensive mid-interval service kit with all filters, fluids, and labour',
      category: 'Service Kits',
      items: [
        { type: 'material', stockId: 'st_1', name: 'Engine Oil 15W-40 20L', sku: 'SKU-ST1', qty: 2, costPrice: 85, unitPrice: 120, unit: 'Each' },
        { type: 'material', stockId: 'st_2', name: 'Oil Filter — Cat 3306', sku: 'SKU-ST2', qty: 1, costPrice: 45, unitPrice: 75, unit: 'Each' },
        { type: 'material', stockId: 'st_5', name: 'Coolant Concentrate 5L', sku: 'SKU-ST5', qty: 1, costPrice: 55, unitPrice: 85, unit: 'Each' }
      ],
      totalCost: 185, totalPrice: 280, itemCount: 3, active: true,
      createdAt: relativeDate(-30), updatedAt: relativeDate(-3)
    },
    {
      id: 'kit_3',
      name: 'ATS Panel Commissioning Kit',
      description: 'Items needed for commissioning an automatic transfer switch panel',
      category: 'Commissioning Kits',
      items: [
        { type: 'material', stockId: 'st_3', name: 'ATS Control Board', sku: 'SKU-ST3', qty: 1, costPrice: 420, unitPrice: 680, unit: 'Each' }
      ],
      totalCost: 420, totalPrice: 680, itemCount: 1, active: true,
      createdAt: relativeDate(-25), updatedAt: relativeDate(-2)
    },
    {
      id: 'kit_4',
      name: 'Vehicle Loadout — Service Tech',
      description: 'Standard consumables and parts for a service technician vehicle restock',
      category: 'Vehicle Loadouts',
      items: [
        { type: 'material', stockId: 'st_1', name: 'Engine Oil 15W-40 20L', sku: 'SKU-ST1', qty: 2, costPrice: 85, unitPrice: 120, unit: 'Each' },
        { type: 'material', stockId: 'st_5', name: 'Coolant Concentrate 5L', sku: 'SKU-ST5', qty: 2, costPrice: 55, unitPrice: 85, unit: 'Each' }
      ],
      totalCost: 280, totalPrice: 410, itemCount: 2, active: true,
      createdAt: relativeDate(-20), updatedAt: relativeDate(-1)
    },
    {
      id: 'kit_5',
      name: 'Battery Replacement Kit',
      description: 'Complete battery swap kit including batteries, connectors, and installation labour',
      category: 'Installation Kits',
      items: [
        { type: 'material', stockId: 'st_4', name: 'Battery 12V 100Ah AGM', sku: 'SKU-ST4', qty: 2, costPrice: 185, unitPrice: 280, unit: 'Each' }
      ],
      totalCost: 370, totalPrice: 560, itemCount: 1, active: true,
      createdAt: relativeDate(-15), updatedAt: relativeDate(-1)
    }
  ];

  await store.save('kits', kits);

  // Mark seeded
  localStorage.removeItem('simpro__prevent_seeding');
  store.markSeeded();
}

export async function seedMinimalData() {
  await seedData(true);
}

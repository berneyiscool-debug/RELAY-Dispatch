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
      if (['Invoices', 'Purchase Orders', 'Suppliers'].includes(mod) && key === 'delete') return false;
      return true;
    }),
  },
];

// Staff Technicians
const technicians = [
  { id: 'tech_1', name: 'Jake Morrow',  role: 'Senior Electrician',  color: '#3B82F6', userTypeId: 'ut_admin',   payRate: 95.00,  email: 'jake@apexpowerservices.com.au',  phone: '0412 233 445' },
  { id: 'tech_2', name: 'Ryan Holt',    role: 'Electrician',         color: '#10B981', userTypeId: 'ut_tech',    payRate: 80.00,  email: 'ryan@apexpowerservices.com.au',  phone: '0423 344 556' },
  { id: 'tech_3', name: 'Sandra Okafor', role: 'Electrician',         color: '#8B5CF6', userTypeId: 'ut_tech',    payRate: 80.00,  email: 'sandra@apexpowerservices.com.au', phone: '0434 455 667' },
  { id: 'tech_4', name: 'Dean Caruso',   role: 'Apprentice',          color: '#F59E0B', userTypeId: 'ut_tech',    payRate: 45.00,  email: 'dean@apexpowerservices.com.au',  phone: '0445 566 778' }
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

// 25 realistic Stock items
const stockItems = [
  { id: 'st_1',  name: 'Engine Oil 15W-40 20L',                   category: 'Consumables', unit: 'Each', costPrice: 85,  unitPrice: 120, reorderLevel: 5,  quantity: 18, locations: [{ location: 'Main Warehouse', quantity: 18 }], supplier: 'OilCorp' },
  { id: 'st_2',  name: 'Oil Filter — Cat 3306',                   category: 'Filters',     unit: 'Each', costPrice: 45,  unitPrice: 75,  reorderLevel: 3,  quantity: 8,  locations: [{ location: 'Main Warehouse', quantity: 8 }],  supplier: 'FiltersDirect' },
  { id: 'st_3',  name: 'Oil Filter — Cummins 150kVA',             category: 'Filters',     unit: 'Each', costPrice: 38,  unitPrice: 65,  reorderLevel: 4,  quantity: 12, locations: [{ location: 'Main Warehouse', quantity: 12 }], supplier: 'FiltersDirect' },
  { id: 'st_4',  name: 'Oil Filter — Kohler 20kVA',               category: 'Filters',     unit: 'Each', costPrice: 28,  unitPrice: 48,  reorderLevel: 4,  quantity: 15, locations: [{ location: 'Main Warehouse', quantity: 15 }], supplier: 'FiltersDirect' },
  { id: 'st_5',  name: 'Air Filter — Cat 3306',                   category: 'Filters',     unit: 'Each', costPrice: 120, unitPrice: 180, reorderLevel: 2,  quantity: 4,  locations: [{ location: 'Main Warehouse', quantity: 4 }],  supplier: 'FiltersDirect' },
  { id: 'st_6',  name: 'Air Filter — Cummins 150kVA',             category: 'Filters',     unit: 'Each', costPrice: 95,  unitPrice: 145, reorderLevel: 2,  quantity: 5,  locations: [{ location: 'Main Warehouse', quantity: 5 }],  supplier: 'FiltersDirect' },
  { id: 'st_7',  name: 'Fuel Filter Assembly',                    category: 'Filters',     unit: 'Each', costPrice: 65,  unitPrice: 110, reorderLevel: 3,  quantity: 9,  locations: [{ location: 'Main Warehouse', quantity: 9 }],  supplier: 'IndustrialFilters' },
  { id: 'st_8',  name: 'Coolant Concentrate 5L',                  category: 'Consumables', unit: 'Each', costPrice: 55,  unitPrice: 85,  reorderLevel: 5,  quantity: 14, locations: [{ location: 'Main Warehouse', quantity: 14 }], supplier: 'OilCorp' },
  { id: 'st_9',  name: 'V-Belt Set',                              category: 'Mechanical',  unit: 'Set',  costPrice: 95,  unitPrice: 150, reorderLevel: 3,  quantity: 7,  locations: [{ location: 'Main Warehouse', quantity: 7 }],  supplier: 'Belts&Pulleys' },
  { id: 'st_10', name: 'Battery 12V 100Ah AGM',                   category: 'Electrical',  unit: 'Each', costPrice: 185, unitPrice: 280, reorderLevel: 3,  quantity: 10, locations: [{ location: 'Main Warehouse', quantity: 10 }], supplier: 'PowerBat' },
  { id: 'st_11', name: 'Battery Terminal Connectors',             category: 'Electrical',  unit: 'Pair', costPrice: 12,  unitPrice: 22,  reorderLevel: 10, quantity: 24, locations: [{ location: 'Main Warehouse', quantity: 24 }], supplier: 'PowerBat' },
  { id: 'st_12', name: 'ATS Control Board',                       category: 'Electrical',  unit: 'Each', costPrice: 420, unitPrice: 680, reorderLevel: 1,  quantity: 2,  locations: [{ location: 'Main Warehouse', quantity: 2 }],  supplier: 'ApexParts' },
  { id: 'st_13', name: 'Transfer Switch 100A',                    category: 'Electrical',  unit: 'Each', costPrice: 285, unitPrice: 440, reorderLevel: 2,  quantity: 3,  locations: [{ location: 'Main Warehouse', quantity: 3 }],  supplier: 'ApexParts' },
  { id: 'st_14', name: 'Cable Lugs Assorted Pack',                category: 'Electrical',  unit: 'Pack', costPrice: 35,  unitPrice: 58,  reorderLevel: 5,  quantity: 12, locations: [{ location: 'Main Warehouse', quantity: 12 }], supplier: 'ApexParts' },
  { id: 'st_15', name: 'Fuse Kit Assorted',                       category: 'Electrical',  unit: 'Pack', costPrice: 28,  unitPrice: 45,  reorderLevel: 5,  quantity: 16, locations: [{ location: 'Main Warehouse', quantity: 16 }], supplier: 'ApexParts' },
  { id: 'st_16', name: 'Spark Plugs Set of 6',                    category: 'Mechanical',  unit: 'Set',  costPrice: 75,  unitPrice: 120, reorderLevel: 3,  quantity: 8,  locations: [{ location: 'Main Warehouse', quantity: 8 }],  supplier: 'ApexParts' },
  { id: 'st_17', name: 'Generator Service Kit — Cat 500kVA',       category: 'Service Kits',unit: 'Each', costPrice: 380, unitPrice: 580, reorderLevel: 2,  quantity: 4,  locations: [{ location: 'Main Warehouse', quantity: 4 }],  supplier: 'FiltersDirect' },
  { id: 'st_18', name: 'Generator Service Kit — Cummins 150kVA',   category: 'Service Kits',unit: 'Each', costPrice: 245, unitPrice: 380, reorderLevel: 2,  quantity: 1,  locations: [{ location: 'Main Warehouse', quantity: 1 }],  supplier: 'FiltersDirect' }, // Low Stock Alert Trigger
  { id: 'st_19', name: 'Generator Service Kit — Kohler 20kVA',     category: 'Service Kits',unit: 'Each', costPrice: 165, unitPrice: 260, reorderLevel: 3,  quantity: 6,  locations: [{ location: 'Main Warehouse', quantity: 6 }],  supplier: 'FiltersDirect' },
  { id: 'st_20', name: 'Inhibitor Test Strips',                   category: 'Consumables', unit: 'Pack', costPrice: 22,  unitPrice: 38,  reorderLevel: 5,  quantity: 14, locations: [{ location: 'Main Warehouse', quantity: 14 }], supplier: 'OilCorp' },
  { id: 'st_21', name: 'Load Bank Cable Set',                     category: 'Testing',     unit: 'Set',  costPrice: 180, unitPrice: 280, reorderLevel: 1,  quantity: 3,  locations: [{ location: 'Main Warehouse', quantity: 3 }],  supplier: 'ApexParts' },
  { id: 'st_22', name: 'Exhaust Flex Joint',                      category: 'Mechanical',  unit: 'Each', costPrice: 145, unitPrice: 225, reorderLevel: 2,  quantity: 5,  locations: [{ location: 'Main Warehouse', quantity: 5 }],  supplier: 'ApexParts' },
  { id: 'st_23', name: 'Radiator Hose Kit',                       category: 'Mechanical',  unit: 'Kit',  costPrice: 88,  unitPrice: 140, reorderLevel: 2,  quantity: 4,  locations: [{ location: 'Main Warehouse', quantity: 4 }],  supplier: 'ApexParts' },
  { id: 'st_24', name: 'Anti-Vibration Mounts Set',               category: 'Mechanical',  unit: 'Set',  costPrice: 110, unitPrice: 175, reorderLevel: 2,  quantity: 5,  locations: [{ location: 'Main Warehouse', quantity: 5 }],  supplier: 'ApexParts' },
  { id: 'st_25', name: 'Hour Meter Digital',                      category: 'Electrical',  unit: 'Each', costPrice: 65,  unitPrice: 105, reorderLevel: 3,  quantity: 9,  locations: [{ location: 'Main Warehouse', quantity: 9 }],  supplier: 'ApexParts' }
];

// Customers List
const customers = [
  { id: 'cust_1', company: 'Western NSW Local Health District', firstName: 'Margaret', lastName: 'Ellison', email: 'facilities@wnswlhd.health.nsw.gov.au', phone: '(02) 6809 8888', address: '42 Bultje Street, Dubbo NSW 2830', status: 'Active', type: 'Commercial', portalToken: 'c_pt_western', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_2', company: 'Optus Network Infrastructure',      firstName: 'Trevor',   lastName: 'Nash',    email: 't.nash@optus.com.au',                 phone: '0418 772 334', address: 'Level 3, 201 Elizabeth Street, Sydney NSW 2000', status: 'Active', type: 'Commercial', portalToken: 'c_pt_optus', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_3', company: 'Cobar Mining Pty Ltd',              firstName: 'Phil',     lastName: 'Drummond',email: 'p.drummond@cobarmining.com.au',      phone: '0427 883 221', address: 'Cobar Mine Site, Peak Hill Road, Cobar NSW 2835', status: 'Active', type: 'Commercial', portalToken: 'c_pt_cobar', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_4', company: 'Dubbo City Council',                firstName: 'Sandra',   lastName: 'Nguyen',  email: 's.nguyen@dubbo.nsw.gov.au',            phone: '(02) 6801 4000', address: 'Civic Administration Building, Dubbo NSW 2830', status: 'Active', type: 'Government', portalToken: 'c_pt_dubbo', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_5', company: 'NBN Co Regional',                   firstName: 'James',    lastName: 'Whitfield',email: 'j.whitfield@nbnco.com.au',          phone: '0401 234 567', address: '100 Miller Street, North Sydney NSW 2060', status: 'Active', type: 'Commercial', portalToken: 'c_pt_nbn', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_6', company: 'Transgrid',                         firstName: 'Robyn',    lastName: 'Cassidy', email: 'r.cassidy@transgrid.com.au',         phone: '(02) 9620 3100', address: '180 Thomas Street, Sydney NSW 2000', status: 'Active', type: 'Commercial', portalToken: 'c_pt_transgrid', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_7', company: 'Canopus Station',                   firstName: 'Bruce',    lastName: 'Halliday',email: 'bruce@canopusstation.com.au',         phone: '0428 991 003', address: 'Canopus Station, Bourke Road, Bourke NSW 2840', status: 'Active', type: 'Commercial', portalToken: 'c_pt_canopus', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) },
  { id: 'cust_8', company: 'Essential Energy',                  firstName: 'Darren',   lastName: 'Stubbs',  email: 'd.stubbs@essentialenergy.com.au',      phone: '(02) 6588 8000', address: '328 Oliver Street, Bathurst NSW 2795', status: 'Active', type: 'Commercial', portalToken: 'c_pt_essential', createdAt: relativeDate(-120), updatedAt: relativeDate(-1) }
];

// Assets List
const assets = [
  // Western NSW Local Health District
  { id: 'asset_1', name: 'Caterpillar 3306 500kVA Diesel Generator — Dubbo Base Hospital', type: 'Generator', serial: 'CAT-3306-DH-001', ownerType: 'Customer', customerId: 'cust_1', customerName: 'Western NSW Local Health District', currentMeter: 4420, recoveryRate: 35.00, status: 'Active', logs: [] },
  { id: 'asset_2', name: 'Kohler 20kVA Standby Generator — Bourke Hospital',              type: 'Generator', serial: 'KOH-20-BH-001',   ownerType: 'Customer', customerId: 'cust_1', customerName: 'Western NSW Local Health District', currentMeter: 1870, recoveryRate: 25.00, status: 'Active', logs: [] },
  { id: 'asset_3', name: '80kVA Automatic Transfer Switch — Dubbo Base Hospital',         type: 'ATS Panel', serial: 'ATS-80-DH-001',   ownerType: 'Customer', customerId: 'cust_1', customerName: 'Western NSW Local Health District', currentMeter: 0,    recoveryRate: 20.00, status: 'Active', logs: [] },
  { id: 'asset_4', name: '40kVA UPS Battery Bank — Dubbo Base Hospital ICU',              type: 'UPS System',serial: 'UPS-40-DH-001',   ownerType: 'Customer', customerId: 'cust_1', customerName: 'Western NSW Local Health District', currentMeter: 0,    recoveryRate: 25.00, status: 'Active', logs: [] },

  // Optus Network Infrastructure
  { id: 'asset_5', name: 'Cummins 20kVA Diesel Generator — Narromine Tower Site',        type: 'Generator', serial: 'CUM-20-NT-001',   ownerType: 'Customer', customerId: 'cust_2', customerName: 'Optus Network Infrastructure',      currentMeter: 3210, recoveryRate: 25.00, status: 'Active', logs: [] },
  { id: 'asset_6', name: 'Cummins 20kVA Diesel Generator — Trangie Tower Site',          type: 'Generator', serial: 'CUM-20-TT-001',   ownerType: 'Customer', customerId: 'cust_2', customerName: 'Optus Network Infrastructure',      currentMeter: 2880, recoveryRate: 25.00, status: 'Active', logs: [] },
  { id: 'asset_7', name: 'Battery Backup System 48V — Narromine Tower',                  type: 'UPS System',serial: 'BAT-48-NT-001',   ownerType: 'Customer', customerId: 'cust_2', customerName: 'Optus Network Infrastructure',      currentMeter: 0,    recoveryRate: 20.00, status: 'Active', logs: [] },

  // Cobar Mining Pty Ltd
  { id: 'asset_8', name: 'Caterpillar 1MVA Diesel Generator — Main Plant',                type: 'Generator', serial: 'CAT-1M-CM-001',   ownerType: 'Customer', customerId: 'cust_3', customerName: 'Cobar Mining Pty Ltd',              currentMeter: 8840, recoveryRate: 50.00, status: 'Active', logs: [] },
  { id: 'asset_9', name: 'Caterpillar 1MVA Diesel Generator — Processing Plant',          type: 'Generator', serial: 'CAT-1M-CM-002',   ownerType: 'Customer', customerId: 'cust_3', customerName: 'Cobar Mining Pty Ltd',              currentMeter: 7620, recoveryRate: 50.00, status: 'Active', logs: [] },
  { id: 'asset_10',name: 'Manual Changeover Panel 415V — Main Plant',                    type: 'ATS Panel', serial: 'MCP-415-CM-001',  ownerType: 'Customer', customerId: 'cust_3', customerName: 'Cobar Mining Pty Ltd',              currentMeter: 0,    recoveryRate: 20.00, status: 'Active', logs: [] },

  // Dubbo City Council
  { id: 'asset_11',name: 'Cummins 150kVA Diesel Generator — Water Treatment Plant',        type: 'Generator', serial: 'CUM-150-WTP-001', ownerType: 'Customer', customerId: 'cust_4', customerName: 'Dubbo City Council',                currentMeter: 5330, recoveryRate: 35.00, status: 'Active', logs: [] },
  { id: 'asset_12',name: 'ATS Panel 150A — Water Treatment Plant',                       type: 'ATS Panel', serial: 'ATS-150-WTP-001', ownerType: 'Customer', customerId: 'cust_4', customerName: 'Dubbo City Council',                currentMeter: 0,    recoveryRate: 20.00, status: 'Active', logs: [] },
  { id: 'asset_13',name: 'Cummins 60kVA Diesel Generator — Dubbo Airport',               type: 'Generator', serial: 'CUM-60-DA-001',   ownerType: 'Customer', customerId: 'cust_4', customerName: 'Dubbo City Council',                currentMeter: 2110, recoveryRate: 30.00, status: 'Active', logs: [] },

  // NBN Co Regional
  { id: 'asset_14',name: 'Powergen 15kVA Diesel Generator — Wellington Exchange',        type: 'Generator', serial: 'PWR-15-WE-001',   ownerType: 'Customer', customerId: 'cust_5', customerName: 'NBN Co Regional',                   currentMeter: 1640, recoveryRate: 25.00, status: 'Active', logs: [] },
  { id: 'asset_15',name: 'Battery Backup 24V 200Ah — Wellington Exchange',               type: 'UPS System',serial: 'BAT-24-WE-001',   ownerType: 'Customer', customerId: 'cust_5', customerName: 'NBN Co Regional',                   currentMeter: 0,    recoveryRate: 20.00, status: 'Active', logs: [] },

  // Canopus Station
  { id: 'asset_16',name: 'Kubota 15kVA Diesel Generator — Main Homestead',               type: 'Generator', serial: 'KUB-15-CS-001',   ownerType: 'Customer', customerId: 'cust_7', customerName: 'Canopus Station',                   currentMeter: 3780, recoveryRate: 25.00, status: 'Active', logs: [] },
  { id: 'asset_17',name: '48V 400Ah Lithium Battery Bank — Solar Hybrid System',         type: 'UPS System',serial: 'LIT-48-CS-001',   ownerType: 'Customer', customerId: 'cust_7', customerName: 'Canopus Station',                   currentMeter: 0,    recoveryRate: 30.00, status: 'Active', logs: [] },

  // Essential Energy
  { id: 'asset_18',name: 'Cummins 100kVA Diesel Generator — Bathurst Depot',             type: 'Generator', serial: 'CUM-100-BD-001',  ownerType: 'Customer', customerId: 'cust_8', customerName: 'Essential Energy',                  currentMeter: 2990, recoveryRate: 30.00, status: 'Active', logs: [] }
];

// Maintenance Plans
const plans = [
  // Caterpillar 500kVA — Dubbo Base Hospital
  { id: 'plan_1', name: '250hr Minor Service',  assetId: 'asset_1', triggerType: 'Meter',    meterInterval: 250,  lastTriggeredMeter: 4250, nextServiceDate: null, status: 'Active', priority: 'Minor',    collisionMerging: true },
  { id: 'plan_2', name: '500hr Standard Service', assetId: 'asset_1', triggerType: 'Meter',    meterInterval: 500,  lastTriggeredMeter: 4000, nextServiceDate: null, status: 'Active', priority: 'Standard', collisionMerging: true },
  { id: 'plan_3', name: 'Annual Major Overhaul',  assetId: 'asset_1', triggerType: 'Calendar', frequency: 'Annually', meterInterval: null, lastTriggeredMeter: null, nextServiceDate: relativeDateString(180), status: 'Active', priority: 'Major', collisionMerging: true },

  // Cummins 150kVA — Water Treatment Plant
  { id: 'plan_4', name: 'Quarterly Service',      assetId: 'asset_11',triggerType: 'Calendar', frequency: 'Quarterly',meterInterval: null, lastTriggeredMeter: null, nextServiceDate: relativeDateString(4), status: 'Active', priority: 'Standard' }, // Due in 4 days
  { id: 'plan_5', name: 'Annual Load Bank Test',  assetId: 'asset_11',triggerType: 'Calendar', frequency: 'Annually', meterInterval: null, lastTriggeredMeter: null, nextServiceDate: relativeDateString(120), status: 'Active', priority: 'Major' },

  // Cummins 20kVA — Narromine Tower
  { id: 'plan_6', name: '6 Monthly Service',      assetId: 'asset_5', triggerType: 'Calendar', frequency: 'Semi-Annually', meterInterval: null, lastTriggeredMeter: null, nextServiceDate: relativeDateString(60), status: 'Active', priority: 'Standard' },

  // Kubota 15kVA — Canopus Station
  { id: 'plan_7', name: '3 Monthly Service',      assetId: 'asset_16',triggerType: 'Calendar', frequency: 'Quarterly',meterInterval: null, lastTriggeredMeter: null, nextServiceDate: relativeDateString(6), status: 'Active', priority: 'Standard' } // Due in 6 days
];

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

// Quotes Seeding
const quotes = [
  {
    id: 'q_001',
    number: 'Q-001',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    title: 'Cat 500kVA 500hr Service',
    status: 'Accepted',
    lineItems: [
      { description: 'Generator Service Kit — Cat 500kVA', type: 'material', qty: 1, rate: 580, total: 580 },
      { description: 'Engine Oil 15W-40 20L', type: 'material', qty: 2, rate: 120, total: 240 },
      { description: 'Oil Filter — Cat 3306', type: 'material', qty: 1, rate: 75,  total: 75 },
      { description: 'Air Filter — Cat 3306', type: 'material', qty: 1, rate: 180, total: 180 },
      { description: 'Qualified Electrical & Mechanical Labor', type: 'labor', qty: 4, rate: 145, total: 580 }
    ],
    subtotal: 1655,
    tax: 165.50,
    total: 1820.50, // Matches original brief ~1840 estimation closely
    validUntil: relativeDateString(30),
    notes: 'Approved by district management.',
    createdAt: relativeDate(-90),
    updatedAt: relativeDate(-88)
  },
  {
    id: 'q_002',
    number: 'Q-002',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    title: 'Cat 500kVA Annual Overhaul',
    status: 'Accepted',
    lineItems: [
      { description: 'Generator Service Kit — Cat 500kVA', type: 'material', qty: 1, rate: 580, total: 580 },
      { description: 'Battery 12V 100Ah AGM', type: 'material', qty: 2, rate: 280, total: 560 },
      { description: 'V-Belt Set & Anti-Vibration Mounts', type: 'material', qty: 1, rate: 325, total: 325 },
      { description: 'Load Bank Test Cables & Inhibitors', type: 'material', qty: 1, rate: 318, total: 318 },
      { description: 'Standard Overhaul Labor (Dual Technician)', type: 'labor', qty: 8, rate: 200, total: 2000 }
    ],
    subtotal: 3783,
    tax: 378.30,
    total: 4161.30, // Brief: $4,200
    validUntil: relativeDateString(30),
    notes: 'Annual mandatory overhaul.',
    createdAt: relativeDate(-90),
    updatedAt: relativeDate(-85)
  },
  {
    id: 'q_003',
    number: 'Q-003',
    customerId: 'cust_4',
    customerName: 'Dubbo City Council',
    contactName: 'Sandra Nguyen',
    title: 'Cummins 150kVA Quarterly Service',
    status: 'Accepted',
    lineItems: [
      { description: 'Generator Service Kit — Cummins 150kVA', type: 'material', qty: 1, rate: 380, total: 380 },
      { description: 'Engine Oil 15W-40 20L', type: 'material', qty: 1, rate: 120, total: 120 },
      { description: 'Specialist Mechanical Labor', type: 'labor', qty: 3, rate: 130, total: 390 }
    ],
    subtotal: 890,
    tax: 89.00,
    total: 979.00, // Brief: $980
    validUntil: relativeDateString(30),
    notes: 'Routine quarterly check.',
    createdAt: relativeDate(-45),
    updatedAt: relativeDate(-40)
  },
  {
    id: 'q_004',
    number: 'Q-004',
    customerId: 'cust_7',
    customerName: 'Canopus Station',
    contactName: 'Bruce Halliday',
    title: 'Kubota 3 Monthly Service',
    status: 'Accepted',
    lineItems: [
      { description: 'Generator Service Kit — Kohler 20kVA', type: 'material', qty: 1, rate: 260, total: 260 },
      { description: 'Engine Oil 15W-40 20L', type: 'material', qty: 1, rate: 120, total: 120 },
      { description: 'Rural Maintenance Travel & Labor', type: 'labor', qty: 3, rate: 90,  total: 275 }
    ],
    subtotal: 655,
    tax: 65.50,
    total: 720.50, // Brief: $720
    validUntil: relativeDateString(30),
    notes: 'Accepted via phone.',
    createdAt: relativeDate(-35),
    updatedAt: relativeDate(-32)
  },
  {
    id: 'q_005',
    number: 'Q-005',
    customerId: 'cust_3',
    customerName: 'Cobar Mining Pty Ltd',
    contactName: 'Phil Drummond',
    title: 'Cat 1MVA Annual Inspection',
    status: 'Sent',
    lineItems: [
      { description: 'Double Caterpillar 1MVA Overhaul & Testing Parts', type: 'material', qty: 2, rate: 2800, total: 5600 },
      { description: 'Industrial Site Testing Labor', type: 'labor', qty: 16, rate: 135, total: 2160 }
    ],
    subtotal: 7760,
    tax: 776.00,
    total: 8536.00, // Brief: $8,500
    validUntil: relativeDateString(45),
    notes: 'Awaiting site manager approval.',
    createdAt: relativeDate(-12),
    updatedAt: relativeDate(-12)
  },
  {
    id: 'q_006',
    number: 'Q-006',
    customerId: 'cust_2',
    customerName: 'Optus Network Infrastructure',
    contactName: 'Trevor Nash',
    title: 'Narromine Tower 6 Monthly Service',
    status: 'Accepted',
    lineItems: [
      { description: 'Generator Service Kit — Cummins 150kVA', type: 'material', qty: 1, rate: 380, total: 380 },
      { description: 'Engine Oil 15W-40 20L', type: 'material', qty: 1, rate: 120, total: 120 },
      { description: 'Qualified Electrical & Testing Labor', type: 'labor', qty: 3, rate: 90,  total: 282 }
    ],
    subtotal: 782,
    tax: 78.20,
    total: 860.20, // Brief: $860
    validUntil: relativeDateString(30),
    notes: 'Scheduled for telecom tower generator.',
    createdAt: relativeDate(-65),
    updatedAt: relativeDate(-60)
  },
  {
    id: 'q_007',
    number: 'Q-007',
    customerId: 'cust_5',
    customerName: 'NBN Co Regional',
    contactName: 'James Whitfield',
    title: 'Wellington Exchange Battery Check',
    status: 'Draft',
    lineItems: [
      { description: 'Battery Terminal Connectors', type: 'material', qty: 2, rate: 22, total: 44 },
      { description: 'Inhibitor Test Strips', type: 'material', qty: 1, rate: 38, total: 38 },
      { description: 'Service Labor', type: 'labor', qty: 2, rate: 150, total: 300 }
    ],
    subtotal: 382,
    tax: 38.20,
    total: 420.20, // Brief: $420
    validUntil: relativeDateString(30),
    notes: 'Draft review prior to field dispatch.',
    createdAt: relativeDate(-32),
    updatedAt: relativeDate(-30)
  },
  {
    id: 'q_008',
    number: 'Q-008',
    customerId: 'cust_8',
    customerName: 'Essential Energy',
    contactName: 'Darren Stubbs',
    title: 'Cummins 100kVA Annual Service',
    status: 'Sent',
    lineItems: [
      { description: 'Generator Service Kit — Cummins 150kVA', type: 'material', qty: 1, rate: 380, total: 380 },
      { description: 'Battery 12V 100Ah AGM', type: 'material', qty: 1, rate: 280, total: 280 },
      { description: 'Radiator Hose Kit & Belts', type: 'material', qty: 1, rate: 290, total: 290 },
      { description: 'Testing & Calibration Labor', type: 'labor', qty: 4, rate: 135, total: 540 }
    ],
    subtotal: 1490,
    tax: 149.00,
    total: 1639.00, // Brief: $1,640
    validUntil: relativeDateString(45),
    notes: 'Annual scheduled maintenance quote.',
    createdAt: relativeDate(-14),
    updatedAt: relativeDate(-14)
  }
];

// Jobs Seeding
const jobs = [
  // --- PAST COMPLETED & INVOICED ---
  {
    id: 'job_001',
    number: 'J-001',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    siteAddress: '42 Bultje Street, Dubbo NSW 2830',
    title: 'Cat 500kVA 250hr Service — Dubbo Base Hospital',
    type: 'Electrical',
    status: 'Completed',
    priority: 'Standard',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: 'q_001',
    assetId: 'asset_1',
    scheduledDate: relativeDateString(-90),
    estimatedHours: 4,
    laborCost: 580,
    materialCost: 1075,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Completed base generator service successfully.',
    createdAt: relativeDate(-95),
    updatedAt: relativeDate(-90)
  },
  {
    id: 'job_002',
    number: 'J-002',
    customerId: 'cust_2',
    customerName: 'Optus Network Infrastructure',
    contactName: 'Trevor Nash',
    siteAddress: 'Level 3, 201 Elizabeth Street, Sydney NSW 2000',
    title: 'Narromine Tower 6 Monthly Service',
    type: 'Electrical',
    status: 'Invoiced',
    priority: 'Standard',
    technicianId: 'tech_2',
    technicianName: 'Ryan Holt',
    quoteId: 'q_006',
    assetId: 'asset_5',
    scheduledDate: relativeDateString(-60),
    estimatedHours: 3,
    laborCost: 282,
    materialCost: 500,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'All items completed.',
    createdAt: relativeDate(-65),
    updatedAt: relativeDate(-60)
  },
  {
    id: 'job_003',
    number: 'J-003',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    siteAddress: '42 Bultje Street, Dubbo NSW 2830',
    title: 'Emergency Callout — ATS Fault — Dubbo Base Hospital',
    type: 'Electrical',
    status: 'Invoiced',
    priority: 'Urgent',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: null,
    assetId: 'asset_3',
    scheduledDate: relativeDateString(-42),
    estimatedHours: 2,
    laborCost: 650,
    materialCost: 0,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Resolved switchboard lockout. Replaced fuse assembly.',
    createdAt: relativeDate(-42),
    updatedAt: relativeDate(-42)
  },
  {
    id: 'job_004',
    number: 'J-004',
    customerId: 'cust_7',
    customerName: 'Canopus Station',
    contactName: 'Bruce Halliday',
    siteAddress: 'Canopus Station, Bourke Road, Bourke NSW 2840',
    title: 'Canopus Station 3 Monthly Service',
    type: 'Electrical',
    status: 'Invoiced',
    priority: 'Standard',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: 'q_004',
    assetId: 'asset_16',
    scheduledDate: relativeDateString(-35),
    estimatedHours: 3,
    laborCost: 275,
    materialCost: 380,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Standard generator checks completed. Hybrid bank active.',
    createdAt: relativeDate(-38),
    updatedAt: relativeDate(-35)
  },
  {
    id: 'job_005',
    number: 'J-005',
    customerId: 'cust_5',
    customerName: 'NBN Co Regional',
    contactName: 'James Whitfield',
    siteAddress: '100 Miller Street, North Sydney NSW 2060',
    title: 'Wellington Exchange Battery Check',
    type: 'Electrical',
    status: 'Invoiced',
    priority: 'Standard',
    technicianId: 'tech_2',
    technicianName: 'Ryan Holt',
    quoteId: 'q_007',
    assetId: 'asset_15',
    scheduledDate: relativeDateString(-28),
    estimatedHours: 2,
    laborCost: 300,
    materialCost: 82,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Exchanged corroded battery lugs.',
    createdAt: relativeDate(-32),
    updatedAt: relativeDate(-28)
  },
  {
    id: 'job_006',
    number: 'J-006',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    siteAddress: '42 Bultje Street, Dubbo NSW 2830',
    title: 'Cat 500kVA 500hr Service — Dubbo Base Hospital',
    type: 'Electrical',
    status: 'Invoiced',
    priority: 'Standard',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: 'q_002',
    assetId: 'asset_1',
    scheduledDate: relativeDateString(-21),
    estimatedHours: 8,
    laborCost: 2000,
    materialCost: 1783,
    tasks: createJobTasks('tmpl_std_500', true),
    notes: 'Collaborated with apprentice Dean Caruso on full overhaul & testing.',
    createdAt: relativeDate(-25),
    updatedAt: relativeDate(-21)
  },
  {
    id: 'job_007',
    number: 'J-007',
    customerId: 'cust_4',
    customerName: 'Dubbo City Council',
    contactName: 'Sandra Nguyen',
    siteAddress: 'Civic Administration Building, Dubbo NSW 2830',
    title: 'Dubbo Airport Generator Annual Test',
    type: 'Electrical',
    status: 'Completed',
    priority: 'High',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: 'asset_13',
    scheduledDate: relativeDateString(-14),
    estimatedHours: 4,
    laborCost: 540,
    materialCost: 180,
    tasks: createJobTasks('tmpl_std_500', true),
    notes: 'Generator performance tested cleanly. Invoice pending approval.',
    createdAt: relativeDate(-18),
    updatedAt: relativeDate(-14)
  },
  {
    id: 'job_008',
    number: 'J-008',
    customerId: 'cust_3',
    customerName: 'Cobar Mining Pty Ltd',
    contactName: 'Phil Drummond',
    siteAddress: 'Cobar Mine Site, Peak Hill Road, Cobar NSW 2835',
    title: 'Cobar Mine Gen 1 Load Bank Test',
    type: 'Electrical',
    status: 'Completed',
    priority: 'High',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: 'q_005',
    assetId: 'asset_8',
    scheduledDate: relativeDateString(-7),
    estimatedHours: 8,
    laborCost: 1080,
    materialCost: 280,
    tasks: createJobTasks('tmpl_std_500', true),
    notes: 'Load bank validation complete. Highly successful test.',
    createdAt: relativeDate(-10),
    updatedAt: relativeDate(-7)
  },

  // --- CURRENT IN PROGRESS ---
  {
    id: 'job_009',
    number: 'J-009',
    customerId: 'cust_4',
    customerName: 'Dubbo City Council',
    contactName: 'Sandra Nguyen',
    siteAddress: 'Civic Administration Building, Dubbo NSW 2830',
    title: 'Water Treatment Plant Quarterly Service',
    type: 'Electrical',
    status: 'In Progress',
    priority: 'Standard',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: 'q_003',
    assetId: 'asset_11',
    scheduledDate: relativeDateString(0),
    estimatedHours: 4,
    laborCost: 390,
    materialCost: 500,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Currently performing routine inspection on plant.',
    createdAt: relativeDate(-4),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_010',
    number: 'J-010',
    customerId: 'cust_6',
    customerName: 'Transgrid',
    contactName: 'Robyn Cassidy',
    siteAddress: '180 Thomas Street, Sydney NSW 2000',
    title: 'Transgrid Substation UPS Inspection',
    type: 'Electrical',
    status: 'In Progress',
    priority: 'High',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: null,
    scheduledDate: relativeDateString(0),
    estimatedHours: 6,
    laborCost: 750,
    materialCost: 280,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Testing backup battery parameters.',
    createdAt: relativeDate(-2),
    updatedAt: relativeDate(0)
  },

  // --- UPCOMING SCHEDULED ---
  {
    id: 'job_011',
    number: 'J-011',
    customerId: 'cust_7',
    customerName: 'Canopus Station',
    contactName: 'Bruce Halliday',
    siteAddress: 'Canopus Station, Bourke Road, Bourke NSW 2840',
    title: 'Canopus Station 3 Monthly Service',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'Standard',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: 'asset_16',
    scheduledDate: relativeDateString(7),
    estimatedHours: 4,
    laborCost: 450,
    materialCost: 260,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Travel to outback Bourke homestead scheduled.',
    createdAt: relativeDate(-1),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_012',
    number: 'J-012',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    siteAddress: 'Bourke Hospital Site, Bourke NSW 2840',
    title: 'Bourke Hospital Generator Annual Service',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'High',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: null,
    assetId: 'asset_2',
    scheduledDate: relativeDateString(14),
    estimatedHours: 8,
    laborCost: 1160,
    materialCost: 580,
    tasks: createJobTasks('tmpl_std_500', false),
    notes: 'Jake to lead, Dean Caruso assisting on apprentice hours.',
    createdAt: relativeDate(-2),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_013',
    number: 'J-013',
    customerId: 'cust_2',
    customerName: 'Optus Network Infrastructure',
    contactName: 'Trevor Nash',
    siteAddress: 'Trangie Tower Site, Trangie NSW 2823',
    title: 'Optus Trangie Tower Service',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'Standard',
    technicianId: 'tech_2',
    technicianName: 'Ryan Holt',
    quoteId: null,
    assetId: 'asset_6',
    scheduledDate: relativeDateString(21),
    estimatedHours: 3,
    laborCost: 350,
    materialCost: 245,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Tower inspection.',
    createdAt: relativeDate(-5),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_014',
    number: 'J-014',
    customerId: 'cust_3',
    customerName: 'Cobar Mining Pty Ltd',
    contactName: 'Phil Drummond',
    siteAddress: 'Cobar Mine Site, Peak Hill Road, Cobar NSW 2835',
    title: 'Cobar Mine Gen 2 Inspection',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'High',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: null,
    assetId: 'asset_9',
    scheduledDate: relativeDateString(28),
    estimatedHours: 5,
    laborCost: 725,
    materialCost: 380,
    tasks: createJobTasks('tmpl_std_500', false),
    notes: 'Inspection on generator 2.',
    createdAt: relativeDate(-4),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_015',
    number: 'J-015',
    customerId: 'cust_8',
    customerName: 'Essential Energy',
    contactName: 'Darren Stubbs',
    siteAddress: '328 Oliver Street, Bathurst NSW 2795',
    title: 'Essential Energy Annual Service',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'High',
    technicianId: 'tech_2',
    technicianName: 'Ryan Holt',
    quoteId: 'q_008',
    assetId: 'asset_18',
    scheduledDate: relativeDateString(35),
    estimatedHours: 6,
    laborCost: 540,
    materialCost: 1100,
    tasks: createJobTasks('tmpl_std_500', false),
    notes: 'Mandatory essential energy inspection.',
    createdAt: relativeDate(-8),
    updatedAt: relativeDate(0)
  },

  // --- EXTRA Timeline Jobs ---
  {
    id: 'job_016',
    number: 'J-016',
    customerId: 'cust_1',
    customerName: 'Western NSW Local Health District',
    contactName: 'Margaret Ellison',
    siteAddress: 'Bourke Hospital Site, Bourke NSW 2840',
    title: 'Bourke Hospital Switchboard Repair',
    type: 'Electrical',
    status: 'Completed',
    priority: 'Urgent',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: null,
    scheduledDate: relativeDateString(-18),
    estimatedHours: 3,
    laborCost: 450,
    materialCost: 110,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Replaced fuses.',
    createdAt: relativeDate(-18),
    updatedAt: relativeDate(-18)
  },
  {
    id: 'job_017',
    number: 'J-017',
    customerId: 'cust_4',
    customerName: 'Dubbo City Council',
    contactName: 'Sandra Nguyen',
    siteAddress: 'Water Treatment Plant, Dubbo NSW 2830',
    title: 'Treatment Plant ATS Wiring Calibration',
    type: 'Electrical',
    status: 'Completed',
    priority: 'Standard',
    technicianId: 'tech_4',
    technicianName: 'Dean Caruso',
    quoteId: null,
    assetId: 'asset_12',
    scheduledDate: relativeDateString(-25),
    estimatedHours: 4,
    laborCost: 180,
    materialCost: 45,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Apprentice Dean completed wiring.',
    createdAt: relativeDate(-27),
    updatedAt: relativeDate(-25)
  },
  {
    id: 'job_018',
    number: 'J-018',
    customerId: 'cust_3',
    customerName: 'Cobar Mining Pty Ltd',
    contactName: 'Phil Drummond',
    siteAddress: 'Cobar Mine Site, Peak Hill Road, Cobar NSW 2835',
    title: 'Mine Site Changeover Switch Installation',
    type: 'Electrical',
    status: 'Invoiced',
    priority: 'High',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: null,
    assetId: 'asset_10',
    scheduledDate: relativeDateString(-12),
    estimatedHours: 5,
    laborCost: 725,
    materialCost: 440,
    tasks: createJobTasks('tmpl_std_500', true),
    notes: 'Changeover panel configured.',
    createdAt: relativeDate(-15),
    updatedAt: relativeDate(-12)
  },
  {
    id: 'job_019',
    number: 'J-019',
    customerId: 'cust_7',
    customerName: 'Canopus Station',
    contactName: 'Bruce Halliday',
    siteAddress: 'Bourke Road, Bourke NSW 2840',
    title: 'Canopus Hybrid Battery Configuration',
    type: 'Electrical',
    status: 'Completed',
    priority: 'Standard',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: 'asset_17',
    scheduledDate: relativeDateString(-3),
    estimatedHours: 4,
    laborCost: 480,
    materialCost: 58,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'Lithium battery bank sync successful.',
    createdAt: relativeDate(-5),
    updatedAt: relativeDate(-3)
  },
  {
    id: 'job_020',
    number: 'J-020',
    customerId: 'cust_2',
    customerName: 'Optus Network Infrastructure',
    contactName: 'Trevor Nash',
    siteAddress: 'Narromine Tower Site, Narromine NSW 2821',
    title: 'Tower Battery Diagnostics & Swap',
    type: 'Electrical',
    status: 'Completed',
    priority: 'High',
    technicianId: 'tech_2',
    technicianName: 'Ryan Holt',
    quoteId: null,
    assetId: 'asset_7',
    scheduledDate: relativeDateString(-10),
    estimatedHours: 2,
    laborCost: 195,
    materialCost: 280,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'AGM 12V Battery swapped in Narromine Tower.',
    createdAt: relativeDate(-12),
    updatedAt: relativeDate(-10)
  },
  {
    id: 'job_021',
    number: 'J-021',
    customerId: 'cust_4',
    customerName: 'Dubbo City Council',
    contactName: 'Sandra Nguyen',
    siteAddress: 'Dubbo Airport, Dubbo NSW 2830',
    title: 'Airport Generator V-Belt Replacement',
    type: 'Electrical',
    status: 'Completed',
    priority: 'Urgent',
    technicianId: 'tech_1',
    technicianName: 'Jake Morrow',
    quoteId: null,
    assetId: 'asset_13',
    scheduledDate: relativeDateString(-5),
    estimatedHours: 3,
    laborCost: 435,
    materialCost: 150,
    tasks: createJobTasks('tmpl_minor_250', true),
    notes: 'V-Belt set replaced successfully during airport test.',
    createdAt: relativeDate(-5),
    updatedAt: relativeDate(-5)
  },
  {
    id: 'job_022',
    number: 'J-022',
    customerId: 'cust_6',
    customerName: 'Transgrid',
    contactName: 'Robyn Cassidy',
    siteAddress: '180 Thomas Street, Sydney NSW 2000',
    title: 'Transgrid Depot Maintenance Service',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'Standard',
    technicianId: 'tech_4',
    technicianName: 'Dean Caruso',
    quoteId: null,
    assetId: null,
    scheduledDate: relativeDateString(10),
    estimatedHours: 4,
    laborCost: 180,
    materialCost: 45,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Apprentice Dean Caruso scheduled for checking.',
    createdAt: relativeDate(-2),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_023',
    number: 'J-023',
    customerId: 'cust_5',
    customerName: 'NBN Co Regional',
    contactName: 'James Whitfield',
    siteAddress: 'Wellington Exchange, Wellington NSW 2820',
    title: 'Powergen 15kVA Routine Check',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'Standard',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: 'asset_14',
    scheduledDate: relativeDateString(17),
    estimatedHours: 3,
    laborCost: 350,
    materialCost: 38,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Generator check Wellington.',
    createdAt: relativeDate(-3),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_024',
    number: 'J-024',
    customerId: 'cust_8',
    customerName: 'Essential Energy',
    contactName: 'Darren Stubbs',
    siteAddress: ' Bathurst Depot, Bathurst NSW 2795',
    title: 'Essential Energy Hour Meter Update',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'Standard',
    technicianId: 'tech_4',
    technicianName: 'Dean Caruso',
    quoteId: null,
    assetId: 'asset_18',
    scheduledDate: relativeDateString(25),
    estimatedHours: 2,
    laborCost: 90,
    materialCost: 105,
    tasks: createJobTasks('tmpl_minor_250', false),
    notes: 'Install Digital Hour Meter.',
    createdAt: relativeDate(-1),
    updatedAt: relativeDate(0)
  },
  {
    id: 'job_025',
    number: 'J-025',
    customerId: 'cust_7',
    customerName: 'Canopus Station',
    contactName: 'Bruce Halliday',
    siteAddress: 'Canopus Station, Bourke Road, Bourke NSW 2840',
    title: 'New Solar Hybrid Installation Follow-up',
    type: 'Electrical',
    status: 'Scheduled',
    priority: 'High',
    technicianId: 'tech_3',
    technicianName: 'Sandra Okafor',
    quoteId: null,
    assetId: 'asset_17',
    scheduledDate: relativeDateString(32),
    estimatedHours: 4,
    laborCost: 450,
    materialCost: 0,
    tasks: createJobTasks('tmpl_std_500', false),
    notes: 'Converted from a new farm battery-solar system lead.',
    createdAt: relativeDate(-4),
    updatedAt: relativeDate(0)
  }
];

// Invoices List
const invoices = [
  { id: 'inv_1', number: 'INV-50001', jobId: 'job_001', jobNumber: 'J-001', customerId: 'cust_1', customerName: 'Western NSW Local Health District', contactName: 'Margaret Ellison', status: 'Paid', lineItems: [{ description: 'Cat 500kVA 250hr Service - Labor', amount: 580 }, { description: 'Cat 500kVA 250hr Service - Materials', amount: 1075 }], subtotal: 1655, tax: 165.50, total: 1820.50, invoiceType: 'Standard', issueDate: relativeDate(-90), dueDate: relativeDateString(-76), paidDate: relativeDate(-76), notes: 'Fully paid by health district.' },
  { id: 'inv_2', number: 'INV-50002', jobId: 'job_002', jobNumber: 'J-002', customerId: 'cust_2', customerName: 'Optus Network Infrastructure',      contactName: 'Trevor Nash',      status: 'Paid', lineItems: [{ description: 'Narromine Tower Service - Labor', amount: 282 }, { description: 'Narromine Tower Service - Materials', amount: 500 }], subtotal: 782,  tax: 78.20,  total: 860.20,  invoiceType: 'Standard', issueDate: relativeDate(-60), dueDate: relativeDateString(-46), paidDate: relativeDate(-46), notes: 'Telecom maintenance account paid.' },
  { id: 'inv_3', number: 'INV-50003', jobId: 'job_003', jobNumber: 'J-003', customerId: 'cust_1', customerName: 'Western NSW Local Health District', contactName: 'Margaret Ellison', status: 'Sent', lineItems: [{ description: 'Emergency Callout - ATS Switchboard Fault', amount: 650 }], subtotal: 650,  tax: 65.00,  total: 715.00,  invoiceType: 'Standard', issueDate: relativeDate(-42), dueDate: relativeDateString(-28), paidDate: null,              notes: 'Outstanding emergency invoice.' },
  { id: 'inv_4', number: 'INV-50004', jobId: 'job_004', jobNumber: 'J-004', customerId: 'cust_7', customerName: 'Canopus Station',                   contactName: 'Bruce Halliday',   status: 'Paid', lineItems: [{ description: 'Canopus Station Routine - Labor', amount: 275 }, { description: 'Canopus Station Routine - Materials', amount: 380 }], subtotal: 655,  tax: 65.50,  total: 720.50,  invoiceType: 'Standard', issueDate: relativeDate(-35), dueDate: relativeDateString(-21), paidDate: relativeDate(-20), notes: 'Station account settled.' },
  { id: 'inv_5', number: 'INV-50005', jobId: 'job_005', jobNumber: 'J-005', customerId: 'cust_5', customerName: 'NBN Co Regional',                   contactName: 'James Whitfield',  status: 'Paid', lineItems: [{ description: 'Wellington Battery Exchange - Labor', amount: 300 }, { description: 'Wellington Battery Exchange - Materials', amount: 82 }], subtotal: 382,  tax: 38.20,  total: 420.20,  invoiceType: 'Standard', issueDate: relativeDate(-28), dueDate: relativeDateString(-14), paidDate: relativeDate(-14), notes: 'Telecom account paid.' },
  { id: 'inv_6', number: 'INV-50006', jobId: 'job_006', jobNumber: 'J-006', customerId: 'cust_1', customerName: 'Western NSW Local Health District', contactName: 'Margaret Ellison', status: 'Paid', lineItems: [{ description: 'Cat 500kVA Overhaul & Standard Service - Labor', amount: 2000 }, { description: 'Cat 500kVA Overhaul - Materials', amount: 1783 }], subtotal: 3783, tax: 378.30, total: 4161.30, invoiceType: 'Standard', issueDate: relativeDate(-21), dueDate: relativeDateString(-7),  paidDate: relativeDate(-7),  notes: 'Hospital accounts paid.' },
  { id: 'inv_7', number: 'INV-50007', jobId: 'job_007', jobNumber: 'J-007', customerId: 'cust_4', customerName: 'Dubbo City Council',                contactName: 'Sandra Nguyen',    status: 'Sent', lineItems: [{ description: 'Dubbo Airport Generator Test - Labor', amount: 540 }, { description: 'Dubbo Airport Generator Test - Materials', amount: 180 }], subtotal: 720,  tax: 72.00,  total: 792.00,  invoiceType: 'Standard', issueDate: relativeDate(-14), dueDate: relativeDateString(0),   paidDate: null,              notes: 'Council invoice outstanding.' },
  { id: 'inv_8', number: 'INV-50008', jobId: 'job_008', jobNumber: 'J-008', customerId: 'cust_3', customerName: 'Cobar Mining Pty Ltd',              contactName: 'Phil Drummond',    status: 'Sent', lineItems: [{ description: 'Cobar Gen 1 Load Bank Test - Labor', amount: 1080 }, { description: 'Cobar Gen 1 Load Bank Test - Materials', amount: 280 }], subtotal: 1360, tax: 136.00, total: 1496.00, invoiceType: 'Standard', issueDate: relativeDate(-7),  dueDate: relativeDateString(7),   paidDate: null,              notes: 'Mining invoice outstanding.' }
];

// Schedule Seeding
const schedules = [
  // J-009
  { id: 'sc_1', jobId: 'job_009', jobNumber: 'J-009', title: 'Water Treatment Plant Quarterly Service', technicianId: 'tech_1', technicianName: 'Jake Morrow',  color: '#3B82F6', dayOffset: 0, startHour: 8,  endHour: 13, customerName: 'Dubbo City Council', siteAddress: 'Dubbo NSW 2830' },
  // J-010
  { id: 'sc_2', jobId: 'job_010', jobNumber: 'J-010', title: 'Transgrid Substation UPS Inspection',    technicianId: 'tech_3', technicianName: 'Sandra Okafor', color: '#8B5CF6', dayOffset: 0, startHour: 10, endHour: 16, customerName: 'Transgrid', siteAddress: 'Sydney NSW 2000' },
  // J-011
  { id: 'sc_3', jobId: 'job_011', jobNumber: 'J-011', title: 'Canopus Station 3 Monthly Service',     technicianId: 'tech_3', technicianName: 'Sandra Okafor', color: '#8B5CF6', dayOffset: 7, startHour: 8,  endHour: 12, customerName: 'Canopus Station', siteAddress: 'Bourke NSW 2840' },
  // J-012
  { id: 'sc_4', jobId: 'job_012', jobNumber: 'J-012', title: 'Bourke Hospital Generator Service',      technicianId: 'tech_1', technicianName: 'Jake Morrow',  color: '#3B82F6', dayOffset: 14,startHour: 8,  endHour: 16, customerName: 'Western NSW Local Health District', siteAddress: 'Bourke NSW 2840' },
  // J-013
  { id: 'sc_5', jobId: 'job_013', jobNumber: 'J-013', title: 'Optus Trangie Tower Service',            technicianId: 'tech_2', technicianName: 'Ryan Holt',    color: '#10B981', dayOffset: 21,startHour: 9,  endHour: 12, customerName: 'Optus Network Infrastructure', siteAddress: 'Trangie NSW 2823' },
  // J-014
  { id: 'sc_6', jobId: 'job_014', jobNumber: 'J-014', title: 'Cobar Mine Gen 2 Inspection',            technicianId: 'tech_1', technicianName: 'Jake Morrow',  color: '#3B82F6', dayOffset: 28,startHour: 9,  endHour: 14, customerName: 'Cobar Mining Pty Ltd', siteAddress: 'Cobar NSW 2835' },
  // J-015
  { id: 'sc_7', jobId: 'job_015', jobNumber: 'J-015', title: 'Essential Energy Annual Service',        technicianId: 'tech_2', technicianName: 'Ryan Holt',    color: '#10B981', dayOffset: 35,startHour: 8,  endHour: 14, customerName: 'Essential Energy', siteAddress: 'Bathurst NSW 2795' }
];

// Leads Seeding
const leads = [
  { id: 'lead_1', number: 'LD-00001', title: 'Solar/Battery/Generator Hybrid System Enquiry', customerId: 'cust_7', customerName: 'Canopus Station',                  contactName: 'Bruce Halliday',   status: 'New',          source: 'Email',   value: 45000,  description: 'Provide details for off-grid hybrid farm bank.', priority: 'High',   createdAt: relativeDate(-12), updatedAt: relativeDate(-12) },
  { id: 'lead_2', number: 'LD-00002', title: 'Generator Maintenance Contract Tender',          customerId: 'cust_4', customerName: 'Dubbo City Council',                contactName: 'Sandra Nguyen',    status: 'Qualified',    source: 'Website', value: 28000,  description: 'Dubbo regional council annual maintenance contract tender.', priority: 'High', createdAt: relativeDate(-8),  updatedAt: relativeDate(-2) },
  { id: 'lead_3', number: 'LD-00003', title: 'Backup Power Assessment',                        customerId: 'cust_1', customerName: 'Western NSW Local Health District', contactName: 'Margaret Ellison', status: 'Proposal',   source: 'Phone',   value: 12000,  description: 'Emergency assessment of clinical battery status.', priority: 'Medium', createdAt: relativeDate(-15), updatedAt: relativeDate(-5) },
  { id: 'lead_4', number: 'LD-00004', title: 'Generator Fleet Maintenance',                    customerId: 'cust_8', customerName: 'Essential Energy',                  contactName: 'Darren Stubbs',    status: 'Negotiation',  source: 'Referral',value: 35000,  description: 'Annual service contract for depot generator fleets.', priority: 'High',   createdAt: relativeDate(-22), updatedAt: relativeDate(-2) },
  { id: 'lead_5', number: 'LD-00005', title: 'Emergency Power System Upgrade',                 customerId: 'cust_3', customerName: 'Cobar Mining Pty Ltd',              contactName: 'Phil Drummond',    status: 'New',          source: 'Phone',   value: 180000, description: 'Underground mine generator ventilation upgrade proposal.', priority: 'Urgent', createdAt: relativeDate(-1),  updatedAt: relativeDate(-1) },
  { id: 'lead_6', number: 'LD-00006', title: 'Regional Tower Maintenance Contract',            customerId: 'cust_2', customerName: 'Optus Network Infrastructure',      contactName: 'Trevor Nash',      status: 'Lost',         source: 'Email',   value: 95000,  description: 'Telecom network maintenance. Competitor undercut on base travel rates.', priority: 'Low', createdAt: relativeDate(-45), updatedAt: relativeDate(-30) }
];

// Pre-populated Notifications
const notifications = [
  { id: 'notif_1', number: 'NT-00001', type: 'Maintenance', title: 'Maintenance Due — Cummins 150kVA', description: 'Maintenance Due — Cummins 150kVA Water Treatment Plant Quarterly Service', priority: 'High',   status: 'Pending', createdAt: relativeDate(-1), assetId: 'asset_11' },
  { id: 'notif_2', number: 'NT-00002', type: 'Maintenance', title: 'Maintenance Due — Kubota 15kVA',   description: 'Maintenance Due — Kubota 15kVA Canopus Station 3 Monthly Service',          priority: 'Standard', status: 'Pending', createdAt: relativeDate(0),  assetId: 'asset_16' },
  { id: 'notif_3', number: 'NT-00003', type: 'Low Stock',   title: 'Low Stock Alert — Service Kit',   description: 'Low Stock Alert — Generator Service Kit Cummins 150kVA (1 left)',           priority: 'High',   status: 'Pending', createdAt: relativeDate(-2) },
  { id: 'notif_4', number: 'NT-00004', type: 'Job Update',  title: 'Job Completed — J-008',           description: 'Job Update — J-008 Cobar Mine Completed by Jake Morrow (Awaiting Invoice)',  priority: 'High',   status: 'Pending', createdAt: relativeDate(0),  jobId: 'job_008' }
];

// Contractors List
const contractors = [
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
    notes: 'Subcontractor based in NSW. Highly reliable.',
    portalToken: 'c_pt_ecovolt',
    complianceDocs: [
      { id: 'doc_1', type: 'Public Liability Insurance', number: 'PL-992110-A', expiryDate: '2026-10-15', verified: true, notes: 'Cover up to $20M' }
    ]
  }
];

// Suppliers List
const suppliers = [
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
    notes: 'Primary generator supplier.',
    attachments: []
  }
];

// Seeding main execution
export function seedData(force = false) {
  if (!force && store.isSeeded()) {
    return;
  }
  store.clearAll();

  // Save Settings
  const settings = {
    name: 'Apex Power Services',
    abn: '51 234 567 890',
    phone: '(02) 6882 4400',
    email: 'admin@apexpowerservices.com.au',
    domain: 'apexpowerservices.com.au',
    address: '14 Yarrandale Rd, Dubbo NSW 2830',
    website: 'www.apexpowerservices.com.au',
    logo: null,
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
  store.saveSettings(settings);

  // Save Collections
  store.save('userTypes', userTypes);
  store.save('technicians', technicians);
  store.save('stock', stockItems);
  store.save('customers', customers);
  store.save('assets', assets);
  store.save('maintenancePlans', plans);
  store.save('taskTemplates', taskTemplates);
  store.save('quotes', quotes);
  store.save('jobs', jobs);
  store.save('invoices', invoices);
  store.save('schedule', schedules);
  store.save('leads', leads);
  store.save('notifications', notifications);
  store.save('contractors', contractors);
  store.save('suppliers', suppliers);

  // Form templates seeding
  store.seedFormTemplates();
  store.save('formInstances', []);

  // Kits — reusable item bundles
  const kits = [
    {
      id: 'kit_1',
      name: 'Generator Minor Service Kit',
      description: 'Standard consumables and labour for a 250hr minor generator service',
      category: 'Service Kits',
      items: [
        { type: 'material', stockId: 'st_1', name: 'Engine Oil 15W-40 20L', sku: 'SKU-ST1', qty: 1, costPrice: 85, unitPrice: 120, unit: 'Each' },
        { type: 'material', stockId: 'st_2', name: 'Oil Filter — Cat 3306', sku: 'SKU-ST2', qty: 1, costPrice: 45, unitPrice: 75, unit: 'Each' },
        { type: 'material', stockId: 'st_15', name: 'Fuse Kit Assorted', sku: 'SKU-ST15', qty: 1, costPrice: 28, unitPrice: 45, unit: 'Pack' },
        { type: 'material', stockId: 'st_20', name: 'Inhibitor Test Strips', sku: 'SKU-ST20', qty: 1, costPrice: 22, unitPrice: 38, unit: 'Pack' },
        { type: 'labor', stockId: null, name: 'Service Labour', sku: '', qty: 3, costPrice: 45, unitPrice: 145, unit: 'hrs' }
      ],
      totalCost: 315, totalPrice: 713, itemCount: 5, active: true,
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
        { type: 'material', stockId: 'st_5', name: 'Air Filter — Cat 3306', sku: 'SKU-ST5', qty: 1, costPrice: 120, unitPrice: 180, unit: 'Each' },
        { type: 'material', stockId: 'st_7', name: 'Fuel Filter Assembly', sku: 'SKU-ST7', qty: 1, costPrice: 65, unitPrice: 110, unit: 'Each' },
        { type: 'material', stockId: 'st_8', name: 'Coolant Concentrate 5L', sku: 'SKU-ST8', qty: 1, costPrice: 55, unitPrice: 85, unit: 'Each' },
        { type: 'material', stockId: 'st_9', name: 'V-Belt Set', sku: 'SKU-ST9', qty: 1, costPrice: 95, unitPrice: 150, unit: 'Set' },
        { type: 'material', stockId: 'st_20', name: 'Inhibitor Test Strips', sku: 'SKU-ST20', qty: 1, costPrice: 22, unitPrice: 38, unit: 'Pack' },
        { type: 'labor', stockId: null, name: 'Standard Service Labour', sku: '', qty: 6, costPrice: 45, unitPrice: 145, unit: 'hrs' }
      ],
      totalCost: 842, totalPrice: 1698, itemCount: 8, active: true,
      createdAt: relativeDate(-30), updatedAt: relativeDate(-3)
    },
    {
      id: 'kit_3',
      name: 'ATS Panel Commissioning Kit',
      description: 'Items needed for commissioning an automatic transfer switch panel',
      category: 'Commissioning Kits',
      items: [
        { type: 'material', stockId: 'st_12', name: 'ATS Control Board', sku: 'SKU-ST12', qty: 1, costPrice: 420, unitPrice: 680, unit: 'Each' },
        { type: 'material', stockId: 'st_14', name: 'Cable Lugs Assorted Pack', sku: 'SKU-ST14', qty: 2, costPrice: 35, unitPrice: 58, unit: 'Pack' },
        { type: 'material', stockId: 'st_15', name: 'Fuse Kit Assorted', sku: 'SKU-ST15', qty: 1, costPrice: 28, unitPrice: 45, unit: 'Pack' },
        { type: 'material', stockId: 'st_21', name: 'Load Bank Cable Set', sku: 'SKU-ST21', qty: 1, costPrice: 180, unitPrice: 280, unit: 'Set' },
        { type: 'labor', stockId: null, name: 'Commissioning Labour', sku: '', qty: 8, costPrice: 45, unitPrice: 145, unit: 'hrs' }
      ],
      totalCost: 1058, totalPrice: 2281, itemCount: 5, active: true,
      createdAt: relativeDate(-25), updatedAt: relativeDate(-2)
    },
    {
      id: 'kit_4',
      name: 'Vehicle Loadout — Service Tech',
      description: 'Standard consumables and parts for a service technician vehicle restock',
      category: 'Vehicle Loadouts',
      items: [
        { type: 'material', stockId: 'st_1', name: 'Engine Oil 15W-40 20L', sku: 'SKU-ST1', qty: 2, costPrice: 85, unitPrice: 120, unit: 'Each' },
        { type: 'material', stockId: 'st_8', name: 'Coolant Concentrate 5L', sku: 'SKU-ST8', qty: 2, costPrice: 55, unitPrice: 85, unit: 'Each' },
        { type: 'material', stockId: 'st_11', name: 'Battery Terminal Connectors', sku: 'SKU-ST11', qty: 4, costPrice: 12, unitPrice: 22, unit: 'Pair' },
        { type: 'material', stockId: 'st_14', name: 'Cable Lugs Assorted Pack', sku: 'SKU-ST14', qty: 3, costPrice: 35, unitPrice: 58, unit: 'Pack' },
        { type: 'material', stockId: 'st_15', name: 'Fuse Kit Assorted', sku: 'SKU-ST15', qty: 2, costPrice: 28, unitPrice: 45, unit: 'Pack' },
        { type: 'material', stockId: 'st_20', name: 'Inhibitor Test Strips', sku: 'SKU-ST20', qty: 3, costPrice: 22, unitPrice: 38, unit: 'Pack' }
      ],
      totalCost: 559, totalPrice: 878, itemCount: 6, active: true,
      createdAt: relativeDate(-20), updatedAt: relativeDate(-1)
    },
    {
      id: 'kit_5',
      name: 'Battery Replacement Kit',
      description: 'Complete battery swap kit including batteries, connectors, and installation labour',
      category: 'Installation Kits',
      items: [
        { type: 'material', stockId: 'st_10', name: 'Battery 12V 100Ah AGM', sku: 'SKU-ST10', qty: 2, costPrice: 185, unitPrice: 280, unit: 'Each' },
        { type: 'material', stockId: 'st_11', name: 'Battery Terminal Connectors', sku: 'SKU-ST11', qty: 2, costPrice: 12, unitPrice: 22, unit: 'Pair' },
        { type: 'material', stockId: 'st_14', name: 'Cable Lugs Assorted Pack', sku: 'SKU-ST14', qty: 1, costPrice: 35, unitPrice: 58, unit: 'Pack' },
        { type: 'labor', stockId: null, name: 'Installation Labour', sku: '', qty: 2, costPrice: 45, unitPrice: 145, unit: 'hrs' }
      ],
      totalCost: 519, totalPrice: 940, itemCount: 4, active: true,
      createdAt: relativeDate(-15), updatedAt: relativeDate(-1)
    }
  ];

  store.save('kits', kits);

  // Mark seeded
  localStorage.removeItem('simpro__prevent_seeding');
  store.markSeeded();
}

export function seedMinimalData() {
  seedData(true);
}

export { technicians };

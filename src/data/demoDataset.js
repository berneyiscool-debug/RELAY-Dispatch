// ============================================
// RELAY — DEMO DATASET (Harbourline Electrical & Air)
// ============================================
//
// A fictional six-person electrical and air-conditioning contractor in
// Newcastle, NSW. Every record is synthetic: the business, its people and its
// customers are invented, emails use the reserved `.example` domain and phone
// numbers sit in the ACMA ranges set aside for fiction (02 5550 xxxx and
// 0491 570 006–159).
//
// The dataset is built as one connected story rather than "five of
// everything": enquiries become leads, leads become quotes, accepted quotes
// become jobs, jobs are scheduled against real crew capacity, the crew books
// time and materials, and finished work is invoiced and paid. Roughly twenty
// weeks of history sit behind a hand-written "this week" so reports, charts
// and AI Insights have something true to say.
//
// Everything is dated relative to the day it is loaded, so the schedule,
// overdue invoices and follow-ups always look current. The builder is pure (no
// store, DOM or network) and deterministic for a given anchor date, which is
// what makes it testable and keeps marketing screenshots reproducible.

export const DEMO_COMPANY_NAME = 'Harbourline Electrical & Air';

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n) => Math.round(n * 100) / 100;
const pad = (n, w = 2) => String(n).padStart(w, '0');

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function atTime(d, hours) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setMinutes(Math.round(hours * 60));
  return x;
}

/** `YYYY-MM-DDTHH:MM` in local time — the format the time-booking UI writes. */
function localStamp(d, hours) {
  const x = atTime(d, hours);
  return `${dateKey(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

function isoAt(d, hours) {
  return atTime(d, hours).toISOString();
}

function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

const RATE = { std: 115, ah: 172.5, emergency: 230, apprentice: 75, callout: 95, emergencyCallout: 180 };

const COST_CENTRES = [
  { key: 'serv', name: 'Service & Maintenance', code: 'SERV', sales: '200', expense: '310' },
  { key: 'inst', name: 'Installations & Upgrades', code: 'INST', sales: '201', expense: '311' },
  { key: 'hvac', name: 'Air Conditioning', code: 'HVAC', sales: '202', expense: '312' },
  { key: 'energy', name: 'Solar, Battery & EV', code: 'ENERGY', sales: '203', expense: '313' },
];

// Loaded cost rates (wage plus on-costs) — what an hour of each person costs the business.
const CREW = [
  { key: 'dale', name: 'Dale Whitford', role: 'Leading Hand Electrician', color: '#2563EB', userType: 'ut_manager', payRate: 62, phone: '0491 570 011', field: true },
  { key: 'priya', name: 'Priya Raman', role: 'Electrician', color: '#059669', userType: 'ut_tech', payRate: 56, phone: '0491 570 012', field: true },
  { key: 'sam', name: 'Sam Okafor', role: 'Refrigeration & Air Con Mechanic', color: '#7C3AED', userType: 'ut_tech', payRate: 58, phone: '0491 570 013', field: true },
  { key: 'tom', name: 'Tom Kealy', role: '3rd Year Apprentice Electrician', color: '#DB2777', userType: 'ut_tech', payRate: 31, phone: '0491 570 014', field: true },
  { key: 'bec', name: 'Bec Hollis', role: 'Office Manager', color: '#D97706', userType: 'ut_office', payRate: 42, phone: '0491 570 015', field: false },
];

const STORAGE = [
  { key: 'workshop', name: 'Workshop — Cardiff', type: 'Warehouse' },
  { key: 'van1', name: 'Van 1 — Dale', type: 'Vehicle', tech: 'dale' },
  { key: 'van2', name: 'Van 2 — Priya', type: 'Vehicle', tech: 'priya' },
  { key: 'van3', name: 'Van 3 — Sam', type: 'Vehicle', tech: 'sam' },
  { key: 'onorder', name: 'On Order', type: 'On Order' },
];

// [key, name, sku, category, unit, cost, sell, reorderLevel, { location: qty }, supplierKey]
const STOCK = [
  ['rcbo20', 'RCBO 1P+N 20A 30mA Type A', 'HL-RCBO20', 'Protection & Switchgear', 'Each', 38.5, 64, 20, { workshop: 6, van1: 4, van2: 2 }, 'hew'],
  ['rcbo16', 'RCBO 1P+N 16A 30mA Type A', 'HL-RCBO16', 'Protection & Switchgear', 'Each', 38.5, 64, 15, { workshop: 18, van1: 6, van2: 4 }, 'hew'],
  ['rcbo32', 'RCBO 1P+N 32A 30mA Type A', 'HL-RCBO32', 'Protection & Switchgear', 'Each', 41, 68, 6, { workshop: 6, van1: 2, van3: 1 }, 'hew'],
  ['mainsw', 'Main Switch 2P 63A', 'HL-MS63', 'Protection & Switchgear', 'Each', 28, 49, 4, { workshop: 5, van1: 2 }, 'hew'],
  ['spd', 'Surge Protection Device 1P+N 40kA', 'HL-SPD40', 'Protection & Switchgear', 'Each', 96, 158, 3, { workshop: 4, van1: 1 }, 'hew'],
  ['encl', 'Switchboard Enclosure 36-Pole Surface Mount', 'HL-ENC36', 'Protection & Switchgear', 'Each', 168, 289, 2, { workshop: 3 }, 'hew'],
  ['gpo', 'Double GPO 10A — White', 'HL-GPO2', 'Power & Data', 'Each', 6.9, 16.5, 60, { workshop: 96, van1: 18, van2: 16, van3: 8 }, 'hew'],
  ['gpousb', 'Double GPO with USB-A/C — White', 'HL-GPOUSB', 'Power & Data', 'Each', 31, 58, 10, { workshop: 10, van1: 3, van2: 3 }, 'hew'],
  ['gpowp', 'Weatherproof Double GPO IP53', 'HL-GPOWP', 'Power & Data', 'Each', 24.5, 46, 8, { workshop: 8, van1: 2, van2: 2 }, 'hew'],
  ['dl', 'LED Downlight 10W Tri-Colour IC-4 90mm', 'HL-DL10', 'Lighting', 'Each', 13.8, 32, 60, { workshop: 120, van1: 24, van2: 21 }, 'hew'],
  ['batten', 'LED Batten 1200mm 36W Tri-Colour', 'HL-BAT12', 'Lighting', 'Each', 36, 72, 20, { workshop: 22, van2: 4 }, 'hew'],
  ['smoke', 'Smoke Alarm 240V Photoelectric Interconnectable', 'HL-SA240', 'Safety & Compliance', 'Each', 47, 88, 24, { workshop: 18, van1: 4, van2: 8 }, 'hew'],
  ['fan', 'Ceiling Fan 52" DC with LED Light', 'HL-FAN52', 'Lighting', 'Each', 189, 329, 4, { workshop: 5 }, 'hew'],
  ['exfan', 'Exhaust Fan 250mm Ducted', 'HL-EXF250', 'Lighting', 'Each', 72, 129, 4, { workshop: 6 }, 'hew'],
  ['evc', 'EV Charger 7kW Single-Phase Smart Wallbox', 'HL-EVC7', 'EV & Solar', 'Each', 890, 1290, 2, { workshop: 3 }, 'sungrid'],
  ['iso35', 'Isolator 3P 35A Weatherproof', 'HL-ISO35', 'Protection & Switchgear', 'Each', 41, 76, 6, { workshop: 7, van3: 4 }, 'hew'],
  ['iso20', 'Isolator 2P 20A Weatherproof', 'HL-ISO20', 'Protection & Switchgear', 'Each', 22, 42, 8, { workshop: 8, van3: 6 }, 'hew'],
  ['tps25', 'TPS Cable 2.5mm² Twin & Earth', 'HL-TPS25', 'Wiring & Cable', 'm', 1.62, 3.2, 300, { workshop: 400, van1: 100, van2: 80, van3: 40 }, 'coastline'],
  ['tps15', 'TPS Cable 1.5mm² Twin & Earth', 'HL-TPS15', 'Wiring & Cable', 'm', 1.12, 2.3, 300, { workshop: 300, van1: 100, van2: 80 }, 'coastline'],
  ['tps6', 'TPS Cable 6mm² Twin & Earth', 'HL-TPS6', 'Wiring & Cable', 'm', 5.4, 9.8, 100, { workshop: 60, van1: 20, van3: 16 }, 'coastline'],
  ['conduit', 'Conduit 20mm Grey (4m length)', 'HL-CON20', 'Wiring & Cable', 'Length', 3.1, 7.2, 30, { workshop: 32, van1: 8, van2: 8 }, 'coastline'],
  ['exit', 'LED Exit Sign — Maintained', 'HL-EXIT', 'Safety & Compliance', 'Each', 118, 196, 4, { workshop: 4, van2: 2 }, 'safelite'],
  ['emlight', 'LED Emergency Light — Spitfire', 'HL-EMSP', 'Safety & Compliance', 'Each', 66, 122, 8, { workshop: 10, van2: 5 }, 'safelite'],
  ['nicd', 'Emergency Light Battery Pack NiCd 3.6V', 'HL-NICD', 'Safety & Compliance', 'Each', 18, 39, 12, { workshop: 14, van2: 8 }, 'safelite'],
  ['consum', 'Consumables Pack (terminals, ties, fixings)', 'HL-CONS', 'Consumables', 'Pack', 9, 18, 25, { workshop: 40, van1: 8, van2: 8, van3: 6 }, 'hew'],
  ['splitkit', 'Split System Install Kit (4m line set, bracket, drain)', 'HL-SPKIT', 'Air Conditioning', 'Each', 148, 245, 3, { workshop: 3, van3: 1 }, 'airsource'],
  ['coilclean', 'Coil Cleaner & Sanitiser (per unit service)', 'HL-COIL', 'Air Conditioning', 'Each', 6, 15, 20, { workshop: 24, van3: 12 }, 'airsource'],
];

// Ordered direct to the job on a purchase order, never held in stock.
const PO_ITEMS = {
  split71: { description: 'Split System 7.1kW Reverse Cycle Inverter', sku: 'AS-SPL71', cost: 1640, sell: 2390 },
  split35: { description: 'Split System 3.5kW Reverse Cycle Inverter', sku: 'AS-SPL35', cost: 1050, sell: 1590 },
  split25: { description: 'Split System 2.5kW Reverse Cycle Inverter', sku: 'AS-SPL25', cost: 920, sell: 1390 },
  panel: { description: 'Solar Panel 440W Mono PERC', sku: 'SG-PV440', cost: 152, sell: 0 },
  inverter: { description: 'Hybrid Inverter 10kW Single-Phase', sku: 'SG-HYB10', cost: 2860, sell: 0 },
  battery: { description: 'Home Battery 13.5kWh', sku: 'SG-BAT135', cost: 7650, sell: 0 },
  railkit: { description: 'Roof Rail & Clamp Kit (24 panels)', sku: 'SG-RAIL24', cost: 940, sell: 0 },
};

const SUPPLIERS = [
  { key: 'hew', name: 'Hunter Electrical Wholesale', contact: 'Marco Vitale', phone: '02 5550 4410', email: 'trade@hunter-elec-wholesale.example', address: '9 Wattlebird Lane, Cardiff NSW 2285', category: 'Electrical', account: 'HEW-20417', terms: '30 Days EOM' },
  { key: 'coastline', name: 'Coastline Cable & Data', contact: 'Nikki Brandt', phone: '02 5550 4422', email: 'orders@coastline-cable.example', address: '41 Ironbark Avenue, Sandgate NSW 2304', category: 'Electrical', account: 'CCD-8812', terms: '30 Days EOM' },
  { key: 'airsource', name: 'AirSource HVAC Supplies', contact: 'Luke Fernandes', phone: '02 5550 4438', email: 'sales@airsource-hvac.example', address: '3 Tallowwood Street, Beresfield NSW 2322', category: 'HVAC', account: 'ASH-3390', terms: '30 Days' },
  { key: 'sungrid', name: 'SunGrid Solar Distribution', contact: 'Hannah Pike', phone: '02 5550 4451', email: 'orders@sungrid-solar.example', address: '17 Coachwood Drive, Thornton NSW 2322', category: 'Electrical', account: 'SGD-1176', terms: '14 Days' },
  { key: 'safelite', name: 'SafeLite Emergency Systems', contact: 'Owen Gallagher', phone: '02 5550 4463', email: 'service@safelite-emergency.example', address: '5 Saltbush Street, Warabrook NSW 2304', category: 'Fire Safety', account: 'SLE-0592', terms: '30 Days' },
];

const CONTRACTORS = [
  { key: 'kestrel', businessName: 'Kestrel Roofing & Height Safety', contactName: 'Brodie Kask', phone: '0491 570 041', email: 'jobs@kestrel-roofing.example', hourly: 92, ah: 138, callout: 120, licence: 'NSW Contractor Lic. 318842C', specialties: ['Roof Access', 'Edge Protection', 'Solar Panel Mounting'], insuranceExpiryDays: 12 },
  { key: 'lakeside', businessName: 'Lakeside Data & Comms', contactName: 'Meg Tran', phone: '0491 570 042', email: 'meg@lakeside-datacomms.example', hourly: 88, ah: 132, callout: 90, licence: 'ACMA Open Cabler Reg. 77314', specialties: ['Data Cabling', 'NBN Lead-ins', 'CCTV'], insuranceExpiryDays: 140 },
  { key: 'benchmark', businessName: 'Benchmark Civil & Trenching', contactName: 'Ray Holloway', phone: '0491 570 043', email: 'ray@benchmark-civil.example', hourly: 135, ah: 190, callout: 180, licence: 'NSW Contractor Lic. 290115C', specialties: ['Trenching', 'Underground Conduit', 'Concrete Cutting'], insuranceExpiryDays: 210 },
  { key: 'hunterasb', businessName: 'Hunter Hazmat Assessments', contactName: 'Dr. Fiona Leckie', phone: '0491 570 044', email: 'bookings@hunter-hazmat.example', hourly: 165, ah: 220, callout: 0, licence: 'Licensed Asbestos Assessor LAA-00912', specialties: ['Asbestos Sampling', 'Clearance Certificates'], insuranceExpiryDays: 95 },
];

// Approximate suburb centroids, used to pre-warm the geocode cache so the
// technician map and route planner have pins without a network call.
const SUBURBS = {
  'Merewether': [-32.948, 151.743, 2291], 'Adamstown': [-32.934, 151.725, 2289], 'New Lambton': [-32.928, 151.708, 2305],
  'Lambton': [-32.912, 151.708, 2299], 'Hamilton': [-32.921, 151.748, 2303], 'Charlestown': [-32.965, 151.693, 2290],
  'Kotara': [-32.941, 151.696, 2289], 'Mayfield': [-32.897, 151.736, 2304], 'Cooks Hill': [-32.933, 151.770, 2300],
  'Warners Bay': [-32.972, 151.645, 2282], 'Speers Point': [-32.963, 151.625, 2284], 'Wallsend': [-32.902, 151.667, 2287],
  'Cardiff': [-32.942, 151.660, 2285], 'Belmont': [-33.037, 151.660, 2280], 'Eleebana': [-32.990, 151.636, 2282],
  'The Junction': [-32.938, 151.758, 2291], 'Waratah': [-32.905, 151.727, 2298], 'Jesmond': [-32.903, 151.690, 2299],
  'Elermore Vale': [-32.916, 151.677, 2287], 'Maitland': [-32.733, 151.557, 2320], 'East Maitland': [-32.750, 151.588, 2323],
  'Thornton': [-32.783, 151.640, 2322], 'Raymond Terrace': [-32.762, 151.744, 2324], 'Fletcher': [-32.874, 151.640, 2287],
  'Maryland': [-32.879, 151.660, 2287], 'Glendale': [-32.926, 151.645, 2285], 'Valentine': [-33.013, 151.640, 2280],
  'Bar Beach': [-32.940, 151.770, 2300], 'Islington': [-32.912, 151.745, 2296], 'Kahibah': [-32.961, 151.713, 2290],
  'Whitebridge': [-32.977, 151.717, 2290], 'Rankin Park': [-32.925, 151.680, 2287],
};

const STREETS = ['Corella Close', 'Banksia Parade', 'Sandpiper Street', 'Kingfisher Road', 'Bluegum Crescent', 'Shoreline Drive',
  'Pelican Parade', 'Lorikeet Street', 'Casuarina Way', 'Brushbox Street', 'Paperbark Close', 'Grevillea Grove', 'Spotted Gum Road',
  'Heron Way', 'Waratah Lane', 'Jacaranda Avenue', 'Myrtle Street', 'Tea Tree Close', 'Wren Street', 'Currawong Road',
  'Boronia Avenue', 'Silky Oak Drive', 'Lilly Pilly Lane', 'Kurrajong Street', 'Bottlebrush Road', 'Mulga Close'];

const FIRST = ['Ashleigh', 'Ben', 'Chloe', 'Darren', 'Elena', 'Fraser', 'Georgia', 'Hamish', 'Imogen', 'Jarrod', 'Kirra', 'Liam',
  'Mei', 'Nathan', 'Olivia', 'Patrick', 'Quinn', 'Rhys', 'Sienna', 'Tariq', 'Uma', 'Vince', 'Willa', 'Xavier', 'Yasmin', 'Zac',
  'Bronwyn', 'Callum', 'Deepa', 'Ewan', 'Fatima', 'Grant', 'Hayley', 'Isaac', 'Jodie', 'Kieran', 'Leah', 'Marcus', 'Nadia', 'Oscar'];
const LAST = ['Turner', 'Nguyen', 'Halloran', 'Kowalski', 'Fitzgerald', 'Achebe', 'Lindqvist', 'Moretti', 'Papadakis', 'Sinclair',
  'Takahashi', 'Rowe', 'Delaney', 'Mackenzie', 'Osei', 'Brennan', 'Castellano', 'Whitlam', 'Iyer', 'Gallagher', 'Henning',
  'Varga', 'Pemberton', 'Okoro', 'Szabo', 'Quill', 'Ruiz', 'Dempsey', 'Forsyth', 'Kaur', 'Lowe', 'McAllister', 'Novak', 'Price'];

// Commercial and agency clients — the accounts that keep a small business steady.
const COMMERCIAL = [
  {
    key: 'seaview', company: 'Seaview Strata Management', first: 'Carla', last: 'Benedetti', phone: '02 5550 1201', email: 'carla.benedetti@seaview-strata.example',
    suburb: 'Hamilton', street: '120 Shoreline Drive', terms: 30,
    contacts: [['Carla Benedetti', 'Strata Manager', '0491 570 101'], ['Josh Varley', 'Building Manager — Harbour View', '0491 570 102'], ['Accounts Payable', 'Accounts', '02 5550 1209']],
    sites: [['Harbour View Apartments', '2 Pelican Parade, Merewether NSW 2291', 'Building manager on site 7am–3pm. Plant room key in lockbox by loading dock.'],
      ['Junction Lofts', '48 Brushbox Street, The Junction NSW 2291', 'Visitor parking bays 1–3. Switch room behind lift core.']],
  },
  {
    key: 'northside', company: 'Northside Real Estate — Property Management', first: 'Tegan', last: 'Albright', phone: '02 5550 1302', email: 'pm@northside-re.example',
    suburb: 'Lambton', street: '33 Kurrajong Street', terms: 14,
    contacts: [['Tegan Albright', 'Senior Property Manager', '0491 570 103'], ['Ollie Brandt', 'Leasing Consultant', '0491 570 104']],
    sites: [['Rental — 14 Myrtle St, Waratah', '14 Myrtle Street, Waratah NSW 2298', 'Tenant: call 30 min before arrival.'],
      ['Rental — 6/22 Wren St, Mayfield', '6/22 Wren Street, Mayfield NSW 2304', 'Keys from office.'],
      ['Rental — 91 Currawong Rd, Jesmond', '91 Currawong Road, Jesmond NSW 2299', 'Dog in backyard — use front entry.']],
  },
  {
    key: 'dental', company: 'The Junction Dental Studio', first: 'Dr. Anika', last: 'Rao', phone: '02 5550 1403', email: 'practice@junction-dental.example',
    suburb: 'The Junction', street: '7 Grevillea Grove', terms: 14,
    contacts: [['Dr. Anika Rao', 'Principal Dentist', '0491 570 105'], ['Shona Kemp', 'Practice Manager', '0491 570 106']],
    sites: [['Main Surgery', '7 Grevillea Grove, The Junction NSW 2291', 'Surgery hours 8am–5pm. Work in treatment rooms only before 8am or with practice manager approval.']],
  },
  {
    key: 'childcare', company: 'Lakeside Early Learning Centre', first: 'Robyn', last: 'Faulkner', phone: '02 5550 1504', email: 'director@lakeside-elc.example',
    suburb: 'Warners Bay', street: '210 Heron Way', terms: 14,
    contacts: [['Robyn Faulkner', 'Centre Director', '0491 570 107'], ['Admin Office', 'Reception', '02 5550 1505']],
    sites: [['Warners Bay Centre', '210 Heron Way, Warners Bay NSW 2282', 'Children on site — sign in at office, Working With Children Check required, no tools left unattended.']],
  },
  {
    key: 'brewing', company: 'Hunter Valley Brewing Co', first: 'Dougal', last: 'Ferris', phone: '02 5550 1606', email: 'dougal@hvbrewing.example',
    suburb: 'Maitland', street: '4 Spotted Gum Road', terms: 14,
    contacts: [['Dougal Ferris', 'Head Brewer / Owner', '0491 570 108'], ['Kim Ashby', 'Bookkeeper', '0491 570 109']],
    sites: [['Brewery & Taproom', '4 Spotted Gum Road, Maitland NSW 2320', 'Forklift operating in warehouse. Taproom open from 12pm Thu–Sun.']],
  },
  {
    key: 'forge', company: 'Forge & Weld Fabrications', first: 'Steve', last: 'Mulholland', phone: '02 5550 1707', email: 'steve@forgeweld.example',
    suburb: 'Cardiff', street: '15 Bottlebrush Road', terms: 30,
    contacts: [['Steve Mulholland', 'Workshop Manager', '0491 570 110'], ['Lena Fisk', 'WHS Coordinator', '0491 570 111']],
    sites: [['Fabrication Workshop', '15 Bottlebrush Road, Cardiff NSW 2285', 'Steel caps and hi-vis at all times. Report to WHS before testing.']],
  },
  {
    key: 'physio', company: 'Kotara Physio & Pilates', first: 'Mel', last: 'Chau', phone: '02 5550 1808', email: 'mel@kotara-physio.example',
    suburb: 'Kotara', street: '2/58 Jacaranda Avenue', terms: 14,
    contacts: [['Mel Chau', 'Owner / Physiotherapist', '0491 570 112']],
    sites: [['Clinic', '2/58 Jacaranda Avenue, Kotara NSW 2289', 'Clinic closes 7pm. Studio floor is sprung timber — drop sheets please.']],
  },
  {
    key: 'espresso', company: 'Little Darby Espresso', first: 'Gus', last: 'Petrov', phone: '02 5550 1909', email: 'gus@littledarby.example',
    suburb: 'Cooks Hill', street: '61 Boronia Avenue', terms: 7,
    contacts: [['Gus Petrov', 'Owner', '0491 570 113']],
    sites: [['Cafe', '61 Boronia Avenue, Cooks Hill NSW 2300', 'Trading 6am–2pm. Book shutdowns after 2pm.']],
  },
  {
    key: 'coastalreno', company: 'Coastal Renovations Pty Ltd', first: 'Jade', last: 'Whitcombe', phone: '02 5550 2010', email: 'jade@coastal-renos.example',
    suburb: 'Charlestown', street: '19 Silky Oak Drive', terms: 30,
    contacts: [['Jade Whitcombe', 'Builder / Director', '0491 570 114'], ['Aaron Pell', 'Site Supervisor', '0491 570 115']],
    sites: [['Head Office', '19 Silky Oak Drive, Charlestown NSW 2290', '']],
  },
  {
    key: 'hall', company: 'Adamstown Community Hall Association', first: 'Bev', last: 'Ingram', phone: '02 5550 2111', email: 'secretary@adamstown-hall.example',
    suburb: 'Adamstown', street: '80 Tea Tree Close', terms: 30,
    contacts: [['Bev Ingram', 'Secretary', '0491 570 116']],
    sites: [['Community Hall', '80 Tea Tree Close, Adamstown NSW 2289', 'Key from Bev. Hall booked most evenings.']],
  },
];

// Role labels for the demo crew. Permissions are left empty: in demo mode the
// visitor plays the owner and every module is open (see utils/permissions.js).
export const DEMO_USER_TYPES = [
  { id: 'ut_admin', name: 'Admin', description: 'Full system access', permissions: [] },
  { id: 'ut_manager', name: 'Manager', description: 'Runs the day-to-day: scheduling, quotes and invoices', permissions: [] },
  { id: 'ut_tech', name: 'Technician', description: 'Field staff — their jobs, schedule and timesheets', permissions: [] },
  { id: 'ut_office', name: 'Office Staff', description: 'Customers, quotes and invoices', permissions: [] },
];

export const DEMO_REFERENCE = { CREW, STOCK, SUPPLIERS, CONTRACTORS, COMMERCIAL, COST_CENTRES, RATE };

// ---------------------------------------------------------------------------
// Service catalogue — the work a Newcastle sparky + air-con business does.
// `make(r)` returns one concrete job: title, scope, hours and the materials it
// actually consumes, so a quote, the job, its timesheets and its invoice all
// describe the same piece of work.
// ---------------------------------------------------------------------------

const int = (r, min, max) => min + Math.floor(r() * (max - min + 1));
const pick = (r, list) => list[Math.floor(r() * list.length)];
const q25 = (h) => Math.round(h * 4) / 4;

const CATALOGUE = [
  {
    key: 'faultfind', jobType: 'Service Call', cc: 'serv', skill: 'elec', kind: 'any', people: 1, quoted: false, weight: 14,
    tasks: ['Investigate fault', 'Repair & make safe', 'Test & report to customer'],
    make: (r) => {
      const variant = pick(r, [
        ['Fault find — safety switch tripping', 'Safety switch tripping intermittently, worse when it rains. Locate fault and repair.', [['rcbo16', 1]]],
        ['Fault find — no power to rear of house', 'Power out to back bedrooms and laundry. Investigate and restore supply.', [['gpo', 1], ['consum', 1]]],
        ['Fault find — lights flickering', 'Lights flicker in kitchen and living area. Check connections and fittings.', [['consum', 1]]],
        ['Fault find — burnt power point', 'Scorch marks on lounge room power point. Replace and check circuit.', [['gpo', 1], ['consum', 1]]],
      ]);
      return { title: variant[0], desc: variant[1], hours: q25(1 + r() * 1.5), materials: variant[2] };
    },
  },
  {
    key: 'gpos', jobType: 'Installation', cc: 'serv', skill: 'elec', kind: 'any', people: 1, quoted: false, weight: 12,
    tasks: ['Run new cabling', 'Fit off power points', 'Test & tag circuit'],
    make: (r) => {
      const n = int(r, 2, 5);
      const usb = r() < 0.4;
      return {
        title: `Install ${n} additional double power points${usb ? ' (USB)' : ''}`,
        desc: `Supply and install ${n} new double power points${usb ? ' with USB-A/C charging' : ''} on existing circuits.`,
        hours: q25(0.75 + n * 0.45), materials: [[usb ? 'gpousb' : 'gpo', n], ['tps25', 8 * n], ['consum', 1]],
      };
    },
  },
  {
    key: 'downlights', jobType: 'Installation', cc: 'serv', skill: 'elec', kind: 'res', people: 1, quoted: false, weight: 10,
    tasks: ['Remove old halogen fittings', 'Install LED downlights', 'Test & clean up'],
    make: (r) => {
      const n = int(r, 6, 16);
      return { title: `Replace ${n} halogen downlights with LED`, desc: `Remove ${n} old halogen downlights and transformers, supply and install IC-4 rated tri-colour LED downlights.`, hours: q25(0.75 + n * 0.2), materials: [['dl', n], ['consum', 1]] };
    },
  },
  {
    key: 'smoke', jobType: 'Compliance & Testing', cc: 'serv', skill: 'elec', kind: 'any', people: 1, quoted: false, weight: 9,
    tasks: ['Remove expired alarms', 'Install photoelectric alarms', 'Interconnect & test', 'Issue compliance statement'],
    make: (r) => {
      const n = int(r, 2, 4);
      return { title: `Smoke alarm replacement — ${n} photoelectric 240V alarms`, desc: `Replace ${n} expired smoke alarms with interconnectable 240V photoelectric alarms. Test all alarms and issue statement.`, hours: q25(0.75 + n * 0.4), materials: [['smoke', n], ['tps15', 6 * (n - 1)], ['consum', 1]] };
    },
  },
  {
    key: 'fans', jobType: 'Installation', cc: 'serv', skill: 'elec', kind: 'res', people: 1, quoted: false, weight: 7,
    tasks: ['Install fan bracing & wiring', 'Assemble & mount fans', 'Test & balance'],
    make: (r) => {
      const n = int(r, 1, 3);
      return { title: `Supply & install ${n} DC ceiling fan${n > 1 ? 's' : ''}`, desc: `Supply and install ${n} 52" DC ceiling fan${n > 1 ? 's' : ''} with LED light and wall control.`, hours: q25(0.75 + n * 1.1), materials: [['fan', n], ['tps15', 10 * n], ['consum', 1]] };
    },
  },
  {
    key: 'exfan', jobType: 'Installation', cc: 'serv', skill: 'elec', kind: 'res', people: 1, quoted: false, weight: 4,
    tasks: ['Cut in & duct exhaust fan', 'Wire to switch', 'Test & clean up'],
    make: () => ({ title: 'Bathroom exhaust fan — supply & install ducted', desc: 'Supply and install 250mm ducted exhaust fan, ducted to eave vent, switched with light.', hours: 2, materials: [['exfan', 1], ['tps15', 8], ['consum', 1]] }),
  },
  {
    key: 'outdoor', jobType: 'Installation', cc: 'serv', skill: 'elec', kind: 'res', people: 1, quoted: false, weight: 5,
    tasks: ['Run conduit & cable', 'Install weatherproof outlets', 'Test & tag'],
    make: (r) => {
      const n = int(r, 1, 2);
      return { title: `Outdoor weatherproof power — ${n} outlet${n > 1 ? 's' : ''}`, desc: `Install ${n} IP53 weatherproof double power point${n > 1 ? 's' : ''} to the alfresco area in conduit.`, hours: q25(1.25 + n * 0.75), materials: [['gpowp', n], ['tps25', 12 * n], ['conduit', 2 * n], ['consum', 1]] };
    },
  },
  {
    key: 'oven', jobType: 'Service Call', cc: 'serv', skill: 'elec', kind: 'res', people: 1, quoted: false, weight: 4,
    tasks: ['Disconnect old appliance', 'Connect new appliance', 'Test & commission'],
    make: (r) => ({ title: pick(r, ['Connect new oven & cooktop', 'Connect new induction cooktop', 'Hot water system reconnection']), desc: 'Disconnect old appliance and connect new unit to existing circuit. Test and commission.', hours: q25(1 + r() * 0.5), materials: [['consum', 1]] }),
  },
  {
    key: 'switchboard', jobType: 'Switchboard', cc: 'inst', skill: 'elec', kind: 'res', people: 2, quoted: true, weight: 6, big: true,
    tasks: ['Isolate supply & remove old board', 'Install enclosure, main switch & SPD', 'Install RCBOs & circuit legend', 'Test & verify', 'CCEW & handover'],
    make: (r) => {
      const n = int(r, 6, 10);
      return {
        title: 'Switchboard upgrade — RCBO protection on all circuits',
        desc: `Replace old ceramic-fuse switchboard with new 36-pole enclosure. ${n} RCBOs (safety switch on every circuit), 63A main switch and surge protection. Test, label and lodge CCEW.`,
        hours: q25(6 + r() * 1.5), materials: [['encl', 1], ['mainsw', 1], ['spd', 1], ['rcbo16', Math.ceil(n / 2)], ['rcbo20', Math.floor(n / 2)], ['tps6', 4], ['consum', 2]],
      };
    },
  },
  {
    key: 'ev', jobType: 'EV Charging', cc: 'energy', skill: 'elec', kind: 'res', people: 1, quoted: true, weight: 5, big: true,
    tasks: ['Run dedicated circuit to garage', 'Mount & connect wallbox', 'Commission charger app & load management', 'Test & CCEW'],
    make: (r) => {
      const run = int(r, 10, 26);
      return { title: 'EV charger supply & install — 7kW smart wallbox', desc: `Supply and install 7kW smart wallbox in garage on a dedicated ${run}m 6mm² circuit with RCBO protection. Configure app and solar charging mode.`, hours: q25(3.5 + run * 0.08), materials: [['evc', 1], ['tps6', run], ['rcbo32', 1], ['conduit', Math.ceil(run / 8)], ['consum', 1]] };
    },
  },
  {
    key: 'splitinstall', jobType: 'Air Conditioning', cc: 'hvac', skill: 'hvac', kind: 'res', people: 1, quoted: true, weight: 6, big: true,
    tasks: ['Mount indoor & outdoor units', 'Run line set, drain & interconnect', 'Dedicated circuit & isolator', 'Pressure test, vacuum & commission'],
    make: (r) => {
      const size = pick(r, ['split71', 'split71', 'split35', 'split25']);
      const label = { split71: '7.1kW living area', split35: '3.5kW', split25: '2.5kW bedroom' }[size];
      return {
        title: `Split system supply & install — ${label}`,
        desc: `Supply and install ${PO_ITEMS[size].description.toLowerCase()} back-to-back install with dedicated circuit and isolator. Includes commissioning and handover of remote.`,
        hours: q25(5 + r() * 1.5), materials: [['splitkit', 1], ['iso20', 1], ['tps25', 14], ['rcbo20', 1], ['consum', 1]], po: [[size, 1]],
      };
    },
  },
  {
    key: 'acservice', jobType: 'Maintenance', cc: 'hvac', skill: 'hvac', kind: 'any', people: 1, quoted: false, weight: 12,
    tasks: ['Clean filters & coils', 'Flush drain & check refrigerant', 'Electrical check & report'],
    make: (r) => {
      const n = int(r, 1, 3);
      return { title: `Air conditioner service & clean — ${n} unit${n > 1 ? 's' : ''}`, desc: `Full service of ${n} split system${n > 1 ? 's' : ''}: filters, coils, drain flush, refrigerant check and electrical check.`, hours: q25(0.5 + n * 0.75), materials: [['coilclean', n]] };
    },
  },
  {
    key: 'acfault', jobType: 'Service Call', cc: 'hvac', skill: 'hvac', kind: 'any', people: 1, quoted: false, weight: 6,
    tasks: ['Diagnose fault', 'Repair', 'Test & report'],
    make: (r) => {
      const v = pick(r, [['Air conditioner not cooling — diagnose & repair', 'Unit runs but blows warm air. Diagnose and repair.'], ['Air conditioner leaking water — repair', 'Water dripping from indoor unit. Clear drain and check install.'], ['Air conditioner error code — diagnose', 'Unit showing error code and shutting down. Diagnose fault.']]);
      return { title: v[0], desc: v[1], hours: q25(1 + r() * 1), materials: [['coilclean', 1]] };
    },
  },
  {
    key: 'testtag', jobType: 'Compliance & Testing', cc: 'serv', skill: 'elec', kind: 'com', people: 1, quoted: false, weight: 6,
    tasks: ['Test & tag portable appliances', 'Test RCDs (push button & trip time)', 'Issue register & report'],
    make: (r) => {
      const n = int(r, 40, 140);
      return { title: `Test & tag — ${n} appliances + RCD testing`, desc: `Inspect, test and tag ${n} portable appliances and leads to AS/NZS 3760. Trip-time test all RCDs. Provide register and failed-item report.`, hours: q25(1.5 + n * 0.03), materials: [['consum', 1]] };
    },
  },
  {
    key: 'emergency', jobType: 'Compliance & Testing', cc: 'serv', skill: 'elec', kind: 'com', people: 1, quoted: false, weight: 5,
    tasks: ['90-minute discharge test', 'Replace failed batteries & fittings', 'Update logbook (AS 2293.2)'],
    make: (r) => {
      const n = int(r, 12, 40);
      const failed = int(r, 1, 4);
      return { title: `Emergency & exit lighting 6-monthly test — ${n} fittings`, desc: `Six-monthly 90-minute discharge test of ${n} emergency and exit fittings to AS 2293.2. Replace failed battery packs and update logbook.`, hours: q25(1.5 + n * 0.06), materials: [['nicd', failed], ['consum', 1]] };
    },
  },
  {
    key: 'batten', jobType: 'Installation', cc: 'inst', skill: 'elec', kind: 'com', people: 2, quoted: true, weight: 3, big: true,
    tasks: ['Remove fluorescent fittings', 'Install LED battens', 'Test & dispose of old tubes'],
    make: (r) => {
      const n = int(r, 12, 30);
      return { title: `LED batten upgrade — ${n} fittings`, desc: `Remove ${n} twin fluorescent fittings and replace with 36W LED battens. Recycle old tubes.`, hours: q25(1.5 + n * 0.22), materials: [['batten', n], ['consum', 2]] };
    },
  },
  {
    key: 'commercialcircuit', jobType: 'Installation', cc: 'inst', skill: 'elec', kind: 'com', people: 1, quoted: true, weight: 3, big: true,
    tasks: ['Run new circuit from distribution board', 'Install isolator & outlets', 'Test, label & CCEW'],
    make: (r) => {
      const v = pick(r, [['New 3-phase circuit & isolator for equipment', 'Run new 3-phase circuit from DB to new equipment location with weatherproof isolator.', [['iso35', 1], ['tps6', 22], ['rcbo32', 1], ['conduit', 4], ['consum', 1]]],
        ['Dedicated circuits for kitchen equipment', 'Install two dedicated circuits for new commercial kitchen equipment.', [['rcbo20', 2], ['tps25', 30], ['gpo', 2], ['consum', 1]]]]);
      return { title: v[0], desc: v[1], hours: q25(4 + r() * 2), materials: v[2] };
    },
  },
];

// Fictional mobile numbers left for residents once crew (010–015), contractors
// (041–044) and commercial contacts (101–116) have theirs.
const RES_PHONES = [...Array.from({ length: 20 }, (_, i) => 20 + i), ...Array.from({ length: 55 }, (_, i) => 45 + i), ...Array.from({ length: 43 }, (_, i) => 117 + i)];

const CATALOGUE_BY_KEY = Object.fromEntries(CATALOGUE.map((c) => [c.key, c]));

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

/**
 * Build the full demo dataset.
 *
 * @param {object}  opts
 * @param {Date}    [opts.now]   the moment the demo is loaded; every date hangs off it
 * @param {string}  [opts.scope] id prefix (`<companyId>_`), keeps ids unique per tenant
 * @param {object}  [opts.owner] the signed-in user, who plays the business owner
 * @returns {{ settings: object, collections: Record<string, object[]>, geo: Record<string, object>, summary: object }}
 */
export function buildDemoDataset({ now = new Date(), scope = '', owner = {} } = {}) {
  const r = mulberry32(0x5EED2026);

  // ---- Calendar: business days hang off the most recent weekday ----------
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // The storyline's "today" is the latest business day whose morning has
  // already happened — load the demo at 7am and the crew's half-finished
  // jobs belong to yesterday, with today's bookings still ahead.
  let anchor = !isWeekend(today) && now.getHours() < 12 ? addDays(today, -1) : today;
  while (isWeekend(anchor)) anchor = addDays(anchor, -1);
  const bd = (n) => {
    let d = anchor;
    let k = n;
    while (k !== 0) {
      d = addDays(d, k > 0 ? 1 : -1);
      if (!isWeekend(d)) k += k > 0 ? -1 : 1;
    }
    return d;
  };
  const weekStart = addDays(anchor, -((anchor.getDay() + 6) % 7));
  const inCurrentWeek = (d) => d >= weekStart;
  const daysBetween = (a, b) => Math.round((atTime(b, 12) - atTime(a, 12)) / 86400000);

  // ---- Ids and cross-reference tokens ------------------------------------
  const counters = {};
  const id = (kind) => {
    counters[kind] = (counters[kind] || 0) + 1;
    return `${scope}demo_${kind}_${counters[kind]}`;
  };
  // Text that mentions a document number is written with a token and
  // resolved once numbering is final: {{q:<quoteId>}}, {{j:<jobId>}}, {{inv:<invoiceId>}}.
  const tq = (quoteId) => `{{q:${quoteId}}}`;
  const tj = (jobId) => `{{j:${jobId}}}`;

  const C = {
    technicians: [], customers: [], leads: [], quotes: [], jobs: [], invoices: [], schedule: [], timesheets: [],
    jobMaterials: [], purchaseOrders: [], projects: [], costCenters: [], stock: [], storageLocations: [], suppliers: [],
    contractors: [], assets: [], maintenancePlans: [], notifications: [], formInstances: [], kits: [], kitTypes: [],
    locationTypes: [], taskTemplates: [], todos: [],
  };
  const geo = {};

  // ---- Crew ----------------------------------------------------------------
  const T = {};
  const ownerName = (owner.name || '').trim() || 'Mick Harbour';
  T.owner = {
    id: owner.id || id('crew'), name: ownerName, role: 'Owner / Licensed Electrician', color: owner.color || '#FF5C00',
    userTypeId: owner.userTypeId || `${scope}ut_admin`, payRate: 70, email: owner.email || 'owner@harbourline-electrical.example', phone: '0491 570 010',
  };
  CREW.forEach((c) => {
    T[c.key] = {
      id: id('crew'), name: c.name, role: c.role, color: c.color, userTypeId: `${scope}${c.userType}`, payRate: c.payRate,
      email: `${c.name.split(' ')[0].toLowerCase()}@harbourline-electrical.example`, phone: c.phone, fieldStaff: c.field,
    };
  });
  Object.values(T).forEach((t) => C.technicians.push({ ...t, deactivated: false, createdAt: isoAt(addDays(anchor, -400), 9), updatedAt: isoAt(addDays(anchor, -30), 9) }));
  const techById = Object.fromEntries(Object.values(T).map((t) => [t.id, t]));

  // ---- Cost centres, storage, stock, suppliers, contractors ----------------
  const CC = {};
  COST_CENTRES.forEach((c) => {
    CC[c.key] = id('cc');
    C.costCenters.push({ id: CC[c.key], name: c.name, code: c.code, active: true, xeroSalesAccountCode: c.sales, xeroExpenseAccountCode: c.expense, xeroTrackingCategoryName: 'Division', xeroTrackingOptionName: c.name, createdAt: isoAt(addDays(anchor, -400), 9), updatedAt: isoAt(addDays(anchor, -400), 9) });
  });

  const LOC = {};
  STORAGE.forEach((s) => {
    LOC[s.key] = { id: id('loc'), name: s.name };
    C.storageLocations.push({ id: LOC[s.key].id, name: s.name, type: s.type, technicianId: s.tech ? T[s.tech].id : null, active: true });
  });
  ['Warehouse', 'Vehicle', 'Asset', 'On Order'].forEach((n) => C.locationTypes.push({ id: id('lt'), name: n, active: true }));
  ['Service Kits', 'Installation Kits', 'Vehicle Loadouts', 'Compliance Kits'].forEach((n) => C.kitTypes.push({ id: id('kt'), name: n, active: true }));

  const SUP = {};
  SUPPLIERS.forEach((s) => {
    SUP[s.key] = { id: id('sup'), name: s.name };
    C.suppliers.push({ id: SUP[s.key].id, name: s.name, contactName: s.contact, email: s.email, phone: s.phone, address: s.address, category: s.category, accountNumber: s.account, paymentTerms: s.terms, active: true, notes: '', attachments: [], createdAt: isoAt(addDays(anchor, -380), 10), updatedAt: isoAt(addDays(anchor, -60), 10) });
  });

  const S = {};
  STOCK.forEach(([key, name, sku, category, unit, cost, sell, reorder, locs, sup]) => {
    const locations = Object.entries(locs).map(([k, qty]) => ({ location: LOC[k].name, quantity: qty }));
    const quantity = locations.reduce((s, l) => s + l.quantity, 0);
    S[key] = { id: id('stock'), name, sku, cost, sell, unit };
    C.stock.push({ id: S[key].id, name, sku, category, unit, costPrice: cost, unitPrice: sell, reorderLevel: reorder, quantity, location: locations[0].location, locations, supplier: SUP[sup].name, supplierId: SUP[sup].id, createdAt: isoAt(addDays(anchor, -380), 10), updatedAt: isoAt(addDays(anchor, -2), 15) });
  });

  const CON = {};
  CONTRACTORS.forEach((c) => {
    CON[c.key] = id('con');
    const expiry = dateKey(addDays(today, c.insuranceExpiryDays));
    C.contractors.push({
      id: CON[c.key], businessName: c.businessName, name: c.businessName, contactName: c.contactName, email: c.email, phone: c.phone, active: true,
      licenseNumber: c.licence, hourlyRate: c.hourly, afterHoursRate: c.ah, calloutFee: c.callout, specialties: c.specialties, notes: '',
      portalToken: `${scope}cpt_${c.key}`,
      complianceDocs: [
        { id: id('cred'), type: 'Public Liability Insurance', number: `PL-${int(r, 100000, 999999)}`, expiryDate: expiry, verified: true, notes: '$20M cover' },
        { id: id('cred'), type: 'Workers Compensation', number: `WC-${int(r, 100000, 999999)}`, expiryDate: dateKey(addDays(today, c.insuranceExpiryDays + 120)), verified: true, notes: '' },
        { id: id('cred'), type: 'Trade License', number: c.licence, expiryDate: dateKey(addDays(today, 400)), verified: true, notes: '' },
      ],
      createdAt: isoAt(addDays(anchor, -300), 10), updatedAt: isoAt(addDays(anchor, -20), 10),
    });
  });

  // ---- Customers -----------------------------------------------------------
  const custById = {};
  const addressFor = (street, suburb) => `${street}, ${suburb} NSW ${SUBURBS[suburb][2]}`;
  const remember = (address, suburb) => {
    const [lat, lng] = SUBURBS[suburb];
    geo[address] = { lat: round2((lat + (r() - 0.5) * 0.008) * 1000) / 1000, lng: round2((lng + (r() - 0.5) * 0.008) * 1000) / 1000, formattedAddress: `${address}, Australia`, placeId: null, partialMatch: false };
  };
  const nameKey = (f, l) => `${f} ${l}`;
  const usedNames = new Set();

  const COM = {};
  COMMERCIAL.forEach((c, i) => {
    const cid = id('cust');
    const address = addressFor(c.street, c.suburb);
    remember(address, c.suburb);
    const sites = c.sites.map(([name, addr, notes]) => {
      const sub = Object.keys(SUBURBS).find((s) => addr.includes(`, ${s} NSW`));
      if (sub) remember(addr, sub);
      return { name, address: addr, notes };
    });
    const rec = {
      id: cid, type: 'Company', company: c.company, firstName: c.first, lastName: c.last, email: c.email, phone: c.phone, address, status: 'Active',
      portalToken: `${scope}cpt_cust_${c.key}`, paymentTermsDays: c.terms,
      contacts: c.contacts.map(([name, role, phone]) => ({ name, role, phone, email: name.includes(' ') && !name.startsWith('Accounts') && !name.startsWith('Admin') ? `${name.split(' ')[0].toLowerCase()}@${c.email.split('@')[1]}` : c.email })),
      sites, notes: '', createdAt: isoAt(addDays(anchor, -260 + i * 9), 10), updatedAt: isoAt(addDays(anchor, -5), 10),
    };
    COM[c.key] = rec;
    custById[cid] = rec;
    C.customers.push(rec);
  });

  const resident = (first, last, street, suburb, createdAt, extra = {}) => {
    const address = addressFor(street, suburb);
    remember(address, suburb);
    usedNames.add(nameKey(first, last));
    const slug = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');
    const rec = {
      id: id('cust'), type: 'Individual', company: '', firstName: first, lastName: last, email: `${slug}@mail.example`,
      phone: `0491 570 ${pad(RES_PHONES[C.customers.length % RES_PHONES.length], 3)}`, address, status: 'Active', portalToken: null, paymentTermsDays: 7,
      contacts: [], sites: [{ name: 'Home', address, notes: extra.siteNotes || '' }], notes: extra.notes || '',
      createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString(),
    };
    rec.portalToken = `${rec.id}_pt`;
    custById[rec.id] = rec;
    C.customers.push(rec);
    return rec;
  };
  const displayName = (c) => c.company || `${c.firstName} ${c.lastName}`.trim();

  // Hand-written residents for the storylines are created up front so the
  // generated pool never reuses their names.
  const H = {
    petrakis: resident('Louise', 'Petrakis', '27 Kingfisher Road', 'Merewether', atTime(bd(-14), 9.3), { siteNotes: 'Side gate on left. Two cats — keep laundry door shut.' }),
    turner: resident('Ashleigh', 'Turner', '9 Lorikeet Street', 'Hamilton', atTime(bd(-6), 20.2)),
    nguyen: resident('Daniel', 'Nguyen', '12 Paperbark Close', 'Thornton', atTime(bd(-34), 11), { siteNotes: 'Two-storey, tiled roof, north-facing. Ladder access from side yard.' }),
    halloran: resident('Craig', 'Halloran', '31 Banksia Parade', 'Warners Bay', atTime(bd(-6), 12.5)),
    delaney: resident('Sophie', 'Delaney', '8 Myrtle Street', 'Adamstown', atTime(bd(-4), 10)),
    castellano: resident('Ruth', 'Castellano', '17 Wren Street', 'Mayfield', atTime(bd(-2), 14.2)),
    iyer: resident('Priyanka', 'Iyer', '6 Mulga Close', 'Fletcher', atTime(anchor, 6.2)),
    szabo: resident('Bronwyn', 'Szabo', '22 Boronia Avenue', 'Charlestown', atTime(bd(-1), 13.6)),
    kowalski: resident('Marcus', 'Kowalski', '40 Tea Tree Close', 'Kahibah', atTime(bd(-22), 9)),
    rowe: resident('Hayley', 'Rowe', '3 Casuarina Way', 'Eleebana', atTime(bd(-12), 19)),
    osei: resident('Nathan', 'Osei', '15 Jacaranda Avenue', 'Kotara', atTime(bd(-16), 8.7)),
  };

  const pool = [];
  const heroSurnames = new Set(Object.values(H).map((c) => c.lastName));
  const surnames = LAST.filter((l) => !heroSurnames.has(l));
  FIRST.forEach((f, i) => [7, 11, 13].forEach((m, j) => pool.push([f, surnames[(i * m + j * 5) % surnames.length]])));
  const residents = [];
  const suburbList = Object.keys(SUBURBS);
  const pickResident = (when) => {
    if (residents.length > 8 && r() < 0.22) return pick(r, residents);
    while (pool.length) {
      const [f, l] = pool.splice(Math.floor(r() * pool.length), 1)[0];
      if (usedNames.has(nameKey(f, l))) continue;
      const rec = resident(f, l, `${int(r, 2, 96)} ${pick(r, STREETS)}`, pick(r, suburbList), atTime(when, 8 + r() * 9));
      residents.push(rec);
      return rec;
    }
    return pick(r, residents);
  };
  const COM_WEIGHTS = { northside: 8, seaview: 5, dental: 2, childcare: 3, brewing: 2, forge: 3, physio: 2, espresso: 2, hall: 2, coastalreno: 3 };
  const COM_FOR = { testtag: ['forge', 'hall', 'childcare', 'physio', 'espresso', 'brewing'], emergency: ['seaview', 'hall', 'childcare', 'forge', 'brewing'] };
  const pickCommercial = (catKey) => {
    const keys = COM_FOR[catKey] || Object.keys(COM_WEIGHTS);
    const total = keys.reduce((s, k) => s + COM_WEIGHTS[k], 0);
    let x = r() * total;
    for (const k of keys) { x -= COM_WEIGHTS[k]; if (x <= 0) return COM[k]; }
    return COM[keys[0]];
  };
  const siteFor = (cust) => {
    if (cust.type !== 'Company' || !cust.sites.length) return cust.sites[0] || { name: '', address: cust.address };
    return pick(r, cust.sites);
  };

  // ---- Document helpers ------------------------------------------------------
  const line = (description, type, qty, rate, internalCost = 0) => ({ id: id('li'), description, type, qty, rate, unitPrice: rate, internalCost, total: round2(qty * rate) });
  const priced = (sections) => {
    let subtotal = 0;
    sections.forEach((s) => { s.subtotal = round2(s.lineItems.reduce((a, l) => a + l.total, 0)); subtotal += s.subtotal; });
    subtotal = round2(subtotal);
    const tax = round2(subtotal * 0.1);
    return { subtotal, tax, total: round2(subtotal + tax) };
  };
  const cloneSections = (sections) => sections.map((s) => ({ ...s, id: id('sec'), lineItems: s.lineItems.map((l) => ({ ...l, id: id('li') })) }));
  const stockLine = (k, q) => line(S[k].name, 'material', q, S[k].sell, S[k].cost);
  const poLine = (k, q, sell) => line(PO_ITEMS[k].description, 'material', q, sell ?? PO_ITEMS[k].sell, PO_ITEMS[k].cost);
  const labourLine = (who, hours, rate = RATE.std) => line(who === 'tom' ? 'Labour — Apprentice Electrician' : (who === 'sam' ? 'Labour — Air Con Mechanic' : 'Labour — Licensed Electrician'), 'labor', hours, who === 'tom' ? RATE.apprentice : rate, T[who].payRate);
  const halfUp = (h) => Math.ceil(h * 2) / 2;

  const quoteSectionsFor = (cat, spec, leadKey) => {
    const items = [];
    (spec.po || []).forEach(([k, q]) => items.push(poLine(k, q)));
    spec.materials.forEach(([k, q]) => items.push(stockLine(k, q)));
    const sections = [{ id: id('sec'), name: 'Supply & install', lineItems: items }];
    const labour = [labourLine(leadKey, halfUp(spec.hours))];
    if (cat.people === 2) labour.push(labourLine('tom', halfUp(spec.hours)));
    sections.push({ id: id('sec'), name: 'Labour, testing & certification', lineItems: labour });
    return sections;
  };

  const historyEntry = (when, status, text, user) => ({ id: id('hist'), status, text, user, timestamp: when.toISOString() });

  const makeLead = (o) => {
    const lead = {
      id: id('lead'), number: null, title: o.title, customerId: o.cust.id, customerName: displayName(o.cust), contactName: `${o.cust.firstName} ${o.cust.lastName}`.trim(),
      phone: o.cust.phone, email: o.cust.email, status: o.status, source: o.source, origin: 'Internal', value: o.value, budget: o.budget || 0,
      priority: o.priority || 'Medium', description: o.description || '', requirements: o.requirements || '',
      assignedTo: o.assignedTo ? T[o.assignedTo].id : '', assignedToName: o.assignedTo ? T[o.assignedTo].name : '', salesRepName: o.assignedTo ? T[o.assignedTo].name : '',
      nextActionDate: o.nextAction ? dateKey(o.nextAction) : '',
      stageHistory: (o.history || []).map(([when, status, text, who]) => historyEntry(when, status, text, who || T.owner.name)).reverse(),
      activityLog: (o.activity || []).map(([when, who, content]) => ({ id: id('lact'), content, files: [], date: when.toISOString(), author: who })).reverse(),
      createdAt: o.created.toISOString(), updatedAt: (o.updated || o.created).toISOString(),
    };
    C.leads.push(lead);
    return lead;
  };

  const makeQuote = (o) => {
    const sections = o.sections;
    const totals = priced(sections);
    const quote = {
      id: id('quote'), number: null, version: 1, customerId: o.cust.id, customerName: displayName(o.cust), contactName: o.contactName || `${o.cust.firstName} ${o.cust.lastName}`.trim(),
      title: o.title, description: o.description || '', status: o.status, sections, ...totals, laborProfileId: 'rate_1',
      validUntil: dateKey(addDays(o.created, 30)), notes: o.notes || 'Price valid for 30 days. Includes all testing, certification (CCEW) and removal of rubbish.',
      leadId: o.leadId || null, siteAddress: o.site ? o.site.address : o.cust.address,
      createdAt: o.created.toISOString(), updatedAt: (o.decided || o.sent || o.created).toISOString(),
    };
    if (o.sent) { quote.emailStatus = 'Sent'; quote.sentAt = o.sent.toISOString(); }
    if (o.signedBy && o.decided) { quote.signedByName = o.signedBy; quote.signedAt = o.decided.toISOString(); quote.signatureData = o.signedBy; }
    if (o.status === 'Declined' && o.decided) { quote.declinedAt = o.decided.toISOString(); quote.declineReason = o.declineReason || ''; }
    C.quotes.push(quote);
    return quote;
  };

  const buildTasks = (names, totalHours, people, state = {}) => {
    const per = q25(totalHours / names.length) || 0.25;
    const done = state.done ?? 0;
    return names.map((name, i) => {
      const isDone = i < done;
      const isPartial = i === done && state.partial;
      const task = {
        id: id('task'), name, status: isDone ? 'Completed' : (isPartial ? 'In Progress' : 'Not Started'), progress: isDone ? 100 : (isPartial ? state.partial : 0),
        startDate: isoAt(state.start || anchor, state.startHour || 7), estimatedHours: per, people, description: '', technicians: [], subTasks: [],
      };
      if (isDone && state.by) { task.completedBy = state.by; task.completedAt = isoAt(state.start || anchor, (state.startHour || 8) + per * (i + 1)); }
      return task;
    });
  };

  const makeJob = (o) => {
    const site = o.site || siteFor(o.cust);
    const lead = o.lead ? T[o.lead] : null;
    const crew = (o.crew || (o.lead ? [o.lead] : [])).map((k) => T[k]);
    const cat = o.cat || null;
    const people = o.people || crew.length || 1;
    const tasks = o.tasks || buildTasks(cat ? cat.tasks : ['Complete works'], o.hours || 2, people, o.taskState);
    const job = {
      id: id('job'), number: null, customerId: o.cust.id, customerName: displayName(o.cust), contactName: o.contactName || `${o.cust.firstName} ${o.cust.lastName}`.trim(),
      siteName: site.name || '', siteAddress: site.address || o.cust.address, title: o.title, description: o.desc || '',
      type: o.jobType || (cat ? cat.jobType : 'Service Call'), status: o.status, priority: o.priority || 'Medium',
      technicianId: lead ? lead.id : null, technicianName: lead ? lead.name : '',
      technicians: crew.map((t) => ({ id: t.id, name: t.name, role: t.role, color: t.color })),
      quoteId: o.quoteId || null, projectId: o.projectId || null, costCenterId: CC[o.cc || (cat ? cat.cc : 'serv')],
      assetId: o.assetId || null, scheduledDate: o.scheduled ? dateKey(o.scheduled) : null, startHour: o.scheduled ? o.startHour : undefined,
      preferredTime: o.preferredTime || '', estimatedHours: o.hours || 0, tasks, phases: tasks, materials: [], laborCost: 0, materialCost: 0,
      estimatedLaborCost: 0, estimatedMaterialCost: 0, isEmergency: !!o.isEmergency, tags: o.tags || [], isRecurring: false, recurringConfig: null,
      activityLog: (o.notes || []).map(([when, who, content]) => ({ id: id('note'), type: 'combined', content, files: [], date: when.toISOString(), author: who })).reverse(),
      customerActivityLog: [], historyLog: [],
      createdAt: o.created.toISOString(), updatedAt: (o.updated || o.created).toISOString(),
    };
    if (o.parentJobId) { job.parentJobId = o.parentJobId; job.templateDate = o.templateDate; }
    tasks.filter((t) => t.completedAt).forEach((t) => job.historyLog.unshift({ id: id('hl'), type: 'system', action: 'task_completed', date: t.completedAt, author: t.completedBy, content: `Task "${t.name}" marked as completed` }));
    C.jobs.push(job);
    return job;
  };

  const busy = {};
  const reserve = (key, d, start, end) => {
    const dk = dateKey(d);
    busy[key] = busy[key] || {};
    (busy[key][dk] = busy[key][dk] || []).push([start, end]);
  };
  const freeFrom = (key, d) => {
    const slots = (busy[key] && busy[key][dateKey(d)]) || [];
    return slots.reduce((m, [, e]) => Math.max(m, e + 0.5), 0);
  };
  const isBusy = (key, d, start, end) => ((busy[key] && busy[key][dateKey(d)]) || []).some(([s, e]) => Math.max(s, start) < Math.min(e, end));

  const workTask = (job) => job.tasks[Math.min(1, job.tasks.length - 1)];
  const work = (job, keys, d, start, hours, tsStatus, tsHours) => {
    keys.forEach((k) => {
      const t = T[k];
      reserve(k, d, start, start + hours);
      C.schedule.push({
        id: id('sch'), jobId: job.id, jobNumber: null, title: job.title, jobTitle: job.title, technicianId: t.id, technicianName: t.name, color: t.color,
        date: dateKey(d), startTime: localStamp(d, start), finishTime: localStamp(d, start + hours), hours, startHour: start, endHour: start + hours,
        taskId: null, taskName: null, customerName: job.customerName, siteAddress: job.siteAddress, notes: '',
        createdAt: job.createdAt, updatedAt: job.createdAt,
      });
      if (tsStatus) {
        const h = tsHours ?? hours;
        const task = workTask(job);
        C.timesheets.push({
          id: id('ts'), jobId: job.id, jobNumber: null, jobTitle: job.title, taskId: task.id, taskName: task.name, phaseId: task.id, phaseName: task.name,
          technicianId: t.id, technicianName: t.name, date: dateKey(d), startTime: localStamp(d, start), finishTime: localStamp(d, start + h), hours: h,
          description: tsStatus === 'Approved' ? 'Completed as per job scope.' : '', status: tsStatus, approvedBy: tsStatus === 'Approved' ? T.bec.name : null,
          createdAt: isoAt(d, start + h + 0.1), updatedAt: isoAt(d, start + h + 0.1),
        });
      }
    });
  };

  const useMaterials = (job, list, d, techKey) => {
    const van = { dale: 'van1', tom: 'van1', priya: 'van2', sam: 'van3' }[techKey] || 'workshop';
    list.forEach(([k, q]) => {
      const rec = {
        id: id('jm'), jobId: job.id, jobNumber: null, partId: S[k].id, stockId: S[k].id, partName: S[k].name, name: S[k].name, quantity: q,
        unitCost: S[k].cost, totalCost: round2(S[k].cost * q), location: LOC[van].name, date: isoAt(d, 12),
        createdAt: isoAt(d, 12), updatedAt: isoAt(d, 12),
      };
      job.materials.push(rec);
      C.jobMaterials.push(rec);
    });
  };

  const makePO = (o) => {
    const lineItems = o.items.map(([k, q]) => {
      if (PO_ITEMS[k]) return { description: PO_ITEMS[k].description, sku: PO_ITEMS[k].sku, unitCost: PO_ITEMS[k].cost, quantity: q, stockId: '' };
      return { description: S[k].name, sku: S[k].sku, unitCost: S[k].cost, quantity: q, stockId: S[k].id };
    });
    const total = round2(lineItems.reduce((s, l) => s + l.unitCost * l.quantity, 0));
    const po = {
      id: id('po'), number: null, supplierId: SUP[o.sup].id, supplierName: SUP[o.sup].name, status: o.status, jobId: o.job ? o.job.id : '', jobNumber: '',
      issueDate: dateKey(o.issue), expectedDate: o.expected ? dateKey(o.expected) : '', receivedDate: o.received ? dateKey(o.received) : '',
      notes: o.notes || '', lineItems, items: lineItems, total, createdAt: isoAt(o.issue, 9), updatedAt: isoAt(o.received || o.issue, 10),
    };
    C.purchaseOrders.push(po);
    return po;
  };

  const settle = (cust, issue, rr) => {
    const terms = cust.paymentTermsDays || 7;
    const lag = cust.type === 'Individual' ? 1 + Math.floor(rr * rr * 13) : Math.round(terms * (0.45 + rr * 1.05));
    const paidOn = addDays(issue, lag);
    if (paidOn < today) return { status: 'Paid', paidOn };
    if (addDays(issue, terms) < today) return { status: 'Overdue', paidOn: null };
    return { status: 'Sent', paidOn: null };
  };

  const makeInvoice = (o) => {
    const cust = o.cust;
    const totals = priced(o.sections);
    const terms = o.terms ?? (cust.paymentTermsDays || 7);
    const inv = {
      id: id('inv'), number: null, title: o.title, invoiceType: o.type || 'Standard', jobId: o.job ? o.job.id : null, jobNumber: null,
      customerId: cust.id, customerName: displayName(cust), contactName: o.contactName || `${cust.firstName} ${cust.lastName}`.trim(),
      status: o.status, sections: o.sections, ...totals, issueDate: isoAt(o.issue, 16.5), dueDate: isoAt(addDays(o.issue, terms), 17),
      laborProfileId: 'rate_1', notes: o.notes || '', originalQuoteId: o.quote ? o.quote.id : '', originalQuoteNumber: null, originalSubtotal: o.quote ? o.quote.subtotal : totals.subtotal,
      payments: [], createdAt: isoAt(o.issue, 16.4), updatedAt: isoAt(o.paidOn || o.issue, 16.5),
    };
    if (o.status !== 'Draft') inv.sentAt = isoAt(o.issue, 16.5);
    if (o.status === 'Paid') {
      const method = o.method || (r() < 0.72 ? 'Bank Transfer' : (r() < 0.9 ? 'Credit Card' : 'Cash'));
      inv.paidDate = dateKey(o.paidOn);
      inv.paymentMethod = method;
      inv.payments = [{ id: id('pay'), amount: totals.total, date: isoAt(o.paidOn, 11), method, reference: method === 'Bank Transfer' ? 'Direct deposit' : (method === 'Credit Card' ? 'Online payment link' : ''), recordedBy: T.bec.name }];
    }
    C.invoices.push(inv);
    return inv;
  };

  const serviceSections = (o) => {
    const items = [];
    items.push(line(o.emergency ? 'Emergency call-out fee' : 'Call-out fee', 'other', 1, o.emergency ? RATE.emergencyCallout : RATE.callout));
    Object.entries(o.hours).forEach(([k, h]) => items.push(labourLine(k, halfUp(h), o.emergency ? RATE.emergency : RATE.std)));
    o.materials.forEach(([k, q]) => items.push(stockLine(k, q)));
    return [{ id: id('sec'), name: 'Works completed', lineItems: items }];
  };

  // =========================================================================
  // STORYLINES — the "this week" a visitor walks through. Written first so
  // the generated history works around the crew time they reserve.
  // =========================================================================
  const own = T.owner.name;
  const withTom = (d, lead = 'dale') => (d.getDay() === 3 ? [lead] : [lead, 'tom']);
  const dale = T.dale.name;
  const priya = T.priya.name;
  const sam = T.sam.name;
  const bec = T.bec.name;

  // ---- 1. Petrakis: referral → site visit → quote → signed online → switchboard upgrade on site today
  const sbCat = CATALOGUE_BY_KEY.switchboard;
  const sbSpec = { hours: 7, materials: [['encl', 1], ['mainsw', 1], ['spd', 1], ['rcbo16', 4], ['rcbo20', 4], ['tps6', 4], ['consum', 2]] };
  const l1 = makeLead({
    cust: H.petrakis, title: 'Switchboard upgrade — 1950s fuse board', source: 'Referral', status: 'Won', value: 3650, priority: 'High', assignedTo: 'owner',
    description: 'Original 1958 switchboard with rewireable fuses. Insurer has asked for it to be brought up to standard.', requirements: 'Safety switch on every circuit. Work done in one day — Louise works from home.',
    created: atTime(bd(-14), 9.3), updated: atTime(bd(-8), 19.7),
    history: [[atTime(bd(-14), 9.3), 'New', 'Lead created from phone enquiry.'], [atTime(bd(-14), 11), 'Contacted', 'Called back, site visit booked for Thursday 3:30pm.'], [atTime(bd(-12), 16.5), 'Qualified', 'Site visit done — full board replacement required.']],
    activity: [[atTime(bd(-14), 9.4), bec, 'Referred by their neighbour at No. 31 — we did her downlights in autumn.'], [atTime(bd(-12), 16.6), own, 'Site visit: 1958 board, rewireable fuses, no RCDs at all. 8 circuits. Meter panel looks like old fibro — flag for the crew.']],
  });
  const q1 = makeQuote({
    cust: H.petrakis, title: 'Switchboard upgrade — RCBO protection on all circuits', status: 'Converted', created: atTime(bd(-11), 8.5), sent: atTime(bd(-11), 8.6), decided: atTime(bd(-8), 19.7), signedBy: 'Louise Petrakis', leadId: l1.id,
    description: 'Replace original ceramic-fuse switchboard with a new 36-pole enclosure, 63A main switch, surge protection and an RCBO on every circuit.',
    sections: [
      { id: id('sec'), name: 'New switchboard', lineItems: [stockLine('encl', 1), stockLine('mainsw', 1), stockLine('spd', 1), stockLine('rcbo16', 4), stockLine('rcbo20', 4), stockLine('tps6', 4), stockLine('consum', 2), labourLine('owner', 7), labourLine('tom', 7)] },
      { id: id('sec'), name: 'Testing, certification & CCEW', lineItems: [labourLine('owner', 1)] },
    ],
  });
  l1.stageHistory.unshift(historyEntry(atTime(bd(-11), 8.5), 'Won', `Converted to Quote ${tq(q1.id)} (Status: Won).`, own));
  const j1 = makeJob({
    cust: H.petrakis, title: 'Switchboard upgrade — RCBO protection on all circuits', desc: q1.description, cat: sbCat, status: 'In Progress', priority: 'High',
    created: atTime(bd(-8), 20), updated: atTime(anchor, 10.3), scheduled: anchor, startHour: 7, lead: 'dale', crew: withTom(anchor), quoteId: q1.id, hours: 8,
    tasks: (() => {
      const t = buildTasks(sbCat.tasks, 8, 2, { done: 2, partial: 50, by: dale, start: anchor, startHour: 7 });
      t[0].completedAt = isoAt(anchor, 8.7); t[1].completedAt = isoAt(anchor, 10.5);
      t[3].valueFields = [
        { id: id('vf'), label: 'Insulation resistance (worst circuit)', unit: 'MΩ', fieldType: 'number', min: '1', max: '', value: '' },
        { id: id('vf'), label: 'RCD trip time — slowest device', unit: 'ms', fieldType: 'number', min: '', max: '30', value: '' },
        { id: id('vf'), label: 'Earth continuity (main earth)', unit: 'Ω', fieldType: 'number', min: '', max: '0.5', value: '' },
        { id: id('vf'), label: 'Polarity correct', unit: '', fieldType: 'dropdown', options: ['Yes', 'No'], expectedValue: 'Yes', value: '' },
      ];
      return t;
    })(),
    notes: [[atTime(anchor, 7.1), dale, 'On site. Power off to house from 7:15 — Louise is aware and has moved her calls to the afternoon.'],
      [atTime(anchor, 10.3), dale, 'Meter panel is old fibrous cement board. Not touching it — raised a field fault so the office can quote a replacement and organise a hazmat sample.']],
  });
  work(j1, withTom(anchor), anchor, 7, 8, 'Pending', 4.5);
  useMaterials(j1, sbSpec.materials.slice(0, 5), anchor, 'dale');
  C.formInstances.push({ id: id('fi'), jobId: j1.id, templateId: `${scope}ft_jsa_swms`, status: 'Completed', submittedBy: T.dale.id, submittedAt: isoAt(anchor, 6.95), createdAt: isoAt(bd(-8), 20),
    responses: { f_jsa_job: 'Switchboard upgrade — 27 Kingfisher Rd', f_jsa_date: dateKey(anchor), f_jsa_supervisor: dale, f_jsa_company: DEMO_COMPANY_NAME, f_jsa_desc: 'Isolate supply at the pole fuse, remove old fuse board, install and terminate new switchboard, test and re-energise.',
      f_jsa_haz_elec: true, f_jsa_haz_chem: true, f_jsa_haz_other: 'Possible asbestos in meter panel backing board', f_jsa_ppe_boots: true, f_jsa_ppe_glasses: true,
      f_jsa_control_desc: 'Lock out / tag out at main switch and service fuse, test for dead before touching. Do not drill, cut or disturb the meter panel — treat as asbestos until sampled.', f_jsa_sign: dale } });
  C.formInstances.push({ id: id('fi'), jobId: j1.id, templateId: `${scope}ft_switchboard`, status: 'Pending', responses: { f_sw_id: 'MSB — Main house', f_sw_loc: 'Front verandah, left of door', f_sw_rating: '63' }, createdAt: isoAt(bd(-8), 20) });
  C.notifications.push({ id: id('notif'), type: 'Field Fault', title: 'Meter panel — suspected asbestos backing board', jobId: j1.id, customerId: H.petrakis.id, customerName: displayName(H.petrakis),
    description: `Raised on site at 27 Kingfisher Road during ${tj(j1.id)}.\n\nMeter panel backing board appears to be fibrous cement (likely asbestos). Not disturbed. Recommend: hazmat sample, then quote to replace meter panel with new enclosure.\n\nCustomer has been told and is keen for a price.`,
    priority: 'High', status: 'Pending', createdAt: isoAt(anchor, 10.3), createdBy: dale, origin: 'user' });

  // ---- 2. Dental surgery: dedicated circuits for new X-ray unit, Priya on site this morning
  const dentSpec = { hours: 5.5, materials: [['rcbo20', 2], ['iso20', 1], ['tps25', 30], ['gpo', 2], ['consum', 1]] };
  const q2 = makeQuote({
    cust: COM.dental, contactName: 'Shona Kemp', title: 'Dedicated circuits for new OPG X-ray unit', status: 'Converted', created: atTime(bd(-9), 14), sent: atTime(bd(-9), 14.2), decided: atTime(bd(-6), 10), signedBy: 'Shona Kemp',
    description: 'Two dedicated 20A circuits from the surgery distribution board to the new OPG room, isolator and outlets to the equipment supplier\'s installation spec.',
    sections: [{ id: id('sec'), name: 'Supply & install', lineItems: [...dentSpec.materials.map(([k, q]) => stockLine(k, q)), labourLine('priya', 6)] }],
  });
  const j2 = makeJob({
    cust: COM.dental, contactName: 'Shona Kemp', title: 'Dedicated circuits for new OPG X-ray unit', desc: q2.description, cat: CATALOGUE_BY_KEY.commercialcircuit, status: 'In Progress',
    created: atTime(bd(-6), 10.5), scheduled: anchor, startHour: 7, lead: 'priya', quoteId: q2.id, hours: 5.5, taskState: { done: 1, partial: 40, by: priya, start: anchor, startHour: 7 },
    notes: [[atTime(bd(-6), 10.6), bec, 'Shona asked us to be out of treatment room 2 by 12:30 — first patient 1pm.']],
  });
  work(j2, ['priya'], anchor, 7, 5.5, 'Pending', 3);
  useMaterials(j2, dentSpec.materials.slice(0, 3), anchor, 'priya');

  // ---- 3. Sam: childcare air-con service (maintenance plan) then a split install at Kotara
  const ccServ = makeJob({
    cust: COM.childcare, title: 'Six-monthly air conditioner service — 3 units', desc: 'Scheduled six-monthly service of three split systems under the centre\'s maintenance agreement.', cat: CATALOGUE_BY_KEY.acservice,
    status: 'In Progress', created: atTime(bd(-10), 9), scheduled: anchor, startHour: 7.5, lead: 'sam', hours: 2.5, taskState: { done: 1, partial: 60, by: sam, start: anchor, startHour: 7.5 },
    notes: [[atTime(bd(-10), 9.1), bec, 'Robyn asked for Babies room first — they nap from 11:30.']],
  });
  work(ccServ, ['sam'], anchor, 7.5, 2.5, 'Pending', 2);
  C.formInstances.push({ id: id('fi'), jobId: ccServ.id, templateId: `${scope}ft_hvac_maint`, status: 'Pending', responses: { f_hvac_type: 'Split System', f_hvac_filters: true, f_hvac_coils: true }, createdAt: isoAt(bd(-10), 9) });

  const oseiCat = CATALOGUE_BY_KEY.splitinstall;
  const oseiSpec = { hours: 4.75, materials: [['splitkit', 1], ['iso20', 1], ['tps25', 14], ['rcbo20', 1], ['consum', 1]], po: [['split71', 1]] };
  const lOsei = makeLead({ cust: H.osei, title: 'Split system for open-plan living area', source: 'Google Ads', status: 'Won', value: 3900, assignedTo: 'owner', created: atTime(bd(-16), 8.7),
    history: [[atTime(bd(-16), 8.7), 'New', 'Lead created from Google Ads enquiry form.'], [atTime(bd(-16), 10), 'Contacted', 'Phoned — measured up from photos.']] });
  const qOsei = makeQuote({ cust: H.osei, title: 'Split system supply & install — 7.1kW living area', status: 'Converted', created: atTime(bd(-15), 15), sent: atTime(bd(-15), 15.1), decided: atTime(bd(-11), 18), signedBy: 'Nathan Osei', leadId: lOsei.id,
    description: 'Supply and install 7.1kW reverse-cycle inverter split system, back-to-back on the north wall, dedicated circuit and isolator.', sections: quoteSectionsFor(oseiCat, oseiSpec, 'sam') });
  lOsei.stageHistory.unshift(historyEntry(atTime(bd(-15), 15), 'Won', `Converted to Quote ${tq(qOsei.id)} (Status: Won).`, own));
  const jOsei = makeJob({ cust: H.osei, title: qOsei.title, desc: qOsei.description, cat: oseiCat, status: 'Scheduled', created: atTime(bd(-11), 18.5), scheduled: anchor, startHour: 10.75, lead: 'sam', quoteId: qOsei.id, hours: 4.75 });
  work(jOsei, ['sam'], anchor, 10.75, 4.75, null);
  makePO({ sup: 'airsource', job: jOsei, items: [['split71', 1]], status: 'Received', issue: bd(-10), expected: bd(-3), received: bd(-2), notes: 'Deliver to Cardiff workshop.' });

  // ---- 4. Yesterday: three rental smoke-alarm jobs finished — ready to invoice
  const smokeJob = makeJob({
    cust: COM.northside, contactName: 'Tegan Albright', site: COM.northside.sites[0], title: 'Smoke alarm replacement — 3 rental properties', cat: CATALOGUE_BY_KEY.smoke,
    desc: 'Replace expired smoke alarms at 14 Myrtle St Waratah (3), 6/22 Wren St Mayfield (2) and 91 Currawong Rd Jesmond (2). Issue compliance statements for the landlord files.',
    status: 'Completed', created: atTime(bd(-4), 9), updated: atTime(bd(-1), 11.6), scheduled: bd(-1), startHour: 7, lead: 'priya', hours: 4.5, taskState: { done: 4, by: priya, start: bd(-1), startHour: 7 },
    notes: [[atTime(bd(-1), 9.2), priya, 'Jesmond tenant not home — key from the office worked fine. Dog was in the backyard as noted.']],
  });
  work(smokeJob, ['priya'], bd(-1), 7, 4.5, inCurrentWeek(bd(-1)) ? 'Pending' : 'Approved');
  useMaterials(smokeJob, [['smoke', 7], ['tps15', 12], ['consum', 1]], bd(-1), 'priya');

  // ---- 5. EV charger quote signed online last night — waiting to be converted to a job
  const evCat = CATALOGUE_BY_KEY.ev;
  const evSpec = { hours: 4.5, materials: [['evc', 1], ['tps6', 14], ['rcbo32', 1], ['conduit', 2], ['consum', 1]] };
  const l5 = makeLead({ cust: H.turner, title: 'EV charger for new Model 3', source: 'Website', status: 'Won', value: 2350, assignedTo: 'owner', created: atTime(bd(-6), 20.2),
    requirements: 'Charger on the garage side wall, about 14m from the switchboard. Wants it to charge from solar during the day.',
    history: [[atTime(bd(-6), 20.2), 'New', 'Lead created from website enquiry.'], [atTime(bd(-5), 8.4), 'Contacted', 'Called Ashleigh — photos of board and garage received.']] });
  const q5 = makeQuote({ cust: H.turner, title: 'EV charger supply & install — 7kW smart wallbox', status: 'Accepted', created: atTime(bd(-5), 11), sent: atTime(bd(-5), 11.1), decided: atTime(bd(-1), 21.1), signedBy: 'Ashleigh Turner', leadId: l5.id,
    description: 'Supply and install a 7kW smart wallbox in the garage on a dedicated 14m 6mm² circuit with RCBO protection. Configure app and solar charging mode.', sections: quoteSectionsFor(evCat, evSpec, 'dale') });
  l5.stageHistory.unshift(historyEntry(atTime(bd(-5), 11), 'Won', `Converted to Quote ${tq(q5.id)} (Status: Won).`, own));
  C.notifications.push({ id: id('notif'), type: 'Quote Accepted', title: `Quote ${tq(q5.id)} Accepted`, quoteId: q5.id, customerId: H.turner.id, customerName: displayName(H.turner),
    description: `Client Ashleigh Turner has signed and accepted Quote ${tq(q5.id)} ("${q5.title}"). Ready for conversion to job.`, priority: 'High', status: 'Pending', createdAt: isoAt(bd(-1), 21.1), createdBy: 'Ashleigh Turner', origin: 'user' });

  // ---- 6. Kotara Physio: LED upgrade quote out, client negotiating
  const physioSpec = { hours: 8, materials: [['batten', 34], ['consum', 2]] };
  const q6 = makeQuote({ cust: COM.physio, title: 'LED batten upgrade — 34 fittings (clinic & studio)', status: 'Sent', created: atTime(bd(-7), 15), sent: atTime(bd(-7), 15.2),
    description: 'Replace 34 twin fluorescent fittings with 36W tri-colour LED battens across the clinic rooms and Pilates studio. Work done after hours.', sections: quoteSectionsFor(CATALOGUE_BY_KEY.batten, physioSpec, 'priya') });
  makeLead({ cust: COM.physio, title: 'Clinic & studio LED upgrade', source: 'Google Ads', status: 'Negotiation', value: q6.subtotal, assignedTo: 'owner', created: atTime(bd(-10), 12), updated: atTime(bd(-1), 16.3), nextAction: anchor, priority: 'Medium',
    history: [[atTime(bd(-10), 12), 'New', 'Lead created from Google Ads enquiry form.'], [atTime(bd(-10), 14), 'Contacted', 'Called Mel, booked walk-through.'], [atTime(bd(-8), 17), 'Qualified', 'Walk-through done — 34 fittings, after-hours only.'], [atTime(bd(-7), 15.2), 'Proposal', `Quote ${tq(q6.id)} sent.`], [atTime(bd(-1), 16.3), 'Negotiation', 'Mel asked about a discount.']],
    activity: [[atTime(bd(-1), 16.3), bec, 'Mel rang — happy with the scope, asked if we can do 5% off if they book before the end of the month. Needs a call back today.']] });

  // ---- 7. Warners Bay ducted air-con — proposal out this week
  const q7 = makeQuote({ cust: H.halloran, title: 'Ducted reverse-cycle air conditioning — 14kW, 4 zones', status: 'Sent', created: atTime(bd(-2), 9), sent: atTime(bd(-2), 9.3),
    description: 'Supply and install 14kW ducted reverse-cycle system with 4-zone control, 8 ceiling outlets, return air grille, dedicated 32A circuit and isolator.',
    sections: [
      { id: id('sec'), name: 'Equipment', lineItems: [line('Ducted Reverse Cycle Inverter 14kW (indoor + outdoor)', 'material', 1, 8450, 5900), line('4-Zone Touchscreen Controller & Dampers', 'material', 1, 1180, 760), line('Insulated Ductwork, Outlets & Return Air Grille', 'material', 1, 1650, 1020)] },
      { id: id('sec'), name: 'Installation', lineItems: [labourLine('sam', 16), labourLine('tom', 16), stockLine('iso35', 1), stockLine('rcbo32', 1), stockLine('tps6', 18)] },
    ] });
  makeLead({ cust: H.halloran, title: 'Ducted air conditioning — two-storey home', source: 'Website', status: 'Proposal', value: q7.subtotal, budget: 15000, assignedTo: 'owner', created: atTime(bd(-6), 12.5), updated: atTime(bd(-2), 9.3), nextAction: bd(2), priority: 'High',
    requirements: 'Four zones (living, master, kids, study). Quiet outdoor unit — side setback is 1.2m.',
    history: [[atTime(bd(-6), 12.5), 'New', 'Lead created from website enquiry.'], [atTime(bd(-6), 15), 'Contacted', 'Booked roof-space inspection.'], [atTime(bd(-4), 16), 'Qualified', 'Roof space suits ducted, 14kW load calc.'], [atTime(bd(-2), 9.3), 'Proposal', `Quote ${tq(q7.id)} sent.`]],
    activity: [[atTime(bd(-4), 16.2), sam, 'Roof space has good access, trusses at 600 centres. Outdoor unit can go on the south side slab.']] });

  // ---- 8. Kitchen reno referral from a builder — quote being drafted
  const q8 = makeQuote({ cust: H.delaney, title: 'Kitchen renovation — electrical rough-in & fit-off', status: 'Draft', created: atTime(anchor, 8.5),
    description: 'Rough-in and fit-off for new kitchen: 6 double power points (2 with USB), induction cooktop and oven circuits, 8 LED downlights, rangehood and under-cabinet lighting.',
    sections: [{ id: id('sec'), name: 'Rough-in', lineItems: [stockLine('tps25', 60), stockLine('tps6', 12), stockLine('rcbo32', 1), stockLine('rcbo20', 2), labourLine('owner', 6)] },
      { id: id('sec'), name: 'Fit-off', lineItems: [stockLine('gpo', 4), stockLine('gpousb', 2), stockLine('dl', 8), labourLine('owner', 5)] }] });
  makeLead({ cust: H.delaney, title: 'Kitchen renovation electrical', source: 'Referral', status: 'Qualified', value: 6800, assignedTo: 'owner', created: atTime(bd(-4), 10), updated: atTime(anchor, 8.5), nextAction: bd(1),
    description: 'Referred by Jade at Coastal Renovations — cabinets going in late next month.', history: [[atTime(bd(-4), 10), 'New', 'Lead created from builder referral.'], [atTime(bd(-4), 13), 'Contacted', 'Plans received by email.'], [atTime(bd(-3), 9), 'Qualified', 'Plans reviewed — scope confirmed with builder.']],
    activity: [[atTime(anchor, 8.5), own, 'Started the quote. Waiting on Jade to confirm the cooktop model before finalising circuits.']] });

  // ---- 9. Mayfield cottage — site visit booked tomorrow
  makeLead({ cust: H.castellano, title: 'Rewire assessment — 1940s cottage', source: 'Phone', status: 'Contacted', value: 9500, assignedTo: 'owner', created: atTime(bd(-2), 14.2), updated: atTime(bd(-2), 14.5), nextAction: bd(1), priority: 'Medium',
    description: 'Original wiring, lights dim when the kettle is on. Buying a second-hand dryer and worried about the board.', history: [[atTime(bd(-2), 14.2), 'New', 'Lead created from phone enquiry.'], [atTime(bd(-2), 14.5), 'Contacted', 'Site visit booked.']] });
  C.schedule.push({ id: id('sch'), type: 'meeting', technicianId: T.owner.id, technicianName: own, date: dateKey(bd(1)), startTime: localStamp(bd(1), 15.5), finishTime: localStamp(bd(1), 16.5), hours: 1, startHour: 15.5, endHour: 16.5,
    notes: 'Site visit — Castellano, 17 Wren St Mayfield (rewire assessment)', createdAt: isoAt(bd(-2), 14.5), updatedAt: isoAt(bd(-2), 14.5) });
  reserve('owner', bd(1), 15.5, 16.5);

  // ---- 10 & 11. Fresh enquiries
  makeLead({ cust: H.iyer, title: 'EV charger + garage power', source: 'Website', status: 'New', value: 2600, created: atTime(anchor, 6.2), nextAction: anchor, priority: 'Medium',
    requirements: 'Model Y arriving next month. Garage is about 18m from the switchboard. Already has 6.6kW solar.', history: [[atTime(anchor, 6.2), 'New', 'Lead created from website enquiry.']] });
  makeLead({ cust: H.szabo, title: 'Four ceiling fans — bedrooms & living', source: 'Google Ads', status: 'New', value: 1450, assignedTo: 'owner', created: atTime(bd(-1), 13.6), nextAction: anchor, priority: 'Low',
    history: [[atTime(bd(-1), 13.6), 'New', 'Lead created from Google Ads enquiry form.']] });

  // ---- 12. Lost one — price
  const qLost = makeQuote({ cust: H.kowalski, title: 'Granny flat — sub-main, power & lighting', status: 'Declined', created: atTime(bd(-18), 10), sent: atTime(bd(-18), 10.2), decided: atTime(bd(-9), 11), declineReason: 'Going with the builder\'s electrician',
    description: 'Sub-main from house switchboard to new granny flat, sub-board, 10 power points, 12 LED downlights, exhaust fans and smoke alarms.',
    sections: [{ id: id('sec'), name: 'Granny flat electrical', lineItems: [stockLine('encl', 1), stockLine('tps6', 28), stockLine('gpo', 10), stockLine('dl', 12), stockLine('exfan', 2), stockLine('smoke', 2), stockLine('tps25', 90), labourLine('owner', 18), labourLine('tom', 14)] }] });
  makeLead({ cust: H.kowalski, title: 'Granny flat electrical', source: 'Phone', status: 'Lost', value: qLost.subtotal, assignedTo: 'owner', created: atTime(bd(-22), 9), updated: atTime(bd(-9), 11),
    history: [[atTime(bd(-22), 9), 'New', 'Lead created from phone enquiry.'], [atTime(bd(-21), 10), 'Contacted', 'Plans received.'], [atTime(bd(-18), 10.2), 'Proposal', `Quote ${tq(qLost.id)} sent.`], [atTime(bd(-9), 11), 'Lost', 'Went with the builder\'s electrician — about 12% cheaper.']] });

  // ---- 13. Brewery cool-room circuit — invoice now overdue
  const brewSpec = { hours: 5, materials: [['iso35', 1], ['tps6', 22], ['rcbo32', 1], ['conduit', 4], ['consum', 1]] };
  const qBrew = makeQuote({ cust: COM.brewing, title: 'New 3-phase circuit & isolator — cool room compressor', status: 'Converted', created: atTime(bd(-38), 10), sent: atTime(bd(-38), 10.3), decided: atTime(bd(-35), 9), signedBy: 'Dougal Ferris',
    description: 'New 3-phase circuit from the brewery DB to the cool-room compressor with weatherproof isolator.', sections: quoteSectionsFor(CATALOGUE_BY_KEY.commercialcircuit, brewSpec, 'dale') });
  const jBrew = makeJob({ cust: COM.brewing, title: qBrew.title, desc: qBrew.description, cat: CATALOGUE_BY_KEY.commercialcircuit, status: 'Invoiced', created: atTime(bd(-35), 9.5), scheduled: bd(-28), startHour: 7, lead: 'dale', crew: withTom(bd(-28)), quoteId: qBrew.id, hours: 5.25,
    taskState: { done: 3, by: dale, start: bd(-28), startHour: 7 } });
  work(jBrew, withTom(bd(-28)), bd(-28), 7, 5.25, 'Approved');
  useMaterials(jBrew, brewSpec.materials, bd(-28), 'dale');
  makeInvoice({ job: jBrew, cust: COM.brewing, contactName: 'Kim Ashby', title: qBrew.title, sections: cloneSections(qBrew.sections), quote: qBrew, issue: bd(-27), status: 'Overdue', notes: 'Thank you for your business.' });

  // ---- 14. Nguyen solar + battery — a three-stage project with a deposit, a PO and a subcontractor
  const lSolar = makeLead({ cust: H.nguyen, title: '10kW solar + home battery', source: 'Referral', status: 'Won', value: 26500, assignedTo: 'owner', created: atTime(bd(-34), 11), priority: 'High',
    history: [[atTime(bd(-34), 11), 'New', 'Lead created from customer referral.'], [atTime(bd(-33), 9), 'Contacted', 'Power bills received — 22 kWh/day average.'], [atTime(bd(-31), 15), 'Qualified', 'Roof inspection done, north face fits 24 panels.']] });
  const solarSections = [
    { id: id('sec'), name: 'Stage 1 — Switchboard upgrade & solar-ready main switch', lineItems: [stockLine('encl', 1), stockLine('mainsw', 1), stockLine('spd', 1), stockLine('rcbo16', 4), stockLine('rcbo20', 3), labourLine('dale', 7), labourLine('tom', 7)] },
    { id: id('sec'), name: 'Stage 2 — 10.56kW solar array & hybrid inverter', lineItems: [poLine('panel', 24, 245), poLine('railkit', 1, 1450), poLine('inverter', 1, 4290), line('Roof access & edge protection (subcontract)', 'other', 1, 1180, 920), labourLine('dale', 16), labourLine('tom', 16)] },
    { id: id('sec'), name: 'Stage 3 — 13.5kWh battery, commissioning & grid connection', lineItems: [poLine('battery', 1, 10990), line('Network connection application & metering request', 'other', 1, 350, 0), labourLine('dale', 6)] },
  ];
  const qSolar = makeQuote({ cust: H.nguyen, title: '10.56kW solar + 13.5kWh battery — supply & install', status: 'Converted', created: atTime(bd(-30), 10), sent: atTime(bd(-30), 10.4), decided: atTime(bd(-26), 19), signedBy: 'Daniel Nguyen', leadId: lSolar.id,
    description: '24 × 440W panels on the north roof, 10kW hybrid inverter and 13.5kWh battery with backup circuit. Includes switchboard upgrade, network application and commissioning.',
    notes: 'Staged payments: 20% deposit on acceptance, progress claims at the end of each stage. Price excludes any government rebates, which are applied at final invoice.', sections: solarSections });
  lSolar.stageHistory.unshift(historyEntry(atTime(bd(-30), 10), 'Won', `Converted to Quote ${tq(qSolar.id)} (Status: Won).`, own));
  const project = { id: id('proj'), number: null, name: 'Nguyen Residence — Solar & Battery', customerId: H.nguyen.id, customerName: displayName(H.nguyen), siteAddress: H.nguyen.address, status: 'In Progress',
    description: '10.56kW solar array, 10kW hybrid inverter and 13.5kWh battery delivered in three stages.', startDate: dateKey(bd(-6)), endDate: dateKey(bd(12)), createdAt: isoAt(bd(-26), 19.2), updatedAt: isoAt(bd(-2), 10) };
  C.projects.push(project);
  const stage = (n, status, extra) => makeJob({ cust: H.nguyen, title: solarSections[n].name, desc: qSolar.description, jobType: n === 0 ? 'Switchboard' : 'Solar & Battery', cc: 'energy', status, quoteId: qSolar.id, projectId: project.id, lead: 'dale', crew: n === 2 ? ['dale'] : ['dale', 'tom'], created: atTime(bd(-26), 19.3), ...extra });
  const s1 = stage(0, 'Invoiced', { scheduled: bd(-6), startHour: 7, hours: 7.5, tasks: buildTasks(sbCat.tasks, 7.5, 2, { done: 5, by: dale, start: bd(-6), startHour: 7 }) });
  work(s1, withTom(bd(-6)), bd(-6), 7, 7.5, inCurrentWeek(bd(-6)) ? 'Pending' : 'Approved');
  useMaterials(s1, [['encl', 1], ['mainsw', 1], ['spd', 1], ['rcbo16', 4], ['rcbo20', 3], ['consum', 2]], bd(-6), 'dale');
  const s2Tasks = buildTasks(['Roof access & edge protection', 'Mount rails & panels', 'Install inverter & DC isolators', 'AC connection & labelling'], 16, 2, {});
  s2Tasks[0].assignedContractorIds = [CON.kestrel];
  const s2 = stage(1, 'Scheduled', { scheduled: bd(3), startHour: 7, hours: 16, tasks: s2Tasks, notes: [[atTime(bd(-2), 10), dale, 'Panels, rails, inverter and battery received into the workshop. Kestrel confirmed for 6:30am on day one to set up edge protection.']] });
  work(s2, withTom(bd(3)), bd(3), 7, 8.5, null);
  work(s2, withTom(bd(4)), bd(4), 7, 8.5, null);
  stage(2, 'Pending', { hours: 6, tasks: buildTasks(['Mount & connect battery', 'Backup circuit changeover', 'Commission & app setup', 'Network paperwork & customer handover'], 6, 1, {}) });
  makePO({ sup: 'sungrid', job: s2, items: [['panel', 24], ['railkit', 1], ['inverter', 1], ['battery', 1]], status: 'Received', issue: bd(-25), expected: bd(-3), received: bd(-2), notes: 'Battery on separate pallet — forklift needed.' });
  const depositSections = [{ id: id('sec'), name: 'Deposit', lineItems: [line(`Deposit — 20% of Quote ${tq(qSolar.id)}`, 'other', 1, round2(qSolar.subtotal * 0.2), 0)] }];
  makeInvoice({ job: s1, cust: H.nguyen, title: 'Deposit — Solar & battery installation', type: 'Deposit', sections: depositSections, quote: qSolar, issue: bd(-26), status: 'Paid', paidOn: bd(-24), method: 'Bank Transfer', terms: 7 });
  makeInvoice({ job: s1, cust: H.nguyen, title: 'Progress claim — Stage 1 switchboard upgrade', type: 'Progress', sections: cloneSections([solarSections[0]]), quote: qSolar, issue: bd(-5), status: 'Sent', terms: 14 });

  // ---- 15. Rowe — two bedroom split systems booked in, units on order
  const roweSpec = { hours: 7, materials: [['splitkit', 2], ['iso20', 2], ['tps25', 24], ['rcbo20', 1], ['consum', 1]], po: [['split35', 2]] };
  const lRowe = makeLead({ cust: H.rowe, title: 'Air con for two bedrooms', source: 'Google Ads', status: 'Won', value: 5600, assignedTo: 'owner', created: atTime(bd(-12), 19),
    history: [[atTime(bd(-12), 19), 'New', 'Lead created from Google Ads enquiry form.'], [atTime(bd(-11), 8.5), 'Contacted', 'Quoted from photos and floor plan.']] });
  const qRowe = makeQuote({ cust: H.rowe, title: 'Split systems × 2 — master & second bedroom (3.5kW)', status: 'Converted', created: atTime(bd(-10), 13), sent: atTime(bd(-10), 13.2), decided: atTime(bd(-5), 20), signedBy: 'Hayley Rowe', leadId: lRowe.id,
    description: 'Supply and install two 3.5kW reverse-cycle split systems with dedicated circuit and isolators.', sections: quoteSectionsFor(oseiCat, roweSpec, 'sam') });
  lRowe.stageHistory.unshift(historyEntry(atTime(bd(-10), 13), 'Won', `Converted to Quote ${tq(qRowe.id)} (Status: Won).`, own));
  const jRowe = makeJob({ cust: H.rowe, title: qRowe.title, desc: qRowe.description, cat: oseiCat, status: 'Scheduled', created: atTime(bd(-5), 20.5), scheduled: bd(2), startHour: 7.5, lead: 'sam', quoteId: qRowe.id, hours: 7 });
  work(jRowe, ['sam'], bd(2), 7.5, 7, null);
  makePO({ sup: 'airsource', job: jRowe, items: [['split35', 2]], status: 'Issued', issue: bd(-4), expected: bd(1), notes: 'Please deliver before 7am or to the workshop.' });

  // ---- 16. Seaview Strata — monthly common-area check, a recurring template with five months of history
  const hv = COM.seaview.sites[0];
  const nextVisit = bd(4);
  const recurringTasks = ['Common-area lighting walk-through', 'Emergency & exit light visual check', 'Car park & stairwell lights', 'Report defects to building manager'];
  const template = makeJob({ cust: COM.seaview, contactName: 'Josh Varley', site: hv, title: 'Monthly common-area lighting & emergency check — Harbour View', desc: 'Monthly walk-through of all common-area, car park and stairwell lighting with a visual check of emergency and exit fittings. Defects reported to the building manager.',
    jobType: 'Maintenance', cc: 'serv', status: 'Recurring Template', priority: 'Normal', created: atTime(bd(-112), 10), hours: 2.5, preferredTime: '07:30', tasks: buildTasks(recurringTasks, 2.5, 1, {}) });
  template.isRecurring = true;
  template.recurringConfig = { freq: 'Monthly', start: dateKey(addDays(nextVisit, -154)), end: dateKey(addDays(nextVisit, 214)), defaultTechnicianId: T.priya.id, daysOfWeek: [], daysOfMonth: [nextVisit.getDate()], skippedDates: [] };
  template.technicianId = T.priya.id; template.technicianName = priya;
  const recurringChildren = [];
  for (let m = 5; m >= 1; m--) {
    const occ = new Date(nextVisit.getFullYear(), nextVisit.getMonth() - m, nextVisit.getDate());
    if (occ.getDate() !== nextVisit.getDate()) continue; // month too short for this day
    let visit = occ;
    while (isWeekend(visit)) visit = addDays(visit, 1);
    const child = makeJob({ cust: COM.seaview, contactName: 'Josh Varley', site: hv, title: template.title, desc: 'Generated from recurring template.', jobType: 'Maintenance', cc: 'serv', status: 'Invoiced', priority: 'Normal',
      created: atTime(addDays(occ, -7), 6), scheduled: visit, startHour: 7.5, lead: 'priya', hours: 2.5, tasks: buildTasks(recurringTasks, 2.5, 1, { done: 4, by: priya, start: visit, startHour: 7.5 }), parentJobId: template.id, templateDate: dateKey(occ) });
    child.preferredTime = '07:30';
    const failed = int(r, 0, 3);
    work(child, ['priya'], visit, 7.5, 2.5, inCurrentWeek(visit) ? 'Pending' : 'Approved');
    if (failed) useMaterials(child, [['nicd', failed]], visit, 'priya');
    recurringChildren.push({ child, visit, failed });
  }

  // ---- 17. Stock is low on RCBOs and 6mm² — restock order drafted
  makePO({ sup: 'hew', items: [['rcbo20', 20], ['rcbo16', 10], ['tps6', 200]], status: 'Draft', issue: anchor, notes: 'Restock — RCBOs and 6mm² below reorder level. Raised by Bec.' });

  // ---- 18. Customer portal request this morning
  C.notifications.push({ id: id('notif'), type: 'Client Request', title: 'Service Request: Lighting Fault', message: `Request from ${COM.seaview.company} via portal`, source: 'customer_portal', createdBy: 'Customer (Portal)',
    description: `Request Type: Lighting Fault\nPriority: Urgent\nSelected Site: ${hv.name}\nLinked Asset: None\nPreferred Contact Method: Phone\n\nDescription:\nStairwell B lights are out between levels 2 and 4 since last night. Residents are using phone torches — please attend today if you can.`,
    priority: 'High', status: 'Pending', customerId: COM.seaview.id, customerName: COM.seaview.company, contactName: 'Josh Varley', siteName: hv.name, read: false, createdAt: isoAt(anchor, 7.7), origin: 'user' });

  // ---- 19. Leave and TAFE
  [6, 7].forEach((n) => {
    C.schedule.push({ id: id('sch'), type: 'leave', technicianId: T.priya.id, technicianName: priya, date: dateKey(bd(n)), startTime: localStamp(bd(n), 7), finishTime: localStamp(bd(n), 15.5), hours: 8.5, startHour: 7, endHour: 15.5,
      notes: 'Annual leave — family wedding', status: 'Approved', createdAt: isoAt(bd(-15), 9), updatedAt: isoAt(bd(-14), 9) });
    reserve('priya', bd(n), 7, 15.5);
  });
  for (let n = -90; n <= 10; n++) {
    const d = bd(n);
    if (d.getDay() !== 3) continue;
    reserve('tom', d, 7, 15.5);
    if (n >= -15) {
      C.schedule.push({ id: id('sch'), type: 'blockout', technicianId: T.tom.id, technicianName: T.tom.name, date: dateKey(d), startTime: localStamp(d, 7.5), finishTime: localStamp(d, 15), hours: 7.5,
        startHour: 7.5, endHour: 15, notes: 'TAFE — Cert III Electrotechnology (block day)', createdAt: isoAt(bd(-90), 9), updatedAt: isoAt(bd(-90), 9) });
    }
  }

  // ---- 20. Assets under maintenance agreements, plus the business's own gear
  const agreement = (cust, title, sections, monthsAgo, signedBy, contactName) => makeQuote({ cust, contactName, title, status: 'Accepted', created: atTime(addDays(anchor, -30 * monthsAgo - 4), 10), sent: atTime(addDays(anchor, -30 * monthsAgo - 4), 10.2), decided: atTime(addDays(anchor, -30 * monthsAgo), 9), signedBy,
    description: 'Service agreement — pricing per visit. Visits raised automatically from the maintenance plan.', notes: 'Agreement renews annually. Defects found during a visit are quoted separately.', sections });
  const qaEmerg = agreement(COM.seaview, 'Service agreement — 6-monthly emergency lighting test, Harbour View', [{ id: id('sec'), name: 'Per visit', lineItems: [labourLine('priya', 3.5), stockLine('nicd', 4)] }], 7, 'Carla Benedetti', 'Carla Benedetti');
  const qaThermal = agreement(COM.seaview, 'Service agreement — annual switchboard thermal scan, Harbour View', [{ id: id('sec'), name: 'Per visit', lineItems: [labourLine('dale', 2), line('Thermographic report', 'other', 1, 180, 0)] }], 7, 'Carla Benedetti', 'Carla Benedetti');
  const qaAircon = agreement(COM.childcare, 'Service agreement — 6-monthly air conditioner service (3 units)', [{ id: id('sec'), name: 'Per visit', lineItems: [labourLine('sam', 2.5), stockLine('coilclean', 3)] }], 8, 'Robyn Faulkner', 'Robyn Faulkner');
  const qaTag = agreement(COM.forge, 'Service agreement — quarterly test & tag (workshop)', [{ id: id('sec'), name: 'Per visit', lineItems: [labourLine('priya', 5), stockLine('consum', 1)] }], 10, 'Lena Fisk', 'Lena Fisk');

  const asset = (o) => {
    const rec = { id: id('asset'), name: o.name, description: o.description || '', serial: o.serial, identifier: o.serial, type: o.type, status: o.status || 'Active', ownerType: o.cust ? 'Customer' : 'Business',
      customerId: o.cust ? o.cust.id : null, customerName: o.cust ? displayName(o.cust) : null, site: o.site || '', installDate: o.installDate || '', assignedToId: o.assignedTo ? T[o.assignedTo].id : '',
      recoveryRate: o.recoveryRate || 0, serviceIntervalMonths: o.interval || 6, currentMeter: o.meter || 0, meterUnit: o.meterUnit || 'hrs', logs: o.logs || [],
      createdAt: isoAt(addDays(anchor, -300), 10), updatedAt: isoAt(addDays(anchor, -10), 10) };
    C.assets.push(rec);
    return rec;
  };
  const plan = (o) => C.maintenancePlans.push({ id: id('plan'), name: o.name, assetId: o.asset.id, quoteId: o.quote ? o.quote.id : '', triggerType: o.trigger || 'Calendar', status: 'Active', priority: o.priority || 5,
    collisionMerging: false, mergeTasks: false, taskTemplateId: null, frequency: o.trigger === 'Meter' ? null : o.frequency, nextServiceDate: o.trigger === 'Meter' ? null : dateKey(o.next),
    meterInterval: o.trigger === 'Meter' ? o.interval : null, lastTriggeredMeter: o.trigger === 'Meter' ? o.last : 0, lastNotificationDate: null, createdAt: isoAt(addDays(anchor, -200), 10), updatedAt: isoAt(addDays(anchor, -30), 10) });
  const svcLog = (d, notes, who, cost) => ({ id: id('alog'), type: 'Service', date: dateKey(d), meter: 0, cost, notes, technicianName: who });

  const aEmerg = asset({ cust: COM.seaview, site: hv.name, name: 'Emergency & exit lighting — Harbour View (38 fittings)', serial: 'HV-EM-38', type: 'Fixed Asset (HVAC/Solar/Fire)', installDate: '2016-03-01',
    logs: [svcLog(addDays(nextVisit, -182), 'Six-monthly discharge test — 3 battery packs replaced', priya, 520), svcLog(addDays(nextVisit, -365), 'Six-monthly discharge test — 1 exit sign replaced', priya, 610)] });
  plan({ name: 'Six-monthly discharge test (AS 2293.2)', asset: aEmerg, quote: qaEmerg, frequency: 'Semi-Annually', next: bd(3), priority: 7 });
  const aMsb = asset({ cust: COM.seaview, site: hv.name, name: 'Main switchboard MSB-1 — Harbour View', serial: 'HV-MSB-1', type: 'Fixed Asset (HVAC/Solar/Fire)', installDate: '2016-03-01', logs: [svcLog(addDays(anchor, -290), 'Annual thermographic scan — no hotspots', dale, 410)] });
  plan({ name: 'Annual thermographic scan', asset: aMsb, quote: qaThermal, frequency: 'Annually', next: addDays(anchor, 75) });
  const ccLog = (room) => [svcLog(addDays(anchor, -183), `Six-monthly service — ${room}`, sam, 190)];
  [['Babies room', '7.1kW', 'LE-AC-01'], ['Toddler room', '7.1kW', 'LE-AC-02'], ['Kinder room', '3.5kW', 'LE-AC-03']].forEach(([room, size, serial], i) => {
    const a = asset({ cust: COM.childcare, site: COM.childcare.sites[0].name, name: `Split system ${size} — ${room}`, serial, type: 'Fixed Asset (HVAC/Solar/Fire)', installDate: '2021-11-15', logs: ccLog(room) });
    if (i === 0) ccServ.assetId = a.id;
    plan({ name: 'Six-monthly air conditioner service', asset: a, quote: qaAircon, frequency: 'Semi-Annually', next: addDays(anchor, 182) });
  });
  const aTag = asset({ cust: COM.forge, site: COM.forge.sites[0].name, name: 'Portable appliances & leads register (126 items)', serial: 'FW-TT-REG', type: 'Other', logs: [svcLog(addDays(anchor, -95), 'Quarterly test & tag — 126 items, 4 failed and removed', priya, 690)] });
  plan({ name: 'Quarterly test & tag (AS/NZS 3760)', asset: aTag, quote: qaTag, frequency: 'Quarterly', next: bd(-3), priority: 6 });

  [['Van 1 — Toyota HiAce', 'dale', 148210, 'HL-VAN1'], ['Van 2 — Toyota HiAce', 'priya', 96540, 'HL-VAN2'], ['Van 3 — Ford Transit Custom', 'sam', 61880, 'HL-VAN3']].forEach(([name, who, km, serial]) => {
    const a = asset({ name, serial, type: 'Vehicle', assignedTo: who, meter: km, meterUnit: 'kmls', site: '', recoveryRate: 0, interval: 6 });
    plan({ name: '15,000 km service', asset: a, trigger: 'Meter', interval: 15000, last: Math.floor(km / 15000) * 15000 });
  });
  [['Multifunction installation tester', 'dale', 'MFT-22871', 6], ['Thermal imaging camera', 'dale', 'TIC-40517', 140], ['Portable appliance tester', 'priya', 'PAT-11093', 210]].forEach(([name, who, serial, days]) => {
    const a = asset({ name, serial, type: 'Specialized Tool', assignedTo: who, interval: 12 });
    plan({ name: 'Annual calibration', asset: a, frequency: 'Annually', next: days < 30 ? bd(days) : addDays(anchor, days) });
  });

  // ---- Little Darby Espresso — a finished fit-out project from two months back
  const espressoSections = [
    { id: id('sec'), name: 'Rough-in — coffee machine, dishwasher & kitchen circuits', lineItems: [stockLine('rcbo20', 3), stockLine('rcbo32', 1), stockLine('tps25', 45), stockLine('tps6', 16), labourLine('dale', 7), labourLine('tom', 7)] },
    { id: id('sec'), name: 'Fit-off & commissioning', lineItems: [stockLine('gpo', 6), stockLine('gpowp', 1), stockLine('batten', 6), labourLine('dale', 4.5)] },
  ];
  const qDarby = makeQuote({ cust: COM.espresso, title: 'Cafe kitchen & bar fit-out — electrical', status: 'Converted', created: atTime(bd(-72), 13), sent: atTime(bd(-72), 13.3), decided: atTime(bd(-68), 8), signedBy: 'Gus Petrov',
    description: 'New circuits for a twin-group coffee machine, commercial dishwasher and bar fridges; new power and LED lighting in the prep kitchen.', sections: espressoSections });
  const darby = { id: id('proj'), number: null, name: 'Little Darby Espresso — Kitchen & Bar Fit-out', customerId: COM.espresso.id, customerName: COM.espresso.company, siteAddress: COM.espresso.sites[0].address, status: 'Completed',
    description: 'Electrical for the cafe refit, done after trading hours over two visits.', startDate: dateKey(bd(-62)), endDate: dateKey(bd(-58)), createdAt: isoAt(bd(-68), 8.5), updatedAt: isoAt(bd(-50), 9) };
  C.projects.push(darby);
  const dj1 = makeJob({ cust: COM.espresso, title: espressoSections[0].name, desc: qDarby.description, cat: CATALOGUE_BY_KEY.commercialcircuit, status: 'Invoiced', quoteId: qDarby.id, projectId: darby.id, created: atTime(bd(-68), 8.5),
    scheduled: bd(-62), startHour: 7, lead: 'dale', crew: withTom(bd(-62)), hours: 7, taskState: { done: 3, by: dale, start: bd(-62), startHour: 7 } });
  work(dj1, withTom(bd(-62)), bd(-62), 7, 7.25, 'Approved');
  useMaterials(dj1, [['rcbo20', 3], ['rcbo32', 1], ['tps25', 45], ['tps6', 16]], bd(-62), 'dale');
  const dj2 = makeJob({ cust: COM.espresso, title: espressoSections[1].name, desc: qDarby.description, cat: CATALOGUE_BY_KEY.commercialcircuit, status: 'Invoiced', quoteId: qDarby.id, projectId: darby.id, created: atTime(bd(-68), 8.5),
    scheduled: bd(-58), startHour: 11, lead: 'dale', hours: 4.5, taskState: { done: 3, by: dale, start: bd(-58), startHour: 11 } });
  work(dj2, ['dale'], bd(-58), 11, 4.25, 'Approved');
  useMaterials(dj2, [['gpo', 6], ['gpowp', 1], ['batten', 6]], bd(-58), 'dale');
  makeInvoice({ job: dj2, cust: COM.espresso, title: qDarby.title, sections: cloneSections(espressoSections), quote: qDarby, issue: bd(-58), status: 'Paid', paidOn: addDays(bd(-58), 6), method: 'Bank Transfer' }).jobIds = [dj1.id, dj2.id];

  // Recurring visit invoices (one per monthly visit, on Seaview's 30-day terms)
  recurringChildren.forEach(({ child, visit, failed }) => {
    const sections = [{ id: id('sec'), name: 'Monthly common-area check', lineItems: [labourLine('priya', 2.5), ...(failed ? [stockLine('nicd', failed)] : [])] }];
    const st = settle(COM.seaview, visit, r());
    makeInvoice({ job: child, cust: COM.seaview, contactName: 'Accounts Payable', title: `${template.title} — ${dateKey(visit)}`, sections, issue: visit, ...st });
  });

  // =========================================================================
  // GENERATED HISTORY + FORWARD BOOKINGS
  // Twenty weeks back and two weeks forward, packed day by day against each
  // person's real capacity (7:00–3:30, travel between sites, Tom at TAFE on
  // Wednesdays). Utilisation climbs over the period — a business that's
  // growing into needing better software.
  // =========================================================================
  const HISTORY_DAYS = 85;
  const SOURCES = [['Google Ads', 30], ['Website', 22], ['Referral', 30], ['Phone', 18]];
  const weighted = (pairs) => {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    for (const [v, w] of pairs) { x -= w; if (x <= 0) return v; }
    return pairs[0][0];
  };
  const TECH_MIX = {
    dale: { faultfind: 1, gpos: 1, downlights: 0.8, smoke: 0.5, fans: 1, exfan: 0.8, outdoor: 1, oven: 0.6, switchboard: 3, ev: 2.4, batten: 1.5, commercialcircuit: 1.5 },
    priya: { faultfind: 1.2, gpos: 1.2, downlights: 1, smoke: 1.6, fans: 0.6, outdoor: 0.6, oven: 0.8, testtag: 2, emergency: 1.6, batten: 0.6, commercialcircuit: 0.5 },
    sam: { splitinstall: 2.4, acservice: 3, acfault: 1.6, gpos: 0.2, faultfind: 0.2 },
    owner: { faultfind: 1, gpos: 1, downlights: 1, oven: 1, fans: 0.8, ev: 0.6 },
  };
  const pickCat = (tech, early) => weighted(Object.entries(TECH_MIX[tech]).map(([k, w]) => [CATALOGUE_BY_KEY[k], (CATALOGUE_BY_KEY[k].big && !early) ? 0 : w * CATALOGUE_BY_KEY[k].weight]).filter(([, w]) => w > 0));
  // [chance of any booking that day, chance of another job after each one]
  const utilFor = (n) => {
    if (n < 0) return [0.97, 0.6 + 0.32 * ((n + HISTORY_DAYS) / HISTORY_DAYS)];
    if (n === 0) return [1, 0.9];
    if (n <= 2) return [0.95, 0.85];
    if (n <= 5) return [0.75, 0.6];
    return [0.45, 0.35];
  };
  const generatedJobs = [];

  const customerFor = (cat, d) => {
    if (cat.kind === 'res') return pickResident(d);
    if (cat.kind === 'com') return pickCommercial(cat.key);
    return r() < 0.68 ? pickResident(d) : pickCommercial(cat.key);
  };

  const quoteFirst = (cat, spec, cust, site, jobDay, leadKey) => {
    const latest = jobDay > anchor ? addDays(anchor, -1) : addDays(jobDay, -1);
    let accepted = addDays(jobDay, -int(r, 3, 9));
    if (accepted > latest) accepted = latest;
    while (isWeekend(accepted)) accepted = addDays(accepted, -1);
    const created = addDays(accepted, -int(r, 1, 6));
    const createdAt = atTime(created, 8 + r() * 9);
    const decidedAt = atTime(accepted, 7 + r() * 13);
    let lead = null;
    if (r() < (cust.type === 'Company' ? 0.3 : 0.6)) {
      const leadAt = atTime(addDays(created, -int(r, 1, 4)), 7 + r() * 13);
      lead = makeLead({ cust, title: spec.title, source: cust.type === 'Company' ? 'Phone' : weighted(SOURCES), status: 'Won', value: 0, assignedTo: 'owner', created: leadAt, updated: createdAt,
        history: [[leadAt, 'New', 'Lead created.'], [atTime(addDays(leadAt, 0), Math.min(17.5, leadAt.getHours() + 1.5)), 'Contacted', 'Called back and scoped the job.']] });
    }
    const quote = makeQuote({ cust, site, title: spec.title, description: spec.desc, status: 'Converted', created: createdAt, sent: atTime(created, createdAt.getHours() + createdAt.getMinutes() / 60 + 0.2), decided: decidedAt,
      signedBy: cust.type === 'Company' ? cust.contacts[0].name : `${cust.firstName} ${cust.lastName}`, leadId: lead ? lead.id : null, sections: quoteSectionsFor(cat, spec, leadKey) });
    if (lead) {
      lead.value = quote.subtotal;
      lead.stageHistory.unshift(historyEntry(createdAt, 'Won', `Converted to Quote ${tq(quote.id)} (Status: Won).`, own));
    }
    return { quote, jobCreated: atTime(accepted, Math.min(19, decidedAt.getHours() + 0.5)) };
  };

  const placeJob = (tech, d, n, cursor, cat, spec, emergency = false) => {
    const past = n < 0 || emergency;
    const crew = [tech];
    if (tech === 'dale' && d.getDay() !== 3 && !isBusy('tom', d, cursor, cursor + spec.hours) && (cat.people === 2 || r() < 0.8)) crew.push('tom');
    const hours = past ? q25(spec.hours * (0.88 + r() * 0.3)) : spec.hours;
    const cust = emergency ? pickResident(d) : customerFor(cat, d);
    const site = siteFor(cust);
    let quote = null;
    let created = atTime(addDays(d, -int(r, 0, 4)), 8 + r() * 8);
    if (created > now) created = new Date(now.getTime() - 3600000);
    if (cat.quoted && !emergency) ({ quote, jobCreated: created } = quoteFirst(cat, spec, cust, site, d, tech));
    let status = 'Scheduled';
    if (past) status = 'Invoiced';
    if (n === -1 && r() < 0.3) status = 'Completed';
    const job = makeJob({ cust, site, title: spec.title, desc: spec.desc, cat, status, created, scheduled: d, startHour: cursor, lead: tech, crew, quoteId: quote ? quote.id : null, hours, isEmergency: emergency,
      priority: emergency ? 'Urgent' : (cat.quoted ? 'Medium' : weighted([['Low', 2], ['Medium', 6], ['High', 2]])),
      taskState: past ? { done: cat.tasks.length, by: T[tech].name, start: d, startHour: cursor } : {} });
    work(job, crew, d, cursor, hours, past ? (inCurrentWeek(d) ? 'Pending' : 'Approved') : null);
    if (past) useMaterials(job, spec.materials, d, tech);
    if (spec.po) {
      const issue = addDays(d, -int(r, 6, 10));
      makePO({ sup: 'airsource', job, items: spec.po, status: past || d <= addDays(anchor, 1) ? 'Received' : 'Issued', issue: issue > anchor ? anchor : issue, expected: addDays(d, -1), received: past ? addDays(d, -2) : null });
    }
    if (status === 'Invoiced') {
      const issue = r() < 0.7 ? d : addDays(d, 1);
      const sections = quote ? cloneSections(quote.sections) : serviceSections({ hours: Object.fromEntries(crew.map((k) => [k, hours])), materials: spec.materials, emergency });
      const st = settle(cust, issue, r());
      makeInvoice({ job, cust, title: spec.title, sections, quote, issue, ...st, notes: 'Thank you for your business.' });
    }
    generatedJobs.push({ job, n, cust });
    return hours;
  };

  for (let n = -HISTORY_DAYS; n <= 10; n++) {
    const d = bd(n);
    const [pFirst, pNext] = utilFor(n);
    ['dale', 'priya', 'sam', 'owner'].forEach((tech) => {
      if (tech === 'owner' && d.getDay() !== 5) return;
      let cursor = Math.max(tech === 'sam' ? 7.5 : 7, freeFrom(tech, d) || 0);
      let placed = 0;
      for (let attempt = 0; attempt < 6 && cursor < 15; attempt++) {
        if (r() > (placed === 0 ? pFirst : pNext)) break;
        const cat = pickCat(tech, cursor <= 7.5);
        const spec = cat.make(r);
        if (cursor + spec.hours > 15.75) continue;
        if (isBusy(tech, d, cursor, cursor + spec.hours)) { cursor = freeFrom(tech, d); continue; }
        const h = placeJob(tech, d, n, cursor, cat, spec);
        cursor = q25(cursor + h + 0.5 + r() * 0.25);
        placed++;
      }
    });
    // Saturday on-call: the occasional after-hours emergency
    if (n < 0 && d.getDay() === 5 && r() < 0.55) {
      const sat = addDays(d, 1);
      const tech = (Math.floor((n + HISTORY_DAYS) / 5) % 2) ? 'dale' : 'priya';
      const v = pick(r, [['After-hours call-out — no power to house', 'Customer has lost power to the whole house. Attend, locate fault and restore supply.', [['rcbo20', 1], ['consum', 1]]],
        ['After-hours call-out — storm damage to outdoor lights', 'Storm damage to outdoor light fittings, safety switch will not reset. Make safe and repair.', [['gpowp', 1], ['consum', 1]]],
        ['After-hours call-out — burning smell from switchboard', 'Burning smell at switchboard. Attend urgently, isolate and repair.', [['rcbo16', 1], ['consum', 1]]]]);
      const cat = CATALOGUE_BY_KEY.faultfind;
      placeJob(tech, sat, n, q25(8 + r() * 3), cat, { title: v[0], desc: v[1], hours: q25(1.25 + r()), materials: v[2] }, true);
    }
  }

  // Quotes that didn't go our way — and a couple still waiting on an answer.
  const DECLINE = ['Went with a cheaper quote', 'Decided to hold off until next year', 'Builder is supplying their own electrician', 'Price higher than budget'];
  for (let n = -HISTORY_DAYS + 5; n <= -3; n++) {
    if (r() > 0.15) continue;
    const d = bd(n);
    const cat = CATALOGUE_BY_KEY[pick(r, ['switchboard', 'ev', 'splitinstall', 'switchboard', 'ev'])];
    const spec = cat.make(r);
    const cust = pickResident(d);
    const created = atTime(d, 9 + r() * 7);
    const decidedDay = addDays(d, int(r, 5, 14));
    const decided = decidedDay < today ? atTime(decidedDay, 10 + r() * 7) : null;
    const quote = makeQuote({ cust, title: spec.title, description: spec.desc, status: decided ? 'Declined' : 'Sent', created, sent: atTime(d, created.getHours() + 0.3), decided, declineReason: decided ? pick(r, DECLINE) : '', sections: quoteSectionsFor(cat, spec, cat.skill === 'hvac' ? 'sam' : 'dale') });
    if (r() < 0.65) {
      const leadAt = atTime(addDays(d, -int(r, 1, 3)), 8 + r() * 10);
      makeLead({ cust, title: spec.title, source: weighted(SOURCES), status: decided ? 'Lost' : 'Proposal', value: quote.subtotal, assignedTo: 'owner', created: leadAt, updated: decided || created, nextAction: decided ? null : addDays(anchor, 1),
        history: [[leadAt, 'New', 'Lead created.'], [created, 'Proposal', `Quote ${tq(quote.id)} sent.`], ...(decided ? [[decided, 'Lost', quote.declineReason]] : [])] });
    }
  }

  // A few past portal requests that were turned into jobs.
  generatedJobs.filter(({ cust, n }) => (cust === COM.northside || cust === COM.seaview) && n <= -5 && n >= -50).slice(0, 4).forEach(({ job, cust }) => {
    C.notifications.push({ id: id('notif'), type: 'Client Request', title: 'Service Request: Electrical Fault', message: `Request from ${cust.company} via portal`, source: 'customer_portal', createdBy: 'Customer (Portal)',
      description: `Request Type: Electrical Fault\nSelected Site: ${job.siteName}\n\nDescription:\n${job.title}.`, priority: 'Medium', status: 'Converted', convertedTo: `Job ${tj(job.id)}`, jobId: job.id,
      customerId: cust.id, customerName: cust.company, read: true, createdAt: new Date(new Date(job.createdAt).getTime() - 3600000).toISOString(), origin: 'user' });
  });

  // =========================================================================
  // FINALISE — numbering, costing, cross-references
  // =========================================================================
  const byCreated = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
  const num = (prefix, n) => `${prefix}${pad(n, 5)}`;

  const JOB_START = 1840;
  const QUOTE_START = 1210;
  const INVOICE_START = 2105;
  const jobsById = Object.fromEntries(C.jobs.map((j) => [j.id, j]));
  let jn = JOB_START;
  C.jobs.filter((j) => !j.parentJobId).sort(byCreated).forEach((j) => { j.number = num(j.isRecurring ? 'T-' : 'J-', jn++); });
  const childSeq = {};
  C.jobs.filter((j) => j.parentJobId).sort((a, b) => (a.templateDate < b.templateDate ? -1 : 1)).forEach((j) => {
    childSeq[j.parentJobId] = (childSeq[j.parentJobId] || 0) + 1;
    j.number = `${jobsById[j.parentJobId].number.replace(/^T-/, 'J-')}.${childSeq[j.parentJobId]}`;
  });
  C.quotes.sort(byCreated).forEach((q, i) => { q.number = num('Q-', QUOTE_START + i); });
  C.invoices.sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate)).forEach((inv, i) => { inv.number = num('INV-', INVOICE_START + i); });
  C.leads.sort(byCreated).forEach((l, i) => { l.number = num('LD-', i + 1); });
  C.purchaseOrders.sort(byCreated).forEach((p, i) => { p.number = num('PO-', i + 1); });
  C.projects.sort(byCreated).forEach((p, i) => { p.number = num('PRJ-', i + 1); });
  C.notifications.sort(byCreated).forEach((nt, i) => { nt.number = num('NT-', i + 1); });

  const quotesById = Object.fromEntries(C.quotes.map((q) => [q.id, q]));
  const invoicesById = Object.fromEntries(C.invoices.map((i) => [i.id, i]));
  [...C.schedule, ...C.timesheets, ...C.jobMaterials, ...C.purchaseOrders].forEach((rec) => { if (rec.jobId && jobsById[rec.jobId]) rec.jobNumber = jobsById[rec.jobId].number; });
  C.invoices.forEach((inv) => {
    if (inv.jobId) inv.jobNumber = jobsById[inv.jobId].number;
    if (inv.jobIds) { inv.jobNumbers = inv.jobIds.map((jid) => jobsById[jid].number); inv.jobAmounts = inv.jobIds.map((jid) => ({ jobId: jid, amount: round2(inv.total / inv.jobIds.length) })); }
    if (inv.originalQuoteId) inv.originalQuoteNumber = quotesById[inv.originalQuoteId].number;
  });
  C.jobs.forEach((j) => { if (j.quoteId) j.quoteNumber = quotesById[j.quoteId].number; });

  // Job costing — exactly what JobDetail recomputes from timesheets, materials and POs.
  const payRate = (techId) => (techById[techId] ? techById[techId].payRate : 45);
  const labour = {};
  C.timesheets.forEach((t) => { labour[t.jobId] = (labour[t.jobId] || 0) + t.hours * payRate(t.technicianId); });
  const poCost = {};
  C.purchaseOrders.forEach((p) => { if (p.jobId) poCost[p.jobId] = (poCost[p.jobId] || 0) + p.total; });
  C.jobs.forEach((j) => {
    j.laborCost = round2(labour[j.id] || 0);
    j.materialCost = round2(j.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0) + (poCost[j.id] || 0));
    const q = j.quoteId ? quotesById[j.quoteId] : null;
    if (q && !j.projectId) {
      const items = q.sections.flatMap((s) => s.lineItems);
      j.estimatedLaborCost = round2(items.filter((l) => l.type === 'labor').reduce((s, l) => s + l.qty * l.internalCost, 0));
      j.estimatedMaterialCost = round2(items.filter((l) => l.type === 'material').reduce((s, l) => s + l.qty * l.internalCost, 0));
    } else {
      j.estimatedLaborCost = j.laborCost;
      j.estimatedMaterialCost = j.materialCost;
    }
    const hours = (C.timesheets.filter((t) => t.jobId === j.id)).reduce((s, t) => s + t.hours, 0);
    if (hours > 0 && ['Completed', 'Invoiced'].includes(j.status)) j.estimatedHours = hours;
  });

  // A customer exists before anything that refers to them.
  const firstTouch = {};
  [...C.leads, ...C.quotes, ...C.jobs].forEach((rec) => {
    const t = new Date(rec.createdAt).getTime();
    if (!firstTouch[rec.customerId] || t < firstTouch[rec.customerId]) firstTouch[rec.customerId] = t;
  });
  C.customers.forEach((c) => {
    if (firstTouch[c.id] && firstTouch[c.id] < new Date(c.createdAt).getTime()) c.createdAt = new Date(firstTouch[c.id] - 3600000).toISOString();
    c.updatedAt = new Date(Math.max(new Date(c.createdAt).getTime(), new Date(c.updatedAt).getTime())).toISOString();
  });

  // Safety net: nothing that has already happened may be stamped after `now`.
  const nowMs = now.getTime();
  Object.values(C).forEach((list) => list.forEach((rec) => {
    if (rec.createdAt && new Date(rec.createdAt).getTime() > nowMs) rec.createdAt = new Date(nowMs - 600000).toISOString();
    if (rec.updatedAt && new Date(rec.updatedAt).getTime() > nowMs) rec.updatedAt = rec.createdAt;
  }));

  // Resolve {{q:..}} / {{j:..}} / {{inv:..}} tokens now numbers are final.
  const resolve = (value) => {
    if (typeof value === 'string') {
      return value.replace(/\{\{(q|j|inv):([^}]+)\}\}/g, (_, kind, rid) => ((kind === 'q' ? quotesById : kind === 'j' ? jobsById : invoicesById)[rid] || {}).number || '');
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === 'object') { Object.keys(value).forEach((k) => { value[k] = resolve(value[k]); }); return value; }
    return value;
  };
  Object.values(C).forEach((list) => list.forEach(resolve));

  // ---- To-dos ---------------------------------------------------------------
  // Real records rather than the per-user localStorage blob the dashboard used
  // to keep, so a to-do can be assigned, dated and linked to a job. The set
  // deliberately spans overdue, due-today, undated and completed so the
  // widget's ordering ("mine, overdue first") is visible on first load. Dated
  // rows step by business day (bd) so a weekend load never lands work on a
  // Saturday; the two "today" rows intentionally use the real calendar day so
  // they read as Today rather than Overdue.
  const jobLink = (job) => (job ? { type: 'job', id: job.id, label: `${job.number} ${job.title || ''}`.trim() } : null);
  const custLink = (cust) => (cust ? { type: 'customer', id: cust.id, label: displayName(cust) } : null);

  const toTodo = (owner, title, opts = {}) => {
    const { notes = '', due = null, dueHour = 8, link = null, done = false, madeDaysAgo = 3, origin = 'ui', by = own } = opts;
    const created = atTime(bd(-madeDaysAgo), 8.4);
    const completedAt = done ? isoAt(anchor, 12.2) : null;
    return {
      id: id('todo'), title, notes, status: done ? 'done' : 'open',
      assignedTo: owner.id, assignedToName: owner.name,
      dueDate: due ? dateKey(due) : null, dueAt: due ? isoAt(due, dueHour) : null,
      recordType: link ? link.type : null, recordId: link ? link.id : null, recordLabel: link ? link.label : '',
      createdBy: by, createdByName: by, origin,
      completedAt, completedBy: done ? owner.name : null,
      createdAt: created.toISOString(), updatedAt: (completedAt ? new Date(completedAt) : created).toISOString(),
    };
  };

  [
    toTodo(T.owner, 'Chase the cool-room invoice — third reminder due', {
      due: bd(-3), dueHour: 9, link: custLink(COM.brewing), madeDaysAgo: 9,
      notes: 'Kim Ashby asked for it to go to their accounts inbox and nothing has come back. Invoice is now overdue — ask for a payment date rather than sending another copy.',
    }),
    toTodo(T.owner, 'Get a hazmat quote for the meter panel at 27 Kingfisher Rd', {
      due: bd(-1), dueHour: 15, link: jobLink(j1), madeDaysAgo: 2,
      notes: 'Dale flagged the fibrous cement backing board as a field fault. Sample first, then price the enclosure replacement.',
    }),
    toTodo(T.owner, 'Ring Louise Petrakis back before she rings us again', {
      due: today, dueHour: 16, link: jobLink(j1), madeDaysAgo: 1,
      notes: 'She wants a number for the meter panel. If the sample is not back, give her the range and a date.',
    }),
    toTodo(T.owner, 'Follow up Daniel Nguyen about the battery rebate paperwork', {
      due: today, dueHour: 9.5, link: custLink(H.nguyen), madeDaysAgo: 1, origin: 'brny',
      notes: 'Asked brny this morning to remind us — the network application still has not gone in and stage 3 cannot be claimed without it.',
    }),
    toTodo(T.owner, 'Decide on the Saturday callout rate before the next on-call roster', {
      madeDaysAgo: 11, notes: 'Still on the old sheet — $180 after hours, $240 Saturdays. Priya has asked twice.',
    }),
    toTodo(T.owner, "Approve Tom's timesheet for last week", { done: true, madeDaysAgo: 5 }),
    toTodo(T.dale, 'Book the meter panel replacement in with Louise once the sample clears', {
      due: bd(1), dueHour: 8, link: jobLink(j1), madeDaysAgo: 1,
      notes: 'She works from home Tuesdays and Thursdays, so a morning start suits.',
    }),
    toTodo(T.priya, 'Send the equipment supplier the OPG outlet heights', {
      due: bd(1), dueHour: 12, link: jobLink(j2), madeDaysAgo: 2,
      notes: "Shona needs them before the electrician from the supplier books their fit-off.",
    }),
    toTodo(T.bec, 'Invoice the dental surgery once Priya is off site', {
      due: bd(2), dueHour: 9, link: jobLink(j2), madeDaysAgo: 1,
      notes: 'They are on 14 day terms and always pay on time when the paperwork arrives within the week.',
    }),
    toTodo(T.bec, 'Order more RCBO20s — four left on the shelf', {
      madeDaysAgo: 4, notes: 'Enclosure order last month cleaned us out. Two switchboard upgrades next week.',
    }),
  ].forEach((t) => C.todos.push(t));

  // ---- Reusable kits and task-list templates --------------------------------
  const kitItems = (list) => list.map(([k, q]) => ({ type: 'material', stockId: S[k].id, name: S[k].name, sku: STOCK.find((s) => s[0] === k)[2], qty: q, costPrice: S[k].cost, unitPrice: S[k].sell, unit: S[k].unit }));
  [['Switchboard upgrade kit (8 circuits)', 'Enclosure, main switch, SPD and 8 RCBOs for a standard house board.', 'Installation Kits', [['encl', 1], ['mainsw', 1], ['spd', 1], ['rcbo16', 4], ['rcbo20', 4], ['consum', 2]]],
    ['EV charger install kit', 'Wallbox, 32A RCBO, 20m of 6mm² and conduit.', 'Installation Kits', [['evc', 1], ['rcbo32', 1], ['tps6', 20], ['conduit', 3], ['consum', 1]]],
    ['Split system electrical kit', 'Isolator, RCBO, cable and install kit for one split system.', 'Installation Kits', [['splitkit', 1], ['iso20', 1], ['rcbo20', 1], ['tps25', 14], ['consum', 1]]],
    ['Rental smoke alarm kit (3 alarms)', 'Three interconnectable photoelectric alarms and cable.', 'Compliance Kits', [['smoke', 3], ['tps15', 12], ['consum', 1]]],
    ['Van restock — service electrician', 'Weekly top-up for a service van.', 'Vehicle Loadouts', [['gpo', 10], ['dl', 12], ['rcbo16', 2], ['rcbo20', 2], ['tps25', 50], ['consum', 4]]],
  ].forEach(([name, description, category, list]) => {
    const items = kitItems(list);
    C.kits.push({ id: id('kit'), name, description, category, items, totalCost: round2(items.reduce((s, i) => s + i.qty * i.costPrice, 0)), totalPrice: round2(items.reduce((s, i) => s + i.qty * i.unitPrice, 0)), itemCount: items.length, active: true, createdAt: isoAt(addDays(anchor, -200), 10), updatedAt: isoAt(addDays(anchor, -20), 10) });
  });
  const tt = (name, description, tags, phases) => C.taskTemplates.push({ id: id('tt'), name, description, tags, createdAt: isoAt(addDays(anchor, -200), 10), updatedAt: isoAt(addDays(anchor, -20), 10),
    tasks: phases.map(([pname, subs]) => ({ id: id('ttp'), name: pname, status: 'Not Started', progress: 0, description: '', subTasks: subs.map(([sname, hrs, people, valueFields]) => ({ id: id('tts'), name: sname, estimatedHours: hrs, people: people || 1, status: 'Not Started', progress: 0, ...(valueFields ? { valueFields: valueFields.map(([label, unit, fieldType, min, max]) => ({ id: id('vf'), label, unit, fieldType, min: min ?? '', max: max ?? '', value: '' })) } : {}) })) })) });
  tt('Switchboard upgrade', 'Standard domestic switchboard replacement with RCBOs, verification and CCEW.', ['Switchboard', 'Compliance'], [
    ['Preparation', [['JSA & isolation (LOTO)', 0.25], ['Photograph existing board & legend', 0.25]]],
    ['Installation', [['Remove old board', 1, 2], ['Mount enclosure, main switch & SPD', 1.5, 2], ['Terminate circuits on RCBOs', 2.5, 2], ['Circuit legend & labelling', 0.5]]],
    ['Verification', [['Visual inspection', 0.25], ['Earth continuity & insulation resistance', 0.75, 1, [['Insulation resistance (worst circuit)', 'MΩ', 'number', '1', ''], ['Main earth resistance', 'Ω', 'number', '', '0.5']]], ['Polarity & RCD trip times', 0.5, 1, [['Slowest RCD trip time', 'ms', 'number', '', '30']]]]],
    ['Handover', [['Lodge CCEW', 0.25], ['Walk customer through new board', 0.25]]],
  ]);
  tt('Split system install', 'Back-to-back split system install with dedicated circuit.', ['Air Conditioning'], [
    ['Install', [['Mount indoor unit & bracket', 1.5], ['Mount outdoor unit', 1], ['Line set, drain & interconnect', 1.5]]],
    ['Electrical', [['Dedicated circuit & isolator', 1]]],
    ['Commission', [['Pressure test & vacuum', 0.75, 1, [['Standing pressure (30 min)', 'kPa', 'number', '', ''], ['Vacuum achieved', 'microns', 'number', '', '500']]], ['Commission & customer handover', 0.5]]],
  ]);
  tt('EV charger install', 'Dedicated circuit, wallbox install and commissioning.', ['EV Charging'], [
    ['Install', [['Run dedicated circuit', 2], ['Mount & terminate wallbox', 1]]],
    ['Commission', [['Configure app, load management & solar mode', 0.5], ['Test & CCEW', 0.5, 1, [['RCD trip time', 'ms', 'number', '', '30']]]]],
  ]);

  // ---- Company settings ----------------------------------------------------
  const allHours = Array.from({ length: 48 }, (_, i) => i);
  const settings = {
    name: DEMO_COMPANY_NAME, abn: '12 345 678 901', phone: '02 5550 1100', email: 'office@harbourline-electrical.example', domain: 'harbourline-electrical.example',
    website: 'www.harbourline-electrical.example', address: 'Unit 4, 18 Tradesman Way, Cardiff NSW 2285', licenceNumber: 'NSW Contractor Licence 271938C (demo)',
    taxEnabled: true, taxRate: 10, markupPercent: 25,
    materialMarkup: { defaultPercent: 30, minMarkupAmount: 5, useTiers: true, tiers: [{ upTo: 50, percent: 60 }, { upTo: 200, percent: 45 }, { upTo: 1000, percent: 30 }, { upTo: null, percent: 15 }] },
    materialCategories: ['Protection & Switchgear', 'Wiring & Cable', 'Power & Data', 'Lighting', 'Safety & Compliance', 'EV & Solar', 'Air Conditioning', 'Consumables'],
    jobTypes: ['Service Call', 'Installation', 'Switchboard', 'Air Conditioning', 'Solar & Battery', 'EV Charging', 'Compliance & Testing', 'Maintenance', 'Emergency', 'Project'],
    supplierCategories: ['Electrical', 'HVAC', 'Fire Safety', 'General'],
    laborRates: [
      { id: 'rate_1', name: 'Standard Rate', rate: RATE.std, description: 'Mon–Fri 7am–4pm', overtimeMultiplier: 1.0, minCallOutFee: 0, applicableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], activeHours: allHours.slice(14, 32), isDefault: true },
      { id: 'rate_2', name: 'After Hours Rate', rate: RATE.ah, description: 'Weekday evenings and early mornings', overtimeMultiplier: 1.5, minCallOutFee: RATE.emergencyCallout, applicableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], activeHours: [...allHours.slice(0, 14), ...allHours.slice(32)], isDefault: false },
      { id: 'rate_3', name: 'Saturday Rate', rate: RATE.ah, description: 'Saturday work', overtimeMultiplier: 1.5, minCallOutFee: RATE.emergencyCallout, applicableDays: ['Sat'], activeHours: allHours, isDefault: false },
      { id: 'rate_4', name: 'Sunday & Public Holiday Rate', rate: RATE.emergency, description: 'Sundays and public holidays', overtimeMultiplier: 2.0, minCallOutFee: RATE.emergencyCallout, applicableDays: ['Sun', 'PH'], activeHours: allHours, isDefault: false },
      { id: 'rate_5', name: 'Emergency Rate', rate: RATE.emergency, description: 'Urgent call-outs, any day', overtimeMultiplier: 2.0, minCallOutFee: RATE.emergencyCallout, applicableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'PH'], activeHours: allHours, isDefault: false },
    ],
    documentTheme: {
      invoiceTerms: 'Residential: payment due within 7 days. Commercial: as per your account terms.',
      invoicePaymentTerms: 'Payment via Direct Deposit:\nBSB: 123-456\nAccount: 7890 1234\nReference: [Invoice Number]\n\nDemo details only — not a real account.',
      quoteTitle: 'QUOTATION', quoteTerms: 'This quote is valid for 30 days. Price includes testing, certification (CCEW) and removal of rubbish. Variations quoted before work proceeds.',
      footerNote: 'Thanks for choosing Harbourline — local sparkies since 2014.',
      invoicePrefix: 'INV-', invoiceStartingNumber: INVOICE_START, quotePrefix: 'Q-', quoteStartingNumber: QUOTE_START, jobPrefix: 'J-', jobStartingNumber: JOB_START,
    },
    demoDataset: { version: 1, seededAt: now.toISOString(), anchor: dateKey(anchor) },
  };

  // The office address is the dispatch start point for the map and routes.
  geo[settings.address] = { lat: -32.9405, lng: 151.6627, formattedAddress: `${settings.address}, Australia`, placeId: null, partialMatch: false };

  // Re-key every record so ids sort in creation order, like the app's own
  // time-based ids — local storage hands records back in id order, and lists
  // that show "most recent" rely on it.
  const rekey = new Map();
  Object.values(C).forEach((list) => {
    list.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).forEach((rec, i) => {
      const m = typeof rec.id === 'string' && rec.id.match(/^(.*demo_[a-z]+)_\d+$/);
      if (m) rekey.set(rec.id, `${m[1]}_${pad(i + 1, 5)}`);
    });
  });
  const remap = (value) => {
    if (typeof value === 'string') return rekey.get(value) ?? value;
    if (Array.isArray(value)) return value.map(remap);
    if (value && typeof value === 'object') { Object.keys(value).forEach((k) => { value[k] = remap(value[k]); }); return value; }
    return value;
  };
  Object.values(C).forEach((list) => list.forEach(remap));
  ['owner', ...CREW.map((c) => c.key)].forEach((k) => { T[k].id = rekey.get(T[k].id) ?? T[k].id; });

  const paid = C.invoices.filter((i) => i.status === 'Paid');
  const summary = {
    anchor: dateKey(anchor),
    counts: Object.fromEntries(Object.entries(C).map(([k, v]) => [k, v.length])),
    revenuePaid: round2(paid.reduce((s, i) => s + i.total, 0)),
    receivables: round2(C.invoices.filter((i) => i.status === 'Sent' || i.status === 'Overdue').reduce((s, i) => s + i.total, 0)),
    overdue: C.invoices.filter((i) => i.status === 'Overdue').length,
  };

  return { settings, collections: C, geo, summary, crew: T };
}

/**
 * Suppliers, contractors and projects — the records the rest of the work hangs on.
 *
 * Each is written with the fields its own form writes (`SupplierForm.js`,
 * `ContractorForm.js`, `ProjectsList.js`/`ProjectDetail.js`), so a record made
 * by brny opens and edits the same as one made by hand. Without these, a
 * purchase order for a new supplier or a job filed under a new project was a
 * dead end.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, bool, enumOf, list } from './schema.js';
import { conflict, invalidInput, notFound } from './errors.js';
import { logActivity } from './context.js';
import { customerLabel, resolveCustomer, resolveSite, siteAmbiguous, siteNotFound } from './customers.js';
import { parseDate } from './dates.js';

export const PAYMENT_TERMS = ['COD', '7 Days', '14 Days', '30 Days'];
export const PROJECT_STATUSES = ['In Progress', 'Completed', 'Cancelled'];

const textFields = (input, keys) => {
  const patch = {};
  keys.forEach((key) => {
    if (input[key] != null) patch[key] = String(input[key]).trim();
  });
  return patch;
};

/** Refuse a second record with the same name rather than quietly duplicating it. */
function assertNew(collection, field, value, what) {
  const wanted = String(value || '').trim().toLowerCase();
  const clash = (store.getAll(collection) || []).find((record) => String(record[field] || '').trim().toLowerCase() === wanted);
  if (clash) throw conflict(`A ${what} called "${clash[field]}" already exists. Update it instead.`);
}

// ── Suppliers ───────────────────────────────────────────────────────────

const supplierSearch = { searchFields: ['name', 'contactName', 'email', 'category', 'accountNumber'], what: 'supplier' };

const supplierFields = {
  contactName: str('Account manager or rep.'),
  email: str('Orders email. Purchase orders are sent here.'),
  phone: str('Phone number.'),
  address: str('Branch or trade counter address.'),
  category: str('Trade category, e.g. Electrical, Plumbing, HVAC.'),
  paymentTerms: enumOf(PAYMENT_TERMS, 'Payment terms on the trade account.'),
  accountNumber: str('Your account number with them.'),
  notes: str('Anything worth remembering about them.'),
};

defineAction({
  name: 'create_supplier',
  title: 'Create supplier',
  description: 'Add a supplier (a wholesaler or merchant you buy from) so purchase orders can be raised against it.',
  permission: { module: 'Suppliers', key: 'create' },
  inputSchema: objectSchema({ name: str('Supplier business name, e.g. "Reece Plumbing".'), ...supplierFields }, ['name']),
  summarize: (input, result) => `Added supplier ${result.supplier.name}.`,
  artifacts: (result) => [{ label: result.supplier.name, path: `/suppliers/${result.supplier.id}` }],
  async run(input) {
    assertNew('suppliers', 'name', input.name, 'supplier');
    const settings = store.getSettings ? store.getSettings() : {};
    const categories = settings.supplierCategories || ['Electrical', 'Plumbing', 'HVAC', 'Fire Safety', 'Security', 'General'];
    const supplier = store.create('suppliers', {
      name: input.name.trim(),
      contactName: '',
      email: '',
      phone: '',
      address: '',
      category: categories[0],
      paymentTerms: '30 Days',
      accountNumber: '',
      notes: '',
      ...textFields(input, Object.keys(supplierFields)),
      active: true,
    });
    logActivity({ type: 'supplier_created', text: `Supplier ${supplier.name} added.`, recordType: 'supplier', recordId: supplier.id });
    return { supplier };
  },
});

defineAction({
  name: 'update_supplier',
  title: 'Update supplier',
  description: 'Change a supplier\'s details, or mark it inactive so it stops being offered for new purchase orders.',
  permission: { module: 'Suppliers', key: 'edit' },
  inputSchema: objectSchema(
    { supplier: str('Supplier name, account number or id.'), name: str('New business name.'), ...supplierFields, active: bool('false to mark the supplier inactive.') },
    ['supplier']
  ),
  summarize: (input, result) => `Updated supplier ${result.supplier.name} (${result.fields.join(', ')}).`,
  artifacts: (result) => [{ label: result.supplier.name, path: `/suppliers/${result.supplier.id}` }],
  async run(input) {
    const supplier = resolveOne('suppliers', input.supplier, supplierSearch).record;
    const patch = textFields(input, ['name', ...Object.keys(supplierFields)]);
    if (input.active != null) patch.active = input.active;
    const fields = Object.keys(patch);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('suppliers', supplier.id, patch);
    logActivity({ type: 'supplier_updated', text: `Supplier ${patch.name || supplier.name} updated (${fields.join(', ')}).`, recordType: 'supplier', recordId: supplier.id });
    return { supplier: store.getById('suppliers', supplier.id), fields };
  },
});

// ── Contractors ─────────────────────────────────────────────────────────

const contractorSearch = {
  label: (record) => record.businessName || record.contactName || record.id,
  searchFields: ['businessName', 'contactName', 'email', 'licenseNumber'],
  what: 'contractor',
};

const contractorFields = {
  contactName: str('The person you deal with.'),
  email: str('Email address.'),
  phone: str('Phone number.'),
  licenseNumber: str('Trade licence number.'),
  insuranceExpiry: str('Public liability insurance expiry date, YYYY-MM-DD.'),
  hourlyRate: num('Hourly rate they charge, ex GST.'),
  afterHoursRate: num('After-hours hourly rate, ex GST.'),
  calloutFee: num('Call-out fee, ex GST.'),
  specialties: list(str('A trade or specialty.'), 'What they do, e.g. ["Data cabling", "Solar"].'),
  notes: str('Anything worth remembering about them.'),
};

/** Keep the Public Liability compliance entry in step with the expiry date, as `ContractorForm.js` does. */
function syncInsurance(docs, insuranceExpiry, licenseNumber) {
  const complianceDocs = JSON.parse(JSON.stringify(docs || []));
  if (!insuranceExpiry) return complianceDocs;
  const existing = complianceDocs.find((doc) => String(doc.type || '').toLowerCase().includes('public liability'));
  if (existing) {
    existing.expiryDate = insuranceExpiry;
    if (licenseNumber) existing.number = `PL-${licenseNumber}`;
  } else {
    complianceDocs.push({
      id: store.generateId(),
      type: 'Public Liability Insurance',
      number: licenseNumber ? `PL-${licenseNumber}` : 'PL-AUTO',
      expiryDate: insuranceExpiry,
      verified: true,
      notes: 'Auto-synced from primary details',
    });
  }
  return complianceDocs;
}

function contractorPatch(input) {
  const patch = textFields(input, ['contactName', 'email', 'phone', 'licenseNumber', 'notes']);
  if (input.insuranceExpiry != null) patch.insuranceExpiry = parseDate(input.insuranceExpiry);
  ['hourlyRate', 'afterHoursRate', 'calloutFee'].forEach((key) => {
    if (input[key] != null) patch[key] = Number(input[key]) || 0;
  });
  if (input.specialties != null) patch.specialties = input.specialties.map((s) => String(s).trim()).filter(Boolean);
  return patch;
}

defineAction({
  name: 'create_contractor',
  title: 'Create contractor',
  description: 'Add a subcontractor business you send work to, with their contact, licence, insurance expiry and rates.',
  permission: { module: 'Contractors', key: 'create' },
  inputSchema: objectSchema({ businessName: str('Contractor business name.'), ...contractorFields }, ['businessName', 'contactName']),
  summarize: (input, result) => `Added contractor ${result.contractor.businessName}.`,
  artifacts: (result) => [{ label: result.contractor.businessName, path: `/contractors/${result.contractor.id}` }],
  async run(input) {
    assertNew('contractors', 'businessName', input.businessName, 'contractor');
    const patch = contractorPatch(input);
    const contractor = store.create('contractors', {
      businessName: input.businessName.trim(),
      contactName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      insuranceExpiry: '',
      active: true,
      hourlyRate: 0,
      afterHoursRate: 0,
      calloutFee: 0,
      specialties: [],
      notes: '',
      ...patch,
      complianceDocs: syncInsurance([], patch.insuranceExpiry, patch.licenseNumber),
    });
    logActivity({ type: 'contractor_created', text: `Contractor ${contractor.businessName} added.`, recordType: 'contractor', recordId: contractor.id });
    return { contractor };
  },
});

defineAction({
  name: 'update_contractor',
  title: 'Update contractor',
  description: 'Change a contractor\'s details, rates or insurance expiry, or mark them inactive.',
  permission: { module: 'Contractors', key: 'edit' },
  inputSchema: objectSchema(
    { contractor: str('Contractor business name, contact or id.'), businessName: str('New business name.'), ...contractorFields, active: bool('false to mark the contractor inactive.') },
    ['contractor']
  ),
  summarize: (input, result) => `Updated contractor ${result.contractor.businessName} (${result.fields.join(', ')}).`,
  artifacts: (result) => [{ label: result.contractor.businessName, path: `/contractors/${result.contractor.id}` }],
  async run(input) {
    const contractor = resolveOne('contractors', input.contractor, contractorSearch).record;
    const patch = contractorPatch(input);
    if (input.businessName != null) patch.businessName = input.businessName.trim();
    if (input.active != null) patch.active = input.active;
    const fields = Object.keys(patch);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (patch.insuranceExpiry) {
      patch.complianceDocs = syncInsurance(contractor.complianceDocs, patch.insuranceExpiry, patch.licenseNumber || contractor.licenseNumber);
    }
    await store.update('contractors', contractor.id, patch);
    logActivity({ type: 'contractor_updated', text: `Contractor ${patch.businessName || contractor.businessName} updated (${fields.join(', ')}).`, recordType: 'contractor', recordId: contractor.id });
    return { contractor: store.getById('contractors', contractor.id), fields };
  },
});

// ── Projects ────────────────────────────────────────────────────────────

const projectSearch = {
  label: (record) => `${record.number || ''} ${record.name || ''}`.trim() || record.id,
  searchFields: ['number', 'name', 'customerName', 'siteAddress'],
  what: 'project',
};

defineAction({
  name: 'create_project',
  title: 'Create project',
  description: 'Start a project for a customer — a larger piece of work that groups several jobs, quotes and purchase orders. File jobs under it with update_job and `project`.',
  permission: { module: 'Jobs', key: 'create' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name, number or id.'),
      name: str('Project name, e.g. "Warehouse fit-out stage 2".'),
      description: str('Description and scope.'),
      site: str('Which of the customer\'s sites — the site name or its address.'),
      startDate: str('Start date, YYYY-MM-DD or a relative date.'),
      endDate: str('Target end date, YYYY-MM-DD or a relative date.'),
    },
    ['customer', 'name']
  ),
  summarize: (input, result) => `Created project ${result.project.number} ${result.project.name} for ${result.project.customerName}.`,
  artifacts: (result) => [{ label: `Open ${result.project.number}`, path: `/projects/${result.project.id}` }],
  async run(input) {
    const { customer } = resolveCustomer(input.customer, { create: false });
    if (!customer) throw notFound('customer', input.customer);
    let siteAddress = customer.siteAddress || customer.address || '';
    if (input.site) {
      const found = resolveSite(customer, input.site);
      if (found.kind === 'many') throw siteAmbiguous(input.site, found.hits);
      if (found.kind === 'none') throw siteNotFound(customer, input.site);
      siteAddress = String(found.site.address || '').trim() || siteAddress;
    }
    const project = await store.create('projects', {
      name: input.name.trim(),
      customerId: customer.id,
      customerName: customerLabel(customer),
      siteAddress,
      description: input.description || '',
      startDate: input.startDate ? parseDate(input.startDate) : null,
      endDate: input.endDate ? parseDate(input.endDate) : null,
      status: 'In Progress',
    });
    logActivity({ type: 'project_created', text: `Project ${project.number} ${project.name} created for ${project.customerName}.`, recordType: 'project', recordId: project.id });
    return { project };
  },
});

defineAction({
  name: 'update_project',
  title: 'Update project',
  description: 'Rename a project, change its scope or dates, or mark it Completed or Cancelled.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      project: str('Project number, name, customer or id.'),
      name: str('New name.'),
      description: str('New description and scope.'),
      status: enumOf(PROJECT_STATUSES, 'New status.'),
      startDate: str('New start date.'),
      endDate: str('New target end date.'),
    },
    ['project']
  ),
  summarize: (input, result) => `Updated project ${result.project.number} (${result.fields.join(', ')}).`,
  artifacts: (result) => [{ label: `Open ${result.project.number}`, path: `/projects/${result.project.id}` }],
  async run(input) {
    const project = resolveOne('projects', input.project, projectSearch).record;
    const patch = textFields(input, ['name', 'description']);
    if (input.status != null) patch.status = input.status;
    if (input.startDate != null) patch.startDate = parseDate(input.startDate);
    if (input.endDate != null) patch.endDate = parseDate(input.endDate);
    const fields = Object.keys(patch);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('projects', project.id, patch);
    logActivity({ type: 'project_updated', text: `Project ${project.number} updated (${fields.join(', ')}).`, recordType: 'project', recordId: project.id });
    return { project: store.getById('projects', project.id), fields };
  },
});

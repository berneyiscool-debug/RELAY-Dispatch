import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderAssetForm(container, params) {
  const isNew = params.id === 'new';
  let asset = isNew ? { 
    status: 'Active', 
    ownerType: 'Business', 
    type: 'Plant & Equipment',
    serviceIntervalMonths: 6,
    currentMeter: 0,
    recoveryRate: 0,
    logs: []
  } : store.getById('assets', params.id);

  if (!asset && !isNew) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>`;
    return;
  }

  const staff = store.getAll('technicians');
  const customers = store.getAll('customers');

  // Find sites for selected customer, if any
  let customerSites = [];
  if (asset.customerId) {
     const cust = store.getById('customers', asset.customerId);
     if (cust && cust.sites) customerSites = cust.sites;
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>${isNew ? 'New Asset' : 'Edit Asset'}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save</button>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <div class="card-body">
        <form id="asset-form" style="display: flex; flex-direction: column; gap: 15px;">
          <div class="form-group">
            <label class="form-label">Asset Name/ID *</label>
            <input type="text" id="name" class="form-input" value="${asset.name || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="description" class="form-input" rows="3">${asset.description || ''}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Owner Type</label>
              <select id="ownerType" class="form-select">
                <option value="Business" ${asset.ownerType === 'Business' ? 'selected' : ''}>My Business (Revenue Tool)</option>
                <option value="Customer" ${asset.ownerType === 'Customer' ? 'selected' : ''}>Customer (Service Target)</option>
              </select>
            </div>
            <div class="form-group" id="customer-select-group" style="display: ${asset.ownerType === 'Customer' ? 'block' : 'none'};">
              <label class="form-label">Customer *</label>
              <select id="customerId" class="form-select">
                <option value="">Select customer...</option>
                ${customers.map(c => `<option value="${c.id}" ${asset.customerId === c.id ? 'selected' : ''}>${escapeHTML(c.company || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Customer')}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type / Category</label>
              <select id="type" class="form-select">
                ${['Vehicle', 'Plant & Equipment', 'Specialized Tool', 'Fixed Asset (HVAC/Solar/Fire)', 'Other'].map(t => `<option value="${t}" ${asset.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Serial / ID / License</label>
              <input type="text" id="serial" class="form-input" value="${asset.serial || asset.identifier || ''}" placeholder="e.g. S/N 12345 or REG-123" />
            </div>
          </div>

          <div class="form-row" id="business-fields" style="display: ${asset.ownerType === 'Business' ? 'flex' : 'none'};">
            <div class="form-group">
              <label class="form-label">Recovery Rate ($/hr)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="text-tertiary">$</span>
                <input type="number" id="recoveryRate" class="form-input" value="${asset.recoveryRate || 0}" step="0.5" />
              </div>
              <div class="form-help">Amount charged to jobs for using this asset.</div>
            </div>
            <div class="form-group">
               <label class="form-label">Assign to Default Staff</label>
               <select id="assignedToId" class="form-select">
                 <option value="">Unassigned</option>
                 ${staff.map(s => `<option value="${s.id}" ${asset.assignedToId === s.id ? 'selected' : ''}>${s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}</option>`).join('')}
               </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Service Interval (Months)</label>
              <input type="number" id="serviceIntervalMonths" class="form-input" value="${asset.serviceIntervalMonths || 6}" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Current Meter Reading</label>
              <div style="display:flex; gap:8px;">
                <input type="number" id="currentMeter" class="form-input" value="${asset.currentMeter || 0}" step="1" style="flex:1" />
                <select id="meterUnit" class="form-select" style="width: 100px;">
                  <option value="hrs" ${asset.meterUnit === 'hrs' ? 'selected' : ''}>Hours</option>
                  <option value="kmls" ${asset.meterUnit === 'kmls' ? 'selected' : ''}>Kmls</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location / Site</label>
              <select id="site" class="form-select" ${asset.ownerType === 'Business' ? 'disabled' : ''}>
                <option value="">-- No specific site --</option>
                ${customerSites.map(s => `<option value="${s.name}" ${asset.site === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Install / Purchase Date</label>
              <input type="date" id="installDate" class="form-input" value="${asset.installDate || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="status" class="form-select">
              ${['Active', 'In Maintenance', 'Commissioning', 'Decommissioned', 'Lost/Stolen'].map(s => `<option value="${s}" ${asset.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </form>
      </div>
    </div>
  `;

  const ownerTypeSelect = container.querySelector('#ownerType');
  const customerGroup = container.querySelector('#customer-select-group');
  const customerSelect = container.querySelector('#customerId');
  const siteSelect = container.querySelector('#site');
  
  const bizFields = container.querySelector('#business-fields');
  
  ownerTypeSelect.addEventListener('change', (e) => {
    const isCustomer = e.target.value === 'Customer';
    customerGroup.style.display = isCustomer ? 'block' : 'none';
    bizFields.style.display = isCustomer ? 'none' : 'flex';
    siteSelect.disabled = !isCustomer;
    if (!isCustomer) {
      siteSelect.innerHTML = '<option value="">-- No specific site --</option>';
    } else {
      updateSiteOptions(customerSelect.value);
    }
  });

  customerSelect.addEventListener('change', (e) => {
    updateSiteOptions(e.target.value);
  });

  function updateSiteOptions(customerId) {
    if (!customerId) {
      siteSelect.innerHTML = '<option value="">-- No specific site --</option>';
      return;
    }
    const cust = store.getById('customers', customerId);
    if (!cust || !cust.sites || cust.sites.length === 0) {
      siteSelect.innerHTML = '<option value="">-- No specific site --</option>';
      return;
    }
    siteSelect.innerHTML = '<option value="">-- No specific site --</option>' + 
      cust.sites.map(s => `<option value="${s.name}" ${asset.site === s.name ? 'selected' : ''}>${s.name}</option>`).join('');
  }

  container.querySelector('#btn-cancel').addEventListener('click', () => {
    router.navigate(isNew ? '/assets' : `/assets/${params.id}`);
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    const isCustomerAsset = container.querySelector('#ownerType').value === 'Customer';
    const assetCustId = isCustomerAsset ? container.querySelector('#customerId').value : null;
    const assetCust = assetCustId ? customers.find(c => c.id === assetCustId) : null;

    const data = {
      name: container.querySelector('#name').value,
      description: container.querySelector('#description').value,
      serial: container.querySelector('#serial').value,
      identifier: container.querySelector('#serial').value,
      type: container.querySelector('#type').value,
      status: container.querySelector('#status').value,
      assignedToId: container.querySelector('#assignedToId').value,
      ownerType: container.querySelector('#ownerType').value,
      customerId: assetCustId,
      customerName: assetCust ? (assetCust.company || `${assetCust.firstName || ''} ${assetCust.lastName || ''}`.trim()) : null,
      site: container.querySelector('#site').value,
      installDate: container.querySelector('#installDate').value,
      recoveryRate: parseFloat(container.querySelector('#recoveryRate')?.value || 0),
      serviceIntervalMonths: parseInt(container.querySelector('#serviceIntervalMonths').value || 6),
      currentMeter: parseFloat(container.querySelector('#currentMeter').value || 0),
      meterUnit: container.querySelector('#meterUnit').value
    };

    if (!data.name) {
      alert('Asset Name is required.');
      return;
    }

    if (isNew) {
      data.logs = [];
      store.create('assets', data);
    } else {
      store.update('assets', params.id, data);
    }

    router.navigate('/assets');
  });
}

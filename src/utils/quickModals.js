// ============================================
// SIMPRO CLONE — QUICK-ADD MODAL UTILITIES
// ============================================

import { store } from '../data/store.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Notifications.js';
import { showDrawer } from '../components/Drawer.js';
import { escapeHTML } from './security.js';

/**
 * Opens a modal to quickly create a new Asset.
 * @param {Object} options - Options including customerId, site, and callback.
 */
export function showAssetQuickAdd({ customerId = null, site = '', onSave = null } = {}) {
  const customers = store.getAll('customers');
  const staff = store.getAll('people').filter(p => p.type === 'Staff');
  const selectedCustomer = customerId ? store.getById('customers', customerId) : null;
  const sites = selectedCustomer?.sites || [];

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="quick-asset-form" style="display: flex; flex-direction: column; gap: 15px; padding-top: 5px;">
      <div class="form-group">
        <label class="form-label">Asset Name/ID *</label>
        <input type="text" id="qa-asset-name" class="form-input" placeholder="e.g. Carrier HVAC Unit" required />
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="qa-asset-desc" class="form-input" rows="2" placeholder="Brief description..."></textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Owner Type</label>
          <select id="qa-owner-type" class="form-select">
            <option value="Business" ${!customerId ? 'selected' : ''}>My Business</option>
            <option value="Customer" ${customerId ? 'selected' : ''}>Customer</option>
          </select>
        </div>
        <div class="form-group" id="qa-customer-group" style="display: ${customerId ? 'block' : 'none'};">
          <label class="form-label">Customer</label>
          <select id="qa-customer-id" class="form-select">
            <option value="">Select customer...</option>
            ${customers.map(c => `<option value="${c.id}" ${customerId === c.id ? 'selected' : ''}>${c.company || c.firstName + ' ' + c.lastName}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type / Category</label>
          <select id="qa-asset-type" class="form-select">
            <option>Vehicle</option>
            <option selected>Plant & Equipment</option>
            <option>Specialized Tool</option>
            <option>Fixed Asset (HVAC/Solar/Fire)</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Serial / ID / License</label>
          <input type="text" id="qa-asset-serial" class="form-input" placeholder="Serial number" />
        </div>
      </div>

      <!-- Conditional Sections -->
      <div id="qa-business-fields" style="display: ${!customerId ? 'flex' : 'none'}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Recovery Rate ($/hr)</label>
          <input type="number" id="qa-recovery-rate" class="form-input" value="0" step="0.5" />
        </div>
        <div class="form-group">
          <label class="form-label">Assign To</label>
          <select id="qa-assigned-to" class="form-select">
            <option value="">Unassigned</option>
            ${staff.map(s => `<option value="${s.id}">${s.firstName} ${s.lastName}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${customerId ? 'flex' : 'none'}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${sites.map(s => `<option value="${escapeHTML(s.name)}" ${site === s.name ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Install Date</label>
          <input type="date" id="qa-install-date" class="form-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Service Int. (Mos)</label>
          <input type="number" id="qa-service-interval" class="form-input" value="6" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label">Initial Meter/Hrs</label>
          <div style="display:flex; gap:8px;">
            <input type="number" id="qa-initial-meter" class="form-input" value="0" style="flex:1" />
            <select id="qa-meter-unit" class="form-select" style="width: 80px;">
              <option value="hrs">hrs</option>
              <option value="kmls">km</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  `;

  // Handle dynamic logic
  const ownerSelect = content.querySelector('#qa-owner-type');
  const custGroup = content.querySelector('#qa-customer-group');
  const bizFields = content.querySelector('#qa-business-fields');
  const custFields = content.querySelector('#qa-customer-fields');
  const custSelect = content.querySelector('#qa-customer-id');
  const siteSelect = content.querySelector('#qa-asset-site');

  ownerSelect.addEventListener('change', (e) => {
    const isCust = e.target.value === 'Customer';
    custGroup.style.display = isCust ? 'block' : 'none';
    bizFields.style.display = isCust ? 'none' : 'flex';
    custFields.style.display = isCust ? 'flex' : 'none';
  });

  custSelect.addEventListener('change', (e) => {
    const custId = e.target.value;
    const cust = store.getById('customers', custId);
    if (cust && cust.sites) {
      siteSelect.innerHTML = '<option value="">-- No specific site --</option>' + 
        cust.sites.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('');
    } else {
      siteSelect.innerHTML = '<option value="">-- No specific site --</option>';
    }
  });

  showModal({
    title: 'Quick Add Asset',
    size: 'modal-70', // Use wider modal for more fields
    content,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
      { label: 'Create Asset', className: 'btn-primary', onClick: (close) => {
          const name = content.querySelector('#qa-asset-name').value.trim();
          if (!name) return showToast('Asset Name is required', 'error');

          const ownerType = ownerSelect.value;
          const custId = custSelect.value;
          if (ownerType === 'Customer' && !custId) return showToast('Please select a customer', 'error');

          const assetData = {
            name,
            description: content.querySelector('#qa-asset-desc').value.trim(),
            ownerType,
            customerId: ownerType === 'Customer' ? custId : null,
            type: content.querySelector('#qa-asset-type').value,
            serial: content.querySelector('#qa-asset-serial').value.trim(),
            status: 'Active',
            serviceIntervalMonths: parseInt(content.querySelector('#qa-service-interval').value) || 6,
            currentMeter: parseInt(content.querySelector('#qa-initial-meter').value) || 0,
            meterUnit: content.querySelector('#qa-meter-unit').value,
            logs: []
          };

          if (ownerType === 'Business') {
            assetData.recoveryRate = parseFloat(content.querySelector('#qa-recovery-rate').value) || 0;
            assetData.assignedToId = content.querySelector('#qa-assigned-to').value;
          } else {
            assetData.site = siteSelect.value;
            assetData.installDate = content.querySelector('#qa-install-date').value;
          }

          const newAsset = store.create('assets', assetData);
          showToast(`Asset "${name}" created successfully`, 'success');
          if (onSave) onSave(newAsset);
          close();
        }
      }
    ]
  });
}

/**
 * Opens a drawer/modal to quickly create a new Stock item.
 */
export function showStockQuickAdd({ onSave } = {}) {
  const assets = store.getAll('assets');
  const settings = store.getSettings();
  const categories = settings.materialCategories || ['Consumables', 'Electrical', 'Plumbing', 'HVAC Parts', 'Fixings', 'General'];

  const content = document.createElement('div');
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${categories.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">SKU / Part #</label>
        <input type="text" id="qs-sku" class="form-input" placeholder="e.g. CON-20-4" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit of Measure</label>
        <input type="text" id="qs-unit" class="form-input" value="each" placeholder="e.g. ea, m, pack" />
      </div>
      <div class="form-group">
        <label class="form-label">Reorder Level</label>
        <input type="number" id="qs-reorder" class="form-input" value="10" />
      </div>
      <div class="form-group">
        <label class="form-label">Cost Price (Ex GST) *</label>
        <input type="number" id="qs-cost" class="form-input" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Sell Price (Ex GST)</label>
        <input type="number" id="qs-sell" class="form-input" step="0.01" placeholder="Leave blank to auto-calc" />
      </div>
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Primary Location</label>
        <select id="qs-location" class="form-select">
          <option>Warehouse A</option>
          <option>Warehouse B</option>
          <optgroup label="Assets / Vehicles">
            ${assets.map(a => `<option>${a.name}</option>`).join('')}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `;

  showModal({
    title: 'Create New Catalog Item',
    content,
    width: 550,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
      { label: 'Save to Catalog', className: 'btn-primary', onClick: (close) => {
          const name = content.querySelector('#qs-name').value;
          const cost = parseFloat(content.querySelector('#qs-cost').value) || 0;
          let sell = parseFloat(content.querySelector('#qs-sell').value);
          
          if (!name) { showToast('Item name is required', 'error'); return; }
          if (cost <= 0) { showToast('Cost price is required', 'error'); return; }

          if (isNaN(sell) || sell === 0) {
            sell = cost * 1.3; // Default 30% markup
          }

          const newItem = store.create('stock', {
            name,
            category: content.querySelector('#qs-category').value,
            sku: content.querySelector('#qs-sku').value || `SKU-${Date.now().toString().slice(-4)}`,
            unit: content.querySelector('#qs-unit').value,
            reorderLevel: parseInt(content.querySelector('#qs-reorder').value) || 10,
            costPrice: cost,
            unitPrice: sell,
            location: content.querySelector('#qs-location').value,
            quantity: 0, // Starts at 0, will be updated when PO is received
            supplier: ''
          });

          showToast(`Stock item "${name}" created`, 'success');
          if (onSave) onSave(newItem);
          close();
        }
      }
    ]
  });
}

/**
 * Opens a wide drawer to create or edit a Purchase Order.
 */
export function showPurchaseOrderDrawer({ id = null, jobId = null, supplierId = null, onSave = null } = {}) {
  const isNew = !id;
  const suppliers = (store.getAll('suppliers') || []).filter(s => s.active !== false);
  const jobs = store.getAll('jobs').filter(j => j.status !== 'Completed' && j.status !== 'Invoiced');
  const stockItems = store.getAll('stock');
  
  let po = isNew ? {
    status: 'Draft',
    lineItems: [],
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
    supplierId: supplierId || '',
    jobId: jobId || ''
  } : store.getById('purchaseOrders', id);

  if (!po) {
    showToast('Purchase Order not found', 'error');
    return;
  }

  let poItems = [...(po.lineItems || [])];

  const content = document.createElement('div');
  content.className = 'po-drawer-container';
  
  function renderDrawerUI() {
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''}>
                <option value="">Select supplier...</option>
                ${suppliers.map(s => `<option value="${s.id}" ${po.supplierId === s.id ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''}>
                <option value="">No specific job (Stock PO)</option>
                ${jobs.map(j => `<option value="${j.id}" ${po.jobId === j.id ? 'selected' : ''}>#${j.number} - ${j.title}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${po.issueDate ? po.issueDate.split('T')[0] : ''}" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${escapeHTML(po.notes || '')}" placeholder="e.g. Delivery instructions" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${!isNew ? `(${escapeHTML(po.number)})` : ''}</h4>
            ${po.status === 'Draft' || isNew ? `
            <div style="display:flex; gap:8px">
               <button class="btn btn-secondary btn-sm" id="btn-browse-stock"><span class="material-icons-outlined" style="font-size:16px">inventory_2</span> Browse Stock</button>
               <button class="btn btn-secondary btn-sm" id="btn-add-kit"><span class="material-icons-outlined" style="font-size:16px; vertical-align:middle">widgets</span> Add Kit</button>
               <button class="btn btn-secondary btn-sm" id="btn-add-stock-new"><span class="material-icons-outlined" style="font-size:16px">add</span> Add New Stock</button>
            </div>
            ` : `<span class="badge ${po.status === 'Issued' ? 'badge-primary' : 'badge-success'}">${po.status}</span>`}
          </div>

          <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
            <table class="data-table" style="margin:0">
              <thead style="position:sticky; top:0; z-index:1">
                <tr>
                  <th>Description</th>
                  <th style="width:80px">Qty</th>
                  <th style="width:100px">Unit Cost</th>
                  <th style="width:100px; text-align:right">Total</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody id="po-items-body">
                ${poItems.length === 0 ? '<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>' : poItems.map((item, idx) => `
                  <tr data-idx="${idx}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${escapeHTML(item.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${idx}" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''} />
                       <datalist id="stock-list-${idx}">
                          ${stockItems.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} - $${(s.costPrice || 0).toFixed(2)}</option>`).join('')}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${item.qty || item.quantity}" min="1" style="width:100%" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''} /></td>
                    <td><input type="number" class="form-input item-cost" value="${item.cost || item.unitCost}" step="0.01" style="width:100%" ${po.status !== 'Draft' && !isNew ? 'disabled' : ''} /></td>
                    <td style="text-align:right; font-weight:600">$${((item.qty || item.quantity || 0) * (item.cost || item.unitCost || 0)).toFixed(2)}</td>
                    <td>${po.status === 'Draft' || isNew ? `<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${poItems.reduce((acc, cur) => acc + ((cur.qty || cur.quantity || 0) * (cur.cost || cur.unitCost || 0)), 0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;
    
    attachEvents();
  }

  function attachEvents() {
    content.querySelector('#btn-add-stock-new')?.addEventListener('click', () => {
      showStockQuickAdd({
        onSave: (newItem) => {
          poItems.push({ description: newItem.name, qty: 1, cost: newItem.costPrice || 0, stockId: newItem.id });
          renderDrawerUI();
        }
      });
    });

    content.querySelector('#btn-add-kit')?.addEventListener('click', () => {
      import('../components/KitPicker.js').then(({ showKitPicker }) => {
        showKitPicker({
          context: 'po',
          onSelect: (kit) => {
            (kit.items || []).forEach(ki => {
              if (ki.type !== 'labor') {
                poItems.push({
                  description: ki.name,
                  qty: ki.qty || 1,
                  cost: ki.costPrice || 0,
                  stockId: ki.stockId
                });
              }
            });
            renderDrawerUI();
            showToast(`Added kit items from ${kit.name}`, 'success');
          }
        });
      });
    });

    content.querySelector('#btn-browse-stock')?.addEventListener('click', () => {
      const stockContent = document.createElement('div');
      stockContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${stockItems.map(s => `
            <div class="stock-pick-item" data-id="${s.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${escapeHTML(s.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${s.sku || 'N/A'} — Cost: $${(s.costPrice || 0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join('')}
        </div>
      `;

      showModal({
        title: 'Select Stock',
        content: stockContent,
        actions: [{ label: 'Close', className: 'btn-secondary', onClick: (c) => c() }]
      });

      stockContent.querySelector('#btn-po-new-stock')?.addEventListener('click', () => {
        showStockQuickAdd({
          onSave: (newItem) => {
            poItems.push({ description: newItem.name, qty: 1, cost: newItem.costPrice || 0, stockId: newItem.id });
            renderDrawerUI();
            document.querySelector('.modal-overlay')?.remove();
          }
        });
      });

      stockContent.querySelectorAll('.stock-pick-item').forEach(el => {
        el.addEventListener('click', () => {
          const s = stockItems.find(x => x.id === el.dataset.id);
          if (s) {
            poItems.push({ description: s.name, qty: 1, cost: s.costPrice || 0, stockId: s.id });
            renderDrawerUI();
            showToast(`Added ${s.name}`, 'success');
          }
        });
      });
    });

    content.querySelectorAll('#po-items-body tr').forEach(tr => {
      const idx = parseInt(tr.dataset.idx);
      const descInp = tr.querySelector('.item-desc');
      const qtyInp = tr.querySelector('.item-qty');
      const costInp = tr.querySelector('.item-cost');

      descInp?.addEventListener('change', (e) => {
        const val = e.target.value;
        const match = stockItems.find(s => s.name === val);
        if (match) {
          poItems[idx].description = match.name;
          poItems[idx].cost = match.costPrice || 0;
          poItems[idx].stockId = match.id;
        } else {
          poItems[idx].description = val;
        }
        renderDrawerUI();
      });

      qtyInp?.addEventListener('input', () => { 
        const val = parseFloat(qtyInp.value) || 0;
        poItems[idx].qty = val;
        poItems[idx].quantity = val; // for compatibility
      });
      costInp?.addEventListener('input', () => { 
        const val = parseFloat(costInp.value) || 0;
        poItems[idx].cost = val;
        poItems[idx].unitCost = val; // for compatibility
      });
      
      tr.querySelector('.btn-remove-item')?.addEventListener('click', () => {
        poItems.splice(idx, 1);
        renderDrawerUI();
      });
    });
  }

  renderDrawerUI();

  const footerActions = [
    { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() }
  ];

  if (isNew || po.status === 'Draft') {
    footerActions.push({
      label: isNew ? 'Create & Issue PO' : 'Update & Issue PO',
      className: 'btn-primary',
      onClick: (close) => {
        const suppId = content.querySelector('#qa-po-supplier').value;
        const selectedJobId = content.querySelector('#qa-po-job').value;
        
        if (!suppId) { showToast('Supplier is required', 'error'); return; }
        if (poItems.length === 0) { showToast('Please add at least one item', 'error'); return; }

        const supplier = suppliers.find(s => s.id === suppId);
        const job = jobs.find(j => j.id === selectedJobId);

        const poData = {
          number: po.number || `PO-${Date.now().toString().slice(-6)}`,
          supplierId: suppId,
          supplierName: supplier?.name || supplier?.company || 'Unknown',
          jobId: selectedJobId || null,
          jobNumber: job?.number || '',
          issueDate: content.querySelector('#qa-po-date').value,
          notes: content.querySelector('#qa-po-notes').value,
          total: poItems.reduce((acc, cur) => acc + ((cur.qty || cur.quantity || 0) * (cur.cost || cur.unitCost || 0)), 0),
          status: 'Issued',
          lineItems: poItems
        };

        if (isNew) store.create('purchaseOrders', poData);
        else store.update('purchaseOrders', id, poData);

        showToast(`Purchase Order ${poData.number} issued`, 'success');
        if (onSave) onSave();
        close();
      }
    });
  } else if (po.status === 'Issued') {
     footerActions.push({
       label: 'Mark as Received',
       className: 'btn-success',
       onClick: (close) => {
         const technicians = store.getAll('technicians');
         const assets = store.getAll('assets');

         const modalContent = document.createElement('div');
         modalContent.innerHTML = `
           <div class="form-group">
             <label class="form-label">Receive into Location *</label>
             <select class="form-select" id="receive-location-select" required>
               <option value="Main Warehouse">Main Warehouse</option>
               <optgroup label="Warehouses">
                 <option value="Warehouse A">Warehouse A</option>
                 <option value="Warehouse B">Warehouse B</option>
               </optgroup>
               <optgroup label="Vehicles">
                 ${technicians.map(t => `<option value="Vehicle - ${escapeHTML(t.name)}">Vehicle - ${escapeHTML(t.name)}</option>`).join('')}
               </optgroup>
               <optgroup label="Assets">
                 ${assets.map(a => `<option value="${escapeHTML(a.name)}">${escapeHTML(a.name)}</option>`).join('')}
               </optgroup>
             </select>
           </div>
         `;

         showModal({
           title: 'Receive Purchase Order',
           content: modalContent,
           actions: [
             { label: 'Cancel', className: 'btn-secondary', onClick: (closeModal) => closeModal() },
             { label: 'Receive Items', className: 'btn-success', onClick: (closeModal) => {
               const targetLoc = modalContent.querySelector('#receive-location-select').value;
               if (!targetLoc) {
                 showToast('Please select a valid location', 'error');
                 return;
               }

               let receiveCount = 0;
               const allStock = store.getAll('stock');

               poItems.forEach(item => {
                 const stockId = item.stockId;
                 if (stockId) {
                   const s = allStock.find(x => x.id === stockId);
                   if (s) {
                     if (!s.locations) s.locations = [];
                     let locObj = s.locations.find(l => l.location === targetLoc);
                     const itemQty = parseFloat(item.qty || item.quantity) || 0;
                     if (locObj) {
                       locObj.quantity += itemQty;
                     } else {
                       s.locations.push({ location: targetLoc, quantity: itemQty });
                     }

                     s.quantity = s.locations.reduce((sum, l) => sum + l.quantity, 0);
                     s.location = s.locations[0]?.location || 'Main Warehouse';
                     s.updatedAt = new Date().toISOString();
                     receiveCount++;
                   }
                 }
               });

               if (receiveCount > 0) {
                 store.save('stock', allStock);
               }

               store.update('purchaseOrders', id, { status: 'Received', receivedDate: new Date().toISOString() });
               showToast(`Received ${receiveCount} items into ${targetLoc}`, 'success');
               closeModal();
               if (onSave) onSave();
               close();
             }}
           ]
         });
       }
     });
  }

  showDrawer({
    title: isNew ? 'New Purchase Order' : `Manage Purchase Order`,
    content,
    width: 750,
    actions: footerActions
  });
}

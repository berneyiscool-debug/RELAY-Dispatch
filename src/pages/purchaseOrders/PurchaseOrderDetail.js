// ============================================
// SIMPRO CLONE — PURCHASE ORDER DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { escapeHTML } from '../../utils/security.js';

export function renderPurchaseOrderDetail(container, { id, jobId }) {
  const isNew = id === 'new';
  let po = isNew ? {
    status: 'Draft',
    lineItems: [],
    issueDate: new Date().toISOString().split('T')[0],
    total: 0,
    jobId: jobId || '',
    jobNumber: ''
  } : store.getById('purchaseOrders', id);

  if (!po) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';
    return;
  }

  // Pre-fill job details if passed
  if (isNew && jobId) {
    const job = store.getById('jobs', jobId);
    if (job) po.jobNumber = job.number;
  }

  updateBreadcrumbDetail(isNew ? 'New PO' : po.number);

  const stockItems = store.getAll('stock');
  const jobs = store.getAll('jobs');
  
  // Fetch active suppliers dynamically from the suppliers database
  const activeSuppliers = store.getAll('suppliers').filter(s => s.active !== false);
  const dropdownSuppliers = [...activeSuppliers];
  if (po.supplierName && !activeSuppliers.some(s => s.name === po.supplierName)) {
    dropdownSuppliers.push({ name: po.supplierName });
  }
  if (dropdownSuppliers.length === 0) {
    dropdownSuppliers.push({ name: 'General Supplier' });
  }

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: po.number || 'New Purchase Order',
        icon: 'shopping_cart',
        metaHtml: `
          <span class="badge ${po.status === 'Draft' ? 'badge-neutral' : po.status === 'Issued' ? 'badge-primary' : po.status === 'Received' ? 'badge-success' : 'badge-danger'}">${po.status}</span>
        `,
        actionsHtml: `
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!isNew && po.status === 'Draft' ? `<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>` : ''}
          ${!isNew && po.status === 'Issued' ? `<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>` : ''}
        `
      })}

      <div class="grid-3" style="align-items: start;">
        <div class="card" style="grid-column: span 1">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${po.status !== 'Draft' ? 'disabled' : ''}>
                    <option value="">Select supplier...</option>
                    ${dropdownSuppliers.map(s => `<option value="${escapeHTML(s.name)}" ${po.supplierName === s.name ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${po.issueDate ? po.issueDate.split('T')[0] : ''}" ${po.status !== 'Draft' ? 'disabled' : ''} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${po.status !== 'Draft' ? 'disabled' : ''}>
                    <option value="">None</option>
                    ${jobs.map(j => `<option value="${j.id}" ${po.jobId === j.id ? 'selected' : ''}>${j.number} - ${j.title}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${po.status !== 'Draft' ? 'disabled' : ''}>${po.notes || ''}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${po.status === 'Draft' ? `<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>` : ''}
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:40%">Item Name / Description</th>
                  <th style="width:15%">SKU</th>
                  <th style="width:15%;text-align:right">Unit Cost</th>
                  <th style="width:15%;text-align:right">Quantity</th>
                  <th style="width:15%;text-align:right">Total</th>
                  ${po.status === 'Draft' ? '<th style="width:5%"></th>' : ''}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${po.lineItems.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>' : ''}
                ${po.lineItems.map((item, index) => `
                  <tr data-index="${index}">
                    <td>
                      ${po.status === 'Draft' ? `
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${stockItems.map(s => `<option value="${s.id}" ${item.stockId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${item.stockId ? 'display:none' : ''}" value="${item.description || ''}" placeholder="Description" />
                      ` : `<div>${item.description}</div>`}
                    </td>
                    <td>
                      ${po.status === 'Draft' ? `<input type="text" class="form-input item-sku" style="width:100%" value="${item.sku || ''}" ${item.stockId ? 'disabled' : ''} />` : (item.sku || '—')}
                    </td>
                    <td style="text-align:right">
                      ${po.status === 'Draft' ? `<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${item.unitCost || 0}" step="0.01" />` : `$${(item.unitCost || 0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${po.status === 'Draft' ? `<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${item.quantity || 1}" min="1" step="1" />` : item.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((item.unitCost || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                    ${po.status === 'Draft' ? `
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(po.total || 0).toFixed(2)}</td>
                  ${po.status === 'Draft' ? '<td></td>' : ''}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function updateTotal() {
    let sum = 0;
    container.querySelectorAll('#line-items-body tr[data-index]').forEach(tr => {
      const cost = parseFloat(tr.querySelector('.item-cost').value) || 0;
      const qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
      const total = cost * qty;
      tr.querySelector('.item-total').textContent = '$' + total.toFixed(2);
      sum += total;
    });
    po.total = sum;
    const totalEl = container.querySelector('#po-total');
    if (totalEl) totalEl.textContent = '$' + sum.toFixed(2);
  }

  function bindEvents() {
    container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate('/purchase-orders'));
    
    container.querySelector('#btn-save')?.addEventListener('click', () => {
      savePO();
    });

    container.querySelector('#btn-issue')?.addEventListener('click', () => {
      if (po.lineItems.length === 0) {
        showToast('Cannot issue a PO with no items', 'error');
        return;
      }
      savePO('Issued');
    });

    container.querySelector('#btn-receive')?.addEventListener('click', () => {
      const technicians = store.getAll('technicians');
      const assets = store.getAll('assets');
      
      const content = document.createElement('div');
      content.innerHTML = `
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
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Receive Items', className: 'btn-success', onClick: (close) => {
            const targetLoc = content.querySelector('#receive-location-select').value;
            if (!targetLoc) {
              showToast('Please select a valid location', 'error');
              return;
            }

            let receiveCount = 0;
            const allStock = store.getAll('stock');
            
            po.lineItems.forEach(item => {
              if (item.stockId) {
                const s = allStock.find(x => x.id === item.stockId);
                if (s) {
                  if (!s.locations) s.locations = [];
                  let locObj = s.locations.find(l => l.location === targetLoc);
                  if (locObj) {
                    locObj.quantity += item.quantity;
                  } else {
                    s.locations.push({ location: targetLoc, quantity: item.quantity });
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

            showToast(`Received ${receiveCount} items into ${targetLoc}`, 'success');
            po.status = 'Received';
            store.update('purchaseOrders', po.id, { status: 'Received' });
            close();
            render();
          }}
        ]
      });
    });

    container.querySelector('#btn-add-item')?.addEventListener('click', () => {
      po.lineItems.push({ description: '', sku: '', unitCost: 0, quantity: 1, stockId: '' });
      render();
    });

    container.querySelectorAll('.item-select').forEach((sel, idx) => {
      sel.addEventListener('change', (e) => {
        const val = e.target.value;
        const tr = e.target.closest('tr');
        const descInput = tr.querySelector('.item-desc');
        const skuInput = tr.querySelector('.item-sku');
        const costInput = tr.querySelector('.item-cost');
        
        if (val) {
          const s = store.getById('stock', val);
          if (s) {
            descInput.style.display = 'none';
            descInput.value = s.name;
            skuInput.value = s.sku;
            skuInput.disabled = true;
            costInput.value = s.costPrice || s.unitPrice;
          }
        } else {
          descInput.style.display = 'block';
          descInput.value = '';
          skuInput.value = '';
          skuInput.disabled = false;
          costInput.value = 0;
        }
        updateTotal();
      });
    });

    container.querySelectorAll('.item-cost, .item-qty').forEach(inp => {
      inp.addEventListener('input', updateTotal);
    });

    container.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        const idx = parseInt(tr.dataset.index);
        po.lineItems.splice(idx, 1);
        render();
      });
    });
  }

  function savePO(newStatus = null) {
    if (po.status !== 'Draft') {
      showToast('Cannot modify an issued or received PO', 'error');
      return;
    }

    const form = container.querySelector('#po-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    
    if (data.jobId) {
      const job = jobs.find(j => j.id === data.jobId);
      data.jobNumber = job ? job.number : '';
    } else {
      data.jobNumber = '';
    }

    // Sync line items from DOM
    po.lineItems = Array.from(container.querySelectorAll('#line-items-body tr[data-index]')).map(tr => {
      const sel = tr.querySelector('.item-select');
      const stockId = sel ? sel.value : '';
      const desc = tr.querySelector('.item-desc').value;
      const finalDesc = stockId ? sel.options[sel.selectedIndex].text : desc;
      
      return {
        stockId,
        description: finalDesc,
        sku: tr.querySelector('.item-sku').value,
        unitCost: parseFloat(tr.querySelector('.item-cost').value) || 0,
        quantity: parseInt(tr.querySelector('.item-qty').value) || 1,
      };
    });

    updateTotal();

    const poData = {
      ...po,
      ...data,
      total: po.total,
      lineItems: po.lineItems,
      status: newStatus || po.status
    };

    if (isNew) {
      poData.number = store.getNextNumber('PO-', 'purchaseOrders');
      const created = store.create('purchaseOrders', poData);
      showToast(`PO ${newStatus === 'Issued' ? 'issued' : 'created'} successfully`, 'success');
      router.navigate(`/purchase-orders/${created.id}`);
    } else {
      store.update('purchaseOrders', id, poData);
      showToast(`PO ${newStatus === 'Issued' ? 'issued' : 'updated'} successfully`, 'success');
      if (newStatus === 'Issued') render(); // Re-render to disable form
    }
  }

  render();
}

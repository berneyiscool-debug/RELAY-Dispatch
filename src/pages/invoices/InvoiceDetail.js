// ============================================
// SIMPRO CLONE — INVOICE DETAIL / BUILDER
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showDrawer } from '../../components/Drawer.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { showPrintPreview } from '../../components/PrintPreview.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { calculateBillableMaterialPrice } from '../../utils/pricing.js';

export function renderInvoiceDetail(container, { id }) {
  const isNew = id === 'new';
  let invoice = isNew ? {
    number: `INV-${Date.now().toString().slice(-6)}`,
    status: 'Draft', 
    sections: [{ id: store.generateId(), name: 'Main Phase', lineItems: [] }],
    subtotal: 0, tax: 0, total: 0,
    issueDate: new Date().toISOString(), 
    dueDate: new Date(Date.now() + 30*86400000).toISOString(),
    invoiceType: 'Standard'
  } : store.getById('invoices', id);

  if (!invoice) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';
    return;
  }

  // Data migration for old invoices
  if (invoice.lineItems && !invoice.sections) {
    invoice.sections = [{ id: store.generateId(), name: 'Main Phase', lineItems: [...invoice.lineItems] }];
    delete invoice.lineItems;
  }

  if (!isNew) updateBreadcrumbDetail(invoice.number);
  
  const customers = store.getAll('customers');
  const stockItems = store.getAll('stock');
  const settings = store.getSettings();
  const sb = { 'Draft':'badge-neutral','Sent':'badge-info','Paid':'badge-success','Overdue':'badge-danger','Void':'badge-neutral' };

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: `
          ${isNew ? 'New Invoice' : invoice.number}
          ${invoice.invoiceType === 'CreditNote' ? '<span class="badge badge-danger">CREDIT NOTE</span>' : invoice.invoiceType && invoice.invoiceType !== 'Standard' ? `<span class="badge badge-primary">${invoice.invoiceType.toUpperCase()}</span>` : ''}
        `,
        icon: 'receipt_long',
        iconBgColor: 'var(--color-success-bg)',
        iconTextColor: 'var(--color-success)',
        metaHtml: `
          ${invoice.customerName ? `<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${invoice.customerName}</span>` : ''}
          ${invoice.jobNumber ? `<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${invoice.jobNumber}</span>` : ''}
          <span class="badge ${sb[invoice.status] || 'badge-neutral'}">${invoice.status}</span>
        `,
        actionsHtml: `
          ${!isNew ? `<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>` : ''}
          ${!isNew && invoice.status === 'Draft' ? `<button class="btn btn-primary" id="btn-send-invoice"><span class="material-icons-outlined">send</span> Send</button>` : ''}
          ${!isNew && (invoice.status === 'Sent' || invoice.status === 'Overdue') ? `<button class="btn btn-secondary" id="btn-send-reminder"><span class="material-icons-outlined">notifications</span> Reminder</button>` : ''}
          ${!isNew && (invoice.status === 'Sent' || invoice.status === 'Overdue') ? `<button class="btn btn-primary" id="btn-mark-paid"><span class="material-icons-outlined">check_circle</span> Mark Paid</button>` : ''}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                <a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import from Quote</a>
                ${!isNew ? `<a href="#" class="dropdown-item" id="btn-delete-invoice" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Invoice</a>` : ''}
             </div>
          </div>
        `
      })}

      <!-- Invoice Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Invoice Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="inv-customer">
                <option value="">Select customer...</option>
                ${customers.map(c => `<option value="${c.id}" ${invoice.customerId === c.id ? 'selected' : ''}>${c.company}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${settings.laborRates.map(r => `<option value="${r.id}" ${invoice.laborProfileId === r.id ? 'selected' : ''}>${r.name} ($${r.rate.toFixed(2)}/hr)</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${['Standard','Deposit','Progress','CreditNote'].map(t => `<option ${invoice.invoiceType === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input class="form-input" type="date" id="inv-issue" value="${invoice.issueDate ? invoice.issueDate.split('T')[0] : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" id="inv-due" value="${invoice.dueDate ? invoice.dueDate.split('T')[0] : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inv-status">
                ${['Draft','Sent','Paid','Overdue','Void'].map(s => `<option ${invoice.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${stockItems.map(s => `<option value="${s.name}"></option>`).join('')}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(invoice.sections || []).map((sec, sIdx) => renderSection(sec, sIdx)).join('')}
      </div>

      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>

      <!-- Totals & Margin Analysis -->
      <div style="display:flex; justify-content:flex-end; gap:var(--space-lg); margin-bottom:var(--space-lg); align-items:flex-start">
        <!-- Staff Margin Analysis -->
        <div class="card" style="width:300px; border:1px dashed var(--border-color); background:var(--bg-color)">
          <div class="card-header" style="padding:10px 16px; border-bottom:1px dashed var(--border-color)">
            <h5 style="margin:0; font-size:13px; color:var(--text-secondary)">Margin Analysis</h5>
          </div>
          <div class="card-body" style="padding:12px 16px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
              <span class="text-secondary">Actual Cost</span>
              <span>$${(invoice.totalInternalCost || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px; font-weight:600; color:${(invoice.subtotal - (invoice.totalInternalCost || 0)) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
              <span>Invoice Margin</span>
              <span>$${(invoice.subtotal - (invoice.totalInternalCost || 0)).toFixed(2)} (${invoice.subtotal > 0 ? Math.round(((invoice.subtotal - invoice.totalInternalCost) / invoice.subtotal) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

        <!-- Invoice Totals -->
        <div class="card" style="width:360px">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">Subtotal</span>
              <span id="inv-subtotal">$${(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">GST (10%)</span>
              <span id="inv-tax">$${(invoice.tax || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
              <span>Total</span>
              <span id="inv-total">$${(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-inv">Cancel</button>
        <button class="btn btn-primary" id="btn-save-inv"><span class="material-icons-outlined">save</span> Save Invoice</button>
      </div>
    `;

    bindEvents();
  }

  function renderSection(section, sIdx) {
    return `
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${sIdx}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${section.name || ''}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(section.subtotal || 0).toFixed(2)}</span>
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${sIdx}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${sIdx}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width:100px">Type</th>
                <th style="width:80px">Qty</th>
                <th style="width:100px">Rate</th>
                <th style="width:110px">Total</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody>
              ${(section.lineItems || []).map((item, i) => lineItemRow(item, sIdx, i)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function lineItemRow(item, sIdx, index) {
    return `
      <tr data-sidx="${sIdx}" data-index="${index}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${item.description || ''}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${item.type === 'labor' ? 'selected' : ''}>Labor</option>
          <option value="material" ${item.type === 'material' ? 'selected' : ''}>Material</option>
          <option value="other" ${item.type === 'other' ? 'selected' : ''}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${item.qty || 1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${item.rate || 0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(item.total || 0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${sIdx}" data-index="${index}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `;
  }

  function recalculate() {
    invoice.subtotal = 0;
    invoice.totalInternalCost = 0;
    let totalLaborAmount = 0;
    
    const settings = store.getSettings();
    const profile = settings.laborRates.find(r => r.id === invoice.laborProfileId);

    (invoice.sections || []).forEach(sec => {
      sec.subtotal = 0;
      (sec.lineItems || []).forEach(item => {
        item.total = (item.qty || 0) * (item.rate || 0);
        if (item.type === 'labor') totalLaborAmount += item.total;
        
        // Calculate internal cost
        if (!item.internalCost) {
           if (item.type === 'labor') item.internalCost = 45;
           else item.internalCost = item.rate * 0.7;
        }
        invoice.totalInternalCost += (item.qty || 0) * (item.internalCost || 0);
        
        sec.subtotal += item.total;
      });
      invoice.subtotal += sec.subtotal;
    });

    if (invoice.invoiceType === 'CreditNote') invoice.subtotal = -Math.abs(invoice.subtotal);
    else invoice.subtotal = Math.abs(invoice.subtotal);

    invoice.tax = invoice.subtotal * 0.1;
    invoice.total = invoice.subtotal + invoice.tax;

    render();
  }

  function bindEvents() {
    container.querySelector('#btn-preview-pdf')?.addEventListener('click', () => {
      showPrintPreview({ type: 'invoice', data: invoice });
    });

    const moreBtn = container.querySelector('.dropdown > .btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = moreBtn.nextElementSibling;
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', () => {
        const menu = container.querySelector('.dropdown-menu');
        if (menu) menu.style.display = 'none';
      });
    }

    container.querySelector('#inv-labor-profile')?.addEventListener('change', (e) => {
      invoice.laborProfileId = e.target.value;
      const rateObj = settings.laborRates.find(r => r.id === invoice.laborProfileId);
      if (rateObj) {
        invoice.sections.forEach(sec => {
          sec.lineItems.forEach(i => {
            if (i.type === 'labor') i.rate = rateObj.rate;
          });
        });
        recalculate();
      }
    });

    container.querySelector('#btn-add-section')?.addEventListener('click', () => {
      invoice.sections.push({ 
        id: store.generateId(), 
        name: 'New Phase', 
        lineItems: [] 
      });
      recalculate();
    });

    container.querySelectorAll('.section-name-input').forEach((input, sIdx) => {
      input.addEventListener('change', () => {
        invoice.sections[sIdx].name = input.value;
      });
    });

    container.querySelectorAll('.btn-add-line').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sidx);
        invoice.sections[sIdx].lineItems.push({ description: '', type: 'labor', qty: 1, rate: 0, total: 0 });
        render();
      });
    });

    container.querySelectorAll('.btn-remove-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sidx);
        if (confirm('Remove this entire phase?')) {
          invoice.sections.splice(sIdx, 1);
          recalculate();
        }
      });
    });

    container.querySelectorAll('.item-input').forEach(input => {
      input.addEventListener('change', () => {
        const tr = input.closest('tr');
        const sIdx = parseInt(tr.dataset.sidx);
        const idx = parseInt(tr.dataset.index);
        const field = input.dataset.field;
        let val = input.value;
        
        if (field === 'qty' || field === 'rate') val = parseFloat(val) || 0;
        invoice.sections[sIdx].lineItems[idx][field] = val;

        if (field === 'description') {
          const match = stockItems.find(s => s.name === val);
          if (match) {
            const isLabor = (match.category || '').toLowerCase().includes('labor');
            let appliedRate = 0;
            let internalCost = 0;

            if (isLabor) {
               appliedRate = match.unitPrice || 85; 
               internalCost = match.costPrice || 45;
            } else {
               const cost = match.costPrice || match.unitPrice || 0;
               internalCost = cost;
               appliedRate = calculateBillableMaterialPrice(cost, settings);
            }
            invoice.sections[sIdx].lineItems[idx].type = isLabor ? 'labor' : 'material';
            invoice.sections[sIdx].lineItems[idx].rate = appliedRate;
            invoice.sections[sIdx].lineItems[idx].internalCost = internalCost;
          }
        }
        recalculate();
      });
    });

    container.querySelectorAll('.btn-remove-line').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sidx);
        const idx = parseInt(btn.dataset.index);
        invoice.sections[sIdx].lineItems.splice(idx, 1);
        recalculate();
      });
    });

    container.querySelector('#btn-save-inv')?.addEventListener('click', () => {
      const custId = container.querySelector('#inv-customer').value;
      const cust = customers.find(c => c.id === custId);
      invoice.customerId = custId;
      invoice.customerName = cust?.company || '';
      invoice.status = container.querySelector('#inv-status').value;
      invoice.issueDate = container.querySelector('#inv-issue').value;
      invoice.dueDate = container.querySelector('#inv-due').value;
      invoice.invoiceType = container.querySelector('#inv-type').value;
      
      recalculate();

      if (isNew) {
        const saved = store.create('invoices', invoice);
        showToast('Invoice created', 'success');
        router.navigate(`/invoices/${saved.id}`);
      } else {
        store.update('invoices', id, invoice);
        showToast('Invoice saved', 'success');
        render();
      }
    });

    container.querySelector('#btn-send-invoice')?.addEventListener('click', () => {
      store.update('invoices', id, { status: 'Sent' });
      invoice.status = 'Sent';
      showToast('Invoice sent to customer', 'success');
      render();
    });

    container.querySelector('#btn-mark-paid')?.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `
        <div class="form-group">
          <label class="form-label">Date Paid</label>
          <input type="date" class="form-input" id="paid-date" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-select" id="paid-method">
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      `;
      showDrawer({
        title: 'Mark Invoice as Paid',
        content: content.outerHTML,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Confirm Payment', className: 'btn-primary', onClick: (close) => {
            const dOverlay = document.querySelector('.drawer-overlay');
            const paidDate = dOverlay.querySelector('#paid-date').value;
            const paymentMethod = dOverlay.querySelector('#paid-method').value;
            store.update('invoices', id, { status: 'Paid', paidDate, paymentMethod });
            invoice.status = 'Paid';
            invoice.paidDate = paidDate;
            invoice.paymentMethod = paymentMethod;
            showToast('Invoice marked as paid', 'success');
            render();
            close();
          }}
        ],
        width: 350
      });
    });

    container.querySelector('#btn-delete-invoice')?.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `<p>Delete invoice <strong>${escapeHTML(invoice.number)}</strong>?</p>`;
      showModal({
        title: 'Delete Invoice', content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('invoices', id); showToast('Invoice deleted', 'success'); close(); router.navigate('/invoices'); }},
        ],
      });
    });

    container.querySelector('#btn-cancel-inv')?.addEventListener('click', () => router.navigate('/invoices'));
  }

  render();
}

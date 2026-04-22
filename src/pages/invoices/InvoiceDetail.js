// ============================================
// SIMPRO CLONE — INVOICE DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { showPrintPreview } from '../../components/PrintPreview.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';

export function renderInvoiceDetail(container, { id }) {
  const isNew = id === 'new';
  let invoice = isNew ? {
    number: `INV-${Date.now().toString().slice(-6)}`,
    status: 'Draft', lineItems: [], subtotal: 0, tax: 0, total: 0,
    issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 30*86400000).toISOString(),
    invoiceType: 'Standard'
  } : store.getById('invoices', id);

  if (!invoice) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';
    return;
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
          ${!isNew ? `<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> Preview PDF</button>` : ''}
          ${!isNew && invoice.status === 'Draft' ? `<button class="btn btn-primary" id="btn-send-invoice"><span class="material-icons-outlined">send</span> Send</button>` : ''}
          ${!isNew && (invoice.status === 'Sent' || invoice.status === 'Overdue') ? `<button class="btn btn-secondary" id="btn-send-reminder"><span class="material-icons-outlined">notifications</span> Send Reminder</button>` : ''}
          ${!isNew && (invoice.status === 'Sent' || invoice.status === 'Overdue') ? `<button class="btn btn-primary" id="btn-mark-paid"><span class="material-icons-outlined">check_circle</span> Mark Paid</button>` : ''}
          ${!isNew ? `<button class="btn btn-danger btn-icon" id="btn-delete-invoice"><span class="material-icons-outlined">delete</span></button>` : ''}
        `
      })}

      <!-- Invoice form -->
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
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${['Standard','Deposit','Progress','CreditNote'].map(t => `<option ${invoice.invoiceType === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inv-status">
                ${['Draft','Sent','Paid','Overdue','Void'].map(s => `<option ${invoice.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input class="form-input" type="date" id="inv-issue" value="${invoice.issueDate ? invoice.issueDate.split('T')[0] : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" id="inv-due" value="${invoice.dueDate ? invoice.dueDate.split('T')[0] : ''}" />
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <datalist id="stock-items-list">
        ${stockItems.map(s => `<option value="${s.name}"></option>`).join('')}
      </datalist>

      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <h4>Line Items</h4>
          <button class="btn btn-sm btn-primary" id="btn-add-line"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table" id="line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width:80px">Type</th>
                <th style="width:70px">Qty</th>
                <th style="width:90px">Rate</th>
                <th style="width:100px">Total</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.lineItems || []).map((item, i) => lineItemRow(item, i)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totals -->
      <div class="card" style="max-width:360px;margin-left:auto;margin-bottom:var(--space-lg)">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-secondary">Subtotal</span><span id="inv-subtotal">$${(invoice.subtotal || 0).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-secondary">GST (10%)</span><span id="inv-tax">$${(invoice.tax || 0).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
            <span>Total</span><span id="inv-total">$${(invoice.total || 0).toFixed(2)}</span>
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

  function lineItemRow(item, index) {
    return `
      <tr data-index="${index}">
        <td><input class="form-input" list="stock-items-list" style="padding:4px 8px" value="${item.description || ''}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select" style="padding:4px 8px" data-field="type">
          <option value="labor" ${item.type === 'labor' ? 'selected' : ''}>Labor</option>
          <option value="material" ${item.type === 'material' ? 'selected' : ''}>Material</option>
          <option value="other" ${item.type === 'other' ? 'selected' : ''}>Other</option>
        </select></td>
        <td><input class="form-input" style="padding:4px 8px" type="number" value="${item.qty || 1}" data-field="qty" min="1" /></td>
        <td><input class="form-input" style="padding:4px 8px" type="number" value="${item.rate || 0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600">$${(item.total || 0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm" data-remove="${index}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `;
  }

  function recalc() {
    const items = invoice.lineItems || [];
    items.forEach(item => { item.total = (item.qty || 0) * (item.rate || 0); });
    let sub = items.reduce((s, i) => s + Math.abs(i.total || 0), 0);
    if (invoice.invoiceType === 'CreditNote') sub = -Math.abs(sub);
    else sub = Math.abs(sub);
    
    invoice.subtotal = sub;
    invoice.tax = sub * 0.1;
    invoice.total = sub + invoice.tax;
    const s = container.querySelector('#inv-subtotal');
    const t = container.querySelector('#inv-tax');
    const tot = container.querySelector('#inv-total');
    if (s) s.textContent = `$${invoice.subtotal.toFixed(2)}`;
    if (t) t.textContent = `$${invoice.tax.toFixed(2)}`;
    if (tot) tot.textContent = `$${invoice.total.toFixed(2)}`;
  }

  function bindEvents() {
    container.querySelector('#btn-preview-pdf')?.addEventListener('click', () => {
      showPrintPreview({ type: 'invoice', data: invoice });
    });

    container.querySelector('#btn-add-line')?.addEventListener('click', () => {
      if (!invoice.lineItems) invoice.lineItems = [];
      invoice.lineItems.push({ description: '', type: 'labor', qty: 1, rate: 0, total: 0 });
      render();
    });

    container.querySelectorAll('#line-items-table input, #line-items-table select').forEach(input => {
      input.addEventListener('input', () => {
        const tr = input.closest('tr');
        const idx = parseInt(tr.dataset.index);
        const field = input.dataset.field;
        let val = input.value;
        
        if (field === 'qty' || field === 'rate') val = parseFloat(val) || 0;
        
        invoice.lineItems[idx][field] = val;

        // Auto-fill logic
        if (field === 'description') {
          const match = stockItems.find(s => s.name === val);
          if (match) {
            const isLabor = match.category && match.category.toLowerCase().includes('labor');
            let appliedRate = match.unitPrice || 0;
            if (!isLabor) appliedRate = appliedRate * (1 + (settings.markupPercent || 0) / 100);
            
            invoice.lineItems[idx].type = isLabor ? 'labor' : 'material';
            invoice.lineItems[idx].rate = appliedRate;
            
            const typeEl = tr.querySelector('[data-field="type"]');
            const rateEl = tr.querySelector('[data-field="rate"]');
            if (typeEl) typeEl.value = invoice.lineItems[idx].type;
            if (rateEl) rateEl.value = appliedRate.toFixed(2);
          }
        }

        recalc();
        const totalCell = tr.querySelector('td:nth-child(5)');
        if (totalCell) totalCell.textContent = `$${(invoice.lineItems[idx].total || 0).toFixed(2)}`;
      });
    });

    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => { invoice.lineItems.splice(parseInt(btn.dataset.remove), 1); render(); });
    });

    container.querySelector('#inv-type')?.addEventListener('change', (e) => {
      invoice.invoiceType = e.target.value;
      recalc();
    });

    container.querySelector('#btn-cancel-inv')?.addEventListener('click', () => router.navigate('/invoices'));

    container.querySelector('#btn-save-inv')?.addEventListener('click', () => {
      const custId = container.querySelector('#inv-customer').value;
      const cust = customers.find(c => c.id === custId);
      invoice.customerId = custId;
      invoice.customerName = cust?.company || '';
      invoice.contactName = cust ? `${cust.firstName} ${cust.lastName}` : '';
      invoice.invoiceType = container.querySelector('#inv-type')?.value || 'Standard';
      invoice.status = container.querySelector('#inv-status').value;
      invoice.issueDate = container.querySelector('#inv-issue').value;
      invoice.dueDate = container.querySelector('#inv-due').value;
      recalc();

      if (isNew) { const saved = store.create('invoices', invoice); showToast('Invoice created', 'success'); router.navigate(`/invoices/${saved.id}`); }
      else { store.update('invoices', id, invoice); showToast('Invoice saved', 'success'); }
    });

    container.querySelector('#btn-send-invoice')?.addEventListener('click', () => {
      store.update('invoices', id, { status: 'Sent' });
      invoice.status = 'Sent';
      showToast('Invoice sent', 'success');
      render();
    });

    container.querySelector('#btn-send-reminder')?.addEventListener('click', () => {
      invoice.lastReminderDate = new Date().toISOString();
      store.update('invoices', id, { lastReminderDate: invoice.lastReminderDate });
      showToast('Payment reminder sent', 'success');
    });

    container.querySelector('#btn-mark-paid')?.addEventListener('click', () => {
      store.update('invoices', id, { status: 'Paid', paidDate: new Date().toISOString() });
      invoice.status = 'Paid';
      showToast('Invoice marked as paid', 'success');
      render();
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
  }

  render();
}

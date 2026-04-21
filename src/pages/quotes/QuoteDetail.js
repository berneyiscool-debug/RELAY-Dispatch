// ============================================
// SIMPRO CLONE — QUOTE DETAIL / BUILDER
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { showPrintPreview } from '../../components/PrintPreview.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';

export function renderQuoteDetail(container, { id, customerId }) {
  const isNew = id === 'new';
  let quote = isNew ? { 
    status: 'Draft', 
    version: 1,
    sections: [{ id: store.generateId(), name: 'Main Phase', lineItems: [] }], 
    subtotal: 0, tax: 0, total: 0, 
    number: `Q-${Date.now().toString().slice(-7)}`, 
    customerId: customerId || '' 
  } : store.getById('quotes', id);

  if (!quote) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Quote not found</h3></div>';
    return;
  }

  // Data migration for old quotes
  if (quote.lineItems && !quote.sections) {
    quote.sections = [{ id: store.generateId(), name: 'Main Phase', lineItems: [...quote.lineItems] }];
    delete quote.lineItems;
  }

  if (!isNew) updateBreadcrumbDetail(quote.number + (quote.version > 1 ? ` v${quote.version}` : ''));

  const customers = store.getAll('customers');
  const stockItems = store.getAll('stock');
  const settings = store.getSettings();
  const sb = { 'Draft': 'badge-neutral', 'Sent': 'badge-info', 'Accepted': 'badge-success', 'Declined': 'badge-danger', 'Archived': 'badge-neutral' };

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: `${isNew ? 'New Quote' : quote.number} ${quote.version > 1 ? `<span class="badge badge-neutral">v${quote.version}</span>` : ''}`,
        icon: 'request_quote',
        iconBgColor: 'var(--color-warning-bg)',
        iconTextColor: 'var(--color-warning)',
        metaHtml: `
          ${quote.customerName ? `<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${quote.customerName}</span>` : ''}
          <span class="badge ${sb[quote.status] || 'badge-neutral'}">${quote.status}</span>
        `,
        actionsHtml: `
          ${!isNew ? `<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>` : ''}
          ${!isNew && quote.status !== 'Archived' ? `<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>` : ''}
          ${!isNew && quote.status === 'Accepted' ? `<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>` : ''}
          ${!isNew && quote.status === 'Draft' ? `<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>` : ''}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                <a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>
                ${!isNew ? `<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>` : ''}
             </div>
          </div>
        `
      })}

      <!-- Quote Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Quote Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="quote-customer" ${quote.status === 'Archived' ? 'disabled' : ''}>
                <option value="">Select customer...</option>
                ${customers.map(c => `<option value="${c.id}" ${quote.customerId === c.id ? 'selected' : ''}>${c.company}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input class="form-input" id="quote-title" value="${quote.title || ''}" placeholder="Quote description..." ${quote.status === 'Archived' ? 'disabled' : ''} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="quote-status" ${quote.status === 'Archived' ? 'disabled' : ''}>
                ${['Draft','Sent','Accepted','Declined','Archived'].map(s => `<option ${quote.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${quote.status === 'Archived' ? 'disabled' : ''}>
                <option value="">-- Custom / Manual Rates --</option>
                ${settings.laborRates.map(r => `<option value="${r.id}" ${quote.laborProfileId === r.id ? 'selected' : ''}>${r.name} ($${r.rate.toFixed(2)}/hr)</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input class="form-input" type="date" id="quote-valid" value="${quote.validUntil ? quote.validUntil.split('T')[0] : ''}" ${quote.status === 'Archived' ? 'disabled' : ''} />
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${stockItems.map(s => `<option value="${s.name}"></option>`).join('')}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(quote.sections || []).map((sec, sIdx) => renderSection(sec, sIdx)).join('')}
      </div>
      
      ${quote.status !== 'Archived' ? `
      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>` : ''}

      <!-- Totals -->
      <div class="card" style="max-width:360px;margin-left:auto;margin-bottom:var(--space-lg)">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
            <span class="text-secondary">Subtotal</span>
            <span id="subtotal">$${(quote.subtotal || 0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
            <span class="text-secondary">GST (10%)</span>
            <span id="tax">$${(quote.tax || 0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
            <span>Total</span>
            <span id="total">$${(quote.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${quote.status !== 'Archived' ? `
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>` : ''}
    `;

    bindEvents();
  }

  function renderSection(section, sIdx) {
    const isArchived = quote.status === 'Archived';
    return `
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${sIdx}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${section.name || ''}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${isArchived ? 'disabled' : ''} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(section.subtotal || 0).toFixed(2)}</span>
            ${!isArchived ? `
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${sIdx}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${sIdx}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
            ` : ''}
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
              ${(section.lineItems || []).map((item, i) => lineItemRow(item, sIdx, i, isArchived)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function lineItemRow(item, sIdx, index, isArchived) {
    return `
      <tr data-sidx="${sIdx}" data-index="${index}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${item.description || ''}" data-field="description" placeholder="Type item name..." ${isArchived ? 'disabled' : ''}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${isArchived ? 'disabled' : ''}>
          <option value="labor" ${item.type === 'labor' ? 'selected' : ''}>Labor</option>
          <option value="material" ${item.type === 'material' ? 'selected' : ''}>Material</option>
          <option value="other" ${item.type === 'other' ? 'selected' : ''}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${item.qty || 1}" data-field="qty" min="1" ${isArchived ? 'disabled' : ''}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${item.rate || 0}" data-field="rate" step="0.01" ${isArchived ? 'disabled' : ''}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(item.total || 0).toFixed(2)}</td>
        <td>${!isArchived ? `<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${sIdx}" data-index="${index}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>` : ''}</td>
      </tr>
    `;
  }

  function recalculate() {
    quote.subtotal = 0;
    (quote.sections || []).forEach(sec => {
      sec.subtotal = 0;
      (sec.lineItems || []).forEach(item => {
        item.total = (item.qty || 0) * (item.rate || 0);
        sec.subtotal += item.total;
      });
      quote.subtotal += sec.subtotal;
    });
    quote.tax = quote.subtotal * 0.1;
    quote.total = quote.subtotal + quote.tax;

    render(); // Re-render to update phase subtotals and grand totals easily
  }

  function bindEvents() {
    container.querySelector('#btn-preview-pdf')?.addEventListener('click', () => {
      showPrintPreview({ type: 'quote', data: quote });
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

    container.querySelector('#btn-create-revision')?.addEventListener('click', () => {
      // Archive current quote
      store.update('quotes', id, { status: 'Archived' });
      // Create new draft revision
      const newQuote = JSON.parse(JSON.stringify(quote));
      delete newQuote.id;
      newQuote.version = (quote.version || 1) + 1;
      newQuote.status = 'Draft';
      newQuote.createdAt = new Date().toISOString();
      
      const saved = store.create('quotes', newQuote);
      showToast(`Revision v${newQuote.version} created`, 'success');
      router.navigate(`/quotes/${saved.id}`);
    });

    container.querySelector('#btn-save-template')?.addEventListener('click', (e) => {
      e.preventDefault();
      const templateData = {
        name: quote.title || 'Custom Template',
        sections: JSON.parse(JSON.stringify(quote.sections))
      };
      store.create('quoteTemplates', templateData);
      showToast('Saved to Quote Templates', 'success');
    });

    container.querySelectorAll('#quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile').forEach(input => {
      input.addEventListener('change', () => {
        const val = input.value;
        if (input.id === 'quote-customer') quote.customerId = val;
        else if (input.id === 'quote-title') quote.title = val;
        else if (input.id === 'quote-status') quote.status = val;
        else if (input.id === 'quote-valid') quote.validUntil = val;
        else if (input.id === 'quote-labor-profile') {
          quote.laborProfileId = val;
          const rateObj = settings.laborRates.find(r => r.id === val);
          if (rateObj && quote.sections) {
            quote.sections.forEach(sec => {
              sec.lineItems.forEach(i => {
                if (i.type === 'labor') i.rate = rateObj.rate;
              });
            });
            recalculate();
          }
        }
      });
    });

    container.querySelector('#btn-add-section')?.addEventListener('click', () => {
      quote.sections.push({ id: store.generateId(), name: 'New Phase', lineItems: [] });
      render();
    });

    container.querySelectorAll('.section-name-input').forEach((input, sIdx) => {
      input.addEventListener('change', () => {
        quote.sections[sIdx].name = input.value;
      });
    });

    container.querySelectorAll('.btn-add-line').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sIdx = parseInt(btn.dataset.sidx);
        quote.sections[sIdx].lineItems.push({ description: '', type: 'labor', qty: 1, rate: 0, total: 0 });
        render();
      });
    });

    container.querySelectorAll('.btn-remove-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sidx);
        if (confirm('Remove this entire phase?')) {
          quote.sections.splice(sIdx, 1);
          recalculate();
        }
      });
    });

    container.querySelectorAll('.item-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const tr = input.closest('tr');
        const sIdx = parseInt(tr.dataset.sidx);
        const idx = parseInt(tr.dataset.index);
        const field = input.dataset.field;
        let val = input.value;
        
        if (field === 'qty' || field === 'rate') val = parseFloat(val) || 0;
        quote.sections[sIdx].lineItems[idx][field] = val;

        // Auto-fill logic
        if (field === 'description') {
          const match = stockItems.find(s => s.name === val);
          if (match) {
            const isLabor = match.category && match.category.toLowerCase().includes('labor');
            let appliedRate = match.unitPrice || 0;
            if (!isLabor) {
               appliedRate = appliedRate * (1 + (settings.markupPercent || 0) / 100);
            }
            quote.sections[sIdx].lineItems[idx].type = isLabor ? 'labor' : 'material';
            quote.sections[sIdx].lineItems[idx].rate = appliedRate;
          }
        }
        recalculate();
      });
    });

    container.querySelectorAll('.btn-remove-line').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sidx);
        const idx = parseInt(tr.dataset.index);
        quote.sections[sIdx].lineItems.splice(idx, 1);
        recalculate();
      });
    });

    container.querySelector('#btn-cancel-quote')?.addEventListener('click', () => router.navigate('/quotes'));

    container.querySelector('#btn-save-quote')?.addEventListener('click', () => {
      const custId = container.querySelector('#quote-customer').value;
      const cust = customers.find(c => c.id === custId);
      quote.customerId = custId;
      quote.customerName = cust?.company || '';
      quote.contactName = cust ? `${cust.firstName} ${cust.lastName}` : '';
      quote.title = container.querySelector('#quote-title').value;
      quote.status = container.querySelector('#quote-status').value;
      quote.validUntil = container.querySelector('#quote-valid').value;
      
      recalculate();

      if (isNew) {
        const saved = store.create('quotes', quote);
        showToast('Quote created', 'success');
        router.navigate(`/quotes/${saved.id}`);
      } else {
        store.update('quotes', id, quote);
        showToast('Quote saved', 'success');
        render();
      }
    });

    container.querySelector('#btn-convert-job')?.addEventListener('click', () => {
      const techs = store.getAll('technicians');
      const tech = techs[Math.floor(Math.random() * techs.length)];
      
      // Calculate costs from all sections
      let laborCost = 0;
      let materialCost = 0;
      (quote.sections || []).forEach(sec => {
        (sec.lineItems || []).forEach(i => {
          if (i.type === 'labor') laborCost += i.total;
          if (i.type === 'material') materialCost += i.total;
        });
      });

      // Map quote sections directly to job phases
      const jobPhases = quote.sections.map(sec => ({
        id: store.generateId(),
        name: sec.name,
        status: 'Not Started',
        progress: 0,
        startDate: new Date().toISOString(),
        technicians: [] // To be assigned later
      }));

      const newJob = store.create('jobs', {
        number: `J-${Date.now().toString().slice(-6)}`,
        customerId: quote.customerId,
        customerName: quote.customerName,
        contactName: quote.contactName,
        title: quote.title,
        type: 'Project',
        status: 'Pending',
        priority: 'Medium',
        technicianId: tech?.id,
        technicianName: tech?.name,
        quoteId: id,
        phases: jobPhases,
        laborCost: laborCost,
        materialCost: materialCost,
      });
      showToast('Quote converted to project', 'success');
      router.navigate(`/jobs/${newJob.id}`);
    });

    container.querySelector('#btn-send-quote')?.addEventListener('click', () => {
      quote.emailStatus = 'Sent';
      if (quote.status === 'Draft') quote.status = 'Sent';
      store.update('quotes', id, { emailStatus: 'Sent', status: quote.status });

      import('../../components/Notifications.js').then(({ showToast, addSystemNotification }) => {
        showToast('Email sent to customer', 'success');
        render();

        // Simulated email tracking pixel
        setTimeout(() => {
          const currentQuote = store.getById('quotes', id);
          if (currentQuote && currentQuote.emailStatus === 'Sent') {
            currentQuote.emailStatus = 'Opened/Viewed';
            store.update('quotes', id, { emailStatus: 'Opened/Viewed' });
            
            addSystemNotification(
              'Quote Opened',
              `Quote ${currentQuote.number} was opened by ${currentQuote.customerName || 'the customer'}.`,
              `/quotes/${id}`
            );

            // If we are still viewing this quote, update the UI
            if (window.location.hash.includes(`/quotes/${id}`)) {
              quote.emailStatus = 'Opened/Viewed';
              render();
            }
          }
        }, 15000);
      });
    });

    container.querySelector('#btn-delete-quote')?.addEventListener('click', () => {
      showModal({
        title: 'Delete Quote', content: `<p>Delete quote <strong>${quote.number}</strong>?</p>`,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('quotes', id); showToast('Quote deleted', 'success'); close(); router.navigate('/quotes'); }},
        ],
      });
    });
  }

  render();
}

// ============================================
// SIMPRO CLONE — QUOTE DETAIL / BUILDER
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { showPrintPreview } from '../../components/PrintPreview.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { calculateBillableMaterialPrice } from '../../utils/pricing.js';
import { hasPermission } from '../../utils/permissions.js';

export function renderQuoteDetail(container, { id, customerId, type }) {
  const isTemplate = type === 'template';
  const collection = isTemplate ? 'quoteTemplates' : 'quotes';
  const isNew = id === 'new';
  
  let quote;
  if (isNew) {
    if (isTemplate) {
      quote = {
        name: 'New Quote Template',
        description: '',
        sections: [{ id: store.generateId(), name: 'Main Phase', lineItems: [] }],
        subtotal: 0, tax: 0, total: 0
      };
    } else {
      quote = { 
        status: 'Draft', 
        version: 1,
        sections: [{ id: store.generateId(), name: 'Main Phase', lineItems: [] }], 
        subtotal: 0, tax: 0, total: 0, 
        number: `Q-${Date.now().toString().slice(-7)}`, 
        customerId: customerId || '' 
      };
    }
  } else {
    quote = store.getById(collection, id);
  }

  if (!quote) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>${isTemplate ? 'Template' : 'Quote'} not found</h3></div>`;
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
  const sb = { 'Draft': 'badge-neutral', 'Finalised': 'badge-primary', 'Sent': 'badge-info', 'Accepted': 'badge-success', 'Declined': 'badge-danger', 'Archived': 'badge-neutral' };

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: isTemplate ? (isNew ? 'New Quote Template' : escapeHTML(quote.name)) : (`${isNew ? 'New Quote' : quote.number} ${quote.version > 1 ? `<span class="badge badge-neutral">v${quote.version}</span>` : ''}`),
        icon: 'request_quote',
        iconBgColor: 'var(--color-warning-bg)',
        iconTextColor: 'var(--color-warning)',
        metaHtml: isTemplate ? '' : `
          ${quote.customerName ? `<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${quote.customerName}</span>` : ''}
          <span class="badge ${sb[quote.status] || 'badge-neutral'}">${quote.status}</span>
        `,
        actionsHtml: isTemplate ? `
          ${!isNew ? `<button class="btn btn-secondary" id="btn-delete-template" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span> Delete</button>` : ''}
        ` : `
          ${!isNew ? `<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>` : ''}
          ${!isNew && quote.status !== 'Archived' && hasPermission('Quotes', 'edit') ? `<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>` : ''}
          ${!isNew && quote.status === 'Accepted' && hasPermission('Quotes', 'convert') ? `<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>` : ''}
          ${!isNew && quote.status === 'Draft' && hasPermission('Quotes', 'edit') ? `<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>` : ''}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                ${hasPermission('Quotes', 'edit') ? `<a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>` : ''}
                ${hasPermission('Quotes', 'edit') ? `<a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>` : ''}
                ${!isNew && hasPermission('Quotes', 'delete') ? `<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>` : ''}
             </div>
          </div>
        `
      })}

      ${isTemplate ? `
      <!-- Template Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Template Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Template Name *</label>
              <input class="form-input" id="quote-name" value="${escapeHTML(quote.name || '')}" placeholder="Template Name..." />
            </div>
            <div class="form-group" style="flex:2">
              <label class="form-label">Description</label>
              <input class="form-input" id="quote-desc" value="${escapeHTML(quote.description || '')}" placeholder="Template Description..." />
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${settings.laborRates.map(r => `<option value="${r.id}" ${quote.laborProfileId === r.id ? 'selected' : ''}>${r.name} ($${r.rate.toFixed(2)}/hr)</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
      ` : `
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
                ${['Draft','Finalised','Sent','Accepted','Declined','Archived'].map(s => `<option ${quote.status === s ? 'selected' : ''}>${s}</option>`).join('')}
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
      `}

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

      <!-- Totals & Estimation & Client Agreement -->
      <div style="display:flex; justify-content:flex-end; gap:var(--space-lg); margin-bottom:var(--space-lg); align-items:stretch; flex-wrap:wrap">
        <!-- Internal Estimation (Only for internal use) -->
        ${quote.status !== 'Archived' && !isTemplate ? `
        <div class="card" style="width:280px; margin:0; border:1px dashed var(--border-color); background:var(--bg-color); display:flex; flex-direction:column">
          <div class="card-header" style="padding:10px 16px; border-bottom:1px dashed var(--border-color)">
            <h5 style="margin:0; font-size:13px; color:var(--text-secondary)">Internal Estimation</h5>
          </div>
          <div class="card-body" style="padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
              <span class="text-secondary">Est. Cost</span>
              <span>$${(quote.totalInternalCost || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px; font-weight:600; color:${(quote.subtotal - (quote.totalInternalCost || 0)) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
              <span>Est. Margin</span>
              <span>$${(quote.subtotal - (quote.totalInternalCost || 0)).toFixed(2)} (${quote.subtotal > 0 ? Math.round(((quote.subtotal - quote.totalInternalCost) / quote.subtotal) * 100) : 0}%)</span>
            </div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-top:8px">
              * Based on stock cost and internal labor rates.
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Client Agreement & Signature Panel -->
        ${!isTemplate ? `
        <div class="card" style="width:340px; margin:0; display:flex; flex-direction:column; border:1px solid ${quote.status === 'Accepted' ? 'var(--color-success)' : quote.status === 'Declined' ? 'var(--color-danger)' : 'var(--border-color)'}">
          <div class="card-header" style="padding:10px 16px; background:${quote.status === 'Accepted' ? 'rgba(16,185,129,0.05)' : quote.status === 'Declined' ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.02)'}">
            <h5 style="margin:0; font-size:13px; color:${quote.status === 'Accepted' ? 'var(--color-success-dark)' : quote.status === 'Declined' ? 'var(--color-danger)' : 'var(--text-secondary)'}">Client Agreement</h5>
          </div>
          <div class="card-body" style="padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center; gap:8px">
            ${quote.status === 'Accepted' ? `
              <div style="display:flex; align-items:center; gap:8px; color:var(--color-success); font-weight:700; font-size:14px">
                <span class="material-icons-outlined">check_circle</span>
                <span>Accepted & Signed</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary)">
                <div><strong>Signed By:</strong> ${escapeHTML(quote.signedByName || 'Client')}</div>
                <div style="margin-top:2px"><strong>Signed At:</strong> ${quote.signedAt ? new Date(quote.signedAt).toLocaleString() : '—'}</div>
              </div>
              <div style="border:1px solid var(--border-color); background:var(--bg-color); height:60px; border-radius:4px; display:flex; align-items:center; justify-content:center; margin-top:4px">
                <span style="font-family:'Brush Script MT', cursive; font-size:26px; color:#1B6DE0; font-style:italic; font-weight:500">${escapeHTML(quote.signatureData || 'Client Signature')}</span>
              </div>
            ` : quote.status === 'Declined' ? `
              <div style="display:flex; align-items:center; gap:8px; color:var(--color-danger); font-weight:700; font-size:14px">
                <span class="material-icons-outlined">cancel</span>
                <span>Quote Declined by Client</span>
              </div>
              <div style="font-size:12px; color:var(--text-tertiary)">
                This proposal has been rejected by the customer. Create a revision to draft adjustments.
              </div>
            ` : `
              <div style="font-size:13px; color:var(--text-secondary); line-height:1.4">
                This proposal is awaiting client review. You can simulate direct digital signature and job conversion below.
              </div>
              <div style="display:flex; gap:8px; margin-top:6px">
                <button class="btn btn-sm btn-success" id="btn-sign-approve-modal" style="flex:2; padding:6px 8px; font-size:12px">
                  <span class="material-icons-outlined" style="font-size:14px; vertical-align:middle; margin-right:2px">check_circle</span> Sign & Approve
                </button>
                <button class="btn btn-sm btn-secondary" id="btn-decline-quote" style="flex:1; padding:6px 8px; font-size:12px; color:var(--color-danger); border-color:rgba(239,68,68,0.2)">
                  Decline
                </button>
              </div>
            `}
          </div>
        </div>
        ` : ''}

        <!-- Client Totals -->
        <div class="card" style="width:340px; margin:0">
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
      </div>

      ${isTemplate ? `
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Template</button>
      </div>
      ` : (quote.status !== 'Archived' && (isNew ? hasPermission('Quotes', 'create') : hasPermission('Quotes', 'edit')) ? `
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>` : `
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Back</button>
      </div>`)}
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
    quote.totalInternalCost = 0;
    let totalLaborAmount = 0;
    
    const settings = store.getSettings();
    const profile = settings.laborRates.find(r => r.id === quote.laborProfileId);

    (quote.sections || []).forEach(sec => {
      sec.subtotal = 0;
      (sec.lineItems || []).forEach(item => {
        item.total = (item.qty || 0) * (item.rate || 0);
        if (item.type === 'labor') totalLaborAmount += item.total;
        
        // Calculate internal cost
        if (!item.internalCost) {
           // Fallback defaults if no cost stored
           if (item.type === 'labor') item.internalCost = 45; // Default internal labor cost
           else item.internalCost = item.rate * 0.7; // Fallback 30% margin for materials
        }
        quote.totalInternalCost += (item.qty || 0) * (item.internalCost || 0);
        
        sec.subtotal += item.total;
      });
      quote.subtotal += sec.subtotal;
    });

    quote.tax = quote.subtotal * 0.1;
    quote.total = quote.subtotal + quote.tax;

    render();
  }

  function convertQuoteToJob() {
    const techs = store.getAll('technicians') || [];
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

    // Map quote sections directly to job tasks
    const jobTasks = quote.sections.map(sec => ({
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
      tasks: jobTasks,
      phases: jobTasks,
      laborCost: laborCost,
      materialCost: materialCost,
      estimatedLaborCost: laborCost,
      estimatedMaterialCost: materialCost,
    });

    // Add activity log for live job conversion
    const activity = store.getAll('activity') || [];
    activity.push({
      id: Date.now() + 1,
      jobId: newJob.id,
      type: 'job_converted_from_quote',
      text: `Live job ${newJob.number} created from accepted Quote ${quote.number}.`,
      user: 'System Automation',
      timestamp: new Date().toISOString()
    });
    store.save('activity', activity);

    import('../../components/Notifications.js').then(({ addSystemNotification }) => {
      addSystemNotification(
        'New Job Assigned',
        `You have been assigned to Live Job ${newJob.number} (${newJob.title}).`,
        `/jobs/${newJob.id}`
      );
    });

    showToast(`Converted successfully! Live Job ${newJob.number} is now active.`, 'success');
    router.navigate(`/jobs/${newJob.id}`);
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
      const content = document.createElement('div');
      content.innerHTML = `
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${quote.title || 'Custom Quote Template'}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `;

      showModal({
        title: 'Save Quote as Template',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Save Template', className: 'btn-primary', onClick: (close) => {
            const name = content.querySelector('#tmpl-name').value;
            const description = content.querySelector('#tmpl-desc').value;

            if (!name) {
              showToast('Template name is required', 'error');
              return;
            }

            const templateData = {
              name,
              description,
              sections: JSON.parse(JSON.stringify(quote.sections)),
              createdAt: new Date().toISOString()
            };
            store.create('quoteTemplates', templateData);
            showToast('Saved to Quote Templates', 'success');
            close();
          }}
        ]
      });
    });

    container.querySelector('#btn-import-template')?.addEventListener('click', (e) => {
      e.preventDefault();
      const templates = store.getAll('quoteTemplates');
      
      const content = document.createElement('div');
      content.innerHTML = `
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${templates.length ? templates.map(t => `
            <div class="import-item" data-id="${t.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${escapeHTML(t.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${t.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${escapeHTML(t.description || 'No description.')}</div>
            </div>
          `).join('') : '<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `;

      showModal({
        title: 'Import Quote Template',
        content,
        actions: [{ label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() }]
      });

      content.querySelectorAll('.import-item').forEach(item => {
        item.addEventListener('click', () => {
          const t = templates.find(x => x.id === item.dataset.id);
          if (t && confirm(`Replace current quote sections with "${t.name}"?`)) {
            quote.sections = JSON.parse(JSON.stringify(t.sections));
            // Regenerate IDs to avoid conflicts
            quote.sections.forEach(s => {
              s.id = store.generateId();
              s.lineItems.forEach(li => li.id = store.generateId());
            });
            recalculate();
            document.querySelector('.modal-overlay')?.remove();
          }
        });
      });
    });

    container.querySelectorAll('#quote-name, #quote-desc, #quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile').forEach(input => {
      input.addEventListener('change', () => {
        const val = input.value;
        if (input.id === 'quote-name') quote.name = val;
        else if (input.id === 'quote-desc') quote.description = val;
        else if (input.id === 'quote-customer') quote.customerId = val;
        else if (input.id === 'quote-title') quote.title = val;
        else if (input.id === 'quote-status') quote.status = val;
        else if (input.id === 'quote-valid') quote.validUntil = val;
        else if (input.id === 'quote-labor-profile') {
          quote.laborProfileId = val;
          const rateObj = settings.laborRates.find(r => r.id === val);
          if (rateObj) {
            if (quote.sections) {
              quote.sections.forEach(sec => {
                sec.lineItems.forEach(i => {
                  if (i.type === 'labor') i.rate = rateObj.rate;
                });
              });
            }
            
            // Auto-add Call-out Fee line item if applicable
            if (rateObj.minCallOutFee > 0) {
              // Add to first section if it doesn't already have one
              const firstSec = quote.sections[0];
              if (firstSec) {
                const hasFee = firstSec.lineItems.some(li => li.description.includes('Call-out Fee'));
                if (!hasFee) {
                  firstSec.lineItems.unshift({
                    description: 'Call-out Fee',
                    type: 'other',
                    qty: 1,
                    rate: rateObj.minCallOutFee,
                    total: rateObj.minCallOutFee
                  });
                }
              }
            }
            recalculate();
          }
        }
      });
    });

    container.querySelector('#btn-add-section')?.addEventListener('click', () => {
      const laborRate = settings.laborRates.find(r => r.id === quote.laborProfileId) || settings.laborRates.find(r => r.isDefault);
      quote.sections.push({ 
        id: store.generateId(), 
        name: 'New Phase', 
        lineItems: [
          { description: 'Labour', type: 'labor', qty: 1, rate: laborRate ? laborRate.rate : 85, total: laborRate ? laborRate.rate : 85 }
        ] 
      });
      recalculate();
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
            quote.sections[sIdx].lineItems[idx].type = isLabor ? 'labor' : 'material';
            quote.sections[sIdx].lineItems[idx].rate = appliedRate;
            quote.sections[sIdx].lineItems[idx].internalCost = internalCost;
          }
        }
        recalculate();
      });
    });

    container.querySelectorAll('.btn-remove-line').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.sidx);
        const idx = parseInt(btn.dataset.index);
        quote.sections[sIdx].lineItems.splice(idx, 1);
        recalculate();
      });
    });

    container.querySelector('#btn-cancel-quote')?.addEventListener('click', () => {
      if (isTemplate) router.navigate('/settings?tab=quotes');
      else router.navigate('/quotes');
    });

    container.querySelector('#btn-save-quote')?.addEventListener('click', () => {
      if (isTemplate) {
        quote.name = container.querySelector('#quote-name').value;
        quote.description = container.querySelector('#quote-desc').value;
      } else {
        const custId = container.querySelector('#quote-customer').value;
        const cust = customers.find(c => c.id === custId);
        quote.customerId = custId;
        quote.customerName = cust?.company || '';
        quote.contactName = cust ? `${cust.firstName} ${cust.lastName}` : '';
        quote.title = container.querySelector('#quote-title').value;
        quote.status = container.querySelector('#quote-status').value;
        quote.validUntil = container.querySelector('#quote-valid').value;
      }
      
      recalculate();

      if (isTemplate) {
        if (isNew) {
          store.create('quoteTemplates', quote);
          showToast('Template created', 'success');
          router.navigate('/settings?tab=quotes');
        } else {
          store.update('quoteTemplates', id, quote);
          showToast('Template saved', 'success');
          render();
        }
      } else {
        if (isNew) {
          const saved = store.create('quotes', quote);
          showToast('Quote created', 'success');
          router.navigate(`/quotes/${saved.id}`);
        } else {
          store.update('quotes', id, quote);
          showToast('Quote saved', 'success');
          render();
        }
      }
    });

    container.querySelector('#btn-convert-job')?.addEventListener('click', () => {
      (quote.sections || []).forEach(sec => {
        (sec.lineItems || []).forEach(i => {
          if (i.type === 'labor') laborCost += i.total;
          if (i.type === 'material') materialCost += i.total;
        });
      });

      // Map quote sections directly to job tasks
      const jobTasks = quote.sections.map(sec => ({
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
        tasks: jobTasks,
        phases: jobTasks,
        laborCost: laborCost,
        materialCost: materialCost,
        estimatedLaborCost: laborCost,
        estimatedMaterialCost: materialCost,
      });
      import('../../components/Notifications.js').then(({ addSystemNotification }) => {
        addSystemNotification(
          'New Job Assigned',
          `You have been assigned to Live Job ${newJob.number} (${newJob.title}).`,
          `/jobs/${newJob.id}`
        );
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

    container.querySelector('#btn-sign-approve-modal')?.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:16px">
          <div class="form-group">
            <label class="form-label">Client Name <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="sig-name" placeholder="Type your full name..." required />
          </div>
          <div style="border:1px solid var(--border-color); background:var(--bg-color); height:100px; border-radius:6px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden">
            <div style="position:absolute; top:8px; left:12px; font-size:10px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Handwritten Signature Preview</div>
            <span id="sig-preview" style="font-family:'Brush Script MT', cursive; font-size:36px; color:#1B6DE0; font-style:italic; font-weight:500; transition:all 0.15s">Client Signature</span>
          </div>
          <label style="display:flex; align-items:flex-start; gap:8px; font-size:13px; line-height:1.4; cursor:pointer; margin:0">
            <input type="checkbox" id="sig-consent" style="width:16px; height:16px; margin-top:2px; cursor:pointer" />
            <span style="color:var(--text-secondary)">I hereby accept this estimation and authorize the project to go live under the standard service terms.</span>
          </label>
        </div>
      `;

      showModal({
        title: 'Sign & Approve Quote',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Sign & Authorize Project', className: 'btn-success', onClick: (close) => {
            const name = content.querySelector('#sig-name').value.trim();
            const consent = content.querySelector('#sig-consent').checked;

            if (!name) {
              showToast('Please type your name to sign.', 'error');
              return;
            }
            if (!consent) {
              showToast('Please check the consent box to authorize.', 'error');
              return;
            }

            quote.status = 'Accepted';
            quote.signedByName = name;
            quote.signedAt = new Date().toISOString();
            quote.signatureData = name;
            store.update('quotes', id, {
              status: 'Accepted',
              signedByName: name,
              signedAt: quote.signedAt,
              signatureData: name
            });

            // Create a notification for the accepted quote so a user can convert it to a job later
            const notificationTitle = `Quote ${quote.number} Accepted`;
            const notificationDesc = `Client ${name} has signed and accepted Quote ${quote.number} ("${quote.title || 'Untitled'}"). Ready for conversion to job.`;
            
            store.create('notifications', {
              title: notificationTitle,
              description: notificationDesc,
              type: 'Quote Accepted',
              priority: 'High',
              status: 'Pending',
              quoteId: id,
              createdAt: new Date().toISOString(),
              createdBy: name
            });

            showToast('Quote signed and accepted! Notification created.', 'success');
            close();
            render();
          }}
        ]
      });

      const input = content.querySelector('#sig-name');
      const preview = content.querySelector('#sig-preview');
      input.addEventListener('input', () => {
        preview.textContent = input.value.trim() || 'Client Signature';
      });
    });

    container.querySelector('#btn-decline-quote')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to decline this quote?')) {
        quote.status = 'Declined';
        store.update('quotes', id, { status: 'Declined' });
        showToast('Quote marked as declined', 'info');
        render();
      }
    });

    container.querySelector('#btn-delete-quote')?.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `<p>Delete quote <strong>${escapeHTML(quote.number)}</strong>?</p>`;
      showModal({
        title: 'Delete Quote', content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('quotes', id); showToast('Quote deleted', 'success'); close(); router.navigate('/quotes'); }},
        ],
      });
    });

    container.querySelector('#btn-delete-template')?.addEventListener('click', () => {
      if (confirm(`Delete template "${escapeHTML(quote.name)}"?`)) {
        store.delete('quoteTemplates', id);
        showToast('Template deleted', 'success');
        router.navigate('/settings?tab=quotes');
      }
    });
  }

  render();
}

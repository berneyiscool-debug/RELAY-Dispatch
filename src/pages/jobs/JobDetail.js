// ============================================
// FIELDFORGE — JOB DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';
import { showTimesheetEditModal } from '../../utils/timesheetModals.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { escapeHTML } from '../../utils/security.js';
import { calculateTotalBillableMaterials, calculateBillableMaterialPrice } from '../../utils/pricing.js';
import { hasPermission } from '../../utils/permissions.js';

export function renderJobDetail(container, { id }) {
  const job = store.getById('jobs', id);
  if (!job) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';
    return;
  }

  updateBreadcrumbDetail(job.number);

  const sb = { 'Pending': 'badge-warning', 'Scheduled': 'badge-info', 'In Progress': 'badge-primary', 'On Hold': 'badge-neutral', 'Completed': 'badge-success', 'Invoiced': 'badge-primary' };
  const pb = { 'Low': 'badge-neutral', 'Medium': 'badge-warning', 'High': 'badge-danger', 'Urgent': 'badge-danger' };
  let activeTab = 'overview';
  let taskExpandedPath = [0];
  let taskViewPath = [];
  let isInfoPanelEditing = false;
  let isRecordingValues = false;
  let cachedStockOptionsHtml = null;
  let stagedFiles = [];

  function createDraftInvoice(type, sections, subtotal) {
    let originalQuoteNumber = '';
    let originalQuoteId = '';
    if (job.quoteId) {
      const quote = store.getById('quotes', job.quoteId);
      if (quote) {
        originalQuoteNumber = quote.number;
        originalQuoteId = quote.id;
      }
    }

    const inv = store.create('invoices', {
      number: `INV-${Date.now().toString().slice(-6)}`,
      invoiceType: type,
      jobId: id, jobNumber: job.number,
      customerId: job.customerId, customerName: job.customerName, contactName: job.contactName,
      status: 'Draft',
      sections: sections,
      originalQuoteId,
      originalQuoteNumber,
      originalSubtotal: subtotal,
      subtotal: subtotal, tax: subtotal * 0.1, total: subtotal * 1.1,
      issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    store.update('jobs', id, { status: 'Invoiced' });
    showToast(`${type} Invoice created`, 'success');
    router.navigate(`/invoices/${inv.id}`);
  }

  function getJobInvoiceData() {
    let sections = [];
    let subtotal = 0;

    // 1. Try to pull from Quote Sections first
    if (job.quoteId) {
      const quote = store.getById('quotes', job.quoteId);
      if (quote && quote.sections && quote.sections.length > 0) {
        sections = JSON.parse(JSON.stringify(quote.sections));
        subtotal = quote.subtotal || 0;
      } else if (quote && quote.lineItems) {
        // Legacy quote fallback
        sections = [{ id: store.generateId(), name: 'Main Phase', lineItems: JSON.parse(JSON.stringify(quote.lineItems)) }];
        subtotal = quote.subtotal || 0;
      }
    }

    // 2. If no quote or no items, use Job Tasks
    if (sections.length === 0) {
      const tasksSource = job.tasks || job.phases || [];
      if (tasksSource.length > 0) {
        sections = tasksSource.map(p => ({
          id: store.generateId(),
          name: p.name,
          lineItems: [
            { description: `${p.name} - Labor & Materials`, type: 'other', qty: 1, rate: 0, total: 0 }
          ],
          subtotal: 0
        }));
        // Add a catch-all for existing costs if no quote
        const lCost = job.laborCost || 0;
        const mCost = job.materialCost || 0;
        if (lCost > 0 || mCost > 0) {
          sections[0].lineItems.push({ description: 'Estimated Job Labor', type: 'labor', qty: 1, rate: lCost, total: lCost });
          sections[0].lineItems.push({ description: 'Estimated Job Materials', type: 'material', qty: 1, rate: mCost, total: mCost });
        }
      } else {
        // Absolute fallback
        const lCost = job.laborCost || 0;
        const mCost = job.materialCost || 0;
        sections = [{
          id: store.generateId(),
          name: 'General Items',
          lineItems: [
            { description: `${job.title} - Labor`, type: 'labor', qty: 1, rate: lCost, total: lCost },
            { description: `${job.title} - Materials`, type: 'material', qty: 1, rate: mCost, total: mCost },
          ]
        }];
      }
      // Calculate subtotal for fallback cases
      subtotal = sections.reduce((sum, s) => sum + (s.lineItems.reduce((ls, li) => ls + (li.total || 0), 0)), 0);
    }

    return { sections, subtotal };
  }

  function getStockOptionsHtml() {
    if (!cachedStockOptionsHtml) {
      const stock = store.getAll('stock');
      const options = [];
      stock.forEach(s => {
        if (s.locations && s.locations.length > 0) {
          s.locations.forEach(loc => {
            if (loc.quantity > 0) {
              options.push(`<option value="${s.id}::${escapeHTML(loc.location)}">${escapeHTML(s.name)} [${escapeHTML(loc.location)}] (Qty: ${loc.quantity}) - $${(s.costPrice || s.unitPrice || 0).toFixed(2)}</option>`);
            }
          });
        } else if (s.quantity > 0) {
          options.push(`<option value="${s.id}::${escapeHTML(s.location || 'Main Warehouse')}">${escapeHTML(s.name)} [${escapeHTML(s.location || 'Main Warehouse')}] (Qty: ${s.quantity}) - $${(s.costPrice || s.unitPrice || 0).toFixed(2)}</option>`);
        }
      });
      cachedStockOptionsHtml = options.join('');
    }
    return cachedStockOptionsHtml;
  }

  function render() {
    const totalCost = (job.laborCost || 0) + (job.materialCost || 0);
    const invoicesList = store.getAll('invoices').filter(i => i.jobId === job.id);
    const hasInvoice = invoicesList.length > 0;

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${escapeHTML(job.number)} — ${escapeHTML(job.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${escapeHTML(job.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(job.technicianName || 'Unassigned')}</span>
              <span class="badge ${sb[job.status] || 'badge-neutral'}">${escapeHTML(job.status)}</span>
              <span class="badge ${pb[job.priority] || 'badge-neutral'}">${escapeHTML(job.priority)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          ${job.status === 'Completed' && !hasInvoice ? `
            <button class="btn btn-success" id="btn-header-generate-invoice" style="background-color:#10B981; border-color:#10B981; color:white; display:flex; align-items:center; gap:4px;">
              <span class="material-icons-outlined" style="font-size:18px;">receipt_long</span> Generate Invoice
            </button>
          ` : ''}
          ${hasPermission('Jobs', 'edit') ? `<button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>` : ''}
          ${hasPermission('Jobs', 'delete') ? `<button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>` : ''}
        </div>
      </div>
      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
        <button class="tab ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Tasklists</button>
        ${hasPermission('Jobs', 'view_costs') ? `<button class="tab ${activeTab === 'costs' ? 'active' : ''}" data-tab="costs">Costs</button>` : ''}
        ${hasPermission('Jobs', 'view_quotes_tab') ? `<button class="tab ${activeTab === 'quotes' ? 'active' : ''}" data-tab="quotes">Quotes</button>` : ''}
        <button class="tab ${activeTab === 'forms' ? 'active' : ''}" data-tab="forms">Forms</button>
        ${hasPermission('Jobs', 'view_pos_tab') ? `<button class="tab ${activeTab === 'pos' ? 'active' : ''}" data-tab="pos">POs</button>` : ''}
        <button class="tab ${activeTab === 'activity' ? 'active' : ''}" data-tab="activity">Activity</button>
        ${hasPermission('Jobs', 'view_timesheets_tab') ? `<button class="tab ${activeTab === 'timesheets' ? 'active' : ''}" data-tab="timesheets">Timesheets</button>` : ''}
        ${hasPermission('Jobs', 'view_invoices_tab') ? `<button class="tab ${activeTab === 'invoices' ? 'active' : ''}" data-tab="invoices">Invoices</button>` : ''}
      </div>
      <div class="tab-content" id="tab-content"></div>
    `;

    renderTabContent();
    bindEvents();
  }

  function renderTabContent() {
    // Sanitize activeTab based on user permissions
    if (activeTab === 'costs' && !hasPermission('Jobs', 'view_costs')) {
      activeTab = 'overview';
    } else if (activeTab === 'quotes' && !hasPermission('Jobs', 'view_quotes_tab')) {
      activeTab = 'overview';
    } else if (activeTab === 'pos' && !hasPermission('Jobs', 'view_pos_tab')) {
      activeTab = 'overview';
    } else if (activeTab === 'timesheets' && !hasPermission('Jobs', 'view_timesheets_tab')) {
      activeTab = 'overview';
    } else if (activeTab === 'invoices' && !hasPermission('Jobs', 'view_invoices_tab')) {
      activeTab = 'overview';
    }

    const tc = container.querySelector('#tab-content');
    const totalCost = (job.laborCost || 0) + (job.materialCost || 0);

    if (activeTab === 'forms') {
      renderFormsTab(tc);
      return;
    }

    if (activeTab === 'overview') {
      let jobProgress = 0;
      if (job.tasks && job.tasks.length > 0) {
        let totalWeight = 0;
        let completedWeight = 0;
        job.tasks.forEach(sp => {
          const weight = (parseFloat(sp.estimatedHours) || 1) * (parseInt(sp.people) || 1);
          totalWeight += weight;
          completedWeight += weight * ((sp.progress || 0) / 100);
        });
        jobProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
      }

      const techNames = job.technicians && job.technicians.length > 0
        ? job.technicians.map(t => `${escapeHTML(t.name)} (${t.hours}h)`).join(', ')
        : escapeHTML(job.technicianName || 'Unassigned');

      tc.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
          
          <!-- Original Grid details -->
          <div class="grid-3" style="align-items: start;">
            <div class="card" style="grid-column: span 1">
              <div class="card-header"><h4>Job Information</h4></div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${r('Job Number', escapeHTML(job.number))}
                  ${r('Title', escapeHTML(job.title))}
                  ${r('Type', escapeHTML(job.type))}
                  ${r('Status', escapeHTML(job.status))}
                  ${r('Completion', `<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${jobProgress}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${jobProgress}%</span></div>`)}
                  ${r('Priority', escapeHTML(job.priority))}
                  ${r('Customer', escapeHTML(job.customerName))}
                  ${r('Contact', escapeHTML(job.contactName || '—'))}
                </div>
              </div>
            </div>
            <div class="card" style="grid-column: span 2">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                <h4 style="margin:0">Schedule & Assignment</h4>
                <button class="btn btn-ghost btn-sm" id="btn-add-schedule" style="font-size:12px;padding:4px 8px">
                  <span class="material-icons-outlined" style="font-size:14px;margin-right:4px">calendar_month</span> Add to Schedule
                </button>
              </div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${r('Technicians', techNames)}
                  ${r('Scheduled', job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : '—')}
                  ${r('Est. Hours', job.estimatedHours || '—')}
                  ${r('Site Address', escapeHTML(job.siteAddress || '—'))}
                  ${r('Quote Ref', job.quoteId ? `<a href="#/quotes/${escapeHTML(job.quoteId)}">${escapeHTML(job.quoteId)}</a>` : '—')}
                  ${r('Created', new Date(job.createdAt).toLocaleDateString())}
                </div>
              </div>
            </div>
          </div>

        </div>
      `;

      tc.querySelector('#btn-add-schedule')?.addEventListener('click', () => {
        const techs = store.getAll('technicians');
        const existingSchedules = store.getAll('schedule').filter(t => t.jobId === id);

        // Build the modal content element
        const content = document.createElement('div');

        function getFlatTasks(tasks, currentPath = [], currentNamePath = []) {
          let result = [];
          if (!tasks) return result;
          tasks.forEach((p, i) => {
            const path = [...currentPath, i].join('-');
            const namePath = [...currentNamePath, p.name].join(' > ');
            result.push({ path, name: namePath, isLeaf: !p.subTasks || p.subTasks.length === 0 });
            if (p.subTasks) {
              result = result.concat(getFlatTasks(p.subTasks, [...currentPath, i], [...currentNamePath, p.name]));
            }
          });
          return result;
        }
        const flatTasks = getFlatTasks(job.tasks || []);

        function renderEntries(entries) {
          let html = '';
          entries.forEach((e, i) => {
            html += '<div class="sched-entry" data-index="' + i + '" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
            html += '<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry ' + (i + 1) + '</span>';
            if (entries.length > 1) {
              html += '<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="' + i + '" style="padding:2px 8px">\u2715 Remove</button>';
            }
            html += '</div>';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
            html += '<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>';
            html += '<select class="form-select sched-task" style="width:100%">';
            html += '<option value="">-- Select a Task --</option>';
            flatTasks.forEach(t => {
              html += `<option value="${t.path}" ${e.taskPath === t.path ? 'selected' : ''}>${escapeHTML(t.name)}</option>`;
            });
            html += '</select></div>';
            html += '<div class="form-group" style="margin:0"><label class="form-label">Start</label>';
            html += '<input type="datetime-local" class="form-input sched-start" value="' + e.start + '"></div>';
            html += '<div class="form-group" style="margin:0"><label class="form-label">Finish</label>';
            html += '<input type="datetime-local" class="form-input sched-finish" value="' + e.finish + '"></div>';
            html += '</div>';

            html += '<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">';
            techs.forEach(t => {
              const active = e.techIds.includes(t.id);
              const border = active ? 'var(--color-primary)' : 'var(--border-color)';
              const bg = active ? 'var(--color-primary-light)' : 'transparent';
              const color = active ? 'var(--color-primary)' : 'var(--text-secondary)';
              html += '<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid ' + border + ';border-radius:999px;cursor:pointer;font-size:13px;background:' + bg + ';color:' + color + ';transition:all 0.15s">';
              html += '<input type="checkbox" class="tech-check" data-tech-id="' + t.id + '" ' + (active ? 'checked' : '') + ' style="display:none">';
              html += '<span class="material-icons-outlined" style="font-size:14px">person</span>';
              html += escapeHTML(t.name);
              html += '</label>';
            });
            html += '</div></div>';

            // Assets Section
            const assets = store.getAll('assets').filter(a => a.category === 'Business');
            html += '<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">';
            assets.forEach(a => {
              const active = e.assetIds && e.assetIds.includes(a.id);
              const border = active ? 'var(--color-primary)' : 'var(--border-color)';
              const bg = active ? 'var(--color-primary-light)' : 'transparent';
              const color = active ? 'var(--color-primary)' : 'var(--text-secondary)';
              html += '<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid ' + border + ';border-radius:999px;cursor:pointer;font-size:13px;background:' + bg + ';color:' + color + ';transition:all 0.15s">';
              html += '<input type="checkbox" class="asset-check" data-asset-id="' + a.id + '" ' + (active ? 'checked' : '') + ' style="display:none">';
              html += '<span class="material-icons-outlined" style="font-size:14px">handyman</span>';
              html += escapeHTML(a.name);
              html += '</label>';
            });
            if (assets.length === 0) html += '<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>';
            html += '</div></div></div>';
          });
          return html;
        }


        function renderModal(entries) {
          // Inject scoped styles once
          if (!document.getElementById('sched-modal-styles')) {
            const s = document.createElement('style');
            s.id = 'sched-modal-styles';
            s.textContent = '.sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}';
            document.head.appendChild(s);
          }

          let html = '';

          if (existingSchedules.length > 0) {
            html += '<div style="margin-bottom:16px">';
            html += '<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>';
            existingSchedules.forEach(s => {
              const dt = new Date(s.startTime || s.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              html += '<div class="sched-summary-row" style="flex-wrap:wrap">';
              html += '<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>';
              html += '<span style="font-weight:500">' + escapeHTML(s.technicianName) + '</span>';
              html += '<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">' + escapeHTML(s.taskName || 'General Task') + '</span>';
              html += '<span style="color:var(--text-tertiary);margin-left:auto">' + dt + '</span>';
              html += '<span style="font-weight:600;margin-left:12px">' + s.hours + 'h</span>';
              html += '</div>';
            });
            html += '</div>';
            html += '<hr style="border-color:var(--border-color);margin-bottom:16px">';
          }

          html += '<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>';
          html += '<div id="sched-entries">' + renderEntries(entries) + '</div>';
          html += '<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">';
          html += '<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>';

          content.innerHTML = html;

          // Tech chip toggles
          content.querySelectorAll('.tech-check').forEach(chk => {
            const label = chk.closest('label');
            chk.addEventListener('change', () => {
              if (chk.checked) {
                label.style.borderColor = 'var(--color-primary)';
                label.style.background = 'var(--color-primary-light)';
                label.style.color = 'var(--color-primary)';
              } else {
                label.style.borderColor = 'var(--border-color)';
                label.style.background = 'transparent';
                label.style.color = 'var(--text-secondary)';
              }
            });
          });

          // Asset chip toggles
          content.querySelectorAll('.asset-check').forEach(chk => {
            const label = chk.closest('label');
            chk.addEventListener('change', () => {
              if (chk.checked) {
                label.style.borderColor = 'var(--color-primary)';
                label.style.background = 'var(--color-primary-light)';
                label.style.color = 'var(--color-primary)';
              } else {
                label.style.borderColor = 'var(--border-color)';
                label.style.background = 'transparent';
                label.style.color = 'var(--text-secondary)';
              }
            });
          });

          // Remove entry buttons
          content.querySelectorAll('.btn-remove-entry').forEach(btn => {
            btn.addEventListener('click', () => {
              entries.splice(parseInt(btn.dataset.index), 1);
              renderModal(entries);
            });
          });

          // Add another entry
          content.querySelector('#btn-add-entry').addEventListener('click', () => {
            const p = n => n.toString().padStart(2, '0');
            const d = new Date();
            d.setDate(d.getDate() + 1);
            const ds = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
            entries.push({ taskPath: '', start: `${ds}T08:00`, finish: `${ds}T16:00`, techIds: [], assetIds: [] });
            renderModal(entries);
          });
        }

        // Default first entry: today 8am-4pm, pre-select job's assigned tech if any
        const p = n => n.toString().padStart(2, '0');
        const now2 = new Date();
        const ds = `${now2.getFullYear()}-${p(now2.getMonth() + 1)}-${p(now2.getDate())}`;
        const defaultTechIds = job.technicianId ? [job.technicianId] : [];
        const entries = [{ taskPath: '', start: `${ds}T08:00`, finish: `${ds}T16:00`, techIds: defaultTechIds, assetIds: [] }];
        renderModal(entries);

        function readCurrentEntries() {
          const result = [];
          content.querySelectorAll('.sched-entry').forEach((el, i) => {
            const taskPath = el.querySelector('.sched-task')?.value;
            const start = el.querySelector('.sched-start')?.value;
            const finish = el.querySelector('.sched-finish')?.value;
            const techIds = [...el.querySelectorAll('.tech-check:checked')].map(c => c.dataset.techId);
            const assetIds = [...el.querySelectorAll('.asset-check:checked')].map(c => c.dataset.assetId);
            result.push({ taskPath, start, finish, techIds, assetIds });
          });
          return result;
        }

        showModal({
          title: `Schedule Job: ${escapeHTML(job.title || job.number)}`,
          content,
          size: 'modal-70',
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: close => close() },
            {
              label: 'Save Schedule', className: 'btn-primary', onClick: close => {
                const currentEntries = readCurrentEntries();
                let saved = 0;
                let errors = [];

                currentEntries.forEach((e, i) => {
                  if (!e.taskPath) { errors.push(`Entry ${i + 1}: please select a task`); return; }
                  if (!e.start || !e.finish) { errors.push(`Entry ${i + 1}: missing start or finish`); return; }
                  const startDate = new Date(e.start);
                  const finishDate = new Date(e.finish);
                  if (finishDate <= startDate) { errors.push(`Entry ${i + 1}: finish must be after start`); return; }
                  if (e.techIds.length === 0) { errors.push(`Entry ${i + 1}: select at least one technician`); return; }

                  const hours = Math.round(((finishDate - startDate) / 3600000) * 100) / 100;
                  const taskName = flatTasks.find(t => t.path === e.taskPath)?.name || 'Unknown Task';

                  e.techIds.forEach(techId => {
                    const tech = techs.find(t => t.id === techId);
                    if (!tech) return;
                    store.create('schedule', {
                      jobId: id,
                      jobNumber: job.number,
                      taskPath: e.taskPath,
                      taskName: taskName,
                      technicianId: techId,
                      technicianName: tech.name,
                      date: e.start.split('T')[0],
                      startTime: e.start,
                      finishTime: e.finish,
                      hours
                    });
                    saved++;
                  });

                  // Create Asset Usage records for this entry (only once per entry duration)
                  if (e.assetIds && e.assetIds.length > 0) {
                    e.assetIds.forEach(assetId => {
                      const asset = store.getById('assets', assetId);
                      if (!asset) return;
                      store.create('assetUsage', {
                        jobId: id,
                        assetId: assetId,
                        assetName: asset.name,
                        taskPath: e.taskPath,
                        taskName: taskName,
                        startTime: e.start,
                        finishTime: e.finish,
                        hours,
                        recoveryRate: asset.recoveryRate || 0
                      });
                    });
                  }
                });

                if (errors.length) {
                  showToast(errors[0], 'error');
                  return;
                }

                // Update job's scheduled date and technicians list from first entry
                if (currentEntries.length > 0 && currentEntries[0].start) {
                  const allTechIds = [...new Set(currentEntries.flatMap(e => e.techIds))];
                  const jobTechs = allTechIds.map(tid => {
                    const t = techs.find(x => x.id === tid);
                    const totalHours = currentEntries
                      .filter(e => e.techIds.includes(tid))
                      .reduce((sum, e) => {
                        const h = (new Date(e.finish) - new Date(e.start)) / 3600000;
                        return sum + (isNaN(h) ? 0 : h);
                      }, 0);
                    return { id: tid, name: t?.name || '', hours: Math.round(totalHours * 100) / 100 };
                  });
                  store.update('jobs', id, {
                    scheduledDate: currentEntries[0].start.split('T')[0],
                    technicians: jobTechs,
                    technicianName: jobTechs.map(t => t.name).join(', ')
                  });

                  // Trigger system notifications for each scheduled technician
                  import('../../components/Notifications.js').then(({ addSystemNotification }) => {
                    jobTechs.forEach(t => {
                      addSystemNotification(
                        'New Schedule Assignment',
                        `You have been scheduled for Job ${job.number} (${job.title}) starting ${currentEntries[0].start.replace('T', ' ')} (${t.hours} hrs total).`,
                        `/jobs/${id}`
                      );
                    });
                  });
                }

                showToast(`${saved} schedule ${saved === 1 ? 'entry' : 'entries'} saved`, 'success');
                close();
                renderTabContent();
              }
            }
          ]
        });
      });

    } else if (activeTab === 'tasks') {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      let canEditTasks = true;
      if (currentUser.userTypeId) {
        const ut = store.getById('userTypes', currentUser.userTypeId);
        if (ut && ut.permissions) {
          const p = ut.permissions.find(p => p.module === 'Jobs');
          if (p) canEditTasks = p.edit;
        }
      } else if (currentUser.role === 'customer' || currentUser.role === 'technician') {
        canEditTasks = false;
      }

      if (!job.tasks) {
        job.tasks = [{ id: store.generateId(), name: 'Main Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] }];
      }

      // Ensure existing tasks have subTasks array
      job.tasks.forEach(p => { if (!p.subTasks) p.subTasks = []; });

      // Migrate legacy contractor assignments to multi-select array
      const migrateTasks = (tasksList) => {
        tasksList.forEach(t => {
          if (t.assignedContractorId && (!t.assignedContractorIds || t.assignedContractorIds.length === 0)) {
            t.assignedContractorIds = [t.assignedContractorId];
          }
          if (t.subTasks) migrateTasks(t.subTasks);
        });
      };
      migrateTasks(job.tasks);

      const activeContractors = store.getAll('contractors').filter(c => c.active);

      function getTaskByPath(tasks, path) {
        let curr = tasks[path[0]];
        if (!curr) return null;
        for (let i = 1; i < path.length; i++) {
          if (!curr.subTasks) return null;
          curr = curr.subTasks[path[i]];
          if (!curr) return null;
        }
        return curr;
      }

      function calculateTotalHours(node) {
        if (!node.subTasks || node.subTasks.length === 0) {
          return (parseFloat(node.estimatedHours) || 0) * (parseInt(node.people) || 1);
        }
        return node.subTasks.reduce((sum, sp) => sum + calculateTotalHours(sp), 0);
      }

      function updateParentProgress(tasks, path) {
        if (path.length <= 1) return;
        const parentPath = path.slice(0, -1);
        const parent = getTaskByPath(tasks, parentPath);
        if (parent && parent.subTasks && parent.subTasks.length > 0) {
          let totalWeight = 0;
          let completedWeight = 0;
          parent.subTasks.forEach(sp => {
            const weight = (parseFloat(sp.estimatedHours) || 1) * (parseInt(sp.people) || 1);
            totalWeight += weight;
            completedWeight += weight * ((sp.progress || 0) / 100);
          });
          parent.progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
          if (parent.progress === 100) parent.status = 'Completed';
          else if (parent.progress > 0) parent.status = 'In Progress';
          else parent.status = 'Not Started';
          updateParentProgress(tasks, parentPath); // recurse up
        }
      }

      // Cleanup invalid paths
      let isValidPath = true;
      let curr = job.tasks;
      for (let i = 0; i < taskExpandedPath.length; i++) {
        if (!curr || !curr[taskExpandedPath[i]]) { isValidPath = false; break; }
        curr = curr[taskExpandedPath[i]].subTasks;
      }
      if (!isValidPath) {
        taskExpandedPath = [];
      }

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${canEditTasks ? `<button class="btn btn-sm btn-secondary" id="btn-import-tasklist"><span class="material-icons-outlined" style="font-size:14px">download</span> Import</button>` : ''}
              ${canEditTasks ? `<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>` : ''}
              ${canEditTasks ? `<button class="btn btn-sm btn-primary" id="btn-save-tasks"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>` : ''}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(() => {
          const viewParentNode = taskViewPath.length > 0 ? getTaskByPath(job.tasks, taskViewPath) : null;
          const viewList = viewParentNode ? (viewParentNode.subTasks || []) : job.tasks;
          const viewTitle = viewParentNode ? escapeHTML(viewParentNode.name) : 'Main Tasks';

          return `
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${taskViewPath.length > 0 ? `<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>` : ''}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${viewTitle}">${viewTitle}</span>
                    </div>
                    ${canEditTasks ? (taskViewPath.length === 0 ? `<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>` : `<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${taskViewPath.join('-')}" title="Add Task"><span class="material-icons-outlined">add</span></button>`) : ''}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${viewList.map((p, i) => {
            const currentPath = [...taskViewPath, i];
            const isSelected = currentPath.join('-') === taskExpandedPath.join('-');
            return `
                        <div class="task-list-item ${p.progress === 100 ? 'completed' : ''}" data-path="${currentPath.join('-')}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${isSelected ? 'background:var(--color-primary-light); color:var(--color-primary)' : 'background:transparent; color:var(--text-primary)'}">
                          <span style="font-weight:${isSelected ? '600' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</span>
                          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
                            ${(() => {
                              if (!p.valueFields || p.valueFields.length === 0) return '';
                              const filled = p.valueFields.filter(f => f.value !== undefined && f.value !== '').length;
                              const total = p.valueFields.length;
                              const allDone = filled === total;
                              const hasOutOfRange = p.valueFields.some(f => {
                                if (!f.value || f.value === '') return false;
                                const ft = f.fieldType || 'text';
                                if (ft === 'number') {
                                  const v = parseFloat(f.value);
                                  return (f.min !== undefined && f.min !== '' && v < parseFloat(f.min)) || (f.max !== undefined && f.max !== '' && v > parseFloat(f.max));
                                }
                                if (ft === 'dropdown' && f.expectedValue) {
                                  return f.value !== f.expectedValue;
                                }
                                return false;
                              });
                              if (hasOutOfRange) return `<span title="Values: ${filled}/${total} — OUT OF RANGE" style="display:inline-flex;align-items:center;font-size:16px;color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:16px">error</span></span>`;
                              return `<span title="Values: ${filled}/${total} recorded" style="display:inline-flex;align-items:center;font-size:16px;color:${allDone ? 'var(--color-success)' : 'var(--color-warning)'}"><span class="material-icons-outlined" style="font-size:16px">${allDone ? 'fact_check' : 'assignment'}</span></span>`;
                            })()}
                            ${p.subTasks && p.subTasks.length > 0 ? `<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${currentPath.join('-')}" style="padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>` : `<input type="checkbox" class="task-list-checkbox" data-path="${currentPath.join('-')}" ${p.progress === 100 ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;" />`}
                          </div>
                        </div>
                      `;
          }).join('')}
                    ${viewList.length === 0 ? '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>' : ''}
                  </div>
                </div>
              `;
        })()}

            <!-- Task Details Form -->
            ${taskExpandedPath.length > 0 ? (() => {
          const path = taskExpandedPath;
          const node = getTaskByPath(job.tasks, path);
          if (!node) return '';
          const hasSubs = node.subTasks && node.subTasks.length > 0;
          return `
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${!isInfoPanelEditing ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHTML(node.name)}">Info Panel: ${escapeHTML(node.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${canEditTasks && path.length < 3 ? `<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${path.join('-')}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>` : ''}
                      ${!hasSubs ? `<button class="btn btn-sm btn-secondary btn-book-time" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>` : ''}
                      ${canEditTasks ? `<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>` : ''}
                      ${canEditTasks ? `<button class="btn btn-sm btn-danger btn-remove-task" data-path="${path.join('-')}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>` : ''}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${escapeHTML(node.name)}</div>
                  </div>
                  ${hasSubs ? `
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${calculateTotalHours(node)} hrs</div>
                  </div>
                  ` : `
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${node.startDate ? node.startDate.split('T')[0] : '-'}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${node.estimatedHours ? node.estimatedHours + ' hrs' : '-'}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${node.people || '1'}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${node.progress || 0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${node.progress > 50 ? '#fff' : 'var(--text-primary)'}">${node.progress || 0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:6px">Assigned Subcontractors</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px">
                      ${(() => {
                        const ids = node.assignedContractorIds || [];
                        if (ids.length === 0) {
                          return `<span style="color:var(--text-tertiary); font-style:italic; font-size:13px">Unassigned</span>`;
                        }
                        return ids.map(id => {
                          const contr = store.getById('contractors', id);
                          const name = contr ? contr.businessName : 'Unknown Subcontractor';
                          return `
                            <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600; display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:4px; font-size:12px">
                              <span class="material-icons-outlined" style="font-size:14px">engineering</span>
                              ${escapeHTML(name)}
                            </span>
                          `;
                        }).join('');
                      })()}
                    </div>
                  </div>
                  <div style="margin-top:16px">
                     <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                     <div style="font-size:14px; white-space:pre-wrap">${escapeHTML(node.description || 'No description provided.')}</div>
                   </div>
                   ${!hasSubs && node.valueFields && node.valueFields.length > 0 ? `
                   <div style="margin-top:20px; border-top:1px solid var(--border-color); padding-top:16px">
                     <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                       <div style="display:flex; align-items:center; gap:6px">
                         <span class="material-icons-outlined" style="font-size:18px; color:var(--color-primary)">assignment</span>
                         <span style="font-size:13px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.3px">Value Records</span>
                         <span class="badge ${node.valueFields.filter(f => f.value !== undefined && f.value !== '').length === node.valueFields.length ? 'badge-success' : 'badge-warning'}" style="font-size:10px; padding:2px 6px">${node.valueFields.filter(f => f.value !== undefined && f.value !== '').length}/${node.valueFields.length}</span>
                       </div>
                       <button class="btn btn-sm ${isRecordingValues ? 'btn-secondary' : 'btn-primary'} btn-toggle-recording" data-path="${path.join('-')}">
                         <span class="material-icons-outlined" style="font-size:14px">${isRecordingValues ? 'close' : 'edit_note'}</span>
                         ${isRecordingValues ? 'Close' : 'Enter Values'}
                       </button>
                     </div>
                     ${isRecordingValues ? `
                     <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px" id="value-recording-panel">
                       ${node.valueFields.map((vf, vi) => {
                         const ft = vf.fieldType || 'text';
                         const hasRange = ft === 'number' && (vf.min !== undefined && vf.min !== '' || vf.max !== undefined && vf.max !== '');
                         const isNumOutOfRange = hasRange && vf.value !== undefined && vf.value !== '' && (
                           (vf.min !== undefined && vf.min !== '' && parseFloat(vf.value) < parseFloat(vf.min)) ||
                           (vf.max !== undefined && vf.max !== '' && parseFloat(vf.value) > parseFloat(vf.max))
                         );
                         const isDropdownMismatch = ft === 'dropdown' && vf.expectedValue && vf.value && vf.value !== '' && vf.value !== vf.expectedValue;
                         const isOutOfRange = isNumOutOfRange || isDropdownMismatch;
                         const rangeHint = hasRange ? `Expected: ${vf.min !== undefined && vf.min !== '' ? vf.min : '—'} to ${vf.max !== undefined && vf.max !== '' ? vf.max : '—'}${vf.unit ? ' ' + escapeHTML(vf.unit) : ''}` : '';
                         const dropdownHint = isDropdownMismatch ? `Expected: ${escapeHTML(vf.expectedValue)}` : '';
                         let inputHtml = '';
                         if (ft === 'dropdown' && vf.options && vf.options.length > 0) {
                           inputHtml = `<select class="form-input vf-value-input" data-vf-idx="${vi}" style="height:34px; font-size:14px; font-weight:500; ${isDropdownMismatch ? 'border-color:var(--color-danger); background:rgba(220,53,69,0.06)' : ''}">
                             <option value=""${!vf.value ? ' selected' : ''}>— Select —</option>
                             ${vf.options.map(opt => `<option value="${escapeHTML(opt)}"${vf.value === opt ? ' selected' : ''}>${escapeHTML(opt)}${opt === vf.expectedValue ? ' ✓' : ''}</option>`).join('')}
                           </select>`;
                         } else if (ft === 'number') {
                           inputHtml = `<input type="number" class="form-input vf-value-input" data-vf-idx="${vi}" value="${escapeHTML(vf.value || '')}" placeholder="Enter value..." ${vf.min !== undefined && vf.min !== '' ? `min="${vf.min}"` : ''} ${vf.max !== undefined && vf.max !== '' ? `max="${vf.max}"` : ''} style="height:34px; font-size:14px; font-weight:500; ${isNumOutOfRange ? 'border-color:var(--color-danger); background:rgba(220,53,69,0.06)' : ''}" />`;
                         } else {
                           inputHtml = `<input type="text" class="form-input vf-value-input" data-vf-idx="${vi}" value="${escapeHTML(vf.value || '')}" placeholder="Enter value..." style="height:34px; font-size:14px; font-weight:500" />`;
                         }
                         const hintText = rangeHint || dropdownHint;
                         return `
                         <div style="display:flex; align-items:center; gap:8px; padding:10px 12px; background:var(--bg-color); border:1px solid ${isOutOfRange ? 'var(--color-danger)' : 'var(--border-color)'}; border-radius:6px; transition:border-color 0.2s" data-vf-idx="${vi}">
                           <div style="flex:1; min-width:0">
                             <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.3px; margin-bottom:4px">${escapeHTML(vf.label)}${vf.unit ? ` <span style="font-weight:400; text-transform:none">(${escapeHTML(vf.unit)})</span>` : ''}</div>
                             ${inputHtml}
                             ${hintText ? `<div style="font-size:10px; color:${isOutOfRange ? 'var(--color-danger)' : 'var(--text-tertiary)'}; margin-top:3px">${isOutOfRange ? '<span class="material-icons-outlined" style="font-size:12px; vertical-align:middle">warning</span> ' + (isDropdownMismatch ? 'Not the expected value — ' : 'Out of range — ') : ''}${hintText}</div>` : ''}
                           </div>
                           ${isOutOfRange ? `<span class="material-icons-outlined" style="font-size:20px; color:var(--color-danger); flex-shrink:0">error</span>` : (vf.value ? `<span class="material-icons-outlined" style="font-size:20px; color:var(--color-success); flex-shrink:0">check_circle</span>` : `<span class="material-icons-outlined" style="font-size:20px; color:var(--border-color); flex-shrink:0">radio_button_unchecked</span>`)}
                         </div>`;
                       }).join('')}
                       <div style="grid-column: span 2; display:flex; justify-content:flex-end; gap:8px; margin-top:4px">
                         <button class="btn btn-sm btn-primary btn-save-values" data-path="${path.join('-')}">
                           <span class="material-icons-outlined" style="font-size:14px">save</span> Save Values
                         </button>
                       </div>
                     </div>
                     ` : `
                     <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px">
                       ${node.valueFields.map(vf => {
                         const ft = vf.fieldType || 'text';
                         const hasRange = ft === 'number' && (vf.min !== undefined && vf.min !== '' || vf.max !== undefined && vf.max !== '');
                         const isNumOutOfRange = hasRange && vf.value !== undefined && vf.value !== '' && (
                           (vf.min !== undefined && vf.min !== '' && parseFloat(vf.value) < parseFloat(vf.min)) ||
                           (vf.max !== undefined && vf.max !== '' && parseFloat(vf.value) > parseFloat(vf.max))
                         );
                         const isDropdownMismatch = ft === 'dropdown' && vf.expectedValue && vf.value && vf.value !== '' && vf.value !== vf.expectedValue;
                         const isOutOfRange = isNumOutOfRange || isDropdownMismatch;
                         const warningTitle = isNumOutOfRange ? `Outside expected range (${vf.min || '—'} – ${vf.max || '—'})` : (isDropdownMismatch ? `Expected: ${vf.expectedValue}` : '');
                         return `
                         <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:${isOutOfRange ? 'rgba(220,53,69,0.06)' : 'var(--bg-color)'}; border-radius:4px; font-size:13px; ${isOutOfRange ? 'border:1px solid var(--color-danger)' : ''}">
                           <span style="color:var(--text-secondary)">${escapeHTML(vf.label)}${vf.unit ? ` (${escapeHTML(vf.unit)})` : ''}</span>
                           <div style="display:flex;align-items:center;gap:6px">
                             ${vf.value ? `
                               <span style="font-weight:600; color:${isOutOfRange ? 'var(--color-danger)' : 'var(--text-primary)'}">${escapeHTML(vf.value)}${vf.recordedBy ? ` <span style="font-weight:400; color:var(--text-tertiary); font-size:11px">— ${escapeHTML(vf.recordedBy)}</span>` : ''}</span>
                               ${isOutOfRange ? `<span class="material-icons-outlined" style="font-size:16px;color:var(--color-danger)" title="${escapeHTML(warningTitle)}">warning</span>` : ''}
                             ` : `<span style="color:var(--text-tertiary); font-style:italic">Not recorded</span>`}
                           </div>
                         </div>`;
                       }).join('')}
                     </div>
                     `}
                   </div>
                   ` : ''}
                  ` : `
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHTML(node.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${canEditTasks ? `<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${path.join('-')}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>` : ''}
                      ${canEditTasks ? `<button class="btn btn-sm btn-danger btn-remove-task" data-path="${path.join('-')}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>` : ''}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${escapeHTML(node.name)}" ${!canEditTasks ? 'disabled' : ''} />
                  </div>
                  ${hasSubs ? `
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${calculateTotalHours(node)} hrs</div>
                  </div>
                  ` : `
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${node.startDate ? node.startDate.split('T')[0] : ''}" ${!canEditTasks ? 'disabled' : ''} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${node.estimatedHours || ''}" min="0" step="0.5" ${!canEditTasks ? 'disabled' : ''} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${node.people || '1'}" min="1" step="1" ${!canEditTasks ? 'disabled' : ''} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${node.progress || 0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${node.progress > 50 ? '#fff' : 'var(--text-primary)'}">${node.progress || 0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="margin-bottom:8px">Assigned Subcontractors</label>
                    <div style="border:1px solid var(--border-color); border-radius:6px; max-height:160px; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; background:var(--bg-color)">
                      ${activeContractors.map(c => {
                        const isChecked = (node.assignedContractorIds || []).includes(c.id);
                        return `
                          <label class="contractor-checkbox-label" style="display:flex; align-items:center; gap:8px; margin:0; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:normal; transition:background 0.2s">
                            <input type="checkbox" class="contractor-assign-checkbox" value="${c.id}" ${isChecked ? 'checked' : ''} ${!canEditTasks ? 'disabled' : ''} style="width:16px; height:16px; margin:0; cursor:pointer" />
                            <span style="font-weight:500; color:var(--text-primary)">${escapeHTML(c.businessName)}</span>
                            <span style="color:var(--text-tertiary); font-size:11px">(${escapeHTML(c.contactName)})</span>
                          </label>
                        `;
                      }).join('')}
                      ${activeContractors.length === 0 ? '<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:12px">No active subcontractors found</div>' : ''}
                    </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label">Description</label>
                     <textarea class="form-input detail-input" data-field="description" rows="3" ${!canEditTasks ? 'disabled' : ''}>${escapeHTML(node.description || '')}</textarea>
                   </div>
                   ${!hasSubs ? `
                   <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:16px">
                     <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                       <div style="display:flex; align-items:center; gap:6px">
                         <span class="material-icons-outlined" style="font-size:18px; color:var(--color-primary)">assignment</span>
                         <span style="font-size:13px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.3px">Value Fields</span>
                       </div>
                       ${canEditTasks ? `<button class="btn btn-sm btn-secondary btn-add-value-field" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Field</button>` : ''}
                     </div>
                     <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:10px">Define the values a technician needs to record for this task (e.g. pressure readings, temperatures).</div>
                     <div style="display:flex; flex-direction:column; gap:8px" id="value-fields-config">
                       ${(node.valueFields || []).map((vf, vi) => {
                         const ft = vf.fieldType || 'text';
                         return `
                         <div style="padding:10px 12px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px" data-vf-idx="${vi}">
                           <div style="display:flex; align-items:center; gap:8px; margin-bottom:${ft !== 'text' ? '8px' : '0'}">
                             <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                             <input type="text" class="form-input vf-label-input" data-vf-idx="${vi}" value="${escapeHTML(vf.label)}" placeholder="Field label (e.g. Oil Pressure)" style="flex:2; height:32px; font-size:13px" />
                             <select class="form-input vf-type-select" data-vf-idx="${vi}" style="flex:0 0 110px; height:32px; font-size:12px">
                               <option value="text"${ft === 'text' ? ' selected' : ''}>Text</option>
                               <option value="number"${ft === 'number' ? ' selected' : ''}>Number</option>
                               <option value="dropdown"${ft === 'dropdown' ? ' selected' : ''}>Dropdown</option>
                             </select>
                             ${canEditTasks ? `<button class="btn btn-ghost btn-sm btn-icon btn-remove-value-field" data-vf-idx="${vi}" style="color:var(--color-danger); min-width:28px; min-height:28px; padding:0"><span class="material-icons-outlined" style="font-size:16px">close</span></button>` : ''}
                           </div>
                           ${ft === 'number' ? `
                           <div style="display:flex; align-items:center; gap:8px; margin-left:28px">
                             <input type="text" class="form-input vf-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (e.g. PSI)" style="flex:1; height:30px; font-size:12px" />
                             <div style="display:flex; align-items:center; gap:4px; flex:2">
                               <span style="font-size:11px; color:var(--text-tertiary); white-space:nowrap">Range:</span>
                               <input type="number" class="form-input vf-min-input" data-vf-idx="${vi}" value="${vf.min !== undefined ? vf.min : ''}" placeholder="Min" style="flex:1; height:30px; font-size:12px" />
                               <span style="color:var(--text-tertiary)">–</span>
                               <input type="number" class="form-input vf-max-input" data-vf-idx="${vi}" value="${vf.max !== undefined ? vf.max : ''}" placeholder="Max" style="flex:1; height:30px; font-size:12px" />
                             </div>
                           </div>
                           ` : ''}
                           ${ft === 'text' ? `
                           <div style="display:flex; align-items:center; gap:8px; margin-left:28px; margin-top:4px">
                             <input type="text" class="form-input vf-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (optional, e.g. PSI)" style="flex:1; height:30px; font-size:12px" />
                           </div>
                           ` : ''}
                           ${ft === 'dropdown' ? `
                           <div style="margin-left:28px; display:flex; flex-direction:column; gap:6px">
                             <div>
                               <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px">Options (one per line)</div>
                               <textarea class="form-input vf-options-input" data-vf-idx="${vi}" rows="3" placeholder="Low\nAs Expected\nHigh" style="font-size:12px; line-height:1.5">${escapeHTML((vf.options || []).join('\n'))}</textarea>
                             </div>
                             <div>
                               <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px">Expected / Ideal Value <span style="font-weight:400">(flags others as out of range)</span></div>
                               <select class="form-input vf-expected-select" data-vf-idx="${vi}" style="height:30px; font-size:12px">
                                 <option value=""${!vf.expectedValue ? ' selected' : ''}>— No expected value —</option>
                                 ${(vf.options || []).map(opt => `<option value="${escapeHTML(opt)}"${vf.expectedValue === opt ? ' selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
                               </select>
                             </div>
                           </div>
                           ` : ''}
                         </div>`;
                       }).join('')}
                       ${(!node.valueFields || node.valueFields.length === 0) ? '<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:16px; border:1px dashed var(--border-color); border-radius:6px">No value fields defined. Click "Add Field" to create one.</div>' : ''}
                     </div>
                   </div>
                   ` : ''}
                  `}
                </div>
              `;
        })() : ''}
          </div>
        </div>
      `;

      tc.querySelector('.btn-view-back')?.addEventListener('click', () => {
        taskViewPath.pop();
        renderTabContent();
      });

      tc.querySelectorAll('.btn-drill-down').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          taskViewPath = el.dataset.path.split('-').map(Number);
          taskExpandedPath = [...taskViewPath];
          renderTabContent();
        });
      });

      tc.querySelectorAll('.task-list-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const path = e.target.dataset.path.split('-').map(Number);
          const node = getTaskByPath(job.tasks, path);
          node.progress = e.target.checked ? 100 : 0;
          node.status = e.target.checked ? 'Completed' : 'Not Started';
          updateParentProgress(job.tasks, path);
          store.update('jobs', id, { tasks: job.tasks });
          renderTabContent();
        });
        chk.addEventListener('click', (e) => e.stopPropagation());
      });

      tc.querySelectorAll('.task-list-item').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.btn-drill-down')) return;
          const path = e.currentTarget.dataset.path.split('-').map(Number);
          taskExpandedPath = path;
          isInfoPanelEditing = false;
          isRecordingValues = false;
          renderTabContent();
        });
      });

      tc.querySelector('.btn-edit-info')?.addEventListener('click', () => {
        isInfoPanelEditing = true;
        renderTabContent();
      });

      tc.querySelector('.btn-done-info')?.addEventListener('click', () => {
        isInfoPanelEditing = false;
        renderTabContent();
      });

      tc.querySelector('#btn-add-main-task')?.addEventListener('click', () => {
        if (!job.tasks) job.tasks = [];
        job.tasks.push({ id: store.generateId(), name: 'New Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] });
        taskExpandedPath = [job.tasks.length - 1];
        store.update('jobs', id, { tasks: job.tasks });
        renderTabContent();
      });

      tc.querySelectorAll('.btn-add-child-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const path = e.currentTarget.dataset.path.split('-').map(Number);
          const parent = getTaskByPath(job.tasks, path);
          if (!parent.subTasks) parent.subTasks = [];
          parent.subTasks.push({ id: store.generateId(), name: 'New Sub-task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] });
          taskExpandedPath = [...path, parent.subTasks.length - 1];
          store.update('jobs', id, { tasks: job.tasks });
          renderTabContent();
        });
      });

      tc.querySelectorAll('.detail-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          const field = e.target.dataset.field;

          if (field === 'progress-check') {
            node.progress = e.target.checked ? 100 : 0;
            node.status = e.target.checked ? 'Completed' : 'Not Started';
          } else if (field === 'progress') {
            node.progress = parseInt(e.target.value) || 0;
            if (node.progress === 100) node.status = 'Completed';
            else if (node.progress === 0) node.status = 'Not Started';
            else node.status = 'In Progress';
          } else if (field === 'estimatedHours') {
            node.estimatedHours = parseFloat(e.target.value) || 0;
          } else {
            node[field] = e.target.value;
          }

          updateParentProgress(job.tasks, taskExpandedPath);
          store.update('jobs', id, { tasks: job.tasks });
          renderTabContent();
        });
      });

      tc.querySelectorAll('.contractor-assign-checkbox').forEach(chk => {
        chk.addEventListener('change', () => {
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (!node.assignedContractorIds) node.assignedContractorIds = [];
          
          const selectedIds = Array.from(tc.querySelectorAll('.contractor-assign-checkbox:checked'))
            .map(el => el.value);
          
          node.assignedContractorIds = selectedIds;
          
          // Legacy single contractor sync for backward compatibility
          if (selectedIds.length > 0) {
            node.assignedContractorId = selectedIds[0];
            const contr = store.getById('contractors', selectedIds[0]);
            node.assignedContractorName = contr ? contr.businessName : '';
          } else {
            node.assignedContractorId = null;
            node.assignedContractorName = '';
          }
          
          updateParentProgress(job.tasks, taskExpandedPath);
          store.update('jobs', id, { tasks: job.tasks });
          renderTabContent();
        });
      });

      tc.querySelectorAll('.btn-remove-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const path = btn.dataset.path.split('-').map(Number);
          if (confirm('Are you sure you want to delete this task and all its sub-tasks?')) {
            if (path.length === 1) {
              job.tasks.splice(path[0], 1);
            } else {
              const parentPath = path.slice(0, -1);
              const parent = getTaskByPath(job.tasks, parentPath);
              if (parent && parent.subTasks) {
                parent.subTasks.splice(path[path.length - 1], 1);
              }
              updateParentProgress(job.tasks, parentPath);
            }
            taskExpandedPath = path.slice(0, -1); // jump up one level
            isInfoPanelEditing = false;
            store.update('jobs', id, { tasks: job.tasks });
            renderTabContent();
          }
        });
      });

      // --- Value Records: Enter Values toggle ---
      tc.querySelector('.btn-toggle-recording')?.addEventListener('click', () => {
        isRecordingValues = !isRecordingValues;
        renderTabContent();
      });

      // --- Value Records: Save values from recording panel ---
      tc.querySelector('.btn-save-values')?.addEventListener('click', () => {
        const node = getTaskByPath(job.tasks, taskExpandedPath);
        if (!node || !node.valueFields) return;
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        tc.querySelectorAll('.vf-value-input').forEach(inp => {
          const idx = parseInt(inp.dataset.vfIdx);
          const val = inp.value.trim();
          if (node.valueFields[idx]) {
            node.valueFields[idx].value = val;
            if (val) {
              node.valueFields[idx].recordedBy = currentUser.name || 'Unknown';
              node.valueFields[idx].recordedAt = new Date().toISOString();
            }
          }
        });
        store.update('jobs', id, { tasks: job.tasks });
        showToast('Values saved', 'success');
        isRecordingValues = false;
        renderTabContent();
      });

      // --- Value Fields Config: Add field ---
      tc.querySelector('.btn-add-value-field')?.addEventListener('click', () => {
        const node = getTaskByPath(job.tasks, taskExpandedPath);
        if (!node) return;
        if (!node.valueFields) node.valueFields = [];
        node.valueFields.push({ id: store.generateId(), label: '', unit: '', value: '', fieldType: 'text' });
        renderTabContent();
      });

      // --- Value Fields Config: Remove field ---
      tc.querySelectorAll('.btn-remove-value-field').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (!node || !node.valueFields) return;
          node.valueFields.splice(idx, 1);
          renderTabContent();
        });
      });

      // --- Value Fields Config: Live update label/unit/type/range/options ---
      tc.querySelectorAll('.vf-label-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].label = inp.value.trim();
          }
        });
      });
      tc.querySelectorAll('.vf-unit-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].unit = inp.value.trim();
          }
        });
      });
      tc.querySelectorAll('.vf-type-select').forEach(sel => {
        sel.addEventListener('change', () => {
          const idx = parseInt(sel.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].fieldType = sel.value;
            // Clear type-specific fields when switching
            if (sel.value !== 'number') { node.valueFields[idx].min = undefined; node.valueFields[idx].max = undefined; }
            if (sel.value !== 'dropdown') { node.valueFields[idx].options = undefined; }
            if (sel.value === 'dropdown') { node.valueFields[idx].unit = ''; }
            node.valueFields[idx].value = ''; // reset recorded value on type change
          }
          renderTabContent();
        });
      });
      tc.querySelectorAll('.vf-min-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].min = inp.value !== '' ? parseFloat(inp.value) : undefined;
          }
        });
      });
      tc.querySelectorAll('.vf-max-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].max = inp.value !== '' ? parseFloat(inp.value) : undefined;
          }
        });
      });
      tc.querySelectorAll('.vf-options-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].options = inp.value.split('\n').map(o => o.trim()).filter(Boolean);
            renderTabContent(); // Redraw so the Expected Value dropdown gets the new options list
          }
        });
      });

      tc.querySelectorAll('.vf-expected-select').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(job.tasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
            node.valueFields[idx].expectedValue = inp.value || undefined;
          }
        });
      });

      tc.querySelector('#btn-save-tasks')?.addEventListener('click', () => {
        store.update('jobs', id, { tasks: job.tasks });
        showToast('Tasks saved', 'success');
      });

      tc.querySelector('#btn-save-tasklist-template')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `
           <div class="form-group">
             <label class="form-label">Template Name</label>
             <input type="text" class="form-input" id="tmpl-name" placeholder="e.g. Standard 50pt Maintenance" required />
           </div>
           <div class="form-group">
             <label class="form-label">Description</label>
             <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
           </div>
           <div class="form-group">
             <label class="form-label">Tags (comma separated)</label>
             <input type="text" class="form-input" id="tmpl-tags" placeholder="Electrical, Maintenance, Commercial" />
           </div>
         `;

        showModal({
          title: 'Save Tasklist as Template',
          content,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            {
              label: 'Save Template', className: 'btn-primary', onClick: (close) => {
                const name = content.querySelector('#tmpl-name').value;
                const description = content.querySelector('#tmpl-desc').value;
                const tags = content.querySelector('#tmpl-tags').value.split(',').map(t => t.trim()).filter(Boolean);

                if (!name) {
                  showToast('Template name is required', 'error');
                  return;
                }

                function deepCloneTasks(tasks) {
                  return tasks.map(p => ({
                    ...p,
                    id: store.generateId(),
                    status: 'Not Started',
                    progress: 0,
                    valueFields: p.valueFields ? p.valueFields.map(vf => ({ ...vf, value: '', recordedBy: null, recordedAt: null })) : undefined,
                    subTasks: (p.subTasks || p.subPhases) ? deepCloneTasks(p.subTasks || p.subPhases) : []
                  }));
                }
                store.create('taskTemplates', {
                  name,
                  description,
                  tags,
                  tasks: deepCloneTasks(job.tasks || job.phases || []),
                  createdAt: new Date().toISOString()
                });
                showToast('Tasklist saved as template', 'success');
                close();
              }
            }
          ]
        });
      });

      tc.querySelector('#btn-import-tasklist')?.addEventListener('click', () => {
        const templates = store.getAll('taskTemplates');
        const otherJobs = store.getAll('jobs').filter(j => j.id !== id && ((j.tasks && j.tasks.length > 0) || (j.phases && j.phases.length > 0)));
        let currentTab = 'templates';

        const content = document.createElement('div');
        content.innerHTML = `
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;

        function renderImportList(query = '') {
          const listDiv = content.querySelector('#import-content');
          const q = query.toLowerCase();

          if (currentTab === 'templates') {
            const filtered = templates.filter(t =>
              t.name.toLowerCase().includes(q) ||
              (t.description || '').toLowerCase().includes(q) ||
              (t.tags || []).some(tag => tag.toLowerCase().includes(q))
            );

            listDiv.innerHTML = filtered.length ? filtered.map(t => {
              const tasksList = t.tasks || t.phases || [];
              return `
               <div class="import-item" data-id="${t.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${escapeHTML(t.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${tasksList.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${escapeHTML(t.description || 'No description.')}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(t.tags || []).map(tag => `<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${escapeHTML(tag)}</span>`).join('')}
                 </div>
               </div>
             `}).join('') : `<div class="text-secondary text-center" style="padding:24px">No templates matching "${query}"</div>`;
          } else {
            const filtered = otherJobs.filter(j =>
              j.number.toLowerCase().includes(q) ||
              j.title.toLowerCase().includes(q) ||
              j.customerName.toLowerCase().includes(q)
            );

            listDiv.innerHTML = filtered.length ? filtered.map(j => {
              const tasksList = j.tasks || j.phases || [];
              return `
               <div class="import-item" data-id="${j.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${escapeHTML(j.number)} - ${escapeHTML(j.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${escapeHTML(j.customerName)} · ${tasksList.length} tasks</div>
               </div>
             `}).join('') : `<div class="text-secondary text-center" style="padding:24px">No jobs matching "${query}"</div>`;
          }

          // Direct binding to newly created items to prevent bubbles / type mismatch bugs
          listDiv.querySelectorAll('.import-item').forEach(item => {
            item.addEventListener('click', () => {
              const sourceId = item.dataset.id;
              const type = item.dataset.type;

              const freshTemplates = store.getAll('taskTemplates');
              const freshJobs = store.getAll('jobs');
              const source = type === 'template'
                ? freshTemplates.find(t => String(t.id) === String(sourceId))
                : freshJobs.find(j => String(j.id) === String(sourceId));

              if (source && (source.tasks || source.phases)) {
                if (confirm(`Replace current tasklist with "${source.name || source.number}"?`)) {
                  function deepClone(tasks) {
                    return tasks.map(p => ({
                      ...p,
                      id: store.generateId(),
                      status: 'Not Started',
                      progress: 0,
                      valueFields: p.valueFields ? p.valueFields.map(vf => ({ ...vf, value: '', recordedBy: null, recordedAt: null })) : undefined,
                      subTasks: (p.subTasks || p.subPhases) ? deepClone(p.subTasks || p.subPhases) : []
                    }));
                  }
                  job.tasks = deepClone(source.tasks || source.phases);
                  taskExpandedPath = [0];
                  taskViewPath = [];
                  showToast(`Imported ${source.name || source.number}`, 'success');
                  renderTabContent();
                  document.querySelector('.modal-overlay')?.remove();
                }
              } else {
                showToast('Could not find source data', 'error');
              }
            });
          });
        }

        renderImportList();

        // Attach tab listeners
        content.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => {
            content.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            content.querySelector('#import-search').placeholder = currentTab === 'templates' ? 'Search templates...' : 'Search jobs...';
            renderImportList(content.querySelector('#import-search').value);
          });
        });

        content.querySelector('#import-search').addEventListener('input', (e) => {
          renderImportList(e.target.value);
        });

        showModal({
          title: 'Import Tasklist',
          content,
          actions: [{ label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() }]
        });
      });

      tc.querySelectorAll('.btn-duplicate-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const path = e.currentTarget.dataset.path.split('-').map(Number);
          const nodeToCopy = getTaskByPath(job.tasks, path);

          function cloneNode(node, isRootCopy) {
            return {
              ...node,
              id: store.generateId(),
              name: node.name + (isRootCopy ? ' (Copy)' : ''),
              progress: 0,
              status: 'Not Started',
              subTasks: node.subTasks ? node.subTasks.map(child => cloneNode(child, false)) : []
            };
          }

          const cloned = cloneNode(nodeToCopy, true);

          if (path.length === 1) {
            job.tasks.splice(path[0] + 1, 0, cloned);
          } else {
            const parentPath = path.slice(0, -1);
            const parent = getTaskByPath(job.tasks, parentPath);
            parent.subTasks.splice(path[path.length - 1] + 1, 0, cloned);
            updateParentProgress(job.tasks, parentPath);
          }
          renderTabContent();
        });
      });

      tc.querySelectorAll('.btn-book-time').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const path = e.currentTarget.dataset.path.split('-').map(Number);
          const node = getTaskByPath(job.tasks, path);
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

          const allTimesheets = store.getAll('timesheets').filter(t => t.jobId === id);
          const techs = store.getAll('technicians');

          const now = new Date();
          const p = n => n.toString().padStart(2, '0');
          const dateStr = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
          const startStr = `${dateStr}T09:00`;
          const finishStr = `${dateStr}T10:00`;

          const content = document.createElement('div');
          content.innerHTML = `
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${allTimesheets.reduce((s, t) => s + (t.hours || 0), 0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${allTimesheets.length ? allTimesheets.map(t => `
                      <tr>
                        <td>${t.startTime ? new Date(t.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(t.date).toLocaleDateString()}</td>
                        <td>${escapeHTML(t.technicianName)}</td>
                        <td>${escapeHTML(t.taskName || t.phaseName || '—')}</td>
                        <td style="font-weight:600">${t.hours}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${startStr}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${finishStr}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${techs.map(t => `<option value="${t.id}" ${t.name === currentUser.name ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
            `;

          showModal({
            title: 'Book Time: ' + escapeHTML(node.name),
            size: 'modal-70',
            content: content,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
              {
                label: 'Log Time', className: 'btn-primary', onClick: (close) => {
                  const startVal = document.getElementById('bt-start').value;
                  const finishVal = document.getElementById('bt-finish').value;
                  const techId = document.getElementById('bt-tech').value;
                  const desc = node.name;

                  if (!startVal || !finishVal || !techId) {
                    showToast('Please fill all required fields', 'error');
                    return;
                  }

                  const startDate = new Date(startVal);
                  const finishDate = new Date(finishVal);

                  if (finishDate <= startDate) {
                    showToast('Finish time must be after start time', 'error');
                    return;
                  }

                  const hours = Math.round(((finishDate - startDate) / 3600000) * 100) / 100;
                  const tech = techs.find(t => t.id === techId);

                  store.create('timesheets', {
                    jobId: id,
                    jobNumber: job.number,
                    taskId: node.id,
                    taskPath: path.join('-'),
                    taskName: node.name,
                    phaseId: node.id,
                    phaseName: node.name,
                    technicianId: techId,
                    technicianName: tech.name,
                    date: startVal.split('T')[0],
                    startTime: startVal,
                    finishTime: finishVal,
                    description: desc,
                    hours,
                    status: 'Pending'
                  });

                  showToast('Time booked successfully', 'success');
                  renderTabContent();
                  close();
                }
              }
            ]
          });
        });
      });
    } else if (activeTab === 'costs') {
      // Auto-pull materials from quote if empty
      if (!job.materials) {
        const linkedQuotes = store.getAll('quotes').filter(q => q.jobId === id || job.quoteId === q.id);
        const acceptedQuote = linkedQuotes.find(q => q.status === 'Accepted') || store.getById('quotes', job.quoteId);

        if (acceptedQuote) {
          const items = [];
          if (acceptedQuote.sections && Array.isArray(acceptedQuote.sections)) {
            acceptedQuote.sections.forEach(sec => {
              if (sec.lineItems && Array.isArray(sec.lineItems)) {
                items.push(...sec.lineItems);
              }
            });
          }
          if (acceptedQuote.lineItems && Array.isArray(acceptedQuote.lineItems)) {
            items.push(...acceptedQuote.lineItems);
          }

          if (items.length > 0) {
            job.materials = [];
            items.forEach(item => {
              if (item.type === 'material') {
                const sMatch = store.getAll('stock').find(s => s.name === item.description);
                job.materials.push({
                  stockId: sMatch ? sMatch.id : null,
                  name: item.description || 'Unknown Material',
                  quantity: item.qty || 1,
                  unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : 0,
                  fromQuote: true
                });
              }
            });
            store.update('jobs', id, { materials: job.materials });
          }
        }
      }
      if (!job.materials) job.materials = [];

      // Auto-calculate labor from timesheets
      const timesheets = store.getAll('timesheets').filter(t => t.jobId === id);
      const allTechs = store.getAll('technicians');
      const loggedLabor = {};
      let totalLoggedHours = 0;
      let totalLaborCost = 0;

      timesheets.forEach(t => {
        if (!loggedLabor[t.technicianId]) {
          const tech = allTechs.find(x => x.id === t.technicianId);
          loggedLabor[t.technicianId] = {
            id: t.technicianId,
            name: t.technicianName || (tech ? tech.name : 'Unknown Tech'),
            hours: 0,
            rate: tech ? (tech.payRate || tech.hourlyRate || 45) : 45
          };
        }
        loggedLabor[t.technicianId].hours += (t.hours || 0);
      });
      const autoTechs = Object.values(loggedLabor);
      autoTechs.forEach(t => {
        totalLoggedHours += t.hours;
        totalLaborCost += (t.hours * t.rate);
      });

      // ---- NEW: Calculate Asset Recovery Costs ----
      const assetUsage = store.getAll('assetUsage').filter(au => au.jobId === id);
      const allAssets = store.getAll('assets');
      let totalAssetCost = 0;
      const usageList = assetUsage.map(au => {
        const asset = allAssets.find(a => a.id === au.assetId);
        const rate = au.recoveryRate || (asset ? asset.recoveryRate : 0) || 0;
        const cost = au.hours * rate;
        totalAssetCost += cost;
        return { ...au, rate, cost };
      });

      // Determine material cost (Internal)
      const matCost = job.materials.reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
      const additionalMatCost = parseFloat(job.additionalMaterialCost || 0);
      const totalMatCost = matCost + additionalMatCost;

      // Determine billable material cost (with markup tiers)
      const settings = store.getSettings();
      const billableMatTotal = calculateTotalBillableMaterials(job.materials, settings);
      // For additional costs, we apply the default markup or minimum
      const billableAdditional = calculateBillableMaterialPrice(additionalMatCost, settings);
      const totalBillableMat = billableMatTotal + (additionalMatCost > 0 ? billableAdditional - additionalMatCost : 0) + additionalMatCost;

      // Update job properties silently if they changed
      if (job.laborCost !== totalLaborCost || job.estimatedHours !== totalLoggedHours || job.materialCost !== totalMatCost || job.assetCost !== totalAssetCost) {
        job.laborCost = totalLaborCost;
        job.estimatedHours = totalLoggedHours;
        job.materialCost = totalMatCost;
        job.assetCost = totalAssetCost;
        store.update('jobs', id, {
          laborCost: totalLaborCost,
          estimatedHours: totalLoggedHours,
          materialCost: totalMatCost,
          assetCost: totalAssetCost
        });
      }

      const currentProfile = settings.laborRates.find(r => r.id === job.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
      const billableLabor = totalLoggedHours * (currentProfile ? currentProfile.rate : 85);
      const minFee = currentProfile ? (currentProfile.minCallOutFee || 0) : 0;
      const finalBillableLabor = Math.max(billableLabor, minFee);
      const billableTotal = finalBillableLabor + totalBillableMat;

      // True Profit = Revenue - (Labor Cost + Material Cost + Asset Recovery)
      const totalInternalCost = totalLaborCost + totalMatCost + totalAssetCost;
      const profit = billableTotal - totalInternalCost;
      const margin = billableTotal > 0 ? (profit / billableTotal) * 100 : 0;

      const linkedQuotes = store.getAll('quotes').filter(q => q.jobId === id || job.quoteId === q.id || q.number === job.quoteNumber);
      const acceptedQuote = linkedQuotes.find(q => q.status === 'Accepted') || (job.quoteId ? store.getById('quotes', job.quoteId) : null);

      let estLabor = 0;
      let estMaterial = 0;
      if (acceptedQuote) {
        const items = [];
        if (acceptedQuote.sections && Array.isArray(acceptedQuote.sections)) {
          acceptedQuote.sections.forEach(sec => {
            if (sec.lineItems && Array.isArray(sec.lineItems)) {
              items.push(...sec.lineItems);
            }
          });
        }
        if (acceptedQuote.lineItems && Array.isArray(acceptedQuote.lineItems)) {
          items.push(...acceptedQuote.lineItems);
        }
        
        items.forEach(item => {
          const itemAmt = parseFloat(item.total) || ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0));
          if (item.type === 'labor') {
            estLabor += itemAmt;
          } else if (item.type === 'material') {
            estMaterial += itemAmt;
          }
        });
      }
      if (estLabor === 0 && estMaterial === 0) {
        estLabor = parseFloat(job.estimatedLaborCost || job.laborCost || 0);
        estMaterial = parseFloat(job.estimatedMaterialCost || job.materialCost || 0);
      }

      const estTotal = estLabor + estMaterial;
      const actLabor = totalLaborCost;
      const actMaterial = totalMatCost;
      const actAsset = totalAssetCost;
      const actTotal = actLabor + actMaterial + actAsset;
      const varianceLabor = actLabor - estLabor;
      const varianceMaterial = actMaterial - estMaterial;
      const varianceTotal = actTotal - estTotal;

      tc.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
          
          <!-- Budget Deviation Tracker Card -->
          <div class="card" style="border: 1.5px solid ${varianceTotal > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:${varianceTotal > 0 ? 'rgba(239,68,68,0.02)' : 'rgba(16,185,129,0.02)'}; padding: 12px 16px">
              <h4 style="margin:0; color:${varianceTotal > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)'}; display:flex; align-items:center; gap:8px">
                <span class="material-icons-outlined" style="font-size:20px">analytics</span>
                Budget Deviation & Costs Tracker
              </h4>
              <span class="badge ${varianceTotal > 0 ? 'badge-danger' : 'badge-success'}" style="font-weight:700">
                ${varianceTotal > 0 ? 'Over Budget' : 'Under Budget'}
              </span>
            </div>
            <div class="card-body" style="padding: 16px">
              ${varianceTotal > 0 ? `
                <div style="display:flex; align-items:center; gap:12px; background:rgba(239,68,68,0.08); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; margin-bottom:16px; color:#c53030">
                  <span class="material-icons-outlined" style="font-size:20px">warning</span>
                  <div style="font-size:13px">
                    <strong>Budget Overrun Detected</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Actual expenses have exceeded the quoted estimation by <strong>$${varianceTotal.toFixed(2)}</strong>. Customer approval may be required for additional variations.</div>
                  </div>
                </div>
              ` : `
                <div style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.08); border-left:4px solid var(--color-success); padding:12px; border-radius:4px; margin-bottom:16px; color:#2f855a">
                  <span class="material-icons-outlined" style="font-size:20px">check_circle</span>
                  <div style="font-size:13px">
                    <strong>Expenses Within Quoted Budget</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Current expenses are within the original quoted estimation. Remaining budget margin: <strong>$${Math.abs(varianceTotal).toFixed(2)}</strong>.</div>
                  </div>
                </div>
              `}

              <!-- Visual Progress Comparison Bar -->
              <div style="margin-bottom:18px">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; font-weight:600; color:var(--text-secondary)">
                  <span>Quoted Estimate ($${estTotal.toFixed(2)})</span>
                  <span>Actual Expenses ($${actTotal.toFixed(2)})</span>
                </div>
                <div style="width:100%; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:flex">
                  ${(() => {
                    const percent = estTotal > 0 ? Math.min(100, Math.round((actTotal / estTotal) * 100)) : 100;
                    const isOver = actTotal > estTotal;
                    const barColor = isOver ? 'var(--color-danger)' : 'var(--color-success)';
                    return `
                      <div style="width:${percent}%; background:${barColor}; height:100%; transition:width 0.4s ease; border-radius:6px"></div>
                      ${isOver ? `<div style="flex:1; background:rgba(239,68,68,0.25); height:100%"></div>` : ''}
                    `;
                  })()}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:var(--text-tertiary)">
                  <span>0%</span>
                  <span>Budget Utilization: ${estTotal > 0 ? Math.round((actTotal / estTotal) * 100) : 0}%</span>
                  <span>${estTotal > 0 && actTotal > estTotal ? `${Math.round((actTotal / estTotal) * 100)}% (Overspent)` : '100%'}</span>
                </div>
              </div>

              <!-- Itemized Variance Table -->
              <table class="data-table" style="font-size:13px; margin:0">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th style="text-align:right">Quoted Estimate</th>
                    <th style="text-align:right">Actual Spent</th>
                    <th style="text-align:right">Variance / Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight:600">Labor Pay</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${estLabor.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${actLabor.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${varianceLabor > 0 ? 'var(--color-danger)' : varianceLabor < 0 ? 'var(--color-success-dark)' : 'var(--text-tertiary)'}">
                      ${varianceLabor > 0 ? `+$${varianceLabor.toFixed(2)}` : varianceLabor < 0 ? `-$${Math.abs(varianceLabor).toFixed(2)}` : '$0.00'}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Material Costs</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${estMaterial.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${actMaterial.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${varianceMaterial > 0 ? 'var(--color-danger)' : varianceMaterial < 0 ? 'var(--color-success-dark)' : 'var(--text-tertiary)'}">
                      ${varianceMaterial > 0 ? `+$${varianceMaterial.toFixed(2)}` : varianceMaterial < 0 ? `-$${Math.abs(varianceMaterial).toFixed(2)}` : '$0.00'}
                    </td>
                  </tr>
                  ${actAsset > 0 ? `
                    <tr>
                      <td style="font-weight:600">Asset Recovery (Van/Tools)</td>
                      <td style="text-align:right; color:var(--text-secondary)">$0.00</td>
                      <td style="text-align:right; font-weight:600">$${actAsset.toFixed(2)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--color-danger)">+$${actAsset.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color); font-weight:700">
                    <td>Total Job Expenses</td>
                    <td style="text-align:right">$${estTotal.toFixed(2)}</td>
                    <td style="text-align:right; color:var(--color-primary)">$${actTotal.toFixed(2)}</td>
                    <td style="text-align:right; color:${varianceTotal > 0 ? 'var(--color-danger)' : varianceTotal < 0 ? 'var(--color-success-dark)' : 'var(--text-tertiary)'}">
                      ${varianceTotal > 0 ? `+$${varianceTotal.toFixed(2)}` : varianceTotal < 0 ? `-$${Math.abs(varianceTotal).toFixed(2)}` : '$0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div class="grid-2">
          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4 style="margin:0">Technicians & Internal Cost</h4>
              <div style="font-size:12px; color:var(--text-secondary); background:var(--bg-color); padding:4px 8px; border-radius:4px; border:1px solid var(--border-color)">
                Actual Cost (Tech Pay)
              </div>
            </div>
            <div class="card-body">
              <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                Labor costs are based on individual technician pay rates.
              </div>
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th style="width:80px">Hours</th>
                    <th style="width:80px">Pay Rate</th>
                    <th style="width:100px">Actual Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${autoTechs.map(t => `
                    <tr>
                      <td>${escapeHTML(t.name)}</td>
                      <td style="font-weight:600">${t.hours.toFixed(2)}</td>
                      <td>$${(t.payRate || t.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(t.hours * (t.payRate || t.rate)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  ${autoTechs.length === 0 ? '<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4 style="margin:0">Asset Recovery</h4>
              <div style="font-size:12px; color:var(--text-secondary); background:var(--bg-color); padding:4px 8px; border-radius:4px; border:1px solid var(--border-color)">
                Internal Recovery (Tool/Van)
              </div>
            </div>
            <div class="card-body">
              <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                Calculated as (Asset Recovery Rate × Hours Used).
              </div>
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th style="width:80px">Hours</th>
                    <th style="width:80px">Rate</th>
                    <th style="width:100px">Recovery</th>
                  </tr>
                </thead>
                <tbody>
                  ${usageList.map(u => `
                    <tr>
                      <td>${escapeHTML(u.assetName)}</td>
                      <td style="font-weight:600">${u.hours.toFixed(2)}</td>
                      <td>$${u.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${u.cost.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  ${usageList.length === 0 ? '<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>' : ''}
                </tbody>
                ${usageList.length > 0 ? `
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${totalAssetCost.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                ` : ''}
              </table>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header"><h4>Billing & Labor Profiles</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Labour Rate Profile (Billable)</label>
                <select class="form-select" id="inp-labor-profile">
                  ${settings.laborRates.map(r => `<option value="${r.id}" ${currentProfile.id === r.id ? 'selected' : ''}>${r.name} ($${r.rate.toFixed(2)}/hr)</option>`).join('')}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${currentProfile.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(currentProfile.minCallOutFee || 0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${finalBillableLabor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
            <div class="card">
              <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
                <h4 style="margin:0">Material Costs</h4>
                <button class="btn btn-ghost btn-sm" id="btn-refresh-materials" title="Sync materials with the linked quote">
                  <span class="material-icons-outlined" style="font-size:16px; margin-right:4px;">sync</span> Sync Quote
                </button>
              </div>
              <div class="card-body">
                <div id="materials-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                  ${job.materials.map((m, i) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${escapeHTML(m.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${m.quantity} x $${(m.unitCost || 0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(m.quantity * (m.unitCost || 0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${i}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join('')}
                  ${(job.materials.length === 0) ? '<div class="text-secondary" style="font-size:14px">No materials added.</div>' : ''}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${getStockOptionsHtml()}
                  </select>
                  <input type="number" class="form-input" id="mat-qty" value="1" min="1" style="flex:1" />
                  <button class="btn btn-primary" id="btn-add-material">Add Item</button>
                </div>
                <div class="form-group" style="margin-top:16px;margin-bottom:0">
                  <label class="form-label">Manual Add. Cost ($) (Permits, Travel, etc.)</label>
                  <input type="number" class="form-input" id="inp-material-cost" value="${job.additionalMaterialCost || 0}" step="0.01" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Job Cost Summary</h4></div>
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Logged Hours</span><span class="font-medium">${totalLoggedHours.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(totalLaborCost + totalMatCost).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${billableTotal.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${profit >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)'}; color:${profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${profit.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${margin.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      `;

      tc.querySelector('#inp-labor-profile')?.addEventListener('change', (e) => {
        job.laborRateProfileId = e.target.value;
        store.update('jobs', id, { laborRateProfileId: job.laborRateProfileId });
        renderTabContent();
      });

      tc.addEventListener('click', (e) => {
        const removeMatBtn = e.target.closest('.btn-remove-mat');
        if (removeMatBtn) {
          const idx = parseInt(removeMatBtn.dataset.index);
          job.materials.splice(idx, 1);
          renderTabContent();
        }
      });

      tc.querySelector('#btn-refresh-materials')?.addEventListener('click', () => {
        const linkedQuotes = store.getAll('quotes').filter(q => q.jobId === id || job.quoteId === q.id);
        const acceptedQuote = linkedQuotes.find(q => q.status === 'Accepted') || store.getById('quotes', job.quoteId);

        if (!acceptedQuote) {
          showToast('No linked accepted quote found.', 'error');
          return;
        }

        const manualItems = (job.materials || []).filter(m => !m.fromQuote);
        const newQuoteItems = [];

        const items = [];
        if (acceptedQuote.sections && Array.isArray(acceptedQuote.sections)) {
          acceptedQuote.sections.forEach(sec => {
            if (sec.lineItems && Array.isArray(sec.lineItems)) {
              items.push(...sec.lineItems);
            }
          });
        }
        if (acceptedQuote.lineItems && Array.isArray(acceptedQuote.lineItems)) {
          items.push(...acceptedQuote.lineItems);
        }

        items.forEach(item => {
          if (item.type === 'material') {
            const sMatch = store.getAll('stock').find(s => s.name === item.description);
            newQuoteItems.push({
              stockId: sMatch ? sMatch.id : null,
              name: item.description || 'Unknown Material',
              quantity: item.qty || 1,
              unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : 0,
              fromQuote: true
            });
          }
        });

        job.materials = [...newQuoteItems, ...manualItems];
        store.update('jobs', id, { materials: job.materials });
        showToast('Materials refreshed from Quote', 'success');
        renderTabContent();
      });

      function updateMaterialCostLive() {
        const addedMat = (job.materials || []).reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
        const addCost = parseFloat(tc.querySelector('#inp-material-cost').value) || 0;
        const m = addedMat + addCost;
        tc.querySelector('#sum-mat').textContent = '$' + m.toFixed(2);
        tc.querySelector('#sum-total').textContent = '$' + (totalLaborCost + m).toFixed(2);
      }

      tc.querySelector('#inp-material-cost')?.addEventListener('input', updateMaterialCostLive);

      tc.querySelector('#btn-add-material')?.addEventListener('click', () => {
        const matSel = tc.querySelector('#mat-select');
        const qty = parseInt(tc.querySelector('#mat-qty').value) || 1;
        const val = matSel.value;
        if (!val) return;

        const [stockId, locationName] = val.split('::');
        const stockItem = store.getById('stock', stockId);
        if (!stockItem) return;

        // Find quantity at the specific location
        let availableQty = 0;
        let locObj = null;
        if (stockItem.locations && Array.isArray(stockItem.locations)) {
          locObj = stockItem.locations.find(l => l.location === locationName);
          availableQty = locObj ? locObj.quantity : 0;
        } else {
          availableQty = stockItem.quantity || 0;
        }

        if (availableQty < qty) {
          showToast(`Not enough stock at ${locationName}. Available: ${availableQty}`, 'error');
          return;
        }

        // Deduct from stock at the specific location
        if (locObj) {
          locObj.quantity -= qty;
          stockItem.locations = stockItem.locations.filter(l => l.quantity > 0);
          stockItem.quantity = stockItem.locations.reduce((sum, l) => sum + l.quantity, 0);
          stockItem.location = stockItem.locations[0]?.location || 'Main Warehouse';
        } else {
          stockItem.quantity -= qty;
        }
        
        store.update('stock', stockId, stockItem);
        cachedStockOptionsHtml = null; // Invalidate cache

        // Add to job materials
        job.materials.push({
          stockId: stockItem.id,
          name: `${stockItem.name} (${locationName})`,
          quantity: qty,
          unitCost: stockItem.costPrice || stockItem.unitPrice || 0,
          fromQuote: false
        });

        showToast(`Added ${qty}x ${stockItem.name} from ${locationName}`, 'success');
        renderTabContent();
      });

      tc.querySelector('#btn-save-costs')?.addEventListener('click', () => {
        const addCost = parseFloat(tc.querySelector('#inp-material-cost').value) || 0;
        const addedMat = (job.materials || []).reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
        const mat = addedMat + addCost;

        job.materialCost = mat;
        job.additionalMaterialCost = addCost;

        store.update('jobs', id, {
          materials: job.materials,
          materialCost: mat,
          additionalMaterialCost: addCost
        });
        showToast('Additional costs saved', 'success');
        renderTabContent();
      });
    } else if (activeTab === 'quotes') {
      const linkedQuotes = store.getAll('quotes').filter(q => q.jobId === id || job.quoteId === q.id);

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
             <h4>Associated Quotes</h4>
             <button class="btn btn-primary btn-sm" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${linkedQuotes.length ? linkedQuotes.map(q => `
                  <tr>
                    <td><a href="#/quotes/${q.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${escapeHTML(q.number)}</a></td>
                    <td>${escapeHTML(q.title || 'Untitled Quote')}</td>
                    <td><span class="badge ${q.status === 'Accepted' ? 'badge-success' : (q.status === 'Declined' ? 'badge-danger' : (q.status === 'Sent' ? 'badge-info' : 'badge-neutral'))}">${escapeHTML(q.status)}</span></td>
                    <td style="font-weight:600">$${(q.total || 0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${q.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-new-quote')?.addEventListener('click', () => {
        const newQ = store.create('quotes', {
          customerId: job.customerId,
          customerName: job.customerName,
          title: job.title,
          jobId: job.id,
          status: 'Draft',
          version: 1,
          sections: [{ id: store.generateId(), name: 'Main Phase', lineItems: [] }],
          subtotal: 0, tax: 0, total: 0,
          number: 'Q-' + Date.now().toString().slice(-7)
        });
        showToast('Draft quote created', 'success', { link: `/quotes/${newQ.id}` });
        router.navigate('/quotes/' + newQ.id);
      });
    } else if (activeTab === 'activity') {
      if (!job.activityLog) job.activityLog = [];
      // Migrate old logs
      job.activityLog = job.activityLog.map(l => {
        if (l.type === 'note' || l.type === 'attachment') {
          return {
            id: l.id,
            type: 'combined',
            date: l.date,
            content: l.type === 'note' ? l.content : '',
            files: l.type === 'attachment' ? [l.file] : []
          };
        }
        return l;
      });

      tc.innerHTML = `
        <div class="card" style="max-width:800px;margin-bottom:var(--space-lg)">
          <div class="card-body">
            <div style="display:flex;gap:8px;margin-bottom:var(--space-base)">
              <input type="text" class="form-input" id="new-note-input" placeholder="Type a new note..." style="flex:1" />
              <label class="btn btn-secondary" for="upload-attachment" style="cursor:pointer">
                <span class="material-icons-outlined" style="font-size:16px">attach_file</span> Attach
                <input type="file" id="upload-attachment" style="display:none" multiple accept="image/*,.pdf,.doc,.docx" />
              </label>
              <button class="btn btn-primary" id="btn-add-note">Post</button>
            </div>
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${stagedFiles.length ? '16px' : '0'}">
              ${stagedFiles.map((f, i) => `
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${escapeHTML(f.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${i}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join('')}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${job.activityLog.length ? job.activityLog.map((log, i) => `
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${(log.files && log.files.length) ? 'attachment' : 'chat_bubble_outline'}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
                      <div style="display:flex;gap:6px;align-items:center;">
                        <span style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-primary)">${escapeHTML(log.author || 'System')}</span>
                        <span class="text-tertiary" style="font-size:10px">•</span>
                        <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(log.date).toLocaleString()}</span>
                      </div>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${escapeHTML(log.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${log.content ? `<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${escapeHTML(log.content)}</div>` : ''}
                      ${log.files && log.files.length ? `
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${log.files.map(f => `
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${f.type && f.type.startsWith('image/') ?
          `<div style="width:40px;height:40px;background:url('${escapeHTML(f.data)}') center/cover;border-radius:4px"></div>` :
          `<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>`
        }
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${escapeHTML(f.name)}">${escapeHTML(f.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(f.size / 1024).toFixed(1)} KB</div>
                               </div>
                             </div>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                    <div class="expand-overlay" style="display:none; position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent, var(--content-bg));align-items:flex-end;justify-content:center;padding-bottom:4px;cursor:pointer;border-bottom-left-radius:var(--border-radius);border-bottom-right-radius:var(--border-radius)">
                       <span class="text-primary font-medium" style="font-size:12px">Expand to view</span>
                    </div>
                  </div>
                </div>
              `).join('') : '<div class="text-secondary text-center" style="padding:24px">No activity yet.</div>'}
            </div>
          </div>
        </div>
      `;

      // Show/Hide expand buttons based on content height
      setTimeout(() => {
        tc.querySelectorAll('.activity-log-item').forEach(item => {
          const wrapper = item.querySelector('.activity-content-wrapper');
          const overlay = item.querySelector('.expand-overlay');
          if (wrapper && wrapper.scrollHeight > 200) {
            overlay.style.display = 'flex';
            item.style.paddingBottom = '32px'; // make room for the overlay
            overlay.addEventListener('click', () => {
              if (item.dataset.expanded === 'false') {
                wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
                overlay.style.background = 'transparent';
                overlay.innerHTML = '<span class="text-primary font-medium" style="font-size:12px">Collapse</span>';
                item.dataset.expanded = 'true';
              } else {
                wrapper.style.maxHeight = '200px';
                overlay.style.background = 'linear-gradient(transparent, var(--content-bg))';
                overlay.innerHTML = '<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>';
                item.dataset.expanded = 'false';
              }
            });
          }
        });
      }, 0);

      tc.querySelectorAll('.btn-remove-staged').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          stagedFiles.splice(idx, 1);
          renderTabContent();
        });
      });

      tc.querySelector('#btn-add-note')?.addEventListener('click', () => {
        const val = tc.querySelector('#new-note-input').value.trim();
        if (!val && !stagedFiles.length) return;

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        job.activityLog.unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'combined',
          content: val,
          files: [...stagedFiles],
          date: new Date().toISOString(),
          author: currentUser.name || 'Unknown User'
        });

        store.update('jobs', id, { activityLog: job.activityLog });
        stagedFiles = []; // clear staging
        renderTabContent();
      });

      tc.querySelector('#upload-attachment')?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        let processed = 0;
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            stagedFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              data: ev.target.result
            });
            processed++;
            if (processed === files.length) {
              renderTabContent();
            }
          };
          reader.readAsDataURL(file);
        });
      });

      tc.querySelectorAll('.btn-delete-activity').forEach(btn => {
        btn.addEventListener('click', () => {
          job.activityLog = job.activityLog.filter(l => l.id !== btn.dataset.id);
          store.update('jobs', id, { activityLog: job.activityLog });
          renderTabContent();
        });
      });
    } else if (activeTab === 'timesheets') {
      const timesheets = store.getAll('timesheets').filter(t => t.jobId === id);
      const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
      const techs = store.getAll('technicians');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${totalHours} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Task</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
              <tbody>
                      ${timesheets.length ? timesheets.map(t => {
        const isOwner = String(t.technicianId) === String(currentUser.id);
        const canEdit = ['admin', 'manager', 'office'].includes(currentUser.role) || (isOwner && t.status !== 'Approved');
        const canDelete = ['admin', 'manager', 'office'].includes(currentUser.role) || (isOwner && t.status !== 'Approved');
        return `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>${escapeHTML(t.technicianName)}</td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${escapeHTML(t.taskName || '—')}</span></td>
                    <td class="text-secondary">${escapeHTML(t.description || '—')}</td>
                    <td style="text-align:right;font-weight:600">${t.hours}</td>
                    <td><span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">${t.status}</span></td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${canEdit ? `
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${t.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:16px">edit</span>
                          </button>
                        ` : ''}
                        ${canDelete ? `
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-ts-job" data-id="${t.id}" title="Delete entry" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:16px">delete</span>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
      }).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelectorAll('.btn-edit-ts-job').forEach(btn => {
        btn.addEventListener('click', () => {
          const tsId = btn.dataset.id;
          showTimesheetEditModal(tsId, renderTabContent);
        });
      });

      tc.querySelectorAll('.btn-delete-ts-job').forEach(btn => {
        btn.addEventListener('click', () => {
          const tsId = btn.dataset.id;
          const ts = store.getById('timesheets', tsId);
          if (!ts) return;

          showModal({
            title: 'Confirm Delete',
            content: `<p>Are you sure you want to delete this timesheet entry for <strong>${ts.hours} hrs</strong>?</p>`,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
              {
                label: 'Delete', className: 'btn-danger', onClick: (close) => {
                  store.delete('timesheets', tsId);
                  showToast('Timesheet entry deleted successfully', 'success');
                  close();
                  renderTabContent();
                }
              }
            ]
          });
        });
      });

      tc.querySelector('#btn-log-time-tab')?.addEventListener('click', () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const now = new Date();
        const p = n => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;

        function getFlatTasks(tasks, currentPath = [], currentNamePath = []) {
          let result = [];
          if (!tasks) return result;
          tasks.forEach((p, i) => {
            const path = [...currentPath, i].join('-');
            const namePath = [...currentNamePath, p.name].join(' > ');
            result.push({ path, name: namePath, isLeaf: !p.subTasks || p.subTasks.length === 0 });
            if (p.subTasks) {
              result = result.concat(getFlatTasks(p.subTasks, [...currentPath, i], [...currentNamePath, p.name]));
            }
          });
          return result;
        }
        const flatTasks = getFlatTasks(job.tasks || []);
        const leafTasks = flatTasks.filter(t => t.isLeaf);

        const content = document.createElement('div');
        content.innerHTML = `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${dateStr}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech" ${currentUser.role === 'technician' ? 'disabled' : ''}>
                <option value="">Select tech...</option>
                ${techs.map(t => `<option value="${t.id}" ${t.name === currentUser.name ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: 1 / -1">
              <label class="form-label">Task *</label>
              <select class="form-select" id="lt-task" style="width:100%">
                <option value="">Select task...</option>
                ${leafTasks.map(t => `<option value="${t.path}">${escapeHTML(t.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Hours *</label>
              <input type="number" class="form-input" id="lt-hours" value="1" min="0.5" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="lt-desc" placeholder="Brief description..." />
            </div>
          </div>
        `;

        showDrawer({
          title: 'Log Time',
          content: content.outerHTML,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            {
              label: 'Save', className: 'btn-primary', onClick: (close) => {
                const dOverlay = document.querySelector('.drawer-overlay');
                const dateVal = dOverlay.querySelector('#lt-date').value;
                const techId = dOverlay.querySelector('#lt-tech').value;
                const taskPathVal = dOverlay.querySelector('#lt-task').value;
                const hoursVal = parseFloat(dOverlay.querySelector('#lt-hours').value);
                const descVal = dOverlay.querySelector('#lt-desc').value;

                if (!dateVal || !techId || isNaN(hoursVal) || !taskPathVal) {
                  showToast('Please fill all required fields, including the task', 'error');
                  return;
                }

                const tech = techs.find(t => t.id === techId);
                const selectedTask = leafTasks.find(t => t.path === taskPathVal);
                const taskNameVal = selectedTask ? selectedTask.name : '';

                store.create('timesheets', {
                  jobId: id,
                  jobNumber: job.number,
                  taskId: taskPathVal,
                  taskName: taskNameVal,
                  technicianId: techId,
                  technicianName: tech.name,
                  date: dateVal,
                  hours: hoursVal,
                  description: descVal,
                  status: 'Pending'
                });

                showToast('Time logged successfully', 'success');
                renderTabContent();
                close();
              }
            }
          ]
        });
      });
    } else if (activeTab === 'forms') {
      job.forms = job.forms || [];

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${job.forms.length ? job.forms.map(f => `
                  <tr>
                    <td class="font-medium">${escapeHTML(f.type)}</td>
                    <td>${new Date(f.date).toLocaleString()}</td>
                    <td>${escapeHTML(f.completedBy || 'System')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-form')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="form-group">
              <label class="form-label">Form Type</label>
              <select class="form-select" id="new-form-type">
                <option value="JSA (Job Safety Analysis)">JSA (Job Safety Analysis)</option>
                <option value="SWMS (Safe Work Method Statement)">SWMS (Safe Work Method Statement)</option>
                <option value="Site Inspection">Site Inspection</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Checklist Items</label>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked /> Hazards Identified</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked /> PPE Required</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" /> Tools Inspected</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" /> Site Secure</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" id="new-form-notes"></textarea>
            </div>
          `;
        showDrawer({
          title: 'Complete Form',
          content: content.outerHTML,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            {
              label: 'Submit', className: 'btn-primary', onClick: (close) => {
                const dOverlay = document.querySelector('.drawer-overlay');
                job.forms.push({
                  type: dOverlay.querySelector('#new-form-type').value,
                  notes: dOverlay.querySelector('#new-form-notes').value,
                  date: new Date().toISOString(),
                  completedBy: 'Current User' // Placeholder for logged-in user
                });
                store.update('jobs', id, { forms: job.forms });
                showToast('Form submitted successfully', 'success');
                renderTabContent();
                close();
              }
            }
          ]
        });
      });
    } else if (activeTab === 'pos') {
      const pos = store.getAll('purchaseOrders').filter(p => p.jobId === id);

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${pos.length ? pos.map(p => `
                  <tr>
                    <td><a href="#/purchase-orders/${escapeHTML(p.id)}">${escapeHTML(p.number)}</a></td>
                    <td>${escapeHTML(p.supplierName || '—')}</td>
                    <td>${p.issueDate ? new Date(p.issueDate).toLocaleDateString() : '—'}</td>
                    <td style="font-weight:600;">$${(p.total || 0).toFixed(2)}</td>
                    <td><span class="badge ${p.status === 'Received' ? 'badge-success' : p.status === 'Draft' ? 'badge-neutral' : p.status === 'Cancelled' ? 'badge-danger' : 'badge-primary'}">${p.status}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-raise-po')?.addEventListener('click', () => {
        const suppliers = store.getAll('suppliers') || [];
        const activeSuppliers = suppliers.filter(s => s.active !== false);
        const stockItems = store.getAll('stock');

        const content = document.createElement('div');
        content.innerHTML = `
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select class="form-select" id="po-supplier">
              <option value="">Select supplier...</option>
              ${activeSuppliers.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${stockItems.map(s => `<option value="${s.id}">${s.name} - $${s.costPrice || 0}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input type="number" class="form-input" id="po-qty" value="1" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Expected Date</label>
              <input type="date" class="form-input" id="po-date" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>
        `;

        showDrawer({
          title: 'Quick Purchase Order',
          content: content.outerHTML, // Pass HTML string or handle element appending
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            {
              label: 'Create PO', className: 'btn-primary', onClick: (close) => {
                // Note: showDrawer content is recreated via innerHTML, so we must query the document
                const dOverlay = document.querySelector('.drawer-overlay');
                const supplier = dOverlay.querySelector('#po-supplier').value;
                const partId = dOverlay.querySelector('#po-part').value;
                const qty = parseInt(dOverlay.querySelector('#po-qty').value) || 1;
                const date = dOverlay.querySelector('#po-date').value;

                if (!supplier || !partId) {
                  showToast('Supplier and Part are required', 'error');
                  return;
                }

                const part = stockItems.find(s => s.id === partId);

                const po = store.create('purchaseOrders', {
                  number: `PO-${Date.now().toString().slice(-5)}`,
                  jobId: id,
                  supplierName: supplier,
                  issueDate: new Date().toISOString(),
                  expectedDate: date,
                  status: 'Draft',
                  items: [{ stockId: partId, name: part.name, quantity: qty, unitCost: part.costPrice || 0, total: (part.costPrice || 0) * qty }],
                  total: (part.costPrice || 0) * qty
                });

                showToast('Quick PO Created', 'success', { link: `/purchase-orders/${po.id}` });
                renderTabContent();
                close();
              }
            }
          ]
        });
      });
    } else if (activeTab === 'invoices') {
      const invoices = store.getAll('invoices').filter(i => i.jobId === id);

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Invoices</h4>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-secondary" id="btn-create-deposit-invoice">Create Deposit Invoice</button>
              <button class="btn btn-sm btn-secondary" id="btn-create-progress-invoice">Create Progress Invoice</button>
              <button class="btn btn-sm btn-primary" id="btn-create-standard-invoice"><span class="material-icons-outlined" style="font-size:16px;">add</span> Create Standard Invoice</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Number</th><th>Type</th><th>Issue Date</th><th>Due Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${invoices.length ? invoices.map(i => `
                  <tr>
                    <td><a href="#/invoices/${escapeHTML(i.id)}">${escapeHTML(i.number)}</a></td>
                    <td><span class="badge badge-neutral">${escapeHTML(i.invoiceType || 'Standard')}</span></td>
                    <td>${i.issueDate ? i.issueDate.split('T')[0] : '—'}</td>
                    <td>${i.dueDate ? i.dueDate.split('T')[0] : '—'}</td>
                    <td style="font-weight:600;">$${(i.total || 0).toFixed(2)}</td>
                    <td><span class="badge ${i.status === 'Paid' ? 'badge-success' : i.status === 'Draft' ? 'badge-neutral' : i.status === 'Overdue' ? 'badge-danger' : 'badge-info'}">${i.status}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;



      tc.querySelector('#btn-create-standard-invoice')?.addEventListener('click', () => {
        const { sections, subtotal } = getJobInvoiceData();
        createDraftInvoice('Standard', sections, subtotal);
      });

      tc.querySelector('#btn-create-deposit-invoice')?.addEventListener('click', () => {
        const sections = [{
          id: store.generateId(),
          name: 'Deposit',
          lineItems: [{ description: `Deposit for Job ${job.number}`, type: 'other', qty: 1, rate: 0, total: 0 }],
          subtotal: 0
        }];
        createDraftInvoice('Deposit', sections, 0);
      });

      tc.querySelector('#btn-create-progress-invoice')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `;
        showModal({
          title: 'Create Progress Invoice',
          content,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            {
              label: 'Create', className: 'btn-primary', onClick: (close) => {
                const pct = parseFloat(document.getElementById('progress-percent').value) || 0;
                if (pct <= 0 || pct > 100) { showToast('Enter a valid percentage (1-100)', 'error'); return; }
                const { subtotal } = getJobInvoiceData();
                const partialAmount = subtotal * (pct / 100);
                const sections = [{
                  id: store.generateId(),
                  name: `Progress Payment (${pct}%)`,
                  lineItems: [{ description: `Progress Payment (${pct}% of job)`, type: 'other', qty: 1, rate: partialAmount, total: partialAmount }],
                  subtotal: partialAmount
                }];
                createDraftInvoice('Progress', sections, partialAmount);
                close();
              }
            }
          ]
        });
      });
    }
  }

  function bindEvents() {
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent();
      });
    });

    container.querySelector('#btn-edit-job')?.addEventListener('click', () => router.navigate(`/jobs/${id}/edit`));

    container.querySelector('#btn-header-generate-invoice')?.addEventListener('click', () => {
      const { sections, subtotal } = getJobInvoiceData();
      createDraftInvoice('Standard', sections, subtotal);
    });

    // Field Technician Log Board submit handler was removed as techs can log travel/labor to a subtask named Travel under timesheets

    container.querySelector('#btn-delete-job')?.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `<p>Delete job <strong>${escapeHTML(job.number)}</strong>?</p>`;
      showModal({
        title: 'Delete Job', content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('jobs', id); showToast('Job deleted', 'success'); close(); router.navigate('/jobs'); } },
        ],
      });
    });

    // Invoice creation logic moved to Invoices tab
  }

  render();

  function r(label, value) {
    return `<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${label}</span><span>${value}</span></div>`;
  }
  function renderFormsTab(tc) {
    const instances = store.getAll('formInstances').filter(fi => fi.jobId === id);
    const templates = store.getAll('formTemplates');

    tc.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
          <h4 style="margin:0">Job Compliance Forms</h4>
          <button class="btn btn-primary btn-sm" id="btn-attach-form">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Attach Form
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th style="width:100px; text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${instances.map(fi => {
      const template = templates.find(t => t.id === fi.templateId);
      const isComplete = fi.status === 'Completed';
      const submitter = fi.submittedBy ? store.getById('people', fi.submittedBy) : null;
      return `
                  <tr>
                    <td class="font-medium">${escapeHTML(template?.name || 'Unknown Form')}</td>
                    <td><span class="badge ${isComplete ? 'badge-success' : 'badge-warning'}">${fi.status}</span></td>
                    <td>${submitter ? escapeHTML(`${submitter.firstName} ${submitter.lastName}`) : '—'}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${fi.submittedAt ? new Date(fi.submittedAt).toLocaleDateString() : '—'}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${isComplete ? 'btn-secondary' : 'btn-primary'} btn-sm fill-form" data-id="${fi.id}" title="${isComplete ? 'View / Edit' : 'Fill Form'}">
                          <span class="material-icons-outlined" style="font-size:16px">${isComplete ? 'visibility' : 'edit_note'}</span>
                        </button>
                        ${isComplete ? `
                          <button class="btn btn-secondary btn-icon btn-sm export-form" data-id="${fi.id}" title="Export Options">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </button>
                          <button class="btn btn-secondary btn-icon btn-sm print-form" data-id="${fi.id}" title="Print / PDF">
                            <span class="material-icons-outlined" style="font-size:18px">print</span>
                          </button>
                        ` : ''}
                        ${!isComplete ? `<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${fi.id}" style="color:var(--color-danger)" title="Remove Form"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
    }).join('')}
              ${!instances.length ? '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    tc.querySelector('#btn-attach-form').addEventListener('click', () => showAttachFormModal());

    tc.querySelectorAll('.fill-form').forEach(btn => {
      btn.addEventListener('click', () => showFillFormModal(btn.dataset.id));
    });

    tc.querySelectorAll('.remove-form-instance').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove this form from the job?')) {
          const fid = btn.dataset.id;
          const all = store.getAll('formInstances');
          store.save('formInstances', all.filter(i => i.id !== fid));
          renderFormsTab(tc);
        }
      });
    });

    tc.querySelectorAll('.export-form').forEach(btn => {
      btn.addEventListener('click', () => {
        const fi = store.getById('formInstances', btn.dataset.id);
        const template = store.getById('formTemplates', fi.templateId);
        const submitter = fi.submittedBy ? store.getById('people', fi.submittedBy) : null;
        
        const exportData = {
          ...fi,
          template,
          jobNumber: job.number,
          customerName: store.getById('people', job.customerId)?.companyName || 'Unknown Customer',
          submittedByName: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown Technician',
          number: `F-${job.number}-${fi.id.slice(3, 7).toUpperCase()}`
        };

        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'padding: 12px 0; display:flex; flex-direction:column; gap:16px';
        modalContent.innerHTML = `
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:8px">
            Select the format to export <strong>${escapeHTML(template.name)}</strong>:
          </div>
          <div style="display:grid; grid-template-columns: 1fr; gap:12px">
            <button class="btn btn-secondary" id="export-modal-pdf" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px">
              <span class="material-icons-outlined" style="color:#EF4444">picture_as_pdf</span>
              <span>Export as Print-Optimized PDF</span>
            </button>
            <button class="btn btn-secondary" id="export-modal-csv" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px">
              <span class="material-icons-outlined" style="color:#10B981">table_view</span>
              <span>Export as Spreadsheet CSV</span>
            </button>
            <button class="btn btn-secondary" id="export-modal-json" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px">
              <span class="material-icons-outlined" style="color:#1B6DE0">code</span>
              <span>Export as Developer JSON</span>
            </button>
          </div>
        `;

        showModal({
          title: 'Export Compliance Form',
          content: modalContent,
          actions: [{ label: 'Cancel', className: 'btn-secondary', onClick: c => c() }]
        });

        modalContent.querySelector('#export-modal-pdf').addEventListener('click', () => {
          document.querySelector('.modal-overlay')?.remove();
          import('../../components/PrintPreview.js').then(({ showPrintPreview }) => {
            showPrintPreview({
              type: 'form',
              data: exportData
            });
          });
        });

        modalContent.querySelector('#export-modal-csv').addEventListener('click', () => {
          document.querySelector('.modal-overlay')?.remove();
          import('../../components/PrintPreview.js').then(({ exportFormAsCSV }) => {
            exportFormAsCSV(exportData);
          });
        });

        modalContent.querySelector('#export-modal-json').addEventListener('click', () => {
          document.querySelector('.modal-overlay')?.remove();
          import('../../components/PrintPreview.js').then(({ exportFormAsJSON }) => {
            exportFormAsJSON(exportData);
          });
        });
      });
    });

    tc.querySelectorAll('.print-form').forEach(btn => {
      btn.addEventListener('click', () => {
        const fi = store.getById('formInstances', btn.dataset.id);
        const template = store.getById('formTemplates', fi.templateId);
        const submitter = fi.submittedBy ? store.getById('people', fi.submittedBy) : null;

        import('../../components/PrintPreview.js').then(({ showPrintPreview }) => {
          showPrintPreview({
            type: 'form',
            data: {
              ...fi,
              template,
              jobNumber: job.number,
              customerName: store.getById('people', job.customerId)?.companyName || 'Unknown Customer',
              submittedByName: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown Technician',
              number: `F-${job.number}-${fi.id.slice(3, 7).toUpperCase()}`
            }
          });
        });
      });
    });
  }

  function showAttachFormModal() {
    const allTemplates = store.getAll('formTemplates');
    const existingInstances = store.getAll('formInstances').filter(fi => fi.jobId === id);
    const existingTemplateIds = existingInstances.map(fi => fi.templateId);

    const content = document.createElement('div');
    content.style.minWidth = '450px';

    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px">
        ${allTemplates.map(t => {
      const alreadyAttached = existingTemplateIds.includes(t.id);
      return `
            <div class="card attach-template-item ${alreadyAttached ? 'disabled' : ''}" data-id="${t.id}" style="cursor:${alreadyAttached ? 'not-allowed' : 'pointer'}; opacity:${alreadyAttached ? '0.6' : '1'}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${escapeHTML(t.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(t.sections || []).reduce((sum, s) => sum + s.fields.length, 0)} fields</div>
                </div>
                ${alreadyAttached ? '<span class="badge badge-neutral">Already Attached</span>' : '<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `;
    }).join('')}
        ${!allTemplates.length ? '<div class="text-center text-tertiary">No templates available.</div>' : ''}
      </div>
    `;

    content.querySelectorAll('.attach-template-item:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const tid = el.dataset.id;
        const all = store.getAll('formInstances');
        all.push({
          id: 'fi_' + Math.random().toString(36).substr(2, 9),
          jobId: id,
          templateId: tid,
          responses: {},
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
        store.save('formInstances', all);
        showToast('Form attached to job', 'success');
        document.querySelector('.modal-overlay')?.remove();
        renderFormsTab(container.querySelector('#tab-content'));
      });
    });

    showModal({
      title: 'Attach Compliance Form',
      content,
      actions: [{ label: 'Cancel', className: 'btn-secondary', onClick: c => c() }]
    });
  }

  function showFillFormModal(instanceId) {
    const instances = store.getAll('formInstances');
    const fi = instances.find(i => i.id === instanceId);
    const template = store.getById('formTemplates', fi.templateId);
    const isComplete = fi.status === 'Completed';

    const content = document.createElement('div');

    content.innerHTML = `
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${escapeHTML(template.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${escapeHTML(template.description || '')}</div>
      </div>
      <form id="active-job-form">
        <div style="display:flex; flex-direction:column; gap:24px">
          ${(template.sections || []).map(sec => {
      const secCols = sec.columns || (sec.width === 'half' ? 1 : 2);
      if (sec.isSpacer) {
        const secHeight = sec.height ? (String(sec.height).endsWith('px') ? sec.height : sec.height + 'px') : '50px';
        return `<div style="width:100%; height: ${secHeight}"></div>`;
      }
      return `
            <div class="form-section" style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; overflow:hidden">
              <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color); border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${escapeHTML(sec.title)}</h4>
              </div>
              <div style="display:grid; grid-template-columns: repeat(${secCols}, 1fr); gap:16px; padding:16px">
                ${sec.fields.map(f => {
        const fSpan = Math.min(f.colSpan || (f.width === 'half' ? 1 : secCols), secCols);
        if (f.type === 'spacer' || f.type === 'blank') {
          const fHeight = f.height ? (String(f.height).endsWith('px') ? f.height : f.height + 'px') : '50px';
          return `<div style="grid-column: span ${fSpan}; height: ${f.type === 'blank' ? 'auto' : fHeight}"></div>`;
        }

        if (f.type === 'info') {
          return `
          <div class="form-group info-block" style="margin:0; grid-column: span ${fSpan}; padding:16px; background:rgba(27, 109, 224, 0.05); border-left:4px solid var(--color-primary); border-radius:4px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
            <div style="display:flex; gap:12px; align-items:flex-start">
              <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0; font-size:20px; margin-top:2px">info</span>
              <div>${escapeHTML(f.label).replace(/\n/g, '<br/>')}</div>
            </div>
          </div>
        `;
        }

        const val = fi.responses[f.id] || '';
        let fieldHtml = '';

        if (f.type === 'text') {
          fieldHtml = `<input class="form-input" name="${f.id}" value="${escapeHTML(val)}" ${f.required ? 'required' : ''} ${isComplete ? 'disabled' : ''} />`;
        } else if (f.type === 'textarea') {
          fieldHtml = `<textarea class="form-textarea" name="${f.id}" rows="3" ${f.required ? 'required' : ''} ${isComplete ? 'disabled' : ''}>${escapeHTML(val)}</textarea>`;
        } else if (f.type === 'checkbox') {
          fieldHtml = `
                       <label style="display:flex; align-items:center; gap:10px; cursor:${isComplete ? 'default' : 'pointer'}; opacity:${isComplete ? '0.7' : '1'}">
                         <input type="checkbox" name="${f.id}" ${val ? 'checked' : ''} style="width:18px; height:18px" ${isComplete ? 'disabled' : ''} />
                         <span style="font-size:14px">${escapeHTML(f.label)}</span>
                       </label>`;
        } else if (f.type === 'select') {
          fieldHtml = `
                       <select class="form-select" name="${f.id}" ${f.required ? 'required' : ''} ${isComplete ? 'disabled' : ''}>
                         <option value="">Select option...</option>
                         ${(f.options || []).map(opt => `<option value="${escapeHTML(opt)}" ${val === opt ? 'selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
                       </select>`;
        } else if (f.type === 'date') {
          fieldHtml = `<input type="date" class="form-input" name="${f.id}" value="${val}" ${f.required ? 'required' : ''} ${isComplete ? 'disabled' : ''} />`;
        } else if (f.type === 'signature') {
          fieldHtml = `
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${val ? `<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${escapeHTML(val)}</span>` : 'Digitally Signed on submission'}
                       </div>`;
        }

        return `
                    <div class="form-group" style="margin:0; grid-column: span ${fSpan}">
                      ${f.type !== 'checkbox' ? `<label class="form-label" style="font-weight:500">${escapeHTML(f.label)} ${f.required ? '<span style="color:var(--color-danger)">*</span>' : ''}</label>` : ''}
                      ${fieldHtml}
                    </div>
                  `;
      }).join('')}
              </div>
            </div>
          `;
    }).join('')}
        </div>
      </form>
    `;

    const saveResponses = (complete) => {
      const form = content.querySelector('#active-job-form');
      const responses = {};

      (template.sections || []).forEach(sec => {
        if (sec.isSpacer) return;
        sec.fields.forEach(f => {
          if (f.type === 'spacer' || f.type === 'info' || f.type === 'blank') return;

          if (f.type === 'checkbox') {
            const el = form.querySelector(`input[name="${f.id}"]`);
            responses[f.id] = el ? el.checked : false;
          } else {
            const el = form.querySelector(`[name="${f.id}"]`);
            responses[f.id] = el ? el.value : '';
          }

          if (complete && f.type === 'signature') {
            responses[f.id] = JSON.parse(localStorage.getItem('currentUser'))?.name || 'Unknown';
          }
        });
      });

      const currentInstances = store.getAll('formInstances');
      const idx = currentInstances.findIndex(i => i.id === instanceId);
      currentInstances[idx] = {
        ...currentInstances[idx],
        responses,
        status: complete ? 'Completed' : 'Pending',
        submittedBy: complete ? JSON.parse(localStorage.getItem('currentUser'))?.id : currentInstances[idx].submittedBy,
        submittedAt: complete ? new Date().toISOString() : currentInstances[idx].submittedAt
      };

      store.save('formInstances', currentInstances);
      showToast(complete ? 'Form submitted successfully' : 'Draft saved successfully', 'success');
      renderFormsTab(container.querySelector('#tab-content'));

      // Log activity
      const activity = store.getAll('activity') || [];
      activity.push({
        id: Date.now(),
        jobId: id,
        type: complete ? 'form_submission' : 'form_draft_saved',
        text: complete ? `Form "${template.name}" submitted.` : `Form "${template.name}" draft was saved.`,
        user: JSON.parse(localStorage.getItem('currentUser'))?.name,
        timestamp: new Date().toISOString()
      });
      store.save('activity', activity);
    };

    const actions = [];
    actions.push({ label: 'Cancel', className: 'btn-secondary', onClick: c => c() });

    if (!isComplete) {
      actions.push({
        label: 'Save Draft',
        className: 'btn-secondary',
        onClick: (close) => {
          saveResponses(false);
          close();
        }
      });
      actions.push({
        label: 'Complete & Sign',
        className: 'btn-primary',
        onClick: (close) => {
          const form = content.querySelector('#active-job-form');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          saveResponses(true);
          close();
        }
      });
    } else {
      actions.push({
        label: 'Update Form',
        className: 'btn-primary',
        onClick: (close) => {
          const form = content.querySelector('#active-job-form');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          saveResponses(true);
          close();
        }
      });
    }

    showModal({
      title: isComplete ? 'Edit Form Response' : 'Complete Job Form',
      content,
      size: 'modal-xl',
      actions
    });
  }
}

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { calculateBillableMaterialPrice, calculateTotalBillableMaterials } from '../../utils/pricing.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';

export function renderJobsList(container, params) {
  const customerId = params?.customerId;
  const customer = customerId ? store.getById('customers', customerId) : null;
  const allJobs = store.getAll('jobs');
  const jobs = customerId ? allJobs.filter(j => j.customerId === customerId) : allJobs;
  const canCreate = hasPermission('Jobs', 'create');

  const statusFromUrl = params?.status || (window.location.hash.includes('status=') ? decodeURIComponent(window.location.hash.split('status=')[1].split('&')[0].replace(/\+/g, ' ')) : '');
  let selectedStatus = statusFromUrl || '';

  const activeJobsCount = jobs.filter(j => !j.isRecurring && j.status !== 'Recurring Template').length;
  const recurringCount = jobs.filter(j => j.isRecurring || j.status === 'Recurring Template').length;

  const initialTitle = selectedStatus === 'Recurring Template' ? 'Recurring Templates & Contracts' : (customer ? `Jobs — ${escapeHTML(customer.company)}` : 'Jobs');

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1 id="jobs-page-title">${initialTitle}</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:180px; margin:0; align-self:center;">
          <option value="" ${!selectedStatus ? 'selected' : ''}>Active Jobs (${activeJobsCount})</option>
          <option value="ALL_WITH_TEMPLATES" ${selectedStatus === 'ALL_WITH_TEMPLATES' ? 'selected' : ''}>All Jobs & Templates (${jobs.length})</option>
          ${['Pending','Scheduled','In Progress','Completed','On Hold','Invoiced','Recurring Template'].map(s => `<option value="${s}" ${selectedStatus === s ? 'selected' : ''}>${s} (${s === 'Recurring Template' ? recurringCount : jobs.filter(j => j.status === s && !j.isRecurring).length})</option>`).join('')}
        </select>
        ${canCreate ? `
          <button class="btn btn-primary btn-sm" id="btn-new-job" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">${selectedStatus === 'Recurring Template' ? 'New Template' : 'New Job'}</span>
          </button>` : ''}
      </div>
    </div>
    <div id="jobs-table-container"></div>
  `;

  let filteredData = [...jobs];
  const sb = { 'Pending':'badge-warning','Scheduled':'badge-info','In Progress':'badge-primary','On Hold':'badge-neutral','Completed':'badge-success','Invoiced':'badge-primary','Recurring Template':'badge-purple' };
  const pb = { 'Low':'badge-neutral','Medium':'badge-warning','High':'badge-danger','Urgent':'badge-danger' };

  const columns = [
    { key: 'number', label: 'Job #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '10%' },
    { key: 'title', label: 'Title', render: (r) => `<span class="text-primary font-medium" style="display:block; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(r.title)}">${escapeHTML(r.title)}</span>`, width: '22%' },
    { key: 'customerName', label: 'Customer', width: '17%' },
    { key: 'asset', label: 'Asset', render: (r) => {
        const asset = r.assetId ? store.getById('assets', r.assetId) : null;
        const name = r.assetName || (asset ? asset.name : '');
        if (!name) return '<span class="text-tertiary">—</span>';
        return `<span class="text-primary font-medium" style="display:inline-flex;align-items:center;gap:4px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHTML(name)}"><span class="material-icons-outlined" style="font-size:14px;color:var(--color-primary)">inventory_2</span> ${escapeHTML(name)}</span>`;
      }, getValue: (r) => r.assetName || (r.assetId ? (store.getById('assets', r.assetId)?.name || '') : ''), width: '13%' },
    { key: 'status', label: 'Status', render: (r) => r.isRecurring ? `
      <span class="badge badge-purple" style="font-weight:600; padding:2px 8px; font-size:10px; white-space:nowrap; letter-spacing:0.3px;" title="Recurring Template">Recurring Template</span>
    ` : `
      <select class="badge ${sb[r.status] || 'badge-neutral'} job-list-status-select" data-id="${r.id}">
        ${['Pending','Scheduled','In Progress','On Hold','Completed','Invoiced'].map(s => `
          <option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>
        `).join('')}
      </select>
    `, width: '17%' },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${pb[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>`, width: '9%' },
    { key: 'scheduledDate', label: 'Date', render: (r) => r.scheduledDate ? new Date(r.scheduledDate.includes('T') ? r.scheduledDate : r.scheduledDate + 'T00:00:00').toLocaleDateString('en-AU') : '—', getValue: (r) => r.scheduledDate ? new Date(r.scheduledDate).getTime() : 0, width: '12%' },
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/jobs/${id}`), 
    emptyMessage: selectedStatus === 'Recurring Template' ? 'No recurring job templates created yet' : 'No jobs found', 
    emptyIcon: selectedStatus === 'Recurring Template' ? 'event_repeat' : 'build',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Assign Technician',
            icon: 'person_add',
            onClick: (ids) => {
              const techs = store.getAll('technicians').filter(t => !t.deactivated);
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Assign to Technician</label>
                  <select class="form-select" id="bulk-tech">
                    <option value="">-- Select Technician --</option>
                    ${techs.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Assign ${ids.length} Jobs`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Assign', className: 'btn-primary', onClick: c => {
                      const techId = content.querySelector('#bulk-tech').value;
                      if (!techId) return;
                      const tech = store.getById('technicians', techId);
                      if (tech) {
                        ids.forEach(id => {
                          store.update('jobs', id, {
                            technicianId: tech.id,
                            technicianName: tech.name,
                            technicians: [{ id: tech.id, name: tech.name }]
                          });
                        });
                        table.clearSelection();
                        renderJobsList(container);
                        import('../../components/Notifications.js').then(({ showToast }) => showToast(`Assigned ${ids.length} jobs to ${tech.name}`, 'success'));
                      }
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Batch Reschedule',
            icon: 'calendar_month',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Scheduled Date</label>
                  <input type="date" class="form-input" id="bulk-schedule-date" value="${new Date().toISOString().split('T')[0]}" />
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Reschedule ${ids.length} Jobs`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Reschedule', className: 'btn-primary', onClick: c => {
                      const newDate = content.querySelector('#bulk-schedule-date').value;
                      if (!newDate) return;
                      ids.forEach(id => {
                        store.update('jobs', id, { scheduledDate: newDate });
                      });
                      table.clearSelection();
                      renderJobsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Rescheduled ${ids.length} jobs`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Bulk Invoice',
            icon: 'receipt',
            onClick: (ids) => {
              const jobs = ids.map(id => store.getById('jobs', id)).filter(Boolean);
              
              // Find if any job has multiple accepted quotes
              const jobsWithMultipleQuotes = jobs.filter(j => {
                const acceptedQuotes = store.getAll('quotes').filter(q => 
                  (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                );
                return acceptedQuotes.length > 1;
              });

              function createInvoices(selectedQuotesMap) {
                const taxRate = store.getTaxRate();
                jobs.forEach(job => {
                  const qId = selectedQuotesMap[job.id];
                  const quote = qId && qId !== 'tasklist' ? store.getById('quotes', qId) : null;
                  const { sections, subtotal, worksDescription } = getInvoiceDataForJob(job, quote);

                  store.create('invoices', {
                    number: store.getNextNumber('INV-', 'invoices'),
                    invoiceType: 'Job Invoice',
                    jobId: job.id,
                    jobNumber: job.number,
                    customerId: job.customerId,
                    customerName: job.customerName,
                    contactName: job.contactName || '',
                    status: 'Draft',
                    sections: sections,
                    originalSubtotal: subtotal,
                    subtotal: subtotal,
                    tax: subtotal * taxRate,
                    total: subtotal * (1 + taxRate),
                    issueDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
                    notes: worksDescription || ''
                  });
                  // Jobs flip to "Invoiced" automatically when their draft is sent (store hook)
                });
                table.clearSelection();
                renderJobsList(container);
                import('../../components/Notifications.js').then(({ showToast }) => showToast(`Successfully generated ${ids.length} draft invoices`, 'success'));
              }

              if (jobsWithMultipleQuotes.length > 0) {
                import('../../components/Modal.js').then(({ showModal }) => {
                  const content = document.createElement('div');
                  content.innerHTML = `
                    <p style="margin-bottom:12px;">Some of the selected jobs have multiple accepted quotes. Please select which quote's pricing to use for each job, or select tasklist fallback:</p>
                    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px; max-height: 250px; overflow-y: auto;">
                      ${jobsWithMultipleQuotes.map(j => {
                        const acceptedQuotes = store.getAll('quotes').filter(q => 
                          (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                        );
                        return `
                          <div class="form-group" style="margin:0">
                            <label class="form-label" style="font-weight:600">Job #${j.number} — ${escapeHTML(j.title || 'Untitled')}</label>
                            <select class="form-select bulk-job-quote-select" data-jobid="${j.id}">
                              ${acceptedQuotes.map(q => `<option value="${q.id}">${escapeHTML(q.number)} — ${escapeHTML(q.title || 'Untitled')} ($${(q.total || 0).toFixed(2)})</option>`).join('')}
                              <option value="tasklist">-- Use Tasklist & Hours --</option>
                            </select>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                  showModal({
                    title: 'Select Quote for Invoices',
                    content,
                    actions: [
                      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                      {
                        label: 'Generate Invoices', className: 'btn-primary', onClick: c => {
                          const selectedQuotesMap = {};
                          jobs.forEach(j => {
                            const acceptedQuotes = store.getAll('quotes').filter(q => 
                              (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                            );
                            if (acceptedQuotes.length === 1) {
                              selectedQuotesMap[j.id] = acceptedQuotes[0].id;
                            } else {
                              selectedQuotesMap[j.id] = 'tasklist';
                            }
                          });
                          document.querySelectorAll('.bulk-job-quote-select').forEach(sel => {
                            selectedQuotesMap[sel.dataset.jobid] = sel.value;
                          });
                          createInvoices(selectedQuotesMap);
                          c();
                        }
                      }
                    ]
                  });
                });
              } else {
                import('../../components/Modal.js').then(({ showModal }) => {
                  showModal({
                    title: 'Confirm Bulk Invoicing',
                    content: `<p>Are you sure you want to generate draft invoices for all ${ids.length} selected jobs? Their statuses will change to 'Invoiced' once each invoice is sent.</p>`,
                    actions: [
                      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                      {
                        label: 'Generate Invoices', className: 'btn-primary', onClick: c => {
                          const selectedQuotesMap = {};
                          jobs.forEach(j => {
                            const acceptedQuotes = store.getAll('quotes').filter(q => 
                              (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                            );
                            if (acceptedQuotes.length === 1) {
                              selectedQuotesMap[j.id] = acceptedQuotes[0].id;
                            } else {
                              selectedQuotesMap[j.id] = 'tasklist';
                            }
                          });
                          createInvoices(selectedQuotesMap);
                          c();
                        }
                      }
                    ]
                  });
                });
              }
            }
          },
          {
            label: 'Combine into Invoice',
            icon: 'merge',
            onClick: (ids) => {
              const jobs = ids.map(id => store.getById('jobs', id)).filter(Boolean);
              if (jobs.length < 2) {
                import('../../components/Notifications.js').then(({ showToast }) => showToast('Select at least 2 jobs to combine', 'error'));
                return;
              }

              const customerIds = [...new Set(jobs.map(j => j.customerId).filter(Boolean))];
              if (customerIds.length > 1) {
                import('../../components/Notifications.js').then(({ showToast }) => showToast('All selected jobs must belong to the same customer', 'error'));
                return;
              }

              const jobsWithMultipleQuotes = jobs.filter(j => {
                const acceptedQuotes = store.getAll('quotes').filter(q => 
                  (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                );
                return acceptedQuotes.length > 1;
              });

              function createCombinedInvoice(selectedQuotesMap) {
                const combinedSections = [];
                let subtotal = 0;
                const worksDoneNotes = [];

                jobs.forEach(job => {
                  const qId = selectedQuotesMap[job.id];
                  const quote = qId && qId !== 'tasklist' ? store.getById('quotes', qId) : null;
                  const { sections, subtotal: jobSub, worksDescription } = getInvoiceDataForJob(job, quote);
                  
                  const jobTitle = job.title || 'Untitled Job';
                  
                  sections.forEach(sec => {
                    const lineItems = (sec.lineItems || []).map(li => ({
                      ...li,
                      description: `${jobTitle} — ${li.description}`
                    }));
                    if (combinedSections.length === 0) {
                      combinedSections.push({
                        id: store.generateId(),
                        name: 'Items',
                        lineItems: lineItems
                      });
                    } else {
                      combinedSections[0].lineItems.push(...lineItems);
                    }
                  });
                  
                  subtotal += jobSub;
                  if (worksDescription) {
                    worksDoneNotes.push(`${jobTitle}:\n${worksDescription}`);
                  }
                });

                const taxRate = store.getTaxRate();

                store.create('invoices', {
                  number: store.getNextNumber('INV-', 'invoices'),
                  invoiceType: 'Standard',
                  customerId: jobs[0].customerId,
                  customerName: jobs[0].customerName,
                  contactName: jobs[0].contactName || '',
                  status: 'Draft',
                  sections: combinedSections,
                  subtotal,
                  tax: subtotal * taxRate,
                  total: subtotal * (1 + taxRate),
                  issueDate: new Date().toISOString(),
                  dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
                  notes: worksDoneNotes.join('\n\n'),
                  jobIds: jobs.map(j => j.id) // jobs flip to "Invoiced" when this draft is sent
                });

                table.clearSelection();
                renderJobsList(container);
                import('../../components/Notifications.js').then(({ showToast }) => showToast(`Combined ${jobs.length} jobs into one invoice`, 'success'));
              }

              if (jobsWithMultipleQuotes.length > 0) {
                import('../../components/Modal.js').then(({ showModal }) => {
                  const content = document.createElement('div');
                  content.innerHTML = `
                    <p style="margin-bottom:12px;">Some of the selected jobs have multiple accepted quotes. Please select which quote's pricing to use for each job, or select tasklist fallback:</p>
                    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px; max-height: 250px; overflow-y: auto;">
                      ${jobsWithMultipleQuotes.map(j => {
                        const acceptedQuotes = store.getAll('quotes').filter(q => 
                          (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                        );
                        return `
                          <div class="form-group" style="margin:0">
                            <label class="form-label" style="font-weight:600">Job #${j.number} — ${escapeHTML(j.title || 'Untitled')}</label>
                            <select class="form-select combine-job-quote-select" data-jobid="${j.id}">
                              ${acceptedQuotes.map(q => `<option value="${q.id}">${escapeHTML(q.number)} — ${escapeHTML(q.title || 'Untitled')} ($${(q.total || 0).toFixed(2)})</option>`).join('')}
                              <option value="tasklist">-- Use Tasklist & Hours --</option>
                            </select>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                  showModal({
                    title: 'Select Quote for Combined Invoice',
                    content,
                    actions: [
                      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                      {
                        label: 'Create Combined Invoice', className: 'btn-primary', onClick: c => {
                          const selectedQuotesMap = {};
                          jobs.forEach(j => {
                            const acceptedQuotes = store.getAll('quotes').filter(q => 
                              (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                            );
                            if (acceptedQuotes.length === 1) {
                              selectedQuotesMap[j.id] = acceptedQuotes[0].id;
                            } else {
                              selectedQuotesMap[j.id] = 'tasklist';
                            }
                          });
                          document.querySelectorAll('.combine-job-quote-select').forEach(sel => {
                            selectedQuotesMap[sel.dataset.jobid] = sel.value;
                          });
                          createCombinedInvoice(selectedQuotesMap);
                          c();
                        }
                      }
                    ]
                  });
                });
              } else {
                import('../../components/Modal.js').then(({ showModal }) => {
                  const content = document.createElement('div');
                  content.innerHTML = `
                    <p style="margin-bottom:12px;">This will create a <strong>single invoice</strong> with each job as a separate section:</p>
                    <div style="max-height:200px; overflow-y:auto; margin-bottom:16px;">
                      ${jobs.map(j => `
                        <div style="padding:8px 12px; background:var(--bg-secondary); border-radius:6px; margin-bottom:6px; font-size:13px;">
                          <strong>${j.number || 'No #'}</strong> — ${j.title || 'Untitled'}
                          <span style="float:right; color:var(--text-secondary);">${j.customerName || ''}</span>
                        </div>
                      `).join('')}
                    </div>
                    <p style="font-size:12px; color:var(--text-secondary);">Customer: <strong>${jobs[0].customerName || 'Unknown'}</strong></p>
                  `;
                  showModal({
                    title: 'Combine Jobs into One Invoice',
                    content,
                    actions: [
                      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                      {
                        label: 'Create Combined Invoice', className: 'btn-primary', onClick: c => {
                          const selectedQuotesMap = {};
                          jobs.forEach(j => {
                            const acceptedQuotes = store.getAll('quotes').filter(q => 
                              (q.jobId === j.id || q.id === j.quoteId) && q.status === 'Accepted'
                            );
                            if (acceptedQuotes.length === 1) {
                              selectedQuotesMap[j.id] = acceptedQuotes[0].id;
                            } else {
                              selectedQuotesMap[j.id] = 'tasklist';
                            }
                          });
                          createCombinedInvoice(selectedQuotesMap);
                          c();
                        }
                      }
                    ]
                  });
                });
              }
            }
          },
          {
            label: 'Change Status',
            icon: 'sync_alt',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Jobs`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('jobs', id, { status: newStatus }));
                      table.clearSelection();
                      renderJobsList(container); // reload
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} jobs to ${newStatus}`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} jobs? This cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('jobs', id));
                      table.clearSelection();
                      renderJobsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} jobs`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          }
        ]
      });
    }
  });
  container.querySelector('#jobs-table-container').appendChild(table);
  const btnNewJob = container.querySelector('#btn-new-job');
  if (btnNewJob) {
    btnNewJob.addEventListener('click', () => router.navigate('/jobs/new'));
  }

  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  function applyFilters() {
    const q = searchQuery.toLowerCase();
    const filtered = jobs.filter(j => {
      if (selectedStatus) {
        if (selectedStatus === 'ALL_WITH_TEMPLATES') {
          // Allow all statuses including templates
        } else if (selectedStatus === 'Recurring Template') {
          if (!j.isRecurring && j.status !== 'Recurring Template') return false;
        } else if (j.status !== selectedStatus || j.isRecurring) {
          return false;
        }
      } else {
        // Default (Active Jobs): Filter out master recurring templates
        if (j.isRecurring === true || j.status === 'Recurring Template') return false;
      }

      if (q) {
        const num = j.number || '';
        const title = j.title || '';
        const custName = j.customerName || '';
        const techName = j.technicianName || '';
        const assetObj = j.assetId ? store.getById('assets', j.assetId) : null;
        const assetName = j.assetName || (assetObj ? assetObj.name : '');
        const assetSerial = assetObj ? (assetObj.serial || '') : '';

        if (!num.toLowerCase().includes(q) && 
            !title.toLowerCase().includes(q) && 
            !custName.toLowerCase().includes(q) && 
            !techName.toLowerCase().includes(q) &&
            !assetName.toLowerCase().includes(q) &&
            !assetSerial.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (filterStartDate || filterEndDate) {
        if (!j.scheduledDate) return false;
        const jDateStr = j.scheduledDate.split('T')[0];
        if (filterStartDate && jDateStr < filterStartDate) return false;
        if (filterEndDate && jDateStr > filterEndDate) return false;
      }

      return true;
    });
    table.updateData(filtered);
  }

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      filterStartDate = start;
      filterEndDate = end;
      applyFilters();
    }
  });

  setListSearch('Search jobs...', (q) => {
    searchQuery = q;
    applyFilters();
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    selectedStatus = e.target.value;
    const titleEl = container.querySelector('#jobs-page-title');
    if (titleEl) {
      titleEl.textContent = selectedStatus === 'Recurring Template' ? 'Recurring Templates & Contracts' : (customer ? `Jobs — ${escapeHTML(customer.company)}` : 'Jobs');
    }
    const btnLabel = container.querySelector('#btn-new-job .btn-label');
    if (btnLabel) {
      btnLabel.textContent = selectedStatus === 'Recurring Template' ? 'New Template' : 'New Job';
    }
    applyFilters();
  });

  // Apply initial filters (e.g. from URL status parameter)
  applyFilters();



  // Update status when selecting from dropdown
  container.addEventListener('change', (e) => {
    const select = e.target.closest('.job-list-status-select');
    if (select) {
      const jobId = select.dataset.id;
      const newStatus = select.value;
      
      store.update('jobs', jobId, { status: newStatus });
      
      // Update badge styling classes
      select.className = `badge ${sb[newStatus] || 'badge-neutral'} job-list-status-select`;
      
      import('../../components/Notifications.js').then(({ showToast }) => {
        showToast(`Job status updated to ${newStatus}`, 'success');
      });
    }
  });
}

function getJobTasklistHours(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  
  function calculateNodeHours(node) {
    if (!node.subTasks || node.subTasks.length === 0) {
      return (parseFloat(node.estimatedHours) || 0) * (parseInt(node.people) || 1);
    }
    return node.subTasks.reduce((sum, sp) => sum + calculateNodeHours(sp), 0);
  }
  
  return tasks.reduce((sum, t) => sum + calculateNodeHours(t), 0);
}

function generateWorksDoneDescription(tasks) {
  if (!tasks || tasks.length === 0) return 'General maintenance and service work completed.';
  
  const descriptions = [];
  function collectNames(node) {
    if (!node.subTasks || node.subTasks.length === 0) {
      descriptions.push(node.name);
    } else {
      node.subTasks.forEach(collectNames);
    }
  }
  
  tasks.forEach(collectNames);
  
  if (descriptions.length === 0) return 'General maintenance and service work completed.';
  return 'Works Done:\n' + descriptions.map(d => `• ${d}`).join('\n');
}

function getInvoiceDataForJob(job, selectedQuote) {
  let sections = [];
  let subtotal = 0;
  let worksDescription = '';

  const quoteToUse = selectedQuote || (job.quoteId ? store.getById('quotes', job.quoteId) : null);
  if (quoteToUse) {
    if (quoteToUse.sections && quoteToUse.sections.length > 0) {
      sections = JSON.parse(JSON.stringify(quoteToUse.sections));
      subtotal = quoteToUse.subtotal || 0;
    } else if (quoteToUse.lineItems) {
      sections = [{ id: store.generateId(), name: 'Items', lineItems: JSON.parse(JSON.stringify(quoteToUse.lineItems)) }];
      subtotal = quoteToUse.subtotal || 0;
    }
  }

  if (sections.length === 0) {
    const settings = store.getSettings();
    const lineItems = [];

    const tasks = job.tasks || [];
    const totalHours = getJobTasklistHours(tasks);
    worksDescription = generateWorksDoneDescription(tasks);

    const defaultLaborRateObj = settings.laborRates.find(r => r.isDefault) || settings.laborRates[0];
    const rate = defaultLaborRateObj ? defaultLaborRateObj.rate : 85;
    const rateName = defaultLaborRateObj ? defaultLaborRateObj.name : 'Labour';

    if (totalHours > 0) {
      lineItems.push({
        id: store.generateId(),
        description: `${rateName} (${totalHours.toFixed(2)} hrs)`,
        type: 'labor',
        qty: totalHours,
        rate: rate,
        total: totalHours * rate
      });
    }

    const additionalMatCost = parseFloat(job.additionalMaterialCost || 0);
    const billableMatTotal = calculateTotalBillableMaterials(job.materials || [], settings);
    const billableAdditional = calculateBillableMaterialPrice(additionalMatCost, settings);
    const totalBillableMat = billableMatTotal + (additionalMatCost > 0 ? billableAdditional - additionalMatCost : 0) + additionalMatCost;

    if (job.materials && job.materials.length > 0) {
      job.materials.forEach(m => {
        const unitPrice = calculateBillableMaterialPrice(m.unitCost || 0, settings);
        lineItems.push({
          id: store.generateId(),
          description: m.name,
          type: 'material',
          qty: m.quantity || 1,
          rate: unitPrice,
          total: (m.quantity || 1) * unitPrice
        });
      });
      if (additionalMatCost > 0) {
        lineItems.push({
          id: store.generateId(),
          description: 'Additional Materials & Markup',
          type: 'material',
          qty: 1,
          rate: billableAdditional,
          total: billableAdditional
        });
      }
    } else {
      const mCost = totalBillableMat || job.materialCost || 0;
      if (mCost > 0) {
        lineItems.push({
          id: store.generateId(),
          description: 'Job Materials',
          type: 'material',
          qty: 1,
          rate: mCost,
          total: mCost
        });
      }
    }

    sections = [{
      id: store.generateId(),
      name: 'Job Items',
      lineItems: lineItems
    }];

    subtotal = sections.reduce((sum, s) => sum + (s.lineItems.reduce((ls, li) => ls + (li.total || 0), 0)), 0);
  }

  return { sections, subtotal, worksDescription };
}

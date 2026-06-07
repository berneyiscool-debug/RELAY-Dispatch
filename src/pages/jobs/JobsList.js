import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { createToolbarFilters } from '../../components/ToolbarFilters.js';

export function renderJobsList(container, params) {
  const customerId = params?.customerId;
  const customer = customerId ? store.getById('customers', customerId) : null;
  const allJobs = store.getAll('jobs');
  const jobs = customerId ? allJobs.filter(j => j.customerId === customerId) : allJobs;
  const canCreate = hasPermission('Jobs', 'create');

  container.innerHTML = `
    <div class="page-header">
      <h1>${customer ? `Jobs — ${escapeHTML(customer.company)}` : 'Jobs'}</h1>
      ${canCreate ? `
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-job" data-tooltip="Create a new project or service job record" data-tooltip-pos="left"><span class="material-icons-outlined">add</span> New Job</button>
      </div>` : ''}
    </div>
    <div class="page-toolbar" style="display:flex; justify-content:space-between; align-items:center;">
      <div id="jobs-filters-carousel-container" style="flex: 0 0 50%; max-width: 50%; overflow:hidden"></div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search jobs..." id="jobs-search" />
      </div>
    </div>
    <div id="jobs-table-container"></div>
  `;

  let filteredData = [...jobs];
  const sb = { 'Pending':'badge-warning','Scheduled':'badge-info','In Progress':'badge-primary','On Hold':'badge-neutral','Completed':'badge-success','Invoiced':'badge-primary' };
  const pb = { 'Low':'badge-neutral','Medium':'badge-warning','High':'badge-danger','Urgent':'badge-danger' };

  const columns = [
    { key: 'number', label: 'Job #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '100px' },
    { key: 'title', label: 'Title', render: (r) => `<span class="truncate" style="max-width:200px;display:inline-block">${escapeHTML(r.title)}</span>` },
    { key: 'customerName', label: 'Customer' },
    { key: 'technicians', label: 'Assignee', render: (r) => {
        if (r.contractorId) {
          const contractor = store.getById('contractors', r.contractorId);
          return `<span class="text-primary font-medium truncate" style="max-width:150px;display:inline-flex;align-items:center;gap:4px;"><span class="material-icons-outlined" style="font-size:14px;color:var(--color-primary)">business</span> ${contractor ? escapeHTML(contractor.businessName) : 'Unknown Contractor'}</span>`;
        }
        const names = r.technicians && r.technicians.length > 0 ? r.technicians.map(t => escapeHTML(t.name)).join(', ') : escapeHTML(r.technicianName || '—');
        return `<span class="text-secondary truncate" style="max-width:150px;display:inline-flex;align-items:center;gap:4px;"><span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary)">person</span> ${names}</span>`;
      }
    },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`, width: '110px' },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${pb[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>`, width: '90px' },
    { key: 'scheduledDate', label: 'Scheduled', render: (r) => r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '—', getValue: (r) => r.scheduledDate ? new Date(r.scheduledDate).getTime() : 0, width: '100px' },
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/jobs/${id}`), 
    emptyMessage: 'No jobs found', 
    emptyIcon: 'build',
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
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: 'Confirm Bulk Invoicing',
                  content: `<p>Are you sure you want to generate draft invoices for all ${ids.length} selected jobs? This will set their statuses to 'Invoiced'.</p>`,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Generate Invoices', className: 'btn-primary', onClick: c => {
                      ids.forEach((id, i) => {
                        const job = store.getById('jobs', id);
                        if (job) {
                          const subtotal = job.totalCost || (job.laborCost || 0) + (job.materialCost || 0) || 150;
                          const sections = [{
                            name: 'General Scope',
                            lineItems: [{
                              description: `Service completed for Job #${job.number}: ${job.title}`,
                              qty: 1,
                              rate: subtotal,
                              unitPrice: subtotal,
                              total: subtotal
                            }]
                          }];
                          store.create('invoices', {
                            number: `INV-${Date.now().toString().slice(-5)}${i}${Math.floor(100 + Math.random() * 900)}`,
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
                            tax: subtotal * store.getTaxRate(),
                            total: subtotal * (1 + store.getTaxRate()),
                            issueDate: new Date().toISOString(),
                            dueDate: new Date(Date.now() + 30 * 86400000).toISOString()
                          });
                          store.update('jobs', job.id, { status: 'Invoiced' });
                        }
                      });
                      table.clearSelection();
                      renderJobsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Successfully generated ${ids.length} draft invoices`, 'success'));
                      c();
                    }}
                  ]
                });
              });
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

  let tagFilteredData = [...jobs];
  let searchQuery = '';

  function applyFilters() {
    const q = searchQuery.toLowerCase();
    const filtered = tagFilteredData.filter(j => {
      if (!q) return true;
      const num = j.number || '';
      const title = j.title || '';
      const custName = j.customerName || '';
      const techName = j.technicianName || '';
      return num.toLowerCase().includes(q) || 
             title.toLowerCase().includes(q) || 
             custName.toLowerCase().includes(q) || 
             techName.toLowerCase().includes(q);
    });
    table.updateData(filtered);
  }

  createToolbarFilters({
    container: container.querySelector('#jobs-filters-carousel-container'),
    originalData: jobs,
    filterType: 'jobs',
    onFilterChange: (filtered) => {
      tagFilteredData = filtered;
      applyFilters();
    }
  });

  container.querySelector('#jobs-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
  });
}

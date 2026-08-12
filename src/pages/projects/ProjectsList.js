import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';

export function renderProjectsList(container) {
  const projects = store.getAll('projects') || [];
  const customers = store.getAll('customers') || [];
  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];

  let currentFilter = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  const getFilteredProjects = () => {
    return projects.filter(proj => {
      // Status Filter
      if (currentFilter !== 'all' && proj.status !== currentFilter) {
        return false;
      }
      
      // Date Range Filter (based on startDate, fallback to createdAt)
      if (filterStartDate || filterEndDate) {
        const projDate = (proj.startDate || proj.createdAt || '').split('T')[0];
        if (filterStartDate && projDate < filterStartDate) return false;
        if (filterEndDate && projDate > filterEndDate) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const numMatch = (proj.number || '').toLowerCase().includes(query);
        const nameMatch = (proj.name || '').toLowerCase().includes(query);
        const custMatch = (proj.customerName || '').toLowerCase().includes(query);
        return numMatch || nameMatch || custMatch;
      }
      return true;
    });
  };

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Projects</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-sort-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;" title="Sort Projects">
          <option value="number_desc">Sort: Project # (Newest)</option>
          <option value="number_asc">Sort: Project # (Oldest)</option>
          <option value="name_asc">Sort: Name (A-Z)</option>
          <option value="customerName_asc">Sort: Customer (A-Z)</option>
        </select>
        <select id="projects-status-filter" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Statuses (${projects.length})</option>
          <option value="In Progress">In Progress (${projects.filter(p => p.status === 'In Progress').length})</option>
          <option value="Completed">Completed (${projects.filter(p => p.status === 'Completed').length})</option>
          <option value="Cancelled">Cancelled (${projects.filter(p => p.status === 'Cancelled').length})</option>
        </select>
        <button class="btn btn-primary btn-sm" id="btn-new-project" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
          <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Project</span>
        </button>
      </div>
    </div>
    <div id="projects-table-container"></div>
  `;

  const columns = [
    { key: 'number', label: 'Project #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '13%' },
    { key: 'name', label: 'Project', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>`, width: '25%' },
    { key: 'customerName', label: 'Customer', render: (r) => escapeHTML(r.customerName || 'N/A'), width: '20%' },
    { key: 'progress', label: 'Progress', render: (r) => {
        const projJobs = jobs.filter(j => j.projectId === r.id);
        const stagesCount = projJobs.length;
        const completedStages = projJobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced').length;
        const progressPct = stagesCount === 0 ? 0 : Math.round((completedStages / stagesCount) * 100);
        return `
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
            <span class="text-secondary">${completedStages}/${stagesCount} Stages</span>
            <span>${progressPct}%</span>
          </div>
          <div style="width:100%; height:6px; background-color:var(--border-color); border-radius:4px; overflow:hidden;">
            <div style="height:100%; width:${progressPct}%; background-color:${progressPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'}; transition:width 0.4s ease;"></div>
          </div>
        `;
      }, width: '20%' },
    { key: 'status', label: 'Status', render: (r) => {
        let statusClass = 'badge-neutral';
        if (r.status === 'In Progress') statusClass = 'badge-primary';
        if (r.status === 'Completed') statusClass = 'badge-success';
        if (r.status === 'Cancelled') statusClass = 'badge-danger';
        return `<span class="badge ${statusClass}">${escapeHTML(r.status)}</span>`;
      }, width: '12%' },
    { key: 'startDate', label: 'Date', render: (r) => r.startDate ? new Date(r.startDate.includes('T') ? r.startDate : r.startDate + 'T00:00:00').toLocaleDateString('en-AU') : '—', width: '12%' }
  ];

  const table = createDataTable({
    columns,
    data: getFilteredProjects(),
    onRowClick: (id) => router.navigate(`/projects/${id}`),
    emptyMessage: 'No projects found',
    emptyIcon: 'folder_open',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              showModal({
                title: 'Confirm Bulk Delete',
                content: `<p>Are you sure you want to delete ${ids.length} selected project(s)? This action cannot be undone.</p>`,
                actions: [
                  { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                  { label: 'Delete', className: 'btn-danger', onClick: c => {
                    ids.forEach(id => store.delete('projects', id));
                    table.clearSelection();
                    renderProjectsList(container);
                    showToast(`Deleted ${ids.length} project(s)`, 'success');
                    c();
                  }}
                ]
              });
            }
          }
        ]
      });
    }
  });

  container.querySelector('#projects-table-container').appendChild(table);

  const applyFilters = () => {
    table.updateData(getFilteredProjects());
  };

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      filterStartDate = start;
      filterEndDate = end;
      applyFilters();
    }
  });

  // Event Delegation for buttons & dropdowns relocated into top breadcrumbs row
  const handleProjectClick = (e) => {
    const btnNew = e.target.closest('#btn-new-project');
    if (btnNew) {
      e.preventDefault();
      openNewProjectModal();
    }
  };

  const handleProjectChange = (e) => {
    if (e.target.id === 'projects-status-filter') {
      currentFilter = e.target.value;
      applyFilters();
    } else if (e.target.id === 'filter-sort-select') {
      const val = e.target.value;
      const [key, dir] = val.split('_');
      table.setSort(key, dir);
    }
  };

  document.addEventListener('click', handleProjectClick);
  document.addEventListener('change', handleProjectChange);

  setListSearch((q) => {
    searchQuery = q;
    applyFilters();
  }, 'projects');

  const openNewProjectModal = () => {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <div style="margin-bottom:16px; padding:12px; background:var(--color-primary-light); border-radius:8px; border-left:4px solid var(--color-primary); color:var(--color-primary-dark); font-size:13px; line-height:1.5;">
        <strong>Parent Projects</strong> group multiple stages (Jobs) together under a single umbrella. This allows you to track overall progress, margins, and issue consolidated invoices across multiple jobs.
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Project Name <span style="color:var(--color-danger)">*</span></label>
        <input class="form-input" id="p-name" placeholder="e.g. Dubbo Shopping Mall Solar Install" style="width:100%" />
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Customer <span style="color:var(--color-danger)">*</span></label>
        <select class="form-select" id="p-customer" style="width:100%">
          <option value="">-- Select Customer --</option>
          ${customers.map(c => `
            <option value="${c.id}">${escapeHTML(c.company || `${c.firstName} ${c.lastName}`)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Site Address</label>
        <select class="form-select" id="p-site" style="width:100%">
          <option value="">-- Select Customer First --</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Description & Scope</label>
        <textarea class="form-textarea" id="p-desc" rows="3" placeholder="Provide a brief scope / summary of the project" style="width:100%"></textarea>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px">
        <div class="form-group">
          <label class="form-label" style="display:block; margin-bottom:6px">Start Date</label>
          <input type="date" class="form-input" id="p-start-date" style="width:100%" />
        </div>
        <div class="form-group">
          <label class="form-label" style="display:block; margin-bottom:6px">End Date (Target)</label>
          <input type="date" class="form-input" id="p-end-date" style="width:100%" />
        </div>
      </div>
    `;

    const customerSelect = modalContent.querySelector('#p-customer');
    const siteSelect = modalContent.querySelector('#p-site');

    customerSelect.addEventListener('change', () => {
      const custId = customerSelect.value;
      if (!custId) {
        siteSelect.innerHTML = '<option value="">-- Select Customer First --</option>';
        return;
      }
      const c = store.getById('customers', custId);
      if (c && c.sites && c.sites.length > 0) {
        siteSelect.innerHTML = `
          <option value="">-- Select Site --</option>
          ${c.sites.map(s => `<option value="${escapeHTML(s.address)}">${escapeHTML(s.name)} — ${escapeHTML(s.address)}</option>`).join('')}
        `;
      } else {
        siteSelect.innerHTML = '<option value="">No sites configured for this customer</option>';
      }
    });

    showModal({
      title: 'Create New Project',
      content: modalContent,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Create Project', className: 'btn-primary btn-create-proj', onClick: async (c) => {
          const name = document.getElementById('p-name').value.trim();
          const customerId = document.getElementById('p-customer').value;
          const siteAddress = document.getElementById('p-site').value;
          const description = document.getElementById('p-desc').value.trim();
          const startDate = document.getElementById('p-start-date').value || null;
          const endDate = document.getElementById('p-end-date').value || null;

          if (!name) { showToast('Project Name is required', 'error'); return; }
          if (!customerId) { showToast('Customer selection is required', 'error'); return; }

          const selectedCust = store.getById('customers', customerId);
          const customerName = selectedCust.company || `${selectedCust.firstName} ${selectedCust.lastName}`;

          try {
            const btn = document.querySelector('.btn-create-proj');
            if (btn) {
              btn.disabled = true;
              btn.innerHTML = 'Creating...';
            }

            const newProj = await store.create('projects', {
              name,
              customerId,
              customerName,
              siteAddress,
              description,
              startDate,
              endDate,
              status: 'In Progress'
            });

            showToast(`Project ${newProj.number} created successfully`, 'success');
            c();
            router.navigate(`/projects/${newProj.id}`);
          } catch (err) {
            console.error('Error creating project:', err);
            showToast('Failed to create project: ' + err.message, 'error');
          }
        }}
      ]
    });
  };
}

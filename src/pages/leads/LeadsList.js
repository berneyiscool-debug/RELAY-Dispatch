// ============================================
// SIMPRO CLONE — LEADS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';

export function renderLeadsList(container) {
  const leads = store.getAll('leads');
  
  const likelihoods = {
    'New': 10,
    'Contacted': 30,
    'Qualified': 50,
    'Proposal': 70,
    'Negotiation': 85,
    'Won': 100,
    'Lost': 0
  };

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Leads</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Statuses (${leads.length})</option>
          ${['New','Contacted','Qualified','Won','Lost'].map(s => `<option value="${s}">${s} (${leads.filter(l => l.status === s).length})</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="btn-new-lead" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
          <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Lead</span>
        </button>
      </div>
    </div>
    <div id="leads-table-container"></div>
  `;

  let filteredData = [...leads];

  const statusBadges = {
    'New': 'badge-info', 'Contacted': 'badge-neutral', 'Qualified': 'badge-warning',
    'Proposal': 'badge-primary', 'Negotiation': 'badge-purple', 'Won': 'badge-success', 'Lost': 'badge-danger',
  };
  const priorityBadges = { 'Low': 'badge-neutral', 'Medium': 'badge-warning', 'High': 'badge-danger' };

  const columns = [
    { key: 'number', label: 'Lead #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number || 'LD-' + (r.id.includes('_') ? r.id.split('_')[1].padStart(5, '0') : r.id.substring(0, 5).toUpperCase()))}</span>`, getValue: (r) => r.number || r.id, width: '100px' },
    { key: 'title', label: 'Lead', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.title)}</span>` },
    { key: 'customerName', label: 'Customer', render: (r) => `<span class="text-secondary">${escapeHTML(r.customerName)}</span>` },
    { key: 'source', label: 'Source', render: (r) => `<span class="text-secondary">${escapeHTML(r.source)}</span>` },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadges[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>` },
    { key: 'likelihood', label: 'Likelihood', render: (r) => {
        const prob = likelihoods[r.status] ?? 0;
        let color = 'var(--text-tertiary)';
        if (prob >= 80) color = 'var(--color-success)';
        else if (prob >= 50) color = 'var(--color-primary)';
        else if (prob >= 30) color = 'var(--color-warning-dark)';
        return `<span style="font-weight:700; color:${color}">${prob}%</span>`;
      }, getValue: (r) => likelihoods[r.status] || 0, width: '100px' },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${priorityBadges[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>` },
    { key: 'value', label: 'Value', render: (r) => `<span class="font-medium">$${(r.value || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`, getValue: (r) => r.value },
    { key: 'createdAt', label: 'Date', render: (r) => `<span class="text-secondary">${new Date(r.createdAt).toLocaleDateString()}</span>`, getValue: (r) => new Date(r.createdAt).getTime() },
  ];

  const table = createDataTable({
    columns, data: filteredData,
    onRowClick: (id) => router.navigate(`/leads/${id}`),
    emptyMessage: 'No leads found', emptyIcon: 'trending_up',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Assign Sales Rep',
            icon: 'assignment_ind',
            onClick: (ids) => {
              const techs = store.getAll('technicians').filter(t => !t.deactivated);
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Sales Representative</label>
                  <select class="form-select" id="bulk-tech">
                    <option value="">-- Select Sales Rep --</option>
                    ${techs.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Assign ${ids.length} Leads`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Assign', className: 'btn-primary', onClick: c => {
                      const techId = content.querySelector('#bulk-tech').value;
                      if (!techId) return;
                      const tech = store.getById('technicians', techId);
                      if (tech) {
                        ids.forEach(id => {
                          store.update('leads', id, {
                            assignedTo: tech.id,
                            assignedToName: tech.name,
                            salesRepName: tech.name
                          });
                        });
                        table.clearSelection();
                        renderLeadsList(container);
                        import('../../components/Notifications.js').then(({ showToast }) => showToast(`Assigned ${ids.length} leads to ${tech.name}`, 'success'));
                      }
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Set Priority',
            icon: 'local_fire_department',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Select Priority</label>
                  <select class="form-select" id="bulk-priority">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Set Priority for ${ids.length} Leads`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const priority = content.querySelector('#bulk-priority').value;
                      ids.forEach(id => {
                        store.update('leads', id, { priority: priority });
                      });
                      table.clearSelection();
                      renderLeadsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated priority of ${ids.length} leads to ${priority}`, 'success'));
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
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Leads`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('leads', id, { status: newStatus }));
                      table.clearSelection();
                      renderLeadsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} leads to ${newStatus}`, 'success'));
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
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} leads? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('leads', id));
                      table.clearSelection();
                      renderLeadsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} leads`, 'success'));
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

  container.querySelector('#leads-table-container').appendChild(table);
  container.querySelector('#btn-new-lead').addEventListener('click', () => router.navigate('/leads/new'));

  let activeStatusFilter = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  function applyFilters() {
    let filtered = [...leads];
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === activeStatusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const title = l.title || '';
        const custName = l.customerName || '';
        return title.toLowerCase().includes(q) || 
               custName.toLowerCase().includes(q);
      });
    }
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(l => {
        const dateVal = l.createdAt || '';
        const lDateStr = dateVal ? dateVal.split('T')[0] : '';
        if (filterStartDate && lDateStr < filterStartDate) return false;
        if (filterEndDate && lDateStr > filterEndDate) return false;
        return true;
      });
    }
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

  setListSearch('Search leads...', (q) => {
    searchQuery = q;
    applyFilters();
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    activeStatusFilter = e.target.value;
    applyFilters();
  });
}

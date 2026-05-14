// ============================================
// SIMPRO CLONE — TIMESHEETS LIST
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderTimesheetsList(container) {
  const timesheets = store.getAll('timesheets').sort((a, b) => new Date(b.date) - new Date(a.date));
  let filteredData = [...timesheets];
  let filterStatus = 'All';

  function updateFilteredData() {
    filteredData = filterStatus === 'All' ? [...timesheets] : timesheets.filter(t => t.status === filterStatus);
  }

  function render() {
    const totalPending = timesheets.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);
    const totalApproved = timesheets.filter(t => t.status === 'Approved').reduce((s, t) => s + (t.hours || 0), 0);

    container.innerHTML = `
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-approve-all-pending" ${!timesheets.some(t => t.status === 'Pending') ? 'disabled' : ''}>
            <span class="material-icons-outlined">done_all</span> Approve All Pending
          </button>
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${totalPending} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Approved</div>
          <div class="stat-value" style="color:var(--color-success)">${totalApproved} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="page-toolbar">
        <div class="toolbar-filters">
          <button class="toolbar-filter ${filterStatus === 'All' ? 'active' : ''}" data-status="All">All</button>
          <button class="toolbar-filter ${filterStatus === 'Pending' ? 'active' : ''}" data-status="Pending">Pending</button>
          <button class="toolbar-filter ${filterStatus === 'Approved' ? 'active' : ''}" data-status="Approved">Approved</button>
          <button class="toolbar-filter ${filterStatus === 'Rejected' ? 'active' : ''}" data-status="Rejected">Rejected</button>
        </div>
      </div>

      <div id="timesheets-table-container"></div>
    `;

    const columns = [
      { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString(), getValue: (r) => new Date(r.date).getTime(), width: '110px' },
      { key: 'technicianName', label: 'Technician', render: (r) => `<span class="font-medium">${escapeHTML(r.technicianName)}</span>` },
      { key: 'job', label: 'Job', render: (r) => `<a href="#/jobs/${r.jobId}" class="cell-link">${escapeHTML(r.jobNumber || r.jobId)}</a>` },
      { key: 'description', label: 'Description', render: (r) => `<span class="text-secondary truncate" style="max-width:250px;display:inline-block">${escapeHTML(r.description || '—')}</span>` },
      { key: 'hours', label: 'Hours', render: (r) => `<span style="font-weight:600">${r.hours}</span>`, getValue: (r) => r.hours, width: '80px', align: 'right' },
      { key: 'status', label: 'Status', render: (r) => {
          const b = { 'Approved': 'badge-success', 'Rejected': 'badge-danger', 'Pending': 'badge-warning' };
          return `<span class="badge ${b[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`;
      }, width: '100px' },
    ];

    updateFilteredData();

    const table = createDataTable({
      columns,
      data: filteredData,
      emptyMessage: 'No timesheets found',
      emptyIcon: 'schedule',
      selectable: true,
      onSelectionChange: (selectedIds) => {
        createBulkActionBar({
          container,
          selectedIds,
          onClear: () => table.clearSelection(),
          actions: [
            {
              label: 'Approve Selected',
              icon: 'check_circle',
              onClick: (ids) => {
                ids.forEach(id => store.update('timesheets', id, { status: 'Approved' }));
                table.clearSelection();
                renderTimesheetsList(container);
                showToast(`Approved ${ids.length} timesheets`, 'success');
              }
            },
            {
              label: 'Reject Selected',
              icon: 'cancel',
              className: 'btn-danger',
              onClick: (ids) => {
                ids.forEach(id => store.update('timesheets', id, { status: 'Rejected' }));
                table.clearSelection();
                renderTimesheetsList(container);
                showToast(`Rejected ${ids.length} timesheets`, 'warning');
              }
            }
          ]
        });
      }
    });

    container.querySelector('#timesheets-table-container').appendChild(table);

    // Filter events
    container.querySelectorAll('.toolbar-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        filterStatus = btn.dataset.status;
        render();
      });
    });

    // Bulk Approve All Pending (Legacy button support)
    container.querySelector('#btn-approve-all-pending')?.addEventListener('click', () => {
      const pending = timesheets.filter(t => t.status === 'Pending');
      pending.forEach(ts => store.update('timesheets', ts.id, { status: 'Approved' }));
      showToast(`Approved ${pending.length} pending timesheets`, 'success');
      renderTimesheetsList(container);
    });
  }

  render();
}

// ============================================
// SIMPRO CLONE — JOBS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderJobsList(container) {
  const jobs = store.getAll('jobs');

  container.innerHTML = `
    <div class="page-header">
      <h1>Jobs</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-job"><span class="material-icons-outlined">add</span> New Job</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${jobs.length})</button>
        <button class="toolbar-filter" data-filter="Pending">Pending</button>
        <button class="toolbar-filter" data-filter="Scheduled">Scheduled</button>
        <button class="toolbar-filter" data-filter="In Progress">In Progress</button>
        <button class="toolbar-filter" data-filter="Completed">Completed</button>
        <button class="toolbar-filter" data-filter="unscheduled">Unscheduled</button>
      </div>
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
    { key: 'technicians', label: 'Technicians', render: (r) => `<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${r.technicians && r.technicians.length > 0 ? r.technicians.map(t => escapeHTML(t.name)).join(', ') : escapeHTML(r.technicianName || '—')}</span>` },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`, width: '110px' },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${pb[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>`, width: '90px' },
    { key: 'scheduledDate', label: 'Scheduled', render: (r) => r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '—', getValue: (r) => r.scheduledDate ? new Date(r.scheduledDate).getTime() : 0, width: '100px' },
  ];

  const table = createDataTable({ columns, data: filteredData, onRowClick: (id) => router.navigate(`/jobs/${id}`), emptyMessage: 'No jobs found', emptyIcon: 'build' });
  container.querySelector('#jobs-table-container').appendChild(table);
  container.querySelector('#btn-new-job').addEventListener('click', () => router.navigate('/jobs/new'));

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      if (f === 'all') filteredData = [...jobs];
      else if (f === 'unscheduled') filteredData = jobs.filter(j => !j.scheduledDate);
      else filteredData = jobs.filter(j => j.status === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#jobs-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = jobs.filter(j => j.number.toLowerCase().includes(q) || j.title.toLowerCase().includes(q) || j.customerName.toLowerCase().includes(q) || (j.technicianName||'').toLowerCase().includes(q));
    table.updateData(filteredData);
  });
}

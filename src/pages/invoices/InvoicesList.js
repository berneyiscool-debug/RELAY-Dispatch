// ============================================
// SIMPRO CLONE — INVOICES LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';

export function renderInvoicesList(container) {
  const invoices = store.getAll('invoices');

  container.innerHTML = `
    <div class="page-header">
      <h1>Invoices</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-invoice"><span class="material-icons-outlined">add</span> New Invoice</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${invoices.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Paid">Paid</button>
        <button class="toolbar-filter" data-filter="Overdue">Overdue</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search invoices..." id="invoices-search" />
      </div>
    </div>
    <div id="invoices-table-container"></div>
  `;

  let filteredData = [...invoices];
  const sb = { 'Draft':'badge-neutral','Sent':'badge-info','Paid':'badge-success','Overdue':'badge-danger','Void':'badge-neutral' };

  const columns = [
    { key: 'number', label: 'Invoice #', render: (r) => `<span class="cell-link font-medium">${r.number}</span>`, width: '110px' },
    { key: 'customerName', label: 'Customer' },
    { key: 'jobNumber', label: 'Job Ref', render: (r) => r.jobNumber ? `<span class="text-secondary">${r.jobNumber}</span>` : '—', width: '100px' },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${r.status}</span>`, width: '100px' },
    { key: 'total', label: 'Total', render: (r) => `<span class="font-semibold">$${(r.total || 0).toLocaleString('en-AU',{minimumFractionDigits:2})}</span>`, getValue: (r) => r.total, width: '110px' },
    { key: 'issueDate', label: 'Issue Date', render: (r) => r.issueDate ? new Date(r.issueDate).toLocaleDateString() : '—', getValue: (r) => r.issueDate ? new Date(r.issueDate).getTime() : 0, width: '100px' },
    { key: 'dueDate', label: 'Due Date', render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—', getValue: (r) => r.dueDate ? new Date(r.dueDate).getTime() : 0, width: '100px' },
  ];

  const table = createDataTable({ columns, data: filteredData, onRowClick: (id) => router.navigate(`/invoices/${id}`), emptyMessage: 'No invoices found', emptyIcon: 'receipt_long' });
  container.querySelector('#invoices-table-container').appendChild(table);
  container.querySelector('#btn-new-invoice').addEventListener('click', () => router.navigate('/invoices/new'));

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...invoices] : invoices.filter(i => i.status === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#invoices-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = invoices.filter(i => i.number.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q) || (i.jobNumber||'').toLowerCase().includes(q));
    table.updateData(filteredData);
  });
}

// ============================================
// SIMPRO CLONE — QUOTES LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderQuotesList(container) {
  const quotes = store.getAll('quotes');

  container.innerHTML = `
    <div class="page-header">
      <h1>Quotes</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${quotes.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Accepted">Accepted</button>
        <button class="toolbar-filter" data-filter="Declined">Declined</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search quotes..." id="quotes-search" />
      </div>
    </div>
    <div id="quotes-table-container"></div>
  `;

  let filteredData = [...quotes];
  const sb = { 'Draft': 'badge-neutral', 'Sent': 'badge-info', 'Accepted': 'badge-success', 'Declined': 'badge-danger' };

  const columns = [
    { key: 'number', label: 'Quote #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '110px' },
    { key: 'customerName', label: 'Customer' },
    { key: 'title', label: 'Description', render: (r) => `<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${escapeHTML(r.title || '')}</span>` },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`, width: '100px' },
    { key: 'total', label: 'Total', render: (r) => `<span class="font-semibold">$${(r.total || 0).toLocaleString('en-AU',{minimumFractionDigits:2})}</span>`, getValue: (r) => r.total, width: '110px' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString(), getValue: (r) => new Date(r.createdAt).getTime(), width: '100px' },
  ];

  const table = createDataTable({ columns, data: filteredData, onRowClick: (id) => router.navigate(`/quotes/${id}`), emptyMessage: 'No quotes found', emptyIcon: 'request_quote' });
  container.querySelector('#quotes-table-container').appendChild(table);
  container.querySelector('#btn-new-quote').addEventListener('click', () => router.navigate('/quotes/new'));

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...quotes] : quotes.filter(q => q.status === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#quotes-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = quotes.filter(qt => qt.number.toLowerCase().includes(q) || qt.customerName.toLowerCase().includes(q) || (qt.title||'').toLowerCase().includes(q));
    table.updateData(filteredData);
  });
}

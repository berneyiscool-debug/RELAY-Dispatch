// ============================================
// SIMPRO CLONE — INVOICES LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';

export function renderInvoicesList(container) {
  const invoices = store.getAll('invoices');

  container.innerHTML = `
    <div class="page-header">
      <h1>Invoices</h1>
      <div class="page-header-actions">
        <button class="btn btn-outline" id="btn-export-accounting" data-tooltip="Download Xero/MYOB compatible CSV of paid invoices" data-tooltip-pos="left" style="display:none;"><span class="material-icons-outlined">download</span> Export to Accounting</button>
        <button class="btn btn-primary" id="btn-new-invoice" data-tooltip="Create a new draft invoice to bill a customer" data-tooltip-pos="left"><span class="material-icons-outlined">add</span> New Invoice</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${invoices.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Paid">Paid</button>
        <button class="toolbar-filter" data-filter="Overdue">Overdue</button>
        <button class="toolbar-filter" data-filter="Void">Void</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search invoices..." id="invoices-search" />
      </div>
    </div>
    <div id="invoices-table-container"></div>
  `;

  let filteredData = [...invoices];
  const sb = { 'Draft':'badge-draft','Sent':'badge-info','Paid':'badge-success','Overdue':'badge-danger','Void':'badge-void' };

  const columns = [
    { key: 'number', label: 'Invoice #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '110px' },
    { key: 'customerName', label: 'Customer' },
    { key: 'jobNumber', label: 'Job Ref', render: (r) => r.jobNumber ? `<span class="text-secondary">${escapeHTML(r.jobNumber)}</span>` : '—', width: '100px' },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`, width: '100px' },
    { key: 'total', label: 'Total', render: (r) => `<span class="font-semibold">$${(r.total || 0).toLocaleString('en-AU',{minimumFractionDigits:2})}</span>`, getValue: (r) => r.total, width: '110px' },
    { key: 'issueDate', label: 'Issue Date', render: (r) => r.issueDate ? new Date(r.issueDate).toLocaleDateString() : '—', getValue: (r) => r.issueDate ? new Date(r.issueDate).getTime() : 0, width: '100px' },
    { key: 'dueDate', label: 'Due Date', render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—', getValue: (r) => r.dueDate ? new Date(r.dueDate).getTime() : 0, width: '100px' },
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/invoices/${id}`), 
    emptyMessage: 'No invoices found', 
    emptyIcon: 'receipt_long',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Bulk Email/Remind',
            icon: 'mail_outline',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: 'Confirm Payment Reminders',
                  content: `<p>Are you sure you want to send automated email reminders for the ${ids.length} selected invoices?</p>`,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Send Reminders', className: 'btn-primary', onClick: c => {
                      table.clearSelection();
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Sent payment reminders for ${ids.length} invoices`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Accounting Sync (CSV)',
            icon: 'sync',
            onClick: (ids) => {
              try {
                const headers = ['Invoice Number', 'Customer', 'Job Ref', 'Subtotal', 'Tax', 'Total', 'Issue Date', 'Due Date', 'Status'];
                const rows = ids.map(id => {
                  const inv = store.getById('invoices', id);
                  if (!inv) return null;
                  return [
                    inv.number || '',
                    inv.customerName || '',
                    inv.jobNumber || '',
                    (inv.subtotal || 0).toFixed(2),
                    (inv.tax || 0).toFixed(2),
                    (inv.total || 0).toFixed(2),
                    inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '',
                    inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
                    inv.status || ''
                  ];
                }).filter(Boolean);

                const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `fieldforge_invoices_sync_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                table.clearSelection();
                import('../../components/Notifications.js').then(({ showToast }) => showToast(`Successfully exported and synced ${ids.length} invoices`, 'success'));
              } catch (err) {
                console.error(err);
                import('../../components/Notifications.js').then(({ showToast }) => showToast('Failed to sync invoices', 'error'));
              }
            }
          },
          {
            label: 'Mark Paid',
            icon: 'check_circle',
            onClick: (ids) => {
              ids.forEach(id => store.update('invoices', id, { status: 'Paid', datePaid: new Date().toISOString() }));
              table.clearSelection();
              renderInvoicesList(container);
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Marked ${ids.length} invoices as Paid`, 'success'));
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
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Invoices`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('invoices', id, { status: newStatus }));
                      table.clearSelection();
                      renderInvoicesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} invoices to ${newStatus}`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Send Reminders',
            icon: 'notifications_active',
            onClick: (ids) => {
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Sending reminders for ${ids.length} invoices...`, 'info'));
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} invoices? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('invoices', id));
                      table.clearSelection();
                      renderInvoicesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} invoices`, 'success'));
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
  container.querySelector('#invoices-table-container').appendChild(table);
  container.querySelector('#btn-new-invoice').addEventListener('click', () => router.navigate('/invoices/new'));

  const btnExport = container.querySelector('#btn-export-accounting');

  function updateExportButtonVisibility(data) {
    // Show export button if there's at least one paid invoice in the current view
    if (data.some(i => i.status === 'Paid')) {
      btnExport.style.display = 'inline-flex';
    } else {
      btnExport.style.display = 'none';
    }
  }

  updateExportButtonVisibility(filteredData);

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...invoices] : invoices.filter(i => i.status === f);
      table.updateData(filteredData);
      updateExportButtonVisibility(filteredData);
    });
  });

  btnExport.addEventListener('click', () => {
    const paidInvoices = filteredData.filter(i => i.status === 'Paid');
    if (paidInvoices.length === 0) return;

    // Generate mock CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode\n";

    paidInvoices.forEach(inv => {
      const row = [
        inv.number,
        `"${inv.customerName.replace(/"/g, '""')}"`,
        inv.email || '',
        inv.issueDate ? inv.issueDate.split('T')[0] : '',
        inv.dueDate ? inv.dueDate.split('T')[0] : '',
        (inv.total || 0).toFixed(2),
        (inv.tax || 0).toFixed(2),
        "200" // Mock account code
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `accounting_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    import('../../components/Notifications.js').then(({ showToast }) => {
      showToast(`Exported ${paidInvoices.length} paid invoices`, 'success');
    });
  });

  container.querySelector('#invoices-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = invoices.filter(i => i.number.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q) || (i.jobNumber||'').toLowerCase().includes(q));
    table.updateData(filteredData);
    updateExportButtonVisibility(filteredData);
  });
}

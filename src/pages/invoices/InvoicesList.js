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
    <div class="page-toolbar" style="display:flex; justify-content:space-between; align-items:center; gap:16px;">
      <div class="toolbar-filters" style="display:flex; flex-wrap:wrap; gap:8px; margin:0;">
        <button class="toolbar-filter active" data-filter="all">All (${invoices.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Paid">Paid</button>
        <button class="toolbar-filter" data-filter="Overdue">Overdue</button>
        <button class="toolbar-filter" data-filter="Void">Void</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex:0 0 auto;">
        <input type="date" class="form-input" id="filter-date-start" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
        <span style="font-size:12px; color:var(--text-secondary)">to</span>
        <input type="date" class="form-input" id="filter-date-end" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
      </div>
      <div class="toolbar-search" style="flex:0 0 auto;">
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
            label: 'Combine Invoices',
            icon: 'merge',
            onClick: (ids) => {
              const invoices = ids.map(id => store.getById('invoices', id)).filter(Boolean);
              if (invoices.length < 2) {
                import('../../components/Notifications.js').then(({ showToast }) => showToast('Select at least 2 invoices to combine', 'error'));
                return;
              }

              // Validate same customer
              const customerIds = [...new Set(invoices.map(inv => inv.customerId).filter(Boolean))];
              if (customerIds.length > 1) {
                import('../../components/Notifications.js').then(({ showToast }) => showToast('All selected invoices must belong to the same customer', 'error'));
                return;
              }

              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `
                  <p style="margin-bottom:12px;">This will merge <strong>${invoices.length} invoices</strong> into a single invoice. Each original invoice becomes a section in the combined invoice.</p>
                  <div style="max-height:200px; overflow-y:auto; margin-bottom:16px;">
                    ${invoices.map(inv => `
                      <div style="padding:8px 12px; background:var(--bg-secondary); border-radius:6px; margin-bottom:6px; font-size:13px; display:flex; justify-content:space-between; align-items:center;">
                        <span><strong>${inv.number || 'No #'}</strong> — ${inv.title || inv.customerName || 'Untitled'}</span>
                        <span style="font-weight:600;">$${(inv.total || 0).toFixed(2)}</span>
                      </div>
                    `).join('')}
                  </div>
                  <p style="font-size:12px; color:var(--text-secondary);">Customer: <strong>${invoices[0].customerName || 'Unknown'}</strong></p>
                  <p style="font-size:12px; color:var(--text-secondary);">Original invoices will be marked as <strong>Void</strong>.</p>
                `;
                showModal({
                  title: 'Combine Invoices',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Combine Invoices', className: 'btn-primary', onClick: c => {
                      // Build sections from each invoice
                      const combinedSections = [];
                      invoices.forEach(inv => {
                        if (inv.sections && inv.sections.length > 0) {
                          inv.sections.forEach(sec => {
                            combinedSections.push({
                              id: store.generateId(),
                              name: `${inv.number} — ${sec.name || 'Items'}`,
                              lineItems: (sec.lineItems || []).map(li => ({ ...li }))
                            });
                          });
                        } else {
                          // Fallback: create a section from the invoice total
                          combinedSections.push({
                            id: store.generateId(),
                            name: `${inv.number} — ${inv.title || 'Invoice Items'}`,
                            lineItems: [{
                              description: `${inv.title || 'Invoice'} (${inv.number})`,
                              type: 'other',
                              qty: 1,
                              rate: inv.subtotal || inv.total || 0,
                              unitPrice: inv.subtotal || inv.total || 0,
                              total: inv.subtotal || inv.total || 0
                            }]
                          });
                        }
                      });

                      const subtotal = combinedSections.reduce((sum, sec) => sum + (sec.lineItems || []).reduce((s, li) => s + (li.total || 0), 0), 0);
                      const taxRate = store.getTaxRate();

                      const newInvoice = store.create('invoices', {
                        number: store.getNextNumber('INV-', 'invoices'),
                        invoiceType: 'Standard',
                        customerId: invoices[0].customerId,
                        customerName: invoices[0].customerName,
                        contactName: invoices[0].contactName || '',
                        status: 'Draft',
                        sections: combinedSections,
                        subtotal,
                        tax: subtotal * taxRate,
                        total: subtotal * (1 + taxRate),
                        issueDate: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 30 * 86400000).toISOString()
                      });

                      // Void the originals
                      invoices.forEach(inv => {
                        store.update('invoices', inv.id, { status: 'Void' });
                      });

                      table.clearSelection();
                      renderInvoicesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Combined ${invoices.length} invoices into ${newInvoice.number || 'new invoice'}`, 'success'));
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

  let activeStatusFilter = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  function applyFilters() {
    let filtered = [...invoices];
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === activeStatusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => {
        const num = i.number || '';
        const custName = i.customerName || '';
        const jobNum = i.jobNumber || '';
        return num.toLowerCase().includes(q) || 
               custName.toLowerCase().includes(q) || 
               jobNum.toLowerCase().includes(q);
      });
    }
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(i => {
        const dateVal = i.issueDate || i.createdAt || '';
        const iDateStr = dateVal ? dateVal.split('T')[0] : '';
        if (filterStartDate && iDateStr < filterStartDate) return false;
        if (filterEndDate && iDateStr > filterEndDate) return false;
        return true;
      });
    }
    filteredData = filtered;
    table.updateData(filteredData);
    updateExportButtonVisibility(filteredData);
  }

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.filter;
      applyFilters();
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
    searchQuery = e.target.value;
    applyFilters();
  });

  container.querySelector('#filter-date-start')?.addEventListener('change', (e) => {
    filterStartDate = e.target.value;
    applyFilters();
  });

  container.querySelector('#filter-date-end')?.addEventListener('change', (e) => {
    filterEndDate = e.target.value;
    applyFilters();
  });
}

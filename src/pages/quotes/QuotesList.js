import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';

export function renderQuotesList(container, params) {
  const customerId = params?.customerId;
  const customer = customerId ? store.getById('customers', customerId) : null;
  const allQuotes = store.getAll('quotes');
  const quotes = customerId ? allQuotes.filter(q => q.customerId === customerId) : allQuotes;
  const canCreate = hasPermission('Quotes', 'create');

  container.innerHTML = `
    <div class="page-header">
      <h1>${customer ? `Quotes — ${escapeHTML(customer.company)}` : 'Quotes'}</h1>
      ${canCreate ? `
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-quote" data-tooltip="Draft a new pricing proposal or project estimation for a customer" data-tooltip-pos="left"><span class="material-icons-outlined">add</span> New Quote</button>
      </div>` : ''}
    </div>
    <div class="page-toolbar" style="display:flex; justify-content:space-between; align-items:center; gap:16px;">
      <div class="toolbar-filters" style="display:flex; flex-wrap:wrap; gap:8px; margin:0;">
        <button class="toolbar-filter active" data-filter="all">All (${quotes.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Finalised">Finalised</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Accepted">Accepted</button>
        <button class="toolbar-filter" data-filter="Declined">Declined</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex:0 0 auto;">
        <input type="date" class="form-input" id="filter-date-start" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
        <span style="font-size:12px; color:var(--text-secondary)">to</span>
        <input type="date" class="form-input" id="filter-date-end" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
      </div>
      <div class="toolbar-search" style="flex:0 0 auto;">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search quotes..." id="quotes-search" />
      </div>
    </div>
    <div id="quotes-table-container"></div>
  `;

  let filteredData = [...quotes];
  const sb = { 'Draft': 'badge-draft', 'Finalised': 'badge-primary', 'Sent': 'badge-info', 'Accepted': 'badge-success', 'Declined': 'badge-danger' };

  const columns = [
    { key: 'number', label: 'Quote #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '110px' },
    { key: 'customerName', label: 'Customer' },
    { key: 'title', label: 'Description', render: (r) => `<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${escapeHTML(r.title || '')}</span>` },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`, width: '100px' },
    { key: 'total', label: 'Total', render: (r) => `<span class="font-semibold">$${(r.total || 0).toLocaleString('en-AU',{minimumFractionDigits:2})}</span>`, getValue: (r) => r.total, width: '110px' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString(), getValue: (r) => new Date(r.createdAt).getTime(), width: '100px' },
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/quotes/${id}`), 
    emptyMessage: 'No quotes found', 
    emptyIcon: 'request_quote',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Batch Send/Email',
            icon: 'send',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: 'Confirm Bulk Email',
                  content: `<p>Are you sure you want to email ${ids.length} proposals to customers? This will set their statuses to 'Sent'.</p>`,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Send Emails', className: 'btn-primary', onClick: c => {
                      ids.forEach(id => store.update('quotes', id, { status: 'Sent' }));
                      table.clearSelection();
                      renderQuotesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Sent ${ids.length} quotes to customers`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Convert to Jobs',
            icon: 'construction',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: 'Confirm Job Conversion',
                  content: `<p>Are you sure you want to convert all ${ids.length} selected quotes into active Project Jobs? This will set quote statuses to 'Accepted'.</p>`,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Convert to Jobs', className: 'btn-primary', onClick: c => {
                      const techs = (store.getAll('technicians') || []).filter(t => !t.deactivated);
                      ids.forEach(id => {
                        const quote = store.getById('quotes', id);
                        if (quote) {
                          const tech = techs[Math.floor(Math.random() * techs.length)];
                          let laborCost = 0;
                          let materialCost = 0;
                          (quote.sections || []).forEach(sec => {
                            (sec.lineItems || []).forEach(i => {
                              if (i.type === 'labor') laborCost += i.total;
                              if (i.type === 'material') materialCost += i.total;
                            });
                          });

                          const jobTasks = (quote.sections || []).map(sec => ({
                            id: store.generateId(),
                            name: sec.name,
                            status: 'Not Started',
                            progress: 0,
                            startDate: new Date().toISOString(),
                            technicians: []
                          }));

                          const newJob = store.create('jobs', {
                            number: `J-${Date.now().toString().slice(-6)}`,
                            customerId: quote.customerId,
                            customerName: quote.customerName,
                            contactName: quote.contactName || '',
                            title: quote.title || `Job from Quote ${quote.number}`,
                            type: 'Project',
                            status: 'Pending',
                            priority: 'Medium',
                            technicianId: tech?.id,
                            technicianName: tech?.name,
                            quoteId: id,
                            tasks: jobTasks,
                            phases: jobTasks,
                            laborCost: laborCost,
                            materialCost: materialCost,
                            estimatedLaborCost: laborCost,
                            estimatedMaterialCost: materialCost,
                          });

                          const activity = store.getAll('activity') || [];
                          activity.push({
                            id: Date.now() + Math.random(),
                            jobId: newJob.id,
                            type: 'job_converted_from_quote',
                            text: `Live job ${newJob.number} created from accepted Quote ${quote.number}.`,
                            user: 'System Automation',
                            timestamp: new Date().toISOString()
                          });
                          store.save('activity', activity);

                          import('../../components/Notifications.js').then(({ addSystemNotification }) => {
                            addSystemNotification(
                              'New Job Assigned',
                              `You have been assigned to Live Job ${newJob.number} (${newJob.title}).`,
                              `/jobs/${newJob.id}`
                            );
                          });

                          store.update('quotes', id, { status: 'Accepted' });
                        }
                      });
                      table.clearSelection();
                      renderQuotesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Successfully converted ${ids.length} quotes to active jobs`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Bulk Archive',
            icon: 'archive',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: 'Confirm Bulk Archive',
                  content: `<p>Are you sure you want to archive the ${ids.length} selected quotes?</p>`,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Archive Quotes', className: 'btn-primary', onClick: c => {
                      ids.forEach(id => store.update('quotes', id, { status: 'Archived' }));
                      table.clearSelection();
                      renderQuotesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Archived ${ids.length} quotes`, 'success'));
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
                    <option value="Draft">Draft</option>
                    <option value="Finalised">Finalised</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Quotes`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('quotes', id, { status: newStatus }));
                      table.clearSelection();
                      renderQuotesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} quotes to ${newStatus}`, 'success'));
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
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} quotes? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('quotes', id));
                      table.clearSelection();
                      renderQuotesList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} quotes`, 'success'));
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
  container.querySelector('#quotes-table-container').appendChild(table);
  const btnNewQuote = container.querySelector('#btn-new-quote');
  if (btnNewQuote) {
    btnNewQuote.addEventListener('click', () => router.navigate('/quotes/new'));
  }

  let activeStatusFilter = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  function applyFilters() {
    let filtered = [...quotes];
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === activeStatusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(qt => {
        const num = qt.number || '';
        const custName = qt.customerName || '';
        const title = qt.title || '';
        return num.toLowerCase().includes(q) || 
               custName.toLowerCase().includes(q) || 
               title.toLowerCase().includes(q);
      });
    }
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(q => {
        const dateVal = q.createdAt || '';
        const qDateStr = dateVal ? dateVal.split('T')[0] : '';
        if (filterStartDate && qDateStr < filterStartDate) return false;
        if (filterEndDate && qDateStr > filterEndDate) return false;
        return true;
      });
    }
    table.updateData(filtered);
  }

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  container.querySelector('#quotes-search').addEventListener('input', (e) => {
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

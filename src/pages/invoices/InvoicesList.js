// ============================================
// RELAY DISPATCH — INVOICES LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { roundCurrency } from '../../utils/pricing.js';
import { readKpiListFilter, mountKpiFilterChip } from '../../utils/kpiListFilter.js';
import { todayLocalISO } from '../../utils/dateUtils.js';
import { xeroEnabled, getXeroStatusCached, fetchInvoiceSyncJobs, cachedXeroStatus, cachedInvoiceSyncJobs, xeroSyncBadgeHtml, pushToXero } from '../../utils/xero.js';
import { xeroImportCsv, plainCsv, downloadCsv } from '../../utils/accountingExport.js';
import { dueDateForCustomer } from '../../utils/customerTerms.js';

export function renderInvoicesList(container) {
  const invoices = store.getAll('invoices');

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Invoices</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Statuses (${invoices.length})</option>
          ${['Draft','Sent','Paid','Overdue','Void'].map(s => `<option value="${s}">${s} (${invoices.filter(i => i.status === s).length})</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" id="btn-export-accounting" data-tooltip="Download the invoices shown, as a Xero import file or a spreadsheet" data-tooltip-pos="left" style="display:none; height:25px; font-size:11px; padding:0 10px; align-self:center;"><span class="material-icons-outlined" style="font-size:13px;">download</span> Export</button>
        <button class="btn btn-primary btn-sm" id="btn-new-invoice" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;"><span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Invoice</span></button>
      </div>
    </div>
    <div id="invoices-table-container"></div>
  `;

  let filteredData = [...invoices];
  const sb = { 'Draft':'badge-draft','Sent':'badge-info','Paid':'badge-success','Overdue':'badge-danger','Void':'badge-void' };

  // The Xero column shows once the company is known to be connected. The status
  // and the queued-jobs lookup are cached, so the re-render below happens once.
  const showXero = xeroEnabled() && !!cachedXeroStatus()?.connected;
  const xeroJobs = cachedInvoiceSyncJobs();
  const xeroSignature = () => `${!!cachedXeroStatus()?.connected}|${[...cachedInvoiceSyncJobs().entries()].map(([k, v]) => `${k}:${v.pending}:${v.failed.length}`).join(',')}`;
  const renderedSignature = xeroSignature();

  const columns = [
    { key: 'number', label: 'Invoice #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '14%' },
    { key: 'customerName', label: 'Customer', width: showXero ? '20%' : '30%' },
    { key: 'jobNumber', label: 'Job Ref', render: (r) => { const refs = store.invoiceJobNumbers(r); return refs.length ? `<span class="text-secondary">${escapeHTML(refs.join(', '))}</span>` : '—'; }, width: '14%' },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${sb[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`, width: '12%' },
    { key: 'total', label: 'Total', render: (r) => `<span class="font-semibold">$${(r.total || 0).toLocaleString('en-AU',{minimumFractionDigits:2})}</span>`, getValue: (r) => r.total, width: '14%' },
    { key: 'issueDate', label: 'Date', render: (r) => r.issueDate ? new Date(r.issueDate.includes('T') ? r.issueDate : r.issueDate + 'T00:00:00').toLocaleDateString('en-AU') : '—', getValue: (r) => r.issueDate ? new Date(r.issueDate).getTime() : 0, width: '16%' },
  ];
  if (showXero) {
    columns.push({
      key: 'xero', label: 'Xero', width: '10%',
      render: (r) => xeroSyncBadgeHtml(r, xeroJobs.get(String(r.id)), escapeHTML),
      getValue: (r) => r.xeroSyncError ? 0 : r.xeroInvoiceId ? 2 : 1,
    });
  }

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
          ...(showXero ? [{
            label: 'Send to Xero',
            icon: 'sync',
            onClick: async (ids) => {
              const [{ showConfirm }, { showToast }] = await Promise.all([
                import('../../utils/confirmDialog.js'),
                import('../../components/Notifications.js'),
              ]);
              const confirmed = await showConfirm(
                `Send ${ids.length} invoice${ids.length === 1 ? '' : 's'} to Xero? Drafts and voids are skipped. Invoices already in Xero are updated, unless Xero holds a payment on them.`,
                { title: 'Send to Xero', confirmLabel: 'Send to Xero' });
              if (!confirmed) return;
              try {
                const n = await pushToXero(ids);
                table.clearSelection();
                showToast(`${n} invoice${n === 1 ? '' : 's'} queued for Xero`, 'success');
              } catch (err) {
                showToast(err.message || 'Could not send to Xero', 'error');
              }
            }
          }] : []),
          {
            label: 'Export CSV',
            icon: 'download',
            onClick: (ids) => {
              const picked = ids.map(id => store.getById('invoices', id)).filter(Boolean);
              downloadCsv(`invoices_${todayLocalISO()}.csv`, plainCsv(picked, { jobRefs: (inv) => store.invoiceJobNumbers(inv) }));
              table.clearSelection();
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Exported ${picked.length} invoice${picked.length === 1 ? '' : 's'}`, 'success'));
            }
          },
          {
            label: 'Mark Paid',
            icon: 'check_circle',
            onClick: (ids) => {
              // paidDate (not the old datePaid, which had no column) is what the
              // Paid date shows and what a Xero payment is dated by.
              ids.forEach(id => store.update('invoices', id, { status: 'Paid', paidDate: todayLocalISO() }));
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
                            const lineItems = (sec.lineItems || []).map(li => ({
                              ...li,
                              description: `${inv.number} — ${li.description}`
                            }));
                            if (combinedSections.length === 0) {
                              combinedSections.push({
                                id: store.generateId(),
                                name: 'Items',
                                lineItems: lineItems
                              });
                            } else {
                              combinedSections[0].lineItems.push(...lineItems);
                            }
                          });
                        } else {
                          // Fallback: create a section from the invoice total
                          const fallbackItem = {
                            description: `${inv.title || 'Invoice'} (${inv.number})`,
                            type: 'other',
                            qty: 1,
                            rate: inv.subtotal || inv.total || 0,
                            unitPrice: inv.subtotal || inv.total || 0,
                            total: inv.subtotal || inv.total || 0
                          };
                          
                          if (combinedSections.length === 0) {
                            combinedSections.push({
                              id: store.generateId(),
                              name: 'Items',
                              lineItems: [fallbackItem]
                            });
                          } else {
                            combinedSections[0].lineItems.push(fallbackItem);
                          }
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
                        tax: roundCurrency(subtotal * taxRate),
                        total: roundCurrency(subtotal * (1 + taxRate)),
                        issueDate: new Date().toISOString(),
                        dueDate: dueDateForCustomer(store.getById('customers', invoices[0].customerId)).toISOString()
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
    btnExport.style.display = data.some(i => i.status !== 'Draft' && i.status !== 'Void') ? 'inline-flex' : 'none';
  }

  updateExportButtonVisibility(filteredData);

  let activeStatusFilter = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';
  // Opened from a dashboard KPI card (?filter=overdue&period=month)
  let kpiFilter = readKpiListFilter('invoices');

  function applyFilters() {
    let filtered = [...invoices];
    if (kpiFilter) filtered = filtered.filter(kpiFilter.test);
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === activeStatusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => {
        const num = i.number || '';
        const custName = i.customerName || '';
        const jobNum = store.invoiceJobNumbers(i).join(', ');
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

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      filterStartDate = start;
      filterEndDate = end;
      applyFilters();
    }
  });

  setListSearch('Search invoices...', (q) => {
    searchQuery = q;
    applyFilters();
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    activeStatusFilter = e.target.value;
    applyFilters();
  });

  if (kpiFilter) {
    mountKpiFilterChip(container, kpiFilter, () => { kpiFilter = null; applyFilters(); });
    applyFilters();
  }

  // Learn whether Xero is connected and what is still queued, then redraw once
  // if that changes the table. Skipped if the user has started filtering, so a
  // late answer never wipes what they typed.
  if (xeroEnabled()) {
    getXeroStatusCached().then((st) => (st?.connected ? fetchInvoiceSyncJobs() : null)).then(() => {
      const untouched = !searchQuery && activeStatusFilter === 'all' && !filterStartDate && !filterEndDate;
      if (untouched && container.isConnected && container.contains(table) && xeroSignature() !== renderedSignature) {
        renderInvoicesList(container);
      }
    }).catch(() => { /* the list works without the Xero column */ });
  }

  btnExport.addEventListener('click', () => openAccountingExport(filteredData));
}

// "Export for accounting": a Xero import file coded like the live sync, or a
// plain spreadsheet. Drafts and voids are left out of both.
function openAccountingExport(list) {
  const exportable = list.filter(i => i.status !== 'Draft' && i.status !== 'Void');
  const settings = store.getSettings() || {};
  const xero = settings.xero && typeof settings.xero === 'object' ? settings.xero : {};
  const savedDefault = (settings.accountingExport || {}).defaultSalesAccountCode || xero.defaultSalesAccountCode || '';
  const content = document.createElement('div');
  content.innerHTML = `
    <p style="margin:0 0 14px;color:var(--text-secondary);">${exportable.length} invoice${exportable.length === 1 ? '' : 's'} in the current view. Drafts and voids are left out.</p>
    <fieldset style="border:0;padding:0;margin:0 0 14px;display:flex;flex-direction:column;gap:10px;">
      <legend class="form-label">Format</legend>
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
        <input type="radio" name="export-format" value="xero" checked style="margin-top:3px;" />
        <span><strong>Xero import file</strong><br><span style="color:var(--text-secondary);font-size:13px;">One row per line, coded with your accounts and tagged with each job's cost center as a Xero tracking option. Xero imports them as awaiting payment, so payments aren't included. The tracking options must already exist in Xero; when Xero is connected, RELAY adds them for you.</span></span>
      </label>
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
        <input type="radio" name="export-format" value="plain" style="margin-top:3px;" />
        <span><strong>Spreadsheet (CSV)</strong><br><span style="color:var(--text-secondary);font-size:13px;">One row per invoice, for your accountant or Excel.</span></span>
      </label>
    </fieldset>
    <div class="form-group" id="export-account-wrap" style="margin:0;">
      <label class="form-label" for="export-default-account">Default sales account code</label>
      <input class="form-input" id="export-default-account" value="${escapeHTML(savedDefault)}" placeholder="200" style="max-width:160px;" />
      <div style="color:var(--text-tertiary);margin-top:4px;font-size:12px;">For lines no cost center or labour/materials account covers. Use the code from your chart of accounts.</div>
    </div>`;
  const accountWrap = content.querySelector('#export-account-wrap');
  content.querySelectorAll('input[name="export-format"]').forEach(r => r.addEventListener('change', () => {
    accountWrap.style.display = content.querySelector('input[name="export-format"]:checked').value === 'xero' ? '' : 'none';
  }));

  Promise.all([import('../../components/Modal.js'), import('../../components/Notifications.js')]).then(([{ showModal }, { showToast }]) => {
    showModal({
      title: 'Export for accounting',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Download', className: 'btn-primary', onClick: async (c) => {
          if (!exportable.length) { showToast('There are no sent invoices in this view to export.', 'info'); return; }
          const today = todayLocalISO();
          if (content.querySelector('input[name="export-format"]:checked').value === 'plain') {
            downloadCsv(`invoices_${today}.csv`, plainCsv(exportable, { jobRefs: (inv) => store.invoiceJobNumbers(inv) }));
            showToast(`Exported ${exportable.length} invoice${exportable.length === 1 ? '' : 's'}`, 'success');
            c();
            return;
          }
          const fallback = content.querySelector('#export-default-account').value.trim();
          const result = xeroImportCsv(exportable, {
            customers: store.getAll('customers') || [],
            jobs: store.getAll('jobs') || [],
            costCenters: store.getAll('costCenters') || [],
            settings: { ...xero, ...(fallback ? { defaultSalesAccountCode: fallback } : {}) },
          });
          if (!result.exported) {
            showToast(result.skipped[0]?.reason || 'Nothing could be exported.', 'error');
            return;
          }
          if (fallback && fallback !== savedDefault) {
            const s = store.getSettings() || {};
            s.accountingExport = { ...(s.accountingExport || {}), defaultSalesAccountCode: fallback };
            try { await store.saveSettings(s); } catch (_) { /* only a remembered default */ }
          }
          downloadCsv(`xero_invoices_${today}.csv`, result.csv);
          const skippedNote = result.skipped.length ? `. Skipped ${result.skipped.length}: ${result.skipped[0].number} (${result.skipped[0].reason})${result.skipped.length > 1 ? ' and others' : ''}` : '';
          showToast(`Exported ${result.exported} invoice${result.exported === 1 ? '' : 's'}${skippedNote}`, result.skipped.length ? 'info' : 'success');
          c();
        }}
      ]
    });
  });
}

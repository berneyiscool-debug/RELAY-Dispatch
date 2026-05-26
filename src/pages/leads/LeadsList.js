// ============================================
// SIMPRO CLONE — LEADS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';

export function renderLeadsList(container) {
  const leads = store.getAll('leads');
  const openLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
  
  const likelihoods = {
    'New': 10,
    'Contacted': 30,
    'Qualified': 50,
    'Proposal': 70,
    'Negotiation': 85,
    'Won': 100,
    'Lost': 0
  };

  const totalOpenValue = openLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const weightedForecast = openLeads.reduce((sum, l) => {
    const prob = likelihoods[l.status] || 0;
    return sum + (l.value || 0) * (prob / 100);
  }, 0);

  const wonCount = leads.filter(l => l.status === 'Won').length;
  const lostCount = leads.filter(l => l.status === 'Lost').length;
  const totalClosed = wonCount + lostCount;
  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

  container.innerHTML = `
    <div class="page-header">
      <h1>Leads</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-lead">
          <span class="material-icons-outlined">add</span> New Lead
        </button>
      </div>
    </div>

    <!-- Forecasting Dashboard Summaries -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:24px">
      <!-- Card 1: Pipeline Value -->
      <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-primary)">
        <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); display:flex; align-items:center; justify-content:center">
            <span class="material-icons-outlined" style="font-size:24px">trending_up</span>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Total Open Pipeline</div>
            <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">$${totalOpenValue.toLocaleString('en-AU', { maximumFractionDigits: 0 })}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${openLeads.length} active opportunities</div>
          </div>
        </div>
      </div>
      <!-- Card 2: Weighted Value -->
      <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-success)">
        <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--color-success-bg); color:var(--color-success); display:flex; align-items:center; justify-content:center">
            <span class="material-icons-outlined" style="font-size:24px">insights</span>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Weighted Sales Forecast</div>
            <div style="font-size:22px; font-weight:800; color:var(--color-success-dark); margin-top:4px">$${weightedForecast.toLocaleString('en-AU', { maximumFractionDigits: 0 })}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Adjusted by probability</div>
          </div>
        </div>
      </div>
      <!-- Card 3: Win Rate -->
      <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-warning)">
        <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--color-warning-bg); color:var(--color-warning-dark); display:flex; align-items:center; justify-content:center">
            <span class="material-icons-outlined" style="font-size:24px">emoji_events</span>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Lead Conversion Rate</div>
            <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">${winRate}%</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${wonCount} Won / ${lostCount} Lost closed leads</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${leads.length})</button>
        <button class="toolbar-filter" data-filter="New">New</button>
        <button class="toolbar-filter" data-filter="Contacted">Contacted</button>
        <button class="toolbar-filter" data-filter="Qualified">Qualified</button>
        <button class="toolbar-filter" data-filter="Won">Won</button>
        <button class="toolbar-filter" data-filter="Lost">Lost</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search leads..." id="leads-search" />
      </div>
    </div>
    <div id="leads-table-container"></div>
  `;

  let filteredData = [...leads];

  const statusBadges = {
    'New': 'badge-info', 'Contacted': 'badge-primary', 'Qualified': 'badge-warning',
    'Proposal': 'badge-warning', 'Negotiation': 'badge-primary', 'Won': 'badge-success', 'Lost': 'badge-danger',
  };
  const priorityBadges = { 'Low': 'badge-neutral', 'Medium': 'badge-warning', 'High': 'badge-danger' };

  const columns = [
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
    { key: 'value', label: 'Value', render: (r) => `<span class="font-medium">$${(r.value || 0).toLocaleString()}</span>`, getValue: (r) => r.value },
    { key: 'createdAt', label: 'Created', render: (r) => `<span class="text-secondary">${new Date(r.createdAt).toLocaleDateString()}</span>`, getValue: (r) => new Date(r.createdAt).getTime() },
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

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...leads] : leads.filter(l => l.status === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#leads-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = leads.filter(l => l.title.toLowerCase().includes(q) || l.customerName.toLowerCase().includes(q));
    table.updateData(filteredData);
  });
}

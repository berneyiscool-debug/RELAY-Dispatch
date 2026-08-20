import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { setListSearch } from '../../utils/listSearch.js';

export function renderRecurringTemplatesList(container, params) {
  const customerId = params?.customerId;
  const customer = customerId ? store.getById('customers', customerId) : null;
  const allJobs = store.getAll('jobs') || [];
  
  // Filter master recurring templates
  let templates = allJobs.filter(j => j.isRecurring === true || j.status === 'Recurring Template');
  if (customerId) {
    templates = templates.filter(j => j.customerId === customerId);
  }

  const canCreate = hasPermission('Jobs', 'create');

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div>
        <h1 style="margin:0; font-size:22px;">${customer ? `Recurring Templates — ${escapeHTML(customer.company)}` : 'Recurring Templates & Contracts'}</h1>
        <p class="text-secondary" style="margin:4px 0 0 0; font-size:13px">Master repeating service plans used to generate scheduled maintenance jobs.</p>
      </div>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <select id="filter-freq-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:160px; margin:0; align-self:center;">
          <option value="">All Frequencies (${templates.length})</option>
          <option value="Weekly">Weekly (${templates.filter(t => t.recurringConfig?.freq === 'Weekly').length})</option>
          <option value="Monthly">Monthly (${templates.filter(t => t.recurringConfig?.freq === 'Monthly').length})</option>
          <option value="Daily">Daily (${templates.filter(t => t.recurringConfig?.freq === 'Daily').length})</option>
        </select>
        ${canCreate ? `
          <button class="btn btn-primary btn-sm" id="btn-new-template" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Template</span>
          </button>` : ''}
      </div>
    </div>
    <div id="templates-table-container"></div>
  `;

  let selectedFreq = '';
  let searchQuery = '';

  const pb = { 'Low':'badge-neutral','Medium':'badge-warning','High':'badge-danger','Urgent':'badge-danger' };

  const columns = [
    { key: 'number', label: 'Template #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '11%' },
    { key: 'title', label: 'Template Title', render: (r) => `<span class="text-primary font-medium" style="display:block; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(r.title)}">${escapeHTML(r.title)}</span>`, width: '25%' },
    { key: 'customerName', label: 'Customer', width: '18%' },
    { key: 'frequency', label: 'Frequency', render: (r) => `<span class="badge badge-purple" style="font-weight:600">${escapeHTML(r.recurringConfig?.freq || 'Monthly')}</span>`, width: '12%' },
    { key: 'days', label: 'Scheduled Days', render: (r) => {
        if (!r.recurringConfig) return '—';
        if (r.recurringConfig.freq === 'Weekly') {
          const daysMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
          let days = (r.recurringConfig.daysOfWeek || []).map(d => daysMap[d]).join(', ');
          return days || '—';
        } else if (r.recurringConfig.freq === 'Monthly') {
          let days = (r.recurringConfig.daysOfMonth || []).map(d => `Day ${d}`).join(', ');
          return days || '—';
        }
        return 'Every Day';
      }, width: '14%' },
    { key: 'spawned', label: 'Spawned Jobs', render: (r) => {
        const spawnedCount = allJobs.filter(j => j.parentJobId === r.id || (j.number && (j.number.startsWith(r.number + '.') || j.number.startsWith(r.number.replace(/^(T-|TEMP-|TEM-)/, 'J-') + '.')))).length;
        return `<span style="font-weight:600; color:var(--color-primary)">${spawnedCount} jobs</span>`;
      }, width: '10%' },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${pb[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>`, width: '10%' }
  ];

  const table = createDataTable({
    columns,
    data: templates,
    onRowClick: (id) => router.navigate(`/jobs/${id}`),
    emptyMessage: 'No recurring templates created yet',
    emptyIcon: 'event_repeat',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Delete Selected Templates',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} recurring templates? This will not delete previously generated child jobs.</p>`;
                showModal({
                  title: 'Confirm Delete Templates',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete Templates', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('jobs', id));
                      table.clearSelection();
                      renderRecurringTemplatesList(container, params);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} templates`, 'success'));
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

  container.querySelector('#templates-table-container').appendChild(table);

  const btnNew = container.querySelector('#btn-new-template');
  if (btnNew) {
    btnNew.addEventListener('click', () => router.navigate('/jobs/new?isRecurring=true'));
  }

  function applyFilters() {
    const q = searchQuery.toLowerCase();
    const filtered = templates.filter(t => {
      if (selectedFreq && t.recurringConfig?.freq !== selectedFreq) {
        return false;
      }
      if (q) {
        const num = String(t.number || '');
        const title = String(t.title || '');
        const cust = String(t.customerName || '');
        if (!num.toLowerCase().includes(q) && !title.toLowerCase().includes(q) && !cust.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
    table.updateData(filtered);
  }

  setListSearch('Search Templates', (q) => {
    searchQuery = q;
    applyFilters();
  });

  container.querySelector('#filter-freq-select')?.addEventListener('change', (e) => {
    selectedFreq = e.target.value;
    applyFilters();
  });
}

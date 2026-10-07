// ============================================
// RELAY DISPATCH — LEADS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { setListSearch, clearListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { isCloudUser } from '../../utils/aiTier.js';
import { showCloudUpgradePrompt } from '../../components/CloudUpgrade.js';
import { todayLocalISO } from '../../utils/dateUtils.js';
import {
  LEAD_STAGES, OPEN_STAGES, LEAD_LIKELIHOOD, LEAD_PRIORITY_BADGES,
  STALE_DAYS, isLeadStale, isOpenLead, leadNextActionHtml, leadOwnerHtml, leadStageBadge,
  logLeadStageChange, notifyLeadOwner, primaryLeadStage,
  summarizeByStage, weightedLeadValue,
} from './leadStages.js';

export function renderLeadsList(container, params) {
  const hash = window.location.hash || '';
  const cloud = isCloudUser();
  const wantsMarket = (params && params.tab === 'Marketplace') || /[?&]market=1/.test(hash);
  // The Marketplace is a cloud-only lead source, so a local workspace always
  // falls back to Internal. Keep in sync with the greyed-out tab in Sidebar.js.
  const startOnMarket = wantsMarket && cloud ? 'market' : 'leads';
  if (wantsMarket && !cloud) {
    showCloudUpgradePrompt('The Leads Marketplace');
  }

  if (startOnMarket === 'market') {
    clearListSearch();
    renderLeadsTable(container, {
      origin: 'Marketplace',
      containerId: 'market-table-container',
      searchLabel: 'Search marketplace leads...',
      emptyMessage: 'No marketplace leads yet',
      emptyIcon: 'storefront',
      newLeadHref: '/leads/new?origin=Marketplace',
    });
    return;
  }

  renderLeadsTable(container, {
    origin: 'Internal',
    // A local workspace has no Marketplace tab, so its one list also shows any
    // Marketplace-origin lead carried over from an older install.
    includeAllOrigins: !cloud,
    containerId: 'leads-table-container',
    searchLabel: 'Search leads...',
    emptyMessage: 'No leads found',
    emptyIcon: 'trending_up',
    newLeadHref: '/leads/new',
  });
}

function renderLeadsTable(container, opts = {}) {
  const {
    origin = 'Internal',
    includeAllOrigins = false,
    containerId = 'leads-table-container',
    searchLabel = 'Search leads...',
    emptyMessage = 'No leads found',
    emptyIcon = 'trending_up',
    newLeadHref = '/leads/new',
  } = opts;

  const isMarket = origin === 'Marketplace';
  let allLeads = readLeads();

  function readLeads() {
    return store.getAll('leads').filter(l => includeAllOrigins || (isMarket ? l.origin === 'Marketplace' : l.origin !== 'Marketplace'));
  }
  
  function currentUserId() {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null')?.id || null;
    } catch {
      return null;
    }
  }

  function money(n, decimals = 0) {
    return '$' + (Number(n) || 0).toLocaleString('en-AU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function groupAccentFor(key) {
    if (key === 'Won') return 'success';
    if (key === 'Lost') return 'danger';
    if (key === 'Proposal' || key === 'Negotiation') return 'info';
    return null;
  }

  function leadNumber(r) {
    if (r.number) return r.number;
    const id = String(r.id || '');
    return 'LD-' + (id.includes('_') ? id.split('_')[1].padStart(5, '0') : id.substring(0, 5).toUpperCase());
  }

  // The stage control is a native select styled as a badge. The table cell
  // clips overflow, so a popover would be cut off, and the row-click handler
  // already ignores clicks that land on a select.
  function stageSelectHtml(r) {
    const stage = primaryLeadStage(r);
    const options = LEAD_STAGES.map(s => `<option value="${s}"${s === stage ? ' selected' : ''}>${s}</option>`).join('');
    return `<select class="badge lead-stage-select ${leadStageBadge(stage)}" data-lead-id="${escapeHTML(String(r.id))}" aria-label="Stage for ${escapeHTML(r.title || 'lead')}">${options}</select>`;
  }

  function groupHeaderHtml(summary) {
    const closed = summary.key === 'Won' || summary.key === 'Lost';
    // Won/Lost have nothing left to weight, so they report value only.
    const label = closed
      ? money(summary.totalValue)
      : `${money(summary.totalValue)} · ${money(summary.weightedValue)} weighted`;
    const valueHtml = summary.count ? `<span class="dt-group-value">${label}</span>` : '';
    return `<span class="dt-group-label">${escapeHTML(summary.label)}</span>`
      + `<span class="dt-group-count">${summary.count}</span>`
      + valueHtml;
  }

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:6px;">
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <select id="leads-chip-select" class="form-select" aria-label="Quick filter" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;"></select>
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-group-toggle" aria-pressed="false" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
          <span class="material-icons-outlined" style="font-size:13px;">view_list</span> <span class="btn-label" id="btn-group-label">Group by Stage</span>
        </button>
        <button class="btn btn-primary btn-sm" id="btn-new-lead" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
          <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Lead</span>
        </button>
      </div>
    </div>
    <div class="leads-kpi-strip" id="leads-kpi-strip"></div>
    <div id="${containerId}"></div>
  `;

  const columns = [
    { key: 'number', label: 'Lead #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(leadNumber(r))}</span>`, getValue: (r) => r.number || r.id, width: '8%' },
    { key: 'title', label: 'Lead', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.title)}</span>`, width: '17%' },
    { key: 'customerName', label: 'Customer', render: (r) => `<span class="text-secondary">${escapeHTML(r.customerName)}</span>`, width: '12%' },
    { key: 'source', label: 'Source', render: (r) => `<span class="text-secondary">${escapeHTML(r.source)}</span>`, width: '6%' },
    { key: 'status', label: 'Status', render: (r) => stageSelectHtml(r), width: '13%' },
    { key: 'assignedToName', label: 'Owner', render: (r) => leadOwnerHtml(r), getValue: (r) => r.assignedToName || r.salesRepName || '', width: '12%' },
    { key: 'nextActionDate', label: 'Next Action', render: (r) => leadNextActionHtml(r), getValue: (r) => r.nextActionDate || '', width: '9%' },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${LEAD_PRIORITY_BADGES[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>`, width: '7%' },
    { key: 'value', label: 'Value', render: (r) => `<span class="font-medium">${money(r.value, 2)}</span>`, getValue: (r) => r.value, width: '8%' },
    { key: 'createdAt', label: 'Date', render: (r) => `<span class="text-secondary">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-AU') : '—'}</span>`, getValue: (r) => r.createdAt ? new Date(r.createdAt).getTime() : 0, width: '8%' },
  ];

  const groupStorageKey = `leads-grouped-${origin}`;
  let groupingOn = localStorage.getItem(groupStorageKey) !== 'off';

  const stageGrouping = {
    getKey: (l) => l.status || 'New',
    order: LEAD_STAGES,
    labelFor: (key) => key,
    persistKey: `leads-collapsed-${origin}`,
    accentFor: (key) => groupAccentFor(key),
    summarize: (rows) => ({
      totalValue: rows.reduce((sum, r) => sum + (Number(r.value) || 0), 0),
      weightedValue: rows.reduce((sum, r) => sum + weightedLeadValue(r), 0),
    }),
    headerHtml: (summary) => groupHeaderHtml(summary),
    onMove: ({ id, toKey }) => {
      if (moveLeadToStage(id, toKey)) applyFilters();
    },
  };

  const table = createDataTable({
    columns, data: allLeads,
    groupBy: groupingOn ? stageGrouping : null,
    onRowClick: (id) => router.navigate(`/leads/${id}`),
    emptyMessage, emptyIcon,
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Assign Sales Rep',
            icon: 'assignment_ind',
            onClick: (ids) => {
              const techs = store.getAll('technicians').filter(t => !t.deactivated);
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Sales Representative</label>
                  <select class="form-select" id="bulk-tech">
                    <option value="">-- Select Sales Rep --</option>
                    ${techs.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Assign ${ids.length} Leads`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Assign', className: 'btn-primary', onClick: c => {
                      const techId = content.querySelector('#bulk-tech').value;
                      if (!techId) return;
                      const tech = store.getById('technicians', techId);
                      if (tech) {
                        ids.forEach(id => {
                          store.update('leads', id, {
                            assignedTo: tech.id,
                            assignedToName: tech.name,
                            salesRepName: tech.name
                          });
                        });
                        table.clearSelection();
                        renderLeadsList(container);
                        import('../../components/Notifications.js').then(({ showToast }) => showToast(`Assigned ${ids.length} leads to ${tech.name}`, 'success'));
                      }
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Set Priority',
            icon: 'local_fire_department',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Select Priority</label>
                  <select class="form-select" id="bulk-priority">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Set Priority for ${ids.length} Leads`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const priority = content.querySelector('#bulk-priority').value;
                      ids.forEach(id => {
                        store.update('leads', id, { priority: priority });
                      });
                      table.clearSelection();
                      renderLeadsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated priority of ${ids.length} leads to ${priority}`, 'success'));
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
                    ${LEAD_STAGES.map(s => `<option value="${s}">${s}</option>`).join('')}
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
                      ids.forEach(id => moveLeadToStage(id, newStatus, { silent: true }));
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

  const tableMount = container.querySelector(`#${containerId}`);
  tableMount.appendChild(table);
  container.querySelector('#btn-new-lead').addEventListener('click', () => router.navigate(newLeadHref));

  const uid = currentUserId();
  const CHIPS = [
    { key: 'all', label: 'All', test: () => true },
    { key: 'mine', label: 'My Leads', test: (l) => Boolean(uid) && l.assignedTo === uid },
    { key: 'hot', label: 'Hot', test: (l) => isOpenLead(l) && (l.priority === 'High' || (LEAD_LIKELIHOOD[l.status] || 0) >= 70) },
    { key: 'stale', label: 'Stale', test: (l) => isOpenLead(l) && isLeadStale(l) },
    { key: 'unassigned', label: 'Unassigned', test: (l) => !l.assignedTo && !l.salesRepName },
    { key: 'due', label: 'Due this month', test: (l) => isOpenLead(l) && isDueThisMonth(l) },
  ];

  let activeChip = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  function isDueThisMonth(l) {
    const date = l.nextActionDate ? String(l.nextActionDate).split('T')[0] : '';
    return Boolean(date) && date.slice(0, 7) === todayLocalISO().slice(0, 7);
  }

  function updateKpis() {
    const open = allLeads.filter(isOpenLead);
    const won = allLeads.filter(l => l.status === 'Won');
    const staleCount = open.filter(l => isLeadStale(l)).length;
    const cards = [
      { label: 'Open Leads', value: String(open.length), sub: `${OPEN_STAGES.length} active stages` },
      { label: 'Open Pipeline', value: money(open.reduce((s, l) => s + (Number(l.value) || 0), 0)), sub: 'Unweighted total' },
      { label: 'Weighted Forecast', value: money(open.reduce((s, l) => s + weightedLeadValue(l), 0)), sub: 'By stage likelihood' },
      { label: 'Won', value: money(won.reduce((s, l) => s + (Number(l.value) || 0), 0)), sub: `${won.length} closed won`, cls: 'is-won' },
      { label: 'Stale', value: String(staleCount), sub: `No activity in ${STALE_DAYS}+ days`, cls: 'is-stale', zero: staleCount === 0 },
    ];
    const strip = container.querySelector('#leads-kpi-strip');
    if (!strip) return;
    strip.innerHTML = cards.map(c => `
      <div class="leads-kpi-card${c.cls ? ' ' + c.cls : ''}">
        <div class="leads-kpi-label">${escapeHTML(c.label)}</div>
        <div class="leads-kpi-value${c.zero ? ' is-zero' : ''}">${escapeHTML(c.value)}</div>
        <div class="leads-kpi-sub">${escapeHTML(c.sub)}</div>
      </div>`).join('');
  }

  // The quick filters live in the breadcrumb actions row as a single select
  // rather than a bar of chips, so the counts stay visible in the same place
  // as every other list filter.
  function updateChipOptions() {
    const select = container.querySelector('#leads-chip-select');
    if (!select) return;
    select.innerHTML = CHIPS.map(c => {
      const count = allLeads.filter(c.test).length;
      return `<option value="${c.key}">${escapeHTML(c.label)} (${count})</option>`;
    }).join('');
    select.value = activeChip;
  }

  function updateGroupToggle() {
    const btn = container.querySelector('#btn-group-toggle');
    const label = container.querySelector('#btn-group-label');
    if (btn) btn.setAttribute('aria-pressed', groupingOn ? 'true' : 'false');
    if (label) label.textContent = groupingOn ? 'Grouped by Stage' : 'Group by Stage';
  }

  function moveLeadToStage(id, toStage, { silent = false } = {}) {
    if (!id || !LEAD_STAGES.includes(toStage)) return false;
    const lead = store.getById('leads', id);
    if (!lead) return false;
    const fromStage = lead.status || 'New';
    if (fromStage === toStage) return false;
    store.update('leads', id, { status: toStage, stageHistory: logLeadStageChange(lead, fromStage, toStage) });
    notifyLeadOwner(lead, {
      title: 'Lead stage updated',
      message: `${lead.title || 'Lead'} moved from ${fromStage} to ${toStage}.`,
    });
    if (!silent) {
      import('../../components/Notifications.js').then(({ showToast }) => showToast(`${lead.title || 'Lead'} → ${toStage}`, 'success'));
    }
    return true;
  }

  function applyFilters() {
    allLeads = readLeads();
    updateKpis();
    updateChipOptions();

    const chip = CHIPS.find(c => c.key === activeChip) || CHIPS[0];
    let filtered = allLeads.filter(chip.test);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const title = l.title || '';
        const custName = l.customerName || '';
        return title.toLowerCase().includes(q) || 
               custName.toLowerCase().includes(q);
      });
    }
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(l => {
        const dateVal = l.createdAt || '';
        const lDateStr = dateVal ? dateVal.split('T')[0] : '';
        if (filterStartDate && lDateStr < filterStartDate) return false;
        if (filterEndDate && lDateStr > filterEndDate) return false;
        return true;
      });
    }
    table.updateData(filtered);
  }

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      filterStartDate = start;
      filterEndDate = end;
      applyFilters();
    }
  });

  setListSearch(searchLabel, (q) => {
    searchQuery = q;
    applyFilters();
  });

  container.querySelector('#btn-group-toggle')?.addEventListener('click', () => {
    groupingOn = !groupingOn;
    localStorage.setItem(groupStorageKey, groupingOn ? 'on' : 'off');
    updateGroupToggle();
    table.setGroupBy(groupingOn ? stageGrouping : null);
  });

  container.querySelector('#leads-chip-select')?.addEventListener('change', (e) => {
    activeChip = e.target.value;
    applyFilters();
  });

  // Delegated on the mount rather than the table, because DataTable replaces
  // its own wrapper's contents on every sort, page and grouping change.
  tableMount.addEventListener('change', (e) => {
    const select = e.target.closest('.lead-stage-select');
    if (!select) return;
    const id = select.dataset.leadId;
    if (moveLeadToStage(id, select.value)) {
      applyFilters();
    } else {
      const lead = store.getById('leads', id);
      if (lead) select.value = primaryLeadStage(lead);
    }
  });

  updateGroupToggle();
  applyFilters();
}


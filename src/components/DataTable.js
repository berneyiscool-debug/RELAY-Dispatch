// ============================================
// RELAY DISPATCH — REUSABLE DATA TABLE
// ============================================

import { escapeHTML } from '../utils/security.js';

// Header row emitted ahead of each group while `groupBy` is active. Exported so
// callers can keep it out of drag handles and row-level click handling.
export const GROUP_ROW_CLASS = 'dt-group-row';

function compareRows(sortCol, sortDir) {
  return (a, b) => {
    const aVal = sortCol.getValue ? sortCol.getValue(a) : a[sortCol.key];
    const bVal = sortCol.getValue ? sortCol.getValue(b) : b[sortCol.key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  };
}

/**
 * Decides which rows to display: sorted, optionally grouped, then sliced to the
 * current page. Kept pure so the grouping and paging rules are testable without
 * a DOM.
 *
 * `groupBy` is `{ getKey, order, labelFor, summarize?, headerHtml?, persistKey?, defaultCollapsed?, onMove? }`.
 * Rows sort by group order first and by the active sort column within each group.
 * Pages always count data rows, so a group straddling a page break comes back with
 * `continuation` set and totals that describe the whole group, not the visible slice.
 */
export function planTableRows({ data = [], sortCol = null, sortDir = 'desc', groupBy = null, pageSize = 15, currentPage = 1, collapsed = null, getId = null }) {
  const sorted = [...data];
  if (sortCol) sorted.sort(compareRows(sortCol, sortDir));

  if (!groupBy) {
    const totalPages = Math.ceil(sorted.length / pageSize);
    const page = currentPage > totalPages ? (totalPages || 1) : currentPage;
    const start = (page - 1) * pageSize;
    return {
      grouped: false,
      rows: sorted.slice(start, start + pageSize).map(row => ({ type: 'row', row, id: String(getId ? getId(row) : row.id) })),
      groups: [],
      total: sorted.length,
      visibleTotal: sorted.length,
      totalPages,
      currentPage: page,
      start,
      end: Math.min(start + pageSize, sorted.length),
    };
  }

  const keyOf = (row) => String(groupBy.getKey(row) ?? '');
  const declared = Array.isArray(groupBy.order) ? groupBy.order.map(String) : [];
  // Groups the caller declares keep their identity even at zero rows. Anything
  // else follows, ordered by first appearance in the data.
  const declaredSet = new Set(declared);
  const extras = [];
  const seenExtra = new Set();
  data.forEach(row => {
    const k = keyOf(row);
    if (!declaredSet.has(k) && !seenExtra.has(k)) { seenExtra.add(k); extras.push(k); }
  });

  const buckets = new Map(declared.concat(extras).map(k => [k, []]));
  sorted.forEach(row => buckets.get(keyOf(row)).push(row));

  const collapsedKeys = collapsed || new Set();
  const groups = declared.concat(extras).map(key => {
    const groupRows = buckets.get(key) || [];
    const totals = groupBy.summarize ? (groupBy.summarize(groupRows) || {}) : {};
    return {
      key,
      label: groupBy.labelFor ? groupBy.labelFor(key) : key,
      rows: groupRows,
      count: groupRows.length,
      ...totals,
      collapsed: collapsedKeys.has(key),
    };
  });

  // Collapsed groups take no page slots, so their header stays where it is while
  // the expanded groups paginate around it.
  const eligible = [];
  groups.forEach(group => {
    if (group.collapsed) return;
    group.rows.forEach(row => eligible.push({ group, row }));
  });
  const groupStart = new Map();
  eligible.forEach((entry, i) => {
    if (!groupStart.has(entry.group.key)) groupStart.set(entry.group.key, i);
  });

  const totalPages = Math.ceil(eligible.length / pageSize);
  const page = currentPage > totalPages ? (totalPages || 1) : currentPage;
  const start = (page - 1) * pageSize;
  const pageRows = eligible.slice(start, start + pageSize);
  const lastOnPage = start + pageRows.length - 1;

  const toSummary = (group) => {
    const { rows: _groupRows, ...rest } = group;
    return { ...rest, collapsed: group.collapsed };
  };

  const rows = [];
  groups.forEach(group => {
    if (group.collapsed) {
      const summary = toSummary(group);
      rows.push({ type: 'group', summary, ...summary, continuation: false, truncated: false, visibleFrom: 0, visibleCount: 0 });
      return;
    }
    const onPage = pageRows.filter(entry => entry.group === group);
    // A declared stage with no rows still gets a header: it is how an empty
    // pipeline stage stays visible, and it is the drop target that lets a row be
    // dragged into a stage nothing sits in yet.
    const isEmpty = group.count === 0;
    if (!onPage.length && !isEmpty) return;
    const first = groupStart.get(group.key);
    const summary = toSummary(group);
    rows.push({
      type: 'group',
      summary,
      ...summary,
      continuation: !isEmpty && first < start,
      truncated: !isEmpty && first + group.count - 1 > lastOnPage,
      visibleFrom: isEmpty ? 0 : (first < start ? start - first + 1 : 1),
      visibleCount: onPage.length,
    });
    onPage.forEach(entry => rows.push({ type: 'row', row: entry.row, id: String(getId ? getId(entry.row) : entry.row.id) }));
  });

  return {
    grouped: true,
    rows,
    groups: groups.map(toSummary),
    total: sorted.length,
    visibleTotal: eligible.length,
    totalPages,
    currentPage: page,
    start,
    end: Math.min(start + pageSize, eligible.length),
  };
}

/**
 * Works out which group a dropped row belongs to, from the planner's own output.
 *
 * `rows` is the display rows in their current order — group headers
 * (`type: 'group'`, carrying the group `key`) interleaved with data rows
 * (`type: 'row'`) — which is exactly what the renderer puts in the tbody.
 * `index` is the slot the dragged row occupies in that list once the browser has
 * inserted it. `dropTarget` is optional: the index of the header the pointer was
 * released over, for callers that can see the pointer; `null` means a plain
 * insertion between rows.
 *
 * The rules, in order:
 *  - a named header wins outright;
 *  - a row landing directly below a header joins that header, which is what makes
 *    an empty or collapsed stage (a header with no rows under it) droppable;
 *  - a row landing directly above a header joins that header too, so a populated
 *    header is as droppable as an empty one and a drop at the very top of the
 *    table still resolves to the first group;
 *  - otherwise the nearest header above wins (a drop between two rows, or below
 *    the last row of the last group), with the nearest header below as the
 *    fallback for a list with no header above the drop.
 *
 * `null` means "no group", which is all an ungrouped table can ever report.
 */
export function resolveDropGroup(rows, index, dropTarget = null) {
  if (!Array.isArray(rows) || !Number.isInteger(index) || index < 0 || index >= rows.length) return null;

  const named = dropTarget == null ? null : rows[dropTarget];
  if (named && named.type === 'group') return named.key;

  const above = rows[index - 1];
  if (above && above.type === 'group') return above.key;
  const below = rows[index + 1];
  if (below && below.type === 'group') return below.key;

  for (let i = index - 1; i >= 0; i--) {
    if (rows[i] && rows[i].type === 'group') return rows[i].key;
  }
  for (let i = index + 1; i < rows.length; i++) {
    if (rows[i] && rows[i].type === 'group') return rows[i].key;
  }
  return null;
}

export function createDataTable({ columns, data, onRowClick, getId, emptyMessage = 'No records found', emptyIcon = 'inbox', selectable = false, onSelectionChange = null, defaultSortKey = null, defaultSortDir = 'desc', groupBy = null }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card data-table-card';
  wrapper.style.cssText = 'width:100%; max-width:100%; overflow:hidden;';

  const STORAGE_KEY = 'relay_table_page_size';
  const savedSize = parseInt(localStorage.getItem(STORAGE_KEY) || '15', 10);
  let pageSize = [15, 30, 45, 60].includes(savedSize) ? savedSize : 15;
  
  // Default to most recent (descending) by date or number/id column
  let sortCol = defaultSortKey 
    ? (columns.find(c => c.key === defaultSortKey) || null)
    : (columns.find(c => ['createdAt', 'created_at', 'date', 'issueDate', 'orderDate', 'dueDate'].includes(c.key)) ||
       columns.find(c => ['number', 'id', 'code'].includes(c.key)) || null);
  
  let sortDir = defaultSortDir || 'desc';
  let currentPage = 1;
  let emptyText = emptyMessage;
  const selectedIds = new Set();

  let activeGroupBy = groupBy;
  const collapsedGroups = new Set(activeGroupBy?.defaultCollapsed || []);
  let sortableInstance = null;
  let dragFromKey = null;

  function loadCollapsed() {
    const key = activeGroupBy?.persistKey;
    if (!key) return;
    try {
      const stored = localStorage.getItem(key);
      if (stored == null) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      collapsedGroups.clear();
      parsed.forEach(k => collapsedGroups.add(String(k)));
    } catch { /* ignore unreadable state */ }
  }

  function saveCollapsed() {
    const key = activeGroupBy?.persistKey;
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(collapsedGroups)));
    } catch { /* ignore unwritable state */ }
  }

  loadCollapsed();

  // Drop resolution reads the live tbody rather than the plan that built it. By the
  // time onEnd fires SortableJS has already moved the row, so every header the row
  // crossed now sits at a different index than it did in the plan; resolving the
  // new slot against the old list reads a header a group too far down.

  function domRowIndex(tr) {
    const tbody = tr.parentElement;
    if (!tbody) return -1;
    let index = 0;
    for (let node = tbody.firstElementChild; node; node = node.nextElementSibling) {
      if (node === tr) return index;
      index++;
    }
    return -1;
  }

  // SortableJS counts only the draggable `tr[data-id]` nodes, so the headers the
  // planner interleaved with them never enter its index; the row's slot in the
  // tbody is what has to be resolved. Landing on either side of a header means
  // landing in that header's group — see `resolveDropGroup`, which the pointer
  // position would refine (its optional third argument) if a caller ever needs it.
  function dropGroupFor(tr) {
    const tbody = tr.parentElement;
    if (!tbody) return null;
    const live = [];
    for (let node = tbody.firstElementChild; node; node = node.nextElementSibling) {
      live.push(node.classList.contains(GROUP_ROW_CLASS)
        ? { type: 'group', key: node.dataset.group }
        : { type: 'row' });
    }
    return resolveDropGroup(live, domRowIndex(tr));
  }

  async function attachGroupDrag() {
    const tbody = wrapper.querySelector('tbody');
    if (!tbody) return;
    let Sortable;
    try {
      const mod = await import('sortablejs');
      Sortable = mod.default || mod;
    } catch {
      return; // dragging is a convenience; the caller's own stage control still works
    }
    if (typeof Sortable !== 'function') return;
    if (wrapper.querySelector('tbody') !== tbody) return; // re-rendered while awaiting

    sortableInstance = Sortable.create(tbody, {
      animation: 150,
      draggable: 'tr[data-id]',
      ghostClass: 'dt-drag-ghost',
      onStart: (evt) => { dragFromKey = dropGroupFor(evt.item); },
      onEnd: (evt) => {
        const id = evt.item.dataset.id;
        const toKey = dropGroupFor(evt.item);
        const fromKey = dragFromKey;
        dragFromKey = null;
        const moved = Boolean(id) && toKey != null && toKey !== fromKey;
        // Deferred because SortableJS is still unwinding; re-rendering inside its
        // callback would pull the node out from under it.
        setTimeout(() => {
          if (moved) {
            try {
              activeGroupBy.onMove({ id, fromKey, toKey });
            } catch (err) {
              console.error('Group move handler failed', err);
            }
          }
          render();
        }, 0);
      },
    });
  }

  function triggerSelectionChange() {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
  }

  function render() {
    if (sortableInstance) {
      try { sortableInstance.destroy(); } catch { /* already gone */ }
      sortableInstance = null;
    }

    const plan = planTableRows({
      data,
      sortCol,
      sortDir,
      groupBy: activeGroupBy,
      pageSize,
      currentPage,
      collapsed: collapsedGroups,
      getId,
    });
    currentPage = plan.currentPage;
    const rows = plan.rows;
    // rows is planned fresh on every render; dropGroupFor re-reads the tbody.
    const totalPages = plan.totalPages;
    const start = plan.start;
    const paged = rows.filter(item => item.type === 'row').map(item => item.row);

    if (data.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined">${escapeHTML(emptyIcon)}</span>
          <h3>${escapeHTML(emptyText)}</h3>
          <p>No records match the current filters, or there is nothing here yet.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';

    // Select All Checkbox
    if (selectable) {
      const allSelectedOnPage = paged.length > 0 && paged.every(r => selectedIds.has(String(getId ? getId(r) : r.id)));
      html += `<th class="dt-select-col"><input type="checkbox" class="dt-select-all" ${allSelectedOnPage ? 'checked' : ''}></th>`;
    }

    function getColumnMinWidth(col) {
      const k = (col.key || '').toLowerCase();
      const label = (col.label || '').toLowerCase();
      
      let calculated = '130px';
      if (['date', 'createdat', 'issuedate', 'duedate', 'scheduleddate', 'startdate'].some(x => k.includes(x) || label.includes(x))) {
        calculated = '115px';
      } else if (['status', 'owner', 'priority', 'compliance', 'service', 'category', 'type'].some(x => k.includes(x) || label.includes(x))) {
        calculated = '125px';
      } else if (k.includes('progress') || label.includes('progress')) {
        calculated = '165px';
      } else if (['number', 'id', 'code', 'sku', 'ref', 'po'].some(x => k.includes(x) || label.includes(x))) {
        calculated = '100px';
      } else if (['total', 'value', 'price', 'amount', 'cost'].some(x => k.includes(x) || label.includes(x))) {
        calculated = '95px';
      } else if (['qty', 'quantity', 'hours'].some(x => k.includes(x) || label.includes(x))) {
        calculated = '75px';
      }
      
      // Ensure header title text + sort icon + cell padding fits cleanly
      const labelNeededPx = (col.label || '').length * 9 + 36;
      let numericCalc = parseInt(calculated, 10) || 0;
      if (labelNeededPx > numericCalc) {
        calculated = labelNeededPx + 'px';
        numericCalc = labelNeededPx;
      }

      if (col.minWidth) {
        const numericColMin = parseInt(col.minWidth, 10) || 0;
        return (numericColMin > numericCalc ? col.minWidth : calculated);
      }
      return calculated;
    }

    columns.forEach(col => {
      const isSorted = sortCol && sortCol.key === col.key;
      const sortClass = isSorted ? ' sorted' : '';
      const sortIcon = isSorted ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
      const ariaSort = isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
      const alignClass = col.align === 'right' ? ' num' : '';
      const minWidth = getColumnMinWidth(col);
      html += `<th class="${sortClass}${alignClass}" data-key="${col.key}" role="button" tabindex="0" aria-sort="${ariaSort}" style="${col.width ? 'width:' + col.width + ';' : ''} min-width:${minWidth};">
        ${escapeHTML(col.label)}
        <span class="material-icons-outlined sort-icon" aria-hidden="true">${sortIcon}</span>
      </th>`;
    });

    html += '</tr></thead><tbody>';

    function rowHtml(row, rowId) {
      const isSelected = selectedIds.has(rowId);
      let html = `<tr data-id="${escapeHTML(rowId)}" style="cursor:pointer" class="${isSelected ? 'selected-row' : ''}">`;
      
      if (selectable) {
        html += `<td class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${escapeHTML(rowId)}" ${isSelected ? 'checked' : ''}>
        </td>`;
      }

      columns.forEach(col => {
        const value = col.render ? col.render(row) : escapeHTML(row[col.key] ?? '');
        html += `<td class="${col.align === 'right' ? 'num' : ''}">${value}</td>`;
      });
      return html + '</tr>';
    }

    const cellSpan = columns.length + (selectable ? 1 : 0);

    rows.forEach(item => {
      if (item.type === 'group') {
        const summary = item.summary;
        const inner = activeGroupBy.headerHtml
          ? activeGroupBy.headerHtml(summary)
          : `<span class="dt-group-label">${escapeHTML(summary.label)}</span><span class="dt-group-count">${summary.count}</span>`;
        const accent = typeof activeGroupBy.accentFor === 'function' ? activeGroupBy.accentFor(item.key) : null;
        html += `<tr class="${GROUP_ROW_CLASS}${item.collapsed ? ' collapsed' : ''}" data-group="${escapeHTML(String(item.key))}"${accent ? ` data-accent="${escapeHTML(String(accent))}"` : ''}>
        <td colspan="${cellSpan}">
          <button type="button" class="dt-group-toggle" aria-expanded="${item.collapsed ? 'false' : 'true'}" aria-label="${item.collapsed ? 'Expand' : 'Collapse'} ${escapeHTML(summary.label)}">
            <span class="material-icons-outlined" aria-hidden="true">${item.collapsed ? 'chevron_right' : 'expand_more'}</span>
          </button>
          ${inner}
        </td>
      </tr>`;
        return;
      }
      html += rowHtml(item.row, item.id);
    });

    html += '</tbody></table></div>';

    // Pagination
    html += `<div class="pagination">
      <div class="pagination-info" style="display:flex; align-items:center; gap:12px;">
        <span>Showing ${plan.visibleTotal === 0 ? 0 : start + 1}–${plan.end} of ${plan.visibleTotal}</span>
        <div class="pagination-page-size" style="position:relative; display:inline-flex; align-items:center; gap:4px; font-size:11px;">
          <span style="color:var(--text-secondary)">Per page:</span>
          <button type="button" class="btn btn-secondary btn-sm dt-page-size-trigger" style="height:22px; padding:0 6px; font-size:11px; display:inline-flex; align-items:center; gap:2px;">
            <span>${pageSize}</span>
            <span class="material-icons-outlined" style="font-size:13px">unfold_more</span>
          </button>
          <div class="dropdown-menu dropdown-menu-up dt-page-size-pop" hidden>
            ${[15, 30, 45, 60].map(sz => `
              <div class="dropdown-item dt-page-size-opt${sz === pageSize ? ' selected' : ''}" data-val="${sz}">
                ${sz}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="pagination-controls">
        <button ${currentPage === 1 ? 'disabled' : ''} data-page="prev">‹</button>`;

    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
        if (p === 3 || p === totalPages - 2) html += '<button disabled>…</button>';
        continue;
      }
      html += `<button class="${p === currentPage ? 'page-active' : ''}" data-page="${p}">${p}</button>`;
    }

    html += `<button ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} data-page="next">›</button>
      </div>
    </div>`;

    wrapper.innerHTML = html;

    // Event: upward page size popover
    const sizeTrigger = wrapper.querySelector('.dt-page-size-trigger');
    const sizePop = wrapper.querySelector('.dt-page-size-pop');
    if (sizeTrigger && sizePop) {
      sizeTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        sizePop.hidden = !sizePop.hidden;
      });

      sizePop.querySelectorAll('.dt-page-size-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = parseInt(opt.dataset.val, 10);
          if (val) {
            pageSize = val;
            localStorage.setItem(STORAGE_KEY, String(pageSize));
            currentPage = 1;
            render();
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!sizeTrigger.contains(e.target) && !sizePop.contains(e.target)) {
          sizePop.hidden = true;
        }
      });
    }

    // Event: sort (pointer + keyboard — headers are role=button, tabindex=0)
    wrapper.querySelectorAll('th[data-key]').forEach(th => {
      const doSort = () => {
        const col = columns.find(c => c.key === th.dataset.key);
        if (sortCol === col) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = col;
          sortDir = 'asc';
        }
        render();
      };
      th.addEventListener('click', doSort);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); }
      });
    });

    // Event: row click
    if (onRowClick) {
      wrapper.querySelectorAll('tbody tr[data-id]').forEach(tr => {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('.dt-select-cell')) return;
          if (e.target.closest('select') || e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
          onRowClick(tr.dataset.id);
        });
      });
    }

    // Event: row selection
    if (selectable) {
      wrapper.querySelectorAll('.dt-select-row').forEach(chk => {
        chk.addEventListener('change', (e) => {
          if (e.target.checked) selectedIds.add(e.target.value);
          else selectedIds.delete(e.target.value);
          triggerSelectionChange();
          render(); // update styles and header checkbox
        });
      });

      const selectAll = wrapper.querySelector('.dt-select-all');
      if (selectAll) {
        selectAll.addEventListener('change', (e) => {
          const checked = e.target.checked;
          paged.forEach(row => {
            const rowId = String(getId ? getId(row) : row.id);
            if (checked) selectedIds.add(rowId);
            else selectedIds.delete(rowId);
          });
          triggerSelectionChange();
          render();
        });
      }
    }

    // Event: pagination
    wrapper.querySelectorAll('.pagination-controls button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'prev') currentPage--;
        else if (page === 'next') currentPage++;
        else currentPage = parseInt(page);
        render();
      });
    });

    // Event: collapse / expand a group (the toggle button is a real button, so
    // Enter and Space come through as clicks)
    if (plan.grouped) {
      wrapper.querySelectorAll(`tr.${GROUP_ROW_CLASS}`).forEach(tr => {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('.dt-group-toggle') || !e.target.closest('button, a, select, input')) {
            const key = tr.dataset.group;
            if (collapsedGroups.has(key)) collapsedGroups.delete(key);
            else collapsedGroups.add(key);
            saveCollapsed();
            render();
          }
        });
      });
    }

    if (plan.grouped && typeof activeGroupBy.onMove === 'function') {
      attachGroupDrag();
    }
  }

  render();

  wrapper.updateData = (newData) => {
    data = newData;
    render();
  };

  // The message can depend on state the caller changes after creation (e.g. the
  // notifications page explains an emptied list differently).
  wrapper.setEmptyMessage = (message) => {
    const next = message || 'No records found';
    if (next === emptyText) return;
    emptyText = next;
    render();
  };

  wrapper.setSort = (key, dir = 'desc') => {
    const col = columns.find(c => c.key === key);
    if (col) {
      sortCol = col;
      sortDir = dir;
      render();
    }
  };

  wrapper.setGroupBy = (next) => {
    activeGroupBy = next || null;
    collapsedGroups.clear();
    if (activeGroupBy) {
      (activeGroupBy.defaultCollapsed || []).forEach(key => collapsedGroups.add(String(key)));
      loadCollapsed();
    }
    render();
  };

  wrapper.setCollapsed = (key, isCollapsed = true) => {
    if (isCollapsed) collapsedGroups.add(String(key));
    else collapsedGroups.delete(String(key));
    saveCollapsed();
    render();
  };

  wrapper.getCollapsed = () => Array.from(collapsedGroups);

  wrapper.clearSelection = () => {
    selectedIds.clear();
    triggerSelectionChange();
    render();
  };

  return wrapper;
}

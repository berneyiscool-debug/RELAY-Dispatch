// ============================================
// SIMPRO CLONE — REUSABLE DATA TABLE
// ============================================

import { escapeHTML } from '../utils/security.js';

export function createDataTable({ columns, data, onRowClick, getId, emptyMessage = 'No records found', emptyIcon = 'inbox', selectable = false, onSelectionChange = null, defaultSortKey = null, defaultSortDir = 'desc' }) {
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
  const selectedIds = new Set();

  function triggerSelectionChange() {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
  }

  function render() {
    let sorted = [...data];

    // Sort
    if (sortCol) {
      sorted.sort((a, b) => {
        const aVal = sortCol.getValue ? sortCol.getValue(a) : a[sortCol.key];
        const bVal = sortCol.getValue ? sortCol.getValue(b) : b[sortCol.key];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    const totalPages = Math.ceil(sorted.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const start = (currentPage - 1) * pageSize;
    const paged = sorted.slice(start, start + pageSize);

    if (data.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined">${escapeHTML(emptyIcon)}</span>
          <h3>${escapeHTML(emptyMessage)}</h3>
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

    paged.forEach(row => {
      const rowId = String(getId ? getId(row) : row.id);
      const isSelected = selectedIds.has(rowId);
      html += `<tr data-id="${escapeHTML(rowId)}" style="cursor:pointer" class="${isSelected ? 'selected-row' : ''}">`;
      
      if (selectable) {
        html += `<td class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${escapeHTML(rowId)}" ${isSelected ? 'checked' : ''}>
        </td>`;
      }

      columns.forEach(col => {
        const value = col.render ? col.render(row) : escapeHTML(row[col.key] ?? '');
        html += `<td class="${col.align === 'right' ? 'num' : ''}">${value}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Pagination
    html += `<div class="pagination">
      <div class="pagination-info" style="display:flex; align-items:center; gap:12px;">
        <span>Showing ${start + 1}–${Math.min(start + pageSize, sorted.length)} of ${sorted.length}</span>
        <div class="pagination-page-size" style="position:relative; display:inline-flex; align-items:center; gap:4px; font-size:11px;">
          <span style="color:var(--text-secondary)">Per page:</span>
          <button type="button" class="btn btn-secondary btn-sm dt-page-size-trigger" style="height:22px; padding:0 6px; font-size:11px; display:inline-flex; align-items:center; gap:2px;">
            <span>${pageSize}</span>
            <span class="material-icons-outlined" style="font-size:13px">unfold_more</span>
          </button>
          <div class="dt-page-size-pop" hidden style="position:absolute; bottom:calc(100% + 4px); left:46px; background:var(--card-bg); border:1px solid var(--card-border); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); padding:4px 0; z-index:1000; min-width:64px;">
            ${[15, 30, 45, 60].map(sz => `
              <div class="dt-page-size-opt ${sz === pageSize ? 'active' : ''}" data-val="${sz}" style="padding:4px 10px; cursor:pointer; font-size:11px; background:${sz === pageSize ? 'var(--color-primary-light)' : 'transparent'}; color:${sz === pageSize ? 'var(--color-primary)' : 'var(--text-primary)'}; font-weight:${sz === pageSize ? '600' : '400'};">
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
  }

  render();

  wrapper.updateData = (newData) => {
    data = newData;
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

  wrapper.clearSelection = () => {
    selectedIds.clear();
    triggerSelectionChange();
    render();
  };

  return wrapper;
}

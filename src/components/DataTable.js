// ============================================
// SIMPRO CLONE — REUSABLE DATA TABLE
// ============================================

import { escapeHTML } from '../utils/security.js';

export function createDataTable({ columns, data, onRowClick, getId, emptyMessage = 'No records found', emptyIcon = 'inbox', selectable = false, onSelectionChange = null }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';

  let sortCol = null;
  let sortDir = 'asc';
  let currentPage = 1;
  const pageSize = 15;
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
          <p>Get started by creating a new record.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';

    // Select All Checkbox
    if (selectable) {
      const allSelectedOnPage = paged.length > 0 && paged.every(r => selectedIds.has(String(getId ? getId(r) : r.id)));
      html += `<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${allSelectedOnPage ? 'checked' : ''}></th>`;
    }

    columns.forEach(col => {
      const isSorted = sortCol && sortCol.key === col.key;
      const sortClass = isSorted ? ' sorted' : '';
      const sortIcon = isSorted ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
      html += `<th class="${sortClass}" data-key="${col.key}" style="${col.width ? 'width:' + col.width : ''}">
        ${escapeHTML(col.label)}
        <span class="material-icons-outlined sort-icon">${sortIcon}</span>
      </th>`;
    });

    html += '</tr></thead><tbody>';

    paged.forEach(row => {
      const rowId = String(getId ? getId(row) : row.id);
      const isSelected = selectedIds.has(rowId);
      html += `<tr data-id="${escapeHTML(rowId)}" style="cursor:pointer" class="${isSelected ? 'selected-row' : ''}">`;
      
      if (selectable) {
        html += `<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${escapeHTML(rowId)}" ${isSelected ? 'checked' : ''}>
        </td>`;
      }

      columns.forEach(col => {
        const value = col.render ? col.render(row) : escapeHTML(row[col.key] ?? '');
        html += `<td>${value}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Pagination
    if (totalPages > 1) {
      html += `<div class="pagination">
        <span class="pagination-info">Showing ${start + 1}–${Math.min(start + pageSize, sorted.length)} of ${sorted.length}</span>
        <div class="pagination-controls">
          <button ${currentPage === 1 ? 'disabled' : ''} data-page="prev">‹</button>`;

      for (let p = 1; p <= totalPages; p++) {
        if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
          if (p === 3 || p === totalPages - 2) html += '<button disabled>…</button>';
          continue;
        }
        html += `<button class="${p === currentPage ? 'page-active' : ''}" data-page="${p}">${p}</button>`;
      }

      html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="next">›</button>
        </div>
      </div>`;
    }

    wrapper.innerHTML = html;

    // Event: sort
    wrapper.querySelectorAll('th[data-key]').forEach(th => {
      th.addEventListener('click', () => {
        const col = columns.find(c => c.key === th.dataset.key);
        if (sortCol === col) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = col;
          sortDir = 'asc';
        }
        render();
      });
    });

    // Event: row click
    if (onRowClick) {
      wrapper.querySelectorAll('tbody tr[data-id]').forEach(tr => {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('.dt-select-cell')) return;
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

  wrapper.clearSelection = () => {
    selectedIds.clear();
    triggerSelectionChange();
    render();
  };

  return wrapper;
}

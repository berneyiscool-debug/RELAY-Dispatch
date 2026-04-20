// ============================================
// SIMPRO CLONE — REUSABLE DATA TABLE
// ============================================

export function createDataTable({ columns, data, onRowClick, getId, emptyMessage = 'No records found', emptyIcon = 'inbox' }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';

  let sortCol = null;
  let sortDir = 'asc';
  let currentPage = 1;
  const pageSize = 15;

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
          <span class="material-icons-outlined">${emptyIcon}</span>
          <h3>${emptyMessage}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';

    columns.forEach(col => {
      const isSorted = sortCol && sortCol.key === col.key;
      const sortClass = isSorted ? ' sorted' : '';
      const sortIcon = isSorted ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
      html += `<th class="${sortClass}" data-key="${col.key}" style="${col.width ? 'width:' + col.width : ''}">
        ${col.label}
        <span class="material-icons-outlined sort-icon">${sortIcon}</span>
      </th>`;
    });

    html += '</tr></thead><tbody>';

    paged.forEach(row => {
      const rowId = getId ? getId(row) : row.id;
      html += `<tr data-id="${rowId}" style="cursor:pointer">`;
      columns.forEach(col => {
        const value = col.render ? col.render(row) : (row[col.key] ?? '');
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
        tr.addEventListener('click', () => onRowClick(tr.dataset.id));
      });
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

  return wrapper;
}

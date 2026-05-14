// ============================================
// SIMPRO CLONE — STOCK LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { showModal } from '../../components/Modal.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderStockList(container) {
  const stock = store.getAll('stock');

  container.innerHTML = `
    <div class="page-header">
      <h1>Stock / Inventory</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-transfer-stock"><span class="material-icons-outlined">swap_horiz</span> Transfer</button>
        <button class="btn btn-primary" id="btn-new-stock"><span class="material-icons-outlined">add</span> New Item</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${stock.length})</button>
        ${[...new Set(stock.map(s => s.category))].map(cat =>
          `<button class="toolbar-filter" data-filter="${cat}">${cat}</button>`
        ).join('')}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search stock..." id="stock-search" />
      </div>
    </div>
    <div id="stock-table-container"></div>
  `;

  let filteredData = [...stock];

  const columns = [
    { key: 'name', label: 'Item Name', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>` },
    { key: 'sku', label: 'SKU', render: (r) => `<span class="text-secondary" style="font-family:monospace">${escapeHTML(r.sku)}</span>`, width: '90px' },
    { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category)}</span>`, width: '110px' },
    { key: 'quantity', label: 'Qty', render: (r) => {
      const low = r.quantity <= r.reorderLevel;
      return `<span style="font-weight:600;color:${low ? 'var(--color-danger)' : 'var(--text-primary)'}">${r.quantity}</span>${low ? ' <span class="badge badge-danger" style="margin-left:4px">LOW</span>' : ''}`;
    }, getValue: (r) => r.quantity, width: '100px' },
    { key: 'unitPrice', label: 'Unit Price', render: (r) => `$${r.unitPrice.toFixed(2)}`, getValue: (r) => r.unitPrice, width: '100px' },
    { key: 'location', label: 'Location', render: (r) => `<span class="text-secondary">${escapeHTML(r.location)}</span>`, width: '120px' },
    { key: 'supplier', label: 'Supplier', render: (r) => `<span class="text-secondary">${escapeHTML(r.supplier)}</span>` },
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/stock/${id}`), 
    emptyMessage: 'No stock items', 
    emptyIcon: 'inventory_2',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Change Category',
            icon: 'category',
            onClick: (ids) => {
              const categories = [...new Set(store.getAll('stock').map(s => s.category))];
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `;
              content.querySelector('#bulk-category').addEventListener('change', (e) => {
                content.querySelector('#new-cat-field').style.display = e.target.value === 'NEW' ? 'block' : 'none';
              });
              showModal({
                title: `Update ${ids.length} Items`,
                content,
                actions: [
                  { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                  { label: 'Apply', className: 'btn-primary', onClick: c => {
                    let newCat = content.querySelector('#bulk-category').value;
                    if (newCat === 'NEW') newCat = content.querySelector('#bulk-new-category').value.trim();
                    if (!newCat) return;
                    ids.forEach(id => store.update('stock', id, { category: newCat }));
                    table.clearSelection();
                    renderStockList(container);
                    showToast(`Updated ${ids.length} items to category: ${newCat}`, 'success');
                    c();
                  }}
                ]
              });
            }
          },
          {
            label: 'Adjust Price',
            icon: 'payments',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `;
              showModal({
                title: `Adjust Price for ${ids.length} Items`,
                content,
                actions: [
                  { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                  { label: 'Apply', className: 'btn-primary', onClick: c => {
                    const percent = parseFloat(content.querySelector('#bulk-price-adjust').value);
                    if (isNaN(percent)) return;
                    const factor = 1 + (percent / 100);
                    ids.forEach(id => {
                      const item = store.getById('stock', id);
                      if (item) store.update('stock', id, { unitPrice: item.unitPrice * factor });
                    });
                    table.clearSelection();
                    renderStockList(container);
                    showToast(`Adjusted prices for ${ids.length} items by ${percent}%`, 'success');
                    c();
                  }}
                ]
              });
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              showModal({
                title: 'Confirm Bulk Delete',
                content: `<p>Are you sure you want to delete ${ids.length} stock items? This action cannot be undone.</p>`,
                actions: [
                  { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                  { label: 'Delete', className: 'btn-danger', onClick: c => {
                    ids.forEach(id => store.delete('stock', id));
                    table.clearSelection();
                    renderStockList(container);
                    showToast(`Deleted ${ids.length} stock items`, 'success');
                    c();
                  }}
                ]
              });
            }
          }
        ]
      });
    }
  });
  container.querySelector('#stock-table-container').appendChild(table);

  container.querySelector('#btn-new-stock').addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Item Name *</label>
        <input type="text" class="form-input" id="new-stock-name" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" class="form-input" id="new-stock-category" />
        </div>
        <div class="form-group">
          <label class="form-label">Cost Price ($) *</label>
          <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
        </div>
      </div>
    `;

    showDrawer({
      title: 'New Stock Item',
      content: content.outerHTML,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Create', className: 'btn-primary', onClick: (close) => {
          const dOverlay = document.querySelector('.drawer-overlay');
          const name = dOverlay.querySelector('#new-stock-name').value.trim();
          const category = dOverlay.querySelector('#new-stock-category').value.trim() || 'Uncategorized';
          const costPrice = parseFloat(dOverlay.querySelector('#new-stock-cost').value);

          if (!name || isNaN(costPrice)) {
            showToast('Please fill all required fields correctly', 'error');
            return;
          }

          store.create('stock', {
            name,
            sku: 'SKU-' + Date.now().toString().slice(-6),
            category,
            quantity: 0,
            unitPrice: costPrice * 1.5, // default 50% markup
            costPrice,
            location: 'Main Warehouse',
            supplier: 'Unknown'
          });

          showToast('Stock item created', 'success');
          renderStockList(container);
          close();
        }}
      ]
    });
  });

  container.querySelector('#btn-transfer-stock')?.addEventListener('click', () => {
    const stockItems = store.getAll('stock');
    const technicians = store.getAll('technicians');
    if (stockItems.length === 0) {
      showToast('No stock items available to transfer', 'error');
      return;
    }
    const content = document.createElement('div');
    content.innerHTML = `
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${stockItems.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} (Qty: ${s.quantity}) - ${escapeHTML(s.location)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select location...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              ${technicians.map(t => `<option value="Vehicle - ${escapeHTML(t.name)}">Vehicle - ${escapeHTML(t.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" />
          </div>
        </div>
      `;
    showDrawer({
      title: 'Transfer Stock',
      content: content.outerHTML,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Transfer', className: 'btn-primary', onClick: (close) => {
          const dOverlay = document.querySelector('.drawer-overlay');
          const itemId = dOverlay.querySelector('#transfer-item').value;
          const toLoc = dOverlay.querySelector('#transfer-to').value;
          const qty = parseInt(dOverlay.querySelector('#transfer-qty').value) || 0;

          if (!itemId || !toLoc || qty <= 0) {
            showToast('Please fill all fields correctly', 'error');
            return;
          }

          const sourceItem = store.getById('stock', itemId);
          if (sourceItem.quantity < qty) {
            showToast('Insufficient quantity available', 'error');
            return;
          }

          if (sourceItem.location === toLoc) {
            showToast('Cannot transfer to the same location', 'error');
            return;
          }

          // Deduct from source
          store.update('stock', sourceItem.id, { quantity: sourceItem.quantity - qty });

          // Check if target item exists at location with same SKU
          const targetItem = stockItems.find(s => s.sku === sourceItem.sku && s.location === toLoc);
          if (targetItem) {
            store.update('stock', targetItem.id, { quantity: targetItem.quantity + qty });
          } else {
            // Create new stock item at new location
            const newItem = { ...sourceItem, id: undefined, quantity: qty, location: toLoc };
            store.create('stock', newItem);
          }

          showToast('Stock transferred successfully', 'success');
          renderStockList(container); // Re-render list
          close();
        }}
      ]
    });
  });

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...stock] : stock.filter(s => s.category === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#stock-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = stock.filter(s => s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    table.updateData(filteredData);
  });
}

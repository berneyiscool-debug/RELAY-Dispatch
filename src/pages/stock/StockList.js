// ============================================
// FIELDFORGE — STOCK LIST & KITS DUAL VIEW PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { showModal } from '../../components/Modal.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { getToolbarFilterTags, toolbarFilterMatches } from '../../components/ToolbarFilters.js';
import { parseCSV } from '../../utils/csvParser.js';
import { setListSearch } from '../../utils/listSearch.js';
import { getStorageLocationOptionsHtml, getActiveStorageLocations } from '../../utils/storageLocations.js';
import { getActiveKitTypes } from '../../utils/kitTypes.js';

export function renderStockList(container, params) {
  let activeTab = params?.tab === 'kits' ? 'kits' : 'items';
  let searchTerm = '';
  let activeLocation = 'all';
  let activeItemFilter = 'all';
  let activeKitFilter = 'all';
  let itemTableInstance = null;
  let kitTableInstance = null;

  function renderLayout() {
    container.innerHTML = `
      <div class="page-header" style="display:none;">
        <div class="page-header-actions" id="header-actions-container">
          <!-- Dynamically populated based on active tab -->
        </div>
      </div>

      <!-- Table Container -->
      <div id="table-container-wrapper">
        <div id="stock-table-container"></div>
      </div>
    `;


    renderActiveTabContent();
  }

  function renderActiveTabContent() {
    const actionsContainer = container.querySelector('#header-actions-container') || document.querySelector('#header-actions-container') || document.querySelector('#breadcrumb-actions');
    const tableContainer = container.querySelector('#stock-table-container');

    // Clean up any existing bulk action bar
    container.querySelector('.bulk-action-bar')?.remove();

    if (activeTab === 'items') {
      // 1. Actions Header for Items
      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <div id="filter-mount" style="display:inline-flex; align-items:center;"></div>
          <div id="sort-mount" style="display:inline-flex; align-items:center;"></div>
          <span class="text-tertiary" style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Location:</span>
          <select class="form-select" id="location-filter" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:180px; margin:0; align-self:center;">
            <option value="all">All Locations</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="btn-transfer-stock" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Move stock quantities between warehouse locations or technician vehicles"><span class="material-icons-outlined" style="font-size:13px;">swap_horiz</span> Transfer</button>
          <button class="btn btn-secondary btn-sm" id="btn-import-stock" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Upload a supplier CSV parts list files directly to catalog inventory"><span class="material-icons-outlined" style="font-size:13px;">file_upload</span> Import</button>
          <button class="btn btn-primary btn-sm" id="btn-new-stock" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Manually add a single new catalog item"><span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Item</span></button>
        `;
      }

      // Populate Location selector
      const stock = store.getAll('stock') || [];
      const locSelect = container.querySelector('#location-filter');
      if (locSelect) {
        const locations = [...new Set(stock.flatMap(s => (s.locations || []).map(l => l.location || 'Unassigned')))].sort();
        const warehouses = locations.filter(l => l.toLowerCase().includes('warehouse') || l === 'Main' || l === 'Main Warehouse');
        const vehicles = locations.filter(l => l.toLowerCase().includes('vehicle') || l.toLowerCase().includes('van') || l.toLowerCase().includes('truck'));
        const otherLocs = locations.filter(l => !warehouses.includes(l) && !vehicles.includes(l));

        const addOptGroup = (label, list) => {
          if (list.length > 0) {
            const group = document.createElement('optgroup');
            group.label = label;
            list.forEach(l => group.appendChild(new Option(l, l, false, l === activeLocation)));
            locSelect.appendChild(group);
          }
        };
        addOptGroup('Warehouses', warehouses);
        addOptGroup('Vehicles / Vans', vehicles);
        addOptGroup('Other', otherLocs);
      }

      // Render DataTable for Items
      if (tableContainer) renderItemsTable(tableContainer);
      bindItemActions();

    } else {
      // 1. Actions Header for Kits
      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <div id="filter-mount" style="display:inline-flex; align-items:center;"></div>
          <div id="sort-mount" style="display:inline-flex; align-items:center;"></div>
          <button class="btn btn-primary btn-sm" id="btn-new-kit" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Bundle multiple parts and labor items into a single pre-packaged kit for quick quoting"><span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New Kit Bundle</span></button>
        `;
      }

      // Render DataTable for Kits
      if (tableContainer) renderKitsTable(tableContainer);
      bindKitActions();
    }

    // Ensure header actions are relocated into breadcrumb bar if breadcrumb exists
    const breadcrumbActions = document.getElementById('breadcrumb-actions');
    const headerActions = container.querySelector('.page-header-actions') || container.querySelector('#header-actions-container');
    if (breadcrumbActions && headerActions && headerActions.children.length > 0) {
      breadcrumbActions.innerHTML = '';
      while (headerActions.firstChild) {
        breadcrumbActions.appendChild(headerActions.firstChild);
      }
    }
  }

  // --- ITEM VIEW FUNCTIONS ---

  function renderItemsTable(tableContainer) {
    const stock = store.getAll('stock') || [];

    const columns = [
      { key: 'name', label: 'Item', render: (r) => `<span class="cell-link font-medium" style="font-weight:600; color:var(--color-primary)">${escapeHTML(r.name)}</span>`, width: '28%' },
      { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category || '—')}</span>`, width: '15%' },
      { key: 'supplier', label: 'Supplier', render: (r) => `<span class="text-secondary">${escapeHTML(r.supplier || '—')}</span>`, width: '21%' },
      { key: 'sku', label: 'SKU', render: (r) => `<span class="text-secondary" style="font-family:monospace">${escapeHTML(r.sku || '—')}</span>`, width: '13%' },
      { key: 'quantity', label: 'Qty', render: (r) => {
        const totalQty = (r.locations || []).reduce((sum, l) => sum + l.quantity, 0);
        const low = totalQty <= (r.reorderLevel || 0);
        return `<span style="font-weight:600;color:${low ? 'var(--color-danger)' : 'var(--text-primary)'}">${totalQty}</span>${low ? ' <span class="badge badge-danger" style="margin-left:4px">LOW</span>' : ''}`;
      }, getValue: (r) => (r.locations || []).reduce((sum, l) => sum + l.quantity, 0), width: '9%' },
      { key: 'unitPrice', label: 'Price', render: (r) => `<span class="font-semibold">$${(r.unitPrice || 0).toFixed(2)}</span>`, getValue: (r) => r.unitPrice || 0, width: '14%' },
    ];

    const table = createDataTable({
      columns,
      data: stock,
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
              label: 'Print Barcodes',
              icon: 'qr_code_2',
              onClick: (ids) => {
                const items = ids.map(id => store.getById('stock', id)).filter(Boolean);
                const printWindow = window.open('', '_blank');
                let html = `
                  <html>
                  <head>
                    <title>Barcode Print Sheet</title>
                    <style>
                      body { font-family: 'Inter', sans-serif; padding: 20px; }
                      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
                      .barcode-card { border: 1px solid #ddd; padding: 12px; border-radius: 6px; text-align: center; background: #fff; }
                      .item-name { font-weight: 600; font-size: 12px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                      .sku { font-family: monospace; font-size: 11px; color: #666; margin-bottom: 8px; }
                      .barcode-placeholder { border-top: 2px solid #000; border-bottom: 2px solid #000; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 8px; letter-spacing: 3px; font-weight: bold; background: repeating-linear-gradient(90deg, #000, #000 2px, transparent 2px, transparent 4px); margin-bottom: 4px; }
                      .price { font-weight: 700; font-size: 12px; color: #111; }
                      @media print {
                        body { padding: 0; }
                        .barcode-card { page-break-inside: avoid; }
                      }
                    </style>
                  </head>
                  <body>
                    <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:8px">Inventory Barcode Labels (${items.length} Items)</h3>
                    <div class="grid">
                `;
                items.forEach(item => {
                  html += `
                    <div class="barcode-card">
                      <div class="item-name">${escapeHTML(item.name)}</div>
                      <div class="sku">${escapeHTML(item.sku)}</div>
                      <div class="barcode-placeholder">||||| | ||| || |||</div>
                      <div class="price">$${item.unitPrice.toFixed(2)}</div>
                    </div>
                  `;
                });
                html += `
                    </div>
                    <script>
                      window.onload = function() {
                        window.print();
                      }
                    </script>
                  </body>
                  </html>
                `;
                printWindow.document.write(html);
                printWindow.document.close();
              }
            },
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
                      renderActiveTabContent();
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
                      renderActiveTabContent();
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
                      renderActiveTabContent();
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

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
    itemTableInstance = table;

    function applyItemFilters() {
      const q = searchTerm.toLowerCase();
      const filtered = stock.filter(s => {
        const matchLoc = activeLocation === 'all' || (s.locations || []).some(l => l.location === activeLocation);
        const matchSearch = !q ||
          s.name.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
        const matchFilter = toolbarFilterMatches(s, activeItemFilter, 'stock');
        return matchLoc && matchSearch && matchFilter;
      });
      table.updateData(filtered);
    }

    applyItemFilters();
  }

  function bindItemActions() {
    setListSearch((q) => {
      searchTerm = q;
      renderItemsTable(container.querySelector('#stock-table-container'));
    }, 'Stock');

    const findEl = (sel) => container.querySelector(sel) || document.querySelector(sel);

    // Location selector
    findEl('#location-filter')?.addEventListener('change', (e) => {
      activeLocation = e.target.value;
      renderItemsTable(container.querySelector('#stock-table-container'));
    });

    // Filter dropdown
    createDropdown({
      container: findEl('#filter-mount'),
      options: getToolbarFilterTags(store.getAll('stock') || [], 'stock'),
      onChange: (val) => {
        activeItemFilter = val;
        renderItemsTable(container.querySelector('#stock-table-container'));
      }
    });

    // Sort dropdown
    createDropdown({
      container: findEl('#sort-mount'),
      options: [
        { value: 'name_asc', label: 'Sort: Name (A-Z)' },
        { value: 'name_desc', label: 'Sort: Name (Z-A)' },
        { value: 'partNumber_asc', label: 'Sort: Part #' },
        { value: 'quantity_desc', label: 'Sort: Stock (High-Low)' },
        { value: 'costPrice_desc', label: 'Sort: Cost (High-Low)' },
      ],
      onChange: (val) => {
        const [key, dir] = val.split('_');
        if (itemTableInstance) itemTableInstance.setSort(key, dir);
      }
    });

    // Transfer button click
    findEl('#btn-transfer-stock')?.addEventListener('click', () => {
      openTransferDrawer();
    });

    // Import button click
    findEl('#btn-import-stock')?.addEventListener('click', () => {
      showImportModal(container);
    });

    // New Item button click
    findEl('#btn-new-stock')?.addEventListener('click', () => {
      openNewStockDrawer();
    });
  }

  // --- KIT VIEW FUNCTIONS ---

  function renderKitsTable(tableContainer) {
    const kits = store.getAll('kits') || [];

    const columns = [
      { key: 'name', label: 'Kit Name', render: (r) => `<span class="cell-link font-medium" style="font-weight:600; color:var(--color-primary)">${escapeHTML(r.name)}</span>${r.description ? `<div style="font-size:12px; color:var(--text-tertiary); margin-top:2px">${escapeHTML(r.description)}</div>` : ''}`, width: '26%' },
      { key: 'category', label: 'Kit Type', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category || 'General')}</span>`, width: '14%' },
      { key: 'items', label: 'Items Included', render: (r) => {
        const mCount = (r.items || []).filter(i => i.type !== 'labor').length;
        const lCount = (r.items || []).filter(i => i.type === 'labor').length;
        return `<span style="font-size:13px">${mCount} material${mCount !== 1 ? 's' : ''}${lCount > 0 ? `, ${lCount} labour` : ''}</span>`;
      }, width: '18%' },
      { key: 'totalCost', label: 'Total Cost', render: (r) => `$${(r.totalCost || 0).toFixed(2)}`, getValue: (r) => r.totalCost, width: '13%', align: 'right' },
      { key: 'totalPrice', label: 'Total Sell', render: (r) => `<span class="cell-amount">$${(r.totalPrice || 0).toFixed(2)}</span>`, getValue: (r) => r.totalPrice, width: '13%', align: 'right' },
      { key: 'margin', label: 'Margin', render: (r) => {
        const margin = r.totalPrice > 0 ? ((r.totalPrice - r.totalCost) / r.totalPrice * 100) : 0;
        const color = margin >= 30 ? 'var(--color-success)' : margin >= 15 ? 'var(--color-warning)' : 'var(--color-danger)';
        return `<span style="font-weight:600; color:${color}">${margin.toFixed(1)}%</span>`;
      }, getValue: (r) => r.totalPrice > 0 ? ((r.totalPrice - r.totalCost) / r.totalPrice * 100) : 0, width: '12%', align: 'right' }
    ];

    const table = createDataTable({
      columns,
      data: kits,
      onRowClick: (id) => router.navigate(`/kits/${id}`),
      emptyMessage: 'No kits configured',
      emptyIcon: 'widgets',
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
                const categories = getActiveKitTypes().map(t => t.name);
                const content = document.createElement('div');
                content.innerHTML = `
                  <div class="form-group">
                    <label class="form-label">Select Kit Type</label>
                    <select class="form-select" id="bulk-kit-category">
                      ${categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}
                    </select>
                  </div>
                `;
                showModal({
                  title: `Update ${ids.length} Kits`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newCat = content.querySelector('#bulk-kit-category').value;
                      ids.forEach(id => store.update('kits', id, { category: newCat }));
                      table.clearSelection();
                      renderActiveTabContent();
                      showToast(`Updated ${ids.length} kits to kit type: ${newCat}`, 'success');
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
                  content: `<p>Are you sure you want to delete ${ids.length} kits? This action cannot be undone.</p>`,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('kits', id));
                      table.clearSelection();
                      renderActiveTabContent();
                      showToast(`Deleted ${ids.length} kits`, 'success');
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

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
    kitTableInstance = table;

    function applyKitFilters() {
      const q = searchTerm.toLowerCase();
      const filtered = kits.filter(k =>
        (!q ||
          k.name.toLowerCase().includes(q) ||
          (k.description || '').toLowerCase().includes(q)) &&
        toolbarFilterMatches(k, activeKitFilter, 'kits')
      );
      table.updateData(filtered);
    }

    applyKitFilters();
  }

  function bindKitActions() {
    setListSearch((q) => {
      searchTerm = q;
      renderKitsTable(container.querySelector('#stock-table-container'));
    }, 'Search kits...');

    const findEl = (sel) => container.querySelector(sel) || document.querySelector(sel);

    // Filter dropdown
    createDropdown({
      container: findEl('#filter-mount'),
      options: getToolbarFilterTags(store.getAll('kits') || [], 'kits'),
      onChange: (val) => {
        activeKitFilter = val;
        renderKitsTable(container.querySelector('#stock-table-container'));
      }
    });

    // Sort dropdown
    createDropdown({
      container: findEl('#sort-mount'),
      options: [
        { value: 'name_asc', label: 'Sort: Name (A-Z)' },
        { value: 'name_desc', label: 'Sort: Name (Z-A)' },
        { value: 'totalPrice_desc', label: 'Sort: Sell (High-Low)' },
        { value: 'totalCost_desc', label: 'Sort: Cost (High-Low)' },
        { value: 'margin_desc', label: 'Sort: Margin (High-Low)' },
      ],
      onChange: (val) => {
        const [key, dir] = val.split('_');
        if (kitTableInstance) kitTableInstance.setSort(key, dir);
      }
    });

    // New Kit button
    findEl('#btn-new-kit')?.addEventListener('click', () => {
      router.navigate('/kits/new');
    });
  }

  // --- DRAWERS & MODALS BACKPORT ---

  function createDropdown({ container, options, onChange }) {
    const wrap = document.createElement('div');
    wrap.className = 'dropdown';
    wrap.style.cssText = 'display:inline-flex; align-items:center;';
    wrap.innerHTML = `
      <button type="button" class="btn btn-secondary btn-sm dropdown-trigger" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
        <span class="dropdown-trigger-label">${escapeHTML(options[0].label)}</span>
        <span class="material-icons-outlined" style="font-size:13px;">expand_more</span>
      </button>
      <div class="dropdown-menu" style="display:none; position:absolute; right:0; top:calc(100% + 4px); min-width:180px;">
        ${options.map(o => `<button type="button" class="dropdown-item" data-value="${escapeHTML(o.value)}" style="white-space:nowrap;">${escapeHTML(o.label)}</button>`).join('')}
      </div>
    `;

    if (container && container.replaceWith) container.replaceWith(wrap);

    const trigger = wrap.querySelector('.dropdown-trigger');
    const menu = wrap.querySelector('.dropdown-menu');
    const label = wrap.querySelector('.dropdown-trigger-label');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = menu.style.display === 'none';
      menu.style.display = willOpen ? 'block' : 'none';
    });

    wrap.querySelectorAll('.dropdown-item').forEach((item) => {
      item.addEventListener('click', () => {
        label.textContent = item.textContent;
        menu.style.display = 'none';
        if (onChange) onChange(item.dataset.value);
      });
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) menu.style.display = 'none';
    });

    return wrap;
  }

  function openNewStockDrawer() {
    const categories = store.getSettings().materialCategories || ['General'];
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Item Name *</label>
        <input type="text" class="form-input" id="new-stock-name" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="new-stock-category">
            ${categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Initial Location</label>
          <select class="form-select" id="new-stock-location">
            ${getStorageLocationOptionsHtml()}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cost Price ($) *</label>
          <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
        </div>
        <div class="form-group">
          <label class="form-label">Initial Stock Quantity *</label>
          <input type="number" class="form-input" id="new-stock-qty" min="0" value="0" />
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
          const category = dOverlay.querySelector('#new-stock-category').value;
          const location = dOverlay.querySelector('#new-stock-location').value || (getActiveStorageLocations()[0]?.name || 'Main Warehouse');
          const costPrice = parseFloat(dOverlay.querySelector('#new-stock-cost').value);
          const initialQty = parseInt(dOverlay.querySelector('#new-stock-qty').value) || 0;

          if (!name || isNaN(costPrice)) {
            showToast('Please fill all required fields correctly', 'error');
            return;
          }

          store.create('stock', {
            name,
            sku: 'SKU-' + Date.now().toString().slice(-6),
            category,
            quantity: initialQty,
            unitPrice: costPrice * 1.5,
            costPrice,
            location,
            locations: [{ location, quantity: initialQty }],
            supplier: 'Unknown'
          });

          showToast('Stock item created', 'success');
          renderActiveTabContent();
          close();
        }}
      ]
    });
  }

  function openTransferDrawer() {
    const stockItems = store.getAll('stock');
    
    if (stockItems.length === 0) {
      showToast('No stock items available to transfer', 'error');
      return;
    }

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${stockItems.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} (${escapeHTML(s.sku)})</option>`).join('')}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Source Location *</label>
            <select class="form-select" id="transfer-from" disabled>
              <option value="">Select an item first...</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Location *</label>
            <select class="form-select" id="transfer-to">
              ${getStorageLocationOptionsHtml('', null, false)}
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Quantity to Transfer *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" disabled />
            <small class="text-tertiary" id="transfer-available-info" style="display:none; margin-top:4px"></small>
          </div>
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
          const fromLoc = dOverlay.querySelector('#transfer-from').value;
          const toLoc = dOverlay.querySelector('#transfer-to').value;
          const qty = parseInt(dOverlay.querySelector('#transfer-qty').value) || 0;

          if (!itemId || !fromLoc || !toLoc || qty <= 0) {
            showToast('Please fill all fields correctly', 'error');
            return;
          }

          if (fromLoc === toLoc) {
            showToast('Cannot transfer to the same location', 'error');
            return;
          }

          const item = store.getById('stock', itemId);
          if (!item) return;

          const sourceLoc = (item.locations || []).find(l => l.location === fromLoc);
          if (!sourceLoc || sourceLoc.quantity < qty) {
            showToast('Insufficient quantity at source location', 'error');
            return;
          }

          // Deduct from source
          sourceLoc.quantity -= qty;

          // Add to target
          if (!item.locations) item.locations = [];
          let targetLoc = item.locations.find(l => l.location === toLoc);
          if (targetLoc) {
            targetLoc.quantity += qty;
          } else {
            item.locations.push({ location: toLoc, quantity: qty });
          }

          // Clean up 0 quantity locations
          item.locations = item.locations.filter(l => l.quantity > 0);

          // Update aggregated sum and fallback location
          item.quantity = item.locations.reduce((sum, l) => sum + l.quantity, 0);
          item.location = item.locations[0]?.location || 'Main Warehouse';

          store.update('stock', item.id, item);

          showToast(`Successfully transferred ${qty}x ${item.name} to ${toLoc}`, 'success');
          renderActiveTabContent();
          close();
        }}
      ]
    });

    setTimeout(() => {
      const dOverlay = document.querySelector('.drawer-overlay');
      if (!dOverlay) return;

      const itemSelect = dOverlay.querySelector('#transfer-item');
      const fromSelect = dOverlay.querySelector('#transfer-from');
      const qtyInput = dOverlay.querySelector('#transfer-qty');
      const avInfo = dOverlay.querySelector('#transfer-available-info');

      const updateQtyLimits = () => {
        const opt = fromSelect.options[fromSelect.selectedIndex];
        if (!opt) return;
        const maxVal = parseInt(opt.dataset.max) || 0;
        qtyInput.max = maxVal;
        qtyInput.value = Math.min(qtyInput.value || 1, maxVal);
        avInfo.textContent = `Max available: ${maxVal}`;
        avInfo.style.display = 'block';
      };

      itemSelect.addEventListener('change', () => {
        const itemId = itemSelect.value;
        if (!itemId) {
          fromSelect.innerHTML = '<option value="">Select an item first...</option>';
          fromSelect.disabled = true;
          qtyInput.disabled = true;
          avInfo.style.display = 'none';
          return;
        }

        const item = stockItems.find(s => s.id === itemId);
        if (!item || !item.locations || item.locations.length === 0) {
          fromSelect.innerHTML = '<option value="">No locations available</option>';
          fromSelect.disabled = true;
          qtyInput.disabled = true;
          avInfo.style.display = 'none';
          return;
        }

        const validLocs = item.locations.filter(l => l.quantity > 0);
        if (validLocs.length === 0) {
          fromSelect.innerHTML = '<option value="">Out of stock everywhere</option>';
          fromSelect.disabled = true;
          qtyInput.disabled = true;
          avInfo.style.display = 'none';
          return;
        }

        fromSelect.innerHTML = validLocs.map(l => `
          <option value="${escapeHTML(l.location)}" data-max="${l.quantity}">${escapeHTML(l.location)} (Available: ${l.quantity})</option>
        `).join('');
        fromSelect.disabled = false;
        qtyInput.disabled = false;

        updateQtyLimits();
      });

      fromSelect.addEventListener('change', updateQtyLimits);
    }, 100);
  }

  function showImportModal(parentContainer) {
    const uploadContent = document.createElement('div');
    uploadContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">Select CSV File *</label>
        <input type="file" accept=".csv,text/csv" id="csv-file-input" class="form-input" />
      </div>
    `;
    showModal({
      title: 'Import Stock from CSV',
      content: uploadContent,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Next', className: 'btn-primary', onClick: c => {
          const fileInput = document.getElementById('csv-file-input');
          if (!fileInput.files.length) {
            showToast('Please select a CSV file', 'error');
            return;
          }
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = e => {
            const text = e.target.result;
            const rows = parseCSV(text);
            if (rows.length === 0) {
              showToast('CSV file appears empty', 'error');
              return;
            }
            const headers = Object.keys(rows[0]);
            const requiredFields = [
              { key: 'name', label: 'Item Name' },
              { key: 'sku', label: 'SKU' },
              { key: 'category', label: 'Category' },
              { key: 'unitPrice', label: 'Unit Price' },
              { key: 'quantity', label: 'Qty' },
              { key: 'location', label: 'Location' },
              { key: 'supplier', label: 'Supplier' }
            ];
            const mapContent = document.createElement('div');
            mapContent.innerHTML = requiredFields.map(f => `
              <div class="form-group">
                <label class="form-label">${f.label}</label>
                <select class="form-select" id="map-${f.key}">
                  <option value="">-- ignore --</option>
                  ${headers.map(h => `<option value="${h}">${h}</option>`).join('')}
                </select>
              </div>
            `).join('');

            showModal({
              title: 'Map CSV Columns',
              content: mapContent,
              actions: [
                { label: 'Back', className: 'btn-secondary', onClick: c2 => c2() },
                { label: 'Import', className: 'btn-primary', onClick: c2 => {
                  const mapping = {};
                  requiredFields.forEach(f => {
                    const sel = document.getElementById('map-' + f.key);
                    if (sel && sel.value) mapping[f.key] = sel.value;
                  });

                  const previewRows = rows.slice(0, 5).map(r => {
                    const obj = {};
                    Object.entries(mapping).forEach(([field, col]) => {
                      obj[field] = r[col];
                    });
                    return obj;
                  });
                  const previewContent = document.createElement('div');
                  previewContent.innerHTML = '<pre>' + JSON.stringify(previewRows, null, 2) + '</pre>';
                  showModal({
                    title: 'Preview Import (first 5 rows)',
                    content: previewContent,
                    actions: [
                      { label: 'Back', className: 'btn-secondary', onClick: c3 => c3() },
                      { label: 'Execute', className: 'btn-primary', onClick: c3 => {
                        rows.forEach(r => {
                          const newItem = {};
                          newItem.name = (r[mapping.name] || '').trim() || 'Untitled';
                          newItem.sku = (r[mapping.sku] || '').trim() || ('SKU-' + Date.now().toString().slice(-6));
                          newItem.category = (r[mapping.category] || '').trim() || 'Uncategorized';
                          const price = parseFloat(r[mapping.unitPrice]);
                          newItem.unitPrice = isNaN(price) ? 0 : price;
                          const qty = parseInt(r[mapping.quantity]);
                          const quantity = isNaN(qty) ? 0 : qty;
                          const loc = (r[mapping.location] || '').trim() || 'Main Warehouse';
                          newItem.locations = [{ location: loc, quantity }];
                          newItem.quantity = quantity;
                          newItem.location = loc;
                          newItem.supplier = (r[mapping.supplier] || '').trim() || 'Unknown';
                          newItem.costPrice = newItem.unitPrice / 1.5;
                          store.create('stock', newItem);
                        });
                        showToast(`Imported ${rows.length} stock items`, 'success');
                        renderActiveTabContent();
                        c3();
                      }}
                    ]
                  });
                  c2();
                }}
              ]
            });
            c();
          };
          reader.readAsText(file);
        }}
      ]
    });
  }

  // Set up event listeners via delegation so relocated buttons in #breadcrumb-actions always respond
  const handleStockClick = (e) => {
    const btnTransfer = e.target.closest('#btn-transfer-stock');
    if (btnTransfer) {
      e.preventDefault();
      openTransferDrawer();
      return;
    }
    const btnImport = e.target.closest('#btn-import-stock');
    if (btnImport) {
      e.preventDefault();
      showImportModal(container);
      return;
    }
    const btnNewStock = e.target.closest('#btn-new-stock');
    if (btnNewStock) {
      e.preventDefault();
      openNewStockDrawer();
      return;
    }
    const btnNewKit = e.target.closest('#btn-new-kit');
    if (btnNewKit) {
      e.preventDefault();
      router.navigate('/kits/new');
      return;
    }
  };

  const handleStockChange = (e) => {
    if (e.target.id === 'location-filter') {
      activeLocation = e.target.value;
      const stockTableCont = container.querySelector('#stock-table-container');
      if (stockTableCont) renderItemsTable(stockTableCont);
      return;
    }
  };

  document.addEventListener('click', handleStockClick);
  document.addEventListener('change', handleStockChange);

  // Initial layout draw
  renderLayout();
}

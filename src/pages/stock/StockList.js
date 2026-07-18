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
import { parseCSV } from '../../utils/csvParser.js';
import { createToolbarFilters } from '../../components/ToolbarFilters.js';

export function renderStockList(container, params) {
  let activeTab = params?.tab === 'kits' ? 'kits' : 'items';
  let searchTerm = '';
  let activeLocation = 'all';
  let activeKitCategory = 'All';

  function renderLayout() {
    container.innerHTML = `
      <div class="page-header" style="margin-bottom:16px">
        <h1 style="margin:0">Stock / Inventory</h1>
        <div class="page-header-actions" id="header-actions-container">
          <!-- Dynamically populated based on active tab -->
        </div>
      </div>

      <!-- Segmented Toggle Tab (Items | Kits) -->
      <div class="stock-tab-toggle" style="display:flex; border-bottom:1px solid var(--border-color); margin-bottom:20px; gap:24px">
        <button class="stock-tab-btn ${activeTab === 'items' ? 'active' : ''}" data-tab="items" style="background:none; border:none; padding:12px 4px; font-weight:600; font-size:15px; color:${activeTab === 'items' ? 'var(--color-primary)' : 'var(--text-secondary)'}; border-bottom:3px solid ${activeTab === 'items' ? 'var(--color-primary)' : 'transparent'}; cursor:pointer; display:flex; align-items:center; gap:8px">
          <span class="material-icons-outlined">inventory_2</span> Individual Items
        </button>
        <button class="stock-tab-btn ${activeTab === 'kits' ? 'active' : ''}" data-tab="kits" style="background:none; border:none; padding:12px 4px; font-weight:600; font-size:15px; color:${activeTab === 'kits' ? 'var(--color-primary)' : 'var(--text-secondary)'}; border-bottom:3px solid ${activeTab === 'kits' ? 'var(--color-primary)' : 'transparent'}; cursor:pointer; display:flex; align-items:center; gap:8px">
          <span class="material-icons-outlined">widgets</span> Kit Bundles
        </button>
      </div>

      <!-- Dynamic Toolbar Section -->
      <div class="page-toolbar" id="toolbar-container" style="display:flex; justify-content:space-between; align-items:center;">
        <!-- Dynamically populated based on active tab -->
      </div>

      <!-- Table Container -->
      <div id="table-container-wrapper">
        <div id="stock-table-container"></div>
      </div>
    `;

    bindTabEvents();
    renderActiveTabContent();
  }

  function bindTabEvents() {
    container.querySelectorAll('.stock-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (activeTab !== tab) {
          activeTab = tab;
          searchTerm = '';
          activeLocation = 'all';
          activeKitCategory = 'All';
          
          // Silently update hash without triggering fresh resolver if possible,
          // or navigate to preserve query params in hash URL
          window.location.hash = `#/stock?tab=${activeTab}`;
        }
      });
    });
  }

  function renderActiveTabContent() {
    const actionsContainer = container.querySelector('#header-actions-container');
    const toolbarContainer = container.querySelector('#toolbar-container');
    const tableContainer = container.querySelector('#stock-table-container');

    // Clean up any existing bulk action bar
    container.querySelector('.bulk-action-bar')?.remove();

    if (activeTab === 'items') {
      // 1. Actions Header for Items
      actionsContainer.innerHTML = `
        <button class="btn btn-secondary" id="btn-transfer-stock" data-tooltip="Move stock quantities between warehouse locations or technician vehicles" data-tooltip-pos="left"><span class="material-icons-outlined">swap_horiz</span> Transfer</button>
        <button class="btn btn-secondary" id="btn-import-stock" data-tooltip="Upload a supplier CSV parts list files directly to catalog inventory" data-tooltip-pos="left"><span class="material-icons-outlined">file_upload</span> Import</button>
        <button class="btn btn-primary" id="btn-new-stock" data-tooltip="Manually add a single new catalog item" data-tooltip-pos="left"><span class="material-icons-outlined">add</span> New Item</button>
      `;

      // 2. Toolbar for Items
      toolbarContainer.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center; flex:1; max-width:75%">
          <div id="stock-filters-carousel-container" style="flex:0 0 50%; max-width:50%; overflow:hidden"></div>
          <div class="toolbar-selectors" style="display:flex; gap:10px; align-items:center;">
             <span class="text-tertiary" style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Location:</span>
             <select class="form-select select-sm" id="location-filter" style="width:180px; height:32px; font-size:13px;">
                <option value="all">All Locations</option>
             </select>
          </div>
        </div>
        <div class="toolbar-search">
          <span class="material-icons-outlined">search</span>
          <input type="text" placeholder="Search stock..." id="stock-search" value="${escapeHTML(searchTerm)}" />
        </div>
      `;

      // Populate Location selector
      const stock = store.getAll('stock') || [];
      const locSelect = toolbarContainer.querySelector('#location-filter');
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

      // Render DataTable for Items
      renderItemsTable(tableContainer);
      bindItemActions();

    } else {
      // 1. Actions Header for Kits
      actionsContainer.innerHTML = `
        <button class="btn btn-primary" id="btn-new-kit" data-tooltip="Bundle multiple parts and labor items into a single pre-packaged kit for quick quoting" data-tooltip-pos="left"><span class="material-icons-outlined">add</span> New Kit Bundle</button>
      `;

      // 2. Toolbar for Kits with carousel
      toolbarContainer.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center; flex:1; max-width:75%">
          <div id="kits-filters-carousel-container" style="flex:0 0 50%; max-width:50%; overflow:hidden"></div>
        </div>
        <div class="toolbar-search">
          <span class="material-icons-outlined">search</span>
          <input type="text" placeholder="Search kits..." id="kit-search" value="${escapeHTML(searchTerm)}" />
        </div>
      `;

      // Render DataTable for Kits
      renderKitsTable(tableContainer);
      bindKitActions();
    }
  }

  // --- ITEM VIEW FUNCTIONS ---

  function renderItemsTable(tableContainer) {
    const stock = store.getAll('stock') || [];
    let tagFilteredData = [...stock];

    const columns = [
      { key: 'name', label: 'Item Name', render: (r) => `<span class="cell-link font-medium" style="font-weight:600; color:var(--color-primary)">${escapeHTML(r.name)}</span>` },
      { key: 'sku', label: 'SKU', render: (r) => `<span class="text-secondary" style="font-family:monospace">${escapeHTML(r.sku)}</span>`, width: '100px' },
      { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category)}</span>`, width: '120px' },
      { key: 'quantity', label: 'Total Qty', render: (r) => {
        const totalQty = (r.locations || []).reduce((sum, l) => sum + l.quantity, 0);
        const low = totalQty <= r.reorderLevel;
        return `<span style="font-weight:600;color:${low ? 'var(--color-danger)' : 'var(--text-primary)'}">${totalQty}</span>${low ? ' <span class="badge badge-danger" style="margin-left:4px">LOW</span>' : ''}`;
      }, getValue: (r) => (r.locations || []).reduce((sum, l) => sum + l.quantity, 0), width: '100px' },
      { key: 'unitPrice', label: 'Unit Price', render: (r) => `$${r.unitPrice.toFixed(2)}`, getValue: (r) => r.unitPrice, width: '100px' },
      { key: 'locations', label: 'Locations Breakdown', render: (r) => {
        if (!r.locations || r.locations.length === 0) {
          return `<span class="text-tertiary" style="font-size: 12px;">No Stock</span>`;
        }
        return `<div style="display:flex; flex-direction:column; gap:4px">
          ${r.locations.map(loc => {
            const isVehicle = loc.location.toLowerCase().includes('vehicle') || loc.location.toLowerCase().includes('van') || loc.location.toLowerCase().includes('truck');
            return `
              <div style="display:flex; align-items:center; gap:6px; font-size:12px">
                <span class="material-icons-outlined" style="font-size:14px; color:var(--text-tertiary)">${isVehicle ? 'local_shipping' : 'warehouse'}</span>
                <span class="text-secondary" style="font-weight:500">${escapeHTML(loc.location)}:</span>
                <span style="font-weight:600; color:var(--text-primary)">${loc.quantity}</span>
              </div>
            `;
          }).join('')}
        </div>`;
      }, width: '240px' },
      { key: 'supplier', label: 'Supplier', render: (r) => `<span class="text-secondary">${escapeHTML(r.supplier)}</span>` },
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

    function applyItemFilters() {
      const q = searchTerm.toLowerCase();
      const filtered = tagFilteredData.filter(s => {
        const matchLoc = activeLocation === 'all' || (s.locations || []).some(l => l.location === activeLocation);
        const matchSearch = !q ||
          s.name.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
        return matchLoc && matchSearch;
      });
      table.updateData(filtered);
    }

    createToolbarFilters({
      container: container.querySelector('#stock-filters-carousel-container'),
      originalData: stock,
      filterType: 'stock',
      onFilterChange: (filtered) => {
        tagFilteredData = filtered;
        applyItemFilters();
      }
    });

    applyItemFilters();
  }

  function bindItemActions() {
    // Search input
    container.querySelector('#stock-search')?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderItemsTable(container.querySelector('#stock-table-container'));
    });

    // Location selector
    container.querySelector('#location-filter')?.addEventListener('change', (e) => {
      activeLocation = e.target.value;
      renderItemsTable(container.querySelector('#stock-table-container'));
    });

    // Transfer button click
    container.querySelector('#btn-transfer-stock')?.addEventListener('click', () => {
      openTransferDrawer();
    });

    // Import button click
    container.querySelector('#btn-import-stock')?.addEventListener('click', () => {
      showImportModal(container);
    });

    // New Item button click
    container.querySelector('#btn-new-stock')?.addEventListener('click', () => {
      openNewStockDrawer();
    });
  }

  // --- KIT VIEW FUNCTIONS ---

  function renderKitsTable(tableContainer) {
    const kits = store.getAll('kits') || [];
    let tagFilteredKits = [...kits];

    const columns = [
      { key: 'name', label: 'Kit Name', render: (r) => `<span class="cell-link font-medium" style="font-weight:600; color:var(--color-primary)">${escapeHTML(r.name)}</span>${r.description ? `<div style="font-size:12px; color:var(--text-tertiary); margin-top:2px">${escapeHTML(r.description)}</div>` : ''}` },
      { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category || 'General')}</span>`, width: '150px' },
      { key: 'items', label: 'Items Included', render: (r) => {
        const mCount = (r.items || []).filter(i => i.type !== 'labor').length;
        const lCount = (r.items || []).filter(i => i.type === 'labor').length;
        return `<span style="font-size:13px">${mCount} material${mCount !== 1 ? 's' : ''}${lCount > 0 ? `, ${lCount} labour` : ''}</span>`;
      }, width: '200px' },
      { key: 'totalCost', label: 'Total Cost', render: (r) => `$${(r.totalCost || 0).toFixed(2)}`, getValue: (r) => r.totalCost, width: '120px', style: 'text-align:right' },
      { key: 'totalPrice', label: 'Total Sell', render: (r) => `<span style="font-weight:600">$${(r.totalPrice || 0).toFixed(2)}</span>`, getValue: (r) => r.totalPrice, width: '120px', style: 'text-align:right' },
      { key: 'margin', label: 'Margin', render: (r) => {
        const margin = r.totalPrice > 0 ? ((r.totalPrice - r.totalCost) / r.totalPrice * 100) : 0;
        const color = margin >= 30 ? 'var(--color-success)' : margin >= 15 ? 'var(--color-warning)' : 'var(--color-danger)';
        return `<span style="font-weight:600; color:${color}">${margin.toFixed(1)}%</span>`;
      }, getValue: (r) => r.totalPrice > 0 ? ((r.totalPrice - r.totalCost) / r.totalPrice * 100) : 0, width: '100px', style: 'text-align:right' }
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
                const categories = ['Service Kits', 'Vehicle Loadouts', 'Installation Kits', 'Commissioning Kits', 'General', 'Electrical', 'Plumbing', 'HVAC'];
                const content = document.createElement('div');
                content.innerHTML = `
                  <div class="form-group">
                    <label class="form-label">Select Category</label>
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
                      showToast(`Updated ${ids.length} kits to category: ${newCat}`, 'success');
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

    function applyKitFilters() {
      const q = searchTerm.toLowerCase();
      const filtered = tagFilteredKits.filter(k => {
        const matchSearch = !q ||
          k.name.toLowerCase().includes(q) ||
          (k.description || '').toLowerCase().includes(q);
        return matchSearch;
      });
      table.updateData(filtered);
    }

    createToolbarFilters({
      container: container.querySelector('#kits-filters-carousel-container'),
      originalData: kits,
      filterType: 'kits',
      onFilterChange: (filtered) => {
        tagFilteredKits = filtered;
        applyKitFilters();
      }
    });

    applyKitFilters();
  }

  function bindKitActions() {
    // Search input
    container.querySelector('#kit-search')?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderKitsTable(container.querySelector('#stock-table-container'));
    });

    // New Kit button
    container.querySelector('#btn-new-kit')?.addEventListener('click', () => {
      router.navigate('/kits/new');
    });
  }

  // --- DRAWERS & MODALS BACKPORT ---

  function openNewStockDrawer() {
    const technicians = store.getAll('technicians').filter(t => !t.deactivated);
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
          <label class="form-label">Initial Location</label>
          <select class="form-select" id="new-stock-location">
            <option value="Main Warehouse">Main Warehouse</option>
            <optgroup label="Warehouses">
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </optgroup>
            <optgroup label="Vehicles">
              ${technicians.map(t => `<option value="Vehicle - ${escapeHTML(t.name)}">Vehicle - ${escapeHTML(t.name)}</option>`).join('')}
            </optgroup>
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
          const category = dOverlay.querySelector('#new-stock-category').value.trim() || 'Uncategorized';
          const location = dOverlay.querySelector('#new-stock-location').value;
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
    const technicians = store.getAll('technicians').filter(t => !t.deactivated);
    
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
              <option value="">Select destination...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <optgroup label="Warehouses">
                <option value="Warehouse A">Warehouse A</option>
                <option value="Warehouse B">Warehouse B</option>
              </optgroup>
              <optgroup label="Vehicles">
                ${technicians.map(t => `<option value="Vehicle - ${escapeHTML(t.name)}">Vehicle - ${escapeHTML(t.name)}</option>`).join('')}
              </optgroup>
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

  // Initial layout draw
  renderLayout();
}

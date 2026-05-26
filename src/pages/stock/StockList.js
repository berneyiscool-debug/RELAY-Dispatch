// ============================================
// FIELDFORGE — STOCK LIST PAGE
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
export function renderStockList(container) {
  const stock = store.getAll('stock');

  container.innerHTML = `
    <div class="page-header">
      <h1>Stock / Inventory</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-transfer-stock"><span class="material-icons-outlined">swap_horiz</span> Transfer</button>
        <button class="btn btn-secondary" id="btn-import-stock"><span class="material-icons-outlined">file_upload</span> Import</button>
        <button class="btn btn-primary" id="btn-new-stock"><span class="material-icons-outlined">add</span> New Item</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-left" style="display:flex; gap:15px; align-items:center; flex-wrap:wrap">
        <div class="toolbar-filters">
          <button class="toolbar-filter active" data-filter="all">All (${stock.length})</button>
          ${[...new Set(stock.map(s => s.category))].map(cat =>
            `<button class="toolbar-filter" data-filter="${cat}">${cat}</button>`
          ).join('')}
        </div>
        <div class="toolbar-selectors" style="display:flex; gap:10px; align-items:center;">
           <span class="text-tertiary" style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Location:</span>
           <select class="form-select select-sm" id="location-filter" style="width: 180px; height: 32px; font-size: 13px;">
              <option value="all">All Locations</option>
           </select>
        </div>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search stock..." id="stock-search" />
      </div>
    </div>
    <div id="stock-table-container"></div>
  `;

  // Populate Location Filter with grouping from nested locations
  const locSelect = container.querySelector('#location-filter');
  const locations = [...new Set(stock.flatMap(s => (s.locations || []).map(l => l.location || 'Unassigned')))].sort();
  const warehouses = locations.filter(l => l.toLowerCase().includes('warehouse') || l === 'Main' || l === 'Main Warehouse');
  const vehicles = locations.filter(l => l.toLowerCase().includes('vehicle') || l.toLowerCase().includes('van') || l.toLowerCase().includes('truck') || l.toLowerCase().includes('van stock'));
  const otherLocs = locations.filter(l => !warehouses.includes(l) && !vehicles.includes(l));

  if (warehouses.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Warehouses';
    warehouses.forEach(l => {
      const opt = new Option(l, l);
      group.appendChild(opt);
    });
    locSelect.appendChild(group);
  }
  if (vehicles.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Vehicles / Vans';
    vehicles.forEach(l => {
      const opt = new Option(l, l);
      group.appendChild(opt);
    });
    locSelect.appendChild(group);
  }
  if (otherLocs.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Other';
    otherLocs.forEach(l => {
      const opt = new Option(l, l);
      group.appendChild(opt);
    });
    locSelect.appendChild(group);
  }

  let filterState = {
    category: 'all',
    location: 'all',
    search: ''
  };

  function applyFilters() {
    const q = filterState.search.toLowerCase();
    const filtered = stock.filter(s => {
      const matchCat = filterState.category === 'all' || s.category === filterState.category;
      const matchLoc = filterState.location === 'all' || (s.locations || []).some(l => l.location === filterState.location);
      const matchSearch = !q || 
        s.name.toLowerCase().includes(q) || 
        s.sku.toLowerCase().includes(q) || 
        s.category.toLowerCase().includes(q) || 
        (s.locations || []).some(l => l.location.toLowerCase().includes(q));
      return matchCat && matchLoc && matchSearch;
    });
    table.updateData(filtered);
  }

  const columns = [
    { key: 'name', label: 'Item Name', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>` },
    { key: 'sku', label: 'SKU', render: (r) => `<span class="text-secondary" style="font-family:monospace">${escapeHTML(r.sku)}</span>`, width: '90px' },
    { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category)}</span>`, width: '110px' },
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

  // Event Listeners
  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterState.category = btn.dataset.filter;
      applyFilters();
    });
  });

  container.querySelector('#location-filter').addEventListener('change', (e) => {
    filterState.location = e.target.value;
    applyFilters();
  });

  container.querySelector('#stock-search').addEventListener('input', (e) => {
    filterState.search = e.target.value;
    applyFilters();
  });

  // Create Stock Item Drawer
  container.querySelector('#btn-new-stock').addEventListener('click', () => {
    const technicians = store.getAll('technicians');
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
            unitPrice: costPrice * 1.5, // default 50% markup
            costPrice,
            location,
            locations: [{ location, quantity: initialQty }],
            supplier: 'Unknown'
          });

          showToast('Stock item created', 'success');
          renderStockList(container);
          close();
        }}
      ]
    });
  });

  // Overhauled Transfer Drawer with Premium Dynamic Fields
  container.querySelector('#btn-transfer-stock')?.addEventListener('click', () => {
    const stockItems = store.getAll('stock');
    const technicians = store.getAll('technicians');
    
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
          renderStockList(container);
          close();
        }}
      ]
    });
    // Import Stock CSV wizard
    container.querySelector('#btn-import-stock')?.addEventListener('click', () => showImportModal(container));

    function showImportModal(parentContainer) {
      // Step 1: File upload modal
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
          {
            label: 'Cancel',
            className: 'btn-secondary',
            onClick: c => c()
          },
          {
            label: 'Next',
            className: 'btn-primary',
            onClick: c => {
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
                // Mapping modal
                showModal({
                  title: 'Map CSV Columns',
                  content: mapContent,
                  actions: [
                    {
                      label: 'Back',
                      className: 'btn-secondary',
                      onClick: c2 => c2()
                    },
                    {
                      label: 'Import',
                      className: 'btn-primary',
                      onClick: c2 => {
                        const mapping = {};
                        requiredFields.forEach(f => {
                          const sel = document.getElementById('map-' + f.key);
                          if (sel && sel.value) mapping[f.key] = sel.value;
                        });
                        // Preview first 5 rows
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
                            {
                              label: 'Back',
                              className: 'btn-secondary',
                              onClick: c3 => c3()
                            },
                            {
                              label: 'Execute',
                              className: 'btn-primary',
                              onClick: c3 => {
                                rows.forEach(r => {
                                  const newItem = {};
                                  // Name
                                  newItem.name = (r[mapping.name] || '').trim() || 'Untitled';
                                  // SKU
                                  newItem.sku = (r[mapping.sku] || '').trim() || ('SKU-' + Date.now().toString().slice(-6));
                                  // Category
                                  newItem.category = (r[mapping.category] || '').trim() || 'Uncategorized';
                                  // Unit Price
                                  const price = parseFloat(r[mapping.unitPrice]);
                                  newItem.unitPrice = isNaN(price) ? 0 : price;
                                  // Quantity
                                  const qty = parseInt(r[mapping.quantity]);
                                  const quantity = isNaN(qty) ? 0 : qty;
                                  // Location
                                  const loc = (r[mapping.location] || '').trim() || 'Main Warehouse';
                                  newItem.locations = [{ location: loc, quantity }];
                                  newItem.quantity = quantity;
                                  newItem.location = loc;
                                  // Supplier
                                  newItem.supplier = (r[mapping.supplier] || '').trim() || 'Unknown';
                                  // Optional costPrice fallback (assume 2/3 of unitPrice)
                                  newItem.costPrice = newItem.unitPrice / 1.5;
                                  store.create('stock', newItem);
                                });
                                showToast(`Imported ${rows.length} stock items`, 'success');
                                renderStockList(parentContainer);
                                c3();
                              }
                            }
                          ]
                        });
                        c2();
                      }
                    }
                  ]
                });
                c();
              };
              reader.readAsText(file);
            }
          }
        ]
      });
    }


    // Handle dynamic selection changes in Drawer
    // Wait for drawer rendering to bind events on the active element overlay
    setTimeout(() => {
      const dOverlay = document.querySelector('.drawer-overlay');
      if (!dOverlay) return;

      const itemSelect = dOverlay.querySelector('#transfer-item');
      const fromSelect = dOverlay.querySelector('#transfer-from');
      const qtyInput = dOverlay.querySelector('#transfer-qty');
      const avInfo = dOverlay.querySelector('#transfer-available-info');

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

        // Populate source locations with positive quantities
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

        // Set max and info for initial selection
        updateQtyLimits();
      });

      fromSelect.addEventListener('change', updateQtyLimits);

      function updateQtyLimits() {
        const opt = fromSelect.options[fromSelect.selectedIndex];
        if (!opt) return;
        const maxVal = parseInt(opt.dataset.max) || 0;
        qtyInput.max = maxVal;
        qtyInput.value = Math.min(qtyInput.value || 1, maxVal);
        avInfo.textContent = `Max available: ${maxVal}`;
        avInfo.style.display = 'block';
      }
    }, 100);
  });
}

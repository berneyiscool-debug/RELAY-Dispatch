// ============================================
// FIELDFORGE — KIT DETAIL / BUILDER
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { escapeHTML } from '../../utils/security.js';

export function renderKitDetail(container, { id }) {
  const isNew = id === 'new';
  let kit;

  if (isNew) {
    kit = {
      name: '',
      description: '',
      category: 'General',
      active: true,
      items: [],
      totalCost: 0,
      totalPrice: 0,
      itemCount: 0,
      marginOverrideEnabled: false,
      marginOverride: null
    };
  } else {
    kit = store.getById('kits', id);
    if (kit && kit.marginOverride !== undefined && kit.marginOverride !== null && kit.marginOverrideEnabled === undefined) {
      kit.marginOverrideEnabled = true;
    }
  }

  if (!kit) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Kit not found</h3></div>`;
    return;
  }

  if (!isNew) {
    updateBreadcrumbDetail(kit.name);
  } else {
    updateBreadcrumbDetail('New Kit');
  }

  const stockItems = store.getAll('stock') || [];
  const categories = ['Service Kits', 'Vehicle Loadouts', 'Installation Kits', 'Commissioning Kits', 'General', 'Electrical', 'Plumbing', 'HVAC'];

  function render() {
    recalculate();
    const margin = kit.totalPrice > 0 ? ((kit.totalPrice - kit.totalCost) / kit.totalPrice * 100) : 0;
    const marginDollar = kit.totalPrice - kit.totalCost;
    const marginColor = margin >= 30 ? 'var(--color-success)' : margin >= 15 ? 'var(--color-warning)' : 'var(--color-danger)';

    container.innerHTML = `
      ${renderDetailHeader({
        title: isNew ? 'New Kit' : escapeHTML(kit.name || 'Edit Kit'),
        icon: 'widgets',
        iconBgColor: 'var(--color-primary-light)',
        iconTextColor: 'var(--color-primary)',
        metaHtml: isNew ? '' : `
          <span class="badge badge-neutral">${escapeHTML(kit.category || 'General')}</span>
          <span class="badge ${kit.active ? 'badge-success' : 'badge-neutral'}">${kit.active ? 'Active' : 'Inactive'}</span>
        `,
        actionsHtml: `
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          ${!isNew ? `<button class="btn btn-secondary" id="btn-duplicate"><span class="material-icons-outlined">content_copy</span> Duplicate</button>` : ''}
          ${!isNew ? `<button class="btn btn-secondary" id="btn-delete" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span> Delete</button>` : ''}
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Kit</button>
        `
      })}

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; align-items:start">
        <div style="display:flex; flex-direction:column; gap:24px">
          <!-- Kit Info Card -->
          <div class="card">
            <div class="card-header"><h4>Kit Details</h4></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group" style="flex:2">
                  <label class="form-label">Kit Name *</label>
                  <input class="form-input" id="kit-name" value="${escapeHTML(kit.name || '')}" placeholder="e.g. Hot Water Service Kit" required />
                </div>
                <div class="form-group" style="flex:1">
                  <label class="form-label">Category</label>
                  <select class="form-select" id="kit-category">
                    ${categories.map(c => `<option value="${escapeHTML(c)}" ${kit.category === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" id="kit-description" rows="3" placeholder="Describe when to use this kit...">${escapeHTML(kit.description || '')}</textarea>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:16px">
                <input type="checkbox" id="kit-active" ${kit.active ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer" />
                <label for="kit-active" style="margin:0; font-weight:600; font-size:13.5px; cursor:pointer; color:var(--text-primary)">Active Kit</label>
                <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary); cursor:help" title="Makes this kit bundle active and available to select/use in Quotes and Purchase Orders.">help_outline</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4>Kit Items</h4>
              <div style="display:flex; gap:8px">
                <button class="btn btn-sm btn-secondary" id="btn-add-material"><span class="material-icons-outlined">add</span> Add Material</button>
                <button class="btn btn-sm btn-secondary" id="btn-add-labour"><span class="material-icons-outlined">add</span> Add Labour</button>
                <button class="btn btn-sm btn-primary" id="btn-browse-stock"><span class="material-icons-outlined">search</span> Browse Stock</button>
              </div>
            </div>
            <div class="card-body" style="padding:0">
              <table class="data-table" id="kit-items-table">
                <thead>
                  <tr>
                    <th style="width:80px">Type</th>
                    <th>Item Name</th>
                    <th style="width:120px">SKU</th>
                    <th style="width:70px; text-align:right">Qty</th>
                    <th style="width:100px; text-align:right">Cost ($)</th>
                    <th style="width:100px; text-align:right">Sell ($)</th>
                    <th style="width:100px; text-align:right">Total ($)</th>
                    <th style="width:50px; text-align:center"></th>
                  </tr>
                </thead>
                <tbody>
                  ${kit.items.length === 0 ? `
                    <tr>
                      <td colspan="8" style="text-align:center; padding:32px; color:var(--text-tertiary)">
                        No items added to this kit yet. Click one of the buttons above to add stock materials or labour hours.
                      </td>
                    </tr>
                  ` : kit.items.map((item, idx) => {
                    const isLabor = item.type === 'labor';
                    const lineCostTotal = (item.qty || 0) * (item.costPrice || 0);
                    const lineSellTotal = (item.qty || 0) * (item.unitPrice || 0);
                    return `
                      <tr data-index="${idx}">
                        <td>
                          <span class="badge ${isLabor ? 'badge-success' : 'badge-primary'}" style="font-size:10px; display:inline-block; text-align:center; width:100%">
                            ${isLabor ? 'Labour' : 'Material'}
                          </span>
                        </td>
                        <td>
                          <input type="text" class="form-input item-name-input" value="${escapeHTML(item.name || '')}" placeholder="Item description..." list="stock-autocomplete" style="padding:4px 8px; width:100%" />
                        </td>
                        <td>
                          <input type="text" class="form-input item-sku-input" value="${escapeHTML(item.sku || '')}" placeholder="SKU" ${isLabor ? 'disabled' : ''} style="padding:4px 8px; width:100%" />
                        </td>
                        <td>
                          <input type="number" class="form-input item-qty-input" value="${item.qty || 1}" min="0.01" step="any" style="padding:4px 8px; text-align:right; width:100%" />
                        </td>
                        <td>
                          <input type="number" class="form-input item-cost-input" value="${(item.costPrice || 0).toFixed(2)}" min="0" step="0.01" style="padding:4px 8px; text-align:right; width:100%" />
                        </td>
                        <td>
                          <input type="number" class="form-input item-sell-input" value="${(item.unitPrice || 0).toFixed(2)}" min="0" step="0.01" style="padding:4px 8px; text-align:right; width:100%" />
                        </td>
                        <td style="text-align:right; font-weight:600; padding-right:12px">
                          $${lineSellTotal.toFixed(2)}
                        </td>
                        <td style="text-align:center">
                          <button class="btn btn-ghost btn-icon btn-sm btn-remove-item" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">delete</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                ${kit.items.length > 0 ? `
                  <tfoot>
                    <tr style="background:var(--bg-secondary); font-weight:600">
                      <td colspan="4" style="text-align:right; padding:12px">Total Cost & Sell:</td>
                      <td style="text-align:right; padding:12px">$${(kit.totalCost || 0).toFixed(2)}</td>
                      <td style="text-align:right; padding:12px">$${(kit.totalPrice || 0).toFixed(2)}</td>
                      <td style="text-align:right; padding:12px; font-weight:700">$${(kit.totalPrice || 0).toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                ` : ''}
              </table>
            </div>
          </div>
        </div>

        <!-- Summary & Stats Panel -->
        <div class="card" style="position:sticky; top:24px">
          <div class="card-header"><h4>Kit Summary</h4></div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px">
              <span style="color:var(--text-secondary)">Total Items</span>
              <span style="font-weight:600; font-size:16px">${kit.itemCount || 0}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px">
              <span style="color:var(--text-secondary)">Total Cost</span>
              <span style="font-weight:600; font-size:16px">$${(kit.totalCost || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px">
              <span style="color:var(--text-secondary)">Total Sell Price</span>
              <span style="font-weight:700; font-size:18px; color:var(--color-primary)">$${(kit.totalPrice || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px">
              <span style="color:var(--text-secondary)">Margin ($)</span>
              <span style="font-weight:600; font-size:16px; color:${marginColor}">$${marginDollar.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center">
              <span style="color:var(--text-secondary)">Margin (%)</span>
              <span style="font-weight:700; font-size:20px; color:${marginColor}">${margin.toFixed(1)}%</span>
            </div>
            <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:4px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
                <input type="checkbox" id="kit-margin-override-enable" ${kit.marginOverrideEnabled ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer" />
                <label for="kit-margin-override-enable" style="margin:0; font-size:13px; font-weight:600; cursor:pointer">Override Margin</label>
                <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary); cursor:help" title="Lock the kit profit margin manually. When imported to quotes, stock item sell rates scale proportionally to match this exact target margin.">help_outline</span>
              </div>
              <div id="override-input-wrapper" style="display:${kit.marginOverrideEnabled ? 'block' : 'none'}">
                <label class="form-label" style="font-size:12px; margin-bottom:4px; display:block">Margin Override (%)</label>
                <input type="number" class="form-input" id="kit-margin-override" value="${kit.marginOverride !== undefined && kit.marginOverride !== null ? kit.marginOverride : ''}" placeholder="Combined rate (auto)" min="0" max="99.9" step="0.1" style="padding:6px 10px; font-size:13px; width:100%" />
                <small class="text-tertiary" style="font-size:11px; display:block; margin-top:6px; line-height:1.3">
                  Locks the kit's sell price to achieve this exact margin.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Autocomplete list of stock items -->
      <datalist id="stock-autocomplete">
        ${stockItems.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.sku || '')}</option>`).join('')}
      </datalist>
    `;

    bindEvents();
  }

  function recalculate() {
    let cost = 0;
    let price = 0;
    (kit.items || []).forEach(item => {
      cost += (parseFloat(item.qty) || 0) * (parseFloat(item.costPrice) || 0);
      price += (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
    });
    kit.totalCost = cost;
    
    const overrideEnabled = kit.marginOverrideEnabled;
    const overrideVal = parseFloat(kit.marginOverride);
    if (overrideEnabled && !isNaN(overrideVal)) {
      if (overrideVal >= 100) {
        kit.totalPrice = cost;
      } else {
        kit.totalPrice = cost / (1 - overrideVal / 100);
      }
    } else {
      kit.totalPrice = price;
    }
    kit.itemCount = (kit.items || []).length;
  }

  function updateItemFromDOM(tr) {
    const idx = parseInt(tr.dataset.index);
    if (isNaN(idx) || !kit.items[idx]) return;

    const item = kit.items[idx];
    const nameVal = tr.querySelector('.item-name-input').value;
    const skuVal = tr.querySelector('.item-sku-input').value;
    const qtyVal = parseFloat(tr.querySelector('.item-qty-input').value) || 0;
    const costVal = parseFloat(tr.querySelector('.item-cost-input').value) || 0;
    const sellVal = parseFloat(tr.querySelector('.item-sell-input').value) || 0;

    item.name = nameVal;
    item.sku = skuVal;
    item.qty = qtyVal;
    item.costPrice = costVal;
    item.unitPrice = sellVal;

    // Check if name selection matches a stock item to auto-populate
    if (item.type !== 'labor' && nameVal !== item._lastAutocomplete) {
      const match = stockItems.find(s => s.name === nameVal);
      if (match) {
        item.name = match.name;
        item.sku = match.sku || '';
        item.costPrice = match.costPrice || 0;
        item.unitPrice = match.unitPrice || 0;
        item.unit = match.unit || 'Each';
        item._lastAutocomplete = nameVal;
      }
    }
  }

  function bindEvents() {
    // Header Actions
    container.querySelector('#btn-cancel')?.addEventListener('click', () => router.navigate('/kits'));

    container.querySelector('#btn-duplicate')?.addEventListener('click', () => {
      const duplicate = JSON.parse(JSON.stringify(kit));
      delete duplicate.id;
      duplicate.name = `${duplicate.name} (Copy)`;
      duplicate.createdAt = new Date().toISOString();
      duplicate.updatedAt = new Date().toISOString();
      const saved = store.create('kits', duplicate);
      showToast('Kit duplicated successfully', 'success');
      router.navigate(`/kits/${saved.id}`);
    });

    container.querySelector('#btn-delete')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this kit?')) {
        store.delete('kits', kit.id);
        showToast('Kit deleted successfully', 'success');
        router.navigate('/kits');
      }
    });

    container.querySelector('#btn-save')?.addEventListener('click', () => {
      const nameInput = container.querySelector('#kit-name');
      if (!nameInput.value.trim()) {
        showToast('Kit name is required', 'error');
        nameInput.focus();
        return;
      }

      kit.name = nameInput.value.trim();
      kit.category = container.querySelector('#kit-category').value;
      kit.description = container.querySelector('#kit-description').value;
      kit.active = container.querySelector('#kit-active').checked;
      
      const marginOverrideInput = container.querySelector('#kit-margin-override');
      kit.marginOverride = marginOverrideInput && marginOverrideInput.value.trim() !== '' ? parseFloat(marginOverrideInput.value) : null;
      
      const marginOverrideEnableInput = container.querySelector('#kit-margin-override-enable');
      kit.marginOverrideEnabled = marginOverrideEnableInput ? marginOverrideEnableInput.checked : false;

      recalculate();

      if (isNew) {
        const saved = store.create('kits', kit);
        showToast('Kit created successfully', 'success');
        router.navigate(`/kits/${saved.id}`);
      } else {
        store.update('kits', kit.id, kit);
        showToast('Kit saved successfully', 'success');
        render();
      }
    });

    // Inputs change on Top Section
    container.querySelector('#kit-name')?.addEventListener('change', (e) => {
      kit.name = e.target.value;
      if (!isNew) {
        updateBreadcrumbDetail(kit.name);
      }
    });

    container.querySelector('#kit-margin-override-enable')?.addEventListener('change', (e) => {
      kit.marginOverrideEnabled = e.target.checked;
      recalculate();
      render();
    });

    container.querySelector('#kit-margin-override')?.addEventListener('input', (e) => {
      const val = e.target.value;
      kit.marginOverride = val.trim() !== '' ? parseFloat(val) : null;
    });

    container.querySelector('#kit-margin-override')?.addEventListener('change', () => {
      recalculate();
      render();
    });

    container.querySelector('#kit-category')?.addEventListener('change', (e) => {
      kit.category = e.target.value;
    });

    container.querySelector('#kit-description')?.addEventListener('change', (e) => {
      kit.description = e.target.value;
    });

    container.querySelector('#kit-active')?.addEventListener('change', (e) => {
      kit.active = e.target.checked;
    });

    // Inline Table events
    container.querySelectorAll('#kit-items-table tbody tr').forEach(tr => {
      tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          updateItemFromDOM(tr);
          recalculate();
          render();
        });
      });

      tr.querySelector('.btn-remove-item')?.addEventListener('click', () => {
        const idx = parseInt(tr.dataset.index);
        kit.items.splice(idx, 1);
        recalculate();
        render();
      });
    });

    // Table buttons
    container.querySelector('#btn-add-material')?.addEventListener('click', () => {
      kit.items.push({
        type: 'material',
        stockId: null,
        name: '',
        sku: '',
        qty: 1,
        costPrice: 0,
        unitPrice: 0,
        unit: 'Each'
      });
      recalculate();
      render();
    });

    container.querySelector('#btn-add-labour')?.addEventListener('click', () => {
      kit.items.push({
        type: 'labor',
        stockId: null,
        name: 'Labour',
        sku: '',
        qty: 1,
        costPrice: 45,
        unitPrice: 85,
        unit: 'hrs'
      });
      recalculate();
      render();
    });

    container.querySelector('#btn-browse-stock')?.addEventListener('click', () => {
      const stockContent = document.createElement('div');
      stockContent.innerHTML = `
        <div style="display:flex; gap:12px; margin-bottom:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search stock..." style="width:100%" />
          </div>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${stockItems.map(s => `
            <div class="stock-pick-item" data-id="${s.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${escapeHTML(s.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${s.sku || 'N/A'} — Cost: $${(s.costPrice || 0).toFixed(2)} — Sell: $${(s.unitPrice || 0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join('')}
        </div>
      `;

      const modalInstance = showModal({
        title: 'Browse Stock',
        content: stockContent,
        actions: [{ label: 'Close', className: 'btn-secondary', onClick: c => c() }]
      });

      // Bind search inside Browse Stock modal
      const searchInput = stockContent.querySelector('#stock-search');
      const browseContainer = stockContent.querySelector('#stock-list-browse');
      searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredStock = stockItems.filter(s =>
          s.name.toLowerCase().includes(query) || (s.sku || '').toLowerCase().includes(query)
        );
        browseContainer.innerHTML = filteredStock.map(s => `
          <div class="stock-pick-item" data-id="${s.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
            <div>
              <div style="font-weight:600">${escapeHTML(s.name)}</div>
              <div style="font-size:11px; color:var(--text-secondary)">SKU: ${s.sku || 'N/A'} — Cost: $${(s.costPrice || 0).toFixed(2)} — Sell: $${(s.unitPrice || 0).toFixed(2)}</div>
            </div>
            <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
          </div>
        `).join('');

        // Bind clicks for the newly filtered items
        browseContainer.querySelectorAll('.stock-pick-item').forEach(itemEl => {
          itemEl.addEventListener('click', () => {
            const stockId = itemEl.dataset.id;
            const sItem = stockItems.find(s => s.id === stockId);
            if (sItem) {
              kit.items.push({
                type: 'material',
                stockId: sItem.id,
                name: sItem.name,
                sku: sItem.sku || '',
                qty: 1,
                costPrice: sItem.costPrice || 0,
                unitPrice: sItem.unitPrice || 0,
                unit: sItem.unit || 'Each'
              });
              recalculate();
              render();
              modalInstance.close();
            }
          });
        });
      });

      // Bind initial clicks
      browseContainer.querySelectorAll('.stock-pick-item').forEach(itemEl => {
        itemEl.addEventListener('click', () => {
          const stockId = itemEl.dataset.id;
          const sItem = stockItems.find(s => s.id === stockId);
          if (sItem) {
            kit.items.push({
              type: 'material',
              stockId: sItem.id,
              name: sItem.name,
              sku: sItem.sku || '',
              qty: 1,
              costPrice: sItem.costPrice || 0,
              unitPrice: sItem.unitPrice || 0,
              unit: sItem.unit || 'Each'
            });
            recalculate();
            render();
            modalInstance.close();
          }
        });
      });
    });
  }

  render();
}

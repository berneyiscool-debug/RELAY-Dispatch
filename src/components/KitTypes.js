// ============================================
// RELAY — KIT TYPES (managed registry)
// ============================================
// Self-contained section rendering the managed kit types registry that kits
// reference via their `category` field. Rendered inside the Settings
// "Materials & Catalog" tab.

import { store } from '../data/store.js';
import { createDataTable } from './DataTable.js';
import { showDrawer } from './Drawer.js';
import { showModal } from './Modal.js';
import { showToast } from './Notifications.js';
import { escapeHTML } from '../utils/security.js';
import { getActiveKitTypes, renameKitType } from '../utils/kitTypes.js';

export function renderKitTypes(container) {
  function refresh() {
    render();
  }

  function render() {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:32px">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Kit Types</h4>
            <button class="btn btn-primary btn-sm" id="btn-new-kit-type" data-tooltip="Create a kit type that kits are categorised under" data-tooltip-pos="left"><span class="material-icons-outlined" style="font-size:16px">add</span> New Kit Type</button>
          </div>
          <div id="kit-types-table-container"></div>
        </div>
      </div>
    `;

    renderKitTypesTable(container.querySelector('#kit-types-table-container'));

    container.querySelector('#btn-new-kit-type')?.addEventListener('click', () => openKitTypeDrawer(null));
  }

  function renderKitTypesTable(tableContainer) {
    const kitTypes = getActiveKitTypes();
    const kits = store.getAll('kits') || [];
    const data = kitTypes.map(t => ({
      ...t,
      kitCount: kits.filter(k => k.category === t.name).length
    }));

    const columns = [
      { key: 'name', label: 'Kit Type', render: (r) => `<span class="cell-link font-medium" style="font-weight:600; color:var(--color-primary)">${escapeHTML(r.name)}</span>`, width: '50%' },
      { key: 'kitCount', label: 'Kits', render: (r) => `<span class="text-secondary">${r.kitCount}</span>`, getValue: (r) => r.kitCount, width: '20%' },
      { key: 'active', label: 'Status', render: (r) => r.active === false ? '<span class="badge badge-neutral">Inactive</span>' : '<span class="badge badge-success">Active</span>', width: '30%' },
    ];

    const table = createDataTable({
      columns,
      data,
      onRowClick: (id) => openKitTypeDrawer(id),
      emptyMessage: 'No kit types',
      emptyIcon: 'category',
    });

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
  }

  function openKitTypeDrawer(kitTypeId) {
    const isEdit = !!kitTypeId;
    const existing = kitTypeId ? store.getById('kitTypes', kitTypeId) : null;

    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Kit Type Name *</label>
        <input type="text" class="form-input" id="kit-type-name" value="${escapeHTML(existing?.name || '')}" />
      </div>
      <div class="form-group" style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" id="kit-type-active" ${existing?.active === false ? '' : 'checked'} />
        <label class="form-label" style="margin:0">Active</label>
      </div>
    `;

    const save = (close) => {
      const dOverlay = document.querySelector('.drawer-overlay');
      const name = dOverlay.querySelector('#kit-type-name').value.trim();
      const active = dOverlay.querySelector('#kit-type-active').checked;

      if (!name) { showToast('Kit type name is required', 'error'); return; }

      const dup = getActiveKitTypes().find(t =>
        t.name.toLowerCase() === name.toLowerCase() && t.id !== kitTypeId
      );
      if (dup) { showToast(`A kit type named "${name}" already exists`, 'error'); return; }

      const inUse = (store.getAll('kits') || []).filter(k => k.category === (existing?.name || '')).length;
      if (!active && inUse > 0) {
        showToast(`Cannot deactivate: ${name} is used by ${inUse} kit(s)`, 'error');
        return;
      }

      if (isEdit) {
        if (existing.name !== name) renameKitType(existing.name, name);
        store.update('kitTypes', kitTypeId, { name, active });
        showToast('Kit type updated', 'success');
      } else {
        store.create('kitTypes', { name, active });
        showToast('Kit type created', 'success');
      }

      refresh();
      close();
    };

    const del = (close) => {
      const inUse = (store.getAll('kits') || []).filter(k => k.category === existing.name).length;
      if (inUse > 0) {
        showToast(`Cannot delete: ${existing.name} is used by ${inUse} kit(s)`, 'error');
        return;
      }
      showModal({
        title: 'Delete Kit Type',
        content: `<p>Delete <strong>${escapeHTML(existing.name)}</strong>? This cannot be undone.</p>`,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (c) => c() },
          { label: 'Delete', className: 'btn-danger', onClick: (c) => {
            store.delete('kitTypes', kitTypeId);
            showToast('Kit type deleted', 'success');
            c();
            close();
            refresh();
          }},
        ],
      });
    };

    showDrawer({
      title: isEdit ? 'Edit Kit Type' : 'New Kit Type',
      content: content.outerHTML,
      width: 440,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        ...(isEdit ? [{ label: 'Delete', className: 'btn-danger', onClick: (close) => del(close) }] : []),
        { label: isEdit ? 'Update' : 'Create', className: 'btn-primary', onClick: (close) => save(close) },
      ]
    });
  }

  render();
}

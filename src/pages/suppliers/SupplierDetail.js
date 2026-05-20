// ============================================
// FIELDFORGE — SUPPLIER DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { hasPermission } from '../../utils/permissions.js';

export function renderSupplierDetail(container, params) {
  const supplier = store.getById('suppliers', params.id);
  if (!supplier) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>`;
    return;
  }

  updateBreadcrumbDetail(supplier.name);

  const canEdit = hasPermission('Suppliers', 'edit');
  const canDelete = hasPermission('Suppliers', 'delete');

  // Load associated Stock Items
  const stockItems = store.getAll('stock').filter(s => s.supplier === supplier.name);

  // Load associated Purchase Orders
  const purchaseOrders = store.getAll('purchaseOrders').filter(po => po.supplierName === supplier.name);

  let activeTab = 'overview';

  function render() {
    container.innerHTML = `
      ${renderDetailHeader({
        title: escapeHTML(supplier.name),
        icon: 'local_shipping',
        iconBgColor: 'var(--color-primary-light)',
        iconTextColor: 'var(--color-primary)',
        metaHtml: `
          <span><span class="material-icons-outlined" style="font-size:14px">label</span> ${escapeHTML(supplier.category || 'General')}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">payment</span> Terms: ${escapeHTML(supplier.paymentTerms || '30 Days')}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">credit_card</span> Account: ${escapeHTML(supplier.accountNumber || '—')}</span>
          <span class="badge ${supplier.active ? 'badge-success' : 'badge-neutral'}">${supplier.active ? 'Active' : 'Inactive'}</span>
        `,
        actionsHtml: `
          ${canEdit ? `
            <button class="btn btn-secondary" id="btn-edit-supplier">
              <span class="material-icons-outlined">edit</span> Edit
            </button>
          ` : ''}
          ${canDelete ? `
            <button class="btn btn-danger" id="btn-delete-supplier">
              <span class="material-icons-outlined">delete</span> Delete
            </button>
          ` : ''}
        `
      })}

      <div class="tabs" id="supplier-tabs">
        <button class="tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
        <button class="tab ${activeTab === 'catalogues' ? 'active' : ''}" data-tab="catalogues">Catalogues & Docs (${(supplier.attachments || []).length})</button>
        <button class="tab ${activeTab === 'stock' ? 'active' : ''}" data-tab="stock">Stock Items (${stockItems.length})</button>
        <button class="tab ${activeTab === 'pos' ? 'active' : ''}" data-tab="pos">Purchase Orders (${purchaseOrders.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `;

    renderTabContent();

    // Tab switching
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent();
      });
    });

    // Wire up header actions
    if (canEdit) {
      container.querySelector('#btn-edit-supplier').addEventListener('click', () => {
        router.navigate(`/suppliers/${supplier.id}/edit`);
      });
    }

    if (canDelete) {
      container.querySelector('#btn-delete-supplier').addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `<p>Are you sure you want to delete supplier <strong>${escapeHTML(supplier.name)}</strong>? This action cannot be undone.</p>`;
        showModal({
          title: 'Delete Supplier',
          content,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Delete', className: 'btn-danger', onClick: (close) => {
              store.delete('suppliers', supplier.id);
              showToast('Supplier deleted successfully', 'success');
              close();
              router.navigate('/suppliers');
            }},
          ],
        });
      });
    }
  }

  function renderTabContent() {
    const tabContent = container.querySelector('#tab-content');
    if (!tabContent) return;

    if (activeTab === 'overview') {
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Supplier & Financial Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${detailRow('Supplier Name', supplier.name)}
                  ${detailRow('Contact Name', supplier.contactName || 'Not set')}
                  ${detailRow('Email Address', supplier.email || 'Not set')}
                  ${detailRow('Phone Number', supplier.phone || 'Not set')}
                  ${detailRow('Physical Address', supplier.address || 'Not set')}
                  ${detailRow('Account Number', supplier.accountNumber || 'Not set')}
                  ${detailRow('Payment Terms', supplier.paymentTerms || '30 Days')}
                  ${detailRow('System Status', supplier.active ? 'Active (Available for stock & POs)' : 'Inactive')}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Internal Operations Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 16px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${escapeHTML(supplier.notes || 'No notes recorded for this supplier.')}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === 'catalogues') {
      const attachments = supplier.attachments || [];
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 20px;">
            <h4 style="margin:0">Catalogues & Documents Registry</h4>
            ${canEdit ? `
              <div style="position:relative">
                <input type="file" id="catalogue-file-input" style="display:none" />
                <button class="btn btn-primary btn-sm" id="btn-upload-file">
                  <span class="material-icons-outlined">upload_file</span> Upload Document
                </button>
              </div>
            ` : ''}
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>File Type</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th style="width:180px; text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${attachments.map((doc) => {
                  const sizeMB = (doc.size / (1024 * 1024)).toFixed(2);
                  const isPdfOrImg = doc.type === 'application/pdf' || (doc.type && doc.type.startsWith('image/')) || doc.name.toLowerCase().endsWith('.pdf');
                  return `
                    <tr>
                      <td class="font-medium">${escapeHTML(doc.name)}</td>
                      <td class="text-secondary" style="font-size:12px">${escapeHTML(doc.type || 'Unknown')}</td>
                      <td>${sizeMB} MB</td>
                      <td>${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-AU') : '—'}</td>
                      <td style="text-align:right">
                        <div style="display:inline-flex; gap:6px;">
                          ${isPdfOrImg ? `
                            <button class="btn btn-ghost btn-sm btn-preview-doc" data-id="${doc.id}" title="Preview Document">
                              <span class="material-icons-outlined" style="font-size:18px">visibility</span>
                            </button>
                          ` : ''}
                          <a href="${doc.url}" download="${escapeHTML(doc.name)}" class="btn btn-ghost btn-sm" title="Download File" style="display:inline-flex; align-items:center; justify-content:center; text-decoration:none; color:inherit;">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </a>
                          ${canEdit ? `
                            <button class="btn btn-ghost btn-sm btn-delete-doc text-danger" data-id="${doc.id}" title="Delete Document">
                              <span class="material-icons-outlined" style="font-size:18px">delete</span>
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${attachments.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:32px" class="text-secondary">No catalogues, spec sheets, or price documents uploaded.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Upload Handler
      if (canEdit) {
        const fileInput = tabContent.querySelector('#catalogue-file-input');
        const uploadBtn = tabContent.querySelector('#btn-upload-file');
        
        if (uploadBtn && fileInput) {
          uploadBtn.addEventListener('click', () => fileInput.click());

          fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 8 * 1024 * 1024) {
              showToast('File is too large. Maximum size is 8MB.', 'error');
              return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
              const newAttachment = {
                id: 'att_sup_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                url: evt.target.result
              };
              
              const updatedAttachments = [...(supplier.attachments || []), newAttachment];
              store.update('suppliers', supplier.id, { attachments: updatedAttachments });
              supplier.attachments = updatedAttachments;
              
              showToast('Document uploaded successfully', 'success');
              render();
            };
            reader.readAsDataURL(file);
          });
        }

        // Delete Handler
        tabContent.querySelectorAll('.btn-delete-doc').forEach(btn => {
          btn.addEventListener('click', () => {
            const docId = btn.dataset.id;
            const content = document.createElement('div');
            content.innerHTML = `<p>Are you sure you want to delete this catalogue/document? This action cannot be undone.</p>`;
            showModal({
              title: 'Confirm Delete Document',
              content,
              actions: [
                { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                { label: 'Delete', className: 'btn-danger', onClick: c => {
                  const updatedAttachments = (supplier.attachments || []).filter(d => d.id !== docId);
                  store.update('suppliers', supplier.id, { attachments: updatedAttachments });
                  supplier.attachments = updatedAttachments;
                  showToast('Document deleted successfully', 'success');
                  c();
                  render();
                }}
              ]
            });
          });
        });
      }

      // Preview Handler
      tabContent.querySelectorAll('.btn-preview-doc').forEach(btn => {
        btn.addEventListener('click', () => {
          const docId = btn.dataset.id;
          const doc = (supplier.attachments || []).find(d => d.id === docId);
          if (doc) {
            localStorage.setItem('currentDocumentView', JSON.stringify({
              name: doc.name,
              type: doc.type,
              url: doc.url
            }));
            window.open('#/document/view', '_blank');
          }
        });
      });

    } else if (activeTab === 'stock') {
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Catalogued Stock Supplied</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Default Unit Cost</th>
                  <th>Total Stock Level</th>
                </tr>
              </thead>
              <tbody>
                ${stockItems.map(item => {
                  return `
                    <tr style="cursor:pointer" onclick="window.location.hash='#/stock/${item.id}'" title="Click to view Stock Details">
                      <td class="font-medium cell-link">${escapeHTML(item.name)}</td>
                      <td style="font-family:monospace">${escapeHTML(item.sku || '—')}</td>
                      <td><span class="badge badge-neutral">${escapeHTML(item.category || 'General')}</span></td>
                      <td class="font-semibold" style="color:var(--color-primary)">$${(item.costPrice !== undefined ? item.costPrice : 0.00).toFixed(2)}</td>
                      <td>
                        <strong style="color: ${item.quantity <= (item.reorderLevel || 0) ? 'var(--color-danger)' : 'inherit'}">
                          ${item.quantity || 0} units
                        </strong>
                        ${item.quantity <= (item.reorderLevel || 0) ? `<span style="font-size:10px; color:var(--color-danger); font-weight:600; display:block">REORDER LEVEL REACHED</span>` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${stockItems.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:32px" class="text-secondary">No inventory parts catalogued under this supplier.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (activeTab === 'pos') {
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Purchase Orders Issued</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Order Date</th>
                  <th>Authorized By</th>
                  <th>Warehouse / Location</th>
                  <th>PO Status</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${purchaseOrders.map(po => {
                  const total = (po.items || []).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0), 0);
                  const statusColors = {
                    'Draft': 'badge-neutral',
                    'Pending Approval': 'badge-warning',
                    'Approved / Sent': 'badge-primary',
                    'Received': 'badge-success',
                    'Cancelled': 'badge-danger'
                  };
                  return `
                    <tr style="cursor:pointer" onclick="window.location.hash='#/purchase-orders/${po.id}'" title="Click to view Purchase Order">
                      <td class="font-medium cell-link">${escapeHTML(po.number)}</td>
                      <td>${po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-AU') : '—'}</td>
                      <td>${escapeHTML(po.creatorName || '—')}</td>
                      <td>${escapeHTML(po.warehouseName || 'Main Warehouse')}</td>
                      <td><span class="badge ${statusColors[po.status] || 'badge-neutral'}">${escapeHTML(po.status)}</span></td>
                      <td class="font-medium" style="color:var(--color-primary)">$${total.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
                ${purchaseOrders.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No purchase orders raised for this supplier yet.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  function detailRow(label, value) {
    return `
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${escapeHTML(label)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${escapeHTML(String(value))}</span>
      </div>
    `;
  }

  render();
}

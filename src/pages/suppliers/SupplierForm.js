// ============================================
// FIELDFORGE — SUPPLIER FORM PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderSupplierForm(container, params) {
  const isNew = params.id === 'new';
  let supplier = isNew 
    ? { active: true, category: 'General', paymentTerms: '30 Days', attachments: [] } 
    : store.getById('suppliers', params.id);

  if (!supplier && !isNew) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>`;
    return;
  }

  const categories = ['Electrical', 'Plumbing', 'HVAC', 'Fire Safety', 'Security', 'General'];
  const terms = ['COD', '7 Days', '14 Days', '30 Days'];

  container.innerHTML = `
    <div class="page-header">
      <h1>${isNew ? 'New Supplier Profile' : 'Edit Supplier Profile'}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Supplier</button>
      </div>
    </div>

    <div class="card" style="max-width: 700px; margin-bottom: var(--space-xl);">
      <div class="card-body">
        <form id="supplier-form" style="display: flex; flex-direction: column; gap: 18px;">
          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px;">Primary Contact Details</h4>
          
          <div class="form-group">
            <label class="form-label">Business Name *</label>
            <input type="text" id="name" class="form-input" value="${supplier.name || ''}" placeholder="e.g. ElectraTrade" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Primary Contact Person</label>
            <input type="text" id="contactName" class="form-input" value="${supplier.contactName || ''}" placeholder="e.g. Robert Vance" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" value="${supplier.email || ''}" placeholder="e.g. sales@electratrade.com.au" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="phone" class="form-input" value="${supplier.phone || ''}" placeholder="e.g. 03 9822 1045" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Physical Address</label>
            <input type="text" id="address" class="form-input" value="${supplier.address || ''}" placeholder="e.g. 22 Industrial Parkway, South Melbourne, VIC 3205" />
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Classification & Terms</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier Category</label>
              <select id="category" class="form-input">
                ${categories.map(cat => `<option value="${cat}" ${supplier.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="paymentTerms" class="form-input">
                ${terms.map(t => `<option value="${t}" ${supplier.paymentTerms === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Account Number</label>
              <input type="text" id="accountNumber" class="form-input" value="${supplier.accountNumber || ''}" placeholder="e.g. FF-ET-10291" />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Internal Notes</h4>

          <div class="form-group">
            <textarea id="notes" class="form-input" rows="3" placeholder="Enter comments or special notes about this supplier...">${supplier.notes || ''}</textarea>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
            <input type="checkbox" id="active" ${supplier.active ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
            <label for="active" style="margin: 0; cursor:pointer; font-weight:600;" class="form-label">Active (Visible in stock & purchase orders)</label>
          </div>
        </form>
      </div>
    </div>
  `;

  container.querySelector('#btn-cancel').addEventListener('click', () => {
    router.navigate(isNew ? '/suppliers' : `/suppliers/${params.id}`);
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    const name = container.querySelector('#name').value.trim();
    const contactName = container.querySelector('#contactName').value.trim();
    const email = container.querySelector('#email').value.trim();
    const phone = container.querySelector('#phone').value.trim();
    const address = container.querySelector('#address').value.trim();
    const category = container.querySelector('#category').value;
    const paymentTerms = container.querySelector('#paymentTerms').value;
    const accountNumber = container.querySelector('#accountNumber').value.trim();
    const notes = container.querySelector('#notes').value.trim();
    const active = container.querySelector('#active').checked;

    if (!name) {
      showToast('Supplier Name is a required field.', 'warning');
      return;
    }

    const data = {
      ...supplier,
      name,
      contactName,
      email,
      phone,
      address,
      category,
      paymentTerms,
      accountNumber,
      notes,
      active
    };

    if (isNew) {
      const created = store.create('suppliers', data);
      showToast('Supplier profile created successfully', 'success');
      router.navigate(`/suppliers/${created.id}`);
    } else {
      store.update('suppliers', params.id, data);
      showToast('Supplier profile updated successfully', 'success');
      router.navigate(`/suppliers/${params.id}`);
    }
  });
}

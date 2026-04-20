// ============================================
// SIMPRO CLONE — LEAD FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderLeadForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const lead = isEdit ? store.getById('leads', id) : {};
  const customers = store.getAll('customers');

  container.innerHTML = `
    <div class="page-header"><h1>${isEdit ? 'Edit Lead' : 'New Lead'}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="lead-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${lead.title || ''}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" name="customerId" required>
                <option value="">Select customer...</option>
                ${customers.map(c => `<option value="${c.id}" ${lead.customerId === c.id ? 'selected' : ''}>${c.company}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${['Website','Referral','Phone','Email','Trade Show','Google Ads'].map(s => `<option ${lead.source === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${['New','Contacted','Qualified','Proposal','Negotiation','Won','Lost'].map(s => `<option ${lead.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${['Low','Medium','High'].map(p => `<option ${lead.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Estimated Value ($)</label>
            <input class="form-input" type="number" name="value" value="${lead.value || ''}" step="0.01" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" name="description">${lead.description || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Lead</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate(isEdit ? `/leads/${id}` : '/leads'));
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#lead-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form));
    data.value = parseFloat(data.value) || 0;
    const cust = customers.find(c => c.id === data.customerId);
    data.customerName = cust?.company || '';
    data.contactName = cust ? `${cust.firstName} ${cust.lastName}` : '';

    if (isEdit) { store.update('leads', id, data); showToast('Lead updated', 'success'); router.navigate(`/leads/${id}`); }
    else { const n = store.create('leads', data); showToast('Lead created', 'success'); router.navigate(`/leads/${n.id}`); }
  });
}

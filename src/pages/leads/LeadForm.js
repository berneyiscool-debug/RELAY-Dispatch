// ============================================
// RELAY DISPATCH — LEAD FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { isCloudUser } from '../../utils/aiTier.js';
import { LEAD_STAGES, leadStageBadge, leadDatePart, logLeadStageChange, notifyLeadOwner } from './leadStages.js';

export function renderLeadForm(container, { id, origin }) {
  const isEdit = id && id !== 'new';
  const lead = isEdit ? store.getById('leads', id) : {};
  // The Marketplace is a cloud-only lead source (see LeadsList.js), so a local
  // workspace files Internal leads only. A lead that already carries the
  // Marketplace origin keeps it, so editing can't silently reclassify the record.
  const origins = !isCloudUser() && lead.origin !== 'Marketplace' ? ['Internal'] : ['Internal', 'Marketplace'];
  // ?origin=Marketplace deep links come from the marketplace leads list, which a
  // local workspace can't reach, so ignore it there.
  const defaultOrigin = lead.origin || (isCloudUser() ? origin : null) || 'Internal';
  const customers = store.getAll('customers');
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);
  // A lead can carry an owner that isn't in the local technicians list (cloud
  // workspace, or a technician since removed). Keep it selectable so saving an
  // unrelated field can't silently clear the assignment.
  const ownerName = lead.salesRepName || lead.sales_rep_name || '';
  const orphanOwner = Boolean(lead.assignedTo) && !technicians.some(t => t.id === lead.assignedTo);

  container.innerHTML = `
    <div class="page-header"><h1>${isEdit ? 'Edit Lead' : 'New Lead'}</h1></div>
    <form id="lead-form" class="lead-form" style="max-width:900px">
      <section class="card">
        <div class="card-header">
          <h4><span class="material-icons-outlined">badge</span> Lead Details</h4>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${escapeHTML(lead.title || '')}" required placeholder="e.g. Commercial Switchboard Upgrade" />
          </div>
          <div class="form-group">
            <label class="form-label">Customer *</label>
            <select class="form-select" name="customerId" required id="lead-customer-select">
              <option value="">Select customer...</option>
              ${customers.map(c => `<option value="${c.id}" ${lead.customerId === c.id ? 'selected' : ''}>${escapeHTML(c.company || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Customer')}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Origin</label>
              <select class="form-select" name="origin">
                ${origins.map(o => `<option ${defaultOrigin === o ? 'selected' : ''}>${o}</option>`).join('')}
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
              <label class="form-label">Contact Phone</label>
              <input class="form-input" id="lead-phone" name="phone" value="${escapeHTML(lead.phone || '')}" placeholder="e.g. 0400 123 456" />
            </div>
            <div class="form-group">
              <label class="form-label">Contact Email</label>
              <input class="form-input" id="lead-email" type="email" name="email" value="${escapeHTML(lead.email || '')}" placeholder="e.g. contact@example.com" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h4><span class="material-icons-outlined">trending_up</span> Pipeline &amp; Value</h4>
          ${isEdit && lead.status ? `<span class="badge ${leadStageBadge(lead.status)}">${escapeHTML(lead.status)}</span>` : ''}
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${LEAD_STAGES.map(s => `<option ${lead.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${['Low','Medium','High'].map(p => `<option ${lead.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Client Budget ($)</label>
              <input class="form-input" type="number" name="budget" value="${escapeHTML(lead.budget ?? '')}" step="0.01" placeholder="e.g. 15000" />
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Value ($)</label>
              <input class="form-input" type="number" name="value" value="${escapeHTML(lead.value ?? '')}" step="0.01" placeholder="e.g. 12000" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h4><span class="material-icons-outlined">person</span> Ownership</h4>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Owner</label>
              <select class="form-select" name="assignedTo" id="lead-owner-select">
                <option value="">Unassigned</option>
                ${orphanOwner ? `<option value="${lead.assignedTo}" selected>${escapeHTML(ownerName || 'Former owner')}</option>` : ''}
                ${technicians.map(t => `<option value="${t.id}" ${lead.assignedTo === t.id ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Next Action</label>
              <input class="form-input" type="date" name="nextActionDate" id="lead-next-action" value="${leadDatePart(lead.nextActionDate)}" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h4><span class="material-icons-outlined">assignment</span> Scope &amp; Notes</h4>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Project Requirements</label>
            <textarea class="form-textarea" name="requirements" placeholder="Enter detailed project scope or client requirements..." style="min-height:100px">${escapeHTML(lead.requirements || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="description" placeholder="Internal pipeline notes...">${escapeHTML(lead.description || '')}</textarea>
          </div>
        </div>
      </section>

      <div class="card-footer">
        <button type="button" class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Lead</button>
      </div>
    </form>
  `;

  const customerSelect = container.querySelector('#lead-customer-select');
  customerSelect.addEventListener('change', () => {
    const selectedId = customerSelect.value;
    const cust = customers.find(c => c.id === selectedId);
    if (cust) {
      container.querySelector('#lead-phone').value = cust.phone || '';
      container.querySelector('#lead-email').value = cust.email || '';
    }
  });

  container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate(isEdit ? `/leads/${id}` : '/leads'));
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#lead-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form));
    data.value = parseFloat(data.value) || 0;
    data.budget = parseFloat(data.budget) || 0;
    const cust = customers.find(c => c.id === data.customerId);
    data.customerName = cust ? (cust.company || `${cust.firstName || ''} ${cust.lastName || ''}`.trim()) : '';
    data.contactName = cust ? `${cust.firstName} ${cust.lastName}` : '';
    const owner = technicians.find(t => t.id === data.assignedTo);
    data.assignedToName = owner ? owner.name : (data.assignedTo === lead.assignedTo ? ownerName : '');
    data.salesRepName = owner ? owner.name : (data.assignedTo ? ownerName : '');

    const prevStatus = lead.status || 'New';
    const nextStatus = data.status || 'New';
    const statusChanged = isEdit && nextStatus !== prevStatus;
    if (statusChanged) data.stageHistory = logLeadStageChange(lead, prevStatus, nextStatus);

    if (isEdit) {
      store.update('leads', id, data);
      if (statusChanged) {
        notifyLeadOwner({ ...lead, ...data }, {
          title: 'Lead stage updated',
          message: `${data.title || 'Lead'} moved from ${prevStatus} to ${nextStatus}.`,
        });
      }
      showToast('Lead updated', 'success');
      router.navigate(`/leads/${id}`);
    } else {
      const n = store.create('leads', data);
      showToast('Lead created', 'success');
      router.navigate(`/leads/${n.id}`);
    }
  });
}

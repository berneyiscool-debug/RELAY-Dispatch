// ============================================
// SIMPRO CLONE — JOB FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderJobForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const job = isEdit ? store.getById('jobs', id) : {};
  const customers = store.getAll('customers');
  const technicians = store.getAll('technicians');

  container.innerHTML = `
    <div class="page-header"><h1>${isEdit ? 'Edit Job' : 'New Job'}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="job-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${job.title || ''}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" name="customerId" required>
                <option value="">Select customer...</option>
                ${customers.map(c => `<option value="${c.id}" ${job.customerId === c.id ? 'selected' : ''}>${c.company}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${['Electrical','Plumbing','HVAC','Fire Protection','Security','General Maintenance'].map(t => `<option ${job.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${['Pending','Scheduled','In Progress','On Hold','Completed','Invoiced'].map(s => `<option ${job.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${['Low','Medium','High','Urgent'].map(p => `<option ${job.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>
          ${!isEdit ? `
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-recurring" style="width:16px;height:16px" />
              <label class="form-label" style="margin:0" for="is-recurring">Recurring Job</label>
            </div>
          </div>
          <div class="form-row" id="recurring-options" style="display:none;background:var(--card-bg);padding:16px;border-radius:4px;border:1px solid var(--border-color);margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select class="form-select" id="recurring-freq">
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">First Job Date</label>
              <input type="date" class="form-input" id="recurring-start" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date (Max 50 occurrences)</label>
              <input type="date" class="form-input" id="recurring-end" />
            </div>
          </div>
          ` : ''}
          <div class="form-group">
            <label class="form-label">Site Address</label>
            <input class="form-input" name="siteAddress" value="${job.siteAddress || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${job.notes || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Job</button>
      </div>
    </div>
  `;

  if (!isEdit) {
    const isRecurring = container.querySelector('#is-recurring');
    const recurringOptions = container.querySelector('#recurring-options');
    isRecurring?.addEventListener('change', (e) => {
      recurringOptions.style.display = e.target.checked ? 'flex' : 'none';
    });
  }

  container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate(isEdit ? `/jobs/${id}` : '/jobs'));
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#job-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form));
    const cust = customers.find(c => c.id === data.customerId);
    data.customerName = cust?.company || '';
    data.contactName = cust ? `${cust.firstName} ${cust.lastName}` : '';
    data.number = job.number || `J-${Date.now().toString().slice(-6)}`;

    if (!isEdit) {
      data.technicians = [];
      data.laborCost = 0;
      data.materialCost = 0;
      data.estimatedHours = 0;
    }

    if (!isEdit && container.querySelector('#is-recurring')?.checked) {
      const freq = container.querySelector('#recurring-freq').value;
      const start = new Date(container.querySelector('#recurring-start').value);
      const end = new Date(container.querySelector('#recurring-end').value);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        showToast('Invalid recurring dates', 'error');
        return;
      }

      let current = new Date(start);
      let count = 0;
      let createdJobs = 0;
      const baseNum = Date.now().toString().slice(-6);

      while (current <= end && count < 50) {
        const jobData = { ...data };
        jobData.scheduledDate = current.toISOString().split('T')[0];
        jobData.number = `J-${baseNum}-${count+1}`;
        store.create('jobs', jobData);
        createdJobs++;
        
        if (freq === 'Daily') current.setDate(current.getDate() + 1);
        else if (freq === 'Weekly') current.setDate(current.getDate() + 7);
        else if (freq === 'Monthly') current.setMonth(current.getMonth() + 1);
        count++;
      }

      showToast(`Created ${createdJobs} recurring jobs`, 'success');
      router.navigate('/jobs');
    } else if (isEdit) {
      store.update('jobs', id, data);
      showToast('Job updated', 'success');
      router.navigate(`/jobs/${id}`);
    } else {
      const n = store.create('jobs', data);
      showToast('Job created', 'success');
      router.navigate(`/jobs/${n.id}`);
    }
  });
}

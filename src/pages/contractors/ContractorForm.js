import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderContractorForm(container, params) {
  const isNew = params.id === 'new';
  let contractor = isNew ? { active: true, hourlyRate: 85.00, afterHoursRate: 127.50, calloutFee: 90.00, specialties: [], complianceDocs: [] } : store.getById('contractors', params.id);

  if (!contractor && !isNew) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>${isNew ? 'New Contractor Profile' : 'Edit Contractor Profile'}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Profile</button>
      </div>
    </div>

    <div class="card" style="max-width: 700px; margin-bottom: var(--space-xl);">
      <div class="card-body">
        <form id="contractor-form" style="display: flex; flex-direction: column; gap: 18px;">
          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px;">Primary Contact Details</h4>
          
          <div class="form-group">
            <label class="form-label">Business Name *</label>
            <input type="text" id="businessName" class="form-input" value="${contractor.businessName || ''}" placeholder="e.g. Acme Plumbing Pty Ltd" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Primary Contact Person *</label>
            <input type="text" id="contactName" class="form-input" value="${contractor.contactName || ''}" placeholder="e.g. John Doe" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" value="${contractor.email || ''}" placeholder="e.g. office@acmeplumbing.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="phone" class="form-input" value="${contractor.phone || ''}" placeholder="e.g. 0412 345 678" />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">License & Specialties</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Trade License No.</label>
              <input type="text" id="licenseNumber" class="form-input" value="${contractor.licenseNumber || ''}" placeholder="e.g. LIC-PL-1190" />
            </div>
            <div class="form-group">
              <label class="form-label">Primary Insurance Expiry</label>
              <input type="date" id="insuranceExpiry" class="form-input" value="${contractor.insuranceExpiry || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Specialties / Trade Skills (comma-separated)</label>
            <input type="text" id="specialties" class="form-input" value="${(contractor.specialties || []).join(', ')}" placeholder="e.g. Gas Fitting, Excavation, Commercial Plumbing" />
            <p class="text-secondary" style="font-size:11px; margin: 3px 0 0 0;">Used to quickly search and filter subcontractors during dispatch.</p>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Subcontractor Charge Rates</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Std. Hourly Rate ($) *</label>
              <input type="number" id="hourlyRate" class="form-input" value="${contractor.hourlyRate !== undefined ? contractor.hourlyRate : 85.00}" step="0.5" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">After Hours Rate ($) *</label>
              <input type="number" id="afterHoursRate" class="form-input" value="${contractor.afterHoursRate !== undefined ? contractor.afterHoursRate : 127.50}" step="0.5" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Flat Call-out Fee ($) *</label>
              <input type="number" id="calloutFee" class="form-input" value="${contractor.calloutFee !== undefined ? contractor.calloutFee : 90.00}" step="0.5" min="0" required />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Administrative Information</h4>

          <div class="form-group">
            <label class="form-label">Internal Operations Notes</label>
            <textarea id="notes" class="form-input" rows="3" placeholder="Enter comments, standard response times, preferred technicians, or performance evaluations...">${contractor.notes || ''}</textarea>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
            <input type="checkbox" id="active" ${contractor.active ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
            <label for="active" style="margin: 0; cursor:pointer; font-weight:600;" class="form-label">Active & Dispatch-Ready</label>
          </div>
        </form>
      </div>
    </div>
  `;

  container.querySelector('#btn-cancel').addEventListener('click', () => {
    router.navigate(isNew ? '/contractors' : `/contractors/${params.id}`);
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    const businessName = container.querySelector('#businessName').value.trim();
    const contactName = container.querySelector('#contactName').value.trim();
    const email = container.querySelector('#email').value.trim();
    const phone = container.querySelector('#phone').value.trim();
    const licenseNumber = container.querySelector('#licenseNumber').value.trim();
    const insuranceExpiry = container.querySelector('#insuranceExpiry').value;
    const active = container.querySelector('#active').checked;
    
    const hourlyRate = parseFloat(container.querySelector('#hourlyRate').value);
    const afterHoursRate = parseFloat(container.querySelector('#afterHoursRate').value);
    const calloutFee = parseFloat(container.querySelector('#calloutFee').value);
    
    const specialtiesVal = container.querySelector('#specialties').value;
    const specialties = specialtiesVal 
      ? specialtiesVal.split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    const notes = container.querySelector('#notes').value.trim();

    if (!businessName || !contactName) {
      showToast('Business Name and Contact Name are required fields.', 'warning');
      return;
    }

    if (isNaN(hourlyRate) || isNaN(afterHoursRate) || isNaN(calloutFee)) {
      showToast('Please enter valid numeric pay rates.', 'warning');
      return;
    }

    const data = {
      businessName,
      contactName,
      email,
      phone,
      licenseNumber,
      insuranceExpiry,
      active,
      hourlyRate,
      afterHoursRate,
      calloutFee,
      specialties,
      notes,
      complianceDocs: contractor.complianceDocs || []
    };

    // If they updated the primary insurance date, also sync it in complianceDocs
    if (insuranceExpiry) {
      if (!data.complianceDocs) data.complianceDocs = [];
      const plIndex = data.complianceDocs.findIndex(d => d.type.toLowerCase().includes('public liability'));
      if (plIndex !== -1) {
        data.complianceDocs[plIndex].expiryDate = insuranceExpiry;
        data.complianceDocs[plIndex].number = licenseNumber ? `PL-${licenseNumber}` : data.complianceDocs[plIndex].number;
      } else {
        data.complianceDocs.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          type: 'Public Liability Insurance',
          number: licenseNumber ? `PL-${licenseNumber}` : 'PL-AUTO',
          expiryDate: insuranceExpiry,
          verified: true,
          notes: 'Auto-synced from primary details'
        });
      }
    }

    if (isNew) {
      const created = store.create('contractors', data);
      showToast('Contractor profile created successfully', 'success');
      router.navigate(`/contractors/${created.id}`);
    } else {
      store.update('contractors', params.id, data);
      showToast('Contractor profile updated successfully', 'success');
      router.navigate(`/contractors/${params.id}`);
    }
  });
}

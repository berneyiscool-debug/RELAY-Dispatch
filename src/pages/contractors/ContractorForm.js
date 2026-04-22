import { store } from '../../data/store.js';
import { router } from '../../router.js';

export function renderContractorForm(container, params) {
  const isNew = params.id === 'new';
  let contractor = isNew ? { active: true } : store.getById('contractors', params.id);

  if (!contractor && !isNew) {
    container.innerHTML = `<div class="card"><p>Contractor not found.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1>${isNew ? 'New Contractor' : 'Edit Contractor'}</h1>
      <div>
        <button class="btn btn-outline" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save">Save</button>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <form id="contractor-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label>Business Name</label>
          <input type="text" id="businessName" class="form-control" value="${contractor.businessName || ''}" required />
        </div>
        <div class="form-group">
          <label>Contact Name</label>
          <input type="text" id="contactName" class="form-control" value="${contractor.contactName || ''}" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" class="form-control" value="${contractor.email || ''}" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="phone" class="form-control" value="${contractor.phone || ''}" />
        </div>
        <div class="form-group">
          <label>License Number</label>
          <input type="text" id="licenseNumber" class="form-control" value="${contractor.licenseNumber || ''}" />
        </div>
        <div class="form-group">
          <label>Insurance Expiry</label>
          <input type="date" id="insuranceExpiry" class="form-control" value="${contractor.insuranceExpiry || ''}" />
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" id="active" ${contractor.active ? 'checked' : ''} />
          <label for="active" style="margin: 0;">Active</label>
        </div>
      </form>
    </div>
  `;

  container.querySelector('#btn-cancel').addEventListener('click', () => {
    router.navigate(isNew ? '/contractors' : `/contractors/${params.id}`);
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    const data = {
      businessName: container.querySelector('#businessName').value,
      contactName: container.querySelector('#contactName').value,
      email: container.querySelector('#email').value,
      phone: container.querySelector('#phone').value,
      licenseNumber: container.querySelector('#licenseNumber').value,
      insuranceExpiry: container.querySelector('#insuranceExpiry').value,
      active: container.querySelector('#active').checked
    };

    if (!data.businessName || !data.contactName) {
      alert('Business Name and Contact Name are required.');
      return;
    }

    if (isNew) {
      store.create('contractors', data);
    } else {
      store.update('contractors', params.id, data);
    }

    router.navigate('/contractors');
  });
}

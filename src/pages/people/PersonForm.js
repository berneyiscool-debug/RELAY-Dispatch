// ============================================
// SIMPRO CLONE — PERSON FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderPersonForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const person = isEdit ? store.getById('customers', id) : {};
  const isIndividual = person.type === 'Individual';

  container.innerHTML = `
    <div class="page-header">
      <h1>${isEdit ? 'Edit Customer' : 'New Customer'}</h1>
    </div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="person-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" id="company-label">Company Name ${isIndividual ? '' : '*'}</label>
              <input class="form-input" name="company" value="${person.company || ''}" ${isIndividual ? '' : 'required'} />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                <option value="Company" ${person.type === 'Company' ? 'selected' : ''}>Company</option>
                <option value="Individual" ${isIndividual ? 'selected' : ''}>Individual</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" id="first-name-label">First Name ${isIndividual ? '*' : ''}</label>
              <input class="form-input" name="firstName" value="${person.firstName || ''}" ${isIndividual ? 'required' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label" id="last-name-label">Last Name ${isIndividual ? '*' : ''}</label>
              <input class="form-input" name="lastName" value="${person.lastName || ''}" ${isIndividual ? 'required' : ''} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" name="email" value="${person.email || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" name="phone" value="${person.phone || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" name="address" value="${person.address || ''}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                <option value="Active" ${person.status === 'Active' || !isEdit ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${person.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${person.notes || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save">
          <span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Customer
        </button>
      </div>
    </div>
  `;

  const typeSelect = container.querySelector('[name="type"]');
  const companyInput = container.querySelector('[name="company"]');
  const companyLabel = container.querySelector('#company-label');
  const firstNameInput = container.querySelector('[name="firstName"]');
  const firstNameLabel = container.querySelector('#first-name-label');
  const lastNameInput = container.querySelector('[name="lastName"]');
  const lastNameLabel = container.querySelector('#last-name-label');

  if (typeSelect && companyInput && companyLabel && firstNameInput && firstNameLabel && lastNameInput && lastNameLabel) {
    typeSelect.addEventListener('change', (e) => {
      const isIndiv = e.target.value === 'Individual';
      if (isIndiv) {
        companyInput.removeAttribute('required');
        companyLabel.textContent = 'Company Name';

        firstNameInput.setAttribute('required', 'required');
        firstNameLabel.textContent = 'First Name *';

        lastNameInput.setAttribute('required', 'required');
        lastNameLabel.textContent = 'Last Name *';
      } else {
        companyInput.setAttribute('required', 'required');
        companyLabel.textContent = 'Company Name *';

        firstNameInput.removeAttribute('required');
        firstNameLabel.textContent = 'First Name';

        lastNameInput.removeAttribute('required');
        lastNameLabel.textContent = 'Last Name';
      }
    });
  }

  container.querySelector('#btn-cancel').addEventListener('click', () => {
    router.navigate(isEdit ? `/people/${id}` : '/people');
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#person-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (isEdit) {
      store.update('customers', id, data);
      showToast('Customer updated successfully', 'success');
      router.navigate(`/people/${id}`);
    } else {
      const newPerson = store.create('customers', data);
      showToast('Customer created successfully', 'success');
      router.navigate(`/people/${newPerson.id}`);
    }
  });
}

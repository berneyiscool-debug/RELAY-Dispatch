// ============================================
// RELAY DISPATCH — PERSON FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { attachAddressAutocomplete } from '../../utils/placesAutocomplete.js';
import { escapeHTML } from '../../utils/security.js';
import { PAYMENT_TERMS_PRESETS, paymentTermsDaysFromInput } from '../../utils/customerTerms.js';

export function renderPersonForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const person = isEdit ? store.getById('customers', id) : {};
  const isIndividual = person.type === 'Individual';

  // Payment terms are stored as a number of days; the select offers the presets
  // and falls back to a free number when the saved value is anything else.
  const savedDays = paymentTermsDaysFromInput(person.paymentTermsDays);
  const termsPreset = savedDays === null
    ? ''
    : (PAYMENT_TERMS_PRESETS.some(t => t.days === savedDays) ? String(savedDays) : 'custom');
  const customDays = termsPreset === 'custom' ? savedDays : '';
  const creditLimitValue = Number(person.creditLimit) > 0 ? Number(person.creditLimit) : '';

  container.innerHTML = `
    <div class="page-header">
      <h1>${isEdit ? 'Edit Customer' : 'New Customer'}</h1>
    </div>
    <div class="card">
      <div class="card-body">
        <form id="person-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" id="company-label">Company Name ${isIndividual ? '' : '*'}</label>
              <input class="form-input" name="company" value="${escapeHTML(person.company || '')}" ${isIndividual ? '' : 'required'} />
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
              <input class="form-input" name="firstName" value="${escapeHTML(person.firstName || '')}" ${isIndividual ? 'required' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label" id="last-name-label">Last Name ${isIndividual ? '*' : ''}</label>
              <input class="form-input" name="lastName" value="${escapeHTML(person.lastName || '')}" ${isIndividual ? 'required' : ''} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" name="email" value="${escapeHTML(person.email || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" name="phone" value="${escapeHTML(person.phone || '')}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" name="address" value="${escapeHTML(person.address || '')}" />
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
          <h4 style="margin:var(--space-lg) 0 var(--space-base)">Payment &amp; Credit</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select class="form-select" name="paymentTermsPreset" id="payment-terms-preset">
                <option value="" ${termsPreset === '' ? 'selected' : ''}>Default (30 Days)</option>
                ${PAYMENT_TERMS_PRESETS.map(t => `<option value="${t.days}" ${termsPreset === String(t.days) ? 'selected' : ''}>${escapeHTML(t.label)}</option>`).join('')}
                <option value="custom" ${termsPreset === 'custom' ? 'selected' : ''}>Custom…</option>
              </select>
              <p class="text-tertiary" style="margin-top:6px">Sets the due date on new invoices. Default is 30 days.</p>
            </div>
            <div class="form-group" id="payment-terms-custom-group" style="display:${termsPreset === 'custom' ? 'block' : 'none'}">
              <label class="form-label">Custom Terms (days)</label>
              <input class="form-input" type="number" min="0" step="1" name="paymentTermsCustom" id="payment-terms-custom" value="${customDays}" placeholder="21" />
            </div>
            <div class="form-group">
              <label class="form-label">Credit Limit</label>
              <input class="form-input" type="number" min="0" step="0.01" name="creditLimit" id="credit-limit" value="${creditLimitValue}" placeholder="No limit" />
              <p class="text-tertiary" style="margin-top:6px">Warns when a new invoice takes their unpaid balance over this. Leave blank for no limit.</p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${escapeHTML(person.notes || '')}</textarea>
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

  // Address autocomplete. Enabled whenever a Google Maps key is available
  // (cloud bundled key or a user-entered key in Settings), otherwise it no-ops.
  attachAddressAutocomplete(container.querySelector('[name="address"]'));

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

  // The custom-days field only appears when "Custom…" is chosen.
  const termsSelect = container.querySelector('#payment-terms-preset');
  const customGroup = container.querySelector('#payment-terms-custom-group');
  if (termsSelect && customGroup) {
    termsSelect.addEventListener('change', () => {
      const isCustom = termsSelect.value === 'custom';
      customGroup.style.display = isCustom ? 'block' : 'none';
      if (isCustom) container.querySelector('#payment-terms-custom')?.focus();
    });
  }

  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#person-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Terms and limit are controls of their own, not plain form fields: the
    // preset select and its custom-days companion collapse into one number, and
    // a blank limit is "no limit" rather than 0.
    const termsChoice = termsSelect ? termsSelect.value : '';
    const customValue = container.querySelector('#payment-terms-custom')?.value;
    data.paymentTermsDays = termsChoice === 'custom'
      ? (String(customValue ?? '').trim() === '' ? null : Number(customValue))
      : (termsChoice === '' ? null : Number(termsChoice));
    delete data.paymentTermsPreset;
    delete data.paymentTermsCustom;

    const limitText = String(container.querySelector('#credit-limit')?.value ?? '').trim();
    data.creditLimit = limitText === '' ? null : Number(limitText);

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

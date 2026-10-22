// ============================================
// RELAY — QUICK-CREATE CUSTOMER
// ============================================
// A short customer form in a modal, for the moment someone is halfway through
// another form (a job, for example) and realises the customer doesn't exist yet.
// Just the basics — who they are and how to reach them — so they can carry on;
// sites, contacts and the rest are added on the customer's page later.

import { store } from '../data/store.js';
import { showModal } from './Modal.js';
import { showToast } from './Notifications.js';
import { escapeHTML } from '../utils/security.js';
import { attachAddressAutocomplete } from '../utils/placesAutocomplete.js';
import { guessCustomerType } from '../actions/customers.js';
import { hasPermission } from '../utils/permissions.js';

/** Value of the "+ New customer" option in a customer dropdown. */
export const NEW_CUSTOMER_VALUE = '__new_customer__';

/**
 * The "+ New customer" option for a customer <select>, or '' for someone who can't
 * create customers. Put it last: typed matches then come first, and Enter on a name
 * that matches nobody lands on it (see data-always-show in utils/searchableSelect.js).
 */
export function newCustomerOptionHtml() {
  return hasPermission('Customers', 'create')
    ? `<option value="${NEW_CUSTOMER_VALUE}" data-always-show="true">+ New customer</option>`
    : '';
}

/**
 * Make a customer <select>'s "+ New customer" option open the quick-create modal.
 *
 * The pick is caught before the form's own change listeners (a capturing listener
 * runs first at the target, and the event goes no further), so they never see the
 * placeholder value. Once the modal is done, a normal change fires with a real
 * customer: the new one, or the previous choice on cancel. Each form's existing
 * customer logic therefore runs unchanged.
 *
 * @param {HTMLSelectElement} select
 * @param {{customers?: object[], onCreated?: (customer: object) => void}} [opts]
 *   `customers` is the form's own list, kept in step so a re-render lists the new one.
 */
export function wireNewCustomerOption(select, { customers, onCreated } = {}) {
  if (!select || select._newCustomerWired) return;
  select._newCustomerWired = true;
  let previous = select.value === NEW_CUSTOMER_VALUE ? '' : select.value;

  const choose = (id) => {
    select.value = id;
    previous = id;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  select.addEventListener('change', (e) => {
    if (select.value !== NEW_CUSTOMER_VALUE) {
      previous = select.value;
      return;
    }
    e.stopImmediatePropagation();
    e.stopPropagation();
    openQuickCustomerModal({
      name: select.dataset.searchQuery || '',
      onCreated: (customer) => {
        if (Array.isArray(customers) && !customers.some(c => c.id === customer.id)) customers.push(customer);
        if (!select.querySelector(`option[value="${CSS.escape(String(customer.id))}"]`)) {
          const opt = document.createElement('option');
          opt.value = customer.id;
          opt.textContent = customerDisplayName(customer);
          select.insertBefore(opt, select.querySelector(`option[value="${NEW_CUSTOMER_VALUE}"]`));
        }
        choose(customer.id);
        if (onCreated) onCreated(customer);
      },
      onCancel: () => choose(previous),
    });
  }, true);
}

/** The name a customer is listed under, as the customer dropdowns show it. */
export function customerDisplayName(c) {
  return (c && (c.company || `${c.firstName || ''} ${c.lastName || ''}`.trim())) || 'Unnamed Customer';
}

/**
 * Open the quick-create modal.
 * @param {object} [opts]
 * @param {string} [opts.name] what the user had typed, used to prefill the name
 * @param {(customer: object) => void} [opts.onCreated] called with the new customer
 * @param {() => void} [opts.onCancel] called when the modal closes without one
 */
export function openQuickCustomerModal({ name = '', onCreated, onCancel } = {}) {
  const typed = String(name || '').trim();
  let type = typed ? guessCustomerType(typed) : 'Company';
  const [first, ...rest] = typed.split(/\s+/);

  const content = document.createElement('div');
  content.className = 'quick-customer';
  content.innerHTML = `
    <div class="segmented quick-customer-type" role="group" aria-label="Customer type">
      <button type="button" class="segmented-item" data-type="Company">Company</button>
      <button type="button" class="segmented-item" data-type="Individual">Individual</button>
    </div>
    <div class="form-group qc-company">
      <label class="form-label" for="qc-company">Company name *</label>
      <input class="form-input" id="qc-company" autocomplete="organization" value="${escapeHTML(type === 'Company' ? typed : '')}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="qc-first" id="qc-first-label">First name</label>
        <input class="form-input" id="qc-first" autocomplete="given-name" value="${escapeHTML(type === 'Individual' ? first || '' : '')}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="qc-last" id="qc-last-label">Last name</label>
        <input class="form-input" id="qc-last" autocomplete="family-name" value="${escapeHTML(type === 'Individual' ? rest.join(' ') : '')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="qc-phone">Phone</label>
        <input class="form-input" id="qc-phone" type="tel" autocomplete="tel" />
      </div>
      <div class="form-group">
        <label class="form-label" for="qc-email">Email</label>
        <input class="form-input" id="qc-email" type="email" autocomplete="email" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="qc-address">Address</label>
      <input class="form-input" id="qc-address" autocomplete="off" placeholder="Start typing to search addresses" />
    </div>
    <p class="text-secondary quick-customer-hint">Sites, extra contacts and notes can be added on the customer's page later.</p>
    <p class="quick-customer-dupe" hidden></p>
  `;

  const q = (sel) => content.querySelector(sel);
  const companyGroup = q('.qc-company');
  const firstLabel = q('#qc-first-label');
  const lastLabel = q('#qc-last-label');

  // A company needs its name; an individual needs a first and last name instead.
  const setType = (next) => {
    type = next;
    content.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type === type));
    companyGroup.hidden = type !== 'Company';
    firstLabel.textContent = type === 'Individual' ? 'First name *' : 'Contact first name';
    lastLabel.textContent = type === 'Individual' ? 'Last name *' : 'Contact last name';
    checkDuplicate();
  };

  // Name the customer the way the dropdowns list them, and flag an existing match:
  // the point of the shortcut is speed, not a second copy of someone already there.
  const pendingName = () => (type === 'Company'
    ? q('#qc-company').value.trim()
    : `${q('#qc-first').value.trim()} ${q('#qc-last').value.trim()}`.trim());
  const checkDuplicate = () => {
    const n = pendingName().toLowerCase();
    const match = n && (store.getAll('customers') || []).find(c => customerDisplayName(c).toLowerCase() === n);
    const note = q('.quick-customer-dupe');
    note.hidden = !match;
    if (match) {
      note.innerHTML = `${escapeHTML(customerDisplayName(match))} is already a customer. <button type="button" class="btn btn-ghost btn-sm" data-use-existing="${escapeHTML(String(match.id))}">Use them</button>`;
    }
  };

  content.addEventListener('click', (e) => {
    const typeBtn = e.target.closest('[data-type]');
    if (typeBtn) { setType(typeBtn.dataset.type); return; }
    const useBtn = e.target.closest('[data-use-existing]');
    if (useBtn) {
      const existing = store.getById('customers', useBtn.dataset.useExisting);
      created = true; // not a cancel
      modal.close();
      if (existing && onCreated) onCreated(existing);
    }
  });
  content.addEventListener('input', (e) => {
    if (e.target.matches('#qc-company, #qc-first, #qc-last')) checkDuplicate();
  });

  let created = false;
  const save = (close) => {
    const company = q('#qc-company').value.trim();
    const firstName = q('#qc-first').value.trim();
    const lastName = q('#qc-last').value.trim();
    if (type === 'Company' && !company) { showToast('Enter the company name.', 'error'); q('#qc-company').focus(); return; }
    if (type === 'Individual' && (!firstName || !lastName)) {
      showToast('Enter a first and last name.', 'error');
      q(firstName ? '#qc-last' : '#qc-first').focus();
      return;
    }
    const email = q('#qc-email').value.trim();
    if (email && !q('#qc-email').checkValidity()) { showToast('Check the email address.', 'error'); q('#qc-email').focus(); return; }

    const customer = store.create('customers', {
      type,
      status: 'Active',
      company: type === 'Company' ? company : '',
      firstName,
      lastName,
      phone: q('#qc-phone').value.trim(),
      email,
      address: q('#qc-address').value.trim(),
    });
    created = true;
    showToast(`${customerDisplayName(customer)} added`, 'success');
    close();
    if (onCreated) onCreated(customer);
  };

  const modal = showModal({
    title: 'New customer',
    content,
    onClose: () => { if (!created && onCancel) onCancel(); },
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      { label: 'Add customer', className: 'btn-primary', onClick: c => save(c) },
    ],
  });

  // Enter in any field saves, so the whole thing can be done from the keyboard. The
  // address field is the exception: there Enter picks an address suggestion.
  content.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input') && e.target.id !== 'qc-address') {
      e.preventDefault();
      save(modal.close);
    }
  });

  attachAddressAutocomplete(q('#qc-address'));
  setType(type);
  setTimeout(() => q(type === 'Company' ? '#qc-company' : (first ? '#qc-last' : '#qc-first')).focus(), 0);
  return modal;
}

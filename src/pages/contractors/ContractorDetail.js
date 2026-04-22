import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderContractorDetail(container, params) {
  const contractor = store.getById('contractors', params.id);
  if (!contractor) {
    container.innerHTML = `<div class="card"><p>Contractor not found.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h1 style="margin: 0;">${escapeHTML(contractor.businessName)}</h1>
        <p style="margin: 5px 0 0 0; color: var(--text-secondary);">Contact: ${escapeHTML(contractor.contactName)}</p>
      </div>
      <button class="btn btn-outline" id="btn-edit">Edit</button>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div><strong>Email:</strong> ${escapeHTML(contractor.email || '-')}</div>
        <div><strong>Phone:</strong> ${escapeHTML(contractor.phone || '-')}</div>
        <div><strong>License:</strong> ${escapeHTML(contractor.licenseNumber || '-')}</div>
        <div><strong>Insurance Expiry:</strong> ${escapeHTML(contractor.insuranceExpiry || '-')}</div>
        <div><strong>Status:</strong> <span class="badge ${contractor.active ? 'badge-success' : 'badge-neutral'}">${contractor.active ? 'Active' : 'Inactive'}</span></div>
      </div>
    </div>
  `;

  container.querySelector('#btn-edit').addEventListener('click', () => {
    router.navigate(`/contractors/${params.id}/edit`);
  });
}

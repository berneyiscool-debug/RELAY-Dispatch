import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderContractorDetail(container, params) {
  const contractor = store.getById('contractors', params.id);
  if (!contractor) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1 style="margin: 0;">${escapeHTML(contractor.businessName)}</h1>
        <p class="text-secondary" style="margin: 5px 0 0 0;">Contact: ${escapeHTML(contractor.contactName)}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-edit"><span class="material-icons-outlined">edit</span> Edit</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 style="margin: 0;">Details</h4>
      </div>
      <div class="card-body">
        <div class="grid-2">
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Email</strong> ${escapeHTML(contractor.email || '—')}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Phone</strong> ${escapeHTML(contractor.phone || '—')}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">License</strong> ${escapeHTML(contractor.licenseNumber || '—')}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Insurance Expiry</strong> ${escapeHTML(contractor.insuranceExpiry || '—')}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Status</strong> <span class="badge ${contractor.active ? 'badge-success' : 'badge-neutral'}">${contractor.active ? 'Active' : 'Inactive'}</span></div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-edit').addEventListener('click', () => {
    router.navigate(`/contractors/${params.id}/edit`);
  });
}

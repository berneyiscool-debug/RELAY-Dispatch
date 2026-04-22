import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderContractorsList(container) {
  const contractors = store.getAll('contractors');

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1>Contractors</h1>
      <button class="btn btn-primary" id="btn-new-contractor">Add Contractor</button>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Contact Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${contractors.length === 0 ? `<tr><td colspan="6" class="text-center">No contractors found.</td></tr>` :
              contractors.map(c => `
                <tr class="contractor-row" data-id="${c.id}" style="cursor: pointer;">
                  <td>${escapeHTML(c.businessName)}</td>
                  <td>${escapeHTML(c.contactName)}</td>
                  <td>${escapeHTML(c.email || '-')}</td>
                  <td>${escapeHTML(c.phone || '-')}</td>
                  <td><span class="badge ${c.active ? 'badge-success' : 'badge-neutral'}">${c.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${c.id}">Edit</button>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelectorAll('.contractor-row').forEach(row => {
    row.addEventListener('click', () => {
      router.navigate(`/contractors/${row.dataset.id}`);
    });
  });

  container.querySelectorAll('.contractor-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      router.navigate(`/contractors/${btn.dataset.id}/edit`);
    });
  });

  container.querySelector('#btn-new-contractor').addEventListener('click', () => {
    router.navigate('/contractors/new');
  });
}

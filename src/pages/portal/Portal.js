import { store } from '../../data/store.js';

export function renderCustomerPortal(container) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const customerId = currentUser.customerId;

  // If somehow not a customer, show an error
  if (currentUser.role !== 'customer' || !customerId) {
    container.innerHTML = `<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>`;
    return;
  }

  const jobs = store.getAll('jobs').filter(j => j.customerId === customerId);
  const quotes = store.getAll('quotes').filter(q => q.customerId === customerId);
  const invoices = store.getAll('invoices').filter(i => i.customerId === customerId);

  container.innerHTML = `
    <div class="page-header" style="background:var(--bg-surface); padding:20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1 style="margin:0;">Customer Portal</h1>
        <p style="margin:5px 0 0 0; color:var(--text-secondary);">Welcome back, ${currentUser.name}</p>
      </div>
      <button class="btn btn-outline" id="portal-logout-btn">Log Out</button>
    </div>

    <div class="page-content" style="padding:20px; max-width:1200px; margin:0 auto;">

      <!-- Quotes Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Quotes</h2>
        ${quotes.length === 0 ? '<p style="color:var(--text-tertiary);">No quotes found.</p>' : `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${quotes.map(q => `
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${q.number} - ${q.title || 'Quote'}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(q.total || 0).toFixed(2)} | Status: <span class="badge ${q.status === 'Approved' ? 'badge-success' : 'badge-neutral'}">${q.status}</span></div>
                </div>
                <div>
                  ${q.status !== 'Approved' ? `<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${q.id}">Approve</button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Jobs Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Jobs</h2>
        ${jobs.length === 0 ? '<p style="color:var(--text-tertiary);">No jobs found.</p>' : `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${jobs.map(j => `
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${j.number} - ${j.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${j.status}</span></div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Invoices Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Invoices</h2>
        ${invoices.length === 0 ? '<p style="color:var(--text-tertiary);">No invoices found.</p>' : `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${invoices.map(i => `
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${i.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(i.total || 0).toFixed(2)} | Status: <span class="badge ${i.status === 'Paid' ? 'badge-success' : 'badge-danger'}">${i.status}</span></div>
                </div>
                <div>
                  ${i.status !== 'Paid' ? `<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${i.id}">Pay Now</button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

    </div>
  `;

  // Attach event listeners
  const logoutBtn = container.querySelector('#portal-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      // Import router dynamically or rely on the fact it's a module
      import('../../router.js').then(({ router }) => {
        router.navigate('/login');
      });
    });
  }

  const approveBtns = container.querySelectorAll('.btn-approve-quote');
  approveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      store.update('quotes', id, { status: 'Approved' });
      alert('Quote approved successfully!');
      renderCustomerPortal(container);
    });
  });

  const payBtns = container.querySelectorAll('.btn-pay-invoice');
  payBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      store.update('invoices', id, { status: 'Paid' });
      alert('Invoice paid successfully!');
      renderCustomerPortal(container);
    });
  });
}

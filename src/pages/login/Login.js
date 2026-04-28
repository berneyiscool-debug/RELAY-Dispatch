import { router } from '../../router.js';
import { store } from '../../data/store.js';

export function renderLogin(container) {
  // We need to hide the sidebar and topbar when on login
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');

  if (sidebar) sidebar.style.display = 'none';
  if (topbar) topbar.style.display = 'none';
  if (breadcrumb) breadcrumb.style.display = 'none';

  const techs = store.getAll('technicians').filter(t => !t.deactivated);
  const userTypes = store.getAll('userTypes');

  container.innerHTML = `
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">Simpro Clone</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${techs.map(t => {
            const ut = userTypes.find(u => u.id === t.userTypeId);
            return `<button class="btn btn-secondary btn-login-user" data-id="${t.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${t.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${ut ? ut.name : 'Unassigned'}</span>
            </button>`;
          }).join('')}
          ${techs.length === 0 ? '<p class="text-secondary">No users found. Please seed data.</p>' : ''}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;

  const loginAsUser = (techId) => {
    const t = techs.find(x => x.id === techId);
    const ut = userTypes.find(u => u.id === t?.userTypeId);
    
    let role = 'technician';
    if (ut && ut.name.toLowerCase().includes('admin')) role = 'admin';
    else if (ut && ut.name.toLowerCase().includes('manager')) role = 'manager';

    const user = {
      id: t.id,
      name: t.name,
      role: role,
      userTypeId: t.userTypeId,
      color: t.color
    };

    sessionStorage.setItem('currentUser', JSON.stringify(user));

    if (sidebar) sidebar.style.display = '';
    if (topbar) topbar.style.display = '';
    if (breadcrumb) breadcrumb.style.display = '';

    import('../../components/Sidebar.js').then(({ updateSidebarAccess }) => {
      if (updateSidebarAccess) updateSidebarAccess();
    });

    import('../../components/TopBar.js').then(({ updateTopbarAccess }) => {
      if (updateTopbarAccess) updateTopbarAccess();
    });

    router.navigate('/');
  };

  container.querySelectorAll('.btn-login-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
       const btnEl = e.target.closest('.btn-login-user');
       loginAsUser(btnEl.dataset.id);
    });
  });

  const loginAsCustomer = () => {
    const user = {
      id: 'customer-user',
      name: 'Customer User',
      role: 'customer'
    };
    const customers = store.get('people').filter(p => p.type === 'Customer');
    if (customers.length > 0) {
      user.customerId = customers[0].id;
      user.name = customers[0].firstName + ' ' + customers[0].lastName;
    }
    sessionStorage.setItem('currentUser', JSON.stringify(user));

    if (sidebar) sidebar.style.display = '';
    if (topbar) topbar.style.display = '';
    if (breadcrumb) breadcrumb.style.display = '';

    import('../../components/Sidebar.js').then(({ updateSidebarAccess }) => {
      if (updateSidebarAccess) updateSidebarAccess();
    });
    import('../../components/TopBar.js').then(({ updateTopbarAccess }) => {
      if (updateTopbarAccess) updateTopbarAccess();
    });
    router.navigate('/portal');
  };

  container.querySelector('#btn-login-customer')?.addEventListener('click', loginAsCustomer);
}

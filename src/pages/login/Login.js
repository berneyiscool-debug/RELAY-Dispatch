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

  container.innerHTML = `
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">Simpro Clone</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a role to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          <button class="btn btn-primary" id="btn-login-admin" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Admin</button>
          <button class="btn btn-secondary" id="btn-login-manager" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Manager</button>
          <button class="btn btn-secondary" id="btn-login-tech" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Technician</button>
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;

  const loginAs = (role) => {
    const user = {
      id: role + '-user',
      name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
      role: role,
      permissions: role === 'admin' ? ['stock_maintenance'] : [] // Example for future step
    };

    // Check if we have customer seeded data, if customer login pick first customer
    if (role === 'customer') {
      const customers = store.get('people').filter(p => p.type === 'Customer');
      if (customers.length > 0) {
        user.customerId = customers[0].id;
        user.name = customers[0].firstName + ' ' + customers[0].lastName;
      }
    }

    sessionStorage.setItem('currentUser', JSON.stringify(user));

    // Restore shell UI elements
    if (sidebar) sidebar.style.display = '';
    if (topbar) topbar.style.display = '';
    if (breadcrumb) breadcrumb.style.display = '';

    // Update sidebar access visually
    import('../../components/Sidebar.js').then(({ updateSidebarAccess }) => {
      if (updateSidebarAccess) updateSidebarAccess();
    });

    // Update topbar access visually
    import('../../components/TopBar.js').then(({ updateTopbarAccess }) => {
      if (updateTopbarAccess) updateTopbarAccess();
    });

    if (role === 'customer') {
      router.navigate('/portal');
    } else {
      router.navigate('/');
    }
  };

  container.querySelector('#btn-login-admin').addEventListener('click', () => loginAs('admin'));
  container.querySelector('#btn-login-manager').addEventListener('click', () => loginAs('manager'));
  container.querySelector('#btn-login-tech').addEventListener('click', () => loginAs('technician'));
  container.querySelector('#btn-login-customer').addEventListener('click', () => loginAs('customer'));
}

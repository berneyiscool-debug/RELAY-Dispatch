import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';

// Ordered list of routes to try — first permitted one wins
const ROUTE_PRIORITY = [
  { path: '/',               module: 'Dashboard' },
  { path: '/schedule',       module: 'Schedule' },
  { path: '/jobs',           module: 'Jobs' },
  { path: '/quotes',         module: 'Quotes' },
  { path: '/leads',          module: 'Leads' },
  { path: '/timesheets',     module: 'Timesheets' },
  { path: '/invoices',       module: 'Invoices' },
  { path: '/people',         module: 'Customers' },
  { path: '/stock',          module: 'Stock' },
  { path: '/purchase-orders',module: 'Purchase Orders' },
  { path: '/reports',        module: 'Reports' },
  { path: '/contractors',    module: 'Contractors' },
  { path: '/assets',          module: 'Assets' },
  { path: '/documents',      module: 'Documents' },
  { path: '/settings',       module: 'Settings' },
];

function getLandingRoute(user, dataStore) {
  // Admins and managers always go to Dashboard
  if (user.role === 'admin' || user.role === 'manager') return '/';

  // No userType assigned — fall back to schedule (safe default for technicians)
  if (!user.userTypeId) return '/schedule';

  const ut = dataStore.getById('userTypes', user.userTypeId);
  if (!ut || !ut.permissions) return '/schedule';

  for (const { path, module: mod } of ROUTE_PRIORITY) {
    const perm = ut.permissions.find(p => p.module === mod);
    if (perm && (perm.view || perm.create || perm.edit || perm.delete)) {
      return path;
    }
  }

  return '/schedule';
}

export function renderLogin(container) {
  // Always display login in light mode by removing data-theme
  document.documentElement.removeAttribute('data-theme');

  // Hide the sidebar, topbar, and breadcrumbs when on login
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');

  if (sidebar) sidebar.style.display = 'none';
  if (topbar) topbar.style.display = 'none';
  if (breadcrumb) breadcrumb.style.display = 'none';

  let currentView = 'signin'; // 'signin' or 'signup'

  const render = () => {
    container.innerHTML = `
      <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; font-family: 'Inter', sans-serif;">
        <div class="login-box" style="background: #1e293b; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 100%; max-width: 440px; text-align: center; color: #f8fafc;">
          
          <!-- Logo & Brand Header -->
          <div style="margin-bottom: 25px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #3b82f6; border-radius: 8px; margin-bottom: 12px;">
              <span class="material-icons-outlined" style="font-size: 28px; color: white;">engineering</span>
            </div>
            <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #f8fafc; letter-spacing: -0.025em;">FieldForge</h1>
            <p style="font-size: 14px; color: #94a3b8; margin: 4px 0 0 0;">Dispatch & Field Service Management Platform</p>
          </div>

          <!-- Error Alert Panel -->
          <div id="login-error" style="display: none; background: #ef44441a; border: 1px solid #ef44444d; padding: 12px; border-radius: 6px; color: #fca5a5; font-size: 14px; text-align: left; margin-bottom: 20px;"></div>

          <!-- Form Area -->
          <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
            ${currentView === 'signin' ? `
              <!-- Sign In View -->
              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Email Address</label>
                <input type="email" id="auth-email" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="name@company.com" required>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Password</label>
                <input type="password" id="auth-password" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="••••••••" required>
              </div>

              <button type="submit" id="btn-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:16px; justify-content:center; background:#3b82f6; border:none; margin-top:8px;">
                Sign In
              </button>
            ` : `
              <!-- Sign Up (New Company Creation) View -->
              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Company Name</label>
                <input type="text" id="signup-company" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="Acme Electrical Services" required>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Your Name (Administrator)</label>
                <input type="text" id="signup-name" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="John Doe" required>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Phone Number</label>
                <input type="text" id="signup-phone" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="0412 345 678" required>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Email Address</label>
                <input type="email" id="auth-email" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="admin@company.com" required>
              </div>

              <div>
                <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">Password</label>
                <input type="password" id="auth-password" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#f8fafc; font-size:15px; outline:none;" placeholder="Min. 6 characters" required>
              </div>

              <button type="submit" id="btn-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:16px; justify-content:center; background:#10b981; border:none; margin-top:8px;">
                Create Company & Admin Account
              </button>
            `}
          </form>

          <!-- Toggle View Button -->
          <div style="margin-top: 24px; font-size: 14px; color: #94a3b8;">
            ${currentView === 'signin' ? `
              Don't have a company account? 
              <a href="#" id="toggle-view" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Sign up your company</a>
            ` : `
              Already registered? 
              <a href="#" id="toggle-view" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Sign in to your company</a>
            `}
          </div>

        </div>
      </div>
    `;

    // Wire up events
    container.querySelector('#toggle-view').addEventListener('click', (e) => {
      e.preventDefault();
      currentView = currentView === 'signin' ? 'signup' : 'signin';
      render();
    });

    container.querySelector('#auth-form').addEventListener('submit', handleAuthSubmit);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#login-error');
    const submitBtn = container.querySelector('#btn-submit');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = currentView === 'signin' ? 'Signing In...' : 'Registering Company...';

    const email = container.querySelector('#auth-email').value.trim();
    const password = container.querySelector('#auth-password').value;

    try {
      if (currentView === 'signin') {
        // 1. Sign in with password
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // 2. Fetch the corresponding profile record from the database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw new Error('Your user profile could not be found. Please check with your administrator.');
        }

        // 3. Store the user context in localStorage for backward-compatibility with the client-side shell
        const user = {
          id: profile.id,
          companyId: profile.company_id,
          name: profile.name,
          role: profile.role,
          userTypeName: profile.role === 'admin' ? 'Admin' : (profile.role === 'manager' ? 'Manager' : 'Technician'),
          userTypeId: profile.user_type_id || (profile.role === 'admin' ? 'ut_admin' : 'ut_tech'),
          color: profile.color || '#3B82F6'
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        completeLogin(user);

      } else {
        // Sign Up Mode
        const companyName = container.querySelector('#signup-company').value.trim();
        const adminName = container.querySelector('#signup-name').value.trim();
        const adminPhone = container.querySelector('#signup-phone').value.trim();

        // 1. Sign up user in Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: adminName,
              phone: adminPhone
            }
          }
        });
        if (error) throw error;

        if (!data.user) {
          throw new Error('Verification required or signup was blocked. Check your email inbox.');
        }

        // 2. Call security definer RPC function to create company and profile records
        const { data: companyId, error: rpcError } = await supabase.rpc('create_company_and_admin', {
          user_id: data.user.id,
          company_name: companyName,
          admin_name: adminName,
          admin_phone: adminPhone
        });

        if (rpcError) throw rpcError;

        // 3. Set local storage user
        const user = {
          id: data.user.id,
          companyId: companyId,
          name: adminName,
          role: 'admin',
          userTypeName: 'Admin',
          userTypeId: 'ut_admin',
          color: '#3B82F6'
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        completeLogin(user);
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      errorEl.innerText = err.message || 'An unexpected authentication error occurred.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerText = currentView === 'signin' ? 'Sign In' : 'Create Company & Admin Account';
    }
  };

  const completeLogin = async (user) => {
    if (sidebar) sidebar.style.display = '';
    if (topbar) topbar.style.display = '';
    if (breadcrumb) breadcrumb.style.display = '';

    // Trigger UI updates for routes
    const { updateSidebarAccess } = await import('../../components/Sidebar.js');
    if (updateSidebarAccess) updateSidebarAccess();

    const { updateTopbarAccess } = await import('../../components/TopBar.js');
    if (updateTopbarAccess) updateTopbarAccess();

    const { store: dataStore } = await import('../../data/store.js');
    const landingRoute = getLandingRoute(user, dataStore);

    // Restore theme settings
    const storedTheme = localStorage.getItem('simpro_theme') || 'light';
    if (storedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    router.navigate(landingRoute);
  };

  render();
}

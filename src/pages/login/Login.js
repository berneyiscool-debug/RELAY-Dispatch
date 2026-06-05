import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';
import { applyTheme, THEMES } from '../../utils/theme.js';

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

const RELAY_LOGO_SMALL_SVG = `<svg viewBox="0 0 75.592812 53.598302" fill="none" xmlns="http://www.w3.org/2000/svg"><g fill="%23FF5C00"><g transform="translate(-19.023693,-210.20382)"><g transform="matrix(0.3804654,0,0,0.3804654,-83.598864,122.48096)"><g transform="translate(107.79013)"><g transform="translate(-22.948867,-9.0404629)"><path d="m 267.58275,347.28778 q 0.0535,9.78228 1.22947,17.15908 q 1.22947,7.3768 3.74185,11.27903 -2.40547,2.29856 -7.16298,3.42112 -4.7575,1.17601 -7.69753,1.17601 -9.515,-0.10691 -13.31031,-7.10952 -3.31422,-6.20079 -3.31422,-15.92962 0,-1.28292 0.26728,-7.64407 q 0.26728,-6.41461 3.52803,-20.04566 q 3.26076,-13.63104 7.80445,-26.94136 q 4.54368,-13.31031 8.87354,-23.94787 q 1.22947,-0.10691 2.45893,-0.10691 q 2.56585,0 5.39897,0.58801 q 2.83311,0.588 4.32986,4.16949 q 0.69491,1.65711 0.69491,4.38332 0,3.15385 -0.90873,7.64407 -2.19166,10.26338 -3.63495,20.63366 q 1.28292,0.64147 2.72621,0.64147 q 2.88657,0 7.3768,-3.1004 q 4.49023,-3.10039 8.49936,-9.62191 q 3.79531,-6.09388 3.79531,-12.34813 v -0.80182 q -1.12256,-11.33248 -7.69753,-14.80706 -3.74186,-1.97784 -8.44591,-1.97784 -3.58149,0 -10.47719,1.87093 q -6.84225,1.81747 -16.94526,8.71318 q -10.04955,6.8957 -18.17473,16.3038 q -8.07171,9.35464 -11.6532,19.5111 -1.92439,5.29205 -1.92439,10.31683 0,4.54368 1.60366,8.87354 -5.66624,0.96219 -10.37029,0.96219 -6.41461,0 -12.82922,-2.40547 -6.36115,-2.45894 -9.14081,-9.03391 -1.33638,-3.26076 -1.33638,-6.89571 0,-3.6884 1.38983,-7.80444 q 4.00913,-10.53065 18.01436,-22.07694 q 14.05869,-11.59976 34.05089,-20.36639 q 20.04565,-8.76663 42.06914,-10.90484 q 2.56584,-0.16036 4.97132,-0.16036 q 11.38593,0 19.77838,4.59714 q 8.4459,4.59713 12.6154,13.47068 q 3.84877,8.07171 3.84877,17.42635 0,0.80183 -0.21382,6.36116 -0.16037,5.55932 -4.49023,14.91396 q -4.32986,9.30119 -12.1343,15.34161 -7.80444,6.04042 -18.49546,6.46806 q 8.87354,6.41461 19.5111,7.10953 q 1.17601,0.0534 2.35203,0.0534 9.67537,0 20.90093,-5.07823 0.26728,3.79531 0.26728,7.10953 0,9.0339 -2.35203,16.14343 q -2.35202,7.10952 -7.32334,10.90484 -4.97132,3.79531 -10.63756,4.49022 -2.13821,0.26728 -4.11604,0.26728 -3.42113,0 -6.46807,-0.74837 -5.8266,-1.38984 -11.38593,-6.20079 q -5.50587,-4.7575 -10.47719,-11.65321 q -4.91787,-6.8957 -8.98046,-14.59324 z" /></g></g></g></svg>`;

export function renderLogin(container) {
  // Respect the user's chosen theme (default to light)
  const storedTheme = localStorage.getItem('simpro_theme') || 'light';
  applyTheme(storedTheme);

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
      <div class="auth-container">
        <!-- Glows -->
        <div class="auth-bg-glow"></div>
        <div class="auth-bg-glow-2"></div>

        <!-- Theme Toggle -->
        <button class="auth-theme-toggle" id="auth-theme-btn" title="Toggle color theme">
          <span class="material-icons-outlined">${(THEMES[document.documentElement.getAttribute('data-theme') || 'light'] ? THEMES[document.documentElement.getAttribute('data-theme') || 'light'].mode : 'light') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div class="auth-card">
          <!-- Logo & Brand Header -->
          <div class="auth-header">
            <div class="auth-logo-icon">
              ${RELAY_LOGO_SMALL_SVG}
            </div>
            <h1 class="auth-title">Relay — Dispatch</h1>
            <p class="auth-subtitle">Dispatch & Field Service Management Platform</p>
          </div>

          <!-- Error Alert Panel -->
          <div id="login-error" class="auth-error" style="display: none;">
            <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
            <span id="login-error-text"></span>
          </div>

          <!-- Form Area -->
          <form id="auth-form" class="auth-form">
            ${currentView === 'signin' ? `
              <!-- Sign In View -->
              <div class="auth-form-group">
                <label class="auth-form-label">Username or Email</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">person</span>
                  <input type="text" id="auth-email" class="auth-form-input" placeholder="username@company or name@company.com" required>
                </div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label">Password</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">lock</span>
                  <input type="password" id="auth-password" class="auth-form-input" placeholder="••••••••" required>
                  <button type="button" class="auth-toggle-pwd" id="btn-toggle-pwd" title="Toggle password visibility">
                    <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
                  </button>
                </div>
              </div>

              <button type="submit" id="btn-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
                Sign In
              </button>
            ` : `
              <!-- Sign Up (New Company Creation) View -->
              <div class="auth-form-group">
                <label class="auth-form-label">Company Name</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">business</span>
                  <input type="text" id="signup-company" class="auth-form-input" placeholder="Acme Electrical Services" required>
                </div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label">Your Name (Administrator)</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">person</span>
                  <input type="text" id="signup-name" class="auth-form-input" placeholder="John Doe" required>
                </div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label">Phone Number</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">phone</span>
                  <input type="text" id="signup-phone" class="auth-form-input" placeholder="0412 345 678" required>
                </div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label">Email Address</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">mail</span>
                  <input type="email" id="auth-email" class="auth-form-input" placeholder="admin@company.com" required>
                </div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label">Password</label>
                <div class="auth-input-wrapper">
                  <span class="material-icons-outlined">lock</span>
                  <input type="password" id="auth-password" class="auth-form-input" placeholder="Min. 6 characters" required>
                  <button type="button" class="auth-toggle-pwd" id="btn-toggle-pwd" title="Toggle password visibility">
                    <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
                  </button>
                </div>
              </div>

              <button type="submit" id="btn-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
                Create Company & Admin Account
              </button>
            `}
          </form>

          <!-- Toggle View Button -->
          <div class="auth-footer">
            ${currentView === 'signin' ? `
              Don't have a company account? 
              <a href="#" id="toggle-view">Sign up your company</a>
            ` : `
              Already registered? 
              <a href="#" id="toggle-view">Sign in to your company</a>
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

    // Password visibility toggle
    const pwdInput = container.querySelector('#auth-password');
    const pwdToggle = container.querySelector('#btn-toggle-pwd');
    if (pwdInput && pwdToggle) {
      pwdToggle.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        pwdToggle.innerHTML = `<span class="material-icons-outlined auth-toggle-pwd-icon">${isPwd ? 'visibility_off' : 'visibility'}</span>`;
      });
    }

    // Theme Toggle switcher
    const themeBtn = container.querySelector('#auth-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const currentMode = THEMES[currentTheme] ? THEMES[currentTheme].mode : 'light';
        const nextTheme = currentMode === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        themeBtn.innerHTML = `<span class="material-icons-outlined">${nextTheme === 'dark' ? 'light_mode' : 'dark_mode'}</span>`;
      });
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#login-error');
    const errorTextEl = container.querySelector('#login-error-text');
    const submitBtn = container.querySelector('#btn-submit');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = currentView === 'signin' ? 'Signing In...' : 'Registering Company...';

    const rawInput = container.querySelector('#auth-email').value.trim();
    const password = container.querySelector('#auth-password').value;

    let authEmail = rawInput;
    // Map username@company to username@company.fieldforge.internal behind the scenes if domain has no TLD/dot
    if (authEmail.includes('@')) {
      const parts = authEmail.split('@');
      const domain = parts[1];
      if (domain && !domain.includes('.')) {
        authEmail = `${parts[0].toLowerCase()}@${domain.toLowerCase()}.fieldforge.internal`;
      }
    }

    try {
      if (currentView === 'signin') {
        // 1. Sign in with password
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
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

        // 3. Intercept if password change is forced
        if (profile.force_password_change) {
          renderForcePasswordChange(data.user, profile);
          return;
        }

        // 4. Store the user context in localStorage for backward-compatibility
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
          email: authEmail,
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
      errorTextEl.innerText = err.message || 'An unexpected authentication error occurred.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = currentView === 'signin' ? 'Sign In' : 'Create Company & Admin Account';
    }
  };

  const renderForcePasswordChange = (authUser, profile) => {
    container.innerHTML = `
      <div class="auth-container">
        <!-- Glows -->
        <div class="auth-bg-glow"></div>
        <div class="auth-bg-glow-2"></div>

        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo-icon" style="background:var(--color-warning-bg); border-radius:50%; width:48px; height:48px;">
              <span class="material-icons-outlined text-warning" style="font-size: 28px;">lock_reset</span>
            </div>
            <h1 class="auth-title" style="margin-top:12px;">Change Password</h1>
            <p class="auth-subtitle">An administrator has reset your password. You must choose a new password to log in.</p>
          </div>

          <div id="pwd-change-error" class="auth-error" style="display: none;">
            <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
            <span id="pwd-change-error-text"></span>
          </div>

          <form id="pwd-change-form" class="auth-form">
            <div class="auth-form-group">
              <label class="auth-form-label">New Password</label>
              <div class="auth-input-wrapper">
                <span class="material-icons-outlined">lock</span>
                <input type="password" id="new-password" class="auth-form-input" placeholder="Min. 6 characters" required>
                <button type="button" class="auth-toggle-pwd" id="btn-toggle-new-pwd" title="Toggle password visibility">
                  <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
                </button>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label">Confirm New Password</label>
              <div class="auth-input-wrapper">
                <span class="material-icons-outlined">lock</span>
                <input type="password" id="confirm-password" class="auth-form-input" placeholder="Re-enter password" required>
                <button type="button" class="auth-toggle-pwd" id="btn-toggle-confirm-pwd" title="Toggle password visibility">
                  <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
                </button>
              </div>
            </div>

            <button type="submit" id="btn-pwd-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
              Update Password & Log In
            </button>
          </form>

        </div>
      </div>
    `;

    // Eye toggles for change password view
    const newPwdInput = container.querySelector('#new-password');
    const newPwdToggle = container.querySelector('#btn-toggle-new-pwd');
    if (newPwdInput && newPwdToggle) {
      newPwdToggle.addEventListener('click', () => {
        const isPwd = newPwdInput.type === 'password';
        newPwdInput.type = isPwd ? 'text' : 'password';
        newPwdToggle.innerHTML = `<span class="material-icons-outlined auth-toggle-pwd-icon">${isPwd ? 'visibility_off' : 'visibility'}</span>`;
      });
    }

    const confirmPwdInput = container.querySelector('#confirm-password');
    const confirmPwdToggle = container.querySelector('#btn-toggle-confirm-pwd');
    if (confirmPwdInput && confirmPwdToggle) {
      confirmPwdToggle.addEventListener('click', () => {
        const isPwd = confirmPwdInput.type === 'password';
        confirmPwdInput.type = isPwd ? 'text' : 'password';
        confirmPwdToggle.innerHTML = `<span class="material-icons-outlined auth-toggle-pwd-icon">${isPwd ? 'visibility_off' : 'visibility'}</span>`;
      });
    }

    container.querySelector('#pwd-change-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = container.querySelector('#pwd-change-error');
      const errorTextEl = container.querySelector('#pwd-change-error-text');
      const submitBtn = container.querySelector('#btn-pwd-submit');
      errorEl.style.display = 'none';

      const newPassword = container.querySelector('#new-password').value;
      const confirmPassword = container.querySelector('#confirm-password').value;

      if (newPassword.length < 6) {
        errorTextEl.innerText = 'Password must be at least 6 characters.';
        errorEl.style.display = 'flex';
        return;
      }

      if (newPassword !== confirmPassword) {
        errorTextEl.innerText = 'Passwords do not match.';
        errorEl.style.display = 'flex';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Updating...';

      try {
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ force_password_change: false })
          .eq('id', authUser.id);
        if (profileError) throw profileError;

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
      } catch (err) {
        console.error('Password change error:', err);
        errorTextEl.innerText = err.message || 'An error occurred during password change.';
        errorEl.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Update Password & Log In';
      }
    });
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
    applyTheme(storedTheme);

    router.navigate(landingRoute);
  };

  render();
}

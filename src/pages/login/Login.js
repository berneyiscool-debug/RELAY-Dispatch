import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';
import { applyTheme, THEMES } from '../../utils/theme.js';
import { store } from '../../data/store.js';
const logoLarge = new URL('../../assets/RELAY_Dispatch_Logo.png', import.meta.url).href;


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
  // Clear any active theme for the login/signup screens
  applyTheme(null);

  // Hide the sidebar, topbar, and breadcrumbs when on login
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');

  if (sidebar) sidebar.style.display = 'none';
  if (topbar) topbar.style.display = 'none';
  if (breadcrumb) breadcrumb.style.display = 'none';

  const render = () => {
    container.innerHTML = `
      <div class="auth-split-wrapper">
        <!-- Glows -->
        <div class="auth-bg-glow"></div>
        <div class="auth-bg-glow-2"></div>

        <!-- Left Side: Sign In Panel -->
        <div class="auth-panel signin-panel active">
          <!-- Collapsed vertical indicator -->
          <div class="auth-panel-indicator">
            <span class="material-icons-outlined">login</span>
            <span class="indicator-text">Sign In</span>
          </div>

          <!-- Panel Content (Active view) -->
          <div class="auth-panel-content">
            <div class="auth-card">
              <!-- Logo & Brand Header -->
              <div class="auth-header" style="text-align: center; margin-bottom: 24px;">
                <img src="${logoLarge}" alt="DISPATCH" style="max-height: 48px; max-width: 240px; object-fit: contain; margin: 0 auto 12px auto; display: block;" />
                <p class="auth-subtitle" style="margin-top: 4px;">Dispatch & Field Service Management Platform</p>
              </div>

              <!-- Error Alert Panel -->
              <div id="signin-error" class="auth-error" style="display: none;">
                <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
                <span id="signin-error-text"></span>
              </div>

              <!-- Form Area -->
              <form id="signin-form" class="auth-form">
                <div class="auth-form-group">
                  <label class="auth-form-label">Username or Email</label>
                  <div class="auth-input-wrapper">
                    <span class="material-icons-outlined">person</span>
                    <input type="text" id="signin-email" class="auth-form-input" placeholder="username@company or name@company.com" required>
                  </div>
                </div>

                <div class="auth-form-group">
                  <label class="auth-form-label">Password</label>
                  <div class="auth-input-wrapper">
                    <span class="material-icons-outlined">lock</span>
                    <input type="password" id="signin-password" class="auth-form-input" placeholder="••••••••" required>
                    <button type="button" class="auth-toggle-pwd" id="btn-signin-toggle-pwd" title="Toggle password visibility">
                      <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
                    </button>
                  </div>
                </div>

                <div class="auth-remember-row">
                  <label class="auth-remember-label" for="signin-remember">
                    <input type="checkbox" id="signin-remember" class="auth-remember-checkbox" ${localStorage.getItem('relay_remember_me') === 'true' ? 'checked' : ''} />
                    <span class="auth-remember-check">
                      <span class="material-icons-outlined auth-remember-tick">check</span>
                    </span>
                    <span class="auth-remember-text">Remember me</span>
                  </label>
                </div>

                <button type="submit" id="btn-signin-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
                  Sign In
                </button>
              </form>

              <!-- Footer Toggle -->
               <div class="auth-footer">
                 Don't have a company account? 
                 <a href="#" id="link-to-signup">Sign up your company</a>
                 <a href="#" id="link-forgot-password" style="margin-left:12px;">Forgot password?</a>
               </div>

              <div class="auth-footer" style="margin-top: 16px; border-top: 1px dashed var(--border-color); padding-top: 16px;">
                <a href="#" id="btn-login-local" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--color-primary); text-decoration: none;">
                  <span class="material-icons-outlined" style="font-size: 18px;">offline_bolt</span>
                  Sign In Offline (Local Mode)
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Sign Up Panel -->
        <div class="auth-panel signup-panel collapsed">
          <!-- Collapsed vertical indicator -->
          <div class="auth-panel-indicator">
            <span class="material-icons-outlined">business</span>
            <span class="indicator-text">Register Company</span>
          </div>

          <!-- Panel Content (Active view) -->
          <div class="auth-panel-content">
            <div class="auth-card">
              <!-- Logo & Brand Header -->
              <div class="auth-header" style="text-align: center; margin-bottom: 24px;">
                <img src="${logoLarge}" alt="DISPATCH" style="max-height: 48px; max-width: 240px; object-fit: contain; margin: 0 auto 12px auto; display: block;" />
                <p class="auth-subtitle" style="margin-top: 4px;">Dispatch & Field Service Management Platform</p>
              </div>

              <!-- Error Alert Panel -->
              <div id="signup-error" class="auth-error" style="display: none;">
                <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
                <span id="signup-error-text"></span>
              </div>

              <!-- Form Area -->
              <form id="signup-form" class="auth-form">
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
                    <input type="email" id="signup-email" class="auth-form-input" placeholder="admin@company.com" required>
                  </div>
                </div>

                <div class="auth-form-group">
                  <label class="auth-form-label">Password</label>
                  <div class="auth-input-wrapper">
                    <span class="material-icons-outlined">lock</span>
                    <input type="password" id="signup-password" class="auth-form-input" placeholder="Min. 6 characters" required>
                    <button type="button" class="auth-toggle-pwd" id="btn-signup-toggle-pwd" title="Toggle password visibility">
                      <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
                    </button>
                  </div>
                </div>

                <button type="submit" id="btn-signup-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
                  Create Company & Admin Account
                </button>
              </form>

              <!-- Footer Toggle -->
              <div class="auth-footer">
                Already registered? 
                <a href="#" id="link-to-signin">Sign in to your company</a>
               </div>
             </div>
           </div>
         </div>
         <!-- Forgot Password Modal -->
         <div class="modal" id="forgot-password-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.5); display:none; align-items:center; justify-content:center;">
           <div class="modal-content" style="max-width:420px; width:90%; margin:auto; background:var(--bg-primary, #fff); padding:28px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.25); border:1px solid var(--border-color, #e0e0e0);">
             <h3 style="margin-top:0; font-size:18px; display:flex; align-items:center; gap:8px;">
               <span class="material-icons-outlined" style="color:var(--color-primary, #FF5C00); font-size:22px;">lock_reset</span>
               Reset Password
             </h3>

             <!-- Step 1: Find user -->
             <div id="reset-step-find">
               <p style="color:var(--text-secondary, #666); font-size:13px; margin-bottom:16px;">Enter your username or email address to reset your password.</p>
               <div class="auth-form-group" style="margin-bottom:16px;">
                 <label class="auth-form-label" style="font-size:12px; font-weight:600;">Username or Email</label>
                 <div class="auth-input-wrapper">
                   <span class="material-icons-outlined">person</span>
                   <input type="text" id="reset-employee-id" class="auth-form-input" placeholder="e.g. jake or jake@company.com">
                 </div>
               </div>
               <div id="reset-find-error" style="display:none; color:#EF4444; font-size:12px; margin-bottom:12px; padding:8px 12px; background:rgba(239,68,68,0.08); border-radius:6px; display:none; align-items:center; gap:6px;">
                 <span class="material-icons-outlined" style="font-size:14px;">error_outline</span>
                 <span id="reset-find-error-text"></span>
               </div>
               <div style="display:flex; justify-content:flex-end; gap:8px;">
                 <button id="btn-reset-cancel" class="btn btn-secondary">Cancel</button>
                 <button id="btn-reset-find" class="btn btn-primary">Find Account</button>
               </div>
             </div>

             <!-- Step 2: Set new password (local users only) -->
             <div id="reset-step-password" style="display:none;">
               <div style="padding:10px 14px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); border-radius:8px; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                 <span class="material-icons-outlined" style="color:#10B981; font-size:18px;">check_circle</span>
                 <span style="font-size:13px; color:var(--text-primary);">Account found: <strong id="reset-found-name"></strong></span>
               </div>
               <p style="color:var(--text-secondary, #666); font-size:13px; margin-bottom:16px;">Enter a new password for this account.</p>
               <div class="auth-form-group" style="margin-bottom:12px;">
                 <label class="auth-form-label" style="font-size:12px; font-weight:600;">New Password</label>
                 <div class="auth-input-wrapper">
                   <span class="material-icons-outlined">lock</span>
                   <input type="password" id="reset-new-password" class="auth-form-input" placeholder="Min. 6 characters" minlength="6">
                 </div>
               </div>
               <div class="auth-form-group" style="margin-bottom:16px;">
                 <label class="auth-form-label" style="font-size:12px; font-weight:600;">Confirm Password</label>
                 <div class="auth-input-wrapper">
                   <span class="material-icons-outlined">lock</span>
                   <input type="password" id="reset-confirm-password" class="auth-form-input" placeholder="Re-enter new password" minlength="6">
                 </div>
               </div>
               <div id="reset-pwd-error" style="display:none; color:#EF4444; font-size:12px; margin-bottom:12px; padding:8px 12px; background:rgba(239,68,68,0.08); border-radius:6px; align-items:center; gap:6px;">
                 <span class="material-icons-outlined" style="font-size:14px;">error_outline</span>
                 <span id="reset-pwd-error-text"></span>
               </div>
               <div style="display:flex; justify-content:flex-end; gap:8px;">
                 <button id="btn-reset-back" class="btn btn-secondary">Back</button>
                 <button id="btn-reset-save" class="btn btn-primary">Reset Password</button>
               </div>
             </div>

             <!-- Step 3: Success -->
             <div id="reset-step-success" style="display:none; text-align:center; padding:12px 0;">
               <span class="material-icons-outlined" style="font-size:48px; color:#10B981; margin-bottom:12px;">task_alt</span>
               <h4 style="margin:0 0 8px;">Password Reset Successfully</h4>
               <p style="color:var(--text-secondary); font-size:13px; margin-bottom:20px;">You can now sign in with your new password.</p>
               <button id="btn-reset-done" class="btn btn-primary" style="width:100%;">Done</button>
             </div>
           </div>
         </div>
       </div>
    `;

    // Pre-fill email if "Remember Me" was previously checked
    const rememberedEmail = localStorage.getItem('relay_remembered_email');
    if (rememberedEmail && localStorage.getItem('relay_remember_me') === 'true') {
      const emailInput = container.querySelector('#signin-email');
      if (emailInput) {
        emailInput.value = rememberedEmail;
        // Focus password field instead since email is pre-filled
        setTimeout(() => {
          const pwdInput = container.querySelector('#signin-password');
          if (pwdInput) pwdInput.focus();
        }, 100);
      }
    }

    // Active panel switching handlers
    const signinPanel = container.querySelector('.signin-panel');
    const signupPanel = container.querySelector('.signup-panel');

    const switchToPanel = (activePanel) => {
      if (activePanel === 'signin') {
        signinPanel.classList.add('active');
        signinPanel.classList.remove('collapsed');
        signupPanel.classList.add('collapsed');
        signupPanel.classList.remove('active');
      } else {
        signupPanel.classList.add('active');
        signupPanel.classList.remove('collapsed');
        signinPanel.classList.add('collapsed');
        signinPanel.classList.remove('active');
      }
    };

     signinPanel.addEventListener('click', (e) => {
       if (signinPanel.classList.contains('collapsed')) {
         switchToPanel('signin');
       }
     });

     signupPanel.addEventListener('click', (e) => {
       if (signupPanel.classList.contains('collapsed')) {
         switchToPanel('signup');
       }
     });

    container.querySelector('#link-to-signup').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchToPanel('signup');
    });

     // Forgot password — multi-step flow
     let _resetTech = null; // track the matched local technician

     const resetModal = container.querySelector('#forgot-password-modal');
     const resetStepFind = container.querySelector('#reset-step-find');
     const resetStepPwd = container.querySelector('#reset-step-password');
     const resetStepSuccess = container.querySelector('#reset-step-success');

     const showResetStep = (step) => {
       resetStepFind.style.display = step === 'find' ? 'block' : 'none';
       resetStepPwd.style.display = step === 'password' ? 'block' : 'none';
       resetStepSuccess.style.display = step === 'success' ? 'block' : 'none';
     };

     const closeResetModal = () => {
       resetModal.style.display = 'none';
       showResetStep('find');
       _resetTech = null;
       container.querySelector('#reset-employee-id').value = '';
       const newPwdEl = container.querySelector('#reset-new-password');
       const confPwdEl = container.querySelector('#reset-confirm-password');
       if (newPwdEl) newPwdEl.value = '';
       if (confPwdEl) confPwdEl.value = '';
       container.querySelector('#reset-find-error').style.display = 'none';
       const pwdErr = container.querySelector('#reset-pwd-error');
       if (pwdErr) pwdErr.style.display = 'none';
     };

     container.querySelector('#link-forgot-password').addEventListener('click', (e) => {
       e.preventDefault();
       e.stopPropagation();
       showResetStep('find');
       resetModal.style.display = 'flex';
     });

     container.querySelector('#btn-reset-cancel').addEventListener('click', closeResetModal);

     // Step 1 → Find Account
     container.querySelector('#btn-reset-find').addEventListener('click', () => {
       const input = container.querySelector('#reset-employee-id').value.trim().toLowerCase();
       const findErr = container.querySelector('#reset-find-error');
       const findErrText = container.querySelector('#reset-find-error-text');

       if (!input) {
         findErrText.textContent = 'Please enter a username or email address.';
         findErr.style.display = 'flex';
         return;
       }

       // Look up in local store
       const technicians = store.getAll('technicians') || [];
       const match = technicians.find(t =>
         (t.email && t.email.toLowerCase() === input) ||
         (t.username && t.username.toLowerCase() === input) ||
         (t.name && t.name.toLowerCase() === input)
       );

       if (!match) {
         findErrText.textContent = 'No account found with that username or email. Please check and try again.';
         findErr.style.display = 'flex';
         return;
       }

       findErr.style.display = 'none';
       _resetTech = match;
       container.querySelector('#reset-found-name').textContent = match.name || match.username || match.email;
       showResetStep('password');
     });

     // Step 2 → Back
     container.querySelector('#btn-reset-back').addEventListener('click', () => {
       showResetStep('find');
       _resetTech = null;
     });

     // Step 2 → Save new password
     container.querySelector('#btn-reset-save').addEventListener('click', () => {
       const newPwd = container.querySelector('#reset-new-password').value;
       const confirmPwd = container.querySelector('#reset-confirm-password').value;
       const pwdErr = container.querySelector('#reset-pwd-error');
       const pwdErrText = container.querySelector('#reset-pwd-error-text');

       if (!newPwd || newPwd.length < 6) {
         pwdErrText.textContent = 'Password must be at least 6 characters.';
         pwdErr.style.display = 'flex';
         return;
       }

       if (newPwd !== confirmPwd) {
         pwdErrText.textContent = 'Passwords do not match.';
         pwdErr.style.display = 'flex';
         return;
       }

       pwdErr.style.display = 'none';

       if (_resetTech) {
         // Update the technician's password in the local store
         store.update('technicians', _resetTech.id, { password: newPwd });
       }

       showResetStep('success');
     });

     // Step 3 → Done
     container.querySelector('#btn-reset-done').addEventListener('click', closeResetModal);

    container.querySelector('#link-to-signin').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchToPanel('signin');
    });

    // Offline / Local Mode Sign In
    const localBtn = container.querySelector('#btn-login-local');
    if (localBtn) {
      localBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const emailInput = (container.querySelector('#signin-email')?.value || '').trim().toLowerCase();
        const passwordInput = container.querySelector('#signin-password')?.value || '';

        const errorEl = container.querySelector('#signin-error');
        const errorTextEl = container.querySelector('#signin-error-text');

        if (!emailInput || !passwordInput) {
          errorTextEl.innerText = 'Please enter your Username/Email and Password, then click "Sign In Offline (Local Mode)".';
          errorEl.style.display = 'flex';
          return;
        }

        // Fetch all technicians from local store
        const technicians = store.getAll('technicians') || [];
        const inputUsername = emailInput.includes('@') ? emailInput.split('@')[0] : emailInput;
        const tech = technicians.find(t => 
          (t.email && t.email.toLowerCase() === emailInput) || 
          (t.username && t.username.toLowerCase() === emailInput) ||
          (t.username && t.username.toLowerCase() === inputUsername) ||
          (t.name && t.name.toLowerCase() === emailInput)
        );

        if (!tech) {
          errorTextEl.innerText = 'User not found in local database. Check username/email.';
          errorEl.style.display = 'flex';
          return;
        }

        // Seeds have default password '123456'
        const expectedPassword = tech.password || '123456';
        if (passwordInput !== expectedPassword) {
          errorTextEl.innerText = 'Incorrect offline password. Please try again.';
          errorEl.style.display = 'flex';
          return;
        }

        let role = 'technician';
        let userTypeName = 'Technician';
        const utId = tech.userTypeId || '';
        if (utId === 'ut_admin' || utId.endsWith('_ut_admin')) {
          role = 'admin';
          userTypeName = 'Admin';
        } else if (utId === 'ut_manager' || utId.endsWith('_ut_manager')) {
          role = 'manager';
          userTypeName = 'Manager';
        } else if (utId === 'ut_office' || utId.endsWith('_ut_office')) {
          role = 'office';
          userTypeName = 'Office Staff';
        }

        let companyId = null;
        if (tech.id && tech.id.startsWith('acct_')) {
          const match = tech.id.match(/^(acct_[^_]+)/);
          if (match) {
            companyId = match[1];
          }
        }

        const user = {
          id: tech.id,
          name: tech.name,
          role: role,
          userTypeName: userTypeName,
          userTypeId: tech.userTypeId || 'ut_tech',
          companyId: companyId,
          color: tech.color || '#3B82F6',
          theme: tech.theme || 'light'
        };

        localStorage.setItem('currentUser', JSON.stringify(user));

        // Persist Remember Me state
        const rememberCheckbox = container.querySelector('#signin-remember');
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem('relay_remember_me', 'true');
          localStorage.setItem('relay_remembered_email', emailInput);
        } else {
          localStorage.removeItem('relay_remember_me');
          localStorage.removeItem('relay_remembered_email');
        }

        completeLogin(user);
      });
    }

    // Submit listeners
    container.querySelector('#signin-form').addEventListener('submit', handleSignInSubmit);
    container.querySelector('#signup-form').addEventListener('submit', handleSignUpSubmit);

    // Password visibility toggles
    const signinPwdInput = container.querySelector('#signin-password');
    const signinPwdToggle = container.querySelector('#btn-signin-toggle-pwd');
    if (signinPwdInput && signinPwdToggle) {
      signinPwdToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isPwd = signinPwdInput.type === 'password';
        signinPwdInput.type = isPwd ? 'text' : 'password';
        signinPwdToggle.innerHTML = `<span class="material-icons-outlined auth-toggle-pwd-icon">${isPwd ? 'visibility_off' : 'visibility'}</span>`;
      });
    }

    const signupPwdInput = container.querySelector('#signup-password');
    const signupPwdToggle = container.querySelector('#btn-signup-toggle-pwd');
    if (signupPwdInput && signupPwdToggle) {
      signupPwdToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isPwd = signupPwdInput.type === 'password';
        signupPwdInput.type = isPwd ? 'text' : 'password';
        signupPwdToggle.innerHTML = `<span class="material-icons-outlined auth-toggle-pwd-icon">${isPwd ? 'visibility_off' : 'visibility'}</span>`;
      });
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#signin-error');
    const errorTextEl = container.querySelector('#signin-error-text');
    const submitBtn = container.querySelector('#btn-signin-submit');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Signing In...';

    const rawInput = container.querySelector('#signin-email').value.trim();
    const password = container.querySelector('#signin-password').value;

    let authEmail = rawInput;
    // Map username@company to username@company.relay.internal behind the scenes if domain has no TLD/dot
    if (authEmail.includes('@')) {
      const parts = authEmail.split('@');
      const domain = parts[1];
      if (domain && !domain.includes('.')) {
        authEmail = `${parts[0].toLowerCase()}@${domain.toLowerCase()}.relay.internal`;
      }
    }

    try {
      // 1. Sign in with password
      let signInResult = await supabase.auth.signInWithPassword({ email: authEmail, password });
      
      // Fallback for legacy .fieldforge.internal users if new domain fails
      if (signInResult.error && authEmail.endsWith('.relay.internal')) {
        const legacyEmail = authEmail.replace('.relay.internal', '.fieldforge.internal');
        const fallbackResult = await supabase.auth.signInWithPassword({ email: legacyEmail, password });
        if (!fallbackResult.error) {
          signInResult = fallbackResult;
        }
      }
      
      if (signInResult.error) {
        // Attempt Local Fallback
        const technicians = store.getAll('technicians') || [];
        const inputUsername = rawInput.toLowerCase().includes('@') ? rawInput.toLowerCase().split('@')[0] : rawInput.toLowerCase();
        
        const localTech = technicians.find(t => 
          (t.email && t.email.toLowerCase() === rawInput.toLowerCase()) || 
          (t.username && t.username.toLowerCase() === rawInput.toLowerCase()) ||
          (t.username && t.username.toLowerCase() === inputUsername) ||
          (t.name && t.name.toLowerCase() === rawInput.toLowerCase())
        );
        
        if (localTech && (localTech.password === password || (!localTech.password && password === '123456'))) {
          // Local login successful
          const user = {
            id: localTech.id,
            companyId: store.companyId || 'local_company',
            name: localTech.name,
            role: localTech.role || 'technician',
            userTypeName: localTech.role === 'admin' ? 'Admin' : (localTech.role === 'manager' ? 'Manager' : 'Technician'),
            userTypeId: localTech.userTypeId || (localTech.role === 'admin' ? 'ut_admin' : 'ut_tech'),
            color: localTech.color || '#1B6DE0',
            payRate: localTech.payRate || 0,
            email: localTech.email || '',
            theme: 'light'
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          if (container.querySelector('#signin-remember').checked) {
            localStorage.setItem('relay_remember_me', 'true');
            localStorage.setItem('relay_remembered_email', rawInput);
          } else {
            localStorage.removeItem('relay_remember_me');
            localStorage.removeItem('relay_remembered_email');
          }
          
          const target = getLandingRoute(user, store);
          router.navigate(target);
          return;
        }

        throw signInResult.error;
      }
      const { data } = signInResult;

      // 2. Fetch the corresponding profile record from the database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        throw new Error(`Your user profile could not be found: ${profileError.message} (${profileError.code})`);
      }

      // 3. Intercept if password change is forced
      if (profile.force_password_change) {
        renderForcePasswordChange(container, data.user, profile);
        return;
      }

      // 4. Store the user context in localStorage for backward-compatibility
      const user = {
        id: profile.id,
        companyId: profile.company_id,
        name: profile.name,
        role: profile.role,
        userTypeName: profile.role === 'admin' ? 'Admin' : (profile.role === 'manager' ? 'Manager' : 'Technician'),
        userTypeId: profile.user_type_id || (profile.role === 'admin' 
          ? (profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_admin' : `${profile.company_id}_ut_admin`)
          : (profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`)),
        color: profile.color || '#3B82F6',
        theme: profile.theme || 'light'
      };

      localStorage.setItem('currentUser', JSON.stringify(user));

      // Persist Remember Me state
      const rememberCheckbox = container.querySelector('#signin-remember');
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('relay_remember_me', 'true');
        localStorage.setItem('relay_remembered_email', rawInput);
      } else {
        localStorage.removeItem('relay_remember_me');
        localStorage.removeItem('relay_remembered_email');
      }

      completeLogin(user);

    } catch (err) {
      console.error('Authentication Error:', err);
      errorTextEl.innerText = err.message || 'An unexpected authentication error occurred.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Sign In';
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#signup-error');
    const errorTextEl = container.querySelector('#signup-error-text');
    const submitBtn = container.querySelector('#btn-signup-submit');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Registering Company...';

    const companyName = container.querySelector('#signup-company').value.trim();
    const adminName = container.querySelector('#signup-name').value.trim();
    const adminPhone = container.querySelector('#signup-phone').value.trim();
    const email = container.querySelector('#signup-email').value.trim();
    const password = container.querySelector('#signup-password').value;

    try {
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
        userTypeId: companyId === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_admin' : `${companyId}_ut_admin`,
        color: '#3B82F6',
        theme: 'light'
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      completeLogin(user);
    } catch (err) {
      console.error('Authentication Error:', err);
      errorTextEl.innerText = err.message || 'An unexpected authentication error occurred.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Create Company & Admin Account';
    }
  };

  render();
}

// ---- Expose force password change and completion helpers for Launch Screen ----

export async function handleCloudLoginSuccess(container, authUser) {
  // Fetch the corresponding profile record from the database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    throw new Error(`Your user profile could not be found: ${profileError.message} (${profileError.code})`);
  }

  // Intercept if password change is forced
  if (profile.force_password_change) {
    renderForcePasswordChange(container, authUser, profile);
    return;
  }

  // Store the user context in localStorage for backward-compatibility
  const user = {
    id: profile.id,
    companyId: profile.company_id,
    name: profile.name,
    role: profile.role,
    userTypeName: profile.role === 'admin' ? 'Admin' : (profile.role === 'manager' ? 'Manager' : 'Technician'),
    userTypeId: profile.user_type_id || (profile.role === 'admin' 
      ? (profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_admin' : `${profile.company_id}_ut_admin`)
      : (profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`)),
    color: profile.color || '#3B82F6',
    theme: profile.theme || 'light'
  };

  localStorage.setItem('currentUser', JSON.stringify(user));
  await completeLogin(user);
}

function renderForcePasswordChange(container, authUser, profile) {
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
        userTypeId: profile.user_type_id || (profile.role === 'admin' 
          ? (profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_admin' : `${profile.company_id}_ut_admin`)
          : (profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`)),
        color: profile.color || '#3B82F6',
        theme: profile.theme || 'light'
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      await completeLogin(user);
    } catch (err) {
      console.error('Password change error:', err);
      errorTextEl.innerText = err.message || 'An error occurred during password change.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Update Password & Log In';
    }
  });
}

async function completeLogin(user) {
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');
  if (sidebar) sidebar.style.display = '';
  if (topbar) topbar.style.display = '';
  if (breadcrumb) breadcrumb.style.display = '';

  // Trigger UI updates for routes
  const { updateSidebarAccess } = await import('../../components/Sidebar.js');
  if (updateSidebarAccess) updateSidebarAccess();

  const { updateTopbarAccess } = await import('../../components/TopBar.js');
  if (updateTopbarAccess) updateTopbarAccess();

  const { store: dataStore } = await import('../../data/store.js');
  await dataStore.initializeUser(user);
  const landingRoute = getLandingRoute(user, dataStore);

  // Restore theme settings
  const storedTheme = user.theme || 'light';
  applyTheme(storedTheme);

  router.navigate(landingRoute);
}

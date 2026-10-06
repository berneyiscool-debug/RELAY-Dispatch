import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';
import { applyTheme } from '../../utils/theme.js';
import { setSessionUser } from '../auth/session.js';
import { readPendingSignup, sessionUserFromProfile } from '../../utils/cloudOnboarding.js';


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
    // A cloud account with no profile row is a signup that never finished
    // provisioning (abandoned before the RPC ran, or interrupted by a failed
    // request). Send it to the setup step instead of dead-ending.
    // PGRST116 = "no rows returned" from .single().
    if (profileError.code === 'PGRST116' || readPendingSignup()) {
      router.navigate('/setup');
      return;
    }
    throw new Error(`Your user profile could not be found: ${profileError.message} (${profileError.code})`);
  }

  // A profile that exists but is not attached to a company cannot use the app:
  // every collection is company-scoped. `/subscribe` owns that repair path,
  // because the profile row already exists, so the company cannot be created
  // through create_company_and_admin (which inserts the profile too).
  if (!profile.company_id) {
    router.navigate('/subscribe');
    return;
  }

  // Intercept if password change is forced
  if (profile.force_password_change) {
    renderForcePasswordChange(container, authUser, profile);
    return;
  }

  // Store the user context the rest of the app reads on boot
  const user = sessionUserFromProfile(profile);

  setSessionUser(user);
  await completeLogin(user);
}

function renderForcePasswordChange(container, authUser, profile) {
  container.innerHTML = `
    <div class="auth-container">
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

      const user = sessionUserFromProfile(profile);

      setSessionUser(user);
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

export async function completeLogin(user) {
  // Keep the login mode consistent with the active account so a reloaded tab
  // (or a second tab adopting the session) boots into the correct mode. Local
  // profiles are always single-user, so an `acct_` account is always 'local'.
  const loginMode = user.companyId && String(user.companyId).startsWith('acct_') ? 'local' : 'cloud';
  localStorage.setItem('relay_login_mode', loginMode);

  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');
  if (sidebar) sidebar.style.display = '';
  if (topbar) topbar.style.display = '';
  if (breadcrumb) breadcrumb.style.display = '';

  const { store: dataStore } = await import('../../data/store.js');
  await dataStore.initializeUser(user);
  const landingRoute = getLandingRoute(user, dataStore);

  // Trigger UI updates for routes (after initializeUser so the sidebar's
  // local-mode gate reflects the now-active cloud account).
  const { updateSidebarAccess } = await import('../../components/Sidebar.js');
  if (updateSidebarAccess) updateSidebarAccess();

  const { updateTopbarAccess } = await import('../../components/TopBar.js');
  if (updateTopbarAccess) updateTopbarAccess();

  // Restore the app-shell appearance now that we're back in the app shell
  applyTheme();

  router.navigate(landingRoute);
}

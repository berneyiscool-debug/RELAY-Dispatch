import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';
import { applyTheme } from '../../utils/theme.js';
import { setSessionUser } from '../auth/session.js';
import { readPendingSignup, invitedCompanyId, sessionUserFromProfile } from '../../utils/cloudOnboarding.js';
import { renderInviteNotProvisionedCard } from '../../components/InviteNotProvisionedCard.js';
import { takeRecovery } from '../../utils/passwordRecovery.js';
import { needsBackupEmailConfirmation, confirmBackupEmailToken, resendBackupEmailConfirmation } from '../../utils/backupEmailConfirmation.js';


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

/**
 * Where an invited team member's company comes from.
 *
 * `main.js` hands us only `{ id }`, so the caller's object usually has no
 * `app_metadata`; the session does (Supabase exposes it on the JWT). Only
 * `app_metadata.company_id` counts — the service role writes it in
 * `invite-user` and clients cannot forge it, unlike `user_metadata` (see
 * migration 031 and cloudOnboarding.invitedCompanyId).
 */
async function readInviteContext(authUser) {
  const context = {
    companyId: invitedCompanyId(authUser),
    email: authUser && authUser.email ? authUser.email : '',
  };
  if (context.companyId && context.email) return context;

  try {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data && data.session ? data.session.user : null;
    return {
      companyId: context.companyId || invitedCompanyId(sessionUser),
      email: context.email || (sessionUser && sessionUser.email ? sessionUser.email : ''),
    };
  } catch (err) {
    console.error('Could not read the signed-in session while checking invite state:', err);
    return context;
  }
}

export async function handleCloudLoginSuccess(container, authUser) {
  // Fetch the corresponding profile record from the database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    // PGRST116 = "no rows returned" from .single(). It has two causes that need
    // opposite answers, so they are separated before anything navigates:
    //
    //   - a cloud signup that never finished provisioning → finish setup;
    //   - a team member who was invited into an existing company and whose
    //     profile write never landed → they must NOT be offered a company.
    if (profileError.code === 'PGRST116') {
      const invite = await readInviteContext(authUser);
      if (invite.companyId) {
        renderInviteNotProvisionedCard(container, { email: invite.email });
        return;
      }
      router.navigate('/setup');
      return;
    }

    // Any other read failure is still a signup that has not finished.
    if (readPendingSignup()) {
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

  // A user an admin added confirms their backup email before anything else.
  if (needsBackupEmailConfirmation(profile)) {
    renderBackupEmailUnconfirmed(container, authUser, profile);
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
  renderNewPasswordForm(container, {
    subtitle: 'An administrator has reset your password. You must choose a new password to log in.',
    onSave: async (newPassword) => {
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
    },
  });
}

// The "choose a new password" card. `onSave(newPassword)` does the work once the
// two entries pass the checks; if it throws, its message is shown on the card.
function renderNewPasswordForm(container, { title = 'Change Password', subtitle, submitLabel = 'Update Password & Log In', onSave }) {
  container.innerHTML = `
    <div class="auth-container auth-container--center">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo-icon" style="background:var(--color-warning-bg); border-radius:50%; width:48px; height:48px;">
            <span class="material-icons-outlined text-warning" style="font-size: 28px;">lock_reset</span>
          </div>
          <h1 class="auth-title" style="margin-top:12px;">${title}</h1>
          <p class="auth-subtitle">${subtitle}</p>
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
            ${submitLabel}
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
      await onSave(newPassword);
    } catch (err) {
      console.error('Password change error:', err);
      errorTextEl.innerText = err.message || 'An error occurred during password change.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = submitLabel;
    }
  });
}

// A reset link that can't be used (stale, already used, or the page reloaded
// after the token was taken): say so and offer the way back.
function renderResetLinkProblem(container, message) {
  container.innerHTML = `
    <div class="auth-container auth-container--center">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo-icon" style="background:var(--color-warning-bg); border-radius:50%; width:48px; height:48px;">
            <span class="material-icons-outlined text-warning" style="font-size: 28px;">link_off</span>
          </div>
          <h1 class="auth-title" style="margin-top:12px;">Reset link not valid</h1>
          <p class="auth-subtitle"></p>
        </div>
        <button type="button" id="btn-reset-back" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
          Back to sign in
        </button>
      </div>
    </div>
  `;
  container.querySelector('.auth-subtitle').textContent =
    `${message} Ask for a new one from the sign-in screen with "Forgot password".`;
  container.querySelector('#btn-reset-back').addEventListener('click', () => router.navigate('/login'));
}

// The reset page is opened straight from an email, not from the launch screen,
// so it clears the app shell and the page padding itself (as renderLaunchScreen does).
function prepareAuthCanvas(container) {
  applyTheme(null);
  ['.sidebar', '.topbar', '#breadcrumb'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });
  container.style.padding = '0';
  container.classList.remove('non-dashboard-schedule-page');
}

/** `#/reset-password`: where the link in a password-reset email lands. */
export async function renderPasswordReset(container) {
  prepareAuthCanvas(container);
  const link = takeRecovery();
  if (!link) {
    renderResetLinkProblem(container, 'This reset link has already been used, or the page was reloaded.');
    return;
  }
  if (link.kind === 'error') {
    renderResetLinkProblem(container, link.message);
    return;
  }

  let data = null, error = null;
  try {
    ({ data, error } = await supabase.auth.setSession({
      access_token: link.accessToken,
      refresh_token: link.refreshToken,
    }));
  } catch (err) {
    error = err; // no Supabase client in this build
  }
  const authUser = data && data.user;
  if (error || !authUser) {
    if (error) console.error('Could not open the password reset session:', error);
    renderResetLinkProblem(container, 'This reset link has expired or has already been used.');
    return;
  }

  renderNewPasswordForm(container, {
    title: 'Choose a New Password',
    subtitle: `Set a new password for ${escapeText(authUser.email || 'your account')}.`,
    submitLabel: 'Save Password & Log In',
    onSave: async (newPassword) => {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      // They've just chosen a password, so an admin's "must change" flag is done with.
      const { error: flagError } = await supabase
        .from('profiles')
        .update({ force_password_change: false })
        .eq('id', authUser.id);
      if (flagError) console.warn('Could not clear the password-change flag:', flagError);
      await handleCloudLoginSuccess(container, authUser);
    },
  });
}

function escapeText(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

  // A freshly provisioned account has one thing to say before anything else:
  // the trial exists, how long it runs for, and that no card is needed yet.
  // Best-effort — a failed dynamic import must never block sign-in.
  try {
    const { maybeShowTrialWelcome } = await import('../../components/TrialBanner.js');
    maybeShowTrialWelcome();
  } catch (err) {
    console.error('Could not show the trial welcome:', err);
  }

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

// The auth card shell the status screens below share.
function renderStatusCard(container, { icon, iconTone = 'warning', title }) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo-icon" style="background:var(--color-${iconTone}-bg); border-radius:50%; width:48px; height:48px;">
            <span class="material-icons-outlined text-${iconTone}" style="font-size: 28px;">${icon}</span>
          </div>
          <h1 class="auth-title" style="margin-top:12px;">${title}</h1>
          <p class="auth-subtitle" data-status-message></p>
        </div>
        <div data-status-actions style="display:flex; flex-direction:column; gap:8px; margin-top:8px;"></div>
      </div>
    </div>
  `;
  return {
    // Messages can carry an address or a server error, so they are set as text.
    setMessage: (text) => { container.querySelector('[data-status-message]').textContent = text; },
    addButton: (label, className, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${className}`;
      btn.style.cssText = 'width:100%; padding:12px; font-size:15px; justify-content:center;';
      btn.textContent = label;
      btn.addEventListener('click', () => onClick(btn));
      container.querySelector('[data-status-actions]').appendChild(btn);
      return btn;
    },
  };
}

/**
 * Sign-in stops here for a user an admin added until they open the link sent
 * to their backup email. They keep their Supabase session so they can ask for
 * another link; nothing of the app loads.
 */
function renderBackupEmailUnconfirmed(container, authUser, profile) {
  const card = renderStatusCard(container, { icon: 'mark_email_unread', title: 'Confirm Your Email' });
  card.setMessage(`We sent a confirmation link to ${profile.backup_email}. Open it to start using RELAY, then come back and continue.`);

  card.addButton("I've Confirmed, Continue", 'btn-primary', async (btn) => {
    btn.disabled = true;
    btn.textContent = 'Checking...';
    try {
      await handleCloudLoginSuccess(container, authUser);
    } catch (err) {
      card.setMessage(err.message || 'Could not check your account. Try again.');
      btn.disabled = false;
      btn.textContent = "I've Confirmed, Continue";
    }
  });

  card.addButton('Resend Email', 'btn-secondary', async (btn) => {
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      const { email } = await resendBackupEmailConfirmation();
      card.setMessage(`A new confirmation link is on its way to ${email}. Earlier links no longer work.`);
    } catch (err) {
      card.setMessage(err.message || 'The email could not be sent.');
    }
    btn.disabled = false;
    btn.textContent = 'Resend Email';
  });

  card.addButton('Sign Out', 'btn-secondary', async () => {
    await supabase.auth.signOut();
    router.navigate('/login');
  });
}

/** Where the link in a backup email confirmation lands (`#/confirm-email?token=…`). */
export async function renderConfirmEmail(container, params = {}) {
  // Opened straight from an email, like the reset page.
  prepareAuthCanvas(container);
  const card = renderStatusCard(container, { icon: 'hourglass_top', title: 'Confirming Email' });
  card.setMessage('One moment...');

  try {
    await confirmBackupEmailToken(params.token);
    const done = renderStatusCard(container, { icon: 'mark_email_read', iconTone: 'success', title: 'Email Confirmed' });
    done.setMessage('Your email is confirmed. Sign in with your username and company code to start using RELAY.');
    done.addButton('Go to Sign In', 'btn-primary', () => router.navigate('/login'));
  } catch (err) {
    const failed = renderStatusCard(container, { icon: 'link_off', title: 'Link Not Valid' });
    failed.setMessage(err.message || 'This confirmation link is not valid.');
    failed.addButton('Back to Sign In', 'btn-primary', () => router.navigate('/login'));
  }
}

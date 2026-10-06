// ============================================
// RELAY — FINISH SETTING UP (verified cloud user with no company)
// ============================================
// Reached from the login flow when Supabase has a confirmed session but the
// account has no profile row: the signup was interrupted between email
// verification and provisioning. Nothing here trusts what the user typed at
// signup — the marker only prefills the form, and the company is always created
// through `create_company_and_admin` (see migration 036), which re-checks the
// name and stamps the caller as admin.

import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';
import { applyTheme } from '../../utils/theme.js';
import { setSessionUser } from './session.js';
import { renderFinishSetupCard } from '../../components/FinishSetupCard.js';
import {
  TRIAL_DAYS,
  fetchProfile,
  sessionUserFromProfile,
} from '../../utils/cloudOnboarding.js';

export async function renderFinishSetup(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div style="max-width:620px;margin:0 auto;padding:32px 20px 64px;width:100%;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
          <span class="material-icons-outlined" style="font-size:34px;color:var(--color-accent,#FF5C00);">domain_add</span>
          <h1 style="margin:0;font-size:28px;">Finish setting up</h1>
        </div>
        <p style="color:var(--text-secondary);margin:0 0 22px;">
          Your email is verified. Create your company to start your ${TRIAL_DAYS}-day free
          trial — no card needed until it ends.
        </p>
        <div id="setup-body">
          <div style="display:flex;align-items:center;gap:10px;color:var(--text-secondary);padding:24px 0;">
            <span class="material-icons-outlined">hourglass_top</span><span>Loading your account…</span>
          </div>
        </div>
        <div style="margin-top:26px;color:var(--text-tertiary);">
          <a href="#" id="setup-switch-account">Use a different account</a>
        </div>
      </div>
    </div>`;

  container.querySelector('#setup-switch-account').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out failed while leaving setup:', err);
    }
    router.navigate('/login');
  });

  const bodyEl = container.querySelector('#setup-body');

  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session || null;
  } catch (err) {
    console.error('Could not read the Supabase session:', err);
  }

  if (!session) {
    bodyEl.innerHTML = `
      <div class="card"><div class="card-body" style="display:flex;flex-direction:column;gap:14px;">
        <p style="margin:0;color:var(--text-secondary);">Your sign-in session expired. Sign in again and we will pick up where you left off.</p>
        <div><button class="btn btn-primary" id="setup-signin">Sign in</button></div>
      </div></div>`;
    bodyEl.querySelector('#setup-signin').addEventListener('click', () => router.navigate('/login'));
    return;
  }

  // A stale bookmark or a second tab can land here after provisioning already
  // succeeded — hand the user straight to the app rather than double-creating.
  let profile = null;
  try {
    profile = await fetchProfile(session.user.id);
  } catch (err) {
    console.error('Failed to load the profile on the setup page:', err);
  }

  if (profile?.company_id) {
    await enterApp(profile);
    return;
  }

  renderFinishSetupCard(bodyEl, {
    session,
    submitLabel: `Start my ${TRIAL_DAYS}-day free trial`,
    onProvisioned: async () => {
      const created = await fetchProfile(session.user.id);
      if (!created) throw new Error('Your company was created but the profile could not be read. Reload to continue.');
      await enterApp(created);
    },
  });
}

/** Store the signed-in user and hand over to the router, same as a normal login. */
async function enterApp(profile) {
  const { completeLogin } = await import('../login/Login.js');
  const user = sessionUserFromProfile(profile);
  setSessionUser(user);
  applyTheme();
  await completeLogin(user);
}

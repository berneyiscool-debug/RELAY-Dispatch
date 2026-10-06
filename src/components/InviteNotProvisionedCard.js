// ============================================
// RELAY — INVITED ACCOUNT NOT SET UP YET CARD
// ============================================
// Shown when somebody signs in with an account that was invited into an existing
// company but has no profile row: `invite-user` created the Auth account and the
// profile write did not land (an older deployment of that function never wrote
// one at all).
//
// The screen deliberately offers no way to create a company. The account already
// belongs to a tenant — `app_metadata.company_id` was set by the service role —
// so running create_company_and_admin here would hand a team member a second,
// empty company instead of fixing anything (see migration 031/036: provisioning
// only ever trusts the server-side metadata).
//
// Living in components/ so the sign-in gate and the setup page cannot drift apart.

import { router } from '../router.js';
import { supabase } from '../utils/supabase.js';
import { escapeHTML } from '../utils/security.js';

/**
 * Render the card into `targetEl`.
 *
 * @param {HTMLElement} targetEl element whose contents are replaced
 * @param {object} [opts]
 * @param {string} [opts.email] the address that was signed in with, for context
 * @returns {void}
 */
export function renderInviteNotProvisionedCard(targetEl, opts = {}) {
  const email = opts.email || '';

  targetEl.innerHTML = `
    <div class="card" style="max-width:100%;">
      <div class="card-header"><h4>Your account is not set up yet</h4></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:16px;">
        <p style="margin:0;color:var(--text-secondary);">
          ${email
            ? `You signed in as <strong>${escapeHTML(email)}</strong>.`
            : 'You are signed in.'}
          This account belongs to a team on RELAY Cloud, but your team member record was never
          created, so there is nothing to open yet.
        </p>
        <p style="margin:0;color:var(--text-secondary);">
          Ask your administrator to add you again with the same username — that finishes the
          invite and gives you a password you can use. Nothing has been lost.
        </p>
        <div>
          <button class="btn btn-primary" id="invite-not-provisioned-signout">Back to sign in</button>
        </div>
      </div>
    </div>`;

  targetEl.querySelector('#invite-not-provisioned-signout').addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out failed while leaving the not-provisioned screen:', err);
    }
    router.navigate('/login');
  });
}

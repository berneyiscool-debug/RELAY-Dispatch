// ============================================
// RELAY — FINISH SETUP CARD
// ============================================
// "Finish setting up your company": the one form that turns a verified Supabase
// user into a working cloud account.
//
// It exists as a shared component because three different screens reach the same
// dead end — the user is signed in (or signed up) but there is no profile row, so
// there is no company to bill and nothing for the app shell to boot into:
//
//   1. the paywall (`/#/subscribe`) when a signup was interrupted mid-RPC;
//   2. the first sign-in after clicking the verification link;
//   3. the local→cloud upgrade in Settings when confirmation was required.
//
// All three must provision through provisionCloudAccount() (never by writing
// company rows from the client) and must persist the same resume markers
// afterwards, so this is the only place that logic lives.

import { escapeHTML } from '../utils/security.js';
import { bindCompanyNameCheck, validateCompanyName } from '../utils/companyName.js';
import { provisionCloudAccount, readPendingMigration, readPendingSignup, savePendingMigration, savePendingSignup } from '../utils/cloudOnboarding.js';

/**
 * Render the setup form into `targetEl`.
 *
 * @param {HTMLElement} targetEl   element whose contents are replaced
 * @param {object} opts
 * @param {object} opts.session          the live Supabase session (required)
 * @param {object} [opts.pending]        prefill; defaults to the signup marker
 * @param {string} [opts.submitLabel]    defaults to 'Save &amp; continue'
 * @param {(result: {companyId: string, trialEndsAt: string|null}) => any} opts.onProvisioned
 * @returns {{ checker: object, dispose: () => void }}
 */
export function renderFinishSetupCard(targetEl, opts = {}) {
  const session = opts.session;
  const pending = opts.pending || readPendingSignup() || {};
  const submitLabel = opts.submitLabel || 'Save & continue';

  // Prefill from the signup marker first, then the auth record — the marker is
  // what the user actually typed, and it survives the verification round trip.
  const meta = session?.user?.user_metadata || {};
  const companyName = pending.companyName || '';
  const adminName = pending.adminName || meta.name || '';
  const adminPhone = pending.adminPhone || meta.phone || '';

  targetEl.innerHTML = `
    <div class="card" style="max-width:100%;">
      <div class="card-header"><h4>Finish setting up your company</h4></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:16px;">
        <p style="margin:0;color:var(--text-secondary);">
          Signed in as <strong>${escapeHTML(session?.user?.email || '')}</strong>. Check these details — this is
          what your team will see.
        </p>
        <div>
          <label class="form-label" for="finish-company">Business name</label>
          <input class="form-input" id="finish-company" autocomplete="organization"
                 value="${escapeHTML(companyName)}" placeholder="e.g. Acme Electrical" />
          <div id="finish-company-status" style="margin-top:6px;color:var(--text-tertiary);"></div>
        </div>
        <div>
          <label class="form-label" for="finish-name">Your name</label>
          <input class="form-input" id="finish-name" autocomplete="name" value="${escapeHTML(adminName)}" />
        </div>
        <div>
          <label class="form-label" for="finish-phone">Mobile</label>
          <input class="form-input" id="finish-phone" type="tel" autocomplete="tel"
                 value="${escapeHTML(adminPhone)}" placeholder="Optional" />
        </div>
        <div id="finish-error" style="display:none;color:var(--color-danger);"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="finish-submit">${escapeHTML(submitLabel)}</button>
          <button class="btn btn-secondary" id="finish-reload">Reload</button>
        </div>
      </div>
    </div>`;

  const companyInput = targetEl.querySelector('#finish-company');
  const nameInput = targetEl.querySelector('#finish-name');
  const phoneInput = targetEl.querySelector('#finish-phone');
  const statusEl = targetEl.querySelector('#finish-company-status');
  const errorEl = targetEl.querySelector('#finish-error');
  const submitBtn = targetEl.querySelector('#finish-submit');
  const reloadBtn = targetEl.querySelector('#finish-reload');

  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  };

  reloadBtn.addEventListener('click', () => window.location.reload());

  const checker = bindCompanyNameCheck(companyInput, statusEl);
  if (companyName) checker.checkNow();

  let busy = false;
  const submit = async () => {
    if (busy) return;
    const name = (companyInput.value || '').trim();
    const check = validateCompanyName(name);
    if (!check.valid) {
      showError(check.message);
      return;
    }

    busy = true;
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      // The RPC re-checks the name under an advisory lock, so 'unknown' (check
      // endpoint unreachable) is allowed through rather than blocking recovery.
      if ((await checker.checkNow()) === 'taken') {
        throw new Error('That company name is already taken. Please choose another.');
      }

      const { companyId, trialEndsAt } = await provisionCloudAccount({
        userId: session?.user?.id,
        companyName: name,
        adminName: (nameInput.value || '').trim(),
        adminPhone: (phoneInput.value || '').trim(),
        termsAccepted: pending.termsAccepted === true,
      });

      // Re-stamp the resume markers now that the company exists, so a signup that
      // reached payment from here still migrates the local workspace.
      savePendingSignup({ ...pending, companyName: name, companyId });
      const migration = readPendingMigration();
      if (migration) savePendingMigration({ ...migration, companyId });

      checker.dispose();
      if (opts.onProvisioned) await opts.onProvisioned({ companyId, trialEndsAt });
    } catch (err) {
      console.error('Failed to finish company setup:', err);
      showError(err?.message || 'Could not finish setting up your company.');
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
      busy = false;
    }
  };

  submitBtn.addEventListener('click', submit);
  targetEl.querySelectorAll('input').forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
  });

  return { checker, dispose: () => checker.dispose() };
}

// ============================================
// RELAY — CLOUD UPGRADE
// ============================================
// A local workspace has no cloud account, so cloud-only pages stay greyed out in
// the sidebar. Clicking one raises the little upgrade prompt below; its CTA opens
// this migration modal, so every cloud path finishes in the same place.

import { store } from '../data/store.js';
import { router } from '../router.js';
import { showModal } from './Modal.js';
import { escapeHTML } from '../utils/security.js';
import { backupCheckboxHtml, runBackupIfRequested } from '../utils/dataBackup.js';
import { bindCompanyNameCheck, validateCompanyName } from '../utils/companyName.js';
import {
  canonicalAuthEmail,
  clearPendingMigration,
  clearPendingSignup,
  describeSignUpResult,
  readPendingMigration,
  savePendingMigration,
  savePendingSignup,
} from '../utils/cloudOnboarding.js';
import { startSubscribeCheckout } from '../utils/subscription.js';

// Shown on greyed-out, cloud-only nav entries.
export const CLOUD_REQUIRED_TOOLTIP = 'Click to create a Cloud account';

// Canonical list of Settings tabs that need a RELAY Cloud account. The sidebar
// grey-out (Sidebar.js) and the deep-link guard (Settings.js) both read this map,
// so the nav and the router can never disagree about what is cloud-only.
// Keyed by Settings tab id; the value is the label used in the upgrade prompt.
export const CLOUD_ONLY_SETTINGS_TABS = {
  portal: 'The Customer Portal',
  portal_contractor: 'The Contractor Portal',
  payments: 'Online payments',
  email: 'Email & domain',
  users: 'Users',
  user_types: 'User Types & Permissions',
  password_recovery: 'Password Recovery'
};

// Settings tabs that are greyed out for EVERY account type because the feature
// behind them hasn't shipped yet — not an account-type gate, so it must not offer
// the cloud upgrade. Same sidebar grey-out and deep-link guard, but a plain
// "coming soon" explanation. Keyed by Settings tab id; the value is the label.
export const COMING_SOON_TOOLTIP = 'Coming soon';

export const COMING_SOON_SETTINGS_TABS = {
  cost_centers: 'Cost Centers & Xero'
};

const SUBMIT_LABEL = 'Continue to payment';

export function openMigrationModal() {
  // A conversion whose payment was never completed already has a Supabase user
  // and company row. Starting again would collide on the email address, so
  // resume it instead.
  const pendingConversion = readPendingMigration();
  if (pendingConversion) {
    showPendingUpgradeModal(pendingConversion);
    return;
  }

  const modalContent = document.createElement('div');
  const businessName = (store.getSettings().name || '').trim();
  modalContent.innerHTML = `
    <form id="convert-cloud-form" style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; color:var(--color-danger); display:flex; gap:8px;">
        <span class="material-icons-outlined" style="color:var(--color-danger);">warning</span>
        <div>
          <strong>CRITICAL WARNING:</strong> Converting to Cloud Sync is a permanent, one-way transition. Once converted, you cannot revert this profile back to a local/offline account. All data will be migrated to the secure cloud database.
        </div>
      </div>

      <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; border-radius:4px; color:var(--color-info); display:flex; gap:8px;">
        <span class="material-icons-outlined" style="color:var(--color-info);">info</span>
        <div>
          Choose your business name and administrator credentials, then add your payment details on Stripe. Your local data is copied across once the subscription is active.
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Business Name</label>
        <input class="form-input" id="migrate-company-name" required autocomplete="organization" value="${escapeHTML(businessName)}" placeholder="Your business name" />
        <div id="migrate-company-status" style="margin-top:6px; font-size:0.85rem; color:var(--text-tertiary);"></div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Administrator Full Name</label>
        <input class="form-input" id="migrate-admin-name" required placeholder="e.g. John Doe" />
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Administrator Phone Number</label>
        <input class="form-input" id="migrate-admin-phone" required placeholder="e.g. 0412 345 678" />
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Email Address (Username)</label>
        <input class="form-input" type="email" id="migrate-admin-email" required placeholder="e.g. admin@yourcompany.com" />
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Password</label>
        <input class="form-input" type="password" id="migrate-admin-password" required minlength="6" placeholder="At least 6 characters" />
      </div>

      ${backupCheckboxHtml('relay-backup-before-cloud-upgrade')}

      <div id="migration-error" style="display:none; color:var(--color-danger); background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 14px; border-radius:4px; font-weight:500; align-items:center; gap:8px;">
        <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
        <span id="migration-error-text"></span>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">
        <button type="button" class="btn btn-secondary" id="btn-migrate-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary" id="btn-migrate-submit" style="background:var(--color-warning); border-color:var(--color-warning); color:#fff; display:flex; align-items:center; gap:6px;">
          <span class="material-icons-outlined" id="submit-icon" style="font-size:18px;">cloud_done</span>
          <span id="submit-text">${SUBMIT_LABEL}</span>
        </button>
      </div>
    </form>
  `;

  const companyNameWatch = bindCompanyNameCheck(
    modalContent.querySelector('#migrate-company-name'),
    modalContent.querySelector('#migrate-company-status')
  );
  if (businessName) companyNameWatch.checkNow();

  const { close } = showModal({
    title: 'Register & Migrate to Cloud',
    content: modalContent,
    size: 'modal-md',
    onClose: () => companyNameWatch.dispose()
  });

  modalContent.querySelector('#btn-migrate-cancel').addEventListener('click', close);

  const form = modalContent.querySelector('#convert-cloud-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorEl = modalContent.querySelector('#migration-error');
    const errorTextEl = modalContent.querySelector('#migration-error-text');
    const submitBtn = modalContent.querySelector('#btn-migrate-submit');
    const cancelBtn = modalContent.querySelector('#btn-migrate-cancel');
    const submitText = modalContent.querySelector('#submit-text');
    const submitIcon = modalContent.querySelector('#submit-icon');

    const showError = (message) => {
      errorTextEl.textContent = message;
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      submitText.textContent = SUBMIT_LABEL;
      submitIcon.className = 'material-icons-outlined';
      submitIcon.textContent = 'cloud_done';
      submitIcon.style.animation = '';
    };

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    submitText.textContent = 'Preparing...';
    submitIcon.className = 'material-icons-outlined spinner';
    submitIcon.textContent = 'sync';
    submitIcon.style.animation = 'spin 1s linear infinite';

    const companyName = modalContent.querySelector('#migrate-company-name').value.trim();
    const adminName = modalContent.querySelector('#migrate-admin-name').value.trim();
    const adminPhone = modalContent.querySelector('#migrate-admin-phone').value.trim();
    const email = modalContent.querySelector('#migrate-admin-email').value.trim();
    const password = modalContent.querySelector('#migrate-admin-password').value;

    const nameCheck = validateCompanyName(companyName);
    if (!nameCheck.valid) {
      showError(nameCheck.message);
      return;
    }

    // Downloaded before the Stripe detour, so the user keeps a copy of their
    // data even if they never return to finish paying.
    let localAccountId = null;
    try { localAccountId = sessionStorage.getItem('relay_active_account'); } catch (_) { /* blocked storage */ }
    runBackupIfRequested(modalContent, 'relay-backup-before-cloud-upgrade');

    try {
      // 'unknown' (server unreachable) passes through: the RPC re-checks the
      // name under an advisory lock, so a race can never create a duplicate.
      if (await companyNameWatch.checkNow() === 'taken') {
        showError('That company name is already taken. Please choose another.');
        return;
      }

      const settings = store.getSettings();
      settings.name = companyName;
      await store.saveSettings(settings);

      const { supabase } = await import('../utils/supabase.js');

      const authEmail = canonicalAuthEmail(email);
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            name: adminName,
            phone: adminPhone
          }
        }
      });
      if (authErr) throw authErr;

      // Throws when the address is already registered or signup was blocked.
      const { userId, needsConfirmation } = describeSignUpResult({ data: authData, error: authErr });

      // Persisted before anything else can fail so the flow can be resumed after
      // the Stripe round trip, or after an email-confirmation detour.
      const marker = {
        userId,
        companyId: null,
        localAccountId,
        adminEmail: authEmail,
        companyName,
        adminName,
        adminPhone
      };
      savePendingMigration(marker);
      savePendingSignup({ companyName, adminName, adminPhone, email: authEmail, userId });

      if (needsConfirmation) {
        showError('Confirm your email address, then sign in again — we will take you straight to payment.');
        return;
      }

      const { data: companyId, error: rpcError } = await supabase.rpc('create_company_and_admin', {
        user_id: userId,
        company_name: companyName,
        admin_name: adminName,
        admin_phone: adminPhone
      });
      if (rpcError) throw rpcError;

      savePendingMigration({ ...marker, companyId });
      savePendingSignup({ companyName, adminName, adminPhone, email: authEmail, userId, companyId });

      submitText.textContent = 'Opening checkout...';
      await startSubscribeCheckout('cloud');
    } catch (err) {
      console.error('Cloud upgrade failed:', err);
      showError(err.message || 'An error occurred during migration.');
    }
  });
}

/**
 * The conversion is registered but unpaid. Starting over would collide with the
 * Supabase user that already exists, so offer to pick the payment back up.
 */
function showPendingUpgradeModal(pending) {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; border-radius:4px; color:var(--color-info); display:flex; gap:8px;">
        <span class="material-icons-outlined" style="color:var(--color-info);">credit_card</span>
        <div>
          <strong>${escapeHTML(pending.companyName || 'Your company')}</strong> is registered and waiting on a subscription. Add your payment details to finish moving your local data across.
        </div>
      </div>

      <p style="margin:0; color:var(--text-secondary); font-size:0.9rem;">
        You will sign in with <strong>${escapeHTML(pending.adminEmail || '')}</strong> once the subscription is active.
      </p>

      <div style="display:flex; justify-content:space-between; gap:12px; margin-top:4px;">
        <button type="button" class="btn btn-secondary" id="btn-pending-discard">Not now</button>
        <button type="button" class="btn btn-primary" id="btn-pending-finish">Finish your subscription</button>
      </div>
    </div>
  `;

  const { close } = showModal({
    title: 'Finish your Cloud subscription',
    content: modalContent,
    size: 'modal-md'
  });

  modalContent.querySelector('#btn-pending-finish').addEventListener('click', () => {
    close();
    router.navigate('/subscribe');
  });

  modalContent.querySelector('#btn-pending-discard').addEventListener('click', () => {
    // Only the local resume marker is dropped. The cloud account and company
    // stay, so signing in (or Settings → Billing) can still pick payment up.
    clearPendingMigration();
    clearPendingSignup();
    close();
  });
}

// Floating nudge for a local user who clicked a cloud-only page. Kept separate
// from showToast so it can carry a real action button.
const PROMPT_ID = 'cloud-upgrade-prompt';

export function showCloudUpgradePrompt(featureLabel) {
  hideCloudUpgradePrompt();

  const label = featureLabel || 'This feature';
  const prompt = document.createElement('div');
  prompt.id = PROMPT_ID;
  prompt.className = 'cloud-prompt';
  prompt.innerHTML = `
    <span class="material-icons-outlined cloud-prompt-icon" aria-hidden="true">cloud_off</span>
    <div class="cloud-prompt-body">
      <div class="cloud-prompt-title">${escapeHTML(label)} needs a Cloud account</div>
      <div class="cloud-prompt-text">Create a RELAY Cloud account to unlock it — your local data comes with you.</div>
      <div class="cloud-prompt-actions">
        <button type="button" class="btn btn-primary btn-sm" data-cloud-prompt-subscribe>Create a Cloud account</button>
        <button type="button" class="btn btn-secondary btn-sm" data-cloud-prompt-dismiss>Not now</button>
      </div>
    </div>
    <button type="button" class="cloud-prompt-close" data-cloud-prompt-dismiss aria-label="Dismiss">
      <span class="material-icons-outlined" aria-hidden="true">close</span>
    </button>
  `;

  prompt.querySelector('[data-cloud-prompt-subscribe]').addEventListener('click', () => {
    hideCloudUpgradePrompt();
    openMigrationModal();
  });
  prompt.querySelectorAll('[data-cloud-prompt-dismiss]').forEach((btn) => {
    btn.addEventListener('click', () => hideCloudUpgradePrompt());
  });

  // The prompt belongs to the page the user could not open, so drop it as soon
  // as they navigate somewhere else.
  window.addEventListener('hashchange', onPromptNavigate);
  document.addEventListener('keydown', onPromptEscape);
  document.body.appendChild(prompt);
}

function onPromptNavigate() {
  hideCloudUpgradePrompt();
}

function onPromptEscape(e) {
  if (e.key === 'Escape') hideCloudUpgradePrompt();
}

export function hideCloudUpgradePrompt() {
  window.removeEventListener('hashchange', onPromptNavigate);
  document.removeEventListener('keydown', onPromptEscape);
  const existing = document.getElementById(PROMPT_ID);
  if (existing) existing.remove();
}
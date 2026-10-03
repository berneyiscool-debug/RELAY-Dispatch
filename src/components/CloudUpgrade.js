// ============================================
// RELAY — CLOUD UPGRADE
// ============================================
// A local workspace has no cloud account, so cloud-only pages stay greyed out in
// the sidebar. Clicking one raises the little upgrade prompt below; its CTA opens
// this migration modal, so every cloud path finishes in the same place.

import { store } from '../data/store.js';
import { showModal } from './Modal.js';
import { showToast } from './Notifications.js';
import { escapeHTML } from '../utils/security.js';
import { setSessionUser } from '../pages/auth/session.js';
import { backupCheckboxHtml, runBackupIfRequested } from '../utils/dataBackup.js';

export function openMigrationModal() {
  const modalContent = document.createElement('div');
  const expectedName = (store.getSettings().name || '').trim();
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
          Configure your cloud administrator credentials. This username and password will be your new secure login.
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;">${expectedName ? `Type <strong>${escapeHTML(expectedName)}</strong> to confirm` : 'Business Name'}</label>
        <input class="form-input" id="migrate-company-name" required autocomplete="off" placeholder="${escapeHTML(expectedName || 'Your business name')}" />
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
          <span id="submit-text">Register & Start Migration</span>
        </button>
      </div>
    </form>
  `;

  const { close } = showModal({
    title: 'Register & Migrate to Cloud',
    content: modalContent,
    size: 'modal-md'
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

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    submitText.textContent = 'Migrating to Cloud...';
    submitIcon.className = 'material-icons-outlined spinner';
    submitIcon.textContent = 'sync';
    submitIcon.style.animation = 'spin 1s linear infinite';

    const confirmName = modalContent.querySelector('#migrate-company-name').value.trim();
    const adminName = modalContent.querySelector('#migrate-admin-name').value.trim();
    const adminPhone = modalContent.querySelector('#migrate-admin-phone').value.trim();
    const email = modalContent.querySelector('#migrate-admin-email').value.trim();
    const password = modalContent.querySelector('#migrate-admin-password').value;

    try {
      if (!confirmName) {
        throw new Error('Enter your business name to continue.');
      }
      if (expectedName && confirmName !== expectedName) {
        throw new Error('The business name does not match. Type it exactly as shown to confirm.');
      }
      const companyName = confirmName;
      const backupFile = runBackupIfRequested(modalContent, 'relay-backup-before-cloud-upgrade');

      const settings = store.getSettings();
      settings.name = companyName;
      await store.saveSettings(settings);

      const { supabase } = await import('../utils/supabase.js');

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: adminName,
            phone: adminPhone
          }
        }
      });
      if (authErr) throw authErr;

      if (!authData.user) {
        throw new Error('Verification required or signup was blocked. Check your email inbox.');
      }

      const { data: companyId, error: rpcError } = await supabase.rpc('create_company_and_admin', {
        user_id: authData.user.id,
        company_name: companyName,
        admin_name: adminName,
        admin_phone: adminPhone
      });
      if (rpcError) throw rpcError;

      const activeAccountId = sessionStorage.getItem('relay_active_account');
      await store.migrateLocalToCloud(companyId, authData.user.id);

      if (activeAccountId) {
        const localAccountsKey = 'relay_accounts';
        let localAccounts = [];
        try {
          const stored = localStorage.getItem(localAccountsKey);
          if (stored) {
            localAccounts = JSON.parse(stored);
          }
        } catch (e) {
          console.error('Error reading local accounts:', e);
        }
        localAccounts = localAccounts.filter(a => a.id !== activeAccountId);
        localStorage.setItem(localAccountsKey, JSON.stringify(localAccounts));

        store.deleteLocalAccountData(activeAccountId);
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      if (profileErr) throw profileErr;

      const user = {
        id: profile.id,
        companyId: profile.company_id,
        name: profile.name,
        role: profile.role,
        userTypeName: 'Admin',
        userTypeId: `${profile.company_id}_ut_admin`,
        color: profile.color || '#FF5C00'
      };

      setSessionUser(user);
      sessionStorage.removeItem('relay_active_account');

      showToast('Migration completed successfully.', 'success');
      close();

      const summary = document.createElement('div');
      summary.style.cssText = 'line-height:1.6; color:var(--text-primary);';
      summary.innerHTML = `
        <p style="margin-bottom:12px">Your profile now runs on RELAY Cloud, and every local record has been copied across.</p>
        <ul style="margin:0 0 12px 18px; color:var(--text-secondary); line-height:1.7;">
          <li>Signed in as <strong>${escapeHTML(email)}</strong></li>
          <li>Company: <strong>${escapeHTML(companyName)}</strong></li>
          ${backupFile ? `<li>A copy of your local data was saved as <strong>${escapeHTML(backupFile)}</strong></li>` : ''}
        </ul>
        <p style="color:var(--text-secondary)">Next: add team members from Settings → Users, or open RELAY on another device and sign in with the same email address.</p>
      `;

      showModal({
        title: 'Migration Complete',
        content: summary,
        size: 'modal-md',
        // The store is already reading from the cloud company, so reload on any dismissal
        onClose: () => {
          window.location.hash = '#/';
          window.location.reload();
        },
        actions: [
          { label: 'Open RELAY', className: 'btn-primary', onClick: (closeSummary) => closeSummary() }
        ]
      });

    } catch (err) {
      console.error('Migration failed:', err);
      errorTextEl.textContent = err.message || 'An error occurred during migration.';
      errorEl.style.display = 'flex';

      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      submitText.textContent = 'Register & Start Migration';
      submitIcon.className = 'material-icons-outlined';
      submitIcon.textContent = 'cloud_done';
      submitIcon.style.animation = '';
    }
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
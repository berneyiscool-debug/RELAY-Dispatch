import { escapeHTML } from '../../utils/security.js';
import { hashPassword } from './password.js';

/**
 * First-run password setup for a local user whose record has no password yet.
 *
 * Local accounts no longer ship with a shared default password, so the first
 * sign-in for a password-less user becomes "choose your password" instead of a
 * wrong-password error.
 *
 * @param {HTMLElement} container      root element to render into
 * @param {object}      options
 * @param {string}      options.displayName  name shown back to the user
 * @param {Function}    options.onSubmit     receives the hashed password
 * @param {Function}    [options.onCancel]   returns to the caller's sign-in form
 */
export function renderSetLocalPassword(container, { displayName = '', onSubmit, onCancel } = {}) {
  const who = displayName
    ? `<strong>${escapeHTML(displayName)}</strong> doesn't have a password yet.`
    : 'This account doesn\'t have a password yet.';

  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo-icon" style="background:var(--color-warning-bg); border-radius:50%; width:48px; height:48px;">
            <span class="material-icons-outlined text-warning" style="font-size: 28px;">lock_reset</span>
          </div>
          <h1 class="auth-title" style="margin-top:12px;">Set Your Password</h1>
          <p class="auth-subtitle">${who} Choose one now — you will use it every time you sign in on this device.</p>
        </div>

        <div id="set-pwd-error" class="auth-error" style="display: none;">
          <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
          <span id="set-pwd-error-text"></span>
        </div>

        <form id="set-pwd-form" class="auth-form">
          <div class="auth-form-group">
            <label class="auth-form-label">New Password</label>
            <div class="auth-input-wrapper">
              <span class="material-icons-outlined">lock</span>
              <input type="password" id="set-pwd-new" class="auth-form-input" placeholder="Min. 6 characters" required>
              <button type="button" class="auth-toggle-pwd" id="btn-toggle-set-pwd" title="Toggle password visibility">
                <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
              </button>
            </div>
          </div>

          <div class="auth-form-group">
            <label class="auth-form-label">Confirm Password</label>
            <div class="auth-input-wrapper">
              <span class="material-icons-outlined">lock</span>
              <input type="password" id="set-pwd-confirm" class="auth-form-input" placeholder="Re-enter password" required>
              <button type="button" class="auth-toggle-pwd" id="btn-toggle-set-pwd-confirm" title="Toggle password visibility">
                <span class="material-icons-outlined auth-toggle-pwd-icon">visibility</span>
              </button>
            </div>
          </div>

          <button type="submit" id="btn-set-pwd-submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:15px; justify-content:center; margin-top:8px;">
            Save Password & Sign In
          </button>

          ${onCancel ? `
          <button type="button" id="btn-set-pwd-cancel" class="btn btn-secondary" style="width:100%; padding:12px; font-size:14px; justify-content:center; margin-top:8px;">
            Back to Sign In
          </button>` : ''}
        </form>
      </div>
    </div>
  `;

  const wireToggle = (inputId, toggleId) => {
    const input = container.querySelector(inputId);
    const toggle = container.querySelector(toggleId);
    if (!input || !toggle) return;
    toggle.addEventListener('click', () => {
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      toggle.innerHTML = `<span class="material-icons-outlined auth-toggle-pwd-icon">${isPwd ? 'visibility_off' : 'visibility'}</span>`;
    });
  };
  wireToggle('#set-pwd-new', '#btn-toggle-set-pwd');
  wireToggle('#set-pwd-confirm', '#btn-toggle-set-pwd-confirm');

  const cancelBtn = container.querySelector('#btn-set-pwd-cancel');
  if (cancelBtn && onCancel) cancelBtn.addEventListener('click', () => onCancel());

  container.querySelector('#set-pwd-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#set-pwd-error');
    const errorTextEl = container.querySelector('#set-pwd-error-text');
    const submitBtn = container.querySelector('#btn-set-pwd-submit');
    errorEl.style.display = 'none';

    const newPassword = container.querySelector('#set-pwd-new').value;
    const confirmPassword = container.querySelector('#set-pwd-confirm').value;

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
    submitBtn.innerText = 'Saving...';

    try {
      await onSubmit(await hashPassword(newPassword));
    } catch (err) {
      errorTextEl.innerText = err?.message || 'Could not save your password. Please try again.';
      errorEl.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Password & Sign In';
    }
  });

  container.querySelector('#set-pwd-new').focus();
}

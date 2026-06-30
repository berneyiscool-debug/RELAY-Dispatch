// ============================================
// RELAY — MY PROFILE PAGE
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { showToast } from '../components/Notifications.js';
import { escapeHTML } from '../utils/security.js';
import { supabase } from '../utils/supabase.js';
import { storageGet, storageSet } from '../utils/tauriStore.js';

// Helper to hash password using SHA-256 Web Crypto API
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const PRESET_AVATAR_COLORS = [
  '#FF5C00', // Orange
  '#1B6DE0', // Blue
  '#16A34A', // Green
  '#9333EA', // Purple
  '#DC2626', // Red
  '#D97706', // Amber
  '#0891B2', // Cyan
  '#DB2777', // Pink
];

export function renderProfile(container) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const loginMode = sessionStorage.getItem('relay_login_mode') || 'cloud'; // 'local' | 'local_multiuser' | 'cloud'
  
  let activeAvatarColor = currentUser.color || '#FF5C00';
  let activeRecoveryQuestion = '';
  let activeAccountObj = null;
  let accounts = [];

  const loadLocalAdminProfile = async () => {
    if (loginMode === 'local') {
      accounts = await storageGet('relay_accounts') || [];
      activeAccountObj = accounts.find(a => a.id === currentUser.companyId);
      if (activeAccountObj) {
        activeRecoveryQuestion = activeAccountObj.recoveryQuestion || '';
        activeAvatarColor = activeAccountObj.avatarColor || activeAvatarColor;
      }
    }
  };

  const init = async () => {
    await loadLocalAdminProfile();
    render();
  };

  const render = () => {
    const initials = currentUser.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';
    
    // Check user type or role display
    let displayRole = currentUser.role || 'User';
    if (displayRole === 'admin') displayRole = 'Administrator';
    else if (displayRole === 'manager') displayRole = 'Manager';
    else if (displayRole === 'technician') displayRole = 'Technician';
    else if (displayRole === 'office') displayRole = 'Office Staff';

    const isLocalAdmin = loginMode === 'local';
    const isCloud = loginMode === 'cloud';

    let usernameOrEmail = '';
    if (isCloud) {
      usernameOrEmail = currentUser.email || 'Cloud Account';
    } else if (isLocalAdmin) {
      usernameOrEmail = 'Local Administrator';
    } else {
      // Local multiuser technician
      const tech = store.getById('technicians', currentUser.id) || {};
      usernameOrEmail = tech.username || tech.email || 'Local User';
    }

    container.innerHTML = `
      <style>
        .profile-container {
          max-width: 900px;
          margin: 0 auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .profile-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
        }
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
        .profile-card {
          background: var(--card-bg, rgba(255, 255, 255, 0.4));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .profile-avatar-preview {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 auto 16px auto;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: background-color 0.2s;
        }
        .color-picker-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
          margin-top: 8px;
        }
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .color-swatch:hover {
          transform: scale(1.15);
        }
        .color-swatch.active {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 2px var(--card-bg);
        }
      </style>

      <div class="profile-container">
        <div class="profile-header">
          <span class="material-icons-outlined" style="font-size: 28px; color: var(--color-primary);">account_circle</span>
          <h2 class="profile-title">My Account</h2>
        </div>

        <div class="profile-grid">
          <!-- Left: User details -->
          <div class="profile-card">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Personal Information</h3>
            
            <div class="profile-avatar-preview" id="profile-avatar" style="background-color: ${activeAvatarColor}">
              ${initials}
            </div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="profile-name" class="form-input" value="${escapeHTML(currentUser.name || '')}" placeholder="Your Full Name" required />
            </div>

            <div class="form-group">
              <label class="form-label">Username / Email</label>
              <input type="text" class="form-input" value="${escapeHTML(usernameOrEmail)}" disabled style="background: rgba(0, 0, 0, 0.04); color: var(--text-muted); cursor: not-allowed;" />
            </div>

            <div class="form-group">
              <label class="form-label">Role / Access Type</label>
              <input type="text" class="form-input" value="${escapeHTML(displayRole)}" disabled style="background: rgba(0, 0, 0, 0.04); color: var(--text-muted); cursor: not-allowed;" />
            </div>

            <div class="form-group">
              <label class="form-label">Avatar Color</label>
              <div class="color-picker-grid">
                ${PRESET_AVATAR_COLORS.map(color => `
                  <div class="color-swatch ${color === activeAvatarColor ? 'active' : ''}" data-color="${color}" style="background-color: ${color}"></div>
                `).join('')}
              </div>
            </div>

            <button class="btn btn-primary" id="btn-save-profile-details" style="margin-top: 12px; justify-content: center;">
              Save Details
            </button>
          </div>

          <!-- Right: Password resets & Recovery options -->
          <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
            
            <!-- Card 1: Change Password / PIN -->
            <div class="profile-card">
              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Security</h3>
              <p style="margin: 0 0 12px 0; font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">
                ${isLocalAdmin ? 'Change the PIN code used to lock and unlock your local business profile on this machine.' : 'Update your credentials used to sign in to your company.'}
              </p>

              <div class="form-group">
                <label class="form-label">${isLocalAdmin ? 'New PIN / Password' : 'New Password'}</label>
                <input type="password" id="profile-new-pwd" class="form-input" placeholder="${isLocalAdmin ? 'Leave blank to remove PIN protection' : 'Minimum 6 characters'}" minlength="${isLocalAdmin ? 0 : 6}" />
              </div>

              <div class="form-group">
                <label class="form-label">Confirm ${isLocalAdmin ? 'PIN / Password' : 'Password'}</label>
                <input type="password" id="profile-confirm-pwd" class="form-input" placeholder="Confirm new password" />
              </div>

              <button class="btn btn-primary" id="btn-update-profile-password" style="margin-top: 8px; justify-content: center;">
                Update ${isLocalAdmin ? 'PIN' : 'Password'}
              </button>
            </div>

            <!-- Card 2: Local Recovery (Local Admin Only) -->
            ${isLocalAdmin ? `
              <div class="profile-card">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Secret Recovery Question</h3>
                <p style="margin: 0 0 12px 0; font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">
                  Configure a secret question to reset your PIN if you ever forget it. The answer is stored securely.
                </p>

                <div class="form-group">
                  <label class="form-label">Recovery Question</label>
                  <select id="profile-recovery-select" class="form-select" style="width: 100%;">
                    <option value="What was the name of your first pet?" ${activeRecoveryQuestion === 'What was the name of your first pet?' ? 'selected' : ''}>What was the name of your first pet?</option>
                    <option value="In what city or town did your parents meet?" ${activeRecoveryQuestion === 'In what city or town did your parents meet?' ? 'selected' : ''}>In what city or town did your parents meet?</option>
                    <option value="What was the name of your first school?" ${activeRecoveryQuestion === 'What was the name of your first school?' ? 'selected' : ''}>What was the name of your first school?</option>
                    <option value="What was your favorite childhood food?" ${activeRecoveryQuestion === 'What was your favorite childhood food?' ? 'selected' : ''}>What was your favorite childhood food?</option>
                    <option value="custom" ${activeRecoveryQuestion && !['What was the name of your first pet?', 'In what city or town did your parents meet?', 'What was the name of your first school?', 'What was your favorite childhood food?'].includes(activeRecoveryQuestion) ? 'selected' : ''}>Write a custom question...</option>
                  </select>
                </div>

                <div class="form-group" id="profile-recovery-custom-group" style="display: ${activeRecoveryQuestion && !['What was the name of your first pet?', 'In what city or town did your parents meet?', 'What was the name of your first school?', 'What was your favorite childhood food?'].includes(activeRecoveryQuestion) ? 'block' : 'none'};">
                  <label class="form-label">Custom Question</label>
                  <input type="text" id="profile-recovery-custom-question" class="form-input" placeholder="Type your custom question" value="${escapeHTML(!['What was the name of your first pet?', 'In what city or town did your parents meet?', 'What was the name of your first school?', 'What was your favorite childhood food?'].includes(activeRecoveryQuestion) ? activeRecoveryQuestion : '')}" />
                </div>

                <div class="form-group">
                  <label class="form-label">Recovery Answer</label>
                  <input type="password" id="profile-recovery-answer" class="form-input" placeholder="Type answer (leave blank to keep current)" />
                </div>

                <button class="btn btn-primary" id="btn-update-recovery-question" style="margin-top: 8px; justify-content: center;">
                  Save Recovery Settings
                </button>
              </div>
            ` : ''}

          </div>
        </div>
      </div>
    `;

    attachListeners();
  };

  const attachListeners = () => {
    // 1. Color Picker
    const swatches = container.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        activeAvatarColor = swatch.dataset.color;
        
        const avatarPreview = container.querySelector('#profile-avatar');
        if (avatarPreview) {
          avatarPreview.style.backgroundColor = activeAvatarColor;
        }
      });
    });

    // 2. Custom Recovery Question Trigger
    const selectEl = container.querySelector('#profile-recovery-select');
    const customGroup = container.querySelector('#profile-recovery-custom-group');
    if (selectEl && customGroup) {
      selectEl.addEventListener('change', () => {
        customGroup.style.display = selectEl.value === 'custom' ? 'block' : 'none';
      });
    }

    // 3. Save Profile Details
    container.querySelector('#btn-save-profile-details').addEventListener('click', async () => {
      const name = container.querySelector('#profile-name').value.trim();
      if (!name) {
        showToast('Please enter your name.', 'error');
        return;
      }

      // Update local storage currentUser first
      currentUser.name = name;
      currentUser.color = activeAvatarColor;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      try {
        if (loginMode === 'cloud') {
          // Cloud Supabase User Profile Update
          const { error } = await supabase.auth.updateUser({
            data: { name: name }
          });
          if (error) throw error;
          
          // Write back to profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ name: name, color: activeAvatarColor })
            .eq('id', currentUser.id);
            
          if (profileError) throw profileError;

        } else if (loginMode === 'local') {
          // Local Admin Profile details
          if (activeAccountObj) {
            activeAccountObj.businessName = name; // sync businessName with updated name
            activeAccountObj.avatarColor = activeAvatarColor;
            await storageSet('relay_accounts', accounts);
          }
        } else {
          // Local Multi-user Technician update
          store.update('technicians', currentUser.id, {
            name: name,
            color: activeAvatarColor
          });
        }

        // Notify TopBar to reload avatar/name
        window.dispatchEvent(new CustomEvent('fieldforge-profile-updated'));

        showToast('Profile details updated successfully.', 'success');
        render();
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Failed to save profile details.', 'error');
      }
    });

    // 4. Update Password / PIN
    container.querySelector('#btn-update-profile-password').addEventListener('click', async () => {
      const newPwd = container.querySelector('#profile-new-pwd').value;
      const confirmPwd = container.querySelector('#profile-confirm-pwd').value;

      if (loginMode !== 'local' && (!newPwd || newPwd.length < 6)) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      if (newPwd !== confirmPwd) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      try {
        if (loginMode === 'cloud') {
          // Supabase Password Update
          const { error } = await supabase.auth.updateUser({
            password: newPwd
          });
          if (error) throw error;

        } else if (loginMode === 'local') {
          // Profile PIN update
          if (activeAccountObj) {
            if (newPwd) {
              activeAccountObj.hasPassword = true;
              activeAccountObj.passwordHash = await hashPassword(newPwd);
            } else {
              activeAccountObj.hasPassword = false;
              activeAccountObj.passwordHash = null;
            }
            await storageSet('relay_accounts', accounts);
          }
        } else {
          // Multiuser Offline Password update
          store.update('technicians', currentUser.id, {
            password: newPwd
          });
        }

        container.querySelector('#profile-new-pwd').value = '';
        container.querySelector('#profile-confirm-pwd').value = '';
        
        showToast(loginMode === 'local' ? 'PIN code updated successfully.' : 'Password updated successfully.', 'success');
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Failed to update security credentials.', 'error');
      }
    });

    // 5. Update Recovery Settings (Local Admin Only)
    const btnUpdateRecovery = container.querySelector('#btn-update-recovery-question');
    if (btnUpdateRecovery) {
      btnUpdateRecovery.addEventListener('click', async () => {
        const selectQ = container.querySelector('#profile-recovery-select').value;
        const customQ = container.querySelector('#profile-recovery-custom-question').value.trim();
        const answer = container.querySelector('#profile-recovery-answer').value.trim().toLowerCase();

        const recoveryQ = selectQ === 'custom' ? customQ : selectQ;
        if (!recoveryQ) {
          showToast('Please set a recovery question.', 'error');
          return;
        }

        if (activeAccountObj) {
          activeAccountObj.recoveryQuestion = recoveryQ;
          if (answer) {
            activeAccountObj.recoveryAnswerHash = await hashPassword(answer);
          }
          await storageSet('relay_accounts', accounts);
          
          container.querySelector('#profile-recovery-answer').value = '';
          showToast('Security recovery settings saved successfully.', 'success');
          render();
        }
      });
    }
  };

  init();
}

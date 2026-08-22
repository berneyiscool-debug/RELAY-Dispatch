// ============================================
// RELAY — MY PROFILE PAGE
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { showToast } from '../components/Notifications.js';
import { escapeHTML } from '../utils/security.js';
import { supabase } from '../utils/supabase.js';
import { storageGet, storageSet } from '../utils/tauriStore.js';
import { FLAGS } from '../utils/flags.js';

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

// Canvas Image Compression helper
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

export function renderProfile(container) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const loginMode = localStorage.getItem('relay_login_mode') || 'cloud'; // 'local' | 'local_multiuser' | 'cloud'
  
  let activeAvatarColor = currentUser.color || '#FF5C00';
  let activeRecoveryQuestion = '';
  let activeAccountObj = null;
  let accounts = [];
  let uploadedAvatarUrl = currentUser.avatarUrl || null;
  const myStartLocation = FLAGS.maps ? (store.getById('technicians', currentUser.id)?.startLocation || null) : null;

  const loadProfileAvatar = async () => {
    if (loginMode === 'local') {
      accounts = await storageGet('relay_accounts') || [];
      activeAccountObj = accounts.find(a => a.id === currentUser.companyId);
      if (activeAccountObj) {
        activeRecoveryQuestion = activeAccountObj.recoveryQuestion || '';
        activeAvatarColor = activeAccountObj.avatarColor || activeAvatarColor;
        uploadedAvatarUrl = activeAccountObj.avatarUrl || null;
      }
    } else if (loginMode === 'local_multiuser') {
      const tech = store.getById('technicians', currentUser.id);
      if (tech) {
        uploadedAvatarUrl = tech.avatarUrl || null;
      }
    } else {
      uploadedAvatarUrl = currentUser.avatarUrl || null;
    }
  };

  const init = async () => {
    await loadProfileAvatar();
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

    const factsheetKey = `relay_factsheet_${currentUser.id || 'default'}`;
    const enabledKey = `relay_factsheet_enabled_${currentUser.id || 'default'}`;
    const factsheetVal = localStorage.getItem(factsheetKey) || '';
    const memoryEnabled = localStorage.getItem(enabledKey) !== 'false';

    container.innerHTML = `
      <style>
        .profile-container {
          max-width: 900px;
          margin: 0 auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
      <style>
        .profile-container {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .profile-section {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          background: var(--card-bg);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .profile-section-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .profile-section-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .profile-section-desc {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin: 0;
        }
        .profile-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          max-width: 800px;
        }
        .profile-avatar-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar-preview {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .color-picker-grid {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .color-swatch {
          width: 22px;
          height: 22px;
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
        .profile-avatar-preview:hover .avatar-hover-overlay {
          opacity: 1 !important;
        }
      </style>

      <div class="profile-container">
        <div class="page-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size: 20px; color: var(--color-primary);">account_circle</span>
            <h1 style="font-size:var(--font-size-xl); margin:0;">My Account</h1>
          </div>
        </div>

        <!-- Section 1: Personal Information -->
        <div class="profile-section">
          <div class="profile-section-header">
            <h2 class="profile-section-title">Personal Information</h2>
            <p class="profile-section-desc">Manage your public profile, display name, and avatar settings.</p>
          </div>
          
          <div class="profile-avatar-row">
            <div class="profile-avatar-preview" id="profile-avatar" style="background-color: ${activeAvatarColor};">
              ${uploadedAvatarUrl 
                ? `<img src="${uploadedAvatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" id="profile-avatar-img" />`
                : escapeHTML(initials)
              }
              <div class="avatar-hover-overlay" style="
                position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6);
                display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.2s; color: #fff; font-size: 10px; font-weight: 600;
                pointer-events: none;
              ">
                Upload
              </div>
            </div>
            <input type="file" id="profile-avatar-input" accept="image/*" style="display: none;" />
            
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; gap:10px; align-items:center;">
                <button class="btn btn-secondary btn-sm" id="btn-trigger-upload" onclick="document.getElementById('profile-avatar-input').click()">Upload Photo</button>
                <a href="#" id="link-remove-avatar" style="color: var(--color-danger); text-decoration: none; font-size: 11px; display: ${uploadedAvatarUrl ? 'inline-block' : 'none'};">Remove Photo</a>
              </div>
              <div class="color-picker-grid">
                ${PRESET_AVATAR_COLORS.map(color => `
                  <div class="color-swatch ${color === activeAvatarColor ? 'active' : ''}" data-color="${color}" style="background-color: ${color}"></div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="profile-form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="profile-name" class="form-input" value="${escapeHTML(currentUser.name || '')}" placeholder="Your Full Name" required />
            </div>

            <div class="form-group">
              <label class="form-label">Username / Email</label>
              <input type="text" class="form-input" value="${escapeHTML(usernameOrEmail)}" disabled style="background: var(--bg-color); color: var(--text-secondary); cursor: not-allowed;" />
            </div>

            <div class="form-group">
              <label class="form-label">Role / Access Type</label>
              <input type="text" class="form-input" value="${escapeHTML(displayRole)}" disabled style="background: var(--bg-color); color: var(--text-secondary); cursor: not-allowed;" />
            </div>
          </div>

          <div style="max-width:800px; display:flex; justify-content:flex-end;">
            <button class="btn btn-primary btn-sm" id="btn-save-profile-details">
              Save Details
            </button>
          </div>
        </div>

        <!-- Section 2: Security -->
        <div class="profile-section">
          <div class="profile-section-header">
            <h2 class="profile-section-title">Security</h2>
            <p class="profile-section-desc">${isLocalAdmin ? 'Change the PIN code used to lock and unlock your local business profile on this machine.' : 'Update your credentials used to sign in to your company.'}</p>
          </div>

          <div class="profile-form-grid">
            <div class="form-group">
              <label class="form-label">${isLocalAdmin ? 'New PIN / Password' : 'New Password'}</label>
              <input type="password" id="profile-new-pwd" class="form-input" placeholder="${isLocalAdmin ? 'Leave blank to remove PIN protection' : 'Minimum 6 characters'}" minlength="${isLocalAdmin ? 0 : 6}" />
            </div>

            <div class="form-group">
              <label class="form-label">Confirm ${isLocalAdmin ? 'PIN / Password' : 'Password'}</label>
              <input type="password" id="profile-confirm-pwd" class="form-input" placeholder="Confirm new password" />
            </div>
          </div>

          <div style="max-width:800px; display:flex; justify-content:flex-end;">
            <button class="btn btn-primary btn-sm" id="btn-update-profile-password">
              Update ${isLocalAdmin ? 'PIN' : 'Password'}
            </button>
          </div>
        </div>

        <!-- Section 3: Dispatch Start Location -->
        ${FLAGS.maps ? `
          <div class="profile-section">
            <div class="profile-section-header">
              <h2 class="profile-section-title">Dispatch Start Location</h2>
              <p class="profile-section-desc">Where your day's driving starts and ends for route planning. Leave blank to use company office.</p>
            </div>
            <div class="profile-form-grid">
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Start Address</label>
                <input type="text" id="profile-start-location" class="form-input"
                  placeholder="Company office (default)" value="${escapeHTML(myStartLocation?.address || '')}" />
                <div id="profile-start-location-hint" style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">
                  ${myStartLocation?.address ? 'Custom start location set.' : 'Currently using company office address.'}
                </div>
              </div>
            </div>
            <div style="max-width:800px; display:flex; justify-content:flex-end;">
              <button class="btn btn-primary btn-sm" id="btn-save-start-location">
                Save Start Location
              </button>
            </div>
          </div>` : ''}

        <!-- Section 4: Local Recovery (Local Admin Only) -->
        ${isLocalAdmin ? `
          <div class="profile-section">
            <div class="profile-section-header">
              <h2 class="profile-section-title">Secret Recovery Question</h2>
              <p class="profile-section-desc">Configure a secret question to reset your PIN if you ever forget it.</p>
            </div>

            <div class="profile-form-grid">
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
            </div>

            <div style="max-width:800px; display:flex; justify-content:flex-end;">
              <button class="btn btn-primary btn-sm" id="btn-update-recovery-question">
                Save Recovery Settings
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Section 5: AI Co-Pilot Memory -->
        <div class="profile-section">
          <div class="profile-section-header">
            <h2 class="profile-section-title">AI Co-Pilot Memory (Learned Profile)</h2>
            <p class="profile-section-desc">Maintained automatically during conversations to customize co-pilot interactions around your work patterns.</p>
          </div>
          
          <div style="max-width:800px;">
            <div class="form-group">
              <label class="switch-container" style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12px;">
                <input type="checkbox" id="profile-ai-enabled" ${memoryEnabled ? 'checked' : ''} style="width:15px; height:15px; cursor:pointer;" />
                <strong>Make my day easier</strong>
              </label>
              <div style="font-size:11px; margin-top:2px; margin-left:23px; color: var(--text-secondary);">
                Allows Relay to automatically learn your preferences, default assignees, and work patterns during chats.
              </div>
            </div>

            <div class="form-group" id="profile-factsheet-group" style="margin-top: 12px; display: ${memoryEnabled ? 'block' : 'none'};">
              <label class="form-label">Personal Factsheet Context</label>
              <textarea class="form-input" id="profile-ai-factsheet" rows="4" style="font-family:inherit; resize:vertical; font-size:11.5px;" placeholder="Write down your preferences here (e.g. 'I prefer scheduling HVAC jobs to John Doe on Mondays').">${escapeHTML(factsheetVal)}</textarea>
              <p style="font-size:10.5px; margin-top:4px; color: var(--text-tertiary);">You can edit this factsheet manually here, or tell Relay to remember facts during your chats.</p>
            </div>
          </div>

          <div style="max-width:800px; display:flex; justify-content:flex-end;">
            <button class="btn btn-primary btn-sm" id="btn-save-profile-factsheet">
              Save Memory Settings
            </button>
          </div>
        </div>

      </div>
    `;

    attachListeners();
  };

  const attachListeners = () => {
    // Image Upload Click Trigger and Change Handler
    const avatarDiv = container.querySelector('#profile-avatar');
    const fileInput = container.querySelector('#profile-avatar-input');
    const removeLink = container.querySelector('#link-remove-avatar');

    if (avatarDiv && fileInput) {
      avatarDiv.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
          uploadedAvatarUrl = await compressImage(file);
          
          // Update preview visually immediately
          avatarDiv.innerHTML = `
            <img src="${uploadedAvatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" id="profile-avatar-img" />
            <div class="avatar-hover-overlay" style="
              position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6);
              display: flex; align-items: center; justify-content: center;
              opacity: 0; transition: opacity 0.2s; color: #fff; font-size: 11px; font-weight: 600;
              pointer-events: none;
            ">
              Upload Photo
            </div>
          `;
          if (removeLink) removeLink.style.display = 'inline-block';
        } catch (err) {
          console.error(err);
          showToast('Failed to process image.', 'error');
        }
      });
    }

    if (removeLink) {
      removeLink.addEventListener('click', (e) => {
        e.preventDefault();
        uploadedAvatarUrl = null;
        fileInput.value = ''; // Reset input selection
        
        // Reset preview back to initials
        const initials = currentUser.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';
        if (avatarDiv) {
          avatarDiv.innerHTML = `
            ${escapeHTML(initials)}
            <div class="avatar-hover-overlay" style="
              position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6);
              display: flex; align-items: center; justify-content: center;
              opacity: 0; transition: opacity 0.2s; color: #fff; font-size: 11px; font-weight: 600;
              pointer-events: none;
            ">
              Upload Photo
            </div>
          `;
        }
        removeLink.style.display = 'none';
      });
    }

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

      // Update local storage currentUser
      currentUser.name = name;
      currentUser.color = activeAvatarColor;
      currentUser.avatarUrl = uploadedAvatarUrl;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      try {
        if (loginMode === 'cloud') {
          // Cloud Supabase User Profile Update
          const { error } = await supabase.auth.updateUser({
            data: { name: name, avatarUrl: uploadedAvatarUrl }
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
            activeAccountObj.avatarUrl = uploadedAvatarUrl;
            await storageSet('relay_accounts', accounts);
          }
        } else {
          // Local Multi-user Technician update
          store.update('technicians', currentUser.id, {
            name: name,
            color: activeAvatarColor,
            avatarUrl: uploadedAvatarUrl
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
    // v1.3 maps: save per-user dispatch start location (element only exists when flag is on)
    container.querySelector('#btn-save-start-location')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-save-start-location');
      const hint = container.querySelector('#profile-start-location-hint');
      const address = container.querySelector('#profile-start-location').value.trim();
      btn.disabled = true;
      try {
        if (!address) {
          await store.setStartLocation(null);
          if (hint) hint.textContent = 'Currently using the company office address.';
          showToast('Start location cleared — using company office', 'success');
          return;
        }
        const { geocodeAddress } = await import('../utils/geocode.js');
        const geo = await geocodeAddress(address);
        if (!geo) {
          showToast('Could not find that address — check it and try again', 'error');
          return;
        }
        await store.setStartLocation({ address: geo.formattedAddress || address, geo: { lat: geo.lat, lng: geo.lng, formattedAddress: geo.formattedAddress, placeId: geo.placeId } });
        container.querySelector('#profile-start-location').value = geo.formattedAddress || address;
        if (hint) hint.textContent = 'Custom start location set.';
        showToast('Start location saved', 'success');
      } catch (e) {
        // setStartLocation already toasts DB errors
      } finally {
        btn.disabled = false;
      }
    });

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

    // 6. Save AI Profile Factsheet & Enabled settings
    const enabledCheckbox = container.querySelector('#profile-ai-enabled');
    const factsheetGroup = container.querySelector('#profile-factsheet-group');
    const factsheetTextarea = container.querySelector('#profile-ai-factsheet');
    const btnSaveFactsheet = container.querySelector('#btn-save-profile-factsheet');

    if (enabledCheckbox && factsheetGroup) {
      enabledCheckbox.addEventListener('change', (e) => {
        factsheetGroup.style.display = e.target.checked ? 'block' : 'none';
      });
    }

    if (btnSaveFactsheet) {
      btnSaveFactsheet.addEventListener('click', () => {
        const enabled = enabledCheckbox.checked;

        const factsheetKey = `relay_factsheet_${currentUser.id || 'default'}`;
        const enabledKey = `relay_factsheet_enabled_${currentUser.id || 'default'}`;

        localStorage.setItem(enabledKey, String(enabled));
        if (!enabled) {
          localStorage.removeItem(factsheetKey);
          if (factsheetTextarea) {
            factsheetTextarea.value = '';
          }
        } else {
          if (factsheetTextarea) {
            localStorage.setItem(factsheetKey, factsheetTextarea.value.trim());
          }
        }

        window.dispatchEvent(new Event('storage'));
        showToast('AI memory settings saved successfully.', 'success');
      });
    }
  };

  init();
}

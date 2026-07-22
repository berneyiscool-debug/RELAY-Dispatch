// ============================================
// SIMPRO CLONE — SETTINGS PAGE
// ============================================

import { store } from '../data/store.js';
import { showToast } from '../components/Notifications.js';
import { showModal } from '../components/Modal.js';
import { MODULE_PERMS } from '../utils/permissions.js';
import { escapeHTML } from '../utils/security.js';
import { router } from '../router.js';
import { seedMinimalData, seedData } from '../data/seed.js';
import { getPrintStyles, generateDocument } from '../components/PrintPreview.js';
import { FLAGS } from '../utils/flags.js';
import { applyTheme, THEMES } from '../utils/theme.js';
import { storageGet, storageSet } from '../utils/tauriStore.js';

// Compress uploaded images using Canvas to avoid huge Base64 data payloads
function compressImage(dataUrl, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(dataUrl);
      return;
    }
    // SVG vectors are already lightweight; do not compress them
    if (dataUrl.startsWith('data:image/svg+xml')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const isPng = dataUrl.includes('image/png');
      const format = isPng ? 'image/png' : 'image/jpeg';
      const quality = isPng ? undefined : 0.85;

      resolve(canvas.toDataURL(format, quality));
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

// Helper to hash password using SHA-256 Web Crypto API
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Build a permissions array with all granular keys
function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

// Helper to render visual timeline
function renderTimelineHtml(activeHours = []) {
  const hours = ['12am', '4am', '8am', '12pm', '4pm', '8pm', '12am'];
  
  // Format tooltip time range
  const formatTimeRange = (i) => {
    const pad = (num) => String(num).padStart(2, '0');
    const sh = Math.floor(i / 2);
    const sm = (i % 2) * 30;
    const eh = Math.floor((i + 1) / 2);
    const em = ((i + 1) % 2) * 30;
    return `${pad(sh)}:${pad(sm)} – ${pad(eh)}:${pad(em)}`;
  };

  let blocksHtml = '';
  for (let i = 0; i < 48; i++) {
    const isActive = activeHours.includes(i);
    blocksHtml += `
      <div class="timeline-block ${isActive ? 'active' : ''}" 
           data-slot="${i}" 
           title="${formatTimeRange(i)}"
      ></div>
    `;
  }

  return `
    <div class="form-group timeline-container" style="margin:0; grid-column:1/-1; user-select:none; position:relative;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:600; display:flex; align-items:center; gap:6px;">
          <span class="material-icons-outlined" style="font-size:16px; color:var(--color-primary)">schedule</span>
          Active Hours Timeline
        </span>
        <span class="text-tertiary" style="font-size:11px; font-weight:normal;">Click & drag to highlight active hours</span>
      </label>
      
      <!-- Hour labels -->
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:10px; color:var(--text-tertiary); font-weight:600; padding:0 2px;">
        ${hours.map(h => `<span>${h}</span>`).join('')}
      </div>
      
      <!-- Grid -->
      <div class="timeline-grid" style="
        display:grid; 
        grid-template-columns:repeat(48, 1fr); 
        gap:3px; 
        background: rgba(0, 0, 0, 0.2); 
        padding:6px; 
        border-radius:8px; 
        border:1px solid var(--border-color);
        touch-action:none;
      ">
        ${blocksHtml}
      </div>
    </div>
  `;
}

// Setup drag drawing / erasing
function setupTimelineDragSelection(container) {
  let isDrawing = false;
  let drawMode = true; // true = draw, false = erase

  const onStart = (block) => {
    isDrawing = true;
    drawMode = !block.classList.contains('active');
    toggleBlock(block, drawMode);
  };

  const onMove = (block) => {
    if (isDrawing) {
      toggleBlock(block, drawMode);
    }
  };

  const toggleBlock = (block, active) => {
    if (active) {
      block.classList.add('active');
    } else {
      block.classList.remove('active');
    }
  };

  // Attach mouse listeners
  container.addEventListener('mousedown', (e) => {
    const block = e.target.closest('.timeline-block');
    if (block) {
      e.preventDefault();
      onStart(block);
    }
  });

  // Use delegated mouseover which bubbles correctly
  container.addEventListener('mouseover', (e) => {
    const block = e.target.closest('.timeline-block');
    if (block) {
      onMove(block);
    }
  });

  const stopDrawing = () => {
    isDrawing = false;
  };

  window.addEventListener('mouseup', stopDrawing);
}

export function renderSettings(container) {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
  const tabParam = urlParams.get('tab');
  
  let activeTab = 'company';
  let templatesSubTab = 'tasklists';

  if (tabParam === 'forms') {
    activeTab = 'templates_forms';
    templatesSubTab = 'forms';
  } else if (tabParam === 'tasks' || tabParam === 'tasklists') {
    activeTab = 'templates_forms';
    templatesSubTab = 'tasklists';
  } else if (tabParam === 'quote_templates' || tabParam === 'quotes') {
    activeTab = 'templates_forms';
    templatesSubTab = 'quotes';
  } else if (tabParam) {
    activeTab = tabParam;
  }

  const isLocalMode = !store.companyId || store.companyId.startsWith('acct_');
  const settings = store.getSettings();
  const localDeploymentType = settings.localDeploymentType || 'single_user';

  const isUsersDisabled = isLocalMode && localDeploymentType === 'single_user';
  const isPortalDisabled = isLocalMode;
  const isFolderSyncDisabled = !isLocalMode;

  if (isUsersDisabled && activeTab === 'users') {
    activeTab = 'company';
  }
  if (isPortalDisabled && activeTab === 'portal') {
    activeTab = 'company';
  }
  if (isPortalDisabled && activeTab === 'portal_contractor') {
    activeTab = 'company';
  }
  if (isFolderSyncDisabled && activeTab === 'folder_sync') {
    activeTab = 'company';
  }
  
  const isAIAssistantDisabled = isLocalMode;
  if (isAIAssistantDisabled && activeTab === 'ai_assistant') {
    activeTab = 'company';
  }

  function getCategoryForTab(tab) {
    if (['company', 'portal', 'portal_contractor', 'folder_sync', 'ai_assistant', 'system'].includes(tab)) return 'general';
    if (['templates_forms', 'invoices_quotes', 'payments'].includes(tab)) return 'workflow';
    if (['users', 'suppliers'].includes(tab)) return 'people';
    if (['materials', 'cost_centers', 'tax'].includes(tab)) return 'resources';
    return 'general';
  }

  let activeCategory = getCategoryForTab(activeTab);

  const openMigrationModal = () => {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <form id="convert-cloud-form" style="display:flex; flex-direction:column; gap:16px;">
        <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; font-size:12.5px; color:var(--color-danger); display:flex; gap:8px;">
          <span class="material-icons-outlined" style="color:var(--color-danger);">warning</span>
          <div>
            <strong>CRITICAL WARNING:</strong> Converting to Cloud Sync is a permanent, one-way transition. Once converted, you cannot revert this profile back to a local/offline account. All data will be migrated to the secure cloud database.
          </div>
        </div>

        <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; border-radius:4px; font-size:12.5px; color:var(--color-info); display:flex; gap:8px;">
          <span class="material-icons-outlined" style="color:var(--color-info);">info</span>
          <div>
            Configure your cloud administrator credentials. This username and password will be your new secure login.
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Confirm Business Name</label>
          <input class="form-input" id="migrate-company-name" required value="${escapeHTML(store.getSettings().name || '')}" placeholder="Company Name" />
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

        <div id="migration-error" style="display:none; color:var(--color-danger); background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 14px; border-radius:4px; font-size:13px; font-weight:500; align-items:center; gap:8px;">
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

      const companyName = modalContent.querySelector('#migrate-company-name').value.trim();
      const adminName = modalContent.querySelector('#migrate-admin-name').value.trim();
      const adminPhone = modalContent.querySelector('#migrate-admin-phone').value.trim();
      const email = modalContent.querySelector('#migrate-admin-email').value.trim();
      const password = modalContent.querySelector('#migrate-admin-password').value;

      try {
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
          color: profile.color || '#FF5C00',
          theme: 'light'
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.removeItem('relay_active_account');

        showToast('Migration completed successfully! Redirecting...', 'success');
        close();

        setTimeout(() => {
          window.location.hash = '#/';
          window.location.reload();
        }, 1500);

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
  };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  const categories = [
    {
      id: 'general',
      label: 'General',
      icon: 'settings',
      tabs: [
        { id: 'company', label: 'Company Profile' },
        { id: 'portal', label: 'Customer Portal', disabled: isPortalDisabled, tooltip: 'Requires Cloud Account' },
        { id: 'portal_contractor', label: 'Contractor Portal', disabled: isPortalDisabled, tooltip: 'Requires Cloud Account' },
        { id: 'folder_sync', label: 'Folder Sync', disabled: isFolderSyncDisabled, tooltip: 'Requires Local Folder Storage' },
        { id: 'api_keys', label: 'Integrations & APIs' },
        { id: 'system', label: 'System Options' }
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: 'account_tree',
      tabs: [
        { id: 'templates_forms', label: 'Templates & Forms' },
        { id: 'invoices_quotes', label: 'Quotes & Invoices' },
        // v1.3 #3 — dark until FLAGS.payments flips on for launch
        ...(FLAGS.payments ? [{ id: 'payments', label: 'Payments' }] : [])
      ]
    },
    {
      id: 'people',
      label: 'People',
      icon: 'groups',
      tabs: [
        { id: 'users', label: 'Users & Permissions', disabled: isUsersDisabled, tooltip: 'Requires Cloud Account or Local Server' },
        { id: 'suppliers', label: 'Suppliers Configuration' }
      ]
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: 'widgets',
      tabs: [
        { id: 'materials', label: 'Materials & Kits' },
        { id: 'cost_centers', label: 'Cost Centers & Xero' },
        { id: 'tax', label: 'Tax & Labor Rates' }
      ]
    }
  ];

  function render() {
    const categoryTabsHtml = categories.map(cat => {
      const isActive = activeCategory === cat.id;
      return `
        <button class="settings-category-btn ${isActive ? 'active' : ''}" data-category="${cat.id}">
          <span class="material-icons-outlined">${cat.icon}</span>
          <span>${cat.label}</span>
        </button>
      `;
    }).join('');

    const activeCatData = categories.find(cat => cat.id === activeCategory) || categories[0];
    const subTabsHtml = activeCatData.tabs.map(tab => {
      const isActive = activeTab === tab.id;
      const isDisabled = tab.disabled;
      const tooltipAttr = isDisabled ? `data-tooltip="${tab.tooltip}" data-tooltip-pos="top"` : '';
      return `
        <button class="settings-tab-btn ${isActive ? 'active' : ''} ${isDisabled ? 'disabled-local' : ''}" data-tab="${tab.id}" ${tooltipAttr}>
          ${tab.label}
        </button>
      `;
    }).join('');

    container.innerHTML = `
      <style>
        .settings-nav-categories {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .settings-category-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .settings-category-btn .material-icons-outlined {
          font-size: 20px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .settings-category-btn:hover {
          color: var(--text-primary);
          background: var(--bg-color);
        }
        .settings-category-btn:hover .material-icons-outlined {
          transform: scale(1.08);
        }
        .settings-category-btn.active {
          color: white;
          background: var(--color-primary);
          box-shadow: 0 4px 14px rgba(255, 92, 0, 0.25);
          transform: translateY(-1px);
        }
        
        .settings-nav-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
          background: var(--bg-color);
          padding: 6px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          animation: subtabs-slide-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes subtabs-slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .settings-tab-btn {
          padding: 8px 16px;
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .settings-tab-btn:hover:not(.disabled-local) {
          color: var(--text-primary);
          background: rgba(128, 128, 128, 0.08);
        }
        .settings-tab-btn.active {
          color: var(--color-primary);
          background: var(--content-bg);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transform: scale(1.02);
        }
        
        #settings-content {
          animation: settings-fade-in 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes settings-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>

      <div class="page-header"><h1>Settings</h1></div>

      <div class="settings-nav-categories">
        ${categoryTabsHtml}
      </div>

      <div class="settings-nav-tabs">
        ${subTabsHtml}
      </div>

      <div id="settings-content" style="padding-top:var(--space-sm)"></div>
    `;

    renderContent();

    container.querySelectorAll('.settings-category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.category;
        if (activeCategory === catId) return;

        activeCategory = catId;
        const catData = categories.find(c => c.id === catId);
        const firstActiveTab = catData.tabs.find(t => !t.disabled) || catData.tabs[0];
        activeTab = firstActiveTab.id;

        render();
      });
    });

    container.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled-local')) return;
        activeTab = btn.dataset.tab;
        render();
      });
    });
  }

  function renderContent() {
    const tc = container.querySelector('#settings-content');

    if (activeTab === 'suppliers') {
      renderSuppliersSettings(tc);
      return;
    }

    if (activeTab === 'folder_sync') {
      renderFolderSyncTab(tc);
      return;
    }

    if (activeTab === 'api_keys') {
      renderApiKeysTab(tc);
      return;
    }

    if (activeTab === 'templates_forms') {
      renderTemplatesFormsTab(tc);
      return;
    }

    if (activeTab === 'invoices_quotes') {
      renderInvoicesQuotesTab(tc);
      return;
    }

    if (activeTab === 'payments') {
      renderPaymentsTab(tc);
      return;
    }

    if (activeTab === 'cost_centers') {
      renderCostCentersTab(tc);
      return;
    }

    if (activeTab === 'company') {
      const s = store.getSettings();
      // Use local variables to track changes before saving
      let pendingLogo = s.logo;
      let pendingLogoSmall = s.logoSmall;

      const renderCompanyTab = () => {
        tc.innerHTML = `
          <div class="card" style="max-width:850px">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 280px; gap:var(--space-lg)">
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${s.name || 'Company Name'}" id="company-name" placeholder="Company Name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${s.abn || ''}" placeholder="e.g. 51 234 567 890" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${s.phone || ''}" placeholder="e.g. (02) 6882 4400" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Company Domain</label>
                      <input class="form-input" value="${s.domain || ''}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Company Email</label>
                      <input class="form-input" value="${s.email || ''}" id="company-email" placeholder="e.g. admin@yourcompany.com.au" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2" placeholder="e.g. 14 Yarrandale Rd, Dubbo NSW 2830">${s.address || ''}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; gap:20px; align-items:center; text-align:center">
                  
                  <!-- Main Logo -->
                  <div style="display:flex; flex-direction:column; align-items:center; width:100%">
                    <label class="form-label" style="align-self:flex-start">Company Logo (Large / Standard)</label>
                    <div id="logo-preview-container" style="width:100%; height:75px; margin:8px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                      ${pendingLogo ? `<img src="${pendingLogo}" style="max-width:90%; max-height:90%; object-fit:contain" />` : `
                        <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
                          <span class="material-icons-outlined" style="font-size:24px">image</span>
                          <span style="font-size:10px; margin-top:2px">No custom logo</span>
                        </div>
                      `}
                    </div>
                    <input type="file" id="logo-upload" accept="image/*" style="display:none" />
                    <div style="display:flex; gap:6px; width:100%">
                      <button class="btn btn-secondary btn-sm" id="btn-upload-logo" data-tooltip="Upload new standard company logo" data-tooltip-pos="top" style="flex:1">
                        <span class="material-icons-outlined" style="font-size:14px">upload</span> Upload
                      </button>
                      ${pendingLogo ? `<button class="btn btn-ghost btn-sm" id="btn-remove-logo" data-tooltip="Remove custom company logo" data-tooltip-pos="top" style="color:var(--color-danger); padding:0 8px" title="Remove logo"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>` : ''}
                    </div>
                  </div>

                  <!-- Small Logo -->
                  <div style="display:flex; flex-direction:column; align-items:center; width:100%">
                    <label class="form-label" style="align-self:flex-start">Company Logo (Small / Shrunk)</label>
                    <div id="logo-small-preview-container" style="width:100%; height:75px; margin:8px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                      ${pendingLogoSmall ? `<img src="${pendingLogoSmall}" style="max-width:90%; max-height:90%; object-fit:contain" />` : `
                        <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
                          <span class="material-icons-outlined" style="font-size:24px">image</span>
                          <span style="font-size:10px; margin-top:2px">No small logo</span>
                        </div>
                      `}
                    </div>
                    <input type="file" id="logo-small-upload" accept="image/*" style="display:none" />
                    <div style="display:flex; gap:6px; width:100%">
                      <button class="btn btn-secondary btn-sm" id="btn-upload-logo-small" data-tooltip="Upload new small company logo" data-tooltip-pos="top" style="flex:1">
                        <span class="material-icons-outlined" style="font-size:14px">upload</span> Upload
                      </button>
                      ${pendingLogoSmall ? `<button class="btn btn-ghost btn-sm" id="btn-remove-logo-small" data-tooltip="Remove small company logo" data-tooltip-pos="top" style="color:var(--color-danger); padding:0 8px" title="Remove small logo"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>` : ''}
                    </div>
                  </div>

                  <div id="unsaved-logo-hint" style="display:none; margin-top:4px; color:var(--color-warning); font-size:11px; font-weight:600">UNSAVED PREVIEW</div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary" id="btn-save-company" data-tooltip="Save company details permanently" data-tooltip-pos="top">
                <span class="material-icons-outlined">save</span> Save Company Changes
              </button>
            </div>
          </div>
        `;

        // Handlers for Company Tab
        const logoInput = tc.querySelector('#logo-upload');
        const logoSmallInput = tc.querySelector('#logo-small-upload');
        
        tc.querySelector('#btn-upload-logo').addEventListener('click', () => logoInput.click());
        tc.querySelector('#btn-upload-logo-small').addEventListener('click', () => logoSmallInput.click());
        
        const removeLogoHandler = () => {
          pendingLogo = null;
          const container = tc.querySelector('#logo-preview-container');
          container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:24px">image</span>
              <span style="font-size:10px; margin-top:2px">No custom logo</span>
            </div>
          `;
          tc.querySelector('#unsaved-logo-hint').style.display = 'block';
          tc.querySelector('#btn-remove-logo')?.remove();
        };

        const removeLogoSmallHandler = () => {
          pendingLogoSmall = null;
          const container = tc.querySelector('#logo-small-preview-container');
          container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:24px">image</span>
              <span style="font-size:10px; margin-top:2px">No small logo</span>
            </div>
          `;
          tc.querySelector('#unsaved-logo-hint').style.display = 'block';
          tc.querySelector('#btn-remove-logo-small')?.remove();
        };

        logoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              // Compress the Standard Logo (Large) using Canvas to ~600x300 max bounding box
              compressImage(re.target.result, 600, 300).then((compressed) => {
                pendingLogo = compressed;
                const container = tc.querySelector('#logo-preview-container');
                container.innerHTML = `<img src="${pendingLogo}" style="max-width:90%; max-height:90%; object-fit:contain" />`;
                tc.querySelector('#unsaved-logo-hint').style.display = 'block';
                showToast('Large logo preview updated. Click Save to apply.', 'info');
                
                let removeBtn = tc.querySelector('#btn-remove-logo');
                if (!removeBtn) {
                  removeBtn = document.createElement('button');
                  removeBtn.className = 'btn btn-ghost btn-sm';
                  removeBtn.id = 'btn-remove-logo';
                  removeBtn.style.cssText = 'color:var(--color-danger); padding:0 8px';
                  removeBtn.title = 'Remove logo';
                  removeBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">delete</span>';
                  tc.querySelector('#btn-upload-logo').parentNode.appendChild(removeBtn);
                  removeBtn.addEventListener('click', removeLogoHandler);
                }
              });
            };
            reader.readAsDataURL(file);
          }
        });

        logoSmallInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              // Compress the Small/Shrunk Logo using Canvas to ~200x100 max bounding box
              compressImage(re.target.result, 200, 100).then((compressed) => {
                pendingLogoSmall = compressed;
                const container = tc.querySelector('#logo-small-preview-container');
                container.innerHTML = `<img src="${pendingLogoSmall}" style="max-width:90%; max-height:90%; object-fit:contain" />`;
                tc.querySelector('#unsaved-logo-hint').style.display = 'block';
                showToast('Small logo preview updated. Click Save to apply.', 'info');
                
                let removeBtn = tc.querySelector('#btn-remove-logo-small');
                if (!removeBtn) {
                  removeBtn = document.createElement('button');
                  removeBtn.className = 'btn btn-ghost btn-sm';
                  removeBtn.id = 'btn-remove-logo-small';
                  removeBtn.style.cssText = 'color:var(--color-danger); padding:0 8px';
                  removeBtn.title = 'Remove small logo';
                  removeBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">delete</span>';
                  tc.querySelector('#btn-upload-logo-small').parentNode.appendChild(removeBtn);
                  removeBtn.addEventListener('click', removeLogoSmallHandler);
                }
              });
            };
            reader.readAsDataURL(file);
          }
        });

        tc.querySelector('#btn-remove-logo')?.addEventListener('click', removeLogoHandler);
        tc.querySelector('#btn-remove-logo-small')?.addEventListener('click', removeLogoSmallHandler);



        tc.querySelector('#btn-save-company').addEventListener('click', async () => {
          const saveBtn = tc.querySelector('#btn-save-company');
          const originalHtml = saveBtn.innerHTML;
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving Changes...';

          try {
            const settings = store.getSettings();
            settings.name = tc.querySelector('#company-name').value;
            settings.abn = tc.querySelector('#company-abn').value;
            settings.phone = tc.querySelector('#company-phone').value;
            settings.domain = tc.querySelector('#company-domain').value;
            settings.email = tc.querySelector('#company-email').value;
            settings.address = tc.querySelector('#company-address').value;
            settings.logo = pendingLogo;
            settings.logoSmall = pendingLogoSmall;
            
            await store.saveSettings(settings);
            showToast('Company information saved successfully to database', 'success');
            tc.querySelector('#unsaved-logo-hint').style.display = 'none';
            window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
            render();
          } catch (err) {
            console.error('Error saving company profile settings:', err);
            showToast('Failed to save settings: ' + (err.message || err), 'error');
          } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
          }
        });
      };

      renderCompanyTab();
    } else if (activeTab === 'users') {
      const techs = store.getAll('technicians');
      const pendingResets = store.getAll('passwordResetRequests') || [];
      const companySlug = store.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
      let userTypes = store.getAll('userTypes');
      if (!userTypes || userTypes.length === 0) {
        userTypes = [
          { id: 'ut_admin', name: 'Admin', description: 'Full system access',
            permissions: buildGranularPerms(() => true) },
          { id: 'ut_manager', name: 'Manager', description: 'Can manage most workflows but limited settings',
            permissions: buildGranularPerms((mod, key) => {
              if (mod === 'Settings') return ['view', 'edit_company'].includes(key);
              return true;
            })
          },
          { id: 'ut_tech', name: 'Technician', description: 'Field staff — limited to their own jobs',
            permissions: buildGranularPerms((mod, key) => {
              if (mod === 'Dashboard') return key === 'view';
              if (mod === 'Schedule') return ['view', 'view_own', 'edit'].includes(key);
              if (mod === 'Quotes') return ['view', 'create', 'edit', 'delete', 'approve', 'convert', 'generate_pdf'].includes(key);
              if (mod === 'Jobs') {
                return ['view', 'create', 'edit', 'delete', 'book_time', 'view_invoices_tab', 'create_invoice', 'manage_tasks', 'view_timesheets_tab', 'manage_materials'].includes(key);
              }
              if (mod === 'Invoices') return ['view', 'create', 'send', 'void'].includes(key);
              if (mod === 'Customers') return ['view', 'create', 'edit', 'delete', 'manage_contacts'].includes(key);
              if (mod === 'Assets') return ['view', 'create', 'edit', 'delete'].includes(key);
              if (mod === 'Stock') return ['view', 'create', 'edit', 'delete'].includes(key);
              if (mod === 'Purchase Orders') return ['view', 'create', 'approve'].includes(key);
              if (mod === 'Timesheets') return ['view_own', 'view', 'create', 'edit_all'].includes(key);
              if (mod === 'Settings') return ['view', 'edit_company'].includes(key);
              if (mod === 'Documents') return ['view', 'upload'].includes(key);
              return false;
            })
          },
          { id: 'ut_office', name: 'Office Staff', description: 'Admin / reception — can manage customers, quotes, invoices but not system settings',
            permissions: buildGranularPerms((mod, key) => {
              if (mod === 'Settings') return false;
              if (mod === 'Reports') return key === 'view';
              if (['Invoices', 'Purchase Orders'].includes(mod) && key === 'delete') return false;
              return true;
            })
          }
        ];
        store.save('userTypes', userTypes);
      } else {
        // Self-healing migration: Restore Office Staff role if it was wiped
        const hasOffice = userTypes.some(ut => ut.id === 'ut_office');
        if (!hasOffice) {
          userTypes.push({
            id: 'ut_office',
            name: 'Office Staff',
            description: 'Admin / reception — can manage customers, quotes, invoices but not system settings',
            permissions: buildGranularPerms((mod, key) => {
              if (mod === 'Settings') return false;
              if (mod === 'Reports') return key === 'view';
              if (['Invoices', 'Purchase Orders'].includes(mod) && key === 'delete') return false;
              return true;
            })
          });
          store.save('userTypes', userTypes);
        }
      }

      tc.innerHTML = `
        <div style="background:rgba(59, 130, 246, 0.1); border-left:4px solid #3b82f6; padding:12px 16px; margin-bottom:var(--space-md); border-radius:4px; font-size:13px; color:#f8fafc; display:flex; justify-content:space-between; align-items:center;">
          <span style="display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="color:#3b82f6; font-size:18px;">info</span>
            <span>Your company login code is <strong style="color:#60a5fa">${companySlug}</strong>. Technicians log in using <strong style="color:#60a5fa">username@${companySlug}</strong>.</span>
          </span>
        </div>

        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Active Users</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-user" data-tooltip="Create a new user account" data-tooltip-pos="left"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                               <th style="width:40px"></th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>User Type</th>
                  <th>Username</th>
                  <th>Pay Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${techs.filter(t => !t.deactivated).map(t => {
                  const ut = userTypes.find(ut => ut.id === t.userTypeId);
                  return `
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${t.color}"></div></td>
                      <td class="font-medium">${t.name}</td>
                      <td class="text-secondary">${t.role}</td>
                      <td><span class="badge ${ut?.id === 'ut_admin' ? 'badge-primary' : 'badge-neutral'}">${ut?.name || 'Unassigned'}</span></td>
                      <td class="text-tertiary">${t.username || (t.email ? t.email.split('@')[0] : '') || '-'}</td>
                      <td class="text-secondary">${t.payRate ? `$${t.payRate.toFixed(2)}/hr` : '-'}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${t.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          ${ut?.id !== 'ut_admin' ? `
                            <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${t.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4 style="margin:0">Pending Password Reset Requests</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username/Email</th>
                  <th>Requested On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pendingResets.filter(r => r.status === 'pending').length === 0 ? '<tr><td colspan="4" class="text-center text-tertiary" style="padding:24px">No pending reset requests</td></tr>' : ''}
                ${pendingResets.filter(r => r.status === 'pending').map(r => {
                  const tech = techs.find(t => t.id === r.technician_id) || {};
                  const requestedAt = r.requested_at ? new Date(r.requested_at).toLocaleString() : 'Unknown';
                  return `
                    <tr>
                      <td class="font-medium">${tech.name || 'Unknown'}</td>
                      <td class="text-secondary">${r.employee_id || tech.username || ''}</td>
                      <td class="text-tertiary">${requestedAt}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-sm btn-ghost btn-approve-reset" data-id="${r.id}" data-tech-id="${tech.id}">Approve &amp; Reset</button>
                          <button class="btn btn-sm btn-ghost text-danger btn-deny-reset" data-id="${r.id}">Deny</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${isLocalMode ? '' : `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">User Types & Permissions</h4>
            <button class="btn btn-secondary btn-sm" id="btn-add-usertype" data-tooltip="Create a new custom user type / role" data-tooltip-pos="left"><span class="material-icons-outlined" style="font-size:16px">add</span> New Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${userTypes.map(ut => `
                  <tr>
                    <td class="font-medium">${ut.name}</td>
                    <td class="text-secondary">${ut.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${ut.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${ut.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${ut.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        `}

        <div class="card">
          <div class="card-header"><h4>Deactivated Users (Cooldown Period)</h4></div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Deactivated On</th>
                  <th>Cooldown Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${techs.filter(t => t.deactivated).length === 0 ? '<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>' : ''}
                ${techs.filter(t => t.deactivated).map(t => {
                  const deactivatedAt = new Date(t.deactivatedAt);
                  const now = new Date();
                  const diffTime = now - deactivatedAt;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const remaining = 30 - diffDays;
                  const canReactivate = remaining <= 0;

                  return `
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${t.name}</td>
                      <td style="opacity:0.6">${t.role}</td>
                      <td class="text-tertiary">${deactivatedAt.toLocaleDateString()}</td>
                      <td>
                        ${canReactivate 
                          ? '<span class="badge badge-success">Cooldown Complete</span>' 
                          : `<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${remaining} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${t.id}" 
                                ${!canReactivate ? 'disabled style="opacity:0.4; cursor:not-allowed"' : ''}>
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-user').addEventListener('click', () => {
        openUserModal();
      });
      tc.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', (e) => openUserModal(e.currentTarget.dataset.id));
      });
      tc.querySelectorAll('.btn-deactivate-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const t = store.getById('technicians', id);
          if (!t) return;
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `<p>Are you sure you want to deactivate <strong>${t.name}</strong>? They will no longer be able to log in.</p>`;
          showModal({
            title: 'Deactivate User',
            content: contentDiv,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
              { label: 'Deactivate', className: 'btn-danger', onClick: c => {
                store.update('technicians', id, { deactivated: true, deactivatedAt: new Date().toISOString() });
                showToast(`${t.name} deactivated`, 'info');
                c();
                renderContent();
              }}
            ]
          });
        });
      });

      tc.querySelectorAll('.btn-reactivate-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const t = store.getById('technicians', id);
          if (!t) return;

          // Extra safety check for cooldown
          const deactivatedAt = new Date(t.deactivatedAt);
          const diffDays = Math.ceil((new Date() - deactivatedAt) / (1000 * 60 * 60 * 24));
          if (diffDays < 30) {
            showToast(`License Policy: Seat cooldown in progress (${30 - diffDays} days remaining)`, 'error');
            return;
          }

          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `<p>Reactivate <strong>${t.name}</strong>? They will regain access once a User Type is assigned.</p>`;
          showModal({
            title: 'Reactivate User',
            content: contentDiv,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
              { label: 'Reactivate', className: 'btn-primary', onClick: c => {
                store.update('technicians', id, {
                  deactivated: false,
                  deactivatedAt: null
                });
                showToast(`${t.name} has been reactivated.`, 'success');
                c();
                renderContent();
              }}
            ]
          });
        });
      });

      tc.querySelectorAll('.btn-approve-reset').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const techId = e.currentTarget.dataset.techId;
          const t = store.getById('technicians', techId);
          if (!t) return;
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `
            <p>Approve password reset request for <strong>${t.name}</strong>? Please enter their new password below:</p>
            <div class="form-group" style="margin-top:12px">
              <label class="form-label">New Password</label>
              <input type="password" id="admin-reset-pwd-input" class="form-input" placeholder="Min. 6 characters" minlength="6" autofocus />
            </div>
          `;
          showModal({
            title: 'Approve Password Reset',
            content: contentDiv,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
              { label: 'Reset Password', className: 'btn-primary', onClick: c => {
                const pwdInput = document.getElementById('admin-reset-pwd-input');
                const newPwd = pwdInput ? pwdInput.value : '';
                if (!newPwd || newPwd.length < 6) {
                  showToast('Password must be at least 6 characters.', 'error');
                  return;
                }
                
                // Update technician password
                store.update('technicians', techId, { password: newPwd });
                
                // Approve the request
                store.update('passwordResetRequests', id, { status: 'approved', updated_at: new Date().toISOString() });
                
                showToast(`Password updated for ${t.name}`, 'success');
                c();
                renderContent();
              }}
            ]
          });
        });
      });

      tc.querySelectorAll('.btn-deny-reset').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          store.update('passwordResetRequests', id, { status: 'denied', updated_at: new Date().toISOString() });
          showToast('Password reset request denied', 'info');
          renderContent();
        });
      });

      tc.querySelector('#btn-add-usertype')?.addEventListener('click', () => {
         openUserTypeModal();
      });

      tc.querySelectorAll('.btn-edit-perms').forEach(btn => {
        btn.addEventListener('click', (e) => {
          openPermissionsModal(e.target.dataset.id);
        });
      });

      tc.querySelectorAll('.btn-edit-usertype').forEach(btn => {
        btn.addEventListener('click', (e) => {
          openUserTypeModal(e.target.dataset.id);
        });
      });

      tc.querySelectorAll('.btn-delete-usertype').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          const ut = store.getById('userTypes', id);
          if (!ut) return;
          if (ut.name.toLowerCase().includes('admin')) {
            showToast('Cannot delete the Admin user type — at least one Admin must always exist.', 'error');
            return;
          }
          const usersWithType = store.getAll('technicians').filter(t => t.userTypeId === id);
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `<p>Are you sure you want to delete the user type <strong>${ut.name}</strong>?${usersWithType.length > 0 ? ` <strong>${usersWithType.length} user(s)</strong> will become unassigned.` : ''} This cannot be undone.</p>`;
          showModal({
            title: 'Confirm Deletion',
            content: contentDiv,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: (c) => c() },
              { label: 'Delete', className: 'btn-danger', onClick: (c) => {
                store.delete('userTypes', id);
                showToast('User Type deleted', 'success');
                c();
                renderContent();
              }}
            ]
          });
        });
      });
    } else if (activeTab === 'materials') {
      renderMaterialsSettings(tc);
    } else if (activeTab === 'tax') {
      const settings = store.getSettings();
      let currentJobTypes = settings.jobTypes ? [...settings.jobTypes] : ['Electrical', 'Plumbing', 'HVAC', 'Fire Protection', 'Security', 'General Maintenance', 'Service', 'Project', 'Maintenance', 'Quote'];
      tc.innerHTML = `
        <div class="grid-2">
          <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
            <div class="card">
              <div class="card-header"><h4>Tax Rates</h4></div>
              <div class="card-body">
                <div class="form-group" style="display:flex; flex-direction:column; gap:8px">
                  <label class="form-label" style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:0">
                    <input type="checkbox" id="tax-enabled" style="width:16px; height:16px; margin:0" ${settings.taxEnabled !== false ? 'checked' : ''} />
                    Enable GST / Sales Tax
                  </label>
                  <div style="display:${settings.taxEnabled !== false ? 'flex' : 'none'}; align-items:center; gap:8px; margin-top:4px" id="tax-rate-container">
                    <input class="form-input" id="tax-rate" type="number" value="${settings.taxRate !== undefined ? settings.taxRate : 10}" style="width:100px" min="0" max="100" step="0.1" /> <span class="text-secondary">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" id="job-types-card">
              <div class="card-header"><h4>Job Types</h4></div>
              <div class="card-body">
                <p class="text-secondary" style="font-size:var(--font-size-sm);margin-bottom:12px">Define the types of jobs your team performs (e.g. Electrical, Plumbing). These appear in job forms and rate mapping.</p>
                <div id="job-types-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
                  ${currentJobTypes.map(type => `
                    <span class="tag-pill tag-pill-active" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; font-weight:500; font-size:13px; background:var(--color-primary-light); color:var(--color-primary-dark)">
                      <span>${escapeHTML(type)}</span>
                      <span class="material-icons-outlined delete-job-type-btn" data-type="${escapeHTML(type)}" style="font-size:16px; cursor:pointer; opacity:0.7; transition:opacity 0.2s">close</span>
                    </span>
                  `).join('')}
                </div>
                <div style="display:flex; gap:8px;">
                  <input class="form-input" id="new-job-type-input" type="text" placeholder="e.g. Renovation" style="flex:1" />
                  <button class="btn btn-secondary" id="add-job-type-btn" style="display:flex; align-items:center; gap:4px">
                    <span class="material-icons-outlined" style="font-size:16px">add</span> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h4>Labor Rounding Rules</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Round Technician Time To...</label>
                <select class="form-select" id="labor-rounding">
                  <option value="1" ${(settings.laborRounding || 15) === 1 ? 'selected' : ''}>None (Precise)</option>
                  <option value="5" ${(settings.laborRounding || 15) === 5 ? 'selected' : ''}>Nearest 5 Minutes</option>
                  <option value="15" ${(settings.laborRounding || 15) === 15 ? 'selected' : ''}>Nearest 15 Minutes</option>
                  <option value="30" ${(settings.laborRounding || 15) === 30 ? 'selected' : ''}>Nearest 30 Minutes</option>
                  <option value="60" ${(settings.laborRounding || 15) === 60 ? 'selected' : ''}>Nearest Hour</option>
                </select>
                <p class="text-tertiary" style="font-size:12px;margin-top:8px">Standardizes billing and ensures technicians are paid consistently for small increments.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:var(--space-lg)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h4 style="margin:0">Labour Rate Profiles</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">Define charge-out rates for different job types or time periods. These appear as selectable options when adding labour to a quote or job.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="add-rate-btn" data-tooltip="Create a new custom charge-out rate profile">
              <span class="material-icons-outlined" style="font-size:16px">add</span> Add Profile
            </button>
          </div>
          <div class="card-body">
            <div id="labor-rates-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap:16px;">
              ${settings.laborRates.map((rate) => {
                const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','PH'];
                const dayLabels = { Mon:'Mon', Tue:'Tue', Wed:'Wed', Thu:'Thu', Fri:'Fri', Sat:'Sat', Sun:'Sun', PH:'P.H.' };
                const applicable = rate.applicableDays || ['Mon','Tue','Wed','Thu','Fri'];
                return `
                <div class="labor-rate-card" data-id="${rate.id}" style="border:2px solid ${rate.isDefault ? 'var(--color-primary)' : 'var(--border-color)'}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${rate.isDefault ? 'var(--color-primary-light)' : 'var(--bg-color)'}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${rate.isDefault ? 'var(--color-primary)' : 'var(--text-tertiary)'}; font-size:20px">sell</span>
                      <input class="rate-name" value="${escapeHTML(rate.name)}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${rate.isDefault ? '<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>' : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${!rate.isDefault ? `<button class="btn btn-ghost btn-sm btn-set-default" data-id="${rate.id}" title="Set as default rate">Set Default</button>` : ''}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${rate.id}" title="Delete profile" ${rate.isDefault ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
                        <span class="material-icons-outlined" style="font-size:18px;pointer-events:none">delete</span>
                      </button>
                    </div>
                  </div>
                  <!-- Card Body -->
                  <div style="padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <!-- Charge-out Rate -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label" data-tooltip="Base hourly charge billed to the client for this labor type" data-tooltip-pos="right">Charge-out Rate ($/hr)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-val" type="number" value="${rate.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier (hidden) -->
                    <input type="hidden" class="rate-multiplier" value="${rate.overtimeMultiplier || 1}" />
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label" data-tooltip="Minimum flat fee billed if calculated hours compute below this value" data-tooltip-pos="left">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${(rate.minCallOutFee || 0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description (hidden) & Active Hours Timeline -->
                    <input type="hidden" class="rate-desc" value="${escapeHTML(rate.description || '')}" />
                    ${renderTimelineHtml(rate.activeHours || [])}

                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${allDays.map(day => {
                          const active = applicable.includes(day);
                          return `
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${day}" ${active ? 'checked' : ''} style="display:none" />
                            <span class="rate-day-pill" data-day="${day}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${active ? 'var(--color-primary)' : 'var(--border-color)'};background:${active ? 'var(--color-primary-light)' : 'transparent'};color:${active ? 'var(--color-primary)' : 'var(--text-secondary)'}">
                              ${dayLabels[day]}
                            </span>
                          </label>
                        `}).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `}).join('')}
            </div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" id="save-tax-settings" data-tooltip="Save tax rates, markup, rounding and profiles" data-tooltip-pos="top">
              <span class="material-icons-outlined">save</span> Save All Settings
            </button>
          </div>
        </div>
      `;

      // Set up interactive timeline drag-selection
      setupTimelineDragSelection(tc);

      // Toggle tax rate container visibility
      tc.querySelector('#tax-enabled')?.addEventListener('change', (e) => {
        const container = tc.querySelector('#tax-rate-container');
        if (container) {
          container.style.display = e.target.checked ? 'flex' : 'none';
        }
      });

      // ---- Day pill toggle ----
      tc.addEventListener('click', (e) => {
        const pill = e.target.closest('.rate-day-pill');
        if (pill) {
          const day = pill.dataset.day;
          const card = pill.closest('.labor-rate-card');
          const chk = card.querySelector(`.rate-day[data-day="${day}"]`);
          chk.checked = !chk.checked;
          const active = chk.checked;
          pill.style.border = `1px solid ${active ? 'var(--color-primary)' : 'var(--border-color)'}`;
          pill.style.background = active ? 'var(--color-primary-light)' : 'transparent';
          pill.style.color = active ? 'var(--color-primary)' : 'var(--text-secondary)';
        }
      });

      // ---- Add new profile ----
      tc.querySelector('#add-rate-btn').addEventListener('click', () => {
        const id = 'rate_' + Date.now().toString(36);
        const container = tc.querySelector('#labor-rates-container');
        const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','PH'];
        const dayLabels = { Mon:'Mon', Tue:'Tue', Wed:'Wed', Thu:'Thu', Fri:'Fri', Sat:'Sat', Sun:'Sun', PH:'P.H.' };
        const div = document.createElement('div');
        div.className = "labor-rate-card";
        div.dataset.id = id;
        div.style.cssText = "border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);";
        div.innerHTML = `
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${id}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
            </div>
          </div>
          <div style="padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group" style="margin:0">
              <label class="form-label" data-tooltip="Base hourly charge billed to the client for this labor type" data-tooltip-pos="right">Charge-out Rate ($/hr)</label>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--text-secondary)">$</span>
                <input class="form-input rate-val" type="number" value="0.00" min="0" step="0.50" style="width:120px" />
              </div>
            </div>
            <!-- Overtime Multiplier (hidden) -->
            <input type="hidden" class="rate-multiplier" value="1.0" />
            <div class="form-group" style="margin:0">
              <label class="form-label" data-tooltip="Minimum flat fee billed if calculated hours compute below this value" data-tooltip-pos="left">Min Call-out Fee ($)</label>
              <input class="form-input rate-min-fee" type="number" value="0.00" min="0" step="1.00" style="width:120px" />
            </div>
            <!-- Description (hidden) & Active Hours Timeline -->
            <input type="hidden" class="rate-desc" value="" />
            ${renderTimelineHtml(Array.from({length: 18}, (_, i) => i + 16))}

            <div class="form-group" style="margin:0;grid-column:1/-1">
              <label class="form-label">Applicable Days</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                ${allDays.map(day => `
                  <label style="cursor:pointer">
                    <input type="checkbox" class="rate-day" data-day="${day}" ${['Mon','Tue','Wed','Thu','Fri'].includes(day) ? 'checked' : ''} style="display:none" />
                    <span class="rate-day-pill" data-day="${day}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${['Mon','Tue','Wed','Thu','Fri'].includes(day) ? 'var(--color-primary)' : 'var(--border-color)'};background:${['Mon','Tue','Wed','Thu','Fri'].includes(day) ? 'var(--color-primary-light)' : 'transparent'};color:${['Mon','Tue','Wed','Thu','Fri'].includes(day) ? 'var(--color-primary)' : 'var(--text-secondary)'}">
                      ${dayLabels[day]}
                    </span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        container.appendChild(div);
      });

      // ---- Delete profile ----
      tc.addEventListener('click', (e) => {
        if (e.target.closest('.remove-rate-btn')) {
          const card = e.target.closest('.labor-rate-card');
          if (card) card.remove();
        }
      });

      // ---- Set Default (No immediate save) ----
      tc.addEventListener('click', (e) => {
        if (e.target.closest('.btn-set-default')) {
          const targetId = e.target.closest('.btn-set-default').dataset.id;
          const currentRates = _collectRates(tc);
          currentRates.forEach(r => r.isDefault = (r.id === targetId));
          
          // Re-render the container with the new default state WITHOUT saving to store
          const container = tc.querySelector('#labor-rates-container');
          container.innerHTML = currentRates.map((rate) => {
            // ... (I'll just trigger a refresh of the tax tab with the new data)
            // Actually, for simplicity and to avoid losing other unsaved field data, 
            // I will just update the UI classes manually.
            tc.querySelectorAll('.labor-rate-card').forEach(card => {
              const isTarget = card.dataset.id === targetId;
              card.style.border = `2px solid ${isTarget ? 'var(--color-primary)' : 'var(--border-color)'}`;
              const header = card.querySelector('div[style*="padding:12px 16px"]');
              if (header) header.style.background = isTarget ? 'var(--color-primary-light)' : 'var(--bg-color)';
              
              // Toggle badge
              let badge = card.querySelector('.badge');
              if (isTarget && !badge) {
                 const nameContainer = card.querySelector('div[style*="flex:1"]');
                 const b = document.createElement('span');
                 b.className = 'badge';
                 b.style.cssText = 'background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600';
                 b.textContent = 'DEFAULT';
                 nameContainer.appendChild(b);
              } else if (!isTarget && badge) {
                 badge.remove();
              }
              
              // Toggle button
              let setDefBtn = card.querySelector('.btn-set-default');
              if (isTarget && setDefBtn) {
                 setDefBtn.remove();
              } else if (!isTarget && !setDefBtn) {
                 const actions = card.querySelector('div[style*="gap:8px"]');
                 const b = document.createElement('button');
                 b.className = 'btn btn-ghost btn-sm btn-set-default';
                 b.dataset.id = card.dataset.id;
                 b.textContent = 'Set Default';
                 actions.prepend(b);
              }
            });
          });
          showToast('Default rate updated in view. Click Save to apply.', 'info');
        }
      });

      // Helper to collect all rates from the UI
      function _collectRates(container) {
        return Array.from(container.querySelectorAll('.labor-rate-card')).map(card => {
          const id = card.dataset.id;
          const name = card.querySelector('.rate-name').value;
          const rate = parseFloat(card.querySelector('.rate-val').value) || 0;
          const multiplier = parseFloat(card.querySelector('.rate-multiplier').value) || 1;
          const desc = card.querySelector('.rate-desc').value;
          const minFee = parseFloat(card.querySelector('.rate-min-fee').value) || 0;
          const isDefault = card.querySelector('.btn-set-default') === null;
          const applicableDays = Array.from(card.querySelectorAll('.rate-day:checked')).map(chk => chk.dataset.day);
          const activeHours = Array.from(card.querySelectorAll('.timeline-block.active')).map(block => parseInt(block.dataset.slot));
          
          return { id, name, rate, description: desc, overtimeMultiplier: multiplier, minCallOutFee: minFee, applicableDays, activeHours, isDefault };
        });
      }

      // ---- Job Types Management Event Listeners ----
      const addJobTypeBtn = tc.querySelector('#add-job-type-btn');
      const newJobTypeInput = tc.querySelector('#new-job-type-input');
      const jobTypesList = tc.querySelector('#job-types-list');

      function updateJobTypesUI() {
        jobTypesList.innerHTML = currentJobTypes.map(type => `
          <span class="tag-pill tag-pill-active" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; font-weight:500; font-size:13px; background:var(--color-primary-light); color:var(--color-primary-dark)">
            <span>${escapeHTML(type)}</span>
            <span class="material-icons-outlined delete-job-type-btn" data-type="${escapeHTML(type)}" style="font-size:16px; cursor:pointer; opacity:0.7; transition:opacity 0.2s">close</span>
          </span>
        `).join('');
      }

      addJobTypeBtn?.addEventListener('click', () => {
        const val = newJobTypeInput.value.trim();
        if (!val) {
          showToast('Please enter a job type name', 'warning');
          return;
        }
        if (currentJobTypes.includes(val)) {
          showToast('This job type already exists', 'warning');
          return;
        }
        currentJobTypes.push(val);
        newJobTypeInput.value = '';
        updateJobTypesUI();
      });

      tc.querySelector('#job-types-card')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-job-type-btn');
        if (btn) {
          const typeToDelete = btn.dataset.type;
          currentJobTypes = currentJobTypes.filter(t => t !== typeToDelete);
          updateJobTypesUI();
        }
      });

      // ---- Save ----
      tc.querySelector('#save-tax-settings').addEventListener('click', async () => {
        const btn = tc.querySelector('#save-tax-settings');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

        try {
          const taxEnabled = tc.querySelector('#tax-enabled').checked;
          const taxRate = parseFloat(tc.querySelector('#tax-rate').value) || 0;
          const laborRounding = parseInt(tc.querySelector('#labor-rounding').value) || 15;
          const laborRates = _collectRates(tc);
          const settings = store.getSettings();
          settings.taxEnabled = taxEnabled;
          settings.taxRate = taxRate;
          settings.laborRounding = laborRounding;
          settings.laborRates = laborRates;
          settings.jobTypes = currentJobTypes;

          await store.saveSettings(settings);
          showToast('Financial and Rate settings saved successfully', 'success');
          renderContent();
        } catch (err) {
          console.error('Error saving tax and rate settings:', err);
          showToast('Failed to save settings: ' + (err.message || err), 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      });



    } else if (activeTab === 'portal') {
      const s = store.getSettings();
      const portalEnabled = s.enableCustomerPortal !== false;
      const portalWelcome = s.customerPortalWelcome || 'Welcome to your secure customer dashboard. Here you can track your service dispatches, check maintenance, approve quotes, and manage your invoices.';
      const portalPayment = s.customerPortalPayment || 'Please pay via Bank Transfer to BSB: 123-456 Account: 7890 1234. Please quote your Invoice Number as reference.';

      tc.innerHTML = `
        <div class="card" style="max-width:800px">
          <div class="card-header"><h4>Customer Portal Settings</h4></div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group" style="display:flex; align-items:center; gap:12px; background:var(--content-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color)">
              <input type="checkbox" id="portal-enable" class="form-checkbox" style="width:20px; height:20px; cursor:pointer;" ${portalEnabled ? 'checked' : ''} />
              <div style="cursor:pointer;" onclick="document.getElementById('portal-enable').click()">
                <strong style="display:block; font-size:14px; color:var(--text-primary);">Enable Customer Portal Link Access</strong>
                <span style="font-size:12px; color:var(--text-secondary);">When disabled, any attempt to visit a customer portal link will show an access restricted notice.</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Custom Portal Welcome Message</label>
              <textarea class="form-textarea" id="portal-welcome" rows="3" placeholder="Enter a custom message displayed to customers on their dashboard...">${escapeHTML(portalWelcome)}</textarea>
              <p class="text-tertiary" style="font-size:11px; margin-top:4px;">This message will appear prominently at the top of the customer's portal dashboard.</p>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Invoice Payment Instructions</label>
              <textarea class="form-textarea" id="portal-payment" rows="3" placeholder="BSB, Account Number, and payment instructions...">${escapeHTML(portalPayment)}</textarea>
              <p class="text-tertiary" style="font-size:11px; margin-top:4px;">These bank details and instructions will be shown to customers when reviewing outstanding invoices in their portal.</p>
            </div>
          </div>
          <div class="card-footer" style="display:flex; justify-content:flex-end">
            <button class="btn btn-primary" id="btn-save-portal-settings" data-tooltip="Save client portal access rules and messages" data-tooltip-pos="top">
              <span class="material-icons-outlined">save</span> Save Portal Settings
            </button>
          </div>
        </div>
      `;

      tc.querySelector('#btn-save-portal-settings').addEventListener('click', async () => {
        const btn = tc.querySelector('#btn-save-portal-settings');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

        try {
          const settings = store.getSettings();
          settings.enableCustomerPortal = tc.querySelector('#portal-enable').checked;
          settings.customerPortalWelcome = tc.querySelector('#portal-welcome').value.trim();
          settings.customerPortalPayment = tc.querySelector('#portal-payment').value.trim();

          await store.saveSettings(settings);
          showToast('Customer portal settings saved successfully', 'success');
        } catch (err) {
          console.error('Error saving customer portal settings:', err);
          showToast('Failed to save settings: ' + (err.message || err), 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      });

    } else if (activeTab === 'portal_contractor') {
      const s = store.getSettings();
      const portalEnabled = s.enableContractorPortal !== false;

      tc.innerHTML = `
        <div class="card" style="max-width:800px">
          <div class="card-header"><h4>Contractor Portal Settings</h4></div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group" style="display:flex; align-items:center; gap:12px; background:var(--content-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color)">
              <input type="checkbox" id="contractor-portal-enable" class="form-checkbox" style="width:20px; height:20px; cursor:pointer;" ${portalEnabled ? 'checked' : ''} />
              <div style="cursor:pointer;" onclick="document.getElementById('contractor-portal-enable').click()">
                <strong style="display:block; font-size:14px; color:var(--text-primary);">Enable Contractor Portal Link Access</strong>
                <span style="font-size:12px; color:var(--text-secondary);">When disabled, any subcontractor attempting to load their portal token will see an access deactivated notice.</span>
              </div>
            </div>
          </div>
          <div class="card-footer" style="display:flex; justify-content:flex-end">
            <button class="btn btn-primary" id="btn-save-contractor-settings" data-tooltip="Save subcontractor portal access rules" data-tooltip-pos="top">
              <span class="material-icons-outlined">save</span> Save Contractor Settings
            </button>
          </div>
        </div>
      `;

      tc.querySelector('#btn-save-contractor-settings').addEventListener('click', async () => {
        const btn = tc.querySelector('#btn-save-contractor-settings');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

        try {
          const settings = store.getSettings();
          settings.enableContractorPortal = tc.querySelector('#contractor-portal-enable').checked;

          await store.saveSettings(settings);
          showToast('Contractor portal settings saved successfully', 'success');
        } catch (err) {
          console.error('Error saving contractor portal settings:', err);
          showToast('Failed to save settings: ' + (err.message || err), 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      });

    } else if (activeTab === 'system') {

      const s = store.getSettings();
      const currentPref = s.tooltipPreference || 'full';
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const currentTheme = (currentUser && currentUser.id) ? (currentUser.theme || localStorage.getItem(`simpro_theme_${currentUser.id}`) || 'light') : 'light';
      tc.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-lg); max-width:960px; align-items:start;">
          <!-- Left Column -->
          <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
            <!-- Data Management -->
            <div class="card">
              <div class="card-header"><h4>Data Management</h4></div>
              <div class="card-body">
                <p class="text-secondary" style="margin-bottom:var(--space-lg)">
                  ${isLocalMode ? 'Manage your application data. All data is stored locally in your browser.' : 'Manage database records for your cloud company account.'}
                </p>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${currentUser.role === 'admin' ? `
                    <div style="background:var(--color-danger-bg); padding:var(--space-md); border-radius:var(--border-radius); border:1px solid rgba(220, 38, 38, 0.15)">
                      <h5 style="color:var(--color-danger); margin-bottom:8px; display:flex; align-items:center; gap:6px; font-weight:600;">
                        <span class="material-icons-outlined">admin_panel_settings</span> Administrator Actions
                      </h5>
                      <p style="font-size:var(--font-size-sm); color:var(--text-secondary); margin-bottom:var(--space-md); line-height:1.4;">
                        Configure clean setups, seed a single test sample, or convert your company account deployment profile.
                      </p>
                      <button class="btn btn-secondary" id="btn-seed-minimal" data-tooltip="Clean database and seed a complete demonstration dataset" data-tooltip-pos="left" style="width:100%; justify-content:center; margin-bottom:12px; border:1px solid rgba(0,0,0,0.12)">
                        <span class="material-icons-outlined">science</span> Seed Demonstration Data
                      </button>
                      <button class="btn btn-danger" id="btn-restore-new" data-tooltip="Delete all data and return system to a clean blank state" data-tooltip-pos="left" style="width:100%; justify-content:center; margin-bottom:12px;">
                        <span class="material-icons-outlined">cleaning_services</span> Restore to New (Blank State)
                      </button>
                      <button class="btn btn-danger" id="btn-delete-company" data-tooltip="Permanently delete the entire company profile and all data" data-tooltip-pos="left" style="width:100%; justify-content:center; background:var(--color-danger); border-color:var(--color-danger); color:#fff; display:flex; align-items:center; gap:6px;">
                        <span class="material-icons-outlined">delete_forever</span> Delete Company Profile
                      </button>

                      ${isLocalMode ? `
                        <div style="margin-top:16px; padding-top:12px; border-top:1px dashed rgba(220, 38, 38, 0.2)">
                          <h6 style="color:var(--color-warning); margin-bottom:8px; font-weight:600; display:flex; align-items:center; gap:4px;">
                            <span class="material-icons-outlined" style="font-size:16px">warning</span> Irreversible Profile Conversions
                          </h6>
                          <p style="font-size:11px; color:var(--text-secondary); margin-bottom:12px; line-height:1.3;">
                            Convert your deployment type. These transitions are permanent and one-way.
                          </p>
                          ${localDeploymentType === 'single_user' ? `
                            <button class="btn" id="btn-convert-multiuser" style="width:100%; justify-content:center; margin-bottom:12px; background:var(--color-warning); border-color:var(--color-warning); color:#fff; display:flex; align-items:center; gap:6px; font-size:12.5px;">
                              <span class="material-icons-outlined" style="font-size:16px">lan</span> Convert to Multi-User Local Network Sync
                            </button>
                          ` : ''}
                          <button class="btn" id="btn-convert-cloud-action" style="width:100%; justify-content:center; background:var(--color-warning); border-color:var(--color-warning); color:#fff; display:flex; align-items:center; gap:6px; font-size:12.5px;">
                            <span class="material-icons-outlined" style="font-size:16px">cloud_upload</span> Convert to Cloud Sync
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  ` : '<div style="font-size:12.5px; color:var(--text-tertiary)">Administrative actions are restricted to company administrators.</div>'}
                </div>
              </div>
            </div>

            <!-- Local Data Backup -->
            ${!isLocalMode && currentUser.role === 'admin' ? `
              <div class="card">
                <div class="card-header" style="display:flex; align-items:center; gap:8px;">
                  <span class="material-icons-outlined" style="color:var(--color-primary)">backup</span>
                  <h4 style="margin:0;">Local Data Backup</h4>
                </div>
                <div class="card-body" style="display:flex; flex-direction:column; gap:12px;">
                  <p class="text-secondary" style="font-size:var(--font-size-sm); line-height:1.4; margin:0;">
                    To keep your data completely safe, configure a local directory to back up all your cloud database records as JSON files.
                  </p>
                  <div id="backup-status-container"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right Column -->
          <!-- Interface Preferences -->
          <div class="card">
            <div class="card-header"><h4>Interface Preferences</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px;">
              <div class="form-group">
                <label class="form-label" style="font-weight:600;">Information Popups (Tooltips)</label>
                <select class="form-select" id="tooltip-preference" style="width:100%">
                  <option value="full" ${currentPref === 'full' ? 'selected' : ''}>Full Info (Show all tooltips)</option>
                  <option value="partial" ${currentPref === 'partial' ? 'selected' : ''}>Partial Info (Critical & destructive actions only)</option>
                  <option value="none" ${currentPref === 'none' ? 'selected' : ''}>No Info (Disable all tooltips)</option>
                </select>
                <p class="text-tertiary" style="font-size:12px; margin-top:8px; line-height:1.4;">
                  Controls the descriptive popup helpers shown when hovering over buttons, actions, and categories.
                </p>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight:600;">System Color Theme</label>
                <select class="form-select" id="system-theme-select" style="width:100%">
                  ${Object.entries(THEMES).map(([key, val]) => `
                    <option value="${key}" ${currentTheme === key ? 'selected' : ''}>${val.name}</option>
                  `).join('')}
                </select>
                <p class="text-tertiary" style="font-size:12px; margin-top:8px; line-height:1.4;">
                  Select a color profile and visual background effect for your user interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      `;

      tc.querySelector('#tooltip-preference')?.addEventListener('change', async (e) => {
        const select = e.target;
        select.disabled = true;
        try {
          const settings = store.getSettings();
          settings.tooltipPreference = select.value;
          await store.saveSettings(settings);
          window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
          showToast('Interface preferences saved successfully', 'success');
        } catch (err) {
          console.error('Error saving tooltip preference:', err);
          showToast('Failed to save preferences: ' + (err.message || err), 'error');
        } finally {
          select.disabled = false;
        }
      });

      tc.querySelector('#system-theme-select')?.addEventListener('change', (e) => {
        applyTheme(e.target.value, true);
        showToast('System theme updated successfully', 'success');
      });

      tc.querySelector('#btn-seed-minimal')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content.innerHTML = `
          <p style="margin-bottom:12px">You are about to seed a complete demonstration dataset.</p>
          <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-info); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined">info</span>
            <span>This will clear current database records and load a complete, realistic demonstration dataset representing an active trade business (5 customers, 5 quotes/jobs per customer, 5 assets per customer, 5 materials, 5 users/timesheets, etc.) for testing.</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary)">This is highly recommended for testing and walkthroughs.</p>
        `;

        showModal({
          title: "Seed Demonstration Data",
          content: content,
          actions: [
            {
              label: "Cancel",
              className: "btn-secondary",
              onClick: (close) => close()
            },
            {
              label: "Seed Demo Data",
              className: "btn-primary",
              onClick: async (close) => {
                close();
                showToast('Seeding demonstration data...', 'info');
                await seedMinimalData();
                showToast('Demonstration data seeded. Reloading...', 'success');
                setTimeout(() => window.location.reload(), 1200);
              }
            }
          ]
        });
      });

      tc.querySelector('#btn-restore-new')?.addEventListener('click', () => {
        const content1 = document.createElement('div');
        content1.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content1.innerHTML = `
          <p style="margin-bottom:12px">You are about to restore the application to a blank state.</p>
          <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-warning); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined">warning</span>
            <span><strong>What gets wiped:</strong> Customers, Jobs, Tasks, Quotes, Invoices, Purchase Orders, Suppliers, Contractors, Assets, and Schedule Blocks.</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary)">Only default User Types and Technician login credentials will be retained so you can log back in.</p>
        `;

        showModal({
          title: "Restore to New (Blank State)",
          content: content1,
          actions: [
            {
              label: "Cancel",
              className: "btn-secondary",
              onClick: (close1) => close1()
            },
            {
              label: "Continue Wiping",
              className: "btn-danger",
              onClick: (close1) => {
                close1();
                
                const content2 = document.createElement('div');
                content2.style.cssText = 'line-height:1.6; color:var(--text-primary);';
                content2.innerHTML = `
                  <p style="margin-bottom:12px; font-weight:600; color:var(--color-danger)">THIS ACTION IS IRREVERSIBLE AND CANNOT BE UNDONE!</p>
                  <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-danger); font-weight:500; display:flex; align-items:center; gap:8px;">
                    <span class="material-icons-outlined">error_outline</span>
                    <span>Confirming will permanently delete all local storage records and start completely fresh from scratch for your real company.</span>
                  </div>
                  <p style="font-size:12px; color:var(--text-secondary)">Are you absolutely 100% sure you want to proceed?</p>
                `;

                showModal({
                  title: "⚠️ Permanent Database Wipe",
                  content: content2,
                  actions: [
                    {
                      label: "Abort Wiping",
                      className: "btn-secondary",
                      onClick: (close2) => close2()
                    },
                    {
                      label: "Yes, Wipe Everything!",
                      className: "btn-danger",
                      onClick: (close2) => {
                        close2();
                        
                        store.clearAll();
                        localStorage.setItem('simpro__prevent_seeding', 'true');
                        localStorage.setItem('simpro__seeded', 'true');
                        localStorage.removeItem('currentUser');
                        
                        showToast('App restored to fresh state. Reloading...', 'success');
                        
                        setTimeout(() => {
                          window.location.hash = '#/login';
                          window.location.reload();
                        }, 1200);
                      }
                    }
                  ]
                });
              }
            }
          ]
        });
      });

      tc.querySelector('#btn-delete-company')?.addEventListener('click', () => {
        // Modal Warning 1 of 2
        const content1 = document.createElement('div');
        content1.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content1.innerHTML = `
          <p style="margin-bottom:12px; font-weight:600; color:var(--color-danger)">WARNING: CRITICAL DESTRUCTIVE ACTION (1 of 2)</p>
          <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-danger); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size:24px">warning</span>
            <span>You are about to permanently delete the entire company profile for <strong>${escapeHTML(store.getSettings().name || '')}</strong> and all associated database records (jobs, quotes, invoices, people, assets, forms, etc.).</span>
          </div>
          <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:12px">
            This action is final, irreversible, and cannot be undone under any circumstances.
          </p>
          <p style="font-size:12px; color:var(--text-secondary)">Do you want to proceed to password confirmation?</p>
        `;

        showModal({
          title: "Delete Company Profile - Step 1 of 2",
          content: content1,
          actions: [
            {
              label: "Cancel",
              className: "btn-secondary",
              onClick: (closeModal) => closeModal()
            },
            {
              label: "Proceed to Confirm",
              className: "btn-danger",
              onClick: (closeModal) => {
                closeModal();
                
                // Modal Warning 2 of 2
                const content2 = document.createElement('div');
                content2.style.cssText = 'line-height:1.6; color:var(--text-primary);';
                content2.innerHTML = `
                  <form id="delete-company-confirm-form" style="display:flex; flex-direction:column; gap:16px;">
                    <p style="margin-bottom:8px; font-weight:600; color:var(--color-danger)">FINAL CONFIRMATION (2 of 2)</p>
                    <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; font-size:12.5px; color:var(--color-danger); font-weight:500; display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:24px">gavel</span>
                      <span>To authorize the permanent destruction of this company, you must enter the Administrator password.</span>
                    </div>

                    <div class="form-group" style="margin-top:12px;">
                      <label class="form-label" style="font-weight:600;">Administrator Password</label>
                      <input class="form-input" type="password" id="delete-confirm-password" required placeholder="Enter admin password to proceed" />
                    </div>

                    <div id="delete-confirm-error" style="display:none; color:var(--color-danger); background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 14px; border-radius:4px; font-size:13px; font-weight:500; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
                      <span id="delete-confirm-error-text"></span>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">
                      <button type="button" class="btn btn-secondary" id="btn-delete-abort">Abort Deletion</button>
                      <button type="submit" class="btn btn-danger" id="btn-delete-confirm-submit" style="display:flex; align-items:center; gap:6px;">
                        <span class="material-icons-outlined">delete_forever</span>
                        <span>Permanently Delete Company</span>
                      </button>
                    </div>
                  </form>
                `;

                const { close: close2 } = showModal({
                  title: "⚠️ Confirm Company Deletion - Step 2 of 2",
                  content: content2,
                  size: "modal-md"
                });

                content2.querySelector('#btn-delete-abort').addEventListener('click', close2);

                const form2 = content2.querySelector('#delete-company-confirm-form');
                form2.addEventListener('submit', async (ev) => {
                  ev.preventDefault();

                  const errorEl = content2.querySelector('#delete-confirm-error');
                  const errorTextEl = content2.querySelector('#delete-confirm-error-text');
                  const submitBtn = content2.querySelector('#btn-delete-confirm-submit');
                  const abortBtn = content2.querySelector('#btn-delete-abort');
                  const passwordInput = content2.querySelector('#delete-confirm-password').value;

                  errorEl.style.display = 'none';
                  submitBtn.disabled = true;
                  abortBtn.disabled = true;
                  const origSubmitText = submitBtn.innerHTML;
                  submitBtn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Deleting...';

                  try {
                    let passwordVerified = false;

                    if (isLocalMode) {
                      if (localDeploymentType === 'single_user') {
                        const activeAccountId = sessionStorage.getItem('relay_active_account');
                        const storedAccounts = await storageGet('relay_accounts') || [];
                        const acct = storedAccounts.find(a => a.id === activeAccountId);
                        if (acct && acct.hasPassword) {
                          const hashedInput = await hashPassword(passwordInput);
                          if (hashedInput === acct.passwordHash) {
                            passwordVerified = true;
                          } else {
                            throw new Error('Incorrect administrator password.');
                          }
                        } else {
                          // No password set
                          passwordVerified = true;
                        }
                      } else {
                        // local_multiuser
                        const techs = store.getAll('technicians') || [];
                        const currentTech = techs.find(t => t.id === currentUser.id);
                        const expectedPassword = currentTech ? currentTech.password : '123456';
                        if (passwordInput === expectedPassword) {
                          passwordVerified = true;
                        } else {
                          throw new Error('Incorrect administrator password.');
                        }
                      }
                    } else {
                      // Cloud mode
                      const { supabase } = await import('../utils/supabase.js');
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user && user.email) {
                        const { error } = await supabase.auth.signInWithPassword({
                          email: user.email,
                          password: passwordInput
                        });
                        if (!error) {
                          passwordVerified = true;
                        } else {
                          throw new Error('Incorrect administrator password.');
                        }
                      } else {
                        throw new Error('Could not retrieve logged-in cloud user credentials.');
                      }
                    }

                    if (passwordVerified) {
                      // 1. If cloud mode, delete the company row in Supabase
                      if (!isLocalMode) {
                        const { supabase } = await import('../utils/supabase.js');
                        const { error: deleteErr } = await supabase.from('companies').delete().eq('id', store.companyId);
                        if (deleteErr) {
                          throw new Error('Failed to delete cloud company: ' + deleteErr.message);
                        }
                      }

                      // 2. Trigger store.clearAll()
                      store.clearAll();

                      // 3. Clear local account launcher keys if local mode
                      if (isLocalMode) {
                        const activeAccountId = sessionStorage.getItem('relay_active_account');
                        if (activeAccountId) {
                          const storedAccounts = await storageGet('relay_accounts') || [];
                          const updatedAccounts = storedAccounts.filter(a => a.id !== activeAccountId);
                          await storageSet('relay_accounts', updatedAccounts);
                        }
                      }

                      // 4. Remove session user & active account
                      localStorage.removeItem('currentUser');
                      sessionStorage.removeItem('relay_active_account');

                      showToast('Company profile deleted successfully.', 'success');
                      close2();

                      setTimeout(() => {
                        window.location.hash = '#/login';
                        window.location.reload();
                      }, 1200);
                    }
                  } catch (err) {
                    console.error('Company deletion failed:', err);
                    errorTextEl.textContent = err.message || 'An error occurred during verification.';
                    errorEl.style.display = 'flex';
                    submitBtn.disabled = false;
                    abortBtn.disabled = false;
                    submitBtn.innerHTML = origSubmitText;
                  }
                });
              }
            }
          ]
        });
      });

      tc.querySelector('#btn-convert-multiuser')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.style.cssText = 'line-height:1.6; color:var(--text-primary);';

        const techs = store.getAll('technicians') || [];
        const companyId = store.companyId || '';
        const adminTypeId = companyId.startsWith('acct_') ? `${companyId}_ut_admin` : 'ut_admin';
        const existingAdmin = techs.find(t => t.userTypeId === adminTypeId || t.role?.toLowerCase() === 'admin');

        const currentTechName = existingAdmin ? existingAdmin.name : (currentUser.name && currentUser.name !== 'Local Admin' ? currentUser.name : '');
        const currentTechUsernameOrEmail = existingAdmin ? (existingAdmin.email || existingAdmin.username || '') : '';

        content.innerHTML = `
          <form id="convert-multiuser-form" style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; font-size:12.5px; color:var(--color-danger); display:flex; gap:8px;">
              <span class="material-icons-outlined" style="color:var(--color-danger);">warning</span>
              <div>
                <strong>CRITICAL WARNING:</strong> Converting to Multi-User Local Network Sync is a permanent, one-way transition. Once converted, you cannot revert this profile back to a single-user Local Admin profile.
              </div>
            </div>

            <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; border-radius:4px; font-size:12.5px; color:var(--color-info); display:flex; gap:8px;">
              <span class="material-icons-outlined" style="color:var(--color-info);">info</span>
              <div>
                Configure the administrator user credentials. This user will have admin access to add other users in the unlocked Users tab.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Confirm Business Name</label>
              <input class="form-input" id="multiuser-company-name" required value="${escapeHTML(store.getSettings().name || '')}" placeholder="e.g. Apex Power Services" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Administrator Full Name</label>
              <input class="form-input" id="multiuser-admin-name" required value="${escapeHTML(currentTechName)}" placeholder="e.g. John Doe" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Administrator Email Address (Required)</label>
              <input class="form-input" type="email" id="multiuser-admin-email" required value="${escapeHTML(currentTechUsernameOrEmail)}" placeholder="e.g. admin@yourcompany.com" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Admin Password</label>
              <input class="form-input" type="password" id="multiuser-admin-password" required minlength="6" placeholder="At least 6 characters" />
            </div>

            <div id="multiuser-error" style="display:none; color:var(--color-danger); background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 14px; border-radius:4px; font-size:13px; font-weight:500; align-items:center; gap:8px;">
              <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
              <span id="multiuser-error-text"></span>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">
              <button type="button" class="btn btn-secondary" id="btn-multiuser-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-multiuser-submit" style="background:var(--color-warning); border-color:var(--color-warning); color:#fff; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:18px;">lan</span>
                <span>Convert Company</span>
              </button>
            </div>
          </form>
        `;

        const { close } = showModal({
          title: "Convert to Multi-User Local Sync",
          content: content,
          size: "modal-md"
        });

        content.querySelector('#btn-multiuser-cancel').addEventListener('click', close);

        const form = content.querySelector('#convert-multiuser-form');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const errorEl = content.querySelector('#multiuser-error');
          const errorTextEl = content.querySelector('#multiuser-error-text');
          const submitBtn = content.querySelector('#btn-multiuser-submit');
          const cancelBtn = content.querySelector('#btn-multiuser-cancel');

          errorEl.style.display = 'none';
          submitBtn.disabled = true;
          cancelBtn.disabled = true;

          const businessName = content.querySelector('#multiuser-company-name').value.trim();
          const adminName = content.querySelector('#multiuser-admin-name').value.trim();
          const adminEmail = content.querySelector('#multiuser-admin-email').value.trim();
          const adminPassword = content.querySelector('#multiuser-admin-password').value;

          try {
            if (!businessName || !adminName || !adminEmail || !adminPassword) {
              throw new Error('All fields are required.');
            }
            if (adminPassword.length < 6) {
              throw new Error('Password must be at least 6 characters.');
            }

            // 1. Update settings
            const settings = store.getSettings();
            settings.name = businessName;
            settings.localDeploymentType = 'multi_user';
            await store.saveSettings(settings);

            // 2. Update launcher accounts businessName
            const activeAccountId = sessionStorage.getItem('relay_active_account');
            if (activeAccountId) {
              const storedAccounts = await storageGet('relay_accounts') || [];
              const acctIndex = storedAccounts.findIndex(a => a.id === activeAccountId);
              if (acctIndex !== -1) {
                storedAccounts[acctIndex].businessName = businessName;
                await storageSet('relay_accounts', storedAccounts);
              }
            }

            // 3. Create or update admin user in technicians
            const companyId = store.companyId;
            const adminTypeId = companyId.startsWith('acct_') ? `${companyId}_ut_admin` : 'ut_admin';
            const techs = store.getAll('technicians') || [];
            let adminTech = techs.find(t => t.userTypeId === adminTypeId || t.role?.toLowerCase() === 'admin');

            if (!adminTech) {
              adminTech = {
                id: `${companyId}_tech_admin_created`,
                role: 'Admin',
                color: '#FF5C00',
                userTypeId: adminTypeId,
                payRate: 100.00,
                phone: ''
              };
              techs.push(adminTech);
            }

            adminTech.name = adminName;
            adminTech.username = adminEmail.split('@')[0];
            adminTech.email = adminEmail;
            adminTech.password = adminPassword;

            store.save('technicians', techs);

            // 4. Update currentUser session in localStorage
            const localUser = {
              id: adminTech.id,
              companyId: companyId,
              name: adminTech.name,
              role: 'admin',
              userTypeName: 'Admin',
              userTypeId: adminTech.userTypeId,
              color: adminTech.color || '#FF5C00',
              theme: 'light'
            };
            localStorage.setItem('currentUser', JSON.stringify(localUser));

            showToast('Converted to Multi-User Local Network Sync. Reloading...', 'success');
            close();
            window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
            setTimeout(() => window.location.reload(), 1200);
          } catch (err) {
            console.error('Conversion failed:', err);
            errorTextEl.textContent = err.message || 'An error occurred during conversion.';
            errorEl.style.display = 'flex';
            submitBtn.disabled = false;
            cancelBtn.disabled = false;
          }
        });
      });

      tc.querySelector('#btn-convert-cloud-action')?.addEventListener('click', () => {
        openMigrationModal();
      });

      const renderBackupStatus = () => {
        const bsc = tc.querySelector('#backup-status-container');
        if (!bsc) return;

        const hasHandle = !!store.backupDirHandle;
        const isPermissionGranted = store.backupDirPermissionGranted;
        const lastBackup = localStorage.getItem('relay_last_backup_time');
        const formattedLastBackup = lastBackup ? new Date(lastBackup).toLocaleString() : 'Never';
        const isSupported = typeof window !== 'undefined' && window.showDirectoryPicker;

        if (!isSupported) {
          bsc.innerHTML = `
            <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 12px; border-radius:4px; font-size:12px; color:var(--color-danger); line-height:1.4;">
              <strong style="display:block; margin-bottom:4px;">Browser Local Folder Access Unsupported</strong>
              Your current browser does not support local folder access. Please use Chrome, Edge, or a Chromium-based browser to configure local backups.
            </div>
          `;
          return;
        }

        if (!hasHandle) {
          bsc.innerHTML = `
            <div style="background:var(--bg-color); border:1px solid var(--border-color); padding:12px; border-radius:6px; margin-bottom:12px; color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
              <span class="material-icons-outlined" style="color:var(--text-tertiary);">folder_off</span>
              <div style="font-size:12.5px;">No backup folder configured.</div>
            </div>
            <button class="btn btn-secondary" id="btn-backup-pick" style="width:100%; justify-content:center;">
              <span class="material-icons-outlined">folder</span> Choose Backup Folder...
            </button>
          `;
        } else if (!isPermissionGranted) {
          bsc.innerHTML = `
            <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:10px 12px; border-radius:4px; font-size:12px; color:var(--color-warning); line-height:1.4; margin-bottom:12px;">
              <strong>Permission Required</strong><br/>
              Access permission to <strong>${escapeHTML(store.backupDirHandle.name)}</strong> has expired. Please re-authorize.
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-warning" id="btn-backup-auth" style="flex:1; justify-content:center;">
                <span class="material-icons-outlined">vpn_key</span> Re-authorize & Backup
              </button>
              <button class="btn btn-ghost" id="btn-backup-disconnect" style="color:var(--color-danger); border:1px solid var(--border-color);" title="Disconnect Folder">
                <span class="material-icons-outlined">link_off</span>
              </button>
            </div>
          `;
        } else {
          bsc.innerHTML = `
            <div style="background:var(--color-success-bg); border-left:4px solid var(--color-success); padding:10px 12px; border-radius:4px; font-size:12px; color:var(--color-success); line-height:1.4; margin-bottom:12px;">
              <strong>Backup Configured</strong><br/>
              Folder: <strong>${escapeHTML(store.backupDirHandle.name)}</strong><br/>
              Last Backup: <strong>${formattedLastBackup}</strong>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-primary" id="btn-backup-now" style="width:100%; justify-content:center;">
                <span class="material-icons-outlined">backup</span> Backup Now
              </button>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" id="btn-backup-pick" style="flex:1; justify-content:center; border:1px solid var(--border-color);">
                  <span class="material-icons-outlined">folder</span> Change Folder...
                </button>
                <button class="btn btn-ghost" id="btn-backup-disconnect" style="color:var(--color-danger); border:1px solid var(--border-color);" title="Disconnect Folder">
                  <span class="material-icons-outlined">link_off</span>
                </button>
              </div>
            </div>
          `;
        }

        // Attach event listeners for backup buttons inside container
        bsc.querySelector('#btn-backup-pick')?.addEventListener('click', async () => {
          try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await store.setBackupDirectory(handle);
            showToast('Backup directory selected successfully.', 'success');
            showToast('Running initial backup...', 'info');
            await store.backupToFolder(handle);
            showToast('Backup completed successfully!', 'success');
            renderBackupStatus();
          } catch (err) {
            console.error('Failed to select backup directory:', err);
            if (err.name !== 'AbortError') {
              showToast('Failed to configure backup: ' + err.message, 'error');
            }
          }
        });

        bsc.querySelector('#btn-backup-auth')?.addEventListener('click', async () => {
          const granted = await store.verifyBackupDirPermission(true);
          if (granted) {
            showToast('Permission re-authorized. Backing up...', 'info');
            try {
              await store.backupToFolder();
              showToast('Backup completed successfully!', 'success');
            } catch (err) {
              showToast('Backup failed: ' + err.message, 'error');
            }
          } else {
            showToast('Failed to acquire write permission.', 'error');
          }
          renderBackupStatus();
        });

        bsc.querySelector('#btn-backup-now')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const origHtml = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Backing up...';
          
          try {
            await store.backupToFolder();
            showToast('Backup completed successfully!', 'success');
          } catch (err) {
            console.error(err);
            showToast('Backup failed: ' + err.message, 'error');
          } finally {
            btn.disabled = false;
            btn.innerHTML = origHtml;
            renderBackupStatus();
          }
        });

        bsc.querySelector('#btn-backup-disconnect')?.addEventListener('click', async () => {
          await store.setBackupDirectory(null);
          showToast('Backup folder disconnected.', 'info');
          renderBackupStatus();
        });
      };

      if (!isLocalMode && currentUser.role === 'admin') {
        renderBackupStatus();
      }
    }
  }

  function openUserTypeModal(editId = null) {
    let ut = editId ? store.getById('userTypes', editId) : { name: '', description: '', template: 'Admin' };
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
        ${!editId ? `
        <div class="form-group">
          <label class="form-label">Template (Auto-fills permissions)</label>
          <select class="form-select" id="ut-template">
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Technician">Technician</option>
            <option value="Office Staff">Office Staff</option>
            <option value="Custom">Custom</option>
          </select>
          <button class="btn btn-secondary mt-2" id="ut-custom-edit-perms" style="display:none; width:100%; justify-content:center; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size:16px;">edit</span> Configure Custom Permissions
          </button>
        </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">User Type Name</label>
          <input class="form-input" id="ut-name" value="${ut.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${ut.description}" />
        </div>
    `;

    const templateSelect = contentDiv.querySelector('#ut-template');
    const customEditBtn = contentDiv.querySelector('#ut-custom-edit-perms');

    if (templateSelect && customEditBtn) {
      templateSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Custom') {
          customEditBtn.style.display = 'flex';
        } else {
          customEditBtn.style.display = 'none';
        }
      });
      
      customEditBtn.addEventListener('click', () => {
         const name = contentDiv.querySelector('#ut-name').value;
         const desc = contentDiv.querySelector('#ut-desc').value;
         if (!name) {
           showToast('Please enter a User Type Name first', 'error');
           return;
         }
         
         const perms = buildGranularPerms(() => false);
         const newUt = store.create('userTypes', { name, description: desc, permissions: perms });
         
         document.getElementById('modal-close-btn')?.click();
         openPermissionsModal(newUt.id);
      });
    }

    showModal({
      title: editId ? 'Edit User Type' : 'Add User Type',
      content: contentDiv,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Save', className: 'btn-primary', onClick: c => {
          const name = document.getElementById('ut-name').value;
          const desc = document.getElementById('ut-desc').value;
          const template = document.getElementById('ut-template')?.value;
          
          if (!name) { showToast('Name required', 'error'); return; }
          
          if (editId) {
            store.update('userTypes', editId, { name, description: desc });
          } else {
            const baseModules = ['Dashboard', 'Customers', 'Leads', 'Quotes', 'Jobs', 'Timesheets', 'Assets', 'Schedule', 'Contractors', 'Stock', 'Purchase Orders', 'Invoices', 'Documents', 'Reports', 'Settings'];
            let perms = [];
            if (template === 'Admin') perms = buildGranularPerms(() => true);
            else if (template === 'Manager') perms = buildGranularPerms((mod, key) => {
              if (mod === 'Settings') return ['view', 'edit_company'].includes(key);
              return true;
            });
            else if (template === 'Technician') perms = buildGranularPerms((mod, key) => {
              if (mod === 'Dashboard') return key === 'view';
              if (mod === 'Jobs') return ['view', 'manage_tasks', 'book_time'].includes(key);
              if (mod === 'Timesheets') return ['view_own', 'create'].includes(key);
              if (mod === 'Schedule') return ['view_own'].includes(key);
              return false;
            });
            else if (template === 'Office Staff') perms = buildGranularPerms((mod, key) => {
              if (mod === 'Settings') return false;
              if (mod === 'Reports') return key === 'view';
              if (['Invoices', 'Purchase Orders'].includes(mod) && key === 'delete') return false;
              return true;
            });
            else perms = buildGranularPerms(() => false);

            store.create('userTypes', { name, description: desc, permissions: perms });
          }
          showToast('User Type saved', 'success');
          renderContent();
          c();
        }}
      ]
    });
  }

  function openPermissionsModal(id) {
    const ut = store.getById('userTypes', id);
    if (!ut) return;

    const existingPerms = ut.permissions || [];
    const permsMap = {};
    existingPerms.forEach(p => { permsMap[p.module] = p; });

    const contentDiv = document.createElement('div');

    const moduleSections = Object.entries(MODULE_PERMS).map(([module, permDefs]) => {
      const existing = permsMap[module] || {};
      const allChecked = permDefs.every(({ key }) => existing[key]);
      const permCheckboxes = permDefs.map(({ key, label }) => `
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${module}" data-key="${key}" ${existing[key] ? 'checked' : ''}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${label}</span>
        </label>
      `).join('');
      return `
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${module}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${module}" ${allChecked ? 'checked' : ''}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${permCheckboxes}
          </div>
        </div>
      `;
    }).join('');

    contentDiv.innerHTML = `
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${moduleSections}
      </div>
    `;

    contentDiv.querySelector('#btn-select-all-perms').addEventListener('click', () => {
      contentDiv.querySelectorAll('.perm-chk, .module-select-all').forEach(c => c.checked = true);
    });
    contentDiv.querySelector('#btn-deselect-all-perms').addEventListener('click', () => {
      contentDiv.querySelectorAll('.perm-chk, .module-select-all').forEach(c => c.checked = false);
    });
    contentDiv.querySelectorAll('.module-select-all').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const mod = e.target.dataset.module;
        contentDiv.querySelectorAll(`.perm-chk[data-module="${mod}"]`).forEach(c => c.checked = e.target.checked);
      });
    });
    contentDiv.querySelectorAll('.perm-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const mod = chk.dataset.module;
        const defs = MODULE_PERMS[mod] || [];
        const allChecked = defs.every(({ key }) => {
          const c = contentDiv.querySelector(`.perm-chk[data-module="${mod}"][data-key="${key}"]`);
          return c && c.checked;
        });
        const toggle = contentDiv.querySelector(`.module-select-all[data-module="${mod}"]`);
        if (toggle) toggle.checked = allChecked;
      });
    });

    showModal({
      title: `Edit Permissions: ${ut.name}`,
      content: contentDiv,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Save Permissions', className: 'btn-primary', onClick: c => {
          const newPerms = Object.entries(MODULE_PERMS).map(([module, permDefs]) => {
            const obj = { module };
            permDefs.forEach(({ key }) => {
              const chk = contentDiv.querySelector(`.perm-chk[data-module="${module}"][data-key="${key}"]`);
              obj[key] = chk ? chk.checked : false;
            });
            return obj;
          });
          store.update('userTypes', id, { permissions: newPerms });
          showToast('Permissions updated successfully', 'success');
          renderContent();
          c();
        }}
      ]
    });
  }

  function openUserModal(editId = null) {
    let t = editId ? store.getById('technicians', editId) : { name: '', role: '', color: '#1B6DE0', username: '', userTypeId: '' };
    const userTypes = store.getAll('userTypes');
    const companySlug = store.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${t.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Username</label>
        <input class="form-input" id="u-username" value="${t.username || (t.email ? t.email.split('@')[0] : '')}" ${editId ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''} placeholder="e.g. joshua" />
        ${!editId ? `
        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px; font-weight: 500;">
          Company login code is: <strong style="color: var(--color-primary)">${companySlug}</strong>. User will log in with <strong style="color: var(--color-primary)">username@${companySlug}</strong>
        </div>
        ` : ''}
      </div>
      <div class="form-group">
        <label class="form-label">${editId ? 'Reset Password (leave blank to keep current)' : 'Temporary Password (assigned for worker login)'}</label>
        <input class="form-input" id="u-password" type="password" placeholder="${editId ? '••••••••' : 'Min. 6 characters'}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${t.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type" ${(t.userTypeId === 'ut_admin' || (t.userTypeId && t.userTypeId.endsWith('_ut_admin'))) ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
            <option value="">-- Select --</option>
            ${userTypes
              .filter(ut => (!ut.id.endsWith('_ut_admin') && ut.id !== 'ut_admin') || t.userTypeId === ut.id)
              .map(ut => `
                <option value="${ut.id}" ${t.userTypeId === ut.id ? 'selected' : ''}>${ut.name}</option>
              `).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary);font-size:15px">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${t.payRate || ''}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary" style="font-size:var(--font-size-sm)">/hr — used in job cost &amp; P&amp;L calculations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${['#1B6DE0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B', '#0EA5E9'].map(c => `
            <div class="color-swatch" data-color="${c}" style="width:28px; height:28px; border-radius:50%; background:${c}; cursor:pointer; border:2px solid ${t.color.toUpperCase() === c.toUpperCase() ? 'var(--text-primary)' : 'transparent'}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join('')}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${t.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;

    const colorInput = contentDiv.querySelector('#u-color');
    const swatches = contentDiv.querySelectorAll('.color-swatch');

    swatches.forEach(sw => {
      sw.addEventListener('click', () => {
        colorInput.value = sw.dataset.color;
        swatches.forEach(s => s.style.borderColor = 'transparent');
        sw.style.borderColor = 'var(--text-primary)';
      });
    });

    colorInput.addEventListener('input', () => {
      swatches.forEach(s => s.style.borderColor = 'transparent');
    });

    showModal({
      title: editId ? 'Edit User' : 'Add User',
      content: contentDiv,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Save', className: 'btn-primary btn-save-user', onClick: async (c) => {
          const name = document.getElementById('u-name').value.trim();
          const username = document.getElementById('u-username').value.trim();
          const role = document.getElementById('u-role').value.trim();
          const userTypeId = document.getElementById('u-type').value;
          const color = document.getElementById('u-color').value;
          const payRate = parseFloat(document.getElementById('u-payrate').value) || null;
          const password = document.getElementById('u-password')?.value || '';
          
          if (!name) { showToast('Name required', 'error'); return; }
          if (!username) { showToast('Username required', 'error'); return; }
          if (username.includes('@')) { showToast('Username cannot contain @ symbol', 'error'); return; }
          
          if (!editId && !password) { showToast('Password required', 'error'); return; }
          if (password && password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
          
          const saveBtn = document.querySelector('.btn-save-user');
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = 'Saving...';
          }

          try {
            const updates = { name, username, role, userTypeId, color, payRate };
            if (password) {
              updates.password = password;
            }

            if (editId) {
              await store.update('technicians', editId, updates);
            } else {
              await store.create('technicians', updates);
            }
            showToast('User saved successfully', 'success');
            renderContent();
            c();
          } catch (err) {
            showToast(err.message || 'Failed to save user.', 'error');
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.innerHTML = 'Save';
            }
          }
        }}
      ]
    });
  }

  document.addEventListener('save-settings', () => showToast('Settings saved', 'success'));

  function renderTasksSettings(tc) {
    const templates = store.getAll('taskTemplates');
    tc.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0">Tasklist Templates</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-template" data-tooltip="Create a new tasklist template to standardize workflows" data-tooltip-pos="left">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Create Template
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Description</th>
                <th>Tags</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${templates.length ? templates.map(t => `
                <tr>
                  <td class="font-medium">${escapeHTML(t.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escapeHTML(t.description || '—')}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(t.tags || []).map(tag => `<span class="badge badge-neutral" style="font-size:10px">${escapeHTML(tag)}</span>`).join('')}
                    </div>
                  </td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-template" data-id="${t.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-template" data-id="${t.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center text-tertiary" style="padding:32px">No templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    tc.querySelector('#btn-add-template').addEventListener('click', () => {
      openEditTemplateModal();
    });

    tc.querySelectorAll('.btn-delete-template').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this template?')) {
          store.delete('taskTemplates', btn.dataset.id);
          renderContent();
        }
      });
    });

    tc.querySelectorAll('.btn-edit-template').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditTemplateModal(btn.dataset.id);
      });
    });

    function openEditTemplateModal(editId = null) {
      const t = editId ? store.getById('taskTemplates', editId) : { name: '', description: '', tags: [], tasks: [] };
      const content = document.createElement('div');
      content.style.maxHeight = '80vh';
      content.style.overflowY = 'auto';
      content.style.padding = '4px';
      
      // Deep clone local tasks and normalize legacy '.phases' / '.subPhases' / '.tasks'
      let localTasks = JSON.parse(JSON.stringify(t.tasks || t.phases || [])).map(p => {
        // Normalize name
        if (!p.subTasks && p.subPhases) {
          p.subTasks = p.subPhases;
          delete p.subPhases;
        }
        if (p.tasks && !p.subTasks) {
          p.subTasks = p.tasks.map(task => ({
            id: task.id || store.generateId(),
            name: task.name || '',
            estimatedHours: task.estimatedHours || 0,
            people: task.people || 1,
            status: 'Not Started',
            progress: 0
          }));
          delete p.tasks;
        }
        
        // Deep sub-tasks check helper
        function normalizeSubTasks(node) {
          if (node.subPhases && !node.subTasks) {
            node.subTasks = node.subPhases;
            delete node.subPhases;
          }
          if (!node.subTasks) node.subTasks = [];
          node.subTasks.forEach(normalizeSubTasks);
        }
        normalizeSubTasks(p);
        return p;
      });

      let taskExpandedPath = localTasks.length > 0 ? [0] : [];
      let taskViewPath = [];
      let isInfoPanelEditing = false;

      function getTaskByPath(tasks, path) {
        if (!path || path.length === 0) return null;
        let curr = tasks[path[0]];
        if (!curr) return null;
        for (let i = 1; i < path.length; i++) {
          if (!curr.subTasks) return null;
          curr = curr.subTasks[path[i]];
          if (!curr) return null;
        }
        return curr;
      }

      function calculateTotalHours(node) {
        if (!node.subTasks || node.subTasks.length === 0) {
           return (parseFloat(node.estimatedHours) || 0) * (parseInt(node.people) || 1);
        }
        return node.subTasks.reduce((sum, sp) => sum + calculateTotalHours(sp), 0);
      }

      const renderTemplateEditor = () => {
        content.innerHTML = `
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${escapeHTML(t.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${escapeHTML(t.description || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(t.tags || []).join(', ')}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(() => {
              const viewParentNode = taskViewPath.length > 0 ? getTaskByPath(localTasks, taskViewPath) : null;
              const viewList = viewParentNode ? (viewParentNode.subTasks || []) : localTasks;
              const viewTitle = viewParentNode ? escapeHTML(viewParentNode.name) : 'Main Tasks';
              
              return `
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${taskViewPath.length > 0 ? `<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>` : ''}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${viewTitle}">${viewTitle}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${viewList.map((p, i) => {
                      const currentPath = [...taskViewPath, i];
                      const isSelected = currentPath.join('-') === taskExpandedPath.join('-');
                      return `
                        <div class="tmpl-task-list-item" data-path="${currentPath.join('-')}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${isSelected ? 'background:var(--color-primary-light); color:var(--color-primary)' : 'background:var(--bg-color)'}">
                          <span style="font-weight:${isSelected ? '600' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</span>
                          ${p.subTasks && p.subTasks.length > 0 ? `<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${currentPath.join('-')}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>` : ''}
                        </div>
                      `;
                    }).join('')}
                    ${viewList.length === 0 ? '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>' : ''}
                  </div>
                </div>
              `;
            })()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${taskExpandedPath.length > 0 ? (() => {
                const path = taskExpandedPath;
                const node = getTaskByPath(localTasks, path);
                if (!node) return '<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';
                const hasSubs = node.subTasks && node.subTasks.length > 0;
                
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:40%" title="${escapeHTML(node.name)}">Task Details</h4>
                    <div style="display:flex; gap:6px">
                      ${path.length < 3 ? `<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>` : ''}
                      <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${path.join('-')}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span> Duplicate</button>
                      <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${path.join('-')}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                    </div>
                  </div>
                  <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label" style="font-size:11px">Name *</label>
                    <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${escapeHTML(node.name)}" style="font-size:13px" />
                  </div>
                  ${hasSubs ? `
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                      <div style="font-size:13px; font-weight:500">${calculateTotalHours(node)} hrs</div>
                    </div>
                  ` : `
                    <div class="form-row" style="margin-bottom:12px; gap:8px">
                      <div class="form-group">
                        <label class="form-label" style="font-size:11px">Est. Hours</label>
                        <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${node.estimatedHours || ''}" min="0" step="0.5" style="font-size:13px" />
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-size:11px">People</label>
                        <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${node.people || '1'}" min="1" step="1" style="font-size:13px" />
                      </div>
                    </div>
                  `}
                  <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label" style="font-size:11px">Description</label>
                    <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${escapeHTML(node.description || '')}</textarea>
                  </div>
                  ${!hasSubs ? `
                  <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:16px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                      <div style="display:flex; align-items:center; gap:6px">
                        <span class="material-icons-outlined" style="font-size:18px; color:var(--color-primary)">assignment</span>
                        <span style="font-size:13px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.3px">Value Fields</span>
                      </div>
                      <button class="btn btn-sm btn-secondary btn-add-value-field-tmpl" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Field</button>
                    </div>
                    <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:10px">Define the values a technician needs to record for this task (e.g. pressure readings, temperatures).</div>
                    <div style="display:flex; flex-direction:column; gap:8px" id="value-fields-config-tmpl">
                      ${(node.valueFields || []).map((vf, vi) => {
                        const ft = vf.fieldType || 'text';
                        return `
                        <div style="padding:10px 12px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px" data-vf-idx="${vi}">
                          <div style="display:flex; align-items:center; gap:8px; margin-bottom:${ft !== 'text' ? '8px' : '0'}">
                            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                            <input type="text" class="form-input vf-tmpl-label-input" data-vf-idx="${vi}" value="${escapeHTML(vf.label)}" placeholder="Field label (e.g. Oil Pressure)" style="flex:2; height:32px; font-size:13px" />
                            <select class="form-input vf-tmpl-type-select" data-vf-idx="${vi}" style="flex:0 0 110px; height:32px; font-size:12px">
                              <option value="text"${ft === 'text' ? ' selected' : ''}>Text</option>
                              <option value="number"${ft === 'number' ? ' selected' : ''}>Number</option>
                              <option value="dropdown"${ft === 'dropdown' ? ' selected' : ''}>Dropdown</option>
                            </select>
                            <button class="btn btn-ghost btn-sm btn-icon btn-remove-value-field-tmpl" data-vf-idx="${vi}" style="color:var(--color-danger); min-width:28px; min-height:28px; padding:0"><span class="material-icons-outlined" style="font-size:16px">close</span></button>
                          </div>
                          ${ft === 'number' ? `
                          <div style="display:flex; align-items:center; gap:8px; margin-left:28px">
                            <input type="text" class="form-input vf-tmpl-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (e.g. PSI)" style="flex:1; height:30px; font-size:12px" />
                            <div style="display:flex; align-items:center; gap:4px; flex:2">
                              <span style="font-size:11px; color:var(--text-tertiary); white-space:nowrap">Range:</span>
                              <input type="number" class="form-input vf-tmpl-min-input" data-vf-idx="${vi}" value="${vf.min !== undefined ? vf.min : ''}" placeholder="Min" style="flex:1; height:30px; font-size:12px" />
                              <span style="color:var(--text-tertiary)">–</span>
                              <input type="number" class="form-input vf-tmpl-max-input" data-vf-idx="${vi}" value="${vf.max !== undefined ? vf.max : ''}" placeholder="Max" style="flex:1; height:30px; font-size:12px" />
                            </div>
                          </div>
                          ` : ''}
                          ${ft === 'text' ? `
                          <div style="display:flex; align-items:center; gap:8px; margin-left:28px; margin-top:4px">
                            <input type="text" class="form-input vf-tmpl-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (optional, e.g. PSI)" style="flex:1; height:30px; font-size:12px" />
                          </div>
                          ` : ''}
                          ${ft === 'dropdown' ? `
                          <div style="margin-left:28px; display:flex; flex-direction:column; gap:6px">
                            <div>
                              <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px">Options (one per line)</div>
                              <textarea class="form-input vf-tmpl-options-input" data-vf-idx="${vi}" rows="3" placeholder="Low\nAs Expected\nHigh" style="font-size:12px; line-height:1.5">${escapeHTML((vf.options || []).join('\n'))}</textarea>
                            </div>
                            <div>
                              <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px">Expected / Ideal Value <span style="font-weight:400">(flags others as out of range)</span></div>
                              <select class="form-input vf-tmpl-expected-select" data-vf-idx="${vi}" style="height:30px; font-size:12px">
                                <option value=""${!vf.expectedValue ? ' selected' : ''}>— No expected value —</option>
                                ${(vf.options || []).map(opt => `<option value="${escapeHTML(opt)}"${vf.expectedValue === opt ? ' selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
                              </select>
                            </div>
                          </div>
                          ` : ''}
                        </div>`;
                      }).join('')}
                      ${(!node.valueFields || node.valueFields.length === 0) ? '<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:16px; border:1px dashed var(--border-color); border-radius:6px">No value fields defined. Click "Add Field" to create one.</div>' : ''}
                    </div>
                  </div>
                  ` : ''}
                `;
              })() : '<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `;

        // 1. Back button for drill-down view
        content.querySelector('.btn-view-back')?.addEventListener('click', () => {
          taskViewPath.pop();
          renderTemplateEditor();
        });

        // 2. Drill-down button
        content.querySelectorAll('.btn-drill-down-tmpl').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            taskViewPath = btn.dataset.path.split('-').map(Number);
            taskExpandedPath = [...taskViewPath];
            renderTemplateEditor();
          });
        });

        // 3. Selection of items
        content.querySelectorAll('.tmpl-task-list-item').forEach(item => {
          item.addEventListener('click', (e) => {
            if (e.target.closest('.btn-drill-down-tmpl')) return;
            taskExpandedPath = item.dataset.path.split('-').map(Number);
            isInfoPanelEditing = false;
            renderTemplateEditor();
          });
        });

        // 4. Add node at current drill-down level
        content.querySelector('.btn-add-node')?.addEventListener('click', () => {
          const newNode = {
            id: store.generateId(),
            name: 'New Task',
            status: 'Not Started',
            progress: 0,
            estimatedHours: 0,
            people: 1,
            subTasks: []
          };
          if (taskViewPath.length === 0) {
            localTasks.push(newNode);
            taskExpandedPath = [localTasks.length - 1];
          } else {
            const parent = getTaskByPath(localTasks, taskViewPath);
            if (!parent.subTasks) parent.subTasks = [];
            parent.subTasks.push(newNode);
            taskExpandedPath = [...taskViewPath, parent.subTasks.length - 1];
          }
          isInfoPanelEditing = true;
          renderTemplateEditor();
        });

        // 5. Add sub-task
        content.querySelector('.btn-add-child-tmpl')?.addEventListener('click', (e) => {
          const path = e.currentTarget.dataset.path.split('-').map(Number);
          const parent = getTaskByPath(localTasks, path);
          if (!parent.subTasks) parent.subTasks = [];
          parent.subTasks.push({
            id: store.generateId(),
            name: 'New Sub-task',
            status: 'Not Started',
            progress: 0,
            estimatedHours: 0,
            people: 1,
            subTasks: []
          });
          taskExpandedPath = [...path, parent.subTasks.length - 1];
          isInfoPanelEditing = true;
          renderTemplateEditor();
        });

        // 6. Edit Details button
        content.querySelector('.btn-edit-info-tmpl')?.addEventListener('click', () => {
          isInfoPanelEditing = true;
          renderTemplateEditor();
        });

        // 7. Done button
        content.querySelector('.btn-done-info-tmpl')?.addEventListener('click', () => {
          isInfoPanelEditing = false;
          renderTemplateEditor();
        });

        // 8. Live input changes in info panel
        content.querySelectorAll('.tmpl-detail-input').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (!node) return;
            const field = e.target.dataset.field;
            if (field === 'estimatedHours') {
              node[field] = parseFloat(e.target.value) || 0;
            } else if (field === 'people') {
              node[field] = parseInt(e.target.value) || 1;
            } else {
              node[field] = e.target.value;
            }
          });
        });

        // 9. Remove item
        content.querySelectorAll('.btn-remove-task-tmpl-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const path = btn.dataset.path.split('-').map(Number);
            if (confirm('Are you sure you want to delete this item and all its sub-tasks?')) {
              if (path.length === 1) {
                localTasks.splice(path[0], 1);
              } else {
                const parentPath = path.slice(0, -1);
                const parent = getTaskByPath(localTasks, parentPath);
                if (parent && parent.subTasks) {
                  parent.subTasks.splice(path[path.length - 1], 1);
                }
              }
              taskExpandedPath = path.slice(0, -1);
              isInfoPanelEditing = false;
              renderTemplateEditor();
            }
          });
        });

        // 10. Duplicate item
        content.querySelector('.btn-duplicate-task-tmpl')?.addEventListener('click', (e) => {
          const path = e.currentTarget.dataset.path.split('-').map(Number);
          const nodeToCopy = getTaskByPath(localTasks, path);
          if (!nodeToCopy) return;

          function cloneNode(node, isRootCopy) {
            return {
              ...node,
              id: store.generateId(),
              name: node.name + (isRootCopy ? ' (Copy)' : ''),
              status: 'Not Started',
              progress: 0,
              valueFields: node.valueFields ? node.valueFields.map(vf => ({ ...vf })) : undefined,
              subTasks: node.subTasks ? node.subTasks.map(c => cloneNode(c, false)) : []
            };
          }

          const cloned = cloneNode(nodeToCopy, true);
          if (path.length === 1) {
            localTasks.splice(path[0] + 1, 0, cloned);
            taskExpandedPath = [path[0] + 1];
          } else {
            const parentPath = path.slice(0, -1);
            const parent = getTaskByPath(localTasks, parentPath);
            parent.subTasks.splice(path[path.length - 1] + 1, 0, cloned);
            taskExpandedPath = [...parentPath, path[path.length - 1] + 1];
          }
          isInfoPanelEditing = false;
          renderTemplateEditor();
        });

        // 11. Value Fields interactive configuration listeners
        content.querySelector('.btn-add-value-field-tmpl')?.addEventListener('click', () => {
          const node = getTaskByPath(localTasks, taskExpandedPath);
          if (!node) return;
          if (!node.valueFields) node.valueFields = [];
          node.valueFields.push({ id: store.generateId(), label: '', unit: '', value: '', fieldType: 'text' });
          renderTemplateEditor();
        });

        content.querySelectorAll('.btn-remove-value-field-tmpl').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (!node || !node.valueFields) return;
            node.valueFields.splice(idx, 1);
            renderTemplateEditor();
          });
        });

        content.querySelectorAll('.vf-tmpl-label-input').forEach(inp => {
          inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].label = inp.value.trim();
            }
          });
        });

        content.querySelectorAll('.vf-tmpl-unit-input').forEach(inp => {
          inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].unit = inp.value.trim();
            }
          });
        });

        content.querySelectorAll('.vf-tmpl-type-select').forEach(sel => {
          sel.addEventListener('change', () => {
            const idx = parseInt(sel.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].fieldType = sel.value;
              if (sel.value !== 'number') { node.valueFields[idx].min = undefined; node.valueFields[idx].max = undefined; }
              if (sel.value !== 'dropdown') { node.valueFields[idx].options = undefined; }
              if (sel.value === 'dropdown') { node.valueFields[idx].unit = ''; }
              node.valueFields[idx].value = '';
            }
            renderTemplateEditor();
          });
        });

        content.querySelectorAll('.vf-tmpl-min-input').forEach(inp => {
          inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].min = inp.value !== '' ? parseFloat(inp.value) : undefined;
            }
          });
        });

        content.querySelectorAll('.vf-tmpl-max-input').forEach(inp => {
          inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].max = inp.value !== '' ? parseFloat(inp.value) : undefined;
            }
          });
        });

        content.querySelectorAll('.vf-tmpl-options-input').forEach(inp => {
          inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].options = inp.value.split('\n').map(o => o.trim()).filter(Boolean);
              renderTemplateEditor();
            }
          });
        });

        content.querySelectorAll('.vf-tmpl-expected-select').forEach(inp => {
          inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.vfIdx);
            const node = getTaskByPath(localTasks, taskExpandedPath);
            if (node && node.valueFields && node.valueFields[idx]) {
              node.valueFields[idx].expectedValue = inp.value || undefined;
            }
          });
        });
      };

      renderTemplateEditor();

      showModal({
        title: editId ? 'Edit Tasklist Template' : 'Create Tasklist Template',
        content,
        size: 'modal-xl',
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Save Template', className: 'btn-primary', onClick: (close) => {
            const name = content.querySelector('#edit-tmpl-name').value;
            const description = content.querySelector('#edit-tmpl-desc').value;
            const tags = content.querySelector('#edit-tmpl-tags').value.split(',').map(tag => tag.trim()).filter(Boolean);

            if (!name) { showToast('Name required', 'error'); return; }

            // Save BOTH tasks and phases for maximum compatibility
            const templateData = { name, description, tags, tasks: localTasks, phases: localTasks };
            if (editId) {
              store.update('taskTemplates', editId, templateData);
            } else {
              store.create('taskTemplates', templateData);
            }
            showToast('Tasklist template saved', 'success');
            close();
            renderContent();
          }}
        ]
      });
    }
  }

  function renderQuoteTemplatesSettings(tc) {
    const templates = store.getAll('quoteTemplates');
    tc.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0">Quote Templates</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-quote-template" data-tooltip="Create a new quote template to speed up quoting" data-tooltip-pos="left">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Create Template
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Description</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${templates.length ? templates.map(t => `
                <tr>
                  <td class="font-medium">${escapeHTML(t.name)}</td>
                  <td class="text-secondary">${escapeHTML(t.description || '—')}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-quote-template" data-id="${t.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-quote-template" data-id="${t.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="3" class="text-center text-tertiary" style="padding:32px">No quote templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    tc.querySelector('#btn-add-quote-template').addEventListener('click', () => {
      router.navigate('/settings/quote-templates/new');
    });

    tc.querySelectorAll('.btn-delete-quote-template').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this template?')) {
          store.delete('quoteTemplates', btn.dataset.id);
          renderContent();
        }
      });
    });

    tc.querySelectorAll('.btn-edit-quote-template').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/settings/quote-templates/${btn.dataset.id}/edit`);
      });
    });
  }

  function renderMaterialsSettings(tc) {
    const settings = store.getSettings();
    const markup = settings.materialMarkup || { defaultPercent: 30, minMarkupAmount: 0, useTiers: false, tiers: [] };
    const categories = settings.materialCategories || ['General'];

    tc.innerHTML = `
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${markup.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${markup.minMarkupAmount}" step="0.50" style="width:100px" />
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Ensures a base profit on even the smallest components.</p>
              </div>
            </div>

            <div style="margin-top:24px; padding-top:24px; border-top:1px solid var(--border-color)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <div>
                  <h5 style="margin:0">Tiered Pricing</h5>
                  <p class="text-secondary" style="font-size:12px;margin:4px 0 0 0">Automatically adjust markup based on the unit cost of the item.</p>
                </div>
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                  <input type="checkbox" id="mat-use-tiers" ${markup.useTiers ? 'checked' : ''} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${markup.useTiers ? '' : 'opacity:0.5;pointer-events:none'}">
                <table class="data-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="tier-rows">
                    ${(markup.tiers || []).map((t, i) => `
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${i === 0 ? 'Up to' : 'From previous up to'} 
                            <div style="display:flex;align-items:center;gap:4px">
                              <span class="text-tertiary">$</span>
                              <input type="number" class="form-input tier-upto" value="${t.upTo || ''}" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" class="form-input tier-percent" value="${t.percent}" style="height:28px;padding:2px 8px;width:80px" />
                            <span class="text-tertiary">%</span>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-icon btn-sm text-danger btn-remove-tier" data-idx="${i}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <button class="btn btn-secondary btn-sm" id="btn-add-tier" style="align-self:flex-start;margin-top:8px">
                  <span class="material-icons-outlined" style="font-size:16px">add</span> Add Pricing Tier
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h4 style="margin:0">Material Categories</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:13px;margin-bottom:16px">Group items for reporting and bulk adjustments.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="categories-container">
              ${categories.map(c => `
                <div class="badge badge-neutral" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${c}
                  <span class="material-icons-outlined btn-remove-cat" data-name="${c}" style="font-size:14px;cursor:pointer">close</span>
                </div>
              `).join('')}
              <button class="btn btn-outline btn-sm" id="btn-add-category" style="border-style:dashed">
                <span class="material-icons-outlined" style="font-size:16px">add</span> New Category
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;justify-content:flex-end">
          <button class="btn btn-primary" id="btn-save-materials" data-tooltip="Save material markup rules and categories" data-tooltip-pos="top">Save Material Settings</button>
        </div>
      </div>
    `;

    // --- Handlers ---
    const save = async () => {
      const btn = tc.querySelector('#btn-save-materials');
      const origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

      try {
        const defaultPercent = parseFloat(tc.querySelector('#mat-default-markup').value);
        const minMarkupAmount = parseFloat(tc.querySelector('#mat-min-markup').value);
        const useTiers = tc.querySelector('#mat-use-tiers').checked;
        
        const tiers = Array.from(tc.querySelectorAll('#tier-rows tr')).map(tr => ({
          upTo: parseFloat(tr.querySelector('.tier-upto').value) || null,
          percent: parseFloat(tr.querySelector('.tier-percent').value) || 0
        })).sort((a, b) => (a.upTo === null ? 1 : (b.upTo === null ? -1 : a.upTo - b.upTo)));

        const categories = Array.from(tc.querySelectorAll('.btn-remove-cat')).map(span => span.dataset.name);

        const updatedSettings = {
          ...settings,
          materialMarkup: { defaultPercent, minMarkupAmount, useTiers, tiers },
          materialCategories: categories
        };
        
        await store.saveSettings(updatedSettings);
        showToast('Material settings saved successfully', 'success');
      } catch (err) {
        console.error('Error saving material settings:', err);
        showToast('Failed to save settings: ' + (err.message || err), 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    };

    tc.querySelector('#mat-use-tiers').addEventListener('change', (e) => {
      tc.querySelector('#tiers-container').style.opacity = e.target.checked ? '1' : '0.5';
      tc.querySelector('#tiers-container').style.pointerEvents = e.target.checked ? 'auto' : 'none';
    });

    tc.querySelector('#btn-add-tier').addEventListener('click', () => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            From previous up to 
            <div style="display:flex;align-items:center;gap:4px">
              <span class="text-tertiary">$</span>
              <input type="number" class="form-input tier-upto" value="" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:4px">
            <input type="number" class="form-input tier-percent" value="20" style="height:28px;padding:2px 8px;width:80px" />
            <span class="text-tertiary">%</span>
          </div>
        </td>
        <td>
          <button class="btn btn-icon btn-sm text-danger btn-remove-tier"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
        </td>
      `;
      tc.querySelector('#tier-rows').appendChild(row);
      row.querySelector('.btn-remove-tier').addEventListener('click', () => row.remove());
    });

    tc.querySelectorAll('.btn-remove-tier').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('tr').remove());
    });

    tc.querySelector('#btn-add-category').addEventListener('click', () => {
      const name = prompt('Enter category name:');
      if (name) {
        const btn = document.createElement('div');
        btn.className = 'badge badge-neutral';
        btn.style.cssText = 'padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px';
        btn.innerHTML = `
          ${name}
          <span class="material-icons-outlined btn-remove-cat" data-name="${name}" style="font-size:14px;cursor:pointer">close</span>
        `;
        tc.querySelector('#categories-container').insertBefore(btn, tc.querySelector('#btn-add-category'));
        btn.querySelector('.btn-remove-cat').addEventListener('click', () => btn.remove());
      }
    });

    tc.querySelectorAll('.btn-remove-cat').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.badge').remove());
    });

    tc.querySelector('#btn-save-materials').addEventListener('click', save);
  }

  function renderTemplatesFormsTab(tc) {
    tc.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-md)">
        <div class="card-body" style="padding: 8px; background:var(--bg-color); border-radius: 8px; display:flex; gap:8px">
          <button class="btn btn-sm" id="subtab-tasklists" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${templatesSubTab === 'tasklists' ? 'var(--color-primary)' : 'transparent'}; color:${templatesSubTab === 'tasklists' ? 'white' : 'var(--text-color)'}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">playlist_add_check</span> Tasklist Templates
          </button>
          <button class="btn btn-sm" id="subtab-forms" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${templatesSubTab === 'forms' ? 'var(--color-primary)' : 'transparent'}; color:${templatesSubTab === 'forms' ? 'white' : 'var(--text-color)'}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">assignment</span> Form Templates
          </button>
          <button class="btn btn-sm" id="subtab-quotes" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${templatesSubTab === 'quotes' ? 'var(--color-primary)' : 'transparent'}; color:${templatesSubTab === 'quotes' ? 'white' : 'var(--text-color)'}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">article</span> Quote Templates
          </button>
        </div>
      </div>
      <div id="templates-subcontent" style="margin-top:var(--space-md)"></div>
    `;

    const btnTasklists = tc.querySelector('#subtab-tasklists');
    const btnForms = tc.querySelector('#subtab-forms');
    const btnQuotes = tc.querySelector('#subtab-quotes');

    // Style elements for visual elegance
    if (templatesSubTab === 'tasklists') btnTasklists.style.color = 'white';
    if (templatesSubTab === 'forms') btnForms.style.color = 'white';
    if (templatesSubTab === 'quotes') btnQuotes.style.color = 'white';

    const subcontent = tc.querySelector('#templates-subcontent');

    if (templatesSubTab === 'tasklists') {
      renderTasksSettings(subcontent);
    } else if (templatesSubTab === 'forms') {
      renderFormsTab(subcontent);
    } else if (templatesSubTab === 'quotes') {
      renderQuoteTemplatesSettings(subcontent);
    }

    btnTasklists.addEventListener('click', () => {
      templatesSubTab = 'tasklists';
      renderTemplatesFormsTab(tc);
    });
    btnForms.addEventListener('click', () => {
      templatesSubTab = 'forms';
      renderTemplatesFormsTab(tc);
    });
    btnQuotes.addEventListener('click', () => {
      templatesSubTab = 'quotes';
      renderTemplatesFormsTab(tc);
    });
  }

  render();
}
  function renderFormsTab(tc) {
    const templates = store.getAll('formTemplates');

    tc.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
          <h4 style="margin:0">Custom Form Templates</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-form-template" data-tooltip="Create a new form template for safety checks and inspections" data-tooltip-pos="left">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Create New Form
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <div style="padding:16px; font-size:13px; color:var(--text-tertiary); border-bottom:1px solid var(--border-color)">
            Create reusable forms that can be attached to jobs for technicians to fill out in the field (e.g. Safety Audits, Site Inspections).
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Description</th>
                <th>Fields</th>
                <th style="width:100px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${templates.map(t => `
                <tr>
                  <td class="font-medium">${escapeHTML(t.name)}</td>
                  <td style="color:var(--text-secondary); font-size:13px">${escapeHTML(t.description || '—')}</td>
                  <td><span class="badge badge-neutral">${(t.sections || []).reduce((sum, s) => sum + s.fields.length, 0)} Fields</span></td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-icon btn-sm edit-form-template" data-id="${t.id}"><span class="material-icons-outlined">edit</span></button>
                    <button class="btn btn-ghost btn-icon btn-sm delete-form-template" data-id="${t.id}" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span></button>
                  </td>
                </tr>
              `).join('')}
              ${!templates.length ? '<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-tertiary)">No form templates created yet.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    tc.querySelector('#btn-add-form-template').addEventListener('click', () => router.navigate('/settings/forms/new'));
    
    tc.querySelectorAll('.edit-form-template').forEach(btn => {
      btn.addEventListener('click', () => router.navigate(`/settings/forms/${btn.dataset.id}/edit`));
    });

    tc.querySelectorAll('.delete-form-template').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.')) {
          const id = btn.dataset.id;
          const filtered = store.getAll('formTemplates').filter(t => t.id !== id);
          store.save('formTemplates', filtered);
          renderFormsTab(tc);
        }
      });
    });
  }

  function renderPaymentsTab(tc) {
    const settings = store.getSettings() || {};
    const pay = settings.payments || {};
    const isCloud = !!(store.companyId && !String(store.companyId).startsWith('acct_'));

    if (!isCloud) {
      tc.innerHTML = `
        <div class="card" style="max-width:760px">
          <div class="card-header"><h4>Online Payments (Stripe)</h4></div>
          <div class="card-body">
            <p style="color:var(--text-secondary);">Online card payments are a cloud feature. Upgrade to a cloud account to let customers pay invoices online by card.</p>
          </div>
        </div>`;
      return;
    }

    const enabledFor = pay.enabledFor || {};
    const currencies = ['AUD', 'USD', 'NZD', 'GBP', 'EUR'];
    const cur = (pay.currency || 'AUD').toUpperCase();

    tc.innerHTML = `
      <div class="card" style="max-width:820px">
        <div class="card-header"><h4>Online Payments (Stripe)</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);margin-top:0;">
            Let customers pay invoices by card via a secure Stripe checkout link. Generate a link from any sent invoice; it's marked Paid automatically once payment clears.
          </p>

          <div style="background:var(--content-bg);border:1px solid var(--border-color);border-radius:8px;padding:14px 16px;margin:14px 0;">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px;">One-time setup</div>
            <ol style="margin:0;padding-left:18px;font-size:12px;color:var(--text-secondary);line-height:1.7;">
              <li>Create a <strong>Stripe</strong> account and copy your <strong>Secret key</strong>.</li>
              <li>In Supabase → Edge Functions → Secrets, add <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code>.</li>
              <li>Deploy the <code>relay-create-payment</code> and <code>relay-stripe-webhook</code> functions.</li>
              <li>In Stripe → Developers → Webhooks, add an endpoint pointing at <code>relay-stripe-webhook</code> and subscribe it to <code>checkout.session.completed</code>.</li>
            </ol>
          </div>

          <div class="form-group" style="display:flex;align-items:center;gap:10px;">
            <label class="switch" style="margin:0;">
              <input type="checkbox" id="pay-connected" ${pay.connected ? 'checked' : ''} />
            </label>
            <div>
              <div style="font-weight:600;font-size:13px;">Payments configured &amp; live</div>
              <div style="font-size:11px;color:var(--text-tertiary);">Tick once the setup above is done. Controls whether the Pay Link button appears on invoices.</div>
            </div>
          </div>

          <div class="form-group" style="max-width:220px;">
            <label class="form-label">Currency</label>
            <select class="form-input" id="pay-currency">
              ${currencies.map(c => `<option value="${c}" ${c === cur ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="pay-enable-invoice" style="width:16px;height:16px;" ${enabledFor.invoice !== false ? 'checked' : ''} />
            <label for="pay-enable-invoice" style="margin:0;font-size:13px;">Show a "Pay Link" action on sent invoices</label>
          </div>

          <div style="margin-top:16px;">
            <button class="btn btn-primary" id="pay-save"><span class="material-icons-outlined">save</span> Save Payment Settings</button>
          </div>
        </div>
      </div>`;

    tc.querySelector('#pay-save')?.addEventListener('click', async () => {
      try {
        const s = store.getSettings() || {};
        s.payments = {
          ...(s.payments || {}),
          connected: tc.querySelector('#pay-connected').checked,
          currency: tc.querySelector('#pay-currency').value,
          enabledFor: {
            ...((s.payments || {}).enabledFor || {}),
            invoice: tc.querySelector('#pay-enable-invoice').checked,
          },
        };
        await store.saveSettings(s);
        showToast('Payment settings saved', 'success');
        window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
      } catch (err) {
        console.error('Error saving payment settings:', err);
        showToast('Could not save payment settings', 'error');
      }
    });
  }

  function renderInvoicesQuotesTab(tc) {
    const isLocalMode = !store.companyId || store.companyId.startsWith('acct_');
    const settings = store.getSettings();
    let dt = JSON.parse(JSON.stringify(settings.documentTheme || {}));
    let activePreviewTab = 'invoice';

    const mockData = {
      number: 'INV-00023',
      status: 'Sent',
      customerName: 'Acme Developments Pty Ltd',
      contactName: 'Jane Smith',
      issueDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      jobNumber: 'J-00129',
      originalQuoteNumber: 'Q-00412',
      title: 'Emergency Electrical & Cabling Installation',
      notes: 'Please review all measurements. Standard technician notes and variations have been compiled accordingly.',
      subtotal: 1250.00,
      tax: 125.00,
      total: 1375.00,
      lineItems: [
        { description: 'Emergency Call-out Service Rate', type: 'labor', qty: 1, rate: 195.00, total: 195.00 },
        { description: 'Electrical Cabling Installation & Termination', type: 'labor', qty: 4, rate: 85.00, total: 340.00 },
        { description: 'Premium Circuit Breakers & Switchboards', type: 'material', qty: 3, rate: 150.00, total: 450.00 },
        { description: 'Sundry Fixings, Consumables & Conduit', type: 'material', qty: 1, rate: 265.00, total: 265.00 }
      ]
    };

    const presets = {
      relay: { name: 'Relay Dispatch', preset: 'relay', accentColor: '#1B6DE0', headerBg: '#1E2A3A', accentTint: '#F8FAFC', fontFamily: 'sans-serif' },
      classic: { name: 'Classic Corporate', preset: 'classic', accentColor: '#0F172A', headerBg: '#1E293B', accentTint: '#F8FAFC', fontFamily: 'serif' },
      forest: { name: 'Forest Minimalist', preset: 'forest', accentColor: '#16A34A', headerBg: '#1F2937', accentTint: '#F9FAFB', fontFamily: 'sans-serif' },
      electric: { name: 'Vibrant Electric', preset: 'electric', accentColor: '#7C3AED', headerBg: '#111827', accentTint: '#F9FAFB', fontFamily: 'sans-serif' },
      obsidian: { name: 'Sleek Obsidian', preset: 'obsidian', accentColor: '#1E293B', headerBg: '#0F172A', accentTint: '#FAFBFB', fontFamily: 'monospace' },
      terracotta: { name: 'Sunset Terracotta', preset: 'terracotta', accentColor: '#C2410C', headerBg: '#451A03', accentTint: '#FFF7ED', fontFamily: 'sans-serif' },
      nordic: { name: 'Nordic Frost', preset: 'nordic', accentColor: '#0891B2', headerBg: '#0F172A', accentTint: '#F0FDFA', fontFamily: 'sans-serif' },
      luxury: { name: 'Royal Velvet', preset: 'luxury', accentColor: '#D97706', headerBg: '#311005', accentTint: '#FEF3C7', fontFamily: 'serif' },
      steel: { name: 'Steel Industrial', preset: 'steel', accentColor: '#475569', headerBg: '#1E293B', accentTint: '#F1F5F9', fontFamily: 'monospace' },
      ballet: { name: 'Ballet Pointe', preset: 'ballet', accentColor: '#e58799', headerBg: '#5c2c36', accentTint: '#fff5f6', fontFamily: 'serif' }
    };

    function renderMarkup() {
      tc.innerHTML = `
        <style>
          .preset-card:hover {
            border-color: var(--color-primary-light) !important;
            background: var(--bg-color) !important;
          }
          .preset-card.active {
            border-color: var(--color-primary) !important;
            background: var(--color-primary-light) !important;
            color: var(--color-primary) !important;
          }
        </style>
        <div style="display:grid; grid-template-columns: 460px 1fr; gap:var(--space-lg); min-height:calc(100vh - 200px); align-items:stretch">
          
          <!-- Control Panel -->
          <div style="display:flex; flex-direction:column; gap:16px; overflow-y:auto; padding-right:8px; max-height:calc(100vh - 200px)">
            
            <!-- Preset Themes -->
            <div class="card">
              <div class="card-header"><h4>Choose Theme Preset</h4></div>
              <div class="card-body" style="padding:16px; display:flex; flex-direction:column; gap:8px">
                ${Object.entries(presets).map(([key, val]) => {
                  const isActive = dt.preset === key;
                  return `
                    <div class="preset-card ${isActive ? 'active' : ''}" data-preset="${key}" style="
                      display:flex; justify-content:space-between; align-items:center; 
                      padding:12px 16px; border:2px solid ${isActive ? 'var(--color-primary)' : 'var(--border-color)'}; 
                      border-radius:8px; cursor:pointer; background:var(--card-bg); transition:all 0.2s;
                    ">
                      <div style="display:flex; align-items:center; gap:10px">
                        <div style="width:16px; height:16px; border-radius:50%; background:${val.accentColor}"></div>
                        <span style="font-weight:600">${val.name}</span>
                      </div>
                      <span style="font-size:12px; color:var(--text-tertiary)">${val.fontFamily}</span>
                    </div>
                  `;
                }).join('')}
                <div class="preset-card ${dt.preset === 'custom' ? 'active' : ''}" data-preset="custom" style="
                  display:flex; justify-content:space-between; align-items:center; 
                  padding:12px 16px; border:2px solid ${dt.preset === 'custom' ? 'var(--color-primary)' : 'var(--border-color)'}; 
                  border-radius:8px; cursor:pointer; background:var(--card-bg); transition:all 0.2s;
                ">
                  <div style="display:flex; align-items:center; gap:10px">
                    <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">palette</span>
                    <span style="font-weight:600">Custom Styling</span>
                  </div>
                  <span style="font-size:12px; color:var(--text-tertiary)">Full control</span>
                </div>
              </div>
            </div>

            <!-- Custom Styles (only active/visible if preset is Custom) -->
            <div class="card" id="custom-style-controls" style="display:${dt.preset === 'custom' ? 'block' : 'none'}">
              <div class="card-header"><h4>Custom Color & Typography</h4></div>
              <div class="card-body" style="padding:16px; display:flex; flex-direction:column; gap:12px">
                <div class="form-group">
                  <label class="form-label">Primary Accent Color</label>
                  <div style="display:flex; gap:8px">
                    <input type="color" class="form-input style-input" data-prop="accentColor" value="${dt.accentColor}" style="width:48px; height:38px; padding:2px; cursor:pointer" />
                    <input type="text" class="form-input style-text" id="color-accent-text" value="${dt.accentColor}" style="flex:1" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Table Header Fill</label>
                  <div style="display:flex; gap:8px">
                    <input type="color" class="form-input style-input" data-prop="headerBg" value="${dt.headerBg}" style="width:48px; height:38px; padding:2px; cursor:pointer" />
                    <input type="text" class="form-input style-text" id="color-header-text" value="${dt.headerBg}" style="flex:1" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Accent Tint Background</label>
                  <div style="display:flex; gap:8px">
                    <input type="color" class="form-input style-input" data-prop="accentTint" value="${dt.accentTint}" style="width:48px; height:38px; padding:2px; cursor:pointer" />
                    <input type="text" class="form-input style-text" id="color-tint-text" value="${dt.accentTint}" style="flex:1" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Typography Font</label>
                  <select class="form-select style-input" data-prop="fontFamily">
                    <option value="sans-serif" ${dt.fontFamily === 'sans-serif' ? 'selected' : ''}>Sans-Serif (Modern / Inter & Outfit)</option>
                    <option value="serif" ${dt.fontFamily === 'serif' ? 'selected' : ''}>Serif (Prestige / Georgia & Lora)</option>
                    <option value="monospace" ${dt.fontFamily === 'monospace' ? 'selected' : ''}>Monospace (Industrial / Fira Code)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Branding / Logo layout -->
            <div class="card">
              <div class="card-header"><h4>Logo Branding & Scaling</h4></div>
              <div class="card-body" style="padding:16px; display:flex; flex-direction:column; gap:12px">
                <div class="form-group" style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" id="theme-hide-logo" style="width:16px; height:16px" ${dt.hideLogo ? 'checked' : ''} />
                  <label for="theme-hide-logo" class="form-label" style="margin:0; cursor:pointer">Hide logo image (show styled text header)</label>
                </div>
                <div id="logo-branding-controls" style="display:${dt.hideLogo ? 'none' : 'flex'}; flex-direction:column; gap:12px">
                  <div class="form-group" style="display:flex; align-items:center; gap:8px">
                    <input type="checkbox" id="theme-hide-company-name" style="width:16px; height:16px" ${dt.hideCompanyName ? 'checked' : ''} />
                    <label for="theme-hide-company-name" class="form-label" style="margin:0; cursor:pointer">Hide company name text (use logo only)</label>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Logo Variation</label>
                    <select class="form-select" id="theme-logo-source" style="width:100%">
                      <option value="large" ${dt.logoSource === 'large' ? 'selected' : ''}>Standard Logo (Large)</option>
                      <option value="small" ${dt.logoSource === 'small' ? 'selected' : ''}>Small / Shrunk Logo (Small)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Logo Alignment</label>
                    <div style="display:flex; gap:4px">
                      <button class="btn btn-secondary btn-sm logo-align-btn ${dt.logoAlignment === 'left' ? 'btn-primary' : ''}" data-align="left" style="flex:1">Left</button>
                      <button class="btn btn-secondary btn-sm logo-align-btn ${dt.logoAlignment === 'center' ? 'btn-primary' : ''}" data-align="center" style="flex:1">Center</button>
                      <button class="btn btn-secondary btn-sm logo-align-btn ${dt.logoAlignment === 'right' ? 'btn-primary' : ''}" data-align="right" style="flex:1">Right</button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Logo Scale (Height): <span id="scale-val-label">${dt.logoScale || 60}px</span></label>
                    <input type="range" id="theme-logo-scale" min="40" max="120" value="${dt.logoScale || 60}" style="width:100%" />
                  </div>
                </div>
                <div style="height:1px; background:var(--border-color); margin:8px 0"></div>
                <div class="form-group ${isLocalMode ? 'disabled-local' : ''}" ${isLocalMode ? 'data-tooltip="Requires Cloud Account" data-tooltip-pos="top"' : ''} style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" id="theme-hide-brand-logo" style="width:16px; height:16px" ${dt.hideBrandLogo ? 'checked' : ''} ${isLocalMode ? 'disabled' : ''} />
                  <label for="theme-hide-brand-logo" class="form-label" style="margin:0; cursor:${isLocalMode ? 'not-allowed' : 'pointer'}">Remove Relay-dispatch brand logo from document footers</label>
                </div>
              </div>
            </div>

            <!-- Document Text Custom Copy -->
            <div class="card">
              <div class="card-header"><h4>Custom Copy & Titles</h4></div>
              <div class="card-body" style="padding:16px; display:flex; flex-direction:column; gap:12px">
                <div style="font-weight:700; font-size:12px; color:var(--color-primary); text-transform:uppercase; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-top:4px">Invoice Options</div>
                <div class="form-group">
                  <label class="form-label">Invoice Document Title</label>
                  <input type="text" class="form-input text-copy-input" data-prop="invoiceTitle" value="${escapeHTML(dt.invoiceTitle || 'TAX INVOICE')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Direct Deposit Bank Account Details</label>
                  <textarea class="form-input text-copy-input" data-prop="invoicePaymentTerms" rows="3" placeholder="BSB: ...\nAccount: ...">${escapeHTML(dt.invoicePaymentTerms || '')}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Invoice Legal Terms / Footer Memo</label>
                  <textarea class="form-input text-copy-input" data-prop="invoiceTerms" rows="2" placeholder="Payment is due...">${escapeHTML(dt.invoiceTerms || '')}</textarea>
                </div>
                <div class="form-row" style="display:flex; gap:12px">
                  <div class="form-group" style="flex:1">
                    <label class="form-label">Invoice Prefix</label>
                    <input type="text" class="form-input text-copy-input" data-prop="invoicePrefix" value="${escapeHTML(dt.invoicePrefix || 'INV-')}" placeholder="INV-" />
                  </div>
                  <div class="form-group" style="flex:1">
                    <label class="form-label">Invoice Starting Number</label>
                    <input type="number" class="form-input text-copy-input" data-prop="invoiceStartingNumber" value="${dt.invoiceStartingNumber !== undefined ? dt.invoiceStartingNumber : 1}" min="1" placeholder="1" />
                  </div>
                </div>

                <div style="font-weight:700; font-size:12px; color:var(--color-primary); text-transform:uppercase; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-top:8px">Quote Options</div>
                <div class="form-group">
                  <label class="form-label">Quote Document Title</label>
                  <input type="text" class="form-input text-copy-input" data-prop="quoteTitle" value="${escapeHTML(dt.quoteTitle || 'PROPOSAL / QUOTE')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Quote Validity / General Terms</label>
                  <textarea class="form-input text-copy-input" data-prop="quoteTerms" rows="2" placeholder="Quote valid for...">${escapeHTML(dt.quoteTerms || '')}</textarea>
                </div>
                <div class="form-row" style="display:flex; gap:12px">
                  <div class="form-group" style="flex:1">
                    <label class="form-label">Quote Prefix</label>
                    <input type="text" class="form-input text-copy-input" data-prop="quotePrefix" value="${escapeHTML(dt.quotePrefix || 'Q-')}" placeholder="Q-" />
                  </div>
                  <div class="form-group" style="flex:1">
                    <label class="form-label">Quote Starting Number</label>
                    <input type="number" class="form-input text-copy-input" data-prop="quoteStartingNumber" value="${dt.quoteStartingNumber !== undefined ? dt.quoteStartingNumber : 1}" min="1" placeholder="1" />
                  </div>
                </div>

                <div style="font-weight:700; font-size:12px; color:var(--color-primary); text-transform:uppercase; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-top:8px">Global Options</div>
                <div class="form-group">
                  <label class="form-label">Footer Signature / Compliance Note</label>
                  <input type="text" class="form-input text-copy-input" data-prop="footerNote" value="${escapeHTML(dt.footerNote || '')}" placeholder="Thank you for your business..." />
                </div>
              </div>
            </div>

            <!-- Features & Integration Toggles -->
            <div class="card">
              <div class="card-header"><h4>Features & Integrations</h4></div>
              <div class="card-body" style="padding:16px; display:flex; flex-direction:column; gap:10px">
                <div class="form-group" style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" id="theme-stripe" style="width:16px; height:16px" ${dt.paymentStripe ? 'checked' : ''} />
                  <label for="theme-stripe" class="form-label" style="margin:0; cursor:pointer">Accept Credit Cards (Include online Stripe pay link)</label>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" id="theme-bank-transfer" style="width:16px; height:16px" ${dt.paymentDirectTransfer ? 'checked' : ''} />
                  <label for="theme-bank-transfer" class="form-label" style="margin:0; cursor:pointer">Show Bank Details (Direct Bank Transfers)</label>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" id="theme-cash" style="width:16px; height:16px" ${dt.paymentCash ? 'checked' : ''} />
                  <label for="theme-cash" class="form-label" style="margin:0; cursor:pointer">Accept Cash payment option text</label>
                </div>
                <div style="height:1px; background:var(--border-color); margin:4px 0"></div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" id="theme-quote-sig" style="width:16px; height:16px" ${dt.quoteSignature ? 'checked' : ''} />
                  <label for="theme-quote-sig" class="form-label" style="margin:0; cursor:pointer">Include customer sign-off signature blocks on Quotes</label>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex; gap:12px; margin-top:4px; padding-bottom:24px">
              <button class="btn btn-secondary" id="btn-theme-reset" style="flex:1">Reset Defaults</button>
              <button class="btn btn-primary" id="btn-theme-save" style="flex:1"><span class="material-icons-outlined" style="font-size:16px">save</span> Save Changes</button>
            </div>

          </div>

          <!-- Sticky Live Preview -->
          <div style="display:flex; flex-direction:column; gap:12px; height:calc(100vh - 200px); position:sticky; top:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:13px; font-weight:700; color:var(--text-secondary); text-transform:uppercase">Live Layout Preview</span>
              <div class="tabs" style="margin:0; background:var(--border-color); padding:2px; border-radius:6px; display:inline-flex; gap:2px">
                <button class="btn btn-sm ${activePreviewTab === 'invoice' ? 'btn-primary' : 'btn-ghost'}" id="preview-tab-invoice" style="padding:6px 12px; border:none; border-radius:4px; font-size:12px; cursor:pointer">Tax Invoice</button>
                <button class="btn btn-sm ${activePreviewTab === 'quote' ? 'btn-primary' : 'btn-ghost'}" id="preview-tab-quote" style="padding:6px 12px; border:none; border-radius:4px; font-size:12px; cursor:pointer">Quote / Proposal</button>
              </div>
            </div>
            <div style="flex:1; border:1px solid var(--border-color); border-radius:8px; overflow:hidden; background:#f1f5f9; position:relative; box-shadow:inset 0 4px 10px rgba(0,0,0,0.05)">
              <iframe id="preview-frame" style="width:100%; height:100%; border:none;"></iframe>
            </div>
          </div>

        </div>
      `;

      bindListeners();
      updatePreview();
    }

    function bindListeners() {
      // Preset selection click
      tc.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
          const key = card.dataset.preset;
          if (key === 'custom') {
            dt.preset = 'custom';
          } else {
            const p = presets[key];
            dt.preset = key;
            dt.accentColor = p.accentColor;
            dt.headerBg = p.headerBg;
            dt.accentTint = p.accentTint;
            dt.fontFamily = p.fontFamily;
          }
          syncControlsFromState();
          updatePreview();
        });
      });

      // Custom style hex text / inputs
      tc.querySelectorAll('.style-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const prop = e.target.dataset.prop;
          dt[prop] = e.target.value;
          
          if (prop === 'accentColor') tc.querySelector('#color-accent-text').value = e.target.value;
          if (prop === 'headerBg') tc.querySelector('#color-header-text').value = e.target.value;
          if (prop === 'accentTint') tc.querySelector('#color-tint-text').value = e.target.value;
          
          updatePreview();
        });
      });

      tc.querySelectorAll('.style-text').forEach(txt => {
        txt.addEventListener('input', (e) => {
          const val = e.target.value;
          if (/^#[0-9A-F]{6}$/i.test(val)) {
            if (e.target.id === 'color-accent-text') {
              dt.accentColor = val;
              tc.querySelector('[data-prop="accentColor"]').value = val;
            } else if (e.target.id === 'color-header-text') {
              dt.headerBg = val;
              tc.querySelector('[data-prop="headerBg"]').value = val;
            } else if (e.target.id === 'color-tint-text') {
              dt.accentTint = val;
              tc.querySelector('[data-prop="accentTint"]').value = val;
            }
            updatePreview();
          }
        });
      });

      // Logo Align
      tc.querySelectorAll('.logo-align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          dt.logoAlignment = btn.dataset.align;
          tc.querySelectorAll('.logo-align-btn').forEach(b => b.classList.remove('btn-primary'));
          btn.classList.add('btn-primary');
          updatePreview();
        });
      });

      // Hide Logo toggle
      const hideLogoChk = tc.querySelector('#theme-hide-logo');
      hideLogoChk.addEventListener('change', () => {
        dt.hideLogo = hideLogoChk.checked;
        tc.querySelector('#logo-branding-controls').style.display = dt.hideLogo ? 'none' : 'flex';
        updatePreview();
      });

      // Hide Company Name toggle
      const hideCompanyNameChk = tc.querySelector('#theme-hide-company-name');
      if (hideCompanyNameChk) {
        hideCompanyNameChk.addEventListener('change', () => {
          dt.hideCompanyName = hideCompanyNameChk.checked;
          updatePreview();
        });
      }

      // Logo Variation toggle
      const logoSourceSelect = tc.querySelector('#theme-logo-source');
      if (logoSourceSelect) {
        logoSourceSelect.addEventListener('change', (e) => {
          dt.logoSource = e.target.value;
          updatePreview();
        });
      }

      // Scale slider
      const scaleSlider = tc.querySelector('#theme-logo-scale');
      scaleSlider.addEventListener('input', () => {
        dt.logoScale = parseInt(scaleSlider.value);
        tc.querySelector('#scale-val-label').textContent = dt.logoScale + 'px';
        updatePreview();
      });

      // Hide Brand Logo toggle
      const hideBrandLogoChk = tc.querySelector('#theme-hide-brand-logo');
      if (hideBrandLogoChk) {
        hideBrandLogoChk.addEventListener('change', () => {
          dt.hideBrandLogo = hideBrandLogoChk.checked;
          updatePreview();
        });
      }

      // Text copy updates
      tc.querySelectorAll('.text-copy-input').forEach(inp => {
        inp.addEventListener('input', () => {
          const prop = inp.dataset.prop;
          dt[prop] = inp.value;
          updatePreview();
        });
      });

      // Features integration switches
      tc.querySelector('#theme-stripe').addEventListener('change', (e) => {
        dt.paymentStripe = e.target.checked;
        updatePreview();
      });
      tc.querySelector('#theme-bank-transfer').addEventListener('change', (e) => {
        dt.paymentDirectTransfer = e.target.checked;
        updatePreview();
      });
      tc.querySelector('#theme-cash').addEventListener('change', (e) => {
        dt.paymentCash = e.target.checked;
        updatePreview();
      });
      tc.querySelector('#theme-quote-sig').addEventListener('change', (e) => {
        dt.quoteSignature = e.target.checked;
        updatePreview();
      });

      // Invoice / Quote Preview tabs
      tc.querySelector('#preview-tab-invoice').addEventListener('click', () => {
        activePreviewTab = 'invoice';
        tc.querySelector('#preview-tab-invoice').classList.add('btn-primary');
        tc.querySelector('#preview-tab-invoice').classList.remove('btn-ghost');
        tc.querySelector('#preview-tab-quote').classList.add('btn-ghost');
        tc.querySelector('#preview-tab-quote').classList.remove('btn-primary');
        updatePreview(true); // Switch tab = full reload to replace layout
      });
      tc.querySelector('#preview-tab-quote').addEventListener('click', () => {
        activePreviewTab = 'quote';
        tc.querySelector('#preview-tab-quote').classList.add('btn-primary');
        tc.querySelector('#preview-tab-quote').classList.remove('btn-ghost');
        tc.querySelector('#preview-tab-invoice').classList.add('btn-ghost');
        tc.querySelector('#preview-tab-invoice').classList.remove('btn-primary');
        updatePreview(true); // Switch tab = full reload to replace layout
      });

      // Save Theme Settings
      tc.querySelector('#btn-theme-save').addEventListener('click', async () => {
        const btn = tc.querySelector('#btn-theme-save');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

        try {
          const freshSettings = store.getSettings();
          freshSettings.documentTheme = { ...dt };
          await store.saveSettings(freshSettings);
          showToast('Document customization settings saved successfully', 'success');
        } catch (err) {
          console.error('Error saving theme settings:', err);
          showToast('Failed to save settings: ' + (err.message || err), 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      });

      // Reset Theme Settings
      tc.querySelector('#btn-theme-reset').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset documents customization to the factory defaults?')) {
          dt = {
            preset: 'relay',
            accentColor: '#1B6DE0',
            headerBg: '#1E2A3A',
            accentTint: '#F8FAFC',
            fontFamily: 'sans-serif',
            invoiceTitle: 'TAX INVOICE',
            invoiceTerms: 'Please pay within 7 days of invoice issue.',
            invoicePaymentTerms: 'Payment via Direct Deposit:\nBSB: 123-456\nAccount: 78901234\nReference: [Invoice Number]',
            quoteTitle: 'PROPOSAL / QUOTE',
            quoteTerms: 'This quote is valid for 30 days. All work is subject to standard conditions.',
            logoAlignment: 'left',
            logoScale: 60,
            hideLogo: false,
            logoSource: 'large',
            hideCompanyName: false,
            hideBrandLogo: false,
            paymentStripe: true,
            paymentDirectTransfer: true,
            paymentCash: false,
            quoteSignature: true,
            footerNote: 'Thank you for your business!',
            invoicePrefix: 'INV-',
            invoiceStartingNumber: 1,
            quotePrefix: 'Q-',
            quoteStartingNumber: 1
          };
          syncControlsFromState();
          updatePreview();
        }
      });
    }

    function syncControlsFromState() {
      // 1. Preset cards active states
      tc.querySelectorAll('.preset-card').forEach(card => {
        const key = card.dataset.preset;
        const isActive = dt.preset === key;
        if (isActive) {
          card.classList.add('active');
          card.style.borderColor = 'var(--color-primary)';
          card.style.background = 'var(--color-primary-light)';
          card.style.color = 'var(--color-primary)';
        } else {
          card.classList.remove('active');
          card.style.borderColor = 'var(--border-color)';
          card.style.background = 'var(--card-bg)';
          card.style.color = 'inherit';
        }
      });

      // 2. Custom style panel visibility
      const customStylePanel = tc.querySelector('#custom-style-controls');
      if (customStylePanel) {
        customStylePanel.style.display = dt.preset === 'custom' ? 'block' : 'none';
      }

      // 3. Custom color / font inputs
      const accentColorVal = tc.querySelector('[data-prop="accentColor"]');
      if (accentColorVal) accentColorVal.value = dt.accentColor;
      const accentColorText = tc.querySelector('#color-accent-text');
      if (accentColorText) accentColorText.value = dt.accentColor;

      const headerBgVal = tc.querySelector('[data-prop="headerBg"]');
      if (headerBgVal) headerBgVal.value = dt.headerBg;
      const headerBgText = tc.querySelector('#color-header-text');
      if (headerBgText) headerBgText.value = dt.headerBg;

      const accentTintVal = tc.querySelector('[data-prop="accentTint"]');
      if (accentTintVal) accentTintVal.value = dt.accentTint;
      const accentTintText = tc.querySelector('#color-tint-text');
      if (accentTintText) accentTintText.value = dt.accentTint;

      const fontFamilySelect = tc.querySelector('[data-prop="fontFamily"]');
      if (fontFamilySelect) fontFamilySelect.value = dt.fontFamily;

      // 4. Logo visibility checkbox
      const hideLogoChk = tc.querySelector('#theme-hide-logo');
      if (hideLogoChk) hideLogoChk.checked = !!dt.hideLogo;

      const logoControls = tc.querySelector('#logo-branding-controls');
      if (logoControls) logoControls.style.display = dt.hideLogo ? 'none' : 'flex';

      const hideCompanyNameChk = tc.querySelector('#theme-hide-company-name');
      if (hideCompanyNameChk) hideCompanyNameChk.checked = !!dt.hideCompanyName;

      const logoSourceSelect = tc.querySelector('#theme-logo-source');
      if (logoSourceSelect) logoSourceSelect.value = dt.logoSource || 'large';

      // 5. Logo Alignment buttons
      tc.querySelectorAll('.logo-align-btn').forEach(btn => {
        if (btn.dataset.align === dt.logoAlignment) {
          btn.classList.add('btn-primary');
        } else {
          btn.classList.remove('btn-primary');
        }
      });

      // 6. Logo Scale slider & label
      const scaleSlider = tc.querySelector('#theme-logo-scale');
      if (scaleSlider) scaleSlider.value = dt.logoScale || 60;
      const scaleLabel = tc.querySelector('#scale-val-label');
      if (scaleLabel) scaleLabel.textContent = (dt.logoScale || 60) + 'px';

      // 7. Text Copy inputs
      const invoiceTitleInp = tc.querySelector('[data-prop="invoiceTitle"]');
      if (invoiceTitleInp) invoiceTitleInp.value = dt.invoiceTitle || '';

      const invoicePrefixInp = tc.querySelector('[data-prop="invoicePrefix"]');
      if (invoicePrefixInp) invoicePrefixInp.value = dt.invoicePrefix || '';

      const invoiceStartingNumberInp = tc.querySelector('[data-prop="invoiceStartingNumber"]');
      if (invoiceStartingNumberInp) invoiceStartingNumberInp.value = dt.invoiceStartingNumber !== undefined ? dt.invoiceStartingNumber : 1;

      const invoicePaymentTermsInp = tc.querySelector('[data-prop="invoicePaymentTerms"]');
      if (invoicePaymentTermsInp) invoicePaymentTermsInp.value = dt.invoicePaymentTerms || '';

      const invoiceTermsInp = tc.querySelector('[data-prop="invoiceTerms"]');
      if (invoiceTermsInp) invoiceTermsInp.value = dt.invoiceTerms || '';

      const quoteTitleInp = tc.querySelector('[data-prop="quoteTitle"]');
      if (quoteTitleInp) quoteTitleInp.value = dt.quoteTitle || '';

      const quoteTermsInp = tc.querySelector('[data-prop="quoteTerms"]');
      if (quoteTermsInp) quoteTermsInp.value = dt.quoteTerms || '';

      const quotePrefixInp = tc.querySelector('[data-prop="quotePrefix"]');
      if (quotePrefixInp) quotePrefixInp.value = dt.quotePrefix || '';

      const quoteStartingNumberInp = tc.querySelector('[data-prop="quoteStartingNumber"]');
      if (quoteStartingNumberInp) quoteStartingNumberInp.value = dt.quoteStartingNumber !== undefined ? dt.quoteStartingNumber : 1;

      const footerNoteInp = tc.querySelector('[data-prop="footerNote"]');
      if (footerNoteInp) footerNoteInp.value = dt.footerNote || '';

      // 8. Toggles / Checkboxes
      const stripeChk = tc.querySelector('#theme-stripe');
      if (stripeChk) stripeChk.checked = !!dt.paymentStripe;

      const bankTransferChk = tc.querySelector('#theme-bank-transfer');
      if (bankTransferChk) bankTransferChk.checked = !!dt.paymentDirectTransfer;

      const cashChk = tc.querySelector('#theme-cash');
      if (cashChk) cashChk.checked = !!dt.paymentCash;

      const quoteSigChk = tc.querySelector('#theme-quote-sig');
      if (quoteSigChk) quoteSigChk.checked = !!dt.quoteSignature;

      const hideBrandLogoChk = tc.querySelector('#theme-hide-brand-logo');
      if (hideBrandLogoChk) hideBrandLogoChk.checked = !!dt.hideBrandLogo;
    }

    function updatePreview(fullReload = false) {
      const frame = tc.querySelector('#preview-frame');
      if (!frame) return;
      
      const tempSettings = {
        ...settings,
        documentTheme: { ...dt }
      };

      const frameDoc = frame.contentDocument || frame.contentWindow.document;
      const hasWrapper = frameDoc && frameDoc.getElementById('document-content-wrapper');

      if (fullReload || !hasWrapper) {
        // If we already assigned srcdoc and are not forcing a full reload, wait for it to finish loading
        if (!fullReload && frame.dataset.srcdocAssigned === 'true') {
          return;
        }

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style id="theme-preview-styles">
              ${getPrintStyles(tempSettings)}
              /* Overwrite general frame layout margins */
              .pdf-page { padding: 24px 32px !important; max-width: 100% !important; margin: 0 !important; }
            </style>
          </head>
          <body style="background:#f1f5f9; padding: 16px; margin:0">
            <div style="background:white; border-radius:6px; border:1px solid #e2e8f0; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)">
              <div id="document-content-wrapper">
                ${generateDocument(activePreviewTab, mockData)}
              </div>
            </div>
          </body>
          </html>
        `;
        
        frame.dataset.srcdocAssigned = 'true';
        frame.onload = () => {
          frame.dataset.srcdocAssigned = 'false';
          frame.onload = null;
          updatePreview();
        };
        frame.srcdoc = html;
        return;
      }

      // SELECTIVE DOM PATCHING (No Reload = No Scroll Reset)
      
      // 1. Live update the style tag
      const styleTag = frameDoc.getElementById('theme-preview-styles');
      if (styleTag) {
        styleTag.innerHTML = `
          ${getPrintStyles(tempSettings)}
          /* Overwrite general frame layout margins */
          .pdf-page { padding: 24px 32px !important; max-width: 100% !important; margin: 0 !important; }
        `;
      }

      // 2. Live update document titles
      const docTypeEl = frameDoc.querySelector('.pdf-doc-type');
      if (docTypeEl) {
        docTypeEl.textContent = activePreviewTab === 'quote' 
          ? (dt.quoteTitle || 'PROPOSAL / QUOTE') 
          : (dt.invoiceTitle || 'TAX INVOICE');
      }

      // 3. Live update logo size and header alignment
      const headerEl = frameDoc.querySelector('.pdf-header');
      const companyEl = frameDoc.querySelector('.pdf-company');
      if (headerEl && companyEl) {
        let headerFlexStyle = 'display:flex; justify-content:space-between; align-items:flex-start;';
        let companyFlexStyle = 'display:flex; gap:14px; align-items:flex-start;';
        let titleBlockStyle = 'text-align: right;';
        
        if (dt.logoAlignment === 'right') {
          companyFlexStyle = 'display:flex; gap:14px; align-items:flex-start; flex-direction: row-reverse; text-align: right;';
        } else if (dt.logoAlignment === 'center') {
          headerFlexStyle = 'display:flex; flex-direction:column; align-items:center; gap:20px; border-bottom: 2px solid #E4E9F0; padding-bottom: 24px; margin-bottom: 32px;';
          companyFlexStyle = 'display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px;';
          titleBlockStyle = 'text-align: center; margin-top: 10px;';
        }
        
        headerEl.style.cssText = headerFlexStyle;
        companyEl.style.cssText = companyFlexStyle;
        
        const titleBlockEl = frameDoc.querySelector('.pdf-title-block');
        if (titleBlockEl) titleBlockEl.style.cssText = titleBlockStyle;
      }

      // Logo Scale / Visibility
      const logoImg = frameDoc.querySelector('.pdf-logo-img');
      const logoBadge = frameDoc.querySelector('.pdf-logo');
      const logoText = frameDoc.querySelector('.pdf-logo-text');

      if (dt.hideLogo) {
        if (logoImg) logoImg.style.display = 'none';
        if (logoBadge) logoBadge.style.display = 'none';
        if (logoText) {
          logoText.style.display = 'block';
          logoText.style.color = dt.accentColor || '#1B6DE0';
        }
      } else {
        if (logoText) logoText.style.display = 'none';
        
        const logoHeight = dt.logoScale !== undefined ? dt.logoScale : 60;
        const logoUrl = dt.logoSource === 'small' ? (settings.logoSmall || settings.logo) : (settings.logo || settings.logoSmall);
        if (logoImg) {
          logoImg.style.display = 'block';
          logoImg.src = logoUrl || '';
          logoImg.style.maxHeight = logoHeight + 'px';
        }
        if (logoBadge) {
          logoBadge.style.display = 'flex';
          logoBadge.style.background = `linear-gradient(135deg, ${dt.accentColor || '#1B6DE0'}, ${dt.accentColor || '#1B6DE0'}dd)`;
        }
      }

      // Company Name visibility
      const companyNameEl = frameDoc.querySelector('.pdf-company-name');
      if (companyNameEl) {
        companyNameEl.style.display = dt.hideCompanyName ? 'none' : 'block';
      }

      // 4. Live update Payment Options
      const paymentSection = frameDoc.querySelector('.pdf-payment-methods');
      if (paymentSection) {
        const showPayment = activePreviewTab === 'invoice' && (dt.paymentStripe || dt.paymentDirectTransfer || dt.paymentCash);
        paymentSection.style.display = showPayment ? 'block' : 'none';
        
        const stripeOption = paymentSection.querySelector('.pdf-payment-option-stripe');
        if (stripeOption) {
          stripeOption.style.display = dt.paymentStripe ? 'block' : 'none';
          const stripeBtn = stripeOption.querySelector('a');
          if (stripeBtn) stripeBtn.style.background = dt.accentColor || '#1B6DE0';
        }
        
        const directOption = paymentSection.querySelector('.pdf-payment-option-direct');
        if (directOption) {
          directOption.style.display = dt.paymentDirectTransfer ? 'block' : 'none';
          const bankDetailsEl = directOption.querySelector('.pdf-bank-details');
          if (bankDetailsEl) {
            bankDetailsEl.innerHTML = escapeHTML(dt.invoicePaymentTerms || '').replace(/\n/g, '<br/>');
          }
        }
        
        const cashOption = paymentSection.querySelector('.pdf-payment-option-cash');
        if (cashOption) {
          cashOption.style.display = dt.paymentCash ? 'block' : 'none';
        }
      }

      // 5. Live update Quote Signatures
      const sigSection = frameDoc.querySelector('.pdf-signature-block');
      if (sigSection) {
        const showSig = activePreviewTab === 'quote' && dt.quoteSignature;
        sigSection.style.display = showSig ? 'flex' : 'none';
      }

      // 6. Live update Terms in Footer
      const footerTextEl = frameDoc.querySelector('.pdf-footer-text');
      if (footerTextEl) {
        footerTextEl.textContent = activePreviewTab === 'quote'
          ? (dt.quoteTerms || 'This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.')
          : (dt.invoiceTerms || 'Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business.');
      }

      const footerNoteEl = frameDoc.querySelector('.pdf-footer-note');
      if (footerNoteEl) {
        if (dt.footerNote) {
          footerNoteEl.style.display = 'block';
          footerNoteEl.textContent = dt.footerNote;
        } else {
          footerNoteEl.style.display = 'none';
        }
      }

      const footerBrandingEl = frameDoc.querySelector('.pdf-footer-branding');
      if (footerBrandingEl) {
        const hideBrandLogo = isLocalMode ? false : !!dt.hideBrandLogo;
        footerBrandingEl.style.display = hideBrandLogo ? 'none' : 'flex';
      }
    }

    renderMarkup();
  }

  function renderFolderSyncTab(tc) {
    const isSupported = typeof window !== 'undefined' && (
      (window.indexedDB && window.showDirectoryPicker) ||
      (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem)
    );

    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;

    const activeAccountId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('relay_active_account') : null;
    const isLocalCompany = !!activeAccountId;

    function render() {
      console.log('[DEBUG Settings] render: isLocalCompany =', isLocalCompany, 'store.dirHandle =', store.dirHandle, 'permissionGranted =', store.folderSyncPermissionGranted);
      const isEnabled = isLocalCompany ? true : store.folderSyncEnabled;
      const isPermissionGranted = store.folderSyncPermissionGranted;
      const hasHandle = !!store.dirHandle;

      let statusHtml = '';
      if (!isSupported) {
        statusHtml = `
          <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:16px; border-radius:4px; color:var(--color-danger); margin-bottom:var(--space-lg);">
            <div style="display:flex; align-items:center; gap:8px; font-weight:600; margin-bottom:4px;">
              <span class="material-icons-outlined">error_outline</span>
              <span>Browser Directory Access Unsupported</span>
            </div>
            <p style="font-size:var(--font-size-sm); margin:0; line-height:1.4;">
              Your current browser does not support local folder access. To enable direct folder synchronization, please run this app in a Chromium-based browser (Chrome, Edge, Opera, or as a compiled native app). High-capacity IndexedDB storage remains active.
            </p>
          </div>
        `;
      } else if (!isEnabled) {
        statusHtml = `
          <div style="background:var(--bg-color); border:1px solid var(--border-color); padding:16px; border-radius:6px; color:var(--text-secondary); margin-bottom:var(--space-lg); display:flex; align-items:center; gap:12px;">
            <span class="material-icons-outlined" style="font-size:32px; color:var(--text-tertiary);">folder_off</span>
            <div>
              <div style="font-weight:600; color:var(--text-primary); margin-bottom:2px;">Folder Synchronization Inactive</div>
              <p style="font-size:12.5px; margin:0; line-height:1.4;">All data is currently stored in your browser's private IndexedDB database sandbox.</p>
            </div>
          </div>
        `;
      } else if (isCapacitor) {
        statusHtml = `
          <div style="background:var(--color-success-bg); border-left:4px solid var(--color-success); padding:16px; border-radius:4px; color:var(--color-success); margin-bottom:var(--space-lg); display:flex; align-items:center; gap:12px;">
            <span class="material-icons-outlined" style="font-size:32px;">cloud_done</span>
            <div>
              <div style="font-weight:600; margin-bottom:2px;">Capacitor Direct Folder Sync Active</div>
              <p style="font-size:12.5px; margin:0; line-height:1.4; color:var(--text-secondary);">
                Data is synchronizing directly to the application's native <strong>Documents/RelayDispatchData</strong> directory on your iPad/device.
              </p>
            </div>
          </div>
        `;
      } else if (!hasHandle) {
        statusHtml = `
          <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:16px; border-radius:4px; color:var(--color-warning); margin-bottom:var(--space-lg); display:flex; align-items:center; gap:12px;">
            <span class="material-icons-outlined" style="font-size:32px;">warning</span>
            <div>
              <div style="font-weight:600; margin-bottom:2px;">No Directory Selected</div>
              <p style="font-size:12.5px; margin:0; line-height:1.4; color:var(--text-secondary);">Please select a directory folder on your computer to begin syncing.</p>
            </div>
          </div>
        `;
      } else if (!isPermissionGranted) {
        statusHtml = `
          <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:16px; border-radius:4px; color:var(--color-warning); margin-bottom:var(--space-lg);">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
              <span class="material-icons-outlined" style="font-size:32px;">lock</span>
              <div>
                <div style="font-weight:600; margin-bottom:2px;">Access Permission Suspended</div>
                <p style="font-size:12.5px; margin:0; line-height:1.4; color:var(--text-secondary);">
                  The browser requires re-authorization to read/write files in <strong>${escapeHTML(store.dirHandle.name)}</strong>.
                </p>
              </div>
            </div>
            <button class="btn btn-warning" id="btn-reauthorize-dir" style="margin-left:44px;">
              <span class="material-icons-outlined">vpn_key</span> Re-authorize Access
            </button>
          </div>
        `;
      } else {
        statusHtml = `
          <div style="background:var(--color-success-bg); border-left:4px solid var(--color-success); padding:16px; border-radius:4px; color:var(--color-success); margin-bottom:var(--space-lg); display:flex; align-items:center; gap:12px;">
            <span class="material-icons-outlined" style="font-size:32px;">check_circle</span>
            <div>
              <div style="font-weight:600; margin-bottom:2px;">Folder Sync Active & Synchronized</div>
              <p style="font-size:12.5px; margin:0; line-height:1.4; color:var(--text-secondary);">
                Active Folder: <strong>${escapeHTML(store.dirHandle.name)}</strong>. All data edits are writing dynamically.
              </p>
            </div>
          </div>
        `;
      }

      tc.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 340px; gap:var(--space-lg); max-width:1100px; align-items:start;">
          <!-- Folder Configuration -->
          <div class="card">
            <div class="card-header"><h4>Direct Directory Sync</h4></div>
            <div class="card-body">
              ${statusHtml}

              <div class="form-group" style="margin-bottom:var(--space-lg);">
                <label class="form-label" style="font-weight:600; margin-bottom:8px;">Synchronization Toggle</label>
                <label class="switch-container" style="display:flex; align-items:center; gap:12px; cursor:${(!isSupported || isLocalCompany) ? 'not-allowed' : 'pointer'};">
                  <input type="checkbox" id="toggle-folder-sync" ${isEnabled ? 'checked' : ''} ${(!isSupported || isLocalCompany) ? 'disabled' : ''} style="width:20px; height:20px; cursor:${(!isSupported || isLocalCompany) ? 'not-allowed' : 'pointer'};" />
                  <div>
                    <span style="font-weight:500;">Enable Direct Local Folder Storage</span>
                    <div class="text-tertiary" style="font-size:12px; margin-top:2px;">
                      ${isLocalCompany ? 'Mandatory for offline/local company profile storage.' : 'Saves all data records and attachments straight to your machine.'}
                    </div>
                  </div>
                </label>
              </div>

              ${isEnabled && isSupported && !isCapacitor ? `
                <div style="display:flex; gap:12px; flex-wrap:wrap; border-top:1px solid var(--border-color); padding-top:var(--space-lg);">
                  <button class="btn btn-secondary" id="btn-pick-dir">
                    <span class="material-icons-outlined">folder</span> Choose Sync Folder...
                  </button>
                  ${hasHandle && isPermissionGranted ? `
                    <button class="btn btn-secondary" id="btn-force-sync" data-tooltip="Overwrite folder JSONs with current memory cache" data-tooltip-pos="top">
                      <span class="material-icons-outlined">sync</span> Sync Now
                    </button>
                    ${!isLocalCompany ? `
                      <button class="btn btn-danger" id="btn-disconnect-dir">
                        <span class="material-icons-outlined">link_off</span> Disconnect Folder
                      </button>
                    ` : ''}
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Instructions Card -->
          <div class="card" style="background:var(--content-bg);">
            <div class="card-header"><h4>How Self-Hosting Works</h4></div>
            <div class="card-body" style="font-size:13px; line-height:1.6; display:flex; flex-direction:column; gap:12px; color:var(--text-secondary);">
              <p>
                By linking a local folder, you establish a <strong>serverless self-hosted data hub</strong>.
              </p>
              <div style="display:flex; gap:8px; align-items:flex-start;">
                <span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px; margin-top:2px;">storage</span>
                <span><strong>Readable Data:</strong> Your jobs, quotes, and company configurations are saved in <code>data/*.json</code> files.</span>
              </div>
              <div style="display:flex; gap:8px; align-items:flex-start;">
                <span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px; margin-top:2px;">photo_library</span>
                <span><strong>Physical Attachments:</strong> Uploaded photos and PDF catalogs are saved as standard image/PDF files under the <code>documents/</code> subfolder.</span>
              </div>
              <div style="display:flex; gap:8px; align-items:flex-start;">
                <span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px; margin-top:2px;">sync_alt</span>
                <span><strong>Cloud Backups:</strong> Select a folder synced to <strong>OneDrive, Google Drive, or Dropbox</strong> to automatically back up and sync your data to the cloud.</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Event Listeners
      const toggle = tc.querySelector('#toggle-folder-sync');
      toggle?.addEventListener('change', async (e) => {
        if (isLocalCompany) {
          e.preventDefault();
          toggle.checked = true;
          return;
        }

        if (isCapacitor) {
          await store.setLocalDirectory(e.target.checked ? {} : null);
          showToast(e.target.checked ? 'Capacitor folder sync activated' : 'Folder sync deactivated', 'success');
          render();
          return;
        }

        if (e.target.checked) {
          // Trigger directory picker
          try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await store.setLocalDirectory(handle);
            showToast('Sync directory configured successfully', 'success');
          } catch (err) {
            console.error('Directory selection cancelled or failed:', err);
            toggle.checked = false;
            showToast('Folder selection cancelled', 'info');
          }
        } else {
          await store.setLocalDirectory(null);
          showToast('Direct directory synchronization disabled', 'info');
        }
        render();
      });

      tc.querySelector('#btn-pick-dir')?.addEventListener('click', async () => {
        try {
          const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
          await store.setLocalDirectory(handle);
          showToast('Sync directory updated successfully', 'success');
          render();
        } catch (err) {
          console.error(err);
        }
      });

      tc.querySelector('#btn-reauthorize-dir')?.addEventListener('click', async () => {
        const granted = await store.verifyDirPermission(true);
        if (granted) {
          showToast('Folder access re-authorized successfully', 'success');
        } else {
          showToast('Failed to acquire write permissions', 'error');
        }
        render();
      });

      tc.querySelector('#btn-disconnect-dir')?.addEventListener('click', async () => {
        await store.setLocalDirectory(null);
        showToast('Local folder disconnected', 'info');
        render();
      });

      tc.querySelector('#btn-force-sync')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        showToast('Writing cache data to local directory...', 'info');
        try {
          const collections = Object.keys(store.cache);
          await Promise.all(collections.map(col => store.writeCollectionToFolder(col, store.cache[col])));
          showToast('Folder sync completed successfully!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Folder sync failed: ' + err.message, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    }

    render();
  }

  function renderApiKeysTab(tc) {
    const s = store.getSettings();
    const isLocalMode = !store.companyId || store.companyId.startsWith('acct_');
    const ai = s.ai || {
      enabled: false,
      apiKey: '',
      visionApiKey: '',
      useSameKey: true,
      endpoint: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      visionEndpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      visionModel: 'gemini-2.0-flash',
      systemPrompt: 'You are Deputy, an intelligent CRM co-pilot assistant. You help dispatchers manage jobs, quotes, invoices, and scheduling.'
    };
    if (ai.useSameKey === undefined) ai.useSameKey = true;
    const maps = s.maps || { apiKey: '' };

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null') || { id: 'default' };
    const userId = currentUser.id || 'default';
    const factsheetKey = `relay_factsheet_${userId}`;
    const enabledKey = `relay_factsheet_enabled_${userId}`;
    const factsheetVal = localStorage.getItem(factsheetKey) || '';
    const memoryEnabled = localStorage.getItem(enabledKey) !== 'false';

    function render() {
      tc.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 340px; gap:var(--space-lg); max-width:1100px; align-items:start;">
          <div style="display:flex; flex-direction:column; gap:var(--space-lg);">
            <div class="card">
              <div class="card-header"><h4>AI Assistant Configuration</h4></div>
              <div class="card-body" style="display:flex; flex-direction:column; gap:16px;">
                
                <div class="form-group">
                  <label class="switch-container" style="display:flex; align-items:center; gap:12px; cursor:pointer;">
                    <input type="checkbox" id="ai-enabled" ${ai.enabled ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;" />
                    <div>
                      <span style="font-weight:600;">Enable AI Assistant</span>
                      <div class="text-tertiary" style="font-size:12px; margin-top:2px;">Replaces the basic rule-based Relay co-pilot with a smart conversational LLM.</div>
                    </div>
                  </label>
                </div>

                <div id="ai-fields" style="display: ${ai.enabled ? 'flex' : 'none'}; flex-direction:column; gap:16px; border-top:1px solid var(--border-color); padding-top:16px;">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label" style="font-weight:600;">Text API Key</label>
                      <input type="password" class="form-input" id="ai-apikey" value="${ai.apiKey || ''}" placeholder="${isLocalMode ? 'sk-...' : 'Optional — Defaults to secure cloud API key'}" />
                    </div>
                    <div class="form-group">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label class="form-label" style="font-weight:600; margin-bottom:0;">Vision API Key</label>
                        <label style="display:flex; align-items:center; gap:6px; font-size:12px; cursor:pointer;">
                          <input type="checkbox" id="ai-use-same-key" ${ai.useSameKey ? 'checked' : ''} style="width:14px; height:14px;" /> Use Text API Key
                        </label>
                      </div>
                      <input type="password" class="form-input" id="ai-vision-apikey" value="${ai.useSameKey ? (ai.apiKey || '') : (ai.visionApiKey || '')}" placeholder="API Key for Vision Model" style="margin-top:6px; ${ai.useSameKey ? 'opacity:0.5; pointer-events:none;' : ''}" />
                    </div>
                  </div>
                  <div class="text-tertiary" style="font-size:11px; margin-top:-8px;">${isLocalMode ? 'Your API keys are stored locally in your browser/sync directory.' : 'Keys are optional. If blank, cloud operations will route securely through Edge Functions.'}</div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label" style="font-weight:600;">Text API Endpoint</label>
                      <input type="text" class="form-input" id="ai-endpoint" value="${ai.endpoint || 'https://api.deepseek.com/chat/completions'}" placeholder="https://api.deepseek.com/chat/completions" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-weight:600;">Text Model Name</label>
                      <input type="text" class="form-input" id="ai-model" value="${ai.model || 'deepseek-chat'}" placeholder="deepseek-chat" />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label" style="font-weight:600;">Vision API Endpoint (Multimodal)</label>
                      <input type="text" class="form-input" id="ai-vision-endpoint" value="${ai.visionEndpoint || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'}" placeholder="https://api.openai.com/v1/chat/completions" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-weight:600;">Vision Model Name</label>
                      <input type="text" class="form-input" id="ai-vision-model" value="${ai.visionModel || 'gemini-2.0-flash'}" placeholder="gpt-4o-mini" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" style="font-weight:600;">Base System Prompt</label>
                    <textarea class="form-input" id="ai-systemprompt" rows="4" style="font-family:inherit; resize:vertical;">${ai.systemPrompt || ''}</textarea>
                    <div class="text-tertiary" style="font-size:11px; margin-top:4px;">Defines the persona and basic rules for Relay. Active system records (jobs, quotes, technicians) are appended dynamically in the conversation background.</div>
                  </div>

                  <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
                    <button class="btn btn-secondary" id="btn-test-ai" style="display:flex; align-items:center; gap:6px;">
                      <span class="material-icons-outlined" style="font-size:18px;">bolt</span> Test Connection
                    </button>
                    <span id="test-status" style="font-size:13px; font-weight:500;"></span>
                  </div>
                  <div id="test-error-details" style="display:none; margin-top:8px; font-size:12px; color:var(--color-danger); background:var(--color-danger-bg); border-left:3px solid var(--color-danger); padding:8px; border-radius:4px; line-height:1.4;"></div>
                </div>

                <div style="border-top:1px solid var(--border-color); padding-top:16px; display:flex; justify-content:flex-end;">
                  <button class="btn btn-primary" id="btn-save-ai">Save AI Config</button>
                </div>

              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Google Maps Configuration</h4></div>
              <div class="card-body" style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                  <label class="form-label" style="font-weight:600;">Maps API Key</label>
                  <input type="password" class="form-input" id="maps-apikey" value="${maps.apiKey || ''}" placeholder="AIzaSy..." />
                  <div class="text-tertiary" style="font-size:11px; margin-top:4px;">Used for address autocomplete, distance calculations, and rendering maps. Get this from the Google Cloud Console.</div>
                </div>
                <div style="border-top:1px solid var(--border-color); padding-top:16px; display:flex; justify-content:flex-end;">
                  <button class="btn btn-primary" id="btn-save-maps">Save Maps Config</button>
                </div>
              </div>
            </div>

          </div>

          <!-- Cheapest Smart AI Card -->
          <div class="card" style="background:var(--content-bg);">
            <div class="card-header"><h4>Cheapest Smart AI Guide</h4></div>
            <div class="card-body" style="font-size:13px; line-height:1.6; display:flex; flex-direction:column; gap:12px; color:var(--text-secondary);">
              <p style="margin:0;">
                <strong>DeepSeek</strong> is one of the most cost-efficient and high-performance language models currently available, making it perfect for lightweight co-pilot tasks.
              </p>
              <div style="display:flex; gap:8px; align-items:flex-start;">
                <span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px; margin-top:2px;">key</span>
                <span><strong>API Key:</strong> Get your key from <a href="https://platform.deepseek.com/" target="_blank" style="color:var(--color-primary); text-decoration:underline;">platform.deepseek.com</a>. New accounts typically receive free trial credits.</span>
              </div>
              <div style="display:flex; gap:8px; align-items:flex-start;">
                <span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px; margin-top:2px;">security</span>
                <span><strong>CORS Restrictions:</strong> Due to browser security, direct API calls to DeepSeek may be blocked. To bypass this:
                  <ul style="margin:4px 0 0 16px; padding:0; list-style:disc; font-size:12px;">
                    <li>Route via a CORS proxy (e.g. <code>https://cors-anywhere.herokuapp.com/</code> prefix).</li>
                    <li>Connect via an aggregator like <strong>OpenRouter</strong> (API Endpoint: <code>https://openrouter.ai/api/v1/chat/completions</code>).</li>
                    <li>Use a local LLM runner like <strong>Ollama</strong> (API Endpoint: <code>http://localhost:11434/v1/chat/completions</code>).</li>
                  </ul>
                </span>
              </div>
            </div>
          </div>

        </div>
      `;

      // Toggle display of fields based on enabled checkbox
      const enabledCheckbox = tc.querySelector('#ai-enabled');
      const fieldsContainer = tc.querySelector('#ai-fields');
      enabledCheckbox.addEventListener('change', (e) => {
        fieldsContainer.style.display = e.target.checked ? 'flex' : 'none';
      });

      const useSameKeyCheckbox = tc.querySelector('#ai-use-same-key');
      const visionApiKeyInput = tc.querySelector('#ai-vision-apikey');
      const textApiKeyInput = tc.querySelector('#ai-apikey');
      if (useSameKeyCheckbox && visionApiKeyInput) {
        useSameKeyCheckbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            visionApiKeyInput.style.opacity = '0.5';
            visionApiKeyInput.style.pointerEvents = 'none';
            if (textApiKeyInput) visionApiKeyInput.value = textApiKeyInput.value;
          } else {
            visionApiKeyInput.style.opacity = '1';
            visionApiKeyInput.style.pointerEvents = 'auto';
            visionApiKeyInput.focus();
          }
        });
        
        if (textApiKeyInput) {
          textApiKeyInput.addEventListener('input', (e) => {
            if (useSameKeyCheckbox.checked) {
              visionApiKeyInput.value = e.target.value;
            }
          });
        }
      }



      // Save handler
      tc.querySelector('#btn-save-ai').addEventListener('click', () => {
        const enabled = enabledCheckbox.checked;
        const apiKey = tc.querySelector('#ai-apikey').value.trim();
        const useSameKey = tc.querySelector('#ai-use-same-key') ? tc.querySelector('#ai-use-same-key').checked : true;
        const visionApiKey = useSameKey ? apiKey : tc.querySelector('#ai-vision-apikey').value.trim();
        const endpoint = tc.querySelector('#ai-endpoint').value.trim();
        const model = tc.querySelector('#ai-model').value.trim();
        const visionEndpoint = tc.querySelector('#ai-vision-endpoint').value.trim();
        const visionModel = tc.querySelector('#ai-vision-model').value.trim();
        const systemPrompt = tc.querySelector('#ai-systemprompt').value.trim();

        if (isLocalMode && enabled && !apiKey) {
          showToast('Text API Key is required when enabling the AI assistant.', 'error');
          return;
        }

        const settings = store.getSettings();
        settings.ai = {
          enabled,
          apiKey,
          visionApiKey,
          useSameKey,
          endpoint,
          model,
          visionEndpoint,
          visionModel,
          systemPrompt
        };

        store.saveSettings(settings);
        showToast('AI settings saved successfully', 'success');
      });

      tc.querySelector('#btn-save-maps').addEventListener('click', () => {
        const apiKey = tc.querySelector('#maps-apikey').value.trim();
        const settings = store.getSettings();
        settings.maps = { apiKey };
        store.saveSettings(settings);
        showToast('Maps settings saved successfully', 'success');
      });

      // Test handler
      tc.querySelector('#btn-test-ai').addEventListener('click', async () => {
        const apiKey = tc.querySelector('#ai-apikey').value.trim();
        const endpoint = tc.querySelector('#ai-endpoint').value.trim();
        const model = tc.querySelector('#ai-model').value.trim();
        const statusEl = tc.querySelector('#test-status');
        const errEl = tc.querySelector('#test-error-details');

        const inElectron = !!(window.electronAPI && window.electronAPI.callDeepSeek);
        const hasEnvKey = !!(import.meta.env.VITE_DEEPSEEK_API_KEY);

        if (!apiKey && !inElectron && !hasEnvKey) {
          showToast('Enter an API key to test.', 'error');
          return;
        }

        statusEl.style.color = 'var(--text-secondary)';
        statusEl.textContent = 'Testing connection...';
        errEl.style.display = 'none';

        const startTime = Date.now();
        try {
          if (inElectron) {
            const data = await window.electronAPI.callDeepSeek({
              messages: [{ role: 'user', content: 'respond only with the word OK' }],
              endpoint,
              model,
              apiKey // Pass typed key if any
            });
            const latency = Date.now() - startTime;
            const reply = data.choices?.[0]?.message?.content || 'No reply';
            statusEl.style.color = 'var(--color-success)';
            statusEl.textContent = `Success (via Electron IPC)! Latency: ${latency}ms (Reply: "${reply}")`;
          } else {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY}`
              },
              body: JSON.stringify({
                model: model || 'deepseek-chat',
                messages: [
                  { role: 'user', content: 'respond only with the word OK' }
                ],
                max_tokens: 5
              })
            });

            if (!res.ok) {
              const body = await res.text();
              throw new Error(`HTTP ${res.status}: ${body}`);
            }

            const data = await res.json();
            const latency = Date.now() - startTime;
            const reply = data.choices?.[0]?.message?.content || 'No reply';
            statusEl.style.color = 'var(--color-success)';
            statusEl.textContent = `Success! Latency: ${latency}ms (Reply: "${reply}")`;
          }
        } catch (err) {
          console.error('AI test connection failed:', err);
          statusEl.style.color = 'var(--color-danger)';
          statusEl.textContent = 'Test failed';
          errEl.style.display = 'block';

          let errMsg = err.message;
          if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
            errMsg = 'CORS Blocked or Offline. The browser blocked this cross-origin request. Please use a CORS proxy, an API gateway like OpenRouter, or check your internet connection.';
          }
          errEl.textContent = errMsg;
        }
      });
    }

    render();
  }

  function renderCostCentersTab(tc) {
      const list = store.getAll('costCenters') || [];

      const renderTab = () => {
        tc.innerHTML = `
          <div class="card" style="max-width:900px">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4 style="margin:0">Cost Centers</h4>
              <button class="btn btn-primary btn-sm" id="btn-add-cost-center" style="display:flex; align-items:center; gap:6px">
                <span class="material-icons-outlined" style="font-size:18px">add</span> Add Cost Center
              </button>
            </div>
            <div class="card-body" style="padding:0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="padding-left:16px; width:120px">Code</th>
                    <th>Name</th>
                    <th>Xero Mapping</th>
                    <th style="width:120px">Status</th>
                    <th style="text-align:right; padding-right:16px; width:180px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.length === 0 ? `
                    <tr>
                      <td colspan="5" style="text-align:center; padding:32px 16px; color:var(--text-secondary)">
                        No Cost Centers configured. Click "Add Cost Center" to create one.
                      </td>
                    </tr>
                  ` : list.map(cc => `
                    <tr>
                      <td style="padding-left:16px; font-weight:600">${escapeHTML(cc.code)}</td>
                      <td>${escapeHTML(cc.name)}</td>
                      <td>
                        ${cc.xeroSalesAccountCode || cc.xeroTrackingOptionName ? `
                          <div style="font-size:11px; line-height:1.4">
                            ${cc.xeroSalesAccountCode ? `<div><span class="text-tertiary">Sales Code:</span> <strong>${escapeHTML(cc.xeroSalesAccountCode)}</strong></div>` : ''}
                            ${cc.xeroExpenseAccountCode ? `<div><span class="text-tertiary">Expense Code:</span> <strong>${escapeHTML(cc.xeroExpenseAccountCode)}</strong></div>` : ''}
                            ${cc.xeroTrackingOptionName ? `<div><span class="text-tertiary">Tracking:</span> <strong>${escapeHTML(cc.xeroTrackingCategoryName || 'Department')}:${escapeHTML(cc.xeroTrackingOptionName)}</strong></div>` : ''}
                          </div>
                        ` : '<span class="text-tertiary" style="font-size:11px">— Unmapped —</span>'}
                      </td>
                      <td>
                        <span class="badge ${cc.active ? 'badge-success' : 'badge-neutral'}">
                          ${cc.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style="text-align:right; padding-right:16px">
                        <button class="btn btn-secondary btn-sm btn-edit-cc" data-id="${cc.id}" style="margin-right:6px">Edit</button>
                        <button class="btn btn-outline btn-sm btn-toggle-cc" data-id="${cc.id}">
                          ${cc.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        tc.querySelector('#btn-add-cost-center')?.addEventListener('click', () => openCostCenterModal());
        tc.querySelectorAll('.btn-edit-cc').forEach(btn => {
          btn.addEventListener('click', (e) => openCostCenterModal(e.target.dataset.id));
        });
        tc.querySelectorAll('.btn-toggle-cc').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const cc = store.getById('costCenters', id);
            if (cc) {
              const newActive = !cc.active;
              await store.update('costCenters', id, { active: newActive });
              showToast(`Cost center ${cc.name} has been ${newActive ? 'enabled' : 'disabled'}.`, 'success');
              renderCostCentersTab(tc);
            }
          });
        });
      };

      renderTab();
    }

    function openCostCenterModal(editId = null) {
      let cc = editId ? store.getById('costCenters', editId) : { 
        code: '', 
        name: '', 
        active: true,
        xeroSalesAccountCode: '',
        xeroExpenseAccountCode: '',
        xeroTrackingCategoryName: 'Department',
        xeroTrackingOptionName: ''
      };
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = `
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label" style="display:block; margin-bottom:6px">Cost Center Code</label>
          <input class="form-input" id="cc-code" value="${escapeHTML(cc.code)}" placeholder="e.g. ELEC" style="width:100%" />
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label" style="display:block; margin-bottom:6px">Cost Center Name</label>
          <input class="form-input" id="cc-name" value="${escapeHTML(cc.name)}" placeholder="e.g. Electrical Services" style="width:100%" />
        </div>
        
        <fieldset style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; margin-bottom: 16px; background:var(--card-bg)">
          <legend style="padding: 0 6px; font-size: 11px; font-weight: 600; color: var(--color-primary); display: flex; align-items: center; gap: 4px; margin: 0">
            <span class="material-icons-outlined" style="font-size:15px">sync</span> Xero Integration (Optional)
          </legend>
          <div class="form-row" style="margin-bottom:12px; display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label" style="font-size:11px; margin-bottom:4px">Sales Account Code</label>
              <input class="form-input" id="cc-xero-sales" value="${escapeHTML(cc.xeroSalesAccountCode || '')}" placeholder="e.g. 200" style="width:100%" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px; margin-bottom:4px">Expense Account Code</label>
              <input class="form-input" id="cc-xero-expense" value="${escapeHTML(cc.xeroExpenseAccountCode || '')}" placeholder="e.g. 300" style="width:100%" />
            </div>
          </div>
          <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label" style="font-size:11px; margin-bottom:4px">Tracking Category</label>
              <input class="form-input" id="cc-xero-category" value="${escapeHTML(cc.xeroTrackingCategoryName || 'Department')}" placeholder="e.g. Department" style="width:100%" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px; margin-bottom:4px">Tracking Option</label>
              <input class="form-input" id="cc-xero-option" value="${escapeHTML(cc.xeroTrackingOptionName || '')}" placeholder="e.g. Electrical" style="width:100%" />
            </div>
          </div>
        </fieldset>

        <div class="form-group">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" id="cc-active" ${cc.active ? 'checked' : ''} style="width:16px; height:16px; margin:0" />
            <span>Active</span>
          </label>
        </div>
      `;

      showModal({
        title: editId ? 'Edit Cost Center' : 'Add Cost Center',
        content: contentDiv,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
          { label: 'Save', className: 'btn-primary btn-save-cc', onClick: async (c) => {
            const code = document.getElementById('cc-code').value.trim().toUpperCase();
            const name = document.getElementById('cc-name').value.trim();
            const active = document.getElementById('cc-active').checked;
            const xeroSalesAccountCode = document.getElementById('cc-xero-sales').value.trim();
            const xeroExpenseAccountCode = document.getElementById('cc-xero-expense').value.trim();
            const xeroTrackingCategoryName = document.getElementById('cc-xero-category').value.trim();
            const xeroTrackingOptionName = document.getElementById('cc-xero-option').value.trim();

            if (!code) { showToast('Code required', 'error'); return; }
            if (!name) { showToast('Name required', 'error'); return; }

            try {
              const updates = { 
                code, 
                name, 
                active,
                xeroSalesAccountCode: xeroSalesAccountCode || null,
                xeroExpenseAccountCode: xeroExpenseAccountCode || null,
                xeroTrackingCategoryName: xeroTrackingCategoryName || null,
                xeroTrackingOptionName: xeroTrackingOptionName || null
              };
              if (editId) {
                await store.update('costCenters', editId, updates);
                showToast('Cost Center updated successfully', 'success');
              } else {
                await store.create('costCenters', updates);
                showToast('Cost Center created successfully', 'success');
              }
              c();
              const tc = document.querySelector('#settings-content');
              renderCostCentersTab(tc);
            } catch (err) {
              console.error('Error saving cost center:', err);
              showToast('Failed to save cost center: ' + err.message, 'error');
            }
          }}
        ]
      });
    }

  function renderSuppliersSettings(tc) {
    const settings = store.getSettings();
    const categories = settings.supplierCategories || ['Electrical', 'Plumbing', 'HVAC', 'Fire Safety', 'Security', 'General'];

    tc.innerHTML = `
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Supplier Categories</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:13px;margin-bottom:16px">Define classifications/categories for your suppliers (e.g. Electrical, Plumbing, HVAC). These categories are used to group suppliers in the Suppliers directory.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="supplier-categories-container">
              ${categories.map(c => `
                <div class="badge badge-neutral" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${escapeHTML(c)}
                  <span class="material-icons-outlined btn-remove-supplier-cat" data-name="${escapeHTML(c)}" style="font-size:14px;cursor:pointer">close</span>
                </div>
              `).join('')}
              <button class="btn btn-outline btn-sm" id="btn-add-supplier-category" style="border-style:dashed">
                <span class="material-icons-outlined" style="font-size:16px">add</span> New Category
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;justify-content:flex-end">
          <button class="btn btn-primary" id="btn-save-suppliers" data-tooltip="Save supplier categories settings" data-tooltip-pos="top">Save Supplier Settings</button>
        </div>
      </div>
    `;

    tc.querySelector('#btn-add-supplier-category').addEventListener('click', () => {
      const name = prompt('Enter supplier category name:');
      if (name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        const exists = Array.from(tc.querySelectorAll('.btn-remove-supplier-cat')).some(span => span.dataset.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
          showToast('Category already exists', 'error');
          return;
        }

        const btn = document.createElement('div');
        btn.className = 'badge badge-neutral';
        btn.style.cssText = 'padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px';
        btn.innerHTML = `
          ${escapeHTML(trimmed)}
          <span class="material-icons-outlined btn-remove-supplier-cat" data-name="${escapeHTML(trimmed)}" style="font-size:14px;cursor:pointer">close</span>
        `;
        tc.querySelector('#supplier-categories-container').insertBefore(btn, tc.querySelector('#btn-add-supplier-category'));
        btn.querySelector('.btn-remove-supplier-cat').addEventListener('click', () => btn.remove());
      }
    });

    tc.querySelectorAll('.btn-remove-supplier-cat').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.badge').remove());
    });

    tc.querySelector('#btn-save-suppliers').addEventListener('click', async () => {
      const btn = tc.querySelector('#btn-save-suppliers');
      const origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

      try {
        const supplierCategories = Array.from(tc.querySelectorAll('.btn-remove-supplier-cat')).map(span => span.dataset.name);
        const updatedSettings = {
          ...settings,
          supplierCategories
        };
        await store.saveSettings(updatedSettings);
        showToast('Supplier settings saved successfully', 'success');
      } catch (err) {
        console.error('Error saving supplier settings:', err);
        showToast('Failed to save supplier settings: ' + (err.message || err), 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    });
  }

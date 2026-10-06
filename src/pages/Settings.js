// ============================================
// RELAY DISPATCH — SETTINGS PAGE
// ============================================

import { store } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { showToast } from '../components/Notifications.js';
import { showModal } from '../components/Modal.js';
import { renderStorageOptions } from '../components/StorageOptions.js';
import { usageBarsHtml, refreshUsageBars } from '../components/UsageBars.js';
import { renderKitTypes } from '../components/KitTypes.js';
import { MODULE_PERMS } from '../utils/permissions.js';
import { escapeHTML } from '../utils/security.js';
import { showConfirm } from '../utils/confirmDialog.js';
import { router } from '../router.js';
import { seedMinimalData, seedData } from '../data/seed.js';
import { PLAN_CATALOG, getTier, getSubscription, subscriptionActive, subscriptionPastDue, isComplimentary, startCheckout, changePlan, openBillingPortal, refreshSubscription, reconcileSubscription } from '../utils/subscription.js';
import { connectInfo, connectReady, startConnectOnboarding, refreshConnectStatus, openConnectDashboard } from '../utils/payments.js';
import { addEmailDomain, getEmailDomain, verifyEmailDomain, getSenderInfo, emailSettings, sendEmail, emailBlockedReason } from '../utils/email.js';
import { EMAIL_TEMPLATES } from '../utils/emailTemplates.js';
import { storageGet, storageSet } from '../utils/persist.js';
import { resolveSettingsTab, SETTINGS_DEFAULT_TAB } from '../utils/settingsTabs.js';
import { attachAddressAutocomplete } from '../utils/placesAutocomplete.js';
import { renderLeadProfileSetup } from './leads/leadProfile.js';
import { hashPassword, verifyPassword } from './auth/password.js';
import { setSessionUser, clearSessionUser } from './auth/session.js';
import { backupCheckboxHtml, runBackupIfRequested } from '../utils/dataBackup.js';
import { openMigrationModal, showCloudUpgradePrompt, CLOUD_ONLY_SETTINGS_TABS, COMING_SOON_SETTINGS_TABS } from '../components/CloudUpgrade.js';

// Stripe Checkout and the billing portal run in the system browser, so the
// desktop app sits in the background while the user pays. The company row is
// cached at sign-in with no realtime updates, so the billing tab re-checks the
// moment the app gets focus back.
let billingFocusRefresh = null;
let billingFocusBound = false;
// Returning from a completed checkout repairs a missed Stripe webhook by asking
// the server to re-read the subscription from Stripe. Once per page load is
// enough — without this the focus listener would re-reconcile on every focus.
let billingRecoveryAttempted = false;

function registerBillingFocusRefresh(refresh) {
  billingFocusRefresh = refresh;
  if (billingFocusBound) return;
  billingFocusBound = true;
  window.addEventListener('focus', () => billingFocusRefresh && billingFocusRefresh());
}

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

// Build a permissions array with all granular keys
function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

// Collections that only hold data once a company starts entering real (or demo) work
const BUSINESS_COLLECTIONS = ['customers', 'quotes', 'jobs', 'invoices', 'assets', 'suppliers', 'contractors', 'purchaseOrders', 'formInstances', 'leads', 'schedule', 'stock', 'timesheets'];

function hasAnyBusinessData() {
  return BUSINESS_COLLECTIONS.some(col => (store.getAll(col) || []).length > 0);
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
        <span class="text-tertiary timeline-hint">Click & drag to highlight active hours</span>
      </label>
      
      <!-- Hour labels -->
      <div class="timeline-hour-labels">
        ${hours.map(h => `<span>${h}</span>`).join('')}
      </div>
      
      <!-- Grid -->
      <div class="timeline-grid" style="display:grid; 
        grid-template-columns:repeat(48, 1fr); 
        gap:3px; 
        background: rgba(0, 0, 0, 0.2); 
        padding:6px; 
        border-radius:8px; 
        border:1px solid var(--border-color);
        touch-action:none;">
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
  
  // Old ?tab= links (and the sub-tab each one opens) are resolved in one place so
  // the sidebar drills into the same settings group this page renders.
  const resolvedTab = resolveSettingsTab(tabParam);

  let activeTab = resolvedTab.tab || SETTINGS_DEFAULT_TAB;
  let templatesSubTab = resolvedTab.templatesSubTab;
  let usersSubTab = resolvedTab.usersSubTab;

  const isLocalMode = !store.companyId || store.companyId.startsWith('acct_');
  const settings = store.getSettings();

  // Cloud-only tabs open the upgrade nudge instead of silently landing on Company.
  // The tab list lives in CloudUpgrade.js, which the sidebar grey-out also reads.
  // Users, User Types & Permissions and Password Recovery all render under the
  // 'users' tab id, so the sub-tab is the more specific lookup for those.
  if (isLocalMode) {
    const gatedTab = CLOUD_ONLY_SETTINGS_TABS[activeTab === 'users' ? usersSubTab : activeTab];
    if (gatedTab) {
      activeTab = 'company';
      showCloudUpgradePrompt(gatedTab);
    }
  }
  // Unshipped tabs are greyed out in the sidebar for every account type, so a deep
  // link explains itself on Company instead of opening the unfinished page. The
  // renderers below stay in place for when the feature ships.
  if (COMING_SOON_SETTINGS_TABS[activeTab]) {
    showToast(`${COMING_SOON_SETTINGS_TABS[activeTab]} is coming soon.`, 'info');
    activeTab = 'company';
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  // Team management writes to other people's profiles; 039 only lets a company
  // admin through that policy, so a non-admin deep link lands on Company with an
  // explanation instead of a form that fails on save. Self-service name, colour
  // and photo editing lives on the Profile page.
  if (activeTab === 'users' && currentUser.role !== 'admin') {
    showToast('Team management is restricted to company administrators.', 'info');
    activeTab = 'company';
  }

  container.innerHTML = `
    <style>
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

    <div id="settings-content" style="padding-top:0;"></div>
  `;

  renderContent();

  function renderContent() {
    const tc = container.querySelector('#settings-content');

    if (activeTab === 'suppliers') {
      renderSuppliersSettings(tc);
      return;
    }

    if (activeTab === 'local_storage') {
      renderLocalStorageTab(tc, currentUser);
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

    if (activeTab === 'billing') {
      // currentUser + openMigrationModal are renderSettings locals; the module-
      // level renderBillingTab can't close over them, so pass them in.
      renderBillingTab(tc, currentUser, openMigrationModal);
      return;
    }

    if (activeTab === 'payments') {
      renderPaymentsTab(tc);
      return;
    }

    if (activeTab === 'email') {
      renderEmailTab(tc);
      return;
    }


    if (activeTab === 'cost_centers') {
      // Unreachable while cost_centers is in COMING_SOON_SETTINGS_TABS (the guard
      // above rewrites it to Company) — kept for when the Xero integration ships.
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
          <div class="card" style="max-width:100%">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: minmax(0,1fr) 300px; gap:var(--space-lg)">
                <div class="settings-stack">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${escapeHTML(s.name || 'Company Name')}" id="company-name" placeholder="Company Name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${escapeHTML(s.abn || '')}" placeholder="e.g. 51 234 567 890" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${escapeHTML(s.phone || '')}" placeholder="e.g. (02) 6882 4400" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Company Domain</label>
                      <input class="form-input" value="${escapeHTML(s.domain || '')}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Company Email</label>
                      <input class="form-input" value="${escapeHTML(s.email || '')}" id="company-email" placeholder="e.g. admin@yourcompany.com.au" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2" placeholder="e.g. 14 Yarrandale Rd, Dubbo NSW 2830">${escapeHTML(s.address || '')}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; gap:20px; align-items:center; text-align:center">
                  
                  <!-- Main Logo -->
                  <div style="display:flex; flex-direction:column; align-items:center; width:100%">
                    <label class="form-label" style="align-self:flex-start">Company Logo</label>
                    <div id="logo-preview-container" style="width:100%; height:75px; margin:8px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                      ${pendingLogo ? `<img src="${pendingLogo}" style="max-width:90%; max-height:90%; object-fit:contain" />` : `
                        <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
                          <span class="material-icons-outlined" style="font-size:24px">image</span>
                          <span style="margin-top:2px">No custom logo</span>
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

                  <div id="unsaved-logo-hint" style="display:none; margin-top:4px; color:var(--color-warning); font-weight:600">UNSAVED PREVIEW</div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary" id="btn-save-company" data-tooltip="Save company details permanently" data-tooltip-pos="top">
                <span class="material-icons-outlined">save</span> Save Company Changes
              </button>
            </div>
          </div>

          ${isLocalMode ? '' : `
          <div class="card" style="max-width:100%">
            <div class="card-header"><h4>Lead & Market Profile</h4></div>
            <div class="card-body">
              <div id="lead-profile-root"></div>
            </div>
          </div>`}
        `;

        // Company address autocomplete — same behaviour as customer/supplier
        // address fields; seeds the geocode cache so route/start-location maps
        // can use it without a separate lookup.
        attachAddressAutocomplete(tc.querySelector('#company-address'));

        // Handlers for Company Tab
        const logoInput = tc.querySelector('#logo-upload');
        
        tc.querySelector('#btn-upload-logo').addEventListener('click', () => logoInput.click());
        
        const removeLogoHandler = () => {
          pendingLogo = null;
          const container = tc.querySelector('#logo-preview-container');
          container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:24px">image</span>
              <span style="margin-top:2px">No custom logo</span>
            </div>
          `;
          tc.querySelector('#unsaved-logo-hint').style.display = 'block';
          tc.querySelector('#btn-remove-logo')?.remove();
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

        tc.querySelector('#btn-remove-logo')?.addEventListener('click', removeLogoHandler);



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
            // logoSmall is no longer user-supplied — any existing mark is kept as-is,
            // and the app falls back to the standard logo wherever it is absent.
            settings.logoSmall = pendingLogoSmall;
            
            await store.saveSettings(settings);
            showToast('Company information saved successfully to database', 'success');
            tc.querySelector('#unsaved-logo-hint').style.display = 'none';
            window.dispatchEvent(new CustomEvent('relay:settings-updated'));
            renderCompanyTabAll();
          } catch (err) {
            console.error('Error saving company profile settings:', err);
            showToast('Failed to save settings: ' + (err.message || err), 'error');
          } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
          }
        });
      };

      // The company tab is one details card plus the lead-profile card, so a full
      // redraw has to re-run both (the save handler refreshes through this too).
      // Local accounts get no lead-profile card — it only feeds the Cloud-only
      // leads marketplace — so there is nothing else to redraw for them.
      const renderCompanyTabAll = () => {
        renderCompanyTab();
        if (isLocalMode) return;
        renderLeadProfileSetup(tc.querySelector('#lead-profile-root')).catch((err) => {
          console.error('Error rendering lead profile setup:', err);
        });
      };

      renderCompanyTabAll();
    } else if (activeTab === 'users') {
      // Everyone under this tab acts on other people's logins: the team list,
      // the user types those logins are built from, and the reset-request
      // queue. 039 restricts the profiles write behind all of them to the
      // caller's own row unless they are an admin, so a technician gets the
      // same explanation renderLocalBackup gives instead of a form that fails
      // on save. Editing your own name, colour and photo lives on Profile.
      if (currentUser.role !== 'admin') {
        tc.innerHTML = '<p class="text-tertiary">Team management is restricted to company administrators.</p>';
        return;
      }
      renderUsersSettings(tc, openMigrationModal);
    } else if (activeTab === 'materials') {
      renderMaterialsSettings(tc);
    } else if (activeTab === 'storage_options') {
      renderStorageOptionsTab(tc);
    } else if (activeTab === 'tax') {
      const settings = store.getSettings();
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
                <p class="text-tertiary" style="margin-top:8px">Standardizes billing and ensures technicians are paid consistently for small increments.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:var(--space-lg)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h4 style="margin:0">Labour Rate Profiles</h4>
              <p class="text-secondary" style="margin:4px 0 0">Define charge-out rates for different job types or time periods. These appear as selectable options when adding labour to a quote or job.</p>
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
                <div class="labor-rate-card${rate.isDefault ? ' is-default' : ''}" data-id="${rate.id}">
                  <!-- Card Header -->
                  <div class="rate-card-head">
                    <div class="rate-card-title">
                      <span class="material-icons-outlined">sell</span>
                      <input class="rate-name" value="${escapeHTML(rate.name)}" placeholder="Rate Profile Name" />
                      ${rate.isDefault ? '<span class="badge rate-default-badge">DEFAULT</span>' : ''}
                    </div>
                    <div class="rate-card-actions">
                      ${!rate.isDefault ? `<button class="btn btn-ghost btn-sm btn-set-default" data-id="${rate.id}" title="Set as default rate">Set Default</button>` : ''}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${rate.id}" title="Delete profile" ${rate.isDefault ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
                        <span class="material-icons-outlined" style="font-size:18px;pointer-events:none">delete</span>
                      </button>
                    </div>
                  </div>
                  <!-- Card Body -->
                  <div class="rate-card-body">
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
                            <span class="rate-day-pill${active ? ' is-active' : ''}" data-day="${day}">
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
          // The pill lives inside a <label> wrapping the hidden checkbox, so the browser
          // would also toggle the checkbox here. Suppress that and own the toggle below,
          // otherwise the pill state and the saved checkbox state drift apart.
          e.preventDefault();
          const day = pill.dataset.day;
          const card = pill.closest('.labor-rate-card');
          const chk = card.querySelector(`.rate-day[data-day="${day}"]`);
          chk.checked = !chk.checked;
          const active = chk.checked;
          pill.classList.toggle('is-active', active);
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
        div.innerHTML = `
          <div class="rate-card-head">
            <div class="rate-card-title">
              <span class="material-icons-outlined">sell</span>
              <input class="rate-name" value="New Rate Profile" />
            </div>
            <div class="rate-card-actions">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${id}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
            </div>
          </div>
          <div class="rate-card-body">
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
                    <span class="rate-day-pill${['Mon','Tue','Wed','Thu','Fri'].includes(day) ? ' is-active' : ''}" data-day="${day}">
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
          
          // Flip the default flag in the UI only — nothing is persisted until the user
          // clicks Save, so unsaved field edits elsewhere on the tab survive.
          tc.querySelectorAll('.labor-rate-card').forEach(card => {
            const isTarget = card.dataset.id === targetId;
            card.classList.toggle('is-default', isTarget);
            
            // Toggle badge
            let badge = card.querySelector('.badge');
            if (isTarget && !badge) {
               const nameContainer = card.querySelector('.rate-card-title');
               const b = document.createElement('span');
               b.className = 'badge rate-default-badge';
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
               const actions = card.querySelector('.rate-card-actions');
               const b = document.createElement('button');
               b.className = 'btn btn-ghost btn-sm btn-set-default';
               b.dataset.id = card.dataset.id;
               b.textContent = 'Set Default';
               actions.prepend(b);
            }
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
        <div class="card" style="max-width:100%">
          <div class="card-header"><h4>Customer Portal Settings</h4></div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group" style="display:flex; align-items:center; gap:12px; background:var(--content-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color)">
              <input type="checkbox" id="portal-enable" class="form-checkbox" style="width:20px; height:20px; cursor:pointer;" ${portalEnabled ? 'checked' : ''} />
              <div style="cursor:pointer;" data-click-el="portal-enable">
                <strong style="display:block; color:var(--text-primary);">Enable Customer Portal Link Access</strong>
                <span style="color:var(--text-secondary);">When disabled, any attempt to visit a customer portal link will show an access restricted notice.</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:var(--space-lg); align-items:start;">
              <div class="form-group">
                <label class="form-label" style="font-weight:600;">Custom Portal Welcome Message</label>
                <textarea class="form-textarea" id="portal-welcome" rows="3" placeholder="Enter a custom message displayed to customers on their dashboard...">${escapeHTML(portalWelcome)}</textarea>
                <p class="text-tertiary" style="margin-top:4px;">This message will appear prominently at the top of the customer's portal dashboard.</p>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:600;">Invoice Payment Instructions</label>
                <textarea class="form-textarea" id="portal-payment" rows="3" placeholder="BSB, Account Number, and payment instructions...">${escapeHTML(portalPayment)}</textarea>
                <p class="text-tertiary" style="margin-top:4px;">These bank details and instructions will be shown to customers when reviewing outstanding invoices in their portal.</p>
              </div>
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
        <div class="card" style="max-width:100%">
          <div class="card-header"><h4>Contractor Portal Settings</h4></div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-group" style="display:flex; align-items:center; gap:12px; background:var(--content-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color)">
              <input type="checkbox" id="contractor-portal-enable" class="form-checkbox" style="width:20px; height:20px; cursor:pointer;" ${portalEnabled ? 'checked' : ''} />
              <div style="cursor:pointer;" data-click-el="contractor-portal-enable">
                <strong style="display:block; color:var(--text-primary);">Enable Contractor Portal Link Access</strong>
                <span style="color:var(--text-secondary);">When disabled, any subcontractor attempting to load their portal token will see an access deactivated notice.</span>
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

      tc.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:var(--space-lg); max-width:100%; align-items:start;">
          <!-- Left Column -->
          <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
            <!-- Data Management -->
            <div class="card">
              <div class="card-header"><h4>Data Management</h4></div>
              <div class="card-body">
                <p class="text-secondary" style="margin-bottom:var(--space-lg)">
                  ${isLocalMode ? 'Manage your application data. All data is stored locally in your browser.' : 'Manage database records for your cloud company account.'}
                </p>
                ${currentUser.role === 'admin' ? `
                  <button class="btn btn-secondary" id="btn-export-snapshot" style="width:100%; justify-content:center; border:1px solid var(--border-color)">
                    <span class="material-icons-outlined">download</span> Download a Copy of My Data
                  </button>

                  ${!hasAnyBusinessData() ? `
                    <div style="margin-top:var(--space-md); padding-top:var(--space-md); border-top:1px solid var(--border-color)">
                      <p style="color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">
                        This database is empty, so you can load a complete demonstration dataset — customers with quotes, jobs, assets, materials and timesheets — to walk through RELAY before entering real work.
                      </p>
                      <button class="btn btn-secondary" id="btn-seed-minimal" style="width:100%; justify-content:center; border:1px solid var(--border-color)">
                        <span class="material-icons-outlined">science</span> Seed Demonstration Data
                      </button>
                    </div>
                  ` : `
                    <p class="text-tertiary" style="margin-top:var(--space-md); line-height:1.4;">
                      Demonstration data can only be loaded into an empty database. Restore to a blank state below if you want to run a walkthrough.
                    </p>
                  `}
                ` : '<div style="color:var(--text-tertiary)">Data management is restricted to company administrators.</div>'}
              </div>
            </div>

            ${currentUser.role === 'admin' ? `
              <!-- Danger Zone -->
              <div class="card" style="border:1px solid rgba(220, 38, 38, 0.28)">
                <div class="card-header">
                  <h4 style="color:var(--color-danger); display:flex; align-items:center; gap:6px;">
                    <span class="material-icons-outlined">report_gmailerrorred</span> Danger Zone
                  </h4>
                </div>
                <div class="card-body">
                  <p style="color:var(--text-secondary); margin-bottom:var(--space-md); line-height:1.4;">
                    These actions replace or delete everything in this database and cannot be undone. Each one asks you to type a confirmation, and offers to download a copy of your data first.
                  </p>
                  <button class="btn btn-danger" id="btn-restore-new" style="width:100%; justify-content:center; margin-bottom:12px;">
                    <span class="material-icons-outlined">cleaning_services</span> Restore to New (Blank State)
                  </button>
                  <button class="btn btn-danger" id="btn-delete-company" style="width:100%; justify-content:center; background:var(--color-danger); border-color:var(--color-danger); color:#fff;">
                    <span class="material-icons-outlined">delete_forever</span> Delete Company Profile
                  </button>
                </div>
              </div>
            ` : ''}

            ${isLocalMode && currentUser.role === 'admin' ? `
              <!-- Deployment Profile -->
              <div class="card">
                <div class="card-header"><h4>Deployment Profile</h4></div>
                <div class="card-body">
                  <p style="color:var(--text-secondary); margin-bottom:var(--space-md); line-height:1.4;">
                    This profile keeps all of its data on this device, and only one person signs in to it. The upgrade below changes that permanently — RELAY downloads a copy of your data before it starts and shows you a summary when it is done.
                  </p>
                  <button class="btn btn-secondary" id="btn-convert-cloud-action" style="width:100%; justify-content:center; border:1px solid var(--border-color)">
                    <span class="material-icons-outlined">cloud_upload</span>
                    <span style="display:flex; flex-direction:column; align-items:flex-start; gap:2px; text-align:left;">
                      <span style="font-weight:600;">Move to cloud</span>
                      <span style="color:var(--text-tertiary); font-weight:400;">Sign in from any device with RELAY Cloud</span>
                    </span>
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <p class="text-tertiary" style="margin-top:var(--space-md);">
          RELAY runs in light mode on every device. Dark mode is coming in a later release.
        </p>
      `;

      tc.querySelector('#btn-export-snapshot')?.addEventListener('click', () => {
        try {
          const fileName = downloadDataSnapshot('relay-data-copy');
          showToast(`Saved ${fileName} to your downloads.`, 'success');
        } catch (err) {
          console.error('Snapshot download failed:', err);
          showToast('Could not create the data copy.', 'error');
        }
      });

      tc.querySelector('#btn-seed-minimal')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content.innerHTML = `
          <p style="margin-bottom:12px">You are about to load a complete demonstration dataset.</p>
          <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; margin-bottom:16px; border-radius:4px; color:var(--color-info); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined">info</span>
            <span>A realistic trade business to walk through: 5 customers with quotes, jobs, assets and materials, plus users, timesheets and stock.</span>
          </div>
          <p style="color:var(--text-secondary)">Loading it also sets your company profile to the demonstration company "Apex Power Services", so download a copy of your data first if you have entered company details.</p>
        `;

        showModal({
          title: "Load Demonstration Data",
          content: content,
          actions: [
            {
              label: "Cancel",
              className: "btn-secondary",
              onClick: (close) => close()
            },
            {
              label: "Load Demo Data",
              className: "btn-primary",
              onClick: async (close) => {
                close();
                showToast('Loading demonstration data...', 'info');
                try {
                  await seedMinimalData();
                  showToast('Demonstration data loaded. Reloading...', 'success');
                  setTimeout(() => window.location.reload(), 1200);
                } catch (err) {
                  console.error('Seeding failed:', err);
                  showToast('Could not load the demonstration data.', 'error');
                }
              }
            }
          ]
        });
      });

      tc.querySelector('#btn-restore-new')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content.innerHTML = `
          <form id="restore-blank-form" style="display:flex; flex-direction:column; gap:12px;">
            <p style="margin:0; font-weight:600; color:var(--color-danger)">This replaces everything in your database with a clean slate.</p>
            <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; color:var(--color-danger); display:flex; gap:8px;">
              <span class="material-icons-outlined" style="font-size:20px">warning</span>
              <span><strong>What gets wiped:</strong> customers, jobs, tasks, quotes, invoices, purchase orders, suppliers, contractors, assets, schedule blocks, forms and documents. Your user types and login credentials stay so you can sign back in.</span>
            </div>
            ${backupCheckboxHtml('relay-backup-before-restore')}
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-weight:600;">Type RESTORE to confirm</label>
              <input class="form-input" id="restore-confirm-input" autocomplete="off" placeholder="RESTORE" />
            </div>
            <div id="restore-error" style="display:none; color:var(--color-danger); background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 14px; border-radius:4px; font-weight:500; align-items:center; gap:8px;">
              <span class="material-icons-outlined" style="font-size:18px;">error_outline</span>
              <span id="restore-error-text"></span>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:4px;">
              <button type="button" class="btn btn-secondary" id="btn-restore-abort">Cancel</button>
              <button type="submit" class="btn btn-danger" id="btn-restore-submit" style="display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined">cleaning_services</span>
                <span>Wipe and Start Fresh</span>
              </button>
            </div>
          </form>
        `;

        const { close } = showModal({
          title: "Restore to New (Blank State)",
          content: content,
          size: "modal-md"
        });

        const errorEl = content.querySelector('#restore-error');
        const errorTextEl = content.querySelector('#restore-error-text');
        const submitBtn = content.querySelector('#btn-restore-submit');
        const submitLabel = submitBtn.innerHTML;

        content.querySelector('#btn-restore-abort').addEventListener('click', close);

        content.querySelector('#restore-blank-form').addEventListener('submit', async (ev) => {
          ev.preventDefault();
          errorEl.style.display = 'none';

          const typed = content.querySelector('#restore-confirm-input').value.trim();
          if (typed !== 'RESTORE') {
            errorTextEl.textContent = 'Type RESTORE exactly, in capitals, to confirm.';
            errorEl.style.display = 'flex';
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Wiping...';

          try {
            const backupFile = runBackupIfRequested(content, 'relay-backup-before-restore');
            if (backupFile) showToast(`Saved ${backupFile} to your downloads.`, 'info');

            await store.clearAll();
            store.markSeeded();
            clearSessionUser();

            showToast('Database cleared. Reloading...', 'success');
            close();

            setTimeout(() => {
              window.location.hash = '#/login';
              window.location.reload();
            }, 1200);
          } catch (err) {
            console.error('Restore to blank state failed:', err);
            errorTextEl.textContent = err.message || 'Could not complete the restore.';
            errorEl.style.display = 'flex';
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitLabel;
          }
        });
      });
      tc.querySelector('#btn-delete-company')?.addEventListener('click', () => {
        // Modal Warning 1 of 2
        const content1 = document.createElement('div');
        content1.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content1.innerHTML = `
          <p style="margin-bottom:12px; font-weight:600; color:var(--color-danger)">WARNING: CRITICAL DESTRUCTIVE ACTION (1 of 2)</p>
          <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; margin-bottom:16px; border-radius:4px; color:var(--color-danger); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size:24px">warning</span>
            <span>You are about to permanently delete the entire company profile for <strong>${escapeHTML(store.getSettings().name || '')}</strong> and all associated database records (jobs, quotes, invoices, people, assets, forms, etc.).</span>
          </div>
          <p style="color:var(--text-secondary); margin-bottom:12px">
            This action is final, irreversible, and cannot be undone under any circumstances.
          </p>
          <p style="color:var(--text-secondary)">Do you want to proceed to name and password confirmation?</p>
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
                const companyName = store.getSettings().name || '';
                content2.innerHTML = `
                  <form id="delete-company-confirm-form" style="display:flex; flex-direction:column; gap:16px;">
                    <p style="margin-bottom:8px; font-weight:600; color:var(--color-danger)">FINAL CONFIRMATION (2 of 2)</p>
                    <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; color:var(--color-danger); font-weight:500; display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:24px">gavel</span>
                      <span>To authorize the permanent destruction of <strong>${escapeHTML(companyName)}</strong>, type the company name and enter the Administrator password.</span>
                    </div>

                    <div class="form-group" style="margin-top:12px;">
                      <label class="form-label" style="font-weight:600;">Type the company name to confirm</label>
                      <input class="form-input" id="delete-confirm-name" required autocomplete="off" placeholder="${escapeHTML(companyName)}" />
                    </div>

                    <div class="form-group">
                      <label class="form-label" style="font-weight:600;">Administrator Password</label>
                      <input class="form-input" type="password" id="delete-confirm-password" required placeholder="Enter admin password to proceed" />
                    </div>

                    ${backupCheckboxHtml('relay-backup-before-company-delete')}

                    <div id="delete-confirm-error" style="display:none; color:var(--color-danger); background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 14px; border-radius:4px; font-weight:500; align-items:center; gap:8px;">
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
                  const typedName = content2.querySelector('#delete-confirm-name').value.trim();

                  errorEl.style.display = 'none';

                  if (typedName !== companyName) {
                    errorTextEl.textContent = 'The company name does not match. Type it exactly as shown to confirm.';
                    errorEl.style.display = 'flex';
                    return;
                  }
                  submitBtn.disabled = true;
                  abortBtn.disabled = true;
                  const origSubmitText = submitBtn.innerHTML;
                  submitBtn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Deleting...';

                  try {
                    let passwordVerified = false;

                    if (isLocalMode) {
                      // A local profile has one owner password, stored on the
                      // launcher account rather than on a staff record.
                      const activeAccountId = sessionStorage.getItem('relay_active_account');
                      const storedAccounts = await storageGet('relay_accounts') || [];
                      const acct = storedAccounts.find(a => a.id === activeAccountId);
                      if (acct && acct.hasPassword) {
                        if ((await verifyPassword(acct.passwordHash, passwordInput)).ok) {
                          passwordVerified = true;
                        } else {
                          throw new Error('Incorrect administrator password.');
                        }
                      } else {
                        // No password set
                        passwordVerified = true;
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
                      const backupFile = runBackupIfRequested(content2, 'relay-backup-before-company-delete');
                      if (backupFile) showToast(`Saved ${backupFile} to your downloads.`, 'info');

                      // 1. If cloud mode, delete tenant data and its Auth users
                      if (!isLocalMode) {
                        const { supabase } = await import('../utils/supabase.js');
                        const { error: deleteErr } = await supabase.functions.invoke('delete-company', {
                          body: {}
                        });
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
                      clearSessionUser();
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

      tc.querySelector('#btn-convert-cloud-action')?.addEventListener('click', () => {
        openMigrationModal();
      });

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
          <input class="form-input" id="ut-name" value="${escapeHTML(ut.name)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${escapeHTML(ut.description)}" />
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
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${module}" data-key="${key}" ${existing[key] ? 'checked' : ''}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${label}</span>
        </label>
      `).join('');
      return `
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600">${module}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--text-secondary)">
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
        <input class="form-input" id="u-name" value="${escapeHTML(t.name)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Username</label>
        <input class="form-input" id="u-username" value="${escapeHTML(t.username || (t.email ? t.email.split('@')[0] : ''))}" ${editId ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''} placeholder="e.g. joshua" />
        ${!editId ? `
        <div style="color: var(--text-tertiary); margin-top: 4px; font-weight: 500;">
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
          <input class="form-input" id="u-role" value="${escapeHTML(t.role)}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type" ${(t.userTypeId === 'ut_admin' || (t.userTypeId && t.userTypeId.endsWith('_ut_admin'))) ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
            <option value="">-- Select --</option>
            ${userTypes
              .filter(ut => (!ut.id.endsWith('_ut_admin') && ut.id !== 'ut_admin') || t.userTypeId === ut.id)
              .map(ut => `
                <option value="${ut.id}" ${t.userTypeId === ut.id ? 'selected' : ''}>${escapeHTML(ut.name)}</option>
              `).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary)">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${t.payRate || ''}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary">/hr — used in job cost &amp; P&amp;L calculations</span>
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
            <input type="color" id="u-color" value="${escapeHTML(t.color)}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
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
          // profiles.name is rendered across the tenant, so 038 rejects
          // markup and quotes at the database. Catching it here reports the
          // field instead of surfacing a raw 23514 from the write below.
          if (/[<>"]/.test(name)) { showToast('Name cannot contain <, > or ".', 'error'); return; }
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
              // Cloud accounts hand the raw password to Supabase Auth (the
              // invite-user function hashes it server-side); local accounts
              // store the hash themselves, like every other local password.
              updates.password = isLocalAccount() ? await hashPassword(password) : password;
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
                      ${(t.tags || []).map(tag => `<span class="badge badge-neutral">${escapeHTML(tag)}</span>`).join('')}
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
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Delete this template?', { title: 'Delete Template', confirmLabel: 'Delete', danger: true });
        if (confirmed) {
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
                    ${viewList.length === 0 ? '<div style="color:var(--text-tertiary);text-align:center;padding:12px">No items. Click + to add.</div>' : ''}
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
                    <label class="form-label">Name *</label>
                    <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${escapeHTML(node.name)}" />
                  </div>
                  ${hasSubs ? `
                    <div style="margin-bottom:12px">
                      <div style="color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                      <div style="font-weight:500">${calculateTotalHours(node)} hrs</div>
                    </div>
                  ` : `
                    <div class="form-row" style="margin-bottom:12px; gap:8px">
                      <div class="form-group">
                        <label class="form-label">Est. Hours</label>
                        <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${node.estimatedHours || ''}" min="0" step="0.25" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">People</label>
                        <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${node.people || '1'}" min="1" step="1" />
                      </div>
                    </div>
                  `}
                  <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label">Description</label>
                    <textarea class="form-input tmpl-detail-input" data-field="description" rows="3">${escapeHTML(node.description || '')}</textarea>
                  </div>
                  ${!hasSubs ? `
                  <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:16px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                      <div style="display:flex; align-items:center; gap:6px">
                        <span class="material-icons-outlined" style="font-size:18px; color:var(--color-primary)">assignment</span>
                        <span style="font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.3px">Value Fields</span>
                      </div>
                      <button class="btn btn-sm btn-secondary btn-add-value-field-tmpl" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Field</button>
                    </div>
                    <div style="color:var(--text-tertiary); margin-bottom:10px">Define the values a technician needs to record for this task (e.g. pressure readings, temperatures).</div>
                    <div style="display:flex; flex-direction:column; gap:8px" id="value-fields-config-tmpl">
                      ${(node.valueFields || []).map((vf, vi) => {
                        const ft = vf.fieldType || 'text';
                        return `
                        <div style="padding:10px 12px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px" data-vf-idx="${vi}">
                          <div style="display:flex; align-items:center; gap:8px; margin-bottom:${ft !== 'text' ? '8px' : '0'}">
                            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                            <input type="text" class="form-input vf-tmpl-label-input" data-vf-idx="${vi}" value="${escapeHTML(vf.label)}" placeholder="Field label (e.g. Oil Pressure)" style="flex:2; height:32px" />
                            <select class="form-input input-sm vf-tmpl-type-select" data-vf-idx="${vi}" style="flex:0 0 110px">
                              <option value="text"${ft === 'text' ? ' selected' : ''}>Text</option>
                              <option value="number"${ft === 'number' ? ' selected' : ''}>Number</option>
                              <option value="dropdown"${ft === 'dropdown' ? ' selected' : ''}>Dropdown</option>
                            </select>
                            <button class="btn btn-ghost btn-sm btn-icon btn-remove-value-field-tmpl" data-vf-idx="${vi}" style="color:var(--color-danger); min-width:28px; min-height:28px; padding:0"><span class="material-icons-outlined" style="font-size:16px">close</span></button>
                          </div>
                          ${ft === 'number' ? `
                          <div style="display:flex; align-items:center; gap:8px; margin-left:28px">
                            <input type="text" class="form-input vf-tmpl-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (e.g. PSI)" style="flex:1; height:30px" />
                            <div style="display:flex; align-items:center; gap:4px; flex:2">
                              <span style="color:var(--text-tertiary); white-space:nowrap">Range:</span>
                              <input type="number" class="form-input vf-tmpl-min-input" data-vf-idx="${vi}" value="${vf.min !== undefined ? vf.min : ''}" placeholder="Min" style="flex:1; height:30px" />
                              <span style="color:var(--text-tertiary)">–</span>
                              <input type="number" class="form-input vf-tmpl-max-input" data-vf-idx="${vi}" value="${vf.max !== undefined ? vf.max : ''}" placeholder="Max" style="flex:1; height:30px" />
                            </div>
                          </div>
                          ` : ''}
                          ${ft === 'text' ? `
                          <div style="display:flex; align-items:center; gap:8px; margin-left:28px; margin-top:4px">
                            <input type="text" class="form-input vf-tmpl-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (optional, e.g. PSI)" style="flex:1; height:30px" />
                          </div>
                          ` : ''}
                          ${ft === 'dropdown' ? `
                          <div style="margin-left:28px; display:flex; flex-direction:column; gap:6px">
                            <div>
                              <div style="color:var(--text-tertiary); margin-bottom:4px">Options (one per line)</div>
                              <textarea class="form-input vf-tmpl-options-input" data-vf-idx="${vi}" rows="3" placeholder="Low\nAs Expected\nHigh" style="line-height:1.5">${escapeHTML((vf.options || []).join('\n'))}</textarea>
                            </div>
                            <div>
                              <div style="color:var(--text-tertiary); margin-bottom:4px">Expected / Ideal Value <span style="font-weight:400">(flags others as out of range)</span></div>
                              <select class="form-input input-sm vf-tmpl-expected-select" data-vf-idx="${vi}">
                                <option value=""${!vf.expectedValue ? ' selected' : ''}>— No expected value —</option>
                                ${(vf.options || []).map(opt => `<option value="${escapeHTML(opt)}"${vf.expectedValue === opt ? ' selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
                              </select>
                            </div>
                          </div>
                          ` : ''}
                        </div>`;
                      }).join('')}
                      ${(!node.valueFields || node.valueFields.length === 0) ? '<div style="color:var(--text-tertiary); text-align:center; padding:16px; border:1px dashed var(--border-color); border-radius:6px">No value fields defined. Click "Add Field" to create one.</div>' : ''}
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
          btn.addEventListener('click', async (e) => {
            const path = btn.dataset.path.split('-').map(Number);
            const confirmed = await showConfirm('Are you sure you want to delete this item and all its sub-tasks?', { title: 'Delete Item', confirmLabel: 'Delete', danger: true });
            if (confirmed) {
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
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Delete this template?', { title: 'Delete Template', confirmLabel: 'Delete', danger: true });
        if (confirmed) {
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
      <!-- Cards never go narrower than 520px: the tier table below needs ~480px. -->
      <div style="max-width:100%; display:grid; grid-template-columns:repeat(auto-fit, minmax(520px, 1fr)); gap:24px; align-items:start;">
        <div class="card" style="margin-bottom:0">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${markup.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${markup.minMarkupAmount}" step="0.50" style="width:100px" />
                </div>
                <p class="text-tertiary" style="margin-top:4px">Ensures a base profit on even the smallest components.</p>
              </div>
            </div>

            <div style="margin-top:24px; padding-top:24px; border-top:1px solid var(--border-color)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <div>
                  <h5 style="margin:0">Tiered Pricing</h5>
                  <p class="text-secondary" style="margin:4px 0 0 0">Automatically adjust markup based on the unit cost of the item.</p>
                </div>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" id="mat-use-tiers" ${markup.useTiers ? 'checked' : ''} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${markup.useTiers ? '' : 'opacity:0.5;pointer-events:none'}">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:60px"></th>
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
                              <input type="number" class="form-input input-sm tier-upto" value="${t.upTo || ''}" placeholder="Infinity" style="width:100px" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" class="form-input input-sm tier-percent" value="${t.percent}" style="width:80px" />
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
            <p class="text-secondary" style="margin-bottom:16px">Group items for reporting and bulk adjustments.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="categories-container">
              ${categories.map(c => `
                <div class="badge badge-neutral" style="padding:8px 12px;display:flex;align-items:center;gap:8px">
                  ${escapeHTML(c)}
                  <span class="material-icons-outlined btn-remove-cat" data-name="${escapeHTML(c)}" style="font-size:14px;cursor:pointer">close</span>
                </div>
              `).join('')}
              <button class="btn btn-outline btn-sm" id="btn-add-category" style="border-style:dashed">
                <span class="material-icons-outlined" style="font-size:16px">add</span> New Category
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;justify-content:flex-end; grid-column:1/-1">
          <button class="btn btn-primary" id="btn-save-materials" data-tooltip="Save material markup rules and categories" data-tooltip-pos="top">Save Material Settings</button>
        </div>

        <div style="margin-top:40px; padding-top:24px; border-top:1px solid var(--border-color); grid-column:1/-1">
          <div id="kit-types-section"></div>
        </div>

      </div>
    `;

    renderKitTypes(tc.querySelector('#kit-types-section'));

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
              <input type="number" class="form-input input-sm tier-upto" value="" placeholder="Infinity" style="width:100px" />
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:4px">
            <input type="number" class="form-input input-sm tier-percent" value="20" style="width:80px" />
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
          ${escapeHTML(name)}
          <span class="material-icons-outlined btn-remove-cat" data-name="${escapeHTML(name)}" style="font-size:14px;cursor:pointer">close</span>
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

  // Stock-location registry (warehouses, vans, utes) — the name collides with file
  // storage, so the tab leads with what it actually manages and links to the
  // separate "Local Storage" tab.
  function renderStorageOptionsTab(tc) {
    tc.innerHTML = `
      <div style="max-width:900px">
        <p class="text-secondary" style="margin:0 0 var(--space-lg); line-height:1.6;">
          Where your stock physically sits — warehouses, vehicles and site containers. Looking for where the app
          keeps its own data files? That is the <a href="#/settings?tab=local_storage" style="color:var(--color-primary)">Local Storage</a> tab.
        </p>
        <div id="storage-options-section"></div>
      </div>
    `;
    renderStorageOptions(tc.querySelector('#storage-options-section'));
  }

  // A local profile is one person on one machine, so there is no team to manage
  // here — point at the cloud upgrade instead of an empty user list.
  function renderLocalTeamNotice(tc, openMigrationModal) {
    tc.innerHTML = `
      <div class="card">
        <div class="card-header"><h4>Team logins</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary); margin-bottom:var(--space-md); line-height:1.5;">
            This profile runs on this device, so it has a single owner sign-in and no staff logins to set up here. Team logins are available with RELAY Cloud, where everyone signs in with their own email address and permissions.
          </p>
          <button class="btn btn-primary" id="btn-local-team-upgrade" style="display:flex; align-items:center; justify-content:center; gap:8px;">
            <span class="material-icons-outlined">cloud_upload</span> Move to cloud
          </button>
        </div>
      </div>
    `;
    tc.querySelector('#btn-local-team-upgrade')?.addEventListener('click', () => openMigrationModal());
  }

  function renderUsersSettings(tc, openMigrationModal) {
    if (isLocalAccount()) {
      renderLocalTeamNotice(tc, openMigrationModal);
      return;
    }

    const techs = store.getAll('technicians');
    const pendingResets = store.getAll('passwordResetRequests') || [];
    const companySlug = store.getSettings().name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let userTypes = store.getAll('userTypes') || [];

    // Clean up any exact duplicate userTypes (e.g. legacy 'ut_office' alongside `${companyId}_ut_office`)
    const seenNames = new Set();
    const uniqueTypes = [];
    userTypes.forEach(ut => {
      const key = (ut.name || '').trim().toLowerCase();
      if (key && seenNames.has(key)) {
        store.delete('userTypes', ut.id);
      } else {
        if (key) seenNames.add(key);
        uniqueTypes.push(ut);
      }
    });
    userTypes = uniqueTypes;

    if (!userTypes || userTypes.length === 0) {
      store.seedDefaultUserTypes();
      userTypes = store.getAll('userTypes') || [];
    }

    if (usersSubTab === 'user_types') {
      renderUserTypesSubTab(tc, userTypes);
    } else if (usersSubTab === 'password_recovery') {
      renderPasswordRecoverySubTab(tc, techs, pendingResets);
    } else {
      renderUsersSubTab(tc, techs, companySlug, userTypes);
    }
  }

  function renderUsersSubTab(subcontent, techs, companySlug, userTypes) {
    subcontent.innerHTML = `
      <div style="background:rgba(59, 130, 246, 0.1); border-left:4px solid #3b82f6; padding:12px 16px; margin-bottom:var(--space-md); border-radius:4px; color:#f8fafc; display:flex; justify-content:space-between; align-items:center;">
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
              <tr>
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
                const avatarCell = t.avatarUrl
                  ? `<img src="${escapeHTML(t.avatarUrl)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; display:block;" />`
                  : `<div style="width:32px; height:32px; border-radius:50%; background:${escapeHTML(t.color)}; align-items:center; justify-content:center; display:flex; color:#fff; font-weight:600;">${escapeHTML((t.name || 'U').trim().charAt(0).toUpperCase())}</div>`;
                return `
                  <tr>
                    <td>${avatarCell}</td>
                    <td class="font-medium">${escapeHTML(t.name)}</td>
                    <td class="text-secondary">${escapeHTML(t.role)}</td>
                    <td><span class="badge ${ut?.id === 'ut_admin' ? 'badge-primary' : 'badge-neutral'}">${escapeHTML(ut?.name || 'Unassigned')}</span></td>
                    <td class="text-tertiary">${escapeHTML(t.username || (t.email ? t.email.split('@')[0] : '') || '-')}</td>
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
                    <td style="opacity:0.6; font-weight:500">${escapeHTML(t.name)}</td>
                    <td style="opacity:0.6">${escapeHTML(t.role)}</td>
                    <td class="text-tertiary">${deactivatedAt.toLocaleDateString()}</td>
                    <td>
                      ${canReactivate 
                        ? '<span class="badge badge-success">Cooldown Complete</span>' 
                        : `<span class="badge badge-warning" style="background:var(--color-warning-bg); color:var(--color-warning); border:1px solid var(--color-warning-bg)">Available in ${remaining} days</span>`}
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

    subcontent.querySelector('#btn-add-user').addEventListener('click', () => {
      openUserModal();
    });
    subcontent.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', (e) => openUserModal(e.currentTarget.dataset.id));
    });
    subcontent.querySelectorAll('.btn-deactivate-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const t = store.getById('technicians', id);
        if (!t) return;
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<p>Are you sure you want to deactivate <strong>${escapeHTML(t.name)}</strong>? They will no longer be able to log in.</p>`;
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

    subcontent.querySelectorAll('.btn-reactivate-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const t = store.getById('technicians', id);
        if (!t) return;

        const deactivatedAt = new Date(t.deactivatedAt);
        const diffDays = Math.ceil((new Date() - deactivatedAt) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          showToast(`License Policy: Seat cooldown in progress (${30 - diffDays} days remaining)`, 'error');
          return;
        }

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<p>Reactivate <strong>${escapeHTML(t.name)}</strong>? They will regain access once a User Type is assigned.</p>`;
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
  }

  function renderUserTypesSubTab(subcontent, userTypes) {
    if (isLocalMode) {
      subcontent.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined">admin_panel_settings</span>
          <h3>User Types & Permissions</h3>
          <p class="text-secondary">Custom user types are available on cloud accounts.</p>
        </div>
      `;
      return;
    }

    subcontent.innerHTML = `
      <div class="card">
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
                  <td class="font-medium">${escapeHTML(ut.name)}</td>
                  <td class="text-secondary">${escapeHTML(ut.description)}</td>
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
    `;

    subcontent.querySelector('#btn-add-usertype')?.addEventListener('click', () => {
       openUserTypeModal();
    });

    subcontent.querySelectorAll('.btn-edit-perms').forEach(btn => {
      btn.addEventListener('click', () => {
        openPermissionsModal(btn.dataset.id);
      });
    });

    subcontent.querySelectorAll('.btn-edit-usertype').forEach(btn => {
      btn.addEventListener('click', () => {
        openUserTypeModal(btn.dataset.id);
      });
    });

    subcontent.querySelectorAll('.btn-delete-usertype').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const ut = store.getById('userTypes', id);
        if (!ut) return;
        if (ut.name.toLowerCase().includes('admin')) {
          showToast('Cannot delete the Admin user type — at least one Admin must always exist.', 'error');
          return;
        }
        const usersWithType = store.getAll('technicians').filter(t => t.userTypeId === id);
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<p>Are you sure you want to delete the user type <strong>${escapeHTML(ut.name)}</strong>?${usersWithType.length > 0 ? ` <strong>${usersWithType.length} user(s)</strong> will become unassigned.` : ''} This cannot be undone.</p>`;
        showModal({
          title: 'Confirm Deletion',
          content: contentDiv,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (c) => c() },
            { label: 'Delete', className: 'btn-danger', onClick: async (c) => {
              await store.delete('userTypes', id);
              showToast('User Type deleted', 'success');
              c();
              renderContent();
            }}
          ]
        });
      });
    });
  }

  function renderPasswordRecoverySubTab(subcontent, techs, pendingResets) {
    subcontent.innerHTML = `
      <div class="card">
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
                    <td class="font-medium">${escapeHTML(tech.name || 'Unknown')}</td>
                    <td class="text-secondary">${escapeHTML(r.employee_id || tech.username || '')}</td>
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
    `;

    subcontent.querySelectorAll('.btn-approve-reset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const techId = e.currentTarget.dataset.techId;
        const t = store.getById('technicians', techId);
        if (!t) return;
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
          <p>Approve password reset request for <strong>${escapeHTML(t.name)}</strong>? Please enter their new password below:</p>
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

              store.update('technicians', techId, { password: newPwd });
              store.update('passwordResetRequests', id, { status: 'approved', updated_at: new Date().toISOString() });

              showToast(`Password updated for ${t.name}`, 'success');
              c();
              renderContent();
            }}
          ]
        });
      });
    });

    subcontent.querySelectorAll('.btn-deny-reset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        store.update('passwordResetRequests', id, { status: 'denied', updated_at: new Date().toISOString() });
        showToast('Password reset request denied', 'info');
        renderContent();
      });
    });
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
          <div style="padding:16px; color:var(--text-tertiary); border-bottom:1px solid var(--border-color)">
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
                  <td style="color:var(--text-secondary)">${escapeHTML(t.description || '—')}</td>
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
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.', { title: 'Delete Form Template', confirmLabel: 'Delete', danger: true });
        if (confirmed) {
          const id = btn.dataset.id;
          const filtered = store.getAll('formTemplates').filter(t => t.id !== id);
          store.save('formTemplates', filtered);
          renderFormsTab(tc);
        }
      });
    });
  }

  function renderBillingTab(tc, currentUser, openMigrationModal) {
    const isCloud = !!(store.companyId && !String(store.companyId).startsWith('acct_'));
    const isAdmin = (currentUser?.role === 'admin');

    // Post-checkout / portal return flag. Stripe returns to #/settings?billing=…;
    // the billing portal comes back on the query string instead.
    const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
    const billingResult = params.get('billing');

    // The company row is cached at sign-in with no realtime updates, so a change
    // made in the Stripe portal (or a webhook that just landed) won't show until
    // we refetch. Pull the latest and re-render once if anything actually moved.
    if (isCloud) {
      const refreshBillingTab = () => {
        if (!tc.isConnected) return;
        const before = JSON.stringify(getSubscription());
        refreshSubscription()
          .then(() => {
            // Back from a completed checkout, but still not active? The row is
            // normally written by the Stripe webhook, so a missed delivery would
            // leave this tab saying "being activated" forever. Ask the server to
            // re-read the subscription from Stripe itself, once per page load.
            if (billingResult !== 'success' || subscriptionActive() || billingRecoveryAttempted) return null;
            billingRecoveryAttempted = true;
            return reconcileSubscription()
              .catch((err) => console.warn('Could not reconcile the subscription from Stripe:', err))
              .then(() => refreshSubscription());
          })
          .then(() => {
            if (!tc.isConnected) return;
            if (JSON.stringify(getSubscription()) !== before) {
              renderBillingTab(tc, currentUser, openMigrationModal);
            }
          });
      };
      refreshBillingTab();
      registerBillingFocusRefresh(refreshBillingTab);
    }
    const tier = getTier();                      // 'free' | 'cloud' | 'cloud_plus'
    const sub = getSubscription();               // { tier, status, seats, currentPeriodEnd, hasCustomer }
    const active = subscriptionActive();
    const pastDue = subscriptionPastDue();
    const comp = isComplimentary();   // free "power user" grant, set via Supabase

    // Live seat estimate = active (non-deactivated) users on this account.
    const techs = store.getAll('technicians') || [];
    const activeSeats = techs.filter(t => !t.deactivated).length || 1;

    const statusLabel = comp
      ? 'Complimentary — no charge'
      : ({
          active: 'Active', trialing: 'Trial', past_due: 'Payment overdue',
          canceled: 'Cancelled', incomplete: 'Setup incomplete', unpaid: 'Unpaid',
        }[String(sub.status || '')] || (isCloud ? 'No plan selected' : 'Offline (Free)'));

    const renew = sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString()
      : null;

    // Post-checkout / portal return banner.
    let banner = '';
    if (billingResult === 'success') {
      banner = `<div style="background:var(--color-info-bg);border-left:4px solid var(--color-info);padding:12px 16px;border-radius:6px;margin-bottom:16px;color:var(--color-info);display:flex;gap:8px;align-items:center;">
        <span class="material-icons-outlined">check_circle</span>
        <span>Thanks! Your subscription is being activated — it can take a moment to confirm. Refresh if the plan below hasn't updated yet.</span></div>`;
    } else if (billingResult === 'cancelled') {
      banner = `<div style="background:var(--color-warning-bg,#fff7ed);border-left:4px solid var(--color-warning);padding:12px 16px;border-radius:6px;margin-bottom:16px;color:var(--color-warning);display:flex;gap:8px;align-items:center;">
        <span class="material-icons-outlined">info</span><span>Checkout cancelled — no changes were made.</span></div>`;
    }
    if (pastDue) {
      banner += `<div style="background:var(--color-danger-bg);border-left:4px solid var(--color-danger);padding:12px 16px;border-radius:6px;margin-bottom:16px;color:var(--color-danger);display:flex;gap:8px;align-items:center;">
        <span class="material-icons-outlined">error_outline</span>
        <span>Your last payment failed. Update your card in "Manage billing" to keep your team's cloud access.</span></div>`;
    }

    // One plan card. `state` ∈ current | upgrade | downgrade | switch | locked.
    const planCard = (plan) => {
      const isCurrent = (plan.id === tier) && (plan.id === 'free' ? !isCloud : active);
      const priceLine = plan.price === 0
        ? `<div style="font-weight:700;">Free</div>`
        : `<div style="font-weight:700;">$${plan.price}<span style="font-weight:500;color:var(--text-tertiary);"> /user /mo</span></div>`;

      let action = '';
      if (comp && isCloud && plan.id !== 'free') {
        // Complimentary account: no self-serve billing actions.
        action = isCurrent
          ? `<button class="btn btn-secondary" disabled style="width:100%;justify-content:center;">Current plan · complimentary</button>`
          : `<div style="color:var(--text-tertiary);text-align:center;">Complimentary access is managed by RELAY.</div>`;
      } else if (isCurrent) {
        action = `<button class="btn btn-secondary" disabled style="width:100%;justify-content:center;">Current plan</button>`;
      } else if (plan.id === 'free') {
        action = `<div style="color:var(--text-tertiary);text-align:center;">Runs offline on-device. No account.</div>`;
      } else if (!isCloud) {
        // Local account: must migrate to cloud before subscribing.
        action = `<button class="btn btn-primary" data-migrate="1" ${isAdmin ? '' : 'disabled'} style="width:100%;justify-content:center;">Move to Cloud &amp; subscribe</button>`;
      } else {
        const verb = !active ? 'Choose'
          : (plan.id === 'cloud_plus' && tier === 'cloud') ? 'Upgrade to'
          : 'Switch to';
        action = `<button class="btn btn-primary" data-choose="${plan.id}" ${isAdmin ? '' : 'disabled'} style="width:100%;justify-content:center;">${verb} ${plan.name}</button>`;
      }

      return `
        <div class="card" style="max-width:100%;${isCurrent ? 'border:2px solid var(--color-accent,#FF5C00);' : ''}">
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:baseline;justify-content:space-between;">
              <h4 style="margin:0;">${plan.name}</h4>
              ${isCurrent ? '<span style="font-weight:700;letter-spacing:.5px;color:var(--color-accent,#FF5C00);">CURRENT</span>' : ''}
            </div>
            ${priceLine}
            <div style="color:var(--text-secondary);min-height:32px;">${plan.tagline}</div>
            <ul style="margin:0;padding-left:18px;color:var(--text-secondary);line-height:1.7;">
              ${plan.features.map(f => `<li>${escapeHTML(f)}</li>`).join('')}
            </ul>
            <div style="margin-top:auto;padding-top:8px;">${action}</div>
          </div>
        </div>`;
    };

    tc.innerHTML = `
      ${banner}
      ${isCloud ? `
      <div class="card settings-usage-bars" style="max-width:100%;margin-bottom:20px;">
        <div class="card-header"><h4>AI usage today</h4></div>
        <div class="card-body">
          <div data-usage-bars>${usageBarsHtml()}</div>
        </div>
      </div>` : ''}
      <div class="card" style="max-width:100%;margin-bottom:20px;">
        <div class="card-header"><h4>Your plan</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start;">
            <div>
              <div style="text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary);">Plan</div>
              <div style="font-weight:700;">${active ? (PLAN_CATALOG[tier]?.name || 'Cloud') : (isCloud ? 'No plan yet' : 'Free')}</div>
              <div style="color:${pastDue ? 'var(--color-danger)' : 'var(--text-secondary)'};margin-top:2px;">${statusLabel}</div>
            </div>
            ${isCloud ? `
            <div>
              <div style="text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary);">Active users (seats)</div>
              <div style="font-weight:700;">${active && sub.seats != null ? sub.seats : activeSeats}</div>
              <div style="color:var(--text-secondary);margin-top:2px;">${comp ? 'Included at no charge' : 'Billed per active user'}</div>
            </div>` : ''}
            ${active && !comp && tier !== 'free' ? `
            <div>
              <div style="text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary);">Est. monthly</div>
              <div style="font-weight:700;">$${(PLAN_CATALOG[tier].price * (sub.seats != null ? sub.seats : activeSeats)).toFixed(0)}</div>
              ${renew ? `<div style="color:var(--text-secondary);margin-top:2px;">Renews ${renew}</div>` : ''}
            </div>` : ''}
          </div>
          ${isCloud && sub.hasCustomer ? `
          <div style="margin-top:18px;">
            <button class="btn btn-secondary" id="billing-portal" ${isAdmin ? '' : 'disabled'}>
              <span class="material-icons-outlined">receipt_long</span> Manage billing &amp; invoices
            </button>
            <div style="color:var(--text-tertiary);margin-top:6px;">Update your card, download receipts, or cancel — via Stripe's secure portal.</div>
          </div>` : ''}
          ${!isAdmin ? `<div style="color:var(--text-tertiary);margin-top:14px;">Only an administrator can change the plan or billing.</div>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:20px;align-items:stretch;">
        ${planCard(PLAN_CATALOG.free)}
        ${planCard(PLAN_CATALOG.cloud)}
        ${planCard(PLAN_CATALOG.cloud_plus)}
      </div>

      <p style="color:var(--text-tertiary);margin-top:16px;max-width:760px;">
        Prices are in AUD per active user, per month. Adding or deactivating a user adjusts your next
        invoice automatically (prorated). Cloud and Cloud+ are the same app; Cloud+ adds brny Max — expanding the brny assistant to the full workspace.
      </p>
    `;

    tc.querySelector('[data-migrate]')?.addEventListener('click', () => openMigrationModal());
    void refreshUsageBars(tc);

    tc.querySelector('#billing-portal')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await openBillingPortal(); // redirects to Stripe
      } catch (err) {
        showToast(err.message || 'Could not open billing portal', 'error');
        btn.disabled = false;
      }
    });

    tc.querySelectorAll('[data-choose]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const chosen = e.currentTarget.dataset.choose;
        e.currentTarget.disabled = true;
        try {
          if (active) {
            // Already subscribed — swap the plan in place (prorated), no new
            // subscription. Avoids creating a duplicate that double-bills.
            await changePlan(chosen);
            showToast(`Switched to ${PLAN_CATALOG[chosen].name}.`, 'success');
            setTimeout(() => window.location.reload(), 900);
          } else {
            await startCheckout(chosen); // first subscription → Stripe Checkout
          }
        } catch (err) {
          showToast(err.message || 'Could not change plan', 'error');
          e.currentTarget.disabled = false;
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
            <p style="color:var(--text-secondary);">Online card payments are a cloud feature. Upgrade to a cloud account to let your customers pay invoices online by card.</p>
          </div>
        </div>`;
      return;
    }

    const conn = connectInfo();                 // { accountId, chargesEnabled, detailsSubmitted }
    const ready = connectReady();
    const started = !!conn.accountId;
    const enabledFor = pay.enabledFor || {};

    // Returning from Stripe onboarding? Pull fresh status and re-render.
    const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
    const connectParam = params.get('connect');
    if (!tc.__connectRefreshed && (started || connectParam)) {
      tc.__connectRefreshed = true;
      const before = JSON.stringify(conn);
      refreshConnectStatus().then((d) => {
        if (d && JSON.stringify(connectInfo()) !== before) renderPaymentsTab(tc);
      }).catch(() => {});
    }

    // Status banner.
    let status;
    if (ready) {
      status = `<div style="display:flex;align-items:center;gap:10px;background:var(--color-info-bg);border:1px solid var(--color-info);border-radius:8px;padding:12px 14px;">
        <span class="material-icons-outlined" style="color:var(--color-info);">verified</span>
        <div><div style="font-weight:600;">Connected — you can accept card payments</div>
        <div style="color:var(--text-tertiary);">Payments go straight to your Stripe account.</div></div></div>`;
    } else if (started) {
      status = `<div style="display:flex;align-items:center;gap:10px;background:var(--color-warning-bg,#fff7ed);border:1px solid var(--color-warning);border-radius:8px;padding:12px 14px;">
        <span class="material-icons-outlined" style="color:var(--color-warning);">hourglass_top</span>
        <div><div style="font-weight:600;">Setup not finished</div>
        <div style="color:var(--text-tertiary);">Stripe still needs a few details before you can take payments.</div></div></div>`;
    } else {
      status = `<div style="color:var(--text-secondary);">Connect your Stripe account so customers can pay their invoices by card — the money goes directly to you. No Stripe account yet? You'll create one in a minute during setup.</div>`;
    }

    const primaryBtn = ready
      ? `<button class="btn btn-secondary" id="pay-dashboard"><span class="material-icons-outlined">open_in_new</span> Manage payouts on Stripe</button>`
      : `<button class="btn btn-primary" id="pay-connect"><span class="material-icons-outlined">account_balance</span> ${started ? 'Continue Stripe setup' : 'Connect Stripe'}</button>`;

    tc.innerHTML = `
      <div style="max-width:100%; display:grid; grid-template-columns:repeat(auto-fit, minmax(400px, 1fr)); gap:24px; align-items:start;">
      <div class="card" style="max-width:100%">
        <div class="card-header"><h4>Online Payments (Stripe)</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);margin-top:0;">
            Let customers pay invoices by card. Send a Pay link on an invoice or in the customer portal; it's marked Paid automatically once payment clears.
          </p>

          <div style="margin:14px 0;">${status}</div>

          <div style="margin:16px 0;display:flex;gap:10px;flex-wrap:wrap;">
            ${primaryBtn}
            ${started ? `<button class="btn btn-secondary" id="pay-refresh"><span class="material-icons-outlined">refresh</span> Refresh status</button>` : ''}
          </div>

          <div class="form-group" style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="pay-enable-invoice" style="width:16px;height:16px;" ${enabledFor.invoice !== false ? 'checked' : ''} />
            <label for="pay-enable-invoice" style="margin:0;">Offer a "Pay" action on sent invoices &amp; the customer portal</label>
          </div>

          <div class="form-group" style="max-width:340px;">
            <label class="form-label">Payment receipt</label>
            <select class="form-input" id="pay-receipt-source">
              <option value="relay" ${pay.receiptSource !== 'stripe' ? 'selected' : ''}>RELAY emails the receipt (recommended)</option>
              <option value="stripe" ${pay.receiptSource === 'stripe' ? 'selected' : ''}>Let Stripe email the receipt</option>
            </select>
            <div style="color:var(--text-tertiary);margin-top:6px;">
              Sent automatically when an invoice is paid online — only one receipt goes out. RELAY needs no email setup.
              If you pick Stripe, turn off RELAY here so the customer doesn't get two.
            </div>
          </div>

          <div style="margin-top:16px;">
            <button class="btn btn-primary" id="pay-save"><span class="material-icons-outlined">save</span> Save Payment Settings</button>
          </div>
        </div>
      </div>
      </div>`;

    tc.querySelector('#pay-connect')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try { await startConnectOnboarding('/settings?tab=payments'); }
      catch (err) { showToast(err.message || 'Could not start Stripe setup', 'error'); e.currentTarget.disabled = false; }
    });

    tc.querySelector('#pay-dashboard')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try { await openConnectDashboard(); }
      catch (err) { showToast(err.message || 'Could not open Stripe', 'error'); e.currentTarget.disabled = false; }
    });

    tc.querySelector('#pay-refresh')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try { await refreshConnectStatus(); showToast('Status updated', 'info'); renderPaymentsTab(tc); }
      catch (err) { showToast(err.message || 'Could not refresh', 'error'); e.currentTarget.disabled = false; }
    });

    tc.querySelector('#pay-save')?.addEventListener('click', async () => {
      try {
        const s = store.getSettings() || {};
        // Currency is not editable — it follows the connected Stripe account, so the
        // stored value is preserved rather than re-written here.
        s.payments = {
          ...(s.payments || {}),
          receiptSource: tc.querySelector('#pay-receipt-source').value === 'stripe' ? 'stripe' : 'relay',
          enabledFor: {
            ...((s.payments || {}).enabledFor || {}),
            invoice: tc.querySelector('#pay-enable-invoice').checked,
          },
        };
        await store.saveSettings(s);
        showToast('Payment settings saved', 'success');
        window.dispatchEvent(new CustomEvent('relay:settings-updated'));
      } catch (err) {
        console.error('Error saving payment settings:', err);
        showToast('Could not save payment settings', 'error');
      }
    });
  }

  function renderEmailTab(tc) {
    const settings = store.getSettings() || {};
    const email = emailSettings();   // settings.mailer — see utils/email.js
    const isCloud = !!(store.companyId && !String(store.companyId).startsWith('acct_'));

    if (!isCloud) {
      tc.innerHTML = `
        <div class="card" style="max-width:760px">
          <div class="card-header"><h4>Email</h4></div>
          <div class="card-body">
            <p style="color:var(--text-secondary);">Sending email is a cloud feature. Upgrade to a cloud account to email quotes, invoices and reminders to your customers.</p>
          </div>
        </div>`;
      return;
    }

    const enabledFor = email.enabledFor || {};
    const templates = [
      { key: 'quote', label: 'Quotes (with accept link)' },
      { key: 'invoice', label: 'Invoices (with pay link)' },
      { key: 'receipt', label: 'Payment receipts' },
      { key: 'reminder', label: 'Payment reminders' },
      { key: 'portal_invite', label: 'Portal invites' },
    ];
    const status = email.domainStatus || (email.domainId ? 'pending' : 'none');
    const records = Array.isArray(email.domainRecords) ? email.domainRecords : [];
    const statusColor = status === 'verified' ? 'var(--color-success)'
      : (status === 'failed' ? 'var(--color-danger)' : 'var(--color-warning)');

    tc.innerHTML = `
      <div class="card" style="max-width:100%">
        <div class="card-header"><h4>Email</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);margin-top:0;">
            Send themed quotes, invoices, receipts and reminders straight from RELAY — no account or domain setup needed. Every send is logged so brny and Reports can see what went out.
          </p>

          ${(() => {
            // Say plainly when sending is off. Without this the only symptom is
            // email actions quietly not appearing (or quietly doing nothing),
            // which reads exactly like "the email never arrived".
            const reason = emailBlockedReason();
            if (!reason) return '';
            return `<div style="display:flex;gap:10px;align-items:flex-start;background:color-mix(in srgb, var(--color-warning) 12%, transparent);border:1px solid var(--color-warning);border-radius:8px;padding:12px 14px;margin:14px 0;">
              <span class="material-icons-outlined" style="color:var(--color-warning);font-size:20px;flex-shrink:0;">warning_amber</span>
              <div>
                <div style="font-weight:600;margin-bottom:2px;">Email is not sending right now</div>
                <div style="color:var(--text-secondary);line-height:1.5;">${escapeHTML(reason)}</div>
              </div>
            </div>`;
          })()}

          <h5 style="margin:18px 0 8px;">Your sending addresses</h5>
          <div id="em-sender-box" style="background:var(--content-bg);border:1px solid var(--border-color);border-radius:8px;padding:14px 16px;margin-bottom:6px;">
            <div style="color:var(--text-tertiary);">Loading…</div>
          </div>
          <p style="color:var(--text-tertiary);margin:0 0 8px;">
            These are issued by RELAY and can't be edited — it's what keeps one business from sending mail as another.             Replies go to your reply-to address in Advanced delivery settings.
          </p>

          <div style="display:flex;gap:8px;align-items:flex-end;max-width:520px;margin-bottom:4px;">
            <div class="form-group" style="flex:1;margin:0;">
              <label class="form-label">Send a test email to</label>
              <input class="form-input" id="em-test-to" value="${escapeHTML(email.replyTo || (typeof settings.email === 'string' ? settings.email : '') || '')}" placeholder="you@yourbusiness.com" />
            </div>
            <button class="btn btn-secondary" id="em-test-send">Send test</button>
          </div>
          <p style="color:var(--text-tertiary);margin:0 0 8px;">Proves the whole chain end to end. Counts toward your daily limit; the result appears in Recent sends below.</p>

          <h5 style="margin:18px 0 8px;">Sender details</h5>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:12px;">
            <div class="form-group">
              <label class="form-label">Display name</label>
              <input class="form-input" id="em-from-name" value="${escapeHTML(email.fromName || settings.name || '')}" placeholder="Grace Dance" />
              <div style="color:var(--text-tertiary);margin-top:2px;">What customers see as the sender name.</div>
            </div>
          </div>
          <p style="color:var(--text-secondary);margin:8px 0 14px;">
            Replies come back to <strong>${escapeHTML(email.replyTo || (typeof settings.email === 'string' ? settings.email : '') || 'your company email')}</strong>.
            Reply-to, signature and sending from your own domain are under <em>Advanced delivery settings</em>.
          </p>

          <details style="margin:18px 0 8px;border:1px solid var(--border-color);border-radius:8px;padding:10px 14px;" ${email.mode === 'own-domain' ? 'open' : ''}>
            <summary style="cursor:pointer;font-weight:600;">Advanced delivery settings</summary>

            <div class="form-group" style="margin-top:12px;max-width:420px;">
              <label class="form-label">Reply-to address</label>
              <input class="form-input" id="em-reply-to" value="${escapeHTML(email.replyTo || (typeof settings.email === 'string' ? settings.email : '') || '')}" placeholder="office@yourdomain.com" />
              <div style="color:var(--text-tertiary);margin-top:2px;">Where customer replies land. Defaults to your company email.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Signature (optional)</label>
              <textarea class="form-input" id="em-signature" rows="3" placeholder="Grace Dance • 02 4900 0000 • gracedance.com">${escapeHTML(email.signature || '')}</textarea>
              <div style="color:var(--text-tertiary);margin-top:2px;">Added to the bottom of every email RELAY sends for you.</div>
            </div>

            <p style="color:var(--text-secondary);margin:18px 0 10px;padding-top:14px;border-top:1px solid var(--border-color);">
              Optional. Most businesses should stay on RELAY sending. Use the rest of this section only if you need mail to come from your own domain — you'll need to add DNS records at your registrar.
            </p>
            <label style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <input type="checkbox" id="em-own-domain" style="width:16px;height:16px;" ${email.mode === 'own-domain' ? 'checked' : ''} />
              Use my own domain instead of RELAY sending
            </label>
            <div class="form-group" style="max-width:420px;">
              <label class="form-label">From address on your domain</label>
              <input class="form-input" id="em-from-address" value="${escapeHTML(email.fromAddress || '')}" placeholder="billing@yourdomain.com" />
            </div>
          ${email.domainId ? `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <strong>${escapeHTML(email.domain || '')}</strong>
              <span style="font-weight:700;padding:2px 8px;border-radius:10px;background:${statusColor}1f;color:${statusColor};text-transform:capitalize;">${escapeHTML(status)}</span>
            </div>
            ${records.length ? `
              <p style="color:var(--text-secondary);margin:0 0 8px;">Add these DNS records at your domain registrar, then re-check:</p>
              <div style="overflow-x:auto;">
                <table class="data-table">
                  <thead><tr><th>Type</th><th>Name</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    ${records.map(r => `<tr>
                      <td>${escapeHTML(r.type || r.record || '')}</td>
                      <td style="font-family:monospace;">${escapeHTML(r.name || '')}</td>
                      <td style="font-family:monospace;word-break:break-all;max-width:340px;">${escapeHTML(r.value || '')}</td>
                      <td style="text-transform:capitalize;">${escapeHTML(r.status || '—')}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>` : ''}
            <div style="margin-top:10px;display:flex;gap:8px;">
              <button class="btn btn-secondary btn-sm" id="em-verify">Re-check verification</button>
              <button class="btn btn-ghost btn-sm" id="em-remove-domain">Remove domain</button>
            </div>
          ` : `
            <div style="display:flex;gap:8px;align-items:flex-end;max-width:540px;">
              <div class="form-group" style="flex:1;margin:0;">
                <label class="form-label">Your domain</label>
                <input class="form-input" id="em-domain" placeholder="yourdomain.com" />
              </div>
              <button class="btn btn-secondary" id="em-add-domain">Add &amp; get DNS records</button>
            </div>
          `}
          </details>

          <h5 style="margin:18px 0 8px;">Send these</h5>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${templates.map(t => `
              <label style="display:flex;align-items:center;gap:10px;">
                <input type="checkbox" class="em-tpl" data-key="${t.key}" style="width:16px;height:16px;" ${enabledFor[t.key] !== false ? 'checked' : ''} />
                ${t.label}
              </label>`).join('')}
          </div>

          <div style="margin-top:18px; display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px; align-items:start;">
          <div>
          <h5 style="margin:0 0 8px;">Wording &amp; branding</h5>
          <p style="color:var(--text-secondary);margin:0 0 10px;max-width:60ch;">
            ${(() => {
              const tmpl = email.templates || {};
              const customised = EMAIL_TEMPLATES.filter(t => { const v = tmpl[t.key] || {}; return !!(v.subject || v.intro || v.note || v.ctaLabel); });
              return customised.length
                ? `${customised.length} of ${EMAIL_TEMPLATES.length} personalised — ${escapeHTML(customised.map(t => t.label).join(', '))}`
                : `All ${EMAIL_TEMPLATES.length} emails use RELAY's standard wording.`;
            })()}
          </p>
          <button class="btn btn-secondary" id="open-email-studio" style="margin-bottom:8px;">
            <span class="material-icons-outlined" style="font-size:18px">drafts</span>
            Open Email Studio
          </button>
          </div>
          <div>
          <h5 style="margin:0 0 8px;">Automatic payment reminders</h5>
          <label style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <input type="checkbox" id="em-rem-enabled" style="width:16px;height:16px;" ${(email.reminders || {}).enabled ? 'checked' : ''} />
            Send reminders automatically
          </label>
          <div style="display:flex;gap:12px;max-width:440px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Nudge — days before due</label>
              <input type="number" min="0" class="form-input" id="em-rem-before" value="${escapeHTML(String((email.reminders || {}).beforeDays ?? 3))}" />
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Overdue — repeat every N days</label>
              <input type="number" min="1" class="form-input" id="em-rem-after" value="${escapeHTML(String((email.reminders || {}).afterDays ?? 7))}" />
            </div>
          </div>
          <p style="color:var(--text-tertiary);margin-top:4px;">One nudge that many days before the due date, then a repeat every N days while overdue. Uses the “Payment reminder” template; runs while the app is open.</p>
          </div>
          </div>

          <div style="margin-top:16px;">
            <button class="btn btn-primary" id="em-save"><span class="material-icons-outlined">save</span> Save Email Settings</button>
          </div>

          <h5 style="margin:24px 0 8px;">Recent sends</h5>
          <div style="overflow-x:auto;">
            ${(() => {
              const logs = (store.getAll('emailLog') || []).slice()
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 15);
              if (!logs.length) return `<p style="color:var(--text-tertiary);">No emails sent yet.</p>`;
              return `<table class="data-table"><thead><tr><th>When</th><th>To</th><th>Sent as</th><th>Type</th><th>Subject</th><th>Status</th></tr></thead><tbody>
                ${logs.map(l => `<tr${l.status === 'failed' && l.error ? ` title="${escapeHTML(l.error)}"` : ''}>
                  <td style="white-space:nowrap;">${escapeHTML(l.createdAt ? new Date(l.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')}</td>
                  <td>${escapeHTML(l.toEmail || '')}</td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(l.fromEmail || '—')}</td>
                  <td style="text-transform:capitalize;">${escapeHTML(String(l.template || '').replace('_', ' '))}</td>
                  <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(l.subject || '')}</td>
                  <td><span style="font-weight:600;color:${l.status === 'sent' ? 'var(--color-success)' : 'var(--color-danger)'};">${escapeHTML(l.status || '')}</span></td>
                </tr>`).join('')}
              </tbody></table>
              <p style="color:var(--text-tertiary);margin-top:6px;">Hover a failed row to see the error.</p>`;
            })()}
          </div>
        </div>
      </div>`;

    // Persist sender/toggle fields; the domain wizard merges its own state via `extra`.
    const collectAndSave = async (extra = {}) => {
      const s = store.getSettings() || {};
      const per = {};
      tc.querySelectorAll('.em-tpl').forEach(cb => { per[cb.dataset.key] = cb.checked; });
      // settings.mailer, never settings.email — that key is the business email
      // address string used on invoices and the customer portal.
      s.mailer = {
        ...emailSettings(),
        fromName: tc.querySelector('#em-from-name')?.value.trim() || '',
        fromAddress: tc.querySelector('#em-from-address')?.value.trim() || '',
        replyTo: tc.querySelector('#em-reply-to')?.value.trim() || '',
        signature: tc.querySelector('#em-signature')?.value || '',
        mode: tc.querySelector('#em-own-domain')?.checked ? 'own-domain' : 'relay',
        enabledFor: per,
        reminders: {
          enabled: tc.querySelector('#em-rem-enabled')?.checked || false,
          beforeDays: Number(tc.querySelector('#em-rem-before')?.value) || 0,
          afterDays: Number(tc.querySelector('#em-rem-after')?.value) || 7,
        },
        ...extra,
      };
      // Repair the legacy collision: an early build stored this config object at
      // settings.email, which is the business email address string.
      if (s.email && typeof s.email === 'object') {
        s.email = s.mailer.replyTo || '';
      }
      await store.saveSettings(s);
      window.dispatchEvent(new CustomEvent('relay:settings-updated'));
      return s;
    };

    tc.querySelector('#open-email-studio')?.addEventListener('click', () => router.navigate('/settings/email-templates'));

    tc.querySelector('#em-save')?.addEventListener('click', async () => {
      try {
        await collectAndSave();
        showToast('Email settings saved', 'success');
        renderEmailTab(tc);
      } catch (err) {
        console.error('Error saving email settings:', err);
        showToast('Could not save email settings', 'error');
      }
    });

    tc.querySelector('#em-test-send')?.addEventListener('click', async (e) => {
      const to = tc.querySelector('#em-test-to')?.value.trim();
      if (!to) { showToast('Enter an address to send the test to', 'error'); return; }
      const btn = e.currentTarget;
      const original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        // Deliberately plain HTML rather than a themed template: this is testing
        // the delivery chain (auth -> slug -> sender -> Resend), not the branding.
        const res = await sendEmail({
          to,
          subject: 'RELAY test email',
          template: 'custom',
          html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1E2A3A;line-height:1.6;">
            <p>This is a test email from RELAY.</p>
            <p>If it reached you, sending is working — quotes, invoices, receipts and reminders will go out the same way.</p>
            <p style="color:#64748B;font-size:12px;">Sent ${escapeHTML(new Date().toLocaleString('en-AU'))}</p>
          </div>`,
        });
        showToast(`Test sent to ${to}${res?.from ? ` as ${String(res.from).replace(/^.*</, '').replace(/>$/, '')}` : ''}`, 'success');
        renderEmailTab(tc);
      } catch (err) {
        console.error('Test email failed:', err);
        showToast(err.message || 'Test send failed', 'error');
        btn.disabled = false; btn.textContent = original;
      }
    });

    // The sending addresses are built server-side from the company's slug, so
    // ask the edge function what they actually are rather than guessing here.
    (async () => {
      const box = tc.querySelector('#em-sender-box');
      if (!box) return;
      try {
        const info = await getSenderInfo();
        const labels = {
          quote: 'Quotes', invoice: 'Invoices', receipt: 'Receipts',
          reminder: 'Reminders', portal_invite: 'Portal invites',
        };
        const seen = new Set();
        const rows = Object.keys(labels)
          .map(k => ({ k, addr: (info.addresses || {})[k] || '' }))
          .filter(r => r.addr)
          // billing.* covers three types — show each address once.
          .filter(r => { const a = r.addr.toLowerCase(); if (seen.has(a)) return false; seen.add(a); return true; });

        box.innerHTML = `
          ${info.mode === 'own-domain'
            ? `<div style="color:var(--color-success);font-weight:600;margin-bottom:8px;">Sending from your own domain (${escapeHTML(info.domain || '')})</div>`
            : ''}
          <table class="data-table" style="width:100%;">
            ${rows.map(r => `<tr>
              <td style="padding:3px 12px 3px 0;color:var(--text-secondary);white-space:nowrap;">${escapeHTML(
                Object.keys(labels).filter(k => ((info.addresses || {})[k] || '').toLowerCase() === r.addr.toLowerCase()).map(k => labels[k]).join(', ')
              )}</td>
              <td style="padding:3px 0;font-family:monospace;word-break:break-all;">${escapeHTML(r.addr.replace(/^.*</, '').replace(/>$/, ''))}</td>
            </tr>`).join('')}
          </table>
          ${info.replyTo
            ? `<div style="color:var(--text-tertiary);margin-top:8px;">Replies go to <strong>${escapeHTML(info.replyTo)}</strong></div>`
            : `<div style="color:var(--color-warning);margin-top:8px;">No reply-to set — customer replies will go nowhere. Add one under Advanced delivery settings.</div>`}
          ${info.dailyCap ? `<div style="color:var(--text-tertiary);margin-top:4px;">Daily send limit: ${escapeHTML(String(info.dailyCap))} emails</div>` : ''}
        `;
      } catch (err) {
        box.innerHTML = `<div style="color:var(--color-danger);">Couldn't load your sending addresses: ${escapeHTML(err.message || String(err))}</div>`;
      }
    })();

    tc.querySelector('#em-add-domain')?.addEventListener('click', async (e) => {
      const name = tc.querySelector('#em-domain')?.value.trim();
      if (!name) { showToast('Enter a domain first', 'error'); return; }
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Adding…';
      try {
        const res = await addEmailDomain(name);
        await collectAndSave({ domain: res.name || name, domainId: res.id, domainStatus: res.status || 'pending', domainRecords: res.records || [] });
        showToast('Domain added — add the DNS records shown', 'success');
        renderEmailTab(tc);
      } catch (err) {
        console.error('Add domain failed:', err);
        showToast(`Could not add domain: ${err.message || err}`, 'error');
        btn.disabled = false; btn.textContent = 'Add & get DNS records';
      }
    });

    tc.querySelector('#em-verify')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Checking…';
      try {
        await verifyEmailDomain(email.domainId);
        const fresh = await getEmailDomain(email.domainId);
        await collectAndSave({ domainStatus: fresh.status || 'pending', domainRecords: fresh.records || [] });
        showToast(fresh.status === 'verified' ? 'Domain verified!' : `Status: ${fresh.status}`, fresh.status === 'verified' ? 'success' : 'info');
        renderEmailTab(tc);
      } catch (err) {
        console.error('Verify domain failed:', err);
        showToast(`Verification check failed: ${err.message || err}`, 'error');
        btn.disabled = false; btn.textContent = 'Re-check verification';
      }
    });

    tc.querySelector('#em-remove-domain')?.addEventListener('click', async () => {
      try {
        await collectAndSave({ domain: '', domainId: '', domainStatus: 'none', domainRecords: [] });
        renderEmailTab(tc);
      } catch (err) {
        showToast('Could not remove domain', 'error');
      }
    });
  }

  // The design itself is edited in the full-width Document Studio; this tab is
  // the way in, and summarises what the current design looks like.
  function renderInvoicesQuotesTab(tc) {
    const s = store.getSettings() || {};
    const dt = s.documentTheme || {};
    const accent = dt.accentColor || '#FF5C00';
    const header = dt.headerBg || '#1E2A3A';
    const tint = dt.accentTint || '#F8FAFC';
    const fontLabel = dt.fontFamily === 'serif' ? 'Serif'
      : dt.fontFamily === 'monospace' ? 'Monospace' : 'Sans-serif';
    const presetNames = {
      relay: 'Relay', classic: 'Classic', forest: 'Forest', electric: 'Electric',
      obsidian: 'Obsidian', terracotta: 'Terracotta', nordic: 'Nordic',
      luxury: 'Velvet', steel: 'Steel', ballet: 'Ballet', custom: 'Custom',
    };
    const themeLabel = presetNames[dt.preset] || 'Relay';
    const chip = (label) => `<span style="padding:3px 10px; border:1px solid var(--border-color-dark); border-radius:999px; font-weight:600; color:var(--text-secondary)">${escapeHTML(label)}</span>`;

    tc.innerHTML = `
      <div class="card" style="max-width:100%">
        <div class="card-body" style="display:flex; gap:26px; align-items:center; padding:24px; flex-wrap:wrap">
          <div style="flex:0 0 128px; width:128px; aspect-ratio:210/297; background:#fff; border:1px solid var(--border-color-dark); border-radius:4px; box-shadow:var(--shadow-md); padding:10px 11px; overflow:hidden" aria-hidden="true">
            <div style="height:12px; border-radius:2px; background:${header}"></div>
            <div style="height:4px; width:52%; margin-top:8px; border-radius:2px; background:${accent}"></div>
            <div style="height:3px; width:88%; margin-top:7px; border-radius:2px; background:#e2e6ec"></div>
            <div style="height:3px; width:74%; margin-top:4px; border-radius:2px; background:#e2e6ec"></div>
            <div style="height:26px; margin-top:9px; border-radius:2px; background:${tint}; border:1px solid #edf0f3"></div>
            <div style="height:3px; width:60%; margin-top:9px; border-radius:2px; background:#e2e6ec"></div>
            <div style="height:3px; width:40%; margin-top:4px; border-radius:2px; background:#e2e6ec"></div>
          </div>
          <div style="flex:1 1 340px; min-width:280px">
            <h3 style="margin:0 0 6px; font-size:var(--font-size-xl)">Quote &amp; invoice design</h3>
            <p style="margin:0 0 14px; color:var(--text-secondary); font-size:var(--font-size-lg); line-height:1.6; max-width:52ch">
              Colours, logo placement, wording, numbering and accepted payment methods for every
              quote and tax invoice you send.
            </p>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:18px">
              ${chip(`${themeLabel} theme`)}${chip(fontLabel)}${chip(`Accent ${accent.toUpperCase()}`)}
            </div>
            <button class="btn btn-primary" id="open-doc-studio">
              <span class="material-icons-outlined" style="font-size:18px">edit_document</span>
              Open Document Studio
            </button>
          </div>
        </div>
      </div>`;

    tc.querySelector('#open-doc-studio')?.addEventListener('click', () => router.navigate('/settings/documents'));
  }

  // Local/offline accounts keep their own database in a folder on this machine;
  // cloud accounts have server rows and use the same tab to mirror them to a folder.
  // Mirrors the isLocalMode check inside renderSettings (module scope can't see it).
  function isLocalAccount() {
    return !store.companyId || store.companyId.startsWith('acct_');
  }

  // One tab for the on-disk side of RELAY: local accounts write their database to
  // a folder here, cloud accounts mirror their records here as JSON.
  // currentUser is a renderSettings local, so it is passed in (same as renderBillingTab).
  function renderLocalStorageTab(tc, currentUser) {
    if (!isLocalAccount()) {
      renderLocalBackup(tc, currentUser);
      return;
    }
    // renderLocalFolderSync writes its host element, so each card owns a host.
    tc.replaceChildren();
    const folderHost = document.createElement('div');
    const securityHost = document.createElement('div');
    tc.append(folderHost, securityHost);
    renderLocalFolderSync(folderHost);
    renderLocalSecurity(securityHost, currentUser);
  }

  function renderLocalFolderSync(tc) {
    const isSupported = typeof window !== 'undefined' && (
      (window.indexedDB && window.showDirectoryPicker) ||
      (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem)
    );

    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;

    const activeAccountId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('relay_active_account') : null;
    const isLocalCompany = !!activeAccountId;

    function render() {
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
            <p style="margin:0; line-height:1.4;">
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
              <p style="margin:0; line-height:1.4;">All data is currently stored in your browser's private IndexedDB database sandbox.</p>
            </div>
          </div>
        `;
      } else if (isCapacitor) {
        statusHtml = `
          <div style="background:var(--color-success-bg); border-left:4px solid var(--color-success); padding:16px; border-radius:4px; color:var(--color-success); margin-bottom:var(--space-lg); display:flex; align-items:center; gap:12px;">
            <span class="material-icons-outlined" style="font-size:32px;">cloud_done</span>
            <div>
              <div style="font-weight:600; margin-bottom:2px;">Capacitor Direct Folder Sync Active</div>
              <p style="margin:0; line-height:1.4; color:var(--text-secondary);">
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
              <p style="margin:0; line-height:1.4; color:var(--text-secondary);">Please select a directory folder on your computer to begin syncing.</p>
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
                <p style="margin:0; line-height:1.4; color:var(--text-secondary);">
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
              <p style="margin:0; line-height:1.4; color:var(--text-secondary);">
                Active Folder: <strong>${escapeHTML(store.dirHandle.name)}</strong>. All data edits are writing dynamically.
              </p>
            </div>
          </div>
        `;
      }

      tc.innerHTML = `
        <div style="display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:var(--space-lg); max-width:100%; align-items:start;">
          <!-- Folder Configuration -->
          <div class="card">
            <div class="card-header"><h4>Database Folder</h4></div>
            <div class="card-body">
              ${statusHtml}

              <div class="form-group" style="margin-bottom:var(--space-lg);">
                <label class="form-label" style="font-weight:600; margin-bottom:8px;">Synchronization Toggle</label>
                <label class="switch-container" style="display:flex; align-items:center; gap:12px; cursor:${(!isSupported || isLocalCompany) ? 'not-allowed' : 'pointer'};">
                  <input type="checkbox" id="toggle-folder-sync" ${isEnabled ? 'checked' : ''} ${(!isSupported || isLocalCompany) ? 'disabled' : ''} style="width:20px; height:20px; cursor:${(!isSupported || isLocalCompany) ? 'not-allowed' : 'pointer'};" />
                  <div>
                    <span style="font-weight:500;">Enable Direct Local Folder Storage</span>
                    <div class="text-tertiary" style="margin-top:2px;">
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
            <div class="card-header"><h4>How it works</h4></div>
            <div class="card-body" style="line-height:1.6; display:flex; flex-direction:column; gap:12px; color:var(--text-secondary);">
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

  // Local accounts have no My Profile page, so the things that page used to own —
  // the unlock PIN and the secret recovery question — live here instead. The
  // dispatch start location is deliberately absent: resolving an address needs the
  // Cloud geocoder, so the field could never be saved in local mode.
  function renderLocalSecurity(host, currentUser) {
    const RECOVERY_PRESETS = [
      'What was the name of your first pet?',
      'In what city or town did your parents meet?',
      'What was the name of your first school?',
      'What was your favorite childhood food?'
    ];

    let accounts = [];
    let account = null;
    let recoveryQuestion = '';
    let hasPin = false;

    const load = async () => {
      accounts = (await storageGet('relay_accounts')) || [];
      account = accounts.find(a => a.id === currentUser.companyId) || null;
      recoveryQuestion = account?.recoveryQuestion || '';
      hasPin = !!account?.hasPassword;
    };

    const render = () => {
      const isCustom = !!recoveryQuestion && !RECOVERY_PRESETS.includes(recoveryQuestion);
      const presetOptions = RECOVERY_PRESETS.map(q =>
        `<option value="${escapeHTML(q)}" ${recoveryQuestion === q ? 'selected' : ''}>${escapeHTML(q)}</option>`
      ).join('');

      host.innerHTML = `
        <div style="display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:var(--space-lg); max-width:100%; align-items:start; margin-top:var(--space-lg);">
          <div style="display:flex; flex-direction:column; gap:var(--space-lg);">

            <div class="card">
              <div class="card-header"><h4>Unlock PIN</h4></div>
              <div class="card-body">
                <p class="text-secondary" style="margin:0 0 var(--space-base); line-height:1.5;">
                  The PIN that locks and unlocks this local business profile on this machine.
                </p>
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                  <div class="form-group">
                    <label class="form-label">New PIN / Password</label>
                    <input type="password" id="local-security-new-pin" class="form-input" autocomplete="new-password"
                      placeholder="Leave blank to remove PIN protection" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Confirm PIN / Password</label>
                    <input type="password" id="local-security-confirm-pin" class="form-input" autocomplete="new-password"
                      placeholder="Re-type the new PIN" />
                  </div>
                </div>
                <p class="text-tertiary" style="margin:0 0 var(--space-base);">
                  ${hasPin ? 'PIN protection is currently on.' : 'No PIN set — RELAY opens without a prompt on this machine.'}
                </p>
                <div style="display:flex; justify-content:flex-end;">
                  <button class="btn btn-primary btn-sm" id="local-security-save-pin">Update PIN</button>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Secret Recovery Question</h4></div>
              <div class="card-body">
                <p class="text-secondary" style="margin:0 0 var(--space-base); line-height:1.5;">
                  Answer this to reset your PIN if you ever forget it.
                </p>
                <div class="form-group">
                  <label class="form-label">Recovery Question</label>
                  <select id="local-security-recovery-select" class="form-select" style="width:100%">
                    ${presetOptions}
                    <option value="custom" ${isCustom ? 'selected' : ''}>Write a custom question...</option>
                  </select>
                </div>
                <div class="form-group" id="local-security-recovery-custom-group" style="display:${isCustom ? 'block' : 'none'}">
                  <label class="form-label">Custom Question</label>
                  <input type="text" id="local-security-recovery-custom-question" class="form-input"
                    placeholder="Type your custom question" value="${escapeHTML(isCustom ? recoveryQuestion : '')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Recovery Answer</label>
                  <input type="password" id="local-security-recovery-answer" class="form-input"
                    placeholder="Type answer (leave blank to keep current)" />
                </div>
                <div style="display:flex; justify-content:flex-end;">
                  <button class="btn btn-primary btn-sm" id="local-security-save-recovery">Save Recovery Settings</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card" style="background:var(--content-bg);">
            <div class="card-header"><h4>Where this is stored</h4></div>
            <div class="card-body">
              <p class="text-secondary" style="margin:0 0 var(--space-base); line-height:1.5;">
                These settings belong to this machine only. Nothing here is sent anywhere.
              </p>
              <p class="text-tertiary" style="margin:0 0 var(--space-base); line-height:1.55;">
                Your PIN and recovery answer are salted and hashed before they are written to this browser's
                local database — RELAY never stores them in plain text.
              </p>
              <p class="text-tertiary" style="margin:0; line-height:1.55;">
                Keep the recovery answer somewhere safe. It is the only way back in if the PIN is forgotten.
              </p>
            </div>
          </div>
        </div>
      `;

      attach();
    };

    const missingAccount = () => {
      if (account) return false;
      showToast('Could not find this local account record.', 'error');
      return true;
    };

    const attach = () => {
      host.querySelector('#local-security-save-pin')?.addEventListener('click', async () => {
        const newPin = host.querySelector('#local-security-new-pin').value;
        const confirmPin = host.querySelector('#local-security-confirm-pin').value;
        if (newPin !== confirmPin) {
          showToast('Passwords do not match.', 'error');
          return;
        }
        if (missingAccount()) return;
        account.hasPassword = !!newPin;
        account.passwordHash = newPin ? await hashPassword(newPin) : null;
        await storageSet('relay_accounts', accounts);
        showToast(newPin ? 'PIN code updated successfully.' : 'PIN protection removed.', 'success');
        await load();
        render();
      });

      const selectEl = host.querySelector('#local-security-recovery-select');
      const customGroup = host.querySelector('#local-security-recovery-custom-group');
      if (selectEl && customGroup) {
        selectEl.addEventListener('change', () => {
          customGroup.style.display = selectEl.value === 'custom' ? 'block' : 'none';
        });
      }

      host.querySelector('#local-security-save-recovery')?.addEventListener('click', async () => {
        const selectQ = host.querySelector('#local-security-recovery-select').value;
        const customQ = host.querySelector('#local-security-recovery-custom-question').value.trim();
        const answer = host.querySelector('#local-security-recovery-answer').value.trim().toLowerCase();
        const recoveryQ = selectQ === 'custom' ? customQ : selectQ;
        if (!recoveryQ) {
          showToast('Please set a recovery question.', 'error');
          return;
        }
        if (missingAccount()) return;
        account.recoveryQuestion = recoveryQ;
        if (answer) account.recoveryAnswerHash = await hashPassword(answer);
        await storageSet('relay_accounts', accounts);
        showToast('Security recovery settings saved successfully.', 'success');
        await load();
        render();
      });
    };

    load().then(render);
  }

  // Cloud accounts: mirror the cloud records into a local folder as JSON so there
  // is always an offline, inspectable copy.
  function renderLocalBackup(tc, currentUser) {
    if (currentUser.role !== 'admin') {
      tc.innerHTML = '<p class="text-tertiary">Local storage is restricted to company administrators.</p>';
      return;
    }

    tc.innerHTML = `
      <div class="card" style="max-width:100%">
        <div class="card-header" style="display:flex; align-items:center; gap:8px;">
          <span class="material-icons-outlined" style="color:var(--color-primary)">backup</span>
          <h4 style="margin:0;">Local Storage</h4>
        </div>
        <div class="card-body" style="display:flex; flex-direction:column; gap:12px;">
          <p class="text-secondary" style="line-height:1.4; margin:0;">
            Pick a folder on this machine and RELAY mirrors your cloud records into it as JSON files, so you
            always have an offline copy you can inspect or restore from.
          </p>
          <div id="backup-status-container"></div>
        </div>
      </div>
    `;

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
          <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:10px 12px; border-radius:4px; color:var(--color-danger); line-height:1.4;">
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
            <div>No backup folder configured.</div>
          </div>
          <button class="btn btn-secondary" id="btn-backup-pick" style="width:100%; justify-content:center;">
            <span class="material-icons-outlined">folder</span> Choose Backup Folder...
          </button>
        `;
      } else if (!isPermissionGranted) {
        bsc.innerHTML = `
          <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:10px 12px; border-radius:4px; color:var(--color-warning); line-height:1.4; margin-bottom:12px;">
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
          <div style="background:var(--color-success-bg); border-left:4px solid var(--color-success); padding:10px 12px; border-radius:4px; color:var(--color-success); line-height:1.4; margin-bottom:12px;">
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

    renderBackupStatus();
  }

  function renderCostCentersTab(tc) {
      const list = store.getAll('costCenters') || [];

      const renderTab = () => {
        tc.innerHTML = `
          <div class="card" style="max-width:100%">
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
                          <div style="line-height:1.4">
                            ${cc.xeroSalesAccountCode ? `<div><span class="text-tertiary">Sales Code:</span> <strong>${escapeHTML(cc.xeroSalesAccountCode)}</strong></div>` : ''}
                            ${cc.xeroExpenseAccountCode ? `<div><span class="text-tertiary">Expense Code:</span> <strong>${escapeHTML(cc.xeroExpenseAccountCode)}</strong></div>` : ''}
                            ${cc.xeroTrackingOptionName ? `<div><span class="text-tertiary">Tracking:</span> <strong>${escapeHTML(cc.xeroTrackingCategoryName || 'Department')}:${escapeHTML(cc.xeroTrackingOptionName)}</strong></div>` : ''}
                          </div>
                        ` : '<span class="text-tertiary">— Unmapped —</span>'}
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
          <legend style="padding: 0 6px; font-weight: 600; color: var(--color-primary); display: flex; align-items: center; gap: 4px; margin: 0">
            <span class="material-icons-outlined" style="font-size:15px">sync</span> Xero Integration (Optional)
          </legend>
          <div class="form-row" style="margin-bottom:12px; display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label" style="margin-bottom:4px">Sales Account Code</label>
              <input class="form-input" id="cc-xero-sales" value="${escapeHTML(cc.xeroSalesAccountCode || '')}" placeholder="e.g. 200" style="width:100%" />
            </div>
            <div class="form-group">
              <label class="form-label" style="margin-bottom:4px">Expense Account Code</label>
              <input class="form-input" id="cc-xero-expense" value="${escapeHTML(cc.xeroExpenseAccountCode || '')}" placeholder="e.g. 300" style="width:100%" />
            </div>
          </div>
          <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label" style="margin-bottom:4px">Tracking Category</label>
              <input class="form-input" id="cc-xero-category" value="${escapeHTML(cc.xeroTrackingCategoryName || 'Department')}" placeholder="e.g. Department" style="width:100%" />
            </div>
            <div class="form-group">
              <label class="form-label" style="margin-bottom:4px">Tracking Option</label>
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
      <div style="max-width:100%">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Supplier Categories</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="margin-bottom:16px">Define classifications/categories for your suppliers (e.g. Electrical, Plumbing, HVAC). These categories are used to group suppliers in the Suppliers directory.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="supplier-categories-container">
              ${categories.map(c => `
                <div class="badge badge-neutral" style="padding:8px 12px;display:flex;align-items:center;gap:8px">
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

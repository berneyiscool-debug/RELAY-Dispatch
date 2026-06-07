// ============================================
// SIMPRO CLONE — SETTINGS PAGE
// ============================================

import { store } from '../data/store.js';
import { showToast } from '../components/Notifications.js';
import { showModal } from '../components/Modal.js';
import { MODULE_PERMS } from '../utils/permissions.js';
import { escapeHTML } from '../utils/security.js';
import { router } from '../router.js';
import { seedMinimalData } from '../data/seed.js';
import { getPrintStyles, generateDocument } from '../components/PrintPreview.js';
import { applyTheme, THEMES } from '../utils/theme.js';

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

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  function render() {
    container.innerHTML = `
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${activeTab === 'company' ? 'active' : ''}" data-tab="company">Company</button>
        <button class="tab ${activeTab === 'users' ? 'active' : ''}" data-tab="users">Users & Permissions</button>
        <button class="tab ${activeTab === 'materials' ? 'active' : ''}" data-tab="materials">Materials</button>
        <button class="tab ${activeTab === 'templates_forms' ? 'active' : ''}" data-tab="templates_forms">Templates &amp; Forms</button>
        <button class="tab ${activeTab === 'tax' ? 'active' : ''}" data-tab="tax">Tax &amp; Rates</button>
        <button class="tab ${activeTab === 'portal' ? 'active' : ''}" data-tab="portal">Customer Portal</button>
        <button class="tab ${activeTab === 'invoices_quotes' ? 'active' : ''}" data-tab="invoices_quotes">Quotes &amp; Invoices</button>
        <button class="tab ${activeTab === 'system' ? 'active' : ''}" data-tab="system">System</button>
      </div>
      <div id="settings-content" style="padding-top:var(--space-lg)"></div>
    `;

    renderContent();

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderContent();
      });
    });
  }

  function renderContent() {
    const tc = container.querySelector('#settings-content');

    if (activeTab === 'templates_forms') {
      renderTemplatesFormsTab(tc);
      return;
    }

    if (activeTab === 'invoices_quotes') {
      renderInvoicesQuotesTab(tc);
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
            showToast('Company information saved successfully to cloud database', 'success');
            tc.querySelector('#unsaved-logo-hint').style.display = 'none';
            window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
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
              if (mod === 'Jobs') return ['view', 'manage_tasks', 'book_time'].includes(key);
              if (mod === 'Timesheets') return ['view_own', 'create'].includes(key);
              if (mod === 'Schedule') return ['view_own'].includes(key);
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

      tc.querySelector('#btn-add-user').addEventListener('click', () => openUserModal());
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
      tc.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Tax & Global Markup</h4></div>
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
              <div class="form-group">
                <label class="form-label">Global Material Markup</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input class="form-input" id="global-markup" type="number" value="${settings.markupPercent || 20}" style="width:100px" /> <span class="text-secondary">%</span>
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
                      <input class="rate-name" value="${rate.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
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
                    <input type="hidden" class="rate-desc" value="${rate.description || ''}" />
                    ${renderTimelineHtml(rate.activeHours || [])}

                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${allDays.map(day => `
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${day}" ${applicable.includes(day) ? 'checked' : ''} style="display:none" />
                            <span class="rate-day-pill" data-day="${day}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${applicable.includes(day) ? 'var(--color-primary)' : 'var(--border-color)'};background:${applicable.includes(day) ? 'var(--color-primary-light)' : 'transparent'};color:${applicable.includes(day) ? 'var(--color-primary)' : 'var(--text-secondary)'}">
                              ${dayLabels[day]}
                            </span>
                          </label>
                        `).join('')}
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

        <div class="card" style="margin-top:var(--space-lg)">
          <div class="card-header"><h4>Job Type Rate Mapping</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:var(--font-size-sm);margin-bottom:16px">Automatically assign a labor profile when a job of a specific type is created.</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
              ${['Service', 'Project', 'Maintenance', 'Quote'].map(type => `
                <div class="form-group" style="margin:0">
                  <label class="form-label">${type} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${type}">
                    <option value="">-- Use Default --</option>
                    ${settings.laborRates.map(r => `<option value="${r.id}" ${(settings.rateMappings?.[type] === r.id) ? 'selected' : ''}>${r.name}</option>`).join('')}
                  </select>
                </div>
              `).join('')}
            </div>
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

      // ---- Save ----
      tc.querySelector('#save-tax-settings').addEventListener('click', async () => {
        const btn = tc.querySelector('#save-tax-settings');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spinner" style="font-size:16px; margin-right:4px; animation: spin 1s linear infinite">sync</span> Saving...';

        try {
          const taxEnabled = tc.querySelector('#tax-enabled').checked;
          const taxRate = parseFloat(tc.querySelector('#tax-rate').value) || 0;
          const markupPercent = parseFloat(tc.querySelector('#global-markup').value) || 0;
          const laborRounding = parseInt(tc.querySelector('#labor-rounding').value) || 15;
          const laborRates = _collectRates(tc);
          const settings = store.getSettings();
          settings.taxEnabled = taxEnabled;
          settings.taxRate = taxRate;
          settings.markupPercent = markupPercent;
          settings.laborRounding = laborRounding;
          settings.laborRates = laborRates;
          
          // Save rate mappings
          settings.rateMappings = {};
          tc.querySelectorAll('.rate-mapping').forEach(sel => {
            if (sel.value) settings.rateMappings[sel.dataset.type] = sel.value;
          });

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

    } else if (activeTab === 'system') {
      const s = store.getSettings();
      const currentPref = s.tooltipPreference || 'full';
      const currentTheme = localStorage.getItem('simpro_theme') || 'light';
      tc.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-lg); max-width:960px; align-items:start;">
          <!-- Data Management -->
          <div class="card">
            <div class="card-header"><h4>Data Management</h4></div>
            <div class="card-body">
              <p class="text-secondary" style="margin-bottom:var(--space-lg)">Manage your application data. All data is stored locally in your browser.</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <button class="btn btn-secondary" id="btn-reset-data" data-tooltip="Restore default sandbox demo database" data-tooltip-pos="left">
                  <span class="material-icons-outlined">refresh</span> Reset to Demo Data
                </button>
                <button class="btn btn-danger" id="btn-clear-data" data-tooltip="Permanently delete all local database records" data-tooltip-pos="left">
                  <span class="material-icons-outlined">delete_forever</span> Clear All Data
                </button>
                ${currentUser.role === 'admin' ? `
                  <hr style="margin:var(--space-md) 0; border:none; border-top:1px dashed var(--border-color);" />
                  <div style="background:var(--color-danger-bg); padding:var(--space-md); border-radius:var(--border-radius); border:1px solid rgba(220, 38, 38, 0.15)">
                    <h5 style="color:var(--color-danger); margin-bottom:8px; display:flex; align-items:center; gap:6px; font-weight:600;">
                      <span class="material-icons-outlined">admin_panel_settings</span> Administrator Actions
                    </h5>
                    <p style="font-size:var(--font-size-sm); color:var(--text-secondary); margin-bottom:var(--space-md); line-height:1.4;">
                      Configure clean setups or seed a single test sample to explore the blank app layout.
                    </p>
                    <button class="btn btn-secondary" id="btn-seed-minimal" data-tooltip="Clean database and seed exactly one sample record of each entity" data-tooltip-pos="left" style="width:100%; justify-content:center; margin-bottom:12px; border:1px solid rgba(0,0,0,0.12)">
                      <span class="material-icons-outlined">science</span> Seed One Example Version
                    </button>
                    <button class="btn btn-danger" id="btn-restore-new" data-tooltip="Delete all data and return system to a clean blank state" data-tooltip-pos="left" style="width:100%; justify-content:center;">
                      <span class="material-icons-outlined">cleaning_services</span> Restore to New (Blank State)
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

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
        applyTheme(e.target.value);
        showToast('System theme updated successfully', 'success');
      });

      tc.querySelector('#btn-reset-data')?.addEventListener('click', () => {
        store.clearAll();
        showToast('Data reset. Reloading...', 'info');
        setTimeout(() => window.location.reload(), 1000);
      });

      tc.querySelector('#btn-clear-data')?.addEventListener('click', () => {
        store.clearAll();
        showToast('All data cleared. Reloading...', 'warning');
        setTimeout(() => window.location.reload(), 1000);
      });

      tc.querySelector('#btn-seed-minimal')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.style.cssText = 'line-height:1.6; color:var(--text-primary);';
        content.innerHTML = `
          <p style="margin-bottom:12px">You are about to seed a minimal example dataset.</p>
          <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-info); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined">info</span>
            <span>This will clear current database records and load <strong>exactly one example</strong> of each business entity (1 customer, 1 lead, 1 quote, 1 job, 1 invoice, etc.) for testing.</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary)">This is highly recommended for quick feature walkthroughs.</p>
        `;

        showModal({
          title: "Seed One Example Version",
          content: content,
          actions: [
            {
              label: "Cancel",
              className: "btn-secondary",
              onClick: (close) => close()
            },
            {
              label: "Seed Example",
              className: "btn-primary",
              onClick: (close) => {
                close();
                seedMinimalData();
                showToast('Single-item example seeded. Reloading...', 'success');
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
          <select class="form-select" id="u-type" ${t.userTypeId === 'ut_admin' ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
            <option value="">-- Select --</option>
            ${userTypes
              .filter(ut => ut.id !== 'ut_admin' || t.userTypeId === 'ut_admin')
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

  function renderInvoicesQuotesTab(tc) {
    const settings = store.getSettings();
    let dt = JSON.parse(JSON.stringify(settings.documentTheme || {}));
    let activePreviewTab = 'invoice';

    const mockData = {
      number: 'INV-10023',
      status: 'Sent',
      customerName: 'Acme Developments Pty Ltd',
      contactName: 'Jane Smith',
      issueDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      jobNumber: 'J-88129',
      originalQuoteNumber: 'Q-54412',
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

                <div style="font-weight:700; font-size:12px; color:var(--color-primary); text-transform:uppercase; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-top:8px">Quote Options</div>
                <div class="form-group">
                  <label class="form-label">Quote Document Title</label>
                  <input type="text" class="form-input text-copy-input" data-prop="quoteTitle" value="${escapeHTML(dt.quoteTitle || 'PROPOSAL / QUOTE')}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Quote Validity / General Terms</label>
                  <textarea class="form-input text-copy-input" data-prop="quoteTerms" rows="2" placeholder="Quote valid for...">${escapeHTML(dt.quoteTerms || '')}</textarea>
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
            paymentStripe: true,
            paymentDirectTransfer: true,
            paymentCash: false,
            quoteSignature: true,
            footerNote: 'Thank you for your business!'
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

      const invoicePaymentTermsInp = tc.querySelector('[data-prop="invoicePaymentTerms"]');
      if (invoicePaymentTermsInp) invoicePaymentTermsInp.value = dt.invoicePaymentTerms || '';

      const invoiceTermsInp = tc.querySelector('[data-prop="invoiceTerms"]');
      if (invoiceTermsInp) invoiceTermsInp.value = dt.invoiceTerms || '';

      const quoteTitleInp = tc.querySelector('[data-prop="quoteTitle"]');
      if (quoteTitleInp) quoteTitleInp.value = dt.quoteTitle || '';

      const quoteTermsInp = tc.querySelector('[data-prop="quoteTerms"]');
      if (quoteTermsInp) quoteTermsInp.value = dt.quoteTerms || '';

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
    }

    renderMarkup();
  }



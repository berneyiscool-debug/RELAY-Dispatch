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
        <button class="tab ${activeTab === 'assets' ? 'active' : ''}" data-tab="assets">Assets</button>
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

    if (activeTab === 'company') {
      const s = store.getSettings();
      // Use local variables to track changes before saving
      let pendingLogo = s.logo;
      
      const renderCompanyTab = () => {
        tc.innerHTML = `
          <div class="card" style="max-width:800px">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 280px; gap:var(--space-lg)">
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${s.name || 'FieldForge Demo Company'}" id="company-name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${s.abn || '12 345 678 901'}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${s.phone || '1300 123 456'}" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Company Domain</label>
                    <input class="form-input" value="${s.email || 'fieldforge.io'}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2">${s.address || '123 Business St, Melbourne VIC 3000'}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; align-items:center; text-align:center">
                  <label class="form-label" style="align-self:flex-start">Company Logo</label>
                  <div id="logo-preview-container" style="width:100%; aspect-ratio:1; margin:12px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                    ${pendingLogo ? `<img src="${pendingLogo}" style="max-width:90%; max-height:90%; object-fit:contain" />` : `
                      <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
                        <span class="material-icons-outlined" style="font-size:48px">image</span>
                        <span style="font-size:12px; margin-top:8px">No custom logo</span>
                      </div>
                    `}
                  </div>
                  <input type="file" id="logo-upload" accept="image/*" style="display:none" />
                  <div style="display:flex; flex-direction:column; gap:8px; width:100%">
                    <button class="btn btn-secondary btn-sm" id="btn-upload-logo" style="width:100%">
                      <span class="material-icons-outlined" style="font-size:16px">upload</span> Upload Logo
                    </button>
                    ${pendingLogo ? `<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>` : ''}
                  </div>
                  <div id="unsaved-logo-hint" style="display:none; margin-top:8px; color:var(--color-warning); font-size:11px; font-weight:600">UNSAVED PREVIEW</div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary" id="btn-save-company">
                <span class="material-icons-outlined">save</span> Save Company Changes
              </button>
            </div>
          </div>
        `;

        // Handlers for Company Tab
        const logoInput = tc.querySelector('#logo-upload');
        tc.querySelector('#btn-upload-logo').addEventListener('click', () => logoInput.click());
        
        logoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              pendingLogo = re.target.result;
              // Update ONLY the preview area and show hint
              const container = tc.querySelector('#logo-preview-container');
              container.innerHTML = `<img src="${pendingLogo}" style="max-width:90%; max-height:90%; object-fit:contain" />`;
              tc.querySelector('#unsaved-logo-hint').style.display = 'block';
              showToast('Logo preview updated. Click Save to apply.', 'info');
            };
            reader.readAsDataURL(file);
          }
        });

        tc.querySelector('#btn-remove-logo')?.addEventListener('click', () => {
          pendingLogo = null;
          const container = tc.querySelector('#logo-preview-container');
          container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `;
          tc.querySelector('#unsaved-logo-hint').style.display = 'block';
          tc.querySelector('#btn-remove-logo').style.display = 'none';
        });

        tc.querySelector('#btn-save-company').addEventListener('click', () => {
          const settings = store.getSettings();
          settings.name = tc.querySelector('#company-name').value;
          settings.abn = tc.querySelector('#company-abn').value;
          settings.phone = tc.querySelector('#company-phone').value;
          settings.email = tc.querySelector('#company-domain').value;
          settings.address = tc.querySelector('#company-address').value;
          settings.logo = pendingLogo;
          
          store.saveSettings(settings);
          showToast('Company information saved permanently', 'success');
          tc.querySelector('#unsaved-logo-hint').style.display = 'none';
          window.dispatchEvent(new CustomEvent('simpro-settings-updated'));
        });
      };

      renderCompanyTab();
    } else if (activeTab === 'users') {
      const techs = store.getAll('technicians');
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
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Active Users</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-user"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:40px"></th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>User Type</th>
                  <th>Email</th>
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
                      <td class="text-tertiary">${t.email || '-'}</td>
                      <td class="text-secondary">${t.payRate ? `$${t.payRate.toFixed(2)}/hr` : '-'}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${t.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${t.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
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
            <button class="btn btn-secondary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> New Type</button>
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
              <div class="form-group">
                <label class="form-label">Default Tax Rate (GST)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input class="form-input" type="number" value="10" style="width:100px" disabled /> <span class="text-secondary">%</span>
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
            <button class="btn btn-primary btn-sm" id="add-rate-btn">
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
                      <label class="form-label">Charge-out Rate ($/hr)</label>
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
                      <label class="form-label">Min Call-out Fee ($)</label>
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
            <button class="btn btn-primary" id="save-tax-settings">
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
              <label class="form-label">Charge-out Rate ($/hr)</label>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--text-secondary)">$</span>
                <input class="form-input rate-val" type="number" value="0.00" min="0" step="0.50" style="width:120px" />
              </div>
            </div>
            <!-- Overtime Multiplier (hidden) -->
            <input type="hidden" class="rate-multiplier" value="1.0" />
            <div class="form-group" style="margin:0">
              <label class="form-label">Min Call-out Fee ($)</label>
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
      tc.querySelector('#save-tax-settings').addEventListener('click', () => {
        const markupPercent = parseFloat(tc.querySelector('#global-markup').value) || 0;
        const laborRounding = parseInt(tc.querySelector('#labor-rounding').value) || 15;
        const laborRates = _collectRates(tc);
        const settings = store.getSettings();
        settings.markupPercent = markupPercent;
        settings.laborRounding = laborRounding;
        settings.laborRates = laborRates;
        
        // Save rate mappings
        settings.rateMappings = {};
        tc.querySelectorAll('.rate-mapping').forEach(sel => {
          if (sel.value) settings.rateMappings[sel.dataset.type] = sel.value;
        });

        store.saveSettings(settings);
        showToast('Financial and Rate settings saved', 'success');
        renderContent();
      });

    } else if (activeTab === 'assets') {
      const settings = store.getSettings();
      const assets = store.getAll('assets').filter(a => a.category === 'Business');
      
      tc.innerHTML = `
        <div class="card" style="max-width:800px">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4 style="margin:0">Business Asset Defaults</h4>
            <div class="badge badge-info">Recovery Automation Enabled</div>
          </div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:13px; margin-bottom:20px">Configure the default recovery rates for your business equipment. These rates are used to calculate internal job costs when assets are assigned to tasks.</p>
            
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Current Rate ($/hr)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${assets.map(a => `
                  <tr>
                    <td class="font-medium">${escapeHTML(a.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${a.id}" value="${a.recoveryRate || 0}" step="0.5" style="width:100px; height:32px" />
                      </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `).join('')}
                ${assets.length === 0 ? '<tr><td colspan="3" class="text-center text-tertiary" style="padding:24px">No business assets found. Add assets in the main Assets module.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="btn-save-asset-settings">Save Asset Recovery Rates</button>
          </div>
        </div>
      `;

      tc.querySelector('#btn-save-asset-settings').addEventListener('click', () => {
        tc.querySelectorAll('.asset-rate-input').forEach(inp => {
          const id = inp.dataset.id;
          const rate = parseFloat(inp.value) || 0;
          store.update('assets', id, { recoveryRate: rate });
        });
        showToast('Asset recovery rates updated across the system', 'success');
      });

    } else if (activeTab === 'system') {
      tc.innerHTML = `
        <div class="card" style="max-width:480px">
          <div class="card-header"><h4>Data Management</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="margin-bottom:var(--space-lg)">Manage your application data. All data is stored locally in your browser.</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <button class="btn btn-secondary" id="btn-reset-data">
                <span class="material-icons-outlined">refresh</span> Reset to Demo Data
              </button>
              <button class="btn btn-danger" id="btn-clear-data">
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
                  <button class="btn btn-secondary" id="btn-seed-minimal" style="width:100%; justify-content:center; margin-bottom:12px; border:1px solid rgba(0,0,0,0.12)">
                    <span class="material-icons-outlined">science</span> Seed One Example Version
                  </button>
                  <button class="btn btn-danger" id="btn-restore-new" style="width:100%; justify-content:center;">
                    <span class="material-icons-outlined">cleaning_services</span> Restore to New (Blank State)
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

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
    let t = editId ? store.getById('technicians', editId) : { name: '', role: '', color: '#1B6DE0', email: '', userTypeId: '' };
    const userTypes = store.getAll('userTypes');
    
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${t.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${t.email || ''}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${t.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${userTypes.map(ut => `
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
        { label: 'Save', className: 'btn-primary', onClick: c => {
          const name = document.getElementById('u-name').value;
          const email = document.getElementById('u-email').value;
          const role = document.getElementById('u-role').value;
          const userTypeId = document.getElementById('u-type').value;
          const color = document.getElementById('u-color').value;
          const payRate = parseFloat(document.getElementById('u-payrate').value) || null;
          
          if (!name) { showToast('Name required', 'error'); return; }
          
          if (editId) {
            store.update('technicians', editId, { name, email, role, userTypeId, color, payRate });
          } else {
            store.create('technicians', { name, email, role, userTypeId, color, payRate });
          }
          showToast('User saved', 'success');
          renderContent();
          c();
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
          <button class="btn btn-primary btn-sm" id="btn-add-template">
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
                  ${!isInfoPanelEditing ? `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${escapeHTML(node.name)}">${escapeHTML(node.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${path.length < 3 ? `<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>` : ''}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${path.join('-')}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${escapeHTML(node.name)}</div>
                    </div>
                    ${hasSubs ? `
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${calculateTotalHours(node)} hrs</div>
                      </div>
                    ` : `
                      <div style="display:flex; gap:16px; margin-bottom:12px">
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Estimated Hours</div>
                          <div style="font-size:14px; font-weight:500">${node.estimatedHours || 0} hrs</div>
                        </div>
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">People</div>
                          <div style="font-size:14px; font-weight:500">${node.people || 1}</div>
                        </div>
                      </div>
                    `}
                    <div style="margin-top:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Description</div>
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${escapeHTML(node.description || 'No description provided.')}</div>
                    </div>
                  ` : `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${path.join('-')}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
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
                    <div class="form-group" style="margin-bottom:0">
                      <label class="form-label" style="font-size:11px">Description</label>
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${escapeHTML(node.description || '')}</textarea>
                    </div>
                  `}
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
      };

      renderTemplateEditor();

      showModal({
        title: editId ? 'Edit Tasklist Template' : 'Create Tasklist Template',
        content,
        size: 'modal-lg',
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
          <button class="btn btn-primary btn-sm" id="btn-add-quote-template">
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
          <button class="btn btn-primary" id="btn-save-materials">Save Material Settings</button>
        </div>
      </div>
    `;

    // --- Handlers ---
    const save = () => {
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
      
      store.saveSettings(updatedSettings);
      showToast('Material settings saved', 'success');
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
          <button class="btn btn-primary btn-sm" id="btn-add-form-template">
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



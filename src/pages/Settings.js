// ============================================
// SIMPRO CLONE — SETTINGS PAGE
// ============================================

import { store } from '../data/store.js';
import { showToast } from '../components/Notifications.js';
import { showModal } from '../components/Modal.js';

// ---- Granular Permission Definitions ----
export const MODULE_PERMS = {
  'Dashboard': [
    { key: 'view', label: 'View Dashboard' },
  ],
  'Customers': [
    { key: 'view', label: 'View Customers' },
    { key: 'create', label: 'Create Customers' },
    { key: 'edit', label: 'Edit Customer Details' },
    { key: 'delete', label: 'Delete Customers' },
    { key: 'manage_contacts', label: 'Manage Contacts & Sites' },
  ],
  'Leads': [
    { key: 'view', label: 'View Leads' },
    { key: 'create', label: 'Create Leads' },
    { key: 'edit', label: 'Edit Leads' },
    { key: 'delete', label: 'Delete Leads' },
    { key: 'convert', label: 'Convert Lead to Quote / Job' },
  ],
  'Quotes': [
    { key: 'view', label: 'View Quotes' },
    { key: 'create', label: 'Create Quotes' },
    { key: 'edit', label: 'Edit Quotes' },
    { key: 'delete', label: 'Delete Quotes' },
    { key: 'approve', label: 'Approve / Accept Quotes' },
    { key: 'convert', label: 'Convert to Job' },
    { key: 'generate_pdf', label: 'Generate & Save PDF' },
  ],
  'Jobs': [
    { key: 'view', label: 'View Jobs' },
    { key: 'create', label: 'Create Jobs' },
    { key: 'edit', label: 'Edit Job Details' },
    { key: 'delete', label: 'Delete Jobs' },
    { key: 'manage_tasks', label: 'Manage Tasks & Phases' },
    { key: 'book_time', label: 'Book Time to Tasks' },
    { key: 'view_costs', label: 'View Costs & Financials' },
    { key: 'manage_materials', label: 'Manage Materials & Stock' },
    { key: 'create_invoice', label: 'Create Invoices from Job' },
  ],
  'Timesheets': [
    { key: 'view_own', label: 'View Own Timesheets' },
    { key: 'view', label: 'View All Timesheets' },
    { key: 'create', label: 'Create Timesheet Entries' },
    { key: 'edit', label: 'Edit Timesheets' },
    { key: 'approve', label: 'Approve Timesheets' },
    { key: 'delete', label: 'Delete Timesheets' },
  ],
  'Assets': [
    { key: 'view', label: 'View Assets' },
    { key: 'create', label: 'Add Assets' },
    { key: 'edit', label: 'Edit Assets' },
    { key: 'delete', label: 'Delete Assets' },
  ],
  'Schedule': [
    { key: 'view_own', label: 'View Own Schedule' },
    { key: 'view', label: 'View All Technicians\' Schedules' },
    { key: 'create', label: 'Create Bookings' },
    { key: 'edit', label: 'Edit / Move Bookings' },
    { key: 'delete', label: 'Delete Bookings' },
  ],
  'Contractors': [
    { key: 'view', label: 'View Contractors' },
    { key: 'create', label: 'Add Contractors' },
    { key: 'edit', label: 'Edit Contractors' },
    { key: 'delete', label: 'Delete Contractors' },
  ],
  'Stock': [
    { key: 'view', label: 'View Stock' },
    { key: 'create', label: 'Add Stock Items' },
    { key: 'edit', label: 'Edit Stock Items' },
    { key: 'delete', label: 'Delete Stock Items' },
    { key: 'transfer', label: 'Transfer Stock Between Locations' },
    { key: 'adjust', label: 'Adjust Stock Quantities' },
  ],
  'Purchase Orders': [
    { key: 'view', label: 'View Purchase Orders' },
    { key: 'create', label: 'Create Purchase Orders' },
    { key: 'edit', label: 'Edit Purchase Orders' },
    { key: 'delete', label: 'Delete Purchase Orders' },
    { key: 'approve', label: 'Approve Purchase Orders' },
  ],
  'Invoices': [
    { key: 'view', label: 'View Invoices' },
    { key: 'create', label: 'Create Invoices' },
    { key: 'edit', label: 'Edit Invoices' },
    { key: 'delete', label: 'Delete Invoices' },
    { key: 'record_payment', label: 'Record Payments' },
    { key: 'generate_pdf', label: 'Generate & Save PDF' },
  ],
  'Documents': [
    { key: 'view', label: 'View Documents' },
    { key: 'upload', label: 'Upload Documents' },
    { key: 'delete', label: 'Delete Documents' },
  ],
  'Reports': [
    { key: 'view', label: 'View Reports' },
    { key: 'export', label: 'Export Reports' },
  ],
  'Settings': [
    { key: 'view', label: 'View Settings' },
    { key: 'edit_company', label: 'Edit Company Information' },
    { key: 'manage_users', label: 'Manage Users' },
    { key: 'manage_permissions', label: 'Manage User Types & Permissions' },
    { key: 'manage_tax', label: 'Manage Tax & Labor Rates' },
  ],
};

// Build a permissions array with all granular keys
function buildGranularPerms(valueFn) {
  return Object.entries(MODULE_PERMS).map(([module, perms]) => {
    const obj = { module };
    perms.forEach(({ key }) => { obj[key] = valueFn(module, key); });
    return obj;
  });
}

export function renderSettings(container) {
  let activeTab = 'company';
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{"role":"admin"}');

  function render() {
    container.innerHTML = `
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${activeTab === 'company' ? 'active' : ''}" data-tab="company">Company</button>
        <button class="tab ${activeTab === 'users' ? 'active' : ''}" data-tab="users">Users & Permissions</button>
        <button class="tab ${activeTab === 'tax' ? 'active' : ''}" data-tab="tax">Tax &amp; Rates</button>
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

    if (activeTab === 'company') {
      tc.innerHTML = `
        <div class="card" style="max-width:600px">
          <div class="card-header"><h4>Company Information</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input class="form-input" value="SimPro Demo Company" id="company-name" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">ABN</label>
                <input class="form-input" value="12 345 678 901" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input class="form-input" value="1300 123 456" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Company Domain</label>
              <input class="form-input" value="simprogroup.com.au" placeholder="e.g. yourcompany.com.au" />
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea class="form-textarea" rows="2">123 Business St, Melbourne VIC 3000</textarea>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" onclick="document.dispatchEvent(new CustomEvent('save-settings'))">
              <span class="material-icons-outlined">save</span> Save Changes
            </button>
          </div>
        </div>
      `;
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
            }) },
          { id: 'ut_tech', name: 'Technician', description: 'Field staff with limited access',
            permissions: buildGranularPerms((mod, key) => {
              if (mod === 'Dashboard') return key === 'view';
              if (mod === 'Jobs') return ['view', 'manage_tasks', 'book_time'].includes(key);
              if (mod === 'Timesheets') return ['view_own', 'create'].includes(key);
              if (mod === 'Schedule') return ['view_own'].includes(key);
              return false;
            }) },
        ];
        store.save('userTypes', userTypes);
      }

      const activeTechs = techs.filter(t => !t.deactivated);
      const deactivatedTechs = techs.filter(t => t.deactivated);

      tc.innerHTML = `
        <!-- ACTIVE USERS TABLE -->
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0">Active Users</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">${activeTechs.length} active user${activeTechs.length !== 1 ? 's' : ''} — contributing to subscription</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-user"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Role / Job</th><th>User Type</th><th>Actions</th></tr></thead>
              <tbody>
                ${activeTechs.length === 0 ? '<tr><td colspan="5" class="text-secondary" style="text-align:center;padding:24px">No active users</td></tr>' : activeTechs.map(t => {
                  const ut = userTypes.find(u => u.id === t.userTypeId);
                  const isAdminType = ut && ut.name.toLowerCase().includes('admin');
                  return `
                  <tr>
                    <td><div style="width:8px;height:8px;border-radius:50%;background:${t.color}"></div></td>
                    <td class="font-medium">${t.name} ${isAdminType ? '<span class="material-icons-outlined" style="font-size:14px;vertical-align:middle;color:var(--color-warning)" title="Admin user">shield</span>' : ''}</td>
                    <td class="text-secondary">${t.role}</td>
                    <td><span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); padding:4px 8px; border-radius:12px; font-size:var(--font-size-xs)">${ut ? ut.name : 'Unassigned'}</span></td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm btn-secondary btn-edit-user" data-id="${t.id}">Edit</button>
                        <button class="btn btn-sm btn-danger btn-deactivate-user" data-id="${t.id}" ${isAdminType ? 'disabled style="opacity:0.4;cursor:not-allowed" title="Cannot deactivate an Admin"' : 'title="Deactivate user"'}>
                          <span class="material-icons-outlined" style="font-size:14px;pointer-events:none">person_off</span> Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- DEACTIVATED USERS -->
        ${deactivatedTechs.length > 0 ? `
        <div class="card" style="margin-bottom:var(--space-lg); border-color: var(--border-color); opacity:0.85">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-color)">
            <div>
              <h4 style="margin:0; color:var(--text-secondary)">Deactivated Users</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">${deactivatedTechs.length} deactivated — not contributing to subscription</p>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Role / Job</th><th>Deactivated On</th><th>Reactivate Available</th><th>Actions</th></tr></thead>
              <tbody>
                ${deactivatedTechs.map(t => {
                  const deactivatedAt = t.deactivatedAt ? new Date(t.deactivatedAt) : null;
                  const reactivateAfter = deactivatedAt ? new Date(deactivatedAt.getTime() + 30 * 24 * 3600 * 1000) : null;
                  const now = new Date();
                  const canReactivate = reactivateAfter && now >= reactivateAfter;
                  const daysLeft = reactivateAfter ? Math.ceil((reactivateAfter - now) / (24 * 3600 * 1000)) : null;
                  const ut = userTypes.find(u => u.id === t.userTypeId);
                  return `
                  <tr style="opacity:0.75">
                    <td><div style="width:8px;height:8px;border-radius:50%;background:#94a3b8"></div></td>
                    <td class="font-medium" style="color:var(--text-secondary)">${t.name}</td>
                    <td class="text-secondary">${t.role}</td>
                    <td class="text-secondary" style="font-size:var(--font-size-sm)">${deactivatedAt ? deactivatedAt.toLocaleDateString() : '—'}</td>
                    <td style="font-size:var(--font-size-sm)">
                      ${canReactivate
                        ? '<span style="color:var(--color-success)">Available now</span>'
                        : `<span style="color:var(--text-tertiary)">In ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</span>`}
                    </td>
                    <td>
                      <button class="btn btn-sm ${canReactivate ? 'btn-primary' : 'btn-ghost'} btn-reactivate-user"
                        data-id="${t.id}"
                        ${!canReactivate ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}
                        title="${canReactivate ? 'Reactivate this user' : `Cannot reactivate for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}`}">
                        <span class="material-icons-outlined" style="font-size:14px;pointer-events:none">person_add</span> Reactivate
                      </button>
                    </td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- USER TYPES & PERMISSIONS -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0">User Types &amp; Permissions</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">Control which pages and actions each user type can access. If no permissions are ticked for a page, it will be hidden from users of that type.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>User Type</th><th>Description</th><th>Active Users</th><th>Actions</th></tr></thead>
              <tbody>
                ${userTypes.map(ut => {
                  const userCount = activeTechs.filter(t => t.userTypeId === ut.id).length;
                  const isAdmin = ut.name.toLowerCase().includes('admin');
                  return `
                  <tr>
                    <td class="font-medium" style="display:flex;align-items:center;gap:8px">
                      ${isAdmin ? '<span class="material-icons-outlined" style="font-size:16px;color:var(--color-warning)">shield</span>' : '<span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">person</span>'}
                      ${ut.name}
                    </td>
                    <td class="text-secondary">${ut.description}</td>
                    <td><span class="badge badge-neutral">${userCount} user${userCount !== 1 ? 's' : ''}</span></td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-secondary btn-edit-perms" data-id="${ut.id}">Edit Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${ut.id}">Rename</button>
                        ${isAdmin ? `<button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${ut.id}" title="Cannot delete Admin type" disabled style="opacity:0.4;cursor:not-allowed"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">shield</span></button>` : `<button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${ut.id}" title="Delete"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">delete</span></button>`}
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

      tc.querySelector('#btn-add-user')?.addEventListener('click', () => {
        openUserModal();
      });

      tc.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          openUserModal(e.target.dataset.id);
        });
      });

      tc.querySelectorAll('.btn-deactivate-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const t = store.getById('technicians', id);
          if (!t) return;
          const ut = userTypes.find(u => u.id === t.userTypeId);
          if (ut && ut.name.toLowerCase().includes('admin')) {
            showToast('Cannot deactivate an Admin user.', 'error');
            return;
          }
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `
            <p>Are you sure you want to deactivate <strong>${t.name}</strong>?</p>
            <ul style="margin:12px 0 0 16px; color:var(--text-secondary); font-size:var(--font-size-sm); line-height:1.8">
              <li>They will lose all system access immediately</li>
              <li>Their data will be preserved</li>
              <li>They will no longer count toward your subscription</li>
              <li><strong>They cannot be reactivated for 30 days</strong></li>
            </ul>
          `;
          showModal({
            title: 'Deactivate User',
            content: contentDiv,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
              { label: 'Deactivate', className: 'btn-danger', onClick: c => {
                store.update('technicians', id, {
                  deactivated: true,
                  deactivatedAt: new Date().toISOString(),
                  userTypeId: null // strip permissions
                });
                showToast(`${t.name} has been deactivated.`, 'warning');
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
                showToast(`${t.name} has been reactivated. Assign a User Type to restore access.`, 'success');
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
    } else if (activeTab === 'tax') {
      const settings = store.getSettings();
      tc.innerHTML = `
        <div class="card" style="max-width:540px">
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
                <input class="form-input" id="global-markup" type="number" value="${settings.markupPercent}" style="width:100px" /> <span class="text-secondary">%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="max-width:540px;margin-top:var(--space-lg)">
          <div class="card-header"><h4>Labor Rate Profiles</h4></div>
          <div class="card-body">
            <div id="labor-rates-container" style="display:flex;flex-direction:column;gap:12px;">
              ${settings.laborRates.map((rate) => `
                <div class="form-row labor-rate-row" data-id="${rate.id}" style="align-items:flex-end;margin-bottom:0">
                  <div class="form-group" style="margin-bottom:0;flex:1">
                    <label class="form-label">Profile Name</label>
                    <input class="form-input rate-name" value="${rate.name}" />
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label class="form-label">Rate ($/hr)</label>
                    <input class="form-input rate-val" type="number" value="${rate.rate.toFixed(2)}" step="0.01" style="width:140px" />
                  </div>
                  <button class="btn btn-danger btn-icon remove-rate-btn">
                    <span class="material-icons-outlined">delete</span>
                  </button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-secondary mt-3" id="add-rate-btn" style="width:100%;margin-top:16px;">
              <span class="material-icons-outlined">add</span> Add Rate Profile
            </button>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="save-tax-settings">
              <span class="material-icons-outlined">save</span> Save Settings
            </button>
          </div>
        </div>
      `;

      tc.querySelector('#add-rate-btn').addEventListener('click', () => {
        const id = 'rate_' + Math.random().toString(36).substring(2, 9);
        const container = tc.querySelector('#labor-rates-container');
        const div = document.createElement('div');
        div.className = 'form-row labor-rate-row';
        div.dataset.id = id;
        div.style.alignItems = 'flex-end';
        div.style.marginBottom = '12px';
        div.innerHTML = `
          <div class="form-group" style="margin-bottom:0;flex:1">
            <label class="form-label">Profile Name</label>
            <input class="form-input rate-name" value="New Profile" />
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Rate ($/hr)</label>
            <input class="form-input rate-val" type="number" value="0.00" step="0.01" style="width:140px" />
          </div>
          <button class="btn btn-danger btn-icon remove-rate-btn">
            <span class="material-icons-outlined">delete</span>
          </button>
        `;
        container.appendChild(div);
      });

      tc.addEventListener('click', (e) => {
        if (e.target.closest('.remove-rate-btn')) {
          e.target.closest('.labor-rate-row').remove();
        }
      });

      tc.querySelector('#save-tax-settings').addEventListener('click', () => {
        const markupPercent = parseFloat(tc.querySelector('#global-markup').value) || 0;
        const laborRates = Array.from(tc.querySelectorAll('.labor-rate-row')).map(row => {
          return {
            id: row.dataset.id,
            name: row.querySelector('.rate-name').value,
            rate: parseFloat(row.querySelector('.rate-val').value) || 0
          };
        });
        
        settings.markupPercent = markupPercent;
        settings.laborRates = laborRates;
        store.saveSettings(settings);
        document.dispatchEvent(new CustomEvent('save-settings'));
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
    } else if (activeTab === 'permissions' && currentUser.role === 'admin') {
      let userTypes = store.getAll('userTypes');
      if (!userTypes || userTypes.length === 0) {
        const baseModules = ['Dashboard', 'Customers', 'Leads', 'Quotes', 'Jobs', 'Timesheets', 'Assets', 'Schedule', 'Contractors', 'Stock', 'Purchase Orders', 'Invoices', 'Documents', 'Reports', 'Settings'];
        const buildPerms = (all) => baseModules.map(m => ({ module: m, view: all, create: all, edit: all, delete: all }));
        userTypes = [
          { id: 'ut_admin', name: 'Admin', description: 'Full system access', permissions: buildPerms(true) },
          { id: 'ut_manager', name: 'Manager', description: 'Can manage most workflows but limited settings', permissions: buildPerms(true).map(p => p.module === 'Settings' ? {...p, edit:false, delete:false, create:false} : p) },
          { id: 'ut_tech', name: 'Technician', description: 'Field staff with limited access', permissions: buildPerms(false).map(p => ['Dashboard', 'Jobs', 'Timesheets', 'Schedule'].includes(p.module) ? {...p, view:true, create: p.module!=='Dashboard', edit: p.module!=='Dashboard'} : p) }
        ];
        store.save('userTypes', userTypes);
      }

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">User Types & Permissions</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>User Type</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${userTypes.map(ut => `
                  <tr>
                    <td class="font-medium">${ut.name}</td>
                    <td class="text-secondary">${ut.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-secondary btn-edit-perms" data-id="${ut.id}">Edit Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-view-usertype" data-id="${ut.id}">View Info</button>
                        <button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${ut.id}" title="Delete"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">delete</span></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-usertype')?.addEventListener('click', () => {
         openUserTypeModal();
      });

      tc.querySelectorAll('.btn-edit-perms').forEach(btn => {
        btn.addEventListener('click', (e) => {
          openPermissionsModal(e.target.dataset.id);
        });
      });

      tc.querySelectorAll('.btn-view-usertype').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const ut = store.getById('userTypes', e.target.dataset.id);
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `<p><strong>Name:</strong> ${ut.name}</p><p><strong>Description:</strong> ${ut.description}</p>`;
          showModal({
             title: 'User Type Info',
             content: contentDiv,
             actions: [
               { label: 'Close', className: 'btn-secondary', onClick: (c) => c() },
               { label: 'Edit', className: 'btn-primary', onClick: (c) => { c(); openUserTypeModal(ut.id); } }
             ]
          });
        });
      });

      tc.querySelectorAll('.btn-delete-usertype').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          const ut = store.getById('userTypes', id);
          if (!ut) return;
          
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = `<p>Are you sure you want to delete the user type <strong>${ut.name}</strong>? This action cannot be undone.</p>`;
          
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
         
         document.querySelector('.tab[data-tab="permissions"]')?.click();
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

    // Ensure permissions exist for all module keys (migrate old data)
    const existingPerms = ut.permissions || [];
    const permsMap = {};
    existingPerms.forEach(p => { permsMap[p.module] = p; });

    const contentDiv = document.createElement('div');

    const moduleSections = Object.entries(MODULE_PERMS).map(([module, permDefs]) => {
      const existing = permsMap[module] || {};
      const allChecked = permDefs.every(({ key }) => existing[key]);
      const anyChecked = permDefs.some(({ key }) => existing[key]);
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
    // Sync module-level toggle when individual checkboxes change
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
          
          if (!name) { showToast('Name required', 'error'); return; }
          
          if (editId) {
            store.update('technicians', editId, { name, email, role, userTypeId, color });
          } else {
            store.create('technicians', { name, email, role, userTypeId, color });
          }
          showToast('User saved', 'success');
          
          document.querySelector('.tab[data-tab="users"]')?.click();
          c();
        }}
      ]
    });
  }

  document.addEventListener('save-settings', () => showToast('Settings saved', 'success'));

  render();
}

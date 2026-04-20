// ============================================
// SIMPRO CLONE — SETTINGS PAGE
// ============================================

import { store } from '../data/store.js';
import { showToast } from '../components/Notifications.js';

export function renderSettings(container) {
  let activeTab = 'company';

  function render() {
    container.innerHTML = `
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${activeTab === 'company' ? 'active' : ''}" data-tab="company">Company</button>
        <button class="tab ${activeTab === 'users' ? 'active' : ''}" data-tab="users">Users & Technicians</button>
        <button class="tab ${activeTab === 'tax' ? 'active' : ''}" data-tab="tax">Tax & Rates</button>
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
              <label class="form-label">Email</label>
              <input class="form-input" value="admin@simprogroup.com" />
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
      tc.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h4>Technicians</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Role</th><th>Color</th></tr></thead>
              <tbody>
                ${techs.map(t => `
                  <tr>
                    <td><div style="width:8px;height:8px;border-radius:50%;background:${t.color}"></div></td>
                    <td class="font-medium">${t.name}</td>
                    <td class="text-secondary">${t.role}</td>
                    <td><span style="font-family:monospace;font-size:var(--font-size-sm)">${t.color}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" style="margin-top:var(--space-lg);max-width:480px">
          <div class="card-header"><h4>User Account</h4></div>
          <div class="card-body">
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
              <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),#3B95FF);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:var(--font-size-lg)">JD</div>
              <div>
                <div style="font-weight:600">John Doe</div>
                <div class="text-sm text-secondary">Administrator</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="john@simpro.com" /></div>
              <div class="form-group"><label class="form-label">Role</label><select class="form-select"><option selected>Administrator</option><option>Manager</option><option>Technician</option></select></div>
            </div>
          </div>
        </div>
      `;
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
    }
  }

  document.addEventListener('save-settings', () => showToast('Settings saved', 'success'));

  render();
}

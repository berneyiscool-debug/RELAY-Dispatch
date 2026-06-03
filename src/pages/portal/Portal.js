import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderCustomerPortal(container, params) {
  // Ensure the stored theme is applied on portal load
  const storedTheme = localStorage.getItem('simpro_theme') || 'light';
  document.documentElement.setAttribute('data-theme', storedTheme);

  const token = params.token;
  const customers = store.getAll('customers');
  const customer = customers.find(c => c.portalToken === token);

  const settings = store.getSettings();

  // If customer portal is disabled globally in settings
  if (settings.enableCustomerPortal === false) {
    container.innerHTML = `
      <div style="max-width: 500px; margin: 80px auto; padding: 40px; text-align: center; background: var(--card-bg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--border-color);">
        <span class="material-icons-outlined text-warning" style="font-size: 64px; margin-bottom: 20px;">lock_clock</span>
        <h2 style="font-size: var(--font-size-3xl); margin-bottom: 12px; color: var(--text-primary);">Portal Access Offline</h2>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; font-size: var(--font-size-base);">
          The secure customer portal is currently undergoing scheduled maintenance or has been offline by the operations team. Please contact our main office for immediate assistance:
        </p>
        <div style="background: var(--content-bg); padding: 16px; border-radius: 6px; text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color);">
          <div><strong>Main Phone:</strong> ${escapeHTML(settings.phone || '(02) 6882 4400')}</div>
          <div><strong>Email support:</strong> ${escapeHTML(settings.email || 'admin@apexpowerservices.com.au')}</div>
        </div>
      </div>
    `;
    return;
  }

  // If token is invalid or missing
  if (!customer) {
    container.innerHTML = `
      <div style="max-width: 500px; margin: 80px auto; padding: 40px; text-align: center; background: var(--card-bg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--border-color);">
        <span class="material-icons-outlined text-danger" style="font-size: 64px; margin-bottom: 20px;">gpp_maybe</span>
        <h2 style="font-size: var(--font-size-3xl); margin-bottom: 12px; color: var(--text-primary);">Invalid Access Link</h2>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; font-size: var(--font-size-base);">
          This secure portal access link is invalid, expired, or has been revoked. Please check the URL or request a new magic access link from the main office:
        </p>
        <div style="background: var(--content-bg); padding: 16px; border-radius: 6px; text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color);">
          <div><strong>Main Phone:</strong> ${escapeHTML(settings.phone || '(02) 6882 4400')}</div>
          <div><strong>Email support:</strong> ${escapeHTML(settings.email || 'admin@apexpowerservices.com.au')}</div>
        </div>
      </div>
    `;
    return;
  }

  // Log last accessed date/time
  personLastAccessedLog(customer.id);

  // --- Magic Link PIN/Passcode Security Layer ---
  // If passcode is not configured, show First-Time Setup
  if (!customer.portalPasscode) {
    container.innerHTML = `
      <div class="customer-portal-shell" style="min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:20px; font-family:var(--font-family); background:var(--body-bg); position:relative;">
        <button class="btn btn-outline btn-sm" id="btn-portal-theme" title="Toggle theme" style="position: absolute; top: 20px; right: 20px; display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-primary);">
          <span class="material-icons-outlined" style="font-size: 18px;">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:32px 40px; max-width:420px; width:100%; box-shadow:var(--card-shadow); text-align:center; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="width:56px; height:56px; border-radius:50%; background:var(--color-success-bg); display:flex; align-items:center; justify-content:center; color:var(--color-success); margin:0 auto 20px auto;">
            <span class="material-icons-outlined" style="font-size:28px;">gpp_good</span>
          </div>
          <h2 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:var(--text-primary);">Secure Your Portal</h2>
          <p style="margin:0 0 24px 0; font-size:13px; color:var(--text-secondary); line-height:1.5;">
            Welcome, <strong>${escapeHTML(customer.firstName)}</strong>! To protect your invoices, quotes, and schedules, please set a 4-to-6 digit security PIN for this portal access link.
          </p>
          
          <form id="portal-setup-form" style="display:flex; flex-direction:column; gap:16px; text-align:left;">
            <div class="form-group">
              <label class="form-label" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; display:block;">Enter 4-to-6 Digit PIN</label>
              <input type="password" maxlength="6" id="portal-pin-1" class="form-input" placeholder="••••" required 
                     style="text-align:center; font-size:20px; letter-spacing:8px; padding:10px; width:100%; box-sizing:border-box; background: var(--body-bg); border:1px solid var(--border-color); color: var(--text-primary);" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; display:block;">Confirm Your PIN</label>
              <input type="password" maxlength="6" id="portal-pin-2" class="form-input" placeholder="••••" required 
                     style="text-align:center; font-size:20px; letter-spacing:8px; padding:10px; width:100%; box-sizing:border-box; background: var(--body-bg); border:1px solid var(--border-color); color: var(--text-primary);" />
            </div>
            
            <button type="submit" class="btn btn-primary" style="width:100%; padding:12px; font-weight:600; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
              <span class="material-icons-outlined" style="font-size:18px;">lock_open</span> Set PIN & Enter Portal
            </button>
          </form>
        </div>
      </div>
    `;

    container.querySelector('#portal-setup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = container.querySelector('#portal-pin-1').value.trim();
      const p2 = container.querySelector('#portal-pin-2').value.trim();

      if (p1.length < 4 || p1.length > 6 || !/^\d+$/.test(p1)) {
        showToast('PIN must be between 4 and 6 digits (numbers only)', 'error');
        return;
      }
      if (p1 !== p2) {
        showToast('PIN entries do not match', 'error');
        return;
      }

      // Save PIN
      const custs = store.getAll('customers');
      const idx = custs.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        custs[idx].portalPasscode = p1;
        store.save('customers', custs);
        customer.portalPasscode = p1; // update in-memory
      }

      // Set authenticated
      sessionStorage.setItem('portal_customer_auth_' + customer.id, 'true');
      showToast('PIN set successfully. Portal secured!', 'success');
      
      // Reload portal layout
      renderCustomerPortal(container, params);
    });

    container.querySelector('#btn-portal-theme')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('simpro_theme', next);
      renderCustomerPortal(container, params);
    });

    return;
  }

  // If passcode is set, check sessionStorage session
  const sessionKey = 'portal_customer_auth_' + customer.id;
  const isUnlocked = sessionStorage.getItem(sessionKey) === 'true';

  if (!isUnlocked) {
    container.innerHTML = `
      <div class="customer-portal-shell" style="min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:20px; font-family:var(--font-family); background:var(--body-bg); position:relative;">
        <button class="btn btn-outline btn-sm" id="btn-portal-theme" title="Toggle theme" style="position: absolute; top: 20px; right: 20px; display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-primary);">
          <span class="material-icons-outlined" style="font-size: 18px;">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:32px 40px; max-width:400px; width:100%; box-shadow:var(--card-shadow); text-align:center; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="width:56px; height:56px; border-radius:50%; background:var(--color-danger-bg); display:flex; align-items:center; justify-content:center; color:var(--color-danger); margin:0 auto 20px auto;">
            <span class="material-icons-outlined" style="font-size:28px;">lock</span>
          </div>
          <h2 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:var(--text-primary);">Secure Portal</h2>
          <p style="margin:0 0 24px 0; font-size:13px; color:var(--text-secondary); line-height:1.5;">
            This magic link is protected. Please enter the PIN configured for <strong>${escapeHTML(customer.company)}</strong> to unlock the dashboard.
          </p>
          
          <form id="portal-lock-form" style="display:flex; flex-direction:column; gap:16px; text-align:left;">
            <div class="form-group">
              <label class="form-label" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; display:block;">Enter Your Portal PIN</label>
              <input type="password" maxlength="6" id="portal-pin" class="form-input" placeholder="••••" required autofocus
                     style="text-align:center; font-size:24px; letter-spacing:10px; padding:12px; width:100%; box-sizing:border-box; background: var(--body-bg); border:1px solid var(--border-color); color: var(--text-primary);" />
            </div>
            
            <button type="submit" class="btn btn-primary" style="width:100%; padding:12px; font-weight:600; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
              <span class="material-icons-outlined" style="font-size:18px;">vpn_key</span> Unlock Dashboard
            </button>
          </form>
          
          <p style="font-size:11.5px; color:var(--text-tertiary); margin-top:24px; line-height:1.4;">
            Forgot your PIN? Please contact our main office at <strong>${escapeHTML(settings.phone || '(02) 6882 4400')}</strong> to request a reset.
          </p>
        </div>
      </div>
    `;

    container.querySelector('#portal-lock-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = container.querySelector('#portal-pin').value.trim();

      if (enteredPin === customer.portalPasscode) {
        sessionStorage.setItem(sessionKey, 'true');
        showToast('Dashboard unlocked successfully', 'success');
        renderCustomerPortal(container, params);
      } else {
        showToast('Incorrect Portal PIN. Please try again.', 'error');
        container.querySelector('#portal-pin').value = '';
        container.querySelector('#portal-pin').focus();
      }
    });

    container.querySelector('#btn-portal-theme')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('simpro_theme', next);
      renderCustomerPortal(container, params);
    });

    return;
  }

  // --- Dynamic Portal State ---
  let activeTab = 'dashboard'; // 'dashboard', 'jobs', 'quotes', 'invoices', 'assets', 'requests'
  let expandedJobId = null; 
  let expandedQuoteId = null;
  let expandedInvoiceId = null;
  let expandedAssetId = null;

  // Filters
  let jobFilter = 'all';
  let quoteFilter = 'all';
  let invoiceFilter = 'all';

  // State caches
  const expandedTaskPaths = new Set();
  const quoteDeclineReasons = {}; // jobId/quoteId -> reason text

  // Staged request confirmation status
  let requestSubmitted = false;

  function personLastAccessedLog(customerId) {
    const custs = store.getAll('customers');
    const cIdx = custs.findIndex(c => c.id === customerId);
    if (cIdx !== -1) {
      custs[cIdx].portalLastAccessed = new Date().toISOString();
      store.save('customers', custs);
    }
  }

  // --- Core Layout & Portal Style ---
  function render() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isStaff = currentUser.role && currentUser.role !== 'customer';

    const jobs = store.getAll('jobs').filter(j => j.customerId === customer.id);
    const quotes = store.getAll('quotes').filter(q => q.customerId === customer.id && q.status !== 'Draft');
    const invoices = store.getAll('invoices').filter(i => i.customerId === customer.id);
    const assets = store.getAll('assets').filter(a => a.ownerType === 'Customer' && a.customerId === customer.id);

    container.innerHTML = `
      <style>
        .customer-portal-shell {
          background: var(--body-bg);
          min-height: 100vh;
          font-family: var(--font-family);
          color: var(--text-primary);
          position: relative;
          overflow-x: hidden;
        }

        /* Decorative ambient glow orbs behind the glass dashboard */
        .customer-portal-shell::before {
          content: '';
          position: fixed;
          top: -10%;
          left: -10%;
          width: 50%;
          height: 50%;
          background: radial-gradient(circle, rgba(255, 92, 0, 0.08) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .customer-portal-shell::after {
          content: '';
          position: fixed;
          bottom: -10%;
          right: -10%;
          width: 45%;
          height: 45%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 60%);
          z-index: 0;
          pointer-events: none;
        }
        
        .portal-header {
          background: var(--topbar-bg);
          border-bottom: 1px solid var(--topbar-border);
          padding: 18px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--topbar-shadow);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          position: relative;
          z-index: 10;
        }

        .portal-logo-container {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .portal-logo-box {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          box-shadow: 0 4px 12px rgba(255, 92, 0, 0.1);
        }

        .portal-company-name {
          font-weight: 800;
          font-size: 17px;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .portal-client-title {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-tertiary);
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .portal-nav-bar {
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 6px;
          display: flex;
          gap: 6px;
          margin: 16px auto 28px auto;
          max-width: 1200px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: var(--shadow-sm);
        }
        [data-theme="dark"] .portal-nav-bar {
          background: rgba(24, 24, 27, 0.4);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .portal-nav-tab {
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .portal-nav-tab:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.15);
        }
        [data-theme="dark"] .portal-nav-tab:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .portal-nav-tab.active {
          color: var(--text-inverse) !important;
          background: var(--color-primary);
          box-shadow: 0 4px 14px rgba(255, 92, 0, 0.25);
          font-weight: 600;
        }
        [data-theme="dark"] .portal-nav-tab.active {
          color: var(--text-primary) !important;
          background: var(--color-primary-light);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        }

        .portal-body {
          padding: 0 24px 48px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
        }

        .portal-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          box-shadow: var(--card-shadow);
          margin-bottom: 24px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .portal-card-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.01);
          color: var(--text-primary);
        }

        .portal-card-body {
          padding: 24px;
        }

        .portal-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 28px;
        }

        .portal-stat-box {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: var(--card-shadow);
          color: var(--text-primary);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .portal-stat-box:hover {
          transform: translateY(-4px);
          box-shadow: var(--card-shadow-hover);
          border-color: var(--color-primary-light);
        }

        .portal-stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .timeline-item {
          position: relative;
          padding-left: 28px;
          border-left: 2px solid var(--border-color);
          padding-bottom: 20px;
          transition: all 0.25s ease;
        }
        .timeline-item:last-child {
          padding-bottom: 8px;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -7px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--border-color-dark);
          border: 2px solid var(--card-bg);
          box-shadow: var(--shadow-sm);
        }
        .timeline-item.client::before {
          background: var(--color-primary);
        }

        .accordion-header {
          padding: 18px 24px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-primary);
        }
        .accordion-header:hover {
          background-color: rgba(255, 92, 0, 0.03);
        }
        [data-theme="dark"] .accordion-header:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .accordion-body {
          padding: 24px;
          border-top: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.005);
        }

        .customer-portal-hero {
          background: linear-gradient(135deg, rgba(255, 92, 0, 0.85) 0%, rgba(30, 64, 175, 0.75) 100%);
          color: #ffffff;
          padding: 36px 32px;
          border-radius: 16px;
          margin-bottom: 28px;
          box-shadow: 0 20px 40px -15px rgba(255, 92, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .customer-portal-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
        }

        [data-theme="dark"] .customer-portal-hero {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.75) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
        }

        .portal-staff-banner {
          background: rgba(245, 158, 11, 0.15);
          border-bottom: 1px solid rgba(245, 158, 11, 0.25);
          color: var(--color-warning);
          padding: 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          backdrop-filter: blur(8px);
        }

        /* Modern theme blanket overrides to dynamically translate inline styles in Dark Mode */
        [data-theme="dark"] div[style*="background:#ffffff"],
        [data-theme="dark"] div[style*="background: #ffffff"],
        [data-theme="dark"] div[style*="background:#fff"],
        [data-theme="dark"] div[style*="background: #fff"] {
          background: var(--card-bg) !important;
        }

        [data-theme="dark"] div[style*="background:#f8fafc"],
        [data-theme="dark"] div[style*="background: #f8fafc"] {
          background: var(--bg-color) !important;
        }

        [data-theme="dark"] div[style*="border:1px solid #e2e8f0"],
        [data-theme="dark"] div[style*="border: 1px solid #e2e8f0"],
        [data-theme="dark"] div[style*="border-bottom:1px solid #e2e8f0"],
        [data-theme="dark"] div[style*="border-top:1px solid #e2e8f0"],
        [data-theme="dark"] div[style*="border-left:1.5px dashed #e2e8f0"],
        [data-theme="dark"] div[style*="border-top:1.5px solid #e2e8f0"] {
          border-color: var(--border-color) !important;
        }

        [data-theme="dark"] span[style*="color:#64748b"],
        [data-theme="dark"] span[style*="color: #64748b"],
        [data-theme="dark"] div[style*="color:#64748b"],
        [data-theme="dark"] div[style*="color: #64748b"] {
          color: var(--text-secondary) !important;
        }
        
        [data-theme="dark"] strong[style*="color:#0f172a"],
        [data-theme="dark"] strong[style*="color: #0f172a"],
        [data-theme="dark"] div[style*="color:#0f172a"],
        [data-theme="dark"] div[style*="color: #0f172a"] {
          color: var(--text-primary) !important;
        }

        /* Overrides for dynamic print preview */
        @media print {
          .customer-portal-shell { background: white; }
          .portal-nav-bar, .portal-header, .btn, textarea, select { display: none !important; }
        }
      </style>

      <div class="customer-portal-shell">
        <!-- Staff Impersonation Banner -->
        ${isStaff ? `
          <div class="portal-staff-banner">
            <span class="material-icons-outlined" style="font-size: 16px;">visibility</span>
            <span>Viewing as Customer: Staff preview mode active for <strong>${escapeHTML(customer.company)}</strong>. Changes will update database records.</span>
          </div>
        ` : ''}

        <!-- Header -->
        <header class="portal-header">
          <div class="portal-logo-container">
            <div class="portal-logo-box">
              <span class="material-icons-outlined" style="font-size: 24px;">bolt</span>
            </div>
            <div>
              <div class="portal-company-name">${escapeHTML(settings.name || 'Apex Power Services')}</div>
              <div class="portal-client-title">Client Access Portal</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <button class="btn btn-outline btn-sm" id="btn-portal-theme" title="Toggle theme" style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0;">
              <span class="material-icons-outlined" style="font-size: 18px;">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div style="text-align: right; font-size: 13px;">
              <div style="font-weight: 600; color: var(--text-primary);">${escapeHTML(customer.firstName)} ${escapeHTML(customer.lastName)}</div>
              <div style="color: var(--text-secondary); font-size:11px;">${escapeHTML(customer.company)}</div>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-portal-contact" style="display:flex; align-items:center; gap:6px;">
              <span class="material-icons-outlined" style="font-size: 16px;">support_agent</span> Contact Us
            </button>
          </div>
        </header>

        <!-- Navigation Tabs -->
        <nav class="portal-nav-bar">
          <button class="portal-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <span class="material-icons-outlined" style="font-size:18px;">space_dashboard</span> Dashboard
          </button>
          <button class="portal-nav-tab ${activeTab === 'jobs' ? 'active' : ''}" data-tab="jobs">
            <span class="material-icons-outlined" style="font-size:18px;">build</span> Jobs (${jobs.length})
          </button>
          <button class="portal-nav-tab ${activeTab === 'quotes' ? 'active' : ''}" data-tab="quotes">
            <span class="material-icons-outlined" style="font-size:18px;">request_quote</span> Quotes (${quotes.length})
          </button>
          <button class="portal-nav-tab ${activeTab === 'invoices' ? 'active' : ''}" data-tab="invoices">
            <span class="material-icons-outlined" style="font-size:18px;">receipt</span> Invoices (${invoices.length})
          </button>
          <button class="portal-nav-tab ${activeTab === 'assets' ? 'active' : ''}" data-tab="assets">
            <span class="material-icons-outlined" style="font-size:18px;">precision_manufacturing</span> Assets (${assets.length})
          </button>
          <button class="portal-nav-tab ${activeTab === 'requests' ? 'active' : ''}" data-tab="requests">
            <span class="material-icons-outlined" style="font-size:18px;">rate_review</span> Request Service
          </button>
        </nav>

        <!-- Content Area -->
        <main class="portal-body" id="portal-main-content">
          ${renderTabContent(jobs, quotes, invoices, assets)}
        </main>
      </div>
    `;

    bindPortalEvents(jobs, quotes, invoices, assets);
  }

  // --- Dynamic Tab Routing & Rendering ---
  function renderTabContent(jobs, quotes, invoices, assets) {
    if (activeTab === 'dashboard') {
      return renderDashboardTab(jobs, quotes, invoices, assets);
    }
    if (activeTab === 'jobs') {
      return renderJobsTab(jobs);
    }
    if (activeTab === 'quotes') {
      return renderQuotesTab(quotes);
    }
    if (activeTab === 'invoices') {
      return renderInvoicesTab(invoices);
    }
    if (activeTab === 'assets') {
      return renderAssetsTab(assets);
    }
    if (activeTab === 'requests') {
      return renderRequestsTab(assets);
    }
    return '';
  }

  // --- Tab 1: Dashboard Tab ---
  function renderDashboardTab(jobs, quotes, invoices, assets) {
    const openJobs = jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled' || j.status === 'Pending');
    const scheduledCount = jobs.filter(j => j.status === 'Scheduled').length;
    const inProgressCount = jobs.filter(j => j.status === 'In Progress').length;
    const pendingCount = jobs.filter(j => j.status === 'Pending').length;

    const outstandingInvoices = invoices.filter(i => i.status !== 'Paid');
    const outstandingTotal = outstandingInvoices.reduce((sum, inv) => {
      let sub = inv.subtotal;
      if (sub === undefined || sub === null) {
        const items = [];
        if (inv.sections) {
          inv.sections.forEach(sec => {
            if (sec.lineItems) items.push(...sec.lineItems);
          });
        } else if (inv.lineItems) {
          items.push(...inv.lineItems);
        }
        if (items.length > 0) {
          sub = items.reduce((s2, item) => s2 + (parseFloat(item.amount || item.total) || 0), 0);
        } else {
          sub = inv.total ? (inv.total / 1.1) : 0;
        }
      }
      const tax = inv.tax !== undefined && inv.tax !== null ? parseFloat(inv.tax) : (sub * 0.10);
      const tot = inv.total !== undefined && inv.total !== null ? parseFloat(inv.total) : (sub + tax);
      return sum + tot;
    }, 0);

    // Compute nearest maintenance date
    let nearestDate = 'None scheduled';
    let nearestPlan = null;
    const activePlans = store.getAll('maintenancePlans').filter(p => p.status === 'Active' && assets.some(a => a.id === p.assetId));
    
    // Sort plans by date
    const sortedPlans = activePlans
      .filter(p => p.triggerType === 'Calendar' && p.nextServiceDate)
      .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
      
    if (sortedPlans.length > 0) {
      nearestPlan = sortedPlans[0];
      nearestDate = new Date(nearestPlan.nextServiceDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Dynamic Activity Feed
    const events = [];
    jobs.forEach(j => {
      if (j.createdAt) {
        events.push({
          title: `Job ${j.number} Scheduled`,
          desc: `Job "${j.title}" is scheduled for dispatch.`,
          date: new Date(j.createdAt),
          icon: 'build',
          bg: 'var(--color-info-bg)',
          color: 'var(--color-info)'
        });
      }
      if (j.customerActivityLog) {
        j.customerActivityLog.forEach(log => {
          const isCustomerAuthor = log.isCustomer;
          events.push({
            title: isCustomerAuthor ? 'Your Status Update' : 'Office Comment',
            desc: log.content,
            date: new Date(log.date),
            icon: isCustomerAuthor ? 'person' : 'chat',
            bg: isCustomerAuthor ? 'var(--color-info-bg)' : 'var(--bg-color)',
            color: isCustomerAuthor ? 'var(--color-info)' : 'var(--text-secondary)'
          });
        });
      }
    });

    quotes.forEach(q => {
      if (q.createdAt) {
        events.push({
          title: `Quote ${q.number} Issued`,
          desc: `Proposal "${q.title}" is ready for approval ($${(q.total || 0).toFixed(2)})`,
          date: new Date(q.createdAt),
          icon: 'request_quote',
          bg: 'var(--color-warning-bg)',
          color: 'var(--color-warning)'
        });
      }
    });

    invoices.forEach(i => {
      const dateVal = i.issueDate || i.createdAt;
      if (dateVal) {
        events.push({
          title: `Invoice ${i.number} Issued`,
          desc: `Invoice for Job Reference "${i.jobReference || i.jobNumber}" is outstanding ($${(i.total || 0).toFixed(2)})`,
          date: new Date(dateVal),
          icon: 'receipt',
          bg: 'var(--color-danger-bg)',
          color: 'var(--color-danger)'
        });
      }
    });

    events.sort((a, b) => b.date - a.date);
    const recentActivity = events.slice(0, 5);

    return `
      <!-- Welcome Hero -->
      <div class="customer-portal-hero">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Hello, ${escapeHTML(customer.firstName)}</h2>
        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; line-height: 1.5; max-width: 600px;">
          ${escapeHTML(settings.customerPortalWelcome || 'Welcome to your secure customer dashboard. Here you can track your service dispatches, check maintenance, approve quotes, and manage your invoices.')}
        </p>
      </div>

      <!-- Overview Cards -->
      <div class="portal-grid-3">
        <div class="portal-stat-box">
          <div class="portal-stat-icon" style="background:var(--color-info-bg); color:var(--color-info);">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div style="font-size:12px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Open Dispatches</div>
            <div style="font-size:24px; font-weight:700; margin-top:2px;">${openJobs.length}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
              ${inProgressCount} active · ${scheduledCount} scheduled
            </div>
          </div>
        </div>

        <div class="portal-stat-box">
          <div class="portal-stat-icon" style="background:var(--color-danger-bg); color:var(--color-danger);">
            <span class="material-icons-outlined">payment</span>
          </div>
          <div>
            <div style="font-size:12px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Outstanding Invoices</div>
            <div style="font-size:24px; font-weight:700; color:var(--color-danger); margin-top:2px;">$${outstandingTotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
              Across ${outstandingInvoices.length} outstanding accounts
            </div>
          </div>
        </div>

        <div class="portal-stat-box">
          <div class="portal-stat-icon" style="background:var(--color-success-bg); color:var(--color-success);">
            <span class="material-icons-outlined">event_repeat</span>
          </div>
          <div>
            <div style="font-size:12px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Next Maintenance Due</div>
            <div style="font-size:24px; font-weight:700; margin-top:2px;">${nearestDate}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
              ${nearestPlan ? escapeHTML(nearestPlan.name) : 'All systems covered'}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions and Activity Feed Grid -->
      <div style="display:grid; grid-template-columns: 1fr 280px; gap:24px; align-items: start;">
        
        <!-- Live Activity feed -->
        <div class="portal-card" style="margin: 0;">
          <div class="portal-card-header">
            <h4 style="margin:0; font-size:14px; font-weight:600;">Recent Portal Activity</h4>
            <span class="material-icons-outlined text-tertiary" style="font-size:18px;">history</span>
          </div>
          <div class="portal-card-body" style="padding: 24px 20px;">
            <div class="timeline" style="margin:0; padding-left:14px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; gap:16px;">
              ${recentActivity.length === 0 ? `
                <div style="text-align:center; padding:16px; color:var(--text-secondary); font-size:13px;">No recent status updates or dispatches found.</div>
              ` : recentActivity.map(act => `
                <div class="timeline-item" style="padding-left: 20px; position:relative; padding-bottom: 8px;">
                  <div style="position:absolute; left:-26px; top:2px; width:22px; height:22px; border-radius:50%; background:${act.bg}; color:${act.color}; display:flex; align-items:center; justify-content:center; border:2px solid var(--card-bg);">
                    <span class="material-icons-outlined" style="font-size:12px;">${act.icon}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:13px; color:var(--text-primary);">${escapeHTML(act.title)}</strong>
                    <span style="font-size:11px; color:var(--text-tertiary);">${new Date(act.date).toLocaleDateString('en-AU')}</span>
                  </div>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:3px; line-height:1.4;">${escapeHTML(act.desc)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div class="portal-card" style="margin:0;">
            <div class="portal-card-header">
              <h4 style="margin:0; font-size:14px; font-weight:600;">Quick Actions</h4>
            </div>
            <div class="portal-card-body" style="display:flex; flex-direction:column; gap:10px; padding:16px;">
              <button class="btn btn-primary" id="dash-action-callout" style="width:100%; text-align:left; justify-content:flex-start; gap:8px;">
                <span class="material-icons-outlined" style="font-size:18px;">rate_review</span> Request Callout
              </button>
              <button class="btn btn-secondary" id="dash-action-invoices" style="width:100%; text-align:left; justify-content:flex-start; gap:8px; border:1px solid var(--border-color);">
                <span class="material-icons-outlined" style="font-size:18px;">receipt</span> View Invoices
              </button>
              <button class="btn btn-secondary" id="dash-action-jobs" style="width:100%; text-align:left; justify-content:flex-start; gap:8px; border:1px solid var(--border-color);">
                <span class="material-icons-outlined" style="font-size:18px;">build</span> View Open Jobs
              </button>
            </div>
          </div>

          <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:16px; text-align:center;">
            <div style="width:36px; height:36px; border-radius:50%; background:var(--bg-color); color:var(--text-secondary); display:flex; align-items:center; justify-content:center; margin:0 auto 10px;">
              <span class="material-icons-outlined" style="font-size:18px;">phone</span>
            </div>
            <div style="font-weight:600; font-size:13px; color:var(--text-primary);">Need Quick Help?</div>
            <p style="font-size:11px; color:var(--text-secondary); margin:4px 0 10px; line-height:1.4;">Call our dispatch office for urgent repairs.</p>
            <a href="tel:${escapeHTML(settings.phone || '(02) 6882 4400')}" class="font-medium" style="font-size:13px; color:var(--color-primary); text-decoration:none;">${escapeHTML(settings.phone || '(02) 6882 4400')}</a>
          </div>
        </div>

      </div>
    `;
  }

  // --- Tab 2: Jobs Tab ---
  function renderJobsTab(jobs) {
    const filteredJobs = jobs.filter(j => {
      if (jobFilter === 'all') return true;
      if (jobFilter === 'completed') return j.status === 'Completed' || j.status === 'Invoiced';
      if (jobFilter === 'in_progress') return j.status === 'In Progress';
      if (jobFilter === 'pending') return j.status === 'Pending' || j.status === 'Scheduled';
      return true;
    });

    return `
      <div class="portal-card" style="margin-bottom:20px;">
        <div class="portal-card-body" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:6px;">
            ${['all', 'in_progress', 'pending', 'completed'].map(f => {
              const label = f === 'all' ? 'All' : (f === 'in_progress' ? 'In Progress' : (f === 'pending' ? 'Pending / Scheduled' : 'Completed'));
              const active = jobFilter === f;
              return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}" id="filter-job-${f}" style="font-size:12px; border: ${active ? 'none' : '1px solid var(--border-color)'};">${label}</button>`;
            }).join('')}
          </div>
          <span style="font-size:12px; color:var(--text-secondary); font-weight:500;">Showing ${filteredJobs.length} Job(s)</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${filteredJobs.length === 0 ? `
          <div class="portal-card" style="text-align:center; padding:40px; color:var(--text-secondary);">
            <span class="material-icons-outlined" style="font-size:48px; color:var(--text-tertiary); margin-bottom:12px;">inbox</span>
            <h4>No jobs found</h4>
            <p style="font-size:13px; margin:4px 0 0;">There are no dispatches matching the selected status filters.</p>
          </div>
        ` : filteredJobs.map(job => {
          const isExpanded = expandedJobId === job.id;
          const statusColors = {
            'Pending': 'badge-warning',
            'Scheduled': 'badge-primary',
            'In Progress': 'badge-primary',
            'Completed': 'badge-success',
            'Invoiced': 'badge-success'
          };
          
          let overallProgress = 0;
          if (job.tasks && job.tasks.length > 0) {
            const sum = job.tasks.reduce((s, t) => s + (t.progress || 0), 0);
            overallProgress = Math.round(sum / job.tasks.length);
          }

          return `
            <div class="portal-card" style="margin-bottom:0;">
              <!-- Header -->
              <div class="accordion-header" data-id="${job.id}">
                <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                  <span class="material-icons-outlined" style="color: var(--text-secondary); flex-shrink:0;">build</span>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <strong style="font-size:15px; color:var(--text-primary);">${escapeHTML(job.number)} — ${escapeHTML(job.title)}</strong>
                      <span class="badge ${statusColors[job.status] || 'badge-neutral'}">${escapeHTML(job.status)}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; display:flex; align-items:center; gap:16px;">
                      <span>Tech: <strong>${escapeHTML(job.technicianName || 'Assignee Pending')}</strong></span>
                      <span>Date: <strong>${job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-AU') : 'TBD'}</strong></span>
                    </div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:20px; flex-shrink:0;">
                  <!-- Progress Bar preview -->
                  <div style="width:120px; display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600; color:var(--text-secondary);">
                    <div style="flex:1; height:6px; background:var(--bg-color); border-radius:3px; overflow:hidden;">
                      <div style="width:${overallProgress}%; height:100%; background:var(--color-primary);"></div>
                    </div>
                    <span>${overallProgress}%</span>
                  </div>

                  <span class="material-icons-outlined text-secondary" style="transition:transform 0.2s; ${isExpanded ? 'transform:rotate(180deg);' : ''}">expand_more</span>
                </div>
              </div>

              <!-- Body Details Accordion -->
              ${isExpanded ? `
                <div class="accordion-body">
                  <div style="display:grid; grid-template-columns: 1fr 340px; gap:24px; align-items: start;">
                    
                    <!-- Left: Tasks, Description and Comments -->
                    <div style="display:flex; flex-direction:column; gap:20px;">
                      
                      <!-- Description -->
                      <div>
                        <h4 style="font-size:12px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Job Requirements</h4>
                        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px; padding:12px; font-size:13px; color:var(--text-primary); line-height:1.5;">
                          ${escapeHTML(job.description || 'No job descriptions provided.')}
                        </div>
                      </div>

                      <!-- Read-only Tasks -->
                      <div>
                        <h4 style="font-size:12px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">Operational Tasks</h4>
                        <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px; padding:16px; display:flex; flex-direction:column; gap:12px;">
                          ${renderCustomerTaskNodeList(job.tasks || [], job, [])}
                        </div>
                      </div>

                    </div>

                    <!-- Right: Tech details and activity log comments -->
                    <div style="display:flex; flex-direction:column; gap:20px;">
                      
                      <!-- Dispatch Info -->
                      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                        <h4 style="margin-top:0; margin-bottom:12px; font-size:13px; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Dispatch Information</h4>
                        <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Scheduled Date</span><strong>${job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-AU') : 'TBD'}</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Duration</span><strong>${job.estimatedHours || 0} Hrs (Est.)</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Site Address</span><strong>${escapeHTML(job.siteAddress)}</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Priority Level</span><span class="badge badge-neutral">${escapeHTML(job.priority)}</span></div>
                        </div>
                      </div>

                      <!-- Attached Documents -->
                      ${job.attachments && job.attachments.length > 0 ? `
                        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                          <h4 style="margin-top:0; margin-bottom:12px; font-size:13px; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Job Attachments</h4>
                          <div style="display:flex; flex-direction:column; gap:8px;">
                            ${job.attachments.map(att => `
                              <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-color); border:1px solid var(--border-color); padding:6px 10px; border-radius:4px; font-size:12px;">
                                <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                                  <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary); flex-shrink:0;">description</span>
                                  <span class="truncate font-medium" style="color:var(--text-primary); max-width:140px;">${escapeHTML(att.name)}</span>
                                </div>
                                <a href="${escapeHTML(att.data)}" download="${escapeHTML(att.name)}" class="btn btn-xs btn-ghost" style="padding:2px 6px; font-size:10px;">Download</a>
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}

                      <!-- Portal Activity Log / Comments thread -->
                      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                        <h4 style="margin-top:0; margin-bottom:12px; font-size:13px; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
                          <span class="material-icons-outlined text-primary" style="font-size:16px;">forum</span> Activity Feed
                        </h4>
                        
                        <!-- Submit Box -->
                        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
                          <textarea id="portal-comment-input-${job.id}" class="form-input" rows="2" style="font-size:12px;" placeholder="Post a comment or response to the office..."></textarea>
                          <button class="btn btn-primary btn-sm btn-submit-comment" data-job-id="${job.id}" style="align-self: flex-end; display:flex; align-items:center; gap:4px; padding:4px 8px; font-size:11px;">
                            <span class="material-icons-outlined" style="font-size:12px;">send</span> Send Message
                          </button>
                        </div>

                        <!-- Logs list -->
                        <div style="max-height:180px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; padding:10px; background:var(--bg-color); display:flex; flex-direction:column; gap:8px;">
                          ${(() => {
                            const filteredLogs = job.customerActivityLog || [];
                            if (filteredLogs.length === 0) {
                              return `<div style="text-align:center; padding:10px; color:var(--text-tertiary); font-size:11px;">No communication logs on this dispatch yet.</div>`;
                            }
                            return filteredLogs.map(log => {
                              const isCustomerAuthor = log.isCustomer;
                              const authorName = log.author || (isCustomerAuthor ? 'Customer' : 'Office Staff');
                              return `
                                <div style="border-bottom:1px dashed var(--border-color); padding-bottom:6px; font-size:11px;">
                                  <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--text-primary);">
                                    <span style="color:${isCustomerAuthor ? 'var(--color-primary)' : 'var(--color-success)'};">${escapeHTML(authorName)}</span>
                                    <span style="font-weight:400; color:var(--text-tertiary);">${new Date(log.date).toLocaleDateString('en-AU', { hour:'2-digit', minute:'2-digit' })}</span>
                                  </div>
                                  <div style="color:var(--text-secondary); margin-top:3px; line-height:1.4; word-break:break-word;">
                                    ${escapeHTML(log.content)}
                                  </div>
                                </div>
                              `;
                            }).join('');
                          })()}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Helper: Renders hierarchical tasks read-only
  function renderCustomerTaskNodeList(tasks, job, parentPath) {
    if (!tasks || tasks.length === 0) return '<div class="text-tertiary" style="font-size:11px">No operational tasks defined</div>';

    return tasks.map((t, idx) => {
      const currentPath = [...parentPath, idx];
      const pathString = currentPath.join('-');
      const key = `${job.id}-${pathString}`;
      
      const hasChildren = t.subTasks && t.subTasks.length > 0;
      const isExpanded = expandedTaskPaths.has(key);

      const statusBadges = {
        'Completed': 'badge-success',
        'In Progress': 'badge-primary',
        'Not Started': 'badge-neutral',
        'On Hold': 'badge-warning'
      };

      return `
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div style="display:flex; align-items:center; gap:8px; min-width:0; cursor: ${hasChildren ? 'pointer' : 'default'};" class="${hasChildren ? 'btn-toggle-task-node' : ''}" data-job-id="${job.id}" data-path="${pathString}">
              ${hasChildren ? `
                <span class="material-icons-outlined text-secondary" style="font-size:16px; transition:transform 0.2s; ${isExpanded ? 'transform:rotate(90deg);' : ''}">chevron_right</span>
              ` : `
                <span class="material-icons-outlined text-tertiary" style="font-size:14px; margin-left:4px;">circle</span>
              `}
              <span style="font-size:13px; font-weight: ${hasChildren ? '600' : '500'}; color:var(--text-primary);" class="truncate">${escapeHTML(t.name)}</span>
            </div>
            
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="badge ${statusBadges[t.status] || 'badge-neutral'}" style="font-size:10px; padding:2px 8px;">
                ${t.status === 'Completed' ? 'Completed' : (t.status === 'In Progress' ? 'In Progress' : 'Pending')}
              </span>
              ${!hasChildren ? `<span style="font-size:11px; font-weight:600; color:var(--text-secondary);">${t.progress || 0}%</span>` : ''}
            </div>
          </div>

          <!-- Child nodes list -->
          ${hasChildren && isExpanded ? `
            <div style="margin-left: 20px; border-left: 1.5px dashed var(--border-color); padding-left: 12px; margin-top: 6px; display:flex; flex-direction:column; gap:8px;">
              ${renderCustomerTaskNodeList(t.subTasks, job, currentPath)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // --- Tab 3: Quotes Tab ---
  function renderQuotesTab(quotes) {
    const filteredQuotes = quotes.filter(q => {
      if (quoteFilter === 'all') return true;
      if (quoteFilter === 'pending') return q.status === 'Pending Approval' || q.status === 'Sent';
      if (quoteFilter === 'accepted') return q.status === 'Approved' || q.status === 'Accepted';
      if (quoteFilter === 'declined') return q.status === 'Declined';
      return true;
    });

    return `
      <div class="portal-card" style="margin-bottom:20px;">
        <div class="portal-card-body" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:6px;">
            ${['all', 'pending', 'accepted', 'declined'].map(f => {
              const label = f === 'all' ? 'All Proposals' : (f === 'pending' ? 'Awaiting Approval' : (f === 'accepted' ? 'Accepted' : 'Declined'));
              const active = quoteFilter === f;
              return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}" id="filter-quote-${f}" style="font-size:12px; border: ${active ? 'none' : '1px solid var(--border-color)'};">${label}</button>`;
            }).join('')}
          </div>
          <span style="font-size:12px; color:var(--text-secondary); font-weight:500;">Showing ${filteredQuotes.length} Proposal(s)</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${filteredQuotes.length === 0 ? `
          <div class="portal-card" style="text-align:center; padding:40px; color:var(--text-secondary);">
            <span class="material-icons-outlined" style="font-size:48px; color:var(--text-tertiary); margin-bottom:12px;">request_quote</span>
            <h4>No quotes found</h4>
            <p style="font-size:13px; margin:4px 0 0;">There are no proposals matching the selected filters.</p>
          </div>
        ` : filteredQuotes.map(quote => {
          const isExpanded = expandedQuoteId === quote.id;
          
          let totalGST = 0;
          let subtotal = 0;
          let totalIncGST = 0;

          const flatItems = [];
          if (quote.sections) {
            quote.sections.forEach(sec => {
              if (sec.lineItems) flatItems.push(...sec.lineItems);
            });
            subtotal = quote.subtotal || quote.total || 0;
          } else {
            subtotal = quote.total || 0;
          }
          
          totalGST = subtotal * 0.10;
          totalIncGST = subtotal + totalGST;

          const statusColors = {
            'Draft': 'badge-draft',
            'Sent': 'badge-warning',
            'Pending Approval': 'badge-warning',
            'Approved': 'badge-success',
            'Accepted': 'badge-success',
            'Declined': 'badge-danger',
            'Expired': 'badge-neutral'
          };

          const isActionable = quote.status === 'Sent' || quote.status === 'Pending Approval';

          return `
            <div class="portal-card" style="margin-bottom:0; border-left:4px solid ${quote.status === 'Approved' || quote.status === 'Accepted' ? 'var(--color-success)' : (quote.status === 'Declined' ? 'var(--color-danger)' : 'var(--color-warning)')}">
              <div class="accordion-header" data-id="${quote.id}" data-type="quote">
                <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                  <span class="material-icons-outlined" style="color: var(--text-secondary); flex-shrink:0;">request_quote</span>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <strong style="font-size:15px; color:var(--text-primary);">${escapeHTML(quote.number)} — ${escapeHTML(quote.title || 'Service Proposal')}</strong>
                      <span class="badge ${statusColors[quote.status] || 'badge-neutral'}">${escapeHTML(quote.status === 'Sent' ? 'Awaiting Approval' : quote.status)}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; display:flex; align-items:center; gap:16px;">
                      <span>Date Issued: <strong>${quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-AU') : 'TBD'}</strong></span>
                      <span>Total: <strong>$${totalIncGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })} (Inc. GST)</strong></span>
                    </div>
                  </div>
                </div>
                <span class="material-icons-outlined text-secondary" style="transition:transform 0.2s; ${isExpanded ? 'transform:rotate(180deg);' : ''}">expand_more</span>
              </div>

              <!-- Quote Accordion Body -->
              ${isExpanded ? `
                <div class="accordion-body">
                  <div style="max-width:800px; margin:0 auto; padding:12px 0;">
                    
                    <!-- Line Items Table -->
                    <table class="data-table" style="margin-bottom:20px; width:100%;">
                      <thead>
                        <tr>
                          <th>Description / Service</th>
                          <th style="width:80px; text-align:center;">Qty</th>
                          <th style="width:120px; text-align:right;">Rate</th>
                          <th style="width:120px; text-align:right;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${flatItems.length === 0 ? `
                          <tr><td colspan="4" class="text-center text-secondary" style="padding:20px;">No detailed line items provided. Reference Quote summary total.</td></tr>
                        ` : flatItems.map(item => `
                          <tr>
                            <td class="font-medium">${escapeHTML(item.description || 'Routine Labour Rate')}</td>
                            <td style="text-align:center;">${item.qty || 1}</td>
                            <td style="text-align:right; color:var(--text-secondary);">$${parseFloat(item.rate || 0).toFixed(2)}</td>
                            <td style="text-align:right; font-weight:600;">$${parseFloat(item.total || 0).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <!-- Totals Breakdown Grid -->
                    <div style="display:grid; grid-template-columns: 1fr 300px; gap:24px; align-items: start;">
                      
                      <!-- Terms / Notes -->
                      <div style="font-size:12px; color:var(--text-secondary); line-height:1.5; background:var(--bg-color); border:1px solid var(--border-color); padding:12px; border-radius:6px;">
                        <strong style="display:block; margin-bottom:4px; color:var(--text-secondary);">Proposal Terms & Notes</strong>
                        ${escapeHTML(quote.notes || 'Subject to standard service terms and conditions. Valid for 30 days from issue.')}
                      </div>

                      <!-- Summary totals -->
                      <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
                        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Subtotal (Excl. GST)</span><strong>$${subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">10% GST</span><strong>$${totalGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></div>
                        <div style="display:flex; justify-content:space-between; border-top:1.5px solid var(--border-color); padding-top:8px; font-size:15px; color:var(--color-primary);"><span style="font-weight:600;">Total Amount (Inc. GST)</span><strong>$${totalIncGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></div>
                      </div>
                    </div>

                    <!-- Client Approval Button Box -->
                    ${isActionable ? `
                      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:28px; padding-top:20px; border-top:1px solid var(--border-color);">
                        <button class="btn btn-danger btn-decline-quote-trigger" data-id="${quote.id}" style="display:flex; align-items:center; gap:6px;">
                          <span class="material-icons-outlined" style="font-size:16px;">close</span> Decline
                        </button>
                        <button class="btn btn-primary btn-accept-quote" data-id="${quote.id}" style="display:flex; align-items:center; gap:6px; padding: 10px 20px;">
                          <span class="material-icons-outlined" style="font-size:16px;">check_circle</span> Approve & Proceed
                        </button>
                      </div>

                      <!-- Decline Reason Form Drawer Drawer -->
                      <div id="decline-box-${quote.id}" style="display:none; background:var(--color-danger-bg); border:1px solid rgba(220, 38, 38, 0.2); border-radius:8px; padding:16px; margin-top:20px; text-align:left;">
                        <strong style="color:var(--color-danger); font-size:13px; display:block; margin-bottom:6px;">Decline Proposal</strong>
                        <p style="font-size:11px; color:var(--color-danger); margin:0 0 10px 0;">Please provide a reason why this proposal is declined (optional). This helps us refine our estimates for you:</p>
                        <textarea id="decline-reason-${quote.id}" class="form-input" rows="2" style="font-size:12px; margin-bottom:10px;" placeholder="Optional decline feedback details..."></textarea>
                        <div style="display:flex; justify-content:flex-end; gap:8px;">
                          <button class="btn btn-secondary btn-sm btn-decline-cancel" data-id="${quote.id}">Cancel</button>
                          <button class="btn btn-danger btn-sm btn-decline-confirm" data-id="${quote.id}">Confirm Decline</button>
                        </div>
                      </div>
                    ` : `
                      <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; padding:12px; text-align:center; font-size:13px; font-weight:600; margin-top:24px; display:flex; align-items:center; justify-content:center; gap:8px; color: ${quote.status === 'Approved' || quote.status === 'Accepted' ? 'var(--color-success)' : 'var(--color-danger)'}">
                        <span class="material-icons-outlined" style="font-size:18px;">${quote.status === 'Approved' || quote.status === 'Accepted' ? 'check_circle' : 'cancel'}</span>
                        <span>This proposal was officially <strong>${escapeHTML(quote.status)}</strong> on ${quote.updatedAt ? new Date(quote.updatedAt).toLocaleDateString('en-AU') : 'TBD'}. No further actions required.</span>
                      </div>
                    `}

                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- Tab 4: Invoices Tab ---
  function renderInvoicesTab(invoices) {
    const outstandingInvoices = invoices.filter(i => i.status !== 'Paid');
    const outstandingTotal = outstandingInvoices.reduce((sum, inv) => {
      let sub = inv.subtotal;
      if (sub === undefined || sub === null) {
        const items = [];
        if (inv.sections) {
          inv.sections.forEach(sec => {
            if (sec.lineItems) items.push(...sec.lineItems);
          });
        } else if (inv.lineItems) {
          items.push(...inv.lineItems);
        }
        if (items.length > 0) {
          sub = items.reduce((s2, item) => s2 + (parseFloat(item.amount || item.total) || 0), 0);
        } else {
          sub = inv.total ? (inv.total / 1.1) : 0;
        }
      }
      const tax = inv.tax !== undefined && inv.tax !== null ? parseFloat(inv.tax) : (sub * 0.10);
      const tot = inv.total !== undefined && inv.total !== null ? parseFloat(inv.total) : (sub + tax);
      return sum + tot;
    }, 0);

    const filteredInvoices = invoices.filter(i => {
      if (invoiceFilter === 'all') return true;
      if (invoiceFilter === 'outstanding') return i.status !== 'Paid';
      if (invoiceFilter === 'overdue') {
        return i.status !== 'Paid' && i.dueDate && new Date(i.dueDate) < new Date();
      }
      if (invoiceFilter === 'paid') return i.status === 'Paid';
      return true;
    });

    return `
      <!-- Total Outstanding Banner -->
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:var(--text-secondary); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Outstanding Balance</h3>
          <h1 style="margin:4px 0 0 0; font-size:32px; font-weight:800; color:var(--color-danger);">$${outstandingTotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</h1>
        </div>
        <span class="material-icons-outlined" style="font-size:48px; color:var(--color-danger-bg);">account_balance_wallet</span>
      </div>

      <div class="portal-card" style="margin-bottom:20px;">
        <div class="portal-card-body" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:6px;">
            ${['all', 'outstanding', 'overdue', 'paid'].map(f => {
              const label = f === 'all' ? 'All Invoices' : (f === 'outstanding' ? 'Outstanding' : (f === 'overdue' ? 'Overdue' : 'Paid'));
              const active = invoiceFilter === f;
              return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}" id="filter-invoice-${f}" style="font-size:12px; border: ${active ? 'none' : '1px solid var(--border-color)'};">${label}</button>`;
            }).join('')}
          </div>
          <span style="font-size:12px; color:var(--text-secondary); font-weight:500;">Showing ${filteredInvoices.length} Invoice(s)</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${filteredInvoices.length === 0 ? `
          <div class="portal-card" style="text-align:center; padding:40px; color:var(--text-secondary);">
            <span class="material-icons-outlined" style="font-size:48px; color:var(--text-tertiary); margin-bottom:12px;">receipt</span>
            <h4>No invoices found</h4>
            <p style="font-size:13px; margin:4px 0 0;">There are no invoices matching the selected filters.</p>
          </div>
        ` : filteredInvoices.map(invoice => {
          const isExpanded = expandedInvoiceId === invoice.id;
          const isOverdue = invoice.status !== 'Paid' && invoice.dueDate && new Date(invoice.dueDate) < new Date();
          
          const flatItems = [];
          if (invoice.sections) {
            invoice.sections.forEach(sec => {
              if (sec.lineItems) flatItems.push(...sec.lineItems);
            });
          } else if (invoice.lineItems) {
            flatItems.push(...invoice.lineItems);
          }

          let subtotal = invoice.subtotal;
          if (subtotal === undefined || subtotal === null) {
            if (flatItems.length > 0) {
              subtotal = flatItems.reduce((sum, item) => sum + (parseFloat(item.amount || item.total) || 0), 0);
            } else {
              subtotal = invoice.total ? (invoice.total / 1.1) : 0;
            }
          }
          
          const totalGST = invoice.tax !== undefined && invoice.tax !== null ? parseFloat(invoice.tax) : (subtotal * 0.10);
          const totalIncGST = invoice.total !== undefined && invoice.total !== null ? parseFloat(invoice.total) : (subtotal + totalGST);

          return `
            <div class="portal-card" style="margin-bottom:0; border-left:4px solid ${invoice.status === 'Paid' ? 'var(--color-success)' : (isOverdue ? 'var(--color-danger)' : 'var(--border-color)')}">
              <!-- Header -->
              <div class="accordion-header" data-id="${invoice.id}" data-type="invoice">
                <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                  <span class="material-icons-outlined" style="color: ${invoice.status === 'Paid' ? 'var(--color-success)' : (isOverdue ? 'var(--color-danger)' : 'var(--text-secondary)')}; flex-shrink:0;">receipt</span>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <strong style="font-size:15px; color:var(--text-primary);">${escapeHTML(invoice.number)}</strong>
                      <span class="badge ${invoice.status === 'Paid' ? 'badge-success' : (isOverdue ? 'badge-danger' : 'badge-neutral')}">${isOverdue ? 'Overdue' : escapeHTML(invoice.status)}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; display:flex; align-items:center; gap:16px;">
                      <span>Due Date: <strong style="color:${isOverdue ? 'var(--color-danger)' : 'inherit'}">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-AU') : 'TBD'}</strong></span>
                      <span>Total Due: <strong>$${totalIncGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                  </div>
                </div>
                <span class="material-icons-outlined text-secondary" style="transition:transform 0.2s; ${isExpanded ? 'transform:rotate(180deg);' : ''}">expand_more</span>
              </div>

              <!-- Accordion Body -->
              ${isExpanded ? `
                <div class="accordion-body">
                  <div style="max-width:800px; margin:0 auto; padding:12px 0;">
                    
                    <!-- Line Items Table -->
                    <table class="data-table" style="margin-bottom:20px; width:100%;">
                      <thead>
                        <tr>
                          <th>Service / Consumable Description</th>
                          <th style="width:80px; text-align:center;">Qty</th>
                          <th style="width:120px; text-align:right;">Rate</th>
                          <th style="width:120px; text-align:right;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${flatItems.length === 0 ? `
                          <tr><td colspan="4" class="text-center text-secondary" style="padding:20px;">No detailed line items provided. Reference invoice total.</td></tr>
                        ` : flatItems.map(item => `
                          <tr>
                            <td class="font-medium">${escapeHTML(item.description || 'Operational Service Labour')}</td>
                            <td style="text-align:center;">${item.qty || 1}</td>
                            <td style="text-align:right; color:var(--text-secondary);">$${parseFloat(item.rate || 0).toFixed(2)}</td>
                            <td style="text-align:right; font-weight:600;">$${parseFloat(item.total || 0).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <div style="display:grid; grid-template-columns: 1fr 300px; gap:24px; align-items: start;">
                      
                      <!-- EFT details / instructions -->
                      <div style="font-size:12px; color:var(--text-secondary); line-height:1.5; background:var(--bg-color); border:1px solid var(--border-color); padding:16px; border-radius:8px;">
                        <strong style="display:block; margin-bottom:6px; color:var(--text-secondary); font-size:12.5px;">EFT Payment Details</strong>
                        <div style="white-space:pre-line; color:var(--text-primary);">${escapeHTML(settings.customerPortalPayment || 'Please pay via Bank Transfer to BSB: 123-456 Account: 7890 1234. Please quote your Invoice Number as reference.')}</div>
                      </div>

                      <!-- Summary Totals -->
                      <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
                        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Subtotal</span><strong>$${subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">10% GST</span><strong>$${totalGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></div>
                        <div style="display:flex; justify-content:space-between; border-top:1.5px solid var(--border-color); padding-top:8px; font-size:15px; color:var(--color-danger);"><span style="font-weight:600;">Total Amount Due</span><strong>$${totalIncGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></div>
                      </div>
                    </div>

                    <!-- PDF print preview uploader button -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:28px; padding-top:20px; border-top:1px solid var(--border-color);">
                      <span style="font-size:11px; color:var(--text-tertiary);">Job Reference: ${escapeHTML(invoice.jobReference || invoice.jobNumber || 'Main Dispatch')}</span>
                      <button class="btn btn-secondary btn-print-invoice" data-id="${invoice.id}" style="display:flex; align-items:center; gap:6px;">
                        <span class="material-icons-outlined" style="font-size:18px;">download</span> Export PDF Report
                      </button>
                    </div>

                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- Tab 5: Assets Tab ---
  function renderAssetsTab(assets) {
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${assets.length === 0 ? `
          <div class="portal-card" style="text-align:center; padding:40px; color:#64748b;">
            <span class="material-icons-outlined" style="font-size:48px; color:#cbd5e1; margin-bottom:12px;">precision_manufacturing</span>
            <h4>No assets tracked</h4>
            <p style="font-size:13px; margin:4px 0 0;">There are no site assets linked to your client profile.</p>
          </div>
        ` : assets.map(asset => {
          const isExpanded = expandedAssetId === asset.id;
          
          // Get completed jobs/maintenance against this asset
          const maintenanceJobs = store.getAll('jobs').filter(j => j.assetId === asset.id && j.status === 'Completed');
          const plans = store.getAll('maintenancePlans').filter(p => p.assetId === asset.id);

          return `
            <div class="portal-card" style="margin-bottom:0;">
              <!-- Header -->
              <div class="accordion-header" data-id="${asset.id}" data-type="asset">
                <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                  <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0;">${asset.type === 'Vehicle' ? 'directions_car' : 'precision_manufacturing'}</span>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <strong style="font-size:15px; color:var(--text-primary);">${escapeHTML(asset.name)}</strong>
                      <span class="badge badge-success">Active</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; display:flex; align-items:center; gap:16px;">
                      <span>Serial: <strong>${escapeHTML(asset.serial || '—')}</strong></span>
                      <span>Location: <strong>${escapeHTML(asset.site || 'Main Site')}</strong></span>
                    </div>
                  </div>
                </div>
                <span class="material-icons-outlined text-secondary" style="transition:transform 0.2s; ${isExpanded ? 'transform:rotate(180deg);' : ''}">expand_more</span>
              </div>

              <!-- Accordion Body -->
              ${isExpanded ? `
                <div class="accordion-body">
                  <div style="display:grid; grid-template-columns: 340px 1fr; gap:24px; align-items: start;">
                    
                    <!-- Left: Asset Specs and Plans -->
                    <div style="display:flex; flex-direction:column; gap:20px;">
                      
                      <!-- Details Specs -->
                      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                        <h4 style="margin-top:0; margin-bottom:12px; font-size:13px; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Specifications</h4>
                        <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Identifier Code</span><strong>${escapeHTML(asset.identifier || asset.serial || '—')}</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Asset Category</span><strong>${escapeHTML(asset.type || 'Equipment')}</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Current Meter</span><strong>${asset.currentMeter || 0} hrs</strong></div>
                          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-secondary);">Installation Site</span><strong>${escapeHTML(asset.site || 'Main Site')}</strong></div>
                        </div>
                      </div>

                      <!-- Active Maintenance Plans -->
                      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                        <h4 style="margin-top:0; margin-bottom:12px; font-size:13px; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Active Maintenance Plan</h4>
                        ${plans.length === 0 ? `
                          <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding:10px 0;">No active maintenance agreement linked.</div>
                        ` : plans.map(p => `
                          <div style="font-size:12px; display:flex; flex-direction:column; gap:6px;">
                            <div style="display:flex; justify-content:space-between;"><strong>${escapeHTML(p.name)}</strong><span class="badge badge-success">${p.status}</span></div>
                            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary);"><span>Trigger Type</span><strong>${p.triggerType}</strong></div>
                            ${p.triggerType === 'Calendar' ? `
                              <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary);"><span>Interval</span><strong>${p.frequency}</strong></div>
                              <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary);"><span>Next Due Date</span><strong style="color:var(--color-primary);">${p.nextServiceDate}</strong></div>
                            ` : `
                              <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary);"><span>Milestone</span><strong>Every ${p.meterInterval} hrs</strong></div>
                              <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary);"><span>Target Meter</span><strong style="color:var(--color-primary);">${(parseFloat(p.lastTriggeredMeter || 0) + parseFloat(p.meterInterval)).toFixed(0)} hrs</strong></div>
                            `}
                          </div>
                        `).join('')}
                      </div>

                    </div>

                    <!-- Right: Completed CRM Maintenance Dispatches history -->
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                      <h4 style="margin-top:0; margin-bottom:12px; font-size:13px; font-weight:600; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Completed Service History</h4>
                      
                      <table class="data-table" style="width:100%; font-size:12px;">
                        <thead>
                          <tr>
                            <th style="width:90px;">Date</th>
                            <th style="width:100px;">Job Reference</th>
                            <th>Technician</th>
                            <th>Description / Maintenance Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${maintenanceJobs.length === 0 ? `
                            <tr><td colspan="4" class="text-center text-secondary" style="padding:20px;">No completed maintenance records in database.</td></tr>
                          ` : maintenanceJobs.sort((a,b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)).map(job => `
                            <tr>
                              <td class="font-medium">${job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-AU') : '—'}</td>
                              <td><span class="badge badge-success">${escapeHTML(job.number)}</span></td>
                              <td>${escapeHTML(job.technicianName || 'Apex Service Specialist')}</td>
                              <td class="text-secondary" style="font-size:11px; white-space:pre-wrap;">${escapeHTML(job.description || 'Routine safety check and generator test conducted.')}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- Tab 6: Requests Tab ---
  function renderRequestsTab(assets) {
    if (requestSubmitted) {
      return `
        <div style="max-width: 600px; margin: 40px auto; padding: 40px; text-align: center; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: var(--card-shadow); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <span class="material-icons-outlined text-success" style="font-size: 64px; margin-bottom: 20px;">check_circle</span>
          <h2 style="font-size: var(--font-size-3xl); margin-bottom: 12px; color: var(--text-primary);">Request Received!</h2>
          <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; font-size: 14px;">
            Your service callout request has been submitted successfully to the operations office. We will review the dispatch requirements and get in touch with you shortly.
          </p>
          <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
            <button class="btn btn-primary" id="btn-request-reset" style="display:inline-flex; align-items:center; gap:8px;">
              <span class="material-icons-outlined">add</span> Submit Another Request
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="portal-card" style="max-width:700px; margin:0 auto;">
        <div class="portal-card-header">
          <h4 style="margin:0; font-size:14px; font-weight:600;">Request a Service Callout</h4>
        </div>
        <div class="portal-card-body">
          <form id="callout-request-form" style="display:flex; flex-direction:column; gap:16px;">
            
            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;">Request Type *</label>
                <select class="form-select" name="requestType" required>
                  <option value="Breakdown/Emergency Callout">Breakdown / Emergency Callout</option>
                  <option value="Scheduled Service">Scheduled Maintenance Service</option>
                  <option value="New Installation">New Equipment Installation</option>
                  <option value="General Enquiry">General Inquiry / Estimate</option>
                </select>
              </div>

              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:600;">Priority Level *</label>
                <select class="form-select" name="priority" required>
                  <option value="Low">Low</option>
                  <option value="Medium" selected>Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent / Emergency</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Select Site (Optional)</label>
              <select class="form-select" name="siteName">
                <option value="">-- General / No specific site --</option>
                ${(customer.sites || []).map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} ${s.address ? `(${escapeHTML(s.address)})` : ''}</option>`).join('')}
              </select>
              <p class="text-tertiary" style="font-size:11px; margin-top:4px;">Select which of your registered site locations this callout applies to.</p>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Select Site Asset (Optional)</label>
              <select class="form-select" name="assetId">
                <option value="">-- No specific asset / General Site Service --</option>
                ${assets.map(a => `<option value="${a.id}">${escapeHTML(a.name)} — S/N: ${escapeHTML(a.serial || '—')}</option>`).join('')}
              </select>
              <p class="text-tertiary" style="font-size:11px; margin-top:4px;">Select the specific generator, UPS, or ATS panel requiring service.</p>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">How should we contact you? *</label>
              <div style="display:flex; gap:20px; margin-top:6px; font-size:13px; color:var(--text-secondary);">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="radio" name="contactMethod" value="Email" checked style="cursor:pointer;" /> Email Support (${escapeHTML(customer.email)})
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="radio" name="contactMethod" value="Phone" style="cursor:pointer;" /> Phone call (${escapeHTML(customer.phone)})
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:600;">Scope / Description of Issue *</label>
              <textarea class="form-textarea" name="description" rows="5" placeholder="Provide complete details, symptoms, or service requirements..." required style="min-height:100px; font-size:13px;"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; padding-top:16px; border-top:1px solid var(--border-color); margin-top:12px;">
              <button type="submit" class="btn btn-primary" style="display:flex; align-items:center; gap:6px; padding:10px 24px;">
                <span class="material-icons-outlined" style="font-size:18px;">cloud_upload</span> Submit Callout Request
              </button>
            </div>

          </form>
        </div>
      </div>
    `;
  }

  // --- Event Handling ---
  function bindPortalEvents(jobs, quotes, invoices, assets) {
    const portalShell = container.querySelector('.customer-portal-shell');
    if (!portalShell) return;

    // Theme toggle
    portalShell.querySelector('#btn-portal-theme')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('simpro_theme', next);
      render();
    });

    // 1. Tab switches
    portalShell.querySelectorAll('.portal-nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        render();
      });
    });

    // 2. Dashboard Callout Redirect
    const dashCallout = portalShell.querySelector('#dash-action-callout');
    if (dashCallout) {
      dashCallout.addEventListener('click', () => {
        activeTab = 'requests';
        render();
      });
    }

    const dashInvoices = portalShell.querySelector('#dash-action-invoices');
    if (dashInvoices) {
      dashInvoices.addEventListener('click', () => {
        activeTab = 'invoices';
        render();
      });
    }

    const dashJobs = portalShell.querySelector('#dash-action-jobs');
    if (dashJobs) {
      dashJobs.addEventListener('click', () => {
        activeTab = 'jobs';
        render();
      });
    }

    // 3. Contact Us Modal trigger
    portalShell.querySelector('#btn-portal-contact')?.addEventListener('click', () => {
      import('../../components/Modal.js').then(({ showModal }) => {
        const content = document.createElement('div');
        content.style.lineHeight = '1.6';
        content.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <p>Need support or want to follow up on a scheduled service? Please feel free to get in touch with our operations team:</p>
            <div style="background:var(--bg-color); border:1px solid var(--border-color); padding:16px; border-radius:8px; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between;"><strong>Main Phone</strong><a href="tel:${escapeHTML(settings.phone || '(02) 6882 4400')}" style="color:var(--color-primary); text-decoration:none;" class="font-medium">${escapeHTML(settings.phone || '(02) 6882 4400')}</a></div>
              <div style="display:flex; justify-content:space-between;"><strong>Email Support</strong><a href="mailto:${escapeHTML(settings.email || 'admin@apexpowerservices.com.au')}" style="color:var(--color-primary); text-decoration:none;" class="font-medium">${escapeHTML(settings.email || 'admin@apexpowerservices.com.au')}</a></div>
              <div style="display:flex; justify-content:space-between;"><strong>Main Office</strong><span style="font-weight:600; text-align:right;">${escapeHTML(settings.address || '14 Whylandra Street, Dubbo NSW 2830')}</span></div>
            </div>
          </div>
        `;
        showModal({
          title: 'Contact Operations Office',
          content,
          actions: [{ label: 'Close', className: 'btn-primary', onClick: c => c() }]
        });
      });
    });

    // 4. Accordion Toggle Click Interceptors
    portalShell.addEventListener('click', (e) => {
      // Main accordion headers (Jobs, Quotes, Invoices, Assets)
      const header = e.target.closest('.accordion-header');
      if (header) {
        const id = header.dataset.id;
        const type = header.dataset.type || 'job'; // default job

        if (type === 'job') {
          expandedJobId = expandedJobId === id ? null : id;
        } else if (type === 'quote') {
          expandedQuoteId = expandedQuoteId === id ? null : id;
        } else if (type === 'invoice') {
          expandedInvoiceId = expandedInvoiceId === id ? null : id;
        } else if (type === 'asset') {
          expandedAssetId = expandedAssetId === id ? null : id;
        }
        render();
        return;
      }

      // Operational Task Nested Accordions toggle
      const taskToggle = e.target.closest('.btn-toggle-task-node');
      if (taskToggle) {
        const jobId = taskToggle.dataset.jobId;
        const path = taskToggle.dataset.path;
        const key = `${jobId}-${path}`;
        
        if (expandedTaskPaths.has(key)) {
          expandedTaskPaths.delete(key);
        } else {
          expandedTaskPaths.add(key);
        }
        render();
        return;
      }

      // Inline Job Comments Posting
      const submitCommentBtn = e.target.closest('.btn-submit-comment');
      if (submitCommentBtn) {
        const jobId = submitCommentBtn.dataset.jobId;
        const input = portalShell.querySelector('#portal-comment-input-' + jobId);
        if (!input) return;
        const commentVal = input.value.trim();
        if (!commentVal) return;

        const allCRMJobs = store.getAll('jobs');
        const currentJob = allCRMJobs.find(j => j.id === jobId);
        if (currentJob) {
          if (!currentJob.customerActivityLog) currentJob.customerActivityLog = [];
          
          currentJob.customerActivityLog.unshift({
            id: Math.random().toString(36).substr(2, 9),
            content: commentVal,
            isCustomer: true,
            author: `${customer.firstName} ${customer.lastName}`,
            date: new Date().toISOString()
          });

          store.update('jobs', jobId, { customerActivityLog: currentJob.customerActivityLog });
          showToast('Message posted successfully', 'success');
          render();
        }
        return;
      }

      // Quote accept button
      const acceptBtn = e.target.closest('.btn-accept-quote');
      if (acceptBtn) {
        const qId = acceptBtn.dataset.id;
        const quote = store.getById('quotes', qId);
        if (quote) {
          const quoteHistory = quote.history || [];
          quoteHistory.push({
            date: new Date().toISOString(),
            user: 'Customer (Portal)',
            action: `Accepted via secure Portal link.`
          });

          store.update('quotes', qId, { status: 'Accepted', history: quoteHistory });
          
          // Create bell notification for staff
          store.create('notifications', {
            title: 'Quote Approved via Portal',
            message: `Proposal ${quote.number} approved by ${customer.company} via portal link`,
            link: `/quotes/${quote.id}`,
            read: false,
            source: 'customer_portal',
            createdAt: new Date().toISOString(),
            status: 'Pending'
          });

          showToast('Proposal approved successfully', 'success');
          render();
        }
        return;
      }

      // Quote decline triggers
      const declineTriggerBtn = e.target.closest('.btn-decline-quote-trigger');
      if (declineTriggerBtn) {
        const qId = declineTriggerBtn.dataset.id;
        const box = portalShell.querySelector('#decline-box-' + qId);
        if (box) box.style.display = 'block';
        return;
      }

      const declineCancelBtn = e.target.closest('.btn-decline-cancel');
      if (declineCancelBtn) {
        const qId = declineCancelBtn.dataset.id;
        const box = portalShell.querySelector('#decline-box-' + qId);
        if (box) box.style.display = 'none';
        return;
      }

      const declineConfirmBtn = e.target.closest('.btn-decline-confirm');
      if (declineConfirmBtn) {
        const qId = declineConfirmBtn.dataset.id;
        const reasonInput = portalShell.querySelector('#decline-reason-' + qId);
        const reason = reasonInput ? reasonInput.value.trim() : '';

        const quote = store.getById('quotes', qId);
        if (quote) {
          const quoteHistory = quote.history || [];
          quoteHistory.push({
            date: new Date().toISOString(),
            user: 'Customer (Portal)',
            action: `Declined via portal link. Reason: ${reason || 'None provided'}`
          });

          store.update('quotes', qId, { status: 'Declined', history: quoteHistory });

          // Create bell notification for staff
          store.create('notifications', {
            title: 'Quote Declined via Portal',
            message: `Proposal ${quote.number} declined by ${customer.company} via portal (Reason: ${reason || 'None provided'})`,
            link: `/quotes/${quote.id}`,
            read: false,
            source: 'customer_portal',
            createdAt: new Date().toISOString(),
            status: 'Pending'
          });

          showToast('Proposal declined', 'warning');
          render();
        }
        return;
      }

      // Invoice Print Report Export
      const printInvoiceBtn = e.target.closest('.btn-print-invoice');
      if (printInvoiceBtn) {
        const invId = printInvoiceBtn.dataset.id;
        const invoice = store.getById('invoices', invId);
        if (invoice) {
          import('../../components/PrintPreview.js').then(({ showPrintPreview }) => {
            showPrintPreview({ type: 'invoice', data: invoice });
          });
        }
        return;
      }

      // Service Requestreset button
      const resetReqBtn = e.target.closest('#btn-request-reset');
      if (resetReqBtn) {
        requestSubmitted = false;
        render();
        return;
      }
    });

    // 5. Status Filters change events
    portalShell.querySelectorAll('[id^="filter-job-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        jobFilter = e.currentTarget.id.replace('filter-job-', '');
        render();
      });
    });

    portalShell.querySelectorAll('[id^="filter-quote-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        quoteFilter = e.currentTarget.id.replace('filter-quote-', '');
        render();
      });
    });

    portalShell.querySelectorAll('[id^="filter-invoice-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        invoiceFilter = e.currentTarget.id.replace('filter-invoice-', '');
        render();
      });
    });

    // 6. Service Request Form submission
    const requestForm = portalShell.querySelector('#callout-request-form');
    if (requestForm) {
      // Dynamic site-asset filtering
      const siteSelect = requestForm.querySelector('select[name="siteName"]');
      const assetSelect = requestForm.querySelector('select[name="assetId"]');
      if (siteSelect && assetSelect) {
        siteSelect.addEventListener('change', (e) => {
          const selectedSite = e.target.value;
          
          // Clear all options except the first placeholder option
          assetSelect.innerHTML = '<option value="">-- No specific asset / General Site Service --</option>';
          
          // Filter assets based on the selected site name
          const filteredAssets = selectedSite 
            ? assets.filter(a => a.site === selectedSite) 
            : assets;
            
          // Add filtered asset options
          filteredAssets.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = `${a.name} — S/N: ${a.serial || '—'}`;
            assetSelect.appendChild(opt);
          });
        });
      }

      requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(requestForm));
        
        // Find asset details if linked
        let linkedAssetName = 'General Site Request';
        if (data.assetId) {
          const match = assets.find(a => a.id === data.assetId);
          if (match) linkedAssetName = match.name;
        }

        const selectedSite = data.siteName || 'General / None';

        // Create new Lead inside CRM
        const lead = store.create('leads', {
          title: `Request: ${data.requestType}`,
          customerId: customer.id,
          customerName: customer.company,
          contactName: `${customer.firstName} ${customer.lastName}`,
          source: 'customer_portal',
          phone: customer.phone,
          email: customer.email,
          status: 'New',
          priority: data.priority === 'Urgent' ? 'High' : data.priority,
          site: data.siteName || '',
          requirements: `Request Type: ${data.requestType}\nPreferred Contact Method: ${data.contactMethod}\nSelected Site: ${selectedSite}\nLinked Asset: ${linkedAssetName}\n\nDescription:\n${data.description}`,
          description: `Submitted by customer via portal link on ${new Date().toLocaleString()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Create notification for staff
        store.create('notifications', {
          title: 'New Service Request Received',
          message: `New service request from ${customer.company} via portal`,
          link: `/leads/${lead.id}`,
          read: false,
          source: 'customer_portal',
          createdAt: new Date().toISOString(),
          status: 'Pending'
        });

        showToast('Service request submitted successfully', 'success');
        requestSubmitted = true;
        render();
      });
    }

  }

  // --- Initial Page Trigger ---
  render();
}

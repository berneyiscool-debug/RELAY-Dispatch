import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { getContractorCompliance, getDocStatus } from '../../utils/compliance.js';
import { showToast } from '../../components/Notifications.js';

export function renderContractorPortal(container, params) {
  // Ensure the stored theme is applied on portal load
  const storedTheme = localStorage.getItem('simpro_theme') || 'light';
  document.documentElement.setAttribute('data-theme', storedTheme);

  const token = params.token;
  const contractors = store.getAll('contractors');
  const contractor = contractors.find(c => c.portalToken === token);

  if (!contractor) {
    container.innerHTML = `
      <div style="max-width: 500px; margin: 80px auto; padding: 40px; text-align: center; background: var(--card-bg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--border-color);">
        <span class="material-icons-outlined text-danger" style="font-size: 64px; margin-bottom: 20px;">gpp_maybe</span>
        <h2 style="font-size: var(--font-size-3xl); margin-bottom: 12px; color: var(--text-primary);">Invalid Access Link</h2>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; font-size: var(--font-size-lg);">
          This secure subcontractor portal link is invalid or has expired. Please verify your portal URL or contact the operations office for assistance.
        </p>
        <a href="#/login" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
          <span class="material-icons-outlined">login</span> Go to Login
        </a>
      </div>
    `;
    return;
  }

  const settings = store.getSettings();

  // --- Magic Link PIN/Passcode Security Layer ---
  // If passcode is not configured, show First-Time Setup
  if (!contractor.portalPasscode) {
    container.innerHTML = `
      <div class="customer-portal-shell" style="min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:20px; font-family:var(--font-family); background:var(--body-bg); position:relative;">
        <button class="btn btn-outline btn-sm" id="btn-contractor-theme" title="Toggle theme" style="position: absolute; top: 20px; right: 20px; display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-primary);">
          <span class="material-icons-outlined" style="font-size: 18px;">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:32px 40px; max-width:420px; width:100%; box-shadow:var(--card-shadow); text-align:center; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="width:56px; height:56px; border-radius:50%; background:var(--color-success-bg); display:flex; align-items:center; justify-content:center; color:var(--color-success); margin:0 auto 20px auto;">
            <span class="material-icons-outlined" style="font-size:28px;">gpp_good</span>
          </div>
          <h2 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:var(--text-primary);">Secure Subcontractor Portal</h2>
          <p style="margin:0 0 24px 0; font-size:13px; color:var(--text-secondary); line-height:1.5;">
            Welcome, <strong>${escapeHTML(contractor.contactName)}</strong>! To protect your assigned job sheets, timeline uploads, and compliance credentials, please set a 4-to-6 digit security PIN for this portal link.
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
      const contrs = store.getAll('contractors');
      const idx = contrs.findIndex(c => c.id === contractor.id);
      if (idx !== -1) {
        contrs[idx].portalPasscode = p1;
        store.save('contractors', contrs);
        contractor.portalPasscode = p1; // update in-memory
      }

      // Set authenticated
      sessionStorage.setItem('portal_contractor_auth_' + contractor.id, 'true');
      showToast('PIN set successfully. Portal secured!', 'success');
      
      // Reload portal layout
      renderContractorPortal(container, params);
    });

    container.querySelector('#btn-contractor-theme')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('simpro_theme', next);
      renderContractorPortal(container, params);
    });

    return;
  }

  // If passcode is set, check sessionStorage session
  const sessionKey = 'portal_contractor_auth_' + contractor.id;
  const isUnlocked = sessionStorage.getItem(sessionKey) === 'true';

  if (!isUnlocked) {
    container.innerHTML = `
      <div class="customer-portal-shell" style="min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:20px; font-family:var(--font-family); background:var(--body-bg); position:relative;">
        <button class="btn btn-outline btn-sm" id="btn-contractor-theme" title="Toggle theme" style="position: absolute; top: 20px; right: 20px; display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-primary);">
          <span class="material-icons-outlined" style="font-size: 18px;">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:32px 40px; max-width:400px; width:100%; box-shadow:var(--card-shadow); text-align:center; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <div style="width:56px; height:56px; border-radius:50%; background:var(--color-danger-bg); display:flex; align-items:center; justify-content:center; color:var(--color-danger); margin:0 auto 20px auto;">
            <span class="material-icons-outlined" style="font-size:28px;">lock</span>
          </div>
          <h2 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:var(--text-primary);">Portal Locked</h2>
          <p style="margin:0 0 24px 0; font-size:13px; color:var(--text-secondary); line-height:1.5;">
            This Magic Link is protected. Please enter the PIN configured for <strong>${escapeHTML(contractor.businessName)}</strong> to unlock your jobsheet.
          </p>
          
          <form id="portal-lock-form" style="display:flex; flex-direction:column; gap:16px; text-align:left;">
            <div class="form-group">
              <label class="form-label" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; display:block;">Enter Your Portal PIN</label>
              <input type="password" maxlength="6" id="portal-pin" class="form-input" placeholder="••••" required autofocus
                     style="text-align:center; font-size:24px; letter-spacing:10px; padding:12px; width:100%; box-sizing:border-box; background: var(--body-bg); border:1px solid var(--border-color); color: var(--text-primary);" />
            </div>
            
            <button type="submit" class="btn btn-primary" style="width:100%; padding:12px; font-weight:600; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
              <span class="material-icons-outlined" style="font-size:18px;">vpn_key</span> Unlock Portal
            </button>
          </form>
          
          <p style="font-size:11.5px; color:var(--text-tertiary); margin-top:24px; line-height:1.4;">
            Forgot your PIN? Please contact our operations office${settings.phone ? ` at <strong>${escapeHTML(settings.phone)}</strong>` : ''} to request a reset.
          </p>
        </div>
      </div>
    `;

    container.querySelector('#portal-lock-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = container.querySelector('#portal-pin').value.trim();

      if (enteredPin === contractor.portalPasscode) {
        sessionStorage.setItem(sessionKey, 'true');
        showToast('Portal unlocked successfully', 'success');
        renderContractorPortal(container, params);
      } else {
        showToast('Incorrect PIN. Please try again.', 'error');
        container.querySelector('#portal-pin').value = '';
        container.querySelector('#portal-pin').focus();
      }
    });

    container.querySelector('#btn-contractor-theme')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('simpro_theme', next);
      renderContractorPortal(container, params);
    });

    return;
  }

  // --- Dynamic Tab State ---
  let activeTab = 'jobs'; // 'jobs' or 'compliance'
  let expandedJobId = null; // ID of the job that is currently expanded in accordion
  let jobSearchQuery = '';
  let jobStatusFilter = 'all';

  // --- File Upload Base64 State ---
  let selectedFileBase64 = null;
  let selectedFileName = '';

  // --- Task Descriptions Expanded State ---
  const expandedTaskPaths = new Set();

  // --- Comment Staged Files State ---
  const stagedCommentFiles = new Map(); // key: jobId, value: Array of { name, size, type, data }

  // --- Helper: Find jobs and map contractor task list ---
  function getAssignedJobs() {
    const allJobs = store.getAll('jobs');
    const assigned = [];

    allJobs.forEach(job => {
      let isAssigned = (job.contractorId === contractor.id);
      const contractorTasks = [];

      function checkTasks(tasks) {
        if (!tasks) return;
        tasks.forEach(t => {
          const assignedIds = t.assignedContractorIds || [];
          if (assignedIds.includes(contractor.id) || t.assignedContractorId === contractor.id) {
            isAssigned = true;
            contractorTasks.push(t);
          }
          if (t.subTasks) checkTasks(t.subTasks);
        });
      }

      if (job.tasks) {
        checkTasks(job.tasks);
      }

      if (isAssigned) {
        assigned.push({
          job,
          assignedTasks: contractorTasks
        });
      }
    });

    return assigned;
  }

  // --- Helper: Update hierarchical task progress ---
  function updateParentProgress(tasks, path) {
    if (path.length <= 1) return;
    const parentPath = path.slice(0, -1);
    
    // Find parent task by traversing path
    let parent = tasks[parentPath[0]];
    for (let i = 1; i < parentPath.length; i++) {
      parent = parent.subTasks[parentPath[i]];
    }

    if (parent && parent.subTasks && parent.subTasks.length > 0) {
      let totalWeight = 0;
      let completedWeight = 0;
      parent.subTasks.forEach(sp => {
        const weight = (parseFloat(sp.estimatedHours) || 1) * (parseInt(sp.people) || 1);
        totalWeight += weight;
        completedWeight += weight * ((sp.progress || 0) / 100);
      });
      parent.progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
      
      if (parent.progress === 100) parent.status = 'Completed';
      else if (parent.progress > 0) parent.status = 'In Progress';
      else parent.status = 'Not Started';
      
      updateParentProgress(tasks, parentPath); // Recurse upwards
    }
  }

  // Helper to find task by path in the job tasks hierarchy
  function getTaskByPath(tasks, path) {
    if (!tasks || path.length === 0) return null;
    let node = tasks[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (!node.subTasks) return null;
      node = node.subTasks[path[i]];
    }
    return node;
  }

  // Helper to update specific task progress and status
  function saveTaskUpdate(jobId, pathStr, newProgress) {
    const jobs = store.getAll('jobs');
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.tasks) return;

    const path = pathStr.split('-').map(Number);
    const node = getTaskByPath(job.tasks, path);
    if (!node) return;

    node.progress = newProgress;
    if (newProgress === 100) node.status = 'Completed';
    else if (newProgress > 0) node.status = 'In Progress';
    else node.status = 'Not Started';

    // Update parent tasks recursively
    updateParentProgress(job.tasks, path);

    // Recalculate overall job progress if there are top-level tasks
    if (job.tasks.length > 0) {
      const totalTasks = job.tasks.length;
      const completedTasks = job.tasks.filter(t => t.status === 'Completed').length;
      // Alternatively, compute weighted average of top-level tasks
      let sumProgress = 0;
      job.tasks.forEach(t => sumProgress += (t.progress || 0));
      const overallProgress = Math.round(sumProgress / totalTasks);
      
      if (overallProgress === 100 && job.status !== 'Completed' && job.status !== 'Invoiced') {
        job.status = 'Completed';
      } else if (overallProgress > 0 && job.status === 'Pending') {
        job.status = 'In Progress';
      }
    }

    store.update('jobs', jobId, { tasks: job.tasks, status: job.status });
    
    // Quick notification / visual feedback
    const toast = document.getElementById('sync-indicator-' + jobId);
    if (toast) {
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 1000);
    }
  }

  // --- Main Render Function ---
  function render() {
    const list = getAssignedJobs();
    const compliance = getContractorCompliance(contractor);
    
    // Aggregate status counts
    const totalJobs = list.length;
    let pendingTasksCount = 0;
    let completedTasksCount = 0;

    list.forEach(item => {
      function countTasks(tasks) {
        if (!tasks) return;
        tasks.forEach(t => {
          const assignedIds = t.assignedContractorIds || [];
          if (assignedIds.includes(contractor.id) || t.assignedContractorId === contractor.id) {
            if (t.status === 'Completed' || t.progress === 100) {
              completedTasksCount++;
            } else {
              pendingTasksCount++;
            }
          }
          if (t.subTasks) countTasks(t.subTasks);
        });
      }
      countTasks(item.job.tasks);
    });

    const settings = store.getSettings();
    const crmCompanyName = settings.name || 'Relay — Dispatch';
    
    // Check if a staff account is logged in locally
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const isStaffUser = currentUser && currentUser.role !== 'customer';

    container.innerHTML = `
      <style>
        .portal-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          font-family: var(--font-family);
          color: var(--text-primary);
        }
        
        .portal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: #ffffff;
          padding: 24px 32px;
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        [data-theme="dark"] .portal-header {
          background: linear-gradient(135deg, rgba(255, 92, 0, 0.3) 0%, rgba(9, 9, 11, 0.6) 100%) !important;
          border: 1px solid var(--border-color);
        }
        
        .portal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(27,109,224,0.15) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
        }

        .portal-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .portal-header p {
          margin: 4px 0 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .portal-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }

        .kpi-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 16px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon.info {
          background: rgba(37, 99, 235, 0.08);
          color: var(--color-info);
        }
        .kpi-icon.warning {
          background: rgba(217, 119, 6, 0.08);
          color: var(--color-warning);
        }
        .kpi-icon.success {
          background: rgba(5, 150, 105, 0.08);
          color: var(--color-success);
        }
        .kpi-icon.danger {
          background: rgba(220, 38, 38, 0.08);
          color: var(--color-danger);
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 700;
          line-height: 1.2;
        }

        .kpi-label {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .b2b-banner {
          background: linear-gradient(135deg, rgba(27,109,224,0.08), rgba(27,109,224,0.02));
          border: 1px solid var(--color-primary-light);
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          animation: pulse 3s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { border-color: var(--color-primary-light); }
          50% { border-color: rgba(27,109,224,0.4); }
        }

        .tabs-nav {
          display: flex;
          border-bottom: 2px solid var(--border-color);
          margin-bottom: 24px;
          gap: 16px;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 12px 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          position: relative;
          transition: color 0.15s;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--color-primary);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-primary);
          border-radius: 2px;
        }

        /* --- Custom Checkbox Styling --- */
        .custom-chk-label {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          gap: 8px;
        }

        .custom-chk {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          height: 18px;
          width: 18px;
          background-color: var(--content-bg);
          border: 1px solid var(--border-color-dark);
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, border-color 0.15s;
        }

        .custom-chk:checked ~ .checkmark {
          background-color: var(--color-success);
          border-color: var(--color-success);
        }

        .checkmark::after {
          content: "";
          display: none;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg) translate(-1px, -1px);
        }

        .custom-chk:checked ~ .checkmark::after {
          display: block;
        }



        /* --- Accordion Job Card --- */
        .job-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .job-card:hover {
          border-color: var(--border-color-dark);
        }

        .job-card-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
          background: var(--card-bg);
        }

        .job-card-header:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        [data-theme="dark"] .job-card-header:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }

        .job-card-body {
          border-top: 1px solid var(--border-color);
          padding: 20px;
          background: rgba(0, 0, 0, 0.01);
        }

        .timeline {
          position: relative;
          padding-left: 20px;
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 12px;
        }

        .timeline-item {
          position: relative;
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -25px;
          top: 4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--border-color-dark);
          border: 2px solid var(--card-bg);
        }

        .timeline-item.subcontractor::before {
          background: var(--color-primary);
        }

        .drag-drop-zone {
          border: 2px dashed var(--border-color-dark);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          background: var(--content-bg);
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .drag-drop-zone:hover {
          border-color: var(--color-primary);
          background-color: var(--color-primary-light);
        }
      </style>

      <div class="portal-container">
        
        <!-- B2B Staff Import Banner -->
        ${isStaffUser ? `
          <div class="b2b-banner">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="material-icons-outlined text-primary" style="font-size: 28px;">sync_alt</span>
              <div>
                <strong style="font-size:13px; color: var(--text-primary)">B2B Integration Detected</strong>
                <p style="margin: 2px 0 0 0; font-size:11px; color: var(--text-secondary)">
                  You are logged into ${crmCompanyName} as <strong>${currentUser.name}</strong>. You can copy this dispatch details directly into your local database!
                </p>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-b2b-import" style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
              <span class="material-icons-outlined" style="font-size:16px;">library_add</span> Import Dispatch to Jobs
            </button>
          </div>
        ` : ''}

        <!-- Portal Header -->
        <div class="portal-header">
          <div>
            <h1>${escapeHTML(contractor.businessName)}</h1>
            <p>Relay — Dispatch dispatch & subcontractor portal | Contact: ${escapeHTML(contractor.contactName)}</p>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <button class="btn btn-outline btn-sm" id="btn-contractor-theme" title="Toggle theme" style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #ffffff;">
              <span class="material-icons-outlined" style="font-size: 18px;">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div style="font-size: 11px; padding: 6px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; border: 1px solid rgba(255,255,255,0.12)">
              System Agency ID: <strong style="font-family:monospace; color:#38bdf8">${contractor.id}</strong>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon info">
              <span class="material-icons-outlined">business_center</span>
            </div>
            <div>
              <div class="kpi-value">${totalJobs}</div>
              <div class="kpi-label">Active Jobs</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon warning">
              <span class="material-icons-outlined">pending_actions</span>
            </div>
            <div>
              <div class="kpi-value">${pendingTasksCount}</div>
              <div class="kpi-label">Pending Tasks</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon success">
              <span class="material-icons-outlined">task_alt</span>
            </div>
            <div>
              <div class="kpi-value">${completedTasksCount}</div>
              <div class="kpi-label">Completed Tasks</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon ${compliance.status === 'compliant' ? 'success' : 'danger'}">
              <span class="material-icons-outlined">${compliance.status === 'compliant' ? 'verified' : 'gpp_maybe'}</span>
            </div>
            <div>
              <div class="kpi-value" style="font-size: 13px;">${compliance.label}</div>
              <div class="kpi-label">Compliance Status</div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button class="tab-btn ${activeTab === 'jobs' ? 'active' : ''}" data-tab="jobs">Jobs Allocation & Tasks</button>
          <button class="tab-btn ${activeTab === 'compliance' ? 'active' : ''}" data-tab="compliance">Compliance Registry (${(contractor.complianceDocs || []).length})</button>
        </div>

        <!-- Tab Content -->
        <div id="portal-tab-content">
          ${activeTab === 'jobs' ? renderJobsTab(list) : renderComplianceTab()}
        </div>

      </div>
    `;

    attachListeners();
  }

  // --- Render Jobs Tab ---
  function renderJobsTab(list) {
    // Filter and search lists
    let filteredList = list;
    
    if (jobStatusFilter !== 'all') {
      filteredList = filteredList.filter(item => {
        if (jobStatusFilter === 'pending') return item.job.status === 'Pending';
        if (jobStatusFilter === 'inprogress') return item.job.status === 'In Progress';
        if (jobStatusFilter === 'completed') return ['Completed', 'Invoiced'].includes(item.job.status);
        return true;
      });
    }

    if (jobSearchQuery) {
      const q = jobSearchQuery.toLowerCase();
      filteredList = filteredList.filter(item => 
        item.job.number.toLowerCase().includes(q) || 
        item.job.title.toLowerCase().includes(q) || 
        item.job.siteAddress.toLowerCase().includes(q)
      );
    }

    return `
      <!-- Filters and Search Bar -->
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:250px;">
          <span class="material-icons-outlined text-secondary">search</span>
          <input type="text" id="job-search-input" class="form-input" style="flex:1;" placeholder="Search jobs by number, title, or address..." value="${escapeHTML(jobSearchQuery)}" />
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:11px; text-transform:uppercase; font-weight:600; color:var(--text-secondary);">Status Filter</span>
          <select id="job-status-filter" class="form-select" style="min-width:140px; height: 32px; padding: 2px 8px;">
            <option value="all" ${jobStatusFilter === 'all' ? 'selected' : ''}>All Dispatches</option>
            <option value="pending" ${jobStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="inprogress" ${jobStatusFilter === 'inprogress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${jobStatusFilter === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>

      <!-- Jobs Accordion -->
      ${filteredList.length === 0 ? `
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:48px; text-align:center; color:var(--text-tertiary);">
          <span class="material-icons-outlined" style="font-size:48px; margin-bottom:12px;">work_off</span>
          <h3>No assigned jobs found matching filters</h3>
          <p style="margin-top:4px; font-size:12px;">Ensure tasks are allocated to ${escapeHTML(contractor.businessName)} in the Relay — Dispatch CRM.</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column;">
          ${filteredList.map(item => {
            const isExpanded = item.job.id === expandedJobId;
            const priorityColors = {
              'Urgent': 'background: rgba(220, 38, 38, 0.08); color: var(--color-danger); border: 1px solid rgba(220, 38, 38, 0.15);',
              'High': 'background: rgba(217, 119, 6, 0.08); color: var(--color-warning); border: 1px solid rgba(217, 119, 6, 0.15);',
              'Medium': 'background: rgba(37, 99, 235, 0.08); color: var(--color-info); border: 1px solid rgba(37, 99, 235, 0.15);',
              'Low': 'background: var(--bg-color); color: var(--text-secondary); border: 1px solid var(--border-color);'
            };
            const jobStatusBadges = {
              'Pending': 'badge-neutral',
              'Scheduled': 'badge-neutral',
              'In Progress': 'badge-primary',
              'On Hold': 'badge-warning',
              'Completed': 'badge-success',
              'Invoiced': 'badge-success'
            };

            return `
              <div class="job-card" id="job-card-${item.job.id}">
                <div class="job-card-header" data-id="${item.job.id}">
                  <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="font-bold" style="font-size:13px; color:var(--color-primary);">${escapeHTML(item.job.number)}</span>
                      <h3 style="font-size:13px; margin:0;">${escapeHTML(item.job.title)}</h3>
                      <span class="badge ${jobStatusBadges[item.job.status] || 'badge-neutral'}" style="margin:0">${escapeHTML(item.job.status)}</span>
                      <span class="badge" style="${priorityColors[item.job.priority] || ''}; margin:0; font-size:10px; padding: 1px 6px;">${escapeHTML(item.job.priority || 'Medium')}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:16px; font-size:11px; color:var(--text-secondary); margin-top:2px;">
                      <span style="display:flex; align-items:center; gap:4px;"><span class="material-icons-outlined" style="font-size:13px;">place</span> ${escapeHTML(item.job.siteAddress)}</span>
                      <span>Scheduled: ${item.job.scheduledDate ? new Date(item.job.scheduledDate).toLocaleDateString('en-AU') : '—'}</span>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <!-- Realtime sync tick feedback -->
                    <span id="sync-indicator-${item.job.id}" class="text-success" style="opacity:0; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; transition:opacity 0.2s;">
                      <span class="material-icons-outlined" style="font-size:14px;">cloud_done</span> Synced
                    </span>
                    <span class="material-icons-outlined text-secondary" style="font-size:24px; transition: transform 0.2s; ${isExpanded ? 'transform: rotate(180deg)' : ''}">expand_more</span>
                  </div>
                </div>

                ${isExpanded ? `
                  <div class="job-card-body">
                    <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px;">
                      
                      <!-- Tasks Checklist Panel -->
                      <div>
                        <h4 style="margin-bottom:12px; font-size:13px; display:flex; align-items:center; gap:6px;">
                          <span class="material-icons-outlined text-primary">assignment_turned_in</span>
                          Allocated Tasklist & Completion Progress
                        </h4>
                        
                        <div style="background:var(--content-bg); border:1px solid var(--border-color); border-radius:6px; padding:16px; display:flex; flex-direction:column; gap:12px;">
                          ${renderTaskNodeList(item.job.tasks, item.job, [])}
                        </div>
                      </div>

                      <!-- Job Timeline and Activity Panel -->
                      <div>
                        <h4 style="margin-bottom:12px; font-size:13px; display:flex; align-items:center; gap:6px;">
                          <span class="material-icons-outlined text-primary">history</span>
                          Activity
                        </h4>

                        <!-- Note submission box -->
                        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                          <textarea id="comment-input-${item.job.id}" class="form-input" rows="2" style="font-size:12px;" placeholder="Post a comment or activity update..."></textarea>
                          
                          <!-- Staged images preview -->
                          ${(() => {
                            const staged = stagedCommentFiles.get(item.job.id) || [];
                            if (staged.length === 0) return '';
                            return `
                              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                                ${staged.map((f, i) => `
                                  <div style="display:flex; align-items:center; background:var(--content-bg); padding:2px 6px; border-radius:4px; font-size:11px; border:1px solid var(--border-color); gap:4px;">
                                    ${f.type && f.type.startsWith('image/') ? 
                                      `<img src="${f.data}" style="width:20px; height:20px; object-fit:cover; border-radius:2px;" />` : 
                                      `<span class="material-icons-outlined" style="font-size:14px; color:var(--text-secondary);">insert_drive_file</span>`
                                    }
                                    <span class="truncate" style="max-width:80px;">${escapeHTML(f.name)}</span>
                                    <span class="material-icons-outlined text-danger btn-remove-comment-staged" data-job-id="${item.job.id}" data-idx="${i}" style="font-size:12px; cursor:pointer;">close</span>
                                  </div>
                                `).join('')}
                              </div>
                            `;
                          })()}

                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label class="btn btn-secondary btn-sm" for="comment-upload-${item.job.id}" style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:11px; padding:4px 8px;">
                              <span class="material-icons-outlined" style="font-size:14px;">photo_camera</span> Attach Image
                              <input type="file" id="comment-upload-${item.job.id}" class="comment-file-input" data-job-id="${item.job.id}" style="display:none;" multiple accept="image/*" />
                            </label>
                            
                            <button class="btn btn-primary btn-sm btn-post-comment" data-job-id="${item.job.id}" style="display:flex; align-items:center; gap:6px;">
                              <span class="material-icons-outlined" style="font-size:14px;">send</span> Post Update
                            </button>
                          </div>
                        </div>

                        <!-- Notes Feed -->
                        <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; padding:12px; background:var(--card-bg);">
                          <div class="timeline">
                            ${(item.job.activityLog || []).length === 0 ? `
                              <div style="text-align:center; padding:12px; color:var(--text-tertiary); font-size:11px;">No activity history on this job.</div>
                            ` : (item.job.activityLog || []).map(log => {
                              const isSub = log.content.startsWith('[Subcontractor');
                              return `
                                <div class="timeline-item ${isSub ? 'subcontractor' : ''}">
                                  <div style="font-size:11px; font-weight:600; display:flex; justify-content:space-between;">
                                    <span>${escapeHTML(log.content.split(': ')[0] || 'System Note')}</span>
                                    <span class="text-tertiary" style="font-weight:400;">${new Date(log.date).toLocaleDateString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-top:3px; line-height:1.4;">
                                    ${escapeHTML(log.content.split(': ').slice(1).join(': ') || log.content)}
                                  </div>
                                  ${log.files && log.files.length ? `
                                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                                      ${log.files.map(f => {
                                        const isImg = f.type && f.type.startsWith('image/');
                                        return `
                                          <div style="display:flex; align-items:center; gap:6px; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; background:var(--card-bg); font-size:10px; max-width:100%;">
                                            ${isImg ? 
                                              `<a href="${escapeHTML(f.data)}" target="_blank" style="display:block;"><img src="${escapeHTML(f.data)}" style="width:30px; height:30px; object-fit:cover; border-radius:3px;" /></a>` :
                                              `<span class="material-icons-outlined" style="font-size:18px; color:var(--text-tertiary);">description</span>`
                                            }
                                            <div style="overflow:hidden; text-align:left;">
                                              <div class="truncate" style="font-weight:500; max-width:120px;" title="${escapeHTML(f.name)}">${escapeHTML(f.name)}</div>
                                              <div class="text-secondary" style="font-size:8px;">${(f.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                          </div>
                                        `;
                                      }).join('')}
                                    </div>
                                  ` : ''}
                                </div>
                              `;
                            }).join('')}
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
      `}
    `;
  }

  // --- Render Hierarchical Tasks ---
  function renderTaskNodeList(tasks, job, parentPath, inheritedAssignment = false) {
    if (!tasks || tasks.length === 0) return '<div class="text-secondary" style="font-size:11px">No tasks defined</div>';

    const isJobAssigned = job && (job.contractorId === contractor.id);
    const jobId = job ? job.id : '';

    // Filter visible tasks (either assigned to contractor, or having descendants assigned to contractor)
    function hasAssignedDescendant(node) {
      if (!node.subTasks || node.subTasks.length === 0) return false;
      return node.subTasks.some(sub => {
        const directAssigned = (sub.assignedContractorIds || []).includes(contractor.id) || (sub.assignedContractorId === contractor.id);
        return directAssigned || hasAssignedDescendant(sub);
      });
    }

    const visibleTasks = tasks.map((t, idx) => ({ t, idx })).filter(({ t }) => {
      const directAssigned = (t.assignedContractorIds || []).includes(contractor.id) || (t.assignedContractorId === contractor.id);
      const isAssigned = isJobAssigned || directAssigned || inheritedAssignment;
      if (isAssigned) return true;
      return hasAssignedDescendant(t);
    });

    if (visibleTasks.length === 0) {
      if (parentPath.length === 0) {
        return '<div class="text-secondary" style="font-size:11px">No tasks allocated to your company</div>';
      }
      return '';
    }

    return visibleTasks.map(({ t, idx }) => {
      const currentPath = [...parentPath, idx];
      const pathStr = currentPath.join('-');
      const paddingLeft = parentPath.length * 12;
      const directAssigned = (t.assignedContractorIds || []).includes(contractor.id) || (t.assignedContractorId === contractor.id);
      const isAssignedToUs = isJobAssigned || directAssigned || inheritedAssignment;
      const hasChildren = t.subTasks && t.subTasks.length > 0;
      const isDescExpanded = expandedTaskPaths.has(`${jobId}-${pathStr}`);
      const taskDescription = t.description || `Standard operational procedures, verification checks, and safety guidelines for "${t.name}".`;

      return `
        <div style="padding-left: ${paddingLeft}px; border-left: ${currentPath.length > 1 ? '1px dashed var(--border-color-dark)' : 'none'}; margin-left: ${currentPath.length > 1 ? '8px' : '0'}; padding-top: 4px; padding-bottom: 4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding: 6px 10px; background:var(--card-bg); border-radius:4px; border:1px solid ${isAssignedToUs ? 'rgba(27,109,224,0.15)' : 'var(--border-color)'};">
            
            <div class="task-info-col" style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:180px;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${isAssignedToUs ? `
                  <span class="material-icons-outlined text-primary" style="font-size:16px;" title="Assigned to your company">engineering</span>
                ` : ''}
                
                <span class="font-medium task-name-clickable" data-job-id="${jobId}" data-path="${pathStr}" style="font-size:12px; cursor: pointer; ${isAssignedToUs ? 'font-weight:600; color:var(--color-primary-dark)' : ''}" title="Click to show/hide description">
                  ${escapeHTML(t.name)}
                </span>
                
                ${t.estimatedHours ? `
                  <span style="font-size:10px; color:var(--text-tertiary); background:var(--content-bg); padding:1px 4px; border-radius:3px;">${t.estimatedHours}h</span>
                ` : ''}

                <span class="material-icons-outlined btn-toggle-desc text-tertiary" data-job-id="${jobId}" data-path="${pathStr}" style="font-size:14px; cursor:pointer;" title="Toggle description">
                  ${isDescExpanded ? 'info' : 'info_outline'}
                </span>
              </div>
              <div class="task-desc-container" style="font-size:11px; color:var(--text-secondary); line-height:1.4; padding-left: ${isAssignedToUs ? '24px' : '0px'}; font-style: italic; max-height: ${isDescExpanded ? '200px' : '0px'}; overflow: hidden; transition: max-height 0.2s ease-in-out; margin-top: ${isDescExpanded ? '4px' : '0px'};">
                ${escapeHTML(taskDescription)}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <!-- Interactive elements for subcontractor tasks, or read-only if not their task -->
              ${!hasChildren ? `
                <!-- Leaf node: checkbox toggle only (no slider) -->
                <div style="display:flex; align-items:center; gap:12px;">
                  <span class="badge ${t.progress === 100 ? 'badge-success' : t.progress > 0 ? 'badge-primary' : 'badge-neutral'}" style="font-size:10px; margin:0; min-width: 80px; text-align: center;">
                    ${t.progress === 100 ? 'Completed' : t.progress > 0 ? `${t.progress}% Progress` : 'Not Started'}
                  </span>
                  
                  <label class="custom-chk-label" style="margin: 0; display: inline-flex;">
                    <input type="checkbox" class="custom-chk task-checkbox" data-job-id="${jobId}" data-path="${pathStr}" ${t.progress === 100 ? 'checked' : ''} ${isAssignedToUs ? '' : 'disabled'} />
                    <span class="checkmark"></span>
                  </label>
                </div>
              ` : `
                <!-- Parent node: display progress badge, non-editable directly -->
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:10px; font-weight:700; margin:0;">${t.progress || 0}%</span>
                  <span class="badge badge-neutral" style="font-size:10px; margin:0;">${escapeHTML(t.status || 'Not Started')}</span>
                </div>
              `}
            </div>

          </div>

          <!-- Recurse children -->
          ${hasChildren ? `
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
              ${renderTaskNodeList(t.subTasks, job, currentPath, isAssignedToUs)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // --- Render Compliance Tab ---
  function renderComplianceTab() {
    const docs = contractor.complianceDocs || [];
    
    return `
      <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px; align-items: start;">
        
        <!-- Credentials Table -->
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0;">Active Licenses & Insurances</h4>
          </div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Credential Name</th>
                  <th>License / Policy No.</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${docs.map(doc => {
                  const stat = getDocStatus(doc);
                  return `
                    <tr>
                      <td class="font-medium">
                        <div>${escapeHTML(doc.type)}</div>
                        ${doc.fileData ? `
                          <div style="margin-top:4px;">
                            <a href="${doc.fileData}" download="${doc.fileName}" target="_blank" class="text-primary" style="font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                              <span class="material-icons-outlined" style="font-size:14px">attachment</span> ${escapeHTML(doc.fileName)}
                            </a>
                          </div>
                        ` : ''}
                      </td>
                      <td style="font-family:monospace;" class="text-secondary">${escapeHTML(doc.number || '—')}</td>
                      <td>${doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-AU') : '—'}</td>
                      <td><span class="badge ${stat.colorClass}">${escapeHTML(stat.label)}</span></td>
                    </tr>
                  `;
                }).join('')}
                ${docs.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:32px;" class="text-secondary">No credentials or certificates uploaded.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compliance Upload Form -->
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0;">Self-Service Certificate Upload</h4>
          </div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:12px; margin:0 0 16px 0; line-height:1.5;">
              Submit your renewed compliance documents directly to the admin dashboard. Uploaded files will be labeled as "Pending Verification" until approved by office staff.
            </p>

            <form id="compliance-upload-form" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Certificate Type *</label>
                <select id="cred-type" class="form-select" required>
                  <option value="Public Liability Insurance">Public Liability Insurance</option>
                  <option value="Workers Compensation">Workers Compensation</option>
                  <option value="Trade License">Trade License</option>
                  <option value="White Card">White Card (Safety Induction)</option>
                  <option value="Other Certification">Other Certification</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Policy or License Number *</label>
                <input type="text" id="cred-number" class="form-input" placeholder="e.g. WC-990212-B" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Expiry Date *</label>
                <input type="date" id="cred-expiry" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Notes / Coverage Scope</label>
                <textarea id="cred-notes" class="form-input" rows="2" style="font-size:12px;" placeholder="Optional additional comments..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Upload File Attachment *</label>
                <div class="drag-drop-zone" id="file-drop-zone">
                  <span class="material-icons-outlined text-tertiary" style="font-size:32px; margin-bottom:6px;">cloud_upload</span>
                  <div style="font-size:11px; font-weight:600; color:var(--text-secondary);" id="selected-file-label">
                    Drag and drop file here, or click to select
                  </div>
                  <div style="font-size:9px; color:var(--text-tertiary); margin-top:2px;">PDF, PNG, JPG (Max 5MB)</div>
                  <input type="file" id="cred-file-input" style="display:none;" accept=".pdf,.png,.jpg,.jpeg" />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:8px;">
                <span class="material-icons-outlined">save</span> Submit for Verification
              </button>
            </form>
          </div>
        </div>

      </div>
    `;
  }

  // --- Attach Event Listeners via Event Delegation ---
  function attachListeners() {
    const portalDiv = container.querySelector('.portal-container');
    if (portalDiv) {
      attachPortalDelegatedListeners(portalDiv);
    }
  }

  function attachPortalDelegatedListeners(portalDiv) {
    // 1. Click events
    portalDiv.addEventListener('click', (e) => {
      // Tab Switch
      const tabBtn = e.target.closest('.tab-btn');
      if (tabBtn) {
        activeTab = tabBtn.dataset.tab;
        render();
        return;
      }

      // Theme toggle
      const themeBtn = e.target.closest('#btn-contractor-theme');
      if (themeBtn) {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('simpro_theme', next);
        render();
        return;
      }

      // Accordion Toggle
      const jobHeader = e.target.closest('.job-card-header');
      if (jobHeader) {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const jobId = jobHeader.dataset.id;
        expandedJobId = (expandedJobId === jobId) ? null : jobId;
        render();
        return;
      }

      // Task Description Toggle (Clicking name or info icon)
      const taskClick = e.target.closest('.task-name-clickable') || e.target.closest('.btn-toggle-desc');
      if (taskClick) {
        const jobId = taskClick.dataset.jobId;
        const path = taskClick.dataset.path;
        if (jobId && path) {
          const key = `${jobId}-${path}`;
          const parentCol = taskClick.closest('.task-info-col');
          const containerDiv = parentCol?.querySelector('.task-desc-container');
          const iconEl = parentCol?.querySelector('.btn-toggle-desc');
          
          if (expandedTaskPaths.has(key)) {
            expandedTaskPaths.delete(key);
            if (containerDiv) {
              containerDiv.style.maxHeight = '0px';
              containerDiv.style.marginTop = '0px';
            }
            if (iconEl) iconEl.textContent = 'info_outline';
          } else {
            expandedTaskPaths.add(key);
            if (containerDiv) {
              containerDiv.style.maxHeight = '200px';
              containerDiv.style.marginTop = '4px';
            }
            if (iconEl) iconEl.textContent = 'info';
          }
        }
        return;
      }

      // Post timeline comment
      const postCommentBtn = e.target.closest('.btn-post-comment');
      if (postCommentBtn) {
        const jobId = postCommentBtn.dataset.jobId;
        const txtarea = portalDiv.querySelector('#comment-input-' + jobId);
        if (!txtarea) return;
        const commentContent = txtarea.value.trim();
        const stagedFiles = stagedCommentFiles.get(jobId) || [];
        if (!commentContent && !stagedFiles.length) return;

        const jobs = store.getAll('jobs');
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        if (!job.activityLog) job.activityLog = [];
        
        const prefix = `[Subcontractor - ${contractor.businessName}] ${contractor.contactName}`;
        const fullContent = commentContent ? `${prefix}: ${commentContent}` : `${prefix} attached files`;

        job.activityLog.unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'combined',
          content: fullContent,
          files: [...stagedFiles],
          date: new Date().toISOString()
        });

        store.update('jobs', jobId, { activityLog: job.activityLog });
        stagedCommentFiles.set(jobId, []); // clear staging
        
        // Sync feedback visual toast
        const syncInd = document.getElementById('sync-indicator-' + jobId);
        if (syncInd) {
          syncInd.style.opacity = '1';
          setTimeout(() => { syncInd.style.opacity = '0'; }, 1000);
        }

        render();
        return;
      }

      // Remove Staged Comment File
      const removeCommentStagedBtn = e.target.closest('.btn-remove-comment-staged');
      if (removeCommentStagedBtn) {
        const jobId = removeCommentStagedBtn.dataset.jobId;
        const idx = parseInt(removeCommentStagedBtn.dataset.idx);
        const currentStaged = stagedCommentFiles.get(jobId) || [];
        currentStaged.splice(idx, 1);
        stagedCommentFiles.set(jobId, currentStaged);
        render();
        return;
      }

      // B2B Job Import
      const importBtn = e.target.closest('#btn-b2b-import');
      if (importBtn) {
        handleB2BImport();
        return;
      }

      // File Dropzone Click
      const dropZone = e.target.closest('#file-drop-zone');
      if (dropZone) {
        if (e.target.id !== 'cred-file-input') {
          const fileInput = portalDiv.querySelector('#cred-file-input');
          if (fileInput) fileInput.click();
        }
        return;
      }
    });

    // 2. Change events
    portalDiv.addEventListener('change', (e) => {
      // Status Filter
      if (e.target.matches('#job-status-filter')) {
        jobStatusFilter = e.target.value;
        const listContent = portalDiv.querySelector('#portal-tab-content');
        if (listContent) {
          listContent.innerHTML = renderJobsTab(getAssignedJobs());
        }
        return;
      }

      // Task Checkbox Toggle
      if (e.target.matches('.task-checkbox')) {
        const jobId = e.target.dataset.jobId;
        const path = e.target.dataset.path;
        const isChecked = e.target.checked;
        const progress = isChecked ? 100 : 0;
        
        saveTaskUpdate(jobId, path, progress);
        render();
        return;
      }

      // File Input Change
      if (e.target.matches('#cred-file-input')) {
        const file = e.target.files[0];
        handleComplianceFile(file);
        return;
      }

      // Comment File Input Change
      if (e.target.matches('.comment-file-input')) {
        const jobId = e.target.dataset.jobId;
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        let processed = 0;
        const currentStaged = stagedCommentFiles.get(jobId) || [];
        
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            currentStaged.push({
              name: file.name,
              size: file.size,
              type: file.type,
              data: ev.target.result
            });
            processed++;
            if (processed === files.length) {
              stagedCommentFiles.set(jobId, currentStaged);
              render();
            }
          };
          reader.readAsDataURL(file);
        });
        return;
      }
    });

    // 3. Input events
    portalDiv.addEventListener('input', (e) => {
      // Job Search
      if (e.target.matches('#job-search-input')) {
        jobSearchQuery = e.target.value;
        const listContent = portalDiv.querySelector('#portal-tab-content');
        if (listContent) {
          listContent.innerHTML = renderJobsTab(getAssignedJobs());
        }
        return;
      }
    });

    // 4. Submit events
    portalDiv.addEventListener('submit', (e) => {
      if (e.target.matches('#compliance-upload-form')) {
        e.preventDefault();
        handleComplianceFormSubmit();
      }
    });

    // 5. Drag & Drop events on Dropzone
    portalDiv.addEventListener('dragover', (e) => {
      const dropZone = e.target.closest('#file-drop-zone');
      if (dropZone) {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--color-primary)';
        dropZone.style.backgroundColor = 'var(--color-primary-light)';
      }
    });

    portalDiv.addEventListener('dragleave', (e) => {
      const dropZone = e.target.closest('#file-drop-zone');
      if (dropZone) {
        dropZone.style.borderColor = 'var(--border-color-dark)';
        dropZone.style.backgroundColor = 'var(--content-bg)';
      }
    });

    portalDiv.addEventListener('drop', (e) => {
      const dropZone = e.target.closest('#file-drop-zone');
      if (dropZone) {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-color-dark)';
        dropZone.style.backgroundColor = 'var(--content-bg)';
        const file = e.dataTransfer.files[0];
        handleComplianceFile(file);
      }
    });
  }

  // --- Compliance File Helpers ---
  function handleComplianceFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      import('../../components/Notifications.js').then(({ showToast }) => {
        showToast('File is too large. Max allowed size is 5MB.', 'error');
      });
      return;
    }

    selectedFileName = file.name;
    const label = container.querySelector('#selected-file-label');
    if (label) {
      label.innerHTML = `<strong>Selected Attachment:</strong> ${escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} KB)`;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFileBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleComplianceFormSubmit() {
    const type = container.querySelector('#cred-type').value;
    const number = container.querySelector('#cred-number').value.trim();
    const expiryDate = container.querySelector('#cred-expiry').value;
    const notes = container.querySelector('#cred-notes').value.trim();

    if (!number || !expiryDate) {
      import('../../components/Notifications.js').then(({ showToast }) => {
        showToast('Please fill in all required fields.', 'error');
      });
      return;
    }

    if (!selectedFileBase64) {
      import('../../components/Notifications.js').then(({ showToast }) => {
        showToast('Please select a certificate file to upload.', 'error');
      });
      return;
    }

    const newDoc = {
      id: 'doc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      type,
      number,
      expiryDate,
      verified: false,
      fileName: selectedFileName,
      fileData: selectedFileBase64,
      notes
    };

    const updatedDocs = [...(contractor.complianceDocs || []), newDoc];
    store.update('contractors', contractor.id, { complianceDocs: updatedDocs });
    contractor.complianceDocs = updatedDocs;

    // Reset local file states
    selectedFileBase64 = null;
    selectedFileName = '';

    import('../../components/Notifications.js').then(({ showToast }) => {
      showToast('Document uploaded successfully. Awaiting admin review.', 'success');
      render();
    });
  }

  // --- B2B Job Import Helper ---
  function handleB2BImport() {
    const list = getAssignedJobs();
    if (list.length === 0) {
      import('../../components/Notifications.js').then(({ showToast }) => {
        showToast('No active jobs to import.', 'error');
      });
      return;
    }

    const settings = store.getSettings();
    const crmCompanyName = settings.name || 'Company Name';

    // 1. Fetch or create a Customer matching the CRM Owner Company Name
    const customersList = store.getAll('customers');
    let companyCustomer = customersList.find(c => c.company === crmCompanyName);
    
    if (!companyCustomer) {
      companyCustomer = {
        id: 'cust_b2b_' + Math.random().toString(36).substr(2, 9),
        company: crmCompanyName,
        firstName: 'Operations',
        lastName: 'Staff',
        email: settings.domain ? 'dispatch@' + settings.domain : (settings.email ? 'dispatch@' + settings.email.split('@').pop() : 'dispatch@company.com'),
        phone: settings.phone || '',
        address: settings.address || '',
        status: 'Active',
        type: 'Company',
        notes: 'Auto-created customer representing our parent company during subcontractor B2B job imports.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.create('customers', companyCustomer);
    }

    // Helper to deep clone tasks and reset completion state
    function deepCloneAndResetTasks(tasksList) {
      if (!tasksList) return [];
      return tasksList.map(t => {
        return {
          id: 'b2bt_' + Math.random().toString(36).substr(2, 9),
          name: t.name,
          status: 'Not Started',
          progress: 0,
          estimatedHours: t.estimatedHours || 0,
          people: t.people || 1,
          startDate: t.startDate || new Date().toISOString(),
          subTasks: t.subTasks ? deepCloneAndResetTasks(t.subTasks) : [],
          assignedContractorIds: [],
          assignedContractorId: null
        };
      });
    }

    // 2. Loop through all jobs and import them as brand new jobs
    let importCount = 0;
    const allJobs = store.getAll('jobs');

    list.forEach(({ job }) => {
      const jobTitleMarker = `[B2B Dispatch] ${job.number} - ${job.title}`;
      const alreadyExists = allJobs.some(j => j.title === jobTitleMarker);
      if (alreadyExists) return;

      // Generate next job number
      let maxNum = 100000;
      const currentJobsList = store.getAll('jobs');
      currentJobsList.forEach(j => {
        if (j.number && j.number.startsWith('J-')) {
          const num = parseInt(j.number.substring(2));
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      const newJobNumber = 'J-' + (maxNum + 1);

      const newB2BJob = {
        id: 'job_b2b_' + Math.random().toString(36).substr(2, 9),
        number: newJobNumber,
        customerId: companyCustomer.id,
        customerName: companyCustomer.company,
        contactName: companyCustomer.firstName + ' ' + companyCustomer.lastName,
        siteAddress: job.siteAddress,
        title: jobTitleMarker,
        type: job.type,
        status: 'Pending',
        priority: job.priority || 'Medium',
        scheduledDate: new Date().toISOString().split('T')[0],
        estimatedHours: job.estimatedHours || 0,
        laborCost: job.laborCost || 0,
        materialCost: job.materialCost || 0,
        tasks: deepCloneAndResetTasks(job.tasks || []),
        notes: `Imported via magic-link B2B Dispatch API. Original Job Number: ${job.number} managed by ${crmCompanyName}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      store.create('jobs', newB2BJob);
      importCount++;
    });

    import('../../components/Notifications.js').then(({ showToast }) => {
      if (importCount > 0) {
        showToast(`Successfully imported ${importCount} dispatch job(s) into your CRM database!`, 'success');
      } else {
        showToast('These dispatch jobs have already been imported previously.', 'info');
      }
    });
  }

  render();
}

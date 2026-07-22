// ============================================
// SIMPRO CLONE — TOP BAR COMPONENT
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { applyTheme, THEMES } from '../utils/theme.js';
import { toggleRelay, onRelayToggle, openDeputyWithPrompt } from './RelayAssistant.js';
import { showModal } from './Modal.js';
import relayIcon from '../assets/deputy-icon.svg?raw';

export function createTopBar() {
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.id = 'topbar';

  topbar.innerHTML = `
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="relay-btn topbar-relay" id="btn-relay-assistant" title="Deputy — your co-pilot" aria-label="Open Deputy assistant" style="position: relative;">
        ${relayIcon}
        <span class="deputy-ask-badge" id="deputy-ask-badge" style="display:none; position:absolute; top:-4px; right:-4px; background:#FF3B30; color:white; font-size:10px; font-weight:bold; border-radius:12px; padding:2px 6px; border:2px solid var(--bg-color);">0</span>
      </button>
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${(THEMES[getStoredTheme()] ? THEMES[getStoredTheme()].mode : 'light') === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>
      <button class="topbar-action-btn" id="btn-help" title="Help">
        <span class="material-icons-outlined">help_outline</span>
      </button>
      <button class="topbar-action-btn" id="btn-notifications" title="Notifications">
        <span class="material-icons-outlined">notifications</span>
        <span class="notification-dot"></span>
      </button>
      <div class="topbar-user" id="topbar-user">
        <div class="topbar-avatar" id="topbar-avatar">--</div>
        <div class="topbar-user-info">
          <span class="topbar-user-name" id="topbar-name">Loading...</span>
          <span class="topbar-user-role" id="topbar-role">Role</span>
        </div>
         <!-- UI Mode Toggle Switch -->
          <label class="toggle-pill" title="Toggle Simple/Complete Mode">
            <input type="checkbox" id="ui-mode-toggle" />
            <span class="slider"></span>
          </label>
      </div>
    </div>
  `;

  // Search functionality
  const searchInput = topbar.querySelector('#global-search');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        showSearchResults(query);
      } else {
        hideSearchResults();
      }
    }, 300);
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(hideSearchResults, 200);
  });

    // Theme toggle
  const themeBtn = topbar.querySelector('#btn-theme-toggle');
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const currentMode = THEMES[current] ? THEMES[current].mode : 'light';
    const next = currentMode === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    topbar.querySelector('#theme-icon').textContent = next === 'dark' ? 'light_mode' : 'dark_mode';
  });

// UI Mode toggle — just wire up the change listener here.
  // Visibility is handled in updateTopbarAccess() which runs after login.
  const uiToggle = topbar.querySelector('#ui-mode-toggle');
  if (uiToggle) {
    const toggleLabel = uiToggle.closest('label');
    // Hidden by default until updateTopbarAccess shows it for local admin
    if (toggleLabel) toggleLabel.style.display = 'none';

    uiToggle.addEventListener('change', () => {
      const mode = uiToggle.checked ? 'admin' : 'technician';
      localStorage.setItem('uiMode', mode);
      // Update currentUser role and userTypeId accordingly
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      currentUser.role = mode;
      if (currentUser.companyId) {
        if (mode === 'admin') {
          currentUser.userTypeId = `${currentUser.companyId}_ut_admin`;
        } else {
          currentUser.userTypeId = `${currentUser.companyId}_ut_tech`;
        }
      }
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      // Refresh top-bar display to reflect role change
      updateTopbarAccess(topbar);
      // Refresh sidebar to show/hide items based on new role
      import('./Sidebar.js').then(({ updateSidebarAccess }) => {
        if (updateSidebarAccess) updateSidebarAccess();
      });
      // Trigger a page refresh/rerender to re-evaluate auth guards/permissions
      if (window.__fieldForge && window.__fieldForge.router) {
        window.__fieldForge.router.resolve();
      }
    });
  }

  // Apply stored theme on load
  applyStoredTheme();

  // Notifications logic
  const notifBtn = topbar.querySelector('#btn-notifications');
  const notifDot = topbar.querySelector('.notification-dot');

  function updateNotificationsDot() {
    const notifs = store.getAll('notifications');
    const unread = notifs.filter(n => !n.read).length;
    if (unread > 0) {
      notifDot.style.display = 'block';
    } else {
      notifDot.style.display = 'none';
    }
  }

  store.on('notifications', updateNotificationsDot);
  updateNotificationsDot();

  // Deputy Asks Notification Badge
  const askBadge = topbar.querySelector('#deputy-ask-badge');
  function updateAskBadge() {
    if (!askBadge) return;
    const asks = store.getAll('deputyAsks') || [];
    const pending = asks.filter(a => a.status === 'pending').length;
    if (pending > 0) {
      askBadge.textContent = pending;
      askBadge.style.display = 'block';
      
      // Also add a little animation to draw attention
      askBadge.style.animation = 'none';
      askBadge.offsetHeight; /* trigger reflow */
      askBadge.style.animation = 'pulse-soft 2s infinite';
    } else {
      askBadge.style.display = 'none';
    }
  }
  store.on('deputyAsks', updateAskBadge);
  updateAskBadge();

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationsDropdown(notifBtn);
  });

  const helpBtn = topbar.querySelector('#btn-help');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      openHelpModal();
    });
  }

  // Relay assistant button — available on every page
  const relayBtn = topbar.querySelector('#btn-relay-assistant');
  relayBtn.addEventListener('click', () => toggleRelay());
  onRelayToggle(open => relayBtn.classList.toggle('active', open));

  // Navigate to profile on user click
  const userBtn = topbar.querySelector('#topbar-user');
  if (userBtn) {
    userBtn.style.cursor = 'pointer';
    userBtn.addEventListener('click', (e) => {
      if (e.target.closest('#ui-mode-toggle') || e.target.closest('.toggle-pill')) {
        return;
      }
      router.navigate('/profile');
    });
  }

  // Update on profile details update
  window.addEventListener('fieldforge-profile-updated', () => {
    updateTopbarAccess(topbar);
  });

  updateTopbarAccess(topbar);

  return topbar;
}

export function updateTopbarAccess(topbarEl) {
  const topbar = topbarEl || document.getElementById('topbar');
  if (!topbar) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  // --- Toggle visibility (re-evaluated every time, including after login) ---
  const uiToggle = topbar.querySelector('#ui-mode-toggle');
  if (uiToggle) {
    // Toggle is ONLY for local admin (single user) mode.
    //   'local'            → Local Admin (single user) — toggle VISIBLE
    //   'local_multiuser'  → Local System (multi user, PIN login) — toggle HIDDEN
    //   'cloud'            → Cloud — toggle HIDDEN
    const loginMode = localStorage.getItem('relay_login_mode');
    const isLocalAdminMode = loginMode === 'local';
    const toggleLabel = uiToggle.closest('label');
    if (isLocalAdminMode) {
      if (toggleLabel) toggleLabel.style.display = '';
      const savedMode = localStorage.getItem('uiMode') || 'admin';
      uiToggle.checked = savedMode === 'admin';
    } else {
      if (toggleLabel) toggleLabel.style.display = 'none';
    }
  }

  // --- Name / role / avatar ---
  const nameEl = topbar.querySelector('#topbar-name');
  const roleEl = topbar.querySelector('#topbar-role');
  const avatarEl = topbar.querySelector('#topbar-avatar');

  if (nameEl) nameEl.textContent = currentUser.name || 'Unknown User';
  if (roleEl) {
    // Priority 1: Use the explicit userTypeName from session (set during login)
    // Priority 2: Look up from userTypes collection
    // Priority 3: Fallback to roleMap
    let displayRole = currentUser.userTypeName;
    
    if (!displayRole && currentUser.userTypeId) {
      const ut = store.getById('userTypes', currentUser.userTypeId);
      if (ut) displayRole = ut.name;
    }

    if (!displayRole) {
      const roleMap = { 'admin': 'Administrator', 'manager': 'Manager', 'technician': 'Technician', 'customer': 'Customer' };
      displayRole = roleMap[currentUser.role] || currentUser.role;
    }

    // If local admin is using the toggle, show the toggled role instead
    const loginMode = localStorage.getItem('relay_login_mode');
    if (loginMode === 'local') {
      const uiMode = localStorage.getItem('uiMode') || 'admin';
      const modeMap = { 'admin': 'Complete Mode', 'technician': 'Simple Mode' };
      displayRole = modeMap[uiMode] || displayRole;
    }

    roleEl.textContent = displayRole;
  }

  if (avatarEl) {
    const nameStr = currentUser.name || '';
    const initials = nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    avatarEl.textContent = initials;
    avatarEl.style.backgroundColor = currentUser.color || '#FF5C00';
  }
}

function toggleNotificationsDropdown(btn) {
  let dropdown = document.querySelector('#notifications-dropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }

  const notifs = store.getAll('notifications').sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  dropdown.id = 'notifications-dropdown';
  dropdown.style.cssText = 'position:absolute;top:100%;right:0;margin-top:8px;width:320px;max-height:420px;overflow-y:auto;z-index:var(--z-dropdown);box-shadow:var(--shadow-lg);border-radius:var(--border-radius-md);background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,0,0,0.08);padding:0;';

  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    dropdown.style.background = 'rgba(13, 17, 30, 0.92)';
    dropdown.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  }

  const header = document.createElement('div');
  header.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center';
  header.innerHTML = '<h4 style="margin:0;font-size:var(--font-size-md);font-weight:var(--font-weight-semibold);color:var(--text-primary);">Notifications</h4>';
  
  const markAllBtn = document.createElement('button');
  markAllBtn.className = 'btn btn-ghost btn-sm';
  markAllBtn.style.cssText = 'font-size:11px;padding:4px 8px;';
  markAllBtn.textContent = 'Mark all as read';
  markAllBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const allNotifs = store.getAll('notifications');
    let changed = false;
    allNotifs.forEach(n => {
      if (!n.read) {
        n.read = true;
        n.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) {
      store.save('notifications', allNotifs);
    }
    dropdown.remove();
  });
  header.appendChild(markAllBtn);
  dropdown.appendChild(header);

  if (notifs.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = 'padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:var(--font-size-sm);display:flex;flex-direction:column;align-items:center;gap:8px;';
    emptyState.innerHTML = `
      <span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary);opacity:0.6;">notifications_off</span>
      <span>No notifications</span>
    `;
    dropdown.appendChild(emptyState);
  } else {
    const listContainer = document.createElement('div');
    listContainer.className = 'notifications-list';
    
    notifs.forEach(n => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.style.cssText = `padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${n.read ? 'transparent' : 'var(--color-info-bg)'};display:flex;align-items:flex-start;transition:background 0.2s;`;
      
      item.onmouseenter = () => {
        item.style.background = n.read ? 'var(--content-bg)' : 'rgba(37, 99, 235, 0.12)';
      };
      item.onmouseleave = () => {
        item.style.background = n.read ? 'transparent' : 'var(--color-info-bg)';
      };

      const dotHtml = n.read ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:var(--color-info);margin-top:5px;margin-right:8px;flex-shrink:0;"></span>';
      
      item.innerHTML = `
        ${dotHtml}
        <div style="flex:1">
          <div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:2px;color:var(--text-primary);">${n.title || n.type || 'Notification'}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;line-height:1.4;">${n.message || n.description || ''}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${new Date(n.createdAt).toLocaleString()}</div>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        store.update('notifications', n.id, { read: true });
        
        let targetLink = n.link;
        if (!targetLink) {
          if (n.jobId) {
            targetLink = `/jobs/${n.jobId}`;
          } else if (n.assetId) {
            targetLink = `/assets/${n.assetId}`;
          } else if (n.type === 'Low Stock' || (n.description && n.description.toLowerCase().includes('low stock'))) {
            targetLink = '/stock';
          }
        }

        if (targetLink) {
          router.navigate(targetLink);
        }
        dropdown.remove();
      });
      listContainer.appendChild(item);
    });
    dropdown.appendChild(listContainer);
  }

  btn.parentNode.style.position = 'relative';
  btn.parentNode.appendChild(dropdown);
  
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 0);
}

function showSearchResults(query) {
  hideSearchResults();

  const { store } = window.__fieldForge || {};
  if (!store) return;

  const results = [];
  const q = query.toLowerCase();

  // Search customers
  store.getAll('customers').forEach(c => {
    const company = c.company || '';
    const firstName = c.firstName || '';
    const lastName = c.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (company.toLowerCase().includes(q) || fullName.toLowerCase().includes(q)) {
      results.push({ type: 'Customer', label: company || fullName || 'Unnamed Customer', icon: 'people', path: `/people/${c.id}` });
    }
  });

  // Search jobs
  store.getAll('jobs').forEach(j => {
    const num = j.number || '';
    const title = j.title || '';
    const custName = j.customerName || '';
    if (num.toLowerCase().includes(q) || title.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Job', label: `${num} — ${title}`, icon: 'build', path: `/jobs/${j.id}` });
    }
  });

  // Search quotes
  store.getAll('quotes').forEach(qt => {
    const num = qt.number || '';
    const title = qt.title || '';
    const custName = qt.customerName || '';
    if (num.toLowerCase().includes(q) || title.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Quote', label: `${num} — ${custName || 'Unnamed Customer'}`, icon: 'request_quote', path: `/quotes/${qt.id}` });
    }
  });

  // Search invoices
  store.getAll('invoices').forEach(inv => {
    const num = inv.number || '';
    const custName = inv.customerName || '';
    if (num.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Invoice', label: `${num} — ${custName || 'Unnamed Customer'}`, icon: 'receipt_long', path: `/invoices/${inv.id}` });
    }
  });

  if (results.length === 0) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  dropdown.id = 'search-results';
  dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;';

  results.slice(0, 12).forEach(r => {
    const item = document.createElement('button');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${r.icon}</span>
      <span style="flex:1" class="truncate">${r.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${r.type}</span>
    `;
    item.addEventListener('click', () => {
      router.navigate(r.path);
      hideSearchResults();
      document.querySelector('#global-search').value = '';
    });
    dropdown.appendChild(item);
  });

  document.querySelector('.topbar-search').appendChild(dropdown);
}

function hideSearchResults() {
  const el = document.querySelector('#search-results');
  if (el) el.remove();
}

function getStoredTheme() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (currentUser && currentUser.id) {
    return currentUser.theme || localStorage.getItem(`simpro_theme_${currentUser.id}`) || 'light';
  }
  return 'light';
}

function applyStoredTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}

function openHelpModal() {
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="help-dashboard">
      <style>
        .help-dashboard {
          display: flex;
          gap: 24px;
          min-height: 420px;
          color: var(--text-primary);
          font-family: inherit;
        }
        .help-sidebar {
          flex: 0 0 200px;
          border-right: 1px solid var(--border-color);
          padding-right: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .help-nav-item {
          padding: 8px 12px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          text-align: left;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .help-nav-item:hover {
          background: var(--bg-color);
          color: var(--text-primary);
        }
        .help-nav-item.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-color: var(--color-primary-light);
          font-weight: 600;
        }
        .help-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .help-guide-panel {
          display: none;
        }
        .help-guide-panel.active {
          display: block;
        }
        .help-guide-panel h4 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .help-guide-panel p {
          margin: 0 0 12px 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        .help-guide-panel ul {
          margin: 0 0 12px 0;
          padding-left: 20px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .help-right-col {
          flex: 0 0 260px;
          border-left: 1px solid var(--border-color);
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .help-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-tertiary);
          margin-bottom: 10px;
        }
        .help-shortcut-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .help-shortcut-row kbd {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
        .help-action-card {
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
        }
        .help-action-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .help-action-card span.material-icons-outlined {
          color: var(--color-primary);
          font-size: 18px;
        }
        .help-action-info {
          display: flex;
          flex-direction: column;
        }
        .help-action-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .help-action-prompt {
          font-size: 10px;
          color: var(--text-tertiary);
          font-style: italic;
        }
      </style>

      <div class="help-sidebar">
        <button class="help-nav-item active" data-target="canvas">Infinite Canvas</button>
        <button class="help-nav-item" data-target="jobs">Jobs & Scheduling</button>
        <button class="help-nav-item" data-target="deputy">Deputy AI Assistant</button>
      </div>

      <div class="help-content">
        <div class="help-guide-panel active" id="guide-canvas">
          <h4>Mastering the Infinite Canvas</h4>
          <p>The core dashboard of Relay Dispatch functions as a dynamic, zoomable infinite workspace. You are not confined to a single page or layout grid.</p>
          <ul>
            <li><strong>Panning & Zooming:</strong> Click and drag the empty background to pan around the canvas. Use the scroll wheel to zoom in and out.</li>
            <li><strong>Quick Controls:</strong> Click the controls in the bottom-right corner to zoom to fit, zoom to 100%, or lock widgets to prevent accidental dragging.</li>
            <li><strong>Adding Quick Notes:</strong> Double-click any empty space on the background canvas to spawn a new, sticky Todo/Note widget.</li>
          </ul>
        </div>
        <div class="help-guide-panel" id="guide-jobs">
          <h4>Jobs & Smart Scheduling</h4>
          <p>Manage and dispatch technicians quickly and accurately with Relay's cohesive task lists and compliance forms.</p>
          <ul>
            <li><strong>Standard Jobs:</strong> Create one-off service or emergency repair tickets, assign jobsites, primary contacts, and custom tag pills.</li>
            <li><strong>Recurring Maintenance:</strong> Toggle "Recurring Job" during creation to generate repeating schedules (Weekly, Monthly, or Daily) over a specified date range.</li>
            <li><strong>Task Lists & Forms:</strong> Set up sub-tasks and expected values (such as pressure range readings) that technicians must log in the field.</li>
          </ul>
        </div>
        <div class="help-guide-panel" id="guide-deputy">
          <h4>Deputy Assistant co-pilot</h4>
          <p>Deputy is your automated assistant that can perform commands, aggregate metrics, and manage canvas layouts.</p>
          <ul>
            <li><strong>Opening Deputy:</strong> Click the Star icon in the top right bar or press <kbd>Shift</kbd> + <kbd>D</kbd> to open the co-pilot.</li>
            <li><strong>Direct Commands:</strong> Type in plain English to manage your screen. Try saying: <em>"add a schedule widget"</em> or <em>"zoom canvas to fit"</em>.</li>
            <li><strong>Overview Queries:</strong> Ask questions like: <em>"how many active jobs do we have?"</em> or <em>"show me overdue invoices"</em> to get immediate operational updates.</li>
          </ul>
        </div>
      </div>

      <div class="help-right-col">
        <div>
          <div class="help-section-title">Keyboard Shortcuts</div>
          <div class="help-shortcut-row">
            <span>Focus search bar</span>
            <kbd>/</kbd>
          </div>
          <div class="help-shortcut-row">
            <span>Toggle Deputy assistant</span>
            <kbd>Shift</kbd> + <kbd>D</kbd>
          </div>
          <div class="help-shortcut-row">
            <span>Close modal / panel</span>
            <kbd>Esc</kbd>
          </div>
        </div>

        <div>
          <div class="help-section-title">Ask Deputy AI</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="help-action-card" data-prompt="add a schedule widget">
              <span class="material-icons-outlined">calendar_today</span>
              <div class="help-action-info">
                <span class="help-action-label">Add Schedule Widget</span>
                <span class="help-action-prompt">"add a schedule widget"</span>
              </div>
            </button>
            <button class="help-action-card" data-prompt="show me active jobs">
              <span class="material-icons-outlined">construction</span>
              <div class="help-action-info">
                <span class="help-action-label">View Active Jobs</span>
                <span class="help-action-prompt">"show me active jobs"</span>
              </div>
            </button>
            <button class="help-action-card" data-prompt="show me the today view">
              <span class="material-icons-outlined">today</span>
              <div class="help-action-info">
                <span class="help-action-label">Show Today View</span>
                <span class="help-action-prompt">"show me today view"</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach tab navigation listeners
  content.querySelectorAll('.help-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      content.querySelectorAll('.help-nav-item').forEach(btn => btn.classList.remove('active'));
      content.querySelectorAll('.help-guide-panel').forEach(panel => panel.classList.remove('active'));
      
      item.classList.add('active');
      const target = item.dataset.target;
      content.querySelector(`#guide-${target}`).classList.add('active');
    });
  });

  const { close } = showModal({
    title: 'Help Center & Deputy Shortcuts',
    content,
    size: 'modal-lg'
  });

  // Attach interactive quick action triggers
  content.querySelectorAll('.help-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      close();
      openDeputyWithPrompt(prompt);
    });
  });
}

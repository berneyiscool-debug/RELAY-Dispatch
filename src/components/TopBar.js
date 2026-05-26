// ============================================
// SIMPRO CLONE — TOP BAR COMPONENT
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';

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
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${getStoredTheme() === 'dark' ? 'light_mode' : 'dark_mode'}</span>
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
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('simpro_theme', next);
    topbar.querySelector('#theme-icon').textContent = next === 'dark' ? 'light_mode' : 'dark_mode';
  });

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

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationsDropdown(notifBtn);
  });

  updateTopbarAccess(topbar);

  return topbar;
}

export function updateTopbarAccess(topbarEl) {
  const topbar = topbarEl || document.getElementById('topbar');
  if (!topbar) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

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
    roleEl.textContent = displayRole;
  }

  if (avatarEl) {
    const nameStr = currentUser.name || '';
    const initials = nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    avatarEl.textContent = initials;
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
          <div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:2px;color:var(--text-primary);">${n.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;line-height:1.4;">${n.message || n.description || ''}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${new Date(n.createdAt).toLocaleString()}</div>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        store.update('notifications', n.id, { read: true });
        if (n.link) {
          router.navigate(n.link);
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
    if (c.company.toLowerCase().includes(q) || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)) {
      results.push({ type: 'Customer', label: c.company, icon: 'people', path: `/people/${c.id}` });
    }
  });

  // Search jobs
  store.getAll('jobs').forEach(j => {
    if (j.number.toLowerCase().includes(q) || j.title.toLowerCase().includes(q) || j.customerName.toLowerCase().includes(q)) {
      results.push({ type: 'Job', label: `${j.number} — ${j.title}`, icon: 'build', path: `/jobs/${j.id}` });
    }
  });

  // Search quotes
  store.getAll('quotes').forEach(qt => {
    if (qt.number.toLowerCase().includes(q) || qt.title?.toLowerCase().includes(q) || qt.customerName.toLowerCase().includes(q)) {
      results.push({ type: 'Quote', label: `${qt.number} — ${qt.customerName}`, icon: 'request_quote', path: `/quotes/${qt.id}` });
    }
  });

  // Search invoices
  store.getAll('invoices').forEach(inv => {
    if (inv.number.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q)) {
      results.push({ type: 'Invoice', label: `${inv.number} — ${inv.customerName}`, icon: 'receipt_long', path: `/invoices/${inv.id}` });
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
  return localStorage.getItem('simpro_theme') || 'light';
}

function applyStoredTheme() {
  const theme = getStoredTheme();
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

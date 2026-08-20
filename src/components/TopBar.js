// ============================================
// SIMPRO CLONE — TOP BAR COMPONENT
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { applyTheme, THEMES } from '../utils/theme.js';
import { toggleRelay, onRelayToggle, openDeputyWithPrompt } from './RelayAssistant.js';
import { showModal } from './Modal.js';
import relayIcon from '../assets/deputy-icon.svg?raw';
import { getListSearch, getListSearchLabel } from '../utils/listSearch.js';
import { escapeHTML } from '../utils/security.js';

// Brand lockup for the top bar's left (moved up from the sidebar). Uses the
// company logo when set, else the Relay mark + wordmark.
function buildBrandHtml() {
  const s = store.getSettings() || {};
  if (s.logo) return `<img src="${s.logo}" class="topbar-brand-logo" alt="Logo" />`;
  return `<span class="topbar-brand-mark">R</span><span class="topbar-brand-name">Relay — Dispatch</span>`;
}

export function createTopBar() {
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.id = 'topbar';

  topbar.innerHTML = `
    <div class="topbar-brand" id="topbar-brand" title="Home" role="button" tabindex="0">
      ${buildBrandHtml()}
    </div>
    <div class="topbar-actions">
      <div class="topbar-search">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" id="global-search" placeholder="Search…" autocomplete="off" />
        <span class="topbar-search-kbd">Ctrl K</span>
      </div>
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
      <button class="topbar-action-btn" id="btn-notifications" title="Notices">
        <span class="material-icons-outlined">notifications</span>
        <span class="notification-dot"></span>
      </button>
      <!-- Simple/Complete mode toggle (local-admin only; profile block moved to the sidebar footer) -->
      <label class="toggle-pill" title="Toggle Simple/Complete Mode" style="display:none;">
        <input type="checkbox" id="ui-mode-toggle" />
        <span class="slider"></span>
      </label>
    </div>
  `;

  // Search functionality — context-aware: on a list page it filters that table
  // in place; everywhere else it's the global "jump to a record" search.
  const searchInput = topbar.querySelector('#global-search');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    const listHandler = getListSearch();
    if (listHandler) {
      listHandler(val.trim());
    } else {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = val.trim();
        if (query.length >= 1) {
          showSearchResults(query);
        } else {
          hideSearchResults();
        }
      }, 180);
    }
  });

  // Reflect the context in the placeholder, and clear the box when leaving a list.
  function updateSearchPlaceholder() {
    const rawLabel = getListSearchLabel();
    const hasSearch = !!getListSearch();
    if (hasSearch && rawLabel) {
      let clean = rawLabel.trim();
      clean = clean.replace(/^(search|filter)\s+/i, '').replace(/[\.\…]+$/g, '').trim();
      if (clean) {
        clean = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        searchInput.placeholder = `Search ${clean}...`;
      } else {
        searchInput.placeholder = 'Search...';
      }
    } else {
      searchInput.placeholder = 'Search...';
    }
    if (!hasSearch) searchInput.value = '';
  }

  window.addEventListener('relay-list-search-changed', updateSearchPlaceholder);
  updateSearchPlaceholder();

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

  // Notices logic
  const notifBtn = topbar.querySelector('#btn-notifications');
  const notifDot = topbar.querySelector('.notification-dot');

  function updateNoticesDot() {
    const notices = store.getAll('notices') || [];
    const unread = notices.filter(n => !n.read).length;
    if (unread > 0) {
      notifDot.style.display = 'block';
    } else {
      notifDot.style.display = 'none';
    }
  }

  store.on('notices', updateNoticesDot);
  updateNoticesDot();

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

  // Brand (moved up from the sidebar) → home; refresh when the company logo changes.
  const brandEl = topbar.querySelector('#topbar-brand');
  if (brandEl) {
    brandEl.addEventListener('click', () => router.navigate('/'));
    const refreshBrand = () => { const el = topbar.querySelector('#topbar-brand'); if (el) el.innerHTML = buildBrandHtml(); };
    window.addEventListener('simpro-settings-updated', refreshBrand);
    store.on('settings', refreshBrand);
  }

  // Profile display moved to the sidebar footer (see Sidebar.js). The top bar
  // now only carries search + Deputy + theme/help/notifications + the mode toggle.

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

  // Name / role / avatar now render in the sidebar footer
  // (Sidebar.updateSidebarProfile), refreshed via updateSidebarAccess on login
  // and the fieldforge-profile-updated event.
}

function toggleNotificationsDropdown(btn) {
  let dropdown = document.querySelector('#notifications-dropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }

  const notices = (store.getAll('notices') || [])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 40);
  
  dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  dropdown.id = 'notifications-dropdown';
  dropdown.style.cssText = 'position:absolute;top:100%;right:0;margin-top:8px;width:320px;max-height:420px;overflow-y:auto;z-index:var(--z-dropdown);box-shadow:var(--shadow-lg);border-radius:var(--border-radius-md);background:var(--card-bg);border:1px solid var(--card-border);padding:0;';
  // dark theme handled by [data-theme-mode="dark"] .dropdown-menu in components.css

  const header = document.createElement('div');
  header.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center';
  header.innerHTML = '<h4 style="margin:0;font-size:var(--font-size-md);font-weight:var(--font-weight-semibold);color:var(--text-primary);">Notices</h4>';
  
  const markAllBtn = document.createElement('button');
  markAllBtn.className = 'btn btn-ghost btn-sm';
  markAllBtn.style.cssText = 'font-size:11px;padding:4px 8px;';
  markAllBtn.textContent = 'Mark all as read';
  markAllBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const allNotices = store.getAll('notices') || [];
    let changed = false;
    allNotices.forEach(n => {
      if (!n.read) {
        n.read = true;
        n.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) {
      store.save('notices', allNotices);
    }
    dropdown.remove();
  });
  header.appendChild(markAllBtn);
  dropdown.appendChild(header);

  if (notices.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = 'padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:var(--font-size-sm);display:flex;flex-direction:column;align-items:center;gap:8px;';
    emptyState.innerHTML = `
      <span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary);opacity:0.6;">notifications_off</span>
      <span>No system notices</span>
    `;
    dropdown.appendChild(emptyState);
  } else {
    const listContainer = document.createElement('div');
    listContainer.className = 'notifications-list';
    
    notices.forEach(n => {
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
          <div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:2px;color:var(--text-primary);">${n.title || 'Notice'}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;line-height:1.4;">${n.message || ''}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        store.update('notices', n.id, { read: true });
        
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

  const storeObj = store || window.__fieldForge?.store;
  if (!storeObj) return;

  const results = [];
  const q = query.toLowerCase();

  // Search projects
  (storeObj.getAll('projects') || []).forEach(p => {
    const num = p.number || '';
    const name = p.name || '';
    const custName = p.customerName || '';
    if (num.toLowerCase().includes(q) || name.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Project', label: `${num} — ${name}`, icon: 'folder', path: `/projects/${p.id}` });
    }
  });

  // Search stock
  (storeObj.getAll('stock') || []).forEach(st => {
    const code = st.code || '';
    const name = st.name || '';
    const cat = st.category || '';
    if (code.toLowerCase().includes(q) || name.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
      results.push({ type: 'Stock', label: `${code ? `${code} — ` : ''}${name}`, icon: 'inventory_2', path: `/stock/${st.id}` });
    }
  });

  // Search kits
  (storeObj.getAll('kits') || []).forEach(k => {
    const name = k.name || '';
    const desc = k.description || '';
    if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
      results.push({ type: 'Kit', label: name, icon: 'card_giftcard', path: `/stock` });
    }
  });

  // Search customers / people
  (storeObj.getAll('customers') || []).forEach(c => {
    const company = c.company || '';
    const firstName = c.firstName || '';
    const lastName = c.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (company.toLowerCase().includes(q) || fullName.toLowerCase().includes(q)) {
      results.push({ type: 'Customer', label: company || fullName || 'Unnamed Customer', icon: 'people', path: `/people/${c.id}` });
    }
  });

  // Search jobs
  (storeObj.getAll('jobs') || []).forEach(j => {
    const num = j.number || '';
    const title = j.title || '';
    const custName = j.customerName || '';
    if (num.toLowerCase().includes(q) || title.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Job', label: `${num} — ${title}`, icon: 'build', path: `/jobs/${j.id}` });
    }
  });

  // Search quotes
  (storeObj.getAll('quotes') || []).forEach(qt => {
    const num = qt.number || '';
    const title = qt.title || '';
    const custName = qt.customerName || '';
    if (num.toLowerCase().includes(q) || title.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Quote', label: `${num} — ${custName || title || 'Quote'}`, icon: 'request_quote', path: `/quotes/${qt.id}` });
    }
  });

  // Search invoices
  (storeObj.getAll('invoices') || []).forEach(inv => {
    const num = inv.number || '';
    const custName = inv.customerName || '';
    if (num.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Invoice', label: `${num} — ${custName || 'Invoice'}`, icon: 'receipt_long', path: `/invoices/${inv.id}` });
    }
  });

  // Search suppliers
  (storeObj.getAll('suppliers') || []).forEach(sup => {
    const name = sup.name || '';
    const contact = sup.contactName || '';
    if (name.toLowerCase().includes(q) || contact.toLowerCase().includes(q)) {
      results.push({ type: 'Supplier', label: name, icon: 'local_shipping', path: `/suppliers/${sup.id}` });
    }
  });

  // Search purchase orders
  (storeObj.getAll('purchaseOrders') || []).forEach(po => {
    const num = po.number || '';
    const supName = po.supplierName || '';
    if (num.toLowerCase().includes(q) || supName.toLowerCase().includes(q)) {
      results.push({ type: 'PO', label: `${num} — ${supName || 'PO'}`, icon: 'shopping_bag', path: `/purchase-orders/${po.id}` });
    }
  });

  // Search assets
  (storeObj.getAll('assets') || []).forEach(ast => {
    const name = ast.name || '';
    const tag = ast.assetTag || '';
    if (name.toLowerCase().includes(q) || tag.toLowerCase().includes(q)) {
      results.push({ type: 'Asset', label: `${tag ? `${tag} — ` : ''}${name}`, icon: 'precision_manufacturing', path: `/assets/${ast.id}` });
    }
  });

  if (results.length === 0) return;

  const currentLabel = (getListSearchLabel() || '').toLowerCase();
  if (currentLabel) {
    results.sort((a, b) => {
      const aMatchesCurrent = a.type.toLowerCase().includes(currentLabel) || currentLabel.includes(a.type.toLowerCase());
      const bMatchesCurrent = b.type.toLowerCase().includes(currentLabel) || currentLabel.includes(b.type.toLowerCase());
      if (aMatchesCurrent && !bMatchesCurrent) return -1;
      if (!aMatchesCurrent && bMatchesCurrent) return 1;
      return 0;
    });
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  dropdown.id = 'search-results';
  dropdown.style.cssText = 'position:absolute; top:calc(100% + 4px); left:0; right:0; max-height:340px; overflow-y:auto; z-index:1050; background:var(--bg-card, #fff); border:1px solid var(--border-color, #e0e0e0); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.15); padding:4px 0;';

  results.slice(0, 10).forEach(r => {
    const item = document.createElement('button');
    item.className = 'dropdown-item';
    item.style.cssText = 'display:flex; align-items:center; gap:8px; width:100%; padding:8px 12px; border:none; background:none; text-align:left; cursor:pointer; font-size:13px; color:var(--text-primary); transition:background 0.15s ease;';
    item.innerHTML = `
      <span class="material-icons-outlined" style="font-size:16px; color:var(--color-primary)">${r.icon}</span>
      <span style="flex:1" class="truncate">${escapeHTML(r.label)}</span>
      <span class="badge badge-neutral" style="font-size:10px; padding:2px 6px">${escapeHTML(r.type)}</span>
    `;
    item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg-hover, rgba(0,0,0,0.04))'; });
    item.addEventListener('mouseleave', () => { item.style.background = 'none'; });
    item.addEventListener('click', () => {
      router.navigate(r.path);
      hideSearchResults();
      const sInput = document.querySelector('#global-search');
      if (sInput) sInput.value = '';
    });
    dropdown.appendChild(item);
  });

  const searchContainer = document.querySelector('.topbar-search');
  if (searchContainer) {
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);
  }
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

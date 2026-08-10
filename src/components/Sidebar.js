// ============================================
// RELAY — SIDEBAR COMPONENT (two-level master–detail)
// ============================================
// Supabase-style nav: a slim primary rail of top sections + a secondary
// submenu panel that opens beside it for grouped sections. Keeps the primary
// rail short (never scrolls); each group's pages live in the second panel.

import { router } from '../router.js';
import { store } from '../data/store.js';
import { hasPermission } from '../utils/permissions.js';

// Primary sections. Items without `items[]` are direct pages (no submenu);
// items with `items[]` open a secondary panel.
const navItems = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'schedule', icon: 'calendar_today', label: 'Schedule', path: '/schedule' },
  {
    category: 'Workflow', id: 'cat-workflow', icon: 'account_tree',
    items: [
      { id: 'leads', icon: 'trending_up', label: 'Leads', path: '/leads' },
      { id: 'notifications', icon: 'campaign', label: 'Notifications', path: '/notifications' },
      { id: 'quotes', icon: 'request_quote', label: 'Quotes', path: '/quotes' },
      { id: 'projects', icon: 'folder_copy', label: 'Projects', path: '/projects' },
      { id: 'jobs', icon: 'build', label: 'Jobs', path: '/jobs' },
      { id: 'invoices', icon: 'receipt_long', label: 'Invoices', path: '/invoices' },
    ],
  },
  {
    category: 'People', id: 'cat-people', icon: 'groups',
    items: [
      { id: 'people', icon: 'people', label: 'Customers', path: '/people' },
      { id: 'contractors', icon: 'engineering', label: 'Contractors', path: '/contractors' },
      { id: 'suppliers', icon: 'local_shipping', label: 'Suppliers', path: '/suppliers' },
    ],
  },
  {
    category: 'Resources', id: 'cat-resources', icon: 'widgets',
    items: [
      { id: 'assets', icon: 'precision_manufacturing', label: 'Assets', path: '/assets' },
      { id: 'stock', icon: 'inventory_2', label: 'Stock', path: '/stock' },
      { id: 'purchase-orders', icon: 'shopping_cart', label: 'Purchase Orders', path: '/purchase-orders' },
      { id: 'timesheets', icon: 'schedule', label: 'Timesheets', path: '/timesheets' },
    ],
  },
  {
    category: 'Admin', id: 'cat-admin', icon: 'admin_panel_settings',
    items: [
      { id: 'documents', icon: 'folder', label: 'Documents', path: '/documents' },
      { id: 'reports', icon: 'bar_chart', label: 'Reports', path: '/reports' },
      { id: 'settings', icon: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
];

let sidebarRef = null;

function isLocalMode() {
  return !store.companyId || String(store.companyId).startsWith('acct_');
}

function buildLogoHtml(settings, collapsed) {
  const logoSrc = collapsed ? (settings.logoSmall || settings.logo) : (settings.logo || settings.logoSmall);
  if (logoSrc) {
    return `<img src="${logoSrc}" class="custom-logo" id="sidebar-logo-img" style="max-height: calc(var(--topbar-height) - 16px); max-width: ${collapsed ? '32px' : '85%'}; object-fit: contain; display: block; margin: auto;" />`;
  }
  return `
    <div class="logo-icon">R</div>
    <span class="logo-text">Relay — Dispatch</span>
  `;
}

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar two-level';
  sidebar.id = 'sidebar';
  sidebarRef = sidebar;

  const railCollapsed = localStorage.getItem('simpro_rail_collapsed') === 'true';
  if (railCollapsed) sidebar.classList.add('rail-collapsed');

  const settings = store.getSettings();
  const local = isLocalMode();

  // --- Primary rail items ---
  let railHtml = '';
  navItems.forEach(item => {
    if (item.category) {
      railHtml += `
        <button class="rail-item rail-opener" data-section="${item.id}" data-id="${item.id}" id="rail-${item.id}" title="${item.category}">
          <span class="nav-icon"><span class="material-icons-outlined" aria-hidden="true">${item.icon}</span></span>
          <span class="nav-label">${item.category}</span>
          <span class="rail-caret material-icons-outlined" aria-hidden="true">chevron_right</span>
        </button>`;
    } else {
      const disabled = local && item.id === 'documents';
      railHtml += `
        <button class="rail-item rail-page ${disabled ? 'disabled-local' : ''}" data-path="${item.path}" data-id="${item.id}" id="rail-${item.id}" title="${item.label}" ${disabled ? 'data-tooltip="Requires Cloud Account" data-tooltip-pos="right"' : ''}>
          <span class="nav-icon"><span class="material-icons-outlined" aria-hidden="true">${item.icon}</span></span>
          <span class="nav-label">${item.label}</span>
        </button>`;
    }
  });

  // --- Secondary submenu panels (one per group, hidden until its section is active) ---
  let panelsHtml = '';
  navItems.forEach(item => {
    if (!item.category) return;
    let itemsHtml = '';
    item.items.forEach(child => {
      const disabled = local && child.id === 'documents';
      itemsHtml += `
        <button class="submenu-item ${disabled ? 'disabled-local' : ''}" data-path="${child.path}" data-id="${child.id}" id="nav-${child.id}" ${disabled ? 'data-tooltip="Requires Cloud Account" data-tooltip-pos="right"' : ''}>
          <span class="nav-icon"><span class="material-icons-outlined" aria-hidden="true">${child.icon}</span></span>
          <span class="nav-label">${child.label}</span>
        </button>`;
    });
    panelsHtml += `
      <div class="submenu-panel" data-section="${item.id}">
        <div class="submenu-head">${item.category}</div>
        <nav class="submenu-nav">${itemsHtml}</nav>
      </div>`;
  });

  sidebar.innerHTML = `
    <div class="sidebar-rail">
      <nav class="rail-nav" id="rail-nav">${railHtml}</nav>
      <div class="sidebar-footer">
        <button class="sidebar-profile" id="sidebar-profile" title="View profile">
          <span class="sidebar-profile-avatar" id="sidebar-profile-avatar" aria-hidden="true"><span class="material-icons-outlined">account_circle</span></span>
          <span class="sidebar-profile-info">
            <span class="sidebar-profile-name" id="sidebar-profile-name">Loading…</span>
            <span class="sidebar-profile-role" id="sidebar-profile-role">Role</span>
          </span>
        </button>
        <button id="btn-logout" class="rail-item rail-page">
          <span class="nav-icon"><span class="material-icons-outlined" aria-hidden="true">logout</span></span>
          <span class="nav-label">Logout</span>
        </button>
      </div>
      <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Collapse or expand the menu labels">
        <span class="material-icons-outlined" id="sidebar-toggle-icon" aria-hidden="true">chevron_left</span>
      </button>
    </div>
    <div class="sidebar-submenu" id="sidebar-submenu">${panelsHtml}</div>
  `;

  // --- Interaction ---
  sidebar.addEventListener('click', (e) => {
    // Group opener → reveal its submenu panel (does not navigate).
    const opener = e.target.closest('.rail-opener');
    if (opener) { setActiveSection(sidebar, opener.dataset.id); return; }

    // Logout handled by its own listener.
    if (e.target.closest('#btn-logout')) return;

    // Any page link (direct rail page or submenu item).
    const navBtn = e.target.closest('[data-path]');
    if (navBtn) {
      if (navBtn.classList.contains('disabled-local')) { e.preventDefault(); e.stopPropagation(); return; }
      const path = navBtn.dataset.path;
      if (path) router.navigate(path);
    }
  });

  // Profile (footer, above Logout).
  const profileBtn = sidebar.querySelector('#sidebar-profile');
  if (profileBtn) profileBtn.addEventListener('click', () => router.navigate('/profile'));
  window.addEventListener('fieldforge-profile-updated', () => updateSidebarProfile(sidebar));
  updateSidebarProfile(sidebar);

  // Toggle collapses the primary rail to icons only.
  const toggleBtn = sidebar.querySelector('#sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('rail-collapsed');
    localStorage.setItem('simpro_rail_collapsed', sidebar.classList.contains('rail-collapsed'));
  });

  // Logout confirm-in-place.
  const logoutBtn = sidebar.querySelector('#btn-logout');
  if (logoutBtn) {
    let confirmState = false;
    let resetTimeout = null;
    function resetLogoutBtn() {
      confirmState = false;
      logoutBtn.classList.remove('confirm-logout');
      const icon = logoutBtn.querySelector('.nav-icon .material-icons-outlined');
      if (icon) icon.textContent = 'logout';
      const label = logoutBtn.querySelector('.nav-label');
      if (label) label.textContent = 'Logout';
    }
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirmState) {
        confirmState = true;
        logoutBtn.classList.add('confirm-logout');
        const icon = logoutBtn.querySelector('.nav-icon .material-icons-outlined');
        if (icon) icon.textContent = 'warning';
        const label = logoutBtn.querySelector('.nav-label');
        if (label) label.textContent = 'Confirm';
        if (resetTimeout) clearTimeout(resetTimeout);
        resetTimeout = setTimeout(resetLogoutBtn, 3000);
      } else {
        if (resetTimeout) clearTimeout(resetTimeout);
        resetLogoutBtn();
        window.dispatchEvent(new CustomEvent('fieldforge-logout'));
      }
    });
    logoutBtn.addEventListener('mouseleave', () => {
      if (confirmState) { if (resetTimeout) clearTimeout(resetTimeout); resetLogoutBtn(); }
    });
  }

  // Initial access + route sync.
  updateSidebarAccess(sidebar);
  syncActiveFromRoute(sidebar, window.location.hash.slice(1) || '/');

  return sidebar;
}

// Show a section's submenu panel and mark its rail item active.
function setActiveSection(sidebar, sectionId) {
  sidebar = sidebar || sidebarRef || document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.querySelectorAll('.rail-item').forEach(r => {
    r.classList.toggle('active', r.dataset.id === sectionId);
  });
  let hasPanel = false;
  sidebar.querySelectorAll('.submenu-panel').forEach(p => {
    const on = p.dataset.section === sectionId;
    p.classList.toggle('active', on);
    if (on) hasPanel = true;
  });
  sidebar.classList.toggle('submenu-open', hasPanel);
}

// Sync rail + submenu to the current route.
function syncActiveFromRoute(sidebar, path) {
  sidebar = sidebar || sidebarRef || document.getElementById('sidebar');
  if (!sidebar) return;
  const basePath = path === '/' ? '/' : '/' + path.split('/').filter(Boolean)[0];

  let sectionId = null;
  for (const item of navItems) {
    if (item.category) {
      if (item.items.some(c => c.path === basePath)) { sectionId = item.id; break; }
    } else if (item.path === basePath) { sectionId = item.id; break; }
  }
  if (sectionId) setActiveSection(sidebar, sectionId);

  // Highlight the exact current page inside the panel.
  sidebar.querySelectorAll('.submenu-item').forEach(it => {
    it.classList.toggle('active', it.dataset.path === basePath);
  });
}

// Compute the current user's display identity for the sidebar profile block.
function getSidebarProfileInfo() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  const name = currentUser.name || 'Unknown User';
  let role = currentUser.userTypeName;
  if (!role && currentUser.userTypeId) {
    const ut = store.getById('userTypes', currentUser.userTypeId);
    if (ut) role = ut.name;
  }
  if (!role) {
    const roleMap = { admin: 'Administrator', manager: 'Manager', technician: 'Technician', customer: 'Customer' };
    role = roleMap[currentUser.role] || currentUser.role || 'User';
  }
  if (localStorage.getItem('relay_login_mode') === 'local') {
    const uiMode = localStorage.getItem('uiMode') || 'admin';
    role = ({ admin: 'Complete Mode', technician: 'Simple Mode' })[uiMode] || role;
  }
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  return { name, role, initials, color: currentUser.color || '#FF5C00' };
}

// Fill the footer profile block (avatar / name / role).
export function updateSidebarProfile(sidebarElement) {
  const sidebar = sidebarElement || sidebarRef || document.getElementById('sidebar');
  if (!sidebar) return;
  // Avatar renders the Lucide circle-user glyph (static markup); only name/role update here.
  const { name, role } = getSidebarProfileInfo();
  const nameEl = sidebar.querySelector('#sidebar-profile-name');
  const roleEl = sidebar.querySelector('#sidebar-profile-role');
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
}

export function updateSidebarAccess(sidebarElement) {
  const sidebar = sidebarElement || sidebarRef || document.getElementById('sidebar');
  if (!sidebar) return;
  updateSidebarProfile(sidebar);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  if (currentUser.role === 'customer') { sidebar.style.display = 'none'; return; }
  sidebar.style.display = '';

  // Permission-filter each page link (direct rail pages + submenu items).
  sidebar.querySelectorAll('.rail-page, .submenu-item').forEach(item => {
    if (item.id === 'btn-logout') { item.style.display = ''; return; }
    const labelEl = item.querySelector('.nav-label');
    if (!labelEl) return;
    const label = labelEl.textContent.trim();
    if (label === 'Dashboard' || label === 'Notifications') { item.style.display = ''; return; }
    const canView = hasPermission(label, 'view') || hasPermission(label, 'view_own');
    item.style.display = canView ? '' : 'none';
  });

  // Hide a group opener + panel if none of its pages are visible.
  navItems.forEach(item => {
    if (!item.category) return;
    const opener = sidebar.querySelector(`.rail-opener[data-section="${item.id}"]`);
    const panel = sidebar.querySelector(`.submenu-panel[data-section="${item.id}"]`);
    if (!panel) return;
    const anyVisible = Array.from(panel.querySelectorAll('.submenu-item')).some(it => it.style.display !== 'none');
    if (opener) opener.style.display = anyVisible ? '' : 'none';
  });
}

// Toggle the primary rail between labeled and icon-only.
export function toggleSidebar(sidebar) {
  sidebar = sidebar || sidebarRef || document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('rail-collapsed');
  localStorage.setItem('simpro_rail_collapsed', sidebar.classList.contains('rail-collapsed'));
}

export function updateSidebarActive(path) {
  syncActiveFromRoute(null, path || (window.location.hash.slice(1) || '/'));
}

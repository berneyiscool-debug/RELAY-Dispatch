// ============================================
// SIMPRO CLONE — SIDEBAR COMPONENT
// ============================================

import { router } from '../router.js';
import { store } from '../data/store.js';

const navItems = [
  { section: 'MAIN' },
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
  { section: 'WORKFLOW' },
  { id: 'people', icon: 'people', label: 'Customers', path: '/people' },
  { id: 'leads', icon: 'trending_up', label: 'Leads', path: '/leads' },
  { id: 'quotes', icon: 'request_quote', label: 'Quotes', path: '/quotes' },
  { id: 'jobs', icon: 'build', label: 'Jobs', path: '/jobs' },
  { id: 'timesheets', icon: 'schedule', label: 'Timesheets', path: '/timesheets' },
  { id: 'fleet', icon: 'local_shipping', label: 'Fleet', path: '/fleet' },
  { id: 'schedule', icon: 'calendar_today', label: 'Schedule', path: '/schedule' },
  { section: 'RESOURCES' },
  { id: 'contractors', icon: 'engineering', label: 'Contractors', path: '/contractors' },
  { id: 'stock', icon: 'inventory_2', label: 'Stock', path: '/stock' },
  { id: 'purchase-orders', icon: 'shopping_cart', label: 'Purchase Orders', path: '/purchase-orders' },
  { id: 'invoices', icon: 'receipt_long', label: 'Invoices', path: '/invoices' },
  { id: 'documents', icon: 'folder', label: 'Documents', path: '/documents' },
  { section: 'ANALYTICS' },
  { id: 'reports', icon: 'bar_chart', label: 'Reports', path: '/reports' },
  { section: 'SYSTEM' },
  { id: 'settings', icon: 'settings', label: 'Settings', path: '/settings' },
];

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  // Check saved expand state
  const isExpanded = localStorage.getItem('simpro_sidebar_expanded') === 'true';
  if (isExpanded) sidebar.classList.add('expanded');

  let html = `
    <div class="sidebar-logo" id="sidebar-logo">
      <div class="logo-icon">S</div>
      <span class="logo-text">SimPro</span>
    </div>
    <nav class="sidebar-nav">
  `;

  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{"role":"admin"}');

  navItems.forEach(item => {
    if (item.section) {
      html += `<div class="sidebar-section-label" data-section="${item.section}">${item.section}</div>`;
    } else {
      html += `
        <button class="sidebar-nav-item" data-path="${item.path}" data-id="${item.id}" id="nav-${item.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${item.icon}</span></span>
          <span class="nav-label">${item.label}</span>
        </button>
      `;
    }
  });

  html += `
    </nav>
    <div style="padding: 1rem;">
      <button id="btn-logout" class="btn btn-outline" style="width: 100%;">Logout</button>
    </div>
    <button class="sidebar-toggle" id="sidebar-toggle">
      <span class="material-icons-outlined" id="sidebar-toggle-icon">${isExpanded ? 'chevron_left' : 'chevron_right'}</span>
    </button>
  `;

  sidebar.innerHTML = html;

  // Event listeners
  sidebar.addEventListener('click', (e) => {
    const navItem = e.target.closest('.sidebar-nav-item');
    if (navItem) {
      const path = navItem.dataset.path;
      router.navigate(path);
    }
  });

  const logoBtn = sidebar.querySelector('#sidebar-logo');
  logoBtn.addEventListener('click', () => router.navigate('/'));

  const toggleBtn = sidebar.querySelector('#sidebar-toggle');
  toggleBtn.addEventListener('click', () => toggleSidebar(sidebar));

  const logoutBtn = sidebar.querySelector('#btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('currentUser');
      router.navigate('/login');
    });
  }

  // Initial access update
  updateSidebarAccess();

  return sidebar;
}

export function updateSidebarAccess() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{"role":"admin"}');

  if (currentUser.role === 'customer') {
    // Customers shouldn't see the sidebar at all really, but if they do, hide everything
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = '';
    
    let permissions = null;
    if (currentUser.userTypeId) {
      const ut = store.getById('userTypes', currentUser.userTypeId);
      if (ut && ut.permissions) {
        permissions = ut.permissions;
      }
    }

    // Hide specific items based on permissions
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      const labelEl = item.querySelector('.nav-label');
      if (!labelEl) return;
      const label = labelEl.textContent.trim();

      if (currentUser.role === 'admin') {
        item.style.display = '';
        return;
      }

      if (permissions) {
        const p = permissions.find(m => m.module === label);
        if (p && (p.view || p.create || p.edit || p.delete)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      } else {
        // Fallbacks for default roles if not using new permissions system
        if (label === 'Settings' || label === 'Reports' || label === 'Invoices') {
          item.style.display = 'none';
        }
      }
    });

    // Hide empty section labels
    document.querySelectorAll('.sidebar-section-label').forEach(sec => {
       let hasVisibleItems = false;
       let next = sec.nextElementSibling;
       while(next && next.classList.contains('sidebar-nav-item')) {
          if (next.style.display !== 'none') {
             hasVisibleItems = true;
             break;
          }
          next = next.nextElementSibling;
       }
       sec.style.display = hasVisibleItems ? '' : 'none';
    });
  }
}

function toggleSidebar(sidebar) {
  sidebar.classList.toggle('expanded');
  const isExpanded = sidebar.classList.contains('expanded');
  localStorage.setItem('simpro_sidebar_expanded', isExpanded);
  const icon = sidebar.querySelector('#sidebar-toggle-icon');
  icon.textContent = isExpanded ? 'chevron_left' : 'chevron_right';
}

export function updateSidebarActive(path) {
  const basePath = path === '/' ? '/' : '/' + path.split('/').filter(Boolean)[0];
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.path === basePath);
  });
}

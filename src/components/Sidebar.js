// ============================================
// SIMPRO CLONE — SIDEBAR COMPONENT
// ============================================

import { router } from '../router.js';
import { store } from '../data/store.js';

const navItems = [
  { section: 'MAIN' },
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'schedule', icon: 'calendar_today', label: 'Schedule', path: '/schedule' },
  { section: 'WORKFLOW' },
  { id: 'people', icon: 'people', label: 'Customers', path: '/people' },
  { id: 'leads', icon: 'trending_up', label: 'Leads', path: '/leads' },
  { id: 'notifications', icon: 'campaign', label: 'Notifications', path: '/notifications' },
  { id: 'quotes', icon: 'request_quote', label: 'Quotes', path: '/quotes' },
  { id: 'jobs', icon: 'build', label: 'Jobs', path: '/jobs' },
  { id: 'timesheets', icon: 'schedule', label: 'Timesheets', path: '/timesheets' },
  { section: 'RESOURCES' },
  { id: 'assets', icon: 'precision_manufacturing', label: 'Assets', path: '/assets' },
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
    <div class="sidebar-scroll-arrow up" id="sidebar-scroll-up">
      <span class="material-icons-outlined">keyboard_arrow_up</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
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
    <div class="sidebar-scroll-arrow down" id="sidebar-scroll-down">
      <span class="material-icons-outlined">keyboard_arrow_down</span>
    </div>
    <div style="padding: 8px 0; border-top: 1px solid rgba(255, 255, 255, 0.06);">
      <button id="btn-logout" class="sidebar-nav-item" style="width: calc(100% - 16px);">
        <span class="nav-icon"><span class="material-icons-outlined">logout</span></span>
        <span class="nav-label">Logout</span>
      </button>
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

  const nav = sidebar.querySelector('#sidebar-nav');
  const upArrow = sidebar.querySelector('#sidebar-scroll-up');
  const downArrow = sidebar.querySelector('#sidebar-scroll-down');

  const updateArrows = () => {
    if (sidebar.classList.contains('expanded')) {
      upArrow.classList.remove('visible');
      downArrow.classList.remove('visible');
      return;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = nav;
    upArrow.classList.toggle('visible', scrollTop > 0);
    downArrow.classList.toggle('visible', Math.ceil(scrollTop + clientHeight) < scrollHeight);
  };

  nav.addEventListener('scroll', updateArrows);
  
  upArrow.addEventListener('click', () => {
    nav.scrollBy({ top: -100, behavior: 'smooth' });
  });
  
  downArrow.addEventListener('click', () => {
    nav.scrollBy({ top: 100, behavior: 'smooth' });
  });

  // Call after some delay to ensure layout is done
  setTimeout(updateArrows, 100);

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
        // Page visible if ANY permission key is truthy
        const hasAnyPerm = p && Object.entries(p).some(([k, v]) => k !== 'module' && v === true);
        if (hasAnyPerm || label === 'Notifications' || label === 'Dashboard') {
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

    // Update arrows
    const nav = sidebar.querySelector('#sidebar-nav');
    const upArrow = sidebar.querySelector('#sidebar-scroll-up');
    const downArrow = sidebar.querySelector('#sidebar-scroll-down');
    if (nav && upArrow && downArrow && !sidebar.classList.contains('expanded')) {
      const { scrollTop, scrollHeight, clientHeight } = nav;
      upArrow.classList.toggle('visible', scrollTop > 0);
      downArrow.classList.toggle('visible', Math.ceil(scrollTop + clientHeight) < scrollHeight);
    }
  }
}

function toggleSidebar(sidebar) {
  sidebar.classList.toggle('expanded');
  const isExpanded = sidebar.classList.contains('expanded');
  localStorage.setItem('simpro_sidebar_expanded', isExpanded);
  const icon = sidebar.querySelector('#sidebar-toggle-icon');
  icon.textContent = isExpanded ? 'chevron_left' : 'chevron_right';
  
  // Update arrows state
  const nav = sidebar.querySelector('#sidebar-nav');
  const upArrow = sidebar.querySelector('#sidebar-scroll-up');
  const downArrow = sidebar.querySelector('#sidebar-scroll-down');
  if (nav && upArrow && downArrow) {
    if (isExpanded) {
      upArrow.classList.remove('visible');
      downArrow.classList.remove('visible');
    } else {
      const { scrollTop, scrollHeight, clientHeight } = nav;
      upArrow.classList.toggle('visible', scrollTop > 0);
      downArrow.classList.toggle('visible', Math.ceil(scrollTop + clientHeight) < scrollHeight);
    }
  }
}

export function updateSidebarActive(path) {
  const basePath = path === '/' ? '/' : '/' + path.split('/').filter(Boolean)[0];
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.path === basePath);
  });
}

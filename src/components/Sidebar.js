// ============================================
// SIMPRO CLONE — SIDEBAR COMPONENT
// ============================================

import { router } from '../router.js';

const navItems = [
  { section: 'MAIN' },
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
  { section: 'WORKFLOW' },
  { id: 'people', icon: 'people', label: 'People', path: '/people' },
  { id: 'leads', icon: 'trending_up', label: 'Leads', path: '/leads' },
  { id: 'quotes', icon: 'request_quote', label: 'Quotes', path: '/quotes' },
  { id: 'jobs', icon: 'build', label: 'Jobs', path: '/jobs' },
  { id: 'timesheets', icon: 'schedule', label: 'Timesheets', path: '/timesheets' },
  { id: 'schedule', icon: 'calendar_today', label: 'Schedule', path: '/schedule' },
  { section: 'RESOURCES' },
  { id: 'stock', icon: 'inventory_2', label: 'Stock', path: '/stock' },
  { id: 'purchase-orders', icon: 'shopping_cart', label: 'Purchase Orders', path: '/purchase-orders' },
  { id: 'invoices', icon: 'receipt_long', label: 'Invoices', path: '/invoices' },
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

  navItems.forEach(item => {
    if (item.section) {
      html += `<div class="sidebar-section-label">${item.section}</div>`;
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

  return sidebar;
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

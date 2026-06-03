// ============================================
// FIELDFORGE — SIDEBAR COMPONENT (CATEGORIZED)
// ============================================

import { router } from '../router.js';
import { store } from '../data/store.js';

// Structured navigation items with collapsible categories
const navItems = [
  // Top Level / Uncollapsed Items
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'schedule', icon: 'calendar_today', label: 'Schedule', path: '/schedule' },
  
  // Collapsible Category Groups
  {
    category: 'Workflow',
    id: 'cat-workflow',
    icon: 'account_tree',
    items: [
      { id: 'leads', icon: 'trending_up', label: 'Leads', path: '/leads' },
      { id: 'quotes', icon: 'request_quote', label: 'Quotes', path: '/quotes' },
      { id: 'jobs', icon: 'build', label: 'Jobs', path: '/jobs' },
      { id: 'notifications', icon: 'campaign', label: 'Notifications', path: '/notifications' },
      { id: 'invoices', icon: 'receipt_long', label: 'Invoices', path: '/invoices' }
    ]
  },
  {
    category: 'People',
    id: 'cat-people',
    icon: 'groups',
    items: [
      { id: 'people', icon: 'people', label: 'Customers', path: '/people' },
      { id: 'contractors', icon: 'engineering', label: 'Contractors', path: '/contractors' },
      { id: 'suppliers', icon: 'local_shipping', label: 'Suppliers', path: '/suppliers' }
    ]
  },
  {
    category: 'Resources',
    id: 'cat-resources',
    icon: 'widgets',
    items: [
      { id: 'assets', icon: 'precision_manufacturing', label: 'Assets', path: '/assets' },
      { id: 'stock', icon: 'inventory_2', label: 'Stock', path: '/stock' },
      { id: 'purchase-orders', icon: 'shopping_cart', label: 'Purchase Orders', path: '/purchase-orders' },
      { id: 'timesheets', icon: 'schedule', label: 'Timesheets', path: '/timesheets' }
    ]
  },
  {
    category: 'Admin',
    id: 'cat-admin',
    icon: 'admin_panel_settings',
    items: [
      { id: 'documents', icon: 'folder', label: 'Documents', path: '/documents' },
      { id: 'reports', icon: 'bar_chart', label: 'Reports', path: '/reports' },
      { id: 'settings', icon: 'settings', label: 'Settings', path: '/settings' }
    ]
  }
];

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  // Check saved expand state
  const isExpanded = localStorage.getItem('simpro_sidebar_expanded') === 'true';
  if (isExpanded) sidebar.classList.add('expanded');

  const settings = store.getSettings();
  const logoSrc = isExpanded 
    ? (settings.logo || settings.logoSmall) 
    : (settings.logoSmall || settings.logo);
  const logoHtml = logoSrc 
    ? `<img src="${logoSrc}" class="custom-logo" id="sidebar-logo-img" style="max-height: calc(var(--topbar-height) - 16px); max-width: ${isExpanded ? '85%' : '32px'}; object-fit: contain; display: block; margin: auto;" />`
    : `
      <div class="logo-icon">R</div>
      <span class="logo-text" style="${isExpanded ? 'display: block;' : 'display: none;'}">Relay — Dispatch</span>
    `;

  let html = `
    <div class="sidebar-logo ${settings.logo ? 'custom-logo-active' : ''}" id="sidebar-logo">
      ${logoHtml}
    </div>
    <div class="sidebar-scroll-arrow up" id="sidebar-scroll-up">
      <span class="material-icons-outlined">keyboard_arrow_up</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
  `;

  // Fetch collapsed states from localStorage
  let collapsedCats = {};
  try {
    collapsedCats = JSON.parse(localStorage.getItem('simpro_sidebar_collapsed_categories') || '{}');
  } catch (e) {}

  const currentPath = window.location.hash.slice(1) || '/';
  const basePath = currentPath === '/' ? '/' : '/' + currentPath.split('/').filter(Boolean)[0];

  // Render items loop
  navItems.forEach(item => {
    if (item.category) {
      // Auto expand categories that contain the active page
      const hasActiveChild = item.items.some(child => child.path === basePath);
      let isCollapsed = collapsedCats[item.id] === true;
      if (hasActiveChild) {
        isCollapsed = false; // Override saved collapsed state to keep active paths visible
      }

      html += `
        <div class="sidebar-category-container" data-category-id="${item.id}">
          <button class="sidebar-category-header" data-category-id="${item.id}" id="cat-header-${item.id}">
            <span class="category-chevron">
              <span class="material-icons-outlined">${isCollapsed ? 'keyboard_arrow_right' : 'expand_more'}</span>
            </span>
            <span class="category-icon">
              <span class="material-icons-outlined">${item.icon}</span>
            </span>
            <span class="category-label">${item.category}</span>
          </button>
          <div class="sidebar-category-items ${isCollapsed ? 'collapsed' : ''}" id="cat-items-${item.id}">
      `;

      item.items.forEach(child => {
        html += `
          <button class="sidebar-nav-item sub-item" data-path="${child.path}" data-id="${child.id}" id="nav-${child.id}">
            <span class="nav-icon"><span class="material-icons-outlined">${child.icon}</span></span>
            <span class="nav-label">${child.label}</span>
          </button>
        `;
      });

      html += `
          </div>
        </div>
      `;
    } else {
      // Top Level Item
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
    // 1. Collapsible category header click (only active when expanded)
    const catHeader = e.target.closest('.sidebar-category-header');
    if (catHeader) {
      if (!sidebar.classList.contains('expanded')) return; // Ignore clicks if sidebar is collapsed (hover triggers flyout)
      
      const catId = catHeader.dataset.categoryId;
      const itemsContainer = sidebar.querySelector(`#cat-items-${catId}`);
      const chevronSpan = catHeader.querySelector('.category-chevron .material-icons-outlined');

      if (itemsContainer && chevronSpan) {
        itemsContainer.classList.toggle('collapsed');
        const isCollapsed = itemsContainer.classList.contains('collapsed');
        chevronSpan.textContent = isCollapsed ? 'keyboard_arrow_right' : 'expand_more';

        // Persist collapsed state
        try {
          const collapsed = JSON.parse(localStorage.getItem('simpro_sidebar_collapsed_categories') || '{}');
          collapsed[catId] = isCollapsed;
          localStorage.setItem('simpro_sidebar_collapsed_categories', JSON.stringify(collapsed));
        } catch (err) {}
      }
      return;
    }

    // 2. Navigation item click
    const navItem = e.target.closest('.sidebar-nav-item');
    if (navItem && navItem.id !== 'btn-logout') {
      const path = navItem.dataset.path;
      if (path) router.navigate(path);
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
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent sidebar click handler
      window.dispatchEvent(new CustomEvent('fieldforge-logout'));
    });
  }

  // --- MINIMIZED SIDEBAR HOVER PORTAL FLYOUT MANAGER ---
  sidebar.querySelectorAll('.sidebar-category-container').forEach(container => {
    let flyout = null;
    let keepOpenTimeout = null;

    function removeFlyout() {
      if (flyout) {
        flyout.remove();
        flyout = null;
      }
    }

    container.addEventListener('mouseenter', () => {
      // Only show portal flyouts if the sidebar is collapsed (non-expanded)
      if (sidebar.classList.contains('expanded')) return;
      
      if (keepOpenTimeout) {
        clearTimeout(keepOpenTimeout);
        keepOpenTimeout = null;
      }

      if (flyout) return;

      const catId = container.dataset.categoryId;
      const catHeader = container.querySelector('.sidebar-category-header');
      const itemsContainer = container.querySelector('.sidebar-category-items');
      if (!catHeader || !itemsContainer) return;

      // Extract currently visible items (incorporates permission checks!)
      const visibleItems = Array.from(itemsContainer.querySelectorAll('.sidebar-nav-item'))
        .filter(el => el.style.display !== 'none');

      if (visibleItems.length === 0) return;

      // Create floating viewport portal container
      flyout = document.createElement('div');
      flyout.className = 'sidebar-collapsed-flyout';
      flyout.id = `flyout-${catId}`;
      
      let subItemsHtml = '';
      visibleItems.forEach(item => {
        const isActive = item.classList.contains('active');
        subItemsHtml += `
          <button class="sidebar-nav-item sub-item ${isActive ? 'active' : ''}" data-path="${item.dataset.path}" data-id="${item.dataset.id}">
            <span class="nav-icon">${item.querySelector('.nav-icon').innerHTML}</span>
            <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">${item.querySelector('.nav-label').textContent}</span>
          </button>
        `;
      });
      flyout.innerHTML = subItemsHtml;

      document.body.appendChild(flyout);

      // Position popover floating directly next to category group icon
      const rect = catHeader.getBoundingClientRect();
      flyout.style.position = 'fixed';
      flyout.style.left = `${rect.right + 2}px`;
      flyout.style.top = `${rect.top}px`;
      flyout.style.zIndex = '99999';

      // Set up navigation click intercepts
      flyout.addEventListener('click', (e) => {
        const navItem = e.target.closest('.sidebar-nav-item');
        if (navItem) {
          const path = navItem.dataset.path;
          if (path) {
            router.navigate(path);
            removeFlyout();
          }
        }
      });

      // Keep flyout alive when cursor enters popover area
      flyout.addEventListener('mouseenter', () => {
        if (keepOpenTimeout) {
          clearTimeout(keepOpenTimeout);
          keepOpenTimeout = null;
        }
      });

      flyout.addEventListener('mouseleave', () => {
        keepOpenTimeout = setTimeout(removeFlyout, 120);
      });
    });

    container.addEventListener('mouseleave', () => {
      if (sidebar.classList.contains('expanded')) return;
      keepOpenTimeout = setTimeout(removeFlyout, 120);
    });
  });

  // Listen for settings changes (e.g. logo update)
  window.addEventListener('simpro-settings-updated', () => {
    const s = store.getSettings();
    const logoContainer = sidebar.querySelector('#sidebar-logo');
    const isExpandedNow = sidebar.classList.contains('expanded');
    const logoSrc = isExpandedNow 
      ? (s.logo || s.logoSmall) 
      : (s.logoSmall || s.logo);

    if (logoSrc) {
      logoContainer.innerHTML = `
        <img src="${logoSrc}" class="custom-logo" id="sidebar-logo-img" style="max-height: calc(var(--topbar-height) - 16px); max-width: ${isExpandedNow ? '85%' : '32px'}; object-fit: contain; display: block; margin: auto;" />
      `;
    } else {
      logoContainer.innerHTML = `
        <div class="logo-icon">R</div>
        <span class="logo-text" style="${isExpandedNow ? 'display: block;' : 'display: none;'}">Relay — Dispatch</span>
      `;
    }
  });

  return sidebar;
}

export function updateSidebarAccess(sidebarElement) {
  const sidebar = sidebarElement || document.getElementById('sidebar');
  if (!sidebar) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  if (currentUser.role === 'customer') {
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
    sidebar.querySelectorAll('.sidebar-nav-item').forEach(item => {
      // Never hide the logout button
      if (item.id === 'btn-logout') {
        item.style.display = '';
        return;
      }

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

    // Hide empty category containers
    sidebar.querySelectorAll('.sidebar-category-container').forEach(container => {
      const subItems = container.querySelectorAll('.sidebar-nav-item');
      let hasVisibleItems = false;
      subItems.forEach(item => {
        if (item.style.display !== 'none') {
          hasVisibleItems = true;
        }
      });
      container.style.display = hasVisibleItems ? '' : 'none';
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

export function toggleSidebar(sidebar) {
  sidebar.classList.toggle('expanded');
  const isExpanded = sidebar.classList.contains('expanded');
  localStorage.setItem('simpro_sidebar_expanded', isExpanded);
  const icon = sidebar.querySelector('#sidebar-toggle-icon');
  icon.textContent = isExpanded ? 'chevron_left' : 'chevron_right';
  
  // Toggle branding elements
  const s = store.getSettings();
  const customImg = sidebar.querySelector('.custom-logo');
  const logoText = sidebar.querySelector('.logo-text');
  
  if (customImg) {
    customImg.src = isExpanded 
      ? (s.logo || s.logoSmall) 
      : (s.logoSmall || s.logo);
    customImg.style.maxWidth = isExpanded ? '85%' : '32px';
  }
  if (logoText) logoText.style.display = isExpanded ? 'block' : 'none';

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

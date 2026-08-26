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
// Rule: any submenu tab that opens into child tabs of its own carries
// `hasChildren: true` so it renders the same right chevron the rail uses
// (see the panel builder below and renderSubmenuItem for contextual groups).
const navItems = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'schedule', icon: 'calendar_today', label: 'Schedule', path: '/schedule' },
  {
    category: 'Workflow', id: 'cat-workflow', icon: 'account_tree',
    items: [
      { id: 'notifications', icon: 'campaign', label: 'Notifications', path: '/notifications' },
      { id: 'leads', icon: 'trending_up', label: 'Leads', path: '/leads', hasChildren: true, dividerAfter: true },
      { id: 'quotes', icon: 'request_quote', label: 'Quotes', path: '/quotes' },
      { id: 'jobs', icon: 'build', label: 'Jobs', path: '/jobs' },
      { id: 'invoices', icon: 'receipt_long', label: 'Invoices', path: '/invoices', dividerAfter: true },
      { id: 'recurring_templates', icon: 'event_repeat', label: 'Recurring Templates', path: '/recurring-templates' },
      { id: 'projects', icon: 'folder_copy', label: 'Projects', path: '/projects' },
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
      { id: 'stock', icon: 'inventory_2', label: 'Stock', path: '/stock', hasChildren: true },
      { id: 'purchase-orders', icon: 'shopping_cart', label: 'Purchase Orders', path: '/purchase-orders', dividerAfter: true },
      { id: 'timesheets', icon: 'schedule', label: 'Timesheets', path: '/timesheets' },
    ],
  },
  {
    category: 'Admin', id: 'cat-admin', icon: 'admin_panel_settings',
    items: [
      { id: 'documents', icon: 'folder', label: 'Documents', path: '/documents', hasChildren: true },
      { id: 'reports', icon: 'bar_chart', label: 'Reports', path: '/reports', hasChildren: true, dividerAfter: true },
      { id: 'settings', icon: 'settings', label: 'Settings', path: '/settings', hasChildren: true },
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
          ${child.hasChildren ? `<span class="rail-caret material-icons-outlined" aria-hidden="true" style="font-size:16px;opacity:0.45;flex:none;margin-left:auto">chevron_right</span>` : ''}
        </button>`;
      if (child.dividerAfter) {
        itemsHtml += `<div class="submenu-divider" role="separator" aria-hidden="true"></div>`;
      }
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

    // Contextual back button that re-opens its parent group submenu (no navigation).
    const backSectionBtn = e.target.closest('.submenu-context-back[data-back-section]');
    if (backSectionBtn) {
      e.preventDefault();
      const ctxPanel = sidebar.querySelector('.submenu-panel.contextual-panel');
      if (ctxPanel) ctxPanel.remove();
      setActiveSection(sidebar, backSectionBtn.dataset.backSection);
      return;
    }

    // Any page link (direct rail page or submenu item).
    const navBtn = e.target.closest('[data-path]');
    if (navBtn) {
      e.preventDefault();
      if (navBtn.classList.contains('disabled-local')) { e.stopPropagation(); return; }
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

// Quick HTML escaping helper
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to resolve dynamic entity/settings contextual submenus
function getContextualMenu(hash) {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathOnly, queryString] = cleanHash.split('?');
  const params = new URLSearchParams(queryString || '');
  const activeTab = params.get('tab');

  const parts = pathOnly.split('/').filter(Boolean);
  const resource = parts[0];
  const id = parts[1];
  const isEdit = parts[2] === 'edit';

  // Job Form: Create (/jobs/new) or Edit (/jobs/:id/edit)
  if (resource === 'jobs' && (id === 'new' || isEdit)) {
    const job = isEdit && id ? store.getById('jobs', id) : null;
    const jobTitle = isEdit ? (job ? `Edit Job #${job.number}` : 'Edit Job') : 'New Job';
    const currentTab = activeTab || 'details';
    const basePath = id === 'new' ? '/jobs/new' : `/jobs/${id}/edit`;

    const buildTabPath = (tabId) => {
      const qParams = new URLSearchParams(queryString || '');
      qParams.set('tab', tabId);
      return `${basePath}?${qParams.toString()}`;
    };

    return {
      railId: 'cat-workflow',
      headerTitle: jobTitle,
      icon: 'build',
      backPath: isEdit ? `/jobs/${id}` : '/jobs',
      backLabel: isEdit ? 'Back to Job' : 'Back to Jobs',
      items: [
        { id: 'details', icon: 'assignment', label: 'Details', path: buildTabPath('details') },
        { id: 'asset', icon: 'inventory_2', label: 'Asset / Equipment', path: buildTabPath('asset') },
        { id: 'scheduling', icon: 'event', label: 'Scheduling', path: buildTabPath('scheduling') },
        { id: 'tasks', icon: 'checklist', label: 'Tasklists', path: buildTabPath('tasks') },
        { id: 'forms', icon: 'fact_check', label: 'Compliance Forms', path: buildTabPath('forms') }
      ],
      activeTab: currentTab
    };
  }

  if (!resource || id === 'new' || isEdit) return null;

  // Settings page (/settings)
  if (resource === 'settings') {
    // Company-type gating mirrors Settings.js: every tab stays visible, but the
    // ones that don't apply to the current account type are greyed out (disabled)
    // instead of hidden — so users can see what other plans unlock. Keep this in
    // sync with the flags computed in renderSettings() (src/pages/Settings.js).
    const local = isLocalMode();
    const deploymentType = (store.getSettings().localDeploymentType) || 'single_user';
    const portalDisabled = local;                                     // portals are cloud-only
    const folderSyncDisabled = !local;                                // folder sync is local-only
    const usersDisabled = local && deploymentType === 'single_user';  // needs cloud or multi-user local

    const groups = [
      {
        id: 'general', label: 'General', icon: 'settings',
        items: [
          { id: 'company', icon: 'business', label: 'Company Profile', path: '/settings?tab=company' },
          { id: 'portal', icon: 'web', label: 'Customer Portal', path: '/settings?tab=portal', disabled: portalDisabled, tooltip: 'Requires Cloud Account' },
          { id: 'portal_contractor', icon: 'engineering', label: 'Contractor Portal', path: '/settings?tab=portal_contractor', disabled: portalDisabled, tooltip: 'Requires Cloud Account' },
          { id: 'folder_sync', icon: 'sync', label: 'Folder Sync', path: '/settings?tab=folder_sync', disabled: folderSyncDisabled, tooltip: 'Requires Local Folder Storage' },
          { id: 'api_keys', icon: 'vpn_key', label: 'API Keys', path: '/settings?tab=api_keys' },
          { id: 'system', icon: 'tune', label: 'System Options', path: '/settings?tab=system' }
        ]
      },
      {
        id: 'workflow', label: 'Workflow', icon: 'account_tree',
        items: [
          { id: 'templates_forms', icon: 'description', label: 'Templates & Forms', path: '/settings?tab=templates_forms' },
          { id: 'invoices_quotes', icon: 'receipt_long', label: 'Quotes & Invoices', path: '/settings?tab=invoices_quotes' },
          { id: 'payments', icon: 'payments', label: 'Payments', path: '/settings?tab=payments', disabled: local, tooltip: 'Requires Cloud Account' },
          { id: 'email', icon: 'email', label: 'Email & Domain', path: '/settings?tab=email', disabled: local, tooltip: 'Requires Cloud Account' }
        ]
      },
      {
        id: 'people', label: 'People', icon: 'groups',
        items: [
          { id: 'users', icon: 'group', label: 'Users', path: '/settings?tab=users', disabled: usersDisabled, tooltip: 'Requires Cloud Account or Multi-User Local' },
          { id: 'user_types', icon: 'admin_panel_settings', label: 'User Types & Permissions', path: '/settings?tab=user_types', disabled: usersDisabled, tooltip: 'Requires Cloud Account or Multi-User Local' },
          { id: 'password_recovery', icon: 'lock_reset', label: 'Password Recovery', path: '/settings?tab=password_recovery', disabled: usersDisabled, tooltip: 'Requires Cloud Account or Multi-User Local' },
          { id: 'suppliers', icon: 'local_shipping', label: 'Suppliers', path: '/settings?tab=suppliers' }
        ]
      },
      {
        id: 'resources', label: 'Resources', icon: 'widgets',
        items: [
          { id: 'materials', icon: 'inventory_2', label: 'Materials & Catalog', path: '/settings?tab=materials' },
          { id: 'storage_options', icon: 'warehouse', label: 'Storage Options', path: '/settings?tab=storage_options' },
          { id: 'cost_centers', icon: 'account_balance', label: 'Cost Centers & Xero', path: '/settings?tab=cost_centers' },
          { id: 'tax', icon: 'percent', label: 'Tax & Labor Rates', path: '/settings?tab=tax' },
          // No Settings page behind this yet — shown greyed so it's discoverable.
          { id: 'integrations', icon: 'hub', label: 'Integrations', path: '/settings?tab=integrations', disabled: true, tooltip: 'Coming soon — third-party integrations' }
        ]
      }
    ];

    // No tab param → group list. A tab param → drill into its group.
    const openGroup = activeTab ? groups.find(g => g.items.some(item => item.id === activeTab)) : null;

    return {
      railId: 'cat-admin',
      headerTitle: openGroup ? openGroup.label : 'Settings & Config',
      icon: openGroup ? openGroup.icon : 'settings',
      backPath: openGroup ? '/settings' : undefined,
      backLabel: openGroup ? 'Back to Settings' : undefined,
      groups,
      openGroupId: openGroup ? openGroup.id : null,
      activeTab: activeTab
    };
  }

  // Stock List (/stock)
  if (resource === 'stock' && !id) {
    const currentTab = activeTab || 'items';
    return {
      railId: 'cat-resources',
      headerTitle: 'Stock & Inventory',
      icon: 'inventory_2',
      backSection: 'cat-resources',
      backLabel: 'Back to Resources',
      items: [
        { id: 'items', icon: 'inventory_2', label: 'Individual Items', path: '/stock?tab=items' },
        { id: 'kits', icon: 'widgets', label: 'Kit Bundles', path: '/stock?tab=kits' }
      ],
      activeTab: currentTab
    };
  }

  // Documents List (/documents)
  if (resource === 'documents' && !id) {
    const currentTab = activeTab || 'All Documents';
    return {
      railId: 'cat-admin',
      headerTitle: 'Document Center',
      icon: 'folder',
      items: [
        { id: 'All Documents', icon: 'dashboard', label: 'All Documents', path: '/documents?tab=All%20Documents' },
        { id: 'Company Docs', icon: 'domain', label: 'Company Docs', path: '/documents?tab=Company%20Docs' },
        { id: 'Health & Safety', icon: 'health_and_safety', label: 'Health & Safety', path: '/documents?tab=Health%20&%20Safety' },
        { id: 'Templates', icon: 'file_copy', label: 'Templates', path: '/documents?tab=Templates' },
        { id: 'Job Attachments', icon: 'build', label: 'Job Attachments', path: '/documents?tab=Job%20Attachments' },
        { id: 'Customer Attachments', icon: 'people', label: 'Customer Attachments', path: '/documents?tab=Customer%20Attachments' },
        { id: 'Digital Forms', icon: 'assignment', label: 'Digital Forms', path: '/documents?tab=Digital%20Forms' },
        { id: 'Invoices', icon: 'receipt_long', label: 'Invoices', path: '/documents?tab=Invoices' },
        { id: 'Quotes', icon: 'request_quote', label: 'Quotes', path: '/documents?tab=Quotes' },
        { id: 'Purchase Orders', icon: 'shopping_cart', label: 'Purchase Orders', path: '/documents?tab=Purchase%20Orders' }
      ],
      activeTab: currentTab
    };
  }

  // Reports List (/reports)
  if (resource === 'reports' && !id) {
    const currentTab = activeTab || 'overview';
    return {
      railId: 'cat-admin',
      headerTitle: 'Reports & Analytics',
      icon: 'bar_chart',
      items: [
        { id: 'overview', icon: 'dashboard', label: 'Business Overview', path: '/reports?tab=overview' },
        { id: 'revenue', icon: 'trending_up', label: 'Revenue & Profit', path: '/reports?tab=revenue' },
        { id: 'jobs', icon: 'build', label: 'Job Performance', path: '/reports?tab=jobs' },
        { id: 'job_costing', icon: 'price_check', label: 'Job Costing', path: '/reports?tab=job_costing' },
        { id: 'technicians', icon: 'engineering', label: 'Technician Productivity', path: '/reports?tab=technicians' },
        { id: 'timesheets_labor', icon: 'schedule', label: 'Timesheet & Labor', path: '/reports?tab=timesheets_labor' },
        { id: 'assets_maintenance', icon: 'settings', label: 'Asset Maintenance', path: '/reports?tab=assets_maintenance' },
        { id: 'customers', icon: 'people', label: 'Customer Analysis', path: '/reports?tab=customers' },
        { id: 'inventory', icon: 'inventory_2', label: 'Inventory Report', path: '/reports?tab=inventory' },
      ],
      activeTab: currentTab
    };
  }

  // Leads List (/leads)
  if (resource === 'leads' && !id) {
    const currentTab = activeTab || 'Internal';
    return {
      railId: 'cat-workflow',
      headerTitle: 'Leads',
      icon: 'trending_up',
      backSection: 'cat-workflow',
      backLabel: 'Back to Workflow',
      items: [
        { id: 'Internal', icon: 'business', label: 'Internal', path: '/leads?tab=Internal' },
        { id: 'Marketplace', icon: 'storefront', label: 'Marketplace', path: '/leads?tab=Marketplace' }
      ],
      activeTab: currentTab
    };
  }

  if (!id) return null;

  // Customer Detail (/people/:id)
  if (resource === 'people') {
    const cust = store.getById('customers', id);
    const custTitle = cust ? (cust.company || `${cust.firstName || ''} ${cust.lastName || ''}`.trim()) : 'Customer Detail';
    const currentTab = activeTab || 'overview';
    return {
      railId: 'cat-people',
      headerTitle: custTitle,
      icon: 'people',
      backPath: '/people',
      backLabel: 'Back to Customers',
      items: [
        { id: 'overview', icon: 'dashboard', label: 'Overview', path: `/people/${id}?tab=overview` },
        { id: 'sites', icon: 'location_on', label: 'Sites / Locations', path: `/people/${id}?tab=sites` },
        { id: 'financials', icon: 'account_balance', label: 'Financials', path: `/people/${id}?tab=financials` },
        { id: 'jobs', icon: 'build', label: 'Jobs & Workflow', path: `/people/${id}?tab=jobs` }
      ],
      activeTab: currentTab
    };
  }

  // Project Detail (/projects/:id)
  if (resource === 'projects') {
    const project = store.getById('projects', id);
    const projectTitle = project ? (project.name || `Project #${project.number || id}`) : 'Project Detail';
    const currentTab = activeTab || 'overview';
    return {
      railId: 'cat-workflow',
      headerTitle: projectTitle,
      icon: 'folder_copy',
      backPath: '/projects',
      backLabel: 'Back to Projects',
      items: [
        { id: 'overview', icon: 'dashboard', label: 'Overview', path: `/projects/${id}?tab=overview` },
        { id: 'stages', icon: 'view_list', label: 'Stages & Jobs', path: `/projects/${id}?tab=stages` },
        { id: 'financials', icon: 'payments', label: 'Financials', path: `/projects/${id}?tab=financials` }
      ],
      activeTab: currentTab
    };
  }

  // Job Detail (/jobs/:id)
  if (resource === 'jobs') {
    const job = store.getById('jobs', id);
    const isRecurring = job?.isRecurring === true || job?.status === 'Recurring Template';
    const jobTitle = job ? (isRecurring ? `Template ${job.number}` : `Job #${job.number}`) : 'Job Detail';
    const currentTab = activeTab || 'overview';
    const customerCommCount = job?.customerActivityLog?.length || 0;

    const navTabs = [
      { id: 'overview', icon: 'dashboard', label: 'Overview', path: `/jobs/${id}?tab=overview` },
      { id: 'schedule', icon: 'event', label: 'Schedule', path: `/jobs/${id}?tab=schedule` },
      { id: 'tasks', icon: 'checklist', label: 'Tasks', path: `/jobs/${id}?tab=tasks` },
      { id: 'materials', icon: 'inventory_2', label: 'Materials & POs', path: `/jobs/${id}?tab=materials` },
      { id: 'financials', icon: 'price_check', label: isRecurring ? 'Contract Performance' : 'Financials', path: `/jobs/${id}?tab=financials` }
    ];

    if (!isRecurring) {
      navTabs.push(
        { id: 'activity_staff', icon: 'history', label: 'Staff Activity', path: `/jobs/${id}?tab=activity_staff` },
        { id: 'activity_customer', icon: 'forum', label: 'Customer Portal', path: `/jobs/${id}?tab=activity_customer`, badge: customerCommCount > 0 ? customerCommCount : null }
      );
    }

    return {
      railId: 'cat-workflow',
      headerTitle: jobTitle,
      icon: isRecurring ? 'event_repeat' : 'build',
      backPath: isRecurring ? '/recurring-templates' : '/jobs',
      backLabel: isRecurring ? 'Back to Recurring Templates' : 'Back to Jobs',
      items: navTabs,
      activeTab: currentTab
    };
  }

  // Asset Detail (/assets/:id)
  if (resource === 'assets') {
    const asset = store.getById('assets', id);
    const assetName = asset ? (asset.name || asset.serialNumber) : 'Asset Detail';
    const currentTab = activeTab || 'history';
    return {
      railId: 'cat-resources',
      headerTitle: assetName,
      icon: 'precision_manufacturing',
      backPath: '/assets',
      backLabel: 'Back to Assets',
      items: [
        { id: 'history', icon: 'history', label: 'Activity History', path: `/assets/${id}?tab=history` },
        { id: 'maint', icon: 'engineering', label: 'Maintenance Agreements', path: `/assets/${id}?tab=maint` }
      ],
      activeTab: currentTab
    };
  }

  // Contractor Detail (/contractors/:id)
  if (resource === 'contractors') {
    const contractor = store.getById('contractors', id);
    const contractorTitle = contractor ? (contractor.companyName || contractor.name) : 'Contractor Detail';
    const currentTab = activeTab || 'details';
    return {
      railId: 'cat-people',
      headerTitle: contractorTitle,
      icon: 'engineering',
      backPath: '/contractors',
      backLabel: 'Back to Contractors',
      items: [
        { id: 'details', icon: 'engineering', label: 'Overview & Details', path: `/contractors/${id}?tab=details` },
        { id: 'compliance', icon: 'verified', label: 'Compliance Registry', path: `/contractors/${id}?tab=compliance` },
        { id: 'rates', icon: 'payments', label: 'Financials & Rates', path: `/contractors/${id}?tab=rates` },
        { id: 'tasks', icon: 'assignment', label: 'Task Allocations', path: `/contractors/${id}?tab=tasks` }
      ],
      activeTab: currentTab
    };
  }

  // Supplier Detail (/suppliers/:id)
  if (resource === 'suppliers') {
    const supplier = store.getById('suppliers', id);
    const supplierTitle = supplier ? supplier.name : 'Supplier Detail';
    const currentTab = activeTab || 'overview';
    return {
      railId: 'cat-people',
      headerTitle: supplierTitle,
      icon: 'local_shipping',
      backPath: '/suppliers',
      backLabel: 'Back to Suppliers',
      items: [
        { id: 'overview', icon: 'dashboard', label: 'Overview', path: `/suppliers/${id}?tab=overview` },
        { id: 'catalogues', icon: 'menu_book', label: 'Catalogues & Docs', path: `/suppliers/${id}?tab=catalogues` },
        { id: 'stock', icon: 'inventory_2', label: 'Stock Items', path: `/suppliers/${id}?tab=stock` },
        { id: 'pos', icon: 'receipt', label: 'Purchase Orders', path: `/suppliers/${id}?tab=pos` }
      ],
      activeTab: currentTab
    };
  }

  // Quotes Detail (/quotes/:id)
  if (resource === 'quotes') {
    const quote = store.getById('quotes', id);
    const quoteTitle = quote ? `Quote #${quote.number}` : 'Quote Detail';
    const currentTab = activeTab || 'overview';
    return {
      railId: 'cat-workflow',
      headerTitle: quoteTitle,
      icon: 'request_quote',
      backPath: '/quotes',
      backLabel: 'Back to Quotes',
      items: [
        { id: 'overview', icon: 'request_quote', label: 'Overview', path: `/quotes/${id}?tab=overview` },
        { id: 'history', icon: 'history', label: 'Activity History', path: `/quotes/${id}?tab=history` }
      ],
      activeTab: currentTab
    };
  }

  // Invoices Detail (/invoices/:id)
  if (resource === 'invoices') {
    const invoice = store.getById('invoices', id);
    const invoiceTitle = invoice ? `Invoice #${invoice.number}` : 'Invoice Detail';
    const currentTab = activeTab || 'overview';
    return {
      railId: 'cat-workflow',
      headerTitle: invoiceTitle,
      icon: 'receipt_long',
      backPath: '/invoices',
      backLabel: 'Back to Invoices',
      items: [
        { id: 'overview', icon: 'receipt_long', label: 'Overview', path: `/invoices/${id}?tab=overview` },
        { id: 'history', icon: 'history', label: 'Activity History', path: `/invoices/${id}?tab=history` }
      ],
      activeTab: currentTab
    };
  }

  // Purchase Order Detail (/purchase-orders/:id)
  if (resource === 'purchase-orders') {
    const po = store.getById('purchaseOrders', id);
    const poTitle = po ? `PO #${po.number}` : 'PO Detail';
    return {
      railId: 'cat-resources',
      headerTitle: poTitle,
      icon: 'shopping_cart',
      backPath: '/purchase-orders',
      backLabel: 'Back to POs',
      items: [], // Kept the menu the same without changing it
      activeTab: ''
    };
  }

  // Lead Detail (/leads/:id)
  if (resource === 'leads') {
    const lead = store.getById('leads', id);
    const leadTitle = lead ? (lead.title || `Lead #${lead.number}`) : 'Lead Detail';
    return {
      railId: 'cat-workflow',
      headerTitle: leadTitle,
      icon: 'contact_mail',
      backPath: '/leads',
      backLabel: 'Back to Leads',
      items: [],
      activeTab: ''
    };
  }

  // Stock Detail (/stock/:id)
  if (resource === 'stock' && id) {
    const stock = store.getById('stock', id);
    const stockTitle = stock ? stock.name : 'Item Detail';
    return {
      railId: 'cat-resources',
      headerTitle: stockTitle,
      icon: 'inventory_2',
      backPath: '/stock',
      backLabel: 'Back to Stock',
      items: [],
      activeTab: ''
    };
  }

  // Kit Detail (/kits/:id)
  if (resource === 'kits') {
    const kit = store.getById('kits', id);
    const kitTitle = kit ? kit.name : 'Kit Detail';
    return {
      railId: 'cat-resources',
      headerTitle: kitTitle,
      icon: 'widgets',
      backPath: '/stock?tab=kits',
      backLabel: 'Back to Kits',
      items: [],
      activeTab: ''
    };
  }

  return null;
}

// Render a contextual submenu's items. Supports two shapes:
//   1. Flat list of { id, icon, label, path, ... } page links.
//   2. Grouped drill-down: `groups` = [{ id, label, icon, items: [...] }] with an
//      optional `openGroupId`. When a group is open, only its items render (the
//      header back button returns to the group list); otherwise the groups render
//      as plain links into their first enabled tab.
function renderContextualItems(contextual) {
  if (contextual.groups) {
    const openGroup = contextual.groups.find(g => g.id === contextual.openGroupId);
    if (openGroup) {
      return openGroup.items.map(item => renderSubmenuItem(contextual, item)).join('');
    }
    return contextual.groups.map(group => {
      const target = group.items.find(item => !item.disabled) || group.items[0];
      return renderSubmenuItem(contextual, { id: group.id, icon: group.icon, label: group.label, path: target.path, hasChildren: true });
    }).join('');
  }

  return (contextual.items || []).map(item => renderSubmenuItem(contextual, item)).join('');
}

function renderSubmenuItem(contextual, item) {
  return `
    <button class="submenu-item ${contextual.activeTab === item.id ? 'active' : ''} ${item.disabled ? 'disabled-local' : ''}" data-path="${item.path}" ${item.disabled ? `data-tooltip="${escapeHTML(item.tooltip || 'Not available for this account type')}" data-tooltip-pos="right"` : ''} style="display:flex; align-items:center; width:100%">
      <span class="nav-icon"><span class="material-icons-outlined" aria-hidden="true">${item.icon}</span></span>
      <span class="nav-label">${escapeHTML(item.label)}</span>
      ${item.badge ? `<span class="badge badge-primary" style="font-size:10px;padding:2px 6px;border-radius:10px;margin-left:auto">${item.badge}</span>` : ''}
      ${item.hasChildren ? `<span class="rail-caret material-icons-outlined" aria-hidden="true" style="font-size:16px;opacity:0.45;flex:none;margin-left:auto">chevron_right</span>` : ''}
    </button>`;
}

// Show a section's submenu panel and mark its rail item active.
function setActiveSection(sidebar, sectionId) {  sidebar = sidebar || sidebarRef || document.getElementById('sidebar');
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

  const currentHash = window.location.hash || path || '/';
  const contextual = getContextualMenu(currentHash);
  const submenuContainer = sidebar.querySelector('#sidebar-submenu');

  if (contextual) {
    sidebar.querySelectorAll('.rail-item').forEach(r => {
      r.classList.toggle('active', r.dataset.id === contextual.railId);
    });

    sidebar.querySelectorAll('.submenu-panel').forEach(p => {
      if (!p.classList.contains('contextual-panel')) {
        p.classList.remove('active');
      }
    });

    let ctxPanel = sidebar.querySelector('.submenu-panel.contextual-panel');
    if (!ctxPanel) {
      ctxPanel = document.createElement('div');
      ctxPanel.className = 'submenu-panel contextual-panel';
      submenuContainer.appendChild(ctxPanel);
    }

    ctxPanel.innerHTML = `
      <div class="submenu-context-header">
        ${(contextual.backPath || contextual.backSection) ? `
          <div class="submenu-context-back-row">
            <button class="submenu-context-back" ${contextual.backSection ? `data-back-section="${contextual.backSection}"` : `data-path="${contextual.backPath}"`} title="${escapeHTML(contextual.backLabel || 'Back')}">
              <span class="material-icons-outlined" aria-hidden="true">chevron_left</span>
            </button>
          </div>
        ` : ''}
        <div class="submenu-context-body">
          ${contextual.icon ? `<span class="material-icons-outlined submenu-context-icon" aria-hidden="true">${contextual.icon}</span>` : ''}
          <div class="submenu-context-title" title="${escapeHTML(contextual.headerTitle)}">${escapeHTML(contextual.headerTitle)}</div>
        </div>
      </div>
      <nav class="submenu-nav" style="${(contextual.items && contextual.items.length > 0) || (contextual.groups && contextual.groups.length > 0) ? '' : 'display:none;'}">
        ${renderContextualItems(contextual)}
      </nav>
    `;

    ctxPanel.classList.add('active');
    sidebar.classList.add('submenu-open');
    return;
  }

  const ctxPanel = sidebar.querySelector('.submenu-panel.contextual-panel');
  if (ctxPanel) {
    ctxPanel.remove();
  }

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
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const name = currentUser.name || 
               currentUser.full_name || 
               currentUser.displayName || 
               currentUser.user_metadata?.full_name || 
               currentUser.user_metadata?.name || 
               (currentUser.email ? currentUser.email.split('@')[0] : null) || 
               currentUser.username || 
               'Admin User';
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
    if (item.closest('.contextual-panel')) {
      item.style.display = '';
      return;
    }
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

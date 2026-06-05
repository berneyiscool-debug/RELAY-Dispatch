// ============================================
// FIELDFORGE — MAIN ENTRY POINT
// ============================================

import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';

import { router } from './router.js';
import { store } from './data/store.js';
import { applyTheme } from './utils/theme.js';

// Apply stored theme on initial boot
const initialTheme = localStorage.getItem('simpro_theme') || 'light';
applyTheme(initialTheme);
import { seedData } from './data/seed.js';
import { checkMaintenancePlans } from './utils/maintenanceEngine.js';
import { createSidebar, updateSidebarActive } from './components/Sidebar.js';
import { createTopBar } from './components/TopBar.js';
import { createBreadcrumb } from './components/Breadcrumb.js';
import { hasPermission } from './utils/permissions.js';
import { initSearchableSelects } from './utils/searchableSelect.js';

// Pages
import { renderDashboard } from './pages/Dashboard.js';
import { renderPeopleList } from './pages/people/PeopleList.js';
import { renderPersonDetail } from './pages/people/PersonDetail.js';
import { renderPersonForm } from './pages/people/PersonForm.js';
import { renderLeadsList } from './pages/leads/LeadsList.js';
import { renderLeadDetail } from './pages/leads/LeadDetail.js';
import { renderLeadForm } from './pages/leads/LeadForm.js';
import { renderNotificationsList } from './pages/notifications/NotificationsList.js';
import { renderQuotesList } from './pages/quotes/QuotesList.js';
import { renderQuoteDetail } from './pages/quotes/QuoteDetail.js';
import { renderJobsList } from './pages/jobs/JobsList.js';
import { renderJobDetail } from './pages/jobs/JobDetail.js';
import { renderJobForm } from './pages/jobs/JobForm.js';
import { renderTimesheetsList } from './pages/timesheets/Timesheets.js';
import { renderScheduleView } from './pages/schedule/ScheduleView.js';
import { renderStockList } from './pages/stock/StockList.js';
import { renderStockDetail } from './pages/stock/StockDetail.js';
import { renderStockForm } from './pages/stock/StockForm.js';
import { renderInvoicesList } from './pages/invoices/InvoicesList.js';
import { renderInvoiceDetail } from './pages/invoices/InvoiceDetail.js';
import { renderPurchaseOrdersList } from './pages/purchaseOrders/PurchaseOrdersList.js';
import { renderPurchaseOrderDetail } from './pages/purchaseOrders/PurchaseOrderDetail.js';
import { renderReports } from './pages/reports/Reports.js';
import { renderSettings } from './pages/Settings.js';
import { renderFormBuilder } from './pages/forms/FormBuilder.js';
import { renderKitDetail } from './pages/kits/KitDetail.js';

import { renderLogin } from './pages/login/Login.js';
import { renderCustomerPortal } from './pages/portal/Portal.js';
import { renderContractorPortal } from './pages/portal/ContractorPortal.js';
import { renderContractorsList } from './pages/contractors/ContractorsList.js';
import { renderContractorForm } from './pages/contractors/ContractorForm.js';
import { renderContractorDetail } from './pages/contractors/ContractorDetail.js';

import { renderSuppliersList } from './pages/suppliers/SuppliersList.js';
import { renderSupplierForm } from './pages/suppliers/SupplierForm.js';
import { renderSupplierDetail } from './pages/suppliers/SupplierDetail.js';

import { renderAssetList } from './pages/assets/AssetList.js';
import { renderAssetForm } from './pages/assets/AssetForm.js';
import { renderAssetDetail } from './pages/assets/AssetDetail.js';

import { renderDocumentBrowser } from './pages/documents/DocumentBrowser.js';
import { renderDocumentViewer } from './pages/documents/DocumentViewer.js';

// ---- Initialize ----
seedData();
checkMaintenancePlans();
initSearchableSelects();

// Expose app globals for cross-component access
window.__fieldForge = { router, store };

// Initialize body attribute with saved tooltip preference level
document.body.setAttribute('data-tooltip-pref', store.getSettings().tooltipPreference || 'full');

// Sync body attribute whenever settings are updated (e.g. from Settings panel)
window.addEventListener('simpro-settings-updated', () => {
  document.body.setAttribute('data-tooltip-pref', store.getSettings().tooltipPreference || 'full');
});

// Lazy-classify tooltips into 'partial' vs 'full' based on action keywords on hover
document.addEventListener('mouseover', (e) => {
  const target = e.target.closest('[data-tooltip]');
  if (!target || target.hasAttribute('data-tooltip-level')) return;

  const tooltipText = (target.getAttribute('data-tooltip') || '').toLowerCase();
  const elementId = (target.id || '').toLowerCase();
  const elementClass = (target.className || '').toLowerCase();
  const elementText = (target.textContent || '').toLowerCase();

  // Words corresponding to mutating/critical/save/delete/destructive/creation actions
  const criticalKeywords = [
    'save', 'delete', 'destroy', 'remove', 'clear', 'reset', 'restore', 'seed',
    'create', 'add ', 'new ', 'register', 'onboard', 'upload',
    'send', 'email', 'generate', 'submit', 'post',
    'deactivate', 'reactivate', 'unlink', 'unlink-',
    'approve', 'reject', 'void', 'cancel', 'update'
  ];

  const isCritical = criticalKeywords.some(keyword => 
    tooltipText.includes(keyword) || 
    elementId.includes(keyword) || 
    elementClass.includes(keyword) ||
    elementText.includes(keyword)
  );

  target.setAttribute('data-tooltip-level', isCritical ? 'partial' : 'full');
});

// ---- Build App Shell ----
const app = document.getElementById('app');

const sidebar = createSidebar();
const mainWrapper = document.createElement('div');
mainWrapper.className = 'main-wrapper';

const topbar = createTopBar();
const breadcrumbEl = document.createElement('div');
breadcrumbEl.className = 'breadcrumb';
breadcrumbEl.id = 'breadcrumb';

const mainContent = document.createElement('main');
mainContent.className = 'main-content';
mainContent.id = 'main-content';

mainWrapper.appendChild(topbar);
mainWrapper.appendChild(breadcrumbEl);
mainWrapper.appendChild(mainContent);

app.appendChild(sidebar);
app.appendChild(mainWrapper);

// ---- Page Header to Breadcrumb Actions Relocation ----
// Override mainContent querySelector/querySelectorAll to find moved buttons inside breadcrumb-actions
const originalQuerySelector = mainContent.querySelector;
mainContent.querySelector = function(selector) {
  const result = originalQuerySelector.call(this, selector);
  if (!result) {
    const breadcrumbActions = document.getElementById('breadcrumb-actions');
    if (breadcrumbActions) {
      return breadcrumbActions.querySelector(selector);
    }
  }
  return result;
};

const originalQuerySelectorAll = mainContent.querySelectorAll;
mainContent.querySelectorAll = function(selector) {
  const result = originalQuerySelectorAll.call(this, selector);
  if (result.length === 0) {
    const breadcrumbActions = document.getElementById('breadcrumb-actions');
    if (breadcrumbActions) {
      return breadcrumbActions.querySelectorAll(selector);
    }
  }
  return result;
};

// Relocate page headers actions to navigations (breadcrumb) row
function adjustPageHeaderLayout(container) {
  const breadcrumb = document.getElementById('breadcrumb');
  if (!breadcrumb || breadcrumb.style.display === 'none') return;

  const breadcrumbActions = document.getElementById('breadcrumb-actions');
  if (!breadcrumbActions) return;

  // 1. Handle .page-header
  const pageHeader = container.querySelector('.page-header');
  if (pageHeader) {
    const actions = pageHeader.querySelector('.page-header-actions') || pageHeader.querySelector('#header-actions-container');
    if (actions && actions.children.length > 0) {
      breadcrumbActions.innerHTML = '';
      while (actions.firstChild) {
        breadcrumbActions.appendChild(actions.firstChild);
      }
    }
    
    // Hide title elements, subtitle paragraphs, spans, and icon boxes
    const titles = pageHeader.querySelectorAll('h1, h2, h3, h4, p, span, .asset-icon-box');
    titles.forEach(t => t.style.display = 'none');

    // Hide empty wrapper divs
    const divs = pageHeader.querySelectorAll('div');
    divs.forEach(d => {
      if (d === actions) return;
      const visibleChildren = Array.from(d.children).filter(child => child.style.display !== 'none');
      if (visibleChildren.length === 0) {
        d.style.display = 'none';
      }
    });

    // If it only had title and actions, hide it
    const children = Array.from(pageHeader.children);
    let hasVisibleChildren = false;
    children.forEach(c => {
      if (c === actions) return;
      if (c.style.display === 'none') return;
      hasVisibleChildren = true;
    });
    if (!hasVisibleChildren) {
      pageHeader.style.display = 'none';
    } else {
      pageHeader.style.display = 'flex';
      pageHeader.style.marginBottom = 'var(--space-md)';
    }
  }

  // 2. Handle .detail-header
  const detailHeader = container.querySelector('.detail-header');
  if (detailHeader) {
    const info = detailHeader.querySelector('.detail-header-info');
    const actions = Array.from(detailHeader.children).find(c => c !== info);
    if (actions && actions.children.length > 0) {
      breadcrumbActions.innerHTML = '';
      while (actions.firstChild) {
        breadcrumbActions.appendChild(actions.firstChild);
      }
      actions.style.display = 'none';
    }

    // Hide detail title text and icon
    const titleText = detailHeader.querySelector('.detail-header-text');
    if (titleText) titleText.style.display = 'none';
    
    const iconBlock = detailHeader.querySelector('.detail-header-icon');
    if (iconBlock) iconBlock.style.display = 'none';
    
    const meta = detailHeader.querySelector('.detail-header-meta');
    if (meta) {
      detailHeader.style.marginBottom = 'var(--space-base)';
      detailHeader.style.padding = '0';
      detailHeader.style.background = 'transparent';
      detailHeader.style.border = 'none';
      detailHeader.style.boxShadow = 'none';
    } else {
      detailHeader.style.display = 'none';
    }
  }
}

// Relocate search inputs and selectors from page toolbars to navigations (breadcrumb) row
function adjustPageToolbarLayout(container) {
  const breadcrumb = document.getElementById('breadcrumb');
  if (!breadcrumb || breadcrumb.style.display === 'none') return;

  const breadcrumbActions = document.getElementById('breadcrumb-actions');
  if (!breadcrumbActions) return;

  const pageToolbar = container.querySelector('.page-toolbar');
  if (pageToolbar) {
    // 0. Pull out tags containers to be direct children of pageToolbar
    const tagsContainers = pageToolbar.querySelectorAll('.toolbar-filters, [id$="-filters-carousel-container"]');
    tagsContainers.forEach(tc => {
      if (tc.parentNode !== pageToolbar) {
        pageToolbar.appendChild(tc);
      }
    });

    // 1. Find all search containers (.toolbar-search)
    const searchBars = Array.from(pageToolbar.querySelectorAll('.toolbar-search'));

    // 2. Find all select dropdown selectors (.toolbar-selectors)
    const selectors = Array.from(pageToolbar.querySelectorAll('.toolbar-selectors'));

    // 3. Find any other filter inputs (like date range and staff selectors in Timesheets)
    const extraControls = [];
    const inputsAndSelects = pageToolbar.querySelectorAll('input:not(.toolbar-filter), select, label, span:not(.material-icons-outlined)');
    inputsAndSelects.forEach(el => {
      let parent = el;
      while (parent && parent.parentNode !== pageToolbar) {
        parent = parent.parentNode;
      }
      if (parent && !Array.from(tagsContainers).some(tc => tc.contains(parent))) {
        if (!searchBars.some(sb => sb.contains(parent)) &&
            !selectors.some(sel => sel.contains(parent))) {
          if (!extraControls.includes(parent)) {
            extraControls.push(parent);
          }
        }
      }
    });

    // 4. Prepend to breadcrumb-actions in reverse order so they show as [Search] [Selectors/DateFilters] [Action Buttons]
    extraControls.reverse().forEach(ctrl => {
      if (!breadcrumbActions.contains(ctrl)) {
        breadcrumbActions.insertBefore(ctrl, breadcrumbActions.firstChild);
      }
    });

    selectors.reverse().forEach(sel => {
      if (!breadcrumbActions.contains(sel)) {
        breadcrumbActions.insertBefore(sel, breadcrumbActions.firstChild);
      }
    });

    searchBars.reverse().forEach(sb => {
      if (!breadcrumbActions.contains(sb)) {
        breadcrumbActions.insertBefore(sb, breadcrumbActions.firstChild);
      }
    });

    // 5. Clean up the pageToolbar: keep only tags containers and bulk action bars
    const activeTagsContainers = Array.from(tagsContainers);
    const bulkActionsBar = pageToolbar.querySelector('.toolbar-bulk-actions');
    
    Array.from(pageToolbar.children).forEach(child => {
      if (!activeTagsContainers.includes(child) && !child.classList.contains('toolbar-bulk-actions')) {
        child.remove();
      }
    });

    const hasContent = activeTagsContainers.length > 0 || !!bulkActionsBar;
    if (hasContent) {
      const hasBulk = !!bulkActionsBar;
      activeTagsContainers.forEach(tc => {
        if (hasBulk) {
          tc.style.flex = '1';
          tc.style.width = 'auto';
          tc.style.maxWidth = 'none';
          tc.style.margin = '0';
          tc.style.overflow = 'visible';
        } else {
          tc.style.flex = '1 1 100%';
          tc.style.width = '100%';
          tc.style.maxWidth = '100%';
          tc.style.margin = '0';
          tc.style.overflow = 'visible';
        }
      });
      pageToolbar.style.display = 'flex';
      pageToolbar.style.marginBottom = 'var(--space-lg)';
    } else {
      pageToolbar.style.display = 'none';
      pageToolbar.style.marginBottom = '0';
    }
  }
}

// Observe modifications inside mainContent to reactively adjust layout
const pageHeaderObserver = new MutationObserver(() => {
  const pageHeader = mainContent.querySelector('.page-header');
  const detailHeader = mainContent.querySelector('.detail-header');
  const pageToolbar = mainContent.querySelector('.page-toolbar');

  let hasHeaderActions = false;
  if (pageHeader) {
    const actions = pageHeader.querySelector('.page-header-actions') || pageHeader.querySelector('#header-actions-container');
    hasHeaderActions = actions && actions.children.length > 0;
  }

  let hasDetailActions = false;
  if (detailHeader) {
    const info = detailHeader.querySelector('.detail-header-info');
    const actions = Array.from(detailHeader.children).find(c => c !== info);
    hasDetailActions = actions && actions.children.length > 0;
  }

  let hasToolbarControls = false;
  if (pageToolbar) {
    hasToolbarControls = !!pageToolbar.querySelector('.toolbar-search, .toolbar-selectors, input:not(.toolbar-filter), select');
  }

  if (hasHeaderActions || hasDetailActions || hasToolbarControls) {
    pageHeaderObserver.disconnect();
    adjustPageHeaderLayout(mainContent);
    adjustPageToolbarLayout(mainContent);
    pageHeaderObserver.observe(mainContent, { childList: true, subtree: true });
  }
});

pageHeaderObserver.observe(mainContent, { childList: true, subtree: true });

// ---- Register Routes ----
function renderPage(handler) {
  return (params) => {
    mainContent.innerHTML = '';
    mainContent.scrollTop = 0;
    mainContent.removeAttribute('style');

    // Clear breadcrumb actions so we start with a clean slate for the new page
    const breadcrumbActions = document.getElementById('breadcrumb-actions');
    if (breadcrumbActions) {
      breadcrumbActions.innerHTML = '';
    }

    // Add/remove non-dashboard/schedule class depending on current hash route
    const hash = window.location.hash || '#/';
    const isDashboardOrSchedule = hash === '#/' || hash === '#' || hash.startsWith('#/dashboard') || hash.startsWith('#/schedule');
    if (isDashboardOrSchedule) {
      mainContent.classList.remove('non-dashboard-schedule-page');
    } else {
      mainContent.classList.add('non-dashboard-schedule-page');
    }

    handler(mainContent, params);
  };
}

// Login
router.register('/login', renderPage(renderLogin));

// Customer Portal
router.register('/portal/customer', renderPage(renderCustomerPortal));

// Subcontractor Portal
router.register('/contractor-portal/:token', renderPage(renderContractorPortal));

// Dashboard
router.register('/', renderPage(renderDashboard));

// People
router.register('/people', renderPage(renderPeopleList));
router.register('/people/new', renderPage((c, p) => renderPersonForm(c, { id: 'new' })));
router.register('/people/:id', renderPage(renderPersonDetail));
router.register('/people/:id/edit', renderPage((c, p) => renderPersonForm(c, p)));

// Contractors
router.register('/contractors', renderPage(renderContractorsList));
router.register('/contractors/new', renderPage((c, p) => renderContractorForm(c, { id: 'new' })));
router.register('/contractors/:id', renderPage(renderContractorDetail));
router.register('/contractors/:id/edit', renderPage((c, p) => renderContractorForm(c, p)));

// Suppliers
router.register('/suppliers', renderPage(renderSuppliersList));
router.register('/suppliers/new', renderPage((c, p) => renderSupplierForm(c, { id: 'new' })));
router.register('/suppliers/:id', renderPage(renderSupplierDetail));
router.register('/suppliers/:id/edit', renderPage((c, p) => renderSupplierForm(c, p)));

// Leads
router.register('/leads', renderPage(renderLeadsList));
router.register('/leads/new', renderPage((c, p) => renderLeadForm(c, { id: 'new' })));
router.register('/leads/:id', renderPage(renderLeadDetail));
router.register('/leads/:id/edit', renderPage((c, p) => renderLeadForm(c, p)));

// Notifications
router.register('/notifications', renderPage(renderNotificationsList));

// Quotes
router.register('/quotes', renderPage(renderQuotesList));
router.register('/quotes/new', renderPage((c, p) => renderQuoteDetail(c, { id: 'new' })));
router.register('/quotes/:id', renderPage(renderQuoteDetail));

// Jobs
router.register('/jobs', renderPage(renderJobsList));
router.register('/jobs/new', renderPage((c, p) => renderJobForm(c, { id: 'new' })));
router.register('/jobs/:id', renderPage(renderJobDetail));
router.register('/jobs/:id/edit', renderPage((c, p) => renderJobForm(c, p)));

// Timesheets
router.register('/timesheets', renderPage(renderTimesheetsList));

// Assets
router.register('/assets', renderPage(renderAssetList));
router.register('/assets/new', renderPage((c, p) => renderAssetForm(c, { id: 'new' })));
router.register('/assets/:id', renderPage(renderAssetDetail));
router.register('/assets/:id/edit', renderPage((c, p) => renderAssetForm(c, p)));

// Schedule
router.register('/schedule', renderPage(renderScheduleView));

// Stock
router.register('/stock', renderPage(renderStockList));
router.register('/stock/new', renderPage((c, p) => renderStockForm(c, { id: 'new' })));
router.register('/stock/:id', renderPage(renderStockDetail));
router.register('/stock/:id/edit', renderPage((c, p) => renderStockForm(c, p)));

// Invoices
router.register('/invoices', renderPage(renderInvoicesList));
router.register('/invoices/new', renderPage((c, p) => renderInvoiceDetail(c, { id: 'new' })));
router.register('/invoices/:id', renderPage(renderInvoiceDetail));

// Purchase Orders
router.register('/purchase-orders', renderPage(renderPurchaseOrdersList));
router.register('/purchase-orders/:id', renderPage(renderPurchaseOrderDetail));

// Kits
router.register('/kits', renderPage((c, p) => renderStockList(c, { tab: 'kits' })));
router.register('/kits/new', renderPage((c, p) => renderKitDetail(c, { id: 'new' })));
router.register('/kits/:id', renderPage(renderKitDetail));

// Documents
router.register('/documents', renderPage(renderDocumentBrowser));
router.register('/document/view', renderPage(renderDocumentViewer));

// Reports
router.register('/reports', renderPage(renderReports));

// Settings
router.register('/settings', renderPage(renderSettings));
router.register('/settings/forms/new', renderPage((c, p) => renderFormBuilder(c, { id: 'new' })));
router.register('/settings/forms/:id/edit', renderPage((c, p) => renderFormBuilder(c, p)));
router.register('/settings/quote-templates/new', renderPage((c, p) => renderQuoteDetail(c, { id: 'new', type: 'template' })));
router.register('/settings/quote-templates/:id/edit', renderPage((c, p) => renderQuoteDetail(c, { id: p.id, type: 'template' })));

// ---- Auth Guard Hook ----
const protectedRoutes = ['/', '/people', '/contractors', '/suppliers', '/leads', '/notifications', '/quotes', '/jobs', '/timesheets', '/assets', '/schedule', '/stock', '/invoices', '/purchase-orders', '/documents', '/reports', '/settings', '/settings/forms', '/kits'];
const customerRoutes = ['/portal'];

router.onNavigate = (path, params) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const basePath = path === '/' ? '/' : '/' + path.split('/').filter(Boolean)[0];

  const isContractorPortal = path.startsWith('/contractor-portal');
  const isCustomerPortal = path.startsWith('/portal/customer');
  const isPortal = isContractorPortal || isCustomerPortal;

  // Toggle app shell elements (sidebar, topbar, breadcrumb) based on whether it is a portal
  const sidebarEl = document.querySelector('.sidebar');
  const topbarEl = document.querySelector('.topbar');
  const breadcrumbEl = document.getElementById('breadcrumb');

  if (isPortal) {
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (topbarEl) topbarEl.style.display = 'none';
    if (breadcrumbEl) breadcrumbEl.style.display = 'none';
  } else {
    if (currentUser) {
      if (sidebarEl) sidebarEl.style.display = '';
      if (topbarEl) topbarEl.style.display = '';
      if (breadcrumbEl) breadcrumbEl.style.display = '';
    }
  }

  if (!currentUser && path !== '/login' && !isPortal) {
    // Redirect to login if not authenticated
    router.navigate('/login');
    return false; // Prevent further navigation handling
  }

  if (currentUser) {
    if (currentUser.role === 'customer' && protectedRoutes.includes(basePath)) {
       // Customer trying to access staff pages -> force to portal
       if (currentUser.portalToken) {
         router.navigate(`/portal/customer?token=${currentUser.portalToken}`);
       } else {
         router.navigate('/login');
       }
       return false;
    } else if (currentUser.role !== 'customer' && basePath === '/portal/customer') {
       // Staff trying to access customer portal directly (allow, but handle gracefully in rendering)
    }

    // Check page permissions
    if (currentUser.role !== 'admin' && currentUser.role !== 'customer' && currentUser.userTypeId && path !== '/login') {
       const ut = store.getById('userTypes', currentUser.userTypeId);
       if (ut && ut.permissions) {
          const pathMap = {
             '/': 'Dashboard',
             '/people': 'Customers',
             '/leads': 'Leads',
             '/notifications': 'Notifications',
             '/quotes': 'Quotes',
             '/jobs': 'Jobs',
             '/timesheets': 'Timesheets',
             '/assets': 'Assets',
             '/schedule': 'Schedule',
             '/contractors': 'Contractors',
             '/suppliers': 'Suppliers',
             '/stock': 'Stock',
             '/purchase-orders': 'Purchase Orders',
             '/invoices': 'Invoices',
             '/documents': 'Documents',
             '/reports': 'Reports',
             '/settings': 'Settings'
          };
          const moduleName = pathMap[basePath];
          if (moduleName) {
             // Granular route guard checks
             let block = false;
             if (path.endsWith('/new') && !hasPermission(moduleName, 'create')) block = true;
             if (path.endsWith('/edit') && !hasPermission(moduleName, 'edit')) block = true;

             if (block) {
                const PRIORITY = ['/', '/schedule', '/jobs', '/quotes', '/leads', '/timesheets', '/invoices', '/people', '/stock', '/purchase-orders', '/reports', '/contractors', '/suppliers', '/assets', '/documents', '/settings'];
                const fallback = PRIORITY.find(route => {
                  const mod = pathMap[route];
                  if (mod === 'Notifications' || mod === 'Dashboard') return true;
                  const perm = ut.permissions.find(m => m.module === mod);
                  return perm && Object.entries(perm).some(([k,v]) => k !== 'module' && v === true);
                }) || '/';
                router.navigate(fallback);
                return false;
             }

             if (moduleName === 'Notifications' || moduleName === 'Dashboard') {
                // globally accessible, allow
             } else {
               const p = ut.permissions.find(m => m.module === moduleName);
               if (!p || (Object.entries(p || {}).every(([k,v]) => k === 'module' || !v))) {
                  // Not permitted — find first page they CAN access
                  const PRIORITY = ['/', '/schedule', '/jobs', '/quotes', '/leads', '/timesheets', '/invoices', '/people', '/stock', '/purchase-orders', '/reports', '/contractors', '/suppliers', '/assets', '/documents', '/settings'];
                  const fallback = PRIORITY.find(route => {
                    const mod = pathMap[route];
                    if (mod === 'Notifications' || mod === 'Dashboard') return true;
                    const perm = ut.permissions.find(m => m.module === mod);
                    return perm && Object.entries(perm).some(([k,v]) => k !== 'module' && v === true);
                  }) || '/';
                  if (basePath !== fallback) {
                     router.navigate(fallback);
                     return false;
                  }
               }
             }
          }
       }
    }
  }

  updateSidebarActive(path);
  createBreadcrumb(path);
};

// Handle logout events globally
window.addEventListener('fieldforge-logout', () => {
  localStorage.removeItem('currentUser');
  import('./utils/supabase.js').then(({ supabase }) => supabase.auth.signOut());
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const breadcrumb = document.getElementById('breadcrumb');
  if (sidebar) sidebar.style.display = 'none';
  if (topbar) topbar.style.display = 'none';
  if (breadcrumb) breadcrumb.style.display = 'none';
  router.navigate('/login');
});

// ---- Boot ----
// Before resolving, check if we need to redirect to login
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
const isPortalHash = window.location.hash.startsWith('#/contractor-portal') || window.location.hash.startsWith('#/portal/customer');
if (!currentUser && window.location.hash !== '#/login' && !isPortalHash) {
  window.location.hash = '#/login';
}

router.resolve();

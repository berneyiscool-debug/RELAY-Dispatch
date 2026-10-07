// ============================================
// RELAY — MAIN ENTRY POINT
// ============================================

import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/settings.css';
import './styles/docEditor.css';

import { router } from './router.js';
import { store } from './data/store.js';
import { applyTheme, watchSystemTheme } from './utils/theme.js';
import { installFontFaces } from './utils/fonts.js';

// Injected rather than imported as a stylesheet so the very same rules (with
// absolute asset URLs) can be inlined into the print window, the document preview
// and the PDF render iframe. Must run before anything paints.
installFontFaces();

// Appearance is light only at launch; there is no stored preference.
applyTheme();
watchSystemTheme();
import { checkMaintenancePlans, scheduleEngineChecks } from './utils/maintenanceEngine.js';
import { createSidebar, updateSidebarActive } from './components/Sidebar.js';
import { createTopBar } from './components/TopBar.js';
import { initLucideIcons } from './utils/icons.js';
import { clearListSearch } from './utils/listSearch.js';
import { createBreadcrumb } from './components/Breadcrumb.js';
import { initDatePicker } from './utils/clockPicker.js';
import { hasPermission } from './utils/permissions.js';
import { subscriptionRequired } from './utils/subscription.js';
import { mountTrialBanner, unmountTrialBanner } from './components/TrialBanner.js';
import { initSearchableSelects } from './utils/searchableSelect.js';
import './utils/DeputyAutopilot.js';
import { storageGet, storageSet } from './utils/persist.js';
import { setSessionUser, clearSessionUser } from './pages/auth/session.js';
import { installDelegatedEvents } from './utils/delegatedEvents.js';

// Screens are code-split per route (see `lazy` below): only the shell above is
// loaded up front, each page module is fetched the first time it is opened.


// ---- Initialize ----
// Clickjacking guard. GitHub Pages cannot send response headers, so a
// `frame-ancestors` directive cannot be delivered and would be ignored inside
// the <meta> policy anyway. Refuse to render when framed by another origin;
// same-origin framing (the offscreen render frame in utils/documentPdf.js) is
// unaffected.
if (window.self !== window.top) {
  let crossOrigin = true;
  try { crossOrigin = window.top.location.origin !== window.location.origin; } catch { crossOrigin = true; }
  if (crossOrigin) document.documentElement.replaceChildren();
}

checkMaintenancePlans();
scheduleEngineChecks();
initSearchableSelects();
installDelegatedEvents();

// Expose app globals for cross-component access
window.__relay = { router, store };

const JOB_PREFIX_MIGRATION_KEY = 'relay_migration_job_prefix_v1';

// Legacy builds numbered jobs "JOB-0001". Renumber them to "J-0001" once, keyed off a
// marker, so a returning user is repaired without re-scanning every job on every boot.
function migrateJobNumberPrefix() {
  try {
    if (localStorage.getItem(JOB_PREFIX_MIGRATION_KEY) === 'done') return;
  } catch { /* storage unavailable — fall through and repair in memory */ }
  const allJobs = store.getAll('jobs') || [];
  let updated = 0;
  allJobs.forEach(j => {
    if (j.number && j.number.startsWith('JOB-')) {
      store.update('jobs', j.id, { number: j.number.replace('JOB-', 'J-') });
      updated++;
    }
  });
  if (updated) console.log(`Renumbered ${updated} job(s) from JOB- to J- prefixes.`);
  try { localStorage.setItem(JOB_PREFIX_MIGRATION_KEY, 'done'); } catch { /* ignore */ }
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // 1. Focus Search Bar: Ctrl + K or Cmd + K (intercepts Chrome address bar default)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  const activeEl = document.activeElement;
  const isInputField = activeEl && (
    activeEl.tagName === 'INPUT' || 
    activeEl.tagName === 'TEXTAREA' || 
    activeEl.contentEditable === 'true' ||
    activeEl.tagName === 'SELECT'
  );

  if (isInputField) {
    if (e.key === 'Escape') {
      activeEl.blur();
    }
    return;
  }

  // 2. Focus Search Bar: '/' key or Ctrl + '/'
  if (e.key === '/' || (e.ctrlKey && e.key === '/')) {
    e.preventDefault();
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // 3. Toggle brny Assistant: Shift + B (Shift + D is a silent legacy alias,
  // kept working for one release and deliberately not advertised anywhere)
  if (e.shiftKey && (e.key === 'B' || e.key === 'b' || e.key === 'D' || e.key === 'd')) {
    e.preventDefault();
    import('./components/RelayAssistant.js').then(({ toggleRelay }) => {
      toggleRelay();
    });
  }
});

// Automatically intercept and replace all standard browser date inputs with our frosted-glass date picker
function autoInitDatePickers(root = document) {
  const inputs = root.querySelectorAll('input[type="date"]');
  inputs.forEach(input => initDatePicker(input));
}

// Initial sweep
autoInitDatePickers();

// Monitor DOM updates to auto-upgrade future dynamically rendered date inputs
const dateObserver = new MutationObserver((mutations) => {
  let hasAdded = false;
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length > 0) {
      hasAdded = true;
      break;
    }
  }
  if (hasAdded) {
    autoInitDatePickers(document.body);
  }
});
dateObserver.observe(document.body, { childList: true, subtree: true });

// Auto-detect viewport boundary collisions for all dropdown menus
document.addEventListener('click', (e) => {
  const dropdownToggle = e.target.closest('.dropdown > button, .dropdown > a, [data-toggle="dropdown"], .btn-icon');
  if (dropdownToggle) {
    const parentDropdown = dropdownToggle.closest('.dropdown');
    const menu = parentDropdown ? parentDropdown.querySelector('.dropdown-menu') : null;
    if (menu) {
      const checkAndPosition = () => {
        const isVisible = getComputedStyle(menu).display !== 'none';
        if (isVisible) {
          const rect = dropdownToggle.getBoundingClientRect();
          const menuHeight = menu.offsetHeight || 180;
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;

          if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            menu.classList.add('dropdown-menu-up');
          } else {
            menu.classList.remove('dropdown-menu-up');
          }
        }
      };

      checkAndPosition();
      requestAnimationFrame(checkAndPosition);
      setTimeout(checkAndPosition, 0);
    }
  }
}, true);

// ---- Build App Shell ----
// Local mode is single-user, and a legacy `local_multiuser` marker from the
// removed multi-user local mode means this is a local install. Normalise it
// before the shell is built, which is where login mode is first read.
if (localStorage.getItem('relay_login_mode') === 'local_multiuser') {
  localStorage.setItem('relay_login_mode', 'local');
}

// The Simple/Complete mode toggle was removed: the single local owner always
// runs Complete Mode. Repair the technician role and mode the toggle left
// behind before the shell renders, so the sidebar profile cannot report the
// removed Simple Mode.
if (localStorage.getItem('relay_login_mode') === 'local') {
  const bootUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (bootUser && String(bootUser.companyId || '').startsWith('acct_')) {
    if (localStorage.getItem('uiMode') === 'technician') {
      localStorage.setItem('uiMode', 'admin');
    }
    if (bootUser.role === 'technician') {
      bootUser.role = 'admin';
      bootUser.userTypeId = `${bootUser.companyId}_ut_admin`;
      localStorage.setItem('currentUser', JSON.stringify(bootUser));
    }
  }
}

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

mainWrapper.appendChild(breadcrumbEl);
mainWrapper.appendChild(mainContent);

// Supabase-style shell: full-width top bar as one piece, with the sidebar
// (rail + submenu) sitting BELOW it so the submenu panel never splits the bar.
const appBody = document.createElement('div');
appBody.className = 'app-body';
appBody.appendChild(sidebar);
appBody.appendChild(mainWrapper);

app.appendChild(topbar);
app.appendChild(appBody);

// Swap Material Icon glyphs for Lucide SVGs (initial pass + live for dynamic content).
initLucideIcons();

// The trial clock is refreshed on sign-in and on every page load, so a trial
// that lapsed while the tab sat open flips to read-only without a reload.
store.on('settings', () => mountTrialBanner(mainContent));

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
    if (pageToolbar.closest('.tab-content, .card, .modal-content, .drawer-content')) return;
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
      pageToolbar.style.marginBottom = '0';
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
    clearListSearch(); // drop any previous page's table filter; a list page re-registers on render
    // Document editors take over the content area; clear that here so the class
    // can never outlive the page that set it.
    document.body.classList.remove('rde-immersive');

    // Clear breadcrumb actions so we start with a clean slate for the new page
    const breadcrumbActions = document.getElementById('breadcrumb-actions');
    if (breadcrumbActions) {
      breadcrumbActions.innerHTML = '';
    }

    // Add/remove non-dashboard/schedule class depending on current hash route
    const hash = window.location.hash || '#/';
    const isDashboardOrSchedule = hash === '#/' || hash === '#' || hash.startsWith('#/schedule');
    if (isDashboardOrSchedule) {
      mainContent.classList.remove('non-dashboard-schedule-page');
    } else {
      mainContent.classList.add('non-dashboard-schedule-page');
    }

    const result = handler(mainContent, params);
    // Lazy routes hand back a promise; a chunk that fails to load (offline install,
    // bad deploy) must not leave the user staring at a blank page.
    if (result && typeof result.then === 'function') {
      result.catch((err) => {
        console.error('Failed to load page:', err);
        mainContent.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span>'
          + '<h3>This page could not be loaded</h3><p>Check your connection and try again.</p></div>';
        import('./components/Notifications.js')
          .then(({ showToast }) => showToast('This page could not be loaded.', 'error'))
          .catch(() => {});
      });
    }
  };
}

// Resolves a route handler that lives in its own chunk. `load` is the dynamic
// import, `name` the render export, and `mapParams` covers the handful of routes
// whose handler needs a different argument than the URL params.
function lazy(load, name, mapParams) {
  return (container, params) =>
    load().then((mod) => mod[name](container, mapParams ? mapParams(params) : params));
}

// Login
router.register('/login', renderPage(async (container) => {
  const [{ renderLaunchScreen }, { handleCloudLoginSuccess }] = await Promise.all([
    import('./pages/launch/LaunchScreen.js'),
    import('./pages/login/Login.js'),
  ]);
  renderLaunchScreen(container, async (result) => {
    if (result.mode === 'local') {
      const accountId = result.accountId;
      sessionStorage.setItem('relay_active_account', accountId);
      localStorage.setItem('relay_login_mode', result.mode);

      // Update the profile's lastAccessedAt timestamp in storage
      const accounts = await storageGet('relay_accounts') || [];
      const acct = accounts.find(a => a.id === accountId);
      if (acct) {
        acct.lastAccessedAt = new Date().toISOString();
        await storageSet('relay_accounts', accounts);
      }

      // Initialize the namespaced IndexedDB connection / load local files
      let localUser = result.user;
      if (!localUser) {
        localUser = {
          id: `${accountId}_admin`,
          companyId: accountId,
          name: acct?.ownerName || acct?.businessName || 'Local Admin',
          role: 'admin',
          userTypeName: 'Admin',
          userTypeId: `${accountId}_ut_admin`,
          color: acct?.avatarColor || '#FF5C00'
        };
      }

      // Set currentUser in localStorage
      setSessionUser(localUser);

      // Show the shell elements
      const sidebar = document.querySelector('.sidebar');
      const topbar = document.querySelector('.topbar');
      const breadcrumb = document.getElementById('breadcrumb');
      if (sidebar) sidebar.style.display = '';
      if (topbar) topbar.style.display = '';
      if (breadcrumb) breadcrumb.style.display = '';

      // Initialize data store for local user
      await store.initializeUser(localUser);

      // Update sidebar and topbar access permissions and user profile
      const { updateSidebarAccess } = await import('./components/Sidebar.js');
      if (updateSidebarAccess) updateSidebarAccess();

      const { updateTopbarAccess } = await import('./components/TopBar.js');
      if (updateTopbarAccess) updateTopbarAccess();

      applyTheme();
      router.navigate('/');
    } else if (result.mode === 'cloud') {
      try {
        localStorage.setItem('relay_login_mode', 'cloud');
        await handleCloudLoginSuccess(container, { id: result.userId });
      } catch (err) {
        const { showToast: toast } = await import('./components/Notifications.js');
        toast(err.message || err, 'error');
      }
    }
  });
}));

// Customer Portal
router.register('/portal/customer', renderPage(lazy(() => import('./pages/portal/Portal.js'), 'renderCustomerPortal')));

// Subcontractor Portal
router.register('/contractor-portal/:token', renderPage(lazy(() => import('./pages/portal/ContractorPortal.js'), 'renderContractorPortal')));

// Dashboard
router.register('/', renderPage(lazy(() => import('./pages/Dashboard.js'), 'renderDashboard')));

// People
router.register('/people', renderPage(lazy(() => import('./pages/people/PeopleList.js'), 'renderPeopleList')));
router.register('/people/new', renderPage(lazy(() => import('./pages/people/PersonForm.js'), 'renderPersonForm', () => ({ id: 'new' }))));
router.register('/people/:id', renderPage(lazy(() => import('./pages/people/PersonDetail.js'), 'renderPersonDetail')));
router.register('/people/:id/edit', renderPage(lazy(() => import('./pages/people/PersonForm.js'), 'renderPersonForm')));

// Contractors
router.register('/contractors', renderPage(lazy(() => import('./pages/contractors/ContractorsList.js'), 'renderContractorsList')));
router.register('/contractors/new', renderPage(lazy(() => import('./pages/contractors/ContractorForm.js'), 'renderContractorForm', () => ({ id: 'new' }))));
router.register('/contractors/:id', renderPage(lazy(() => import('./pages/contractors/ContractorDetail.js'), 'renderContractorDetail')));
router.register('/contractors/:id/edit', renderPage(lazy(() => import('./pages/contractors/ContractorForm.js'), 'renderContractorForm')));

// Suppliers
router.register('/suppliers', renderPage(lazy(() => import('./pages/suppliers/SuppliersList.js'), 'renderSuppliersList')));
router.register('/suppliers/new', renderPage(lazy(() => import('./pages/suppliers/SupplierForm.js'), 'renderSupplierForm', () => ({ id: 'new' }))));
router.register('/suppliers/:id', renderPage(lazy(() => import('./pages/suppliers/SupplierDetail.js'), 'renderSupplierDetail')));
router.register('/suppliers/:id/edit', renderPage(lazy(() => import('./pages/suppliers/SupplierForm.js'), 'renderSupplierForm')));

// Leads
router.register('/leads', renderPage(lazy(() => import('./pages/leads/LeadsList.js'), 'renderLeadsList')));
router.register('/leads/new', renderPage(lazy(() => import('./pages/leads/LeadForm.js'), 'renderLeadForm', (p) => ({ id: 'new', origin: p.origin }))));
router.register('/leads/:id', renderPage(lazy(() => import('./pages/leads/LeadDetail.js'), 'renderLeadDetail')));
router.register('/leads/:id/edit', renderPage(lazy(() => import('./pages/leads/LeadForm.js'), 'renderLeadForm')));

// Notifications
router.register('/notifications', renderPage(lazy(() => import('./pages/notifications/NotificationsList.js'), 'renderNotificationsList')));

// Quotes
router.register('/quotes', renderPage(lazy(() => import('./pages/quotes/QuotesList.js'), 'renderQuotesList')));
router.register('/quotes/new', renderPage(lazy(() => import('./pages/quotes/QuoteDetail.js'), 'renderQuoteDetail', () => ({ id: 'new' }))));
router.register('/quotes/:id', renderPage(lazy(() => import('./pages/quotes/QuoteDetail.js'), 'renderQuoteDetail')));

// Jobs
router.register('/jobs', renderPage(lazy(() => import('./pages/jobs/JobsList.js'), 'renderJobsList')));
router.register('/jobs/new', renderPage(lazy(() => import('./pages/jobs/JobForm.js'), 'renderJobForm', (p) => ({ id: 'new', ...p }))));
router.register('/jobs/:id', renderPage(lazy(() => import('./pages/jobs/JobDetail.js'), 'renderJobDetail')));
router.register('/jobs/:id/edit', renderPage(lazy(() => import('./pages/jobs/JobForm.js'), 'renderJobForm')));
router.register('/recurring-templates', renderPage(lazy(() => import('./pages/jobs/RecurringTemplatesList.js'), 'renderRecurringTemplatesList')));

// Projects
router.register('/projects', renderPage(lazy(() => import('./pages/projects/ProjectsList.js'), 'renderProjectsList')));
router.register('/projects/:id', renderPage(lazy(() => import('./pages/projects/ProjectDetail.js'), 'renderProjectDetail')));

// Timesheets
router.register('/timesheets', renderPage(lazy(() => import('./pages/timesheets/Timesheets.js'), 'renderTimesheetsList')));

// Assets
router.register('/assets', renderPage(lazy(() => import('./pages/assets/AssetList.js'), 'renderAssetList')));
router.register('/assets/:id', renderPage(lazy(() => import('./pages/assets/AssetDetail.js'), 'renderAssetDetail')));
router.register('/assets/:id/edit', renderPage(lazy(() => import('./pages/assets/AssetForm.js'), 'renderAssetForm')));

// Schedule
router.register('/schedule', renderPage(lazy(() => import('./pages/schedule/ScheduleView.js'), 'renderScheduleView')));

// Stock
router.register('/stock', renderPage(lazy(() => import('./pages/stock/StockList.js'), 'renderStockList')));
router.register('/stock/:id', renderPage(lazy(() => import('./pages/stock/StockDetail.js'), 'renderStockDetail')));
router.register('/stock/:id/edit', renderPage(lazy(() => import('./pages/stock/StockForm.js'), 'renderStockForm')));

// Invoices
router.register('/invoices', renderPage(lazy(() => import('./pages/invoices/InvoicesList.js'), 'renderInvoicesList')));
router.register('/invoices/new', renderPage(lazy(() => import('./pages/invoices/InvoiceDetail.js'), 'renderInvoiceDetail', () => ({ id: 'new' }))));
router.register('/invoices/:id', renderPage(lazy(() => import('./pages/invoices/InvoiceDetail.js'), 'renderInvoiceDetail')));

// Purchase Orders
router.register('/purchase-orders', renderPage(lazy(() => import('./pages/purchaseOrders/PurchaseOrdersList.js'), 'renderPurchaseOrdersList')));
router.register('/purchase-orders/:id', renderPage(lazy(() => import('./pages/purchaseOrders/PurchaseOrderDetail.js'), 'renderPurchaseOrderDetail')));

// Kits
router.register('/kits', renderPage(lazy(() => import('./pages/stock/StockList.js'), 'renderStockList', () => ({ tab: 'kits' }))));
router.register('/kits/new', renderPage(lazy(() => import('./pages/kits/KitDetail.js'), 'renderKitForm', () => ({ id: 'new' }))));
router.register('/kits/:id/edit', renderPage(lazy(() => import('./pages/kits/KitDetail.js'), 'renderKitForm')));
router.register('/kits/:id', renderPage(lazy(() => import('./pages/kits/KitDetail.js'), 'renderKitDetail')));

// Documents
router.register('/documents', renderPage(lazy(() => import('./pages/documents/DocumentBrowser.js'), 'renderDocumentBrowser')));
router.register('/document/view', renderPage(lazy(() => import('./pages/documents/DocumentViewer.js'), 'renderDocumentViewer')));

// Reports
router.register('/reports', renderPage(lazy(() => import('./pages/reports/Reports.js'), 'renderReports')));

// Settings
router.register('/settings', renderPage(lazy(() => import('./pages/Settings.js'), 'renderSettings')));
router.register('/settings/documents', renderPage(lazy(() => import('./pages/settings/DocumentStudio.js'), 'renderDocumentStudio')));
router.register('/settings/email-templates', renderPage(lazy(() => import('./pages/settings/EmailStudio.js'), 'renderEmailStudio')));
router.register('/settings/forms/new', renderPage(lazy(() => import('./pages/forms/FormBuilder.js'), 'renderFormBuilder', () => ({ id: 'new' }))));
router.register('/settings/forms/:id/edit', renderPage(lazy(() => import('./pages/forms/FormBuilder.js'), 'renderFormBuilder')));
router.register('/settings/quote-templates/new', renderPage(lazy(() => import('./pages/quotes/QuoteDetail.js'), 'renderQuoteDetail', () => ({ id: 'new', type: 'template' }))));
router.register('/settings/quote-templates/:id/edit', renderPage(lazy(() => import('./pages/quotes/QuoteDetail.js'), 'renderQuoteDetail', (p) => ({ id: p.id, type: 'template' }))));

// Profile
router.register('/profile', renderPage(lazy(() => import('./pages/Profile.js'), 'renderProfile')));

// Subscribe (cloud paywall — where an unpaid cloud account is held)
router.register('/subscribe', renderPage(lazy(() => import('./pages/billing/Subscribe.js'), 'renderSubscribe')));

// Finish setting up (verified cloud user whose company was never provisioned)
router.register('/setup', renderPage(lazy(() => import('./pages/auth/FinishSetup.js'), 'renderFinishSetup')));

// Legal documents (content in pages/legal/content.js), linked from the cloud
// signup form. They are public because a visitor reads them before they have an account.
router.register('/terms', renderPage(lazy(() => import('./pages/legal/Legal.js'), 'renderTerms')));
router.register('/privacy', renderPage(lazy(() => import('./pages/legal/Legal.js'), 'renderPrivacy')));
router.register('/refunds', renderPage(lazy(() => import('./pages/legal/Legal.js'), 'renderRefunds')));
router.register('/acceptable-use', renderPage(lazy(() => import('./pages/legal/Legal.js'), 'renderAcceptableUse')));

// ---- Auth Guard Hook ----
const protectedRoutes = ['/', '/people', '/contractors', '/suppliers', '/leads', '/notifications', '/quotes', '/jobs', '/timesheets', '/assets', '/schedule', '/stock', '/invoices', '/purchase-orders', '/documents', '/reports', '/settings', '/settings/forms', '/kits', '/profile'];

// Routes reachable without a signed-in session. They own their own layout, so
// the app shell stays hidden and the paywall leaves them alone — `/setup` and
// `/subscribe` are where an account with no company or no subscription is sent,
// so requiring either would be circular.
const PUBLIC_PATHS = new Set(['/login', '/subscribe', '/setup', '/terms', '/privacy', '/refunds', '/acceptable-use']);

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

  if (isPortal || !currentUser || PUBLIC_PATHS.has(path)) {
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (topbarEl) topbarEl.style.display = 'none';
    if (breadcrumbEl) breadcrumbEl.style.display = 'none';
    unmountTrialBanner();
  } else {
    if (sidebarEl) sidebarEl.style.display = '';
    if (topbarEl) topbarEl.style.display = '';
    if (breadcrumbEl) breadcrumbEl.style.display = '';
    // The auth screens clear the theme attributes for a clean canvas, so the
    // app shell re-applies the light appearance on entry.
    applyTheme();
    // Re-evaluated on every navigation: `days left` changes overnight, and the
    // trial can lapse while the tab is open.
    mountTrialBanner(mainContent);
  }

  if (!currentUser && !PUBLIC_PATHS.has(path) && !isPortal) {
    // Redirect to login if not authenticated
    router.navigate('/login');
    return false; // Prevent further navigation handling
  }

  if (currentUser) {
    // Paywall: a cloud account with a known, non-live subscription gets no
    // further than the billing page until Stripe has collected payment details.
    // subscriptionRequired() fails open when the subscription block was never
    // loaded and when the account holds a complimentary grant (comp_tier).
    if (!isPortal && !PUBLIC_PATHS.has(basePath) && subscriptionRequired()) {
      router.navigate('/subscribe');
      return false;
    }

    // Local (single-user) accounts have no My Profile page — Settings → Local Storage
    // owns the PIN, the recovery question and the dispatch start location for them.
    const isLocalLogin = localStorage.getItem('relay_login_mode') === 'local'
      || String(currentUser.companyId || store.companyId || '').startsWith('acct_');
    if (isLocalLogin && basePath === '/profile') {
      return '/settings?tab=local_storage';
    }

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
    if (currentUser.role !== 'admin' && currentUser.role !== 'customer' && path !== '/login') {
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
               return hasPermission(mod, 'view') || hasPermission(mod, 'view_own');
             }) || '/';
             router.navigate(fallback);
             return false;
          }

          if (moduleName === 'Notifications' || moduleName === 'Dashboard') {
             // globally accessible, allow
          } else {
            const canAccessModule = hasPermission(moduleName, 'view') || hasPermission(moduleName, 'view_own');
            if (!canAccessModule) {
               // Not permitted — find first page they CAN access
               const PRIORITY = ['/', '/schedule', '/jobs', '/quotes', '/leads', '/timesheets', '/invoices', '/people', '/stock', '/purchase-orders', '/reports', '/contractors', '/suppliers', '/assets', '/documents', '/settings'];
               const fallback = PRIORITY.find(route => {
                 const mod = pathMap[route];
                 if (mod === 'Notifications' || mod === 'Dashboard') return true;
                 return hasPermission(mod, 'view') || hasPermission(mod, 'view_own');
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

  updateSidebarActive(path);
  createBreadcrumb(path);
};

// Handle logout events globally
window.addEventListener('relay-logout', () => {
  clearSessionUser();
  localStorage.removeItem('relay_login_mode');
  try { sessionStorage.removeItem('relay_active_account'); } catch {}
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
// Cross-tab session sync: `currentUser` (localStorage) is the canonical auth
// marker written on every login and removed on every logout. If another tab
// signs in/out (or switches account), adopt its state by reloading so the boot
// logic below restores the correct session. Only react when the signed-in
// *identity* changes — role toggles and other same-user writes must not reload.
function authIdentityOf(raw) {
  if (!raw) return '';
  try {
    const u = JSON.parse(raw);
    return (u && u.id && u.companyId) ? `${u.id}|${u.companyId}` : '';
  } catch {
    return '';
  }
}

window.addEventListener('storage', (e) => {
  if (e.key !== 'currentUser') return;
  if (authIdentityOf(e.newValue) === authIdentityOf(e.oldValue)) return;
  window.location.reload();
});

// Before resolving, check if we need to redirect to login
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
// Local mode is single-user: the owner account is the only identity that can
// hold a local session. A staff session left behind by the removed multi-user
// local mode is discarded here, so those installs land back on the launch
// screen instead of a session the app no longer supports.
if (currentUser && currentUser.companyId && String(currentUser.companyId).startsWith('acct_')
  && currentUser.id !== `${currentUser.companyId}_admin`) {
  clearSessionUser();
  localStorage.removeItem('relay_login_mode');
  currentUser = null;
}
// A legacy multi-user marker is already normalised to `local` above, before the
// shell is built; here we only fill in a mode when nothing is recorded.
if (currentUser && !localStorage.getItem('relay_login_mode')) {
  const isLocal = currentUser.companyId && String(currentUser.companyId).startsWith('acct_');
  localStorage.setItem('relay_login_mode', isLocal ? 'local' : 'cloud');
}
// The technician role and mode a removed Simple Mode toggle left behind were
// already repaired above, before the shell was built.
const isPortalHash =  window.location.hash.startsWith('#/contractor-portal') || window.location.hash.startsWith('#/portal/customer');
const isSubscribeHash = window.location.hash.startsWith('#/subscribe');
const isSetupHash = window.location.hash.startsWith('#/setup');
const isLegalHash = ['#/terms', '#/privacy', '#/refunds', '#/acceptable-use'].some((h) => window.location.hash.startsWith(h));
if (!currentUser && window.location.hash !== '#/login' && !isPortalHash && !isSubscribeHash && !isSetupHash && !isLegalHash) {
  window.location.hash = '#/login';
}
// No signed-in session at boot → clear any stale per-tab local account namespace.
if (!currentUser) {
  try { sessionStorage.removeItem('relay_active_account'); } catch {}
}

// An early build of the email feature stored its config object at settings.email,
// which is the business email address string shown on invoices and the customer
// portal. Move it to settings.mailer once, on boot, so those stop rendering
// "[object Object]" and the saved email config survives.
function repairMailerSettings() {
  const s = store.getSettings();
  if (!s || !s.email || typeof s.email !== 'object') return;
  import('./utils/email.js')
    .then(({ migrateMailerSettings }) => migrateMailerSettings())
    .catch((err) => console.warn('Mailer settings repair skipped:', err));
}

if (store.initPromise && typeof store.initPromise.then === 'function') {
  store.initPromise
    .then(() => {
      repairMailerSettings();
      migrateJobNumberPrefix();
      router.resolve();
    })
    .catch((err) => {
      console.error('Failed to initialize data store:', err);
      router.resolve();
    });
} else {
  router.resolve();
}



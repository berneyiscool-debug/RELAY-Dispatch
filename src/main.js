// ============================================
// SIMPRO CLONE — MAIN ENTRY POINT
// ============================================

import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';

import { router } from './router.js';
import { store } from './data/store.js';
import { seedData } from './data/seed.js';
import { createSidebar, updateSidebarActive } from './components/Sidebar.js';
import { createTopBar } from './components/TopBar.js';
import { createBreadcrumb } from './components/Breadcrumb.js';

// Pages
import { renderDashboard } from './pages/Dashboard.js';
import { renderPeopleList } from './pages/people/PeopleList.js';
import { renderPersonDetail } from './pages/people/PersonDetail.js';
import { renderPersonForm } from './pages/people/PersonForm.js';
import { renderLeadsList } from './pages/leads/LeadsList.js';
import { renderLeadDetail } from './pages/leads/LeadDetail.js';
import { renderLeadForm } from './pages/leads/LeadForm.js';
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

import { renderLogin } from './pages/login/Login.js';
import { renderCustomerPortal } from './pages/portal/Portal.js';
import { renderContractorsList } from './pages/contractors/ContractorsList.js';
import { renderContractorForm } from './pages/contractors/ContractorForm.js';
import { renderContractorDetail } from './pages/contractors/ContractorDetail.js';

import { renderFleetList } from './pages/fleet/FleetList.js';
import { renderVehicleForm } from './pages/fleet/VehicleForm.js';
import { renderVehicleDetail } from './pages/fleet/VehicleDetail.js';

import { renderDocumentBrowser } from './pages/documents/DocumentBrowser.js';

// ---- Initialize ----
seedData();

// Expose app globals for cross-component access
window.__simproApp = { router, store };

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

// ---- Register Routes ----
function renderPage(handler) {
  return (params) => {
    mainContent.innerHTML = '';
    mainContent.scrollTop = 0;
    handler(mainContent, params);
  };
}

// Login
router.register('/login', renderPage(renderLogin));

// Customer Portal
router.register('/portal', renderPage(renderCustomerPortal));

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

// Leads
router.register('/leads', renderPage(renderLeadsList));
router.register('/leads/new', renderPage((c, p) => renderLeadForm(c, { id: 'new' })));
router.register('/leads/:id', renderPage(renderLeadDetail));
router.register('/leads/:id/edit', renderPage((c, p) => renderLeadForm(c, p)));

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

// Fleet
router.register('/fleet', renderPage(renderFleetList));
router.register('/fleet/new', renderPage((c, p) => renderVehicleForm(c, { id: 'new' })));
router.register('/fleet/:id', renderPage(renderVehicleDetail));
router.register('/fleet/:id/edit', renderPage((c, p) => renderVehicleForm(c, p)));

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
router.register('/purchase-orders/new', renderPage((c, p) => renderPurchaseOrderDetail(c, { id: 'new', jobId: p.jobId })));
router.register('/purchase-orders/:id', renderPage(renderPurchaseOrderDetail));

// Documents
router.register('/documents', renderPage(renderDocumentBrowser));

// Reports
router.register('/reports', renderPage(renderReports));

// Settings
router.register('/settings', renderPage(renderSettings));

// ---- Auth Guard Hook ----
const protectedRoutes = ['/', '/people', '/contractors', '/leads', '/quotes', '/jobs', '/timesheets', '/fleet', '/schedule', '/stock', '/invoices', '/purchase-orders', '/documents', '/reports', '/settings'];
const customerRoutes = ['/portal'];

router.onNavigate = (path, params) => {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  const basePath = path === '/' ? '/' : '/' + path.split('/').filter(Boolean)[0];

  if (!currentUser && path !== '/login') {
    // Redirect to login if not authenticated
    router.navigate('/login');
    return false; // Prevent further navigation handling if we had a way, but since we call it directly we just navigate
  }

  if (currentUser) {
    if (currentUser.role === 'customer' && protectedRoutes.includes(basePath)) {
       // Customer trying to access staff pages -> force to portal
       router.navigate('/portal');
       return false;
    } else if (currentUser.role !== 'customer' && basePath === '/portal') {
       // Staff trying to access customer portal directly (could allow this, but let's send to dashboard)
       router.navigate('/');
       return false;
    }

    // Check page permissions
    if (currentUser.role !== 'admin' && currentUser.role !== 'customer' && currentUser.userTypeId && path !== '/login') {
       const ut = store.getById('userTypes', currentUser.userTypeId);
       if (ut && ut.permissions) {
          const pathMap = {
             '/': 'Dashboard',
             '/people': 'Customers',
             '/leads': 'Leads',
             '/quotes': 'Quotes',
             '/jobs': 'Jobs',
             '/timesheets': 'Timesheets',
             '/fleet': 'Fleet',
             '/schedule': 'Schedule',
             '/contractors': 'Contractors',
             '/stock': 'Stock',
             '/purchase-orders': 'Purchase Orders',
             '/invoices': 'Invoices',
             '/documents': 'Documents',
             '/reports': 'Reports',
             '/settings': 'Settings'
          };
          const moduleName = pathMap[basePath];
          if (moduleName) {
             const p = ut.permissions.find(m => m.module === moduleName);
             if (!p || (!p.view && !p.create && !p.edit && !p.delete)) {
                // No permissions at all for this page, redirect to Dashboard
                if (basePath !== '/') {
                   router.navigate('/');
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

// ---- Boot ----
// Before resolving, check if we need to redirect to login
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
if (!currentUser && window.location.hash !== '#/login') {
  window.location.hash = '#/login';
}

router.resolve();

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

// Dashboard
router.register('/', renderPage(renderDashboard));

// People
router.register('/people', renderPage(renderPeopleList));
router.register('/people/new', renderPage((c, p) => renderPersonForm(c, { id: 'new' })));
router.register('/people/:id', renderPage(renderPersonDetail));
router.register('/people/:id/edit', renderPage((c, p) => renderPersonForm(c, p)));

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

// Reports
router.register('/reports', renderPage(renderReports));

// Settings
router.register('/settings', renderPage(renderSettings));

// ---- Navigation Hook ----
router.onNavigate = (path) => {
  updateSidebarActive(path);
  createBreadcrumb(path);
};

// ---- Boot ----
router.resolve();

import { router } from '../router.js';

const routeLabels = {
  '/': 'Dashboard',
  '/people': 'Customers',
  '/leads': 'Leads',
  '/quotes': 'Quotes',
  '/jobs': 'Jobs',
  '/schedule': 'Schedule',
  '/stock': 'Stock',
  '/invoices': 'Invoices',
  '/settings': 'Settings',
  '/timesheets': 'Timesheets',
  '/contractors': 'Contractors',
  '/suppliers': 'Suppliers',
  '/assets': 'Assets',
  '/notifications': 'Notifications',
};

export function createBreadcrumb(path) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;

  if (path === '/') {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.style.justifyContent = 'space-between';
  container.style.alignItems = 'center';
  
  const parts = path.split('/').filter(Boolean);

  let linksHtml = `
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `;

  let currentPath = '';
  parts.forEach((part, i) => {
    currentPath += '/' + part;
    const isLast = i === parts.length - 1;
    const label = routeLabels[currentPath] || decodeURIComponent(part);

    linksHtml += `<span class="breadcrumb-separator">›</span>`;

    if (isLast) {
      linksHtml += `<span class="breadcrumb-item current">${label}</span>`;
    } else {
      linksHtml += `<span class="breadcrumb-item" data-path="${currentPath}">${label}</span>`;
    }
  });

  container.innerHTML = `
    <div class="breadcrumb-links" style="display:flex; align-items:center; gap:var(--space-sm);">${linksHtml}</div>
    <div class="breadcrumb-actions" id="breadcrumb-actions" style="display:flex; gap:var(--space-sm);"></div>
  `;

  // Click handlers
  container.querySelectorAll('.breadcrumb-item[data-path]').forEach(item => {
    item.addEventListener('click', () => {
      router.navigate(item.dataset.path);
    });
  });
}

export function updateBreadcrumbDetail(label) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;
  const current = container.querySelector('.breadcrumb-item.current');
  if (current) current.textContent = label;
}

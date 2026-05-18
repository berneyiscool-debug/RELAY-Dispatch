// ============================================
// SIMPRO CLONE — BREADCRUMB COMPONENT
// ============================================

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
};

export function createBreadcrumb(path) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;

  if (path === '/') {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  const parts = path.split('/').filter(Boolean);

  let html = `
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `;

  let currentPath = '';
  parts.forEach((part, i) => {
    currentPath += '/' + part;
    const isLast = i === parts.length - 1;
    const label = routeLabels[currentPath] || decodeURIComponent(part);

    html += `<span class="breadcrumb-separator">›</span>`;

    if (isLast) {
      html += `<span class="breadcrumb-item current">${label}</span>`;
    } else {
      html += `<span class="breadcrumb-item" data-path="${currentPath}">${label}</span>`;
    }
  });

  container.innerHTML = html;

  // Click handlers
  container.querySelectorAll('.breadcrumb-item[data-path]').forEach(item => {
    item.addEventListener('click', () => {
      const { router } = window.__fieldForge || {};
      if (router) router.navigate(item.dataset.path);
    });
  });
}

export function updateBreadcrumbDetail(label) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;
  const current = container.querySelector('.breadcrumb-item.current');
  if (current) current.textContent = label;
}

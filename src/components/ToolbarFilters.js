// ============================================
// SIMPRO CLONE — PREMIUM FILTERS CAROUSEL COMPONENT
// ============================================

import { store } from '../data/store.js';
import { escapeHTML } from '../utils/security.js';

export function createToolbarFilters({ container, originalData, filterType, onFilterChange }) {
  if (!container) return;

  // Selected filters set. 'all' is active by default.
  let activeFilters = new Set(['all']);

  // Dynamic Smart Tags generation
  function getAvailableTags() {
    const tags = [{ key: 'all', label: `All (${originalData.length})` }];

    if (filterType === 'jobs') {
      const statuses = ['Pending', 'Scheduled', 'In Progress', 'Completed', 'On Hold', 'Invoiced'];
      statuses.forEach(status => {
        const count = originalData.filter(j => j.status === status).length;
        if (count > 0) tags.push({ key: `status:${status}`, label: `${status} (${count})` });
      });

      // Unscheduled smart tag
      const unschedCount = originalData.filter(j => !j.scheduledDate).length;
      if (unschedCount > 0) tags.push({ key: 'smart:unscheduled', label: `Unscheduled (${unschedCount})` });

      // Urgent smart tag
      const urgentCount = originalData.filter(j => j.priority === 'Urgent' || j.priority === 'High' || j.isEmergency).length;
      if (urgentCount > 0) tags.push({ key: 'smart:urgent', label: `Urgent (${urgentCount})` });

      // High Value smart tag
      const hiValCount = originalData.filter(j => {
        const total = (j.laborCost || 0) + (j.materialCost || 0);
        return total > 1500;
      }).length;
      if (hiValCount > 0) tags.push({ key: 'smart:highvalue', label: `High Value (${hiValCount})` });

      // Contractor Assigned smart tag
      const contrCount = originalData.filter(j => j.contractorId).length;
      if (contrCount > 0) tags.push({ key: 'smart:contracted', label: `Contractor Assigned (${contrCount})` });

      // Internal Tech smart tag
      const internalCount = originalData.filter(j => !j.contractorId).length;
      if (internalCount > 0) tags.push({ key: 'smart:internal', label: `Internal Tech (${internalCount})` });

    } else if (filterType === 'people') {
      const statuses = ['Active', 'Inactive'];
      statuses.forEach(status => {
        const count = originalData.filter(c => c.status === status).length;
        if (count > 0) tags.push({ key: `status:${status}`, label: `${status} (${count})` });
      });

      // Commercial smart tag
      const commCount = originalData.filter(c => c.type === 'Commercial').length;
      if (commCount > 0) tags.push({ key: 'smart:commercial', label: `Commercial (${commCount})` });

      // Residential smart tag
      const resCount = originalData.filter(c => c.type === 'Residential').length;
      if (resCount > 0) tags.push({ key: 'smart:residential', label: `Residential (${resCount})` });

      // VIP smart tag (Customers with more than 2 jobs in the database)
      const jobsList = store.getAll('jobs') || [];
      const vipCount = originalData.filter(c => {
        const customerJobsCount = jobsList.filter(j => j.customerId === c.id).length;
        return customerJobsCount >= 2;
      }).length;
      if (vipCount > 0) tags.push({ key: 'smart:vip', label: `VIP Customer (${vipCount})` });

      // Outstanding Invoice smart tag
      const invoices = store.getAll('invoices') || [];
      const outstandingCount = originalData.filter(c => {
        return invoices.some(i => i.customerId === c.id && (i.status === 'Sent' || i.status === 'Overdue'));
      }).length;
      if (outstandingCount > 0) tags.push({ key: 'smart:outstanding', label: `Outstanding Invoice (${outstandingCount})` });

    } else if (filterType === 'stock') {
      // Collect all dynamic categories
      const categories = [...new Set(originalData.map(s => s.category))];
      categories.forEach(cat => {
        const count = originalData.filter(s => s.category === cat).length;
        if (count > 0) tags.push({ key: `cat:${cat}`, label: `${cat} (${count})` });
      });

      // In Stock smart tag
      const inStockCount = originalData.filter(s => {
        const totalQty = (s.locations || []).reduce((sum, l) => sum + l.quantity, 0);
        return totalQty > (s.reorderLevel || 0);
      }).length;
      if (inStockCount > 0) tags.push({ key: 'smart:instock', label: `In Stock (${inStockCount})` });

      // Low Stock smart tag
      const lowStockCount = originalData.filter(s => {
        const totalQty = (s.locations || []).reduce((sum, l) => sum + l.quantity, 0);
        return totalQty <= (s.reorderLevel || 0) && totalQty > 0;
      }).length;
      if (lowStockCount > 0) tags.push({ key: 'smart:lowstock', label: `Low Stock (${lowStockCount})` });

      // Out of Stock smart tag
      const outStockCount = originalData.filter(s => {
        const totalQty = (s.locations || []).reduce((sum, l) => sum + l.quantity, 0);
        return totalQty === 0;
      }).length;
      if (outStockCount > 0) tags.push({ key: 'smart:outofstock', label: `Out of Stock (${outStockCount})` });

      // High Cost smart tag
      const hiCostCount = originalData.filter(s => (s.unitPrice || 0) > 100).length;
      if (hiCostCount > 0) tags.push({ key: 'smart:highcost', label: `High Cost (> $100) (${hiCostCount})` });
    }

    return tags;
  }

  // Filter items matching active set
  function applyActiveFilters() {
    if (activeFilters.has('all')) {
      onFilterChange(originalData);
      return;
    }

    const filtered = originalData.filter(item => {
      // For each active filter key, check if item satisfies
      return Array.from(activeFilters).every(filterKey => {
        const [type, value] = filterKey.split(':');

        if (filterType === 'jobs') {
          if (type === 'status') return item.status === value;
          if (filterKey === 'smart:unscheduled') return !item.scheduledDate;
          if (filterKey === 'smart:urgent') return item.priority === 'Urgent' || item.priority === 'High' || item.isEmergency;
          if (filterKey === 'smart:highvalue') return ((item.laborCost || 0) + (item.materialCost || 0)) > 1500;
          if (filterKey === 'smart:contracted') return !!item.contractorId;
          if (filterKey === 'smart:internal') return !item.contractorId;
        }

        if (filterType === 'people') {
          if (type === 'status') return item.status === value;
          if (filterKey === 'smart:commercial') return item.type === 'Commercial';
          if (filterKey === 'smart:residential') return item.type === 'Residential';
          if (filterKey === 'smart:vip') {
            const jobsList = store.getAll('jobs') || [];
            return jobsList.filter(j => j.customerId === item.id).length >= 2;
          }
          if (filterKey === 'smart:outstanding') {
            const invoices = store.getAll('invoices') || [];
            return invoices.some(i => i.customerId === item.id && (i.status === 'Sent' || i.status === 'Overdue'));
          }
        }

        if (filterType === 'stock') {
          if (type === 'cat') return item.category === value;
          const totalQty = (item.locations || []).reduce((sum, l) => sum + l.quantity, 0);
          if (filterKey === 'smart:instock') return totalQty > (item.reorderLevel || 0);
          if (filterKey === 'smart:lowstock') return totalQty <= (item.reorderLevel || 0) && totalQty > 0;
          if (filterKey === 'smart:outofstock') return totalQty === 0;
          if (filterKey === 'smart:highcost') return (item.unitPrice || 0) > 100;
        }

        return true;
      });
    });

    onFilterChange(filtered);
  }

  function renderCarousel() {
    const list = getAvailableTags();

    container.innerHTML = `
      <div class="filters-carousel-container">
        <button class="filters-carousel-btn btn-carousel-left" title="Scroll left">
          <span class="material-icons-outlined">chevron_left</span>
        </button>
        <div class="filters-carousel-viewport">
          ${list.map(tag => {
            const active = activeFilters.has(tag.key);
            return `
              <button class="toolbar-filter ${active ? 'active' : ''}" data-key="${escapeHTML(tag.key)}" style="flex-shrink:0">
                ${escapeHTML(tag.label)}
              </button>
            `;
          }).join('')}
        </div>
        <button class="filters-carousel-btn btn-carousel-right" title="Scroll right">
          <span class="material-icons-outlined">chevron_right</span>
        </button>
      </div>
    `;

    const viewport = container.querySelector('.filters-carousel-viewport');
    const leftBtn = container.querySelector('.btn-carousel-left');
    const rightBtn = container.querySelector('.btn-carousel-right');

    leftBtn.addEventListener('click', () => {
      viewport.scrollLeft -= 140;
    });

    rightBtn.addEventListener('click', () => {
      viewport.scrollLeft += 140;
    });

    // Check if scrolling is needed
    function updateArrowVisibility() {
      const showLeft = viewport.scrollLeft > 5;
      const showRight = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft > 5;
      leftBtn.style.opacity = showLeft ? '1' : '0.2';
      rightBtn.style.opacity = showRight ? '1' : '0.2';
    }

    viewport.addEventListener('scroll', updateArrowVisibility);
    window.addEventListener('resize', updateArrowVisibility);
    setTimeout(updateArrowVisibility, 100);

    // Filter toggles
    container.querySelectorAll('.toolbar-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;

        if (key === 'all') {
          activeFilters.clear();
          activeFilters.add('all');
        } else {
          activeFilters.delete('all');
          if (activeFilters.has(key)) {
            activeFilters.delete(key);
          } else {
            activeFilters.add(key);
          }
          if (activeFilters.size === 0) {
            activeFilters.add('all');
          }
        }

        renderCarousel();
        applyActiveFilters();
      });
    });
  }

  // Initial boot
  renderCarousel();

  return {
    getActiveFilters: () => Array.from(activeFilters),
    refresh: (newData) => {
      originalData = newData;
      renderCarousel();
      applyActiveFilters();
    }
  };
}

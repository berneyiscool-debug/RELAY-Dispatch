// ============================================
// SIMPRO CLONE — SEARCHABLE SELECT DROPDOWNS
// ============================================

import { escapeHTML } from './security.js';

export function enhanceSelect(select) {
  if (!select || select.tagName !== 'SELECT') return;
  if (select.dataset.searchableEnhanced) return;

  // Mark select as enhanced
  select.dataset.searchableEnhanced = 'true';

  // Get configuration
  const placeholder = select.getAttribute('placeholder') || select.options[0]?.text || 'Select...';
  const selectId = select.id ? `id="${select.id}-searchable"` : '';
  const initialWidth = select.style.width || '';
  const initialMargin = select.style.margin || '';
  const initialFlex = select.style.flex || '';

  // Setup wrapper elements
  const container = document.createElement('div');
  container.className = 'searchable-select-container';
  if (initialWidth) container.style.width = initialWidth;
  if (initialMargin) container.style.margin = initialMargin;
  if (initialFlex) container.style.flex = initialFlex;
  if (select.classList.contains('item-input')) {
    container.style.width = '100%';
  }

  // Create fake input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input searchable-select-input';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.disabled = select.disabled;
  if (selectId) input.id = `${select.id}-searchable-input`;

  // Create dropdown arrow indicator
  const arrow = document.createElement('span');
  arrow.className = 'material-icons-outlined searchable-select-arrow';
  arrow.textContent = 'arrow_drop_down';

  // Create dropdown menu container
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu searchable-select-dropdown';

  // Inject wrapper elements into DOM
  select.parentNode.insertBefore(container, select);
  container.appendChild(select);
  container.appendChild(input);
  container.appendChild(arrow);

  // Hide the original select but keep it focusable and validatable
  select.classList.add('searchable-select-original');

  let activeIndex = -1;

  // Refresh current display text
  function refreshDisplay() {
    const selectedOpt = select.options[select.selectedIndex];
    input.value = selectedOpt && selectedOpt.value !== '' ? selectedOpt.text : '';
    input.placeholder = selectedOpt ? selectedOpt.text : placeholder;
  }

  // Populate options inside dynamic dropdown
  function rebuildDropdown(filterQuery = '') {
    dropdown.innerHTML = '';
    activeIndex = -1; // Reset active keyboard highlight index
    
    // If the filterQuery matches the currently selected option text, treat it as empty
    // so we show the full list when they focus/click it without typing anything new!
    const selectedOpt = select.options[select.selectedIndex];
    const selectedText = selectedOpt ? selectedOpt.text : '';
    if (filterQuery === selectedText) {
      filterQuery = '';
    }

    const q = filterQuery.toLowerCase();
    const options = Array.from(select.options);
    let count = 0;

    options.forEach((opt, idx) => {
      // Exclude empty-value placeholder options if there is typing
      if (opt.value === '' && filterQuery !== '') return;

      const text = opt.text;
      if (q && !text.toLowerCase().includes(q)) return;

      const item = document.createElement('div');
      item.className = 'searchable-select-option';
      if (idx === select.selectedIndex) item.classList.add('selected');
      item.textContent = text;
      item.dataset.index = idx;

      // Use mousedown to select instantly before input blur hides dropdown
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Keep input focused
        selectOption(idx);
      });

      dropdown.appendChild(item);
      count++;
    });

    if (count === 0) {
      const noMatch = document.createElement('div');
      noMatch.className = 'searchable-select-no-matches';
      noMatch.textContent = 'No results found';
      dropdown.appendChild(noMatch);
    }
  }

  function selectOption(idx) {
    select.selectedIndex = idx;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    closeDropdown();
    refreshDisplay();
  }

  function positionDropdown() {
    if (!container.classList.contains('searchable-select-open')) return;
    const rect = input.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.style.zIndex = '99999';
  }

  function openDropdown() {
    if (container.classList.contains('searchable-select-open') || select.disabled) return;
    
    // Close other dropdowns first
    document.querySelectorAll('.searchable-select-container.searchable-select-open').forEach(c => {
      if (c.__closeSearchableSelect) c.__closeSearchableSelect();
    });

    container.classList.add('searchable-select-open');
    document.body.appendChild(dropdown);
    rebuildDropdown('');
    positionDropdown();
    
    // Listen to scroll and resize to update position
    window.addEventListener('scroll', positionDropdown, { capture: true, passive: true });
    window.addEventListener('resize', positionDropdown);
    
    // If text field matches the selected option, select it all so typing overwrites it easily
    input.select();
  }

  function closeDropdown() {
    if (!container.classList.contains('searchable-select-open')) return;
    container.classList.remove('searchable-select-open');
    dropdown.remove();
    
    window.removeEventListener('scroll', positionDropdown, { capture: true });
    window.removeEventListener('resize', positionDropdown);
    
    refreshDisplay();
  }

  // Attach close reference to container
  container.__closeSearchableSelect = closeDropdown;

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('active-highlight');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active-highlight');
      }
    });
  }

  // Event bindings
  input.addEventListener('focus', openDropdown);
  input.addEventListener('click', openDropdown);

  arrow.addEventListener('click', (e) => {
    if (container.classList.contains('searchable-select-open')) {
      closeDropdown();
    } else {
      openDropdown();
      input.focus();
    }
  });

  input.addEventListener('input', () => {
    if (!container.classList.contains('searchable-select-open')) {
      openDropdown();
    }
    rebuildDropdown(input.value);
    positionDropdown();
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (!container.classList.contains('searchable-select-open')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    const items = Array.from(dropdown.querySelectorAll('.searchable-select-option'));
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetIndex = activeIndex >= 0 && activeIndex < items.length ? activeIndex : 0;
      const realIndex = parseInt(items[targetIndex].dataset.index, 10);
      selectOption(realIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      input.blur();
    }
  });

  // Close dropdown on clicking outside
  const clickOutsideHandler = (e) => {
    if (!container.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  };
  document.addEventListener('click', clickOutsideHandler);

  // Sync state when options or disabled attribute on original select change
  const selectObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.type === 'childList') {
        refreshDisplay();
        if (container.classList.contains('searchable-select-open')) {
          rebuildDropdown(input.value);
          positionDropdown();
        }
      } else if (m.type === 'attributes' && m.attributeName === 'disabled') {
        input.disabled = select.disabled;
      }
    });
  });
  selectObserver.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });

  // Initial render
  refreshDisplay();

  // Cleanup reference
  select._searchableCleanup = () => {
    document.removeEventListener('click', clickOutsideHandler);
    selectObserver.disconnect();
    dropdown.remove();
  };
}

export function initSearchableSelects() {
  // Global scanner
  function scanAndEnhance(node) {
    if (!node) return;
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.tagName === 'SELECT' && (node.classList.contains('form-select') || node.classList.contains('form-input') || node.classList.contains('item-input'))) {
      enhanceSelect(node);
    }

    const selects = node.querySelectorAll('select.form-select, select.form-input, select.item-input');
    selects.forEach(s => enhanceSelect(s));
  }

  // Initial scan
  scanAndEnhance(document.body);

  // Monitor DOM modifications
  const bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((n) => scanAndEnhance(n));
    });
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

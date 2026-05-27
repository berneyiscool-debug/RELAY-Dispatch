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
  container.appendChild(dropdown);

  // Hide the original select but keep it focusable and validatable
  select.classList.add('searchable-select-original');

  let activeIndex = -1;
  let isOpen = false;

  // Refresh current display text
  function refreshDisplay() {
    const selectedOpt = select.options[select.selectedIndex];
    input.value = selectedOpt && selectedOpt.value !== '' ? selectedOpt.text : '';
    input.placeholder = selectedOpt ? selectedOpt.text : placeholder;
  }

  // Populate options inside dynamic dropdown
  function rebuildDropdown(filterQuery = '') {
    dropdown.innerHTML = '';
    
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

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        select.selectedIndex = idx;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeDropdown();
        refreshDisplay();
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

  function openDropdown() {
    if (isOpen || select.disabled) return;
    // Close other dropdowns first
    document.querySelectorAll('.searchable-select-dropdown').forEach(d => d.style.display = 'none');
    
    isOpen = true;
    dropdown.style.display = 'block';
    rebuildDropdown('');

    // If text field matches the selected option, select it all so typing overwrites it easily
    input.select();
  }

  function closeDropdown() {
    if (!isOpen) return;
    isOpen = false;
    // Slight delay so option clicks go through before closing
    setTimeout(() => {
      dropdown.style.display = 'none';
      refreshDisplay();
    }, 150);
  }

  // Event bindings
  input.addEventListener('focus', openDropdown);
  input.addEventListener('click', openDropdown);
  arrow.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
      input.focus();
    }
  });

  input.addEventListener('input', () => {
    if (!isOpen) openDropdown();
    rebuildDropdown(input.value);
  });

  // Close dropdown on clicking outside
  const clickOutsideHandler = (e) => {
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  };
  document.addEventListener('click', clickOutsideHandler);

  // Sync state when options or disabled attribute on original select change
  const selectObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.type === 'childList') {
        refreshDisplay();
        if (isOpen) rebuildDropdown(input.value);
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

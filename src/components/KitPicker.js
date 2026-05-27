// ============================================
// FIELDFORGE — KIT PICKER MODAL (SHARED)
// ============================================

import { store } from '../data/store.js';
import { showModal } from './Modal.js';
import { escapeHTML } from '../utils/security.js';

/**
 * Opens a modal allowing the user to pick a kit.
 * @param {Object} options
 * @param {Function} options.onSelect  Called with the selected kit object
 * @param {string}   options.context   'quote' | 'po' — determines price column shown
 */
export function showKitPicker({ onSelect, context = 'quote' }) {
  const kits = store.getAll('kits').filter(k => k.active !== false);
  const categories = ['All', ...new Set(kits.map(k => k.category).filter(Boolean))];

  const content = document.createElement('div');
  let activeCategory = 'All';
  let searchTerm = '';

  function renderList() {
    let filtered = kits;
    if (activeCategory !== 'All') filtered = filtered.filter(k => k.category === activeCategory);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(k => k.name.toLowerCase().includes(q) || (k.description || '').toLowerCase().includes(q));
    }

    content.innerHTML = `
      <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; align-items:center">
        <div class="toolbar-search" style="flex:1; min-width:200px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="kit-search" placeholder="Search kits..." value="${escapeHTML(searchTerm)}" style="width:100%" />
        </div>
      </div>
      <div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap">
        ${categories.map(c => `
          <button class="kit-cat-filter btn btn-sm ${c === activeCategory ? 'btn-primary' : 'btn-secondary'}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>
        `).join('')}
      </div>
      <div style="max-height:420px; overflow-y:auto">
        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:40px; color:var(--text-tertiary)">
            <span class="material-icons-outlined" style="font-size:36px; margin-bottom:8px">widgets</span>
            <p>No kits found</p>
          </div>
        ` : filtered.map(kit => {
          const materialCount = kit.items.filter(i => i.type !== 'labor').length;
          const laborCount = kit.items.filter(i => i.type === 'labor').length;
          const priceLabel = context === 'po' ? `Cost: $${(kit.totalCost || 0).toFixed(2)}` : `Sell: $${(kit.totalPrice || 0).toFixed(2)}`;
          return `
            <div class="kit-pick-item" data-id="${kit.id}" style="padding:14px 16px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px; cursor:pointer; transition:all 0.15s ease; display:flex; justify-content:space-between; align-items:center">
              <div style="flex:1; min-width:0">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px">
                  <span style="font-weight:600; font-size:var(--font-size-base)">${escapeHTML(kit.name)}</span>
                  <span class="badge badge-neutral" style="font-size:10px">${escapeHTML(kit.category)}</span>
                </div>
                <div style="font-size:12px; color:var(--text-secondary); margin-bottom:6px">${escapeHTML(kit.description || '')}</div>
                <div style="display:flex; gap:12px; font-size:11px; color:var(--text-tertiary)">
                  <span>${materialCount} material${materialCount !== 1 ? 's' : ''}</span>
                  ${laborCount > 0 ? `<span>${laborCount} labour</span>` : ''}
                  <span style="font-weight:600; color:var(--text-secondary)">${priceLabel}</span>
                </div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary); font-size:28px; flex-shrink:0">add_circle_outline</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind search
    content.querySelector('#kit-search')?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderList();
    });

    // Bind category filters
    content.querySelectorAll('.kit-cat-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderList();
      });
    });

    // Bind kit selection
    content.querySelectorAll('.kit-pick-item').forEach(el => {
      el.addEventListener('mouseenter', () => { el.style.borderColor = 'var(--color-primary)'; el.style.background = 'var(--color-primary-light, rgba(49,86,113,0.04))'; });
      el.addEventListener('mouseleave', () => { el.style.borderColor = 'var(--border-color)'; el.style.background = ''; });
      el.addEventListener('click', () => {
        const kit = kits.find(k => k.id === el.dataset.id);
        if (kit && onSelect) {
          onSelect(kit);
          closeModal();
        }
      });
    });
  }

  renderList();

  let closeModal;
  const modal = showModal({
    title: 'Add Kit',
    content,
    size: 'lg',
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() }
    ]
  });
  closeModal = modal?.close || (() => document.querySelector('.modal-overlay')?.remove());
}

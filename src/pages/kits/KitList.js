// ============================================
// FIELDFORGE — KIT LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderKitList(container) {
  let searchTerm = '';
  let activeCategory = 'All';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let kits = store.getAll('kits').filter(k => k.active !== false);

    // Category list
    const allCategories = ['All', ...new Set(kits.map(k => k.category).filter(Boolean))];

    // Filter
    if (activeCategory !== 'All') kits = kits.filter(k => k.category === activeCategory);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      kits = kits.filter(k => k.name.toLowerCase().includes(q) || (k.description || '').toLowerCase().includes(q));
    }

    // Sort
    kits.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
          <h2 style="margin:0; display:flex; align-items:center; gap:10px">
            <span class="material-icons-outlined" style="font-size:28px; color:var(--color-primary)">widgets</span>
            Kits
          </h2>
          <p style="margin:4px 0 0; color:var(--text-tertiary); font-size:var(--font-size-sm)">Reusable item bundles for quotes, jobs & purchase orders</p>
        </div>
        <button class="btn btn-primary" id="btn-new-kit" data-tooltip="Create a new pre-packaged materials and labor bundle" data-tooltip-pos="left">
          <span class="material-icons-outlined">add</span> New Kit
        </button>
      </div>

      <div style="display:flex; gap:12px; align-items:center; margin-bottom:16px; flex-wrap:wrap">
        <div class="toolbar-search" style="flex:1; min-width:200px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="kit-search" placeholder="Search kits..." value="${escapeHTML(searchTerm)}" />
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap">
          ${allCategories.map(c => `
            <button class="kit-cat-btn btn btn-sm ${c === activeCategory ? 'btn-primary' : 'btn-secondary'}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>
          `).join('')}
        </div>
      </div>

      ${kits.length === 0 ? `
        <div class="empty-state">
          <span class="material-icons-outlined">widgets</span>
          <h3>No Kits Yet</h3>
          <p>Create reusable item bundles to speed up quoting and ordering</p>
          <button class="btn btn-primary" id="btn-empty-new" data-tooltip="Create a new pre-packaged materials and labor bundle" data-tooltip-pos="top">Create First Kit</button>
        </div>
      ` : `
        <div class="card" style="overflow:hidden">
          <table class="data-table">
            <thead>
              <tr>
                <th data-sort="name" style="cursor:pointer">Kit Name ${sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th data-sort="category" style="cursor:pointer">Category ${sortField === 'category' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th>Items</th>
                <th data-sort="totalCost" style="text-align:right; cursor:pointer">Total Cost ${sortField === 'totalCost' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th data-sort="totalPrice" style="text-align:right; cursor:pointer">Total Sell ${sortField === 'totalPrice' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th style="text-align:right">Margin</th>
              </tr>
            </thead>
            <tbody>
              ${kits.map(kit => {
                const materialCount = (kit.items || []).filter(i => i.type !== 'labor').length;
                const laborCount = (kit.items || []).filter(i => i.type === 'labor').length;
                const margin = kit.totalPrice > 0 ? ((kit.totalPrice - kit.totalCost) / kit.totalPrice * 100) : 0;
                const marginColor = margin >= 30 ? 'var(--color-success)' : margin >= 15 ? 'var(--color-warning)' : 'var(--color-danger)';
                return `
                  <tr data-id="${kit.id}" style="cursor:pointer">
                    <td>
                      <div style="font-weight:600; color:var(--color-primary)">${escapeHTML(kit.name)}</div>
                      ${kit.description ? `<div style="font-size:12px; color:var(--text-tertiary); margin-top:2px">${escapeHTML(kit.description)}</div>` : ''}
                    </td>
                    <td><span class="badge badge-neutral">${escapeHTML(kit.category || 'General')}</span></td>
                    <td>
                      <span style="font-size:12px">${materialCount} material${materialCount !== 1 ? 's' : ''}${laborCount > 0 ? `, ${laborCount} labour` : ''}</span>
                    </td>
                    <td style="text-align:right">$${(kit.totalCost || 0).toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${(kit.totalPrice || 0).toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${marginColor}">${margin.toFixed(1)}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#btn-new-kit')?.addEventListener('click', () => router.navigate('/kits/new'));
    container.querySelector('#btn-empty-new')?.addEventListener('click', () => router.navigate('/kits/new'));

    container.querySelector('#kit-search')?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      render();
    });

    container.querySelectorAll('.kit-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        render();
      });
    });

    container.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = field; sortDir = 'asc'; }
        render();
      });
    });

    container.querySelectorAll('tbody tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => router.navigate(`/kits/${tr.dataset.id}`));
    });
  }

  render();
}

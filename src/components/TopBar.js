// ============================================
// RELAY DISPATCH — TOP BAR COMPONENT
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { toggleRelay, onRelayToggle } from './RelayAssistant.js';
import { getListSearch, getListSearchLabel } from '../utils/listSearch.js';
import { escapeHTML } from '../utils/security.js';
import { openHelpCenter } from './HelpCenter.js';

// Brand lockup for the top bar's left (moved up from the sidebar). Uses the
// company logo when set, else the Relay mark + wordmark.
function buildBrandHtml() {
  const s = store.getSettings() || {};
  if (s.logo) return `<img src="${s.logo}" class="topbar-brand-logo" alt="Logo" />`;
  return `<span class="topbar-brand-mark">R</span><span class="topbar-brand-name">Relay — Dispatch</span>`;
}

export function createTopBar() {
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.id = 'topbar';

  topbar.innerHTML = `
    <div class="topbar-brand" id="topbar-brand" title="Home" role="button" tabindex="0">
      ${buildBrandHtml()}
    </div>
    <div class="topbar-actions">
      <div class="topbar-search">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" id="global-search" placeholder="Search…" autocomplete="off" />
        <span class="topbar-search-kbd">Ctrl K</span>
      </div>
      <button class="topbar-action-btn" id="btn-help" title="Help">
        <span class="material-icons-outlined">help_outline</span>
      </button>
      <button class="topbar-action-btn" id="btn-notifications" title="Notices">
        <span class="material-icons-outlined">notifications</span>
        <span class="notification-dot"></span>
      </button>
      <!-- Deputy controls — the trigger slides to line up with the drawer's
           inside edge; expand/clear/close stay pinned to the far right of the
           top bar while the Deputy drawer is open. -->
      <div class="relay-topbar-group relay-deputy-slot">
        <button class="relay-btn topbar-relay" id="btn-relay-assistant" title="brny — your co-pilot" aria-label="Open brny assistant" style="position: relative;">
          <span class="material-icons-outlined">smart_toy</span>
          <span class="deputy-ask-badge" id="deputy-ask-badge" style="display:none; position:absolute; top:-4px; right:-4px; background:var(--color-danger); color:white; font-size:10px; font-weight:bold; border-radius:12px; padding:2px 6px; border:2px solid var(--bg-color);">0</span>
        </button>
      </div>
      <div class="relay-topbar-group relay-topbar-actions">
        <button class="relay-topbar-action" id="relay-expand" title="Expand to Full Workspace" aria-label="Expand brny workspace">
          <span class="material-icons-outlined">open_in_full</span>
        </button>
        <button class="relay-topbar-action" id="relay-clear-chat" title="Clear Chat" aria-label="Clear brny chat">
          <span class="material-icons-outlined">delete_sweep</span>
        </button>
        <button class="relay-topbar-action" id="relay-close" title="Close brny" aria-label="Close brny">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>
    </div>
  `;

  // Search functionality — context-aware: on a list page it filters that table
  // in place; everywhere else it's the global "jump to a record" search.
  const searchInput = topbar.querySelector('#global-search');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    const listHandler = getListSearch();
    if (listHandler) {
      listHandler(val.trim());
    } else {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = val.trim();
        if (query.length >= 1) {
          showSearchResults(query);
        } else {
          hideSearchResults();
        }
      }, 180);
    }
  });

  // Reflect the context in the placeholder, and clear the box when leaving a list.
  function updateSearchPlaceholder() {
    const rawLabel = getListSearchLabel();
    const hasSearch = !!getListSearch();
    if (hasSearch && rawLabel) {
      let clean = rawLabel.trim();
      clean = clean.replace(/^(search|filter)\s+/i, '').replace(/[\.\…]+$/g, '').trim();
      if (clean) {
        clean = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        searchInput.placeholder = `Search ${clean}...`;
      } else {
        searchInput.placeholder = 'Search...';
      }
    } else {
      searchInput.placeholder = 'Search...';
    }
    if (!hasSearch) searchInput.value = '';
  }

  window.addEventListener('relay-list-search-changed', updateSearchPlaceholder);
  updateSearchPlaceholder();

  searchInput.addEventListener('blur', () => {
    setTimeout(hideSearchResults, 200);
  });

  // Notices logic
  const notifBtn = topbar.querySelector('#btn-notifications');
  const notifDot = topbar.querySelector('.notification-dot');

  function updateNoticesDot() {
    const notices = store.getAll('notices') || [];
    const unread = notices.filter(n => !n.read).length;
    if (unread > 0) {
      notifDot.style.display = 'block';
    } else {
      notifDot.style.display = 'none';
    }
  }

  store.on('notices', updateNoticesDot);
  updateNoticesDot();

  // Deputy Asks Notification Badge
  const askBadge = topbar.querySelector('#deputy-ask-badge');
  function updateAskBadge() {
    if (!askBadge) return;
    const asks = store.getAll('deputyAsks') || [];
    const pending = asks.filter(a => a.status === 'pending').length;
    if (pending > 0) {
      askBadge.textContent = pending;
      askBadge.style.display = 'block';
      
      // Also add a little animation to draw attention
      askBadge.style.animation = 'none';
      askBadge.offsetHeight; /* trigger reflow */
      askBadge.style.animation = 'pulse-soft 2s infinite';
    } else {
      askBadge.style.display = 'none';
    }
  }
  store.on('deputyAsks', updateAskBadge);
  updateAskBadge();

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationsDropdown(notifBtn);
  });

  const helpBtn = topbar.querySelector('#btn-help');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      openHelpCenter();
    });
  }

  // Relay assistant button — available on every page
  const relayBtn = topbar.querySelector('#btn-relay-assistant');
  relayBtn.addEventListener('click', () => toggleRelay());
  onRelayToggle(open => relayBtn.classList.toggle('active', open));

  // Brand (moved up from the sidebar) → home; refresh when the company logo changes.
  const brandEl = topbar.querySelector('#topbar-brand');
  if (brandEl) {
    brandEl.addEventListener('click', () => router.navigate('/'));
    const refreshBrand = () => { const el = topbar.querySelector('#topbar-brand'); if (el) el.innerHTML = buildBrandHtml(); };
    window.addEventListener('relay:settings-updated', refreshBrand);
    store.on('settings', refreshBrand);
  }

  // Profile display moved to the sidebar footer (see Sidebar.js). The top bar
  // now only carries search + help/notifications + the Deputy controls
  // (right-most) + the mode toggle.

  // Update on profile details update
  window.addEventListener('relay-profile-updated', () => {
    updateTopbarAccess(topbar);
  });

  updateTopbarAccess(topbar);

  return topbar;
}

export function updateTopbarAccess(topbarEl) {
  const topbar = topbarEl || document.getElementById('topbar');
  if (!topbar) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');

  // Name / role / avatar now render in the sidebar footer
  // (Sidebar.updateSidebarProfile), refreshed via updateSidebarAccess on login
  // and the relay-profile-updated event.
}

function toggleNotificationsDropdown(btn) {
  let dropdown = document.querySelector('#notifications-dropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }

  const notices = (store.getAll('notices') || [])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 40);
  
  dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  dropdown.id = 'notifications-dropdown';
  dropdown.style.cssText = 'position:absolute;top:100%;right:0;margin-top:8px;width:320px;max-height:420px;overflow-y:auto;padding:0;';
  // dark theme handled by [data-theme-mode="dark"] .dropdown-menu in components.css

  const header = document.createElement('div');
  header.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center';
  header.innerHTML = '<h4 style="margin:0;font-size:var(--font-size-md);font-weight:var(--font-weight-semibold);color:var(--text-primary);">Notices</h4>';
  
  const markAllBtn = document.createElement('button');
  markAllBtn.className = 'btn btn-ghost btn-sm';
  markAllBtn.style.cssText = 'font-size:11px;padding:4px 8px;';
  markAllBtn.textContent = 'Mark all as read';
  markAllBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const allNotices = store.getAll('notices') || [];
    let changed = false;
    allNotices.forEach(n => {
      if (!n.read) {
        n.read = true;
        n.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) {
      store.save('notices', allNotices);
    }
    dropdown.remove();
  });
  header.appendChild(markAllBtn);
  dropdown.appendChild(header);

  if (notices.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = 'padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:var(--font-size-sm);display:flex;flex-direction:column;align-items:center;gap:8px;';
    emptyState.innerHTML = `
      <span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary);opacity:0.6;">notifications_off</span>
      <span>No system notices</span>
    `;
    dropdown.appendChild(emptyState);
  } else {
    const listContainer = document.createElement('div');
    listContainer.className = 'notifications-list';
    
    notices.forEach(n => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.style.cssText = `padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${n.read ? 'transparent' : 'var(--color-info-bg)'};display:flex;align-items:flex-start;transition:background 0.2s;`;
      
      item.onmouseenter = () => {
        item.style.background = n.read ? 'var(--content-bg)' : 'rgba(37, 99, 235, 0.12)';
      };
      item.onmouseleave = () => {
        item.style.background = n.read ? 'transparent' : 'var(--color-info-bg)';
      };

      const dotHtml = n.read ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:var(--color-info);margin-top:5px;margin-right:8px;flex-shrink:0;"></span>';
      
      item.innerHTML = `
        ${dotHtml}
        <div style="flex:1">
          <div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:2px;color:var(--text-primary);">${escapeHTML(n.title || 'Notice')}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;line-height:1.4;">${escapeHTML(n.message || '')}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        store.update('notices', n.id, { read: true });
        
        if (n.link) {
          router.navigate(n.link);
        }
        dropdown.remove();
      });
      listContainer.appendChild(item);
    });
    dropdown.appendChild(listContainer);
  }

  btn.parentNode.style.position = 'relative';
  btn.parentNode.appendChild(dropdown);
  
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 0);
}

function showSearchResults(query) {
  hideSearchResults();

  const storeObj = store || window.__relay?.store;
  if (!storeObj) return;

  const results = [];
  const q = query.toLowerCase();

  // Search projects
  (storeObj.getAll('projects') || []).forEach(p => {
    const num = p.number || '';
    const name = p.name || '';
    const custName = p.customerName || '';
    if (num.toLowerCase().includes(q) || name.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Project', label: `${num} — ${name}`, icon: 'folder', path: `/projects/${p.id}` });
    }
  });

  // Search stock
  (storeObj.getAll('stock') || []).forEach(st => {
    const code = st.code || '';
    const name = st.name || '';
    const cat = st.category || '';
    if (code.toLowerCase().includes(q) || name.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
      results.push({ type: 'Stock', label: `${code ? `${code} — ` : ''}${name}`, icon: 'inventory_2', path: `/stock/${st.id}` });
    }
  });

  // Search kits
  (storeObj.getAll('kits') || []).forEach(k => {
    const name = k.name || '';
    const desc = k.description || '';
    if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
      results.push({ type: 'Kit', label: name, icon: 'card_giftcard', path: `/stock` });
    }
  });

  // Search customers / people
  (storeObj.getAll('customers') || []).forEach(c => {
    const company = c.company || '';
    const firstName = c.firstName || '';
    const lastName = c.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (company.toLowerCase().includes(q) || fullName.toLowerCase().includes(q)) {
      results.push({ type: 'Customer', label: company || fullName || 'Unnamed Customer', icon: 'people', path: `/people/${c.id}` });
    }
  });

  // Search jobs
  (storeObj.getAll('jobs') || []).forEach(j => {
    const num = j.number || '';
    const title = j.title || '';
    const custName = j.customerName || '';
    if (num.toLowerCase().includes(q) || title.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Job', label: `${num} — ${title}`, icon: 'build', path: `/jobs/${j.id}` });
    }
  });

  // Search quotes
  (storeObj.getAll('quotes') || []).forEach(qt => {
    const num = qt.number || '';
    const title = qt.title || '';
    const custName = qt.customerName || '';
    if (num.toLowerCase().includes(q) || title.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Quote', label: `${num} — ${custName || title || 'Quote'}`, icon: 'request_quote', path: `/quotes/${qt.id}` });
    }
  });

  // Search invoices
  (storeObj.getAll('invoices') || []).forEach(inv => {
    const num = inv.number || '';
    const custName = inv.customerName || '';
    if (num.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
      results.push({ type: 'Invoice', label: `${num} — ${custName || 'Invoice'}`, icon: 'receipt_long', path: `/invoices/${inv.id}` });
    }
  });

  // Search suppliers
  (storeObj.getAll('suppliers') || []).forEach(sup => {
    const name = sup.name || '';
    const contact = sup.contactName || '';
    if (name.toLowerCase().includes(q) || contact.toLowerCase().includes(q)) {
      results.push({ type: 'Supplier', label: name, icon: 'local_shipping', path: `/suppliers/${sup.id}` });
    }
  });

  // Search purchase orders
  (storeObj.getAll('purchaseOrders') || []).forEach(po => {
    const num = po.number || '';
    const supName = po.supplierName || '';
    if (num.toLowerCase().includes(q) || supName.toLowerCase().includes(q)) {
      results.push({ type: 'PO', label: `${num} — ${supName || 'PO'}`, icon: 'shopping_bag', path: `/purchase-orders/${po.id}` });
    }
  });

  // Search assets
  (storeObj.getAll('assets') || []).forEach(ast => {
    const name = ast.name || '';
    const tag = ast.assetTag || '';
    if (name.toLowerCase().includes(q) || tag.toLowerCase().includes(q)) {
      results.push({ type: 'Asset', label: `${tag ? `${tag} — ` : ''}${name}`, icon: 'precision_manufacturing', path: `/assets/${ast.id}` });
    }
  });

  if (results.length === 0) return;

  const currentLabel = (getListSearchLabel() || '').toLowerCase();
  if (currentLabel) {
    results.sort((a, b) => {
      const aMatchesCurrent = a.type.toLowerCase().includes(currentLabel) || currentLabel.includes(a.type.toLowerCase());
      const bMatchesCurrent = b.type.toLowerCase().includes(currentLabel) || currentLabel.includes(b.type.toLowerCase());
      if (aMatchesCurrent && !bMatchesCurrent) return -1;
      if (!aMatchesCurrent && bMatchesCurrent) return 1;
      return 0;
    });
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  dropdown.id = 'search-results';
  // Surface, radius, shadow and padding come from .dropdown-menu; only the
  // full-width anchoring, scroll cap and stacking order are set here.
  dropdown.style.cssText = 'position:absolute; top:calc(100% + 4px); left:0; right:0; max-height:340px; overflow-y:auto; z-index:1050;';

  results.slice(0, 10).forEach(r => {
    const item = document.createElement('button');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <span class="material-icons-outlined" style="font-size:16px; color:var(--color-primary)">${r.icon}</span>
      <span style="flex:1" class="truncate">${escapeHTML(r.label)}</span>
      <span class="badge badge-neutral" style="font-size:10px; padding:2px 6px">${escapeHTML(r.type)}</span>
    `;
    item.addEventListener('click', () => {
      router.navigate(r.path);
      hideSearchResults();
      const sInput = document.querySelector('#global-search');
      if (sInput) sInput.value = '';
    });
    dropdown.appendChild(item);
  });

  const searchContainer = document.querySelector('.topbar-search');
  if (searchContainer) {
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);
  }
}

function hideSearchResults() {
  const el = document.querySelector('#search-results');
  if (el) el.remove();
}


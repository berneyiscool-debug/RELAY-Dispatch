// ============================================
// RELAY — DEMO MODE PILL
// ============================================
// The standing reminder that this tab is running the demo business, not the
// account the user signed in with — a "Demo mode" pill beside the top-bar
// logo — and the way back out of it, from the pill's menu.

import { store } from '../data/store.js';
import { DEMO_COMPANY_NAME } from '../data/demoDataset.js';
import { resetDemoMode, exitDemoMode } from '../utils/demoSession.js';

export const DEMO_BANNER_ID = 'relay-demo-pill';

function closeMenu() {
  document.getElementById(`${DEMO_BANNER_ID}-menu`)?.remove();
  document.getElementById(`${DEMO_BANNER_ID}-btn`)?.setAttribute('aria-expanded', 'false');
  document.removeEventListener('mousedown', onOutside, true);
  document.removeEventListener('keydown', onKey, true);
}

function onOutside(e) {
  if (!document.getElementById(DEMO_BANNER_ID)?.contains(e.target)) closeMenu();
}

function onKey(e) {
  if (e.key === 'Escape') closeMenu();
}

function openMenu() {
  const wrap = document.getElementById(DEMO_BANNER_ID);
  if (!wrap) return;
  wrap.insertAdjacentHTML('beforeend', `
    <div class="dropdown-menu demo-pill-menu" id="${DEMO_BANNER_ID}-menu" role="menu">
      <div class="demo-pill-menu-text">
        You're exploring <strong>${DEMO_COMPANY_NAME}</strong>, a sample business. Try anything —
        changes last until you reset or leave, and nothing is sent to anyone. Your own data is untouched.
      </div>
      <div class="dropdown-divider"></div>
      <button type="button" class="dropdown-item" data-demo-act="reset" role="menuitem"><span class="material-icons-outlined" style="font-size:16px">restart_alt</span> Reset demo</button>
      <button type="button" class="dropdown-item" data-demo-act="exit" role="menuitem"><span class="material-icons-outlined" style="font-size:16px">logout</span> Exit demo</button>
    </div>
  `);
  document.getElementById(`${DEMO_BANNER_ID}-btn`)?.setAttribute('aria-expanded', 'true');
  wrap.querySelector('[data-demo-act="reset"]').addEventListener('click', () => { closeMenu(); resetDemoMode(); });
  wrap.querySelector('[data-demo-act="exit"]').addEventListener('click', () => { closeMenu(); exitDemoMode(); });
  document.addEventListener('mousedown', onOutside, true);
  document.addEventListener('keydown', onKey, true);
}

export function mountDemoBanner() {
  const brand = document.getElementById('topbar-brand');
  if (!store.demoMode || !brand || document.getElementById(DEMO_BANNER_ID)) return;

  brand.insertAdjacentHTML('afterend', `
    <div class="demo-pill-wrap" id="${DEMO_BANNER_ID}">
      <button type="button" class="demo-pill" id="${DEMO_BANNER_ID}-btn" aria-haspopup="menu" aria-expanded="false"
        title="You're in demo mode — click to reset or exit">
        Demo mode<span class="material-icons-outlined" aria-hidden="true">expand_more</span>
      </button>
    </div>
  `);
  document.getElementById(`${DEMO_BANNER_ID}-btn`).addEventListener('click', () => {
    if (document.getElementById(`${DEMO_BANNER_ID}-menu`)) closeMenu(); else openMenu();
  });
}

export function unmountDemoBanner() {
  closeMenu();
  document.getElementById(DEMO_BANNER_ID)?.remove();
}

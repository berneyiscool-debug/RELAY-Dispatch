// ============================================
// RELAY — DEMO MODE BANNER
// ============================================
// The standing reminder that this tab is running the demo business, not the
// account the user signed in with — and the way back out of it.

import { store } from '../data/store.js';
import { DEMO_COMPANY_NAME } from '../data/demoDataset.js';
import { resetDemoMode, exitDemoMode } from '../utils/demoSession.js';

export const DEMO_BANNER_ID = 'relay-demo-banner';

export function mountDemoBanner() {
  const wrapper = document.querySelector('.main-wrapper');
  if (!store.demoMode || !wrapper || document.getElementById(DEMO_BANNER_ID)) return;

  wrapper.insertAdjacentHTML('afterbegin', `
    <div id="${DEMO_BANNER_ID}" class="demo-banner" role="status">
      <span class="demo-banner-tag">Demo mode</span>
      <span class="demo-banner-text">
        You're exploring <strong>${DEMO_COMPANY_NAME}</strong>, a sample business. Try anything —
        changes last until you reset or leave, and nothing is sent to anyone. Your own data is untouched.
      </span>
      <span class="demo-banner-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="demo-banner-reset">Reset demo</button>
        <button type="button" class="btn btn-primary btn-sm" id="demo-banner-exit">Exit demo</button>
      </span>
    </div>
  `);
  document.getElementById('demo-banner-reset')?.addEventListener('click', resetDemoMode);
  document.getElementById('demo-banner-exit')?.addEventListener('click', exitDemoMode);
}

export function unmountDemoBanner() {
  document.getElementById(DEMO_BANNER_ID)?.remove();
}

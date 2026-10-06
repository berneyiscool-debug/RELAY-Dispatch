// ============================================
// RELAY — TERMS OF SERVICE / PRIVACY POLICY (placeholders)
// ============================================
// The real documents are being drafted separately. These pages exist so the
// signup form's Terms and Privacy links point somewhere real and reviewable —
// swapping the copy in `DOCS` below is the only change needed once the final
// wording is published. Both routes are public: someone still mid-signup must
// be able to read them without an account.

import { router } from '../../router.js';
import { applyTheme } from '../../utils/theme.js';

const DOCS = {
  terms: {
    title: 'Terms of Service',
    icon: 'gavel',
    summary: 'The agreement between you and RELAY covering use of RELAY Dispatch, RELAY Cloud, and the mobile app.',
    sections: [
      ['Status', 'These terms are being finalised and will be published before RELAY Cloud leaves public beta. Continued use of the app is subject to the published version.'],
      ['Your data', 'You own the records you enter. Local profiles are stored on your own device; cloud accounts are stored in your RELAY Cloud workspace.'],
      ['Billing', 'RELAY Cloud is billed per user per month through Stripe. A 14-day free trial is offered without a card, and no charge is made automatically at the end of it.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    icon: 'privacy_tip',
    summary: 'What RELAY collects, why, and the control you have over it.',
    sections: [
      ['Status', 'This policy is being finalised and will be published before RELAY Cloud leaves public beta. Continued use of the app is subject to the published version.'],
      ['What we store', 'Account details (name, email, mobile), your company profile, and the business records you create. Local profiles never leave the device they were created on.'],
      ['Your control', 'You can export your data at any time from Settings. Deleting a local profile erases it from this device; deleting a cloud account removes the workspace and its records.'],
    ],
  },
};

function renderDoc(container, key) {
  const doc = DOCS[key];
  applyTheme(null);

  container.innerHTML = `
    <div class="legal-page" style="max-width:760px;margin:0 auto;padding:32px 20px 64px;">
      <button class="btn btn-secondary" id="legal-back" style="margin-bottom:20px;">
        <span class="material-icons-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px;">arrow_back</span>Back
      </button>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <span class="material-icons-outlined" style="font-size:32px;color:var(--color-accent,#FF5C00);">${doc.icon}</span>
        <h1 style="margin:0;font-size:26px;">${doc.title}</h1>
      </div>
      <p style="color:var(--text-secondary);margin:0 0 24px;">${doc.summary}</p>
      ${doc.sections.map(([heading, body]) => `
        <div class="card" style="margin-bottom:14px;">
          <div class="card-body">
            <h2 style="margin:0 0 8px;font-size:16px;">${heading}</h2>
            <p style="margin:0;color:var(--text-secondary);line-height:1.6;">${body}</p>
          </div>
        </div>
      `).join('')}
    </div>`;

  container.querySelector('#legal-back').addEventListener('click', () => {
    // These links open in a new tab from the signup form, so closing the tab is
    // the right exit. Falling back to login covers a direct visit.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.navigate('/login');
    }
  });
}

export function renderTerms(container) {
  renderDoc(container, 'terms');
}

export function renderPrivacy(container) {
  renderDoc(container, 'privacy');
}

import { router } from '../../router.js';
import { supabase } from '../../utils/supabase.js';
import { escapeHTML } from '../../utils/security.js';
import { setSessionUser } from '../auth/session.js';
import {
  PLAN_CATALOG,
  refreshSubscriptionFor,
  subscriptionActiveFromRow,
  startSubscribeCheckout,
} from '../../utils/subscription.js';
import { renderFinishSetupCard } from '../../components/FinishSetupCard.js';
import {
  clearPendingMigration,
  clearPendingSignup,
  completeCloudMigration,
  fetchProfile,
  readPendingMigration,
  readPendingSignup,
  sessionUserFromProfile,
} from '../../utils/cloudOnboarding.js';

const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1500;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Paywall + cloud-onboarding page (`/#/subscribe`).
 *
 * Every non-portal route is gated on a live subscription (see the route guard in
 * main.js), so a cloud account lands here whenever Stripe has not confirmed one.
 * That covers three situations:
 *
 *   1. a brand-new signup that has not been through Stripe Checkout yet;
 *   2. an abandoned signup — the auth user exists but provisioning the company
 *      was interrupted, so there is no profile row yet (marker present);
 *   3. an existing cloud account with no live subscription, including a legacy
 *      company created before subscriptions were enforced.
 *
 * Stripe returns the browser here with `?billing=success` or `?billing=cancelled`.
 * The success path confirms the webhook landed, clears the onboarding markers and
 * only then hands the user over to the app shell.
 */
export async function renderSubscribe(container) {
  const params = new URLSearchParams((window.location.hash.split('?')[1]) || '');
  const billing = params.get('billing');
  // Stripe returns us the plan they actually paid for, so a retry can never
  // quietly switch a Cloud+ buyer onto Cloud.
  const returnedTier = params.get('tier') === 'cloud_plus' ? 'cloud_plus' : 'cloud';

  container.innerHTML = `
    <div style="max-width:960px;margin:0 auto;padding:32px 20px 64px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
        <span class="material-icons-outlined" style="font-size:34px;color:var(--color-accent,#FF5C00);">cloud_sync</span>
        <h1 style="margin:0;font-size:28px;">Activate your RELAY Cloud account</h1>
      </div>
      <p style="color:var(--text-secondary);margin:0 0 22px;">
        Cloud accounts are billed per active user. Add your payment details to unlock the app.
      </p>
      <div id="subscribe-banner"></div>
      <div id="subscribe-body">
        <div style="display:flex;align-items:center;gap:10px;color:var(--text-secondary);padding:24px 0;">
          <span class="material-icons-outlined">hourglass_top</span><span>Loading your account…</span>
        </div>
      </div>
      <div id="subscribe-footer" style="margin-top:26px;color:var(--text-tertiary);">
        <a href="#" id="subscribe-switch-account">Use a different account</a>
      </div>
    </div>`;

  const bannerEl = container.querySelector('#subscribe-banner');
  const bodyEl = container.querySelector('#subscribe-body');

  container.querySelector('#subscribe-switch-account').addEventListener('click', (e) => {
    e.preventDefault();
    abandonOnboarding();
  });

  if (billing === 'cancelled') {
    bannerEl.innerHTML = infoBanner(
      'Checkout cancelled — nothing was charged. Pick a plan again whenever you are ready.',
    );
  }

  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session || null;
  } catch (err) {
    console.error('Could not read the Supabase session:', err);
  }

  if (!session) {
    renderNoSession(bodyEl, !!readPendingSignup());
    return;
  }

  let profile = null;
  try {
    profile = await fetchProfile(session.user.id);
  } catch (err) {
    console.error('Failed to load the paywall profile:', err);
  }

  if (!profile) {
    // No profile row means provisioning never completed — an abandoned signup,
    // an interrupted RPC, or a signup still waiting on email confirmation. Finish
    // it here whether or not the (tab-scoped) marker survived.
    renderFinishSetup(container, session);
    return;
  }

  if (!profile.company_id) {
    renderMissingProfile(bodyEl, 'Your profile is not attached to a company yet.', session);
    return;
  }

  // A paying account has no business on the paywall — finish onboarding right
  // away so a stale bookmark or a repeated Stripe return doesn't strand anyone.
  if (billing === 'success') {
    const confirmed = await pollForActivation(bodyEl, profile.company_id);
    if (confirmed) await finishOnboarding(bodyEl, profile);
    else renderPendingPayment(bodyEl, profile, returnedTier);
    return;
  }

  if (await hasLiveSubscription(profile.company_id)) {
    await finishOnboarding(bodyEl, profile);
    return;
  }

  renderPlanChooser(bodyEl);
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function renderNoSession(bodyEl, pending) {
  bodyEl.innerHTML = `
    <div class="card" style="max-width:100%;">
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px;">
        <h4 style="margin:0;">${pending ? 'One step left' : 'Sign in to continue'}</h4>
        <p style="margin:0;color:var(--text-secondary);">
          ${pending
            ? 'Your company is set up but the subscription is not active yet. Sign in with the email address you just used and we will take you straight back to payment.'
            : 'Your sign-in session has expired. Sign in again and we will take you straight back to payment.'}
        </p>
        <div>
          <button class="btn btn-primary" id="subscribe-signin">Sign in</button>
        </div>
      </div>
    </div>`;
  bodyEl.querySelector('#subscribe-signin').addEventListener('click', () => router.navigate('/login'));
}

function renderMissingProfile(bodyEl, message, session) {
  bodyEl.innerHTML = `
    <div class="card" style="max-width:100%;">
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px;">
        <h4 style="margin:0;">We could not load your company</h4>
        <p style="margin:0;color:var(--text-secondary);">${escapeHTML(message)}</p>
        <p style="margin:0;color:var(--text-secondary);">Signed in as <strong>${escapeHTML(session?.user?.email || '')}</strong>.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="subscribe-retry">Try again</button>
          <button class="btn btn-secondary" id="subscribe-signout">Sign out</button>
        </div>
      </div>
    </div>`;
  bodyEl.querySelector('#subscribe-retry').addEventListener('click', () => window.location.reload());
  bodyEl.querySelector('#subscribe-signout').addEventListener('click', abandonOnboarding);
}

/**
 * Recovery form for a signup whose company provisioning was interrupted: the
 * Supabase user exists but `create_company_and_admin` never completed, so there
 * is no profile row and there is nothing to bill. The marker written at signup
 * time carries what is needed to finish without registering again. The form
 * itself is shared with `/#/setup` so both paths provision identically.
 */
function renderFinishSetup(container, session) {
  renderFinishSetupCard(container.querySelector('#subscribe-body'), {
    session,
    submitLabel: 'Save & continue to payment',
    // Re-read the page: the company now exists, so this falls through to the
    // subscription check (a fresh company has a live trial → straight in).
    onProvisioned: () => renderSubscribe(container),
  });
}

function renderPlanChooser(bodyEl) {
  const planCard = (tier, recommended) => {
    const plan = PLAN_CATALOG[tier];
    return `
      <div class="card" style="max-width:100%;${recommended ? 'border:2px solid var(--color-accent,#FF5C00);' : ''}">
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:baseline;justify-content:space-between;">
            <h4 style="margin:0;">${escapeHTML(plan.name)}</h4>
            ${recommended ? '<span style="font-weight:700;letter-spacing:.5px;color:var(--color-accent,#FF5C00);">MOST POPULAR</span>' : ''}
          </div>
          <div style="font-weight:700;">$${plan.price}<span style="font-weight:500;color:var(--text-tertiary);"> /user /mo</span></div>
          <div style="color:var(--text-secondary);min-height:32px;">${escapeHTML(plan.tagline)}</div>
          <ul style="margin:0;padding-left:18px;color:var(--text-secondary);line-height:1.7;">
            ${plan.features.map((f) => `<li>${escapeHTML(f)}</li>`).join('')}
          </ul>
          <div style="margin-top:auto;padding-top:8px;">
            <button class="btn ${recommended ? 'btn-primary' : 'btn-secondary'}" data-subscribe-tier="${tier}"
                    style="width:100%;justify-content:center;">Continue to payment</button>
          </div>
        </div>
      </div>`;
  };

  bodyEl.innerHTML = `
    <div id="subscribe-error" style="display:none;background:var(--color-danger-bg,#fee2e2);border-left:4px solid var(--color-danger);
         padding:12px 16px;border-radius:6px;margin-bottom:16px;color:var(--color-danger);"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
      ${planCard('cloud', true)}
      ${planCard('cloud_plus', false)}
    </div>
    <p style="color:var(--text-tertiary);margin:18px 0 0;">
      Payment is handled by Stripe. You are only charged for active users, and you can change or cancel the plan at
      any time from Settings → Billing.
    </p>`;

  const errorEl = bodyEl.querySelector('#subscribe-error');
  const buttons = Array.from(bodyEl.querySelectorAll('[data-subscribe-tier]'));

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      buttons.forEach((b) => { b.disabled = true; });
      errorEl.style.display = 'none';
      btn.textContent = 'Opening Stripe…';
      try {
        await startSubscribeCheckout(btn.dataset.subscribeTier);
      } catch (err) {
        console.error('Could not start the subscription checkout:', err);
        const message = err?.message || 'Could not open Stripe Checkout.';
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        if (/sign in/i.test(message)) {
          setTimeout(() => router.navigate('/login'), 1200);
          return;
        }
        buttons.forEach((b) => { b.disabled = false; });
        btn.textContent = 'Continue to payment';
      }
    });
  });
}

// Polls the company row because Stripe's webhook — not the browser redirect —
// is what records the subscription.
async function pollForActivation(bodyEl, companyId) {
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="card" style="max-width:100%;">
        <div class="card-body" style="display:flex;align-items:center;gap:12px;">
          <span class="material-icons-outlined">hourglass_top</span>
          <div>
            <h4 style="margin:0 0 4px;">Confirming your payment</h4>
            <div style="color:var(--text-secondary);">Stripe has your payment details — waiting for the confirmation
            to reach your account.</div>
          </div>
        </div>
      </div>`;
  }

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    if (attempt > 0) await delay(POLL_INTERVAL_MS);
    const row = await refreshSubscriptionFor(companyId);
    if (subscriptionActiveFromRow(row)) return true;
  }
  return false;
}

function renderPendingPayment(bodyEl, profile, tier = 'cloud') {
  const planName = PLAN_CATALOG[tier]?.name || 'RELAY Cloud';
  bodyEl.innerHTML = `
    <div class="card" style="max-width:100%;">
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px;">
        <h4 style="margin:0;">Payment not confirmed yet</h4>
        <p style="margin:0;color:var(--text-secondary);">
          We have not received confirmation from Stripe yet — it usually arrives within a minute. If you did not
          finish the payment form, start again below.
        </p>
        <div id="pending-error" style="display:none;color:var(--color-danger);"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="pending-recheck">Check again</button>
          <button class="btn btn-secondary" id="pending-retry">Enter payment details again (${escapeHTML(planName)})</button>
          <button class="btn btn-secondary" id="pending-signout">Sign out</button>
        </div>
      </div>
    </div>`;

  const errorEl = bodyEl.querySelector('#pending-error');

  bodyEl.querySelector('#pending-recheck').addEventListener('click', async () => {
    if (await pollForActivation(bodyEl, profile.company_id)) await finishOnboarding(bodyEl, profile);
    else renderPendingPayment(bodyEl, profile, tier);
  });

  bodyEl.querySelector('#pending-retry').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      // A subscription may have landed between the redirect and this click.
      if (await hasLiveSubscription(profile.company_id)) {
        await finishOnboarding(bodyEl, profile);
        return;
      }
      await startSubscribeCheckout(tier);
    } catch (err) {
      console.error('Could not restart the subscription checkout:', err);
      errorEl.textContent = err?.message || 'Could not open Stripe Checkout.';
      errorEl.style.display = 'block';
      e.currentTarget.disabled = false;
    }
  });

  bodyEl.querySelector('#pending-signout').addEventListener('click', abandonOnboarding);
}

// ---------------------------------------------------------------------------
// Hand-off into the app
// ---------------------------------------------------------------------------

async function finishOnboarding(bodyEl, profile) {
  bodyEl.innerHTML = `
    <div class="card" style="max-width:100%;">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;">
        <span class="material-icons-outlined" style="color:var(--color-success,#16a34a);">check_circle</span>
        <div>
          <h4 style="margin:0 0 4px;">Subscription active</h4>
          <div style="color:var(--text-secondary);">Preparing your workspace…</div>
        </div>
      </div>
    </div>`;

  try {
    const migration = readPendingMigration();
    let user;
    if (migration) {
      // A local→cloud upgrade goes to Stripe first and only migrates the local
      // business data on the way back, so a cancelled checkout can never leave a
      // half-migrated account behind.
      user = await completeCloudMigration({
        userId: migration.userId,
        companyId: migration.companyId,
        localAccountId: migration.localAccountId,
        profile,
      });
    } else {
      clearPendingMigration();
      // '#FF5C00' matches the colour the cloud-upgrade path assigns its admin.
      user = sessionUserFromProfile(profile, '#FF5C00');
      setSessionUser(user);
    }
    // Onboarding is over either way, so the "one step left" hint must not outlive
    // it — a surviving signup marker would nag on the next visit to this page.
    clearPendingSignup();

    const { completeLogin } = await import('../login/Login.js');
    await completeLogin(user);
  } catch (err) {
    console.error('Failed to finish cloud onboarding:', err);
    bodyEl.innerHTML = `
      <div class="card" style="max-width:100%;">
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
          <h4 style="margin:0;">Your payment went through, but setup did not finish</h4>
          <div style="color:var(--color-danger);">${escapeHTML(err?.message || 'Unknown error.')}</div>
          <div>
            <button class="btn btn-primary" id="finish-retry">Try again</button>
          </div>
        </div>
      </div>`;
    bodyEl.querySelector('#finish-retry').addEventListener('click', () => window.location.reload());
  }
}

function abandonOnboarding() {
  clearPendingSignup();
  clearPendingMigration();
  try { supabase.auth.signOut(); } catch (_) { /* best effort */ }
  window.dispatchEvent(new Event('relay-logout'));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hasLiveSubscription(companyId) {
  return subscriptionActiveFromRow(await refreshSubscriptionFor(companyId));
}

function infoBanner(text) {
  return `<div style="background:var(--color-info-bg,#eff6ff);border-left:4px solid var(--color-info,#2563eb);
    padding:12px 16px;border-radius:6px;margin-bottom:16px;color:var(--color-info,#2563eb);display:flex;gap:8px;
    align-items:center;"><span class="material-icons-outlined">info</span><span>${escapeHTML(text)}</span></div>`;
}

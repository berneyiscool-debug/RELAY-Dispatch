// ============================================
// RELAY — SMS ACTION PAGE (confirm / opt-out)
// ============================================
// The page a customer lands on after tapping the link in an SMS. Deliberately
// separate from the PIN-gated customer portal (Portal.js) -- no login, no PIN,
// no account creation, satisfying ACMA's requirement that opting out of SMS
// not require any of those. Backed entirely by the relay-sms-portal-action
// edge function (service-role, portal_token verified server-side), since an
// anonymous visitor has no Supabase session to satisfy customers' RLS policy.

import { supabase } from '../../utils/supabase.js';
import { escapeHTML } from '../../utils/security.js';

function shell(inner) {
  return `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; font-family:var(--font-family); background:var(--body-bg);">
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:16px; padding:32px; max-width:420px; width:100%; box-shadow:var(--card-shadow); text-align:center;">
        ${inner}
      </div>
    </div>
  `;
}

function errorState(message) {
  return shell(`
    <span class="material-icons-outlined text-danger" style="font-size:48px;">gpp_maybe</span>
    <h2 style="margin:16px 0 8px 0; font-size:20px; color:var(--text-primary);">Link Not Valid</h2>
    <p style="margin:0; font-size:13px; color:var(--text-secondary); line-height:1.5;">${escapeHTML(message)}</p>
  `);
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return iso; }
}

export async function renderSmsAction(container, params) {
  const token = params.t;
  const jobId = params.j;
  const invoiceId = params.inv;

  if (!token) {
    container.innerHTML = errorState('This link is missing required information. Please contact the business directly.');
    return;
  }

  container.innerHTML = shell(`<p style="color:var(--text-secondary); font-size:13px;">Loading...</p>`);

  const { data, error } = await supabase.functions.invoke('relay-sms-portal-action', {
    body: { token, action: 'lookup', jobId, invoiceId },
  });

  if (error || data?.error) {
    container.innerHTML = errorState(data?.error || 'This link is invalid or has expired. Please contact the business directly.');
    return;
  }

  renderContent(container, token, data);
}

function renderContent(container, token, data) {
  const { companyName, customerFirstName, job, invoice, optedOut } = data;
  const greeting = customerFirstName ? `Hi ${escapeHTML(customerFirstName)},` : '';

  let body = '';
  if (job) {
    if (job.alreadyConfirmed) {
      body = `
        <span class="material-icons-outlined text-success" style="font-size:48px;">check_circle</span>
        <h2 style="margin:16px 0 8px 0; font-size:20px; color:var(--text-primary);">Already Confirmed</h2>
        <p style="margin:0 0 4px 0; font-size:13px; color:var(--text-secondary);">${greeting}</p>
        <p style="margin:0; font-size:13px; color:var(--text-secondary); line-height:1.5;">
          Your ${escapeHTML(job.title || 'job')} on ${escapeHTML(formatDate(job.scheduledDate))} is confirmed. Need to change it? Please call ${escapeHTML(companyName)} directly.
        </p>
      `;
    } else {
      body = `
        <span class="material-icons-outlined" style="font-size:48px; color:var(--color-primary);">event_available</span>
        <h2 style="margin:16px 0 8px 0; font-size:20px; color:var(--text-primary);">Confirm Your Appointment</h2>
        <p style="margin:0 0 4px 0; font-size:13px; color:var(--text-secondary);">${greeting}</p>
        <p style="margin:0 0 20px 0; font-size:14px; color:var(--text-primary); line-height:1.5;">
          ${escapeHTML(job.title || 'Your job')} with <strong>${escapeHTML(companyName)}</strong> is scheduled for
          <strong>${escapeHTML(formatDate(job.scheduledDate))}</strong>.
        </p>
        <button id="btn-sms-confirm" class="btn btn-primary" style="width:100%; margin-bottom:8px;">Confirm Appointment</button>
        <p style="margin:8px 0 0 0; font-size:12px; color:var(--text-secondary);">Need a different time? Please call ${escapeHTML(companyName)} directly.</p>
      `;
    }
  } else if (invoice) {
    body = `
      <span class="material-icons-outlined" style="font-size:48px; color:var(--color-primary);">receipt_long</span>
      <h2 style="margin:16px 0 8px 0; font-size:20px; color:var(--text-primary);">Invoice ${escapeHTML(invoice.number || '')}</h2>
      <p style="margin:0 0 20px 0; font-size:14px; color:var(--text-primary);">
        $${Number(invoice.total || 0).toFixed(2)} due to <strong>${escapeHTML(companyName)}</strong>.
      </p>
      <a href="#/portal/customer?token=${encodeURIComponent(token)}" class="btn btn-primary" style="width:100%; display:block; box-sizing:border-box;">View &amp; Pay Invoice</a>
    `;
  } else {
    body = `
      <span class="material-icons-outlined" style="font-size:48px; color:var(--color-primary);">forum</span>
      <h2 style="margin:16px 0 8px 0; font-size:20px; color:var(--text-primary);">${escapeHTML(companyName)}</h2>
      <p style="margin:0; font-size:13px; color:var(--text-secondary);">${greeting}</p>
    `;
  }

  const optOutSection = optedOut
    ? `<p style="margin:0; font-size:12px; color:var(--text-secondary);">You've opted out of SMS from ${escapeHTML(companyName)}.</p>`
    : `<button id="btn-sms-optout" style="background:none; border:none; color:var(--text-secondary); font-size:12px; text-decoration:underline; cursor:pointer; padding:0;">Stop texts from ${escapeHTML(companyName)}</button>`;

  container.innerHTML = shell(`
    ${body}
    <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border-color);">
      ${optOutSection}
    </div>
  `);

  const confirmBtn = document.getElementById('btn-sms-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Confirming...';
      const { data: confirmData, error } = await supabase.functions.invoke('relay-sms-portal-action', {
        body: { token, action: 'confirm', jobId: data.job.id },
      });
      if (error || confirmData?.error) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Appointment';
        alert(confirmData?.error || 'Something went wrong. Please try again.');
        return;
      }
      renderContent(container, token, { ...data, job: { ...data.job, alreadyConfirmed: true } });
    });
  }

  const optOutBtn = document.getElementById('btn-sms-optout');
  if (optOutBtn) {
    optOutBtn.addEventListener('click', async () => {
      if (!confirm(`Stop receiving SMS from ${companyName}?`)) return;
      optOutBtn.disabled = true;
      optOutBtn.textContent = 'Stopping...';
      const { data: optOutData, error } = await supabase.functions.invoke('relay-sms-portal-action', {
        body: { token, action: 'optout' },
      });
      if (error || optOutData?.error) {
        optOutBtn.disabled = false;
        optOutBtn.textContent = `Stop texts from ${companyName}`;
        alert(optOutData?.error || 'Something went wrong. Please try again.');
        return;
      }
      renderContent(container, token, { ...data, optedOut: true });
    });
  }
}

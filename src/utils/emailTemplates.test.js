import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../data/store.js';
import { invoiceEmail, reminderEmail, receiptEmail, quoteEmail, previewEmail, EMAIL_TEMPLATES } from './emailTemplates.js';

// The customer emails follow the app's light flat system: white header, hairline
// borders, one accent, and every bit of text above the 4.5:1 contrast floor.

function contrast(a, b) {
  const lum = (c) => {
    const n = parseInt(c.slice(1), 16);
    const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// The CTA is the one cell carrying a bgcolor attribute next to a link.
function buttonColours(html) {
  const m = html.match(/<td bgcolor="(#[0-9a-f]{6})"[^>]*>\s*<a [^>]*color:(#[0-9a-f]{6})/i);
  return m ? { bg: m[1], fg: m[2] } : null;
}

const invoice = { number: 'INV-00023', contactName: 'Jane Smith', title: 'Emergency works', total: 1375, dueDate: '2099-01-01' };

describe('emailTemplates', () => {
  const original = store.getSettings;
  const withMailer = (mailer) => { store.getSettings = () => ({ name: 'Acme Electrical', mailer }); };

  beforeEach(() => withMailer({}));
  afterEach(() => { store.getSettings = original; });

  test('every template renders a complete document', () => {
    for (const t of EMAIL_TEMPLATES) {
      const { subject, html } = previewEmail(t.key);
      assert.ok(subject, `${t.key} has a subject`);
      assert.match(html, /^<!doctype html>/);
      assert.match(html, /<\/html>$/);
    }
  });

  test('the header is white by default and the old navy default is not kept', () => {
    assert.match(invoiceEmail(invoice).html, /bgcolor="#ffffff"/);
    withMailer({ branding: { headerBg: '#1E2A3A' } });
    const { html } = invoiceEmail(invoice);
    assert.match(html, /bgcolor="#ffffff"/);
    assert.doesNotMatch(html, /1e2a3a/i);
  });

  test('a dark header the user chose is kept, with white text on it', () => {
    withMailer({ branding: { headerBg: '#0F172A' } });
    const { html } = invoiceEmail(invoice);
    assert.match(html, /bgcolor="#0f172a"/);
    assert.match(html, /color:#ffffff;">Acme Electrical</);
  });

  test('the button label clears 4.5:1 for brand orange and for light accents', () => {
    for (const accent of ['#FF5C00', '#FACC15', '#7C3AED', '#22C55E', '#0891B2']) {
      withMailer({ branding: { accent } });
      const c = buttonColours(invoiceEmail(invoice, { payUrl: 'https://pay.example/x' }).html);
      assert.ok(c, `button rendered for ${accent}`);
      assert.ok(contrast(c.bg, c.fg) >= 4.5, `${accent}: ${c.fg} on ${c.bg} is ${contrast(c.bg, c.fg).toFixed(2)}:1`);
    }
  });

  test('an accent that is not a hex colour falls back instead of reaching the markup', () => {
    withMailer({ branding: { accent: 'red;background:url(x)' } });
    const { html } = invoiceEmail(invoice, { payUrl: 'https://pay.example/x' });
    assert.doesNotMatch(html, /url\(x\)/);
    // Falls back to brand orange, darkened so the white label stays readable.
    assert.ok(contrast(buttonColours(html).bg, '#ffffff') >= 4.5);
  });

  test('document values are escaped', () => {
    const { html } = quoteEmail({ ...invoice, number: 'Q-1', title: '<script>alert(1)</script>' });
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  });

  test('status is stated in words, not just colour', () => {
    assert.match(reminderEmail({ ...invoice, dueDate: '2000-01-01' }).html, />Overdue</);
    assert.match(reminderEmail(invoice).html, />Due soon</);
    assert.match(receiptEmail({ ...invoice, paidDate: '2026-10-20' }).html, />Paid</);
  });
});

/**
 * Company settings, the same records the Settings page edits.
 *
 * Every action here writes through `store.saveSettings`, so a setting changed by
 * brny and one changed by hand are indistinguishable. Fields are grouped by the
 * Settings tab that owns them rather than by one catch-all tool, which keeps each
 * permission check meaningful — tax needs `manage_tax`, the rest `edit_company`.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, num, bool, enumOf, list, objectOf } from './schema.js';
import { invalidInput, permissionDenied } from './errors.js';
import { logActivity, assertCloudOnly } from './context.js';
import { clearSessionUser } from '../pages/auth/session.js';

const MANAGERS = { module: 'Settings', key: 'manage_users' };

function requireAdmin(ctx, what = 'This') {
  if (!ctx.actor || ctx.actor.role !== 'admin') throw permissionDenied('Settings', 'manage_users');
  return what;
}

const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace'];
const THEME_PRESETS = ['relay', 'classic', 'forest', 'electric', 'obsidian', 'terracotta', 'nordic', 'luxury', 'steel', 'ballet', 'custom'];

async function save(patch, description) {
  const settings = store.getSettings();
  const updated = { ...settings, ...patch };
  await store.saveSettings(updated);
  logActivity({ type: 'settings_updated', text: description });
  return store.getSettings();
}

defineAction({
  name: 'get_company_settings',
  title: 'Read company settings',
  description:
    'Read the business settings — company details, tax and labour rates, material markup, portal and email settings, document theme and numbering. Use it before changing anything, and to answer "what is our default labour rate?" or "is GST on?".',
  permission: { module: 'Settings', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: () => 'Company settings read.',
  run: async () => {
    const s = store.getSettings();
    const mailer = s.mailer && typeof s.mailer === 'object' ? s.mailer : {};
    const xero = s.xero && typeof s.xero === 'object' ? s.xero : {};
    return {
      summary: `${s.name || 'Company'} — GST ${s.taxEnabled === false ? 'off' : `${s.taxRate ?? 10}%`}, ${s.laborRates?.length || 0} labour rate(s).`,
      company: {
        name: s.name || '',
        abn: s.abn || '',
        phone: s.phone || '',
        email: s.email || '',
        domain: s.domain || '',
        address: s.address || '',
        website: s.website || '',
        hasCustomLogo: !!s.logo && !String(s.logo).includes('logo-large.png'),
      },
      tax: { enabled: s.taxEnabled !== false, rate: s.taxRate ?? 10, laborRounding: s.laborRounding || 15 },
      laborRates: s.laborRates || [],
      materials: {
        markupPercent: s.markupPercent ?? 20,
        materialMarkup: s.materialMarkup || {},
        materialCategories: s.materialCategories || [],
        supplierCategories: s.supplierCategories || [],
        jobTypes: s.jobTypes || [],
      },
      portals: {
        customerEnabled: s.enableCustomerPortal !== false,
        contractorEnabled: s.enableContractorPortal !== false,
        customerWelcome: s.customerPortalWelcome || '',
        customerPayment: s.customerPortalPayment || '',
      },
      email: {
        fromName: mailer.fromName || '',
        fromAddress: mailer.fromAddress || '',
        replyTo: mailer.replyTo || '',
        signature: mailer.signature || '',
        mode: mailer.mode || 'relay',
        enabledFor: mailer.enabledFor || {},
        reminders: mailer.reminders || {},
      },
      documentTheme: s.documentTheme || {},
      xero: { trackCostCenters: xero.trackCostCenters !== false, trackingCategoryName: xero.trackingCategoryName || '' },
    };
  },
});

defineAction({
  name: 'update_company_details',
  title: 'Update company details',
  description: 'Change the business name, ABN, phone, email, domain, website or address shown on documents and in the app. Only pass the fields that change.',
  permission: { module: 'Settings', key: 'edit_company' },
  inputSchema: objectSchema({
    name: str('Business name.'),
    abn: str('Australian Business Number.'),
    phone: str('Business phone number.'),
    email: str('Business email address.'),
    domain: str('Company domain, e.g. yourcompany.com.au.'),
    website: str('Website address.'),
    address: str('Business address.'),
    logo: str('Data URL for the large logo. Leave out to keep the current one.'),
    logoSmall: str('Data URL for the compact logo.'),
  }),
  summarize: (input, result) => `Updated company details (${result.fields.join(', ')}).`,
  run: async (input) => {
    const fields = Object.keys(input).filter((key) => input[key] != null);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (input.name != null && !String(input.name).trim()) throw invalidInput('The business name cannot be empty.');
    const settings = await save(Object.fromEntries(fields.map((key) => [key, input[key]])), `Company details updated (${fields.join(', ')}).`);
    return { summary: `Updated company details (${fields.join(', ')}).`, fields, company: { name: settings.name, abn: settings.abn, email: settings.email } };
  },
});

defineAction({
  name: 'update_tax_and_rates',
  title: 'Update tax and labour rates',
  description:
    'Turn GST on or off, set the tax rate, set how technician time rounds, or replace the labour rates customers are charged. One rate must be the default.',
  permission: { module: 'Settings', key: 'manage_tax' },
  inputSchema: objectSchema({
    taxEnabled: bool('false to turn GST off.'),
    taxRate: num('GST percent, e.g. 10.'),
    laborRounding: num('Round technician time to this many minutes: 1, 5, 15, 30 or 60.'),
    laborRates: list(
      objectOf(
        {
          name: str('Rate name, e.g. Standard Rate.'),
          rate: num('Hourly charge-out rate, ex GST.'),
          description: str('When the rate applies.'),
          minCallOutFee: num('Minimum labour charge for a visit.'),
          isDefault: bool('true for the rate that prices task estimates.'),
        },
        'A charge-out rate.',
        ['name', 'rate']
      ),
      'Replacement labour rates. The existing list is replaced.'
    ),
  }),
  summarize: (input, result) => result.summary,
  run: async ({ taxEnabled, taxRate, laborRounding, laborRates }) => {
    const patch = {};
    const fields = [];
    if (taxEnabled != null) { patch.taxEnabled = !!taxEnabled; fields.push('GST on/off'); }
    if (taxRate != null) {
      if (!(taxRate >= 0 && taxRate <= 100)) throw invalidInput('The tax rate must be between 0 and 100.');
      patch.taxRate = taxRate;
      fields.push('tax rate');
    }
    if (laborRounding != null) {
      const allowed = [1, 5, 15, 30, 60].map(Number);
      const value = Number(laborRounding);
      if (!allowed.includes(value)) throw invalidInput('Labour rounding must be 1, 5, 15, 30 or 60 minutes.');
      patch.laborRounding = value;
      fields.push('labour rounding');
    }
    if (laborRates != null) {
      if (!laborRates.length) throw invalidInput('Keep at least one labour rate.');
      const chosen = laborRates.findIndex((rate) => rate.isDefault);
      patch.laborRates = laborRates.map((rate, index) => ({
        id: rate.id || `rate_${Date.now().toString(36)}_${index}`,
        name: rate.name,
        rate: Number(rate.rate) || 0,
        description: rate.description || '',
        minCallOutFee: Number(rate.minCallOutFee) || 0,
        isDefault: chosen === -1 ? index === 0 : index === chosen,
      }));
      fields.push('labour rates');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    const settings = await save(patch, `Tax and rates updated (${fields.join(', ')}).`);
    return {
      summary: `Updated ${fields.join(', ')} — GST ${settings.taxEnabled === false ? 'off' : `${settings.taxRate}%`}, ${settings.laborRates.length} rate(s).`,
      fields,
      tax: { enabled: settings.taxEnabled !== false, rate: settings.taxRate },
      laborRates: settings.laborRates,
    };
  },
});

defineAction({
  name: 'update_materials_pricing',
  title: 'Update material pricing',
  description:
    'Change the material markup rules, the cost tiers, or the material, supplier and job type lists used across the app.',
  permission: { module: 'Settings', key: 'edit_company' },
  inputSchema: objectSchema({
    markupPercent: num('Global default material markup percent.'),
    materialMarkup: objectOf(
      {
        defaultPercent: num('Default markup percent.'),
        minMarkupAmount: num('Minimum markup in dollars.'),
        useTiers: bool('Apply the tiered markup.'),
        tiers: list(objectOf({ upTo: num('Cost up to this; leave out for no limit.'), percent: num('Markup percent.') }, 'A markup tier.', ['percent']), 'Tiers, sorted by cost.'),
      },
      'The material markup rules.'
    ),
    materialCategories: list(str('A material category.'), 'Replacement material categories.'),
    supplierCategories: list(str('A supplier category.'), 'Replacement supplier categories.'),
    jobTypes: list(str('A job type.'), 'Replacement job types.'),
  }),
  summarize: (input, result) => `Updated ${result.fields.join(', ')}.`,
  run: async ({ markupPercent, materialMarkup, materialCategories, supplierCategories, jobTypes }) => {
    const patch = {};
    const fields = [];
    if (markupPercent != null) { patch.markupPercent = markupPercent; fields.push('markup'); }
    if (materialMarkup != null) {
      patch.materialMarkup = {
        defaultPercent: Number(materialMarkup.defaultPercent) || 0,
        minMarkupAmount: Number(materialMarkup.minMarkupAmount) || 0,
        useTiers: !!materialMarkup.useTiers,
        tiers: (materialMarkup.tiers || []).map((tier) => ({ upTo: tier.upTo == null ? null : Number(tier.upTo), percent: Number(tier.percent) || 0 })),
      };
      fields.push('markup tiers');
    }
    if (materialCategories != null) { patch.materialCategories = materialCategories.map((c) => String(c).trim()).filter(Boolean); fields.push('material categories'); }
    if (supplierCategories != null) { patch.supplierCategories = supplierCategories.map((c) => String(c).trim()).filter(Boolean); fields.push('supplier categories'); }
    if (jobTypes != null) { patch.jobTypes = jobTypes.map((t) => String(t).trim()).filter(Boolean); fields.push('job types'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await save(patch, `Material and catalogue settings updated (${fields.join(', ')}).`);
    return { summary: `Updated ${fields.join(', ')}.`, fields };
  },
});

defineAction({
  name: 'update_portal_settings',
  title: 'Update portal settings',
  description: 'Turn the customer or contractor portal on or off, and change the customer portal welcome and payment instructions.',
  permission: { module: 'Settings', key: 'edit_company' },
  inputSchema: objectSchema({
    customerEnabled: bool('Enable customer portal links.'),
    contractorEnabled: bool('Enable contractor portal links.'),
    customerWelcome: str('Welcome message on the customer portal.'),
    customerPayment: str('Payment instructions shown to customers.'),
  }),
  summarize: (input, result) => `Updated ${result.fields.join(', ')}.`,
  run: async ({ customerEnabled, contractorEnabled, customerWelcome, customerPayment }) => {
    const patch = {};
    const fields = [];
    if (customerEnabled != null) { patch.enableCustomerPortal = !!customerEnabled; fields.push('customer portal'); }
    if (contractorEnabled != null) { patch.enableContractorPortal = !!contractorEnabled; fields.push('contractor portal'); }
    if (customerWelcome != null) { patch.customerPortalWelcome = customerWelcome; fields.push('welcome message'); }
    if (customerPayment != null) { patch.customerPortalPayment = customerPayment; fields.push('payment instructions'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await save(patch, `Portal settings updated (${fields.join(', ')}).`);
    return { summary: `Updated ${fields.join(', ')}.`, fields };
  },
});

defineAction({
  name: 'update_email_settings',
  title: 'Update email settings',
  description:
    'Change the sender name, reply-to, signature, sending mode, which document types email automatically, and the payment reminder schedule. Cannot verify a domain or send a test — those stay in Settings → Email.',
  permission: { module: 'Settings', key: 'edit_company' },
  inputSchema: objectSchema({
    fromName: str('Sender display name.'),
    fromAddress: str('From address, when using your own domain.'),
    replyTo: str('Reply-to address.'),
    signature: str('Signature added to every email.'),
    mode: enumOf(['relay', 'own-domain'], 'Send through RELAY, or from your own verified domain.'),
    quote: bool('Email quotes.'),
    invoice: bool('Email invoices.'),
    receipt: bool('Email payment receipts.'),
    reminder: bool('Email payment reminders.'),
    portal_invite: bool('Email portal invites.'),
    remindersEnabled: bool('Run the automatic reminder sweep.'),
    beforeDays: num('Days before the due date to remind.'),
    afterDays: num('Days after the due date to remind.'),
  }),
  summarize: (input, result) => `Updated ${result.fields.join(', ')}.`,
  run: async (input) => {
    const settings = store.getSettings();
    const current = settings.mailer && typeof settings.mailer === 'object' ? settings.mailer : {};
    const mailer = { ...current };
    const fields = [];
    ['fromName', 'fromAddress', 'replyTo', 'signature', 'mode'].forEach((key) => {
      if (input[key] != null) { mailer[key] = input[key]; fields.push(key); }
    });
    const enabledFor = { ...(current.enabledFor || {}) };
    ['quote', 'invoice', 'receipt', 'reminder', 'portal_invite'].forEach((key) => {
      if (input[key] != null) { enabledFor[key] = !!input[key]; fields.push(key); }
    });
    if (fields.some((field) => ['quote', 'invoice', 'receipt', 'reminder', 'portal_invite'].includes(field))) mailer.enabledFor = enabledFor;
    const reminders = { ...(current.reminders || {}) };
    if (input.remindersEnabled != null) { reminders.enabled = !!input.remindersEnabled; fields.push('reminders'); }
    if (input.beforeDays != null) { reminders.beforeDays = Number(input.beforeDays) || 0; fields.push('reminder days before'); }
    if (input.afterDays != null) { reminders.afterDays = Number(input.afterDays) || 0; fields.push('reminder days after'); }
    if (reminders.enabled != null || reminders.beforeDays != null || reminders.afterDays != null) mailer.reminders = reminders;
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');

    await save({ mailer }, `Email settings updated (${fields.join(', ')}).`);
    return {
      summary: `Updated ${fields.join(', ')}.`,
      fields,
      email: { fromName: mailer.fromName || '', replyTo: mailer.replyTo || '', mode: mailer.mode || 'relay', enabledFor: mailer.enabledFor || {}, reminders: mailer.reminders || {} },
    };
  },
});

defineAction({
  name: 'update_document_theme',
  title: 'Update document design',
  description:
    'Change the quote and invoice design — theme, colours, font, terms, footer, payment methods, signature block, logo placement and numbering. This is the Document Studio, without the live preview.',
  permission: { module: 'Settings', key: 'edit_company' },
  inputSchema: objectSchema({
    preset: enumOf(THEME_PRESETS, 'Colour preset.'),
    accentColor: str('Accent colour, hex.'),
    headerBg: str('Header background colour, hex.'),
    accentTint: str('Tint colour, hex.'),
    fontFamily: enumOf(FONT_FAMILIES, 'Document font.'),
    invoiceTerms: str('Invoice terms, e.g. payment window.'),
    invoicePaymentTerms: str('Bank details and payment instructions on invoices.'),
    quoteTitle: str('Heading on quotes, e.g. PROPOSAL / QUOTE.'),
    quoteTerms: str('Quote terms.'),
    logoAlignment: enumOf(['left', 'center', 'right'], 'Logo alignment.'),
    logoScale: num('Logo width percentage, 20-100.'),
    hideLogo: bool('Hide the logo on documents.'),
    logoSource: enumOf(['large', 'small'], 'Use the large or compact logo.'),
    paymentStripe: bool('Show the card payment option.'),
    paymentDirectTransfer: bool('Show the bank transfer option.'),
    paymentCash: bool('Show the cash option.'),
    quoteSignature: bool('Include the acceptance signature block on quotes.'),
    hideCompanyName: bool('Hide the company name in the header.'),
    footerNote: str('Footer note on every document.'),
    invoicePrefix: str('Invoice number prefix, e.g. INV-.'),
    invoiceStartingNumber: num('Next invoice number.'),
    quotePrefix: str('Quote number prefix, e.g. Q-.'),
    quoteStartingNumber: num('Next quote number.'),
  }),
  summarize: (input, result) => `Updated document design (${result.fields.join(', ')}).`,
  run: async (input) => {
    const settings = store.getSettings();
    const theme = { ...(settings.documentTheme || {}) };
    const fields = Object.keys(input).filter((key) => input[key] != null);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    fields.forEach((key) => { theme[key] = input[key]; });
    await save({ documentTheme: theme }, `Document design updated (${fields.join(', ')}).`);
    return { summary: `Updated document design (${fields.join(', ')}).`, fields, documentTheme: theme };
  },
});

defineAction({
  name: 'update_xero_defaults',
  title: 'Update Xero defaults',
  description: 'Choose whether invoices are tagged with cost centres in Xero, and which tracking category is used. Connecting or disconnecting Xero stays in Settings.',
  permission: { module: 'Settings', key: 'manage_tax' },
  inputSchema: objectSchema({
    trackCostCenters: bool('Tag invoices with cost centres.'),
    trackingCategoryName: str('Xero tracking category to use. Leave empty for the default.'),
  }),
  summarize: (input, result) => `Updated Xero defaults (${result.fields.join(', ')}).`,
  run: async ({ trackCostCenters, trackingCategoryName }) => {
    const patch = {};
    const fields = [];
    if (trackCostCenters != null) { patch.trackCostCenters = !!trackCostCenters; fields.push('cost centre tagging'); }
    if (trackingCategoryName != null) { patch.trackingCategoryName = trackingCategoryName; fields.push('tracking category'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    const { saveXeroDefaults } = await import('../utils/xero.js');
    const saved = await saveXeroDefaults(patch);
    logActivity({ type: 'settings_updated', text: `Xero defaults updated (${fields.join(', ')}).` });
    return { summary: `Updated Xero defaults (${fields.join(', ')}).`, fields, xero: { trackCostCenters: saved.trackCostCenters !== false, trackingCategoryName: saved.trackingCategoryName || '' } };
  },
});

defineAction({
  name: 'update_email_template',
  title: 'Update an email template',
  description:
    'Change the wording and branding of the emails RELAY sends — quotes, invoices, receipts, reminders, portal invites. Pass the template key and only the text that changes; `clear` resets that template to the shipped wording.',
  permission: { module: 'Settings', key: 'edit_company' },
  inputSchema: objectSchema(
    {
      template: enumOf(['quote', 'invoice', 'receipt', 'reminder', 'portal_invite', 'contractor_invite'], 'Which email.'),
      subject: str('Subject line. Merge variables: {customer} {number} {total} {dueDate} {company}.'),
      intro: str('Opening line under the heading.'),
      note: str('Extra note above the footer.'),
      ctaLabel: str('Button label.'),
      clear: bool('Reset this template to the shipped wording.'),
      accent: str('Button colour, hex.'),
      headerBg: str('Header background colour, hex.'),
      footer: str('Footer line.'),
      useLogo: bool('Show the company logo instead of the company name.'),
    },
    ['template']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const settings = store.getSettings();
    const current = settings.mailer && typeof settings.mailer === 'object' ? settings.mailer : {};
    const templates = JSON.parse(JSON.stringify(current.templates || {}));
    const fields = [];

    if (input.clear) {
      delete templates[input.template];
      fields.push('template reset');
    } else {
      const entry = { ...(templates[input.template] || {}) };
      ['subject', 'intro', 'note', 'ctaLabel'].forEach((key) => {
        if (input[key] != null) { entry[key] = input[key]; fields.push(key); }
      });
      templates[input.template] = entry;
    }

    const branding = { ...(current.branding || {}) };
    ['accent', 'headerBg', 'footer'].forEach((key) => {
      if (input[key] != null) { branding[key] = input[key]; fields.push(`branding ${key}`); }
    });
    if (input.useLogo != null) { branding.useLogo = !!input.useLogo; fields.push('logo'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');

    await save({ mailer: { ...current, branding, templates } }, `Email template ${input.template} updated (${fields.join(', ')}).`);
    return { summary: `Updated the ${input.template} email (${fields.join(', ')}).`, template: input.template, fields };
  },
});

defineAction({
  name: 'export_data_copy',
  title: 'Download a copy of the data',
  description:
    "Download a full JSON copy of the company's records and settings, the same file as Settings → System → Download a Copy of My Data. Needs the app open in a browser.",
  permission: MANAGERS,
  inputSchema: objectSchema({}),
  summarize: (input, result) => result.summary,
  run: async (input, ctx) => {
    requireAdmin(ctx);
    if (typeof document === 'undefined') throw invalidInput('Downloading a copy needs the app open in a browser.');
    const { downloadDataSnapshot } = await import('../utils/dataBackup.js');
    const fileName = downloadDataSnapshot('relay-data-copy');
    logActivity({ type: 'data_exported', text: `Data copy downloaded (${fileName}).` });
    return { summary: `Saved ${fileName} to the browser's downloads.`, file: fileName };
  },
});

defineAction({
  name: 'reset_company_data',
  title: 'Reset company data',
  description:
    'Wipe every business record and start from a clean slate, keeping user types and logins. This is permanent and needs the exact confirmation word RESTORE. Download a copy first with export_data_copy.',
  permission: MANAGERS,
  risky: true,
  inputSchema: objectSchema(
    {
      confirm: str('Type RESTORE to confirm.'),
    },
    ['confirm']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ confirm }, ctx) => {
    requireAdmin(ctx);
    if (String(confirm).trim() !== 'RESTORE') throw invalidInput('Type RESTORE exactly, in capitals, to confirm.');
    if (store.demoMode) throw invalidInput('The demo workspace cannot be reset — it lives in memory only.');
    await store.clearAll();
    store.markSeeded();
    logActivity({ type: 'company_reset', text: 'Company data reset to a blank state.' });
    return { summary: 'Company data wiped. Reload the app to sign in again.', reset: true };
  },
});

defineAction({
  name: 'delete_company_profile',
  title: 'Delete company profile',
  description:
    'Permanently delete the entire company account and all of its data. This cannot be undone and signs everyone out. Needs the exact company name as confirmation. Cloud accounts only.',
  permission: MANAGERS,
  risky: true,
  cloudOnly: true,
  inputSchema: objectSchema(
    {
      confirm: str('Type the exact company name to confirm.'),
    },
    ['confirm']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ confirm }, ctx) => {
    requireAdmin(ctx);
    assertCloudOnly('Deleting a company profile');
    const name = store.getSettings().name || '';
    if (String(confirm).trim() !== name) throw invalidInput(`Type the company name exactly — "${name}" — to confirm.`);
    const { supabase } = await import('../utils/supabase.js');
    const { error } = await supabase.functions.invoke('delete-company', { body: { confirmName: name } });
    if (error) throw invalidInput(error.message || 'The company could not be deleted.');
    logActivity({ type: 'company_deleted', text: `Company profile ${name} deleted.` });
    clearSessionUser();
    return { summary: `Deleted the company profile ${name}. Everyone has been signed out.`, deleted: true };
  },
});

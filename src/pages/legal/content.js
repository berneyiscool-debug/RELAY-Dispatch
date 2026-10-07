// ============================================
// RELAY — LEGAL DOCUMENTS (single source of truth)
// ============================================
// Terms of Service, Privacy Policy, Refund & Cancellation Policy and Acceptable
// Use Policy. Rendered in the app by Legal.js and published as static pages on
// relaydispatch.com.au by scripts/build-legal-pages.mjs — edit the words here
// and both surfaces update together.
//
// Before publishing: fill every [BRACKETED] value in ENTITY below. Nothing else
// in this file should need to change for the entity details.
//
// Markup conventions inside blocks (this content is first-party and trusted):
//   - a string is a paragraph (inline <strong>/<em> allowed)
//   - an array of strings is a bulleted list
//   - { table: [[header...], [row...], ...] } is a table
//   - {{doc:key|Label}} links to another legal document (terms, privacy,
//     refunds, acceptable-use); {{mail:key}} renders a mailto link to an
//     ENTITY email address.

export const ENTITY = {
  legalName: '[COMPANY NAME] Pty Ltd',
  acn: '[ACN]',
  abn: '[ABN]',
  address: '[REGISTERED ADDRESS], NSW [POSTCODE], Australia',
  tradingName: 'RELAY',
  website: 'relaydispatch.com.au',
  emails: {
    support: 'support@relaydispatch.com.au',
    privacy: 'privacy@relaydispatch.com.au',
    security: 'security@relaydispatch.com.au',
    billing: 'billing@relaydispatch.com.au',
  },
  effectiveDate: '[EFFECTIVE DATE]',
  state: 'New South Wales',
};

const who = `${ENTITY.legalName} (ACN ${ENTITY.acn}, ABN ${ENTITY.abn}), trading as ${ENTITY.tradingName}`;

export const DOC_ORDER = ['terms', 'privacy', 'refunds', 'acceptable-use'];

export const DOCS = {
  // ─────────────────────────────────────────────────────────────────────────
  terms: {
    title: 'Terms of Service',
    icon: 'gavel',
    summary: 'The agreement between your business and RELAY covering RELAY Dispatch, RELAY Cloud, RELAY Groundwork and the RELAY website.',
    plain: [
      'Local Mode is free and your records stay on your device.',
      'RELAY Cloud is billed per user per month, plus GST. The 14-day trial needs no card and never converts to a paid plan by itself.',
      'You can cancel any time from Settings. Cancellation takes effect at the end of the period you have paid for.',
      'Your business data belongs to you, and you can export it at any time.',
      'AI features (brny and AI Insights) give suggestions. A person in your business makes the decisions.',
    ],
    sections: [
      {
        id: 'about',
        heading: '1. About these terms',
        blocks: [
          `These Terms of Service ("Terms") are an agreement between ${who} ("RELAY", "we", "us") and the business or person that creates a RELAY account or uses RELAY software ("you").`,
          'They cover the RELAY Dispatch desktop, tablet and web app, RELAY Cloud and Cloud+ subscriptions, the RELAY Groundwork mobile app, the customer and contractor portals, and the RELAY website (together, the "Services").',
          'By creating an account, ticking the acceptance box at signup, or using the Services, you agree to these Terms. If you are accepting on behalf of a business, you confirm you are authorised to bind that business, and "you" means the business.',
          'These Terms include the {{doc:privacy|Privacy Policy}}, the {{doc:refunds|Refund & Cancellation Policy}} and the {{doc:acceptable-use|Acceptable Use Policy}}.',
          'RELAY is built for businesses. You must be at least 18 to create an account.',
        ],
      },
      {
        id: 'services',
        heading: '2. The Services',
        blocks: [
          '<strong>Local Mode.</strong> Local Mode is free and needs no account. It is single-user, and your records are stored on the device you use it on. We do not receive or back up Local Mode data. Keeping backups (for example, regular exports) is your responsibility.',
          '<strong>RELAY Cloud and Cloud+.</strong> Paid, per-user subscriptions that store your workspace on our hosted platform and add multi-user access, sync across devices, the customer and contractor portals, online payments, RELAY Groundwork and the other cloud features described on our pricing page. Cloud+ adds the expanded AI features listed there.',
          '<strong>New features.</strong> Features we release to Cloud plans, such as RELAY Groundwork, are included in your subscription as they become available, unless we tell you before release that a feature carries a separate charge. Some features may be labelled beta. Beta features are provided as they are, may change or be withdrawn, and may be less reliable than the rest of the Services.',
          '<strong>Changes to the Services.</strong> We improve RELAY continuously and may add, change or remove features. If we remove or materially reduce a core feature of a paid plan, we will give you at least 30 days’ notice. You may then cancel and receive a pro-rata refund of any fees you have prepaid for the period after the change.',
        ],
      },
      {
        id: 'accounts',
        heading: '3. Accounts and users',
        blocks: [
          'The person who creates your Cloud workspace is its first administrator. Administrators can invite users, assign roles and permissions, and manage billing.',
          [
            'Each person who signs in to your Cloud workspace needs their own user account and counts as a paid seat. Logins must not be shared.',
            'Keep sign-in details secure and tell us promptly at {{mail:security}} if you suspect unauthorised access.',
            'You are responsible for what happens under your account, including the actions of your users, contractors and anyone you give portal access to.',
            'Account and billing details you give us must be accurate and kept up to date.',
          ],
        ],
      },
      {
        id: 'trial',
        heading: '4. Free trial',
        blocks: [
          'New Cloud workspaces get a 14-day free trial. We do not ask for a card to start a trial, and a trial never turns into a paid subscription automatically. You only pay if you choose a plan and complete checkout.',
          'When a trial ends without a subscription, your workspace becomes read-only. You can still view and export your data, but cannot create or change records. We keep an expired trial workspace for at least 90 days, then may delete it after giving you at least 14 days’ email notice.',
          'We may limit trials to one per business.',
        ],
      },
      {
        id: 'fees',
        heading: '5. Fees, billing and GST',
        blocks: [
          [
            'Subscription fees are charged per user per month, in Australian dollars, at the rates on our pricing page when you subscribe. Prices are shown excluding GST, and GST is added where it applies. We issue a tax invoice for each charge.',
            'Fees are billed monthly in advance through our payment processor, Stripe. Your card details are held by Stripe, not by RELAY.',
            'When you add a user, the extra seat is charged pro-rata for the rest of the billing period. When you remove a user, a pro-rata credit is applied to your next invoice.',
            'We may change our prices by giving you at least 30 days’ notice by email. The new price applies from your next billing period after the notice ends. If you do not accept the change, you can cancel before it takes effect.',
          ],
          '<strong>Failed payments.</strong> If a payment fails we will tell you and retry it. Your team keeps full access for at least 14 days so work in the field is not interrupted. If the amount is still unpaid after that, we may make your workspace read-only until it is paid. We will not delete data for non-payment without first giving you at least 30 days’ notice.',
        ],
      },
      {
        id: 'cancellation',
        heading: '6. Cancellation and refunds',
        blocks: [
          'You can cancel at any time from Settings → Plan & Billing, with no phone call or email needed. Cancellation takes effect at the end of your current billing period and you will not be charged again. Refunds are covered in the {{doc:refunds|Refund & Cancellation Policy}}.',
        ],
      },
      {
        id: 'your-data',
        heading: '7. Your data',
        blocks: [
          '<strong>You own it.</strong> The records, files and content you and your users put into RELAY ("Your Data") remain yours. You give us a non-exclusive licence to host, copy, process and display Your Data only as needed to provide, secure and support the Services, and as described in the {{doc:privacy|Privacy Policy}}.',
          '<strong>Export.</strong> You can export Your Data from Settings at any time, including after cancellation while your workspace is retained.',
          '<strong>Your customers’ information.</strong> Your Data will often include personal information about your customers, staff and contractors. For that information, you decide what is collected and why, and we handle it on your behalf. You are responsible for having a lawful basis to collect it, for giving any notices your customers and staff are entitled to, and for complying with privacy, workplace surveillance and record-keeping laws that apply to your business.',
          '<strong>Aggregated data.</strong> We may use de-identified, aggregated information about how the Services are used (for example, feature usage counts) to operate and improve RELAY. It will not identify you, your users or your customers.',
          '<strong>After you leave.</strong> After a Cloud subscription ends we keep your workspace read-only for at least 90 days so you can export it. After that we may delete it, following at least 14 days’ email notice. Backups are overwritten on their normal cycle. You can ask us to delete your workspace sooner, and an administrator can do so from Settings.',
        ],
      },
      {
        id: 'ai',
        heading: '8. AI features',
        blocks: [
          'RELAY includes AI features, including the brny assistant and AI Insights on reports. To use them, we send the relevant request to a third-party AI model provider. Before a request leaves your device, RELAY replaces customer names, contact details, addresses and similar identifiers with placeholders. The {{doc:privacy|Privacy Policy}} explains this, including which provider we use and where it is located.',
          [
            'AI output can be wrong, incomplete or out of date. Treat it as a suggestion and check it before relying on it.',
            'AI output is not professional, legal, financial, tax, safety or electrical-compliance advice. Do not use it as the sole basis for a decision about safety, compliance with standards such as AS/NZS 3000, or a person’s employment.',
            'Images and documents you attach to an AI request are sent as they are, and redaction cannot be applied to what is inside them. Only attach what you are comfortable sending.',
            'AI features are subject to fair-use limits for each plan, which we may adjust.',
          ],
        ],
      },
      {
        id: 'payments',
        heading: '9. Taking payments from your customers',
        blocks: [
          'If you enable online payments, payments from your customers are processed by Stripe through a connected Stripe account in your name. You must accept Stripe’s Connected Account Agreement, and Stripe’s terms govern that account.',
          [
            'The sale is between you and your customer. RELAY is not a party to it and is not responsible for the goods or services you supply.',
            'You are responsible for your prices, your invoices (including that they meet tax invoice requirements), refunds to your customers, chargebacks and disputes.',
            'Stripe’s processing fees apply. If RELAY charges a platform fee on payments, we will show it to you before you enable payments and give you 30 days’ notice of any change.',
          ],
        ],
      },
      {
        id: 'third-party',
        heading: '10. Third-party services',
        blocks: [
          'Some features rely on third-party services, such as Stripe for payments, Google Maps Platform for maps, addresses and routes, and accounting integrations such as Xero when available. Those services are provided under their own terms. We are not responsible for them, but we choose them carefully and tell you who they are in the {{doc:privacy|Privacy Policy}}.',
        ],
      },
      {
        id: 'acceptable-use',
        heading: '11. Acceptable use',
        blocks: [
          'You must use the Services lawfully and in line with the {{doc:acceptable-use|Acceptable Use Policy}}.',
        ],
      },
      {
        id: 'ip',
        heading: '12. Intellectual property',
        blocks: [
          'RELAY, RELAY Dispatch, RELAY Groundwork, brny, the software, design and documentation are owned by us or our licensors. We grant you a non-exclusive, non-transferable right to use the Services for your business during your subscription (or, for Local Mode, while you use it), in line with these Terms. You must not copy, modify, resell or reverse engineer the Services except where the law allows it.',
          'If you send us feedback or suggestions, we may use them freely. You do not have to send any.',
        ],
      },
      {
        id: 'availability',
        heading: '13. Availability and support',
        blocks: [
          'We aim to keep RELAY Cloud available at all times, but we do not guarantee uninterrupted service. Planned maintenance will be scheduled outside normal Australian business hours where we can, and we will give notice of significant planned downtime. Local Mode and the offline features of the apps keep working without an internet connection.',
          'Support is provided by email at {{mail:support}} on Australian business days.',
        ],
      },
      {
        id: 'acl',
        heading: '14. Australian Consumer Law',
        blocks: [
          'Nothing in these Terms excludes, restricts or modifies any right or remedy, or any guarantee, warranty or other term or condition, that cannot lawfully be excluded under the Australian Consumer Law or other law ("Non-excludable Rights").',
          'Where the law allows us to limit our liability for failing to comply with a consumer guarantee, and the Services are not of a kind ordinarily acquired for personal, domestic or household use, our liability is limited to supplying the Services again or paying the cost of having them supplied again, at our option.',
        ],
      },
      {
        id: 'liability',
        heading: '15. Liability',
        blocks: [
          'Subject to your Non-excludable Rights:',
          [
            'Except as expressly set out in these Terms, the Services are provided without other warranties, including that they will be error-free or meet every requirement of your business.',
            'Neither of us is liable to the other for loss of profit, revenue or business opportunity, or for any indirect or consequential loss.',
            'Each party’s total liability under or in connection with these Terms in any 12-month period is limited to the fees you paid us for the Services in the 12 months before the event giving rise to the claim, or AUD $100 if you have not paid any fees.',
            'These limits do not apply to your obligation to pay fees, to liability for fraud or wilful misconduct, or to liability that cannot lawfully be limited.',
            'Each party’s liability is reduced to the extent the other party, or its personnel, caused or contributed to the loss.',
          ],
        ],
      },
      {
        id: 'indemnity',
        heading: '16. Claims about your content',
        blocks: [
          'You are responsible for, and will compensate us for reasonable losses arising from, claims by third parties that Your Data, or your use of the Services in breach of the {{doc:acceptable-use|Acceptable Use Policy}}, breaches the law or a third party’s rights. This does not apply to the extent the claim was caused by us.',
        ],
      },
      {
        id: 'termination',
        heading: '17. Suspension and termination',
        blocks: [
          [
            'You may stop using the Services and cancel at any time.',
            'We may suspend or end your access if you materially breach these Terms and do not fix the breach within 14 days of our notice. We may act immediately, without that notice period, where needed to stop unlawful activity, a security threat or serious harm to RELAY, other customers or third parties. Where we can, we will tell you why.',
            'We may stop providing the Services to you for any other reason by giving at least 60 days’ notice and refunding any prepaid fees for the period after the end date.',
            'When access ends for any reason, section 7 (Your data) still applies to export and deletion.',
          ],
        ],
      },
      {
        id: 'confidentiality',
        heading: '18. Confidentiality',
        blocks: [
          'Each of us will keep the other’s non-public business information confidential, use it only for the purposes of these Terms, and disclose it only to people who need it for those purposes or where required by law.',
        ],
      },
      {
        id: 'changes',
        heading: '19. Changes to these Terms',
        blocks: [
          'We may update these Terms from time to time. For changes that materially affect you, we will email the administrators of your workspace at least 30 days before the change takes effect. If you do not accept a change, you may cancel before it takes effect and receive a pro-rata refund of any fees prepaid for the period after that date. Minor changes, such as corrections or changes required by law, may take effect when published.',
        ],
      },
      {
        id: 'disputes',
        heading: '20. Disputes and governing law',
        blocks: [
          'If you have a concern, contact us first at {{mail:support}}, and we will try to resolve it within 30 days. If we cannot, either of us may refer the dispute to mediation before starting court proceedings, except where urgent relief is needed.',
          `These Terms are governed by the laws of ${ENTITY.state}, Australia. Each of us submits to the non-exclusive jurisdiction of the courts of ${ENTITY.state} and the Commonwealth courts sitting there.`,
        ],
      },
      {
        id: 'general',
        heading: '21. General',
        blocks: [
          [
            'We send notices by email to your workspace administrators or through the app. Send notices to us at {{mail:support}}.',
            'You may not transfer your account without our consent, which we will not unreasonably withhold. We may transfer these Terms to a successor to our business, and will tell you if we do.',
            'Neither of us is liable for delay or failure caused by events beyond our reasonable control.',
            'If any part of these Terms is invalid or unenforceable, it is read down or severed, and the rest continues to apply.',
            'These Terms are the entire agreement between us about the Services.',
          ],
        ],
      },
      {
        id: 'contact',
        heading: '22. Contact',
        blocks: [
          `${who}<br>${ENTITY.address}<br>{{mail:support}}`,
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  privacy: {
    title: 'Privacy Policy',
    icon: 'privacy_tip',
    summary: 'What personal information RELAY collects, why, who we share it with, and the choices you have.',
    plain: [
      'Local Mode data stays on your device. We never receive it.',
      'RELAY Cloud data is stored in Sydney, Australia.',
      'We do not sell personal information, and we do not use your records for advertising.',
      'Before an AI request is sent to our AI provider, which is located in China, RELAY replaces customer names, contact details and addresses with placeholders.',
      'You can access, correct, export or delete your information.',
    ],
    sections: [
      {
        id: 'scope',
        heading: '1. About this policy',
        blocks: [
          `This policy explains how ${who} ("RELAY", "we", "us") handles personal information. It covers the RELAY website, the RELAY Dispatch app (desktop, tablet and web), RELAY Cloud, RELAY Groundwork and the customer and contractor portals.`,
          'We are bound by the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs), and we follow them in how we handle personal information.',
        ],
      },
      {
        id: 'two-roles',
        heading: '2. Our two roles',
        blocks: [
          '<strong>Information about our own customers.</strong> This includes the business owners, administrators and users who sign up for and use RELAY, and visitors to our website. We decide how that information is handled, and this policy applies to it directly.',
          '<strong>Information our customers store in RELAY.</strong> Trade businesses use RELAY to manage their own customers, sites, staff and contractors. We host and process that information <em>on behalf of</em> the business that uses RELAY. That business decides what it collects and how it uses it, and its own privacy policy applies. If you are a customer of a business that uses RELAY, please contact that business first. We will help them respond to you.',
        ],
      },
      {
        id: 'local-mode',
        heading: '3. Local Mode',
        blocks: [
          'Local Mode needs no account. The records you create in Local Mode are stored only on your device, in the app’s local storage, and are not sent to us. Uninstalling the app or clearing its storage removes them, so keep exports as backups.',
        ],
      },
      {
        id: 'collect',
        heading: '4. What we collect',
        blocks: [
          [
            '<strong>Account details:</strong> your name, email address, mobile number, role, your business name and ABN, and your sign-in credentials. Passwords are stored only as secure hashes by our authentication provider.',
            '<strong>Billing details:</strong> your subscription plan, seat count, billing history and Stripe customer reference. Card numbers are collected and held by Stripe. We never see or store them.',
            '<strong>Workspace data (Cloud):</strong> the records your business keeps in RELAY. This can include customer and site contact details, jobs, quotes, invoices, schedules, timesheets, assets, forms and signatures, notes, photos and files, and staff and contractor details.',
            '<strong>Payments data:</strong> if your business takes payments through RELAY, payment status and references from Stripe, and the details Stripe needs to set up your connected account. Stripe collects identity verification for that account directly.',
            '<strong>Usage and device data:</strong> sign-in times, the app version, device and browser type, IP address, error logs, and usage counts for features with plan limits (such as AI requests).',
            '<strong>Communications:</strong> emails and support requests you send us, and the email delivery records for messages RELAY sends on your behalf.',
          ],
          'We do not track your device’s location. Addresses you enter are converted to map coordinates so jobs can be shown on a map and routed.',
          'We do not intentionally collect sensitive information, such as health information. Avoid storing it in RELAY unless your business genuinely needs it, for example a site safety note.',
        ],
      },
      {
        id: 'how-collect',
        heading: '5. How we collect it',
        blocks: [
          'Mostly directly from you when you sign up, use the app or contact us. Information about your users, customers and contractors is entered by your business. Some information comes from our service providers, for example payment status from Stripe. If you choose not to give us information, we may not be able to provide some or all of the Services.',
        ],
      },
      {
        id: 'use',
        heading: '6. How we use it',
        blocks: [
          [
            'To provide RELAY: running your workspace, syncing devices, sending the emails, quotes, invoices and receipts you ask RELAY to send, and running the portals.',
            'To manage your account and subscription, and to bill you.',
            'To keep RELAY secure, prevent fraud and misuse, and enforce plan limits.',
            'To provide support and tell you about service changes, outages, security issues and billing matters.',
            'To fix problems and improve RELAY, using de-identified and aggregated usage information wherever possible.',
            'To send you product news. You can unsubscribe from these at any time using the link in each email.',
            'To comply with the law, including tax and record-keeping obligations.',
          ],
          'We do not sell personal information. We do not use workspace data for advertising, and we do not use it to train AI models.',
        ],
      },
      {
        id: 'ai',
        heading: '7. AI features and automated decisions',
        blocks: [
          'RELAY’s AI features, the brny assistant and AI Insights, send the relevant request to an AI model provider through our servers. Our current provider is DeepSeek, which is located in the People’s Republic of China.',
          [
            'Before a request leaves your device, RELAY replaces the names, contact details, addresses and similar identifiers of your customers with placeholders such as [[PII_1]]. The real values are put back into the answer on your device, so the AI provider never receives them.',
            'Images and documents you choose to attach to an AI request are sent as they are. Redaction cannot be applied to their contents.',
            'The provider processes requests under its API terms. We do not permit our data to be used to train our own models, and we choose provider settings that minimise retention where they are available.',
            'brny can keep a short "memory" of your preferences to tailor its answers. It is stored on your device, and you can view, clear or turn it off from the brny panel.',
            'AI features are optional. You can use RELAY without them.',
          ],
          '<strong>Automated decisions.</strong> RELAY does not use computer programs to make decisions that significantly affect a person’s rights or interests. AI Insights, including those about technician productivity and timesheets, are summaries and suggestions for a person in your business to review. They are not decisions about anyone’s employment, pay or work. Businesses using these reports must comply with workplace laws that apply to them.',
        ],
      },
      {
        id: 'disclose',
        heading: '8. Who we share it with',
        blocks: [
          'We share personal information only with service providers who help us run RELAY, with your business’s users and portal recipients as your business directs, where you ask us to, or where the law requires or allows it (for example, to a regulator). Our service providers may only use it to provide their service to us.',
          {
            table: [
              ['Provider', 'What for', 'Where'],
              ['Supabase', 'Database, sign-in and file storage for RELAY Cloud', 'Sydney, Australia (some request processing may occur in other regions)'],
              ['Stripe', 'Subscription billing and customer payments', 'Australia and the United States'],
              ['Resend', 'Sending emails, quotes, invoices and receipts', 'United States'],
              ['Google Maps Platform', 'Maps, address lookup and route planning', 'United States'],
              ['DeepSeek', 'AI features (with identifiers redacted, see section 7)', 'People’s Republic of China'],
              ['GitHub Pages', 'Hosting the website and web app files', 'United States'],
            ],
          },
          'If we sell or restructure our business, personal information may be transferred to the new owner, who must handle it in line with this policy.',
        ],
      },
      {
        id: 'overseas',
        heading: '9. Overseas disclosure',
        blocks: [
          'RELAY Cloud workspace data is stored in Australia. As the table above shows, some providers process information in the United States and, for AI requests, China. Before disclosing information overseas, we take reasonable steps to ensure the recipient handles it consistently with the APPs. Those steps include choosing reputable providers, agreeing to their data processing terms, and sending only what each service needs.',
        ],
      },
      {
        id: 'cookies',
        heading: '10. Cookies and local storage',
        blocks: [
          'The app uses your browser’s local storage and IndexedDB to keep you signed in, store Local Mode data, cache Cloud data for offline use and remember your settings. These are essential to how RELAY works. We do not use advertising cookies or third-party analytics trackers. Map views load from Google, which may set its own cookies under Google’s privacy policy.',
        ],
      },
      {
        id: 'security',
        heading: '11. Security',
        blocks: [
          'We protect personal information with encryption in transit and at rest, database row-level security that keeps each business’s data separate, role-based permissions, server-side controls on billing records, and limited staff access. No system is perfectly secure. If a data breach is likely to cause serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) as required by the Notifiable Data Breaches scheme.',
          'To report a security issue, email {{mail:security}}.',
        ],
      },
      {
        id: 'retention',
        heading: '12. How long we keep it',
        blocks: [
          'We keep account and workspace information while your account is active. After a subscription or trial ends, we keep the workspace for at least 90 days so you can export it, then delete it after notice, as set out in the {{doc:terms|Terms of Service}}. We keep billing and tax records for as long as Australian tax law requires, generally 5 years. Backups are overwritten on their normal cycle.',
        ],
      },
      {
        id: 'access',
        heading: '13. Access, correction and deletion',
        blocks: [
          'You can view and update most of your information in the app, and export your workspace from Settings. To request access to or correction of other personal information we hold about you, or deletion of it, email {{mail:privacy}}. We will respond within 30 days. We may need to verify your identity first, and we will tell you if a legal reason prevents us from doing what you ask.',
          'If the information is held in a business’s RELAY workspace, we will pass your request to that business, or help it respond.',
        ],
      },
      {
        id: 'complaints',
        heading: '14. Complaints',
        blocks: [
          'If you have a concern about how we have handled your personal information, email {{mail:privacy}}. We will acknowledge your complaint within 7 days and aim to resolve it within 30 days. If you are not satisfied, you can contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener">oaic.gov.au</a> or on 1300 363 992.',
        ],
      },
      {
        id: 'children',
        heading: '15. Children',
        blocks: [
          'RELAY is for businesses and is not directed at children. Accounts are for people aged 18 and over.',
        ],
      },
      {
        id: 'changes',
        heading: '16. Changes to this policy',
        blocks: [
          'We will update this policy as RELAY and the law change, and show the date of the latest version at the top. We will email workspace administrators about material changes before they take effect.',
        ],
      },
      {
        id: 'contact',
        heading: '17. Contact our Privacy Officer',
        blocks: [
          `Privacy Officer, ${ENTITY.legalName}<br>${ENTITY.address}<br>{{mail:privacy}}`,
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  refunds: {
    title: 'Refund & Cancellation Policy',
    icon: 'receipt_long',
    summary: 'How to cancel RELAY Cloud, what happens to your data, and when you get money back.',
    plain: [
      'The trial is free and needs no card.',
      'You can cancel any time, in a couple of clicks, without contacting us.',
      'Cancellation takes effect at the end of the month you have paid for.',
      'Removing users earns a pro-rata credit.',
      'If we get it wrong, we refund you.',
    ],
    sections: [
      {
        id: 'trial',
        heading: '1. Free trial',
        blocks: [
          'The 14-day RELAY Cloud trial is free, and we do not take a card to start it. When it ends, you are not charged. Your workspace becomes read-only until you choose a plan.',
        ],
      },
      {
        id: 'cancel',
        heading: '2. How to cancel',
        blocks: [
          'An administrator can cancel at any time from <strong>Settings → Plan & Billing → Manage billing & invoices</strong>. You do not need to call or email us. You can also email {{mail:billing}} and we will cancel for you.',
          [
            'Cancellation takes effect at the end of your current monthly billing period. Your team keeps full access until then, and you will not be charged again.',
            'You can change your mind and resubscribe before the period ends without losing anything.',
            'After the period ends, your workspace becomes read-only for at least 90 days so you can export everything. We email you at least 14 days before deleting it.',
            'Local Mode is free and is not affected by cancellation.',
          ],
        ],
      },
      {
        id: 'changes',
        heading: '3. Changing plans and seats',
        blocks: [
          [
            '<strong>Adding users</strong> is charged pro-rata for the rest of the billing period.',
            '<strong>Removing users</strong> gives a pro-rata credit on your next invoice.',
            '<strong>Upgrading</strong> from Cloud to Cloud+ takes effect immediately, charged pro-rata.',
            '<strong>Downgrading</strong> from Cloud+ to Cloud applies a pro-rata credit to your next invoice.',
          ],
        ],
      },
      {
        id: 'refunds',
        heading: '4. When we refund',
        blocks: [
          'Because you can cancel at any time and are billed monthly, we do not refund part-months when you cancel. We <strong>will</strong> refund you:',
          [
            'if you were charged in error, charged twice, or charged after cancelling;',
            'if we end your access for a reason other than your breach of the Terms, or materially reduce a core feature, or make a change to the Terms that you do not accept and you cancel as a result (a pro-rata refund of prepaid fees);',
            'where you are entitled to a refund under the Australian Consumer Law, for example after a major failure of the Services.',
          ],
          'To request a refund, email {{mail:billing}} with your business name and the charge date. Approved refunds are returned to the original payment method, usually within 5 to 10 business days.',
        ],
      },
      {
        id: 'acl',
        heading: '5. Your rights under the Australian Consumer Law',
        blocks: [
          'Our services come with guarantees that cannot be excluded under the Australian Consumer Law. Nothing in this policy limits those rights.',
        ],
      },
      {
        id: 'your-customers',
        heading: '6. Payments your customers make to you',
        blocks: [
          'Refunds for invoices your customers pay through RELAY are a matter between you and your customer. You can issue them through your Stripe account.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    icon: 'rule',
    summary: 'The rules for using RELAY fairly, safely and lawfully.',
    plain: [
      'Use RELAY to run your business lawfully.',
      'Do not spam people or attack the platform.',
      'Give each person their own login.',
      'Respect the privacy of your customers and staff.',
    ],
    sections: [
      {
        id: 'intro',
        heading: '1. Purpose',
        blocks: [
          'This policy forms part of the {{doc:terms|Terms of Service}}. It applies to everyone who uses RELAY, including users, contractors and portal recipients that your business invites.',
        ],
      },
      {
        id: 'dont',
        heading: '2. You must not',
        blocks: [
          [
            'use RELAY for anything unlawful, fraudulent or misleading, including issuing false invoices or quotes;',
            'send unsolicited commercial messages through RELAY, or send them without the consent, sender identification and unsubscribe option required by the <em>Spam Act 2003</em> (Cth);',
            'upload content that infringes someone else’s rights, or that is defamatory, harassing, discriminatory or offensive;',
            'collect or use personal information in RELAY in breach of privacy law, or monitor staff or contractors in breach of workplace surveillance laws, such as the <em>Workplace Surveillance Act 2005</em> (NSW);',
            'upload malware, or interfere with or disrupt RELAY or other customers’ use of it;',
            'try to access another business’s data, bypass permissions or plan limits, or probe, scan or test RELAY’s security without our written permission;',
            'share logins, or let more people use a workspace than you have paid seats for;',
            'scrape, copy, resell or sublicense RELAY, or reverse engineer it except where the law allows;',
            'use AI features to generate unlawful or harmful content, or deliberately work around their usage limits or safeguards;',
            'store information you do not need, especially sensitive information such as health details or identity documents.',
          ],
        ],
      },
      {
        id: 'security',
        heading: '3. Reporting security issues',
        blocks: [
          'If you find a security vulnerability, please report it to {{mail:security}} and give us reasonable time to fix it before disclosing it. We will not take action against good-faith research that respects this policy and avoids accessing other customers’ data.',
        ],
      },
      {
        id: 'enforcement',
        heading: '4. What happens if this policy is breached',
        blocks: [
          'We may remove content, limit features, or suspend or end access as set out in the {{doc:terms|Terms of Service}}. We may also report unlawful activity to the authorities. Where we can, we will warn you and give you a chance to fix the problem first.',
        ],
      },
      {
        id: 'report',
        heading: '5. Reporting misuse',
        blocks: [
          'If you believe someone is misusing RELAY, including sending you messages you did not agree to receive, email {{mail:support}}.',
        ],
      },
    ],
  },
};

// ── Rendering helpers shared by the app and the static page builder ──────────

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Expand {{doc:key|Label}} and {{mail:key}} tokens.
 * @param {string} text
 * @param {(key: string) => string} docHref  where a legal document lives on this surface
 */
export function expandTokens(text, docHref) {
  return text
    .replace(/\{\{doc:([a-z-]+)\|([^}]+)\}\}/g, (_, key, label) => `<a href="${docHref(key)}">${label}</a>`)
    .replace(/\{\{mail:([a-z]+)\}\}/g, (_, key) => {
      const addr = ENTITY.emails[key] || ENTITY.emails.support;
      return `<a href="mailto:${addr}">${addr}</a>`;
    });
}

/** Render one section's blocks to HTML. */
export function renderBlocks(blocks, docHref) {
  return blocks.map((b) => {
    if (typeof b === 'string') return `<p>${expandTokens(b, docHref)}</p>`;
    if (Array.isArray(b)) return `<ul>${b.map((li) => `<li>${expandTokens(li, docHref)}</li>`).join('')}</ul>`;
    if (b && b.table) {
      const [head, ...rows] = b.table;
      return `<div class="legal-table-wrap"><table class="legal-table"><thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`
        + `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    return '';
  }).join('');
}

/** Every [BRACKETED] placeholder still left in the documents — empty when ready to publish. */
export function unfilledPlaceholders() {
  const found = new Set();
  const scan = (v) => {
    if (typeof v === 'string') (v.match(/\[[A-Z][A-Z ]+\]/g) || []).forEach((m) => found.add(m));
    else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === 'object') Object.values(v).forEach(scan);
  };
  scan(ENTITY);
  scan(DOCS);
  return [...found];
}

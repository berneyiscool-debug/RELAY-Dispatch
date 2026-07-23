// ============================================
// RELAY — v1.3 FEATURE FLAGS
// ============================================
// In-development v1.3 features are ON in dev builds so they're fully testable in
// the app (the Vite dev server — both `npm run dev` and `electron:dev` — sets
// import.meta.env.DEV === true). PACKAGED releases (`electron:build`) are DEV=false,
// so the features stay dark there unless a device explicitly opts in, meaning a
// 1.2.x bugfix release still can't leak half-built work to installed clients.
//
// To preview a feature inside a production build, opt in per device with e.g.:
//   localStorage.setItem('relay_beta_payments', '1'); location.reload();
// When a feature is release-ready for v1.3.0, promote it to `true` (like maps).

let IS_DEV = false;
try { IS_DEV = !!import.meta.env.DEV; } catch { IS_DEV = false; }

const on = (key) => {
  if (IS_DEV) return true;                        // testable in every dev/preview run
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};

export const FLAGS = {
  maps:     true,                      // shipped — on for everyone, all builds
  weather:  on('relay_beta_weather'),  // live forecasts + warnings
  payments: on('relay_beta_payments'), // Stripe pay-online
  email:    on('relay_beta_email'),    // email sending + domain settings
  sms:      on('relay_beta_sms'),      // SMS confirmations
};

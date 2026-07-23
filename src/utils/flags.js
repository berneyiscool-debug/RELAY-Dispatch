// ============================================
// RELAY — v1.3 FEATURE FLAGS
// ============================================
// You develop/test in the dev env (vite dev server → import.meta.env.DEV === true),
// so in-development v1.3 features are ON there — fully testable, no setup. The
// packaged electron build (the finished customer product, DEV === false) stays
// DARK, so a 1.2.x patch release never ships half-built v1.3 work. A packaged
// build can still opt a device in for a demo:
//   localStorage.setItem('relay_beta_payments', '1'); location.reload();
// When a feature is release-ready for v1.3.0, promote it to `true` (like maps).

let IS_DEV = false;
try { IS_DEV = !!import.meta.env.DEV; } catch { IS_DEV = false; }

const on = (key) => {
  if (IS_DEV) return true;                          // on in your dev/test env
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};

export const FLAGS = {
  maps:     true,                      // shipped — on for everyone, all builds
  weather:  on('relay_beta_weather'),  // live forecasts + warnings
  payments: on('relay_beta_payments'), // Stripe pay-online
  email:    on('relay_beta_email'),    // email sending + domain settings
  sms:      on('relay_beta_sms'),      // SMS confirmations
};

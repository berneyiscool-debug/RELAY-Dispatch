// ============================================
// RELAY — v1.3 FEATURE FLAGS
// ============================================
// Unfinished v1.3 features are built "dark" on main: no visible entry points
// until the flag flips, so 1.2.x bugfix releases never leak half-built work
// to installed clients. Flip locally for development/preview with e.g.:
//   localStorage.setItem('relay_beta_maps', '1'); location.reload();
// When a feature completes for the v1.3.0 release, change its default to true
// and remove the localStorage escape hatch.

const on = (key) => {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};

export const FLAGS = {
  maps:     true,                      // always enable maps widget for all users
  weather:  on('relay_beta_weather'),  // live forecasts + warnings
  payments: on('relay_beta_payments'), // Stripe pay-online
  email:    on('relay_beta_email'),    // email sending + domain settings
  sms:      on('relay_beta_sms'),      // SMS confirmations
};

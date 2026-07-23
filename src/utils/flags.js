// ============================================
// RELAY — v1.3 FEATURE FLAGS
// ============================================
// Feature visibility is driven by BUILD MODE so in-development v1.3 work is fully
// testable in the app you run, without leaking to customers:
//   • Dev server (npm run dev / electron:dev)      → MODE 'development' → ON
//   • Your test builds (electron:build)            → MODE 'production'  → ON
//   • Customer patch build (electron:build:stable) → MODE 'stable'      → DARK
// Only a `--mode stable` build hides the features; every build you test in shows
// them. In a stable build a device can still opt in with e.g.:
//   localStorage.setItem('relay_beta_payments', '1'); location.reload();
// When a feature is release-ready for v1.3.0, promote it to `true` (like maps).

let VISIBLE = true;
try { VISIBLE = import.meta.env.MODE !== 'stable'; } catch { VISIBLE = true; }

const on = (key) => {
  if (VISIBLE) return true;                        // on in dev + normal builds
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};

export const FLAGS = {
  maps:     true,                      // shipped — on for everyone, all builds
  weather:  on('relay_beta_weather'),  // live forecasts + warnings
  payments: on('relay_beta_payments'), // Stripe pay-online
  email:    on('relay_beta_email'),    // email sending + domain settings
  sms:      on('relay_beta_sms'),      // SMS confirmations
};

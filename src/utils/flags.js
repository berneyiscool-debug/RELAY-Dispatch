// ============================================
// RELAY — v1.3 FEATURE FLAGS
// ============================================
// You develop/test in the dev env (vite dev server → import.meta.env.DEV === true),
// so in-development v1.3 features are ON there — fully testable, no setup. Anything
// still using on() stays DARK in real builds (packaged electron + the GitHub Pages
// deploy, DEV === false), so a release never ships half-built work. A dark feature
// can still be opted in per-device for a demo:
//   localStorage.setItem('relay_beta_sms', '1'); location.reload();
// When a feature is release-ready, promote it to `true` (like maps).

let IS_DEV = false;
try { IS_DEV = !!import.meta.env.DEV; } catch { IS_DEV = false; }

const on = (key) => {
  if (IS_DEV) return true;                          // on in your dev/test env
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};

export const FLAGS = {
  maps:     true,                 // shipped — on for everyone, all builds
  weather:  true,                 // shipped — Open-Meteo forecasts, no setup needed
  payments: true,                 // shipped — reveals Settings → Payments. Customer-facing
                                  //   Pay buttons stay hidden until an admin ticks
                                  //   "Payments configured & live" there, so turning this
                                  //   on can't surface a broken Pay Now (see payments.js).
  email:    true,                 // shipped — sends via RELAY's shared domain, zero setup
  sms:      on('relay_beta_sms'), // NOT on main: the SMS build (edge functions, client
                                  //   modules, migrations) is still unmerged on branch
                                  //   claude/service-cost-per-user-c44ca1. Nothing reads
                                  //   this flag yet, so it stays dark until that lands.
};

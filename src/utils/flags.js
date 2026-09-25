// ============================================
// RELAY — v1.3 FEATURE FLAGS
// ============================================
// You develop/test in the dev env (vite dev server → import.meta.env.DEV === true),
// so in-development features are ON there — fully testable, no setup. A flag that is
// still being built stays DARK in real builds (packaged electron + the GitHub Pages
// deploy, DEV === false), so a release never ships half-built work. When a feature is
// release-ready, promote it to `true` (like maps).

export const FLAGS = {
  maps:     true,                 // shipped — on for everyone, all builds
  weather:  true,                 // shipped — Open-Meteo forecasts, no setup needed
  payments: true,                 // shipped — reveals Settings → Payments. Customer-facing
                                  //   Pay buttons stay hidden until an admin ticks
                                  //   "Payments configured & live" there, so turning this
                                  //   on can't surface a broken Pay Now (see payments.js).
  email:    true,                 // shipped — sends via RELAY's shared domain, zero setup
};

/**
 * Homepage behaviour.
 *
 * 1. Keeps `--header-h` in step with the real sticky header, which wraps onto
 *    several rows below 900px. In-page anchors clear it via `scroll-margin-top`,
 *    so a stale value drops the target behind the header.
 * 2. The download buttons must point at whichever release currently carries a
 *    Windows installer, so they reuse `src/utils/desktopApp.js` — copied next to
 *    this file at build time, one source of truth with the app. When it is not
 *    there (opening the folder directly, or a failed fetch) the anchors keep the
 *    release-page href that is already in the markup.
 */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');

  if (header) {
    var root = document.documentElement;

    var syncHeaderHeight = function () {
      root.style.setProperty('--header-h', header.offsetHeight + 'px');
    };

    syncHeaderHeight();

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(syncHeaderHeight).observe(header);
    } else {
      window.addEventListener('resize', syncHeaderHeight);
    }

    if (document.fonts && document.fonts.ready) {
      // Inter can arrive after first paint and change how the header wraps.
      document.fonts.ready.then(syncHeaderHeight);
    }
  }
})();

(function () {
  'use strict';

  var anchors = document.querySelectorAll('[data-installer]');

  if (!anchors.length) {
    return;
  }

  var script = document.currentScript;
  var moduleUrl = script && script.src
    ? new URL('../desktopApp.js', script.src).href
    : 'assets/desktopApp.js';

  import(moduleUrl)
    .then(function (desktopApp) {
      if (!desktopApp || typeof desktopApp.bindInstallerDownload !== 'function') {
        return;
      }

      for (var i = 0; i < anchors.length; i++) {
        var anchor = anchors[i];
        var label = anchor.querySelector('[data-installer-label]');
        desktopApp.bindInstallerDownload(anchor, label);
      }
    })
    .catch(function () {
      // Anchors keep their static releases-page href.
    });
})();

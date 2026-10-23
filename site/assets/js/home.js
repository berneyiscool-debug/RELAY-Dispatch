/**
 * Homepage behaviour.
 *
 * 1. Keeps `--header-h` in step with the real sticky header, which wraps onto
 *    several rows below 900px. In-page anchors clear it via `scroll-margin-top`,
 *    so a stale value drops the target behind the header.
 * 2. Off Windows, the "use it in your browser" button leads each CTA pair.
 * 3. The download buttons must point at whichever release currently carries a
 *    Windows installer, so they reuse `src/utils/desktopApp.js` — copied next to
 *    this file at build time, one source of truth with the app. When it is not
 *    there (opening the folder directly, or a failed fetch) the anchors keep the
 *    release-page href that is already in the markup.
 * 4. Adds the scrolled shadow to the sticky header.
 * 5. Closes the phone menu (<details>) after a link is followed.
 * 6. On feature pages, marks the jump-bar chip for the section in view.
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
      // The web font can arrive after first paint and change how the header wraps.
      document.fonts.ready.then(syncHeaderHeight);
    }

    // The header sits flush on the page at the top. Once content slides under
    // it, a deeper shadow makes it read as a layer rather than a stray rule.
    var syncHeaderShadow = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };

    syncHeaderShadow();
    window.addEventListener('scroll', syncHeaderShadow, { passive: true });
  }
})();

/**
 * The phone menu is a native <details>, so it needs no JavaScript to open.
 * This only closes it again once a link is followed — otherwise the panel stays
 * over the section the anchor just jumped to.
 */
(function () {
  'use strict';

  var menu = document.querySelector('.nav-mobile');

  if (!menu) {
    return;
  }

  menu.addEventListener('click', function (event) {
    var target = event.target;

    if (target && target.closest && target.closest('a')) {
      menu.open = false;
    }
  });
})();

(function () {
  'use strict';

  // The installer is Windows-only, so everywhere else (phones, Macs) the
  // browser option leads. Each pair swaps whole class lists, which keeps the
  // AA-safe large primary style on whichever button is first.
  var ua = navigator.userAgentData;
  var isWindows = ua && ua.platform
    ? ua.platform === 'Windows'
    : /Windows/.test(navigator.userAgent);

  if (isWindows) {
    return;
  }

  var pairs = document.querySelectorAll('[data-platform-pair]');

  for (var i = 0; i < pairs.length; i++) {
    var installer = pairs[i].querySelector('[data-download]');
    var browser = pairs[i].querySelector('[data-browser]');

    if (!installer || !browser) {
      continue;
    }

    var installerClass = installer.className;
    installer.className = browser.className;
    browser.className = installerClass;
    pairs[i].insertBefore(browser, installer);
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

/**
 * "Shipped recently" carousel: the arrows step the track by one card. Each
 * arrow disables itself at the end it cannot go past. Swipe and the arrow keys
 * also work, because the track is a native scroll container.
 */
(function () {
  'use strict';

  var track = document.getElementById('shipped-track');
  var prev = document.querySelector('[data-shipped-prev]');
  var next = document.querySelector('[data-shipped-next]');

  if (!track || !prev || !next) {
    return;
  }

  var step = function (direction) {
    var card = track.querySelector('.card');
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var distance = card ? card.offsetWidth + gap : track.clientWidth;
    track.scrollBy({ left: direction * distance });
  };

  var sync = function () {
    var max = track.scrollWidth - track.clientWidth;
    // The track has 4px of padding, so the ends sit a few pixels off zero.
    var atStart = track.scrollLeft <= 8;
    var atEnd = track.scrollLeft >= max - 8;
    prev.disabled = atStart;
    next.disabled = atEnd;
    // Drives the edge fade in site.css: only fade an edge that still has cards
    // behind it.
    track.classList.toggle('is-at-start', atStart);
    track.classList.toggle('is-at-end', atEnd);
  };

  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
})();

/**
 * Feature pages: keep the jump bar honest. The chip for the section being read
 * takes aria-current="location", so on a seven-tab page you can tell where you
 * are without scrolling back to the top.
 */
(function () {
  'use strict';

  var jump = document.querySelector('.feature-jump');

  if (!jump || typeof IntersectionObserver !== 'function') {
    return;
  }

  var links = Array.prototype.slice.call(jump.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    })
    .filter(Boolean);

  if (!sections.length) {
    return;
  }

  var current = null;

  var mark = function (id) {
    if (id === current) {
      return;
    }

    current = id;

    links.forEach(function (link) {
      if (link.getAttribute('href') === '#' + id) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  // The observer only decides *when* to look. The section being read is the
  // last one whose top has passed the upper third of the viewport, which stays
  // correct when a fast scroll reports several sections at once.
  var observer = new IntersectionObserver(function () {
    var best = null;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= window.innerHeight * 0.4) {
        best = sections[i];
      }
    }

    mark((best || sections[0]).id);
  }, { rootMargin: '-20% 0px -55% 0px' });

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
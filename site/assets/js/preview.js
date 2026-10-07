/**
 * Interactive app preview for the marketing homepage.
 *
 * The screenshots shipped with the site are 16 sprite atlases, each a vertical
 * strip of 1440x900 app screens. `screens.json` maps a screen key to
 * [atlasIndex, tileIndex, tilesPerAtlas, label, hotspots[]] where each hotspot
 * is [left%, top%, width%, height%, targetScreenKey, ariaLabel].
 *
 * Only the navigation screens are fetched up front, from `screens-index.json`.
 * They all live in atlas 0 (the dashboard, the schedule and every list), which
 * is warmed in the background once the page has loaded. `screens.json` and the
 * atlases that hold record details are fetched the first time a visitor
 * reaches for a record, so the page never pulls the whole ~7 MB.
 */
(function () {
  'use strict';

  var INITIAL_SCREEN = 'dashboard';
  var SCREENS_INDEX_URL = 'assets/preview/screens-index.json';
  var SCREENS_URL = 'assets/preview/screens.json';
  var TILE_WIDTH = 1440;
  var TILE_HEIGHT = 900;

  var root = document.getElementById('app-preview');
  var frame = document.getElementById('preview-frame');
  var shot = document.getElementById('preview-shot');
  var status = document.getElementById('preview-status');

  if (!root || !frame || !shot) {
    return;
  }

  var screens = null;
  var currentKey = null;
  // -1 because the markup already paints the hero shot, which is tile 0 of
  // atlas 0. Nothing has been loaded through this module yet.
  var currentAtlas = -1;
  var loadedAtlases = {};
  var atlasPromises = {};
  var fullScreensPromise = null;

  function atlasUrl(index) {
    return 'assets/preview/atlas-' + (index < 10 ? '0' + index : index) + '.webp';
  }

  function setBusy(state) {
    root.dataset.busy = state ? 'true' : 'false';
  }

  /** Fetches the record-detail screens that the index leaves out. */
  function loadFullScreens() {
    if (fullScreensPromise) {
      return fullScreensPromise;
    }

    fullScreensPromise = fetch(SCREENS_URL, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        for (var key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            screens[key] = data[key];
          }
        }
        return screens;
      })
      .catch(function (error) {
        // Leave the door open for the next interaction to try again.
        fullScreensPromise = null;
        throw error;
      });

    return fullScreensPromise;
  }

  function warmFullScreens() {
    loadFullScreens().catch(function () {});
  }

  function describe(label) {
    return 'Mock version of RELAY Dispatch, ' + label + ', showing demo data';
  }

  function announce(message) {
    if (status) {
      status.textContent = message;
    }
  }

  /** Fetches an atlas into the HTTP cache so swapping `src` cannot flash. */
  function preloadAtlas(index) {
    if (loadedAtlases[index]) {
      return Promise.resolve();
    }
    if (atlasPromises[index]) {
      return atlasPromises[index];
    }
    var promise = new Promise(function (resolve) {
      var image = new Image();
      image.decoding = 'async';
      image.onload = image.onerror = function () {
        loadedAtlases[index] = true;
        delete atlasPromises[index];
        resolve();
      };
      image.src = atlasUrl(index);
    });
    atlasPromises[index] = promise;
    return promise;
  }

  function renderHotspots(hotspots) {
    var existing = frame.querySelectorAll('.preview__hotspot');
    for (var b = 0; b < existing.length; b++) {
      existing[b].remove();
    }

    var fragment = document.createDocumentFragment();

    for (var i = 0; i < hotspots.length; i++) {
      var hotspot = hotspots[i];

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'preview__hotspot';
      button.style.left = hotspot[0] + '%';
      button.style.top = hotspot[1] + '%';
      button.style.width = hotspot[2] + '%';
      button.style.height = hotspot[3] + '%';
      button.setAttribute('aria-label', hotspot[5]);
      // Hotspots are never dropped for pointing at a screen the index does not
      // carry; `navigate` fetches the full dataset before it needs the target.
      button.dataset.target = hotspot[4];
      fragment.appendChild(button);
    }

    frame.appendChild(fragment);
  }

  /** Points the screenshot at a tile and swaps in that screen's hotspots. */
  function applyScreen(key) {
    var screen = screens[key];

    // The hero shot already is tile 0 of atlas 0, so a screen that shares the
    // current atlas only needs the sprite nudged to a different offset.
    if (screen[0] !== currentAtlas) {
      shot.src = atlasUrl(screen[0]);
      shot.width = TILE_WIDTH;
      shot.height = screen[2] * TILE_HEIGHT;
    }

    shot.alt = describe(screen[3]);
    shot.style.transform = 'translateY(-' + (screen[1] / screen[2]) * 100 + '%)';

    currentKey = key;
    currentAtlas = screen[0];

    renderHotspots(screen[4]);
    announce('Preview showing ' + screen[3]);
  }

  /** Swaps the viewport to a screen whose atlas may still need fetching. */
  function show(key) {
    var screen = screens[key];

    if (screen[0] === currentAtlas) {
      applyScreen(key);
      setBusy(false);
      return;
    }

    setBusy(true);

    preloadAtlas(screen[0])
      .then(function () {
        // The new atlas is in cache now, so swap the source and jump to the
        // right tile in one go. Transitions stay off until it has decoded, or
        // the old atlas would briefly animate towards the new offset.
        shot.style.transition = 'none';
        applyScreen(key);
        return shot.decode ? shot.decode().catch(function () {}) : Promise.resolve();
      })
      .then(function () {
        shot.style.transition = '';
        setBusy(false);
      })
      .catch(function () {
        shot.style.transition = '';
        setBusy(false);
      });
  }

  function navigate(key) {
    if (key === currentKey) {
      return;
    }

    if (screens[key]) {
      show(key);
      return;
    }

    // Record-detail screens are not in the index, so the full dataset has to
    // arrive before the tile can be looked up.
    setBusy(true);

    loadFullScreens()
      .then(function () {
        if (screens[key]) {
          show(key);
          return;
        }
        setBusy(false);
      })
      .catch(function () {
        setBusy(false);
      });
  }

  function hotspotFrom(event) {
    return event.target && event.target.closest
      ? event.target.closest('.preview__hotspot')
      : null;
  }

  frame.addEventListener('click', function (event) {
    var button = hotspotFrom(event);

    if (!button) {
      return;
    }

    navigate(button.dataset.target);

    // Hotspots are rebuilt per screen, so hold focus somewhere deliberate
    // rather than letting it fall back to the document.
    frame.focus({ preventScroll: true });
  });

  /* Warms what a press is about to need, and only on intent. A pointer merely
     travelling across the frame must not pull down a record atlas. */
  function warmTarget(event) {
    var button = hotspotFrom(event);

    if (!button || !screens) {
      return;
    }

    var target = screens[button.dataset.target];

    if (target) {
      preloadAtlas(target[0]);
    } else {
      warmFullScreens();
    }
  }

  frame.addEventListener('pointerdown', warmTarget);
  frame.addEventListener('focusin', warmTarget);
  frame.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      warmTarget(event);
    }
  });

  frame.setAttribute('tabindex', '-1');

  function warmFirstAtlas() {
    preloadAtlas(screens[INITIAL_SCREEN][0]);
  }

  fetch(SCREENS_INDEX_URL, { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      screens = data;

      if (!screens[INITIAL_SCREEN]) {
        throw new Error('missing initial screen');
      }

      // The markup already paints this screen, so only the state and the
      // hotspots need setting up.
      currentKey = INITIAL_SCREEN;
      renderHotspots(screens[INITIAL_SCREEN][4]);
      announce('');

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(warmFirstAtlas, { timeout: 2000 });
      } else {
        window.addEventListener('load', warmFirstAtlas);
      }
    })
    .catch(function () {
      // Without the dataset the dashboard screenshot stays as a static image.
      // That is the intended fallback, so nothing is shown to the visitor.
      frame.setAttribute('tabindex', '0');
    });
})();

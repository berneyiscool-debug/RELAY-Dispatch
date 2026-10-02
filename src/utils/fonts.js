// ============================================
// RELAY DISPATCH — BUNDLED WEBFONTS
// ============================================
// These faces used to be fetched from fonts.googleapis.com. The files now ship
// with the app (the @fontsource-* packages), so the UI, the print window, the
// document preview and the PDF export all render identically offline and make no
// third-party requests.
//
// Latin subset only: it covers Western European accents, and anything outside it
// falls back to the system font.
//
// The faces are built here instead of in a stylesheet because the documents
// rendered outside the app shell — the print window, the Document Studio preview
// iframe and the PDF render iframe — have no stable base URL (about:blank popups,
// srcdoc/data: documents) and need absolute asset URLs inlined.
//
// Deliberately plain JS with literal asset references: the unit tests import the
// components that pull this module in under bare Node, which cannot resolve a CSS
// import. Vite rewrites each `new URL(..., import.meta.url)` literal to a hashed
// build asset, and dev serves the same files straight from /node_modules.

const FACES = [
  {
    family: 'Inter',
    weight: '100 900',
    display: 'swap',
    format: "format('woff2-variations')",
    url: new URL('../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', import.meta.url).href,
  },
  {
    family: 'Lora',
    weight: '400 700',
    display: 'swap',
    format: "format('woff2-variations')",
    url: new URL('../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2', import.meta.url).href,
  },
  {
    family: 'Fira Code',
    weight: '300 700',
    display: 'swap',
    format: "format('woff2-variations')",
    url: new URL('../../node_modules/@fontsource-variable/fira-code/files/fira-code-latin-wght-normal.woff2', import.meta.url).href,
  },
  {
    family: 'Outfit',
    weight: '100 900',
    display: 'swap',
    format: "format('woff2-variations')",
    url: new URL('../../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', import.meta.url).href,
  },
  {
    // font-display:block (not swap) — a delayed icon glyph must never fall through
    // to the literal ligature text, e.g. the word "home" inside a 16px icon box.
    family: 'Material Icons Outlined',
    weight: '400',
    display: 'block',
    format: "format('woff2')",
    url: new URL('../../node_modules/@fontsource/material-icons-outlined/files/material-icons-outlined-latin-400-normal.woff2', import.meta.url).href,
  },
];

// Material Icons draws its glyphs from ligature names, so the family and the
// ligature feature have to be declared for the class (.material-icons-outlined in
// global.css supplies the sizing/layout).
const ICON_CLASS_RULE = `.material-icons-outlined {
  font-family: 'Material Icons Outlined';
  font-weight: normal;
  font-style: normal;
  font-feature-settings: 'liga';
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  direction: ltr;
}`;

let cachedCss = null;

/**
 * The bundled @font-face rules plus the icon class rule, with absolute asset URLs
 * so they also apply in documents that have no stable base URL.
 * @returns {string}
 */
export function fontFaceCss() {
  if (cachedCss === null) {
    const faces = FACES.map((face) => `@font-face {
  font-family: '${face.family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: ${face.display};
  src: url("${face.url}") ${face.format};
}`).join('\n\n');
    cachedCss = `${faces}\n\n${ICON_CLASS_RULE}`;
  }
  return cachedCss;
}

/** Applies the bundled faces to the app shell document. */
export function installFontFaces() {
  if (typeof document === 'undefined' || document.getElementById('relay-font-faces')) return;
  const style = document.createElement('style');
  style.id = 'relay-font-faces';
  style.textContent = fontFaceCss();
  document.head.appendChild(style);
}

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';

const { webOrigin, webAppBaseUrl, appUrl, WEB_ORIGIN, WEB_APP_PATH } = await import('./webOrigin.js');

function setLocation(value) {
  if (value === undefined) {
    delete globalThis.location;
  } else {
    globalThis.location = value;
  }
}

describe('webOrigin', () => {
  afterEach(() => setLocation(undefined));

  test('uses the current origin when served over https', () => {
    setLocation({ origin: 'https://relaydispatch.com.au' });
    assert.strictEqual(webOrigin(), 'https://relaydispatch.com.au');
  });

  test('uses the current origin on the local dev server', () => {
    setLocation({ origin: 'http://localhost:5173' });
    assert.strictEqual(webOrigin(), 'http://localhost:5173');
  });

  test('falls back to the hosted app when the desktop build serves file://', () => {
    // Chromium reports the origin of a file:// page as the string "null".
    setLocation({ origin: 'null', protocol: 'file:' });
    assert.strictEqual(webOrigin(), WEB_ORIGIN);
  });

  test('falls back when location is unavailable', () => {
    setLocation(undefined);
    assert.strictEqual(webOrigin(), WEB_ORIGIN);
  });

  test('falls back for a non-http origin', () => {
    setLocation({ origin: 'app://relay' });
    assert.strictEqual(webOrigin(), WEB_ORIGIN);
  });

  test('trims a trailing slash so paths do not double up', () => {
    setLocation({ origin: 'https://relaydispatch.com.au/' });
    assert.strictEqual(webOrigin(), 'https://relaydispatch.com.au');
  });
});

describe('webAppBaseUrl', () => {
  afterEach(() => setLocation(undefined));

  test('publishes the app under /app on the live domain', () => {
    setLocation({ origin: 'https://relaydispatch.com.au', pathname: '/app/' });
    assert.strictEqual(webAppBaseUrl(), `https://relaydispatch.com.au${WEB_APP_PATH}`);
  });

  test('keeps the dev server at the origin root', () => {
    // Vite serves the bundle from / in development; there is no /app there.
    setLocation({ origin: 'http://localhost:5173', pathname: '/' });
    assert.strictEqual(webAppBaseUrl(), 'http://localhost:5173/');
  });

  test('normalises a deep index.html pathname', () => {
    setLocation({ origin: 'https://relaydispatch.com.au', pathname: '/app/index.html' });
    assert.strictEqual(webAppBaseUrl(), 'https://relaydispatch.com.au/app/');
  });

  test('falls back to the hosted /app when the desktop build serves file://', () => {
    // The packaged app runs from file://, where the pathname is a local
    // index.html — meaningless to whoever opens a link we generated.
    setLocation({ origin: 'null', protocol: 'file:', pathname: '/C:/Program%20Files/RELAY/index.html' });
    assert.strictEqual(webAppBaseUrl(), `https://relaydispatch.com.au${WEB_APP_PATH}`);
  });

  test('falls back when location is unavailable', () => {
    setLocation(undefined);
    assert.strictEqual(webAppBaseUrl(), `https://relaydispatch.com.au${WEB_APP_PATH}`);
  });

  test('is usable as the password-reset redirect target', () => {
    // Supabase appends the recovery token as the fragment and strips only the
    // first `#` when it parses it, so the target must carry no hash of its own.
    setLocation({ origin: 'https://relaydispatch.com.au', pathname: '/app/' });
    const target = webAppBaseUrl();
    assert.ok(!target.includes('#'));
    const sent = `${target}#access_token=abc&refresh_token=def&type=recovery`;
    const params = new URLSearchParams(sent.slice(sent.indexOf('#') + 1));
    assert.strictEqual(params.get('access_token'), 'abc');
    assert.strictEqual(params.get('type'), 'recovery');
  });
});

describe('appUrl', () => {
  afterEach(() => setLocation(undefined));

  test('builds hash-router links on the hosted app path', () => {
    setLocation({ origin: 'https://relaydispatch.com.au', pathname: '/app/' });
    assert.strictEqual(
      appUrl('/settings?tab=billing'),
      'https://relaydispatch.com.au/app/#/settings?tab=billing'
    );
  });

  test('accepts a route with or without the leading slash or hash', () => {
    setLocation({ origin: 'https://relaydispatch.com.au', pathname: '/app/' });
    assert.strictEqual(appUrl('#/invoices'), 'https://relaydispatch.com.au/app/#/invoices');
    assert.strictEqual(appUrl('invoices'), 'https://relaydispatch.com.au/app/#/invoices');
  });

  test('an empty route lands on the app root', () => {
    setLocation({ origin: 'https://relaydispatch.com.au', pathname: '/app/' });
    assert.strictEqual(appUrl(), 'https://relaydispatch.com.au/app/#/');
  });

  test('links stay on /app from the desktop build', () => {
    setLocation({ origin: 'null', protocol: 'file:' });
    assert.strictEqual(
      appUrl('/subscribe?billing=success'),
      'https://relaydispatch.com.au/app/#/subscribe?billing=success'
    );
  });
});

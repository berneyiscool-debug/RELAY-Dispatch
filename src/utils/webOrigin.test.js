import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';

const { webOrigin, WEB_ORIGIN } = await import('./webOrigin.js');

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

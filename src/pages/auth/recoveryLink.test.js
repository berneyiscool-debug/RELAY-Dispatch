import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readAuthLinkHash } from './recoveryLink.js';

// A reset link used to land on the launch screen with nothing to type a new
// password into: boot rewrote the token fragment to `#/login` before Supabase
// read it. These tests pin which fragments boot must leave alone.

describe('readAuthLinkHash()', () => {
  test('ignores ordinary routes and empty hashes', () => {
    assert.strictEqual(readAuthLinkHash(''), null);
    assert.strictEqual(readAuthLinkHash('#'), null);
    assert.strictEqual(readAuthLinkHash('#/login'), null);
    assert.strictEqual(readAuthLinkHash('#/portal/customer?token=abc&type=recovery'), null);
    assert.strictEqual(readAuthLinkHash(undefined), null);
  });

  test('recognises a recovery token', () => {
    const hash = '#access_token=eyJ.a.b&expires_at=1&expires_in=3600&refresh_token=r&token_type=bearer&type=recovery';
    assert.deepStrictEqual(readAuthLinkHash(hash), { ok: true });
  });

  test('leaves other token types alone', () => {
    assert.strictEqual(readAuthLinkHash('#access_token=x&type=signup'), null);
  });

  test('reports an expired or reused link with Supabase\'s message', () => {
    const hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    assert.deepStrictEqual(readAuthLinkHash(hash), { ok: false, message: 'Email link is invalid or has expired' });
  });
});

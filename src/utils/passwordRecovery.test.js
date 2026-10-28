import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseRecoveryHash, takeRecovery } from './passwordRecovery.js';

describe('parseRecoveryHash', () => {
  test('reads the tokens from a reset link', () => {
    const got = parseRecoveryHash('#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=recovery');
    assert.deepEqual(got, { kind: 'recovery', accessToken: 'abc', refreshToken: 'def' });
  });

  test('an expired link is reported, not ignored', () => {
    const got = parseRecoveryHash('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    assert.equal(got.kind, 'error');
    assert.match(got.message, /expired/);
  });

  test('other errors pass on Supabase’s description', () => {
    const got = parseRecoveryHash('#error=server_error&error_description=Something+broke');
    assert.deepEqual(got, { kind: 'error', message: 'Something broke' });
  });

  test('hash routes and other sign-in callbacks are left alone', () => {
    assert.equal(parseRecoveryHash('#/jobs?type=recovery'), null);
    assert.equal(parseRecoveryHash('#/login'), null);
    assert.equal(parseRecoveryHash(''), null);
    assert.equal(parseRecoveryHash('#access_token=abc&refresh_token=def&type=signup'), null);
    assert.equal(parseRecoveryHash('#type=recovery'), null);
  });

  test('nothing is captured outside a browser', () => {
    assert.equal(takeRecovery(), null);
  });
});

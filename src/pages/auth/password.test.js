import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  hashPassword,
  isPasswordHash,
  hasLocalPassword,
  verifyPassword,
  verifyAndUpgrade,
} from './password.js';

// Cover for the local password scheme.
//
// Local accounts used to sign in against a record's plaintext `password`, with
// `'123456'` as a shared fallback whenever a record had none. That meant every
// demonstration dataset was open to anyone who typed the default, and the same
// hashing routine was copy-pasted into three pages. These tests pin the single
// implementation: hashed comparisons, a one-way upgrade of legacy plaintext,
// and a hard refusal to treat "no password" as a match.

describe('hashPassword()', () => {
  test('returns a 64-character lowercase hex digest', async () => {
    const hash = await hashPassword('123456');
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.strictEqual(hash, '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');
  });

  test('is stable across calls', async () => {
    assert.strictEqual(await hashPassword('s3cret!'), await hashPassword('s3cret!'));
  });
});

describe('isPasswordHash()', () => {
  test('accepts a digest and rejects plaintext', async () => {
    assert.strictEqual(isPasswordHash(await hashPassword('abc123')), true);
    assert.strictEqual(isPasswordHash('abc123'), false);
    assert.strictEqual(isPasswordHash(''), false);
    assert.strictEqual(isPasswordHash(null), false);
  });
});

describe('hasLocalPassword()', () => {
  test('is true only when a password string is stored', () => {
    assert.strictEqual(hasLocalPassword({ password: '123456' }), true);
    assert.strictEqual(hasLocalPassword({ password: '' }), false);
    assert.strictEqual(hasLocalPassword({}), false);
    assert.strictEqual(hasLocalPassword(null), false);
  });
});

describe('verifyPassword()', () => {
  test('matches a hashed password', async () => {
    const stored = await hashPassword('correct-horse');
    assert.deepStrictEqual(await verifyPassword(stored, 'correct-horse'), { ok: true, needsUpgrade: false });
  });

  test('rejects a wrong password against a hash', async () => {
    const stored = await hashPassword('correct-horse');
    assert.deepStrictEqual(await verifyPassword(stored, 'battery-staple'), { ok: false, needsUpgrade: false });
  });

  test('still accepts legacy plaintext, flagged for upgrade', async () => {
    assert.deepStrictEqual(await verifyPassword('123456', '123456'), { ok: true, needsUpgrade: true });
    assert.deepStrictEqual(await verifyPassword('123456', '654321'), { ok: false, needsUpgrade: false });
  });

  test('never accepts a stored hash as the password itself', async () => {
    const stored = await hashPassword('real-password');
    assert.deepStrictEqual(await verifyPassword(stored, stored), { ok: false, needsUpgrade: false });
  });

  test('treats a missing password as no match rather than a default', async () => {
    assert.deepStrictEqual(await verifyPassword(undefined, '123456'), { ok: false, needsUpgrade: false });
    assert.deepStrictEqual(await verifyPassword('', '123456'), { ok: false, needsUpgrade: false });
    assert.deepStrictEqual(await verifyPassword(null, '123456'), { ok: false, needsUpgrade: false });
  });

  test('refuses an empty typed password', async () => {
    assert.deepStrictEqual(await verifyPassword('123456', ''), { ok: false, needsUpgrade: false });
    assert.deepStrictEqual(await verifyPassword('123456', undefined), { ok: false, needsUpgrade: false });
  });
});

describe('verifyAndUpgrade()', () => {
  test('rewrites a legacy plaintext password as a hash', async () => {
    let written = null;
    const ok = await verifyAndUpgrade(async (hashed) => { written = hashed; }, '123456', '123456');
    assert.strictEqual(ok, true);
    assert.strictEqual(written, await hashPassword('123456'));
  });

  test('leaves an already-hashed password untouched', async () => {
    let writes = 0;
    const stored = await hashPassword('already-hashed');
    const ok = await verifyAndUpgrade(async () => { writes++; }, stored, 'already-hashed');
    assert.strictEqual(ok, true);
    assert.strictEqual(writes, 0);
  });

  test('writes nothing when the password is wrong', async () => {
    let writes = 0;
    const ok = await verifyAndUpgrade(async () => { writes++; }, '123456', 'nope');
    assert.strictEqual(ok, false);
    assert.strictEqual(writes, 0);
  });
});

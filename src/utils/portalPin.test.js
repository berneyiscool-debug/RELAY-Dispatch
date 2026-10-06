import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  hashPortalPin,
  verifyPortalPin,
  isHashedPortalPin,
  needsPortalPinUpgrade,
} from './portalPin.js';

const HASH_SHAPE = /^sha256\$[0-9a-f]{32}\$[0-9a-f]{64}$/;

describe('portal PIN storage', () => {
  test('stores a salted digest, never the PIN', async () => {
    const stored = await hashPortalPin('4821');
    assert.match(stored, HASH_SHAPE);
    assert.ok(!stored.includes('4821'), 'the PIN itself must not be recoverable from the value');
  });

  test('salts each record so equal PINs do not collide', async () => {
    const first = await hashPortalPin('1234');
    const second = await hashPortalPin('1234');
    assert.notStrictEqual(first, second, 'a shared digest would be a lookup table');
    assert.ok(await verifyPortalPin('1234', first));
    assert.ok(await verifyPortalPin('1234', second));
  });

  test('verifies the right PIN and rejects the neighbours', async () => {
    const stored = await hashPortalPin('4821');
    assert.strictEqual(await verifyPortalPin('4821', stored), true);
    for (const wrong of ['4820', '4822', '48210', '482', '4821 ', '']) {
      assert.strictEqual(await verifyPortalPin(wrong, stored), false, `${wrong} must not unlock`);
    }
  });

  test('rejects a tampered digest', async () => {
    const stored = await hashPortalPin('4821');
    const flipped = stored.slice(0, -1) + (stored.endsWith('a') ? 'b' : 'a');
    assert.strictEqual(await verifyPortalPin('4821', flipped), false);
  });

  test('rejects a stored value that is itself a hash fragment', async () => {
    const stored = await hashPortalPin('4821');
    assert.strictEqual(await verifyPortalPin(stored, stored), false);
    assert.strictEqual(await verifyPortalPin(await hashPortalPin('9999'), stored), false);
  });

  test('treats unset and malformed values as locked', async () => {
    assert.strictEqual(await verifyPortalPin('4821', null), false);
    assert.strictEqual(await verifyPortalPin('4821', undefined), false);
    assert.strictEqual(await verifyPortalPin('4821', ''), false);
    assert.strictEqual(await verifyPortalPin('4821', {}), false);
    assert.strictEqual(await verifyPortalPin('4821', 'sha256$'), false);
    assert.strictEqual(await verifyPortalPin('4821', 'sha256$abcd'), false);
  });

  test('keeps existing cleartext PINs working and flags them for upgrade', async () => {
    // Rows written before hashing landed must still unlock, otherwise every
    // active portal visitor is locked out until an admin resets the PIN.
    assert.strictEqual(await verifyPortalPin('4821', '4821'), true);
    assert.strictEqual(await verifyPortalPin('1234', '4821'), false);

    assert.strictEqual(needsPortalPinUpgrade('4821'), true);
    assert.strictEqual(needsPortalPinUpgrade(await hashPortalPin('4821')), false);
    assert.strictEqual(needsPortalPinUpgrade(null), false);
    assert.strictEqual(needsPortalPinUpgrade(''), false);
  });

  test('classifies hashed values without hashing them', async () => {
    assert.strictEqual(isHashedPortalPin(await hashPortalPin('0000')), true);
    assert.strictEqual(isHashedPortalPin('0000'), false);
    assert.strictEqual(isHashedPortalPin(undefined), false);
  });
});

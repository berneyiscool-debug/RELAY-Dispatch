/**
 * Tests for relay-create-payment's return-URL allow-list.
 *
 * The function is public, so anyone with an invoice id can mint a genuine Stripe
 * Checkout. These tests pin down that the caller cannot also choose where Stripe
 * sends the customer once they have paid.
 *
 * Run with: npm run test:migrations
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  PUBLIC_APP_BASE,
  fallbackAppBase,
  isAllowedReturnUrl,
  parseExtraOrigins,
  resolveReturnUrls,
} from '../functions/relay-create-payment/returnUrls.js'

describe('isAllowedReturnUrl', () => {
  test('accepts the hosted app and local dev servers', () => {
    for (const url of [
      'https://relaydispatch.com.au/app/#/invoices?paid=INV-1',
      'https://www.relaydispatch.com.au/app/#/invoices',
      'http://localhost:5173/#/invoices',
      'http://127.0.0.1:4173/#/invoices',
      'http://[::1]:5173/#/invoices',
    ]) assert.equal(isAllowedReturnUrl(url), true, url)
  })

  test('rejects foreign and look-alike hosts', () => {
    for (const url of [
      'https://evil.example/#/invoices',
      'https://relaydispatch.com.au.evil.example/app/',
      'https://evilrelaydispatch.com.au/app/',
      'https://relaydispatch.com.au@evil.example/app/',
      'https://user:pw@relaydispatch.com.au/app/',
    ]) assert.equal(isAllowedReturnUrl(url), false, url)
  })

  test('rejects the public host over plain http or on another port', () => {
    assert.equal(isAllowedReturnUrl('http://relaydispatch.com.au/app/'), false)
    assert.equal(isAllowedReturnUrl('https://relaydispatch.com.au:8443/app/'), false)
  })

  test('rejects non-web schemes and junk', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///C:/app/index.html',
      '//evil.example/',
      '/app/#/invoices',
      '',
      null,
      undefined,
      42,
      `https://relaydispatch.com.au/${'a'.repeat(3000)}`,
    ]) assert.equal(isAllowedReturnUrl(url), false, String(url).slice(0, 40))
  })

  test('accepts an extra origin only on an exact origin match', () => {
    const extra = ['https://preview.relay.test']
    assert.equal(isAllowedReturnUrl('https://preview.relay.test/#/invoices', extra), true)
    assert.equal(isAllowedReturnUrl('https://preview.relay.test:444/#/invoices', extra), false)
    assert.equal(isAllowedReturnUrl('http://preview.relay.test/#/invoices', extra), false)
  })
})

describe('parseExtraOrigins', () => {
  test('normalises a comma-separated list and drops junk', () => {
    assert.deepEqual(
      parseExtraOrigins(' https://a.test/some/path , not a url,,https://b.test:8080 '),
      ['https://a.test', 'https://b.test:8080'],
    )
    assert.deepEqual(parseExtraOrigins(undefined), [])
  })
})

describe('fallbackAppBase', () => {
  test('the public origin serves the app under /app', () => {
    assert.equal(fallbackAppBase('https://relaydispatch.com.au'), 'https://relaydispatch.com.au/app')
  })

  test('a dev origin serves the app from its root', () => {
    assert.equal(fallbackAppBase('http://localhost:5173/'), 'http://localhost:5173')
  })

  test('no Origin (desktop) or a foreign one gets the hosted app', () => {
    assert.equal(fallbackAppBase(null), PUBLIC_APP_BASE)
    assert.equal(fallbackAppBase('null'), PUBLIC_APP_BASE)
    assert.equal(fallbackAppBase('https://evil.example'), PUBLIC_APP_BASE)
  })
})

describe('resolveReturnUrls', () => {
  test('keeps the URLs the app itself sends', () => {
    const successUrl = 'https://relaydispatch.com.au/app/#/invoices?paid=inv_1'
    const cancelUrl = 'https://relaydispatch.com.au/app/#/invoices'
    assert.deepEqual(
      resolveReturnUrls({ successUrl, cancelUrl, origin: null, invoiceRef: 'INV-1' }),
      { successUrl, cancelUrl },
    )
  })

  test('replaces attacker-chosen URLs with the hosted app', () => {
    assert.deepEqual(
      resolveReturnUrls({
        successUrl: 'https://evil.example/thanks',
        cancelUrl: 'https://evil.example/retry',
        origin: 'https://evil.example',
        invoiceRef: 'INV 7',
      }),
      {
        successUrl: 'https://relaydispatch.com.au/app/#/invoices?paid=INV%207',
        cancelUrl: 'https://relaydispatch.com.au/app/#/invoices',
      },
    )
  })

  test('falls back on the caller origin when it is trusted', () => {
    assert.deepEqual(
      resolveReturnUrls({ origin: 'http://localhost:5173', invoiceRef: 'INV-2' }),
      {
        successUrl: 'http://localhost:5173/#/invoices?paid=INV-2',
        cancelUrl: 'http://localhost:5173/#/invoices',
      },
    )
  })
})

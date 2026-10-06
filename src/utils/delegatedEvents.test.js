import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  performDelegatedAction,
  handleDelegatedClick,
  installDelegatedEvents,
} from './delegatedEvents.js';

function fakeDoc() {
  return {
    defaultView: {
      location: { hash: '' },
      closed: false,
      alerts: [],
      close() { this.closed = true; },
      alert(message) { this.alerts.push(message); },
    },
    elements: new Map(),
    getElementById(id) { return this.elements.get(id) ?? null; },
  };
}

function fakeEvent(target) {
  return {
    target,
    stopped: false,
    defaultPrevented: false,
    stopPropagation() { this.stopped = true; },
    preventDefault() { this.defaultPrevented = true; },
  };
}

function withGlobalDocument(doc, fn) {
  const previous = globalThis.document;
  globalThis.document = doc;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
}

describe('delegated event actions', () => {
  test('data-nav assigns the declared hash verbatim', () => {
    const doc = fakeDoc();
    const event = fakeEvent();

    assert.strictEqual(performDelegatedAction({ dataset: { nav: '/jobs/new' } }, event, doc), true);
    assert.strictEqual(doc.defaultView.location.hash, '/jobs/new');

    performDelegatedAction({ dataset: { nav: '#/jobs/abc' } }, event, doc);
    assert.strictEqual(doc.defaultView.location.hash, '#/jobs/abc');
  });

  test('data-click-el forwards the click to the referenced element', () => {
    const doc = fakeDoc();
    let clicks = 0;
    doc.elements.set('portal-enable', { click() { clicks += 1; } });

    assert.strictEqual(performDelegatedAction({ dataset: { clickEl: 'portal-enable' } }, fakeEvent(), doc), true);
    assert.strictEqual(clicks, 1);
  });

  test('data-click-el tolerates a target that is not on the page', () => {
    const doc = fakeDoc();
    assert.strictEqual(performDelegatedAction({ dataset: { clickEl: 'missing' } }, fakeEvent(), doc), true);
  });

  test('data-close-window closes the tab', () => {
    const doc = fakeDoc();
    performDelegatedAction({ dataset: { closeWindow: '' } }, fakeEvent(), doc);
    assert.strictEqual(doc.defaultView.closed, true);
  });

  test('data-alert cancels the default action before alerting', () => {
    const doc = fakeDoc();
    const event = fakeEvent();

    performDelegatedAction({ dataset: { alert: 'Payment link mock' } }, event, doc);
    assert.strictEqual(event.defaultPrevented, true);
    assert.deepStrictEqual(doc.defaultView.alerts, ['Payment link mock']);
  });

  test('data-stop-propagation only stops propagation', () => {
    const doc = fakeDoc();
    const event = fakeEvent();

    assert.strictEqual(performDelegatedAction({ dataset: { stopPropagation: '' } }, event, doc), true);
    assert.strictEqual(event.stopped, true);
    assert.strictEqual(event.defaultPrevented, false);
    assert.strictEqual(doc.defaultView.location.hash, '');
  });

  test('an element with no hook does nothing', () => {
    const event = fakeEvent();

    assert.strictEqual(performDelegatedAction({ dataset: {} }, event, fakeDoc()), false);
    assert.strictEqual(performDelegatedAction(null, event, fakeDoc()), false);
    assert.strictEqual(event.stopped, false);
  });

  test('the click handler acts on the nearest hook element', () => {
    const doc = fakeDoc();
    const hook = { dataset: { nav: '/jobs/2' } };
    const event = fakeEvent({
      closest: (selector) => {
        assert.match(selector, /\[data-nav\]/);
        return hook;
      },
    });

    withGlobalDocument(doc, () => handleDelegatedClick(event));
    assert.strictEqual(doc.defaultView.location.hash, '/jobs/2');
  });

  test('the click handler ignores targets that cannot be matched', () => {
    withGlobalDocument(fakeDoc(), () => {
      assert.doesNotThrow(() => handleDelegatedClick(fakeEvent({})));
      assert.doesNotThrow(() => handleDelegatedClick(fakeEvent({ closest: () => null })));
      assert.doesNotThrow(() => handleDelegatedClick(fakeEvent(undefined)));
    });
  });

  test('install attaches one listener and is idempotent', () => {
    let attached = 0;
    const root = { addEventListener(_type, handler) { attached += 1; assert.strictEqual(typeof handler, 'function'); } };

    assert.strictEqual(installDelegatedEvents(root), true);
    assert.strictEqual(installDelegatedEvents(root), false);
    assert.strictEqual(attached, 1);
  });
});

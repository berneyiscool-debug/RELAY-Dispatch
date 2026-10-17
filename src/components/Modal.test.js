import test from 'node:test';
import assert from 'node:assert/strict';
import { showModal } from './Modal.js';
import { showAlert, showConfirm } from '../utils/confirmDialog.js';

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.queryResults = new Map();
    this.isConnected = false;
    this.textContent = '';
    this.className = '';
  }

  appendChild(child) {
    child.parentNode = this;
    child.setConnected(this.isConnected);
    this.children.push(child);
    return child;
  }

  setConnected(connected) {
    this.isConnected = connected;
    this.children.forEach(child => child.setConnected(connected));
    this.queryResults.forEach(child => child.setConnected(connected));
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    }
    this.setConnected(false);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }

  focus() {}

  querySelector(selector) {
    if (!this.queryResults.has(selector)) {
      const child = new FakeElement('div');
      child.parentNode = this;
      child.setConnected(this.isConnected);
      this.queryResults.set(selector, child);
    }
    return this.queryResults.get(selector);
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body');
    this.body.setConnected(true);
    this.listeners = new Map();
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }
}

async function withFakeDocument(run) {
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const document = new FakeDocument();
  globalThis.document = document;
  globalThis.HTMLElement = FakeElement;

  try {
    return await run(document);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousHTMLElement === undefined) delete globalThis.HTMLElement;
    else globalThis.HTMLElement = previousHTMLElement;
  }
}

test('showModal reuses an identical active modal and allows it to reopen after close', async () => {
  await withFakeDocument(document => {
    const options = {
      title: 'Confirm',
      content: 'Continue?',
      actions: [{ label: 'Cancel' }, { label: 'Continue', className: 'btn-primary' }]
    };

    const first = showModal(options);
    const duplicate = showModal(options);

    assert.strictEqual(duplicate, first);
    assert.equal(document.body.children.length, 1);
    assert.equal(document.listeners.get('keydown').size, 1);

    first.close();
    first.close();
    assert.equal(document.body.children.length, 0);
    assert.equal(document.listeners.get('keydown').size, 0);

    const reopened = showModal(options);
    assert.notStrictEqual(reopened, first);
    reopened.close();
  });
});

test('a duplicate confirmation safely resolves as canceled instead of opening another modal', async () => {
  await withFakeDocument(async document => {
    const pending = showConfirm('Continue?', { title: 'Confirm', confirmLabel: 'Continue' });
    const duplicate = await showConfirm('Continue?', { title: 'Confirm', confirmLabel: 'Continue' });

    assert.equal(duplicate, false);
    assert.equal(document.body.children.length, 1);

    const modal = document.body.children[0].children[0];
    modal.querySelector('.modal-action-1').dispatch('click');

    assert.equal(await pending, true);
    assert.equal(document.body.children.length, 0);
  });
});

test('a duplicate alert resolves immediately without adding another modal', async () => {
  await withFakeDocument(async document => {
    const pending = showAlert('Something happened.', { title: 'Notice' });
    const duplicate = await showAlert('Something happened.', { title: 'Notice' });

    assert.equal(duplicate, undefined);
    assert.equal(document.body.children.length, 1);

    const modal = document.body.children[0].children[0];
    modal.querySelector('.modal-action-0').dispatch('click');

    await pending;
    assert.equal(document.body.children.length, 0);
  });
});

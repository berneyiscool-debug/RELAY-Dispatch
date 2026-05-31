import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Router } from './router.js';

describe('Router', () => {
  test('register and match exact route', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/people', handler);

    const result = router.matchRoute('/people');
    assert.strictEqual(result.handler, handler);
    assert.deepStrictEqual(result.params, {});
  });

  test('match route with parameters', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/people/:id', handler);

    const result = router.matchRoute('/people/123');
    assert.strictEqual(result.handler, handler);
    assert.deepStrictEqual(result.params, { id: '123' });
  });

  test('match route with multiple parameters', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/people/:id/edit/:section', handler);

    const result = router.matchRoute('/people/123/edit/profile');
    assert.strictEqual(result.handler, handler);
    assert.deepStrictEqual(result.params, { id: '123', section: 'profile' });
  });

  test('return null handler for non-existent route', () => {
    const router = new Router();
    router.register('/people', () => {});

    const result = router.matchRoute('/leads');
    assert.strictEqual(result.handler, null);
    assert.deepStrictEqual(result.params, {});
  });

  test('edge case: trailing slash in route registration', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/people/', handler);

    // Current implementation is sensitive to trailing slashes
    const resultNoSlash = router.matchRoute('/people');
    assert.strictEqual(resultNoSlash.handler, null, 'Should not match without trailing slash if registered with one');

    const resultWithSlash = router.matchRoute('/people/');
    assert.strictEqual(resultWithSlash.handler, handler, 'Should match with trailing slash if registered with one');
  });

  test('edge case: trailing slash in path matching', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/people', handler);

    const resultWithSlash = router.matchRoute('/people/');
    assert.strictEqual(resultWithSlash.handler, null, 'Should not match with trailing slash if registered without one (current behavior)');
  });

  test('edge case: empty path', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/', handler);

    const resultEmpty = router.matchRoute('');
    // router.matchRoute('') -> path.split('/') is ['']
    // router.register('/') -> route.split('/') is ['', '']
    // They won't match due to length difference
    assert.strictEqual(resultEmpty.handler, null);
  });

  test('edge case: root path', () => {
    const router = new Router();
    const handler = () => {};
    router.register('/', handler);

    const resultRoot = router.matchRoute('/');
    assert.strictEqual(resultRoot.handler, handler);
  });

  test('resolve calls handler with params and query params', () => {
    const router = new Router();
    let capturedParams = null;
    const handler = (params) => { capturedParams = params; };

    router.register('/people/:id', handler);

    router.resolve('/people/123?tab=details&active=true');

    assert.deepStrictEqual(capturedParams, { id: '123', tab: 'details', active: 'true' });
  });

  test('onNavigate guard blocking route', () => {
    const router = new Router();
    let handlerCalled = false;
    router.register('/people', () => { handlerCalled = true; });

    router.onNavigate = (path) => {
      if (path === '/people') return false;
      return true;
    };

    router.resolve('/people');
    assert.strictEqual(handlerCalled, false, 'Handler should not be called when guard returns false');
    assert.strictEqual(router.currentRoute, null, 'currentRoute should remain null if navigation is blocked');
  });

  test('onNavigate guard allowing route', () => {
    const router = new Router();
    let handlerCalled = false;
    router.register('/people', () => { handlerCalled = true; });

    router.onNavigate = (path) => {
      return true;
    };

    router.resolve('/people');
    assert.strictEqual(handlerCalled, true, 'Handler should be called when guard returns true');
    assert.strictEqual(router.currentRoute, '/people', 'currentRoute should be updated when navigation is allowed');
  });
});

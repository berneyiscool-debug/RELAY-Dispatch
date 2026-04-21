import { test, describe } from 'node:test';
import assert from 'node:assert';
import { escapeHTML } from '../../utils/security.js';

describe('Security: escapeHTML', () => {
  test('should escape basic HTML characters', () => {
    const input = '<script>alert("XSS")</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
    assert.strictEqual(escapeHTML(input), expected);
  });

  test('should escape single and double quotes', () => {
    const input = 'href="javascript:alert(1)"';
    const expected = 'href=&quot;javascript:alert(1)&quot;';
    assert.strictEqual(escapeHTML(input), expected);

    const input2 = "onclick='alert(1)'";
    const expected2 = 'onclick=&#39;alert(1)&#39;';
    assert.strictEqual(escapeHTML(input2), expected2);
  });

  test('should escape ampersands', () => {
    const input = 'foo & bar';
    const expected = 'foo &amp; bar';
    assert.strictEqual(escapeHTML(input), expected);
  });

  test('should handle null and undefined', () => {
    assert.strictEqual(escapeHTML(null), '');
    assert.strictEqual(escapeHTML(undefined), '');
  });

  test('should handle non-string inputs', () => {
    assert.strictEqual(escapeHTML(123), '123');
    assert.strictEqual(escapeHTML(true), 'true');
  });
});

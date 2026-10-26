import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceDocument, sourceHref } from './source.mjs';

test('source links select positive source lines without accepting arbitrary paths', () => {
  assert.equal(sourceHref(), '/source');
  assert.equal(sourceHref(42), '/source#L42');
  assert.equal(sourceHref(9, 'design/colors.md'), '/source?file=design%2Fcolors.md#L9');
  for (const file of ['package.json', '../design.md', 'design/../design.md', 'https://example.com/design.md']) {
    assert.throws(() => sourceHref(1, file), RangeError);
  }
  for (const value of [0, -1, 1.5, '42', '../package.json']) assert.throws(() => sourceHref(value), RangeError);
});

test('source view preserves line numbers and escapes authored markup rather than executing it', () => {
  const html = sourceDocument('## Themes\r\n<script>alert("source")</script> & \'data\'\r\n');
  assert.ok(html.includes('id="L1"'));
  assert.ok(html.includes('id="L2"'));
  assert.ok(html.includes('id="L3"'));
  assert.ok(html.includes('<code>## Themes</code>'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;source&quot;)&lt;/script&gt; &amp; &#39;data&#39;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('\r'));
  const module = sourceDocument('## Colors', 'design/colors.md');
  assert.ok(module.includes('<h1>design/colors.md</h1>'));
  assert.ok(module.includes('href="/source">Source index</a>'));
});

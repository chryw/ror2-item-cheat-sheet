import assert from 'node:assert/strict';
import { once } from 'node:events';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createDesignServer, extractPrinciples, loadSnapshot } from './server.mjs';
import { categories, pages } from './reference.mjs';
import { assertExplorerModel } from './contract.mjs';
import { readDesignSource } from '../../../scripts/design-source.cjs';
import { sourceDocument } from './source.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('principles come from existing guide sections, preserving wrapped prose and rules', () => {
  const guide = [
    '---', 'title: Example', '---', '## Overview',
    '<!-- design:author intent -->', 'Keep reference interfaces', 'readable and dense.', '', 'Preserve user state.',
    '### Validation', 'Not a design intent paragraph.',
    "## Do's and Don'ts", '<!-- design:author principles -->', '- Do use shared roles', '  instead of local overrides.',
    "- Don't claim support before verification.", '## Other', 'Not a principle.',
  ].join('\r\n');
  assert.deepEqual(extractPrinciples(guide), {
    intent: ['Keep reference interfaces readable and dense.', 'Preserve user state.'],
    rules: ['Do use shared roles instead of local overrides.', "Don't claim support before verification."],
    sourceSections: ['Overview', "Do's and Don'ts"],
  });
  assert.throws(() => extractPrinciples('## Overview\nIntent.'), /Missing design guidance section/);
  assert.throws(() => extractPrinciples("## Overview\n\n## Do's and Don'ts\n- Do reuse roles."), /Invalid design principles/);
  assert.throws(() => extractPrinciples("## Overview\nIntent.\n## Do's and Don'ts\n- Invented policy."), /Invalid design principles/);
});

test('inventory reuses canonical aliases and separates active and planned themes', () => {
  const snapshot = loadSnapshot(root);
  assert.ok(snapshot.tokens.length > 300);
  const { components: specification, documents } = readDesignSource(root);
  assert.equal(assertExplorerModel(snapshot), snapshot);
  assert.deepEqual(Object.fromEntries(snapshot.components.map(component => [
    component.id, { element: component.element, ...Object.fromEntries(component.fields.map(field => [field.key, field.value])) },
  ])), specification.components);
  if (snapshot.principles) {
    const { sources, ...principles } = snapshot.principles;
    assert.deepEqual(principles, extractPrinciples(snapshot.guide));
    for (const item of sources) {
      const document = documents.find(document => document.file === item.source.file);
      assert.equal(document.text.replace(/\r\n/g, '\n').split('\n')[item.source.line - 1], `## ${item.title}`);
    }
  } else {
    assert.ok(snapshot.sourceIssues.length > 0);
  }
  assert.deepEqual(snapshot.activeThemes, ['dark', 'dark-ror2']);
  const primary = snapshot.tokens.find(token => token.name === 'semantic.color.brand.foreground.primary');
  assert.equal(primary.value, '#98bffeff');
  assert.equal(primary.raw, '{primitive.color.shared.blue-bright}');
  const tenant = loadSnapshot(root, 'dark-ror2');
  assert.notEqual(tenant.tokens.find(token => token.name === primary.name).value, primary.value);
  assert.throws(() => loadSnapshot(root, 'light'), /planned/);
});

test('HTTP serves the explorer, preserves instance view state, validates input, and blocks cross-origin writes', async t => {
  const panel = createDesignServer(root);
  panel.server.listen(0, '127.0.0.1');
  await once(panel.server, 'listening');
  t.after(() => new Promise((resolve, reject) => panel.server.close(error => (error ? reject(error) : resolve()))));
  const base = `http://127.0.0.1:${panel.server.address().port}`;
  const get = route => fetch(`${base}${route}`);
  const post = (body, origin = base) => fetch(`${base}/api/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
  for (const route of ['/', '/canvas.css', '/canvas.js', '/reference.mjs', '/source.mjs', '/contract.mjs', '/source']) {
    const response = await get(route);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 100);
  }
  assert.equal(await (await get('/source')).text(), sourceDocument(readFileSync(path.join(root, 'design.md'), 'utf8')));
  assert.equal((await get('/source?file=package.json')).status, 404);
  assert.equal((await get('/source?file=design%2Flayout.md')).status, 200);
  assert.equal((await get('/source?file=design%2Fnot-listed.md')).status, 404);
  assert.equal((await get('/source?path=design%2Flayout.md')).status, 400);
  assert.equal((await get('/source/package.json')).status, 404);
  const initial = await (await get('/api/system')).json();
  assert.equal(assertExplorerModel(initial), initial);
  assert.deepEqual(initial.view, { section: 'tokens', category: 'all', theme: 'dark', queries: { tokens: '', components: '', iconography: '' } });
  const view = { section: 'tokens', category: 'colors', theme: 'dark-ror2', queries: { tokens: 'brand', components: 'button', iconography: 'search' } };
  for (const { id: category } of categories) {
    assert.equal((await post({ ...view, category })).status, 200);
  }
  for (const { id: section } of pages) {
    assert.equal((await post({ ...view, section })).status, 200);
    assert.equal((await (await get('/api/system')).json()).view.section, section);
  }
  assert.equal((await post({ ...view, section: 'components', category: 'typography' })).status, 200);
  const componentView = await (await get('/api/system')).json();
  assert.equal(componentView.view.category, 'typography');
  assert.equal(componentView.view.section, 'components');
  assert.equal((await post({ ...view, section: 'principles', category: 'typography' })).status, 200);
  const principlesView = await (await get('/api/system')).json();
  assert.equal(principlesView.view.section, 'principles');
  assert.equal(principlesView.view.category, 'typography');
  if (principlesView.principles) {
    const { sources, ...principles } = principlesView.principles;
    assert.deepEqual(principles, extractPrinciples(principlesView.guide));
    assert.ok(sources.length > 0);
  }
  else assert.ok(principlesView.sourceIssues.length > 0);
  assert.equal((await post(view)).status, 200);
  const snapshot = await (await get('/api/system')).json();
  assert.deepEqual(snapshot.view, view);
  assert.equal(snapshot.theme, view.theme);
  assert.equal((await post({ ...view, theme: 'light' })).status, 400);
  for (const section of ['overview', 'guide', 'colors', 'typography', 'geometry']) {
    assert.equal((await post({ ...view, section })).status, 400);
  }
  assert.equal((await post({ ...view, category: 'unknown' })).status, 400);
  const { category, ...missingCategory } = view;
  assert.equal((await post(missingCategory)).status, 400);
  assert.equal((await post({ ...view, queries: { ...view.queries, tokens: 'x'.repeat(201) } })).status, 400);
  assert.equal((await post({ ...view, queries: { ...view.queries, components: 42 } })).status, 400);
  assert.equal((await post({ ...view, queries: { tokens: '', components: '' } })).status, 400);
  assert.equal((await post({ ...view, layer: 'all' })).status, 400);
  assert.equal((await post(view, 'https://example.com')).status, 403);
  assert.equal((await get('/api/system?theme=light')).status, 400);
  assert.equal((await get('/missing')).status, 404);
  assert.deepEqual(panel.view, view);
});

test('live snapshots detect saved edits, skip unchanged data, and recover from invalid sources', async t => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'ror2-canvas-live-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  mkdirSync(path.join(fixture, 'scripts'));
  const original = readDesignSource(root).guide.replace(/\r\n/g, '\n');
  const definitions = original.match(/```yaml design:[^\n]+\n[\s\S]*?\n```|### Token group:[^\n]+\n\n(?:\|[^\n]*\n)+/g).join('\n\n');
  writeFileSync(path.join(fixture, 'design.md'), `## Overview\nKeep reference interfaces readable.\n\n## Do's and Don'ts\n- Do preserve user state.\n\n## Compilable definitions\n${definitions}\n`);
  for (const file of ['design-tokens.cjs', 'design-preview.cjs', 'design-content.cjs']) {
    copyFileSync(path.join(root, 'scripts', file), path.join(fixture, 'scripts', file));
  }
  writeFileSync(path.join(fixture, 'scripts', 'design-source.cjs'),
    `module.exports = require(${JSON.stringify(path.join(root, 'scripts', 'design-source.cjs'))});\n`);
  const panel = createDesignServer(fixture);
  panel.server.listen(0, '127.0.0.1');
  await once(panel.server, 'listening');
  t.after(() => new Promise((resolve, reject) => panel.server.close(error => (error ? reject(error) : resolve()))));
  const base = `http://127.0.0.1:${panel.server.address().port}`;
  const get = (tag, theme = 'dark') => fetch(`${base}/api/system?theme=${theme}`, {
    headers: tag ? { 'If-None-Match': tag } : {},
  });
  const initial = await get();
  assert.equal(initial.status, 200);
  const initialTag = initial.headers.get('etag');
  assert.match(initialTag, /^"[a-f0-9]{64}"$/);
  const unchanged = await get(initialTag);
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), '');
  const otherTheme = await get(initialTag, 'dark-ror2');
  assert.equal(otherTheme.status, 200);
  assert.notEqual(otherTheme.headers.get('etag'), initialTag);

  const view = { section: 'tokens', category: 'geometry', theme: 'dark', queries: { tokens: 'spacing', components: '', iconography: '' } };
  const saved = await fetch(`${base}/api/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify(view),
  });
  assert.equal(saved.status, 200);
  assert.equal((await get(initialTag)).status, 304);

  const guidePath = path.join(fixture, 'design.md');
  const guide = readFileSync(guidePath, 'utf8').replace("## Do's and Don'ts", "## Do's and Don'ts\n\n- Do refresh live snapshots after saved edits.")
    .replace('| `large` | `1rem` |  |', '| `large` | `1.125rem` |  |')
    .replace('Native activation; default type=button.', 'Native activation; default type=button. Live editing test.')
    + '\n\n## Accessibility\nLive source-owned accessibility guidance.\n\n## Changelog\nLive source-owned release notes.\n';
  writeFileSync(guidePath, guide);

  const changed = await get(initialTag);
  assert.equal(changed.status, 200);
  const nextTag = changed.headers.get('etag');
  assert.notEqual(nextTag, initialTag);
  const snapshot = await changed.json();
  assert.equal(snapshot.tokens.find(token => token.name === 'primitive.spacing.large').value.value, 1.125);
  assert.ok(snapshot.components.find(component => component.id === 'button').fields.find(field => field.key === 'rules').value.includes('Live editing test.'));
  assert.ok(snapshot.principles.rules.includes('Do refresh live snapshots after saved edits.'));
  assert.equal(snapshot.documentation.accessibility[0].excerpts[0].body, 'Live source-owned accessibility guidance.');
  assert.equal(snapshot.documentation.adoption[2].excerpts[0].body, 'Live source-owned release notes.');
  assert.deepEqual(snapshot.view, view);
  assert.equal((await get(nextTag)).status, 304);

  writeFileSync(guidePath, '{');
  const invalid = await get(nextTag);
  assert.equal(invalid.status, 500);
  assert.match(await invalid.text(), /Cannot read design system/);
  const rawSource = await fetch(`${base}/source`);
  assert.equal(rawSource.status, 200);
  assert.ok((await rawSource.text()).includes('<code>{</code>'));
  writeFileSync(guidePath, guide);
  assert.equal((await get(nextTag)).status, 304);

  writeFileSync(guidePath, `Temporarily incomplete prose\n\n## Compilable definitions\n${definitions}`);
  const invalidGuide = await get(nextTag);
  assert.equal(invalidGuide.status, 200);
  const incomplete = await invalidGuide.json();
  assert.equal(incomplete.principles, null);
  assert.match(incomplete.sourceIssues.join(' '), /Missing design guidance section/);
  assert.ok(incomplete.tokens.length > 0);
  assert.ok(incomplete.documentation.accessibility.every(slot => !slot.available));
  writeFileSync(guidePath, `## Accessibility\nStill usable source-owned requirements.\n\n## Compilable definitions\n${definitions}`);
  const partial = await (await get()).json();
  assert.equal(partial.principles, null);
  assert.ok(partial.sourceIssues.length > 0);
  assert.equal(partial.documentation.accessibility[0].excerpts[0].body, 'Still usable source-owned requirements.');
  writeFileSync(guidePath, guide);
  assert.equal((await get(nextTag)).status, 304);
  rmSync(guidePath);
  const missing = await get(nextTag);
  assert.equal(missing.status, 500);
  assert.match(await missing.text(), /Cannot read design system/);
  writeFileSync(guidePath, '');
  const empty = await get();
  assert.equal(empty.status, 500);
  assert.match(await empty.text(), /Cannot read design system/);
  writeFileSync(guidePath, guide);
  assert.equal((await get(nextTag)).status, 304);
  assert.deepEqual(panel.view, view);
});

test('saved module edits refresh snapshots with real provenance while invalid modules remain readable', async t => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'ror2-canvas-modules-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  readDesignSource(root).documents.forEach(({ file, text }) => {
    const target = path.join(fixture, ...file.split('/'));
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, text);
  });
  mkdirSync(path.join(fixture, 'scripts'));
  for (const file of ['design-tokens.cjs', 'design-preview.cjs', 'design-content.cjs']) {
    copyFileSync(path.join(root, 'scripts', file), path.join(fixture, 'scripts', file));
  }
  writeFileSync(path.join(fixture, 'scripts', 'design-source.cjs'),
    `module.exports = require(${JSON.stringify(path.join(root, 'scripts', 'design-source.cjs'))});\n`);
  const panel = createDesignServer(fixture);
  panel.server.listen(0, '127.0.0.1');
  await once(panel.server, 'listening');
  t.after(() => new Promise((resolve, reject) => panel.server.close(error => (error ? reject(error) : resolve()))));
  const base = `http://127.0.0.1:${panel.server.address().port}`;
  const initial = await fetch(`${base}/api/system`);
  const tag = initial.headers.get('etag');
  const layoutPath = path.join(fixture, 'design', 'layout.md');
  const layout = readFileSync(layoutPath, 'utf8');
  writeFileSync(layoutPath, layout.replace('| `large` | `1rem` |  |', '| `large` | `1.125rem` |  |'));
  const changed = await fetch(`${base}/api/system`, { headers: { 'If-None-Match': tag } });
  assert.equal(changed.status, 200);
  assert.notEqual(changed.headers.get('etag'), tag);
  const snapshot = await changed.json();
  assert.equal(snapshot.tokens.find(token => token.name === 'primitive.spacing.large').value.value, 1.125);
  const heading = '### Token group: tokens.primitive.spacing (dimension)';
  assert.deepEqual(snapshot.tokens.find(token => token.name === 'primitive.spacing.large').source, {
    file: 'design/layout.md', line: layout.split('\n').indexOf(heading) + 1,
  });
  writeFileSync(layoutPath, '```yaml design:tokens\nincomplete:');
  const invalid = await fetch(`${base}/api/system`);
  assert.equal(invalid.status, 500);
  assert.match(await invalid.text(), /design\/layout\.md/);
  const raw = await fetch(`${base}/source?file=design%2Flayout.md`);
  assert.equal(raw.status, 200);
  assert.match(await raw.text(), /incomplete:/);
  assert.equal((await fetch(`${base}/source`)).status, 200);
  writeFileSync(layoutPath, layout);
  assert.equal((await fetch(`${base}/api/system`, { headers: { 'If-None-Match': tag } })).status, 304);
});

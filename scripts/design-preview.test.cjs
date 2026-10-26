const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createTokenModel } = require('./design-tokens.cjs');
const { createFixtures, createServer, previewSource, tokenCss } = require('./design-preview.cjs');
const { readDesignSource } = require('./design-source.cjs');
const { contentContract } = require('./design-content.cjs');

const { tokens: base } = readDesignSource();
const baseline = { commit: contentContract().tenants.ror2.revision };

test('a second game adds only tenant data and a thin inherited theme', () => {
  const extension = readDesignSource().minecraft;
  const before = JSON.stringify(extension);
  const source = previewSource(base, extension);
  assert.equal(JSON.stringify(extension), before);
  ['primitive', 'semantic', 'component'].forEach(group => {
    assert.deepEqual(source[group], base[group], group);
  });
  assert.deepEqual(source.context.density, base.context.density);
  assert.equal(source.tenant.minecraft.color.material.diamond.$value, '#6ED8D2FF');
  const minecraft = createTokenModel(source, 'dark-minecraft');
  const ror2 = createTokenModel(source, 'dark-ror2');
  assert.deepEqual(minecraft.themeChain, ['dark', 'dark-minecraft']);
  assert.deepEqual(minecraft.resolve('component.card.spacing.padding'), ror2.resolve('component.card.spacing.padding'));
  assert.notDeepEqual(minecraft.resolve('semantic.color.brand.foreground.primary'), ror2.resolve('semantic.color.brand.foreground.primary'));
  assert.equal(base.tenant.minecraft, undefined);
});

test('CSS compilation retains aliases and typography fields and resolves inherited theme literals', () => {
  const css = tokenCss(createTokenModel(base, 'dark-ror2'));
  assert.match(css, /--ds-semantic-color-decorative-foreground-white:#B8C1C7FF;/);
  assert.match(css, /--ds-tenant-ror2-color-rarity-common:var\(--ds-semantic-color-decorative-foreground-white\);/);
  assert.match(css, /--ds-component-card-typography-fontSize:var\(--ds-semantic-typography-body-small-fontSize\);/);
  assert.doesNotMatch(css, /\[object Object\]|undefined|--ds-context-theme-/);
});

test('the shared renderer binds tenant control aliases, so tenant-only overrides take effect', () => {
  const source = previewSource(base);
  source.tenant.minecraft.component['item-card'].spacing.padding.$value = '{semantic.spacing.gap.icon}';
  const model = createTokenModel(source, 'dark-minecraft');
  const css = tokenCss(model, 'minecraft');
  assert.match(css, /--preview-card-spacing-padding:var\(--ds-tenant-minecraft-component-item-card-spacing-padding\);/);
  assert.match(css, /--ds-tenant-minecraft-component-item-card-spacing-padding:var\(--ds-semantic-spacing-gap-icon\);/);
  assert.deepEqual(model.resolve('component.card.spacing.padding'), {
    type: 'dimension', value: { value: 0.75, unit: 'rem' },
  });
  assert.deepEqual(model.resolve('tenant.minecraft.component.item-card.spacing.padding'), {
    type: 'dimension', value: { value: 0.5, unit: 'rem' },
  });
});

test('the fork baseline provides the complete visible item, equipment and drone gallery', () => {
  const { fixtures, commit } = createFixtures(base, baseline.commit);
  assert.equal(commit, baseline.commit);
  const { ror2, minecraft } = fixtures;
  assert.equal(ror2.entries.length, 263);
  assert.equal(ror2.entries.filter(entry => entry.section === 'Items').length, 206);
  assert.equal(ror2.entries[0].name, 'Repulsion Armor Plate');
  assert.equal(ror2.entries[0].catalogId, '102');
  assert.equal(minecraft.entries.length, 12);
  assert.deepEqual(ror2.filters.map(filter => filter.key), ['group', 'version']);
  assert.deepEqual(minecraft.filters.map(filter => filter.key), ['group', 'category']);
  assert.ok(ror2.filters.every(filter => filter.multiple));
  assert.ok(ror2.entries.some(entry => entry.displayCategories.includes('On Kill Effect')));
  assert.ok(ror2.entries.every(entry => !entry.displayCategories.includes('AIBlacklist')));
  assert.ok(ror2.entries.filter(entry => entry.section === 'Drones').every(entry => entry.attributes.length > 0));
  assert.ok(ror2.entries.some(entry => entry.group === "N'tormat Pages"));
  Object.values(fixtures).forEach(fixture => {
    assert.equal(new Set(fixture.entries.map(entry => entry.id)).size, fixture.entries.length);
    const model = createTokenModel(previewSource(base), fixture.theme);
    fixture.filters.forEach(filter => {
      assert.equal(typeof fixture.messages[filter.message], 'string');
      assert.equal(typeof fixture.messages[filter.allMessage], 'string');
    });
    fixture.entries.forEach(entry => assert.equal(model.resolve(entry.colorToken).type, 'color'));
  });
});

test('preview serves both games, compiled breakpoints and real fork image assets', async () => {
  const server = createServer(baseline.commit);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(`${origin}/api/ror2`);
    assert.equal(response.status, 200);
    const fixture = await response.json();
    const image = await fetch(`${origin}${fixture.entries[0].image}`);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type'), /image\/webp/);
    assert.ok((await image.arrayBuffer()).byteLength > 100);
    const css = await (await fetch(`${origin}/preview.css`)).text();
    assert.match(css, /max-width: 56.25rem/);
    assert.doesNotMatch(css, /__breakpoint/);
    Object.keys(base.context.density).filter(name => !name.startsWith('$')).forEach(name => {
      assert.ok(css.includes(`:root[data-density="${name}"]{--density-spacing:var(--ds-context-density-${name}-spacing);`));
    });
    assert.equal((await fetch(`${origin}/api/minecraft`)).status, 200);
    const components = await (await fetch(`${origin}/api/components`)).json();
    assert.equal(components.selection.pickerCommit, 'apply');
    assert.equal(components.runtime.defaultDensity, base.$extensions['ror2.design-system'].defaultDensity);
    assert.equal(components.iconography.slots.searchLeading, 'search');
    const content = await (await fetch(`${origin}/api/content`)).json();
    assert.equal(content.policy.generation, 'forbidden');
    assert.equal(fixture.provenance.revision, baseline.commit);
    assert.match(await (await fetch(`${origin}/`)).text(), /type="module"/);
    assert.equal((await fetch(`${origin}/design-components.mjs`)).status, 200);
    assert.equal((await fetch(`${origin}/unknown`)).status, 404);
    assert.equal((await fetch(`${origin}/api/unknown`)).status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
});

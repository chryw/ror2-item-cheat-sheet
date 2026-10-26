const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const { componentContract } = require('./design-preview.cjs');
const { createTokenModel } = require('./design-tokens.cjs');
const { readDesignSource } = require('./design-source.cjs');

const { tokens: base, components: spec } = readDesignSource();
const components = import(pathToFileURL(path.join(__dirname, 'design-components.mjs')).href);
const options = ['one', 'two', 'three'].map(value => ({ value, label: value }));

test('popup-multi: desktop changes commit immediately without aliasing caller arrays', async () => {
  const { createSelectionModel } = await components;
  const commits = [];
  const initial = [];
  const model = createSelectionModel(options, true, initial, value => commits.push(value));
  model.open(false);
  model.choose('one');
  model.choose('two');
  assert.deepEqual(commits, [['one'], ['one', 'two']]);
  assert.deepEqual(initial, []);
  const external = model.value;
  external.length = 0;
  assert.deepEqual(model.value, ['one', 'two']);
  model.choose('one');
  model.cancel();
  assert.deepEqual(model.value, ['two']);
});

test('picker-transaction: cancel/clear/apply never leak drafts or emit twice', async () => {
  const { createSelectionModel } = await components;
  const commits = [];
  const model = createSelectionModel(options, true, ['one'], value => commits.push(value));
  model.open(true);
  model.choose('two');
  assert.deepEqual(model.value, ['one']);
  assert.deepEqual(model.draft, ['one', 'two']);
  model.cancel();
  assert.deepEqual(model.value, ['one']);
  assert.equal(commits.length, 0);
  model.open(true);
  model.clear();
  assert.deepEqual(model.value, ['one']);
  model.cancel();
  model.open(true);
  model.choose('three');
  model.apply();
  assert.deepEqual(commits, [['one', 'three']]);
  assert.throws(() => model.apply(), /No picker transaction/);
});

test('single select stages radio changes and external resets invalidate a draft', async () => {
  const { createSelectionModel } = await components;
  const commits = [];
  const model = createSelectionModel(options, false, 'one', value => commits.push(value));
  model.open(true);
  model.choose('two');
  assert.equal(model.value, 'one');
  model.apply();
  assert.deepEqual(commits, ['two']);
  model.open(true);
  model.choose('three');
  model.set('one');
  assert.equal(model.value, 'one');
  assert.equal(model.draft, 'one');
  assert.throws(() => model.clear(), /Only multiple/);
});

test('mode-transition: dismissing a surface retains committed values, not its draft', async () => {
  const { createSelectionModel } = await components;
  const model = createSelectionModel(options, true, ['one'], () => assert.fail('Unexpected commit'));
  model.open(true);
  model.choose('two');
  model.cancel();
  model.open(false);
  assert.deepEqual(model.value, ['one']);
  assert.deepEqual(model.draft, ['one']);
});

test('invalid selection data fails explicitly instead of silently dropping values', async () => {
  const { createSelectionModel } = await components;
  assert.throws(() => createSelectionModel(options, true, 'one', () => {}), /shape/);
  assert.throws(() => createSelectionModel(options, true, ['missing'], () => {}), /Unknown/);
  assert.throws(() => createSelectionModel(options, true, ['one', 'one'], () => {}), /duplicate/);
  assert.throws(() => createSelectionModel([...options, options[0]], true, [], () => {}), /Duplicate/);
  const empty = createSelectionModel([], false, '', () => {});
  assert.equal(empty.value, '');
  assert.throws(() => empty.choose('one'), /Unknown/);
});

test('component recipes cover shared controls, consume valid aliases and compile adaptive policy', () => {
  const contract = componentContract(base);
  assert.deepEqual(Object.keys(contract.components), [
    'button', 'label', 'searchbox', 'select', 'card', 'hyperlink', 'navigation', 'icon', 'filter-chip', 'panel',
  ]);
  assert.equal(contract.runtime.compactQuery, '(max-width: 56.25rem)');
  assert.equal(contract.workspace.scrollbarWidth, 'none');
  assert.equal(contract.runtime.pickerQuery, '(max-width: 56.25rem), (any-pointer: coarse)');
  assert.deepEqual(contract.runtime.popupMaxBlockSize, { value: 15, unit: 'rem' });
  assert.deepEqual(contract.tenants.ror2.readOnlyMetadata, ['category']);
  assert.equal(contract.acceptance.length, 11);
  assert.equal(contract.iconography.slots.closePanel, 'close');
  assert.equal(contract.iconography.roles['arrow-inline-end'].mirror, true);
  assert.deepEqual(createTokenModel(base).resolve('semantic.stroke-width.icon').value, { value: 1.75, unit: 'px' });
});

test('broken recipe bindings, unsupported policies and duplicate acceptance IDs fail validation', () => {
  assert.throws(() => componentContract(base, {
    ...spec, components: { ...spec.components, button: { ...spec.components.button, tokens: ['tenant.ror2.color.rarity.common'] } },
  }), /cannot bind/);
  assert.throws(() => componentContract(base, {
    ...spec, workspace: { ...spec.workspace, compactMax: '{semantic.color.neutral.foreground.primary}' },
  }), /Invalid layout/);
  assert.throws(() => componentContract(base, {
    ...spec, workspace: { ...spec.workspace, scrollbarWidth: 'overlay' },
  }), /Unsupported workspace scrollbar/);
  assert.throws(() => componentContract(base, {
    ...spec, selection: { ...spec.selection, pickerCommit: 'immediate' },
  }), /Unsupported selection/);
  assert.throws(() => componentContract(base, {
    ...spec, acceptance: [...spec.acceptance, spec.acceptance[0]],
  }), /Duplicate/);
  assert.throws(() => componentContract(base, {
    ...spec, iconography: { ...spec.iconography, slots: { closePanel: 'unknown' } },
  }), /Unknown icon role/);
});

test('localized component messages require all interpolation arguments', async () => {
  const { format, configureIcons, icon, iconForSlot } = await components;
  assert.equal(format('{count} selected', { count: 2 }), '2 selected');
  assert.throws(() => format('Remove {value}', {}), /Missing message argument/);
  assert.throws(() => configureIcons(null), /must be configured/);
  configureIcons(spec.iconography);
  assert.throws(() => icon('invented'), /Unknown UI icon role/);
  assert.throws(() => icon('search', 'huge'), /Unknown UI icon size/);
  assert.throws(() => iconForSlot('invented'), /Unknown UI icon slot/);
});

test('density options and defaults compile from contexts and require localized labels', () => {
  const input = JSON.parse(JSON.stringify(base));
  input.$extensions['ror2.design-system'].defaultDensity = 'compact';
  assert.equal(componentContract(input).runtime.defaultDensity, 'compact');
  input.context.density.spacious = input.context.density.comfortable;
  assert.throws(() => componentContract(input), /Missing density UI message: spacious/);
  const contract = componentContract(input, {
    ...spec, messages: { ...spec.messages, spacious: 'Spacious' },
  });
  assert.deepEqual(contract.runtime.densities, ['comfortable', 'compact', 'spacious']);
  assert.equal(contract.runtime.defaultDensity, 'compact');
});

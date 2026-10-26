import assert from 'node:assert/strict';
import test from 'node:test';
import { assertExplorerModel, explorerFormat } from './contract.mjs';
import { createExplorerModel } from './view-model.mjs';

function fixture(overrides = {}) {
  return {
    metadata: { name: 'Fixture', revision: 'unrelated-product-version', themes: { night: { status: 'active' } } },
    theme: 'night', activeThemes: ['night'], tokens: [], contract: {},
    guide: '', sourceMap: [], documentation: {}, principles: null, sourceIssues: [],
    ...overrides,
  };
}

test('versioned view model is deterministic, serializable, and independent of system revision', () => {
  const input = fixture();
  const first = createExplorerModel(input);
  assert.equal(first.format, explorerFormat);
  assert.equal(first.schemaVersion, 1);
  assert.deepEqual(createExplorerModel(input), first);
  assert.deepEqual(assertExplorerModel(JSON.parse(JSON.stringify(first))), first);
  assert.equal(first.capabilities.components, false);
  assert.deepEqual(first.components, []);
  assert.deepEqual(first.iconography.icons, []);
  assert.equal(first.principles, null);
  assert.equal(input.format, undefined);
});

test('arbitrary namespaces and depths use authored groups and module provenance without UI rules', () => {
  const guide = [
    '## New palette', '### Token group: tokens.unfamiliar.deep.palette (color)', '',
    '| Token | Value |', '| --- | --- |', '| `ink` | `#112233ff` |',
  ].join('\n');
  const model = createExplorerModel(fixture({
    guide, sourceMap: [{ file: 'design/new-palette.md', start: 1, end: 6, line: 30 }],
    tokens: [{ name: 'unfamiliar.deep.palette.ink', type: 'color', raw: '#112233ff', value: '#112233ff' }],
  }));
  assert.equal(model.groups[0].id, 'unfamiliar.deep.palette');
  assert.equal(model.tokens[0].groupId, model.groups[0].id);
  assert.equal(model.tokens[0].category, 'colors');
  assert.deepEqual(model.tokens[0].source, { file: 'design/new-palette.md', line: 31 });
  assert.equal(model.tokens[0].preview.kind, 'color');
});

test('explicit presentation metadata decouples groups, labels, categories, and usage from token names', () => {
  const model = createExplorerModel(fixture({
    groups: [{ id: 'text-colors', label: 'Readable text', path: ['Color', 'Text'] }],
    tokens: [{
      name: 'a.b.c.d.e', type: 'color', raw: '#112233ff', value: '#112233ff',
      groupId: 'text-colors', category: 'colors', application: 'foreground',
      source: { file: 'design/custom.md', line: 12 },
    }],
  }));
  assert.deepEqual(model.groups, [{ id: 'text-colors', label: 'Readable text', path: ['Color', 'Text'] }]);
  assert.equal(model.tokens[0].preview.application, 'foreground');
  assert.deepEqual(model.tokens[0].source, { file: 'design/custom.md', line: 12 });
  assert.throws(() => createExplorerModel(fixture({
    tokens: [{ name: 'a', type: 'number', raw: 1, value: 1, groupId: 'missing' }],
  })), /Unknown Explorer group/);
});

test('whole-control aggregation survives nested anatomy, variants and states', () => {
  const names = ['component.button.part.label.color.foreground', 'component.button.variant.primary.state.hover.color.background'];
  const model = createExplorerModel(fixture({
    tokens: names.map(name => ({ name, type: 'color', raw: '#112233ff', value: '#112233ff' })),
  }));
  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].id, 'component.button');
  assert.ok(model.tokens.every(token => token.groupId === 'component.button'));
});

test('new token types and changed composite shapes stay inspectable with explicit diagnostics', () => {
  const tokens = [
    { name: 'future.texture', type: 'texture', raw: { seed: 12 }, value: { seed: 12 } },
    { name: 'future.heading', type: 'typography', raw: '{future.font}', value: { fontFamily: 'different shape' } },
  ];
  const model = createExplorerModel(fixture({ tokens }));
  assert.ok(model.tokens.every(token => token.preview.kind === 'value'));
  assert.deepEqual(model.tokens.map(token => token.value), tokens.map(token => token.value));
  assert.equal(model.sourceIssues.length, 2);
  assert.match(model.sourceIssues.join(' '), /unsupported texture preview/);
  assert.deepEqual(tokens[1].value, { fontFamily: 'different shape' });
});

test('component structures and unfamiliar fields become generic inspectable fields', () => {
  const contract = { components: {
    evolving: { states: { active: { opacity: 1 } }, variants: { compact: { inset: 4 } }, tokens: { label: 'future.label' } },
    scalar: 'A future definition format',
  } };
  const model = createExplorerModel(fixture({ contract }));
  const component = model.components[0];
  assert.equal(component.stateCount, null);
  assert.deepEqual(component.fields.find(field => field.key === 'states').value, contract.components.evolving.states);
  assert.equal(component.fields.find(field => field.key === 'tokens').kind, 'data');
  assert.deepEqual(model.components[1].fields[0].value, contract.components.scalar);
});

test('source references are normalized for contracts, prose, and principles on the producer side', () => {
  const model = createExplorerModel(fixture({
    guide: '## Renamed guidance\nText\n```yaml design:components.workspace\nvalue: true\n```',
    sourceMap: [{ file: 'design/patterns.md', start: 1, end: 5, line: 10 }],
    principles: { intent: ['Intent'], rules: ['Do preserve intent.'], sourceSections: ['Renamed guidance'] },
    documentation: { patterns: [{
      title: 'Custom source binding', expectedHeadings: ['Renamed guidance'], available: true,
      excerpts: [{ title: 'Renamed guidance', body: 'Text', level: 2, line: 1 }],
      contract: { key: 'workspace', value: { value: true } },
    }] },
  }));
  assert.deepEqual(model.documentation.patterns[0].excerpts[0].source, { file: 'design/patterns.md', line: 10 });
  assert.deepEqual(model.documentation.patterns[0].contract.source, { file: 'design/patterns.md', line: 12 });
  assert.deepEqual(model.principles.sources[0].source, { file: 'design/patterns.md', line: 10 });
});

test('unsupported icon shapes retain raw definitions instead of breaking the icon list', () => {
  const model = createExplorerModel(fixture({
    contract: { iconography: { roles: { future: { fontCode: 123, usage: 'Future icon source' } } } },
  }));
  assert.equal(model.iconography.icons[0].glyph, null);
  assert.deepEqual(model.iconography.icons[0].data, { fontCode: 123, usage: 'Future icon source' });
  assert.match(model.sourceIssues.join(' '), /unsupported glyph definition/);
});

test('provenance ignores design block examples nested inside prose code fences', () => {
  const model = createExplorerModel(fixture({
    guide: ['````md', '```yaml design:components.workspace', 'example: true', '```', '````',
      '```yaml design:components.workspace', 'actual: true', '```'].join('\n'),
    documentation: { patterns: [{
      title: 'Composition', expectedHeadings: [], excerpts: [], available: true,
      contract: { key: 'workspace', value: { actual: true } },
    }] },
  }));
  assert.deepEqual(model.documentation.patterns[0].contract.source, { file: 'design.md', line: 6 });
});

test('boundary validation rejects incompatible versions and unsafe or malformed render shapes', () => {
  const model = createExplorerModel(fixture({
    tokens: [{ name: 'measure', type: 'number', raw: 1, value: 1 }],
  }));
  for (const mutate of [
    value => { value.schemaVersion = 2; },
    value => { value.format = 'different'; },
    value => { value.tokens[0].preview.kind = 'typography'; },
    value => { value.tokens[0].source = { file: '../secret', line: 1 }; },
    value => { value.tokens[0].category = 'unrecognized'; },
    value => { value.tokens.push(value.tokens[0]); },
    value => { value.groups = []; },
    value => { value.tokens[0].value = Number.NaN; },
    value => { value.tokens[0].raw = value; },
    value => { value.tokens[0].raw = new Date(); },
    value => { value.view = { section: 'tokens', queries: null }; },
  ]) {
    const changed = structuredClone(model);
    mutate(changed);
    assert.throws(() => assertExplorerModel(changed), /Invalid Explorer contract/);
  }
});

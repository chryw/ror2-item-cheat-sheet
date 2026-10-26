const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test } = require('node:test');
const { parseDesign, readDesignSource, readDesignDocuments, readDesignFile, readDesignArtifact, generatedArtifacts, checkArtifacts } = require('./design-source.cjs');
const { createTokenModel, validateTokens } = require('./design-tokens.cjs');
const { componentContract, tokenCss } = require('./design-preview.cjs');

const source = readDesignSource();
const { guide } = source;
const withoutGuide = parsed => ({
  ...parsed, guide: undefined, documents: undefined, sourceMap: undefined,
});
const spacingTable = guide.match(/^### Token group: tokens\.primitive\.spacing \(dimension\)\r?\n\r?\n(?:\|[^\n]*\n)+/m)[0];
const editSpacing = transform => guide.replace(spacingTable, transform(spacingTable));

function moduleFixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ror2-design-modules-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  source.documents.forEach(({ file, text }) => {
    const target = path.join(directory, ...file.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  });
  return directory;
}

test('Markdown compiles deterministically without a lossy flattened projection or generated guide', () => {
  assert.deepEqual(withoutGuide(parseDesign(guide.replace(/\r?\n/g, '\r\n'))), withoutGuide(source));
  assert.deepEqual(withoutGuide(parseDesign(`${guide}\nAdditional rationale.\n`)), withoutGuide(source));
  assert.deepEqual(generatedArtifacts(source), generatedArtifacts(parseDesign(guide)));
  const model = validateTokens(source.tokens);
  assert.equal(model.tokens.size, 344);
  assert.equal(source.tokens.semantic.typography.body.medium.$value.fontSize, '{primitive.typography.font-size.small}');
  assert.equal(source.tokens.component.searchbox.size['min-block'].$value, '{component.control.size.min-block}');
  assert.deepEqual(source.tokens.primitive.typography['font-family']['sans-serif'].$value.slice(0, 2), ['Segoe UI', 'Inter']);
  assert.equal(source.tokens.$extensions['ror2.design-system'].validationBaseline, undefined);
  assert.deepEqual(readDesignArtifact('design-components.json'), source.components);
  assert.throws(() => readDesignArtifact('unknown.json'), /Unknown compiled design artifact/);
  generatedArtifacts(source).forEach(text => assert.match(JSON.parse(text).$description, /^Generated from design\.md\. DO NOT EDIT/));
});

test('one authored value propagates through aliases, compiled JSON and generated CSS', () => {
  const row = '| `large` | `1rem` |  |';
  assert.equal(spacingTable.split(row).length, 2);
  const changed = parseDesign(editSpacing(table => table.replace(row, '| `large` | `1.125rem` |  |')));
  const model = createTokenModel(changed.tokens);
  assert.deepEqual(model.resolve('semantic.spacing.inset.page').value, { value: 1.125, unit: 'rem' });
  assert.match(tokenCss(model), /--ds-primitive-spacing-large:1\.125rem;/);
  const compiled = JSON.parse(generatedArtifacts(changed).get('design-tokens.json'));
  assert.equal(compiled.primitive.spacing.large.$value.value, 1.125);
  assert.equal(compiled.semantic.spacing.inset.page.$value, '{primitive.spacing.large}');
  assert.deepEqual(changed.tokens.primitive.size, source.tokens.primitive.size);
});

test('authored icon geometry and policy reach the contract and SVG without another code definition', async () => {
  const changed = parseDesign(guide
    .replace(/^viewBox: .+$/m, 'viewBox: 0 0 32 32')
    .replace(/^defaultSize: sm$/m, 'defaultSize: lg')
    .replace(/^lineCap: round$/m, 'lineCap: butt')
    .replace(/^optionSearchThreshold: (\d+)$/m, (_, count) => `optionSearchThreshold: ${Number(count) + 1}`)
    .replace(/^apply: Apply$/m, 'apply: Commit'));
  const contract = componentContract(changed.tokens, changed.components);
  assert.equal(
    contract.selection.optionSearchThreshold,
    source.components.selection.optionSearchThreshold + 1,
  );
  assert.equal(contract.messages.apply, 'Commit');
  const { configureIcons, iconForSlot } = await import(pathToFileURL(path.join(__dirname, 'design-components.mjs')).href);
  const previous = global.document;
  global.document = {
    createElementNS(namespace, tag) {
      return {
        namespace,
        tag,
        attributes: {},
        style: {},
        children: [],
        setAttribute(name, value) { this.attributes[name] = String(value); },
        append(child) { this.children.push(child); },
      };
    },
  };
  try {
    configureIcons(contract.iconography);
    const svg = iconForSlot('closePanel');
    assert.equal(svg.attributes.viewBox, '0 0 32 32');
    assert.equal(svg.attributes.width, '32');
    assert.equal(svg.attributes['stroke-linecap'], 'butt');
    assert.equal(svg.style.width, 'var(--ds-semantic-size-icon-large)');
    assert.equal(svg.children[0].attributes.d, contract.iconography.roles.close.paths[0]);
  } finally {
    configureIcons(source.components.iconography);
    if (previous === undefined) delete global.document;
    else global.document = previous;
  }
});

test('checks reject hand-edited or stale generated outputs and never rewrite the authoring source', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'design-source-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'design.md'), guide);
  assert.equal(checkArtifacts(source, directory), 0);
  generatedArtifacts(source).forEach((text, file) => {
    const target = path.join(directory, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  });
  assert.equal(checkArtifacts(source, directory), 3);
  const output = path.join(directory, 'design-tokens.json');
  const compiled = JSON.parse(fs.readFileSync(output, 'utf8'));
  compiled.primitive.spacing.large.$value.value = 9;
  fs.writeFileSync(output, JSON.stringify(compiled));
  assert.throws(() => checkArtifacts(source, directory), /Stale generated artifact/);
  assert.equal(readDesignSource(directory).tokens.primitive.spacing.large.$value.value, 1);
  assert.equal(fs.readFileSync(path.join(directory, 'design.md'), 'utf8'), guide);
  fs.writeFileSync(output, generatedArtifacts(source).get('design-tokens.json'));
  const changed = parseDesign(editSpacing(table => table.replace('| `large` | `1rem` |  |', '| `large` | `1.125rem` |  |')));
  assert.throws(() => checkArtifacts(changed, directory), /Stale generated artifact/);
});

test('malformed, ambiguous and duplicate authored definitions fail instead of being skipped', () => {
  const row = '| `large` | `1rem` |  |';
  const cases = [
    [editSpacing(table => table.replace(row, `${row}\n${row}`)), /Duplicate design definition/],
    [editSpacing(table => table.replace(row, '| `large` | `1percent` |  |')), /Expected a dimension/],
    [editSpacing(table => table.replace(row, '| `large` | `1rem` | | extra |')), /Invalid token row/],
    [guide.replace('version: 1', 'version: 1\nversion: 1'), /duplicated mapping key/],
    [`${guide}\n\`\`\`yaml design:components.selection\nvalue: duplicate\n\`\`\`\n`, /Duplicate design definition/],
    [`${guide}\n\`\`\`yaml design:components.extra\nvalue: incomplete\n`, /Unclosed design block/],
    [`${guide}\n\`\`\`yaml design:components..extra\nvalue: invalid\n\`\`\`\n`, /Malformed design block/],
    [`${guide}\n### Token group: tokens.invalid..path (color)\n`, /Malformed token group/],
    [guide.replace('### Token group: tokens.primitive.color.neutral (color)', '### Token group: unknown.primitive.color.neutral (color)'), /Unknown design output/],
    ['# Missing definitions\n', /Missing required design definitions/],
  ];
  cases.forEach(([document, expected]) => assert.throws(() => parseDesign(document), expected));
});

test('the explicit module graph stays small, ordered and lossless with real file/line provenance', () => {
  assert.ok(source.documents[0].text.split('\n').length < 100);
  assert.ok(source.documents.length > 1);
  assert.ok(source.documents.slice(1).every(document => document.text.split('\n').length <= 350));
  assert.deepEqual(readDesignDocuments().sourceMap, source.sourceMap);
  assert.deepEqual(generatedArtifacts(parseDesign(guide)), generatedArtifacts(source));
  const compiled = guide.split('\n');
  let next = 1;
  source.sourceMap.forEach(segment => {
    assert.equal(segment.start, next);
    const original = source.documents.find(document => document.file === segment.file).text.replace(/\r\n/g, '\n').split('\n');
    for (let line = segment.start; line <= segment.end; line++) {
      assert.equal(compiled[line - 1], original[segment.line + line - segment.start - 1]);
    }
    next = segment.end + 1;
  });
  assert.equal(next, compiled.length + 1);
});

test('saved module edits propagate through aliases and CSS, and diagnostics identify their authored file', t => {
  const directory = moduleFixture(t);
  const layout = path.join(directory, 'design', 'layout.md');
  const original = fs.readFileSync(layout, 'utf8');
  const row = '| `large` | `1rem` |  |';
  assert.equal(original.split(row).length, 2);
  fs.writeFileSync(layout, original.replace(row, '| `large` | `1.125rem` |  |'));
  const changed = readDesignSource(directory);
  assert.deepEqual(createTokenModel(changed.tokens).resolve('semantic.spacing.inset.page').value, {
    value: 1.125, unit: 'rem',
  });
  assert.match(tokenCss(createTokenModel(changed.tokens)), /--ds-primitive-spacing-large:1\.125rem;/);
  fs.writeFileSync(layout, original.replace(row, '| `large` | `1percent` |  |'));
  assert.throws(() => readDesignSource(directory), /design\/layout\.md:\d+: Expected a dimension/);
  fs.writeFileSync(layout, '```yaml design:tokens\nincomplete:');
  assert.throws(() => readDesignSource(directory), /Unclosed Markdown code fence: design\/layout\.md/);
  assert.equal(readDesignFile('design/layout.md', directory), '```yaml design:tokens\nincomplete:');
});

test('module imports reject missing, duplicate, nested and unsafe sources without directory scanning', t => {
  const directory = moduleFixture(t);
  const index = path.join(directory, 'design.md');
  const original = fs.readFileSync(index, 'utf8');
  fs.writeFileSync(path.join(directory, 'design', 'unlisted.md'), '### Token group: invalid');
  assert.deepEqual(generatedArtifacts(readDesignSource(directory)), generatedArtifacts(source));
  assert.throws(() => readDesignFile('design/unlisted.md', directory), /Unknown design source/);
  fs.writeFileSync(index, `${original}\n- [Duplicate](design/colors.md) <!-- design:include -->\n`);
  assert.throws(() => readDesignSource(directory), /Duplicate design module/);
  ['../package.json', 'https://example.com/colors.md', 'design/../colors.md', 'design\\colors.md'].forEach(file => {
    fs.writeFileSync(index, `- [Unsafe](${file}) <!-- design:include -->\n`);
    assert.throws(() => readDesignSource(directory), /Invalid design include/);
    assert.throws(() => readDesignFile(file, directory), /Unknown design source/);
  });
  fs.writeFileSync(index, original);
  const layout = path.join(directory, 'design', 'layout.md');
  fs.appendFileSync(layout, '\n- [Nested](design/colors.md) <!-- design:include -->\n');
  assert.throws(() => readDesignSource(directory), /Nested design include/);
  fs.unlinkSync(layout);
  assert.throws(() => readDesignSource(directory), /ENOENT/);
});

test('fenced import examples are not imports and symlinks cannot escape the source root', t => {
  const directory = moduleFixture(t);
  fs.appendFileSync(path.join(directory, 'design.md'), '\n```md\n- [Example](design/not-imported.md) <!-- design:include -->\n```\n');
  assert.deepEqual(generatedArtifacts(readDesignSource(directory)), generatedArtifacts(source));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ror2-design-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'outside.md'), 'Must not be imported.');
  fs.symlinkSync(outside, path.join(directory, 'design', 'escape'), 'junction');
  fs.appendFileSync(path.join(directory, 'design.md'), '\n- [Escape](design/escape/outside.md) <!-- design:include -->\n');
  assert.throws(() => readDesignSource(directory), /escapes repository/);
  assert.throws(() => readDesignFile('design/escape/outside.md', directory), /escapes repository/);
});

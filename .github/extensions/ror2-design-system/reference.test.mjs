import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDocumentation, categories, documentationSlots, extractGuideSections, pages, searchableLists, tokenCategory, tokenGroup } from './reference.mjs';

test('navigation is flat with unique pages and subordinate token categories', () => {
  assert.equal(pages.length, new Set(pages.map(page => page.id)).size);
  assert.ok(pages.every(page => typeof page.id === 'string' && !('pages' in page)));
  for (const id of ['principles', 'tokens', 'theming', 'components', 'patterns', 'accessibility', 'content', 'layout', 'iconography', 'assets', 'adoption']) {
    assert.ok(pages.some(page => page.id === id));
  }
  assert.ok(!pages.some(page => ['overview', 'guide', 'colors', 'typography'].includes(page.id)));
  for (const id of Object.keys(documentationSlots)) assert.ok(pages.some(page => page.id === id));
  assert.equal(categories.length, new Set(categories.map(category => category.id)).size);
  assert.equal(pages.find(page => page.id === 'tokens').title, 'Tokens');
  assert.equal(pages.find(page => page.id === 'iconography').title, 'Iconography');
  assert.equal(pages.find(page => page.id === 'assets').title, 'Assets');
  assert.deepEqual(Object.keys(searchableLists), ['tokens', 'components', 'iconography']);
});

test('token categories are exhaustive, non-overlapping, and distinguish effects and motion from sizing', () => {
  const cases = [
    ['color', 'semantic.color.text', 'colors'],
    ['dimension', 'primitive.typography.font-size.small', 'typography'],
    ['typography', 'semantic.typography.body.medium', 'typography'],
    ['dimension', 'component.button.radius', 'effects'],
    ['number', 'primitive.opacity.disabled', 'effects'],
    ['dimension', 'primitive.elevation.offset', 'effects'],
    ['duration', 'primitive.duration.fast', 'motion'],
    ['number', 'semantic.motion.scale', 'motion'],
    ['dimension', 'primitive.spacing.small', 'geometry'],
    ['number', 'context.density.compact.scale', 'geometry'],
    ['futureType', 'future.decision', 'other'],
  ];
  for (const [type, name, expected] of cases) assert.equal(tokenCategory({ type, name }), expected);
});

test('guide extraction handles hierarchy, CRLF, frontmatter, and both code-fence styles without inventing headings', () => {
  const guide = [
    '---', '## Hidden metadata', '---', '## Layout', 'Layout prose.',
    '### Responsive contract', 'Keep content readable.', '```md', '## Fake heading', '```',
    '~~~md', '### Fake subsection', '~~~', '#### Example', '- Nested guidance.',
    '## Accessibility', 'Keyboard guidance.',
  ].join('\r\n');
  const sections = extractGuideSections(guide);
  assert.deepEqual(sections.map(section => section.title), ['Layout', 'Responsive contract', 'Example', 'Accessibility']);
  assert.ok(sections[0].body.includes('### Responsive contract'));
  assert.ok(sections[1].body.includes('#### Example'));
  assert.ok(!sections[1].body.includes('Keyboard guidance'));
  assert.equal(sections[3].body, 'Keyboard guidance.');
  assert.deepEqual(sections.map(section => section.line), [4, 6, 14, 16]);
});

test('color groups expose global palettes and intent/application roles without hiding control states', () => {
  const cases = [
    ['primitive.color.neutral.step-100', 'primitive.color.neutral'],
    ['primitive.color.shared.red-bright', 'primitive.color.shared'],
    ['primitive.color.alpha.ink-16', 'primitive.color.alpha'],
    ['semantic.color.neutral.foreground.primary', 'semantic.color.neutral.foreground'],
    ['semantic.color.neutral.background.control.hover', 'semantic.color.neutral.background'],
    ['semantic.color.brand.background.solid.rest', 'semantic.color.brand.background'],
    ['semantic.color.status.danger.foreground', 'semantic.color.status.danger'],
    ['semantic.color.decorative.foreground.blue', 'semantic.color.decorative.foreground'],
    ['context.theme.light.color.brand.background.solid.rest', 'context.theme.light.color.brand.background'],
    ['context.theme.dark-ror2.color.decorative.foreground.red-bright', 'context.theme.dark-ror2.color.decorative.foreground'],
    ['component.button.variant.primary.color.background', 'component.button'],
    ['component.button.state.hover.color.background', 'component.button'],
    ['tenant.ror2.component.item-card.part.title.color.foreground', 'tenant.ror2.component.item-card'],
    ['tenant.ror2.color.rarity.common', 'tenant.ror2.color.rarity'],
  ];
  for (const [name, expected] of cases) {
    const group = tokenGroup({ name, type: 'color' });
    assert.equal(group, expected);
    assert.ok(name.startsWith(`${group}.`));
  }
});

test('optional reference areas expose missing source, populate independently, and preserve canonical text and contracts', () => {
  const missing = buildDocumentation('## Unrelated\nSome guidance.', {});
  for (const slots of Object.values(missing)) {
    assert.ok(slots.every(slot => !slot.available && !slot.contract && slot.excerpts.length === 0));
  }
  const workspace = { compact: ['Preserve the query.'], wide: { panels: 'May coexist.' } };
  const guide = '### Responsive contract\nSource-owned layout rules.\n## Accessibility\nSource-owned keyboard rules.\n### Contributing\nSource-owned contribution process.';
  const populated = buildDocumentation(guide, { workspace });
  assert.deepEqual(populated.layout[0].excerpts, [{ title: 'Responsive contract', level: 3, line: 1, body: 'Source-owned layout rules.' }]);
  assert.equal(populated.accessibility[0].excerpts[0].body, 'Source-owned keyboard rules.\n### Contributing\nSource-owned contribution process.');
  assert.equal(populated.adoption[1].available, true);
  assert.equal(populated.adoption[2].available, false);
  assert.equal(populated.patterns[0].available, true);
  assert.deepEqual(populated.patterns[0].contract, { key: 'workspace', value: workspace });
  assert.equal(populated.patterns[1].available, false);
  assert.deepEqual(buildDocumentation(guide, { workspace: {}, acceptance: [] }).patterns.map(slot => slot.available), [false, false, false, false]);
  const structured = buildDocumentation('', { controlRecipes: { button: ['label', 'icon'] }, interactionAlgorithms: { select: ['open', 'commit'] }, iconography: { icons: ['search'] } });
  assert.deepEqual(structured.patterns[1].contract.value, { button: ['label', 'icon'] });
  assert.deepEqual(structured.patterns[2].contract.value, { select: ['open', 'commit'] });
  assert.deepEqual(structured.iconography[0].contract.value, { icons: ['search'] });
  assert.equal(structured.assets[0].available, false);
  const separated = buildDocumentation('## Iconography\nUI icon guidance.\n## Asset catalog\nArtwork guidance.\n## Themes\nSystem theme guidance.', {});
  assert.equal(separated.iconography[0].excerpts[0].body, 'UI icon guidance.');
  assert.equal(separated.assets[0].excerpts[0].body, 'Artwork guidance.');
  assert.equal(separated.theming[0].excerpts[0].body, 'System theme guidance.');
  assert.deepEqual(buildDocumentation(guide, { workspace }), populated);
});

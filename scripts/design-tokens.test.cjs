const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  createTokenModel, colorHex, exportColors, validateTokens, scaleDimension,
} = require('./design-tokens.cjs');
const { readDesignSource } = require('./design-source.cjs');

const { tokens: source } = readDesignSource();
const copy = () => JSON.parse(JSON.stringify(source));
const model = createTokenModel(source);

test('hex8 authoring preserves every alpha byte and exports numeric colors without losing aliases', () => {
  model.tokens.forEach((token, name) => {
    if (token.type === 'color' && !token.value.startsWith('{')) {
      assert.match(token.value, /^#[0-9a-f]{8}$/i, name);
      assert.equal(colorHex(model.resolve(name).value), token.value.toLowerCase());
    }
  });
  const exported = exportColors(source);
  assert.deepEqual(exported.primitive.color.neutral['step-0'].$value, {
    colorSpace: 'srgb', components: [1, 1, 1], alpha: 1,
  });
  assert.equal(
    exported.semantic.color.brand.foreground.primary.$value,
    source.semantic.color.brand.foreground.primary.$value,
  );
  assert.equal(exported.context.theme['dark-ror2'].color.decorative.foreground.white.$value.colorSpace, 'srgb');
  Array.from({ length: 256 }, (_, alpha) => alpha).forEach(alpha => {
    const input = copy();
    const hex = `#123456${alpha.toString(16).padStart(2, '0')}`;
    input.primitive.color.alpha['ink-60'].$value = hex;
    assert.equal(colorHex(createTokenModel(input).resolve('primitive.color.alpha.ink-60').value), hex);
  });
  ['#fff', '#112233', '#1122334455', '#GG112233', [1, 1, 1], { colorSpace: 'srgb', components: [1, 1, 1] }].forEach(value => {
    const input = copy();
    input.primitive.color.shared.red.$value = value;
    assert.throws(() => createTokenModel(input), /RRGGBBAA/);
  });
});

function linearRgb(color) {
  return color.components.map(channel => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
}

function luminance(color) {
  const linear = linearRgb(color);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function oklch(color) {
  const [red, green, blue] = linearRgb(color);
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const hue = Math.atan2(b, a) * (180 / Math.PI);
  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    chroma: Math.hypot(a, b),
    hue: (hue + 360) % 360,
  };
}

test('primitives are general, fully resolved, and separate spacing from other dimensions', () => {
  const spacingNames = Object.keys(source.primitive.spacing).filter(key => !key.startsWith('$'));
  assert.deepEqual(spacingNames, [
    'none', 'fine', 'extra-small', 'small', 'medium', 'large', 'extra-large', 'extra-extra-large', 'spacious', 'expansive',
  ]);
  ['size', 'layout', 'typography', 'stroke-width', 'radius', 'scale'].forEach(group => {
    assert.ok(source.primitive[group], `Missing foundation category: ${group}`);
  });
  Array.from(model.tokens.keys()).forEach(name => {
    assert.ok(model.resolve(name).type, name);
    assert.doesNotMatch(name, /(?:^|\.)s\d+(?:\.|$)/);
    if (name.startsWith('primitive.')) {
      assert.doesNotMatch(name, /rarity|boss|legendary|catalog|item|equipment|dlc/);
    }
  });
});

test('the ANSI palette has exactly eight normal/bright pairs and no extra hue ramps', () => {
  const normal = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const expected = [...normal, ...normal.map(name => `${name}-bright`)];
  const actual = Object.keys(source.semantic.color.decorative.foreground).filter(name => !name.startsWith('$'));
  assert.deepEqual(actual, expected);
  const hex = actual.map(name => colorHex(model.resolve(`semantic.color.decorative.foreground.${name}`).value));
  assert.equal(new Set(hex).size, 16);
  normal.forEach(name => {
    const base = oklch(model.resolve(`primitive.color.shared.${name}`).value);
    const bright = oklch(model.resolve(`primitive.color.shared.${name}-bright`).value);
    assert.ok(bright.lightness > base.lightness, name);
  });
});

test('ANSI hue pairs share harmonious perceptual lightness and chroma', () => {
  const hues = { red: 25, green: 145, yellow: 95, blue: 260, magenta: 325, cyan: 205 };
  Object.entries(hues).forEach(([name, expectedHue]) => {
    [
      [name, 0.47, 0.075],
      [`${name}-bright`, 0.8, 0.1],
    ].forEach(([key, lightness, chroma]) => {
      const measured = oklch(model.resolve(`primitive.color.shared.${key}`).value);
      assert.ok(Math.abs(measured.lightness - lightness) < 0.002, `${key} lightness`);
      assert.ok(Math.abs(measured.chroma - chroma) < 0.002, `${key} chroma`);
      const delta = Math.abs(measured.hue - expectedHue);
      assert.ok(Math.min(delta, 360 - delta) < 1, `${key} hue`);
    });
  });
  ['black', 'black-bright', 'white', 'white-bright'].forEach(name => {
    assert.ok(oklch(model.resolve(`primitive.color.shared.${name}`).value).chroma < 0.015);
  });
});

test('brand, decorative and status palettes own independent aliases and may share primitives', () => {
  const changed = copy();
  changed.semantic.color.decorative.foreground['blue-bright'].$value = '{primitive.color.shared.red-bright}';
  const decorative = createTokenModel(changed);
  assert.deepEqual(decorative.resolve('semantic.color.brand.foreground.primary'), model.resolve('semantic.color.brand.foreground.primary'));
  assert.deepEqual(decorative.resolve('semantic.color.status.danger.foreground'), model.resolve('semantic.color.status.danger.foreground'));
  changed.semantic.color.brand.foreground.primary.$value = '{primitive.color.shared.magenta-bright}';
  const branded = createTokenModel(changed);
  assert.deepEqual(branded.resolve('semantic.color.decorative.foreground.blue-bright'), decorative.resolve('semantic.color.decorative.foreground.blue-bright'));
  assert.deepEqual(branded.resolve('semantic.color.status.danger.foreground'), model.resolve('semantic.color.status.danger.foreground'));
  changed.primitive.color.shared.azure = source.primitive.color.shared['blue-bright'];
  changed.semantic.color.brand.foreground.primary.$value = '{primitive.color.shared.azure}';
  const extended = createTokenModel(changed);
  assert.deepEqual(extended.resolve('semantic.color.brand.foreground.primary'), model.resolve('semantic.color.brand.foreground.primary'));
  assert.equal(Object.keys(changed.semantic.color.decorative.foreground).filter(name => !name.startsWith('$')).length, 16);
  assert.deepEqual(model.resolve('semantic.color.brand.foreground.accent'), model.resolve('semantic.color.status.information.foreground'));
});

test('brand and status colors harmonize with each theme decorative intensity band', () => {
  ['dark', 'light'].forEach(theme => {
    const themed = createTokenModel(source, theme, { allowPlanned: true });
    const lightness = theme === 'dark' ? 0.8 : 0.47;
    const chroma = theme === 'dark' ? 0.1 : 0.075;
    [
      'brand.foreground.primary', 'brand.foreground.accent', 'status.danger.foreground', 'status.caution.foreground',
      'status.success.foreground', 'status.information.foreground',
    ].forEach(name => {
      const measured = oklch(themed.resolve(`semantic.color.${name}`).value);
      assert.ok(Math.abs(measured.lightness - lightness) < 0.002, `${theme} ${name} lightness`);
      assert.ok(Math.abs(measured.chroma - chroma) < 0.002, `${theme} ${name} chroma`);
    });
  });
});

test('dark-ror2 supplies fork rarity colors through decorative aliases without coupling brand or status', () => {
  const expected = {
    common: '#b8c1c7ff',
    uncommon: '#91cb72ff',
    legendary: '#ff8a7bff',
    boss: '#d1d974ff',
    void: '#e78ab7ff',
    lunar: '#78cde5ff',
    equipment: '#edb66cff',
    hallowed: '#b499ffff',
    hex: '#bde472ff',
    page: '#d2bd8bff',
    'elite-equipment': '#edb66cff',
    'lunar-equipment': '#78cde5ff',
  };
  const changed = copy();
  changed.semantic.color.brand.foreground.primary.$value = '{primitive.color.shared.red-bright}';
  changed.semantic.color.status.caution.foreground.$value = '{primitive.color.shared.red-bright}';
  changed.semantic.color.decorative.foreground['yellow-bright'].$value = '{primitive.color.shared.blue-bright}';
  const models = [
    createTokenModel(source, 'dark-ror2'), createTokenModel(changed, 'dark-ror2'),
  ];
  models.forEach(themed => {
    Object.entries(expected).forEach(([rarity, color]) => {
      assert.equal(colorHex(themed.resolve(`tenant.ror2.color.rarity.${rarity}`).value), color);
    });
  });
  assert.equal(source.tenant.ror2.color.rarity['elite-equipment'].$value, '{tenant.ror2.color.rarity.equipment}');
  assert.equal(source.tenant.ror2.color.rarity['lunar-equipment'].$value, '{tenant.ror2.color.rarity.lunar}');
});

test('dark is the reusable base, dark-ror2 extends it, and planned light requires opt-in', () => {
  assert.equal(model.theme, 'dark');
  assert.equal(model.themeStatus, 'active');
  assert.deepEqual(model.activeThemes, ['dark', 'dark-ror2']);
  const ror2 = createTokenModel(source, 'dark-ror2');
  assert.deepEqual(ror2.themeChain, ['dark', 'dark-ror2']);
  assert.equal(colorHex(ror2.resolve('semantic.color.brand.foreground.primary').value), '#dfff00ff');
  assert.deepEqual(ror2.resolve('semantic.color.neutral.background.panel'), model.resolve('semantic.color.neutral.background.panel'));
  assert.deepEqual(ror2.resolve('semantic.color.status.success.foreground'), model.resolve('semantic.color.status.success.foreground'));
  assert.notDeepEqual(ror2.resolve('semantic.color.decorative.foreground.green'), model.resolve('semantic.color.decorative.foreground.green'));
  assert.throws(() => createTokenModel(source, 'light'), /planned, not active/);
  assert.throws(() => createTokenModel(source, 'unknown'), /Unknown theme/);
  assert.equal(createTokenModel(source, 'light', { allowPlanned: true }).themeStatus, 'planned');
  const promoted = copy();
  promoted.$extensions['ror2.design-system'].themes.light.status = 'active';
  assert.equal(createTokenModel(promoted, 'light').themeStatus, 'active');
  assert.deepEqual(createTokenModel(promoted).activeThemes, ['dark', 'dark-ror2', 'light']);
  const cyclic = copy();
  cyclic.$extensions['ror2.design-system'].themes.dark.extends = 'dark-ror2';
  assert.throws(() => createTokenModel(cyclic), /Theme inheritance cycle/);
  const missing = copy();
  missing.$extensions['ror2.design-system'].themes['dark-ror2'].extends = 'missing';
  assert.throws(() => createTokenModel(missing), /Unknown parent theme/);
});

test('component aliases inherit semantic themes rather than capturing raw values', () => {
  const light = createTokenModel(source, 'light', { allowPlanned: true });
  assert.equal(colorHex(model.resolve('component.searchbox.color.foreground').value), '#f0f1e8ff');
  assert.equal(colorHex(light.resolve('component.searchbox.color.foreground').value), '#171a20ff');
  [model, light].forEach(themed => {
    assert.deepEqual(themed.resolve('semantic.color.brand.foreground.link.rest'), themed.resolve('semantic.color.brand.foreground.primary'));
    assert.deepEqual(themed.resolve('semantic.color.brand.stroke.focus'), themed.resolve('semantic.color.brand.foreground.primary'));
    assert.deepEqual(themed.resolve('tenant.ror2.component.item-card.color.background'), themed.resolve('semantic.color.neutral.background.panel'));
  });
});

test('density and independent scale axes derive dimensions exactly once', () => {
  assert.deepEqual(scaleDimension(model, 'component.searchbox.spacing.padding-inline', 'spacing'), { value: 0.75, unit: 'rem' });
  assert.deepEqual(scaleDimension(model, 'component.searchbox.spacing.padding-inline', 'spacing', 'compact'), { value: 0.5625, unit: 'rem' });
  assert.deepEqual(scaleDimension(model, 'tenant.ror2.component.item-card.size.artwork', 'size', 'compact'), { value: 2.4375, unit: 'rem' });
  assert.deepEqual(scaleDimension(model, 'semantic.radius.card', 'radius', 'compact'), { value: 0.46875, unit: 'rem' });
  assert.deepEqual(scaleDimension(model, 'primitive.typography.font-size.medium', 'typography', 'compact'), { value: 1, unit: 'rem' });
  const changed = copy();
  changed.semantic.scale.spacing.$value = '{primitive.scale.enlarged}';
  const scaled = createTokenModel(changed);
  assert.deepEqual(scaleDimension(scaled, 'component.searchbox.spacing.padding-inline', 'spacing', 'compact'), { value: 0.703125, unit: 'rem' });
  assert.deepEqual(scaleDimension(scaled, 'primitive.typography.font-size.medium', 'typography'), { value: 1, unit: 'rem' });
  assert.deepEqual(scaleDimension(scaled, 'semantic.size.artwork.thumbnail', 'size'), { value: 3.25, unit: 'rem' });
  changed.semantic.scale.typography.$value = '{primitive.scale.enlarged}';
  const largerType = createTokenModel(changed);
  assert.deepEqual(scaleDimension(largerType, 'primitive.typography.font-size.medium', 'typography', 'compact'), { value: 1.25, unit: 'rem' });
  assert.equal(largerType.resolve('semantic.typography.body.medium').value.fontWeight, 400);
  assert.equal(largerType.resolve('semantic.typography.body.medium').value.lineHeight, 1.5);
});

test('hit targets, pill geometry, strokes, breakpoints and layout measures do not scale', () => {
  [
    ['semantic.size.target.minimum', 'size'],
    ['component.icon-button.size.min-block-size', 'size'],
    ['semantic.radius.chip', 'radius'],
    ['semantic.stroke-width.control', 'size'],
    ['primitive.layout.breakpoint.medium', 'size'],
    ['semantic.layout.panel.inline-size', 'size'],
  ].forEach(([name, axis]) => {
    assert.throws(() => scaleDimension(model, name, axis, 'compact'), /Protected dimension|Wrong scale axis/);
  });
  assert.throws(() => scaleDimension(model, 'semantic.spacing.gap.icon', 'size'), /Wrong scale axis/);
  assert.throws(() => scaleDimension(model, 'semantic.spacing.gap.icon', 'spacing', 'unknown'), /Unknown density/);
  assert.throws(() => scaleDimension(model, 'semantic.spacing.gap.icon', 'unknown'), /Unknown scale axis/);
});

test('invalid references, cycles, layer leaks, primitive names, types and factors fail explicitly', () => {
  const cases = [
    ['semantic.color.brand.foreground.primary.$value', '{primitive.color.missing}', /Unknown token reference/],
    ['semantic.color.brand.foreground.primary.$value', '{semantic.color.brand.foreground.primary}', /Token cycle/],
    ['semantic.color.brand.foreground.primary.$value', '{tenant.ror2.color.rarity.boss}', /Forbidden dependency/],
    ['component.control.color.background.$value', '{tenant.ror2.color.rarity.boss}', /Forbidden dependency/],
    ['semantic.color.brand.foreground.primary.$value', '{semantic.color.decorative.foreground.blue-bright}', /Palette intent/],
    ['semantic.color.status.danger.foreground.$value', '{semantic.color.brand.foreground.primary}', /Palette intent/],
    ['tenant.ror2.color.rarity.boss.$value', '{semantic.color.status.caution.foreground}', /Tenant colors/],
    ['tenant.ror2.color.rarity.boss.$value', '{tenant.other.color.rarity.boss}', /Cross-tenant/],
    ['tenant.ror2.component.item-card.color.background.$value', '#ffffff', /must alias/],
    ['primitive.color.shared.rarity-boss', source.primitive.color.shared.blue, /Product concept/],
    ['primitive.spacing.s1', source.primitive.spacing['extra-small'], /abbreviated token name/],
    ['semantic.color.neutral.foreground.primary.$value', '{primitive.size.icon.small}', /type mismatch/],
    ['primitive.size.icon.small.$value.unit', 'percent', /Invalid dimension/],
    ['primitive.scale.base.$value', 0, /positive and dimensionless/],
    ['primitive.scale.base.$value', '1', /Invalid number/],
    ['primitive.scale.enlarged.$value', -1, /positive and dimensionless/],
    ['context.theme.light.color.neutral.foreground.unknown', source.context.theme.light.color.neutral.foreground.primary, /Unknown theme role/],
    ['semantic.color.brand.foreground.primary.$value', '#ffffff', /must alias/],
    ['semantic.typography.body.medium.$value.fontWeight', 400, /must alias/],
  ];
  cases.forEach(([name, value, expected]) => {
    const input = copy();
    const parts = name.split('.');
    const target = parts.slice(0, -1).reduce((node, key) => node[key], input);
    target[parts[parts.length - 1]] = value;
    assert.throws(() => createTokenModel(input), expected);
  });
  const invalidMetadata = copy();
  invalidMetadata.$extensions['ror2.design-system'].defaultDensity = 'unknown';
  assert.throws(() => createTokenModel(invalidMetadata), /Unsupported default theme or density/);
});

test('base dark, dark-ror2 and planned light meet all 117 contrast contracts', () => {
  let checks = 0;
  ['light', 'dark', 'dark-ror2'].forEach(theme => {
    const themed = createTokenModel(source, theme, { allowPlanned: true });
    const pairs = [];
    ['neutral.background.canvas', 'neutral.background.panel', 'neutral.background.control.rest', 'neutral.background.control.hover', 'neutral.background.control.pressed'].forEach(background => {
      ['neutral.foreground.primary', 'neutral.foreground.secondary'].forEach(foreground => pairs.push([foreground, background, 4.5]));
    });
    ['neutral.foreground.primary', 'neutral.foreground.secondary', 'brand.foreground.control.selected'].forEach(foreground => pairs.push([foreground, 'neutral.background.control.selected', 4.5]));
    pairs.push(['neutral.foreground.disabled', 'neutral.background.control.disabled', 4.5]);
    pairs.push(['neutral.foreground.on-brand', 'brand.background.solid.rest', 4.5]);
    ['neutral.background.canvas', 'neutral.background.panel', 'neutral.background.control.rest', 'neutral.background.control.hover', 'neutral.background.control.pressed', 'neutral.background.control.selected'].forEach(background => pairs.push(['brand.stroke.focus', background, 3]));
    ['neutral.background.control.rest', 'neutral.background.control.hover', 'neutral.background.control.pressed'].forEach(background => pairs.push(['neutral.stroke.control.rest', background, 3]));
    pairs.push(['brand.stroke.control.selected', 'neutral.background.control.selected', 3]);
    ['brand.foreground.link.rest', 'brand.foreground.primary', 'brand.foreground.accent', 'status.danger.foreground', 'status.success.foreground', 'status.caution.foreground', 'status.information.foreground'].forEach(foreground => {
      ['neutral.background.panel', 'neutral.background.canvas'].forEach(background => pairs.push([foreground, background, 4.5]));
    });
    pairs.forEach(([foreground, background, minimum]) => {
      const a = luminance(themed.resolve(`semantic.color.${foreground}`).value);
      const b = luminance(themed.resolve(`semantic.color.${background}`).value);
      const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(contrast >= minimum, `${theme}: ${foreground} on ${background} = ${contrast}`);
      checks++;
    });
  });
  assert.equal(checks, 117);
});

test('tenant rarity labels meet 24 additional foreground contrast contracts', () => {
  const themed = createTokenModel(source, 'dark-ror2');
  const rarities = Object.keys(source.tenant.ror2.color.rarity).filter(name => !name.startsWith('$'));
  let checks = 0;
  rarities.forEach(rarity => {
    const foreground = luminance(themed.resolve(`tenant.ror2.color.rarity.${rarity}`).value);
    ['neutral.background.canvas', 'neutral.background.panel'].forEach(surface => {
      const background = luminance(themed.resolve(`semantic.color.${surface}`).value);
      assert.ok((Math.max(foreground, background) + 0.05)
        / (Math.min(foreground, background) + 0.05) >= 4.5, `${rarity} on ${surface}`);
      checks++;
    });
  });
  assert.equal(checks, 24);
});

test('validation includes planned themes even when they are not active', () => {
  const cycle = copy();
  cycle.context.theme.light.color.brand.foreground.primary.$value = '{semantic.color.brand.foreground.primary}';
  assert.throws(() => validateTokens(cycle), /Token cycle/);
  const invalid = copy();
  invalid.context.theme.light.color.neutral.foreground.primary.$value = '{primitive.size.icon.small}';
  assert.throws(() => validateTokens(invalid), /type mismatch/);
  delete invalid.context.theme.light.color.$type;
  assert.throws(() => validateTokens(invalid), /type mismatch/);
});

test('taxonomy keeps contexts orthogonal and component part, variant and state axes explicit', () => {
  assert.deepEqual(Object.keys(source).filter(key => !key.startsWith('$')).sort(), [
    'component', 'context', 'primitive', 'semantic', 'tenant',
  ]);
  assert.deepEqual(model.resolve('component.button.variant.primary.color.background'), model.resolve('semantic.color.brand.background.solid.rest'));
  assert.deepEqual(model.resolve('component.select.part.option.state.selected.color.background'), model.resolve('semantic.color.neutral.background.control.selected'));
  assert.deepEqual(model.resolve('component.data-table.part.header.typography'), model.resolve('semantic.typography.label'));
  assert.deepEqual(model.resolve('semantic.spacing.offset.focus-ring').value, { value: 2, unit: 'px' });
  assert.equal(source.semantic.spacing.offset['focus-ring'].$value, '{primitive.spacing.fine}');
  assert.throws(() => scaleDimension(model, 'semantic.spacing.offset.focus-ring', 'spacing', 'compact'), /Protected dimension/);
  assert.throws(() => model.resolve('component.button-primary.background-color'), /Unknown token/);
  assert.throws(() => model.resolve('theme.light.color.text-primary'), /Unknown token/);
});

test('ambiguous categories, encoded axes, property types and CSS-name collisions fail validation', () => {
  const category = copy();
  category.primitive.measure = { tiny: source.primitive.layout['inline-size']['extra-small'] };
  assert.throws(() => createTokenModel(category), /Unknown primitive token category/);
  const sibling = copy();
  sibling.component['button-primary'] = source.component.button.variant.primary;
  assert.throws(() => createTokenModel(sibling), /must be a named axis/);
  const order = copy();
  order.component.button.state = {
    hover: { part: { icon: { color: { foreground: { $value: '{semantic.color.neutral.foreground.primary}' } } } } },
  };
  assert.throws(() => createTokenModel(order), /property\/axis order/);
  const type = copy();
  type.component.button.color.background.$value = '{semantic.spacing.gap.icon}';
  assert.throws(() => createTokenModel(type), /Component property type mismatch/);
  const collision = copy();
  collision.primitive.radius['test-shape'] = source.primitive.radius.small;
  collision.primitive.radius.test = { shape: source.primitive.radius.small };
  assert.throws(() => createTokenModel(collision), /CSS token name collision/);
  const context = copy();
  context.context.unsupported = { size: { $type: 'number', $value: 1 } };
  assert.throws(() => createTokenModel(context), /Unknown token context/);
});

test('density contexts are data-driven and independent from theme selection', () => {
  const input = copy();
  input.context.density.spacious = {
    $type: 'number',
    ...Object.fromEntries(['spacing', 'size', 'radius', 'typography']
      .map(axis => [axis, { $value: '{primitive.scale.enlarged}' }])),
  };
  input.$extensions['ror2.design-system'].defaultDensity = 'spacious';
  ['dark', 'dark-ror2', 'light'].forEach(theme => {
    const themed = createTokenModel(input, theme, { allowPlanned: true });
    assert.deepEqual(scaleDimension(themed, 'semantic.spacing.gap.icon', 'spacing'), {
      value: 0.625, unit: 'rem',
    });
    assert.deepEqual(themed.resolve('semantic.spacing.gap.icon').value, { value: 0.5, unit: 'rem' });
  });
  delete input.context.density.spacious.radius;
  assert.throws(() => createTokenModel(input), /Unknown token reference/);
});

test('Fluent-style globals separate neutral, shared and alpha palettes with an ordered neutral ramp', () => {
  assert.deepEqual(Object.keys(source.primitive.color), ['neutral', 'shared', 'alpha']);
  const ramp = Object.keys(source.primitive.color.neutral).filter(key => !key.startsWith('$'));
  let previous = Infinity;
  ramp.forEach(step => {
    const { value } = model.resolve(`primitive.color.neutral.${step}`);
    assert.equal(value.alpha, 1);
    assert.ok(luminance(value) < previous, step);
    previous = luminance(value);
  });
  Object.keys(source.primitive.color.shared).filter(key => !key.startsWith('$')).forEach(name => {
    assert.equal(model.resolve(`primitive.color.shared.${name}`).value.alpha, 1, name);
  });
  Object.keys(source.primitive.color.alpha).filter(key => !key.startsWith('$')).forEach(name => {
    assert.ok(model.resolve(`primitive.color.alpha.${name}`).value.alpha < 1, name);
  });
});

test('brand foreground, filled background and stroke are independently themeable decisions', () => {
  const changed = copy();
  changed.semantic.color.brand.foreground.primary.$value = '{primitive.color.shared.red-bright}';
  changed.context.theme['dark-ror2'].color.brand.foreground.primary.$value = '{primitive.color.shared.cyan-bright}';
  ['dark', 'dark-ror2'].forEach(theme => {
    const before = createTokenModel(source, theme);
    const after = createTokenModel(changed, theme);
    assert.notDeepEqual(after.resolve('semantic.color.brand.foreground.primary'), before.resolve('semantic.color.brand.foreground.primary'));
    assert.deepEqual(after.resolve('semantic.color.brand.foreground.link.rest'), after.resolve('semantic.color.brand.foreground.primary'));
    ['semantic.color.brand.background.solid.rest', 'semantic.color.brand.stroke.control.selected',
      'semantic.color.brand.stroke.focus', 'component.button.variant.primary.color.background'].forEach(name => {
      assert.deepEqual(after.resolve(name), before.resolve(name), name);
    });
  });
  assert.equal(source.component.button.variant.primary.color.background.$value, '{semantic.color.brand.background.solid.rest}');
});

test('color aliases require intent, application and role rather than interchangeable swatches', () => {
  const cases = [
    ['primitive.color.flat', { $type: 'color', $value: '#FFFFFFFF' }, /Invalid global color palette/],
    ['semantic.color.neutral.background.hover', source.semantic.color.neutral.background.control.hover, /Invalid color intent/],
    ['semantic.color.brand.background.solid.rest.$value', '{semantic.color.brand.foreground.primary}', /Color application/],
    ['context.theme.light.color.brand.background.solid.rest.$value', '{semantic.color.brand.foreground.primary}', /Color application/],
    ['semantic.color.status.danger.foreground.$value', '{semantic.color.status.success.foreground}', /Palette intent/],
    ['component.button.variant.primary.color.background.$value', '{semantic.color.brand.foreground.primary}', /Component color application/],
    ['component.button.variant.primary.color.background.$value', '{component.button.color.foreground}', /Component color application/],
  ];
  cases.forEach(([name, value, expected]) => {
    const input = copy();
    const parts = name.split('.');
    const target = parts.slice(0, -1).reduce((node, key) => node[key], input);
    target[parts[parts.length - 1]] = value;
    assert.throws(() => createTokenModel(input), expected);
  });
});

test('logical size properties retain their axes and separate control height from target floors', () => {
  const before = createTokenModel(source);
  assert.deepEqual(before.resolve('component.panel.size.inline-size').value, { value: 21.25, unit: 'rem' });
  assert.deepEqual(before.resolve('component.button.size.min-block-size'), before.resolve('semantic.size.control.min-block-size'));
  assert.equal(source.semantic.layout.select['max-block-size'].$value, '{primitive.layout.block-size.small}');
  const changed = copy();
  changed.semantic.size.control['min-block-size'].$value = '{primitive.size.control.small}';
  const after = createTokenModel(changed);
  assert.notDeepEqual(after.resolve('component.button.size.min-block-size'), before.resolve('component.button.size.min-block-size'));
  assert.deepEqual(after.resolve('semantic.size.target.minimum'), before.resolve('semantic.size.target.minimum'));
});

test('abbreviated size properties, cross-axis aliases and inconsistent magnitude synonyms fail', () => {
  ['inline', 'min-block', 'width', 'min-height'].forEach(name => {
    const input = copy();
    input.component.panel.size[name] = { $value: '{semantic.layout.panel.inline-size}' };
    assert.throws(() => createTokenModel(input), /complete logical size property/);
  });
  const block = copy();
  block.semantic.layout.select['max-block-size'].$value = '{primitive.layout.inline-size.extra-small}';
  assert.throws(() => createTokenModel(block), /Logical size axis mismatch/);
  const inline = copy();
  inline.component.panel.size['inline-size'].$value = '{semantic.layout.select.max-block-size}';
  assert.throws(() => createTokenModel(inline), /Logical size axis mismatch/);
  const magnitude = copy();
  magnitude.primitive.typography['font-size']['double-extra-large'] = { $type: 'dimension', $value: { value: 2, unit: 'rem' } };
  assert.throws(() => createTokenModel(magnitude), /extra-extra-large magnitude spelling/);
});

test('concrete button states can change without changing shared control or semantic defaults', () => {
  const before = createTokenModel(source);
  const changed = copy();
  changed.component.button.state.hover.color.background.$value = '{semantic.color.neutral.background.control.pressed}';
  const after = createTokenModel(changed);
  assert.notDeepEqual(after.resolve('component.button.state.hover.color.background'), before.resolve('component.button.state.hover.color.background'));
  ['component.control.state.hover.color.background', 'component.button.color.background',
    'semantic.color.neutral.background.control.hover'].forEach(name => {
    assert.deepEqual(after.resolve(name), before.resolve(name), name);
  });
  assert.deepEqual(after.resolve('component.select.part.option.state.selected.color.foreground'),
    after.resolve('semantic.color.neutral.foreground.primary'));
});

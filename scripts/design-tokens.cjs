const { readDesignSource, checkArtifacts } = require('./design-source.cjs');

const referencePattern = /^\{([a-z0-9.-]+)\}$/;
const axes = ['spacing', 'size', 'radius', 'typography'];
const allowedLayers = {
  primitive: ['primitive'],
  semantic: ['primitive', 'semantic'],
  component: ['semantic', 'component'],
  tenant: ['primitive', 'semantic', 'component', 'tenant'],
  context: ['primitive', 'semantic'],
};
const tokenCategories = {
  primitive: ['color', 'spacing', 'size', 'layout', 'typography', 'scale', 'elevation', 'opacity', 'stroke-width', 'radius'],
  semantic: ['color', 'spacing', 'size', 'layout', 'typography', 'scale', 'stroke-width', 'radius'],
};
const componentTypes = {
  color: 'color',
  typography: 'typography',
  radius: 'dimension',
  'stroke-width': 'dimension',
  spacing: 'dimension',
  size: 'dimension',
};
const colorApplications = ['foreground', 'background', 'stroke', 'shadow'];
const colorStates = ['rest', 'hover', 'pressed', 'selected', 'disabled'];

function colorRole(parts, name) {
  const [intent, second, third, fourth, fifth] = parts;
  if (['neutral', 'brand'].includes(intent)
    && colorApplications.includes(second)
    && (parts.length === 3 || (parts.length === 4 && colorStates.includes(fourth)))
    && !['rest', 'hover', 'pressed', 'selected'].includes(third)) {
    return { intent, application: second };
  }
  if (intent === 'status' && colorApplications.includes(third)
    && (parts.length === 3 || parts.length === 4
      || (parts.length === 5 && colorStates.includes(fifth)))) {
    return { intent: `status.${second}`, application: third };
  }
  if (intent === 'decorative' && colorApplications.includes(second) && parts.length === 3) {
    return { intent, application: second };
  }
  throw new Error(`Invalid color intent/application/role/state: ${name}`);
}

function componentProperty(parts, name) {
  let index = 0;
  ['part', 'variant', 'state'].forEach(axis => {
    if (parts[index] === axis) {
      if (!parts[index + 1]) throw new Error(`Missing component ${axis}: ${name}`);
      index += 2;
    }
  });
  const property = parts[index];
  const tail = ['color', 'spacing', 'size'].includes(property) ? 2 : 1;
  if (!componentTypes[property] || parts.length !== index + tail) {
    throw new Error(`Invalid component property/axis order: ${name}`);
  }
  return componentTypes[property];
}

function references(value) {
  if (typeof value === 'string') {
    const match = value.match(referencePattern);
    return match ? [match[1]] : [];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(references);
  }
  return [];
}

function onlyReferences(value) {
  if (typeof value === 'string') return referencePattern.test(value);
  return value && typeof value === 'object' && Object.values(value).every(onlyReferences);
}

function parseColor(value, name) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{8}$/i.test(value)) {
    throw new Error(`Color literals must use #RRGGBBAA: ${name}`);
  }
  const channels = value.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  return { colorSpace: 'srgb', components: channels.slice(0, 3), alpha: channels[3] };
}

function validateValue(type, value, name) {
  let valid = false;
  const finite = number => typeof number === 'number' && Number.isFinite(number);
  if (type === 'color') {
    valid = value && value.colorSpace === 'srgb'
      && Array.isArray(value.components) && value.components.length === 3
      && value.components.every(channel => finite(channel) && channel >= 0 && channel <= 1)
      && (value.alpha === undefined
        || (finite(value.alpha) && value.alpha >= 0 && value.alpha <= 1));
  } else if (type === 'dimension') {
    const tracking = name.startsWith('primitive.typography.letter-spacing.') || name.endsWith('.letterSpacing');
    valid = value && finite(value.value) && (value.value >= 0 || tracking)
      && ['px', 'rem', 'em'].includes(value.unit);
  } else if (type === 'number') {
    valid = finite(value);
  } else if (type === 'fontWeight') {
    valid = finite(value) && value >= 1 && value <= 1000;
  } else if (type === 'fontFamily') {
    valid = Array.isArray(value) && value.length > 0
      && value.every(family => typeof family === 'string' && family.length > 0);
  } else if (type === 'typography') {
    const fields = {
      fontFamily: 'fontFamily',
      fontSize: 'dimension',
      fontWeight: 'fontWeight',
      lineHeight: 'number',
      letterSpacing: 'dimension',
    };
    valid = value && Object.keys(value).length === Object.keys(fields).length;
    if (valid) {
      Object.entries(fields).forEach(([field, fieldType]) => {
        validateValue(fieldType, value[field], `${name}.${field}`);
      });
      valid = value.lineHeight > 0;
    }
  }
  if (!valid) throw new Error(`Invalid ${type} token: ${name}`);
}

function createTokenModel(source, requestedTheme, { allowPlanned = false } = {}) {
  const metadata = source.$extensions && source.$extensions['ror2.design-system'];
  if (!metadata || typeof metadata.name !== 'string' || !metadata.name.trim()
    || !/^\d+\.\d+\.\d+$/.test(metadata.revision)) {
    throw new Error('Missing or invalid design system metadata');
  }
  if (!metadata.themes || Array.isArray(metadata.themes)
    || Object.entries(metadata.themes).some(([name, definition]) => (
      !/^[a-z][a-z0-9-]*$/.test(name) || !definition
        || !['active', 'planned'].includes(definition.status)
        || (definition.extends !== undefined && typeof definition.extends !== 'string')
    ))) {
    throw new Error('Invalid theme availability metadata');
  }
  if (!metadata.themes[metadata.defaultTheme]
    || metadata.themes[metadata.defaultTheme].status !== 'active'
    || !/^[a-z][a-z0-9-]*$/.test(metadata.defaultDensity)
    || !source.context || !source.context.density
    || !Object.hasOwn(source.context.density, metadata.defaultDensity)) {
    throw new Error('Unsupported default theme or density');
  }
  const theme = requestedTheme === undefined ? metadata.defaultTheme : requestedTheme;
  if (!Object.hasOwn(metadata.themes, theme)) throw new Error(`Unknown theme: ${theme}`);
  if (metadata.themes[theme].status === 'planned' && !allowPlanned) {
    throw new Error(`Theme ${theme} is planned, not active`);
  }
  const lineage = (name, ancestors = []) => {
    if (!Object.hasOwn(metadata.themes, name)) throw new Error(`Unknown parent theme: ${name}`);
    if (ancestors.includes(name)) throw new Error(`Theme inheritance cycle: ${[...ancestors, name].join(' -> ')}`);
    const definition = metadata.themes[name];
    if (!definition.extends) return [name];
    const parents = lineage(definition.extends, [...ancestors, name]);
    if (definition.status === 'active' && metadata.themes[definition.extends].status !== 'active') {
      throw new Error(`Active theme cannot extend a planned theme: ${name}`);
    }
    return [...parents, name];
  };
  Object.keys(metadata.themes).forEach(name => lineage(name));
  if (metadata.themes[metadata.defaultTheme].extends) throw new Error('Default theme cannot extend another theme');
  const themeChain = lineage(theme);
  const tokens = new Map();
  const collect = (node, parts = [], inheritedType) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw new Error(`Expected token or group: ${parts.join('.')}`);
    }
    const type = node.$type || inheritedType;
    const children = Object.keys(node).filter(key => !key.startsWith('$'));
    if (Object.hasOwn(node, '$value')) {
      if (children.length) throw new Error(`Token has child groups: ${parts.join('.')}`);
      tokens.set(parts.join('.'), { type, value: node.$value });
      return;
    }
    children.forEach(key => {
      if (!/^[a-z][a-z0-9-]*$/.test(key) || /^s\d+$/.test(key)) {
        throw new Error(`Invalid or abbreviated token name: ${[...parts, key].join('.')}`);
      }
      collect(node[key], [...parts, key], type);
    });
  };
  collect(source);
  const cssNames = new Set();
  const propertyTypes = new Map();
  tokens.forEach((token, name) => {
    const parts = name.split('.');
    const [layer, category] = parts;
    if (!allowedLayers[layer]) throw new Error(`Unknown token layer: ${layer}`);
    if (tokenCategories[layer] && !tokenCategories[layer].includes(category)) {
      throw new Error(`Unknown ${layer} token category: ${category}`);
    }
    const cssName = name.replace(/\./g, '-');
    if (cssNames.has(cssName)) throw new Error(`CSS token name collision: ${name}`);
    cssNames.add(cssName);
    if (layer === 'context' && !['theme', 'density'].includes(category)) {
      throw new Error(`Unknown token context: ${name}`);
    }
    if (layer === 'context' && category === 'density'
      && (parts.length !== 4 || !axes.includes(parts[3]))) {
      throw new Error(`Invalid density axis: ${name}`);
    }
    let componentIndex = -1;
    if (layer === 'component') componentIndex = 1;
    if (layer === 'tenant' && parts[2] === 'component') componentIndex = 3;
    if (componentIndex !== -1) {
      if (/-(?:hover|pressed|selected|disabled|primary|secondary|danger|ghost)$/.test(parts[componentIndex])) {
        throw new Error(`Component state/variant must be a named axis: ${name}`);
      }
      propertyTypes.set(name, componentProperty(parts.slice(componentIndex + 1), name));
    }
    if (layer === 'primitive' && name.split('.').some(
      part => /(?:^|-)(?:rarity|boss|legendary|catalog|item|equipment|dlc)(?:-|$)/.test(part),
    )) {
      throw new Error(`Product concept in primitive token: ${name}`);
    }
    if (layer === 'primitive' && category === 'color'
      && (parts.length !== 4 || !['neutral', 'shared', 'alpha'].includes(parts[2])
        || (parts[2] === 'neutral' && !/^step-\d+$/.test(parts[3])))) {
      throw new Error(`Invalid global color palette: ${name}`);
    }
    const dependencies = references(token.value);
    dependencies.forEach(dependency => {
      const permitted = layer === 'context' && category === 'density'
        ? ['primitive'] : allowedLayers[layer];
      if (!permitted.includes(dependency.split('.')[0])) {
        throw new Error(`Forbidden dependency: ${name} -> ${dependency}`);
      }
    });
    const semanticName = name.replace(/^context\.theme\.[^.]+\./, 'semantic.');
    if (semanticName.startsWith('semantic.color.')) {
      const role = colorRole(semanticName.split('.').slice(2), name);
      dependencies.forEach(dependency => {
        if (dependency.startsWith('primitive.color.')) return;
        if (!dependency.startsWith('semantic.color.')) return;
        const target = colorRole(dependency.split('.').slice(2), dependency);
        if (target.intent !== role.intent) throw new Error(`Palette intent must remain independent: ${name}`);
        if (target.application !== role.application) {
          throw new Error(`Color application must remain independent: ${name} -> ${dependency}`);
        }
      });
    }
    if (propertyTypes.get(name) === 'color') {
      dependencies.filter(dependency => dependency.startsWith('semantic.color.')).forEach(dependency => {
        const role = colorRole(dependency.split('.').slice(2), dependency);
        if (role.application !== parts[parts.length - 1]) {
          throw new Error(`Component color application mismatch: ${name} -> ${dependency}`);
        }
      });
      dependencies.filter(dependency => dependency.startsWith('component.')
        || /^tenant\.[^.]+\.component\./.test(dependency)).forEach(dependency => {
        if (dependency.split('.').slice(-2).join('.') !== `color.${parts[parts.length - 1]}`) {
          throw new Error(`Component color application mismatch: ${name} -> ${dependency}`);
        }
      });
    }
    const [, tenantName, tenantGroup] = name.split('.');
    const tenantColor = layer === 'tenant' && tenantGroup === 'color' && token.type === 'color';
    const themeColor = layer === 'context' && category === 'theme'
      && name.split('.')[3] === 'color' && token.type === 'color';
    if (layer === 'tenant' && dependencies.some(dependency => (
      dependency.startsWith('tenant.') && !dependency.startsWith(`tenant.${tenantName}.`)
    ))) {
      throw new Error(`Cross-tenant dependency: ${name}`);
    }
    if (tenantColor && dependencies.some(dependency => (
      !dependency.startsWith('primitive.color.')
        && !dependency.startsWith('semantic.color.decorative.foreground.')
        && !dependency.startsWith(`tenant.${tenantName}.color.`)
    ))) {
      throw new Error(`Tenant colors cannot depend on brand or status palettes: ${name}`);
    }
    if (layer !== 'primitive' && !tenantColor && !themeColor
      && (dependencies.length === 0 || !onlyReferences(token.value))) {
      throw new Error(`Non-primitive token must alias its foundations: ${name}`);
    }
  });
  tokens.forEach((token, name) => {
    if (!name.startsWith('context.theme.')) return;
    const [, , overrideTheme, ...parts] = name.split('.');
    if (!Object.hasOwn(metadata.themes, overrideTheme)) {
      throw new Error(`Unknown override theme: ${overrideTheme}`);
    }
    if (overrideTheme === metadata.defaultTheme) {
      throw new Error('Default theme values must live in semantic tokens');
    }
    const target = `semantic.${parts.join('.')}`;
    if (!tokens.has(target)) throw new Error(`Unknown theme role: ${target}`);
  });
  themeChain.forEach(overrideTheme => {
    tokens.forEach((token, name) => {
      if (name.startsWith(`context.theme.${overrideTheme}.`)) {
        const target = name.replace(`context.theme.${overrideTheme}.`, 'semantic.');
        const { type } = tokens.get(target);
        if (type && token.type && type !== token.type) {
          throw new Error(`Theme token type mismatch: ${name}`);
        }
        tokens.set(target, { ...token, type: token.type || type });
      }
    });
  });

  const cache = new Map();
  const resolve = (name, ancestors = []) => {
    if (ancestors.includes(name)) {
      throw new Error(`Token cycle: ${[...ancestors, name].join(' -> ')}`);
    }
    if (cache.has(name)) return cache.get(name);
    const token = tokens.get(name);
    if (!token) throw new Error(`Unknown token reference: ${name}`);
    const chain = [...ancestors, name];
    const resolveValue = value => {
      if (typeof value === 'string') {
        const match = value.match(referencePattern);
        return match ? resolve(match[1], chain).value : value;
      }
      if (Array.isArray(value)) return value.map(resolveValue);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, child]) => [key, resolveValue(child)]),
        );
      }
      return value;
    };
    const alias = typeof token.value === 'string' && token.value.match(referencePattern);
    const target = alias ? resolve(alias[1], chain) : null;
    const type = token.type || (target && target.type);
    if (target && token.type && token.type !== target.type) {
      throw new Error(`Token type mismatch: ${name} -> ${alias[1]}`);
    }
    const resolvedValue = resolveValue(token.value);
    const value = type === 'color' && !alias ? parseColor(token.value, name) : resolvedValue;
    validateValue(type, value, name);
    const result = { type, value };
    cache.set(name, result);
    return result;
  };
  tokens.forEach((token, name) => {
    const resolved = resolve(name);
    if (/^(?:primitive|semantic)\.color\.|^context\.theme\.[^.]+\.color\./.test(name)
      && resolved.type !== 'color') throw new Error(`Color token type mismatch: ${name}`);
    if (propertyTypes.has(name) && resolved.type !== propertyTypes.get(name)) {
      throw new Error(`Component property type mismatch: ${name}`);
    }
  });
  tokens.forEach((token, name) => {
    if (!name.startsWith('primitive.scale.')) return;
    const factor = resolve(name);
    if (factor.type !== 'number' || factor.value <= 0) {
      throw new Error(`Scale factor must be positive and dimensionless: ${name}`);
    }
  });
  const densityGroups = Object.keys(source.context.density).filter(name => !name.startsWith('$'))
    .map(name => `context.density.${name}`);
  axes.forEach(axis => {
    ['semantic.scale', ...densityGroups].forEach(group => {
      const factor = resolve(`${group}.${axis}`);
      if (factor.type !== 'number' || factor.value <= 0) {
        throw new Error(`Scale factor must be positive and dimensionless: ${group}.${axis}`);
      }
    });
  });
  return {
    tokens,
    resolve,
    theme,
    defaultDensity: metadata.defaultDensity,
    themeStatus: metadata.themes[theme].status,
    themeChain,
    activeThemes: Object.keys(metadata.themes).filter(name => metadata.themes[name].status === 'active'),
  };
}

function colorHex(color) {
  const channels = [...color.components, color.alpha === undefined ? 1 : color.alpha];
  return `#${channels.map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
}

function exportColors(source) {
  const model = createTokenModel(source);
  const result = JSON.parse(JSON.stringify(source));
  model.tokens.forEach((token, name) => {
    if (token.type !== 'color' || typeof token.value !== 'string' || !token.value.startsWith('#')) return;
    const node = name.split('.').reduce((group, key) => group[key], result);
    node.$value = parseColor(token.value, name);
  });
  result.$extensions['ror2.design-system'].colorFormat = 'dtcg-srgb';
  return result;
}

function scaleDimension(model, name, axis, density = model.defaultDensity) {
  if (!axes.includes(axis)) throw new Error(`Unknown scale axis: ${axis}`);
  if (!model.tokens.has(`context.density.${density}.${axis}`)) {
    throw new Error(`Unknown density: ${density}`);
  }
  const token = model.resolve(name);
  if (token.type !== 'dimension') throw new Error(`Cannot dimension-scale token: ${name}`);
  const protectedTokens = [
    'semantic.size.target.minimum', 'primitive.size.control.medium',
    'semantic.radius.chip', 'primitive.radius.full',
    'semantic.spacing.offset.focus-ring',
  ];
  const categories = { spacing: 'spacing', size: 'size', radius: 'radius', typography: 'typography' };
  let current = name;
  while (current) {
    if (protectedTokens.includes(current)) throw new Error(`Protected dimension cannot scale: ${name}`);
    const parts = current.split('.');
    if (['primitive', 'semantic'].includes(parts[0]) && parts[1] !== categories[axis]) {
      throw new Error(`Wrong scale axis for token: ${name}`);
    }
    if (parts[0] === 'primitive' && axis === 'typography' && parts[2] !== 'font-size') {
      throw new Error(`Wrong scale axis for token: ${name}`);
    }
    const { value } = model.tokens.get(current);
    const alias = typeof value === 'string' && value.match(referencePattern);
    current = alias && alias[1];
  }
  const scale = model.resolve(`semantic.scale.${axis}`).value;
  const factor = model.resolve(`context.density.${density}.${axis}`).value;
  return { value: Number((token.value.value * scale * factor).toFixed(6)), unit: token.value.unit };
}

function validateTokens(source) {
  const model = createTokenModel(source);
  Object.keys(source.$extensions['ror2.design-system'].themes).forEach(theme => {
    createTokenModel(source, theme, { allowPlanned: true });
  });
  return model;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--check', '--export'].includes(args[0])) {
    throw new Error('Usage: node scripts/design-tokens.cjs --check|--export');
  }
  const source = readDesignSource();
  validateTokens(source.tokens);
  if (args.includes('--export')) {
    process.stdout.write(`${JSON.stringify(exportColors(source.tokens), null, 2)}\n`);
  } else {
    const count = checkArtifacts(source);
    process.stdout.write(`Authored Markdown and all themes are valid; ${count} materialized artifacts checked for drift. No files were written.\n`);
  }
}

module.exports = {
  createTokenModel, colorHex, exportColors, validateTokens, scaleDimension,
};

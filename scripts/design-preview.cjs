const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createTokenModel, colorHex } = require('./design-tokens.cjs');
const { contentContract, readContent, validateCatalog } = require('./design-content.cjs');
const { readDesignSource, readDesignArtifact } = require('./design-source.cjs');

const root = path.resolve(__dirname, '..');
const variable = name => `--ds-${name.replace(/\./g, '-')}`;

function componentContract(base, specification = readDesignSource().components) {
  if (specification.version !== 1) throw new Error('Unsupported component contract version');
  const model = createTokenModel(base);
  if (!specification.messages || !Object.values(specification.messages).length
    || Object.values(specification.messages).some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error('Invalid UI message catalog');
  }
  const densities = Object.keys(base.context.density).filter(name => !name.startsWith('$'));
  densities.forEach(name => {
    if (!specification.messages[name]) throw new Error(`Missing density UI message: ${name}`);
  });
  const { iconography } = specification;
  const box = typeof iconography.viewBox === 'string' ? iconography.viewBox.split(/\s+/).map(Number) : [];
  if (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0
    || model.resolve(iconography.stroke.slice(1, -1)).type !== 'dimension'
    || !['none', 'currentColor'].includes(iconography.fill)
    || !['butt', 'round', 'square'].includes(iconography.lineCap)
    || !['arcs', 'bevel', 'miter', 'miter-clip', 'round'].includes(iconography.lineJoin)
    || !Object.hasOwn(iconography.sizes, iconography.defaultSize)
    || !Object.values(iconography.roles).every(role => typeof role.mirror === 'boolean'
      && role.usage && role.paths.length && role.paths.every(value => typeof value === 'string' && value))) {
    throw new Error('Invalid iconography geometry/roles');
  }
  const requiredSlots = ['filterDisclosure', 'searchLeading', 'searchClear', 'selectDisclosure',
    'selectedOption', 'removeValue', 'closePanel', 'closePicker', 'resetFilters', 'externalReference'];
  if (requiredSlots.some(slot => !Object.hasOwn(iconography.slots, slot))
    || Object.values(iconography.slots).some(role => !iconography.roles[role])) {
    throw new Error('Unknown icon role in control slot');
  }
  const dimension = reference => {
    const match = typeof reference === 'string' && reference.match(/^\{([^}]+)\}$/);
    if (!match) throw new Error(`Expected a layout token alias: ${reference}`);
    const resolved = model.resolve(match[1]);
    if (resolved.type !== 'dimension' || resolved.value.value <= 0
      || !['px', 'rem'].includes(resolved.value.unit)) throw new Error(`Invalid layout dimension: ${reference}`);
    return resolved.value;
  };
  Object.values(iconography.sizes).forEach(reference => dimension(reference));
  Object.entries(specification.components).forEach(([name, component]) => {
    if (!component.element || !component.rules
      || !component.states.length || !component.anatomy.length) {
      throw new Error(`Incomplete component contract: ${name}`);
    }
    component.tokens.forEach(token => {
      if (!token.startsWith('component.') && !token.startsWith('semantic.')) {
        throw new Error(`Shared component cannot bind tenant/primitive tokens: ${token}`);
      }
      model.resolve(token);
    });
  });
  const { selection, workspace } = specification;
  if (selection.desktopCommit !== 'immediate' || selection.pickerCommit !== 'apply'
    || !Number.isInteger(selection.optionSearchThreshold) || selection.optionSearchThreshold < 0
    || typeof selection.coarsePointerPicker !== 'boolean'
    || !(selection.pickerViewportFraction > 0 && selection.pickerViewportFraction <= 1)) throw new Error('Unsupported selection policy');
  if (new Set(workspace.stack).size !== workspace.stack.length
    || !['base', 'header', 'navigation', 'details', 'popover'].every(name => workspace.stack.includes(name))) {
    throw new Error('Invalid workspace stacking order');
  }
  ['compactMax', 'navigationWidth', 'detailsWidth'].forEach(key => dimension(workspace[key]));
  const breakpoint = dimension(workspace.compactMax);
  const compactQuery = `(max-width: ${breakpoint.value}${breakpoint.unit})`;
  const ids = specification.acceptance.map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate component acceptance case');
  return {
    ...specification,
    runtime: {
      densities,
      defaultDensity: model.defaultDensity,
      compactQuery,
      pickerQuery: `${compactQuery}${selection.coarsePointerPicker ? ', (any-pointer: coarse)' : ''}`,
      popupMaxBlockSize: dimension(selection.popupMaxBlockSize),
      pickerMaxBlockSize: dimension(selection.pickerMaxBlockSize),
      popupGap: dimension(selection.popupGap),
      viewportInset: dimension(selection.viewportInset),
    },
  };
}

function cssValue(value) {
  if (typeof value === 'string') {
    const alias = value.match(/^\{(.+)\}$/);
    return alias ? `var(${variable(alias[1])})` : value;
  }
  if (Array.isArray(value)) return value.map(name => (name.includes(' ') ? JSON.stringify(name) : name)).join(', ');
  if (value && value.colorSpace) return colorHex(value);
  if (value && value.unit) return `${value.value}${value.unit}`;
  return String(value);
}

function tokenCss(model, tenant) {
  const declarations = [];
  model.tokens.forEach((token, name) => {
    if (name.startsWith('context.theme.')) return;
    const resolved = model.resolve(name);
    const cardPrefix = `tenant.${tenant}.component.item-card.`;
    const cardProperty = tenant && name.startsWith(cardPrefix)
      ? `--preview-card-${name.slice(cardPrefix.length).replace(/\./g, '-')}` : null;
    if (resolved.type === 'typography') {
      Object.keys(resolved.value).forEach(field => {
        const alias = typeof token.value === 'string' && token.value.match(/^\{(.+)\}$/);
        const value = alias ? `var(${variable(`${alias[1]}-${field}`)})` : cssValue(token.value[field]);
        declarations.push(`${variable(`${name}-${field}`)}:${value};`);
        if (cardProperty) declarations.push(`${cardProperty}-${field}:var(${variable(`${name}-${field}`)});`);
      });
    } else {
      declarations.push(`${variable(name)}:${cssValue(token.value)};`);
      if (cardProperty) declarations.push(`${cardProperty}:var(${variable(name)});`);
    }
  });
  return `:root{\n${declarations.join('\n')}\n}\n`;
}

function previewSource(
  base,
  extension = readDesignArtifact(contentContract().tenants.minecraft.tokenExtension),
) {
  const source = JSON.parse(JSON.stringify(base));
  Object.entries(extension.$extensions['ror2.design-system'].themes).forEach(([name, metadata]) => {
    if (Object.hasOwn(source.context.theme, name)) throw new Error(`Duplicate tenant theme definition: ${name}`);
    source.$extensions['ror2.design-system'].themes[name] = metadata;
    source.context.theme[name] = extension.context.theme[name];
  });
  if (source.tenant.minecraft) throw new Error('Duplicate minecraft token definition');
  source.tenant.minecraft = JSON.parse(JSON.stringify(extension.tenant.minecraft));
  const cardAliases = (group, prefix) => Object.fromEntries(
    Object.entries(group).filter(([key]) => !key.startsWith('$')).map(([key, value]) => [
      key,
      Object.hasOwn(value, '$value')
        ? { $value: `{${prefix}.${key}}` } : cardAliases(value, `${prefix}.${key}`),
    ]),
  );
  source.tenant.minecraft.component = { 'item-card': cardAliases(source.component.card, 'component.card') };
  return source;
}

function readGit(ref, file, encoding = 'utf8') {
  return execFileSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding, maxBuffer: 8 * 1024 * 1024 });
}

function objectFromModule(text, name, context = {}) {
  const match = text.match(new RegExp(`(?:export )?const ${name} = ([\\s\\S]*?\\n[}\\]]);`));
  if (!match) throw new Error(`Cannot read fork data declaration: ${name}`);
  return vm.runInNewContext(`(${match[1]})`, context, { timeout: 1000 });
}

function createFixtures(base, ref = contentContract().tenants.ror2.revision) {
  const content = contentContract();
  const tenantSource = content.tenants.ror2;
  const commit = execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { cwd: root, encoding: 'utf8' }).trim();
  const files = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', commit], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  }).trim().split(/\r?\n/));
  [tenantSource.composition, ...Object.values(tenantSource.files),
    tenantSource.extensions.survivorRecommendations].forEach(file => {
    if (!files.has(file)) throw new Error(`Missing declared content source: ${file} at ${commit}`);
  });
  const source = previewSource(base);
  const assets = new Map();
  const asset = file => {
    if (!files.has(file)) throw new Error(`Missing authoritative asset: ${file} at ${commit}`);
    const url = `/asset/${file.split('/').map(encodeURIComponent).join('/')}`;
    assets.set(url, file);
    return url;
  };
  const constants = readGit(commit, tenantSource.files.taxonomies);
  const ItemRarity = objectFromModule(constants, 'ItemRarity');
  const SelectionType = objectFromModule(constants, 'SelectionType');
  const Category = objectFromModule(constants, 'Category');
  const order = objectFromModule(constants, 'ItemRaritySortValue', { ItemRarity });
  const items = JSON.parse(readGit(commit, tenantSource.files.items));
  const images = JSON.parse(readGit(commit, tenantSource.files.itemImages));
  const droneModule = readGit(commit, tenantSource.files.drones)
    .replace(/^import \{ ItemRarity, SelectionType \} from '.\/constants';\r?\n/, '')
    .replace('export default ', 'const catalog = ');
  const drones = vm.runInNewContext(`${droneModule}\ncatalog;`, { ItemRarity, SelectionType }, { timeout: 1000 });
  const imports = Object.fromEntries([...constants.matchAll(/^import (\w+) from ["']([^"']+)["'];/gm)]
    .map(([, name, file]) => [
      name, path.posix.join(path.posix.dirname(tenantSource.files.taxonomies), file),
    ]));
  const dlc = Object.fromEntries(Object.entries(objectFromModule(constants, 'DlcIconUrl', imports))
    .map(([name, file]) => [name, asset(file)]));
  const equipment = ['Equipment', 'Elite Equipment', 'Lunar Equipment'];
  const cue = rarity => (rarity === "N'tormat Pages" ? 'page' : rarity.toLowerCase().replace(/ /g, '-'));
  const entries = Object.entries(items).map(([id, item]) => ({
    ...item,
    catalogId: item.id,
    sourceImage: item.image,
    id,
    section: equipment.includes(item.itemRarity) ? 'Equipment' : 'Items',
    image: images[id] ? asset(`${tenantSource.assets.items}/${images[id]}`) : null,
  })).concat(Object.entries(drones).map(([id, item]) => ({
    ...item,
    id,
    sourceImage: item.image,
    section: 'Drones',
    image: asset(`${tenantSource.assets.drones}/${item.image}`),
  }))).filter(item => !item.hidden)
    .map(item => {
      if (typeof item.itemRarity !== 'string' || order[item.itemRarity] === undefined) {
        throw new Error(`Unknown fork rarity: ${item.name}`);
      }
      const colorToken = `tenant.ror2.color.rarity.${cue(item.itemRarity)}`;
      if (item.dlc && !dlc[item.dlc]) throw new Error(`Unknown fork DLC: ${item.dlc}`);
      return {
        ...item,
        group: item.itemRarity,
        order: order[item.itemRarity],
        colorToken,
        dlcIcon: item.dlc ? dlc[item.dlc] : null,
        version: item.dlc || 'Base game',
        displayCategories: [...new Set((item.category || [])
          .map(value => value.replace(/([a-z])([A-Z])/g, '$1 $2'))
          .filter(value => Object.values(Category).includes(value)))],
        stackingStats: equipment.includes(item.itemRarity) ? [] : (item.stats || []),
        attributes: ['acquisition', 'health', 'damage', 'armor', 'speed']
          .filter(key => item[key] !== undefined).map(key => ({ label: key, value: item[key] })),
      };
    });
  const { messages } = readDesignSource().components;
  const ror2 = {
    id: 'ror2',
    title: 'Risk of Rain 2',
    highlight: 'Field Guide',
    theme: 'dark-ror2',
    sections: ['Items', 'Equipment', 'Drones'],
    grouped: true,
    messages,
    entries,
    filters: [
      { key: 'group', message: 'rarity', allMessage: 'allRarities', multiple: true, options: Object.values(ItemRarity).map(value => ({ value, label: value })) },
      { key: 'version', message: 'version', allMessage: 'allVersions', multiple: true, options: ['Base game', ...Object.keys(dlc)].map(value => ({ value, label: value })) },
    ],
    commit,
    provenance: {
      authority: tenantSource.authority,
      repository: tenantSource.repository,
      revision: commit,
      files: tenantSource.files,
    },
  };
  const sample = readContent(content.tenants.minecraft.file);
  if (sample.authority !== 'illustrative-only') throw new Error('Sample cannot become an authoritative catalog');
  const { materials } = sample;
  const minecraft = {
    id: 'minecraft',
    title: 'Minecraft',
    highlight: 'Equipment Guide',
    theme: 'dark-minecraft',
    sections: ['Tools', 'Weapons'],
    grouped: false,
    commit: null,
    provenance: {
      authority: sample.authority, file: content.tenants.minecraft.file, revision: null,
    },
    messages: {
      ...messages,
      rarity: 'Material',
      category: 'Usage',
      allRarities: 'All materials',
      allCategories: 'All uses',
      search: 'Search equipment',
      subtitle: 'Tools, materials, and equipment. Illustrative reuse fixture.',
    },
    entries: sample.entries.map(entry => ({
      ...entry,
      order: materials.indexOf(entry.group),
      displayCategories: entry.category,
      colorToken: `tenant.minecraft.color.material.${entry.group.toLowerCase()}`,
      description: sample.description,
      image: null,
      glyphPath: sample.artwork[entry.artwork],
    })),
    filters: [
      { key: 'group', message: 'rarity', allMessage: 'allRarities', multiple: true, options: materials.map(value => ({ value, label: value })) },
      { key: 'category', message: 'category', allMessage: 'allCategories', multiple: true, options: sample.uses.map(value => ({ value, label: value })) },
    ],
  };
  const fixtures = { ror2, minecraft };
  Object.values(fixtures).forEach(fixture => {
    validateCatalog(fixture, content);
    const model = createTokenModel(source, fixture.theme);
    fixture.entries.forEach(entry => model.resolve(entry.colorToken));
  });
  return { source, fixtures, assets, commit, content };
}

function createServer(ref) {
  const { tokens: base } = readDesignSource();
  const { source, fixtures, assets, commit, content } = createFixtures(base, ref);
  const contract = componentContract(base);
  const densityCss = [null, ...contract.runtime.densities].map(name => {
    const selector = name ? `:root[data-density="${name}"]` : ':root';
    const mode = name || contract.runtime.defaultDensity;
    return `${selector}{${['spacing', 'size', 'radius', 'typography'].map(axis => `--density-${axis}:var(--ds-context-density-${mode}-${axis});`).join('')}}\n`;
  }).join('');
  const patternCss = `:root{${contract.workspace.stack.map((name, index) => `--pattern-layer-${name}:${index};`).join('')}--pattern-picker-height:${contract.selection.pickerViewportFraction * 100}dvh;--pattern-picker-max-height:${cssValue(contract.selection.pickerMaxBlockSize)};--pattern-navigation-width:${cssValue(contract.workspace.navigationWidth)};--pattern-details-width:${cssValue(contract.workspace.detailsWidth)};}\n`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design-system validation</title><link id="tokens" rel="stylesheet"><link rel="stylesheet" href="/preview.css"><script type="module" src="/preview.js"></script></head><body data-default-tenant="${Object.keys(fixtures)[0]}"><p role="status">Loading design-system preview...</p></body></html>`;
  const routes = new Map([
    ['/', ['text/html', html]],
    ['/preview.css', ['text/css', densityCss + patternCss + fs.readFileSync(path.join(__dirname, 'design-preview.css'), 'utf8').replace('__breakpoint-medium__', cssValue(createTokenModel(source).resolve(contract.workspace.compactMax.slice(1, -1)).value))]],
    ['/preview.js', ['text/javascript', fs.readFileSync(path.join(__dirname, 'design-preview.js'))]],
    ['/design-components.mjs', ['text/javascript', fs.readFileSync(path.join(__dirname, 'design-components.mjs'))]],
    ['/interaction-tests.mjs', ['text/javascript', fs.readFileSync(path.join(__dirname, 'design-interactions.browser.mjs'))]],
    ['/api/components', ['application/json', JSON.stringify(contract)]],
    ['/api/content', ['application/json', JSON.stringify(content)]],
  ]);
  Object.values(fixtures).forEach(fixture => {
    const examples = Object.values(fixtures).map(example => ({
      id: example.id, name: example.title,
    }));
    routes.set(`/api/${fixture.id}`, ['application/json', JSON.stringify({ ...fixture, examples })]);
    routes.set(`/tokens/${fixture.id}.css`, ['text/css', tokenCss(createTokenModel(source, fixture.theme), fixture.id)]);
  });
  const cache = new Map();
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    let route = routes.get(url.pathname);
    if (assets.has(url.pathname)) {
      if (!cache.has(url.pathname)) {
        cache.set(url.pathname, readGit(commit, assets.get(url.pathname), null));
      }
      const extension = path.extname(assets.get(url.pathname));
      route = [extension === '.png' ? 'image/png' : 'image/webp', cache.get(url.pathname)];
    }
    if (!route) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': `${route[0]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(route[1]);
  });
}

if (require.main === module) {
  if (process.argv[2] === '--check') {
    const { tokens: base } = readDesignSource();
    const contract = componentContract(base);
    createFixtures(base);
    process.stdout.write(`Validated ${Object.keys(contract.components).length} component contracts and ${contract.acceptance.length} acceptance cases.\n`);
  } else if (process.argv[2] === '--catalog') {
    const { tokens: base } = readDesignSource();
    const { fixtures, assets, commit } = createFixtures(base, process.argv[3]);
    process.stdout.write(`${JSON.stringify({ revision: commit, tenants: fixtures, assets: Object.fromEntries(assets) }, null, 2)}\n`);
  } else {
    const ref = process.argv[2] || contentContract().tenants.ror2.revision;
    const port = Number(process.env.PORT || 4173);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be an integer from 1024 to 65535');
    createServer(ref).listen(port, '127.0.0.1', () => {
      process.stdout.write(`Token-driven validation: http://127.0.0.1:${port}/ (fork ref: ${ref})\n`);
    });
  }
}

module.exports = { componentContract, createFixtures, createServer, previewSource, tokenCss };

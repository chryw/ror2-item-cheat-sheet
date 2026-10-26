import { assertExplorerModel, explorerFormat, explorerVersion } from './contract.mjs';
import { categories, extractGuideSections, pages, sourcePosition, tokenCategory, tokenGroup } from './reference.mjs';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const dimension = value => record(value) && Number.isFinite(value.value) && typeof value.unit === 'string';
const label = key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, letter => letter.toUpperCase());
const fieldLabels = { anatomy: 'Anatomy', inputs: 'Inputs & variants', states: 'States', tokens: 'Token bindings', rules: 'Usage & behavior' };
const fieldOrder = ['rules', 'anatomy', 'inputs', 'states', 'tokens'];

export function createExplorerModel(input) {
  const sections = extractGuideSections(input.guide, input.sourceMap);
  const lines = input.guide.replace(/\r\n/g, '\n').split('\n');
  const issues = [...(input.sourceIssues || [])];
  const location = line => line === undefined ? { file: 'design.md' } : sourcePosition(input.sourceMap, line);
  const heading = title => {
    const section = sections.find(item => item.title === title);
    return section?.source || location(section?.line);
  };
  const definitions = new Map();
  let fence;
  lines.forEach((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!marker) return;
    if (!fence) {
      fence = marker[1];
      const binding = /^```yaml design:([a-zA-Z0-9.-]+)$/.exec(line);
      if (binding) definitions.set(binding[1], location(index + 1));
    } else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
  });
  const definition = key => definitions.get(key)
    || [...definitions].find(([path]) => path.startsWith(`${key}.`))?.[1] || { file: 'design.md' };
  const authoredGroups = sections.flatMap(section => {
    const path = /^Token group: tokens\.(.+) \(/.exec(section.title)?.[1];
    return path ? [{ id: path, source: section.source || location(section.line) }] : [];
  }).sort((left, right) => right.id.length - left.id.length);
  const suppliedGroups = new Map((input.groups || []).map(group => [group.id, group]));
  if (suppliedGroups.size !== (input.groups || []).length) throw new TypeError('Duplicate Explorer group');
  const groups = new Map();
  const warn = message => issues.push(message);

  const tokens = input.tokens.map(token => {
    const authored = authoredGroups.find(group => token.name.startsWith(`${group.id}.`));
    const explicit = token.groupId ? suppliedGroups.get(token.groupId) : undefined;
    if (token.groupId && !explicit) throw new TypeError(`Unknown Explorer group ${token.groupId} for ${token.name}`);
    // Repository policy aggregates whole controls and status palettes; the client never interprets paths.
    const aggregate = /^(component\.|tenant\.[^.]+\.component\.)/.test(token.name)
      || (token.type === 'color' && /^(semantic\.color\.status\.|context\.theme\.[^.]+\.color\.)/.test(token.name));
    const id = explicit?.id || (aggregate ? tokenGroup(token) : authored?.id)
      || token.name.split('.').slice(0, -1).join('.') || 'ungrouped';
    if (!groups.has(id)) groups.set(id, {
      id, label: explicit?.label || id,
      path: explicit?.path || id.split('.'),
    });
    let kind = 'value';
    let application;
    const category = token.category || tokenCategory(token);
    if (!categories.some(item => item.id === category)) throw new TypeError(`Unknown Explorer category ${category}`);
    if (token.type === 'color' && typeof token.value === 'string') {
      kind = 'color';
      application = token.application || (/\.foreground(?:\.|$)/.test(token.name) ? 'foreground'
        : /\.stroke(?:\.|$)/.test(token.name) ? 'stroke' : 'background');
    } else if (token.type === 'typography' && record(token.value) && strings(token.value.fontFamily)
      && dimension(token.value.fontSize) && dimension(token.value.letterSpacing)
      && Number.isFinite(token.value.fontWeight) && Number.isFinite(token.value.lineHeight)) kind = 'typography';
    else if (token.type === 'fontFamily' && strings(token.value)) kind = 'fontFamily';
    else if (token.type === 'fontWeight' && Number.isFinite(token.value)) kind = 'fontWeight';
    else if (/font-size|line-height|letter-spacing/.test(token.name) && (dimension(token.value) || Number.isFinite(token.value))) {
      kind = /font-size/.test(token.name) ? 'fontSize' : /line-height/.test(token.name) ? 'lineHeight' : 'letterSpacing';
    } else if (token.type === 'dimension' && dimension(token.value)) kind = token.name.includes('radius') ? 'radius' : 'length';
    else if (token.type === 'number' && Number.isFinite(token.value)) kind = /factor|scale|density/.test(token.name) ? 'scale' : 'value';
    else if (['duration', 'cubicBezier', 'shadow', 'border', 'strokeStyle', 'gradient', 'transition'].includes(token.type)
      || (token.type === 'string' && typeof token.value === 'string')
      || (token.type === 'boolean' && typeof token.value === 'boolean')) kind = 'value';
    else warn(`Token ${token.name}: unsupported ${token.type} preview; raw and resolved data remain inspectable.`);
    return {
      name: token.name, type: token.type, raw: token.raw, value: token.value,
      category, groupId: id, preview: { kind, ...(application ? { application } : {}) },
      source: token.source || authored?.source || { file: 'design.md' },
    };
  });

  const components = Object.entries(input.contract?.components || {}).map(([id, data]) => {
    const entries = record(data) ? Object.entries(data) : [['definition', data]];
    return {
      id, name: id, element: typeof data?.element === 'string' ? data.element : '',
      stateCount: Array.isArray(data?.states) ? data.states.length : null,
      source: definition(`components.components.${id}`),
      fields: entries.filter(([key]) => key !== 'element').sort(([left], [right]) => (
        (fieldOrder.includes(left) ? fieldOrder.indexOf(left) : fieldOrder.length)
        - (fieldOrder.includes(right) ? fieldOrder.indexOf(right) : fieldOrder.length)
      )).map(([key, value]) => ({
        key, label: fieldLabels[key] || label(key),
        kind: key === 'tokens' && strings(value) ? 'bindings' : 'data', value,
      })),
    };
  });
  const themes = Object.entries(input.metadata.themes).map(([id, theme]) => ({
    id, status: theme.status, parentId: theme.extends || null, source: definition('tokens'),
  }));
  const registry = input.contract?.iconography;
  const byName = new Map(tokens.map(token => [token.name, token]));
  const strokeName = typeof registry?.stroke === 'string' ? /^\{(.+)\}$/.exec(registry.stroke)?.[1] : undefined;
  const stroke = byName.get(strokeName)?.value;
  const strokeWidth = dimension(stroke) ? `${stroke.value}${stroke.unit}` : Number.isFinite(stroke) ? String(stroke) : null;
  const icons = Object.entries(registry?.roles || {}).map(([id, data]) => {
    const supported = typeof registry.viewBox === 'string' && strings(data?.paths) && strokeWidth !== null
      && ['fill', 'lineCap', 'lineJoin'].every(key => typeof registry[key] === 'string');
    if (!supported) warn(`Icon ${id}: unsupported glyph definition; source data remains inspectable.`);
    return {
      id, usage: typeof data?.usage === 'string' ? data.usage : '', mirror: data?.mirror === true, data,
      glyph: supported ? {
        viewBox: registry.viewBox, paths: data.paths, strokeWidth,
        fill: registry.fill, lineCap: registry.lineCap, lineJoin: registry.lineJoin,
      } : null,
    };
  });
  const documentation = Object.fromEntries(Object.entries(input.documentation || {}).map(([page, slots]) => [
    page, slots.map(slot => ({
      ...slot,
      excerpts: slot.excerpts.map(excerpt => ({ ...excerpt, source: excerpt.source || location(excerpt.line) })),
      ...(slot.contract ? { contract: { ...slot.contract, source: slot.contract.source || definition(`components.${slot.contract.key}`) } } : {}),
    })),
  ]));
  const principles = input.principles ? {
    ...input.principles,
    sources: input.principles.sourceSections.map(title => ({ title, source: heading(title) })),
  } : null;
  const model = {
    format: explorerFormat, schemaVersion: explorerVersion,
    metadata: input.metadata, theme: input.theme, activeThemes: input.activeThemes,
    groups: [...groups.values()], tokens, components, themes,
    iconography: { icons, source: definition('components.iconography'), data: registry ?? null },
    documentation, principles, guide: input.guide, sourceIssues: [...new Set(issues)],
    capabilities: Object.fromEntries(pages.map(page => [page.id, page.id === 'tokens' ? tokens.length > 0
      : page.id === 'components' ? components.length > 0 : page.id === 'principles' ? principles !== null
        : page.id === 'theming' ? themes.length > 0 : page.id === 'iconography' ? icons.length > 0
          : documentation[page.id]?.some(slot => slot.available) || false])),
  };
  return assertExplorerModel(model);
}

export const explorerFormat = 'ror2.design-system.explorer';
export const explorerVersion = 1;
export const previewKinds = ['color', 'typography', 'fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'length', 'radius', 'scale', 'value'];

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length > 0;
const dimension = value => record(value) && Number.isFinite(value.value) && text(value.unit);
const source = value => record(value) && typeof value.file === 'string'
  && /^(?:design\.md|design\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.md)$/.test(value.file)
  && (value.line === undefined || (Number.isInteger(value.line) && value.line > 0));

function jsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  ancestors.add(value);
  const valid = Object.values(value).every(item => jsonValue(item, ancestors));
  ancestors.delete(value);
  return valid;
}

export function assertExplorerModel(model) {
  const require = (condition, message) => {
    if (!condition) throw new TypeError(`Invalid Explorer contract: ${message}`);
  };
  require(record(model), 'expected an object');
  require(model.format === explorerFormat && model.schemaVersion === explorerVersion,
    `unsupported format/version; expected ${explorerFormat} v${explorerVersion}`);
  require(record(model.metadata) && text(model.metadata.name) && text(model.metadata.revision), 'system metadata');
  require(text(model.theme) && Array.isArray(model.activeThemes) && model.activeThemes.every(text)
    && model.activeThemes.includes(model.theme), 'active theme context');
  if (Object.hasOwn(model, 'view')) {
    const view = model.view;
    require(record(view) && ['principles', 'tokens', 'theming', 'components', 'patterns', 'iconography',
      'assets', 'accessibility', 'content', 'layout', 'adoption'].includes(view.section)
      && ['all', 'colors', 'typography', 'geometry', 'effects', 'motion', 'other'].includes(view.category)
      && model.activeThemes.includes(view.theme) && record(view.queries)
      && ['tokens', 'components', 'iconography'].every(key => typeof view.queries[key] === 'string'
        && view.queries[key].length <= 200), 'panel view');
  }
  require(Array.isArray(model.groups), 'token groups');
  const groups = new Set();
  for (const group of model.groups) {
    require(record(group) && text(group.id) && text(group.label) && Array.isArray(group.path)
      && group.path.every(text) && !groups.has(group.id), 'unique group id, label and hierarchy');
    groups.add(group.id);
  }
  require(Array.isArray(model.tokens), 'tokens');
  const tokens = new Set();
  for (const token of model.tokens) {
    require(record(token) && text(token.name) && text(token.type) && !tokens.has(token.name)
      && Object.hasOwn(token, 'raw') && Object.hasOwn(token, 'value'), 'unique typed token with raw/resolved values');
    tokens.add(token.name);
    require(groups.has(token.groupId) && ['colors', 'typography', 'geometry', 'effects', 'motion', 'other'].includes(token.category)
      && source(token.source), `group/category/source for ${token.name}`);
    require(record(token.preview) && previewKinds.includes(token.preview.kind), `preview for ${token.name}`);
    const { kind } = token.preview;
    if (kind === 'typography') {
      require(record(token.value) && Array.isArray(token.value.fontFamily) && token.value.fontFamily.every(text)
        && dimension(token.value.fontSize) && dimension(token.value.letterSpacing)
        && Number.isFinite(token.value.fontWeight) && Number.isFinite(token.value.lineHeight), `typography shape for ${token.name}`);
    }
    if (kind === 'color') require(typeof token.value === 'string'
      && ['foreground', 'stroke', 'background'].includes(token.preview.application), `color value/application for ${token.name}`);
    if (kind === 'fontFamily') require(Array.isArray(token.value) && token.value.every(text), `font family for ${token.name}`);
    if (['fontWeight', 'scale'].includes(kind)) require(Number.isFinite(token.value), `numeric preview for ${token.name}`);
    if (['fontSize', 'lineHeight', 'letterSpacing'].includes(kind)) require(dimension(token.value)
      || Number.isFinite(token.value), `typographic measure for ${token.name}`);
    if (kind === 'length' || kind === 'radius') {
      require(dimension(token.value), `dimension for ${token.name}`);
    }
  }
  require(Array.isArray(model.components), 'components');
  require(new Set(model.components.map(component => component?.id)).size === model.components.length, 'unique component ids');
  for (const component of model.components) {
    require(record(component) && text(component.id) && text(component.name) && source(component.source)
      && typeof component.element === 'string'
      && (component.stateCount === null || (Number.isInteger(component.stateCount) && component.stateCount >= 0))
      && Array.isArray(component.fields), 'component identity, source and fields');
    for (const field of component.fields) {
      require(record(field) && text(field.key) && text(field.label) && ['data', 'bindings'].includes(field.kind)
        && Object.hasOwn(field, 'value'), 'component field');
      if (field.kind === 'bindings') require(Array.isArray(field.value) && field.value.every(text), 'token bindings');
    }
  }
  require(Array.isArray(model.themes) && model.themes.every(theme => record(theme)
    && text(theme.id) && text(theme.status) && (theme.parentId === null || text(theme.parentId)) && source(theme.source)), 'themes');
  require(new Set(model.themes.map(theme => theme.id)).size === model.themes.length, 'unique theme ids');
  require(record(model.iconography) && Array.isArray(model.iconography.icons) && source(model.iconography.source), 'iconography');
  require(new Set(model.iconography.icons.map(icon => icon?.id)).size === model.iconography.icons.length, 'unique icon ids');
  for (const icon of model.iconography.icons) {
    require(record(icon) && text(icon.id) && typeof icon.usage === 'string' && typeof icon.mirror === 'boolean'
      && Object.hasOwn(icon, 'data'), 'icon identity and data');
    if (icon.glyph !== null) {
      require(record(icon.glyph) && text(icon.glyph.viewBox) && Array.isArray(icon.glyph.paths)
        && icon.glyph.paths.every(text) && text(icon.glyph.strokeWidth) && text(icon.glyph.fill)
        && text(icon.glyph.lineCap) && text(icon.glyph.lineJoin), 'supported SVG glyph');
    }
  }
  require(record(model.documentation) && record(model.capabilities)
    && Object.values(model.capabilities).every(value => typeof value === 'boolean'), 'reference sections and capabilities');
  for (const slots of Object.values(model.documentation)) {
    require(Array.isArray(slots), 'reference slots');
    for (const slot of slots) {
      require(record(slot) && text(slot.title) && Array.isArray(slot.expectedHeadings)
        && slot.expectedHeadings.every(text)
        && Array.isArray(slot.excerpts) && typeof slot.available === 'boolean', 'reference slot');
      for (const excerpt of slot.excerpts) {
        require(record(excerpt) && text(excerpt.title) && typeof excerpt.body === 'string'
          && Number.isInteger(excerpt.level) && excerpt.level >= 1 && excerpt.level <= 6 && source(excerpt.source), 'reference excerpt');
      }
      if (slot.contract) require(source(slot.contract.source) && text(slot.contract.key)
        && Object.hasOwn(slot.contract, 'value'), 'reference contract');
    }
  }
  require(model.principles === null || (record(model.principles) && Array.isArray(model.principles.intent)
    && model.principles.intent.every(text) && Array.isArray(model.principles.rules) && model.principles.rules.every(text)
    && Array.isArray(model.principles.sources) && model.principles.sources.every(item => text(item.title) && source(item.source))), 'principles');
  require(typeof model.guide === 'string' && Array.isArray(model.sourceIssues) && model.sourceIssues.every(text), 'source text and diagnostics');
  require(jsonValue(model), 'values must be finite, acyclic JSON data');
  return model;
}

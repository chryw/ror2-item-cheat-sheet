export const pages = [
    { id: 'principles', title: 'Principles', description: 'Design intent and working principles.' },
    { id: 'tokens', title: 'Tokens', description: 'Reusable decisions, resolved values, and alias relationships.' },
    { id: 'theming', title: 'Theming', description: 'System theme definitions, inheritance, and resolved token values. Explorer styling stays neutral.' },
    { id: 'components', title: 'Components', description: 'Individual controls: anatomy, inputs, states, behavior, and token bindings.' },
    { id: 'patterns', title: 'Patterns', description: 'How components work together to support a task or workflow.' },
    { id: 'iconography', title: 'Iconography', description: 'UI glyphs, semantic roles, geometry, and directionality.' },
    { id: 'assets', title: 'Assets', description: 'Artwork, images, and other content resources, separate from UI icons.' },
    { id: 'accessibility', title: 'Accessibility', description: 'Inclusive interaction requirements. Guidance is not evidence of conformance.' },
    { id: 'content', title: 'Content', description: 'Messages, localization, formatting, and content sources.' },
    { id: 'layout', title: 'Layout', description: 'Responsive composition across viewport sizes, input capabilities, and density.' },
    { id: 'adoption', title: 'Adoption & contribution', description: 'Migration, validation, contribution, and change history.' },
];

export const searchableLists = {
  tokens: { label: 'Search tokens', placeholder: 'Search token names, values, or aliases...' },
  components: { label: 'Search components', placeholder: 'Search component names, anatomy, or behavior...' },
  iconography: { label: 'Search icons', placeholder: 'Search icon names or usage...' },
};

export function isGuideComment(line) {
  return /^\s*<!--.*?-->\s*$/.test(line);
}

export const categories = [
  { id: 'all', title: 'All' },
  { id: 'colors', title: 'Colors' },
  { id: 'typography', title: 'Typography' },
  { id: 'geometry', title: 'Spacing & size' },
  { id: 'effects', title: 'Shape & effects' },
  { id: 'motion', title: 'Motion' },
  { id: 'other', title: 'Other' },
];

export function tokenCategory(token) {
  if (token.type === 'color') return 'colors';
  if (['typography', 'fontFamily', 'fontWeight'].includes(token.type)
    || /font-size|line-height|letter-spacing|(^|\.)typography(\.|$)/.test(token.name)) return 'typography';
  if (['duration', 'cubicBezier'].includes(token.type)
    || /(^|[.-])(motion|duration|easing|transition|animation)([.-]|$)/.test(token.name)) return 'motion';
  if (['neutral.shadow.ambient', 'border', 'strokeStyle'].includes(token.type)
    || /(^|[.-])(radius|stroke|shadow|opacity|elevation|z-index)([.-]|$)/.test(token.name)) return 'effects';
  if (['dimension', 'number'].includes(token.type)) return 'geometry';
  return 'other';
}

export function tokenGroup(token) {
  const parts = token.name.split('.');
  if (parts[0] === 'component') return parts.slice(0, 2).join('.');
  if (parts[0] === 'tenant' && parts[2] === 'component') return parts.slice(0, 4).join('.');
  if (token.type === 'color') {
    const color = parts.indexOf('color');
    if (parts[0] === 'primitive') return parts.slice(0, color + 2).join('.');
    if (parts[0] === 'semantic' || (parts[0] === 'context' && parts[1] === 'theme')) {
      return parts.slice(0, color + 3).join('.');
    }
  }
  const length = parts[0] === 'tenant' || (parts[0] === 'context' && parts[1] === 'theme')
    ? Math.min(parts.length - 1, 4) : Math.min(parts.length - 1, 3);
  return parts.slice(0, length).join('.');
}

// These are source bindings, not design policy. Missing headings stay visible as gaps.
export const documentationSlots = {
  theming: [
    { title: 'Theme guidance', headings: ['Themes', 'Theming'] },
  ],
  patterns: [
    { title: 'Composition', headings: ['Patterns', 'Adaptive lookup workspace'], contract: 'workspace' },
    { title: 'Control recipes', headings: ['Control anatomy and variants'], contract: 'controlRecipes' },
    { title: 'Interaction algorithms', headings: ['Select and picker state machine'], contract: 'interactionAlgorithms' },
    { title: 'Behavior scenarios', headings: ['Behavior acceptance contract'], contract: 'acceptance' },
  ],
  accessibility: [
    { title: 'Accessibility guidance', headings: ['Accessibility'] },
    { title: 'Control interaction', headings: ['Shared control and state contract'] },
  ],
  content: [
    { title: 'Writing & localization', headings: ['Localization and content'] },
    { title: 'Content sources', headings: ['Definitive content and source plug-ins'] },
  ],
  layout: [
    { title: 'Responsive behavior', headings: ['Responsive contract'] },
    { title: 'Density & sizing', headings: ['Density and sizing'] },
  ],
  iconography: [
    { title: 'Icon guidelines', headings: ['Iconography', 'Iconography and artwork'], contract: 'iconography' },
  ],
  assets: [
    { title: 'Asset catalog', headings: ['Asset catalog', 'Assets'] },
  ],
  adoption: [
    { title: 'Adoption & verification', headings: ['Adoption and verification'] },
    { title: 'Contribution process', headings: ['Contributing'] },
    { title: 'Change history', headings: ['Changelog'] },
  ],
};

export function sourcePosition(sourceMap, line) {
  const segment = sourceMap?.find(entry => line >= entry.start && line <= entry.end);
  return segment ? { file: segment.file, line: segment.line + line - segment.start } : { file: 'design.md', line };
}

export function extractGuideSections(guide, sourceMap) {
  const lines = guide.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  let fence;
  let frontmatter = lines[0] === '---';
  lines.forEach((line, index) => {
    if (frontmatter) {
      if (index > 0 && line === '---') frontmatter = false;
      return;
    }
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      return;
    }
    if (fence) return;
    const heading = /^(#{1,6}) (.+?)\s*#*\s*$/.exec(line);
    if (heading) headings.push({ title: heading[2], level: heading[1].length, line: index });
  });
  return headings.map((heading, index) => {
    const next = headings.slice(index + 1).find(item => item.level <= heading.level);
    return {
      title: heading.title,
      level: heading.level,
      line: heading.line + 1,
      ...(sourceMap ? { source: sourcePosition(sourceMap, heading.line + 1) } : {}),
      body: lines.slice(heading.line + 1, next?.line ?? lines.length).join('\n').trim(),
    };
  });
}

export function buildDocumentation(guide, contract, sourceMap) {
  const sections = extractGuideSections(guide, sourceMap);
  return Object.fromEntries(Object.entries(documentationSlots).map(([page, slots]) => [
    page,
    slots.map(slot => {
      const excerpts = sections.filter(section => slot.headings.includes(section.title) && section.body);
      const data = slot.contract ? contract[slot.contract] : undefined;
      const hasContract = data !== undefined && data !== null
        && (typeof data !== 'object' || Object.keys(data).length > 0);
      return {
        title: slot.title,
        expectedHeadings: slot.headings,
        excerpts,
        ...(hasContract ? { contract: { key: slot.contract, value: data } } : {}),
        available: excerpts.length > 0 || hasContract,
      };
    }),
  ]));
}

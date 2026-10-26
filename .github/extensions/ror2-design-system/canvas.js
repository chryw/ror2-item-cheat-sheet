import { categories, isGuideComment, pages, searchableLists } from './reference.mjs';
import { sourceHref } from './source.mjs';
import { assertExplorerModel } from './contract.mjs';

const $ = selector => document.querySelector(selector);
let snapshot;
let view;
let saveQueue = Promise.resolve();
let loadVersion = 0;
let snapshotTag;
let pendingLoads = 0;
let liveError = false;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function sourceLink(text, line) {
  const link = el('a', text);
  link.href = sourceHref(typeof line === 'object' ? line.line : line, line?.file);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${text} (opens source in a new tab)`);
  return link;
}

function sourceNote(label, line) {
  const note = el('p', undefined, 'meta');
  note.append('Source: ', sourceLink(label.replace(/^design\.md\b/, line?.file || 'design.md'), line));
  return note;
}

function report(error) {
  $('#status').className = 'error';
  $('#status').textContent = error.message;
}

function liveStatus(message, error = false) {
  const status = $('#live-status');
  if (status.textContent !== message) status.textContent = message;
  status.dataset.error = String(error);
  liveError = error;
}

function liveFailure(error) {
  liveStatus(`Live update failed: ${error.message}. ${snapshot ? 'Showing last valid data. ' : ''}Retrying automatically.`, true);
  if (!snapshot) report(error);
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function save() {
  const body = JSON.stringify(view);
  saveQueue = saveQueue.then(() => request('/api/view', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  })).catch(report);
}

function format(value) {
  if (value && value.unit) return `${value.value}${value.unit}`;
  if (Array.isArray(value) && value.every(item => ['string', 'number', 'boolean'].includes(typeof item))) return value.join(', ');
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
}

function preview(token) {
  const sample = el('span', undefined, 'preview');
  sample.setAttribute('aria-hidden', 'true');
  sample.title = `Preview of ${token.name}: ${format(token.value)}`;
  const kind = token.preview.kind;
  if (kind === 'color') {
    const swatch = el('span', undefined, 'swatch');
    const fill = el('span');
    fill.style.backgroundColor = token.value;
    swatch.append(fill);
    sample.append(swatch);
    if (token.preview.application === 'foreground') {
      const text = el('span', 'Aa', 'color-text');
      text.style.color = token.value;
      sample.append(text);
    } else if (token.preview.application === 'stroke') {
      const border = el('span', undefined, 'color-border');
      border.style.borderColor = token.value;
      sample.append(border);
    }
  } else if (kind === 'typography') {
    const type = token.value;
    Object.assign(sample.style, {
      fontFamily: type.fontFamily.map(name => JSON.stringify(name)).join(', '),
      fontSize: format(type.fontSize), fontWeight: type.fontWeight,
      lineHeight: type.lineHeight, letterSpacing: format(type.letterSpacing),
    });
    sample.textContent = 'Aa 0123';
  } else if (['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing'].includes(kind)) {
    sample.textContent = 'Aa 0123';
    sample.style[kind] = kind === 'fontFamily' ? token.value.map(name => JSON.stringify(name)).join(', ') : format(token.value);
  } else if (kind === 'length' || kind === 'radius') {
    const shape = el('span', undefined, kind === 'radius' ? 'radius' : 'ruler');
    if (kind === 'radius') shape.style.borderRadius = format(token.value);
    else {
      shape.style.width = `max(0px, ${format(token.value)})`;
      sample.title += ' (length preview capped at 80px)';
    }
    sample.append(shape);
  } else {
    sample.textContent = kind === 'scale' ? `×${token.value}` : format(token.value);
  }
  return sample;
}

function compactValue(token) {
  if (token.preview.kind === 'typography') {
    return `${format(token.value.fontSize)} / ${token.value.lineHeight} · ${token.value.fontWeight}`;
  }
  return format(token.value);
}

function sourceLabel(token) {
  if (typeof token.raw === 'string' && token.raw.startsWith('{')) return token.raw.slice(1, -1);
  return typeof token.raw === 'object' && token.preview.kind === 'typography' ? 'Composite aliases' : 'Literal';
}

function tokenRows(token, prefix, index) {
  const row = el('tr', undefined, 'token-row');
  row.dataset.token = token.name;
  const name = el('th');
  name.scope = 'row';
  const trigger = el('button', undefined, 'token-trigger');
  trigger.type = 'button';
  trigger.title = token.name;
  trigger.setAttribute('aria-label', `Inspect ${token.name}`);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `token-detail-${index}`);
  trigger.append(el('span', '›', 'chevron'), el('code', token.name.startsWith(`${prefix}.`) ? token.name.slice(prefix.length + 1) : token.name));
  name.append(trigger);
  const visual = el('td', undefined, 'preview-cell');
  visual.append(preview(token));
  const value = el('td', undefined, 'resolved-cell');
  const code = el('code', compactValue(token), 'compact-value');
  code.title = format(token.value);
  value.append(code);
  const source = el('td', undefined, 'source-cell');
  const alias = el('code', sourceLabel(token));
  alias.title = sourceLabel(token);
  source.append(alias);
  row.append(name, visual, value, source);

  const detail = el('tr', undefined, 'detail-row');
  detail.id = `token-detail-${index}`;
  detail.hidden = true;
  const cell = el('td');
  cell.colSpan = 4;
  const heading = el('div', undefined, 'detail-heading');
  heading.append(el('code', token.name), el('span', token.type, 'meta'));
  heading.append(sourceLink('View source', token.source));
  const copy = el('button', 'Copy token path', 'token-action');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(token.name);
      $('#status').className = '';
      $('#status').textContent = `Copied ${token.name}`;
    } catch (error) {
      report(new Error(`Clipboard unavailable: ${error.message}. Select the visible token path to copy it.`));
    }
  });
  heading.append(copy);
  const values = el('div', undefined, 'detail-values');
  [['Source', token.raw], ['Resolved', token.value]].forEach(([label, data]) => {
    const column = el('div');
    column.append(el('h3', label), el('pre', format(data)));
    values.append(column);
  });
  cell.append(heading, values);
  detail.append(cell);
  trigger.addEventListener('click', () => {
    detail.hidden = !detail.hidden;
    trigger.setAttribute('aria-expanded', String(!detail.hidden));
  });
  return [row, detail];
}

function tokenTable(tokens, group, offset) {
  const table = el('table', undefined, 'token-table');
  const caption = el('caption');
  const title = el('h3', group.label);
  title.title = group.path.join(' / ');
  caption.append(title, el('span', `${tokens.length} tokens`, 'meta'));
  table.append(caption);
  const head = el('thead');
  const headers = el('tr');
  ['Token', 'Preview', 'Resolved value', 'Source / alias'].forEach((text, index) => {
    const cell = el('th', text, index === 3 ? 'source-cell' : undefined);
    cell.scope = 'col';
    headers.append(cell);
  });
  head.append(headers);
  const body = el('tbody');
  tokens.forEach((token, index) => body.append(...tokenRows(token, group.id, offset + index)));
  table.append(head, body);
  return table;
}

function specimen() {
  const band = el('details', undefined, 'notes');
  band.dataset.disclosure = 'specimens';
  band.append(el('summary', 'Canvas control sample (illustrative only)'));
  band.append(el('p', 'Illustrative controls; complete behavior requirements are in the contracts below.', 'muted'));
  const row = el('div', undefined, 'specimen');
  const button = el('button', 'Select specimen', 'primary');
  button.type = 'button';
  button.dataset.focus = 'specimen';
  button.setAttribute('aria-pressed', 'false');
  const output = el('output', 'Not selected');
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pressed));
    output.textContent = pressed ? 'Selected' : 'Not selected';
  });
  const disabled = el('button', 'Disabled');
  disabled.disabled = true;
  row.append(button, disabled, output);
  band.append(row);
  return band;
}

function componentRow(component) {
  const name = component.name;
  const detail = el('details', undefined, 'component-row');
  detail.dataset.disclosure = `component:${name}`;
  const summary = el('summary');
  summary.append(el('strong', name), el('code', component.element));
  if (component.stateCount !== null) summary.append(el('span', `${component.stateCount} states`, 'meta'));
  detail.append(summary);
  const body = el('div', undefined, 'component-body');
  const definitions = el('dl');
  component.fields.forEach(field => {
    const value = el('dd');
    if (field.kind === 'bindings') {
      field.value.forEach(name => {
        const link = el('button', name, 'token-link');
        link.type = 'button';
        link.addEventListener('click', () => {
          view.section = 'tokens';
          view.category = 'all';
          view.queries.tokens = name;
          render();
          save();
          $('#content').focus({ preventScroll: true });
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        value.append(link);
      });
    } else if (Array.isArray(field.value) && field.value.every(item => typeof item === 'string')) {
      value.textContent = field.value.join(' · ');
    } else if (field.value !== null && typeof field.value === 'object') value.append(contractTree(field.value));
    else value.textContent = format(field.value);
    definitions.append(el('dt', field.label), value);
  });
  body.append(definitions);
  body.append(sourceNote(`design.md / ${name}`, component.source));
  body.append(el('p', 'Compiled contract only; implementation, accessibility testing, and production examples are not verified here.', 'meta'));
  detail.append(body);
  return detail;
}

function inline(text, target) {
  text.split(/(`[^`]+`)/g).forEach(part => {
    target.append(part.startsWith('`') && part.endsWith('`') ? el('code', part.slice(1, -1)) : document.createTextNode(part));
  });
}

function markdown(source, identity, sourceLevel) {
  const fragment = document.createDocumentFragment();
  const lines = source.split('\n');
  let index = 0;
  let codeIndex = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || isGuideComment(line)) { index += 1; continue; }
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}\\s*$`).test(lines[index])) code.push(lines[index++]);
      index += 1;
      const detail = el('details', undefined, 'notes');
      detail.dataset.disclosure = `${identity}:code:${codeIndex++}`;
      detail.append(el('summary', `Code / data example${fence[2].trim() ? ` (${fence[2].trim()})` : ''}`), el('pre', code.join('\n')));
      fragment.append(detail);
      continue;
    }
    const heading = /^(#{1,6}) (.+)$/.exec(line);
    if (heading) {
      const node = el(`h${Math.min(6, Math.max(4, heading[1].length + 3 - sourceLevel))}`);
      inline(heading[2], node);
      fragment.append(node);
      index += 1;
      continue;
    }
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || '')) {
      const table = el('table');
      const split = row => row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|(?=(?:[^`]*`[^`]*`)*[^`]*$)/).map(cell => cell.trim().replace(/\\\|/g, '|'));
      const head = el('thead');
      const row = el('tr');
      split(line).forEach(text => { const cell = el('th'); cell.scope = 'col'; inline(text, cell); row.append(cell); });
      head.append(row);
      table.append(head);
      const body = el('tbody');
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        const row = el('tr');
        split(lines[index++]).forEach(text => { const cell = el('td'); inline(text, cell); row.append(cell); });
        body.append(row);
      }
      table.append(body);
      const wrapper = el('div', undefined, 'documentation-table');
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', 'Source reference table');
      wrapper.append(table);
      fragment.append(wrapper);
      continue;
    }
    const item = /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      const list = el(/^\s*\d+\./.test(line) ? 'ol' : 'ul');
      while (index < lines.length) {
        const match = /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(lines[index]);
        if (!match) break;
        let text = match[1];
        index += 1;
        while (index < lines.length && /^\s+\S/.test(lines[index]) && !/^\s*(?:[-*]|\d+\.)\s/.test(lines[index])) text += ` ${lines[index++].trim()}`;
        const li = el('li');
        inline(text, li);
        list.append(li);
      }
      fragment.append(list);
      continue;
    }
    const paragraph = el('p');
    const text = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isGuideComment(lines[index]) && !/^(?:#{1,6} | {0,3}(?:`{3,}|~{3,})|\s*(?:[-*]|\d+\.)\s)/.test(lines[index])) text.push(lines[index++]);
    inline(text.join(' '), paragraph);
    fragment.append(paragraph);
  }
  return fragment;
}

function contractTree(value) {
  if (Array.isArray(value)) {
    const list = el('ul');
    value.forEach(item => { const li = el('li'); li.append(contractTree(item)); list.append(li); });
    return list;
  }
  if (value && typeof value === 'object') {
    const list = el('dl');
    Object.entries(value).forEach(([key, item]) => {
      const description = el('dd');
      description.append(contractTree(item));
      list.append(el('dt', key), description);
    });
    return list;
  }
  return el('span', String(value));
}

function documentationPage() {
  const slots = snapshot.documentation[view.section] || [];
  if (!slots.length) {
    $('#status').textContent = 'No reference areas supplied';
    $('#content').append(el('p', 'No guidance is supplied for this section by the current source.', 'empty'));
    return;
  }
  const available = slots.filter(slot => slot.available).length;
  $('#status').textContent = `${available} / ${slots.length} reference areas sourced · not an implementation audit`;
  const article = el('article', undefined, 'documentation');
  const contents = el('nav', undefined, 'page-contents');
  contents.setAttribute('aria-label', 'On this page');
  contents.append(el('span', 'On this page', 'meta'));
  slots.forEach((slot, index) => {
    const id = `area-${view.section}-${index}`;
    const link = el('a', slot.title);
    link.href = `#${id}`;
    contents.append(link);
  });
  article.append(contents);
  slots.forEach((slot, index) => {
    const section = el('section', undefined, 'reference-area');
    section.id = `area-${view.section}-${index}`;
    const heading = el('div', undefined, 'area-heading');
    heading.append(el('h3', slot.title), el('span', slot.available ? 'Source available' : 'Not documented here', 'source-badge'));
    section.append(heading);
    if (!slot.available) {
      section.append(el('p', 'No source is bound to this reference area yet. This is a viewer slot, not a requirement or a claim of support.', 'muted'));
      section.append(el('p', `Source binding: design.md heading ${slot.expectedHeadings.map(name => `"${name}"`).join(' or ')}.`, 'meta'));
    }
    slot.excerpts.forEach(excerpt => {
      section.append(sourceNote(`design.md / ${excerpt.title}`, excerpt.source || excerpt.line), markdown(excerpt.body, `reference:${view.section}:${slot.title}:${excerpt.title}`, excerpt.level));
    });
    if (slot.contract) {
      const contract = el('details', undefined, 'notes');
      contract.dataset.disclosure = `reference:${view.section}:${slot.title}:contract`;
      contract.append(el('summary', `Structured contract: ${slot.contract.key}`));
      contract.append(sourceNote(`design.md / ${slot.contract.key}`, slot.contract.source), contractTree(slot.contract.value));
      section.append(contract);
    }
    article.append(section);
  });
  $('#content').append(article);
}

function referenceTable(headers) {
  const table = el('table', undefined, 'reference-table');
  const head = el('thead');
  const row = el('tr');
  headers.forEach(label => { const cell = el('th', label); cell.scope = 'col'; row.append(cell); });
  head.append(row);
  table.append(head);
  return table;
}

async function inspectTheme(theme, openTokens = false) {
  try {
    await load(theme);
    if (openTokens) {
      view.section = 'tokens';
      render();
      $('#content').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    save();
  } catch (error) {
    if (view) $('#theme').value = view.theme;
    liveFailure(error);
  }
}

function renderThemes() {
  const table = referenceTable(['Theme', 'Status', 'Inherits', 'Token values']);
  const body = el('tbody');
  snapshot.themes.forEach(theme => {
    const name = theme.id;
    const row = el('tr');
    const title = el('th', name);
    title.scope = 'row';
    const action = el('td');
    if (snapshot.activeThemes.includes(name)) {
      const button = el('button', 'Inspect tokens');
      button.type = 'button';
      button.setAttribute('aria-label', `Inspect ${name} token values`);
      button.addEventListener('click', () => inspectTheme(name, true));
      action.append(button);
    } else action.append(el('span', 'Not available', 'meta'));
    row.append(title, el('td', theme.status), el('td', theme.parentId || 'None'), action);
    body.append(row);
  });
  table.append(body);
  $('#content').append(sourceNote('design.md / theme metadata', snapshot.themes[0]?.source), el('p', 'Theme status describes system definitions, not product adoption. Inspecting values never changes the explorer appearance.', 'hint'), table);
}

function renderIcons() {
  const registry = snapshot.iconography;
  const query = view.queries.iconography.toLowerCase();
  const roles = registry.icons.filter(icon => `${icon.id} ${icon.usage}`.toLowerCase().includes(query));
  if (!roles.length) {
    $('#content').append(el('p', registry.icons.length ? 'No matching UI icons. Try a different icon name or usage.' : 'No UI icon roles are defined in this source.', 'empty'));
    if (!snapshot.capabilities.iconography && registry.data !== null) $('#content').append(contractTree(registry.data));
    return 0;
  }
  const table = referenceTable(['Glyph', 'Name', 'Usage']);
  table.classList.add('icon-table');
  const body = el('tbody');
  roles.forEach(role => {
    const row = el('tr');
    const glyph = el('td');
    if (role.glyph) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Object.entries({
        viewBox: role.glyph.viewBox, width: '24', height: '24', fill: role.glyph.fill,
        stroke: 'currentColor', 'stroke-linecap': role.glyph.lineCap, 'stroke-linejoin': role.glyph.lineJoin,
        'aria-hidden': 'true',
      }).forEach(([attribute, value]) => svg.setAttribute(attribute, value));
      svg.style.strokeWidth = role.glyph.strokeWidth;
      role.glyph.paths.forEach(data => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', data);
        svg.append(path);
      });
      glyph.append(svg);
    } else glyph.append(el('span', 'Data only', 'meta'));
    const title = el('th');
    title.scope = 'row';
    title.append(el('code', role.id), el('div', role.mirror ? 'Mirrors in RTL' : 'Fixed direction', 'meta'));
    const usage = el('td', role.usage);
    if (!role.glyph) usage.append(contractTree(role.data));
    row.append(glyph, title, usage);
    body.append(row);
  });
  table.append(body);
  $('#content').append(table);
  return roles.length;
}

function render() {
  const content = $('#content');
  content.replaceChildren();
  document.querySelectorAll('[data-section]').forEach(button => {
    if (button.dataset.section === view.section) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const page = pages.find(page => page.id === view.section);
  $('#page-title').textContent = page.title;
  $('#page-description').textContent = page.description;
  document.title = `${page.title} · Design System Explorer`;
  $('#content').setAttribute('aria-labelledby', 'page-title');
  $('#token-categories').hidden = view.section !== 'tokens';
  document.querySelectorAll('[data-category]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === view.category));
    const category = categories.find(category => category.id === button.dataset.category);
    const count = snapshot.tokens.filter(token => category.id === 'all' || token.category === category.id).length;
    button.replaceChildren(document.createTextNode(category.title), el('span', ` ${count}`, 'meta'));
    button.title = `${count} tokens in the source, before search`;
  });
  const list = searchableLists[view.section];
  $('.filters').hidden = !list;
  $('.filters').dataset.list = view.section;
  $('#theme-filter').hidden = view.section !== 'tokens';
  if (list) {
    $('#query-label').textContent = list.label;
    $('#query').placeholder = list.placeholder;
    $('#query').value = view.queries[view.section];
  }
  if (view.section === 'theming') {
    renderThemes();
    documentationPage();
    $('#status').textContent = `${snapshot.themes.length} theme definitions · token context: ${view.theme}`;
    return;
  }
  if (view.section === 'iconography') {
    const count = renderIcons();
    documentationPage();
    $('#status').textContent = `${count} matching icons · source-owned glyphs, not artwork assets`;
    return;
  }
  if (!['principles', 'tokens', 'components'].includes(view.section)) {
    documentationPage();
    return;
  }
  if (view.section === 'principles') {
    if (!snapshot.principles) {
      content.append(el('p', 'No principles are supplied by the current source. See source diagnostics; the Explorer does not generate principles.', 'empty'));
      $('#status').textContent = 'Principles unavailable · see source warning';
      return;
    }
    const principles = el('article', undefined, 'principles');
    const provenance = el('p', undefined, 'meta');
    provenance.append('Source: ');
    snapshot.principles.sources.forEach((item, index) => {
      if (index) provenance.append(' / ');
      provenance.append(sourceLink(item.title, item.source));
    });
    principles.append(provenance);
    principles.append(el('h3', 'Design intent'));
    snapshot.principles.intent.forEach(paragraph => principles.append(el('p', paragraph)));
    principles.append(el('h3', "Do's and Don'ts"));
    const rules = el('ul');
    snapshot.principles.rules.forEach(rule => rules.append(el('li', rule)));
    principles.append(rules);
    content.append(principles);
    $('#status').textContent = `${snapshot.principles.rules.length} working principles · source: design.md`;
    return;
  }
  const query = view.queries[view.section].toLowerCase();
  if (view.section === 'components') {
    content.append(el('p', 'Expand a contract to inspect it. Token bindings open the token reference. These are specifications, not implemented component demos.', 'hint'));
    const components = snapshot.components.filter(component => JSON.stringify(component).toLowerCase().includes(query));
    components.forEach(component => content.append(componentRow(component)));
    if (!components.length) content.append(el('p', 'No matching components. Try a different component search.', 'empty'));
    content.append(specimen());
    $('#status').textContent = `${components.length} component contracts`;
    return;
  }
  const tokens = snapshot.tokens.filter(token => {
    if (!`${token.name} ${token.type} ${format(token.value)} ${format(token.raw)}`.toLowerCase().includes(query)) return false;
    return view.category === 'all' || token.category === view.category;
  });
  let offset = 0;
  const groups = Map.groupBy(tokens, token => token.groupId);
  snapshot.groups.forEach(group => {
    const items = groups.get(group.id);
    if (!items) return;
    content.append(tokenTable(items, group, offset));
    offset += items.length;
  });
  if (!tokens.length) {
    const sourceHasCategory = snapshot.tokens.some(token => view.category === 'all' || token.category === view.category);
    content.append(el('p', sourceHasCategory
      ? 'No matching tokens. Clear the token search or choose a different category.'
      : 'No tokens are defined in this category yet. This view is ready when the source supplies them.', 'empty'));
  }
  $('#status').textContent = `${tokens.length} matching tokens / ${snapshot.tokens.length} total · ${view.theme}`;
}

function captureReadingState() {
  const content = $('#content');
  const active = document.activeElement;
  const focusedRow = content.contains(active) ? active.closest('tr') : null;
  const token = focusedRow && (focusedRow.dataset.token || focusedRow.previousElementSibling?.dataset.token);
  return {
    scroll: window.scrollY,
    tokens: new Set([...content.querySelectorAll('.token-row')].filter(row => (
      row.querySelector('.token-trigger').getAttribute('aria-expanded') === 'true'
    )).map(row => row.dataset.token)),
    disclosures: new Set([...content.querySelectorAll('details[open][data-disclosure]')].map(node => node.dataset.disclosure)),
    pressed: content.querySelector('[data-focus="specimen"]')?.getAttribute('aria-pressed') === 'true',
    focus: !content.contains(active) ? null : {
      token,
      action: active.classList.contains('token-action'),
      disclosure: active.tagName === 'SUMMARY' ? active.parentElement.dataset.disclosure : null,
      specimen: active.dataset.focus === 'specimen',
    },
  };
}

function restoreReadingState(reading) {
  let focused;
  const content = $('#content');
  content.querySelectorAll('.token-row').forEach(row => {
    const trigger = row.querySelector('.token-trigger');
    if (reading.tokens.has(row.dataset.token)) {
      trigger.setAttribute('aria-expanded', 'true');
      row.nextElementSibling.hidden = false;
    }
    if (reading.focus?.token === row.dataset.token) {
      focused = reading.focus.action ? row.nextElementSibling.querySelector('.token-action') : trigger;
    }
  });
  content.querySelectorAll('details[data-disclosure]').forEach(detail => {
    detail.open = reading.disclosures.has(detail.dataset.disclosure);
    if (reading.focus?.disclosure === detail.dataset.disclosure) focused = detail.querySelector('summary');
  });
  const specimenButton = content.querySelector('[data-focus="specimen"]');
  if (specimenButton && reading.pressed) {
    specimenButton.setAttribute('aria-pressed', 'true');
    specimenButton.parentElement.querySelector('output').textContent = 'Selected';
  }
  if (reading.focus?.specimen) focused = specimenButton;
  if (reading.focus) (focused || content).focus({ preventScroll: true });
  window.scrollTo({ top: reading.scroll, behavior: 'instant' });
}

async function load(theme, { background = false } = {}) {
  if (background && pendingLoads) return;
  pendingLoads += 1;
  const version = ++loadVersion;
  try {
    const response = await fetch(`/api/system${theme ? `?theme=${encodeURIComponent(theme)}` : ''}`, {
      headers: snapshotTag && theme === snapshot?.theme ? { 'If-None-Match': snapshotTag } : {},
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (version !== loadVersion) return;
    if (response.status === 304) {
      if (liveError) liveStatus('Live: up to date · checks every 2s');
      return;
    }
    if (!response.ok) throw new Error(await response.text());
    const next = assertExplorerModel(await response.json());
    if (version !== loadVersion) return;
    const reading = snapshot ? captureReadingState() : null;
    snapshot = next;
    snapshotTag = response.headers.get('ETag');
    view = view || snapshot.view;
    view.theme = snapshot.theme;
    $('#subtitle').textContent = `${snapshot.metadata.name} · v${snapshot.metadata.revision} · live worktree`;
    $('#theme').replaceChildren(...snapshot.activeThemes.map(name => {
      const option = el('option', name);
      option.value = name;
      return option;
    }));
    $('#theme').value = view.theme;
    $('#guide-source').textContent = snapshot.guide;
    $('#source-status').hidden = snapshot.sourceIssues.length === 0;
    $('#source-status').textContent = snapshot.sourceIssues.join(' ');
    $('#status').className = '';
    render();
    if (reading) restoreReadingState(reading);
    liveStatus(reading ? `Live: updated ${new Date().toLocaleTimeString()}` : 'Live: updates every 2s');
  } finally {
    pendingLoads -= 1;
  }
}

pages.forEach(page => {
  const button = el('button', page.title);
  button.type = 'button';
  button.dataset.section = page.id;
  $('#sections').append(button);
});
categories.forEach(category => {
  const button = el('button', category.title);
  button.type = 'button';
  button.dataset.category = category.id;
  $('#token-categories').append(button);
});
const narrowNavigation = matchMedia('(max-width: 899px)');
$('#reference-navigation').addEventListener('click', event => {
  const button = event.currentTarget;
  button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
});

document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => {
  if (!view) return;
  view.section = button.dataset.section;
  render();
  save();
  if (narrowNavigation.matches) {
    $('#reference-navigation').setAttribute('aria-expanded', 'false');
    $('#page-title').tabIndex = -1;
    $('#page-title').focus();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}));
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  if (!view) return;
  view.category = button.dataset.category;
  render();
  save();
}));
$('#query').addEventListener('input', event => {
  if (!view) return;
  view.queries[view.section] = event.target.value;
  render();
  save();
});
$('#theme').addEventListener('change', event => inspectTheme(event.target.value));
$('#reload').addEventListener('click', () => load(view?.theme).catch(liveFailure));
load().catch(liveFailure);
setInterval(() => load(view?.theme, { background: true }).catch(liveFailure), 2000);

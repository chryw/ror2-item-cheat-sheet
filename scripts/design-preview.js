/* eslint-env browser */
import { element, button, hyperlink, searchbox, card, panel, select, format, configureIcons } from './design-components.mjs';

const variable = name => `--ds-${name.replace(/\./g, '-')}`;

async function readJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Preview data failed: ${url} HTTP ${response.status}`);
  return response.json();
}

async function startPreview() {
  const tenant = new URLSearchParams(window.location.search).get('tenant')
    || document.body.dataset.defaultTenant;
  if (!/^[a-z][a-z0-9-]*$/.test(tenant)) throw new Error(`Invalid validation tenant: ${tenant}`);
  const [fixture, contract] = await Promise.all([readJson(`/api/${tenant}`), readJson('/api/components')]);
  const { messages } = fixture;
  configureIcons(contract.iconography);
  const stylesheet = document.querySelector('#tokens');
  await new Promise((resolve, reject) => {
    stylesheet.addEventListener('load', resolve, { once: true });
    stylesheet.addEventListener('error', () => reject(new Error('Token stylesheet could not load')), { once: true });
    stylesheet.href = `/tokens/${tenant}.css`;
  });
  document.title = `${fixture.title} ${fixture.highlight} — token validation`;
  const shell = element('div', 'shell');
  const header = element('header', 'product-header');
  const workspace = element('div', 'workspace');
  const gallery = element('main', 'gallery');
  gallery.setAttribute('aria-label', messages.gallery);
  gallery.tabIndex = 0;
  const navigation = panel('filters', messages.filters, 'nav');
  navigation.node.classList.add('filter-panel');
  navigation.header.append(element('h2', '', messages.filters));
  const details = panel('details', messages.detail);
  details.node.classList.add('detail-panel');
  details.node.setAttribute('aria-labelledby', 'detail-title');
  const closeDetails = button(messages.close, () => closeDetail(), {
    variant: 'ghost', iconSlot: 'closePanel', iconOnly: true,
  });
  closeDetails.setAttribute('aria-label', messages.closeDetails);
  const detailHeading = element('h2');
  detailHeading.id = 'detail-title';
  details.header.append(closeDetails);
  const toggle = button(messages.filters, () => setNavigation(navigation.node.hidden), {
    controls: navigation.node.id, expanded: false, iconSlot: 'filterDisclosure', collapseLabel: true,
  });
  toggle.classList.add('filter-toggle');
  const identity = element('div', 'product-identity');
  const title = element('h1', '', `${fixture.title} `);
  title.append(element('span', '', fixture.highlight));
  identity.append(title, element('p', '', messages.subtitle));
  header.append(toggle, element('div', 'header-divider'), identity);
  workspace.append(navigation.node, gallery, details.node);
  shell.append(header, workspace);
  const announcement = element('p', 'visually-hidden');
  announcement.setAttribute('role', 'status');
  document.body.replaceChildren(shell, announcement);
  const compact = matchMedia(contract.runtime.compactQuery);
  const selections = {};
  let selectedEntry = null;
  let cards = new Map();
  const search = searchbox('catalog-search', messages.search, () => render(), {
    clearLabel: messages.clearSearch, placeholder: messages.searchPlaceholder,
  });
  navigation.body.append(search.node);
  fixture.filters.forEach(definition => {
    const control = select({
      id: `filter-${definition.key}`,
      text: messages[definition.message],
      options: definition.options,
      multiple: definition.multiple,
      value: definition.multiple ? [] : definition.options[0].value,
      onChange: () => render(),
      messages: { ...messages, all: messages[definition.allMessage] },
      contract,
    });
    selections[definition.key] = control;
    navigation.body.append(control.node);
  });
  const density = select({
    id: 'density',
    text: messages.density,
    options: contract.runtime.densities.map(value => ({ value, label: messages[value] })),
    value: contract.runtime.defaultDensity,
    onChange: () => render(),
    messages,
    contract,
  });
  navigation.body.append(density.node, button(messages.resetFilters, () => {
    search.input.value = '';
    fixture.filters.forEach(definition => {
      selections[definition.key].set(definition.multiple ? [] : definition.options[0].value);
    });
    render();
  }, { iconSlot: 'resetFilters' }));
  const links = element('nav', 'example-links');
  links.setAttribute('aria-label', messages.examples);
  fixture.examples.forEach(example => links.append(hyperlink(example.name, `/?tenant=${example.id}`)));
  navigation.body.append(links);

  function closeOwnedSurfaces() {
    [...Object.values(selections), density].forEach(control => control.close());
  }

  function syncWorkspace() {
    const modalDetails = compact.matches && selectedEntry !== null;
    gallery.inert = compact.matches && (!navigation.node.hidden || modalDetails);
    header.inert = modalDetails;
    navigation.node.inert = modalDetails;
    details.node.setAttribute('role', compact.matches ? 'dialog' : 'region');
    if (modalDetails) details.node.setAttribute('aria-modal', 'true');
    else details.node.removeAttribute('aria-modal');
    toggle.setAttribute('aria-expanded', String(!navigation.node.hidden));
    toggle.setAttribute('aria-label', navigation.node.hidden ? messages.showFilters : messages.hideFilters);
  }

  function setNavigation(open, restore = true) {
    if (!open) closeOwnedSurfaces();
    navigation.node.hidden = !open;
    syncWorkspace();
    if (open) search.input.focus({ preventScroll: true });
    else if (restore) toggle.focus({ preventScroll: true });
  }

  function closeDetail() {
    const origin = selectedEntry && cards.get(selectedEntry.id);
    selectedEntry = null;
    details.node.hidden = true;
    cards.forEach(node => node.setAttribute('aria-pressed', 'false'));
    syncWorkspace();
    (origin && origin.isConnected ? origin : gallery).focus({ preventScroll: true });
  }

  const image = entry => {
    if (entry.image) {
      const img = element('img', 'item-icon');
      img.src = entry.image;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        img.alt = messages.imageUnavailable;
        img.classList.add('image-unavailable');
      });
      return img;
    }
    const glyph = element('div', 'item-icon');
    glyph.setAttribute('aria-hidden', 'true');
    glyph.style.color = `var(${variable(entry.colorToken)})`;
    if (entry.glyphPath) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 52 52');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '5');
      const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', entry.glyphPath);
      svg.append(shape);
      glyph.append(svg);
    }
    return glyph;
  };

  function dlcIcon(entry, className, decorative = false) {
    const icon = element('img', className);
    icon.src = entry.dlcIcon;
    icon.alt = decorative ? '' : entry.dlc;
    return icon;
  }

  function showDetail(entry, origin) {
    selectedEntry = entry;
    origin.focus({ preventScroll: true });
    cards.forEach((node, id) => node.setAttribute('aria-pressed', String(id === entry.id)));
    detailHeading.textContent = entry.name;
    details.node.style.setProperty('--cue', `var(${variable(entry.colorToken)})`);
    const artwork = image(entry);
    artwork.className = 'detail-image';
    if (artwork.tagName === 'IMG') artwork.loading = 'eager';
    details.header.replaceChildren();
    if (entry.wikiLink) {
      details.header.append(hyperlink(messages.wiki, entry.wikiLink, true, {
        iconSlot: 'externalReference', iconOnly: true,
      }));
    }
    if (entry.catalogId !== undefined && entry.catalogId !== null) {
      details.header.append(element('span', 'entry-id', `#${entry.catalogId}`));
    }
    details.header.append(closeDetails);
    const overview = element('section', 'detail-overview');
    const detailIdentity = element('div', 'detail-identity');
    detailIdentity.append(detailHeading);
    if (entry.dlc) {
      const expansion = element('div', 'detail-dlc');
      if (entry.dlcIcon) expansion.append(dlcIcon(entry, 'detail-dlc-icon', true));
      expansion.append(element('span', '', entry.dlc));
      detailIdentity.append(expansion);
    }
    overview.append(detailIdentity);
    overview.append(artwork, element('p', 'detail-summary', entry.shortDescription));
    if (entry.description) overview.append(element('p', 'detail-description', entry.description));
    details.body.replaceChildren(overview);
    ['cooldown', 'unlock', 'dropsFrom'].forEach(key => {
      if (!entry[key]) return;
      const value = entry[key];
      details.body.append(element('h3', '', messages[key]), element('p', 'detail-fact', typeof value === 'string' ? value : [value.name, value.source, value.description].filter(Boolean).join('\n')));
      if (value.link || value.url) {
        details.body.append(hyperlink(messages.wiki, value.link || value.url, true));
      }
    });
    const groupFilter = button(entry.group, () => {
      selections.group.set([entry.group]);
      render();
      if (compact.matches) closeDetail();
    });
    groupFilter.classList.add('classification-action');
    groupFilter.setAttribute('aria-label', format(messages.filterByGroup, { value: entry.group }));
    details.body.append(element('h3', '', messages.rarity), groupFilter);
    if (entry.displayCategories && entry.displayCategories.length) {
      const categories = element('ul', 'detail-categories');
      entry.displayCategories.forEach(category => categories.append(element('li', '', category)));
      details.body.append(element('h3', '', messages.category), categories);
    }
    if (entry.attributes && entry.attributes.length) {
      const attributes = element('dl', 'detail-attributes');
      entry.attributes.forEach(attribute => {
        attributes.append(element('dt', '', messages[attribute.label]), element('dd', '', attribute.value));
      });
      details.body.append(attributes);
    }
    if (entry.stackingStats && entry.stackingStats.length) {
      const scroll = element('div', 'table-scroll');
      scroll.tabIndex = 0;
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', messages.statistics);
      const table = element('table', 'ds-table');
      const head = element('thead');
      const labels = element('tr');
      ['stat', 'value', 'stack', 'add'].forEach(key => {
        const cell = element('th', '', messages[key]);
        cell.scope = 'col';
        labels.append(cell);
      });
      head.append(labels);
      const body = element('tbody');
      entry.stackingStats.forEach(stat => {
        const row = element('tr');
        ['stat', 'value', 'stackType', 'stackValue'].forEach(key => row.append(element('td', '', stat[key])));
        body.append(row);
      });
      table.append(head, body);
      scroll.append(table);
      details.body.append(element('h3', '', messages.statistics), scroll);
    }
    details.node.hidden = false;
    details.body.scrollTop = 0;
    if (compact.matches) setNavigation(false, false);
    syncWorkspace();
    if (compact.matches) closeDetails.focus({ preventScroll: true });
  }

  function render() {
    search.sync();
    document.documentElement.dataset.density = density.value;
    const term = search.input.value.trim().toLocaleLowerCase('en');
    const entries = fixture.entries.filter(entry => (
      (!term || `${entry.name} ${entry.shortDescription} ${entry.description || ''}`.toLocaleLowerCase('en').includes(term))
      && fixture.filters.every(definition => {
        const values = selections[definition.key].value;
        const selected = Array.isArray(values) ? values : [values];
        const actual = entry[definition.key];
        return !selected.length || selected.some(value => (
          Array.isArray(actual) ? actual.includes(value) : actual === value
        ));
      })
    ));
    const { scrollTop } = gallery;
    const fragment = document.createDocumentFragment();
    cards = new Map();
    fixture.sections.forEach(section => {
      const items = entries.filter(entry => entry.section === section);
      const wrapper = element('section', 'catalog-section');
      const heading = element('div', 'section-heading');
      const count = element('span', 'count', items.length);
      count.setAttribute('aria-label', format(messages.resultCount, { count: items.length }));
      heading.append(element('h2', '', section), count);
      wrapper.append(heading);
      if (!items.length) wrapper.append(element('p', 'empty', messages.empty));
      let groups = [];
      if (items.length) {
        groups = fixture.grouped
          ? [...new Set(items.map(entry => entry.group))].sort((a, b) => (
            items.find(entry => entry.group === a).order
              - items.find(entry => entry.group === b).order
          ))
          : [''];
      }
      groups.forEach(group => {
        const matches = items.filter(entry => !fixture.grouped || entry.group === group);
        const groupElement = element('section', 'rarity-group');
        groupElement.setAttribute('aria-label', `${group} ${section}`);
        groupElement.style.setProperty('--cue', `var(${variable(matches[0].colorToken)})`);
        if (fixture.grouped) groupElement.append(element('h3', 'group-heading', group));
        const list = element('div', 'item-list');
        matches.forEach(entry => {
          const node = card(entry.id, `${messages.detail}: ${entry.name}`, origin => showDetail(entry, origin));
          node.style.setProperty('--cue', `var(${variable(entry.colorToken)})`);
          node.setAttribute('aria-pressed', String(selectedEntry !== null && selectedEntry.id === entry.id));
          const text = element('div', 'item-details');
          text.append(element('h4', 'item-name', entry.name), element('p', 'item-short-description', entry.shortDescription));
          node.append(image(entry), text);
          if (entry.dlcIcon) {
            node.append(dlcIcon(entry, 'dlc-icon'));
          }
          cards.set(entry.id, node);
          list.append(node);
        });
        groupElement.append(list);
        wrapper.append(groupElement);
      });
      fragment.append(wrapper);
    });
    gallery.replaceChildren(fragment);
    gallery.scrollTop = scrollTop;
    announcement.textContent = format(messages.resultCount, { count: entries.length });
  }

  let compactMode = compact.matches;
  const updateLayout = () => {
    if (compactMode === compact.matches) return;
    compactMode = compact.matches;
    const hiddenFocus = navigation.node.contains(document.activeElement);
    setNavigation(false, false);
    if (compact.matches && selectedEntry) closeDetails.focus({ preventScroll: true });
    else if (hiddenFocus) toggle.focus({ preventScroll: true });
  };
  compact.addEventListener('change', updateLayout);
  window.addEventListener('resize', updateLayout);
  document.addEventListener('pointerdown', event => {
    if (compact.matches && !navigation.node.hidden && !navigation.node.contains(event.target)
      && !toggle.contains(event.target) && !document.querySelector('dialog:modal')) setNavigation(false);
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || document.querySelector('dialog:modal')) return;
    if (event.key === 'Escape') {
      if (!navigation.node.hidden) {
        event.preventDefault();
        setNavigation(false);
      } else if (compact.matches && selectedEntry) {
        event.preventDefault();
        closeDetail();
      }
    } else if (event.key === 'Tab' && compact.matches && (!navigation.node.hidden || selectedEntry)) {
      const scope = navigation.node.hidden ? details.node : navigation.node;
      const controls = [...scope.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]')]
        .filter(node => !node.hidden && node.getBoundingClientRect().width > 0);
      if (!navigation.node.hidden) controls.unshift(toggle);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  render();
  syncWorkspace();
}

startPreview().catch(error => {
  console.error(error);
  const message = element('p', '', error.message);
  message.setAttribute('role', 'alert');
  document.body.replaceChildren(message);
});

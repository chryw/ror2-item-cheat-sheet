export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let iconography;

export function configureIcons(specification) {
  const box = specification && typeof specification.viewBox === 'string'
    ? specification.viewBox.split(/\s+/).map(Number) : [];
  if (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0
    || !specification.roles || !specification.sizes
    || !Object.hasOwn(specification.sizes, specification.defaultSize)) {
    throw new Error('Iconography must be configured from the component contract');
  }
  iconography = specification;
}

export function icon(role, size) {
  if (!iconography || !Object.hasOwn(iconography.roles, role)) throw new Error(`Unknown UI icon role: ${role}`);
  const resolvedSize = size === undefined ? iconography.defaultSize : size;
  if (!Object.hasOwn(iconography.sizes, resolvedSize)) throw new Error(`Unknown UI icon size: ${resolvedSize}`);
  const box = iconography.viewBox.split(/\s+/).map(Number);
  const definition = iconography.roles[role];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const attributes = {
    viewBox: iconography.viewBox,
    width: box[2],
    height: box[3],
    fill: iconography.fill,
    stroke: 'currentColor',
    'stroke-linecap': iconography.lineCap,
    'stroke-linejoin': iconography.lineJoin,
    'aria-hidden': 'true',
    focusable: 'false',
    'data-icon': role,
    class: `ds-icon icon-${resolvedSize}${definition.mirror ? ' mirror-rtl' : ''}`,
  };
  Object.entries(attributes).forEach(([name, value]) => svg.setAttribute(name, value));
  svg.style.strokeWidth = `var(--ds-${iconography.stroke.slice(1, -1).replace(/\./g, '-')})`;
  const dimension = `var(--ds-${iconography.sizes[resolvedSize].slice(1, -1).replace(/\./g, '-')})`;
  svg.style.width = dimension;
  svg.style.height = dimension;
  definition.paths.forEach(data => {
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shape.setAttribute('d', data);
    svg.append(shape);
  });
  return svg;
}

export function iconForSlot(slot, size) {
  if (!iconography || !Object.hasOwn(iconography.slots, slot)) {
    throw new Error(`Unknown UI icon slot: ${slot}`);
  }
  return icon(iconography.slots[slot], size);
}

export function format(message, values) {
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Missing message argument: ${key}`);
    return String(values[key]);
  });
}

export function button(text, onClick, props = {}) {
  const node = element('button', `ds-button ${props.variant || 'secondary'}`, text);
  node.type = props.type || 'button';
  node.disabled = Boolean(props.disabled);
  if (props.size === 'compact') node.classList.add('control-compact');
  if (props.collapseLabel) node.classList.add('collapse-label');
  const mark = props.iconSlot ? iconForSlot(props.iconSlot) : props.icon && icon(props.icon);
  if (mark) {
    node.replaceChildren(mark);
    if (props.iconOnly) {
      node.classList.add('icon-only');
      node.setAttribute('aria-label', text);
    } else node.append(element('span', 'button-label', text));
  } else if (props.iconOnly) throw new Error('Icon-only buttons require an icon role');
  if (props.pressed !== undefined) node.setAttribute('aria-pressed', String(props.pressed));
  if (props.expanded !== undefined) node.setAttribute('aria-expanded', String(props.expanded));
  if (props.controls) node.setAttribute('aria-controls', props.controls);
  if (onClick) {
    node.addEventListener('click', event => {
      if (!node.disabled) onClick(event);
    });
  }
  return node;
}

export function hyperlink(text, href, newTab = false, props = {}) {
  const url = new URL(href, document.baseURI);
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
    throw new Error(`Unsupported link protocol: ${url.protocol}`);
  }
  const node = element('a', 'ds-link', text);
  if (props.icon || props.iconSlot) {
    node.replaceChildren(props.iconSlot ? iconForSlot(props.iconSlot) : icon(props.icon));
    if (props.iconOnly) {
      node.classList.add('icon-only');
      node.setAttribute('aria-label', text);
    } else node.append(element('span', '', text));
  }
  node.href = href;
  if (newTab) {
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
  }
  return node;
}

export function label(text, id) {
  const node = element('label', 'ds-label', text);
  node.htmlFor = id;
  return node;
}

export function searchbox(id, text, onInput, props = {}) {
  const node = element('div', 'ds-field');
  const control = element('div', 'search-control');
  const input = element('input', 'ds-search');
  input.type = 'search';
  input.id = id;
  input.autocomplete = 'off';
  input.placeholder = props.placeholder || '';
  const clear = props.clearLabel ? button(props.clearLabel, () => {
    input.value = '';
    sync();
    onInput('');
    input.focus({ preventScroll: true });
  }, { iconSlot: 'searchClear', iconOnly: true, variant: 'ghost' }) : null;
  function sync() {
    if (clear) clear.hidden = input.value.length === 0;
  }
  input.addEventListener('input', () => { sync(); onInput(input.value); });
  control.append(iconForSlot('searchLeading'), input);
  if (clear) {
    control.classList.add('custom-clear');
    control.append(clear);
  }
  node.append(label(text, id), control);
  sync();
  return { node, input, sync };
}

export function filterChip(text, removalName, onRemove, props = {}) {
  const node = element('span', 'filter-chip');
  node.append(element('span', '', text), button(removalName, onRemove, {
    iconSlot: 'removeValue', iconOnly: true, variant: 'ghost', size: 'compact', disabled: props.disabled,
  }));
  return node;
}

export function card(id, name, onSelect) {
  const node = element('div', 'item-card');
  node.dataset.entryId = id;
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', name);
  node.setAttribute('aria-pressed', 'false');
  node.setAttribute('aria-controls', 'details');
  node.addEventListener('click', () => onSelect(node));
  node.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.key === 'Enter' && !event.repeat) onSelect(node);
    }
  });
  node.addEventListener('keyup', event => {
    if (event.key === ' ') {
      event.preventDefault();
      onSelect(node);
    }
  });
  return node;
}

export function panel(id, title, tag = 'aside') {
  const node = element(tag, 'ds-panel');
  node.id = id;
  node.hidden = true;
  node.setAttribute('aria-label', title);
  node.setAttribute('role', tag === 'nav' ? 'navigation' : 'region');
  const header = element('header', 'panel-header');
  const body = element('div', 'panel-body');
  node.append(header, body);
  return { node, header, body };
}

export function createSelectionModel(options, multiple, initial, onCommit) {
  if (options.some(option => typeof option.value !== 'string' || typeof option.label !== 'string')) {
    throw new Error('Select options need string values and labels');
  }
  const allowed = new Set(options.map(option => option.value));
  if (allowed.size !== options.length) throw new Error('Duplicate select option values');
  const copy = value => (Array.isArray(value) ? value.slice() : value);
  const validate = value => {
    if (multiple ? !Array.isArray(value) : typeof value !== 'string') {
      throw new Error('Selection shape does not match multiplicity');
    }
    const values = multiple ? value : [value];
    if (new Set(values).size !== values.length
      || values.some(item => !allowed.has(item) && !(options.length === 0 && !multiple && item === ''))) {
      throw new Error('Unknown or duplicate selected value');
    }
    return copy(value);
  };
  let committed = validate(initial);
  let draft = copy(committed);
  let staged = false;
  const commit = value => {
    committed = validate(value);
    onCommit(copy(committed));
  };
  return {
    get value() { return copy(committed); },
    get draft() { return copy(draft); },
    open(transactional) { staged = transactional; draft = copy(committed); },
    choose(value) {
      if (!allowed.has(value)) throw new Error(`Unknown select option: ${value}`);
      const current = staged ? draft : committed;
      let next = value;
      if (multiple) {
        next = current.includes(value)
          ? current.filter(item => item !== value) : [...current, value];
      }
      if (staged) draft = next;
      else commit(next);
    },
    clear() {
      if (!multiple) throw new Error('Only multiple selections can be cleared');
      if (staged) draft = [];
      else commit([]);
    },
    apply() {
      if (!staged) throw new Error('No picker transaction to apply');
      staged = false;
      commit(draft);
    },
    cancel() { staged = false; draft = copy(committed); },
    set(value) { committed = validate(value); staged = false; draft = copy(committed); },
  };
}

export function select({
  id, text, options, multiple = false, value, onChange, messages, contract, disabled = false,
}) {
  const node = element('div', 'ds-field ds-select');
  const model = createSelectionModel(options, multiple, value, next => {
    onChange(next);
    renderControl();
  });
  const fieldLabel = label(text, id);
  fieldLabel.id = `${id}-label`;
  const tags = element('div', 'selected-values');
  const control = element('div', 'select-control');
  const input = element('input', 'select-input');
  input.id = id;
  input.type = 'text';
  input.autocomplete = 'off';
  input.disabled = disabled || options.length === 0;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', `${id}-list`);
  const inputArrow = iconForSlot('selectDisclosure');
  inputArrow.classList.add('select-caret');
  const trigger = button('', () => openPicker());
  const triggerValue = element('span');
  triggerValue.id = `${id}-value`;
  const arrow = iconForSlot('selectDisclosure');
  trigger.append(triggerValue, arrow);
  trigger.disabled = input.disabled;
  trigger.id = `${id}-trigger`;
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', `${id}-picker`);
  trigger.setAttribute('aria-labelledby', `${fieldLabel.id} ${triggerValue.id}`);
  const popup = element('div', 'select-popup');
  popup.dataset.selectOwner = id;
  popup.id = `${id}-list`;
  popup.setAttribute('role', 'listbox');
  popup.setAttribute('aria-label', text);
  if (multiple) popup.setAttribute('aria-multiselectable', 'true');
  popup.hidden = true;
  const dialog = element('dialog', 'picker-dialog');
  dialog.id = `${id}-picker`;
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  const header = element('header', 'picker-header');
  const title = element('h2', '', text);
  title.id = `${id}-title`;
  title.tabIndex = -1;
  const summary = element('p', 'picker-summary');
  summary.setAttribute('aria-live', 'polite');
  const closePicker = button(messages.close, () => close(true), {
    iconSlot: 'closePicker', iconOnly: true, variant: 'ghost',
  });
  closePicker.setAttribute('aria-label', format(messages.closePicker, { label: text }));
  const heading = element('div');
  heading.append(title, summary);
  header.append(heading, closePicker);
  const body = element('div', 'picker-body');
  const optionSearch = searchbox(`${id}-query`, format(messages.searchOptions, { label: text }), () => renderChoices());
  optionSearch.node.hidden = options.length <= contract.selection.optionSearchThreshold;
  const choices = element('fieldset', 'picker-options');
  const legend = element('legend', 'visually-hidden', text);
  body.append(optionSearch.node, choices);
  const footer = element('footer', 'picker-footer');
  const apply = button(messages.apply, () => { model.apply(); close(true); }, { variant: 'primary' });
  if (multiple) footer.append(button(messages.clear, () => { model.clear(); renderChoices(); }, { variant: 'ghost' }));
  const actions = element('div', 'picker-actions');
  actions.append(button(messages.cancel, () => close(true)), apply);
  footer.append(actions);
  dialog.append(header, body, footer);
  let popupOpen = false;
  const clearDimension = button(format(messages.clearDimension, { label: text }), () => {
    model.clear();
    if (popupOpen) renderPopup();
    input.focus({ preventScroll: true });
  }, { variant: 'ghost', disabled: input.disabled });
  clearDimension.classList.add('select-clear');
  control.append(tags, input, inputArrow);
  node.append(fieldLabel, control, trigger, clearDimension, dialog);
  const media = matchMedia(contract.runtime.pickerQuery);
  let query = '';
  let highlighted = 0;
  let matches = options;
  let pickerMode = null;
  const selected = option => (
    multiple ? model.value.includes(option.value) : model.value === option.value
  );
  const selectedText = () => options.filter(selected).map(option => option.label).join(', ');

  function renderControl() {
    const chosen = selectedText();
    triggerValue.textContent = chosen || messages.all;
    trigger.setAttribute('aria-expanded', String(dialog.open));
    input.setAttribute('aria-expanded', String(popupOpen));
    input.placeholder = multiple && model.value.length
      ? format(messages.searchOptions, { label: text }) : messages.all;
    if (!popupOpen) input.value = multiple ? '' : chosen;
    tags.replaceChildren();
    clearDimension.hidden = !multiple || media.matches || model.value.length === 0;
    if (multiple && !media.matches) {
      options.filter(selected).forEach(option => {
        const removalName = format(messages.removeValue, { label: text, value: option.label });
        const remove = filterChip(option.label, removalName, () => {
          model.choose(option.value);
          if (popupOpen) renderPopup();
          input.focus({ preventScroll: true });
        }, { disabled: input.disabled });
        remove.addEventListener('mousedown', event => event.preventDefault());
        tags.append(remove);
      });
    }
  }

  function close(restoreFocus = false) {
    const wasOpen = popupOpen || dialog.open;
    popupOpen = false;
    popup.hidden = true;
    input.removeAttribute('aria-activedescendant');
    model.cancel();
    if (dialog.open) dialog.close();
    renderControl();
    if (restoreFocus && wasOpen) (media.matches ? trigger : input).focus({ preventScroll: true });
  }

  function renderChoices() {
    const term = optionSearch.input.value.trim().toLocaleLowerCase('en');
    choices.replaceChildren(legend);
    options.filter(option => option.label.toLocaleLowerCase('en').includes(term)).forEach(option => {
      const row = element('label', 'picker-choice');
      const choice = element('input');
      choice.type = multiple ? 'checkbox' : 'radio';
      choice.name = `${id}-choice`;
      choice.value = option.value;
      choice.checked = multiple ? model.draft.includes(option.value) : model.draft === option.value;
      choice.addEventListener('change', () => { model.choose(option.value); updateDraft(); });
      row.append(choice, element('span', '', option.label));
      choices.append(row);
    });
    if (choices.children.length === 1) choices.append(element('p', '', messages.noOptions));
    updateDraft();
  }

  function updateDraft() {
    summary.textContent = multiple
      ? format(messages.selectedCount, { count: model.draft.length }) : messages.chooseOne;
    choices.querySelectorAll('input').forEach(choice => {
      Object.assign(choice, {
        checked: multiple ? model.draft.includes(choice.value) : model.draft === choice.value,
      });
    });
  }

  function updateViewport() {
    if (!dialog.open) return;
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const bottom = viewport ? Math.max(0, window.innerHeight - height - viewport.offsetTop) : 0;
    dialog.style.setProperty('--picker-viewport-height', `${height}px`);
    dialog.style.setProperty('--picker-viewport-bottom', `${bottom}px`);
  }

  function openPicker() {
    if (trigger.disabled || dialog.open) return;
    model.open(true);
    optionSearch.input.value = '';
    renderChoices();
    dialog.showModal();
    updateViewport();
    renderControl();
    title.focus({ preventScroll: true });
  }

  const pixels = dimension => dimension.value * (dimension.unit === 'rem'
    ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 1);
  function positionPopup() {
    if (!popupOpen) return;
    const anchor = control.getBoundingClientRect();
    let parent = node.parentElement;
    while (parent && parent !== document.body) {
      const bounds = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)
        && (anchor.bottom <= bounds.top || anchor.top >= bounds.bottom)) {
        close();
        return;
      }
      parent = parent.parentElement;
    }
    const gap = pixels(contract.runtime.popupGap);
    const inset = pixels(contract.runtime.viewportInset);
    const below = window.innerHeight - anchor.bottom - gap - inset;
    const above = anchor.top - gap - inset;
    const maximum = pixels(contract.runtime.popupMaxBlockSize);
    const upwards = below < Math.min(popup.scrollHeight, maximum) && above > below;
    const height = Math.max(0, Math.min(maximum, upwards ? above : below));
    const width = Math.min(anchor.width, window.innerWidth - inset * 2);
    popup.style.width = `${width}px`;
    popup.style.maxHeight = `${height}px`;
    popup.style.left = `${Math.max(inset, Math.min(anchor.left, window.innerWidth - width - inset))}px`;
    popup.style.top = `${upwards ? anchor.top - gap - Math.min(popup.scrollHeight, height) : anchor.bottom + gap}px`;
  }

  function renderPopup() {
    matches = options.filter(option => option.label.toLocaleLowerCase('en').includes(query.toLocaleLowerCase('en')));
    highlighted = Math.max(0, Math.min(highlighted, matches.length - 1));
    popup.replaceChildren();
    matches.forEach((option, index) => {
      const row = element('div', 'select-option');
      row.append(element('span', '', option.label));
      if (selected(option)) row.append(iconForSlot('selectedOption'));
      row.id = `${id}-option-${options.indexOf(option)}`;
      row.dataset.value = option.value;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(selected(option)));
      row.dataset.highlighted = String(index === highlighted);
      row.addEventListener('mousedown', event => event.preventDefault());
      row.addEventListener('click', () => {
        model.choose(option.value);
        if (!multiple) close(true);
        else renderPopup();
      });
      popup.append(row);
    });
    if (!matches.length) popup.append(element('p', '', messages.noOptions));
    const active = popup.children[highlighted];
    if (matches.length) input.setAttribute('aria-activedescendant', active.id);
    else input.removeAttribute('aria-activedescendant');
    positionPopup();
    if (matches.length) {
      if (active.offsetTop < popup.scrollTop) popup.scrollTop = active.offsetTop;
      else if (active.offsetTop + active.offsetHeight > popup.scrollTop + popup.clientHeight) {
        popup.scrollTop = active.offsetTop + active.offsetHeight - popup.clientHeight;
      }
    }
  }

  function openPopup() {
    if (media.matches || popupOpen || input.disabled) return;
    model.open(false);
    popupOpen = true;
    query = '';
    input.value = '';
    input.focus({ preventScroll: true });
    highlighted = Math.max(0, options.findIndex(selected));
    (node.closest('dialog[open]') || document.body).append(popup);
    popup.hidden = false;
    renderControl();
    renderPopup();
  }

  function updateMode() {
    if (pickerMode === media.matches) return;
    pickerMode = media.matches;
    const wasOpen = popupOpen || dialog.open;
    close();
    control.hidden = media.matches;
    input.hidden = media.matches;
    inputArrow.hidden = media.matches;
    trigger.hidden = !media.matches;
    fieldLabel.htmlFor = media.matches ? trigger.id : input.id;
    renderControl();
    if (wasOpen) (media.matches ? trigger : input).focus({ preventScroll: true });
  }
  input.addEventListener('click', openPopup);
  input.addEventListener('blur', event => {
    if (popupOpen && !node.contains(event.relatedTarget) && !popup.contains(event.relatedTarget)) {
      close();
    }
  });
  input.addEventListener('input', () => {
    const nextQuery = input.value;
    if (!popupOpen) openPopup();
    query = nextQuery;
    input.value = query;
    highlighted = 0;
    renderPopup();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && popupOpen) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') close();
    else if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      event.preventDefault();
      const wasOpen = popupOpen;
      openPopup();
      if (event.key === 'Enter' && wasOpen && matches.length) {
        model.choose(matches[highlighted].value);
        if (!multiple) close(true);
      } else if (wasOpen && event.key !== 'Enter') {
        highlighted = (highlighted + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % (matches.length || 1);
      }
      if (popupOpen) renderPopup();
    }
  });
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(true); });
  dialog.addEventListener('close', () => { if (dialog.open === false) close(); });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom)) close(true);
  });
  const outside = event => {
    if (popupOpen && !node.contains(event.target) && !popup.contains(event.target)) close();
  };
  document.addEventListener('pointerdown', outside);
  window.addEventListener('resize', positionPopup);
  window.addEventListener('scroll', positionPopup, true);
  window.addEventListener('resize', updateViewport);
  window.addEventListener('resize', updateMode);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewport);
    window.visualViewport.addEventListener('scroll', updateViewport);
  }
  media.addEventListener('change', updateMode);
  updateMode();
  return {
    node,
    get value() { return model.value; },
    set(next) { close(); model.set(next); renderControl(); },
    close,
  };
}

import { button, hyperlink } from './design-components.mjs';

const check = (condition, message) => {
  if (!condition) throw new Error(`Interaction contract failed: ${message}`);
};
const key = (node, value, type = 'keydown', shiftKey = false) => node.dispatchEvent(new KeyboardEvent(type, {
  key: value, bubbles: true, cancelable: true, shiftKey,
}));
const namedButton = (scope, name) => [...scope.querySelectorAll('button')].find(node => node.textContent === name);

export default async function verifyCurrentMode() {
  const tenant = new URLSearchParams(window.location.search).get('tenant') || document.body.dataset.defaultTenant;
  const fixture = await (await fetch(`/api/${tenant}`)).json();
  const contract = await (await fetch('/api/components')).json();
  const { messages } = fixture;
  check(['authoritative', 'illustrative-only'].includes(fixture.provenance.authority), 'declared content authority');
  check(tenant !== 'ror2' || /^[a-f0-9]{40}$/.test(fixture.provenance.revision), 'pinned source revision');
  check(document.querySelector('.filter-toggle [data-icon="menu"]'), 'role-based disclosure icon');
  document.querySelectorAll('[data-icon]').forEach(svg => {
    check(contract.iconography.roles[svg.dataset.icon] && svg.getAttribute('viewBox') === contract.iconography.viewBox
      && svg.getAttribute('aria-hidden') === 'true' && svg.getAttribute('focusable') === 'false', 'consistent decorative icon semantics');
  });
  const compact = matchMedia(contract.runtime.compactQuery).matches;
  const picker = matchMedia(contract.runtime.pickerQuery).matches;
  const toggle = document.querySelector('.filter-toggle');
  const nav = document.querySelector('#filters');
  const details = document.querySelector('#details');
  const gallery = document.querySelector('.gallery');
  const count = () => document.querySelectorAll('.item-card').length;
  const closeDetail = () => details.querySelector(`[aria-label="${messages.closeDetails}"]`).click();
  document.querySelectorAll('dialog[open]').forEach(node => node.dispatchEvent(new Event('cancel', { cancelable: true })));
  if (!details.hidden) closeDetail();
  if (!nav.hidden) toggle.click();
  toggle.click();
  check(!nav.hidden && toggle.getAttribute('aria-expanded') === 'true', 'navigation disclosure');
  check(gallery.inert === compact, 'navigation background ownership');
  check(document.activeElement.id === 'catalog-search', 'navigation initial focus');
  const navBounds = nav.getBoundingClientRect();
  check(compact ? navBounds.width === window.innerWidth
    : navBounds.right <= gallery.getBoundingClientRect().left + 1, 'navigation geometry');
  const reset = namedButton(nav, messages.resetFilters);
  reset.click();
  check(count() === fixture.entries.length, 'reset restores complete fixture');
  const search = document.querySelector('#catalog-search');
  search.value = 'no-such-pickup-acceptance-probe';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  check(count() === 0 && document.querySelectorAll('.count').length === fixture.sections.length, 'zero section counts');
  const clearSearch = document.querySelector('.search-control [aria-label]');
  check(!clearSearch.hidden, 'populated search exposes named clear action');
  clearSearch.click();
  check(search.value === '' && count() === fixture.entries.length && document.activeElement === search, 'search clear restores results and focus');
  reset.click();
  const first = fixture.filters[0].options[0].value;
  const expected = fixture.entries.filter(entry => entry.group === first).length;
  if (picker) {
    const trigger = document.querySelector('#filter-group-trigger');
    trigger.click();
    let dialog = document.querySelector('#filter-group-picker');
    check(dialog.matches(':modal'), 'picker uses real modal dialog');
    check(dialog.querySelector('.picker-header > div h2')
      && dialog.querySelector('.picker-actions .primary')
      && dialog.querySelector('.picker-header [data-icon="close"]'), 'picker action/header anatomy');
    dialog.querySelector('input[type=checkbox]').click();
    check(count() === fixture.entries.length, 'draft does not filter');
    namedButton(dialog, messages.cancel).click();
    check(count() === fixture.entries.length && document.activeElement === trigger, 'cancel discards and restores focus');
    trigger.click();
    dialog = document.querySelector('#filter-group-picker');
    dialog.querySelector('input[type=checkbox]').click();
    namedButton(dialog, messages.clear).click();
    check(count() === fixture.entries.length, 'clear is staged');
    dialog.querySelector('input[type=checkbox]').click();
    namedButton(dialog, messages.apply).click();
    check(count() === expected && !dialog.open, 'apply commits selected dimension');
    trigger.click();
    dialog.querySelectorAll('input[type=checkbox]')[1].click();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    check(count() === expected && !nav.hidden, 'Escape/cancel discards only inner picker');
  } else {
    const input = document.querySelector('#filter-group');
    input.click();
    const popup = document.querySelector('#filter-group-list');
    const bounds = popup.getBoundingClientRect();
    check(bounds.left >= 0 && bounds.right <= window.innerWidth + 1
      && bounds.top >= 0 && bounds.bottom <= window.innerHeight + 1, 'popup avoids viewport clipping');
    popup.querySelector('[role=option]').click();
    check(count() === expected && !popup.hidden, 'desktop multi commits and remains open');
    const second = fixture.filters[0].options[1].value;
    popup.querySelectorAll('[role=option]')[1].click();
    check(count() === fixture.entries.filter(entry => [first, second].includes(entry.group)).length, 'multi OR');
    key(input, 'ArrowDown');
    key(input, 'Enter');
    check(count() === expected, 'arrow highlight/Enter toggles selected option');
    key(input, 'Escape');
    check(popup.hidden && !nav.hidden, 'Escape dismisses inner popup only');
    check(document.querySelector('.selected-values button'), 'removable selected values');
    const chip = document.querySelector('.filter-chip');
    check(chip.closest('.select-control') && chip.querySelector('button [data-icon="close"]'), 'compound selected-pill anatomy');
    const remove = chip.querySelector('button');
    const glyph = remove.querySelector('svg');
    const target = remove.getBoundingClientRect();
    const mark = glyph.getBoundingClientRect();
    check(Math.abs((target.left + target.right) / 2 - (mark.left + mark.right) / 2) < 1
      && Math.abs((target.top + target.bottom) / 2 - (mark.top + mark.bottom) / 2) < 1, 'removal glyph is centered');
  }
  const dimension = fixture.filters[1];
  const secondary = dimension.options[0].value;
  if (picker) {
    document.querySelector(`#filter-${dimension.key}-trigger`).click();
    const dialog = document.querySelector(`#filter-${dimension.key}-picker`);
    dialog.querySelector('input[type=checkbox], input[type=radio]').click();
    namedButton(dialog, messages.apply).click();
  } else {
    document.querySelector(`#filter-${dimension.key}`).click();
    document.querySelector(`#filter-${dimension.key}-list [role=option]`).click();
    key(document.querySelector(`#filter-${dimension.key}`), 'Escape');
  }
  const candidates = fixture.entries.filter(entry => {
    const actual = entry[dimension.key];
    return entry.group === first && (
      Array.isArray(actual) ? actual.includes(secondary) : actual === secondary
    );
  });
  check(count() === candidates.length && count() > 0, 'cross-dimension AND');
  search.value = fixture.entries[0].description.slice(0, 24).toLocaleLowerCase('en');
  search.dispatchEvent(new Event('input', { bubbles: true }));
  check(count() === candidates.filter(entry => `${entry.name} ${entry.shortDescription} ${entry.description}`.toLocaleLowerCase('en').includes(search.value)).length, 'full-description search');
  reset.click();
  if (compact) toggle.click();
  let firstCard = document.querySelector('.item-card');
  firstCard.focus();
  key(firstCard, 'Enter');
  check(!details.hidden && firstCard.getAttribute('aria-pressed') === 'true', 'keyboard selects card');
  check(details.getAttribute('role') === (compact ? 'dialog' : 'region'), 'responsive detail semantics');
  check(gallery.inert === compact, 'details background ownership');
  check(nav.hidden === compact, 'desktop panels coexist; compact navigation closes');
  const detailBounds = details.getBoundingClientRect();
  check(compact ? detailBounds.width === window.innerWidth && detailBounds.top === 0
    : detailBounds.left >= gallery.getBoundingClientRect().right - 1, 'detail geometry');
  if (compact) {
    check(document.querySelector('.product-header').inert, 'modal details block header');
    const controls = [...details.querySelectorAll('button, a[href], [tabindex="0"]')];
    controls[controls.length - 1].focus();
    key(document.activeElement, 'Tab');
    check(document.activeElement === controls[0], 'detail forward focus loop');
    key(document.activeElement, 'Tab', 'keydown', true);
    check(document.activeElement === controls[controls.length - 1], 'detail reverse focus loop');
    key(document.activeElement, 'Escape');
    check(details.hidden && document.activeElement === firstCard, 'modal Escape focus return');
  } else {
    search.value = fixture.entries[0].name;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    firstCard = document.querySelector('.item-card');
    check(firstCard.getAttribute('aria-pressed') === 'true', 'selection survives rerender');
    search.value = 'no-such-pickup-acceptance-probe';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    closeDetail();
    check(document.activeElement === gallery, 'missing origin falls back to gallery');
    reset.click();
  }
  if (!details.hidden) closeDetail();
  check(!gallery.inert && !document.querySelector('.product-header').inert, 'close releases inertness');
  firstCard = document.querySelector('.item-card');
  firstCard.focus();
  key(firstCard, ' ');
  check(details.hidden, 'Space keydown does not activate twice');
  key(firstCard, ' ', 'keyup');
  check(!details.hidden, 'Space keyup activates selection');
  closeDetail();
  check(document.querySelectorAll('.item-card[aria-pressed="true"]').length === 0, 'close clears selected state');
  const form = document.createElement('form');
  let activated = 0;
  let submitted = 0;
  form.addEventListener('submit', event => { event.preventDefault(); submitted += 1; });
  const disabled = button('disabled', () => { activated += 1; }, { disabled: true });
  const enabled = button('enabled', () => { activated += 1; });
  form.append(disabled, enabled);
  document.body.append(form);
  disabled.click();
  disabled.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  enabled.click();
  check(activated === 1 && submitted === 0, 'native disabled action and default button type');
  const link = hyperlink('reference', 'https://example.com/', true);
  check(link.tagName === 'A' && link.rel === 'noopener noreferrer', 'native safe external link');
  form.remove();
  if (nav.hidden) toggle.click();
  reset.click();
  toggle.click();
  check(document.documentElement.scrollWidth <= window.innerWidth + 1, 'no horizontal overflow');
  return { tenant, width: window.innerWidth, compact, picker, passed: true, events: 'DOM events; physical keyboard not certified' };
}

function snapshot() {
  const selected = document.querySelector('.item-card[aria-pressed="true"]');
  return {
    id: selected ? selected.dataset.entryId : null,
    value: document.querySelector('#filter-group-value').textContent,
    count: document.querySelectorAll('.item-card').length,
    scroll: document.querySelector('.gallery').scrollTop,
  };
}

export function prepareDockedTransition() {
  document.querySelector('.filter-toggle').click();
  const input = document.querySelector('#filter-group');
  input.click();
  document.querySelector('#filter-group-list [role=option]').click();
  key(input, 'Escape');
  document.querySelector('.item-card').click();
  document.querySelector('.gallery').scrollTop = 100;
  input.click();
  return snapshot();
}

export function prepareDraftTransition() {
  document.querySelector('#details [aria-label]').closest('header').querySelector('button').click();
  document.querySelector('.filter-toggle').click();
  document.querySelector('#filter-group-trigger').click();
  document.querySelectorAll('#filter-group-picker input[type=checkbox]')[1].click();
  return snapshot();
}

export function verifyTransition(before, compact) {
  const after = snapshot();
  check(after.id === before.id && after.value === before.value && after.count === before.count, 'resize retains identity and committed filters');
  check(document.querySelector('#filters').hidden && !document.querySelector('dialog:modal'), 'resize dismisses owned surfaces');
  check(document.querySelector('#filter-group-list').hidden, 'resize closes desktop popup');
  check(document.querySelector('#details').getAttribute('role') === (compact ? 'dialog' : 'region'), 'resize adapts detail semantics');
  const gallery = document.querySelector('.gallery');
  check(after.scroll === Math.min(before.scroll, Math.max(0, gallery.scrollHeight - gallery.clientHeight)), 'resize preserves/clamps gallery position');
  check(document.activeElement.getBoundingClientRect().width > 0, 'resize leaves focus visible');
  return { before, after, compact, passed: true };
}

/* eslint-disable import/no-dynamic-require, global-require */
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { transformFileSync, transformSync } = require('@babel/core');
const { parseComponent, compile } = require('vue-template-compiler');
const items = require('../src/data/items.json');

const cache = new Map();
const sourceRoot = path.resolve(__dirname, '..', 'src');

// Compile application ES modules with the project's existing Babel tooling.
function loadSource(filename) {
  const resolved = require.resolve(filename);
  if (/\.(webp|png)$/.test(resolved)) return resolved;
  if (!resolved.endsWith('.js') || !resolved.startsWith(sourceRoot + path.sep)) {
    return require(resolved);
  }
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const compiled = { exports: {} };
  cache.set(resolved, compiled);
  const localRequire = request => (request.startsWith('.')
    ? loadSource(path.resolve(path.dirname(resolved), request))
    : require(request));
  const { code } = transformFileSync(resolved, {
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const execute = vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, {
    filename: resolved,
  });
  execute(localRequire, compiled, compiled.exports);
  return compiled.exports;
}

const { survivorBuilds, getBuildTier, buildTierOrder } = loadSource(
  path.join(sourceRoot, 'data', 'survivorBuilds.js'),
);
const utils = loadSource(path.join(sourceRoot, 'helpers', 'ItemIdUtils.js')).default;
const getItemImageUrl = loadSource(path.join(sourceRoot, 'helpers', 'ItemImageUtils.js')).default;
const { SortType, ItemRarity, SelectionType, SelectionTypePluralization } = loadSource(
  path.join(sourceRoot, 'data', 'constants.js'),
);
const drones = loadSource(path.join(sourceRoot, 'data', 'drones.js')).default;
const catalog = loadSource(path.join(sourceRoot, 'data', 'catalog.js')).default;
const { parseCustomBuilds, customBuildStorageKey } = loadSource(
  path.join(sourceRoot, 'helpers', 'CustomBuildUtils.js'),
);
const store = loadSource(path.join(sourceRoot, 'store.js')).default;
const ids = Object.keys(items);
let passed = 0;
const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test('every survivor preset references real, visible catalogue items', () => {
  assert.strictEqual(new Set(survivorBuilds.map(build => build.id)).size, survivorBuilds.length);
  survivorBuilds.forEach(build => {
    buildTierOrder.forEach(tier => {
      assert(build.tiers[tier].length > 0, `${build.name} ${tier} is empty`);
      build.tiers[tier].forEach(name => {
        assert(items[name], `${build.name}: unknown item ${name}`);
        assert(!items[name].hidden, `${build.name}: hidden item ${name}`);
      });
    });
    const recommended = utils.roleFilterOperation(ids, items, build.id, true);
    assert(utils.filterByItemListType(recommended, items, false).length > 0);
    assert(utils.filterByItemListType(recommended, items, true).length > 0);
  });
});

test('Operator guide priorities and overlapping support use the highest tier', () => {
  assert.strictEqual(getBuildTier('Spare Drone Parts', 'operator'), 'S');
  ["Soldier's Syringe", "Crowbar", "Ukulele", "AtG Missile Mk. 1",
    "Paul's Goat Hoof", "Death Mark", "Predatory Instincts", "Harvester's Scythe"]
    .forEach(name => assert.strictEqual(getBuildTier(name, 'operator'), 'A'));
  assert.strictEqual(getBuildTier('Bison Steak', 'operator'), null);
  assert.strictEqual(getBuildTier('Spare Drone Parts', ''), null);
});

test('all-survivor and show-all modes do not filter the catalogue', () => {
  assert.deepStrictEqual(utils.roleFilterOperation(ids, items, '', true), ids);
  assert.deepStrictEqual(utils.roleFilterOperation(ids, items, 'operator', false), ids);
});

test('build sorting orders S, A, B, unranked with alphabetical ties', () => {
  const sample = ['Bison Steak', 'Hopoo Feather', 'Ukulele', 'Crowbar', 'Spare Drone Parts'];
  assert.deepStrictEqual(
    utils.sortOperation(sample, items, SortType.RECOMMENDED, 'operator'),
    ['Spare Drone Parts', 'Crowbar', 'Ukulele', 'Hopoo Feather', 'Bison Steak'],
  );
  const sorted = utils.sortOperation(ids.slice(), items, SortType.RECOMMENDED, 'operator');
  const ranks = sorted.map(id => {
    const tier = getBuildTier(items[id].name, 'operator');
    return tier ? buildTierOrder.indexOf(tier) : buildTierOrder.length;
  });
  ranks.forEach((rank, index) => assert(index === 0 || rank >= ranks[index - 1]));
});

test('survivor recommendations intersect with category, rarity, search and list type', () => {
  let result = utils.showHiddenOperation(ids, items, false);
  result = utils.filterByItemListType(result, items, false);
  result = utils.filterOperation(result, items, { category: ['Damage'], rarity: [ItemRarity.UNCOMMON] });
  result = utils.roleFilterOperation(result, items, 'operator', true);
  result = utils.searchOperation(result, items, 'ukulele');
  assert.deepStrictEqual(result, ['Ukulele']);
  assert.deepStrictEqual(utils.searchOperation(result, items, 'does not exist'), []);
  const equipment = utils.filterByItemListType(
    utils.roleFilterOperation(ids, items, 'operator', true), items, true,
  );
  assert(equipment.includes('The Back-up'));
  assert(!equipment.includes('Spare Drone Parts'));
});

test('category filtering handles uncategorized items and legacy category spelling', () => {
  assert.deepStrictEqual(utils.filterOperation(
    ['uncategorized'], { uncategorized: { itemRarity: ItemRarity.COMMON } },
    { category: ['Damage'] },
  ), []);
  const allCategorized = utils.filterOperation(ids, items, { category: ['Damage'] });
  assert(allCategorized.length > 0);
  assert(allCategorized.every(id => (items[id].category || []).includes('Damage')));
  assert.deepStrictEqual(
    utils.filterOperation(ids, items, { category: ['On Kill Effect'] }),
    utils.filterOperation(ids, items, { category: ['OnKillEffect'] }),
  );
  assert.deepStrictEqual(utils.filterOperation(ids, items, { category: [], rarity: [] }), ids);
});

test('only gameplay categories appear, with legacy spellings normalized', () => {
  assert.deepStrictEqual(utils.getItemCategories({
    category: ['AIBlacklist', 'BrotherBlacklist', 'TurretBlacklist', 'CannotSteal',
      'WorldUnique', 'Damage', 'OnKillEffect', 'On Kill Effect', 'EquipmentRelated'],
  }), ['Damage', 'On Kill Effect', 'Equipment Related']);
  assert.deepStrictEqual(utils.getItemCategories({}), []);
  const categories = [...new Set(Object.values(items).flatMap(utils.getItemCategories))];
  assert(categories.includes('Damage'));
  assert(!categories.some(category => /blacklist|cannot|world ?unique/i.test(category)));
});

test('all catalogue images are local image files with deployment-safe URLs', () => {
  ids.forEach(id => {
    const url = getItemImageUrl(id, '/ror2-item-cheat-sheet/');
    assert(url.startsWith('/ror2-item-cheat-sheet/items/'));
    const filename = decodeURIComponent(url.split('/').pop());
    const image = fs.readFileSync(path.join(sourceRoot, '..', 'public', 'items', filename));
    const png = image.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    const webp = image.subarray(0, 4).toString() === 'RIFF'
      && image.subarray(8, 12).toString() === 'WEBP';
    assert(png || webp, `Invalid image for ${id}`);
    assert.strictEqual(getItemImageUrl(id, '/'), `/items/${encodeURIComponent(filename)}`);
    assert.strictEqual(getItemImageUrl(id, '/ror2-item-cheat-sheet'), url);
  });
  assert.throws(() => getItemImageUrl('Missing item', '/'), /Missing catalogue image/);
});

test('existing name and rarity sorts are still available', () => {
  assert.deepStrictEqual(utils.sortOperation(
    ['Ukulele', 'Crowbar'], items, SortType.NAME,
  ), ['Crowbar', 'Ukulele']);
  assert.deepStrictEqual(utils.sortOperation(
    ['Spare Drone Parts', 'Crowbar', 'Ukulele'], items, SortType.RARITY,
  ), ['Crowbar', 'Ukulele', 'Spare Drone Parts']);
});

test('role selection chooses build sorting, survives role switches, and resets safely', () => {
  store.commit('setSelectedRole', 'operator');
  assert.strictEqual(store.state.sortBy, SortType.RECOMMENDED);
  store.commit('updateSortByState', SortType.NAME);
  store.commit('setSelectedRole', 'loader');
  assert.strictEqual(store.state.sortBy, SortType.NAME);
  store.commit('setSelectedRole', '');
  assert.strictEqual(store.state.sortBy, SortType.NAME);
  store.commit('setSelectedRole', 'operator');
  store.commit('setSelectedRole', '');
  assert.strictEqual(store.state.sortBy, SortType.RARITY);
  assert.throws(() => store.commit('setSelectedRole', 'unknown'), /Unknown survivor/);
});

test('changing one filter preserves the other and toggling recommendations is reactive', () => {
  store.commit('setFilterByState', { category: ['Damage'], rarity: [ItemRarity.COMMON] });
  store.commit('setFilterByState', { rarity: [] });
  assert.deepStrictEqual(Array.from(store.state.filterBy.category), ['Damage']);
  assert.deepStrictEqual(Array.from(store.state.filterBy.rarity), []);
  store.commit('setRecommendedOnly', false);
  assert.strictEqual(store.state.recommendedOnly, false);
});

test('Hallowed Concepts survivors have distinct curated starter builds', () => {
  ['enforcer', 'acolyte'].forEach(id => {
    const build = survivorBuilds.find(candidate => candidate.id === id);
    assert(build);
    assert.strictEqual(build.dlc, 'Hallowed Concepts');
    assert(build.source.endsWith(id === 'enforcer' ? '/Enforcer' : '/Acolyte'));
  });
  assert.strictEqual(getBuildTier('Tri-Tip Dagger', 'enforcer'), 'S');
  assert.strictEqual(getBuildTier('Leeching Seed', 'acolyte'), 'S');
});

test('DLC filtering supports each expansion, base game, OR selections and intersections', () => {
  const dlcs = ['Base game', 'Survivors of the Void', 'Seekers of the Storm',
    'Alloyed Collective', 'Hallowed Concepts'];
  dlcs.forEach(dlc => {
    const result = utils.filterOperation(ids, items, { dlc: [dlc] });
    assert(result.length > 0, `${dlc} is empty`);
    assert(result.every(id => (items[id].dlc || 'Base game') === dlc));
  });
  const result = utils.filterOperation(ids, items, { dlc: ['Base game', 'Hallowed Concepts'] });
  assert(result.some(id => !items[id].dlc));
  assert(result.some(id => items[id].dlc === 'Hallowed Concepts'));
  assert(result.every(id => !items[id].dlc || items[id].dlc === 'Hallowed Concepts'));
  const filtered = utils.filterOperation(ids, items, {
    dlc: ['Base game'], category: ['Damage'], rarity: ['Uncommon'],
  });
  assert.deepStrictEqual(utils.searchOperation(
    utils.roleFilterOperation(filtered, items, 'enforcer', true), items, 'atg',
  ), ['AtG Missile Mk. 1']);
  assert.deepStrictEqual(utils.filterOperation(ids, items, { dlc: [] }), ids);
});

test('filter mutations preserve DLC and reset without touching saved data', () => {
  store.commit('setFilterByState', { dlc: ['Hallowed Concepts'] });
  store.commit('setFilterByState', { category: ['Damage'], rarity: ['Boss'] });
  store.commit('updateFilterByState', { rarity: [] });
  assert.deepStrictEqual(Array.from(store.state.filterBy.dlc), ['Hallowed Concepts']);
  store.commit('setFilterByState', { dlc: [] });
  assert.deepStrictEqual(Array.from(store.state.filterBy.category), ['Damage']);
  store.commit('setFilterByState', { dlc: [], category: [], rarity: [] });
});

test('custom build parser rejects corrupt, unsafe and unsupported persisted data', () => {
  assert.deepStrictEqual(parseCustomBuilds(null), { profiles: [], nextNumber: 1 });
  const data = {
    version: 1,
    nextNumber: 2,
    profiles: [{ id: 'custom-1', name: 'Custom 01', itemIds: ['Crowbar'] }],
  };
  assert.deepStrictEqual(parseCustomBuilds(JSON.stringify(data)).profiles, data.profiles);
  assert.throws(() => parseCustomBuilds('{'), SyntaxError);
  [null, {}, { ...data, version: 2 }, { ...data, nextNumber: 1 },
    { ...data, profiles: [data.profiles[0], data.profiles[0]] }]
    .forEach(value => assert.throws(() => parseCustomBuilds(JSON.stringify(value))));
  [
    { name: ' ' }, { name: 'a'.repeat(81) }, { id: 'operator' },
    { itemIds: ['missing'] }, { itemIds: ['constructor'] },
    { itemIds: ['Crowbar', 'Crowbar'] }, { itemIds: [null] },
  ].forEach(overrides => {
    assert.throws(() => parseCustomBuilds(JSON.stringify({
      ...data, profiles: [{ ...data.profiles[0], ...overrides }],
    })));
  });
});

let stored = null;
let failRead = false;
let failWrite = false;
const storage = {
  getItem(key) {
    assert.strictEqual(key, customBuildStorageKey);
    if (failRead) throw new Error('Storage access blocked');
    return stored;
  },
  setItem(key, value) {
    assert.strictEqual(key, customBuildStorageKey);
    if (failWrite) throw new Error('Storage quota exceeded');
    stored = value;
  },
};

test('custom profiles create, deduplicate, rename, save and restore with stable IDs', async () => {
  global.window = { localStorage: storage };
  await store.dispatch('loadCustomBuilds');
  assert.strictEqual(store.state.customBuildsLoaded, true);
  await store.dispatch('createCustomBuild');
  assert.strictEqual(store.getters.selectedBuild.name, 'Custom 01');
  assert.strictEqual(store.state.recommendedOnly, false);
  await store.dispatch('addCustomBuildItem', 'Crowbar');
  await store.dispatch('addCustomBuildItem', 'Crowbar');
  await store.dispatch('addCustomBuildItem', 'Royal Capacitor');
  await store.dispatch('renameCustomBuild', { id: 'custom-1', name: '  My loadout  ' });
  assert.strictEqual(store.getters.selectedBuild.name, 'My loadout');
  assert.deepStrictEqual(Array.from(store.getters.selectedBuild.itemIds),
    ['Crowbar', 'Royal Capacitor']);
  const saved = parseCustomBuilds(stored);
  assert.strictEqual(saved.profiles[0].name, 'My loadout');
  await store.dispatch('createCustomBuild');
  assert.strictEqual(store.getters.selectedBuild.name, 'Custom 02');
  assert.strictEqual(store.state.selectedRole, 'custom-2');
  await store.dispatch('loadCustomBuilds');
  assert.strictEqual(store.state.customBuilds.length, 2);
  assert.strictEqual(store.state.nextCustomBuildNumber, 3);
  store.commit('setSelectedRole', 'custom-1');
  assert.strictEqual(store.state.customBuildTarget, 'custom-1');
  assert.strictEqual(store.getters.selectedBuild.name, 'My loadout');
  assert.throws(() => store.commit('renameCustomBuild', { id: 'custom-1', name: '  ' }));
  assert.throws(() => store.commit('setCustomBuildTarget', 'missing'));
  assert.throws(() => store.dispatch('addCustomBuildItem', 'missing'), /unknown item/);
  assert.strictEqual(store.state.customBuilds.length, 2);
});

test('custom saved-only mode and sorting work for items and equipment without changing presets', () => {
  const { builds } = store.getters;
  const recommended = utils.roleFilterOperation(ids, items, 'custom-1', true, builds);
  assert.deepStrictEqual(recommended.sort(), ['Crowbar', 'Royal Capacitor'].sort());
  assert.deepStrictEqual(utils.filterByItemListType(recommended, items, true), ['Royal Capacitor']);
  assert.deepStrictEqual(utils.filterByItemListType(recommended, items, false), ['Crowbar']);
  assert.deepStrictEqual(utils.roleFilterOperation(ids, items, 'custom-1', false, builds), ids);
  assert.deepStrictEqual(utils.roleFilterOperation(ids, items, 'custom-2', true, builds), []);
  assert.deepStrictEqual(utils.sortOperation(
    ['Ukulele', 'Royal Capacitor', 'Crowbar'], items, SortType.RECOMMENDED, 'custom-1', builds,
  ), ['Crowbar', 'Royal Capacitor', 'Ukulele']);
  assert.strictEqual(getBuildTier('Crowbar', 'operator', builds), 'A');
  assert.deepStrictEqual(utils.filterOperation(recommended, items, {
    dlc: ['Survivors of the Void'],
  }), []);
});

test('removal updates custom lists immediately, persists, and permits an empty list', async () => {
  await store.dispatch('removeCustomBuildItem', { id: 'custom-1', itemId: 'Crowbar' });
  assert.deepStrictEqual(Array.from(store.getters.selectedBuild.itemIds), ['Royal Capacitor']);
  await store.dispatch('removeCustomBuildItem', { id: 'custom-1', itemId: 'Royal Capacitor' });
  assert.strictEqual(parseCustomBuilds(stored).profiles[0].itemIds.length, 0);
  assert.strictEqual(utils.roleFilterOperation(
    ids, items, 'custom-1', true, store.getters.builds,
  ).length, 0);
  store.commit('setSelectedRole', '');
  assert.strictEqual(store.state.customBuilds.length, 2);
});

test('details can create a new list without replacing a survivor selection', async () => {
  store.commit('setSelectedRole', 'enforcer');
  store.commit('setCustomBuildTarget', '');
  await store.dispatch('addCustomBuildItem', 'Crowbar');
  assert.strictEqual(store.state.customBuildTarget, 'custom-3');
  assert.strictEqual(store.state.customBuilds[2].name, 'Custom 03');
  assert.strictEqual(store.state.selectedRole, 'enforcer');
  assert.deepStrictEqual(parseCustomBuilds(stored).profiles[2].itemIds, ['Crowbar']);
});

test('storage failures are explicit, preserve stored data, and retry saves in-memory changes', async () => {
  const beforeFailure = stored;
  failWrite = true;
  await store.dispatch('renameCustomBuild', { id: 'custom-3', name: 'Unsaved name' });
  assert(store.state.customBuildError.includes('Could not save'));
  assert(store.state.customBuildError.includes('only in memory'));
  assert.strictEqual(stored, beforeFailure);
  failWrite = false;
  await store.dispatch('saveCustomBuilds');
  assert.strictEqual(store.state.customBuildError, '');
  assert.strictEqual(parseCustomBuilds(stored).profiles[2].name, 'Unsaved name');
  failRead = true;
  await store.dispatch('loadCustomBuilds');
  assert(store.state.customBuildError.includes('Could not load'));
  assert.strictEqual(store.state.customBuilds.length, 3);
  failRead = false;
  await store.dispatch('loadCustomBuilds');
  assert.strictEqual(store.state.customBuildError, '');
  const valid = stored;
  stored = 'not JSON';
  await store.dispatch('loadCustomBuilds');
  assert(store.state.customBuildError.includes('not been overwritten'));
  assert.strictEqual(stored, 'not JSON');
  stored = valid;
  await store.dispatch('loadCustomBuilds');
});

test('drone catalogue includes exactly the 15 recruitable drones and turrets', () => {
  const expected = [
    'Gunner Drone', 'Healing Drone', 'Gunner Turret', 'Emergency Drone', 'Equipment Drone',
    'Incinerator Drone', 'Missile Drone', 'TC-280 Prototype', 'Transport Drone', 'Junk Drone',
    'Cleanup Drone', 'Jailer Drone', 'Barrier Drone', 'Bombardment Drone', 'Freeze Drone',
  ];
  assert.deepStrictEqual(Object.keys(drones).sort(), expected.sort());
  assert.strictEqual(Object.keys(catalog).length, ids.length + expected.length);
  expected.forEach(id => {
    const drone = drones[id];
    assert(!Object.prototype.hasOwnProperty.call(items, id), `Drone overlaps item: ${id}`);
    assert.strictEqual(drone.name, id);
    assert.strictEqual(utils.getSelectionType(drone), SelectionType.DRONE);
    assert(Object.values(ItemRarity).includes(drone.itemRarity));
    ['shortDescription', 'description', 'acquisition', 'health', 'damage', 'speed']
      .forEach(key => assert.strictEqual(typeof drone[key], 'string'));
    assert.strictEqual(typeof drone.armor, 'number');
    assert(drone.wikiLink.startsWith('https://riskofrain2.wiki.gg/wiki/'));
    assert(drone.imageSource.startsWith('https://riskofrain2.wiki.gg/images/'));
    const image = fs.readFileSync(path.join(sourceRoot, '..', 'public', 'drones', drone.image));
    assert.strictEqual(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', id);
    assert(image.readUInt32BE(16) >= 60 && image.readUInt32BE(20) >= 60, `Tiny image: ${id}`);
    assert.strictEqual(getItemImageUrl(id, '/ror2-item-cheat-sheet/'),
      `/ror2-item-cheat-sheet/drones/${encodeURIComponent(drone.image)}`);
    assert.strictEqual(getItemImageUrl(id, '/'), `/drones/${encodeURIComponent(drone.image)}`);
  });
  assert(drones['Equipment Drone'].acquisition.includes('equipment'));
});

test('all gallery sections use plural names and contain mutually exclusive entry types', () => {
  const allIds = Object.keys(catalog);
  const types = [SelectionType.ITEM, SelectionType.EQUIPMENT, SelectionType.DRONE];
  assert.deepStrictEqual(types.map(type => SelectionTypePluralization[type]),
    ['Items', 'Equipments', 'Drones']);
  const groups = types.map(type => utils.filterBySelectionType(allIds, catalog, type));
  assert.strictEqual(groups.flat().length, allIds.length);
  assert.strictEqual(new Set(groups.flat()).size, allIds.length);
  assert.deepStrictEqual(groups[2].sort(), Object.keys(drones).sort());
  assert.deepStrictEqual(groups[0], utils.filterByItemListType(ids, items, false));
  assert.deepStrictEqual(groups[1], utils.filterByItemListType(ids, items, true));
});

test('drone version, rarity, search and sort controls intersect correctly', () => {
  const droneIds = Object.keys(drones);
  const base = utils.filterOperation(droneIds, drones, { dlc: ['Base game'] });
  const expansion = utils.filterOperation(droneIds, drones, { dlc: ['Alloyed Collective'] });
  assert.strictEqual(base.length, 8);
  assert.strictEqual(expansion.length, 7);
  assert.deepStrictEqual(utils.filterOperation(droneIds, drones, { dlc: ['Hallowed Concepts'] }), []);
  const rareExpansion = utils.filterOperation(droneIds, drones, {
    dlc: ['Alloyed Collective'], rarity: [ItemRarity.LEGENDARY],
  });
  assert.deepStrictEqual(rareExpansion.sort(), ['Bombardment Drone', 'Freeze Drone']);
  assert.deepStrictEqual(utils.searchOperation(rareExpansion, drones, 'freezes'), ['Freeze Drone']);
  assert.deepStrictEqual(utils.sortOperation(droneIds.slice(), drones, SortType.NAME),
    droneIds.slice().sort());
  assert.deepStrictEqual(utils.sortOperation(
    ['Healing Drone', 'Gunner Drone'], drones, SortType.RARITY,
  ), ['Gunner Drone', 'Healing Drone']);
  assert.deepStrictEqual(utils.roleFilterOperation(droneIds, drones, 'operator', true), droneIds);
});

test('drone picks persist alongside items and equipment in existing custom profiles', async () => {
  store.commit('setSelectedRole', 'custom-3');
  await store.dispatch('addCustomBuildItem', 'Healing Drone');
  await store.dispatch('addCustomBuildItem', 'Healing Drone');
  await store.dispatch('addCustomBuildItem', 'Royal Capacitor');
  assert.deepStrictEqual(Array.from(store.getters.selectedBuild.itemIds),
    ['Crowbar', 'Healing Drone', 'Royal Capacitor']);
  await store.dispatch('loadCustomBuilds');
  assert.deepStrictEqual(parseCustomBuilds(stored).profiles[2].itemIds,
    ['Crowbar', 'Healing Drone', 'Royal Capacitor']);
  const picks = utils.roleFilterOperation(
    Object.keys(catalog), catalog, 'custom-3', true, store.getters.builds,
  );
  assert.deepStrictEqual(utils.filterBySelectionType(picks, catalog, SelectionType.DRONE),
    ['Healing Drone']);
  assert.deepStrictEqual(utils.filterBySelectionType(picks, catalog, SelectionType.ITEM),
    ['Crowbar']);
  assert.deepStrictEqual(utils.filterBySelectionType(picks, catalog, SelectionType.EQUIPMENT),
    ['Royal Capacitor']);
  assert.deepStrictEqual(utils.filterOperation(picks, catalog, {
    dlc: ['Alloyed Collective'],
  }), []);
  await store.dispatch('removeCustomBuildItem', { id: 'custom-3', itemId: 'Healing Drone' });
  assert(!parseCustomBuilds(stored).profiles[2].itemIds.includes('Healing Drone'));
});

test('all dropdown surfaces share AppSelect without competing native controls or category filters', () => {
  ['NavBar/RoleFilter.vue', 'NavBar/SortBySelector.vue', 'NavBar/RarityFilter.vue',
    'NavBar/VersionFilter.vue', 'SideBar.vue'].forEach(filename => {
    const source = fs.readFileSync(path.join(sourceRoot, 'components', filename), 'utf8');
    assert(source.includes('<AppSelect '), `${filename} does not use shared dropdown`);
    assert(!/<select[\s>]/.test(source), `${filename} uses a native dropdown`);
    assert(!source.includes('<multiselect'), `${filename} bypasses the shared dropdown`);
  });
  const nav = fs.readFileSync(path.join(sourceRoot, 'components', 'TopBar.vue'), 'utf8');
  assert(!nav.includes('CategoryFilter'));
  assert(!nav.includes('.multiselect'));
  const role = fs.readFileSync(path.join(sourceRoot, 'components', 'NavBar', 'RoleFilter.vue'), 'utf8');
  assert(!role.includes('build.dlc'));
  const version = fs.readFileSync(
    path.join(sourceRoot, 'components', 'NavBar', 'VersionFilter.vue'), 'utf8',
  );
  assert(version.includes('label="Version"'));
  const sidebar = fs.readFileSync(path.join(sourceRoot, 'components', 'SideBar.vue'), 'utf8');
  assert(!sidebar.includes('clickCategoryPill'));
});

const dropdownSource = fs.readFileSync(
  path.join(sourceRoot, 'components', 'AppSelect.vue'), 'utf8',
);
const dropdownScript = parseComponent(dropdownSource).script.content;
const dropdownCode = transformSync(dropdownScript, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const dropdownModule = { exports: {} };
vm.runInThisContext(`(function(require, module, exports) { ${dropdownCode}\n})`)(
  request => (request.endsWith('.css') || request.startsWith('./') ? {} : require(request)),
  dropdownModule, dropdownModule.exports,
);
const dropdown = dropdownModule.exports.default;

test('shared dropdown maps single and multiple choices to stable store values', () => {
  const options = [{ value: '', label: 'All survivors' }, { value: 'enforcer', label: 'Enforcer' }];
  const events = [];
  const single = {
    options,
    value: '',
    multiple: false,
    $emit: (...args) => events.push(args),
  };
  assert.strictEqual(dropdown.computed.selected.get.call(single), options[0]);
  dropdown.computed.selected.set.call(single, options[1]);
  assert.deepStrictEqual(events.pop(), ['input', 'enforcer']);
  const multiple = { ...single, multiple: true, value: ['enforcer'] };
  assert.deepStrictEqual(dropdown.computed.selected.get.call(multiple), [options[1]]);
  dropdown.computed.selected.set.call(multiple, options);
  assert.deepStrictEqual(events.pop(), ['input', ['', 'enforcer']]);
  dropdown.computed.selected.set.call(multiple, []);
  assert.deepStrictEqual(events.pop(), ['input', []]);
});

test('dropdown menus delegate edge placement to the shared popup layer', () => {
  [0, 28, -40, 240].forEach(previousHeight => {
    const menu = { maxHeight: 240, optimizedHeight: previousHeight, preferredOpenDirection: 'above' };
    dropdown.components.Multiselect.methods.adjustPosition.call(menu);
    assert.strictEqual(menu.optimizedHeight, 240);
    assert.strictEqual(menu.preferredOpenDirection, 'below');
  });
});

test('keyboard dropdown scrolling uses actual bounds for wrapped options', () => {
  const scroll = dropdown.components.Multiselect.methods.scrollToHighlightedOption;
  [
    { top: 370, bottom: 414, expected: 174 },
    { top: 60, bottom: 148, expected: 60 },
    { top: 120, bottom: 208, expected: 100 },
  ].forEach(({ top, bottom, expected }) => {
    const list = {
      scrollTop: 100,
      clientTop: 1,
      clientHeight: 240,
      getBoundingClientRect: () => ({ top: 99 }),
      querySelector: () => ({ getBoundingClientRect: () => ({ top, bottom }) }),
    };
    scroll.call({ isOpen: true, $refs: { list } });
    assert.strictEqual(list.scrollTop, expected);
  });
  const callback = () => {};
  dropdown.components.Multiselect.watch.pointer.call({
    scrollToHighlightedOption: callback,
    $nextTick: received => assert.strictEqual(received, callback),
  });
});

test('popup placement flips at viewport edges and cleans up its detached list and listeners', () => {
  const listeners = new Map();
  const body = {
    children: [],
    appendChild(node) { this.children.push(node); },
  };
  const parent = {
    appendChild(node) { Object.assign(node, { parentNode: this }); },
  };
  const list = { parentNode: parent, scrollHeight: 500 };
  const document = {
    body,
    createElement() {
      return {
        style: {},
        appendChild(node) { Object.assign(node, { parentNode: this }); },
        remove() { body.children.splice(body.children.indexOf(this), 1); },
      };
    },
  };
  const window = {
    innerHeight: 900,
    innerWidth: 1280,
    addEventListener(name, callback, capture) { listeners.set(name, { callback, capture }); },
    removeEventListener(name, callback, capture) {
      assert.deepStrictEqual(listeners.get(name), { callback, capture });
      listeners.delete(name);
    },
  };
  const module = { exports: {} };
  vm.runInThisContext(
    `(function(require, module, exports, document, window, getComputedStyle) { ${dropdownCode}\n})`,
  )(
    request => (request.startsWith('./') || request.endsWith('.css') ? {} : require(request)),
    module, module.exports, document, window, () => ({ overflowY: 'auto' }),
  );
  let anchor = { top: 200, bottom: 232, left: 100, width: 200 };
  const control = {
    isOpen: true,
    $el: { parentElement: body, getBoundingClientRect: () => anchor },
    $refs: { list },
  };
  const context = { $refs: { control }, $nextTick: callback => callback() };
  const component = module.exports.default;
  Object.entries(component.methods).forEach(([name, method]) => {
    context[name] = method.bind(context);
  });
  control.deactivate = () => { control.isOpen = false; context.closePopup(); };
  context.openPopup();
  context.openPopup();
  assert.strictEqual(body.children.length, 1, 'One popup per open control');
  assert.strictEqual(context.popup.style.top, '238px');
  assert.strictEqual(control.optimizedHeight, 240);
  assert.strictEqual(list.parentNode, context.popup);
  anchor = { ...anchor, top: 850, bottom: 882 };
  context.positionPopup();
  assert.strictEqual(context.popup.style.top, '604px');
  list.scrollHeight = 60;
  context.positionPopup();
  assert.strictEqual(context.popup.style.top, '782px', 'Short filtered menus stay anchored above');
  window.innerWidth = 320;
  anchor = { ...anchor, left: 280 };
  context.positionPopup();
  assert.strictEqual(context.popup.style.left, '112px');
  control.$el.parentElement = {
    parentElement: body,
    getBoundingClientRect: () => ({ top: 0, bottom: 400 }),
  };
  context.positionPopup();
  assert.strictEqual(control.isOpen, false, 'Off-screen anchors close their popup');
  assert.strictEqual(list.parentNode, parent);
  assert.strictEqual(body.children.length, 0);
  assert.strictEqual(listeners.size, 0);
  component.beforeDestroy.call(context);
});

test('base controls forward native behavior and keep IME text-entry and focus semantics', () => {
  const loadComponent = filename => {
    const source = fs.readFileSync(path.join(sourceRoot, 'components', 'base', filename), 'utf8');
    const parsed = parseComponent(source);
    assert.deepStrictEqual(compile(parsed.template.content).errors, []);
    const { code } = transformSync(parsed.script.content, {
      babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    const module = { exports: {} };
    vm.runInThisContext(`(function(module, exports) { ${code}\n})`)(module, module.exports);
    return { component: module.exports.default, template: parsed.template.content };
  };
  const button = loadComponent('AppButton.vue');
  assert.strictEqual(button.component.props.type.default, 'button');
  assert.strictEqual(button.component.props.variant.default, 'secondary');
  ['primary', 'secondary', 'ghost', 'danger'].forEach(value => {
    assert(button.component.props.variant.validator(value));
  });
  assert(!button.component.props.variant.validator('unrecognized'));
  assert(button.template.includes('v-bind="$attrs"'));
  assert(button.template.includes('v-on="$listeners"'));
  assert(button.template.includes(':type="type"'));
  let focused = false;
  button.component.methods.focus.call({ $el: { focus() { focused = true; } } });
  assert(focused);

  const input = loadComponent('AppInput.vue');
  assert(input.template.includes('v-bind="$attrs"'));
  assert(input.template.includes('v-on="listeners"'));
  const events = [];
  const context = {
    ...input.component.data(),
    $listeners: { blur() {} },
    $emit(name, value) { events.push({ name, value }); },
  };
  Object.entries(input.component.methods).forEach(([name, method]) => {
    context[name] = method.bind(context);
  });
  const listeners = input.component.computed.listeners.call(context);
  assert.strictEqual(listeners.blur, context.$listeners.blur);
  const event = { target: { value: 'a' } };
  listeners.input(event);
  assert.deepStrictEqual(events.pop(), { name: 'input', value: 'a' });
  listeners.compositionstart(event);
  event.target.value = 'composing';
  listeners.input(event);
  assert(!events.some(entry => entry.name === 'input'));
  event.target.value = 'complete';
  listeners.compositionend(event);
  assert.deepStrictEqual(events.filter(entry => entry.name === 'input'),
    [{ name: 'input', value: 'complete' }]);
});

test('portable base tokens are generic and product tokens only alias reusable primitives', () => {
  const base = fs.readFileSync(path.join(sourceRoot, 'assets', 'design-tokens.css'), 'utf8');
  const consumer = fs.readFileSync(path.join(sourceRoot, 'assets', 'site-tokens.css'), 'utf8');
  assert(!/--(?:rarity|rank|nav|details|card)-/.test(base));
  assert(base.includes('--target-size: 24px'));
  assert(base.includes('--control-height: 32px'));
  assert(base.includes('@media (max-width: 600px), (any-pointer: coarse)'));
  assert(base.includes('--target-size: 44px'));
  assert(base.includes('--control-height-compact: var(--target-size)'));
  const definitions = new Set(Array.from(base.matchAll(/(--[\w-]+):/g), match => match[1]));
  Array.from(consumer.matchAll(/(--[\w-]+):\s*([^;]+);/g)).forEach(([, name, value]) => {
    const alias = value.match(/^var\((--[\w-]+)\)$/);
    assert(alias, `${name} must alias a primitive instead of duplicating a value`);
    assert(definitions.has(alias[1]), `${name} must reference a generic base token`);
  });
  const role = fs.readFileSync(path.join(sourceRoot, 'components', 'NavBar', 'RoleFilter.vue'), 'utf8');
  assert(role.includes('<AppButton class="custom-create" variant="ghost"'));
  assert(!role.includes('variant="primary"'));
  ['TopBar.vue', 'CustomBuildEditor.vue', 'HomePage.vue', 'SideBar.vue', 'Icons/CloseIcon.vue',
    'NavBar/RoleFilter.vue'].forEach(filename => {
    const source = fs.readFileSync(path.join(sourceRoot, 'components', filename), 'utf8');
    assert(!/<button[\s>]/.test(source), `${filename} bypasses AppButton`);
  });
});

test('panels share overlay scrollbars with native viewports and clean lifecycle handling', () => {
  const source = fs.readFileSync(path.join(sourceRoot, 'components', 'AppScrollArea.vue'), 'utf8');
  const component = parseComponent(source);
  const { code } = transformSync(component.script.content, {
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  let initialization;
  let options;
  let updates = 0;
  let destroyed = false;
  const listeners = new Map();
  const module = { exports: {} };
  const instance = {
    update(force) { assert.strictEqual(force, true); updates += 1; },
    destroy() { destroyed = true; },
  };
  const browser = {
    addEventListener(event, callback) { listeners.set(event, callback); },
    removeEventListener(event, callback) {
      assert.strictEqual(listeners.get(event), callback);
      listeners.delete(event);
    },
  };
  vm.runInThisContext(`(function(require, module, exports, window) { ${code}\n})`)(
    request => (request.endsWith('.css') ? {} : {
      OverlayScrollbars(target, settings) {
        initialization = target;
        options = settings;
        return instance;
      },
    }), module, module.exports, browser,
  );
  const area = module.exports.default;
  const context = { $el: {}, $refs: { viewport: {} } };
  context.updateScrollArea = area.methods.updateScrollArea.bind(context);
  area.mounted.call(context);
  assert.strictEqual(initialization.target, context.$el);
  assert.strictEqual(initialization.elements.viewport, context.$refs.viewport);
  assert.deepStrictEqual(options.overflow, { x: 'hidden', y: 'scroll' });
  assert.deepStrictEqual(options.scrollbars, { theme: 'os-theme-neon', autoHide: 'never' });
  area.updated.call(context);
  listeners.get('resize')();
  assert.strictEqual(updates, 2);
  area.beforeDestroy.call(context);
  assert.strictEqual(destroyed, true);
  assert.strictEqual(listeners.size, 0);
  ['TopBar.vue', 'HomePage.vue', 'SideBar.vue'].forEach(filename => {
    const panel = fs.readFileSync(path.join(sourceRoot, 'components', filename), 'utf8');
    assert(panel.includes('<AppScrollArea'), `${filename} must use shared overlay scrolling`);
    assert(!panel.includes('scrollbar-gutter: stable'), 'Overlay panels must not reserve a gutter');
  });
  assert(component.template.content.includes('<slot />'));
  assert(fs.existsSync(path.join(sourceRoot, '..', 'public', 'overlayscrollbars-license.txt')));
});

test('dark theme text and accent pairs meet WCAG AA normal-text contrast', () => {
  const theme = fs.readFileSync(path.join(sourceRoot, 'assets', 'theme.css'), 'utf8');
  const tokenSource = fs.readFileSync(path.join(sourceRoot, 'assets', 'design-tokens.css'), 'utf8');
  const consumer = fs.readFileSync(path.join(sourceRoot, 'assets', 'site-tokens.css'), 'utf8');
  const primitives = fs.readFileSync(path.join(sourceRoot, 'assets', 'primitives.css'), 'utf8');
  const definitions = Object.fromEntries(
    Array.from(`${tokenSource}\n${consumer}`.matchAll(/--([\w-]+):\s*([^;]+)\s*;/gi),
      match => [match[1], match[2]]),
  );
  const resolve = name => {
    assert(definitions[name], `Missing colour token: ${name}`);
    return definitions[name].replace(/var\(--([\w-]+)\)/g, (match, alias) => resolve(alias));
  };
  const tokens = Object.fromEntries(Object.keys(definitions).map(name => [name, resolve(name)]));
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
    const [r, g, b] = channels.map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  ['canvas', 'surface', 'surface-raised', 'surface-hover'].forEach(background => {
    ['text', 'text-muted', 'accent'].forEach(foreground => {
      const a = luminance(tokens[foreground]);
      const b = luminance(tokens[background]);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
    });
  });
  ['accent', 'accent-hover'].forEach(background => {
    const ratio = (luminance(tokens[background]) + 0.05)
      / (luminance(tokens['on-accent']) + 0.05);
    assert(ratio >= 4.5, `Primary button contrast: ${ratio.toFixed(2)}:1`);
  });
  const rarities = [
    'common', 'uncommon', 'void', 'hallowed', 'hex', 'page',
    'legendary', 'boss', 'lunar', 'equipment',
  ];
  rarities.forEach(rarity => {
    const colour = tokens[`rarity-${rarity}`];
    assert(colour, `Missing rarity token: ${rarity}`);
    assert(theme.includes(`var(--rarity-${rarity})`), `Unused rarity token: ${rarity}`);
    const ratio = (luminance(colour) + 0.05) / (luminance(tokens.surface) + 0.05);
    assert(ratio >= 4.5, `Rarity label ${colour}: ${ratio.toFixed(2)}:1`);
  });
  ['core', 'synergy', 'support'].forEach(rank => {
    const ratio = (luminance(tokens[`rank-${rank}-text`]) + 0.05)
      / (luminance(tokens[`rank-${rank}-surface`]) + 0.05);
    assert(ratio >= 4.5, `Build badge ${rank}: ${ratio.toFixed(2)}:1`);
  });
  const errorRatio = (luminance(tokens.danger) + 0.05)
    / (luminance(tokens['danger-surface']) + 0.05);
  assert(errorRatio >= 4.5, `Storage error contrast: ${errorRatio.toFixed(2)}:1`);
  assert(tokenSource.includes('color-scheme: dark'));
  assert(primitives.includes('@media (prefers-reduced-motion: reduce)'));
});

test('design tokens resolve and shared component styles use the imported palette', () => {
  const tokenSource = fs.readFileSync(path.join(sourceRoot, 'assets', 'design-tokens.css'), 'utf8');
  const theme = fs.readFileSync(path.join(sourceRoot, 'assets', 'theme.css'), 'utf8');
  assert(theme.startsWith('@import "./design-tokens.css";'));
  const styles = fs.readdirSync(path.join(sourceRoot, 'assets'))
    .filter(filename => filename.endsWith('.css'))
    .map(filename => fs.readFileSync(path.join(sourceRoot, 'assets', filename), 'utf8'));
  const collectStyles = directory => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) collectStyles(filename);
      else if (entry.name.endsWith('.vue')) {
        const component = parseComponent(fs.readFileSync(filename, 'utf8'));
        styles.push(...component.styles.map(style => style.content));
      }
    });
  };
  collectStyles(sourceRoot);
  const definitions = new Set(Array.from(styles.join('\n').matchAll(/(--[\w-]+)\s*:/g),
    match => match[1]));
  styles.forEach(style => {
    Array.from(style.matchAll(/var\((--[\w-]+)/g)).forEach(([, name]) => {
      assert(definitions.has(name), `Undefined design token: ${name}`);
    });
  });
  const consumer = fs.readFileSync(path.join(sourceRoot, 'assets', 'site-tokens.css'), 'utf8');
  const tokens = new Map(Array.from(`${tokenSource}\n${consumer}`.matchAll(/(--[\w-]+):\s*([^;]+);/g),
    match => [match[1], match[2]]));
  const checkDependencies = (name, ancestors = []) => {
    assert(!ancestors.includes(name), `Cyclic design token: ${[...ancestors, name].join(' -> ')}`);
    assert(tokens.has(name), `Missing token dependency: ${name}`);
    Array.from(tokens.get(name).matchAll(/var\((--[\w-]+)/g)).forEach(([, dependency]) => {
      checkDependencies(dependency, [...ancestors, name]);
    });
  };
  tokens.forEach((value, name) => checkDependencies(name));
  assert(styles.some(style => style.includes('stroke-width: var(--icon-stroke-width)')));
});

test('portable design skill has valid discovery metadata and a synchronized standalone starter', () => {
  const skillRoot = path.resolve(sourceRoot, '..', '.github', 'skills', 'neon-dark-design');
  const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
  const metadata = skill.match(/^---\r?\nname: ([a-z0-9-]{1,64})\r?\ndescription: ("[^\r\n]+")\r?\n---/);
  assert(metadata, 'Skill requires discoverable name and description frontmatter');
  assert.strictEqual(metadata[1], path.basename(skillRoot));
  const description = JSON.parse(metadata[2]);
  assert(description.length > 0 && description.length <= 1024);
  assert(skill.split('\n').length < 500);
  const resources = Array.from(skill.matchAll(/\]\((\.\/[^)]+)\)/g), match => match[1]);
  assert(resources.includes('./assets/design-tokens.css'));
  resources.forEach(resource => {
    const filename = path.resolve(skillRoot, resource);
    assert(filename.startsWith(`${skillRoot}${path.sep}`), `Nonportable skill resource: ${resource}`);
    assert(fs.statSync(filename).isFile(), `Missing skill resource: ${resource}`);
  });
  const starter = fs.readFileSync(path.join(skillRoot, 'assets', 'design-tokens.css'), 'utf8');
  const canonical = fs.readFileSync(path.join(sourceRoot, 'assets', 'design-tokens.css'), 'utf8');
  assert.strictEqual(starter.replace(/\r\n/g, '\n'), canonical.replace(/\r\n/g, '\n'),
    'Update the skill starter whenever the canonical design tokens change');
  assert(!starter.includes('@import'), 'Starter must work without repository dependencies');
  const portableFiles = [
    ['assets/primitives.css', 'assets/primitives.css'],
    ['components/base/AppButton.vue', 'components/base/AppButton.vue'],
    ['components/base/AppInput.vue', 'components/base/AppInput.vue'],
    ['components/AppSelect.vue', 'components/AppSelect.vue'],
    ['components/AppScrollArea.vue', 'components/AppScrollArea.vue'],
    ['components/Icons/AppIcon.js', 'components/Icons/AppIcon.js'],
  ];
  portableFiles.forEach(([bundled, source]) => {
    const relative = bundled.startsWith('assets/') ? bundled.slice(7) : bundled;
    const actual = fs.readFileSync(path.join(skillRoot, 'assets', relative), 'utf8');
    const expected = fs.readFileSync(path.join(sourceRoot, source), 'utf8');
    assert.strictEqual(actual.replace(/\r\n/g, '\n'), expected.replace(/\r\n/g, '\n'),
      `Stale portable component/style: ${bundled}`);
    if (source.endsWith('.vue')) {
      const parsed = parseComponent(actual);
      assert.deepStrictEqual(compile(parsed.template.content).errors, [],
        `Invalid starter template: ${source}`);
      assert(!/var\(--(?:rarity|rank|nav|details|card)-/.test(actual),
        `Product token leaked into portable component: ${source}`);
      Array.from(parsed.script.content.matchAll(/from ['"](\.[^'"]+)['"]/g))
        .forEach(([, dependency]) => {
          const target = path.resolve(skillRoot, 'assets', path.dirname(relative), dependency);
          assert(target.startsWith(`${path.join(skillRoot, 'assets')}${path.sep}`));
          assert([target, `${target}.js`, `${target}.vue`].some(filename => fs.existsSync(filename)),
            `Starter depends on a missing application module: ${dependency}`);
        });
    }
  });
  assert(fs.existsSync(path.join(skillRoot, 'references', 'components.md')));
  ['lucide-license.txt', 'overlayscrollbars-license.txt'].forEach(filename => {
    const bundled = fs.readFileSync(path.join(skillRoot, 'assets', 'licenses', filename), 'utf8');
    const license = fs.readFileSync(path.join(sourceRoot, '..', 'public', filename), 'utf8');
    assert.strictEqual(bundled.replace(/\r\n/g, '\n'), license.replace(/\r\n/g, '\n'));
  });
});

test('shared Lucide icons render consistent decorative SVGs and preserve caller attributes', () => {
  const icon = loadSource(path.join(sourceRoot, 'components', 'Icons', 'AppIcon.js')).default;
  const h = (tag, data, children) => ({ tag, data, children });
  ['search', 'menu', 'chevron-down', 'close', 'external-link', 'reset'].forEach(name => {
    const vnode = icon.render(h, {
      props: { name },
      data: { staticClass: 'search-bar-icon', class: { active: true }, attrs: { id: 'test-icon' } },
    });
    assert.strictEqual(vnode.tag, 'svg');
    assert.strictEqual(vnode.data.staticClass, 'search-bar-icon');
    assert.deepStrictEqual(vnode.data.class, [{ active: true }, 'app-icon']);
    assert.strictEqual(vnode.data.attrs.id, 'test-icon');
    assert.strictEqual(vnode.data.attrs.viewBox, '0 0 24 24');
    assert.strictEqual(vnode.data.attrs.stroke, 'currentColor');
    assert.strictEqual(vnode.data.attrs.fill, 'none');
    assert.strictEqual(vnode.data.attrs['stroke-width'], 1.75);
    assert.strictEqual(vnode.data.attrs['aria-hidden'], 'true');
    assert.strictEqual(vnode.data.attrs.focusable, 'false');
    assert(vnode.children.length > 0);
    vnode.children.forEach(child => {
      assert(['path', 'circle', 'line', 'polyline', 'rect'].includes(child.tag));
      assert(Object.keys(child.data.attrs).length > 0);
    });
  });
  assert.throws(() => icon.render(h, { props: { name: 'missing' }, data: {} }),
    /Unknown UI icon: missing/);
  const manifest = require('../package.json');
  assert(manifest.dependencies.lucide);
  assert(!Object.keys(manifest.dependencies).some(name => name.startsWith('@fortawesome/')));
});

test('deleting custom profiles clears stale selections and persists without reusing IDs', async () => {
  store.commit('setSelectedRole', 'enforcer');
  store.commit('setCustomBuildTarget', 'custom-1');
  store.commit('setFilterByState', { dlc: ['Base game'], rarity: [ItemRarity.COMMON] });
  store.commit('updateSearchTermState', 'drone');
  const otherProfiles = JSON.stringify(store.state.customBuilds.slice(1));
  const nextNumber = store.state.nextCustomBuildNumber;
  await store.dispatch('deleteCustomBuild', 'custom-1');
  assert.strictEqual(store.state.selectedRole, 'enforcer');
  assert.strictEqual(store.state.customBuildTarget, '');
  assert.strictEqual(JSON.stringify(store.state.customBuilds), otherProfiles);
  assert(!store.getters.builds.some(build => build.id === 'custom-1'));
  assert(!parseCustomBuilds(stored).profiles.some(build => build.id === 'custom-1'));
  assert.throws(() => store.dispatch('deleteCustomBuild', 'enforcer'), /Unknown custom build/);

  store.commit('setSelectedRole', 'custom-2');
  store.commit('setCustomBuildTarget', 'custom-3');
  store.commit('updateSortByState', SortType.RECOMMENDED);
  await store.dispatch('deleteCustomBuild', 'custom-2');
  assert.strictEqual(store.state.selectedRole, '');
  assert.strictEqual(store.getters.selectedBuild, undefined);
  assert.strictEqual(store.state.sortBy, SortType.RARITY);
  assert.strictEqual(store.state.customBuildTarget, 'custom-3');
  assert.deepStrictEqual(Array.from(store.state.filterBy.dlc), ['Base game']);
  assert.strictEqual(store.state.searchTerm, 'drone');

  store.commit('setSelectedRole', 'custom-3');
  const saved = stored;
  failWrite = true;
  await store.dispatch('deleteCustomBuild', 'custom-3');
  assert.strictEqual(store.state.customBuilds.length, 0);
  assert.strictEqual(store.state.selectedRole, '');
  assert.strictEqual(store.state.customBuildTarget, '');
  assert(store.state.customBuildError.includes('Changes are only in memory'));
  assert.strictEqual(stored, saved);
  failWrite = false;
  await store.dispatch('saveCustomBuilds');
  await store.dispatch('loadCustomBuilds');
  assert.strictEqual(store.state.customBuilds.length, 0);
  assert.strictEqual(store.state.nextCustomBuildNumber, nextNumber);
  await store.dispatch('createCustomBuild');
  assert.strictEqual(store.state.selectedRole, `custom-${nextNumber}`);
  assert.strictEqual(store.state.customBuildError, '');
});

test('custom-build actions follow every informational section in item details', () => {
  const sidebar = fs.readFileSync(path.join(sourceRoot, 'components', 'SideBar.vue'), 'utf8');
  const actions = sidebar.indexOf('<section class="custom-build-actions"');
  ['item-description', 'drone-info', 'equipment-cooldown', 'unlock-info-section',
    'item-category-section', 'item-stats-section'].forEach(className => {
    assert(sidebar.indexOf(`class="${className}"`) < actions, `${className} follows build actions`);
  });
});

async function runTests() {
  try {
    await tests.reduce((previous, { name, run }) => previous.then(run).then(() => {
      passed += 1;
      process.stdout.write(`PASS ${name}\n`);
    }), Promise.resolve());
    process.stdout.write(`\n${passed} regression tests passed.\n`);
  } finally {
    delete global.window;
  }
}

runTests().catch(error => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});

/* eslint-disable import/no-dynamic-require, global-require */
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { transformFileSync } = require('@babel/core');
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
const { SortType, ItemRarity } = loadSource(path.join(sourceRoot, 'data', 'constants.js'));
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

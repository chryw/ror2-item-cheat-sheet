/* eslint-disable import/no-dynamic-require, global-require */
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const { transformFileSync } = require('@babel/core');
const items = require('../src/data/items.json');

const cache = new Map();
const sourceRoot = path.resolve(__dirname, '..', 'src');

// Compile application ES modules with the project's existing Babel tooling.
function loadSource(filename) {
  const resolved = require.resolve(filename);
  if (resolved.endsWith('.webp')) return resolved;
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
const { SortType, ItemRarity } = loadSource(path.join(sourceRoot, 'data', 'constants.js'));
const store = loadSource(path.join(sourceRoot, 'store.js')).default;
const ids = Object.keys(items);
let passed = 0;

function test(name, run) {
  run();
  passed += 1;
  process.stdout.write(`PASS ${name}\n`);
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
  assert(ids.some(id => !items[id].category));
  const allCategorized = utils.filterOperation(ids, items, { category: ['Damage'] });
  assert(allCategorized.length > 0);
  assert(allCategorized.every(id => (items[id].category || []).includes('Damage')));
  assert.deepStrictEqual(
    utils.filterOperation(ids, items, { category: ['On Kill Effect'] }),
    utils.filterOperation(ids, items, { category: ['OnKillEffect'] }),
  );
  assert.deepStrictEqual(utils.filterOperation(ids, items, { category: [], rarity: [] }), ids);
});

test('existing name, rarity and ID sorts are still available', () => {
  assert.deepStrictEqual(utils.sortOperation(
    ['Ukulele', 'Crowbar'], items, SortType.NAME,
  ), ['Crowbar', 'Ukulele']);
  assert.deepStrictEqual(utils.sortOperation(
    ['Spare Drone Parts', 'Crowbar', 'Ukulele'], items, SortType.RARITY,
  ), ['Crowbar', 'Ukulele', 'Spare Drone Parts']);
  const withIds = ids.filter(id => items[id].id);
  const sorted = utils.sortOperation(withIds, items, SortType.ID);
  sorted.forEach((id, index) => {
    assert(index === 0 || Number(items[id].id) >= Number(items[sorted[index - 1]].id));
  });
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
  assert.deepStrictEqual(store.state.filterBy.category, ['Damage']);
  assert.deepStrictEqual(store.state.filterBy.rarity, []);
  store.commit('setRecommendedOnly', false);
  assert.strictEqual(store.state.recommendedOnly, false);
});

process.stdout.write(`\n${passed} regression tests passed.\n`);

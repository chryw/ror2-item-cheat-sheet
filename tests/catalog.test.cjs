const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const items = require('../src/data/items.json');
const images = require('../src/data/itemImages.json');
const dlcItems = Object.values(items).filter(item => item.dlc === 'Hallowed Concepts');
const expectedNames = [
  'Mycelium Cap', 'Peace Flower', 'Whispering Fragment',
  'Corpse Lily', 'Dream Crucible', 'Earthbound Vessel', 'Infernal Mark',
  'Nightmare Demon', 'Ritual Helmet', 'Sanguine Chalice', 'Stained Scimitar',
  'Totem of Avarice', 'Vengeful Spirit', 'Vile Censer',
  'Hex of Acceleration', 'Hex of Blindness', 'Hex of Famine', 'Hex of Greed',
  'Hex of Haunting', 'Hex of Leaping', 'Hex of Loss', 'Hex of Mimicry',
  'Hex of Misfortune', 'Hex of Ossification', 'Hex of Pain', 'Hex of Patience',
  'Hex of Rain', 'Hex of Strife',
  'Clarity', 'Dark Alchemy', 'Fanatic Summons', 'Purify', 'Reincarnation',
  'Shadow Cloak', 'Shredded Page', 'Warp Gate',
  'Totem of Sacrifice', "N'kuhana's Rebirth",
];

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const constantsSource = fs.readFileSync(path.join(root, 'src', 'data', 'constants.js'), 'utf8');
// Replace bundler-only image imports so the actual filtering helpers can run in Node.
const constantsUrl = moduleUrl(constantsSource.replace(
  /^import (\w+) from "([^"]+)";$/gm,
  'const $1 = "$2";',
));
const helpersSource = fs.readFileSync(
  path.join(root, 'src', 'helpers', 'ItemIdUtils.js'), 'utf8',
).replace("'../data/constants'", JSON.stringify(constantsUrl));

test('includes every wiki-listed Hallowed Concepts entry in the correct tier', () => {
  assert.deepEqual(dlcItems.map(item => item.name).sort(), expectedNames.slice().sort());
  const counts = {};
  dlcItems.forEach(item => { counts[item.itemRarity] = (counts[item.itemRarity] || 0) + 1; });
  assert.deepEqual(counts, {
    Boss: 3,
    Hallowed: 11,
    Hex: 14,
    "N'tormat Pages": 8,
    'Lunar Equipment': 1,
    'Elite Equipment': 1,
  });
  assert.equal(Object.keys(items).length, 248);
});

test('new entries have complete metadata, supported categories, and local PNGs', async () => {
  const { Category, DlcIconUrl, ItemRarityClass, ItemRaritySortValue } = await import(constantsUrl);
  dlcItems.forEach(item => {
    assert.equal(items[item.name], item);
    assert.ok(item.shortDescription);
    assert.ok(item.description);
    assert.ok(item.wikiLink.startsWith('https://riskofrain2.wiki.gg/wiki/'));
    assert.ok(item.category.length);
    item.category.forEach(category => assert.ok(Object.values(Category).includes(category)));
    assert.ok(Array.isArray(item.stats));
    item.stats.forEach(stat => {
      ['stat', 'value', 'stackType', 'stackValue'].forEach(key => assert.ok(stat[key]));
    });
    assert.ok(ItemRarityClass[item.itemRarity]);
    assert.ok(Number.isFinite(ItemRaritySortValue[item.itemRarity]));
    const image = fs.readFileSync(path.join(root, 'public', 'items', images[item.name]));
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(image.readUInt32BE(16) > 0);
    assert.ok(image.readUInt32BE(20) > 0);
  });
  assert.ok(fs.existsSync(path.resolve(root, 'src', 'data', DlcIconUrl['Hallowed Concepts'])));
});

test('new tiers support rarity/category filtering, sorting, search and equipment separation', async () => {
  const { default: helpers } = await import(moduleUrl(helpersSource));
  const { SortType, EquipmentItemRarities } = await import(constantsUrl);
  const ids = dlcItems.map(item => item.name);
  assert.equal(helpers.showHiddenOperation(ids, items, false).length, 38);
  assert.equal(helpers.filterByItemListType(ids, items, false).length, 36);
  assert.deepEqual(
    helpers.filterByItemListType(ids, items, true).sort(),
    ["N'kuhana's Rebirth", 'Totem of Sacrifice'],
  );
  ['Hallowed', 'Hex', "N'tormat Pages"].forEach(rarity => {
    const filtered = helpers.filterOperation(ids, items, { rarity: [rarity], category: [] });
    assert.ok(filtered.length);
    assert.ok(filtered.every(id => items[id].itemRarity === rarity));
    assert.ok(!EquipmentItemRarities.includes(rarity));
    const sorted = helpers.sortOperation(ids.slice(), items, SortType.RARITY);
    const positions = filtered.map(id => sorted.indexOf(id)).sort((a, b) => a - b);
    assert.equal(positions.at(-1) - positions[0] + 1, filtered.length);
  });
  assert.ok(helpers.filterOperation(ids, items, {
    rarity: ["N'tormat Pages"], category: ['Mobility'],
  }).includes('Warp Gate'));
  assert.deepEqual(helpers.searchOperation(ids, items, 'infernal'), ['Infernal Mark']);
  assert.ok(helpers.searchOperation(ids, items, 'cooldown').includes('Clarity'));
});

test('both item cards and sidebars style every new tier', async () => {
  const { ItemRarityClass } = await import(constantsUrl);
  ['ItemCard.vue', 'SideBar.vue'].forEach(filename => {
    const source = fs.readFileSync(path.join(root, 'src', 'components', filename), 'utf8');
    ['Hallowed', 'Hex', "N'tormat Pages"].forEach(rarity => {
      assert.ok(source.includes(`.${ItemRarityClass[rarity]} {`));
    });
  });
});

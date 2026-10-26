const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const { contentContract, readContent, validateCatalog } = require('./design-content.cjs');
const { createFixtures } = require('./design-preview.cjs');

const { readDesignSource } = require('./design-source.cjs');

const { tokens: base } = readDesignSource();
const specification = contentContract();
const { fixtures, assets, commit } = createFixtures(base);

test('authoritative content is pinned, preserves every authored item field and resolves local assets', () => {
  assert.equal(commit, specification.tenants.ror2.revision);
  const original = JSON.parse(execFileSync('git', [
    'show', `${commit}:${specification.tenants.ror2.files.items}`,
  ], { encoding: 'utf8' }));
  const records = new Map(fixtures.ror2.entries.map(entry => [entry.id, entry]));
  Object.entries(original).filter(([, entry]) => !entry.hidden).forEach(([id, source]) => {
    const output = records.get(id);
    Object.entries(source).forEach(([field, value]) => {
      const projection = { id: 'catalogId', image: 'sourceImage' };
      assert.deepEqual(output[projection[field] || field], value, `${id}.${field}`);
    });
    assert.ok(assets.has(output.image), id);
  });
  const drone = records.get('Gunner Drone');
  assert.equal(drone.acquisition, 'Repair with gold. The price scales with difficulty.');
  assert.equal(drone.wikiLink, 'https://riskofrain2.wiki.gg/wiki/Gunner_Drone');
  assert.equal(drone.armor, 0);
  assert.equal(drone.health, '150 (+45 per level)');
  assert.equal(assets.get(drone.image), 'public/drones/Gunner_Drone.png');
  assert.equal(assets.size, 267);
});

test('catalog projection and asset manifest are deterministic and samples are checked-in records', () => {
  const again = createFixtures(base);
  assert.equal(JSON.stringify(again.fixtures), JSON.stringify(fixtures));
  assert.deepEqual([...again.assets], [...assets]);
  const sample = readContent(specification.tenants.minecraft.file);
  assert.equal(fixtures.minecraft.provenance.authority, 'illustrative-only');
  assert.deepEqual(fixtures.minecraft.entries.map(entry => entry.id),
    sample.entries.map(entry => entry.id));
  assert.deepEqual(fixtures.minecraft.entries.map(entry => entry.shortDescription),
    sample.entries.map(entry => entry.shortDescription));
  assert.equal(fixtures.minecraft.commit, null);
});

test('missing facts, assets, identities, taxonomies and authority fail instead of fabricating fallbacks', () => {
  const invalid = fields => ({ ...fixtures.ror2, ...fields });
  const withEntry = fields => invalid({
    entries: [{ ...fixtures.ror2.entries[0], ...fields }, ...fixtures.ror2.entries.slice(1)],
  });
  assert.throws(() => validateCatalog(withEntry({ name: undefined })), /Missing required/);
  assert.throws(() => validateCatalog(withEntry({ image: null })), /Missing authoritative artwork/);
  assert.throws(() => validateCatalog(invalid({
    entries: [...fixtures.ror2.entries, fixtures.ror2.entries[0]],
  })), /Duplicate catalog/);
  assert.throws(() => validateCatalog(withEntry({ group: 'Invented rarity' })), /Unknown catalog taxonomy/);
  assert.throws(() => validateCatalog(invalid({
    provenance: { ...fixtures.ror2.provenance, authority: 'illustrative-only' },
  })), /Invalid catalog provenance/);
  assert.throws(() => validateCatalog(invalid({
    provenance: { ...fixtures.ror2.provenance, repository: 'https://example.com/not-the-declared-source' },
  })), /Invalid catalog provenance/);
  assert.throws(() => validateCatalog(invalid({ entries: [] })), /Empty source catalog/);
});

test('content plug-ins require a pinned source, safe paths and non-generative policy', () => {
  assert.throws(() => contentContract({
    ...specification, policy: { ...specification.policy, generation: 'allowed' },
  }), /Unsupported definitive/);
  const changed = JSON.parse(JSON.stringify(specification));
  changed.tenants.ror2.revision = 'main';
  assert.throws(() => contentContract(changed), /authority\/revision/);
  changed.tenants.ror2.revision = commit;
  changed.tenants.ror2.files.items = '../outside.json';
  assert.throws(() => contentContract(changed), /repository-relative/);
  const alternate = {
    ...specification,
    tenants: { 'ror2-alternate': specification.tenants.ror2 },
  };
  const fixture = { ...fixtures.ror2, id: 'ror2-alternate' };
  assert.equal(validateCatalog(fixture, alternate), fixture);
});

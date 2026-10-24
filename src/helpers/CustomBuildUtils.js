import items from '../data/items.json';

export const customBuildStorageKey = 'ror2-custom-builds-v1';

export const parseCustomBuilds = raw => {
  if (raw === null) return { profiles: [], nextNumber: 1 };
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.profiles)
    || !Number.isSafeInteger(data.nextNumber) || data.nextNumber < 1) {
    throw new Error('Invalid custom build data.');
  }
  const ids = new Set();
  const profiles = data.profiles.map(profile => {
    if (!profile || typeof profile.id !== 'string' || !/^custom-[1-9]\d*$/.test(profile.id)
      || ids.has(profile.id) || Number(profile.id.slice(7)) >= data.nextNumber
      || typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 80
      || !Array.isArray(profile.itemIds)
      || new Set(profile.itemIds).size !== profile.itemIds.length
      || profile.itemIds.some(id => typeof id !== 'string'
        || !Object.prototype.hasOwnProperty.call(items, id) || items[id].hidden)) {
      throw new Error('Invalid custom build profile.');
    }
    ids.add(profile.id);
    return { id: profile.id, name: profile.name.trim(), itemIds: [...profile.itemIds] };
  });
  return { profiles, nextNumber: data.nextNumber };
};

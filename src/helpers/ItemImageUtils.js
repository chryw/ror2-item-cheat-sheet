import itemImages from '../data/itemImages.json';

export default function getItemImageUrl(itemId, baseUrl) {
  const filename = itemImages[itemId];
  if (!filename) {
    throw new Error(`Missing catalogue image: ${itemId}`);
  }
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}items/${encodeURIComponent(filename)}`;
}

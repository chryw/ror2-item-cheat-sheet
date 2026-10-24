import itemImages from '../data/itemImages.json';
import drones from '../data/drones';

export default function getItemImageUrl(itemId, baseUrl) {
  const drone = Object.prototype.hasOwnProperty.call(drones, itemId) && drones[itemId];
  const filename = drone ? drone.image : itemImages[itemId];
  if (!filename) {
    throw new Error(`Missing catalogue image: ${itemId}`);
  }
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${drone ? 'drones' : 'items'}/${encodeURIComponent(filename)}`;
}

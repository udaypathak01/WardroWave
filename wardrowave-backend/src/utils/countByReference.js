/**
 * Counts repeated referenced document IDs in an array of embedded records.
 */
export function countByReference(items, field) {
  const counts = new Map();
  for (const item of items) {
    if (item[field] == null) throw new TypeError(`Missing ${field} reference`);
    const key = String(item[field]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

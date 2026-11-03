import { DEFAULT_SETTINGS } from '../config/constants.js';
import { Setting } from '../models/Setting.js';

let cachedSettings;
let cacheExpiresAt = 0;

/**
 * Loads runtime settings and caches the merged values for 60 seconds.
 */
export async function getRentalSettings({ session } = {}) {
  const now = Date.now();
  if (!session && cachedSettings && now < cacheExpiresAt) return cachedSettings;

  const documents = await Setting.find({})
    .session(session ?? null)
    .lean()
    .exec();
  const stored = Object.fromEntries(documents.map(({ key, value }) => [key, value]));
  const settings = { ...DEFAULT_SETTINGS, ...stored };

  if (!session) {
    cachedSettings = Object.freeze(settings);
    cacheExpiresAt = now + 60_000;
  }
  return settings;
}

/**
 * Invalidates the in-memory settings cache after an administrative change.
 */
export function invalidateRentalSettingsCache() {
  cachedSettings = undefined;
  cacheExpiresAt = 0;
}

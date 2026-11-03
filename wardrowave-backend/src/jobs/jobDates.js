const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns midnight IST as a UTC date for a given instant.
 */
export function istDayStart(value = new Date()) {
  const ist = new Date(value.getTime() + IST_OFFSET_MS);
  const date = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
  return new Date(`${date}T00:00:00+05:30`);
}

/**
 * Adds calendar days to an IST midnight without drifting across local DST settings.
 */
export function addIstDays(dayStart, days) {
  return new Date(dayStart.getTime() + days * 24 * 60 * 60 * 1000);
}

export function istDayRange(value = new Date(), daysFromToday = 0) {
  const start = addIstDays(istDayStart(value), daysFromToday);
  return { start, end: addIstDays(start, 1) };
}

export function formatIstDate(value) {
  const ist = new Date(value.getTime() + IST_OFFSET_MS);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
}

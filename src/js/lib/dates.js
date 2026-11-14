/**
 * Date helpers. Dates are local calendar days as "YYYY-MM-DD" strings.
 */

const DAY_MS = 86400000;

/** Local calendar day for a Date or ISO timestamp. */
export function localDateISO(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** ISO 8601 week: { year, week, weekday } where Monday = 1 and Sunday = 7. */
export function isoWeek(iso) {
  const date = toUTC(iso);
  const weekday = date.getUTCDay() || 7;
  const thursday = new Date(date.getTime() + (4 - weekday) * DAY_MS);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((thursday - yearStart) / DAY_MS + 1) / 7);
  return { year: thursday.getUTCFullYear(), week, weekday };
}

/** "2026-W46" */
export function weekKey(iso) {
  const { year, week } = isoWeek(iso);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** "2026-11" */
export function monthKey(iso) {
  return iso.slice(0, 7);
}

/** "lördag 14 november" */
export function formatDay(iso) {
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(toUTC(iso));
}

/** "november 2026" */
export function formatMonth(key) {
  return new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(toUTC(`${key}-01`));
}

/** "vecka 46" */
export function formatWeek(key) {
  return `vecka ${Number(key.split('-W')[1])}`;
}

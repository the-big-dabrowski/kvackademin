/**
 * Pure reading-plan logic: no DOM, no storage.
 *
 * A book has a weekly plan: [{ week, from, to }] in ISO weeks of `book.year`.
 * `lastPage` is the last page the reader has finished (0 = not started).
 */

const DAY_MS = 86400000;

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

const weekKey = (year, week) => year * 100 + week;

export function lastPageOfBook(book) {
  return book.pages ?? Math.max(...book.plan.map((p) => p.to));
}

/**
 * Where the reader stands today.
 * phase: "before" (plan not started), "active", "after" (plan over), "finished" (book read).
 */
export function readingStatus(book, lastPage, todayISO) {
  const end = lastPageOfBook(book);
  const maxPerDay = book.maxPagesPerDay ?? 15;
  const today = isoWeek(todayISO);
  const todayKey = weekKey(today.year, today.week);
  const plan = [...book.plan].sort((a, b) => a.week - b.week);
  const first = plan[0];
  const last = plan[plan.length - 1];

  if (lastPage >= end) return { phase: 'finished', end, lastPage };
  if (todayKey < weekKey(book.year, first.week)) return { phase: 'before', end, lastPage, firstWeek: first };

  const index = plan.findIndex((p) => weekKey(book.year, p.week) === todayKey);
  const daysLeftInWeek = 8 - today.weekday;

  if (index === -1) {
    // The plan is over but pages are left.
    const from = lastPage + 1;
    return {
      phase: 'after', end, lastPage,
      behindPages: last.to - lastPage,
      suggestion: { from, to: Math.min(end, from + maxPerDay - 1) },
    };
  }

  const entry = plan[index];
  const expectedAtWeekStart = index > 0 ? plan[index - 1].to : entry.from - 1;
  const behindPages = Math.max(0, expectedAtWeekStart - lastPage);
  const weekRemaining = Math.max(0, entry.to - lastPage);
  const from = lastPage + 1;

  let suggestion;
  if (weekRemaining > 0) {
    const pages = Math.min(maxPerDay, Math.ceil(weekRemaining / daysLeftInWeek));
    suggestion = { from, to: from + pages - 1 };
  } else {
    // This week's pages are done: optional extra reading at the normal pace.
    const pace = Math.ceil((entry.to - entry.from + 1) / 7);
    suggestion = { from, to: Math.min(end, from + Math.min(maxPerDay, pace) - 1) };
  }

  return {
    phase: 'active', end, lastPage,
    week: entry.week, entry, behindPages,
    weekDone: weekRemaining === 0,
    suggestion,
  };
}

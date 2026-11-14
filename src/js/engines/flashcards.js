/**
 * Leitner flashcards engine. Pure functions: no DOM, no storage.
 *
 * - 3 boxes. New cards start in box 1.
 * - Both directions: every card becomes two items ("front -> back" and "back -> front").
 * - Known answer moves the item up one box, "not yet" moves it back to box 1.
 * - Higher boxes are reviewed less often (see REVIEW_INTERVAL_DAYS).
 *
 * Deck state:   { version, items: { [itemKey]: { box, lastSeen } } }
 * Session:      { queue: itemKey[], position, retries: { [itemKey]: n } }
 * Item key:     `${cardId}:${direction}`
 */

export const BOX_COUNT = 3;
export const DIRECTIONS = Object.freeze(['forward', 'reverse']);
export const REVIEW_INTERVAL_DAYS = Object.freeze({ 1: 1, 2: 2, 3: 4 });
/** How many extra tries a "not yet" item gets within one session. */
export const MAX_RETRIES = 2;
/** How many other items come before a retried item shows up again. */
export const RETRY_GAP = 3;
/** Items in a light review session when nothing is due. */
export const REVIEW_SIZE = 5;

export function itemKey(cardId, direction) {
  return `${cardId}:${direction}`;
}

export function parseItemKey(key) {
  const i = key.lastIndexOf(':');
  return { cardId: key.slice(0, i), direction: key.slice(i + 1) };
}

function toUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(fromISO, toISO) {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / 86400000);
}

/** Make sure the deck has exactly one item per card and direction, keeping saved progress. */
export function syncDeck(saved, cards) {
  const items = {};
  for (const direction of DIRECTIONS) {
    for (const card of cards) {
      const key = itemKey(card.id, direction);
      items[key] = saved?.items?.[key] ?? { box: 1, lastSeen: null };
    }
  }
  return { version: 1, items };
}

export function isDue(entry, today, examSoon = false) {
  if (!entry.lastSeen) return true;
  if (examSoon) return entry.lastSeen < today;
  return daysBetween(entry.lastSeen, today) >= REVIEW_INTERVAL_DAYS[entry.box];
}

/** Reorder so the two directions of the same card are not shown back to back. */
function spreadOut(keys) {
  const rest = [...keys];
  const result = [];
  while (rest.length) {
    const prev = result.length ? parseItemKey(result[result.length - 1]).cardId : null;
    const i = rest.findIndex((k) => parseItemKey(k).cardId !== prev);
    result.push(...rest.splice(i === -1 ? 0 : i, 1));
  }
  return result;
}

/**
 * Pick today's items: lowest box first, unseen before oldest seen.
 * If nothing is due, return a short light review of the weakest items.
 */
export function pickSession(deck, { today, maxItems, examSoon = false }) {
  const entries = Object.entries(deck.items);
  const order = (a, b) => a[1].box - b[1].box || (a[1].lastSeen ?? '').localeCompare(b[1].lastSeen ?? '');
  const due = entries.filter(([, e]) => isDue(e, today, examSoon)).sort(order);
  const pool = due.length ? due.slice(0, maxItems) : [...entries].sort(order).slice(0, REVIEW_SIZE);
  return spreadOut(pool.map(([key]) => key));
}

export function applyAnswer(deck, key, known, today) {
  const current = deck.items[key] ?? { box: 1, lastSeen: null };
  const box = known ? Math.min(current.box + 1, BOX_COUNT) : 1;
  return { ...deck, items: { ...deck.items, [key]: { box, lastSeen: today } } };
}

export function createSession(keys) {
  return { queue: [...keys], position: 0, retries: {} };
}

export function currentKey(session) {
  return session.queue[session.position] ?? null;
}

export function isFinished(session) {
  return session.position >= session.queue.length;
}

/** Number of different items in the session (retries not counted twice). */
export function uniqueCount(session) {
  return new Set(session.queue).size;
}

/**
 * Move to the next item. A "not yet" item is put back a few steps later
 * so the learner gets a new try, at most MAX_RETRIES times.
 */
export function advanceSession(session, known) {
  const key = currentKey(session);
  const queue = [...session.queue];
  const retries = { ...session.retries };
  let requeued = false;
  if (!known && (retries[key] ?? 0) < MAX_RETRIES) {
    retries[key] = (retries[key] ?? 0) + 1;
    queue.splice(Math.min(queue.length, session.position + 1 + RETRY_GAP), 0, key);
    requeued = true;
  }
  return { session: { queue, position: session.position + 1, retries }, requeued };
}

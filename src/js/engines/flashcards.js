/**
 * Leitner flashcards engine. Pure functions: no DOM, no storage.
 *
 * - 3 boxes. New cards start in box 1.
 * - Both directions: every card becomes two items ("front -> back" and "back -> front"),
 *   unless the card limits it with `directions`, e.g. ["forward"] for open questions.
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
export const MAX_RETRIES = 3;
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

/** The directions a card is practised in. Defaults to both. */
export function cardDirections(card) {
  const chosen = DIRECTIONS.filter((d) => card.directions?.includes(d));
  return chosen.length ? chosen : [...DIRECTIONS];
}

/** Make sure the deck has exactly one item per card and direction, keeping saved progress. */
export function syncDeck(saved, cards) {
  const items = {};
  for (const direction of DIRECTIONS) {
    for (const card of cards) {
      if (!cardDirections(card).includes(direction)) continue;
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
  const left = (cardId) => rest.filter((k) => parseItemKey(k).cardId === cardId).length;
  while (rest.length) {
    const prev = result.length ? parseItemKey(result[result.length - 1]).cardId : null;
    // Take the card with most items left first, so two of the same card are not left for the end.
    let best = -1;
    rest.forEach((k, i) => {
      const id = parseItemKey(k).cardId;
      if (id !== prev && (best === -1 || left(id) > left(parseItemKey(rest[best]).cardId))) best = i;
    });
    result.push(...rest.splice(best === -1 ? 0 : best, 1));
  }
  return result;
}

/**
 * Shuffle with a seed, so the same day always gives the same order.
 * Mixes kinds and sections instead of following the order in the file.
 */
function seededShuffle(list, seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.codePointAt(0)) >>> 0;
  const random = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x6d2b79f5) >>> 0;
    return seed / 2 ** 32;
  };
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick today's items: lowest box first, unseen before oldest seen.
 * Items that are equal on that are mixed (same mix all day).
 *
 * Optional quotas: `groupOf(key)` names an item's group (e.g. the card kind) and
 * `quota[group]` is how many items of that group are added on top of `maxItems`.
 * Groups without a quota share `maxItems`. A quota group never gets more than its quota.
 *
 * If nothing is due, return a short light review of the weakest items.
 */
export function pickSession(deck, { today, maxItems, examSoon = false, quota = {}, groupOf = () => null }) {
  // Array.prototype.sort is stable, so the shuffled order is kept between equal items.
  const entries = seededShuffle(Object.entries(deck.items), today);
  const order = (a, b) => a[1].box - b[1].box || (a[1].lastSeen ?? '').localeCompare(b[1].lastSeen ?? '');
  const due = entries.filter(([, e]) => isDue(e, today, examSoon)).sort(order);
  if (!due.length) return spreadOut([...entries].sort(order).slice(0, REVIEW_SIZE).map(([key]) => key));

  const hasQuota = ([key]) => Number.isInteger(quota[groupOf(key)]);
  const main = due.filter((e) => !hasQuota(e)).slice(0, maxItems);
  const taken = {};
  const extra = due.filter((entry) => {
    if (!hasQuota(entry)) return false;
    const group = groupOf(entry[0]);
    taken[group] = (taken[group] ?? 0) + 1;
    return taken[group] <= quota[group];
  });
  const keys = [...main, ...extra].map(([key]) => key);
  return spreadOut(seededShuffle(keys, `${today}|order`));
}

/** Mix item keys with a seed and keep two directions of a card apart. */
export function mixKeys(keys, seed) {
  return spreadOut(seededShuffle(keys, seed));
}

/** Every item in the deck once, mixed (same mix all day). Used when a session covers the whole exam. */
export function pickAll(deck, { today }) {
  return mixKeys(Object.keys(deck.items), today);
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

/** Items left in the session, including retries already queued. */
export function remainingCount(session) {
  return Math.max(0, session.queue.length - session.position);
}

/** Items answered right the first time they were shown. */
export function firstTryCount(session) {
  const missed = Object.values(session.retries ?? {}).filter((n) => n > 0).length;
  return uniqueCount(session) - missed;
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

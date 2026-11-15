/**
 * Checking answers. Pure functions: no DOM, no storage.
 *
 * Typed answers are checked kindly: case, extra spaces and punctuation do not matter,
 * and one small typo is accepted in longer words. Coins are never given for correct answers.
 */

export const ANSWER_MODES = Object.freeze(['self', 'type', 'choice']);
/** Words at least this long may have one typo (one letter wrong, missing or extra). */
export const TYPO_MIN_LENGTH = 5;
export const CHOICE_COUNT = 4;

export function normalize(text) {
  return String(text ?? '')
    .toLocaleLowerCase('sv')
    .replace(/[.,!?;:"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance, stopping early once it is above `max`. */
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/**
 * Check a typed answer against the correct answer and any extra accepted answers.
 * Returns { correct, exact }: `exact` is false when a small typo was forgiven.
 */
export function checkTyped(input, accepted) {
  const given = normalize(input);
  if (!given) return { correct: false, exact: false };
  const answers = accepted.map(normalize).filter(Boolean);
  if (answers.includes(given)) return { correct: true, exact: true };
  const close = answers.some((a) => a.length >= TYPO_MIN_LENGTH && distance(given, a, 1) <= 1);
  return { correct: close, exact: false };
}

/** Small seeded random generator, so the choices stay the same when a card is shown again. */
function seeded(seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.codePointAt(0)) >>> 0;
  return () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x6d2b79f5) >>> 0;
    return seed / 2 ** 32;
  };
}

function shuffle(list, random) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Build the choices for a multiple-choice question: the correct answer plus wrong ones.
 * Wrong ones come from `custom` if given, otherwise from the other cards in the exam (`pool`).
 */
export function buildChoices(correct, { custom = [], pool = [], seed = '', count = CHOICE_COUNT } = {}) {
  const random = seeded(`${seed}|${correct}`);
  const isCorrect = (text) => normalize(text) === normalize(correct);
  const unique = (list) => [...new Map(list.filter((t) => t && !isCorrect(t)).map((t) => [normalize(t), t])).values()];
  const wrong = custom.length ? unique(custom) : shuffle(unique(pool), random);
  return shuffle([correct, ...wrong.slice(0, count - 1)], random);
}

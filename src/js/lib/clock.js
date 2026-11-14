/**
 * Session clock that counts up, never down.
 * Keeps earlier time (`initialMs`) so a resumed session continues where it stopped.
 */

export const PAUSE_SUGGESTION_MS = 20 * 60 * 1000;
const TICK_MS = 15 * 1000;

export function createClock({ initialMs = 0, onTick = () => {} } = {}) {
  let baseMs = initialMs;
  let startedAt = null;
  let intervalId = null;

  const elapsed = () => baseMs + (startedAt ? Date.now() - startedAt : 0);

  return {
    elapsed,
    isRunning: () => startedAt !== null,
    start() {
      if (startedAt) return;
      startedAt = Date.now();
      intervalId = window.setInterval(() => onTick(elapsed()), TICK_MS);
    },
    stop() {
      if (startedAt) baseMs = elapsed();
      startedAt = null;
      window.clearInterval(intervalId);
      intervalId = null;
      return baseMs;
    },
  };
}

/** Calm, count-up text. `verb` is Swedish past participle, e.g. "övat" or "läst". */
export function elapsedText(ms, verb = 'övat') {
  const minutes = Math.floor(ms / 60000);
  return minutes < 1 ? 'Du har precis börjat.' : `Du har ${verb} i ${minutes} min.`;
}

import { getLog } from './log.js';
import { getModule } from './registry.js';
import { computeRewards, coinsThisWeek, WEEK_CAP, formatKr } from './rewards.js';
import { localDateISO, formatDay } from '../lib/dates.js';

/**
 * Daily report built from the log. Used by the report view and parent mode.
 */

export function describeDone(entry) {
  const module = getModule(entry.type);
  const title = entry.meta?.title ?? module?.label ?? 'Uppdrag';
  const detail = module?.summarize?.(entry.meta ?? {});
  return detail ? `${title}: ${detail}` : title;
}

/** Done entries for one local day, one per mission. */
export function doneOn(log, day) {
  const seen = new Set();
  return log.filter((e) => {
    if (e.event !== 'done' || localDateISO(e.timestamp) !== day || seen.has(e.missionId)) return false;
    seen.add(e.missionId);
    return true;
  });
}

export async function buildDailyReport(day = localDateISO()) {
  const log = await getLog();
  const done = doneOn(log, day);
  const rewards = computeRewards(log);
  const weekCoins = coinsThisWeek(rewards, day);
  const lines = done.map(describeDone);
  const text = [
    `Kvackademin, ${formatDay(day)}`,
    '',
    lines.length ? 'Klart idag:' : 'Inga uppdrag klara idag än.',
    ...lines.map((l) => `- ${l}`),
    '',
    `Coins den här veckan: ${formatKr(weekCoins)} av ${formatKr(WEEK_CAP)}`,
  ].join('\n');
  return { day, lines, weekText: `${formatKr(weekCoins)} av ${formatKr(WEEK_CAP)}`, text };
}

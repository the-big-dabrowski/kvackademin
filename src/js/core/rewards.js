import { localDateISO, weekKey, monthKey } from '../lib/dates.js';

/**
 * Coins and XP, derived from the event log (never stored, so they always match the log).
 *
 * - Coins are given for a completed mission, never for number of correct answers.
 *   Caps: 25 kr per ISO week and 100 kr per calendar month.
 * - XP is given for effort: every answer or step, and every completed mission. No cap.
 */

export const COINS_PER_MISSION = 5;
export const WEEK_CAP = 25;
export const MONTH_CAP = 100;
export const XP_PER_DONE = 10;
export const XP_PER_STEP = 1;

export function computeRewards(log) {
  const weeks = {};
  const months = {};
  const awards = {};
  let xp = 0;

  const sorted = [...log].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const entry of sorted) {
    if (entry.event === 'progress' && !entry.meta?.action) xp += XP_PER_STEP;
    if (entry.event !== 'done' || entry.missionId in awards) continue;

    xp += XP_PER_DONE;
    const day = localDateISO(entry.timestamp);
    const w = weekKey(day);
    const m = monthKey(day);
    const coins = Math.max(0, Math.min(COINS_PER_MISSION, WEEK_CAP - (weeks[w] ?? 0), MONTH_CAP - (months[m] ?? 0)));
    awards[entry.missionId] = coins;
    weeks[w] = (weeks[w] ?? 0) + coins;
    months[m] = (months[m] ?? 0) + coins;
  }
  return { weeks, months, awards, xp };
}

export function coinsThisWeek(rewards, today) {
  return rewards.weeks[weekKey(today)] ?? 0;
}

export function coinsThisMonth(rewards, today) {
  return rewards.months[monthKey(today)] ?? 0;
}

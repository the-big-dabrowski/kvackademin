import { h } from './dom.js';
import { getTodaysMissions } from '../core/missions.js';
import { getLog } from '../core/log.js';
import { computeRewards, coinsThisWeek, WEEK_CAP, formatKr } from '../core/rewards.js';
import { nextMission, missionHref } from './missions.js';

/**
 * Shared end of a mission: coins for completing it (never for correct answers)
 * and one primary next step: the next mission, or today's report.
 */
export async function missionDoneFooter(mission) {
  const [missions, log] = await Promise.all([getTodaysMissions(), getLog()]);
  const rewards = computeRewards(log);
  const coins = rewards.awards[mission.id] ?? 0;
  const week = coinsThisWeek(rewards, mission.today);
  const next = nextMission(missions);

  return [
    h('p', {}, coins > 0
      ? `Du fick ${formatKr(coins)} för att du gjorde klart uppdraget. Den här veckan: ${formatKr(week)} av ${formatKr(WEEK_CAP)}.`
      : `Coins-taket är nått för den här gången (${formatKr(week)} av ${formatKr(WEEK_CAP)} den här veckan). Bra jobbat ändå!`),
    next
      ? h('a', { class: 'button button--large', href: missionHref(next) }, `Nästa uppdrag: ${next.title}`)
      : h('a', { class: 'button button--large', href: '#/report' }, 'Till dagens rapport'),
    h('p', {}, h('a', { href: '#/' }, 'Tillbaka till Idag')),
  ];
}

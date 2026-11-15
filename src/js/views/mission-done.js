import { h } from './dom.js';
import { getTodaysMissions } from '../core/missions.js';
import { nextMission, missionHref } from './missions.js';

/** Shared end of a mission: one primary next step, the next mission or back to Idag. */
export async function missionDoneFooter() {
  const next = nextMission(await getTodaysMissions());
  return next
    ? [
      h('a', { class: 'button button--large', href: missionHref(next) }, `Nästa uppdrag: ${next.title}`),
      h('p', {}, h('a', { class: 'text-link', href: '#/' }, 'Tillbaka till Idag')),
    ]
    : [h('a', { class: 'button button--large', href: '#/' }, 'Tillbaka till Idag')];
}

import { h, icon, ICONS } from './dom.js';
import { getTodaysMissions, STATUS } from '../core/missions.js';

const STATUS_TEXT = {
  [STATUS.NEW]: 'Inte påbörjat',
  [STATUS.IN_PROGRESS]: 'Påbörjat, sparat',
  [STATUS.DONE]: 'Klart',
};

export function missionHref(mission) {
  return `#/missions/${encodeURIComponent(mission.id)}`;
}

/** First mission that is not done yet, or null. */
export function nextMission(missions) {
  return missions.find((m) => m.state.status !== STATUS.DONE) ?? null;
}

/** "Uppdrag" view: today's missions. The next unfinished one is the primary action. */
export const missionsView = {
  async render(container) {
    const section = h('section', { class: 'page panel', 'aria-labelledby': 'missions-title' },
      h('h1', { id: 'missions-title' }, 'Uppdrag'));
    container.append(section);

    let missions = [];
    try {
      missions = await getTodaysMissions();
    } catch (err) {
      console.error(err);
      section.append(h('p', {}, 'Uppdragen gick inte att ladda just nu. Prova igen om en stund.'));
      return { title: 'Uppdrag' };
    }

    if (missions.length === 0) {
      section.append(
        h('p', {}, 'Inga uppdrag idag. Bra jobbat, du är ledig!'),
        h('a', { class: 'button button--secondary', href: '#/' }, 'Tillbaka till Idag'),
      );
      return { title: 'Uppdrag' };
    }

    const next = nextMission(missions);
    section.append(
      h('p', {}, next ? 'Ta ett uppdrag i taget.' : 'Alla dagens uppdrag är klara. Snyggt jobbat!'),
      ...(next ? [] : [h('a', { class: 'button button--large', href: '#/report' }, 'Se dagens rapport')]),
      h('ul', { class: 'mission-list' }, missions.map((m) => {
        const done = m.state.status === STATUS.DONE;
        const isNext = m === next;
        const linkText = m.state.status === STATUS.IN_PROGRESS ? 'Fortsätt' : 'Börja';
        return h('li', { class: `mission-card${done ? ' mission-card--done' : ''}` },
          h('h2', { class: 'mission-card__title' }, m.title),
          h('p', { class: 'mission-card__meta' }, `${m.subject}. ${m.summary}. Ungefär ${m.estimatedMinutes} min.`),
          m.placeholder ? h('p', { class: 'mission-card__meta' }, 'Exempeldata.') : null,
          h('p', { class: 'mission-card__status' },
            done ? icon(ICONS.check, 'mission-card__status-icon') : null,
            `Status: ${STATUS_TEXT[m.state.status]}`),
          done ? null : h('a', {
            class: `button${isNext ? '' : ' button--secondary'}`,
            href: missionHref(m),
            'aria-label': `${linkText}: ${m.title}`,
          }, linkText),
        );
      })),
    );
    if (next && missions.some((m) => m.state.status === STATUS.DONE)) {
      section.append(h('p', {}, h('a', { class: 'text-link', href: '#/report' }, 'Se dagens rapport')));
    }
    return { title: 'Uppdrag' };
  },
};

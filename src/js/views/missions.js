import { h } from './dom.js';
import { getTodaysMissions } from '../core/missions.js';

/** Dagens uppdrag. Fylls med riktiga uppdrag när modulerna finns (fas 2). */
export const missionsView = {
  async render(container) {
    const section = h('section', { class: 'page panel', 'aria-labelledby': 'missions-title' },
      h('h1', { id: 'missions-title' }, 'Dagens uppdrag'));
    container.append(section);

    let missions = [];
    try {
      missions = await getTodaysMissions();
    } catch (err) {
      console.error(err);
      section.append(h('p', {}, 'Uppdragen gick inte att ladda just nu. Prova igen om en stund.'));
      return { title: 'Dagens uppdrag' };
    }

    if (missions.length === 0) {
      section.append(
        h('p', {}, 'Inga uppdrag idag. Bra jobbat – du är ledig!'),
        h('a', { class: 'button button--secondary', href: '#/' }, 'Tillbaka till start'),
      );
    }
    return { title: 'Dagens uppdrag' };
  },
};

import { h } from './dom.js';
import { getTodaysMissions } from '../core/missions.js';

/** Vyn "Uppdrag": dagens uppdrag. Fylls när modulerna finns (fas 2). */
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
        h('p', {}, 'Inga uppdrag idag. Bra jobbat – du är ledig!'),
        h('a', { class: 'button button--secondary', href: '#/' }, 'Tillbaka till Idag'),
      );
    }
    return { title: 'Uppdrag' };
  },
};

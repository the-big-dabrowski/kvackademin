import { h } from './dom.js';

/** Vyn "Förälder". Tom tills fas 4 (PIN, logg, coins, export och import). */
export const parentView = {
  render(container) {
    container.append(
      h('section', { class: 'page panel', 'aria-labelledby': 'parent-title' },
        h('h1', { id: 'parent-title' }, 'Förälder'),
        h('p', {}, 'Här kommer föräldraläget: logg per dag, coins per vecka och månad, samt export och import.'),
      ),
    );
    return { title: 'Förälder' };
  },
};

import { h } from './dom.js';

export const notFoundView = {
  render(container) {
    container.append(
      h('section', { class: 'page panel', 'aria-labelledby': 'nf-title' },
        h('h1', { id: 'nf-title' }, 'Sidan finns inte'),
        h('p', {}, 'Ingen fara! Vi går tillbaka till start.'),
        h('a', { class: 'button', href: '#/' }, 'Till start'),
      ),
    );
    return { title: 'Sidan finns inte' };
  },
};

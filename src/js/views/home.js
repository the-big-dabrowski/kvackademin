import { h, icon, ICONS } from './dom.js';
import { navigate } from '../core/router.js';

export const homeView = {
  render(container) {
    container.append(
      h('section', { class: 'home panel', 'aria-labelledby': 'home-title' },
        h('img', { class: 'home__mascot', src: 'img/logo.png', alt: '', width: '112', height: '112' }),
        h('h1', { id: 'home-title' }, 'Hej! Redo för dagens uppdrag?'),
        h('p', { class: 'home__lead' }, 'Vi börjar med något litet. Ett steg i taget.'),
        h('button', {
          type: 'button',
          class: 'button button--large',
          'data-js': 'start-missions',
          onclick: () => navigate('/uppdrag'),
        }, icon(ICONS.play), 'Starta dagens uppdrag'),
      ),
    );
    return { title: 'Start' };
  },
};

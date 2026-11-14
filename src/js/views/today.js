import { h, icon, ICONS } from './dom.js';
import { navigate } from '../core/router.js';

/** Vyn "Idag": startskärmen med en enda primär handling. */
export const todayView = {
  render(container) {
    container.append(
      h('section', { class: 'today panel', 'aria-labelledby': 'today-title' },
        h('h1', { id: 'today-title' }, 'Idag'),
        h('div', { class: 'today__greeting' },
          h('img', { class: 'today__mascot', src: 'img/logo.png', alt: '', width: '112', height: '112' }),
          h('p', { class: 'today__lead' },
            h('strong', {}, 'Kvackis: '),
            'Hej! Redo för dagens uppdrag? Vi börjar med något litet, ett steg i taget.'),
        ),
        h('button', {
          type: 'button',
          class: 'button button--large',
          'data-js': 'start-missions',
          onclick: () => navigate('/uppdrag'),
        }, icon(ICONS.play), 'Starta dagens uppdrag'),
      ),
    );
    return { title: 'Idag' };
  },
};

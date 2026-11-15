import { h, icon, ICONS } from './dom.js';
import { getTodaysMissions, STATUS } from '../core/missions.js';

// Leads to the missions page, where the child chooses which mission to start with.
function startButton() {
  return h('a', { class: 'button button--large', href: '#/missions', 'data-js': 'start-missions' },
    icon(ICONS.play), 'Starta dagens uppdrag');
}

/** "Idag" (today) view: the start screen with a single primary action. */
export const todayView = {
  async render(container) {
    let missions = [];
    try {
      missions = await getTodaysMissions();
    } catch {
      // Offline or data missing: the start button still works and shows a friendly message.
    }
    const allDone = missions.length > 0 && missions.every((m) => m.state.status === STATUS.DONE);

    container.append(
      h('section', { class: 'today panel', 'aria-labelledby': 'today-title' },
        h('h1', { id: 'today-title' }, 'Idag'),
        h('div', { class: 'today__greeting' },
          h('img', { class: 'today__mascot', src: 'img/logo.png', alt: '', width: '112', height: '112' }),
          h('p', { class: 'today__lead' },
            h('strong', {}, 'Kvackis: '),
            allDone
              ? 'Alla dagens uppdrag är klara. Vad bra jobbat!'
              : 'Hej! Redo för dagens uppdrag? Vi börjar med något litet, ett steg i taget.'),
        ),
        allDone ? null : startButton(),
      ),
    );
    return { title: 'Idag' };
  },
};

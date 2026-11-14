import { h, icon, ICONS } from './dom.js';
import { navigate } from '../core/router.js';
import { getTodaysMissions, STATUS } from '../core/missions.js';
import { nextMission } from './missions.js';

function reportLink() {
  return h('a', { class: 'button button--large', href: '#/report', 'data-js': 'open-report' }, 'Se dagens rapport');
}

function startButton() {
  return h('button', {
    type: 'button',
    class: 'button button--large',
    'data-js': 'start-missions',
    onclick: async () => {
      // Go straight to the first unfinished mission: the first step stays small.
      try {
        const next = nextMission(await getTodaysMissions());
        navigate(next ? `/missions/${encodeURIComponent(next.id)}` : '/missions');
      } catch {
        navigate('/missions');
      }
    },
  }, icon(ICONS.play), 'Starta dagens uppdrag');
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
        allDone ? reportLink() : startButton(),
      ),
    );
    return { title: 'Idag' };
  },
};

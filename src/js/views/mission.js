import { h } from './dom.js';
import { getTodaysMissions } from '../core/missions.js';
import { getModule } from '../core/registry.js';

/** Looks up one of today's missions and hands it to its module's view. */
export const missionView = {
  async render(container, { id }) {
    const mission = (await getTodaysMissions()).find((m) => m.id === id);
    const module = mission && getModule(mission.type);
    if (!module?.view) {
      container.append(
        h('section', { class: 'page panel', 'aria-labelledby': 'mission-missing-title' },
          h('h1', { id: 'mission-missing-title' }, 'Uppdraget finns inte idag'),
          h('p', {}, 'Det kan vara ett uppdrag från en annan dag. Ingen fara!'),
          h('a', { class: 'button', href: '#/missions' }, 'Se dagens uppdrag'),
        ),
      );
      return { title: 'Uppdraget finns inte idag' };
    }
    return module.view.render(container, { mission });
  },
};

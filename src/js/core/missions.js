import * as storage from './storage.js';
import { allModules, getModule } from './registry.js';
import { logEvent, EVENTS } from './log.js';
import { loadAll } from './data.js';
import { localDateISO } from '../lib/dates.js';

/**
 * Today's missions are computed from all registered modules.
 * Every mission has the same lifecycle: start → in progress → done.
 *
 * Mission: { id, type, title, firstStep, ...module-specific fields }
 */

export const STATUS = Object.freeze({ NEW: 'new', IN_PROGRESS: 'in-progress', DONE: 'done' });

const stateKey = (id) => `mission:${id}`;

export function todayISO(date = new Date()) {
  return localDateISO(date);
}

export async function getTodaysMissions(date = new Date()) {
  const ctx = { today: todayISO(date) };
  const files = await loadAll();
  const missions = [];
  for (const file of files) {
    const module = getModule(file.type);
    if (!module) continue;
    missions.push(...(await module.getMissions(file, ctx)));
  }
  const withState = await Promise.all(missions.map(async (m) => ({ ...m, state: await getState(m.id) })));
  return withState;
}

export async function getState(missionId) {
  return storage.get(stateKey(missionId), { status: STATUS.NEW, progress: null, updatedAt: null });
}

async function saveState(missionId, patch) {
  return storage.update(
    stateKey(missionId),
    (prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }),
    { status: STATUS.NEW, progress: null, updatedAt: null },
  );
}

export async function start(mission) {
  const state = await getState(mission.id);
  if (state.status === STATUS.NEW) {
    await logEvent({ missionId: mission.id, type: mission.type, event: EVENTS.START, meta: { title: mission.title } });
  }
  return saveState(mission.id, { status: STATUS.IN_PROGRESS });
}

/** Autosave after every answer. `progress` is the module's own resume state. */
export async function saveProgress(mission, progress, meta = {}) {
  await logEvent({ missionId: mission.id, type: mission.type, event: EVENTS.PROGRESS, meta });
  return saveState(mission.id, { status: STATUS.IN_PROGRESS, progress });
}

export async function complete(mission, meta = {}) {
  // The title is stored so reports still make sense after the data file changes.
  await logEvent({ missionId: mission.id, type: mission.type, event: EVENTS.DONE, meta: { title: mission.title, ...meta } });
  return saveState(mission.id, { status: STATUS.DONE });
}

export function registeredTypes() {
  return allModules().map((m) => m.type);
}

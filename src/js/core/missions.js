import * as storage from './storage.js';
import { allModules, getModule } from './registry.js';
import { logEvent, EVENTS } from './log.js';
import { loadAll } from './data.js';

/**
 * Dagens uppdrag räknas fram från alla moduler.
 * Livscykel för varje uppdrag: start → in progress → done.
 *
 * Mission: { id, type, title, firstStep, ... modulspecifika fält }
 */

export const STATUS = Object.freeze({ NEW: 'new', IN_PROGRESS: 'in-progress', DONE: 'done' });

const stateKey = (id) => `mission:${id}`;

export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    await logEvent({ missionId: mission.id, type: mission.type, event: EVENTS.START });
  }
  return saveState(mission.id, { status: STATUS.IN_PROGRESS });
}

/** Autosave efter varje svar. `progress` är modulens eget återupptagningsläge. */
export async function saveProgress(mission, progress, meta = {}) {
  await logEvent({ missionId: mission.id, type: mission.type, event: EVENTS.PROGRESS, meta });
  return saveState(mission.id, { status: STATUS.IN_PROGRESS, progress });
}

export async function complete(mission, meta = {}) {
  await logEvent({ missionId: mission.id, type: mission.type, event: EVENTS.DONE, meta });
  return saveState(mission.id, { status: STATUS.DONE });
}

export function registeredTypes() {
  return allModules().map((m) => m.type);
}

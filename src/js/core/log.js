import * as storage from './storage.js';

/**
 * Event log: one entry per lifecycle step.
 * { missionId, type, event, timestamp, meta }
 */

const KEY = 'log';
export const EVENTS = Object.freeze({ START: 'start', PROGRESS: 'progress', DONE: 'done' });

export async function logEvent({ missionId, type, event, meta = {} }) {
  if (!Object.values(EVENTS).includes(event)) throw new Error(`Unknown event "${event}"`);
  const entry = { missionId, type, event, timestamp: new Date().toISOString(), meta };
  await storage.update(KEY, (list) => [...list, entry], []);
  return entry;
}

export async function getLog() {
  return storage.get(KEY, []);
}

export async function getLogForMission(missionId) {
  return (await getLog()).filter((e) => e.missionId === missionId);
}

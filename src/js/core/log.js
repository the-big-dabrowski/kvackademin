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

const entryKey = (e) => `${e.timestamp}|${e.missionId}|${e.event}`;

/** Merge imported entries into the log, skipping duplicates. Returns how many were added. */
export async function importEntries(entries) {
  if (!Array.isArray(entries)) return 0;
  const valid = entries.filter((e) => e && e.missionId && e.event && e.timestamp);
  let added = 0;
  await storage.update(KEY, (list) => {
    const seen = new Set(list.map(entryKey));
    const fresh = valid.filter((e) => !seen.has(entryKey(e)));
    added = fresh.length;
    return [...list, ...fresh].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, []);
  return added;
}

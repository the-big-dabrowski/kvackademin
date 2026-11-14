/**
 * The only place in the app that touches localStorage.
 *
 * The API is async on purpose, even though localStorage is synchronous.
 * That way this file can be swapped for IndexedDB or Capacitor Preferences
 * without changing any other file.
 */

const PREFIX = 'kvackademin:';
const SCHEMA_VERSION = 1;

// In-memory fallback if localStorage is blocked (e.g. private browsing).
const memory = new Map();

function backend() {
  try {
    const probe = `${PREFIX}__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const ls = backend();

function readRaw(key) {
  return ls ? ls.getItem(PREFIX + key) : memory.get(key) ?? null;
}

function writeRaw(key, value) {
  if (ls) ls.setItem(PREFIX + key, value);
  else memory.set(key, value);
}

function removeRaw(key) {
  if (ls) ls.removeItem(PREFIX + key);
  else memory.delete(key);
}

function allKeys() {
  if (!ls) return [...memory.keys()];
  const keys = [];
  for (let i = 0; i < ls.length; i += 1) {
    const k = ls.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
  }
  return keys;
}

export async function get(key, fallback = null) {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function set(key, value) {
  writeRaw(key, JSON.stringify(value));
  return value;
}

/** Read, modify and write in one step. `fn` receives the current value and returns the new one. */
export async function update(key, fn, fallback = null) {
  const next = fn(await get(key, fallback));
  return set(key, next);
}

export async function remove(key) {
  removeRaw(key);
}

export async function keys(prefix = '') {
  return allKeys().filter((k) => k.startsWith(prefix));
}

/** Ask the browser not to evict our data automatically. */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** All app data as one object, for export in parent mode. */
export async function exportAll() {
  const data = {};
  for (const k of allKeys()) data[k] = await get(k);
  return { app: 'kvackademin', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

/** Restore from an export. Existing keys with the same name are overwritten. */
export async function importAll(payload) {
  if (!payload || payload.app !== 'kvackademin' || typeof payload.data !== 'object') {
    throw new Error('invalid-export');
  }
  for (const [k, v] of Object.entries(payload.data)) await set(k, v);
}

export const isPersistentBackend = Boolean(ls);

/**
 * Enda stället i appen som rör localStorage.
 *
 * API:t är asynkront med flit, trots att localStorage är synkront.
 * Då kan den här filen bytas mot IndexedDB eller Capacitor Preferences
 * utan att någon annan fil behöver ändras.
 */

const PREFIX = 'kvackademin:';
const SCHEMA_VERSION = 1;

// Fallback i minnet om localStorage är blockerat (t.ex. privat läge).
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

/** Läs, ändra och skriv i ett steg. `fn` får nuvarande värde och returnerar nytt. */
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

/** Be webbläsaren att inte rensa vår data automatiskt. */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** All appdata som ett objekt, för export i föräldraläget. */
export async function exportAll() {
  const data = {};
  for (const k of allKeys()) data[k] = await get(k);
  return { app: 'kvackademin', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

/** Återställ från en export. Befintliga nycklar med samma namn skrivs över. */
export async function importAll(payload) {
  if (!payload || payload.app !== 'kvackademin' || typeof payload.data !== 'object') {
    throw new Error('invalid-export');
  }
  for (const [k, v] of Object.entries(payload.data)) await set(k, v);
}

export const isPersistentBackend = Boolean(ls);

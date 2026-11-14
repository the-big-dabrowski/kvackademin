import * as storage from './storage.js';

/** App settings, editable in parent mode. */

const KEY = 'settings';
const DEFAULTS = Object.freeze({ reportRecipient: 'pappa', pin: null });

export async function getSettings() {
  return { ...DEFAULTS, ...(await storage.get(KEY, {})) };
}

export async function updateSettings(patch) {
  return storage.update(KEY, (prev) => ({ ...DEFAULTS, ...prev, ...patch }), {});
}

/**
 * Parent PIN. This is a light gate on a family device, not real security:
 * anyone who clears the site data also clears the PIN.
 * Only a salted hash is stored, never the PIN itself.
 */

const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

export function newSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

/** FNV-1a fallback for when SubtleCrypto is missing (plain http on a local network). */
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export async function hashPin(pin, salt) {
  const input = `${salt}:${pin}`;
  if (!crypto.subtle) return `fnv:${fnv1a(input)}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return `sha256:${toHex(new Uint8Array(digest))}`;
}

export async function createPin(pin) {
  const salt = newSalt();
  return { salt, hash: await hashPin(pin, salt) };
}

export async function checkPin(pin, stored) {
  if (!stored) return false;
  return (await hashPin(pin, stored.salt)) === stored.hash;
}

export function isValidPin(pin) {
  return /^\d{4,8}$/.test(pin);
}

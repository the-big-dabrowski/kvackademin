/**
 * Sharing the daily report. Nothing leaves the device unless the user presses a button.
 */

export function canShare() {
  return typeof navigator.share === 'function';
}

/** Returns "shared", "cancelled" or "failed". */
export async function shareText({ title, text }) {
  try {
    await navigator.share({ title, text });
    return 'shared';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/** Copy to the clipboard, with a fallback for older Safari. Returns true on success. */
export async function copyText(text, fallbackField) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!fallbackField) return false;
    fallbackField.focus();
    fallbackField.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

import { h, icon, ICONS } from './dom.js';

export const PAUSE_ANNOUNCEMENT = 'Kvackis: Du har hållit på i 20 minuter. Vill du ta en paus?';

/** Friendly pause suggestion after 20 minutes. Never forces a pause. */
export function pauseNotice({ onPause, onContinue }) {
  return h('div', { class: 'notice notice--pause' },
    h('p', {}, 'Du har hållit på i 20 minuter. Det är helt okej att ta en paus nu. Det du har gjort är sparat.'),
    h('div', { class: 'session__actions' },
      h('button', { type: 'button', class: 'button button--secondary', onclick: onPause }, icon(ICONS.pause), 'Ta en paus'),
      h('button', { type: 'button', class: 'button button--secondary', onclick: onContinue }, 'Fortsätt'),
    ),
  );
}

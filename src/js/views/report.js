import { h, icon, ICONS, announce } from './dom.js';
import { buildDailyReport } from '../core/report.js';
import { getSettings } from '../core/settings.js';
import { canShare, shareText, copyText } from '../lib/share.js';

/** "Dagens rapport": today's completed missions and a button to share them. */
export const reportView = {
  async render(container) {
    const [report, settings] = await Promise.all([buildDailyReport(), getSettings()]);
    const status = h('p', { class: 'feedback', 'aria-live': 'polite' });
    const section = h('section', { class: 'page panel', 'aria-labelledby': 'report-title' },
      h('h1', { id: 'report-title' }, 'Dagens rapport'));
    container.append(section);

    if (report.lines.length === 0) {
      section.append(
        h('p', {}, 'Inga uppdrag är klara än idag. Det gör inget!'),
        h('a', { class: 'button', href: '#/' }, 'Tillbaka till Idag'),
      );
      return { title: 'Dagens rapport' };
    }

    const textField = h('textarea', { class: 'field__input report__text', id: 'report-text', readonly: true, rows: String(report.text.split('\n').length + 3) });
    textField.value = report.text;

    const shareButton = canShare()
      ? h('button', {
        type: 'button',
        class: 'button button--large',
        'data-js': 'share-report',
        onclick: async () => {
          const result = await shareText({ title: 'Kvackademin', text: report.text });
          if (result === 'shared') announce(status, 'Kvackis: Skickat! Bra jobbat idag.');
          else if (result === 'failed') announce(status, 'Det gick inte att dela. Tryck på "Kopiera text" i stället.');
        },
      }, icon(ICONS.share), `Skicka till ${settings.reportRecipient}`)
      : null;

    const copyButton = h('button', {
      type: 'button',
      class: shareButton ? 'button button--secondary' : 'button button--large',
      'data-js': 'copy-report',
      onclick: async () => {
        const ok = await copyText(report.text, textField);
        announce(status, ok
          ? `Texten är kopierad. Klistra in den i ett meddelande till ${settings.reportRecipient}.`
          : 'Det gick inte att kopiera. Markera texten i rutan och kopiera den själv.');
      },
    }, icon(ICONS.copy), 'Kopiera text');

    section.append(...[
      h('p', {}, h('strong', {}, 'Kvackis: '), 'Snyggt jobbat idag! Här är det du har gjort.'),
      h('ul', { class: 'report__list' }, report.lines.map((line) => h('li', {}, line))),
      h('p', {}, `Coins den här veckan: ${report.weekText}.`),
      status,
      shareButton,
      copyButton,
      h('div', { class: 'field' },
        h('label', { class: 'field__label', for: 'report-text' }, 'Text som skickas'),
        textField),
      h('p', {}, h('a', { class: 'text-link', href: '#/' }, 'Tillbaka till Idag')),
    ].filter(Boolean));
    return { title: 'Dagens rapport' };
  },
};

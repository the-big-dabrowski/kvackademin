import { h, icon, ICONS, announce } from './dom.js';
import * as storage from '../core/storage.js';
import { getLog, importEntries } from '../core/log.js';
import { getSettings, updateSettings } from '../core/settings.js';
import {
  computeRewards, coinsThisWeek, coinsThisMonth, formatKr, WEEK_CAP, MONTH_CAP, COINS_PER_MISSION,
} from '../core/rewards.js';
import { describeDone } from '../core/report.js';
import { createPin, checkPin, isValidPin } from '../lib/pin.js';
import { localDateISO, formatDay, formatWeek, formatMonth } from '../lib/dates.js';
import { numberField, textField } from './form.js';

const DAYS_IN_LOG = 30;
const WEEKS_SHOWN = 8;

// Unlocked only in memory, and only while the view is open:
// leaving the view, reloading or pressing "Lås" locks it again.
let unlocked = false;

/** "Förälder" view: PIN-protected log, coins, report settings, export and import. */
export const parentView = {
  async render(container) {
    const section = h('section', { class: 'page panel', 'aria-labelledby': 'parent-title' },
      h('h1', { id: 'parent-title' }, 'Förälder'));
    const body = h('div', { class: 'parent' });
    section.append(body);
    container.append(section);

    async function refresh(focusHeading = false) {
      const settings = await getSettings();
      let heading;
      if (!settings.pin) heading = renderSetup();
      else if (!unlocked) heading = renderUnlock(settings);
      else heading = await renderDashboard(settings);
      if (focusHeading) heading?.focus();
    }

    // ---- Create PIN -----------------------------------------------------
    function renderSetup() {
      const pin = numberField({ id: 'new-pin', label: 'Välj en PIN-kod', hint: '4 till 8 siffror. Du kan klistra in den.', type: 'password', autocomplete: 'new-password' });
      const repeat = numberField({ id: 'repeat-pin', label: 'Skriv PIN-koden igen', type: 'password', autocomplete: 'new-password' });
      const form = h('form', { class: 'session__form', novalidate: true }, pin.el, repeat.el,
        h('button', { type: 'submit', class: 'button button--large' }, icon(ICONS.lock), 'Spara PIN-kod'));
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        repeat.setError(null);
        if (!isValidPin(pin.value())) return pin.setError('PIN-koden ska vara 4 till 8 siffror.');
        pin.setError(null);
        if (pin.value() !== repeat.value()) return repeat.setError('PIN-koderna är inte likadana. Skriv samma kod två gånger.');
        await updateSettings({ pin: await createPin(pin.value()) });
        unlocked = true;
        refresh(true);
      });
      const heading = h('h2', { tabindex: '-1' }, 'Skapa en PIN-kod');
      body.replaceChildren(heading,
        h('p', {}, 'Föräldraläget skyddas med en PIN-kod. Den sparas bara på den här enheten.'),
        form);
      return heading;
    }

    // ---- Unlock -------------------------------------------------------
    function renderUnlock(settings) {
      const pin = numberField({ id: 'pin', label: 'PIN-kod', hint: 'Du kan klistra in den.', type: 'password', autocomplete: 'current-password' });
      const form = h('form', { class: 'session__form', novalidate: true }, pin.el,
        h('button', { type: 'submit', class: 'button button--large' }, 'Lås upp'));
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!(await checkPin(pin.value(), settings.pin))) {
          return pin.setError('Det var inte rätt PIN-kod. Försök igen.');
        }
        unlocked = true;
        refresh(true);
      });
      const heading = h('h2', { tabindex: '-1' }, 'Lås upp föräldraläget');
      body.replaceChildren(heading, form,
        h('details', { class: 'parent__help' },
          h('summary', {}, 'Glömt PIN-koden?'),
          h('p', {}, 'PIN-koden kan inte återställas i appen. Du kan ta bort webbplatsdata för sidan i Safaris inställningar, men då försvinner också loggen och allt som är sparat.')));
      return heading;
    }

    // ---- Dashboard ----------------------------------------------------
    async function renderDashboard(settings) {
      const log = await getLog();
      const today = localDateISO();
      const rewards = computeRewards(log);
      const status = h('p', { class: 'feedback', 'aria-live': 'polite' });
      const heading = h('h2', { tabindex: '-1' }, 'Coins och XP');

      body.replaceChildren(
        status,
        heading,
        h('ul', { class: 'parent__stats' },
          h('li', {}, `Den här veckan: ${formatKr(coinsThisWeek(rewards, today))} av ${formatKr(WEEK_CAP)}`),
          h('li', {}, `Den här månaden: ${formatKr(coinsThisMonth(rewards, today))} av ${formatKr(MONTH_CAP)}`),
          h('li', {}, `XP totalt: ${rewards.xp}`)),
        h('p', { class: 'field__hint' }, `Coins ges för genomförda uppdrag, aldrig för antal rätt: ${formatKr(COINS_PER_MISSION)} per uppdrag. Beloppet är räknat så att alla uppdrag varje dag (3 per dag) ger ungefär ${formatKr(MONTH_CAP)} i månaden. XP ges för varje steg och uppdrag.`),
        coinsTable('Coins per vecka', 'Vecka', Object.entries(rewards.weeks).slice(-WEEKS_SHOWN).reverse(), formatWeek, WEEK_CAP),
        coinsTable('Coins per månad', 'Månad', Object.entries(rewards.months).reverse(), formatMonth, MONTH_CAP),
        h('h2', {}, 'Logg per dag'),
        dayLog(log, rewards),
        h('h2', {}, 'Rapport'),
        recipientForm(settings, status),
        h('h2', {}, 'Export och import'),
        exportBlock(today, status),
        importForm(status),
        h('h2', {}, 'Lås'),
        h('button', { type: 'button', class: 'button button--secondary', onclick: () => { unlocked = false; refresh(true); } },
          icon(ICONS.lock), 'Lås föräldraläget'),
      );
      return heading;
    }

    function coinsTable(caption, label, rows, format, cap) {
      if (rows.length === 0) return h('p', {}, `${caption}: inga coins än.`);
      return h('table', { class: 'data-table' },
        h('caption', { class: 'data-table__caption' }, caption),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, label), h('th', { scope: 'col' }, 'Coins'))),
        h('tbody', {}, rows.map(([key, coins]) => h('tr', {},
          h('th', { scope: 'row' }, format(key)),
          h('td', {}, `${formatKr(coins)} av ${formatKr(cap)}${coins >= cap ? ' (taket nått)' : ''}`)))));
    }

    function dayLog(log, rewards) {
      const byDay = new Map();
      for (const entry of log) {
        const day = localDateISO(entry.timestamp);
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day).push(entry);
      }
      const days = [...byDay.keys()].sort().reverse().slice(0, DAYS_IN_LOG);
      if (days.length === 0) return h('p', {}, 'Ingenting i loggen än.');

      return h('div', { class: 'day-log' }, days.map((day) => {
        const entries = byDay.get(day);
        const done = entries.filter((e) => e.event === 'done');
        const doneIds = new Set(done.map((e) => e.missionId));
        const started = entries.filter((e) => e.event === 'start' && !doneIds.has(e.missionId));
        return h('section', { class: 'day-log__day', 'aria-labelledby': `day-${day}` },
          h('h3', { class: 'day-log__title', id: `day-${day}` }, formatDay(day)),
          h('ul', { class: 'day-log__list' },
            done.map((e) => h('li', {},
              h('span', {}, `Klart: ${describeDone(e)}`),
              e.meta?.minutes ? h('span', {}, ` (${e.meta.minutes} min)`) : null,
              rewards.awards[e.missionId] ? h('span', {}, `, ${formatKr(rewards.awards[e.missionId])}`) : null,
              answersList(e.meta?.answers))),
            started.map((e) => h('li', {}, `Påbörjat: ${e.meta?.title ?? 'Uppdrag'}`))));
      }));
    }

    function answersList(answers) {
      if (!Array.isArray(answers) || answers.length === 0) return null;
      return h('dl', { class: 'day-log__answers' }, answers.flatMap((a) => [
        h('dt', {}, a.question),
        h('dd', {}, a.answer || '(inget svar)'),
      ]));
    }

    function recipientForm(settings, status) {
      const field = textField({ id: 'report-recipient', label: 'Vem får rapporten?', value: settings.reportRecipient });
      const hint = h('p', { class: 'field__hint' }, `Knappen på rapporten heter "Skicka till ${settings.reportRecipient}".`);
      const form = h('form', { class: 'session__form', novalidate: true }, field.el, hint,
        h('button', { type: 'submit', class: 'button button--secondary' }, 'Spara'));
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = field.input.value.trim() || 'pappa';
        await updateSettings({ reportRecipient: name });
        hint.textContent = `Knappen på rapporten heter "Skicka till ${name}".`;
        announce(status, `Sparat. Knappen heter nu "Skicka till ${name}".`);
      });
      return form;
    }

    function exportBlock(today, status) {
      return h('div', { class: 'session__form' },
        h('p', {}, 'Spara en kopia av loggen och allt annat som är sparat som en JSON-fil.'),
        h('button', {
          type: 'button',
          class: 'button button--secondary',
          'data-js': 'export',
          onclick: async () => {
            const payload = await storage.exportAll();
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = h('a', { href: url, download: `kvackademin-${today}.json` });
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            announce(status, 'Exporten är klar.');
          },
        }, icon(ICONS.download), 'Exportera logg (JSON)'));
    }

    function importForm(status) {
      const input = h('input', { class: 'field__input', id: 'import-file', type: 'file', accept: 'application/json,.json' });
      const form = h('form', { class: 'session__form', novalidate: true },
        h('div', { class: 'field' },
          h('label', { class: 'field__label', for: 'import-file' }, 'Importera från fil'),
          h('p', { class: 'field__hint', id: 'import-hint' }, 'Loggen slås ihop med den som finns. Övrig sparad data ersätts. PIN-koden och inställningarna ändras inte.'),
          input),
        h('button', { type: 'submit', class: 'button button--secondary' }, 'Importera'));
      input.setAttribute('aria-describedby', 'import-hint');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const file = input.files?.[0];
        if (!file) return announce(status, 'Välj en fil först.');
        try {
          const payload = JSON.parse(await file.text());
          const { log = [], settings: _ignored, ...rest } = payload.data ?? {};
          await storage.importAll({ ...payload, data: rest });
          const added = await importEntries(log);
          await refresh(false);
          const fresh = body.querySelector('.feedback');
          announce(fresh, `Importen är klar. ${added} nya händelser lades till i loggen.`);
        } catch {
          announce(status, 'Filen gick inte att läsa. Välj en fil som har exporterats från Kvackademin.');
        }
      });
      return form;
    }

    await refresh(false);
    return { title: 'Förälder', cleanup: () => { unlocked = false; } };
  },
};

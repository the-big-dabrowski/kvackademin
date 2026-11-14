import { h, icon, ICONS, announce } from './dom.js';
import { navigate } from '../core/router.js';
import * as missions from '../core/missions.js';
import { createClock, elapsedText, PAUSE_SUGGESTION_MS } from '../lib/clock.js';
import { pauseNotice, PAUSE_ANNOUNCEMENT } from './pause-notice.js';
import { numberField, parsePage, textArea, choiceGroup } from './form.js';
import { missionDoneFooter } from './mission-done.js';

/**
 * View that runs one reading mission:
 * where are you → today's pages and mode → reading → which page did you reach
 * → questions or tell an adult → done.
 * Every step is saved so the session can be resumed.
 *
 * `api` comes from the reading module.
 */
export function createReadingSessionView(api) {
  return {
    async render(container, { mission }) {
      const { book, today } = mission;
      const end = api.lastPageOfBook(book);
      let bookState = await api.loadBookState(book);
      const saved = await missions.getState(mission.id);
      let progress = saved.progress ?? null;
      let clock = null;
      let leaving = false;

      const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
      const pauseBox = h('div', { class: 'session__pause' });
      const stage = h('div', { class: 'session__stage' });
      const timerText = h('p', { class: 'session__timer' });

      container.append(
        h('section', { class: 'session panel', 'aria-labelledby': 'session-title' },
          h('h1', { id: 'session-title' }, book.title),
          h('p', { class: 'session__meta' }, `${book.subject}. Läsning.`),
          pauseBox,
          feedback,
          stage,
        ),
      );

      // ---- Helpers --------------------------------------------------------
      function show(heading, ...children) {
        const h2 = h('h2', { tabindex: '-1' }, heading);
        stage.replaceChildren(h2, ...children);
        return h2;
      }

      async function save(patch, meta) {
        progress = { ...progress, ...patch };
        await missions.saveProgress(mission, progress, meta);
      }

      function statusParagraph(status) {
        if (status.phase === 'after') {
          return h('p', { class: 'notice' }, icon(ICONS.info, 'notice__icon'),
            h('span', { class: 'notice__text' }, `Läsplanen är slut, och det är ${end - status.lastPage} sidor kvar av boken. Du läser vidare i din takt.`));
        }
        if (status.behindPages > 0) {
          return h('p', { class: 'notice' }, icon(ICONS.info, 'notice__icon'),
            h('span', { class: 'notice__text' }, `Planen för vecka ${status.week} börjar på sidan ${status.entry.from}. Du ligger ${status.behindPages} sidor efter planen. Det gör inget, vi tar det i din takt.`));
        }
        if (status.weekDone) {
          return h('p', {}, `Du har redan läst veckans sidor. Snyggt! Vill du läsa lite till idag?`);
        }
        return h('p', {}, `Veckans sidor (vecka ${status.week}): ${api.pagesText(status.entry)}. Du följer planen.`);
      }

      // ---- Clock --------------------------------------------------------
      function renderClock() {
        timerText.textContent = elapsedText(clock.elapsed(), 'läst');
        if (!progress.pauseOffered && clock.elapsed() >= PAUSE_SUGGESTION_MS) {
          progress.pauseOffered = true;
          announce(feedback, PAUSE_ANNOUNCEMENT);
          pauseBox.replaceChildren(pauseNotice({ onPause: pause, onContinue: () => pauseBox.replaceChildren() }));
        }
      }

      function startClock() {
        clock ??= createClock({ initialMs: progress.elapsedMs ?? 0, onTick: renderClock });
        clock.start();
        renderClock();
      }

      function stopClock() {
        if (clock?.isRunning()) progress.elapsedMs = clock.stop();
      }

      async function pause() {
        leaving = true;
        stopClock();
        if (progress) await save({}, { action: 'pause' });
        navigate('/');
      }

      // ---- Step 1: where are you? -----------------------------------------
      function stepWhere() {
        const field = numberField({
          id: 'last-page',
          label: 'Vilken sida har du läst till?',
          hint: `Skriv 0 om du inte har börjat. Boken har ${end} sidor.`,
          value: bookState.lastPage,
        });
        const form = h('form', { class: 'session__form', novalidate: true }, field.el,
          h('button', { type: 'submit', class: 'button button--large' }, 'Fortsätt'));
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const result = parsePage(field.value(), 0, end);
          if (result.error) return field.setError(result.error);
          field.setError(null);
          bookState = await api.saveLastPage(book, result.page);
          stepPlan().focus();
        });
        return show('Var är du i boken?', form, h('p', {}, h('a', { class: 'text-link', href: '#/missions' }, 'Tillbaka till uppdragen')));
      }

      // ---- Step 2: today's pages and reading mode --------------------------
      function stepPlan() {
        const status = api.readingStatus(book, bookState.lastPage, today);
        if (status.phase === 'finished') return stepBookFinished();
        const { suggestion } = status;
        const modes = choiceGroup({ name: 'reading-mode', legend: 'Hur läser du idag?', options: api.modes, value: 'self' });
        const form = h('form', { class: 'session__form', novalidate: true },
          modes.el,
          h('button', { type: 'submit', class: 'button button--large' }, icon(ICONS.play), 'Börja läsa'),
        );
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          progress = { step: 'reading', from: suggestion.from, to: suggestion.to, mode: modes.value() ?? 'self', elapsedMs: 0, pauseOffered: false };
          await missions.start(mission);
          await save({}, { step: 'reading', mode: progress.mode, from: suggestion.from, to: suggestion.to });
          stepReading().focus();
        });
        return show('Dagens läsning',
          h('p', { class: 'session__highlight' }, `Förslag idag: ${api.pagesText(suggestion)}.`),
          statusParagraph(status),
          h('p', {}, 'Alla sätt att läsa räknas lika mycket.'),
          form,
          h('p', {}, h('button', { type: 'button', class: 'button button--secondary button--small', onclick: () => stepWhere().focus() }, 'Ändra sida')),
        );
      }

      // ---- Step 3: reading ----------------------------------------------
      function stepReading() {
        startClock();
        const heading = show('Nu läser du',
          h('p', { class: 'session__highlight' }, `Börja med sidan ${progress.from}. Bara en sida räcker för att komma igång.`),
          h('p', {}, `Dagens förslag: ${api.pagesText(progress)}. Läs i din egen takt.`),
          timerText,
          h('button', { type: 'button', class: 'button button--large', onclick: () => stepReachedPage().focus() }, 'Jag har läst klart för idag'),
          h('button', { type: 'button', class: 'button button--secondary button--small', onclick: pause }, icon(ICONS.pause), 'Pausa och spara'),
        );
        return heading;
      }

      // ---- Step 4: which page did you reach? -------------------------------
      function stepReachedPage() {
        const min = progress.from - 1;
        const field = numberField({
          id: 'read-to',
          label: 'Vilken sida läste du till?',
          hint: `Det gör inget om det blev fler eller färre sidor än förslaget (${api.pagesText(progress)}).`,
          value: progress.readTo ?? progress.to,
        });
        const form = h('form', { class: 'session__form', novalidate: true }, field.el,
          h('button', { type: 'submit', class: 'button button--large' }, 'Spara sidan'));
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const result = parsePage(field.value(), min, end);
          if (result.error) return field.setError(result.error);
          field.setError(null);
          stopClock();
          bookState = await api.saveLastPage(book, result.page);
          await save({ step: 'reflect', readTo: result.page }, { step: 'reflect', readTo: result.page });
          announce(feedback, 'Kvackis: Bra läst! Sidan är sparad.');
          stepReflect().focus();
        });
        return show('Var kom du?', form);
      }

      // ---- Step 5: questions or tell an adult ------------------------------
      function stepReflect() {
        return show('Efter läsningen',
          h('p', {}, 'Välj ett sätt att tänka tillbaka på det du läste. Båda är lika bra.'),
          h('div', { class: 'session__actions' },
            h('button', { type: 'button', class: 'button', onclick: () => chooseReflection('questions') }, 'Svara på frågor'),
            h('button', { type: 'button', class: 'button', onclick: () => chooseReflection('oral') }, 'Berätta muntligt för en vuxen'),
          ),
        );
      }

      async function chooseReflection(kind) {
        await save({ step: kind }, { step: kind });
        (kind === 'questions' ? stepQuestions() : stepOral()).focus();
      }

      function stepQuestions() {
        const questions = (book.questions ?? []).slice(0, api.maxQuestions);
        const fields = questions.map((q, i) => textArea({ id: `answer-${i}`, label: q, value: progress.answers?.[i] ?? '' }));
        const form = h('form', { class: 'session__form', novalidate: true },
          h('p', { class: 'field__hint' }, 'Svara kort. Ett ord eller en mening räcker. Det finns inga fel svar.'),
          fields.map((f) => f.el),
          h('button', { type: 'submit', class: 'button button--large' }, 'Klar'),
        );
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          progress.answers = fields.map((f) => f.input.value.trim());
          // Stored with the questions so parent mode can show them later.
          const answers = questions.map((question, i) => ({ question, answer: progress.answers[i] }));
          await finish({ reflection: 'questions', answers });
        });
        return show('Tänk tillbaka', form,
          h('p', {}, h('button', { type: 'button', class: 'button button--secondary button--small', onclick: () => chooseReflection('oral') }, 'Berätta för en vuxen i stället')));
      }

      function stepOral() {
        return show('Berätta för en vuxen',
          h('p', {}, 'Berätta vad du läste. Du kan ta hjälp av frågorna:'),
          h('ul', { class: 'session__list' }, (book.questions ?? []).slice(0, api.maxQuestions).map((q) => h('li', {}, q))),
          h('button', { type: 'button', class: 'button button--large', onclick: () => finish({ reflection: 'oral' }) }, icon(ICONS.check), 'Vi har pratat'),
          h('p', {}, h('button', { type: 'button', class: 'button button--secondary button--small', onclick: () => chooseReflection('questions') }, 'Svara på frågor i stället')),
        );
      }

      // ---- Done ----------------------------------------------------------
      async function finish({ reflection, answers }) {
        const pages = Math.max(0, progress.readTo - progress.from + 1);
        await missions.complete(mission, {
          from: progress.from, to: progress.readTo, pages, mode: progress.mode, reflection,
          answers: answers ?? null, minutes: Math.round((progress.elapsedMs ?? 0) / 60000),
        });
        (await stepDone(pages)).focus();
      }

      async function stepDone(pages) {
        pauseBox.replaceChildren();
        return show('Klart för idag!',
          h('p', {}, h('strong', {}, 'Kvackis: '), pages > 0
            ? `Bra läst! Du läste ${api.pagesText({ from: progress.from, to: progress.readTo })} idag.`
            : 'Bra att du satte dig med boken idag. Det räknas också!'),
          ...(await missionDoneFooter(mission)),
        );
      }

      function stepBookFinished() {
        return show('Boken är utläst!',
          h('p', {}, h('strong', {}, 'Kvackis: '), 'Wow, du har läst hela boken! Det finns inget mer att läsa i den.'),
          h('a', { class: 'button button--large', href: '#/' }, 'Tillbaka till Idag'),
        );
      }

      // ---- Start / resume -----------------------------------------------
      if (saved.status === missions.STATUS.DONE) {
        show('Klart för idag!',
          h('p', {}, h('strong', {}, 'Kvackis: '), 'Läsningen är redan klar för idag. Bra jobbat!'),
          ...(await missionDoneFooter(mission)));
      } else if (progress?.step === 'reading') {
        show('Välkommen tillbaka!',
          h('p', {}, `Idag läser du ${api.pagesText(progress)}. Allt är sparat.`),
          h('button', { type: 'button', class: 'button button--large', onclick: () => stepReading().focus() }, icon(ICONS.play), 'Fortsätt läsa'),
          h('button', { type: 'button', class: 'button button--secondary', onclick: () => stepReachedPage().focus() }, 'Jag har redan läst klart'),
        );
      } else if (progress?.step === 'reflect') {
        stepReflect();
      } else if (progress?.step === 'questions') {
        stepQuestions();
      } else if (progress?.step === 'oral') {
        stepOral();
      } else {
        stepWhere();
      }

      return {
        title: book.title,
        cleanup() {
          if (leaving || !clock?.isRunning()) return;
          stopClock();
          missions.saveProgress(mission, progress, { action: 'leave' });
        },
      };
    },
  };
}

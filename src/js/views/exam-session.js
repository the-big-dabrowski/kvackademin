import { h, icon, ICONS, announce } from './dom.js';
import { navigate } from '../core/router.js';
import * as missions from '../core/missions.js';
import * as fc from '../engines/flashcards.js';
import { isSpeechSupported, speak, stopSpeaking } from '../lib/speech.js';
import { createClock, elapsedText, PAUSE_SUGGESTION_MS } from '../lib/clock.js';
import { pauseNotice, PAUSE_ANNOUNCEMENT } from './pause-notice.js';
import { ANSWER_MODES, checkTyped, buildChoices } from '../lib/answers.js';

const PRAISE = [
  'Bra jobbat!',
  'Snyggt! Du kämpar på bra.',
  'Kvack! Det där satt.',
  'Vad bra att du övar!',
];
const NOT_YET_RETRY = 'Ingen fara! Det kortet kommer tillbaka lite senare, så får du försöka igen.';
const NOT_YET_LATER = 'Ingen fara! Vi övar mer på det kortet en annan dag.';
/** Kvackis at the end of a session. Picked at random, so it varies. */
const DONE_CHEERS = ['Bra jobbat!', 'Kvack-taktiskt!', 'Kvack ska du ha!'];

/**
 * View that runs one exam mission: intro → one card at a time → done.
 * Progress is saved after every answer so an interrupted session can be resumed.
 *
 * `api` comes from the exam module: { loadDeck, saveDeck, planSession, daysUntil, daysLeftText, minutesFor }.
 */
export function createExamSessionView(api) {
  return {
    async render(container, { mission }) {
      const { exam, today } = mission;
      let deck = await api.loadDeck(exam);
      const saved = await missions.getState(mission.id);
      let progress = saved.progress ?? null; // { session, elapsedMs, pauseOffered }
      let clock = null;
      let leaving = false;
      let praiseIndex = 0;

      // A card may override the side labels, e.g. "Begrepp" instead of "Fråga".
      const sideInfo = (card, key) => ({ ...exam[key], label: card[`${key}Label`] ?? exam[key].label });
      const sides = (direction, card) => (direction === 'forward'
        ? { prompt: sideInfo(card, 'front'), answer: sideInfo(card, 'back'), promptKey: 'front', answerKey: 'back' }
        : { prompt: sideInfo(card, 'back'), answer: sideInfo(card, 'front'), promptKey: 'back', answerKey: 'front' });

      // ---- Static frame -------------------------------------------------
      const feedback = h('p', { class: 'feedback', 'aria-live': 'polite', 'data-js': 'feedback' });
      const stage = h('div', { class: 'session__stage', 'data-js': 'stage' });
      const timerText = h('p', { class: 'session__timer', 'data-js': 'timer' });
      const pauseBox = h('div', { class: 'session__pause', 'data-js': 'pause-box' });

      container.append(
        h('section', { class: 'session panel', 'aria-labelledby': 'session-title' },
          h('h1', { id: 'session-title' }, exam.title),
          h('p', { class: 'session__meta' },
            `${exam.subject}. ${api.daysLeftText(api.daysUntil(today, exam.examDate))}.`),
          mission.placeholder
            ? h('p', { class: 'notice' }, icon(ICONS.info, 'notice__icon'),
              h('span', { class: 'notice__text' }, 'Det här är exempelbegrepp. En vuxen behöver fylla i de riktiga från skolan.'))
            : null,
          pauseBox,
          feedback,
          stage,
        ),
      );

      // ---- Clock (counts up, never down) ---------------------------------
      function renderClock() {
        timerText.textContent = elapsedText(clock.elapsed());
        if (!progress.pauseOffered && clock.elapsed() >= PAUSE_SUGGESTION_MS) offerPause();
      }

      function startClock() {
        clock ??= createClock({ initialMs: progress.elapsedMs ?? 0, onTick: renderClock });
        clock.start();
      }

      function stopClock() {
        if (clock?.isRunning()) progress.elapsedMs = clock.stop();
      }

      function offerPause() {
        progress.pauseOffered = true;
        announce(feedback, PAUSE_ANNOUNCEMENT);
        pauseBox.replaceChildren(pauseNotice({ onPause: pause, onContinue: () => pauseBox.replaceChildren() }));
      }

      async function pause() {
        leaving = true;
        stopClock();
        stopSpeaking();
        if (progress?.session) await missions.saveProgress(mission, progress, { action: 'pause' });
        navigate('/');
      }

      // ---- Steps -------------------------------------------------------
      function speakButton(text, side) {
        if (!isSpeechSupported()) return null;
        return h('button', {
          type: 'button',
          class: 'button button--secondary button--small',
          onclick: () => speak(text, side.lang),
        }, icon(ICONS.speaker), 'Lyssna');
      }

      // Shows how far there is to go, including cards that come back for a new try.
      function progressText(session) {
        const key = fc.currentKey(session);
        const before = session.queue.slice(0, session.position);
        const left = fc.remainingCount(session);
        const leftText = left === 1 ? 'Sista kortet!' : `${left} kort kvar.`;
        if (before.includes(key)) {
          return `Nytt försök (${session.retries[key]} av ${fc.MAX_RETRIES}) på ett kort du har sett. ${leftText}`;
        }
        const seen = new Set(before).size;
        return `Kort ${seen + 1} av ${fc.uniqueCount(session)}. ${leftText}`;
      }

      function showIntro() {
        const resuming = progress?.session && !fc.isFinished(progress.session);
        const keys = resuming ? null : api.planSession(exam, deck, today);
        const count = resuming ? fc.uniqueCount(progress.session) : keys.length;

        const startButton = h('button', {
          type: 'button',
          class: 'button button--large',
          'data-js': 'start-session',
          onclick: async () => {
            if (!resuming) {
              progress = { session: fc.createSession(keys), elapsedMs: 0, pauseOffered: false };
              await missions.start(mission);
            }
            startClock();
            showCard({ focus: 'prompt' });
          },
        }, icon(ICONS.play), resuming ? 'Fortsätt där du var' : 'Börja med första kortet');

        stage.replaceChildren(
          h('h2', {}, resuming ? 'Välkommen tillbaka!' : 'Dagens pass'),
          h('p', {}, resuming
            ? `Du har redan övat på ${new Set(progress.session.queue.slice(0, progress.session.position)).size} av ${count} kort. Allt är sparat, så vi fortsätter där du slutade.`
            : `Ungefär ${api.minutesFor(count)} minuter, ${count} kort. Vi börjar med ett enda kort.`),
          startButton,
          h('p', {}, h('a', { class: 'text-link', href: '#/missions' }, 'Tillbaka till uppdragen')),
        );
      }

      // Answer mode per card and direction: "self" (flip the card), "type" or "choice".
      // Set for the whole exam with "answerMode", or per card. Either a string or
      // { "forward": ..., "reverse": ... }.
      function modeFor(card, direction) {
        const pick = (m) => (typeof m === 'string' ? m : m?.[direction]);
        const mode = pick(card.answerMode) ?? pick(exam.answerMode) ?? 'self';
        return ANSWER_MODES.includes(mode) ? mode : 'self';
      }

      const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
      const capitalized = (text) => text.charAt(0).toUpperCase() + text.slice(1);

      function showCard({ revealed = false, focus = 'prompt' } = {}) {
        const key = fc.currentKey(progress.session);
        const { cardId, direction } = fc.parseItemKey(key);
        const card = exam.cards.find((c) => c.id === cardId);
        const side = sides(direction, card);
        const promptText = card[side.promptKey];
        const answerText = card[side.answerKey];
        const mode = modeFor(card, direction);
        const extra = capitalized(side.answerKey); // "Back" or "Front"

        const promptId = `prompt-${progress.session.position}`;
        const prompt = h('h2', { class: 'flashcard__prompt', id: promptId, tabindex: '-1', lang: side.prompt.lang }, promptText);
        const answerArea = h('div', { class: 'flashcard__answer-area', 'data-js': 'answer-area' });
        const children = [
          h('p', { class: 'flashcard__label' }, `${side.prompt.label}:`),
          prompt,
          speakButton(promptText, side.prompt),
          answerArea,
        ];

        stage.replaceChildren(
          h('p', { class: 'session__progress' }, progressText(progress.session)),
          timerText,
          h('article', { class: 'flashcard', 'aria-label': 'Kort' }, ...children),
          h('button', { type: 'button', class: 'button button--secondary button--small', onclick: pause },
            icon(ICONS.pause), 'Pausa och spara'),
        );
        renderClock();

        const correctBox = () => h('div', { class: 'flashcard__answer' },
          h('p', { class: 'flashcard__label' }, `Rätt svar (${side.answer.label.toLowerCase()}):`),
          h('p', { class: 'flashcard__answer-text', lang: side.answer.lang }, answerText),
          speakButton(answerText, side.answer),
        );

        // After a typed or chosen answer: show the right answer and one "next" button.
        function showResult(known, given) {
          const next = h('button', {
            type: 'button',
            class: 'button button--large',
            'data-js': 'next-card',
            onclick: () => (fc.isFinished(progress.session) ? finish() : showCard({ focus: 'prompt' })),
          }, fc.isFinished(progress.session) ? 'Klar' : 'Nästa kort');
          answerArea.replaceChildren(
            h('p', { class: `flashcard__result flashcard__result--${known ? 'correct' : 'wrong'}` },
              icon(known ? ICONS.check : ICONS.info, 'flashcard__result-icon'),
              h('span', {}, known ? 'Rätt!' : 'Inte riktigt än.')),
            given ? h('p', {}, 'Ditt svar: ', h('span', { lang: side.answer.lang }, given)) : null,
            correctBox(),
            next,
          );
          next.focus();
        }

        if (mode === 'type') {
          const inputId = `answer-${key.replace(/[^a-z0-9-]/gi, '-')}`;
          const input = h('input', {
            class: 'field__input',
            id: inputId,
            type: 'text',
            lang: side.answer.lang,
            autocomplete: 'off',
            autocapitalize: 'off',
            autocorrect: 'off',
            spellcheck: 'false',
            enterkeyhint: 'done',
            // The word to translate is read together with the field label.
            'aria-describedby': promptId,
            'data-js': 'answer-input',
          });
          const error = h('p', { class: 'field__error', id: `${inputId}-error`, hidden: true });
          const form = h('form', { class: 'flashcard__form', novalidate: true },
            h('div', { class: 'field' },
              h('label', { class: 'field__label', for: inputId }, `Skriv svaret (${side.answer.label.toLowerCase()})`),
              error,
              input),
            h('div', { class: 'session__actions' },
              h('button', { type: 'submit', class: 'button button--large', 'data-js': 'check' }, 'Svara'),
              h('button', {
                type: 'button',
                class: 'button button--secondary',
                'data-js': 'give-up',
                onclick: async () => showResult(await answer(key, false), ''),
              }, 'Jag vet inte'),
            ));
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const given = input.value.trim();
            if (!given) {
              error.replaceChildren(icon(ICONS.info, 'field__error-icon'),
                h('span', {}, 'Skriv ett svar först, eller tryck på "Jag vet inte".'));
              error.hidden = false;
              input.setAttribute('aria-invalid', 'true');
              input.setAttribute('aria-describedby', `${promptId} ${error.id}`);
              input.focus();
              return;
            }
            const { correct } = checkTyped(given, [answerText, ...asList(card[`accept${extra}`])]);
            showResult(await answer(key, correct), given);
          });
          answerArea.append(form);
          // Focus the field so the keyboard stays open from card to card.
          if (focus === 'prompt') input.focus();
          return;
        }

        if (mode === 'choice') {
          const choices = buildChoices(answerText, {
            custom: asList(card[`choices${extra}`]),
            pool: exam.cards.filter((c) => c.id !== card.id && c.kind === card.kind).map((c) => c[side.answerKey]),
            // A new order on every try, so the right answer is not remembered by its place.
            seed: `${key}|${progress.session.retries[key] ?? 0}`,
          });
          const questionId = `choice-question-${progress.session.position}`;
          answerArea.append(
            h('p', { class: 'flashcard__question', id: questionId }, 'Välj rätt svar:'),
            h('div', { class: 'flashcard__choices', role: 'group', 'aria-labelledby': questionId },
              choices.map((choice) => h('button', {
                type: 'button',
                class: 'button button--secondary flashcard__choice',
                lang: side.answer.lang,
                'data-js': 'choice',
                onclick: async () => showResult(await answer(key, choice === answerText), choice),
              }, choice))),
          );
          if (focus === 'prompt') prompt.focus();
          return;
        }

        // "self": flip the card and say if you knew it.
        if (!revealed) {
          answerArea.append(h('button', {
            type: 'button',
            class: 'button button--large',
            'data-js': 'reveal',
            onclick: () => showCard({ revealed: true, focus: 'answer' }),
          }, 'Visa svaret'));
          if (focus === 'prompt') prompt.focus();
          return;
        }
        const answerBox = h('div', { class: 'flashcard__answer', tabindex: '-1', 'data-js': 'answer' },
          h('p', { class: 'flashcard__label' }, `${side.answer.label}:`),
          h('p', { class: 'flashcard__answer-text', lang: side.answer.lang }, answerText),
          speakButton(answerText, side.answer),
        );
        answerArea.append(
          answerBox,
          h('p', { class: 'flashcard__question', id: 'rate-question' }, 'Kunde du det?'),
          h('div', { class: 'session__actions', role: 'group', 'aria-labelledby': 'rate-question' },
            h('button', { type: 'button', class: 'button button--success', 'data-js': 'known', onclick: () => selfRated(key, true) },
              icon(ICONS.check), 'Ja, jag kunde det'),
            h('button', { type: 'button', class: 'button button--secondary', 'data-js': 'not-yet', onclick: () => selfRated(key, false) },
              'Inte än'),
          ),
        );
        (focus === 'answer' ? answerBox : prompt).focus();
      }

      async function selfRated(key, known) {
        await answer(key, known);
        if (fc.isFinished(progress.session)) await finish();
        else showCard({ focus: 'prompt' });
      }

      /** Save the answer (autosave), move the session on and let Kvackis respond. Returns `known`. */
      async function answer(key, known) {
        stopSpeaking();
        deck = fc.applyAnswer(deck, key, known, today);
        await api.saveDeck(exam, deck);
        const { session, requeued } = fc.advanceSession(progress.session, known);
        progress.session = session;
        progress.elapsedMs = clock.elapsed();
        await missions.saveProgress(mission, progress, { item: key, result: known ? 'known' : 'not-yet' });

        let message;
        if (known) {
          message = PRAISE[praiseIndex % PRAISE.length];
          praiseIndex += 1;
        } else {
          message = requeued ? NOT_YET_RETRY : NOT_YET_LATER;
        }
        announce(feedback, `Kvackis: ${message}`);
        return known;
      }

      async function finish() {
        stopClock();
        const practiced = fc.uniqueCount(progress.session);
        await missions.complete(mission, {
          practiced,
          firstTry: fc.firstTryCount(progress.session),
          minutes: Math.round(progress.elapsedMs / 60000),
          ...(progress.redo ? { redo: true } : {}),
        });
        showDone({ focus: true });
      }

      /** Do the same cards again. The mission stays done; progress is still autosaved. */
      async function redo() {
        const keys = [...new Set(progress.session.queue)];
        progress = {
          session: fc.createSession(fc.mixKeys(keys, `${today}|redo|${Date.now()}`)),
          elapsedMs: 0,
          pauseOffered: false,
          redo: true,
        };
        clock = null;
        await missions.saveProgress(mission, progress, { action: 'redo' });
        startClock();
        showCard({ focus: 'prompt' });
      }

      function showDone({ focus = false } = {}) {
        pauseBox.replaceChildren();
        feedback.replaceChildren(); // Kvackis' last answer feedback is replaced by the cheer.
        const session = progress?.session;
        const cheer = DONE_CHEERS[Math.floor(Math.random() * DONE_CHEERS.length)];
        const heading = h('h2', { class: 'cheer__title', tabindex: '-1' }, cheer);
        stage.replaceChildren(
          h('div', { class: 'cheer' },
            h('img', { class: 'cheer__image', src: 'img/logo.png', alt: '', width: '192', height: '192' }),
            h('div', { class: 'cheer__bubble' },
              h('p', { class: 'cheer__speaker' }, 'Kvackis säger:'),
              heading,
              session
                ? h('p', { class: 'cheer__score' }, icon(ICONS.check, 'cheer__score-icon'),
                  h('span', {}, `${fc.firstTryCount(session)} av ${fc.uniqueCount(session)} rätt på första försöket`))
                : null)),
          h('div', { class: 'session__actions' },
            h('a', { class: 'button button--large button--success', href: '#/missions', 'data-js': 'done' },
              icon(ICONS.check), 'Klar'),
            session
              ? h('button', { type: 'button', class: 'button button--secondary', 'data-js': 'redo', onclick: redo }, 'Gör om')
              : null),
        );
        if (focus) heading.focus();
      }

      // ---- Start --------------------------------------------------------
      // An unfinished session (also a redo) is resumed; otherwise a done mission shows the result.
      const unfinished = progress?.session && !fc.isFinished(progress.session);
      if (saved.status === missions.STATUS.DONE && !unfinished) showDone();
      else showIntro();

      return {
        title: exam.title,
        cleanup() {
          stopSpeaking();
          if (leaving || !clock?.isRunning()) return;
          stopClock();
          missions.saveProgress(mission, progress, { action: 'leave' });
        },
      };
    },
  };
}

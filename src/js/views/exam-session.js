import { h, icon, ICONS, announce } from './dom.js';
import { navigate } from '../core/router.js';
import * as missions from '../core/missions.js';
import * as fc from '../engines/flashcards.js';
import { isSpeechSupported, speak, stopSpeaking } from '../lib/speech.js';

const PAUSE_SUGGESTION_MS = 20 * 60 * 1000;
const CLOCK_TICK_MS = 15 * 1000;

const PRAISE = [
  'Bra jobbat!',
  'Snyggt! Du kämpar på bra.',
  'Kvack! Det där satt.',
  'Vad bra att du övar!',
];
const NOT_YET_RETRY = 'Ingen fara! Det kortet kommer tillbaka lite senare, så får du försöka igen.';
const NOT_YET_LATER = 'Ingen fara! Vi övar mer på det kortet en annan dag.';

/**
 * View that runs one exam mission: intro → one card at a time → done.
 * Progress is saved after every answer so an interrupted session can be resumed.
 *
 * `api` comes from the exam module: { loadDeck, saveDeck, planSession, daysUntil, daysLeftText }.
 */
export function createExamSessionView(api) {
  return {
    async render(container, { mission }) {
      const { exam, today } = mission;
      let deck = await api.loadDeck(exam);
      const saved = await missions.getState(mission.id);
      let progress = saved.progress ?? null; // { session, elapsedMs, pauseOffered }
      let clockId = null;
      let segmentStart = null;
      let leaving = false;
      let praiseIndex = 0;

      const sides = (direction) => (direction === 'forward'
        ? { prompt: exam.front, answer: exam.back, promptKey: 'front', answerKey: 'back' }
        : { prompt: exam.back, answer: exam.front, promptKey: 'back', answerKey: 'front' });

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
              h('span', {}, 'Det här är exempelbegrepp. En vuxen behöver fylla i de riktiga från skolan.'))
            : null,
          pauseBox,
          feedback,
          stage,
        ),
      );

      // ---- Clock (counts up, never down) ---------------------------------
      const elapsed = () => (progress?.elapsedMs ?? 0) + (segmentStart ? Date.now() - segmentStart : 0);

      function renderClock() {
        const minutes = Math.floor(elapsed() / 60000);
        timerText.textContent = minutes < 1 ? 'Du har precis börjat.' : `Du har övat i ${minutes} min.`;
        if (!progress.pauseOffered && elapsed() >= PAUSE_SUGGESTION_MS) offerPause();
      }

      function startClock() {
        if (segmentStart) return;
        segmentStart = Date.now();
        clockId = window.setInterval(renderClock, CLOCK_TICK_MS);
      }

      function stopClock() {
        if (segmentStart) {
          progress.elapsedMs = elapsed();
          segmentStart = null;
        }
        window.clearInterval(clockId);
        clockId = null;
      }

      function offerPause() {
        progress.pauseOffered = true;
        announce(feedback, 'Kvackis: Du har övat i 20 minuter. Vill du ta en paus?');
        pauseBox.replaceChildren(
          h('div', { class: 'notice notice--pause' },
            h('p', {}, 'Du har övat i 20 minuter. Det är helt okej att ta en paus nu. Det du har gjort är sparat.'),
            h('div', { class: 'session__actions' },
              h('button', { type: 'button', class: 'button button--secondary', onclick: pause }, icon(ICONS.pause), 'Ta en paus'),
              h('button', { type: 'button', class: 'button button--secondary', onclick: () => pauseBox.replaceChildren() }, 'Fortsätt öva'),
            ),
          ),
        );
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

      // Retries do not grow the total, so the session never seems to get longer.
      function progressText(session) {
        const key = fc.currentKey(session);
        const before = session.queue.slice(0, session.position);
        if (before.includes(key)) return 'Nytt försök på ett kort du har sett.';
        const seen = new Set(before).size;
        return `Kort ${seen + 1} av ${fc.uniqueCount(session)}`;
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
            : `Ungefär ${mission.estimatedMinutes} minuter, ${count} kort. Vi börjar med ett enda kort.`),
          startButton,
          h('p', {}, h('a', { href: '#/missions' }, 'Tillbaka till uppdragen')),
        );
      }

      function showCard({ revealed = false, focus = 'prompt' } = {}) {
        const key = fc.currentKey(progress.session);
        const { cardId, direction } = fc.parseItemKey(key);
        const card = exam.cards.find((c) => c.id === cardId);
        const side = sides(direction);
        const promptText = card[side.promptKey];
        const answerText = card[side.answerKey];

        const prompt = h('h2', { class: 'flashcard__prompt', tabindex: '-1', lang: side.prompt.lang }, promptText);
        const children = [
          h('p', { class: 'flashcard__label' }, `${side.prompt.label}:`),
          prompt,
          speakButton(promptText, side.prompt),
        ];

        let answerBox = null;
        if (!revealed) {
          children.push(h('button', {
            type: 'button',
            class: 'button button--large',
            'data-js': 'reveal',
            onclick: () => showCard({ revealed: true, focus: 'answer' }),
          }, 'Visa svaret'));
        } else {
          answerBox = h('div', { class: 'flashcard__answer', tabindex: '-1', 'data-js': 'answer' },
            h('p', { class: 'flashcard__label' }, `${side.answer.label}:`),
            h('p', { class: 'flashcard__answer-text', lang: side.answer.lang }, answerText),
            speakButton(answerText, side.answer),
          );
          children.push(
            answerBox,
            h('p', { class: 'flashcard__question', id: 'rate-question' }, 'Kunde du det?'),
            h('div', { class: 'session__actions', role: 'group', 'aria-labelledby': 'rate-question' },
              h('button', { type: 'button', class: 'button button--success', 'data-js': 'known', onclick: () => answer(key, true) },
                icon(ICONS.check), 'Ja, jag kunde det'),
              h('button', { type: 'button', class: 'button button--secondary', 'data-js': 'not-yet', onclick: () => answer(key, false) },
                'Inte än'),
            ),
          );
        }

        stage.replaceChildren(
          h('p', { class: 'session__progress' }, progressText(progress.session)),
          timerText,
          h('article', { class: 'flashcard', 'aria-label': 'Kort' }, ...children),
          h('button', { type: 'button', class: 'button button--secondary button--small', onclick: pause },
            icon(ICONS.pause), 'Pausa och spara'),
        );
        renderClock();
        (focus === 'answer' ? answerBox : prompt)?.focus();
      }

      async function answer(key, known) {
        stopSpeaking();
        deck = fc.applyAnswer(deck, key, known, today);
        await api.saveDeck(exam, deck);
        const { session, requeued } = fc.advanceSession(progress.session, known);
        progress.session = session;
        progress.elapsedMs = elapsed();
        segmentStart = Date.now();
        await missions.saveProgress(mission, progress, { item: key, result: known ? 'known' : 'not-yet' });

        let message;
        if (known) {
          message = PRAISE[praiseIndex % PRAISE.length];
          praiseIndex += 1;
        } else {
          message = requeued ? NOT_YET_RETRY : NOT_YET_LATER;
        }
        announce(feedback, `Kvackis: ${message}`);

        if (fc.isFinished(progress.session)) await finish();
        else showCard({ focus: 'prompt' });
      }

      async function finish() {
        stopClock();
        const practiced = fc.uniqueCount(progress.session);
        await missions.complete(mission, { practiced, minutes: Math.round(progress.elapsedMs / 60000) });
        showDone(practiced);
      }

      function showDone(practiced) {
        pauseBox.replaceChildren();
        const heading = h('h2', { tabindex: '-1' }, 'Klart för idag!');
        stage.replaceChildren(
          heading,
          h('p', {}, h('strong', {}, 'Kvackis: '), practiced
            ? `Vad bra att du övade! Du gick igenom ${practiced} kort idag. Det är så man lär sig.`
            : 'Det här uppdraget är redan klart för idag. Bra jobbat!'),
          h('a', { class: 'button button--large', href: '#/' }, 'Tillbaka till Idag'),
          h('p', {}, h('a', { href: '#/missions' }, 'Se dagens uppdrag')),
        );
        heading.focus();
      }

      // ---- Start --------------------------------------------------------
      if (saved.status === missions.STATUS.DONE) {
        stage.replaceChildren(
          h('h2', {}, 'Klart för idag!'),
          h('p', {}, h('strong', {}, 'Kvackis: '), 'Det här uppdraget är redan klart för idag. Bra jobbat!'),
          h('a', { class: 'button button--large', href: '#/' }, 'Tillbaka till Idag'),
        );
      } else {
        showIntro();
      }

      return {
        title: exam.title,
        cleanup() {
          stopSpeaking();
          if (leaving || !segmentStart) return;
          stopClock();
          missions.saveProgress(mission, progress, { action: 'leave' });
        },
      };
    },
  };
}

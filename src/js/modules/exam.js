import * as storage from '../core/storage.js';
import * as fc from '../engines/flashcards.js';
import { createExamSessionView } from '../views/exam-session.js';

/**
 * Exam module: vocabulary and subject terms are the same thing,
 * an exam with a date and a set of cards.
 */

export const SESSION_MINUTES = 10;
const SECONDS_PER_ITEM = 30;
export const MAX_ITEMS = Math.round((SESSION_MINUTES * 60) / SECONDS_PER_ITEM);
/** From this many days before the exam, every item not seen today is due. */
const EXAM_SOON_DAYS = 2;

/** Returns a Date for a valid "YYYY-MM-DD" string, otherwise null (e.g. "PLACEHOLDER"). */
export function parseISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 ? date : null;
}

export function daysUntil(todayISO, examISO) {
  const today = parseISODate(todayISO);
  const exam = parseISODate(examISO);
  if (!today || !exam) return null;
  return Math.round((exam - today) / 86400000);
}

export function daysLeftText(days) {
  if (days === null) return 'Provdatum är inte bestämt än';
  if (days === 0) return 'Provet är idag';
  if (days === 1) return 'Provet är i morgon';
  return `Provet är om ${days} dagar`;
}

const deckKey = (examId) => `flashcards:${examId}`;

async function loadDeck(exam) {
  return fc.syncDeck(await storage.get(deckKey(exam.id), null), exam.cards);
}

async function saveDeck(exam, deck) {
  await storage.set(deckKey(exam.id), deck);
}

function planSession(exam, deck, today) {
  const days = daysUntil(today, exam.examDate);
  return fc.pickSession(deck, {
    today,
    maxItems: MAX_ITEMS,
    examSoon: days !== null && days <= EXAM_SOON_DAYS,
  });
}

function getMissions(exam, ctx) {
  const days = daysUntil(ctx.today, exam.examDate);
  if (days !== null && days < 0) return [];
  if (!Array.isArray(exam.cards) || exam.cards.length === 0) return [];
  return [{
    id: `exam-${exam.id}-${ctx.today}`,
    type: 'exam',
    title: exam.title,
    subject: exam.subject,
    summary: daysLeftText(days),
    estimatedMinutes: SESSION_MINUTES,
    placeholder: Boolean(exam.placeholder),
    today: ctx.today,
    exam,
  }];
}

export default {
  type: 'exam',
  label: 'Prov',
  getMissions,
  view: createExamSessionView({ loadDeck, saveDeck, planSession, daysUntil, daysLeftText }),
};

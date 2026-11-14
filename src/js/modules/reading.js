import * as storage from '../core/storage.js';
import { readingStatus, lastPageOfBook } from './reading-plan.js';
import { createReadingSessionView } from '../views/reading-session.js';

/**
 * Reading module: a book with a weekly page plan.
 * The reader says which page she has reached; the app suggests today's pages.
 */

export const READING_MODES = Object.freeze([
  { value: 'self', label: 'Själv' },
  { value: 'together', label: 'Tillsammans med någon' },
  { value: 'listened', label: 'Lyssnar på boken' },
]);

const MAX_QUESTIONS = 3;
const ESTIMATED_MINUTES = 15;

const bookKey = (bookId) => `reading:${bookId}`;

async function loadBookState(book) {
  return storage.get(bookKey(book.id), { lastPage: 0 });
}

async function saveLastPage(book, lastPage) {
  return storage.update(bookKey(book.id), (prev) => ({ ...prev, lastPage }), { lastPage: 0 });
}

export function pagesText({ from, to }) {
  if (to < from) return 'inga sidor';
  return from === to ? `sidan ${from}` : `sidorna ${from}–${to}`;
}

async function getMissions(book, ctx) {
  if (!Array.isArray(book.plan) || book.plan.length === 0) return [];
  const { lastPage } = await loadBookState(book);
  const status = readingStatus(book, lastPage, ctx.today);
  if (status.phase === 'before' || status.phase === 'finished') return [];
  return [{
    id: `reading-${book.id}-${ctx.today}`,
    type: 'reading',
    title: book.title,
    subject: book.subject,
    summary: `Förslag idag: ${pagesText(status.suggestion)}`,
    estimatedMinutes: ESTIMATED_MINUTES,
    today: ctx.today,
    book,
  }];
}

export default {
  type: 'reading',
  label: 'Läsning',
  getMissions,
  view: createReadingSessionView({
    loadBookState,
    saveLastPage,
    readingStatus,
    lastPageOfBook,
    pagesText,
    modes: READING_MODES,
    maxQuestions: MAX_QUESTIONS,
  }),
};

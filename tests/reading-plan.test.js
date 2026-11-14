import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoWeek, readingStatus, lastPageOfBook } from '../src/js/modules/reading-plan.js';

const book = {
  year: 2026,
  pages: 166,
  maxPagesPerDay: 15,
  plan: [
    { week: 43, from: 3, to: 20 }, { week: 44, from: 21, to: 50 }, { week: 45, from: 51, to: 74 },
    { week: 46, from: 75, to: 102 }, { week: 47, from: 103, to: 134 }, { week: 48, from: 135, to: 166 },
  ],
};

test('isoWeek', () => {
  assert.deepEqual(isoWeek('2026-11-14'), { year: 2026, week: 46, weekday: 6 });
  assert.deepEqual(isoWeek('2026-11-09'), { year: 2026, week: 46, weekday: 1 });
  assert.deepEqual(isoWeek('2027-01-01'), { year: 2026, week: 53, weekday: 5 });
  assert.equal(lastPageOfBook(book), 166);
});

test('on track on a Monday spreads the week over 7 days', () => {
  const s = readingStatus(book, 74, '2026-11-09');
  assert.equal(s.phase, 'active');
  assert.equal(s.week, 46);
  assert.equal(s.behindPages, 0);
  assert.deepEqual(s.suggestion, { from: 75, to: 78 }); // 28 pages / 7 days
});

test('behind on a Saturday: shows the gap and caps the daily pages', () => {
  const s = readingStatus(book, 60, '2026-11-14');
  assert.equal(s.behindPages, 14);
  assert.deepEqual(s.suggestion, { from: 61, to: 75 });
});

test('week already done gives an optional extra suggestion', () => {
  const s = readingStatus(book, 102, '2026-11-11');
  assert.equal(s.weekDone, true);
  assert.equal(s.suggestion.from, 103);
});

test('before, after and finished phases', () => {
  assert.equal(readingStatus(book, 0, '2026-10-01').phase, 'before');
  const after = readingStatus(book, 150, '2026-12-07');
  assert.equal(after.phase, 'after');
  assert.deepEqual(after.suggestion, { from: 151, to: 165 });
  assert.equal(readingStatus(book, 166, '2026-11-14').phase, 'finished');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRewards, formatKr, COINS_PER_MISSION, WEEK_CAP, MONTH_CAP } from '../src/js/core/rewards.js';
import { weekKey, isoWeek } from '../src/js/lib/dates.js';

// Noon UTC keeps the local day stable in any European time zone.
const done = (id, day) => ({ missionId: id, type: 'exam', event: 'done', timestamp: `${day}T12:00:00.000Z`, meta: {} });
const step = (id, day, meta = { item: 'x' }) => ({ missionId: id, type: 'exam', event: 'progress', timestamp: `${day}T11:00:00.000Z`, meta });

test('dates helpers', () => {
  assert.equal(weekKey('2026-11-14'), '2026-W46');
  assert.equal(isoWeek('2026-12-31').week, 53);
});

test('amount per mission is calculated from the monthly cap: 1,10 kr', () => {
  assert.equal(COINS_PER_MISSION, 110);
  assert.equal(formatKr(COINS_PER_MISSION), '1,10 kr');
  assert.equal(formatKr(WEEK_CAP), '25 kr');
});

test('each done mission gives coins, the same mission only once', () => {
  const r = computeRewards([done('a', '2026-11-09'), done('a', '2026-11-09'), done('b', '2026-11-10')]);
  assert.equal(r.weeks['2026-W46'], COINS_PER_MISSION * 2);
  assert.equal(r.awards.a, COINS_PER_MISSION);
});

test('a full week of 3 missions a day stays under the weekly cap', () => {
  const days = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];
  const r = computeRewards(days.flatMap((d) => [done(`${d}a`, d), done(`${d}b`, d), done(`${d}c`, d)]));
  assert.equal(r.weeks['2026-W46'], 21 * COINS_PER_MISSION); // 23,10 kr
  assert.ok(r.weeks['2026-W46'] < WEEK_CAP);
});

test('weekly cap is 25 kr', () => {
  const log = Array.from({ length: 30 }, (_, i) => done(`m${i}`, '2026-11-10'));
  const r = computeRewards(log);
  assert.equal(r.weeks['2026-W46'], WEEK_CAP);
  assert.equal(r.awards.m29, 0);
});

test('every mission every day in a 31-day month reaches exactly the 100 kr cap', () => {
  const days = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);
  const r = computeRewards(days.flatMap((d) => [done(`${d}a`, d), done(`${d}b`, d), done(`${d}c`, d)]));
  assert.equal(r.months['2026-12'], MONTH_CAP);
});

test('XP counts effort: steps and done missions, not pauses', () => {
  const r = computeRewards([step('a', '2026-11-10'), step('a', '2026-11-10'), step('a', '2026-11-10', { action: 'pause' }), done('a', '2026-11-10')]);
  assert.equal(r.xp, 12);
});

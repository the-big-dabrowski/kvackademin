import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRewards, COINS_PER_MISSION, WEEK_CAP, MONTH_CAP } from '../src/js/core/rewards.js';
import { weekKey, isoWeek } from '../src/js/lib/dates.js';

// Noon UTC keeps the local day stable in any European time zone.
const done = (id, day) => ({ missionId: id, type: 'exam', event: 'done', timestamp: `${day}T12:00:00.000Z`, meta: {} });
const step = (id, day, meta = { item: 'x' }) => ({ missionId: id, type: 'exam', event: 'progress', timestamp: `${day}T11:00:00.000Z`, meta });

test('dates helpers', () => {
  assert.equal(weekKey('2026-11-14'), '2026-W46');
  assert.equal(isoWeek('2026-12-31').week, 53);
});

test('each done mission gives coins, the same mission only once', () => {
  const r = computeRewards([done('a', '2026-11-09'), done('a', '2026-11-09'), done('b', '2026-11-10')]);
  assert.equal(r.weeks['2026-W46'], COINS_PER_MISSION * 2);
  assert.equal(r.awards.a, COINS_PER_MISSION);
});

test('weekly cap is 25', () => {
  const log = Array.from({ length: 8 }, (_, i) => done(`m${i}`, '2026-11-10'));
  const r = computeRewards(log);
  assert.equal(r.weeks['2026-W46'], WEEK_CAP);
  assert.equal(r.awards.m7, 0);
});

test('monthly cap is 100 even across five weeks', () => {
  const days = ['2026-12-01', '2026-12-08', '2026-12-15', '2026-12-22', '2026-12-29'];
  const log = days.flatMap((d, w) => Array.from({ length: 5 }, (_, i) => done(`w${w}-${i}`, d)));
  const r = computeRewards(log);
  assert.equal(r.months['2026-12'], MONTH_CAP);
});

test('XP counts effort: steps and done missions, not pauses', () => {
  const r = computeRewards([step('a', '2026-11-10'), step('a', '2026-11-10'), step('a', '2026-11-10', { action: 'pause' }), done('a', '2026-11-10')]);
  assert.equal(r.xp, 12);
});

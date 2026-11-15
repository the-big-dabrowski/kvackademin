import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fc from '../src/js/engines/flashcards.js';

const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const today = '2026-11-14';

test('syncDeck creates both directions in box 1 and keeps saved progress', () => {
  const deck = fc.syncDeck({ items: { 'a:forward': { box: 3, lastSeen: '2026-11-10' }, 'gone:forward': { box: 2 } } }, cards);
  assert.equal(Object.keys(deck.items).length, 6);
  assert.deepEqual(deck.items['a:forward'], { box: 3, lastSeen: '2026-11-10' });
  assert.deepEqual(deck.items['b:reverse'], { box: 1, lastSeen: null });
  assert.equal(deck.items['gone:forward'], undefined);
});

test('a card with directions ["forward"] only gets a forward item', () => {
  const deck = fc.syncDeck({ items: { 'q:reverse': { box: 2, lastSeen: today } } }, [{ id: 'q', directions: ['forward'] }, { id: 't' }]);
  assert.deepEqual(Object.keys(deck.items).sort(), ['q:forward', 't:forward', 't:reverse']);
});

test('known moves up one box, max 3; not yet moves to box 1', () => {
  let deck = fc.syncDeck({}, cards);
  deck = fc.applyAnswer(deck, 'a:forward', true, today);
  assert.equal(deck.items['a:forward'].box, 2);
  deck = fc.applyAnswer(deck, 'a:forward', true, today);
  deck = fc.applyAnswer(deck, 'a:forward', true, today);
  assert.equal(deck.items['a:forward'].box, 3);
  deck = fc.applyAnswer(deck, 'a:forward', false, today);
  assert.equal(deck.items['a:forward'].box, 1);
  assert.equal(deck.items['a:forward'].lastSeen, today);
});

test('isDue follows the review intervals per box', () => {
  assert.equal(fc.isDue({ box: 1, lastSeen: null }, today), true);
  assert.equal(fc.isDue({ box: 1, lastSeen: '2026-11-13' }, today), true);
  assert.equal(fc.isDue({ box: 1, lastSeen: today }, today), false);
  assert.equal(fc.isDue({ box: 2, lastSeen: '2026-11-13' }, today), false);
  assert.equal(fc.isDue({ box: 2, lastSeen: '2026-11-12' }, today), true);
  assert.equal(fc.isDue({ box: 3, lastSeen: '2026-11-11' }, today), false);
  assert.equal(fc.isDue({ box: 3, lastSeen: '2026-11-11' }, today, true), true);
});

test('pickSession respects maxItems, puts low boxes first and spreads directions', () => {
  let deck = fc.syncDeck({}, cards);
  deck.items['a:forward'] = { box: 3, lastSeen: '2026-11-01' };
  const keys = fc.pickSession(deck, { today, maxItems: 4 });
  assert.equal(keys.length, 4);
  assert.ok(!keys.includes('a:forward'));
  for (let i = 1; i < keys.length; i += 1) {
    assert.notEqual(fc.parseItemKey(keys[i]).cardId, fc.parseItemKey(keys[i - 1]).cardId);
  }
});

test('pickSession mixes the order but keeps it the same all day', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({ id: `c${String(i).padStart(2, '0')}`, directions: ['forward'] }));
  const deck = fc.syncDeck({}, many);
  const first = fc.pickSession(deck, { today, maxItems: 20 });
  assert.deepEqual(fc.pickSession(deck, { today, maxItems: 20 }), first);
  assert.notDeepEqual(first, Object.keys(deck.items));
  assert.equal(new Set(first).size, 20);
});

test('pickSession quota adds a fixed number of one group on top of maxItems', () => {
  const qs = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, directions: ['forward'] }));
  const ts = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}` }));
  const deck = fc.syncDeck({}, [...qs, ...ts]);
  const groupOf = (key) => key[0];
  const keys = fc.pickSession(deck, { today, maxItems: 20, quota: { t: 5 }, groupOf });
  assert.equal(keys.filter((k) => k.startsWith('q')).length, 20);
  assert.equal(keys.filter((k) => k.startsWith('t')).length, 5);

  // Few questions due: still only 5 of the quota group.
  const small = fc.syncDeck({}, [...qs.slice(0, 3), ...ts]);
  const mixed = fc.pickSession(small, { today, maxItems: 20, quota: { t: 5 }, groupOf });
  assert.equal(mixed.filter((k) => k.startsWith('q')).length, 3);
  assert.equal(mixed.filter((k) => k.startsWith('t')).length, 5);
});

test('pickAll takes every item once', () => {
  const deck = fc.syncDeck({}, cards);
  const keys = fc.pickAll(deck, { today });
  assert.deepEqual([...keys].sort(), Object.keys(deck.items).sort());
});

test('remainingCount includes retries and firstTryCount skips missed items', () => {
  let session = fc.createSession(['a:forward', 'b:forward', 'c:forward']);
  ({ session } = fc.advanceSession(session, false)); // a wrong, comes back
  ({ session } = fc.advanceSession(session, true));
  assert.equal(fc.remainingCount(session), 2);
  while (!fc.isFinished(session)) ({ session } = fc.advanceSession(session, true));
  assert.equal(fc.firstTryCount(session), 2);
});

test('pickSession gives a light review when nothing is due', () => {
  let deck = fc.syncDeck({}, cards);
  for (const key of Object.keys(deck.items)) deck = fc.applyAnswer(deck, key, true, today);
  const keys = fc.pickSession(deck, { today, maxItems: 20 });
  assert.equal(keys.length, fc.REVIEW_SIZE);
});

test('not yet gives a new try later in the session, at most MAX_RETRIES times', () => {
  let session = fc.createSession(['a:forward', 'b:forward', 'c:forward', 'a:reverse', 'b:reverse']);
  let result = fc.advanceSession(session, false);
  assert.equal(result.requeued, true);
  assert.equal(result.session.queue[1 + fc.RETRY_GAP], 'a:forward');
  session = result.session;
  let tries = 1;
  while (!fc.isFinished(session)) {
    const isA = fc.currentKey(session) === 'a:forward';
    result = fc.advanceSession(session, !isA);
    if (isA && result.requeued) tries += 1;
    session = result.session;
  }
  assert.equal(tries, fc.MAX_RETRIES);
  assert.equal(fc.uniqueCount(session), 5);
});

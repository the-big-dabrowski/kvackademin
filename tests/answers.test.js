import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, checkTyped, buildChoices } from '../src/js/lib/answers.js';

test('normalize ignores case, spaces and punctuation', () => {
  assert.equal(normalize('  The   Leaf! '), 'the leaf');
  assert.equal(normalize('Äpple.'), 'äpple');
});

test('checkTyped accepts the answer and extra accepted answers', () => {
  assert.deepEqual(checkTyped('Leaf', ['leaf']), { correct: true, exact: true });
  assert.deepEqual(checkTyped('fall', ['autumn', 'fall']), { correct: true, exact: true });
});

test('checkTyped forgives one typo in longer words only', () => {
  assert.deepEqual(checkTyped('umbrela', ['umbrella']), { correct: true, exact: false });
  assert.deepEqual(checkTyped('pumkin', ['pumpkin']), { correct: true, exact: false });
  assert.equal(checkTyped('kold', ['cold']).correct, false);
  assert.equal(checkTyped('umbrellla x', ['umbrella']).correct, false);
});

test('checkTyped rejects empty input', () => {
  assert.equal(checkTyped('   ', ['leaf']).correct, false);
});

test('buildChoices includes the correct answer once and is stable', () => {
  const pool = ['regn', 'paraply', 'kall', 'jacka', 'löv'];
  const a = buildChoices('löv', { pool, seed: 'leaf:forward' });
  const b = buildChoices('löv', { pool, seed: 'leaf:forward' });
  assert.equal(a.length, 4);
  assert.equal(a.filter((c) => c === 'löv').length, 1);
  assert.deepEqual(a, b);
});

test('buildChoices prefers custom wrong answers and handles small pools', () => {
  const custom = buildChoices('löv', { custom: ['lov', 'lev', 'löv'], pool: ['regn'], seed: 's' });
  assert.deepEqual([...custom].sort(), ['lev', 'lov', 'löv']);
  assert.deepEqual(buildChoices('löv', { pool: [], seed: 's' }), ['löv']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ANSWER_MODES } from '../src/js/lib/answers.js';

/**
 * Checks the content files in /data, so a missing comma or a typo in a field name
 * is found by `npm test` before it reaches the app.
 */

const DATA = new URL('../data/', import.meta.url);
const read = (name) => {
  const text = readFileSync(new URL(name, DATA), 'utf8');
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${name} is not valid JSON (check commas and quotes): ${err.message}`);
  }
};

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isTextList = (v) => v === undefined || (Array.isArray(v) && v.every(isText));
const isMode = (m) => m === undefined
  || ANSWER_MODES.includes(m)
  || (typeof m === 'object' && m !== null && Object.entries(m).every(([dir, v]) => ['forward', 'reverse'].includes(dir) && ANSWER_MODES.includes(v)));

test('index.json lists files that exist', () => {
  const index = read('index.json');
  assert.ok(Array.isArray(index.files), 'index.json needs a "files" list');
  const existing = readdirSync(DATA);
  for (const file of index.files) assert.ok(existing.includes(file), `index.json lists ${file}, but the file is missing`);
});

for (const file of readdirSync(DATA).filter((f) => f.startsWith('exam-') && f.endsWith('.json'))) {
  test(`${file} is a valid exam`, () => {
    const exam = read(file);
    const where = (field) => `${file}: ${field}`;
    assert.equal(exam.type, 'exam', where('"type" must be "exam"'));
    for (const field of ['id', 'subject', 'title']) assert.ok(isText(exam[field]), where(`"${field}" is missing`));
    assert.ok(exam.examDate === null || exam.examDate === 'PLACEHOLDER' || /^\d{4}-\d{2}-\d{2}$/.test(exam.examDate ?? ''),
      where('"examDate" must look like "2026-12-11", or be null if not decided'));
    const isDirections = (d) => d === undefined || (Array.isArray(d) && d.length > 0 && d.every((x) => ['forward', 'reverse'].includes(x)));
    const isLabel = (v) => v === undefined || isText(v);
    for (const [kind, defaults] of Object.entries(exam.kinds ?? {})) {
      const at = (msg) => where(`kinds.${kind}: ${msg}`);
      assert.ok(isDirections(defaults.directions), at('"directions" must be like ["forward"]'));
      assert.ok(isLabel(defaults.frontLabel) && isLabel(defaults.backLabel), at('labels must be text'));
      assert.ok(isMode(defaults.answerMode), at('"answerMode" is not valid'));
      assert.ok(defaults.perSession === undefined || (Number.isInteger(defaults.perSession) && defaults.perSession >= 0),
        at('"perSession" must be a whole number, like 5'));
    }
    for (const side of ['front', 'back']) {
      assert.ok(isText(exam[side]?.label) && isText(exam[side]?.lang), where(`"${side}" needs "label" and "lang"`));
    }
    assert.ok(isMode(exam.answerMode), where(`"answerMode" must be one of ${ANSWER_MODES.join(', ')}`));
    assert.ok([undefined, 'all', 'due'].includes(exam.session), where('"session" must be "all" or "due"'));
    assert.ok(Array.isArray(exam.cards) && exam.cards.length > 0, where('"cards" needs at least one card'));

    const ids = new Set();
    for (const [i, card] of exam.cards.entries()) {
      const at = (msg) => where(`card ${i + 1}${card?.id ? ` ("${card.id}")` : ''}: ${msg}`);
      assert.ok(isText(card.id), at('"id" is missing'));
      assert.ok(!ids.has(card.id), at('"id" is used twice'));
      ids.add(card.id);
      assert.ok(isText(card.front) && isText(card.back), at('"front" and "back" are needed'));
      assert.ok(isMode(card.answerMode), at('"answerMode" is not valid'));
      assert.ok(isDirections(card.directions), at('"directions" must be like ["forward"]'));
      assert.ok(isLabel(card.frontLabel) && isLabel(card.backLabel), at('labels must be text'));
      for (const field of ['acceptFront', 'acceptBack', 'choicesFront', 'choicesBack']) {
        assert.ok(isTextList(card[field]), at(`"${field}" must be a list like ["a", "b"]`));
      }
    }
  });
}

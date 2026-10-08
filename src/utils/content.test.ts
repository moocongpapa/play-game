import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import * as content from '../data/gameData';
import { BACKGROUND_MUSIC } from '../data/backgroundMusic';
import { ANIMAL_RECORDINGS, resolveAnimalSound } from '../data/animalSounds';
import { EMOTION_SCENES } from '../data/playThemes';
import { createRoundDeck } from './roundDeck';
import type { AgeGroup } from '../types';

test('question decks exhaust their pool, survive reentry and avoid cycle-boundary repeats', () => {
  const next = createRoundDeck(() => .42);
  const pool = [{ id: 'apple' }, { id: 'bird' }, { id: 'train' }, { id: 'moon' }];
  let last: string | undefined;
  for (let cycle = 0; cycle < 6; cycle++) {
    const round = pool.map(() => next(pool, 'game:sprout').id);
    assert.equal(new Set(round).size, pool.length);
    assert.notEqual(round[0], last);
    last = round.at(-1);
  }
  assert.equal(next([{ id: 'only' }], 'game:baby').id, 'only');
  assert.equal(next([{ id: 'replacement' }], 'game:sprout').id, 'replacement');
});

test('expanded age pools keep distinct answers, valid words and age-sized rhythms', () => {
  const ages: AgeGroup[] = ['baby', 'sprout', 'bloom', 'star'];
  for (const [name, pools] of Object.entries(content)) {
    if (!name.endsWith('_BY_AGE')) continue;
    for (const age of ages) {
      const items = (pools as Record<AgeGroup, { id: string }[]>)[age];
      assert.equal(new Set(items.map(item => item.id)).size, items.length, `${name}:${age} duplicate IDs`);
    }
  }
  ages.forEach((age, i) => {
    for (const item of content.KOREAN_LETTER_ITEMS_BY_AGE[age]) {
      assert.equal(content.KOREAN_LETTER_ITEMS_BY_AGE[age].filter(other => other.letter === item.letter).length, 1);
    }
    const rhythm = content.RHYTHM_ITEMS_BY_AGE[age];
    assert.ok(rhythm.length >= 8);
    for (const item of rhythm) {
      assert.equal(item.notes.length, i + 2);
      assert.equal(item.notes.length, item.colors.length);
      assert.equal(item.notes.length, item.emojis.length);
    }
    for (const item of content.WORD_PUZZLE_ITEMS_BY_AGE[age]) assert.equal(item.letters.join(''), item.word);
    for (const item of content.PATTERN_ITEMS_BY_AGE[age]) assert.ok(!item.distractors.includes(item.answer));
    for (const item of content.EMOTION_ITEMS_BY_AGE[age]) assert.ok(EMOTION_SCENES[item.id]?.length >= 3);
    for (const emoji of new Set(content.SIZE_ITEMS_BY_AGE[age].map(item => item.emoji))) {
      const group = content.SIZE_ITEMS_BY_AGE[age].filter(item => item.emoji === emoji);
      assert.equal(group.length, age === 'baby' ? 2 : 3);
      assert.equal(new Set(group.map(item => item.displayScale)).size, group.length);
    }
  });
});

test('every animal clue resolves to a bundled recording; overlapping Korean names stay distinct', () => {
  assert.equal(resolveAnimalSound('개구리'), 'frog');
  assert.equal(resolveAnimalSound('고양이'), 'cat');
  assert.equal(resolveAnimalSound('염소'), 'goat');
  assert.equal(resolveAnimalSound('양'), 'sheep');
  assert.equal(resolveAnimalSound('cow_sound'), 'cow');
  const spokenClues = new Set(['car_sound', 'train_sound', 'fireengine_sound', 'policecar_sound', 'thunder_sound']);
  for (const pool of Object.values(content.SOUND_ITEMS_BY_AGE)) {
    for (const item of pool) if (!spokenClues.has(item.id)) assert.ok(resolveAnimalSound(item.id), item.id);
  }
  for (const src of Object.values(ANIMAL_RECORDINGS)) {
    assert.ok(statSync(`public${src}`).size > 1000);
    const bytes = readFileSync(`public${src}`);
    assert.equal(bytes.subarray(0, 3).toString(), 'ID3');
  }
});

test('six background tracks are distinct and have safe playable note timing', () => {
  assert.equal(new Set(BACKGROUND_MUSIC.map(track => track.notes.join(','))).size, 6);
  for (const track of BACKGROUND_MUSIC) {
    assert.equal(track.notes.length, track.beats.length);
    assert.ok(track.beats.every(beat => beat > 0));
    assert.ok(track.notes.every(note => note === 0 || (note >= 60 && note <= 84)));
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addHarvestFruit, homeQuickGames, normalizePlayMemory, recordGameVisit } from './playMemory';
import { availableFriendStories, FRIEND_STORIES } from '../data/friendDay';
import { availableGameIds } from '../data/gameCatalog';
import { translateSpeech } from './speechLanguage';

test('corrupt play memories cannot inject unknown games, invalid colors, or unbounded counts', () => {
  const memory = normalizePlayMemory({ recentGames: ['bad-game', 'feeding', 'feeding'], visits: { feeding: Infinity, cake_deco: 2e8, secret: 2 },
    favoriteColor: { hex: 'url(https://example.com)', label: '색깔' }, latestCake: { title: '케이크', colors: ['red'] }, fruitBasket: null });
  assert.deepEqual(memory.recentGames, ['feeding']);
  assert.deepEqual(memory.visits, { cake_deco: 99999 });
  assert.equal(memory.favoriteColor, undefined);
  assert.equal(memory.latestCake, undefined);
  assert.deepEqual(normalizePlayMemory(null).fruitBasket, []);
});

test('actual harvested fruit is unique and bounded, while creative keepsakes survive visits', () => {
  let memory = normalizePlayMemory({ latestCake: { title: '내 케이크', colors: ['#f472b6'], toppings: ['🍓'] } });
  for (let i = 0; i < 9; i++) memory = addHarvestFruit(memory, { id: `apple-${i}`, kind: 'apple', label: '사과' });
  assert.equal(memory.fruitBasket.length, 6);
  assert.equal(memory.fruitBasket[0].id, 'apple-3');
  assert.equal(addHarvestFruit(memory, memory.fruitBasket[0]), memory);
  memory = recordGameVisit(memory, 'feeding', 'pingu');
  memory = recordGameVisit(memory, 'cake_deco', 'pingu');
  memory = recordGameVisit(memory, 'feeding', 'pingu');
  assert.deepEqual(memory.recentGames, ['feeding', 'cake_deco']);
  assert.equal(memory.visits.feeding, 2);
  assert.equal(memory.latestCake?.toppings[0], '🍓');
});

test('quick shelf has no disabled games or duplicate entries and leaves the catalog untouched', () => {
  const available = availableGameIds('sprout', ['feeding']);
  const snapshot = [...available];
  const memory = normalizePlayMemory({ recentGames: ['feeding', 'cake_deco', 'fruit_harvest'], visits: { feeding: 9, fruit_harvest: 5 } });
  const quick = homeQuickGames(memory, available);
  assert.equal(quick[0], 'cake_deco');
  assert.equal(quick[1], 'fruit_harvest');
  assert.equal(quick.length, 3);
  assert.equal(new Set(quick).size, 3);
  assert.ok(!quick.includes('feeding'));
  assert.deepEqual(available, snapshot);
  assert.deepEqual(homeQuickGames(memory, []), []);
});

test('all three story routes use available games and parent exclusions cannot be bypassed', () => {
  assert.equal(FRIEND_STORIES.length, 3);
  for (const age of ['baby', 'sprout', 'bloom', 'star'] as const) {
    const allowed = availableGameIds(age);
    for (const story of availableFriendStories(age)) {
      assert.equal(story.steps.length, 3);
      assert.ok(story.steps.every(step => allowed.includes(step.gameId)));
    }
  }
  assert.ok(!availableFriendStories('sprout', ['cake_deco']).some(story => story.id === 'birthday'));
  assert.deepEqual(availableFriendStories('sprout', ['feeding']), []);
});

test('connected play speech retains meaningful English in the parent language option', () => {
  assert.equal(translateSpeech('네가 딴 사과야! 맛있어!'), 'You picked this apple! Yummy!');
  assert.ok(translateSpeech('네가 고른 색 이불이야. 보들보들, 따뜻해.')?.includes('blanket'));
  for (const story of FRIEND_STORIES) assert.ok(translateSpeech(story.closing));
});

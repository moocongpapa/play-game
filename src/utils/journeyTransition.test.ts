import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createJourneyTransition } from './journeyTransition';
import { PLAY_JOURNEY_SPEECH } from '../data/playJourneySpeech';
import { translateSpeech } from './speechLanguage';
const clock = { setTimeout: (run: () => void, ms: number) => setTimeout(run, ms) as unknown as number, clearTimeout: (id: number) => clearTimeout(id) };

test('scene changes wait for speech, including a manual next tap during praise', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let spoken = false, scenes = 0;
  const transition = createJourneyTransition(() => scenes++, 1000, () => spoken, clock);
  transition.resume(); t.mock.timers.tick(2000);
  assert.equal(scenes, 0);
  transition.advance(); t.mock.timers.tick(150);
  assert.equal(scenes, 0, 'an eager tap must not cut off the voice');
  spoken = true; t.mock.timers.tick(150);
  assert.equal(scenes, 1);
  transition.resume(); transition.advance(); t.mock.timers.tick(1800);
  assert.equal(scenes, 1, 'a scene transition can only be consumed once');
});

test('playing with collected toys restarts the full finale interval, and leaving cancels it', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let episodes = 0;
  const transition = createJourneyTransition(() => episodes++, 1800, () => true, clock);
  transition.resume(); t.mock.timers.tick(1700);
  transition.pause(); t.mock.timers.tick(60000);
  assert.equal(episodes, 0, 'a held finger or a hidden tab never advances');
  transition.resume(); t.mock.timers.tick(1799);
  assert.equal(episodes, 0);
  t.mock.timers.tick(1); assert.equal(episodes, 1);
  const abandoned = createJourneyTransition(() => episodes++, 1000, () => true, clock);
  abandoned.resume(); abandoned.dispose(); abandoned.resume(); abandoned.advance();
  t.mock.timers.tick(60000); assert.equal(episodes, 1, 'home and play-limit unmounts cancel all pending work');
});

test('pausing invalidates stale callbacks even if a timer was already queued', () => {
  const callbacks: (() => void)[] = [];
  let changes = 0;
  const transition = createJourneyTransition(() => changes++, 10, () => true, { setTimeout: run => callbacks.push(run), clearTimeout: () => {} });
  transition.resume(); transition.pause(); callbacks[0](); assert.equal(changes, 0);
  transition.resume(); transition.dispose(); callbacks[1](); assert.equal(changes, 0);
});

test('every new story line has an authored English version', () => {
  for (const [ko, en] of PLAY_JOURNEY_SPEECH) {
    assert.equal(translateSpeech(ko.replace('{0}', '사과')), en.replace('{0}', 'apple'));
  }
});

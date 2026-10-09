import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppState } from '../types';
import { createChildProfile, refreshChildProfile } from './ageEngine';
import { advancePlayTime, createForegroundClock, localPlayDate, refreshPlaySession, restartPlayTimer } from './playSession';

const today = new Date(2026, 9, 9, 12);
const saved = (): AppState => ({
  stars: 0, unlockedStickers: [], placedStickers: [], selectedCharacter: 'jelly',
  soundEnabled: true, bgmEnabled: true, bgmVolume: .15, sfxVolume: 1,
  ttsEnabled: true, speechLanguage: 'en', onboardingCompleted: true,
  playDate: localPlayDate(today), playTimeSeconds: 600, timerStartedAtSeconds: 0,
  timerMinutes: 10, isTimeUp: true, completedGames: { feeding: 12 },
  childProfile: createChildProfile('유하', '2023-01-03', today),
});

test('daily lock survives same-day reload but releases next day and migrates undated totals', () => {
  const state = saved();
  assert.equal(refreshPlaySession(state, today), state);
  for (const old of [state, { ...state, playDate: undefined } as AppState]) {
    const next = refreshPlaySession(old, new Date(2026, 9, 10, 0, 0, 1));
    assert.equal(next.isTimeUp, false);
    assert.equal(next.playTimeSeconds, 0);
    assert.equal(next.timerStartedAtSeconds, 0);
    assert.deepEqual(next.completedGames, { feeding: 12 });
  }
});

test('choosing the same timer grants a fresh allowance without erasing daily play history', () => {
  let state = restartPlayTimer(saved(), 10, today);
  state = advancePlayTime(state, 1, today);
  assert.equal(state.playTimeSeconds, 601);
  assert.equal(state.isTimeUp, false);
  state = advancePlayTime(state, 598.5, today);
  assert.equal(state.isTimeUp, false);
  state = advancePlayTime(state, .5, today);
  assert.equal(state.isTimeUp, true);
  assert.equal(state.playTimeSeconds, 1200);
  assert.equal(restartPlayTimer(state, 0, today).isTimeUp, false);
});

test('foreground clock excludes background time and retains visible fractions', () => {
  let now = 0, active = true;
  const sample = createForegroundClock(() => now, () => active);
  now = 1000; assert.equal(sample(), 1);
  now = 1250; active = false; assert.equal(sample(), .25);
  now = 601250; assert.equal(sample(), 0);
  active = true; assert.equal(sample(), 0);
  now += 750; assert.equal(sample(), .75);
});

test('persisted age refreshes across the birthday and uses local calendar days', () => {
  const before = createChildProfile('유하', '2023-01-03', new Date(2027, 0, 2, 23, 59));
  assert.equal(before.ageMonths, 47);
  assert.equal(before.ageGroup, 'sprout');
  const after = refreshChildProfile(before, new Date(2027, 0, 3));
  assert.equal(after.ageMonths, 48);
  assert.equal(after.ageGroup, 'bloom');
  const resumed = refreshPlaySession({ ...saved(), childProfile: before }, new Date(2027, 0, 3));
  assert.equal(resumed.childProfile.ageGroup, 'bloom');
  assert.equal(localPlayDate(new Date(2026, 9, 9, 0, 1)), '2026-10-09');
});

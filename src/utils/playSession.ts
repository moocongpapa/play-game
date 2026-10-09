import type { AppState } from '../types';
import { refreshChildProfile } from './ageEngine';

export function localPlayDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Undated legacy totals cannot safely be treated as today's allowance. */
export function refreshPlaySession(state: AppState, now = new Date()): AppState {
  const playDate = localPlayDate(now);
  const childProfile = refreshChildProfile(state.childProfile, now);
  if (state.playDate !== playDate) {
    return { ...state, childProfile, playDate, playTimeSeconds: 0, timerStartedAtSeconds: 0, isTimeUp: false };
  }
  return childProfile === state.childProfile ? state : { ...state, childProfile };
}

export function advancePlayTime(state: AppState, elapsedSeconds: number, now = new Date()): AppState {
  const current = refreshPlaySession(state, now);
  if (current.isTimeUp || elapsedSeconds <= 0) return current;
  const playTimeSeconds = Math.round((current.playTimeSeconds + elapsedSeconds) * 1000) / 1000;
  const isTimeUp = current.timerMinutes > 0 && playTimeSeconds - current.timerStartedAtSeconds >= current.timerMinutes * 60;
  return { ...current, playTimeSeconds, isTimeUp };
}

export function restartPlayTimer(state: AppState, timerMinutes: number, now = new Date()): AppState {
  const current = refreshPlaySession(state, now);
  return { ...current, timerMinutes, timerStartedAtSeconds: current.playTimeSeconds, isTimeUp: false };
}

/** Sample before switching visibility so the last visible fraction is retained. */
export function createForegroundClock(now: () => number, isActive: () => boolean) {
  let previous = now();
  let active = isActive();
  return () => {
    const instant = now();
    const seconds = active ? Math.max(0, instant - previous) / 1000 : 0;
    previous = instant;
    active = isActive();
    return seconds;
  };
}

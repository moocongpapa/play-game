import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterId } from '../types';
import { adaptiveHelpLevel, type HelpLevel } from '../utils/adaptiveHelp';
import { useGameActivity } from './useGameActivity';
import { useGameTimeouts } from './useGameTimeouts';
import { useIdleScaffolding } from './useIdleScaffolding';

type Options = {
  resetKey: string | number;
  disabled?: boolean;
  voice?: { text: string; buddy: CharacterId; soundEnabled: boolean };
};
type Effort = { key: string | number; misses: number; idleLevel: HelpLevel };

/** Gradual, local help. Touching, waiting or missing never awards an answer. */
export function useAdaptiveHelp({ resetKey, disabled = false, voice }: Options) {
  const activity = useGameActivity();
  const inactive = disabled || activity.paused;
  const [effort, setEffort] = useState<Effort>({ key: resetKey, misses: 0, idleLevel: 0 });
  const current = useRef({ resetKey, disabled });
  current.current = { resetKey, disabled };
  const idle = useIdleScaffolding({ resetKey, disabled: inactive, voice });
  const { scheduleGameTimeout, cancelGameTimeout } = useGameTimeouts();

  useEffect(() => {
    if (!idle.isIdle || inactive) return;
    setEffort(previous => ({
      key: resetKey,
      misses: previous.key === resetKey ? previous.misses : 0,
      idleLevel: Math.max(previous.key === resetKey ? previous.idleLevel : 0, 1) as HelpLevel,
    }));
    // The second step needs another quiet spell: a held finger, hidden tab or
    // parent settings screen cannot quietly make the question easier.
    const timer = scheduleGameTimeout(() => {
      setEffort(previous => ({
        key: resetKey,
        misses: previous.key === resetKey ? previous.misses : 0,
        idleLevel: 2,
      }));
    }, 4000);
    return () => cancelGameTimeout(timer);
  }, [idle.isIdle, inactive, resetKey, scheduleGameTimeout, cancelGameTimeout]);

  const recordMiss = useCallback(() => {
    if (current.current.disabled || activity.isBlocked()) return;
    const key = current.current.resetKey;
    setEffort(previous => ({
      key,
      misses: (previous.key === key ? previous.misses : 0) + 1,
      idleLevel: previous.key === key ? previous.idleLevel : 0,
    }));
  }, [activity.isBlocked]);

  const reset = useCallback(() => {
    setEffort({ key: current.current.resetKey, misses: 0, idleLevel: 0 });
    idle.reset();
  }, [idle.reset]);

  const level = inactive || effort.key !== resetKey ? 0 : adaptiveHelpLevel(effort.misses, effort.idleLevel);
  return { level, isIdle: idle.isIdle, recordMiss, reset, resetIdle: idle.reset, blocked: inactive, isBlocked: activity.isBlocked };
}

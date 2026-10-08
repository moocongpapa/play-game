import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import type { CharacterId } from '../types';
import { createIdleScaffolding } from '../utils/idleScaffolding';
import { trySpeakIdleHint } from '../utils/soundEngine';

type Options = {
  resetKey: string | number;
  disabled?: boolean;
  voice?: { text: string; buddy: CharacterId; soundEnabled: boolean };
};

export function useIdleScaffolding({ resetKey, disabled = false, voice }: Options) {
  const paused = useContext(PlayHintsPausedContext);
  const inactive = disabled || paused;
  const [idleKey, setIdleKey] = useState<string | number | null>(null);
  const controller = useRef<ReturnType<typeof createIdleScaffolding> | null>(null);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  useEffect(() => {
    setIdleKey(null);
    if (inactive) return;
    let voiceTimer: number | undefined;
    const clearVoice = () => { window.clearTimeout(voiceTimer); voiceTimer = undefined; };
    const offerVoice = () => {
      if (!help.isIdle()) return;
      const guide = voiceRef.current;
      // Retry only while still idle: never interrupt a question or a recorded animal clue.
      if (guide && !trySpeakIdleHint(guide.text, guide.soundEnabled, guide.buddy)) {
        voiceTimer = window.setTimeout(offerVoice, 500);
      }
    };
    const help = createIdleScaffolding(idle => {
      setIdleKey(idle ? resetKey : null);
      clearVoice();
      if (idle) offerVoice();
    }, { setTimeout: (run, ms) => window.setTimeout(run, ms), clearTimeout: id => window.clearTimeout(id) });
    controller.current = help;
    const pointers = new Set<number>();
    const down = (event: PointerEvent) => { pointers.add(event.pointerId); help.pause('pointer'); };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (!pointers.size) help.resume('pointer');
    };
    const activity = () => help.reset();
    const blur = () => { help.pause('blur'); pointers.clear(); help.resume('pointer'); };
    const focus = () => help.resume('blur');
    const visibility = () => {
      if (document.hidden) { help.pause('hidden'); pointers.clear(); help.resume('pointer'); }
      else help.resume('hidden');
    };
    visibility();
    if (!document.hasFocus()) help.pause('blur');
    const passiveCapture = { capture: true, passive: true };
    document.addEventListener('pointerdown', down, passiveCapture);
    document.addEventListener('pointerup', up, passiveCapture);
    document.addEventListener('pointercancel', up, passiveCapture);
    document.addEventListener('click', activity, passiveCapture);
    document.addEventListener('keydown', activity, passiveCapture);
    document.addEventListener('scroll', activity, passiveCapture);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    return () => {
      help.dispose(); clearVoice(); controller.current = null;
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('click', activity, true);
      document.removeEventListener('keydown', activity, true);
      document.removeEventListener('scroll', activity, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
    };
  }, [resetKey, inactive]);

  const reset = useCallback(() => controller.current?.reset(), []);
  return { isIdle: !inactive && idleKey === resetKey, reset };
}

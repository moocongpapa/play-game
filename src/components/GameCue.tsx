import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { CharacterId } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { subscribeSpeechState } from '../utils/soundEngine';
import { subscribeCombo, subscribeJuice } from '../utils/juice';

/** A familiar friend is the replay control; no reading or separate banner needed. */
export function GameCue({ buddy, onReplay, disabled = false, happy = false, label = '놀이 안내 다시 듣기' }: {
  buddy: CharacterId; onReplay: () => void; disabled?: boolean; happy?: boolean; label?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [speaking, setSpeaking] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [hopping, setHopping] = useState(false);
  const [excited, setExcited] = useState(false);

  useEffect(() => {
    let celebrateTimer: ReturnType<typeof setTimeout> | undefined;
    let hopTimer: ReturnType<typeof setTimeout> | undefined;
    let lastMove = 0;

    const unsubSpeech = subscribeSpeechState(({ speaking: active }) => setSpeaking(active));
    const unsubCombo = subscribeCombo(({ combo, fever }) => setExcited(fever || combo >= 2));
    const unsubJuice = subscribeJuice((impact) => {
      if (impact.kind === 'success') {
        clearTimeout(celebrateTimer);
        setCelebrating(true);
        celebrateTimer = setTimeout(() => setCelebrating(false), 1800);
      } else if (impact.kind === 'snap' || impact.kind === 'pop') {
        clearTimeout(hopTimer);
        setHopping(true);
        hopTimer = setTimeout(() => setHopping(false), 320);
      }
    });

    const onPointer = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastMove < 40) return;
      lastMove = now;
      const node = btnRef.current;
      if (!node || document.hidden) return;
      const rect = node.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / 260));
      const dy = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / 260));
      node.style.setProperty('--cue-lean-x', `${(dx * 3.5).toFixed(2)}px`);
      node.style.setProperty('--cue-lean-y', `${(dy * 2.5).toFixed(2)}px`);
      node.style.setProperty('--cue-tilt', `${(dx * 5.5).toFixed(2)}deg`);
    };

    document.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerdown', onPointer, { passive: true });

    return () => {
      clearTimeout(celebrateTimer);
      clearTimeout(hopTimer);
      unsubSpeech();
      unsubCombo();
      unsubJuice();
      document.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const mood = celebrating
    ? 'dancing'
    : speaking
    ? 'talking'
    : happy || hopping || excited
    ? 'happy'
    : 'waving';

  return (
    <button
      ref={btnRef}
      type="button"
      className="game-cue"
      data-speaking={speaking || undefined}
      data-celebrating={celebrating || undefined}
      data-hopping={hopping || undefined}
      data-excited={excited || undefined}
      aria-label={label}
      disabled={disabled}
      onClick={onReplay}
    >
      <span className="game-cue-avatar">
        <CharacterAvatar id={buddy} size="sm" mood={mood} />
      </span>
      <Volume2 className="game-cue-speaker" aria-hidden="true" />
    </button>
  );
}

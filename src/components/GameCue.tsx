import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { CharacterId } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { subscribeSpeechState } from '../utils/soundEngine';
import { subscribeJuice } from '../utils/juice';

/** A familiar friend is the replay control; no reading or separate banner needed. */
export function GameCue({ buddy, onReplay, disabled = false, happy = false, label = '놀이 안내 다시 듣기' }: {
  buddy: CharacterId; onReplay: () => void; disabled?: boolean; happy?: boolean; label?: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubSpeech = subscribeSpeechState(({ speaking: active }) => setSpeaking(active));
    const unsubJuice = subscribeJuice((impact) => {
      if (impact.kind === 'success') {
        clearTimeout(timer);
        setCelebrating(true);
        timer = setTimeout(() => setCelebrating(false), 1800);
      }
    });
    return () => {
      clearTimeout(timer);
      unsubSpeech();
      unsubJuice();
    };
  }, []);
  return <button type="button" className="game-cue" data-speaking={speaking || undefined} data-celebrating={celebrating || undefined} aria-label={label} disabled={disabled} onClick={onReplay}>
    <CharacterAvatar id={buddy} size="sm" mood={celebrating ? 'dancing' : speaking ? 'talking' : happy ? 'happy' : 'still'} />
    <Volume2 className="game-cue-speaker" aria-hidden="true" />
  </button>;
}

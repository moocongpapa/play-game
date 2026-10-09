import { Volume2 } from 'lucide-react';
import type { CharacterId } from '../types';
import { CharacterAvatar } from './CharacterAvatar';

/** A familiar friend is the replay control; no reading or separate banner needed. */
export function GameCue({ buddy, onReplay, disabled = false, happy = false, label = '놀이 안내 다시 듣기' }: {
  buddy: CharacterId; onReplay: () => void; disabled?: boolean; happy?: boolean; label?: string;
}) {
  return <button type="button" className="game-cue" aria-label={label} disabled={disabled} onClick={onReplay}>
    <CharacterAvatar id={buddy} size="sm" mood={happy ? 'happy' : 'still'} />
    <Volume2 className="game-cue-speaker" aria-hidden="true" />
  </button>;
}

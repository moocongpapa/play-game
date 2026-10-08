import { useEffect, useState } from 'react';
import { Volume2, RefreshCw } from 'lucide-react';
import { RoundContinuation } from '../../components/RoundContinuation';
import { PlayResultScene } from '../../components/PlayResultScene';
import { DragMatch, DragPiece, DropSlot, DragHint } from '../../components/DragMatch';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { ToyArtwork } from '../../components/ToyArtwork';
import { PLAY_THEMES } from '../../data/playThemes';
import { CHARACTERS } from '../../data/characters';
import { pickNextRound, shuffle } from '../../utils/roundDeck';
import { getDifficultyConfig, getAgeGroupLabel } from '../../utils/ageEngine';
import { speakText, playCorrectFanfare, playWrongBoing, playStarGain } from '../../utils/soundEngine';
import type { AgeGroup, CharacterId } from '../../types';

interface CardItem { id: string; emoji: string; name: string }
interface MemoryCardGameProps {
  buddy: CharacterId; onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean; ageGroup: AgeGroup; childName: string;
}

export function MemoryCardGame({ buddy, onCompleteQuiz, soundEnabled, ageGroup, childName }: MemoryCardGameProps) {
  const friend = CHARACTERS[buddy];
  const pairCount = ageGroup === 'baby' ? 2 : ageGroup === 'sprout' ? 3 : 4;
  const [themeName, setThemeName] = useState('');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [pieces, setPieces] = useState<CardItem[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const isCompleted = cards.length > 0 && matched.length === cards.length;
  const guide = '아래 그림을 잡아서 똑같은 그림 위에 쏙 올려 주세요!';

  const startNewGame = () => {
    const theme = pickNextRound(PLAY_THEMES, 'memory:themes');
    const picked = shuffle(theme.items).slice(0, pairCount);
    setThemeName(theme.name);
    setCards(picked);
    setPieces(shuffle(picked));
    setMatched([]);
    setRound(previous => previous + 1);
    speakText(`${friend.name}와 짝꿍 놀이! ${guide}`, soundEnabled, { characterId: buddy });
  };
  useEffect(() => { startNewGame(); }, [ageGroup]);

  const matchPair = (pieceId: string, targetId: string) => {
    if (isCompleted || matched.includes(pieceId) || matched.includes(targetId)) return false;
    if (pieceId !== targetId) {
      playWrongBoing(soundEnabled);
      speakText('괜찮아! 똑같은 그림을 찾아 옮겨 볼까?', soundEnabled, { characterId: buddy });
      return false;
    }
    const next = [...matched, pieceId];
    setMatched(next);
    if (next.length === cards.length) {
      playCorrectFanfare(soundEnabled);
      speakText(`와! ${childName}야, 그림 친구들이 모두 짝꿍을 찾았어!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(getDifficultyConfig(ageGroup).starsPerCorrect + 1);
    } else {
      playStarGain(soundEnabled);
      speakText(`${cards.find(card => card.id === pieceId)?.name} 짝꿍을 찾았어!`, soundEnabled, { characterId: buddy });
    }
    return true;
  };

  const nextCard = cards.find(card => !matched.includes(card.id));
  return <DragMatch onDrop={matchPair} resetKey={round} disabled={isCompleted} hint={nextCard ? { pieceId: nextCard.id, targetId: nextCard.id } : undefined}>
    <div className="game-board flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA726] flex items-center gap-3">
        <CharacterAvatar id={buddy} size="md" mood={isCompleted ? 'happy' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-black text-[#E65100]">{friend.badge} {getAgeGroupLabel(ageGroup)} · {themeName}</span>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D]">같은 그림 위에 쏙!</h2>
        </div>
        <button aria-label="놀이 안내 다시 듣기" onClick={() => speakText(guide, soundEnabled, { characterId: buddy })} className="p-3 bg-white rounded-full text-orange-600"><Volume2 /></button>
      </div>
      {isCompleted ? <PlayResultScene kind="train" buddy={buddy} toys={cards.map(card => card.emoji)} /> : <div className="matching-playmat">
        <div className="matching-row" style={{ '--match-columns': pairCount } as React.CSSProperties}>
          {cards.map(card => <DropSlot key={card.id} id={card.id} label={card.name} filled={matched.includes(card.id)} className="matching-pocket">
            <ToyArtwork emoji={card.emoji} />
            <span className="matching-label">{card.name}</span>
          </DropSlot>)}
        </div>
        <DragHint />
        <div className="matching-row matching-source-row" style={{ '--match-columns': pairCount } as React.CSSProperties}>
          {pieces.map(card => <DragPiece key={card.id} id={card.id} label={card.name} disabled={matched.includes(card.id)}
            className={`matching-tile ${matched.includes(card.id) ? 'piece-placed' : ''}`}>
            <ToyArtwork emoji={card.emoji} />
          </DragPiece>)}
        </div>
        <div className="matching-progress" aria-label={`${matched.length}쌍 완성, 모두 ${pairCount}쌍`}>{cards.map(card => <span key={card.id} data-done={matched.includes(card.id)} />)}</div>
      </div>}
      {isCompleted ? <RoundContinuation onNext={startNewGame} delayMs={5500} /> :
        <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={startNewGame}><RefreshCw className="w-5 h-5 mr-2" /> 다른 그림</JellyButton>}
    </div>
  </DragMatch>;
}

import { GameCue } from '../../components/GameCue';
import { useEffect, useRef, useState } from 'react';
import { Eye, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { RoundContinuation } from '../../components/RoundContinuation';
import { PlayResultScene } from '../../components/PlayResultScene';
import { JellyButton } from '../../components/JellyButton';
import { ToyArtwork } from '../../components/ToyArtwork';
import { PLAY_THEMES } from '../../data/playThemes';
import { CHARACTERS } from '../../data/characters';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { pickNextRound, shuffle } from '../../utils/roundDeck';
import { getDifficultyConfig } from '../../utils/ageEngine';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing, playStarGain } from '../../utils/soundEngine';
import { emitJuice, JUICE_SPRING } from '../../utils/juice';
import { fireStarExplosion } from '../../utils/confetti';
import type { AgeGroup, CharacterId } from '../../types';

interface CardItem {
  id: string;
  emoji: string;
  name: string;
}

interface DeckCard {
  uid: string;
  item: CardItem;
}

interface MemoryCardGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

const CARD_BACK_PALETTES = [
  'from-[#FF9A9E] to-[#FECFEF] border-[#FF6B8B]',
  'from-[#A1C4FD] to-[#C2E9FB] border-[#60A5FA]',
  'from-[#FBC2EB] to-[#A6C1EE] border-[#C084FC]',
  'from-[#F6D365] to-[#FDA085] border-[#FBBF24]',
];

export function MemoryCardGame({ buddy, onCompleteQuiz, soundEnabled, ageGroup, childName }: MemoryCardGameProps) {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pairCount = ageGroup === 'baby' ? 2 : ageGroup === 'sprout' ? 3 : 4;

  const [pairs, setPairs] = useState<CardItem[]>([]);
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [peeking, setPeeking] = useState(false);
  const [mismatchUids, setMismatchUids] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const busyRef = useRef(false);

  const isCompleted = pairs.length > 0 && matchedIds.length === pairs.length;
  const guide = '카드를 톡 뒤집어서 똑같은 그림 짝꿍을 찾아 주세요!';

  const startNewGame = () => {
    clearGameTimeouts();
    busyRef.current = false;
    const theme = pickNextRound(PLAY_THEMES, 'memory:themes');
    const picked = shuffle(theme.items).slice(0, pairCount);
    const cards: DeckCard[] = shuffle(
      picked.flatMap((item, idx) => [
        { uid: `${item.id}-a-${idx}`, item },
        { uid: `${item.id}-b-${idx}`, item },
      ]),
    );
    setPairs(picked);
    setDeck(cards);
    setFlippedUids([]);
    setMatchedIds([]);
    setMismatchUids([]);
    setPeeking(true);
    setRound((previous) => previous + 1);

    speakText(`${friend.name}와 짝꿍 놀이! ${guide}`, soundEnabled, { characterId: buddy });
    scheduleGameTimeout(() => {
      setPeeking(false);
    }, ageGroup === 'baby' ? 2100 : 1650);
  };

  useEffect(() => {
    startNewGame();
    return () => clearGameTimeouts();
  }, [ageGroup]);

  const handlePeekHint = () => {
    if (peeking || isCompleted || busyRef.current) return;
    setPeeking(true);
    playBubblePop(soundEnabled);
    scheduleGameTimeout(() => {
      setPeeking(false);
    }, 1200);
  };

  const handleFlipCard = (card: DeckCard, event: React.MouseEvent<HTMLButtonElement>) => {
    if (
      peeking ||
      isCompleted ||
      busyRef.current ||
      matchedIds.includes(card.item.id) ||
      flippedUids.includes(card.uid)
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    emitJuice({ kind: 'pop', x: cx, y: cy });
    playBubblePop(soundEnabled);

    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length < 2) {
      return;
    }

    busyRef.current = true;
    const [firstUid, secondUid] = nextFlipped;
    const firstCard = deck.find((c) => c.uid === firstUid);
    const secondCard = deck.find((c) => c.uid === secondUid);

    if (!firstCard || !secondCard) {
      busyRef.current = false;
      setFlippedUids([]);
      return;
    }

    if (firstCard.item.id === secondCard.item.id) {
      // Pair matched!
      const nextMatched = [...matchedIds, firstCard.item.id];
      setMatchedIds(nextMatched);
      setFlippedUids([]);
      busyRef.current = false;

      emitJuice({ kind: 'success', x: cx, y: cy });
      fireStarExplosion({ x: cx / window.innerWidth, y: cy / window.innerHeight });

      if (nextMatched.length === pairs.length) {
        playCorrectFanfare(soundEnabled);
        speakText(`와! ${childName}야, 그림 친구들이 모두 짝꿍을 찾았어!`, soundEnabled, { characterId: buddy });
        onCompleteQuiz(getDifficultyConfig(ageGroup).starsPerCorrect + 1);
      } else {
        playStarGain(soundEnabled);
        speakText(`${firstCard.item.name} 짝꿍을 찾았어!`, soundEnabled, { characterId: buddy });
      }
    } else {
      // Gentle mismatch wobble, then flip back
      setMismatchUids([firstUid, secondUid]);
      playWrongBoing(soundEnabled);
      speakText('괜찮아! 똑같은 그림을 찾아 옮겨 볼까?', soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => {
        setFlippedUids([]);
        setMismatchUids([]);
        busyRef.current = false;
      }, 880);
    }
  };

  const columns = pairCount === 2 ? 2 : pairCount === 3 ? 3 : 4;
  const paletteClass = CARD_BACK_PALETTES[round % CARD_BACK_PALETTES.length];

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(guide, soundEnabled, { characterId: buddy })} />

      {isCompleted ? (
        <PlayResultScene kind="train" buddy={buddy} toys={pairs.map((card) => card.emoji)} />
      ) : (
        <div className="w-full flex flex-col items-center gap-3 my-2 px-1">
          {/* Grid of 3D Flip Cards */}
          <div
            data-play-area
            className="grid gap-3 sm:gap-4 w-full place-items-center"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {deck.map((card, index) => {
              const isMatched = matchedIds.includes(card.item.id);
              const isFaceUp = peeking || isMatched || flippedUids.includes(card.uid);
              const isMismatched = mismatchUids.includes(card.uid);

              return (
                <motion.button
                  key={card.uid}
                  type="button"
                  aria-label={isFaceUp ? `${card.item.name} 카드` : `${index + 1}번 뒤집힌 카드`}
                  aria-pressed={isFaceUp}
                  disabled={isMatched}
                  whileTap={{ scale: 0.92 }}
                  animate={
                    isMismatched
                      ? { x: [-8, 8, -6, 6, 0] }
                      : isMatched
                      ? { scale: [1, 1.12, 1], y: [0, -6, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={isMismatched ? { duration: 0.45 } : JUICE_SPRING}
                  onClick={(e) => handleFlipCard(card, e)}
                  style={{ perspective: 900 }}
                  className="relative w-full aspect-[4/4.4] max-w-[148px] cursor-pointer select-none touch-manipulation focus:outline-none"
                >
                  <motion.div
                    initial={false}
                    animate={{ rotateY: isFaceUp ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative w-full h-full"
                  >
                    {/* Card Back (Face Down) */}
                    <div
                      style={{ backfaceVisibility: 'hidden' }}
                      className={`absolute inset-0 rounded-3xl border-4 bg-gradient-to-br ${paletteClass} shadow-[inset_0_4px_0_rgba(255,255,255,0.65),0_7px_0_rgba(0,0,0,0.12),0_12px_20px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/35 border-2 border-white/70 flex items-center justify-center shadow-inner">
                        <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-xs" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Card Front (Face Up) */}
                    <div
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      className={`absolute inset-0 rounded-3xl border-4 flex flex-col items-center justify-center p-2 shadow-[inset_0_4px_0_#ffffff,0_7px_0_rgba(0,0,0,0.1),0_12px_20px_rgba(0,0,0,0.1)] ${
                        isMatched
                          ? 'bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] border-[#34D399] ring-4 ring-[#FDE047]/70'
                          : 'bg-gradient-to-b from-white to-[#FFFDF7] border-[#FDE68A]'
                      }`}
                    >
                      <span className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center drop-shadow-sm">
                        <ToyArtwork emoji={card.item.emoji} />
                      </span>
                      {isMatched && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#F59E0B] text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-sm"
                        >
                          ★
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          {/* Progress Dots */}
          <div className="matching-progress mt-1" aria-label={`${matchedIds.length}쌍 완성, 모두 ${pairCount}쌍`}>
            {pairs.map((card) => (
              <span key={card.id} data-done={matchedIds.includes(card.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-center gap-3 w-full mt-1">
        {isCompleted ? (
          <RoundContinuation onNext={startNewGame} />
        ) : (
          <>
            <JellyButton soundEnabled={soundEnabled} variant="yellow" size="md" onClick={handlePeekHint} className="!px-4">
              <Eye className="w-6 h-6" aria-hidden="true" />
              <span className="sr-only">살짝 보기 힌트</span>
            </JellyButton>
            <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={startNewGame} className="!px-4">
              <RefreshCw className="w-6 h-6" aria-hidden="true" />
              <span className="sr-only">다른 그림</span>
            </JellyButton>
          </>
        )}
      </div>
    </div>
  );
}

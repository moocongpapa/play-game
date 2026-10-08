import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CharacterId } from '../types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { playJellyTap, playBouncyBoing, playSparkleChime, speakText, playBubblePop } from '../utils/soundEngine';
import { Sparkles, Trash2, Home, Volume2, RefreshCw } from 'lucide-react';

interface BugGardenScreenProps {
  buddy: CharacterId;
  childName: string;
  onGoHome: () => void;
  soundEnabled: boolean;
}

export interface BugType {
  id: string;
  name: string;
  emoji: string;
  soundName: string;
  voiceDesc: string;
  defaultSpeed: number; // movement speed multiplier
  crawlStyle: 'crawl' | 'fly' | 'hop';
  color: string;
}

export const BUG_TYPES: BugType[] = [
  {
    id: 'ladybug',
    name: '무당벌레',
    emoji: '🐞',
    soundName: '무당벌레가 뽈뽈 기어가요!',
    voiceDesc: '빨간 날개에 까만 점박이 무당벌레야!',
    defaultSpeed: 1.0,
    crawlStyle: 'crawl',
    color: '#FF4D4D',
  },
  {
    id: 'butterfly',
    name: '나비',
    emoji: '🦋',
    soundName: '나비가 팔랑팔랑 날아가요!',
    voiceDesc: '하늘하늘 날아다니는 예쁜 나비야!',
    defaultSpeed: 1.3,
    crawlStyle: 'fly',
    color: '#4DA6FF',
  },
  {
    id: 'caterpillar',
    name: '애벌레',
    emoji: '🐛',
    soundName: '애벌레가 꼬물꼬물 움직여요!',
    voiceDesc: '초록초록 꼬물거리는 귀여운 애벌레야!',
    defaultSpeed: 0.6,
    crawlStyle: 'crawl',
    color: '#52C41A',
  },
  {
    id: 'bee',
    name: '꿀벌',
    emoji: '🐝',
    soundName: '꿀벌이 윙윙 춤을 춰요!',
    voiceDesc: '달콤한 꿀을 찾는 부지런한 꿀벌이야!',
    defaultSpeed: 1.4,
    crawlStyle: 'fly',
    color: '#FAAD14',
  },
  {
    id: 'snail',
    name: '달팽이',
    emoji: '🐌',
    soundName: '달팽이가 느릿느릿 걸어가요!',
    voiceDesc: '둥글둥글 집을 등에 진 아기 달팽이야!',
    defaultSpeed: 0.4,
    crawlStyle: 'crawl',
    color: '#D48806',
  },
  {
    id: 'beetle',
    name: '풍뎅이',
    emoji: '🪲',
    soundName: '풍뎅이가 씩씩하게 걸어가요!',
    voiceDesc: '반짝반짝 힘이 센 멋쟁이 풍뎅이야!',
    defaultSpeed: 0.9,
    crawlStyle: 'crawl',
    color: '#13C2C2',
  },
  {
    id: 'ant',
    name: '개미',
    emoji: '🐜',
    soundName: '개미가 바쁘게 총총 걸어요!',
    voiceDesc: '부지런히 걸어가는 꼬마 개미야!',
    defaultSpeed: 1.2,
    crawlStyle: 'crawl',
    color: '#722ED1',
  },
  {
    id: 'cricket',
    name: '귀뚜라미',
    emoji: '🦗',
    soundName: '귀뚜라미가 퐁퐁 뛰어요!',
    voiceDesc: '폴짝폴짝 높이 뛰는 귀뚜라미야!',
    defaultSpeed: 1.1,
    crawlStyle: 'hop',
    color: '#7CB305',
  },
];

interface ActiveBug {
  uid: string;
  typeId: string;
  name: string;
  emoji: string;
  crawlStyle: 'crawl' | 'fly' | 'hop';
  color: string;
  x: number; // percentage (5 ~ 90)
  y: number; // percentage (5 ~ 85)
  targetX: number;
  targetY: number;
  rotation: number;
  scale: number;
  isHappy: boolean;
}

export const BugGardenScreen: React.FC<BugGardenScreenProps> = ({
  buddy,
  childName,
  onGoHome,
  soundEnabled,
}) => {
  const [bugs, setBugs] = useState<ActiveBug[]>([]);
  const [selectedBugId, setSelectedBugId] = useState<string>(BUG_TYPES[0].id);
  const gardenRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Initial welcome voice greeting
  useEffect(() => {
    speakText(
      `${childName}야, 초록 숲에 귀여운 곤충 친구들이 살고 있어요! 아래 곤충을 누르면 화면에 쏙 나타나요!`,
      soundEnabled,
      { characterId: buddy }
    );
  }, []);

  // Continuous crawling animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setBugs((prevBugs) =>
        prevBugs.map((bug) => {
          // If close to target, pick new random target
          const dist = Math.hypot(bug.targetX - bug.x, bug.targetY - bug.y);
          let newTargetX = bug.targetX;
          let newTargetY = bug.targetY;

          if (dist < 4 || Math.random() < 0.15) {
            newTargetX = 6 + Math.random() * 84;
            newTargetY = 6 + Math.random() * 80;
          }

          // Smooth step towards target
          const stepSize = bug.crawlStyle === 'fly' ? 1.8 : bug.crawlStyle === 'hop' ? 1.4 : 0.9;
          const angle = Math.atan2(newTargetY - bug.y, newTargetX - bug.x);
          const nextX = Math.max(4, Math.min(92, bug.x + Math.cos(angle) * stepSize));
          const nextY = Math.max(4, Math.min(88, bug.y + Math.sin(angle) * stepSize));

          // Angle in degrees for heading
          const deg = (angle * 180) / Math.PI + 90;

          return {
            ...bug,
            x: nextX,
            y: nextY,
            targetX: newTargetX,
            targetY: newTargetY,
            rotation: deg,
          };
        })
      );
    }, 180);

    return () => clearInterval(timer);
  }, []);

  // Add a new bug to the garden
  const handleAddBug = (type: BugType, startPos?: { xPercent: number; yPercent: number }) => {
    playJellyTap(soundEnabled);

    const initX = startPos ? startPos.xPercent : 15 + Math.random() * 70;
    const initY = startPos ? startPos.yPercent : 15 + Math.random() * 65;
    const targetX = 8 + Math.random() * 82;
    const targetY = 8 + Math.random() * 78;

    const angle = Math.atan2(targetY - initY, targetX - initX);
    const rotation = (angle * 180) / Math.PI + 90;

    const newBug: ActiveBug = {
      uid: `${type.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      typeId: type.id,
      name: type.name,
      emoji: type.emoji,
      crawlStyle: type.crawlStyle,
      color: type.color,
      x: initX,
      y: initY,
      targetX,
      targetY,
      rotation,
      scale: 1,
      isHappy: true,
    };

    setBugs((prev) => [...prev, newBug]);
    playBouncyBoing(soundEnabled);

    // Speak cheerful reaction
    speakText(`안녕, ${type.name}! ${type.soundName}`, soundEnabled, {
      characterId: buddy,
      playIntroSFX: false,
    });

    // Reset happiness bounce after a moment
    setTimeout(() => {
      setBugs((prev) =>
        prev.map((b) => (b.uid === newBug.uid ? { ...b, isHappy: false } : b))
      );
    }, 1000);
  };

  // Touching the garden field spawns the currently selected bug right there
  const handleGardenTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent double triggers if clicking on an existing bug
    const now = Date.now();
    if (now - lastTapTimeRef.current < 250) return;
    lastTapTimeRef.current = now;

    if (!gardenRef.current) return;
    const rect = gardenRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(5, Math.min(92, (clickX / rect.width) * 100));
    const yPercent = Math.max(5, Math.min(88, (clickY / rect.height) * 100));

    const selectedType = BUG_TYPES.find((b) => b.id === selectedBugId) || BUG_TYPES[0];
    handleAddBug(selectedType, { xPercent, yPercent });
  };

  // Touching an existing bug makes it jump happily
  const handleTouchBug = (bugUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    lastTapTimeRef.current = Date.now();

    playSparkleChime(soundEnabled);
    setBugs((prev) =>
      prev.map((b) => {
        if (b.uid === bugUid) {
          return {
            ...b,
            isHappy: true,
            targetX: 6 + Math.random() * 84,
            targetY: 6 + Math.random() * 80,
          };
        }
        return b;
      })
    );

    const touched = bugs.find((b) => b.uid === bugUid);
    if (touched) {
      speakText(`${touched.name}가 퐁퐁 기뻐해요!`, soundEnabled, {
        characterId: buddy,
        playIntroSFX: false,
      });
    }

    setTimeout(() => {
      setBugs((prev) =>
        prev.map((b) => (b.uid === bugUid ? { ...b, isHappy: false } : b))
      );
    }, 1200);
  };

  // Remove single bug
  const handleRemoveBug = (bugUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playBubblePop(soundEnabled);
    setBugs((prev) => prev.filter((b) => b.uid !== bugUid));
  };

  // Clear all bugs
  const handleClearGarden = () => {
    setBugs([]);
    speakText('곤충 친구들이 풀숲으로 쏙 들어갔어요!', soundEnabled, { characterId: buddy });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-8 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-[#ebf5e9] to-[#e4f1e1] p-4 sm:p-5 rounded-[28px] border-2 border-[#c8e6c4] shadow-xs">
        <div className="flex items-center gap-3">
          <CharacterAvatar id={buddy} size="sm" mood="happy" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#2e4c27] flex items-center gap-2">
              <span>{childName}의 곤충 놀이터</span>
              <span className="text-sm font-bold bg-[#cde8c8] text-[#24521d] px-2.5 py-0.5 rounded-full">
                {bugs.length}마리 놀고 있어요
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#5c7a54] mt-0.5">
              곤충을 누르면 화면에 쏙! 풀밭을 터치해도 새 친구가 나와요.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {bugs.length > 0 && (
            <button
              onClick={handleClearGarden}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/80 hover:bg-white text-xs font-black text-[#7a483d] border border-[#e8c0b9] shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 className="size-3.5" />
              <span>풀숲 비우기</span>
            </button>
          )}
          <button
            onClick={() =>
              speakText(
                '아래에서 마음에 드는 곤충을 누르거나 초록 풀밭을 콕 찍어보세요!',
                soundEnabled,
                { characterId: buddy }
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#3c7832] hover:bg-[#326629] text-xs font-black text-white shadow-xs cursor-pointer active:scale-95 transition-transform"
          >
            <Volume2 className="size-3.5" />
            <span>설명 듣기</span>
          </button>
        </div>
      </div>

      {/* Main Living Bug Garden Canvas */}
      <div
        ref={gardenRef}
        onClick={handleGardenTap}
        className="relative h-[360px] sm:h-[480px] w-full touch-none overflow-hidden rounded-[32px] border-4 border-[#b9deb4] shadow-inner cursor-pointer"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #e2f5dc 0%, #cbe8c3 55%, #b5deb0 100%)',
        }}
      >
        {/* Decorative Plants & Meadow Elements */}
        <div className="absolute top-4 left-6 text-3xl opacity-40 select-none pointer-events-none">🌸</div>
        <div className="absolute top-6 right-8 text-4xl opacity-40 select-none pointer-events-none">🌼</div>
        <div className="absolute bottom-6 left-10 text-4xl opacity-40 select-none pointer-events-none">🌿</div>
        <div className="absolute bottom-5 right-12 text-3xl opacity-40 select-none pointer-events-none">🍄</div>
        <div className="absolute top-1/2 left-8 text-2xl opacity-25 select-none pointer-events-none">🌱</div>
        <div className="absolute top-1/3 right-14 text-3xl opacity-30 select-none pointer-events-none">🍀</div>
        <div className="absolute bottom-1/3 left-1/4 text-2xl opacity-20 select-none pointer-events-none">🍃</div>

        {/* Empty Garden Invitation */}
        {bugs.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
            <div className="size-16 rounded-full bg-white/60 flex items-center justify-center text-3xl mb-3 shadow-sm animate-bounce">
              🐞
            </div>
            <p className="text-lg sm:text-xl font-black text-[#2e4c27]">
              풀밭을 콕! 터치해보세요!
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#5c7a54] mt-1">
              작고 귀여운 곤충 친구들이 나타나 신나게 돌아다녀요 🌱
            </p>
          </div>
        )}

        {/* Crawling Living Bugs */}
        <AnimatePresence>
          {bugs.map((bug) => {
            return (
              <motion.div
                key={bug.uid}
                onClick={(e) => handleTouchBug(bug.uid, e)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  left: `${bug.x}%`,
                  top: `${bug.y}%`,
                  scale: bug.isHappy ? 1.4 : 1,
                  rotate: bug.crawlStyle === 'fly' ? bug.rotation + Math.sin(Date.now() / 200) * 12 : bug.rotation,
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  left: { duration: 0.22, ease: 'linear' },
                  top: { duration: 0.22, ease: 'linear' },
                  rotate: { duration: 0.25 },
                  scale: { type: 'spring', stiffness: 350, damping: 15 },
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-none select-none group p-1 z-20"
                style={{
                  filter: bug.isHappy ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))' : 'drop-shadow(0 3px 4px rgba(0,0,0,0.15))',
                }}
              >
                {/* Bug Emoji & Bounce */}
                <div
                  className={`text-4xl sm:text-6xl transition-transform active:scale-125 ${
                    bug.isHappy ? 'animate-bounce' : ''
                  }`}
                >
                  {bug.emoji}
                </div>

                {/* Bug Name Tag */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 text-[#2e4c27] text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs pointer-events-none">
                  {bug.name}
                </div>

                {/* Remove button on hover/long touch */}
                <button
                  onClick={(e) => handleRemoveBug(bug.uid, e)}
                  className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs hover:bg-rose-600"
                  title="풀숲으로 보내기"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bug Picker Selector Tray */}
      <div className="w-full rounded-[28px] border-2 border-[#d5edd1] bg-white p-3.5 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-sm sm:text-base font-black text-[#2e4c27] flex items-center gap-1.5">
            <Sparkles className="size-4 text-[#439634]" />
            <span>어떤 곤충을 꺼내볼까?</span>
          </h2>
          <span className="text-xs font-bold text-[#6f8a67]">
            누르면 바로 풀밭에 나타나요!
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-2.5">
          {BUG_TYPES.map((bugType) => {
            const isSelected = selectedBugId === bugType.id;

            return (
              <motion.button
                key={bugType.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setSelectedBugId(bugType.id);
                  handleAddBug(bugType);
                }}
                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ecf7ea] border-[#439634] shadow-xs ring-2 ring-[#439634]/30'
                    : 'bg-[#f7faf6] border-[#e1ece0] hover:border-[#b0d8ad] hover:bg-[#f0f8ef]'
                }`}
              >
                <span className="text-3xl sm:text-4xl mb-1 filter drop-shadow-xs">
                  {bugType.emoji}
                </span>
                <span className="text-[11px] sm:text-xs font-black text-[#2e4c27] whitespace-nowrap">
                  {bugType.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Return Home Button */}
      <button
        onClick={onGoHome}
        className="inline-flex min-h-12 items-center justify-center gap-2 self-center rounded-2xl px-6 font-black text-[#3d5a35] hover:bg-[#eaf3e8] transition-colors cursor-pointer active:scale-95"
      >
        <Home className="size-5" />
        <span>우리 집으로 가기</span>
      </button>
    </div>
  );
};

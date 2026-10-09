import React from 'react';
import { Home, Music2, Shield, Volume2, VolumeX } from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import type { CharacterId } from '../types';

type Screen = 'home' | 'game' | 'day' | 'stickers' | 'aquarium' | 'park' | 'talk' | 'parent' | 'drawing';

interface HeaderProps {
  stars: number;
  selectedCharacter: CharacterId;
  bgmEnabled: boolean;
  soundEnabled: boolean;
  onToggleBGM: () => void;
  onToggleSound: () => void;
  onOpenParentGate: () => void;
  onGoHome: () => void;
  currentScreen: Screen;
  childName: string;
}

export const Header: React.FC<HeaderProps> = ({
  stars,
  selectedCharacter,
  bgmEnabled,
  soundEnabled,
  onToggleBGM,
  onToggleSound,
  onOpenParentGate,
  onGoHome,
  currentScreen,
  childName,
}) => {
  const pageLabel = (currentScreen === 'game' || currentScreen === 'day')
    ? `${CHARACTERS[selectedCharacter]?.name || '친구'}와 놀기`
    : currentScreen === 'drawing'
      ? '색칠하기'
      : currentScreen === 'stickers'
        ? '곤충 놀이터'
        : currentScreen === 'aquarium'
          ? '바다 친구 수족관'
          : currentScreen === 'park'
            ? '친구 놀이터'
          : currentScreen === 'talk'
            ? '친구 인사'
            : currentScreen === 'parent'
              ? '부모님 설정'
              : `${childName}의 놀이터`;

  return (
    <header className={`app-header sticky top-0 z-30 w-full${currentScreen === 'home' ? ' app-header-home' : ''}`}>
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        {currentScreen !== 'home' && <button
          onClick={onGoHome}
          aria-label="홈으로 가기"
          className="home-button"
        >
          <Home aria-hidden="true" className="home-button-icon" /><span>우리 집</span>
        </button>}

        <span className="header-page-label hidden min-w-0 truncate font-bold sm:block">{pageLabel}</span>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={onToggleBGM}
            aria-label={bgmEnabled ? '배경음악 끄기' : '배경음악 켜기'}
            aria-pressed={bgmEnabled}
            className={`grid size-11 place-items-center rounded-xl transition-colors ${bgmEnabled ? 'text-[#607861] hover:bg-[#eaf0e7]' : 'text-[#a0a3aa] hover:bg-[#f3f3f3]'}`}
          ><Music2 className="size-5" /></button>
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? '소리와 음성 끄기' : '소리와 음성 켜기'}
            aria-pressed={soundEnabled}
            className={`grid size-11 place-items-center rounded-xl transition-colors ${soundEnabled ? 'text-[#607861] hover:bg-[#eaf0e7]' : 'text-[#a0a3aa] hover:bg-[#f3f3f3]'}`}
          >{soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}</button>
          <button
            onClick={onOpenParentGate}
            aria-label="부모님 설정"
            className="grid size-11 place-items-center rounded-xl text-[#73777f] hover:bg-[#f3f3f3]"
          ><Shield className="size-5" /></button>
        </div>
      </div>
    </header>
  );
};

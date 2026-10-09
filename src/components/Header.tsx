import React from 'react';
import { Music2, Shield, Volume2, VolumeX } from 'lucide-react';
import { CookieHouseIcon } from './CookieHouseIcon';
import { CHARACTERS } from '../data/characters';
import type { CharacterId } from '../types';
import './Header.css';

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
    <header className="app-header">
      <div className="header-content">
        <button
          type="button"
          onClick={onGoHome}
          aria-label="홈으로 가기"
          className="home-button"
        >
          <CookieHouseIcon className="home-button-icon" />
        </button>

        <span className="header-page-label hidden min-w-0 truncate font-bold sm:block">{pageLabel}</span>
        <div className="header-controls">
          <div className="header-audio-group" role="group" aria-label="음악과 소리">
            <button
              type="button"
              onClick={onToggleBGM}
              aria-label={bgmEnabled ? '배경음악 끄기' : '배경음악 켜기'}
              aria-pressed={bgmEnabled}
              className="header-audio-button header-music"
            ><span className="header-audio-icon" aria-hidden="true"><Music2 /></span></button>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? '소리와 음성 끄기' : '소리와 음성 켜기'}
              aria-pressed={soundEnabled}
              className="header-audio-button header-sound"
            ><span className="header-audio-icon" aria-hidden="true">{soundEnabled ? <Volume2 /> : <VolumeX />}</span></button>
          </div>
          <button
            type="button"
            onClick={onOpenParentGate}
            aria-label="부모님 설정"
            className="header-parent-button"
          ><Shield className="size-5" /></button>
        </div>
      </div>
    </header>
  );
};

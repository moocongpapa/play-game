import React, { useState } from 'react';
import { AppState } from '../types';
import { JellyButton } from '../components/JellyButton';
import { Shield, Clock, Volume2, Music, Sparkles, Home, RotateCcw, Mic, VolumeX } from 'lucide-react';
import { speakText, setVoiceToneMode } from '../utils/soundEngine';

interface ParentDashboardProps {
  appState: AppState;
  onUpdateTimerMinutes: (min: number) => void;
  onUpdateBgmVolume: (vol: number) => void;
  onUpdateSfxVolume: (vol: number) => void;
  onToggleSound: () => void;
  onToggleBGM: () => void;
  onUnlockAllStickers: () => void;
  onResetProgress: () => void;
  onGoHome: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  appState,
  onUpdateTimerMinutes,
  onUpdateBgmVolume,
  onUpdateSfxVolume,
  onToggleSound,
  onToggleBGM,
  onUnlockAllStickers,
  onResetProgress,
  onGoHome,
}) => {
  const [activeTone, setActiveTone] = useState<'cheerful' | 'gentle' | 'energetic'>('cheerful');

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  const handleSelectTone = (tone: 'cheerful' | 'gentle' | 'energetic') => {
    setActiveTone(tone);
    setVoiceToneMode(tone);
  };

  const handleTestVoice = () => {
    speakText('안녕~! 나는 꼬미야! 사람처럼 다정하고 신나게 말하니까 정말 재밌지?', appState.soundEnabled, {
      characterId: 'ggomi',
      playIntroSFX: true,
    });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-amber-100 to-orange-100 p-3.5 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-300 shadow-sm mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-amber-200 text-[#E65100] rounded-2xl shrink-0">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="break-keep">
            <h1 className="text-xl sm:text-2xl font-black text-[#4A3E3D]">부모 전용 대시보드</h1>
            <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79]">아이의 놀이 시간과 음량을 안전하게 관리하세요.</p>
          </div>
        </div>
      </div>

      {/* Play Statistics Card */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3">
        <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 mb-2.5 break-keep">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 오늘 아이의 놀이 기록
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center">
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-[11px] sm:text-xs font-bold text-[#8C7B79] block">총 이용 시간</span>
            <span className="text-lg sm:text-2xl font-black text-[#FF9E4A]">{formatSeconds(appState.playTimeSeconds)}</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-50 rounded-2xl border border-rose-200">
            <span className="text-[11px] sm:text-xs font-bold text-[#8C7B79] block">모은 🌟 별 개수</span>
            <span className="text-lg sm:text-2xl font-black text-rose-500">{appState.stars}개</span>
          </div>
        </div>
      </div>

      {/* Voice Humanization Settings */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 break-keep">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" /> 캐릭터 말하기 톤 & 생생 음성
          </h2>
          <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">
            자연스러운 인공지능 톤
          </span>
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79] mb-3 break-keep">
          기계같은 음성을 방지하고, 기분 좋은 억양과 캐릭터 소리 효과로 사람처럼 다정하게 말합니다.
        </p>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
          {[
            { id: 'cheerful', name: '🌟 밝고 다정함' },
            { id: 'gentle', name: '🌸 상냥함' },
            { id: 'energetic', name: '⚡ 통통 튐' },
          ].map((item) => {
            const isSelected = activeTone === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTone(item.id as 'cheerful' | 'gentle' | 'energetic')}
                className={`py-2 px-1 rounded-2xl font-black text-xs border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-gray-50 text-[#4A3E3D] border-gray-200 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleTestVoice}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
        >
          <Volume2 className="w-4 h-4" /> 🔊 캐릭터 사람 목소리 샘플 듣기
        </button>
      </div>

      {/* Timer Restriction Settings */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3">
        <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 mb-1.5 break-keep">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" /> 이용 시간 제한 타이머
        </h2>
        <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79] mb-3 break-keep">
          지정한 시간이 지나면 귀여운 동물 친구들이 잘 시간으로 전환됩니다.
        </p>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[0, 10, 15, 20, 30].map((min) => {
            const isSelected = appState.timerMinutes === min;

            return (
              <button
                key={min}
                onClick={() => onUpdateTimerMinutes(min)}
                className={`py-2 px-1 rounded-2xl font-black text-xs sm:text-sm border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF9E4A] text-white border-[#E07A26] shadow-sm'
                    : 'bg-gray-50 text-[#4A3E3D] border-gray-200 hover:bg-gray-100'
                }`}
              >
                {min === 0 ? '제한없음' : `${min}분`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound & Music Controls */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3">
        <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 mb-2.5 break-keep">
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 사운드 및 배경음악 조절
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#4A3E3D]">
            <Music className="w-4 h-4 text-[#42A5F5]" /> 배경음악 (BGM)
          </div>
          <button
            onClick={onToggleBGM}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-xs border ${
              appState.bgmEnabled
                ? 'bg-blue-100 text-blue-700 border-blue-300'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            {appState.bgmEnabled ? '켜짐' : '꺼짐'}
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#4A3E3D]">
            <Volume2 className="w-4 h-4 text-[#FF9E4A]" /> 효과음 & 음성 (SFX)
          </div>
          <button
            onClick={onToggleSound}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-xs border ${
              appState.soundEnabled
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            {appState.soundEnabled ? '켜짐' : '꺼짐'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full flex gap-2.5 sm:gap-3 mb-4">
        <button
          onClick={onUnlockAllStickers}
          className="flex-1 py-2.5 sm:py-3 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-2xl border border-purple-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" /> 스티커 전체 해제
        </button>
        <button
          onClick={onResetProgress}
          className="py-2.5 sm:py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 shrink-0" /> 초기화
        </button>
      </div>

      <JellyButton variant="primary" size="lg" onClick={onGoHome} className="w-full">
        <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5" /> 아이 화면으로 돌아가기
      </JellyButton>
    </div>
  );
};


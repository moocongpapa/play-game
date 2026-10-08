import React, { useState } from 'react';
import { AppState, ChildProfile } from '../types';
import { JellyButton } from '../components/JellyButton';
import { Shield, Clock, Volume2, Music, Sparkles, Home, RotateCcw, Mic, Calendar, User, CheckCircle2 } from 'lucide-react';
import { speakText, setVoiceToneMode } from '../utils/soundEngine';
import { calculateAgeMonths, determineAgeGroup, getAgeGroupLabel, getAgeGroupEmoji, getAgeGroupDescription } from '../utils/ageEngine';
import { getGeminiApiKey, setGeminiApiKey, isGeminiTTSEnabled, setGeminiTTSEnabled } from '../services/geminiTTS';
import {
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  getElevenLabsVoiceId,
  setElevenLabsVoiceId,
  isElevenLabsTTSEnabled,
  setElevenLabsTTSEnabled,
} from '../services/elevenlabsTTS';

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
  onUpdateProfile: (profile: ChildProfile) => void;
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
  onUpdateProfile,
}) => {
  const [activeTone, setActiveTone] = useState<'cheerful' | 'gentle' | 'energetic'>('cheerful');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // 편집용 프로필 상태
  const [editName, setEditName] = useState(appState.childProfile?.name || '유하');
  const [editBirthDate, setEditBirthDate] = useState(appState.childProfile?.birthDate || '2023-01-03');

  // Gemini TTS 상태
  const [geminiEnabled, setGeminiEnabled] = useState(isGeminiTTSEnabled());
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  const [isKeySaved, setIsKeySaved] = useState(false);

  // ElevenLabs TTS 상태
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(isElevenLabsTTSEnabled());
  const [elevenLabsKeyInput, setElevenLabsKeyInput] = useState(getElevenLabsApiKey());
  const [elevenLabsVoiceIdInput, setElevenLabsVoiceIdInput] = useState(getElevenLabsVoiceId());
  const [isElevenLabsKeySaved, setIsElevenLabsKeySaved] = useState(false);

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
    speakText(`안녕~! 나는 꼬미야! 사람처럼 다정하고 신나게 말하니까 정말 재밌지?`, appState.soundEnabled, {
      characterId: 'ggomi',
      playIntroSFX: true,
    });
  };

  const handleTestVoiceCharacter = (characterId: string) => {
    const childName = appState.childProfile?.name || '유하';
    let sampleMsg = '';
    switch (characterId) {
      case 'ggomi':
        sampleMsg = `안녕 ${childName}야! 나는 꼬미야~ 오늘 나랑 재미있는 사물 퀴즈 놀이 해볼래?`;
        break;
      case 'rano':
        sampleMsg = `크앙! ${childName} 안녕! 나는 힘센 라노야! 알록달록 모양 친구들을 같이 찾아보자!`;
        break;
      case 'jelly':
        sampleMsg = `깡총깡총! ${childName} 안녕? 나는 젤리야! 방울방울 한글 놀이하러 가자!`;
        break;
      default:
        sampleMsg = `안녕 ${childName}야! 반가워!`;
    }
    speakText(sampleMsg, appState.soundEnabled, {
      characterId,
      playIntroSFX: true,
    });
  };

  const handleSaveProfile = () => {
    const ageMonths = calculateAgeMonths(editBirthDate);
    const ageGroup = determineAgeGroup(ageMonths);
    
    const updated: ChildProfile = {
      name: editName.trim() || '유하',
      birthDate: editBirthDate,
      ageMonths,
      ageGroup,
    };
    
    onUpdateProfile(updated);
    setIsEditingProfile(false);
    speakText('프로필 정보가 수정되었습니다!', appState.soundEnabled);
  };

  // 게임 레이블 맵핑
  const GAME_LABELS: Record<string, string> = {
    object_recognition: '꼬미의 사물 인지',
    shape_color: '라노의 모양 퍼즐',
    korean_letters: '젤리의 한글 비누방울',
    sound_quiz: '도치의 소리 퀴즈',
    counting_food: '꿀꿀이의 수 세기',
    cloud_shapes: '음메의 구름 퍼즐',
    treasure_hunt: '누룽지의 보물 찾기',
    emotion_quiz: '꼬미의 감정 퀴즈',
    pattern_sequence: '라노의 패턴 놀이',
    word_puzzle: '젤리의 단어 퍼즐',
    rhythm_game: '도치의 리듬 놀이',
    size_comparison: '꿀꿀이의 크기 비교',
    memory_card: '누룽지의 기억력 카드',
    shadow_quiz: '음메의 그림자 퀴즈',
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
            <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79]">아이의 놀이 시간과 연령별 맞춤 설정을 관리하세요.</p>
          </div>
        </div>
      </div>

      {/* Child Profile Section */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3 text-left">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" /> 아이 프로필 설정
          </h2>
          <button
            onClick={() => {
              if (isEditingProfile) handleSaveProfile();
              else setIsEditingProfile(true);
            }}
            className="text-xs font-black text-[#FF9E4A] bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1.5 cursor-pointer"
          >
            {isEditingProfile ? '저장 완료' : '정보 수정'}
          </button>
        </div>

        {isEditingProfile ? (
          <div className="space-y-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-200/50">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#8C7B79] mb-1">아이 이름</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-amber-300 focus:outline-[#FF9E4A] font-black text-sm text-[#4A3E3D]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#8C7B79] mb-1">아이 생년월일</label>
              <input
                type="date"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-amber-300 focus:outline-[#FF9E4A] font-black text-sm text-[#4A3E3D]"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/30 rounded-2xl border border-amber-100">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-[#8C7B79] block">이름</span>
              <span className="text-sm sm:text-base font-black text-[#4A3E3D]">{appState.childProfile?.name || '유하'}</span>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-[#8C7B79] block">맞춤 연령반</span>
              <span className="text-sm sm:text-base font-black text-[#4A3E3D] flex items-center gap-1">
                <span>{getAgeGroupEmoji(appState.childProfile?.ageGroup || 'sprout')}</span>
                <span>{getAgeGroupLabel(appState.childProfile?.ageGroup || 'sprout')}</span>
                <span className="text-xs font-normal text-[#8C7B79]">({appState.childProfile?.ageMonths || 43}개월)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Play Statistics Card */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3">
        <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 mb-2.5 break-keep">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 오늘 아이의 놀이 기록
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center mb-4">
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-[11px] sm:text-xs font-bold text-[#8C7B79] block">총 이용 시간</span>
            <span className="text-lg sm:text-2xl font-black text-[#FF9E4A]">{formatSeconds(appState.playTimeSeconds)}</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-50 rounded-2xl border border-rose-200">
            <span className="text-[11px] sm:text-xs font-bold text-[#8C7B79] block">모은 🌟 별 개수</span>
            <span className="text-lg sm:text-2xl font-black text-rose-500">{appState.stars}개</span>
          </div>
        </div>

        {/* 놀이 통계 시각화 */}
        <h3 className="text-xs font-black text-[#4A3E3D] text-left mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 놀이 종류별 완료 통계
        </h3>
        <div className="space-y-2 text-left max-h-32 overflow-y-auto pr-1">
          {Object.entries(GAME_LABELS).map(([gameId, label]) => {
            const count = appState.completedGames[gameId] || 0;
            return (
              <div key={gameId} className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#8C7B79] truncate w-32">{label}</span>
                <div className="flex-1 mx-3 bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, count * 20)}%` }}
                  />
                </div>
                <span className="font-black text-[#4A3E3D] shrink-0 w-8 text-right">{count}회</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gemini 2.0 AI Human-like Voice Settings */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-purple-300 shadow-sm mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /> ✨ Gemini AI 사람 목소리
          </h2>
          <button
            onClick={() => {
              const next = !geminiEnabled;
              setGeminiEnabled(next);
              setGeminiTTSEnabled(next);
            }}
            className={`px-3 py-1 rounded-full font-black text-xs border cursor-pointer transition-all ${
              geminiEnabled
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            {geminiEnabled ? 'AI 음성 켜짐' : '기본 음성'}
          </button>
        </div>

        <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79] mb-3 text-left">
          기계음 대신 Google Gemini 2.0 오디오로 진짜 사람 성우처럼 다정하게 읽어줍니다.
        </p>

        {/* Gemini API Key Input */}
        <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 mb-3 text-left">
          <label className="text-[11px] sm:text-xs font-black text-purple-900 mb-1 block">
            Google Gemini API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy... (API 키를 입력하세요)"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-purple-300 bg-white focus:outline-purple-500 font-mono text-[#4A3E3D]"
            />
            <button
              onClick={() => {
                setGeminiApiKey(geminiKeyInput.trim());
                setIsKeySaved(true);
                setTimeout(() => setIsKeySaved(false), 2000);
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl cursor-pointer shrink-0"
            >
              {isKeySaved ? '저장됨 ✓' : '저장'}
            </button>
          </div>
          <span className="text-[10px] text-purple-700 mt-1 block">
            * 키가 없거나 네트워크 오류 시 자동으로 다정한 유치원 선생님 톤(Google 한국어 / Natural)으로 안전하게 재생됩니다.
          </span>
        </div>

        {/* ElevenLabs API Key & Voice ID Input */}
        <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-200 mb-3 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] sm:text-xs font-black text-pink-900 block">
              ElevenLabs Voice AI (선택)
            </label>
            <button
              onClick={() => {
                const next = !elevenLabsEnabled;
                setElevenLabsEnabled(next);
                setElevenLabsTTSEnabled(next);
              }}
              className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border cursor-pointer transition-all ${
                elevenLabsEnabled
                  ? 'bg-pink-600 text-white border-pink-700 shadow-2xs'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              {elevenLabsEnabled ? 'ElevenLabs 켜짐' : '꺼짐'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              placeholder="ElevenLabs API Key"
              value={elevenLabsKeyInput}
              onChange={(e) => setElevenLabsKeyInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-pink-300 bg-white font-mono text-[#4A3E3D]"
            />
            <input
              type="text"
              placeholder="Voice ID (기본: Rachel/유치원)"
              value={elevenLabsVoiceIdInput}
              onChange={(e) => setElevenLabsVoiceIdInput(e.target.value)}
              className="sm:w-44 px-3 py-1.5 text-xs rounded-xl border border-pink-300 bg-white font-mono text-[#4A3E3D]"
            />
            <button
              onClick={() => {
                setElevenLabsApiKey(elevenLabsKeyInput.trim());
                setElevenLabsVoiceId(elevenLabsVoiceIdInput.trim());
                setIsElevenLabsKeySaved(true);
                setTimeout(() => setIsElevenLabsKeySaved(false), 2000);
              }}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl cursor-pointer shrink-0"
            >
              {isElevenLabsKeySaved ? '저장됨 ✓' : '저장'}
            </button>
          </div>
          <span className="text-[10px] text-pink-700 mt-1 block">
            * 초고음질 유치원 선생님 캐릭터 음성을 ElevenLabs로 직접 송출할 수 있습니다.
          </span>
        </div>

        {/* Character Voice Test Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black text-[#4A3E3D] block text-left">
            🎭 캐릭터별 AI 목소리 미리 들어보기
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTestVoiceCharacter('ggomi')}
              className="py-2 px-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-black text-[11px] sm:text-xs rounded-xl border border-pink-200 cursor-pointer flex flex-col items-center gap-0.5"
            >
              <span>🎀 꼬미 (곰)</span>
              <span className="text-[9px] font-normal text-pink-500">따뜻한 톤</span>
            </button>
            <button
              onClick={() => handleTestVoiceCharacter('rano')}
              className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[11px] sm:text-xs rounded-xl border border-emerald-200 cursor-pointer flex flex-col items-center gap-0.5"
            >
              <span>🦖 라노 (공룡)</span>
              <span className="text-[9px] font-normal text-emerald-500">씩씩한 톤</span>
            </button>
            <button
              onClick={() => handleTestVoiceCharacter('jelly')}
              className="py-2 px-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-[11px] sm:text-xs rounded-xl border border-purple-200 cursor-pointer flex flex-col items-center gap-0.5"
            >
              <span>🐰 젤리 (토끼)</span>
              <span className="text-[9px] font-normal text-purple-500">발랄한 톤</span>
            </button>
          </div>
        </div>
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

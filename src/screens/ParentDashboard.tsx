import React, { useEffect, useState, useMemo } from 'react';
import { AppState, ChildProfile, SpeechLanguage, GameId, CharacterId } from '../types';
import { JellyButton } from '../components/JellyButton';
import { Shield, Clock, Volume2, Music, Sparkles, RotateCcw, Mic, Calendar, User, CheckCircle2, Sliders, AlertTriangle } from 'lucide-react';
import { CookieHouseIcon } from '../components/CookieHouseIcon';
import { speakText, stopAllSpeech } from '../utils/soundEngine';
import { calculateAgeMonths, determineAgeGroup, getAgeGroupLabel, getAgeGroupEmoji, getAgeGroupDescription } from '../utils/ageEngine';
import { isGeminiTTSEnabled, getCharacterAudioStatus, setGeminiTTSEnabled } from '../services/geminiTTS';
import type { CharacterAudioStatus } from '../data/audioExperience';
import { stopGeneratedEffects } from '../services/generatedEffects';
import { CHARACTER_VOICES, type CharacterVoiceId } from '../data/characterVoices';
import { CHARACTERS } from '../data/characters';
import { GAME_CATALOG } from '../data/gameCatalog';
import { summarizePlayActivity } from '../utils/playActivity';
import { requestBlowPermission } from '../utils/microphonePermission';
import { CharacterAvatar } from '../components/CharacterAvatar';

interface ParentDashboardProps {
  appState: AppState;
  onUpdateTimerMinutes: (min: number) => void;
  onUpdateBgmVolume: (vol: number) => void;
  onUpdateSfxVolume: (vol: number) => void;
  onUpdateSpeechLanguage: (language: SpeechLanguage) => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onUpdateMicrophone: (enabled: boolean) => void;
  onToggleBGM: () => void;
  onToggleGameDisabled?: (gameId: GameId) => void;
  onResetProgress: () => void;
  onGoHome: () => void;
  onUpdateProfile: (profile: ChildProfile) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  appState,
  onUpdateTimerMinutes,
  onUpdateBgmVolume,
  onUpdateSfxVolume,
  onUpdateSpeechLanguage,
  onToggleSound,
  onToggleHaptics,
  onUpdateMicrophone,
  onToggleBGM,
  onToggleGameDisabled,
  onResetProgress,
  onGoHome,
  onUpdateProfile,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [gameFilter, setGameFilter] = useState<'all' | 'baby' | 'sprout' | 'bloom'>('all');
  
  // 편집용 프로필 상태
  const [editName, setEditName] = useState(appState.childProfile?.name || '유하');
  const [editBirthDate, setEditBirthDate] = useState(appState.childProfile?.birthDate || '2023-01-03');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [geminiEnabled, setGeminiEnabled] = useState(isGeminiTTSEnabled());
  const [audioStatus, setAudioStatus] = useState<CharacterAudioStatus | null>(null);
  const aiAvailable = audioStatus?.available;
  const budget = audioStatus?.elevenLabs;
  const [previewStatus, setPreviewStatus] = useState('');
  const [micPending, setMicPending] = useState(false);
  const [micStatus, setMicStatus] = useState('');
  const toggleMicrophone = async () => {
    if (appState.microphoneEnabled) { onUpdateMicrophone(false); setMicStatus('버튼으로 바람 놀이를 해요.'); return; }
    setMicPending(true);
    const allowed = await requestBlowPermission();
    onUpdateMicrophone(allowed);
    setMicStatus(allowed ? '마이크를 허용했어요. 지원 기기에서는 바람 버튼을 누른 뒤 입으로도 불 수 있어요.' : '마이크를 사용할 수 없어도 버튼으로 똑같이 놀 수 있어요.');
    setMicPending(false);
  };

  useEffect(() => {
    let mounted = true;
    void getCharacterAudioStatus().then(status => { if (mounted) setAudioStatus(status); });
    return () => { mounted = false; };
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}분 ${s}초`;
  };

  const handleTestVoiceCharacter = (characterId: CharacterVoiceId) => {
    const childName = appState.childProfile?.name || '유하';
    const character = CHARACTER_VOICES[characterId];
    if (!appState.soundEnabled) {
      setPreviewStatus('먼저 효과음·음성을 켜 주세요.');
      return;
    }
    setPreviewStatus(`${character.name} 목소리를 준비하고 있어요.`);
    speakText(`${childName}야, 안녕! 나는 ${character.name}야. 우리 같이 신나게 놀자!`, appState.soundEnabled, {
      characterId,
      onStart: provider => setPreviewStatus(provider === 'ai' ? `${character.name}의 AI 목소리가 재생 중이에요.` : 'AI 음성을 사용할 수 없어 기기 기본 목소리로 재생 중이에요.'),
      onEnd: () => setPreviewStatus('미리 듣기가 끝났어요.'),
      onError: () => setPreviewStatus('음성을 재생하지 못했어요. 기기 소리를 확인해 주세요.'),
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

  const activity = summarizePlayActivity(appState.completedGames);

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
                max={todayStr}
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
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 아이의 놀이 기록 및 리포트
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center mb-3">
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-[11px] sm:text-xs font-bold text-[#8C7B79] block">오늘 이용 시간</span>
            <span className="text-lg sm:text-2xl font-black text-[#FF9E4A]">{formatSeconds(appState.playTimeSeconds)}</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <span className="text-[11px] sm:text-xs font-bold text-[#8C7B79] block">누적 완료한 놀이</span>
            <span className="text-lg sm:text-2xl font-black text-emerald-600">
              {Object.values(appState.completedGames).reduce((a, b) => a + b, 0)}회
            </span>
          </div>
        </div>

        {/* 가장 좋아하는 단짝 친구 카드 */}
        {(() => {
          const counts = appState.buddyPlayCounts || {};
          let topId = appState.selectedCharacter;
          let maxCount = -1;
          for (const [id, count] of Object.entries(counts)) {
            if (typeof count === 'number' && count > maxCount) {
              maxCount = count;
              topId = id as CharacterId;
            }
          }
          const favBuddy = CHARACTERS[topId] || CHARACTERS.ggomi;
          return (
            <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200/70 mb-3 text-left flex items-center gap-3">
              <CharacterAvatar id={favBuddy.id} size="sm" mood="happy" />
              <div className="break-keep">
                <span className="text-[10px] sm:text-xs font-bold text-[#8C7B79] block">가장 좋아하는 단짝 친구</span>
                <p className="text-sm sm:text-base font-black text-[#4A3E3D]">
                  {favBuddy.name} {favBuddy.animal} {favBuddy.badge}
                  {maxCount > 0 && <span className="ml-2 text-xs font-bold text-amber-600">({maxCount}회 함께 놀았어요!)</span>}
                </p>
              </div>
            </div>
          );
        })()}

        {/* 영역별 놀이 활동 균형 리포트 */}
        <h3 className="text-xs font-black text-[#4A3E3D] text-left mb-2 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 발달 영역별 활동 요약
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-left">
          {([
            { id: 'language', label: '🗣️ 언어·인지', style: 'bg-sky-50 border-sky-100 text-sky-900' },
            { id: 'logic', label: '🔢 수·논리', style: 'bg-amber-50 border-amber-100 text-amber-900' },
            { id: 'care', label: '💖 감성·생활', style: 'bg-rose-50 border-rose-100 text-rose-900' },
            { id: 'creative', label: '🎨 신체·창의', style: 'bg-purple-50 border-purple-100 text-purple-900' },
          ] as const).map(area => <div key={area.id} className={`p-2 rounded-xl border text-center ${area.style}`}>
            <span className="text-[10px] font-bold block">{area.label}</span>
            <span className="text-sm font-black">{activity[area.id]}회</span>
          </div>)}
        </div>

        {/* 놀이 통계 시각화 */}
        <h3 className="text-xs font-black text-[#4A3E3D] text-left mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 놀이 종류별 완료 통계
        </h3>
        <div className="space-y-2 text-left max-h-32 overflow-y-auto pr-1">
          {Object.entries(GAME_CATALOG).map(([gameId, game]) => {
            const count = appState.completedGames[gameId] || 0;
            return (
              <div key={gameId} className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#8C7B79] truncate w-32">{game.title}</span>
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

      <section className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 border-sky-200 shadow-sm mb-3 text-left" aria-labelledby="speech-language-title">
        <h2 id="speech-language-title" className="text-base sm:text-lg font-black text-[#4A3E3D] mb-2">음성 언어 · Voice language</h2>
        <p className="text-xs sm:text-sm text-[#625d67] mb-3">안내, 칭찬, 캐릭터 대화와 말소리 효과의 언어를 선택해요. 기본 언어는 한국어예요.</p>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="음성 언어 선택">
          {([{ id: 'ko', label: '한국어', detail: 'Korean · 기본값' }, { id: 'en', label: 'English', detail: '영어' }] as const).map(language => <button
            key={language.id} type="button" aria-pressed={appState.speechLanguage === language.id}
            onClick={() => { setPreviewStatus(''); onUpdateSpeechLanguage(language.id); }}
            className={`min-h-16 px-4 py-3 rounded-2xl border-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-700 ${appState.speechLanguage === language.id ? 'bg-sky-100 border-sky-500 text-sky-950' : 'bg-white border-slate-200 text-slate-600'}`}
          ><span className="flex items-center justify-between font-black">{language.label}{appState.speechLanguage === language.id && <CheckCircle2 size={20} aria-hidden="true" />}</span><span className="text-xs">{language.detail}</span></button>)}
        </div>
        <p className="text-xs text-[#625d67] mt-3">선택은 자동 저장돼요. 아래에서 친구 목소리를 미리 들어보세요. 배경음악·악기·실제 동물 녹음은 공통으로 사용해요.</p>
      </section>

      {/* Character AI voice settings */}
      <section className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 border-purple-200 shadow-sm mb-3 text-left" aria-labelledby="character-voice-title">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 id="character-voice-title" className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-600" /> 친구 목소리와 놀이 소리
          </h2>
          <button
            type="button"
            onClick={() => {
              const next = !geminiEnabled;
              setGeminiEnabled(next);
              stopAllSpeech();
              stopGeneratedEffects();
              setGeminiTTSEnabled(next);
            }}
            aria-pressed={geminiEnabled}
            className={`px-3 py-1.5 rounded-full font-bold text-xs border cursor-pointer ${geminiEnabled ? 'bg-purple-600 text-white border-purple-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
          >
            {geminiEnabled ? 'AI 소리 켜짐' : 'AI 소리 꺼짐'}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[#625d67] mb-3">
          {Object.keys(CHARACTER_VOICES).length}명의 친구에게 어울리는 가볍고 다정한 목소리와 톡톡 튀는 효과음을 ElevenLabs로 준비해요. 한 번 만든 소리는 이 기기에 저장해 다시 사용해요.
        </p>
        <div className={`rounded-2xl px-3 py-2.5 text-xs font-bold mb-3 ${aiAvailable ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`} role="status">
          {!audioStatus ? 'AI 소리 연결을 확인하고 있어요.'
            : budget?.reason === 'exhausted' ? '이번 달 포함 크레딧을 모두 사용했어요. 저장된 소리와 기기 목소리로 계속 놀 수 있어요.'
            : budget?.reason === 'plan_not_supported' || budget?.reason === 'overage_enabled' ? '추가 과금이 꺼진 Free·Starter 플랜에서만 새 소리를 만들어요. 지금은 저장된 소리와 기기 목소리를 사용해요.'
            : aiAvailable ? '새로운 안내와 칭찬, 효과음을 플랜에 포함된 한도 안에서 준비할 수 있어요.'
            : '새 소리를 준비할 수 없어요. 저장된 소리와 기기 목소리로 계속 놀 수 있어요.'}
          {budget && budget.limit > 0 && <div className="mt-2 space-y-1">
            <p>포함 크레딧 잔여 {budget.remaining.toLocaleString()} / {budget.limit.toLocaleString()}</p>
            {budget.resetsAt && <p>다음 초기화: {new Date(budget.resetsAt * 1000).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>}
          </div>}
        </div>
        <p className="text-[11px] sm:text-xs text-[#625d67] mb-4 break-keep">
          플랜에 포함된 한도가 돌아오면 놀이 중 필요한 새 소리를 다시 준비해요. 추가 결제는 하지 않아요.
          배경음악은 한 번 제작해 저장해 둔 음악과 오리지널 연주를 사용해요. 다시 들어도 크레딧을 쓰지 않아요. AI 소리를 꺼도 기본 소리는 유지돼요.
          {' '}음성·음악·효과음 제작: <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="underline text-purple-700">ElevenLabs</a>
        </p>
        <h3 className="text-xs font-black text-[#4A3E3D] mb-2">캐릭터 목소리 미리 듣기</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(CHARACTER_VOICES) as [CharacterVoiceId, typeof CHARACTER_VOICES[CharacterVoiceId]][]).map(([id, character]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTestVoiceCharacter(id)}
              className="min-h-16 rounded-2xl border border-purple-200 bg-purple-50 px-3 py-2 text-left hover:bg-purple-100 focus-visible:outline-2 focus-visible:outline-purple-600 cursor-pointer"
              aria-label={`${character.name} 목소리 미리 듣기`}
            >
              <span className="block font-black text-sm text-[#4A3E3D]">{character.emoji} {character.name}</span>
              <span className="block text-[11px] text-purple-700">{character.tone}</span>
            </button>
          ))}
        </div>
        {previewStatus && <p className="mt-3 text-xs font-bold text-purple-800" role="status">{previewStatus}</p>}
      </section>

      {/* Timer Restriction Settings */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3">
        <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 mb-1.5 break-keep">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" /> 이용 시간 제한 타이머
        </h2>
        <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79] mb-3 break-keep">
          시간을 누르면 지금부터 새로 시작해요. 앱을 보고 있는 시간만 세고, 다음 날에는 다시 놀 수 있어요.
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
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3 text-left">
        <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 mb-2.5 break-keep">
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 사운드 및 배경음악 조절
        </h2>

        {/* BGM Control */}
        <div className="py-2.5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#4A3E3D]">
              <Music className="w-4 h-4 text-[#42A5F5]" /> 배경음악 (BGM)
            </div>
            <button
              type="button"
              onClick={onToggleBGM}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-xs border cursor-pointer ${
                appState.bgmEnabled
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              {appState.bgmEnabled ? '켜짐' : '꺼짐'}
            </button>
          </div>
          {appState.bgmEnabled && (
            <div className="flex items-center gap-3 px-1">
              <span className="text-[11px] font-bold text-[#8C7B79] w-10">음량</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={appState.bgmVolume}
                onChange={(e) => onUpdateBgmVolume(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
                aria-label="배경음악 음량"
              />
              <span className="text-xs font-black text-[#4A3E3D] w-10 text-right">{Math.round(appState.bgmVolume * 100)}%</span>
            </div>
          )}
        </div>

        {/* SFX Control */}
        <div className="py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#4A3E3D]">
              <Volume2 className="w-4 h-4 text-[#FF9E4A]" /> 효과음 & 음성 (SFX)
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-xs border cursor-pointer ${
                appState.soundEnabled
                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              {appState.soundEnabled ? '켜짐' : '꺼짐'}
            </button>
          </div>
          {appState.soundEnabled && (
            <div className="flex items-center gap-3 px-1">
              <span className="text-[11px] font-bold text-[#8C7B79] w-10">음량</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={appState.sfxVolume ?? 1.0}
                onChange={(e) => onUpdateSfxVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
                aria-label="효과음 및 음성 음량"
              />
              <span className="text-xs font-black text-[#4A3E3D] w-10 text-right">{Math.round((appState.sfxVolume ?? 1.0) * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Game ON/OFF Customization */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border-2 sm:border-3 border-amber-200 shadow-sm mb-3 text-left">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h2 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-2 break-keep">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> 아이 맞춤 놀이 켜기 / 끄기
          </h2>
          {(appState.disabledGames?.length || 0) > 0 && (
            <button
              type="button"
              onClick={() => {
                (appState.disabledGames || []).forEach(id => onToggleGameDisabled?.(id));
              }}
              className="text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-2.5 py-1 cursor-pointer shrink-0"
            >
              전체 켜기 ({appState.disabledGames?.length}개 꺼짐)
            </button>
          )}
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-[#8C7B79] mb-2.5 break-keep">
          아이의 발달 상태나 선호도에 맞춰 개별 놀이를 켜거나 끌 수 있어요. 꺼진 놀이는 홈 화면에 나타나지 않아요.
        </p>

        {/* Age Group Filter Tabs */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {([
            { id: 'all', label: '전체 보기' },
            { id: 'baby', label: '🌱 만 2세~' },
            { id: 'sprout', label: '🌿 만 3세~' },
            { id: 'bloom', label: '🌻 만 4세~' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGameFilter(tab.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black border cursor-pointer shrink-0 transition-all ${
                gameFilter === tab.id
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-gray-50 text-[#4A3E3D] border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {Object.entries(GAME_CATALOG)
            .filter(([, game]) => gameFilter === 'all' || (game.minAge || 'baby') === gameFilter)
            .map(([gameId, game]) => {
            const isDisabled = appState.disabledGames?.includes(gameId as GameId);
            const ageBadge = game.minAge === 'bloom' ? '만 4세' : game.minAge === 'sprout' ? '만 3세' : '만 2세';
            const ageBadgeColor = game.minAge === 'bloom' ? 'bg-purple-100 text-purple-700' : game.minAge === 'sprout' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

            return (
              <div
                key={gameId}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isDisabled
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-amber-50/40 border-amber-200/60'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${ageBadgeColor}`}>
                    {ageBadge}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-xs sm:text-sm text-[#4A3E3D] block truncate">{game.title}</span>
                    <span className="text-[10px] text-[#8C7B79] block truncate">{game.prompt}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleGameDisabled?.(gameId as GameId)}
                  className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 border cursor-pointer transition-all ${
                    isDisabled
                      ? 'bg-gray-200 text-gray-600 border-gray-300'
                      : 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                  }`}
                  aria-label={`${game.title} ${isDisabled ? '켜기' : '끄기'}`}
                >
                  {isDisabled ? '꺼짐' : '켜짐'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <section className="w-full bg-white p-4 rounded-3xl border-2 border-amber-200 mb-4 flex items-center justify-between gap-3">
        <div><h2 className="font-bold text-sm">작은 진동 반응</h2><p className="text-xs text-stone-500">지원 기기에서 톡! 움직임 줄이기 설정 시 쉬어요.</p></div>
        <button type="button" aria-label="진동 반응" aria-pressed={appState.hapticsEnabled !== false} onClick={onToggleHaptics} className="min-h-12 min-w-16 rounded-2xl bg-amber-100 font-bold text-sm">{appState.hapticsEnabled !== false ? '켜짐' : '꺼짐'}</button>
      </section>

      <section className="w-full bg-white p-4 rounded-3xl border-2 border-amber-200 mb-4">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-sm">입으로 후~ 불기</h2><p className="text-xs text-stone-500">보호자가 마이크를 허용할 수 있어요. 기본은 버튼 놀이예요.</p></div>
          <button type="button" aria-label="마이크 바람 놀이" aria-pressed={appState.microphoneEnabled === true} disabled={micPending} onClick={toggleMicrophone} className="min-h-16 min-w-16 rounded-2xl bg-sky-100 font-bold text-sm">{micPending ? '확인 중' : appState.microphoneEnabled ? '켜짐' : '꺼짐'}</button></div>
        <p role="status" className="text-xs text-stone-600 mt-2">{micStatus}</p>
      </section>

      {/* Quick Actions */}
      <p className="text-xs text-center text-stone-500 mb-4">
        놀이 음악은 골고루 바뀌고, 잠자리에서는 포근한 자장가가 나와요.{' '}
        <a href="/audio/CREDITS.html" target="_blank" rel="noreferrer" className="underline">동물 녹음 출처</a>
      </p>
      <div className="w-full mb-4">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-2.5 sm:py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 shrink-0" /> 모든 놀이 기록 및 설정 초기화
        </button>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-center shadow-xl border-3 border-rose-300 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#4A3E3D] mb-1.5">정말 초기화할까요?</h3>
            <p className="text-xs text-[#8C7B79] font-bold mb-4 break-keep">
              아이의 놀이 시간, 완료한 놀이 기록, 설정된 맞춤 정보가 모두 처음으로 되돌아가요.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetProgress();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-sm cursor-pointer"
              >
                네, 초기화할게요
              </button>
            </div>
          </div>
        </div>
      )}

      <JellyButton variant="primary" size="lg" onClick={onGoHome} className="w-full">
        <CookieHouseIcon className="size-9 mr-1.5" /> 아이 화면으로 돌아가기
      </JellyButton>
    </div>
  );
};

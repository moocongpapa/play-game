import React, { useEffect, useState } from 'react';
import { AppState, ChildProfile, SpeechLanguage } from '../types';
import { JellyButton } from '../components/JellyButton';
import { Shield, Clock, Volume2, Music, Sparkles, Home, RotateCcw, Mic, Calendar, User, CheckCircle2 } from 'lucide-react';
import { speakText, stopAllSpeech } from '../utils/soundEngine';
import { calculateAgeMonths, determineAgeGroup, getAgeGroupLabel, getAgeGroupEmoji, getAgeGroupDescription } from '../utils/ageEngine';
import { isGeminiTTSEnabled, getCharacterAudioStatus, setGeminiTTSEnabled } from '../services/geminiTTS';
import type { CharacterAudioStatus } from '../data/audioExperience';
import { stopGeneratedEffects } from '../services/generatedEffects';
import { CHARACTER_VOICES, type CharacterVoiceId } from '../data/characterVoices';
import { GENERATED_SPEECH_COUNT } from '../data/generatedSpeechManifest';

interface ParentDashboardProps {
  appState: AppState;
  onUpdateTimerMinutes: (min: number) => void;
  onUpdateBgmVolume: (vol: number) => void;
  onUpdateSfxVolume: (vol: number) => void;
  onUpdateSpeechLanguage: (language: SpeechLanguage) => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
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
  onUpdateSpeechLanguage,
  onToggleSound,
  onToggleHaptics,
  onToggleBGM,
  onUnlockAllStickers,
  onResetProgress,
  onGoHome,
  onUpdateProfile,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // 편집용 프로필 상태
  const [editName, setEditName] = useState(appState.childProfile?.name || '유하');
  const [editBirthDate, setEditBirthDate] = useState(appState.childProfile?.birthDate || '2023-01-03');

  const [geminiEnabled, setGeminiEnabled] = useState(isGeminiTTSEnabled());
  const [audioStatus, setAudioStatus] = useState<CharacterAudioStatus | null>(null);
  const aiAvailable = audioStatus?.available;
  const budget = audioStatus?.elevenLabs;
  const [previewStatus, setPreviewStatus] = useState('');

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
    tooth_brush: '치카치카 양치 놀이',
    feeding: '냠냠 골고루 먹기',
    bubble_pop: '비눗방울 톡톡',
    peekaboo_hide: '어디 숨었지? 까꿍',
    animal_xylophone: '동물 실로폰',
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
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 아이의 놀이 기록
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center mb-4">
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
          {Object.keys(CHARACTER_VOICES).length}명의 친구를 위한 안내·인사·칭찬 음성 {GENERATED_SPEECH_COUNT}개를 미리 저장했어요. 저장된 음성은 다른 기기에서도 크레딧 없이 들을 수 있어요.
        </p>
        <div className={`rounded-2xl px-3 py-2.5 text-xs font-bold mb-3 ${aiAvailable ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`} role="status">
          {!audioStatus ? 'AI 소리 연결을 확인하고 있어요.'
            : budget?.reason === 'exhausted' ? '이번 달 포함 크레딧을 모두 사용했어요. 저장된 소리와 기기 목소리로 계속 놀 수 있어요.'
            : budget?.reason === 'plan_not_supported' || budget?.reason === 'overage_enabled' ? '추가 과금이 꺼진 Free·Starter 플랜에서만 새 소리를 만들어요. 지금은 저장된 소리와 기기 목소리를 사용해요.'
            : aiAvailable ? '저장된 음성을 먼저 듣고, 아직 없는 안내와 칭찬만 포함 한도 안에서 준비해요.'
            : '새 소리를 준비할 수 없어요. 저장된 소리와 기기 목소리로 계속 놀 수 있어요.'}
          {budget && budget.limit > 0 && <div className="mt-2 space-y-1">
            <p>포함 크레딧 잔여 {budget.remaining.toLocaleString()} / {budget.limit.toLocaleString()}</p>
            {budget.resetsAt && <p>다음 초기화: {new Date(budget.resetsAt * 1000).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>}
          </div>}
        </div>
        <p className="text-[11px] sm:text-xs text-[#625d67] mb-4 break-keep">
          플랜에 포함된 한도가 돌아오면 놀이 중 필요한 새 소리를 다시 준비해요. 추가 결제는 하지 않아요.
          배경음악 4곡과 효과음 6종도 저장된 파일을 사용해요. 다시 들어도 크레딧을 쓰지 않아요. 새로 만든 개인화 음성은 이 기기에 저장해 다시 사용해요. AI 소리를 꺼도 기본 소리는 유지돼요.
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

      <section className="w-full bg-white p-4 rounded-3xl border-2 border-amber-200 mb-4 flex items-center justify-between gap-3">
        <div><h2 className="font-bold text-sm">작은 진동 반응</h2><p className="text-xs text-stone-500">지원 기기에서 톡! 움직임 줄이기 설정 시 쉬어요.</p></div>
        <button type="button" aria-label="진동 반응" aria-pressed={appState.hapticsEnabled !== false} onClick={onToggleHaptics} className="min-h-12 min-w-16 rounded-2xl bg-amber-100 font-bold text-sm">{appState.hapticsEnabled !== false ? '켜짐' : '꺼짐'}</button>
      </section>

      {/* Quick Actions */}
      <p className="text-xs text-center text-stone-500 mb-4">
        놀이 음악은 골고루 바뀌고, 잠자리에서는 포근한 자장가가 나와요.{' '}
        <a href="/audio/CREDITS.html" target="_blank" rel="noreferrer" className="underline">동물 녹음 출처</a>
      </p>
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

import { normalizeSpeechLanguage } from './utils/speechLanguage';
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AppState, CharacterId, GameId, ChildProfile } from './types';
import { CharacterAvatar } from './components/CharacterAvatar';
import { Header } from './components/Header';
import { ConfettiEffect } from './components/ConfettiEffect';
import { ParentalGateModal } from './components/ParentalGateModal';
import { stopCelebrations } from './utils/confetti';
import { GameStage } from './components/GameStage';
import { useGameTimeouts } from './hooks/useGameTimeouts';
import { SplashLoader } from './components/SplashLoader';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { useViewportLock } from './hooks/useViewportLock';

import { getAudioContext, setSpeechLanguage, setBGMScene, startBGM, stopBGM, setBGMVolume, playStarGain, speakText, stopAllSpeech, stopPlaySounds, setAudioPreferences } from './utils/soundEngine';
import { Moon, Shield } from 'lucide-react';
import { createChildProfile } from './utils/ageEngine';
import { ErrorBoundary } from './components/ErrorBoundary';

const FriendDayScreen = lazy(() => import('./screens/FriendDayScreen').then(m => ({ default: m.FriendDayScreen })));
const TouchEffects = lazy(() => import('./components/TouchEffects').then(module => ({ default: module.TouchEffects })));
const CharacterTalkScreen = lazy(() => import('./screens/CharacterTalkScreen').then(module => ({ default: module.CharacterTalkScreen })));
const AquariumScreen = lazy(() => import('./screens/AquariumScreen').then(module => ({ default: module.AquariumScreen })));
const BugGardenScreen = lazy(() => import('./screens/BugGardenScreen').then(module => ({ default: module.BugGardenScreen })));
const ParentDashboard = lazy(() => import('./screens/ParentDashboard').then(module => ({ default: module.ParentDashboard })));
const SketchbookScreen = lazy(() => import('./screens/SketchbookScreen').then(module => ({ default: module.SketchbookScreen })));
const GgomiObjectGame = lazy(() => import('./screens/games/GgomiObjectGame').then(module => ({ default: module.GgomiObjectGame })));
const RanoShapeColorGame = lazy(() => import('./screens/games/RanoShapeColorGame').then(module => ({ default: module.RanoShapeColorGame })));
const JellyKoreanGame = lazy(() => import('./screens/games/JellyKoreanGame').then(module => ({ default: module.JellyKoreanGame })));
const DochiSoundGame = lazy(() => import('./screens/games/DochiSoundGame').then(module => ({ default: module.DochiSoundGame })));
const GgulgguliCountingGame = lazy(() => import('./screens/games/GgulgguliCountingGame').then(module => ({ default: module.GgulgguliCountingGame })));
const EummeCloudShapeGame = lazy(() => import('./screens/games/EummeCloudShapeGame').then(module => ({ default: module.EummeCloudShapeGame })));
const NurungjiTreasureGame = lazy(() => import('./screens/games/NurungjiTreasureGame').then(module => ({ default: module.NurungjiTreasureGame })));
const EmotionQuizGame = lazy(() => import('./screens/games/EmotionQuizGame').then(module => ({ default: module.EmotionQuizGame })));
const PatternSequenceGame = lazy(() => import('./screens/games/PatternSequenceGame').then(module => ({ default: module.PatternSequenceGame })));
const WordPuzzleGame = lazy(() => import('./screens/games/WordPuzzleGame').then(module => ({ default: module.WordPuzzleGame })));
const RhythmGame = lazy(() => import('./screens/games/RhythmGame').then(module => ({ default: module.RhythmGame })));
const SizeComparisonGame = lazy(() => import('./screens/games/SizeComparisonGame').then(module => ({ default: module.SizeComparisonGame })));
const MemoryCardGame = lazy(() => import('./screens/games/MemoryCardGame').then(module => ({ default: module.MemoryCardGame })));
const ShadowQuizGame = lazy(() => import('./screens/games/ShadowQuizGame').then(module => ({ default: module.ShadowQuizGame })));
const BalloonPopGame = lazy(() => import('./screens/games/BalloonPopGame').then(module => ({ default: module.BalloonPopGame })));
const ToothBrushGame = lazy(() => import('./screens/games/ToothBrushGame').then(module => ({ default: module.ToothBrushGame })));
const FeedingGame = lazy(() => import('./screens/games/FeedingGame').then(module => ({ default: module.FeedingGame })));
const BubblePopGame = lazy(() => import('./screens/games/BubblePopGame').then(module => ({ default: module.BubblePopGame })));
const PeekabooHideGame = lazy(() => import('./screens/games/PeekabooHideGame').then(module => ({ default: module.PeekabooHideGame })));
const AnimalXylophoneGame = lazy(() => import('./screens/games/AnimalXylophoneGame').then(module => ({ default: module.AnimalXylophoneGame })));
const HomeScreen = lazy(() => import('./screens/HomeScreen').then(module => ({ default: module.HomeScreen })));
const PathTracingGame = lazy(() => import('./screens/games/PathTracingGame').then(module => ({ default: module.PathTracingGame })));
const FruitHarvestGame = lazy(() => import('./screens/games/FruitHarvestGame').then(module => ({ default: module.FruitHarvestGame })));
const SymmetryPuzzleGame = lazy(() => import('./screens/games/SymmetryPuzzleGame').then(module => ({ default: module.SymmetryPuzzleGame })));
const SizeOrderingGame = lazy(() => import('./screens/games/SizeOrderingGame').then(module => ({ default: module.SizeOrderingGame })));
const DayNightWeatherGame = lazy(() => import('./screens/games/DayNightWeatherGame').then(module => ({ default: module.DayNightWeatherGame })));
const GoodNightSleepGame = lazy(() => import('./screens/games/GoodNightSleepGame').then(module => ({ default: module.GoodNightSleepGame })));
const EmotionFaceGame = lazy(() => import('./screens/games/EmotionFaceGame').then(module => ({ default: module.EmotionFaceGame })));
const SensoryPaintCanvas = lazy(() => import('./screens/games/SensoryPaintCanvas').then(module => ({ default: module.SensoryPaintCanvas })));
const RainbowStageAdventure = lazy(() => import('./screens/RainbowStageAdventure').then(module => ({ default: module.RainbowStageAdventure })));

export default function App() {
  useViewportLock();
  const mainRef = useRef<HTMLElement>(null);
  const [appState, setAppState] = useState<AppState>(() => {
    // 1. 전용 프로필 스토리지 우선 확인
    let savedProfile: ChildProfile | null = null;
    const profileJson = localStorage.getItem('ITSME_CHILD_PROFILE');
    if (profileJson) {
      try {
        savedProfile = JSON.parse(profileJson);
      } catch (e) {
        console.warn('Failed to parse saved child profile', e);
      }
    }

    // 2. 전체 앱 상태 확인
    const saved = localStorage.getItem('ITSME_APP_STATE');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 저장된 프로필이 있으면 반영, 없으면 기본값(유하, 2023-01-03)
        const finalProfile = savedProfile || parsed.childProfile || createChildProfile('유하', '2023-01-03');
        return {
          ...parsed,
          speechLanguage: normalizeSpeechLanguage(parsed.speechLanguage),
          stars: 0, // 점수 누적 제거
          childProfile: finalProfile,
          onboardingCompleted: true, // 항상 유지되도록 완료 처리
        };
      } catch (e) {
        console.warn('Failed to parse saved state, using default', e);
      }
    }

    const defaultProf = savedProfile || createChildProfile('유하', '2023-01-03');
    return {
      stars: 0,
      unlockedStickers: ['stk_ggomi', 'stk_rano', 'stk_jelly', 'stk_dochi', 'stk_star', 'stk_flower'],
      placedStickers: [],
      selectedCharacter: 'ggomi',
      soundEnabled: true,
      bgmEnabled: true,
      bgmVolume: 0.15,
      sfxVolume: 1.0,
      ttsEnabled: true,
      speechLanguage: 'en',
      hapticsEnabled: true,
      timerMinutes: 0, // 0 = unlimited
      playTimeSeconds: 0,
      isTimeUp: false,
      completedGames: {
        object_recognition: 0,
        shape_color: 0,
        korean_letters: 0,
        sound_quiz: 0,
        counting_food: 0,
        cloud_shapes: 0,
        treasure_hunt: 0,
        emotion_quiz: 0,
        pattern_sequence: 0,
        word_puzzle: 0,
        rhythm_game: 0,
        size_comparison: 0,
      },
      childProfile: defaultProf,
      onboardingCompleted: true, // 한 번 입력 후 또는 기본값으로 계속 유지
    };
  });

  const [showSplash, setShowSplash] = useState(true);
  const finishSplash = useCallback(() => setShowSplash(false), []);
  const [homeStep, setHomeStep] = useState<'friends' | 'games'>('friends');
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game' | 'day' | 'stickers' | 'aquarium' | 'talk' | 'parent' | 'drawing'>('home');
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState(false);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [currentScreen, activeGameId, homeStep]);

  const handleGoHome = () => {
    if (['talk', 'day', 'stickers', 'aquarium'].includes(currentScreen)) setHomeStep('games');
    stopAllSpeech();
    stopPlaySounds();
    stopCelebrations();
    clearGameTimeouts();
    setShowConfetti(false);
    setActiveGameId(null);
    setCurrentScreen('home');
    mainRef.current?.scrollTo(0, 0);
  };

  useEffect(() => {
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, [currentScreen, activeGameId, appState.isTimeUp]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('ITSME_APP_STATE', JSON.stringify(appState));
  }, [appState]);

  // Apply audio choices before child screens start their passive-effect greetings.
  useLayoutEffect(() => {
    setSpeechLanguage(appState.speechLanguage, appState.childProfile?.name || '유하');
    setAudioPreferences(appState.soundEnabled, appState.ttsEnabled !== false);
  }, [appState.soundEnabled, appState.ttsEnabled, appState.speechLanguage, appState.childProfile?.name]);

  const quietPlay = currentScreen === 'game' && activeGameId === 'goodnight_sleep';

  // Resume only in a user gesture; stop background audio when the app is hidden.
  useEffect(() => {
    setBGMScene(quietPlay ? 'sleep' : 'play');
    const enabled = appState.bgmEnabled && appState.soundEnabled && !showSplash && !appState.isTimeUp;
    const syncMusic = () => {
      if (enabled && !document.hidden) startBGM(); else stopBGM();
    };
    const unlockMusic = () => {
      if (enabled && !document.hidden) { getAudioContext(); startBGM(); }
    };
    const onVisibility = () => {
      if (document.hidden) { stopAllSpeech(); stopPlaySounds(); }
      syncMusic();
    };
    syncMusic();
    window.addEventListener('pointerdown', unlockMusic);
    window.addEventListener('keydown', unlockMusic);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopBGM();
      window.removeEventListener('pointerdown', unlockMusic);
      window.removeEventListener('keydown', unlockMusic);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [appState.bgmEnabled, appState.soundEnabled, showSplash, appState.isTimeUp, quietPlay]);

  useEffect(() => { setBGMVolume(appState.bgmVolume); }, [appState.bgmVolume]);

  const soundEnabled = appState.soundEnabled;

  // Timer Tick
  useEffect(() => {
    if (showSplash || appState.isTimeUp || currentScreen === 'parent') return;
    const interval = window.setInterval(() => {
      setAppState((prev) => {
        const nextTime = prev.playTimeSeconds + 1;
        let timeUp = prev.isTimeUp;

        if (prev.timerMinutes > 0 && nextTime >= prev.timerMinutes * 60) {
          timeUp = true;
        }

        return {
          ...prev,
          playTimeSeconds: nextTime,
          isTimeUp: timeUp,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSplash, appState.isTimeUp, currentScreen]);

  // Play Celebration when a quiz round is completed (점수 누적 없이 순수한 성취 축하)
  const handleCompleteQuiz = (_starsEarned: number, completedGameId: GameId | null = activeGameId) => {
    const calm = ['goodnight_sleep', 'sensory_paint', 'emotion_face'].includes(completedGameId || '');
    setShowConfetti(!calm && !document.hidden);
    if (!calm) playStarGain(appState.soundEnabled && !document.hidden);

    setAppState((prev) => {
      // 완료한 게임 카운트만 부모 대시보드 놀이 통계용으로 기록
      const updatedGames = { ...prev.completedGames };
      if (completedGameId) {
        updatedGames[completedGameId] = (updatedGames[completedGameId] || 0) + 1;
      }

      return {
        ...prev,
        completedGames: updatedGames,
      };
    });

    scheduleGameTimeout(() => setShowConfetti(false), 1800);
  };


  const handleStartGame = (gameId: GameId, characterId: CharacterId) => {
    stopAllSpeech();
    setHomeStep('games');
    setAppState((prev) => ({ ...prev, selectedCharacter: characterId }));
    setActiveGameId(gameId);
    setCurrentScreen('game');
  };

  const handleToggleSound = () => {
    setAudioPreferences(!appState.soundEnabled, appState.ttsEnabled !== false);
    setAppState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleCompleteOnboarding = (profile: ChildProfile) => {
    try {
      localStorage.setItem('ITSME_CHILD_PROFILE', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save child profile', e);
    }
    setAppState((prev) => ({
      ...prev,
      childProfile: profile,
      onboardingCompleted: true,
    }));
  };

  const childName = appState.childProfile?.name || '유하';
  const ageGroup = appState.childProfile?.ageGroup || 'sprout';

  // Render current screen content
  const renderContent = () => {
    if (appState.isTimeUp) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[80vh]">
          <div className="p-6 rounded-full bg-indigo-100 text-indigo-600 mb-4 animate-pulse">
            <Moon className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-black text-[#4A3E3D] mb-2">
            동물 친구들이 자러 갔어요~ 🌙
          </h1>
          <p className="text-lg font-bold text-[#8C7B79] mb-6">
            오늘 공부와 놀이를 참 잘했어요!<br />
            내일 또 만나러 와주세요. 푹 자요~ 😴
          </p>
          <button
            onClick={() => setIsParentGateOpen(true)}
            className="px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-[#4A3E3D] font-bold text-sm flex items-center gap-2 cursor-pointer border-2 border-amber-300 active:scale-95"
          >
            <Shield className="w-5 h-5" /> 부모 전용 잠금 해제
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            step={homeStep}
            onChangeStep={setHomeStep}
            selectedCharacter={appState.selectedCharacter}
            onSelectCharacter={(id) => setAppState((prev) => ({ ...prev, selectedCharacter: id }))}
            onStartGame={handleStartGame}
            onStartDay={() => { setHomeStep('games'); setCurrentScreen('day'); }}
            onOpenDrawing={() => setCurrentScreen('drawing')}
            onOpenStickerRoom={() => setCurrentScreen('stickers')}
            onOpenAquarium={() => setCurrentScreen('aquarium')}
            onOpenCharacterTalk={() => setCurrentScreen('talk')}
            soundEnabled={soundEnabled}
            childProfile={appState.childProfile}
          />
        );

      case 'day':
        return <FriendDayScreen buddy={appState.selectedCharacter} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} onCompleteGame={id => handleCompleteQuiz(1, id)} onGoHome={handleGoHome} />;

      case 'drawing':
        return (
          <SketchbookScreen
            buddy={appState.selectedCharacter}
            onGoHome={handleGoHome}
            soundEnabled={soundEnabled}
            childName={childName}
          />
        );

      case 'talk':
        return (
          <CharacterTalkScreen
            selectedCharacter={appState.selectedCharacter}
            onSelectCharacter={(id) => setAppState((prev) => ({ ...prev, selectedCharacter: id }))}
            onGoHome={handleGoHome}
            soundEnabled={soundEnabled}
            childName={childName}
          />
        );

      case 'stickers':
        return (
          <BugGardenScreen
            buddy={appState.selectedCharacter}
            childName={childName}
            soundEnabled={soundEnabled}
          />
        );


      case 'aquarium':
        return <AquariumScreen buddy={appState.selectedCharacter} childName={childName} soundEnabled={soundEnabled} />;

      case 'parent':
        return (
          <ParentDashboard
            appState={appState}
            onUpdateTimerMinutes={(min) =>
              setAppState((prev) => ({ ...prev, timerMinutes: min, isTimeUp: false }))
            }
            onUpdateBgmVolume={(vol) => {
              setBGMVolume(vol);
              setAppState((prev) => ({ ...prev, bgmVolume: vol }));
            }}
            onUpdateSfxVolume={(vol) =>
              setAppState((prev) => ({ ...prev, sfxVolume: vol }))
            }
            onUpdateSpeechLanguage={language => {
              setSpeechLanguage(language, childName);
              setAppState(prev => ({ ...prev, speechLanguage: language }));
            }}
            onToggleSound={handleToggleSound}
            onToggleHaptics={() => setAppState(prev => ({ ...prev, hapticsEnabled: prev.hapticsEnabled === false }))}
            onToggleBGM={() =>
              setAppState((prev) => ({ ...prev, bgmEnabled: !prev.bgmEnabled }))
            }
            onUnlockAllStickers={() => {
              setAppState((prev) => ({
                ...prev,
                unlockedStickers: [
                  'stk_ggomi', 'stk_rano', 'stk_jelly', 'stk_dochi',
                  'stk_ggulgguli', 'stk_eumme', 'stk_nurungji', 'stk_star',
                  'stk_crown', 'stk_rainbow', 'stk_flower', 'stk_candy',
                ],
              }));
              speakText('모든 스티커 잠금이 해제되었습니다!', appState.soundEnabled);
            }}
            onResetProgress={() => {
              localStorage.removeItem('ITSME_APP_STATE');
              window.location.reload();
            }}
            onGoHome={handleGoHome}
            onUpdateProfile={(profile) => {
              try {
                localStorage.setItem('ITSME_CHILD_PROFILE', JSON.stringify(profile));
              } catch (e) {
                console.warn('Failed to save child profile', e);
              }
              setAppState((prev) => ({ ...prev, childProfile: profile }));
            }}
          />
        );

      case 'game':
        return (
          <ErrorBoundary
            fallbackTitle="앗! 이 놀이에서 동물 친구가 잠시 쉬고 있어요!"
            onReset={handleGoHome}
          >
            <GameStage gameId={activeGameId || 'object_recognition'} buddy={appState.selectedCharacter} soundEnabled={soundEnabled}>
            {(() => {
              switch (activeGameId) {
                // 기존 7개 게임
                case 'object_recognition':
                  return (
                    <GgomiObjectGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'shape_color':
                  return (
                    <RanoShapeColorGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'korean_letters':
                  return (
                    <JellyKoreanGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'sound_quiz':
                  return (
                    <DochiSoundGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'counting_food':
                  return (
                    <GgulgguliCountingGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'cloud_shapes':
                  return (
                    <EummeCloudShapeGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'treasure_hunt':
                  return (
                    <NurungjiTreasureGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );

                // 신규 5개 게임
                case 'emotion_quiz':
                  return (
                    <EmotionQuizGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'pattern_sequence':
                  return (
                    <PatternSequenceGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'word_puzzle':
                  return (
                    <WordPuzzleGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'rhythm_game':
                  return (
                    <RhythmGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'size_comparison':
                  return (
                    <SizeComparisonGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'memory_card':
                  return (
                    <MemoryCardGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'shadow_quiz':
                  return (
                    <ShadowQuizGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'path_tracing':
                  return <PathTracingGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'fruit_harvest':
                  return <FruitHarvestGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'symmetry_puzzle':
                  return <SymmetryPuzzleGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'size_ordering':
                  return <SizeOrderingGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'day_night_weather':
                  return <DayNightWeatherGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'goodnight_sleep':
                  return <GoodNightSleepGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'emotion_face':
                  return <EmotionFaceGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'sensory_paint':
                  return <SensoryPaintCanvas buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'tooth_brush':
                  return <ToothBrushGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'feeding':
                  return <FeedingGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'bubble_pop':
                  return <BubblePopGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'peekaboo_hide':
                  return <PeekabooHideGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'animal_xylophone':
                  return <AnimalXylophoneGame buddy={appState.selectedCharacter} onCompleteQuiz={handleCompleteQuiz} soundEnabled={soundEnabled} ageGroup={ageGroup} childName={childName} />;
                case 'stage_adventure':
                  return (
                    <RainbowStageAdventure
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      onGoHome={handleGoHome}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );
                case 'balloon_pop':
                  return (
                    <BalloonPopGame
                      buddy={appState.selectedCharacter}
                      onCompleteQuiz={handleCompleteQuiz}
                      soundEnabled={soundEnabled}
                      ageGroup={ageGroup}
                      childName={childName}
                    />
                  );

                default:
                  return (
                    <HomeScreen
                      step={homeStep}
                      onChangeStep={setHomeStep}
                      selectedCharacter={appState.selectedCharacter}
                      onSelectCharacter={(id) => setAppState((prev) => ({ ...prev, selectedCharacter: id }))}
                      onStartGame={handleStartGame}
                      onStartDay={() => { setHomeStep('games'); setCurrentScreen('day'); }}
                      onOpenDrawing={() => setCurrentScreen('drawing')}
                      onOpenStickerRoom={() => setCurrentScreen('stickers')}
                      onOpenAquarium={() => setCurrentScreen('aquarium')}
                      onOpenCharacterTalk={() => setCurrentScreen('talk')}
                      soundEnabled={soundEnabled}
                      childProfile={appState.childProfile}
                    />
                  );
              }
            })()}
            </GameStage>
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="app-world text-[#49443d] font-sans antialiased" data-screen={currentScreen}>
      <Suspense fallback={null}>
        <TouchEffects active={!showSplash && !isParentGateOpen && currentScreen !== 'parent' && !appState.isTimeUp} screenKey={`${currentScreen}:${activeGameId}:${homeStep}`} hapticsEnabled={appState.hapticsEnabled !== false} />
      </Suspense>
      <ConfettiEffect active={showConfetti} buddy={appState.selectedCharacter} />

      {!showSplash && <>
      <Header
        stars={appState.stars}
        selectedCharacter={appState.selectedCharacter}
        bgmEnabled={appState.bgmEnabled}
        soundEnabled={appState.soundEnabled}
        onToggleBGM={() =>
          setAppState((prev) => ({ ...prev, bgmEnabled: !prev.bgmEnabled }))
        }
        onToggleSound={handleToggleSound}
        onOpenParentGate={() => setIsParentGateOpen(true)}
        onOpenStickerRoom={() => setCurrentScreen('stickers')}
        onOpenAquarium={() => setCurrentScreen('aquarium')}
        onGoHome={handleGoHome}
        currentScreen={currentScreen}
        childName={childName}
      />

      <main ref={mainRef} className="app-main w-full px-3 py-5 pb-12 sm:px-6 sm:py-7" data-scroll-region>
        <ErrorBoundary onReset={handleGoHome}>
          <Suspense fallback={<div className="game-loading" role="status"><CharacterAvatar id={appState.selectedCharacter} size="xl" mood="waving" /><p>놀이를 꺼내오는 중이에요</p></div>}>{renderContent()}</Suspense>
        </ErrorBoundary>
      </main>
      </>}

      <ParentalGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => {
          setIsParentGateOpen(false);
          setAppState((prev) => ({ ...prev, isTimeUp: false }));
          setCurrentScreen('parent');
        }}
      />

      {showSplash && (
        <SplashLoader
          onFinish={finishSplash}
          childName={childName}
        />
      )}

      {!appState.onboardingCompleted && !showSplash && (
        <OnboardingScreen
          onCompleteOnboarding={handleCompleteOnboarding}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
}

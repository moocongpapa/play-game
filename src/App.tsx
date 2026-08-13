import React, { useState, useEffect } from 'react';
import { AppState, CharacterId, GameId, ChildProfile } from './types';
import { Header } from './components/Header';
import { ConfettiEffect } from './components/ConfettiEffect';
import { ParentalGateModal } from './components/ParentalGateModal';
import { HomeScreen } from './screens/HomeScreen';
import { CharacterTalkScreen } from './screens/CharacterTalkScreen';
import { StickerRoomScreen } from './screens/StickerRoomScreen';
import { ParentDashboard } from './screens/ParentDashboard';
import { CharacterCharmVideoModal } from './components/CharacterCharmVideoModal';
import { SplashLoader } from './components/SplashLoader';
import { OnboardingScreen } from './screens/OnboardingScreen';

// Mini Games (기존 7종)
import { GgomiObjectGame } from './screens/games/GgomiObjectGame';
import { RanoShapeColorGame } from './screens/games/RanoShapeColorGame';
import { JellyKoreanGame } from './screens/games/JellyKoreanGame';
import { DochiSoundGame } from './screens/games/DochiSoundGame';
import { GgulgguliCountingGame } from './screens/games/GgulgguliCountingGame';
import { EummeCloudShapeGame } from './screens/games/EummeCloudShapeGame';
import { NurungjiTreasureGame } from './screens/games/NurungjiTreasureGame';

// New Mini Games (신규 5종)
import { EmotionQuizGame } from './screens/games/EmotionQuizGame';
import { PatternSequenceGame } from './screens/games/PatternSequenceGame';
import { WordPuzzleGame } from './screens/games/WordPuzzleGame';
import { RhythmGame } from './screens/games/RhythmGame';
import { SizeComparisonGame } from './screens/games/SizeComparisonGame';

import { startBGM, stopBGM, setBGMVolume, playStarGain, speakText } from './utils/soundEngine';
import { initAuth, fetchDriveFolderVideos, GOOGLE_DRIVE_FOLDER_ID } from './services/googleDrive';
import { Moon, Shield } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('ITSME_APP_STATE');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 하위 호환성 패치
        if (parsed.onboardingCompleted === undefined) {
          parsed.onboardingCompleted = false;
          parsed.childProfile = null;
        }
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved state, using default', e);
      }
    }
    return {
      stars: 5,
      unlockedStickers: ['stk_ggomi', 'stk_rano', 'stk_jelly', 'stk_dochi', 'stk_star', 'stk_flower'],
      placedStickers: [],
      selectedCharacter: 'ggomi',
      soundEnabled: true,
      bgmEnabled: true,
      bgmVolume: 0.15,
      sfxVolume: 1.0,
      ttsEnabled: true,
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
      childProfile: null,
      onboardingCompleted: false,
    };
  });

  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game' | 'stickers' | 'talk' | 'parent'>('home');
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState(false);
  const [isCharmVideoModalOpen, setIsCharmVideoModalOpen] = useState(false);
  const [charmVideoCharId, setCharmVideoCharId] = useState<CharacterId>('ggomi');

  const handleOpenCharmVideo = (charId?: CharacterId) => {
    if (charId) setCharmVideoCharId(charId);
    else setCharmVideoCharId(appState.selectedCharacter);
    setIsCharmVideoModalOpen(true);
  };

  // Auto initialize Google Drive on app start
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        fetchDriveFolderVideos(GOOGLE_DRIVE_FOLDER_ID, token).catch((e) => {
          console.warn('Auto fetch drive videos error:', e);
        });
      },
      () => {
        // Not logged in on startup
      }
    );
    return () => unsubscribe();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('ITSME_APP_STATE', JSON.stringify(appState));
  }, [appState]);

  // Handle BGM state
  useEffect(() => {
    if (appState.bgmEnabled) {
      startBGM(appState.bgmVolume);
    } else {
      stopBGM();
    }
    return () => stopBGM();
  }, [appState.bgmEnabled, appState.bgmVolume]);

  // Timer Tick
  useEffect(() => {
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
  }, []);

  // Reward Handler when a quiz round is completed
  const handleCompleteQuiz = (starsEarned: number) => {
    setShowConfetti(true);
    playStarGain(appState.soundEnabled);

    setAppState((prev) => {
      const newStars = prev.stars + starsEarned;
      // Auto unlock extra stickers if star milestones reached
      const unlocked = [...prev.unlockedStickers];
      if (newStars >= 10 && !unlocked.includes('stk_ggulgguli')) unlocked.push('stk_ggulgguli');
      if (newStars >= 15 && !unlocked.includes('stk_eumme')) unlocked.push('stk_eumme');
      if (newStars >= 20 && !unlocked.includes('stk_nurungji')) unlocked.push('stk_nurungji');
      if (newStars >= 25 && !unlocked.includes('stk_rainbow')) unlocked.push('stk_rainbow');

      // 활성화된 게임 카운트 증가
      const updatedGames = { ...prev.completedGames };
      if (activeGameId) {
        updatedGames[activeGameId] = (updatedGames[activeGameId] || 0) + 1;
      }

      return {
        ...prev,
        stars: newStars,
        unlockedStickers: unlocked,
        completedGames: updatedGames,
      };
    });

    setTimeout(() => setShowConfetti(false), 2500);
  };

  const handleStartGame = (gameId: GameId, characterId: CharacterId) => {
    setAppState((prev) => ({ ...prev, selectedCharacter: characterId }));
    setActiveGameId(gameId);
    setCurrentScreen('game');
  };

  const handleCompleteOnboarding = (profile: ChildProfile) => {
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
            selectedCharacter={appState.selectedCharacter}
            onSelectCharacter={(id) => setAppState((prev) => ({ ...prev, selectedCharacter: id }))}
            onStartGame={handleStartGame}
            onOpenStickerRoom={() => setCurrentScreen('stickers')}
            onOpenCharacterTalk={() => setCurrentScreen('talk')}
            onOpenCharmVideo={handleOpenCharmVideo}
            soundEnabled={appState.soundEnabled}
            childProfile={appState.childProfile}
          />
        );

      case 'talk':
        return (
          <CharacterTalkScreen
            selectedCharacter={appState.selectedCharacter}
            onSelectCharacter={(id) => setAppState((prev) => ({ ...prev, selectedCharacter: id }))}
            onGoHome={() => setCurrentScreen('home')}
            onOpenCharmVideo={handleOpenCharmVideo}
            soundEnabled={appState.soundEnabled}
            childName={childName}
          />
        );

      case 'stickers':
        return (
          <StickerRoomScreen
            unlockedStickers={appState.unlockedStickers}
            placedStickers={appState.placedStickers}
            onUpdatePlacedStickers={(stickers) =>
              setAppState((prev) => ({ ...prev, placedStickers: stickers }))
            }
            onGoHome={() => setCurrentScreen('home')}
            soundEnabled={appState.soundEnabled}
          />
        );

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
            onToggleSound={() =>
              setAppState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
            }
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
              speakText('모든 스티커 잠금이 해제되었습니다!');
            }}
            onResetProgress={() => {
              localStorage.removeItem('ITSME_APP_STATE');
              window.location.reload();
            }}
            onGoHome={() => setCurrentScreen('home')}
            onUpdateProfile={(profile) => {
              setAppState((prev) => ({ ...prev, childProfile: profile }));
            }}
          />
        );

      case 'game':
        switch (activeGameId) {
          // 기존 7개 게임
          case 'object_recognition':
            return (
              <GgomiObjectGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'shape_color':
            return (
              <RanoShapeColorGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'korean_letters':
            return (
              <JellyKoreanGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'sound_quiz':
            return (
              <DochiSoundGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'counting_food':
            return (
              <GgulgguliCountingGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'cloud_shapes':
            return (
              <EummeCloudShapeGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'treasure_hunt':
            return (
              <NurungjiTreasureGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );

          // 신규 5개 게임
          case 'emotion_quiz':
            return (
              <EmotionQuizGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'pattern_sequence':
            return (
              <PatternSequenceGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'word_puzzle':
            return (
              <WordPuzzleGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'rhythm_game':
            return (
              <RhythmGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );
          case 'size_comparison':
            return (
              <SizeComparisonGame
                onCompleteQuiz={handleCompleteQuiz}
                soundEnabled={appState.soundEnabled}
                ageGroup={ageGroup}
                childName={childName}
              />
            );

          default:
            return (
              <HomeScreen
                selectedCharacter={appState.selectedCharacter}
                onSelectCharacter={(id) => setAppState((prev) => ({ ...prev, selectedCharacter: id }))}
                onStartGame={handleStartGame}
                onOpenStickerRoom={() => setCurrentScreen('stickers')}
                onOpenCharacterTalk={() => setCurrentScreen('talk')}
                onOpenCharmVideo={handleOpenCharmVideo}
                soundEnabled={appState.soundEnabled}
                childProfile={appState.childProfile}
              />
            );
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9E6] text-[#4A3E3D] font-sans antialiased selection:bg-[#FFD15C]">
      <ConfettiEffect active={showConfetti} />

      <Header
        stars={appState.stars}
        selectedCharacter={appState.selectedCharacter}
        bgmEnabled={appState.bgmEnabled}
        soundEnabled={appState.soundEnabled}
        onToggleBGM={() =>
          setAppState((prev) => ({ ...prev, bgmEnabled: !prev.bgmEnabled }))
        }
        onToggleSound={() =>
          setAppState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onOpenParentGate={() => setIsParentGateOpen(true)}
        onOpenStickerRoom={() => setCurrentScreen('stickers')}
        onOpenCharacterSelect={() => setCurrentScreen('talk')}
        onGoHome={() => setCurrentScreen('home')}
        currentScreen={currentScreen}
        childName={childName}
        ageGroup={ageGroup}
      />

      <main className="container mx-auto px-4 py-4 pb-12">
        {renderContent()}
      </main>

      <ParentalGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => {
          setIsParentGateOpen(false);
          setAppState((prev) => ({ ...prev, isTimeUp: false }));
          setCurrentScreen('parent');
        }}
      />

      <CharacterCharmVideoModal
        isOpen={isCharmVideoModalOpen}
        onClose={() => setIsCharmVideoModalOpen(false)}
        initialCharacterId={charmVideoCharId}
        soundEnabled={appState.soundEnabled}
        onRewardStar={() => handleCompleteQuiz(1)}
      />

      {showSplash && (
        <SplashLoader
          onFinish={() => setShowSplash(false)}
          soundEnabled={appState.soundEnabled}
          bgmEnabled={appState.bgmEnabled}
          childName={childName}
        />
      )}

      {!appState.onboardingCompleted && !showSplash && (
        <OnboardingScreen
          onCompleteOnboarding={handleCompleteOnboarding}
          soundEnabled={appState.soundEnabled}
        />
      )}
    </div>
  );
}

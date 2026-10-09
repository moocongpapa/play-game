import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterId } from '../types';
import { CHARACTER_LIST } from '../data/characters';
import { CHARACTER_VIDEOS, CharacterVideoData, VideoScene } from '../data/characterVideoData';
import { CharacterAvatar } from './CharacterAvatar';
import { speakText, playCorrectFanfare, playBubblePop, stopAllSpeech } from '../utils/soundEngine';
import {
  initAuth,
  googleSignIn,
  fetchDriveFolderVideos,
  fetchDriveVideoBlobUrl,
  findDriveFileForCharacter,
  DriveVideoFile,
  GOOGLE_DRIVE_FOLDER_ID,
  getCachedDriveFiles,
} from '../services/googleDrive';
import { User } from 'firebase/auth';
import { RotateCcw, X, Heart, Sparkles, Award, Repeat, RefreshCw, ArrowLeft, Copy, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface CharacterCharmVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCharacterId: CharacterId;
  soundEnabled: boolean;
  onRewardStar?: () => void;
}

export const CharacterCharmVideoModal: React.FC<CharacterCharmVideoModalProps> = ({
  isOpen,
  onClose,
  initialCharacterId,
  soundEnabled,
  onRewardStar,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<CharacterId>(initialCharacterId);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [cheerCount, setCheerCount] = useState<number>(0);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Google Drive integration states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveVideoFile[]>(getCachedDriveFiles());
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveVideoFile | null>(null);
  const [driveVideoBlobUrl, setDriveVideoBlobUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);

  const videoData: CharacterVideoData = CHARACTER_VIDEOS[selectedCharId] || CHARACTER_VIDEOS.ggomi;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastSpokenSceneIdxRef = useRef<number>(-1);

  // Initialize Auth state listener & auto-load Google Drive videos
  useEffect(() => {
    const unsubscribe = initAuth(
      async (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (token) {
          try {
            const files = await fetchDriveFolderVideos(GOOGLE_DRIVE_FOLDER_ID, token);
            setDriveFiles(files);
          } catch (e) {
            console.warn('Drive folder videos fetch error:', e);
          }
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When modal opens or character changes
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllSpeech();
      return;
    }

    setSelectedCharId(initialCharacterId);
    setCurrentTime(0);
    setCheerCount(0);
    setRewardClaimed(false);
    lastSpokenSceneIdxRef.current = -1;
  }, [isOpen, initialCharacterId]);

  // Load matching Drive video file whenever selectedCharId or driveFiles change
  useEffect(() => {
    if (!isOpen) return;

    setCurrentTime(0);
    setRewardClaimed(false);
    lastSpokenSceneIdxRef.current = -1;

    const matchedFile = findDriveFileForCharacter(selectedCharId, driveFiles);
    if (matchedFile && accessToken) {
      setSelectedDriveFile(matchedFile);
      setIsLoadingVideo(true);
      setDriveVideoBlobUrl(null);
      fetchDriveVideoBlobUrl(matchedFile.id, accessToken)
        .then((blobUrl) => {
          setDriveVideoBlobUrl(blobUrl);
        })
        .catch((err) => {
          console.error('Error fetching video blob:', err);
          setDriveVideoBlobUrl(`https://drive.google.com/file/d/${matchedFile.id}/preview`);
        })
        .finally(() => {
          setIsLoadingVideo(false);
        });
    } else {
      setSelectedDriveFile(null);
      setDriveVideoBlobUrl(null);
      setIsLoadingVideo(false);
    }
  }, [selectedCharId, driveFiles, accessToken, isOpen]);

  // Determine current active scene based on currentTime
  const currentSceneIndex = Math.min(
    Math.floor((currentTime / (duration || 10)) * videoData.scenes.length),
    videoData.scenes.length - 1
  );
  const currentScene: VideoScene = videoData.scenes[currentSceneIndex] || videoData.scenes[0];

  // Speak scene narration when scene changes
  useEffect(() => {
    if (!isOpen || isMuted) return;

    if (lastSpokenSceneIdxRef.current !== currentSceneIndex) {
      lastSpokenSceneIdxRef.current = currentSceneIndex;
      speakText(currentScene.voiceText, soundEnabled, {
        characterId: selectedCharId,
        playIntroSFX: true,
      });
    }
  }, [currentSceneIndex, isOpen, selectedCharId, soundEnabled, currentScene.voiceText, isMuted]);

  // Loop timer driver for GIF animation stage (when drive video is not active)
  useEffect(() => {
    if (isOpen && !driveVideoBlobUrl && !videoData.hasVideo) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= 10) {
            return 0; // Infinite loop restart
          }
          return parseFloat(next.toFixed(1));
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, driveVideoBlobUrl, videoData.hasVideo]);

  // Trigger reward star when currentTime completes full loop
  useEffect(() => {
    if (isOpen && currentTime >= 9.8 && !rewardClaimed) {
      setRewardClaimed(true);
      playCorrectFanfare(soundEnabled);
      if (onRewardStar) {
        onRewardStar();
      }
    }
  }, [isOpen, currentTime, rewardClaimed, soundEnabled, onRewardStar]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopAllSpeech();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const handleSelectCharacter = (charId: CharacterId) => {
    stopAllSpeech();
    setSelectedCharId(charId);
    setCurrentTime(0);
    setRewardClaimed(false);
    lastSpokenSceneIdxRef.current = -1;
  };

  const handleReplay = () => {
    stopAllSpeech();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setCurrentTime(0);
    lastSpokenSceneIdxRef.current = -1;
  };

  const handleCheerTap = () => {
    playBubblePop(soundEnabled);
    setCheerCount((prev) => prev + 1);
    const newHeart = { id: Date.now(), x: Math.random() * 80 + 10 };
    setFloatingHearts((prev) => [...prev.slice(-10), newHeart]);
  };

  const currentChar = CHARACTER_LIST.find((c) => c.id === selectedCharId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="juice-dialog relative w-full max-w-xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border-4 border-[#FFA000] overflow-hidden flex flex-col my-auto">
        {/* Top Header Controls (Prominent Top-Left Back Button & Short Title) */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-2.5 sm:p-3 flex items-center justify-between text-white">
          {/* Top-Left Back Button */}
          <button
            onClick={handleClose}
            className="py-1.5 px-3 sm:px-4 bg-white text-amber-700 hover:bg-amber-100 font-black text-sm sm:text-base rounded-full shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shrink-0"
            title="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3]" />
            <span>👈</span>
          </button>

          {/* Short Simple Title for Kids */}
          <div className="flex items-center gap-1.5 text-center truncate mx-2">
            <h2 className="text-base sm:text-lg font-black leading-tight text-white flex items-center gap-1 truncate">
              <span>{currentChar?.badge}</span>
              <span>{currentChar?.name}</span>
              <span>🎬</span>
            </h2>
          </div>

          {/* Right Close Icon Button */}
          <button
            onClick={handleClose}
            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Character Selector Ribbon (Clean buttons directly above video stage) */}
        <div className="bg-amber-50 px-2 py-2 border-b-2 border-amber-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CHARACTER_LIST.map((char) => {
            const isSelected = char.id === selectedCharId;
            return (
              <button
                key={char.id}
                onClick={() => handleSelectCharacter(char.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs scale-105 border-2 border-amber-600'
                    : 'bg-white text-[#4A3E3D] hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <CharacterAvatar id={char.id} size="sm" mood="happy" className="!w-6 !h-6" />
                <span>{char.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Stage Video Player Frame */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-900 overflow-hidden flex flex-col justify-between p-3 sm:p-4 select-none">
          {isLoadingVideo ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-2" />
              <span className="text-xs font-bold text-amber-200">
                {CHARACTER_LIST.find((c) => c.id === selectedCharId)?.name} 친구의 영상 로딩 중...
              </span>
            </div>
          ) : driveVideoBlobUrl?.startsWith('blob:') ? (
            /* Direct Streamed Google Drive Video Player */
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                src={driveVideoBlobUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) {
                    setDuration(v.duration);
                    setCurrentTime(v.currentTime);
                  }
                }}
              />
            </div>
          ) : driveVideoBlobUrl ? (
            /* Fallback Google Drive Preview Frame */
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
              <iframe
                src={driveVideoBlobUrl}
                className="w-full h-full border-0"
                allow="autoplay"
                title="Google Drive Video Player"
              />
            </div>
          ) : videoData.hasVideo && videoData.videoUrl ? (
            /* Local / Generated Veo Video Player */
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                src={videoData.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) {
                    setDuration(v.duration);
                    setCurrentTime(v.currentTime);
                  }
                }}
              />
            </div>
          ) : (
            /* Animated Motion Stage Frame */
            <>
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${currentScene.bgGradient} transition-all duration-700 opacity-90`}
              />

              {/* Floating Background Particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {currentScene.bgDecorations.map((emoji, idx) => (
                  <motion.div
                    key={`${selectedCharId}-${idx}-${currentSceneIndex}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: [0, -20, 0],
                      scale: [0.9, 1.25, 0.9],
                      rotate: [0, 15, -15, 0],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ duration: 1.5 + idx * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute text-3xl sm:text-5xl filter drop-shadow-md"
                    style={{
                      top: `${12 + idx * 22}%`,
                      left: `${8 + (idx * 26) % 80}%`,
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              {/* Main Character Avatar */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                <motion.div
                  key={`${selectedCharId}-${currentSceneIndex}`}
                  initial={{ scale: 0.85, rotate: -6 }}
                  animate={{
                    scale: [1, 1.15, 0.98, 1.1, 1],
                    rotate: [0, 8, -8, 5, 0],
                    y: [0, -12, 0, -6, 0],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative cursor-pointer"
                  onClick={handleCheerTap}
                >
                  <div className="absolute -inset-4 rounded-full bg-white/30 blur-md animate-pulse pointer-events-none" />

                  <CharacterAvatar
                    id={selectedCharId}
                    size="xl"
                    mood={currentScene.mood}
                    className="!w-32 !h-32 sm:!w-40 sm:!h-40 filter drop-shadow-2xl relative z-10"
                  />

                  <div className="absolute -inset-4 rounded-full border-3 border-white/50 border-dashed animate-spin pointer-events-none" />
                </motion.div>
              </div>

              {/* Action Badge & Audio Toggle */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-amber-300 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>{currentScene.actionBadge}</span>
                </div>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="inline-flex items-center gap-1 bg-black/65 hover:bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-white border border-white/30 cursor-pointer transition-colors shadow-md"
                >
                  <span>{isMuted ? '🔇 음성 켜기' : '🔊 음성 끎'}</span>
                </button>
              </div>

              {/* Floating Hearts */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <AnimatePresence>
                  {floatingHearts.map((h) => (
                    <motion.div
                      key={h.id}
                      initial={{ y: 300, opacity: 1, scale: 0.8 }}
                      animate={{ y: -50, opacity: 0, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="absolute text-3xl sm:text-4xl"
                      style={{ left: `${h.x}%` }}
                    >
                      💖
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Subtitle speech bubble */}
              <div className="relative z-10 w-full bg-black/75 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/30 text-center shadow-lg break-keep">
                <span className="text-[10px] sm:text-xs font-black text-amber-300 block mb-0.5">
                  🗣️ {currentScene.title}
                </span>
                <p className="text-xs sm:text-base font-black text-white leading-snug">
                  &ldquo;{currentScene.subtitle}&rdquo;
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bottom Progress Bar */}
        <div className="bg-amber-100 p-2 sm:p-2.5 border-t-2 border-amber-300">
          <div
            className="w-full bg-amber-200 h-3 rounded-full overflow-hidden border border-amber-300 relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              const targetTime = pos * (duration || 10);
              setCurrentTime(targetTime);
              if (videoRef.current) {
                videoRef.current.currentTime = targetTime;
              }
            }}
          >
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 h-full transition-all duration-100"
              style={{ width: `${(currentTime / (duration || 10)) * 100}%` }}
            />
          </div>
        </div>

        {/* Story Theme & AI Video Prompt Details */}
        {videoData.storyTheme && (
          <div className="bg-amber-50/90 border-t border-amber-200 p-2 sm:p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm">❄️</span>
                <span className="font-extrabold text-amber-800 shrink-0">스토리 테마:</span>
                <span className="font-bold text-amber-950 truncate">{videoData.storyTheme}</span>
              </div>
              {videoData.videoPrompt && (
                <button
                  onClick={() => setShowPromptDetails(!showPromptDetails)}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showPromptDetails ? '기획 접기' : 'AI 프롬프트'}</span>
                  {showPromptDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {showPromptDetails && videoData.videoPrompt && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-200/80 space-y-2 text-[11px]">
                {videoData.dubbingScript && (
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                    <div className="font-black text-amber-800 mb-0.5 flex items-center gap-1">
                      <span>🎙️</span>
                      <span>11labs 더빙 음성 스크립트:</span>
                    </div>
                    <p className="text-stone-700 font-medium leading-relaxed">
                      &ldquo;{videoData.dubbingScript}&rdquo;
                    </p>
                  </div>
                )}

                <div className="bg-stone-900 text-amber-100 p-2.5 rounded-xl border border-stone-700 relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <span>🎬</span>
                      <span>Veo / AI Video Prompt (30s)</span>
                    </span>
                    <button
                      onClick={() => {
                        if (videoData.videoPrompt) {
                          navigator.clipboard.writeText(videoData.videoPrompt).then(() => {
                            setCopiedPrompt(true);
                            setTimeout(() => setCopiedPrompt(false), 2000);
                          }).catch(() => {});
                        }
                      }}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      title="프롬프트 복사"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3 h-3 text-green-950" />
                          <span>복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>프롬프트 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[10px] text-stone-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto selection:bg-amber-500 selection:text-black">
                    {videoData.videoPrompt}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

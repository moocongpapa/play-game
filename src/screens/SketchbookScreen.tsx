import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DrawingCanvas from '../sketch/DrawingCanvas';
import { LivingCharacterStage } from '../sketch/LivingCharacterStage';
import {
  backgrounds,
  colors,
  stickerKinds,
  freshArtwork,
  change,
  undo,
  redo,
  type Artwork,
  type Brush,
  type History,
} from '../sketch/model';
import { templates } from '../sketch/art';
import { renderArtwork, renderCharacterSprite } from '../sketch/render';
import { playDrawingSound, playSound } from '../sketch/sound';
import { loadDraft, saveDraft, saveGallery, listGallery, deleteGallery, type SavedArt } from '../sketch/storage';
import {
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Sparkles,
  Eraser,
  Paintbrush,
  Pencil,
  Highlighter,
  PaintBucket,
  Trash2,
  X,
  Sticker as StickerIcon,
  Zap,
  CircleDot,
  Wand2,
  Download,
  RotateCcw,
  Palette,
  Home,
  Images,
  FolderHeart,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { JellyButton } from '../components/JellyButton';
import { speakText } from '../utils/soundEngine';
import { fireConfetti } from '../utils/confetti';

interface SketchbookScreenProps {
  onGoHome: () => void;
  soundEnabled: boolean;
  childName?: string;
}

export type ToolType = Brush | 'fill' | 'magic' | 'sticker';
type Panel = 'tools' | 'colors' | 'background' | 'stickers' | 'templates' | 'gallery' | null;

const brushes: { id: Brush; name: string; icon: ReactNode; color: string }[] = [
  { id: 'crayon', name: '크레파스', icon: <Pencil className="w-5 h-5" />, color: '#e3a851' },
  { id: 'pen', name: '싸인펜', icon: <Highlighter className="w-5 h-5" />, color: '#dc8192' },
  { id: 'pencil', name: '색연필', icon: <Pencil className="w-5 h-5" />, color: '#91a961' },
  { id: 'water', name: '물감', icon: <Paintbrush className="w-5 h-5" />, color: '#84b6d2' },
  { id: 'rainbow', name: '무지개펜', icon: <Sparkles className="w-5 h-5" />, color: '#ff6fb5' },
  { id: 'neon', name: '네온펜', icon: <Zap className="w-5 h-5" />, color: '#2ee6a8' },
  { id: 'bubble', name: '버블펜', icon: <CircleDot className="w-5 h-5" />, color: '#54c7ec' },
];

const brushWidths: Record<Brush, number[]> = {
  pen: [7, 16, 32],
  crayon: [14, 30, 54],
  pencil: [5, 12, 22],
  water: [30, 58, 94],
  eraser: [22, 46, 80],
  rainbow: [10, 22, 44],
  neon: [8, 18, 36],
  bubble: [26, 48, 80],
};

export const SketchbookScreen: React.FC<SketchbookScreenProps> = ({
  onGoHome,
  soundEnabled,
  childName = '유하',
}) => {
  const [history, setHistory] = useState<History | null>(null);
  const historyRef = useRef<History | null>(null);

  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState(colors[0][1]);
  const [size, setSize] = useState(1);
  const [glitter, setGlitter] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [category, setCategory] = useState('동물');
  const [stickerKind, setStickerKind] = useState('heart');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [gallery, setGallery] = useState<SavedArt[]>([]);
  const [notice, setNotice] = useState('');

  // Living Character Animation Mode state
  const [isLivingCharacterActive, setIsLivingCharacterActive] = useState(false);
  const [characterSpriteUrl, setCharacterSpriteUrl] = useState<string | null>(null);

  const art = history?.present;

  const setH = (h: History) => {
    historyRef.current = h;
    setHistory(h);
  };

  const commit = (a: Artwork) => {
    const h = historyRef.current;
    if (h) setH(change(h, a));
  };

  const sound = (kind: 'tap' | 'sticker' | 'fanfare' | 'magic' | 'pop' | 'clear' = 'tap') => {
    playSound(kind, !soundEnabled);
  };

  const chooseTool = (t: ToolType) => {
    setTool(t);
    setPanel(null);
    setSelectedSticker(null);
    if (t === 'magic') playSound('magic', !soundEnabled);
    else sound();
  };

  // Launch the Living Animated Character experience
  const handleLaunchLivingCharacter = () => {
    if (!art) return;
    const spriteUrl = renderCharacterSprite(art);
    setCharacterSpriteUrl(spriteUrl);
    setIsLivingCharacterActive(true);
  };

  const handleDownloadPng = () => {
    if (!art) return;
    try {
      const canvas = renderArtwork(art);
      const link = document.createElement('a');
      link.download = `${childName}스케치북_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      sound('sticker');
      setNotice('그림을 사진으로 저장했어요! 📸');
      setTimeout(() => setNotice(''), 2500);
    } catch {
      setNotice('그림을 저장하지 못했어요.');
    }
  };

  // Load Initial Draft
  useEffect(() => {
    let active = true;
    loadDraft()
      .then((a) => {
        if (active) {
          setTool(a?.template ? 'fill' : 'pen');
          setH({ past: [], present: a || freshArtwork(), future: [] });
        }
      })
      .catch(() => {
        if (active) {
          setH({ past: [], present: freshArtwork(), future: [] });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Auto save draft to storage
  useEffect(() => {
    if (!art) return;
    const id = setTimeout(() => {
      void saveDraft(art).catch(() => {});
    }, 1500);
    return () => clearTimeout(id);
  }, [art]);

  // Load Gallery list when gallery panel opens
  useEffect(() => {
    if (panel === 'gallery') {
      listGallery().then(setGallery).catch(() => {});
    }
  }, [panel]);

  // Current template metadata
  const currentTemplate = templates.find((t) => t.id === art?.template);
  const characterTitle = currentTemplate ? currentTemplate.name : `${childName}의 그림`;

  // Render Living Character Stage if active
  if (isLivingCharacterActive && characterSpriteUrl) {
    return (
      <LivingCharacterStage
        spriteUrl={characterSpriteUrl}
        characterTitle={characterTitle}
        childName={childName}
        soundEnabled={soundEnabled}
        onBack={() => setIsLivingCharacterActive(false)}
        onDownload={handleDownloadPng}
      />
    );
  }

  return (
    <div className="relative w-full h-[85vh] sm:h-[88vh] bg-[#FFFBF0] rounded-[36px] border-4 border-amber-300 shadow-2xl overflow-hidden select-none flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="z-30 w-full bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-t-[32px] border-b-2 border-amber-200 shadow-xs flex items-center justify-between gap-2">
        {/* Left: Home & Back */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onGoHome}
            className="p-2 sm:px-3 sm:py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full font-black text-xs sm:text-sm flex items-center gap-1 border border-amber-300 active:scale-95 cursor-pointer"
            title="홈으로 가기"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">홈으로</span>
          </button>

          {/* Template Indicator */}
          {currentTemplate && (
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs font-black text-amber-800">
              <span>{currentTemplate.emoji}</span>
              <span>{currentTemplate.name} 색칠하기</span>
            </div>
          )}
        </div>

        {/* Center Title */}
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-black text-[#4A3E3D] flex items-center gap-1">
            <span>🎨 {childName}의 알록달록 스케치북</span>
          </h1>
        </div>

        {/* Right: Living Character & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 🪄 LIVING CHARACTER BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLaunchLivingCharacter}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-black text-xs sm:text-sm rounded-full shadow-md flex items-center gap-1.5 border-2 border-purple-300 active:scale-95 cursor-pointer animate-pulse"
            title="색칠한 캐릭터를 살아 움직이게 만들기!"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>살아 움직이기! 🪄</span>
          </motion.button>

          {/* Download Photo */}
          <button
            onClick={handleDownloadPng}
            className="p-2 sm:px-3 sm:py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-full font-black text-xs sm:text-sm flex items-center gap-1 border border-emerald-300 active:scale-95 cursor-pointer"
            title="사진으로 저장"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">저장</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-white">
        {art && (
          <DrawingCanvas
            artwork={art}
            tool={tool}
            color={color}
            size={brushWidths[tool === 'fill' || tool === 'magic' || tool === 'sticker' ? 'pen' : tool][size]}
            glitter={glitter}
            stickerKind={stickerKind}
            selected={selectedSticker}
            onSelect={setSelectedSticker}
            onChange={commit}
            onStamp={() => sound('sticker')}
            onDrawSound={(t, s) => playDrawingSound(t, !soundEnabled, s)}
            disabled={!!panel}
          />
        )}

        {/* Floating Sticker Edit Toolbar when a sticker is selected */}
        {selectedSticker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full border-2 border-amber-300 shadow-lg flex items-center gap-2"
          >
            <button
              onClick={() => {
                if (art) {
                  commit({
                    ...art,
                    stickers: art.stickers.map((s) =>
                      s.id === selectedSticker ? { ...s, scale: Math.min(2.5, (s.scale ?? 1) * 1.25) } : s
                    ),
                  });
                  sound('sticker');
                }
              }}
              className="p-1.5 hover:bg-amber-100 rounded-full text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" /> 크게
            </button>
            <button
              onClick={() => {
                if (art) {
                  commit({
                    ...art,
                    stickers: art.stickers.map((s) =>
                      s.id === selectedSticker ? { ...s, scale: Math.max(0.4, (s.scale ?? 1) * 0.8) } : s
                    ),
                  });
                  sound('sticker');
                }
              }}
              className="p-1.5 hover:bg-amber-100 rounded-full text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" /> 작게
            </button>
            <button
              onClick={() => {
                if (art) {
                  commit({
                    ...art,
                    stickers: art.stickers.map((s) =>
                      s.id === selectedSticker ? { ...s, rotation: s.rotation + Math.PI / 6 } : s
                    ),
                  });
                  sound('sticker');
                }
              }}
              className="p-1.5 hover:bg-amber-100 rounded-full text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" /> 회전
            </button>
            <button
              onClick={() => {
                if (art) {
                  commit({
                    ...art,
                    stickers: art.stickers.filter((s) => s.id !== selectedSticker),
                  });
                  sound('pop');
                }
                setSelectedSticker(null);
              }}
              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-full text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> 떼기
            </button>
          </motion.div>
        )}
      </div>

      {/* Toast Notice */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#4A3E3D] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Bar */}
      <div className="z-30 w-full bg-white/95 backdrop-blur-xs p-2 sm:p-3 rounded-b-[32px] border-t-2 border-amber-200 shadow-md flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (history && history.past.length > 0) {
                setH(undo(history));
                sound();
              }
            }}
            disabled={!history || history.past.length === 0}
            className="p-2 sm:p-2.5 rounded-full hover:bg-gray-100 text-[#4A3E3D] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 border border-gray-200"
            title="실행 취소"
          >
            <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => {
              if (history && history.future.length > 0) {
                setH(redo(history));
                sound();
              }
            }}
            disabled={!history || history.future.length === 0}
            className="p-2 sm:p-2.5 rounded-full hover:bg-gray-100 text-[#4A3E3D] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 border border-gray-200"
            title="다시 실행"
          >
            <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Center Main Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tool Picker Button */}
          <button
            onClick={() => setPanel('tools')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
              panel === 'tools'
                ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
            }`}
          >
            <Paintbrush className="w-4 h-4 text-amber-700" />
            <span>도구</span>
          </button>

          {/* Color Picker Button */}
          <button
            onClick={() => setPanel('colors')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
              panel === 'colors'
                ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                : 'bg-white hover:bg-amber-50 text-[#4A3E3D] border-amber-300'
            }`}
          >
            <div className="w-4 h-4 rounded-full border border-gray-400" style={{ backgroundColor: color }} />
            <span>색상</span>
          </button>

          {/* Template Coloring Book Button */}
          <button
            onClick={() => setPanel('templates')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
              panel === 'templates'
                ? 'bg-rose-400 text-white border-rose-500 shadow-xs'
                : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
            }`}
          >
            <span>📖</span>
            <span>도안</span>
          </button>

          {/* Sticker Button */}
          <button
            onClick={() => setPanel('stickers')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
              panel === 'stickers'
                ? 'bg-purple-400 text-white border-purple-500 shadow-xs'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
            }`}
          >
            <StickerIcon className="w-4 h-4 text-purple-700" />
            <span>스티커</span>
          </button>

          {/* Paper Background Button */}
          <button
            onClick={() => setPanel('background')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1 border-2 transition-all cursor-pointer ${
              panel === 'background'
                ? 'bg-sky-400 text-white border-sky-500 shadow-xs'
                : 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300'
            }`}
            title="도화지 변경"
          >
            <span>📄</span>
            <span className="hidden sm:inline">도화지</span>
          </button>
        </div>

        {/* Right Reset / Gallery */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanel('gallery')}
            className="p-2 sm:p-2.5 rounded-full hover:bg-indigo-50 text-indigo-700 cursor-pointer active:scale-95 border border-indigo-200"
            title="내 작품 갤러리"
          >
            <FolderHeart className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('도화지를 깨끗하게 비울까요?')) {
                commit(freshArtwork(art?.background));
                sound('clear');
              }
            }}
            className="p-2 sm:p-2.5 rounded-full hover:bg-rose-50 text-rose-600 cursor-pointer active:scale-95 border border-rose-200"
            title="새 도화지"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL PANELS (Tools, Colors, Templates, Stickers, Gallery) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {panel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] border-4 border-amber-300 shadow-2xl p-4 sm:p-6 max-h-[85vh] flex flex-col justify-between overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setPanel(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              {/* PANEL 1: TOOLS PICKER */}
              {panel === 'tools' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#4A3E3D] mb-1">🖌️ 무엇으로 그려볼까요?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {brushes.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => chooseTool(b.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          tool === b.id ? 'bg-amber-100 border-amber-500 scale-105 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span style={{ color: b.color }}>{b.icon}</span>
                        <span className="text-xs font-black text-[#4A3E3D]">{b.name}</span>
                      </button>
                    ))}
                    {art?.template && (
                      <>
                        <button
                          onClick={() => chooseTool('fill')}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            tool === 'fill' ? 'bg-amber-100 border-amber-500 scale-105 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <PaintBucket className="w-5 h-5 text-indigo-500" />
                          <span className="text-xs font-black text-[#4A3E3D]">채우기</span>
                        </button>
                        <button
                          onClick={() => chooseTool('magic')}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            tool === 'magic' ? 'bg-amber-100 border-amber-500 scale-105 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Wand2 className="w-5 h-5 text-rose-500" />
                          <span className="text-xs font-black text-[#4A3E3D]">요술봉</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => chooseTool('eraser')}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        tool === 'eraser' ? 'bg-amber-100 border-amber-500 scale-105 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Eraser className="w-5 h-5 text-rose-400" />
                      <span className="text-xs font-black text-[#4A3E3D]">지우개</span>
                    </button>
                  </div>

                  {/* Brush Sizes */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-black text-gray-500 mb-2 block">붓 굵기</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['작게', '중간', '크게'].map((label, idx) => (
                        <button
                          key={label}
                          onClick={() => {
                            setSize(idx);
                            sound();
                          }}
                          className={`py-2 rounded-xl text-xs font-black border-2 cursor-pointer ${
                            size === idx ? 'bg-amber-400 text-amber-950 border-amber-500' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Glitter Toggle */}
                  <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" /> 반짝이 효과
                    </span>
                    <button
                      onClick={() => {
                        setGlitter(!glitter);
                        sound();
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-black border cursor-pointer ${
                        glitter ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-gray-500 border-gray-300'
                      }`}
                    >
                      {glitter ? '켜짐' : '꺼짐'}
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 2: COLOR PALETTE */}
              {panel === 'colors' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#4A3E3D] mb-1">🎨 어떤 색으로 그릴까요?</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 py-2">
                    {colors.map(([name, hex]) => (
                      <button
                        key={hex}
                        onClick={() => {
                          setColor(hex);
                          sound();
                          setPanel(null);
                        }}
                        className={`p-2 rounded-2xl flex flex-col items-center gap-1 cursor-pointer transition-transform ${
                          color === hex ? 'scale-110 ring-4 ring-amber-400' : 'hover:scale-105'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[11px] font-black text-[#4A3E3D]">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PANEL 3: TEMPLATES (COLORING BOOK) */}
              {panel === 'templates' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#4A3E3D] mb-1">📖 색칠할 도안을 골라보세요!</h3>
                  {/* Category Filter */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {['동물', '과일', '탈것', '친구들'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-black cursor-pointer border ${
                          category === cat
                            ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Template Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
                    {templates
                      .filter((t) => t.category === category)
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (art) {
                              commit({
                                ...freshArtwork(art.background),
                                template: t.id,
                              });
                              setTool('fill');
                              sound('magic');
                              setPanel(null);
                              speakText(`${t.name} 도안이에요! 예쁘게 색칠해보자!`, soundEnabled);
                            }
                          }}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            art?.template === t.id ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-300' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-4xl filter drop-shadow-xs">{t.emoji}</span>
                          <span className="text-xs font-black text-[#4A3E3D] truncate w-full text-center">{t.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* PANEL 4: STICKERS */}
              {panel === 'stickers' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#4A3E3D] mb-1">⭐ 스티커를 골라 도화지에 붙여요!</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
                    {stickerKinds.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setStickerKind(s.id);
                          setTool('sticker');
                          sound('sticker');
                          setPanel(null);
                        }}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          stickerKind === s.id && tool === 'sticker'
                            ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-4xl">{s.emoji}</span>
                        <span className="text-[10px] font-black text-[#4A3E3D]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PANEL 5: BACKGROUNDS */}
              {panel === 'background' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#4A3E3D] mb-1">📄 어떤 도화지에 그릴까요?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {backgrounds.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          if (art) {
                            commit({ ...art, background: b.id });
                            sound();
                            setPanel(null);
                          }
                        }}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer ${
                          art?.background === b.id ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-300' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className="w-12 h-8 rounded-lg border border-gray-300 shadow-2xs"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="text-xs font-black text-[#4A3E3D]">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PANEL 6: GALLERY */}
              {panel === 'gallery' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#4A3E3D] mb-1">🖼️ {childName}의 작은 전시회</h3>
                  {gallery.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-bold text-sm">
                      아직 저장된 그림이 없어요. 멋진 그림을 그려보아요!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
                      {gallery.map((g) => (
                        <div
                          key={g.id}
                          className="relative p-2 rounded-2xl border-2 border-gray-200 bg-gray-50 flex flex-col items-center gap-1 group"
                        >
                          <img
                            src={g.thumbnail}
                            alt="저장된 그림"
                            onClick={() => {
                              setH({ past: [], present: g.artwork, future: [] });
                              sound('magic');
                              setPanel(null);
                            }}
                            className="w-full h-24 object-contain rounded-xl cursor-pointer hover:opacity-90 transition-opacity bg-white border border-gray-100"
                          />
                          <button
                            onClick={() => {
                              if (window.confirm('이 작품을 삭제할까요?')) {
                                deleteGallery(g.id).then(() => {
                                  setGallery((prev) => prev.filter((item) => item.id !== g.id));
                                  sound('pop');
                                });
                              }
                            }}
                            className="absolute top-3 right-3 p-1 bg-white/80 hover:bg-rose-100 text-rose-500 rounded-full shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import DrawingCanvas from '../sketch/DrawingCanvas';
import { LivingCharacterStage } from '../sketch/LivingCharacterStage';
import { SketchbookDialog } from '../sketch/SketchbookDialog';
import { SketchbookGallery } from '../sketch/SketchbookGallery';
import {
  backgrounds, colors, stickerKinds, freshArtwork, change, undo, redo,
  type Artwork, type Brush, type History,
} from '../sketch/model';
import { templates, templateUrl } from '../sketch/art';
import { renderArtwork, renderCharacterSprite } from '../sketch/render';
import { playDrawingSound, playSound } from '../sketch/sound';
import { loadDraft, saveDraft, saveGallery } from '../sketch/storage';
import { createDraftAutosave } from '../utils/draftAutosave';
import {
  Undo2, Redo2, Sparkles, Eraser, Paintbrush, Pencil, Highlighter, PaintBucket,
  Trash2, Sticker as StickerIcon, Zap, CircleDot, Wand2, Palette, Images,
  ImagePlus, ZoomIn, ZoomOut, RotateCw, BookOpen, FilePlus2, Rabbit, PawPrint, Apple, Car,
} from 'lucide-react';
import { speakText } from '../utils/soundEngine';
import type { CharacterId } from '../types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { fireConfetti } from '../utils/confetti';
import './SketchbookScreen.css';

interface SketchbookScreenProps {
  buddy: CharacterId;
  onGoHome: () => void;
  soundEnabled: boolean;
  childName?: string;
}
export type ToolType = Brush | 'fill' | 'magic' | 'sticker';
type Panel = 'tools' | 'colors' | 'stickers' | 'templates' | 'gallery' | null;
const brushes: { id: Brush; name: string; icon: ReactNode; color: string }[] = [
  { id: 'crayon', name: '크레파스', icon: <Pencil />, color: '#bd8229' },
  { id: 'pen', name: '싸인펜', icon: <Highlighter />, color: '#c75f7d' },
  { id: 'pencil', name: '색연필', icon: <Pencil />, color: '#72913e' },
  { id: 'water', name: '물감', icon: <Paintbrush />, color: '#518db6' },
  { id: 'rainbow', name: '무지개펜', icon: <Sparkles />, color: '#d34691' },
  { id: 'neon', name: '네온펜', icon: <Zap />, color: '#138e71' },
  { id: 'bubble', name: '버블펜', icon: <CircleDot />, color: '#268da9' },
];
const brushWidths: Record<Brush, number[]> = {
  pen: [7, 16, 32], crayon: [14, 30, 54], pencil: [5, 12, 22], water: [30, 58, 94],
  eraser: [22, 46, 80], rainbow: [10, 22, 44], neon: [8, 18, 36], bubble: [26, 48, 80],
};
const categories = [
  { name: '친구들', Icon: Rabbit }, { name: '동물', Icon: PawPrint },
  { name: '과일', Icon: Apple }, { name: '탈것', Icon: Car },
];

export const SketchbookScreen: React.FC<SketchbookScreenProps> = ({ buddy, soundEnabled, childName = '유하' }) => {
  const [history, setHistory] = useState<History | null>(null);
  const historyRef = useRef<History | null>(null);
  const active = useRef(true);
  const savingRef = useRef(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState(colors[0][1]);
  const [size, setSize] = useState(1);
  const [glitter, setGlitter] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [category, setCategory] = useState('친구들');
  const [stickerKind, setStickerKind] = useState('heart');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [galleryRevision, setGalleryRevision] = useState(0);
  const [characterSpriteUrl, setCharacterSpriteUrl] = useState<string | null>(null);
  const [autosave] = useState(() => createDraftAutosave<Artwork>(saveDraft, () => {
    console.warn('Sketchbook draft could not be saved; retaining the latest edit for retry.');
  }));
  const art = history?.present;
  const currentTemplate = templates.find(item => item.id === art?.template);
  const characterTitle = currentTemplate ? currentTemplate.name : `${childName}의 그림`;

  const setH = (next: History) => {
    historyRef.current = next;
    autosave.schedule(next.present);
    setHistory(next);
  };
  const commit = (next: Artwork) => {
    if (historyRef.current) setH(change(historyRef.current, next));
  };
  const sound = (kind: 'tap' | 'sticker' | 'fanfare' | 'magic' | 'pop' | 'clear' = 'tap') => playSound(kind, !soundEnabled);
  const stepHistory = (direction: 'undo' | 'redo') => {
    const current = historyRef.current;
    if (drawing || !current || !(direction === 'undo' ? current.past : current.future).length) return;
    setH(direction === 'undo' ? undo(current) : redo(current));
    setSelectedSticker(null);
    setNotice('');
    sound();
  };
  const closePanel = () => { setPanel(null); setNotice(''); };
  const openPanel = (next: Panel) => {
    setSelectedSticker(null);
    setNotice('');
    if (next === 'gallery') setSavedId(null);
    setPanel(next);
    sound();
  };
  const chooseTool = (next: ToolType) => {
    setTool(next);
    setSelectedSticker(null);
    closePanel();
    sound(next === 'magic' ? 'magic' : 'tap');
  };

  const downloadArtwork = (picture: Artwork) => {
    try {
      const link = document.createElement('a');
      link.download = `${childName}스케치북_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = renderArtwork(picture).toDataURL('image/png');
      link.click();
      sound('sticker');
      setNotice('사진 파일 다운로드를 시작했어요.');
    } catch { setNotice('사진을 만들지 못했어요. 다시 눌러주세요.'); }
  };

  // One tap puts the current artwork in the exhibition. Repeated saves update
  // the same artwork ID, rather than adding duplicate frames.
  const exhibitArtwork = async () => {
    const picture = historyRef.current?.present;
    if (!picture || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setNotice('');
    try {
      const rendered = renderArtwork(picture);
      const preview = document.createElement('canvas');
      const ratio = Math.min(1, 600 / Math.max(rendered.width, rendered.height));
      preview.width = Math.max(1, Math.round(rendered.width * ratio));
      preview.height = Math.max(1, Math.round(rendered.height * ratio));
      const ctx = preview.getContext('2d');
      if (!ctx) throw new Error('Preview canvas unavailable');
      ctx.drawImage(rendered, 0, 0, preview.width, preview.height);
      await saveGallery(picture, preview.toDataURL('image/png'));
      if (!active.current) return;
      setSavedId(picture.id);
      setGalleryRevision(value => value + 1);
      setSelectedSticker(null);
      setPanel('gallery');
      sound('fanfare');
      fireConfetti();
      speakText('우와! 멋진 그림을 전시했어!', soundEnabled, { characterId: buddy });
    } catch {
      if (active.current) setNotice('그림을 저장하지 못했어요. 그림은 그대로 있으니 다시 눌러주세요.');
    } finally {
      savingRef.current = false;
      if (active.current) setSaving(false);
    }
  };

  useEffect(() => {
    active.current = true;
    let current = true;
    loadDraft().then(draft => {
      if (current) {
        setTool(draft?.template ? 'fill' : 'pen');
        setH({ past: [], present: draft || freshArtwork(), future: [] });
      }
    }).catch(() => {
      if (current) setH({ past: [], present: freshArtwork(), future: [] });
    });
    return () => { current = false; active.current = false; };
  }, []);

  useEffect(() => {
    const hide = () => { if (document.hidden) autosave.flush(); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', autosave.flush);
    return () => {
      autosave.flush();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', autosave.flush);
    };
  }, [autosave]);

  const changePaper = (background: string, fresh = false) => {
    if (!art) return;
    commit({ ...(fresh ? freshArtwork() : art), background });
    if (fresh) setTool('pen');
    setSelectedSticker(null);
    sound();
    closePanel();
  };
  const editSticker = (action: 'grow' | 'shrink' | 'rotate' | 'remove') => {
    if (!art) return;
    commit({ ...art, stickers: action === 'remove' ? art.stickers.filter(item => item.id !== selectedSticker) : art.stickers.map(item => {
      if (item.id !== selectedSticker) return item;
      if (action === 'rotate') return { ...item, rotation: item.rotation + Math.PI / 6 };
      return { ...item, scale: action === 'grow' ? Math.min(2.5, (item.scale ?? 1) * 1.25) : Math.max(.4, (item.scale ?? 1) * .8) };
    }) });
    sound('sticker');
    if (action === 'remove') setSelectedSticker(null);
  };
  const panelTitle = panel === 'tools' ? '무엇으로 그릴까?' : panel === 'colors' ? '어떤 색이 좋을까?' : panel === 'templates' ? '도안과 도화지' : panel === 'stickers' ? '스티커를 골라봐!' : `${childName}의 작은 전시회`;

  if (characterSpriteUrl) return <LivingCharacterStage buddy={buddy} spriteUrl={characterSpriteUrl}
    characterTitle={characterTitle} childName={childName} soundEnabled={soundEnabled}
    onBack={() => setCharacterSpriteUrl(null)} onSave={() => {
      // Use the same simple exhibition save flow from the living-character view.
      setCharacterSpriteUrl(null);
      void exhibitArtwork();
    }} />;

  return <section className="sketchbook" aria-label={`${childName}의 스케치북`}>
    <header className="sketch-header">
      <div className="sketch-buddy" aria-label={`${CHARACTERS[buddy].name}와 함께 색칠하기`}>
        <CharacterAvatar id={buddy} size="sm" mood="waving" />
        <div><h1>{childName}의 스케치북</h1><span>쓱쓱, 나만의 그림!</span></div>
      </div>
      <div className="sketch-header-actions">
        <button className="sketch-top-button sketch-undo" disabled={drawing || !history?.past.length}
          aria-label="한 단계 되돌리기" onClick={() => stepHistory('undo')}>
          <Undo2 aria-hidden="true" /><span>되돌리기</span>
        </button>
        <button className="sketch-top-button sketch-living" disabled={!art} aria-label="색칠한 캐릭터 살아나기"
          onClick={() => { if (art) { setCharacterSpriteUrl(renderCharacterSprite(art)); sound('magic'); } }}>
          <Wand2 aria-hidden="true" /><span>살아나!</span><Sparkles className="sketch-button-sparkle" aria-hidden="true" />
        </button>
        <button className="sketch-top-button sketch-save" disabled={!art || saving} aria-busy={saving}
          aria-label="전시회에 저장하기" onClick={() => void exhibitArtwork()}>
          <ImagePlus aria-hidden="true" /><span>{saving ? '저장 중…' : '저장하기'}</span>
        </button>
        <button className="sketch-top-button sketch-gallery-button" onClick={() => openPanel('gallery')} aria-label={`${childName}의 작은 전시회 열기`}>
          <Images aria-hidden="true" /><span>전시회</span>
        </button>
      </div>
    </header>

    <div className="sketch-canvas-area">
      {art && <DrawingCanvas artwork={art} tool={tool} color={color}
        size={brushWidths[tool === 'fill' || tool === 'magic' || tool === 'sticker' ? 'pen' : tool][size]}
        glitter={glitter} stickerKind={stickerKind} selected={selectedSticker} onSelect={setSelectedSticker}
        onChange={commit} onGestureChange={setDrawing} onStamp={() => sound('sticker')} onDrawSound={(brush, strength) => playDrawingSound(brush, !soundEnabled, strength)} disabled={!!panel} />}
      {selectedSticker && <div className="sketch-sticker-edit" aria-label="붙인 스티커 바꾸기">
        <button onClick={() => editSticker('grow')} aria-label="스티커 크게"><ZoomIn /><span>크게</span></button>
        <button onClick={() => editSticker('shrink')} aria-label="스티커 작게"><ZoomOut /><span>작게</span></button>
        <button onClick={() => editSticker('rotate')} aria-label="스티커 돌리기"><RotateCw /><span>돌리기</span></button>
        <button onClick={() => editSticker('remove')} aria-label="스티커 떼기"><Trash2 /><span>떼기</span></button>
      </div>}
      {!panel && notice && <p role="status" className="sketch-notice">{notice}</p>}
    </div>

    <nav className="sketch-bottom-tools" aria-label="색칠 도구 메뉴">
      {([
        { id: 'tools', label: '도구', Icon: Paintbrush }, { id: 'colors', label: '색상', Icon: Palette },
        { id: 'templates', label: '도안', Icon: BookOpen }, { id: 'stickers', label: '스티커', Icon: StickerIcon },
      ] as const).map(({ id, label, Icon }) => <button key={id} className={`sketch-menu-button sketch-menu-${id}`}
        aria-haspopup="dialog" aria-expanded={panel === id} onClick={() => openPanel(id)}>
        <span className="sketch-menu-icon"><Icon aria-hidden="true" />{id === 'colors' && <i style={{ backgroundColor: color }} />}</span><span>{label}</span>
      </button>)}
    </nav>

    {panel && <SketchbookDialog title={panelTitle} onClose={closePanel}>
      {notice && <p role="status" className="sketch-notice">{notice}</p>}
      {panel === 'tools' && <>
        <div className="sketch-choice-grid sketch-brushes">
          {brushes.map(brush => <button key={brush.id} className="sketch-choice" aria-pressed={tool === brush.id} onClick={() => chooseTool(brush.id)}>
            <span style={{ color: brush.color }}>{brush.icon}</span><span>{brush.name}</span>
          </button>)}
          {art?.template && <>
            <button className="sketch-choice" aria-pressed={tool === 'fill'} onClick={() => chooseTool('fill')}><PaintBucket /><span>채우기</span></button>
            <button className="sketch-choice" aria-pressed={tool === 'magic'} onClick={() => chooseTool('magic')}><Wand2 /><span>요술봉</span></button>
          </>}
          <button className="sketch-choice" aria-pressed={tool === 'eraser'} onClick={() => chooseTool('eraser')}><Eraser /><span>지우개</span></button>
        </div>
        <h3 className="sketch-section-title">붓 굵기</h3>
        <div className="sketch-size-options">
          {['가늘게', '보통', '굵게'].map((label, index) => <button key={label} className="sketch-choice" aria-pressed={size === index} onClick={() => { setSize(index); sound(); }}>
            <i className="sketch-brush-dot" style={{ width: 8 + index * 14, height: 8 + index * 14 }} /><span>{label}</span>
          </button>)}
        </div>
        <button className="sketch-action sketch-glitter" aria-pressed={glitter} onClick={() => { setGlitter(!glitter); sound(); }}><Sparkles /> 반짝이 {glitter ? '켜짐' : '꺼짐'}</button>
        <div className="sketch-gallery-actions">
          <button className="sketch-action" disabled={drawing || !history?.past.length} onClick={() => stepHistory('undo')}><Undo2 /> 되돌리기</button>
          <button className="sketch-action" disabled={drawing || !history?.future.length} onClick={() => stepHistory('redo')}><Redo2 /> 다시 하기</button>
        </div>
      </>}
      {panel === 'colors' && <div className="sketch-choice-grid sketch-colors">
        {colors.map(([name, hex]) => <button key={hex} className="sketch-choice" aria-label={name} aria-pressed={color === hex}
          onClick={() => { setColor(hex); sound(); closePanel(); }}>
          <span className="sketch-color-swatch" style={{ backgroundColor: hex }} /><span>{name}</span>
        </button>)}
      </div>}
      {panel === 'templates' && <>
        <div className="sketch-paper-heading"><h3>도화지</h3><button className="sketch-action" onClick={() => changePaper(art?.background || 'white', true)}><FilePlus2 /> 새 도화지</button></div>
        <div className="sketch-paper-options" data-scroll-region>
          {backgrounds.map(background => <button key={background.id} className="sketch-choice" aria-label={background.label} aria-pressed={art?.background === background.id}
            onClick={() => changePaper(background.id)}>
            <span className={`sketch-paper-swatch paper-${background.id}`} style={{ backgroundColor: background.color }} /><span>{background.label}</span>
          </button>)}
        </div>
        <h3 className="sketch-section-title">색칠 도안</h3>
        <div className="sketch-categories" data-scroll-region aria-label="도안 종류">
          {categories.map(({ name, Icon }) => <button key={name} className="sketch-choice" aria-pressed={category === name} onClick={() => { setCategory(name); sound(); }}><Icon /><span>{name}</span></button>)}
        </div>
        <div className="sketch-choice-grid sketch-templates">
          {templates.filter(item => item.category === category).map(template => <button key={template.id} className="sketch-choice" aria-pressed={art?.template === template.id}
            onClick={() => {
              if (!art) return;
              commit({ ...freshArtwork(), background: art.background, template: template.id });
              setTool('fill'); sound('magic'); closePanel();
              speakText(`${template.name} 도안이에요! 예쁘게 색칠해보자!`, soundEnabled, { characterId: buddy });
            }}>
            <img src={templateUrl(template)} alt="" /><span>{template.name}</span>
          </button>)}
        </div>
      </>}
      {panel === 'stickers' && <div className="sketch-choice-grid sketch-stickers">
        {stickerKinds.map(sticker => <button key={sticker.id} className="sketch-choice" aria-pressed={stickerKind === sticker.id && tool === 'sticker'} onClick={() => {
          setStickerKind(sticker.id); setTool('sticker'); sound('sticker'); closePanel();
        }}><span className="sketch-sticker-picture" aria-hidden="true">{sticker.emoji}</span><span>{sticker.label}</span></button>)}
      </div>}
      {panel === 'gallery' && <SketchbookGallery savedId={savedId} revision={galleryRevision} saving={saving}
        onSave={() => void exhibitArtwork()} onDownload={downloadArtwork} onClose={closePanel} onContinue={picture => {
          commit(picture); setTool(picture.template ? 'fill' : 'pen'); setSelectedSticker(null); sound('magic'); closePanel();
        }} />}
    </SketchbookDialog>}
  </section>;
};

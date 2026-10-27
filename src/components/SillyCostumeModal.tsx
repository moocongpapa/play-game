import React, { useState } from 'react';
import { Camera, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import type { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterAvatar } from './CharacterAvatar';
import { playCareSound, playSparkleChime, playToyTone, speakText } from '../utils/soundEngine';
import { emitJuice } from '../utils/juice';
import './SillyCostumeModal.css';

interface SillyCostumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddy: CharacterId;
  soundEnabled: boolean;
  childName?: string;
}

export type CostumePropId = 'mustache' | 'pan' | 'banana' | 'frog' | 'crown' | 'ribbon' | 'snorkel' | 'sock';

interface CostumeItem {
  id: CostumePropId;
  name: string;
  emoji: string;
  tagline: string;
  category: 'head' | 'face';
}

const COSTUME_ITEMS: CostumeItem[] = [
  { id: 'mustache', name: '콧수염 안경', emoji: '🥸', tagline: '에헴! 내가 누구게?', category: 'face' },
  { id: 'pan', name: '프라이팬 헬멧', emoji: '🍳', tagline: '계란 프라이 얹은 모자!', category: 'head' },
  { id: 'banana', name: '바나나 껍질', emoji: '🍌', tagline: '미끌미끌 바나나 모자!', category: 'head' },
  { id: 'frog', name: '개구리 왕눈이', emoji: '🐸', tagline: '개굴개굴 커다란 눈!', category: 'face' },
  { id: 'crown', name: '반짝 왕관', emoji: '👑', tagline: '삐뚤빼뚤 멋쟁이 왕관!', category: 'head' },
  { id: 'ribbon', name: '대왕 왕리본', emoji: '🎀', tagline: '왕 커다란 분홍 리본!', category: 'head' },
  { id: 'snorkel', name: '스노클 물안경', emoji: '🤿', tagline: '보글보글 바다 탐험가!', category: 'face' },
  { id: 'sock', name: '줄무늬 양말', emoji: '🧦', tagline: '머리에 쏙 쓴 양말 모자!', category: 'head' },
];

export const SillyCostumeModal: React.FC<SillyCostumeModalProps> = ({
  isOpen,
  onClose,
  buddy,
  soundEnabled,
  childName = '유하',
}) => {
  const [equipped, setEquipped] = useState<Set<CostumePropId>>(new Set(['mustache']));
  const [photoFlash, setPhotoFlash] = useState(false);
  const [showPolaroid, setShowPolaroid] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);

  const character = CHARACTERS[buddy] || CHARACTERS.ggomi;

  if (!isOpen) return null;

  const toggleItem = (item: CostumeItem) => {
    const next = new Set(equipped);
    if (next.has(item.id)) {
      next.delete(item.id);
      playCareSound('bubble', soundEnabled);
    } else {
      next.add(item.id);
      setBounceKey((k) => k + 1);
      // Play comical SFX per item!
      if (item.id === 'pan') {
        playCareSound('clang', soundEnabled);
      } else if (item.id === 'crown') {
        playSparkleChime(soundEnabled);
      } else if (item.id === 'mustache') {
        playToyTone(280, 0.22, 0.08, 140);
      } else if (item.id === 'banana') {
        playCareSound('sour', soundEnabled);
      } else {
        playCareSound('giggle', soundEnabled);
      }
      speakText(`${item.name}! ${item.tagline}`, soundEnabled, { characterId: buddy });
    }
    setEquipped(next);
  };

  const handleTakeSnapshot = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    emitJuice({ kind: 'snap', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    playCareSound('shutter', soundEnabled);

    setPhotoFlash(true);
    setTimeout(() => {
      setPhotoFlash(false);
      setShowPolaroid(true);
      emitJuice({ kind: 'success', x: window.innerWidth / 2, y: window.innerHeight / 2 });
      speakText(`찰칵! 멋쟁이 ${character.name} 사진 완성! 너무 귀여워!`, soundEnabled, {
        characterId: buddy,
      });
    }, 350);
  };

  return (
    <div className="silly-costume-backdrop" role="dialog" aria-modal="true" aria-label="코믹 코스튬 스튜디오">
      <div className="silly-costume-card">
        {photoFlash && <div className="photo-flash-overlay" aria-hidden="true" />}

        <button
          type="button"
          className="costume-close-btn"
          onClick={() => {
            setShowPolaroid(false);
            onClose();
          }}
          aria-label="닫기"
        >
          <X size={24} />
        </button>

        <div className="costume-header">
          <span className="costume-badge">🥸 우당탕탕 코믹 분장실</span>
          <h2>{character.name}를 웃기게 꾸며줘!</h2>
          <p className="costume-guide">웃긴 모자와 안경을 눌러서 씌워봐!</p>
        </div>

        {/* Character Preview Stage with Equipped Props */}
        <div className="costume-stage">
          <div key={bounceKey} className="costume-avatar-stage">
            <CharacterAvatar id={buddy} size="2xl" mood="excited" />

            {/* Render silly props overlaid on the character */}
            <div className="costume-props-layer" aria-hidden="true">
              {equipped.has('mustache') && <span className="prop-item prop-mustache">🥸</span>}
              {equipped.has('pan') && <span className="prop-item prop-pan">🍳</span>}
              {equipped.has('banana') && <span className="prop-item prop-banana">🍌</span>}
              {equipped.has('frog') && <span className="prop-item prop-frog">🐸</span>}
              {equipped.has('crown') && <span className="prop-item prop-crown">👑</span>}
              {equipped.has('ribbon') && <span className="prop-item prop-ribbon">🎀</span>}
              {equipped.has('snorkel') && <span className="prop-item prop-snorkel">🤿</span>}
              {equipped.has('sock') && <span className="prop-item prop-sock">🧦</span>}
            </div>
          </div>
        </div>

        {/* Costume Items Shelf */}
        <div className="costume-items-grid" aria-label="장식 소품 목록">
          {COSTUME_ITEMS.map((item) => {
            const isEquipped = equipped.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`costume-item-btn ${isEquipped ? 'is-equipped' : ''}`}
                onClick={() => toggleItem(item)}
                aria-pressed={isEquipped}
                aria-label={`${item.name} ${isEquipped ? '벗기기' : '착용하기'}`}
              >
                <span className="item-emoji">{item.emoji}</span>
                <span className="item-name">{item.name}</span>
                {isEquipped && (
                  <span className="item-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="costume-footer-actions">
          <button
            type="button"
            className="costume-reset-btn"
            onClick={() => {
              setEquipped(new Set());
              playCareSound('bubble', soundEnabled);
            }}
          >
            <RotateCcw size={18} />
            <span>모두 벗기기</span>
          </button>

          <button
            type="button"
            className="costume-snap-btn"
            onClick={handleTakeSnapshot}
            aria-label="사진 찍기"
          >
            <Camera size={22} />
            <span>찰칵! 사진 찍기 📸</span>
          </button>
        </div>

        {/* Polaroid Picture Popup */}
        {showPolaroid && (
          <div className="polaroid-popup" role="dialog" aria-label="완성된 사진">
            <div className="polaroid-frame">
              <button
                type="button"
                className="polaroid-close-btn"
                onClick={() => setShowPolaroid(false)}
                aria-label="사진 닫기"
              >
                <X size={20} />
              </button>
              <div className="polaroid-photo">
                <CharacterAvatar id={buddy} size="xl" mood="dancing" />
                <div className="costume-props-layer polaroid-props" aria-hidden="true">
                  {equipped.has('mustache') && <span className="prop-item prop-mustache">🥸</span>}
                  {equipped.has('pan') && <span className="prop-item prop-pan">🍳</span>}
                  {equipped.has('banana') && <span className="prop-item prop-banana">🍌</span>}
                  {equipped.has('frog') && <span className="prop-item prop-frog">🐸</span>}
                  {equipped.has('crown') && <span className="prop-item prop-crown">👑</span>}
                  {equipped.has('ribbon') && <span className="prop-item prop-ribbon">🎀</span>}
                  {equipped.has('snorkel') && <span className="prop-item prop-snorkel">🤿</span>}
                  {equipped.has('sock') && <span className="prop-item prop-sock">🧦</span>}
                </div>
              </div>
              <div className="polaroid-caption">
                <strong>{character.name}와 코믹 변신!</strong>
                <span>{childName} 작가님의 멋진 작품 ✨</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

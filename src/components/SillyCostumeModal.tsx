import React, { useState } from 'react';
import { Camera, Check, RotateCcw, X } from 'lucide-react';
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
  { id: 'mustache', name: '콧수염 안경', emoji: '🥸', tagline: '에헴! 멋쟁이 콧수염 안경!', category: 'face' },
  { id: 'pan', name: '프라이팬 헬멧', emoji: '🍳', tagline: '계란 프라이 얹은 모자!', category: 'head' },
  { id: 'banana', name: '바나나 껍질', emoji: '🍌', tagline: '미끌미끌 바나나 모자!', category: 'head' },
  { id: 'frog', name: '개구리 왕눈이', emoji: '🐸', tagline: '개굴개굴 왕눈이 안경!', category: 'face' },
  { id: 'crown', name: '반짝 왕관', emoji: '👑', tagline: '반짝반짝 멋쟁이 왕관!', category: 'head' },
  { id: 'ribbon', name: '대왕 왕리본', emoji: '🎀', tagline: '왕 커다란 분홍 리본!', category: 'head' },
  { id: 'snorkel', name: '스노클 물안경', emoji: '🤿', tagline: '보글보글 바다 물안경!', category: 'face' },
  { id: 'sock', name: '줄무늬 양말', emoji: '🧦', tagline: '머리에 쏙 쓴 양말 모자!', category: 'head' },
];

/**
 * Custom vector costume overlays aligned in the exact 120x120 coordinate space
 * of CharacterArtwork (head top: y=4..28, eyes: y=41..49, nose/mouth: y=51..64).
 */
function CostumeOverlaySvg({ equipped }: { equipped: Set<CostumePropId> }) {
  return (
    <svg viewBox="0 0 120 120" className="costume-props-svg" aria-hidden="true">
      {/* ================= HEAD PROPS (Hats & Toppers) ================= */}
      {equipped.has('pan') && (
        <g className="prop-svg-group prop-svg-head">
          {/* Pan Handle */}
          <path
            d="M24 20 L6 11 C3 9 5 5 9 6 L28 15 Z"
            fill="#374151"
            stroke="#1f2937"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="8.5" r="1.5" fill="#9ca3af" />
          {/* Upside-down Frying Pan Dome */}
          <path
            d="M26 24 C28 8 92 8 94 24 Z"
            fill="#4b5563"
            stroke="#1f2937"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <ellipse cx="60" cy="24" rx="37" ry="5" fill="#374151" stroke="#1f2937" strokeWidth="2" />
          {/* Sunny-side-up Fried Egg on Top */}
          <path
            d="M41 13 C45 6 57 5 64 7 C72 5 81 9 79 15 C77 20 67 21 59 20 C49 21 38 18 41 13 Z"
            fill="#ffffff"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          <ellipse cx="60" cy="12.5" rx="8.5" ry="5.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
          <ellipse cx="57.5" cy="11" rx="2.8" ry="1.6" fill="#fef3c7" />
        </g>
      )}

      {equipped.has('banana') && (
        <g className="prop-svg-group prop-svg-head">
          {/* Left draping banana peel */}
          <path
            d="M58 9 C42 9 27 17 22 31 C30 28 42 22 54 18 Z"
            fill="#fde047"
            stroke="#ca8a04"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Right draping banana peel */}
          <path
            d="M62 9 C78 9 93 17 98 31 C90 28 78 22 66 18 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Center front banana peel */}
          <path
            d="M60 8 C51 12 48 21 50 30 C56 25 64 25 70 30 C72 21 69 12 60 8 Z"
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Brown banana stem tip at top */}
          <rect x="57" y="2" width="6" height="7" rx="2" fill="#78350f" />
        </g>
      )}

      {equipped.has('crown') && (
        <g className="prop-svg-group prop-svg-head">
          <path
            d="M34 25 L30 7 L49 17 L60 4 L71 17 L90 7 L86 25 Z"
            fill="#fbbf24"
            stroke="#b45309"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect x="33" y="22" width="54" height="5.5" rx="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          <circle cx="30" cy="6" r="3" fill="#fef08a" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="60" cy="3.5" r="3.5" fill="#fef08a" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="90" cy="6" r="3" fill="#fef08a" stroke="#b45309" strokeWidth="1.5" />
          {/* Jewels */}
          <circle cx="46" cy="20" r="2.6" fill="#ec4899" />
          <circle cx="60" cy="18.5" r="3.2" fill="#ef4444" />
          <circle cx="74" cy="20" r="2.6" fill="#3b82f6" />
        </g>
      )}

      {equipped.has('ribbon') && (
        <g className="prop-svg-group prop-svg-head">
          {/* Left Giant Bow Loop */}
          <path
            d="M58 17 C42 2 22 5 24 19 C26 31 44 29 58 20 Z"
            fill="#f472b6"
            stroke="#be185d"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Right Giant Bow Loop */}
          <path
            d="M62 17 C78 2 98 5 96 19 C94 31 76 29 62 20 Z"
            fill="#f472b6"
            stroke="#be185d"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Polka dots */}
          <circle cx="36" cy="14" r="2.5" fill="#fbcfe8" />
          <circle cx="43" cy="21" r="2" fill="#fbcfe8" />
          <circle cx="84" cy="14" r="2.5" fill="#fbcfe8" />
          <circle cx="77" cy="21" r="2" fill="#fbcfe8" />
          {/* Center Knot */}
          <ellipse cx="60" cy="18.5" rx="7" ry="6" fill="#ec4899" stroke="#be185d" strokeWidth="2.2" />
          <ellipse cx="58.5" cy="16.5" rx="2.2" ry="1.5" fill="#fbcfe8" />
        </g>
      )}

      {equipped.has('sock') && (
        <g className="prop-svg-group prop-svg-head">
          {/* Floppy Sock Beanie */}
          <path
            d="M33 25 C34 9 52 3 72 6 C86 8 96 16 93 24 C90 30 79 27 74 20 C67 22 46 25 33 25 Z"
            fill="#38bdf8"
            stroke="#0369a1"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Pink Toe Tip */}
          <path
            d="M86 12 C93 14 96 19 93 24 C89 28 83 26 81 21 Z"
            fill="#f472b6"
            stroke="#0369a1"
            strokeWidth="2"
          />
          {/* Yellow Stripes */}
          <path d="M47 8 Q51 16 49 23" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
          <path d="M61 6 Q65 14 63 22" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
          {/* Ribbed Cuff */}
          <rect x="31" y="21" width="48" height="6.5" rx="3" fill="#ffffff" stroke="#0369a1" strokeWidth="2" />
        </g>
      )}

      {/* ================= FACE PROPS (Glasses & Masks) ================= */}
      {equipped.has('mustache') && (
        <g className="prop-svg-group prop-svg-face">
          {/* Thick Comical Bushy Eyebrows */}
          <path d="M32 33 Q44 27 54 33" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M66 33 Q76 27 88 33" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
          {/* Round Horn-Rimmed Glasses (transparent lenses so character's eyes show through!) */}
          <circle cx="44" cy="45" r="12" fill="rgba(255, 255, 255, 0.22)" stroke="#111827" strokeWidth="3.6" />
          <circle cx="76" cy="45" r="12" fill="rgba(255, 255, 255, 0.22)" stroke="#111827" strokeWidth="3.6" />
          <path d="M56 44 Q60 41 64 44" fill="none" stroke="#111827" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M24 43 L32 45 M88 45 L96 43" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          {/* Lens Glint */}
          <path d="M38 39 L42 37 M70 39 L74 37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Funny Clown/Disguise Nose */}
          <ellipse cx="60" cy="52" rx="7.5" ry="6" fill="#fb7185" stroke="#be123c" strokeWidth="2" />
          <ellipse cx="58" cy="50" rx="2.5" ry="1.6" fill="#ffe4e6" />
          {/* Big Curly Handlebar Mustache */}
          <path
            d="M60 57 C52 54 40 56 33 63 C28 67 23 64 26 59 C29 63 35 60 40 56 M60 57 C68 54 80 56 87 63 C92 67 97 64 94 59 C91 63 85 60 80 56"
            fill="#451a03"
            stroke="#270e02"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M60 56 C50 54 37 59 31 64 C41 66 53 63 60 59 C67 63 79 66 89 64 C83 59 70 54 60 56 Z"
            fill="#5c2406"
            stroke="#270e02"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      )}

      {equipped.has('frog') && (
        <g className="prop-svg-group prop-svg-face">
          {/* Green Frog Glasses Frame */}
          <path d="M26 45 C32 39 88 39 94 45" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="44" cy="45" r="12" fill="rgba(187, 247, 208, 0.2)" stroke="#16a34a" strokeWidth="3.2" />
          <circle cx="76" cy="45" r="12" fill="rgba(187, 247, 208, 0.2)" stroke="#16a34a" strokeWidth="3.2" />
          {/* Giant Googly Frog Eyes on Springs */}
          <circle cx="43" cy="29" r="10.5" fill="#4ade80" stroke="#15803d" strokeWidth="2.4" />
          <circle cx="77" cy="29" r="10.5" fill="#4ade80" stroke="#15803d" strokeWidth="2.4" />
          <circle cx="43" cy="29" r="7" fill="#ffffff" />
          <circle cx="77" cy="29" r="7" fill="#ffffff" />
          <circle cx="44.5" cy="29" r="3.8" fill="#111827" />
          <circle cx="75.5" cy="29" r="3.8" fill="#111827" />
          <circle cx="46" cy="27.5" r="1.4" fill="#ffffff" />
          <circle cx="77" cy="27.5" r="1.4" fill="#ffffff" />
        </g>
      )}

      {equipped.has('snorkel') && (
        <g className="prop-svg-group prop-svg-face">
          {/* Snorkel Tube on Right */}
          <path
            d="M92 46 L92 18 C92 12 97 10 101 13"
            fill="none"
            stroke="#f97316"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M78 56 Q92 56 92 44"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Water Bubbles from Snorkel */}
          <circle cx="103" cy="9" r="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.2" />
          <circle cx="97" cy="4" r="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
          {/* Diving Goggle Mask */}
          <rect
            x="28"
            y="33"
            width="64"
            height="23"
            rx="11"
            fill="rgba(56, 189, 248, 0.32)"
            stroke="#0284c7"
            strokeWidth="3.8"
          />
          <path d="M57 56 L60 51 L63 56" fill="none" stroke="#0284c7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Goggle Glass Shine */}
          <path d="M36 39 L46 39 M72 39 L82 39" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
        </g>
      )}
    </svg>
  );
}

export const SillyCostumeModal: React.FC<SillyCostumeModalProps> = ({
  isOpen,
  onClose,
  buddy,
  soundEnabled,
  childName = '유하',
}) => {
  const [equipped, setEquipped] = useState<Set<CostumePropId>>(() => new Set(['mustache', 'crown']));
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
      // Replace any existing item in the same category ('head' or 'face') so props never pile up
      for (const other of COSTUME_ITEMS) {
        if (other.category === item.category) {
          next.delete(other.id);
        }
      }
      next.add(item.id);
      setBounceKey((k) => k + 1);
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
          <p className="costume-guide">모자 1개와 안경 1개를 골라 멋지게 변신해 봐!</p>
        </div>

        {/* Character Preview Stage with Equipped Props */}
        <div className="costume-stage">
          <div key={bounceKey} className="costume-avatar-stage">
            <CharacterAvatar id={buddy} size="xl" mood="excited" interactive={false} />
            <CostumeOverlaySvg equipped={equipped} />
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
                <CharacterAvatar id={buddy} size="xl" mood="dancing" interactive={false} />
                <CostumeOverlaySvg equipped={equipped} />
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

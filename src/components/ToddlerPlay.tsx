import { MotionConfig } from 'motion/react';
import { Hand, Volume2 } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import type { CharacterId } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterHead, CharacterPaint } from './CharacterArtwork';
import { CHARACTER_ART } from '../data/characterArt';
import { CHARACTERS } from '../data/characters';
import { speakText } from '../utils/soundEngine';
import './ToddlerPlay.css';

export function PlayGuide({ buddy, soundEnabled, title, guide, happy = false }: { buddy: CharacterId; soundEnabled: boolean; title: string; guide: string; happy?: boolean }) {
  return <div className="play-guide">
    <CharacterAvatar id={buddy} size="md" mood={happy ? 'happy' : 'still'} />
    <div><span className="sr-only">{CHARACTERS[buddy].name}와 함께</span><h2>{title}</h2></div>
    <button type="button" disabled={!soundEnabled} aria-label="놀이 안내 다시 듣기" onClick={() => speakText(guide, soundEnabled, { characterId: buddy })}><Volume2 /></button>
  </div>;
}
export function PlayShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <MotionConfig reducedMotion="user"><div className={`toddler-play ${className}`}>{children}</div></MotionConfig>;
}
export function PlayHint({ children }: { children: ReactNode }) {
  return <div className="play-hint"><Hand aria-hidden="true" /><span>{children}</span></div>;
}
export function PlayProgress({ total, done, label }: { total: number; done: number; label: string }) {
  return <div className="play-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
    {Array.from({ length: total }, (_, i) => <span key={i} data-done={i < done}>★</span>)}
  </div>;
}

/** The shared head keeps a friend's identity unchanged in full-body and care scenes.
 * The mouth and child overlays stay in the 300 × 258 care interaction coordinates.
 */
export function CareFriend({ buddy, mouth = 'open', children, className = '', smilingEyes = false, gaze, blush = '#ebaaa9', hideExpression = false, sleeping = false, faceLabel }: {
  buddy: CharacterId; mouth?: 'open' | 'chew' | 'smile' | 'rest'; children?: ReactNode; className?: string; smilingEyes?: boolean;
  gaze?: { x: number; y: number }; blush?: string; hideExpression?: boolean; sleeping?: boolean; faceLabel?: string;
}) {
  const prefix = `care-${useId().replace(/:/g, '')}`;
  const c = CHARACTER_ART[buddy];
  const happy = mouth === 'smile' || smilingEyes;
  const expression = sleeping ? 'sleepy' : happy || mouth === 'chew' ? 'excited' : mouth === 'rest' ? 'curious' : 'happy';
  return <svg viewBox="0 0 300 258" className={`care-friend ${className}`} data-character={buddy} data-expression={expression} data-chewing={mouth === 'chew'} role="img" aria-label={`${CHARACTERS[buddy].name}${faceLabel ? `의 ${faceLabel}` : sleeping ? '의 잠든 얼굴' : hideExpression ? '의 마음 얼굴' : happy ? '의 활짝 웃는 얼굴' : mouth === 'chew' ? '의 냠냠 먹는 얼굴' : mouth === 'rest' ? '의 배고픈 얼굴' : '의 아 벌린 입'}`}>
    <CharacterPaint id={buddy} prefix={prefix} />
    <defs>
      <linearGradient id={`${prefix}-mouth`} x2="0" y2="1"><stop stopColor="#754350" /><stop offset="1" stopColor="#a65f72" /></linearGradient>
      <linearGradient id={`${prefix}-collar-shadow`} x2="0" y2="1"><stop stopColor={c.edge} stopOpacity=".18" /><stop offset="1" stopColor={c.edge} stopOpacity="0" /></linearGradient>
    </defs>
    <g transform={mouth === 'open' ? undefined : 'translate(0 -30)'}>
      <ellipse cx="150" cy="247" rx="95" ry="8" fill="#a7978020" />
      <path d="M61 232 Q80 213 104 212 H197 Q227 214 240 232 L225 248 H75Z" fill={`url(#${prefix}-cloth)`} />
      <path d="M81 238 Q150 252 219 238" fill="none" stroke="#FFF5DA" strokeWidth="2" strokeDasharray="3 4" />
      <ellipse cx="150" cy="232" rx="74" ry="11" fill={`url(#${prefix}-collar-shadow)`} />
    </g>
    <g transform="translate(0 -14) scale(3)" className="care-canonical-head">
      <CharacterHead id={buddy} prefix={prefix} layout="care" jawOpen={mouth === 'open'} expression={expression} hideExpression={hideExpression} hideMouth gaze={gaze ? { x: gaze.x / 3, y: gaze.y / 3 } : undefined} blush={blush} />
    </g>
    {!hideExpression && <g className={`care-mouth${mouth === 'chew' ? ' care-mouth-chew' : ''}`}>
      {mouth === 'open' ? <>
        <rect x="72" y="130" width="156" height="79" rx="29" fill={`url(#${prefix}-mouth)`} stroke="#bc8085" strokeWidth="4" />
        <path d="M85 146 Q98 134 115 136 H185 Q208 134 216 147" stroke="#663d4c" strokeOpacity=".4" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="196" rx="38" ry="11" fill="#d9909d" />
        <path d="M132 193 Q149 187 166 193" stroke="#efb0b9" strokeWidth="2" fill="none" strokeLinecap="round" />
      </> : mouth === 'chew' ? <>
        <path d="M119 163 Q130 173 139 166 Q149 161 159 167 Q169 174 181 162" stroke="#90596a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M137 179 Q150 184 163 179" stroke={c.shade} strokeOpacity=".45" strokeWidth="3" fill="none" strokeLinecap="round" />
      </> : <path d={happy ? 'M112 151 Q150 195 188 151 Q150 167 112 151' : 'M118 164 Q150 176 182 164'} stroke="#90596a" strokeWidth="5" fill={happy ? '#fffcf4' : 'none'} strokeLinecap="round" />}
    </g>}
    {children}
  </svg>;
}

export function ToothBrushArt({ paste = true }: { paste?: boolean } = {}) {
  return <svg viewBox="0 0 210 74" aria-hidden="true"><path d="M65 36 H181 Q200 36 200 48 Q200 60 181 60 H66Z" fill="#94c4ce" stroke="#6296a3" strokeWidth="3" /><path d="M105 45 H174" stroke="#d4eced" strokeWidth="5" strokeLinecap="round" /><rect x="12" y="24" width="63" height="38" rx="12" fill="#edb6c6" stroke="#c78c9c" strokeWidth="3" />{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${20 + i * 6} 23 V8`} stroke={i % 2 ? '#d4eef0' : '#fffdf7'} strokeWidth="5" strokeLinecap="round" />)}{paste && <path d="M21 9 Q35 -1 47 8 Q60 0 68 10" stroke="#c8ded1" strokeWidth="7" strokeLinecap="round" fill="none" />}</svg>;
}

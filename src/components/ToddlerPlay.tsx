import { motion, MotionConfig } from 'motion/react';
import { Hand, Volume2 } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import type { CharacterId } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterPaint } from './CharacterArtwork';
import { CHARACTER_ART } from '../data/characterArt';
import { CHARACTERS } from '../data/characters';
import { speakText } from '../utils/soundEngine';
import './ToddlerPlay.css';

export function PlayGuide({ buddy, soundEnabled, title, guide, happy = false }: { buddy: CharacterId; soundEnabled: boolean; title: string; guide: string; happy?: boolean }) {
  return <div className="play-guide">
    <CharacterAvatar id={buddy} size="md" mood={happy ? 'happy' : 'waving'} />
    <div><span>{CHARACTERS[buddy].name}와 함께</span><h2>{title}</h2></div>
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

/** Close-up play portrait uses each existing friend's ears, fur, accessories and colors. */
export function CareFriend({ buddy, mouth = 'open', children, className = '', smilingEyes = false, gaze, blush = '#ebaaa9', hideExpression = false, sleeping = false, faceLabel }: {
  buddy: CharacterId; mouth?: 'open' | 'chew' | 'smile' | 'rest'; children?: ReactNode; className?: string; smilingEyes?: boolean;
  gaze?: { x: number; y: number }; blush?: string; hideExpression?: boolean; sleeping?: boolean; faceLabel?: string;
}) {
  const prefix = `care-${useId().replace(/:/g, '')}`;
  const c = CHARACTER_ART[buddy];
  const fur = `url(#${prefix}-fur)`;
  const edge = c.edge;
  const cream = `url(#${prefix}-cream)`;
  const pink = `url(#${prefix}-pink)`;
  const gold = `url(#${prefix}-gold)`;
  const happy = mouth === 'smile' || smilingEyes;
  return <svg viewBox="0 0 300 258" className={`care-friend ${className}`} role="img" aria-label={`${CHARACTERS[buddy].name}${faceLabel ? `의 ${faceLabel}` : sleeping ? '의 잠든 얼굴' : hideExpression ? '의 마음 얼굴' : happy ? '의 활짝 웃는 얼굴' : mouth === 'chew' ? '의 냠냠 먹는 얼굴' : mouth === 'rest' ? '의 배고픈 얼굴' : '의 아 벌린 입'}`}>
    <CharacterPaint id={buddy} prefix={prefix} />
    <defs><radialGradient id={`${prefix}-care-blush`}><stop stopColor={blush} stopOpacity=".8" /><stop offset="1" stopColor={blush} stopOpacity="0" /></radialGradient></defs>
    <ellipse cx="150" cy="247" rx="95" ry="8" fill="#a7978020" />
    <path d="M61 232 Q80 213 104 212 H197 Q227 214 240 232 L225 248 H75Z" fill={`url(#${prefix}-cloth)`} />
    <path d="M81 238 Q150 252 219 238" fill="none" stroke="#FFF5DA" strokeWidth="2" strokeDasharray="3 4" />
    <g stroke={edge} strokeWidth="1.8" strokeLinejoin="round">
      {buddy === 'jelly' ? <><ellipse cx="103" cy="49" rx="23" ry="45" fill={fur} transform="rotate(-12 103 49)" /><ellipse cx="198" cy="49" rx="23" ry="45" fill={fur} transform="rotate(12 198 49)" /><ellipse cx="103" cy="45" rx="11" ry="29" fill={pink} stroke="none" transform="rotate(-12 103 49)" /><ellipse cx="198" cy="45" rx="11" ry="29" fill={pink} stroke="none" transform="rotate(12 198 49)" /></> :
      buddy === 'rano' ? <path d="M62 83 Q26 59 42 108 Q7 118 44 146 Q4 166 56 183 Q34 219 82 213" fill={gold} /> :
      buddy === 'pingu' ? <path d="M128 60 Q120 23 148 39 Q171 15 181 58" fill={fur} /> : buddy === 'dochi' ? <path d="M50 182 Q24 174 28 148 L45 132 Q16 112 30 100 L55 90 Q38 61 51 58 L78 67 Q81 34 96 35 L117 54 Q131 22 144 30 L164 48 Q185 20 198 36 L205 56 Q236 30 240 52 L237 73 Q275 62 270 81 L253 103 Q283 115 273 132 L253 147 Q286 174 267 183 L243 192" fill={gold} /> :
      buddy === 'nurungji' ? <><ellipse cx="65" cy="113" rx="34" ry="60" fill={c.shade} transform="rotate(16 65 113)" /><ellipse cx="235" cy="113" rx="34" ry="60" fill={c.shade} transform="rotate(-16 235 113)" /><path d="M53 78 Q40 103 49 137 M247 78 Q260 103 251 137" fill="none" stroke={c.fur} strokeWidth="7" strokeLinecap="round" /></> :
      buddy === 'ggulgguli' ? <path d="M74 89 Q40 6 101 54 L119 83 M181 83 L199 54 Q260 6 226 89" fill={fur} /> :
      <><circle cx="80" cy="71" r="30" fill={fur} /><circle cx="220" cy="71" r="30" fill={fur} /><circle cx="80" cy="71" r="17" fill={pink} stroke="none" /><circle cx="220" cy="71" r="17" fill={pink} stroke="none" /></>}
      <ellipse cx="150" cy="143" rx="105" ry="94" fill={fur} />
      {buddy === 'eumme' && <path d="M60 111 Q37 81 66 73 Q58 44 91 49 Q102 21 130 42 Q153 18 176 42 Q208 23 217 54 Q250 45 242 79 Q269 98 239 117 Q224 85 204 89 Q173 72 151 89 Q121 73 100 89 Q75 85 60 111" fill={cream} />}
      {buddy === 'pingu' && <path d="M70 143 Q65 70 118 76 Q144 75 150 102 Q163 74 184 77 Q234 73 231 143 V179 Q224 222 150 226 Q77 222 69 181Z" fill={cream} stroke="none" />}
      <path d="M72 99 Q86 69 119 66" fill="none" stroke={c.light} strokeWidth="5" strokeLinecap="round" opacity=".7" />
      {buddy === 'jelly' && <g transform="translate(213 71)" fill={pink} stroke="none"><path d="M-7 4 Q-29 6 -24 -9 Q-11 -13 -7 4" fill="#9CBDA0" />{[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy="-7" rx="6" ry="8" transform={`rotate(${angle})`} />)}<circle r="5" fill={gold} /></g>}
      {buddy === 'ggomi' && <g fill={pink} stroke="#C68199"><path d="M201 63 Q173 33 176 65 Q179 84 201 72 Q224 91 230 67 Q231 42 201 63" /><circle cx="202" cy="67" r="7" /><path d="M184 56 l9 8 m26 -10 l-10 9" fill="none" stroke="#FFDBD9" strokeWidth="3" strokeLinecap="round" /></g>}
    </g>
    <g fill={c.ink}>
      <g transform={`translate(${gaze?.x || 0} ${gaze?.y || 0})`} className="care-eyes" opacity={hideExpression ? 0 : 1}>{sleeping ? <path d="M96 111 Q109 122 122 111 M178 111 Q191 122 204 111" fill="none" stroke={c.ink} strokeWidth="4" strokeLinecap="round" /> : happy ? <g stroke={c.ink} strokeWidth="5" fill="none" strokeLinecap="round"><path d="M95 117 Q108 102 121 117 M179 117 Q192 102 205 117" /></g> : <><ellipse cx="109" cy="109" rx="8.5" ry="11.5" fill={`url(#${prefix}-eye)`} /><ellipse cx="191" cy="109" rx="8.5" ry="11.5" fill={`url(#${prefix}-eye)`} /><ellipse cx="107" cy="105" rx="2.7" ry="3.3" fill="white" /><ellipse cx="189" cy="105" rx="2.7" ry="3.3" fill="white" /><circle cx="112" cy="114" r="1.6" fill="#FFEED7" /><circle cx="194" cy="114" r="1.6" fill="#FFEED7" /></>}</g>
      <motion.ellipse cx="73" cy="140" rx="23" ry="15" fill={`url(#${prefix}-care-blush)`} animate={{ scale: mouth === 'chew' ? [1, 1.3, 1] : 1 }} transition={{ duration: .4, repeat: mouth === 'chew' ? 2 : 0 }} />
      <motion.ellipse cx="227" cy="140" rx="23" ry="15" fill={`url(#${prefix}-care-blush)`} animate={{ scale: mouth === 'chew' ? [1, 1.3, 1] : 1 }} transition={{ duration: .4, repeat: mouth === 'chew' ? 2 : 0 }} />
      {buddy === 'ggulgguli' ? <><ellipse cx="150" cy="122" rx="22" ry="12" fill={pink} /><circle cx="142" cy="122" r="3" /><circle cx="158" cy="122" r="3" /></> : buddy === 'pingu' ? <path d="M137 121 Q150 113 163 121 Q161 128 150 135 Q139 128 137 121Z" fill={gold} /> : buddy === 'rano' ? <><circle cx="142" cy="123" r="2.8" /><circle cx="158" cy="123" r="2.8" /></> : <ellipse cx="150" cy="123" rx="7" ry="4.5" />}
    </g>
    {!hideExpression && <g className="care-mouth">{mouth === 'open' ? <><rect x="72" y="130" width="156" height="79" rx="29" fill="#844e59" stroke="#bc8085" strokeWidth="4" /><ellipse cx="150" cy="196" rx="38" ry="11" fill="#d9909d" /></> :
      <path d={happy ? 'M112 151 Q150 195 188 151 Q150 167 112 151' : 'M118 164 Q150 176 182 164'} stroke="#90596a" strokeWidth="5" fill={happy ? '#fffcf4' : 'none'} strokeLinecap="round" />}</g>}
    {children}
  </svg>;
}

export function ToothBrushArt() {
  return <svg viewBox="0 0 210 74" aria-hidden="true"><path d="M65 36 H181 Q200 36 200 48 Q200 60 181 60 H66Z" fill="#94c4ce" stroke="#6296a3" strokeWidth="3" /><path d="M105 45 H174" stroke="#d4eced" strokeWidth="5" strokeLinecap="round" /><rect x="12" y="24" width="63" height="38" rx="12" fill="#edb6c6" stroke="#c78c9c" strokeWidth="3" />{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${20 + i * 6} 23 V8`} stroke={i % 2 ? '#d4eef0' : '#fffdf7'} strokeWidth="5" strokeLinecap="round" />)}<path d="M21 9 Q35 -1 47 8 Q60 0 68 10" stroke="#c8ded1" strokeWidth="7" strokeLinecap="round" fill="none" /></svg>;
}

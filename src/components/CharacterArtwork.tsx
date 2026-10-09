import { memo, useId } from 'react';
import type { CharacterId } from '../types';
import { CHARACTER_ART } from '../data/characterArt';
import './CharacterArtwork.css';

export type CharacterExpression = 'happy' | 'excited' | 'curious' | 'comfort' | 'sleepy' | 'talking';
export type CharacterView = 'front' | 'three-quarter' | 'side';
type ArtProps = { id: CharacterId; prefix: string; view?: CharacterView };
const paint = (prefix: string, name: string) => `url(#${prefix}-${name})`;

/** Shared material swatches. Instance IDs keep several copies of a friend independent. */
export function CharacterPaint({ id, prefix }: { id: CharacterId; prefix: string }) {
  const c = CHARACTER_ART[id];
  return <defs>
    <radialGradient id={`${prefix}-fur`} cx="34%" cy="24%" r="82%">
      <stop stopColor={c.light} /><stop offset=".52" stopColor={c.fur} /><stop offset="1" stopColor={c.shade} />
    </radialGradient>
    <radialGradient id={`${prefix}-cream`} cx="38%" cy="25%" r="90%">
      <stop stopColor="#FFFEF9" /><stop offset=".65" stopColor={c.cream} /><stop offset="1" stopColor={id === 'pingu' ? '#E9DECB' : c.fur} />
    </radialGradient>
    <linearGradient id={`${prefix}-cloth`} x1=".1" y1="0" x2=".9" y2="1">
      <stop stopColor={c.accent} /><stop offset=".72" stopColor={c.accent} /><stop offset="1" stopColor={c.accentShade} />
    </linearGradient>
    <radialGradient id={`${prefix}-pink`} cx="35%" cy="25%" r="85%">
      <stop stopColor="#FFE1DD" /><stop offset=".5" stopColor="#F3B0BC" /><stop offset="1" stopColor="#D7839F" />
    </radialGradient>
    <radialGradient id={`${prefix}-blush`}>
      <stop stopColor="#ED96A5" stopOpacity=".64" /><stop offset="1" stopColor="#ED96A5" stopOpacity="0" />
    </radialGradient>
    <linearGradient id={`${prefix}-eye`} x2=".3" y2="1">
      <stop stopColor={c.ink} /><stop offset=".55" stopColor={c.ink} /><stop offset="1" stopColor={c.edge} />
    </linearGradient>
    <radialGradient id={`${prefix}-gold`} cx="30%" cy="20%" r="85%">
      <stop stopColor="#FFF2B3" /><stop offset=".6" stopColor="#EEC779" /><stop offset="1" stopColor="#C9984B" />
    </radialGradient>
    <linearGradient id={`${prefix}-contact`} x2="0" y2="1">
      <stop stopColor={c.ink} stopOpacity=".19" /><stop offset="1" stopColor={c.ink} stopOpacity="0" />
    </linearGradient>
    <radialGradient id={`${prefix}-volume`} cx="35%" cy="25%" r="75%">
      <stop stopColor="#FFFFFF" stopOpacity=".25" /><stop offset=".65" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor={c.ink} stopOpacity=".08" />
    </radialGradient>
  </defs>;
}

function Eyes({ prefix, ink, expression, y, spread, cx, view, sclera = false }: {
  prefix: string; ink: string; expression: CharacterExpression; y: number; spread: number; cx: number; view: CharacterView; sclera?: boolean;
}) {
  const shut = expression === 'excited' || expression === 'sleepy';
  const sides = view === 'side' ? [1] : [-1, 1];
  return <>
    {shut ? <g className="friend-expression-eyes" fill="none" stroke={ink} strokeWidth="1.9" strokeLinecap="round">
      {sides.map(side => <path key={side} d={`M${cx + side * spread - 3.8} ${y} q3.8 ${expression === 'sleepy' ? 4 : -5} 7.6 0`} />)}
    </g> : <g className="friend-open-eyes" stroke="none">
      {sides.map(side => {
        const x = cx + side * spread;
        const far = view === 'three-quarter' && side === -1;
        const radius = far ? 3.05 : 3.65;
        const height = expression === 'comfort' ? 3.8 : expression === 'curious' && side === 1 ? 5.1 : 4.8;
        return <g key={side}>
          {sclera && <ellipse cx={x} cy={y} rx={radius + 2.1} ry="7.2" fill="#FFFBEB" />}
          <ellipse cx={x} cy={y} rx={radius} ry={height} fill={paint(prefix, 'eye')} />
          <ellipse cx={x - .9} cy={y - 1.8} rx={far ? .9 : 1.2} ry="1.5" fill="#FFFDF8" />
          <circle className="friend-fine-detail" cx={x + 1.3} cy={y + 1.9} r=".65" fill="#FFF0D7" opacity=".85" />
        </g>;
      })}
    </g>}
    {!shut && <g className="friend-rest-eyes" fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round">
      {sides.map(side => <path key={side} d={`M${cx + side * spread - 3.8} ${y} q3.8 4 7.6 0`} />)}
    </g>}
    {expression === 'curious' && <path d={`M${cx + spread - 4} ${y - 9} q4 -3 8 0`} fill="none" stroke={ink} strokeWidth="1.1" strokeLinecap="round" opacity=".7" />}
    {expression === 'comfort' && <g fill="none" stroke={ink} strokeWidth=".9" strokeLinecap="round" opacity=".48">
      {sides.map(side => <path key={side} d={`M${cx + side * spread - 3} ${y - 7} q3 -2 6 -1`} />)}
    </g>}
  </>;
}

function Cheeks({ prefix, y, spread, cx, view, blush }: { prefix: string; y: number; spread: number; cx: number; view: CharacterView; blush?: string }) {
  return <g className="friend-cheeks" stroke="none">
    {blush && <defs><radialGradient id={`${prefix}-face-blush`}><stop stopColor={blush} stopOpacity=".65" /><stop offset="1" stopColor={blush} stopOpacity="0" /></radialGradient></defs>}
    {(view === 'side' ? [-1] : [-1, 1]).map(side => <g className="friend-cheek" key={side}>
      <ellipse cx={cx + spread * side} cy={y} rx="7.5" ry="4.9" fill={paint(prefix, blush ? 'face-blush' : 'blush')} />
      <path className="friend-fine-detail" d={`M${cx + spread * side - 2} ${y - .5} l.5 1.5 m2 -1.5 l.5 1.5`} stroke="#FFE0D6" strokeWidth=".8" strokeLinecap="round" />
    </g>)}
  </g>;
}

function Flower({ prefix }: { prefix: string }) {
  return <g className="friend-accessory friend-flower"><g transform="translate(72 29) rotate(12)">
    <path d="M-2 3 Q-10 6 -9 -1 Q-4 -5 -1 1" fill="#9CBDA0" />
    {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy="-3" rx="2.5" ry="3.5" transform={`rotate(${angle})`} fill={paint(prefix, 'pink')} stroke="#D891AD" strokeWidth=".4" />)}
    <circle r="2.4" fill={paint(prefix, 'gold')} /><circle cx="-.6" cy="-.7" r=".65" fill="#FFF9DC" />
  </g></g>;
}

function Ribbon({ prefix }: { prefix: string }) {
  return <g className="friend-accessory friend-ribbon"><g transform="translate(71 20) rotate(16)" stroke="#C68199" strokeWidth=".7" strokeLinejoin="round">
    <path d="M-1 2 L-6 10 L0 8 L3 10 L4 2" fill={paint(prefix, 'pink')} />
    <path d="M0 0 C-16 -13 -14 10 -1 5 C14 13 15 -10 0 0Z" fill={paint(prefix, 'pink')} />
    <path d="M-9 -3 L-4 0 M8 -1 L4 1" stroke="#FFE2DD" strokeWidth="1.2" strokeLinecap="round" />
    <ellipse cx="0" cy="2" rx="3" ry="3.4" fill="#E69DB6" />
  </g></g>;
}

/** Species keep their own weight, stance and outline; joint anchors stay stable for motion. */
const BODY_SHAPES: Partial<Record<CharacterId, string>> = {
  ggomi: 'M33 53 Q50 47 67 53 C77 61 79 80 69 87 Q50 97 31 87 C22 80 24 62 33 53Z',
  jelly: 'M39 53 Q50 50 61 53 Q67 61 67 74 Q72 83 65 87 Q50 92 35 87 Q28 83 33 74 Q33 61 39 53Z',
  dochi: 'M34 55 Q50 51 67 57 Q81 65 80 79 Q79 90 50 91 Q20 89 21 78 Q20 63 34 55Z',
  ggulgguli: 'M35 54 Q50 51 66 55 C79 63 84 80 72 88 Q50 97 28 87 C17 79 24 63 35 54Z',
  eumme: 'M31 57 Q24 51 26 64 Q17 65 23 75 Q15 83 28 86 Q28 93 40 87 Q50 96 59 88 Q73 94 75 84 Q87 80 78 72 Q85 61 71 61 Q73 51 61 55Z',
  nurungji: 'M34 54 Q49 50 63 55 Q73 64 73 79 Q73 89 52 90 Q34 93 27 82 Q25 63 34 54Z',
};

function SoftBody({ id, prefix, view = 'front' }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  const cream = paint(prefix, 'cream');
  const cloth = paint(prefix, 'cloth');
  const hoof = id === 'ggulgguli' || id === 'eumme';
  const short = id === 'dochi' || id === 'ggulgguli';
  const side = view === 'side';
  const torso = side ? 'M40 54 Q59 48 70 57 C80 67 81 80 71 88 Q54 93 40 86 Q28 74 40 54Z' : BODY_SHAPES[id];
  const leftArm = id === 'ggomi' ? 'M33 59 Q22 57 14 68 Q10 77 18 80 Q26 82 35 69' : id === 'jelly' ? 'M37 58 Q27 54 24 66 Q18 73 23 77 Q31 81 37 65' : id === 'dochi' ? 'M30 63 Q17 64 18 77 Q22 84 31 77 L37 69' : id === 'ggulgguli' ? 'M32 60 Q19 59 19 73 Q20 81 31 81 L39 70' : id === 'eumme' ? 'M31 60 Q23 59 21 72 Q18 78 24 80 Q31 80 35 68' : 'M32 59 Q23 60 22 75 Q22 84 28 85 Q35 83 37 67';
  const rightArm = id === 'ggomi' ? 'M67 59 Q78 57 86 68 Q90 77 82 80 Q74 82 65 69' : id === 'jelly' ? 'M62 59 Q70 55 77 44 Q82 36 86 41 Q91 48 68 70Z' : id === 'dochi' ? 'M69 64 Q80 61 83 72 Q86 81 78 82 Q70 81 64 69' : id === 'ggulgguli' ? 'M68 60 Q81 59 82 73 Q81 81 70 81 L63 69' : id === 'eumme' ? 'M68 61 Q76 56 81 49 Q87 43 89 50 Q92 58 73 72Z' : 'M66 60 Q76 54 81 43 Q87 37 91 45 Q94 56 73 73 L66 68Z';
  return <g data-body="full" stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    {id === 'jelly' && <g className="friend-tail"><circle cx={side ? 34 : 74} cy="79" r="7.6" fill={cream} /><path d={side ? 'M28 79 q2 -5 6 -4' : 'M70 79 q2 -5 6 -4'} fill="none" stroke="#FFFDF8" strokeWidth="1.5" /></g>}
    {id === 'nurungji' && <g className="friend-tail"><path d="M69 76 C85 83 83 65 89 59 C96 58 99 77 84 85 L71 86" fill={fur} /><path d="M89 62 Q94 70 87 78" fill="none" stroke="#FFEAC2" strokeWidth="2" strokeLinecap="round" /></g>}
    {id === 'ggulgguli' && <path className="friend-tail" d="M75 78 C94 68 94 86 85 85 C79 84 83 74 89 79" fill="none" stroke={c.shade} strokeWidth="2.8" strokeLinecap="round" />}
    {id === 'dochi' && <path d="M25 85 Q15 83 19 74 Q10 67 23 62 Q16 52 30 54 L73 56 Q84 55 81 65 Q92 69 82 77 Q88 86 75 87Z" fill={paint(prefix, 'gold')} />}
    <g className="friend-leg friend-leg-left">
      <path d={id === 'jelly' ? 'M37 78 Q34 86 25 90 Q18 97 35 97 H44 Q49 91 44 79' : id === 'eumme' ? 'M34 77 L31 92 Q29 97 40 96 L44 80' : short ? 'M32 79 Q28 87 29 93 Q33 98 44 94 L46 81' : 'M34 77 Q32 83 26 88 Q20 96 36 96 H44 Q48 94 45 79'} fill={side ? c.shade : fur} />
      <ellipse cx="35" cy="92" rx={id === 'eumme' ? 5 : 7.3} ry="3.5" fill={hoof ? c.edge : cream} stroke="none" />
      {id === 'ggomi' && <g fill={paint(prefix, 'pink')} stroke="none"><ellipse cx="35" cy="92.5" rx="3" ry="1.8" /><circle cx="31" cy="89.5" r="1" /><circle cx="35" cy="88.9" r="1.1" /><circle cx="39" cy="89.5" r="1" /></g>}
      {hoof && <path d="M35 91 v3" stroke={c.cream} strokeWidth=".8" />}
    </g>
    <g className="friend-leg friend-leg-right">
      <path d={id === 'jelly' ? 'M57 79 Q53 93 59 97 H73 Q82 95 74 90 L65 77' : id === 'eumme' ? 'M57 80 L60 96 Q70 98 70 92 L67 77' : short ? 'M57 81 L57 94 Q72 99 73 92 L67 79' : 'M56 79 Q53 95 58 96 H70 Q81 94 73 88 L66 77'} fill={fur} />
      <ellipse cx="65" cy="92" rx={id === 'eumme' ? 5 : 7.3} ry="3.5" fill={hoof ? c.edge : cream} stroke="none" />
      {id === 'ggomi' && <g fill={paint(prefix, 'pink')} stroke="none"><ellipse cx="65" cy="92.5" rx="3" ry="1.8" /><circle cx="61" cy="89.5" r="1" /><circle cx="65" cy="88.9" r="1.1" /><circle cx="69" cy="89.5" r="1" /></g>}
      {hoof && <path d="M65 91 v3" stroke={c.cream} strokeWidth=".8" />}
    </g>
    <path d={torso} fill={fur} />
    <ellipse cx={side ? 61 : 50} cy="74" rx={side ? 12 : id === 'ggulgguli' ? 20 : 16} ry={id === 'dochi' ? 11 : 13} fill={cream} stroke="none" />
    <path d={torso} fill={paint(prefix, 'volume')} stroke="none" />
    {id === 'ggomi' ? <>
      <path d="M34 57 L42 62 H59 L66 57 L72 84 Q59 92 50 88 Q40 93 28 84Z" fill={cloth} stroke={c.accentShade} />
      <path d="M36 59 L38 71 M64 59 L62 71" stroke="#FBD8DD" strokeWidth="4" /><circle cx="38" cy="69" r="1.5" fill="#FFF6D8" /><circle cx="62" cy="69" r="1.5" fill="#FFF6D8" />
      <path d="M43 74 h14 v8 q-7 4 -14 0Z" fill="#E89DB5" stroke={c.accentShade} strokeWidth=".5" />
      <path d="M50 81 C43 77 47 74 50 77 C53 74 57 77 50 81" fill="#FFF1DA" stroke="none" />
    </> : id === 'jelly' ? <>
      <path d="M38 57 Q50 62 62 57 L71 85 Q50 94 29 85Z" fill={cloth} stroke={c.accentShade} />
      <path d="M35 81 Q50 87 66 81 L68 85 Q50 91 32 85Z" fill="#E4D4F4" stroke="none" />
      <path d="M43 65 L39 80 M57 65 L61 80" stroke={c.accentShade} strokeOpacity=".5" fill="none" />
      <path d="M50 77 C42 72 46 69 50 72 C54 69 58 73 50 77" fill="#FFF4E4" stroke="none" />
    </> : <g className="friend-accessory friend-scarf">
      <path d="M32 57 Q50 61 69 56 L63 65 L51 72 L37 64Z" fill={cloth} stroke={c.accentShade} />
      <path className="friend-fine-detail" d="M37 60 Q51 64 63 60 L51 68Z" fill="none" stroke="#FFF9E6" strokeWidth=".8" strokeDasharray="1.2 1.6" />
      {id === 'eumme' ? <g><circle cx="50" cy="69" r="4.5" fill={paint(prefix, 'gold')} stroke="#B99A59" /><path d="M47 70 h6 m-3 0 v2" stroke="#B99A59" /><circle cx="49" cy="67" r="1" fill="#FFF8CF" /></g> : <circle cx="51" cy="67" r="2" fill="#FFF3CF" stroke="none" />}
    </g>}
    <path d="M32 61 Q50 68 69 61 L67 68 Q50 73 34 68Z" fill={paint(prefix, 'contact')} stroke="none" />
    <g className="friend-arm friend-arm-left">
      <path d={leftArm} fill={side ? c.shade : fur} /><ellipse cx={id === 'nurungji' ? 28 : 23} cy={id === 'nurungji' ? 79 : 74} rx="3.1" ry="3.5" fill={hoof ? c.edge : cream} stroke="none" />
    </g>
    <g className="friend-arm friend-arm-right">
      <path d={rightArm} fill={fur} /><ellipse cx={id === 'ggomi' ? 79 : id === 'ggulgguli' ? 76 : id === 'dochi' ? 78 : id === 'jelly' ? 82 : 86} cy={id === 'ggomi' || id === 'ggulgguli' || id === 'dochi' ? 75 : 47} rx="3" ry="3.6" fill={hoof ? c.edge : cream} stroke="none" />
    </g>
  </g>;
}

/** This face is reused by avatars and care games; only the jaw stretches for an open mouth. */
export function CharacterHead({ id, prefix, expression = 'happy', view = 'front', layout = 'default', jawOpen = true, hideExpression = false, hideMouth = false, gaze, blush }: ArtProps & {
  expression?: CharacterExpression; layout?: 'default' | 'care'; jawOpen?: boolean; hideExpression?: boolean; hideMouth?: boolean;
  gaze?: { x: number; y: number }; blush?: string;
}) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  const cream = paint(prefix, 'cream');
  const pink = paint(prefix, 'pink');
  const gold = paint(prefix, 'gold');
  const care = layout === 'care';
  const profile = view === 'side';
  const turned = view === 'three-quarter';
  const bottom = care ? (jawOpen ? 83 : 73) : id === 'jelly' ? 67 : 66;
  const cheekBottom = bottom - 5;
  const eyeY = care ? 40 : id === 'jelly' ? 46 : id === 'rano' ? 39 : id === 'pingu' ? 40 : 42;
  const faceX = profile ? 65 : turned ? 55 : 50;
  const eyeSpread = profile ? 2 : id === 'eumme' ? 10 : turned ? 10 : 12;
  const noseX = profile ? 76 : turned ? 59 : id === 'rano' ? 54 : 50;
  const noseY = care ? (id === 'pingu' ? 43 : 45) : id === 'jelly' ? 53 : id === 'rano' ? 48 : id === 'pingu' ? 48 : 49;
  const earBack = profile ? 'translate(10 1)' : turned ? 'translate(4 0)' : undefined;
  const earFront = profile ? 'translate(-10 1)' : turned ? 'translate(-3 0)' : undefined;
  const head = profile ? `M32 26 C49 19 65 25 71 37 C78 38 85 40 85 48 C86 59 73 ${bottom} 56 ${bottom} C35 ${bottom + 1} 23 56 25 42 Q26 30 32 26Z` : turned ? `M23 42 C23 25 37 20 54 21 C73 21 84 34 83 48 Q85 ${cheekBottom} 57 ${bottom} Q28 ${bottom + 1} 22 53Z` : id === 'jelly' ? `M20 46 C19 33 31 27 50 28 C69 27 81 33 80 46 C83 ${cheekBottom} 70 ${bottom} 50 ${bottom} C30 ${bottom} 17 ${cheekBottom} 20 46Z` : id === 'ggulgguli' ? `M20 43 C19 27 34 20 50 22 C69 20 82 30 81 46 Q87 ${cheekBottom} 50 ${bottom} Q13 ${cheekBottom} 20 43Z` : `M19 43 C19 25 33 18 50 19 C67 18 81 25 81 43 C85 ${cheekBottom} 70 ${bottom} 50 ${bottom} C30 ${bottom} 15 ${cheekBottom} 19 43Z`;
  return <g className="friend-head" data-head-layout={layout} stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    {id === 'ggomi' && <>
      <g className="friend-ear friend-ear-left"><g transform={earBack}><circle cx="26" cy="23" r="11.5" fill={fur} /><circle cx="26" cy="23" r="6.7" fill={pink} stroke="none" /></g></g>
      <g className="friend-ear friend-ear-right" visibility={profile ? 'hidden' : undefined}><g transform={earFront}><circle cx="75" cy="23" r="11.5" fill={fur} /><circle cx="75" cy="23" r="6.7" fill={pink} stroke="none" /></g></g>
    </>}
    {id === 'jelly' && <>
      <g className="friend-ear friend-ear-left"><g transform={earBack}><path d="M29 34 C26 24 20 8 28 6 C38 3 41 20 42 32" fill={fur} /><path d="M32 28 C28 17 26 11 30 11 C34 12 36 21 36 29" fill={pink} stroke="none" /></g></g>
      <g className="friend-ear friend-ear-right" visibility={profile ? 'hidden' : undefined}><g transform={earFront}><path d="M58 33 C57 18 64 3 71 8 C77 13 67 24 68 35" fill={fur} /><path d="M63 29 C62 21 66 11 69 13 C71 16 65 25 65 30" fill={pink} stroke="none" /></g></g>
    </>}
    {id === 'nurungji' && <>
      <g className="friend-ear friend-ear-left"><g transform={earBack}><path d="M29 22 C12 16 6 32 12 54 C15 65 27 62 30 51 L36 29Z" fill={c.shade} /><path d="M20 28 Q14 36 17 50" fill="none" stroke={c.fur} strokeWidth="3" strokeLinecap="round" /></g></g>
      <g className="friend-ear friend-ear-right" visibility={profile ? 'hidden' : undefined}><g transform={earFront}><path d="M70 22 C86 15 95 33 88 53 C84 63 74 60 71 50 L64 30Z" fill={c.shade} /><path d="M80 28 Q87 35 82 49" fill="none" stroke={c.fur} strokeWidth="3" strokeLinecap="round" /></g></g>
    </>}
    {id === 'ggulgguli' && <>
      <g className="friend-ear friend-ear-left"><g transform={earBack}><path d="M23 34 C16 31 12 15 21 15 Q32 16 36 25" fill={fur} /><path d="M21 21 L25 31 L30 25" fill={pink} stroke="none" /></g></g>
      <g className="friend-ear friend-ear-right" visibility={profile ? 'hidden' : undefined}><g transform={earFront}><path d="M65 24 Q76 11 84 16 Q91 20 77 34" fill={fur} /><path d="M79 20 L70 25 L78 29" fill={pink} stroke="none" /></g></g>
    </>}
    {id === 'dochi' && <>
      <path d={`M21 ${bottom - 5} Q12 59 13 51 L17 46 Q8 41 12 35 L20 33 Q14 25 18 20 L28 23 Q27 13 34 12 L40 19 Q43 8 49 9 L54 18 Q62 9 67 13 L68 23 Q78 17 82 22 L79 33 Q89 33 90 40 L83 45 Q90 52 86 ${bottom - 8} L76 ${bottom - 2} Q50 ${bottom + 8} 21 ${bottom - 5}Z`} fill={gold} />
      <path className="friend-fine-detail" d="M24 35 Q20 27 26 25 M34 26 Q31 19 37 20 M48 23 Q47 16 51 18 M61 26 Q63 18 67 24 M73 34 Q81 27 81 36" stroke="#FFF0C3" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <g className="friend-ear friend-ear-left"><circle cx="27" cy="37" r="6" fill={fur} /><circle cx="27" cy="37" r="3.3" fill={pink} stroke="none" /></g>
      <g className="friend-ear friend-ear-right" visibility={profile ? 'hidden' : undefined}><circle cx="73" cy="37" r="6" fill={fur} /><circle cx="73" cy="37" r="3.3" fill={pink} stroke="none" /></g>
      <path d={profile ? head : `M24 44 Q23 31 36 34 Q50 41 64 34 Q77 31 76 45 Q80 ${bottom - 3} 50 ${bottom} Q20 ${bottom - 2} 24 44Z`} fill={cream} />
    </>}
    {id === 'eumme' ? <>
      <g className="friend-ear friend-ear-left"><path d="M24 36 C6 29 7 45 24 47" fill={cream} /><path d="M24 28 C12 28 16 13 24 18 Q31 25 23 27" fill={gold} /></g>
      <g className="friend-ear friend-ear-right" visibility={profile ? 'hidden' : undefined}><path d="M76 36 C94 29 93 45 76 47" fill={cream} /><path d="M76 28 C88 28 84 13 76 18 Q69 25 77 27" fill={gold} /></g>
      <path d={`M22 33 Q15 23 28 21 Q31 10 42 16 Q51 7 60 16 Q74 10 78 25 Q88 28 81 40 Q91 52 79 ${bottom - 10} Q83 ${bottom + 1} 68 ${bottom - 1} Q58 ${bottom + 9} 50 ${bottom + 1} Q39 ${bottom + 9} 32 ${bottom - 1} Q17 ${bottom + 2} 20 ${bottom - 11} Q8 48 19 40Z`} fill={fur} />
      <path d={profile ? head : `M28 43 Q28 30 50 31 Q72 30 72 43 Q79 ${bottom - 5} 50 ${bottom - 2} Q21 ${bottom - 5} 28 43Z`} fill={cream} />
      <path d="M25 33 Q27 24 35 29 Q36 19 45 26 Q51 16 57 26 Q68 20 69 31 Q78 28 77 36 Q73 41 67 36 Q61 42 55 36 Q49 42 43 35 Q36 41 32 34 Q27 38 25 33Z" fill={fur} />
      <path className="friend-fine-detail" d="M28 27 q2 -3 5 -1 m16 -6 q3 -2 5 1 m17 33 q5 0 5 -4" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    </> : id === 'rano' ? <>
      <path d="M28 29 Q13 21 17 39 Q4 38 13 51 Q5 62 22 62" fill={gold} stroke="#C2AA62" />
      <path d={profile ? head : `M23 43 C21 25 32 15 49 16 C67 13 81 28 79 45 Q84 ${bottom - 7} 58 ${bottom} Q24 ${bottom + 1} 23 43Z`} fill={fur} />
    </> : id === 'pingu' ? <>
      <path d={profile ? head : `M22 44 Q21 13 48 12 Q78 10 79 43 Q87 ${bottom - 2} 51 ${bottom + 1} Q17 ${bottom - 2} 22 44Z`} fill={fur} />
      <g className="friend-accessory friend-tuft"><g transform={profile ? 'translate(9 13)' : undefined}><path d="M43 15 Q42 7 49 11 Q54 6 58 15" fill={fur} stroke="none" /></g></g>
      <path d={profile ? `M49 31 Q54 22 65 29 Q73 34 72 41 Q85 39 85 48 Q83 61 58 ${bottom - 2} Q35 62 37 46Z` : `M28 42 Q26 24 37 24 Q47 22 50 33 Q54 22 65 24 Q76 26 73 43 Q84 ${bottom - 2} 50 ${bottom - 1} Q17 ${bottom - 3} 28 42Z`} fill={cream} stroke="none" />
    </> : id !== 'dochi' && <path d={head} fill={fur} />}
    <g className="friend-face" stroke="none">
      {(id === 'ggomi' || id === 'nurungji') && <ellipse cx={noseX} cy={noseY + 3} rx={profile ? 10 : 13.3} ry="9.5" fill={cream} />}
      {id === 'rano' && <><ellipse cx={noseX} cy={noseY + 1.5} rx={profile ? 12 : 22} ry="10.5" fill={fur} /><path d={`M${noseX - 17} ${noseY + 6} Q${noseX} ${noseY + 15} ${noseX + 18} ${noseY + 5}`} stroke={c.shade} strokeOpacity=".2" strokeWidth="1.2" fill="none" /></>}
      <Cheeks prefix={prefix} y={care ? 49 : noseY + (id === 'jelly' ? 1 : 0)} spread={profile ? 6 : id === 'eumme' ? 17 : 21} cx={profile ? 63 : faceX} view={view} blush={blush} />
      {!hideExpression && <g transform={`translate(${gaze?.x || 0} ${gaze?.y || 0})`}>
        <Eyes prefix={prefix} ink={c.ink} expression={expression} y={eyeY} spread={eyeSpread} cx={faceX} view={view} sclera={id === 'rano'} />
      </g>}
      {id === 'ggulgguli' ? <>
        <ellipse cx={noseX} cy={care ? 44 : noseY + 2} rx={care ? 8 : profile ? 9 : 11.5} ry={care ? 4 : 7.8} fill={pink} stroke="#D892A7" strokeWidth=".7" />
        {!profile && <ellipse cx={noseX - (care ? 3 : 4)} cy={care ? 44 : noseY + 2} rx={care ? 1 : 1.8} ry={care ? 1.4 : 2.3} fill="#B57189" />}<ellipse cx={noseX + (care ? 3 : 4)} cy={care ? 44 : noseY + 2} rx={care ? 1 : 1.8} ry={care ? 1.4 : 2.3} fill="#B57189" />
        <path d={`M${noseX - 6} ${noseY - 3} Q${noseX} ${noseY - 5} ${noseX + 6} ${noseY - 3}`} fill="none" stroke="#FFE0DB" strokeWidth="1.4" strokeLinecap="round" />
      </> : id === 'rano' ? <>
        {!profile && <ellipse cx={noseX - 5} cy={care ? 45 : noseY - 3} rx="1.2" ry="1.5" fill={c.edge} />}<ellipse cx={noseX + 7} cy={care ? 45 : noseY - 3} rx="1.2" ry="1.5" fill={c.edge} />
      </> : id === 'pingu' ? <>
        <path d={`M${noseX - 6} ${noseY} Q${noseX} ${noseY - 5} ${noseX + 6} ${noseY} Q${noseX + 6} ${noseY + 3} ${noseX} ${noseY + (care ? 5 : 7)} Q${noseX - 6} ${noseY + 3} ${noseX - 6} ${noseY}`} fill={gold} stroke="#C49A59" strokeWidth=".6" />
        <path d={`M${noseX - 3} ${noseY - 1} Q${noseX} ${noseY - 3} ${noseX + 2} ${noseY - 1}`} fill="none" stroke="#FFF2B5" strokeLinecap="round" />
      </> : <>
        <path d={`M${noseX - 4} ${noseY - 1} Q${noseX} ${noseY - 4} ${noseX + 4} ${noseY - 1} Q${noseX + 3} ${noseY + 3} ${noseX} ${noseY + 3} Q${noseX - 3} ${noseY + 3} ${noseX - 4} ${noseY - 1}`} fill={id === 'jelly' || id === 'eumme' ? '#BF7D96' : c.ink} />
        <ellipse cx={noseX - 1.4} cy={noseY - .5} rx="1.4" ry=".7" fill="#FFFFFF" opacity=".65" />
      </>}
      {!hideExpression && !hideMouth && <Mouth id={id} prefix={prefix} expression={expression} x={noseX} y={noseY + (id === 'ggulgguli' ? 12 : id === 'pingu' ? 2 : 6)} />}
      {id === 'dochi' && <path className="friend-fine-detail" d="M33 51 l1 0 m2 2 h1 m27 -2 h1 m2 -2 h1" stroke="#CE9B70" strokeWidth="1.3" strokeLinecap="round" />}
    </g>
    {id === 'ggomi' && <Ribbon prefix={prefix} />}
    {id === 'jelly' && <Flower prefix={prefix} />}
    {id === 'nurungji' && <path d="M43 22 Q42 17 47 18 Q45 13 52 17 Q57 15 58 22" fill={fur} stroke="none" />}
    {id === 'ggulgguli' && <path className="friend-fine-detail" d="M45 23 Q44 16 50 19 Q53 17 55 22" fill="none" stroke={c.shade} strokeWidth="1.4" strokeLinecap="round" />}
  </g>;
}

function Mouth({ id, prefix, expression, x, y }: { id: CharacterId; prefix: string; expression: CharacterExpression; x: number; y: number }) {
  const ink = CHARACTER_ART[id].ink;
  const open = expression === 'excited' || expression === 'talking';
  return <g className="friend-mouth" stroke={ink} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {expression === 'curious' ? <ellipse cx={x + 1.5} cy={y + 1} rx="2.3" ry="2.8" fill={ink} stroke="none" /> : expression === 'sleepy' ? <path d={`M${x - 2} ${y} q2 1.2 4 0`} fill="none" /> : open ? <>
      <path d={`M${x - 5} ${y - 1} Q${x} ${y + 1} ${x + 5} ${y - 1} Q${x + 5} ${y + 7} ${x} ${y + 7} Q${x - 5} ${y + 7} ${x - 5} ${y - 1}Z`} fill={ink} strokeWidth=".6" />
      <path d={`M${x - 3.5} ${y + 4.5} Q${x} ${y + 1.5} ${x + 3.5} ${y + 4.5} Q${x} ${y + 8} ${x - 3.5} ${y + 4.5}`} fill={paint(prefix, 'pink')} stroke="none" />
    </> : <>
      <path d={`M${x - 4} ${y} Q${x} ${y + (expression === 'comfort' ? 3 : 5)} ${x + 4} ${y}`} fill="none" />
      {id === 'nurungji' && expression === 'happy' && <><path d={`M${x - 2.5} ${y + 1} Q${x} ${y + 3} ${x + 2.5} ${y + 1} V${y + 4} Q${x} ${y + 8} ${x - 2.5} ${y + 4}Z`} fill={paint(prefix, 'pink')} stroke="none" /><path d={`M${x} ${y + 3} v2`} stroke="#CF8191" strokeWidth=".6" /></>}
    </>}
  </g>;
}

function DinoBody({ id, prefix, view = 'front' }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  return <g data-body="full" stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    <g className="friend-tail"><path d="M69 68 Q85 80 92 54 Q103 86 73 89" fill={fur} /><path d="M91 61 L94 67 L88 68" fill={paint(prefix, 'gold')} stroke="none" /></g>
    <g className="friend-leg friend-leg-left"><path d="M30 77 Q23 85 25 93 Q25 98 43 96 L46 79" fill={view === 'side' ? c.shade : fur} /><path d="M29 94 v-3 m5 3 v-3 m5 3 v-3" stroke="#FFF0C6" strokeWidth="2" strokeLinecap="round" /></g>
    <g className="friend-leg friend-leg-right"><path d="M57 79 L56 94 Q74 99 78 93 Q80 87 69 81 L69 77" fill={fur} /><path d="M64 94 v-3 m5 3 v-3 m5 3 v-3" stroke="#FFF0C6" strokeWidth="2" strokeLinecap="round" /></g>
    <path d={view === 'side' ? 'M39 47 Q64 43 71 57 Q84 88 57 91 Q24 90 29 69Z' : 'M29 48 Q50 42 70 48 Q86 87 55 91 Q18 91 24 65Z'} fill={fur} />
    <ellipse cx={view === 'side' ? 62 : 52} cy="72" rx={view === 'side' ? 13 : 18} ry="16" fill={paint(prefix, 'cream')} stroke="none" />
    <path d="M43 74 Q52 77 61 74 M45 81 Q52 84 59 81" stroke="#DFC887" strokeWidth=".8" fill="none" />
    <path d="M29 56 Q50 64 73 56 L72 65 Q50 71 30 65Z" fill={paint(prefix, 'contact')} stroke="none" />
    <g className="friend-arm friend-arm-left"><path d="M31 61 Q24 57 20 63 Q15 70 23 74 Q29 74 34 68" fill={view === 'side' ? c.shade : fur} /><path d="M21 65 l2 1 m-1 -4 l2 1" stroke={c.light} strokeWidth="1.4" strokeLinecap="round" /></g>
    <g className="friend-arm friend-arm-right"><path d="M68 61 Q77 57 82 54 Q88 52 89 58 Q87 65 74 72 L69 69" fill={fur} /><path d="M84 55 l1 2 m-4 0 l1 2" stroke={c.light} strokeWidth="1.4" strokeLinecap="round" /></g>
    <g className="friend-fine-detail" fill={c.shade} stroke="none" opacity=".35"><circle cx="27" cy="69" r="1.5" /><circle cx="28" cy="75" r="1" /><circle cx="74" cy="77" r="1.2" /></g>
  </g>;
}

function PenguinBody({ id, prefix, view = 'front' }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  const gold = paint(prefix, 'gold');
  return <g data-body="full" stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    <g className="friend-leg friend-leg-left"><path d="M26 83 Q16 87 21 92 Q31 97 44 91 L43 82" fill={gold} stroke="#C99C58" /><path d="M26 91 l2 -3 m5 4 l1 -3" stroke="#FCE6A6" strokeLinecap="round" /></g>
    <g className="friend-leg friend-leg-right"><path d="M57 83 L56 91 Q71 98 80 92 Q86 87 73 83" fill={gold} stroke="#C99C58" /><path d="M68 92 l-1 -3 m7 2 l-2 -3" stroke="#FCE6A6" strokeLinecap="round" /></g>
    <g className="friend-arm friend-arm-left"><path d="M25 47 Q10 43 8 63 Q7 76 25 63" fill={view === 'side' ? c.shade : fur} /></g>
    <g className="friend-arm friend-arm-right"><path d="M74 47 Q88 36 93 43 Q99 51 77 66" fill={fur} /></g>
    <path d={view === 'side' ? 'M36 42 Q66 37 78 53 Q88 69 77 84 Q66 94 46 90 Q25 83 29 65Z' : 'M24 42 Q50 32 77 43 Q93 70 78 85 Q67 93 50 93 Q29 92 20 83 Q9 67 24 42Z'} fill={fur} />
    <path d={view === 'side' ? 'M56 49 Q72 46 76 57 Q87 82 61 88 Q41 84 45 64Z' : 'M29 49 Q51 39 72 50 Q87 81 50 87 Q15 83 29 49Z'} fill={paint(prefix, 'cream')} stroke="none" />
    <ellipse cx="48" cy="79" rx="14" ry="7" fill={paint(prefix, 'volume')} stroke="none" />
  </g>;
}

function PenguinScarf({ id, prefix }: ArtProps) {
  const c = CHARACTER_ART[id];
  return <g className="friend-accessory friend-scarf" stroke={c.accentShade} strokeWidth=".7" strokeLinejoin="round">
    <path d="M62 63 L73 63 L77 80 Q71 86 63 81Z" fill={paint(prefix, 'cloth')} />
    <path d="M65 77 L74 76 M65 80 L74 79" stroke="#E6FAE8" strokeWidth="1.2" />
    <path d="M24 58 Q50 67 76 58 L75 66 Q50 76 25 66Z" fill={paint(prefix, 'cloth')} />
    <path d="M29 61 Q50 68 71 62" fill="none" stroke="#E1F8E4" strokeWidth="1.3" strokeLinecap="round" />
    <path className="friend-fine-detail" d="M31 66 l1 -2 m4 3 l1 -2 m4 3 l1 -2 m4 3 l1 -2 m4 2 l1 -2 m4 1 l1 -2 m4 1 l1 -2" stroke="#579F98" strokeOpacity=".45" />
  </g>;
}

/** Keep the 100 × 100 joint coordinates used by greetings and park motion. */
export const CharacterArtwork = memo(function CharacterArtwork({ id, expression = 'happy', view = 'front', variant = 'full' }: {
  id: CharacterId; expression?: CharacterExpression; view?: CharacterView; variant?: 'full' | 'portrait';
}) {
  const prefix = `friend-${useId().replace(/:/g, '')}`;
  const portrait = variant === 'portrait';
  return <svg viewBox={portrait ? (id === 'jelly' ? '7 2 86 76' : '5 5 90 76') : '0 0 100 100'} className="character-artwork w-full h-full" data-expression={expression} data-view={view} data-variant={variant} aria-hidden="true" focusable="false">
    <CharacterPaint id={id} prefix={prefix} />
    {!portrait && <>
      <ellipse className="friend-ground-shadow" cx="50" cy="96.5" rx={id === 'jelly' ? 24 : 28} ry="2.5" fill="#786654" opacity=".13" />
      {id === 'rano' ? <DinoBody id={id} prefix={prefix} view={view} /> : id === 'pingu' ? <PenguinBody id={id} prefix={prefix} view={view} /> : <SoftBody id={id} prefix={prefix} view={view} />}
    </>}
    <CharacterHead id={id} prefix={prefix} expression={expression} view={view} />
    {!portrait && id === 'pingu' && <PenguinScarf id={id} prefix={prefix} />}
  </svg>;
});

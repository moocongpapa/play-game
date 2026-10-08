import { memo, useId } from 'react';
import type { CharacterId } from '../types';
import { CHARACTER_ART } from '../data/characterArt';
import './CharacterArtwork.css';

/** Instance-local IDs avoid crossed paint references when a friend appears twice. */
export function CharacterPaint({ id, prefix }: { id: CharacterId; prefix: string }) {
  const c = CHARACTER_ART[id];
  return <defs>
    <radialGradient id={`${prefix}-fur`} cx="32%" cy="22%" r="80%">
      <stop stopColor={c.light} /><stop offset=".56" stopColor={c.fur} /><stop offset="1" stopColor={c.shade} />
    </radialGradient>
    <radialGradient id={`${prefix}-cream`} cx="38%" cy="25%" r="80%">
      <stop stopColor="#FFFFFF" /><stop offset=".6" stopColor={c.cream} /><stop offset="1" stopColor={id === 'pingu' ? '#E9DECB' : c.fur} />
    </radialGradient>
    <linearGradient id={`${prefix}-cloth`} x1="0" y1="0" x2=".8" y2="1">
      <stop stopColor={c.accent} /><stop offset="1" stopColor={c.accentShade} />
    </linearGradient>
    <radialGradient id={`${prefix}-pink`} cx="35%" cy="25%" r="85%">
      <stop stopColor="#FFE1DD" /><stop offset=".5" stopColor="#F3B0BC" /><stop offset="1" stopColor="#D7839F" />
    </radialGradient>
    <radialGradient id={`${prefix}-blush`}>
      <stop stopColor="#EF99AB" stopOpacity=".75" /><stop offset="1" stopColor="#EF99AB" stopOpacity="0" />
    </radialGradient>
    <linearGradient id={`${prefix}-eye`} x2=".3" y2="1">
      <stop stopColor={c.ink} /><stop offset=".55" stopColor={c.ink} /><stop offset="1" stopColor={c.edge} />
    </linearGradient>
    <radialGradient id={`${prefix}-gold`} cx="30%" cy="20%" r="85%">
      <stop stopColor="#FFF2B3" /><stop offset=".6" stopColor="#EEC779" /><stop offset="1" stopColor="#C9984B" />
    </radialGradient>
  </defs>;
}

type ArtProps = { id: CharacterId; prefix: string };
const paint = (prefix: string, name: string) => `url(#${prefix}-${name})`;

function Eyes({ prefix, ink, y = 42, spread = 12, sclera = false }: { prefix: string; ink: string; y?: number; spread?: number; sclera?: boolean }) {
  const restY = sclera ? y - 2 : y;
  return <>
    <g className="friend-open-eyes" stroke="none">
      {[-1, 1].map(side => <g key={side}>
        {sclera && <ellipse cx={50 + spread * side} cy={y} rx="6" ry="7.5" fill="#FFFBEB" />}
        <ellipse cx={50 + spread * side} cy={y} rx="3.6" ry="4.8" fill={paint(prefix, 'eye')} />
        <ellipse cx={49 + spread * side} cy={y - 1.8} rx="1.25" ry="1.6" fill="#FFFDF8" />
        <circle cx={51.4 + spread * side} cy={y + 2} r=".7" fill="#FFF0D7" opacity=".85" />
      </g>)}
    </g>
    <g className="friend-rest-eyes" fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round">
      <path d={`M${46 - spread} ${restY} q4 4 8 0 M${46 + spread} ${restY} q4 4 8 0`} />
    </g>
  </>;
}

function Cheeks({ prefix, y = 49, spread = 20 }: { prefix: string; y?: number; spread?: number }) {
  return <g stroke="none">
    {[-1, 1].map(side => <g key={side}>
      <ellipse cx={50 + spread * side} cy={y} rx="7" ry="4.8" fill={paint(prefix, 'blush')} />
      <path d={`M${48 + spread * side} ${y - .5} l.5 1.5 m2 -1.5 l.5 1.5`} stroke="#FFD6D3" strokeWidth=".8" strokeLinecap="round" />
    </g>)}
  </g>;
}

function Nose({ ink, y = 49 }: { ink: string; y?: number }) {
  return <g>
    <path d={`M46 ${y - 1} Q50 ${y - 4} 54 ${y - 1} Q53 ${y + 3} 50 ${y + 3} Q47 ${y + 3} 46 ${y - 1}`} fill={ink} />
    <ellipse cx="48.6" cy={y - .5} rx="1.4" ry=".7" fill="#FFFFFF" opacity=".6" />
    <path d={`M50 ${y + 3} v2 m-4 -.5 q4 4 8 0`} fill="none" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
  </g>;
}

function Flower({ prefix }: { prefix: string }) {
  return <g transform="translate(72 29) rotate(12)">
    <path d="M-2 3 Q-10 6 -9 -1 Q-4 -5 -1 1" fill="#9CBDA0" />
    {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy="-3" rx="2.5" ry="3.5" transform={`rotate(${angle})`} fill={paint(prefix, 'pink')} stroke="#D891AD" strokeWidth=".4" />)}
    <circle r="2.4" fill={paint(prefix, 'gold')} /><circle cx="-.6" cy="-.7" r=".65" fill="#FFF9DC" />
  </g>;
}

function Ribbon({ prefix }: { prefix: string }) {
  return <g transform="translate(71 20) rotate(16)" stroke="#C68199" strokeWidth=".7" strokeLinejoin="round">
    <path d="M-1 2 L-6 10 L0 8 L3 10 L4 2" fill={paint(prefix, 'pink')} />
    <path d="M0 0 C-16 -13 -14 10 -1 5 C14 13 15 -10 0 0Z" fill={paint(prefix, 'pink')} />
    <path d="M-9 -3 L-4 0 M8 -1 L4 1" stroke="#FFE2DD" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="0" cy="2" rx="3" ry="3.4" fill="#E69DB6" />
  </g>;
}

function SoftBody({ id, prefix }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  const cream = paint(prefix, 'cream');
  const cloth = paint(prefix, 'cloth');
  const hoof = id === 'ggulgguli' || id === 'eumme';
  return <g data-body="full" stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    {id === 'jelly' && <circle className="friend-tail" cx="75" cy="77" r="8" fill={cream} />}
    {id === 'nurungji' && <g className="friend-tail"><path d="M70 76 C88 84 84 65 91 64 C97 69 95 87 74 85" fill={fur} /><path d="M89 67 Q92 73 90 78" fill="none" stroke="#FFEAC2" strokeWidth="2" strokeLinecap="round" /></g>}
    {id === 'ggulgguli' && <path className="friend-tail" d="M74 77 C94 68 94 84 85 84 C79 84 84 73 89 78" fill="none" stroke={c.shade} strokeWidth="2.8" strokeLinecap="round" />}
    {id === 'dochi' && <path d="M27 80 Q18 74 25 67 Q17 57 29 54 L71 54 Q84 57 76 68 Q84 77 74 82Z" fill={c.shade} />}
    <g className="friend-leg friend-leg-left">
      <path d="M34 77 Q32 83 28 88 Q24 96 36 96 H44 Q48 94 45 79" fill={fur} />
      <ellipse cx="36" cy="92" rx="7.3" ry="3.4" fill={hoof ? c.edge : cream} stroke="none" />
      <path d="M32 90 v1.5 m4 -2 v1.5 m4 -1 v1.5" stroke={hoof ? '#E9D7C5' : c.shade} strokeWidth=".6" strokeLinecap="round" />
    </g>
    <g className="friend-leg friend-leg-right">
      <path d="M56 79 Q53 95 58 96 H69 Q79 95 73 88 L66 77" fill={fur} />
      <ellipse cx="65" cy="92" rx="7.3" ry="3.4" fill={hoof ? c.edge : cream} stroke="none" />
      <path d="M61 90 v1.5 m4 -2 v1.5 m4 -1 v1.5" stroke={hoof ? '#E9D7C5' : c.shade} strokeWidth=".6" strokeLinecap="round" />
    </g>
    <path d="M35 53 Q50 48 65 53 Q74 62 73 78 Q73 89 50 90 Q27 89 27 78 Q26 64 35 53Z" fill={fur} />
    {id === 'eumme' && <path d="M32 58 Q22 56 26 65 Q18 70 26 77 Q20 86 32 87 Q35 94 44 88 Q51 95 58 88 Q70 94 73 83 Q83 79 74 71 Q81 62 69 59" fill={fur} />}
    <ellipse cx="50" cy="73" rx="16" ry="13" fill={cream} stroke="none" />
    {id === 'ggomi' || id === 'jelly' ? <>
      <path d="M35 56 Q50 63 65 56 L71 83 Q50 93 29 83Z" fill={cloth} stroke={c.accentShade} />
      <path d="M35 64 Q50 70 65 64 M33 81 Q50 87 67 81" fill="none" stroke="#FFF5E9" strokeOpacity=".75" strokeWidth="1.2" />
      <path d="M38 70 L36 81 M62 70 L64 81" stroke={c.accentShade} opacity=".55" fill="none" />
      <path d="M50 79 C40 73 45 69 50 73 C55 68 60 74 50 79" fill="#FFF4DD" stroke="none" />
      <path d="M36 60 l2 4 m26 -4 l-2 4" stroke="#FFF4DD" strokeWidth="2" strokeLinecap="round" />
    </> : <>
      <path d="M32 57 Q50 61 69 56 L63 65 L51 72 L37 64Z" fill={cloth} stroke={c.accentShade} />
      <path d="M37 60 Q51 64 63 60 L51 68Z" fill="none" stroke="#FFF9E6" strokeWidth=".8" strokeDasharray="1.2 1.6" />
      {id === 'eumme' ? <g><circle cx="50" cy="69" r="4.5" fill={paint(prefix, 'gold')} stroke="#B99A59" /><path d="M47 70 h6 m-3 0 v2" stroke="#B99A59" /><circle cx="49" cy="67" r="1" fill="#FFF8CF" /></g> : <circle cx="51" cy="67" r="2" fill="#FFF3CF" stroke="none" />}
    </>}
    <g className="friend-arm friend-arm-left">
      <path d="M34 60 Q25 55 19 65 Q13 73 17 78 Q24 85 33 70" fill={fur} />
      <ellipse cx="22" cy="74" rx="3.2" ry="3.7" fill={cream} stroke="none" />
      <path d="M20 65 Q16 72 18 74" stroke={c.light} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
    <g className="friend-arm friend-arm-right">
      <path d="M66 59 Q74 56 80 45 Q84 36 90 41 Q99 51 74 71 Q67 72 66 59Z" fill={fur} />
      <ellipse cx="87" cy="47" rx="3.3" ry="4" fill={cream} stroke="none" transform="rotate(25 87 47)" />
      <path d="M83 42 q3 -3 5 0" fill="none" stroke={c.light} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </g>;
}

function SoftHead({ id, prefix }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  const cream = paint(prefix, 'cream');
  const pink = paint(prefix, 'pink');
  const head = id === 'jelly' ? 'M20 46 C19 32 32 27 50 28 C68 27 81 33 80 46 C82 61 68 67 50 67 C32 67 18 61 20 46Z' : 'M19 43 C19 24 33 18 50 19 C67 18 81 25 81 43 C85 58 70 66 50 66 C30 66 15 58 19 43Z';
  return <g className="friend-head" stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    {id === 'ggomi' && <>
      <circle cx="26" cy="23" r="11.5" fill={fur} /><circle cx="75" cy="23" r="11.5" fill={fur} />
      <circle cx="26" cy="23" r="6.7" fill={pink} stroke="none" /><circle cx="75" cy="23" r="6.7" fill={pink} stroke="none" />
    </>}
    {id === 'jelly' && <>
      <path d="M29 34 C26 24 22 6 28 4 C38 0 42 19 42 31" fill={fur} />
      <path d="M58 32 C57 13 64 1 70 5 C76 9 68 27 68 35" fill={fur} />
      <path d="M32 28 C28 16 27 9 30 9 C34 10 36 20 36 29 M63 29 C62 20 65 9 68 10 C70 13 65 27 65 30" fill={pink} stroke="none" />
    </>}
    {id === 'nurungji' && <>
      <path d="M29 22 C13 15 7 32 12 53 C15 64 27 62 30 52 L36 29Z" fill={c.shade} />
      <path d="M70 22 C86 15 94 34 87 55 C82 65 74 60 71 51 L64 30Z" fill={c.shade} />
      <path d="M20 27 Q13 35 17 49 M79 27 Q87 35 81 49" fill="none" stroke={c.fur} strokeWidth="2.6" strokeLinecap="round" />
    </>}
    {id === 'ggulgguli' && <>
      <path d="M23 34 C16 31 12 15 21 15 Q32 16 36 25" fill={fur} />
      <path d="M65 24 Q76 11 84 16 Q91 20 77 34" fill={fur} />
      <path d="M21 21 L25 31 L30 25 M79 20 L70 25 L78 29" fill={pink} stroke="none" />
    </>}
    {id === 'dochi' && <>
      <path d="M21 61 Q12 59 13 51 L17 46 Q8 41 12 35 L20 33 Q14 25 18 20 L28 23 Q27 13 34 12 L40 19 Q43 8 49 9 L54 18 Q62 9 67 13 L68 23 Q78 17 82 22 L79 33 Q89 33 90 40 L83 45 Q90 52 86 58 L76 64 Q50 72 21 61Z" fill={paint(prefix, 'gold')} />
      <path d="M24 35 Q20 27 26 25 M34 26 Q31 19 37 20 M48 23 Q47 16 51 18 M61 26 Q63 18 67 24 M73 34 Q81 27 81 36" stroke="#FFF0C3" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="27" cy="37" r="6" fill={fur} /><circle cx="73" cy="37" r="6" fill={fur} />
    </>}
    {id === 'eumme' ? <>
      <path d="M24 36 C6 29 7 45 24 47 M76 36 C94 29 93 45 76 47" fill={cream} />
      <path d="M24 28 C12 28 16 13 24 18 Q31 25 23 27 M76 28 C88 28 84 13 76 18 Q69 25 77 27" fill={paint(prefix, 'gold')} />
      <path d="M22 33 Q15 23 28 21 Q31 10 42 16 Q51 7 60 16 Q74 10 78 25 Q88 28 81 40 Q90 50 79 56 Q81 68 68 65 Q58 75 50 67 Q39 75 32 65 Q18 68 20 55 Q8 48 19 40Z" fill={fur} />
      <path d="M28 43 Q28 30 50 31 Q72 30 72 43 Q76 61 50 63 Q24 61 28 43" fill={cream} />
      <path d="M25 33 Q27 24 35 29 Q36 19 45 26 Q51 16 57 26 Q68 20 69 31 Q78 28 77 36" fill={fur} />
      <path d="M28 27 q2 -3 5 -1 m16 -6 q3 -2 5 1 m17 33 q5 0 5 -4" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    </> : <>
      <path d={id === 'dochi' ? 'M24 44 Q23 31 36 34 Q50 41 64 34 Q77 31 76 45 Q80 63 50 65 Q20 63 24 44Z' : head} fill={id === 'dochi' ? cream : fur} />
      <path d={id === 'jelly' ? 'M26 40 Q30 32 41 32' : 'M26 35 Q30 25 43 24'} fill="none" stroke={c.light} strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
    </>}
    <g stroke="none">
      <Cheeks prefix={prefix} y={id === 'jelly' ? 53 : 49} spread={id === 'eumme' ? 17 : 21} />
      {(id === 'ggomi' || id === 'nurungji') && <ellipse cx="50" cy="52" rx="12.8" ry="9.5" fill={cream} />}
      <Eyes prefix={prefix} ink={c.ink} y={id === 'jelly' ? 46 : 42} spread={id === 'eumme' ? 10 : 12} />
      {id === 'ggulgguli' ? <>
        <ellipse cx="50" cy="51" rx="11.5" ry="7.8" fill={pink} stroke="#D892A7" strokeWidth=".7" />
        <ellipse cx="46" cy="51" rx="1.8" ry="2.3" fill="#B57189" /><ellipse cx="54" cy="51" rx="1.8" ry="2.3" fill="#B57189" />
        <path d="M44 46 Q50 44 56 46" fill="none" stroke="#FFE0DB" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M46 61 q4 3 8 0" fill="none" stroke={c.ink} strokeWidth="1.2" strokeLinecap="round" />
      </> : <Nose ink={id === 'jelly' || id === 'eumme' ? '#BF7D96' : c.ink} y={id === 'jelly' ? 53 : 49} />}
      {id === 'nurungji' && <><path d="M47 57 Q50 59 53 57 V60 Q50 65 47 60Z" fill={pink} /><path d="M50 59 v2" stroke="#CF8191" strokeWidth=".6" /></>}
      {id === 'dochi' && <path d="M33 51 l1 0 m2 2 h1 m27 -2 h1 m2 -2 h1" stroke="#CE9B70" strokeWidth="1.3" strokeLinecap="round" />}
    </g>
    {id === 'ggomi' && <Ribbon prefix={prefix} />}
    {id === 'jelly' && <Flower prefix={prefix} />}
    {id === 'nurungji' && <path d="M43 22 Q42 17 47 18 Q45 13 52 17 Q57 15 58 22" fill={fur} stroke="none" />}
    {id === 'ggulgguli' && <path d="M45 23 Q44 16 50 19 Q53 17 55 22" fill="none" stroke={c.shade} strokeWidth="1.4" strokeLinecap="round" />}
  </g>;
}

function Dino({ id, prefix }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  return <g stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    <g className="friend-tail"><path d="M70 68 Q88 76 92 51 Q103 86 73 87" fill={fur} /><path d="M91 58 L94 65 L88 66" fill={paint(prefix, 'gold')} stroke="none" /></g>
    <g className="friend-leg friend-leg-left"><path d="M30 77 Q25 84 27 92 Q26 97 42 95 L45 79" fill={fur} /><path d="M30 93 v-3 m5 3 v-3 m5 3 v-3" stroke="#FFF0C6" strokeWidth="2" strokeLinecap="round" /></g>
    <g className="friend-leg friend-leg-right"><path d="M57 79 L56 94 Q74 98 76 92 Q78 87 69 82 L69 77" fill={fur} /><path d="M63 93 v-3 m5 3 v-3 m5 3 v-3" stroke="#FFF0C6" strokeWidth="2" strokeLinecap="round" /></g>
    <path d="M27 33 Q10 26 17 44 Q2 43 13 57 Q1 62 18 68 Q12 79 27 77" fill={paint(prefix, 'gold')} stroke="#C2AA62" />
    <path d="M24 52 C17 30 31 15 49 16 C71 13 83 31 80 53 Q86 89 52 90 Q20 90 24 52" fill={fur} />
    <path d="M30 32 Q32 23 45 22" stroke={c.light} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    <ellipse cx="52" cy="72" rx="18" ry="15" fill={paint(prefix, 'cream')} stroke="none" />
    <path d="M43 75 Q52 78 61 75 M45 81 Q52 83 59 81" stroke="#E0C985" strokeWidth=".8" fill="none" />
    <g className="friend-arm friend-arm-left"><path d="M29 61 Q22 58 16 63 Q9 70 18 77 Q26 79 32 69" fill={fur} /><path d="M16 67 l2 1 m0 -4 l2 1" stroke={c.light} strokeWidth="1.4" strokeLinecap="round" /></g>
    <g className="friend-arm friend-arm-right"><path d="M69 61 Q79 58 85 48 Q90 43 94 50 Q97 57 77 73 L71 72" fill={fur} /><path d="M88 49 l1 2 m-4 0 l1 2" stroke={c.light} strokeWidth="1.4" strokeLinecap="round" /></g>
    <g stroke="none"><Eyes prefix={prefix} ink={c.ink} y={39} spread={11} sclera />
      <ellipse cx="54" cy="51" rx="22" ry="11.5" fill={fur} /><Cheeks prefix={prefix} y={51} spread={21} />
      <ellipse cx="49" cy="46" rx="1.2" ry="1.5" fill={c.edge} /><ellipse cx="61" cy="46" rx="1.2" ry="1.5" fill={c.edge} />
      <path d="M44 53 Q54 62 66 52 Q54 56 44 53" fill={c.ink} /><path d="M52 57 Q57 54 60 57 Q56 60 52 57" fill="#EEA1AF" />
      <circle cx="28" cy="52" r="1.7" fill={c.shade} opacity=".4" /><circle cx="25" cy="57" r="1" fill={c.shade} opacity=".4" />
    </g>
  </g>;
}

function Penguin({ id, prefix }: ArtProps) {
  const c = CHARACTER_ART[id];
  const fur = paint(prefix, 'fur');
  const gold = paint(prefix, 'gold');
  return <g stroke={c.edge} strokeWidth=".7" strokeLinejoin="round">
    <g className="friend-leg friend-leg-left"><path d="M26 83 Q17 86 22 91 Q31 96 44 91 L43 82" fill={gold} stroke="#C99C58" /><path d="M27 90 l2 -3 m4 4 l1 -3" stroke="#FCE6A6" strokeLinecap="round" /></g>
    <g className="friend-leg friend-leg-right"><path d="M57 83 L56 91 Q71 97 79 91 Q85 86 73 83" fill={gold} stroke="#C99C58" /><path d="M67 91 l-1 -3 m7 2 l-2 -3" stroke="#FCE6A6" strokeLinecap="round" /></g>
    <g className="friend-arm friend-arm-left"><path d="M25 47 Q10 43 8 63 Q7 76 25 62" fill={fur} /><path d="M14 55 q-4 6 -3 9" stroke="#A4C6D5" strokeWidth="1.3" strokeLinecap="round" fill="none" /></g>
    <g className="friend-arm friend-arm-right"><path d="M74 47 Q88 32 93 41 Q99 48 77 65" fill={fur} /><path d="M86 40 q4 -1 5 3" stroke="#A4C6D5" strokeWidth="1.3" strokeLinecap="round" fill="none" /></g>
    <path d="M22 44 Q21 13 48 12 Q78 10 79 43 Q90 69 77 82 Q69 90 50 90 Q29 90 21 81 Q10 68 22 44" fill={fur} />
    <path d="M43 14 Q42 6 49 10 Q54 4 58 14" fill={fur} stroke="none" />
    <path d="M28 42 Q26 24 37 24 Q47 22 50 33 Q54 22 65 24 Q76 26 73 43 Q85 77 50 83 Q15 79 28 42" fill={paint(prefix, 'cream')} stroke="none" />
    <path d="M30 23 Q35 17 43 18" fill="none" stroke="#C1D9DD" strokeWidth="1.7" strokeLinecap="round" opacity=".8" />
    <Eyes prefix={prefix} ink={c.ink} y={40} spread={12} />
    <Cheeks prefix={prefix} y={48} spread={21} />
    <path d="M44 48 Q50 43 56 48 Q56 51 50 55 Q44 51 44 48" fill={gold} stroke="#C49A59" />
    <path d="M46 48 Q50 50 54 48" fill="none" stroke="#E2AA58" /><path d="M47 47 Q50 45 52 47" fill="none" stroke="#FFF2B5" strokeLinecap="round" />
    <path d="M62 63 L73 63 L77 80 Q71 86 63 81Z" fill={paint(prefix, 'cloth')} stroke={c.accentShade} />
    <path d="M65 77 L74 76 M65 80 L74 79" stroke="#E6FAE8" strokeWidth="1.2" />
    <path d="M24 57 Q50 66 76 57 L75 66 Q50 75 25 66Z" fill={paint(prefix, 'cloth')} stroke={c.accentShade} />
    <path d="M29 60 Q50 67 71 61" fill="none" stroke="#E1F8E4" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M31 66 l1 -2 m4 3 l1 -2 m4 3 l1 -2 m4 3 l1 -2 m4 2 l1 -2 m4 1 l1 -2 m4 1 l1 -2" stroke="#579F98" strokeOpacity=".45" />
    <ellipse cx="45" cy="78" rx="6" ry="2.4" fill="#FFFFFF" opacity=".55" stroke="none" />
  </g>;
}

/** Keep the 100 × 100 joint coordinates used by greetings, care and park motion. */
export const CharacterArtwork = memo(function CharacterArtwork({ id }: { id: CharacterId }) {
  const prefix = `friend-${useId().replace(/:/g, '')}`;
  return <svg viewBox="0 0 100 100" className="character-artwork w-full h-full" aria-hidden="true" focusable="false">
    <CharacterPaint id={id} prefix={prefix} />
    <ellipse className="friend-ground-shadow" cx="50" cy="96" rx="27" ry="2.8" fill="#786654" opacity=".13" />
    {id === 'rano' ? <Dino id={id} prefix={prefix} /> : id === 'pingu' ? <Penguin id={id} prefix={prefix} /> : <><SoftBody id={id} prefix={prefix} /><SoftHead id={id} prefix={prefix} /></>}
  </svg>;
});

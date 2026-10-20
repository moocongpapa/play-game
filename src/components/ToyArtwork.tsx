import React, { useId } from 'react';
import { templates, type Template } from '../sketch/art';
import { templateBounds } from '../sketch/template-bounds';

const aliases: Record<string, string> = { '🧸': 'bear', '🦖': 'dinosaur', '🍏': 'apple', '🚗': 'car', '🐟': 'fish', '🐕': 'dog' };
const compositeStickers: Record<string, [string, string]> = {
  '🎀🐻': ['🐻', '🎀'],
  '🦖🌿': ['🦖', '🌱'],
  '💖🐰': ['🐰', '💖'],
  '⭐🦔': ['🦔', '⭐'],
  '🍰🐷': ['🐷', '🍰'],
  '☁️🐑': ['🐑', '☁️'],
  '🦴🐶': ['🐶', '⭐'],
};
const palette: Record<string, string> = {
  apple: '#ed7169', strawberry: '#ef7884', banana: '#f5cf66', grapes: '#a48acb',
  watermelon: '#f18c8b', orange: '#f4ad60', pear: '#ddd477', peach: '#efa099',
  cherries: '#d86575', pineapple: '#e8bc61', rabbit: '#f4e8ef', bear: '#ca9570',
  cat: '#efc389', dog: '#e6b67c', tiger: '#edb266', dinosaur: '#82b6a0',
  elephant: '#a2b5ce', lion: '#edc479', penguin: '#738999', turtle: '#8fb79c',
  fish: '#f0ab70', butterfly: '#ad9fda', police: '#789fc4', firetruck: '#e3847d',
  plane: '#99c5d1', train: '#88b4a1', bus: '#e6bc69', rocket: '#d6e5eb',
};
const emojiTemplates = new Map(templates.map(t => [t.emoji, t]));
const byId = new Map(templates.map(t => [t.id, t]));
const emotions: Record<string, string> = {
  '😊': 'happy', '😢': 'sad', '😠': 'angry', '😲': 'surprised', '😨': 'scared',
  '😳': 'shy', '😴': 'tired', '😆': 'excited', '😍': 'love', '🥰': 'love', '🥳': 'party',
};

function regionColor(t: Template, id: string, base: string) {
  if (/eye|pupil|nose|seed|stripe-top|stripe-left|stripe-right/.test(id)) return '#51493f';
  if (/leaf|leaves|stem/.test(id)) return /stem/.test(id) ? '#947355' : '#79a87a';
  if (/cheek|inner-left|inner-right|inner-ear/.test(id)) return '#eda4a2';
  if (/window|bubble/.test(id)) return '#c2e4eb';
  if (/wheel|track/.test(id)) return '#667788';
  if (/hub|belly|muzzle/.test(id)) return '#fff0d4';
  if (/rind|shell/.test(id)) return '#73a57b';
  if (/mane/.test(id)) return '#bd865e';
  if (/spikes|flame|tip|beak|spot|fin/.test(id)) return '#f0c66f';
  if (t.id === 'penguin' && /foot/.test(id)) return '#edb565';
  return base;
}

/** Shared vector toys keep preview cards, answers and silhouettes visually identical. */
export function ToyArtwork({ emoji, className = '', label }: { emoji: string; className?: string; label?: string }) {
  const uid = useId().replace(/:/g, '');
  if (compositeStickers[emoji]) {
    const [mainEmoji, badgeEmoji] = compositeStickers[emoji];
    return (
      <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label || undefined} className={`toy-art relative inline-flex items-center justify-center ${className}`}>
        <ToyArtwork emoji={mainEmoji} className="w-full h-full" />
        <span className="absolute -top-1 -right-1 w-2/5 h-2/5 drop-shadow-xs">
          <ToyArtwork emoji={badgeEmoji} className="w-full h-full" />
        </span>
      </span>
    );
  }
  const template = emojiTemplates.get(emoji) || byId.get(aliases[emoji]);
  const mood = emotions[emoji];
  let drawing: React.ReactNode;
  let viewBox = '0 0 100 100';
  if (template) {
    const b = templateBounds[template.id];
    viewBox = b ? `${b.x / 2 - 8} ${b.y / 2 - 8} ${b.width / 2 + 16} ${b.height / 2 + 16}` : '60 20 480 410';
    const base = emoji === '🍏' ? '#91b96e' : palette[template.id] || '#b5a4ce';
    const colors = [...new Set(template.regions.map(r => r.fixed || regionColor(template, r.id, base)))];
    drawing = <>
      <defs>{colors.map((color, i) => <linearGradient key={color} id={`${uid}-${i}`} x1="0%" y1="0%" x2="80%" y2="100%">
        <stop stopColor={color} /><stop offset="1" stopColor={color} style={{ stopColor: `color-mix(in srgb, ${color} 86%, #795e46)` }} />
      </linearGradient>)}</defs>
      <g stroke="#725744" strokeOpacity=".55" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
        {template.regions.map(r => <path key={r.id} d={r.d} fill={`url(#${uid}-${colors.indexOf(r.fixed || regionColor(template, r.id, base))})`} />)}
        {template.lines.map((d, i) => <path key={i} d={d} fill="none" />)}
      </g>
    </>;
  } else if (emoji === '🥕') {
    drawing = <g stroke="#9f7854" strokeWidth="2.5" strokeLinejoin="round"><path d="M42 24 Q40 4 49 10 L56 26 Q63 0 69 8 L65 29 Q83 11 84 24 L66 39" fill="#8bb782" /><path d="M31 28 Q50 19 69 40 Q77 60 17 91 Q11 83 22 50Z" fill="#efad68" /><path d="M28 46 L40 54 M24 63 L32 68 M47 40 L57 48" fill="none" stroke="#cd894b" /><path d="M28 35 Q38 30 44 34" stroke="#ffe0a5" fill="none" /></g>;
  } else if (emoji === '🥦') {
    drawing = <g stroke="#60845e" strokeWidth="2.5" strokeLinejoin="round"><path d="M40 43 L35 88 Q50 98 65 88 L60 43" fill="#b4ca8e" /><path d="M49 84 V56 M49 70 L32 52 M49 69 L68 48" fill="none" stroke="#7da16f" /><path d="M21 61 Q1 52 14 35 Q13 17 33 18 Q44 -1 60 16 Q82 10 85 31 Q103 47 83 60 Q72 73 54 61 Q36 77 21 61" fill="#86b080" /><path d="M28 40 Q22 27 37 26 M48 25 Q58 17 65 30 M67 42 Q82 33 84 46" fill="none" stroke="#b0cc9e" strokeWidth="5" strokeLinecap="round" /></g>;
  } else if (mood) {
    drawing = <g stroke="#725446" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22" cy="23" r="13" fill="#d6a380" /><circle cx="78" cy="23" r="13" fill="#d6a380" />
      <circle cx="50" cy="52" r="37" fill={mood === 'angry' ? '#efb19c' : '#f1caa3'} />
      {mood === 'party' && <><polygon points="36,18 50,2 64,18" fill="#f472b6" /><circle cx="50" cy="3" r="3.5" fill="#fde047" stroke="none" /></>}
      <ellipse cx="27" cy="62" rx="7" ry="4" fill="#e99f9b" stroke="none" /><ellipse cx="73" cy="62" rx="7" ry="4" fill="#e99f9b" stroke="none" />
      {mood === 'tired' || mood === 'excited' || mood === 'party' ? <path d="M29 48 Q35 54 41 48 M59 48 Q65 54 71 48" fill="none" /> :
        <><ellipse cx="35" cy="49" rx={mood === 'scared' ? 5 : 3} ry="5" fill="#725446" /><ellipse cx="65" cy="49" rx={mood === 'scared' ? 5 : 3} ry="5" fill="#725446" /></>}
      {mood === 'angry' && <path d="M28 36 L42 41 M58 41 L72 36" />}
      {(mood === 'sad' || mood === 'scared') && <path d="M28 40 L41 34 M59 34 L72 40" />}
      {['surprised', 'scared', 'tired'].includes(mood) ? <ellipse cx="50" cy="68" rx="7" ry="9" fill="#936152" /> :
        <path d={mood === 'sad' || mood === 'angry' ? 'M40 73 Q50 60 60 73' : 'M38 64 Q50 83 62 64 Z'} fill={mood === 'sad' || mood === 'angry' ? 'none' : '#fff8e9'} />}
      {mood === 'sad' && <path d="M29 56 Q20 67 28 70 Q36 66 29 56" fill="#94c9dc" stroke="none" />}
      {mood === 'shy' && <><circle cx="25" cy="61" r="8" fill="#e89698" stroke="none" /><circle cx="75" cy="61" r="8" fill="#e89698" stroke="none" /></>}
      {mood === 'love' && <path d="M28 40 Q25 32 32 33 Q37 28 42 34 Q46 41 35 48 Z M58 40 Q55 32 62 33 Q67 28 72 34 Q76 41 65 48 Z" fill="#d77485" stroke="none" />}
    </g>;
  } else {
    const faces: Record<string, [string, string]> = {
      '🐷': ['#edb5b6', 'pig'], '🐑': ['#fff7e8', 'sheep'], '🦆': ['#f0cd79', 'duck'],
      '🐸': ['#a4c890', 'frog'], '🐮': ['#f9f1e0', 'cow'], '🐄': ['#f9f1e0', 'cow'],
      '🦊': ['#ef8e52', 'fox'], '🦛': ['#b3a8c8', 'hippo'], '🐿️': ['#c98a5b', 'squirrel'],
      '🦔': ['#b89678', 'hedgehog'],
    };
    if (faces[emoji]) {
      const [fill, animal] = faces[emoji];
      drawing = <g stroke="#76614e" strokeWidth="2" strokeLinejoin="round">
        {animal === 'sheep' ? <path d="M20 30 Q10 10 30 13 Q50 -1 67 14 Q93 10 83 35 Q104 53 85 69 Q89 89 66 87 Q48 101 32 85 Q6 86 16 62 Q0 41 20 30" fill={fill} /> :
          animal === 'duck' ? <path d="M38 26 Q34 12 44 19 Q50 3 56 22 L64 27" fill={fill} /> :
          animal === 'pig' ? <path d="M22 41 Q6 7 30 15 L41 31 M59 31 L70 15 Q94 7 78 41" fill="#E5A6A6" /> :
          animal === 'frog' ? <><circle cx="32" cy="29" r="16" fill={fill} /><circle cx="68" cy="29" r="16" fill={fill} /></> :
          animal === 'fox' ? <><polygon points="16,42 14,10 42,26" fill={fill} /><polygon points="84,42 86,10 58,26" fill={fill} /><polygon points="20,36 19,17 36,27" fill="#fff5e6" /><polygon points="80,36 81,17 64,27" fill="#fff5e6" /></> :
          animal === 'hippo' ? <><circle cx="24" cy="24" r="10" fill={fill} /><circle cx="76" cy="24" r="10" fill={fill} /><circle cx="24" cy="24" r="5" fill="#e5b8c8" /><circle cx="76" cy="24" r="5" fill="#e5b8c8" /></> :
          animal === 'squirrel' ? <><path d="M68 78 Q98 68 92 36 Q86 14 70 28 Q62 42 72 58" fill="#d99b6c" /><circle cx="24" cy="24" r="11" fill={fill} /><circle cx="76" cy="24" r="11" fill={fill} /></> :
          animal === 'hedgehog' ? <path d="M12 56 L8 38 L22 36 L20 20 L36 24 L44 10 L56 22 L68 10 L74 26 L88 22 L84 40 L94 52 Z" fill="#8d6a4f" /> :
          <><path d="M30 25 L27 9 L41 22 M59 22 L73 9 L70 25" fill="#E7C58D" /><ellipse cx="18" cy="32" rx="15" ry="9" fill={fill} /><ellipse cx="82" cy="32" rx="15" ry="9" fill={fill} /></>}
        <ellipse cx="50" cy="54" rx="34" ry="32" fill={fill} />
        {animal === 'fox' && <path d="M16 56 Q34 50 50 78 Q66 50 84 56 Q76 86 50 86 Q24 86 16 56 Z" fill="#fff8ee" />}
        {animal === 'cow' && <ellipse cx="30" cy="39" rx="12" ry="15" fill="#8c7968" />}
        <circle cx="36" cy="47" r="3" fill="#625043" /><circle cx="64" cy="47" r="3" fill="#625043" />
        <ellipse cx="26" cy="58" rx="5" ry="3" fill="#eaa49b" stroke="none" /><ellipse cx="74" cy="58" rx="5" ry="3" fill="#eaa49b" stroke="none" />
        {animal === 'pig' || animal === 'cow' || animal === 'hippo' ? <><ellipse cx="50" cy="62" rx={animal === 'hippo' ? 22 : 16} ry={animal === 'hippo' ? 14 : 11} fill={animal === 'hippo' ? '#cabfd8' : '#e99eaa'} /><circle cx="43" cy="62" r="2.2" fill="#6e5765" /><circle cx="57" cy="62" r="2.2" fill="#6e5765" /></> : animal === 'duck' ? <ellipse cx="50" cy="63" rx="19" ry="8" fill="#eaa65f" /> : <><circle cx="50" cy="58" r="4.5" fill="#514238" /><path d="M39 66 Q50 76 61 66" fill="none" /></>}
      </g>;
    } else if (['🐴', '🐐', '🐦', '🐓', '🦉', '🐒'].includes(emoji)) {
      const bird = ['🐦', '🐓', '🦉'].includes(emoji);
      const fill = emoji === '🐦' ? '#94BBC8' : emoji === '🐐' ? '#F3E8D1' : '#D6AE87';
      drawing = <g stroke="#80634F" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {bird ? <>
          <path d="M32 78 L29 93 M68 78 L71 93 M22 93 H36 M64 93 H78" fill="none" stroke="#D9A45E" strokeWidth="4" />
          <ellipse cx="50" cy="56" rx="32" ry="33" fill={fill} />
          <path d="M24 46 Q5 48 17 72 Q25 78 31 68 M76 46 Q95 48 83 72 Q75 78 69 68" fill={emoji === '🐦' ? '#77A6B8' : '#BC9069'} />
          {emoji === '🦉' && <><path d="M21 35 L17 10 L40 25 M60 25 L83 10 L79 35" fill={fill} /><circle cx="36" cy="43" r="17" fill="#FFF3D9" /><circle cx="64" cy="43" r="17" fill="#FFF3D9" /></>}
          {emoji === '🐓' && <path d="M35 25 Q24 9 37 11 Q43 -1 50 12 Q64 2 64 22" fill="#E79890" />}
          <circle cx="36" cy="43" r="4" fill="#625043" /><circle cx="64" cy="43" r="4" fill="#625043" />
          <path d="M43 55 L50 64 L57 55Z" fill="#F1C166" />
          {emoji === '🐓' && <path d="M49 63 Q62 71 52 77 Q40 75 49 63" fill="#E79890" />}
          <path d="M40 74 Q44 78 47 74 M53 74 Q57 78 60 74" fill="none" stroke="#FFF4D5" />
        </> : <>
          {emoji === '🐒' ? <><circle cx="16" cy="46" r="13" fill={fill} /><circle cx="84" cy="46" r="13" fill={fill} /></> : <>
            <ellipse cx="30" cy="22" rx="10" ry="18" fill={fill} transform="rotate(-22 30 22)" /><ellipse cx="70" cy="22" rx="10" ry="18" fill={fill} transform="rotate(22 70 22)" />
            {emoji === '🐐' && <path d="M36 28 Q22 1 36 9 L43 28 M57 28 L64 9 Q78 1 64 28" fill="#C5B18C" />}
          </>}
          <ellipse cx="50" cy="57" rx="32" ry="34" fill={fill} />
          {emoji === '🐴' && <path d="M36 27 Q39 7 60 20 L55 48 L45 34Z" fill="#926D54" />}
          {emoji === '🐒' && <path d="M24 48 Q20 25 37 29 Q48 28 50 40 Q53 26 66 29 Q83 32 76 51 L75 72 Q50 95 25 72Z" fill="#F6D9AB" />}
          <circle cx="37" cy="49" r="3.5" fill="#625043" /><circle cx="63" cy="49" r="3.5" fill="#625043" />
          <ellipse cx="50" cy="70" rx="22" ry="14" fill="#F3D3AA" />
          <circle cx="42" cy="65" r="2" fill="#87644E" /><circle cx="58" cy="65" r="2" fill="#87644E" />
          <path d="M40 73 Q50 81 60 73" fill="none" />
          {emoji === '🐐' && <path d="M43 82 L50 96 L57 82" fill="#F4EFE4" />}
        </>}
        <circle cx="37" cy={bird ? 42 : 48} r="1.2" fill="white" stroke="none" /><circle cx="64" cy={bird ? 42 : 48} r="1.2" fill="white" stroke="none" />
      </g>;
    } else if (emoji === '🚗') {
      drawing = <g stroke="#716151" strokeWidth="2.5" strokeLinejoin="round"><path d="M12 52 L23 30 Q27 24 36 24 H64 Q71 24 77 36 L85 52 Q94 52 94 63 V76 H6 V61 Q6 53 12 52Z" fill="#e98c7a" /><path d="M28 32 H46 V49 H20 Z M53 32 H65 L77 49 H53Z" fill="#c7e2df" /><circle cx="25" cy="76" r="12" fill="#6e8189" /><circle cx="75" cy="76" r="12" fill="#6e8189" /><circle cx="25" cy="76" r="5" fill="#fff5db" /><circle cx="75" cy="76" r="5" fill="#fff5db" /><path d="M43 61 H58" /></g>;
    } else if (['⭐','🌟','✨','💫','☀️','🌙','❤️','💖','💜','🔴','🔵','🟡','🟢','🟣','🟦','🟨','🟪','🔺','🔷','🔶','⬜','⬠','⬭','⬡','☁️','⚡'].includes(emoji)) {
      drawing = <g stroke="#8b7964" strokeOpacity=".35" strokeWidth="2.5" strokeLinejoin="round">
        {emoji === '☁️' ? <path d="M17 77 C-6 73 5 43 23 45 C19 17 60 10 67 37 C99 27 108 76 82 77Z" fill="#eef6fa" /> :
        emoji === '🌙' ? <path d="M66 9 A42 42 0 1 0 89 71 A36 36 0 0 1 66 9" fill="#f0cf76" /> :
        emoji === '⚡' ? <polygon points="56,6 22,54 48,54 40,94 78,44 52,44" fill="#facc15" /> :
        ['❤️','💖','💜'].includes(emoji) ? <path d="M50 86 C-8 48 9 2 36 19 Q46 23 50 34 Q57 8 79 17 C116 39 68 79 50 86" fill={emoji === '💜' ? '#b388eb' : '#df8b9e'} /> :
        emoji === '🔺' ? <path d="M50 10 L94 88 H6Z" fill="#e5aa72" /> :
        ['🟦','⬜','🟨','🟪'].includes(emoji) ? <rect x="13" y="13" width="74" height="74" rx="13" fill={emoji === '⬜' ? '#faf5e5' : emoji === '🟨' ? '#f5d76e' : emoji === '🟪' ? '#b39ddb' : '#8eb4d6'} /> :
        ['🔷','🔶'].includes(emoji) ? <path d="M50 6 L94 50 L50 94 L6 50Z" fill={emoji === '🔶' ? '#f5a65b' : '#a99acd'} /> :
        emoji === '⬠' ? <polygon points="50,8 92,38 76,88 24,88 8,38" fill="#81c784" /> :
        emoji === '⬡' ? <polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="#4dd0e1" /> :
        emoji === '⬭' ? <ellipse cx="50" cy="50" rx="42" ry="28" fill="#f48fb1" /> :
        ['⭐','🌟','✨','💫'].includes(emoji) ? <path d="M50 7 L63 34 L93 39 L71 61 L76 91 L50 76 L24 91 L29 61 L7 39 L37 34Z" fill="#f0ce70" /> :
        <circle cx="50" cy="50" r="40" fill={({'🔴':'#df897c','🔵':'#8eb4d6','🟢':'#8eb99d','🟣':'#b39ddb'} as Record<string,string>)[emoji] || '#efd27c'} />}
        <path d="M31 31 Q36 25 41 24" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".65" />
      </g>;
    } else if (['🍰','🧁','🎂'].includes(emoji)) {
      drawing = <g stroke="#997357" strokeWidth="2" strokeLinejoin="round"><path d="M17 52 H83 L75 90 H25Z" fill="#eeb4a0" /><path d="M31 59 L36 84 M50 59 V84 M69 59 L64 84" stroke="#d69082" /><path d="M16 53 Q7 34 26 31 Q22 15 41 18 Q54 3 65 21 Q87 18 84 37 Q99 49 84 56Z" fill="#fff1d7" /><circle cx="52" cy="17" r="9" fill="#e28382" /></g>;
    } else if (emoji === 'watermelon-whole') {
      drawing = <g stroke="#507d58" strokeWidth="3"><ellipse cx="50" cy="55" rx="42" ry="33" fill="#89b872" /><path d="M32 25 Q13 55 32 85 M45 23 Q33 55 45 87 M59 23 Q68 55 59 87 M72 28 Q91 55 72 82" fill="none" strokeWidth="6" /><path d="M50 22 Q45 10 55 9" fill="none" /><path d="M24 44 Q28 35 33 33" stroke="#fff4c5" strokeWidth="4" opacity=".65" strokeLinecap="round" /></g>;
    } else if (emoji === '🍋' || emoji === '🥝') {
      drawing = <g stroke="#9e9358" strokeWidth="2"><ellipse cx="50" cy="54" rx="39" ry="30" fill={emoji === '🍋' ? '#edcf6d' : '#b9cb82'} /><path d="M50 21 Q58 1 78 14 Q67 29 50 21" fill="#85ac77" />{emoji === '🥝' && <><ellipse cx="50" cy="54" rx="28" ry="24" fill="#c5da8e" /><ellipse cx="50" cy="54" rx="8" ry="14" fill="#fff0c6" />{[0,1,2,3,4,5,6,7].map(i=><circle key={i} cx={50+19*Math.cos(i*Math.PI/4)} cy={54+15*Math.sin(i*Math.PI/4)} r="2" fill="#74624c" />)}</>}</g>;
    } else if (['🐤', '🐥', '🐣'].includes(emoji)) {
      drawing = <g stroke="#9b7842" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M22 62 C18 44 34 40 46 46 C50 30 74 30 76 48 C88 47 92 64 82 76 C72 88 26 88 22 62 Z" fill="#f7d560" />
        <circle cx="56" cy="34" r="18" fill="#fae078" />
        <path d="M52 16 Q56 8 62 15 Q68 9 65 18" fill="none" stroke="#e5b93c" strokeWidth="3" />
        <circle cx="62" cy="31" r="3" fill="#4f3d2a" stroke="none" />
        <circle cx="63" cy="30" r="1" fill="#ffffff" stroke="none" />
        <ellipse cx="55" cy="37" rx="4" ry="2.5" fill="#f29b94" stroke="none" />
        <path d="M72 31 L86 35 L72 40 Z" fill="#f28f4b" />
        <path d="M36 58 Q48 53 56 63 Q44 72 36 58 Z" fill="#f0c243" />
      </g>;
    } else if (emoji === '🐬') {
      drawing = <g stroke="#3b6e8c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M16 68 Q22 30 58 24 Q54 12 68 14 Q65 23 72 28 Q92 38 86 54 Q74 52 66 56 Q44 66 28 84 L16 88 L22 74 Z" fill="#6ec1e4" />
        <path d="M28 66 Q48 48 76 50 Q62 62 34 76 Z" fill="#e6f7ff" stroke="none" />
        <circle cx="68" cy="38" r="3" fill="#2c4a5e" stroke="none" />
      </g>;
    } else if (emoji === '🐾') {
      drawing = <g fill="#c68b65" stroke="#7d5338" strokeWidth="2">
        <ellipse cx="36" cy="64" rx="14" ry="11" /><circle cx="20" cy="46" r="5.5" /><circle cx="31" cy="40" r="6" /><circle cx="43" cy="40" r="6" /><circle cx="52" cy="47" r="5.5" />
        <ellipse cx="70" cy="36" rx="10" ry="8" /><circle cx="59" cy="23" r="4" /><circle cx="67" cy="19" r="4.5" /><circle cx="76" cy="20" r="4.5" />
      </g>;
    } else if (emoji === '🫧') {
      drawing = <g stroke="#7db8d6" strokeWidth="2.2">
        <circle cx="42" cy="54" r="26" fill="#dff4ff" fillOpacity=".75" />
        <path d="M28 40 Q34 32 44 33" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="72" cy="30" r="14" fill="#eef9ff" fillOpacity=".8" />
        <path d="M65 23 Q69 19 74 20" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="68" cy="72" r="9" fill="#e5f6ff" fillOpacity=".85" />
      </g>;
    } else if (emoji === '🧼') {
      drawing = <g stroke="#9b7286" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="16" y="30" width="68" height="44" rx="20" fill="#f4b8d0" />
        <rect x="24" y="37" width="52" height="30" rx="14" fill="#fad2e2" />
        <circle cx="24" cy="24" r="8" fill="#eef9ff" stroke="#8abdd9" strokeWidth="2" />
        <circle cx="38" cy="20" r="6" fill="#eef9ff" stroke="#8abdd9" strokeWidth="2" />
        <circle cx="76" cy="26" r="9" fill="#eef9ff" stroke="#8abdd9" strokeWidth="2" />
      </g>;
    } else if (emoji === '🚿') {
      drawing = <g stroke="#648396" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 18 H48 Q64 18 64 34 V38" fill="none" strokeWidth="6" />
        <path d="M44 38 H84 L76 52 H52 Z" fill="#b8d4e3" />
        <path d="M50 60 L44 76 M60 60 L58 80 M70 60 L72 80 M78 60 L84 76" stroke="#56b4e9" strokeWidth="3.5" strokeDasharray="4 5" />
      </g>;
    } else if (emoji === '🎈') {
      drawing = <g stroke="#9c5b6b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M50 86 Q44 94 53 97" fill="none" stroke="#9e8c7a" />
        <polygon points="45,78 55,78 50,71" fill="#e87a90" />
        <ellipse cx="50" cy="43" rx="28" ry="32" fill="#f2849e" />
        <path d="M35 26 Q40 18 48 18" fill="none" stroke="#ffffff" strokeWidth="4" opacity=".7" />
      </g>;
    } else if (emoji === '🍭' || emoji === '🍬') {
      drawing = emoji === '🍭' ? <g stroke="#8e6c5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 56 V92" stroke="#d8cbb8" strokeWidth="5" />
        <circle cx="50" cy="36" r="26" fill="#f7a8b8" />
        <path d="M50 36 m0 -18 a18 18 0 1 1 -13 30 a11 11 0 1 0 19 -12" fill="none" stroke="#fff3d6" strokeWidth="5" />
      </g> : <g stroke="#9a5b72" strokeWidth="2.5" strokeLinejoin="round">
        <polygon points="10,34 28,46 28,58 10,70" fill="#f9a8d4" />
        <polygon points="90,34 72,46 72,58 90,70" fill="#f9a8d4" />
        <ellipse cx="50" cy="52" rx="26" ry="20" fill="#f472b6" />
        <path d="M38 35 L46 69 M54 35 L62 69" stroke="#fef08a" strokeWidth="5" />
      </g>;
    } else if (emoji === '🌈') {
      drawing = <g fill="none" strokeLinecap="round" strokeWidth="6">
        <path d="M14 74 A36 36 0 0 1 86 74" stroke="#f28b82" />
        <path d="M21 74 A29 29 0 0 1 79 74" stroke="#fbbc04" />
        <path d="M28 74 A22 22 0 0 1 72 74" stroke="#81c995" />
        <path d="M35 74 A15 15 0 0 1 65 74" stroke="#78d9ec" />
      </g>;
    } else if (['🌸', '🌻', '🍀', '🌱', '🌳'].includes(emoji)) {
      drawing = emoji === '🌳' ? <g stroke="#5e7650" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M42 54 L38 90 H62 L58 54 Z" fill="#a87c56" stroke="#78563a" />
        <circle cx="50" cy="34" r="24" fill="#81b978" /><circle cx="30" cy="48" r="18" fill="#8cc483" /><circle cx="70" cy="48" r="18" fill="#77ae6e" />
        <circle cx="38" cy="32" r="4" fill="#ef7169" stroke="none" /><circle cx="64" cy="40" r="4" fill="#ef7169" stroke="none" />
      </g> : emoji === '🌱' ? <g stroke="#558046" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="50" cy="84" rx="26" ry="8" fill="#b88b64" stroke="#876345" />
        <path d="M50 82 V40" fill="none" strokeWidth="5" />
        <path d="M50 48 Q22 44 24 22 Q48 22 50 48 Z" fill="#93cf7a" />
        <path d="M50 40 Q78 36 76 14 Q52 14 50 40 Z" fill="#a7df8e" />
      </g> : emoji === '🍀' ? <g stroke="#4c7c44" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M50 52 Q56 76 66 90" fill="none" strokeWidth="4" strokeLinecap="round" />
        {[0, 90, 180, 270].map(a => <path key={a} d="M50 50 C34 26 20 14 38 10 C48 8 50 20 50 20 C50 20 52 8 62 10 C80 14 66 26 50 50 Z" fill="#7bc66a" transform={`rotate(${a} 50 50)`} />)}
      </g> : <g stroke={emoji === '🌻' ? '#9e7232' : '#b86b82'} strokeWidth="2.5" strokeLinejoin="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <ellipse key={a} cx="50" cy="22" rx="11" ry="16" fill={emoji === '🌻' ? '#facc15' : '#f9a8d4'} transform={`rotate(${a} 50 50)`} />)}
        <circle cx="50" cy="50" r="16" fill={emoji === '🌻' ? '#784c27' : '#fde047'} />
      </g>;
    } else if (emoji === '☔') {
      drawing = <g stroke="#6c5880" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M50 54 V78 Q50 88 40 88 Q32 88 32 80" fill="none" stroke="#8d6e63" strokeWidth="4.5" />
        <path d="M12 56 A38 36 0 0 1 88 56 Q70 48 50 56 Q30 48 12 56 Z" fill="#a78bfa" />
        <path d="M26 20 L22 30 M74 20 L70 30 M50 10 V18" stroke="#60a5fa" strokeWidth="3.5" />
      </g>;
    } else if (['🍪', '🍩', '🍦', '🥛', '🧀', '🍞', '🍯', '🍳', '🍲', '🍽️'].includes(emoji)) {
      drawing = emoji === '🍪' ? <g stroke="#8a5a36" strokeWidth="2.5"><circle cx="50" cy="50" r="36" fill="#d99b66" /><circle cx="36" cy="36" r="4.5" fill="#5c3a21" /><circle cx="62" cy="34" r="4" fill="#5c3a21" /><circle cx="48" cy="54" r="5" fill="#5c3a21" /><circle cx="33" cy="62" r="4" fill="#5c3a21" /><circle cx="65" cy="58" r="4.5" fill="#5c3a21" /></g> :
      emoji === '🍩' ? <g stroke="#8d5846" strokeWidth="2.5"><circle cx="50" cy="50" r="36" fill="#e6b17e" /><path d="M20 44 A32 32 0 1 1 80 44 Q82 58 72 56 Q64 66 52 58 Q40 68 30 56 Q18 58 20 44 Z" fill="#f472b6" /><circle cx="50" cy="50" r="12" fill="#fffaf0" /><path d="M36 30 L42 32 M60 28 L65 33 M32 46 L38 44 M64 46 L70 43" stroke="#fde047" strokeWidth="3" strokeLinecap="round" /></g> :
      emoji === '🍦' ? <g stroke="#9c6f44" strokeWidth="2.5" strokeLinejoin="round"><polygon points="30,52 70,52 50,92" fill="#e6b47c" /><path d="M24 52 Q20 34 36 32 Q38 14 50 14 Q62 14 64 32 Q80 34 76 52 Z" fill="#fff3e6" /><circle cx="50" cy="12" r="6" fill="#ef4444" /></g> :
      emoji === '🥛' ? <g stroke="#648296" strokeWidth="2.5" strokeLinejoin="round"><path d="M28 20 H72 L66 86 H34 Z" fill="#ffffff" /><path d="M31 42 H69 L66 84 H34 Z" fill="#e0f2fe" /><path d="M56 10 L48 40" stroke="#f472b6" strokeWidth="4" strokeLinecap="round" /></g> :
      emoji === '🧀' ? <g stroke="#b47d2a" strokeWidth="2.5" strokeLinejoin="round"><polygon points="14,44 64,20 86,44" fill="#fde047" /><rect x="14" y="44" width="72" height="36" rx="4" fill="#facc15" /><circle cx="34" cy="60" r="6" fill="#eab308" /><circle cx="62" cy="56" r="5" fill="#eab308" /><circle cx="50" cy="70" r="4" fill="#eab308" /></g> :
      emoji === '🍞' ? <g stroke="#96613b" strokeWidth="3" strokeLinejoin="round"><path d="M22 44 C12 40 14 20 34 20 H66 C86 20 88 40 78 44 V82 H22 Z" fill="#d99156" /><path d="M28 45 C20 42 22 26 36 26 H64 C78 26 80 42 72 45 V76 H28 Z" fill="#fdecc8" /></g> :
      emoji === '🍯' ? <g stroke="#8c5a2b" strokeWidth="2.5" strokeLinejoin="round"><path d="M26 36 H74 Q84 58 70 86 H30 Q16 58 26 36 Z" fill="#f59e0b" /><rect x="24" y="24" width="52" height="12" rx="6" fill="#fcd34d" /><path d="M28 36 Q36 52 44 38 Q52 54 60 38 Q68 48 72 36" fill="#fef08a" /></g> :
      emoji === '🍳' ? <g stroke="#52525b" strokeWidth="3" strokeLinejoin="round"><line x1="74" y1="74" x2="94" y2="92" strokeWidth="7" strokeLinecap="round" /><circle cx="46" cy="48" r="34" fill="#3f3f46" /><path d="M26 44 Q30 24 50 28 Q70 26 68 48 Q72 68 48 66 Q24 68 26 44 Z" fill="#ffffff" stroke="none" /><circle cx="48" cy="48" r="11" fill="#facc15" stroke="#eab308" strokeWidth="2" /></g> :
      emoji === '🍽️' ? <g stroke="#7b8794" strokeWidth="2.5" strokeLinecap="round"><circle cx="50" cy="52" r="28" fill="#f8fafc" /><circle cx="50" cy="52" r="18" fill="#e2e8f0" /><path d="M14 26 V78 M10 26 V42 M18 26 V42 M86 26 V78 M82 26 Q90 26 90 42 L86 46" fill="none" /></g> :
      <g stroke="#7c5844" strokeWidth="2.5" strokeLinejoin="round"><path d="M10 48 H90 M20 44 H80 L74 82 H26 Z" fill="#ea580c" /><ellipse cx="50" cy="44" rx="30" ry="9" fill="#fde047" /><path d="M38 26 Q34 18 40 12 M52 24 Q48 16 54 10 M64 26 Q60 18 66 12" fill="none" stroke="#94a3b8" strokeLinecap="round" /></g>;
    } else if (['👑', '🎁', '🎀', '🦷', '⚽', '⚾', '🎒', '🧢', '👓', '✏️', '📚', '🔑', '🎹', '📻', '🎵', '🗺️', '🗑️', '🏫', '🏥', '🏰', '🛝'].includes(emoji)) {
      drawing = emoji === '👑' ? <g stroke="#a16207" strokeWidth="2.5" strokeLinejoin="round"><polygon points="14,76 18,30 38,52 50,22 62,52 82,30 86,76" fill="#facc15" /><circle cx="50" cy="58" r="5" fill="#ef4444" /><circle cx="30" cy="60" r="4" fill="#3b82f6" /><circle cx="70" cy="60" r="4" fill="#3b82f6" /></g> :
      emoji === '🎁' ? <g stroke="#9d174d" strokeWidth="2.5" strokeLinejoin="round"><rect x="20" y="38" width="60" height="48" rx="6" fill="#f472b6" /><rect x="16" y="28" width="68" height="14" rx="4" fill="#ec4899" /><rect x="44" y="28" width="12" height="58" fill="#fde047" /><path d="M50 28 C30 10 24 28 50 28 C76 28 70 10 50 28" fill="#fde047" /></g> :
      emoji === '🎀' ? <g stroke="#9d174d" strokeWidth="2.5" strokeLinejoin="round"><path d="M50 48 L18 26 V70 Z M50 48 L82 26 V70 Z" fill="#f472b6" /><path d="M44 54 L32 86 M56 54 L68 86" strokeWidth="6" stroke="#ec4899" strokeLinecap="round" /><circle cx="50" cy="48" r="9" fill="#fbcfe8" /></g> :
      emoji === '🦷' ? <g stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round"><path d="M24 32 C24 16 42 16 50 24 C58 16 76 16 76 32 C76 54 68 64 64 84 C60 88 54 66 50 66 C46 66 40 88 36 84 C32 64 24 54 24 32 Z" fill="#ffffff" /><circle cx="40" cy="40" r="2.5" fill="#475569" /><circle cx="60" cy="40" r="2.5" fill="#475569" /><path d="M43 49 Q50 55 57 49" fill="none" strokeLinecap="round" /></g> :
      emoji === '⚽' || emoji === '⚾' ? <g stroke="#475569" strokeWidth="2.5"><circle cx="50" cy="50" r="36" fill="#ffffff" />{emoji === '⚽' ? <><polygon points="50,36 63,45 58,60 42,60 37,45" fill="#334155" /><path d="M50 36 V14 M63 45 L84 38 M58 60 L72 78 M42 60 L28 78 M37 45 L16 38" /></> : <path d="M28 22 Q44 50 28 78 M72 22 Q56 50 72 78" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="4 4" />}</g> :
      emoji === '🎒' ? <g stroke="#881337" strokeWidth="2.5" strokeLinejoin="round"><path d="M38 14 Q50 6 62 14" fill="none" strokeWidth="4" /><rect x="22" y="20" width="56" height="66" rx="22" fill="#f43f5e" /><rect x="30" y="48" width="40" height="30" rx="10" fill="#fbbf24" /><path d="M22 38 H78" /></g> :
      emoji === '🧢' ? <g stroke="#1e40af" strokeWidth="2.5" strokeLinejoin="round"><path d="M18 58 C18 26 74 26 74 58 Z" fill="#60a5fa" /><path d="M54 50 L92 58 Q74 68 46 58 Z" fill="#3b82f6" /><circle cx="46" cy="28" r="4" fill="#1d4ed8" /></g> :
      emoji === '👓' ? <g stroke="#475569" strokeWidth="3.5" fill="#e0f2fe"><circle cx="30" cy="54" r="16" /><circle cx="70" cy="54" r="16" /><path d="M46 54 Q50 48 54 54 M14 52 L24 32 M86 52 L76 32" fill="none" strokeLinecap="round" /></g> :
      emoji === '✏️' ? <g stroke="#78350f" strokeWidth="2.5" strokeLinejoin="round"><polygon points="24,64 68,20 80,32 36,76" fill="#facc15" /><polygon points="24,64 36,76 16,84" fill="#fde68a" /><polygon points="16,84 22,81 19,78" fill="#334155" /><polygon points="68,20 76,12 88,24 80,32" fill="#f472b6" /></g> :
      emoji === '📚' ? <g stroke="#475569" strokeWidth="2.5" strokeLinejoin="round"><rect x="18" y="62" width="64" height="16" rx="4" fill="#60a5fa" /><rect x="22" y="44" width="60" height="16" rx="4" fill="#f472b6" /><rect x="16" y="26" width="64" height="16" rx="4" fill="#4ade80" /></g> :
      emoji === '🔑' ? <g stroke="#a16207" strokeWidth="3" strokeLinejoin="round"><circle cx="34" cy="50" r="18" fill="#facc15" /><circle cx="34" cy="50" r="7" fill="#fffaf0" /><path d="M52 50 H86 V64 M72 50 V62" fill="none" strokeWidth="6" strokeLinecap="round" /></g> :
      emoji === '🎹' ? <g stroke="#334155" strokeWidth="2.5" strokeLinejoin="round"><rect x="14" y="24" width="72" height="52" rx="6" fill="#ffffff" /><line x1="32" y1="24" x2="32" y2="76" /><line x1="50" y1="24" x2="50" y2="76" /><line x1="68" y1="24" x2="68" y2="76" /><rect x="26" y="24" width="10" height="32" fill="#1e293b" /><rect x="45" y="24" width="10" height="32" fill="#1e293b" /><rect x="63" y="24" width="10" height="32" fill="#1e293b" /></g> :
      emoji === '📻' ? <g stroke="#57534e" strokeWidth="2.5" strokeLinejoin="round"><line x1="28" y1="34" x2="68" y2="14" strokeWidth="3" strokeLinecap="round" /><rect x="16" y="34" width="68" height="48" rx="10" fill="#f59e0b" /><circle cx="38" cy="58" r="14" fill="#fde68a" /><circle cx="68" cy="50" r="5" fill="#78350f" /><circle cx="68" cy="66" r="5" fill="#78350f" /></g> :
      emoji === '🎵' ? <g stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M36 68 V26 L74 18 V60" fill="none" strokeWidth="5" /><circle cx="28" cy="68" r="10" fill="#a78bfa" /><circle cx="66" cy="60" r="10" fill="#a78bfa" /></g> :
      emoji === '🗺️' ? <g stroke="#854d0e" strokeWidth="2.5" strokeLinejoin="round"><polygon points="14,24 38,18 62,26 86,18 86,76 62,84 38,76 14,84" fill="#fef08a" /><path d="M26 62 Q44 36 68 52" fill="none" stroke="#ea580c" strokeWidth="3" strokeDasharray="4 4" /><path d="M64 46 L74 56 M74 46 L64 56" stroke="#dc2626" strokeWidth="3" /></g> :
      emoji === '🗑️' ? <g stroke="#475569" strokeWidth="2.5" strokeLinejoin="round"><path d="M24 30 H76 L70 86 H30 Z" fill="#cbd5e1" /><rect x="20" y="22" width="60" height="8" rx="4" fill="#94a3b8" /><path d="M38 42 V74 M50 42 V74 M62 42 V74" /></g> :
      emoji === '🛝' ? <g stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 82 V24 H38 V82 M22 42 H38 M22 60 H38" /><path d="M38 26 Q62 26 68 54 Q74 80 88 80" fill="none" stroke="#f472b6" strokeWidth="9" /></g> :
      <g stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="18" y="36" width="64" height="50" rx="4" fill={emoji === '🏥' ? '#f8fafc' : emoji === '🏰' ? '#e9d5ff' : '#fde68a'} />
        <polygon points="12,36 50,14 88,36" fill={emoji === '🏥' ? '#93c5fd' : emoji === '🏰' ? '#c084fc' : '#f87171'} />
        <rect x="42" y="62" width="16" height="24" fill="#94a3b8" />
        {emoji === '🏥' && <path d="M50 22 V34 M44 28 H56" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />}
      </g>;
    } else if (['👶', '👩', '🧑‍⚕️', '🧑‍🏫'].includes(emoji)) {
      drawing = <g stroke="#725446" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {emoji !== '👶' && <path d="M18 52 C18 16 82 16 82 52 Z" fill={emoji === '👩' ? '#6d4c41' : '#4a3728'} />}
        <circle cx="50" cy="54" r="30" fill="#f5d0b5" />
        {emoji === '👶' && <path d="M48 24 Q56 14 58 24 Q52 30 46 28" fill="none" stroke="#78553a" strokeWidth="3.5" />}
        {emoji === '🧑‍⚕️' && <><rect x="32" y="14" width="36" height="14" rx="4" fill="#ffffff" /><path d="M50 17 V25 M46 21 H54" stroke="#ef4444" strokeWidth="3" /></>}
        {emoji === '🧑‍🏫' && <><circle cx="38" cy="50" r="8" fill="none" /><circle cx="62" cy="50" r="8" fill="none" /><line x1="46" y1="50" x2="54" y2="50" /></>}
        <circle cx="38" cy="50" r="3" fill="#513b2c" /><circle cx="62" cy="50" r="3" fill="#513b2c" />
        <ellipse cx="30" cy="58" rx="5" ry="3" fill="#f4a29e" stroke="none" /><ellipse cx="70" cy="58" rx="5" ry="3" fill="#f4a29e" stroke="none" />
        <path d="M42 64 Q50 72 58 64" fill="none" />
      </g>;
    } else {
      // Retain exact meaning for the less common older-age vocabulary.
      return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label || undefined} className={`toy-art toy-art-fallback ${className}`}>{emoji}</span>;
    }
  }
  return <svg viewBox={viewBox} role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label || undefined} className={`toy-art ${className}`} focusable="false">{drawing}</svg>;
}

export function BasketArtwork({ color }: { color: string }) {
  return <svg viewBox="0 0 100 90" className="basket-art" aria-hidden="true"><path d="M24 40 C24 2 76 2 76 40" fill="none" stroke={color} strokeWidth="7" /><path d="M12 38 H88 L79 82 H21Z" fill={color} stroke="#9b8068" strokeOpacity=".4" strokeWidth="2" /><path d="M17 50 H85 M19 63 H82 M22 76 H79 M30 39 L34 81 M48 39 V81 M66 39 L62 81 M80 39 L73 81" stroke="#fff6dc" strokeOpacity=".55" strokeWidth="3" /><rect x="9" y="34" width="82" height="11" rx="5" fill={color} stroke="#fff1d4" strokeWidth="3" /></svg>;
}

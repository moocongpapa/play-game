import React, { useId } from 'react';
import { templates, type Template } from '../sketch/art';
import { templateBounds } from '../sketch/template-bounds';

const aliases: Record<string, string> = { '🧸': 'bear', '🦖': 'dinosaur', '🍏': 'apple', '🚗': 'car' };
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
  '😳': 'shy', '😴': 'tired', '😆': 'excited', '😍': 'love',
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
  } else if (mood) {
    drawing = <g stroke="#725446" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22" cy="23" r="13" fill="#d6a380" /><circle cx="78" cy="23" r="13" fill="#d6a380" />
      <circle cx="50" cy="52" r="37" fill={mood === 'angry' ? '#efb19c' : '#f1caa3'} />
      <ellipse cx="27" cy="62" rx="7" ry="4" fill="#e99f9b" stroke="none" /><ellipse cx="73" cy="62" rx="7" ry="4" fill="#e99f9b" stroke="none" />
      {mood === 'tired' || mood === 'excited' ? <path d="M29 48 Q35 54 41 48 M59 48 Q65 54 71 48" fill="none" /> :
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
    const faces: Record<string, [string, string]> = { '🐷': ['#edb5b6', 'pig'], '🐑': ['#fff7e8', 'sheep'], '🦆': ['#f0cd79', 'duck'], '🐸': ['#a4c890', 'frog'], '🐮': ['#f9f1e0', 'cow'], '🐄': ['#f9f1e0', 'cow'] };
    if (faces[emoji]) {
      const [fill, animal] = faces[emoji];
      drawing = <g stroke="#76614e" strokeWidth="2" strokeLinejoin="round">
        {animal === 'sheep' ? <path d="M20 30 Q10 10 30 13 Q50 -1 67 14 Q93 10 83 35 Q104 53 85 69 Q89 89 66 87 Q48 101 32 85 Q6 86 16 62 Q0 41 20 30" fill={fill} /> :
          animal === 'duck' ? <path d="M38 26 Q34 12 44 19 Q50 3 56 22 L64 27" fill={fill} /> :
          animal === 'pig' ? <path d="M22 41 Q6 7 30 15 L41 31 M59 31 L70 15 Q94 7 78 41" fill="#E5A6A6" /> :
          animal === 'frog' ? <><circle cx="32" cy="29" r="16" fill={fill} /><circle cx="68" cy="29" r="16" fill={fill} /></> :
          <><path d="M30 25 L27 9 L41 22 M59 22 L73 9 L70 25" fill="#E7C58D" /><ellipse cx="18" cy="32" rx="15" ry="9" fill={fill} /><ellipse cx="82" cy="32" rx="15" ry="9" fill={fill} /></>}
        <ellipse cx="50" cy="54" rx="34" ry="32" fill={fill} />
        {animal === 'cow' && <ellipse cx="30" cy="39" rx="12" ry="15" fill="#8c7968" />}
        <circle cx="36" cy="47" r="3" fill="#625043" /><circle cx="64" cy="47" r="3" fill="#625043" />
        <ellipse cx="26" cy="58" rx="5" ry="3" fill="#eaa49b" stroke="none" /><ellipse cx="74" cy="58" rx="5" ry="3" fill="#eaa49b" stroke="none" />
        {animal === 'pig' || animal === 'cow' ? <><ellipse cx="50" cy="62" rx="16" ry="11" fill="#e99eaa" /><circle cx="44" cy="62" r="2" fill="#9e6765" /><circle cx="56" cy="62" r="2" fill="#9e6765" /></> : animal === 'duck' ? <ellipse cx="50" cy="63" rx="19" ry="8" fill="#eaa65f" /> : <path d="M37 63 Q50 77 63 63" fill="none" />}
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
    } else if (['⭐','🌟','☀️','🌙','❤️','💖','🔴','🔵','🟡','🟢','🟦','🔺','🔷','⬜','☁️'].includes(emoji)) {
      drawing = <g stroke="#8b7964" strokeOpacity=".35" strokeWidth="2.5" strokeLinejoin="round">
        {emoji === '☁️' ? <path d="M17 77 C-6 73 5 43 23 45 C19 17 60 10 67 37 C99 27 108 76 82 77Z" fill="#eef6fa" /> :
        emoji === '🌙' ? <path d="M66 9 A42 42 0 1 0 89 71 A36 36 0 0 1 66 9" fill="#f0cf76" /> :
        ['❤️','💖'].includes(emoji) ? <path d="M50 86 C-8 48 9 2 36 19 Q46 23 50 34 Q57 8 79 17 C116 39 68 79 50 86" fill="#df8b9e" /> :
        emoji === '🔺' ? <path d="M50 10 L94 88 H6Z" fill="#e5aa72" /> :
        emoji === '🟦' || emoji === '⬜' ? <rect x="13" y="13" width="74" height="74" rx="13" fill={emoji === '⬜' ? '#faf5e5' : '#8eb4d6'} /> :
        emoji === '🔷' ? <path d="M50 6 L94 50 L50 94 L6 50Z" fill="#a99acd" /> :
        ['⭐','🌟'].includes(emoji) ? <path d="M50 7 L63 34 L93 39 L71 61 L76 91 L50 76 L24 91 L29 61 L7 39 L37 34Z" fill="#f0ce70" /> :
        <circle cx="50" cy="50" r="40" fill={({'🔴':'#df897c','🔵':'#8eb4d6','🟢':'#8eb99d'} as Record<string,string>)[emoji] || '#efd27c'} />}
        <path d="M31 31 Q36 25 41 24" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".65" />
      </g>;
    } else if (['🍰','🧁','🎂'].includes(emoji)) {
      drawing = <g stroke="#997357" strokeWidth="2" strokeLinejoin="round"><path d="M17 52 H83 L75 90 H25Z" fill="#eeb4a0" /><path d="M31 59 L36 84 M50 59 V84 M69 59 L64 84" stroke="#d69082" /><path d="M16 53 Q7 34 26 31 Q22 15 41 18 Q54 3 65 21 Q87 18 84 37 Q99 49 84 56Z" fill="#fff1d7" /><circle cx="52" cy="17" r="9" fill="#e28382" /></g>;
    } else if (emoji === 'watermelon-whole') {
      drawing = <g stroke="#507d58" strokeWidth="3"><ellipse cx="50" cy="55" rx="42" ry="33" fill="#89b872" /><path d="M32 25 Q13 55 32 85 M45 23 Q33 55 45 87 M59 23 Q68 55 59 87 M72 28 Q91 55 72 82" fill="none" strokeWidth="6" /><path d="M50 22 Q45 10 55 9" fill="none" /><path d="M24 44 Q28 35 33 33" stroke="#fff4c5" strokeWidth="4" opacity=".65" strokeLinecap="round" /></g>;
    } else if (emoji === '🍋' || emoji === '🥝') {
      drawing = <g stroke="#9e9358" strokeWidth="2"><ellipse cx="50" cy="54" rx="39" ry="30" fill={emoji === '🍋' ? '#edcf6d' : '#b9cb82'} /><path d="M50 21 Q58 1 78 14 Q67 29 50 21" fill="#85ac77" />{emoji === '🥝' && <><ellipse cx="50" cy="54" rx="28" ry="24" fill="#c5da8e" /><ellipse cx="50" cy="54" rx="8" ry="14" fill="#fff0c6" />{[0,1,2,3,4,5,6,7].map(i=><circle key={i} cx={50+19*Math.cos(i*Math.PI/4)} cy={54+15*Math.sin(i*Math.PI/4)} r="2" fill="#74624c" />)}</>}</g>;
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

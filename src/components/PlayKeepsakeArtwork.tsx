import { useId } from 'react';
import type { PaintedRide, PlayCake } from '../utils/playMemory';
import { ToyArtwork } from './ToyArtwork';

export function CakeKeepsake({ cake }: { cake: PlayCake }) {
  const gradient = `cake-keepsake-${useId().replace(/:/g, '')}`;
  const palette = cake.colors.length ? cake.colors : ['#f4abc3', '#ffe4b5', '#f9bfd5'];
  const donut = cake.title.includes('도넛');
  return <svg viewBox="0 0 240 210" role="img" aria-label={`내가 꾸민 ${cake.title}`} className="cake-keepsake">
    <defs><linearGradient id={gradient} x2="0" y2="1"><stop stopColor="#fffdf6"/><stop offset="1" stopColor="#e6cdad"/></linearGradient></defs>
    <ellipse cx="120" cy="184" rx="104" ry="16" fill={`url(#${gradient})`} stroke="#cfb993" strokeWidth="3"/>
    {donut ? <g><ellipse cx="120" cy="127" rx="88" ry="57" fill="#dcaa76" stroke="#b98964" strokeWidth="3"/>
      <ellipse cx="120" cy="113" rx="87" ry="51" fill={palette[0]} stroke="#b98964" strokeWidth="3"/>
      <ellipse cx="120" cy="111" rx="24" ry="17" fill="#fff5df" stroke="#b98964" strokeWidth="3"/>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <path key={i} d={`M${54 + (i * 37) % 130} ${90 + (i * 19) % 48} l8 5`} stroke={palette[(i + 1) % palette.length]} strokeWidth="5" strokeLinecap="round"/>)}</g>
    : [0, 1, 2].map((i) => <g key={i}><rect x={38 + i * 13} y={132 - i * 32} width={164 - i * 26} height="42" rx="16" fill={palette[i % palette.length]} stroke="#ac826d" strokeWidth="2.5"/>
      <path d={`M${45 + i * 13} ${141 - i * 32} Q${62 + i * 13} ${132 - i * 32} ${79 + i * 13} ${141 - i * 32} T${184 - i * 13} ${141 - i * 32}`} fill="none" stroke="#fff7e6" strokeWidth="7" strokeLinecap="round"/></g>)}
    <path d="M120 62 V37" stroke="#fff4c9" strokeWidth="9" strokeLinecap="round"/><path d="M120 34 Q105 20 120 10 Q134 24 120 34" fill="#ffc858"/>
    {cake.toppings.slice(0, 5).map((emoji, i) => <foreignObject key={i} x={55 + i * 28} y={47 + (i % 2) * 44} width="32" height="36"><ToyArtwork emoji={emoji}/></foreignObject>)}
    <path d="M66 165 Q118 177 174 163" stroke="#fff7e6" strokeWidth="3" fill="none" opacity=".7"/>
  </svg>;
}

export function RideKeepsake({ ride }: { ride: PaintedRide }) {
  const [main = '#eab1c4', accent = '#a9d7de', detail = '#f5d78b'] = ride.colors;
  return <svg viewBox="0 0 240 180" role="img" aria-label={`내가 색칠한 ${ride.kind === 'rocket' ? '로켓' : ride.kind === 'boat' ? '배' : '자동차'}`} className="ride-keepsake">
    <ellipse cx="120" cy="157" rx="91" ry="10" fill="#69835c25"/>
    {ride.kind === 'rocket' ? <g><path d="M96 118 L71 146 V109 L98 89 M144 118 L169 146 V109 L142 89" fill={accent} stroke="#7c8d91" strokeWidth="3"/>
      <path d="M96 125 V66 Q96 31 120 14 Q144 31 144 66 V125Z" fill={main} stroke="#9b8993" strokeWidth="3"/><path d="M98 49 Q120 28 142 49" fill={detail}/><circle cx="120" cy="78" r="17" fill="#dcf3f3" stroke={accent} strokeWidth="7"/>
      <path d="M107 127 Q101 155 120 164 Q139 148 133 127" fill={detail}/><path d="M117 130 V149" stroke="#fff8e6" strokeWidth="6" strokeLinecap="round"/></g>
    : ride.kind === 'boat' ? <g><path d="M30 112 H210 L179 153 H65Z" fill={main} stroke="#9b8993" strokeWidth="3"/><path d="M120 107 V21 L176 92 H120 M112 91 H61 L112 32Z" fill={accent} stroke="#7c8d91" strokeWidth="3"/><path d="M121 21 V107" stroke="#bc9973" strokeWidth="6"/><circle cx="95" cy="132" r="7" fill={detail}/><circle cx="143" cy="132" r="7" fill={detail}/></g>
    : <g><path d="M28 115 Q26 91 61 89 L85 53 Q94 43 119 43 H145 Q161 43 174 86 Q209 88 214 112 V136 H28Z" fill={main} stroke="#9b8993" strokeWidth="3"/><path d="M75 85 L94 56 H116 V85Z M128 56 H145 Q154 57 163 85 H128Z" fill={accent} stroke="#fff7e3" strokeWidth="4"/>
      <circle cx="69" cy="139" r="22" fill="#777e85"/><circle cx="174" cy="139" r="22" fill="#777e85"/><circle cx="69" cy="139" r="11" fill={detail}/><circle cx="174" cy="139" r="11" fill={detail}/><path d="M42 111 H56 M187 110 H200" stroke="#fff4ce" strokeWidth="7" strokeLinecap="round"/></g>}
  </svg>;
}

import { useId } from 'react';
import type { CharacterId } from '../types';
import { CharacterArtwork } from './CharacterArtwork';
import { CreatureArtwork } from './habitat/CreatureArtwork';

export type PlayNavKind = 'drawing' | 'bugs' | 'aquarium' | 'park' | 'greeting';

/** Small, still toy scenes share the artwork used inside each playground. */
export function PlayNavArtwork({ kind, buddy }: { kind: PlayNavKind; buddy: CharacterId }) {
  const paint = `palette-${useId().replace(/:/g, '')}`;
  if (kind === 'bugs' || kind === 'aquarium') return <span className={`nav-toy nav-toy-${kind}`}><CreatureArtwork id={kind === 'bugs' ? 'ladybug' : 'clownfish'} happy /></span>;
  if (kind === 'park') return <span className="nav-toy nav-toy-park"><span><CharacterArtwork id={buddy} /></span><span><CharacterArtwork id={buddy === 'jelly' ? 'pingu' : 'jelly'} /></span><i /></span>;
  if (kind === 'greeting') return <span className={`nav-toy nav-toy-greeting nav-wave-${buddy}`}><CharacterArtwork id={buddy} /><svg className="nav-wave-lines" viewBox="0 0 64 64"><path d="M51 12l4-5M55 19l6-1M46 8V3" fill="none" stroke="#ac8754" strokeWidth="3" strokeLinecap="round" /></svg></span>;
  return <svg className="nav-toy nav-toy-drawing" viewBox="0 0 72 72" aria-hidden="true">
    <defs><linearGradient id={paint} x2=".8" y2="1"><stop stopColor="#ffeed5" /><stop offset="1" stopColor="#dbaa7f" /></linearGradient></defs>
    <path d="M58 27C54 7 22 8 11 27C-1 48 17 65 33 62C48 59 30 47 41 42C50 39 62 43 58 27Z" fill={`url(#${paint})`} stroke="#b98966" strokeWidth="2" />
    <path d="M15 30Q22 15 38 16" fill="none" stroke="#fff7e4" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="23" cy="44" rx="6" ry="7" fill="#f3d9ce" stroke="#c29979" strokeWidth="2" />
    <g stroke="#fff5e3" strokeWidth="2"><circle cx="21" cy="28" r="6" fill="#e28f9c" /><circle cx="36" cy="23" r="6" fill="#deb853" /><circle cx="49" cy="30" r="6" fill="#8bbba1" /><circle cx="33" cy="54" r="5" fill="#a39bc8" /></g>
    <path d="M43 46L61 12Q65 7 67 12L51 50Z" fill="#bfcfe1" stroke="#7999b7" strokeWidth="2" />
    <path d="M43 44L52 49L48 55L39 50Z" fill="#fff0d3" stroke="#bba180" strokeWidth="1.5" />
    <path d="M40 50Q31 52 35 65Q47 65 48 55Z" fill="#d884a2" stroke="#aa627f" strokeWidth="2" /><path d="M39 57L38 61" stroke="#f7c9da" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

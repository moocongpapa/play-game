import type { ReactNode } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { ToyArtwork } from './ToyArtwork';
import { CareFriend } from './ToddlerPlay';
import { Sparkles, Heart, Music2 } from 'lucide-react';
import type { CharacterId } from '../types';

type ResultKind = 'train' | 'build' | 'mirror' | 'picnic' | 'dance';
const CAPTIONS: Record<ResultKind, string> = {
  train: '짝꿍 친구들, 소풍 출발!', build: '내 모양으로 집을 꾸몄어!', mirror: '거울아, 반짝이는 이를 봐!',
  picnic: '골고루 냠냠! 소풍 갈 준비 끝!', dance: '모두 모여 까꿍 음악회!',
};

export function PlayResultScene({ kind, buddy, toys = [], friends, color = '#a9c88f', caption, keepsake }: {
  kind: ResultKind; buddy: CharacterId; toys?: string[]; friends?: CharacterId[]; color?: string; caption?: string; keepsake?: ReactNode;
}) {
  return <section className={`play-result result-${kind}`} aria-label={(caption || CAPTIONS[kind])}>
    <div className="result-cloud cloud-one" /><div className="result-cloud cloud-two" />
    <div className="result-scenery" aria-hidden="true">
      {kind === 'train' && <><div className="train-rail" /><div className="train-convoy">
        <div className="train-engine"><CharacterAvatar id={buddy} size="md" mood="waving" /><svg viewBox="0 0 140 100"><path d="M14 44 H71 V17 H117 V82 H13Z" fill="#92b8ab" stroke="#638d7f" strokeWidth="3" /><path d="M64 17 H125 V28 H64Z" fill="#deb67f" /><rect x="82" y="34" width="23" height="24" rx="4" fill="#fff4cc" /><path d="M24 46 V22 H43 V46" fill="#d8a8b8" /><circle cx="34" cy="84" r="13" fill="#7e837c" /><circle cx="102" cy="84" r="13" fill="#7e837c" /><circle cx="34" cy="84" r="6" fill="#eee1bf" /><circle cx="102" cy="84" r="6" fill="#eee1bf" /></svg></div>
        {toys.slice(0, 4).map((toy, index) => <div className="train-car" key={index} style={{ '--car-order': index } as React.CSSProperties}><ToyArtwork emoji={toy} /><span /><i /><i /></div>)}
      </div></>}
      {kind === 'build' && <div className="shape-house"><svg viewBox="0 0 300 240">
        <ellipse cx="150" cy="218" rx="111" ry="13" fill="#c4cfad" />
        <g className="house-wall"><rect x="63" y="88" width="174" height="128" rx="9" fill={color} stroke="#a5a287" strokeWidth="4" /><rect x="130" y="151" width="40" height="65" rx="17" fill="#ecbf8f" /><circle cx="158" cy="185" r="3" fill="#ab8462" /></g>
        <path className="house-roof" d="M40 96 L150 20 L260 96Z" fill="#db9fae" stroke="#bc7e91" strokeWidth="4" strokeLinejoin="round" />
        <g className="house-window" fill="#fff7c7" stroke="#d5b575" strokeWidth="4"><circle cx="100" cy="127" r="18" /><rect x="187" y="110" width="30" height="32" rx="4" /></g>
        <path d="M24 215 Q24 162 39 158 Q64 167 50 214 M258 213 Q240 167 263 157 Q282 178 278 216" fill="#a7c98b" />
      </svg>{keepsake && <span className="house-keepsake">{keepsake}</span>}<CharacterAvatar id={buddy} size="md" mood="excited" /></div>}
      {kind === 'mirror' && <div className="mirror-frame"><CareFriend buddy={buddy} mouth="smile" smilingEyes /><Sparkles className="mirror-sparkle" /><Heart className="mirror-heart" /></div>}
      {kind === 'picnic' && <><CharacterAvatar id={buddy} size="xl" mood="excited" /><div className="result-picnic-cloth">{toys.map((toy, i) => <span key={i} style={{ '--car-order': i } as React.CSSProperties}><ToyArtwork emoji={toy} /></span>)}</div><Heart className="picnic-heart" fill="currentColor" /></>}
      {kind === 'dance' && <><div className="result-dancers">{(friends || [buddy]).map((friend, i) => <div key={`${friend}:${i}`} style={{ '--car-order': i } as React.CSSProperties}><CharacterAvatar id={friend} size="xl" mood="dancing" /></div>)}</div><Music2 className="dance-note note-one" /><Music2 className="dance-note note-two" /></>}
    </div>
  </section>;
}

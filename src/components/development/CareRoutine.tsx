import { useId, useRef, useState } from 'react';
import { Droplets } from 'lucide-react';
import { CareFriend, ToothBrushArt } from '../ToddlerPlay';
import { DragMatch, DragPiece, DropSlot } from '../DragMatch';
import { ScaffoldingHint } from '../ScaffoldingHint';
import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { playCareSound } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';

export type CareObjectKind = 'paste' | 'drink' | 'rinse' | 'wipe' | 'blanket' | 'teeth';
export function CareObjectArt({ kind }: { kind: CareObjectKind }) {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 160 150" className="care-object-art" aria-hidden="true">
    <defs><linearGradient id={`${id}-cloth`} x2=".8" y2="1"><stop stopColor="#fff8ed" /><stop offset=".5" stopColor="#dfb4c9" /><stop offset="1" stopColor="#bc8eae" /></linearGradient><linearGradient id={`${id}-water`} x2=".7" y2="1"><stop stopColor="#ddfbef" /><stop offset="1" stopColor="#8ebfcd" /></linearGradient></defs>
    <ellipse cx="81" cy="137" rx="51" ry="7" fill="#9b88781c" />
    {kind === 'paste' ? <g stroke="#80a7a0" strokeWidth="3" strokeLinejoin="round"><path d="M46 18 H112 L103 105 Q80 121 56 105Z" fill={`url(#${id}-water)`}/><path d="M48 23 H110 M51 29 H108" stroke="#fffdf1"/><rect x="60" y="107" width="40" height="24" rx="7" fill="#eedcb0" stroke="#c4ad7b"/><path d="M69 112 V125 M79 112 V125 M89 112 V125" stroke="#fff3d2"/><path d="M61 66 Q78 44 97 64 Q90 90 78 89 Q65 87 61 66" fill="#fffdf3"/><path d="M71 63 Q79 70 88 61" fill="none"/></g> :
    kind === 'wipe' || kind === 'blanket' ? <g stroke="#b891ab" strokeWidth="2.5" strokeLinejoin="round"><path d={kind === 'blanket' ? 'M23 26 Q80 16 137 26 L143 130 Q80 120 17 130Z' : 'M31 26 L136 38 L120 128 L17 107Z'} fill={`url(#${id}-cloth)`}/><path d="M38 36 L125 44 L116 118 L28 102Z" fill="none" stroke="#fff6e9" strokeDasharray="4 5"/><path d="M67 72 Q53 55 47 68 Q43 79 67 95 Q92 78 86 66 Q79 56 67 72" fill="#fff0da" stroke="none"/><path d="M106 37 Q97 84 114 125" fill="none" stroke="#c89fb7"/></g> :
    kind === 'teeth' ? <g><path d="M39 27 Q59 16 79 28 Q102 15 125 29 Q137 50 119 82 Q116 129 102 129 Q91 128 83 89 Q71 86 64 124 Q50 140 45 102 Q20 54 39 27Z" fill="#fffef7" stroke="#bfcfc6" strokeWidth="4"/><path d="M47 36 Q62 29 77 39" stroke="#ecf5ea" strokeWidth="8" strokeLinecap="round"/><path d="M114 12 V34 M104 23 H126" stroke="#e6be67" strokeWidth="5" strokeLinecap="round"/></g> :
    <g stroke="#8db2b8" strokeWidth="3" strokeLinejoin="round"><path d="M112 51 Q155 41 148 78 Q145 96 120 93" fill="none" strokeWidth="10"/><path d="M27 34 Q73 24 120 34 L114 120 Q73 140 33 121Z" fill={`url(#${id}-water)`}/><ellipse cx="74" cy="35" rx="46" ry="12" fill="#fffdf1"/><ellipse cx="74" cy="37" rx="35" ry="7" fill="#a4d5dc" stroke="none"/><path d="M43 55 L47 105" stroke="#fffcef" strokeWidth="7" strokeLinecap="round"/><path d="M73 77 Q79 58 85 77 Q93 94 80 96 Q66 95 73 77" fill="#f8fff3" stroke="none"/></g>}
  </svg>;
}

export function CareRoutine({ props, kind, locked, onComplete }: {
  props: ToddlerGameProps; kind: 'paste' | 'drink' | 'rinse' | 'wipe'; locked: boolean; onComplete: (praise: string) => void;
}) {
  const [used, setUsed] = useState(false);
  const claimed = useRef(false);
  const { scheduleGameTimeout } = useGameTimeouts();
  const rinseHint = useIdleScaffolding({ resetKey: used ? 'spit' : kind, disabled: locked || kind !== 'rinse' || !used,
    voice: { text: '우르르, 퉤! 물방울을 눌러 뱉어 볼까?', buddy: props.buddy, soundEnabled: props.soundEnabled } });
  const labels = { paste: '치약', drink: '물컵', rinse: '헹구는 물컵', wipe: '입 닦는 수건' };
  const target = kind === 'paste' ? '칫솔' : '친구의 입';
  const finish = () => onComplete({ paste: '치약을 조금 짰어! 이제 윗니를 닦아 볼까?', drink: '꿀꺽! 시원한 물도 마셨어. 입도 닦아 볼까?', rinse: '우르르, 퉤! 입안이 깨끗해졌어. 고마워!', wipe: '입도 뽀송뽀송! 골고루 먹고 깨끗하게 마무리했어!' }[kind]);
  const drop = () => {
    if (locked || claimed.current) return false;
    claimed.current = true; setUsed(true); playCareSound(kind === 'wipe' ? 'brush' : 'bubble', props.soundEnabled);
    if (kind !== 'rinse') scheduleGameTimeout(finish, 1100);
    return true;
  };
  return <DragMatch resetKey={kind} juicy disabled={locked || used} onDrop={drop} hint={{ pieceId: kind, targetId: 'care-target' }}>
    <div className={`care-routine bathroom-scene routine-${kind}`} data-used={used}>
      <div className="care-routine-friend"><CareFriend buddy={props.buddy} mouth={used ? 'smile' : 'rest'} smilingEyes={used}/>
        {kind !== 'paste' && <DropSlot id="care-target" label={target} className="feeding-mouth" filled={used}><span /></DropSlot>}
        {kind === 'wipe' && !used && <span className="meal-smudge" aria-hidden="true" />}
        {used && kind !== 'paste' && <span className={`routine-action action-${kind}`} aria-hidden="true"><CareObjectArt kind={kind}/></span>}
      </div>
      {kind === 'paste' && <DropSlot id="care-target" label={target} className="paste-brush" filled={used}><ToothBrushArt paste={false}/>{used && <span className="fresh-paste" aria-hidden="true"/>}</DropSlot>}
      {kind === 'rinse' && used && <button type="button" className="rinse-finish" disabled={locked} aria-label="물 뱉고 헹구기 마치기" onClick={finish}><Droplets aria-hidden="true"/>{rinseHint.isIdle && <ScaffoldingHint/>}</button>}
    </div>
    <div className="care-tools"><DragPiece id={kind} label={labels[kind]} disabled={used} className="care-tool"><CareObjectArt kind={kind}/></DragPiece></div>
  </DragMatch>;
}

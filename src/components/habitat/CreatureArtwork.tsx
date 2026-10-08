import { memo } from 'react';

function Face({ x = 63, y = 51, spread = 12, happy = false }: { x?: number; y?: number; spread?: number; happy?: boolean }) {
  return <g className="creature-face">
    <g fill="#514d57">{happy ? <g fill="none" stroke="#514d57" strokeWidth="2.5" strokeLinecap="round"><path d={`M${x-spread-3} ${y} q3 -5 6 0 M${x+spread-3} ${y} q3 -5 6 0`} /></g> : <>
      <ellipse cx={x-spread} cy={y} rx="3.5" ry="4.8" /><ellipse cx={x+spread} cy={y} rx="3.5" ry="4.8" />
      <circle cx={x-spread+1} cy={y-1.5} r="1.3" fill="#fffdf8" /><circle cx={x+spread+1} cy={y-1.5} r="1.3" fill="#fffdf8" />
    </>}</g>
    <ellipse cx={x-spread-6} cy={y+8} rx="5.5" ry="3.1" fill="#ecaaa8" opacity=".78" /><ellipse cx={x+spread+6} cy={y+8} rx="5.5" ry="3.1" fill="#ecaaa8" opacity=".78" />
    <path d={`M${x-4} ${y+8} q4 5 8 0`} stroke="#8d6670" strokeWidth="2" strokeLinecap="round" fill="none" />
  </g>;
}
const outline = { stroke: '#817969', strokeWidth: 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Original vector friends: soft silhouettes, readable species details and friendly faces. */
export const CreatureArtwork = memo(function CreatureArtwork({ id, happy = false }: { id: string; happy?: boolean }) {
  let drawing;
  switch (id) {
    case 'ladybug': drawing = <>
      <g className="creature-legs" stroke="#78676a" strokeWidth="3" fill="none"><path d="M35 49 L22 41 M32 62 H17 M37 77 L24 87 M83 48 L96 40 M86 63 H101 M82 77 L95 87" /></g>
      <path d="M48 27 L44 15 M70 27 L76 15" fill="none" stroke="#7b6972" strokeWidth="3" /><circle cx="43" cy="13" r="4" fill="#aa8a9a" /><circle cx="77" cy="13" r="4" fill="#aa8a9a" />
      <ellipse cx="59" cy="61" rx="34" ry="33" fill="#e68d8b" stroke="#b9727a" strokeWidth="2" /><path d="M59 46 V92" stroke="#b9727a" strokeWidth="2" />
      <g fill="#826f80"><circle cx="40" cy="55" r="7" /><circle cx="41" cy="76" r="6" /><circle cx="77" cy="55" r="7" /><circle cx="76" cy="76" r="6" /></g>
      <ellipse cx="59" cy="35" rx="24" ry="20" fill="#b88f9b" stroke="#967888" strokeWidth="2" /><path d="M37 38 Q58 21 81 38 Q78 56 59 56 Q40 55 37 38" fill="#fff1df" /><Face x={59} y={37} spread={10} happy={happy} /><path d="M35 61 Q31 73 38 81" stroke="#fff0d9" strokeWidth="4" opacity=".55" fill="none" />
    </>; break;
    case 'butterfly': drawing = <>
      <g className="creature-wings" {...outline}><path d="M56 47 Q17 4 9 35 Q5 62 49 63 Q12 60 20 84 Q33 106 57 67" fill="#c3afe2" /><path d="M65 47 Q101 4 112 35 Q117 64 72 63 Q108 60 99 84 Q86 104 64 67" fill="#e8b6c7" /><path d="M24 31 Q39 31 48 49 Q21 53 24 31Z" fill="#ead5eb" stroke="none" /><path d="M97 31 Q82 31 73 49 Q100 53 97 31Z" fill="#f9e5bd" stroke="none" /><circle cx="33" cy="77" r="7" fill="#e5d699" stroke="none" /><circle cx="87" cy="77" r="7" fill="#c4c2e7" stroke="none" /></g>
      <path d="M54 29 Q47 12 40 17 M65 29 Q74 12 81 17" fill="none" stroke="#927994" strokeWidth="2.5" /><ellipse cx="60" cy="66" rx="9" ry="25" fill="#baa1c8" /><ellipse cx="60" cy="39" rx="20" ry="19" fill="#fff0dc" stroke="#bda3bc" strokeWidth="2" /><Face x={60} y={37} spread={8} happy={happy} />
    </>; break;
    case 'caterpillar': drawing = <>
      <g className="creature-legs" stroke="#8fa17b" strokeWidth="5"><path d="M23 75 V85 M41 77 V88 M61 77 V87 M79 76 V85" /></g>
      <g fill="#bed392" stroke="#93b070" strokeWidth="1.7"><circle cx="24" cy="66" r="14" /><circle cx="43" cy="65" r="18" /><circle cx="65" cy="64" r="20" /><circle cx="88" cy="54" r="24" /></g>
      <path d="M80 31 L77 21 M94 31 L99 20" stroke="#97ad75" strokeWidth="3" /><circle cx="76" cy="20" r="4" fill="#e4c58e" /><circle cx="100" cy="19" r="4" fill="#e4c58e" /><Face x={88} y={52} spread={9} happy={happy} /><path d="M17 60 L22 57 M37 52 L44 51 M60 48 L65 47" stroke="#eef1c9" strokeWidth="5" strokeLinecap="round" />
    </>; break;
    case 'bee': drawing = <>
      <g className="creature-wings" fill="#e7f3ef" stroke="#afccc5" strokeWidth="2"><ellipse cx="43" cy="35" rx="17" ry="24" transform="rotate(-32 43 35)" /><ellipse cx="72" cy="33" rx="16" ry="23" transform="rotate(29 72 33)" /></g>
      <ellipse cx="53" cy="65" rx="34" ry="24" fill="#ecd080" stroke="#bca275" strokeWidth="2" /><path d="M34 46 Q22 66 36 85 M52 43 Q42 65 54 88" fill="none" stroke="#9f8a75" strokeWidth="10" /><circle cx="80" cy="55" r="24" fill="#f7dda0" stroke="#c7aa7f" strokeWidth="2" /><path d="M74 33 L70 21 M88 33 L94 22" stroke="#9f8a75" strokeWidth="3" /><Face x={82} y={53} spread={9} happy={happy} />
    </>; break;
    case 'snail': drawing = <>
      <path d="M12 80 Q23 68 73 70 Q81 43 99 49 Q111 54 104 77 Q94 93 30 91 Q14 89 12 80Z" fill="#d5d6a6" stroke="#a3ad83" strokeWidth="2" />
      <circle cx="47" cy="55" r="30" fill="#debb96" stroke="#b99879" strokeWidth="2" /><path d="M47 78 C11 67 25 23 53 33 C81 45 59 75 41 60 C29 48 49 40 54 52" fill="none" stroke="#b68d76" strokeWidth="4" strokeLinecap="round" />
      <path d="M88 51 L85 29 M101 52 L107 32" stroke="#a6b48b" strokeWidth="4" strokeLinecap="round" /><circle cx="85" cy="28" r="5" fill="#bcc79b" /><circle cx="107" cy="30" r="5" fill="#bcc79b" /><Face x={94} y={58} spread={7} happy={happy} />
    </>; break;
    case 'beetle': drawing = <>
      <g className="creature-legs" stroke="#7c9685" strokeWidth="3" fill="none"><path d="M33 48 L17 38 M30 65 H12 M34 80 L20 92 M85 48 L103 38 M89 65 H109 M85 80 L102 92" /></g>
      <ellipse cx="60" cy="65" rx="34" ry="30" fill="#96bda4" stroke="#6d9983" strokeWidth="2" /><path d="M60 44 V93 M32 63 Q43 50 55 48 M65 48 Q78 50 89 63" stroke="#709a84" strokeWidth="2" fill="none" />
      <ellipse cx="60" cy="37" rx="25" ry="20" fill="#bad0a4" stroke="#87a583" strokeWidth="2" /><path d="M60 19 V7 M60 12 L51 5 M60 12 L69 5" stroke="#809c80" strokeWidth="5" fill="none" strokeLinecap="round" /><Face x={60} y={36} spread={10} happy={happy} /><path d="M34 63 Q29 77 38 82" stroke="#e2edcf" strokeWidth="5" fill="none" strokeLinecap="round" />
    </>; break;
    case 'ant': drawing = <>
      <g className="creature-legs" stroke="#a1847e" strokeWidth="3" fill="none"><path d="M39 68 L26 86 M48 69 L46 91 M58 64 L69 86 M36 55 L23 43 M47 56 L40 36 M61 54 L67 39" /></g>
      <ellipse cx="28" cy="62" rx="21" ry="17" fill="#b99587" stroke="#987b78" strokeWidth="2" /><ellipse cx="56" cy="60" rx="14" ry="12" fill="#d8ad97" stroke="#ac8a80" strokeWidth="2" /><circle cx="84" cy="49" r="23" fill="#e0b4a1" stroke="#ae8c81" strokeWidth="2" /><path d="M76 29 Q66 9 59 19 M90 28 Q94 9 105 15" stroke="#a1847e" strokeWidth="3" fill="none" /><Face x={85} y={47} spread={9} happy={happy} />
    </>; break;
    case 'cricket': drawing = <>
      <path className="creature-legs" d="M28 66 L17 88 H38 M48 70 L40 88 H64 M35 69 L24 44 L11 80 M77 70 L88 90 H102" stroke="#91a16e" strokeWidth="5" strokeLinejoin="round" fill="none" />
      <ellipse cx="48" cy="57" rx="31" ry="19" fill="#b6c989" stroke="#8fa36f" strokeWidth="2" /><path d="M23 51 Q42 40 74 56 L32 70Z" fill="#d5dfac" stroke="#a3b780" strokeWidth="1.7" /><circle cx="85" cy="47" r="22" fill="#c6d699" stroke="#96ad76" strokeWidth="2" /><path d="M82 26 Q80 8 66 9 M92 27 Q100 10 114 18" stroke="#93aa77" strokeWidth="2" fill="none" /><Face x={86} y={45} spread={8} happy={happy} />
    </>; break;
    case 'clownfish': case 'bluefish': case 'angelfish': drawing = <>
      <path className="creature-tail" d="M34 47 Q15 30 9 35 L12 69 Q19 77 35 62Z" fill={id === 'bluefish' ? '#e7cb7b' : id === 'angelfish' ? '#e2b96f' : '#e8a278'} stroke="#b39076" strokeWidth="2" />
      <path d={id === 'angelfish' ? 'M40 40 L56 9 Q84 29 83 40 M41 65 L62 91 L81 65' : 'M40 39 Q62 15 84 40 M43 67 Q57 88 74 70'} fill={id === 'bluefish' ? '#789aba' : '#f0ce91'} stroke="#b4a187" strokeWidth="1.5" />
      <ellipse cx="66" cy="53" rx="39" ry={id === 'angelfish' ? 31 : 25} fill={id === 'bluefish' ? '#9ac6db' : id === 'angelfish' ? '#f0d893' : '#efb087'} stroke={id === 'bluefish' ? '#709bb7' : '#c49976'} strokeWidth="2" />
      {id === 'clownfish' && <g stroke="#fff8e7" strokeWidth="9" fill="none"><path d="M43 34 Q35 52 43 72 M65 29 Q56 49 65 77" /></g>}
      {id === 'bluefish' && <path d="M39 37 Q55 27 77 34 Q55 37 47 61 L34 60Z" fill="#729ab9" />}
      {id === 'angelfish' && <g stroke="#c29e75" strokeWidth="7"><path d="M46 30 V76 M63 24 V81" /></g>}
      <path className="creature-fin" d="M66 60 Q54 76 51 60 Q56 51 66 60" fill={id === 'bluefish' ? '#e9d491' : '#f7d5a3'} stroke="#beaa88" strokeWidth="1.5" /><Face x={84} y={49} spread={8} happy={happy} />
    </>; break;
    case 'pufferfish': drawing = <>
      <path className="creature-tail" d="M28 44 L9 36 L11 70 L29 60" fill="#c6bd87" stroke="#a89e79" strokeWidth="2" />
      <path d="M33 27 L38 20 L44 24 L50 13 L56 21 L66 12 L71 22 L84 17 L86 29 L101 30 L96 41 L109 50 L101 60 L106 70 L95 74 L91 88 L80 83 L69 94 L61 85 L46 91 L42 80 L30 81 L31 68 L21 57 L29 46 L24 34Z" fill="#d9cb9e" stroke="#b2a37d" strokeWidth="1.5" />
      <ellipse cx="66" cy="58" rx="34" ry="28" fill="#f5e9c8" /><g fill="#c2b083"><circle cx="48" cy="33" r="3" /><circle cx="69" cy="29" r="3" /><circle cx="37" cy="47" r="2.5" /><circle cx="89" cy="39" r="3" /></g><Face x={70} y={53} spread={12} happy={happy} />
    </>; break;
    case 'shark': drawing = <>
      <path className="creature-tail" d="M29 49 L7 28 L12 51 L6 74 L29 64" fill="#9eb9c9" stroke="#7b96aa" strokeWidth="2" />
      <path d="M52 36 Q56 14 67 12 L78 37 M54 68 L59 87 L79 66" fill="#88a9be" stroke="#6f90a6" strokeWidth="2" />
      <path d="M24 48 Q61 21 97 39 Q114 46 114 55 Q111 79 65 78 Q40 77 24 62Z" fill="#b5cfda" stroke="#7b9eaf" strokeWidth="2" /><path d="M32 63 Q75 89 111 60 Q101 80 63 76Z" fill="#f7f4e7" />
      <path className="creature-fin" d="M57 59 Q48 78 72 71Z" fill="#91b2c6" stroke="#759aae" strokeWidth="1.5" /><path d="M72 45 L70 52 M67 45 L65 52" stroke="#83a2b5" strokeWidth="1.7" /><Face x={92} y={48} spread={8} happy={happy} />
    </>; break;
    case 'whale': drawing = <>
      <path className="creature-tail" d="M36 65 Q15 72 8 48 Q22 50 26 44 Q23 31 11 30 Q36 25 42 52Z" fill="#9db8d5" stroke="#7f9ebf" strokeWidth="2" />
      <path d="M29 54 Q31 31 65 29 Q108 22 112 50 Q123 84 70 86 Q33 86 29 54Z" fill="#a6bfdc" stroke="#809fc0" strokeWidth="2" /><path d="M44 69 Q76 87 110 65 Q98 85 68 83Z" fill="#f3eddf" /><path className="creature-fin" d="M59 63 Q49 90 78 77" fill="#89a8cb" stroke="#7799bc" strokeWidth="1.7" /><path d="M69 23 Q61 6 56 15 M70 23 Q79 4 85 13" fill="none" stroke="#b4dae0" strokeWidth="5" strokeLinecap="round" /><Face x={88} y={50} spread={9} happy={happy} />
    </>; break;
    case 'octopus': drawing = <>
      <g className="creature-tentacles" fill="none" stroke="#b39aca" strokeWidth="10" strokeLinecap="round"><path d="M33 58 Q10 92 14 64 M43 64 Q24 105 30 75 M53 66 Q42 106 44 80 M60 68 Q57 101 61 84 M67 66 Q76 106 76 80 M77 64 Q96 106 91 75 M86 58 Q110 90 109 65 M57 69 Q56 91 51 90" /></g>
      <path d="M27 54 Q22 18 59 15 Q99 17 94 55 Q89 76 60 73 Q31 76 27 54Z" fill="#d1bce2" stroke="#ab8fc4" strokeWidth="2" /><path d="M36 39 Q38 24 51 25" fill="none" stroke="#f6e9f6" strokeWidth="5" strokeLinecap="round" /><Face x={61} y={46} spread={13} happy={happy} />
    </>; break;
    case 'squid': drawing = <>
      <path className="creature-wings" d="M42 41 Q22 29 20 67 L43 61 M78 41 Q101 27 103 67 L77 61" fill="#e5aaa9" stroke="#bf8d99" strokeWidth="2" />
      <g className="creature-tentacles" fill="none" stroke="#dca5aa" strokeWidth="5" strokeLinecap="round"><path d="M42 64 Q24 99 28 76 M46 68 Q32 89 41 87 M51 70 L47 91 M55 72 L53 90 M59 71 Q52 101 61 96 M63 70 L64 91 M67 71 L73 91 M71 70 Q83 96 82 82 M75 67 Q95 105 96 79 M78 66 Q91 83 87 70" /></g>
      <path d="M60 9 Q31 28 36 61 Q37 79 60 78 Q85 78 85 60 Q88 29 60 9Z" fill="#f0c7bf" stroke="#c49b9d" strokeWidth="2" /><path d="M47 32 L57 20" stroke="#ffe9d7" strokeWidth="5" strokeLinecap="round" /><Face x={61} y={52} spread={11} happy={happy} />
    </>; break;
    case 'jellyfish': drawing = <>
      <g className="creature-tentacles" fill="none" strokeLinecap="round"><path d="M33 56 Q18 75 34 87 M45 59 Q56 78 41 93 M60 58 Q45 79 62 92 M74 58 Q85 76 73 94 M87 56 Q77 77 91 85" stroke="#cfb5d7" strokeWidth="6" /><path d="M51 60 Q39 83 51 96 M79 61 Q69 87 78 96" stroke="#a9ced7" strokeWidth="3" /></g>
      <path d="M21 54 Q23 14 59 12 Q99 14 101 54 Q91 67 79 57 Q68 69 59 59 Q47 68 39 58 Q28 65 21 54Z" fill="#dfcee9" fillOpacity=".85" stroke="#bfa9d1" strokeWidth="2" /><path d="M34 33 Q44 19 57 20" stroke="#fff6fd" strokeWidth="5" strokeLinecap="round" fill="none" /><Face x={61} y={42} spread={12} happy={happy} />
    </>; break;
    case 'turtle': drawing = <>
      <g className="creature-fin" fill="#b1cfaa" stroke="#86aa88" strokeWidth="2"><path d="M38 40 Q18 8 12 23 Q15 43 38 50 M38 64 Q7 71 18 88 Q34 86 46 69 M62 38 Q66 19 82 25 L75 48 M62 65 Q65 87 81 83 L75 59" /></g>
      <ellipse cx="51" cy="54" rx="32" ry="27" fill="#90b3a0" stroke="#6b9788" strokeWidth="2" /><path d="M43 36 L61 38 L71 54 L59 71 L41 69 L32 52Z" fill="#b6cfab" stroke="#7caa90" strokeWidth="2" /><path d="M43 36 L38 30 M61 38 L68 31 M71 54 H81 M59 71 L63 79 M41 69 L37 76 M32 52 H21" stroke="#7caa90" strokeWidth="2" /><ellipse cx="92" cy="51" rx="22" ry="18" fill="#c4d9af" stroke="#96b594" strokeWidth="2" /><Face x={94} y={49} spread={8} happy={happy} />
    </>; break;
    case 'seahorse': drawing = <>
      <path className="creature-fin" d="M55 49 L32 42 L38 67 L56 65" fill="#e8bf8e" stroke="#b99c78" strokeWidth="2" />
      <path d="M61 19 Q48 17 43 25 L48 32 Q44 43 51 51 Q43 66 58 74 Q77 80 63 87 Q51 88 54 80 Q39 82 47 96 Q65 108 79 85 Q90 65 69 53 L68 45 Q83 49 100 42 L100 33 L80 32 Q80 14 61 19Z" fill="#efd4a5" stroke="#c3a17c" strokeWidth="2" /><path d="M61 19 L62 10 L69 16 L75 12 L78 24" fill="#e3b98b" stroke="#c3a17c" strokeWidth="2" /><path d="M55 58 L68 61 M56 65 L71 68 M60 73 L74 76" stroke="#d4b48a" strokeWidth="2" /><Face x={64} y={34} spread={7} happy={happy} />
    </>; break;
    case 'ray': drawing = <>
      <path className="creature-tail" d="M61 61 Q60 94 95 96" fill="none" stroke="#9c9ebd" strokeWidth="5" strokeLinecap="round" />
      <path className="creature-wings" d="M59 22 Q46 32 12 35 Q7 57 36 77 L59 68 L85 78 Q114 58 110 35 Q78 33 68 23Z" fill="#c0c5dc" stroke="#969fbd" strokeWidth="2" /><path d="M58 35 Q46 40 33 58 Q44 73 60 67 Q79 71 89 57 Q76 41 68 35Z" fill="#eeeaf3" /><Face x={61} y={46} spread={11} happy={happy} />
    </>; break;
    default: drawing = null;
  }
  return <svg viewBox="0 0 120 104" className={`creature-art art-${id}`} aria-hidden="true">{drawing}</svg>;
});

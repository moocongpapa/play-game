import { memo, useId } from 'react';

const GARDEN_PAINTS: Record<string, readonly [string, string, string]> = {
  dragonfly: ['#d5f3fc', '#84c9df', '#4e91b1'],
  firefly: ['#e9e6be', '#b7bf8d', '#71835b'],
  mantis: ['#def2bd', '#91c69c', '#538c67'],
  stagbeetle: ['#f1d7bc', '#be9380', '#795d57'],
};

function Face({
  x = 60,
  y = 50,
  spread = 12,
  happy = false,
  eyeSize = 4.8,
}: {
  x?: number;
  y?: number;
  spread?: number;
  happy?: boolean;
  eyeSize?: number;
}) {
  return (
    <g className="creature-face">
      {/* Rosy Blushing Cheeks */}
      <ellipse cx={x - spread - 5} cy={y + 8} rx="5.5" ry="3.5" fill="#ff8da1" opacity="0.85" />
      <ellipse cx={x + spread + 5} cy={y + 8} rx="5.5" ry="3.5" fill="#ff8da1" opacity="0.85" />

      {/* Expressive Sparkle Kawaii Eyes */}
      {happy ? (
        <g fill="none" stroke="#2c2738" strokeWidth="2.8" strokeLinecap="round">
          <path d={`M${x - spread - 4} ${y + 1} q4 -6 8 0`} />
          <path d={`M${x + spread - 4} ${y + 1} q4 -6 8 0`} />
        </g>
      ) : (
        <g fill="#2c2738">
          {/* Left Eye with dual catchlights */}
          <ellipse cx={x - spread} cy={y} rx={eyeSize} ry={eyeSize * 1.18} />
          <circle cx={x - spread - 1.2} cy={y - 1.5} r={eyeSize * 0.42} fill="#ffffff" />
          <circle cx={x - spread + 1.8} cy={y + 2} r={eyeSize * 0.22} fill="#ffffff" />

          {/* Right Eye with dual catchlights */}
          <ellipse cx={x + spread} cy={y} rx={eyeSize} ry={eyeSize * 1.18} />
          <circle cx={x + spread - 1.2} cy={y - 1.5} r={eyeSize * 0.42} fill="#ffffff" />
          <circle cx={x + spread + 1.8} cy={y + 2} r={eyeSize * 0.22} fill="#ffffff" />
        </g>
      )}

      {/* Joyful Sweet Mouth */}
      {happy ? (
        <g>
          <path d={`M${x - 4} ${y + 7} q4 6 8 0 Z`} fill="#ff5277" stroke="#2c2738" strokeWidth="1.6" strokeLinejoin="round" />
          <path d={`M${x - 2} ${y + 9} q2 3 4 0`} fill="#ffb4c2" />
        </g>
      ) : (
        <path d={`M${x - 3.5} ${y + 8} q3.5 4.5 7 0`} stroke="#4a3b42" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

/**
 * Premium vector illustrations for children:
 * Soft silhouettes, rich gradients, joyful expressions, and responsive animation anchors.
 */
export const CreatureArtwork = memo(function CreatureArtwork({ id, happy = false }: { id: string; happy?: boolean }) {
  const paintId = useId();
  const colors = GARDEN_PAINTS[id];
  const bodyPaint = `url(#${paintId}-body)`;
  let drawing;
  switch (id) {
    // ==========================================
    // 곤충 친구들 (Bug Garden)
    // ==========================================
    case 'ladybug':
      drawing = (
        <>
          {/* 6 Jointed Legs */}
          <g className="creature-legs" stroke="#4a3b44" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M36 50 L20 42 M32 64 H14 M38 78 L22 88 M84 50 L100 42 M88 64 H106 M82 78 L98 88" />
          </g>
          {/* Antennae with Golden Tips */}
          <path d="M48 26 Q42 12 34 14 M72 26 Q78 12 86 14" fill="none" stroke="#4a3b44" strokeWidth="3" strokeLinecap="round" />
          <circle cx="33" cy="14" r="4.5" fill="#ffd166" stroke="#e09f3e" strokeWidth="1" />
          <circle cx="87" cy="14" r="4.5" fill="#ffd166" stroke="#e09f3e" strokeWidth="1" />

          {/* Red Elytra Dome & Shading */}
          <ellipse cx="60" cy="62" rx="36" ry="34" fill="#ff4d6d" stroke="#c9184a" strokeWidth="2.2" />
          {/* Wing Division */}
          <path d="M60 46 V96" stroke="#800f2f" strokeWidth="2.5" />
          {/* Glossy Curved Highlight */}
          <path d="M35 56 Q30 72 38 84" stroke="#ffffff" strokeWidth="3.5" opacity="0.65" strokeLinecap="round" fill="none" />

          {/* Symmetrical Spots & Little Heart Spot */}
          <g fill="#2b2d42">
            <circle cx="42" cy="56" r="6.5" />
            <circle cx="43" cy="76" r="5.5" />
            <circle cx="78" cy="56" r="6.5" />
            <circle cx="77" cy="76" r="5.5" />
            <circle cx="60" cy="86" r="4.5" />
            {/* Cute mini heart spot on upper back */}
            <path d="M57 48 C57 46 59 44 60 46 C61 44 63 46 63 48 C63 51 60 53 60 53 C60 53 57 51 57 48 Z" fill="#2b2d42" />
          </g>

          {/* Head & Face */}
          <ellipse cx="60" cy="36" rx="22" ry="18" fill="#38212e" stroke="#22121c" strokeWidth="2" />
          <ellipse cx="60" cy="38" rx="17" ry="14" fill="#fff0e6" />
          <Face x={60} y={37} spread={9} happy={happy} />
        </>
      );
      break;

    case 'butterfly':
      drawing = (
        <>
          {/* Dreamy Fairy-tale Wings */}
          <g className="creature-wings">
            {/* Upper Wings */}
            <path d="M56 46 C30 8 10 16 8 38 C6 62 40 68 56 58 Z" fill="#b388ff" stroke="#7c4dff" strokeWidth="2" />
            <path d="M64 46 C90 8 110 16 112 38 C114 62 80 68 64 58 Z" fill="#ff80ab" stroke="#f50057" strokeWidth="2" />
            {/* Inner Pastel Wing Patterns */}
            <path d="M22 34 C36 30 46 44 48 50 C32 54 20 48 22 34 Z" fill="#ede7f6" opacity="0.85" />
            <path d="M98 34 C84 30 74 44 72 50 C88 54 100 48 98 34 Z" fill="#fff3e0" opacity="0.85" />
            {/* Wing Edge Sparkle Gems */}
            <circle cx="18" cy="28" r="4.5" fill="#ffe57f" />
            <circle cx="102" cy="28" r="4.5" fill="#ffe57f" />

            {/* Lower Wings */}
            <path d="M54 58 C24 62 16 84 32 94 C48 102 56 76 54 58 Z" fill="#ffd54f" stroke="#ffb300" strokeWidth="2" />
            <path d="M66 58 C96 62 104 84 88 94 C72 102 64 76 66 58 Z" fill="#4dd0e1" stroke="#00acc1" strokeWidth="2" />
            <circle cx="34" cy="80" r="4.5" fill="#ffffff" opacity="0.9" />
            <circle cx="86" cy="80" r="4.5" fill="#ffffff" opacity="0.9" />
          </g>

          {/* Antennae with Star Tips */}
          <path d="M54 26 Q46 10 38 14 M66 26 Q74 10 82 14" fill="none" stroke="#6a4c93" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="37" cy="14" r="4" fill="#ffd166" />
          <circle cx="83" cy="14" r="4" fill="#ffd166" />

          {/* Butterfly Body & Head */}
          <ellipse cx="60" cy="66" rx="8" ry="24" fill="#7e57c2" stroke="#5e35b1" strokeWidth="1.8" />
          <ellipse cx="60" cy="62" rx="4" ry="18" fill="#d1c4e9" />
          <circle cx="60" cy="38" r="17" fill="#fff8e7" stroke="#b39ddb" strokeWidth="2" />
          <Face x={60} y={37} spread={8} happy={happy} />
        </>
      );
      break;

    case 'caterpillar':
      drawing = (
        <>
          {/* Crawling Feet */}
          <g className="creature-legs" stroke="#558b2f" strokeWidth="4.5" strokeLinecap="round">
            <path d="M24 78 V86 M44 79 V87 M66 79 V87 M88 77 V85" />
          </g>

          {/* Chubby Marshmallow Body Segments */}
          <circle cx="24" cy="66" r="14" fill="#8bc34a" stroke="#689f38" strokeWidth="2" />
          <circle cx="44" cy="64" r="17" fill="#9ccc65" stroke="#7cb342" strokeWidth="2" />
          <circle cx="66" cy="61" r="19" fill="#aed581" stroke="#8bc34a" strokeWidth="2" />
          <circle cx="88" cy="52" r="22" fill="#dce775" stroke="#c0ca33" strokeWidth="2.2" />

          {/* Segment Spot Highlights */}
          <circle cx="22" cy="63" r="4" fill="#fff9c4" />
          <circle cx="42" cy="60" r="5" fill="#fff9c4" />
          <circle cx="64" cy="57" r="5.5" fill="#fff9c4" />

          {/* Springy Antennae with Pink Balls */}
          <path d="M80 32 Q76 18 72 20 M96 32 Q100 18 104 20" stroke="#7cb342" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="71" cy="20" r="4.5" fill="#ff80ab" />
          <circle cx="105" cy="20" r="4.5" fill="#ff80ab" />

          <Face x={88} y={51} spread={9} happy={happy} />
        </>
      );
      break;

    case 'bee':
      drawing = (
        <>
          {/* Shimmering Translucent Wings */}
          <g className="creature-wings">
            <ellipse cx="44" cy="33" rx="16" ry="24" transform="rotate(-30 44 33)" fill="#e0f7fa" opacity="0.88" stroke="#80deea" strokeWidth="2" />
            <path d="M44 14 Q46 32 40 45" stroke="#ffffff" strokeWidth="2" opacity="0.8" fill="none" transform="rotate(-30 44 33)" />
            <ellipse cx="72" cy="31" rx="15" ry="23" transform="rotate(28 72 31)" fill="#e0f7fa" opacity="0.88" stroke="#80deea" strokeWidth="2" />
            <path d="M72 12 Q74 30 68 43" stroke="#ffffff" strokeWidth="2" opacity="0.8" fill="none" transform="rotate(28 72 31)" />
          </g>

          {/* Little Safe Stinger */}
          <path d="M22 66 L12 67 L21 72 Z" fill="#3e2723" />

          {/* Plump Fuzzy Body with Honey Stripes */}
          <ellipse cx="54" cy="66" rx="34" ry="24" fill="#ffca28" stroke="#f57f17" strokeWidth="2.2" />
          <path d="M36 46 Q24 66 38 86 M54 44 Q42 66 56 88" fill="none" stroke="#3e2723" strokeWidth="9" strokeLinecap="round" />

          {/* Big Round Friendly Head */}
          <circle cx="80" cy="54" r="22" fill="#fff8e1" stroke="#f57f17" strokeWidth="2.2" />
          <ellipse cx="80" cy="40" rx="12" ry="7" fill="#ffca28" opacity="0.7" />

          {/* Antennae */}
          <path d="M75 34 Q70 18 64 22 M89 34 Q94 18 100 22" stroke="#4e342e" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="63" cy="22" r="3.5" fill="#ffd54f" />
          <circle cx="101" cy="22" r="3.5" fill="#ffd54f" />

          <Face x={82} y={53} spread={8} happy={happy} />
        </>
      );
      break;

    case 'snail':
      drawing = (
        <>
          {/* Soft Undulating Body */}
          <path d="M14 82 Q28 70 74 72 Q84 48 100 52 Q112 58 106 82 Q94 94 30 92 Q16 90 14 82 Z" fill="#c8e6c9" stroke="#66bb6a" strokeWidth="2.2" />
          <path d="M30 87 Q60 85 96 85" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.7" fill="none" />

          {/* Candy Swirl Shell */}
          <circle cx="48" cy="54" r="30" fill="#ffa726" stroke="#e65100" strokeWidth="2.5" />
          <circle cx="48" cy="54" r="23" fill="#ffcc80" />
          <circle cx="48" cy="54" r="16" fill="#ffe0b2" />
          <circle cx="48" cy="54" r="9" fill="#fff3e0" />
          <path d="M48 24 C64 24 72 38 72 54 C72 66 62 76 48 76 C36 76 28 66 28 54 C28 44 36 36 48 36" fill="none" stroke="#fb8c00" strokeWidth="3.5" strokeLinecap="round" />

          {/* Long Eye Stalks with Eyes on Top */}
          <path d="M88 52 L84 26 M101 54 L107 28" stroke="#81c784" strokeWidth="4" strokeLinecap="round" />
          <circle cx="84" cy="24" r="6.5" fill="#ffffff" stroke="#66bb6a" strokeWidth="2" />
          <circle cx="107" cy="26" r="6.5" fill="#ffffff" stroke="#66bb6a" strokeWidth="2" />
          <circle cx="84" cy="24" r="3.2" fill="#2c2738" />
          <circle cx="83" cy="22.5" r="1.2" fill="#ffffff" />
          <circle cx="107" cy="26" r="3.2" fill="#2c2738" />
          <circle cx="106" cy="24.5" r="1.2" fill="#ffffff" />

          {/* Smiling Mouth on Face */}
          <ellipse cx="90" cy="62" rx="4.5" ry="3" fill="#ff8da1" opacity="0.8" />
          <ellipse cx="104" cy="62" rx="4.5" ry="3" fill="#ff8da1" opacity="0.8" />
          {happy ? (
            <path d="M93 63 q4 5 8 0 Z" fill="#ff5277" stroke="#2c2738" strokeWidth="1.5" />
          ) : (
            <path d="M94 63 q3.5 3.5 7 0" stroke="#4a3b42" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </>
      );
      break;

    case 'beetle':
      drawing = (
        <>
          {/* Sturdy Jointed Legs */}
          <g className="creature-legs" stroke="#004d40" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M34 50 L18 40 M30 66 H12 M34 82 L18 94 M86 50 L102 40 M90 66 H108 M86 82 L102 94" />
          </g>

          {/* Jewel Emerald Elytra */}
          <ellipse cx="60" cy="66" rx="35" ry="30" fill="#26a69a" stroke="#00796b" strokeWidth="2.5" />
          <path d="M60 44 V95 M32 64 Q44 50 56 48 M64 48 Q76 50 88 64" stroke="#004d40" strokeWidth="2" fill="none" />
          {/* Glossy High-tech Glint */}
          <path d="M36 64 Q32 76 40 82" stroke="#b2dfdb" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="82" cy="72" r="3" fill="#e0f2f1" />
          <circle cx="76" cy="80" r="2" fill="#e0f2f1" />

          {/* Head & Golden Horn */}
          <ellipse cx="60" cy="38" rx="25" ry="20" fill="#80cbc4" stroke="#00695c" strokeWidth="2" />
          <path d="M60 20 V8 M60 14 L50 6 M60 14 L70 6" stroke="#ffd54f" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="50" cy="6" r="2" fill="#ffb300" />
          <circle cx="70" cy="6" r="2" fill="#ffb300" />

          <Face x={60} y={38} spread={10} happy={happy} />
        </>
      );
      break;

    case 'ant':
      drawing = (
        <>
          {/* 6 Rapid Little Legs */}
          <g className="creature-legs" stroke="#5d4037" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M40 68 L26 86 M48 70 L46 92 M58 66 L70 88 M36 54 L22 42 M46 56 L38 36 M62 54 L68 38" />
          </g>

          {/* 3 Glossy Amber Segments */}
          <ellipse cx="26" cy="64" rx="20" ry="16" fill="#8d6e63" stroke="#4e342e" strokeWidth="2" />
          <ellipse cx="24" cy="59" rx="11" ry="6" fill="#d7ccc8" opacity="0.6" />
          <ellipse cx="56" cy="62" rx="14" ry="12" fill="#a1887f" stroke="#4e342e" strokeWidth="2" />
          <circle cx="84" cy="50" r="22" fill="#bcaaa4" stroke="#4e342e" strokeWidth="2" />

          {/* Tiny Fresh Green Leaf Hat */}
          <path d="M78 28 Q92 16 102 24 Q90 34 78 28 Z" fill="#81c784" stroke="#388e3c" strokeWidth="1.5" />
          <path d="M80 28 L98 23" stroke="#2e7d32" strokeWidth="1.2" fill="none" />

          {/* Antennae */}
          <path d="M75 32 Q65 14 58 22 M91 32 Q95 14 105 20" stroke="#5d4037" strokeWidth="3" strokeLinecap="round" fill="none" />

          <Face x={84} y={49} spread={9} happy={happy} />
        </>
      );
      break;

    case 'cricket':
      drawing = (
        <>
          {/* Springy Jumping Legs */}
          <g className="creature-legs" stroke="#558b2f" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M30 68 L18 90 H38 M50 72 L42 90 H64 M34 70 L22 42 L8 80 M78 72 L90 92 H104" />
          </g>

          {/* Smooth Spring-green Body */}
          <ellipse cx="48" cy="58" rx="31" ry="19" fill="#9ccc65" stroke="#689f38" strokeWidth="2" />
          <path d="M23 52 Q44 40 76 56 L32 72 Z" fill="#c5e1a5" stroke="#7cb342" strokeWidth="1.8" />
          <circle cx="85" cy="48" r="22" fill="#dce775" stroke="#9e9d24" strokeWidth="2" />

          {/* Musical Curly Antennae */}
          <path d="M82 28 Q80 8 64 10 M92 28 Q102 8 116 16" stroke="#689f38" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="64" cy="10" r="2.5" fill="#fbc02d" />
          <circle cx="116" cy="16" r="2.5" fill="#fbc02d" />

          <Face x={85} y={47} spread={8} happy={happy} />
        </>
      );
      break;

    case 'dragonfly':
      drawing = <>
        <g className="creature-wings" fill="#e5f7fb" fillOpacity=".9" stroke="#84bbce" strokeWidth="1.8">
          <path d="M56 48 C30 15 5 19 10 36 C13 47 36 53 56 54Z" />
          <path d="M64 48 C90 15 115 19 110 36 C107 47 84 53 64 54Z" />
          <path d="M56 56 C28 45 5 55 13 70 C20 82 42 68 56 60Z" />
          <path d="M64 56 C92 45 115 55 107 70 C100 82 78 68 64 60Z" />
          <path d="M17 31 L51 49 M103 31 L69 49 M19 64 L50 59 M101 64 L70 59" fill="none" stroke="#fff" strokeWidth="2.5" />
        </g>
        <g className="creature-legs" fill="none" stroke="#52879d" strokeWidth="2.5" strokeLinecap="round">
          <path d="M55 52 L43 59 M55 59 L44 68 M55 65 L47 77 M65 52 L77 59 M65 59 L76 68 M65 65 L73 77" />
        </g>
        <ellipse cx="60" cy="70" rx="9" ry="26" fill={bodyPaint} stroke="#52879d" strokeWidth="2" />
        <path d="M53 69 H67 M54 78 H66 M56 87 H64" stroke="#e2f6f7" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52 27 L47 17 M68 27 L73 17" stroke="#52879d" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="60" cy="38" rx="23" ry="18" fill={bodyPaint} stroke="#52879d" strokeWidth="2" />
        <path d="M44 31 Q50 24 57 26" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".8" />
        <Face x={60} y={37} spread={11} happy={happy} eyeSize={5.8} />
      </>;
      break;

    case 'firefly':
      drawing = <>
        <ellipse className="creature-glow" cx="60" cy="76" rx="34" ry="26" fill={`url(#${paintId}-glow)`} />
        <g className="creature-wings" fill="#edf4d9" stroke="#a5b79d" strokeWidth="1.7" fillOpacity=".9">
          <path d="M52 48 Q17 23 17 47 Q22 69 50 66Z" />
          <path d="M68 48 Q103 23 103 47 Q98 69 70 66Z" />
        </g>
        <g className="creature-legs" fill="none" stroke="#71835b" strokeWidth="2.5" strokeLinecap="round">
          <path d="M42 58 L29 64 M42 69 L31 78 M46 80 L36 89 M78 58 L91 64 M78 69 L89 78 M74 80 L84 89" />
        </g>
        <ellipse cx="60" cy="65" rx="24" ry="29" fill={bodyPaint} stroke="#71835b" strokeWidth="2" />
        <path d="M38 70 Q60 62 82 70 Q81 92 60 94 Q39 92 38 70Z" fill="#ffe591" stroke="#c8aa58" strokeWidth="1.7" />
        <path d="M43 77 Q60 84 77 77 M48 86 Q60 90 72 86" stroke="#fff6c9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M49 27 Q42 11 35 16 M71 27 Q78 11 85 16" fill="none" stroke="#71835b" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="35" cy="16" r="3" fill="#ffe591" /><circle cx="85" cy="16" r="3" fill="#ffe591" />
        <ellipse cx="60" cy="38" rx="22" ry="18" fill={bodyPaint} stroke="#71835b" strokeWidth="2" />
        <Face x={60} y={37} spread={10} happy={happy} />
      </>;
      break;

    case 'mantis':
      drawing = <>
        <g className="creature-legs" fill="none" stroke="#538c67" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M48 69 L28 80 L23 94 H36 M72 69 L92 80 L97 94 H84 M48 78 L39 94 M72 78 L81 94" />
        </g>
        <ellipse cx="60" cy="72" rx="19" ry="22" fill={bodyPaint} stroke="#538c67" strokeWidth="2" />
        <path d="M60 53 Q40 63 46 85 Q60 77 60 53 Q80 63 74 85 Q60 77 60 53Z" fill="#b8dfaa" stroke="#74a883" strokeWidth="1.5" />
        <rect x="52" y="40" width="16" height="28" rx="8" fill={bodyPaint} stroke="#538c67" strokeWidth="2" />
        <g className="creature-legs" fill="none" stroke="#74a883" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M52 54 L38 64 L49 70 M68 54 L82 64 L71 70" />
        </g>
        <path d="M45 23 Q38 9 28 13 M75 23 Q82 9 92 13" stroke="#538c67" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M34 26 Q60 12 86 26 Q89 35 74 44 Q60 57 46 44 Q31 35 34 26Z" fill={bodyPaint} stroke="#538c67" strokeWidth="2" />
        <path d="M41 28 Q51 23 58 25" stroke="#f7ffed" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Face x={60} y={34} spread={12} happy={happy} eyeSize={5.5} />
      </>;
      break;

    case 'stagbeetle':
      drawing = <>
        <g className="creature-legs" stroke="#795d57" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M36 53 L22 45 M31 68 H15 M37 82 L24 93 M84 53 L98 45 M89 68 H105 M83 82 L96 93" />
        </g>
        <ellipse cx="60" cy="68" rx="32" ry="28" fill={bodyPaint} stroke="#795d57" strokeWidth="2.2" />
        <path d="M60 47 V95" stroke="#795d57" strokeWidth="2" />
        <path d="M38 61 Q34 74 42 82 M79 60 Q83 70 80 75" stroke="#ffe9d5" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".75" />
        <g stroke="#8e6e60" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M46 29 Q31 16 39 8 M38 19 L48 13 M74 29 Q89 16 81 8 M82 19 L72 13" />
        </g>
        <path d="M41 30 L31 24 M79 30 L89 24" stroke="#795d57" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="60" cy="39" rx="25" ry="19" fill={bodyPaint} stroke="#795d57" strokeWidth="2" />
        <ellipse cx="60" cy="43" rx="19" ry="13" fill="#ffead6" />
        <Face x={60} y={39} spread={10} happy={happy} />
      </>;
      break;

    // ==========================================
    // 수족관 친구들 (Aquarium)
    // ==========================================
    case 'clownfish':
      drawing = (
        <>
          {/* Fan Tail */}
          <path className="creature-tail" d="M36 48 Q14 28 8 34 L12 70 Q18 78 36 64 Z" fill="#ff7043" stroke="#d84315" strokeWidth="2" />
          {/* Dorsal & Ventral Fins */}
          <path d="M42 38 Q64 12 84 38 M44 68 Q58 90 74 72" fill="#ff8a65" stroke="#e64a19" strokeWidth="1.8" />

          {/* Chubby Orange Body */}
          <ellipse cx="66" cy="54" rx="38" ry="26" fill="#ff7043" stroke="#d84315" strokeWidth="2.2" />

          {/* Crisp Wavy White Stripes with Dark Edging */}
          <g stroke="#ffffff" strokeWidth="8" strokeLinecap="round" fill="none">
            <path d="M44 32 Q36 53 44 76" />
            <path d="M68 28 Q58 53 68 80" />
          </g>
          <g stroke="#3e2723" strokeWidth="1.5" fill="none">
            <path d="M40 32 Q32 53 40 76 M48 32 Q40 53 48 76" />
            <path d="M64 28 Q54 53 64 80 M72 28 Q62 53 72 80" />
          </g>

          {/* Fluttery Pectoral Fin */}
          <path className="creature-fin" d="M68 60 Q52 78 50 62 Q56 50 68 60" fill="#ffab91" stroke="#ff5722" strokeWidth="1.8" />
          <Face x={84} y={50} spread={8} happy={happy} />
        </>
      );
      break;

    case 'bluefish':
      drawing = (
        <>
          {/* Canary Yellow Tail */}
          <path className="creature-tail" d="M36 48 Q14 28 8 34 L12 70 Q18 78 36 64 Z" fill="#ffd54f" stroke="#f57f17" strokeWidth="2" />
          {/* Top/Bottom Yellow Trim Fins */}
          <path d="M42 38 Q64 16 84 38 M44 68 Q58 88 74 70" fill="#ffd54f" stroke="#f57f17" strokeWidth="1.8" />

          {/* Sleek Royal Blue Body */}
          <ellipse cx="66" cy="54" rx="38" ry="26" fill="#1e88e5" stroke="#0d47a1" strokeWidth="2.2" />
          {/* Iconic Dark Blue Arc Pattern */}
          <path d="M40 36 Q58 26 80 34 Q58 38 48 62 L34 60 Z" fill="#0d47a1" />

          {/* Yellow Pectoral Fin */}
          <path className="creature-fin" d="M68 60 Q54 78 52 62 Q58 50 68 60" fill="#ffd54f" stroke="#f57f17" strokeWidth="1.8" />
          <Face x={84} y={50} spread={8} happy={happy} />
        </>
      );
      break;

    case 'angelfish':
      drawing = (
        <>
          {/* Tail */}
          <path className="creature-tail" d="M34 48 Q16 32 10 36 L13 68 Q20 76 35 62 Z" fill="#ffa726" stroke="#e65100" strokeWidth="2" />
          {/* Majestic Tall Angel Fins */}
          <path className="creature-fin" d="M38 40 L56 6 Q84 26 82 40 M40 66 L62 96 L82 66" fill="#ffb74d" stroke="#f57c00" strokeWidth="2" />

          {/* Tall Diamond Body */}
          <ellipse cx="66" cy="53" rx="38" ry="32" fill="#ffe082" stroke="#ffb300" strokeWidth="2.2" />
          {/* Warm Honey Stripes */}
          <g stroke="#f57c00" strokeWidth="6" strokeLinecap="round">
            <path d="M46 28 V78 M64 22 V84" />
          </g>

          {/* Pectoral Fin */}
          <path className="creature-fin" d="M68 59 Q54 74 52 60 Q57 51 68 59" fill="#fff9c4" stroke="#ffb74d" strokeWidth="1.6" />
          <Face x={84} y={49} spread={8} happy={happy} />
        </>
      );
      break;

    case 'pufferfish':
      drawing = (
        <>
          {/* Little Wiggle Tail */}
          <path className="creature-tail" d="M26 46 L8 36 L10 70 L28 62" fill="#ffd54f" stroke="#f57f17" strokeWidth="2" />

          {/* Perfectly Round Chubby Balloon with Rounded Spikes */}
          <path
            d="M32 28 L38 20 L44 24 L50 14 L56 22 L66 13 L71 23 L84 18 L86 29 L100 30 L96 41 L108 50 L100 60 L106 70 L95 74 L91 88 L80 83 L69 94 L61 85 L46 91 L42 80 L30 81 L31 68 L20 57 L28 46 L24 34 Z"
            fill="#fff59d"
            stroke="#fbc02d"
            strokeWidth="2.2"
          />
          {/* Warm Cream Belly Center */}
          <ellipse cx="66" cy="56" rx="33" ry="27" fill="#ffffff" opacity="0.6" />

          {/* Cute Freckle Dots */}
          <g fill="#fbc02d">
            <circle cx="48" cy="33" r="3.2" />
            <circle cx="68" cy="28" r="3.2" />
            <circle cx="36" cy="48" r="2.6" />
            <circle cx="90" cy="38" r="3.2" />
          </g>

          {/* Tiny Fluttery Fin */}
          <path className="creature-fin" d="M80 62 Q70 74 68 62 Q72 52 80 62" fill="#ffe082" stroke="#fbc02d" strokeWidth="1.5" />
          <Face x={70} y={53} spread={11} happy={happy} />
        </>
      );
      break;

    case 'shark':
      drawing = (
        <>
          {/* Shark Tail Fin */}
          <path className="creature-tail" d="M28 49 L6 26 L12 51 L5 74 L28 64 Z" fill="#64b5f6" stroke="#1976d2" strokeWidth="2.2" />
          {/* Dorsal & Pelvic Fins */}
          <path d="M52 35 Q56 12 68 10 L78 37 M54 68 L60 88 L79 66" fill="#42a5f5" stroke="#1565c0" strokeWidth="2.2" />

          {/* Streamlined Ocean Blue Body */}
          <path d="M24 48 Q62 20 98 38 Q115 46 115 56 Q110 78 64 78 Q38 77 24 62 Z" fill="#64b5f6" stroke="#1976d2" strokeWidth="2.2" />
          {/* Clean White Belly */}
          <path d="M32 63 Q74 88 112 59 Q102 79 64 76 Z" fill="#ffffff" />

          {/* Pectoral Fin */}
          <path className="creature-fin" d="M58 59 Q48 78 72 71 Z" fill="#42a5f5" stroke="#1976d2" strokeWidth="1.8" />
          {/* Cute Tiny White Tooth on Friendly Mouth */}
          <polygon points="98,54 102,54 100,58" fill="#ffffff" />
          {/* Gill Slits */}
          <path d="M72 45 L70 52 M67 45 L65 52 M62 45 L60 52" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" />

          <Face x={92} y={48} spread={8} happy={happy} />
        </>
      );
      break;

    case 'whale':
      drawing = (
        <>
          {/* Fluke Tail */}
          <path className="creature-tail" d="M36 64 Q14 72 8 46 Q22 48 26 42 Q22 30 10 28 Q36 24 42 50 Z" fill="#5c6bc0" stroke="#3949ab" strokeWidth="2.2" />

          {/* Gentle Giant Whale Body */}
          <path d="M28 54 Q32 28 66 26 Q108 20 114 50 Q122 84 68 84 Q32 84 28 54 Z" fill="#5c6bc0" stroke="#3949ab" strokeWidth="2.5" />
          {/* Pleated Accordion Belly */}
          <path d="M44 68 Q76 86 110 64 Q96 84 66 82 Z" fill="#e8eaf6" />
          <path d="M52 74 Q74 83 98 71 M58 78 Q74 85 88 77" stroke="#c5cae9" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Flippers */}
          <path className="creature-fin" d="M59 63 Q49 90 78 77" fill="#3f51b5" stroke="#303f9f" strokeWidth="2" />

          {/* Blowhole Water Spout & Mini Heart */}
          <path d="M68 22 Q60 6 54 14 M70 22 Q78 4 84 12" fill="none" stroke="#80deea" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M67 6 C67 4 69 2 70 4 C71 2 73 4 73 6 C73 9 70 11 70 11 C70 11 67 9 67 6 Z" fill="#ff80ab" />

          <Face x={88} y={50} spread={9} happy={happy} />
        </>
      );
      break;

    case 'octopus':
      drawing = (
        <>
          {/* 8 Wavy Tentacles with Suction Cups */}
          <g className="creature-tentacles" fill="none" stroke="#ba68c8" strokeWidth="9" strokeLinecap="round">
            <path d="M33 58 Q10 92 14 64 M43 64 Q24 105 30 75 M53 66 Q42 106 44 80 M60 68 Q57 101 61 84 M67 66 Q76 106 76 80 M77 64 Q96 106 91 75 M86 58 Q110 90 109 65 M57 69 Q56 91 51 90" />
          </g>
          {/* Suction Cups */}
          <g fill="#f8bbd0">
            <circle cx="16" cy="72" r="3" />
            <circle cx="28" cy="85" r="3" />
            <circle cx="43" cy="90" r="3" />
            <circle cx="75" cy="90" r="3" />
            <circle cx="92" cy="85" r="3" />
            <circle cx="106" cy="72" r="3" />
          </g>

          {/* Chubby Balloon Dome Head */}
          <path d="M26 52 Q22 16 60 14 Q98 16 94 52 Q88 74 60 72 Q32 74 26 52 Z" fill="#ce93d8" stroke="#8e24aa" strokeWidth="2.5" />
          {/* Glossy Head Highlight */}
          <path d="M36 38 Q38 22 52 24" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" opacity="0.75" />

          <Face x={60} y={46} spread={13} happy={happy} />
        </>
      );
      break;

    case 'squid':
      drawing = (
        <>
          {/* Top Arrowhead Wings */}
          <path className="creature-wings" d="M42 40 Q20 28 18 66 L43 60 M78 40 Q100 28 102 66 L77 60" fill="#ff8a80" stroke="#d32f2f" strokeWidth="2.2" />

          {/* Wavy Tentacles */}
          <g className="creature-tentacles" fill="none" stroke="#ffab91" strokeWidth="5.5" strokeLinecap="round">
            <path d="M42 64 Q24 99 28 76 M46 68 Q32 89 41 87 M51 70 L47 92 M55 72 L53 90 M59 71 Q52 101 61 96 M63 70 L64 92 M67 71 L73 92 M71 70 Q83 96 82 82 M75 67 Q95 105 96 79 M78 66 Q91 83 87 70" />
          </g>

          {/* Streamlined Mantle */}
          <path d="M60 8 Q30 26 36 60 Q38 78 60 78 Q84 78 84 60 Q88 26 60 8 Z" fill="#ffcdd2" stroke="#e57373" strokeWidth="2.5" />
          <path d="M46 32 L56 20" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />

          <Face x={60} y={52} spread={11} happy={happy} />
        </>
      );
      break;

    case 'jellyfish':
      drawing = (
        <>
          {/* Translucent Glowing Ribbons */}
          <g className="creature-tentacles" fill="none" strokeLinecap="round">
            <path d="M33 56 Q18 75 34 88 M45 59 Q56 78 41 94 M60 58 Q45 79 62 93 M74 58 Q85 76 73 95 M87 56 Q77 77 91 86" stroke="#b39ddb" strokeWidth="6" />
            <path d="M51 60 Q39 83 51 97 M79 61 Q69 87 78 97" stroke="#80deea" strokeWidth="3.5" />
          </g>

          {/* Glowing Translucent Mushroom Bell */}
          <path
            d="M20 52 Q22 12 60 10 Q98 12 100 52 Q88 66 78 56 Q68 68 60 58 Q48 68 40 56 Q28 66 20 52 Z"
            fill="#e1bee7"
            fillOpacity="0.88"
            stroke="#9c27b0"
            strokeWidth="2.5"
          />
          {/* Inner Bioluminescent Sparkle Glow */}
          <path d="M34 32 Q44 18 58 19" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.85" />
          <circle cx="48" cy="36" r="2.5" fill="#80deea" />
          <circle cx="72" cy="36" r="2.5" fill="#80deea" />

          <Face x={60} y={42} spread={12} happy={happy} />
        </>
      );
      break;

    case 'turtle':
      drawing = (
        <>
          {/* Large Paddle Flippers */}
          <g className="creature-fin" fill="#81c784" stroke="#2e7d32" strokeWidth="2.2">
            <path d="M38 40 Q16 6 10 22 Q14 42 38 50 M38 64 Q6 70 16 88 Q32 86 46 68 M62 38 Q66 18 82 24 L75 48 M62 65 Q65 88 82 84 L75 58" />
          </g>

          {/* Carapace Shell with Hexagonal Patterns */}
          <ellipse cx="51" cy="54" rx="33" ry="27" fill="#43a047" stroke="#1b5e20" strokeWidth="2.5" />
          <path d="M43 36 L61 38 L71 54 L59 71 L41 69 L32 52 Z" fill="#a5d6a7" stroke="#2e7d32" strokeWidth="2" />
          <path d="M43 36 L38 30 M61 38 L68 31 M71 54 H81 M59 71 L63 80 M41 69 L37 77 M32 52 H20" stroke="#2e7d32" strokeWidth="2" />

          {/* Peaceful Smiling Head */}
          <ellipse cx="92" cy="51" rx="22" ry="18" fill="#a5d6a7" stroke="#2e7d32" strokeWidth="2.2" />
          <Face x={94} y={49} spread={8} happy={happy} />
        </>
      );
      break;

    case 'seahorse':
      drawing = (
        <>
          {/* Dorsal Fin */}
          <path className="creature-fin" d="M55 48 L30 40 L36 68 L56 64" fill="#ffe082" stroke="#f57f17" strokeWidth="2" />

          {/* Golden Curled Body & Crown */}
          <path
            d="M61 19 Q48 17 43 25 L48 32 Q44 43 51 51 Q43 66 58 74 Q77 80 63 87 Q51 88 54 80 Q39 82 47 96 Q65 108 79 85 Q90 65 69 53 L68 45 Q83 49 100 42 L100 33 L80 32 Q80 14 61 19 Z"
            fill="#ffa726"
            stroke="#e65100"
            strokeWidth="2.5"
          />
          {/* Royal Crown Crest */}
          <path d="M61 19 L62 9 L69 15 L76 11 L79 23" fill="#ffd54f" stroke="#f57f17" strokeWidth="2" strokeLinejoin="round" />
          {/* Segment Ribs */}
          <path d="M55 58 L68 61 M56 65 L71 68 M60 73 L74 76" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />

          <Face x={64} y={34} spread={7} happy={happy} />
        </>
      );
      break;

    case 'ray':
      drawing = (
        <>
          {/* Slender Whip Tail */}
          <path className="creature-tail" d="M60 62 Q58 96 95 98" fill="none" stroke="#3f51b5" strokeWidth="4.5" strokeLinecap="round" />

          {/* Manta Pancake Wings */}
          <path
            className="creature-wings"
            d="M59 20 Q44 30 10 34 Q5 58 35 78 L59 68 L85 78 Q115 58 111 34 Q78 31 68 21 Z"
            fill="#9fa8da"
            stroke="#3949ab"
            strokeWidth="2.5"
          />
          {/* Gentle Lilac-White Belly */}
          <path d="M58 34 Q45 40 32 58 Q44 74 60 67 Q79 72 89 57 Q76 40 68 34 Z" fill="#ede7f6" />

          <Face x={60} y={46} spread={11} happy={happy} />
        </>
      );
      break;

    default:
      drawing = null;
  }

  return (
    <svg viewBox="0 0 120 104" className={`creature-art art-${id}`} aria-hidden="true">
      {colors && <defs>
        <radialGradient id={`${paintId}-body`} cx="32%" cy="24%" r="85%">
          <stop stopColor={colors[0]} /><stop offset=".6" stopColor={colors[1]} /><stop offset="1" stopColor={colors[2]} />
        </radialGradient>
        <radialGradient id={`${paintId}-glow`}>
          <stop stopColor="#fff8bb" stopOpacity=".9" /><stop offset=".5" stopColor="#f9de78" stopOpacity=".5" /><stop offset="1" stopColor="#f9de78" stopOpacity="0" />
        </radialGradient>
      </defs>}
      {drawing}
    </svg>
  );
});

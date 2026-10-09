import type { HabitatKind } from '../../data/habitatFriends';

export function HabitatBackdrop({ kind }: { kind: HabitatKind }) {
  return (
    <svg className="habitat-backdrop" viewBox="0 0 900 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {kind === 'aquarium' ? (
        <>
          {/* Shimmering Sun Rays / God Rays streaming from surface */}
          <g fill="#ffffff" opacity="0.12">
            <polygon points="120,-10 320,-10 580,640 480,640" />
            <polygon points="380,-10 520,-10 750,640 680,640" />
            <polygon points="620,-10 740,-10 880,640 820,640" />
          </g>

          {/* Deep Ocean Distant Seabed Layer */}
          <path d="M0 550 Q210 500 420 555 Q670 510 900 540 V640 H0 Z" fill="#d8e2dc" />

          {/* Foreground Golden Sand Dune */}
          <path d="M0 580 Q240 540 460 590 Q720 545 900 580 V640 H0 Z" fill="#faedcd" />
          <path d="M0 610 Q320 585 580 620 Q780 590 900 615 V640 H0 Z" fill="#e9d8a6" />

          {/* Swaying Kelp Forests & Corals */}
          {/* Left Kelp Forest */}
          <g fill="none" strokeLinecap="round">
            <path d="M60 620 Q105 530 75 460 Q40 390 75 330" stroke="#2a9d8f" strokeWidth="20" opacity="0.85" />
            <path d="M100 625 Q125 545 145 500 Q180 435 145 385" stroke="#52b788" strokeWidth="16" opacity="0.9" />
            <path d="M40 625 Q8 565 30 500 Q55 440 35 380" stroke="#74c69d" strokeWidth="14" opacity="0.8" />
          </g>

          {/* Right Coral & Kelp Cluster */}
          <g fill="none" strokeLinecap="round">
            <path d="M820 620 Q780 535 825 470 Q865 405 820 350" stroke="#2a9d8f" strokeWidth="18" opacity="0.85" />
            <path d="M855 625 Q875 550 890 515 Q920 465 885 410" stroke="#52b788" strokeWidth="15" opacity="0.9" />
            <path d="M780 625 Q770 555 745 520" stroke="#74c69d" strokeWidth="13" opacity="0.8" />
          </g>

          {/* Coral Reef Formations (Pink Sea Fan & Anemone) */}
          <g fill="none" strokeLinecap="round">
            {/* Right Sea Fan */}
            <path d="M720 630 V540 M720 590 Q685 592 688 565 M720 570 Q755 572 752 548 M698 570 L694 546 M742 563 L746 530" stroke="#ff70a6" strokeWidth="14" />
            {/* Left Coral */}
            <path d="M185 630 V560 M185 595 Q152 590 155 570 M185 580 Q205 578 208 558" stroke="#ff9770" strokeWidth="12" />
          </g>

          {/* Ocean Floor Rocks & Coral Mounts */}
          <g fill="#90a4ae">
            <ellipse cx="70" cy="625" rx="60" ry="16" />
            <ellipse cx="835" cy="626" rx="70" ry="18" />
          </g>

          {/* Clam Shell with Glowing Pearl */}
          <g transform="translate(390, 580)">
            {/* Clam Base */}
            <path d="M0 35 Q10 10 32 18 Q50 30 46 36 Z" fill="#ffccd5" stroke="#ff758f" strokeWidth="2.5" />
            {/* Clam Ribs */}
            <path d="M8 32 L18 17 M22 34 L28 17 M36 34 L38 23" stroke="#fff0f3" strokeWidth="3" strokeLinecap="round" />
            {/* Shiny Pearl */}
            <circle cx="24" cy="28" r="7" fill="#ffffff" stroke="#c8b6ff" strokeWidth="1.5" />
            <circle cx="22" cy="26" r="2.2" fill="#ffffff" />
          </g>

          {/* Friendly Starfish on Sand */}
          <g transform="translate(560, 600) rotate(12)">
            <polygon
              points="14,0 18,9 28,10 20,18 22,28 14,22 6,28 8,18 0,10 10,9"
              fill="#ff5964"
              stroke="#d90429"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="14" r="3" fill="#ffd166" />
          </g>

          {/* Pebbles & Shells */}
          <g fill="#c4b5fd" opacity="0.6">
            <ellipse cx="280" cy="615" rx="10" ry="5" />
            <ellipse cx="500" cy="628" rx="8" ry="4" />
            <ellipse cx="680" cy="618" rx="11" ry="5" />
          </g>

          {/* Ambient Rising Micro-Bubbles */}
          <g fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.45">
            <circle cx="62" cy="260" r="14" />
            <circle cx="70" cy="256" r="3" fill="#ffffff" />
            <circle cx="840" cy="320" r="10" />
            <circle cx="845" cy="317" r="2.2" fill="#ffffff" />
            <circle cx="730" cy="140" r="8" />
            <circle cx="210" cy="180" r="11" />
          </g>
        </>
      ) : (
        <>
          {/* Bug Garden Sunny Sky & Golden Sunlight Glow */}
          <g fill="#ffffff" opacity="0.14">
            <polygon points="0,0 260,0 420,640 180,640" />
            <polygon points="340,0 520,0 680,640 500,640" />
          </g>

          {/* Distant Lush Green Hills */}
          <path d="M0 460 Q220 370 460 460 Q700 370 900 420 V640 H0 Z" fill="#d8f3dc" />
          <path d="M0 520 Q240 420 540 540 Q730 450 900 480 V640 H0 Z" fill="#b7e4c7" />

          {/* Soft Winding Stepping Stone Pathway */}
          <path d="M280 640 Q430 540 330 460" fill="none" stroke="#fefae0" strokeWidth="68" strokeLinecap="round" opacity="0.88" />
          <path d="M280 640 Q430 540 330 460" fill="none" stroke="#e9edc9" strokeWidth="54" strokeLinecap="round" opacity="0.6" />

          {/* Layered Grass Clusters */}
          <g fill="#74c69d" stroke="#52b788" strokeWidth="2">
            <path d="M20 640 Q6 520 72 490 Q96 560 20 640 Z M32 610 Q78 520 130 565 Q106 620 32 610 Z" />
            <path d="M840 640 Q790 535 814 478 Q876 510 840 640 Z M848 595 Q858 510 900 500 V585 Z" />
          </g>

          {/* Tall Flower Stems */}
          <g stroke="#40916c" strokeWidth="5" fill="none" strokeLinecap="round">
            <path d="M125 590 V525 M760 590 V515 M670 620 V565 M240 625 V575" />
          </g>

          {/* Cheerful Blooming Garden Flowers */}
          {[
            { x: 125, y: 520, c: '#ff70a6', center: '#ffd166' },
            { x: 760, y: 510, c: '#ffd166', center: '#ff70a6' },
            { x: 670, y: 560, c: '#c77dff', center: '#ffd166' },
            { x: 240, y: 570, c: '#ff9770', center: '#ffffff' },
          ].map(flower => (
            <g key={flower.x} transform={`translate(${flower.x} ${flower.y})`} fill={flower.c}>
              <circle cx="-13" cy="0" r="11" />
              <circle cx="13" cy="0" r="11" />
              <circle cx="0" cy="-13" r="11" />
              <circle cx="0" cy="13" r="11" />
              <circle r="9.5" fill={flower.center} stroke="#ffffff" strokeWidth="1.5" />
            </g>
          ))}

          {/* Cute Red Toadstool Mushroom with White Polka Dots */}
          <g transform="translate(195, 595)">
            {/* Mushroom Stem */}
            <path d="M-8 6 L-10 26 Q0 30 10 26 L8 6 Z" fill="#fffbe7" stroke="#e0d7b5" strokeWidth="1.5" />
            {/* Red Cap */}
            <path d="M-28 6 Q-22 -32 0 -24 Q24 -28 29 6 Z" fill="#ff4d6d" stroke="#c9184a" strokeWidth="2.2" />
            {/* White Dots */}
            <circle cx="-8" cy="-8" r="5.5" fill="#ffffff" />
            <circle cx="14" cy="-3" r="4.5" fill="#ffffff" />
            <circle cx="4" cy="-17" r="3.5" fill="#ffffff" />
          </g>

          {/* Second Baby Mushroom */}
          <g transform="translate(610, 605)">
            <path d="M-6 4 L-7 20 Q0 24 7 20 L6 4 Z" fill="#fffbe7" />
            <path d="M-18 4 Q-14 -20 0 -16 Q16 -18 19 4 Z" fill="#ffb703" stroke="#fb8500" strokeWidth="2" />
            <circle cx="-4" cy="-6" r="3.5" fill="#ffffff" />
            <circle cx="9" cy="-3" r="3" fill="#ffffff" />
          </g>

          {/* Stepping Stone Pebbles */}
          <g fill="#d8e2dc">
            <ellipse cx="320" cy="540" rx="20" ry="10" />
            <ellipse cx="350" cy="575" rx="24" ry="12" fill="#ced4da" />
            <ellipse cx="300" cy="615" rx="28" ry="14" fill="#dee2e6" />
          </g>

          {/* Floating Dandelion Fluffs / Golden Pollen */}
          <g fill="#ffffff" opacity="0.8">
            <circle cx="85" cy="210" r="3.5" />
            <circle cx="160" cy="180" r="2.5" />
            <circle cx="780" cy="240" r="3" />
            <circle cx="840" cy="190" r="4" />
            <circle cx="480" cy="280" r="3" />
          </g>
        </>
      )}
    </svg>
  );
}

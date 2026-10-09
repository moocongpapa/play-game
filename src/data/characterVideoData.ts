import { CharacterId } from '../types';

export interface VideoScene {
  timeStart: number; // in seconds (0..30)
  timeEnd: number;
  title: string;
  subtitle: string;
  voiceText: string;
  mood: 'happy' | 'dancing' | 'waving' | 'excited';
  bgGradient: string;
  bgDecorations: string[]; // Emojis floating in background
  actionBadge: string;
  storyPrompt?: string;
}

export interface CharacterVideoData {
  characterId: CharacterId;
  title: string;
  tagline: string;
  themeColor: string;
  borderColor: string;
  hasVideo?: boolean; // Whether official video is completed
  videoUrl?: string; // MP4 video URL if available
  storyTheme?: string;
  commonStyle?: string;
  videoPrompt?: string;
  dubbingScript?: string;
  scenes: VideoScene[];
}

export const COMMON_VIDEO_STYLE =
  '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 4k 24fps.';

export const CHARACTER_VIDEOS: Record<CharacterId, CharacterVideoData> = {
  pingu: {
    characterId: 'pingu',
    title: '🐧 핑구의 반짝반짝 얼음 미끄럼틀과 눈사람 쇼!',
    tagline: '민트 목도리를 두르고 얼음 미끄럼틀을 타며 눈사람을 만드는 사랑스러운 아기 펭귄 핑구!',
    themeColor: '#84C9BB',
    borderColor: '#66AEBB',
    hasVideo: true,
    videoUrl: '/videos/pingu.mp4',
    storyTheme: '반짝반짝 얼음 미끄럼틀과 눈사람 만들기',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second whimsical 3D claymation cartoon featuring Pingu, an adorable baby penguin wearing a cozy mint-green knitted scarf.\n- 00s-08s (Scene 1 - Greeting): Pingu waddles excitedly out of an igloo onto sparkling soft snow, trips slightly, catches balance, and waves both wings happily toward the camera with a cheerful smile.\n- 08s-16s (Scene 2 - Fun Play): Pingu spots a gentle baby ice slide, belly-slides down smoothly with sparkles trailing behind, giggling as it splashes softly into a pile of fluffy snow.\n- 16s-24s (Scene 3 - Creative Moment): Pingu rolls a tiny snowball that grows into a cute mini snowman, placing a mint flower on its head and clapping wings with pride.\n- 24s-30s (Scene 4 - Hug Ending): Pingu waddles close to the screen, taps the glass lightly, blows a glowing icy heart toward Yuha, and gives a warm penguin bow.`,
    dubbingScript: '안녕 유하야! 나는 핑구야! 슈웅~ 눈 미끄럼틀 정말 신난다! 짜잔, 나와 닮은 눈사람도 만들었어! 유하야, 오늘도 나랑 신나게 놀자! 사랑해~',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 반가운 첫인사 (00s-08s)',
        subtitle: '안녕 유하야! 나는 핑구야!',
        voiceText: '안녕 유하야! 나는 핑구야!',
        mood: 'waving',
        bgGradient: 'from-[#E0F7FA] via-[#B2EBF2] to-[#80DEEA]',
        bgDecorations: ['🐧', '❄️', '✨', '🧣'],
        actionBadge: '🐧 뒤뚱뒤뚱 반가운 인사',
        storyPrompt:
          'Pingu waddles excitedly out of an igloo onto sparkling soft snow, trips slightly, catches balance, and waves both wings happily toward the camera with a cheerful smile.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 슈웅~ 눈 미끄럼틀 (08s-16s)',
        subtitle: '슈웅~ 눈 미끄럼틀 정말 신난다!',
        voiceText: '슈웅~ 눈 미끄럼틀 정말 신난다!',
        mood: 'dancing',
        bgGradient: 'from-[#B2EBF2] via-[#80DEEA] to-[#4DD0E1]',
        bgDecorations: ['🛝', '❄️', '✨', '🫧'],
        actionBadge: '🛝 슈웅~ 얼음 미끄럼틀',
        storyPrompt:
          'Pingu spots a gentle baby ice slide, belly-slides down smoothly with sparkles trailing behind, giggling as it splashes softly into a pile of fluffy snow.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 나와 닮은 미니 눈사람 (16s-24s)',
        subtitle: '짜잔, 나와 닮은 눈사람도 만들었어!',
        voiceText: '짜잔, 나와 닮은 눈사람도 만들었어!',
        mood: 'excited',
        bgGradient: 'from-[#E0F7FA] via-[#80DEEA] to-[#26C6DA]',
        bgDecorations: ['⛄', '🌸', '❄️', '⭐'],
        actionBadge: '⛄ 귀여운 눈사람 완성!',
        storyPrompt:
          'Pingu rolls a tiny snowball that grows into a cute mini snowman, placing a mint flower on its head and clapping wings with pride.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 사랑의 얼음 하트 (24s-30s)',
        subtitle: '유하야, 오늘도 나랑 신나게 놀자! 사랑해~',
        voiceText: '유하야, 오늘도 나랑 신나게 놀자! 사랑해~',
        mood: 'happy',
        bgGradient: 'from-[#E0F7FA] via-[#B2EBF2] to-[#80DEEA]',
        bgDecorations: ['💖', '❄️', '🌟', '🐧'],
        actionBadge: '💖 사랑의 얼음 하트 뿅뿅',
        storyPrompt:
          'Pingu waddles close to the screen, taps the glass lightly, blows a glowing icy heart toward Yuha, and gives a warm penguin bow.',
      },
    ],
  },
  ggomi: {
    characterId: 'ggomi',
    title: '🐻 꼬미의 달콤한 딸기 컵케이크와 포근한 포옹 쇼!',
    tagline: '분홍 리본을 달고 달콤한 딸기 컵케이크를 만들어 선물하는 포근한 곰돌이 꼬미!',
    themeColor: '#FFB74D',
    borderColor: '#FFA000',
    hasVideo: true,
    videoUrl: '/videos/ggomi.mp4',
    storyTheme: '달콤한 딸기 컵케이크와 포근한 포옹',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second heartwarming 3D claymation featuring Ggomi, a chubby, caramel-brown teddy bear with a pastel pink ribbon on its left ear.\n- 00s-08s (Scene 1 - Peekaboo): Ggomi peeks out from behind a giant fluffy pink pillow in a cozy nursery room, giggling softly and waving with both padded paws.\n- 08s-16s (Scene 2 - Making Treat): Ggomi sits at a small wooden table, carefully placing a bright red strawberry on top of a whipped cream cupcake, licking its lips cutely.\n- 16s-24s (Scene 3 - Happy Dance): Holding the cupcake, Ggomi does a gentle side-to-side wiggle dance, surrounded by floating pink sparkles and musical notes.\n- 24s-30s (Scene 4 - Sharing Love): Ggomi offers the cupcake toward the camera, then spreads arms wide for a warm, soft bear hug, smiling with sparkling eyes.`,
    dubbingScript:
      '까꿍! 유하야 안녕? 꼬미가 유하 주려고 달콤한 딸기 케이크를 만들었어! 냠냠 맛있겠지? 유하 생각만 해도 꼬미는 매일매일 행복해. 포근포근 꼭 안아줄게!',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 까꿍 놀이와 반가운 인사 (00s-08s)',
        subtitle: '까꿍! 유하야 안녕?',
        voiceText: '까꿍! 유하야 안녕?',
        mood: 'waving',
        bgGradient: 'from-[#FFF0F5] via-[#FFD1DC] to-[#FFB6C1]',
        bgDecorations: ['🎀', '⭐', '☁️', '💖'],
        actionBadge: '🐻 까꿍! 반가운 꼬미',
        storyPrompt:
          'Ggomi peeks out from behind a giant fluffy pink pillow in a cozy nursery room, giggling softly and waving with both padded paws.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 달콤한 딸기 컵케이크 (08s-16s)',
        subtitle: '꼬미가 유하 주려고 달콤한 딸기 케이크를 만들었어!',
        voiceText: '꼬미가 유하 주려고 달콤한 딸기 케이크를 만들었어!',
        mood: 'excited',
        bgGradient: 'from-[#FFF0F5] via-[#FFE4E1] to-[#FFB6C1]',
        bgDecorations: ['🧁', '🍓', '🍰', '✨'],
        actionBadge: '🧁 달콤 딸기 컵케이크',
        storyPrompt:
          'Ggomi sits at a small wooden table, carefully placing a bright red strawberry on top of a whipped cream cupcake, licking its lips cutely.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 냠냠 맛있는 댄스 (16s-24s)',
        subtitle: '냠냠 맛있겠지? 유하 생각만 해도 꼬미는 매일매일 행복해.',
        voiceText: '냠냠 맛있겠지? 유하 생각만 해도 꼬미는 매일매일 행복해.',
        mood: 'dancing',
        bgGradient: 'from-[#FFD1DC] via-[#FFB6C1] to-[#FF69B4]',
        bgDecorations: ['✨', '🎵', '🎶', '🎀'],
        actionBadge: '💃 흔들흔들 냠냠 댄스',
        storyPrompt:
          'Holding the cupcake, Ggomi does a gentle side-to-side wiggle dance, surrounded by floating pink sparkles and musical notes.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 사랑 나눔과 포근한 포옹 (24s-30s)',
        subtitle: '포근포근 꼭 안아줄게! 사랑해~',
        voiceText: '포근포근 꼭 안아줄게!',
        mood: 'happy',
        bgGradient: 'from-[#FFF0F5] via-[#FFD1DC] to-[#FFB6C1]',
        bgDecorations: ['💖', '🌟', '🐻', '🧸'],
        actionBadge: '🤗 포근포근 곰돌이 포옹',
        storyPrompt:
          'Ggomi offers the cupcake toward the camera, then spreads arms wide for a warm, soft bear hug, smiling with sparkling eyes.',
      },
    ],
  },

  rano: {
    characterId: 'rano',
    title: '🦖 라노의 쿵쿵 발구르기와 무지개 알 쇼!',
    tagline: '씩씩하게 발을 구르며 무지개 알에서 퐁퐁 터지는 방울과 노는 아기 공룡 라노!',
    themeColor: '#81C784',
    borderColor: '#4CAF50',
    hasVideo: true,
    videoUrl: '/videos/rano.mp4',
    storyTheme: '쿵쿵 발구르기와 무지개 알 찾기',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second energetic and cute 3D claymation featuring Rano, a cheerful pastel-green baby dinosaur with soft yellow round dorsal plates.\n- 00s-08s (Scene 1 - Brave Roar): Rano pops out from behind a giant leafy fern, stomps its chubby feet playfully, and lets out a tiny, adorable "Roar!" before giggling.\n- 08s-16s (Scene 2 - Discovery): Rano hops through colorful prehistoric flower bushes and discovers a glowing rainbow-spotted dinosaur egg wobbling on a mossy stone.\n- 16s-24s (Scene 3 - Hatching Joy): The egg gently cracks open and pops out a bunch of flying soap bubbles! Rano jumps in the air, popping bubbles with its little snout and tail.\n- 24s-30s (Scene 4 - High-Five): Rano dashes toward the camera, gives an energetic high-five against the screen, and flexes its tiny arms proudly.`,
    dubbingScript:
      '크와앙! 씩씩한 아기공룡 라노 등장! 쿵쿵 발을 구르면 기분이 최고야! 와, 무지개 알에서 알록달록 방울이 퐁퐁 튀어나오네! 유하야, 나랑 힘차게 하이파이브!',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 씩씩한 포효와 등장 (00s-08s)',
        subtitle: '크와앙! 씩씩한 아기공룡 라노 등장!',
        voiceText: '크와앙! 씩씩한 아기공룡 라노 등장!',
        mood: 'waving',
        bgGradient: 'from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]',
        bgDecorations: ['🦖', '⭐', '☁️', '🌈'],
        actionBadge: '🦖 씩씩한 아기공룡',
        storyPrompt:
          'Rano pops out from behind a giant leafy fern, stomps its chubby feet playfully, and lets out a tiny, adorable "Roar!" before giggling.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 쿵쿵 발구르기 (08s-16s)',
        subtitle: '쿵쿵 발을 구르면 기분이 최고야!',
        voiceText: '쿵쿵 발을 구르면 기분이 최고야!',
        mood: 'dancing',
        bgGradient: 'from-[#C8E6C9] via-[#81C784] to-[#4CAF50]',
        bgDecorations: ['🌈', '✨', '⭐', '🐾'],
        actionBadge: '🪨 쿵쿵 발구르기',
        storyPrompt:
          'Rano hops through colorful prehistoric flower bushes and discovers a glowing rainbow-spotted dinosaur egg wobbling on a mossy stone.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 무지개 알과 방울 퐁퐁 (16s-24s)',
        subtitle: '와, 무지개 알에서 알록달록 방울이 퐁퐁 튀어나오네!',
        voiceText: '와, 무지개 알에서 알록달록 방울이 퐁퐁 튀어나오네!',
        mood: 'excited',
        bgGradient: 'from-[#E8F5E9] via-[#A5D6A7] to-[#81C784]',
        bgDecorations: ['🫧', '✨', '🌟', '🦖'],
        actionBadge: '🫧 무지개 방울 퐁퐁',
        storyPrompt:
          'The egg gently cracks open and pops out a bunch of flying soap bubbles! Rano jumps in the air, popping bubbles with its little snout and tail.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 힘찬 하이파이브 (24s-30s)',
        subtitle: '유하야, 나랑 힘차게 하이파이브!',
        voiceText: '유하야, 나랑 힘차게 하이파이브!',
        mood: 'happy',
        bgGradient: 'from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]',
        bgDecorations: ['🎉', '💪', '💖', '🦖'],
        actionBadge: '✋ 힘찬 하이파이브',
        storyPrompt:
          'Rano dashes toward the camera, gives an energetic high-five against the screen, and flexes its tiny arms proudly.',
      },
    ],
  },

  jelly: {
    characterId: 'jelly',
    title: '🐰 젤리의 깡충깡충 당근 정원과 나비 친구 쇼!',
    tagline: '분홍 볼을 붉히며 커다란 당근을 뽑고 나비 친구와 하트를 만드는 아기 토끼 젤리!',
    themeColor: '#F48FB1',
    borderColor: '#EC407A',
    hasVideo: true,
    videoUrl: '/videos/jelly.mp4',
    storyTheme: '깡충깡충 당근 정원과 나비 친구',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second bubbly 3D claymation featuring Jelly, a sweet creamy-white bunny with pastel pink floppy ears and rosy blush cheeks.\n- 00s-08s (Scene 1 - Bouncing In): Jelly bounces rhythmically into a sunny vegetable garden, long ears flopping happily, stopping to twitch its pink nose at the camera.\n- 08s-16s (Scene 2 - Big Carrot): Jelly tries to pull a huge cartoon carrot from the ground; with a big tug, it plops backward softly onto a bed of clover leaves, laughing cheerfully.\n- 16s-24s (Scene 3 - Butterfly Waltz): A sparkling yellow butterfly lands gently on Jelly's nose. Jelly giggles, sneezes softly, and spins around playing tag with the butterfly.\n- 24s-30s (Scene 4 - Finger Heart): Jelly sits up, makes a cute heart shape with its long bunny ears, and sends flying kisses toward the screen.`,
    dubbingScript:
      '깡충깡충! 안녕 유하야, 젤리야! 영차영차~ 커다란 당근 뽑기 성공! 어라? 나비 친구가 코를 간지럽히네? 에취! 유하야, 젤리 귀로 하트 만들어줄게. 뿅뿅!',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 깡충깡충 반가운 등장 (00s-08s)',
        subtitle: '깡충깡충! 안녕 유하야, 젤리야!',
        voiceText: '깡충깡충! 안녕 유하야, 젤리야!',
        mood: 'waving',
        bgGradient: 'from-[#FCE4EC] via-[#F8BBD0] to-[#F48FB1]',
        bgDecorations: ['🐰', '🫧', '🌸', '💖'],
        actionBadge: '🐰 깡충깡충 젤리',
        storyPrompt:
          'Jelly bounces rhythmically into a sunny vegetable garden, long ears flopping happily, stopping to twitch its pink nose at the camera.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 커다란 당근 뽑기 (08s-16s)',
        subtitle: '영차영차~ 커다란 당근 뽑기 성공!',
        voiceText: '영차영차~ 커다란 당근 뽑기 성공!',
        mood: 'excited',
        bgGradient: 'from-[#F8BBD0] via-[#F06292] to-[#EC407A]',
        bgDecorations: ['🥕', '✨', '🎈', '💖'],
        actionBadge: '🥕 커다란 당근 쑥~',
        storyPrompt:
          'Jelly tries to pull a huge cartoon carrot from the ground; with a big tug, it plops backward softly onto a bed of clover leaves, laughing cheerfully.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 나비 친구와 에취! (16s-24s)',
        subtitle: '어라? 나비 친구가 코를 간지럽히네? 에취!',
        voiceText: '어라? 나비 친구가 코를 간지럽히네? 에취!',
        mood: 'dancing',
        bgGradient: 'from-[#FCE4EC] via-[#F48FB1] to-[#F06292]',
        bgDecorations: ['🦋', '🌸', '✨', '🐰'],
        actionBadge: '🦋 나비와 에취!',
        storyPrompt:
          'A sparkling yellow butterfly lands gently on Jelly\'s nose. Jelly giggles, sneezes softly, and spins around playing tag with the butterfly.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 토끼 귀 하트 뿅뿅 (24s-30s)',
        subtitle: '유하야, 젤리 귀로 하트 만들어줄게. 뿅뿅!',
        voiceText: '유하야, 젤리 귀로 하트 만들어줄게. 뿅뿅!',
        mood: 'happy',
        bgGradient: 'from-[#FCE4EC] via-[#F8BBD0] to-[#F48FB1]',
        bgDecorations: ['💖', '🎉', '🌟', '🐰'],
        actionBadge: '💖 토끼 귀 하트 뿅뿅',
        storyPrompt:
          'Jelly sits up, makes a cute heart shape with its long bunny ears, and sends flying kisses toward the screen.',
      },
    ],
  },

  dochi: {
    characterId: 'dochi',
    title: '🦔 도치의 또르르 구르기와 황금 도토리 쇼!',
    tagline: '밤송이 몸을 데굴데굴 굴리며 반짝이는 황금 도토리와 단풍잎 왕관을 찾는 아기 고슴도치 도치!',
    themeColor: '#CE93D8',
    borderColor: '#AB47BC',
    hasVideo: true,
    videoUrl: '/videos/dochi.mp4',
    storyTheme: '또르르 구르기와 반짝이는 도토리 보물',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second curious and sweet 3D claymation featuring Dochi, a round little hedgehog with soft, rounded chocolate-brown spines and a cute button nose.\n- 00s-08s (Scene 1 - Rolling Ball): A round prickly ball rolls in through autumn leaves, unfurls, and reveals Dochi’s adorable face blinking curiously at the viewer.\n- 08s-16s (Scene 2 - Treasure Hunt): Dochi sniffs the ground and finds a giant shiny golden acorn. It polishes the acorn with its little tummy until it gleams.\n- 16s-24s (Scene 3 - Leaf Crown): Leaves fall gently; Dochi sticks three colorful maple leaves onto its back spines like a festive crown and wiggles with joy.\n- 24s-30s (Scene 4 - Peeking Wave): Dochi curls into a ball, peeks one eye out, giggles, and waves its tiny paw warmly.`,
    dubbingScript:
      '또르르르~ 짠! 호기심 대장 도치 등장! 킁킁, 숲속에서 반짝이는 황금 도토리를 찾았어! 예쁜 단풍잎 왕관도 썼지롱. 유하야, 나랑 재미있는 보물 찾으러 가볼까?',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 또르르 굴러서 짠! (00s-08s)',
        subtitle: '또르르르~ 짠! 호기심 대장 도치 등장!',
        voiceText: '또르르르~ 짠! 호기심 대장 도치 등장!',
        mood: 'waving',
        bgGradient: 'from-[#F3E5F5] via-[#E1BEE7] to-[#CE93D8]',
        bgDecorations: ['🦔', '⭐', '🍂', '✨'],
        actionBadge: '🦔 또르르 도치 등장',
        storyPrompt:
          'A round prickly ball rolls in through autumn leaves, unfurls, and reveals Dochi’s adorable face blinking curiously at the viewer.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 황금 도토리 발견 (08s-16s)',
        subtitle: '킁킁, 숲속에서 반짝이는 황금 도토리를 찾았어!',
        voiceText: '킁킁, 숲속에서 반짝이는 황금 도토리를 찾았어!',
        mood: 'excited',
        bgGradient: 'from-[#E1BEE7] via-[#AB47BC] to-[#8E24AA]',
        bgDecorations: ['🌰', '🌟', '✨', '💫'],
        actionBadge: '🌰 반짝 황금 도토리',
        storyPrompt:
          'Dochi sniffs the ground and finds a giant shiny golden acorn. It polishes the acorn with its little tummy until it gleams.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 예쁜 단풍잎 왕관 (16s-24s)',
        subtitle: '예쁜 단풍잎 왕관도 썼지롱!',
        voiceText: '예쁜 단풍잎 왕관도 썼지롱!',
        mood: 'dancing',
        bgGradient: 'from-[#F3E5F5] via-[#CE93D8] to-[#AB47BC]',
        bgDecorations: ['🍁', '🍂', '👑', '🦔'],
        actionBadge: '👑 예쁜 단풍잎 왕관',
        storyPrompt:
          'Leaves fall gently; Dochi sticks three colorful maple leaves onto its back spines like a festive crown and wiggles with joy.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 신나는 보물 찾기 (24s-30s)',
        subtitle: '유하야, 나랑 재미있는 보물 찾으러 가볼까?',
        voiceText: '유하야, 나랑 재미있는 보물 찾으러 가볼까?',
        mood: 'happy',
        bgGradient: 'from-[#F3E5F5] via-[#E1BEE7] to-[#CE93D8]',
        bgDecorations: ['🌙', '⭐', '💖', '🦔'],
        actionBadge: '✨ 신나는 보물 찾기',
        storyPrompt:
          'Dochi curls into a ball, peeks one eye out, giggles, and waves its tiny paw warmly.',
      },
    ],
  },

  ggulgguli: {
    characterId: 'ggulgguli',
    title: '🐷 꿀꿀이의 딸기 냠냠과 비눗방울 목욕 쇼!',
    tagline: '통통한 코를 씰룩이고 딸기를 냠냠 먹으며 비눗방울 목욕을 즐기는 아기 돼지 꿀꿀이!',
    themeColor: '#FFAB91',
    borderColor: '#FF7043',
    hasVideo: true,
    videoUrl: '/videos/ggulgguli.mp4',
    storyTheme: '첨벙첨벙 딸기 우유 웅덩이와 비눗방울 풍선',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second playful 3D claymation featuring Ggulgguli, a chubby, rosy-pink piglet with a curly spring tail and a big friendly snout.\n- 00s-08s (Scene 1 - Snout Wiggle): Ggulgguli wiggles its round snout directly in front of the lens with funny sound effects, then steps back dancing on its hind hooves.\n- 08s-16s (Scene 2 - Strawberry Feast): Ggulgguli spots a bowl of giant juicy strawberries, juggles three of them cutely, and munches happily with puffed cheeks.\n- 16s-24s (Scene 3 - Bubble Bath): Ggulgguli jumps playfully into a shallow warm bubble pool, splashing pink bubbles everywhere and wearing a bubble hat.\n- 24s-30s (Scene 4 - Tail Wag): Ggulgguli turns around, wiggles its curly tail like a propeller, and turns back to give a huge cheerful smile.`,
    dubbingScript:
      '꿀꿀! 유하야 안녕? 난 맛있는 걸 제일 좋아하는 꿀꿀이야! 딸기 세 개를 냠냠~ 보글보글 거품 목욕도 정말 시원해! 내 꼬리 뱅글뱅글 돌아가는 것 좀 봐! 헤헤~',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 귀여운 코 씰룩 인사 (00s-08s)',
        subtitle: '꿀꿀! 유하야 안녕? 난 맛있는 걸 제일 좋아하는 꿀꿀이야!',
        voiceText: '꿀꿀! 유하야 안녕? 난 맛있는 걸 제일 좋아하는 꿀꿀이야!',
        mood: 'waving',
        bgGradient: 'from-[#FBE9E7] via-[#FFCCBC] to-[#FFAB91]',
        bgDecorations: ['🐷', '🍓', '🍰', '✨'],
        actionBadge: '🐷 꿀꿀이 코 씰룩',
        storyPrompt:
          'Ggulgguli wiggles its round snout directly in front of the lens with funny sound effects, then steps back dancing on its hind hooves.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 맛있는 딸기 파티 (08s-16s)',
        subtitle: '딸기 세 개를 냠냠~',
        voiceText: '딸기 세 개를 냠냠~',
        mood: 'excited',
        bgGradient: 'from-[#FFCCBC] via-[#FF7043] to-[#F4511E]',
        bgDecorations: ['🍓', '🍰', '😋', '🎉'],
        actionBadge: '🍓 딸기 세 개 냠냠',
        storyPrompt:
          'Ggulgguli spots a bowl of giant juicy strawberries, juggles three of them cutely, and munches happily with puffed cheeks.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 보글보글 거품 목욕 (16s-24s)',
        subtitle: '보글보글 거품 목욕도 정말 시원해!',
        voiceText: '보글보글 거품 목욕도 정말 시원해!',
        mood: 'dancing',
        bgGradient: 'from-[#FBE9E7] via-[#FFAB91] to-[#FF7043]',
        bgDecorations: ['🫧', '🛁', '✨', '❤️'],
        actionBadge: '🫧 보글보글 거품 목욕',
        storyPrompt:
          'Ggulgguli jumps playfully into a shallow warm bubble pool, splashing pink bubbles everywhere and wearing a bubble hat.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 꼬리 프로펠러 댄스 (24s-30s)',
        subtitle: '내 꼬리 뱅글뱅글 돌아가는 것 좀 봐! 헤헤~',
        voiceText: '내 꼬리 뱅글뱅글 돌아가는 것 좀 봐! 헤헤~',
        mood: 'happy',
        bgGradient: 'from-[#FBE9E7] via-[#FFCCBC] to-[#FFAB91]',
        bgDecorations: ['💖', '✨', '🌟', '🐷'],
        actionBadge: '🌀 꼬리 프로펠러 댄스',
        storyPrompt:
          'Ggulgguli turns around, wiggles its curly tail like a propeller, and turns back to give a huge cheerful smile.',
      },
    ],
  },

  eumme: {
    characterId: 'eumme',
    title: '🐑 음메의 솜사탕 구름과 별빛 요람 쇼!',
    tagline: '폭신폭신 구름 침대에 누워 반짝이는 별을 잡고 다정한 자장가를 건네는 아기 양 음메!',
    themeColor: '#90CAF9',
    borderColor: '#42A5F5',
    hasVideo: true,
    videoUrl: '/videos/eumme.mp4',
    storyTheme: '몽실몽실 솜사탕 구름과 별빛 요람',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second dreamy and soothing 3D claymation featuring Eumme, an ultra-fluffy white lamb with gentle lavender-blue horns and a sleepy sweet smile.\n- 00s-08s (Scene 1 - Cloud Drift): Eumme floats gently into the lavender pastel sky sitting atop a fluffy pink cotton-candy cloud, humming a soft tune.\n- 08s-16s (Scene 2 - Star Catching): Eumme reaches out a tiny hoof and catches a falling yellow star, which glows softly and chimes like a music box.\n- 16s-24s (Scene 3 - Cloud Pillow): Eumme fluffs up a mini cloud like a marshmallow pillow, rests its head, and yawns cutely as tiny crescent moons float by.\n- 24s-30s (Scene 4 - Sweet Dreams): Eumme waves slowly and warmly, eyes twinkling with kindness, surrounded by soft celestial glow.`,
    dubbingScript:
      '음메~ 포근한 아기양 음메예요. 둥실둥실 구름 침대에 누워 반짝이는 별을 잡았어요. 우리 유하 마음도 구름처럼 폭신폭신해지길 바랄게요. 좋은 꿈 꿔요~',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 포근한 구름 인사 (00s-08s)',
        subtitle: '음메~ 포근한 아기양 음메예요.',
        voiceText: '음메~ 포근한 아기양 음메예요.',
        mood: 'waving',
        bgGradient: 'from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9]',
        bgDecorations: ['🐑', '☁️', '🎈', '🕊️'],
        actionBadge: '🐑 솜사탕 구름 음메',
        storyPrompt:
          'Eumme floats gently into the lavender pastel sky sitting atop a fluffy pink cotton-candy cloud, humming a soft tune.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 반짝이는 별 잡기 (08s-16s)',
        subtitle: '둥실둥실 구름 침대에 누워 반짝이는 별을 잡았어요.',
        voiceText: '둥실둥실 구름 침대에 누워 반짝이는 별을 잡았어요.',
        mood: 'dancing',
        bgGradient: 'from-[#BBDEFB] via-[#42A5F5] to-[#1E88E5]',
        bgDecorations: ['⭐', '🌟', '🌈', '✨'],
        actionBadge: '⭐ 반짝이는 별 잡기',
        storyPrompt:
          'Eumme reaches out a tiny hoof and catches a falling yellow star, which glows softly and chimes like a music box.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 폭신폭신 구름 베개 (16s-24s)',
        subtitle: '우리 유하 마음도 구름처럼 폭신폭신해지길 바랄게요.',
        voiceText: '우리 유하 마음도 구름처럼 폭신폭신해지길 바랄게요.',
        mood: 'excited',
        bgGradient: 'from-[#E3F2FD] via-[#90CAF9] to-[#42A5F5]',
        bgDecorations: ['☁️', '🌙', '🌸', '💖'],
        actionBadge: '☁️ 폭신폭신 구름 베개',
        storyPrompt:
          'Eumme fluffs up a mini cloud like a marshmallow pillow, rests its head, and yawns cutely as tiny crescent moons float by.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 달콤한 꿈나라 (24s-30s)',
        subtitle: '좋은 꿈 꿔요~',
        voiceText: '좋은 꿈 꿔요~',
        mood: 'happy',
        bgGradient: 'from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9]',
        bgDecorations: ['✨', '💖', '🌙', '🐑'],
        actionBadge: '🌙 달콤한 꿈나라',
        storyPrompt:
          'Eumme waves slowly and warmly, eyes twinkling with kindness, surrounded by soft celestial glow.',
      },
    ],
  },

  nurungji: {
    characterId: 'nurungji',
    title: '🐶 누룽지의 뼈다귀 공놀이와 신나는 달리기 쇼!',
    tagline: '꼬리를 헬리콥터처럼 살랑이며 빨간 공을 굴리고 반짝이는 별을 찾는 골든 강아지 누룽지!',
    themeColor: '#FFE082',
    borderColor: '#FFA000',
    hasVideo: true,
    videoUrl: '/videos/nurungji.mp4',
    storyTheme: '뼈다귀 공놀이와 신나는 달리기',
    commonStyle: COMMON_VIDEO_STYLE,
    videoPrompt: `${COMMON_VIDEO_STYLE}\n\nA 30-second lively 3D claymation featuring Nurungji, an adorable honey-golden puppy with floppy ears and a tail that wags like a helicopter.\n- 00s-08s (Scene 1 - Bounding Run): Nurungji trots happily across a green meadow holding a red squeaky ball in its mouth, stopping to tilt its head with perked ears.\n- 08s-16s (Scene 2 - Catch & Roll): Nurungji tosses the ball with its nose, chases it in circles, and rolls over onto its back asking for tummy rubs.\n- 16s-24s (Scene 3 - Digging Fun): Nurungji digs energetically in a sandbox, pulling out a sparkling toy star and doing an excited tail-spin dance.\n- 24s-30s (Scene 4 - Screen Lick): Nurungji trots up to the lens, gently gives a cute cartoon "lick" on the screen, and barks joyfully with a panting smile.`,
    dubbingScript:
      '멍멍! 꼬리 살랑살랑 누룽지야! 유하야, 공놀이 정말 신난다! 모래밭에서 반짝이는 별도 찾았어! 유하가 너무 좋아서 뽀뽀 츄~ 해줄래! 언제나 유하 곁에 있을게!',
    scenes: [
      {
        timeStart: 0,
        timeEnd: 8.0,
        title: '장면 1: 꼬리 살랑 신나는 등장 (00s-08s)',
        subtitle: '멍멍! 꼬리 살랑살랑 누룽지야!',
        voiceText: '멍멍! 꼬리 살랑살랑 누룽지야!',
        mood: 'waving',
        bgGradient: 'from-[#FFF8E1] via-[#FFECB3] to-[#FFE082]',
        bgDecorations: ['🐶', '🎾', '🐾', '💛'],
        actionBadge: '🐶 빨간 공 누룽지',
        storyPrompt:
          'Nurungji trots happily across a green meadow holding a red squeaky ball in its mouth, stopping to tilt its head with perked ears.',
      },
      {
        timeStart: 8.0,
        timeEnd: 16.0,
        title: '장면 2: 신나는 공놀이 (08s-16s)',
        subtitle: '유하야, 공놀이 정말 신난다!',
        voiceText: '유하야, 공놀이 정말 신난다!',
        mood: 'dancing',
        bgGradient: 'from-[#FFECB3] via-[#FFA000] to-[#FF8F00]',
        bgDecorations: ['🎾', '🦴', '✨', '🐾'],
        actionBadge: '🎾 데굴데굴 공놀이',
        storyPrompt:
          'Nurungji tosses the ball with its nose, chases it in circles, and rolls over onto its back asking for tummy rubs.',
      },
      {
        timeStart: 16.0,
        timeEnd: 24.0,
        title: '장면 3: 모래밭 별 보물 (16s-24s)',
        subtitle: '모래밭에서 반짝이는 별도 찾았어!',
        voiceText: '모래밭에서 반짝이는 별도 찾았어!',
        mood: 'excited',
        bgGradient: 'from-[#FFF8E1] via-[#FFE082] to-[#FFA000]',
        bgDecorations: ['⭐', '🌟', '🏆', '🐶'],
        actionBadge: '⭐ 반짝이는 별 발견',
        storyPrompt:
          'Nurungji digs energetically in a sandbox, pulling out a sparkling toy star and doing an excited tail-spin dance.',
      },
      {
        timeStart: 24.0,
        timeEnd: 30.0,
        title: '장면 4: 사랑의 뽀뽀와 약속 (24s-30s)',
        subtitle: '유하가 너무 좋아서 뽀뽀 츄~ 해줄래! 언제나 유하 곁에 있을게!',
        voiceText: '유하가 너무 좋아서 뽀뽀 츄~ 해줄래! 언제나 유하 곁에 있을게!',
        mood: 'happy',
        bgGradient: 'from-[#FFF8E1] via-[#FFECB3] to-[#FFE082]',
        bgDecorations: ['💖', '🎉', '🌟', '🐶'],
        actionBadge: '💋 뽀뽀 츄~ 사랑해',
        storyPrompt:
          'Nurungji trots up to the lens, gently gives a cute cartoon "lick" on the screen, and barks joyfully with a panting smile.',
      },
    ],
  },
};

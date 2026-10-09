# 캐릭터 숏폼 영상 제작 가이드 & AI 비디오 프롬프트

## 세로 영상 제작 규격 (2026-10-09)

- **현재 적용**: 핑구의 네 장면·한국어 더빙·30초 세로 영상 완료. 이번에는 핑구만 적용하며 나머지 7명은 기존 영상을 유지합니다.
- **앞으로의 제작 규격**: 사용자 요청에 따라 Veo 3.1 Lite (`veo-3.1-lite-generate-preview`), 1080p 세로(1080×1920), 9:16, 24fps, 최종 30초 MP4만 사용합니다. 완성된 핑구의 4K 영상과 제작 기록은 그대로 보존합니다.
- **외형 기준**: `production/character-videos/references/<캐릭터ID>.png`는 게임의 `CharacterArtwork.tsx`를 그대로 렌더링한 1024×1024 외형 기준입니다. Lite는 `referenceImages`를 지원하지 않으므로 장면에 맞게 준비하고 검토한 세로 시작 프레임을 `image`로 전달합니다. 배경과 색·의상·장식·얼굴 비율을 먼저 확인하며, 시작 프레임이 준비되지 않았다면 생성 요청 전에 멈춥니다.
- **장면 구성**: 기존 00–08 / 08–16 / 16–24 / 24–30초의 네 장면을 각각 생성합니다. Lite의 1080p 출력은 8초 생성을 요구하므로 네 클립을 각각 8초로 만들고 마지막 클립에서 완결된 6초를 사용합니다. 마지막 인사 동작은 6초 안에 끝나도록 지시합니다.
- **연속성**: 각 장면에 같은 캐릭터 참조와 스타일을 사용하고, 팔·다리·의상 변화와 장면 연결을 눈으로 확인합니다. 이전 짧은 영상의 반복·줌·색 변경으로 30초를 채우는 기존 빌드 스크립트는 새 제작에 사용하지 않습니다.
- **오디오**: 장면별 아래 한국어 대사를 ElevenLabs의 기존 캐릭터 음성 설정으로 더빙합니다. 영상 모델에는 사람 말·자막을 생성하지 않도록 지시합니다. 어린 목소리 톤, 음악 덕킹, 짧고 부드러운 효과음을 유지합니다.
- **비용 제한**: Lite 1080p는 생성 초당 $0.08로, 8초 × 4장면 = 캐릭터당 영상 생성 예상 $2.56입니다(더빙 별도). 생성 ID와 결과를 재사용합니다. 비싼 모델·해상도로 자동 전환하거나 품질 수정을 위한 유료 재생성을 자동 실행하지 않습니다. 추가 비용이 필요한 재생성은 사용자에게 예상 비용을 알리고 명시적 승인을 받은 후에만 진행합니다.
- **교체 조건**: 캐릭터 한 명의 4개 장면을 모두 생성하고 해상도·재생 길이·캐릭터 일관성·더빙·모바일 재생을 확인한 뒤 해당 캐릭터의 `public/videos/<캐릭터ID>.mp4`를 교체합니다. 원본 백업은 `backups/character-videos/2026-10-09-landscape/`입니다.
- **제작 경로**: 이후 생성은 Gemini API의 `veo-3.1-lite-generate-preview`만 사용하며, 한 캐릭터를 완성하고 적용한 뒤 다음 캐릭터를 생성합니다. 현재는 설정만 변경하며 추가 생성하지 않습니다. 실제 완료 상태는 `portrait-manifest.json`을 확인합니다.

공식 영상 API: https://ai.google.dev/gemini-api/docs/veo
생성 도구와 재개 방법: `../../production/character-videos/README.md`

## 1. 공통 스타일 키워드 (모든 영상 적용)
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights.
```

---

## 2. 핑구 (Pingu)

> 아래는 이미 완성된 4K 제작 당시의 스토리보드입니다. 새 생성에는 위의 Lite 1080p 정책을 적용합니다.

- **캐릭터**: 핑구 (Pingu) - 민트 목도리와 크림색 배, 푸른 회색 몸의 아기 펭귄
- **스토리 테마**: 반짝반짝 얼음 미끄럼틀과 눈사람 만들기
- **ElevenLabs Voice ID**: `cgSgspJ2msm6clMCkdW9` (Jessica / Light preschool character pitch)
- **속도 / 설정**: Speed 0.90, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 4K 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second whimsical 3D claymation cartoon featuring Pingu, an adorable slate-blue baby penguin with a cream face and belly, golden beak and feet, and a mint-green scarf with pale stripes, matching the supplied in-game Pingu reference.
- 00s-08s (Scene 1 - Greeting): Pingu waddles excitedly out of an igloo onto sparkling soft snow, trips slightly, catches balance, and waves both wings happily toward the camera with a cheerful smile.
- 08s-16s (Scene 2 - Fun Play): Pingu spots a gentle baby ice slide, belly-slides down smoothly with sparkles trailing behind, giggling as it splashes softly into a pile of fluffy snow.
- 16s-24s (Scene 3 - Creative Moment): Pingu rolls a tiny snowball that grows into a cute mini snowman, placing a mint flower on its head and clapping wings with pride.
- 24s-30s (Scene 4 - Hug Ending): Pingu waddles close to the screen, taps the glass lightly, blows a glowing icy heart toward Yuha, and gives a warm penguin bow.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"안녕 유하야! 나는 핑구야! 슈웅~ 눈 미끄럼틀 정말 신난다! 짜잔, 나와 닮은 눈사람도 만들었어! 유하야, 오늘도 나랑 신나게 놀자! 사랑해~"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"안녕 유하야! 나는 핑구야!"`
2. **Scene 2 (08s-16s)**: `"슈웅~ 눈 미끄럼틀 정말 신난다!"`
3. **Scene 3 (16s-24s)**: `"짜잔, 나와 닮은 눈사람도 만들었어!"`
4. **Scene 4 (24s-30s)**: `"유하야, 오늘도 나랑 신나게 놀자! 사랑해~"`

---

## 3. 꼬미 (Ggomi)

- **캐릭터**: 꼬미 (Ggomi) - 분홍 리본과 하트 원피스를 입은 캐러멜색 아기 곰돌이
- **스토리 테마**: 달콤한 딸기 컵케이크와 포근한 포옹
- **ElevenLabs Voice ID**: `cgSgspJ2msm6clMCkdW9` (Jessica / Soft lilting preschool character pitch)
- **속도 / 설정**: Speed 0.90, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second heartwarming 3D claymation featuring Ggomi, a chubby caramel-brown teddy bear with a cream muzzle, pink ear ribbon, and pink pinafore dress with a cream heart and pale trim, matching the supplied in-game Ggomi reference.
- 00s-08s (Scene 1 - Peekaboo): Ggomi peeks out from behind a giant fluffy pink pillow in a cozy nursery room, giggling softly and waving with both padded paws.
- 08s-16s (Scene 2 - Making Treat): Ggomi sits at a small wooden table, carefully placing a bright red strawberry on top of a whipped cream cupcake, licking its lips cutely.
- 16s-24s (Scene 3 - Happy Dance): Holding the cupcake, Ggomi does a gentle side-to-side wiggle dance, surrounded by floating pink sparkles and musical notes.
- 24s-30s (Scene 4 - Sharing Love): Ggomi offers the cupcake toward the camera, then spreads arms wide for a warm, soft bear hug, smiling with sparkling eyes.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"까꿍! 유하야 안녕? 꼬미가 유하 주려고 달콤한 딸기 케이크를 만들었어! 냠냠 맛있겠지? 유하 생각만 해도 꼬미는 매일매일 행복해. 포근포근 꼭 안아줄게!"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"까꿍! 유하야 안녕?"`
2. **Scene 2 (08s-16s)**: `"꼬미가 유하 주려고 달콤한 딸기 케이크를 만들었어!"`
3. **Scene 3 (16s-24s)**: `"냠냠 맛있겠지? 유하 생각만 해도 꼬미는 매일매일 행복해."`
4. **Scene 4 (24s-30s)**: `"포근포근 꼭 안아줄게!"`

---

## 4. 라노 (Rano)

- **캐릭터**: 라노 (Rano) - 씩씩한 연두색 아기 공룡
- **스토리 테마**: 쿵쿵 발구르기와 무지개 알 찾기
- **ElevenLabs Voice ID**: `FGY2WhTYpPnrIDTdsKH5` (Laura / Playful bouncy preschool character pitch)
- **속도 / 설정**: Speed 0.94, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second energetic and cute 3D claymation featuring Rano, a cheerful mint-green baby dinosaur with a cream-yellow belly, golden rounded dorsal plates, short limbs and a curved tail, matching the supplied in-game Rano reference.
- 00s-08s (Scene 1 - Brave Roar): Rano pops out from behind a giant leafy fern, stomps its chubby feet playfully, and lets out a tiny, adorable "Roar!" before giggling.
- 08s-16s (Scene 2 - Discovery): Rano hops through colorful prehistoric flower bushes and discovers a glowing rainbow-spotted dinosaur egg wobbling on a mossy stone.
- 16s-24s (Scene 3 - Hatching Joy): The egg gently cracks open and pops out a bunch of flying soap bubbles! Rano jumps in the air, popping bubbles with its little snout and tail.
- 24s-30s (Scene 4 - High-Five): Rano dashes toward the camera, gives an energetic high-five against the screen, and flexes its tiny arms proudly.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"크와앙! 씩씩한 아기공룡 라노 등장! 쿵쿵 발을 구르면 기분이 최고야! 와, 무지개 알에서 알록달록 방울이 퐁퐁 튀어나오네! 유하야, 나랑 힘차게 하이파이브!"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"크와앙! 씩씩한 아기공룡 라노 등장!"`
2. **Scene 2 (08s-16s)**: `"쿵쿵 발을 구르면 기분이 최고야!"`
3. **Scene 3 (16s-24s)**: `"와, 무지개 알에서 알록달록 방울이 퐁퐁 튀어나오네!"`
4. **Scene 4 (24s-30s)**: `"유하야, 나랑 힘차게 하이파이브!"`

---

## 5. 젤리 (Jelly)

- **캐릭터**: 젤리 (Jelly) - 분홍 꽃과 보라색 하트 원피스를 입은 연보라색 아기 토끼
- **스토리 테마**: 깡충깡충 당근 정원과 나비 친구
- **ElevenLabs Voice ID**: `cgSgspJ2msm6clMCkdW9` (Jessica / Sweet bell-like preschool character pitch)
- **속도 / 설정**: Speed 0.93, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second bubbly 3D claymation featuring Jelly, a sweet pearl-lavender bunny with long upright pink-inner ears, a pink flower by one ear, a lavender pinafore dress with a cream heart and pale trim, and rosy cheeks, matching the supplied in-game Jelly reference.
- 00s-08s (Scene 1 - Bouncing In): Jelly bounces rhythmically into a sunny vegetable garden, long ears flopping happily, stopping to twitch its pink nose at the camera.
- 08s-16s (Scene 2 - Big Carrot): Jelly tries to pull a huge cartoon carrot from the ground; with a big tug, it plops backward softly onto a bed of clover leaves, laughing cheerfully.
- 16s-24s (Scene 3 - Butterfly Waltz): A sparkling yellow butterfly lands gently on Jelly's nose. Jelly giggles, sneezes softly, and spins around playing tag with the butterfly.
- 24s-30s (Scene 4 - Finger Heart): Jelly sits up, makes a cute heart shape with its long bunny ears, and sends flying kisses toward the screen.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"깡충깡충! 안녕 유하야, 젤리야! 영차영차~ 커다란 당근 뽑기 성공! 어라? 나비 친구가 코를 간지럽히네? 에취! 유하야, 젤리 귀로 하트 만들어줄게. 뿅뿅!"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"깡충깡충! 안녕 유하야, 젤리야!"`
2. **Scene 2 (08s-16s)**: `"영차영차~ 커다란 당근 뽑기 성공!"`
3. **Scene 3 (16s-24s)**: `"어라? 나비 친구가 코를 간지럽히네? 에취!"`
4. **Scene 4 (24s-30s)**: `"유하야, 젤리 귀로 하트 만들어줄게. 뿅뿅!"`

---

## 6. 도치 (Dochi)

- **캐릭터**: 도치 (Dochi) - 금빛 가시와 민트 스카프의 호기심 아기 고슴도치
- **스토리 테마**: 또르르 구르기와 반짝이는 도토리 보물
- **ElevenLabs Voice ID**: `cgSgspJ2msm6clMCkdW9` (Jessica / Curious gentle preschool character pitch)
- **속도 / 설정**: Speed 0.89, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second curious and sweet 3D claymation featuring Dochi, a round little hedgehog with soft golden-honey rounded spines, a warm cream face, a tiny dark nose and a sage-mint triangular neckerchief, matching the supplied in-game Dochi reference.
- 00s-08s (Scene 1 - Rolling Ball): A round prickly ball rolls in through autumn leaves, unfurls, and reveals Dochi’s adorable face blinking curiously at the viewer.
- 08s-16s (Scene 2 - Treasure Hunt): Dochi sniffs the ground and finds a giant shiny golden acorn. It polishes the acorn with its little tummy until it gleams.
- 16s-24s (Scene 3 - Leaf Crown): Leaves fall gently; Dochi sticks three colorful maple leaves onto its back spines like a festive crown and wiggles with joy.
- 24s-30s (Scene 4 - Peeking Wave): Dochi curls into a ball, peeks one eye out, giggles, and waves its tiny paw warmly.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"또르르르~ 짠! 호기심 대장 도치 등장! 킁킁, 숲속에서 반짝이는 황금 도토리를 찾았어! 예쁜 단풍잎 왕관도 썼지롱. 유하야, 나랑 재미있는 보물 찾으러 가볼까?"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"또르르르~ 짠! 호기심 대장 도치 등장!"`
2. **Scene 2 (08s-16s)**: `"킁킁, 숲속에서 반짝이는 황금 도토리를 찾았어!"`
3. **Scene 3 (16s-24s)**: `"예쁜 단풍잎 왕관도 썼지롱!"`
4. **Scene 4 (24s-30s)**: `"유하야, 나랑 재미있는 보물 찾으러 가볼까?"`

---

## 7. 꿀꿀이 (Ggulgguli)

- **캐릭터**: 꿀꿀이 (Ggulgguli) - 노란 스카프를 두른 분홍색 아기 돼지
- **스토리 테마**: 첨벙첨벙 딸기 우유 웅덩이와 비눗방울 풍선
- **ElevenLabs Voice ID**: `FGY2WhTYpPnrIDTdsKH5` (Laura / Cheerful laughing preschool character pitch)
- **속도 / 설정**: Speed 0.92, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second playful 3D claymation featuring Ggulgguli, a chubby rosy-pink piglet with a curly spring tail, a friendly pink snout, small dark hooves and a butter-yellow triangular neckerchief, matching the supplied in-game Ggulgguli reference.
- 00s-08s (Scene 1 - Snout Wiggle): Ggulgguli wiggles its round snout directly in front of the lens with funny sound effects, then steps back dancing on its hind hooves.
- 08s-16s (Scene 2 - Strawberry Feast): Ggulgguli spots a bowl of giant juicy strawberries, juggles three of them cutely, and munches happily with puffed cheeks.
- 16s-24s (Scene 3 - Bubble Bath): Ggulgguli jumps playfully into a shallow warm bubble pool, splashing pink bubbles everywhere and wearing a bubble hat.
- 24s-30s (Scene 4 - Tail Wag): Ggulgguli turns around, wiggles its curly tail like a propeller, and turns back to give a huge cheerful smile.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"꿀꿀! 유하야 안녕? 난 맛있는 걸 제일 좋아하는 꿀꿀이야! 딸기 세 개를 냠냠~ 보글보글 거품 목욕도 정말 시원해! 내 꼬리 뱅글뱅글 돌아가는 것 좀 봐! 헤헤~"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"꿀꿀! 유하야 안녕? 난 맛있는 걸 제일 좋아하는 꿀꿀이야!"`
2. **Scene 2 (08s-16s)**: `"딸기 세 개를 냠냠~"`
3. **Scene 3 (16s-24s)**: `"보글보글 거품 목욕도 정말 시원해!"`
4. **Scene 4 (24s-30s)**: `"내 꼬리 뱅글뱅글 돌아가는 것 좀 봐! 헤헤~"`

---

## 8. 음메 (Eumme)

- **캐릭터**: 음메 (Eumme) - 하늘색 스카프와 금빛 방울, 작은 금빛 뿔의 아기 양
- **스토리 테마**: 몽실몽실 솜사탕 구름과 별빛 요람
- **ElevenLabs Voice ID**: `cgSgspJ2msm6clMCkdW9` (Jessica / Soft gentle preschool character pitch)
- **속도 / 설정**: Speed 0.87, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second dreamy and soothing 3D claymation featuring Eumme, an ultra-fluffy ivory-white lamb with short golden curled horns, a cream face, a sky-blue triangular neckerchief and a tiny golden bell, matching the supplied in-game Eumme reference.
- 00s-08s (Scene 1 - Cloud Drift): Eumme floats gently into the lavender pastel sky sitting atop a fluffy pink cotton-candy cloud, humming a soft tune.
- 08s-16s (Scene 2 - Star Catching): Eumme reaches out a tiny hoof and catches a falling yellow star, which glows softly and chimes like a music box.
- 16s-24s (Scene 3 - Cloud Pillow): Eumme fluffs up a mini cloud like a marshmallow pillow, rests its head, and yawns cutely as tiny crescent moons float by.
- 24s-30s (Scene 4 - Sweet Dreams): Eumme waves slowly and warmly, eyes twinkling with kindness, surrounded by soft celestial glow.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"음메~ 포근한 아기양 음메예요. 둥실둥실 구름 침대에 누워 반짝이는 별을 잡았어요. 우리 유하 마음도 구름처럼 폭신폭신해지길 바랄게요. 좋은 꿈 꿔요~"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"음메~ 포근한 아기양 음메예요."`
2. **Scene 2 (08s-16s)**: `"둥실둥실 구름 침대에 누워 반짝이는 별을 잡았어요."`
3. **Scene 3 (16s-24s)**: `"우리 유하 마음도 구름처럼 폭신폭신해지길 바랄게요."`
4. **Scene 4 (24s-30s)**: `"좋은 꿈 꿔요~"`

---

## 9. 누룽지 (Nurungji)

- **캐릭터**: 누룽지 (Nurungji) - 초록 스카프와 캐러멜색 귀의 골든 강아지
- **스토리 테마**: 뼈다귀 공놀이와 신나는 달리기
- **ElevenLabs Voice ID**: `FGY2WhTYpPnrIDTdsKH5` (Laura / Cheerful bouncing preschool character pitch)
- **속도 / 설정**: Speed 0.94, Model `eleven_multilingual_v2`, Speaker Boost Off

### [Veo / AI Video Prompt - 30s Storyboard]
```text
3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, native 1080p 24fps, vertical 9:16 composition, faithful to the supplied in-game character reference. Keep the face, ears, hands and feet in frame; no captions, letters, logos or spoken dialogue; gentle motion and no flashing lights. A 30-second lively 3D claymation featuring Nurungji, an adorable honey-golden puppy with caramel floppy ears, a cream muzzle and belly, a sage-green triangular neckerchief and a wagging curved tail, matching the supplied in-game Nurungji reference.
- 00s-08s (Scene 1 - Bounding Run): Nurungji trots happily across a green meadow holding a red squeaky ball in its mouth, stopping to tilt its head with perked ears.
- 08s-16s (Scene 2 - Catch & Roll): Nurungji tosses the ball with its nose, chases it in circles, and rolls over onto its back asking for tummy rubs.
- 16s-24s (Scene 3 - Digging Fun): Nurungji digs energetically in a sandbox, pulling out a sparkling toy star and doing an excited tail-spin dance.
- 24s-30s (Scene 4 - Screen Lick): Nurungji trots up to the lens, gently gives a cute cartoon "lick" on the screen, and barks joyfully with a panting smile.
```

### [더빙 음성 스크립트 (11labs TTS)]
```text
"멍멍! 꼬리 살랑살랑 누룽지야! 유하야, 공놀이 정말 신난다! 모래밭에서 반짝이는 별도 찾았어! 유하가 너무 좋아서 뽀뽀 츄~ 해줄래! 언제나 유하 곁에 있을게!"
```

#### 장면별 분할 대사 (4개 씬 타임라인)
1. **Scene 1 (00s-08s)**: `"멍멍! 꼬리 살랑살랑 누룽지야!"`
2. **Scene 2 (08s-16s)**: `"유하야, 공놀이 정말 신난다!"`
3. **Scene 3 (16s-24s)**: `"모래밭에서 반짝이는 별도 찾았어!"`
4. **Scene 4 (24s-30s)**: `"유하가 너무 좋아서 뽀뽀 츄~ 해줄래! 언제나 유하 곁에 있을게!"`

---

## 10. 제작 완료 후 적용 방법
1. `production/character-videos/README.md`의 권한·비용 확인 후 ElevenLabs Image & Video API로 위 네 장면을 각각 생성합니다. 캐릭터 외형 참조 이미지를 반드시 함께 전달합니다.
2. 기존 ElevenLabs 캐릭터 음성 설정으로 장면별 한국어 대사를 생성하고, 네 장면을 8+8+8+6초로 편집하여 더빙·음악·효과음과 합성합니다.
3. 실제 해상도·길이·화질·캐릭터 외형·모바일 재생을 검증하고, 검증된 MP4만 `public/videos/<캐릭터ID>.mp4`에 저장합니다.
4. 기존 `src/data/characterVideoData.ts`의 `hasVideo: true`, `videoUrl: '/videos/<캐릭터ID>.mp4'` 연결을 유지합니다. 생성이 완료되기 전에는 기존 영상을 유지합니다.

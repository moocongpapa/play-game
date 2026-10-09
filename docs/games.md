# 게임 목록과 등록 방법

기준일: 2026-10-10 · [목차](README.md)

실제 홈 메뉴는 [GAME_CATALOG](../src/data/gameCatalog.ts)와 `availableGameIds`를 기준으로 합니다. 이름·설명은 접근성·음성·부모 정보에도 사용하지만 홈 카드는 그림만 표시합니다. 아래 목록은 현재 소스의 30종을 전부 포함합니다.

## 연령과 난이도

| 그룹 | 월령 판정 | 메뉴 게임 수 | 기본 보기 | 기본 문제 제한 | 수 세기 범위 |
|---|---|---|---|---|---|
| baby · 아기반 | 36개월 미만 | 25 | 2개 | 없음 | 1~3 |
| sprout · 새싹반 | 36~47개월 | 29 | 4개 | 없음 | 1~7 |
| bloom · 꽃잎반 | 48~59개월 | 30 | 4개 | 30초 | 1~10 |
| star · 별님반 | 60개월 이상 | 30 | 4개 | 20초 | 1~20 |

기본 프로필은 유하, 2023-01-03입니다. 2026-10-09 기준 45개월로 새싹반입니다. 월령은 현재 날짜와 생일의 현지 날짜로 계산합니다. 게임마다 적용하는 난이도 필드가 다르며 자유 놀이에 문제 제한을 일괄 적용하지 않습니다. 숫자 놀이터는 모든 연령에서 0~100을 사용합니다.

## 개별 게임

| ID | 놀이 | 발달 영역 | 메뉴 표시 | 구현 |
|---|---|---|---|---|
| `object_recognition` | 이름 찾기 | 언어 | 아기반부터 | [GgomiObjectGame](../src/screens/games/GgomiObjectGame.tsx) |
| `shape_color` | 모양과 색 | 관찰·논리 | 아기반부터 | [RanoShapeColorGame](../src/screens/games/RanoShapeColorGame.tsx) |
| `korean_letters` | 글자 방울 | 언어 | 아기반부터 | [JellyKoreanGame](../src/screens/games/JellyKoreanGame.tsx) |
| `sound_quiz` | 누구 소리? | 언어 | 아기반부터 | [DochiSoundGame](../src/screens/games/DochiSoundGame.tsx) |
| `counting_food` | 냠냠 숫자 | 관찰·논리 | 아기반부터 | [GgulgguliCountingGame](../src/screens/games/GgulgguliCountingGame.tsx) |
| `number_parade` | 통통 숫자 놀이터 | 관찰·논리 | 아기반부터 | [NumberParadeGame](../src/screens/games/NumberParadeGame.tsx) |
| `cloud_shapes` | 구름 모으기 | 관찰·논리 | 아기반부터 | [EummeCloudShapeGame](../src/screens/games/EummeCloudShapeGame.tsx) |
| `treasure_hunt` | 보물 찾기 | 관찰·논리 | 아기반부터 | [NurungjiTreasureGame](../src/screens/games/NurungjiTreasureGame.tsx) |
| `emotion_quiz` | 마음 얼굴 | 생활·감정 | 아기반부터 | [EmotionQuizGame](../src/screens/games/EmotionQuizGame.tsx) |
| `pattern_sequence` | 다음은 뭘까? | 관찰·논리 | 새싹반부터 | [PatternSequenceGame](../src/screens/games/PatternSequenceGame.tsx) |
| `word_puzzle` | 단어 퍼즐 | 언어 | 꽃잎반부터 | [WordPuzzleGame](../src/screens/games/WordPuzzleGame.tsx) |
| `rhythm_game` | 톡톡 음악 | 음악·창작 | 새싹반부터 | [RhythmGame](../src/screens/games/RhythmGame.tsx) |
| `size_comparison` | 크고 작고 | 관찰·논리 | 아기반부터 | [SizeComparisonGame](../src/screens/games/SizeComparisonGame.tsx) |
| `memory_card` | 짝꿍 카드 | 관찰·논리 | 아기반부터 | [MemoryCardGame](../src/screens/games/MemoryCardGame.tsx) |
| `shadow_quiz` | 그림자 친구 | 관찰·논리 | 새싹반부터 | [ShadowQuizGame](../src/screens/games/ShadowQuizGame.tsx) |
| `stage_adventure` | 무지개 모험 | 관찰·논리 | 새싹반부터 | [RainbowStageAdventure](../src/screens/RainbowStageAdventure.tsx) |
| `tooth_brush` | 치카치카 | 생활·감정 | 아기반부터 | [ToothBrushGame](../src/screens/games/ToothBrushGame.tsx) |
| `feeding` | 냠냠 한 입 | 생활·감정 | 아기반부터 | [FeedingGame](../src/screens/games/FeedingGame.tsx) |
| `bubble_pop` | 비눗방울 톡톡 | 음악·창작 | 아기반부터 | [BubblePopGame](../src/screens/games/BubblePopGame.tsx) |
| `peekaboo_hide` | 어디 숨었지? | 관찰·논리 | 아기반부터 | [PeekabooHideGame](../src/screens/games/PeekabooHideGame.tsx) |
| `animal_xylophone` | 동물 실로폰 | 음악·창작 | 아기반부터 | [AnimalXylophoneGame](../src/screens/games/AnimalXylophoneGame.tsx) |
| `path_tracing` | 별빛 길 따라가기 | 음악·창작 | 아기반부터 | [PathTracingGame](../src/screens/games/PathTracingGame.tsx) |
| `fruit_harvest` | 과일 수확 | 관찰·논리 | 아기반부터 | [FruitHarvestGame](../src/screens/games/FruitHarvestGame.tsx) |
| `symmetry_puzzle` | 반쪽 날개 | 관찰·논리 | 아기반부터 | [SymmetryPuzzleGame](../src/screens/games/SymmetryPuzzleGame.tsx) |
| `size_ordering` | 곰 세 마리 | 관찰·논리 | 아기반부터 | [SizeOrderingGame](../src/screens/games/SizeOrderingGame.tsx) |
| `day_night_weather` | 해님 달님 날씨 | 언어 | 아기반부터 | [DayNightWeatherGame](../src/screens/games/DayNightWeatherGame.tsx) |
| `goodnight_sleep` | 코~ 자자 | 생활·감정 | 아기반부터 | [GoodNightSleepGame](../src/screens/games/GoodNightSleepGame.tsx) |
| `emotion_face` | 마음 거울 | 생활·감정 | 아기반부터 | [EmotionFaceGame](../src/screens/games/EmotionFaceGame.tsx) |
| `sensory_paint` | 마법 물감과 모래 | 음악·창작 | 아기반부터 | [SensoryPaintCanvas](../src/screens/games/SensoryPaintCanvas.tsx) |
| `balloon_pop` | 풍선 팡팡 | 음악·창작 | 아기반부터 | [BalloonPopGame](../src/screens/games/BalloonPopGame.tsx) |

## 홈 하단의 자유 놀이와 연속 놀이

| 화면 | 하는 일 |
|---|---|
| [색칠 놀이](../src/screens/SketchbookScreen.tsx) | 도구·색상·도안/도화지·스티커 4개 메뉴, 한 단계 되돌리기, 캐릭터 살아나기, 저장·전시·이어 그리기·PNG 내보내기 |
| [곤충 놀이터](../src/screens/BugGardenScreen.tsx) | 무당벌레·나비·애벌레·꿀벌·달팽이·풍뎅이·개미·귀뚜라미·잠자리·반딧불이·사마귀·사슴벌레 12종 관찰, 탭 인사·드래그 이동·멈춤·다시 모으기. 모바일 선택 버튼은 4개씩 3줄 |
| [수족관](../src/screens/AquariumScreen.tsx) | 물고기·상어·고래·문어·오징어·해파리 친구들 관찰·이동·인사 |
| [친구 놀이터](../src/screens/CharacterParkScreen.tsx) | 여덟 캐릭터가 한 명씩 움직임. 탭으로 방향 바꾸기·점프·구르기 등, 드래그 이동 |
| [친구와 인사](../src/screens/CharacterTalkScreen.tsx) | 친구 선택, 머리·배·손 터치와 캐릭터마다 다른 인사 동작·음성 |
| [친구의 하루](../src/screens/FriendDayScreen.tsx) | 선택 친구와 먹기·양치·까꿍·실로폰을 자동으로 순환 |

일반 문제는 정답 후 새로운 보기를 준비하고, 여러 장면 놀이는 완료 후 처음부터 반복합니다. 풍선·비눗방울·실로폰·감각 캔버스는 자유롭게 계속 놀 수 있습니다. 실제 조작과 반복 검증 기록은 [전체 QA](responsive-play-qa-2026-10-09.md), [숫자 놀이](number-parade.md), [모바일 비율](mobile-content-proportions.md)에 있습니다.

## 게임이나 콘텐츠를 바꿀 때

1. ID·공통 props를 `src/types.ts`에 등록하고 `src/screens/games/`에 컴포넌트를 만듭니다.
2. `App.tsx`의 lazy import와 게임 switch를 연결합니다. `buddy`·음소거·연령·완료 콜백은 앱 문맥을 사용합니다.
3. `GAME_CATALOG`의 제목·짧은 안내·테마·발달 영역·최소 연령을 등록합니다. 홈 게임 목록의 실제 기준은 이 catalog입니다.
4. `GameArtwork.tsx` 또는 `DevelopmentThumbnail.tsx`에 실제 놀이 내용을 보여 주는 그림을 연결합니다. 기존 카드와 이름만 다른 같은 그림을 쓰지 않습니다.
5. 한국어·영어 안내, 캐릭터 음성, 정답 피드백을 오디오 엔진에 연결합니다. 이미 배포된 음성 파일이 있으면 등록과 캐시를 재사용합니다.
6. 드래그는 공통 스냅·Pointer Events, 자동 진행은 공통 타이머와 정리 로직을 사용합니다. 정답 중복 보상·숨긴 화면의 진행·화면 이탈 후 음성 재생을 확인합니다.
7. 콘텐츠 추가는 해당 데이터·라운드 덱·그림·음성 번역을 함께 확인합니다. 보기 수가 늘어나도 모바일 2×2 배치·64px 터치 영역을 유지합니다.
8. [유지보수 검증](maintenance.md)을 실행하고 이 목록과 해당 자산 문서를 갱신합니다.

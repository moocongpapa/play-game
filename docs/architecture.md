# 아키텍처와 공통 놀이 규칙

기준일: 2026-10-09 · [목차](README.md)

## 화면과 상태

`src/main.tsx`는 StrictMode와 `MotionConfig reducedMotion="user"`로 `App`을 시작합니다. `App.tsx`가 화면 상태를 소유하며 URL 라우터는 사용하지 않습니다. 게임·부모·자유 놀이 화면은 `React.lazy`와 Suspense로 나누어 불러옵니다.

기본 흐름은 환영 연출 → 친구 선택 → 게임 그림 선택 → 플레이 → 홈의 게임 선택입니다. 새 진입 때 홈 단계는 친구 선택이며 마지막 친구 ID는 저장되어 있습니다. 현재 환영 연출은 **5.2초 타임라인과 바로 시작하기 버튼**을 사용합니다. 표시되는 진행률은 실제 다운로드 준비율이 아닙니다.

홈의 그림 목록은 페이징 없이 아래로 이어지고, 하단에 색칠·곤충·수족관·친구 놀이터·인사 다섯 바로가기가 있습니다. 고른 친구 그림은 친구 선택으로, 재생 배지는 영상 모달로 연결됩니다. 상단 `Header`는 과자 집 홈·배경음·전체 소리·보호자 진입을 공유합니다.

`currentScreen='stickers'`와 `onOpenStickerRoom`은 남아 있는 내부 이름이지만 실제 화면은 **BugGardenScreen**입니다. 과거 스티커방 컴포넌트는 사용하지 않습니다. `stars`, `placedStickers` 등 일부 앱 상태 필드는 이전 데이터 호환을 위해 남아 있으며 현재 누적 별 점수는 사용하지 않습니다. 게임 완료 수는 부모 통계에 기록합니다.

## 놀이 계층

| 책임 | 소스 |
|---|---|
| 게임 ID·캐릭터·프로필·앱 상태 타입 | `src/types.ts` |
| 실제 홈 메뉴와 최소 연령 | `src/data/gameCatalog.ts`의 `availableGameIds` |
| 생년월일·월령·난이도 | `src/utils/ageEngine.ts` |
| 문제와 보기 데이터 | `src/data/gameData.ts`, `roundDeck.ts` |
| 게임 배경·선택한 친구 음성 문맥 | `GameStage.tsx`, `PlayFlowContext.tsx` |
| 생활·감각 놀이 공통 셸과 진행 | `ToddlerPlay.tsx`, `DevelopmentShell.tsx`, `useToddlerPlay.ts`, `usePlayJourney.ts` |
| 일반 문제 자동 진행 | `RoundContinuation.tsx`, `roundContinuation.ts` |
| 여러 게임 연속 진행 | `FriendDayScreen.tsx`, `friendDay.ts`, `DayContinuationContext` |
| 무지개 네 단계 모험 | `RainbowStageAdventure.tsx` |
| 곤충·수족관 이동 | `components/habitat/`, `habitatFriends.ts`, `habitatMotion.ts` |
| 캐릭터 8명 각 한 명의 이동·리액션 | `CharacterParkScreen.tsx`, `characterParkMotion.ts`, `useRoamingDrag.ts` |

게임 파일 이름에 특정 캐릭터가 있어도 앱에서 `buddy`로 전달한 **선택 친구**가 안내·칭찬과 주인공 외형의 기준입니다. 다른 동물은 문제의 보기 또는 놀이 대상일 수 있습니다.

`ageEngine.ts`의 `getAvailableGames`는 예전 기본 목록 보조 함수이며 현재 홈의 메뉴 기준이 아닙니다. 메뉴 변경은 `GAME_CATALOG`를 기준으로 합니다. [전체 게임과 난이도](games.md)에 현재 목록을 정리했습니다.

## 자동 진행과 일시정지

- 일반 문제는 완료 후 자동으로 새 문제를 선택합니다. 공통 기본 대기는 1,600ms이며 게임마다 재정의할 수 있습니다. 칭찬 중이면 최대 4,500ms 추가로 기다린 뒤 진행합니다.
- 여러 장면 놀이의 기본 축하는 중간 1,000ms / 마지막 1,800ms입니다. ‘친구의 하루’에서는 250ms / 450ms로 줄이고 긴 음성 다운로드 때문에 전환을 늘리지 않습니다.
- 수동 다음 버튼을 전제로 하지 않습니다. 자유 놀이·연주는 계속 조작할 수 있습니다. 세부 라운드 수와 종료 조건은 각 게임에서 소유합니다.
- `PlayHintsPausedContext`는 보호자 화면·게이트·앱 시간 종료 등의 정지 문맥을 전달합니다. 페이지 숨김·포커스 이탈·누른 손가락 상태도 진행을 멈춥니다.
- 화면을 나가면 음성·효과음·축하와 앱 지연 작업을 정리합니다. `useGameTimeouts`, `useRoundTimer`, `usePlayJourney`의 정리 함수를 사용해 이전 화면의 콜백이 새 게임을 바꾸지 않게 합니다.

## 드래그·힌트·움직임

- `DragMatch.tsx`는 Pointer Events와 드롭 슬롯 판정을 공유합니다. `dropTarget.ts`는 **슬롯 가장자리에서** 모바일 60 CSS px / 768px 이상 화면 90 CSS px까지 오차를 수용합니다. 중심 반경만으로 판단하는 방식이 아닙니다.
- 직접 다른 슬롯 안에 놓으면 그 선택을 존중하고, 근처의 수용 가능한 슬롯 중 가까운 것을 고릅니다. 올바른 스냅에는 스프링(`400/20`)·대상 확대·소리·진동을 연결합니다. 틀린 선택은 부드럽게 돌아옵니다.
- `useIdleScaffolding`은 4초 무입력 후 손가락·펄스와 음성 힌트를 제공합니다. 입력·스테이지 변경으로 해제하고, 손가락을 누른 동안·백그라운드·부모 게이트에서는 타이머를 멈춥니다. 현재 말소리·동물 단서를 끊지 않습니다.
- 주요 적용은 이름 찾기·모양 색·동물 소리·그림자·무지개 모험입니다. 다른 놀이의 `useGentleHelp`·`useToddlerPlay` 힌트는 별도 규칙을 가질 수 있습니다.
- `TouchEffects.tsx`와 `juice.ts`가 별빛 트레일·버스트·누르기 변형·진동을 공유합니다. 효과음 피치는 0.95~1.05배, 기본 터치 진동은 12ms, 스냅은 15ms, 성공은 `[20,30,40]`입니다. 지원 여부와 부모 설정을 따릅니다.
- 캐릭터는 `characterArt.ts`, `CharacterArtwork.tsx/.css`, `CharacterAvatar.tsx`의 벡터·표정·방향·팔다리로 그립니다. 인사 화면은 `characterGreetings.ts`와 `CharacterGreeting.css`의 동작을 사용합니다. 실제 GIF 파일에 의존하지 않습니다.

## 뷰포트와 스타일

전역 스타일은 `index.css` → `native-play.css` → `PlayExperience.css` → `play-readability.css` → `mobile-game-layout.css` 순서로 적용됩니다. 개별 화면 스타일과 공통 `GameStage`·생활 놀이 스타일도 함께 사용합니다.

`100dvh`, Safe Area, overscroll 제한으로 화면을 관리합니다. 드래그·그리기 영역에는 `touch-action: none`, 홈·부모 설정의 스크롤 영역에는 `pan-y`를 사용합니다. 모든 영역의 스크롤을 막는 설정이 아닙니다. 입력 필드는 텍스트 선택을 허용합니다. 시스템 주소창·기기 제스처를 웹 앱이 완전히 제거할 수 있다고 가정하지 않습니다.

모바일은 배경을 채우면서 **놀이 콘텐츠의 비율을 제한**합니다. 특히 네 선택지는 2×2, 짝맞추기는 정사각형으로 배치합니다. 그리기·풍선·비눗방울 등 자유 놀이 영역은 넓게 유지합니다. 이미지를 늘려 찌그러뜨리거나 영상 해상도를 낮춰 해결하지 않습니다.

## 저장과 놀이 시간

| 저장소 | 데이터와 범위 |
|---|---|
| localStorage `ITSME_APP_STATE` | 선택 친구, 음성 언어·소리·진동, 당일 시간, 완료 통계와 기존 호환 필드 |
| localStorage `ITSME_CHILD_PROFILE` | 이름·생년월일. 월령·연령은 앱 진입 때 다시 계산 |
| IndexedDB `yuha-sketchbook` | `draft/current` 초안과 `gallery` 전시 그림·썸네일 |
| IndexedDB `yuha-character-audio` | 압축 음성·효과음 캐시 (최대 200개 / 12MiB) |
| 서비스 워커 Cache Storage | 방문한 정적 앱·이미지·아이콘·포스터. API·MP4 제외 |

`playSession.ts`는 기기 현지 날짜 자정에 당일 시간을 갱신합니다. 백그라운드·환영·부모 화면·게이트·시간 종료 동안은 놀이 허용 시간을 소모하지 않습니다. 부모가 타이머를 다시 선택하면 당일 총시간은 보존하면서 새 허용 시간을 시작합니다.

색칠하기는 `src/sketch/`에서 문서 모델·되돌리기·캔버스 좌표·SVG 도안·PNG 렌더를 관리합니다. 초안 저장은 debounce와 순차 쓰기를 사용하고 화면 이탈·숨김에서 flush합니다. 동일 그림 저장은 전시회 항목을 갱신합니다. 브라우저 강제 종료·저장 공간 부족은 완전 보존을 보장하지 않습니다. 로그인·클라우드 동기화는 구현되어 있지 않습니다.

## 영상과 오디오 수명

`CharacterCharmVideoModal`은 방향에 따라 `characterVideoPresentation.ts`에서 소스와 비율을 선택합니다. 세로 manifest에 없는 친구는 기존 영상, 가로는 `landscape/` 원본입니다. 회전 시 위치·일시정지·음소거를 이어가며, 닫을 때 HTML video 자원을 해제하고 `resumeAfterVideoPlayback`으로 게임 AudioContext를 복구합니다.

오디오는 [전용 문서](audio.md)를 참고합니다. API 키·생성 SDK·사용량 검사는 `src/server/`와 수동 제작 도구에만 두며 브라우저에 비밀 키를 전달하지 않습니다.

# Play-Game Agent Harness Pipeline Rules

## 1. 반자동 원스톱 3단계 파이프라인 (Planner → Builder → QA Evaluator)
새로운 놀이/화면 추가, 기존 놀이 교체, 또는 복합 기능 개선 요청 시 다음 3단계 하네스 흐름을 반자동 원스톱으로 수행합니다:

1. **Step 1 — 기획 요약 (`game-planner` / `game-scaffold`)**:
   - 유아 눈높이(실패 없는 터치 인과관계, 코믹 리액션, 연령별 `baby`/`sprout`/`bloom`/`star` 난이도 조절)에 맞춘 핵심 UX와 수정 대상 파일 목록을 5줄 이내로 먼저 설계합니다.
2. **Step 2 — 즉시 구현 (`game-builder`)**:
   - 별도 대기 없이 즉시 컴포넌트(`src/screens/games/*.tsx`), 카탈로그(`src/data/gameCatalog.ts`), 썸네일(`src/components/GameArtwork.tsx`), 라우팅(`src/App.tsx`), 스테이지 레이아웃(`src/components/GameStage.css`, `src/mobile-game-layout.css`)을 한 번에 동기화하여 구현합니다.
3. **Step 3 — 자동 검증 및 교정 (`game-qa-evaluator` + `npm run harness:check`)**:
   - `npm run harness:check && npm run lint && npm test && npm run build`를 실행하여 카탈로그 누락, `.game-cue` 상단 버튼 겹침, 음성/타이머 메모리 누수, 유료 스크립트 격리 위반이 없는지 확인하고, 문제 발견 시 즉시 수정한 뒤 최종 결과를 한 번에 보고합니다.

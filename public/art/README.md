# 놀이숲 그림 자산

기준일: 2026-10-09 · [문서 목차](../../docs/README.md)

## 배포 자산

- `playground-meadow.jpg`: 1536×1024. 2026-10-08 built-in imagegen으로 만든 동화책 초원입니다. 원본 PNG를 JPEG 품질 84로 변환해 사용합니다. 장식 배경이므로 로딩 실패 때도 놀이 대상과 조작은 유지합니다.
- `cookie-house.svg`: 직접 작성한 96×96 벡터 아이콘입니다. 과자 벽·딸기 아이싱·민트 창·초콜릿 문을 사용합니다. `src/components/CookieHouseIcon.tsx`와 `Header`의 홈 버튼에서 공유하며 버튼이 접근성 이름을 제공합니다.
- 색칠 도안은 별도 공개 SVG 폴더가 아니라 `src/sketch/art.ts`와 `art-extra.ts`의 벡터 경로 데이터로 정의합니다. `templateUrl`이 SVG data URL을 만들고 `template-bounds.ts`와 함께 색 채우기·살아나기·PNG 렌더에 사용합니다.

## 코드에서 그리는 그림

- 캐릭터 8명은 `src/data/characterArt.ts`와 `CharacterArtwork.tsx/.css`에서 색·실루엣·팔다리·의상·표정·방향을 공유합니다. `CharacterAvatar`는 초상/전신과 상황별 모션을 선택합니다.
- 놀이 도구는 `ToyArtwork.tsx`, 게임 썸네일은 `GameArtwork.tsx`와 `DevelopmentThumbnail.tsx`, 홈 바로가기는 `PlayNavArtwork.tsx`입니다.
- 곤충·수족관 친구는 `components/habitat/CreatureArtwork.tsx`, 배경은 `HabitatBackdrop.tsx`에서 벡터로 그립니다. 실사 이미지를 움직이는 방식이 아닙니다.
- 음식·입·양치 장면은 `ToddlerPlay.tsx` 및 `components/development/DevelopmentArt.tsx`의 놀이 그림을 사용합니다.

벡터는 크기에 맞춰 선명하게 렌더하며, 래스터 배경·영상의 비율과 원본 해상도를 보존합니다. 영상 제작용 외형 PNG/SVG는 [제작 참조](../../production/character-videos/references/)에 따로 보존합니다. 이미지 용량을 줄이기 위해 원본·시작 프레임·아이콘 master를 미사용 파일로 삭제하지 않습니다.

아래 프롬프트는 실제 초원 생성 입력의 기록입니다. 현재 UI 설계·실행 지침은 위 연결 소스를 기준으로 합니다.

## Generation prompt

Use case: illustration-story. Asset type: wide background for a preschool children's storybook game, landscape 1536x1024. Create a beautifully crafted children's picture book meadow, tactile gouache and soft paper-cut layers with rounded dimensional forms and delicate grain. Warm ivory sky, a soft pastel rainbow in the upper right, distant sage and teal rolling hills, a winding buttery cream path from the bottom center into the middle distance. Rounded leafy trees frame the far left and right edges, tiny coral pink and butter yellow flowers clustered near the lower corners. Empty open grass clearing in the middle for overlay game characters and UI, lots of calm negative space. Light mint, warm cream, apricot, dusty pink, teal. Sophisticated lovely illustration, gentle afternoon sunshine and soft shadows, clearly layered depth. No characters, no animals, no text, no letters, no logo, no border, no interface, no watermark. This is the actual background asset, not an app mockup.

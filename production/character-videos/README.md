# 세로 캐릭터 영상 제작 자료

## 현재 진행 상태

2026-10-09 기준 **제작 준비 완료 / 신규 영상 생성 0개**입니다.
현재 프로젝트에서 연결한 ElevenLabs 워크스페이스는 Starter입니다.
읽기 전용 `GET /v1/flows/video?page_size=1` 호출이 HTTP 402
`paid_plan_required`를 반환했습니다. 생성 요청과 생성 크레딧 소비는 없었습니다.
Pro 이상 플랜과 Image & Video 또는 Flows 권한이 확인되어야 진행할 수 있습니다.

- 원본 스토리 및 수정된 외형 설명: `../../public/videos/PROMPTS.md`
- 장면별 제작 계획: `plan.json` (8명 × 4장면)
- 게임 외형 참조: `references/<캐릭터ID>.png` 및 `.svg`
- 기존 영상 백업: `../../backups/character-videos/2026-10-09-landscape/`

## 참조 이미지

`src/components/CharacterArtwork.tsx`를 React의 `renderToStaticMarkup`으로
렌더링했습니다. 벡터 원본을 함께 보관하고, Sharp로 1024×1024 투명 PNG를
만들었습니다. 숨겨진 눈 모양(`friend-rest-eyes`)은 실제 게임의 기본 표시와
동일하게 숨겼습니다. 게임의 팔·다리·의상·장식·색상을 직접 참조합니다.

이미지 생성 모델로 장면 시작 프레임을 추가 제작할 때도 이 그림을 인물 참조로
사용합니다. 앱의 캐릭터 자체는 변경하지 않았습니다.

## 제작 및 교체 순서

1. 서버 전용 API 키로 플랜, 영상 권한, 모델별 비용, 포함 크레딧 잔량을 확인합니다.
   초과 과금이나 구독 변경은 자동으로 실행하지 않습니다.
2. `plan.json`은 제작 계획이며 그대로 API에 보낼 요청 본문이 아닙니다.
   `referenceImage` 파일을 PNG 바이트로 읽어 ElevenLabs의 `images` →
   `{ image: { type: 'inline_base64', contentBase64, mimeType: 'image/png' }, role: 'subject' }`
   참조로 변환합니다. 서버의 원시 JSON API를 이용하면 필드명을 snake_case로
   변환합니다. 로컬 경로와 장면 편집 메타데이터는 API 요청에서 제외합니다.
3. 9:16, 4K, 8초의 독립 장면을 각각 생성하고 생성 ID를 먼저 저장합니다.
   영상 폴링은 최소 10초 간격으로 시작해 최대 60초까지 늘립니다. 통신이 끊겨도
   저장된 ID를 조회하여 복구하며 같은 요청을 자동 재생성하지 않습니다.
4. 완료한 장면은 서명 URL이 만료되기 전에 로컬에 저장합니다. 원본 장면 4개를
   보존하고 마지막 장면에서 완결된 6초를 사용해 8+8+8+6=30초로 편집합니다.
   마지막 6초 안에 인사가 끝나지 않으면 해당 장면을 검토합니다.
5. `PROMPTS.md`의 한국어 대사를 기존 ElevenLabs 캐릭터 음성 설정으로
   장면별 합성합니다. 어린 목소리 톤과 말의 끝부분이 잘리지 않는지 확인하고,
   로컬 캐시를 재사용합니다. 음악·효과음은 대사를 가리지 않게 믹싱합니다.
6. 실제 출력이 2160×3840, 9:16, 30초인지 검사하고 장면별 캐릭터 일관성,
   얼굴·손·발의 왜곡, 영상 선명도, 더빙 및 모바일 재생을 검토합니다.
   낮은 해상도 출력의 단순 확대를 고해상도 원본으로 취급하지 않습니다.
7. 검증된 8개 결과를 `public/videos/<캐릭터ID>.mp4`에 적용합니다.
   현재 앱은 기존 영상을 그대로 재생합니다.

`scripts/generate-character-videos.ts`는 기존 Google API 기반 제작용이며,
`scripts/build-30s-character-videos.ts`는 짧은 영상을 반복 편집하는 이전 도구입니다.
이 새 세로 영상 제작 계획에는 사용하지 않습니다.

공식 문서:

- https://elevenlabs.io/docs/eleven-api/guides/cookbooks/image-and-video
- https://elevenlabs.io/docs/eleven-api/guides/how-to/image-and-video/references
- https://elevenlabs.io/docs/api-reference/flows/video/create

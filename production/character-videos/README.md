# 세로 캐릭터 영상 제작

## 현재 적용 상태 (2026-10-09)

- 핑구 완료: 서로 다른 네 장면, 한국어 더빙, 30초, 2160×3840 세로 영상.
- 핑구의 원본 영상은 백업 폴더에 보존했고 앱의 영상과 포스터를 교체했습니다.
- 사용자 요청에 따라 이번에는 핑구만 적용합니다. 나머지 7명은 생성하지 않았으며 기존 영상을 유지합니다.
- 재생 화면은 세로·가로 영상의 실제 비율에 맞추며, 저장된 영상을 재생할 때 생성 크레딧을 사용하지 않습니다.

## 제작 규격과 순서

- 스토리: `../../public/videos/PROMPTS.md`, 장면별 계획: `plan.json`
- 게임 외형 참조: `references/<캐릭터ID>.png` 및 SVG (게임 CharacterArtwork 렌더)
- 영상: Gemini API의 `veo-3.1-fast-generate-preview`, 4K 2160×3840, 9:16, 24fps
- 캐릭터마다 실제로 다른 8초 장면 네 개 생성. 8+8+8+6초로 편집.
- 핑구 → 꼬미 → 라노 → 젤리 → 도치 → 꿀꿀이 → 음메 → 누룽지 순서.
  한 캐릭터의 생성·더빙·검수·교체가 끝나야 다음 캐릭터를 시작합니다.
- 한국어 더빙: 기존 ElevenLabs 캐릭터 음성과 피치. 완료된 음성 캐시는 재사용합니다.
- 원본 백업: `../../backups/character-videos/2026-10-09-landscape/`
- 공개 적용 기록: `../../public/videos/portrait-manifest.json`, `completed/<캐릭터ID>.json`

## 실행

Node, 프로젝트 의존성, FFmpeg가 필요합니다. 서버 전용 키는 Git에서 제외된
`.env.local`의 `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`에서 읽습니다.
FFmpeg가 PATH에 없으면 `FFMPEG_PATH`에 실행 파일 절대 경로를 지정합니다.

```sh
node --import tsx scripts/generate-portrait-videos.ts generate pingu
node --import tsx scripts/generate-portrait-videos.ts build pingu
# 네 장면의 외형·동작·마지막 인사와 더빙을 직접 확인한 뒤 실행
node --import tsx scripts/generate-portrait-videos.ts publish pingu
```

`generate`는 현재 캐릭터의 네 장면만 요청하고 다운로드합니다. 같은 캐릭터의
장면은 함께 처리할 수 있지만 모든 결과 저장이 끝나기 전에는 다른 캐릭터를
시작하지 않습니다. `build`는 더빙을
캐시에서 가져오거나 포함 크레딧 안에서 생성한 뒤 길이를 맞추고 배경음을
덕킹하여 30초 결과를 만듭니다. `publish`는 규격과 체크섬, 원본 백업을
확인한 뒤 해당 캐릭터의 영상·포스터·캐시 버전을 교체합니다.

공식 2026-10-09 요금 기준 Fast 4K는 초당 $0.30으로, 캐릭터당 생성 32초
약 $9.60, 8명 약 $76.80입니다. 실제 사용량·세금·계정 잔액과 차이가 있을 수
있습니다. 재생은 저장된 파일만 사용하며 생성 API를 호출하지 않습니다.

## 저장과 재개

`.video-generation/portrait-v1/<캐릭터ID>/`는 Git에서 제외되며 다음을 보관합니다.

- `scene-N.json`: 요청 입력 해시, 모델, 작업 ID, 진행 상태
- `scene-N.mp4`: 다운받은 4K 원본 장면
- `dubs/`: 원본 음성, 합성 요청 기록, 캐릭터 피치를 적용한 WAV
- `final.mp4`, `poster.jpg`, `validated.json`: 편집 결과와 검증값

통신 중단 후 같은 `generate` 명령을 실행하면 저장된 작업 ID를 조회합니다.
완성된 파일은 재사용하며 자동 유료 재생성은 하지 않습니다. HTTP 402 등
명시적인 요청 거절은 원인을 해결한 뒤 `--retry-rejected`를 붙여 재개합니다.
작업 ID가 오기 전에 연결이 끊긴 불확실한 요청은 중복 과금을 막기 위해
중단합니다. API에서 결과를 먼저 확인하고 기록을 복구해야 합니다.
`active.lock`이 남았다면 `--recover-lock`을 붙여 실행합니다. 기록된 PID가
종료된 경우에만 잠금을 해제하며 실행 중인 프로세스의 잠금은 유지합니다.

## 검수

스크립트는 2160×3840, 24fps, 장면 8초/최종 30초를 검사합니다. 더빙은
원문을 자르지 않고 자연스러운 범위의 템포만 조정하며 각 장면에 맞는 길이를
확인합니다. 최종 영상의 실제 외형, 오디오, 장면 경계와 모바일 재생은 직접
검토합니다. 기존 짧은 영상을 반복·확대하는 `build-30s-character-videos.ts`는
이 제작에 사용하지 않습니다.

공식 문서:

- https://ai.google.dev/gemini-api/docs/veo
- https://ai.google.dev/gemini-api/docs/pricing#veo-3.1

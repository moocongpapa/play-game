# 세로 캐릭터 영상 제작

## 현재 적용 상태 (2026-10-09)

- 핑구 완료: 서로 다른 네 장면, 한국어 더빙, 30초, 2160×3840 세로 영상.
- 핑구의 원본 영상은 백업 폴더에 보존했고 앱의 영상과 포스터를 교체했습니다.
- 꼬미·라노 완료: 각각 네 장면, 한국어 더빙, 30초, 1080×1920 Lite 영상과 포스터를 앱에 적용했습니다.
- 젤리는 1·3·4번 장면을 저장했고 2번 장면은 HTTP 429로 거절됐습니다. 나머지 네 캐릭터의 영상 생성은 아직 시작하지 않았습니다.
- 나머지 7명의 한국어 더빙 28개와 세로 시작 이미지 7개는 모두 준비했습니다. 더빙 원본은 `public/audio/elevenlabs/speech/`에 보관하며 `dubbing-manifest.json`에 길이·피치·체크섬을 기록했습니다. 재개할 때 추가 합성 없이 재사용합니다.
- 영상 생성은 Google 일일 한도 때문에 대기 중입니다. 2026-10-09 확인한 Lite 한도는 분당 2회, 하루 10회이며 AI Studio는 사용량 11회를 표시했습니다. 충전 잔액 부족이 아닙니다.
- 재생 화면은 세로·가로 영상의 실제 비율에 맞추며, 저장된 영상을 재생할 때 생성 크레딧을 사용하지 않습니다.
- 이후 새 영상은 사용자 지정 **Veo 3.1 Lite / 1080p / 생성 초당 $0.08**로 제작합니다. 영상은 한 캐릭터의 편집·더빙·저장을 마친 뒤 다음 캐릭터로 진행합니다.

## 비용 정책

- 허용 모델: `veo-3.1-lite-generate-preview`, 해상도 `1080p`.
- 캐릭터당 8초 × 4장면 = 32초 생성, 영상 생성 예상 **$2.56**. 30초 편집 결과의 재생은 무료이며 ElevenLabs 더빙 비용은 별도입니다.
- 기존 핑구는 Fast 4K로 제작한 완료본입니다. 해당 영상·장면 입력·검증 기록은 보존하며 이 변경으로 다시 생성하지 않습니다.
- 다른 모델이나 더 높은 해상도로 자동 전환하지 않습니다. Lite를 사용할 수 없거나 오류가 나면 중단합니다.
- 사용자 요청에 따라 외형·구도·더빙은 꼼꼼히 준비하되, 생성 후 품질 편차는 유료 재생성 없이 그대로 사용합니다. 기술적으로 재생 가능한지와 더빙 길이·음량은 검증합니다.
- 생성 ID와 결과 파일을 저장·재사용합니다. 불확실한 요청을 새 요청으로 반복하지 않습니다.
- 이 정책은 `plan.json`의 `productionPolicy`에 기록되어 있습니다. 실제 사용량·세금·계정 잔액은 예상액과 차이가 있을 수 있습니다.

## 제작 규격과 순서

- 스토리: `../../public/videos/PROMPTS.md`, 장면별 계획: `plan.json`
- 게임 외형 참조: `references/<캐릭터ID>.png` 및 SVG (게임 CharacterArtwork 렌더)
- 신규 영상: Gemini API의 `veo-3.1-lite-generate-preview`, 1080×1920, 9:16, 24fps
- 캐릭터마다 실제로 다른 8초 장면 네 개 생성. 8+8+8+6초로 편집.
- 핑구 → 꼬미 → 라노 → 젤리 → 도치 → 꿀꿀이 → 음메 → 누룽지 순서.
  한 캐릭터의 영상 생성·더빙 결합·검수·교체가 끝나야 다음 캐릭터의 영상을 시작합니다. 영상 한도 대기 중에는 다른 캐릭터의 시작 이미지와 더빙을 미리 준비할 수 있습니다.
- 한국어 더빙: 기존 ElevenLabs 캐릭터 음성과 피치. 완료된 음성 캐시는 재사용합니다.
- 원본 백업: `../../backups/character-videos/2026-10-09-landscape/`
- 공개 적용 기록: `../../public/videos/portrait-manifest.json`, `completed/<캐릭터ID>.json`

### Lite의 캐릭터 외형 유지

Lite는 `referenceImages`를 지원하지 않으며, `image`에 넣은 한 장을 시작
프레임으로 움직이게 합니다. 기존 정사각형 캐릭터 참조를 그대로 첫 프레임으로
넣지 않고, 게임 외형과 해당 장면의 배경을 담은 세로 시작 프레임을 먼저 준비해
검토합니다. 각 장면의 `startFrameImage`는
`starting-frames/<캐릭터ID>/opening.png`를 가리킵니다. 캐릭터당 하나의 시작 이미지를 네 장면에 재사용하며 서로 다른 장면별 동작을 요청합니다.

시작 이미지는 게임 외형과 핑구의 클레이 스타일을 참고해 built-in imagegen으로 준비합니다. Gemini 이미지 생성 API는 호출하지 않습니다. 사용한 프롬프트는 캐릭터별 `prompt.md`에 보관합니다. 1080×1920 PNG를 확인한 뒤 영상 생성을 시작하며, 준비되지 않은 경우 API 요청 전에 중단합니다.

## 실행

Node, 프로젝트 의존성, FFmpeg가 필요합니다. 서버 전용 키는 Git에서 제외된
`.env.local`의 `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`에서 읽습니다.
FFmpeg가 PATH에 없으면 `FFMPEG_PATH`에 실행 파일 절대 경로를 지정합니다.

```sh
# 꼬미의 시작 이미지를 준비·검토한 후 실행
node --import tsx scripts/generate-portrait-videos.ts generate ggomi
node --import tsx scripts/generate-portrait-videos.ts build ggomi
# 네 장면의 외형·동작·마지막 인사와 더빙을 직접 확인한 뒤 실행
node --import tsx scripts/generate-portrait-videos.ts publish ggomi
```

`generate`는 현재 캐릭터의 네 장면을 하나씩 요청하며 첫 실패에서 중단합니다. 계정의 낮은 분당 한도를 고려해 `--parallel-scenes`는 API 호출 전에 차단합니다. `build`는 더빙을
캐시에서 가져오거나 포함 크레딧 안에서 생성한 뒤 길이를 맞추고 배경음을
덕킹하여 30초 결과를 만듭니다. `publish`는 규격과 체크섬, 원본 백업을
확인한 뒤 해당 캐릭터의 영상·포스터·캐시 버전을 교체합니다.

재생은 저장된 파일만 사용하며 생성 API를 호출하지 않습니다.

### 현재 중단 지점에서 재개

Google의 하루 한도는 미국 태평양 시간 자정에 초기화됩니다. 이번 확인 시점의 다음 초기화는 **2026-10-10 16:00 한국 시간**입니다. 계정 화면에서 한도 초기화를 확인한 뒤 아래 명령으로 젤리의 누락 장면만 생성합니다. 자동 예약이나 자동 재시도는 설정하지 않았습니다.

```sh
node --import tsx scripts/generate-portrait-videos.ts generate jelly --scene=2 --retry-rejected
node --import tsx scripts/generate-portrait-videos.ts build jelly
# 네 장면과 더빙을 검수한 뒤
node --import tsx scripts/generate-portrait-videos.ts publish jelly
```

그다음 도치 → 꿀꿀이 → 음메 → 누룽지 순서로 진행합니다. 잔여 영상은 17장면이므로 현재 하루 한도에서는 추가로 두 번의 일일 할당이 필요합니다. 현재 배치의 성공한 Lite 생성은 11장면·88초로 영상 예상 비용은 **$7.04**입니다. 더빙은 총 585자의 대사 28개를 포함 크레딧으로 생성했습니다. 정확한 청구 금액은 공급자 사용량 화면을 기준으로 합니다.

라노 일부 장면에 귀·표정 변화가 있습니다. 유료 품질 재생성 없이 사용한다는 요청에 따라 유지했으며, 이후 장면에는 원래 해부 구조와 의상을 유지하도록 지시를 보강했습니다.

## 저장과 재개

`.video-generation/portrait-v1/<캐릭터ID>/`는 Git에서 제외되며 다음을 보관합니다.

- `scene-N.json`: 요청 입력 해시, 모델, 작업 ID, 진행 상태
- `scene-N.mp4`: 다운받은 원본 장면(신규 Lite 1080p, 기존 핑구 4K)
- `dubs/`: 원본 음성, 합성 요청 기록, 캐릭터 피치를 적용한 WAV
- `final.mp4`, `poster.jpg`, `validated.json`: 편집 결과와 검증값

통신 중단 후 같은 `generate` 명령을 실행하면 저장된 작업 ID를 조회합니다.
완성된 파일은 재사용하며 자동 유료 재생성은 하지 않습니다. HTTP 402 등
명시적인 요청 거절은 원인을 해결한 뒤 승인된 제작 범위 안에서만
`--retry-rejected`를 붙여 재개합니다. 이 옵션은 유료 품질 재생성 승인을
대신하지 않습니다.
작업 ID가 오기 전에 연결이 끊긴 불확실한 요청은 중복 과금을 막기 위해
중단합니다. API에서 결과를 먼저 확인하고 기록을 복구해야 합니다.
`active.lock`이 남았다면 `--recover-lock`을 붙여 실행합니다. 기록된 PID가
종료된 경우에만 잠금을 해제하며 실행 중인 프로세스의 잠금은 유지합니다.

## 검수

스크립트는 장면 계획에 맞는 해상도(신규 1080×1920, 기존 핑구 2160×3840),
24fps, 장면 8초/최종 30초를 검사합니다. 더빙은
원문을 자르지 않고 자연스러운 범위의 템포만 조정하며 각 장면에 맞는 길이를
확인합니다. 최종 영상의 실제 외형, 오디오, 장면 경계와 모바일 재생은 직접
검토합니다. 기존 짧은 영상을 반복·확대하는 `build-30s-character-videos.ts`는
이 제작에 사용하지 않습니다.

공식 문서:

- https://ai.google.dev/gemini-api/docs/veo
- https://ai.google.dev/gemini-api/docs/pricing#veo-3.1
- https://ai.google.dev/gemini-api/docs/rate-limits

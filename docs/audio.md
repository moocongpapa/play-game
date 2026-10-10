# 음성·배경음악·효과음

기준일: 2026-10-10 · [목차](README.md)

## 음성 재생 순서

게임에서는 `soundEngine.speakText(text, soundEnabled, { characterId: buddy })`를 사용합니다. 언어 변환·중복 방지·음소거·BGM 덕킹·기기 음성 대체를 함께 처리합니다. 내부 AI/저장 음성 함수 이름은 호환상 `playGeminiSpeech`이지만 현재 우선 공급자는 ElevenLabs입니다.

1. 선택 친구와 언어에 맞는 대사를 정규화합니다. 기본 언어는 **한국어**이며 부모 설정에서 영어를 고릅니다.
2. 메모리 재생 캐시, 브라우저 IndexedDB, 등록된 `public/audio/elevenlabs/speech/` 파일을 확인합니다.
3. 저장 파일이 없는 새로운 대사에 한해 같은 출처의 `/api/speech`를 요청합니다. ElevenLabs 키가 있으면 포함 크레딧이 확인된 ElevenLabs만 사용합니다.
4. 생성·저장 파일 재생이 불가능하면 기기의 SpeechSynthesis로 대체합니다. ElevenLabs 한도가 끝났다고 다른 유료 공급자로 자동 전환하지 않습니다.

파일·캐시를 재생할 때 생성 크레딧을 사용하지 않습니다. 배포된 저장 음성의 다운로드 실패도 유료 재생성하지 않습니다. 아직 저장하지 않은 숫자나 맞춤 이름 대사는 최초 사용 시 새 요청이 필요할 수 있습니다. 생성 음성의 브라우저 저장은 기기별이며 서버의 전역 음성 파일 저장 기능은 없습니다.

같은 친구·언어·대사의 버튼을 연속으로 누르면 처음 음성이 끝날 때까지 유지합니다. 다른 대사·화면 전환·음소거는 기존 재생을 정리할 수 있습니다. 숫자 놀이터는 첫 숫자를 끝낸 뒤 최신 대기 숫자 하나만 읽는 별도 관리자를 사용합니다.

## 목소리와 언어

- `characterVoices.ts`: 8명의 성격·속도·피치·공급자 음성.
- ElevenLabs 모델·출력: `eleven_multilingual_v2`, `mp3_44100_128`.
- 기본 음성은 Jessica와 Laura라는 가벼운 **성인 여성 음성**입니다. 실제 아동 녹음이 아니며 캐릭터별 느린 합성과 1.08~1.14배 재생 피치로 앳된 느낌을 만듭니다. 성인 남성 저음은 사용하지 않습니다.
- `speechLanguage.ts`, `speechEnglish.ts`, `speechFriendsEnglish.ts`, `speechWords.ts`가 한국어→영어 안내를 관리합니다. 기기 대체 목소리는 설치된 음성과 언어 지원에 따라 달라집니다.
- `SpeakOptions.englishText`는 숫자처럼 문맥별 영어 대사가 필요한 경우에만 사용합니다. 같은 글자 ‘이’를 항상 같은 영어로 치환하지 않습니다.
- 영어 옵션은 음성 대사를 바꾸며 동물 녹음·비언어 효과음·음악·한국어 게임 내용 전체를 번역하는 기능이 아닙니다. 영상에 합쳐진 한국어 더빙도 이 설정으로 바뀌지 않습니다.

## 포함 크레딧과 API 계약

런타임의 `elevenLabsAudio.ts`는 생성 직전에 공급자의 구독 상태를 확인합니다. **Free·Starter + 초과 과금 꺼짐**으로 확인되는 계정만 새 음성·효과음을 생성합니다. 상위 플랜으로 변경하거나 구독 상태를 확인할 수 없으면 저장 음성과 기기 목소리를 사용합니다. 월초가 아니라 공급자가 반환하는 청구 주기 초기화 시점을 사용합니다. 남은 크레딧을 소비하려고 쓰지 않을 콘텐츠를 자동 생성하거나 매달 예약 생성하지 않습니다.

`api/speech.ts`와 Vite 미들웨어는 같은 `speechEndpoint.ts`를 사용합니다.

| 요청 | 계약 |
|---|---|
| `GET /api/speech` | `available`, `engine`, ElevenLabs 구독·잔여 한도 상태. 상태 조회 자체는 음성을 생성하지 않음 |
| `POST /api/speech` | 앱과 같은 Origin의 JSON. `{ text, characterId, language }` 또는 등록된 `{ effectId }` |
| 본문 제한 | 최대 4KiB, 대사 최대 300자, 언어 `ko/en`, 캐릭터 8명, 효과음 고정 목록만 허용 |
| 음성 응답 | ElevenLabs `audio/mpeg`; Gemini-only 호환 `audio/wav`; `X-Speech-Provider` 헤더 |
| 공유 요청 한도 | IP당 30회/60초, 300회/24시간, 앱 전체 1,200회/24시간. 첫 예약부터 만료되는 창이며 달력 자정과 다름 |

Redis는 세 카운터를 원자적으로 예약합니다. IP는 해시로 저장하며 대사 원문은 Redis에 저장하지 않습니다. 공급자 구독 확인은 청구 상한을 따르기 위한 검사이고 별도의 정확한 로컬 크레딧 장부가 아닙니다. 정확한 계정 과금은 공급자 내역을 확인합니다.

Redis 없는 배포는 검증된 ElevenLabs 경로만 허용합니다. Gemini-only 배포에는 Redis가 필수입니다. 로컬 개발은 메모리 한도를 사용하며 서버 재시작 시 초기화됩니다. 생성 SDK의 자동 재시도는 끄고, 네트워크 오류 후 이미 청구됐을 가능성을 고려합니다.

## 저장된 자산

현재 런타임 음성 manifest에 **698개 파일**이 등록되어 있습니다. 일부 제작용 더빙은 같은 디렉터리에 있으나 `dubbing-manifest.json`으로 별도 관리합니다. 합성 요청이 동일하면 파일을 공유하고, 캐릭터별 피치는 재생할 때 적용합니다. 메모리는 최대 60개 디코드 음성을 유지하고 IndexedDB는 압축 오디오 200개 / 12MiB를 오래된 순서로 정리합니다.

| 종류 | 자산·동작 |
|---|---|
| 놀이 음악 | `jelly-picnic`, `pingu-sea`, `friends-parade`, 각 30초. 섞어서 순환 |
| 잠자리 음악 | `star-lullaby`, 40초. 잔잔한 잠자리 장면용 |
| 음악 대체 | Web Audio로 원래 작성한 6개 놀이 편곡 + 자장가 연주 |
| 효과음 | `tap/bounce/pop/bubble/sparkle/success` 6개 저장 MP3. 준비 전에는 즉시 합성음, 파일이 늦게 오면 해당 터치 소리를 뒤늦게 재생하지 않음 |
| 생활습관 말소리 | 먹기·냠냠·물 마시기·양치·치약·닦기·헹구기·뱉기 8행동 × 두 언어 × 두 합성 기본 음성 = 32개 저장 파일 |
| 동물 소리 | 현장 녹음 14종. 식별 문제에 쓰는 원래 피치를 유지. [출처와 라이선스](../public/audio/CREDITS.html) 보존 |
| 실로폰·리듬 | Web Audio로 음 높이를 유지해 연주. 효과음 무작위 피치를 음악 음정에 적용하지 않음 |

효과음 피치는 0.95~1.05배로 변화합니다. 안내·동물·리듬·악기·핵심 효과음 동안 배경음을 부드럽게 30%로 낮추며 영상 중에는 배경음을 꺼서 겹침을 피합니다. 부모의 BGM 끄기·전체 음소거를 존중합니다. 브라우저 자동 재생 정책 때문에 첫 터치 전에는 소리가 막힐 수 있습니다.

### iPad·iPhone과 홈 화면에 설치한 앱

`audioContextLifecycle.ts`는 지원 브라우저에서 `navigator.audioSession.type = 'playback'`을 적용합니다. iPadOS/iOS 17 이상 Safari에서는 기본 ambient 오디오가 시스템 무음 모드에 막혀 영상만 들릴 수 있기 때문입니다. 이미 running인 AudioContext에도 재생 경로를 적용하며, 영상 종료 후 복구 때 다시 확인합니다. [WebKit 설명](https://bugs.webkit.org/show_bug.cgi?id=237322)

오디오 활성화는 capture 단계의 `pointerdown/pointerup/touchend/keydown`에서 시도합니다. 터치를 놓는 시점도 처리하고, 자식 버튼의 이벤트 전파 중단에 영향을 받지 않습니다. 환영 화면의 첫 터치도 활성화에 사용하며, 전체 음소거·숨긴 페이지·놀이 시간 종료 상태에서는 실행하지 않습니다. 구형 iPadOS처럼 Audio Session API가 없으면 기존 재생 경로를 유지하므로 시스템 무음 해제가 필요할 수 있습니다. 지원 API가 없거나 거절되어도 앱은 계속 동작합니다.

## 유지보수용 생성·검증

앱 시작·빌드·자동 테스트는 아래 제작 명령을 실행하지 않습니다. 새 생성이 필요한 작업에서만 사용하고 기존 파일을 먼저 확인합니다.

### 음악과 고정 효과음

```sh
# 빠진 자산이 있으면 실제 생성 크레딧을 사용합니다.
node --import tsx scripts/generate-play-audio.ts
```

기존 파일을 건너뛰며 Free·Starter 포함 크레딧과 초과 과금 꺼짐을 확인합니다. 음악 생성 분기는 Starter에서만 실행하며, 보수적인 요청 전 예약량·5,000크레딧 배치 제한을 사용합니다. 청구 주기·한도 변화를 확인하면 중단합니다. 이 도구는 영상 도구와 달리 불확실한 음악 요청의 작업 ID를 복구하는 기능이 없으므로 중단 후 무조건 재실행하지 않습니다.

### 생활습관 음성

```sh
# 저장 파일을 검증합니다. 누락 시 생성하지 않고 중단합니다.
node --import tsx scripts/generate-care-voices.ts
# 필요한 신규 생성이 승인된 제작 작업에서만 사용합니다.
node --import tsx scripts/generate-care-voices.ts --generate
```

FFmpeg가 필요하며 `CARE_FFMPEG`로 경로를 지정할 수 있습니다. **검증 명령도** manifest·재생 길이·catalog를 다시 저장합니다. 실행 후 변경을 검토합니다. 생성 모드는 포함 크레딧·초과 과금 꺼짐·배치 2,000자 한도를 확인하고, 불확실한 요청 기록이 남으면 중단합니다. 원음·요청 기록은 Git에서 제외된 `.audio-generation/care/`에 보존합니다.

영상 더빙 제작·재사용은 [영상 제작 문서](../production/character-videos/README.md)와 `character-video-audio.ts`에서 관리합니다. 저장 오디오의 출처·기존 생성 배치 기록은 [자산 README](../public/audio/elevenlabs/README.md)에 있습니다. 부모 상태와 API 오류 확인은 [문제 해결](development.md)을 참고합니다.

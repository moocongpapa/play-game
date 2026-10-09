# 저장된 ElevenLabs 오디오

기준일: 2026-10-09 · [전체 오디오 안내](../../../docs/audio.md) · [문서 목차](../../../docs/README.md)

이 폴더의 음성·음악·효과음은 제작 후 앱에 포함해 반복 재생합니다. 저장 파일 재생은 ElevenLabs 생성 API를 호출하지 않습니다. 새 대사 생성과 계정 한도 검사는 서버의 별도 작업입니다.

## 배포 자산

| 경로·ID | 내용 |
|---|---|
| `jelly-picnic.mp3`, `pingu-sea.mp3`, `friends-parade.mp3` | 앱 전용 오리지널 놀이 음악, 각각 30초 |
| `star-lullaby.mp3` | 오리지널 잠자리 음악, 40초 |
| `eleven-play-v1-*.mp3` | tap·bounce·pop·bubble·sparkle·success 6종 |
| `speech/*.mp3` | 안내·칭찬·생활습관 반응과 캐릭터 영상 더빙 |
| `speech/catalog.json` | 등록 음성의 텍스트·언어·공유 캐릭터·바이트·SHA-256 기록 |

런타임 `src/data/generatedSpeechManifest.ts`에는 **698개 저장 음성**이 등록되어 있습니다. 영상용 대사는 [더빙 manifest](../../../production/character-videos/dubbing-manifest.json)에서도 관리합니다. 파일명은 정규화된 대사·언어·합성 설정의 해시이며, 같은 합성 입력은 재사용합니다. 캐릭터별 피치는 브라우저 재생과 더빙 편집에서 적용합니다.

## 제작 출처

음악·고정 효과음의 첫 배치는 2026-10-09 공식 Node SDK와 당시 승인된 Starter 포함 크레딧으로 생성했습니다. 초과 과금은 꺼져 있었고 첫 배치 기록은 **1,630크레딧**입니다. 이 수치는 모든 음성·영상·후속 생성의 총비용이 아닙니다.

MP3 출력은 44.1kHz·128kbps입니다. 기존 노래·가수 모방이나 타인의 녹음을 이 생성 프롬프트에 사용하지 않았습니다. 실제 동물 녹음은 별도 `public/audio/animals/`에 있으며 [출처·라이선스](../CREDITS.html)를 유지합니다. 서비스 출처: [ElevenLabs](https://elevenlabs.io).

음악 프롬프트·길이는 `src/data/generatedMusic.ts`, 효과음 프롬프트·고정 목록은 `src/data/audioExperience.ts`가 기준입니다. 만들거나 검증하는 정확한 명령과 과금 여부는 [오디오 제작 도구](../../../docs/audio.md#유지보수용-생성검증)를 확인합니다.

## 생활습관 반응

munch·yum·gulp·brush·toothpaste·wipe·rinse·spit 8행동을 한국어·영어로 저장했습니다. 두 기본 음성의 **32개 원본**을 캐릭터 8명이 각자 피치로 사용합니다. 바깥 무음만 제거하고 -20 LUFS / -4dB true peak로 정리했으며 단어를 자르지 않았습니다.

- 대사: `src/data/careReactions.ts`.
- 파일 연결: `generatedSpeechManifest.ts`.
- 동작 길이: `generatedCareVoiceDurations.ts`.
- 재생: `useCareReactions.ts`. 게임 진입 때 저장 파일을 준비하고 반복 문지르기는 현재 음성을 재사용합니다.
- 검증: `node --import tsx scripts/generate-care-voices.ts`. FFmpeg 필요. 기본 모드는 유료 합성을 하지 않으며 등록·길이·catalog를 다시 저장합니다.
- 누락 원본 생성은 명시적 `--generate`에서만 수행합니다. 원음·요청 기록은 Git에서 제외된 `.audio-generation/care/`에 보존합니다.

파일을 지우거나 이름·합성 설정을 바꾸면 등록·캐시 키·재생 길이를 함께 확인합니다. 저장 파일 배송 오류를 유료 재생성으로 해결하지 않습니다.

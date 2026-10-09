# 문서 목차

기준일: **2026-10-09**. 처음 시작하는 경우 [프로젝트 README](../README.md)와 [개발 환경](development.md)을 읽습니다.

## 현재 앱과 유지보수

| 문서 | 내용 |
|---|---|
| [개발 환경](development.md) | 실행, 환경 변수, 배포, API 확인과 문제 해결 |
| [아키텍처](architecture.md) | 화면·상태·저장, 공통 UX, 오디오 수명 관리 |
| [전체 게임](games.md) | 현재 30종과 연령별 메뉴, 자유 놀이, 게임 등록 방법 |
| [오디오](audio.md) | 저장 음성, 언어·캐릭터, 크레딧, 음악·효과음 제작 |
| [유지보수](maintenance.md) | 검증, 정리한 파일, 보존해야 하는 자산, 제한 사항 |
| [저장소 작업 규칙](../AGENTS.md) | 변경 검토, 검사, 선택적 스테이징, 커밋·푸시 |

## 자산과 영상

- [그림·과자 집](../public/art/README.md), [젤리 설치 아이콘](../public/icons/README.md).
- [ElevenLabs 저장 자산](../public/audio/elevenlabs/README.md), [동물 녹음 출처·라이선스](../public/audio/CREDITS.html).
- [현재 영상 제작·재개](../production/character-videos/README.md), [캐릭터별 스토리보드](../public/videos/PROMPTS.md).
- 실제 앱 적용 목록: [세로 manifest](../public/videos/portrait-manifest.json), [가로 manifest](../public/videos/landscape-manifest.json).
- [원본 영상 백업](../backups/character-videos/2026-10-09-landscape/README.md). 백업의 `PROMPTS.md`는 복사 당시의 기록으로 유지합니다.
- `production/character-videos/starting-frames/*/prompt.md`는 실제 사용한 생성 입력과 출처 기록입니다. 외부 절대 경로는 제작 당시 경로이며, 앱은 각 폴더의 `opening.png`를 제작에 사용합니다.

## 검증 기록

| 기록 | 해당 범위 |
|---|---|
| [전체 놀이 반응형 QA](responsive-play-qa-2026-10-09.md) | 숫자 놀이터 추가 전의 모바일·태블릿·PC 플레이, 당시 112개 테스트 |
| [숫자 놀이터](number-parade.md) | 추가 게임·두 숫자 읽기·빠른 입력·API 응답, 당시 115개 테스트 |
| [모바일 콘텐츠 비율](mobile-content-proportions.md) | 그 후 모바일 29개 게임 배치 및 일부 실제 진행 |

검증 기록에 적힌 성공은 그 시점과 범위에 대한 결과입니다. 현재 변경 검증은 [유지보수 문서](maintenance.md)의 절차로 실행합니다.

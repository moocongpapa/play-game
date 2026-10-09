# 기존 캐릭터 영상 원본 백업

문서 확인일: 2026-10-09 · [현재 영상 제작](../../../production/character-videos/README.md) · [문서 목차](../../../docs/README.md)

2026-10-09에 `public/videos/`의 가로 영상 8개와 당시 `PROMPTS.md`를 복사했습니다. 영상 원본을 수정·재인코딩하지 않았으며 각 파일의 바이트 수와 SHA-256은 [manifest.json](manifest.json)에 있습니다. 이 폴더의 [PROMPTS.md](PROMPTS.md)는 **백업 시점의 원문**으로 보존하며 현재 API·모델·진행 상태의 안내가 아닙니다.

현재 핑구·꼬미·라노의 새 세로 영상은 `public/videos/`에 적용되어 있습니다. 가로 화면은 별도 `public/videos/landscape/`의 같은 원본을 사용합니다. 이 백업 폴더는 `public/` 밖에 있어 Vite 배포 산출물에 포함되지 않으며 중복 파일이더라도 원본 복구 목적 때문에 유지합니다.

복구 전 `manifest.json`의 크기·SHA-256을 확인합니다. 가로 재생 원본을 복구할 때는 `public/videos/landscape/`의 대응 파일을 사용하고 포스터·가로 manifest와 함께 검토합니다. `public/videos/<ID>.mp4`에 원본을 덮어쓰면 완성된 세로 영상과 manifest가 불일치하므로, 세로 교체의 롤백은 대응 manifest·포스터·완료 기록도 함께 복구해야 합니다. 정상 완료된 새 영상은 [세로 manifest](../../../public/videos/portrait-manifest.json)로 확인합니다.

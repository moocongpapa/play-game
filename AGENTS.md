# Repository guide

## Project map

- This is a React 19, TypeScript, and Vite app for children's character games.
- `src/App.tsx` owns navigation, rewards, timer state, and localStorage persistence.
- `src/screens/games/` contains individual games; `src/screens/RainbowStageAdventure.tsx` contains the multistage game.
- `src/data/` contains characters, age-specific game questions, stickers, and video scenes.
- `src/utils/ageEngine.ts` sets age groups and difficulty; `src/utils/soundEngine.ts` handles music, effects, and speech fallbacks.
- `src/services/` connects browser speech to the same-origin API and caches saved/generated audio. `src/server/` and `api/speech.ts` own provider calls, included-credit checks, and request quotas.
- `src/sketch/` owns the drawing model, undo, rendering, and local IndexedDB draft/gallery storage. There is no active Firebase/Google Drive integration.
- `public/` contains shipped art/audio/video/PWA assets. `production/character-videos/` owns the four-scene portrait plan and completion records; `backups/` preserves prior landscape originals.
- `scripts/generate-portrait-videos.ts`, `generate-play-audio.ts`, and `generate-care-voices.ts` are manual maintainer tools. They must not run during app startup, build, or ordinary verification; generation can spend credits.
- `docs/README.md` indexes current architecture, setup, games, audio, maintenance, and dated QA records. Update relevant docs when behavior changes.
- `tests/review-regressions.html` is a manual browser harness; `npm test` runs the server/utility tests without paid generation.

## Git workflow

- After each repository change request, review the finished changes, then commit and push the intended files. The user has authorized this as a standing workflow unless they explicitly say otherwise; do not ask for confirmation again.
- Before staging, inspect `git status`, the diff, and untracked files. Preserve changes outside the requested scope and never include secrets or local `.env` files.
- Run `npm run lint` and `npm run build` for code changes. Report any failure instead of claiming the change was verified.
- Stage only the intended files, review the staged diff, then commit with a concise message describing the change.
- Push the current branch to its configured upstream without force pushing. If the remote has advanced, reconcile it safely before pushing. Report the commit hash and push result.

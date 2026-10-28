---
name: team-pipeline
description: >-
  Use this skill to execute the semi-auto one-stop 3-stage agent harness pipeline (Planner -> Builder -> QA Evaluator) when building new games, replacing games, or implementing multi-screen features.
---

# Semi-Auto One-Stop Team Pipeline (`team-pipeline`)

Execute this 3-stage pipeline seamlessly without stalling between stages:

## Stage 1: Planner (`game-planner`)
- Produce a concise 5-line specification before editing files:
  1. **Concept & 3-Round Progression**: Theme, flavor/character progression, and comedic payoff.
  2. **Tactile Interaction**: Direct target tap + forgiving container/button tap for `baby`/`sprout`/`bloom`/`star`.
  3. **Coupled Files**: `src/screens/games/...`, `src/data/gameCatalog.ts`, `src/components/GameArtwork.tsx`, `src/types.ts`, `src/App.tsx`, CSS files.
  4. **Audio & Cleanup**: `useGameTimeouts`, `stopAllSpeech`, completion lock ref.
  5. **Layout Guard**: `.game-cue` relative-flex alignment and compositor-only animations (`transform`, `opacity`, `@media (prefers-reduced-motion: reduce)`).

## Stage 2: Builder (`game-builder`)
- Implement all code and registry changes from Stage 1 in a single cohesive pass, following `.agents/skills/game-scaffold/SKILL.md`.
- For complex multi-game tasks, you may delegate parallel implementation or auditing to `invoke_subagent` using `game-planner`, `game-builder`, or `game-qa-evaluator`.

## Stage 3: QA Evaluator (`game-qa-evaluator`)
- Run:
  ```bash
  npm run harness:check && npm run lint && npm test && npm run build
  ```
- Fix any errors or warnings immediately, then commit and push per `AGENTS.md` and report the finished result once.

---
name: game-scaffold
description: >-
  Use this skill whenever the user asks to add a new children's game, replace an existing game in src/screens/games/, or wire a game into the home catalog and stage layout. Ensures 100% synchronization across types, catalog, thumbnail artwork, routing, stage CSS, and audio/timer cleanup.
---

# Game Scaffold Runbook (`game-scaffold`)

Follow this checklist whenever creating or replacing a game in `play-game` so zero registries or layout rules are missed.

## Step 1: Game Component (`src/screens/games/<GameName>Game.tsx`)
1. Accept standard props:
   ```ts
   interface GameProps {
     buddy: CharacterId;
     onCompleteQuiz: (starsEarned: number) => void;
     soundEnabled: boolean;
     ageGroup?: AgeGroup;
     childName?: string;
   }
   ```
2. **Lifecycle & Audio Hygiene**:
   - Use `const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();` for all delayed transitions.
   - Clean up on unmount:
     ```ts
     useEffect(() => {
       return () => {
         clearGameTimeouts();
         stopAllSpeech();
       };
     }, [clearGameTimeouts]);
     ```
   - Guard round completion with a `useRef<boolean>(false)` lock so rapid multi-touch never calls `onCompleteQuiz` twice.
3. **Top Header Bar**:
   - Render `<PlayGuide buddy={buddy} title="..." guide="..." soundEnabled={soundEnabled} />` and `<PlayProgress total={totalRounds} done={round} label="..." />` inside a `flex items-center justify-between` header bar.
4. **Compositor-Safe Motion**:
   - Animate `transform` (`translate3d`, `scale`, `rotate`) and `opacity` only, and include `@media (prefers-reduced-motion: reduce)` for continuous idle loops.

## Step 2: Coupled Registry Updates
1. **`src/types.ts`**: Add or update the `GameId` union literal and comment.
2. **`src/data/gameCatalog.ts`**: Add or update the `GAME_CATALOG[<gameId>]` entry (`title`, `prompt`, `theme`, `developmentArea`, `badge`, `category`).
3. **`src/components/GameArtwork.tsx`**: Add or update `case '<gameId>':` with 3–4 expressive `<Toy emoji="..." />` elements and `<Sparkles className="scene-pop" />`.
4. **`src/App.tsx`**: Add `lazy(() => import(...))` and `case '<gameId>':` inside the main game switch.
5. **Custom Full-Bleed Stage CSS** (if adding a new `GameId` rather than replacing an existing one):
   - Add `<gameId>` to `LOCAL_FEEDBACK_GAMES` in `src/components/GameStage.tsx`.
   - Add `.app-world .game-stage .game-surface[data-game='<gameId>'] { padding: 0; }`, the `.<stage>-stage` height rule, and the `:is(...) .game-cue` relative-flex rule in `src/components/GameStage.css`.
   - Add `.<stage>-stage` to the mobile full-height selector in `src/mobile-game-layout.css`.

## Step 3: Automated Verification
Run:
```bash
npm run harness:check && npm run lint && npm test && npm run build
```

---
name: toddler-ux-audit
description: >-
  Use this skill when the user asks to inspect, audit, or fix UI/UX quality, button overlaps, mobile layout issues, sound/timer leaks, or toddler usability across screens and games.
---

# Toddler UX & Layout Audit (`toddler-ux-audit`)

Use this runbook to systematically audit one or more screens/games in `play-game`.

## Step 1: Run Static Harness Verifier
```bash
npm run harness:check && npm run lint
```
This immediately checks all 40 games for catalog/routing/thumbnail sync, `.game-cue` top-bar overlap rules, `stopAllSpeech` / timer cleanup, and paid script isolation.

## Step 2: Visual & Layout Audit Checklist
1. **Top Bar `.game-cue` Overlap**:
   - In `src/components/GameStage.css`, `.game-stage .game-cue` defaults to `position: absolute; top: 0; left: 0; width: 64px; height: 64px;`.
   - Any stage or top bar that places `<PlayGuide>` inside a flex row **must** be included in the `:is(...) .game-cue { position: relative; top: auto; left: auto; flex-shrink: 0; }` rule in `src/components/GameStage.css`, or have `padding-left: 72px` on adjacent content.
2. **Avatar & Container Overflow (`320px~430px` Mobile)**:
   - Check `<CharacterAvatar size="xl" | "2xl">` inside fixed-height stages or modals (`SillyCostumeModal`, `FunnyEchoToy`, custom game headers). Constrain inner `.character-avatar` to `100%` of its wrapper when placed inside compact containers.
   - Check SVG accessory overlays (`viewBox="0 0 120 120"`) so props align with `CharacterArtwork` coordinates rather than stacking raw text emojis.
3. **Zero-Frustration Toddler Touch Targets**:
   - Interactive buttons and targets must be at least `48×48px` (`w-12 h-12` or larger) with forgiving tap areas (e.g., tapping a container or helper button also advances play for `baby`/`sprout` ages).

## Step 3: Runtime & Build Verification
```bash
npm run harness:check && npm run lint && npm test && npm run build
```

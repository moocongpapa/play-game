# Original play audio

Generated for this application on 2026-10-09 using ElevenLabs' official Node SDK
and the owner's authorized Starter included credits; usage-based billing was off.
No third-party recordings, artist impersonations, or song references were used.

- `jelly-picnic`, `pingu-sea`, `friends-parade`: original 30-second instrumental play music.
- `star-lullaby`: original 40-second instrumental bedtime music.
- `eleven-play-v1-*`: six short nonverbal effects from the fixed play catalog.
- MP3, 44.1 kHz, 128 kbps. Generation batch consumed 1,630 included credits.

Prompts, duration limits, and the repeatable generation command are documented in
the repository README. Generated assets are reused locally; playback does not
call ElevenLabs. Attribution: https://elevenlabs.io

## Care action voices

Eight short actions (munch, yum, gulp, brush, toothpaste, wipe, rinse and spit)
are saved in Korean and English, using the existing two friendly base voices.
The resulting 32 MP3 originals serve all eight characters with their individual
playback pitch. Outer silence is removed and action volume is normalized to
-20 LUFS with a -4 dB true-peak limit. Complete words are retained.

`src/data/careReactions.ts` contains the scripts;
`generatedSpeechManifest.ts` registers the saved files and
`generatedCareVoiceDurations.ts` synchronizes action animations with playback.
Games warm local clips before interaction. Repeated strokes reuse the current
voice; playback and preload never generate these clips or spend credits.

Validate saved care clips with:

```sh
CARE_FFMPEG=/path/to/ffmpeg node --import tsx scripts/generate-care-voices.ts
```

Add `--generate` only for explicit maintainer generation. The command reads the
server-only ElevenLabs key, checks included credits with extra billing disabled,
paces account checks, reuses existing files and preserves raw audio/request
markers in ignored `.audio-generation/care/`. Unknown request outcomes stop the
batch rather than retrying a potentially billed request.

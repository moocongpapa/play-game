<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e9b7985c-a0f7-4008-8953-39da2f4dbd34

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and set `ELEVENLABS_API_KEY` to your ElevenLabs API key. Keep the key on the server; do not use a `VITE_` prefix.
3. Run the app:
   `npm run dev`

## Character speech, music and effects

The eight character profiles use the official `@elevenlabs/elevenlabs-js` Node SDK through `/api/speech`. ElevenLabs is the first provider. Korean remains the default; parent settings offer English, character previews, AI sound preferences, remaining included credits, and the provider's next reset date. Jessica/Laura are light female base voices, with character-specific pacing and a modest cartoon pitch lift; they are not recordings of children.

- Every new generation rechecks the provider's live account-wide allowance. **Free and Starter are supported only with usage-based billing disabled** (`max_credit_limit_extension: 0`, extension flags false). No upgrades, credit purchases, Music API calls from the child UI, or automatic paid-provider failover occur. Provider errors/unknown allowance fail closed. SDK generation retries are disabled because an interrupted request may already consume credits.
- Included credits renew on the provider's billing cycle, not a guessed calendar date. Needed new lines resume on subsequent play after renewal (availability refreshes within one minute). The app does not generate unused content just to exhaust a monthly balance.
- Speech uses Multilingual v2, 128 kbps MP3, and the selected character/language. Repeat taps preserve the first line through completion. Compressed ElevenLabs clips are saved in IndexedDB (at most 200 clips / 12 MiB) and replay before checking network availability. Browser storage can be evicted or unavailable; short in-memory playback and the selected-language device voice remain fallbacks.
- Four original ElevenLabs instrumental recordings are bundled: three shuffled play tracks and one quiet lullaby. They play through the same BGM gain/ducking path. If files cannot load, six original procedural arrangements with layered marimba/flute/music-box timbres remain available. Sleep music stays quieter.
- Six short ElevenLabs effects are bundled and cached: tap, bounce, pop, bubble, sparkle, success. A first gesture responds immediately with synthesis while its recording loads; a late download never makes a late sound. Missing recordings may be generated from a fixed, short server catalog using included credits. Polyphony, mute, navigation cancellation, and pitch variation are bounded. Recorded real animal sounds and tuned xylophone notes are preserved.
- No microphone, chat agent, Speech Engine session or transcript server is introduced. This change covers game guidance, praise, music and effects.

### Audio asset maintenance

`scripts/generate-play-audio.ts` generates **missing** originals with the official SDK. Run deliberately with `node --import tsx scripts/generate-play-audio.ts`; it is not a build/startup hook. It verifies included credits and disabled overages before each request, skips existing assets, stops across a billing reset, and limits a batch to 5,000 credits with conservative per-request reserves. Music generation requires Starter. Review new output before committing. Prompts and track names live in `src/data/generatedMusic.ts`; effect prompts and revisions are in `src/data/audioExperience.ts`. Existing assets cost no credits to replay.

References: [SDK](https://github.com/elevenlabs/elevenlabs-js), [subscription/overage fields](https://elevenlabs.io/docs/api-reference/user/subscription/get), [Music API](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/music), [sound-effect billing](https://help.elevenlabs.io/hc/en-us/articles/25735337678481-How-much-does-it-cost-to-generate-sound-effects). AI-generated audio attribution is also shown in parent settings.

## Speech API protection

The deployed `/api/speech` uses the Node runtime for the SDK. Keep API keys and Redis credentials server-only: never prefix them with `VITE_` or commit local environment files. The API key needs permission to read subscription limits as well as generate speech/effects.

- POST requests require the app's own Origin and JSON content type. Cross-origin requests receive no CORS permission; bodies larger than 4 KiB are rejected before generation. Text is limited to 300 characters and effects to an authored allowlist.
- Optional `UPSTASH_REDIS_REST_URL` plus `UPSTASH_REDIS_REST_TOKEN` add shared abuse protection: 30 requests per IP per minute, 300 per IP per 24 hours and 1,200 app-wide per 24 hours. Windows start with the first request. A configured limiter outage blocks generation; the app uses cached/device audio. No raw IP or spoken text is stored in Redis.
- Redis counters are reserved atomically using [Upstash REST](https://upstash.com/docs/redis/features/restapi). Vercel's platform-managed IP header identifies the client. Other adapters share an `unknown` client bucket until a trusted adapter is supplied. Origin checks are not authentication; use Redis to limit intentional depletion of included credits on public installations.
- Without Redis, **only the verified ElevenLabs Free/Starter path with overages disabled** is enabled. The provider enforces the monthly cap across all instances. Gemini-only legacy installations still require the shared quota in production; Gemini is never used when an ElevenLabs key is configured, including on exhaustion.
- `npm run dev` uses the same validation and SDK with an additional bounded in-memory request limiter. This development server is not a production API server.

## Play time and saved drawings

Today's visible play time resets at local midnight, including after reopening the app. Undated legacy totals start with a fresh daily allowance; completed-game history is retained. Choosing a timer in parent settings starts a new allowance without deleting today's total. Opening parent settings alone does not remove a time limit. Age and difficulty refresh from the saved birthday.

Sketchbook edits are debounced while drawing, then flushed on home navigation, visibility loss, or page exit. Pending writes are ordered and remain readable when the sketchbook is reopened immediately. As with browser storage generally, abrupt device termination or storage failure cannot guarantee a final write.

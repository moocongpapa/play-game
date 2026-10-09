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
2. Copy [.env.example](.env.example) to `.env.local` and set `GEMINI_API_KEY` to your Gemini API key. Keep the key on the server; do not use a `VITE_` prefix.
3. Run the app:
   `npm run dev`

The eight character voices use `/api/speech`, with Gemini and an optional ElevenLabs fallback. Korean is the default; the parent dashboard also offers English and voice previews. Saved language choices are preserved. When AI speech is unavailable, the app uses an appropriate device voice in the selected language.

## Speech API protection

Deployed AI speech requires `GEMINI_API_KEY` and/or `ELEVENLABS_API_KEY`, plus **both** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the server environment. Use a dedicated database for each deployment environment and redeploy after configuring it. Never prefix these secrets with `VITE_` or commit local environment files.

- POST requests require the app's own Origin and JSON content type. Cross-origin requests receive no CORS permission; bodies larger than 4 KiB are rejected before generation.
- Shared quotas allow 30 generations per IP per minute, 300 per IP per 24 hours, and 1,200 across the whole app per 24 hours. Each window begins with its first accepted request. A request may use the secondary provider when the primary fails. Counters expire automatically; raw IP addresses and spoken text are not stored in Redis.
- The limiter reserves all counters atomically through [Upstash's Redis REST API](https://upstash.com/docs/redis/features/restapi). Vercel's [platform-managed IP header](https://vercel.com/docs/headers/request-headers) identifies the client; other deployments share an `unknown` client bucket until a trusted adapter is supplied.
- Origin checks are not user authentication. The shared global cap also limits clients that forge headers or change IPs. The app remains usable without a sign-in.
- Missing limiter credentials or a limiter outage **disables paid generation**, returning 503 and using device speech. Exceeded quotas return 429 with `Retry-After`; the client uses device speech during that cooldown. No production memory-only fallback is used.
- `npm run dev` uses the same request validation with local in-memory quotas. This development server is not a production API server.

## Play time and saved drawings

Today's visible play time resets at local midnight, including after reopening the app. Undated legacy totals start with a fresh daily allowance; completed-game history is retained. Choosing a timer in parent settings starts a new allowance without deleting today's total. Opening parent settings alone does not remove a time limit. Age and difficulty refresh from the saved birthday.

Sketchbook edits are debounced while drawing, then flushed on home navigation, visibility loss, or page exit. Pending writes are ordered and remain readable when the sketchbook is reopened immediately. As with browser storage generally, abrupt device termination or storage failure cannot guarantee a final write.

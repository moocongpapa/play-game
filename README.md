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

The seven character voices use Gemini TTS through the local `/api/speech` endpoint. For a Vercel deployment, set `GEMINI_API_KEY` in the project's server environment and redeploy. Open the parent dashboard to check the connection and preview each voice. Without a configured key, the app uses the device's built-in Korean speech voice.

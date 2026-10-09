/** Maintainer-only asset generation. Never run on app startup or during a build. */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { getIncludedAudioBudget, generateElevenAudio } from '../src/server/elevenLabsAudio';
import { PLAY_EFFECTS, PLAY_EFFECT_REVISION, type PlayEffectId } from '../src/data/audioExperience';
import { GENERATED_MUSIC } from '../src/data/generatedMusic';

const env = loadEnv('development', process.cwd(), '');
const key = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!key) throw new Error('Set the server-only ELEVENLABS_API_KEY');
const initial = await getIncludedAudioBudget(key);
if (!initial.eligible) throw new Error('A verified Free/Starter plan with overages disabled is required');
const directory = 'public/audio/elevenlabs';
await mkdir(directory, { recursive: true });
const client = new ElevenLabsClient({ apiKey: key, maxRetries: 0, timeoutInSeconds: 120 });
const exists = async (path: string) => (await stat(path).catch(() => null))?.size;
const roomFor = async (reserve: number) => {
  const budget = await getIncludedAudioBudget(key);
  // Stop across a billing reset, plan change, or concurrent account usage.
  if (!budget.eligible || budget.resetsAt !== initial.resetsAt || budget.remaining < reserve || initial.remaining - budget.remaining + reserve > 5000) {
    throw new Error('Stopped at the included-credits/batch budget guard');
  }
  return budget;
};

for (const music of GENERATED_MUSIC) {
  const path = `${directory}/${music.id}.mp3`;
  if (await exists(path)) continue;
  const budget = await roomFor(1500);
  if (budget.tier !== 'starter') { console.log('Music API requires Starter; keeping local instruments.'); break; }
  const stream = await client.music.compose({ prompt: music.prompt, musicLengthMs: music.seconds * 1000,
    modelId: 'music_v1', forceInstrumental: true, outputFormat: 'mp3_44100_128' }, { abortSignal: AbortSignal.timeout(120000) });
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  if (bytes.length < 1000 || bytes.length > 2 * 1024 * 1024) throw new Error('Invalid music response');
  await writeFile(path, bytes);
  console.log(`Saved ${music.id}: ${bytes.length} bytes`);
}
for (const id of Object.keys(PLAY_EFFECTS) as PlayEffectId[]) {
  const path = `${directory}/${PLAY_EFFECT_REVISION}-${id}.mp3`;
  if (await exists(path)) continue;
  await roomFor(200);
  await writeFile(path, new Uint8Array(await generateElevenAudio(key, { effectId: id })));
  console.log(`Saved effect: ${id}`);
}
const final = await getIncludedAudioBudget(key);
console.log(JSON.stringify({ remaining: final.remaining, usedDuringRun: initial.remaining - final.remaining, resetsAt: final.resetsAt }));

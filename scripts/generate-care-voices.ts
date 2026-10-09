/** Maintainer-only: generate once, validate and ship. Never run during build or gameplay. */
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { setTimeout as pace } from 'node:timers/promises';
import { loadEnv } from 'vite';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { CARE_REACTIONS } from '../src/data/careReactions';
import { CHARACTER_VOICES } from '../src/data/characterVoices';
import { speechSynthesisKey, speechSynthesisSpec } from '../src/data/speechSynthesis';
import { GENERATED_SPEECH_REQUESTS } from '../src/data/generatedSpeechManifest';
import { CARE_VOICE_DURATIONS } from '../src/data/generatedCareVoiceDurations';

const run = promisify(execFile);
const generate = process.argv.includes('--generate');
const ffmpeg = process.env.CARE_FFMPEG || 'ffmpeg';
await run(ffmpeg, ['-version'], { maxBuffer: 256 * 1024 });
const directory = resolve('.audio-generation/care');
await mkdir(`${directory}/raw`, { recursive: true });
await mkdir('public/audio/elevenlabs/speech', { recursive: true });
const requests = { ...GENERATED_SPEECH_REQUESTS };
const durations = { ...CARE_VOICE_DURATIONS };
const catalogPath = 'public/audio/elevenlabs/speech/catalog.json';
const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as { version: number; clips: Array<{ id: string; text: string; language: string; characters: string[]; bytes: number; sha256: string }> };
const exists = async (path: string) => (await stat(path).catch(() => null))?.isFile();
const save = async (path: string, data: Uint8Array | string) => {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, data, { flag: 'wx' }); await rename(temporary, path);
};
const jobs = new Map<string, { key: string; id: string; character: string; characters: string[]; text: string; language: string }>();
for (const character of Object.keys(CHARACTER_VOICES)) for (const reaction of Object.values(CARE_REACTIONS)) for (const language of ['ko', 'en'] as const) {
  const text = reaction[language], key = speechSynthesisKey(text, character, language);
  const existing = jobs.get(key);
  if (existing) existing.characters.push(character);
  else jobs.set(key, { key, id: createHash('sha256').update(key).digest('hex'), character, characters: [character], text, language });
}
let client: ElevenLabsClient | undefined;
let initial: { remaining: number; resetsAt?: number; tier: string } | undefined;
let chargedCharacters = 0;
let checkedAt = 0;
const budget = async () => {
  await pace(Math.max(0, 6500 - (Date.now() - checkedAt))); checkedAt = Date.now();
  const plan = await client!.user.subscription.get({ timeoutInSeconds: 5, maxRetries: 0 }).catch(() => { throw new Error('Included-credit check temporarily unavailable; saved clips preserved'); });
  if (!Number.isFinite(plan.characterCount) || !Number.isFinite(plan.characterLimit) || plan.characterLimit <= 0 ||
      plan.maxCreditLimitExtension !== 0 || plan.allowedToExtendCharacterLimit !== false) throw new Error('Cannot verify included credits with extra billing disabled');
  return { remaining: Math.max(0, plan.characterLimit - plan.characterCount), resetsAt: plan.nextCharacterCountResetUnix, tier: plan.tier };
};
for (const job of jobs.values()) {
  const output = `public/audio/elevenlabs/speech/${job.id}.mp3`;
  const raw = `${directory}/raw/${job.id}.mp3`, marker = `${directory}/${job.id}.json`;
  if (!await exists(output)) {
    if (!await exists(raw)) {
      if (!generate) throw new Error(`Missing saved care voice: ${job.id}; use --generate explicitly`);
      if (await exists(marker)) throw new Error(`Unknown previous request outcome; inspect ${job.id} before retrying`);
      if (!client) {
        const key = process.env.ELEVENLABS_API_KEY || loadEnv('development', process.cwd(), '').ELEVENLABS_API_KEY;
        if (!key) throw new Error('Server-only ELEVENLABS_API_KEY required');
        client = new ElevenLabsClient({ apiKey: key, maxRetries: 0, timeoutInSeconds: 45 });
      }
      const current = await budget(); initial ||= current;
      if (current.remaining < job.text.length || current.tier !== initial.tier || current.resetsAt !== initial.resetsAt ||
          chargedCharacters + job.text.length > 2000) throw new Error('Included/batch credit limit reached');
      await writeFile(marker, JSON.stringify({ id: job.id, text: job.text, state: 'requested' }), { flag: 'wx' });
      const { voiceId, ...spec } = speechSynthesisSpec(job.character, job.text);
      try {
        const stream = await client.textToSpeech.convert(voiceId, { ...spec, text: job.text }, { abortSignal: AbortSignal.timeout(45_000), maxRetries: 0 });
        const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
        if (bytes.length < 100 || bytes.length > 2 * 1024 * 1024) throw new Error('Invalid audio');
        await save(raw, bytes); chargedCharacters += job.text.length;
        await save(marker, JSON.stringify({ id: job.id, state: 'saved', bytes: bytes.length }));
      } catch { throw new Error(`Care voice request stopped: ${job.id}; original/marker preserved, no automatic retry`); }
    }
    // Trim only outer silence and normalize gentle volume. Keep complete words and original pitch.
    await run(ffmpeg, ['-v', 'error', '-nostdin', '-n', '-i', raw, '-af',
      'silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,areverse,loudnorm=I=-20:TP=-4:LRA=6',
      '-ar', '44100', '-ac', '1', '-b:a', '128k', output], { timeout: 30_000, maxBuffer: 256 * 1024 });
  }
  const { stderr } = await run(ffmpeg, ['-hide_banner', '-nostdin', '-i', output, '-f', 'null', '-'], { timeout: 30_000, maxBuffer: 256 * 1024 });
  const match = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!match) throw new Error(`Cannot measure voice: ${job.id}`);
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  const bytes = await readFile(output);
  if (!(seconds > .1 && seconds <= 3.2) || bytes.length < 100) throw new Error(`Invalid action duration: ${job.id}`);
  requests[job.key] = job.id; durations[job.key] = seconds;
  const clip = { id: job.id, text: job.text, language: job.language, characters: job.characters, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  const index = catalog.clips.findIndex(item => item.id === job.id);
  if (index < 0) catalog.clips.push(clip); else catalog.clips[index] = clip;
  console.log(`Saved/validated ${job.character}: ${job.text} (${seconds}s)`);
}
await save('src/data/generatedSpeechManifest.ts', `// Generated from saved, validated speech files. Do not hand-edit.\nexport const GENERATED_SPEECH_REQUESTS: Readonly<Record<string, string>> = ${JSON.stringify(requests, null, 2)};\nexport const GENERATED_SPEECH_FILES: ReadonlySet<string> = new Set(Object.values(GENERATED_SPEECH_REQUESTS));\nexport const GENERATED_SPEECH_COUNT = ${new Set(Object.values(requests)).size};\n`);
await save('src/data/generatedCareVoiceDurations.ts', `// Generated by scripts/generate-care-voices.ts; raw seconds before character playback pitch.\nexport const CARE_VOICE_DURATIONS: Readonly<Record<string, number>> = ${JSON.stringify(durations, null, 2)};\n`);
await save(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
const final = client ? await budget() : undefined;
console.log(JSON.stringify({ uniqueClips: jobs.size, requestedCharacters: chargedCharacters, usedCredits: initial && final ? initial.remaining - final.remaining : 0 }));

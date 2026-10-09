/** Maintainer-only dubbing helper. Importing this module never generates audio. */
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { loadEnv } from 'vite';
import { CHARACTER_VIDEOS } from '../src/data/characterVideoData';
import { CHARACTER_VOICE_REVISION, getCharacterVoice } from '../src/data/characterVoices';
import { normalizeSpokenText, speechAssetId, speechSynthesisSpec } from '../src/data/speechSynthesis';
import type { CharacterId } from '../src/types';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEECH_DIRECTORY = join(PROJECT_ROOT, 'public/audio/elevenlabs/speech');
const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const DUB_REVISION = 'character-video-dub-v2';

async function includedBudget(client: ElevenLabsClient) {
  try {
    const plan = await client.user.subscription.get({ timeoutInSeconds: 4, maxRetries: 0 });
    const valid = Number.isFinite(plan.characterLimit) && plan.characterLimit > 0 &&
      Number.isFinite(plan.characterCount) && plan.characterCount >= 0;
    // canExtendCharacterLimit describes plan entitlement, not whether billing is
    // enabled. The provider's hard cap must remain zero on every supported tier.
    const capped = plan.maxCreditLimitExtension === 0 && plan.allowedToExtendCharacterLimit === false;
    if (!valid || !capped) throw new Error('Included credits cannot be verified');
    return {
      remaining: Math.max(0, plan.characterLimit - plan.characterCount),
      tier: plan.tier, resetsAt: plan.nextCharacterCountResetUnix ?? null,
    };
  } catch {
    throw new Error('Unable to verify included ElevenLabs credits with additional billing disabled');
  }
}

async function pcmDuration(path: string) {
  const bytes = await readFile(path);
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`Expected a PCM WAV dubbing file: ${path}`);
  }
  let bytesPerSecond = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    if (offset + 8 + length > bytes.length) throw new Error(`Incomplete dubbing WAV: ${path}`);
    if (name === 'fmt ' && length >= 16) bytesPerSecond = bytes.readUInt32LE(offset + 16);
    if (name === 'data' && bytesPerSecond > 0) return length / bytesPerSecond;
    offset += 8 + length + (length % 2);
  }
  throw new Error(`Missing PCM samples in dubbing WAV: ${path}`);
}

async function fileExists(path: string) {
  try { return (await stat(path)).isFile(); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function validateAudio(path: string, ffmpeg: string) {
  const info = await stat(path);
  if (info.size < 100 || info.size > MAX_AUDIO_BYTES) throw new Error(`Invalid saved audio: ${path}`);
  try {
    await execFileAsync(ffmpeg, ['-v', 'error', '-nostdin', '-i', path, '-map', '0:a:0', '-f', 'null', '-'], {
      timeout: 30_000, maxBuffer: 256 * 1024,
    });
  } catch {
    // Do not silently regenerate corrupt files: generation may already have been billed.
    throw new Error(`Saved dubbing audio could not be decoded: ${path}`);
  }
}

async function atomicWrite(path: string, data: Uint8Array | string) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, data, { flag: 'wx' });
    await rename(temporary, path);
  } finally { await unlink(temporary).catch(() => {}); }
}

function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY || loadEnv('development', PROJECT_ROOT, '').ELEVENLABS_API_KEY;
  if (!key?.trim()) throw new Error('ELEVENLABS_API_KEY is required for uncached character dubs');
  return key.trim();
}

/**
 * Return four voice-only WAVs, ordered like CHARACTER_VIDEOS[id].scenes.
 * `directory` is the caller-owned character work directory. It may be outside
 * public/; raw originals are retained before any local processing starts.
 *
 * Uses the game's exact ElevenLabs synthesis request/cache identity, Korean
 * dialogue, and per-character playback pitch. Web Audio plays these voices at
 * unity gain, so the WAVs do too. A modest tempo adjustment may fit the complete
 * line inside its scene; no words are trimmed. Music and scene mixing are external.
 */
export async function ensureCharacterDubs(id: CharacterId, directory: string, ffmpeg: string): Promise<string[]> {
  const video = CHARACTER_VIDEOS[id];
  if (!video || video.scenes.length !== 4) throw new Error(`Four dubbing scenes are required for ${id}`);
  if (!ffmpeg.trim()) throw new Error('An ffmpeg executable path is required');
  try { await execFileAsync(ffmpeg, ['-version'], { timeout: 10_000, maxBuffer: 256 * 1024 }); }
  catch { throw new Error('FFmpeg must be available before requesting character dubbing'); }
  const workDirectory = resolve(directory);
  const rawDirectory = join(workDirectory, 'dubbing-raw');
  const outputDirectory = join(workDirectory, 'dubbing');
  await mkdir(rawDirectory, { recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  const voice = getCharacterVoice(id);
  const { voiceId, ...spec } = speechSynthesisSpec(id);
  const scenes = await Promise.all(video.scenes.map(async (scene, index) => {
    const text = normalizeSpokenText(scene.voiceText);
    if (!text || text.length > 300) throw new Error(`Invalid dubbing script for ${id} scene ${index + 1}`);
    const assetId = await speechAssetId(text, id, 'ko');
    const signature = createHash('sha256').update(JSON.stringify({
      assetId, revision: DUB_REVISION, voiceRevision: CHARACTER_VOICE_REVISION,
      playbackRate: voice.fallbackPlaybackRate, sampleRate: 44100, gain: 1,
      maximumDuration: index === 3 ? 5.4 : 7.4,
    })).digest('hex');
    return {
      scene: index + 1, text, assetId, maximumDuration: index === 3 ? 5.4 : 7.4,
      raw: join(rawDirectory, `${assetId}.mp3`),
      shared: join(SPEECH_DIRECTORY, `${assetId}.mp3`),
      output: join(outputDirectory, `scene-${index + 1}-${signature.slice(0, 16)}.wav`),
      marker: join(rawDirectory, `${assetId}.request.json`),
    };
  }));

  // Only instantiate a paid provider when a checked local clip is unavailable.
  let client: ElevenLabsClient | undefined;
  let secret: string | undefined;
  let initialBudget: Awaited<ReturnType<typeof includedBudget>> | undefined;
  let generatedCredits = 0;
  const requiredCredits = scenes.reduce((total, scene) => total + scene.text.length, 0);
  const paths: string[] = [];

  for (const scene of scenes) {
    if (await fileExists(scene.output)) {
      await validateAudio(scene.output, ffmpeg);
      if (await pcmDuration(scene.output) > scene.maximumDuration + .01) throw new Error(`Saved dubbing exceeds scene ${scene.scene}`);
      paths.push(scene.output);
      continue;
    }

    if (!await fileExists(scene.raw)) {
      if (await fileExists(scene.shared)) {
        await validateAudio(scene.shared, ffmpeg);
        await copyFile(scene.shared, scene.raw);
      } else {
        // A request marker survives unknown failures. Rerunning the batch must
        // not spend credits again merely because a response was interrupted.
        if (await fileExists(scene.marker)) {
          throw new Error(`Previous dubbing request needs inspection; automatic retry blocked: ${scene.marker}`);
        }
        secret ||= apiKey();
        client ||= new ElevenLabsClient({ apiKey: secret, maxRetries: 0, timeoutInSeconds: 45 });
        const budget = await includedBudget(client);
        initialBudget ||= budget;
        if (budget.remaining < scene.text.length ||
            budget.resetsAt !== initialBudget.resetsAt || budget.tier !== initialBudget.tier ||
            generatedCredits + scene.text.length > requiredCredits) {
          throw new Error(`Included audio credits unavailable for ${id} scene ${scene.scene}`);
        }
        await writeFile(scene.marker, JSON.stringify({
          character: id, scene: scene.scene, assetId: scene.assetId, text: scene.text,
          status: 'requested', requestedAt: new Date().toISOString(),
        }, null, 2), { flag: 'wx' });
        try {
          const stream = await client.textToSpeech.convert(voiceId, { ...spec, text: scene.text }, {
            abortSignal: AbortSignal.timeout(45_000), maxRetries: 0,
          });
          const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
          if (bytes.byteLength < 100 || bytes.byteLength > MAX_AUDIO_BYTES) throw new Error('Invalid generated audio size');
          // Keep the original even if FFmpeg conversion or final video mixing fails.
          await atomicWrite(scene.raw, bytes);
          generatedCredits += scene.text.length;
          await atomicWrite(scene.marker, JSON.stringify({
            character: id, scene: scene.scene, assetId: scene.assetId, text: scene.text,
            status: 'saved', savedAt: new Date().toISOString(), bytes: bytes.byteLength,
            sha256: createHash('sha256').update(bytes).digest('hex'),
          }, null, 2));
        } catch {
          // SDK errors may carry authorization headers. Keep keys out of logs.
          throw new Error(`Character dubbing generation stopped for ${id} scene ${scene.scene}; inspect the saved request marker before retrying`);
        }
      }
    }

    await validateAudio(scene.raw, ffmpeg);
    const temporary = `${scene.output}.${randomUUID()}.tmp.wav`;
    const fitted = `${scene.output}.${randomUUID()}.fitted.wav`;
    let tempo = 1;
    try {
      // Equivalent to AudioBufferSourceNode.playbackRate, including its gentle
      // tempo lift. Source voices are synthesized at each character's slow rate.
      await execFileAsync(ffmpeg, [
        '-v', 'error', '-nostdin', '-n', '-i', scene.raw, '-map', '0:a:0',
        '-af', `aresample=44100,asetrate=${Math.round(44100 * voice.fallbackPlaybackRate)},aresample=44100,volume=1`,
        '-c:a', 'pcm_s16le', '-ar', '44100', '-ac', '1', temporary,
      ], { timeout: 30_000, maxBuffer: 256 * 1024 });
      await validateAudio(temporary, ffmpeg);
      const duration = await pcmDuration(temporary);
      if (duration > scene.maximumDuration) {
        // Leave a 20 ms margin for the tempo filter's sample-window rounding.
        tempo = duration / (scene.maximumDuration - .02);
        if (tempo > 1.25) throw new Error('The full dialogue needs more than a natural tempo adjustment');
        await execFileAsync(ffmpeg, [
          '-v', 'error', '-nostdin', '-n', '-i', temporary, '-af', `atempo=${tempo.toFixed(6)}`,
          '-c:a', 'pcm_s16le', '-ar', '44100', '-ac', '1', fitted,
        ], { timeout: 30_000, maxBuffer: 256 * 1024 });
        await validateAudio(fitted, ffmpeg);
        if (await pcmDuration(fitted) > scene.maximumDuration + .01) throw new Error('The complete dialogue does not fit the scene');
        await rename(fitted, scene.output);
      } else await rename(temporary, scene.output);
    } catch {
      throw new Error(`Dubbing conversion or complete-dialogue fit failed for ${id} scene ${scene.scene}; original audio remains at ${scene.raw}`);
    } finally { await unlink(temporary).catch(() => {}); await unlink(fitted).catch(() => {}); }
    const rawBytes = await readFile(scene.raw);
    await atomicWrite(`${scene.output}.json`, JSON.stringify({
      character: id, scene: scene.scene, text: scene.text, language: 'ko', assetId: scene.assetId,
      voiceId, model: spec.modelId, playbackRate: voice.fallbackPlaybackRate, gain: 1,
      tempo, duration: await pcmDuration(scene.output), maximumDuration: scene.maximumDuration,
      sourceSha256: createHash('sha256').update(rawBytes).digest('hex'),
    }, null, 2));
    paths.push(scene.output);
  }
  return paths;
}

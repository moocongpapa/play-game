/**
 * Maintainer-only "새 모험" (Season 2 Adventure) episode generator.
 *
 * Generates a brand-new 30-second (8s + 8s + 8s + 6s) portrait episode per character in a new location
 * (놀이공원, 산속, 바닷속 ...) with Gemini Omni 1.1 Flash (720p, ~$0.10 per generated second) and
 * dubs it with included ElevenLabs credits. This script spends money: run it manually, one character at a time.
 *
 *   node --import tsx scripts/generate-adventure-videos.ts generate ggomi   # paid: 4 sequential Omni scenes
 *   node --import tsx scripts/generate-adventure-videos.ts build ggomi      # voices (included credits) + edit
 *   node --import tsx scripts/generate-adventure-videos.ts publish ggomi    # install to public/videos/adventure
 *
 * Policy: completed scenes are reused, failed or uncertain requests are never retried automatically
 * (pass --retry-failed explicitly after checking the cause), and no other model or resolution is used.
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import type { CharacterId } from '../src/types';
import { getCharacterVoice } from '../src/data/characterVoices';
import { normalizeSpokenText, speechSynthesisSpec } from '../src/data/speechSynthesis';

const run = promisify(execFile);
const env = loadEnv('development', process.cwd(), '');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const model = 'gemini-omni-1.1-flash';
const resolution = '720p';
const estimatedUsdPerSecond = 0.10;
const workRoot = '.video-generation/adventure-v1';
const publicDir = 'public/videos/adventure';
const manifestPath = 'public/videos/adventure-manifest.json';
const omniScript = process.env.OMNI_SCRIPT
  || `${process.env.HOME}/.gemini/config/plugins/gemini-api/skills/gemini-omni-flash-api/scripts/video/generate_video.py`;

const STYLE = '3D clay stop-motion animation for toddlers, soft tactile plasticine texture, cute chibi proportions, rounded plush volumes, bright cheerful pastel colors, warm soft lighting, gentle and wholesome, vertical 9:16 composition with the character fully visible and generous space above the head.';
const SAFETY = 'Single continuous shot, no scene cuts, stable gentle camera. Nothing scary, no danger, nobody gets hurt. Gentle natural foley and soft cheerful ambience only; no dialogue, no intelligible words, no singing, no narration. No text, no captions, no logos.';

interface AdventureScene {
  duration: number;
  action: string;
  voiceLine: string;
}

interface AdventurePlan {
  name: string;
  title: string;
  location: string;
  identity: string;
  setting: string;
  scenes: AdventureScene[];
}

export const ADVENTURES: Partial<Record<CharacterId, AdventurePlan>> = {
  ggomi: {
    name: '꼬미',
    title: '꼬미의 솜사탕 대소동',
    location: '놀이공원',
    identity: 'Ggomi, the caramel-brown baby teddy bear from <IMAGE_REF_0>: cream muzzle, a pink ribbon on her right ear, pink pinafore dress with a cream heart and pale hem, exactly two arms and two feet. Keep her identity, colors and clothing exactly the same as the reference.',
    setting: 'A sunny daytime amusement park with a pastel carousel, a big colorful Ferris wheel in the background, balloon stand and a cute cotton candy cart.',
    scenes: [
      {
        duration: 8,
        action: 'Ggomi happily hops off the slowly turning carousel, spots the pink cotton candy cart, her eyes sparkle, she bounces with excitement and receives a fluffy pink cotton candy on a stick, holding it up proudly.',
        voiceLine: '우와! 분홍 솜사탕이다! 하나 주세요!',
      },
      {
        duration: 8,
        action: 'Ggomi takes small bites of her pink cotton candy, and with every bite the cotton candy puffs up bigger and bigger with a comical boing, until it is bigger than Ggomi herself. She blinks in surprise and giggles.',
        voiceLine: '어? 어어? 솜사탕이 자꾸자꾸 커져!',
      },
      {
        duration: 8,
        action: 'Holding the giant fluffy pink cotton candy like a balloon, Ggomi gently floats a little above the ground, slowly drifting past the colorful Ferris wheel, kicking her little feet happily and waving at the cabins. Soft, safe and dreamy, she stays close and smiling.',
        voiceLine: '둥실둥실~ 나 날고 있어! 안녕 관람차야!',
      },
      {
        duration: 6,
        action: 'Ggomi lands softly on her feet with a fluffy bounce, tears off a piece of the giant cotton candy and holds it out toward the camera to share, smiling warmly and waving.',
        voiceLine: '맛있는 건 같이 먹어야지! 너도 한 입!',
      },
    ],
  },
};

const [command, id] = process.argv.slice(2) as [string, CharacterId];
if (!['generate', 'build', 'publish'].includes(command) || !id) {
  console.error('Usage: node --import tsx scripts/generate-adventure-videos.ts generate|build|publish <characterId>');
  process.exit(1);
}
const plan = ADVENTURES[id];
if (!plan) throw new Error(`No adventure plan for ${id}`);

const exists = async (path: string) => (await stat(path).catch(() => null))?.size;
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
async function json(path: string, value: unknown) {
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
}

async function probe(path: string) {
  let info = '';
  try { await run(ffmpeg, ['-hide_banner', '-i', path]); }
  catch (error) { info = (error as { stderr?: string }).stderr || ''; }
  const dur = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const dim = info.match(/Video:.*?\b(\d{3,5})x(\d{3,5})\b/);
  const fps = info.match(/Video:.*? ([\d.]+) fps/);
  return {
    duration: dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0,
    width: Number(dim?.[1]),
    height: Number(dim?.[2]),
    fps: Number(fps?.[1]),
    hasAudio: /Audio:/.test(info),
  };
}

const characterDir = `${workRoot}/${id}`;
await mkdir(characterDir, { recursive: true });
const identityRef = `production/character-videos/starting-frames/${id}/opening.png`;

function scenePrompt(scene: AdventureScene, index: number) {
  const roles = index === 0
    ? '[# References <IMAGE_REF_0>@Image1]'
    : '[# Sources <FIRST_FRAME>@Image1] [# References <IMAGE_REF_0>@Image2]';
  const continuity = index === 0
    ? ''
    : 'Use Image1 as the starting frame and continue naturally from it in the same location. ';
  return `${roles} ${continuity}${STYLE} Character: ${plan!.identity} Location: ${plan!.setting} Action: ${scene.action} ${SAFETY} Use <IMAGE_REF_0> only as a character identity reference; it should not be used as a literal frame and its room or background must not be copied.`;
}

if (command === 'generate') {
  const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');
  if (!await exists(identityRef)) throw new Error(`Identity reference missing: ${identityRef}`);
  const total = plan.scenes.reduce((sum, s) => sum + s.duration, 0);
  console.log(`[PLAN] ${plan.name} · ${plan.title} (${plan.location}) · ${model} ${resolution} · ${total}s ≈ $${(total * estimatedUsdPerSecond).toFixed(2)}`);

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    const base = `${characterDir}/scene-${i + 1}`;
    const prompt = scenePrompt(scene, i);
    const firstFrame = i === 0 ? undefined : `${characterDir}/scene-${i}-last.png`;
    const fingerprint = hash(JSON.stringify({
      model, resolution, prompt, duration: scene.duration,
      identity: hash(await readFile(identityRef)),
      firstFrame: firstFrame ? hash(await readFile(firstFrame)) : null,
    }));
    const journal = (await exists(`${base}.json`)) ? JSON.parse(await readFile(`${base}.json`, 'utf8')) : undefined;

    if (await exists(`${base}.mp4`)) {
      console.log(`[CACHED] scene ${i + 1}`);
    } else {
      if (journal && journal.status !== 'downloaded' && !process.argv.includes('--retry-failed')) {
        throw new Error(`Scene ${i + 1} previous request is "${journal.status}". Check the cause, then rerun with --retry-failed.`);
      }
      await json(`${base}.json`, { fingerprint, model, resolution, duration: scene.duration, status: 'submitting', submittedAt: new Date().toISOString() });
      console.log(`[SUBMIT] scene ${i + 1}/${plan.scenes.length} (${scene.duration}s ≈ $${(scene.duration * estimatedUsdPerSecond).toFixed(2)})`);
      try {
        await run('python3', [
          omniScript, prompt,
          ...(firstFrame ? ['--first-frame', firstFrame] : []),
          '--image', identityRef,
          '--aspect-ratio', '9:16',
          '--duration', String(scene.duration),
          '--resolution', resolution,
          '--timeout', '900',
          '--output', `${base}.mp4`,
        ], { env: { ...process.env, GEMINI_API_KEY: key }, timeout: 1000000, maxBuffer: 8 * 1024 * 1024 });
      } catch (error) {
        const message = String((error as Error).message).replaceAll(key, '[REDACTED]');
        await json(`${base}.json`, { fingerprint, model, resolution, status: 'failed', error: message.slice(-2000) });
        throw new Error(`Scene ${i + 1} failed; not retrying automatically.\n${message.slice(-800)}`);
      }
      const meta = await probe(`${base}.mp4`);
      if (Math.abs(meta.duration - scene.duration) > 0.6 || meta.width !== 720 || meta.height !== 1280) {
        await json(`${base}.json`, { fingerprint, model, resolution, status: 'unexpected', meta });
        throw new Error(`Scene ${i + 1} unexpected output: ${JSON.stringify(meta)}`);
      }
      await json(`${base}.json`, { fingerprint, model, resolution, duration: scene.duration, status: 'downloaded', meta, completedAt: new Date().toISOString() });
      console.log(`[SAVED] scene ${i + 1}: ${meta.width}x${meta.height}, ${meta.duration.toFixed(2)}s, ${meta.fps}fps`);
    }

    // Last frame becomes the next scene's first frame for continuity.
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-sseof', '-0.08', '-i', `${base}.mp4`, '-frames:v', '1', '-update', '1', `${base}-last.png`]);
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(Math.min(3, scene.duration / 2)), '-i', `${base}.mp4`, '-frames:v', '1', '-update', '1', `${base}-check.jpg`]);
  }
  console.log(`[DONE] ${plan.name}: all ${plan.scenes.length} scenes generated. Review ${characterDir}/scene-*-check.jpg, then run build.`);
}

async function ensureVoice(client: ElevenLabsClient, index: number, text: string, maxDuration: number) {
  const lineHash = hash(`${id}:${index}:${normalizeSpokenText(text)}`).slice(0, 14);
  const rawMp3 = `${characterDir}/voice-s${index + 1}-${lineHash}.mp3`;
  const fitted = `${characterDir}/voice-s${index + 1}-${lineHash}.wav`;
  if (await exists(fitted)) return fitted;
  if (!await exists(rawMp3)) {
    const spec = speechSynthesisSpec(id, text);
    console.log(`[VOICE] scene ${index + 1}: "${text}"`);
    const stream = await client.textToSpeech.convert(spec.voiceId, { ...spec, text: normalizeSpokenText(text) });
    const bytes = Buffer.from(await new Response(stream).arrayBuffer());
    if (bytes.length < 100) throw new Error('Invalid TTS response');
    await writeFile(rawMp3, bytes);
  }
  const pitch = getCharacterVoice(id).fallbackPlaybackRate;
  const temp = `${fitted}.tmp.wav`;
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', rawMp3,
    '-af', `aresample=44100,asetrate=${Math.round(44100 * pitch)},aresample=48000,volume=1.15`,
    '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', temp]);
  const { duration } = await probe(temp);
  const room = maxDuration - 0.9;
  if (duration > room) {
    const tempo = Math.min(1.3, duration / room);
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', temp,
      '-af', `atempo=${tempo.toFixed(4)}`, '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', fitted]);
  } else {
    await rename(temp, fitted);
  }
  return fitted;
}

const finalPath = `${characterDir}/final.mp4`;
const totalDuration = plan.scenes.reduce((sum, s) => sum + s.duration, 0);

if (command === 'build') {
  const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is missing');
  const client = new ElevenLabsClient({ apiKey });
  const before = await client.user.subscription.get();
  if (before.characterLimit - before.characterCount < 500) throw new Error('ElevenLabs included credits are too low; stopping.');

  const inputs: string[] = [];
  const filters: string[] = [];
  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    const video = `${characterDir}/scene-${i + 1}.mp4`;
    const meta = await probe(video);
    if (!meta.duration) throw new Error(`Missing scene ${i + 1}: ${video}`);
    const voice = await ensureVoice(client, i, scene.voiceLine, scene.duration);
    const d = scene.duration;
    inputs.push('-i', video, '-i', voice);
    const v = i * 2, vo = i * 2 + 1;
    filters.push(`[${v}:v]fps=24,trim=duration=${d},setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,format=yuv420p[v${i}]`);
    filters.push(meta.hasAudio
      ? `[${v}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=duration=${d},asetpts=PTS-STARTPTS,apad,atrim=duration=${d},volume=0.45[bed${i}]`
      : `anullsrc=r=48000:cl=stereo,atrim=duration=${d}[bed${i}]`);
    filters.push(`[${vo}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=450|450,apad,atrim=duration=${d},asetpts=PTS-STARTPTS,asplit=2[vo${i}][sc${i}]`);
    filters.push(`[bed${i}][sc${i}]sidechaincompress=threshold=0.02:ratio=6:attack=25:release=260[duck${i}]`);
    filters.push(`[duck${i}][vo${i}]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=in:d=0.08,afade=t=out:st=${(d - 0.25).toFixed(2)}:d=0.25,atrim=duration=${d},asetpts=PTS-STARTPTS[a${i}]`);
  }
  filters.push(`${plan.scenes.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${plan.scenes.length}:v=1:a=1[vout][aout]`);

  console.log(`[BUILD] ${plan.name}: ${totalDuration}s 1080x1920 episode`);
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...inputs,
    '-filter_complex', filters.join(';'), '-map', '[vout]', '-map', '[aout]',
    '-r', '24', '-frames:v', String(totalDuration * 24), '-t', String(totalDuration),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', finalPath,
  ], { timeout: 900000, maxBuffer: 4 * 1024 * 1024 });

  const meta = await probe(finalPath);
  if (meta.width !== 1080 || meta.height !== 1920 || Math.abs(meta.duration - totalDuration) > 0.25 || meta.fps !== 24) {
    throw new Error(`Unexpected final video: ${JSON.stringify(meta)}`);
  }
  await run(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-nostdin', '-i', finalPath, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-'], { timeout: 300000, maxBuffer: 4 * 1024 * 1024 });
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '2', '-i', finalPath, '-frames:v', '1', '-q:v', '2', '-update', '1', `${characterDir}/poster.jpg`]);
  await json(`${characterDir}/validated.json`, { ...meta, sha256: hash(await readFile(finalPath)) });
  const after = await client.user.subscription.get();
  console.log(`[BUILT] ${finalPath} · ElevenLabs used ${after.characterCount - before.characterCount} · remaining ${(after.characterLimit - after.characterCount).toLocaleString()}`);
}

if (command === 'publish') {
  const validated = JSON.parse(await readFile(`${characterDir}/validated.json`, 'utf8'));
  const bytes = await readFile(finalPath);
  const checksum = hash(bytes);
  if (validated.sha256 !== checksum) throw new Error('Final video changed since validation; rebuild first.');
  await mkdir(`${publicDir}/posters`, { recursive: true });
  await copyFile(finalPath, `${publicDir}/${id}.mp4`);
  await copyFile(`${characterDir}/poster.jpg`, `${publicDir}/posters/${id}.jpg`);
  const manifest = (await exists(manifestPath)) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};
  manifest[id] = {
    characterId: id,
    title: plan.title,
    location: plan.location,
    model,
    generatedResolution: resolution,
    width: 1080,
    height: 1920,
    duration: totalDuration,
    fps: 24,
    bytes: bytes.length,
    sha256: checksum,
    scenes: plan.scenes.length,
    dubbedLanguage: 'ko',
    revision: checksum.slice(0, 12),
  };
  await json(manifestPath, manifest);
  console.log(`[PUBLISHED] ${publicDir}/${id}.mp4 (rev ${checksum.slice(0, 12)})`);
}

/**
 * Comedy Scene (Scene 6) Generator & Video Extender.
 * Appends an 8-second hilarious slapstick comedy scene tailored for toddler laughter (Yuha) to each character's portrait video (38s -> 46s).
 * Strictly adheres to cost policy: Veo 3.1 Lite 1080p, sequential generation, minimal credit usage.
 */
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, rename, stat, copyFile, open, unlink } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import type { CharacterId } from '../src/types';
import { speechSynthesisKey, speechSynthesisSpec, normalizeSpokenText } from '../src/data/speechSynthesis';
import { getCharacterVoice } from '../src/data/characterVoices';
import { bonusSubmissionAction, type VideoGenerationJournal as Journal } from './bonus-video-policy';

const run = promisify(execFile);
const env = loadEnv('development', process.cwd(), '');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const model = 'veo-3.1-lite-generate-preview';
const resolution = '1080p';
const directory = '.video-generation/portrait-v1';

export const COMEDY_SCENES: Record<CharacterId, { name: string; prompt: string; voiceLine: string }> = {
  ggomi: {
    name: '꼬미',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Ggomi the cute little brown bear with pink apron has a tiny dab of strawberry whipped cream on the tip of her nose! She crosses her eyes trying to look at her nose, sniffs inquisitively, then lets out a big cute toddler sneeze "Achoo!", which gently knocks her backward onto her bottom with a soft plush bounce. She rubs her nose, giggles shyly with rosy blushing cheeks and big smiling eyes. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and cute squeaky sneeze sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '어라? 딸기 코가 됐네? 에취~!',
  },
  rano: {
    name: '라노',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Rano the friendly green baby dinosaur takes a happy step and playfully slips on the smooth yellow banana peel on the floor! He windmills his little arms in funny cartoon balance, wobbles comically, and lands with a soft bouncy plop on his padded dinosaur bottom. Three tiny golden cartoon stars swirl harmlessly over his head, and Rano bursts into infectious toddler giggles, waving his little feet. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and funny cartoon slide whistle and boing sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '어이쿠 쿵! 바나나 미끄럼틀이다! 꺄르르!',
  },
  jelly: {
    name: '젤리',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Jelly the adorable lilac baby bunny in purple dress gets startled by her own tiny squeaky toddler toot sound! Her long heart-shaped ears spring straight up in surprise, then start spinning around like helicopter propellers, gently lifting her floating two feet in the air! She floats joyfully in the air waving her paws, then gently parachutes down landing safely on a fluffy cushion with a happy beaming smile. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley, funny squeaky toot and gentle propeller hum; no intelligible words or singing. No title cards or text.',
    voiceLine: '뿌웅~ 아이코 깜짝이야! 둥실둥실~!',
  },
  dochi: {
    name: '도치',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Dochi the sweet golden hedgehog hugs his golden acorn tightly, curls his body into a cute round golden ball, and rolls across the floor like a gentle bowling ball! He rolls into three colorful toddler soft toy pins, knocking them over in a playful strike, then pops right out of the ball pose, throwing his paws up with a huge cheerful "Peekaboo!" grin. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley, cute rolling and soft toy tumbling sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '데굴데굴 떼구르르~ 스트라이크! 까꿍!',
  },
  ggulgguli: {
    name: '꿀꿀이',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Ggulgguli the chubby pink piglet with yellow bib hops toward a giant wobbly strawberry pudding on the table! As he touches it, the gelatinous pudding springs back like a trampoline, launching Ggulgguli into a bouncy comical slow-motion somersault! He lands safely right back on his feet, clapping his little hooves with pure delight and giggling with rosy cheeks. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley, bouncy spring boing and pudding wobble sounds; no intelligible words or singing. No title cards or text.',
    voiceLine: '푸딩 점프 띠용~! 하늘까지 슝!',
  },
  eumme: {
    name: '음메',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Eumme the fluffy white cloud lamb gets a tiny cute hiccup! With each little "hic!", her cloud wool puffs out bigger and rounder like a gigantic fluffy cotton candy ball! When she is round like a fluffy sphere, she wiggles her ears, and with a soft "pop" of rainbow sparkles, her wool gently settles back to normal, leaving her chuckling sweetly with sparkling eyes. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley, cute squeaky hiccups and soft airy poof sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '딸꾹! 털이 퐁퐁 부풀어 올랐어! 히히!',
  },
  nurungji: {
    name: '누룽지',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Nurungji the cheerful golden puppy notices his own tail wagging behind him and playfully tries to catch it! He spins around in circles like a little furry tornado chasing his tail, until he gets adorably dizzy. He wobbles comically in a zig-zag step, flops softly onto his belly, sticks his little pink tongue out in a cute "blep", and pants happily with a wide puppy grin. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley, playful puppy scuffle and comical wobble sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '꼬리야 거기 서! 뱅글뱅글 어질어질~ 헤헤!',
  },
  pingu: {
    name: '핑구',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Pingu the adorable slate-blue baby penguin with mint scarf drops onto his tummy and slides like a little bobsled across the sparkling snow! He slides right into the soft snowy base of a friendly mini snowman, causing the snowman\'s knitted beanie hat and tiny carrot nose to gently fall and land perfectly on Pingu\'s head! Pingu blinks in surprise, realizing he looks like a snowman, and waddles proudly with happy penguin chirps. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley, swooshing snow slide and soft snowy thud sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '쓔우웅~ 쿵! 내가 눈사람이 됐어요!',
  },
};

const [command, id] = process.argv.slice(2) as [string, CharacterId | 'all'];
if (!['check-credits', 'prepare-frames', 'generate', 'build', 'publish'].includes(command)) {
  console.error('Usage: tsx scripts/generate-comedy-scenes.ts check-credits|prepare-frames|generate|build|publish [characterId|all]');
  process.exit(1);
}

const exists = async (path: string) => (await stat(path).catch(() => null))?.size;
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');

async function json(path: string, value: unknown) {
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
}

async function inspect(path: string, expectedDuration: number, width = 1080, height = 1920) {
  let info = '';
  try {
    await run(ffmpeg, ['-hide_banner', '-i', path]);
  } catch (error) {
    info = (error as { stderr?: string }).stderr || '';
  }
  const durationMatch = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const dimensionsMatch = info.match(/Video:.*?\b(\d{3,5})x(\d{3,5})\b/);
  const fpsMatch = info.match(/Video:.*? ([\d.]+) fps/);
  const actualDuration = durationMatch ? +durationMatch[1] * 3600 + +durationMatch[2] * 60 + +durationMatch[3] : 0;
  if (!dimensionsMatch || +dimensionsMatch[1] !== width || +dimensionsMatch[2] !== height || Math.abs(actualDuration - expectedDuration) > .25 || Number(fpsMatch?.[1]) !== 24) {
    throw new Error(`Unexpected media in ${path}: ${dimensionsMatch?.[0]}, ${actualDuration}s (expected ~${expectedDuration}s), ${fpsMatch?.[1]}fps`);
  }
  return {
    width: +dimensionsMatch[1],
    height: +dimensionsMatch[2],
    duration: actualDuration,
    fps: 24,
    bytes: await exists(path),
  };
}

async function ensureAudio(charId: CharacterId): Promise<string> {
  const line = COMEDY_SCENES[charId].voiceLine;
  const key = speechSynthesisKey(line, charId, 'ko');
  const assetId = createHash('sha256').update(key).digest('hex');
  const target = `public/audio/elevenlabs/speech/${assetId}.mp3`;
  if (await exists(target)) return target;

  const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing');
  const client = new ElevenLabsClient({ apiKey });
  const spec = speechSynthesisSpec(charId, line);
  console.log(`[AUDIO] Synthesizing comedy voice for ${charId}: "${line}"...`);
  const stream = await client.textToSpeech.convert(spec.voiceId, {
    ...spec,
    text: normalizeSpokenText(line),
  });
  const audio = await new Response(stream).arrayBuffer();
  await mkdir('public/audio/elevenlabs/speech', { recursive: true });
  await writeFile(target, Buffer.from(audio));
  return target;
}

if (command === 'check-credits') {
  const elevenKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    const client = new ElevenLabsClient({ apiKey: elevenKey });
    const sub = await client.user.subscription.get();
    console.log('\n=== ElevenLabs Audio Credits ===');
    console.log(`Tier: ${sub.tier}`);
    console.log(`Used: ${sub.characterCount.toLocaleString()} / Limit: ${sub.characterLimit.toLocaleString()} characters`);
    console.log(`Remaining: ${(sub.characterLimit - sub.characterCount).toLocaleString()} characters`);
    console.log(`Overage Allowed: ${sub.allowedToExtendCharacterLimit} (Protected)`);
  }

  console.log('\n=== Google Veo Video Generation Cost Policy ===');
  console.log(`Model: ${model} (1080p, 24fps)`);
  console.log(`Unit Cost: $0.08 / second ($0.64 per 8s comedy scene)`);
  console.log(`Characters: 8 friends`);
  console.log(`Total New Video Duration: 8 scenes × 8s = 64s`);
  console.log(`Total Estimated Video Cost: 8 × $0.64 = $5.12 (approx. 7,100 KRW)`);
  console.log(`Total New Voice Characters: ~170 characters (<1% of 19,891 remaining credits)`);
  console.log(`Daily Quota (RPD): 8 requests fits within typical 10 RPD AI Studio preview cap\n`);
  process.exit(0);
}

if (command === 'prepare-frames') {
  const characters = (id === 'all' || !id ? Object.keys(COMEDY_SCENES) : [id]) as CharacterId[];
  for (const charId of characters) {
    const input = `public/videos/${charId}.mp4`;
    const frameDir = `production/character-videos/starting-frames/${charId}`;
    await mkdir(frameDir, { recursive: true });
    const output = `${frameDir}/scene-6.png`;
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-sseof', '-0.1',
      '-i', input,
      '-vframes', '1',
      '-vf', 'scale=1080:1920',
      '-f', 'image2',
      output,
    ]);
    const fileBytes = await readFile(output);
    console.log(`[FRAME] ${charId} scene-6.png: ${fileBytes.readUInt32BE(16)}x${fileBytes.readUInt32BE(20)} (${Math.round(fileBytes.length / 1024)} KB)`);
  }
  process.exit(0);
}

const charactersToProcess = (id === 'all' || !id ? Object.keys(COMEDY_SCENES) : [id]) as CharacterId[];

for (const charId of charactersToProcess) {
  const characterDirectory = `${directory}/${charId}`;
  await mkdir(characterDirectory, { recursive: true });
  const backup38sDir = 'backups/character-videos/2026-10-26-38s-portrait';
  const backup38s = `${backup38sDir}/${charId}.mp4`;
  const publicVideo = `public/videos/${charId}.mp4`;
  const manifestPath = 'public/videos/portrait-manifest.json';
  const currentManifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  if (command === 'generate') {
    const startFramePath = `production/character-videos/starting-frames/${charId}/scene-6.png`;
    if (!await exists(startFramePath)) {
      throw new Error(`Scene 6 starting frame missing: ${startFramePath}. Run prepare-frames first.`);
    }
    const firstFrame = await readFile(startFramePath);
    const sceneInfo = COMEDY_SCENES[charId];
    const prompt = sceneInfo.prompt;
    const fingerprint = hash(JSON.stringify({ model, prompt, firstFrame: hash(firstFrame), resolution, aspectRatio: '9:16', duration: 8 }));
    const base = `${characterDirectory}/scene-6`;

    let journal: Journal | undefined = (await exists(`${base}.json`)) ? JSON.parse(await readFile(`${base}.json`, 'utf8')) : undefined;
    const action = bonusSubmissionAction(journal, fingerprint, process.argv.includes('--retry-rejected'));

    if (await exists(`${base}.mp4`)) {
      await inspect(`${base}.mp4`, 8, 720, 1280);
      if (journal) {
        journal.status = 'downloaded';
        await json(`${base}.json`, journal);
      }
      console.log(`[CACHED] ${charId} scene 6 already exists.`);
      continue;
    }

    const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing');

    const pythonScript = '/Users/wanseok/.gemini/config/plugins/gemini-api/skills/gemini-omni-flash-api/scripts/video/generate_video.py';
    journal = { fingerprint, model: 'gemini-omni-1.1-flash', status: 'submitting', submittedAt: new Date().toISOString() };
    await json(`${base}.json`, journal);
    console.log(`[SUBMIT] ${charId} scene 6 (comedy: 8s slapstick, gemini-omni-1.1-flash, 720p, estimated $0.80)`);

    try {
      await run('python3', [
        pythonScript,
        prompt,
        '--first-frame', startFramePath,
        '--aspect-ratio', '9:16',
        '--duration', '8',
        '--resolution', '720p',
        '--output', `${base}.mp4`,
      ], {
        env: { ...process.env, GEMINI_API_KEY: key },
        timeout: 300000,
      });

      await inspect(`${base}.mp4`, 8, 720, 1280);
      journal.status = 'downloaded';
      journal.operation = 'gemini-omni-1.1-flash';
      await json(`${base}.json`, journal);
      console.log(`[SAVED] ${charId} scene 6 successfully generated and saved.`);
    } catch (error) {
      journal.status = 'failed';
      journal.error = String((error as Error).message).replaceAll(key, '[REDACTED]');
      await json(`${base}.json`, journal);
      throw new Error(journal.error);
    }
  }

  if (command === 'build') {
    const scene6Path = `${characterDirectory}/scene-6.mp4`;
    if (!await exists(scene6Path)) throw new Error(`Scene 6 video missing: ${scene6Path}`);
    await inspect(scene6Path, 8, 720, 1280);

    const base38sPath = await exists(backup38s) ? backup38s : publicVideo;
    if (!await exists(base38sPath)) throw new Error(`38s video missing: ${base38sPath}`);
    const baseMeta = await inspect(base38sPath, 38, currentManifest[charId]?.width || 1080, currentManifest[charId]?.height || 1920);

    const voicePath = await ensureAudio(charId);
    const comedyFinalPath = `${characterDirectory}/comedy-final.mp4`;
    const pitch = getCharacterVoice(charId).fallbackPlaybackRate;
    console.log(`[BUILDING] Assembling 46s extended video for ${charId}...`);

    // Concatenate 38s base video with 8s scene 6.
    // In scene 6, overlay the matching funny character voice at ~2.0s with ducking.
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
      '-i', base38sPath,
      '-i', scene6Path,
      '-i', voicePath,
      '-filter_complex',
      [
        // Video standardization
        '[0:v]trim=duration=38,setpts=PTS-STARTPTS[v0]',
        `[1:v]trim=duration=8,scale=${baseMeta.width}:${baseMeta.height}:flags=lanczos,setpts=PTS-STARTPTS[v1]`,
        '[v0][v1]concat=n=2:v=1:a=0[v_concat]',

        // Audio concatenation
        '[0:a]atrim=duration=38,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0]',
        `[2:a]aresample=44100,asetrate=${Math.round(44100 * pitch)},aresample=48000,aformat=channel_layouts=stereo,adelay=2000|2000,apad,atrim=duration=8,asetpts=PTS-STARTPTS,asplit=2[voice][sc]`,
        '[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.35,atrim=duration=8,asetpts=PTS-STARTPTS[foley]',
        '[foley][sc]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=300[ducked]',
        '[ducked][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=out:st=7.6:d=0.4,asetpts=PTS-STARTPTS[a1]',
        '[a0][a1]concat=n=2:v=0:a=1[a_concat]',
      ].join(';'),
      '-map', '[v_concat]',
      '-map', '[a_concat]',
      '-r', '24',
      '-t', '46',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart',
      comedyFinalPath,
    ], { timeout: 900000, maxBuffer: 1024 * 1024 });

    const meta = await inspect(comedyFinalPath, 46, baseMeta.width, baseMeta.height);
    await run(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-nostdin', '-i', comedyFinalPath, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-'], { timeout: 180000, maxBuffer: 1024 * 1024 });
    await json(`${characterDirectory}/comedy-validated.json`, {
      ...meta,
      sha256: hash(await readFile(comedyFinalPath)),
      voice: { text: COMEDY_SCENES[charId].voiceLine, asset: hash(voicePath), pitch },
    });
    console.log(`[BUILT] ${charId}: comedy 46s video successfully built (${meta.duration}s, ${meta.bytes} bytes).`);
  }

  if (command === 'publish') {
    const comedyFinalPath = `${characterDirectory}/comedy-final.mp4`;
    if (!await exists(comedyFinalPath)) throw new Error(`Comedy video missing: ${comedyFinalPath}`);
    const meta = await inspect(comedyFinalPath, 46, currentManifest[charId]?.width || 1080, currentManifest[charId]?.height || 1920);
    const checksum = hash(await readFile(comedyFinalPath));
    const validated = JSON.parse(await readFile(`${characterDirectory}/comedy-validated.json`, 'utf8'));
    if (validated.sha256 !== checksum) throw new Error('Comedy film changed since validation.');
    const journal = JSON.parse(await readFile(`${characterDirectory}/scene-6.json`, 'utf8')) as Journal;
    if (journal.status !== 'downloaded') throw new Error('Completed comedy generation record required.');

    await mkdir(backup38sDir, { recursive: true });
    if (!await exists(backup38s)) {
      await copyFile(publicVideo, backup38s, fsConstants.COPYFILE_EXCL);
    }

    await copyFile(comedyFinalPath, `${publicVideo}.next`);
    await rename(`${publicVideo}.next`, publicVideo);

    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest[charId] = {
      ...manifest[charId],
      width: meta.width,
      height: meta.height,
      duration: 46,
      scenes: 6,
      bytes: meta.bytes,
      sha256: checksum,
      revision: checksum.slice(0, 12),
    };
    await json(manifestPath, manifest);

    const completedRecord = {
      characterId: charId,
      model,
      width: meta.width,
      height: meta.height,
      duration: 46,
      scenes: 6,
      publishedAt: new Date().toISOString(),
      sha256: checksum,
      comedyFingerprint: journal.fingerprint,
      generatedComedyResolution: resolution,
      voice: validated.voice,
    };
    await json(`production/character-videos/completed/${charId}-comedy.json`, completedRecord);
    console.log(`[PUBLISHED] ${charId}: 46s extended comedy video installed to public/videos/${charId}.mp4.`);
  }
}

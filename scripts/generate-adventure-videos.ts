/**
 * Maintainer-only "새 모험" (Season 2 Adventure) episode builder (ElevenLabs API + 3D Clay Scenes).
 *
 * Builds a brand-new 30-second (8s + 8s + 8s + 6s) portrait 1080x1920 @ 24fps episode per character
 * in a new location (놀이공원, 산속, 바닷속, 놀이터, 캠핑장, 열기구, 해적섬, 워터파크) using:
 *   - 4 custom 9:16 3D clay scene illustrations in `.video-generation/adventure-v1/<id>/frame-1..4.png`
 *   - ElevenLabs Music API (`client.music.compose`) for custom location instrumental BGM
 *   - ElevenLabs Sound Effects API (`client.textToSoundEffects.convert`) for cartoon foley
 *   - ElevenLabs TTS API (`client.textToSpeech.convert`) for Korean character comedy voices
 *   - FFmpeg 24fps cartoon motion camera (bouncy push-in, comical boing pulses, sky float pan, plush landing)
 *
 * Uses ZERO Google Gemini video API calls ($0 external video API cost).
 *
 *   node --import tsx scripts/generate-adventure-videos.ts audio ggomi     # synthesize ElevenLabs BGM/SFX/voices
 *   node --import tsx scripts/generate-adventure-videos.ts build ggomi     # render 30s 1080x1920 24fps episode
 *   node --import tsx scripts/generate-adventure-videos.ts publish ggomi   # install to public/videos/adventure
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
const workRoot = '.video-generation/adventure-v1';
const sfxDir = `${workRoot}/sfx`;
const publicDir = 'public/videos/adventure';
const manifestPath = 'public/videos/adventure-manifest.json';

type MotionStyle = 'hop_zoom' | 'puff_boing' | 'sky_float' | 'share_settle';

interface AdventureScene {
  duration: number;
  motion: MotionStyle;
  sfxId: string;
  sfxPrompt: string;
  sfxSeconds: number;
  voiceLine: string;
}

export interface AdventurePlan {
  name: string;
  title: string;
  location: string;
  bgmId: string;
  bgmPrompt: string;
  scenes: AdventureScene[];
}

export const ADVENTURES: Partial<Record<CharacterId, AdventurePlan>> = {
  ggomi: {
    name: '꼬미',
    title: '꼬미의 솜사탕 대소동',
    location: '놀이공원',
    bgmId: 'amusement_park_bgm',
    bgmPrompt:
      'Lighthearted playful pastel amusement park waltz for toddlers, gentle wooden marimba, celesta music box, pizzicato strings, warm bouncy rhythm, cheerful and wholesome, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'hop_zoom',
        sfxId: 'carousel_sparkle',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cute playful cartoon hop and magical twinkling fairy chime sparkles at a sunny fairground, toddler animation sound effect, no voice, no music',
        voiceLine: '우와! 달콤한 분홍 솜사탕이다! 하나 주세요! 꺄아~!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'cotton_puff_boing',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Three comical cute cartoon marshmallow puffing inflation pops getting bigger and bigger ending in a funny soft bouncy rubber boing, preschool cartoon foley, no voice, no music',
        voiceLine: '냠! 어? 어어? 솜사탕이 구름처럼 자꾸자꾸 커져요! 히히!',
      },
      {
        duration: 8,
        motion: 'sky_float',
        sfxId: 'sky_float_whoosh',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle dreamy upward floating breeze whoosh with sparkling wind chimes and cute bubbly cartoon float sound, toddler animation, no voice, no music',
        voiceLine: '둥실둥실~ 하늘로 날고 있어! 안녕 관람차야! 신난다~!',
      },
      {
        duration: 6,
        motion: 'share_settle',
        sfxId: 'plush_landing_tada',
        sfxSeconds: 2.2,
        sfxPrompt:
          'Soft plush cotton pillow bounce landing plop followed by a cheerful warm xylophone sparkle chime, cute preschool cartoon foley, no voice, no music',
        voiceLine: '폭신 착지! 맛있는 건 같이 먹어야지! 너도 한 입 아~!',
      },
    ],
  },
};

const [command, id] = process.argv.slice(2) as [string, CharacterId];
if (!['audio', 'build', 'publish'].includes(command) || !id) {
  console.error('Usage: node --import tsx scripts/generate-adventure-videos.ts audio|build|publish <characterId>');
  process.exit(1);
}
const plan = ADVENTURES[id];
if (!plan) throw new Error(`No adventure plan configured for ${id}`);

const exists = async (path: string) => (await stat(path).catch(() => null))?.size;
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');

async function json(path: string, value: unknown) {
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
}

async function probe(path: string) {
  let info = '';
  try {
    await run(ffmpeg, ['-hide_banner', '-i', path]);
  } catch (error) {
    info = (error as { stderr?: string }).stderr || '';
  }
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
await mkdir(sfxDir, { recursive: true });

async function ensureAllElevenLabsAudio() {
  const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is missing');
  const client = new ElevenLabsClient({ apiKey });
  const before = await client.user.subscription.get();
  if (before.characterLimit - before.characterCount < 500) {
    throw new Error('ElevenLabs included credits are below safety reserve (500); stopping.');
  }

  const bgmPath = `${sfxDir}/${plan!.bgmId}.mp3`;
  if (!(await exists(bgmPath))) {
    console.log(`[MUSIC] Composing 30s BGM "${plan!.bgmId}"...`);
    const musicStream = await client.music.compose({
      prompt: plan!.bgmPrompt,
      musicLengthMs: 30000,
      forceInstrumental: true,
    });
    const bytes = Buffer.from(await new Response(musicStream).arrayBuffer());
    if (bytes.length < 1000) throw new Error('Invalid BGM output from ElevenLabs Music');
    await writeFile(bgmPath, bytes);
  }

  for (const scene of plan!.scenes) {
    const sfxPath = `${sfxDir}/${scene.sfxId}.mp3`;
    if (!(await exists(sfxPath))) {
      console.log(`[SFX] Generating "${scene.sfxId}" (${scene.sfxSeconds}s)...`);
      const sfxStream = await client.textToSoundEffects.convert({
        text: scene.sfxPrompt,
        durationSeconds: scene.sfxSeconds,
        modelId: 'eleven_text_to_sound_v2',
        promptInfluence: 0.7,
        outputFormat: 'mp3_44100_128',
      });
      await writeFile(sfxPath, Buffer.from(await new Response(sfxStream).arrayBuffer()));
    }
  }

  const pitch = getCharacterVoice(id).fallbackPlaybackRate;
  for (let i = 0; i < plan!.scenes.length; i++) {
    const scene = plan!.scenes[i];
    const lineHash = hash(`${id}:${i}:${normalizeSpokenText(scene.voiceLine)}`).slice(0, 12);
    const rawMp3 = `${characterDir}/voice-s${i + 1}-${lineHash}.mp3`;
    const fittedWav = `${characterDir}/voice-s${i + 1}.wav`;
    if (await exists(fittedWav)) continue;
    if (!(await exists(rawMp3))) {
      console.log(`[VOICE] Scene ${i + 1}: "${scene.voiceLine}"`);
      const spec = speechSynthesisSpec(id, scene.voiceLine);
      const stream = await client.textToSpeech.convert(spec.voiceId, {
        ...spec,
        text: normalizeSpokenText(scene.voiceLine),
      });
      await writeFile(rawMp3, Buffer.from(await new Response(stream).arrayBuffer()));
    }
    const tmpWav = `${fittedWav}.tmp.wav`;
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', rawMp3,
      '-af', `aresample=44100,asetrate=${Math.round(44100 * pitch)},aresample=48000,volume=1.18`,
      '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', tmpWav,
    ]);
    const { duration } = await probe(tmpWav);
    const room = scene.duration - 0.85;
    if (duration > room) {
      const tempo = Math.min(1.28, duration / room);
      await run(ffmpeg, [
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', tmpWav,
        '-af', `atempo=${tempo.toFixed(4)}`,
        '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', fittedWav,
      ]);
    } else {
      await rename(tmpWav, fittedWav);
    }
  }

  const after = await client.user.subscription.get();
  console.log(
    `[AUDIO] ElevenLabs used ${after.characterCount - before.characterCount} chars · remaining ${(
      after.characterLimit - after.characterCount
    ).toLocaleString()}`,
  );
}

/**
 * Renders a 24fps 1080x1920 animated scene clip from a high-res clay illustration frame
 * using smooth oversampled crop/zoom/bounce trajectories (zero jitter).
 */
async function renderAnimatedSceneClip(framePath: string, outClipPath: string, duration: number, motion: MotionStyle) {
  const frames = duration * 24;
  // Scale to 2160x3840 first so zoompan operates at 2x supersampled resolution with silky subpixel precision, then scale to 1080x1920!
  let zpExpr = '';
  if (motion === 'hop_zoom') {
    // Cheerful bouncy push-in toward Ggomi & cotton candy cart
    zpExpr = `zoompan=z='1.06+0.12*(on/${frames})+0.014*abs(sin(on/4.5))':x='iw/2-(iw/zoom/2)+18*sin(on/16)':y='ih/2-(ih/zoom/2)-22*abs(sin(on/4.5))':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'puff_boing') {
    // Comical puff-up pulses as the cotton candy grows bigger and bigger!
    zpExpr = `zoompan=z='1.05+0.14*(on/${frames})+0.032*exp(-mod(on,42)/10)*sin(mod(on,42)*0.75)':x='iw/2-(iw/zoom/2)+14*sin(on/9)':y='ih/2-(ih/zoom/2)-18*cos(on/7)':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'sky_float') {
    // Dreamy upward floating pan past the Ferris wheel with gentle breeze sway
    zpExpr = `zoompan=z='1.16-0.05*(on/${frames})+0.01*sin(on/10)':x='iw/2-(iw/zoom/2)+34*sin(on/13)':y='(ih-ih/zoom)*(0.82-0.64*(on/${frames}))':d=${frames}:s=1080x1920:fps=24`;
  } else {
    // Soft plush landing bounce in first second, then warm inviting push-in to share cotton candy
    zpExpr = `zoompan=z='1.06+0.11*(on/${frames})+0.035*exp(-on/16)*abs(sin(on*0.65))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+40*exp(-on/14)*cos(on*0.65)':d=${frames}:s=1080x1920:fps=24`;
  }

  const vf = [
    'scale=2160:3840:force_original_aspect_ratio=increase:flags=lanczos',
    'crop=2160:3840',
    zpExpr,
    'fade=t=in:st=0:d=0.25',
    `fade=t=out:st=${(duration - 0.25).toFixed(2)}:d=0.25`,
    'format=yuv420p',
  ].join(',');

  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', framePath,
    '-vf', vf,
    '-frames:v', String(frames),
    '-r', '24',
    '-c:v', 'libx264', '-crf', '17', '-preset', 'fast', '-pix_fmt', 'yuv420p',
    outClipPath,
  ], { timeout: 300000, maxBuffer: 4 * 1024 * 1024 });
}

if (command === 'audio') {
  await ensureAllElevenLabsAudio();
}

const finalPath = `${characterDir}/final.mp4`;
const totalDuration = plan.scenes.reduce((sum, s) => sum + s.duration, 0);

if (command === 'build') {
  await ensureAllElevenLabsAudio();

  const sceneVideos: string[] = [];
  for (let i = 0; i < plan.scenes.length; i++) {
    const framePath = `${characterDir}/frame-${i + 1}.png`;
    if (!(await exists(framePath))) {
      throw new Error(`Missing clay scene frame: ${framePath}`);
    }
    const clipPath = `${characterDir}/motion-s${i + 1}.mp4`;
    console.log(`[MOTION] Rendering 24fps clay animation scene ${i + 1}/${plan.scenes.length} (${plan.scenes[i].motion})...`);
    await renderAnimatedSceneClip(framePath, clipPath, plan.scenes[i].duration, plan.scenes[i].motion);
    sceneVideos.push(clipPath);
  }

  const bgmPath = `${sfxDir}/${plan.bgmId}.mp3`;
  const inputs: string[] = [];
  const filters: string[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const s = plan.scenes[i];
    const voicePath = `${characterDir}/voice-s${i + 1}.wav`;
    const sfxPath = `${sfxDir}/${s.sfxId}.mp3`;
    inputs.push('-i', sceneVideos[i], '-i', voicePath, '-i', sfxPath);

    const vIdx = i * 3;
    const voIdx = i * 3 + 1;
    const sfxIdx = i * 3 + 2;
    const d = s.duration;

    filters.push(`[${vIdx}:v]fps=24,trim=duration=${d},setpts=PTS-STARTPTS,format=yuv420p[v${i}]`);
    filters.push(
      `[${sfxIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.62,adelay=140|140,apad,atrim=duration=${d},asetpts=PTS-STARTPTS[sfx${i}]`,
    );
    filters.push(
      `[${voIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=420|420,apad,atrim=duration=${d},asetpts=PTS-STARTPTS[vo${i}]`,
    );
  }

  const bgmIdx = plan.scenes.length * 3;
  inputs.push('-stream_loop', '-1', '-i', bgmPath);

  filters.push(
    `${plan.scenes.map((_, i) => `[v${i}]`).join('')}concat=n=${plan.scenes.length}:v=1:a=0[vout]`,
  );
  filters.push(
    `${plan.scenes.map((_, i) => `[sfx${i}]`).join('')}concat=n=${plan.scenes.length}:v=0:a=1[sfx_all]`,
  );
  filters.push(
    `${plan.scenes.map((_, i) => `[vo${i}]`).join('')}concat=n=${plan.scenes.length}:v=0:a=1,asplit=2[vo_all][vo_sc]`,
  );
  filters.push(
    `[${bgmIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=duration=${totalDuration},asetpts=PTS-STARTPTS,volume=0.28,afade=t=in:d=0.4,afade=t=out:st=${(totalDuration - 0.8).toFixed(2)}:d=0.8[bgm_bed]`,
  );
  filters.push(
    `[bgm_bed][sfx_all]amix=inputs=2:normalize=0,atrim=duration=${totalDuration},asetpts=PTS-STARTPTS[bed_mix]`,
  );
  filters.push(
    `[bed_mix][vo_sc]sidechaincompress=threshold=0.018:ratio=6:attack=25:release=280[bed_ducked]`,
  );
  filters.push(
    `[bed_ducked][vo_all]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=in:d=0.08,afade=t=out:st=${(totalDuration - 0.3).toFixed(2)}:d=0.3,atrim=duration=${totalDuration},asetpts=PTS-STARTPTS[aout]`,
  );

  console.log(`[BUILD] Assembling 30s 1080x1920 episode -> ${finalPath}...`);
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '[vout]', '-map', '[aout]',
    '-r', '24', '-frames:v', String(totalDuration * 24), '-t', String(totalDuration),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    finalPath,
  ], { timeout: 600000, maxBuffer: 4 * 1024 * 1024 });

  const meta = await probe(finalPath);
  if (meta.width !== 1080 || meta.height !== 1920 || Math.abs(meta.duration - totalDuration) > 0.25 || meta.fps !== 24) {
    throw new Error(`Unexpected final video: ${JSON.stringify(meta)}`);
  }
  await run(ffmpeg, [
    '-hide_banner', '-v', 'error', '-xerror', '-nostdin', '-i', finalPath,
    '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-',
  ], { timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', '1.2', '-i', finalPath, '-frames:v', '1', '-q:v', '2', '-update', '1',
    `${characterDir}/poster.jpg`,
  ]);
  await json(`${characterDir}/validated.json`, { ...meta, sha256: hash(await readFile(finalPath)) });
  console.log(`[BUILT] ${finalPath} (${Math.round((await exists(finalPath))! / 1024 / 1024 * 10) / 10} MB)`);
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
    engine: 'elevenlabs-audio+clay-motion',
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

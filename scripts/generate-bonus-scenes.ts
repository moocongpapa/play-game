/**
 * Bonus Scene (Scene 5) Generator & Video Extender.
 * Appends an 8-second dancing & eating celebration scene to each character's portrait video (30s -> 38s).
 * Strictly adheres to cost policy: Veo 3.1 Lite 1080p, sequential generation, pre-cached audio.
 */
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, rename, stat, copyFile, open, unlink } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import type { CharacterId } from '../src/types';
import { speechSynthesisKey } from '../src/data/speechSynthesis';
import { getCharacterVoice } from '../src/data/characterVoices';
import { bonusSubmissionAction, type VideoGenerationJournal as Journal } from './bonus-video-policy';

const run = promisify(execFile);
const env = loadEnv('development', process.cwd(), '');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const model = 'veo-3.1-lite-generate-preview';
const resolution = '1080p';
const directory = '.video-generation/portrait-v1';

export const BONUS_SCENES: Record<CharacterId, { name: string; prompt: string; voiceLine: string }> = {
  ggomi: {
    name: '꼬미',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Ggomi the cute little brown bear with pink ears and pink apron joyfully wiggles her hips and waves her paws in a happy little dance, then leans down to take a delicious bite of the sweet strawberry cupcake on the table, chewing happily with rosy blushing cheeks and big smiling eyes. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and cute munching sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
  rano: {
    name: '라노',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Rano the friendly green baby dinosaur happily stomps his little feet and swishes his tail in a cheerful dino dance, then excitedly picks up a delicious yellow banana, takes a big yummy bite, and giggles with a wide happy smile and bouncy cute hops. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and happy dinosaur munching sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
  jelly: {
    name: '젤리',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Jelly the adorable lilac baby bunny in purple dress excitedly hops up and down in a bouncy bunny dance, wiggling her heart-shaped long ears, then nibbles on a crisp crunchy baby carrot with tiny fast chewing motions, beaming with pure toddler joy. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and cute bunny crunching sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
  dochi: {
    name: '도치',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Dochi the sweet golden hedgehog wearing a teal bandana happily hugs his golden acorn and spins around in a delightful woodland victory dance, tapping the acorn rhythmically like a little drum, blushing warmly with sparkling happy eyes. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and rhythmic tapping sound; no intelligible words or singing. No title cards or text.',
    voiceLine: '흔들흔들! 같이 춤추자!',
  },
  ggulgguli: {
    name: '꿀꿀이',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Ggulgguli the chubby pink piglet with yellow bib bounces high into the air on his springy curly tail in an energetic jumping dance, catches a floating ripe strawberry in his mouth, munches happily, and claps his little hooves with delight. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and bouncy spring sounds; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
  eumme: {
    name: '음메',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Eumme the fluffy white cloud lamb with golden bell ribbon dances gently on her soft pink cloud, swaying side to side in a dreamy fairy-tale waltz, nibbling on a sweet star-shaped cookie while glowing little starlight sparkles drift around her. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and dreamy chimes; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
  nurungji: {
    name: '누룽지',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Nurungji the cheerful golden puppy with floppy ears and green bandana wags his tail like a propeller, playfully taps his front paws in a happy puppy tap dance, and munches a crunchy bone-shaped biscuit with joyful head tilts and bright smiling eyes. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and cheerful puppy sounds; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
  pingu: {
    name: '핑구',
    prompt: '3D clay animation style, soft tactile plasticine texture, cute chibi proportions, warm studio lighting, pastel colors, Aardman/Pixar aesthetic, wholesome and cozy toddler cartoon, 1080p 24fps, vertical 9:16 composition. Animate the supplied starting frame: Pingu the adorable slate-blue baby penguin wearing a mint-green scarf flaps his little flippers and waddles from foot to foot in an energetic penguin shuffle dance on the sparkling snow, happily slurping a delicious fish-shaped ice jelly treat. One continuous shot, stable gentle camera, spacious vertical framing. Gentle natural foley and cheerful penguin sounds; no intelligible words or singing. No title cards or text.',
    voiceLine: '냠냠냠!',
  },
};

const [command, id] = process.argv.slice(2) as [string, CharacterId];
if (!id || !['generate', 'build', 'publish'].includes(command) || !(id in BONUS_SCENES)) {
  console.error('Usage: tsx scripts/generate-bonus-scenes.ts generate|build|publish <characterId>');
  process.exit(1);
}

const characterDirectory = `${directory}/${id}`;
await mkdir(characterDirectory, { recursive: true });
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
  if (!dimensionsMatch || +dimensionsMatch[1] !== width || +dimensionsMatch[2] !== height || Math.abs(actualDuration - expectedDuration) > .1 || Number(fpsMatch?.[1]) !== 24) {
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

const originalRecord = JSON.parse(await readFile(`production/character-videos/completed/${id}.json`, 'utf8'));
const backupDir = 'backups/character-videos/2026-10-15-30s-portrait';
const backup = `${backupDir}/${id}.mp4`;
const publicVideo = `public/videos/${id}.mp4`;
const manifestPath = 'public/videos/portrait-manifest.json';
const currentManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (currentManifest[id]?.scenes === 5) {
  if (hash(await readFile(publicVideo)) !== currentManifest[id].sha256) throw new Error('Published bonus checksum mismatch.');
  if (command === 'generate' || command === 'publish') {
    console.log(`[PUBLISHED CACHE] ${id}: complete 38s film installed; no paid request or backup overwrite.`);
    process.exit(0);
  }
}

const lockPath = `${directory}/active.lock`;
const lock = await open(lockPath, 'wx');
await lock.writeFile(`${process.pid} bonus-${command} ${id}\n`);
try { await runCommand(); }
finally { await lock.close(); await unlink(lockPath); }

async function runCommand() {
  if (command === 'generate') {
    await run(ffmpeg, ['-version']);
    const startFramePath = `production/character-videos/starting-frames/${id}/scene-5.png`;
    if (!await exists(startFramePath)) {
      throw new Error(`Starting frame missing: ${startFramePath}`);
    }
    const firstFrame = await readFile(startFramePath);
    if (firstFrame.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || firstFrame.readUInt32BE(16) !== 1080 || firstFrame.readUInt32BE(20) !== 1920) {
      throw new Error('Bonus starting frame must be a reviewed 1080×1920 PNG.');
    }
    const sceneInfo = BONUS_SCENES[id];
    const prompt = sceneInfo.prompt;
    const fingerprint = hash(JSON.stringify({ model, prompt, firstFrame: hash(firstFrame), resolution, aspectRatio: '9:16', duration: 8 }));
    const base = `${characterDirectory}/scene-5`;

    let journal: Journal | undefined = (await exists(`${base}.json`)) ? JSON.parse(await readFile(`${base}.json`, 'utf8')) : undefined;
    const action = bonusSubmissionAction(journal, fingerprint, process.argv.includes('--retry-rejected'));

    if (await exists(`${base}.mp4`)) {
      if (!journal?.operation || action !== 'resume') throw new Error('Cached scene requires its original successful operation record.');
      await inspect(`${base}.mp4`, 8);
      journal.status = 'downloaded';
      await json(`${base}.json`, journal);
      console.log(`[CACHED] ${id} scene 5 already exists.`);
      return;
    }

    const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing');
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 120000, retryOptions: { attempts: 1 } } });

    if (action === 'new' || action === 'retry-rejected') {
      if (action === 'retry-rejected') await copyFile(`${base}.json`, `${base}.rejected-${Date.now()}.json`);
      journal = { fingerprint, model, status: 'submitting', submittedAt: new Date().toISOString() };
      await json(`${base}.json`, journal);
      console.log(`[SUBMIT] ${id} scene 5 (bonus: 8s dance & feast, ${model}, 1080p, estimated $0.64)`);

      try {
        const result = await ai.models.generateVideos({
          model,
          source: {
            prompt,
            image: { imageBytes: firstFrame.toString('base64'), mimeType: 'image/png' },
          },
          config: {
            numberOfVideos: 1,
            durationSeconds: 8,
            aspectRatio: '9:16',
            resolution,
          },
        });
        if (!result.name) throw new Error('No operation ID received');
        journal.operation = result.name;
        journal.status = 'submitted';
        await json(`${base}.json`, journal);
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500 && status !== 408) journal.status = 'rejected';
        journal.error = String((error as Error).message).replaceAll(key, '[REDACTED]');
        await json(`${base}.json`, journal);
        throw new Error(journal.error);
      }
    }

    const operation = new GenerateVideosOperation();
    operation.name = journal!.operation;
    const started = Date.now();
    while (true) {
      const result = await ai.operations.getVideosOperation({ operation });
      if (result.done) {
        const video = result.response?.generatedVideos?.[0]?.video;
        if (result.error || !video) {
          journal!.status = 'failed';
          journal!.error = JSON.stringify(result.error || 'No output video');
          await json(`${base}.json`, journal);
          throw new Error(journal!.error);
        }
        await ai.files.download({ file: video, downloadPath: `${base}.download.mp4` });
        await inspect(`${base}.download.mp4`, 8);
        await rename(`${base}.download.mp4`, `${base}.mp4`);
        journal!.status = 'downloaded';
        await json(`${base}.json`, journal);
        console.log(`[SAVED] ${id} scene 5 successfully downloaded.`);
        break;
      }
      if (Date.now() - started > 30 * 60000) throw new Error('Polling limit reached');
      console.log(`[WAIT] ${id} scene 5, ${Math.round((Date.now() - started) / 1000)}s`);
      await new Promise(r => setTimeout(r, 20000));
    }
  }

  if (command === 'build') {
    await run(ffmpeg, ['-version']);
    const scene5Path = `${characterDirectory}/scene-5.mp4`;
    if (!await exists(scene5Path)) throw new Error(`Scene 5 video missing: ${scene5Path}`);
    await inspect(scene5Path, 8);

    const original30sPath = await exists(backup) ? backup : publicVideo;
    if (!await exists(original30sPath)) throw new Error(`Original 30s video missing: ${original30sPath}`);
    if (hash(await readFile(original30sPath)) !== originalRecord.sha256) throw new Error('Base film must match its original 30s record.');
    await inspect(original30sPath, 30, originalRecord.width, originalRecord.height);

    // Reuse the character’s saved dance or eating voice clip.
    const key = speechSynthesisKey(BONUS_SCENES[id].voiceLine, id, 'ko');
    const voiceAssetId = createHash('sha256').update(key).digest('hex');
    const voicePath = `public/audio/elevenlabs/speech/${voiceAssetId}.mp3`;
    if (!await exists(voicePath)) throw new Error(`Cached voice clip missing: ${voicePath}`);

    const extendedFinalPath = `${characterDirectory}/extended-final.mp4`;
    const pitch = getCharacterVoice(id).fallbackPlaybackRate;
    console.log(`[BUILDING] Assembling 38s extended video for ${id}...`);

    // Concatenate 30s base video with 8s scene 5.
    // In scene 5, overlay the matching character voice at ~2.5s with gentle ducking.
    // Preserve the base resolution (including Pingu 4K); upscale only the new Lite scene locally.
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
      '-i', original30sPath,
      '-i', scene5Path,
      '-i', voicePath,
      '-filter_complex',
      [
        // Video standardization
        '[0:v]trim=duration=30,setpts=PTS-STARTPTS[v0]',
        `[1:v]trim=duration=8,scale=${originalRecord.width}:${originalRecord.height}:flags=lanczos,setpts=PTS-STARTPTS[v1]`,
        '[v0][v1]concat=n=2:v=1:a=0[v_concat]',

        // Audio: original 30s soundtrack, scene 5 foley, and cached character voice.
        '[0:a]atrim=duration=30,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0]',
        `[2:a]aresample=44100,asetrate=${Math.round(44100 * pitch)},aresample=48000,aformat=channel_layouts=stereo,adelay=2500|2500,apad,atrim=duration=8,asetpts=PTS-STARTPTS,asplit=2[voice][sc]`,
        '[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.35,atrim=duration=8,asetpts=PTS-STARTPTS[foley]',
        '[foley][sc]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=300[ducked]',
        '[ducked][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=out:st=7.6:d=0.4,asetpts=PTS-STARTPTS[a1]',
        '[a0][a1]concat=n=2:v=0:a=1[a_concat]',
      ].join(';'),
      '-map', '[v_concat]',
      '-map', '[a_concat]',
      '-r', '24',
      '-t', '38',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart',
      extendedFinalPath,
    ], { timeout: 900000, maxBuffer: 1024 * 1024 });

    const meta = await inspect(extendedFinalPath, 38, originalRecord.width, originalRecord.height);
    await run(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-nostdin', '-i', extendedFinalPath, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-'], { timeout: 180000, maxBuffer: 1024 * 1024 });
    await json(`${characterDirectory}/extended-validated.json`, { ...meta, sha256: hash(await readFile(extendedFinalPath)), voice: { text: BONUS_SCENES[id].voiceLine, asset: voiceAssetId, sha256: hash(await readFile(voicePath)), pitch } });
    console.log(`[BUILT] ${id}: extended 38s video successfully built (${meta.duration}s, ${meta.bytes} bytes).`);
  }

  if (command === 'publish') {
    const extendedFinalPath = `${characterDirectory}/extended-final.mp4`;
    if (!await exists(extendedFinalPath)) throw new Error(`Extended video missing: ${extendedFinalPath}`);
    const meta = await inspect(extendedFinalPath, 38, originalRecord.width, originalRecord.height);
    const checksum = hash(await readFile(extendedFinalPath));
    const validated = JSON.parse(await readFile(`${characterDirectory}/extended-validated.json`, 'utf8'));
    if (validated.sha256 !== checksum) throw new Error('Extended film changed since validation.');
    const journal = JSON.parse(await readFile(`${characterDirectory}/scene-5.json`, 'utf8')) as Journal;
    if (journal.status !== 'downloaded' || !journal.operation) throw new Error('Completed bonus generation record required.');
    if (hash(await readFile(publicVideo)) !== originalRecord.sha256) throw new Error('Public base film changed; refusing to overwrite.');
    await mkdir(backupDir, { recursive: true });
    if (await exists(backup)) {
      if (hash(await readFile(backup)) !== originalRecord.sha256) throw new Error('Original backup differs; refusing overwrite.');
    } else await copyFile(publicVideo, backup, fsConstants.COPYFILE_EXCL);
    await copyFile(extendedFinalPath, `${publicVideo}.next`);
    await rename(`${publicVideo}.next`, publicVideo);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest[id] = {
      ...manifest[id],
      width: meta.width,
      height: meta.height,
      duration: 38,
      scenes: 5,
      bytes: meta.bytes,
      sha256: checksum,
      revision: checksum.slice(0, 12),
    };
    await json(manifestPath, manifest);

    const completedRecord = {
      characterId: id,
      model,
      width: meta.width,
      height: meta.height,
      duration: 38,
      scenes: 5,
      publishedAt: new Date().toISOString(),
      sha256: checksum,
      baseSha256: originalRecord.sha256,
      bonusFingerprint: journal.fingerprint,
      generatedBonusResolution: resolution,
      voice: validated.voice,
    };
    await json(`production/character-videos/completed/${id}-extended.json`, completedRecord);
    console.log(`[PUBLISHED] ${id}: 38s extended video installed to public/videos/${id}.mp4.`);
  }
}

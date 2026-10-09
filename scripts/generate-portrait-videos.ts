/** Maintainer-only. One character at a time; never run from the app or build. */
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, rename, stat, open, unlink, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { CharacterId } from '../src/types';

const run = promisify(execFile);
const env = loadEnv('development', process.cwd(), '');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
// User's cost policy: never silently upgrade the model or resolution.
const model = 'veo-3.1-lite-generate-preview';
const resolution = '1080p';
const directory = '.video-generation/portrait-v1';
type Scene = { scene: number; prompt: string; modelId: string; resolution: string; durationSecs: number; startFrameImage?: string; usedDurationSeconds: number };
type Character = { id: CharacterId; targetWidth: number; targetHeight: number; scenes: Scene[] };
type Journal = { fingerprint: string; model: string; status: 'submitting' | 'submitted' | 'downloaded' | 'failed' | 'rejected'; operation?: string; error?: string; submittedAt: string };
const plan = JSON.parse(await readFile('production/character-videos/plan.json', 'utf8')) as { characters: Character[] };
const [command, id] = process.argv.slice(2);
if (process.argv.some(arg => arg === '--parallel-scenes' || arg.startsWith('--parallel-scenes='))) {
  throw new Error('Parallel scene generation is disabled to respect account rate limits. Remove --parallel-scenes and generate scenes sequentially.');
}
const character = plan.characters.find(c => c.id === id);
if (!character || !['generate', 'build', 'publish'].includes(command)) throw new Error('Usage: tsx scripts/generate-portrait-videos.ts generate|build|publish <characterId>');
const characterDirectory = `${directory}/${character.id}`;
await mkdir(characterDirectory, { recursive: true });
const exists = async (path: string) => (await stat(path).catch(() => null))?.size;
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
async function json(path: string, value: unknown) {
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
}
async function inspect(path: string, seconds: number) {
  let info = '';
  try { await run(ffmpeg, ['-hide_banner', '-i', path]); }
  catch (error) { info = (error as { stderr?: string }).stderr || ''; }
  const duration = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const dimensions = info.match(/Video:.*?\b(\d{3,5})x(\d{3,5})\b/);
  const fps = info.match(/Video:.*? ([\d.]+) fps/);
  const actual = duration ? +duration[1] * 3600 + +duration[2] * 60 + +duration[3] : 0;
  if (!dimensions || +dimensions[1] !== character.targetWidth || +dimensions[2] !== character.targetHeight || Math.abs(actual - seconds) > .1 || Number(fps?.[1]) !== 24) {
    throw new Error(`Unexpected media: ${path}: ${dimensions?.[0]}, ${actual}s, ${fps?.[1]}fps`);
  }
  return { width: +dimensions[1], height: +dimensions[2], duration: actual, fps: 24, bytes: await exists(path) };
}
if (command === 'generate' && await exists('public/videos/portrait-manifest.json')) {
  const completed = JSON.parse(await readFile('public/videos/portrait-manifest.json', 'utf8'))[character.id];
  if (completed?.sha256) {
    const saved = `public/videos/${character.id}.mp4`;
    if (!await exists(saved) || hash(await readFile(saved)) !== completed.sha256) throw new Error('Published video differs from its saved checksum; restore it before generating again');
    await inspect(saved, 30);
    console.log(`[PUBLISHED CACHE] ${character.id}: complete portrait film already installed; no generation requested.`);
    process.exit(0);
  }
}
const lockPath = `${directory}/active.lock`;
if (process.argv.includes('--recover-lock') && await exists(lockPath)) {
  const contents = await readFile(lockPath, 'utf8');
  const pid = Number(contents.split(' ')[0]);
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid lock; inspect it manually');
  let exited = false;
  try { process.kill(pid, 0); }
  catch (error) { exited = (error as NodeJS.ErrnoException).code === 'ESRCH'; }
  if (!exited) throw new Error(`Process ${pid} may still be running; keeping its lock`);
  if (await readFile(lockPath, 'utf8') !== contents) throw new Error('Lock changed while checking it');
  await unlink(lockPath);
}
const lock = await open(lockPath, 'wx');
await lock.writeFile(`${process.pid} ${command} ${id}\n`);
try {
  // Fail before spending credits if the local video toolchain is unavailable.
  await run(ffmpeg, ['-version']);
  if (command === 'generate') {
    if (process.env.VEO_MODEL && process.env.VEO_MODEL !== model) throw new Error('Cost policy only permits Veo 3.1 Lite; remove the VEO_MODEL override.');
    if (character.targetWidth !== 1080 || character.targetHeight !== 1920 || character.scenes.length !== 4 || character.scenes.some((scene, index) => scene.scene !== index + 1 || scene.modelId !== model || scene.resolution !== resolution || scene.durationSecs !== 8)) {
      throw new Error('New generation must use four 8-second Veo 3.1 Lite scenes at 1080×1920. Completed legacy films remain reusable.');
    }
    // Lite supports a first image, not referenceImages. Validate all reviewed
    // portrait starting frames before spending anything on the first scene.
    const startingFrames = new Map<number, Buffer>();
    for (const scene of character.scenes) {
      if (!scene.startFrameImage) throw new Error(`Scene ${scene.scene} needs a reviewed startFrameImage before generation.`);
      const bytes = await readFile(`production/character-videos/${scene.startFrameImage}`);
      if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== 1080 || bytes.readUInt32BE(20) !== 1920) {
        throw new Error(`Scene ${scene.scene}: starting frame must be a reviewed 1080×1920 PNG.`);
      }
      startingFrames.set(scene.scene, bytes);
    }
    const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    if (!key) throw new Error('Server-only GEMINI_API_KEY is missing');
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 120000, retryOptions: { attempts: 1 } } });
    const generateScene = async (scene: Scene) => {
      const base = `${characterDirectory}/scene-${scene.scene}`;
      const firstFrame = startingFrames.get(scene.scene)!;
      const prompt = `${scene.prompt} Animate the supplied starting frame, preserving the character's exact colors, face proportions, outfit and accessories throughout every pose. Keep the same species and anatomy: do not invent ears, horns, spikes, extra limbs or costume pieces absent from the starting frame. Keep expressions warm and playful, never frightening. One continuous shot, a stable gentle camera, spacious vertical framing. Only gentle natural foley and instrumental ambience; no intelligible voices or singing. No title cards or text.`;
      const fingerprint = hash(JSON.stringify({ model, prompt, firstFrame: hash(firstFrame), resolution, aspectRatio: '9:16', duration: 8 }));
      let journal: Journal | undefined = await exists(`${base}.json`) ? JSON.parse(await readFile(`${base}.json`, 'utf8')) : undefined;
      if (journal?.status === 'rejected' && process.argv.includes('--retry-rejected')) {
        await copyFile(`${base}.json`, `${base}.rejected-${Date.now()}.json`);
        await unlink(`${base}.json`);
        journal = undefined;
      }
      if (journal && journal.fingerprint !== fingerprint) throw new Error(`Changed inputs for ${base}; review saved generation before requesting another.`);
      if (journal?.status === 'rejected') throw new Error(`Request rejected for ${base}; correct the account/configuration and explicitly use --retry-rejected.`);
      if (journal?.status === 'failed' || (journal?.status === 'submitting' && !journal.operation)) throw new Error(`Unresolved submission for ${base}; no automatic duplicate request. ${journal.error || ''}`);
      if (await exists(`${base}.mp4`)) {
        await inspect(`${base}.mp4`, 8);
        if (!journal?.operation) throw new Error(`Cached video has no generation record: ${base}; restore its journal before continuing.`);
        // Recover a crash between saving the download and updating its journal.
        if (journal.status !== 'downloaded') { journal.status = 'downloaded'; await json(`${base}.json`, journal); }
        console.log(`[CACHED] ${id} scene ${scene.scene}`);
        return;
      }
      if (!journal) {
        journal = { fingerprint, model, status: 'submitting', submittedAt: new Date().toISOString() };
        await json(`${base}.json`, journal);
        console.log(`[SUBMIT] ${id} scene ${scene.scene}/4 (${model}, ${resolution}, 9:16, 8s, estimated $0.64)`);
        try {
          const result = await ai.models.generateVideos({ model, source: { prompt, image: { imageBytes: firstFrame.toString('base64'), mimeType: 'image/png' } }, config: {
            numberOfVideos: 1, durationSeconds: 8, aspectRatio: '9:16', resolution,
          } });
          if (!result.name) throw new Error('No operation ID received; submission outcome unknown');
          journal.operation = result.name;
          journal.status = 'submitted';
          await json(`${base}.json`, journal);
        } catch (error) {
          const status = (error as { status?: number }).status;
          // Explicit client rejections did not create an operation. Network/5xx
          // outcomes remain unresolved so retrying cannot silently double bill.
          if (status && status >= 400 && status < 500 && status !== 408) journal.status = 'rejected';
          journal.error = String((error as Error).message).replaceAll(key, '[REDACTED]');
          await json(`${base}.json`, journal);
          throw new Error(journal.error);
        }
      }
      const operation = new GenerateVideosOperation();
      operation.name = journal.operation;
      const started = Date.now();
      while (true) {
        const result = await ai.operations.getVideosOperation({ operation });
        if (result.done) {
          const video = result.response?.generatedVideos?.[0]?.video;
          if (result.error || !video) {
            journal.status = 'failed';
            journal.error = JSON.stringify(result.error || result.response?.raiMediaFilteredReasons || 'No output video');
            await json(`${base}.json`, journal);
            throw new Error(journal.error);
          }
          await ai.files.download({ file: video, downloadPath: `${base}.download.mp4` });
          await inspect(`${base}.download.mp4`, 8);
          await rename(`${base}.download.mp4`, `${base}.mp4`);
          journal.status = 'downloaded';
          await json(`${base}.json`, journal);
          console.log(`[SAVED] ${id} scene ${scene.scene}/4`);
          break;
        }
        if (Date.now() - started > 30 * 60000) throw new Error('Polling limit reached; rerun to resume this saved operation.');
        console.log(`[WAIT] ${id} scene ${scene.scene}/4, ${Math.round((Date.now() - started) / 1000)}s`);
        await new Promise(done => setTimeout(done, 20000));
      }
    };
    const onlyScene = process.argv.find(arg => arg.startsWith('--scene='))?.split('=')[1];
    if (onlyScene && !['1', '2', '3', '4'].includes(onlyScene)) throw new Error('Scene must be 1, 2, 3 or 4');
    const scenes = character.scenes.filter(scene => !onlyScene || scene.scene === Number(onlyScene));
    // Stop at the first failure before spending on the next scene. Concurrent
    // submissions exceed this account's low requests-per-minute allowance.
    for (const scene of scenes) await generateScene(scene);
    console.log(`[GENERATED] ${id}: requested scenes saved. Build and review all four before starting the next character.`);
  }
  if (command === 'build') {
    if (character.scenes.length !== 4 || character.scenes.some((scene, index) => scene.scene !== index + 1 || scene.usedDurationSeconds !== (index === 3 ? 6 : 8))) {
      throw new Error('Portrait episodes require four ordered scenes of 8 + 8 + 8 + 6 seconds');
    }
    for (const scene of character.scenes) await inspect(`${characterDirectory}/scene-${scene.scene}.mp4`, 8);
    const { ensureCharacterDubs } = await import('./character-video-audio');
    const dubs = await ensureCharacterDubs(character.id, `${characterDirectory}/dubs`, ffmpeg);
    const inputs: string[] = [];
    const filters: string[] = [];
    for (const [index, scene] of character.scenes.entries()) {
      const duration = scene.usedDurationSeconds;
      const source = index * 2, dub = source + 1;
      inputs.push('-i', `${characterDirectory}/scene-${scene.scene}.mp4`, '-i', dubs[index]);
      // Trim decoded frames and reset each scene's clock before concatenating.
      // Packet-copy trims retain B-frame preroll and AAC priming, extending the
      // last scene and shifting the otherwise exact 8/16/24-second boundaries.
      filters.push(`[${source}:v]trim=duration=${duration},setpts=PTS-STARTPTS[v${index}]`);
      // Original audio is soft foley; speech sidechains it for intelligibility.
      filters.push(`[${dub}:a]asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,adelay=350|350,apad,atrim=duration=${duration},asplit=2[voice${index}][sc${index}]`);
      filters.push(`[${source}:a]atrim=duration=${duration},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.2[bed${index}]`);
      filters.push(`[bed${index}][sc${index}]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=300[duck${index}]`);
      filters.push(`[duck${index}][voice${index}]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=in:d=0.08,afade=t=out:st=${duration - .2}:d=0.2,atrim=duration=${duration},asetpts=PTS-STARTPTS[a${index}]`);
    }
    filters.push(character.scenes.map((_, index) => `[v${index}][a${index}]`).join('') + 'concat=n=4:v=1:a=1[video][audio]');
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...inputs,
      '-filter_complex', filters.join(';'), '-map', '[video]', '-map', '[audio]',
      '-r', '24', '-frames:v', '720', '-t', '30', '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', `${characterDirectory}/final.mp4`,
    ], { timeout: 900000, maxBuffer: 1024 * 1024 });
    const metadata = await inspect(`${characterDirectory}/final.mp4`, 30);
    // Header metadata alone cannot detect a truncated packet or damaged middle scene.
    await run(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-nostdin', '-i', `${characterDirectory}/final.mp4`, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-'], { timeout: 180000, maxBuffer: 1024 * 1024 });
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '2', '-i', `${characterDirectory}/final.mp4`, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', `${characterDirectory}/poster.jpg`]);
    await json(`${characterDirectory}/validated.json`, { characterId: id, ...metadata, sha256: hash(await readFile(`${characterDirectory}/final.mp4`)) });
    console.log(`[BUILT] ${resolve(characterDirectory)}/final.mp4 — review four scenes and dubbing before publishing.`);
  }
  if (command === 'publish') {
    const final = `${characterDirectory}/final.mp4`;
    const metadata = await inspect(final, 30);
    const checksum = hash(await readFile(final));
    const validated = JSON.parse(await readFile(`${characterDirectory}/validated.json`, 'utf8'));
    if (validated.sha256 !== checksum) throw new Error('Final file changed since validation');
    const backup = `backups/character-videos/2026-10-09-landscape/${id}.mp4`;
    if (!await exists(backup)) throw new Error('Original backup is required before replacement');
    const manifestPath = 'public/videos/portrait-manifest.json';
    const manifest = await exists(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};
    const provenance = await Promise.all(character.scenes.map(async scene => {
      const journal = JSON.parse(await readFile(`${characterDirectory}/scene-${scene.scene}.json`, 'utf8')) as Journal;
      if (journal.status !== 'downloaded') throw new Error('All four generation records must be complete');
      return { scene: scene.scene, model: journal.model, fingerprint: journal.fingerprint };
    }));
    if (!await exists(`${characterDirectory}/poster.jpg`)) throw new Error('Reviewed poster is required');
    await copyFile(final, `public/videos/${id}.next.mp4`);
    await copyFile(`${characterDirectory}/poster.jpg`, `public/videos/posters/${id}.next.jpg`);
    await rename(`public/videos/${id}.next.mp4`, `public/videos/${id}.mp4`);
    await rename(`public/videos/posters/${id}.next.jpg`, `public/videos/posters/${id}.jpg`);
    manifest[id] = { model: provenance[0].model, ...metadata, sha256: checksum, scenes: 4, dubbedLanguage: 'ko', revision: checksum.slice(0, 12) };
    await json(manifestPath, manifest);
    await mkdir('production/character-videos/completed', { recursive: true });
    await json(`production/character-videos/completed/${id}.json`, { ...manifest[id], publishedAt: new Date().toISOString(), sources: provenance });
    console.log(`[PUBLISHED] ${id}: 30s portrait video and poster installed.`);
  }
} finally { await lock.close(); await unlink(lockPath); }

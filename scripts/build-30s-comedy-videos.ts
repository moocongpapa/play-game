/**
 * Maintainer-only Episode 2 (30s Comedy Show) Builder.
 * Remixes existing high-resolution 3D clay scenes (scene-6, scene-5, scene-2, scene-3) into a hilarious
 * 30-second (8s + 8s + 8s + 6s) comedy episode for all 8 characters, using ElevenLabs TTS & Sound Effects
 * within included free/starter credits ($0 video API cost).
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import type { CharacterId } from '../src/types';
import { getCharacterVoice } from '../src/data/characterVoices';
import { normalizeSpokenText, speechSynthesisSpec } from '../src/data/speechSynthesis';

const run = promisify(execFile);
const env = loadEnv('development', process.cwd(), '');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const workRoot = '.video-generation/comedy-30s-v1';
const backup46sDir = 'backups/character-videos/2026-11-09-46s-portrait';
const portraitManifestPath = 'public/videos/portrait-manifest.json';

type SfxId = 'sneeze_pop' | 'slip_boing' | 'toot_propeller' | 'bowling_strike' | 'pudding_bounce' | 'hiccup_poof';

const COMEDY_SFX_SPECS: Record<SfxId, { seconds: number; prompt: string }> = {
  sneeze_pop: {
    seconds: 1.5,
    prompt: 'Cute tiny cartoon squeaky sneeze followed by a soft plush pillow bounce plop, playful preschool animation sound effect, no voice, no music.',
  },
  slip_boing: {
    seconds: 1.5,
    prompt: 'Funny cartoon banana peel slip slide whistle and bouncy rubber boing sound effect, cheerful toddler cartoon, no voice, no music.',
  },
  toot_propeller: {
    seconds: 1.5,
    prompt: 'One tiny cute comical squeaky bubble toot followed by a gentle toy propeller whirring up, funny toddler cartoon sound effect, no voice, no music.',
  },
  bowling_strike: {
    seconds: 1.5,
    prompt: 'Cute wooden toy rolling fast and knocking over soft toy bowling pins with a cheerful chime, preschool cartoon foley, no voice, no music.',
  },
  pudding_bounce: {
    seconds: 1.5,
    prompt: 'Big wobbly jelly pudding boing and spring trampoline jump sound effect, comical cartoon bounce, no voice, no music.',
  },
  hiccup_poof: {
    seconds: 1.5,
    prompt: 'Cute tiny cartoon squeaky hiccup followed by a soft airy cotton candy puff pop with magical sparkles, preschool cartoon, no voice, no music.',
  },
};

export interface ComedyEpisodePlan {
  id: CharacterId;
  name: string;
  title: string;
  scenes: Array<{
    sourceScene: number; // from .video-generation/portrait-v1/<id>/scene-<N>.mp4
    duration: number;    // 8, 8, 8, 6 -> 30s
    sfx: SfxId;
    voiceLine: string;
  }>;
}

export const COMEDY_EPISODES: Record<CharacterId, ComedyEpisodePlan> = {
  ggomi: {
    id: 'ggomi',
    name: '꼬미',
    title: '🐻 꼬미의 딸기 코 에취! 엉덩방아 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'sneeze_pop',
        voiceLine: '어라? 내 코에 달콤한 딸기 크림이 묻었네? 간질간질 에취~! 아이코 엉덩이야! 헤헤!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '엉덩방아 찧었더니 배가 꼬르륵 소리 나네! 왕 딸기 케이크 한입에 와앙 먹어야지! 냠냠냠!',
      },
      {
        sourceScene: 2,
        duration: 8,
        sfx: 'hiccup_poof',
        voiceLine: '우와! 너무 맛있어서 볼이 풍선처럼 빵빵해졌어! 딸꾹! 크림 수염 어때? 웃기지?',
      },
      {
        sourceScene: 3,
        duration: 6,
        sfx: 'slip_boing',
        voiceLine: '유하야! 꼬미랑 엉덩이 실룩샐룩 개그 댄스 추자! 사랑해 까르르!',
      },
    ],
  },
  rano: {
    id: 'rano',
    name: '라노',
    title: '🦖 라노의 미끌미끌 바나나 꽈당 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'slip_boing',
        voiceLine: '우와 맛있는 바나나다! 어어어? 발이 미끌미끌 슈우웅 꽈당! 별이 빙글빙글 도네! 꺄르르!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '꽈당 넘어져도 안 울어! 바나나 먹고 방귀 뿡뿡 공룡 댄스 출 거야! 쿵짝쿵짝 냠냠!',
      },
      {
        sourceScene: 3,
        duration: 8,
        sfx: 'toot_propeller',
        voiceLine: '어라? 공룡 알에서 비눗방울이 퐁퐁 터지네! 코로 톡! 꼬리로 팡! 간지러워 히히!',
      },
      {
        sourceScene: 1,
        duration: 6,
        sfx: 'bowling_strike',
        voiceLine: '크와앙! 장난꾸러기 아기공룡 라노 최고지? 유하야 또 놀자!',
      },
    ],
  },
  jelly: {
    id: 'jelly',
    name: '젤리',
    title: '🐰 젤리의 뿌웅 방귀 헬리콥터 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'toot_propeller',
        voiceLine: '뿌웅~! 앗! 방귀 소리에 깜짝 놀라서 토끼 귀가 뱅글뱅글 헬리콥터처럼 날아가요! 슈웅~!',
      },
      {
        sourceScene: 2,
        duration: 8,
        sfx: 'slip_boing',
        voiceLine: '영차영차! 내 키만 한 왕당근을 뽑다가 엉덩방아 쿵! 데구르르 굴렀네! 까르르!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '아삭아삭 오독오독! 앞니로 당근을 백 번 씹어 먹으면 귀가 쫑긋쫑긋 춤을 춰요!',
      },
      {
        sourceScene: 3,
        duration: 6,
        sfx: 'sneeze_pop',
        voiceLine: '나비야 내 코 간지럽히지 마! 에취! 유하야 귀 하트 뿅뿅!',
      },
    ],
  },
  dochi: {
    id: 'dochi',
    name: '도치',
    title: '🦔 도치의 데굴데굴 볼링 스트라이크 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'bowling_strike',
        voiceLine: '도치 변신! 동글동글 밤송이 볼링공 나간다! 데굴데굴 떼구르르 쾅! 스트라이크 까꿍!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '신난다! 황금 도토리 북을 통통통 두드리며 빙글빙글 팽이 춤을 춰 볼까? 얼쑤!',
      },
      {
        sourceScene: 2,
        duration: 8,
        sfx: 'hiccup_poof',
        voiceLine: '배로 문질문질 도토리를 닦았더니 내 배가 거울처럼 반짝반짝 빛나네! 어라 간지러워!',
      },
      {
        sourceScene: 3,
        duration: 6,
        sfx: 'slip_boing',
        voiceLine: '단풍잎 왕관 쓴 개그왕 도치! 유하야 나랑 데굴데굴 구르자!',
      },
    ],
  },
  ggulgguli: {
    id: 'ggulgguli',
    name: '꿀꿀이',
    title: '🐷 꿀꿀이의 말랑 푸딩 트램펄린 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '왕 커다란 딸기 푸딩 위에서 점프! 출렁출렁 띠용~! 하늘까지 공중제비 슈우웅 착지!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'slip_boing',
        voiceLine: '내 스프링 꼬리로 통통 튀어 올라서 하늘에서 떨어지는 딸기를 입으로 쏙! 냠냠 꿀꿀!',
      },
      {
        sourceScene: 3,
        duration: 8,
        sfx: 'toot_propeller',
        voiceLine: '보글보글 비눗방울 목욕탕에서 방귀를 뽀글 뀌었더니 분홍 거품 왕관이 생겼네! 헤헤!',
      },
      {
        sourceScene: 1,
        duration: 6,
        sfx: 'hiccup_poof',
        voiceLine: '코를 씰룩씰룩 꿀꿀! 유하야 나랑 맛있는 개그 파티 하자!',
      },
    ],
  },
  eumme: {
    id: 'eumme',
    name: '음메',
    title: '🐑 음메의 딸꾹 솜사탕 풍선 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'hiccup_poof',
        voiceLine: '앗 딸꾹! 딸꾹질을 할 때마다 양털이 퐁퐁 부풀어서 대왕 솜사탕 풍선이 됐어요! 펑! 히히!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '구름 위에서 살랑살랑 엉덩이 춤을 추면서 반짝이는 별 쿠키를 오독오독 냠냠 먹어요!',
      },
      {
        sourceScene: 2,
        duration: 8,
        sfx: 'slip_boing',
        voiceLine: '별똥별을 잡으려고 폴짝 뛰었다가 폭신폭신 구름 젤리에 코가 푹 빠졌네! 간지러워~',
      },
      {
        sourceScene: 3,
        duration: 6,
        sfx: 'sneeze_pop',
        voiceLine: '구름 베개 위에서 쿨쿨 코 골기 장난! 드르렁 푸우~ 유하야 까르르 웃어봐!',
      },
    ],
  },
  nurungji: {
    id: 'nurungji',
    name: '누룽지',
    title: '🐶 누룽지의 뱅글뱅글 꼬리 잡기 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'slip_boing',
        voiceLine: '내 꼬리야 거기 서라! 뱅글뱅글 휙휙 돌았더니 아이코 어지러워! 비틀비틀 쿵 메롱~ 헤헤!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'bowling_strike',
        voiceLine: '어지러운 건 맛있는 뼈다귀 과자로 싹 날려버리자! 발바닥 탭댄스 추며 와그작 냠냠!',
      },
      {
        sourceScene: 2,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '코로 빨간 공을 뻥 찼더니 공이 내 이마에 통! 발라당 누워서 배 긁어달라고 애교 부릴래!',
      },
      {
        sourceScene: 3,
        duration: 6,
        sfx: 'toot_propeller',
        voiceLine: '모래밭을 파파팍 팠더니 코에 모래가 잔뜩 묻었네! 유하야 뽀뽀 츄~!',
      },
    ],
  },
  pingu: {
    id: 'pingu',
    name: '핑구',
    title: '🐧 핑구의 쓔우웅 눈사람 변신 개그쇼',
    scenes: [
      {
        sourceScene: 6,
        duration: 8,
        sfx: 'bowling_strike',
        voiceLine: '배를 깔고 얼음 위를 쓔우웅! 어어어 눈사람이랑 쿵 박았더니 내 머리에 당근 코가 쏙! 내가 눈사람이네!',
      },
      {
        sourceScene: 5,
        duration: 8,
        sfx: 'pudding_bounce',
        voiceLine: '눈사람 모자 쓴 채로 뒤뚱뒤뚱 펭귄 셔플 댄스! 차가운 물고기 젤리 호로록 냠냠 시큼해!',
      },
      {
        sourceScene: 2,
        duration: 8,
        sfx: 'slip_boing',
        voiceLine: '이번엔 엉덩이로 얼음 미끄럼틀 타기! 슈웅 내려가다 눈더미에 코 박고 발만 동동! 까르르!',
      },
      {
        sourceScene: 1,
        duration: 6,
        sfx: 'hiccup_poof',
        voiceLine: '뒤뚱뒤뚱 개그 대장 핑구! 유하야 나랑 또 웃긴 놀이 하자! 안녕~!',
      },
    ],
  },
};

const exists = async (path: string) => (await stat(path).catch(() => null))?.size;
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');

async function json(path: string, value: unknown) {
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
}

async function ensureSfx(client: ElevenLabsClient, sfxId: SfxId): Promise<string> {
  const sfxDir = `${workRoot}/sfx`;
  await mkdir(sfxDir, { recursive: true });
  const target = `${sfxDir}/${sfxId}.mp3`;
  if (await exists(target)) return target;

  const spec = COMEDY_SFX_SPECS[sfxId];
  console.log(`[SFX] Generating comedy sound effect "${sfxId}" (${spec.seconds}s)...`);
  const stream = await client.textToSoundEffects.convert({
    text: spec.prompt,
    durationSeconds: spec.seconds,
    modelId: 'eleven_text_to_sound_v2',
    promptInfluence: 0.7,
    outputFormat: 'mp3_44100_128',
  });
  const bytes = Buffer.from(await new Response(stream).arrayBuffer());
  if (bytes.length < 100) throw new Error(`Invalid SFX output for ${sfxId}`);
  await writeFile(target, bytes);
  return target;
}

async function ensureVoiceClip(
  client: ElevenLabsClient,
  charId: CharacterId,
  sceneIdx: number,
  text: string,
  maxDuration: number,
): Promise<string> {
  const charDir = `${workRoot}/${charId}`;
  await mkdir(charDir, { recursive: true });
  const lineHash = hash(`${charId}:${sceneIdx}:${normalizeSpokenText(text)}`).slice(0, 14);
  const rawMp3 = `${charDir}/voice-s${sceneIdx + 1}-${lineHash}.mp3`;
  const fittedWav = `${charDir}/voice-s${sceneIdx + 1}-${lineHash}.wav`;

  if (await exists(fittedWav)) return fittedWav;

  if (!await exists(rawMp3)) {
    const spec = speechSynthesisSpec(charId, text);
    console.log(`[VOICE] Synthesizing ${charId} scene ${sceneIdx + 1}: "${text}"`);
    const stream = await client.textToSpeech.convert(spec.voiceId, {
      ...spec,
      text: normalizeSpokenText(text),
    });
    const bytes = Buffer.from(await new Response(stream).arrayBuffer());
    if (bytes.length < 100) throw new Error(`Invalid TTS response for ${charId}`);
    await writeFile(rawMp3, bytes);
  }

  const voice = getCharacterVoice(charId);
  const tempWav = `${fittedWav}.tmp.wav`;
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', rawMp3,
    '-af', `aresample=44100,asetrate=${Math.round(44100 * voice.fallbackPlaybackRate)},aresample=48000,volume=1.15`,
    '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2',
    tempWav,
  ]);

  let info = '';
  try { await run(ffmpeg, ['-hide_banner', '-i', tempWav]); }
  catch (e) { info = (e as { stderr?: string }).stderr || ''; }
  const durMatch = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const actualDur = durMatch ? +durMatch[1] * 3600 + +durMatch[2] * 60 + +durMatch[3] : 0;

  if (actualDur > maxDuration - 0.35) {
    const tempo = Math.min(1.35, actualDur / (maxDuration - 0.4));
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
      '-i', tempWav,
      '-af', `atempo=${tempo.toFixed(4)}`,
      '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2',
      fittedWav,
    ]);
  } else {
    await rename(tempWav, fittedWav);
  }
  return fittedWav;
}

async function inspectVideo(path: string, expectedDuration = 30) {
  let info = '';
  try { await run(ffmpeg, ['-hide_banner', '-i', path]); }
  catch (e) { info = (e as { stderr?: string }).stderr || ''; }
  const durMatch = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const dimMatch = info.match(/Video:.*?\b(\d{3,5})x(\d{3,5})\b/);
  const fpsMatch = info.match(/Video:.*? ([\d.]+) fps/);
  const actualDuration = durMatch ? +durMatch[1] * 3600 + +durMatch[2] * 60 + +durMatch[3] : 0;
  if (!dimMatch || +dimMatch[1] !== 1080 || +dimMatch[2] !== 1920 || Math.abs(actualDuration - expectedDuration) > 0.25 || Number(fpsMatch?.[1]) !== 24) {
    throw new Error(`Unexpected video in ${path}: ${dimMatch?.[0]}, ${actualDuration}s, ${fpsMatch?.[1]}fps`);
  }
  return {
    width: 1080,
    height: 1920,
    duration: Math.round(actualDuration),
    fps: 24,
    bytes: (await exists(path)) || 0,
  };
}

const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is missing');
const client = new ElevenLabsClient({ apiKey });

const beforeSub = await client.user.subscription.get();
console.log(`[BUDGET] Starting ElevenLabs credits: ${(beforeSub.characterLimit - beforeSub.characterCount).toLocaleString()} remaining`);

await mkdir(backup46sDir, { recursive: true });

// 1. Ensure all 6 comedy SFX exist
const sfxPaths = new Map<SfxId, string>();
for (const sfxId of Object.keys(COMEDY_SFX_SPECS) as SfxId[]) {
  sfxPaths.set(sfxId, await ensureSfx(client, sfxId));
}

// 2. Build 30s comedy episode and merge with 46s portrait video into 76s unified episode
const portraitManifest: Record<string, Record<string, unknown>> = (await exists(portraitManifestPath))
  ? JSON.parse(await readFile(portraitManifestPath, 'utf8'))
  : {};

const targetArg = process.argv[2] as CharacterId | undefined;
const charList = targetArg ? [targetArg] : (Object.keys(COMEDY_EPISODES) as CharacterId[]);

for (const charId of charList) {
  const plan = COMEDY_EPISODES[charId];
  const charWorkDir = `${workRoot}/${charId}`;
  await mkdir(charWorkDir, { recursive: true });

  const voiceWavs: string[] = [];
  for (let i = 0; i < plan.scenes.length; i++) {
    const s = plan.scenes[i];
    const wav = await ensureVoiceClip(client, charId, i, s.voiceLine, s.duration);
    voiceWavs.push(wav);
  }

  const comedy30sMp4 = `${charWorkDir}/comedy-30s.mp4`;
  const existingPublicComedy = `public/videos/comedy/${charId}.mp4`;
  if (!(await exists(comedy30sMp4)) && (await exists(existingPublicComedy))) {
    await copyFile(existingPublicComedy, comedy30sMp4);
  }

  if (!(await exists(comedy30sMp4))) {
    // Assemble 4 scenes (8 + 8 + 8 + 6 = 30s) at 1080x1920 24fps
    const inputs: string[] = [];
    const filters: string[] = [];

    for (let i = 0; i < plan.scenes.length; i++) {
      const s = plan.scenes[i];
      const vIdx = i * 3;
      const voiceIdx = i * 3 + 1;
      const sfxIdx = i * 3 + 2;
      const videoFile = `.video-generation/portrait-v1/${charId}/scene-${s.sourceScene}.mp4`;
      const voiceFile = voiceWavs[i];
      const sfxFile = sfxPaths.get(s.sfx)!;

      if (!await exists(videoFile)) throw new Error(`Missing source scene video: ${videoFile}`);
      inputs.push('-i', videoFile, '-i', voiceFile, '-i', sfxFile);

      const dur = s.duration;
      filters.push(
        `[${vIdx}:v]trim=duration=${dur},setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps=24,format=yuv420p[v${i}]`,
      );
      filters.push(
        `[${vIdx}:a]atrim=duration=${dur},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.18[bed${i}]`,
      );
      filters.push(
        `[${sfxIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.62,adelay=180|180,apad,atrim=duration=${dur},asetpts=PTS-STARTPTS[sfx${i}]`,
      );
      filters.push(
        `[bed${i}][sfx${i}]amix=inputs=2:normalize=0,atrim=duration=${dur},asetpts=PTS-STARTPTS[bg${i}]`,
      );
      filters.push(
        `[${voiceIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=320|320,apad,atrim=duration=${dur},asetpts=PTS-STARTPTS,asplit=2[vo${i}][sc${i}]`,
      );
      filters.push(
        `[bg${i}][sc${i}]sidechaincompress=threshold=0.02:ratio=6:attack=25:release=260[duck${i}]`,
      );
      filters.push(
        `[duck${i}][vo${i}]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=in:d=0.08,afade=t=out:st=${(dur - 0.22).toFixed(2)}:d=0.22,atrim=duration=${dur},asetpts=PTS-STARTPTS[a${i}]`,
      );
    }

    filters.push(
      `${plan.scenes.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=4:v=1:a=1[vout][aout]`,
    );

    console.log(`[BUILD] Rendering 30s comedy episode for ${charId} -> ${comedy30sMp4}...`);
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
      ...inputs,
      '-filter_complex', filters.join(';'),
      '-map', '[vout]', '-map', '[aout]',
      '-r', '24', '-frames:v', '720', '-t', '30',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart',
      comedy30sMp4,
    ], { timeout: 600000, maxBuffer: 2 * 1024 * 1024 });
  }

  await inspectVideo(comedy30sMp4, 30);

  // Back up the 46s portrait video before replacing public/videos/<id>.mp4 with the 76s merged video
  const backup46sMp4 = `${backup46sDir}/${charId}.mp4`;
  const publicPortraitMp4 = `public/videos/${charId}.mp4`;
  const cached46sMp4 = `.video-generation/portrait-v1/${charId}/comedy-final.mp4`;
  if (!(await exists(backup46sMp4))) {
    if (await exists(cached46sMp4)) {
      await copyFile(cached46sMp4, backup46sMp4);
    } else {
      await copyFile(publicPortraitMp4, backup46sMp4);
    }
  }

  const merged76sMp4 = `${charWorkDir}/merged-76s.mp4`;
  console.log(`[MERGE] Combining 46s portrait + 30s comedy -> 76s unified episode for ${charId}...`);
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', backup46sMp4,
    '-i', comedy30sMp4,
    '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[vout][aout]',
    '-map', '[vout]', '-map', '[aout]',
    '-r', '24', '-frames:v', '1824', '-t', '76',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    merged76sMp4,
  ], { timeout: 600000, maxBuffer: 2 * 1024 * 1024 });

  const meta = await inspectVideo(merged76sMp4, 76);
  await copyFile(merged76sMp4, publicPortraitMp4);

  const checksum = hash(await readFile(publicPortraitMp4));
  portraitManifest[charId] = {
    ...(portraitManifest[charId] || { model: 'veo-3.1-lite-generate-preview' }),
    ...meta,
    sha256: checksum,
    scenes: 10,
    dubbedLanguage: 'ko',
    revision: checksum.slice(0, 12),
  };
  await json(portraitManifestPath, portraitManifest);
  console.log(`[DONE] ${charId}: 76s unified video (${Math.round(meta.bytes / 1024 / 1024 * 10) / 10} MB, rev=${checksum.slice(0, 12)})`);
}

if (await exists('public/videos/comedy')) {
  await rm('public/videos/comedy', { recursive: true, force: true });
}
if (await exists('public/videos/comedy-manifest.json')) {
  await rm('public/videos/comedy-manifest.json', { force: true });
}

const afterSub = await client.user.subscription.get();
console.log(`\n[COMPLETE] All 76s (46s + 30s) unified comedy videos built!`);
console.log(`[BUDGET] Used: ${(afterSub.characterCount - beforeSub.characterCount).toLocaleString()} credits | Remaining: ${(afterSub.characterLimit - afterSub.characterCount).toLocaleString()} / ${afterSub.characterLimit.toLocaleString()}`);

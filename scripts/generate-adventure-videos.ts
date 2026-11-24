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

type MotionStyle =
  | 'hop_zoom'
  | 'puff_boing'
  | 'sky_float'
  | 'share_settle'
  | 'climb_march'
  | 'echo_ripple'
  | 'underwater_sway'
  | 'slide_swoosh'
  | 'pirate_dig';

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
  rano: {
    name: '라노',
    title: '라노의 산속 메아리 놀이',
    location: '산속',
    bgmId: 'mountain_echo_bgm',
    bgmPrompt:
      'Cheerful sunny mountain hiking tune for toddlers, playful wooden flute, acoustic ukulele, light hand percussion, warm outdoorsy adventure feel, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'climb_march',
        sfxId: 'mountain_footsteps_birds',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cute little bouncy dinosaur footsteps on grass with happy morning forest birds chirping, wholesome preschool cartoon foley, no voice, no music',
        voiceLine: '영차! 영차! 드디어 초록 산 정상 도착이다! 크앙~!',
      },
      {
        duration: 8,
        motion: 'echo_ripple',
        sfxId: 'canyon_breeze_chime',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Magical shimmering mountain valley breeze with echoing wooden wind chimes across a sunny canyon, playful cartoon foley, no voice, no music',
        voiceLine: '야~호! 산아 안녕~! 우와, 내 목소리가 메아리로 돌아오네!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'tummy_grumble_giggle',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Funny comical cartoon tummy rumble gurgle followed by a cute bouncy boing and tiny squirrel squeak, toddler cartoon sound effect, no voice, no music',
        voiceLine: '라노 최고! 어라? 꼬르륵~? 아하하, 산이 아니라 내 배 소리구나!',
      },
      {
        duration: 6,
        motion: 'share_settle',
        sfxId: 'plush_landing_tada',
        sfxSeconds: 2.2,
        sfxPrompt:
          'Soft plush cotton pillow bounce landing plop followed by a cheerful warm xylophone sparkle chime, cute preschool cartoon foley, no voice, no music',
        voiceLine: '다람쥐야 도토리 주먹밥 같이 먹자! 다음엔 너랑 야호 하자!',
      },
    ],
  },
  jelly: {
    name: '젤리',
    title: '젤리의 바닷속 방울 파티',
    location: '바닷속',
    bgmId: 'underwater_reef_bgm',
    bgmPrompt:
      'Bright magical underwater coral reef melody for toddlers, sparkling marimba, soft harp arpeggios, gentle tropical calypso bounce, cheerful and dreamy, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'underwater_sway',
        sfxId: 'underwater_splash_bubbles',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle cute water splash followed by cheerful sparkling underwater bubbles rising up, preschool cartoon sound effect, no voice, no music',
        voiceLine: '퐁당! 보글보글 바닷속에 들어왔어! 안녕 물고기 친구들아!',
      },
      {
        duration: 8,
        motion: 'hop_zoom',
        sfxId: 'bubble_pop_chime',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Playful magical soap bubbles popping with twinkling xylophone chimes underwater, cute toddler animation foley, no voice, no music',
        voiceLine: '깡충! 예쁜 하트 방울 퐁퐁! 또 깡충! 반짝 별 방울 퐁퐁!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'octopus_tickle_pop',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Flurry of bubbly underwater blubs ending with one big comical cute bubble boop pop, playful toddler cartoon foley, no voice, no music',
        voiceLine: '우와 방울 파티다! 톡! 에취~! 하하하, 아기 문어야 코 간지러워!',
      },
      {
        duration: 6,
        motion: 'sky_float',
        sfxId: 'carousel_sparkle',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cute playful cartoon hop and magical twinkling fairy chime sparkles at a sunny fairground, toddler animation sound effect, no voice, no music',
        voiceLine: '거북이 등 타고 슝~! 바닷속 친구들 최고야! 또 놀러 올게!',
      },
    ],
  },
  dochi: {
    name: '도치',
    title: '도치의 놀이터 음악회',
    location: '놀이터',
    bgmId: 'playground_band_bgm',
    bgmPrompt:
      'Upbeat sunny playground marching band tune for toddlers, cheerful glockenspiel, toy tambourine, bouncy acoustic guitar and whistle-like woodwinds, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'hop_zoom',
        sfxId: 'swing_rhythm_squeak',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle rhythmic playground swing creak paired with cheerful wooden claves rhythm, cute preschool cartoon foley, no voice, no music',
        voiceLine: '삐걱삐걱~ 슝슝! 햇살 좋은 놀이터 그네가 노래를 부르네!',
      },
      {
        duration: 8,
        motion: 'slide_swoosh',
        sfxId: 'slide_whistle_leaves',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Playful cartoon downward slide whistle followed by soft rustling leaves and cute balloon squeak pops, toddler cartoon foley, no voice, no music',
        voiceLine: '미끄럼틀 슈우웅~! 어라? 내 가시에 풍선이랑 나뭇잎이 줄줄이 붙었어!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'tambourine_jingle_shake',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cheerful rhythmic jingle bells, shaker, and toy tambourine shaking happily in a cute toddler band, no voice, no music',
        voiceLine: '흔들흔들 딸랑딸랑! 우와, 내 몸이 악기가 됐네! 도치 밴드 출발!',
      },
      {
        duration: 6,
        motion: 'share_settle',
        sfxId: 'happy_puppy_applause',
        sfxSeconds: 2.2,
        sfxPrompt:
          'Small group of cute cartoon claps with a happy bird tweet and cheerful chime finale, preschool animation sound effect, no voice, no music',
        voiceLine: '우리 같이 박수 짝짝짝! 놀이터 음악회 대성공! 고마워~!',
      },
    ],
  },
  ggulgguli: {
    name: '꿀꿀이',
    title: '꿀꿀이의 마시멜로 캠핑',
    location: '캠핑장',
    bgmId: 'starry_camp_bgm',
    bgmPrompt:
      'Cozy magical starry night forest camping melody for toddlers, warm fingerpicked acoustic guitar, gentle celesta stars, soft warm bass, peaceful and playful, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'hop_zoom',
        sfxId: 'night_crickets_twinkle',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle cozy evening crickets with magical twinkling star chimes in a peaceful forest campsite, toddler cartoon foley, no voice, no music',
        voiceLine: '우와~ 밤하늘에 별이 반짝반짝! 별 하나, 별 둘, 정말 예쁘다!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'cotton_puff_boing',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Three comical cute cartoon marshmallow puffing inflation pops getting bigger and bigger ending in a funny soft bouncy rubber boing, preschool cartoon foley, no voice, no music',
        voiceLine: '말랑말랑 마시멜로 꺼내볼까? 어? 어어? 대왕 베개만큼 커졌어!',
      },
      {
        duration: 8,
        motion: 'climb_march',
        sfxId: 'pillow_trampoline_boing',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Super soft squishy marshmallow pillow trampoline bounces boing boing with cute airy puffs, playful toddler cartoon foley, no voice, no music',
        voiceLine: '폭신폭신~ 통! 통! 대왕 마시멜로 침대 트램펄린이다! 꺄르르!',
      },
      {
        duration: 6,
        motion: 'share_settle',
        sfxId: 'lullaby_bell_chime',
        sfxSeconds: 2.2,
        sfxPrompt:
          'Soft dreamy music box lullaby chime with gentle firefly sparkles, cozy bedtime toddler cartoon sound effect, no voice, no music',
        voiceLine: '하암~ 폭신해서 잠이 솔솔 와! 잘 자 별님아, 내일 또 놀자!',
      },
    ],
  },
  eumme: {
    name: '음메',
    title: '음메의 열기구 구름 여행',
    location: '하늘 위 열기구',
    bgmId: 'sky_balloon_bgm',
    bgmPrompt:
      'Dreamy uplifting sky voyage waltz for toddlers, airy flute, gentle accordion, harp glissandos, soft pizzicato strings floating among clouds, cheerful instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'sky_float',
        sfxId: 'balloon_lift_breeze',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle warm air whoosh lifting a hot air balloon with a cute little brass bell ding and airy breeze, preschool cartoon foley, no voice, no music',
        voiceLine: '무지개 열기구 출발! 음메~ 둥실둥실 하늘 위로 올라가요!',
      },
      {
        duration: 8,
        motion: 'hop_zoom',
        sfxId: 'carousel_sparkle',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cute playful cartoon hop and magical twinkling fairy chime sparkles at a sunny fairground, toddler animation sound effect, no voice, no music',
        voiceLine: '우와 구름 모양 좀 봐! 저건 토끼 구름! 저건 폭신 하트 구름이야!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'cloud_peekaboo_poof',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Soft fluffy cloud poof followed by a playful cartoon peekaboo chime and tiny sheep bell tinkle, toddler animation foley, no voice, no music',
        voiceLine: '구름이랑 내 양털이랑 똑같네! 나 어디 숨었게~? 까꿍! 여기 음메!',
      },
      {
        duration: 6,
        motion: 'sky_float',
        sfxId: 'sky_float_whoosh',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle dreamy upward floating breeze whoosh with sparkling wind chimes and cute bubbly cartoon float sound, toddler animation, no voice, no music',
        voiceLine: '파랑새야 안녕! 무지개 하늘 여행 정말 신난다! 우리 또 타자!',
      },
    ],
  },
  nurungji: {
    name: '누룽지',
    title: '누룽지의 해적섬 보물찾기',
    location: '해적섬 해변',
    bgmId: 'pirate_island_bgm',
    bgmPrompt:
      'Playful sunny tropical treasure island adventure tune for toddlers, cheerful wooden marimba, bouncy ukulele, light bongos and friendly sea-shanty flute, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'climb_march',
        sfxId: 'ocean_waves_sniff',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Gentle sunny beach ocean wave lap with cute eager puppy sniffing sounds sniff-sniff, wholesome preschool cartoon foley, no voice, no music',
        voiceLine: '킁킁! 저기 야자수 해변에서 고소한 보물 냄새가 난다! 출동!',
      },
      {
        duration: 8,
        motion: 'pirate_dig',
        sfxId: 'sand_dig_sparkle',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Playful fast cartoon paws digging soft beach sand ending with a bright magical treasure chest chime, toddler animation foley, no voice, no music',
        voiceLine: '모래를 파파팍! 우와 찾았다! 반짝반짝 황금 보물 상자다!',
      },
      {
        duration: 8,
        motion: 'puff_boing',
        sfxId: 'nested_boxes_pop',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Three funny ascending cartoon wooden box pop sounds getting higher in pitch pop-pop-pop with a comical question boing, toddler cartoon foley, no voice, no music',
        voiceLine: '열어볼까? 어라 또 상자? 또 작은 상자?! 에잉~ 끝이 없잖아!',
      },
      {
        duration: 6,
        motion: 'share_settle',
        sfxId: 'treasure_fanfare_tada',
        sfxSeconds: 2.2,
        sfxPrompt:
          'Cute cheerful toy trumpet ta-da fanfare with sparkling chimes, happy preschool cartoon celebration sound effect, no voice, no music',
        voiceLine: '짜잔! 바삭 뼈다귀 과자다! 멍멍, 최고의 보물은 친구랑 나눠 먹기!',
      },
    ],
  },
  pingu: {
    name: '핑구',
    title: '핑구의 워터파크 미끄럼 대작전',
    location: '워터파크',
    bgmId: 'waterpark_splash_bgm',
    bgmPrompt:
      'Bouncy sunny toddler waterpark party tune, cheerful steel drums, marimba splashes, playful ukulele and upbeat clapping rhythm, bright summer fun, instrumental only',
    scenes: [
      {
        duration: 8,
        motion: 'climb_march',
        sfxId: 'waddle_steps_water',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cute comical rubbery penguin waddle footsteps plip-plop with gentle sparkling pool water splashes, toddler cartoon foley, no voice, no music',
        voiceLine: '뒤뚱뒤뚱~ 도넛 튜브 끼고 무지개 미끄럼틀 꼭대기 도착!',
      },
      {
        duration: 8,
        motion: 'slide_swoosh',
        sfxId: 'waterslide_whoosh_splash',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Long funny cartoon water slide whoosh whistle ending in a cheerful bubbly water splash, playful preschool animation foley, no voice, no music',
        voiceLine: '배 깔고 슈우웅~! 어어? 너무 미끄러워서 안 멈춰! 계속 미끄러져~!',
      },
      {
        duration: 8,
        motion: 'underwater_sway',
        sfxId: 'rubber_ducks_quack',
        sfxSeconds: 2.5,
        sfxPrompt:
          'Cute squeaky yellow rubber ducks quacking playfully in bobbing pool water, wholesome toddler cartoon sound effect, no voice, no music',
        voiceLine: '퐁당! 노란 오리 인형 친구들이네? 꽥꽥! 오늘부터 나도 오리 할래!',
      },
      {
        duration: 6,
        motion: 'hop_zoom',
        sfxId: 'fountain_spray_giggle',
        sfxSeconds: 2.2,
        sfxPrompt:
          'Refreshing gentle water fountain shower spray with sparkling xylophone chimes, cute toddler summer cartoon foley, no voice, no music',
        voiceLine: '버섯 분수 촤아아~! 아이 시원해! 유하야 우리 같이 물놀이하자!',
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
    zpExpr = `zoompan=z='1.06+0.12*(on/${frames})+0.014*abs(sin(on/4.5))':x='iw/2-(iw/zoom/2)+18*sin(on/16)':y='ih/2-(ih/zoom/2)-22*abs(sin(on/4.5))':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'puff_boing') {
    zpExpr = `zoompan=z='1.05+0.14*(on/${frames})+0.032*exp(-mod(on,42)/10)*sin(mod(on,42)*0.75)':x='iw/2-(iw/zoom/2)+14*sin(on/9)':y='ih/2-(ih/zoom/2)-18*cos(on/7)':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'sky_float') {
    zpExpr = `zoompan=z='1.16-0.05*(on/${frames})+0.01*sin(on/10)':x='iw/2-(iw/zoom/2)+34*sin(on/13)':y='(ih-ih/zoom)*(0.82-0.64*(on/${frames}))':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'climb_march') {
    zpExpr = `zoompan=z='1.10+0.09*(on/${frames})+0.012*abs(sin(on/3.5))':x='iw/2-(iw/zoom/2)+22*sin(on/7)':y='(ih-ih/zoom)*(0.75-0.45*(on/${frames}))-18*abs(sin(on/3.5))':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'echo_ripple') {
    zpExpr = `zoompan=z='1.18-0.10*(on/${frames})+0.018*sin(on/5)':x='iw/2-(iw/zoom/2)+24*sin(on/12)':y='ih/2-(ih/zoom/2)-12*cos(on/8)':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'underwater_sway') {
    zpExpr = `zoompan=z='1.12+0.05*sin(on/20)':x='iw/2-(iw/zoom/2)+42*sin(on/14)':y='ih/2-(ih/zoom/2)+28*cos(on/18)':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'slide_swoosh') {
    zpExpr = `zoompan=z='1.18-0.06*(on/${frames})+0.015*sin(on/6)':x='(iw-iw/zoom)*(0.25+0.50*(on/${frames}))':y='(ih-ih/zoom)*(0.20+0.60*(on/${frames}))':d=${frames}:s=1080x1920:fps=24`;
  } else if (motion === 'pirate_dig') {
    zpExpr = `zoompan=z='1.07+0.13*(on/${frames})+0.022*abs(sin(on/2.8))':x='iw/2-(iw/zoom/2)+16*sin(on/4.2)':y='ih/2-(ih/zoom/2)+20*abs(cos(on/2.8))':d=${frames}:s=1080x1920:fps=24`;
  } else {
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
      `[${sfxIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.62,adelay=140|140,apad=whole_dur=${d},atrim=duration=${d},asetpts=PTS-STARTPTS[sfx${i}]`,
    );
    filters.push(
      `[${voIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=420|420,apad=whole_dur=${d},atrim=duration=${d},asetpts=PTS-STARTPTS[vo${i}]`,
    );
  }

  const bgmIdx = plan.scenes.length * 3;
  inputs.push('-i', bgmPath);

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
    `[${bgmIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=${totalDuration},atrim=duration=${totalDuration},asetpts=PTS-STARTPTS,volume=0.28,afade=t=in:d=0.4,afade=t=out:st=${(totalDuration - 0.8).toFixed(2)}:d=0.8[bgm_bed]`,
  );
  filters.push(
    `[bgm_bed][sfx_all]amix=inputs=2:duration=first:normalize=0,atrim=duration=${totalDuration},asetpts=PTS-STARTPTS[bed_mix]`,
  );
  filters.push(
    `[bed_mix][vo_sc]sidechaincompress=threshold=0.018:ratio=6:attack=25:release=280[bed_ducked]`,
  );
  filters.push(
    `[bed_ducked][vo_all]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95,afade=t=in:d=0.08,afade=t=out:st=${(totalDuration - 0.3).toFixed(2)}:d=0.3,atrim=duration=${totalDuration},asetpts=PTS-STARTPTS[aout]`,
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

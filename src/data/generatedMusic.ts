/** Original instrumental tracks generated once with ElevenLabs; playback is free. */
export const GENERATED_MUSIC = [
  { id: 'jelly-picnic', name: '젤리의 통통 소풍', scene: 'play', seconds: 30,
    prompt: 'Original instrumental background loop for a delightful preschool picture-book game. Warm wooden marimba, soft pizzicato strings, tiny glockenspiel accents, cozy upright bass. 96 BPM, simple cheerful pentatonic melody, airy arrangement, bouncy and curious, gentle dynamics, no vocals, no startling impacts. Soft beginning and graceful ending.' },
  { id: 'pingu-sea', name: '핑구의 반짝 바다', scene: 'play', seconds: 30,
    prompt: 'Original instrumental underwater playground music for toddlers. Playful soft flute, muted kalimba, round plucked bass and delicate bubble-like bell accents. 84 BPM, sweet lilting pentatonic phrases, curious little penguin swimming with friends, spacious and warm, no vocals, no harsh percussion or dramatic tension. Gentle beginning and ending.' },
  { id: 'friends-parade', name: '친구들의 발걸음', scene: 'play', seconds: 30,
    prompt: 'Original charming instrumental preschool animal parade. Tiny ukulele, warm pizzicato cello, toy piano and very soft brushed shaker. 102 BPM, playful call and response melody, cheerful rounded sounds and light skipping rhythm. Calm enough under spoken guidance, no vocals, no loud drums, no suspense. Natural soft beginning and ending.' },
  { id: 'star-lullaby', name: '별빛 포근 자장가', scene: 'sleep', seconds: 40,
    prompt: 'Original tender instrumental bedtime lullaby for a three-year-old. Delicate felt piano and warm music box, soft celesta stars, almost silent warm sustained strings. 58 BPM, slow reassuring simple melody with breathing space, no drums, no vocals, no sudden sounds, no emotional tension. Very gentle fade into quiet at the end.' },
] as const;
export const generatedMusicUrl = (id: string) => `/audio/elevenlabs/${id}.mp3`;

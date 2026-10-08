import type { CharacterId } from '../types';

// Keep provider choices, character direction and offline playback in one place.
// ElevenLabs' catalogue describes Jessica and Laura as young adult female voices;
// they are gentle fallbacks, not recordings of children. Gemini supports age/style direction.
export const CHARACTER_VOICE_REVISION = 'youthful-2026-10-08';
const JESSICA = 'cgSgspJ2msm6clMCkdW9';
const LAURA = 'FGY2WhTYpPnrIDTdsKH5';
const childStyle = (delivery: string) => `Speak natural Korean as a young child character in an animated picture book. Use a light, youthful, high-register voice with small, soft resonance and clear words. ${delivery} Speak gently to a preschool playmate, at a relaxed pace and steady comfortable volume. Avoid adult-sounding bass, gravel, growls, shouting, breathy adult narration, shrill squeaks and exaggerated baby talk.`;

export const CHARACTER_VOICES = {
  ggomi: { name: '꼬미', emoji: '🐻', voice: 'Leda', elevenVoiceId: JESSICA, tone: '포근하고 앳된 꼬마 목소리', style: childStyle('A kind little bear with a soft smile and reassuring, lilting phrases.'), browserPitch: 1.24, fallbackPlaybackRate: 1.10, rate: .90 },
  rano: { name: '라노', emoji: '🦖', voice: 'Autonoe', elevenVoiceId: LAURA, tone: '씩씩하고 밝은 꼬마 목소리', style: childStyle('A playful little dinosaur with bright curiosity and tiny bouncy inflections. Express bravery softly; never roar.'), browserPitch: 1.22, fallbackPlaybackRate: 1.08, rate: .94 },
  jelly: { name: '젤리', emoji: '🐰', voice: 'Leda', elevenVoiceId: JESSICA, tone: '맑고 발랄한 꼬마 목소리', style: childStyle('A sweet little bunny with light, bell-like vowels and a happy, skipping rhythm.'), browserPitch: 1.30, fallbackPlaybackRate: 1.14, rate: .93 },
  dochi: { name: '도치', emoji: '🦔', voice: 'Aoede', elevenVoiceId: JESSICA, tone: '호기심 가득한 앳된 목소리', style: childStyle('A curious little hedgehog, with gentle upward question inflections and small delighted discoveries.'), browserPitch: 1.23, fallbackPlaybackRate: 1.10, rate: .89 },
  ggulgguli: { name: '꿀꿀이', emoji: '🐷', voice: 'Autonoe', elevenVoiceId: LAURA, tone: '장난스럽고 귀여운 꼬마 목소리', style: childStyle('A cheerful little pig with round, playful vowels and a smiling giggle in the voice, without loud squeals.'), browserPitch: 1.27, fallbackPlaybackRate: 1.12, rate: .92 },
  eumme: { name: '음메', emoji: '🐑', voice: 'Leda', elevenVoiceId: JESSICA, tone: '조곤조곤 부드러운 꼬마 목소리', style: childStyle('A tender little lamb with soft, soothing phrases. Keep the small youthful voice even when sleepy.'), browserPitch: 1.22, fallbackPlaybackRate: 1.08, rate: .87 },
  nurungji: { name: '누룽지', emoji: '🐶', voice: 'Aoede', elevenVoiceId: LAURA, tone: '명랑하고 앳된 꼬마 목소리', style: childStyle('A happy little puppy with short, lightly bouncing phrases and friendly enthusiasm. Never bark loudly.'), browserPitch: 1.25, fallbackPlaybackRate: 1.10, rate: .94 },
  pingu: { name: '핑구', emoji: '🐧', voice: 'Zephyr', elevenVoiceId: JESSICA, tone: '통통 튀는 맑은 꼬마 목소리', style: childStyle('A tiny penguin with a clear, rounded, sweet voice and gentle waddling rhythm.'), browserPitch: 1.28, fallbackPlaybackRate: 1.12, rate: .90 },
} as const satisfies Record<CharacterId, { name: string; emoji: string; voice: string; elevenVoiceId: string; tone: string; style: string; browserPitch: number; fallbackPlaybackRate: number; rate: number }>;

export type CharacterVoiceId = keyof typeof CHARACTER_VOICES;
export function getCharacterVoice(id: string) {
  return CHARACTER_VOICES[id as CharacterVoiceId] || CHARACTER_VOICES.ggomi;
}

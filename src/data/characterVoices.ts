export const CHARACTER_VOICES = {
  ggomi: { name: '꼬미', emoji: '🐻', voice: 'Sulafat', elevenVoiceId: 'cgSgspJ2msm6clMCkdW9', tone: '포근하고 다정한 목소리', style: 'Speak natural Korean in a warm, gentle, affectionate character voice for a young child. Smile softly while speaking. Keep the words clear and unhurried.' },
  rano: { name: '라노', emoji: '🦖', voice: 'Puck', elevenVoiceId: 'TX3LPaxmHKxFdv7VOQHJ', tone: '씩씩하고 신나는 목소리', style: 'Speak natural Korean as a brave, playful dinosaur friend. Sound upbeat and excited, with a clear and comfortable pace for a young child.' },
  jelly: { name: '젤리', emoji: '🐰', voice: 'Leda', elevenVoiceId: 'FGY2WhTYpPnrIDTdsKH5', tone: '밝고 발랄한 목소리', style: 'Speak natural Korean as a sweet, lively rabbit friend. Sound youthful and cheerful without squeaking or sounding artificial. Pronounce every word clearly.' },
  dochi: { name: '도치', emoji: '🦔', voice: 'Achird', elevenVoiceId: 'EXAVITQu4vr4xnSDxMaL', tone: '호기심 많은 목소리', style: 'Speak natural Korean as a curious and friendly little hedgehog. Sound playful and kind, with gentle wonder and clear pronunciation.' },
  ggulgguli: { name: '꿀꿀이', emoji: '🐷', voice: 'Fenrir', elevenVoiceId: 'N2lVS1w4EtoT3dr4eOWO', tone: '장난기 가득한 목소리', style: 'Speak natural Korean as a funny, energetic pig friend. Sound delighted and expressive, but keep a comfortable volume and clear words for a young child.' },
  eumme: { name: '음메', emoji: '🐑', voice: 'Achernar', elevenVoiceId: 'SAz9YHcvj6GT2YYXdXww', tone: '부드럽고 차분한 목소리', style: 'Speak natural Korean as a calm, caring sheep friend. Sound soft, reassuring and lightly playful. Speak slowly enough for a young child to follow.' },
  nurungji: { name: '누룽지', emoji: '🐶', voice: 'Laomedeia', elevenVoiceId: 'bIHbv24MWmeRgasZH58o', tone: '명랑하고 친근한 목소리', style: 'Speak natural Korean as a friendly, happy puppy. Sound bright, bouncy and sincere, with clear pronunciation and a natural human rhythm.' },
} as const;

export type CharacterVoiceId = keyof typeof CHARACTER_VOICES;

export function getCharacterVoice(id: string) {
  return CHARACTER_VOICES[id as CharacterVoiceId] || CHARACTER_VOICES.ggomi;
}


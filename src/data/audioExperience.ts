export interface IncludedAudioBudget {
  tier?: string;
  eligible: boolean;
  remaining: number;
  limit: number;
  resetsAt: number | null;
  reason: 'ready' | 'exhausted' | 'plan_not_supported' | 'overage_enabled' | 'unavailable';
}

export interface CharacterAudioStatus {
  available: boolean;
  engine: 'elevenlabs' | 'gemini' | 'none';
  elevenLabs?: IncludedAudioBudget;
}

// Short, authored effects only. Never turn arbitrary client prompts into billable audio.
export const PLAY_EFFECTS = {
  tap: { seconds: .5, volume: .23, prompt: 'One adorable soft jelly button plop, tiny round rubber toy, bright and bouncy, clean close sound, no voice, no music, no harsh clicks.' },
  bounce: { seconds: .7, volume: .20, prompt: 'One cute tiny spring toy boing, soft rounded elastic bounce, happy preschool cartoon, no voices, no music, never loud or sharp.' },
  pop: { seconds: .5, volume: .20, prompt: 'One gentle colorful balloon pop, soft bubbly plop with a tiny sparkle tail, playful and safe sounding, no loud bang, no voice, no music.' },
  bubble: { seconds: .5, volume: .18, prompt: 'One tiny iridescent soap bubble popping, delicate watery bloop and glassy glimmer, soft and charming, no voice, no music.' },
  sparkle: { seconds: 1, volume: .16, prompt: 'A brief magical shower of three delicate fairy bell sparkles, warm tiny chimes rising happily, gentle preschool game reward, no voice, no percussion.' },
  success: { seconds: 1.5, volume: .20, prompt: 'A very short adorable toy marimba and little bell celebration, three happy rising notes, warm gentle preschool game success, no shouting, no vocals, no loud drums.' },
} as const;
export type PlayEffectId = keyof typeof PLAY_EFFECTS;
export const PLAY_EFFECT_REVISION = 'eleven-play-v1';

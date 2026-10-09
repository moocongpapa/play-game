import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { IncludedAudioBudget } from '../data/audioExperience';
import { PLAY_EFFECTS, type PlayEffectId } from '../data/audioExperience';
import { getCharacterVoice } from '../data/characterVoices';

// Never retry a generation automatically: an interrupted request may already be charged.
const clientFor = (apiKey: string) => new ElevenLabsClient({ apiKey, maxRetries: 0, timeoutInSeconds: 14, fetch: globalThis.fetch });
export async function getIncludedAudioBudget(apiKey: string): Promise<IncludedAudioBudget> {
  try {
    const plan = await clientFor(apiKey).user.subscription.get({ timeoutInSeconds: 4 });
    const supported = ['free', 'starter'].includes(plan.tier);
    const noOverage = plan.canExtendCharacterLimit === false && plan.allowedToExtendCharacterLimit === false && plan.maxCreditLimitExtension === 0;
    const eligible = supported && noOverage;
    const valid = Number.isFinite(plan.characterCount) && plan.characterCount >= 0 && Number.isFinite(plan.characterLimit) && plan.characterLimit > 0;
    if (!valid) throw new Error('Invalid subscription limits');
    const limit = plan.characterLimit;
    const remaining = Math.max(0, limit - plan.characterCount);
    return { tier: plan.tier, eligible, remaining, limit, resetsAt: plan.nextCharacterCountResetUnix || null,
      reason: !supported ? 'plan_not_supported' : !noOverage ? 'overage_enabled' : remaining === 0 ? 'exhausted' : 'ready' };
  } catch {
    return { eligible: false, remaining: 0, limit: 0, resetsAt: null, reason: 'unavailable' };
  }
}

export class AudioBudgetError extends Error {
  constructor(public budget: IncludedAudioBudget) { super('Included audio allowance unavailable'); }
}

/** Recheck the provider's account-wide hard cap immediately before every generation. */
export async function generateElevenAudio(apiKey: string, input: { text: string; characterId: string } | { effectId: PlayEffectId }): Promise<ArrayBuffer> {
  const effect = 'effectId' in input ? PLAY_EFFECTS[input.effectId] : undefined;
  // Multilingual v2 uses one credit per character; explicit-duration SFX use 40/s.
  const needed = effect ? Math.ceil(effect.seconds * 40) : (input as { text: string }).text.length;
  const budget = await getIncludedAudioBudget(apiKey);
  if (!budget.eligible || budget.remaining < needed) throw new AudioBudgetError(budget);
  const client = clientFor(apiKey);
  const abortSignal = AbortSignal.timeout(14000);
  let stream: ReadableStream<Uint8Array>;
  if ('effectId' in input) {
    const spec = PLAY_EFFECTS[input.effectId];
    stream = await client.textToSoundEffects.convert({ text: spec.prompt, durationSeconds: spec.seconds,
      modelId: 'eleven_text_to_sound_v2', promptInfluence: .65, outputFormat: 'mp3_44100_128' }, { abortSignal });
  } else {
    const voice = getCharacterVoice(input.characterId);
    stream = await client.textToSpeech.convert(voice.elevenVoiceId, {
      text: input.text, modelId: 'eleven_multilingual_v2', outputFormat: 'mp3_44100_128',
      voiceSettings: { stability: .42, similarityBoost: .78, style: .3, speed: voice.rate, useSpeakerBoost: false },
    }, { abortSignal });
  }
  const audio = await new Response(stream).arrayBuffer();
  if (audio.byteLength <= 100 || audio.byteLength > 2 * 1024 * 1024) throw new Error('Invalid generated audio size');
  return audio;
}

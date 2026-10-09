import { getCharacterVoice } from './characterVoices';
import type { SpeechLanguage } from '../types';

export const SPEECH_MODEL = 'eleven_multilingual_v2';
export const SPEECH_FORMAT = 'mp3_44100_128';
export const normalizeSpokenText = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim();
export function speechSynthesisSpec(characterId: string) {
  const voice = getCharacterVoice(characterId);
  return { voiceId: voice.elevenVoiceId, modelId: SPEECH_MODEL, outputFormat: SPEECH_FORMAT,
    voiceSettings: { stability: .42, similarityBoost: .78, style: .3, speed: voice.rate, useSpeakerBoost: false } } as const;
}

/** Equal provider requests share a file. Character-specific playback pitch is applied later. */
export const speechSynthesisKey = (text: string, characterId: string, language: SpeechLanguage) =>
  JSON.stringify({ ...speechSynthesisSpec(characterId), language, text: normalizeSpokenText(text) });

export async function speechAssetId(text: string, characterId: string, language: SpeechLanguage) {
  const identity = speechSynthesisKey(text, characterId, language);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

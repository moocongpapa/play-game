import { GENERATED_SPEECH_FILES, GENERATED_SPEECH_REQUESTS } from '../data/generatedSpeechManifest';
import { speechSynthesisKey } from '../data/speechSynthesis';
import type { SpeechLanguage } from '../types';

export const hasBundledSpeech = (id: string) => GENERATED_SPEECH_FILES.has(id);
// Exact request lookup also works on local HTTP/LAN connections without Web Crypto.
export const bundledSpeechId = (text: string, characterId: string, language: SpeechLanguage) =>
  GENERATED_SPEECH_REQUESTS[speechSynthesisKey(text, characterId, language)];
export const bundledSpeechUrl = (id: string) => `/audio/elevenlabs/speech/${id}.mp3`;

/** A missing shipped file must fall back locally, never trigger a paid duplicate. */
export async function loadBundledSpeech(id: string, signal: AbortSignal) {
  const response = await fetch(bundledSpeechUrl(id), { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) });
  if (!response.ok) throw new Error('Saved character voice unavailable');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength < 100 || bytes.byteLength > 2 * 1024 * 1024) throw new Error('Invalid saved character voice');
  return bytes;
}

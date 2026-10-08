import { SPEECH_ENGLISH } from '../data/speechEnglish';
import { FRIEND_SPEECH_ENGLISH } from '../data/speechFriendsEnglish';
import { SPEECH_WORDS } from '../data/speechWords';

import type { SpeechLanguage } from '../types';
export type { SpeechLanguage } from '../types';
export const DEFAULT_SPEECH_LANGUAGE: SpeechLanguage = 'en';
export function normalizeSpeechLanguage(value: unknown): SpeechLanguage {
  return value === 'ko' ? 'ko' : DEFAULT_SPEECH_LANGUAGE;
}

// Strip decorative emoji and normalize pauses, but keep meaningful Korean letters.
const normalize = (text: string) => text.replace(/\p{Extended_Pictographic}|[\uFE0F\u200D]/gu, '').replace(/[#*`_]/g, '').replace(/\s+/g, ' ').trim();
const stripPause = (text: string) => text.replace(/[.!?,~]+$/g, '').trim();
const korean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
const phrases = [...SPEECH_ENGLISH, ...FRIEND_SPEECH_ENGLISH];
const exact = new Map(phrases.filter(([ko]) => !/\{\d+\}/.test(ko)).map(([ko, en]) => [normalize(ko), en]));
const words = new Map(Object.entries(SPEECH_WORDS).map(([ko, en]) => [normalize(ko), en]));
const templates = phrases.filter(([ko]) => /\{\d+\}/.test(ko)).map(([ko, en]) => {
  const parts = normalize(ko).split(/(\{\d+\})/).filter(Boolean);
  const pattern = parts.map(part => {
    if (/^\{\d+\}$/.test(part)) return '(.*?)';
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return { matcher: new RegExp(`^${pattern}$`), parts, en, weight: ko.replace(/\{\d+\}/g, '').length };
}).sort((a, b) => b.weight - a.weight);

/** Names are pronounced in English; free-form names are never sent to a translator. */
export function pronounceName(name: string): string {
  if (words.has(name)) return words.get(name)!;
  const initials = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const vowels = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const endings = ['','k','k','k','n','n','n','t','l','k','m','l','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];
  return [...name].map(letter => { const n = letter.charCodeAt(0) - 0xac00; return n < 0 || n >= 11172 ? letter : initials[Math.floor(n / 588)] + vowels[Math.floor(n % 588 / 28)] + endings[n % 28]; }).join('');
}

/** Returns null for missing authored copy; tests audit game dialogue against this boundary. */
export function translateSpeech(text: string, childName = '유하', depth = 0): string | null {
  const clean = normalize(text);
  if (!korean.test(clean)) return clean;
  if (clean === childName) return pronounceName(childName);
  const known = exact.get(clean) ?? words.get(clean) ?? words.get(stripPause(clean));
  if (known !== undefined) return known;
  if (depth > 6) return null;
  for (const template of templates) {
    if (!template.matcher.test(clean)) continue;
    const translated = new Map<number, string>();
    // A slot can contain spaces or punctuation (a full story, or "strawberry cake").
    // Try each literal boundary until every captured phrase has an authored translation.
    function resolve(partIndex: number, position: number): boolean {
      if (partIndex === template.parts.length) return position === clean.length;
      const part = template.parts[partIndex];
      if (!/^\{\d+\}$/.test(part)) return clean.startsWith(part, position) && resolve(partIndex + 1, position + part.length);
      const slot = Number(part.slice(1, -1));
      const next = template.parts[partIndex + 1];
      let end = next === undefined ? clean.length : clean.indexOf(next, position);
      while (end >= position) {
        const value = template.en.includes(part) ? translateSpeech(clean.slice(position, end), childName, depth + 1) : '';
        if (value !== null) {
          translated.set(slot, value);
          if (resolve(partIndex + 1, end)) return true;
        }
        if (next === undefined) break;
        end = clean.indexOf(next, end + 1);
      }
      return false;
    }
    if (resolve(0, 0)) return template.en.replace(/\{(\d+)\}/g, (_, id: string) => translated.get(Number(id)) || '');
  }
  return null;
}

export function localizeSpeech(text: string, language: SpeechLanguage, childName = '유하'): string {
  if (language === 'ko') return text;
  // Never unexpectedly read Korean in English mode if a future game adds untranslated copy.
  return translateSpeech(text, childName) ?? 'Let us try it together!';
}

export function chooseSpeechVoice<T extends { lang: string; name: string; default?: boolean }>(voices: T[], language: SpeechLanguage): T | null {
  // SpeechSynthesis exposes no age/gender metadata. Prefer identifiable child / light
  // female voices and exclude known adult male defaults, even if marked "Natural".
  const adultMale = /\b(male|david|mark|george|daniel|alex|fred|bruce|ralph|james|guy|ryan|christopher|eric|roger|andrew|brian|thomas|tony|jason|injoon|bongjin|gookmin|hyunsu)\b|인준|봉진|국민|현수|남성|남자/i;
  const matching = voices.filter(voice => voice.lang.toLowerCase().startsWith(language) && !adultMale.test(voice.name));
  const score = (voice: T) => {
    const child = /\b(Ana|Maisie)(Neural)?\b/i.test(voice.name) ? 1000 : 0;
    const lightFemale = /\b(female|Samantha|Victoria|Karen|Moira|Tessa|Fiona|Zira|Jenny|Aria|Sara|Michelle|Emma|Ava|Libby|Sonia|Holly)\b|SunHi|선희|Yuna|유나|Heami|혜미|Hyeryun|kof/i.test(voice.name) ? 100 : 0;
    const natural = /natural|neural|premium|enhanced|siri/i.test(voice.name) ? 20 : 0;
    const familiarKorean = language === 'ko' && /SunHi|선희|Yuna|유나|Heami|혜미|Hyeryun|kof/i.test(voice.name) ? 15 : 0;
    const locale = voice.lang.toLowerCase() === (language === 'en' ? 'en-us' : 'ko-kr') ? 5 : 0;
    const nonLegacy = /google|구글/i.test(voice.name) ? 0 : 2;
    return child + lightFemale + natural + familiarKorean + locale + nonLegacy + (voice.default ? 1 : 0);
  };
  return matching.reduce<T | null>((best, voice) => !best || score(voice) > score(best) ? voice : best, null);
}

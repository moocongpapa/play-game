import { readdir, readFile } from 'node:fs/promises';
import ts from 'typescript';
import { CHARACTER_LIST } from '../src/data/characters';
import { CHARACTER_GREETINGS } from '../src/data/characterGreetings';
import { PARK_ACTIONS, PARK_GUIDE } from '../src/data/characterPark';
import { normalizeSpokenText, speechAssetId } from '../src/data/speechSynthesis';
import { localizeSpeech } from '../src/utils/speechLanguage';
import type { CharacterId, SpeechLanguage } from '../src/types';

export interface SpeechAssetJob { id: string; text: string; language: SpeechLanguage; characters: CharacterId[] }

/** Extract only spoken literals/constant guides, never execute game components. */
export async function buildSpeechLibrary() {
  const common = new Set<string>([PARK_GUIDE, ...Object.values(PARK_ACTIONS).map(action => action.speech),
    '어떤 게임 해볼까? 하고 싶은 그림을 눌러봐!', '다른 친구랑도 놀아볼까?', '유하야, 같이 놀 친구를 골라줘!',
    '누구 소리일까요?', '쓰담쓰담, 포근해!', '간질간질! 헤헤!', '짝! 하이파이브!',
  ]);
  const guides = new Set<string>();
  const directory = 'src/screens/games';
  for (const file of (await readdir(directory)).filter(name => name.endsWith('.tsx')).sort()) {
    const source = ts.createSourceFile(file, await readFile(`${directory}/${file}`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const constants = new Map<string, string>();
    const literal = (node: ts.Node | undefined) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
    function collectConstants(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        const text = literal(node.initializer);
        if (text) constants.set(node.name.text, text);
      }
      ts.forEachChild(node, collectConstants);
    }
    collectConstants(source);
    function collectSpeech(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        const isGuide = ['useToddlerPlay', 'useDevelopmentRound'].includes(name);
        const argument = node.arguments[isGuide ? 1 : 0];
        if (isGuide || ['speakText', 'finish', 'praise'].includes(name)) {
          const text = literal(argument) || (argument && ts.isIdentifier(argument) ? constants.get(argument.text) : undefined);
          if (text && /[가-힣]/.test(text) && text.length <= 300 && !/시간/.test(text)) {
            common.add(text);
            if (isGuide) guides.add(text);
          }
        }
      }
      ts.forEachChild(node, collectSpeech);
    }
    collectSpeech(source);
  }
  const jobs = new Map<string, SpeechAssetJob>();
  const add = async (text: string, characterId: CharacterId, language: SpeechLanguage) => {
    const localized = normalizeSpokenText(localizeSpeech(text, language));
    if (language === 'en' && localized === 'Let us try it together!') throw new Error(`Missing authored English: ${text}`);
    const id = await speechAssetId(localized, characterId, language);
    const previous = jobs.get(id);
    if (previous) { if (!previous.characters.includes(characterId)) previous.characters.push(characterId); }
    else jobs.set(id, { id, text: localized, language, characters: [characterId] });
  };
  // Korean is the default. English includes every developmental game's main
  // guide, menu guidance and core feedback, without generating unused variants.
  const english = new Set([...guides, '어떤 게임 해볼까? 하고 싶은 그림을 눌러봐!', '다른 친구랑도 놀아볼까?',
    '정답이에요! 참 잘했어요!', '다시 한번 생각해보아요!', '누구 소리일까요?',
    '그림을 잡아서 똑같은 그림자 위에 쏙 올려 주세요!', '하늘로 떠오르는 알록달록 풍선을 팡팡 터뜨려보자!']);
  for (const friend of CHARACTER_LIST) {
    for (const text of common) await add(text, friend.id, 'ko');
    for (const text of english) await add(text, friend.id, 'en');
    for (const language of ['ko', 'en'] as const) for (const text of [
      `유하야, ${friend.name}랑 같이 놀자! 어떤 게임 해볼까? 그림을 눌러봐.`,
      `유하야, ${friend.name}야! ${CHARACTER_GREETINGS[friend.id].message}`,
      `유하야, 안녕! 나는 ${friend.name}야. 우리 같이 신나게 놀자!`,
      ...friend.praise.map(line => line.replaceAll('{name}', '유하')),
    ]) await add(text, friend.id, language);
  }
  return [...jobs.values()];
}

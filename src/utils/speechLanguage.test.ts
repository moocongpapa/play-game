import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import * as gameData from '../data/gameData';
import { CHARACTERS } from '../data/characters';
import { CHARACTER_GREETINGS } from '../data/characterGreetings';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import { FOOD_REACTIONS } from '../data/foodReactions';
import { HABITAT_FRIENDS } from '../data/habitatFriends';
import { EMOTION_SCENES } from '../data/playThemes';
import { chooseSpeechVoice, localizeSpeech, normalizeSpeechLanguage, translateSpeech } from './speechLanguage';

test('fresh, legacy and invalid preferences default to English; Korean remains selectable', () => {
  for (const value of [undefined, null, '', 'en', 'fr', 2]) assert.equal(normalizeSpeechLanguage(value), 'en');
  assert.equal(normalizeSpeechLanguage('ko'), 'ko');
  assert.equal(localizeSpeech('안녕! 나는 핑구야!', 'ko'), '안녕! 나는 핑구야!');
  assert.equal(localizeSpeech('하나', 'en'), 'one');
  assert.equal(localizeSpeech('음메', 'en'), 'Eumme');
  assert.equal(localizeSpeech('음메~', 'en'), 'moo');
  assert.equal(localizeSpeech('민서야, 같이 놀 친구를 골라줘!', 'en', '민서'), 'minseo, choose a friend to play with!');
  assert.equal(localizeSpeech('Hello, friend!', 'en'), 'Hello, friend!');
});

function assertEnglish(text: string) {
  const english = translateSpeech(text.replaceAll('{name}', '유하'));
  assert.notEqual(english, null, `Missing English speech: ${text}`);
  assert.doesNotMatch(english!, /[가-힣ㄱ-ㅎㅏ-ㅣ]/, text);
}

test('all age groups have English object names, hints, letters and verbal sound clues', () => {
  const spokenKeys = new Set(['koreanName', 'name', 'colorName', 'shape', 'letter', 'word', 'letters', 'soundText', 'hint', 'expression', 'example']);
  let checked = 0;
  function walk(value: unknown, key = '') {
    if (typeof value === 'string' && spokenKeys.has(key)) { assertEnglish(value); checked++; }
    else if (Array.isArray(value)) value.forEach(item => walk(item, key));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, item]) => walk(item, k));
  }
  walk(gameData);
  assert.ok(checked > 1000);
  for (const group of Object.values(gameData.SOUND_ITEMS_BY_AGE)) {
    for (const item of group) assertEnglish(`${item.soundText} 누구 소리일까요?`);
  }
});

test('all characters, video scenes, food reactions and habitat introductions have English dialogue', () => {
  for (const character of Object.values(CHARACTERS)) {
    [character.greeting, character.greetingTemplate, ...character.praise].forEach(assertEnglish);
    assertEnglish(`유하야, 안녕! 나는 ${character.name}야. 우리 같이 신나게 놀자!`);
  }
  Object.values(CHARACTER_GREETINGS).forEach(greeting => assertEnglish(greeting.message));
  Object.values(CHARACTER_VIDEOS).forEach(video => video.scenes.forEach(scene => assertEnglish(scene.voiceText)));
  Object.values(FOOD_REACTIONS).forEach(food => assertEnglish(`${food.word} 사과, 맛있다!`));
  Object.values(HABITAT_FRIENDS).flat().forEach(friend => assertEnglish(`${friend.name}! ${friend.greeting}`));
  Object.values(EMOTION_SCENES).flat().forEach(scene => assertEnglish(`${scene.text} 기뻐요 표정을 골라보세요!`));
  assert.equal(translateSpeech('우와! 정답이에요! 딸기 케이크 3개! 냠냠 참 맛있다!'), 'Yes! 3 pieces of strawberry cake! Yum, yum!');
});

test('spoken literals and direction templates in game screens have authored English copy', () => {
  let checked = 0;
  const src = new URL('../', import.meta.url).pathname;
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) { scan(file); continue; }
      if (!/\.tsx?$/.test(file) || /\.test\.|speechEnglish|speechFriendsEnglish|speechWords/.test(file)) continue;
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      function visit(node: ts.Node) {
        let text: string | undefined;
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
        if (ts.isTemplateExpression(node)) text = node.head.text + node.templateSpans.map(span => 'Sample' + span.literal.text).join('');
        const context = node.parent?.getText(source) || '';
        if (text && /[가-힣]/.test(text) && (/speakText\(|finish\(|praise\(|triggerStageClear\(|GUIDE\s*=|guide\s*=|prompt\s*=|promptText\s*=|audioMsg\s*=|entranceVoice\s*=|msg\s*=/.test(context) || (/playThemes\.ts$/.test(file) && /^text:/.test(context)))) {
          assertEnglish(text); checked++;
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  scan(src);
  assert.ok(checked > 150);
});

test('browser voice selection stays in the selected language, including late-loaded voices', () => {
  const voices = [{ lang: 'ko-KR', name: 'Korean natural', default: true }, { lang: 'en-US', name: 'English' }, { lang: 'en-US', name: 'English enhanced' }];
  assert.equal(chooseSpeechVoice(voices, 'en'), voices[2]);
  assert.equal(chooseSpeechVoice(voices, 'ko'), voices[0]);
  assert.equal(chooseSpeechVoice(voices.slice(0, 1), 'en'), null);
  assert.equal(chooseSpeechVoice([], 'ko'), null);
  assert.equal(chooseSpeechVoice([{ lang: 'ko-KR', name: 'Google Korean', default: true }, { lang: 'ko-KR', name: 'Yuna' }], 'ko')?.name, 'Yuna');
});

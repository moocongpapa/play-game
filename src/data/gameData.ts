import { QuizItem } from '../types';

export const OBJECT_ITEMS: QuizItem[] = [
  { id: 'apple', name: '사과', koreanName: '사과', category: 'fruit', emoji: '🍎', color: '#FF5252' },
  { id: 'banana', name: '바나나', koreanName: '바나나', category: 'fruit', emoji: '🍌', color: '#FFEE58' },
  { id: 'strawberry', name: '딸기', koreanName: '딸기', category: 'fruit', emoji: '🍓', color: '#FF4081' },
  { id: 'watermelon', name: '수박', koreanName: '수박', category: 'fruit', emoji: '🍉', color: '#66BB6A' },
  { id: 'grape', name: '포도', koreanName: '포도', category: 'fruit', emoji: '🍇', color: '#AB47BC' },
  { id: 'bus', name: '버스', koreanName: '버스', category: 'vehicle', emoji: '🚌', color: '#FFA726' },
  { id: 'car', name: '자동차', koreanName: '자동차', category: 'vehicle', emoji: '🚗', color: '#42A5F5' },
  { id: 'airplane', name: '비행기', koreanName: '비행기', category: 'vehicle', emoji: '✈️', color: '#26C6DA' },
  { id: 'cat', name: '고양이', koreanName: '고양이', category: 'animal', emoji: '🐱', color: '#FFB74D' },
  { id: 'dog', name: '강아지', koreanName: '강아지', category: 'animal', emoji: '🐶', color: '#FFA000' },
  { id: 'rabbit', name: '토끼', koreanName: '토끼', category: 'animal', emoji: '🐰', color: '#EC407A' },
  { id: 'bear', name: '곰', koreanName: '곰', category: 'animal', emoji: '🐻', color: '#8D6E63' },
];

export const SHAPE_COLOR_ITEMS = [
  { id: 'red_circle', shape: '동그라미', colorName: '빨간색', color: '#FF5252', emoji: '🔴', path: 'circle' },
  { id: 'blue_square', shape: '네모', colorName: '파란색', color: '#42A5F5', emoji: '🟦', path: 'square' },
  { id: 'yellow_triangle', shape: '세모', colorName: '노란색', color: '#FFCA28', emoji: '🟡', path: 'triangle' },
  { id: 'green_star', shape: '별', colorName: '초록색', color: '#66BB6A', emoji: '⭐', path: 'star' },
  { id: 'pink_heart', shape: '하트', colorName: '분홍색', color: '#FF4081', emoji: '💖', path: 'heart' },
  { id: 'purple_diamond', shape: '다이아몬드', colorName: '보라색', color: '#AB47BC', emoji: '🔷', path: 'diamond' },
];

export const KOREAN_LETTER_ITEMS = [
  { id: 'a', letter: '아', word: '아기', emoji: '👶', example: '아기' },
  { id: 'ya', letter: '야', word: '야구', emoji: '⚾', example: '야구' },
  { id: 'eo', letter: '어', word: '어머니', emoji: '👩', example: '어머니' },
  { id: 'yeo', letter: '여', word: '여우', emoji: '🦊', example: '여우' },
  { id: 'o', letter: '오', word: '오리', emoji: '🦆', example: '오리' },
  { id: 'yo', letter: '요', word: '요리', emoji: '🍳', example: '요리' },
  { id: 'u', letter: '우', word: '우유', emoji: '🥛', example: '우유' },
  { id: 'yu', letter: '유', word: '유치원', emoji: '🏫', example: '유치원' },
  { id: 'eu', letter: '으', word: '으뜸', emoji: '👍', example: '으뜸' },
  { id: 'i', letter: '이', word: '이빨', emoji: '🦷', example: '이빨' },
  { id: 'g', letter: 'ㄱ', word: '가방', emoji: '🎒', example: '가방' },
  { id: 'n', letter: 'ㄴ', word: '나비', emoji: '🦋', example: '나비' },
  { id: 'd', letter: 'ㄷ', word: '다람쥐', emoji: '🐿️', example: '다람쥐' },
  { id: 'r', letter: 'ㄹ', word: '라디오', emoji: '📻', example: '라디오' },
  { id: 'm', letter: 'ㅁ', word: '모자', emoji: '🧢', example: '모자' },
  { id: 'b', letter: 'ㅂ', word: '바나나', emoji: '🍌', example: '바나나' },
  { id: 's', letter: 'ㅅ', word: '사자', emoji: '🦁', example: '사자' },
  { id: 'ng', letter: 'ㅇ', word: '안경', emoji: '👓', example: '안경' },
];

export const SOUND_ITEMS = [
  { id: 'cat_sound', name: '고양이', soundText: '야옹~ 야옹~', emoji: '🐱', hint: '귀여운 야옹이 소리예요!' },
  { id: 'dog_sound', name: '강아지', soundText: '멍멍! 멍멍!', emoji: '🐶', hint: '꼬리를 살랑거리는 강아지 소리예요!' },
  { id: 'pig_sound', name: '돼지', soundText: '꿀꿀! 꿀꿀!', emoji: '🐷', hint: '분홍색 돼지 친구 소리예요!' },
  { id: 'sheep_sound', name: '양', soundText: '음메~ 음메~', emoji: '🐑', hint: '폭신폭신 양 친구 소리예요!' },
  { id: 'duck_sound', name: '오리', soundText: '꽥꽥! 꽥꽥!', emoji: '🦆', hint: '연못에서 수영하는 오리 소리예요!' },
  { id: 'car_sound', name: '자동차', soundText: '부릉부릉~ 빵빵!', emoji: '🚗', hint: '씽씽 달리는 자동차 소리예요!' },
  { id: 'train_sound', name: '기차', soundText: '칙칙폭폭~ 칙칙폭폭!', emoji: '🚂', hint: '긴 레일을 달리는 기차 소리예요!' },
  { id: 'frog_sound', name: '개구리', soundText: '개굴개굴~ 개굴개굴!', emoji: '🐸', hint: '폴짝 뛰는 개구리 소리예요!' },
];

export const FOOD_COUNTING_ITEMS = [
  { id: 'cake', name: '딸기 케이크', emoji: '🍰' },
  { id: 'cookie', name: '쿠키', emoji: '🍪' },
  { id: 'donut', name: '도넛', emoji: '🍩' },
  { id: 'apple_food', name: '사과', emoji: '🍎' },
  { id: 'icecream', name: '아이스크림', emoji: '🍦' },
];

export const STICKER_LIST = [
  { id: 'stk_ggomi', name: '리본 꼬미', emoji: '🎀🐻', characterId: 'ggomi', unlocked: true },
  { id: 'stk_rano', name: '아기 라노', emoji: '🦖🌿', characterId: 'rano', unlocked: true },
  { id: 'stk_jelly', name: '하트 젤리', emoji: '💖🐰', characterId: 'jelly', unlocked: true },
  { id: 'stk_dochi', name: '별 도치', emoji: '⭐🦔', characterId: 'dochi', unlocked: true },
  { id: 'stk_ggulgguli', name: '케이크 꿀꿀이', emoji: '🍰🐷', characterId: 'ggulgguli', unlocked: false },
  { id: 'stk_eumme', name: '구름 음메', emoji: '☁️🐑', characterId: 'eumme', unlocked: false },
  { id: 'stk_nurungji', name: '보물 누룽지', emoji: '🦴🐶', characterId: 'nurungji', unlocked: false },
  { id: 'stk_star', name: '반짝 황금별', emoji: '🌟', characterId: 'ggomi', unlocked: true },
  { id: 'stk_crown', name: '반짝 왕관', emoji: '👑', characterId: 'jelly', unlocked: false },
  { id: 'stk_rainbow', name: '무지개', emoji: '🌈', characterId: 'eumme', unlocked: false },
  { id: 'stk_flower', name: '웃는 꽃', emoji: '🌸', characterId: 'ggomi', unlocked: true },
  { id: 'stk_candy', name: '알사탕', emoji: '🍬', characterId: 'ggulgguli', unlocked: false },
];

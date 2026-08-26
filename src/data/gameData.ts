import { QuizItem, AgeGroup, EmotionItem, PatternItem, SizeItem, RhythmItem, WordPuzzleItem, Sticker } from '../types';

export interface CloudItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface TreasureItem {
  id: string;
  name: string;
  emoji: string;
  hideSpot: string;
}

// 1. 사물 인지 퀴즈 (꼬미)
export const OBJECT_ITEMS_BY_AGE: Record<AgeGroup, QuizItem[]> = {
  baby: [
    { id: 'apple', name: '사과', koreanName: '사과', category: 'fruit', emoji: '🍎', color: '#FF5252' },
    { id: 'banana', name: '바나나', koreanName: '바나나', category: 'fruit', emoji: '🍌', color: '#FFEE58' },
    { id: 'cat', name: '고양이', koreanName: '고양이', category: 'animal', emoji: '🐱', color: '#FFB74D' },
    { id: 'dog', name: '강아지', koreanName: '강아지', category: 'animal', emoji: '🐶', color: '#FFA000' },
    { id: 'car', name: '자동차', koreanName: '자동차', category: 'vehicle', emoji: '🚗', color: '#42A5F5' },
    { id: 'rabbit', name: '토끼', koreanName: '토끼', category: 'animal', emoji: '🐰', color: '#EC407A' },
  ],
  sprout: [
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
  ],
  bloom: [
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
    // 추가 사물
    { id: 'fireengine', name: '소방차', koreanName: '소방차', category: 'vehicle', emoji: '🚒', color: '#E53935' },
    { id: 'policecar', name: '경찰차', koreanName: '경찰차', category: 'vehicle', emoji: '🚓', color: '#1E88E5' },
    { id: 'lion', name: '사자', koreanName: '사자', category: 'animal', emoji: '🦁', color: '#FDD835' },
    { id: 'elephant', name: '코끼리', koreanName: '코끼리', category: 'animal', emoji: '🐘', color: '#B0BEC5' },
    { id: 'carrot', name: '당근', koreanName: '당근', category: 'food', emoji: '🥕', color: '#FF9800' },
    { id: 'candy', name: '사탕', koreanName: '사탕', category: 'food', emoji: '🍬', color: '#E91E63' },
  ],
  star: [
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
    { id: 'fireengine', name: '소방차', koreanName: '소방차', category: 'vehicle', emoji: '🚒', color: '#E53935' },
    { id: 'policecar', name: '경찰차', koreanName: '경찰차', category: 'vehicle', emoji: '🚓', color: '#1E88E5' },
    { id: 'lion', name: '사자', koreanName: '사자', category: 'animal', emoji: '🦁', color: '#FDD835' },
    { id: 'elephant', name: '코끼리', koreanName: '코끼리', category: 'animal', emoji: '🐘', color: '#B0BEC5' },
    { id: 'doctor', name: '의사', koreanName: '의사', category: 'job', emoji: '🧑‍⚕️', color: '#00ACC1' },
    { id: 'teacher', name: '선생님', koreanName: '선생님', category: 'job', emoji: '🧑‍🏫', color: '#8E24AA' },
    { id: 'piano', name: '피아노', koreanName: '피아노', category: 'shape', emoji: '🎹', color: '#37474F' },
    { id: 'hospital', name: '병원', koreanName: '병원', category: 'place', emoji: '🏥', color: '#E53935' },
    { id: 'school', name: '학교', koreanName: '학교', category: 'place', emoji: '🏫', color: '#FFB300' },
  ],
};

// 2. 알록달록 모양 퍼즐 (라노)
export const SHAPE_COLOR_ITEMS_BY_AGE: Record<
  AgeGroup,
  Array<{ id: string; shape: string; colorName: string; color: string; emoji: string; path: string }>
> = {
  baby: [
    { id: 'red_circle', shape: '동그라미', colorName: '빨간색', color: '#FF5252', emoji: '🔴', path: 'circle' },
    { id: 'blue_square', shape: '네모', colorName: '파란색', color: '#42A5F5', emoji: '🟦', path: 'square' },
    { id: 'yellow_triangle', shape: '세모', colorName: '노란색', color: '#FFD600', emoji: '🔺', path: 'triangle' },
  ],
  sprout: [
    { id: 'red_circle', shape: '동그라미', colorName: '빨간색', color: '#FF5252', emoji: '🔴', path: 'circle' },
    { id: 'blue_square', shape: '네모', colorName: '파란색', color: '#42A5F5', emoji: '🟦', path: 'square' },
    { id: 'yellow_triangle', shape: '세모', colorName: '노란색', color: '#FFD600', emoji: '🔺', path: 'triangle' },
    { id: 'green_star', shape: '별', colorName: '초록색', color: '#66BB6A', emoji: '⭐', path: 'star' },
    { id: 'pink_heart', shape: '하트', colorName: '분홍색', color: '#FF4081', emoji: '💖', path: 'heart' },
    { id: 'purple_diamond', shape: '다이아몬드', colorName: '보라색', color: '#AB47BC', emoji: '🔷', path: 'diamond' },
  ],
  bloom: [
    { id: 'red_circle', shape: '동그라미', colorName: '빨간색', color: '#FF5252', emoji: '🔴', path: 'circle' },
    { id: 'blue_square', shape: '네모', colorName: '파란색', color: '#42A5F5', emoji: '🟦', path: 'square' },
    { id: 'yellow_triangle', shape: '세모', colorName: '노란색', color: '#FFD600', emoji: '🔺', path: 'triangle' },
    { id: 'green_star', shape: '별', colorName: '초록색', color: '#66BB6A', emoji: '⭐', path: 'star' },
    { id: 'pink_heart', shape: '하트', colorName: '분홍색', color: '#FF4081', emoji: '💖', path: 'heart' },
    { id: 'purple_diamond', shape: '다이아몬드', colorName: '보라색', color: '#AB47BC', emoji: '🔷', path: 'diamond' },
    { id: 'orange_pentagon', shape: '오각형', colorName: '주황색', color: '#FF9800', emoji: '⬠', path: 'pentagon' },
    { id: 'brown_oval', shape: '타원', colorName: '갈색', color: '#795548', emoji: '⬭', path: 'oval' },
  ],
  star: [
    { id: 'red_circle', shape: '동그라미', colorName: '빨간색', color: '#FF5252', emoji: '🔴', path: 'circle' },
    { id: 'blue_square', shape: '네모', colorName: '파란색', color: '#42A5F5', emoji: '🟦', path: 'square' },
    { id: 'yellow_triangle', shape: '세모', colorName: '노란색', color: '#FFD600', emoji: '🔺', path: 'triangle' },
    { id: 'green_star', shape: '별', colorName: '초록색', color: '#66BB6A', emoji: '⭐', path: 'star' },
    { id: 'pink_heart', shape: '하트', colorName: '분홍색', color: '#FF4081', emoji: '💖', path: 'heart' },
    { id: 'purple_diamond', shape: '다이아몬드', colorName: '보라색', color: '#AB47BC', emoji: '🔷', path: 'diamond' },
    { id: 'orange_pentagon', shape: '오각형', colorName: '주황색', color: '#FF9800', emoji: '⬠', path: 'pentagon' },
    { id: 'teal_hexagon', shape: '육각형', colorName: '청록색', color: '#009688', emoji: '⬡', path: 'hexagon' },
    { id: 'black_crescent', shape: '초승달', colorName: '검은색', color: '#212121', emoji: '🌙', path: 'crescent' },
  ],
};

// 3. 한글 비누방울 팡팡 (화음/자음 - 젤리)
export const KOREAN_LETTER_ITEMS_BY_AGE: Record<
  AgeGroup,
  Array<{ id: string; letter: string; word: string; emoji: string; example: string }>
> = {
  baby: [
    { id: 'a', letter: '아', word: '아기', emoji: '👶', example: '아기' },
    { id: 'eo', letter: '어', word: '어머니', emoji: '👩', example: '어머니' },
    { id: 'o', letter: '오', word: '오리', emoji: '🦆', example: '오리' },
    { id: 'u', letter: '우', word: '우유', emoji: '🥛', example: '우유' },
    { id: 'i', letter: '이', word: '이빨', emoji: '🦷', example: '이빨' },
  ],
  sprout: [
    { id: 'a', letter: '아', word: '아기', emoji: '👶', example: '아기' },
    { id: 'ya', letter: '야', word: '야구', emoji: '⚾', example: '야구' },
    { id: 'eo', letter: '어', word: '어머니', emoji: '👩', example: '어머니' },
    { id: 'yeo', letter: '여', word: '여우', emoji: '🦊', example: '여우' },
    { id: 'o', letter: '오', word: '오리', emoji: '🦆', example: '오리' },
    { id: 'yo', letter: '요', word: '요리', emoji: '🍳', example: '요리' },
    { id: 'u', letter: '우', word: '우유', emoji: '🥛', example: '우유' },
    { id: 'yu', letter: '유', word: '유치원', emoji: '🏫', example: '유치원' },
    { id: 'i', letter: '이', word: '이빨', emoji: '🦷', example: '이빨' },
    { id: 'g', letter: 'ㄱ', word: '가방', emoji: '🎒', example: '가방' },
    { id: 'n', letter: 'ㄴ', word: '나비', emoji: '🦋', example: '나비' },
    { id: 'd', letter: 'ㄷ', word: '다람쥐', emoji: '🐿️', example: '다람쥐' },
    { id: 'r', letter: 'ㄹ', word: '라디오', emoji: '📻', example: '라디오' },
    { id: 'm', letter: 'ㅁ', word: '모자', emoji: '🧢', example: '모자' },
    { id: 'b', letter: 'ㅂ', word: '바나나', emoji: '🍌', example: '바나나' },
    { id: 's', letter: 'ㅅ', word: '사자', emoji: '🦁', example: '사자' },
    { id: 'ng', letter: 'ㅇ', word: '안경', emoji: '👓', example: '안경' },
  ],
  bloom: [
    { id: 'a', letter: '아', word: '아기', emoji: '👶', example: '아기' },
    { id: 'ya', letter: '야', word: '야구', emoji: '⚾', example: '야구' },
    { id: 'eo', letter: '어', word: '어머니', emoji: '👩', example: '어머니' },
    { id: 'yeo', letter: '여', word: '여우', emoji: '🦊', example: '여우' },
    { id: 'o', letter: '오', word: '오리', emoji: '🦆', example: '오리' },
    { id: 'yo', letter: '요', word: '요리', emoji: '🍳', example: '요리' },
    { id: 'u', letter: '우', word: '우유', emoji: '🥛', example: '우유' },
    { id: 'yu', letter: '유', word: '유치원', emoji: '🏫', example: '유치원' },
    { id: 'g', letter: 'ㄱ', word: '가방', emoji: '🎒', example: '가방' },
    { id: 'n', letter: 'ㄴ', word: '나비', emoji: '🦋', example: '나비' },
    { id: 'd', letter: 'ㄷ', word: '다람쥐', emoji: '🐿️', example: '다람쥐' },
    { id: 'r', letter: 'ㄹ', word: '라디오', emoji: '📻', example: '라디오' },
    { id: 'm', letter: 'ㅁ', word: '모자', emoji: '🧢', example: '모자' },
    { id: 'b', letter: 'ㅂ', word: '바나나', emoji: '🍌', example: '바나나' },
    { id: 's', letter: 'ㅅ', word: '사자', emoji: '🦁', example: '사자' },
    { id: 'j', letter: 'ㅈ', word: '지도', emoji: '🗺️', example: '지도' },
    { id: 'ch', letter: 'ㅊ', word: '치즈', emoji: '🧀', example: '치즈' },
    { id: 'k', letter: 'ㅋ', word: '코끼리', emoji: '🐘', example: '코끼리' },
    { id: 't', letter: 'ㅌ', word: '토끼', emoji: '🐰', example: '토끼' },
    { id: 'p', letter: 'ㅍ', word: '포도', emoji: '🍇', example: '포도' },
    { id: 'h', letter: 'ㅎ', word: '하늘', emoji: '☁️', example: '하늘' },
  ],
  star: [
    { id: 'g', letter: 'ㄱ', word: '가방', emoji: '🎒', example: '가방' },
    { id: 'n', letter: 'ㄴ', word: '나비', emoji: '🦋', example: '나비' },
    { id: 'd', letter: 'ㄷ', word: '다람쥐', emoji: '🐿️', example: '다람쥐' },
    { id: 'r', letter: 'ㄹ', word: '라디오', emoji: '📻', example: '라디오' },
    { id: 'm', letter: 'ㅁ', word: '모자', emoji: '🧢', example: '모자' },
    { id: 'b', letter: 'ㅂ', word: '바나나', emoji: '🍌', example: '바나나' },
    { id: 's', letter: 'ㅅ', word: '사자', emoji: '🦁', example: '사자' },
    { id: 'j', letter: 'ㅈ', word: '지도', emoji: '🗺️', example: '지도' },
    { id: 'ch', letter: 'ㅊ', word: '치즈', emoji: '🧀', example: '치즈' },
    { id: 'k', letter: 'ㅋ', word: '코끼리', emoji: '🐘', example: '코끼리' },
    { id: 't', letter: 'ㅌ', word: '토끼', emoji: '🐰', example: '토끼' },
    { id: 'p', letter: 'ㅍ', word: '포도', emoji: '🍇', example: '포도' },
    { id: 'h', letter: 'ㅎ', word: '하늘', emoji: '☁️', example: '하늘' },
    // 쌍자음 및 복잡한 글자
    { id: 'kk', letter: 'ㄲ', word: '꼬리', emoji: '🐕', example: '꼬리' },
    { id: 'tt', letter: 'ㄸ', word: '딸기', emoji: '🍓', example: '딸기' },
    { id: 'pp', letter: 'ㅃ', word: '빵', emoji: '🍞', example: '빵' },
    { id: 'ss', letter: 'ㅆ', word: '쓰레기통', emoji: '🗑️', example: '쓰레기통' },
    { id: 'jj', letter: 'ㅉ', word: '찌개', emoji: '🍲', example: '찌개' },
  ],
};

// 4. 소리 귀쫑긋 퀴즈 (도치)
export const SOUND_ITEMS_BY_AGE: Record<
  AgeGroup,
  Array<{ id: string; name: string; soundText: string; emoji: string; hint: string }>
> = {
  baby: [
    { id: 'cat_sound', name: '고양이', soundText: '야옹~ 야옹~', emoji: '🐱', hint: '귀여운 야옹이 소리예요!' },
    { id: 'dog_sound', name: '강아지', soundText: '멍멍! 멍멍!', emoji: '🐶', hint: '꼬리를 살랑거리는 강아지 소리예요!' },
    { id: 'pig_sound', name: '돼지', soundText: '꿀꿀! 꿀꿀!', emoji: '🐷', hint: '분홍색 돼지 친구 소리예요!' },
    { id: 'car_sound', name: '자동차', soundText: '부릉부릉~ 빵빵!', emoji: '🚗', hint: '씽씽 달리는 자동차 소리예요!' },
  ],
  sprout: [
    { id: 'cat_sound', name: '고양이', soundText: '야옹~ 야옹~', emoji: '🐱', hint: '귀여운 야옹이 소리예요!' },
    { id: 'dog_sound', name: '강아지', soundText: '멍멍! 멍멍!', emoji: '🐶', hint: '꼬리를 살랑거리는 강아지 소리예요!' },
    { id: 'pig_sound', name: '돼지', soundText: '꿀꿀! 꿀꿀!', emoji: '🐷', hint: '분홍색 돼지 친구 소리예요!' },
    { id: 'sheep_sound', name: '양', soundText: '음메~ 음메~', emoji: '🐑', hint: '폭신폭신 양 친구 소리예요!' },
    { id: 'duck_sound', name: '오리', soundText: '꽥꽥! 꽥꽥!', emoji: '🦆', hint: '연못에서 수영하는 오리 소리예요!' },
    { id: 'car_sound', name: '자동차', soundText: '부릉부릉~ 빵빵!', emoji: '🚗', hint: '씽씽 달리는 자동차 소리예요!' },
    { id: 'train_sound', name: '기차', soundText: '칙칙폭폭~ 칙칙폭폭!', emoji: '🚂', hint: '긴 레일을 달리는 기차 소리예요!' },
    { id: 'frog_sound', name: '개구리', soundText: '개굴개굴~ 개굴개굴!', emoji: '🐸', hint: '폴짝 뛰는 개구리 소리예요!' },
  ],
  bloom: [
    { id: 'cat_sound', name: '고양이', soundText: '야옹~ 야옹~', emoji: '🐱', hint: '귀여운 야옹이 소리예요!' },
    { id: 'dog_sound', name: '강아지', soundText: '멍멍! 멍멍!', emoji: '🐶', hint: '꼬리를 살랑거리는 강아지 소리예요!' },
    { id: 'pig_sound', name: '돼지', soundText: '꿀꿀! 꿀꿀!', emoji: '🐷', hint: '분홍색 돼지 친구 소리예요!' },
    { id: 'sheep_sound', name: '양', soundText: '음메~ 음메~', emoji: '🐑', hint: '폭신폭신 양 친구 소리예요!' },
    { id: 'duck_sound', name: '오리', soundText: '꽥꽥! 꽥꽥!', emoji: '🦆', hint: '연못에서 수영하는 오리 소리예요!' },
    { id: 'car_sound', name: '자동차', soundText: '부릉부릉~ 빵빵!', emoji: '🚗', hint: '씽씽 달리는 자동차 소리예요!' },
    { id: 'train_sound', name: '기차', soundText: '칙칙폭폭~ 칙칙폭폭!', emoji: '🚂', hint: '긴 레일을 달리는 기차 소리예요!' },
    { id: 'lion_sound', name: '사자', soundText: '어흥! 크르릉!', emoji: '🦁', hint: '정글의 왕 사자 소리예요!' },
    { id: 'cow_sound', name: '젖소', soundText: '음머어~ 음머어~', emoji: '🐄', hint: '우유를 주는 젖소 소리예요!' },
    { id: 'monkey_sound', name: '원숭이', soundText: '끼끼! 우끼끼!', emoji: '🐒', hint: '바나나를 좋아하는 원숭이 소리예요!' },
  ],
  star: [
    { id: 'cat_sound', name: '고양이', soundText: '야옹~ 야옹~', emoji: '🐱', hint: '귀여운 야옹이 소리예요!' },
    { id: 'dog_sound', name: '강아지', soundText: '멍멍! 멍멍!', emoji: '🐶', hint: '꼬리를 살랑거리는 강아지 소리예요!' },
    { id: 'sheep_sound', name: '양', soundText: '음메~ 음메~', emoji: '🐑', hint: '폭신폭신 양 친구 소리예요!' },
    { id: 'train_sound', name: '기차', soundText: '칙칙폭폭~ 칙칙폭폭!', emoji: '🚂', hint: '긴 레일을 달리는 기차 소리예요!' },
    { id: 'fireengine_sound', name: '소방차', soundText: '삐뽀삐뽀~ 애앵!', emoji: '🚒', hint: '불을 끄러 가는 소방차 사이렌 소리예요!' },
    { id: 'policecar_sound', name: '경찰차', soundText: '삐용삐용~ 삐용삐용!', emoji: '🚓', hint: '도둑을 잡으러 가는 경찰차 소리예요!' },
    { id: 'owl_sound', name: '부엉이', soundText: '부엉부엉~ 부엉부엉!', emoji: '🦉', hint: '밤에 활동하는 부엉이 소리예요!' },
    { id: 'rooster_sound', name: '수탉', soundText: '꼬꼬댁 꼬꼬! 꼬꼬꼬!', emoji: '🐓', hint: '아침을 알리는 닭 울음소리예요!' },
    { id: 'thunder_sound', name: '천둥 번개', soundText: '우르릉 쾅쾅! 번쩍!', emoji: '⚡', hint: '비가 올 때 하늘에서 나는 큰 소리예요!' },
  ],
};

// 5. 맛있는 수 세기 (꿀꿀이)
export const FOOD_COUNTING_ITEMS = [
  { id: 'cake', name: '딸기 케이크', emoji: '🍰' },
  { id: 'cookie', name: '쿠키', emoji: '🍪' },
  { id: 'donut', name: '도넛', emoji: '🍩' },
  { id: 'apple_food', name: '사과', emoji: '🍎' },
  { id: 'icecream', name: '아이스크림', emoji: '🍦' },
];

// 6. 구름 퍼즐 (음메)
export const CLOUD_SHAPES_BY_AGE: Record<AgeGroup, CloudItem[]> = {
  baby: [
    { id: 'star_cloud', name: '별 구름', emoji: '⭐', color: '#FFF59D' },
    { id: 'heart_cloud', name: '하트 구름', emoji: '💖', color: '#FF80AB' },
    { id: 'sun_cloud', name: '해님 구름', emoji: '☀️', color: '#FFE082' },
  ],
  sprout: [
    { id: 'star_cloud', name: '별 구름', emoji: '⭐', color: '#FFF59D' },
    { id: 'heart_cloud', name: '하트 구름', emoji: '💖', color: '#FF80AB' },
    { id: 'sun_cloud', name: '해님 구름', emoji: '☀️', color: '#FFE082' },
    { id: 'moon_cloud', name: '달님 구름', emoji: '🌙', color: '#CE93D8' },
    { id: 'flower_cloud', name: '꽃 구름', emoji: '🌸', color: '#A5D6A7' },
  ],
  bloom: [
    { id: 'star_cloud', name: '별 구름', emoji: '⭐', color: '#FFF59D' },
    { id: 'heart_cloud', name: '하트 구름', emoji: '💖', color: '#FF80AB' },
    { id: 'sun_cloud', name: '해님 구름', emoji: '☀️', color: '#FFE082' },
    { id: 'moon_cloud', name: '달님 구름', emoji: '🌙', color: '#CE93D8' },
    { id: 'flower_cloud', name: '꽃 구름', emoji: '🌸', color: '#A5D6A7' },
    { id: 'cloud_cloud', name: '뭉게 구름', emoji: '☁️', color: '#ECEFF1' },
    { id: 'umbrella_cloud', name: '우산 구름', emoji: '☔', color: '#90CAF9' },
  ],
  star: [
    { id: 'star_cloud', name: '별 구름', emoji: '⭐', color: '#FFF59D' },
    { id: 'heart_cloud', name: '하트 구름', emoji: '💖', color: '#FF80AB' },
    { id: 'sun_cloud', name: '해님 구름', emoji: '☀️', color: '#FFE082' },
    { id: 'moon_cloud', name: '달님 구름', emoji: '🌙', color: '#CE93D8' },
    { id: 'flower_cloud', name: '꽃 구름', emoji: '🌸', color: '#A5D6A7' },
    { id: 'cloud_cloud', name: '뭉게 구름', emoji: '☁️', color: '#ECEFF1' },
    { id: 'umbrella_cloud', name: '우산 구름', emoji: '☔', color: '#90CAF9' },
    { id: 'clover_cloud', name: '클로버 구름', emoji: '🍀', color: '#81C784' },
    { id: 'crown_cloud', name: '왕관 구름', emoji: '👑', color: '#FFD54F' },
  ],
};

// 7. 숨은 보물 찾기 (누룽지)
export const TREASURE_ITEMS_BY_AGE: Record<AgeGroup, TreasureItem[]> = {
  baby: [
    { id: 'teddy_bear', name: '곰인형', emoji: '🧸', hideSpot: '쿠션 뒤' },
    { id: 'toy_car', name: '장난감 자동차', emoji: '🚗', hideSpot: '상자 속' },
    { id: 'apple_tr', name: '달콤 사과', emoji: '🍎', hideSpot: '바구니 안' },
    { id: 'ball_tr', name: '알록달록 공', emoji: '⚽', hideSpot: '소파 옆' },
  ],
  sprout: [
    { id: 'teddy_bear', name: '곰인형', emoji: '🧸', hideSpot: '쿠션 뒤' },
    { id: 'toy_car', name: '장난감 자동차', emoji: '🚗', hideSpot: '상자 속' },
    { id: 'apple_tr', name: '달콤 사과', emoji: '🍎', hideSpot: '바구니 안' },
    { id: 'book_tr', name: '그림책', emoji: '📚', hideSpot: '책상 위' },
    { id: 'ball_tr', name: '알록달록 공', emoji: '⚽', hideSpot: '소파 옆' },
    { id: 'flower_tr', name: '예쁜 꽃', emoji: '🌸', hideSpot: '화분 속' },
  ],
  bloom: [
    { id: 'teddy_bear', name: '곰인형', emoji: '🧸', hideSpot: '쿠션 뒤' },
    { id: 'toy_car', name: '장난감 자동차', emoji: '🚗', hideSpot: '상자 속' },
    { id: 'apple_tr', name: '달콤 사과', emoji: '🍎', hideSpot: '바구니 안' },
    { id: 'book_tr', name: '그림책', emoji: '📚', hideSpot: '책상 위' },
    { id: 'ball_tr', name: '알록달록 공', emoji: '⚽', hideSpot: '소파 옆' },
    { id: 'flower_tr', name: '예쁜 꽃', emoji: '🌸', hideSpot: '화분 속' },
    { id: 'candy_tr', name: '알사탕', emoji: '🍬', hideSpot: '서랍 안' },
    { id: 'hat_tr', name: '꼬깔 모자', emoji: '🥳', hideSpot: '의자 위' },
  ],
  star: [
    { id: 'teddy_bear', name: '곰인형', emoji: '🧸', hideSpot: '쿠션 뒤' },
    { id: 'toy_car', name: '장난감 자동차', emoji: '🚗', hideSpot: '상자 속' },
    { id: 'apple_tr', name: '달콤 사과', emoji: '🍎', hideSpot: '바구니 안' },
    { id: 'book_tr', name: '그림책', emoji: '📚', hideSpot: '책상 위' },
    { id: 'ball_tr', name: '알록달록 공', emoji: '⚽', hideSpot: '소파 옆' },
    { id: 'flower_tr', name: '예쁜 꽃', emoji: '🌸', hideSpot: '화분 속' },
    { id: 'candy_tr', name: '알사탕', emoji: '🍬', hideSpot: '서랍 안' },
    { id: 'hat_tr', name: '꼬깔 모자', emoji: '🥳', hideSpot: '의자 위' },
    { id: 'pencil_tr', name: '연필 친구', emoji: '✏️', hideSpot: '필통 속' },
    { id: 'key_tr', name: '황금 열쇠', emoji: '🔑', hideSpot: '액자 뒤' },
  ],
};

// --- 신규 게임 5종 데이터 ---

// 8. 감정 인지 퀴즈 (꼬미 서브)
export const EMOTION_ITEMS_BY_AGE: Record<AgeGroup, EmotionItem[]> = {
  baby: [
    { id: 'happy', name: '기뻐요', emoji: '😊', expression: '활짝 웃는 얼굴' },
    { id: 'sad', name: '슬퍼요', emoji: '😢', expression: '눈물이 핑 도는 얼굴' },
    { id: 'angry', name: '화나요', emoji: '😠', expression: '눈썹을 찡그린 얼굴' },
  ],
  sprout: [
    { id: 'happy', name: '기뻐요', emoji: '😊', expression: '활짝 웃는 얼굴' },
    { id: 'sad', name: '슬퍼요', emoji: '😢', expression: '눈물이 핑 도는 얼굴' },
    { id: 'angry', name: '화나요', emoji: '😠', expression: '눈썹을 찡그린 얼굴' },
    { id: 'surprised', name: '놀라요', emoji: '😲', expression: '입이 쩍 벌어진 얼굴' },
    { id: 'scared', name: '무서워요', emoji: '😨', expression: '사르르 겁먹은 얼굴' },
  ],
  bloom: [
    { id: 'happy', name: '기뻐요', emoji: '😊', expression: '활짝 웃는 얼굴' },
    { id: 'sad', name: '슬퍼요', emoji: '😢', expression: '눈물이 핑 도는 얼굴' },
    { id: 'angry', name: '화나요', emoji: '😠', expression: '눈썹을 찡그린 얼굴' },
    { id: 'surprised', name: '놀라요', emoji: '😲', expression: '입이 쩍 벌어진 얼굴' },
    { id: 'scared', name: '무서워요', emoji: '😨', expression: '사르르 겁먹은 얼굴' },
    { id: 'shy', name: '부끄러워요', emoji: '😳', expression: '볼이 빨개진 얼굴' },
    { id: 'tired', name: '피곤해요', emoji: '😴', expression: '스르륵 잠이 쏟아지는 얼굴' },
  ],
  star: [
    { id: 'happy', name: '기뻐요', emoji: '😊', expression: '활짝 웃는 얼굴' },
    { id: 'sad', name: '슬퍼요', emoji: '😢', expression: '눈물이 핑 도는 얼굴' },
    { id: 'angry', name: '화나요', emoji: '😠', expression: '눈썹을 찡그린 얼굴' },
    { id: 'surprised', name: '놀라요', emoji: '😲', expression: '입이 쩍 벌어진 얼굴' },
    { id: 'scared', name: '무서워요', emoji: '😨', expression: '사르르 겁먹은 얼굴' },
    { id: 'shy', name: '부끄러워요', emoji: '😳', expression: '볼이 빨개진 얼굴' },
    { id: 'tired', name: '피곤해요', emoji: '😴', expression: '스르륵 잠이 쏟아지는 얼굴' },
    { id: 'excited', name: '신나요', emoji: '😆', expression: '눈을 질끈 감고 웃는 얼굴' },
    { id: 'love', name: '사랑해요', emoji: '😍', expression: '눈에서 하트가 뿅뿅 나오는 얼굴' },
  ],
};

// 9. 패턴 완성 놀이 (라노 서브)
export const PATTERN_ITEMS_BY_AGE: Record<AgeGroup, PatternItem[]> = {
  baby: [
    { id: 'p1', sequence: ['🍎', '🍌', '🍎', '🍌'], answer: '🍎', distractors: ['🚗', '🐱'], patternName: '사과와 바나나 반복 패턴' },
    { id: 'p2', sequence: ['🔴', '🔵', '🔴', '🔵'], answer: '🔴', distractors: ['🟡', '🟢'], patternName: '동그라미 색깔 반복 패턴' },
    { id: 'p3', sequence: ['🐶', '🐱', '🐶', '🐱'], answer: '🐶', distractors: ['🐰', '🐷'], patternName: '동물 친구 반복 패턴' },
  ],
  sprout: [
    { id: 'p1', sequence: ['🍎', '🍌', '🍎', '🍌'], answer: '🍎', distractors: ['🚗', '🐱'], patternName: '사과와 바나나 반복 패턴' },
    { id: 'p2', sequence: ['🔴', '🔵', '🔴', '🔵'], answer: '🔴', distractors: ['🟡', '🟢'], patternName: '동그라미 색깔 반복 패턴' },
    { id: 'p3', sequence: ['🚗', '✈️', '🚗', '✈️'], answer: '🚗', distractors: ['🚌', '🚒'], patternName: '탈것 번갈아 패턴' },
    { id: 'p4', sequence: ['⭐', '💖', '⭐', '💖'], answer: '⭐', distractors: ['🍀', '👑'], patternName: '별과 하트 패턴' },
  ],
  bloom: [
    { id: 'p1', sequence: ['🍎', '🍌', '🍇', '🍎', '🍌'], answer: '🍇', distractors: ['🍉', '🍓'], patternName: '과일 세 개 반복 패턴' },
    { id: 'p2', sequence: ['🔴', '🟡', '🔵', '🔴', '🟡'], answer: '🔵', distractors: ['🟢', '🟣'], patternName: '삼색 신호등 패턴' },
    { id: 'p3', sequence: ['🐶', '🐶', '🐱', '🐶', '🐶'], answer: '🐱', distractors: ['🐷', '🐰'], patternName: 'AAB 유형 패턴' },
  ],
  star: [
    { id: 'p1', sequence: ['🔴', '🔴', '🔵', '🔵', '🔴', '🔴'], answer: '🔵', distractors: ['🟢', '🟡'], patternName: 'AABB 색상 패턴' },
    { id: 'p2', sequence: ['⭐', '🌙', '☀️', '⭐', '🌙'], answer: '☀️', distractors: ['☁️', '⚡'], patternName: '우주 신호 패턴' },
    { id: 'p3', sequence: ['🍎', '🍌', '🍌', '🍎', '🍌'], answer: '🍌', header: '?', distractors: ['🍊', '🍇'], patternName: 'ABB 유형 복합 패턴' } as any,
  ],
};

// 10. 크기 비교 놀이 (꿀꿀이 서브)
export const SIZE_ITEMS_BY_AGE: Record<AgeGroup, SizeItem[]> = {
  baby: [
    { id: 's1', name: '큰 사과', emoji: '🍎', size: 'large', displayScale: 1.4 },
    { id: 's2', name: '작은 사과', emoji: '🍎', size: 'small', displayScale: 0.7 },
  ],
  sprout: [
    { id: 's1', name: '큰 곰인형', emoji: '🧸', size: 'large', displayScale: 1.4 },
    { id: 's2', name: '중간 곰인형', emoji: '🧸', size: 'medium', displayScale: 1.0 },
    { id: 's3', name: '작은 곰인형', emoji: '🧸', size: 'small', displayScale: 0.7 },
  ],
  bloom: [
    { id: 's1', name: '대왕 수박', emoji: '🍉', size: 'large', displayScale: 1.5 },
    { id: 's2', name: '중간 수박', emoji: '🍉', size: 'medium', displayScale: 1.0 },
    { id: 's3', name: '꼬마 수박', emoji: '🍉', size: 'small', displayScale: 0.6 },
  ],
  star: [
    { id: 's1', name: '점보 버스', emoji: '🚌', size: 'large', displayScale: 1.5 },
    { id: 's2', name: '중간 버스', emoji: '🚌', size: 'medium', displayScale: 1.0 },
    { id: 's3', name: '꼬미 버스', emoji: '🚌', size: 'small', displayScale: 0.6 },
  ],
};

// 11. 리듬 따라하기 (도치 서브)
export const RHYTHM_ITEMS_BY_AGE: Record<AgeGroup, RhythmItem[]> = {
  baby: [
    { id: 'r1', name: '도레미 송', notes: [262, 330], colors: ['#FF5252', '#FFEB3B'], emojis: ['🍎', '🟡'] },
  ],
  sprout: [
    { id: 'r1', name: '학교종 리듬', notes: [392, 392, 440], colors: ['#2196F3', '#2196F3', '#9C27B0'], emojis: ['⭐', '⭐', '🌈'] },
  ],
  bloom: [
    { id: 'r1', name: '곰세마리 스타트', notes: [262, 262, 262, 330], colors: ['#FF5252', '#FF5252', '#FF5252', '#FFEB3B'], emojis: ['🐻', '🐻', '🐻', '🍯'] },
  ],
  star: [
    { id: 'r1', name: '반짝반짝 작은별', notes: [262, 262, 392, 392, 440], colors: ['#FF5252', '#FF5252', '#2196F3', '#2196F3', '#9C27B0'], emojis: ['🌟', '🌟', '🌙', '🌙', '💫'] },
  ],
};

// 12. 단어 조합 퍼즐 (젤리 서브 - bloom/star 전용)
export const WORD_PUZZLE_ITEMS_BY_AGE: Record<AgeGroup, WordPuzzleItem[]> = {
  baby: [],
  sprout: [],
  bloom: [
    { id: 'w1', word: '나비', letters: ['나', '비'], emoji: '🦋', hint: '하늘하늘 날아다니는 곤충친구!' },
    { id: 'w2', word: '사과', letters: ['사', '과'], emoji: '🍎', hint: '아삭아삭 빨간 과일!' },
    { id: 'w3', word: '우유', letters: ['우', '유'], emoji: '🥛', hint: '고소하고 뽀얀 마실 것!' },
  ],
  star: [
    { id: 'w1', word: '가방', letters: ['가', '방'], emoji: '🎒', hint: '학교 갈 때 메는 물건!' },
    { id: 'w2', word: '사자', letters: ['사', '자'], emoji: '🦁', hint: '멋진 갈기를 지닌 동물의 왕!' },
    { id: 'w3', word: '토끼', letters: ['토', '끼'], emoji: '🐰', hint: '귀가 길고 깡총 뛰는 친구!' },
    { id: 'w4', word: '호랑이', letters: ['호', '랑', '이'], emoji: '🐯', hint: '줄무늬가 멋진 숲속의 맹수!' },
  ],
};

// 13. 스티커 리스트 (동일)
export const STICKER_LIST: Sticker[] = [
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

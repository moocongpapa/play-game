import type { CharacterId } from '../types';

export const FOOD_PLATES = [
  [{ id: 'apple', emoji: '🍎', name: '사과' }, { id: 'carrot', emoji: '🥕', name: '당근' }, { id: 'banana', emoji: '🍌', name: '바나나' }, { id: 'broccoli', emoji: '🥦', name: '브로콜리' }],
  [{ id: 'pear', emoji: '🍐', name: '배' }, { id: 'broccoli', emoji: '🥦', name: '브로콜리' }, { id: 'strawberry', emoji: '🍓', name: '딸기' }, { id: 'carrot', emoji: '🥕', name: '당근' }],
  [{ id: 'grape', emoji: '🍇', name: '포도' }, { id: 'carrot', emoji: '🥕', name: '당근' }, { id: 'orange', emoji: '🍊', name: '귤' }, { id: 'broccoli', emoji: '🥦', name: '브로콜리' }],
].map((items, index) => ({ id: `plate-${index}`, items }));
export const XYLOPHONE_KEYS = [
  { note: '도', frequency: 261.63, color: '#e89898', animal: '🐻', name: '곰' },
  { note: '레', frequency: 293.66, color: '#edae7d', animal: '🐶', name: '강아지' },
  { note: '미', frequency: 329.63, color: '#ebca77', animal: '🐱', name: '고양이' },
  { note: '파', frequency: 349.23, color: '#a9c58c', animal: '🐢', name: '거북이' },
  { note: '솔', frequency: 392.00, color: '#83bdba', animal: '🐟', name: '물고기' },
  { note: '라', frequency: 440.00, color: '#8bb7d9', animal: '🐧', name: '펭귄' },
  { note: '시', frequency: 493.88, color: '#b2a1d1', animal: '🦋', name: '나비' },
  { note: '높은 도', frequency: 523.25, color: '#d5a0c2', animal: '🐰', name: '토끼' },
];
export const HIDE_FRIENDS: CharacterId[] = ['ggomi', 'rano', 'jelly', 'dochi', 'ggulgguli', 'eumme', 'nurungji', 'pingu'];
export const BUBBLE_TOYS = ['🍓', '🐰', '🍎', '🐧', '🦋', '🍐', '🐢', '🍊'];

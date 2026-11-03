import type { AgeGroup, GameId } from '../types';
import { availableGameIds } from './gameCatalog';

export interface StoryStep { gameId: GameId; title: string; next: string }
export interface FriendStory {
  id: 'picnic' | 'birthday' | 'bedtime'; title: string; picture: string;
  theme: 'picnic' | 'party' | 'night'; closing: string; steps: readonly StoryStep[];
}
export const FRIEND_STORIES: readonly FriendStory[] = [
  { id: 'picnic', title: '우리의 과일 소풍', picture: '🧺', theme: 'picnic', closing: '우리가 딴 과일로 소풍을 했네! 냠냠, 행복해!', steps: [
    { gameId: 'fruit_harvest', title: '과일을 바구니에 쏙', next: '바구니에 모은 과일을 세어 볼까?' },
    { gameId: 'counting_food', title: '모은 과일 세기', next: '우리가 딴 과일을 함께 먹자!' },
    { gameId: 'feeding', title: '소풍 도시락 냠냠', next: '우리의 소풍이 완성됐어!' },
  ] },
  { id: 'birthday', title: '친구의 생일 파티', picture: '🎂', theme: 'party', closing: '네가 꾸민 케이크로 생일 파티를 했어! 고마워!', steps: [
    { gameId: 'cake_deco', title: '생일 케이크 꾸미기', next: '네가 꾸민 케이크를 같이 먹자!' },
    { gameId: 'feeding', title: '생일 케이크 나누기', next: '이제 우리 음악회를 열자!' },
    { gameId: 'animal_xylophone', title: '생일 음악회', next: '함께 만든 생일 파티야!' },
  ] },
  { id: 'bedtime', title: '포근한 잠자리', picture: '🌙', theme: 'night', closing: '냠냠 먹고, 치카치카! 포근한 이불 속에서 좋은 꿈 꿔!', steps: [
    { gameId: 'feeding', title: '저녁을 골고루 냠냠', next: '다 먹었네! 이를 반짝반짝 닦자!' },
    { gameId: 'tooth_brush', title: '깨끗하게 치카치카', next: '이제 포근한 이불을 덮고 쉬자.' },
    { gameId: 'goodnight_sleep', title: '좋아하는 이불 덮기', next: '편안한 꿈나라에 도착했어.' },
  ] },
];

/** Parent exclusions apply to stories as well as individual home cards. */
export function availableFriendStories(age: AgeGroup, disabled: GameId[] = []): FriendStory[] {
  const allowed = new Set(availableGameIds(age, disabled));
  return FRIEND_STORIES.filter(story => story.steps.every(step => allowed.has(step.gameId)));
}

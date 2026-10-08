import type { GameId } from '../types';

/** A short story through existing games; it never changes their difficulty or rewards. */
export const FRIEND_DAY = [
  { gameId: 'feeding', title: '아침을 냠냠!', picture: '🥕', next: '배가 든든해! 이제 치카치카 할까?' },
  { gameId: 'tooth_brush', title: '이를 반짝반짝!', picture: '🪥', next: '이가 반짝! 숲에서 친구들을 찾아볼까?' },
  { gameId: 'peekaboo_hide', title: '숲에서 까꿍!', picture: '🌳', next: '친구들을 찾았네! 함께 음악회를 열자!' },
  { gameId: 'animal_xylophone', title: '우리들의 음악회!', picture: '🎵', next: '우리가 만든 하루를 보러 가자!' },
] as const satisfies ReadonlyArray<{ gameId: GameId; title: string; picture: string; next: string }>;

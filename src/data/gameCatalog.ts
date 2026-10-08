import type { AgeGroup, GameId } from '../types';

export type GameTheme = 'garden' | 'sky' | 'music' | 'picnic' | 'magic';
export const GAME_CATALOG: Record<GameId, { title: string; prompt: string; theme: GameTheme; minAge?: AgeGroup; badge?: string }> = {
  object_recognition: { title: '이름 찾기', prompt: '그림 속 친구를 찾아봐!', theme: 'garden' },
  shape_color: { title: '모양과 색', prompt: '같은 모양을 콕 눌러봐!', theme: 'picnic' },
  korean_letters: { title: '글자 방울', prompt: '같은 글자 방울을 톡!', theme: 'sky' },
  sound_quiz: { title: '누구 소리?', prompt: '듣고, 소리의 주인을 찾아봐!', theme: 'music' },
  counting_food: { title: '냠냠 숫자', prompt: '하나씩 톡톡, 함께 세어봐!', theme: 'picnic' },
  cloud_shapes: { title: '구름 모으기', prompt: '같은 모양 구름을 모아봐!', theme: 'sky' },
  treasure_hunt: { title: '보물 찾기', prompt: '숨어 있는 보물을 찾아봐!', theme: 'garden' },
  emotion_quiz: { title: '마음 얼굴', prompt: '친구의 표정을 살펴봐!', theme: 'picnic' },
  pattern_sequence: { title: '다음은 뭘까?', prompt: '다음에 올 그림을 찾아봐!', theme: 'garden', minAge: 'sprout' },
  word_puzzle: { title: '단어 퍼즐', prompt: '그림을 보고 글자를 모아봐!', theme: 'magic', minAge: 'bloom' },
  rhythm_game: { title: '톡톡 음악', prompt: '반짝이는 악기를 따라 눌러봐!', theme: 'music', minAge: 'sprout' },
  size_comparison: { title: '크고 작고', prompt: '큰 친구와 작은 친구를 살펴봐!', theme: 'garden' },
  memory_card: { title: '짝꿍 카드', prompt: '뒤집어서 같은 그림을 찾아봐!', theme: 'magic' },
  shadow_quiz: { title: '그림자 친구', prompt: '그림자와 같은 친구를 찾아봐!', theme: 'magic', minAge: 'sprout' },
  stage_adventure: { title: '무지개 모험', prompt: '네 가지 놀이를 하나씩 해봐!', theme: 'garden', minAge: 'sprout' },
  tooth_brush: { title: '치카치카', prompt: '칫솔로 이를 쓱싹쓱싹!', theme: 'sky', badge: '쓱싹 · 생활습관' },
  feeding: { title: '냠냠 한 입', prompt: '친구의 입으로 음식을 쏙!', theme: 'picnic', badge: '쏙쏙 · 골고루 먹기' },
  bubble_pop: { title: '비눗방울 톡톡', prompt: '무지개 방울을 톡톡!', theme: 'sky', badge: '톡톡 · 감각 놀이' },
  peekaboo_hide: { title: '어디 숨었지?', prompt: '살랑살랑 귀를 찾아 까꿍!', theme: 'garden', badge: '까꿍 · 관찰 놀이' },
  animal_xylophone: { title: '동물 실로폰', prompt: '내가 만드는 도레미 음악회!', theme: 'music', badge: '도레미 · 자유 연주' },
  balloon_pop: { title: '풍선 팡팡', prompt: '둥둥 떠오르는 풍선을 톡!', theme: 'sky' },
};

const AGE_RANK: Record<AgeGroup, number> = { baby: 0, sprout: 1, bloom: 2, star: 3 };
export function availableGameIds(age: AgeGroup): GameId[] {
  return (Object.keys(GAME_CATALOG) as GameId[]).filter(id =>
    AGE_RANK[age] >= AGE_RANK[GAME_CATALOG[id].minAge || 'baby']);
}

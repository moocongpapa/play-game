import type { AgeGroup, GameId } from '../types';

export type DevelopmentArea = 'language' | 'logic' | 'care' | 'creative';
export type GameTheme = 'garden' | 'sky' | 'music' | 'picnic' | 'magic';
export const GAME_CATALOG: Record<GameId, { title: string; prompt: string; theme: GameTheme; developmentArea: DevelopmentArea; minAge?: AgeGroup; badge?: string; category?: 'hands' | 'care' }> = {
  object_recognition: { developmentArea: 'language', title: '이름 찾기', prompt: '그림 속 친구를 찾아봐!', theme: 'garden' },
  shape_color: { developmentArea: 'logic', title: '모양과 색', prompt: '같은 모양을 콕 눌러봐!', theme: 'picnic' },
  korean_letters: { developmentArea: 'language', title: '글자 방울', prompt: '같은 글자 방울을 톡!', theme: 'sky' },
  sound_quiz: { developmentArea: 'language', title: '누구 소리?', prompt: '듣고, 소리의 주인을 찾아봐!', theme: 'music' },
  counting_food: { developmentArea: 'logic', title: '냠냠 숫자', prompt: '하나씩 톡톡, 함께 세어봐!', theme: 'picnic' },
  cloud_shapes: { developmentArea: 'logic', title: '구름 모으기', prompt: '같은 모양 구름을 모아봐!', theme: 'sky' },
  treasure_hunt: { developmentArea: 'logic', title: '보물 찾기', prompt: '숨어 있는 보물을 찾아봐!', theme: 'garden' },
  emotion_quiz: { developmentArea: 'care', title: '마음 얼굴', prompt: '친구의 표정을 살펴봐!', theme: 'picnic' },
  pattern_sequence: { developmentArea: 'logic', title: '다음은 뭘까?', prompt: '다음에 올 그림을 찾아봐!', theme: 'garden', minAge: 'sprout' },
  word_puzzle: { developmentArea: 'language', title: '단어 퍼즐', prompt: '그림을 보고 글자를 모아봐!', theme: 'magic', minAge: 'bloom' },
  rhythm_game: { developmentArea: 'creative', title: '톡톡 음악', prompt: '반짝이는 악기를 따라 눌러봐!', theme: 'music', minAge: 'sprout' },
  size_comparison: { developmentArea: 'logic', title: '크고 작고', prompt: '큰 친구와 작은 친구를 살펴봐!', theme: 'garden' },
  memory_card: { developmentArea: 'logic', title: '짝꿍 카드', prompt: '뒤집어서 같은 그림을 찾아봐!', theme: 'magic' },
  shadow_quiz: { developmentArea: 'logic', title: '그림자 친구', prompt: '그림자와 같은 친구를 찾아봐!', theme: 'magic', minAge: 'sprout' },
  stage_adventure: { developmentArea: 'logic', title: '무지개 모험', prompt: '네 가지 놀이를 하나씩 해봐!', theme: 'garden', minAge: 'sprout' },
  tooth_brush: { developmentArea: 'care', title: '치카치카', prompt: '칫솔로 이를 쓱싹쓱싹!', theme: 'sky', badge: '쓱싹 · 생활습관' },
  feeding: { developmentArea: 'care', title: '냠냠 한 입', prompt: '친구의 입으로 음식을 쏙!', theme: 'picnic', badge: '쏙쏙 · 골고루 먹기' },
  bubble_pop: { developmentArea: 'creative', title: '비눗방울 톡톡', prompt: '무지개 방울을 톡톡!', theme: 'sky', badge: '톡톡 · 감각 놀이' },
  peekaboo_hide: { developmentArea: 'logic', title: '어디 숨었지?', prompt: '살랑살랑 귀를 찾아 까꿍!', theme: 'garden', badge: '까꿍 · 관찰 놀이' },
  animal_xylophone: { developmentArea: 'creative', title: '동물 실로폰', prompt: '내가 만드는 도레미 음악회!', theme: 'music', badge: '도레미 · 자유 연주' },
  path_tracing: { developmentArea: 'creative', title: '별빛 길 따라가기', prompt: '별을 잡고 길을 따라 쭉!', theme: 'garden', badge: '손끝 · 선 긋기', category: 'hands' },
  fruit_harvest: { developmentArea: 'logic', title: '과일 수확', prompt: '톡! 따서 같은 바구니에 쏙!', theme: 'picnic', badge: '쏙쏙 · 분류', category: 'hands' },
  symmetry_puzzle: { developmentArea: 'logic', title: '반쪽 날개', prompt: '같은 무늬의 날개를 쏙!', theme: 'garden', badge: '팔랑 · 대칭', category: 'hands' },
  size_ordering: { developmentArea: 'logic', title: '곰 세 마리', prompt: '크기에 꼭 맞는 자리를 찾아요!', theme: 'picnic', badge: '차곡 · 크기 순서', category: 'hands' },
  day_night_weather: { developmentArea: 'language', title: '해님 달님 날씨', prompt: '해님을 내리고 구름을 톡톡!', theme: 'sky', badge: '톡톡 · 자연', category: 'care' },
  goodnight_sleep: { developmentArea: 'care', title: '코~ 자자', prompt: '인형 꼭, 이불 쏙, 좋은 꿈 꿔!', theme: 'magic', badge: '포근 · 잠자리', category: 'care' },
  emotion_face: { developmentArea: 'care', title: '마음 거울', prompt: '눈과 입으로 마음을 만들어 봐!', theme: 'picnic', badge: '방긋 · 감정', category: 'care' },
  sensory_paint: { developmentArea: 'creative', title: '마법 물감과 모래', prompt: '무지개 물감을 쓱쓱 펼쳐 봐!', theme: 'magic', badge: '쓱쓱 · 자유 감각', category: 'hands' },
  balloon_pop: { developmentArea: 'creative', title: '풍선 팡팡', prompt: '둥둥 떠오르는 풍선을 톡!', theme: 'sky' },
};

const AGE_RANK: Record<AgeGroup, number> = { baby: 0, sprout: 1, bloom: 2, star: 3 };
export function availableGameIds(age: AgeGroup): GameId[] {
  return (Object.keys(GAME_CATALOG) as GameId[]).filter(id =>
    AGE_RANK[age] >= AGE_RANK[GAME_CATALOG[id].minAge || 'baby']);
}

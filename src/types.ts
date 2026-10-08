export type CharacterId = 'ggomi' | 'rano' | 'jelly' | 'dochi' | 'ggulgguli' | 'eumme' | 'nurungji' | 'pingu';

export type GameId = 
  | 'object_recognition' // 꼬미
  | 'shape_color'        // 라노
  | 'korean_letters'     // 젤리
  | 'sound_quiz'         // 도치
  | 'counting_food'      // 꿀꿀이
  | 'cloud_shapes'       // 음메
  | 'treasure_hunt'      // 누룽지
  // --- 신규 게임 ---
  | 'emotion_quiz'       // 꼬미의 감정 인지 퀴즈
  | 'pattern_sequence'   // 라노의 패턴 완성 놀이
  | 'word_puzzle'        // 젤리의 단어 조합 퍼즐
  | 'rhythm_game'        // 도치의 리듬 따라하기
  | 'size_comparison'    // 꿀꿀이의 크기 비교 놀이
  | 'memory_card'        // 누룽지의 기억력 카드 뒤집기
  | 'shadow_quiz'        // 꼬미의 그림자 실루엣 퀴즈
  | 'stage_adventure'    // 3~4세 무지개 다단계 스테이지 모험
  | 'balloon_pop';       // 꿀꿀이의 둥둥 풍선 팡팡 놀이

// 연령 그룹 (4단계)
export type AgeGroup = 'baby' | 'sprout' | 'bloom' | 'star';

// 난이도 설정
export interface DifficultyConfig {
  ageGroup: AgeGroup;
  label: string;              // 아기반 / 새싹반 / 꽃잎반 / 별님반
  emoji: string;              // 🐣 / 🌱 / 🌻 / 🌟
  optionCount: number;        // 선택지 수 (2/3/4/5)
  timeLimit: number;          // 초 (0 = 무제한)
  hintEnabled: boolean;       // 힌트 자동 표시
  hintDelaySec: number;       // 힌트 표시까지 지연 시간 (초)
  starsPerCorrect: number;    // 정답 시 별 보상
  countingRange: [number, number]; // 수 세기 범위 [min, max]
}

// 아이 프로필
export interface ChildProfile {
  name: string;               // 아이 이름
  birthDate: string;          // YYYY-MM-DD
  ageMonths: number;          // 자동 계산된 월령
  ageGroup: AgeGroup;         // 자동 배정된 연령 그룹
}

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  title: string;
  gender: 'female' | 'male';
  animal: string;
  color: string;
  bgGradient: string;
  badge: string;
  greeting: string;
  greetingTemplate: string;    // "{name}야 안녕!" 템플릿
  praise: string[];
  gameId: GameId;
  gameTitle: string;
  gameDesc: string;
  subGameId?: GameId;          // 신규 서브 게임 ID
  subGameTitle?: string;
  subGameDesc?: string;
  subGameMinAgeGroup?: AgeGroup; // 서브 게임 최소 연령 그룹
}

export interface Sticker {
  id: string;
  name: string;
  emoji: string;
  characterId: CharacterId;
  unlocked: boolean;
  x?: number;
  y?: number;
  scale?: number;
}

export interface AppState {
  stars: number;
  unlockedStickers: string[];
  placedStickers: Array<{
    id: string;
    stickerId: string;
    x: number;
    y: number;
    scale: number;
  }>;
  selectedCharacter: CharacterId;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  ttsEnabled: boolean;
  timerMinutes: number; // 0 means unlimited
  playTimeSeconds: number;
  isTimeUp: boolean;
  completedGames: Record<string, number>; // gameId -> completion count
  // --- 신규 프로필 필드 ---
  childProfile: ChildProfile | null;
  onboardingCompleted: boolean;
}

export interface QuizItem {
  id: string;
  name: string;
  koreanName: string;
  category: 'fruit' | 'animal' | 'vehicle' | 'color' | 'shape' | 'food' | 'letter' | 'emotion' | 'place' | 'job';
  emoji: string;
  color?: string;
  soundHint?: string;
}

// 감정 인지 퀴즈 아이템
export interface EmotionItem {
  id: string;
  name: string;
  emoji: string;
  expression: string;
  situation?: string;
}

// 패턴 완성 놀이 아이템
export interface PatternItem {
  id: string;
  sequence: string[];      // 패턴 시퀀스 (이모지 배열)
  answer: string;           // 정답 이모지
  distractors: string[];    // 오답 이모지들
  patternName: string;      // 패턴 설명
}

// 크기 비교 아이템
export interface SizeItem {
  id: string;
  name: string;
  emoji: string;
  size: 'small' | 'medium' | 'large';
  displayScale: number;     // 시각적 크기 비율
}

// 리듬 게임 아이템
export interface RhythmItem {
  id: string;
  name: string;
  notes: number[];          // 음계 주파수 배열
  colors: string[];         // 각 노트의 색상
  emojis: string[];         // 각 노트의 이모지
}

// 단어 조합 퍼즐 아이템
export interface WordPuzzleItem {
  id: string;
  word: string;             // 완성 단어
  letters: string[];        // 분해된 글자들
  emoji: string;
  hint: string;
}

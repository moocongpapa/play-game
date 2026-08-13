export type CharacterId = 'ggomi' | 'rano' | 'jelly' | 'dochi' | 'ggulgguli' | 'eumme' | 'nurungji';

export type GameId = 
  | 'object_recognition' // 꼬미
  | 'shape_color'        // 라노
  | 'korean_letters'     // 젤리
  | 'sound_quiz'         // 도치
  | 'counting_food'      // 꿀꿀이
  | 'cloud_shapes'       // 음메
  | 'treasure_hunt';     // 누룽지

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
  praise: string[];
  gameId: GameId;
  gameTitle: string;
  gameDesc: string;
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
  completedGames: Record<GameId, number>; // gameId -> completion count
}

export interface QuizItem {
  id: string;
  name: string;
  koreanName: string;
  category: 'fruit' | 'animal' | 'vehicle' | 'color' | 'shape' | 'food' | 'letter';
  emoji: string;
  color?: string;
  soundHint?: string;
}

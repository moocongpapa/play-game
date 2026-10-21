import type { GameId } from '../types';
import type { PlayFeedbackMode } from './juice';

export function feedbackModeForGame(game: GameId): PlayFeedbackMode {
  if (['goodnight_sleep', 'sensory_paint', 'emotion_face'].includes(game)) return 'quiet';
  if (['feeding', 'tooth_brush', 'fruit_munch', 'bubble_bath'].includes(game)) return 'care';
  return 'play';
}
export const WIND_GAMES = new Set<GameId>(['balloon_pop', 'bubble_pop', 'day_night_weather', 'block_tower']);

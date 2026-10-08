import type { CharacterId } from '../types';

export type ParkAction = 'jump' | 'roll' | 'turn' | 'dance' | 'wave' | 'run';
export const PARK_ACTIONS: Record<ParkAction, { duration: number; label: string; speech: string }> = {
  jump: { duration: 1.35, label: '폴짝!', speech: '폴짝! 구름까지 닿을까?' },
  roll: { duration: 1.5, label: '데굴데굴!', speech: '데굴데굴! 헤헤, 간지러워!' },
  turn: { duration: 1.1, label: '이쪽으로!', speech: '이번에는 이쪽으로 가 볼래!' },
  dance: { duration: 1.8, label: '흔들흔들!', speech: '흔들흔들! 같이 춤추자!' },
  wave: { duration: 1.6, label: '안녕!', speech: '안녕, 친구야! 만나서 반가워!' },
  run: { duration: 1.7, label: '다다다!', speech: '다다다! 신나는 달리기야!' },
};

export const PARK_PERSONALITIES: Record<CharacterId, { speed: number; actions: readonly ParkAction[] }> = {
  ggomi: { speed: 15, actions: ['wave', 'jump', 'turn', 'dance', 'roll', 'run'] },
  rano: { speed: 19, actions: ['jump', 'run', 'turn', 'wave', 'roll', 'dance'] },
  jelly: { speed: 19, actions: ['jump', 'dance', 'turn', 'roll', 'wave', 'run'] },
  dochi: { speed: 14, actions: ['roll', 'wave', 'turn', 'jump', 'run', 'dance'] },
  ggulgguli: { speed: 16, actions: ['dance', 'roll', 'turn', 'jump', 'wave', 'run'] },
  eumme: { speed: 13, actions: ['jump', 'wave', 'turn', 'dance', 'roll', 'run'] },
  nurungji: { speed: 21, actions: ['run', 'jump', 'turn', 'roll', 'wave', 'dance'] },
  pingu: { speed: 15, actions: ['roll', 'dance', 'turn', 'wave', 'jump', 'run'] },
};

export const PARK_GUIDE = '친구들이 모두 모였네! 친구를 콕 누르면 신나게 놀아!';
export const PARK_SPEECH_ENGLISH: ReadonlyArray<readonly [string, string]> = [
  [PARK_GUIDE, 'All our friends are here! Tap a friend and see how they play!'],
  [PARK_ACTIONS.jump.speech, 'Hop, hop! Can I reach the clouds?'],
  [PARK_ACTIONS.roll.speech, 'Roll, roll! Hee hee, that tickles!'],
  [PARK_ACTIONS.turn.speech, 'Let us go this way now!'],
  [PARK_ACTIONS.dance.speech, 'Wiggle, wiggle! Dance with me!'],
  [PARK_ACTIONS.wave.speech, 'Hello, friend! I am happy to see you!'],
  [PARK_ACTIONS.run.speech, 'Pitter-patter! Running is so much fun!'],
];

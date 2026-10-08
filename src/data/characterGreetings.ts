import type { CharacterId } from '../types';

export type GreetingMove = 'wave' | 'kick' | 'ballet' | 'roll' | 'clap' | 'jump' | 'bow' | 'skate';

interface CharacterGreeting {
  move: GreetingMove;
  title: string;
  soundWord: string;
  message: string;
  color: string;
}

export const CHARACTER_GREETINGS: Record<CharacterId, CharacterGreeting> = {
  ggomi: { move: 'wave', title: '손 흔들기', soundWord: '살랑살랑', message: '손을 흔들어 안녕!', color: '#f2c9cc' },
  rano: { move: 'kick', title: '씩씩한 발차기', soundWord: '얍! 얍!', message: '씩씩하게 발차기! 얍!', color: '#c9e1bc' },
  jelly: { move: 'ballet', title: '빙그르 발레', soundWord: '빙그르르', message: '빙그르르! 예쁜 발레 인사야!', color: '#e2d2ef' },
  dochi: { move: 'roll', title: '데굴데굴 구르기', soundWord: '데굴데굴', message: '데굴데굴! 굴러서 안녕!', color: '#f4dfb0' },
  ggulgguli: { move: 'clap', title: '짝짝 박수', soundWord: '짝짝짝!', message: '반가워서 짝짝짝! 같이 박수 칠까?', color: '#f3d1be' },
  eumme: { move: 'jump', title: '폴짝 점프', soundWord: '폴짝폴짝', message: '폴짝폴짝! 만나서 신나!', color: '#cfe5ee' },
  nurungji: { move: 'bow', title: '꼬리 흔들며 꾸벅', soundWord: '꾸벅! 살랑!', message: '꼬리 살랑살랑! 꾸벅, 안녕!', color: '#ead9ad' },
  pingu: { move: 'skate', title: '씽씽 스케이트', soundWord: '씽~ 씽~', message: '씽씽! 미끄러지며 안녕!', color: '#c3e4e4' },
};

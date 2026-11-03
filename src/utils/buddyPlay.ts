import type { CharacterId } from '../types';

const MOTIONS: Record<CharacterId, { y: number[]; rotate: number[]; scaleX: number[]; scaleY: number[] }> = {
  ggomi: { y: [0, -9, 0, -5, 0], rotate: [0, -6, 6, -3, 0], scaleX: [1, 1.05, .98, 1], scaleY: [1, .96, 1.04, 1] },
  jelly: { y: [0, 3, -26, 0, -14, 0], rotate: [0, -4, 4, 0], scaleX: [1, 1.1, .93, 1], scaleY: [1, .88, 1.12, 1] },
  rano: { y: [0, 2, -12, 0], rotate: [0, -10, 8, 0], scaleX: [1, 1.08, .95, 1], scaleY: [1, .94, 1.08, 1] },
  dochi: { y: [0, -4, -8, 0], rotate: [0, -15, 15, -8, 0], scaleX: [1, .96, 1.04, 1], scaleY: [1, 1.04, .96, 1] },
  ggulgguli: { y: [0, -8, 0], rotate: [0, -7, 7, 0], scaleX: [1, 1.12, .96, 1], scaleY: [1, .9, 1.08, 1] },
  eumme: { y: [0, -13, -7, 0], rotate: [0, -4, 4, 0], scaleX: [1, 1.03, .98, 1], scaleY: [1, .98, 1.03, 1] },
  nurungji: { y: [0, -19, 0, -8, 0], rotate: [0, -9, 9, -5, 0], scaleX: [1, .96, 1.05, 1], scaleY: [1, 1.06, .95, 1] },
  pingu: { y: [0, -5, 0, -4, 0], rotate: [0, -13, 13, -7, 0], scaleX: [1, 1.04, .98, 1], scaleY: [1, .97, 1.04, 1] },
};
export function buddyPlayMotion(buddy: CharacterId, action: 'happy' | 'eat' | 'sleep' | 'ride' = 'happy') {
  const motion = MOTIONS[buddy];
  const factor = action === 'sleep' ? .12 : action === 'eat' ? .5 : action === 'ride' ? .3 : 1;
  return { animate: { y: motion.y.map(n => n * factor), rotate: motion.rotate.map(n => n * factor),
    scaleX: motion.scaleX.map(n => 1 + (n - 1) * factor), scaleY: motion.scaleY.map(n => 1 + (n - 1) * factor) }, transition: { duration: action === 'sleep' ? 1.5 : .7 } };
}

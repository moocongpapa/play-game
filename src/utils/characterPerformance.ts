import type { CharacterId } from '../types';

/** Small resonant colours preserve the saved youthful performance and its pitch. */
export const CHARACTER_PERFORMANCE: Record<CharacterId, { warmth: number; presence: number; air: number; chewBeat: number }> = {
  ggomi: { warmth: 420, presence: .7, air: -.5, chewBeat: 440 },
  rano: { warmth: 720, presence: 1.1, air: .3, chewBeat: 340 },
  jelly: { warmth: 1800, presence: 1.2, air: .8, chewBeat: 320 },
  dochi: { warmth: 1250, presence: .8, air: .2, chewBeat: 410 },
  ggulgguli: { warmth: 620, presence: 1.2, air: -.2, chewBeat: 360 },
  eumme: { warmth: 900, presence: .5, air: -.7, chewBeat: 490 },
  nurungji: { warmth: 1500, presence: 1, air: .5, chewBeat: 330 },
  pingu: { warmth: 2200, presence: .8, air: .7, chewBeat: 380 },
};

export function connectCharacterVoice(source: AudioBufferSourceNode, destination: AudioNode, ctx: AudioContext, character: string) {
  if (typeof ctx.createBiquadFilter !== 'function') { source.connect(destination); return () => {}; }
  const profile = CHARACTER_PERFORMANCE[character as CharacterId] || CHARACTER_PERFORMANCE.ggomi;
  const body = ctx.createBiquadFilter(), air = ctx.createBiquadFilter();
  body.type = 'peaking'; body.frequency.value = profile.warmth; body.Q.value = .7; body.gain.value = profile.presence;
  air.type = 'highshelf'; air.frequency.value = 4200; air.gain.value = profile.air;
  source.connect(body); body.connect(air); air.connect(destination);
  return () => { body.disconnect(); air.disconnect(); };
}

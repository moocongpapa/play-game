import type { Brush } from './model';

let ctx: AudioContext | undefined;
let noise: AudioBuffer | undefined;
let nextDrawSound = 0;

function audio() {
  ctx ??= new AudioContext();
  void ctx.resume();
  return ctx;
}

let rainbowNoteIdx = 0;

export type SoundEffect =
  | 'tap'
  | 'sticker'
  | 'fanfare'
  | 'magic'
  | 'pop'
  | 'clear';

export function playSound(kind: SoundEffect, muted: boolean) {
  if (muted) return;
  try {
    const context = audio(),
      now = context.currentTime;
    if (kind === 'fanfare') {
      const chords = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.14 },
        { f: 1046.5, d: 0.4 },
      ];
      chords.forEach((c, i) => {
        const t = now + i * 0.11,
          osc = context.createOscillator(),
          gain = context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(c.f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.065, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + c.d);
        osc.connect(gain).connect(context.destination);
        osc.start(t);
        osc.stop(t + c.d + 0.02);
      });
      return;
    }
    if (kind === 'magic') {
      const gliss = [587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
      gliss.forEach((f, i) => {
        const t = now + i * 0.045,
          osc = context.createOscillator(),
          gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.04, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain).connect(context.destination);
        osc.start(t);
        osc.stop(t + 0.19);
      });
      return;
    }
    if (kind === 'pop') {
      const osc = context.createOscillator(),
        gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.04);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain).connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.07);
      return;
    }
    const notes = kind === 'sticker' ? [660, 990] : [620];
    notes.forEach((f, i) => {
      const t = now + i * 0.12,
        osc = context.createOscillator(),
        gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(
        f * (kind === 'sticker' ? 1.3 : 1),
        t + 0.12,
      );
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.055, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain).connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {
    /* Drawing works without audio. */
  }
}

/** Short, quiet brush sounds stay responsive without piling up while scribbling. */
export function playDrawingSound(
  kind: Brush | 'fill',
  muted: boolean,
  strength = 0.5,
) {
  if (muted) return;
  try {
    const context = audio(),
      now = context.currentTime;
    if (kind !== 'fill' && now < nextDrawSound) return;
    nextDrawSound = now + (kind === 'water' ? 0.1 : 0.065);
    const energy = Math.max(0.25, Math.min(1, strength));

    if (kind === 'fill') {
      [330, 520].forEach((frequency, i) => {
        const start = now + i * 0.045,
          osc = context.createOscillator(),
          gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, start);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.68, start + 0.13);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(gain).connect(context.destination);
        osc.start(start);
        osc.stop(start + 0.17);
      });
      return;
    }

    if (kind === 'rainbow') {
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const freq = scale[rainbowNoteIdx % scale.length];
      rainbowNoteIdx++;
      const osc = context.createOscillator(),
        gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035 * energy, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain).connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }

    if (kind === 'neon') {
      const osc = context.createOscillator(),
        gain = context.createGain(),
        pitch = 880 + Math.random() * 320;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.022 * energy, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      osc.connect(gain).connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      return;
    }

    if (kind === 'bubble') {
      const osc = context.createOscillator(),
        gain = context.createGain(),
        startFreq = 340 + Math.random() * 220;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 2.3, now + 0.05);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.038 * energy, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain).connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      return;
    }

    if (kind === 'water') {
      const osc = context.createOscillator(),
        gain = context.createGain(),
        start = now + Math.random() * 0.012,
        pitch = 390 + Math.random() * 170;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, start);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.65, start + 0.09);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.026 * energy, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.13);
      return;
    }

    noise ??= (() => {
      const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      return buffer;
    })();
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain(),
      duration = kind === 'eraser' ? 0.095 : 0.075;
    source.buffer = noise;
    filter.type = 'bandpass';
    filter.frequency.value =
      kind === 'crayon' ? 720 : kind === 'pencil' ? 1450 : kind === 'pen' ? 1050 : 430;
    filter.Q.value = kind === 'pen' ? 4 : 0.8;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      (kind === 'pencil' ? 0.012 : kind === 'pen' ? 0.009 : 0.02) * energy,
      now + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(now, Math.random() * 0.8, duration);
    source.stop(now + duration);
  } catch {
    /* Drawing remains available when Web Audio is unavailable. */
  }
}

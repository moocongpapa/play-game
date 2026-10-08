export interface MusicTrack {
  id: string;
  name: string;
  bpm: number;
  instrument: 'musicbox' | 'marimba' | 'flute';
  notes: number[]; // MIDI pitches; 0 is a rest
  beats: number[];
  bass: number[];
}

// Original, gentle phrases. Different melodies, tempos and timbres, generated locally.
export const BACKGROUND_MUSIC: MusicTrack[] = [
  { id: 'picnic', name: '햇살 소풍', bpm: 96, instrument: 'marimba',
    notes: [72,76,79,76,74,77,81,79,76,74,72,74,76,79,76,72],
    beats: [1,.5,.5,2,1,.5,.5,2,1,1,1,1,.5,.5,1,2], bass: [48,53,55,48] },
  { id: 'cloud', name: '구름 산책', bpm: 80, instrument: 'flute',
    notes: [67,72,74,76,74,72,69,67,69,72,76,74,72,69,67,72],
    beats: [1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,3], bass: [48,57,53,55] },
  { id: 'stars', name: '별빛 오르골', bpm: 86, instrument: 'musicbox',
    notes: [79,76,72,0,81,79,76,74,77,74,71,0,76,74,72,0],
    beats: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2], bass: [48,57,55,48] },
  { id: 'garden', name: '꽃밭 왈츠', bpm: 100, instrument: 'marimba',
    notes: [65,69,72,74,72,69,67,70,74,76,74,70,69,72,77,76,72,69],
    beats: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], bass: [53,55,57,53] },
  { id: 'sea', name: '바닷가 조개', bpm: 88, instrument: 'flute',
    notes: [74,78,81,78,76,74,71,69,71,74,78,81,78,76,74,0],
    beats: [1,.5,.5,2,1,1,1,1,1,1,.5,.5,1,1,2,1], bass: [50,57,55,50] },
  { id: 'snow', name: '눈꽃 발자국', bpm: 92, instrument: 'musicbox',
    notes: [76,79,83,81,79,76,74,72,74,77,81,79,77,74,72,76],
    beats: [.5,.5,1,1,1,2,1,1,.5,.5,1,1,1,1,2,2], bass: [48,52,53,55] },
];

export const SLEEP_MUSIC: MusicTrack = { id: 'lullaby', name: '포근한 별빛 자장가', bpm: 58, instrument: 'musicbox',
  notes: [72,76,79,76,74,72,69,0,71,74,77,74,72,0,72,0], beats: [1,1,2,1,1,2,2,1,1,1,2,1,2,2,2,3], bass: [48,53,55,48] };

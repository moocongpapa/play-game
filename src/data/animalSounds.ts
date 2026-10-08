export const ANIMAL_RECORDINGS = {
  dog: '/audio/animals/dog.mp3', cat: '/audio/animals/cat.mp3',
  pig: '/audio/animals/pig.mp3', sheep: '/audio/animals/sheep.mp3',
  duck: '/audio/animals/duck.mp3', cow: '/audio/animals/cow.mp3',
  frog: '/audio/animals/frog.mp3', lion: '/audio/animals/lion.mp3',
  monkey: '/audio/animals/monkey.mp3', owl: '/audio/animals/owl.mp3',
  rooster: '/audio/animals/rooster.mp3', horse: '/audio/animals/horse.mp3',
  goat: '/audio/animals/goat.mp3', bird: '/audio/animals/bird.mp3',
} as const;

export type AnimalSoundId = keyof typeof ANIMAL_RECORDINGS;
const aliases: Record<string, AnimalSoundId> = {
  강아지: 'dog', 개: 'dog', nurungji: 'dog', 고양이: 'cat', 돼지: 'pig', ggulgguli: 'pig',
  양: 'sheep', eumme: 'sheep', 오리: 'duck', 소: 'cow', 젖소: 'cow', 개구리: 'frog',
  사자: 'lion', 원숭이: 'monkey', 부엉이: 'owl', 수탉: 'rooster', 닭: 'rooster',
  말: 'horse', 염소: 'goat', 새: 'bird',
};

export function resolveAnimalSound(value: string): AnimalSoundId | undefined {
  const key = value.toLowerCase().replace(/_sound$/, '');
  // Exact matching prevents 개구리/고양이/염소 from matching 개/양/소.
  return Object.hasOwn(ANIMAL_RECORDINGS, key) ? key as AnimalSoundId : aliases[key];
}

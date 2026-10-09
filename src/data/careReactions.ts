/** Short actions are deliberately shared across foods and scenes to reuse saved voices. */
export const CARE_REACTIONS = {
  chew: { ko: '우걱우걱!', en: 'Munch munch!', sound: 'chew' },
  yum: { ko: '냠냠냠!', en: 'Nom nom!', sound: 'chew' },
  drink: { ko: '꿀꺽꿀꺽!', en: 'Gulp gulp!', sound: 'drink' },
  brush: { ko: '치카치카!', en: 'Brush brush!', sound: 'brush' },
  paste: { ko: '쭈욱, 쏙!', en: 'Squeeze, plop!', sound: 'bubble' },
  wipe: { ko: '쓱싹쓱싹!', en: 'Wipe wipe!', sound: 'brush' },
  rinse: { ko: '우르르르!', en: 'Swish swish!', sound: 'drink' },
  spit: { ko: '퉤!', en: 'Ptoo!', sound: 'bubble' },
} as const;
export type CareReaction = keyof typeof CARE_REACTIONS;
export const CARE_REACTION_SPEECH = Object.values(CARE_REACTIONS).map(({ ko, en }) => [ko, en] as const);

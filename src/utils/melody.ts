export interface MelodyNote { key: number; at: number }
/** Keep the child's order and rhythm, bounded to a short, gently paced echo. */
export function makeMelodyEcho(notes: readonly MelodyNote[]): MelodyNote[] {
  const phrase = notes.filter(note => Number.isInteger(note.key) && note.key >= 0 && note.key < 8 && Number.isFinite(note.at)).slice(-6);
  let at = 0;
  return phrase.map((note, index) => {
    if (index) at += Math.max(160, Math.min(550, note.at - phrase[index - 1].at));
    return { key: note.key, at };
  });
}

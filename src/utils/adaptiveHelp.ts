export type HelpLevel = 0 | 1 | 2;

/** Help follows this question's effort, never a permanent label on the child. */
export function adaptiveHelpLevel(misses: number, idleLevel: HelpLevel = 0): HelpLevel {
  const effortLevel = misses >= 4 ? 2 : misses >= 2 ? 1 : 0;
  return Math.max(effortLevel, idleLevel) as HelpLevel;
}

/** Keep the answer and at least one alternative clear, in their original positions. */
export function softenedChoiceIds(ids: readonly string[], answerId: string, level: HelpLevel): string[] {
  if (!level || !ids.includes(answerId)) return [];
  const alternatives = ids.filter(id => id !== answerId);
  const clearAlternatives = level === 2 ? 1 : 2;
  return alternatives.slice(clearAlternatives);
}

/** A little extra reach helps small fingers without attracting objects across the board. */
export function adaptiveMagnetTolerance(baseTolerance: number, level: HelpLevel): number {
  return Math.min(130, Math.max(0, baseTolerance) + level * 20);
}

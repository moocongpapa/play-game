import { Hand } from 'lucide-react';
import type { HelpLevel } from '../utils/gentleHelp';

export function GentleHint({ level, text, motion = 'tap' }: { level: HelpLevel | number; text: string; motion?: 'tap' | 'rub' }) {
  if (!level) return null;
  return <span className={`gentle-hint gentle-${motion}`} data-level={level} aria-hidden="true"><Hand /><span>{text}</span></span>;
}

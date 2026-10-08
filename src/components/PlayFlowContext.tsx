import { createContext, type ReactNode } from 'react';
import type { CharacterId } from '../types';

export const PlayVoiceContext = createContext<{ buddy: CharacterId; soundEnabled: boolean } | null>(null);
export const DayContinuationContext = createContext<{ onNext: () => void; label: string; picture: ReactNode } | null>(null);

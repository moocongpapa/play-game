import { createContext } from 'react';
import type { CharacterId } from '../types';

export const PlayVoiceContext = createContext<{ buddy: CharacterId; soundEnabled: boolean } | null>(null);
export const PlayHintsPausedContext = createContext(false);
export const DayContinuationContext = createContext<{ onNext: () => void } | null>(null);

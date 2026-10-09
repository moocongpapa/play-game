import { useEffect } from 'react';
import { warmCareReactions } from '../utils/soundEngine';

export function useCareReactions(characterId: string, enabled: boolean) {
  useEffect(() => { warmCareReactions(characterId, enabled); }, [characterId, enabled]);
}

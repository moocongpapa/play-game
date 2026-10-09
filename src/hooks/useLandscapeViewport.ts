import { useSyncExternalStore } from 'react';

const query = '(orientation: landscape)';
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;

/** Follow rotation without remounting the theater or changing sound preferences. */
export function useLandscapeViewport() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

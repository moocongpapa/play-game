import { useEffect } from 'react';

export function useViewportLock() {
  useEffect(() => {
    const editable = (target: EventTarget | null) => target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], [data-native-input]');
    const block = (event: Event) => { if (!editable(event.target) && event.cancelable) event.preventDefault(); };
    const gesture = (event: Event) => { if (event.cancelable) event.preventDefault(); };
    // CSS handles pointer gestures; Safari gesture events cover pinch/zoom on older engines.
    document.addEventListener('contextmenu', block);
    document.addEventListener('selectstart', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('gesturestart', gesture, { passive: false });
    document.addEventListener('gesturechange', gesture, { passive: false });
    return () => {
      document.removeEventListener('contextmenu', block); document.removeEventListener('selectstart', block);
      document.removeEventListener('dragstart', block); document.removeEventListener('gesturestart', gesture);
      document.removeEventListener('gesturechange', gesture);
    };
  }, []);
}

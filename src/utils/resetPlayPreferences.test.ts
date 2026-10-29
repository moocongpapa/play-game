import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedDB } from 'fake-indexeddb';
import { resetPlayPreferences } from './resetPlayPreferences';
import { loadDraft, saveDraft, saveGallery, listGallery } from '../sketch/storage';
import { saveAudio, readSavedAudio } from '../services/audioCache';
import type { Artwork } from '../sketch/model';

test('resetting play preferences preserves the only copy of drafts, gallery and saved audio', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: indexedDB });
  try {
    const art: Artwork = { version: 1, id: 'kept-picture', updatedAt: 1, background: 'white', template: null, fills: {}, stickers: [], strokes: [] };
    await saveDraft(art); await saveGallery(art, 'data:image/png;base64,saved');
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    await saveAudio({ key: 'kept-voice', bytes, playbackRate: 1, savedAt: 1 });
    const values = new Map(['ITSME_APP_STATE', 'ITSME_CHILD_PROFILE', 'ITSME_GEMINI_TTS_ENABLED', 'unrelated'].map(key => [key, 'saved']));
    resetPlayPreferences({ removeItem: key => { values.delete(key); } });
    assert.deepEqual([...values.keys()], ['unrelated']);
    assert.equal((await loadDraft())?.id, art.id);
    assert.equal((await listGallery())[0]?.artwork.id, art.id);
    assert.deepEqual((await readSavedAudio('kept-voice'))?.bytes, bytes);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'indexedDB', descriptor); else Reflect.deleteProperty(globalThis, 'indexedDB');
  }
});

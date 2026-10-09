/** Compressed audio survives reloads. Storage is optional and never delays play indefinitely. */
export interface SavedAudio { key: string; bytes: ArrayBuffer; playbackRate: number; savedAt: number }
export const AUDIO_CACHE_LIMIT = 12 * 1024 * 1024;
export const AUDIO_CACHE_ENTRIES = 200;
let opening: Promise<IDBDatabase | null> | null = null;

function database(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!opening) opening = new Promise(resolve => {
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (settled) { db?.close(); return; }
      settled = true; clearTimeout(timeout); resolve(db);
    };
    const timeout = setTimeout(() => finish(null), 500);
    try {
      const request = indexedDB.open('yuha-character-audio', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('clips', { keyPath: 'key' });
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); opening = null; };
        finish(request.result);
      };
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
    } catch { finish(null); }
  });
  return opening;
}

export async function readSavedAudio(key: string): Promise<SavedAudio | null> {
  const db = await database();
  if (!db) return null;
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(null), 500);
    const finish = (clip: SavedAudio | null) => { clearTimeout(timeout); resolve(clip); };
    try {
      const request = db.transaction('clips').objectStore('clips').get(key);
      request.onsuccess = () => finish(request.result || null);
      request.onerror = () => finish(null);
    } catch { finish(null); }
  });
}

export async function saveAudio(clip: SavedAudio): Promise<void> {
  if (!clip.bytes.byteLength || clip.bytes.byteLength > 2 * 1024 * 1024) return;
  const db = await database();
  if (!db) return;
  return new Promise(resolve => {
    try {
      const transaction = db.transaction('clips', 'readwrite');
      const timeout = setTimeout(() => { try { transaction.abort(); } catch { /* Finished. */ } resolve(); }, 1500);
      const finish = () => { clearTimeout(timeout); resolve(); };
      transaction.oncomplete = finish; transaction.onerror = finish; transaction.onabort = finish;
      const clips = transaction.objectStore('clips');
      clips.put(clip);
      const request = clips.getAll();
      request.onsuccess = () => {
        const rows = (request.result as SavedAudio[]).sort((a, b) => a.savedAt - b.savedAt);
        let bytes = rows.reduce((size, row) => size + row.bytes.byteLength, 0);
        let count = rows.length;
        for (const row of rows) {
          if (bytes <= AUDIO_CACHE_LIMIT && count <= AUDIO_CACHE_ENTRIES) break;
          clips.delete(row.key); bytes -= row.bytes.byteLength; count--;
        }
      };
    } catch { resolve(); }
  });
}

export async function deleteSavedAudio(key: string) {
  const db = await database();
  try { db?.transaction('clips', 'readwrite').objectStore('clips').delete(key); } catch { /* Optional storage. */ }
}

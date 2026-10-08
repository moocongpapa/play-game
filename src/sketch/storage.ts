import { type Artwork, validArtwork } from './model';
export type SavedArt = {
  id: string;
  artwork: Artwork;
  thumbnail: string;
  updatedAt: number;
};
let connection: Promise<IDBDatabase> | undefined;
function db() {
  if (!connection)
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('yuha-sketchbook', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('draft');
        req.result.createObjectStore('gallery', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        const d = req.result;
        d.onversionchange = () => {
          d.close();
          connection = undefined;
        };
        resolve(d);
      };
      req.onerror = () => {
        connection = undefined;
        reject(req.error);
      };
    });
  return connection;
}
async function transaction<T>(
  name: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(name, mode);
    const req = run(tx.objectStore(name));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('저장 중단'));
  });
}
export async function loadDraft() {
  const d = await transaction('draft', 'readonly', (s) => s.get('current'));
  return validArtwork(d) ? d : null;
}
export function saveDraft(a: Artwork) {
  return transaction('draft', 'readwrite', (s) => s.put(a, 'current'));
}
export function saveGallery(a: Artwork, thumbnail: string) {
  return transaction('gallery', 'readwrite', (s) =>
    s.put({
      id: a.id,
      artwork: a,
      thumbnail,
      updatedAt: Date.now(),
    } satisfies SavedArt),
  );
}
export async function listGallery() {
  const all = await transaction<SavedArt[]>('gallery', 'readonly', (s) =>
    s.getAll(),
  );
  return all
    .filter((x) => validArtwork(x.artwork))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function deleteGallery(id: string) {
  return transaction('gallery', 'readwrite', (s) => s.delete(id));
}

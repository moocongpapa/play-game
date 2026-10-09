import manifestSource from '../../public/videos/portrait-manifest.json?raw';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import type { CharacterId } from '../types';

interface PortraitVideoMetadata {
  width: number;
  height: number;
  revision: string;
}

const portraitManifest = JSON.parse(manifestSource) as Partial<Record<CharacterId, PortraitVideoMetadata>>;

/** Completed films can replace their legacy counterparts independently. */
export function getCharacterVideoPresentation(id: CharacterId) {
  const metadata = portraitManifest[id];
  const versioned = (url: string) => metadata?.revision
    ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(metadata.revision)}`
    : url;
  return {
    videoUrl: versioned(CHARACTER_VIDEOS[id].videoUrl || `/videos/${id}.mp4`),
    posterUrl: versioned(`/videos/posters/${id}.jpg`),
    aspectRatio: metadata && Number.isFinite(metadata.width) && Number.isFinite(metadata.height) && metadata.width > 0 && metadata.height > 0
      ? metadata.width / metadata.height
      : 16 / 9,
  };
}

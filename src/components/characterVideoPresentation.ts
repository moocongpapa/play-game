import manifestSource from '../../public/videos/portrait-manifest.json?raw';
import landscapeManifestSource from '../../public/videos/landscape-manifest.json?raw';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import type { CharacterId } from '../types';

interface PortraitVideoMetadata {
  width: number;
  height: number;
  revision: string;
}

const portraitManifest = JSON.parse(manifestSource) as Partial<Record<CharacterId, PortraitVideoMetadata>>;
const landscapeManifest = JSON.parse(landscapeManifestSource) as Partial<Record<CharacterId, PortraitVideoMetadata>>;

/** Completed films can replace their legacy counterparts independently. */
export function getCharacterVideoPresentation(id: CharacterId, landscape = false) {
  const useLandscape = landscape && !!landscapeManifest[id];
  const metadata = useLandscape ? landscapeManifest[id] : portraitManifest[id];
  const versioned = (url: string) => metadata?.revision
    ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(metadata.revision)}`
    : url;
  return {
    videoUrl: versioned(useLandscape ? `/videos/landscape/${id}.mp4` : CHARACTER_VIDEOS[id].videoUrl || `/videos/${id}.mp4`),
    posterUrl: versioned(useLandscape ? `/videos/landscape/posters/${id}.jpg` : `/videos/posters/${id}.jpg`),
    aspectRatio: metadata && Number.isFinite(metadata.width) && Number.isFinite(metadata.height) && metadata.width > 0 && metadata.height > 0
      ? metadata.width / metadata.height
      : 16 / 9,
  };
}

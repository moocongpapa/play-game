import manifestSource from '../../public/videos/portrait-manifest.json?raw';
import landscapeManifestSource from '../../public/videos/landscape-manifest.json?raw';
import adventureManifestSource from '../../public/videos/adventure-manifest.json?raw';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import type { CharacterId } from '../types';

export type VideoFormat = 'adventure' | 'portrait' | 'landscape';

interface VideoMetadata {
  width: number;
  height: number;
  revision: string;
  title?: string;
  location?: string;
  duration?: number;
  scenes?: number;
}

const portraitManifest = JSON.parse(manifestSource) as Partial<Record<CharacterId, VideoMetadata>>;
const landscapeManifest = JSON.parse(landscapeManifestSource) as Partial<Record<CharacterId, VideoMetadata>>;
const adventureManifest = JSON.parse(adventureManifestSource) as Partial<Record<CharacterId, VideoMetadata>>;

export function hasCharacterAdventureVideo(id: CharacterId): boolean {
  return !!adventureManifest[id];
}

/** Completed films can replace their legacy counterparts independently. */
export function getCharacterVideoPresentation(id: CharacterId, format: VideoFormat = 'portrait') {
  const useLandscape = format === 'landscape' && !!landscapeManifest[id];
  const useAdventure = format === 'adventure' && !!adventureManifest[id];
  const metadata = useLandscape
    ? landscapeManifest[id]
    : useAdventure
      ? adventureManifest[id]
      : portraitManifest[id];
  const versioned = (url: string) => metadata?.revision
    ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(metadata.revision)}`
    : url;
  const baseVideoUrl = useLandscape
    ? `/videos/landscape/${id}.mp4`
    : useAdventure
      ? `/videos/adventure/${id}.mp4`
      : CHARACTER_VIDEOS[id].videoUrl || `/videos/${id}.mp4`;
  const basePosterUrl = useLandscape
    ? `/videos/landscape/posters/${id}.jpg`
    : useAdventure
      ? `/videos/adventure/posters/${id}.jpg`
      : `/videos/posters/${id}.jpg`;

  return {
    videoUrl: versioned(baseVideoUrl),
    posterUrl: versioned(basePosterUrl),
    aspectRatio: metadata && Number.isFinite(metadata.width) && Number.isFinite(metadata.height) && metadata.width > 0 && metadata.height > 0
      ? metadata.width / metadata.height
      : (useLandscape ? 16 / 9 : 9 / 16),
    hasLandscape: !!landscapeManifest[id],
    hasAdventure: !!adventureManifest[id],
    isLandscape: useLandscape,
    isAdventure: useAdventure,
    adventureLocation: adventureManifest[id]?.location,
    duration: metadata?.duration ?? (useLandscape || useAdventure ? 30 : 76),
    episodeTitle: metadata?.title || CHARACTER_VIDEOS[id].title,
  };
}

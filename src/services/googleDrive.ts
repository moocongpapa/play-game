import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import { CharacterId } from '../types';

// Support Vercel migration env variables, falling back to local config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket || "yuha-game.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
};

// Reuse existing app or initialize new
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedDriveFiles: DriveVideoFile[] = [];
const blobUrlCache: Record<string, string> = {};

export const GOOGLE_DRIVE_FOLDER_ID = '1dPMaJGI67gWZYaNitLPPiITCYGIs9QNs';

export interface DriveVideoFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  blobUrl?: string;
}

export const CHARACTER_FILE_KEYWORDS: Record<CharacterId, string[]> = {
  ggomi: ['ggomi', '꼬미', 'bear', '곰이'],
  rano: ['rano', '라노', 'dino', '공룡'],
  jelly: ['jelly', '젤리', 'rabbit', '토끼'],
  dochi: ['dochi', '도치', 'hedgehog', '고슴도치'],
  ggulgguli: ['ggulgguli', '꿀꿀이', 'pig', '돼지'],
  eumme: ['eumme', '음메', 'cow', '소'],
  nurungji: ['nurungji', '누룽지', 'cat', '고양이'],
  pingu: ['pingu', '핑구', 'penguin', '펭귄'],
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try getting token or prompt sign in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google 드라이브 접근 토큰을 받아오지 못했습니다.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedDriveFiles = (): DriveVideoFile[] => {
  return cachedDriveFiles;
};

export const logout = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
  cachedDriveFiles = [];
};

/**
 * Fetch video files list from the specified Google Drive folder
 */
export const fetchDriveFolderVideos = async (
  folderId: string = GOOGLE_DRIVE_FOLDER_ID,
  accessToken: string | null = cachedAccessToken
): Promise<DriveVideoFile[]> => {
  if (!accessToken) {
    throw new Error('Google 로그인이 필요합니다.');
  }

  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,webContentLink,webViewLink,thumbnailLink)&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google 드라이브 파일 목록 가져오기 실패: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const files: DriveVideoFile[] = (data.files || []).filter(
    (file: DriveVideoFile) =>
      file.mimeType.startsWith('video/') ||
      file.name.endsWith('.mp4') ||
      file.name.endsWith('.webm') ||
      file.name.endsWith('.mov') ||
      file.name.endsWith('.mkv') ||
      file.name.endsWith('.gif')
  );

  cachedDriveFiles = files;
  return files;
};

/**
 * Fetch binary stream from Google Drive for a file and convert to playable Blob URL
 */
export const fetchDriveVideoBlobUrl = async (
  fileId: string,
  accessToken: string | null = cachedAccessToken
): Promise<string> => {
  if (blobUrlCache[fileId]) {
    return blobUrlCache[fileId];
  }

  if (!accessToken) {
    throw new Error('Google 로그인이 필요합니다.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`구글 드라이브 비디오 스트림 로드 실패: ${response.status}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  blobUrlCache[fileId] = blobUrl;
  return blobUrl;
};

/**
 * Find the Drive video file for a specific character ID
 */
export const findDriveFileForCharacter = (
  charId: CharacterId,
  files: DriveVideoFile[] = cachedDriveFiles
): DriveVideoFile | null => {
  if (!files || files.length === 0) return null;
  const keywords = CHARACTER_FILE_KEYWORDS[charId] || [charId];

  for (const kw of keywords) {
    const match = files.find((f) => f.name.toLowerCase().includes(kw.toLowerCase()));
    if (match) return match;
  }

  return null;
};

import { shuffle } from './roundDeck';
/**
 * Age Calculation & Difficulty Engine
 * 아이 생년월일 → 월령 계산 → 연령 그룹 배정 → 난이도 설정 반환
 */

import { AgeGroup, DifficultyConfig, GameId, ChildProfile } from '../types';

/**
 * 기본 아이 프로필 (유하, 2023-01-03)
 */
export function createChildProfile(name: string = '유하', birthDate: string = '2023-01-03'): ChildProfile {
  const ageMonths = calculateAgeMonths(birthDate);
  const ageGroup = determineAgeGroup(ageMonths);
  return {
    name: name.trim() || '유하',
    birthDate,
    ageMonths,
    ageGroup,
  };
}

export const DEFAULT_CHILD_PROFILE: ChildProfile = {
  name: '유하',
  birthDate: '2023-01-03',
  ageMonths: 43,
  ageGroup: 'sprout',
};

/**
 * 생년월일 문자열(YYYY-MM-DD)로부터 현재 월령(개월 수)을 계산합니다.
 */
export function calculateAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months += now.getMonth() - birth.getMonth();
  
  // 일자 보정: 아직 생일이 안 지났으면 1개월 차감
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  
  return Math.max(0, months);
}

/**
 * 월령으로부터 연령 그룹을 결정합니다.
 */
export function determineAgeGroup(months: number): AgeGroup {
  if (months < 36) return 'baby';       // 🐣 아기반 (24-35개월)
  if (months < 48) return 'sprout';     // 🌱 새싹반 (36-47개월)
  if (months < 60) return 'bloom';      // 🌻 꽃잎반 (48-59개월)
  return 'star';                         // 🌟 별님반 (60개월+)
}

/**
 * 연령 그룹별 난이도 설정을 반환합니다.
 */
export function getDifficultyConfig(ageGroup: AgeGroup): DifficultyConfig {
  switch (ageGroup) {
    case 'baby':
      return {
        ageGroup: 'baby',
        label: '아기반',
        emoji: '🐣',
        optionCount: 2,
        timeLimit: 0,           // 무제한
        hintEnabled: true,
        hintDelaySec: 5,        // 5초 후 자동 힌트
        starsPerCorrect: 3,     // 쉬우므로 격려차 많이 줌
        countingRange: [1, 3],
      };
    case 'sprout':
      return {
        ageGroup: 'sprout',
        label: '새싹반',
        emoji: '🌱',
        optionCount: 4,         // 4지선다로 업그레이드하여 인지 집중력 강화
        timeLimit: 0,           // 무제한
        hintEnabled: true,
        hintDelaySec: 10,       // 10초 후 음성 힌트
        starsPerCorrect: 2,
        countingRange: [1, 7],  // 수 세기 1~7까지 확장
      };
    case 'bloom':
      return {
        ageGroup: 'bloom',
        label: '꽃잎반',
        emoji: '🌻',
        optionCount: 4,
        timeLimit: 30,
        hintEnabled: false,
        hintDelaySec: 0,
        starsPerCorrect: 2,
        countingRange: [1, 10],
      };
    case 'star':
      return {
        ageGroup: 'star',
        label: '별님반',
        emoji: '🌟',
        optionCount: 4,
        timeLimit: 20,
        hintEnabled: false,
        hintDelaySec: 0,
        starsPerCorrect: 3,     // 어려우므로 보상 많이
        countingRange: [1, 20],
      };
  }
}

/**
 * 연령 그룹별 사용 가능한 게임 목록을 반환합니다.
 */
export function getAvailableGames(ageGroup: AgeGroup): GameId[] {
  const baseGames: GameId[] = [
    'object_recognition',
    'shape_color',
    'korean_letters',
    'sound_quiz',
    'counting_food',
    'cloud_shapes',
    'treasure_hunt',
    'tooth_brush', 'feeding', 'bubble_pop', 'peekaboo_hide', 'animal_xylophone',
  ];

  switch (ageGroup) {
    case 'baby':
      // 아기반: 기본 7개 + 감정 인지 + 크기 비교 (단순)
      return [...baseGames, 'emotion_quiz', 'size_comparison'];
    case 'sprout':
      // 새싹반: 기본 7개 + 감정 인지 + 크기 비교 + 패턴 + 리듬
      return [...baseGames, 'emotion_quiz', 'size_comparison', 'pattern_sequence', 'rhythm_game'];
    case 'bloom':
      // 꽃잎반: 전체
      return [...baseGames, 'emotion_quiz', 'pattern_sequence', 'word_puzzle', 'rhythm_game', 'size_comparison'];
    case 'star':
      // 별님반: 전체
      return [...baseGames, 'emotion_quiz', 'pattern_sequence', 'word_puzzle', 'rhythm_game', 'size_comparison'];
  }
}

/**
 * 연령 그룹 이모지를 반환합니다.
 */
export function getAgeGroupEmoji(group: AgeGroup): string {
  const map: Record<AgeGroup, string> = {
    baby: '🐣',
    sprout: '🌱',
    bloom: '🌻',
    star: '🌟',
  };
  return map[group];
}

/**
 * 연령 그룹 한글 레이블을 반환합니다.
 */
export function getAgeGroupLabel(group: AgeGroup): string {
  const map: Record<AgeGroup, string> = {
    baby: '아기반',
    sprout: '새싹반',
    bloom: '꽃잎반',
    star: '별님반',
  };
  return map[group];
}

/**
 * 연령 그룹에 맞는 한글 카운트 배열을 반환합니다.
 */
export function getKoreanCounts(ageGroup: AgeGroup): string[] {
  const config = getDifficultyConfig(ageGroup);
  const allCounts = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
    '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];
  return allCounts.slice(0, config.countingRange[1] + 1);
}

/**
 * 연령 그룹별 월령 범위 설명을 반환합니다.
 */
export function getAgeGroupDescription(group: AgeGroup): string {
  const map: Record<AgeGroup, string> = {
    baby: '24~35개월 (만 2세)',
    sprout: '36~47개월 (만 3세)',
    bloom: '48~59개월 (만 4세)',
    star: '60개월 이상 (만 5세+)',
  };
  return map[group];
}

/**
 * 배열에서 랜덤으로 N개 항목을 선택합니다 (게임에서 공통 사용).
 */
export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

/**
 * 배열에서 특정 항목을 제외하고 랜덤으로 N개를 선택합니다.
 */
export function pickDistractors<T extends { id: string }>(
  pool: T[],
  excludeId: string,
  count: number
): T[] {
  const filtered = pool.filter((item) => item.id !== excludeId);
  return pickRandom(filtered, count);
}

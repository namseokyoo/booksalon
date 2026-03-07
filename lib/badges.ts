/**
 * Badge System - 독서 배지 정의 및 달성 판정
 *
 * 북살롱 Phase 3-2 - 게이미피케이션 배지 시스템
 *
 * @description
 * DB 테이블 없이 프론트엔드에서 배지 조건을 정의하고,
 * 독서 로그 + 활동 데이터를 기반으로 달성 여부를 판단합니다.
 */

export interface BadgeStats {
  reading: number
  completed: number
  wantToRead: number
  totalPosts: number
  totalComments: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'reading' | 'community' | 'special'
  condition: (stats: BadgeStats) => boolean
  /** 배지 달성에 필요한 목표 수치 (진행률 계산용) */
  target: (stats: BadgeStats) => { current: number; goal: number }
}

/**
 * 전체 배지 목록
 */
export const BADGES: Badge[] = [
  // 독서 배지
  {
    id: 'first_book',
    name: '첫 번째 책',
    description: '첫 번째 책을 완독하세요',
    icon: 'BookOpen',
    category: 'reading',
    condition: (stats) => stats.completed >= 1,
    target: (stats) => ({ current: stats.completed, goal: 1 }),
  },
  {
    id: 'bookworm',
    name: '책벌레',
    description: '5권의 책을 완독하세요',
    icon: 'Bug',
    category: 'reading',
    condition: (stats) => stats.completed >= 5,
    target: (stats) => ({ current: stats.completed, goal: 5 }),
  },
  {
    id: 'avid_reader',
    name: '다독가',
    description: '10권의 책을 완독하세요',
    icon: 'Library',
    category: 'reading',
    condition: (stats) => stats.completed >= 10,
    target: (stats) => ({ current: stats.completed, goal: 10 }),
  },
  {
    id: 'bibliophile',
    name: '애서가',
    description: '20권의 책을 완독하세요',
    icon: 'Trophy',
    category: 'reading',
    condition: (stats) => stats.completed >= 20,
    target: (stats) => ({ current: stats.completed, goal: 20 }),
  },

  // 커뮤니티 배지
  {
    id: 'first_post',
    name: '첫 글',
    description: '첫 번째 게시물을 작성하세요',
    icon: 'PenLine',
    category: 'community',
    condition: (stats) => stats.totalPosts >= 1,
    target: (stats) => ({ current: stats.totalPosts, goal: 1 }),
  },
  {
    id: 'active_writer',
    name: '활발한 작가',
    description: '게시물을 10개 이상 작성하세요',
    icon: 'Pen',
    category: 'community',
    condition: (stats) => stats.totalPosts >= 10,
    target: (stats) => ({ current: stats.totalPosts, goal: 10 }),
  },
  {
    id: 'commentator',
    name: '토론가',
    description: '댓글을 20개 이상 작성하세요',
    icon: 'MessageCircle',
    category: 'community',
    condition: (stats) => stats.totalComments >= 20,
    target: (stats) => ({ current: stats.totalComments, goal: 20 }),
  },

  // 특별 배지
  {
    id: 'explorer',
    name: '탐험가',
    description: '읽고 싶은 책을 5권 이상 등록하세요',
    icon: 'Search',
    category: 'special',
    condition: (stats) => stats.wantToRead >= 5,
    target: (stats) => ({ current: stats.wantToRead, goal: 5 }),
  },
  {
    id: 'multitasker',
    name: '멀티리더',
    description: '동시에 3권 이상의 책을 읽으세요',
    icon: 'Zap',
    category: 'special',
    condition: (stats) => stats.reading >= 3,
    target: (stats) => ({ current: stats.reading, goal: 3 }),
  },
]

/**
 * 달성한 배지 목록 반환
 */
export function getEarnedBadges(stats: BadgeStats): Badge[] {
  return BADGES.filter((badge) => badge.condition(stats))
}

/**
 * 배지 진행률 반환 (0~100)
 */
export function getProgress(badge: Badge, stats: BadgeStats): number {
  const { current, goal } = badge.target(stats)
  if (goal <= 0) return 0
  return Math.min(Math.round((current / goal) * 100), 100)
}

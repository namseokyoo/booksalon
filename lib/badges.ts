export interface BadgeStats {
  reading: number;
  completed: number;
  wantToRead: number;
  totalPosts: number;
  totalComments: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: '독서' | '커뮤니티' | '특별';
  condition: (stats: BadgeStats) => boolean;
  goal: number;
  getProgress: (stats: BadgeStats) => number;
}

export const badges: Badge[] = [
  {
    id: 'first_book', name: '첫 완독', description: '첫 번째 책을 완독했습니다',
    icon: '📚', category: '독서',
    condition: (s) => s.completed >= 1, goal: 1,
    getProgress: (s) => s.completed,
  },
  {
    id: 'bookworm', name: '책벌레', description: '5권의 책을 완독했습니다',
    icon: '🐛', category: '독서',
    condition: (s) => s.completed >= 5, goal: 5,
    getProgress: (s) => s.completed,
  },
  {
    id: 'avid_reader', name: '다독가', description: '10권의 책을 완독했습니다',
    icon: '📖', category: '독서',
    condition: (s) => s.completed >= 10, goal: 10,
    getProgress: (s) => s.completed,
  },
  {
    id: 'bibliophile', name: '애서가', description: '3권을 동시에 읽고 있습니다',
    icon: '📕', category: '독서',
    condition: (s) => s.reading >= 3, goal: 3,
    getProgress: (s) => s.reading,
  },
  {
    id: 'first_post', name: '첫 게시물', description: '첫 번째 게시물을 작성했습니다',
    icon: '✍️', category: '커뮤니티',
    condition: (s) => s.totalPosts >= 1, goal: 1,
    getProgress: (s) => s.totalPosts,
  },
  {
    id: 'active_writer', name: '활발한 작가', description: '10개의 게시물을 작성했습니다',
    icon: '🖊️', category: '커뮤니티',
    condition: (s) => s.totalPosts >= 10, goal: 10,
    getProgress: (s) => s.totalPosts,
  },
  {
    id: 'commentator', name: '댓글러', description: '20개의 댓글을 작성했습니다',
    icon: '💬', category: '커뮤니티',
    condition: (s) => s.totalComments >= 20, goal: 20,
    getProgress: (s) => s.totalComments,
  },
  {
    id: 'explorer', name: '탐험가', description: '5권을 읽고 싶은 목록에 추가했습니다',
    icon: '🔍', category: '특별',
    condition: (s) => s.wantToRead >= 5, goal: 5,
    getProgress: (s) => s.wantToRead,
  },
  {
    id: 'multitasker', name: '멀티태스커', description: '3권 동시 읽기 + 5개 게시물 작성',
    icon: '🎯', category: '특별',
    condition: (s) => s.reading >= 3 && s.totalPosts >= 5, goal: 5,
    getProgress: (s) => Math.min(s.reading, 3) + Math.min(s.totalPosts, 5),
  },
];

export function getEarnedBadges(stats: BadgeStats): Badge[] {
  return badges.filter((b) => b.condition(stats));
}

export function getProgress(badge: Badge, stats: BadgeStats): number {
  const current = badge.getProgress(stats);
  return Math.min(Math.round((current / badge.goal) * 100), 100);
}

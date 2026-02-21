import React from 'react';
import { badges, getEarnedBadges, getProgress, type BadgeStats, type Badge } from '../lib/badges';

interface BadgeListProps {
  stats: BadgeStats;
}

const BadgeList: React.FC<BadgeListProps> = ({ stats }) => {
  const earnedBadges = getEarnedBadges(stats);
  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const categories = ['독서', '커뮤니티', '특별'] as const;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">
          {earnedBadges.length} / {badges.length} 달성
        </p>
      </div>

      {categories.map((category) => {
        const categoryBadges = badges.filter((b) => b.category === category);
        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">{category}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {categoryBadges.map((badge) => {
                const earned = earnedIds.has(badge.id);
                const progress = getProgress(badge, stats);
                return (
                  <div
                    key={badge.id}
                    className={`relative p-3 rounded-xl text-center transition-all ${
                      earned
                        ? 'bg-white shadow-md border border-green-200'
                        : 'bg-gray-50 border border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className={`text-xs font-medium ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
                      {badge.name}
                    </p>
                    {earned ? (
                      <span className="absolute -top-1 -right-1 text-green-500 text-sm">✅</span>
                    ) : (
                      <>
                        <span className="absolute -top-1 -right-1 text-gray-400 text-xs">🔒</span>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {badge.getProgress(stats)} / {badge.goal}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeList;

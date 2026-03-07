import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Bug, Library, Trophy, PenLine, Pen, MessageCircle, Search, Zap, Lock } from 'lucide-react';
import { BADGES, getEarnedBadges, getProgress } from '../lib/badges';
import type { BadgeStats } from '../lib/badges';

interface BadgeListProps {
    stats: BadgeStats;
}

const LUCIDE_ICONS: Record<string, LucideIcon> = {
    BookOpen,
    Bug,
    Library,
    Trophy,
    PenLine,
    Pen,
    MessageCircle,
    Search,
    Zap,
};

const BadgeList: React.FC<BadgeListProps> = ({ stats }) => {
    const earnedBadges = getEarnedBadges(stats);
    const earnedIds = new Set(earnedBadges.map((b) => b.id));

    const categoryLabels: Record<string, string> = {
        reading: '독서',
        community: '커뮤니티',
        special: '특별',
    };

    const categories = ['reading', 'community', 'special'] as const;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">배지</h2>
                <span className="text-sm text-muted-foreground">
                    {earnedBadges.length} / {BADGES.length} 달성
                </span>
            </div>

            {categories.map((category) => {
                const categoryBadges = BADGES.filter((b) => b.category === category);
                if (categoryBadges.length === 0) return null;

                return (
                    <div key={category} className="mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            {categoryLabels[category]}
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {categoryBadges.map((badge) => {
                                const earned = earnedIds.has(badge.id);
                                const progress = getProgress(badge, stats);
                                const { current, goal } = badge.target(stats);

                                return (
                                    <div
                                        key={badge.id}
                                        className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                                            earned
                                                ? 'bg-surface border-primary-200 shadow-sm'
                                                : 'bg-muted border-border opacity-60'
                                        }`}
                                        title={earned ? `${badge.name} - ${badge.description}` : `${badge.description} (${current}/${goal})`}
                                    >
                                        {/* 아이콘 */}
                                        <div className={`mb-1.5 ${earned ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {earned ? (
                                                (() => {
                                                    const IconComponent = LUCIDE_ICONS[badge.icon];
                                                    return IconComponent ? <IconComponent className="w-8 h-8" /> : null;
                                                })()
                                            ) : (
                                                <Lock className="w-8 h-8" />
                                            )}
                                        </div>

                                        {/* 배지 이름 */}
                                        <span className={`text-xs font-medium text-center leading-tight ${
                                            earned ? 'text-foreground' : 'text-muted-foreground'
                                        }`}>
                                            {badge.name}
                                        </span>

                                        {/* 진행률 바 (미달성 시) */}
                                        {!earned && (
                                            <div className="w-full mt-2">
                                                <div className="w-full bg-muted rounded-full h-1.5">
                                                    <div
                                                        className="bg-primary h-1.5 rounded-full transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-0.5 block text-center">
                                                    {current}/{goal}
                                                </span>
                                            </div>
                                        )}

                                        {/* 달성 체크마크 */}
                                        {earned && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center shadow-sm">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
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

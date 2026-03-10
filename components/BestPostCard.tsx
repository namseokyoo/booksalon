import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

interface BestPostCardProps {
  title: string;
  bookTitle: string;
  likeCount: number;
  commentCount: number;
  formattedDate: string;
  onClick: () => void;
}

const BestPostCard: React.FC<BestPostCardProps> = ({
  title,
  bookTitle,
  likeCount,
  commentCount,
  formattedDate,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl shadow-sm border border-border py-2.5 px-3 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all duration-200"
    >
      <h3 className="font-medium text-foreground text-sm truncate">{title}</h3>
      <div className="flex items-center justify-between mt-0.5">
        <span className="min-w-0 flex-1 text-xs text-muted-foreground truncate mr-2">{bookTitle}</span>
        <div className="flex-shrink-0 flex gap-2 text-xs text-muted-foreground">
          <span aria-label={`좋아요 ${likeCount}개`} className="flex items-center gap-0.5">
            <Heart className="w-3.5 h-3.5" /> {likeCount}
          </span>
          <span aria-label={`댓글 ${commentCount}개`} className="flex items-center gap-0.5">
            <MessageCircle className="w-3.5 h-3.5" /> {commentCount}
          </span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default BestPostCard;

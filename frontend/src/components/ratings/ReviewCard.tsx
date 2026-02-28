import { Link } from 'react-router-dom';
import type { Rating } from '../../types';
import { timeAgo } from '../../utils/formatters';
import RatingStars from './RatingStars';

interface ReviewCardProps {
  rating: Rating;
}

export default function ReviewCard({ rating }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <Link to={`/profil/${rating.fromUserId}`} className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#F5F3EF] overflow-hidden">
            {rating.fromUserImage ? (
              <img src={rating.fromUserImage} alt={rating.fromUserName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#6B6560]">
                {rating.fromUserName?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profil/${rating.fromUserId}`} className="text-xs font-semibold hover:text-[#2D6A4F] transition-colors truncate block">
            {rating.fromUserName || 'Anonim'}
          </Link>
        </div>
        <RatingStars score={rating.score} size={14} />
        <span className="text-[10px] text-[#6B6560] shrink-0">{timeAgo(rating.createdAt)}</span>
      </div>
      {rating.comment && (
        <p className="text-sm text-[#1A1A1A] leading-relaxed ml-11">{rating.comment}</p>
      )}
    </div>
  );
}

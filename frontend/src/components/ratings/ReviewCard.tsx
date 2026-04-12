import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import type { Rating } from '../../types';
import { timeAgo } from '../../utils/formatters';
import RatingStars from './RatingStars';
import api from '../../config/api';
import toast from 'react-hot-toast';

interface ReviewCardProps {
  rating: Rating;
  currentUserId?: string;
  sellerId?: string;
  onRefresh?: () => void;
}

export default function ReviewCard({ rating, currentUserId, sellerId, onRefresh }: ReviewCardProps) {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const isBuyer = currentUserId === rating.fromUserId;
  const isSeller = currentUserId === sellerId;

  const handleDeleteComment = async () => {
    try {
      await api.delete(`/ratings/${rating._id}/comment`);
      toast.success('Yorum silindi (puan korundu)');
      onRefresh?.();
    } catch { toast.error('Hata'); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/ratings/${rating._id}/reply`, { reply: replyText.trim() });
      toast.success('Yanıt eklendi');
      setShowReplyForm(false);
      setReplyText('');
      onRefresh?.();
    } catch { toast.error('Hata'); }
  };

  const handleDeleteReply = async () => {
    try {
      await api.delete(`/ratings/${rating._id}/reply`);
      toast.success('Yanıt silindi');
      onRefresh?.();
    } catch { toast.error('Hata'); }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <Link to={`/profil/${rating.fromUserId}`} className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] overflow-hidden">
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
        {rating.isUpdated && (
          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-[#0077B6] bg-[#0077B6]/10 px-1.5 py-0.5 rounded-full">
            <RefreshCw size={8} />Güncellendi
          </span>
        )}
        <RatingStars score={rating.score} size={14} />
        <span className="text-[10px] text-[#6B6560] shrink-0">{timeAgo(rating.createdAt)}</span>
      </div>

      {/* Comment */}
      {rating.comment && !rating.commentDeleted && (
        <div className="flex items-start gap-2 ml-11">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed flex-1">{rating.comment}</p>
          {isBuyer && (
            <button onClick={handleDeleteComment} className="shrink-0 p-1 hover:bg-red-50 rounded-lg transition-colors" title="Yorumu sil">
              <Trash2 size={12} className="text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
      )}
      {rating.commentDeleted && (
        <p className="text-[11px] italic text-[var(--text-secondary)] ml-11">Bu yorum silindi</p>
      )}

      {/* Seller Reply */}
      {rating.seller_reply && (
        <div className="ml-11 mt-2 pl-3 border-l-2 border-[var(--accent-green)]/30">
          <p className="text-[10px] font-semibold text-[var(--accent-green)] mb-0.5">Satıcı Yanıtı</p>
          <div className="flex items-start gap-2">
            <p className="text-[12px] text-[var(--text-primary)] leading-relaxed flex-1">{rating.seller_reply}</p>
            {isSeller && (
              <button onClick={handleDeleteReply} className="shrink-0 p-1 hover:bg-red-50 rounded-lg transition-colors" title="Yanıtı sil">
                <Trash2 size={12} className="text-[var(--text-secondary)]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reply button for seller */}
      {isSeller && !rating.seller_reply && (
        <>
          {showReplyForm ? (
            <div className="ml-11 mt-2 space-y-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                rows={2}
                className="w-full px-3 py-2 bg-[var(--bg-input)] text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent-green)]"
              />
              <div className="flex gap-2">
                <button onClick={handleReply} className="px-3 py-1.5 text-[11px] font-medium bg-[var(--accent-green)] text-white rounded-lg hover:opacity-90">Yanıtla</button>
                <button onClick={() => setShowReplyForm(false)} className="px-3 py-1.5 text-[11px] font-medium bg-[var(--bg-input)] rounded-lg">İptal</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReplyForm(true)}
              className="ml-11 mt-2 flex items-center gap-1 text-[11px] font-medium text-[var(--accent-green)] hover:text-[#40916C] transition-colors"
            >
              <MessageSquare size={12} />Yanıtla
            </button>
          )}
        </>
      )}
    </div>
  );
}

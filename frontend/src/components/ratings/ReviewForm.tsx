import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import RatingStars from './RatingStars';
import Button from '../ui/Button';
import { useRatings } from '../../hooks/useRatings';

interface ReviewFormProps {
  fromUserId: string;
  toUserId: string;
  listingId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ fromUserId, toUserId, listingId, onSuccess }: ReviewFormProps) {
  const { t } = useTranslation();
  const { createRating } = useRatings();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) return;
    setLoading(true);
    const success = await createRating({ fromUserId, toUserId, listingId, score, comment });
    setLoading(false);
    if (success) {
      toast.success(t('success'));
      setScore(0);
      setComment('');
      onSuccess?.();
    } else {
      toast.error(t('error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-surface)] rounded-2xl p-4 shadow-sm space-y-3">
      <h4 className="text-sm font-semibold tracking-tight">{t('rating.writeReview')}</h4>
      <RatingStars score={score} interactive onChange={setScore} size={24} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder={t('rating.comment')}
        rows={3}
        className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
      />
      <Button type="submit" loading={loading} disabled={score === 0} size="sm">
        {t('rating.submit')}
      </Button>
    </form>
  );
}

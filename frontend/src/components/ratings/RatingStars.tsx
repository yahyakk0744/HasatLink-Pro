import { Star } from 'lucide-react';

interface RatingStarsProps {
  score: number;
  size?: number;
  interactive?: boolean;
  onChange?: (score: number) => void;
}

export default function RatingStars({ score, size = 16, interactive = false, onChange }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star
            size={size}
            className={i <= score ? 'text-[#A47148] fill-[#A47148]' : 'text-[#D6D0C8]'}
          />
        </button>
      ))}
    </div>
  );
}

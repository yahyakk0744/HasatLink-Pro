import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../config/api';
import type { Listing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';

interface StoryItem {
  _id: string;
  title: string;
  image: string;
  sellerName: string;
  sellerImage: string;
  price: number;
  type: string;
}

export default function StoriesSection() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [stories, setStories] = useState<StoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ listings: Listing[] }>('/listings', { params: { limit: '15', sort: 'newest' } })
      .then(({ data }) => {
        const items: StoryItem[] = data.listings
          .filter(l => l.images?.[0])
          .map(l => ({
            _id: l._id,
            title: l.title,
            image: l.images[0],
            sellerName: l.sellerName || '',
            sellerImage: l.sellerImage || '',
            price: l.price,
            type: l.type,
          }));
        setStories(items);
      })
      .catch(() => {});
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (stories.length === 0) return null;

  return (
    <div className="relative group/stories">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[var(--bg-surface)]/80 backdrop-blur rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/stories:opacity-100 transition-opacity"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[var(--bg-surface)]/80 backdrop-blur rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/stories:opacity-100 transition-opacity"
      >
        <ChevronRight size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-2 snap-x snap-mandatory"
      >
        {/* Create Story CTA */}
        {user && (
          <Link
            to="/ilan-ver"
            className="flex flex-col items-center shrink-0 snap-start"
          >
            <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[var(--bg-input)] to-[var(--bg-surface)] border-2 border-dashed border-[var(--accent-green)]/40 flex items-center justify-center hover:border-[var(--accent-green)] transition-colors">
              <Plus size={20} className="text-[var(--accent-green)]" />
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)] mt-1.5 text-center w-16 truncate">
              {lang === 'tr' ? 'İlan Ver' : 'Post'}
            </span>
          </Link>
        )}

        {/* Story Circles */}
        {stories.map(story => (
          <Link
            key={story._id}
            to={`/ilan/${story._id}`}
            className="flex flex-col items-center shrink-0 snap-start group"
          >
            <div className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-full p-[2.5px] bg-gradient-to-br from-[#2D6A4F] via-[#40916C] to-[#E76F00] hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-[var(--bg-surface)]">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Seller mini avatar */}
              {story.sellerImage && (
                <img
                  src={story.sellerImage}
                  alt=""
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-[var(--bg-surface)] object-cover"
                />
              )}
            </div>
            <span className="text-[10px] font-medium text-[var(--text-primary)] mt-1.5 text-center w-16 truncate">
              {story.sellerName || story.title.slice(0, 10)}
            </span>
            <span className="text-[9px] font-semibold text-[var(--accent-green)]">
              {formatPrice(story.price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

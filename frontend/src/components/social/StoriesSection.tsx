import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
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
  views: number;
}

interface StoryViewer {
  userId: string;
  name: string;
  profileImage: string;
}

export default function StoriesSection() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [stories, setStories] = useState<StoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewerSheet, setViewerSheet] = useState<{ storyId: string; title: string } | null>(null);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);

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
            views: l.stats?.views || 0,
          }));
        setStories(items);
      })
      .catch(() => {});
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const openViewers = (storyId: string, title: string) => {
    setViewerSheet({ storyId, title });
    setViewersLoading(true);
    api.get<{ viewers: StoryViewer[] }>(`/listings/${storyId}/viewers`)
      .then(({ data }) => setViewers(data.viewers || []))
      .catch(() => setViewers([]))
      .finally(() => setViewersLoading(false));
  };

  if (stories.length === 0) return null;

  return (
    <>
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
              to="/pazar"
              className="flex flex-col items-center shrink-0 snap-start"
            >
              <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[var(--bg-input)] to-[var(--bg-surface)] border-2 border-dashed border-[var(--accent-green)]/40 flex items-center justify-center hover:border-[var(--accent-green)] transition-colors">
                <Plus size={20} className="text-[var(--accent-green)]" />
              </div>
              <span className="text-[10px] font-medium text-[var(--text-secondary)] mt-1.5 text-center w-16 truncate">
                {lang === 'tr' ? 'Ilan Ver' : 'Post'}
              </span>
            </Link>
          )}

          {/* Story Circles */}
          {stories.map(story => (
            <div
              key={story._id}
              className="flex flex-col items-center shrink-0 snap-start group"
            >
              <Link
                to={`/ilan/${story._id}`}
                className="relative"
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
                {/* View count overlay */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                  <Eye size={8} className="text-white/80" />
                  <span className="text-[8px] font-semibold text-white">{story.views}</span>
                </div>
              </Link>
              {/* Eye button for own stories — opens viewer sheet */}
              {user && story.sellerName === user.name && story.views > 0 && (
                <button
                  onClick={(e) => { e.preventDefault(); openViewers(story._id, story.title); }}
                  className="mt-0.5 flex items-center gap-0.5 text-[8px] font-medium text-[var(--accent-green)] hover:underline"
                >
                  <Eye size={8} />
                  {lang === 'tr' ? 'Kimler gordu?' : 'Who viewed?'}
                </button>
              )}
              <span className="text-[10px] font-medium text-[var(--text-primary)] mt-1 text-center w-16 truncate">
                {story.sellerName || story.title.slice(0, 10)}
              </span>
              <span className="text-[9px] font-semibold text-[var(--accent-green)]">
                {formatPrice(story.price)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Viewer Bottom Sheet */}
      {viewerSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setViewerSheet(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-t-3xl border-t border-[var(--border-default)] shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--text-tertiary)]/30" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-[var(--border-default)]">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">{lang === 'tr' ? 'Goruntuleyenler' : 'Viewers'}</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate max-w-[200px]">{viewerSheet.title}</p>
              </div>
              <button onClick={() => setViewerSheet(null)} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* Viewer List */}
            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
              {viewersLoading ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <div className="w-6 h-6 border-2 border-[var(--accent-green)]/30 border-t-[var(--accent-green)] rounded-full animate-spin" />
                  <span className="text-xs text-[var(--text-secondary)]">{lang === 'tr' ? 'Yukleniyor...' : 'Loading...'}</span>
                </div>
              ) : viewers.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Eye size={24} className="text-[var(--text-tertiary)]" />
                  <span className="text-xs text-[var(--text-secondary)]">{lang === 'tr' ? 'Henuz goruntuleyen yok' : 'No viewers yet'}</span>
                </div>
              ) : (
                viewers.map(v => (
                  <Link
                    key={v.userId}
                    to={`/profil/${v.userId}`}
                    onClick={() => setViewerSheet(null)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    {v.profileImage ? (
                      <img src={v.profileImage} alt={v.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center text-sm font-semibold text-[var(--accent-green)]">
                        {v.name?.[0] || '?'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[var(--text-primary)]">{v.name}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

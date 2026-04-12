import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, User, ArrowRight } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFeatures } from '../hooks/useFeatures';
import { formatDate } from '../utils/formatters';
import type { Blog } from '../types';

export default function SuccessStoriesPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [stories, setStories] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blog?category=basari-hikayeleri')
      .then(({ data }) => setStories(data.blogs || []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  if (!featuresLoading && !isEnabled('successStories')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Trophy size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Başarı Hikayeleri Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">Çiftçi başarı öyküleri yakında burada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Başarı Hikayeleri - HasatLink" description="HasatLink ile başarıya ulaşan çiftçilerin hikayeleri." />

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Başarı Hikayeleri</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          HasatLink ile ürünlerini satan, yeni alıcılar bulan çiftçilerimizin ilham veren hikayeleri
        </p>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : stories.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Trophy size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Henüz hikaye eklenmemiş</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Yakında çiftçilerimizin başarı hikayeleri burada olacak</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <Link
              key={story._id}
              to={`/blog/${story.slug}`}
              className="group bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {story.coverImage ? (
                <img src={story.coverImage} alt={story.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Trophy size={40} className="text-white/60" />
                </div>
              )}
              <div className="p-5">
                <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full mb-2">
                  Başarı Hikayesi
                </span>
                <h3 className="text-base font-semibold tracking-tight line-clamp-2 mb-2 group-hover:text-[#2D6A4F] transition-colors">
                  {story.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1"><User size={10} />{story.author}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(story.createdAt)}</span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#2D6A4F] group-hover:gap-2 transition-all">
                  Hikayeyi Oku <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

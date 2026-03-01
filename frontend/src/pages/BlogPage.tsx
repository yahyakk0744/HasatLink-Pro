import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, User, ArrowRight } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Blog } from '../types';
import { formatDate } from '../utils/formatters';

export default function BlogPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blog').then(({ data }) => setBlogs(data.blogs)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title={lang === 'tr' ? 'Tarım Rehberi' : 'Agriculture Guide'}
        description={lang === 'tr' ? 'Tarım dünyasından haberler, rehberler ve bilgiler.' : 'News, guides and information from the agriculture world.'}
      />
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        {lang === 'tr' ? 'Tarım Rehberi' : 'Agriculture Guide'}
      </h1>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : blogs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-secondary)]">{lang === 'tr' ? 'Henüz yazı eklenmemiş.' : 'No posts yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <Link
              key={blog._id}
              to={`/blog/${blog.slug}`}
              className="group bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {blog.coverImage ? (
                <img src={blog.coverImage} alt={blog.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-[#2D6A4F] to-[#40916C] flex items-center justify-center">
                  <span className="text-white/60 text-4xl">📝</span>
                </div>
              )}
              <div className="p-5">
                {blog.category && (
                  <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-0.5 rounded-full mb-2">
                    {blog.category}
                  </span>
                )}
                <h2 className="text-base font-semibold tracking-tight line-clamp-2 mb-2 group-hover:text-[#2D6A4F] transition-colors">{blog.title}</h2>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1"><User size={10} />{blog.author}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(blog.createdAt)}</span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#2D6A4F] group-hover:gap-2 transition-all">
                  {lang === 'tr' ? 'Devamını Oku' : 'Read More'} <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

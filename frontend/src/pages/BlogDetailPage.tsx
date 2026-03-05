import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Blog } from '../types';
import { formatDate } from '../utils/formatters';

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get(`/blog/${slug}`).then(({ data }) => setBlog(data)).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!blog) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">{lang === 'tr' ? 'Yazı bulunamadı' : 'Post not found'}</h1>
      <Link to="/blog" className="text-[var(--accent-green)] font-medium">{lang === 'tr' ? '← Blog\'a dön' : '← Back to blog'}</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title={blog.title} description={blog.content.slice(0, 160)} ogImage={blog.coverImage} />

      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-green)] font-medium mb-6 hover:gap-2.5 transition-all">
        <ArrowLeft size={14} /> {lang === 'tr' ? 'Tarım Rehberi' : 'Agriculture Guide'}
      </Link>

      {blog.coverImage && (
        <img src={blog.coverImage} alt={blog.title} className="w-full aspect-video object-cover rounded-2xl mb-6" />
      )}

      {blog.category && (
        <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-[var(--accent-green)] bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)] px-2.5 py-0.5 rounded-full mb-3">
          {blog.category}
        </span>
      )}

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{blog.title}</h1>

      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-8 pb-6 border-b border-[var(--border-default)]">
        <span className="flex items-center gap-1.5"><User size={14} />{blog.author}</span>
        <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(blog.createdAt)}</span>
      </div>

      <article
        className="prose prose-sm max-w-none text-[var(--text-primary)] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:ml-4 [&_li]:mb-1 [&_img]:rounded-xl [&_img]:my-6 [&_a]:text-[var(--accent-green)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent-green)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)]"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}

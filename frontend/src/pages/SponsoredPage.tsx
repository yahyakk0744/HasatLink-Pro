import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Newspaper, ArrowLeft, ExternalLink, Clock } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFeatures } from '../hooks/useFeatures';

interface SponsoredItem {
  _id: string;
  sponsorName: string;
  sponsorLogo: string;
  sponsorUrl: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  videoUrl: string;
  category: string;
  tags: string[];
  impressionCount: number;
  clickCount: number;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SponsoredPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isEnabled, loading: featuresLoading } = useFeatures();

  if (!featuresLoading && !isEnabled('sponsoredContent')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Newspaper size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Sponsorlu İçerik Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">Tarım markaları ve üreticilerin içerikleri burada olacak.</p>
      </div>
    );
  }

  return slug ? <SponsoredDetail slug={slug} /> : <SponsoredList />;
}

function SponsoredList() {
  const [items, setItems] = useState<SponsoredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sponsored')
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Sponsorlu İçerikler - HasatLink" description="Tarım markalarından haberler, ürünler ve içerikler." />

      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 mb-2">
        <Newspaper size={28} className="text-[#2D6A4F]" />
        Sponsorlu İçerikler
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Tarım markalarından haberler ve içerikler</p>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Newspaper size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Henüz içerik yok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Link
              key={item._id}
              to={`/sponsorlu/${item.slug}`}
              className="group bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {item.coverImage ? (
                <img src={item.coverImage} alt={item.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-[#2D6A4F] to-[#40916C] flex items-center justify-center">
                  <Newspaper size={32} className="text-white/60" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {item.sponsorLogo && <img src={item.sponsorLogo} alt={item.sponsorName} className="w-5 h-5 rounded-full object-cover" />}
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Sponsorlu · {item.sponsorName}</span>
                </div>
                <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-[#2D6A4F] transition-colors">{item.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SponsoredDetail({ slug }: { slug: string }) {
  const [item, setItem] = useState<SponsoredItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sponsored/${slug}`)
      .then(({ data }) => setItem(data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--text-secondary)]">İçerik bulunamadı</p>
        <Link to="/sponsorlu" className="text-[#2D6A4F] text-sm font-semibold mt-3 inline-block">← Geri</Link>
      </div>
    );
  }

  const trackClick = () => {
    if (item.sponsorUrl) {
      api.post(`/sponsored/${item._id}/click`).catch(() => {});
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title={`${item.title} - HasatLink`} description={item.summary} />

      <Link to="/sponsorlu" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#2D6A4F] mb-6 transition-colors">
        <ArrowLeft size={16} />
        Sponsorlu İçerikler
      </Link>

      {item.coverImage && (
        <img src={item.coverImage} alt={item.title} className="w-full aspect-video object-cover rounded-2xl mb-6" />
      )}

      <div className="flex items-center gap-3 mb-4">
        {item.sponsorLogo && <img src={item.sponsorLogo} alt={item.sponsorName} className="w-8 h-8 rounded-full object-cover" />}
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Sponsorlu İçerik</p>
          <p className="text-sm font-semibold">{item.sponsorName}</p>
        </div>
        <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 ml-auto">
          <Clock size={12} />
          {formatDate(item.createdAt)}
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{item.title}</h1>

      {item.videoUrl && (
        <div className="mb-6 rounded-2xl overflow-hidden aspect-video">
          <iframe src={item.videoUrl} className="w-full h-full" allowFullScreen title={item.title} />
        </div>
      )}

      <div className="prose prose-sm max-w-none text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed mb-6">
        {item.content}
      </div>

      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {item.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-xs text-[var(--text-secondary)]">#{tag}</span>
          ))}
        </div>
      )}

      {item.sponsorUrl && (
        <a
          href={item.sponsorUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackClick}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors"
        >
          <ExternalLink size={16} />
          Sponsor Sitesini Ziyaret Et
        </a>
      )}
    </div>
  );
}

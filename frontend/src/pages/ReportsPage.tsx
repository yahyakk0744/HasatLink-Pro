import { useState } from 'react';
import { FileBarChart, TrendingUp, BarChart3, PieChart, ArrowRight, Download, Calendar, MapPin } from 'lucide-react';
import SEO from '../components/ui/SEO';
import { useFeatures } from '../hooks/useFeatures';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';

const SAMPLE_REPORTS = [
  {
    title: 'Aylık Sebze Fiyat Analizi',
    description: 'Türkiye geneli sebze hal fiyatları, trend analizi ve talep tahminleri',
    icon: TrendingUp,
    color: '#2D6A4F',
    period: 'Aylık',
  },
  {
    title: 'Meyve Pazar Raporu',
    description: 'Mevsimsel meyve fiyatları, ihracat verileri ve üretim istatistikleri',
    icon: BarChart3,
    color: '#E76F00',
    period: 'Aylık',
  },
  {
    title: 'Bölgesel Tarım İstatistikleri',
    description: 'İl bazlı tarım üretimi, verim oranları ve karşılaştırmalı analiz',
    icon: MapPin,
    color: '#0077B6',
    period: 'Çeyreklik',
  },
  {
    title: 'Lojistik ve Nakliye Maliyetleri',
    description: 'Bölgeler arası nakliye fiyat endeksi ve maliyet trendleri',
    icon: PieChart,
    color: '#7C3AED',
    period: 'Aylık',
  },
];

export default function ReportsPage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const { user } = useAuth();
  const [requestSent, setRequestSent] = useState(false);

  if (!featuresLoading && !isEnabled('reportsSale')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <FileBarChart size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Pazar Raporları Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">B2B pazar analiz raporları yakında burada olacak.</p>
      </div>
    );
  }

  const handleRequest = async (reportTitle: string) => {
    if (!user) {
      toast.error('Rapor talep etmek için giriş yapın');
      return;
    }
    try {
      await api.post('/contact', {
        name: user.name,
        email: user.email,
        subject: `Rapor Talebi: ${reportTitle}`,
        message: `${reportTitle} raporuna erişim talep ediyorum.`,
      });
      toast.success('Talebiniz alındı! Ekibimiz sizinle iletişime geçecek.');
      setRequestSent(true);
    } catch {
      toast.error('Talep gönderilemedi');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Pazar Raporları - HasatLink" description="B2B tarım pazar analiz raporları. Aylık fiyat trendleri, üretim istatistikleri ve talep tahminleri." />

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F]/10 flex items-center justify-center mx-auto mb-4">
          <FileBarChart size={32} className="text-[#2D6A4F]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Pazar Raporları</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Tarım piyasasının nabzını tutun. Aylık trend raporları, fiyat analizleri ve bölgesel istatistiklerle doğru kararlar alın.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {SAMPLE_REPORTS.map((report, i) => {
          const Icon = report.icon;
          return (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${report.color}15` }}>
                  <Icon size={24} style={{ color: report.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-1">{report.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{report.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)]">
                  <Calendar size={10} /> {report.period}
                </span>
                <button
                  onClick={() => handleRequest(report.title)}
                  disabled={requestSent}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-semibold hover:bg-[#1B4332] disabled:opacity-50 transition-all"
                >
                  <Download size={12} />
                  {requestSent ? 'Talep Gönderildi' : 'Talep Et'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-3xl p-8 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Özel Rapor mu İstiyorsunuz?</h2>
        <p className="text-sm text-white/70 mb-5 max-w-md mx-auto">
          Sektörünüze, bölgenize veya ürün grubunuza özel detaylı analiz raporları hazırlayabiliriz.
        </p>
        <Link
          to={user ? '/iletisim' : '/giris'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2D6A4F] rounded-2xl text-sm font-bold hover:bg-white/90 transition-colors"
        >
          {user ? 'İletişime Geçin' : 'Giriş Yap'}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

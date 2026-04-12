import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  ToggleLeft, Star, Megaphone, Store, Newspaper, Crown, Briefcase, FileBarChart,
  MessageCircle, CloudRain, CalendarDays, Trophy, Gift, Mic, Video, Send,
  Map, Search, Truck, Mail, Bot, TrendingUp, DollarSign, Save,
} from 'lucide-react';
import api from '../config/api';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface FeatureMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'monetization' | 'community' | 'communication' | 'discovery' | 'info';
  hasConfig?: boolean;
}

const FEATURES: FeatureMeta[] = [
  // Monetizasyon (7)
  {
    key: 'featuredListing',
    label: 'Öne Çıkan İlan',
    description: 'Kullanıcılar ilanlarını listelemede öne çıkarabilir',
    icon: Star,
    category: 'monetization',
    hasConfig: true,
  },
  {
    key: 'bannerAds',
    label: 'Banner Reklam',
    description: 'Anasayfa ve listeleme sayfalarında reklam banner alanları',
    icon: Megaphone,
    category: 'monetization',
  },
  {
    key: 'dealerDirectory',
    label: 'B2B Bayi Dizini',
    description: 'Tarım malzemeleri bayi rehberi — aylık ödemeli üyelik',
    icon: Store,
    category: 'monetization',
    hasConfig: true,
  },
  {
    key: 'sponsoredContent',
    label: 'Sponsorlu İçerik',
    description: 'Tarım markaları için blog/video sponsorluk alanı',
    icon: Newspaper,
    category: 'monetization',
  },
  {
    key: 'premiumMembership',
    label: 'Premium Üyelik',
    description: 'Freemium model — gelişmiş filtreler, istatistikler, öncelikli destek',
    icon: Crown,
    category: 'monetization',
    hasConfig: true,
  },
  {
    key: 'jobListings',
    label: 'İş İlanları',
    description: 'Mevsimlik işçi, hasat, ekim işçiliği ilanları',
    icon: Briefcase,
    category: 'monetization',
    hasConfig: true,
  },
  {
    key: 'reportsSale',
    label: 'Rapor Satışı',
    description: 'B2B aylık trend raporları (fiyat analizi, talep haritası)',
    icon: FileBarChart,
    category: 'monetization',
    hasConfig: true,
  },
  {
    key: 'commission',
    label: 'Komisyon Sistemi',
    description: 'Satışlardan komisyon — KAPALI tutulmalı (free P2P model)',
    icon: DollarSign,
    category: 'monetization',
  },

  // Topluluk (4)
  {
    key: 'qnaForum',
    label: 'Soru-Cevap Forumu',
    description: 'Çiftçi topluluk forumu — tarım bilgi paylaşımı',
    icon: MessageCircle,
    category: 'community',
  },
  {
    key: 'successStories',
    label: 'Başarı Hikayeleri',
    description: 'Blog tabanlı çiftçi başarı öyküleri showcase',
    icon: Trophy,
    category: 'community',
  },
  {
    key: 'referralProgram',
    label: 'Davet/Referans Sistemi',
    description: 'Arkadaş davet eden kullanıcıya puan ödülü',
    icon: Gift,
    category: 'community',
    hasConfig: true,
  },
  {
    key: 'weeklyNewsletter',
    label: 'Haftalık Bülten',
    description: 'E-posta ile haftalık tarım/fiyat özeti',
    icon: Mail,
    category: 'community',
  },

  // İletişim (4)
  {
    key: 'voiceMessages',
    label: 'Sesli Mesaj',
    description: 'Sohbette sesli mesaj gönderme',
    icon: Mic,
    category: 'communication',
  },
  {
    key: 'videoCall',
    label: 'Görüntülü Görüşme',
    description: 'Alıcı-satıcı arası görüntülü görüşme',
    icon: Video,
    category: 'communication',
  },
  {
    key: 'broadcastMessages',
    label: 'Toplu Mesaj',
    description: 'Satıcı → favoriye ekleyen alıcılara toplu bildirim',
    icon: Send,
    category: 'communication',
    hasConfig: true,
  },
  {
    key: 'telegramBot',
    label: 'Telegram Bot',
    description: 'Telegram bot üzerinden bildirim + arama',
    icon: Bot,
    category: 'communication',
    hasConfig: true,
  },

  // Keşif / Arama (3)
  {
    key: 'mapView',
    label: 'Harita Görünümü',
    description: 'İlanları haritada konum bazlı gösterme',
    icon: Map,
    category: 'discovery',
  },
  {
    key: 'voiceSearch',
    label: 'Sesli Arama',
    description: 'Mikrofon ile ürün/kategori arama',
    icon: Search,
    category: 'discovery',
  },
  {
    key: 'logisticsDirectory',
    label: 'Nakliyeci Rehberi',
    description: 'Nakliyeci listesi + mesafe/maliyet hesaplayıcı',
    icon: Truck,
    category: 'discovery',
  },

  // Bilgi / Uyarı (3)
  {
    key: 'weatherAlerts',
    label: 'Hava Durumu Uyarısı',
    description: 'İlçe bazında don, dolu, fırtına uyarıları',
    icon: CloudRain,
    category: 'info',
  },
  {
    key: 'harvestCalendar',
    label: 'Hasat Takvimi',
    description: 'Ürün bazında ekim/hasat dönemleri + bölgesel ipuçları',
    icon: CalendarDays,
    category: 'info',
  },
  {
    key: 'priceForecast',
    label: 'Fiyat Tahmini',
    description: 'Yapay zeka destekli hal fiyat tahmini (deneysel)',
    icon: TrendingUp,
    category: 'info',
  },
];

const CATEGORY_LABELS: Record<string, { title: string; color: string; icon: React.ElementType }> = {
  monetization: { title: 'Para Kazanma', color: '#F59E0B', icon: DollarSign },
  community: { title: 'Topluluk', color: '#8B5CF6', icon: Trophy },
  communication: { title: 'İletişim', color: '#3B82F6', icon: MessageCircle },
  discovery: { title: 'Keşif ve Arama', color: '#10B981', icon: Search },
  info: { title: 'Bilgi ve Uyarı', color: '#06B6D4', icon: CloudRain },
};

export default function AdminFeaturesPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [configEdit, setConfigEdit] = useState<Record<string, any>>({});

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => {
        setSettings(data);
        setConfigEdit({
          featuredListingPricePerDay: data.featuredListing?.pricePerDay || 10,
          dealerDirectoryPrice: data.dealerDirectory?.monthlyPrice || 500,
          premiumMembershipPrice: data.premiumMembership?.monthlyPrice || 50,
          jobListingsPricePerListing: data.jobListings?.pricePerListing || 20,
          reportsSalePricePerReport: data.reportsSale?.pricePerReport || 250,
          referralRewardPoints: data.referralProgram?.rewardPoints || 100,
          broadcastDailyLimit: data.broadcastMessages?.dailyLimit || 1,
          telegramBotUsername: data.telegramBot?.botUsername || '',
        });
      })
      .catch(() => toast.error('Ayarlar yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const toggleFeature = async (key: string) => {
    const currentValue = settings?.[key]?.enabled || false;
    const newValue = !currentValue;

    setSaving(s => ({ ...s, [key]: true }));
    try {
      await api.patch(`/admin/settings/feature/${key}`, { enabled: newValue });
      setSettings((prev: any) => ({
        ...prev,
        [key]: { ...prev[key], enabled: newValue },
      }));
      toast.success(newValue ? 'Özellik aktif edildi' : 'Özellik kapatıldı');
    } catch {
      toast.error('Değiştirilemedi');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const saveConfig = async () => {
    try {
      await api.put('/admin/settings', {
        featuredListing: {
          ...settings.featuredListing,
          pricePerDay: Number(configEdit.featuredListingPricePerDay),
        },
        dealerDirectory: {
          ...settings.dealerDirectory,
          monthlyPrice: Number(configEdit.dealerDirectoryPrice),
        },
        premiumMembership: {
          ...settings.premiumMembership,
          monthlyPrice: Number(configEdit.premiumMembershipPrice),
        },
        jobListings: {
          ...settings.jobListings,
          pricePerListing: Number(configEdit.jobListingsPricePerListing),
        },
        reportsSale: {
          ...settings.reportsSale,
          pricePerReport: Number(configEdit.reportsSalePricePerReport),
        },
        referralProgram: {
          ...settings.referralProgram,
          rewardPoints: Number(configEdit.referralRewardPoints),
        },
        broadcastMessages: {
          ...settings.broadcastMessages,
          dailyLimit: Number(configEdit.broadcastDailyLimit),
        },
        telegramBot: {
          ...settings.telegramBot,
          botUsername: configEdit.telegramBotUsername,
        },
      });
      toast.success('Ayarlar kaydedildi');
    } catch {
      toast.error('Kaydedilemedi');
    }
  };

  if (loading || !settings) {
    return (
      <AdminLayout title="Özellik Yönetimi" icon={<ToggleLeft size={24} />}>
        <LoadingSpinner size="lg" className="py-20" />
      </AdminLayout>
    );
  }

  const categories = ['monetization', 'community', 'communication', 'discovery', 'info'] as const;
  const enabledCount = FEATURES.filter(f => settings[f.key]?.enabled).length;

  return (
    <AdminLayout title="Özellik Yönetimi" icon={<ToggleLeft size={24} />}>
      <div className="max-w-4xl animate-fade-in">

        {/* Intro */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
            Platform Özellikleri
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            HasatLink Pro ücretsiz bir P2P marketplace olarak başlar. Aşağıdaki özellikleri tek tek aktif
            ederek platform büyüdükçe para kazanma ve topluluk özelliklerini devreye alabilirsin.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-semibold">
              {enabledCount} aktif
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] font-semibold">
              {FEATURES.length - enabledCount} pasif
            </span>
            <span className="text-[var(--text-secondary)]">· {FEATURES.length} toplam özellik</span>
          </div>
        </div>

        {/* Categories */}
        {categories.map(cat => {
          const catFeatures = FEATURES.filter(f => f.category === cat);
          const catMeta = CATEGORY_LABELS[cat];
          const CatIcon = catMeta.icon;

          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${catMeta.color}20` }}
                >
                  <CatIcon size={20} style={{ color: catMeta.color }} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {catMeta.title}
                </h2>
              </div>

              <div className="space-y-3">
                {catFeatures.map(feature => {
                  const Icon = feature.icon;
                  const isEnabled = settings[feature.key]?.enabled || false;
                  const isSaving = saving[feature.key] || false;

                  return (
                    <div
                      key={feature.key}
                      className={`
                        bg-[var(--bg-surface)] border rounded-2xl p-5 transition-all duration-200
                        ${isEnabled
                          ? 'border-[#2D6A4F]/30 shadow-sm'
                          : 'border-[var(--border-default)]'
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`
                            w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors
                            ${isEnabled ? 'bg-[#2D6A4F]/10' : 'bg-[var(--bg-input)]'}
                          `}
                        >
                          <Icon
                            size={20}
                            className={isEnabled ? 'text-[#2D6A4F]' : 'text-[var(--text-secondary)]'}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {feature.label}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                                {feature.description}
                              </p>
                            </div>

                            <button
                              onClick={() => toggleFeature(feature.key)}
                              disabled={isSaving}
                              className={`
                                relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#2D6A4F]/20
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${isEnabled ? 'bg-[#2D6A4F]' : 'bg-[var(--border-default)]'}
                              `}
                            >
                              <span
                                className={`
                                  pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0
                                  transition duration-200 ease-in-out
                                  ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                `}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Config Section */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Özellik Ayarları (Fiyat / Limit)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConfigInput
              label="Öne Çıkan İlan - Günlük Fiyat (TL)"
              value={configEdit.featuredListingPricePerDay}
              onChange={v => setConfigEdit(c => ({ ...c, featuredListingPricePerDay: v }))}
            />
            <ConfigInput
              label="B2B Bayi Dizini - Aylık Fiyat (TL)"
              value={configEdit.dealerDirectoryPrice}
              onChange={v => setConfigEdit(c => ({ ...c, dealerDirectoryPrice: v }))}
            />
            <ConfigInput
              label="Premium Üyelik - Aylık Fiyat (TL)"
              value={configEdit.premiumMembershipPrice}
              onChange={v => setConfigEdit(c => ({ ...c, premiumMembershipPrice: v }))}
            />
            <ConfigInput
              label="İş İlanı - İlan Başı Fiyat (TL)"
              value={configEdit.jobListingsPricePerListing}
              onChange={v => setConfigEdit(c => ({ ...c, jobListingsPricePerListing: v }))}
            />
            <ConfigInput
              label="Rapor Satışı - Rapor Başı (TL)"
              value={configEdit.reportsSalePricePerReport}
              onChange={v => setConfigEdit(c => ({ ...c, reportsSalePricePerReport: v }))}
            />
            <ConfigInput
              label="Referans Ödülü (Puan)"
              value={configEdit.referralRewardPoints}
              onChange={v => setConfigEdit(c => ({ ...c, referralRewardPoints: v }))}
            />
            <ConfigInput
              label="Toplu Mesaj - Günlük Limit"
              value={configEdit.broadcastDailyLimit}
              onChange={v => setConfigEdit(c => ({ ...c, broadcastDailyLimit: v }))}
            />
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                Telegram Bot Kullanıcı Adı
              </label>
              <input
                type="text"
                value={configEdit.telegramBotUsername}
                onChange={e => setConfigEdit(c => ({ ...c, telegramBotUsername: e.target.value }))}
                placeholder="@hasatlink_bot"
                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-transparent rounded-2xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/20 transition-all"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={saveConfig} size="md">
              <span className="flex items-center gap-2">
                <Save size={16} />
                Ayarları Kaydet
              </span>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function ConfigInput({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-transparent rounded-2xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/20 transition-all"
      />
    </div>
  );
}

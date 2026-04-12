import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudRain, AlertTriangle, CheckCircle2, ArrowLeft, Snowflake, CloudLightning, Thermometer, Droplets, Wind } from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import toast from 'react-hot-toast';

interface Alert {
  _id: string;
  city: string;
  district: string;
  alertType: string;
  severity: string;
  message: string;
  validFrom: string;
  validUntil: string;
  isRead: boolean;
  createdAt: string;
}

const ALERT_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  frost: { icon: Snowflake, label: 'Don', color: '#3B82F6' },
  hail: { icon: CloudRain, label: 'Dolu', color: '#6366F1' },
  'heavy-rain': { icon: Droplets, label: 'Şiddetli Yağış', color: '#0EA5E9' },
  storm: { icon: CloudLightning, label: 'Fırtına', color: '#F59E0B' },
  heatwave: { icon: Thermometer, label: 'Sıcak Dalgası', color: '#EF4444' },
  drought: { icon: Wind, label: 'Kuraklık', color: '#D97706' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik',
};

export default function WeatherAlertsPage() {
  const { user } = useAuth();
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get('/weather-alerts/my')
      .then(({ data }) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [user]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/weather-alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch {
      toast.error('İşaretlenemedi');
    }
  };

  if (!featuresLoading && !isEnabled('weatherAlerts')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <CloudRain size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Hava Durumu Uyarıları Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">Don, dolu, fırtına uyarıları yakında burada.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <CloudRain size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Hava Durumu Uyarıları</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Uyarılarınızı görmek için giriş yapın</p>
        <Link to="/giris" className="inline-block px-5 py-2 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Hava Durumu Uyarıları - HasatLink" description="Tarla ve bahçeniz için don, dolu, fırtına uyarıları." />

      <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#2D6A4F] mb-6 transition-colors">
        <ArrowLeft size={16} /> Ana Sayfa
      </Link>

      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 mb-2">
        <CloudRain size={28} className="text-[#2D6A4F]" />
        Hava Durumu Uyarıları
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Bölgenizdeki tarımsal hava uyarıları</p>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
          <p className="text-sm font-semibold text-green-600">Aktif uyarı yok</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Bölgenizde şu an tehlikeli hava koşulu bulunmuyor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const meta = ALERT_META[alert.alertType] || { icon: AlertTriangle, label: alert.alertType, color: '#6B7280' };
            const Icon = meta.icon;
            const sevClass = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium;
            return (
              <div
                key={alert._id}
                className={`bg-[var(--bg-surface)] border rounded-2xl p-5 transition-all ${alert.isRead ? 'border-[var(--border-default)] opacity-70' : 'border-[var(--border-default)] shadow-sm'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                    <Icon size={20} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{meta.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sevClass}`}>
                          {SEVERITY_LABELS[alert.severity] || alert.severity}
                        </span>
                      </div>
                      {!alert.isRead && (
                        <button onClick={() => markRead(alert._id)} className="text-xs text-[#2D6A4F] font-semibold hover:underline shrink-0">
                          Okundu
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">{alert.city}{alert.district ? `, ${alert.district}` : ''}</p>
                    <p className="text-sm leading-relaxed">{alert.message}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                      Geçerlilik: {new Date(alert.validFrom).toLocaleDateString('tr-TR')} — {new Date(alert.validUntil).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

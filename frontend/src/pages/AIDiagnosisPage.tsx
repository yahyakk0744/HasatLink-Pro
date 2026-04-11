import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Link } from 'react-router-dom';
import {
  Sparkles, BookOpen, History, Bell, AlertTriangle,
  Leaf, Clock, ChevronRight, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AIDiagnosisPanel from '../components/ai/AIDiagnosisPanel';
import SEO from '../components/ui/SEO';
import type { AIDiagnosisHistory, RegionalAlert } from '../types';

type Tab = 'diagnose' | 'history' | 'alerts';

const RISK_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high:     { bg: 'bg-red-50 border-red-200/60',    text: 'text-red-700',    label: 'Yüksek Risk' },
  medium:   { bg: 'bg-amber-50 border-amber-200/60', text: 'text-amber-700',  label: 'Orta Risk' },
  low:      { bg: 'bg-emerald-50 border-emerald-200/60', text: 'text-emerald-700', label: 'Düşük Risk' },
};

export default function AIDiagnosisPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('diagnose');
  const [history, setHistory] = useState<AIDiagnosisHistory[]>([]);
  const [alerts, setAlerts] = useState<RegionalAlert[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);

  if (!user) return <Navigate to="/giris" replace />;

  const loadHistory = async () => {
    if (history.length > 0) return;
    setHistoryLoading(true);
    try {
      const { data } = await (await import('../config/api')).default.get<AIDiagnosisHistory[]>(`/ai/history/${user._id}`);
      setHistory(data);
    } catch {} finally { setHistoryLoading(false); }
  };

  const loadAlerts = async () => {
    if (alerts.length > 0) return;
    setAlertsLoading(true);
    try {
      const { data } = await (await import('../config/api')).default.get<{ alerts: RegionalAlert[] }>('/ai/alerts');
      setAlerts(data.alerts || []);
    } catch {} finally { setAlertsLoading(false); }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'history') loadHistory();
    if (tab === 'alerts') loadAlerts();
  };

  const tabs = [
    { id: 'diagnose' as Tab, label: isTr ? 'Teşhis' : 'Diagnose', icon: Sparkles },
    { id: 'history'  as Tab, label: isTr ? 'Geçmiş'  : 'History',  icon: History },
    { id: 'alerts'   as Tab, label: isTr ? 'Uyarılar' : 'Alerts',  icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title="HasatAI - Bitki Doktoru"
        description="Yapay zeka destekli bitki hastalığı teşhisi, hasat tahmini ve akıllı yönlendirme."
        keywords="ai, yapay zeka, bitki hastalığı, teşhis, tarım, hasat tahmini"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">HasatAI</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              {isTr ? 'Yapay Zeka Destekli Tarım Asistanı' : 'AI-Powered Agriculture Assistant'}
            </p>
          </div>
        </div>
        <Link
          to="/tarim-ansiklopedisi"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 text-[12px] font-semibold border border-violet-200/50 hover:bg-violet-100 transition-colors"
        >
          <BookOpen size={15} />
          <span className="hidden sm:inline">{isTr ? 'Tarım Ansiklopedisi' : 'Agri Encyclopedia'}</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-input)] rounded-2xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Teşhis */}
      {activeTab === 'diagnose' && (
        <div className="max-w-2xl mx-auto">
          <AIDiagnosisPanel />
        </div>
      )}

      {/* Tab: Geçmiş */}
      {activeTab === 'history' && (
        <div className="max-w-2xl mx-auto space-y-3">
          {historyLoading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto flex items-center justify-center mb-3">
                <Sparkles size={22} className="text-white animate-pulse" />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">{isTr ? 'Geçmiş yükleniyor...' : 'Loading history...'}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <History size={40} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{isTr ? 'Henüz teşhis yok' : 'No diagnoses yet'}</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{isTr ? 'Bitki fotoğrafı yükleyerek başlayın' : 'Upload a plant photo to get started'}</p>
              <button
                onClick={() => setActiveTab('diagnose')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition-colors"
              >
                {isTr ? 'Teşhis Başlat' : 'Start Diagnosis'}
              </button>
            </div>
          ) : (
            history.map((item) => {
              const isHealthy = item.disease_code === 'saglikli';
              return (
                <div
                  key={item._id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-emerald-300/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-input)]">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf size={24} className="text-emerald-400" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                      <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{item.disease}</p>
                    </div>
                    {item.crop_type && (
                      <p className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1">
                        <Leaf size={11} className="text-emerald-500" /> {item.crop_type}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={11} className="text-[var(--text-tertiary)]" />
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.confidence >= 85 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>%{item.confidence}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-tertiary)] shrink-0" />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Uyarılar */}
      {activeTab === 'alerts' && (
        <div className="max-w-2xl mx-auto space-y-3">
          {alertsLoading ? (
            <div className="text-center py-16">
              <Bell size={40} className="mx-auto mb-3 text-[var(--text-tertiary)] animate-pulse" />
              <p className="text-[13px] text-[var(--text-secondary)]">{isTr ? 'Uyarılar yükleniyor...' : 'Loading alerts...'}</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16">
              <ShieldAlert size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{isTr ? 'Aktif uyarı yok' : 'No active alerts'}</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{isTr ? 'Bölgenizde şu an hastalık uyarısı bulunmuyor' : 'No disease alerts in your region right now'}</p>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                <Bell size={13} className="text-amber-500" />
                {isTr ? `${alerts.length} bölgesel hastalık uyarısı` : `${alerts.length} regional disease alerts`}
              </p>
              {alerts.map((alert, i) => {
                const risk = RISK_STYLE[alert.risk_level] || RISK_STYLE.medium;
                return (
                  <div key={i} className={`rounded-2xl border p-4 ${risk.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.risk_level === 'high' ? 'bg-red-100' : alert.risk_level === 'medium' ? 'bg-amber-100' : 'bg-emerald-100'
                      }`}>
                        <AlertTriangle size={17} className={risk.text} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={`text-[13px] font-bold ${risk.text}`}>{alert.disease}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text}`}>
                            {risk.label}
                          </span>
                          {alert.crop_type && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/60 text-gray-600">
                              {alert.crop_type}
                            </span>
                          )}
                        </div>
                        <p className={`text-[12px] leading-relaxed ${risk.text}`}>{alert.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

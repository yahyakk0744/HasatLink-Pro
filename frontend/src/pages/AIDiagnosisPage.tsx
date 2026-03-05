import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Sparkles, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AIDiagnosisPanel from '../components/ai/AIDiagnosisPanel';
import DiagnosisHistory from '../components/ai/DiagnosisHistory';
import DiseaseLibrary from '../components/ai/DiseaseLibrary';
import SEO from '../components/ui/SEO';

type Tab = 'doctor' | 'library' | 'history';

export default function AIDiagnosisPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('doctor');

  if (!user) return <Navigate to="/giris" replace />;

  const tabs: { key: Tab; icon: typeof Sparkles; label: string }[] = [
    { key: 'doctor', icon: Sparkles, label: isTr ? 'Bitki Doktoru' : 'Plant Doctor' },
    { key: 'library', icon: BookOpen, label: isTr ? 'Hastalık Kütüphanesi' : 'Disease Library' },
    { key: 'history', icon: Clock, label: isTr ? 'Geçmiş' : 'History' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title="HasatAI - Bitki Doktoru"
        description="Yapay zeka destekli bitki hastalığı teşhisi, hasat tahmini ve akıllı yönlendirme."
        keywords="ai, yapay zeka, bitki hastalığı, teşhis, tarım, hasat tahmini"
      />

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
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

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-default)] mb-6">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
              activeTab === key
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'doctor' && (
          <div className="max-w-2xl mx-auto">
            <AIDiagnosisPanel />
          </div>
        )}

        {activeTab === 'library' && (
          <div className="max-w-3xl mx-auto">
            <DiseaseLibrary />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto">
            <DiagnosisHistory userId={user.userId} />
          </div>
        )}
      </div>
    </div>
  );
}

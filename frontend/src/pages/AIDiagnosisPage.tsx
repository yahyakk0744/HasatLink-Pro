import { useTranslation } from 'react-i18next';
import { Navigate, Link } from 'react-router-dom';
import { Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AIDiagnosisPanel from '../components/ai/AIDiagnosisPanel';
import SEO from '../components/ui/SEO';

export default function AIDiagnosisPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();

  if (!user) return <Navigate to="/giris" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title="HasatAI - Bitki Doktoru"
        description="Yapay zeka destekli bitki hastalığı teşhisi, hasat tahmini ve akıllı yönlendirme."
        keywords="ai, yapay zeka, bitki hastalığı, teşhis, tarım, hasat tahmini"
      />

      {/* Page header */}
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

      {/* Diagnosis panel */}
      <div className="max-w-2xl mx-auto">
        <AIDiagnosisPanel />
      </div>
    </div>
  );
}

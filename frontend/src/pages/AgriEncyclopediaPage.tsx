import { useTranslation } from 'react-i18next';
import { Navigate, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DiseaseLibrary from '../components/ai/DiseaseLibrary';
import SEO from '../components/ui/SEO';

export default function AgriEncyclopediaPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" /></div>;
  if (!user) return <Navigate to="/giris" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title={isTr ? 'Tarim Ansiklopedisi' : 'Agriculture Encyclopedia'}
        description={isTr ? 'Bitki hastaliklari, tedavi yontemleri ve korunma bilgileri.' : 'Plant diseases, treatments and prevention information.'}
        keywords="hastalık kütüphanesi, bitki hastalıkları, tarım ansiklopedisi, tedavi"
      />

      {/* Back to AI link */}
      <div className="mb-4">
        <Link
          to="/ai-teshis"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <Sparkles size={14} />
          {isTr ? 'HasatAI Bitki Doktoru' : 'HasatAI Plant Doctor'}
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <DiseaseLibrary />
      </div>
    </div>
  );
}

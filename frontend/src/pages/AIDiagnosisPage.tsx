import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AIDiagnosisPanel from '../components/ai/AIDiagnosisPanel';
import DiagnosisHistory from '../components/ai/DiagnosisHistory';

export default function AIDiagnosisPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return <Navigate to="/giris" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">{t('ai.title')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIDiagnosisPanel />
        <DiagnosisHistory userId={user.userId} />
      </div>
    </div>
  );
}

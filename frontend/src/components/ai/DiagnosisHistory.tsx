import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../ui/EmptyState';

interface DiagnosisHistoryProps {
  userId: string;
}

export default function DiagnosisHistory({ userId }: DiagnosisHistoryProps) {
  const { t } = useTranslation();
  const { history, fetchHistory } = useAIDiagnosis();

  useEffect(() => {
    fetchHistory(userId);
  }, [userId, fetchHistory]);

  if (!history.length) {
    return <EmptyState icon={<Clock size={40} />} title={t('ai.noHistory')} />;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold tracking-tight">{t('ai.history')}</h3>
      {history.map(item => (
        <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A47148]/10 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-[#A47148]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{item.disease}</p>
            <p className="text-xs text-[#6B6560]">%{item.confidence} - {formatDate(item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../ui/EmptyState';

interface DiagnosisHistoryProps {
  userId: string;
}

const URGENCY_COLORS = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
};

export default function DiagnosisHistory({ userId }: DiagnosisHistoryProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { history, fetchHistory } = useAIDiagnosis();

  useEffect(() => {
    fetchHistory(userId);
  }, [userId, fetchHistory]);

  if (!history.length) {
    return <EmptyState icon={<Clock size={40} />} title={t('ai.noHistory')} />;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">{t('ai.history')}</h3>
      {history.map(item => {
        const isHealthy = item.disease_code === 'saglikli';
        const urgencyColor = URGENCY_COLORS[item.urgency] || URGENCY_COLORS.low;

        return (
          <div
            key={item._id}
            className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/20 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHealthy ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                {isHealthy
                  ? <CheckCircle size={18} className="text-emerald-600" />
                  : <AlertTriangle size={18} className="text-orange-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 truncate">{item.disease}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[12px] text-gray-500 font-medium">
                    %{item.confidence}
                  </span>
                  {item.crop_type && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                      {item.crop_type}
                    </span>
                  )}
                  {!isHealthy && item.urgency && (
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${urgencyColor}`}>
                      <Activity size={10} className="inline mr-0.5" />
                      {item.urgency === 'critical' ? (isTr ? 'Kritik' : 'Critical')
                        : item.urgency === 'medium' ? (isTr ? 'Orta' : 'Medium')
                        : (isTr ? 'Düşük' : 'Low')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{formatDate(item.createdAt)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

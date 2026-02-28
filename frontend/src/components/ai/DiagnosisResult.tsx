import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Pill } from 'lucide-react';
import type { AIDiagnosisResult } from '../../types';

interface DiagnosisResultProps {
  result: AIDiagnosisResult;
}

export default function DiagnosisResult({ result }: DiagnosisResultProps) {
  const { t } = useTranslation();
  const isHealthy = result.disease.includes('Sağlıklı') || result.disease.includes('Healthy');

  return (
    <div className="space-y-3 animate-fade-in">
      <div className={`flex items-center gap-3 p-4 rounded-2xl ${isHealthy ? 'bg-[#2D6A4F]/20' : 'bg-[#A47148]/20'}`}>
        {isHealthy ? <CheckCircle size={24} className="text-[#2D6A4F]" /> : <AlertTriangle size={24} className="text-[#A47148]" />}
        <div>
          <p className="text-xs text-white/50 uppercase font-medium">{t('ai.disease')}</p>
          <p className="text-sm font-semibold tracking-tight">{result.disease}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl">
        <div className="flex-1">
          <p className="text-xs text-white/50 uppercase font-medium">{t('ai.confidence')}</p>
          <p className="text-xl font-semibold">%{result.confidence}</p>
        </div>
        <div className="w-16 h-16 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.91" fill="none"
              stroke={result.confidence > 80 ? '#2D6A4F' : '#A47148'}
              strokeWidth="3"
              strokeDasharray={`${result.confidence} ${100 - result.confidence}`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-white/10 rounded-2xl">
        <Pill size={20} className="text-[#2D6A4F] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-white/50 uppercase font-medium mb-1">{t('ai.treatment')}</p>
          <p className="text-sm text-white/80 leading-relaxed">{result.treatment}</p>
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, CheckCircle, Pill, Activity,
  TrendingUp, AlertOctagon, Leaf, Camera,
} from 'lucide-react';
import type { AIDiagnosisResult } from '../../types';
import DealerList from '../ads/DealerList';

interface DiagnosisResultProps {
  result: AIDiagnosisResult;
}

const STAGE_MAP = {
  early: { tr: 'Erken Evre', en: 'Early Stage', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  mid: { tr: 'Orta Evre', en: 'Mid Stage', color: 'text-amber-600', bg: 'bg-amber-50' },
  advanced: { tr: 'İleri Evre', en: 'Advanced Stage', color: 'text-red-600', bg: 'bg-red-50' },
};

const RISK_MAP = {
  low: { tr: 'Düşük', en: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  medium: { tr: 'Orta', en: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' },
  high: { tr: 'Yüksek', en: 'High', color: 'text-red-600', bg: 'bg-red-50' },
};

const URGENCY_MAP = {
  low: { tr: 'Düşük', en: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  medium: { tr: 'Orta', en: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
  critical: { tr: 'Kritik', en: 'Critical', color: 'text-red-600', bg: 'bg-red-50', icon: AlertOctagon },
};

export default function DiagnosisResult({ result }: DiagnosisResultProps) {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const lang = isTr ? 'tr' : 'en';
  const isHealthy = result.disease_code === 'saglikli';

  const stageInfo = STAGE_MAP[result.stage];
  const riskInfo = RISK_MAP[result.spread_risk];
  const urgencyInfo = URGENCY_MAP[result.urgency];
  const UrgencyIcon = urgencyInfo.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Low confidence warning */}
      {result.needs_better_photo && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <Camera size={20} className="text-amber-600 shrink-0" />
          <p className="text-[13px] text-amber-800 font-medium leading-relaxed">
            {result.warning}
          </p>
        </div>
      )}

      {/* Disease name + confidence */}
      <div className={`
        relative overflow-hidden rounded-2xl p-5
        ${isHealthy
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50'
          : 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50'
        }
      `}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isHealthy ? 'bg-emerald-100' : 'bg-orange-100'}`}>
            {isHealthy
              ? <CheckCircle size={22} className="text-emerald-600" />
              : <AlertTriangle size={22} className="text-orange-600" />
            }
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider mb-0.5">
              {isTr ? 'Teşhis' : 'Diagnosis'}
            </p>
            <p className="text-[15px] font-semibold text-gray-900 tracking-tight">
              {result.disease}
            </p>
            {result.crop_type && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Leaf size={13} className="text-emerald-500" />
                <span className="text-[12px] text-gray-500 font-medium">{result.crop_type}</span>
              </div>
            )}
          </div>
          {/* Circular confidence gauge */}
          <div className="w-16 h-16 relative shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.91" fill="none"
                stroke={result.confidence >= 85 ? '#059669' : '#d97706'}
                strokeWidth="2.5"
                strokeDasharray={`${result.confidence} ${100 - result.confidence}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[13px] font-bold text-gray-900">%{result.confidence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage, Spread Risk, Urgency — 3 metric cards */}
      {!isHealthy && (
        <div className="grid grid-cols-3 gap-2.5">
          {/* Stage */}
          <div className={`rounded-xl p-3.5 ${stageInfo.bg} border border-black/5`}>
            <Activity size={16} className={`${stageInfo.color} mb-1.5`} />
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              {isTr ? 'Evre' : 'Stage'}
            </p>
            <p className={`text-[13px] font-semibold ${stageInfo.color}`}>
              {stageInfo[lang]}
            </p>
          </div>

          {/* Spread risk */}
          <div className={`rounded-xl p-3.5 ${riskInfo.bg} border border-black/5`}>
            <TrendingUp size={16} className={`${riskInfo.color} mb-1.5`} />
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              {isTr ? 'Yayılma' : 'Spread'}
            </p>
            <p className={`text-[13px] font-semibold ${riskInfo.color}`}>
              {riskInfo[lang]}
            </p>
          </div>

          {/* Urgency */}
          <div className={`rounded-xl p-3.5 ${urgencyInfo.bg} border border-black/5`}>
            <UrgencyIcon size={16} className={`${urgencyInfo.color} mb-1.5`} />
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              {isTr ? 'Aciliyet' : 'Urgency'}
            </p>
            <p className={`text-[13px] font-semibold ${urgencyInfo.color}`}>
              {urgencyInfo[lang]}
            </p>
          </div>
        </div>
      )}

      {/* Treatment */}
      <div className="rounded-2xl p-5 bg-white/70 backdrop-blur-md border border-white/20 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Pill size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider mb-1">
              {isTr ? 'Tedavi Önerisi' : 'Treatment'}
            </p>
            <p className="text-[13px] text-gray-700 leading-relaxed">{result.treatment}</p>
          </div>
        </div>
      </div>

      {/* Contextual dealer recommendations */}
      {!isHealthy && result.disease_code && (
        <DealerList disease_code={result.disease_code} radius={50} className="mt-2" />
      )}
    </div>
  );
}

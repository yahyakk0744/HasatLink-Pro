import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Pill, Activity,
  TrendingUp, AlertOctagon, Leaf, Camera, Sprout, Bug,
  Sun, ZoomIn, ImageOff, ShieldAlert, Timer, Star,
  Package, ShoppingBag, Wrench, Cpu, Search,
  MessageCircle, Send, Microscope, Sparkles,
  Zap, TrendingDown, Calendar, FlaskConical, CloudRain, GitBranch,
} from 'lucide-react';
import api from '../../config/api';
import type { AIDiagnosisResult, Listing } from '../../types';

interface DiagnosisResultProps {
  result: AIDiagnosisResult;
  matchedListings?: Listing[];
  matchedProfessionals?: Listing[];
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

const ECONOMIC_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  none:     { label: 'Kayıp Yok',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200/60' },
  low:      { label: 'Düşük Kayıp', color: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-200/60' },
  medium:   { label: 'Orta Kayıp',  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200/60' },
  high:     { label: 'Yüksek Kayıp', color: 'text-orange-700', bg: 'bg-orange-50',   border: 'border-orange-200/60' },
  critical: { label: 'Kritik Kayıp', color: 'text-red-700',    bg: 'bg-red-50',      border: 'border-red-200/60' },
};

// Treatment steps parsed from treatment text into actionable checklist
function buildActionSteps(treatment: string, isTr: boolean): string[] {
  // Split by sentence or common delimiters
  const raw = treatment.split(/[.;،]\s+/).filter(s => s.trim().length > 10).slice(0, 5);
  if (raw.length >= 2) return raw;
  // Fallback generic steps
  return isTr
    ? ['Etkilenen yaprak ve sürgünleri hemen uzaklaştırın', 'Önerilen ilaçla sabah erken saatlerde ilaçlama yapın', 'Sulama sıklığını kontrol edin, aşırı nemden kaçının', 'Komşu bitkileri düzenli kontrol edin', 'Hafta sonra durumu yeniden değerlendirin']
    : ['Remove affected leaves and shoots immediately', 'Apply recommended treatment early morning', 'Check irrigation frequency, avoid excess moisture', 'Inspect neighboring plants regularly', 'Re-evaluate in one week'];
}

const QUICK_QUESTIONS_TR = [
  'Ne kadar ilaç kullanmalıyım?',
  'Organik çözüm var mı?',
  'Hasatı etkileyecek mi?',
  'Komşu bitkilere bulaşır mı?',
];
const QUICK_QUESTIONS_EN = [
  'How much product should I use?',
  'Any organic solutions?',
  'Will it affect harvest?',
  'Can it spread to other plants?',
];

export default function DiagnosisResult({ result, matchedListings = [], matchedProfessionals = [] }: DiagnosisResultProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const lang = isTr ? 'tr' : 'en';
  const isHealthy = result.disease_code === 'saglikli';
  const actionSteps = !isHealthy ? buildActionSteps(result.treatment, isTr) : [];

  const stageInfo = STAGE_MAP[result.stage];
  const riskInfo = RISK_MAP[result.spread_risk];
  const urgencyInfo = URGENCY_MAP[result.urgency];
  const UrgencyIcon = urgencyInfo.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Crop Type + Disease badges */}
      <div className="flex flex-wrap gap-2">
        {result.detected_crop && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-[12px] font-semibold">
            <Sprout size={13} />
            {result.detected_crop}
          </span>
        )}
        {!isHealthy && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/50 text-orange-700 text-[12px] font-semibold">
            <Bug size={13} />
            {result.disease.split('(')[0].trim()}
          </span>
        )}
        {isHealthy && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-[12px] font-semibold">
            <CheckCircle size={13} />
            {isTr ? 'Sağlıklı' : 'Healthy'}
          </span>
        )}
        {result.seasonal_alert && !isHealthy && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200/50 text-red-700 text-[12px] font-semibold animate-pulse">
            <ShieldAlert size={13} />
            {isTr ? 'Mevsimsel Risk' : 'Seasonal Risk'}
          </span>
        )}
        {result.ai_engine === 'gemini' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/50 text-blue-700 text-[12px] font-semibold">
            <Microscope size={13} />
            Gemini AI
          </span>
        )}
        {result.ai_engine === 'huggingface' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/50 text-indigo-700 text-[12px] font-semibold">
            <Cpu size={13} />
            AI Model
          </span>
        )}
      </div>

      {/* HF Top 3 Predictions */}
      {result.hf_top3 && result.hf_top3.length > 1 && (
        <div className="rounded-2xl p-4 bg-indigo-50/50 backdrop-blur-md border border-indigo-200/30">
          <div className="flex items-center gap-2 mb-2.5">
            <Search size={14} className="text-indigo-600" />
            <p className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
              {isTr ? 'AI Analiz Sonuçları' : 'AI Analysis Results'}
            </p>
          </div>
          <div className="space-y-1.5">
            {result.hf_top3.map((pred, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>{i + 1}</span>
                <span className="flex-1 text-[12px] text-indigo-900 font-medium truncate">{pred.label_tr}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pred.score}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 w-8 text-right">%{pred.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low confidence warning */}
      {result.needs_better_photo && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Camera size={20} className="text-amber-600 shrink-0" />
            <p className="text-[13px] text-amber-800 font-medium leading-relaxed">
              {result.warning}
            </p>
          </div>
          <div className="px-4 pb-4 pt-0">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2">
              {isTr ? 'Olası Nedenler' : 'Possible Reasons'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Sun, label: isTr ? 'Işık yetersiz' : 'Low light' },
                { icon: ZoomIn, label: isTr ? 'Bitki uzakta' : 'Too far' },
                { icon: ImageOff, label: isTr ? 'Bulanık görsel' : 'Blurry image' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-amber-100/50">
                  <Icon size={16} className="text-amber-600" />
                  <span className="text-[10px] text-amber-700 font-medium text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>
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
              {isTr ? 'TESPİT' : 'Diagnosis'}
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

      {/* ─── IMMEDIATE ACTION — most prominent, shown first ─── */}
      {result.immediate_action && !isHealthy && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-0.5">
                {isTr ? 'ACİL EYLEM' : 'IMMEDIATE ACTION'}
              </p>
              <p className="text-[13px] font-semibold text-white leading-relaxed">{result.immediate_action}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stage, Spread Risk, Urgency — 3 metric cards */}
      {!isHealthy && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className={`rounded-xl p-3.5 ${stageInfo.bg} border border-black/5`}>
            <Activity size={16} className={`${stageInfo.color} mb-1.5`} />
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              {isTr ? 'Evre' : 'Stage'}
            </p>
            <p className={`text-[13px] font-semibold ${stageInfo.color}`}>
              {stageInfo[lang]}
            </p>
          </div>
          <div className={`rounded-xl p-3.5 ${riskInfo.bg} border border-black/5`}>
            <TrendingUp size={16} className={`${riskInfo.color} mb-1.5`} />
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              {isTr ? 'Yayılma' : 'Spread'}
            </p>
            <p className={`text-[13px] font-semibold ${riskInfo.color}`}>
              {riskInfo[lang]}
            </p>
          </div>
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

      {/* Economic Impact + Growth Stage */}
      {!isHealthy && (result.economic_impact || result.growth_stage_pct !== undefined) && (
        <div className="grid grid-cols-2 gap-2.5">
          {result.economic_impact && result.economic_impact !== 'none' && (
            <div className={`rounded-xl p-3.5 border ${ECONOMIC_MAP[result.economic_impact]?.bg || 'bg-amber-50'} ${ECONOMIC_MAP[result.economic_impact]?.border || 'border-amber-200/60'}`}>
              <TrendingDown size={16} className={`${ECONOMIC_MAP[result.economic_impact]?.color || 'text-amber-700'} mb-1.5`} />
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                {isTr ? 'Ekonomik Etki' : 'Economic Impact'}
              </p>
              <p className={`text-[12px] font-bold ${ECONOMIC_MAP[result.economic_impact]?.color || 'text-amber-700'}`}>
                {ECONOMIC_MAP[result.economic_impact]?.label}
                {typeof result.economic_loss_estimate === 'number' && result.economic_loss_estimate > 0
                  ? ` ~%${result.economic_loss_estimate}`
                  : ''}
              </p>
            </div>
          )}
          {typeof result.growth_stage_pct === 'number' && (
            <div className="rounded-xl p-3.5 bg-violet-50 border border-violet-200/60">
              <Sprout size={16} className="text-violet-600 mb-1.5" />
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                {isTr ? 'Büyüme' : 'Growth'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${result.growth_stage_pct}%` }} />
                </div>
                <span className="text-[12px] font-bold text-violet-700">%{result.growth_stage_pct}</span>
              </div>
            </div>
          )}
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
              {isTr ? 'ÇÖZÜM' : 'Treatment'}
            </p>
            <p className="text-[13px] text-gray-700 leading-relaxed">{result.treatment}</p>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      {result.recommended_products && result.recommended_products.length > 0 && (
        <div className="rounded-2xl p-4 bg-blue-50/50 backdrop-blur-md border border-blue-200/30">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-blue-600" />
            <p className="text-[12px] font-semibold text-blue-800 uppercase tracking-wider">
              {isTr ? 'Önerilen Ürünler' : 'Recommended Products'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.recommended_products.map(p => (
              <span key={p} className="px-3 py-1.5 rounded-full bg-blue-100/60 text-blue-700 text-[11px] font-semibold border border-blue-200/40">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prevention Tips */}
      {result.prevention && !isHealthy && (
        <div className="rounded-2xl p-4 bg-violet-50/50 backdrop-blur-md border border-violet-200/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <ShieldAlert size={16} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[11px] text-violet-700 uppercase font-semibold tracking-wider mb-1">
                {isTr ? 'Önleme' : 'Prevention'}
              </p>
              <p className="text-[12px] text-violet-800 leading-relaxed">{result.prevention}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TREATMENT SCHEDULE — day-by-day timeline ─── */}
      {!isHealthy && result.treatment_schedule && result.treatment_schedule.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-indigo-200/30 bg-gradient-to-br from-indigo-50/80 to-violet-50/80 backdrop-blur-md">
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Calendar size={16} className="text-indigo-600" />
              </div>
              <p className="text-[12px] font-semibold text-indigo-800 uppercase tracking-wider">
                {isTr ? 'Tedavi Takvimi' : 'Treatment Schedule'}
              </p>
            </div>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-indigo-200/60" />
              <div className="space-y-3">
                {result.treatment_schedule.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 z-10">
                      {step.day === 0 ? isTr ? 'Bug' : 'Now' : `G${step.day}`}
                    </div>
                    <div className="flex-1 bg-white/60 rounded-xl p-2.5 border border-indigo-100/60">
                      <p className="text-[10px] font-bold text-indigo-600 mb-0.5">
                        {step.day === 0 ? (isTr ? 'Bugün' : 'Today') : (isTr ? `${step.day}. Gün` : `Day ${step.day}`)}
                      </p>
                      <p className="text-[12px] text-gray-700 leading-relaxed">{step.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIFFERENTIAL DIAGNOSIS ─── */}
      {!isHealthy && result.differential_diagnosis && result.differential_diagnosis.length > 0 && (
        <div className="rounded-2xl p-4 bg-slate-50/80 backdrop-blur-md border border-slate-200/30">
          <div className="flex items-center gap-2 mb-2.5">
            <GitBranch size={15} className="text-slate-600" />
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              {isTr ? 'Alternatif Teşhisler' : 'Differential Diagnosis'}
            </p>
          </div>
          <div className="space-y-1.5">
            {result.differential_diagnosis.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WEATHER TRIGGERS + LAB CONFIRMATION ─── */}
      {!isHealthy && (result.weather_triggers || result.lab_confirmation) && (
        <div className="grid grid-cols-1 gap-2.5">
          {result.weather_triggers && (
            <div className="rounded-xl p-3.5 bg-sky-50/80 border border-sky-200/40 flex items-start gap-3">
              <CloudRain size={15} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-0.5">
                  {isTr ? 'Hava Riski' : 'Weather Risk'}
                </p>
                <p className="text-[12px] text-sky-800 leading-relaxed">{result.weather_triggers}</p>
              </div>
            </div>
          )}
          {result.lab_confirmation && (
            <div className="rounded-xl p-3.5 bg-amber-50/80 border border-amber-200/40 flex items-start gap-3">
              <FlaskConical size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                  {isTr ? 'Laboratuvar Önerisi' : 'Lab Recommended'}
                </p>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  {isTr
                    ? 'Kesin teşhis için numune alıp laboratuvar analizi yaptırmanız önerilir.'
                    : 'Laboratory analysis is recommended to confirm the diagnosis.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── HARVEST PREDICTION ─── */}
      {result.harvest_prediction && (
        <div className="rounded-2xl overflow-hidden border border-emerald-200/30 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-md">
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Timer size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-emerald-800 uppercase tracking-wider">
                  {isTr ? 'Hasat Tahmini' : 'Harvest Prediction'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Days to harvest */}
              <div className="rounded-xl bg-white/60 p-3 text-center border border-emerald-200/30">
                <p className="text-[24px] font-bold text-emerald-700">{result.harvest_prediction.estimated_days}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase">{isTr ? 'Gün Kaldı' : 'Days Left'}</p>
              </div>
              {/* Quality score */}
              <div className="rounded-xl bg-white/60 p-3 text-center border border-emerald-200/30">
                <div className="flex items-center justify-center gap-1">
                  <Star size={16} className={result.harvest_prediction.quality_score >= 80 ? 'text-amber-500 fill-amber-500' : 'text-gray-400'} />
                  <p className="text-[24px] font-bold text-gray-800">{result.harvest_prediction.quality_score}</p>
                </div>
                <p className="text-[10px] text-gray-500 font-medium uppercase">
                  {isTr ? `Kalite: ${result.harvest_prediction.quality_label}` : `Quality: ${result.harvest_prediction.quality_label}`}
                </p>
              </div>
            </div>

            {/* Quality factors */}
            <div className="flex flex-wrap gap-1.5">
              {result.harvest_prediction.quality_factors.map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full bg-emerald-100/60 text-emerald-700 text-[10px] font-medium border border-emerald-200/30">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Optimal conditions footer */}
          <div className="px-4 py-2.5 bg-emerald-100/40 border-t border-emerald-200/30">
            <p className="text-[10px] text-emerald-700">
              <span className="font-semibold">{isTr ? 'İdeal Koşullar:' : 'Optimal:'}</span>{' '}
              {result.harvest_prediction.optimal_conditions}
            </p>
          </div>
        </div>
      )}

      {/* ─── SMART MATCHING: Related Listings ─── */}
      {matchedListings.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <ShoppingBag size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  {isTr ? 'İlgili Ürünler' : 'Related Products'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {isTr ? 'Tedavi için önerilen ilanlar' : 'Suggested listings for treatment'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {matchedListings.slice(0, 4).map(listing => (
                <Link
                  key={listing._id}
                  to={`/ilan/${listing._id}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-default)]/50"
                >
                  {listing.images?.[0] && (
                    <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{listing.title}</p>
                    <p className="text-[10px] font-bold text-[var(--accent-green)]">{listing.price ? `${listing.price} TL` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SMART MATCHING: Professionals ─── */}
      {matchedProfessionals.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Wrench size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  {isTr ? 'UZMAN ÖNERİSİ' : 'Expert Help'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {isTr ? 'Bölgenizde ziraat uzmanları' : 'Agricultural experts in your area'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {matchedProfessionals.slice(0, 3).map(pro => (
                <Link
                  key={pro._id}
                  to={`/ilan/${pro._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-default)]/50"
                >
                  {pro.sellerImage ? (
                    <img src={pro.sellerImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Wrench size={14} className="text-indigo-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{pro.title}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{pro.sellerName} {pro.location ? `- ${pro.location}` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── GEMINI DETAILED ANALYSIS ─── */}
      {result.gemini_analysis && (
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-md border border-blue-200/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Microscope size={16} className="text-blue-600" />
            </div>
            <p className="text-[12px] font-semibold text-blue-800 uppercase tracking-wider">
              {isTr ? 'Detayli Analiz' : 'Detailed Analysis'}
            </p>
          </div>
          <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{result.gemini_analysis}</p>
        </div>
      )}

      {/* ─── AKSİYON PLANI ─── */}
      {!isHealthy && actionSteps.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-teal-50/80 to-emerald-50/80 border border-teal-200/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <CheckCircle size={16} className="text-teal-600" />
            </div>
            <p className="text-[12px] font-semibold text-teal-800 uppercase tracking-wider">
              {isTr ? 'Aksiyon Planı' : 'Action Plan'}
            </p>
            <span className="ml-auto text-[10px] font-medium text-teal-600">
              {checkedSteps.size}/{actionSteps.length} {isTr ? 'tamamlandı' : 'done'}
            </span>
          </div>
          <div className="space-y-2">
            {actionSteps.map((step, i) => (
              <button
                key={i}
                onClick={() => setCheckedSteps(prev => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i); else next.add(i);
                  return next;
                })}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                  checkedSteps.has(i) ? 'bg-teal-100/60 opacity-60' : 'bg-white/60 hover:bg-white/80'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  checkedSteps.has(i) ? 'bg-teal-500 border-teal-500' : 'border-teal-300'
                }`}>
                  {checkedSteps.has(i) && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-[12px] leading-relaxed ${checkedSteps.has(i) ? 'line-through text-teal-600' : 'text-gray-700'}`}>
                  {step.trim()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── ASK EXPERT BUTTON + CHAT ─── */}
      {!isHealthy && (
        <div className="space-y-3">
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[13px] font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} />
              {isTr ? 'Mühendise Detaylı Sor' : 'Ask Expert'}
            </button>
          ) : (
            <div className="rounded-2xl border border-blue-200/40 bg-white/80 backdrop-blur-md overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <p className="text-[13px] font-semibold text-white">
                  {isTr ? 'Ziraat Mühendisi AI' : 'Agricultural Engineer AI'}
                </p>
                <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white/80">
                  {isTr ? 'Çevrimiçi' : 'Online'}
                </span>
              </div>

              {/* Chat messages */}
              <div className="max-h-[280px] overflow-y-auto p-3 space-y-2.5">
                {chatMessages.length === 0 && (
                  <div className="py-3 space-y-2">
                    <p className="text-[11px] text-gray-400 text-center mb-3">
                      {isTr ? 'Hızlı soru seçin veya kendiniz yazın:' : 'Pick a quick question or type your own:'}
                    </p>
                    {/* Quick question chips */}
                    <div className="flex flex-wrap gap-2">
                      {(isTr ? QUICK_QUESTIONS_TR : QUICK_QUESTIONS_EN).map((q) => (
                        <button
                          key={q}
                          onClick={() => { setChatInput(q); }}
                          className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[11px] font-medium hover:bg-blue-100 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                        <Sparkles size={11} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Sparkles size={11} className="text-white" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-gray-100 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input */}
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && chatInput.trim() && !chatLoading) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder={isTr ? 'Sorunuzu yazın...' : 'Type your question...'}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[12px] text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  async function handleSendChat() {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);
    try {
      const { data } = await api.post<{ answer: string }>('/ai/followup', {
        question: q,
        context: { crop_type: result.crop_type, disease: result.disease, treatment: result.treatment },
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: isTr ? 'Yanit alinamadi. Tekrar deneyin.' : 'Could not get response. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  }
}

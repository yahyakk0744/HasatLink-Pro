import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Pill, Activity,
  TrendingUp, AlertOctagon, Leaf, Camera, Sprout, Bug,
  Sun, ZoomIn, ImageOff, ShieldAlert, Timer, Star,
  Package, ShoppingBag, Wrench,
} from 'lucide-react';
import type { AIDiagnosisResult, Listing } from '../../types';

interface DiagnosisResultProps {
  result: AIDiagnosisResult;
  matchedListings?: Listing[];
  matchedProfessionals?: Listing[];
}

const STAGE_MAP = {
  early: { tr: 'Erken Evre', en: 'Early Stage', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  mid: { tr: 'Orta Evre', en: 'Mid Stage', color: 'text-amber-600', bg: 'bg-amber-50' },
  advanced: { tr: 'Ileri Evre', en: 'Advanced Stage', color: 'text-red-600', bg: 'bg-red-50' },
};

const RISK_MAP = {
  low: { tr: 'Dusuk', en: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  medium: { tr: 'Orta', en: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' },
  high: { tr: 'Yuksek', en: 'High', color: 'text-red-600', bg: 'bg-red-50' },
};

const URGENCY_MAP = {
  low: { tr: 'Dusuk', en: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  medium: { tr: 'Orta', en: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
  critical: { tr: 'Kritik', en: 'Critical', color: 'text-red-600', bg: 'bg-red-50', icon: AlertOctagon },
};

export default function DiagnosisResult({ result, matchedListings = [], matchedProfessionals = [] }: DiagnosisResultProps) {
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
            {isTr ? 'Saglikli' : 'Healthy'}
          </span>
        )}
        {result.seasonal_alert && !isHealthy && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200/50 text-red-700 text-[12px] font-semibold animate-pulse">
            <ShieldAlert size={13} />
            {isTr ? 'Mevsimsel Risk' : 'Seasonal Risk'}
          </span>
        )}
      </div>

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
              {isTr ? 'Olasi Nedenler' : 'Possible Reasons'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Sun, label: isTr ? 'Isik yetersiz' : 'Low light' },
                { icon: ZoomIn, label: isTr ? 'Bitki uzakta' : 'Too far' },
                { icon: ImageOff, label: isTr ? 'Bulanik gorsel' : 'Blurry image' },
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
              {isTr ? 'Teshis' : 'Diagnosis'}
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
              {isTr ? 'Yayilma' : 'Spread'}
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

      {/* Treatment */}
      <div className="rounded-2xl p-5 bg-white/70 backdrop-blur-md border border-white/20 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Pill size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider mb-1">
              {isTr ? 'Tedavi Onerisi' : 'Treatment'}
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
              {isTr ? 'Onerilen Urunler' : 'Recommended Products'}
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
                {isTr ? 'Onleme' : 'Prevention'}
              </p>
              <p className="text-[12px] text-violet-800 leading-relaxed">{result.prevention}</p>
            </div>
          </div>
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
                <p className="text-[10px] text-gray-500 font-medium uppercase">{isTr ? 'Gun Kaldi' : 'Days Left'}</p>
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
              <span className="font-semibold">{isTr ? 'Ideal Kosullar:' : 'Optimal:'}</span>{' '}
              {result.harvest_prediction.optimal_conditions}
            </p>
          </div>
        </div>
      )}

      {/* ─── REGIONAL ALERTS ─── */}
      {result.regional_alerts && result.regional_alerts.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-red-200/30 bg-gradient-to-br from-red-50/60 to-orange-50/60 backdrop-blur-md">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                <ShieldAlert size={16} className="text-red-600" />
              </div>
              <p className="text-[12px] font-semibold text-red-800 uppercase tracking-wider">
                {isTr ? 'Bolgesel Uyari' : 'Regional Alert'}
              </p>
            </div>
            <div className="space-y-2">
              {result.regional_alerts.map((alert, i) => (
                <div key={i} className="rounded-xl bg-white/50 p-3 border border-red-200/20">
                  <p className="text-[12px] text-red-800 leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
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
                  {isTr ? 'Ilgili Urunler' : 'Related Products'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {isTr ? 'Tedavi icin onerilen ilanlar' : 'Suggested listings for treatment'}
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
                  {isTr ? 'Uzman Yardimi' : 'Expert Help'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {isTr ? 'Bolgenizde ziraat uzmanlari' : 'Agricultural experts in your area'}
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
    </div>
  );
}

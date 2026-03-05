import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Sparkles, X, Camera, Leaf } from 'lucide-react';
import Button from '../ui/Button';
import DiagnosisResult from './DiagnosisResult';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';

export default function AIDiagnosisPanel() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { result, loading, diagnose, clearResult, matchedListings, matchedProfessionals } = useAIDiagnosis();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setPreview(URL.createObjectURL(file));
    diagnose(file);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleReset = () => {
    setPreview(null);
    clearResult();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-default)] shadow-lg">
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              HasatAI
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-widest">
                {isTr ? 'Yapay Zeka' : 'AI'}
              </span>
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)]">
              {isTr ? 'Bitki Doktoru & Hasat Tahmini' : 'Plant Doctor & Harvest Prediction'}
            </p>
          </div>
        </div>

        {/* Upload area */}
        {!preview && !loading && !result && (
          <label
            className="block cursor-pointer"
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
              ${dragActive
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]'
                : 'border-[var(--border-default)] hover:border-emerald-400 hover:bg-emerald-50/20'
              }
            `}>
              {/* Animated rings */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-400/15 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 flex items-center justify-center">
                  <Upload size={28} className="text-emerald-600" />
                </div>
              </div>

              <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">
                {isTr ? 'Bitki Fotoğrafını Yükle' : 'Upload Plant Photo'}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] mb-3">
                {isTr ? 'Hastalık teşhisi, hasat tahmini ve akıllı yönlendirme' : 'Disease diagnosis, harvest prediction & smart matching'}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: Leaf, label: isTr ? 'Hastalık Teşhisi' : 'Disease Detection' },
                  { icon: Camera, label: isTr ? 'Hasat Tahmini' : 'Harvest Forecast' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-input)] text-[10px] font-medium text-[var(--text-secondary)] border border-[var(--border-default)]/50">
                    <Icon size={11} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
          </label>
        )}

        {/* Preview */}
        {preview && (
          <div className="relative mb-4 rounded-2xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {!loading && !result && (
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Loading — AI Analysis Animation */}
        {loading && (
          <div className="py-8 text-center space-y-5">
            {/* Animated DNA helix style */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-teal-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles size={24} className="text-white animate-pulse" />
              </div>
            </div>

            {/* Progress steps */}
            <div className="space-y-2 max-w-xs mx-auto">
              {[
                isTr ? 'Görsel analiz ediliyor...' : 'Analyzing image...',
                isTr ? 'Bitki türü tanımlanıyor...' : 'Identifying crop type...',
                isTr ? 'Hastalık tespiti yapılıyor...' : 'Detecting diseases...',
              ].map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-input)] animate-fade-in"
                  style={{ animationDelay: `${i * 400}ms` }}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)]">{step}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto">
              <div className="h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-progress" />
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <DiagnosisResult
            result={result}
            matchedListings={matchedListings}
            matchedProfessionals={matchedProfessionals}
          />
        )}

        {/* Reset */}
        {(preview || result) && !loading && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full mt-5"
          >
            {t('ai.tryAgain')}
          </Button>
        )}
      </div>
    </div>
  );
}

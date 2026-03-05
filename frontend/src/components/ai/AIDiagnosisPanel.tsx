import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Cpu, X } from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import DiagnosisResult from './DiagnosisResult';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';
export default function AIDiagnosisPanel() {
  const { t } = useTranslation();
  const { result, loading, diagnose, clearResult } = useAIDiagnosis();
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    diagnose(file);
  };

  const handleReset = () => {
    setPreview(null);
    clearResult();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border-default)] shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-green)] to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
          <Cpu size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">{t('ai.title')}</h3>
          <p className="text-[12px] text-[var(--text-secondary)]">{t('ai.subtitle')}</p>
        </div>
      </div>

      {/* Upload area */}
      {!preview && !loading && !result && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-[var(--border-default)] rounded-2xl p-10 text-center hover:border-[var(--accent-green)] hover:bg-[var(--accent-green)]/5 transition-all">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--bg-input)] flex items-center justify-center">
              <Upload size={24} className="text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">{t('ai.upload')}</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{t('ai.uploadDescription')}</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
        </label>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative mb-4">
          <img src={preview} alt="Preview" className="w-full aspect-video object-cover rounded-2xl" />
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

      {/* Loading */}
      {loading && (
        <div className="py-10 text-center">
          <LoadingSpinner size="lg" className="mb-3" />
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">{t('ai.analyzing')}</p>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">AI modeli analiz ediyor...</p>
        </div>
      )}

      {/* Result */}
      {result && <DiagnosisResult result={result} />}

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
  );
}

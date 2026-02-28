import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Cpu } from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import DiagnosisResult from './DiagnosisResult';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';
import { useAuth } from '../../contexts/AuthContext';

export default function AIDiagnosisPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { result, loading, diagnose, clearResult } = useAIDiagnosis();
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      diagnose(base64, user?.userId);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setPreview(null);
    clearResult();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2520] rounded-[2.5rem] p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#2D6A4F] rounded-2xl flex items-center justify-center">
          <Cpu size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{t('ai.title')}</h3>
          <p className="text-xs text-white/50">{t('ai.subtitle')}</p>
        </div>
      </div>

      {!preview && !loading && !result && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-[#2D6A4F] transition-colors">
            <Upload size={32} className="mx-auto mb-3 text-white/50" />
            <p className="text-sm font-semibold">{t('ai.upload')}</p>
            <p className="text-xs text-white/40 mt-1">{t('ai.uploadDescription')}</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      )}

      {preview && (
        <img src={preview} alt="Preview" className="w-full aspect-video object-cover rounded-2xl mb-4" />
      )}

      {loading && (
        <div className="py-8 text-center">
          <LoadingSpinner size="lg" className="mb-3" />
          <p className="text-sm font-semibold">{t('ai.analyzing')}</p>
        </div>
      )}

      {result && <DiagnosisResult result={result} />}

      {(preview || result) && (
        <Button variant="outline" onClick={handleReset} className="w-full mt-4 border-white/20 text-white hover:bg-white/10 hover:text-white">
          {t('ai.tryAgain')}
        </Button>
      )}
    </div>
  );
}

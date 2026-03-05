import { useState, useCallback } from 'react';
import api from '../config/api';
import type { AIDiagnosisResult, AIDiagnosisHistory } from '../types';

export const useAIDiagnosis = () => {
  const [result, setResult] = useState<AIDiagnosisResult | null>(null);
  const [history, setHistory] = useState<AIDiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const diagnose = useCallback(async (file: File): Promise<AIDiagnosisResult | null> => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post<AIDiagnosisResult>('/ai/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      return data;
    } catch { return null; } finally { setLoading(false); }
  }, []);

  const fetchHistory = useCallback(async (userId: string) => {
    try {
      const { data } = await api.get<AIDiagnosisHistory[]>(`/ai/history/${userId}`);
      setHistory(data);
    } catch {}
  }, []);

  const clearResult = useCallback(() => setResult(null), []);

  return { result, history, loading, diagnose, fetchHistory, clearResult };
};

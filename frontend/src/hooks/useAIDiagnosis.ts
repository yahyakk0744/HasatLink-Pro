import { useState, useCallback } from 'react';
import api from '../config/api';
import type { AIDiagnosisResult, AIDiagnosisHistory, DiseaseLibraryItem, RegionalAlert, Listing } from '../types';

export const useAIDiagnosis = () => {
  const [result, setResult] = useState<AIDiagnosisResult | null>(null);
  const [history, setHistory] = useState<AIDiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [diseases, setDiseases] = useState<DiseaseLibraryItem[]>([]);
  const [alerts, setAlerts] = useState<RegionalAlert[]>([]);
  const [matchedListings, setMatchedListings] = useState<Listing[]>([]);
  const [matchedProfessionals, setMatchedProfessionals] = useState<Listing[]>([]);

  const diagnose = useCallback(async (file: File): Promise<AIDiagnosisResult | null> => {
    setLoading(true);
    setResult(null);
    setMatchedListings([]);
    setMatchedProfessionals([]);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post<AIDiagnosisResult>('/ai/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);

      // Auto-fetch smart matches if disease found
      if (data.disease_code && data.disease_code !== 'saglikli') {
        api.get(`/ai/match/${data.disease_code}`)
          .then(({ data: matchData }) => {
            setMatchedListings(matchData.listings || []);
            setMatchedProfessionals(matchData.professionals || []);
          })
          .catch(() => {});
      }

      return data;
    } catch { return null; } finally { setLoading(false); }
  }, []);

  const fetchHistory = useCallback(async (userId: string) => {
    try {
      const { data } = await api.get<AIDiagnosisHistory[]>(`/ai/history/${userId}`);
      setHistory(data);
    } catch {}
  }, []);

  const fetchDiseaseLibrary = useCallback(async () => {
    try {
      const { data } = await api.get<{ diseases: DiseaseLibraryItem[] }>('/ai/diseases');
      setDiseases(data.diseases);
    } catch {}
  }, []);

  const fetchAlerts = useCallback(async (region?: string) => {
    try {
      const params = region ? { region } : {};
      const { data } = await api.get<{ alerts: RegionalAlert[] }>('/ai/alerts', { params });
      setAlerts(data.alerts);
    } catch {}
  }, []);

  const followUp = useCallback(async (question: string, context?: { crop_type?: string; disease?: string; treatment?: string }): Promise<string | null> => {
    try {
      const { data } = await api.post<{ answer: string }>('/ai/followup', { question, context });
      return data.answer;
    } catch { return null; }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setMatchedListings([]);
    setMatchedProfessionals([]);
  }, []);

  return {
    result, history, loading, diseases, alerts, matchedListings, matchedProfessionals,
    diagnose, followUp, fetchHistory, fetchDiseaseLibrary, fetchAlerts, clearResult,
  };
};

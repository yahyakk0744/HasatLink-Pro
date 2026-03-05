import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, MapPin, Loader2 } from 'lucide-react';
import DealerCard from './DealerCard';
import EmptyState from '../ui/EmptyState';
import api from '../../config/api';
import type { NearbyDealerItem, DealersResponse } from '../../types';

interface DealerListProps {
  disease_code?: string;
  radius?: number;
  className?: string;
}

export default function DealerList({ disease_code, radius = 50, className = '' }: DealerListProps) {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [dealers, setDealers] = useState<NearbyDealerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  const fetchDealers = useCallback(async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
      });
      if (disease_code) params.append('disease_code', disease_code);
      const { data } = await api.get<DealersResponse>(`/dealers/nearby?${params}`);
      setDealers(data.dealers);
    } catch {
      setDealers([]);
    } finally {
      setLoading(false);
    }
  }, [disease_code, radius]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => fetchDealers(pos.coords.latitude, pos.coords.longitude),
      () => {
        // Fallback: Ankara coordinates
        fetchDealers(39.9334, 32.8597);
      },
      { timeout: 5000 }
    );
  }, [fetchDealers]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (locationError) {
    return (
      <EmptyState
        icon={<MapPin size={40} />}
        title={isTr ? 'Konum erişimi gerekli' : 'Location access required'}
      />
    );
  }

  if (dealers.length === 0) {
    return (
      <EmptyState
        icon={<Store size={40} />}
        title={isTr ? 'Yakınızda bayi bulunamadı' : 'No dealers found nearby'}
      />
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Store size={18} className="text-emerald-600" />
        </div>
        <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
          {isTr ? 'Yakınızdaki Bayiler' : 'Nearby Dealers'}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dealers.map(item => (
          <DealerCard key={item.dealer._id} item={item} />
        ))}
      </div>
    </div>
  );
}

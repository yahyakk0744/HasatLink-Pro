import { useEffect, useState } from 'react';
import api from '../../config/api';
import type { Ad } from '../../types';

interface BannerAdProps {
  slot: Ad['slot'];
  className?: string;
}

export default function BannerAd({ slot, className = '' }: BannerAdProps) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get<Ad[]>(`/ads/active?slot=${slot}`)
      .then(({ data }) => {
        if (mounted && data.length > 0) {
          const picked = data[Math.floor(Math.random() * data.length)];
          setAd(picked);
          api.post(`/ads/active/${picked._id}/impression`).catch(() => {});
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [slot]);

  if (!ad) return null;

  const handleClick = () => {
    api.post(`/ads/active/${ad._id}/click`).catch(() => {});
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`cursor-pointer overflow-hidden rounded-xl ${className}`} onClick={handleClick}>
      <img src={ad.imageUrl} alt="" className="w-full h-auto object-cover" />
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../config/api';
import type { Ad } from '../../types';

interface BannerAdProps {
  slot: Ad['slot'];
  className?: string;
}

function getImageSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    return `${api.defaults.baseURL?.replace('/api', '')}${url}`;
  }
  return url;
}

export default function BannerAd({ slot, className = '' }: BannerAdProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const imageSrc = isMobile && ad.mobileImageUrl
    ? getImageSrc(ad.mobileImageUrl)
    : getImageSrc(ad.imageUrl);

  return (
    <div
      className={`
        cursor-pointer overflow-hidden rounded-2xl
        bg-white/70 backdrop-blur-md
        border border-white/20
        shadow-sm hover:shadow-md
        transition-all duration-300
        hover:-translate-y-0.5
        ${className}
      `}
      onClick={handleClick}
    >
      <img src={imageSrc} alt="" className="w-full h-auto object-cover" />
    </div>
  );
}

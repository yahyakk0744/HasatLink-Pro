import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAds } from '../../hooks/useAds';
import type { Ad } from '../../types';
import api from '../../config/api';

function getImageSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    return `${api.defaults.baseURL?.replace('/api', '')}${url}`;
  }
  return url;
}

export default function BannerCarousel() {
  const { ads, fetchActiveAds, trackClick, trackImpression } = useAds();
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetchActiveAds('header');
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchActiveAds]);

  // Track impression when slide changes
  useEffect(() => {
    if (ads[current]) {
      trackImpression(ads[current]._id);
    }
  }, [current, ads, trackImpression]);

  // Auto-play every 5s
  const startAutoPlay = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % (ads.length || 1));
    }, 5000);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length > 1) {
      startAutoPlay();
      return () => clearInterval(intervalRef.current);
    }
  }, [ads.length, startAutoPlay]);

  const goTo = (index: number) => {
    setCurrent(index);
    clearInterval(intervalRef.current);
    startAutoPlay();
  };

  const handleClick = (ad: Ad) => {
    trackClick(ad._id);
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
  };

  if (ads.length === 0) return null;

  const ad = ads[current];
  const imageSrc = isMobile && ad.mobileImageUrl
    ? getImageSrc(ad.mobileImageUrl)
    : getImageSrc(ad.imageUrl);

  return (
    <div className="relative rounded-2xl overflow-hidden group cursor-pointer" onClick={() => handleClick(ad)}>
      {/* Image */}
      <div className="aspect-[21/6] md:aspect-[21/5] bg-[var(--bg-input)] relative overflow-hidden">
        <img
          src={imageSrc}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Navigation arrows */}
      {ads.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); goTo((current - 1 + ads.length) % ads.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); goTo((current + 1) % ads.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); goTo(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-4 bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

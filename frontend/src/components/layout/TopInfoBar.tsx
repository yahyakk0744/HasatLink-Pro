import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { useMarketPrices } from '../../hooks/useMarketPrices';

export default function TopInfoBar() {
  const { i18n } = useTranslation();
  const { weather, fetchWeather } = useWeather();
  const { prices, fetchPrices } = useMarketPrices();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  useEffect(() => {
    fetchWeather();
    fetchPrices();
  }, [fetchWeather, fetchPrices]);

  return (
    <div className="bg-[#1A1A1A] text-white text-xs py-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
        {/* Weather */}
        {weather && (
          <div className="flex items-center gap-2 shrink-0">
            <Cloud size={14} />
            <span className="font-semibold uppercase">{weather.city}</span>
            <span>{weather.temp}°C</span>
            <span className="text-[#6B6560]">{weather.description}</span>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-4 bg-white/20 shrink-0" />

        {/* Market Ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-6 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
            {[...prices, ...prices].map((p, i) => (
              <span key={i} className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold">{lang === 'tr' ? p.name : p.nameEn}</span>
                <span>{p.price.toFixed(2)} {p.unit}</span>
                <span className={`flex items-center ${p.change >= 0 ? 'text-[#2D6A4F]' : 'text-[#C1341B]'}`}>
                  {p.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

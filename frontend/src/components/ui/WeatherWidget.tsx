import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Wind } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';

interface WeatherWidgetProps {
  city?: string;
}

export default function WeatherWidget({ city = 'Ceyhan' }: WeatherWidgetProps) {
  const { t } = useTranslation();
  const { weather, loading, fetchWeather } = useWeather();

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  if (loading || !weather) {
    return (
      <div className="bg-gradient-to-br from-[#0077B6] to-[#023E8A] rounded-[2.5rem] p-6 text-white animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0077B6] to-[#023E8A] rounded-[2.5rem] p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">{t('weather.title')}</p>
          <p className="text-sm font-semibold mt-1">{weather.city}</p>
          <p className="text-4xl font-semibold tracking-tight mt-1">{weather.temp}°C</p>
          <p className="text-sm text-white/80 capitalize mt-1">{weather.description}</p>
        </div>
        {weather.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="w-20 h-20"
          />
        )}
      </div>
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-white/70" />
          <span className="text-xs">{t('weather.humidity')}: {weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind size={14} className="text-white/70" />
          <span className="text-xs">{t('weather.wind')}: {weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

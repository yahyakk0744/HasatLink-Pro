import axios from 'axios';
import FarmRegion from '../models/FarmRegion';
import FarmWeatherLog from '../models/FarmWeatherLog';
import FarmPlot from '../models/FarmPlot';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

const OW_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OW_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch OpenWeather API for each active FarmRegion,
 * save to FarmWeatherLog, detect frost/heat/drought risks,
 * send push notifications to affected plot owners.
 *
 * Runs every 30 minutes.
 */
export async function weatherSync(): Promise<void> {
  if (!OW_API_KEY) {
    console.warn('[WeatherSync] OPENWEATHER_API_KEY not set — skipping');
    return;
  }

  const regions = await FarmRegion.find({ is_active: true });

  for (const region of regions) {
    try {
      // Current weather
      const { data: current } = await axios.get(`${OW_BASE}/weather`, {
        params: {
          lat: region.coordinates.lat,
          lon: region.coordinates.lng,
          appid: OW_API_KEY,
          units: 'metric',
          lang: 'tr',
        },
      });

      // 3-day forecast (3-hour intervals, 24 entries = 3 days)
      const { data: forecast } = await axios.get(`${OW_BASE}/forecast`, {
        params: {
          lat: region.coordinates.lat,
          lon: region.coordinates.lng,
          appid: OW_API_KEY,
          units: 'metric',
          lang: 'tr',
          cnt: 24,
        },
      });

      const temp = current.main?.temp ?? 20;
      const humidity = current.main?.humidity ?? 50;
      const windSpeed = current.wind?.speed ?? 0;
      const rain = current.rain?.['3h'] ?? 0;

      // Risk assessment
      const frost_risk = temp < 2;
      const heat_risk = temp > 40;
      const drought_risk = humidity < 20 && rain === 0;
      const storm_risk = windSpeed > 16.7; // 60 km/h

      // Save weather log
      await FarmWeatherLog.create({
        region_id: region.region_id,
        temperature: temp,
        feels_like: current.main?.feels_like ?? temp,
        humidity,
        wind_speed: windSpeed,
        rain_mm: rain,
        description: current.weather?.[0]?.description || '',
        icon: current.weather?.[0]?.icon || '',
        frost_risk,
        heat_risk,
        drought_risk,
        storm_risk,
        forecast_3day: processForecast(forecast),
        fetched_at: new Date(),
      });

      // Send notifications if frost or heat risk detected
      if (frost_risk || heat_risk) {
        const plots = await FarmPlot.find({
          region_id: region.region_id,
          status: 'active',
        });

        for (const plot of plots) {
          const title = frost_risk
            ? 'Don Tehlikesi! Tarlani Koru!'
            : 'Asiri Sicak! Tarlani Koru!';
          const body = frost_risk
            ? `${region.region_name} bolgesinde sicaklik ${temp}°C. Don koruma aksiyonu al!`
            : `${region.region_name} bolgesinde sicaklik ${temp}°C. Sulama ve golgeleme yap!`;

          const notifDoc = await Notification.create({
            userId: plot.user_id,
            type: 'sistem',
            title,
            message: body,
            relatedId: plot.plot_id,
          });

          sendPushToUser(plot.user_id, { title, body, url: '/dijital-tarla' }, notifDoc).catch(() => {});
        }
      }

      // Drought risk notification (separate from frost/heat)
      if (drought_risk) {
        const plots = await FarmPlot.find({
          region_id: region.region_id,
          status: 'active',
        });

        for (const plot of plots) {
          const title = 'Kuraklik Uyarisi!';
          const body = `${region.region_name} bolgesinde nem %${humidity}. Sulama yapmayi unutma!`;

          const notifDoc = await Notification.create({
            userId: plot.user_id,
            type: 'sistem',
            title,
            message: body,
            relatedId: plot.plot_id,
          });

          sendPushToUser(plot.user_id, { title, body, url: '/dijital-tarla' }, notifDoc).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`[WeatherSync] ${region.region_id} hatasi:`, err);
    }
  }
}

/**
 * Aggregate 3-hour forecast entries into daily summaries (max 3 days).
 */
function processForecast(data: any): any[] {
  const daily: Record<string, any> = {};

  for (const item of data.list || []) {
    const date = item.dt_txt?.split(' ')[0];
    if (!date) continue;

    if (!daily[date]) {
      daily[date] = {
        date,
        temp_min: 100,
        temp_max: -100,
        rain_chance: 0,
        description: '',
      };
    }

    daily[date].temp_min = Math.min(daily[date].temp_min, item.main?.temp_min ?? 100);
    daily[date].temp_max = Math.max(daily[date].temp_max, item.main?.temp_max ?? -100);
    daily[date].rain_chance = Math.max(daily[date].rain_chance, (item.pop ?? 0) * 100);

    if (!daily[date].description) {
      daily[date].description = item.weather?.[0]?.description || '';
    }
  }

  return Object.values(daily).slice(0, 3);
}

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Notification from '../models/Notification';

const weatherCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const getWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat as string | undefined;
    const lon = req.query.lon as string | undefined;
    const city = (req.query.city as string) || 'Istanbul';
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      res.json({
        city,
        temp: 22,
        description: 'Açık',
        icon: '01d',
        humidity: 45,
        windSpeed: 12,
      });
      return;
    }

    // Build cache key and API URL based on lat/lon or city
    const cacheKey = lat && lon ? `${lat},${lon}` : city.toLowerCase();
    const cached = weatherCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      res.json(cached.data);
      return;
    }

    const url = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=tr`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},TR&appid=${apiKey}&units=metric&lang=tr`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      res.json({
        city,
        temp: 0,
        description: data.message || 'Bilinmiyor',
        icon: '01d',
        humidity: 0,
        windSpeed: 0,
      });
      return;
    }

    const weatherData = {
      city: data.name || city,
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
    };

    weatherCache[cacheKey] = { data: weatherData, timestamp: Date.now() };
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: 'Hava durumu hatası', error });
  }
};

export const checkWeatherAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ message: 'Yetkilendirme gerekli' }); return; }

    const user = await User.findOne({ userId });
    if (!user) { res.status(404).json({ message: 'Kullanıcı bulunamadı' }); return; }

    const city = user.location?.split(',')[0]?.trim() || 'Ceyhan';
    const apiKey = process.env.OPENWEATHER_API_KEY;

    let temp = 22;
    let windSpeed = 12;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city},TR&appid=${apiKey}&units=metric&lang=tr`
        );
        const data = await response.json();
        temp = Math.round(data.main.temp);
        windSpeed = Math.round(data.wind.speed * 3.6);
      } catch {}
    }

    const alerts: { title: string; message: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (temp <= 0) {
      alerts.push({ title: 'Don Uyarısı', message: `${city} bölgesinde sıcaklık ${temp}°C. Ürünlerinizi don tehlikesine karşı koruyun.` });
    }
    if (temp >= 40) {
      alerts.push({ title: 'Sıcak Hava Uyarısı', message: `${city} bölgesinde sıcaklık ${temp}°C. Sulama ve gölgeleme tedbirlerini artırın.` });
    }
    if (windSpeed > 50) {
      alerts.push({ title: 'Fırtına Uyarısı', message: `${city} bölgesinde rüzgar hızı ${windSpeed} km/h. Seraları ve hafif yapıları sabitleyin.` });
    }

    const createdAlerts = [];
    for (const alert of alerts) {
      // Check if same alert already exists today
      const existing = await Notification.findOne({
        userId, type: 'hava', title: alert.title,
        createdAt: { $gte: today },
      });
      if (!existing) {
        const notif = await Notification.create({
          userId, type: 'hava', title: alert.title, message: alert.message,
        });
        createdAlerts.push(notif);
      }
    }

    res.json({ alerts: createdAlerts, temp, windSpeed, city });
  } catch (error) {
    res.status(500).json({ message: 'Hava uyarı hatası', error });
  }
};
